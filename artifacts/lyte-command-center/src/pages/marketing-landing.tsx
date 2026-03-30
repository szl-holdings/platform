import { ArrowRight, Zap, Activity, CheckSquare, Users, AlertOctagon, Shield, TrendingDown, Clock, Eye } from "lucide-react";

const useCases = [
  { title: "Approval Latency", desc: "Identify which approvals are stalling, by whom, and for how long — before the delay compounds." },
  { title: "Ownership Gaps", desc: "Surface processes with no clear owner. Assign accountability before work falls through the cracks." },
  { title: "Workflow Friction", desc: "Map where handoffs break, where steps bottleneck, and what's preventing clean execution." },
  { title: "Escalation Detection", desc: "Identify what needs to escalate, to whom, and why — with Alloy-generated rationale attached." },
  { title: "Readiness Tracking", desc: "Structured view of execution readiness across every team, milestone, and initiative." },
  { title: "Decision Velocity", desc: "Measure how quickly decisions are made, who's blocking, and where the friction lives." },
];

const roleViews = [
  {
    role: "Executive",
    headline: "Portfolio-level command",
    desc: "See risk, latency, and ownership gaps across the entire business in a single view. No status meetings required.",
    accent: "#f59e0b",
  },
  {
    role: "Operations",
    headline: "Execution oversight",
    desc: "Track every workflow, assignment, and handoff. Know what's stalled, what's overdue, and what needs your decision.",
    accent: "#f59e0b",
  },
  {
    role: "Delivery",
    headline: "Team and task clarity",
    desc: "Clear ownership of every action item. Escalation paths that actually work. Readiness scores before milestones hit.",
    accent: "#f59e0b",
  },
];

