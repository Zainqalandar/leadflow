"use client";

import Image from "next/image";
import { useState } from "react";
import { getWhatsAppUrl, type SampleWork, type ServicesConfig } from "@/lib/services-config";

export function CopyLinkButton({
  label,
  copiedLabel,
}: {
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={() => void copyLink()} className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
      {copied ? copiedLabel : label}
    </button>
  );
}

export function SampleWorkImage({
  sample,
  placeholder,
}: {
  sample: SampleWork;
  placeholder: string;
}) {
  const [missing, setMissing] = useState(false);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
      {missing ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 to-rose-100 p-5 text-center text-slate-600">
          <span aria-hidden="true" className="text-3xl">✦</span>
          <span className="text-xs font-medium">{placeholder}</span>
        </div>
      ) : (
        <Image
          src={sample.image}
          alt={sample.alt}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          onError={() => setMissing(true)}
        />
      )}
    </div>
  );
}

export function WhatsAppButton({ config }: { config: ServicesConfig }) {
  return (
    <a href={getWhatsAppUrl(config)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50">
      <span aria-hidden="true" className="mr-2">◉</span>
      {config.content.contactButton}
    </a>
  );
}
