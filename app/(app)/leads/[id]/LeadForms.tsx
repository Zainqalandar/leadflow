"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const stages = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["replied", "Replied"],
  ["meeting", "Meeting"],
  ["proposal_sent", "Proposal sent"],
  ["won", "Won"],
  ["lost", "Lost"],
] as const;

type FormMessage = { kind: "success" | "error"; text: string } | null;

function useLeadActions() {
  const router = useRouter();
  const [message, setMessage] = useState<FormMessage>(null);
  return { router, message, setMessage };
}

export function EditForm({
    leadId,
    initialStage,
    initialOwnerName,
    initialNotes,
    initialNextFollowUpAt,
  }: {
    leadId: string;
    initialStage: string;
    initialOwnerName: string;
    initialNotes: string;
    initialNextFollowUpAt: string;
}) {
    const { router, message, setMessage } = useLeadActions();
    const [saving, setSaving] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setSaving(true);
      setMessage(null);
      const formData = new FormData(event.currentTarget);
      const followUpValue = String(formData.get("nextFollowUpAt") ?? "");

      try {
        const response = await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: formData.get("stage"),
            ownerName: formData.get("ownerName"),
            notes: formData.get("notes"),
            nextFollowUpAt: followUpValue
              ? new Date(`${followUpValue}:00+05:00`).toISOString()
              : null,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Unable to save lead.");
        }
        setMessage({ kind: "success", text: "Lead updated." });
        router.refresh();
      } catch (error) {
        setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to save lead." });
      } finally {
        setSaving(false);
      }
    }

    return (
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Stage
          <select name="stage" defaultValue={initialStage} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
            {stages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Owner name
          <input name="ownerName" maxLength={120} defaultValue={initialOwnerName} className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Next follow-up
          <input name="nextFollowUpAt" type="datetime-local" defaultValue={initialNextFollowUpAt} className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          <span className="text-xs font-normal text-slate-500">Times are saved in Asia/Karachi.</span>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Notes
          <textarea name="notes" rows={5} maxLength={5000} defaultValue={initialNotes} className="resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <FormStatus message={message} />
        <button type="submit" disabled={saving} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    );
}

export function NoteForm({ leadId }: { leadId: string }) {
    const { router, message, setMessage } = useLeadActions();
    const [saving, setSaving] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setSaving(true);
      setMessage(null);
      const form = event.currentTarget;
      const body = String(new FormData(form).get("body") ?? "");

      try {
        const response = await fetch(`/api/leads/${leadId}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "note", body }),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Unable to add note.");
        }
        form.reset();
        setMessage({ kind: "success", text: "Note added." });
        router.refresh();
      } catch (error) {
        setMessage({ kind: "error", text: error instanceof Error ? error.message : "Unable to add note." });
      } finally {
        setSaving(false);
      }
    }

    return (
      <form onSubmit={submit} className="mt-5 rounded-xl bg-slate-50 p-4">
        <label htmlFor="activity-note" className="block text-sm font-medium text-slate-700">Add a note</label>
        <textarea id="activity-note" name="body" required minLength={1} maxLength={2000} rows={3} placeholder="Write an update…" className="mt-2 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <FormStatus message={message} />
          <button type="submit" disabled={saving} className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
            {saving ? "Adding…" : "Add note"}
          </button>
        </div>
      </form>
    );
}

function FormStatus({ message }: { message: FormMessage }) {
  if (!message) return null;
  return (
    <p role="status" className={`text-sm ${message.kind === "success" ? "text-emerald-700" : "text-rose-700"}`}>
      {message.text}
    </p>
  );
}
