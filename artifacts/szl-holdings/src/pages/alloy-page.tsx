import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, GitBranch, Layers, CheckSquare, FileText, AlertOctagon, Workflow, Shield, Zap, Lock, Download, RefreshCw } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  {
    icon: GitBranch,
    title: "Workflow Orchestration",
    body: "Alloy routes work through structured workflows with role-based assignment, escalation paths, and SLA tracking. Every task has an owner, a deadline, and a record. No action falls through untracked.",
  },
  {
    icon: CheckSquare,
    title: "Human-in-the-Loop Gates",
    body: "Consequential actions require explicit human approval before execution. HITL gates are configurable by action type, risk level, and role — enforced as a structural constraint, not a policy afterthought.",
  },
  {
    icon: AlertOctagon,
    title: "Escalation Logic",
    body: "When actions stall, Alloy escalates automatically — reassignment, supervisor notification, or hard stops for high-risk situations. Nothing falls through silently. Every exception is tracked.",
  },
  {
    icon: FileText,
    title: "Immutable Audit Trail",
    body: "Every action, decision, approval, and outcome is logged with full attribution — who acted, when, with what authority, and what changed. Structured, immutable, and exportable for compliance and capital review.",
  },
  {
    icon: Download,
    title: "Export & Write-Back Controls",
    body: "Alloy governs how outputs leave the system — structured exports, redaction controls, and write-back authorizations. Every data movement has an owner and a record.",
  },
  {
    icon: Layers,
    title: "Signal Normalization",
    body: "Alloy normalizes signals from Lyte and connected systems into a structured action queue — standardized priority, context, and routing logic regardless of the originating pack or data source.",
  },
  {
    icon: Workflow,
    title: "Connector Mesh",
    body: "Alloy's connector layer integrates with CRMs, communication tools, approval systems, and vertical-specific platforms. Execution happens where work already lives — no rip and replace.",
  },
  {
    icon: RefreshCw,
    title: "Cross-Pack Orchestration",
    body: "A single Alloy action can span multiple packs. An Aegis incident can trigger a Terra diligence hold. A PRISM Counsel approval can gate a Vessels cargo clearance. Alloy orchestrates across the portfolio.",
  },
  {
    icon: Zap,
    title: "Execution Verification",
    body: "Alloy doesn't just route. It verifies outcomes — confirming actions taken, tracking exceptions where actions weren't taken, and escalating when execution diverges from approval.",
  },
];

const AUDIT_FIELDS = [
  "Actor identity (role + name)",
  "Timestamp and duration",
  "Decision context and rationale",
  "Before/after state",
  "Authorization basis",
  "Escalation path taken",
  "Outcome classification",
  "Linked signal reference",
  "AI involvement flag",
  "Export and write-back log",
];

const PIPELINE_STEPS = [
  { step: "Receive", desc: "Signal arrives from Lyte or direct integration" },
  { step: "Classify", desc: "Priority, severity, blast radius, routing key" },
  { step: "Route", desc: "Right person, right context, right channel" },
  { step: "Gate", desc: "Human approval for consequential actions" },
  { step: "Execute", desc: "Confirmed action with authorization logged" },
  { step: "Verify", desc: "Outcome tracked, exceptions escalated" },
  { step: "Export", desc: "Controlled output with redaction and write-back log" },
  { step: "Audit", desc: "Immutable record created and attributable" },
];

