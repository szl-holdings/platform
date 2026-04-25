import { Link } from "wouter";
import { Building2, ArrowRight, FileText, Activity, Shield, MapPin, TrendingUp, Clock, Users, Lock, XCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WORKFLOW_STEPS = [
  { icon: FileText, label: "Property docs arrive", detail: "Deed, tax records, environmental reports, zoning records, and local market context ingested and parsed automatically." },
  { icon: MapPin, label: "Property Twin updates", detail: "Twin auto-enriches with PLUTO parcel data, FEMA flood zone layers, Census locality context, and distress signal classification." },
  { icon: Activity, label: "What Changed surfaced", detail: "Diligence gaps, readiness score shifts, zoning changes, new flood exposure, and market pressure signals surfaced without manual review." },
  { icon: TrendingUp, label: "Readiness scored", detail: "Deal readiness, underwriting friction, locality risk, and comparative diligence quality scored against investor thresholds." },
  { icon: Shield, label: "IC review + approval", detail: "Investment committee reviews the AI-assembled diligence package with source verification and governance checkpoints before any decision." },
  { icon: FileText, label: "Defensible export packet", detail: "Diligence export with proof chain, data source citations, and full decision history — ready for lender, partner, and archive." },
];

const DATA_SOURCES = [
  "NYC PLUTO / MapPLUTO parcel and lot data",
  "FEMA NFHL flood hazard layers and zone classifications",
  "Census Bureau locality, demographic, and market normalization APIs",
  "County and local tax assessment and deed records",
  "Environmental and zoning context, configured per geography",
  "Commercial market comparables via operator-configured data connection",
];

const OPERATOR_PREREQS = [
  "Named acquisition lead or asset manager who will participate in the proof workflow",
  "One active deal in diligence with live incoming documents and a defined close timeline",
  "Access to relevant parcel records or data room for the pilot property",
  "Approval from IT/ops for cloud data connector configuration",
  "Designated investment committee contact for sign-off review",
];

const NOT_IN_SCOPE = [
  "Portfolio-wide diligence across all assets simultaneously",
  "Full underwriting model or automated valuation",
  "Integration with proprietary investment management systems beyond pilot",
  "Geographic markets outside configured PLUTO/FEMA coverage",
  "Automated term sheet or LOI generation",
];

const TRUST_CONTROLS = [
  { label: "Source-verified outputs only", detail: "Every diligence claim links to its originating official data source. No unsupported AI assertions reach the export." },
  { label: "Human sign-off required", detail: "No AI-assembled diligence package proceeds without investment committee or designated reviewer approval." },
  { label: "Immutable audit trail", detail: "Every data access, enrichment event, recommendation, and approval is recorded in a tamper-evident log." },
  { label: "Data isolation per property", detail: "Each property Twin is isolated. No cross-contamination of signals between assets or deals." },
  { label: "Proof chain export", detail: "Every export carries embedded metadata linking each diligence finding to its source record and decision chain." },
];

export default function PilotTerraPage() {
  const __pageMeta = usePageMeta({
    title: "Pilot — Terra — SZL Holdings",
    description: "Terra pilot: instrument one real estate diligence workflow with official data enrichment, governance, and proof chain output. 30/60/90 day success path.",
    canonical: "https://szlholdings.com/pilot/terra",
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c8953c]/20 bg-[#c8953c]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#c8953c]">
                <Building2 className="h-3.5 w-3.5" />
                Terra Pilot
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                One diligence workflow, enriched by official data, end to end.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
                The Terra pilot takes one real estate diligence workflow — from property document arrival through
                twin enrichment with official data, gap detection, readiness scoring, investment committee review,
                and defensible export — and instruments it with observability, governance, and proof. Not a demo.
                A structured proof of diligence improvement.
              </p>
              <div className="mt-4 text-sm text-white/50">
                For: acquisition teams, asset managers, and investment committees managing property diligence in high-stakes markets.
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">First use case — Property Twin + diligence gaps</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">The flagship workflow</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                One complete diligence workflow — from document intake through official data enrichment, gap surfacing,
                readiness scoring, IC sign-off, and export — running with observability and proof chain output.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {WORKFLOW_STEPS.map((s, i) => (
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
                    <p className="mt-3 text-xs leading-5 text-white/55">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Integrations / data sources */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Integration requirements</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Official data sources used in the pilot</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Terra enriches Property Twins with authoritative government and regulatory data — not scraped,
                not estimated, not aggregated from commercial sources without source provenance.
              </p>
              <div className="mt-6 space-y-2">
                {DATA_SOURCES.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c8953c]" />
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
                      "One property fully twin-enriched with official data",
                      "Diligence gap detection operational on live documents",
                      "Readiness scoring calibrated to buyer's investment criteria",
                      "IC-ready export packet with proof chain produced",
                    ],
                  },
                  {
                    period: "60 days",
                    items: [
                      "Pipeline of 5–10 properties instrumented",
                      "Flood zone, environmental, and zoning risk overlays active",
                      "Export packets in regular use for IC review sessions",
                      "Comparative readiness scoring across the active pipeline",
                    ],
                  },
                  {
                    period: "90 days",
                    items: [
                      "Portfolio-wide readiness visibility across all active deals",
                      "Measurable reduction in diligence cycle time",
                      "Diligence gap close rate tracked and documented",
                      "Documented decision on geographic and asset class expansion",
                    ],
                  },
                ].map((block) => (
                  <div key={block.period} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h3 className="text-base font-semibold text-[#c8953c]">{block.period}</h3>
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
              <h2 className="mt-3 text-2xl font-semibold text-white">Governance runs from day one</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Every trust control active in production is active in the pilot. No governance debt to close after the proof window.
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
                    <Users className="h-4 w-4 text-[#c8953c]/70" />
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Operator setup requirements</p>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">What you need before we start</h2>
                  <ul className="mt-6 space-y-2">
                    {OPERATOR_PREREQS.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/65">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c8953c]/50" />
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
                <h2 className="text-2xl font-semibold text-white">Ready to instrument one deal in diligence?</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/58">
                  The conversation starts with one active deal, a defined close timeline, and a clear question the
                  diligence workflow needs to answer better than it does today.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">
                    Request pilot access <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="/terra/" className="inline-flex items-center gap-2 rounded-xl border border-[#c8953c]/25 bg-[#c8953c]/08 px-5 py-2.5 text-sm font-semibold text-[#c8953c]/90 transition hover:border-[#c8953c]/40 hover:bg-[#c8953c]/12">
                    Open live Terra app <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link href="/solutions/terra" className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/5">
                    Product overview
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
