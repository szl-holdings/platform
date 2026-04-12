import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Activity, TrendingDown, ChevronRight, Clock,
  Server, Database, GitBranch, Cpu, Shield, Zap, BarChart3,
  ArrowUpRight, ChevronDown,
} from "lucide-react";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const GOLD = "#d4a054";

type FailureTimeframe = "24h" | "48h";
type Probability = "critical" | "high" | "medium" | "low";

interface DriftSignal {
  metric: string;
  current: string;
  baseline: string;
  delta: string;
  trend: "up" | "down";
}

interface FailureForecast {
  id: string;
  service: string;
  serviceIcon: React.ElementType;
  serviceColor: string;
  failureType: string;
  probability: number;
  probLevel: Probability;
  timeframe: FailureTimeframe;
  eta: string;
  rootCause: string;
  driftSignals: DriftSignal[];
  mitigations: string[];
  impactIfUnmitigated: string;
}

const probConfig: Record<Probability, { color: string; bg: string; label: string }> = {
  critical: { color: "#f87171", bg: "rgba(248,113,113,0.09)", label: "Critical" },
  high: { color: GOLD, bg: "rgba(212,160,84,0.09)", label: "High" },
  medium: { color: "#60a5fa", bg: "rgba(96,165,250,0.09)", label: "Medium" },
  low: { color: "#34d399", bg: "rgba(52,211,153,0.09)", label: "Low" },
};

const FORECASTS: FailureForecast[] = [
  {
    id: "f1",
    service: "PostgreSQL Primary",
    serviceIcon: Database,
    serviceColor: "#60a5fa",
    failureType: "Connection pool saturation",
    probability: 89,
    probLevel: "critical",
    timeframe: "24h",
    eta: "Est. 6–9 hours",
    rootCause: "Connection pool growing 3.2 connections/hour due to unreleased idle connections from terra-api v2.3. At current drift, pool limit (100) reached tonight.",
    driftSignals: [
      { metric: "Active connections", current: "71", baseline: "38", delta: "+87%", trend: "up" },
      { metric: "Idle connections", current: "34", baseline: "12", delta: "+183%", trend: "up" },
      { metric: "Connection wait time", current: "340ms", baseline: "12ms", delta: "+2733%", trend: "up" },
      { metric: "Query throughput", current: "4,200/m", baseline: "4,800/m", delta: "-12.5%", trend: "down" },
    ],
    mitigations: [
      "Set connection timeout to 30s in terra-api v2.3 immediately",
      "Scale connection pool to 150 as interim buffer",
      "Deploy terra-api v2.3.1 with connection lifecycle fix",
    ],
    impactIfUnmitigated: "Complete database unavailability across all SZL services. ETA: ~8 hours.",
  },
  {
    id: "f2",
    service: "Vessels Worker Fleet",
    serviceIcon: Server,
    serviceColor: "#38bdf8",
    failureType: "Memory exhaustion (OOM kill cascade)",
    probability: 74,
    probLevel: "high",
    timeframe: "24h",
    eta: "Est. 3–5 hours",
    rootCause: "Memory leak in vessels-worker v1.9.2 consuming 14MB/hour. Pod restart interval of 6h is insufficient. Three pods currently at >80% of 2GB limit.",
    driftSignals: [
      { metric: "Pod memory avg", current: "1.74 GB", baseline: "380 MB", delta: "+358%", trend: "up" },
      { metric: "Memory growth rate", current: "14 MB/h", baseline: "0.2 MB/h", delta: "+6900%", trend: "up" },
      { metric: "Pod restart count", current: "12 (24h)", baseline: "2 (24h)", delta: "+500%", trend: "up" },
    ],
    mitigations: [
      "Immediate rolling restart of vessels-worker pods",
      "Set restart policy to 2h interval as interim measure",
      "Escalate memory leak root cause to vessels engineering team",
    ],
    impactIfUnmitigated: "OOM kill cascade causing 20–40 minutes of vessels data processing downtime.",
  },
  {
    id: "f3",
    service: "Aegis API Gateway",
    serviceIcon: Shield,
    serviceColor: "#f87171",
    failureType: "TLS certificate expiry",
    probability: 99,
    probLevel: "critical",
    timeframe: "24h",
    eta: "5h 48m (exact)",
    rootCause: "ACME DNS challenge failure on auto-renewal 18 hours ago. Certificate expires at 18:42 UTC today. Manual renewal initiated — in progress.",
    driftSignals: [
      { metric: "Cert expiry countdown", current: "5h 48m", baseline: "90 days", delta: "-", trend: "down" },
      { metric: "ACME renewal attempts", current: "3 failed", baseline: "0 failed", delta: "—", trend: "up" },
    ],
    mitigations: [
      "✓ Manual renewal in progress via Cloudflare DNS",
      "→ Certificate installation after ACME validation",
      "→ Ingress restart to apply new cert",
      "→ Post-fix: investigate DNS challenge failure cause",
    ],
    impactIfUnmitigated: "Complete Aegis API TLS failure at 18:42 UTC. All API calls fail with SSL error.",
  },
  {
    id: "f4",
    service: "Terra Search",
    serviceIcon: Activity,
    serviceColor: "#34d399",
    failureType: "Query performance degradation → timeout cascade",
    probability: 42,
    probLevel: "medium",
    timeframe: "48h",
    eta: "Est. 24–36 hours at current rate",
    rootCause: "N+1 query pattern in terra-search v2.3.1 introduces 180ms overhead per request. Under peak load (>1,200 RPS), timeout risk increases sharply.",
    driftSignals: [
      { metric: "P95 latency", current: "450ms", baseline: "180ms", delta: "+150%", trend: "up" },
      { metric: "Timeout rate", current: "0.8%", baseline: "0.02%", delta: "+3900%", trend: "up" },
      { metric: "Hourly request peak", current: "1,050 RPS", baseline: "800 RPS", delta: "+31%", trend: "up" },
    ],
    mitigations: [
      "Apply N+1 fix patch to terra-search (ready for deploy)",
      "Add 800ms timeout guard with graceful fallback",
      "Enable query result caching for property search",
    ],
    impactIfUnmitigated: "40–60% of terra property searches timing out at peak load within 36 hours.",
  },
];

