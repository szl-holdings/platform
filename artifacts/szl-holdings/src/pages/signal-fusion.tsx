import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState, useEffect, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import {
  Radio, Shield, Ship, Building2, Briefcase, Users, Zap, Layers,
  ArrowRight, Filter,
  GitBranch, ChevronRight,CheckCheck, ArrowUpRightFromSquare,
  UserPlus, PlusSquare, 
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ProofDrawer, SAMPLE_PROOF_RECORD, type ProofRecord } from '@/components/ProofDrawer';

const BG = "hsl(214,16%,4%)";
const BORDER = "hsla(0,0%,100%,0.07)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const TEXT = "hsl(38,8%,94%)";
const TEXT_SEC = "hsl(214,7%,60%)";
const TEXT_FAINT = "hsl(214,7%,38%)";
const LYTE = "hsl(192,72%,48%)";
const MONO = "var(--font-mono)";

const DOMAIN_CONFIG: Record<string, { color: string; icon: typeof Shield; shortName: string }> = {
  PARAGON:        { color: "hsl(222,60%,60%)", icon: Shield, shortName: "PARAGON" },
  SEXTANT:      { color: "hsl(206,72%,54%)", icon: Ship, shortName: "SEXTANT" },
  DOMAINE:        { color: "hsl(142,52%,48%)", icon: Building2, shortName: "DOMAINE" },
  "Counsel": { color: "hsl(260,60%,65%)", icon: Briefcase, shortName: "Prism" },
  "Carlota Jo": { color: "hsl(340,52%,60%)", icon: Users, shortName: "CJ" },
  Counsel:        { color: "hsl(192,72%,48%)", icon: Zap, shortName: "Counsel" },
  IMPERIUM:     { color: "hsl(25,72%,54%)", icon: Layers, shortName: "Imp." },
};

const SEV_COLOR: Record<string, string> = {
  critical: "hsl(0,72%,54%)",
  high: "hsl(30,90%,52%)",
  medium: "hsl(48,90%,52%)",
  info: "hsl(192,72%,48%)",
};

const SOURCE_LABELS: Record<string, string> = {
  threat_intelligence: "Threat Intel",
  ais_telemetry: "AIS Feed",
  deadline_monitor: "Deadline Monitor",
  workflow_monitor: "Workflow Bus",
  market_intelligence: "Market Intel",
  cloud_policy: "Cloud Policy",
  engagement_tracker: "CRM",
};

const SOURCE_FRESHNESS: Record<string, { age: string; status: "live" | "fresh" | "stale" }> = {
  sf1: { age: "4m", status: "live" },
  sf2: { age: "11m", status: "live" },
  sf3: { age: "22m", status: "fresh" },
  sf4: { age: "2h", status: "fresh" },
  sf5: { age: "1h", status: "fresh" },
  sf6: { age: "4h", status: "fresh" },
  sf7: { age: "3h", status: "fresh" },
};

const FRESHNESS_COLORS = { live: "hsl(142,60%,50%)", fresh: "hsl(192,72%,48%)", stale: "hsl(48,90%,52%)" };

interface FusionSignal {
  id: string;
  domain: string;
  severity: "critical" | "high" | "medium" | "info";
  title: string;
  sourceType: string;
  confidence: number;
  correlatedWith: string[];
  correlationType?: "temporal" | "causal" | "semantic";
  correlationStrength?: number;
  timestamp: string;
  metadata: Record<string, string>;
}

