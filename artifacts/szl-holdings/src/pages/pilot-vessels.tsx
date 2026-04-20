import { Link } from "wouter";
import { Anchor, ArrowRight, Navigation, Activity, Shield, AlertTriangle, Cloud, Clock, Users, Lock, XCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WORKFLOW_STEPS = [
  { icon: Navigation, label: "Route and vessel context set", detail: "AIS position data, vessel identity, route parameters, and cargo classification ingested and linked to the Voyage Twin." },
  { icon: Cloud, label: "Voyage Twin updates", detail: "Twin enriches with NWS marine weather forecasts, port congestion signals, OFAC compliance context, and BTS port performance data." },
  { icon: Activity, label: "What Changed surfaced", detail: "Exception events, weather risk score changes, port readiness shifts, and compliance flag updates surfaced without manual monitoring." },
  { icon: AlertTriangle, label: "Risk update generated", detail: "Route risk, port readiness, compliance pressure, and voyage readiness scored against operator-configured thresholds." },
  { icon: Shield, label: "Operator review + approval", detail: "Fleet operator reviews recommended actions with full risk context and source verification before any decision is executed." },
  { icon: Anchor, label: "Approved action + full audit", detail: "Action executed with immutable audit trail — what was decided, who approved it, what data supported it, and when it happened." },
];

const DATA_SOURCES = [
  "NWS marine weather products, zone forecasts, and coastal alerts",
  "USCG AIS vessel identity, position, and route tracking",
  "BTS Port Performance Statistics and port profile data",
  "OFAC SDN and Consolidated Sanctions lists (real-time check)",
  "IMO vessel registry for identity verification",
  "Additional licensed maritime context configured per operator",
];

const OPERATOR_PREREQS = [
  "Named fleet operations lead who will participate in the proof workflow",
  "At least one active voyage or vessel with live AIS position data available",
  "Approval for maritime data connector and AIS feed configuration",
  "Designated compliance contact for sanctions and regulatory review",
  "IT approval for cloud-hosted Voyage Twin with maritime data integration",
];

const NOT_IN_SCOPE = [
  "Full fleet monitoring across all vessels simultaneously",
  "Automated cargo booking or charter party amendments",
  "Direct integration with LRIT systems beyond AIS public data",
  "Flag state or port state authority communication systems",
  "Cargo manifest or bill of lading generation",
];

const TRUST_CONTROLS = [
  { label: "Human-in-the-loop required", detail: "No route deviation, port call, or compliance action is executed without named operator approval. Every decision is logged." },
  { label: "Sanctions check on every action", detail: "OFAC SDN list checked against counterparties and port destinations before any operator-recommended action proceeds." },
  { label: "Immutable audit trail", detail: "Every enrichment event, risk update, operator decision, and action execution is recorded in a tamper-evident log." },
  { label: "Source-verified risk scoring", detail: "Every risk score links to the authoritative data source — NWS, USCG, BTS, or OFAC. No unsupported assessments." },
  { label: "Proof chain on all outputs", detail: "Every voyage report and operator export carries embedded metadata linking each finding to its source and decision chain." },
];

export default function PilotVesselsPage() {
  const __pageMeta = usePageMeta({
    title: "Pilot — Vessels — SZL Holdings",
    description: "Vessels pilot: instrument one maritime operations workflow with official data, compliance controls, and proof chain output. 30/60/90 day success path.",
    canonical: "https://szlholdings.com/pilot/vessels",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
  
          {/* Hero */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4a90b8]/20 bg-[#4a90b8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4a90b8]">
                <Anchor className="h-3.5 w-3.5" />
                Vessels Pilot
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                One voyage instrumented. Readiness proven with real maritime data.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
                The Vessels pilot takes one maritime operations workflow — from voyage planning through weather risk
                monitoring, port readiness, compliance checks, exception detection, and operator-approved action —
                and instruments it with real-time observability, authoritative maritime data, and governed execution.
                Not a demo voyage. A structured proof of operational improvement.
              </p>
              <div className="mt-4 text-sm text-white/50">
                For: fleet operators, maritime logistics teams, and port operations handling complex voyage management.
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                  Request pilot access <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/design-partners" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                  Design partner program
                </Link>
              </div>
            </div>
          </section>
  
          {/* First use case */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">First use case — Voyage Twin + exception detection</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">The flagship workflow</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                One complete voyage operations workflow — from route and vessel context through twin enrichment, risk
                scoring, exception detection, operator review, and auditable action — running with observability and proof.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {WORKFLOW_STEPS.map((s, i) => (
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
                    <p className="mt-3 text-xs leading-5 text-white/55">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Data sources */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Integration requirements</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Official maritime data sources used in the pilot</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Vessels enriches Voyage Twins with authoritative government and regulatory maritime data. Every risk
                score is traceable to its source.
              </p>
              <div className="mt-6 space-y-2">
                {DATA_SOURCES.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4a90b8]" />
                    <span className="text-sm text-white/72">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* 30/60/90 */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Success criteria</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">30 / 60 / 90 day milestones</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {[
                  {
                    period: "30 days",
                    items: [
                      "One voyage fully instrumented with Voyage Twin",
                      "Weather and route risk monitoring operational",
                      "Exception detection proven for one active corridor",
                      "Operator review workflow running on live decisions",
                    ],
                  },
                  {
                    period: "60 days",
                    items: [
                      "Fleet of 5–10 vessels monitored continuously",
                      "Port congestion and arrival risk context integrated",
                      "OFAC compliance checks running on all counterparties",
                      "Comparative readiness scoring across active voyages",
                    ],
                  },
                  {
                    period: "90 days",
                    items: [
                      "Fleet-wide exception prioritization and risk visibility",
                      "Measurable reduction in exception response time",
                      "Operator decision quality documented and tracked",
                      "Documented decision on fleet and route expansion scope",
                    ],
                  },
                ].map((block) => (
                  <div key={block.period} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h3 className="text-base font-semibold text-[#4a90b8]">{block.period}</h3>
                    <ul className="mt-4 space-y-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                          <Clock className="mt-0.5 h-3 w-3 flex-shrink-0 text-white/28" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Trust controls */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Trust controls</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Governance and compliance from day one</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Maritime operations carry regulatory and sanctions exposure. Every governance control runs from the first day of the pilot.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {TRUST_CONTROLS.map((tc) => (
                  <div key={tc.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400/70" />
                      <div>
                        <div className="text-sm font-semibold text-white">{tc.label}</div>
                        <p className="mt-1.5 text-xs leading-5 text-white/55">{tc.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/trust" className="inline-flex items-center gap-2 text-sm text-white/58 transition hover:text-white/85">
                  Full trust documentation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
  
          {/* Operator prerequisites / not in scope */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#4a90b8]/70" />
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Operator setup requirements</p>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">What you need before we start</h2>
                  <ul className="mt-6 space-y-2">
                    {OPERATOR_PREREQS.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/65">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4a90b8]/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
  
                <div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-white/30" />
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Not yet in scope</p>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">What this pilot does not cover</h2>
                  <ul className="mt-6 space-y-2">
                    {NOT_IN_SCOPE.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/50">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/18" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
  
          {/* CTA */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <h2 className="text-2xl font-semibold text-white">Ready to instrument one voyage end to end?</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/58">
                  Start with one active vessel, one active route, and the specific exception handling or risk monitoring
                  problem that costs the most today.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">
                    Request pilot access <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/solutions/vessels" className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/5">
                    Vessels product overview
                  </Link>
                </div>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
