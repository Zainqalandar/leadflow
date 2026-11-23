import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/lib/models";
import {
  buildLeadMongoQuery,
  filtersToSearchParams,
  leadListQuerySchema,
  type LeadListFilters,
  type LeadListSearchParams,
} from "@/lib/leads-query";
import { LeadCsvTools } from "./LeadCsvTools";

const stages = ["new", "contacted", "replied", "meeting", "proposal_sent", "won", "lost"] as const;
const leadTypes = ["restaurant", "cafe", "bakery", "other"] as const;

const stageLabels: Record<(typeof stages)[number], string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  meeting: "Meeting",
  proposal_sent: "Proposal sent",
  won: "Won",
  lost: "Lost",
};

const stageColors: Record<(typeof stages)[number], string> = {
  new: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  replied: "bg-violet-100 text-violet-700",
  meeting: "bg-amber-100 text-amber-800",
  proposal_sent: "bg-indigo-100 text-indigo-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-rose-100 text-rose-700",
};

function leadsUrl(filters: LeadListFilters, page: number) {
  const params = filtersToSearchParams(filters);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/leads?${query}` : "/leads";
}

function displayText(value: string | undefined) {
  return value || "—";
}

function StageBadge({ stage }: { stage: string }) {
  const knownStage = stages.find((item) => item === stage) ?? "new";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stageColors[knownStage]}`}
    >
      {stageLabels[knownStage]}
    </span>
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: LeadListSearchParams;
}) {
  const parsedFilters = leadListQuerySchema.safeParse(searchParams ?? {});
  const filters: LeadListFilters = parsedFilters.success
    ? parsedFilters.data
    : { page: 1 };
  const pageSize = 25;
  const query = buildLeadMongoQuery(filters);

  await connectToDatabase();
  const total = await Lead.countDocuments(
    query as unknown as Parameters<typeof Lead.countDocuments>[0],
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const leads = await Lead.find(query as unknown as Parameters<typeof Lead.find>[0])
    .sort({ reviews: -1, _id: -1 })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize)
    .lean();
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">
            LeadFlow
          </Link>
          <nav aria-label="Main navigation" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {[
              ["Leads", "/leads"],
              ["Pipeline", "/pipeline"],
              ["Templates", "/templates"],
              ["Dashboard", "/"],
              ["Services", "/services"],
              ["Analytics", "/analytics"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                aria-current={label === "Leads" ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  label === "Leads"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-700">Lead management</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Leads</h1>
            <p className="mt-2 text-sm text-slate-600">Browse and filter your saved prospects.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-2 text-sm text-slate-500">
              {total.toLocaleString()} {total === 1 ? "lead" : "leads"}
            </p>
            <LeadCsvTools exportUrl={`/api/leads/export?${filtersToSearchParams(filters).toString()}`} />
          </div>
        </div>

        <form
          action="/leads"
          method="get"
          className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-7 lg:items-end"
        >
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Stage
            <select name="stage" defaultValue={filters.stage ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
              <option value="">All stages</option>
              {stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Type
            <select name="type" defaultValue={filters.type ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
              <option value="">All types</option>
              {leadTypes.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Area
            <input name="area" type="text" maxLength={100} defaultValue={filters.area ?? ""} placeholder="Search area" className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Min rating
            <select name="minRating" defaultValue={filters.minRating ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
              <option value="">Any rating</option>
              {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating}+ stars</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Search
            <input name="q" type="search" maxLength={120} defaultValue={filters.q ?? ""} placeholder="Name or address" className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
            <input name="hasPhone" type="checkbox" value="true" defaultChecked={Boolean(filters.hasPhone)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Has phone
          </label>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Apply filters
          </button>
        </form>

        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-slate-900">No leads found</h2>
            <p className="mt-2 text-sm text-slate-600">Try changing or clearing your filters.</p>
            <Link href="/leads" className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Clear filters</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {leads.map((lead) => (
                <Link key={lead._id.toString()} href={`/leads/${lead._id.toString()}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-950">{displayText(lead.name)}</h2>
                      <p className="mt-1 text-sm text-slate-500">{displayText(lead.type)} · {displayText(lead.area)}</p>
                    </div>
                    <StageBadge stage={lead.stage} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-slate-500">Phone</p><p className="mt-0.5 break-words text-slate-800">{displayText(lead.phone)}</p></div>
                    <div><p className="text-xs text-slate-500">Rating / reviews</p><p className="mt-0.5 text-slate-800">{lead.rating ?? "—"} ★ · {(lead.reviews ?? 0).toLocaleString()}</p></div>
                    <div><p className="text-xs text-slate-500">Audit score</p><p className="mt-0.5 text-slate-800">{lead.auditScore ?? "—"}</p></div>
                    <div className="flex items-end justify-end text-indigo-700">View lead <span aria-hidden="true" className="ml-1">→</span></div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 font-semibold">Name</th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">Type</th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">Area</th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">Phone</th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">Rating</th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">Reviews</th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">Stage</th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <tr key={lead._id.toString()} className="hover:bg-slate-50">
                        <td className="max-w-64 px-5 py-4"><Link href={`/leads/${lead._id.toString()}`} className="block truncate font-semibold text-indigo-700 hover:text-indigo-900">{displayText(lead.name)}</Link>{lead.address ? <p className="mt-1 truncate text-xs text-slate-500">{lead.address}</p> : null}</td>
                        <td className="whitespace-nowrap px-5 py-4 capitalize text-slate-700">{displayText(lead.type)}</td>
                        <td className="max-w-48 truncate px-5 py-4 text-slate-700">{displayText(lead.area)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">{displayText(lead.phone)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">{lead.rating ?? "—"}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">{(lead.reviews ?? 0).toLocaleString()}</td>
                        <td className="whitespace-nowrap px-5 py-4"><StageBadge stage={lead.stage} /></td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">{lead.auditScore ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>Showing {start}–{end} of {total.toLocaleString()} leads</p>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? <Link href={leadsUrl(filters, currentPage - 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">Previous</Link> : <span className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Previous</span>}
                <span className="px-2">Page {currentPage} of {totalPages}</span>
                {currentPage < totalPages ? <Link href={leadsUrl(filters, currentPage + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">Next</Link> : <span className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Next</span>}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