const FUSION_SIGNALS_FALLBACK: FusionSignal[] = [
  {
    id: "sf1",
    domain: "PARAGON",
    severity: "critical",
    title: "KEV CVE-2025-1337 active exploitation — 3 internal hosts confirmed",
    sourceType: "threat_intelligence",
    confidence: 0.94,
    correlatedWith: ["sf4", "sf6"],
    correlationType: "causal",
    correlationStrength: 0.87,
    timestamp: "T-04m",
    metadata: { "Attack vector": "RCE via log4j derivative", "Affected systems": "3 (auth-svc, api-gw, reporting)", "SLA": "T-2h" },
  },
  {
    id: "sf2",
    domain: "SEXTANT",
    severity: "high",
    title: "MV Adriatic Star — AIS dark gap 6h20m, last fix Strait of Messina",
    sourceType: "ais_telemetry",
    confidence: 0.91,
    correlatedWith: ["sf5"],
    correlationType: "temporal",
    correlationStrength: 0.72,
    timestamp: "T-11m",
    metadata: { "Gap duration": "6h20m", "Last AIS fix": "37.42N, 15.61E", "OFAC status": "Pending" },
  },
  {
    id: "sf3",
    domain: "Counsel",
    severity: "high",
    title: "Motion HC-2025-0487 — deadline T-38h, no filing draft, no owner",
    sourceType: "deadline_monitor",
    confidence: 0.98,
    correlatedWith: [],
    timestamp: "T-22m",
    metadata: { "Matter ID": "HC-2025-0487", "Deadline": "38h remaining", "Owner": "Unassigned" },
  },
  {
    id: "sf4",
    domain: "Counsel",
    severity: "high",
    title: "Approval queue depth 14 workflows — 6 exceed 72h threshold",
    sourceType: "workflow_monitor",
    confidence: 0.99,
    correlatedWith: ["sf1"],
    correlationType: "causal",
    correlationStrength: 0.63,
    timestamp: "T-02h",
    metadata: { "Queue depth": "14 pending", "Over SLA": "6 workflows", "Oldest": "89h 14m" },
  },
  {
    id: "sf5",
    domain: "DOMAINE",
    severity: "medium",
    title: "NYC portfolio distress threshold — 12 properties, $340M exposure",
    sourceType: "market_intelligence",
    confidence: 0.83,
    correlatedWith: ["sf2"],
    correlationType: "semantic",
    correlationStrength: 0.54,
    timestamp: "T-01h",
    metadata: { "Properties in scope": "12", "Estimated exposure": "$340M", "Diligence": "34% complete" },
  },
  {
    id: "sf6",
    domain: "IMPERIUM",
    severity: "medium",
    title: "Configuration drift detected — AWS us-east-1 unrestricted egress rule",
    sourceType: "cloud_policy",
    confidence: 0.96,
    correlatedWith: ["sf1"],
    correlationType: "causal",
    correlationStrength: 0.51,
    timestamp: "T-04h",
    metadata: { "Asset": "sg-0xf823b1a", "Policy": "unrestricted egress", "Region": "us-east-1" },
  },
  {
    id: "sf7",
    domain: "Carlota Jo",
    severity: "info",
    title: "Engagement milestone 3 — delivery confirmed, awaiting client sign-off",
    sourceType: "engagement_tracker",
    confidence: 0.88,
    correlatedWith: [],
    timestamp: "T-03h",
    metadata: { "Client": "Archipelago Capital", "Milestone": "3 of 6", "Response SLA": "48h" },
  },
];

interface CorrelationPair { from: string; to: string; type: "causal" | "temporal" | "semantic"; strength: number; label: string; }
const CORRELATION_PAIRS_FALLBACK: CorrelationPair[] = [
  { from: "sf1", to: "sf4", type: "causal", strength: 0.87, label: "Exploit → Approval stall" },
  { from: "sf1", to: "sf6", type: "causal", strength: 0.51, label: "KEV → Cloud drift vector" },
  { from: "sf2", to: "sf5", type: "temporal", strength: 0.54, label: "Dark vessel ↔ Portfolio exposure" },
];

function computeDomainStats(signals: FusionSignal[]) {
  return Object.entries(DOMAIN_CONFIG).map(([domain, cfg]) => {
    const inDomain = signals.filter(s => s.domain === domain);
    return {
      domain,
      color: cfg.color,
      icon: cfg.icon,
      signalCount: inDomain.length,
      criticalCount: inDomain.filter(s => s.severity === "critical").length,
      avgConfidence: inDomain.reduce((a, s) => a + s.confidence, 0) / Math.max(1, inDomain.length),
    };
  }).filter(d => d.signalCount > 0);
}

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: "hsla(0,0%,100%,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 100}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 600, color, minWidth: "2.5rem", textAlign: "right" }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function SevBadge({ sev }: { sev: string }) {
  const c = SEV_COLOR[sev] ?? LYTE;
  return (
    <span style={{
      fontSize: "0.575rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: MONO,
      padding: "2px 5px", borderRadius: 3,
      background: `${c}18`, border: `1px solid ${c}30`, color: c,
    }}>
      {sev}
    </span>
  );
}

function CorrelationTypeBadge({ type }: { type?: string }) {
  const colors: Record<string, string> = { causal: "hsl(0,72%,54%)", temporal: "hsl(48,90%,52%)", semantic: "hsl(260,60%,65%)" };
  const c = colors[type ?? ""] ?? TEXT_FAINT;
  if (!type) return null;
  return (
    <span style={{
      fontSize: "0.575rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: MONO,
      padding: "2px 5px", borderRadius: 3,
      background: `${c}15`, border: `1px solid ${c}28`, color: c,
    }}>
      {type}
    </span>
  );
}

function FreshnessBadge({ id }: { id: string }) {
  const f = SOURCE_FRESHNESS[id];
  if (!f) return null;
  const color = FRESHNESS_COLORS[f.status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "0.575rem", fontFamily: MONO, fontWeight: 600, letterSpacing: "0.08em", padding: "1px 5px", borderRadius: 3, background: `${color}15`, border: `1px solid ${color}28`, color }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, display: "inline-block" }} />
      {f.age}
    </span>
  );
}

