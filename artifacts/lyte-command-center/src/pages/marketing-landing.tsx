import { useState } from "react";
import {
  ArrowRight, Activity, Eye, TrendingUp, Radio, Gauge, Monitor,
  Network, Target, Users, Shield, GitBranch, Zap, CheckCircle,
  Mail, Calendar, MessageSquare, FileText, Database, Cloud,
  Briefcase, HeartPulse, Factory, CreditCard, CheckSquare,
} from "lucide-react";

const AMBER = "#f59e0b";
const AMBER_DIM = "rgba(245,158,11,0.08)";
const BG = "#080c14";
const SURFACE = "rgba(255,255,255,0.025)";
const BORDER = "rgba(255,255,255,0.06)";

const prism = [
  { key: "P", name: "Pulse", color: "#10b981", icon: Activity, meaning: "Business health, operating heartbeat, trend status, exposure rhythm", detail: "Pulse monitors the continuous rhythm of your operations — revenue velocity, delivery cadence, customer health, operational tempo. Not infrastructure uptime. Business uptime." },
  { key: "R", name: "Risk", color: "#ef4444", icon: Target, meaning: "Approvals, churn, delays, ownership gaps, regulatory exposure", detail: "Risk surfaces the slow-burn threats that compound silently: aging approvals, unowned processes, regulatory drift, customer churn signals. Each risk carries a time-to-impact and business cost." },
  { key: "I", name: "Intelligence", color: "#8b5cf6", icon: Eye, meaning: "Modeled reasoning, evidence, confidence, likely outcomes", detail: "Intelligence synthesizes signals into actionable recommendations with evidence chains and confidence scores. Not AI predictions — structured reasoning an executive can audit and trust." },
  { key: "S", name: "Signals", color: "#f59e0b", icon: Radio, meaning: "Anomalies, changes, event spikes, workflow drift", detail: "Signals captures state changes across your connected tools — a Jira queue doubling, a Salesforce pipeline stalling, a Slack channel going silent. Each signal is scored, attributed, and routed." },
  { key: "M", name: "Motion", color: "#0ea5e9", icon: Gauge, meaning: "Escalations, routing, approvals, interventions, workflow execution", detail: "Motion is the execution layer — routing decisions to the right person, escalating stalled work, triggering interventions, and tracking the velocity of organizational response." },
];

const pillars = [
  { name: "Visibility", desc: "See every operational surface — not just infrastructure. Revenue pipelines, approval queues, team handoffs, customer health, vendor dependencies. If it affects outcomes, Lyte shows it." },
  { name: "Context", desc: "Signals without context are noise. Lyte connects every anomaly to the business process it impacts, the owner responsible, and the financial exposure it creates." },
  { name: "Ownership", desc: "Every process, risk, and decision has an owner. Lyte maps accountability chains so nothing falls between teams, departments, or role boundaries." },
  { name: "Prioritization", desc: "Not everything is urgent. Lyte scores every signal by business impact, time sensitivity, and confidence — so operators work on what matters, not what's loudest." },
  { name: "Explainability", desc: "Every recommendation carries an evidence chain. No black-box AI. Executives see why something is flagged, what data supports it, and how confident the assessment is." },
  { name: "Intervention", desc: "Visibility without action is a spectator sport. Lyte routes decisions to the right person with full context — approve, escalate, delegate, or resolve." },
  { name: "Continuous Motion", desc: "Organizations don't stand still. Lyte tracks the velocity of improvement — are decisions getting faster? Are risks being caught earlier? Is the organization accelerating or decelerating?" },
];

const useCases = [
  { title: "A VP discovers a $400K revenue leak", scenario: "Three Salesforce deals stalled for 18 days. Lyte's Risk lens flagged the ownership gap — the assigned rep had left. Intelligence surfaced the churn probability at 72%. Motion routed the re-assignment to the sales director with full deal context. All three deals closed within 10 days of intervention.", lens: "Risk → Intelligence → Motion" },
  { title: "An ops lead prevents a delivery failure", scenario: "Pulse detected a 3x spike in Jira ticket cycle time for the platform team. Signals correlated it with a silent Slack channel — the lead engineer was on unplanned leave. Intelligence recommended redistributing the sprint backlog. The CTO approved the intervention before the client SLA was breached.", lens: "Pulse → Signals → Intelligence → Motion" },
  { title: "A CFO catches approval drag costing $120K/month", scenario: "Risk surfaced 14 procurement approvals aging past 30 days — each blocking vendor onboarding. Intelligence calculated the cumulative delay cost. Motion escalated the batch to the COO with a single-click approval flow. The entire backlog cleared in 48 hours.", lens: "Risk → Intelligence → Motion" },
];

