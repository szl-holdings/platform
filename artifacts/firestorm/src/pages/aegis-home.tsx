import { Link } from "wouter";
import { Shield, ArrowRight, Layers, Server, Brain, Eye, Target, Activity, Lock, Users, Network, Zap, CheckCircle, BarChart3 } from "lucide-react";

const workspaces = [
  {
    id: "defense",
    name: "Defense",
    subtitle: "Security Operations",
    color: "#ef4444",
    icon: Shield,
    href: "/soc",
    capabilities: [
      "SOC command with unified XDR correlation",
      "MITRE ATT&CK mapping and adversary emulation",
      "Threat hunting, forensics, identity threat detection",
      "Vulnerability management and hardening controls",
      "Compliance readiness across frameworks",
      "Sacsayhuam\u00e1n Shield — adaptive perimeter defense",
    ],
  },
  {
    id: "command",
    name: "Command",
    subtitle: "Managed Operations",
    color: "#3b82f6",
    icon: Server,
    href: "/ops/dashboard",
    capabilities: [
      "NOC operations and RMM console",
      "Client account management and SLA tracking",
      "Ticket queue, dispatch, and technician workflow",
      "Revenue analytics and MRR dashboards",
      "Service desk and escalation management",
      "Device lifecycle and patch orchestration",
    ],
  },
  {
    id: "labs",
    name: "Labs",
    subtitle: "Intelligence Engine",
    color: "#8b5cf6",
    icon: Brain,
    href: "/intel/dashboard",
    capabilities: [
      "Quipu Command — agent orchestration",
      "Neural explorer and model registry",
      "Experiment tracking and evaluation",
      "Chasqui Relay — intelligence routing",
      "Prediction models with confidence scoring",
      "Research-to-action pipeline",
    ],
  },
];

const stats = [
  { value: "< 4 min", label: "Mean time to detect" },
  { value: "99.1%", label: "Managed device uptime" },
  { value: "94%", label: "AI model confidence" },
  { value: "3", label: "Unified workspaces" },
];

const convergences = [
  { from: "Defense", to: "Command", desc: "Incident INC-2847 impacts managed client Northgate. Lateral movement on DC-PROD-03 triggers automatic SLA escalation and client notification.", color: "#ef4444" },
  { from: "Labs", to: "Defense", desc: "Neural explorer detects anomalous pattern matching APT29 TTPs. Intelligence model confidence 94%. Automatic MITRE mapping and hunting query generation.", color: "#8b5cf6" },
  { from: "Command", to: "Labs", desc: "Service desk ticket volume anomaly detected across 3 managed clients. Labs generates churn risk model and surfaces preventive actions to Command.", color: "#3b82f6" },
];

const BG = "#0a0d14";
const SURFACE = "rgba(255,255,255,0.025)";
const BORDER = "rgba(255,255,255,0.06)";