function SourceBadge({ sourceType }: { sourceType: string }) {
  const label = SOURCE_LABELS[sourceType] ?? sourceType.replace(/_/g, " ");
  return (
    <span style={{ fontSize: "0.575rem", fontFamily: MONO, color: TEXT_FAINT, background: "hsla(0,0%,100%,0.05)", border: `1px solid ${BORDER}`, padding: "1px 5px", borderRadius: 3 }}>
      {label}
    </span>
  );
}

function SignalCard({ sig, active, onClick, highlight, acknowledged }: { sig: FusionSignal; active: boolean; onClick: () => void; highlight?: boolean; acknowledged?: boolean }) {
  const cfg = DOMAIN_CONFIG[sig.domain];
  const Icon = cfg?.icon ?? Radio;
  const dc = cfg?.color ?? LYTE;
  const sc = SEV_COLOR[sig.severity];

  return (
    <m.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: acknowledged ? 0.45 : 1, y: 0 }}
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "1rem 1.125rem",
        borderRadius: "8px",
        background: active ? `${LYTE}08` : highlight ? `${sc}06` : SURFACE,
        border: `1px solid ${active ? `${LYTE}30` : highlight ? `${sc}25` : BORDER}`,
        cursor: "pointer",
        transition: "all 0.15s ease",
        opacity: acknowledged ? 0.5 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.5rem" }}>
        <div style={{ width: 26, height: 26, borderRadius: 5, background: `${dc}18`, border: `1px solid ${dc}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
          <Icon size={12} style={{ color: dc }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.3rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: MONO, color: dc }}>{sig.domain}</span>
            <SevBadge sev={sig.severity} />
            <SourceBadge sourceType={sig.sourceType} />
            <FreshnessBadge id={sig.id} />
            {sig.correlatedWith.length > 0 && (
              <span style={{ fontSize: "0.575rem", fontFamily: MONO, color: TEXT_FAINT, background: "hsla(0,0%,100%,0.06)", border: `1px solid ${BORDER}`, padding: "1px 4px", borderRadius: 3 }}>
                {sig.correlatedWith.length} corr.
              </span>
            )}
            <CorrelationTypeBadge type={sig.correlationType} />
            {acknowledged && (
              <span style={{ fontSize: "0.575rem", fontFamily: MONO, color: "hsl(142,60%,50%)", display: "flex", alignItems: "center", gap: "2px" }}>
                <CheckCheck size={9} /> ack
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: TEXT, lineHeight: 1.3, margin: "0 0 0.375rem" }}>{sig.title}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <ConfidenceBar value={sig.confidence} color={sc} />
            <span style={{ fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT, flexShrink: 0, marginLeft: "0.75rem" }}>{sig.timestamp}</span>
          </div>
        </div>
      </div>
    </m.button>
  );
}

const SIG_PROOF_RECORDS: Record<string, ProofRecord> = {
  sf1: {
    ...SAMPLE_PROOF_RECORD,
    id: "PCH-SF1-20260416",
    sourceSystem: "PARAGON SOC Feed",
    sourceDomain: "PARAGON",
    signalType: "threat_intelligence",
    confidence: 0.94,
    reviewState: "unreviewed",
    exportSafety: "pending_review",
    policyChecks: [
      { label: "Role: ops_analyst — permitted", passed: true },
      { label: "Domain: PARAGON — in scope", passed: true },
      { label: "Action: recommend_isolation — permitted", passed: true },
      { label: "Human-in-loop gate: required before execution", passed: true },
      { label: "Review state: must be human_reviewed before export", passed: false, note: "Export blocked until review complete" },
    ],
    chainLinks: [
      { id: "c1", event: "Signal ingested — KEV CVE-2025-1337 active exploitation", actor: "System / PRAXIS Bus", timestamp: "16 Apr 2026 08:14:22", hash: "sha256:a3f7b2c1d..." },
      { id: "c2", event: "Correlated with IMPERIUM drift event (sf6) and SEXTANT anomaly (sf4)", actor: "System / Signal Fusion", timestamp: "16 Apr 2026 08:14:24", hash: "sha256:9e1d4f2a8..." },
      { id: "c3", event: "AI recommendation generated — isolate affected hosts", actor: "Model: gpt-4o-mini", timestamp: "16 Apr 2026 08:14:27", hash: "sha256:b4e8f3c6d..." },
    ],
    metadata: { "Signal ID": "SIG-20260416-001", "MITRE Technique": "T1071.001", "Correlation ID": "CORR-SF1-SF6", "SLA": "T-2h" },
  },
  sf2: {
    ...SAMPLE_PROOF_RECORD,
    id: "PCH-SF2-20260416",
    sourceSystem: "SEXTANT AIS Feed",
    sourceDomain: "SEXTANT",
    signalType: "ais_telemetry",
    confidence: 0.91,
    reviewState: "human_reviewed",
    exportSafety: "pending_review",
    policyChecks: [
      { label: "Role: ops_analyst — permitted", passed: true },
      { label: "Domain: SEXTANT — in scope", passed: true },
      { label: "Action: initiate_ofac_screen — permitted", passed: true },
      { label: "Human-in-loop gate: K. Vasile assigned", passed: true },
      { label: "OFAC screening required before execution", passed: false, note: "Screening in progress" },
    ],
    chainLinks: [
      { id: "c1", event: "AIS dark gap detected — MV Adriatic Star (6h20m)", actor: "System / SEXTANT Feed", timestamp: "16 Apr 2026 07:07:44", hash: "sha256:d1e3f5b7a..." },
      { id: "c2", event: "Temporal correlation with Counsel filing event (sf5)", actor: "System / Signal Fusion", timestamp: "16 Apr 2026 08:03:11", hash: "sha256:f2a8c4e6b..." },
    ],
    metadata: { "Signal ID": "SIG-20260416-002", "Last AIS fix": "37.42N, 15.61E", "Gap duration": "6h20m", "OFAC status": "Pending" },
  },
};

export default function SignalFusionPage() {
  const __pageMeta = usePageMeta({
    title: "Signal Fusion Panel — KORA | SZL Holdings",
    description: "Cross-domain signal aggregation showing where signals originate, how they correlate, and confidence levels. Inspired by Five Eyes STONE GHOST and NSA signal fusion architectures.",
    canonical: "https://szlholdings.com/lyte/signal-fusion",
  });

  const [activeSignal, setActiveSignal] = useState<string>("sf1");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterSev, setFilterSev] = useState<string>("all");
  const [_tick, setTick] = useState(0);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [escalated, setEscalated] = useState<Set<string>>(new Set());
  const [showAcked, setShowAcked] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "proof" | "actions">("overview");
  useEffect(() => { setDetailTab("overview"); }, [activeSignal]);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 6000);
    return () => clearInterval(t);
  }, []);

  const fusionQuery = useStandardQuery<{ signals: FusionSignal[]; correlations: CorrelationPair[]; dataAvailable: boolean }>({
    queryKey: ["lyte", "signal-fusion"],
    queryFn: async () => {
      const res = await apiRequest<{ signals: FusionSignal[]; correlations: CorrelationPair[]; dataAvailable: boolean }>("GET", "/api/lyte/signal-fusion");
      return res;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const FUSION_SIGNALS: FusionSignal[] = fusionQuery.data?.signals ?? FUSION_SIGNALS_FALLBACK;
  const CORRELATION_PAIRS: CorrelationPair[] = fusionQuery.data?.correlations ?? CORRELATION_PAIRS_FALLBACK;
  const DOMAIN_STATS = useMemo(() => computeDomainStats(FUSION_SIGNALS), [FUSION_SIGNALS]);

  const sig = FUSION_SIGNALS.find(s => s.id === activeSignal) ?? FUSION_SIGNALS[0]!;
  const cfg = DOMAIN_CONFIG[sig.domain];
  const Icon = cfg?.icon ?? Radio;
  const dc = cfg?.color ?? LYTE;

  const filteredSignals = FUSION_SIGNALS.filter(s =>
    (filterDomain === "all" || s.domain === filterDomain) &&
    (filterSev === "all" || s.severity === filterSev)
  );

  const correlatedSignals = FUSION_SIGNALS.filter(s => sig.correlatedWith.includes(s.id));
  const correlatingTo = FUSION_SIGNALS.filter(s => s.correlatedWith.includes(sig.id) && !sig.correlatedWith.includes(s.id));
  const allCorrelated = [...correlatedSignals, ...correlatingTo];

  const criticalCount = FUSION_SIGNALS.filter(s => s.severity === "critical").length;
  const highCount = FUSION_SIGNALS.filter(s => s.severity === "high").length;
  const correlatedCount = FUSION_SIGNALS.filter(s => s.correlatedWith.length > 0).length;
  const avgConfidence = FUSION_SIGNALS.length > 0 ? FUSION_SIGNALS.reduce((a, s) => a + s.confidence, 0) / FUSION_SIGNALS.length : 0;

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: BG, color: TEXT }}>
        <SiteNav />
        <main id="main-content">
  
          {/* Header */}
          <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(5.5rem,10vw,7rem) 0 2rem" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                  <Link href="/lyte" style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, textDecoration: "none" }}>
                    KORA
                  </Link>
                  <ChevronRight size={10} style={{ color: TEXT_FAINT }} />
                  <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE }}>
                    Signal Fusion Panel
                  </span>
                </div>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 700, letterSpacing: "-0.028em", lineHeight: 1.08, maxWidth: "26ch", marginBottom: "1rem", color: TEXT }}>
                  Every signal. Every domain. One fusion layer.
                </h1>
                <p style={{ fontSize: "0.6875rem", fontFamily: MONO, letterSpacing: "0.04em", color: LYTE, marginBottom: "0.875rem" }}>
                  PARAGON · SEXTANT · DOMAINE · Counsel · Carlota Jo · Counsel · IMPERIUM
                </p>
                <p style={{ fontSize: "clamp(0.9375rem,1.6vw,1.0625rem)", lineHeight: 1.72, color: TEXT_SEC, maxWidth: "54ch", marginBottom: "2rem" }}>
                  Cross-domain signal aggregation showing where signals originate, how they correlate across domains, and what confidence the system places in each one. Inspired by Five Eyes STONE GHOST and NSA's multi-source correlation architecture.
                </p>
              </m.div>
  
              {/* Stats bar */}
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{ display: "flex", gap: "1px", background: BORDER, borderRadius: "8px", overflow: "hidden", border: `1px solid ${BORDER}` }}
              >
                {[
                  { label: "Total signals", value: FUSION_SIGNALS.length.toString(), color: TEXT },
                  { label: "Critical", value: criticalCount.toString(), color: "hsl(0,72%,54%)" },
                  { label: "High", value: highCount.toString(), color: "hsl(30,90%,52%)" },
                  { label: "Correlated", value: `${correlatedCount}/${FUSION_SIGNALS.length}`, color: LYTE },
                  { label: "Avg confidence", value: `${(avgConfidence * 100).toFixed(0)}%`, color: "hsl(142,60%,48%)" },
                  { label: "Active domains", value: DOMAIN_STATS.length.toString(), color: "hsl(260,60%,65%)" },
                ].map((stat, i) => (
                  <div key={i} style={{ flex: 1, background: BG, padding: "0.875rem 1rem", textAlign: "center" }}>
                    <p style={{ fontSize: "1.125rem", fontWeight: 700, fontFamily: MONO, color: stat.color, margin: 0 }}>{stat.value}</p>
                    <p style={{ fontSize: "0.625rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, margin: 0 }}>{stat.label}</p>
                  </div>
                ))}
              </m.div>
            </div>
          </section>
  
          {/* Main: Signal Feed + Detail */}
          <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "2rem 0" }}>
            <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
  
              {/* Filters */}
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                  <Filter size={11} style={{ color: TEXT_FAINT }} />
                  <span style={{ fontSize: "0.6875rem", color: TEXT_FAINT }}>Domain:</span>
                  {["all", ...Object.keys(DOMAIN_CONFIG)].map(d => (
                    <button
                      key={d}
                      onClick={() => setFilterDomain(d)}
                      style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: 4, fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 600,
                        textTransform: d === "all" ? "none" : "none",
                        border: `1px solid ${filterDomain === d ? `${LYTE}40` : BORDER}`,
                        background: filterDomain === d ? `${LYTE}12` : "transparent",
                        color: filterDomain === d ? LYTE : TEXT_FAINT,
                        cursor: "pointer",
                      }}
                    >
                      {d === "all" ? "All" : (DOMAIN_CONFIG[d]?.shortName ?? d)}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", marginLeft: "0.5rem" }}>
                  <span style={{ fontSize: "0.6875rem", color: TEXT_FAINT }}>Severity:</span>
                  {["all", "critical", "high", "medium", "info"].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterSev(s)}
                      style={{
                        padding: "0.25rem 0.625rem", borderRadius: 4, fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 600,
                        border: `1px solid ${filterSev === s ? `${SEV_COLOR[s] ?? LYTE}40` : BORDER}`,
                        background: filterSev === s ? `${SEV_COLOR[s] ?? LYTE}12` : "transparent",
                        color: filterSev === s ? (SEV_COLOR[s] ?? LYTE) : TEXT_FAINT,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
  
              <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "1.25rem" }}>
  
                {/* Signal list */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <button
                      onClick={() => setShowAcked(s => !s)}
                      style={{ fontSize: "0.6875rem", fontFamily: MONO, color: TEXT_FAINT, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
                    >
                      <CheckCheck size={11} />
                      {showAcked ? "Hide" : "Show"} acknowledged ({acknowledged.size})
                    </button>
                    {escalated.size > 0 && (
                      <span style={{ fontSize: "0.6875rem", fontFamily: MONO, color: "hsl(30,90%,52%)" }}>
                        {escalated.size} escalated
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {filteredSignals
                      .filter(s => showAcked || !acknowledged.has(s.id))
                      .map(s => (
                        <SignalCard
                          key={s.id}
                          sig={s}
                          active={activeSignal === s.id}
                          highlight={sig.correlatedWith.includes(s.id) || s.correlatedWith.includes(sig.id)}
                          onClick={() => setActiveSignal(s.id)}
                          acknowledged={acknowledged.has(s.id)}
                        />
                      ))}
                  </div>
                </div>
  
                {/* Detail panel */}
                <AnimatePresence mode="wait">
                  <m.div
                    key={sig.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: "flex", flexDirection: "column", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden", border: `1px solid ${BORDER}`, alignSelf: "start", position: "sticky", top: "5rem" }}
                  >
                    {/* Signal identity */}
                    <div style={{ background: BG, padding: "1.125rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${dc}18`, border: `1px solid ${dc}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={13} style={{ color: dc }} />
                        </div>
                        <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: dc }}>{sig.domain}</span>
                        <SevBadge sev={sig.severity} />
                        {sig.correlationType && <CorrelationTypeBadge type={sig.correlationType} />}
                      </div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: TEXT, lineHeight: 1.35, margin: "0 0 0.75rem" }}>{sig.title}</p>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <p style={{ fontSize: "0.6rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, marginBottom: "0.25rem" }}>Confidence</p>
                        <ConfidenceBar value={sig.confidence} color={SEV_COLOR[sig.severity]} />
                      </div>
                      <p style={{ fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT, margin: 0 }}>Signal ID: {sig.id.toUpperCase()} · {sig.sourceType.replace(/_/g, " ")} · {sig.timestamp}</p>
                    </div>
  
                    {/* Tabs */}
                    <div style={{ background: BG, padding: "0.5rem 1.125rem 0", display: "flex", gap: "0.25rem", borderBottom: `1px solid ${BORDER}` }}>
                      {(["overview", "proof", "actions"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setDetailTab(tab)}
                          data-testid={`tab-detail-${tab}`}
                          style={{
                            padding: "0.5rem 0.75rem",
                            background: "transparent",
                            border: "none",
                            borderBottom: `2px solid ${detailTab === tab ? LYTE : "transparent"}`,
                            cursor: "pointer",
                            fontSize: "0.6875rem",
                            fontFamily: MONO,
                            fontWeight: detailTab === tab ? 700 : 500,
                            color: detailTab === tab ? LYTE : TEXT_FAINT,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
  
                    {/* Overview tab */}
                    {detailTab === "overview" && (
                      <>
                        <div style={{ background: BG, padding: "1rem 1.125rem" }}>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.625rem" }}>
                            Signal Metadata
                          </p>
                          {Object.entries(sig.metadata).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: `1px solid ${BORDER}` }}>
                              <span style={{ fontSize: "0.6875rem", color: TEXT_FAINT, fontFamily: MONO }}>{k}</span>
                              <span style={{ fontSize: "0.6875rem", color: TEXT_SEC, fontWeight: 600 }}>{v}</span>
                            </div>
                          ))}
                        </div>
  
                        {allCorrelated.length > 0 && (
                          <div style={{ background: BG, padding: "1rem 1.125rem" }}>
                            <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                              Correlated Signals
                            </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {allCorrelated.map(cs => {
                            const ccfg = DOMAIN_CONFIG[cs.domain];
                            const CIcon = ccfg?.icon ?? Radio;
                            const cdc = ccfg?.color ?? LYTE;
                            const pair = CORRELATION_PAIRS.find(p => (p.from === sig.id && p.to === cs.id) || (p.from === cs.id && p.to === sig.id));
                            return (
                              <button
                                key={cs.id}
                                onClick={() => setActiveSignal(cs.id)}
                                style={{
                                  display: "flex", alignItems: "flex-start", gap: "0.5rem",
                                  padding: "0.625rem", borderRadius: 6,
                                  background: SURFACE, border: `1px solid ${BORDER}`,
                                  cursor: "pointer", textAlign: "left",
                                }}
                              >
                                <div style={{ width: 20, height: 20, borderRadius: 4, background: `${cdc}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                                  <CIcon size={10} style={{ color: cdc }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: "0.575rem", fontFamily: MONO, fontWeight: 700, color: cdc, textTransform: "uppercase", letterSpacing: "0.08em" }}>{cs.domain}</span>
                                    {pair && <CorrelationTypeBadge type={pair.type} />}
                                  </div>
                                  <p style={{ fontSize: "0.725rem", color: TEXT_SEC, lineHeight: 1.3, margin: "0 0 0.25rem" }}>{cs.title.slice(0, 55)}{cs.title.length > 55 ? "…" : ""}</p>
                                  {pair?.label && <p style={{ fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT, margin: 0 }}>{pair.label} · {(pair.strength * 100).toFixed(0)}% strength</p>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                          </div>
                        )}
                      </>
                    )}
  
                    {/* Proof tab */}
                    {detailTab === "proof" && (
                      <div style={{ background: BG, padding: "1rem 1.125rem" }} data-testid={`proof-tab-content-${sig.id}`}>
                        <ProofDrawer
                          proof={SIG_PROOF_RECORDS[sig.id] ?? SAMPLE_PROOF_RECORD}
                          compact={false}
                          defaultOpen={true}
                        />
                      </div>
                    )}
  
                    {/* Actions tab */}
                    {detailTab === "actions" && (
                    <div style={{ background: BG, padding: "1rem 1.125rem" }}>
                      <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                        Actions
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {/* Acknowledge */}
                        <button
                          onClick={() => {
                            if (acknowledged.has(sig.id)) {
                              setAcknowledged(prev => { const next = new Set(prev); next.delete(sig.id); return next; });
                            } else {
                              setAcknowledged(prev => new Set(prev).add(sig.id));
                            }
                          }}
                          style={{ width: "100%", padding: "0.5rem 0.875rem", borderRadius: 5, background: acknowledged.has(sig.id) ? "hsla(142,60%,50%,0.12)" : "transparent", border: `1px solid ${acknowledged.has(sig.id) ? "hsla(142,60%,50%,0.3)" : BORDER}`, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: acknowledged.has(sig.id) ? "hsl(142,60%,50%)" : TEXT_SEC, textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                          <CheckCheck size={13} />
                          {acknowledged.has(sig.id) ? "Acknowledged — undo" : "Acknowledge signal"}
                        </button>
                        {/* Escalate */}
                        <button
                          onClick={() => {
                            if (escalated.has(sig.id)) {
                              setEscalated(prev => { const next = new Set(prev); next.delete(sig.id); return next; });
                            } else {
                              setEscalated(prev => new Set(prev).add(sig.id));
                            }
                          }}
                          style={{ width: "100%", padding: "0.5rem 0.875rem", borderRadius: 5, background: escalated.has(sig.id) ? "hsla(30,90%,52%,0.12)" : "transparent", border: `1px solid ${escalated.has(sig.id) ? "hsla(30,90%,52%,0.3)" : BORDER}`, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: escalated.has(sig.id) ? "hsl(30,90%,52%)" : TEXT_SEC, textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                          <ArrowUpRightFromSquare size={13} />
                          {escalated.has(sig.id) ? "Escalated — undo" : "Escalate signal"}
                        </button>
                        <button style={{ width: "100%", padding: "0.5rem 0.875rem", borderRadius: 5, background: `${LYTE}12`, border: `1px solid ${LYTE}28`, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: LYTE, textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <ArrowRight size={13} />
                          Route to Decision Theater
                        </button>
                        <button style={{ width: "100%", padding: "0.5rem 0.875rem", borderRadius: 5, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.75rem", color: TEXT_SEC, textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <UserPlus size={13} />
                          Assign to analyst
                        </button>
                        <button style={{ width: "100%", padding: "0.5rem 0.875rem", borderRadius: 5, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.75rem", color: TEXT_SEC, textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <PlusSquare size={13} />
                          Create follow-up task
                        </button>
                      </div>
                    </div>
                    )}
                  </m.div>
                </AnimatePresence>
              </div>
            </div>
          </section>
  
          {/* Domain coverage */}
          <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(3rem,6vw,4rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1.5rem" }}>
                Domain Signal Coverage
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                {DOMAIN_STATS.map((d, i) => {
                  const Icon = d.icon;
                  return (
                    <m.button
                      key={d.domain}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                      onClick={() => setFilterDomain(filterDomain === d.domain ? "all" : d.domain)}
                      style={{
                        padding: "1.125rem",
                        borderRadius: "8px",
                        background: filterDomain === d.domain ? `${d.color}10` : SURFACE,
                        border: `1px solid ${filterDomain === d.domain ? `${d.color}30` : BORDER}`,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: 26, height: 26, borderRadius: 5, background: `${d.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={12} style={{ color: d.color }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: TEXT }}>{d.domain}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                        <span style={{ fontSize: "0.6875rem", color: TEXT_FAINT }}>Signals</span>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 700, fontFamily: MONO, color: d.color }}>{d.signalCount}</span>
                      </div>
                      <div style={{ marginBottom: "0.25rem" }}>
                        <ConfidenceBar value={d.avgConfidence} color={d.color} />
                      </div>
                      {d.criticalCount > 0 && (
                        <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, color: "hsl(0,72%,54%)" }}>
                          {d.criticalCount} critical
                        </span>
                      )}
                    </m.button>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Correlation map */}
          <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(3rem,6vw,4rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.5rem" }}>
                  Active Correlation Pairs
                </p>
                <p style={{ fontSize: "0.875rem", color: TEXT_SEC, margin: 0 }}>
                  Signals correlated across domain boundaries — with correlation type and strength score.
                </p>
              </m.div>
  
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {CORRELATION_PAIRS.map((pair, i) => {
                  const fromSig = FUSION_SIGNALS.find(s => s.id === pair.from);
                  const toSig = FUSION_SIGNALS.find(s => s.id === pair.to);
                  if (!fromSig || !toSig) return null;
                  const fcfg = DOMAIN_CONFIG[fromSig.domain];
                  const tcfg = DOMAIN_CONFIG[toSig.domain];
                  const FIcon = fcfg?.icon ?? Radio;
                  const TIcon = tcfg?.icon ?? Radio;
                  const colors: Record<string, string> = { causal: "hsl(0,72%,54%)", temporal: "hsl(48,90%,52%)", semantic: "hsl(260,60%,65%)" };
                  const pairColor = colors[pair.type] ?? LYTE;
  
                  return (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        gap: "1rem",
                        alignItems: "center",
                        padding: "1rem 1.25rem",
                        borderRadius: "8px",
                        background: SURFACE,
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: `${fcfg?.color ?? LYTE}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FIcon size={11} style={{ color: fcfg?.color ?? LYTE }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: fcfg?.color ?? LYTE, margin: 0 }}>{fromSig.domain}</p>
                          <p style={{ fontSize: "0.75rem", color: TEXT_SEC, margin: 0, lineHeight: 1.3 }}>{fromSig.title.slice(0, 45)}{fromSig.title.length > 45 ? "…" : ""}</p>
                        </div>
                      </div>
  
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                        <span style={{ fontSize: "0.575rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: pairColor, padding: "2px 6px", borderRadius: 3, background: `${pairColor}15`, border: `1px solid ${pairColor}25` }}>
                          {pair.type}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <div style={{ width: 30, height: 1, background: `${pairColor}50` }} />
                          <GitBranch size={9} style={{ color: pairColor }} />
                          <div style={{ width: 30, height: 1, background: `${pairColor}50` }} />
                        </div>
                        <span style={{ fontSize: "0.575rem", fontFamily: MONO, color: TEXT_FAINT }}>{(pair.strength * 100).toFixed(0)}%</span>
                        <span style={{ fontSize: "0.575rem", fontFamily: MONO, color: TEXT_FAINT }}>{pair.label}</span>
                      </div>
  
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", justifyContent: "flex-end" }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: tcfg?.color ?? LYTE, margin: 0 }}>{toSig.domain}</p>
                          <p style={{ fontSize: "0.75rem", color: TEXT_SEC, margin: 0, lineHeight: 1.3 }}>{toSig.title.slice(0, 45)}{toSig.title.length > 45 ? "…" : ""}</p>
                        </div>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: `${tcfg?.color ?? LYTE}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TIcon size={11} style={{ color: tcfg?.color ?? LYTE }} />
                        </div>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Architecture note */}
          <section style={{ padding: "clamp(4rem,8vw,5rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}
              >
                <div>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "0.75rem" }}>
                    Architecture Lineage
                  </p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.125rem)", fontWeight: 700, letterSpacing: "-0.022em", color: TEXT, marginBottom: "1rem" }}>
                    Signal fusion grounded in intelligence-grade architecture.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: TEXT_SEC, marginBottom: "1.5rem" }}>
                    The Signal Fusion Panel draws from STONE GHOST's multinational fusion database, NSA's signals correlation architecture, and Russia's SORM-generation ingestion completeness model — and adapts these patterns for governed enterprise signal management.
                  </p>
                  <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                    <Link href="/lyte/decision-theater" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.125rem", background: LYTE, color: "hsl(214,18%,4%)", borderRadius: 6, fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}>
                      Open Decision Theater <ArrowRight size={13} />
                    </Link>
                    <Link href="/lyte" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.125rem", background: "transparent", color: TEXT_SEC, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: "0.8125rem", fontWeight: 500, textDecoration: "none" }}>
                      Back to KORA
                    </Link>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {[
                    { src: "Five Eyes STONE GHOST", map: "Multinational fusion DB → Cross-domain PRAXIS Bus signal correlation" },
                    { src: "NSA SIGINT architecture", map: "Multi-source correlation → Confidence-weighted signal scoring" },
                    { src: "Russia SORM-III", map: "Signal coverage breadth by source → Domain coverage completeness per pack" },
                    { src: "Anduril Lattice ingestion", map: "Sensor fusion layer → Normalized domain signal schema" },
                  ].map((item, i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.07 }}
                      style={{ padding: "0.875rem 1.125rem", borderRadius: "7px", background: SURFACE, border: `1px solid ${BORDER}` }}
                    >
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: LYTE, marginBottom: "0.25rem" }}>{item.src}</p>
                      <p style={{ fontSize: "0.8125rem", color: TEXT_SEC, margin: 0, lineHeight: 1.5 }}>{item.map}</p>
                    </m.div>
                  ))}
                </div>
              </m.div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
