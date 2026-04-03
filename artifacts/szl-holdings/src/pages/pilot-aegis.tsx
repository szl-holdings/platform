import { Link } from "wouter";
import { ShieldAlert, ArrowRight, AlertTriangle, Activity, Shield, Bug, Server, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const workflowSteps = [
  { icon: Bug, label: "Exposure / alert context", detail: "CISA KEV, NIST NVD, and Microsoft Security updates ingested continuously" },
  { icon: ShieldAlert, label: "Threat Twin updates", detail: "Twin enriches with vulnerability severity, exploit status, and patch availability" },
  { icon: Activity, label: "What Changed", detail: "New exposures, exploited vulnerabilities, and pressure shifts surfaced" },
  { icon: AlertTriangle, label: "Pressure + readiness", detail: "Exposure prioritization, patch pressure, and governance readiness scored" },
  { icon: Shield, label: "Governance review", detail: "Security team reviews prioritized actions with risk context and compliance impact" },
  { icon: Server, label: "Response action + audit", detail: "Approved response executed with full audit trail and verifiable decision chain" },
];

const dataSources = [
  "CISA Known Exploited Vulnerabilities (KEV)",
  "NIST National Vulnerability Database (NVD)",
  "Microsoft Security Update Guide",
  "Additional security telemetry via tenant-configured integrations",
];

export default function PilotAegisPage() {
  usePageMeta({
    title: "Pilot — Aegis — SZL Holdings",
    description: "Aegis pilot program: instrument one security operations workflow, prove threat readiness.",
    canonical: "https://szlholdings.com/pilot/aegis",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c45a4a]/20 bg-[#c45a4a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#c45a4a]">
              <ShieldAlert className="h-3.5 w-3.5" />
              Aegis Pilot
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Instrument one threat workflow. Prove security readiness.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              The Aegis pilot takes one security operations workflow — from vulnerability detection through
              threat enrichment, exposure prioritization, governance review, and response action — and
              instruments it with real-time observability, official threat intelligence, and governed execution.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Request pilot access <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/solutions/aegis" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c45a4a]/10">
                      <s.icon className="h-4 w-4 text-[#c45a4a]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#c45a4a]">STEP {i + 1}</span>
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
                  <div className="h-1.5 w-1.5 rounded-full bg-[#c45a4a]" />
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
                { period: "30 days", items: ["One threat category fully instrumented", "KEV/NVD enrichment operational", "Exposure prioritization calibrated to org risk"] },
                { period: "60 days", items: ["Full vulnerability surface monitored", "Patch pressure tracking across all assets", "Governance review workflow in regular use"] },
                { period: "90 days", items: ["Organization-wide threat readiness visibility", "Measurable reduction in mean-time-to-respond", "Decision on compliance framework alignment"] },
              ].map((block) => (
                <div key={block.period} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h3 className="text-base font-semibold text-[#c45a4a]">{block.period}</h3>
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
