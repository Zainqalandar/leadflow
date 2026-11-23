"use client";

import { useState } from "react";
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

export default function StageSelect({
  leadId,
  stage,
}: {
  leadId: string;
  stage: (typeof stages)[number][0];
}) {
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState(stage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function changeStage(nextStage: (typeof stages)[number][0]) {
    if (nextStage === selectedStage || saving) return;
    const previousStage = selectedStage;
    setSelectedStage(nextStage);
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const result: { ok: boolean; error?: string } = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to change lead stage.");
      }
      router.refresh();
    } catch (requestError) {
      setSelectedStage(previousStage);
      setError(requestError instanceof Error ? requestError.message : "Unable to change lead stage.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <label className="grid gap-1.5 text-xs font-medium text-slate-600">
        Move to stage
        <select value={selectedStage} disabled={saving} onChange={(event) => void changeStage(event.target.value as (typeof stages)[number][0])} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60">
          {stages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      {saving ? <p className="mt-2 text-xs text-slate-500">Saving stage…</p> : null}
      {error ? <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
