import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { apiRequest } from "@/lib/api";
import {
  Activity, AlertTriangle, Brain, ChevronDown,
  Clock, Filter, GitBranch, Globe, Layers, RefreshCw,
  Shield, Ship, TrendingUp, CheckCircle,
  MessageSquare, ArrowRight, Building2, Scale, Target,
} from "lucide-react";

const DOMAIN_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  vessels: { label: "Vessels", color: "#38bdf8", icon: Ship },
  firestorm: { label: "Aegis", color: "#818cf8", icon: Shield },
  terra: { label: "Terra", color: "#4ade80", icon: Building2 },
  "prism-counsel": { label: "PRISM", color: "#d4a054", icon: Scale },
  "szl-holdings": { label: "SZL Holdings", color: "#3b82f6", icon: Target },
  lyte: { label: "Lyte", color: "#22d3ee", icon: Activity },
  maritime: { label: "Maritime", color: "#38bdf8", icon: Ship },
  security: { label: "Security", color: "#818cf8", icon: Shield },
  legal: { label: "Legal", color: "#d4a054", icon: Scale },
  financial: { label: "Financial", color: "#3b82f6", icon: TrendingUp },
  real_estate: { label: "Real Estate", color: "#4ade80", icon: Building2 },
};

const SEVERITY_META = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", label: "CRITICAL" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.07)", border: "rgba(249,115,22,0.22)", label: "HIGH" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.20)", label: "MEDIUM" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.05)", border: "rgba(16,185,129,0.18)", label: "LOW" },
};

const DEMO_FUSION_ALERTS = [
  {
    id: "demo-f1",
    title: "AURORA Owner Filed PRISM Litigation — Terra Brooklyn Property −18%",
    summary: "Vessel AURORA's beneficial owner has a new PRISM Counsel litigation filing. Cross-referencing: their Terra property in Brooklyn has declined 18% in 30 days. Carlota Jo advisory review recommended.",
    severity: "high",
    category: "litigation_impact",
    confidence: 0.91,
    affectedDomains: ["vessels", "prism-counsel", "terra"],
    affectedEntities: [
      { id: "aurora-vessel", name: "AURORA (IMO 9234567)", domain: "vessels", type: "vessel" },
      { id: "meridian-capital", name: "Meridian Capital LLC", domain: "prism-counsel", type: "organization" },
      { id: "brooklyn-property", name: "345 Atlantic Ave, Brooklyn", domain: "terra", type: "property" },
    ],
    evidenceChain: [
      { source: "Vessels Intelligence", domain: "maritime", description: "AURORA registered to Meridian Capital LLC (BVI)", weight: 0.9, timestamp: new Date().toISOString() },
      { source: "PRISM Counsel", domain: "legal", description: "Meridian Capital LLC — new litigation filing, SDNY, $12M exposure", weight: 0.95, timestamp: new Date().toISOString() },
      { source: "Terra Intelligence", domain: "real_estate", description: "345 Atlantic Ave valuation −18% over 30 days, Meridian Capital tenant-in-common", weight: 0.85, timestamp: new Date().toISOString() },
    ],
    recommendedActions: [
      "Schedule tri-domain advisory review: Helmsman + Lexis + Terra agents",
      "Review vessel financing covenants for cross-default provisions",
      "Initiate property valuation audit — confirm independence from litigation",
    ],
    advisoryContext: "Carlota Jo Advisory: The convergence of maritime ownership, active litigation, and real estate distress in a single beneficial owner structure represents a systemic risk signal. Executive briefing within 24 hours.",
    generatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "active",
    tags: ["vessel", "litigation", "real-estate", "beneficial-owner"],
    patternId: "pat-001",
  },
  {
    id: "demo-f2",
    title: "APT41 Maritime Targeting — Fleet Route Overlaps Active IOC",
    summary: "Aegis threat intelligence correlated APT41 Volt Typhoon IOCs with shipping lanes used by SZL fleet. Three vessels transiting affected corridor. Immediate route risk review required.",
    severity: "critical",
    category: "threat_escalation",
    confidence: 0.88,
    affectedDomains: ["vessels", "firestorm"],
    affectedEntities: [
      { id: "apt41-threat", name: "APT41 / Volt Typhoon", domain: "firestorm", type: "threat" },
      { id: "atlas-wind", name: "SZL Fleet Segment Alpha", domain: "vessels", type: "asset" },
    ],
    evidenceChain: [
      { source: "Aegis SOC", domain: "security", description: "APT41 IOCs detected on South China Sea maritime infrastructure (T1590)", weight: 0.92, timestamp: new Date().toISOString() },
      { source: "Vessels Intelligence", domain: "maritime", description: "ATLAS WIND, MERIDIAN STAR, TYPHOON PEAK transiting Strait of Malacca", weight: 0.88, timestamp: new Date().toISOString() },
    ],
    recommendedActions: [
      "Alert Helmsman — recommend alternate routing for all three vessels",
      "Engage Sentinel for full TTP mapping: APT41 maritime targeting playbook",
      "Brief SZL CISO and fleet operations director — joint call within 1 hour",
    ],
    advisoryContext: "CRITICAL CROSS-DOMAIN: Maritime and security intelligence streams have converged. This pattern matches historical APT maritime targeting.",
    generatedAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    status: "active",
    tags: ["apt41", "maritime", "threat-intelligence"],
    patternId: "pat-002",
  },
  {
    id: "demo-f3",
    title: "Shell Company Structure — Multi-Hop Ownership to OFAC SDN Entity",
    summary: "GraphRAG traversal identified a 4-hop ownership chain linking SZL portfolio entity to an OFAC SDN-listed organization through BVI intermediate structures. KYC refresh required.",
    severity: "high",
    category: "sanctions_exposure",
    confidence: 0.79,
    affectedDomains: ["szl-holdings", "prism-counsel", "vessels"],
    affectedEntities: [
      { id: "pacific-ventures", name: "Pacific Ventures Holdings BVI", domain: "szl-holdings", type: "organization" },
      { id: "sdn-entity", name: "SDN Entity (Redacted)", domain: "prism-counsel", type: "organization" },
    ],
    evidenceChain: [
      { source: "Ontology Graph", domain: "financial", description: "Pacific Ventures → Starlight Maritime → Coral Trading → [REDACTED SDN]", weight: 0.79, timestamp: new Date().toISOString() },
      { source: "OFAC Database", domain: "legal", description: "Terminal entity confirmed on OFAC SDN list — Russian oligarch exposure", weight: 0.95, timestamp: new Date().toISOString() },
    ],
    recommendedActions: [
      "Lexis agent: emergency OFAC compliance review within 4 hours",
      "Freeze pending transactions involving Pacific Ventures Holdings",
      "Engage external sanctions counsel for regulatory notification assessment",
    ],
    generatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: "active",
    tags: ["sanctions", "ofac", "shell-company", "kyc"],
    patternId: "pat-004",
  },
];

