import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { Lead } from "@/lib/models";

export const runtime = "nodejs";

const authorizationSchema = z.string().regex(/^Bearer \S+$/i);

function getEndOfTodayInKarachi() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  const start = new Date(`${date}T00:00:00+05:00`);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function hasValidBearer(request: Request, secret: string) {
  const parsedAuthorization = authorizationSchema.safeParse(
    request.headers.get("authorization"),
  );
  if (!parsedAuthorization.success) return false;

  const provided = Buffer.from(parsedAuthorization.data.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Cron authentication is not configured." }, { status: 503 });
  }
  if (!hasValidBearer(request, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const followUpsDueToday = await Lead.countDocuments({
      nextFollowUpAt: { $lte: getEndOfTodayInKarachi() },
      stage: { $nin: ["won", "lost"] },
    });
    return NextResponse.json({ ok: true, data: { followUpsDueToday } });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to count follow-ups." }, { status: 500 });
  }
}
