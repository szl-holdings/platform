import { Link } from "wouter";
import { ShieldCheck, Lock, FileCheck2, ArrowRight, Eye, Database } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const pillars = [
  {
    icon: Lock,
    title: "Access discipline",
    body: "Private routes, role-aware access, and permission boundaries should be enforced consistently across the platform. This page should never overclaim certifications that do not yet exist.",
  },
  {
    icon: Database,
    title: "Traceable workflows",
    body: "Lyte + Alloy is designed to connect signal, action, and follow-through with an accountable record instead of disconnected status updates.",
  },
  {
    icon: Eye,
    title: "Clear environment labeling",
    body: "All screenshots, demos, and dashboards should be clearly labeled as demo, pilot, or live so buyers and capital partners understand exactly what they are seeing.",
  },
  {
    icon: FileCheck2,
    title: "Operational readiness",
    body: "Public trust starts with basics: real forms, clear validation, reliable contact routing, and truthful product-state communication.",
  },
];

export default function TrustPage() {
  usePageMeta({
    title: "Trust & Security \u2014 SZL Holdings",
    description:
      "Trust, control, and execution accountability for Lyte + Alloy.",
    canonical: "https://szlholdings.com/trust",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trust & Security
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Trust is part of the product, not a slide at the end.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              SZL is building Lyte + Alloy for serious operating environments. That means access,
              workflow accountability, auditability, and truthful product-state communication all
              matter. This page should reflect what exists now, what is being hardened, and how the
              platform is being prepared for customer and capital diligence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Start a diligence conversation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/investor-relations"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
              >
                Investor relations
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                  >
                    <div className="mb-4 inline-flex rounded-2xl border border-[#4a90b8]/20 bg-[#4a90b8]/10 p-3 text-[#4a90b8]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">{pillar.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-white/72">{pillar.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="rounded-3xl border border-[#d4a054]/20 bg-[#d4a054]/10 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
                Current posture
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    What to say now
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/78">
                    Emphasize execution accountability, route-level discipline, environment labeling,
                    and transparent product maturity.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    What not to say yet
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/78">
                    Do not claim certifications, compliance status, or control frameworks that have
                    not been formally achieved and documented.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
