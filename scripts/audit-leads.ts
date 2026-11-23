// Audit score (0–10, higher means more need): +3 no website, +2 no Instagram, +2 no logo,
// +1 no menu, +1 no WhatsApp link, and +1 for rating >= 4 with at least 50 reviews.
import { loadEnvConfig } from "@next/env";
import { load } from "cheerio";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/lib/models";

loadEnvConfig(process.cwd());

const concurrency = 3;
const timeoutMs = 8_000;
const userAgent = "LeadFlowLeadAudit/1.0 (+local website audit)";
const ignoredInstagramPaths = new Set([
  "p",
  "reel",
  "reels",
  "explore",
  "sharer",
  "stories",
]);

type AuditLead = {
  _id: mongoose.Types.ObjectId;
  placeId: string;
  name?: string;
  website?: string;
  instagram?: string;
  rating?: number | null;
  reviews?: number;
  auditScore?: number | null;
};

type Signals = {
  instagram: string | null;
  hasLogo: boolean;
  hasMenu: boolean;
  hasWhatsApp: boolean;
};

function websiteUrl(value: string): URL | null {
  try {
    const parsed = new URL(value.match(/^https?:\/\//i) ? value : `https://${value}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function findInstagramHandle(href: string, pageUrl: URL): string | null {
  try {
    const url = new URL(href, pageUrl);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "instagram.com" && hostname !== "www.instagram.com") return null;

    const path = url.pathname.split("/").filter(Boolean);
    if (path.length === 0) return null;
    const handle = decodeURIComponent(path[0]);
    if (ignoredInstagramPaths.has(handle.toLowerCase())) return null;
    if (!/^[a-z\d._]{1,30}$/i.test(handle)) return null;
    return `@${handle}`;
  } catch {
    return null;
  }
}

function isWhatsAppLink(href: string, pageUrl: URL): boolean {
  try {
    const hostname = new URL(href, pageUrl).hostname.toLowerCase();
    return hostname === "wa.me" || hostname === "api.whatsapp.com";
  } catch {
    return false;
  }
}

function inspectHtml(html: string, pageUrl: URL): Signals {
  const $ = load(html);
  let instagram: string | null = null;
  let hasWhatsApp = false;

  for (const element of $("a[href]").toArray()) {
    const href = $(element).attr("href");
    if (!href) continue;
    instagram ??= findInstagramHandle(href, pageUrl);
    if (isWhatsAppLink(href, pageUrl)) hasWhatsApp = true;
  }

  const hasLogo = $("img").toArray().some((element) => {
    const image = $(element);
    return [image.attr("src"), image.attr("alt"), image.attr("class")]
      .some((value) => value?.toLowerCase().includes("logo") ?? false);
  });

  const hasMenu = $("a").toArray().some((element) => {
    const anchor = $(element);
    return [anchor.attr("href"), anchor.text()]
      .some((value) => value?.toLowerCase().includes("menu") ?? false);
  });

  return { instagram, hasLogo, hasMenu, hasWhatsApp };
}

function calculateAuditScore(lead: AuditLead, signals: Signals): number {
  const hasInstagram = Boolean(signals.instagram || lead.instagram?.trim());
  let score = 0;
  if (!lead.website) score += 3;
  if (!hasInstagram) score += 2;
  if (!signals.hasLogo) score += 2;
  if (!signals.hasMenu) score += 1;
  if (!signals.hasWhatsApp) score += 1;
  if ((lead.rating ?? 0) >= 4 && (lead.reviews ?? 0) >= 50) score += 1;
  return Math.min(10, score);
}

async function fetchSignals(rawWebsite: string): Promise<Signals> {
  const url = websiteUrl(rawWebsite);
  if (!url) throw new Error("Invalid website URL");

  const response = await fetch(url, {
    headers: { "User-Agent": userAgent },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Website returned HTTP ${response.status}`);
  return inspectHtml(await response.text(), url);
}

async function auditLead(lead: AuditLead): Promise<"updated" | "unchanged" | "skipped"> {
  let signals: Signals = {
    instagram: null,
    hasLogo: false,
    hasMenu: false,
    hasWhatsApp: false,
  };

  if (lead.website) {
    try {
      signals = await fetchSignals(lead.website);
    } catch {
      return "skipped";
    }
  }

  const auditScore = calculateAuditScore(lead, signals);
  const changedFields: Record<string, string | number> = {};
  if (signals.instagram && signals.instagram !== lead.instagram) {
    changedFields.instagram = signals.instagram;
  }
  if (auditScore !== lead.auditScore) changedFields.auditScore = auditScore;

  if (Object.keys(changedFields).length === 0) return "unchanged";
  await Lead.updateOne({ _id: lead._id }, { $set: changedFields });
  return "updated";
}

async function runAudit() {
  let connected = false;
  try {
    await connectToDatabase();
    connected = true;
    const leads = await Lead.find()
      .select("placeId name website instagram rating reviews auditScore")
      .lean<AuditLead[]>();

    let nextIndex = 0;
    let updated = 0;
    let unchanged = 0;
    let skipped = 0;

    const worker = async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= leads.length) return;
        try {
          const result = await auditLead(leads[index]);
          if (result === "updated") updated += 1;
          else if (result === "unchanged") unchanged += 1;
          else skipped += 1;
        } catch {
          skipped += 1;
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(concurrency, leads.length) }, () => worker()),
    );

    console.log(
      `Lead audit finished: ${leads.length} checked, ${updated} updated, ${unchanged} unchanged, ${skipped} skipped.`,
    );
  } catch {
    console.error("Lead audit failed. Verify MONGODB_URI and database access.");
    process.exitCode = 1;
  } finally {
    if (connected) await mongoose.disconnect();
  }
}

void runAudit();