export default function AegisHomePage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Hero — editorial, not centered template */}
      <section style={{ padding: "100px 1.5rem 60px", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "20px", fontFamily: "monospace" }}>
          SZL Holdings &middot; Unified Defense &amp; Intelligence
        </p>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 50px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#f8fafc", marginBottom: "24px", maxWidth: "700px" }}>
          One platform.<br />
          Three workspaces.<br />
          <span style={{ color: "rgba(255,255,255,0.35)" }}>One shared intelligence layer.</span>
        </h1>
        <p style={{ fontSize: "17px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", maxWidth: "580px", marginBottom: "36px" }}>
          Aegis unifies security operations, managed services, and AI-driven intelligence into
          a single console. Defense detects threats. Command manages operations. Labs drives research.
          All three share one data context, one correlation engine, and one operating model.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/soc">
            <button style={{ fontSize: "13px", fontWeight: 600, background: "rgba(255,255,255,0.08)", color: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "10px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              Enter SOC Command <ArrowRight size={14} />
            </button>
          </Link>
          <button style={{ fontSize: "13px", fontWeight: 500, background: "transparent", color: "rgba(255,255,255,0.5)", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "10px 24px", cursor: "pointer" }}>
            Request a Demo
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: "40px", marginTop: "48px", paddingTop: "24px", borderTop: `1px solid ${BORDER}` }}>
          {stats.map(s => (
            <div key={s.label}>
              <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "monospace", color: "#f8fafc" }}>{s.value}</span>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Three Workspaces */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Architecture</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f8fafc", marginBottom: "8px" }}>
          Three workspaces. One console.
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "48px", maxWidth: "560px" }}>
          Each workspace is a full operating surface for its domain. Together, they share a unified
          data context — so a threat in Defense informs a service risk in Command, and a Labs model
          improves Detection in real time.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden" }}>
          {workspaces.map(ws => (
            <div key={ws.id} style={{ background: BG, padding: "28px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <ws.icon size={16} style={{ color: ws.color }} />
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#f8fafc" }}>{ws.name}</h3>
              </div>
              <p style={{ fontSize: "11px", color: ws.color, fontWeight: 600, letterSpacing: "0.04em", marginBottom: "16px" }}>{ws.subtitle}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {ws.capabilities.map(cap => (
                  <div key={cap} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <CheckCircle size={10} style={{ color: "rgba(255,255,255,0.15)", marginTop: "3px", flexShrink: 0 }} />
                    <span style={{ fontSize: "11.5px", lineHeight: 1.5, color: "rgba(255,255,255,0.45)" }}>{cap}</span>
                  </div>
                ))}
              </div>
              <Link href={ws.href}>
                <button style={{ marginTop: "20px", fontSize: "11px", fontWeight: 600, background: `${ws.color}12`, color: ws.color, border: `1px solid ${ws.color}25`, borderRadius: "5px", padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  Enter {ws.name} <ArrowRight size={11} />
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Intelligence Layer — Cross-Module Convergence */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Convergence</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f8fafc", marginBottom: "8px" }}>
          Cross-module intelligence.
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "40px", maxWidth: "560px" }}>
          The real power of Aegis is convergence. When Defense, Command, and Labs share one data layer,
          correlations emerge that siloed tools miss entirely. Every incident, every service event,
          every model output feeds back into the shared intelligence graph.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {convergences.map((c, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, background: `${c.color}15`, color: c.color, padding: "2px 8px", borderRadius: "3px", letterSpacing: "0.04em" }}>{c.from}</span>
                <ArrowRight size={10} style={{ color: "rgba(255,255,255,0.15)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", padding: "2px 8px", borderRadius: "3px", letterSpacing: "0.04em" }}>{c.to}</span>
              </div>
              <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why One Platform */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {[
            { icon: Lock, title: "One security context", desc: "Shared authentication, shared RBAC, shared audit trails. No credential sprawl. No integration tax. One identity model across Defense, Command, and Labs." },
            { icon: Layers, title: "One data layer", desc: "Incidents, endpoints, tickets, models, and intelligence all live in one database. Cross-module queries are native — not piped through APIs." },
            { icon: Network, title: "One correlation engine", desc: "Every signal — threat, service event, model output — passes through the same correlation engine. Patterns that span modules surface automatically." },
            { icon: Eye, title: "One operating model", desc: "OBSERVE \u2192 UNDERSTAND \u2192 DECIDE \u2192 EXECUTE. The same decision framework applies whether you're triaging a breach, managing an SLA, or validating a model." },
          ].map(item => (
            <div key={item.title} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px" }}>
              <item.icon size={18} style={{ color: "rgba(255,255,255,0.2)", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", marginBottom: "8px" }}>{item.title}</h3>
              <p style={{ fontSize: "12px", lineHeight: 1.7, color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", marginBottom: "12px" }}>
          Total command. Zero compromise.
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px" }}>
          See what unified defense, operations, and intelligence looks like in one console.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <Link href="/soc">
            <button style={{ fontSize: "14px", fontWeight: 600, background: "rgba(255,255,255,0.08)", color: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "12px 28px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              Enter SOC Command <ArrowRight size={14} />
            </button>
          </Link>
          <Link href="/demo">
            <button style={{ fontSize: "14px", fontWeight: 500, background: "transparent", color: "rgba(255,255,255,0.5)", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "12px 28px", cursor: "pointer" }}>
              Schedule a Demo
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "40px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Aegis</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>by SZL Holdings</span>
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)" }}>&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
        </div>
      </footer>

      <div style={{ height: "40px" }} />
    </div>
  );
}
