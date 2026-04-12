import { useState } from "react";
import { TrendingDown, TrendingUp, AlertTriangle, Activity, CheckCircle, Bot, ChevronDown, ChevronUp } from "lucide-react";

interface Anomaly {
  id: string;
  lens: string;
  domain: string;
  metric: string;
  deviation: number;
  direction: "down" | "up";
  narration: string;
  historicalContext: string;
  severity: "critical" | "high" | "medium";
  detectedAt: string;
}

const DEMO_ANOMALIES: Anomaly[] = [
  {
    id: "an-001",
    lens: "Operational Risk",
    domain: "vessels",
    metric: "Fleet Route Compliance",
    deviation: -34,
    direction: "down",
    narration: "Fleet route compliance dropped 34% week-over-week — this hasn't happened since Q3 2024 during the Suez disruption. Both Vessels and PRISM are showing correlated signals.",
    historicalContext: "Previous low: -28% in Q3 2024 (Suez). Current trend sustained for 72h — longer than the Suez event at 48h.",
    severity: "critical",
    detectedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "an-002",
    lens: "Compliance Drift",
    domain: "aegis",
    metric: "Sanctions Screening Latency",
    deviation: 89,
    direction: "up",
    narration: "Sanctions screening P95 latency spiked 89% above baseline — coinciding with new SDN list update. 3 pending screenings are outside SLA.",
    historicalContext: "Baseline: 2.1 min. Current P95: 3.97 min. SLA threshold: 3.5 min. SLA breached.",
    severity: "high",
    detectedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "an-003",
    lens: "Growth Velocity",
    domain: "terra",
    metric: "Acquisition Pipeline Velocity",
    deviation: 23,
    direction: "up",
    narration: "Terra acquisition pipeline velocity up 23% — Amsterdam market improvement driving 4 new qualified opportunities. Above trend for 2 weeks.",
    historicalContext: "Strongest growth signal since Q1 2025. Aligns with vacancy rate improvement reported this week.",
    severity: "medium",
    detectedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

const AUTONOMOUS_LOG = [
  { id: 1, action: "Approved AWS Q2 invoice $48,200", reasoning: "Within budget envelope ($180K Q2 cloud), PO matched, all services active. Confidence: 98%. Policy: auto-approve invoices <$50K with matched PO.", outcome: "Processed", time: "2h ago", risk: "low" },
  { id: 2, action: "Escalated CloudOps vendor risk to CISO", reasoning: "SOC 2 expired >12 months, CVSS avg 6.8, PII data processed. Policy: escalate vendors with expired security certifications handling >100GB PII.", outcome: "CISO notified", time: "6h ago", risk: "medium" },
  { id: 3, action: "Blocked bulk data export to non-approved jurisdiction", reasoning: "Target: us-east-2. Policy DG-2024-07: customer PII must not leave EU-WEST-1. Action blocked pre-execution.", outcome: "Blocked", time: "8h ago", risk: "high" },
  { id: 4, action: "Updated 14 vessel AIS records — reconciled discrepancies", reasoning: "Automated reconciliation detected 14 GPS drift events. All within normal deviation range. Applied standard correction algorithm.", outcome: "Records updated", time: "10h ago", risk: "low" },
  { id: 5, action: "Generated Q1 fleet performance digest for 8 stakeholders", reasoning: "Scheduled 06:00 UTC daily generation. Data quality: 97%. All recipients confirmed delivery.", outcome: "Delivered", time: "12h ago", risk: "low" },
];

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  high: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  medium: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
};

const RISK_CONFIG: Record<string, { color: string }> = {
  low: { color: "#10b981" },
  medium: { color: "#f59e0b" },
  high: { color: "#ef4444" },
};

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "#38bdf8", terra: "#86efac", aegis: "#818cf8", prism: "#fbbf24", lyte: "#2dd4bf", alloy: "#c084fc",
};

function formatRelative(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [open, setOpen] = useState(anomaly.severity === "critical");
  const cfg = SEVERITY_CONFIG[anomaly.severity]!;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: cfg.border, background: "rgba(10,14,24,0.9)" }}>
      <button className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/2 transition-colors" onClick={() => setOpen(o => !o)}>
        {anomaly.direction === "down"
          ? <TrendingDown className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: anomaly.severity === "critical" ? "#ef4444" : cfg.color }} />
          : <TrendingUp className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: anomaly.severity === "medium" ? "#10b981" : cfg.color }} />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>{anomaly.severity}</span>
            <span className="text-[8px] capitalize px-1 py-0.5 rounded" style={{ color: DOMAIN_COLORS[anomaly.domain] ?? "#4B8BDB", background: `${DOMAIN_COLORS[anomaly.domain] ?? "#4B8BDB"}15` }}>{anomaly.domain}</span>
            <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>{anomaly.lens}</span>
          </div>
          <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{anomaly.metric}</p>
          <p className="text-[9px]" style={{ color: cfg.color }}>
            {anomaly.direction === "down" ? "↓" : "↑"} {Math.abs(anomaly.deviation)}% vs. baseline
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>{formatRelative(anomaly.detectedAt)}</span>
          {open ? <ChevronUp className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} /> : <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="mt-2 text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{anomaly.narration}</div>
          <div className="rounded-lg p-2 text-[9px]" style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.35)" }}>
            <span className="text-[8px] uppercase tracking-widest block mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>Historical Context</span>
            {anomaly.historicalContext}
          </div>
        </div>
      )}
    </div>
  );
}

function AutonomousLogEntry({ entry }: { entry: typeof AUTONOMOUS_LOG[0] }) {
  const [open, setOpen] = useState(false);
  const riskCfg = RISK_CONFIG[entry.risk] ?? RISK_CONFIG.low!;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.8)" }}>
      <button className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-white/2 transition-colors" onClick={() => setOpen(o => !o)}>
        <Bot className="w-3 h-3 shrink-0 mt-0.5" style={{ color: "#c084fc" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest px-1 py-0.5 rounded" style={{ color: riskCfg.color, background: `${riskCfg.color}15` }}>{entry.risk} risk</span>
            <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>{entry.time}</span>
          </div>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>{entry.action}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: "#10b981", background: "rgba(16,185,129,0.1)" }}>{entry.outcome}</span>
          {open ? <ChevronUp className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} /> : <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="mt-2 text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="text-[8px] uppercase tracking-widest block mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>AI Reasoning Chain</span>
            {entry.reasoning}
          </div>
        </div>
      )}
    </div>
  );
}

export function AnomalyDetection() {
  const [tab, setTab] = useState<"anomalies" | "autonomous">("anomalies");

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Activity className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
          <h3 className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>Intelligence Engine</h3>
        </div>
        <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>Anomaly detection + autonomous action log</p>
      </div>

      <div className="flex gap-1.5">
        {(["anomalies", "autonomous"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-[9px] px-2.5 py-1 rounded-lg border capitalize transition-all"
            style={{
              background: tab === t ? "rgba(75,139,219,0.08)" : "rgba(255,255,255,0.02)",
              borderColor: tab === t ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.06)",
              color: tab === t ? "#4B8BDB" : "rgba(255,255,255,0.35)",
            }}
          >
            {t === "anomalies" ? "Anomalies" : "Autonomous Actions"}
          </button>
        ))}
      </div>

      {tab === "anomalies" && (
        <div className="space-y-2">
          {DEMO_ANOMALIES.map(a => <AnomalyCard key={a.id} anomaly={a} />)}
        </div>
      )}

      {tab === "autonomous" && (
        <div className="space-y-1.5">
          {AUTONOMOUS_LOG.map(entry => <AutonomousLogEntry key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  );
}
