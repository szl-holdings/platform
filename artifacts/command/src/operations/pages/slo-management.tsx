import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Target, CheckCircle, Flame, Settings, AlertTriangle, Activity, Clock, Shield, TrendingUp } from "lucide-react";

const GOLD = "#d4a054";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

type SLOStatus = "healthy" | "at_risk" | "breached";

interface SLO {
  id: string;
  name: string;
  service: string;
  metric: string;
  target: number;
  current: number;
  window: "30d" | "7d" | "24h";
  errorBudgetTotal: number;
  errorBudgetConsumed: number;
  burnRate1h: number;
  burnRate6h: number;
  burnRate24h: number;
  burnRate72h: number;
  status: SLOStatus;
  exhaustionForecast: number | null;
  alertFiring: boolean;
  alertType: "fast-burn" | "slow-burn" | null;
  history: { t: string; budget: number; br: number }[];
}

interface PlatformSloData {
  ok: boolean;
  generatedAt: string;
  dataSource: string;
  availability: {
    target: number;
    current: number | null;
    hasData: boolean;
    windowDays: number;
  };
  errorBudget: {
    totalMinutes: number;
    consumedMinutes: number;
    remainingMinutes: number;
    remainingPct: number;
    policy: string;
  };
  errorRate: {
    current: number;
    target: number;
    sloMet: boolean;
  };
  latency: {
    read: { p50Target: number; p95Target: number; p99Target: number; p50Current: number; p95Current: number; p99Current: number };
  };
  workflowEngine: {
    queueDepth: number;
    queueDepthThreshold: number;
    completionRate24h: number;
    completionRateTarget: number;
  };
  approvalLatency: Record<string, {
    count: number;
    avgMinutes: number;
    maxMinutes: number;
    slaTarget: number;
    alertThreshold: number;
  }>;
  activeAlerts: {
    p0: Array<{ id: number; rule_name: string; severity: string; metric_name: string; metric_value: number; threshold: number; message: string; created_at: string }>;
    p1: Array<{ id: number; rule_name: string; severity: string; metric_name: string; metric_value: number; threshold: number; message: string; created_at: string }>;
    all: Array<{ id: number; rule_name: string; severity: string; message: string; created_at: string }>;
    totalFiring: number;
  };
  uptimeSample: {
    requestCount: number;
    uptimeSeconds: number;
  };
}

