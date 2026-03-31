import { useState } from "react";
import {
  ArrowRight, Zap, Activity, CheckSquare, Users, AlertOctagon,
  Shield, Eye, TrendingUp, GitBranch, Gauge, Monitor,
  BarChart3, Network, Radio, Target, Clock, Link2,
  Layers, Building2, ChevronDown, ChevronRight, Globe,
  Mail, Calendar, MessageSquare, FileText, Database,
  Cloud, Smartphone, CreditCard, Truck, ShoppingCart,
  Briefcase, HeartPulse, GraduationCap, Factory, Plane,
} from "lucide-react";

const AMBER = "#f59e0b";
const BG = "#080c14";

const prismPillars = [
  {
    id: "signal",
    name: "Signal",
    icon: Radio,
    color: "#f59e0b",
    headline: "Cut through the noise",
    desc: "AI-ranked priority surfacing. Lyte distills thousands of events into the 3-5 things that demand your attention right now. No dashboards to scan. No reports to read. Just what matters.",
    metric: "94%",
    metricLabel: "noise reduction",
  },
  {
    id: "impact",
    name: "Impact",
    icon: Target,
    color: "#ef4444",
    headline: "Know the cost of inaction",
    desc: "Every signal carries a financial consequence. Revenue at risk, cost of delay, margin erosion — translated from operational events into business language executives actually use.",
    metric: "$2.4M",
    metricLabel: "avg. risk surfaced / quarter",
  },
  {
    id: "anticipation",
    name: "Anticipation",
    icon: TrendingUp,
    color: "#8b5cf6",
    headline: "See problems before they arrive",
    desc: "Behavioral AI and predictive models project your current state forward. Surface risks before they materialize. Forecast outcomes before decisions are made. Prevention, not reaction.",
    metric: "72hr",
    metricLabel: "avg. early warning lead time",
  },
  {
    id: "topology",
    name: "Topology",
    icon: Network,
    color: "#06b6d4",
    headline: "Map every dependency",
    desc: "Reveal the relationship graph across your entire operation. How teams connect, where handoffs break, which processes depend on which people. See the structure others miss.",
    metric: "360°",
    metricLabel: "dependency coverage",
  },
  {
    id: "posture",
    name: "Posture",
    icon: Gauge,
    color: "#22c55e",
    headline: "One score. Total clarity.",
    desc: "Collapse complexity into a single, authoritative real-time health score. Board-ready. Audit-ready. No interpretation required. Know where you stand at any moment.",
    metric: "0–100",
    metricLabel: "real-time health score",
  },
  {
    id: "velocity",
    name: "Velocity",
    icon: Activity,
    color: "#3b82f6",
    headline: "Measure the rate of improvement",
    desc: "Track deployment cadence, decision speed, resolution time, and growth rate. Know whether your organization is accelerating or decelerating — and exactly where the drag is.",
    metric: "2.3x",
    metricLabel: "avg. decision velocity gain",
  },
  {
    id: "experience",
    name: "Experience",
    icon: Monitor,
    color: "#f472b6",
    headline: "See what your customers see",
    desc: "Client-side performance, interaction quality, error rates, and session health. The outside-in lens that connects internal operations to external outcomes.",
    metric: "< 200ms",
    metricLabel: "p95 interaction latency",
  },
];

