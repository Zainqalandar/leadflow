"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renderTemplate } from "@/lib/templates";

const defaultMessage =
  "Assalamu alaikum {naam}! I wanted to get in touch about {business}.";

type MessageTemplate = { id: string; title: string; body: string };

export default function LeadMessage({
  leadId,
  whatsapp,
  ownerName,
  businessName,
  templates,
}: {
  leadId: string;
  whatsapp: string;
  ownerName?: string | null;
  businessName?: string | null;
  templates: MessageTemplate[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("default");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const selectedTemplate = templates.find((template) => template.id === selectedId);
  const message = renderTemplate(selectedTemplate?.body ?? defaultMessage, {
    ownerName,
    name: businessName,
  });
  const phoneDigits = whatsapp.replace(/\D/g, "");

  async function openWhatsApp() {
    if (!phoneDigits || sending) return;

    const whatsappUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    // We log the click because wa.me cannot confirm that the message was sent.
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    setSending(true);
    setStatus("");
    try {
      const response = await fetch(`/api/leads/${leadId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "message_sent", body: message }),
      });
      const result: { ok: boolean; error?: string } = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Activity could not be logged.");
      }
      setStatus("WhatsApp opened; click logged in the timeline.");
      router.refresh();
    } catch {
      setStatus("WhatsApp opened, but the click could not be logged.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-950">WhatsApp message</h2>
      <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">
        Choose a template
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
          <option value="default">Default message</option>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
        </select>
      </label>
      <div className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        {message}
      </div>
      {phoneDigits ? (
        <button type="button" onClick={() => void openWhatsApp()} disabled={sending} className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
          {sending ? "Opening WhatsApp…" : "WhatsApp kholo"}
        </button>
      ) : <p className="mt-4 text-sm text-slate-500">No WhatsApp number is available for this lead.</p>}
      <p className="mt-3 text-xs leading-5 text-slate-500">The click is recorded in the timeline. WhatsApp does not confirm message delivery.</p>
      {status ? <p role="status" className="mt-2 text-sm text-slate-700">{status}</p> : null}
    </section>
  );
}
