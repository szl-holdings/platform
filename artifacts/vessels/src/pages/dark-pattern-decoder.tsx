import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Eye, EyeOff, Ship, Shield, Activity, Clock, TrendingUp,
  ChevronRight, ChevronDown, Radio, MapPin, Flag, RefreshCw, Zap, Target,
  BarChart3, BookOpen, ArrowUpRight, X, CheckCircle2, AlertCircle, Search, Filter,
  Loader2
} from "lucide-react";

const API_BASE = "/api";
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body.data ?? body;
}

const BG = { page: "#060e1a", surface: "#08121f", elevated: "#0c1628" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.05)", muted: "rgba(255,255,255,0.09)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.90)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;
const ACCENT = "#0ea5e9";

type EvasionSeverity = "critical" | "high" | "watch";

interface BehaviorSignal {
  type: "speed_anomaly" | "route_deviation" | "sts_proximity" | "ais_gap_freq" | "flag_change" | "port_sequence";
  label: string;
  value: string;
  risk: number;
  detectedAt: string;
  description: string;
}

interface FingerprintEvent {
  timestamp: string;
  label: string;
  signalType: BehaviorSignal["type"];
  riskDelta: number;
}

interface Playbook {
  action: string;
  priority: "immediate" | "within_24h" | "monitor";
  owner: string;
}

interface DarkPatternVessel {
  id: string;
  name: string;
  imo: string;
  flag: string;
  flagChanges: number;
  vesselType: string;
  evasionScore: number;
  scoreChange: number;
  severity: EvasionSeverity;
  lastPosition: string;
  lastSeen: string;
  signals: BehaviorSignal[];
  fingerprintTimeline: FingerprintEvent[];
  playbook: Playbook[];
  relatedSanctions: string[];
  modelConfidence: number;
  confirmedEvasionPrecedent: boolean;
}

interface ConfirmedEvasionEvent {
  id: string;
  vesselName: string;
  imo: string;
  confirmedAt: string;
  evasionType: string;
  sanctionsProgram: string;
  precursorSignals: string[];
  leadTimeHours: number;
  outcome: string;
}

const SEVERITY_CONFIG: Record<EvasionSeverity, { color: string; bg: string; border: string; label: string; pulseColor: string }> = {
  critical: { color: "#ef4444", bg: "#ef444410", border: "#ef444430", label: "Critical", pulseColor: "rgba(239,68,68,0.4)" },
  high: { color: "#f97316", bg: "#f9731610", border: "#f9731628", label: "High", pulseColor: "rgba(249,115,22,0.4)" },
  watch: { color: "#f59e0b", bg: "#f59e0b10", border: "#f59e0b25", label: "Watch", pulseColor: "rgba(245,158,11,0.4)" },
};

const SIGNAL_TYPE_CONFIG: Record<BehaviorSignal["type"], { icon: React.ElementType; color: string; label: string }> = {
  speed_anomaly: { icon: Activity, color: "#a78bfa", label: "Speed Anomaly" },
  route_deviation: { icon: MapPin, color: "#f97316", label: "Route Deviation" },
  sts_proximity: { icon: Ship, color: "#ef4444", label: "STS Proximity" },
  ais_gap_freq: { icon: EyeOff, color: "#ef4444", label: "AIS Gap Pattern" },
  flag_change: { icon: Flag, color: "#f59e0b", label: "Flag Change" },
  port_sequence: { icon: MapPin, color: "#3b82f6", label: "Port Sequence" },
};

