import { Link } from "wouter";
import { ArrowRight, Terminal, Lock, Settings, Users, BarChart3, RefreshCw, Scale } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  {
    icon: Settings,
    name: "Tenant configuration",
    desc: "Operators configure their environment through the Governance API — signal sources, connector endpoints, threshold parameters, domain vocabulary, and integration credentials. Configuration changes are versioned and audited.",
  },
  {
    icon: Users,
    name: "Role and access management",
    desc: "Role-scoped access is enforced at the Governance API layer. Every principal in the system has a defined role with explicit capabilities — what they can see, what they can act on, and what requires additional approval.",
  },
  {
    icon: BarChart3,
    name: "Observability and health",
    desc: "The Governance API exposes system health, signal processing metrics, Twin staleness indicators, and approval queue depth through structured queries. Operators can monitor the state of their environment without raw system access.",
  },
  {
    icon: RefreshCw,
    name: "Workflow orchestration control",
    desc: "Workflow definitions, routing rules, and execution parameters are managed through the Governance API. Changes take effect immediately with full audit trail — no redeploy required for configuration-level updates.",
  },
  {
    icon: Lock,
    name: "Audit and governance access",
    desc: "The Governance API provides structured access to audit records, approval history, and decision logs. Governance teams can query decision history without requiring raw database access or system-level credentials.",
  },
  {
    icon: Terminal,
    name: "Integration management",
    desc: "External integrations — M365, AIS feeds, CISA, NVD, domain APIs — are registered, authorized, and monitored through the Governance API. Connection health, last-sync timestamps, and error states are surfaced in structured form.",
  },
];

const SCHEMA_EXAMPLES = [
  {
    label: "Query tenant health",
    code: `query TenantHealth {\n  tenant {\n    id\n    signalPipeline { status latencyMs }\n    twinStaleness { oldest average }\n    approvalQueue { depth oldestPendingAge }\n  }\n}`,
  },
  {
    label: "List active integrations",
    code: `query Integrations {\n  integrations {\n    id\n    type\n    status\n    lastSyncAt\n    errorCount\n  }\n}`,
  },
  {
    label: "Query audit records",
    code: `query AuditLog($filter: AuditFilter!) {\n  auditRecords(filter: $filter) {\n    id\n    eventType\n    actor { id role }\n    timestamp\n    subjectType\n    subjectId\n    proofChainRef\n  }\n}`,
  },
];

export default function DocsControlPlanePage() {
  const __pageMeta = usePageMeta({
    title: "Covenant Policy — Docs — SZL Holdings",
    description: "Covenant Policy documentation for KORA + FORGE: the governance rules engine that defines what the platform can and cannot do on behalf of any principal.",
    canonical: "https://szlholdings.com/docs/covenant-policy",
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
                <span className="text-white/60">Covenant Policy</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <Scale className="h-3 w-3" />
                Platform primitive
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Covenant Policy.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                Covenant Policy is the governance rules engine in KORA + FORGE. It defines — in explicit,
                versioned, auditable form — what the platform is and is not permitted to do on behalf of any
                principal. No model invocation, workflow action, or data export occurs outside the boundary
                defined by the tenant's active Covenant. The Governance API is the surface through which
                Covenants are configured, monitored, and enforced.
              </p>
            </div>
          </section>
  
          {/* Capabilities */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Covenant Policy capabilities</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What operators govern through Covenant Policy</h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {CAPABILITIES.map((cap) => {
                  const Icon = cap.icon;
                  return (
                    <div key={cap.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                      <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <Icon className="h-4 w-4 text-white/50" />
                      </div>
                      <h3 className="text-base font-semibold text-white">{cap.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/58">{cap.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Schema examples */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Governance API</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Representative Covenant Policy query shapes</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                These examples represent the shape and style of Covenant Policy queries through the governance
                API. Specific field availability depends on the tenant configuration and role scope of the
                requesting principal.
              </p>
              <div className="mt-8 space-y-4">
                {SCHEMA_EXAMPLES.map((ex) => (
                  <div key={ex.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                    <div className="border-b border-white/[0.07] px-5 py-3">
                      <span className="text-xs font-semibold text-white/45">{ex.label}</span>
                    </div>
                    <pre className="overflow-x-auto p-5 text-xs leading-6 text-white/65 font-mono">{ex.code}</pre>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Access model */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Access model</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Role-scoped Governance API access</h2>
              <div className="mt-6 space-y-3">
                {[
                  { role: "Operator", access: "Can view observability surfaces, submit workflow approvals, and read audit records within their scope." },
                  { role: "Admin", access: "Can configure integrations, manage role assignments, and modify workflow parameters for their tenant." },
                  { role: "Auditor", access: "Read-only access to audit records, approval history, and proof chain references. Cannot modify configuration." },
                  { role: "System integrator", access: "Can register and manage external integration connections. Cannot access tenant data or audit records." },
                ].map((r) => (
                  <div key={r.role} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <div className="w-28 flex-shrink-0 text-xs font-semibold text-white/55">{r.role}</div>
                    <div className="text-sm text-white/65">{r.access}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Related docs */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Related documentation</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Outcome Graph", href: "/docs/outcome-graph", detail: "The signal and state fabric governed by Covenant Policy" },
                  { label: "Proof Chain", href: "/docs/proof-chain", detail: "How outputs are traced to source signals" },
                  { label: "Simulation", href: "/docs/simulation", detail: "Test Covenant configurations before deploying" },
                  { label: "Audit Timeline", href: "/docs/worldline", detail: "Chronological event and decision record" },
                  { label: "Trust", href: "/docs/trust", detail: "Trust controls and governance documentation" },
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
