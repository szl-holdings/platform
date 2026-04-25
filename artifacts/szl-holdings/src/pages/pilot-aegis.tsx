import { Link } from "wouter";
import { ShieldAlert, ArrowRight, AlertTriangle, Activity, Shield, Bug, Server, Clock, Users, Lock, XCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WORKFLOW_STEPS = [
  { icon: Bug, label: "Exposure and alert context ingested", detail: "CISA KEV, NIST NVD, and Microsoft Security update feeds ingested continuously. New CVEs and exploited vulnerabilities classified automatically." },
  { icon: ShieldAlert, label: "Threat Twin updates", detail: "Twin enriches with CVSS severity, exploit availability, vendor patch status, and affected asset classification from the org's configured asset inventory." },
  { icon: Activity, label: "What Changed surfaced", detail: "New exploited vulnerabilities, severity escalations, unpatched critical exposures, and deadline pressure changes surfaced without manual review." },
  { icon: AlertTriangle, label: "Exposure priority scored", detail: "Patch pressure, compliance readiness, and governance exposure scored against org-configured thresholds and framework requirements." },
  { icon: Shield, label: "Security team review + approval", detail: "Security team reviews prioritized actions with full risk context, asset impact, and compliance framing before any remediation is approved." },
  { icon: Server, label: "Response action + full audit", detail: "Approved response executed with tamper-evident audit trail — what was decided, who authorized it, what data supported it, and when it was acted on." },
];

const DATA_SOURCES = [
  "CISA Known Exploited Vulnerabilities (KEV) catalog — real-time",
  "NIST National Vulnerability Database (NVD) — CVE and CVSS data",
  "Microsoft Security Update Guide — patch status and advisory history",
  "Vendor security advisories via configured RSS and advisory feeds",
  "Org asset inventory via configured integration (CMDB or equivalent)",
  "Additional security telemetry via tenant-configured SIEM connection",
];

const OPERATOR_PREREQS = [
  "Named security lead or CISO delegate who will participate in the proof workflow",
  "One active vulnerability or threat category as the first instrumented scope",
  "Asset inventory access or CMDB export for pilot scope definition",
  "IT approval for cloud security connector configuration and data access",
  "Designated compliance contact for governance review and sign-off authority",
];

const NOT_IN_SCOPE = [
  "Full vulnerability surface monitoring across all assets simultaneously",
  "Automated patching or system remediation without operator approval",
  "SIEM rule deployment or security tool reconfiguration",
  "Penetration testing, red team activity, or adversarial simulation",
  "Compliance audit submission or regulatory filing generation",
];

const TRUST_CONTROLS = [
  { label: "Human authorization required", detail: "No patch recommendation, response action, or remediation task is executed without named security team approval. Every authorization is logged." },
  { label: "Governance review built in", detail: "Every prioritized action includes compliance framework mapping — NIST, SOC 2, or org-configured framework — so governance review has context." },
  { label: "Immutable audit trail", detail: "Every enrichment event, risk score update, team decision, and action execution is recorded in a tamper-evident log that cannot be altered post-hoc." },
  { label: "Source-verified risk scoring", detail: "Every exposure prioritization links to its authoritative source — CISA KEV, NVD CVSS, or vendor advisory. No unsupported threat assessments." },
  { label: "Proof chain on all outputs", detail: "Every governance report and remediation export carries embedded metadata linking each finding to its source data and approval chain." },
];

export default function PilotAegisPage() {
  const __pageMeta = usePageMeta({
    title: "Pilot — Aegis — SZL Holdings",
    description: "Aegis pilot: instrument one security operations workflow with official threat intelligence, governance controls, and proof chain output. 30/60/90 day success path.",
    canonical: "https://szlholdings.com/pilot/aegis",
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c45a4a]/20 bg-[#c45a4a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#c45a4a]">
                <ShieldAlert className="h-3.5 w-3.5" />
                Aegis Pilot
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                One threat category instrumented. Readiness proven with real threat intelligence.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
                The Aegis pilot takes one security operations workflow — from vulnerability detection and official
                threat enrichment through exposure prioritization, governance review, and response authorization —
                and instruments it with real-time observability, authoritative threat intelligence, and governed
                execution. Not a SIEM alert. A structured proof of security readiness improvement.
              </p>
              <div className="mt-4 text-sm text-white/50">
                For: security teams, CISOs, and IT governance leads managing vulnerability exposure in regulated or high-risk environments.
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">First use case — Threat Twin + exposure prioritization</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">The flagship workflow</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                One complete security operations workflow — from threat intelligence ingestion through twin enrichment,
                exposure scoring, security team review, and approved response with audit trail — running on live data.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {WORKFLOW_STEPS.map((s, i) => (
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
              <h2 className="mt-3 text-2xl font-semibold text-white">Official threat intelligence sources used in the pilot</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Aegis enriches Threat Twins with authoritative government and vendor threat intelligence. Every risk
                score is traceable to its originating source — CISA, NIST, or vendor advisory.
              </p>
              <div className="mt-6 space-y-2">
                {DATA_SOURCES.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c45a4a]" />
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
                      "One threat category fully instrumented with Threat Twin",
                      "KEV and NVD enrichment operational on live vulnerability data",
                      "Exposure prioritization calibrated to org risk posture",
                      "Governance review workflow running on prioritized actions",
                    ],
                  },
                  {
                    period: "60 days",
                    items: [
                      "Full known vulnerability surface monitored continuously",
                      "Patch pressure tracking across all assets in scope",
                      "Compliance framework mapping active for all findings",
                      "Security team review workflow in regular operational use",
                    ],
                  },
                  {
                    period: "90 days",
                    items: [
                      "Organization-wide threat readiness visibility established",
                      "Measurable reduction in mean time to authorized response",
                      "Governance audit trail complete and ready for review",
                      "Documented decision on compliance framework alignment and expansion",
                    ],
                  },
                ].map((block) => (
                  <div key={block.period} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h3 className="text-base font-semibold text-[#c45a4a]">{block.period}</h3>
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
              <h2 className="mt-3 text-2xl font-semibold text-white">Governance is the requirement, not the afterthought</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Security operations in regulated environments cannot afford governance gaps. Every control runs
                from day one of the pilot with no exceptions.
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
                    <Users className="h-4 w-4 text-[#c45a4a]/70" />
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Operator setup requirements</p>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">What you need before we start</h2>
                  <ul className="mt-6 space-y-2">
                    {OPERATOR_PREREQS.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/65">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c45a4a]/50" />
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
                <h2 className="text-2xl font-semibold text-white">Ready to instrument one threat category end to end?</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/58">
                  Start with the threat category causing the most exposure pressure today — whether that's known
                  exploited vulnerabilities, patch compliance gaps, or governance review backlogs.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">
                    Request pilot access <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="/sentra/" className="inline-flex items-center gap-2 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/08 px-5 py-2.5 text-sm font-semibold text-[#f87171]/90 transition hover:border-[#ef4444]/40 hover:bg-[#ef4444]/12">
                    Open live TENAX app <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link href="/solutions/aegis" className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/5">
                    Aegis product overview
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