const DEMO_PREDICTIVE_ALERTS = [
  {
    id: "pred-1",
    title: "Bunker Fuel Spike → Rate Pressure → Tenant Default Risk",
    summary: "Cascade analysis: Bunker fuel costs up 28% projects 74% aggregate risk score across 4 downstream domains within 30d window. Critical impact expected in: szl-holdings, terra.",
    triggerDomain: "vessels",
    triggerSignal: "Bunker fuel costs up 28% over 60 days across SZL fleet",
    confidence: 0.82,
    severity: "high",
    timeToMaterializedays: 30,
    affectedDomains: ["vessels", "szl-holdings", "terra", "prism-counsel"],
    cascadeTree: {
      overallRiskScore: 0.74,
      criticalPath: ["vessels", "szl-holdings", "terra"],
      nodes: [
        { domain: "szl-holdings", impactLevel: "severe", probability: 0.62, timeToImpactDays: 3, mechanism: "Fleet revenue and cargo insurance claims impact portfolio cash flow" },
        { domain: "terra", impactLevel: "significant", probability: 0.44, timeToImpactDays: 14, mechanism: "Trade disruption impacts port-adjacent real estate valuations" },
        { domain: "prism-counsel", impactLevel: "moderate", probability: 0.34, timeToImpactDays: 7, mechanism: "Vessel incidents trigger admiralty law proceedings" },
      ],
    },
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    status: "active",
    tags: ["fuel", "macro", "tenant", "cascade"],
  },
  {
    id: "pred-2",
    title: "APT41 OT Campaign → Fleet Disruption → Portfolio Cash Flow Impact",
    summary: "Cascade analysis: APT41 Volt Typhoon targeting maritime OT infrastructure projects 81% aggregate risk score. Critical impact in szl-holdings within 1 day.",
    triggerDomain: "firestorm",
    triggerSignal: "APT41 Volt Typhoon targeting maritime OT infrastructure",
    confidence: 0.88,
    severity: "critical",
    timeToMaterializedays: 7,
    affectedDomains: ["firestorm", "vessels", "szl-holdings", "prism-counsel", "lyte"],
    cascadeTree: {
      overallRiskScore: 0.81,
      criticalPath: ["firestorm", "szl-holdings", "vessels"],
      nodes: [
        { domain: "szl-holdings", impactLevel: "catastrophic", probability: 0.70, timeToImpactDays: 1, mechanism: "Security breach creates direct financial liability" },
        { domain: "vessels", impactLevel: "severe", probability: 0.57, timeToImpactDays: 2, mechanism: "OT/SCADA attacks cascade to fleet operational systems" },
        { domain: "lyte", impactLevel: "significant", probability: 0.75, timeToImpactDays: 0.5, mechanism: "Security incidents immediately degrade platform reliability" },
      ],
    },
    generatedAt: new Date(Date.now() - 1800000).toISOString(),
    status: "active",
    tags: ["apt41", "ot", "maritime", "cascade"],
  },
  {
    id: "pred-3",
    title: "Brooklyn Property Distress → PRISM Litigation Wave → SZL LTV Breach",
    summary: "Cascade analysis: Brooklyn submarket 15% valuation decline projects 67% aggregate risk score across portfolio within 90d. DSCR covenant breaches expected.",
    triggerDomain: "terra",
    triggerSignal: "Brooklyn submarket showing 15% valuation decline — 47 properties flagged",
    confidence: 0.76,
    severity: "high",
    timeToMaterializedays: 90,
    affectedDomains: ["terra", "szl-holdings", "prism-counsel"],
    cascadeTree: {
      overallRiskScore: 0.67,
      criticalPath: ["terra", "szl-holdings", "prism-counsel"],
      nodes: [
        { domain: "szl-holdings", impactLevel: "severe", probability: 0.65, timeToImpactDays: 7, mechanism: "Property valuation changes directly update portfolio NAV and LTV covenants" },
        { domain: "prism-counsel", impactLevel: "significant", probability: 0.46, timeToImpactDays: 14, mechanism: "Distressed properties trigger tenant disputes and foreclosure proceedings" },
      ],
    },
    generatedAt: new Date(Date.now() - 7200000).toISOString(),
    status: "active",
    tags: ["property", "brooklyn", "ltv", "cascade"],
  },
];

