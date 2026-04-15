import { MetricTimeSeriesSimulator, type GoldenSignalsSnapshot, type ServiceApmTrace, type DeploymentMarker, type SloStatus } from "@szl-holdings/observability";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { Activity, AlertTriangle, Clock, Gauge, Shield, TrendingDown, TrendingUp, Zap } from "lucide-react";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ACCENT = "#ef4444";

const _sim = new MetricTimeSeriesSimulator(0xc0ffee42);
const _now = Date.now();
const _services = ["firestorm-soc", "alert-engine", "threat-intel", "signal-bus", "escalation-mgr"];

// 60 points at 5-min intervals = 5 hours of data
const INTERVAL_MS = 5 * 60 * 1000;
const POINTS = 60;

const SERVICE_GOLDEN: Record<string, GoldenSignalsSnapshot[]> = {};
for (const svc of _services) {
  SERVICE_GOLDEN[svc] = _sim.generateGoldenSignalsHistory(svc, POINTS, INTERVAL_MS, _now);
}

const SLO_STATUSES: SloStatus[] = _sim.generateSloStatuses(_services);
const DEPLOY_MARKERS: DeploymentMarker[] = _sim.generateDeploymentMarkers("firestorm-soc", 3, _now);
const TRACES: ServiceApmTrace[] = _sim.generateManyTraces("firestorm-soc", 6, _now);

const STATUS_COLORS: Record<string, string> = {
  healthy: "#22c55e",
  at_risk: "#f59e0b",
  burning: "#f97316",
  exhausted: "#ef4444",
};

function Panel({ children, accent, className = "" }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div className={`rounded-md overflow-hidden ${className}`} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
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

function ApdexGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 0.9 ? "#22c55e" : score >= 0.7 ? "#f59e0b" : "#ef4444";
  const rating = score >= 0.9 ? "Satisfied" : score >= 0.7 ? "Tolerating" : "Frustrated";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-14 h-14 rounded-full flex items-center justify-center border-2" style={{ borderColor: color, background: `${color}18` }}>
        <span className="text-base font-bold tabular-nums" style={{ color }}>{score.toFixed(2)}</span>
      </div>
      <span className="text-[9px] font-medium text-center leading-tight w-20" style={{ color: TEXT.tertiary }}>{label}</span>
      <span className="text-[9px]" style={{ color }}>{rating}</span>
    </div>
  );
}

