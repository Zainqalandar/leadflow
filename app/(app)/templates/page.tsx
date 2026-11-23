"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { renderTemplate } from "@/lib/templates";

type TemplateItem = {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
};

type ApiResult = {
  ok: boolean;
  error?: string;
  data?: { templates?: TemplateItem[]; template?: TemplateItem };
};

const previewLead = { ownerName: "Ayesha", name: "Spice Route Cafe" };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTemplates() {
      try {
        const response = await fetch("/api/templates");
        const result: ApiResult = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load templates.");
        if (active) setTemplates(result.data?.templates ?? []);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Unable to load templates.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTemplates();
    return () => { active = false; };
  }, []);

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, isActive: true }),
      });
      const result: ApiResult = await response.json();
      if (!response.ok || !result.ok || !result.data?.template) {
        throw new Error(result.error || "Unable to create template.");
      }
      setTemplates((items) => [result.data!.template!, ...items]);
      setTitle("");
      setBody("");
      setMessage("Template created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create template.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTemplate(template: TemplateItem) {
    setMessage("");
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: template.title, body: template.body, isActive: template.isActive }),
      });
      const result: ApiResult = await response.json();
      if (!response.ok || !result.ok || !result.data?.template) {
        throw new Error(result.error || "Unable to update template.");
      }
      setTemplates((items) => items.map((item) => item.id === template.id ? result.data!.template! : item));
      setMessage("Template updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update template.");
    }
  }

  async function deleteTemplate(template: TemplateItem) {
    if (!window.confirm(`Delete “${template.title}”?`)) return;
    setMessage("");
    try {
      const response = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
      const result: ApiResult = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to delete template.");
      setTemplates((items) => items.filter((item) => item.id !== template.id));
      setMessage("Template deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete template.");
    }
  }

  function changeTemplate(id: string, field: "title" | "body" | "isActive", value: string | boolean) {
    setTemplates((items) => items.map((template) =>
      template.id === id ? { ...template, [field]: value } : template,
    ));
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">LeadFlow</Link>
          <nav aria-label="Main navigation" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {[["Leads", "/leads"], ["Pipeline", "/pipeline"], ["Templates", "/templates"], ["Dashboard", "/"], ["Services", "/services"], ["Analytics", "/analytics"]].map(([label, href]) => (
              <Link key={label} href={href} aria-current={label === "Templates" ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${label === "Templates" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-medium text-indigo-700">Message library</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Templates</h1>
          <p className="mt-2 text-sm text-slate-600">Use <code className="rounded bg-slate-200 px-1 py-0.5">{`{naam}`}</code> for the owner and <code className="rounded bg-slate-200 px-1 py-0.5">{`{business}`}</code> for the business name.</p>
        </div>

        {message ? <p role="status" className="mb-4 rounded-lg bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</p> : null}

        <section className="mb-7 grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2 lg:p-6">
          <form onSubmit={createTemplate} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950">Create template</h2>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Title
              <input required minLength={1} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="First introduction" className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Message body
              <textarea required minLength={1} maxLength={5000} rows={6} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Assalam o alaikum {naam}, I wanted to reach out about {business}…" className="resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            </label>
            <button disabled={saving} type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? "Creating…" : "Create template"}</button>
          </form>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Live preview</h2>
            <p className="mt-1 text-sm text-slate-500">Sample owner: Ayesha · Sample business: Spice Route Cafe</p>
            <div className="mt-4 min-h-40 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {body ? renderTemplate(body, previewLead) : "Your rendered message will appear here."}
            </div>
          </div>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">Saved templates</h2>
          {!loading ? <span className="text-sm text-slate-500">{templates.length} total</span> : null}
        </div>
        {loading ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading templates…</p> : null}
        {!loading && templates.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No templates yet. Create your first message above.</p> : null}
        <div className="space-y-5">
          {templates.map((template) => (
            <article key={template.id} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2 lg:p-6">
              <div className="space-y-4">
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Title
                  <input value={template.title} maxLength={120} onChange={(event) => changeTemplate(template.id, "title", event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Message body
                  <textarea value={template.body} maxLength={5000} rows={5} onChange={(event) => changeTemplate(template.id, "body", event.target.value)} className="resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={template.isActive} onChange={(event) => changeTemplate(template.id, "isActive", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  Active (available on lead pages)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void updateTemplate(template)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Save changes</button>
                  <button type="button" onClick={() => void deleteTemplate(template)} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-800">Live preview</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${template.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{template.isActive ? "Active" : "Inactive"}</span>
                </div>
                <div className="mt-3 min-h-40 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {renderTemplate(template.body, previewLead) || "Message preview is empty."}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
