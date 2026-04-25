import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardQuery } from "@szl-holdings/api-client-react";
import {
  Eye, Radio, AlertTriangle, CheckCircle2, ArrowRight,
  Shield, Ship, Building2, Briefcase, Zap, Lock, Users,Bell, BellOff, Circle, Layers, Target,
  BarChart3, ShieldCheck, FileCheck, BookOpen, 
  Play, ArrowUpRight, Brain,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ProofDrawer, SAMPLE_PROOF_RECORD, type ProofRecord } from '@/components/ProofDrawer';
import { apiRequest } from "@/lib/api";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const BG = "hsl(214,16%,4%)";
const BORDER = "hsla(0,0%,100%,0.07)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const SURFACE_HOVER = "hsla(0,0%,100%,0.055)";
const TEXT = "hsl(38,8%,94%)";
const TEXT_SEC = "hsl(214,7%,60%)";
const TEXT_FAINT = "hsl(214,7%,40%)";
const LYTE = "hsl(192,72%,48%)";
const MONO = "var(--font-mono)";

type SignalSeverity = "critical" | "high" | "medium" | "info";

type ToastThreshold = "off" | "critical" | "high" | "medium";
const TOAST_THRESHOLDS: ToastThreshold[] = ["off", "critical", "high", "medium"];
const TOAST_THRESHOLD_KEY = "lyte:toast-threshold";
const SEV_RANK: Record<SignalSeverity, number> = { info: 0, medium: 1, high: 2, critical: 3 };
const THRESHOLD_RANK: Record<ToastThreshold, number> = { off: 99, critical: 3, high: 2, medium: 1 };
const THRESHOLD_LABEL: Record<ToastThreshold, string> = {
  off: "Muted",
  critical: "Critical",
  high: "High+",
  medium: "Medium+",
};

const SEV_COLOR: Record<SignalSeverity, string> = {
  critical: "hsl(0,72%,54%)",
  high: "hsl(30,90%,52%)",
  medium: "hsl(48,90%,52%)",
  info: "hsl(192,72%,48%)",
};

const SEV_BG: Record<SignalSeverity, string> = {
  critical: "hsla(0,72%,54%,0.12)",
  high: "hsla(30,90%,52%,0.12)",
  medium: "hsla(48,90%,52%,0.1)",
  info: "hsla(192,72%,48%,0.1)",
};

const DOMAIN_COLOR: Record<string, string> = {
  Aegis: "hsl(222,60%,60%)",
  Vessels: "hsl(206,72%,54%)",
  Terra: "hsl(142,52%,48%)",
  "Counsel": "hsl(260,60%,65%)",
  "Carlota Jo": "hsl(340,52%,60%)",
  Counsel: "hsl(192,72%,48%)",
  IMPERIUM: "hsl(25,72%,54%)",
};

const DOMAIN_ICON: Record<string, typeof Shield> = {
  Aegis: Shield,
  Vessels: Ship,
  Terra: Building2,
  "Counsel": Briefcase,
  "Carlota Jo": Users,
  Counsel: Zap,
  IMPERIUM: Layers,
};

const SOURCE_TO_DOMAIN: Record<string, string> = {
  terra: "Terra", vessels: "Vessels", firestorm: "Aegis",
  prism: "Counsel", alloy: "Counsel", "carlota-jo": "Carlota Jo",
  carlota: "Carlota Jo", manual: "IMPERIUM", monitor: "IMPERIUM",
  api: "Counsel", scheduler: "Counsel",
};

interface ApiSignal {
  id: number | string;
  title: string;
  body?: string | null;
  severity: string;
  source?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  receivedAt: string;
}

interface ApiIncident {
  id: number | string;
  title: string;
  severity?: string | null;
  status: string;
  domain?: string | null;
  metadata?: Record<string, unknown> | null;
  updatedAt?: string | null;
  createdAt: string;
}

interface ApiGovPosture {
  pendingApprovals: number;
  slaBreach24h: number;
  overrideRate7d: number;
  proofCoverage: number | null;
  totalSignals: number;
  newSignals: number;
  openIncidents: number;
  dataAvailable?: boolean;
}

