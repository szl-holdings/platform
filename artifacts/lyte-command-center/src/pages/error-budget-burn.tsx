import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import { cn } from "@/lib/utils";
import {
  Activity, AlertTriangle, CheckCircle, Clock, TrendingDown, TrendingUp,
  Zap, Eye, Shield, ArrowRight, RefreshCw, Target, Gauge, BarChart3, Wifi, WifiOff
} from "lucide-react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell } from "recharts";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ACCENT = "#d4a054";

const SLOS = [
  {
    id: "api-availability",
    service: "API Gateway",
    slo_name: "Availability",
    target_pct: 99.9,
    current_pct: 99.73,
    window_days: 30,
    budget_minutes: 43.2,
    consumed_minutes: 32.1,
    burn_rate_1h: 14.2,
    burn_rate_6h: 8.7,
    burn_rate_24h: 3.4,
    status: "burning",
    remaining_pct: 25.7,
    alert_threshold: 5,
    incidents: 3,
    color: "#c45a4a",
  },
  {
    id: "checkout-latency",
    service: "Checkout Service",
    slo_name: "Latency p99 < 400ms",
    target_pct: 99.5,
    current_pct: 99.61,
    window_days: 30,
    budget_minutes: 216,
    consumed_minutes: 84.2,
    burn_rate_1h: 2.1,
    burn_rate_6h: 1.8,
    burn_rate_24h: 1.4,
    status: "healthy",
    remaining_pct: 61.0,
    alert_threshold: 20,
    incidents: 1,
    color: "#6b8f71",
  },
  {
    id: "auth-availability",
    service: "Auth Service",
    slo_name: "Availability",
    target_pct: 99.99,
    current_pct: 99.94,
    window_days: 30,
    budget_minutes: 4.3,
    consumed_minutes: 3.7,
    burn_rate_1h: 6.8,
    burn_rate_6h: 4.1,
    burn_rate_24h: 2.2,
    status: "warning",
    remaining_pct: 14.0,
    alert_threshold: 2,
    incidents: 2,
    color: "#c8953c",
  },
  {
    id: "payment-success",
    service: "Payment Processor",
    slo_name: "Success Rate > 99.8%",
    target_pct: 99.8,
    current_pct: 99.84,
    window_days: 30,
    budget_minutes: 86.4,
    consumed_minutes: 12.1,
    burn_rate_1h: 0.4,
    burn_rate_6h: 0.3,
    burn_rate_24h: 0.2,
    status: "healthy",
    remaining_pct: 86.0,
    alert_threshold: 20,
    incidents: 0,
    color: "#6b8f71",
  },
  {
    id: "notification-delivery",
    service: "Notification Worker",
    slo_name: "Delivery Latency < 5min",
    target_pct: 99.5,
    current_pct: 97.12,
    window_days: 30,
    budget_minutes: 216,
    consumed_minutes: 216,
    burn_rate_1h: 0,
    burn_rate_6h: 0,
    burn_rate_24h: 28.4,
    status: "exhausted",
    remaining_pct: 0,
    alert_threshold: 0,
    incidents: 5,
    color: "#ef4444",
  },
];

const BURN_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  day: `D-${30 - i}`,
  api_gateway: Math.max(0, Math.min(100, 80 - i * 2 + Math.sin(i) * 10)),
  auth: Math.max(0, Math.min(100, 95 - i * 4 + Math.cos(i * 0.8) * 8)),
  notification: i < 5 ? Math.max(0, 20 - i * 4) : 0,
}));

const FAST_BURN_DATA = Array.from({ length: 60 }, (_, i) => ({
  min: `${i}m`,
  rate: i < 15 ? 1 + Math.random() * 2 : i < 30 ? 8 + Math.random() * 6 : i < 45 ? 14 + Math.random() * 4 : 3 + Math.random() * 2,
  threshold: 14.4,
}));

const STATUS_CONFIG = {
  healthy: { color: "#6b8f71", label: "On Track", bg: "rgba(107,143,113,0.1)", bd: "rgba(107,143,113,0.2)" },
  warning: { color: "#c8953c", label: "Warning", bg: "rgba(200,149,60,0.1)", bd: "rgba(200,149,60,0.2)" },
  burning: { color: "#c45a4a", label: "Fast Burn", bg: "rgba(196,90,74,0.1)", bd: "rgba(196,90,74,0.2)" },
  exhausted: { color: "#ef4444", label: "Exhausted", bg: "rgba(239,68,68,0.1)", bd: "rgba(239,68,68,0.2)" },
};