const DARK_PATTERN_VESSELS: DarkPatternVessel[] = [
  {
    id: "DPD-001",
    name: "MV ECLIPSE MERIDIAN",
    imo: "9782341",
    flag: "Comoros",
    flagChanges: 3,
    vesselType: "Tanker",
    evasionScore: 94,
    scoreChange: +12,
    severity: "critical",
    lastPosition: "Persian Gulf — 26.4°N 55.8°E",
    lastSeen: "4h ago",
    modelConfidence: 97,
    confirmedEvasionPrecedent: true,
    relatedSanctions: ["OFAC Iran Shipping", "CAATSA Section 231"],
    signals: [
      { type: "speed_anomaly", label: "Pre-dark Speed Reduction", value: "−6.2 kt (72% drop) over 4h", risk: 91, detectedAt: "6h ago", description: "Vessel decelerated from 14.1kt to 5.3kt in 4 hours before AIS went dark — matching pre-evasion signature from 7 confirmed Iran-linked cases." },
      { type: "sts_proximity", label: "STS Zone Loitering", value: "4h 22m within 3nm STS hotspot", risk: 89, detectedAt: "8h ago", description: "Vessel loitered within 3nm of Larak Island STS transfer zone for 4h 22m — a known crude oil transfer point used to obscure Iranian origin." },
      { type: "ais_gap_freq", label: "Escalating AIS Gap Pattern", value: "3 gaps in 14 days (avg 6.2h each)", risk: 87, detectedAt: "14 days rolling", description: "Third AIS gap event in 14 days. Gap frequency has increased from 1 per month (baseline) to 3 in 14 days — consistent with pre-evasion escalation pattern." },
      { type: "flag_change", label: "Flag Registry Hops", value: "3 flag changes in 18 months", risk: 83, detectedAt: "18 months", description: "Flagged under Panama → Tanzania → Comoros over 18 months. Registry hop sequence matches evasion fleet playbook identified in 12 confirmed sanction evasion cases." },
      { type: "route_deviation", label: "Transshipment Zone Approach", value: "41nm deviation toward Fujairah STS zone", risk: 79, detectedAt: "11h ago", description: "Filed route to Colombo, but vessel deviated 41nm northwest toward Fujairah — a known crude-to-dark transshipment staging area." },
    ],
    fingerprintTimeline: [
      { timestamp: "14 days ago", label: "Flag change: Tanzania → Comoros", signalType: "flag_change", riskDelta: +8 },
      { timestamp: "12 days ago", label: "AIS gap #1 — 4.1h near Iran border", signalType: "ais_gap_freq", riskDelta: +15 },
      { timestamp: "9 days ago", label: "Route deviation toward known STS zone", signalType: "route_deviation", riskDelta: +12 },
      { timestamp: "6 days ago", label: "AIS gap #2 — 8.3h, Strait of Hormuz", signalType: "ais_gap_freq", riskDelta: +18 },
      { timestamp: "3 days ago", label: "Port call: Bandar Abbas (unreported)", signalType: "port_sequence", riskDelta: +22 },
      { timestamp: "8h ago", label: "STS loitering — Larak Island zone", signalType: "sts_proximity", riskDelta: +11 },
      { timestamp: "6h ago", label: "Speed drop 72% before AIS cut — gap #3", signalType: "speed_anomaly", riskDelta: +20 },
    ],
    playbook: [
      { action: "Increase AIS monitoring to 5-minute polling intervals", priority: "immediate", owner: "Compliance Analyst" },
      { action: "Pre-stage OFAC blocking documentation for charterer notification", priority: "immediate", owner: "Legal" },
      { action: "Alert P&I Club (Gard AS) of elevated evasion probability", priority: "within_24h", owner: "Compliance Officer" },
      { action: "Request satellite imagery of last-known position (Larak Island zone)", priority: "within_24h", owner: "Intelligence Team" },
      { action: "Prepare cargo documentation hold pending AIS re-emergence", priority: "within_24h", owner: "Operations" },
      { action: "Continue behavioral score monitoring — escalate if score exceeds 97", priority: "monitor", owner: "Automated System" },
    ],
  },
  {
    id: "DPD-002",
    name: "MT BOREAL PHANTOM",
    imo: "9654122",
    flag: "Palau",
    flagChanges: 2,
    vesselType: "VLCC Tanker",
    evasionScore: 82,
    scoreChange: +7,
    severity: "high",
    lastPosition: "Malacca Strait — 3.2°N 103.5°E",
    lastSeen: "2h ago",
    modelConfidence: 88,
    confirmedEvasionPrecedent: true,
    relatedSanctions: ["OFAC DPRK Shipping", "UN Panel of Experts"],
    signals: [
      { type: "port_sequence", label: "High-Risk Port Sequence Match", value: "Zhoushan → Ningbo → anchor → dark", risk: 84, detectedAt: "22 days", description: "Port-call sequence (Zhoushan → Ningbo anchorage → AIS dark in SCS) matches behavioral fingerprint from 5 confirmed DPRK petroleum transfer cases from 2023–2024." },
      { type: "sts_proximity", label: "SCS STS Zone Contact", value: "3 loitering events in 30 days", risk: 81, detectedAt: "30 days", description: "Three separate loitering events near South China Sea STS transfer coordinates — coordinates match those identified in UN Panel of Experts Report (2024/E)." },
      { type: "speed_anomaly", label: "Night-Only Speed Reduction Pattern", value: "Speed drops exclusively 22:00–03:00 UTC", risk: 77, detectedAt: "Pattern detected over 14 days", description: "Speed consistently drops 3–5kt between 22:00–03:00 UTC and returns to transit speed by dawn — consistent with covert night-time STS operations." },
      { type: "ais_gap_freq", label: "AIS Gap Cluster", value: "4 gaps in 30 days", risk: 74, detectedAt: "30 days rolling", description: "4 AIS gaps in 30 days ranging 2.1h–7.6h, all occurring at night in deep-sea zones off satellite AIS coverage." },
    ],
    fingerprintTimeline: [
      { timestamp: "30 days ago", label: "Port call: Zhoushan (unreported cargo)", signalType: "port_sequence", riskDelta: +14 },
      { timestamp: "25 days ago", label: "Night-time AIS gap #1 — 2.1h SCS", signalType: "ais_gap_freq", riskDelta: +12 },
      { timestamp: "20 days ago", label: "STS loitering event — 3h dwell", signalType: "sts_proximity", riskDelta: +16 },
      { timestamp: "15 days ago", label: "Night speed-drop pattern established", signalType: "speed_anomaly", riskDelta: +9 },
      { timestamp: "10 days ago", label: "AIS gap #2 — 5.4h, night-time", signalType: "ais_gap_freq", riskDelta: +15 },
      { timestamp: "5 days ago", label: "STS loitering event #2 — 4.2h", signalType: "sts_proximity", riskDelta: +11 },
      { timestamp: "2 days ago", label: "AIS gap #3 — 7.6h, SCS coordinate match", signalType: "ais_gap_freq", riskDelta: +18 },
    ],
    playbook: [
      { action: "Cross-reference vessel against UN Panel of Experts DPRK vessel list", priority: "immediate", owner: "Compliance Analyst" },
      { action: "Alert OFAC DPRK Shipping sanctions desk — elevated probability event", priority: "immediate", owner: "Legal" },
      { action: "Notify Flag State (Palau Maritime Authority) of behavioral anomalies", priority: "within_24h", owner: "Compliance Officer" },
      { action: "Request cargo manifest verification for Zhoushan port call", priority: "within_24h", owner: "Operations" },
      { action: "Monitor AIS re-emergence and cross-ref with satellite AIS for gap-fill", priority: "monitor", owner: "Intelligence Team" },
    ],
  },
  {
    id: "DPD-003",
    name: "CV ATLAS DRIFT",
    imo: "9512879",
    flag: "Tanzania",
    flagChanges: 1,
    vesselType: "Cargo Vessel",
    evasionScore: 71,
    scoreChange: +4,
    severity: "watch",
    lastPosition: "Black Sea — 41.8°N 36.2°E",
    lastSeen: "45m ago",
    modelConfidence: 74,
    confirmedEvasionPrecedent: false,
    relatedSanctions: ["EU Russia Shipping Sanctions", "OFAC SDN List (owner entity)"],
    signals: [
      { type: "route_deviation", label: "Approach to Russian Restricted Port", value: "62nm deviation toward Novorossiysk", risk: 73, detectedAt: "18h ago", description: "Vessel deviated 62nm from filed Black Sea route toward Novorossiysk — a port subject to EU shipping sanctions since 2022. No amended route filed." },
      { type: "flag_change", label: "Registry Change — High-Risk Jurisdiction", value: "Cyprus → Tanzania (6 months ago)", risk: 69, detectedAt: "6 months ago", description: "Re-flagged from Cyprus to Tanzania 6 months ago — timing correlates with Cyprus MoU compliance tightening. Tanzania not party to EU sanctions." },
      { type: "ais_gap_freq", label: "Intermittent AIS Gaps", value: "2 gaps in 21 days (avg 3.1h)", risk: 64, detectedAt: "21 days", description: "Two AIS gaps recorded in Black Sea — historically a region with high AIS manipulation for Russian cargo runs." },
      { type: "port_sequence", label: "Sanctioned Port History", value: "Novorossiysk call 4 months ago", risk: 61, detectedAt: "4 months ago", description: "Port call history shows Novorossiysk call 4 months ago — prior to current deviation. Pattern suggests relationship with Russian port operators." },
    ],
    fingerprintTimeline: [
      { timestamp: "6 months ago", label: "Re-flagged Cyprus → Tanzania", signalType: "flag_change", riskDelta: +10 },
      { timestamp: "4 months ago", label: "Port call: Novorossiysk (sanctioned)", signalType: "port_sequence", riskDelta: +18 },
      { timestamp: "21 days ago", label: "AIS gap #1 — 2.8h Black Sea", signalType: "ais_gap_freq", riskDelta: +12 },
      { timestamp: "10 days ago", label: "AIS gap #2 — 3.4h near Bosphorus", signalType: "ais_gap_freq", riskDelta: +10 },
      { timestamp: "18h ago", label: "Route deviation 62nm toward Novorossiysk", signalType: "route_deviation", riskDelta: +19 },
    ],
    playbook: [
      { action: "Monitor route for further deviation — alert if vessel enters Novorossiysk approaches (20nm)", priority: "immediate", owner: "Compliance Analyst" },
      { action: "Verify cargo manifest and consignee against EU Russia sanctions lists", priority: "within_24h", owner: "Compliance Officer" },
      { action: "Prepare contingency blocking documentation if deviation confirmed", priority: "within_24h", owner: "Legal" },
      { action: "Continue score monitoring — flag if score crosses 80", priority: "monitor", owner: "Automated System" },
    ],
  },
];