function formatAge(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`;
  return `${Math.floor(ms / 86400000)}d`;
}

function mapApiSignal(s: ApiSignal, _idx: number): SignalItem {
  const meta = (s.metadata ?? {}) as Record<string, unknown>;
  const domain = SOURCE_TO_DOMAIN[s.source ?? ""] ?? "IMPERIUM";
  const sevMap: Record<string, SignalSeverity> = { critical: "critical", high: "high", medium: "medium", low: "info", info: "info", warning: "medium" };
  const sev: SignalSeverity = sevMap[s.severity] ?? "info";
  return {
    id: String(s.id),
    domain,
    severity: sev,
    title: s.title,
    detail: s.body ?? `${domain} signal · ${(meta.signalType as string) ?? "alert"}`,
    age: formatAge(s.receivedAt),
    status: s.status === "new" ? "new" : s.status === "escalated" ? "escalated" : "acknowledged",
  };
}

const STATUS_TO_STAGE: Record<string, string> = {
  open: "Signal", new: "Signal", in_progress: "Context",
  acknowledged: "Recommendation", escalated: "Simulation",
  investigating: "Policy", resolved: "Proof", closed: "Outcome",
};

function mapApiIncident(inc: ApiIncident): SituationItem {
  const meta = (inc.metadata ?? {}) as Record<string, unknown>;
  const stage = (meta.stage as string) ?? STATUS_TO_STAGE[inc.status] ?? "Signal";
  const updated = inc.updatedAt ? `${formatAge(inc.updatedAt)} ago` : `${formatAge(inc.createdAt)} ago`;
  const sev: SignalSeverity = (["critical", "high", "medium", "info"].includes(inc.severity ?? "") ? inc.severity : "info") as SignalSeverity;
  return {
    id: String(inc.id),
    title: inc.title,
    domain: inc.domain ?? (meta.domain as string) ?? "IMPERIUM",
    severity: sev,
    stage,
    owner: (meta.owner as string) ?? (meta.assignedTo as string) ?? "Unassigned",
    pending: (meta.pending as string) ?? getPendingForStage(stage),
    updated,
  };
}

function getPendingForStage(stage: string): string {
  const map: Record<string, string> = {
    Signal: "Context enrichment", Context: "AI recommendation",
    Recommendation: "Simulation run", Simulation: "Policy approval",
    Policy: "Owner assignment", Execution: "Outcome confirmation",
    Proof: "LP review", Outcome: "Closed",
  };
  return map[stage] ?? "Pending review";
}

interface SignalItem {
  id: string;
  domain: string;
  severity: SignalSeverity;
  title: string;
  detail: string;
  age: string;
  status: "new" | "acknowledged" | "escalated";
  correlatedTo?: string;
}

interface SituationItem {
  id: string;
  title: string;
  domain: string;
  severity: SignalSeverity;
  stage: string;
  owner: string;
  pending: string;
  updated: string;
}

const SIGNAL_STREAM: SignalItem[] = [
  { id: "s1", domain: "Aegis", severity: "critical", title: "KEV CVE-2025-1337 — active exploitation confirmed", detail: "3 systems in scope · analyst queue empty · SLA T-2h", age: "4m", status: "new", correlatedTo: "sit1" },
  { id: "s2", domain: "Vessels", severity: "high", title: "Dark vessel detected — AIS signal gap 6h+", detail: "MV Adriatic Star · Last position: Strait of Messina · OFAC check pending", age: "11m", status: "acknowledged", correlatedTo: "sit2" },
  { id: "s3", domain: "Counsel", severity: "high", title: "Motion deadline in 38 hours — no filing draft", detail: "Matter HC-2025-0487 · No owner assigned · LP approval outstanding", age: "22m", status: "new" },
  { id: "s4", domain: "Terra", severity: "medium", title: "Distress signal threshold breached — 12 properties", detail: "NYC distress pipeline · Ownership graph query triggered · Diligence checklist 34% complete", age: "1h", status: "acknowledged" },
  { id: "s5", domain: "Counsel", severity: "medium", title: "Approval queue depth: 14 pending > 72h", detail: "6 workflows stalled · 2 require exec review · Escalation paths unset", age: "2h", status: "acknowledged" },
  { id: "s6", domain: "Carlota Jo", severity: "info", title: "Engagement milestone 3 delivered — awaiting confirmation", detail: "Client: Archipelago Capital · Delivery package sent · Response SLA: 48h", age: "3h", status: "acknowledged" },
  { id: "s7", domain: "IMPERIUM", severity: "info", title: "Configuration drift detected — 2 cloud assets", detail: "AWS us-east-1 · Policy violation: unrestricted egress rule · Auto-tagged", age: "4h", status: "new" },
];

const SITUATION_BOARD: SituationItem[] = [
  { id: "sit1", title: "Active Exploitation Response — CVE-2025-1337", domain: "Aegis", severity: "critical", stage: "Simulation", owner: "Unassigned", pending: "Policy approval", updated: "4m ago" },
  { id: "sit2", title: "MV Adriatic Star — Maritime Anomaly Investigation", domain: "Vessels", severity: "high", stage: "Context", owner: "K. Vasile", pending: "OFAC screening", updated: "11m ago" },
  { id: "sit3", title: "HC-2025-0487 — Motion Filing Protocol", domain: "Counsel", severity: "high", stage: "Recommendation", owner: "Unassigned", pending: "Owner assignment", updated: "22m ago" },
  { id: "sit4", title: "NYC Distress Pipeline — Acquisition Review", domain: "Terra", severity: "medium", stage: "Proof", owner: "R. Chen", pending: "LP review", updated: "1h ago" },
];

const STAGE_FLOW = [
  { id: "Signal", color: "#0ea5e9" },
  { id: "Context", color: "#8b5cf6" },
  { id: "Recommendation", color: "#ec4899" },
  { id: "Simulation", color: "#f59e0b" },
  { id: "Policy", color: "#10b981" },
  { id: "Execution", color: "#6366f1" },
  { id: "Proof", color: "#14b8a6" },
  { id: "Outcome", color: "#ef4444" },
];

const GOV_STATS = [
  { label: "Pending approvals", value: "14", delta: "+3 since 08:00", color: "hsl(30,90%,52%)" },
  { label: "SLA breaches (24h)", value: "3", delta: "–1 from yesterday", color: "hsl(0,72%,54%)" },
  { label: "Override rate (7d)", value: "8.2%", delta: "↑ 1.4pp", color: "hsl(48,90%,52%)" },
  { label: "Proof coverage", value: "97.4%", delta: "↑ from 96.1%", color: "hsl(142,60%,48%)" },
];

function SeverityDot({ sev }: { sev: SignalSeverity }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: SEV_COLOR[sev],
        flexShrink: 0,
        boxShadow: `0 0 5px ${SEV_COLOR[sev]}80`,
      }}
    />
  );
}

function SevBadge({ sev }: { sev: SignalSeverity }) {
  return (
    <span style={{
      fontSize: "0.6rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontFamily: MONO,
      padding: "2px 5px",
      borderRadius: 3,
      background: SEV_BG[sev],
      border: `1px solid ${SEV_COLOR[sev]}30`,
      color: SEV_COLOR[sev],
      flexShrink: 0,
    }}>
      {sev}
    </span>
  );
}

function StageChip({ stage }: { stage: string }) {
  const stg = STAGE_FLOW.find(s => s.id === stage);
  const color = stg?.color ?? LYTE;
  return (
    <span style={{
      fontSize: "0.6rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontFamily: MONO,
      padding: "2px 6px",
      borderRadius: 3,
      background: `${color}18`,
      border: `1px solid ${color}30`,
      color,
    }}>
      {stage}
    </span>
  );
}

function DomainChip({ domain }: { domain: string }) {
  const color = DOMAIN_COLOR[domain] ?? LYTE;
  return (
    <span style={{
      fontSize: "0.6rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      fontFamily: MONO,
      padding: "2px 6px",
      borderRadius: 3,
      background: `${color}15`,
      border: `1px solid ${color}25`,
      color,
    }}>
      {domain}
    </span>
  );
}

function LivePulse({ healthy = true, flash = false }: { healthy?: boolean; flash?: boolean }) {
  const color = healthy ? "hsl(142,60%,48%)" : "hsl(30,90%,52%)";
  const textColor = healthy ? "hsl(142,60%,58%)" : "hsl(30,90%,62%)";
  const label = healthy ? "LIVE" : "DEGRADED";
  const flashColor = "hsl(142,80%,55%)";
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: flash ? flashColor : color,
        boxShadow: flash
          ? `0 0 14px ${flashColor}, 0 0 4px ${flashColor}`
          : `0 0 6px ${color}`,
        transform: flash ? "scale(1.6)" : "scale(1)",
        transition: "background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
      }} />
      <span style={{
        fontSize: "0.6rem",
        fontFamily: MONO,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: flash ? flashColor : textColor,
        transition: "color 0.18s ease",
      }}>
        {label}
      </span>
    </span>
  );
}

function buildSignalProof(sig: SignalItem): ProofRecord {
  const base = SIT_PROOF_RECORDS[sig.correlatedTo ?? ""] ?? SAMPLE_PROOF_RECORD;
  return {
    ...base,
    id: `PCH-${sig.id.toUpperCase()}-20260416`,
    sourceDomain: sig.domain,
    sourceSystem: `${sig.domain} Signal Feed`,
    metadata: {
      ...base.metadata,
      "Signal ID": sig.id.toUpperCase(),
      "Signal title": sig.title,
      "Severity": sig.severity,
      "Age": sig.age,
      ...(sig.correlatedTo ? { "Correlated situation": sig.correlatedTo } : {}),
    },
  };
}

function SignalRow({ sig, active, onClick }: { sig: SignalItem; active: boolean; onClick: () => void }) {
  const DIcon = DOMAIN_ICON[sig.domain] ?? Radio;
  const dc = DOMAIN_COLOR[sig.domain] ?? LYTE;
  const [proofOpen, setProofOpen] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
        padding: "0.75rem 0.875rem",
        borderRadius: "6px",
        background: active ? `${LYTE}0a` : "transparent",
        border: active ? `1px solid ${LYTE}25` : "1px solid transparent",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SURFACE_HOVER; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <button
        onClick={onClick}
        style={{
          all: "unset",
          width: "100%",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <SeverityDot sev={sig.severity} />
          <div style={{ width: 18, height: 18, borderRadius: 4, background: `${dc}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <DIcon size={10} style={{ color: dc }} />
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: TEXT, lineHeight: 1.3, flex: 1, minWidth: 0 }}
            className="truncate">
            {sig.title}
          </span>
          <span style={{ fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT, flexShrink: 0 }}>{sig.age}</span>
        </div>
        <div style={{ paddingLeft: "1.625rem" }}>
          <p style={{ fontSize: "0.6875rem", color: TEXT_SEC, lineHeight: 1.4, margin: 0 }}>{sig.detail}</p>
        </div>
      </button>
      <div style={{ paddingLeft: "1.625rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {sig.status === "new" && (
          <span style={{ fontSize: "0.575rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(0,72%,62%)", background: "hsla(0,72%,54%,0.12)", border: "1px solid hsla(0,72%,54%,0.2)", padding: "1px 5px", borderRadius: 3 }}>
            UNACKNOWLEDGED
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setProofOpen(p => !p); }}
          style={{
            fontSize: "0.575rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: LYTE,
            background: `${LYTE}10`, border: `1px solid ${LYTE}25`,
            padding: "1px 6px", borderRadius: 3, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 3,
          }}
          data-testid={`button-view-proof-${sig.id}`}
        >
          <FileCheck size={9} /> {proofOpen ? "Hide proof" : "View proof"}
        </button>
      </div>
      {proofOpen && (
        <div style={{ paddingLeft: "1.625rem", paddingTop: "0.25rem" }}>
          <ProofDrawer proof={buildSignalProof(sig)} compact={true} defaultOpen={true} />
        </div>
      )}
    </div>
  );
}

