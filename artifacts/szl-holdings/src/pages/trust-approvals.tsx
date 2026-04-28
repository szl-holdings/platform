import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckSquare, Users, AlertOctagon, Clock, GitBranch, ShieldCheck, ArrowDown } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ApprovalPathDiagram } from "@/components/diagrams/ApprovalPathDiagram";

const APPROVAL_TIERS = [
  {
    tier: "T1",
    label: "Auto-cleared",
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.20)",
    description: "Low-risk, read-only operations within tenant scope",
    examples: ["Signal classification (high confidence)", "Read queries and report generation", "Internal notification routing", "Dashboard data refresh"],
    gate: "Automated",
    note: "Confidence threshold configurable per tenant. Drops to T2 below threshold.",
  },
  {
    tier: "T2",
    label: "Single reviewer",
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.08)",
    colorBorder: "hsla(40,90%,54%,0.22)",
    description: "Actions with bounded, reversible impact on workflow state",
    examples: ["Task assignment and routing", "Workflow state transitions", "Low-impact external notifications", "Draft document generation"],
    gate: "One approver required",
    note: "Approver receives full context package: signal, interpretation, recommendation, confidence.",
  },
  {
    tier: "T3",
    label: "Dual approval",
    color: "hsl(25,90%,55%)",
    colorMuted: "hsla(25,90%,55%,0.08)",
    colorBorder: "hsla(25,90%,55%,0.20)",
    description: "Actions affecting external systems, financial records, or customer data",
    examples: ["External API mutations", "Financial record updates", "Customer-facing communications", "Export of sensitive documents"],
    gate: "Two approvers + rationale field",
    note: "Rationale is mandatory. Second approver must be a different role tier from the first.",
  },
  {
    tier: "T4",
    label: "Senior authorization",
    color: "hsl(358,75%,58%)",
    colorMuted: "hsla(358,75%,58%,0.08)",
    colorBorder: "hsla(358,75%,58%,0.20)",
    description: "Irreversible or high-consequence actions requiring elevated oversight",
    examples: ["Irreversible data deletion", "Legal filing or submission actions", "Bulk operations across tenant boundary", "Compliance artifact modifications"],
    gate: "Senior approver + full audit record",
    note: "Complete audit record created before execution begins. Cannot be expedited without documented exception.",
  },
];

const HITL_PRINCIPLES = [
  {
    icon: CheckSquare,
    title: "Gate enforced at the execution layer",
    body: "The human approval gate is implemented in the Counsel workflow execution layer, not deferred to per-app logic. Bypassing the gate requires an explicit, attributed override record written to the audit trail — there is no silent skip path.",
  },
  {
    icon: Users,
    title: "Approver context is complete",
    body: "Every approver receives the full context package: original signal, interpretation rationale, AI recommendation, confidence level, evidence, and the proposed action scope. No approving blind.",
  },
  {
    icon: AlertOctagon,
    title: "Override is permitted — and logged",
    body: "Emergency overrides are allowed when operational necessity requires it. The override is immediately logged with full attribution, rationale, and timestamp — and triggers mandatory post-hoc review.",
  },
  {
    icon: Clock,
    title: "SLA clock is transparent",
    body: "Every approval request shows the SLA clock to the approver. Approaching and breached SLAs are surfaced to escalation owners automatically.",
  },
  {
    icon: GitBranch,
    title: "Escalation chains are defined",
    body: "If the primary approver is unavailable or does not act within SLA, the system escalates to the fallback owner defined in the tenant configuration. Escalation history is part of the audit record.",
  },
  {
    icon: ShieldCheck,
    title: "Approval decisions are irretractable",
    body: "Once an approval is granted and action is executed, the decision cannot be retroactively modified. If an error occurs post-execution, a new corrective action must go through its own approval path.",
  },
];

const APPROVAL_PATH_STAGES = [
  { id: "trigger", label: "Trigger", desc: "Signal detected and classified. Counsel generates structured action recommendation with evidence package.", color: "var(--color-lyte-light)" },
  { id: "route", label: "Route", desc: "Approval tier assigned based on action type and risk model. Request routed to designated approver(s) for the tenant.", color: "hsl(40,90%,54%)" },
  { id: "review", label: "Review", desc: "Approver(s) receive full context: signal, interpretation, recommendation, confidence, and proposed action scope.", color: "hsl(25,90%,55%)" },
  { id: "decide", label: "Decide", desc: "Approver approves, modifies, defers, or rejects. For T3+ actions, rationale field is mandatory before submission.", color: "hsl(258,55%,68%)" },
  { id: "execute", label: "Execute", desc: "Only on approval: Counsel executes the scoped action through the appropriate connector. SLA clock starts.", color: "var(--color-continuum-light)" },
  { id: "record", label: "Record", desc: "Complete approval path — every step, every decision, every attribution — written to the immutable audit trail.", color: "hsl(145,62%,46%)" },
];

