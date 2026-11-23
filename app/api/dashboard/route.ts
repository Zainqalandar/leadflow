import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Activity, Lead } from "@/lib/models";

export const runtime = "nodejs";

const stages = [
  "new",
  "contacted",
  "replied",
  "meeting",
  "proposal_sent",
  "won",
  "lost",
] as const;

function getTodayWindow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  const start = new Date(`${date}T00:00:00+05:00`);
  return {
    start,
    end: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1),
    date,
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    const { start, end, date } = getTodayWindow();
    const dueFilter = {
      nextFollowUpAt: { $lte: end },
      stage: { $nin: ["won", "lost"] },
    };

    const [messagesSentToday, followUpsDueToday, followUpLeads, meetingLeads, stageCountsArray] =
      await Promise.all([
        Activity.countDocuments({
          type: "message_sent",
          createdAt: { $gte: start, $lte: end },
        }),
        Lead.countDocuments(dueFilter),
        Lead.find(dueFilter)
          .select("name stage area nextFollowUpAt")
          .sort({ nextFollowUpAt: 1 })
          .lean(),
        Lead.countDocuments({ stage: "meeting" }),
        Promise.all(stages.map(async (stage) => [stage, await Lead.countDocuments({ stage })] as const)),
      ]);

    const stageCounts = Object.fromEntries(stageCountsArray) as Record<(typeof stages)[number], number>;
    const followUps = followUpLeads.map((lead) => ({
      id: lead._id.toString(),
      name: lead.name || "Unnamed lead",
      stage: lead.stage,
      area: lead.area ?? "",
      nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      ok: true,
      data: {
        date,
        messagesSentToday,
        dailyTarget: 20,
        followUpsDueToday,
        followUps,
        meetingLeads,
        stageCounts,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load dashboard." }, { status: 500 });
  }
}