function SituationCard({ sit, active, onClick }: { sit: SituationItem; active: boolean; onClick: () => void }) {
  const stg = STAGE_FLOW.findIndex(s => s.id === sit.stage);
  const progress = ((stg + 1) / STAGE_FLOW.length) * 100;
  const [proofOpen, setProofOpen] = useState(false);
  return (
    <div
      style={{
        width: "100%",
        padding: "0.875rem",
        borderRadius: "8px",
        background: active ? `${LYTE}08` : SURFACE,
        border: active ? `1px solid ${LYTE}30` : `1px solid ${BORDER}`,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SURFACE_HOVER; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
    >
      <button
        onClick={onClick}
        style={{ all: "unset", width: "100%", cursor: "pointer", display: "block", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <SeverityDot sev={sit.severity} />
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: TEXT, lineHeight: 1.3, flex: 1, margin: 0 }}>{sit.title}</p>
        </div>
        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.625rem", flexWrap: "wrap" }}>
          <DomainChip domain={sit.domain} />
          <StageChip stage={sit.stage} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", fontSize: "0.6875rem", color: TEXT_FAINT }}>
          <span>Owner: <span style={{ color: sit.owner === "Unassigned" ? "hsl(30,90%,52%)" : TEXT_SEC }}>{sit.owner}</span></span>
          <span style={{ color: BORDER }}>·</span>
          <span>Pending: <span style={{ color: TEXT_SEC }}>{sit.pending}</span></span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "hsla(0,0%,100%,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${LYTE}, hsl(215,72%,60%))`, borderRadius: 2 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
          {STAGE_FLOW.map((s, i) => (
            <div key={s.id} style={{ width: 4, height: 4, borderRadius: "50%", background: i <= stg ? s.color : "hsla(0,0%,100%,0.1)", transition: "background 0.2s" }} />
          ))}
        </div>
      </button>
      <div style={{ marginTop: "0.5rem", display: "flex" }}>
        <button
          onClick={(e) => { e.stopPropagation(); setProofOpen(p => !p); }}
          style={{
            fontSize: "0.575rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: LYTE,
            background: `${LYTE}10`, border: `1px solid ${LYTE}25`,
            padding: "1px 6px", borderRadius: 3, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 3,
          }}
          data-testid={`button-view-proof-sit-${sit.id}`}
        >
          <FileCheck size={9} /> {proofOpen ? "Hide proof" : "View proof"}
        </button>
      </div>
      {proofOpen && (
        <div style={{ marginTop: "0.5rem" }}>
          <ProofDrawer proof={SIT_PROOF_RECORDS[sit.id] ?? SAMPLE_PROOF_RECORD} compact={true} defaultOpen={true} />
        </div>
      )}
    </div>
  );
}

function _ProofEntry({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: "0.75rem", color: TEXT_FAINT, fontFamily: MONO }}>{label}</span>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: color ?? TEXT_SEC }}>{value}</span>
    </div>
  );
}

