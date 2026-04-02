import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ArrowDown } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PIPELINE_STAGES = [
  {
    id: "signal",
    label: "Signal",
    sublabel: "Lyte / PRISM",
    color: "var(--color-lyte)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    desc: "Lyte's PRISM engine monitors connected systems for operational signals — approval latency, ownership gaps, performance anomalies, and threshold crossings. Signals are classified by type, severity, and urgency.",
    details: ["Continuous monitoring across connected integrations", "Signal classification: type, severity, velocity, blast radius", "Deduplication and correlation across signal sources", "Tenant-isolated signal namespace"],
  },
  {
    id: "interpretation",
    label: "Interpretation",
    sublabel: "Context enrichment",
    color: "var(--color-lyte-light)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    desc: "Raw signals are enriched with context: what team or system generated it, what's the historical pattern, who is the responsible party, and what's the recommended response frame.",
    details: ["Owner attribution from role and workflow metadata", "Historical pattern context (is this anomalous?)", "Risk scoring: severity × probability × blast radius", "Recommended response category assigned"],
  },
  {
    id: "recommendation",
    label: "Recommendation",
    sublabel: "Alloy proposes action",
    color: "var(--color-alloy-light)",
    colorMuted: "var(--color-alloy-muted)",
    colorBorder: "var(--color-alloy-border)",
    desc: "Alloy receives the interpreted signal and generates a structured action recommendation — specific action type, responsible actor, routing path, and SLA expectation. Not a generic alert.",
    details: ["Structured recommendation: action type + actor + SLA", "Routing logic applied: role, urgency, escalation path", "Evidence package assembled for approver review", "Confidence level and basis documented"],
  },
  {
    id: "approval",
    label: "Approval",
    sublabel: "Human-in-the-loop gate",
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.08)",
    colorBorder: "hsla(40,90%,54%,0.20)",
    desc: "The approver reviews the signal context, recommendation, and evidence package. They approve, modify, defer, or reject the proposed action. Their decision is recorded with attribution before anything executes.",
    details: ["Approver receives full context: signal → interpretation → recommendation", "Approve, modify, defer, or reject", "Rationale field required for high-impact actions", "Override record created when HITL gate bypassed"],
  },
  {
    id: "action",
    label: "Action",
    sublabel: "Alloy executes",
    color: "var(--color-alloy)",
    colorMuted: "var(--color-alloy-muted)",
    colorBorder: "var(--color-alloy-border)",
    desc: "With approval confirmed, Alloy executes the action through the appropriate connector — task assignment, notification, external API call, or system update. Execution is scoped to the approved action only.",
    details: ["Action scoped to approved parameters only", "Execution timestamped and attributed", "Connector logs capture before/after state", "SLA clock starts on execution"],
  },
  {
    id: "audit",
    label: "Audit",
    sublabel: "Immutable record",
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.20)",
    desc: "The complete pipeline record — signal, interpretation, recommendation, approval decision, execution, and outcome — is written to the immutable audit trail. Exportable, attributable, and structured for compliance review.",
    details: ["Full pipeline record: 6-stage complete trace", "Immutable write, structured schema", "Exportable: JSON, CSV for compliance tools", "Outcome verification: did the action achieve its intent?"],
  },
];

const TENANT_ARCH = [
  { label: "Tenant namespace isolation", body: "Every tenant has an isolated signal and workflow namespace. Cross-tenant data access is not possible by architectural design." },
  { label: "Role-scoped action model", body: "What a user can see, recommend, approve, and execute is determined by their role within their tenant. Roles are defined by the tenant admin, not the platform." },
  { label: "Domain pack layering", body: "Vertical domain packs (Aegis, Vessels, Terra) extend the core platform with domain-specific signal vocabulary and workflow logic — they do not bypass the core governance model." },
  { label: "Connector permissions", body: "Each external integration has scoped permissions. A connector to a task system cannot read financial records, and vice versa, unless explicitly configured and approved." },
];

export default function TrustArchitecturePage() {
  usePageMeta({
    title: "Architecture — Trust Center · SZL Holdings",
    description: "Signal → interpretation → recommendation → approval → action → audit pipeline. Tenant-aware architecture, role-scoped action model, domain pack design.",
    canonical: "https://szlholdings.com/trust/architecture",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture szl-depth-glow-dual" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Trust Center</Link>
                <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-lyte-light)" }}>Architecture</span>
              </div>
              <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08, marginBottom: "1.5rem" }}>
                Platform Architecture
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                The signal → interpretation → recommendation → approval → action → audit pipeline,
                tenant-aware architecture, role-scoped action model, and domain pack design — all
                documented for technical and governance diligence.
              </p>
            </m.div>
          </div>
        </section>

        {/* Pipeline diagram */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Pipeline</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Six stages from signal to audit record.
              </h2>
            </m.div>

            {/* Flow diagram */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {PIPELINE_STAGES.map((stage, i) => (
                <m.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.42, delay: i * 0.07 }}
                >
                  <div
                    className="szl-card szl-grid-3"
                    style={{
                      borderRadius: "0.75rem",
                      padding: "clamp(1.25rem,2.5vw,1.75rem)",
                      gap: "clamp(1.5rem,3vw,2.5rem)",
                      alignItems: "start",
                      borderLeft: `3px solid ${stage.color}`,
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: stage.color, marginBottom: "0.25rem", opacity: 0.85 }}>
                        Stage {i + 1}
                      </div>
                      <div style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.015em", color: "hsl(38,8%,92%)", marginBottom: "0.25rem" }}>{stage.label}</div>
                      <div style={{ fontSize: "0.8125rem", color: "hsl(214,7%,50%)" }}>{stage.sublabel}</div>
                    </div>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{stage.desc}</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4375rem" }}>
                      {stage.details.map((d) => (
                        <li key={d} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: stage.color, flexShrink: 0, marginTop: "8px" }} />
                          <span style={{ fontSize: "0.8375rem", lineHeight: 1.55, color: "hsl(214,7%,60%)" }}>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div style={{ display: "flex", justifyContent: "flex-start", padding: "0.5rem 0 0.5rem 1.5rem" }}>
                      <ArrowDown size={16} color="var(--color-szl-text-faint)" />
                    </div>
                  )}
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tenant architecture */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Tenant model</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Isolation, scoping, and domain pack architecture.
              </h2>
            </m.div>
            <div className="szl-grid-2">
              {TENANT_ARCH.map((item, i) => (
                <m.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                >
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem", color: "hsl(38,8%,88%)" }}>{item.label}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/trust/security" className="szl-btn-secondary">Security posture →</Link>
              <Link href="/trust/governance" className="szl-btn-secondary">AI Governance →</Link>
              <Link href="/contact" className="szl-btn-ghost">Technical diligence conversation <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