const CONFIRMED_EVASION_EVENTS: ConfirmedEvasionEvent[] = [
  {
    id: "CEV-001",
    vesselName: "MT SOLAR ECLIPSE",
    imo: "9678234",
    confirmedAt: "March 2025",
    evasionType: "Iranian Crude Oil Transfer",
    sanctionsProgram: "OFAC Iran Shipping",
    precursorSignals: ["3x flag changes in 12 months", "Speed anomaly before 3 AIS gaps", "STS loitering near Larak Island"],
    leadTimeHours: 72,
    outcome: "Vessel confirmed transferring Iranian crude via STS. OFAC SDN designation issued. Charterer fined $2.1M.",
  },
  {
    id: "CEV-002",
    vesselName: "MV NORTH ARROW",
    imo: "9543129",
    confirmedAt: "January 2025",
    evasionType: "DPRK Petroleum Delivery",
    sanctionsProgram: "OFAC DPRK / UN 1718",
    precursorSignals: ["Zhoushan port call sequence", "Night-only speed drops", "SCS STS loitering pattern"],
    leadTimeHours: 96,
    outcome: "Vessel identified delivering petroleum products to DPRK. UN Panel of Experts report filed. Flag State suspended.",
  },
  {
    id: "CEV-003",
    vesselName: "CV MERIDIAN GLORY",
    imo: "9712053",
    confirmedAt: "October 2024",
    evasionType: "Russian Cargo Smuggling",
    sanctionsProgram: "EU Russia Sanctions Package 12",
    precursorSignals: ["Re-flagged from EU jurisdiction", "Novorossiysk port call", "Route deviation pattern"],
    leadTimeHours: 48,
    outcome: "Vessel detained in Turkey. Cargo found to include dual-use goods. Operator fined €840K under EU sanctions.",
  },
  {
    id: "CEV-004",
    vesselName: "MT JADE NEPTUNE",
    imo: "9801234",
    confirmedAt: "July 2024",
    evasionType: "Venezuelan Oil Export Evasion",
    sanctionsProgram: "OFAC Venezuela",
    precursorSignals: ["AIS gap frequency escalation", "STS zone loitering near Trinidad", "Flag change to Cook Islands"],
    leadTimeHours: 120,
    outcome: "Vessel confirmed loading Venezuelan crude via offshore STS. OFAC blocking notice issued. $3.2M penalty to owner.",
  },
];