const SIT_PROOF_RECORDS: Record<string, ProofRecord> = {
  sit1: {
    ...SAMPLE_PROOF_RECORD,
    id: "PCH-SIT1-20260416",
    sourceSystem: "Aegis SOC Feed",
    sourceDomain: "Aegis",
    signalType: "threat_intelligence",
    confidence: 0.94,
    reviewState: "unreviewed",
    exportSafety: "pending_review",
    policyChecks: [
      { label: "Role: ops_analyst — permitted", passed: true },
      { label: "Domain: Aegis — in scope", passed: true },
      { label: "Action: approve_execution — permitted", passed: false, note: "Requires owner assignment" },
      { label: "Human-in-loop gate: required before execution", passed: true },
      { label: "Review state: must be human_reviewed before export", passed: false, note: "Export blocked until review complete" },
    ],
    chainLinks: [
      { id: "c1", event: "Signal ingested — KEV CVE-2025-1337", actor: "System / PRAXIS Bus", timestamp: "16 Apr 2026 08:14:22", hash: "sha256:a3f7b2c1d..." },
      { id: "c2", event: "Correlated with IMPERIUM drift event sf6", actor: "System / Signal Fusion", timestamp: "16 Apr 2026 08:14:24", hash: "sha256:9e1d4f2a8..." },
      { id: "c3", event: "AI recommendation generated — isolate affected hosts", actor: "Model: gpt-4o-mini", timestamp: "16 Apr 2026 08:14:27", hash: "sha256:b4e8f3c6d..." },
      { id: "c4", event: "Policy check: escalated to SOC Lead (owner unassigned)", actor: "System / Covenant Policy", timestamp: "16 Apr 2026 08:14:29", hash: "sha256:c2a9d1f7e..." },
    ],
    metadata: { "Signal ID": "SIG-20260416-001", "MITRE Technique": "T1071.001", "SLA window": "2h", "Correlation ID": "CORR-SF1-SF6" },
  },
  sit2: {
    ...SAMPLE_PROOF_RECORD,
    id: "PCH-SIT2-20260416",
    sourceSystem: "Vessels AIS Feed",
    sourceDomain: "Vessels",
    signalType: "ais_telemetry",
    confidence: 0.91,
    reviewState: "human_reviewed",
    exportSafety: "pending_review",
    policyChecks: [
      { label: "Role: ops_analyst — permitted", passed: true },
      { label: "Domain: Vessels — in scope", passed: true },
      { label: "Action: request_ofac_screen — permitted", passed: true },
      { label: "Human-in-loop gate: K. Vasile assigned", passed: true },
      { label: "OFAC screening required before execution", passed: false, note: "Screening in progress" },
    ],
    chainLinks: [
      { id: "c1", event: "AIS dark gap detected — MV Adriatic Star", actor: "System / Vessels Feed", timestamp: "16 Apr 2026 07:07:44", hash: "sha256:d1e3f5b7a..." },
      { id: "c2", event: "Temporal correlation with Counsel filing event", actor: "System / Signal Fusion", timestamp: "16 Apr 2026 08:03:11", hash: "sha256:f2a8c4e6b..." },
      { id: "c3", event: "OFAC screening initiated", actor: "K. Vasile", timestamp: "16 Apr 2026 08:18:55", hash: "sha256:e7b9d3c2f..." },
    ],
    metadata: { "Signal ID": "SIG-20260416-002", "Last AIS fix": "37.42N, 15.61E", "Gap duration": "6h20m", "OFAC status": "Pending" },
  },
  sit3: {
    ...SAMPLE_PROOF_RECORD,
    id: "PCH-SIT3-20260416",
    sourceSystem: "Counsel Deadline Engine",
    sourceDomain: "Counsel",
    signalType: "deadline_breach_risk",
    confidence: 0.88,
    reviewState: "unreviewed",
    exportSafety: "restricted",
    policyChecks: [
      { label: "Role: ops_analyst — permitted", passed: true },
      { label: "Domain: Counsel — in scope", passed: true },
      { label: "Action: assign_owner — permitted", passed: true },
      { label: "Human-in-loop gate: owner assignment required", passed: false, note: "No owner assigned" },
    ],
    chainLinks: [
      { id: "c1", event: "Deadline T-38h alert — matter HC-2025-0487", actor: "System / Deadline Engine", timestamp: "16 Apr 2026 07:56:18", hash: "sha256:c3d5e7f9a..." },
      { id: "c2", event: "LP approval outstanding — escalation triggered", actor: "System / Covenant Policy", timestamp: "16 Apr 2026 07:56:20", hash: "sha256:a1b3c5d7e..." },
    ],
    metadata: { "Signal ID": "SIG-20260416-003", "Matter": "HC-2025-0487", "Deadline": "T-38h", "LP approval": "Outstanding" },
  },
  sit4: {
    ...SAMPLE_PROOF_RECORD,
    id: "PCH-SIT4-20260416",
    sourceSystem: "Terra Distress Signal Engine",
    sourceDomain: "Terra",
    signalType: "distress_property_signal",
    confidence: 0.82,
    reviewState: "peer_reviewed",
    exportSafety: "safe",
    policyChecks: [
      { label: "Role: ops_analyst — permitted", passed: true },
      { label: "Domain: Terra — in scope", passed: true },
      { label: "Action: request_lp_review — permitted", passed: true },
      { label: "Human-in-loop gate: R. Chen assigned", passed: true },
      { label: "LP review gate: required before acquisition approval", passed: false, note: "LP review pending" },
    ],
    chainLinks: [
      { id: "c1", event: "Distress threshold breach — 12 properties flagged", actor: "System / Terra Signal Engine", timestamp: "16 Apr 2026 07:18:04", hash: "sha256:b2c4d6e8f..." },
      { id: "c2", event: "Ownership graph traversal — entity links identified", actor: "System / Outcome Graph", timestamp: "16 Apr 2026 07:18:09", hash: "sha256:d4e6f8a2b..." },
      { id: "c3", event: "Proof record opened — R. Chen assigned", actor: "R. Chen", timestamp: "16 Apr 2026 07:22:41", hash: "sha256:f6a8b2c4d..." },
      { id: "c4", event: "LP review package dispatched", actor: "R. Chen", timestamp: "16 Apr 2026 07:45:00", hash: "sha256:a8b4c6d2e..." },
    ],
    metadata: { "Signal ID": "SIG-20260416-004", "Asset Set": "NYC distress pipeline", "Properties flagged": "12", "Diligence completion": "34%" },
  },
};

