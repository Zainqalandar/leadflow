import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Activity, Lead, Template } from "@/lib/models";
import { EditForm, NoteForm } from "./LeadForms";
import LeadMessage from "./LeadMessage";

const idSchema = z.string().regex(/^[a-f\d]{24}$/i);
function formatDate(date: Date | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(date);
}

function formatDateTimeLocal(date: Date | undefined) {
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const parsedId = idSchema.safeParse(params.id);
  if (!parsedId.success) notFound();

  await connectToDatabase();
  const lead = await Lead.findById(parsedId.data).lean();
  if (!lead) notFound();

  const activities = await Activity.find({ leadId: lead._id })
    .sort({ createdAt: -1 })
    .lean();
  const templates = await Template.find({ isActive: true })
    .select("title body")
    .sort({ updatedAt: -1 })
    .lean();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/leads" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">
            ← Back to leads
          </Link>
          <span className="text-lg font-bold tracking-tight text-slate-950">LeadFlow</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-700">Lead details</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              {lead.name || "Unnamed lead"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {[lead.type, lead.area].filter(Boolean).join(" · ") || "Business prospect"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-950">Business information</h2>
              <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Info label="Address" value={lead.address} />
                <Info label="Phone" value={lead.phone} />
                <Info label="Website" value={lead.website} href={lead.website} />
                <Info label="Instagram" value={lead.instagram} href={lead.instagram} />
                <Info label="Rating" value={lead.rating === null || lead.rating === undefined ? undefined : `${lead.rating} / 5`} />
                <Info label="Reviews" value={lead.reviews?.toLocaleString()} />
                <Info label="Stage" value={lead.stage.replaceAll("_", " ")} />
                <Info label="Owner" value={lead.ownerName} />
                <Info label="Maps" value={lead.mapsUrl ? "Open in Google Maps" : undefined} href={lead.mapsUrl} />
                <Info label="Last contacted" value={formatDate(lead.lastContactedAt)} />
                <Info label="Next follow-up" value={formatDate(lead.nextFollowUpAt)} />
              </dl>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {lead.notes || "No notes yet."}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Activity</h2>
                  <p className="mt-1 text-sm text-slate-500">Notes and changes, newest first.</p>
                </div>
              </div>
              <NoteForm leadId={lead._id.toString()} />
              <ol className="mt-6 space-y-5 border-l border-slate-200 pl-5">
                {activities.length ? activities.map((activity) => (
                  <li key={activity._id.toString()} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-500 ring-1 ring-indigo-200" />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-sm font-semibold capitalize text-slate-800">
                        {activity.type.replaceAll("_", " ")}
                      </p>
                      <time className="text-xs text-slate-500" dateTime={activity.createdAt.toISOString()}>
                        {formatDate(activity.createdAt)}
                      </time>
                    </div>
                    {activity.body ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{activity.body}</p> : null}
                  </li>
                )) : <li className="text-sm text-slate-500">No activity recorded yet.</li>}
              </ol>
            </section>
          </div>

          <aside className="space-y-6">
            <LeadMessage
              leadId={lead._id.toString()}
              whatsapp={lead.whatsapp ?? ""}
              ownerName={lead.ownerName}
              businessName={lead.name}
              templates={templates.map((template) => ({
                id: template._id.toString(),
                title: template.title ?? "Untitled template",
                body: template.body ?? "",
              }))}
            />
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-950">Edit lead</h2>
              <p className="mt-1 text-sm text-slate-500">Update ownership, follow-up, notes, or sales stage.</p>
              <EditForm
                leadId={lead._id.toString()}
                initialStage={lead.stage}
                initialOwnerName={lead.ownerName ?? ""}
                initialNotes={lead.notes ?? ""}
                initialNextFollowUpAt={formatDateTimeLocal(lead.nextFollowUpAt)}
              />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
  href,
}: {
  label: string;
  value?: string;
  href?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800">
        {href && value ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-indigo-700 underline decoration-indigo-200 underline-offset-2 hover:text-indigo-900">
            {value}
          </a>
        ) : value || "—"}
      </dd>
    </div>
  );
}