export default function LyteMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e2e8f0", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,12,20,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,158,11,0.08)",
        height: "60px", display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={14} style={{ color: "#f59e0b" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em", color: "#e2e8f0" }}>Lyte</span>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#475569", marginLeft: "4px" }}>by SZL Holdings</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a href="/" style={{ fontSize: "13px", color: "#64748b", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
              SZL Holdings
            </a>
            <button
              onClick={onSignIn}
              style={{
                padding: "6px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.18)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.1)"; }}
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: "120px", paddingBottom: "80px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(245,158,11,0.05) 0%, transparent 65%)",
        }} />
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem",
            padding: "4px 12px 4px 8px", borderRadius: "4px",
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f59e0b", display: "inline-block", boxShadow: "0 0 6px rgba(245,158,11,0.6)" }} />
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b" }}>Business Observability</span>
          </div>

          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.75rem)", fontWeight: 700, letterSpacing: "-0.032em", lineHeight: 1.05, color: "#f1f5f9", marginBottom: "1.25rem" }}>
            See risk, latency, ownership gaps,<br />and workflow friction before they<br />hit execution.
          </h1>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.72, color: "#64748b", maxWidth: "36rem", margin: "0 auto 2.5rem" }}>
            Lyte gives operators, executives, and teams a real-time command view of what's stalling, who owns what, and where decisions are falling behind.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onSignIn}
              style={{
                padding: "12px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                background: "#f59e0b", color: "#080c14", border: "none", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#d97706"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f59e0b"; }}
            >
              Sign in to Platform
            </button>
            <a
              href="mailto:inquiries@szlholdings.com"
              style={{
                padding: "12px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: "pointer", textDecoration: "none",
                background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.10)", transition: "all 0.15s",
                display: "inline-flex", alignItems: "center", gap: "6px",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
            >
              Request a Demo
              <ArrowRight size={13} strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>

      {/* What Lyte Does */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }} className="lyte-grid">
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f59e0b", marginBottom: "0.75rem" }}>What Lyte Does</p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1.25rem" }}>
                Business command.<br />Not another dashboard.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b", marginBottom: "1rem" }}>
                Lyte is not a reporting tool. It is an operating command surface. It surfaces what's actually happening across your business — who owns what, what's stalling, what's at risk — and routes accountability to the right person.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b" }}>
                Powered by Alloy, Lyte turns operational signals into structured actions, approvals, and escalations — so decisions happen at the right time by the right person.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { icon: Eye, label: "Signal Visibility", desc: "Real-time view of what's happening across every workflow, team, and process" },
                { icon: Activity, label: "Anomaly Detection", desc: "Automatic identification of latency, ownership gaps, and workflow friction" },
                { icon: CheckSquare, label: "Action Routing", desc: "Decisions, approvals, and tasks routed to the right person at the right time" },
                { icon: Shield, label: "Readiness Scoring", desc: "Execution readiness tracked and scored before milestones arrive" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: "12px", padding: "14px 16px", borderRadius: "6px", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)" }}>
                  <item.icon size={15} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "2px" }}>{item.label}</p>
                    <p style={{ fontSize: "12px", lineHeight: 1.55, color: "#475569" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How Lyte Works — Signal flow */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0", background: "rgba(245,158,11,0.015)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "0.75rem" }}>How Lyte Works</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "2.5rem" }}>
            Signals → Insights → Actions.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }} className="flow-grid">
            {[
              {
                step: "01",
                label: "Signals",
                icon: Activity,
                desc: "Lyte ingests operational data from your business systems — approvals, deadlines, ownership, workflow state, and exception events.",
                color: "#f59e0b",
              },
              {
                step: "02",
                label: "Insights",
                icon: Eye,
                desc: "Alloy's reasoning layer classifies signals, scores their consequence, identifies ownership, and surfaces what actually matters — not just noise.",
                color: "#f59e0b",
              },
              {
                step: "03",
                label: "Actions",
                icon: CheckSquare,
                desc: "Structured actions, approvals, and escalations are routed to the right person. Decisions happen with context, not just alerts.",
                color: "#f59e0b",
              },
            ].map((step, i) => (
              <div
                key={step.step}
                style={{
                  padding: "1.75rem", borderRadius: "6px",
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                  borderTop: `2px solid rgba(245,158,11,${0.5 - i * 0.1})`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.08em" }}>{step.step}</span>
                  <step.icon size={15} style={{ color: "#f59e0b" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.005em" }}>{step.label}</span>
                </div>
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#475569" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Command */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "0.75rem" }}>Role-Based Command</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "0.75rem" }}>
            Built for every layer of the org.
          </h2>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b", marginBottom: "2.5rem", maxWidth: "32rem" }}>
            Executives see risk. Ops sees friction. Delivery sees actions. Everyone sees what they need.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="roles-grid">
            {roleViews.map((r) => (
              <div
                key={r.role}
                style={{
                  padding: "1.75rem", borderRadius: "6px",
                  background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(245,158,11,0.08)";
                  el.style.borderColor = "rgba(245,158,11,0.22)";
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 8px 24px rgba(245,158,11,0.08)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(245,158,11,0.04)";
                  el.style.borderColor = "rgba(245,158,11,0.10)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", marginBottom: "0.5rem" }}>{r.role}</p>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.75rem", letterSpacing: "-0.012em" }}>{r.headline}</p>
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#475569" }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "0.75rem" }}>Use Cases</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "2.5rem" }}>
            Six problems Lyte solves.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="usecases-grid">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                style={{
                  padding: "1.25rem", borderRadius: "4px",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(245,158,11,0.05)";
                  el.style.borderColor = "rgba(245,158,11,0.15)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.02)";
                  el.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>{uc.title}</p>
                <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#475569" }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "0.75rem" }}>Why It Matters</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1.25rem" }}>
            Execution quality is a leadership advantage.
          </h2>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.75, color: "#64748b", marginBottom: "1rem" }}>
            Most organizations don't fail because of bad strategy. They fail because execution breaks down — approvals stall, ownership blurs, decisions happen too late or with too little context.
          </p>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.75, color: "#64748b" }}>
            Lyte makes execution visible. It makes accountability structural. And it routes the right decisions to the right people — before the damage is done.
          </p>
        </div>
      </section>

      {/* Powered by Alloy */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2rem 0", background: "rgba(92,155,228,0.03)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "4px", height: "32px", borderRadius: "2px", background: "#5c9be4", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c9be4", marginBottom: "3px" }}>Powered by Alloy</p>
            <p style={{ fontSize: "13px", color: "#475569" }}>Lyte runs on the Alloy orchestration engine — every signal, workflow, and decision is backed by the same intelligence layer powering the entire SZL ecosystem.</p>
          </div>
          <a
            href="/alloy/"
            style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 600, color: "#5c9be4", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0, transition: "opacity 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            View Alloy <ArrowRight size={12} />
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: "#f1f5f9", marginBottom: "1rem" }}>
            Access the platform
          </h2>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "#64748b", marginBottom: "2rem" }}>
            Sign in to access Lyte, or request a demonstration for your team.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onSignIn}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "12px 28px", borderRadius: "6px",
                fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "#f59e0b", color: "#080c14", border: "none", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#d97706"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f59e0b"; }}
            >
              Sign in to Lyte
              <ArrowRight size={14} />
            </button>
            <a
              href="mailto:inquiries@szlholdings.com"
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "12px 28px", borderRadius: "6px",
                fontSize: "14px", fontWeight: 500, cursor: "pointer", textDecoration: "none",
                background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.10)", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
            >
              Request a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#334155", fontFamily: "monospace" }}>
          © {new Date().getFullYear()} Lyte · SZL Holdings · inquiries@szlholdings.com
        </p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .lyte-grid, .flow-grid, .roles-grid, .usecases-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
