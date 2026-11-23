import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/lib/models";
import StageSelect from "./StageSelect";

export const dynamic = "force-dynamic";

const pipelineStages = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["replied", "Replied"],
  ["meeting", "Meeting"],
  ["proposal_sent", "Proposal sent"],
  ["won", "Won"],
  ["lost", "Lost"],
] as const;

const pageSize = 50;

function formatDate(date: Date | undefined) {
  if (!date) return "No follow-up set";
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(date);
}

export default async function PipelinePage() {
  await connectToDatabase();

  const columns = await Promise.all(
    pipelineStages.map(async ([stage, label]) => {
      const [count, leads] = await Promise.all([
        Lead.countDocuments({ stage }),
        Lead.find({ stage })
          .select("name type area nextFollowUpAt")
          .sort({ reviews: -1, _id: -1 })
          .limit(pageSize)
          .lean(),
      ]);

      return {
        stage,
        label,
        count,
        leads: leads.map((lead) => ({
          id: lead._id.toString(),
          name: lead.name || "Unnamed lead",
          type: lead.type || "other",
          area: lead.area || "Area not set",
          nextFollowUpAt: formatDate(lead.nextFollowUpAt),
        })),
      };
    }),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">LeadFlow</Link>
          <nav aria-label="Main navigation" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {[["Leads", "/leads"], ["Pipeline", "/pipeline"], ["Templates", "/templates"], ["Dashboard", "/"], ["Services", "/services"], ["Analytics", "/analytics"]].map(([label, href]) => (
              <Link key={label} href={href} aria-current={label === "Pipeline" ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${label === "Pipeline" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-700">Sales workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Pipeline</h1>
            <p className="mt-2 text-sm text-slate-600">Move leads between stages from each card.</p>
          </div>
          <Link href="/leads" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">All leads</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {columns.map((column) => (
            <section key={column.stage} aria-labelledby={`stage-${column.stage}`} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <h2 id={`stage-${column.stage}`} className="font-semibold text-slate-900">{column.label}</h2>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{column.count}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {column.leads.length ? column.leads.map((lead) => (
                  <article key={lead.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <Link href={`/leads/${lead.id}`} className="font-semibold text-slate-950 hover:text-indigo-700">{lead.name}</Link>
                    <p className="mt-1 text-sm capitalize text-slate-500">{lead.type} · {lead.area}</p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Next follow-up</p>
                    <p className="mt-1 text-sm text-slate-700">{lead.nextFollowUpAt}</p>
                    <StageSelect leadId={lead.id} stage={column.stage} />
                  </article>
                )) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">No leads in this stage.</p>
                )}
              </div>
              {column.count > pageSize ? (
                <Link href={`/leads?stage=${column.stage}`} className="mt-3 rounded-lg px-3 py-2 text-center text-sm font-semibold text-indigo-700 hover:bg-white hover:text-indigo-900">
                  More leads ({column.count - pageSize} more) →
                </Link>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
