import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Brain, CheckSquare, FileText, AlertOctagon, Eye, GitBranch } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOVERNANCE_PRINCIPLES = [
  {
    icon: Brain,
    title: "AI Does Not Act Autonomously on Consequential Decisions",
    body: "Every action that materially affects an operator, customer, or system state requires explicit human approval before execution. AI is used for signal detection, classification, and recommendation — not for taking unreviewed action.",
  },
  {
    icon: CheckSquare,
    title: "Human-in-the-Loop Gates Are Configurable, Not Optional",
    body: "HITL approval gates are built into the Alloy execution model at the action-type level. Which actions require approval, who can approve them, and what information they receive are all configurable — but bypassing a gate requires an explicit, attributed override record. There is no silent skip path.",
  },
  {
    icon: FileText,
    title: "Decision Lineage Is Complete and Exportable",
    body: "Every AI recommendation includes the signal that triggered it, the model or logic that produced it, the confidence context, and the human approval (or override) that authorized execution. The full lineage is a first-class output, not a log afterthought.",
  },
  {
    icon: AlertOctagon,
    title: "Overrides and Exceptions Are Recorded, Not Hidden",
    body: "When a human overrides an AI recommendation — or approves an action that the system flagged as high-risk — that override is recorded with full attribution, rationale, and timestamp. Exception patterns are surfaced for review.",
  },
  {
    icon: Eye,
    title: "Model Behavior Is Observable, Not Opaque",
    body: "Operators can understand why Lyte surfaced a signal or Alloy proposed an action. Signal classification criteria, confidence levels, and routing logic are documented and surfaceable. No black boxes on consequential decisions.",
  },
  {
    icon: GitBranch,
    title: "Audit Trail Is Designed for Capital and Compliance Diligence",
    body: "The governance audit trail is structured for external review — LP reporting, regulatory inquiry, or enterprise compliance review. Fields, formats, and export paths are designed from that use case backward.",
  },
];

const HITL_MODEL = [
  { action: "Signal classification", gate: "Automated (configurable review threshold)", note: "High-confidence classifications routed without approval; low-confidence queued for review." },
  { action: "Action recommendation", gate: "Human review required", note: "All Alloy action recommendations are reviewed before dispatch." },
  { action: "Low-impact action", gate: "Single approver", note: "Routine workflow tasks with defined scope." },
  { action: "High-impact action", gate: "Dual approval + rationale", note: "Actions affecting external systems, financials, or customer records." },
  { action: "Emergency override", gate: "Post-hoc review required", note: "Override is permitted; immediately logged and flagged for mandatory review." },
  { action: "Irreversible action", gate: "Senior approver + audit record", note: "Actions that cannot be undone require elevated authorization and complete documentation." },
];

export default function TrustGovernancePage() {
  usePageMeta({
    title: "AI Governance — Trust Center · SZL Holdings",
    description: "Lyte + Alloy AI governance: human-in-the-loop approval model, decision lineage tracking, override documentation, and responsible AI execution.",
    canonical: "https://szlholdings.com/trust/governance",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture szl-depth-glow-alloy" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Trust Center</Link>
                <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-alloy-light)" }}>Governance</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", borderRadius: "0.5625rem" }}>
                  <Brain size={20} color="var(--color-alloy-light)" />
                </div>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>AI Governance</h1>
              </div>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                How Lyte + Alloy uses AI responsibly — with human-in-the-loop approval gates,
                complete decision lineage, observable model behavior, and documented override
                processes for every consequential action.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-alloy-light)", marginBottom: "1rem" }}>Six principles</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                How we build AI into Lyte + Alloy.
              </h2>
            </m.div>
            <div className="szl-grid-2">
              {GOVERNANCE_PRINCIPLES.map((p, i) => {
                const Icon = p.icon;
                return (
                  <m.div key={p.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-alloy-muted)", border: "1px solid var(--color-alloy-border)", borderRadius: "0.4375rem", flexShrink: 0, marginTop: "1px" }}>
                      <Icon size={16} color="var(--color-alloy-light)" />
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

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-alloy-light)", marginBottom: "1rem" }}>HITL Model</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Which actions require human approval and why.
              </h2>
            </m.div>
            <div className="szl-card" style={{ borderRadius: "0.875rem", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Action type</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Approval gate</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Note</span>
              </div>
              {HITL_MODEL.map((row, i) => (
                <m.div
                  key={row.action}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1.2fr",
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < HITL_MODEL.length - 1 ? "1px solid var(--color-szl-border)" : "none",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,85%)" }}>{row.action}</span>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-alloy-light)", fontWeight: 500 }}>{row.gate}</span>
                  <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55 }}>{row.note}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/trust/security" className="szl-btn-secondary">Security posture →</Link>
              <Link href="/trust/architecture" className="szl-btn-secondary">Architecture →</Link>
              <Link href="/contact" className="szl-btn-ghost">Discuss governance <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