const connectorsList = [
  { name: "Microsoft 365", icon: Mail }, { name: "Google Workspace", icon: Calendar },
  { name: "Slack", icon: MessageSquare }, { name: "Jira", icon: CheckSquare },
  { name: "Salesforce", icon: Briefcase }, { name: "ServiceNow", icon: Shield },
  { name: "GitHub", icon: GitBranch }, { name: "Snowflake", icon: Database },
  { name: "Azure DevOps", icon: Cloud }, { name: "HubSpot", icon: Target },
  { name: "Workday", icon: Users }, { name: "Stripe", icon: CreditCard },
  { name: "Zendesk", icon: HeartPulse }, { name: "Confluence", icon: FileText },
  { name: "SAP", icon: Factory }, { name: "NetSuite", icon: Monitor },
];

const navLinks = [
  { label: "PRISM", href: "#prism" },
  { label: "Pillars", href: "#pillars" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Connectors", href: "#connectors" },
];

export default function LyteMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const [expandedPrism, setExpandedPrism] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,12,20,0.92)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${BORDER}`, height: "56px",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 1.5rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={13} style={{ color: AMBER }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em" }}>Lyte</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textDecoration: "none", letterSpacing: "0.04em", fontWeight: 500 }}>{l.label}</a>
            ))}
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>SZL Holdings</span>
            <button onClick={onSignIn} style={{ fontSize: "12px", fontWeight: 600, color: "#080c14", background: AMBER, border: "none", borderRadius: "6px", padding: "6px 16px", cursor: "pointer" }}>Sign in</button>
          </div>
        </div>
      </nav>

      {/* Hero — Editorial, not centered template */}
      <section style={{ paddingTop: "120px", paddingBottom: "80px", maxWidth: "1120px", margin: "0 auto", padding: "120px 1.5rem 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "80px", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "20px", fontFamily: "monospace" }}>Business Observability Platform</p>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#f8fafc", marginBottom: "24px" }}>
              In the dark,<br />
              <span style={{ color: AMBER }}>let Lyte guide you.</span>
            </h1>
            <p style={{ fontSize: "17px", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", maxWidth: "520px", marginBottom: "36px" }}>
              Your business generates thousands of signals every day across dozens of tools.
              Most go unseen until the damage compounds. Lyte turns operational noise into
              prioritized human action — so executives see risk, operators see friction,
              and decisions happen before it's too late.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={onSignIn} style={{ fontSize: "13px", fontWeight: 600, background: AMBER, color: "#080c14", border: "none", borderRadius: "6px", padding: "10px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                Start Free Trial <ArrowRight size={14} />
              </button>
              <button style={{ fontSize: "13px", fontWeight: 500, background: "transparent", color: "rgba(255,255,255,0.6)", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "10px 24px", cursor: "pointer" }}>
                Request a Demo
              </button>
            </div>
          </div>

          {/* Right: PRISM mini preview */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "20px", marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>PRISM Analysis</span>
              <span style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>Live</span>
            </div>
            {prism.map((p) => (
              <div key={p.key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, fontFamily: "monospace", color: p.color, width: "14px" }}>{p.key}</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", flex: 1 }}>{p.name}</span>
                <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${60 + Math.random() * 30}%`, height: "100%", background: p.color, borderRadius: "2px", opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is Business Observability? */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ maxWidth: "680px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}>Defining the Category</p>
          <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f8fafc", marginBottom: "24px" }}>
            What is business observability?
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>
            Infrastructure observability tells you when a server is down. Business observability tells you
            when a <span style={{ color: "rgba(255,255,255,0.8)" }}>revenue pipeline is stalling</span>,
            an <span style={{ color: "rgba(255,255,255,0.8)" }}>approval is aging past its SLA</span>,
            a <span style={{ color: "rgba(255,255,255,0.8)" }}>team handoff is creating customer risk</span>,
            or a <span style={{ color: "rgba(255,255,255,0.8)" }}>process owner has gone silent</span>.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>
            Most operational damage doesn't happen because of a crash. It happens because signals go unseen
            across disconnected tools — Jira, Salesforce, Slack, ServiceNow, email — until the cost
            compounds past recovery. Lyte connects those signals into a single observable surface
            so executives and operators can act before the damage is done.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "32px" }}>
            {[
              { label: "Infrastructure Observability", items: ["Server uptime", "API latency", "Error rates", "Memory usage"], note: "Datadog, New Relic, Splunk" },
              { label: "Business Observability", items: ["Revenue velocity", "Approval aging", "Ownership gaps", "Decision latency"], note: "Lyte" },
            ].map(col => (
              <div key={col.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "20px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: col.label.includes("Business") ? AMBER : "rgba(255,255,255,0.3)", marginBottom: "12px" }}>{col.label}</p>
                {col.items.map(item => (
                  <p key={item} style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item}</p>
                ))}
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", marginTop: "8px", fontFamily: "monospace" }}>{col.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRISM */}
      <section id="prism" style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>The Analytical Framework</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f8fafc", marginBottom: "8px" }}>
          PRISM
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "40px", maxWidth: "560px" }}>
          Five analytical lenses that decompose operational complexity into structured, actionable intelligence.
          Every signal in Lyte passes through PRISM before it reaches a human.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {prism.map((p, i) => (
            <div
              key={p.key}
              onClick={() => setExpandedPrism(expandedPrism === i ? null : i)}
              style={{
                background: expandedPrism === i ? "rgba(255,255,255,0.035)" : SURFACE,
                border: `1px solid ${expandedPrism === i ? `${p.color}30` : BORDER}`,
                borderRadius: "8px", padding: "16px 20px", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, fontFamily: "monospace", color: p.color, width: "24px" }}>{p.key}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>{p.name}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginLeft: "12px" }}>{p.meaning}</span>
                </div>
                <p.icon size={16} style={{ color: p.color, opacity: 0.6 }} />
              </div>
              {expandedPrism === i && (
                <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", marginTop: "12px", marginLeft: "38px", maxWidth: "600px" }}>
                  {p.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7 Pillars */}
      <section id="pillars" style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>The Doctrine</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f8fafc", marginBottom: "8px" }}>
          The 7 Pillars of Business Observability
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "48px", maxWidth: "560px" }}>
          Every capability in Lyte maps to one of seven foundational pillars. Together, they form a
          complete doctrine for making operations visible, accountable, and continuously improving.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden" }}>
          {pillars.map((p, i) => (
            <div key={p.name} style={{ background: BG, padding: "28px 24px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "24px", fontWeight: 800, color: "rgba(245,158,11,0.15)", fontFamily: "monospace" }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>{p.name}</h3>
              </div>
              <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "rgba(255,255,255,0.4)" }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>How It Works</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f8fafc", marginBottom: "48px" }}>
          Real workflows. Real outcomes.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {useCases.map((uc) => (
            <div key={uc.title} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "28px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", maxWidth: "500px" }}>{uc.title}</h3>
                <span style={{ fontSize: "10px", fontFamily: "monospace", color: AMBER, background: AMBER_DIM, padding: "3px 10px", borderRadius: "4px", whiteSpace: "nowrap" }}>{uc.lens}</span>
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.8, color: "rgba(255,255,255,0.45)" }}>{uc.scenario}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Connectors */}
      <section id="connectors" style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Integrations</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f8fafc", marginBottom: "8px" }}>
          Connect every tool your teams use.
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "40px", maxWidth: "560px" }}>
          40+ connectors across productivity, engineering, CRM, support, finance, HR, and data platforms.
          Lyte ingests signals from the tools you already use — no code, no agents, no infrastructure changes.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1px", background: BORDER, borderRadius: "8px", overflow: "hidden" }}>
          {connectorsList.map(c => (
            <div key={c.name} style={{ background: BG, padding: "16px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <c.icon size={14} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / Credibility */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
          {[
            { icon: Shield, title: "Enterprise-grade security", desc: "SOC 2 Type II architecture. End-to-end encryption. Role-based access. Audit trails on every action. Your data never leaves your tenant." },
            { icon: Network, title: "One unified architecture", desc: "Lyte runs on the same monorepo infrastructure as every SZL Holdings platform. Shared auth, shared data layer, shared orchestration via Alloy." },
            { icon: CheckCircle, title: "Built by operators", desc: "Lyte was built by a founder who ran operations across cybersecurity, real estate, maritime, and enterprise consulting. Not a toy. Not a science project." },
          ].map(t => (
            <div key={t.title} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px" }}>
              <t.icon size={18} style={{ color: "rgba(255,255,255,0.2)", marginBottom: "14px" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>{t.title}</h3>
              <p style={{ fontSize: "12px", lineHeight: 1.7, color: "rgba(255,255,255,0.4)" }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", marginBottom: "12px" }}>
          Stop flying blind.
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px" }}>
          Connect your first tool in under 5 minutes. See what you've been missing.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button onClick={onSignIn} style={{ fontSize: "14px", fontWeight: 600, background: AMBER, color: "#080c14", border: "none", borderRadius: "6px", padding: "12px 28px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            Start Free Trial <ArrowRight size={14} />
          </button>
          <button style={{ fontSize: "14px", fontWeight: 500, background: "transparent", color: "rgba(255,255,255,0.6)", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "12px 28px", cursor: "pointer" }}>
            Schedule a Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "40px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={12} style={{ color: AMBER }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Lyte</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>by SZL Holdings</span>
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)" }}>&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
        </div>
      </footer>

      <div style={{ height: "40px" }} />
    </div>
  );
}
