import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, GitBranch, Layers, CheckSquare, FileText, AlertOctagon, Workflow, Shield, Zap } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  {
    icon: GitBranch,
    title: "Workflow Orchestration",
    body: "Alloy routes work through structured workflows with role-based assignment, escalation paths, and SLA tracking. Every task has an owner, a deadline, and a record.",
  },
  {
    icon: Layers,
    title: "Signal Normalization",
    body: "Alloy normalizes signals from Lyte and connected systems into a structured action queue — standardized priority, context, and routing logic regardless of the source.",
  },
  {
    icon: CheckSquare,
    title: "Human-in-the-Loop Gates",
    body: "Consequential actions require explicit human approval before execution. HITL gates are configurable by action type, risk level, and role — not an afterthought.",
  },
  {
    icon: AlertOctagon,
    title: "Escalation Logic",
    body: "Alloy escalates automatically when actions stall: reassignment, supervisor notification, or hard stops for high-risk situations. Nothing falls through the gap silently.",
  },
  {
    icon: FileText,
    title: "Audit Trail",
    body: "Every action, decision, approval, and outcome is logged with full attribution — who acted, when, with what authority, and what changed. Immutable and exportable.",
  },
  {
    icon: Workflow,
    title: "Connector Mesh",
    body: "Alloy's connector layer integrates with CRMs, communication tools, approval systems, and vertical-specific platforms. Execution happens where work already lives.",
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
];

export default function AlloyPage() {
  usePageMeta({
    title: "Alloy — Execution Fabric",
    description: "Alloy is the execution fabric beneath Lyte. Signal routing, workflow orchestration, human-in-the-loop approval, and immutable audit trail from signal to confirmed action.",
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
                Alloy · Execution Fabric
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
                    maxWidth: "20ch",
                  }}
                >
                  The execution layer that makes observability real.
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1rem,1.8vw,1.125rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,64%)",
                    maxWidth: "50ch",
                    marginBottom: "2.25rem",
                  }}
                >
                  Alloy is the fabric beneath Lyte. When Lyte surfaces a signal, Alloy routes it
                  to the right person through the right workflow — with human approval gates for
                  consequential decisions and an immutable audit trail for everything that follows.
                  Signal to confirmed action. No black boxes.
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
                  Alloy's role in the pipeline
                </p>
                {[
                  { step: "Receive", desc: "Signal arrives from Lyte or direct integration" },
                  { step: "Classify", desc: "Priority, severity, blast radius, routing key" },
                  { step: "Route", desc: "Right person, right context, right channel" },
                  { step: "Gate", desc: "Human approval for consequential actions" },
                  { step: "Execute", desc: "Confirmed action with authorization logged" },
                  { step: "Verify", desc: "Outcome tracked, exceptions escalated" },
                  { step: "Audit", desc: "Immutable record created and attributable" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: i < 6 ? "0.5rem" : 0 }}>
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
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Every layer of the execution stack, built for accountability.
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
                  Not just logging. Full attribution for every decision and action.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch", marginBottom: "1.5rem" }}>
                  Alloy's audit trail is designed for capital, compliance, and customer diligence —
                  not just internal debugging. Every field is structured, exportable, and tied to
                  an actor, a timestamp, and an authorization basis.
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
                  Talk to us about applying Alloy to one critical workflow — with Lyte for
                  observability and Alloy for governed execution.
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
