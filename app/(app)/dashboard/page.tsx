"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const stages = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["replied", "Replied"],
  ["meeting", "Meeting"],
  ["proposal_sent", "Proposal sent"],
  ["won", "Won"],
  ["lost", "Lost"],
] as const;

type DashboardData = {
  date: string;
  messagesSentToday: number;
  dailyTarget: number;
  followUpsDueToday: number;
  followUps: {
    id: string;
    name: string;
    stage: string;
    area: string;
    nextFollowUpAt: string | null;
  }[];
  meetingLeads: number;
  stageCounts: Record<(typeof stages)[number][0], number>;
};

function formatDate(value: string | null) {
  if (!value) return "No follow-up date";
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        const result: { ok: boolean; data?: DashboardData; error?: string } = await response.json();
        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error || "Unable to load dashboard.");
        }
        if (active) setData(result.data);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard.");
      }
    }
    void loadDashboard();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">LeadFlow</Link>
          <nav aria-label="Main navigation" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {[["Leads", "/leads"], ["Pipeline", "/pipeline"], ["Templates", "/templates"], ["Dashboard", "/dashboard"], ["Services", "/services"], ["Analytics", "/analytics"]].map(([label, href]) => (
              <Link key={label} href={href} aria-current={label === "Dashboard" ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${label === "Dashboard" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-700">Daily overview</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500">{data ? `${data.date} · Asia/Karachi` : "Today · Asia/Karachi"}</p>
        </div>

        {error ? <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p> : null}
        {!data && !error ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading dashboard…</p> : null}

        {data ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-600">Messages sent today</h2>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{data.messagesSentToday}<span className="ml-2 text-lg font-medium text-slate-400">/ {data.dailyTarget}</span></p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Daily target</span>
              </div>
              <progress className="mt-5 h-3 w-full accent-indigo-600" aria-label="Daily messages target" max={data.dailyTarget} value={data.messagesSentToday} />
              <p className="mt-2 text-xs text-slate-500">{Math.max(0, data.dailyTarget - data.messagesSentToday)} messages to reach today’s target</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-600">Follow-ups due today</h2>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{data.followUpsDueToday}</p>
                </div>
                <Link href="/leads" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">View leads →</Link>
              </div>
              {data.followUps.length ? (
                <ul className="mt-5 max-h-72 divide-y divide-slate-100 overflow-y-auto">
                  {data.followUps.map((lead) => (
                    <li key={lead.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:text-indigo-700">{lead.name}</Link>
                        <time className="text-xs text-slate-500">{formatDate(lead.nextFollowUpAt)}</time>
                      </div>
                      <p className="mt-1 text-xs capitalize text-slate-500">{lead.stage.replaceAll("_", " ")}{lead.area ? ` · ${lead.area}` : ""}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-4 text-sm text-slate-500">No open follow-ups due by the end of today.</p>}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-semibold text-slate-600">Leads in meeting</h2>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{data.meetingLeads}</p>
              <Link href="/leads?stage=meeting" className="mt-4 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900">View meeting leads →</Link>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-semibold text-slate-600">Leads by stage</h2>
              <ul className="mt-4 divide-y divide-slate-100">
                {stages.map(([stage, label]) => (
                  <li key={stage} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <Link href={`/leads?stage=${stage}`} className="text-sm font-medium text-slate-700 hover:text-indigo-700">{label}</Link>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{data.stageCounts[stage]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
