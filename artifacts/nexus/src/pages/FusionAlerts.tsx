/**
 * Fusion Alerts — Nexus Fusion Intelligence Panel
 *
 * Anduril Lattice-inspired cross-domain alert surface.
 * Shows all active Fusion Cortex alerts with evidence chains and recommended actions.
 */

import { useState } from "react";
import { AlertTriangle, Shield, Anchor, Building2, FileText, ChevronDown, ChevronUp, CheckCircle, Clock, Layers, Zap, ArrowRight, Globe } from "lucide-react";

const DS = {
  bg: "#0f0f1a",
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  elevated: "rgba(255,255,255,0.04)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.28)" },
  accent: { red: "#ef4444", orange: "#f97316", amber: "#f59e0b", green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", cyan: "#22d3ee" },
};

type AlertSeverity = "low" | "medium" | "high" | "critical";
type AlertCategory = "cross_domain_risk" | "entity_correlation" | "pattern_anomaly" | "sanctions_exposure" | "litigation_impact" | "financial_stress" | "threat_escalation" | "opportunity_signal";
type AlertStatus = "active" | "acknowledged" | "resolved" | "escalated";

interface EvidenceItem {
  source: string;
  domain: string;
  description: string;
  timestamp: string;
  weight: number;
}

interface AffectedEntity {
  id: string;
  name: string;
  domain: string;
  type: string;
}

interface FusionAlert {
  id: string;
  title: string;
  summary: string;
  severity: AlertSeverity;
  category: AlertCategory;
  confidence: number;
  affectedDomains: string[];
  affectedEntities: AffectedEntity[];
  evidenceChain: EvidenceItem[];
  recommendedActions: string[];
  advisoryContext?: string;
  generatedAt: string;
  status: AlertStatus;
  tags: string[];
}

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; label: string }> = {
  critical: { color: DS.accent.red, bg: "rgba(239,68,68,0.12)", label: "CRITICAL" },
  high: { color: DS.accent.orange, bg: "rgba(249,115,22,0.1)", label: "HIGH" },
  medium: { color: DS.accent.amber, bg: "rgba(245,158,11,0.1)", label: "MEDIUM" },
  low: { color: DS.accent.blue, bg: "rgba(59,130,246,0.1)", label: "LOW" },
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  cross_domain_risk: "Cross-Domain Risk",
  entity_correlation: "Entity Correlation",
  pattern_anomaly: "Pattern Anomaly",
  sanctions_exposure: "Sanctions Exposure",
  litigation_impact: "Litigation Impact",
  financial_stress: "Financial Stress",
  threat_escalation: "Threat Escalation",
  opportunity_signal: "Opportunity Signal",
};

const DOMAIN_ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  vessels: Anchor,
  "prism-counsel": FileText,
  terra: Globe,
  "szl-holdings": Building2,
  firestorm: Shield,
  "carlota-jo": Layers,
};

const DOMAIN_COLORS: Record<string, string> = {
  vessels: DS.accent.cyan,
  "prism-counsel": DS.accent.orange,
  terra: DS.accent.green,
  "szl-holdings": DS.accent.purple,
  firestorm: DS.accent.red,
  "carlota-jo": DS.accent.blue,
};

