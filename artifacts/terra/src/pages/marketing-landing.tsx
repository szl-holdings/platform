import { ArrowRight, Activity, BarChart3, AlertCircle, TrendingUp, CheckCircle, Database, Zap } from "lucide-react";

const capabilities = [
  {
    icon: Activity,
    title: "Workflow Health",
    desc: "Continuous monitoring of business process health — latency, completion rates, stall events, and exception patterns across every workflow.",
  },
  {
    icon: TrendingUp,
    title: "Value Recovery",
    desc: "Identify where value is being left on the table — delayed approvals, incomplete processes, ownership gaps with quantified cost.",
  },
  {
    icon: AlertCircle,
    title: "Drift Detection",
    desc: "Early warning when performance, behavior, or outcomes begin deviating from expected baselines — before the drift becomes a crisis.",
  },
  {
    icon: BarChart3,
    title: "Business Telemetry",
    desc: "Real-time operational metrics across teams, processes, and systems — the instrumentation layer for data-driven command.",
  },
  {
    icon: Database,
    title: "Signal Aggregation",
    desc: "Multi-source data acquisition and normalization — from operational systems, financial feeds, and custom integrations.",
  },
  {
    icon: CheckCircle,
    title: "Predictive Insights",
    desc: "Forward-looking intelligence: what's likely to go wrong, which deals are at risk, and where intervention is needed before it's urgent.",
  },
];

const whoItsFor = [
  { role: "Business Leaders", desc: "Portfolio-level telemetry. See what's performing, what's drifting, and where decisions are needed — in one command view." },
  { role: "Operations Teams", desc: "Real-time process health across every workflow. Identify friction, measure improvement, and track execution quality." },
  { role: "Data & Finance Teams", desc: "Structured business telemetry for reporting, forecasting, and performance analysis — with the context that raw data lacks." },
];

export default function BeaconMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const accent = "#a07848";
  const accentLight = "#c8a96a";

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e2e8f0", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,12,20,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${accent}14`,
        height: "60px", display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: `${accent}1a`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={14} style={{ color: accentLight }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em", color: "#e2e8f0" }}>Beacon</span>
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
                background: `${accent}1a`, border: `1px solid ${accent}40`, color: accentLight,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}30`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}1a`; }}
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
          background: `radial-gradient(ellipse 60% 50% at 50% -10%, ${accent}0d 0%, transparent 65%)`,
        }} />
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem",
            padding: "4px 12px 4px 8px", borderRadius: "4px",
            background: `${accent}0f`, border: `1px solid ${accent}25`,
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: accentLight, display: "inline-block", boxShadow: `0 0 6px ${accentLight}99` }} />
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: accentLight }}>Business Telemetry</span>
          </div>

          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.75rem)", fontWeight: 700, letterSpacing: "-0.032em", lineHeight: 1.05, color: "#f1f5f9", marginBottom: "1.25rem" }}>
            Business telemetry<br />for operators who need<br />to see everything.
          </h1>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.72, color: "#64748b", maxWidth: "36rem", margin: "0 auto 2.5rem" }}>
            Beacon is the business observability layer for SZL Holdings. It observes workflow health, detects drift, surfaces value recovery opportunities, and delivers predictive intelligence for operational command.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onSignIn}
              style={{
                padding: "12px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                background: accentLight, color: "#080c14", border: "none", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accent; (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentLight; (e.currentTarget as HTMLButtonElement).style.color = "#080c14"; }}
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

      {/* What It Observes */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }} className="beacon-grid">
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: accentLight, marginBottom: "0.75rem" }}>What Beacon Observes</p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1.25rem" }}>
                Everything that moves through your business.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b", marginBottom: "1rem" }}>
                Beacon is the instrumentation layer that makes your business legible. Not just financials — the operational reality: workflows completing or stalling, ownership clear or absent, performance tracking or drifting.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b" }}>
                Powered by Alloy, Beacon normalizes signals from multiple operational systems, applies business logic to classify them, and presents structured intelligence rather than raw data dumps.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Operational workflows", desc: "Approvals, handoffs, task completion, exception events across every business process" },
                { label: "Financial signals", desc: "Deal pipeline, revenue metrics, cost drivers, and forecast variance" },
                { label: "Team performance", desc: "Velocity, capacity, ownership, and delivery quality across teams" },
                { label: "System integrations", desc: "Custom connectors to your operational tech stack — CRM, ERP, task management, and beyond" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: "12px", padding: "14px 16px", borderRadius: "6px", background: `${accent}0a`, border: `1px solid ${accent}18` }}>
                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: accentLight, flexShrink: 0, marginTop: "6px" }} />
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

      {/* Key Capabilities */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0", background: `${accent}08` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "0.75rem" }}>Key Capabilities</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "2.5rem" }}>
            Intelligence across every layer.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="caps-grid">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                style={{
                  padding: "1.5rem", borderRadius: "6px",
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${accent}0d`;
                  el.style.borderColor = `${accent}25`;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = `0 8px 24px ${accent}10`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.025)";
                  el.style.borderColor = "rgba(255,255,255,0.06)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <cap.icon size={15} style={{ color: accentLight, marginBottom: "10px" }} />
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#e2e8f0", marginBottom: "6px" }}>{cap.title}</p>
                <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#475569" }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "0.75rem" }}>Who It's For</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "2.5rem" }}>
            Built for operators, not analysts.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="who-grid">
            {whoItsFor.map((w) => (
              <div
                key={w.role}
                style={{
                  padding: "1.75rem", borderRadius: "6px",
                  background: `${accent}08`, border: `1px solid ${accent}15`,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${accent}12`;
                  el.style.borderColor = `${accent}28`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${accent}08`;
                  el.style.borderColor = `${accent}15`;
                }}
              >
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: accentLight, marginBottom: "0.5rem" }}>{w.role}</p>
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#94a3b8" }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Powered by Alloy */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2rem 0", background: "rgba(92,155,228,0.03)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "4px", height: "32px", borderRadius: "2px", background: "#5c9be4", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c9be4", marginBottom: "3px" }}>Powered by Alloy</p>
            <p style={{ fontSize: "13px", color: "#475569" }}>Beacon runs on the Alloy orchestration engine — every signal is acquired, normalized, and reasoned upon by the same intelligence layer powering the entire SZL ecosystem.</p>
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
            Access Beacon
          </h2>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "#64748b", marginBottom: "2rem" }}>
            Sign in to access the Beacon business telemetry platform, or request a demonstration for your organization.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onSignIn}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "12px 28px", borderRadius: "6px",
                fontSize: "14px", fontWeight: 600, cursor: "pointer", background: accentLight, color: "#080c14", border: "none", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accent; (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentLight; (e.currentTarget as HTMLButtonElement).style.color = "#080c14"; }}
            >
              Sign in to Beacon
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
          © {new Date().getFullYear()} Beacon · SZL Holdings · inquiries@szlholdings.com
        </p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .beacon-grid, .caps-grid, .who-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