const SEED: SLO[] = [
  {
    id: "s1", name: "API Gateway Availability", service: "szl-api-server",
    metric: "availability", target: 99.9, current: 99.83, window: "30d",
    errorBudgetTotal: 43.2, errorBudgetConsumed: 34.6,
    burnRate1h: 14.2, burnRate6h: 8.7, burnRate24h: 4.1, burnRate72h: 2.3,
    status: "at_risk", exhaustionForecast: 3.2, alertFiring: true, alertType: "fast-burn",
    history: Array.from({ length: 24 }, (_, i) => ({ t: `${i}h`, budget: Math.max(0, 43.2 - i * 1.45 + (Math.random() - 0.5) * 1.2), br: 4 + Math.random() * 10 + (i > 18 ? 8 : 0) })),
  },
  {
    id: "s2", name: "Alloy Workflow Completion Rate", service: "szl-alloy-workflow",
    metric: "completion_rate", target: 99.5, current: 99.62, window: "30d",
    errorBudgetTotal: 216, errorBudgetConsumed: 89.4,
    burnRate1h: 1.8, burnRate6h: 1.4, burnRate24h: 1.2, burnRate72h: 1.1,
    status: "healthy", exhaustionForecast: null, alertFiring: false, alertType: null,
    history: Array.from({ length: 24 }, (_, i) => ({ t: `${i}h`, budget: Math.max(0, 216 - i * 3.7 + (Math.random() - 0.5) * 4), br: 1 + Math.random() * 0.8 })),
  },
  {
    id: "s3", name: "Auth Service Error Rate", service: "szl-api-server",
    metric: "error_rate", target: 99.0, current: 98.71, window: "30d",
    errorBudgetTotal: 432, errorBudgetConsumed: 428.1,
    burnRate1h: 3.2, burnRate6h: 2.8, burnRate24h: 1.9, burnRate72h: 1.5,
    status: "breached", exhaustionForecast: 0, alertFiring: true, alertType: "slow-burn",
    history: Array.from({ length: 24 }, (_, i) => ({ t: `${i}h`, budget: Math.max(0, 432 - i * 17.8 + (Math.random() - 0.5) * 5), br: 2 + Math.random() * 2 })),
  },
  {
    id: "s4", name: "Emergency Approval Delivery", service: "szl-alloy-workflow",
    metric: "approval_latency", target: 99.5, current: 99.88, window: "7d",
    errorBudgetTotal: 50.4, errorBudgetConsumed: 6.2,
    burnRate1h: 0.4, burnRate6h: 0.6, burnRate24h: 0.5, burnRate72h: 0.5,
    status: "healthy", exhaustionForecast: null, alertFiring: false, alertType: null,
    history: Array.from({ length: 24 }, (_, i) => ({ t: `${i}h`, budget: Math.max(0, 50.4 - i * 0.26 + (Math.random() - 0.5) * 0.5), br: 0.4 + Math.random() * 0.3 })),
  },
  {
    id: "s5", name: "AI Inference Latency P95", service: "szl-ai-engine",
    metric: "latency_p95", target: 99.95, current: 99.91, window: "30d",
    errorBudgetTotal: 21.6, errorBudgetConsumed: 18.9,
    burnRate1h: 2.1, burnRate6h: 1.8, burnRate24h: 1.4, burnRate72h: 1.3,
    status: "at_risk", exhaustionForecast: 8.4, alertFiring: false, alertType: null,
    history: Array.from({ length: 24 }, (_, i) => ({ t: `${i}h`, budget: Math.max(0, 21.6 - i * 0.79 + (Math.random() - 0.5) * 0.4), br: 1.3 + Math.random() * 0.8 })),
  },
  {
    id: "s6", name: "Signal-to-Action P95", service: "szl-signal-ingestion",
    metric: "signal_to_action", target: 99.0, current: 99.4, window: "30d",
    errorBudgetTotal: 432, errorBudgetConsumed: 172.8,
    burnRate1h: 0.7, burnRate6h: 0.9, burnRate24h: 0.8, burnRate72h: 0.8,
    status: "healthy", exhaustionForecast: null, alertFiring: false, alertType: null,
    history: Array.from({ length: 24 }, (_, i) => ({ t: `${i}h`, budget: Math.max(0, 432 - i * 7.2 + (Math.random() - 0.5) * 5), br: 0.8 + Math.random() * 0.3 })),
  },
];

const STATUS_CONFIG: Record<SLOStatus, { color: string; label: string; bg: string }> = {
  healthy: { color: "#10b981", label: "Healthy", bg: "rgba(16,185,129,0.08)" },
  at_risk: { color: GOLD, label: "At Risk", bg: "rgba(212,160,84,0.08)" },
  breached: { color: "#ef4444", label: "Breached", bg: "rgba(239,68,68,0.08)" },
};

function SparkLine({ history, color }: { history: { budget: number }[]; color: string }) {
  const vals = history.map(h => h.budget);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 120, h = 28;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-6">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

function BurnRateBar({ label, rate, threshold, color }: { label: string; rate: number; threshold: number; color: string }) {
  const pct = Math.min(100, (rate / Math.max(threshold * 3, rate * 1.2)) * 100);
  const firing = rate > threshold;
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px]" style={{ color: DS.text.muted }}>{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono" style={{ color: firing ? "#ef4444" : DS.text.secondary }}>{rate.toFixed(1)}x</span>
          {firing && <Flame className="w-2.5 h-2.5 text-[#ef4444]" />}
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: firing ? "#ef4444" : color }} />
      </div>
      <div className="text-[8px] mt-0.5" style={{ color: DS.text.muted }}>threshold: {threshold}x</div>
    </div>
  );
}

function BudgetGauge({ pct, color }: { pct: number; color: string }) {
  const remaining = 100 - pct;
  const r = 28, cx = 36, cy = 36;
  const circumference = 2 * Math.PI * r;
  const dashArray = `${(remaining / 100) * circumference} ${circumference}`;
  const dashOffset = circumference * 0.25;
  return (
    <svg viewBox="0 0 72 72" className="w-16 h-16">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "36px 36px", transition: "stroke-dasharray 0.5s" }} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill={color}>
        {remaining.toFixed(0)}%
      </text>
      <text x={cx} y={cx + 10} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.3)">left</text>
    </svg>
  );
}

