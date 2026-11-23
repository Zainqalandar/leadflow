import { Activity, Lead } from "@/lib/models";

const stages = [
  "new",
  "contacted",
  "replied",
  "meeting",
  "proposal_sent",
  "won",
  "lost",
] as const;

const stagesAtOrAfterContact = [
  "contacted",
  "replied",
  "meeting",
  "proposal_sent",
  "won",
  "lost",
];
const stagesAtOrAfterReply = ["replied", "meeting", "proposal_sent", "won", "lost"];

export type AnalyticsStageCount = { stage: (typeof stages)[number]; count: number };
export type AnalyticsDailyMessages = { date: string; count: number };
export type AnalyticsBreakdown = {
  name: string;
  total: number;
  contacted: number;
  replied: number;
  meeting: number;
  won: number;
};
type AggregatedBreakdown = Omit<AnalyticsBreakdown, "name"> & { _id: unknown };
export type LeadAnalytics = {
  dailyMessages: AnalyticsDailyMessages[];
  stageCounts: AnalyticsStageCount[];
  replyRate: number;
  areas: AnalyticsBreakdown[];
  types: AnalyticsBreakdown[];
};

function karachiDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateKeysForLast14Days(now: Date) {
  const todayKey = karachiDateKey(now);
  const [year, month, day] = todayKey.split("-").map(Number);
  const todayUtc = new Date(Date.UTC(year, month - 1, day));
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(todayUtc);
    date.setUTCDate(todayUtc.getUTCDate() - (13 - index));
    return date.toISOString().slice(0, 10);
  });
}

function karachiMidnight(dateKey: string) {
  // Karachi is UTC+05:00; this converts its local midnight to a UTC instant.
  return new Date(`${dateKey}T00:00:00+05:00`);
}

function breakdownPipeline(groupBy: "area" | "type") {
  return [
    {
      $group: {
        _id: { $ifNull: [`$${groupBy}`, "Unknown"] },
        total: { $sum: 1 },
        contacted: { $sum: { $cond: [{ $eq: ["$stage", "contacted"] }, 1, 0] } },
        replied: { $sum: { $cond: [{ $eq: ["$stage", "replied"] }, 1, 0] } },
        meeting: { $sum: { $cond: [{ $eq: ["$stage", "meeting"] }, 1, 0] } },
        won: { $sum: { $cond: [{ $eq: ["$stage", "won"] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 as const, _id: 1 as const } },
  ];
}

export async function getLeadAnalytics(now = new Date()): Promise<LeadAnalytics> {
  const dateKeys = dateKeysForLast14Days(now);
  const startDate = karachiMidnight(dateKeys[0]);

  const [dailyResults, stageResults, replyResults, areaResults, typeResults] =
    await Promise.all([
      Activity.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            type: "message_sent",
            createdAt: { $gte: startDate, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Karachi",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Lead.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$stage", count: { $sum: 1 } } },
      ]),
      Lead.aggregate<{ _id: null; contactedOrLater: number; repliedOrLater: number }>([
        {
          $group: {
            _id: null,
            contactedOrLater: {
              $sum: { $cond: [{ $in: ["$stage", stagesAtOrAfterContact] }, 1, 0] },
            },
            repliedOrLater: {
              $sum: { $cond: [{ $in: ["$stage", stagesAtOrAfterReply] }, 1, 0] },
            },
          },
        },
      ]),
      Lead.aggregate<AggregatedBreakdown>(breakdownPipeline("area")),
      Lead.aggregate<AggregatedBreakdown>(breakdownPipeline("type")),
    ]);

  const dailyCounts = new Map(dailyResults.map(({ _id, count }) => [_id, count]));
  const stageCountMap = new Map(stageResults.map(({ _id, count }) => [_id, count]));
  const contactedOrLater = replyResults[0]?.contactedOrLater ?? 0;
  const repliedOrLater = replyResults[0]?.repliedOrLater ?? 0;

  return {
    dailyMessages: dateKeys.map((date) => ({ date, count: dailyCounts.get(date) ?? 0 })),
    stageCounts: stages.map((stage) => ({ stage, count: stageCountMap.get(stage) ?? 0 })),
    replyRate: contactedOrLater === 0 ? 0 : (repliedOrLater / contactedOrLater) * 100,
    areas: areaResults.map(({ _id, ...row }) => ({ name: String(_id), ...row })),
    types: typeResults.map(({ _id, ...row }) => ({ name: String(_id), ...row })),
  };
}