export default function AlloyPage() {
  usePageMeta({
    title: "Alloy — Execution Fabric & Action Spine | SZL Holdings",
    description: "Alloy is the execution fabric beneath every SZL Holdings product. Approvals, workflows, orchestration, audit trail, and governed export and write-back controls.",
    canonical: "https://szlholdings.com/alloy-fabric",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
        <section
          className="szl-grid-texture szl-depth-glow-alloy"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(5rem,9vw,7rem)",
            borderBottom: "1px solid var(--color-szl-border)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="szl-badge-alloy" style={{ borderRadius: "9999px", marginBottom: "1.75rem", display: "inline-block" }}>
                Alloy · Execution Fabric & Action Spine
              </span>
            </m.div>

            <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.2fr_0.8fr]">
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                <h1
                  style={{
                    fontSize: "clamp(2.5rem,5.5vw,4.25rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                    marginBottom: "1.5rem",
                    maxWidth: "22ch",
                  }}
                >
                  The action spine that makes intelligence accountable.
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1rem,1.8vw,1.125rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,64%)",
                    maxWidth: "50ch",
                    marginBottom: "0.875rem",
                  }}
                >
                  Alloy is the execution fabric beneath every SZL Holdings product. When Lyte or any pack surfaces a signal, Alloy routes it through structured workflows — with human approval gates for consequential decisions, governed export and write-back controls, and an immutable audit trail for everything that follows.
                </p>
                <p
                  style={{
                    fontSize: "clamp(0.9375rem,1.6vw,1rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,52%)",
                    maxWidth: "50ch",
                    marginBottom: "2.25rem",
                  }}
                >
                  Signal to confirmed action. No black boxes. No autonomous execution without approval.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/demo" className="szl-btn-primary">
                    See Alloy in action <ArrowRight size={15} />
                  </Link>
                  <Link href="/trust/architecture" className="szl-btn-secondary">
                    Architecture overview
                  </Link>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className="szl-alloy-card"
                style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                  Alloy's role in every pipeline
                </p>
                {PIPELINE_STEPS.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: i < PIPELINE_STEPS.length - 1 ? "0.5rem" : 0 }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 700, color: "var(--color-alloy-light)" }}>{i + 1}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-alloy-light)", letterSpacing: "-0.01em" }}>{item.step}</span>
                      <span style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-muted)", marginLeft: "0.5rem" }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </m.div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-alloy-light)", marginBottom: "1rem" }}>
                Capabilities
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                Every layer of the execution stack, built for accountability and control.
              </h2>
            </m.div>
            <div className="szl-grid-3">
              {CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <m.div
                    key={cap.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                  >
                    <div
                      style={{
                        width: "36px", height: "36px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--color-alloy-muted)",
                        border: "1px solid var(--color-alloy-border)",
                        borderRadius: "0.4375rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <Icon size={16} color="var(--color-alloy-light)" />
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Audit trail detail */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-alloy-light)", marginBottom: "1rem" }}>
                  Audit-grade execution
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                  Not just logging. Full attribution for every decision, action, and export.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch", marginBottom: "1.5rem" }}>
                  Alloy's audit trail is designed for capital, compliance, and customer diligence — not just internal debugging. Every field is structured, exportable, and tied to an actor, a timestamp, and an authorization basis. Export logs capture where data went, who authorized it, and what controls applied.
                </p>
                <Link href="/trust/governance" className="szl-btn-ghost" style={{ paddingLeft: 0 }}>
                  See governance architecture <ArrowRight size={14} />
                </Link>
              </m.div>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.10 }}
                className="szl-alloy-card"
                style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1.25rem" }}>
                  Every audit record captures
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  {AUDIT_FIELDS.map((field) => (
                    <div key={field} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <Shield size={12} color="var(--color-alloy-light)" style={{ marginTop: "3px", flexShrink: 0, opacity: 0.7 }} />
                      <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,68%)" }}>{field}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Export and write-back */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-alloy-light)", marginBottom: "1rem" }}>
                Controlled Outputs
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "1.5rem" }}>
                Every export and write-back is governed, not assumed.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                Alloy treats data movement as a consequential action. Exports to Word, PDF, or external systems require authorization. Write-backs to connected platforms are tracked. Redaction rules apply at the record level. Nothing leaves without a record of where it went.
              </p>
            </m.div>
            <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3">
              {[
                { icon: Download, title: "Structured Export", body: "Demand letters, audit packets, compliance reports, and data exports governed by format, content, and authorization controls." },
                { icon: Lock, title: "Redaction Controls", body: "Privilege-aware, PII-aware, and role-aware redaction applied at the record level before any export leaves the system." },
                { icon: RefreshCw, title: "Write-Back Governance", body: "Data written back to CRMs, case management systems, or connected platforms is tracked with actor attribution and authorization basis." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                  >
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                      <Icon size={16} color="var(--color-alloy-light)" />
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-card szl-grid-cta"
              style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center" }}
            >
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.2, marginBottom: "0.875rem" }}>
                  Ready to add execution accountability to your workflows?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                  Talk to us about applying Alloy to one critical workflow — with Lyte for portfolio observability and Alloy for governed, auditable execution.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/contact" className="szl-btn-primary">
                  Start a conversation <ArrowRight size={14} />
                </Link>
                <Link href="/platform" className="szl-btn-secondary" style={{ textAlign: "center" }}>
                  Full platform overview
                </Link>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