export default function LytePage() {
  const __pageMeta = usePageMeta({
    title: "Lyte — Operational Nerve Center | SZL Holdings",
    description: "Lyte is the governed command surface where the Governed Decision Loop plays out: Signal Ingestion, Risk Surface, Governed Decision with Covenant Policy, and Proof Chain recording — all in one persistent operator interface.",
    canonical: "https://szlholdings.com/lyte",
    ogImage: "https://szlholdings.com/og/og-lyte.jpg",
  });

  const [activeSignal, setActiveSignal] = useState<string>("s1");
  const [activeSit, setActiveSit] = useState<string>("sit1");
  const [filterSev, setFilterSev] = useState<string>("all");
  const [wsConnected, setWsConnected] = useState(false);
  const [pulseFlash, setPulseFlash] = useState(false);
  const [newSignalCount, setNewSignalCount] = useState(0);
  const [toastThreshold, setToastThreshold] = useState<ToastThreshold>(() => {
    if (typeof window === "undefined") return "critical";
    const stored = window.localStorage.getItem(TOAST_THRESHOLD_KEY);
    return TOAST_THRESHOLDS.includes(stored as ToastThreshold) ? (stored as ToastThreshold) : "critical";
  });
  const toastThresholdRef = useRef<ToastThreshold>(toastThreshold);
  useEffect(() => {
    toastThresholdRef.current = toastThreshold;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOAST_THRESHOLD_KEY, toastThreshold);
    }
  }, [toastThreshold]);
  const lastPushAtRef = useRef<number>(0);
  const streamScrollRef = useRef<HTMLDivElement | null>(null);
  const isScrolledRef = useRef<boolean>(false);
  const queryClient = useQueryClient();

  const signalsQuery = useStandardQuery<SignalItem[]>({
    queryKey: ["lyte", "signals"],
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: ApiSignal[] }>("GET", "/api/lyte/signals?limit=20");
      return (res.data ?? []).map((s, i) => mapApiSignal(s, i));
    },
    refetchInterval: 30000,
    staleTime: 20000,
    placeholderData: SIGNAL_STREAM,
  });

  const incidentsQuery = useStandardQuery<SituationItem[]>({
    queryKey: ["lyte", "incidents"],
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: ApiIncident[] }>("GET", "/api/lyte/incidents?limit=10");
      return (res.data ?? []).map(mapApiIncident);
    },
    refetchInterval: 30000,
    staleTime: 20000,
    placeholderData: SITUATION_BOARD,
  });

  const govQuery = useStandardQuery<ApiGovPosture>({
    queryKey: ["lyte", "governance-posture"],
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: ApiGovPosture }>("GET", "/api/lyte/governance-posture");
      return res.data;
    },
    refetchInterval: 60000,
    staleTime: 50000,
  });

  const liveSignals: SignalItem[] = signalsQuery.data ?? SIGNAL_STREAM;
  const liveSituations: SituationItem[] = incidentsQuery.data ?? SITUATION_BOARD;
  const govData = govQuery.data;

  // Real-time signal pushes via WebSocket. Falls back to the 30s polling above
  // if the WS layer is unavailable (server down, proxy blocking, etc.).
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let flashTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false;

    function connect() {
      if (dead) return;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
        return;
      }
      ws.onopen = () => {
        setWsConnected(true);
        ws?.send(JSON.stringify({ type: "subscribe", channel: "lyte:signal:new" }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as {
            type: string;
            channel?: string;
            event?: string;
            data?: ApiSignal;
          };
          if (msg.type !== "message" || msg.channel !== "lyte:signal:new" || !msg.data) return;

          const incoming = mapApiSignal(msg.data, 0);
          lastPushAtRef.current = Date.now();

          let wasNew = false;
          queryClient.setQueryData<SignalItem[]>(["lyte", "signals"], (prev) => {
            const list = prev ?? [];
            if (list.some((s) => s.id === incoming.id)) return list;
            wasNew = true;
            return [incoming, ...list].slice(0, 20);
          });

          if (wasNew) {
            if (isScrolledRef.current) {
              setNewSignalCount((n) => n + 1);
            }
            const threshold = toastThresholdRef.current;
            if (SEV_RANK[incoming.severity] >= THRESHOLD_RANK[threshold]) {
              toast.error(incoming.title, {
                description: incoming.detail,
                duration: 8000,
              });
            }
          }

          setPulseFlash(true);
          if (flashTimer) clearTimeout(flashTimer);
          flashTimer = setTimeout(() => setPulseFlash(false), 600);
        } catch {
          // ignore malformed frames
        }
      };
      ws.onclose = () => {
        setWsConnected(false);
        if (!dead) reconnectTimer = setTimeout(connect, 5000);
      };
      ws.onerror = () => {
        try { ws?.close(); } catch { /* ignore */ }
      };
    }

    connect();

    return () => {
      dead = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (flashTimer) clearTimeout(flashTimer);
      try { ws?.close(); } catch { /* ignore */ }
    };
  }, [queryClient]);

  const STALE_THRESHOLD_MS = 90_000;
  const lastFetchedAt = signalsQuery.dataUpdatedAt ?? 0;
  const lastSignalAt = Math.max(lastFetchedAt, lastPushAtRef.current);
  const isStreamHealthy = !signalsQuery.isError && (
    wsConnected ||
    !signalsQuery.isFetched ||
    (Date.now() - lastSignalAt) < STALE_THRESHOLD_MS
  );

  const liveGovStats = govData ? [
    { label: "Pending approvals", value: String(govData.pendingApprovals), delta: `of ${govData.totalSignals} total signals`, color: "hsl(30,90%,52%)" },
    { label: "SLA breaches (24h)", value: String(govData.slaBreach24h), delta: "escalated signals", color: "hsl(0,72%,54%)" },
    { label: "Override rate (7d)", value: `${govData.overrideRate7d}%`, delta: "of governed actions", color: "hsl(48,90%,52%)" },
    {
      label: "Proof coverage", color: "hsl(142,60%,48%)",
      value: govData.proofCoverage !== null ? `${govData.proofCoverage}%` : "—",
      delta: govData.proofCoverage !== null ? `${govData.openIncidents} open incidents` : "No incident data yet",
    },
  ] : GOV_STATS;

  const sig = liveSignals.find(s => s.id === activeSignal) ?? liveSignals[0] ?? SIGNAL_STREAM[0]!;
  const sit = liveSituations.find(s => s.id === activeSit) ?? liveSituations[0] ?? SITUATION_BOARD[0]!;

  const filteredSignals = filterSev === "all"
    ? liveSignals
    : liveSignals.filter(s => s.severity === filterSev);

  const unacknowledgedCount = liveSignals.filter(s => s.status === "new").length;

  const stgIdx = STAGE_FLOW.findIndex(s => s.id === sit.stage);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT }}>
      <SiteNav />
      <main id="main-content">

        {/* ── Hero: Nerve Center Identity ──────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(6rem,12vw,8rem) 0 clamp(2rem,4vw,3rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT }}>
                  SZL Holdings / Platform
                </span>
                <span style={{ width: 1, height: 12, background: BORDER }} />
                <span style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE }}>
                  Lyte · Operational Nerve Center
                </span>
                <span style={{ width: 1, height: 12, background: BORDER }} />
                <LivePulse healthy={isStreamHealthy} flash={pulseFlash} />
              </div>

              <h1 style={{
                fontSize: "clamp(2.75rem,5.5vw,4.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.04,
                maxWidth: "22ch",
                marginBottom: "1.5rem",
                color: TEXT,
              }}>
                The operational nerve center for governed decisions.
              </h1>

              <p style={{ fontSize: "0.6875rem", fontFamily: MONO, letterSpacing: "0.04em", color: LYTE, marginBottom: "1rem" }}>
                Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome
              </p>

              <p style={{
                fontSize: "clamp(1rem,1.8vw,1.125rem)",
                lineHeight: 1.72,
                color: TEXT_SEC,
                maxWidth: "54ch",
                marginBottom: "2.5rem",
              }}>
                Not a dashboard. Not an AI copilot. Lyte is the persistent command surface where signal intelligence meets governed action — with every decision traced, attributed, and measured. Inspired by the world's most consequential operations centers, built for enterprise.
              </p>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href="/demo" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: LYTE,
                  color: "hsl(214,18%,4%)",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 600,
                  textDecoration: "none",
                }}>
                  See Lyte live <ArrowRight size={14} />
                </Link>
                <Link href="/lyte/decision-theater" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: "transparent",
                  color: TEXT_SEC,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  textDecoration: "none",
                }}>
                  Decision Theater <ArrowUpRight size={13} />
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── Nerve Center Preview: 3-Rail Layout ─────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(3rem,6vw,4rem) 0" }}>
          <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}
            >
              <div>
                <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "0.375rem" }}>
                  Lyte Command Surface
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: TEXT, margin: 0 }}>
                  Persistent three-rail operations view
                </h2>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.6875rem", color: TEXT_FAINT }}>Showing:</span>
                {["all", "critical", "high", "medium"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterSev(f)}
                    style={{
                      padding: "0.3rem 0.625rem",
                      borderRadius: 4,
                      border: `1px solid ${filterSev === f ? `${LYTE}40` : BORDER}`,
                      background: filterSev === f ? `${LYTE}12` : "transparent",
                      color: filterSev === f ? LYTE : TEXT_FAINT,
                      fontSize: "0.6875rem", fontWeight: 600, fontFamily: MONO,
                      cursor: "pointer",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </m.div>

            {/* 3-Rail Layout */}
            <m.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              style={{
                display: "grid",
                gridTemplateColumns: "280px 1fr 300px",
                gap: "1px",
                background: BORDER,
                borderRadius: "12px",
                overflow: "hidden",
                border: `1px solid ${BORDER}`,
                minHeight: "600px",
              }}
            >

              {/* LEFT RAIL: Signal Stream */}
              <div style={{ background: BG, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "0.875rem", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                    <Radio size={12} style={{ color: LYTE }} />
                    <span style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT }}>
                      Signal Stream
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const i = TOAST_THRESHOLDS.indexOf(toastThreshold);
                        setToastThreshold(TOAST_THRESHOLDS[(i + 1) % TOAST_THRESHOLDS.length]!);
                      }}
                      data-testid="button-toast-threshold"
                      title={
                        toastThreshold === "off"
                          ? "Toasts muted — click to enable critical alerts"
                          : `Toast alerts: ${THRESHOLD_LABEL[toastThreshold]} — click to change`
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.2rem 0.45rem",
                        borderRadius: 4,
                        border: `1px solid ${toastThreshold === "off" ? BORDER : `${LYTE}30`}`,
                        background: toastThreshold === "off" ? "transparent" : `${LYTE}10`,
                        color: toastThreshold === "off" ? TEXT_FAINT : LYTE,
                        fontSize: "0.575rem",
                        fontFamily: MONO,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      {toastThreshold === "off" ? <BellOff size={10} /> : <Bell size={10} />}
                      <span>{THRESHOLD_LABEL[toastThreshold]}</span>
                    </button>
                    <LivePulse healthy={isStreamHealthy} flash={pulseFlash} />
                  </div>
                </div>

                <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <AnimatePresence>
                    {newSignalCount > 0 && (
                      <m.button
                        key="new-signals-pill"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => {
                          streamScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                          setNewSignalCount(0);
                        }}
                        data-testid="button-new-signals-pill"
                        style={{
                          position: "absolute",
                          top: "0.5rem",
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.35rem 0.75rem",
                          borderRadius: 999,
                          background: LYTE,
                          color: "hsl(214,18%,4%)",
                          border: "none",
                          fontSize: "0.6875rem",
                          fontFamily: MONO,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          boxShadow: `0 6px 18px ${LYTE}40, 0 0 0 1px ${LYTE}60`,
                        }}
                      >
                        <ArrowRight size={11} style={{ transform: "rotate(-90deg)" }} />
                        {newSignalCount} new {newSignalCount === 1 ? "signal" : "signals"}
                      </m.button>
                    )}
                  </AnimatePresence>
                  <div
                    ref={streamScrollRef}
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const scrolled = el.scrollTop > 24;
                      isScrolledRef.current = scrolled;
                      if (!scrolled && newSignalCount > 0) setNewSignalCount(0);
                    }}
                    style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem", overflowY: "auto", flex: 1 }}
                  >
                    {filteredSignals.map(s => (
                      <SignalRow
                        key={s.id}
                        sig={s}
                        active={activeSignal === s.id}
                        onClick={() => {
                          setActiveSignal(s.id);
                          if (s.correlatedTo) setActiveSit(s.correlatedTo);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ padding: "0.75rem", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT }}>{filteredSignals.length} signals</span>
                  <span style={{ fontSize: "0.6rem", fontFamily: MONO, color: "hsl(0,72%,54%)" }}>{unacknowledgedCount} unacknowledged</span>
                </div>
              </div>

              {/* CENTER STAGE: Active Situation */}
              <div style={{ background: "hsla(214,16%,5%,0.98)", display: "flex", flexDirection: "column" }}>
                {/* Center header */}
                <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Eye size={12} style={{ color: LYTE }} />
                  <span style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT }}>
                    Active Situation
                  </span>
                  <div style={{ flex: 1 }} />
                  <DomainChip domain={sit.domain} />
                  <SevBadge sev={sit.severity} />
                </div>

                {/* Situation header */}
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "1rem" }}>
                    <SeverityDot sev={sit.severity} />
                    <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: TEXT, lineHeight: 1.3, margin: 0, letterSpacing: "-0.015em" }}>
                      {sit.title}
                    </h3>
                  </div>

                  {/* Stage progress */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
                      {STAGE_FLOW.map((s, i) => {
                        const isActive = i === stgIdx;
                        const isPast = i < stgIdx;
                        return (
                          <div key={s.id} style={{
                            display: "flex", alignItems: "center", gap: "0.25rem",
                            padding: "0.3rem 0.625rem",
                            borderRadius: 4,
                            background: isActive ? `${s.color}15` : isPast ? "hsla(0,0%,100%,0.04)" : "transparent",
                            border: `1px solid ${isActive ? `${s.color}30` : isPast ? "hsla(0,0%,100%,0.06)" : "transparent"}`,
                            flexShrink: 0,
                          }}>
                            {isPast ? (
                              <CheckCircle2 size={9} style={{ color: s.color }} />
                            ) : isActive ? (
                              <Circle size={9} style={{ color: s.color }} />
                            ) : (
                              <Circle size={9} style={{ color: "hsla(0,0%,100%,0.15)" }} />
                            )}
                            <span style={{
                              fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                              color: isActive ? s.color : isPast ? "hsl(214,7%,45%)" : "hsl(214,7%,25%)",
                            }}>
                              {s.id}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", fontSize: "0.75rem" }}>
                    <div>
                      <p style={{ color: TEXT_FAINT, fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Owner</p>
                      <p style={{ color: sit.owner === "Unassigned" ? "hsl(30,90%,52%)" : TEXT_SEC, fontWeight: 600, margin: 0 }}>{sit.owner}</p>
                    </div>
                    <div>
                      <p style={{ color: TEXT_FAINT, fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Pending</p>
                      <p style={{ color: TEXT_SEC, fontWeight: 600, margin: 0 }}>{sit.pending}</p>
                    </div>
                    <div>
                      <p style={{ color: TEXT_FAINT, fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Updated</p>
                      <p style={{ color: TEXT_SEC, fontWeight: 600, margin: 0 }}>{sit.updated}</p>
                    </div>
                  </div>
                </div>

                {/* Signal detail */}
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                    Triggering Signal
                  </p>
                  {sig && (
                    <div style={{ padding: "0.875rem", borderRadius: "6px", background: SEV_BG[sig.severity], border: `1px solid ${SEV_COLOR[sig.severity]}20` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <SeverityDot sev={sig.severity} />
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: TEXT }}>{sig.title}</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: TEXT_SEC, margin: 0 }}>{sig.detail}</p>
                    </div>
                  )}
                </div>

                {/* Situation board */}
                <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.875rem" }}>
                    Active Situation Board · All Domains
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {liveSituations.map(s => (
                      <SituationCard
                        key={s.id}
                        sit={s}
                        active={activeSit === s.id}
                        onClick={() => setActiveSit(s.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT RAIL: Context / Proof / Action */}
              <div style={{ background: BG, display: "flex", flexDirection: "column" }}>
                {/* Context header */}
                <div style={{ padding: "0.875rem", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileCheck size={12} style={{ color: LYTE }} />
                  <span style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT }}>
                    Proof & Context
                  </span>
                </div>

                {/* Proof Drawer */}
                <div style={{ padding: "0.875rem", borderBottom: `1px solid ${BORDER}` }}>
                  <ProofDrawer
                    proof={SIT_PROOF_RECORDS[sit.id] ?? SAMPLE_PROOF_RECORD}
                    defaultOpen={true}
                    compact={true}
                  />
                </div>

                {/* Policy evaluation */}
                <div style={{ padding: "0.875rem", borderBottom: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.625rem" }}>
                    Covenant Policy Check
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {[
                      { label: "Role: ops_analyst", allowed: true },
                      { label: `Domain: ${sit.domain}`, allowed: true },
                      { label: "Action: approve_execution", allowed: sit.owner !== "Unassigned" },
                      { label: "Human-in-loop: required", allowed: true },
                    ].map((check, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {check.allowed
                          ? <CheckCircle2 size={11} style={{ color: "hsl(142,60%,48%)", flexShrink: 0 }} />
                          : <AlertTriangle size={11} style={{ color: "hsl(30,90%,52%)", flexShrink: 0 }} />
                        }
                        <span style={{ fontSize: "0.6875rem", color: check.allowed ? TEXT_SEC : "hsl(30,90%,52%)" }}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Governance stats */}
                <div style={{ padding: "0.875rem", borderBottom: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                    Governance Posture
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    {liveGovStats.map(stat => (
                      <div key={stat.label} style={{ padding: "0.625rem", borderRadius: 6, background: SURFACE, border: `1px solid ${BORDER}` }}>
                        <p style={{ fontSize: "1.0625rem", fontWeight: 700, color: stat.color, margin: "0 0 0.1rem", fontFamily: MONO }}>{stat.value}</p>
                        <p style={{ fontSize: "0.6rem", color: TEXT_FAINT, margin: "0 0 0.15rem", lineHeight: 1.3 }}>{stat.label}</p>
                        <p style={{ fontSize: "0.575rem", fontFamily: MONO, color: "hsl(214,7%,35%)", margin: 0 }}>{stat.delta}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action panel */}
                <div style={{ padding: "0.875rem", flex: 1 }}>
                  <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                    Governed Actions
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <button style={{
                      width: "100%", padding: "0.625rem 0.875rem",
                      background: `${LYTE}15`, border: `1px solid ${LYTE}30`,
                      borderRadius: 6, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}>
                      <Play size={11} style={{ color: LYTE }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: LYTE }}>Route to Counsel workflow</span>
                    </button>
                    <button style={{
                      width: "100%", padding: "0.625rem 0.875rem",
                      background: "transparent", border: `1px solid ${BORDER}`,
                      borderRadius: 6, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}>
                      <Users size={11} style={{ color: TEXT_SEC }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: TEXT_SEC }}>Assign owner</span>
                    </button>
                    <button style={{
                      width: "100%", padding: "0.625rem 0.875rem",
                      background: "transparent", border: `1px solid ${BORDER}`,
                      borderRadius: 6, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}>
                      <ArrowUpRight size={11} style={{ color: TEXT_SEC }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: TEXT_SEC }}>Escalate</span>
                    </button>
                    <button style={{
                      width: "100%", padding: "0.625rem 0.875rem",
                      background: "transparent", border: `1px solid ${BORDER}`,
                      borderRadius: 6, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}>
                      <BarChart3 size={11} style={{ color: TEXT_SEC }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: TEXT_SEC }}>Run simulation</span>
                    </button>
                  </div>
                  <div style={{ marginTop: "1rem", padding: "0.625rem", borderRadius: 6, background: "hsla(142,60%,48%,0.06)", border: "1px solid hsla(142,60%,48%,0.15)" }}>
                    <p style={{ fontSize: "0.6875rem", color: "hsl(142,60%,58%)", fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                      Every action routes through Counsel with approval gating and immutable Proof Chain recording.
                    </p>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── What Makes It Different ──────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ marginBottom: "3rem" }}>
              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "0.75rem" }}>
                Architecture
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: TEXT, maxWidth: "32ch", marginBottom: "1rem" }}>
                Built on intelligence-grade architectural patterns.
              </h2>
              <p style={{ fontSize: "1rem", lineHeight: 1.72, color: TEXT_SEC, maxWidth: "52ch" }}>
                Lyte absorbs the best patterns from GCHQ's operational nerve centers, entity-layer architectures, Anduril's sense-decide-act architecture, and PLA JOCC's unified command hierarchy — and applies them to governed enterprise operations.
              </p>
            </m.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {[
                { icon: Radio, color: "hsl(192,72%,48%)", title: "Persistent Signal Stream", body: "Live ingestion from all domain packs — Aegis, Vessels, Terra, Counsel, Carlota Jo, IMPERIUM. Severity-ranked, correlation-tagged, continuously updated. No manual aggregation." },
                { icon: Target, color: "hsl(260,60%,65%)", title: "Active Situation Board", body: "Cross-domain decision objects tracked from signal intake to outcome measurement. Every situation shows stage, owner, pending gate, and progress against the governed decision loop." },
                { icon: Brain, color: "hsl(340,52%,60%)", title: "Decision Theater", body: "The flagship governed decision flow: signal → AI recommendation with proof → Monte Carlo simulation → policy check → governed execution → immutable proof chain → outcome measurement." },
                { icon: Lock, color: "hsl(142,60%,48%)", title: "Covenant Policy Enforcement", body: "Every action checked against policy at the platform layer, not the UI layer. Role-based gates, domain scope enforcement, high-risk action guards. Human-in-the-loop is an architectural primitive." },
                { icon: FileCheck, color: "hsl(14,72%,52%)", title: "Proof & Provenance Drawer", body: "Every recommendation, approval, and execution gets a Proof Drawer — source lineage, model attribution, confidence, policy state, export safety, and full audit trail. Visible and expandable everywhere." },
                { icon: BarChart3, color: "hsl(48,90%,52%)", title: "Governance Posture Dashboard", body: "CISO-grade view: policy coverage, approval throughput, override rates, trust health per domain pack. Continuously updated. Not assembled on demand." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    style={{
                      padding: "1.5rem",
                      borderRadius: "10px",
                      background: SURFACE,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${item.color}18`, border: `1px solid ${item.color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                      <Icon size={17} style={{ color: item.color }} />
                    </div>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.014em", color: TEXT, marginBottom: "0.625rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: TEXT_SEC, margin: 0 }}>{item.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Decision Theater CTA ────────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "3rem",
                alignItems: "center",
                padding: "2.5rem 3rem",
                borderRadius: "12px",
                background: `linear-gradient(135deg, hsla(192,72%,48%,0.06) 0%, hsla(215,72%,58%,0.04) 100%)`,
                border: `1px solid ${LYTE}20`,
              }}
            >
              <div>
                <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "0.625rem" }}>
                  Decision Theater — Flagship View
                </p>
                <h3 style={{ fontSize: "clamp(1.5rem,2.8vw,2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: TEXT, marginBottom: "0.875rem" }}>
                  Watch a governed decision play out end-to-end.
                </h3>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: TEXT_SEC, maxWidth: "52ch", marginBottom: 0 }}>
                  Signal intake. AI recommendation with full provenance. Monte Carlo risk simulation. Covenant Policy check with explanation. Counsel workflow execution. Proof Chain record. Outcome measurement. One continuous, auditable flow.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", flexShrink: 0 }}>
                <Link href="/lyte/decision-theater" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: LYTE,
                  color: "hsl(214,18%,4%)",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 600,
                  textDecoration: "none", whiteSpace: "nowrap",
                }}>
                  Open Decision Theater <ArrowRight size={14} />
                </Link>
                <Link href="/lyte/signal-fusion" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: "transparent",
                  color: TEXT_SEC,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  textDecoration: "none", whiteSpace: "nowrap",
                }}>
                  Signal Fusion Panel <ArrowUpRight size={13} />
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── Platform Hierarchy ──────────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ marginBottom: "3rem" }}>
              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                Platform Hierarchy
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.125rem)", fontWeight: 700, letterSpacing: "-0.022em", color: TEXT, maxWidth: "36ch" }}>
                Lyte is one layer of a complete governed decision system.
              </h2>
            </m.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden", border: `1px solid ${BORDER}` }}>
              {[
                {
                  layer: "01",
                  title: "Platform Command",
                  color: LYTE,
                  items: ["Lyte — Operational nerve center", "APEX — Mobile command", "Command Portal — Ecosystem hub"],
                  note: "Operator-facing command surfaces",
                },
                {
                  layer: "02",
                  title: "Execution Fabric + Primitives",
                  color: "hsl(215,72%,58%)",
                  items: ["Counsel — Workflow orchestration", "Outcome Graph — Decision memory", "Proof Chain — Immutable audit trail", "Covenant Policy — Governance engine", "Simulation Engine — Risk modeling", "Event Fabric — Signal backbone"],
                  note: "Shared governance infrastructure",
                },
                {
                  layer: "03",
                  title: "Domain Packs",
                  color: "hsl(260,60%,65%)",
                  items: ["Aegis — Security & defense", "Vessels — Maritime intelligence", "Terra — Real estate intelligence", "Counsel — Legal operations", "Carlota Jo — Private advisory", "IMPERIUM — Cloud sovereignty"],
                  note: "Vertical intelligence extensions",
                },
              ].map((layer, i) => (
                <m.div
                  key={layer.layer}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  style={{ background: BG, padding: "2rem 1.75rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.125rem" }}>
                    <span style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, color: layer.color, letterSpacing: "0.12em" }}>
                      LAYER {layer.layer}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.012em", color: TEXT, marginBottom: "1rem" }}>{layer.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    {layer.items.map((item, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: layer.color, flexShrink: 0, opacity: 0.7 }} />
                        <span style={{ fontSize: "0.8125rem", color: TEXT_SEC }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.6875rem", fontFamily: MONO, color: TEXT_FAINT, margin: 0 }}>{layer.note}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Related Views ───────────────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(3rem,6vw,4rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1.5rem" }}>
              Explore Lyte's intelligence surfaces
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {[
                { href: "/lyte/decision-theater", label: "Decision Theater", note: "Flagship governed decision flow", color: LYTE, icon: Play },
                { href: "/lyte/signal-fusion", label: "Signal Fusion Panel", note: "Cross-domain signal aggregation", color: "hsl(206,72%,54%)", icon: Radio },
                { href: "/lyte/decision-schemas", label: "Decision Schema Library", note: "Reusable decision templates", color: "hsl(260,60%,65%)", icon: BookOpen },
                { href: "/lyte/governance-posture", label: "Governance Posture", note: "CISO-grade policy dashboard", color: "hsl(142,60%,48%)", icon: ShieldCheck },
              ].map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                      padding: "1.125rem 1.25rem",
                      borderRadius: "8px",
                      background: SURFACE,
                      border: `1px solid ${BORDER}`,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SURFACE_HOVER; (e.currentTarget as HTMLElement).style.borderColor = `${link.color}25`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = SURFACE; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: `${link.color}15`, border: `1px solid ${link.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} style={{ color: link.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: TEXT, margin: "0 0 0.2rem" }}>{link.label}</p>
                      <p style={{ fontSize: "0.75rem", color: TEXT_FAINT, margin: 0 }}>{link.note}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section style={{ padding: "clamp(5rem,10vw,7rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)", textAlign: "center" }}>
            <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "1rem" }}>
                Design partner stage · 2026
              </p>
              <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.028em", color: TEXT, marginBottom: "1.25rem", maxWidth: "24ch", margin: "0 auto 1.25rem" }}>
                Ready to see the full operational picture?
              </h2>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: TEXT_SEC, maxWidth: "44ch", margin: "0 auto 2.5rem" }}>
                We instrument Lyte above your most critical domain packs first. Most design partners see meaningful signal coverage within two to three weeks.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/demo" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.875rem 1.75rem",
                  background: LYTE,
                  color: "hsl(214,18%,4%)",
                  borderRadius: "0.375rem",
                  fontSize: "0.9375rem", fontWeight: 600,
                  textDecoration: "none",
                }}>
                  Request a demo <ArrowRight size={15} />
                </Link>
                <Link href="/design-partner" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.875rem 1.75rem",
                  background: "transparent",
                  color: TEXT_SEC,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "0.375rem",
                  fontSize: "0.9375rem", fontWeight: 500,
                  textDecoration: "none",
                }}>
                  Design partner program
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