const DEMO_PATTERNS = [
  { id: "pat-001", name: "Litigation-Financial Stress Cascade", category: "litigation_financial", requiredDomains: ["prism-counsel", "szl-holdings"], confidenceScore: 0.85, hitCount: 12, status: "active", feedbackAdjustment: 0.02, tags: ["litigation", "financial"] },
  { id: "pat-002", name: "Maritime-Security Threat Convergence", category: "maritime_security", requiredDomains: ["vessels", "firestorm"], confidenceScore: 0.92, hitCount: 8, status: "active", feedbackAdjustment: 0.03, tags: ["maritime", "security"] },
  { id: "pat-003", name: "Tri-Domain Property Risk Signal", category: "property_legal_financial", requiredDomains: ["terra", "prism-counsel", "szl-holdings"], confidenceScore: 0.88, hitCount: 5, status: "active", feedbackAdjustment: -0.01, tags: ["property", "legal"] },
  { id: "pat-004", name: "Multi-Hop Beneficial Ownership Chain", category: "ownership_chain", requiredDomains: ["szl-holdings", "vessels"], confidenceScore: 0.78, hitCount: 3, status: "active", feedbackAdjustment: 0, tags: ["ownership", "sanctions"] },
  { id: "pat-005", name: "Geopolitical Fuel-Rate-Default Cascade", category: "geopolitical_cascade", requiredDomains: ["vessels", "szl-holdings", "terra"], confidenceScore: 0.74, hitCount: 2, status: "active", feedbackAdjustment: -0.02, tags: ["geopolitical", "predictive"] },
  { id: "pat-006", name: "Cyber-Maritime Infrastructure Targeting", category: "cyber_maritime", requiredDomains: ["firestorm", "vessels"], confidenceScore: 0.87, hitCount: 6, status: "active", feedbackAdjustment: 0.01, tags: ["cyber", "maritime"] },
];