function SLODetail({ slo }: { slo: SLO }) {
  const sc = STATUS_CONFIG[slo.status];
  const budgetPct = (slo.errorBudgetConsumed / slo.errorBudgetTotal) * 100;
  const remaining = ((slo.errorBudgetTotal - slo.errorBudgetConsumed) / slo.errorBudgetTotal) * 100;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${sc.color}25`, background: sc.bg }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <BudgetGauge pct={budgetPct} color={sc.color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.label}</span>
              {slo.alertFiring && (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono animate-pulse" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                  {slo.alertType === "fast-burn" ? "FAST BURN ALERT" : "SLOW BURN ALERT"}
                </span>
              )}
            </div>
            <div className="text-[12px] font-semibold mb-0.5" style={{ color: DS.text.primary }}>{slo.name}</div>
            <div className="text-[9px] font-mono mb-2" style={{ color: DS.text.muted }}>{slo.service} · {slo.window} window</div>
            <div className="flex items-center gap-4 text-[10px]">
              <div>
                <span style={{ color: DS.text.muted }}>Target </span>
                <span className="font-mono font-bold" style={{ color: DS.text.secondary }}>{slo.target}%</span>
              </div>
              <div>
                <span style={{ color: DS.text.muted }}>Actual </span>
                <span className="font-mono font-bold" style={{ color: slo.current >= slo.target ? "#10b981" : "#ef4444" }}>{slo.current}%</span>
              </div>
              {slo.exhaustionForecast !== null && slo.exhaustionForecast > 0 && (
                <div className="text-[9px]" style={{ color: "#ef4444" }}>
                  Budget exhausts in <span className="font-mono font-bold">{slo.exhaustionForecast.toFixed(1)}d</span>
                </div>
              )}
              {slo.status === "breached" && (
                <div className="text-[9px]" style={{ color: "#ef4444" }}>Error budget depleted</div>
              )}
            </div>
          </div>
          <SparkLine history={slo.history} color={sc.color} />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <BurnRateBar label="1h burn" rate={slo.burnRate1h} threshold={14.4} color={sc.color} />
          <BurnRateBar label="6h burn" rate={slo.burnRate6h} threshold={6} color={sc.color} />
          <BurnRateBar label="24h burn" rate={slo.burnRate24h} threshold={3} color={sc.color} />
          <BurnRateBar label="72h burn" rate={slo.burnRate72h} threshold={1} color={sc.color} />
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px]" style={{ color: DS.text.muted }}>Error Budget: {slo.errorBudgetConsumed.toFixed(1)}m consumed of {slo.errorBudgetTotal.toFixed(1)}m</span>
            <span className="text-[9px] font-mono" style={{ color: sc.color }}>{remaining.toFixed(1)}% remaining</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, budgetPct)}%`, background: `linear-gradient(90deg, ${sc.color}80, ${sc.color})` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LatencyCell({ label, current, target, unit = "ms" }: { label: string; current: number; target: number; unit?: string }) {
  const pct = Math.min(100, (current / target) * 100);
  const color = current <= target ? "#10b981" : current <= target * 1.5 ? GOLD : "#ef4444";
  return (
    <div className="rounded-lg p-3" style={{ background: DS.surface, border: `1px solid ${color}22` }}>
      <div className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: DS.text.muted }}>{label}</div>
      <div className="text-[18px] font-bold font-mono mb-1" style={{ color }}>
        {current > 0 ? `${current}${unit}` : "—"}
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[8px] mt-1" style={{ color: DS.text.muted }}>target ≤ {target}{unit}</div>
    </div>
  );
}