function ProbabilityBar({ value, level }: { value: number; level: Probability }) {
  const cfg = probConfig[level];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: "100%", background: cfg.color, borderRadius: 2 }}
        />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color, minWidth: 38, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: FailureForecast }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = probConfig[forecast.probLevel];
  const Icon = forecast.serviceIcon;

  return (
    <div style={{
      background: BG.surface, border: `1px solid ${BORDER.subtle}`,
      borderRadius: 10, overflow: "hidden",
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />
      <div
        style={{ padding: "14px 16px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: `${forecast.serviceColor}12`, border: `1px solid ${forecast.serviceColor}25`,
            display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2,
          }}>
            <Icon size={14} style={{ color: forecast.serviceColor }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: TEXT.primary }}>{forecast.service}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                background: cfg.bg, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase",
              }}>{cfg.label}</span>
              <span style={{ fontSize: 10, color: TEXT.muted, marginLeft: "auto" }}>{forecast.timeframe} window</span>
            </div>
            <p style={{ fontSize: 12, color: TEXT.secondary, margin: "0 0 10px" }}>{forecast.failureType}</p>
            <ProbabilityBar value={forecast.probability} level={forecast.probLevel} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Clock size={10} style={{ color: TEXT.muted }} />
              <span style={{ fontSize: 10, color: TEXT.muted }}>{forecast.eta}</span>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {expanded ? <ChevronDown size={13} style={{ color: TEXT.tertiary }} /> : <ChevronRight size={13} style={{ color: TEXT.tertiary }} />}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${BORDER.subtle}`, padding: "16px" }}>
          <p style={{ fontSize: 12, color: TEXT.secondary, margin: "0 0 16px", lineHeight: 1.6 }}>{forecast.rootCause}</p>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: TEXT.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Drift Signals
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {forecast.driftSignals.map((sig, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1fr 80px 80px 80px",
                  padding: "8px 10px", background: BG.elevated, borderRadius: 6,
                  border: `1px solid ${BORDER.subtle}`, alignItems: "center",
                }}>
                  <span style={{ fontSize: 11, color: TEXT.secondary }}>{sig.metric}</span>
                  <span style={{ fontSize: 11, color: TEXT.primary, fontWeight: 600 }}>{sig.current}</span>
                  <span style={{ fontSize: 11, color: TEXT.muted }}>base: {sig.baseline}</span>
                  <span style={{ fontSize: 11, color: sig.trend === "up" ? "#f87171" : "#34d399", fontWeight: 600 }}>{sig.delta}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: TEXT.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Mitigations
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {forecast.mitigations.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    background: m.startsWith("✓") ? "rgba(52,211,153,0.12)" : `${cfg.color}12`,
                    border: `1px solid ${m.startsWith("✓") ? "rgba(52,211,153,0.3)" : cfg.color + "30"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
                    fontSize: 9, color: m.startsWith("✓") ? "#34d399" : cfg.color,
                  }}>
                    {m.startsWith("✓") ? "✓" : m.startsWith("→") ? "→" : String(i + 1)}
                  </div>
                  <span style={{ fontSize: 11, color: TEXT.secondary, lineHeight: 1.5 }}>
                    {m.replace(/^[✓→]\s?/, "")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            padding: "10px 12px", background: `${cfg.color}08`,
            border: `1px solid ${cfg.color}20`, borderRadius: 7,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: cfg.color, margin: "0 0 3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              If Unmitigated
            </p>
            <p style={{ fontSize: 11, color: TEXT.secondary, margin: 0 }}>{forecast.impactIfUnmitigated}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChaosPrediction() {
  const criticals = FORECASTS.filter(f => f.probLevel === "critical").length;
  const highs = FORECASTS.filter(f => f.probLevel === "high").length;

  return (
    <div style={{ padding: "20px 20px 60px", background: BG.page, minHeight: "100%", color: TEXT.primary }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Activity size={14} style={{ color: GOLD }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Chaos Prediction Engine
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: TEXT.primary, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Failure Forecast
          </h1>
          <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0 }}>
            Drift-pattern analysis identifying where failures will occur before they happen. 24–48 hour prediction window.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Critical Risk", value: criticals, color: "#f87171" },
            { label: "High Risk", value: highs, color: GOLD },
            { label: "Avg Prediction Window", value: "31h", color: TEXT.secondary },
            { label: "Model Accuracy (30d)", value: "94%", color: "#34d399" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: BG.surface, border: `1px solid ${BORDER.subtle}`,
              borderRadius: 8, padding: "12px 14px",
            }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: stat.color, margin: "0 0 2px", letterSpacing: "-0.03em" }}>{stat.value}</p>
              <p style={{ fontSize: 10, color: TEXT.muted, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FORECASTS.map(f => <ForecastCard key={f.id} forecast={f} />)}
        </div>
      </div>
    </div>
  );
}