const DEMO_ALERTS: FusionAlert[] = [
  {
    id: "fx-001",
    title: "AURORA Owner Filed PRISM Litigation — Terra Brooklyn Property −18%",
    summary: "Vessel AURORA's beneficial owner has a new PRISM Counsel litigation filing. Cross-referencing: their Terra property in Brooklyn has declined 18% in 30 days. Carlota Jo advisory review recommended.",
    severity: "high",
    category: "litigation_impact",
    confidence: 0.91,
    affectedDomains: ["vessels", "prism-counsel", "terra"],
    affectedEntities: [
      { id: "e1", name: "AURORA (IMO 9234567)", domain: "vessels", type: "vessel" },
      { id: "e2", name: "Meridian Capital LLC", domain: "prism-counsel", type: "organization" },
      { id: "e3", name: "345 Atlantic Ave, Brooklyn", domain: "terra", type: "property" },
    ],
    evidenceChain: [
      { source: "Vessels Intelligence", domain: "vessels", description: "AURORA registered to Meridian Capital LLC (BVI) — AIS tracking active", timestamp: new Date(Date.now() - 86400000).toISOString(), weight: 0.9 },
      { source: "PRISM Counsel", domain: "prism-counsel", description: "Meridian Capital LLC — new litigation filing, SDNY, $12M exposure (Case #2024-CV-4821)", timestamp: new Date(Date.now() - 43200000).toISOString(), weight: 0.95 },
      { source: "Terra Intelligence", domain: "terra", description: "345 Atlantic Ave valuation −18% over 30 days, Meridian Capital listed as tenant-in-common", timestamp: new Date(Date.now() - 21600000).toISOString(), weight: 0.85 },
    ],
    recommendedActions: [
      "Schedule tri-domain advisory review: Helmsman + Lexis + Terra agents",
      "Review vessel financing covenants for cross-default provisions",
      "Initiate property valuation audit — confirm independence from litigation",
      "Carlota Jo: prepare consolidated risk brief for SZL executive review",
    ],
    advisoryContext: "Carlota Jo Advisory: The convergence of maritime ownership, active litigation, and real estate distress in a single beneficial owner structure represents a systemic risk signal. Executive briefing within 24 hours.",
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    status: "active",
    tags: ["vessel", "litigation", "real-estate", "beneficial-owner", "cross-domain"],
  },
  {
    id: "fx-002",
    title: "APT41 Maritime Targeting — Vessels Route Overlaps with Active IOC",
    summary: "Aegis threat intelligence has correlated APT41 Volt Typhoon IOCs with shipping lanes used by SZL fleet. Three vessels transiting affected corridor. Immediate route risk review required.",
    severity: "critical",
    category: "threat_escalation",
    confidence: 0.88,
    affectedDomains: ["vessels", "firestorm"],
    affectedEntities: [
      { id: "e4", name: "APT41 / Volt Typhoon", domain: "firestorm", type: "threat" },
      { id: "e5", name: "SZL Fleet Segment Alpha", domain: "vessels", type: "asset" },
    ],
    evidenceChain: [
      { source: "Aegis SOC", domain: "firestorm", description: "APT41 IOCs detected on South China Sea maritime infrastructure (T1590 — Gather Victim Network Info)", timestamp: new Date(Date.now() - 7200000).toISOString(), weight: 0.92 },
      { source: "Vessels Intelligence", domain: "vessels", description: "ATLAS WIND, MERIDIAN STAR, TYPHOON PEAK transiting Strait of Malacca — overlap with IOC corridor", timestamp: new Date(Date.now() - 3600000).toISOString(), weight: 0.88 },
    ],
    recommendedActions: [
      "Alert Helmsman — recommend alternate routing for all three vessels",
      "Engage Sentinel for full TTP mapping: APT41 maritime targeting playbook",
      "Brief SZL CISO and fleet operations director — joint call within 1 hour",
      "Submit maritime security advisory to flag state administration",
    ],
    generatedAt: new Date(Date.now() - 7200000).toISOString(),
    status: "active",
    tags: ["apt41", "volt-typhoon", "maritime", "threat-intelligence", "critical"],
  },
  {
    id: "fx-003",
    title: "Shell Company Structure — Multi-Hop Ownership to Sanctioned Entity",
    summary: "GraphRAG traversal identified a 4-hop ownership chain linking SZL portfolio entity to an OFAC SDN-listed organization through BVI intermediate structures. KYC refresh required.",
    severity: "high",
    category: "sanctions_exposure",
    confidence: 0.79,
    affectedDomains: ["szl-holdings", "prism-counsel", "vessels"],
    affectedEntities: [
      { id: "e6", name: "Pacific Ventures Holdings BVI", domain: "szl-holdings", type: "organization" },
      { id: "e7", name: "SDN Entity (Redacted)", domain: "prism-counsel", type: "organization" },
    ],
    evidenceChain: [
      { source: "Ontology Graph", domain: "szl-holdings", description: "Pacific Ventures → Starlight Maritime → Coral Trading → [REDACTED SDN ENTITY]", timestamp: new Date().toISOString(), weight: 0.79 },
      { source: "OFAC Database", domain: "prism-counsel", description: "Terminal entity confirmed on OFAC SDN list — Russian oligarch exposure", timestamp: new Date().toISOString(), weight: 0.95 },
    ],
    recommendedActions: [
      "Lexis agent: emergency OFAC compliance review within 4 hours",
      "Freeze any pending transactions involving Pacific Ventures Holdings",
      "Engage external sanctions counsel for regulatory notification assessment",
      "Document discovery chain for FinCEN SAR filing evaluation",
    ],
    generatedAt: new Date(Date.now() - 1800000).toISOString(),
    status: "active",
    tags: ["sanctions", "ofac", "sdn", "shell-company", "kyc", "russia"],
  },
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  return `${Math.floor(ms / 3600000)}h ago`;
}

