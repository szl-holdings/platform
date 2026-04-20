import { Link } from "wouter";
import {
  Lock,
  ArrowRight,
  Shield,
  FileCheck2,
  Eye,
  GitBranch,
  Users,
  CheckCircle2,
  Layers,
  Building2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const trustPillars = [
  {
    icon: FileCheck2,
    color: "#d4a054",
    title: "Proof Chain",
    subtitle: "Verifiable provenance from signal to outcome",
    body: "Every AI recommendation carries a cryptographic proof chain: source document → model output → confidence score → human review → approval decision → execution record. This is not a log. It is a verifiable evidence structure that enterprise legal, compliance, and audit teams can inspect.",
    enterpriseSignal: "Relevant to: legal discovery, compliance audit, board reporting",
  },
  {
    icon: Eye,
    color: "#4a90b8",
    title: "Source Grounding",
    subtitle: "Every output is traceable to its source",
    body: "The platform enforces source grounding at the model level — not as a prompt instruction, but as an architectural constraint. AI outputs that cannot be traced to a verified source document are flagged, not surfaced. Hallucinations are caught structurally, not just warned about.",
    enterpriseSignal: "Relevant to: AI liability risk, professional standards, regulatory requirements",
  },
  {
    icon: Users,
    color: "#8b7ac8",
    title: "Human-in-the-Loop Governance",
    subtitle: "Nothing executes autonomously",
    body: "Approval gates are structural. Recommended actions move to a review queue. A human must sign off before execution. The system enforces this at the workflow layer — not as a setting, but as a design constraint. There is no bypass mode.",
    enterpriseSignal: "Relevant to: AI liability, enterprise procurement requirements, regulated industries",
  },
  {
    icon: Lock,
    color: "#5a9a8a",
    title: "Export Safety",
    subtitle: "Privilege and sensitivity handled at export",
    body: "The export layer is designed to apply privilege screening, sensitivity classification, and redaction controls before any document or dataset leaves the platform. Attorney-client privilege, work product, and PII handling are addressed in the export pipeline — not added as a filter after the fact.",
    enterpriseSignal: "Relevant to: legal privilege, data residency, regulatory export workflows",
  },
  {
    icon: GitBranch,
    color: "#c8953c",
    title: "Append-Only Audit Log",
    subtitle: "Structured, durable action history",
    body: "Every user action, workflow execution, approval decision, and system event is written to an append-only audit log designed to resist modification. This is not a compliance checkbox — it is the governance backbone that makes every other trust claim verifiable.",
    enterpriseSignal: "Relevant to: security audit requirements, compliance program support",
  },
  {
    icon: Shield,
    color: "#c45a4a",
    title: "Tenant Isolation",
    subtitle: "Customer data scoped at the data layer",
    body: "The database layer is designed with tenant scoping at the query level — row-level security, schema isolation, and API controls ensure that customer data is scoped to the correct tenant. Designed to support enterprise multi-tenant security requirements.",
    enterpriseSignal: "Relevant to: multi-tenant data security, enterprise procurement requirements",
  },
];

const enterpriseReadiness = [
  {
    category: "Compliance posture",
    items: [
      "Architecture designed with SOC 2 alignment as a structural goal",
      "Data handling practices designed to support GDPR obligations",
      "Privilege and sensitivity classification built into export pipeline",
      "Data retention and erasure workflows configurable per organization",
    ],
  },
  {
    category: "AI governance",
    items: [
      "Source grounding enforced at model layer — not left to prompt engineering",
      "Contradiction detection surfaces inconsistent AI outputs before routing",
      "Per-tenant, per-task model selection and configuration",
      "Human approval required before any AI-recommended action executes",
    ],
  },
  {
    category: "Operational security",
    items: [
      "Append-only audit log designed to capture all user actions and system events",
      "Role-based access control with granular permission model",
      "Microsoft 365 SSO and conditional access policy integration designed",
      "Data encrypted at rest and in transit by default",
    ],
  },
];

const governanceToCommercial = [
  {
    governance: "Proof Chain architecture",
    commercial: "Legal and compliance teams can produce court-ready evidence trails",
  },
  {
    governance: "Human-in-the-loop enforcement",
    commercial: "AI liability risk is structurally mitigated — not just disclosed",
  },
  {
    governance: "Export safety layer",
    commercial: "Privilege protection for legal teams, PII handling for regulated domain packs",
  },
  {
    governance: "Tenant isolation",
    commercial: "Enterprise procurement can sign off without custom security review",
  },
  {
    governance: "Immutable audit log",
    commercial: "SOC 2 and ISO audit evidence generated automatically",
  },
];

export default function InvestorsTrustPage() {
  const __pageMeta = usePageMeta({
    title: "Trust & Governance — Investor Relations — SZL Holdings",
    description:
      "How the governed decision operating system's governance primitives — Proof Chain, Covenant Policy, human-in-the-loop enforcement, and immutable audit trail — connect to enterprise buyer requirements.",
    canonical: "https://szlholdings.com/investors/trust",
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
                <Lock className="h-3.5 w-3.5" />
                Trust & Governance
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Governance built in.
                <br />
                Not bolted on.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
                The governed decision operating system is structurally compliant by design — not retrofitted.
                Proof Chain, Covenant Policy enforcement, human-in-the-loop approval gates, and immutable
                audit trails are governance primitives, not features. As the EU AI Act, SEC AI governance
                guidelines, and financial services regulators tighten requirements, the platform's
                architectural compliance is a compounding strategic advantage.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/trust"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Trust center
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/investors/overview"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
                >
                  Back to overview
                </Link>
              </div>
            </div>
          </section>
  
          {/* Trust pillars */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Six governance pillars
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Every pillar maps to an enterprise buyer requirement.
              </h2>
              <div className="mt-10 space-y-5">
                {trustPillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.title}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:p-7"
                    >
                      <div className="flex items-start gap-5">
                        <div
                          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20"
                          style={{ color: pillar.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
                          <p className="text-xs text-white/45 mt-0.5">{pillar.subtitle}</p>
                          <p className="mt-3 text-sm leading-7 text-white/60">{pillar.body}</p>
                          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.025] px-4 py-2.5">
                            <p className="text-xs text-white/45">{pillar.enterpriseSignal}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Enterprise readiness */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Enterprise readiness
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                What enterprise security and procurement teams check.
              </h2>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {enterpriseReadiness.map((section) => (
                  <div
                    key={section.category}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                      {section.category}
                    </p>
                    <ul className="mt-4 space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c8953c]" />
                          <p className="text-sm leading-6 text-white/60">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Governance to commercial */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Governance to commercial
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Every governance decision has a commercial consequence.
              </h2>
              <div className="mt-10 space-y-3">
                {governanceToCommercial.map((item) => (
                  <div
                    key={item.governance}
                    className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{item.governance}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/60">{item.commercial}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Navigation */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Full trust center", href: "/trust", icon: Shield },
                  { label: "Architecture", href: "/investors/architecture", icon: Layers },
                  { label: "Data room", href: "/investors/data-room", icon: Building2 },
                ].map((item) => (
                  <Link key={item.label} href={item.href}>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]">
                      <item.icon className="h-4 w-4 text-[#c8953c]" />
                      <span className="text-sm font-medium text-white/80">{item.label}</span>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/25" />
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
