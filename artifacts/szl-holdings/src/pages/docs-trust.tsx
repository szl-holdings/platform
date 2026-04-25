import { Link } from "wouter";
import { ArrowRight, Shield, Lock, Eye, UserCheck, FileText, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const TRUST_PILLARS = [
  {
    icon: UserCheck,
    name: "Human-in-the-loop by architecture",
    desc: "Human approval is not a policy configuration in Lyte + Counsel — it is a structural property of the platform. The signal-to-action pipeline cannot route from AI recommendation to execution without passing through a human decision gate. This is enforced at the architecture level, not the policy level.",
  },
  {
    icon: Lock,
    name: "Immutable audit trail",
    desc: "Every signal ingestion, Twin update, AI recommendation, human decision, and execution event is written to an immutable, tamper-evident audit timeline. The record cannot be modified after the fact. Governance teams can reconstruct the full decision context for any point in any workflow's history.",
  },
  {
    icon: FileText,
    name: "Proof chain on all outputs",
    desc: "Every output the system produces — a recommendation, an exported document, a governance report — carries a proof chain that traces every claim back to its source signal, the model that processed it, and the human who authorized it. Unsupported outputs are not possible.",
  },
  {
    icon: Eye,
    name: "Transparent confidence scoring",
    desc: "AI recommendations include explicit confidence scores and source citations that are visible to the reviewing operator before any approval is requested. Operators are never asked to approve outputs they cannot evaluate. Low-confidence recommendations are flagged, not hidden.",
  },
  {
    icon: Shield,
    name: "Role-scoped data access",
    desc: "Access to signals, Twin data, and audit records is scoped by role and enforced at the data layer — not the UI layer. Operators see only the data their role authorizes. Cross-tenant data access is structurally prevented.",
  },
  {
    icon: AlertTriangle,
    name: "Privilege and sensitivity screening",
    desc: "Inputs are screened for sensitivity classifications before processing. In legal domains, privilege screening prevents internal strategy from leaking into external communications. In all domains, sensitive data is classified before any AI model processes it.",
  },
];

const GOVERNANCE_COMMITMENTS = [
  "No autonomous AI action — every consequential output requires human authorization",
  "No model hallucination propagation — unsupported claims cannot reach exported outputs",
  "No privilege exposure — sensitive classifications are screened before AI processing",
  "No audit gaps — every decision has an audit timeline record that cannot be deleted",
  "No cross-tenant leakage — data isolation is enforced at the data layer",
  "No governance override — approval gates cannot be bypassed by configuration",
];

const DOMAIN_CONSIDERATIONS = [
  {
    domain: "Legal (Counsel)",
    items: [
      "Attorney-client privilege screening on all inputs before model processing",
      "Human attorney approval required for all recommendations before export",
      "Work product doctrine alignment — AI outputs are not final work product without attorney review",
      "Jurisdiction-specific deadline logic with escalation if approaching breach",
    ],
  },
  {
    domain: "Maritime (Vessels)",
    items: [
      "OFAC sanctions screening on all counterparties and destinations",
      "SOLAS and ISM compliance context integrated into risk scoring",
      "Operator authorization required for all course-of-action recommendations",
      "Coast guard reporting obligations tracked per route and vessel type",
    ],
  },
  {
    domain: "Security (Aegis)",
    items: [
      "NIST and SOC 2 framework alignment in all governance report outputs",
      "Authorized security team approval for all remediation recommendations",
      "CVE and KEV data provenance traced to NIST and CISA authoritative sources",
      "Compliance audit trail preserved for regulatory examination",
    ],
  },
  {
    domain: "Real estate (Terra)",
    items: [
      "Official data provenance — all enrichment traces to PLUTO, FEMA, Census, or county records",
      "Investment committee approval required for all diligence export packets",
      "Geographic data accuracy audit — no estimated or interpolated data without flagging",
      "Fair housing and anti-discrimination screening on locality data handling",
    ],
  },
];

export default function DocsTrustPage() {
  const __pageMeta = usePageMeta({
    title: "Trust — Docs — SZL Holdings",
    description: "Technical trust documentation for Lyte + Counsel: human-in-the-loop architecture, immutable audit trail, proof chain, role-scoped access, and domain-specific governance.",
    canonical: "https://szlholdings.com/docs/trust",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Link href="/docs" className="hover:text-white/70 transition">Docs</Link>
                <span>/</span>
                <span className="text-white/60">Trust</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <Shield className="h-3 w-3" />
                Trust and governance
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Trust documentation.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                Trust in the Lyte + Counsel platform is an architectural property, not a product feature.
                This page documents the trust controls, governance commitments, and domain-specific compliance
                considerations that apply across all verticals and all operator environments.
              </p>
            </div>
          </section>
  
          {/* Trust pillars */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Trust pillars</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Structural trust controls</h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {TRUST_PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                      <div className="mb-4 inline-flex rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-2.5">
                        <Icon className="h-4 w-4 text-emerald-400/80" />
                      </div>
                      <h3 className="text-base font-semibold text-white">{pillar.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/58">{pillar.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Commitments */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Governance commitments</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What we commit to by architecture</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                These are not policy statements — they are structural properties that cannot be disabled
                by configuration, tenant preference, or operator override.
              </p>
              <div className="mt-8 space-y-2">
                {GOVERNANCE_COMMITMENTS.map((item) => (
                  <div key={item} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400/60" />
                    <span className="text-sm text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Domain-specific */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Domain-specific considerations</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Trust controls by vertical</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {DOMAIN_CONSIDERATIONS.map((domain) => (
                  <div key={domain.domain} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                    <h3 className="text-sm font-semibold text-white/80 mb-4">{domain.domain}</h3>
                    <ul className="space-y-2">
                      {domain.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/58">
                          <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/20" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Full trust center link */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Full Trust Center</h3>
                  <p className="mt-1 text-sm text-white/55">Security posture, AI governance model, and diligence documentation are in the full Trust Center.</p>
                </div>
                <Link href="/trust" className="inline-flex items-center gap-2 flex-shrink-0 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/28 hover:bg-white/5">
                  Trust Center <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
  
          {/* Related docs */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Related documentation</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Proof chain", href: "/docs/proof-chain", detail: "How outputs carry source provenance and approval records" },
                  { label: "Audit Timeline", href: "/docs/worldline", detail: "The immutable chronological record" },
                  { label: "Architecture", href: "/docs/architecture", detail: "Where governance fits in the platform pipeline" },
                  { label: "Governed inference", href: "/docs/model-mesh", detail: "AI model governance and accountability" },
                  { label: "Covenant Policy", href: "/docs/control-plane", detail: "Role-scoped access and audit query interface" },
                  { label: "Back to docs hub", href: "/docs", detail: "Full documentation index" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/12 hover:bg-white/[0.04]"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/30" />
                    <div>
                      <div className="text-sm font-semibold text-white">{link.label}</div>
                      <div className="mt-0.5 text-xs text-white/45">{link.detail}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