const connectors = [
  { name: "Microsoft 365", icon: Mail, category: "Productivity", desc: "Email, Calendar, Teams, SharePoint, OneDrive" },
  { name: "Google Workspace", icon: Calendar, category: "Productivity", desc: "Gmail, Calendar, Drive, Docs, Sheets" },
  { name: "Slack", icon: MessageSquare, category: "Communication", desc: "Channels, DMs, workflows, bot integrations" },
  { name: "Jira", icon: CheckSquare, category: "Project Management", desc: "Issues, sprints, boards, custom workflows" },
  { name: "Salesforce", icon: Briefcase, category: "CRM", desc: "Leads, opportunities, pipeline, forecasts" },
  { name: "HubSpot", icon: Target, category: "CRM", desc: "Contacts, deals, marketing, service hub" },
  { name: "ServiceNow", icon: Shield, category: "ITSM", desc: "Incidents, changes, CMDB, service catalog" },
  { name: "Confluence", icon: FileText, category: "Knowledge", desc: "Pages, spaces, decisions, documentation" },
  { name: "GitHub", icon: GitBranch, category: "Engineering", desc: "Repos, PRs, actions, deployments, issues" },
  { name: "Azure DevOps", icon: Cloud, category: "Engineering", desc: "Boards, repos, pipelines, artifacts" },
  { name: "Snowflake", icon: Database, category: "Data", desc: "Warehouses, queries, usage, costs" },
  { name: "SAP", icon: Factory, category: "ERP", desc: "Financials, supply chain, procurement" },
  { name: "Workday", icon: Users, category: "HR", desc: "People analytics, headcount, org changes" },
  { name: "Stripe", icon: CreditCard, category: "Payments", desc: "Revenue, subscriptions, churn, MRR" },
  { name: "Zendesk", icon: HeartPulse, category: "Support", desc: "Tickets, satisfaction, resolution time" },
  { name: "Shopify", icon: ShoppingCart, category: "Commerce", desc: "Orders, inventory, fulfillment, revenue" },
];

const industries = [
  { name: "Financial Services", icon: BarChart3, desc: "Risk visibility, compliance readiness, trade execution oversight" },
  { name: "Healthcare", icon: HeartPulse, desc: "Patient flow, handoff accountability, regulatory posture" },
  { name: "Manufacturing", icon: Factory, desc: "Supply chain signals, production velocity, quality posture" },
  { name: "Technology", icon: Monitor, desc: "Engineering velocity, incident impact, deployment health" },
  { name: "Logistics", icon: Truck, desc: "Fleet visibility, route optimization signals, delivery forecasting" },
  { name: "Education", icon: GraduationCap, desc: "Enrollment signals, retention anticipation, resource topology" },
  { name: "Retail", icon: ShoppingCart, desc: "Inventory signals, demand forecasting, customer experience" },
  { name: "Aviation", icon: Plane, desc: "Operations tempo, maintenance posture, schedule velocity" },
];

const roleViews = [
  {
    role: "C-Suite / Board",
    headline: "Strategic command in a single score",
    points: ["Portfolio-wide posture score — no slide decks required", "Revenue impact quantified on every operational signal", "Forecasting that shows where the business is headed, not just where it's been", "Board-ready views exportable in seconds"],
  },
  {
    role: "VP / Director",
    headline: "Operational clarity across every team",
    points: ["See ownership gaps before work falls through cracks", "Track handoff latency between teams in real time", "Anticipation lens flags risks 72+ hours before they materialize", "Role-filtered views — see only what your scope demands"],
  },
  {
    role: "Operations / Delivery",
    headline: "Execution visibility without the meetings",
    points: ["Every action routed to the right person with context", "Approval bottlenecks surfaced with escalation paths", "Readiness scoring before milestones and launches", "Velocity tracking shows whether execution is accelerating or stalling"],
  },
  {
    role: "Analyst / Engineer",
    headline: "Full-stack business telemetry",
    points: ["Topology maps reveal hidden dependencies", "Signal feeds with state transitions and audit trails", "Experience lens correlates internal ops to customer outcomes", "API-first — push custom metrics into any PRISM pillar"],
  },
];

const comparisonRows = [
  { feature: "Business process observability", lyte: true, newrelic: false, datadog: false, splunk: false },
  { feature: "7-pillar analytical framework", lyte: true, newrelic: false, datadog: false, splunk: false },
  { feature: "SaaS tool connectors (365, Slack, Jira)", lyte: true, newrelic: false, datadog: false, splunk: true },
  { feature: "Ownership & handoff tracking", lyte: true, newrelic: false, datadog: false, splunk: false },
  { feature: "Financial impact quantification", lyte: true, newrelic: false, datadog: false, splunk: false },
  { feature: "Predictive business forecasting", lyte: true, newrelic: true, datadog: true, splunk: true },
  { feature: "Role-based executive views", lyte: true, newrelic: true, datadog: true, splunk: true },
  { feature: "Real-time health scoring", lyte: true, newrelic: true, datadog: true, splunk: true },
  { feature: "Infrastructure monitoring", lyte: false, newrelic: true, datadog: true, splunk: true },
  { feature: "APM / code-level tracing", lyte: false, newrelic: true, datadog: true, splunk: true },
];

