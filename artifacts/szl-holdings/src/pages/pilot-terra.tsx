import { Link } from "wouter";
import { Building2, ArrowRight, FileText, Activity, Shield, MapPin, TrendingUp, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const workflowSteps = [
  { icon: FileText, label: "Property docs arrive", detail: "Deed, tax records, environmental reports, and local context ingested" },
  { icon: MapPin, label: "Property Twin updates", detail: "Twin auto-enriches with PLUTO, FEMA flood data, Census locality, and distress signals" },
  { icon: Activity, label: "What Changed", detail: "Diligence gaps, readiness shifts, zoning changes, and market signals surfaced" },
  { icon: TrendingUp, label: "Readiness scored", detail: "Deal readiness, underwriting friction, and locality risk scored against thresholds" },
  { icon: Shield, label: "Review + approval", detail: "Investment committee reviews diligence package with source verification" },
  { icon: FileText, label: "Export packet", detail: "Defensible diligence package with proof chain and full audit trail" },
];

const dataSources = [
  "NYC PLUTO / MapPLUTO property data",
  "FEMA NFHL flood hazard layers",
  "Census APIs for locality and demographic normalization",
  "County/local tax and assessment records",
  "Environmental and zoning context (configured per geography)",
];

export default function PilotTerraPage() {
  usePageMeta({
    title: "Pilot — Terra — SZL Holdings",
    description: "Terra pilot program: instrument one real estate diligence workflow, prove operational improvement.",
    canonical: "https://szlholdings.com/pilot/terra",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c8953c]/20 bg-[#c8953c]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#c8953c]">
              <Building2 className="h-3.5 w-3.5" />
              Terra Pilot
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Instrument one diligence workflow. Prove readiness.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              The Terra pilot takes one real estate diligence workflow — from property document ingestion
              through twin enrichment, gap detection, readiness scoring, and export — and instruments it
              with observability, official data enrichment, and governed outputs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Request pilot access <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/solutions/terra" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Product overview
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Flagship workflow</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowSteps.map((s, i) => (
                <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c8953c]/10">
                      <s.icon className="h-4 w-4 text-[#c8953c]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#c8953c]">STEP {i + 1}</span>
                      <div className="text-sm font-semibold text-white">{s.label}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/56">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Official data sources</h2>
            <div className="mt-6 space-y-2">
              {dataSources.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#c8953c]" />
                  <span className="text-sm text-white/72">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Expected outcomes</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { period: "30 days", items: ["One property fully twin-enriched", "Diligence gap detection operational", "Readiness scoring calibrated to buyer criteria"] },
                { period: "60 days", items: ["Pipeline of 10+ properties instrumented", "Flood/environmental risk overlays active", "Export packets in regular use for IC review"] },
                { period: "90 days", items: ["Portfolio-wide readiness visibility", "Measurable diligence cycle time reduction", "Decision on geographic expansion scope"] },
              ].map((block) => (
                <div key={block.period} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h3 className="text-base font-semibold text-[#c8953c]">{block.period}</h3>
                  <ul className="mt-4 space-y-2">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                        <Clock className="mt-0.5 h-3 w-3 flex-shrink-0 text-white/32" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