export default function ObservabilityPage() {
  const apdexSummary = _services.map(svc => {
    const hist = SERVICE_GOLDEN[svc]!;
    const latest = hist[hist.length - 1]?.apdex ?? 0.85;
    return { svc: svc.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), score: latest };
  });

  const primaryHistory = SERVICE_GOLDEN[_services[0]!]!;
  const goldenSignals = primaryHistory.map(p => ({
    t: new Date(p.timestamp).toISOString().slice(11, 16),
    throughput: parseFloat(p.throughput.toFixed(1)),
    errorRate: parseFloat(p.errorRate.toFixed(2)),
    latencyP99: parseFloat(p.latencyP99.toFixed(0)),
    saturation: parseFloat(p.saturation.toFixed(1)),
  }));

  const burnRates = SLO_STATUSES.map(s => ({
    service: s.service.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    status: s.status,
    target: s.target,
    current: s.current,
    burn1h: s.burnRate1h,
    burn6h: s.burnRate6h,
    burn24h: s.burnRate24h,
    remaining: parseFloat((100 - s.errorBudgetConsumedPct).toFixed(1)),
    color: STATUS_COLORS[s.status] ?? "#6b8f71",
    sloName: s.sloName,
  }));

  const deployMarkers = DEPLOY_MARKERS.sort((a, b) => b.timestamp - a.timestamp);
  const traces = TRACES;

  return (
    <div className="min-h-screen p-4 space-y-3" style={{ background: BG.page }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-sm font-semibold" style={{ color: TEXT.primary }}>APM · Observability</span>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>PRODUCTION</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>{new Date(_now).toISOString().slice(0, 19)}Z</span>
      </div>

      {/* Apdex Row */}
      <Panel accent={ACCENT}>
        <PanelHead icon={Gauge} title="Apdex Scores — Service Health" accent={ACCENT} />
        <div className="flex items-center justify-around p-4">
          {apdexSummary.map(a => <ApdexGauge key={a.svc} score={a.score} label={a.svc} />)}
        </div>
      </Panel>

      {/* Golden Signals + Deployment Markers */}
      <div className="grid grid-cols-3 gap-3">
        {/* Throughput */}
        <Panel>
          <PanelHead icon={Zap} title="Throughput (req/s)" accent="#3b82f6" />
          <div className="p-3 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={goldenSignals}>
                <defs>
                  <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER.subtle} />
                <XAxis dataKey="t" tick={{ fontSize: 8, fill: TEXT.muted }} interval={9} />
                <YAxis tick={{ fontSize: 8, fill: TEXT.muted }} />
                <Tooltip contentStyle={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, fontSize: 10 }} />
                <Area type="monotone" dataKey="throughput" stroke="#3b82f6" fill="url(#tpGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Error Rate */}
        <Panel>
          <PanelHead icon={AlertTriangle} title="Error Rate (%)" accent="#ef4444" />
          <div className="p-3 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={goldenSignals}>
                <defs>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER.subtle} />
                <XAxis dataKey="t" tick={{ fontSize: 8, fill: TEXT.muted }} interval={9} />
                <YAxis tick={{ fontSize: 8, fill: TEXT.muted }} />
                <Tooltip contentStyle={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, fontSize: 10 }} />
                <Area type="monotone" dataKey="errorRate" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={1.5} dot={false} />
                <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "SLO", fill: "#f59e0b", fontSize: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* p99 Latency */}
        <Panel>
          <PanelHead icon={Clock} title="Latency P99 (ms)" accent="#a78bfa" />
          <div className="p-3 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={goldenSignals}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER.subtle} />
                <XAxis dataKey="t" tick={{ fontSize: 8, fill: TEXT.muted }} interval={9} />
                <YAxis tick={{ fontSize: 8, fill: TEXT.muted }} />
                <Tooltip contentStyle={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, fontSize: 10 }} />
                <Line type="monotone" dataKey="latencyP99" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
                <ReferenceLine y={400} stroke="#f97316" strokeDasharray="4 2" label={{ value: "SLO", fill: "#f97316", fontSize: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* SLO Burn Rates + Transaction Traces */}
      <div className="grid grid-cols-2 gap-3">
        {/* SLO Burn Rates */}
        <Panel>
          <PanelHead icon={Shield} title="SLO Error Budget Burn" accent="#f59e0b" />
          <div className="p-2 space-y-2">
            {burnRates.map(b => (
              <div key={b.service} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] truncate w-28" style={{ color: TEXT.secondary }}>{b.service}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1 rounded" style={{ background: `${b.color}18`, color: b.color }}>{b.status.replace("_", " ")}</span>
                    <span className="text-[10px] tabular-nums" style={{ color: b.color }}>{b.remaining.toFixed(0)}% left</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: BORDER.muted }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, 100 - b.remaining)}%`, background: b.color }} />
                </div>
                <div className="flex gap-3">
                  {[{ label: "1h", v: b.burn1h }, { label: "6h", v: b.burn6h }, { label: "24h", v: b.burn24h }].map(({ label, v }) => (
                    <span key={label} className="text-[9px] tabular-nums" style={{ color: v > 1 ? "#f97316" : TEXT.tertiary }}>{label}: {v.toFixed(1)}x</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Transaction Traces */}
        <Panel>
          <PanelHead icon={TrendingDown} title="Transaction Traces — firestorm-soc" accent="#38bdf8" />
          <div className="p-2 space-y-1.5">
            {traces.map((tr, i) => {
              const maxDur = Math.max(...traces.map(t => t.totalMs));
              const widthPct = (tr.totalMs / maxDur) * 100;
              const statusColor = tr.statusCode >= 500 ? "#ef4444" : tr.statusCode >= 400 ? "#f59e0b" : "#22c55e";
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono truncate w-44" style={{ color: TEXT.primary }}>{tr.method} {tr.route}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] tabular-nums" style={{ color: statusColor }}>{tr.totalMs.toFixed(0)}ms</span>
                      <span className="text-[9px]" style={{ color: TEXT.tertiary }}>{tr.spans.length} spans</span>
                      <span className="text-[9px] font-mono" style={{ color: statusColor }}>{tr.statusCode}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: BORDER.muted }}>
                    <div className="h-full rounded-full" style={{ width: `${widthPct}%`, background: statusColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Deployment Markers + Error Heatmap */}
      <div className="grid grid-cols-2 gap-3">
        {/* Recent Deployments */}
        <Panel>
          <PanelHead icon={TrendingUp} title="Recent Deployments" accent="#8b5cf6" />
          <div className="p-2 space-y-2">
            {deployMarkers.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#8b5cf6" }} />
                <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>{new Date(m.timestamp).toISOString().slice(0, 16).replace("T", " ")}</span>
                <span className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>{m.service}</span>
                <span className="text-[10px] font-mono" style={{ color: "#8b5cf6" }}>{m.version}</span>
                <span className="text-[9px] px-1 rounded ml-auto" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>{m.environment.toUpperCase()}</span>
                <span className="text-[9px]" style={{ color: m.metricShift.errorRateDelta > 0 ? "#ef4444" : "#22c55e" }}>
                  err {m.metricShift.errorRateDelta > 0 ? "+" : ""}{m.metricShift.errorRateDelta.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Per-service error comparison */}
        <Panel>
          <PanelHead icon={AlertTriangle} title="Error Rate — Service Comparison" accent="#f97316" />
          <div className="p-3 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={burnRates.map(b => ({ svc: b.service.split(" ")[0], errRate: parseFloat((b.burn1h * 0.3).toFixed(2)), color: b.color }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER.subtle} />
                <XAxis dataKey="svc" tick={{ fontSize: 8, fill: TEXT.muted }} />
                <YAxis tick={{ fontSize: 8, fill: TEXT.muted }} />
                <Tooltip contentStyle={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, fontSize: 10 }} />
                <Bar dataKey="errRate" radius={[2, 2, 0, 0]}>
                  {burnRates.map((b, i) => (
                    <Cell key={i} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