function Panel({ children, accent, className = "" }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div className={cn("rounded-md overflow-hidden", className)} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      {accent && <div className="h-px" style={{ background: accent }} />}
      {children}
    </div>
  );
}

function PanelHead({ icon: Icon, title, right, accent }: { icon: React.ElementType; title: string; right?: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: accent ?? TEXT.tertiary }} />
        <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

interface LiveSignal {
  id: string;
  name: string;
  value: string;
  rawValue: number;
  unit: string;
  status: string;
  category: string;
  source: string;
}
interface LiveSignalsResponse {
  data: { signals: LiveSignal[]; fetchedAt: string };
}
interface OpsSummaryResponse {
  data: {
    uptime: string; requestsTotal: number; errorsTotal: number; errorRate: string;
    avgLatencyMs: number; p95LatencyMs: number; fetchedAt: string;
  };
}

export default function ErrorBudgetBurn() {
  const [selectedSlo, setSelectedSlo] = useState(SLOS[0]);

  const { data: liveSignals, isError: isSignalsError } = useQuery<LiveSignalsResponse>({
    queryKey: ["error-budget-live-signals"],
    queryFn: () => apiFetch<LiveSignalsResponse>("/lyte/live/signals"),
    refetchInterval: 15000,
    retry: 1,
  });

  const { data: opsSummary } = useQuery<OpsSummaryResponse>({
    queryKey: ["error-budget-ops-summary"],
    queryFn: () => apiFetch<OpsSummaryResponse>("/lyte/live/operations-summary"),
    refetchInterval: 15000,
    retry: 1,
  });

  const signals = liveSignals?.data?.signals ?? [];
  const apiErrorRateSignal = signals.find(s => s.id === "api-error-rate");
  const apiLatencySignal = signals.find(s => s.id === "api-avg-latency");
  const isLive = !isSignalsError && signals.length > 0;

  const totalBudgetMins = SLOS.reduce((s, x) => s + x.budget_minutes, 0);
  const totalConsumedMins = SLOS.reduce((s, x) => s + x.consumed_minutes, 0);
  const exhaustedCount = SLOS.filter(s => s.status === "exhausted").length;
  const burningCount = SLOS.filter(s => s.status === "burning").length;

  return (
    <div className="p-4 space-y-4" style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4" style={{ color: ACCENT }} />
            Error Budget & Burn Rate
          </h1>
          <p className="text-[10px] mt-0.5" style={{ color: TEXT.tertiary }}>SRE reliability contract tracking — 30-day rolling windows</p>
        </div>
        <div className="flex items-center gap-3">
          {opsSummary?.data && (
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span style={{ color: "rgba(255,255,255,0.4)" }}>API: {opsSummary.data.uptime} up</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>err {opsSummary.data.errorRate}</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>p95 {opsSummary.data.p95LatencyMs?.toFixed(0)}ms</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {isLive ? <Wifi className="w-3 h-3" style={{ color: ACCENT }} /> : <WifiOff className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />}
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isLive ? ACCENT : "rgba(255,255,255,0.2)" }} />
            <span className="text-[10px] font-mono" style={{ color: isLive ? ACCENT : "rgba(255,255,255,0.2)" }}>
              {isLive ? `${signals.length} live signals` : "SLO model active"}
            </span>
          </div>
        </div>
      </div>

      {/* Live API Metrics Strip */}
      {signals.length > 0 && (
        <div className="rounded-lg px-3 py-2.5 flex items-center gap-6 overflow-x-auto" style={{ background: BG.surface, border: `1px solid rgba(212,160,84,0.12)` }}>
          <span className="text-[9px] uppercase tracking-wider font-semibold shrink-0" style={{ color: ACCENT }}>Live API Telemetry</span>
          {signals.slice(0, 8).map(sig => (
            <div key={sig.id} className="shrink-0 flex flex-col">
              <span className="text-[9px]" style={{ color: TEXT.tertiary }}>{sig.name}</span>
              <span className="text-[11px] font-mono font-semibold" style={{
                color: sig.status === "healthy" ? "#6b8f71" : sig.status === "degraded" ? "#c8953c" : TEXT.primary
              }}>{sig.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Budget Consumed", value: `${((totalConsumedMins / totalBudgetMins) * 100).toFixed(0)}%`, sub: `${totalConsumedMins.toFixed(0)} / ${totalBudgetMins.toFixed(0)} min`, color: "#c45a4a" },
          { label: "SLOs on Track", value: `${SLOS.filter(s => s.status === "healthy").length}/${SLOS.length}`, sub: "Services meeting targets", color: "#6b8f71" },
          { label: "Fast Burn Active", value: String(burningCount), sub: "1h burn rate > 14x threshold", color: "#c8953c" },
          { label: "Budget Exhausted", value: String(exhaustedCount), sub: "SLO target already missed", color: "#ef4444" },
        ].map(kpi => (
          <Panel key={kpi.label} accent={kpi.color}>
            <div className="p-3">
              <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: TEXT.tertiary }}>{kpi.label}</p>
              <p className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: TEXT.muted }}>{kpi.sub}</p>
            </div>
          </Panel>
        ))}
      </div>

      {/* SLO list + detail */}
      <div className="grid grid-cols-12 gap-4">
        {/* SLO list */}
        <div className="col-span-5 space-y-2">
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Service Level Objectives</p>
          {SLOS.map(slo => {
            const s = STATUS_CONFIG[slo.status as keyof typeof STATUS_CONFIG];
            const isSelected = selectedSlo.id === slo.id;
            return (
              <button
                key={slo.id}
                onClick={() => setSelectedSlo(slo)}
                className="w-full text-left rounded-md p-3 transition-all"
                style={{
                  background: isSelected ? `${slo.color}08` : BG.surface,
                  border: `1px solid ${isSelected ? `${slo.color}30` : BORDER.subtle}`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{slo.service}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: TEXT.tertiary }}>{slo.slo_name}</p>
                  </div>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: s.color, background: s.bg, border: `1px solid ${s.bd}` }}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] mb-1.5" style={{ color: TEXT.tertiary }}>
                  <span>Budget remaining</span>
                  <span className="font-mono font-bold" style={{ color: slo.remaining_pct <= 5 ? "#ef4444" : slo.remaining_pct <= 20 ? "#c8953c" : "#6b8f71" }}>
                    {slo.remaining_pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, 100 - slo.remaining_pct)}%`,
                      background: slo.remaining_pct <= 5 ? "#ef4444" : slo.remaining_pct <= 20 ? "#c8953c" : "#6b8f71",
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[8px]" style={{ color: TEXT.muted }}>
                  <span>Target: <span style={{ color: TEXT.secondary }}>{slo.target_pct}%</span></span>
                  <span>Current: <span style={{ color: TEXT.secondary }}>{slo.current_pct}%</span></span>
                  <span>{slo.incidents} incident{slo.incidents !== 1 ? "s" : ""}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* SLO detail */}
        <div className="col-span-7 space-y-3">
          <Panel accent={selectedSlo.color}>
            <PanelHead
              icon={Gauge}
              title={`${selectedSlo.service} — ${selectedSlo.slo_name}`}
              accent={selectedSlo.color}
              right={
                <span className="text-[9px] font-mono" style={{ color: STATUS_CONFIG[selectedSlo.status as keyof typeof STATUS_CONFIG].color }}>
                  {STATUS_CONFIG[selectedSlo.status as keyof typeof STATUS_CONFIG].label}
                </span>
              }
            />
            <div className="p-3">
              {/* Burn rate cards */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { window: "1h", rate: selectedSlo.burn_rate_1h, threshold: 14.4, label: "Fast Burn" },
                  { window: "6h", rate: selectedSlo.burn_rate_6h, threshold: 6, label: "Slow Burn" },
                  { window: "24h", rate: selectedSlo.burn_rate_24h, threshold: 3, label: "Slow Burn" },
                ].map(b => {
                  const isFiring = b.rate > b.threshold;
                  return (
                    <div key={b.window} className="rounded p-2.5" style={{ background: BG.elevated, border: `1px solid ${isFiring ? `${selectedSlo.color}30` : BORDER.subtle}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px]" style={{ color: TEXT.tertiary }}>{b.window} burn rate</span>
                        {isFiring && <AlertTriangle className="w-2.5 h-2.5" style={{ color: selectedSlo.color }} />}
                      </div>
                      <p className="text-xl font-bold font-mono" style={{ color: isFiring ? selectedSlo.color : "#6b8f71" }}>{b.rate}x</p>
                      <p className="text-[8px] mt-0.5" style={{ color: TEXT.muted }}>threshold: {b.threshold}x</p>
                    </div>
                  );
                })}
              </div>

              {/* Burn chart */}
              <div>
                <p className="text-[9px] mb-2" style={{ color: TEXT.tertiary }}>1-hour burn rate trend (last 60 minutes)</p>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={FAST_BURN_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="min" tick={{ fontSize: 8, fill: TEXT.tertiary }} interval={9} />
                    <YAxis tick={{ fontSize: 8, fill: TEXT.tertiary }} />
                    <Tooltip contentStyle={{ background: BG.surface, border: `1px solid ${BORDER.muted}`, borderRadius: 6, fontSize: 11 }} />
                    <ReferenceLine y={14.4} stroke={selectedSlo.color} strokeDasharray="4 2" label={{ value: "Fast burn", position: "right", fontSize: 8, fill: selectedSlo.color }} />
                    <Area type="monotone" dataKey="rate" name="Burn rate" stroke={selectedSlo.color} fill={selectedSlo.color} fillOpacity={0.1} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Budget summary */}
              <div className="mt-3 rounded p-2.5" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: TEXT.tertiary }}>Error Budget · 30-day window</p>
                  <span className="text-[9px] font-mono" style={{ color: TEXT.secondary }}>Target: {selectedSlo.target_pct}% availability</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[9px]">
                  <div>
                    <p style={{ color: TEXT.muted }}>Total allowance</p>
                    <p className="font-mono font-bold text-sm mt-0.5" style={{ color: TEXT.secondary }}>{selectedSlo.budget_minutes.toFixed(1)} min</p>
                  </div>
                  <div>
                    <p style={{ color: TEXT.muted }}>Consumed</p>
                    <p className="font-mono font-bold text-sm mt-0.5" style={{ color: selectedSlo.color }}>{selectedSlo.consumed_minutes.toFixed(1)} min</p>
                  </div>
                  <div>
                    <p style={{ color: TEXT.muted }}>Remaining</p>
                    <p className="font-mono font-bold text-sm mt-0.5" style={{ color: selectedSlo.remaining_pct <= 10 ? "#ef4444" : "#6b8f71" }}>
                      {Math.max(0, selectedSlo.budget_minutes - selectedSlo.consumed_minutes).toFixed(1)} min
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (selectedSlo.consumed_minutes / selectedSlo.budget_minutes) * 100)}%`, background: selectedSlo.color }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[8px]" style={{ color: TEXT.muted }}>
                  <span>0 min</span>
                  <span style={{ color: selectedSlo.color }}>
                    {((selectedSlo.consumed_minutes / selectedSlo.budget_minutes) * 100).toFixed(1)}% consumed
                  </span>
                  <span>{selectedSlo.budget_minutes.toFixed(0)} min</span>
                </div>
              </div>

              {/* Alert policy */}
              {selectedSlo.status !== "healthy" && (
                <div className="mt-2 p-2.5 rounded" style={{ background: `${selectedSlo.color}08`, border: `1px solid ${selectedSlo.color}20` }}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: selectedSlo.color }} />
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: selectedSlo.color }}>
                        {selectedSlo.status === "exhausted"
                          ? "SLO target missed — budget exhausted for this window"
                          : selectedSlo.status === "burning"
                          ? "Fast burn alert firing — 1h rate exceeds 14x threshold"
                          : "Budget consumption approaching alert threshold"}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: TEXT.tertiary }}>
                        {selectedSlo.status === "exhausted"
                          ? "This SLO has already failed for the 30-day window. All remaining incidents this window count as SLO violations."
                          : "At current burn rate, remaining budget will be exhausted in approximately " + Math.max(0, Math.round((selectedSlo.budget_minutes - selectedSlo.consumed_minutes) / (selectedSlo.burn_rate_1h * selectedSlo.budget_minutes / 100 / 60))).toString() + " hours."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* 30-day budget history */}
          <Panel>
            <PanelHead icon={BarChart3} title="30-Day Budget Consumption Trend" accent={ACCENT} />
            <div className="p-3">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={BURN_HISTORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fontSize: 8, fill: TEXT.tertiary }} interval={4} />
                  <YAxis tick={{ fontSize: 8, fill: TEXT.tertiary }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: BG.surface, border: `1px solid ${BORDER.muted}`, borderRadius: 6, fontSize: 11 }} />
                  <Area type="monotone" dataKey="api_gateway" name="API Gateway" stroke="#c45a4a" fill="#c45a4a" fillOpacity={0.08} strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="auth" name="Auth Service" stroke="#c8953c" fill="#c8953c" fillOpacity={0.06} strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="notification" name="Notification" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-1 justify-center">
                {[["API Gateway", "#c45a4a"], ["Auth", "#c8953c"], ["Notification", "#ef4444"]].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className="w-2 h-0.5 rounded" style={{ background: color as string }} />
                    <span className="text-[8px]" style={{ color: TEXT.tertiary }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