function ActiveAlertBanner({ alerts, tier }: { alerts: Array<{ rule_name: string; metric_name: string; message: string; created_at: string }>; tier: "P0" | "P1" }) {
  if (alerts.length === 0) return null;
  const color = tier === "P0" ? "#ef4444" : "#f97316";
  const bg = tier === "P0" ? "rgba(239,68,68,0.08)" : "rgba(249,115,22,0.08)";
  return (
    <div className="rounded-xl border p-4 mb-3" style={{ borderColor: `${color}30`, background: bg }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4" style={{ color }} />
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{tier} Active — {alerts.length} alert{alerts.length > 1 ? "s" : ""} firing</span>
        <span className="text-[8px] px-1.5 py-0.5 rounded font-mono animate-pulse" style={{ background: `${color}15`, color }}>FIRING</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: color }} />
            <div>
              <span className="font-semibold" style={{ color: DS.text.primary }}>{a.rule_name.replace(/^\[P\d\] /, "")}</span>
              <span style={{ color: DS.text.muted }}> — {a.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalLatencyRow({ severity, data }: {
  severity: string;
  data: { count: number; avgMinutes: number; maxMinutes: number; slaTarget: number; alertThreshold: number };
}) {
  const { count, avgMinutes, maxMinutes, slaTarget, alertThreshold } = data;
  if (count === 0) return null;
  const isAtRisk = maxMinutes >= alertThreshold;
  const isBreached = maxMinutes >= slaTarget;
  const color = isBreached ? "#ef4444" : isAtRisk ? GOLD : "#10b981";
  return (
    <div className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="w-20 text-[10px] font-semibold capitalize" style={{ color: DS.text.secondary }}>{severity}</div>
      <div className="text-[10px] font-mono" style={{ color: DS.text.muted }}>{count} pending</div>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (maxMinutes / slaTarget) * 100)}%`, background: color }} />
      </div>
      <div className="text-[10px] font-mono" style={{ color }}>
        max {maxMinutes.toFixed(0)}m
      </div>
      <div className="text-[9px]" style={{ color: DS.text.muted }}>SLA: {slaTarget}m</div>
      {(isAtRisk || isBreached) && (
        <span className="text-[8px] px-1 py-0.5 rounded font-mono" style={{ background: `${color}15`, color }}>
          {isBreached ? "BREACHED" : "AT RISK"}
        </span>
      )}
    </div>
  );
}

export default function SLOManagement() {
  const [filter, setFilter] = useState<"all" | SLOStatus>("all");

  const { data: slo, isLoading } = useQuery<PlatformSloData>({
    queryKey: ["ops-slo"],
    queryFn: async () => {
      const res = await fetch("/api/ops/slo", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load SLO data");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });

  const filtered = filter === "all" ? SEED : SEED.filter(s => s.status === filter);
  const counts = { healthy: SEED.filter(s => s.status === "healthy").length, at_risk: SEED.filter(s => s.status === "at_risk").length, breached: SEED.filter(s => s.status === "breached").length };
  const alertFiring = SEED.filter(s => s.alertFiring).length;

  const p0Alerts = slo?.activeAlerts?.p0 ?? [];
  const p1Alerts = slo?.activeAlerts?.p1 ?? [];
  const totalFiring = slo?.activeAlerts?.totalFiring ?? 0;
  const latency = slo?.latency?.read;
  const budget = slo?.errorBudget;
  const budgetColor = budget ? (budget.remainingPct > 50 ? "#10b981" : budget.remainingPct > 25 ? GOLD : "#ef4444") : "#10b981";

  const availabilityColor = slo?.availability?.current != null
    ? (slo.availability.current >= slo.availability.target ? "#10b981" : "#ef4444")
    : DS.text.muted;

  const approvalEntries = slo?.approvalLatency
    ? Object.entries(slo.approvalLatency).filter(([, d]) => d.count > 0)
    : [];

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6" style={{ background: "#080c14" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>SLO / SLI Management</h1>
            {(alertFiring > 0 || totalFiring > 0) && (
              <span className="text-[8px] px-1.5 py-0.5 rounded font-mono animate-pulse" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                {Math.max(alertFiring, totalFiring)} ALERT{Math.max(alertFiring, totalFiring) > 1 ? "S" : ""} FIRING
              </span>
            )}
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            Platform SLOs with live error budget tracking, multi-window burn rate alerting, and exhaustion forecasting.
            {slo && <span className="ml-1 opacity-60">Updated {new Date(slo.generatedAt).toLocaleTimeString()} · {slo.dataSource}</span>}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium shrink-0"
          style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}>
          <Settings className="w-3.5 h-3.5" /> Define SLO
        </button>
      </div>

      {/* Active P0/P1 Alerts from live data */}
      {p0Alerts.length > 0 && <ActiveAlertBanner alerts={p0Alerts} tier="P0" />}
      {p1Alerts.length > 0 && <ActiveAlertBanner alerts={p1Alerts} tier="P1" />}

      {/* Platform SLO Live Panel */}
      {slo && (
        <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: DS.border, background: DS.surface }}>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: DS.text.muted }}>Platform SLOs — Live</span>
            {!isLoading && (
              <span className="ml-auto text-[8px] font-mono" style={{ color: slo.dataSource === "live" ? "#10b981" : DS.text.muted }}>
                {slo.dataSource === "live" ? "● LIVE" : "◐ PARTIAL"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Availability */}
            <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${availabilityColor}22` }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Availability 30d</div>
              <div className="text-[18px] font-bold font-mono" style={{ color: availabilityColor }}>
                {slo.availability.hasData && slo.availability.current != null
                  ? `${slo.availability.current.toFixed(2)}%`
                  : "—"}
              </div>
              <div className="text-[8px] mt-1" style={{ color: DS.text.muted }}>target: {slo.availability.target}%</div>
            </div>

            {/* Error Rate */}
            <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${slo.errorRate.sloMet ? "#10b981" : "#ef4444"}22` }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Error Rate (5xx)</div>
              <div className="text-[18px] font-bold font-mono" style={{ color: slo.errorRate.sloMet ? "#10b981" : "#ef4444" }}>
                {slo.errorRate.current.toFixed(2)}%
              </div>
              <div className="text-[8px] mt-1" style={{ color: DS.text.muted }}>target: &lt;{slo.errorRate.target}%</div>
            </div>

            {/* Error Budget */}
            <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${budgetColor}22` }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Error Budget</div>
              <div className="text-[18px] font-bold font-mono" style={{ color: budgetColor }}>
                {budget?.remainingPct.toFixed(0)}%
              </div>
              <div className="text-[8px] mt-1" style={{ color: DS.text.muted }}>{budget?.remainingMinutes}m remaining · {budget?.policy}</div>
            </div>

            {/* Workflow Engine */}
            <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${slo.workflowEngine.completionRate24h >= 99 ? "#10b981" : GOLD}22` }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Workflow Completion</div>
              <div className="text-[18px] font-bold font-mono" style={{ color: slo.workflowEngine.completionRate24h >= 99 ? "#10b981" : GOLD }}>
                {slo.workflowEngine.completionRate24h.toFixed(1)}%
              </div>
              <div className="text-[8px] mt-1" style={{ color: DS.text.muted }}>
                queue: {slo.workflowEngine.queueDepth} · target: {slo.workflowEngine.completionRateTarget}%
              </div>
            </div>
          </div>

          {/* Latency Panel */}
          {latency && (
            <div>
              <div className="text-[9px] uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: DS.text.muted }}>
                <Activity className="w-3 h-3" /> API Latency vs SLO Targets
              </div>
              <div className="grid grid-cols-3 gap-3">
                <LatencyCell label="P50 Latency" current={latency.p50Current} target={latency.p50Target} />
                <LatencyCell label="P95 Latency" current={latency.p95Current} target={latency.p95Target} />
                <LatencyCell label="P99 Latency" current={latency.p99Current} target={latency.p99Target} />
              </div>
            </div>
          )}

          {/* Approval Latency */}
          {approvalEntries.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: DS.text.muted }}>
                <Clock className="w-3 h-3" /> Pending Approval Latency by Severity
              </div>
              <div>
                {approvalEntries.map(([sev, data]) => (
                  <ApprovalLatencyRow key={sev} severity={sev} data={data} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total SLOs", value: SEED.length, color: DS.text.primary },
          { label: "Healthy", value: counts.healthy, color: "#10b981" },
          { label: "At Risk", value: counts.at_risk, color: GOLD },
          { label: "Breached", value: counts.breached, color: "#ef4444" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-3 text-center" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: DS.text.muted }}>{k.label}</div>
            <div className="text-[22px] font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border" style={{ borderColor: DS.border, background: DS.surface }}>
        <div className="text-[9px] uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: DS.text.muted }}>
          <Flame className="w-3 h-3" style={{ color: "#ef4444" }} />
          Multi-Window Burn Rate Alerting — Google SRE Standard
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
          {[
            { window: "Fast Burn (1h + 5m)", threshold: "14.4×", rationale: "2% budget in 1h", color: "#ef4444" },
            { window: "Fast Burn (6h + 30m)", threshold: "6×", rationale: "5% budget in 6h", color: "#f97316" },
            { window: "Slow Burn (24h + 2h)", threshold: "3×", rationale: "10% budget in 24h", color: GOLD },
            { window: "Slow Burn (3d + 6h)", threshold: "1×", rationale: "10% budget in 3d", color: "#3b82f6" },
          ].map(r => (
            <div key={r.window} className="rounded-lg p-3" style={{ background: `${r.color}06`, border: `1px solid ${r.color}18` }}>
              <div className="font-semibold mb-1" style={{ color: r.color }}>{r.window}</div>
              <div className="text-[11px] font-mono font-bold mb-0.5" style={{ color: DS.text.primary }}>≥ {r.threshold}</div>
              <div className="text-[9px]" style={{ color: DS.text.muted }}>{r.rationale}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {(["all", "healthy", "at_risk", "breached"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-[9px] px-3 py-1 rounded-full capitalize font-medium transition-all"
            style={{
              background: filter === f ? `${f === "all" ? GOLD : f === "healthy" ? "#10b981" : f === "at_risk" ? GOLD : "#ef4444"}15` : "rgba(255,255,255,0.03)",
              color: filter === f ? (f === "all" ? GOLD : f === "healthy" ? "#10b981" : f === "at_risk" ? GOLD : "#ef4444") : DS.text.muted,
              border: `1px solid ${filter === f ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
            }}>
            {f.replace("_", " ")} {f !== "all" && `(${counts[f as SLOStatus] ?? SEED.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(s => <SLODetail key={s.id} slo={s} />)}
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
        <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: DS.text.muted }}>
          Budget Exhaustion Forecast
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SEED.filter(s => s.exhaustionForecast !== null).map(s => {
            const sc = STATUS_CONFIG[s.status];
            const days = s.exhaustionForecast!;
            const pct = Math.min(100, (days / 30) * 100);
            return (
              <div key={s.id} className="p-3 rounded-lg" style={{ background: `${sc.color}06`, border: `1px solid ${sc.color}18` }}>
                <div className="text-[10px] font-semibold mb-1" style={{ color: DS.text.primary }}>{s.name}</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px]" style={{ color: DS.text.muted }}>Exhausts in</span>
                  <span className="text-[13px] font-mono font-bold" style={{ color: days === 0 ? "#ef4444" : days < 3 ? "#ef4444" : days < 7 ? GOLD : "#10b981" }}>
                    {days === 0 ? "DEPLETED" : `${days.toFixed(1)}d`}
                  </span>
                </div>
                {days > 0 && (
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sc.color }} />
                  </div>
                )}
              </div>
            );
          })}
          <div className="p-3 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <div className="text-center">
              <CheckCircle className="w-5 h-5 mx-auto mb-1" style={{ color: "#10b981" }} />
              <div className="text-[10px]" style={{ color: "#10b981" }}>
                {SEED.filter(s => s.exhaustionForecast === null).length} SLOs on track
              </div>
              <div className="text-[9px]" style={{ color: DS.text.muted }}>No exhaustion risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* OTel Correlation ID Propagation Note */}
      <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
        <div className="text-[9px] uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: DS.text.muted }}>
          <TrendingUp className="w-3 h-3" /> Observability — Trace Correlation
        </div>
        <div className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
          All API requests carry <code className="font-mono text-[9px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>X-SZL-Correlation-ID</code> end-to-end,
          propagated across service boundaries from API gateway through Alloy workflow steps and audit log entries.
          Alloy workflow spans are instrumented with <code className="font-mono text-[9px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>alloy.workflow.start</code>,{" "}
          <code className="font-mono text-[9px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>alloy.workflow.step.execute</code>, and{" "}
          <code className="font-mono text-[9px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>alloy.workflow.approval.receive</code> spans
          including actor attribution (<code className="font-mono text-[9px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>szl.actor.type</code>,{" "}
          <code className="font-mono text-[9px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>szl.workspace.id</code>).
        </div>
      </div>
    </div>
  );
}