function AlertCard({ alert }: { alert: FusionAlert }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<AlertStatus>(alert.status);
  const severity = SEVERITY_CONFIG[alert.severity];

  return (
    <div style={{
      background: DS.surface,
      border: `1px solid ${alert.severity === "critical" ? DS.accent.red + "40" : DS.border}`,
      borderRadius: "12px",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      <div style={{ padding: "14px 16px", borderLeft: `3px solid ${severity.color}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", background: severity.bg, color: severity.color, borderRadius: "10px" }}>{severity.label}</span>
              <span style={{ fontSize: "10px", color: DS.text.tertiary }}>{CATEGORY_LABELS[alert.category]}</span>
              <span style={{ fontSize: "10px", color: DS.text.tertiary }}>·</span>
              <span style={{ fontSize: "10px", color: DS.text.tertiary }}>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
              <span style={{ fontSize: "10px", color: DS.text.tertiary }}>·</span>
              <Clock size={10} color={DS.text.tertiary} />
              <span style={{ fontSize: "10px", color: DS.text.tertiary }}>{timeAgo(alert.generatedAt)}</span>
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: DS.text.primary, lineHeight: 1.4 }}>{alert.title}</h3>
            <p style={{ fontSize: "12px", color: DS.text.secondary, margin: 0, lineHeight: 1.5 }}>{alert.summary}</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {alert.affectedDomains.map(domain => {
                const Icon = DOMAIN_ICON_MAP[domain] ?? Globe;
                const color = DOMAIN_COLORS[domain] ?? DS.text.tertiary;
                return (
                  <span key={domain} style={{ fontSize: "10px", padding: "2px 7px", background: `${color}12`, color, borderRadius: "10px", border: `1px solid ${color}30`, display: "flex", alignItems: "center", gap: "3px" }}>
                    <Icon size={9} />
                    {domain}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", flexShrink: 0 }}>
            {status === "active" && (
              <button
                onClick={() => setStatus("acknowledged")}
                style={{ fontSize: "10px", padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: `1px solid ${DS.border}`, borderRadius: "6px", color: DS.text.secondary, cursor: "pointer" }}
              >
                Acknowledge
              </button>
            )}
            {status === "acknowledged" && (
              <button
                onClick={() => setStatus("resolved")}
                style={{ fontSize: "10px", padding: "4px 8px", background: "rgba(34,197,94,0.1)", border: `1px solid rgba(34,197,94,0.3)`, borderRadius: "6px", color: DS.accent.green, cursor: "pointer" }}
              >
                Resolve
              </button>
            )}
            {status !== "active" && (
              <span style={{ fontSize: "10px", color: status === "resolved" ? DS.accent.green : DS.accent.amber }}>
                {status === "resolved" ? "✓ Resolved" : "⏸ Acknowledged"}
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ background: "none", border: "none", cursor: "pointer", color: DS.text.tertiary, display: "flex", alignItems: "center", gap: "2px", fontSize: "11px", padding: "2px" }}
            >
              {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Details</>}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${DS.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Evidence Chain</p>
              {alert.evidenceChain.map((ev, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", padding: "8px", background: DS.elevated, borderRadius: "6px" }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: DOMAIN_COLORS[ev.domain] ?? DS.text.tertiary, marginTop: "3px" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: DS.text.primary, margin: "0 0 2px", fontWeight: 500 }}>{ev.source}</p>
                    <p style={{ fontSize: "11px", color: DS.text.secondary, margin: 0, lineHeight: 1.4 }}>{ev.description}</p>
                    <p style={{ fontSize: "10px", color: DS.text.tertiary, margin: "2px 0 0" }}>{timeAgo(ev.timestamp)} · weight: {(ev.weight * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Recommended Actions</p>
              {alert.recommendedActions.map((action, idx) => (
                <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                  <ArrowRight size={11} color={DS.accent.blue} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "11px", color: DS.text.secondary, lineHeight: 1.5 }}>{action}</span>
                </div>
              ))}
              {alert.advisoryContext && (
                <div style={{ marginTop: "10px", padding: "8px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "6px" }}>
                  <p style={{ fontSize: "11px", color: DS.accent.purple, margin: 0, lineHeight: 1.5 }}>{alert.advisoryContext}</p>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: "10px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Affected Entities</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {alert.affectedEntities.map(e => (
                <span key={e.id} style={{ fontSize: "10px", padding: "3px 8px", background: DS.elevated, border: `1px solid ${DS.border}`, borderRadius: "6px", color: DS.text.secondary }}>
                  {e.name} ({e.type})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FusionAlerts() {
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">("all");
  const [filterCategory, setFilterCategory] = useState<AlertCategory | "all">("all");
  const [alerts] = useState<FusionAlert[]>(DEMO_ALERTS);

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    return true;
  });

  const stats = {
    critical: alerts.filter(a => a.severity === "critical" && a.status === "active").length,
    high: alerts.filter(a => a.severity === "high" && a.status === "active").length,
    total: alerts.filter(a => a.status === "active").length,
    domains: new Set(alerts.flatMap(a => a.affectedDomains)).size,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: DS.bg, color: DS.text.primary, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${DS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Layers size={20} color={DS.accent.purple} />
          <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Fusion Intelligence</h1>
          <span style={{ fontSize: "11px", padding: "2px 8px", background: "rgba(167,139,250,0.12)", color: DS.accent.purple, borderRadius: "20px", border: "1px solid rgba(167,139,250,0.25)" }}>CORTEX ACTIVE</span>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: "Active Alerts", value: stats.total, color: DS.accent.orange },
            { label: "Critical", value: stats.critical, color: DS.accent.red },
            { label: "High", value: stats.high, color: DS.accent.orange },
            { label: "Domains Affected", value: stats.domains, color: DS.accent.purple },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "8px 14px", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "8px" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "10px", color: DS.text.tertiary }}>{stat.label}</div>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: "11px", color: DS.accent.green, display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.accent.green, animation: "pulse 2s infinite" }} />
              Fusion Cortex scanning
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as AlertSeverity | "all")}
            style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "7px", padding: "6px 10px", color: DS.text.secondary, fontSize: "12px" }}>
            <option value="all">All Severities</option>
            {(["critical", "high", "medium", "low"] as AlertSeverity[]).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as AlertCategory | "all")}
            style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "7px", padding: "6px 10px", color: DS.text.secondary, fontSize: "12px" }}>
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", color: DS.text.tertiary }}>
            <CheckCircle size={32} style={{ marginBottom: "12px", opacity: 0.3 }} />
            <p style={{ fontSize: "14px", margin: 0 }}>No active fusion alerts match the current filter</p>
          </div>
        ) : (
          filteredAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
    </div>
  );
}