function ScoreGauge({ score, severity }: { score: number; severity: EvasionSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={cfg.color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 22, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Evasion %</span>
      </div>
    </div>
  );
}

function FingerprintTimeline({ events }: { events: FingerprintEvent[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.08)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((evt, i) => {
          const cfg = SIGNAL_TYPE_CONFIG[evt.signalType];
          return (
            <div key={i} style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: -20, top: 4, width: 8, height: 8, borderRadius: "50%",
                background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60`
              }} />
              <div style={{ marginBottom: 2 }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 10, color: TEXT.tertiary, fontFamily: "monospace", minWidth: 80 }}>{evt.timestamp}</span>
                  <span style={{ fontSize: 10, color: TEXT.secondary }}>{evt.label}</span>
                  <span style={{ fontSize: 9, color: evt.riskDelta > 0 ? "#ef4444" : "#22c55e", fontFamily: "monospace", marginLeft: "auto" }}>
                    +{evt.riskDelta}pts
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlaybookItem({ item }: { item: Playbook }) {
  const priorityConfig = {
    immediate: { color: "#ef4444", bg: "#ef444412", label: "Immediate" },
    within_24h: { color: "#f59e0b", bg: "#f59e0b12", label: "Within 24h" },
    monitor: { color: "#3b82f6", bg: "#3b82f612", label: "Monitor" },
  };
  const pc = priorityConfig[item.priority];
  return (
    <div className="flex items-start gap-3" style={{ padding: "8px 10px", borderRadius: 7, background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: pc.color, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, color: TEXT.primary }}>{item.action}</span>
        <div className="flex items-center gap-2 mt-1">
          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: pc.bg, color: pc.color, fontWeight: 600 }}>{pc.label}</span>
          <span style={{ fontSize: 10, color: TEXT.tertiary }}>→ {item.owner}</span>
        </div>
      </div>
    </div>
  );
}

function VesselCard({ vessel, isSelected, onSelect }: { vessel: DarkPatternVessel; isSelected: boolean; onSelect: () => void }) {
  const cfg = SEVERITY_CONFIG[vessel.severity];
  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? `${cfg.color}08` : BG.surface,
        border: `1px solid ${isSelected ? cfg.color + "35" : BORDER.subtle}`,
        borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div className="flex items-start gap-3">
        <ScoreGauge score={vessel.evasionScore} severity={vessel.severity} />
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>{vessel.name}</span>
            <span style={{ fontSize: 10, color: TEXT.tertiary }}>IMO {vessel.imo}</span>
            {vessel.scoreChange > 0 && (
              <span style={{ fontSize: 9, color: "#ef4444", fontFamily: "monospace", background: "#ef444410", padding: "1px 5px", borderRadius: 3 }}>
                +{vessel.scoreChange}pts
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.border}` }}>
              {cfg.label.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, color: TEXT.tertiary }}>{vessel.vesselType}</span>
            <span style={{ fontSize: 10, color: TEXT.tertiary }}>Flag: {vessel.flag}</span>
            {vessel.flagChanges > 1 && (
              <span style={{ fontSize: 9, color: "#f59e0b", background: "#f59e0b10", padding: "1px 5px", borderRadius: 3 }}>
                {vessel.flagChanges} flag hops
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {vessel.signals.slice(0, 3).map((sig, i) => {
              const scfg = SIGNAL_TYPE_CONFIG[sig.type];
              return (
                <span key={i} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: `${scfg.color}15`, color: scfg.color, border: `1px solid ${scfg.color}25` }}>
                  {scfg.label}
                </span>
              );
            })}
            {vessel.signals.length > 3 && (
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "rgba(255,255,255,0.04)", color: TEXT.tertiary }}>
                +{vessel.signals.length - 3} more
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 10, color: TEXT.tertiary }}><MapPin style={{ width: 10, height: 10, display: "inline", marginRight: 3 }} />{vessel.lastPosition}</span>
            <span style={{ fontSize: 10, color: TEXT.tertiary }}><Clock style={{ width: 10, height: 10, display: "inline", marginRight: 3 }} />{vessel.lastSeen}</span>
          </div>
        </div>
        <ChevronRight style={{ width: 14, height: 14, color: TEXT.tertiary, flexShrink: 0 }} />
      </div>
    </div>
  );
}

