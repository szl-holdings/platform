import { Link } from "wouter";
import { Anchor, ArrowRight, Navigation, Activity, Shield, AlertTriangle, Cloud, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const workflowSteps = [
  { icon: Navigation, label: "Route / vessel context", detail: "AIS position data, vessel identity, and route parameters ingested" },
  { icon: Cloud, label: "Voyage Twin updates", detail: "Twin enriches with NWS marine weather, port congestion, and compliance context" },
  { icon: Activity, label: "What Changed", detail: "Exception events, weather risk shifts, and port readiness changes surfaced" },
  { icon: AlertTriangle, label: "Risk update", detail: "Readiness, route risk, and compliance pressure scored against thresholds" },
  { icon: Shield, label: "Operator review", detail: "Operator reviews recommended actions with source verification and risk context" },
  { icon: Anchor, label: "Approved action + audit", detail: "Action executed with full audit trail and verifiable decision lineage" },
];

const dataSources = [
  "NWS marine weather products and forecasts",
  "USCG AIS vessel identity and movement context",
  "BTS Port Performance and Port Profiles",
  "OFAC sanctions list service",
  "Additional licensed maritime context (configured per operator)",
];

export default function PilotVesselsPage() {
  usePageMeta({
    title: "Pilot — Vessels — SZL Holdings",
    description: "Vessels pilot program: instrument one maritime operations workflow, prove operational improvement.",
    canonical: "https://szlholdings.com/pilot/vessels",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4a90b8]/20 bg-[#4a90b8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4a90b8]">
              <Anchor className="h-3.5 w-3.5" />
              Vessels Pilot
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Instrument one voyage. Prove fleet readiness.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              The Vessels pilot takes one maritime operations workflow — from route planning through
              weather risk monitoring, port readiness, compliance checks, and exception handling — and
              instruments it with real-time observability, official maritime data, and governed actions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Request pilot access <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/solutions/vessels" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a90b8]/10">
                      <s.icon className="h-4 w-4 text-[#4a90b8]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#4a90b8]">STEP {i + 1}</span>
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
                  <div className="h-1.5 w-1.5 rounded-full bg-[#4a90b8]" />
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
                { period: "30 days", items: ["One voyage fully instrumented with twin", "Weather/route risk monitoring operational", "Exception detection proven for one corridor"] },
                { period: "60 days", items: ["Fleet of 5-10 vessels monitored", "Port congestion context integrated", "Compliance/sanctions checks automated"] },
                { period: "90 days", items: ["Fleet-wide visibility and exception prioritization", "Measurable reduction in exception response time", "Decision on fleet expansion scope"] },
              ].map((block) => (
                <div key={block.period} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h3 className="text-base font-semibold text-[#4a90b8]">{block.period}</h3>
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