const navLinks = [
  { label: "PRISM", href: "#prism" },
  { label: "Connectors", href: "#connectors" },
  { label: "Roles", href: "#roles" },
  { label: "Industries", href: "#industries" },
  { label: "Compare", href: "#compare" },
  { label: "Pricing", href: "#pricing" },
];

function PrismPillarCard({ pillar, index, isExpanded, onToggle }: {
  pillar: typeof prismPillars[0]; index: number; isExpanded: boolean; onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderRadius: "8px", overflow: "hidden", transition: "all 0.25s ease",
        background: isExpanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isExpanded ? `${pillar.color}33` : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${pillar.name} lens details`}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "14px",
          padding: "18px 20px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
          background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <pillar.icon size={16} style={{ color: pillar.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: pillar.color, fontWeight: 700 }}>
              0{index + 1}
            </span>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
              {pillar.name}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{pillar.headline}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace", color: pillar.color }}>{pillar.metric}</p>
            <p style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{pillar.metricLabel}</p>
          </div>
          {isExpanded ? <ChevronDown size={14} style={{ color: "#475569" }} /> : <ChevronRight size={14} style={{ color: "#475569" }} />}
        </div>
      </button>
      {isExpanded && (
        <div style={{ padding: "0 20px 20px 70px" }}>
          <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#94a3b8" }}>{pillar.desc}</p>
        </div>
      )}
    </div>
  );
}

export default function LyteMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const [expandedPillar, setExpandedPillar] = useState<number>(0);
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e2e8f0", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,12,20,0.94)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(245,158,11,0.08)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "7px",
              background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.06))",
              border: "1px solid rgba(245,158,11,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={14} style={{ color: AMBER }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.025em", color: "#f1f5f9" }}>Lyte</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }} className="lyte-desktop-nav">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} style={{ fontSize: "13px", color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <a href="/szl-holdings/" style={{ fontSize: "12px", color: "#475569", textDecoration: "none" }}>SZL Holdings</a>
            <button onClick={onSignIn} style={{
              padding: "7px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              background: AMBER, color: BG, border: "none", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#d97706"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = AMBER; }}>
              Sign in
            </button>
            <button
              onClick={() => setMobileNav(!mobileNav)}
              className="lyte-mobile-toggle"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileNav}
              style={{
                display: "none", background: "none", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#94a3b8",
              }}>
              <Layers size={16} />
            </button>
          </div>
        </div>
        {mobileNav && (
          <div className="lyte-mobile-menu" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 1.5rem", display: "flex", flexDirection: "column", gap: "8px" }}>
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileNav(false)} style={{ fontSize: "14px", color: "#94a3b8", textDecoration: "none", padding: "8px 0" }}>{link.label}</a>
            ))}
          </div>
        )}
      </nav>

      <section style={{ paddingTop: "140px", paddingBottom: "100px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 55% at 50% -15%, rgba(245,158,11,0.06) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 40% 40% at 80% 20%, rgba(139,92,246,0.03) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem",
            padding: "5px 14px 5px 10px", borderRadius: "20px",
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: AMBER, display: "inline-block", boxShadow: `0 0 8px ${AMBER}88`, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: AMBER }}>Business Observability Platform</span>
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.02, color: "#f1f5f9", marginBottom: "1.5rem" }}>
            Your business has<br />
            <span style={{ background: `linear-gradient(135deg, ${AMBER}, #d97706)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              7 blind spots.
            </span>
            <br />PRISM illuminates all of them.
          </h1>
          <p style={{ fontSize: "1.125rem", lineHeight: 1.7, color: "#64748b", maxWidth: "38rem", margin: "0 auto 2.5rem" }}>
            Connect your Microsoft 365, Slack, Jira, Salesforce — every tool your teams use. Lyte runs every signal through 7 analytical lenses so executives see risk, operators see friction, and decisions happen before the damage is done.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
            <button onClick={onSignIn} style={{
              padding: "14px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer",
              background: `linear-gradient(135deg, ${AMBER}, #d97706)`, color: BG, border: "none",
              transition: "all 0.2s", boxShadow: `0 4px 20px ${AMBER}33`,
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 30px ${AMBER}44`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${AMBER}33`; }}>
              Start Free Trial
            </button>
            <a href="mailto:demo@lyte.business" style={{
              padding: "14px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: 600, cursor: "pointer",
              textDecoration: "none", background: "rgba(255,255,255,0.04)", color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.10)", transition: "all 0.2s",
              display: "inline-flex", alignItems: "center", gap: "8px",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}>
              Request a Demo <ArrowRight size={14} />
            </a>
          </div>

          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { value: "7", label: "PRISM Lenses" },
              { value: "40+", label: "Connectors" },
              { value: "< 5min", label: "Time to First Signal" },
              { value: "Any", label: "Industry" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "monospace", color: AMBER }}>{s.value}</p>
                <p style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "4rem 0", background: "rgba(245,158,11,0.01)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#475569", marginBottom: "1.5rem" }}>
            They observe infrastructure. We observe your business.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "3rem", flexWrap: "wrap", opacity: 0.4 }}>
            {["New Relic", "Datadog", "Dynatrace", "Splunk", "ServiceNow"].map(name => (
              <span key={name} style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", letterSpacing: "-0.01em" }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ maxWidth: "640px", marginBottom: "2.5rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "0.75rem" }}>The Difference</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1rem" }}>
              Observability was built for servers.<br />Your business deserves its own.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b" }}>
              New Relic watches your infrastructure. Datadog monitors your containers. Lyte observes your <em style={{ color: "#94a3b8" }}>business</em> — the approvals, handoffs, ownership, forecasts, and decisions that determine whether you win or lose. Different problem. Different platform.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }} className="lyte-diff-grid">
            {[
              { label: "Traditional Observability", items: ["Server uptime", "API latency", "Error rates", "Container health", "Log aggregation"], color: "#475569" },
              { label: "Business Intelligence", items: ["Historical reports", "Quarterly dashboards", "Static KPIs", "Backward-looking analysis", "Manual data pulls"], color: "#475569" },
              { label: "Lyte — Business Observability", items: ["Ownership accountability", "Handoff tracking", "Financial impact scoring", "Predictive forecasting", "Real-time decision routing"], color: AMBER },
            ].map(col => (
              <div key={col.label} style={{
                padding: "1.5rem", borderRadius: "8px",
                background: col.color === AMBER ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${col.color === AMBER ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)"}`,
              }}>
                <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: col.color, marginBottom: "1rem" }}>{col.label}</p>
                {col.items.map(item => (
                  <p key={item} style={{ fontSize: "13px", color: col.color === AMBER ? "#cbd5e1" : "#64748b", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{item}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="prism" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0", background: "rgba(139,92,246,0.015)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }} className="lyte-prism-grid">
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "0.75rem" }}>The PRISM Framework</p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1rem" }}>
                7 lenses.<br />Complete visibility.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b", marginBottom: "1.5rem" }}>
                PRISM is not a dashboard. It is an analytical framework that decomposes any business domain into seven orthogonal lenses. Each lens answers a different question. Together, they eliminate blind spots.
              </p>
              <div style={{
                padding: "16px 20px", borderRadius: "8px",
                background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)",
              }}>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: AMBER, marginBottom: "8px" }}>PRISM Composite</p>
                <div style={{ display: "flex", gap: "6px" }}>
                  {prismPillars.map(p => (
                    <div key={p.id} style={{
                      flex: 1, height: "4px", borderRadius: "2px",
                      background: `linear-gradient(90deg, ${p.color}88, ${p.color}44)`,
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
                  Signal + Impact + Anticipation + Topology + Posture + Velocity + Experience = Total Business Observability
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {prismPillars.map((pillar, i) => (
                <PrismPillarCard
                  key={pillar.id}
                  pillar={pillar}
                  index={i}
                  isExpanded={expandedPillar === i}
                  onToggle={() => setExpandedPillar(expandedPillar === i ? -1 : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="connectors" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "0.75rem" }}>Connectors</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1rem" }}>
              Plug into the tools your teams already use.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b", maxWidth: "36rem", margin: "0 auto" }}>
              Lyte connects to your entire stack — productivity suites, project management, CRM, engineering, payments, ERP. No data migration. No rip-and-replace. Install. Connect. See.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }} className="lyte-connectors-grid">
            {connectors.map(c => (
              <div key={c.name} style={{
                padding: "16px", borderRadius: "8px",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.18s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${AMBER}30`; (e.currentTarget as HTMLElement).style.background = `${AMBER}06`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <c.icon size={14} style={{ color: AMBER, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{c.name}</span>
                </div>
                <p style={{ fontSize: "11px", color: "#475569", lineHeight: 1.5 }}>{c.desc}</p>
                <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#334155", marginTop: "6px" }}>{c.category}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              <Link2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
              40+ connectors available. Custom connectors via REST API and webhooks. Open SDK for proprietary systems.
            </p>
          </div>
        </div>
      </section>

      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0", background: "rgba(245,158,11,0.015)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "0.75rem" }}>How It Works</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08 }}>
              Connect. Observe. Decide.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }} className="lyte-flow-grid">
            {[
              { step: "01", label: "Connect", icon: Link2, desc: "Plug in your Microsoft 365, Slack, Jira, Salesforce — any tool. Lyte ingests signals automatically. Zero code required.", color: AMBER },
              { step: "02", label: "Decompose", icon: Layers, desc: "Every signal is decomposed through 7 PRISM lenses. What happened, who owns it, what it costs, where it leads — all scored.", color: "#8b5cf6" },
              { step: "03", label: "Route", icon: GitBranch, desc: "Actions, approvals, and escalations are routed to the right person with full context. Handoffs are tracked. Nothing gets lost.", color: "#06b6d4" },
              { step: "04", label: "Forecast", icon: TrendingUp, desc: "The Anticipation lens projects forward. See where your business is heading. Act on tomorrow's problems with today's context.", color: "#22c55e" },
            ].map((s, i) => (
              <div key={s.step} style={{
                padding: "1.75rem", borderRadius: "8px",
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                borderTop: `3px solid ${s.color}66`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 800, color: s.color }}>{s.step}</span>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>{s.label}</p>
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#64748b" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ maxWidth: "640px", marginBottom: "2.5rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "0.75rem" }}>Role-Based Command</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1rem" }}>
              Every seat sees exactly what they need.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b" }}>
              The CEO does not need the same view as the delivery manager. Lyte filters by role automatically — context, not noise.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }} className="lyte-roles-grid">
            {roleViews.map(r => (
              <div key={r.role} style={{
                padding: "1.75rem", borderRadius: "8px",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${AMBER}25`; (e.currentTarget as HTMLElement).style.background = `${AMBER}04`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}>
                <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: AMBER, marginBottom: "0.5rem" }}>{r.role}</p>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", marginBottom: "1rem", letterSpacing: "-0.01em" }}>{r.headline}</p>
                {r.points.map(p => (
                  <div key={p} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <ChevronRight size={12} style={{ color: AMBER, flexShrink: 0, marginTop: "3px" }} />
                    <p style={{ fontSize: "13px", lineHeight: 1.55, color: "#94a3b8" }}>{p}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="industries" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "0.75rem" }}>Industries</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1rem" }}>
              Any business. Any market. One platform.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b", maxWidth: "36rem", margin: "0 auto" }}>
              PRISM is industry-agnostic by design. The 7 lenses decompose any operational domain — from healthcare to logistics to financial services.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }} className="lyte-industries-grid">
            {industries.map(ind => (
              <div key={ind.name} style={{
                padding: "1.25rem", borderRadius: "8px",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.18s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${AMBER}25`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <ind.icon size={18} style={{ color: AMBER, marginBottom: "10px" }} />
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", marginBottom: "4px" }}>{ind.name}</p>
                <p style={{ fontSize: "12px", lineHeight: 1.55, color: "#64748b" }}>{ind.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "0.75rem" }}>Comparison</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08 }}>
              Different category. Different capabilities.
            </h2>
          </div>
          <div style={{ borderRadius: "8px", overflow: "auto", WebkitOverflowScrolling: "touch", border: "1px solid rgba(255,255,255,0.06)" }} className="lyte-compare-scroll">
            <div style={{ minWidth: "600px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>Capability</div>
                <div style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: AMBER, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>Lyte</div>
                <div style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>New Relic</div>
                <div style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>Datadog</div>
                <div style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center" }}>Splunk</div>
              </div>
              {comparisonRows.map((row, i) => (
                <div key={row.feature} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  borderBottom: i < comparisonRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                }}>
                  <div style={{ padding: "10px 16px", fontSize: "13px", color: "#94a3b8" }}>{row.feature}</div>
                  {[row.lyte, row.newrelic, row.datadog, row.splunk].map((val, j) => (
                    <div key={j} style={{ padding: "10px 16px", textAlign: "center", fontSize: "14px" }}>
                      {val ? (
                        <span style={{ color: j === 0 ? AMBER : "#22c55e" }} aria-label="Yes">&#10003;</span>
                      ) : (
                        <span style={{ color: "#334155" }} aria-label="No">—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "#334155", marginTop: "12px", textAlign: "center" }}>
            Lyte complements infrastructure observability. It does not replace it — it covers the business layer they cannot see.
          </p>
        </div>
      </section>

      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0", background: "rgba(245,158,11,0.015)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "0.75rem" }}>Handoff Intelligence</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1rem" }}>
              No more blind handoffs.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#64748b", maxWidth: "36rem", margin: "0 auto" }}>
              Every handoff between teams, roles, and systems is tracked, scored, and visible. When work passes from sales to delivery, from engineering to operations, from decision to execution — Lyte sees it.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }} className="lyte-handoff-grid">
            {[
              { icon: Users, label: "Ownership Tracking", desc: "Every process step has a named owner. Lyte identifies gaps, overloads, and missing accountability before work stalls." },
              { icon: Clock, label: "Latency Detection", desc: "Handoff latency is measured in real time. See which transitions are taking hours, days, or weeks longer than they should." },
              { icon: AlertOctagon, label: "Escalation Routing", desc: "When handoffs break, Lyte routes escalations to the right person with context, rationale, and recommended action." },
            ].map(item => (
              <div key={item.label} style={{ padding: "1.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <item.icon size={20} style={{ color: AMBER, marginBottom: "12px" }} />
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem" }}>{item.label}</p>
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#64748b" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "0.75rem" }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1rem" }}>
              Plans that scale with your business.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }} className="lyte-pricing-grid">
            {[
              {
                name: "Starter", price: "$49", period: "/seat/month",
                features: ["Up to 10 connectors", "5 PRISM lenses active", "Basic handoff tracking", "Email support", "1 workspace"],
                cta: "Start Free Trial", highlight: false,
              },
              {
                name: "Business", price: "$149", period: "/seat/month",
                features: ["Unlimited connectors", "All 7 PRISM lenses", "Advanced forecasting", "Priority support", "Unlimited workspaces", "Custom dashboards", "SSO / SAML"],
                cta: "Start Free Trial", highlight: true,
              },
              {
                name: "Enterprise", price: "Custom", period: "",
                features: ["Everything in Business", "Dedicated infrastructure", "Custom connector development", "SLA guarantees", "On-premise deployment option", "Executive onboarding", "24/7 support"],
                cta: "Contact Sales", highlight: false,
              },
            ].map(plan => (
              <div key={plan.name} style={{
                padding: "2rem", borderRadius: "8px", position: "relative",
                background: plan.highlight ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${plan.highlight ? `${AMBER}30` : "rgba(255,255,255,0.06)"}`,
                boxShadow: plan.highlight ? `0 4px 24px ${AMBER}15` : "none",
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                    padding: "3px 12px", borderRadius: "10px", fontSize: "10px", fontWeight: 700,
                    background: AMBER, color: BG, letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>Most Popular</div>
                )}
                <p style={{ fontSize: "14px", fontWeight: 700, color: plan.highlight ? AMBER : "#94a3b8", marginBottom: "0.5rem", letterSpacing: "0.03em", textTransform: "uppercase" }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#f1f5f9", fontFamily: "monospace" }}>{plan.price}</span>
                  <span style={{ fontSize: "13px", color: "#475569" }}>{plan.period}</span>
                </div>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <span style={{ color: AMBER, fontSize: "12px", marginTop: "2px" }}>&#10003;</span>
                    <p style={{ fontSize: "13px", color: "#94a3b8" }}>{f}</p>
                  </div>
                ))}
                <button
                  onClick={plan.name === "Enterprise" ? undefined : onSignIn}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "6px", fontSize: "14px", fontWeight: 600,
                    cursor: "pointer", marginTop: "1.5rem", transition: "all 0.15s",
                    background: plan.highlight ? AMBER : "rgba(255,255,255,0.04)",
                    color: plan.highlight ? BG : "#94a3b8",
                    border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.10)",
                  }}
                  onMouseEnter={(e) => {
                    if (plan.highlight) (e.currentTarget as HTMLButtonElement).style.background = "#d97706";
                    else (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    if (plan.highlight) (e.currentTarget as HTMLButtonElement).style.background = AMBER;
                    else (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)";
                  }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "5rem 0", background: "rgba(139,92,246,0.015)" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1.08, marginBottom: "1.25rem" }}>
            Your infrastructure is observed.<br />Your business is not.
          </h2>
          <p style={{ fontSize: "1rem", lineHeight: 1.72, color: "#64748b", marginBottom: "2rem" }}>
            Start your free trial today. Connect your tools. See your business through 7 lenses for the first time.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onSignIn} style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px", borderRadius: "8px",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
              background: `linear-gradient(135deg, ${AMBER}, #d97706)`, color: BG, border: "none",
              transition: "all 0.2s", boxShadow: `0 4px 20px ${AMBER}33`,
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}>
              Start Free Trial <ArrowRight size={14} />
            </button>
            <a href="mailto:demo@lyte.business" style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px", borderRadius: "8px",
              fontSize: "15px", fontWeight: 600, textDecoration: "none",
              background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.10)",
              transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; }}>
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "3rem 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "2rem" }} className="lyte-footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "5px", background: `${AMBER}18`, border: `1px solid ${AMBER}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={11} style={{ color: AMBER }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#e2e8f0" }}>Lyte</span>
              </div>
              <p style={{ fontSize: "12px", lineHeight: 1.65, color: "#475569", maxWidth: "240px" }}>
                Business observability for organizations that refuse to fly blind. Built on the PRISM framework. Powered by SZL Holdings.
              </p>
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: "12px" }}>Product</p>
              {["PRISM Framework", "Connectors", "Role Views", "Forecasting", "API Docs"].map(l => (
                <p key={l} style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", cursor: "pointer" }}>{l}</p>
              ))}
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: "12px" }}>Industries</p>
              {["Financial Services", "Healthcare", "Technology", "Manufacturing", "Logistics"].map(l => (
                <p key={l} style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", cursor: "pointer" }}>{l}</p>
              ))}
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: "12px" }}>Company</p>
              {["About", "Trust Center", "Careers", "Blog", "Contact"].map(l => (
                <p key={l} style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", cursor: "pointer" }}>{l}</p>
              ))}
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: "12px" }}>Legal</p>
              {["Privacy Policy", "Terms of Service", "Security", "GDPR", "SOC 2"].map(l => (
                <p key={l} style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", cursor: "pointer" }}>{l}</p>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "2rem", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontSize: "11px", color: "#334155" }}>
              &copy; {new Date().getFullYear()} Lyte by SZL Holdings. All rights reserved.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <a href="/szl-holdings/" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>SZL Holdings</a>
              <a href="/alloy/" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>Alloy</a>
              <a href="/vessels/" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>Vessels</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1024px) {
          .lyte-diff-grid, .lyte-flow-grid, .lyte-connectors-grid, .lyte-industries-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lyte-prism-grid { grid-template-columns: 1fr !important; }
          .lyte-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 1.5rem !important; }
        }
        @media (max-width: 768px) {
          .lyte-desktop-nav { display: none !important; }
          .lyte-mobile-toggle { display: block !important; }
          .lyte-diff-grid, .lyte-flow-grid, .lyte-handoff-grid, .lyte-pricing-grid, .lyte-roles-grid { grid-template-columns: 1fr !important; }
          .lyte-connectors-grid, .lyte-industries-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lyte-footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .lyte-connectors-grid, .lyte-industries-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .lyte-desktop-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
