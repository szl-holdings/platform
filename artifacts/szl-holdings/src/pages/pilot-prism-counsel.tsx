import { Link } from "wouter";
import { Scale, ArrowRight, Mail, FileText, Activity, Shield, Download, CheckSquare, Clock, AlertTriangle, Users, Lock, XCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WORKFLOW_STEPS = [
  { icon: Mail, label: "Email / file arrives", detail: "Outlook integration ingests carrier correspondence, court filings, medical records, and opposing counsel communications automatically." },
  { icon: Activity, label: "Matter Twin updates", detail: "Matter Twin auto-enriches with new facts, deadline recalculations, pressure score updates, and forecast probability revisions." },
  { icon: AlertTriangle, label: "What Changed surfaced", detail: "What Changed highlights new risks, factual contradictions, deadline conflicts, and quiet dangers that would otherwise require manual review." },
  { icon: Shield, label: "AI recommendation generated", detail: "System recommends next-best-action with source citations, confidence scoring, and privilege classification." },
  { icon: CheckSquare, label: "Attorney review + sign-off", detail: "Attorney reviews the recommendation, verifies source grounding, and approves or rejects with a single decision that enters the audit trail." },
  { icon: Download, label: "Defensible Word export", detail: "Export produces a Word document with embedded proof chain metadata, source citations, and full decision history for file and opposing counsel." },
];

const INTEGRATIONS = [
  "Microsoft 365 — Outlook, SharePoint, Teams (tenant-configured)",
  "Case management systems — matter record sync, docket access, and status integration",
  "Court filing systems — configured per jurisdiction and case type",
  "Medical record providers — structured intake and timeline extraction",
  "Carrier communication platforms — correspondence tracking and response detection",
  "Calendar and deadline management — conflict detection and escalation",
];

const OPERATOR_PREREQS = [
  "Named lead attorney who will participate in the proof workflow",
  "One active matter with live inbound correspondence and a defined deadline",
  "Microsoft 365 tenant with Exchange integration enabled",
  "Approval from firm IT for tenant-level data connector configuration",
  "Designated firm contact for governance review and sign-off authority",
];

const NOT_IN_SCOPE = [
  "Multi-matter rollout across the full firm portfolio",
  "Custom court filing system integrations beyond pilot jurisdiction",
  "Full matter lifecycle coverage from intake to close",
  "Billing, time-keeping, or practice management system integration",
  "Automated filing or external submission without attorney approval",
];

const TRUST_CONTROLS = [
  { label: "Human-in-the-loop required", detail: "No AI recommendation is acted on without explicit attorney approval. Every sign-off is logged." },
  { label: "Privilege screening", detail: "Internal strategy documents are classified separately and excluded from external correspondence exports." },
  { label: "Immutable audit trail", detail: "Every access event, recommendation, approval, and rejection is recorded in a tamper-evident log." },
  { label: "Source-grounded outputs", detail: "Every AI recommendation includes citation back to the source document and confidence score. No unsupported conclusions." },
  { label: "Proof chain export", detail: "Every exported document carries embedded metadata linking each claim to its source and decision history." },
];

export default function PilotPrismCounselPage() {
  const __pageMeta = usePageMeta({
    title: "Pilot — PRISM Counsel — SZL Holdings",
    description: "PRISM Counsel pilot: instrument one legal workflow end to end, with full trust controls, proof chain output, and a 30/60/90 day success path.",
    canonical: "https://szlholdings.com/pilot/prism-counsel",
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
                <Scale className="h-3.5 w-3.5" />
                PRISM Counsel Pilot
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                One legal workflow, fully instrumented, end to end.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
                The PRISM Counsel pilot takes one high-friction legal workflow — from email and filing arrival
                through matter update, risk surfacing, AI recommendation, attorney sign-off, and defensible
                export — and instruments it with observability, governance, and proof. Not a software trial.
                A structured proof of improvement.
              </p>
              <div className="mt-4 text-sm text-white/50">
                For: litigation and insurance defense practices managing high-volume matter portfolios.
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">First use case — Matter twin + what changed</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">The flagship workflow</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                One complete daily lawyer workflow — from inbound document through matter enrichment,
                risk surfacing, recommendation, approval, and export — running with observability and proof.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {WORKFLOW_STEPS.map((s, i) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a054]/10">
                        <s.icon className="h-4 w-4 text-[#d4a054]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#d4a054]">STEP {i + 1}</span>
                        <div className="text-sm font-semibold text-white">{s.label}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-white/55">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Integrations */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Integration requirements</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What the pilot connects to</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                These are the integrations required to run the first proof workflow. Each is configured to your
                tenant environment, not shared or multi-tenant.
              </p>
              <div className="mt-6 space-y-2">
                {INTEGRATIONS.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#d4a054]" />
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
                    accent: "#d4a054",
                    items: [
                      "One matter fully instrumented end-to-end",
                      "Morning brief operational for daily matter review",
                      "What Changed surface detecting overnight events",
                      "Review Before Send workflow proven for one document type",
                    ],
                  },
                  {
                    period: "60 days",
                    accent: "#d4a054",
                    items: [
                      "5–10 matters running through the full workflow",
                      "Quiet risk detection surfacing overlooked matters",
                      "Word export with proof chain in regular attorney use",
                      "Sign-off queue integrated into partner review process",
                    ],
                  },
                  {
                    period: "90 days",
                    accent: "#d4a054",
                    items: [
                      "Full portfolio visibility through Today dashboard",
                      "Measurable reduction in missed deadline risk",
                      "Attorney time savings quantified per matter type",
                      "Documented decision on expansion scope and rollout plan",
                    ],
                  },
                ].map((block) => (
                  <div key={block.period} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h3 className="text-base font-semibold" style={{ color: block.accent }}>{block.period}</h3>
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
              <h2 className="mt-3 text-2xl font-semibold text-white">Governance is not optional in the pilot</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                The pilot runs under the same governance framework as production. Every trust control is active
                from day one, not bolted on after proof-of-concept.
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
  
          {/* Operator prerequisites */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#d4a054]/70" />
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Operator setup requirements</p>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">What you need before we start</h2>
                  <ul className="mt-6 space-y-2">
                    {OPERATOR_PREREQS.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/65">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#d4a054]/50" />
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
                <h2 className="text-2xl font-semibold text-white">Ready to instrument one matter end to end?</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/58">
                  The pilot starts with a conversation about the specific workflow, the integration environment,
                  and the baseline you want to prove against. No commitment beyond that conversation.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">
                    Request pilot access <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/solutions/prism-counsel" className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/5">
                    Full product overview
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