export default function TrustApprovalsPage() {
  const __pageMeta = usePageMeta({
    title: "Approvals — Trust Center · SZL Holdings",
    description: "Approval path model, tiered HITL gates, sign-off workflows, and escalation model for Lyte + Counsel.",
    canonical: "https://szlholdings.com/trust/approvals",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(40,90%,54%,0.04) 0%, transparent 60%)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                  <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Trust Center</Link>
                  <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(40,90%,54%)" }}>Approvals</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(40,90%,54%,0.08)", border: "1px solid hsla(40,90%,54%,0.22)", borderRadius: "0.5625rem" }}>
                    <CheckSquare size={20} color="hsl(40,90%,54%)" />
                  </div>
                  <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>Approval Model</h1>
                </div>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                  Every consequential action in Lyte + Counsel passes through a tiered approval path.
                  The gate is enforced at the workflow execution layer — bypass requires an explicit,
                  logged override. Approvers receive full context. Every decision — including overrides
                  — is permanently recorded.
                </p>
              </m.div>
            </div>
          </section>
  
          {/* Approval path stages */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)", marginBottom: "1rem" }}>Approval path</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  Six stages from trigger to audit record.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {APPROVAL_PATH_STAGES.map((stage, i) => (
                  <m.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.42, delay: i * 0.07 }}
                  >
                    <div className="szl-card" style={{ borderRadius: "0.75rem", padding: "clamp(1.25rem,2.5vw,1.75rem)", display: "grid", gridTemplateColumns: "160px 1fr", gap: "clamp(1.5rem,3vw,2.5rem)", alignItems: "center", borderLeft: `3px solid ${stage.color}` }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: stage.color, marginBottom: "0.25rem", opacity: 0.8 }}>
                          Step {i + 1}
                        </div>
                        <div style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.015em", color: "hsl(38,8%,92%)" }}>{stage.label}</div>
                      </div>
                      <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{stage.desc}</p>
                    </div>
                    {i < APPROVAL_PATH_STAGES.length - 1 && (
                      <div style={{ display: "flex", justifyContent: "flex-start", padding: "0.5rem 0 0.5rem 1.5rem" }}>
                        <ArrowDown size={16} color="var(--color-szl-text-faint)" />
                      </div>
                    )}
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Approval tiers */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)", marginBottom: "1rem" }}>Four-tier model</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2rem" }}>
                  Approval requirements by action risk level.
                </h2>
              </m.div>
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} style={{ marginBottom: "2.5rem" }}>
                <ApprovalPathDiagram />
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
                {APPROVAL_TIERS.map((tier, i) => (
                  <m.div
                    key={tier.tier}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)", borderTop: `2px solid ${tier.color}` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", color: tier.color, background: tier.colorMuted, border: `1px solid ${tier.colorBorder}`, borderRadius: "0.375rem", padding: "0.1875rem 0.5rem" }}>{tier.tier}</span>
                      <span style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", color: "hsl(38,8%,88%)" }}>{tier.label}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,62%)", marginBottom: "1rem" }}>{tier.description}</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem 0", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {tier.examples.map((ex) => (
                        <li key={ex} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: tier.color, flexShrink: 0, marginTop: "7px", opacity: 0.7 }} />
                          <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,56%)" }}>{ex}</span>
                        </li>
                      ))}
                    </ul>
                    <div style={{ borderTop: "1px solid var(--color-szl-border)", paddingTop: "0.875rem" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, color: tier.color, marginBottom: "0.375rem" }}>{tier.gate}</div>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,48%)" }}>{tier.note}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* HITL principles */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)", marginBottom: "1rem" }}>Governing principles</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  How the approval model is designed.
                </h2>
              </m.div>
              <div className="szl-grid-2">
                {HITL_PRINCIPLES.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <m.div
                      key={p.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.06 }}
                      className="szl-card"
                      style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
                    >
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(40,90%,54%,0.08)", border: "1px solid hsla(40,90%,54%,0.22)", borderRadius: "0.4375rem", flexShrink: 0, marginTop: "1px" }}>
                        <Icon size={16} color="hsl(40,90%,54%)" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.625rem", lineHeight: 1.4 }}>{p.title}</h3>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{p.body}</p>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-sm) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/trust/governance" className="szl-btn-secondary">AI Governance →</Link>
                <Link href="/trust/exports" className="szl-btn-secondary">Export controls →</Link>
                <Link href="/contact" className="szl-btn-ghost">Discuss the approval model <ArrowRight size={13} /></Link>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
