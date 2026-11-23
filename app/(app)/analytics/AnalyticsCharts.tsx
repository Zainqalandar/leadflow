"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsDailyMessages, AnalyticsStageCount } from "@/lib/analytics";

const stageLabels: Record<AnalyticsStageCount["stage"], string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  meeting: "Meeting",
  proposal_sent: "Proposal",
  won: "Won",
  lost: "Lost",
};

export function MessagesLineChart({ data }: { data: AnalyticsDailyMessages[] }) {
  return (
    <div className="h-72 w-full" aria-label="Messages sent per day for the last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value: string) => value.slice(5)} />
          <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip labelFormatter={(value) => `Date: ${value}`} />
          <Line type="monotone" dataKey="count" name="Messages" stroke="#4f46e5" strokeWidth={3} dot={{ fill: "#4f46e5", r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StageBarChart({ data }: { data: AnalyticsStageCount[] }) {
  const chartData = data.map((item) => ({ ...item, label: stageLabels[item.stage] }));
  return (
    <div className="h-72 w-full" aria-label="Lead count per pipeline stage">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" name="Leads" fill="#4f46e5" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
