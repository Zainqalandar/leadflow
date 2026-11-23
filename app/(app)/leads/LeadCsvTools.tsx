"use client";

import { useState, type FormEvent } from "react";

type ImportResult = { imported: number; skipped: number; errors: string[] };

export function LeadCsvTools({ exportUrl }: { exportUrl: string }) {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");

  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsImporting(true);
    try {
      const form = event.currentTarget;
      const response = await fetch("/api/leads/import", {
        method: "POST",
        body: new FormData(form),
      });
      const result: { ok: boolean; data?: ImportResult; error?: string } = await response.json();
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "Could not import this CSV file.");
      }
      const { imported, skipped, errors } = result.data;
      setMessage(`Imported ${imported}; skipped ${skipped}; errors ${errors.length}.`);
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not import this CSV file.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <a href={exportUrl} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
        Export CSV
      </a>
      <form onSubmit={importCsv} className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Import CSV
          <input name="file" type="file" accept=".csv,text/csv" required className="block w-56 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700" />
        </label>
        <button type="submit" disabled={isImporting} className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
          {isImporting ? "Importing…" : "Import CSV"}
        </button>
      </form>
      {message ? <p role="status" className="w-full text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