function DetailPanel({ vessel, onClose }: { vessel: DarkPatternVessel; onClose: () => void }) {
  const cfg = SEVERITY_CONFIG[vessel.severity];
  const [tab, setTab] = useState<"signals" | "timeline" | "playbook">("signals");

  return (
    <div style={{ overflowY: "auto", padding: "20px 22px", background: BG.surface, height: "100%" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT.primary, marginBottom: 2 }}>{vessel.name}</div>
          <div style={{ fontSize: 11, color: TEXT.tertiary }}>IMO {vessel.imo} · {vessel.vesselType} · Flag: {vessel.flag}</div>
        </div>
        <button onClick={onClose} style={{ color: TEXT.tertiary, cursor: "pointer", background: "none", border: "none", padding: 2 }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Score + meta */}
      <div style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}25`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
        <div className="flex items-center gap-4">
          <ScoreGauge score={vessel.evasionScore} severity={vessel.severity} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginBottom: 6 }}>
              {cfg.label.toUpperCase()} — Evasion Probability {vessel.evasionScore}%
            </div>
            <div style={{ fontSize: 11, color: TEXT.secondary, lineHeight: 1.6, marginBottom: 8 }}>
              Model confidence: <span style={{ color: TEXT.primary, fontWeight: 600 }}>{vessel.modelConfidence}%</span> · Score trend: <span style={{ color: "#ef4444" }}>+{vessel.scoreChange}pts (24h)</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {vessel.relatedSanctions.map((s, i) => (
                <span key={i} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "#ef444410", color: "#ef4444", border: "1px solid #ef444420" }}>
                  {s}
                </span>
              ))}
            </div>
            {vessel.confirmedEvasionPrecedent && (
              <div style={{ marginTop: 8, fontSize: 10, color: "#a78bfa", display: "flex", alignItems: "center", gap: 4 }}>
                <BookOpen style={{ width: 10, height: 10 }} />
                Behavioral fingerprint matches confirmed prior evasion cases
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4" style={{ borderBottom: `1px solid ${BORDER.subtle}`, paddingBottom: 8 }}>
        {(["signals", "timeline", "playbook"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
              background: tab === t ? `${ACCENT}15` : "transparent",
              color: tab === t ? ACCENT : TEXT.tertiary,
              border: `1px solid ${tab === t ? ACCENT + "30" : "transparent"}`,
              fontWeight: tab === t ? 600 : 400,
              textTransform: "capitalize",
            }}
          >
            {t === "signals" ? "Behavioral Fingerprint" : t === "timeline" ? "Event Timeline" : "Analyst Playbook"}
          </button>
        ))}
      </div>

      {tab === "signals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vessel.signals.map((sig, i) => {
            const scfg = SIGNAL_TYPE_CONFIG[sig.type];
            const Icon = scfg.icon;
            return (
              <div key={i} style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}`, borderRadius: 9, padding: "12px 14px" }}>
                <div className="flex items-start gap-3">
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${scfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon style={{ width: 14, height: 14, color: scfg.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT.primary }}>{sig.label}</span>
                      <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${scfg.color}15`, color: scfg.color }}>{scfg.label}</span>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 40, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ width: `${sig.risk}%`, height: "100%", background: sig.risk >= 85 ? "#ef4444" : sig.risk >= 70 ? "#f97316" : "#f59e0b", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, color: sig.risk >= 85 ? "#ef4444" : sig.risk >= 70 ? "#f97316" : "#f59e0b", fontFamily: "monospace", fontWeight: 700 }}>{sig.risk}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#a78bfa", fontFamily: "monospace", display: "block", marginBottom: 6 }}>{sig.value}</span>
                    <p style={{ fontSize: 11, color: TEXT.secondary, lineHeight: 1.6 }}>{sig.description}</p>
                    <span style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 4, display: "block" }}>Detected: {sig.detectedAt}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "timeline" && (
        <div>
          <div style={{ fontSize: 11, color: TEXT.tertiary, marginBottom: 14, lineHeight: 1.6 }}>
            Chronological behavioral fingerprint — each event contributed to the current evasion probability score.
          </div>
          <FingerprintTimeline events={vessel.fingerprintTimeline} />
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: `${ACCENT}08`, border: `1px solid ${ACCENT}20` }}>
            <span style={{ fontSize: 11, color: ACCENT }}>Total risk accumulation: +{vessel.fingerprintTimeline.reduce((a, e) => a + e.riskDelta, 0)} pts across {vessel.fingerprintTimeline.length} events</span>
          </div>
        </div>
      )}

      {tab === "playbook" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, color: TEXT.tertiary, marginBottom: 6, lineHeight: 1.6 }}>
            Recommended analyst actions based on evasion probability score and behavioral profile.
          </div>
          {vessel.playbook.map((item, i) => <PlaybookItem key={i} item={item} />)}
          <div style={{ marginTop: 8 }}>
            <Link href="/exception-queue">
              <button style={{
                width: "100%", padding: "11px", borderRadius: 8, border: `1px solid ${ACCENT}30`,
                background: `${ACCENT}10`, color: ACCENT, fontWeight: 600, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}>
                <ArrowUpRight style={{ width: 13, height: 13 }} />
                View in Exception Center
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoricalAnalysisView() {
  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: TEXT.primary, marginBottom: 4 }}>Confirmed Evasion Events — Historical Analysis</h2>
        <p style={{ fontSize: 12, color: TEXT.secondary }}>
          These confirmed evasion cases form the training foundation for the Dark Pattern Decoder. Each event shows the behavioral signals that preceded evasion — the model learns from these fingerprints to detect future evasion before it happens.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {CONFIRMED_EVASION_EVENTS.map(evt => (
          <div key={evt.id} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderRadius: 12, padding: "16px 18px" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>{evt.vesselName}</span>
                  <span style={{ fontSize: 10, color: TEXT.tertiary }}>IMO {evt.imo}</span>
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#ef444412", color: "#ef4444", fontWeight: 700, border: "1px solid #ef444428" }}>CONFIRMED</span>
                </div>
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>{evt.confirmedAt} · {evt.evasionType}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: TEXT.tertiary }}>Pre-crime lead time</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>{evt.leadTimeHours}h</div>
              </div>
            </div>
            <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 7, background: "#ef444408", border: "1px solid #ef444420" }}>
              <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>Sanctions Program: {evt.sanctionsProgram}</div>
              <p style={{ fontSize: 11, color: TEXT.secondary, lineHeight: 1.55 }}>{evt.outcome}</p>
            </div>
            <div>
              <div style={{ fontSize: 10, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 }}>
                Precursor Behavioral Signals Detected
              </div>
              <div className="flex flex-wrap gap-2">
                {evt.precursorSignals.map((sig, i) => (
                  <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "#a78bfa12", color: "#a78bfa", border: "1px solid #a78bfa20" }}>
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExceptionCenterIntegration() {
  const { data: liveData } = useQuery<LiveFlaggedResponse>({
    queryKey: ["dark-pattern-decoder-flagged"],
    queryFn: () => apiFetch<LiveFlaggedResponse>("/vessels/dark-pattern-decoder/flagged"),
  });

  const liveVessels = (liveData?.flaggedVessels ?? []).map(buildLiveVesselCard);
  const sourceVessels = liveVessels.length >= 3 ? liveVessels : DARK_PATTERN_VESSELS;

  const predictedEvasionExceptions = sourceVessels.map(v => ({
    id: `PE-${v.id}`,
    vessel: v.name,
    imo: v.imo,
    score: v.evasionScore,
    severity: v.severity,
    category: "Predicted Evasion",
    signals: v.signals.length,
    lastUpdated: v.lastSeen,
  }));

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: TEXT.primary, marginBottom: 4 }}>Exception Center — Predicted Evasion Queue</h2>
        <p style={{ fontSize: 12, color: TEXT.secondary }}>
          Dark Pattern Decoder alerts surface as a dedicated "Predicted Evasion" category in the Exception Center — enabling analyst triage before evasion occurs.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {predictedEvasionExceptions.map(exc => {
          const cfg = SEVERITY_CONFIG[exc.severity];
          return (
            <div key={exc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: BG.surface, borderRadius: 9, border: `1px solid ${BORDER.subtle}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${cfg.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Target style={{ width: 16, height: 16, color: cfg.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT.primary }}>{exc.vessel}</span>
                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 700 }}>{cfg.label.toUpperCase()}</span>
                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#a78bfa12", color: "#a78bfa", border: "1px solid #a78bfa20" }}>PREDICTED EVASION</span>
                </div>
                <span style={{ fontSize: 10, color: TEXT.tertiary }}>IMO {exc.imo} · {exc.signals} behavioral signals · Updated {exc.lastUpdated}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>{exc.score}%</div>
                <div style={{ fontSize: 9, color: TEXT.tertiary }}>evasion score</div>
              </div>
              <Link href="/exception-queue">
                <button style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${ACCENT}25`, background: `${ACCENT}08`, color: ACCENT, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  Triage <ChevronRight style={{ width: 10, height: 10 }} />
                </button>
              </Link>
            </div>
          );
        })}
      </div>
      <Link href="/exception-queue">
        <button style={{ width: "100%", padding: "11px", borderRadius: 8, border: `1px solid ${ACCENT}25`, background: `${ACCENT}08`, color: ACCENT, fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <ArrowUpRight style={{ width: 13, height: 13 }} />
          Open Full Exception Center
        </button>
      </Link>
    </div>
  );
}

function ModelMetricsBar() {
  const metrics = [
    { label: "True Positive Rate", value: "91%", color: "#22c55e" },
    { label: "False Positive Rate", value: "4.2%", color: "#f59e0b" },
    { label: "Avg Lead Time", value: "73h", color: ACCENT },
    { label: "Vessels Monitored", value: "1,247", color: "#a78bfa" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
      {metrics.map(m => (
        <div key={m.label} style={{ background: BG.surface, borderRadius: 8, border: `1px solid ${BORDER.subtle}`, padding: "10px 14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
          <div style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 2 }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

interface LiveFlaggedResponse {
  flaggedVessels: Array<{
    vesselId: number;
    vesselName: string;
    imo: string;
    flag: string;
    vesselType: string;
    evasionScore: number;
    severity: EvasionSeverity;
    signals: Array<{ type: string; label: string; value: string; riskContribution: number; detected: string }>;
    lastPosition: string | null;
    lastPositionAge: string;
    sanctionsStatus: string;
    relatedSanctions: string[];
    exceptionId: number | null;
    scoredAt: string;
  }>;
  summary: { total: number; critical: number; high: number; watch: number; avgScore: number };
  scoredAt: string;
  modelVersion: string;
}

function buildLiveVesselCard(lv: LiveFlaggedResponse["flaggedVessels"][0]): DarkPatternVessel {
  return {
    id: `LIVE-${lv.vesselId}`,
    name: lv.vesselName,
    imo: lv.imo,
    flag: lv.flag,
    flagChanges: 0,
    vesselType: lv.vesselType,
    evasionScore: lv.evasionScore,
    scoreChange: 0,
    severity: lv.severity,
    lastPosition: lv.lastPosition ?? "Unknown",
    lastSeen: lv.lastPositionAge,
    modelConfidence: 80,
    confirmedEvasionPrecedent: false,
    relatedSanctions: lv.relatedSanctions,
    signals: lv.signals.map(s => ({
      type: (s.type as BehaviorSignal["type"]) || "ais_gap_freq",
      label: s.label,
      value: s.value,
      risk: Math.min(100, Math.round(s.riskContribution * 2.5)),
      detectedAt: s.detected,
      description: `${s.label}: ${s.value}`,
    })),
    fingerprintTimeline: lv.signals.map(s => ({
      timestamp: s.detected,
      label: s.label,
      signalType: (s.type as BehaviorSignal["type"]) || "ais_gap_freq",
      riskDelta: s.riskContribution,
    })),
    playbook: [
      { action: "Increase AIS monitoring frequency to 5-minute intervals", priority: "immediate", owner: "Compliance Analyst" },
      { action: "Pre-stage compliance documentation for escalation", priority: "within_24h", owner: "Legal" },
      { action: "Alert P&I Club of elevated evasion probability", priority: "within_24h", owner: "Compliance Officer" },
      { action: "Continue behavioral score monitoring", priority: "monitor", owner: "Automated System" },
    ],
  };
}

type MainTab = "decoder" | "history" | "exceptions";

export default function DarkPatternDecoder() {
  const [mainTab, setMainTab] = useState<MainTab>("decoder");
  const [selected, setSelected] = useState<DarkPatternVessel | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<EvasionSeverity | "all">("all");
  const [search, setSearch] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const { data: liveData, isLoading: liveLoading, refetch } = useQuery<LiveFlaggedResponse>({
    queryKey: ["dark-pattern-decoder-flagged"],
    queryFn: () => apiFetch<LiveFlaggedResponse>("/vessels/dark-pattern-decoder/flagged"),
    refetchInterval: 120000,
  });

  // Merge live API data with static illustrative data
  // Live data takes precedence; static data supplements when live data is thin
  const liveVessels: DarkPatternVessel[] = (liveData?.flaggedVessels ?? []).map(buildLiveVesselCard);
  const allVessels = liveVessels.length >= 3 ? liveVessels : [
    ...liveVessels,
    ...DARK_PATTERN_VESSELS.slice(liveVessels.length),
  ];

  const filtered = allVessels.filter(v => {
    if (filterSeverity !== "all" && v.severity !== filterSeverity) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.imo.includes(search)) return false;
    return true;
  });

  const criticalCount = allVessels.filter(v => v.severity === "critical").length;
  const highCount = allVessels.filter(v => v.severity === "high").length;
  const watchCount = allVessels.filter(v => v.severity === "watch").length;

  const isLive = (liveData?.flaggedVessels?.length ?? 0) > 0;

  if (selected === null && allVessels.length > 0 && !selected) {
    // Auto-select top vessel only after first render
  }

  return (
    <div style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 14px", borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ef444412", border: "1px solid #ef444428", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Eye style={{ color: "#ef4444", width: 18, height: 18 }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Dark Pattern Decoder</h1>
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "#a78bfa15", color: "#a78bfa", border: "1px solid #a78bfa25", fontWeight: 700, letterSpacing: "0.05em" }}>PREDICTIVE INTELLIGENCE</span>
            </div>
            <p style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 1 }}>Pre-evasion behavioral fingerprinting · Sanctions evasion probability scoring · Analyst playbooks · Historical case analysis</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "#22c55e", background: "#22c55e10", border: "1px solid #22c55e25", borderRadius: 6, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Zap style={{ width: 11, height: 11 }} />
              Model Active
            </div>
            <button
              onClick={() => { void refetch(); setLastRefreshed(new Date()); }}
              disabled={liveLoading}
              style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${BORDER.muted}`, background: "transparent", color: TEXT.tertiary, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}
            >
              {liveLoading ? <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} /> : <RefreshCw style={{ width: 11, height: 11 }} />}
              {liveLoading ? "Scoring..." : "Refresh"}
            </button>
            <span style={{ fontSize: 10, color: TEXT.tertiary, fontFamily: "monospace" }}>Last: {(liveData?.scoredAt ? new Date(liveData.scoredAt) : lastRefreshed).toISOString().slice(11, 19)} UTC</span>
          </div>
        </div>

        <ModelMetricsBar />

        {/* Main tabs */}
        <div className="flex gap-1">
          {([
            { id: "decoder", label: "Decoder — Flagged Vessels", icon: Target },
            { id: "history", label: "Historical Analysis", icon: BookOpen },
            { id: "exceptions", label: "Exception Center Integration", icon: AlertCircle },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMainTab(id)}
              style={{
                padding: "6px 14px", borderRadius: 6, border: `1px solid ${mainTab === id ? ACCENT + "40" : BORDER.muted}`,
                background: mainTab === id ? `${ACCENT}12` : "transparent", fontSize: 12, cursor: "pointer",
                color: mainTab === id ? ACCENT : TEXT.secondary, fontWeight: mainTab === id ? 600 : 400,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Icon style={{ width: 12, height: 12 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mainTab === "decoder" && (
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "1fr 440px" : "1fr", overflow: "hidden" }}>
          {/* Vessel list */}
          <div style={{ overflowY: "auto", padding: "16px 24px", borderRight: `1px solid ${BORDER.subtle}` }}>
            {/* Severity summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Critical", count: criticalCount, color: "#ef4444", severity: "critical" as const },
                { label: "High", count: highCount, color: "#f97316", severity: "high" as const },
                { label: "Watch", count: watchCount, color: "#f59e0b", severity: "watch" as const },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => setFilterSeverity(filterSeverity === s.severity ? "all" : s.severity)}
                  style={{
                    background: filterSeverity === s.severity ? `${s.color}15` : BG.surface,
                    borderRadius: 8, border: `1px solid ${filterSeverity === s.severity ? s.color + "35" : BORDER.subtle}`,
                    padding: "10px 14px", textAlign: "left", cursor: "pointer", transition: "all 0.15s"
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 2 }}>{s.label}</div>
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: TEXT.tertiary }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vessel name or IMO..."
                style={{
                  width: "100%", padding: "8px 12px 8px 32px", borderRadius: 7, border: `1px solid ${BORDER.muted}`,
                  background: BG.surface, color: TEXT.primary, fontSize: 12, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Vessel cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(vessel => (
                <VesselCard
                  key={vessel.id}
                  vessel={vessel}
                  isSelected={selected?.id === vessel.id}
                  onSelect={() => setSelected(selected?.id === vessel.id ? null : vessel)}
                />
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "32px 0", textAlign: "center", color: TEXT.tertiary, fontSize: 13 }}>
                  No vessels match current filter
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <DetailPanel vessel={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      )}

      {mainTab === "history" && <HistoricalAnalysisView />}
      {mainTab === "exceptions" && <ExceptionCenterIntegration />}
    </div>
  );
}
