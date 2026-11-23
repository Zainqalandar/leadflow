import Link from "next/link";
import { getWhatsAppUrl, servicesConfig } from "@/lib/services-config";
import { CopyLinkButton, SampleWorkImage, WhatsAppButton } from "./ServicesInteractions";

export const metadata = {
  title: `${servicesConfig.businessName} | Food brand design`,
  description: servicesConfig.tagline,
};

export default function ServicesPage() {
  const { content, services, packages, sampleWorks } = servicesConfig;

  return (
    <main className="min-h-screen bg-[#fffaf5] text-slate-900">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/services" className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
            {servicesConfig.businessName}
          </Link>
          <a href="#services" className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">{content.exploreServices}</a>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white">
        <div aria-hidden="true" className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-36">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-300">{content.heroEyebrow}</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
              {servicesConfig.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">{content.heroDescription}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <WhatsAppButton config={servicesConfig} />
              <CopyLinkButton label={content.copyLinkButton} copiedLabel={content.copiedMessage} />
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div aria-hidden="true" className="absolute -inset-4 rotate-3 rounded-[2rem] bg-gradient-to-br from-orange-300/30 to-rose-400/20 blur-sm" />
            <div className="relative rounded-[1.75rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-200">{content.brandSnapshot}</p>
                  <p className="mt-1 text-xl font-bold">{servicesConfig.businessName}</p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-300 text-2xl font-black text-slate-950">{servicesConfig.businessName.trim().charAt(0)}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {services.slice(0, 4).map((service, index) => (
                  <div key={service.title} className={`rounded-2xl p-4 ${index % 2 === 0 ? "bg-orange-200 text-slate-900" : "bg-rose-200 text-slate-900"}`}>
                    <span className="text-xl" aria-hidden="true">{["✦", "▤", "◉", "⌖"][index]}</span>
                    <p className="mt-5 text-sm font-bold leading-5">{service.title}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-300">{content.heroDescription}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-700">{content.servicesEyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{content.servicesHeading}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{content.servicesDescription}</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article key={service.title} className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-xl font-bold text-rose-700 transition group-hover:bg-orange-100">{["✦", "▤", "◉", "⌖", "◌", "▧"][index]}</div>
              <h3 className="mt-5 text-lg font-bold text-slate-950">{service.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-700">{content.worksEyebrow}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{content.worksHeading}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{content.worksDescription}</p>
            </div>
            <CopyLinkButton label={content.copyLinkButton} copiedLabel={content.copiedMessage} />
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sampleWorks.map((sample) => (
              <article key={sample.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SampleWorkImage sample={sample} placeholder={content.samplePlaceholder} />
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-700">{sample.category}</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-950">{sample.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-700">{content.packagesEyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{content.packagesHeading}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{content.packagesDescription}</p>
        </div>
        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
          {packages.map((servicePackage, index) => (
            <article key={servicePackage.name} className={`flex flex-col rounded-2xl border p-6 shadow-sm sm:p-7 ${index === 1 ? "border-rose-300 bg-slate-950 text-white shadow-xl lg:-translate-y-3" : "border-orange-100 bg-white text-slate-900"}`}>
              <p className={`text-sm font-bold uppercase tracking-widest ${index === 1 ? "text-orange-300" : "text-rose-700"}`}>{servicePackage.name}</p>
              <p className="mt-4 text-3xl font-black tracking-tight">{servicePackage.price}</p>
              <p className={`mt-3 min-h-12 text-sm leading-6 ${index === 1 ? "text-slate-300" : "text-slate-600"}`}>{servicePackage.description}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {servicePackage.inclusions.map((inclusion) => (
                  <li key={inclusion} className={`flex gap-2 text-sm ${index === 1 ? "text-slate-200" : "text-slate-700"}`}><span className="font-bold text-emerald-500">✓</span>{inclusion}</li>
                ))}
              </ul>
              <a href={getWhatsAppUrl(servicesConfig)} target="_blank" rel="noreferrer" className={`mt-8 rounded-xl px-4 py-3 text-center text-sm font-bold ${index === 1 ? "bg-orange-300 text-slate-950 hover:bg-orange-200" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
                {content.packageButton}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-emerald-800 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center lg:py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{content.contactHeading}</h2>
            <p className="mt-3 text-base leading-7 text-emerald-100">{content.contactDescription}</p>
          </div>
          <WhatsAppButton config={servicesConfig} />
        </div>
      </section>

      <footer className="bg-slate-950 px-5 py-6 text-center text-sm text-slate-400 sm:px-8">
        © {new Date().getFullYear()} {servicesConfig.businessName}. {content.footerLine}
      </footer>
    </main>
  );
}
