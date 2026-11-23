import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { getLeadAnalytics, type AnalyticsBreakdown } from "@/lib/analytics";
import { MessagesLineChart, StageBarChart } from "./AnalyticsCharts";

export const dynamic = "force-dynamic";

function BreakdownTable({ title, rows }: { title: string; rows: AnalyticsBreakdown[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-950">By {title}</h2>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold sm:px-6">{title}</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Contacted</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Replied</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Meeting</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold sm:px-6">Won</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.name}>
                  <th scope="row" className="whitespace-nowrap px-5 py-3 font-medium capitalize text-slate-800 sm:px-6">{row.name}</th>
                  <td className="px-4 py-3 text-right text-slate-700">{row.total}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.contacted}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.replied}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.meeting}</td>
                  <td className="px-5 py-3 text-right text-slate-700 sm:px-6">{row.won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-6 py-8 text-sm text-slate-500">No leads to report yet.</p>}
    </section>
  );
}

export default async function AnalyticsPage() {
  await connectToDatabase();
  const analytics = await getLeadAnalytics();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">LeadFlow</Link>
          <nav aria-label="Main navigation" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {[["Leads", "/leads"], ["Pipeline", "/pipeline"], ["Templates", "/templates"], ["Dashboard", "/dashboard"], ["Services", "/services"], ["Analytics", "/analytics"]].map(([label, href]) => (
              <Link key={label} href={href} aria-current={label === "Analytics" ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${label === "Analytics" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-medium text-indigo-700">Lead performance</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Analytics</h1>
          <p className="mt-2 text-sm text-slate-600">Activity dates use Asia/Karachi. Stage counts show each lead’s current stage.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">Messages sent</h2>
              <p className="mt-1 text-sm text-slate-500">Per day · last 14 days · Asia/Karachi</p>
            </div>
            <MessagesLineChart data={analytics.dailyMessages} />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">Lead pipeline</h2>
              <p className="mt-1 text-sm text-slate-500">Current lead count per stage</p>
            </div>
            <StageBarChart data={analytics.stageCounts} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <p className="text-sm font-medium text-slate-600">Reply rate</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{analytics.replyRate.toFixed(1)}%</p>
            <p className="mt-1 text-sm text-slate-500">Leads at replied or later ÷ leads at contacted or later.</p>
          </section>

          <div className="grid gap-5 lg:col-span-2 lg:grid-cols-2">
            <BreakdownTable title="area" rows={analytics.areas} />
            <BreakdownTable title="type" rows={analytics.types} />
          </div>
        </div>
      </div>
    </main>
  );
}