function LivePulse({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: color, opacity: 0.35, animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span style={{ position: "relative", borderRadius: "50%", width: size, height: size, backgroundColor: color }} />
    </span>
  );
}

function DomainBadge({ domain }: { domain: string }) {
  const meta = DOMAIN_META[domain] ?? { label: domain, color: "#6b7280", icon: Globe };
  const Icon = meta.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 7px", borderRadius: 4,
      background: `${meta.color}14`, border: `1px solid ${meta.color}28`,
      fontSize: 11, color: meta.color, fontWeight: 600, letterSpacing: "0.02em",
    }}>
      <Icon size={9} />
      {meta.label}
    </span>
  );
}

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${Math.round(value * 100)}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 32 }}>{Math.round(value * 100)}%</span>
    </div>
  );
}

function ImpactChip({ level }: { level: string }) {
  const COLORS: Record<string, string> = {
    catastrophic: "#ef4444", severe: "#f97316", significant: "#eab308",
    moderate: "#10b981", negligible: "#6b7280",
  };
  const color = COLORS[level] ?? "#6b7280";
  return (
    <span style={{
      display: "inline-block", padding: "1px 6px", borderRadius: 3,
      background: `${color}18`, border: `1px solid ${color}30`,
      fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {level}
    </span>
  );
}

function FeedbackPanel({ alertId, patternId, onSubmit }: {
  alertId: string;
  patternId?: string;
  onSubmit: (data: { rating: number; relevance: string; notes: string }) => void;
}) {
  const [rating, setRating] = useState(0);
  const [relevance, setRelevance] = useState<"confirmed" | "false_positive" | "partially_relevant">("confirmed");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit({ rating, relevance, notes });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.08)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
        <CheckCircle size={14} color="#10b981" />
        <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Feedback recorded — pattern engine updated</span>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ fontSize: 11, color: "hsl(210,5%,55%)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate Alert Relevance</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map(r => (
          <button key={r} onClick={() => setRating(r)} style={{
            width: 28, height: 28, borderRadius: 4, border: `1px solid ${rating >= r ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
            background: rating >= r ? "rgba(59,130,246,0.15)" : "transparent",
            color: rating >= r ? "#3b82f6" : "hsl(210,5%,45%)", cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}>{r}</button>
        ))}
        <span style={{ fontSize: 11, color: "hsl(210,5%,45%)", alignSelf: "center", marginLeft: 4 }}>
          {rating === 0 ? "Select" : rating >= 4 ? "Highly relevant" : rating >= 2 ? "Somewhat relevant" : "Not relevant"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {(["confirmed", "partially_relevant", "false_positive"] as const).map(r => (
          <button key={r} onClick={() => setRelevance(r)} style={{
            padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${relevance === r ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
            background: relevance === r ? "rgba(59,130,246,0.12)" : "transparent",
            color: relevance === r ? "#3b82f6" : "hsl(210,5%,50%)",
          }}>
            {r === "confirmed" ? "Confirmed" : r === "partially_relevant" ? "Partial" : "False Positive"}
          </button>
        ))}
      </div>
      <input
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Optional notes for pattern tuning..."
        style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "hsl(210,5%,75%)", fontSize: 12, marginBottom: 8, outline: "none" }}
      />
      <button onClick={handleSubmit} disabled={rating === 0} style={{
        padding: "5px 14px", borderRadius: 6, border: "none",
        background: rating === 0 ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.85)",
        color: rating === 0 ? "rgba(255,255,255,0.3)" : "#fff",
        fontSize: 12, fontWeight: 600, cursor: rating === 0 ? "not-allowed" : "pointer",
      }}>Submit Feedback</button>
    </div>
  );
}

type FusionAlert = {
  id: string; title: string; summary: string; severity: string; category: string;
  confidence: number; affectedDomains: string[];
  affectedEntities: Array<{ id?: string; name: string; domain: string; type: string }>;
  evidenceChain: Array<{ source: string; domain: string; description: string; weight: number }>;
  recommendedActions: string[]; advisoryContext?: string;
  generatedAt: string; status: string; tags: string[]; patternId?: string;
};

type PredictiveAlert = {
  id: string; title: string; summary: string; triggerDomain: string;
  triggerSignal: string; confidence: number; severity: string;
  timeToMaterializedays: number; affectedDomains: string[];
  cascadeTree: {
    overallRiskScore: number; criticalPath: string[];
    nodes: Array<{ domain: string; impactLevel: string; probability: number; timeToImpactDays: number; mechanism: string }>;
  };
  generatedAt: string; status: string; tags: string[];
};

type CorrelationPattern = {
  id: string; name: string; category: string; requiredDomains: string[];
  confidenceScore: number; hitCount: number; status: string;
  feedbackAdjustment: number; tags: string[];
};

function FusionAlertCard({ alert, index, onFeedbackSubmit }: {
  alert: FusionAlert; index: number;
  onFeedbackSubmit: (alertId: string, patternId: string | undefined, data: { rating: number; relevance: string; notes: string }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const sev = SEVERITY_META[alert.severity as keyof typeof SEVERITY_META] ?? SEVERITY_META.medium;

  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderRadius: 12, border: `1px solid ${sev.border}`, background: sev.bg, overflow: "hidden" }}
    >
      <div style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <LivePulse color={sev.color} size={8} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{
                display: "inline-block", padding: "1px 7px", borderRadius: 3,
                background: `${sev.color}20`, border: `1px solid ${sev.color}40`,
                fontSize: 10, color: sev.color, fontWeight: 700, letterSpacing: "0.08em",
              }}>{sev.label}</span>
              {alert.affectedDomains.map(d => <DomainBadge key={d} domain={d} />)}
              <span style={{ fontSize: 10, color: "hsl(210,5%,40%)", marginLeft: "auto" }}>
                <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                {new Date(alert.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.4, margin: 0 }}>{alert.title}</h3>
          </div>
          <m.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} color="hsl(210,5%,50%)" />
          </m.div>
        </div>
        <p style={{ fontSize: 12.5, color: "hsl(210,5%,60%)", lineHeight: 1.55, margin: "0 0 10px 18px" }}>{alert.summary}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 18 }}>
          <span style={{ fontSize: 11, color: "hsl(210,5%,48%)" }}>
            Confidence: <span style={{ color: sev.color, fontWeight: 700 }}>{Math.round(alert.confidence * 100)}%</span>
          </span>
          <span style={{ fontSize: 11, color: "hsl(210,5%,48%)" }}>{alert.affectedEntities.length} entities</span>
          <span style={{ fontSize: 11, color: "hsl(210,5%,48%)" }}>{alert.evidenceChain.length} evidence items</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden", borderTop: `1px solid ${sev.border}` }}
          >
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "hsl(210,5%,50%)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Evidence Chain</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {alert.evidenceChain.map((ev, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: DOMAIN_META[ev.domain]?.color ?? "#6b7280", flexShrink: 0 }} />
                        {i < alert.evidenceChain.length - 1 && <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", marginTop: 2 }} />}
                      </div>
                      <div style={{ flex: 1, paddingBottom: i < alert.evidenceChain.length - 1 ? 8 : 0 }}>
                        <span style={{ fontSize: 10, color: DOMAIN_META[ev.domain]?.color ?? "#6b7280", fontWeight: 700 }}>{ev.source}</span>
                        <p style={{ fontSize: 12, color: "hsl(210,5%,65%)", margin: "2px 0 0", lineHeight: 1.5 }}>{ev.description}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <div style={{ width: 28, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${Math.round(ev.weight * 100)}%`, height: "100%", background: sev.color }} />
                        </div>
                        <span style={{ fontSize: 10, color: sev.color, fontWeight: 700 }}>{Math.round(ev.weight * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {alert.advisoryContext && (
                <div style={{ padding: "10px 12px", background: "rgba(212,160,84,0.08)", borderRadius: 8, border: "1px solid rgba(212,160,84,0.2)" }}>
                  <p style={{ fontSize: 11, color: "#d4a054", fontWeight: 700, marginBottom: 4 }}>Carlota Jo Advisory</p>
                  <p style={{ fontSize: 12, color: "hsl(210,5%,65%)", lineHeight: 1.55, margin: 0 }}>{alert.advisoryContext}</p>
                </div>
              )}

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "hsl(210,5%,50%)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Recommended Actions</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {alert.recommendedActions.map((action, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <ArrowRight size={12} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: "hsl(210,5%,70%)" }}>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {alert.tags.map(tag => (
                  <span key={tag} style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "hsl(210,5%,50%)" }}>
                    #{tag}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setShowFeedback(!showFeedback)} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6,
                  background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                  color: "#60a5fa", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  <MessageSquare size={12} /> Rate Relevance
                </button>
                {alert.affectedEntities[0] && (
                  <Link href={`/intelligence/analyst?entity=${encodeURIComponent(alert.affectedEntities[0].id ?? alert.affectedEntities[0].name)}`}>
                    <a style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "hsl(210,5%,60%)", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none",
                    }}>
                      <GitBranch size={12} /> Investigate
                    </a>
                  </Link>
                )}
              </div>

              {showFeedback && (
                <FeedbackPanel
                  alertId={alert.id}
                  patternId={alert.patternId}
                  onSubmit={(data) => onFeedbackSubmit(alert.id, alert.patternId, data)}
                />
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

function PredictiveAlertCard({ alert, index }: { alert: PredictiveAlert; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_META[alert.severity as keyof typeof SEVERITY_META] ?? SEVERITY_META.medium;

  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderRadius: 12, border: `1px solid ${sev.border}`, background: "rgba(255,255,255,0.015)", overflow: "hidden" }}
    >
      <div style={{ padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <TrendingUp size={13} color={sev.color} />
          <span style={{ fontSize: 10, color: sev.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>PREDICTIVE — {alert.severity.toUpperCase()}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "hsl(210,5%,40%)" }}>T+{alert.timeToMaterializedays}d window</span>
        </div>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", margin: "0 0 6px", lineHeight: 1.4 }}>{alert.title}</h4>
        <p style={{ fontSize: 12, color: "hsl(210,5%,58%)", lineHeight: 1.5, margin: "0 0 8px" }}>{alert.summary}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}><ConfidenceBar value={alert.cascadeTree.overallRiskScore ?? 0} color={sev.color} /></div>
          <span style={{ fontSize: 11, color: "hsl(210,5%,45%)" }}>Risk score</span>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {alert.affectedDomains.map(d => <DomainBadge key={d} domain={d} />)}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ padding: "12px 14px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "hsl(210,5%,48%)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Cascade Impact Tree</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", background: `${sev.color}10`, borderRadius: 6 }}>
                  <span style={{ fontSize: 10, color: sev.color, fontWeight: 700 }}>ORIGIN</span>
                  <DomainBadge domain={alert.triggerDomain} />
                  <span style={{ fontSize: 12, color: "hsl(210,5%,65%)", flex: 1 }}>{alert.triggerSignal}</span>
                </div>
                {alert.cascadeTree.nodes.map((node, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                    <span style={{ fontSize: 10, color: "hsl(210,5%,40%)", width: 40 }}>→ {node.timeToImpactDays}d</span>
                    <DomainBadge domain={node.domain} />
                    <ImpactChip level={node.impactLevel} />
                    <span style={{ fontSize: 11, color: "hsl(210,5%,60%)", flex: 1 }}>{Math.round(node.probability * 100)}% probability</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                <p style={{ fontSize: 11, color: "hsl(210,5%,50%)", margin: 0 }}>
                  Critical path: {alert.cascadeTree.criticalPath.join(" → ")}
                </p>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

function PatternCard({ pattern, index }: { pattern: CorrelationPattern; index: number }) {
  const statusColor = pattern.status === "active" ? "#10b981" : pattern.status === "degraded" ? "#f59e0b" : "#6b7280";
  const adjustmentColor = pattern.feedbackAdjustment > 0 ? "#10b981" : pattern.feedbackAdjustment < 0 ? "#f97316" : "#6b7280";

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, marginTop: 4, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", margin: "0 0 3px", lineHeight: 1.4 }}>{pattern.name}</h4>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {pattern.requiredDomains.map(d => <DomainBadge key={d} domain={d} />)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.02em" }}>{Math.round(pattern.confidenceScore * 100)}%</div>
          <div style={{ fontSize: 10, color: "hsl(210,5%,45%)" }}>confidence</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <ConfidenceBar value={pattern.confidenceScore} color="#3b82f6" />
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
        <span style={{ color: "hsl(210,5%,50%)" }}>
          Hits: <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{pattern.hitCount}</span>
        </span>
        <span style={{ color: "hsl(210,5%,50%)" }}>
          Feedback adj: <span style={{ color: adjustmentColor, fontWeight: 700 }}>{pattern.feedbackAdjustment > 0 ? "+" : ""}{(pattern.feedbackAdjustment * 100).toFixed(1)}%</span>
        </span>
        <span style={{ color: statusColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{pattern.status}</span>
      </div>
    </m.div>
  );
}

type ActiveTab = "fusion-feed" | "predictive" | "patterns";

const POLL_INTERVAL_MS = 30000;

export default function IntelligenceFabricPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("fusion-feed");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const [fusionAlerts, setFusionAlerts] = useState<FusionAlert[]>(DEMO_FUSION_ALERTS);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>(DEMO_PREDICTIVE_ALERTS);
  const [patterns, setPatterns] = useState<CorrelationPattern[]>(DEMO_PATTERNS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [alertRes, predRes, patRes] = await Promise.allSettled([
        apiRequest<{ alerts: FusionAlert[] }>("GET", "/api/fusion/alerts?limit=50"),
        apiRequest<{ alerts: PredictiveAlert[] }>("GET", "/api/fusion/predictive/alerts?limit=50"),
        apiRequest<{ patterns: CorrelationPattern[] }>("GET", "/api/fusion/patterns"),
      ]);

      if (alertRes.status === "fulfilled" && alertRes.value.alerts != null) {
        setFusionAlerts(alertRes.value.alerts.length > 0 ? alertRes.value.alerts : []);
      }
      if (predRes.status === "fulfilled" && predRes.value.alerts != null) {
        setPredictiveAlerts(predRes.value.alerts.length > 0 ? predRes.value.alerts : []);
      }
      if (patRes.status === "fulfilled" && patRes.value.patterns?.length > 0) {
        setPatterns(patRes.value.patterns);
      }
    } catch {
      setLoadError("Using cached intelligence data");
    } finally {
      setIsLoading(false);
      setLastRefresh(Date.now());
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => void fetchAll(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLive, fetchAll]);

  const handleFeedbackSubmit = useCallback(async (
    alertId: string,
    patternId: string | undefined,
    data: { rating: number; relevance: string; notes: string },
  ) => {
    try {
      await apiRequest("POST", `/api/fusion/alerts/${alertId}/feedback`, {
        ...(patternId ? { patternId } : {}),
        relevance: data.relevance,
        rating: data.rating,
        notes: data.notes,
      });
      void fetchAll();
    } catch {
      // Fail silently on feedback — don't disrupt the analyst's workflow
    }
  }, [fetchAll]);

  const filteredAlerts = fusionAlerts.filter(a =>
    severityFilter === "all" || a.severity === severityFilter,
  );

  const TABS: Array<{ key: ActiveTab; label: string; icon: React.ElementType; count: number }> = [
    { key: "fusion-feed", label: "Fusion Feed", icon: Activity, count: fusionAlerts.length },
    { key: "predictive", label: "Predictive Alerts", icon: TrendingUp, count: predictiveAlerts.length },
    { key: "patterns", label: "Pattern Library", icon: Brain, count: patterns.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "hsl(222,14%,7%)", color: "#e2e8f0" }}>
      <SiteNav />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
        <m.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ padding: "6px 8px", background: "rgba(59,130,246,0.1)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.2)" }}>
                  <Layers size={18} color="#3b82f6" />
                </div>
                <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Intelligence Fabric</span>
                <LivePulse color={isLive ? "#10b981" : "#6b7280"} size={8} />
                <span style={{ fontSize: 11, color: isLive ? "#10b981" : "#6b7280", fontWeight: 600 }}>{isLive ? "LIVE" : "PAUSED"}</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2 }}>Cross-Domain Intelligence</h1>
              <p style={{ fontSize: 14, color: "hsl(210,5%,55%)", margin: "6px 0 0", maxWidth: 560 }}>
                Autonomous correlation engine fusing signals across maritime, security, legal, real estate, and finance — surfacing patterns invisible to any single domain.
              </p>
              {loadError && <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>{loadError}</p>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
              <button
                onClick={() => { setIsLive(v => !v); void fetchAll(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                  background: isLive ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isLive ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.1)"}`,
                  color: isLive ? "#10b981" : "hsl(210,5%,55%)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                <LivePulse color={isLive ? "#10b981" : "#6b7280"} size={6} />
                {isLive ? "Live Feed" : "Paused"}
              </button>
              <button
                onClick={() => void fetchAll()}
                disabled={isLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "hsl(210,5%,55%)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                <RefreshCw size={13} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
              <Link href="/intelligence/analyst">
                <a style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
                  color: "#60a5fa", fontSize: 12, fontWeight: 600, textDecoration: "none",
                }}>
                  <GitBranch size={14} /> Analyst Workspace
                </a>
              </Link>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Active Correlations", value: fusionAlerts.filter(a => a.status === "active").length, color: "#ef4444", icon: AlertTriangle },
              { label: "Domains Monitored", value: 6, color: "#3b82f6", icon: Globe },
              { label: "Patterns Active", value: patterns.filter(p => p.status === "active").length, color: "#10b981", icon: Brain },
              { label: "Predictive Alerts", value: predictiveAlerts.filter(a => a.status === "active").length, color: "#f59e0b", icon: TrendingUp },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <m.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  style={{ padding: "14px 16px", borderRadius: 10, background: `radial-gradient(ellipse at top left, ${kpi.color}08 0%, rgba(255,255,255,0.01) 70%)`, border: `1px solid ${kpi.color}18` }}>
                  <Icon size={14} color={kpi.color} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, letterSpacing: "-0.03em" }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "hsl(210,5%,50%)", marginTop: 2 }}>{kpi.label}</div>
                </m.div>
              );
            })}
          </div>
        </m.div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7,
                background: activeTab === tab.key ? "rgba(59,130,246,0.15)" : "transparent",
                border: `1px solid ${activeTab === tab.key ? "rgba(59,130,246,0.3)" : "transparent"}`,
                color: activeTab === tab.key ? "#60a5fa" : "hsl(210,5%,50%)",
                fontSize: 12.5, fontWeight: activeTab === tab.key ? 700 : 500, cursor: "pointer",
              }}>
                <Icon size={13} />
                {tab.label}
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 18, height: 18, borderRadius: 9,
                  background: activeTab === tab.key ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)",
                  fontSize: 10, fontWeight: 700,
                  color: activeTab === tab.key ? "#93c5fd" : "hsl(210,5%,45%)",
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "fusion-feed" && (
            <m.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <Filter size={13} color="hsl(210,5%,50%)" />
                <span style={{ fontSize: 12, color: "hsl(210,5%,50%)" }}>Severity:</span>
                {["all", "critical", "high", "medium", "low"].map(s => (
                  <button key={s} onClick={() => setSeverityFilter(s)} style={{
                    padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: severityFilter === s ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${severityFilter === s ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`,
                    color: severityFilter === s ? "#60a5fa" : "hsl(210,5%,50%)", textTransform: "capitalize",
                  }}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "hsl(210,5%,40%)" }}>
                  <Clock size={10} style={{ display: "inline", marginRight: 4 }} />
                  Updated {Math.round((Date.now() - lastRefresh) / 1000)}s ago
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredAlerts.length === 0
                  ? <p style={{ fontSize: 13, color: "hsl(210,5%,45%)", textAlign: "center", padding: "24px 0" }}>No alerts match the selected filter.</p>
                  : filteredAlerts.map((alert, i) => (
                      <FusionAlertCard key={alert.id} alert={alert} index={i} onFeedbackSubmit={handleFeedbackSubmit} />
                    ))
                }
              </div>
            </m.div>
          )}

          {activeTab === "predictive" && (
            <m.div key="predictive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(251,191,36,0.06)", borderRadius: 8, border: "1px solid rgba(251,191,36,0.15)", display: "flex", gap: 8, alignItems: "center" }}>
                <TrendingUp size={14} color="#fbbf24" />
                <span style={{ fontSize: 12.5, color: "hsl(210,5%,65%)" }}>
                  Forward-looking cascade analysis — signals not yet materialized. The engine projects domain-to-domain propagation using historical transmission coefficients and is auto-updated when fusion scans detect high/critical alerts.
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {predictiveAlerts.map((alert, i) => (
                  <PredictiveAlertCard key={alert.id} alert={alert} index={i} />
                ))}
              </div>
            </m.div>
          )}

          {activeTab === "patterns" && (
            <m.div key="patterns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(59,130,246,0.06)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.15)", display: "flex", gap: 8, alignItems: "center" }}>
                <Brain size={14} color="#60a5fa" />
                <span style={{ fontSize: 12.5, color: "hsl(210,5%,65%)" }}>
                  Pattern library learns continuously — confidence scores adjust based on analyst feedback. Confirmed alerts increase sensitivity; false positives reduce it. Hit counts increment automatically when fusion scans trigger matching patterns.
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
                {patterns.map((pattern, i) => (
                  <PatternCard key={pattern.id} pattern={pattern} index={i} />
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <SiteFooter />
    </div>
  );
}
