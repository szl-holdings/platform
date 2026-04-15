import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import {
  Activity, AlertTriangle, Gauge, TrendingUp, TrendingDown,
  Clock, Server, Zap, BarChart3, CheckCircle, XCircle,
  RefreshCw, GitCommit, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ReferenceLine, BarChart, Bar,
  ScatterChart, Scatter, Cell,
} from "recharts";
import { MetricTimeSeriesSimulator } from "@szl-holdings/observability";
import type { GoldenSignalsSnapshot, ServiceApmTrace, DeploymentMarker, ErrorHeatmapCell } from "@szl-holdings/observability";

const sim = new MetricTimeSeriesSimulator(0xc0ffee42);
const NOW = Date.now();

const SERVICES = ["api-gateway", "auth-service", "payment-service", "checkout-api", "inventory-api", "notification-worker"];

const goldenSignalsByService: Record<string, GoldenSignalsSnapshot[]> = Object.fromEntries(
  SERVICES.map(svc => [svc, sim.generateGoldenSignalsHistory(svc, 60, 60_000, NOW)])
);

const deploymentMarkers: Record<string, DeploymentMarker[]> = Object.fromEntries(
  SERVICES.map(svc => [svc, sim.generateDeploymentMarkers(svc, 2, NOW)])
);

const errorHeatmap = sim.generateErrorHeatmap(SERVICES);

const allTraces: ServiceApmTrace[] = SERVICES.flatMap(svc =>
  sim.generateManyTraces(svc, 12, NOW)
);

const sloStatuses = sim.generateSloStatuses(SERVICES);

function apdexToLabel(score: number): { label: string; color: string } {
  if (score >= 0.94) return { label: "Excellent", color: "text-emerald-400" };
  if (score >= 0.85) return { label: "Good", color: "text-green-400" };
  if (score >= 0.70) return { label: "Fair", color: "text-amber-400" };
  if (score >= 0.50) return { label: "Poor", color: "text-orange-400" };
  return { label: "Unacceptable", color: "text-red-400" };
}

function formatMs(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms.toFixed(0)}ms`;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SPAN_COLORS: Record<string, string> = {
  middleware: "bg-slate-500",
  auth: "bg-blue-500",
  db: "bg-purple-500",
  external: "bg-cyan-500",
  render: "bg-emerald-500",
  cache: "bg-yellow-500",
  queue: "bg-orange-500",
};

function TraceWaterfall({ trace }: { trace: ServiceApmTrace }) {
  const [open, setOpen] = useState(false);
  const isError = trace.statusCode >= 400;
  const totalMs = trace.totalMs || 1;

  return (
    <div className={`rounded-lg border ${isError ? "border-red-500/20" : "border-border"} p-3 space-y-2`}>
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isError ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
          {trace.statusCode}
        </span>
        <span className="text-xs font-mono text-muted-foreground">{trace.method}</span>
        <span className="text-xs font-medium text-foreground flex-1 truncate">{trace.route}</span>
        <span className="text-xs text-muted-foreground">{trace.service}</span>
        <span className={`text-xs font-mono font-bold ${trace.totalMs > 500 ? "text-orange-400" : trace.totalMs > 200 ? "text-amber-400" : "text-emerald-400"}`}>
          {formatMs(trace.totalMs)}
        </span>
        <span className="text-xs text-muted-foreground">{timeAgo(trace.timestamp)}</span>
        {open ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </div>
      {open && (
        <div className="pt-2 space-y-1.5 border-t border-border">
          <div className="relative h-4">
            {trace.spans.map((span, i) => (
              <div
                key={i}
                className={`absolute h-3 rounded-sm opacity-80 ${SPAN_COLORS[span.type] ?? "bg-slate-500"}`}
                style={{
                  left: `${(span.startOffset / totalMs) * 100}%`,
                  width: `${Math.max(0.5, (span.durationMs / totalMs) * 100)}%`,
                  top: 0,
                }}
                title={`${span.name}: ${formatMs(span.durationMs)}`}
              />
            ))}
          </div>
          <div className="space-y-1">
            {trace.spans.map((span, i) => (
              <div key={i} className="flex items-center gap-3 text-[10px]">
                <div className={`w-2 h-2 rounded-sm shrink-0 ${SPAN_COLORS[span.type] ?? "bg-slate-500"}`} />
                <span className="font-mono text-foreground w-36 truncate">{span.name}</span>
                <span className="text-muted-foreground capitalize">{span.type}</span>
                <span className={`ml-auto font-mono ${span.durationMs > 100 ? "text-amber-400" : "text-muted-foreground"}`}>
                  {formatMs(span.durationMs)}
                </span>
                {span.detail && <span className="text-muted-foreground max-w-[200px] truncate">{span.detail}</span>}
                {span.error && <span className="text-red-400">{span.error}</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <span className="text-[9px] text-muted-foreground">v{trace.deployVersion}</span>
            {trace.userId && <span className="text-[9px] text-muted-foreground">User: {trace.userId}</span>}
            <span className="text-[9px] font-mono text-muted-foreground">Trace: {trace.traceId}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ApdexGauge({ score, service }: { score: number; service: string }) {
  const { label, color } = apdexToLabel(score);
  const angle = -135 + (score * 270);

  return (
    <div className="text-center">
      <div className="relative w-20 h-12 mx-auto mb-1">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke={score >= 0.94 ? "#10b981" : score >= 0.85 ? "#22c55e" : score >= 0.70 ? "#f59e0b" : score >= 0.50 ? "#f97316" : "#ef4444"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${score * 125.6} 125.6`}
          />
          <text x="50" y="52" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">{score.toFixed(2)}</text>
        </svg>
      </div>
      <p className="text-[10px] text-muted-foreground truncate">{service.replace("-", "\u2011")}</p>
      <p className={`text-[10px] font-medium ${color}`}>{label}</p>
    </div>
  );
}

export default function ObservabilityPage() {
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedTab, setSelectedTab] = useState<"golden" | "traces" | "heatmap" | "deployments">("golden");

  const signals = goldenSignalsByService[selectedService] ?? [];
  const deploys = deploymentMarkers[selectedService] ?? [];
  const serviceTraces = allTraces.filter(t => t.service === selectedService);

  const latestSnapshot = signals[signals.length - 1];
  const apdexByService: Record<string, number> = Object.fromEntries(
    SERVICES.map(svc => {
      const snaps = goldenSignalsByService[svc] ?? [];
      const latest = snaps[snaps.length - 1];
      return [svc, latest?.apdex ?? 0.85];
    })
  );

  const chartData = signals.map(s => ({
    t: new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    p50: s.latencyP50,
    p95: s.latencyP95,
    p99: s.latencyP99,
    throughput: s.throughput,
    errorRate: s.errorRate,
    saturation: s.saturation,
    apdex: s.apdex,
  }));

  const deployMarkerTimes = deploys.map(d =>
    new Date(d.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          APM Observability — New Relic Style
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transaction traces, golden signals, Apdex scores, deployment markers, and SLO burn rates
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {latestSnapshot ? [
          { label: "Latency P95", value: formatMs(latestSnapshot.latencyP95), color: latestSnapshot.latencyP95 > 500 ? "text-orange-400" : "text-emerald-400" },
          { label: "Throughput", value: `${latestSnapshot.throughput.toFixed(0)} req/s`, color: "text-cyan-400" },
          { label: "Error Rate", value: `${latestSnapshot.errorRate.toFixed(2)}%`, color: latestSnapshot.errorRate > 2 ? "text-red-400" : "text-emerald-400" },
          { label: "Saturation", value: `${latestSnapshot.saturation.toFixed(0)}%`, color: latestSnapshot.saturation > 85 ? "text-orange-400" : "text-slate-300" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        )) : null}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Apdex Score by Service — Current Window
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {SERVICES.map(svc => (
            <button
              key={svc}
              onClick={() => setSelectedService(svc)}
              className={`rounded-lg p-2 transition-all ${selectedService === svc ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}
            >
              <ApdexGauge score={apdexByService[svc] ?? 0.85} service={svc} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Service:</span>
        {SERVICES.map(svc => (
          <button
            key={svc}
            onClick={() => setSelectedService(svc)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${selectedService === svc ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {svc}
          </button>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["golden", "traces", "heatmap", "deployments"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
              selectedTab === tab ? "bg-card border border-b-card border-border text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "golden" ? "Golden Signals" : tab === "traces" ? "Transaction Traces" : tab === "heatmap" ? "Error Heatmap" : "Deployments"}
          </button>
        ))}
      </div>

      {selectedTab === "golden" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Latency Percentiles — {selectedService} (1h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={9} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => `${v}ms`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number, name: string) => [`${v.toFixed(0)}ms`, name]}
                  />
                  {deployMarkerTimes.map((t, i) => (
                    <ReferenceLine key={i} x={t} stroke="#6366f1" strokeDasharray="4 2" label={{ value: "deploy", fill: "#6366f1", fontSize: 9 }} />
                  ))}
                  <Line type="monotone" dataKey="p50" stroke="#6b8f71" dot={false} strokeWidth={1.5} name="P50" />
                  <Line type="monotone" dataKey="p95" stroke="#c8953c" dot={false} strokeWidth={2} name="P95" />
                  <Line type="monotone" dataKey="p99" stroke="#c45a4a" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="P99" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Throughput (req/s)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#94a3b8" }} interval={14} />
                    <YAxis tick={{ fontSize: 8, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} />
                    {deployMarkerTimes.map((t, i) => (
                      <ReferenceLine key={i} x={t} stroke="#6366f1" strokeDasharray="3 1" />
                    ))}
                    <Area type="monotone" dataKey="throughput" stroke="#4a90b8" fill="#4a90b8" fillOpacity={0.15} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Error Rate (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#94a3b8" }} interval={14} />
                    <YAxis tick={{ fontSize: 8, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} />
                    <ReferenceLine y={2} stroke="#c45a4a" strokeDasharray="3 1" />
                    <Area type="monotone" dataKey="errorRate" stroke="#c45a4a" fill="#c45a4a" fillOpacity={0.15} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Saturation (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#94a3b8" }} interval={14} />
                    <YAxis tick={{ fontSize: 8, fill: "#94a3b8" }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} />
                    <ReferenceLine y={80} stroke="#c8953c" strokeDasharray="3 1" />
                    <Area type="monotone" dataKey="saturation" stroke="#8b7ac8" fill="#8b7ac8" fillOpacity={0.15} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Apdex History — {selectedService}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={9} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} domain={[0, 1]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [v.toFixed(3), "Apdex"]} />
                  <ReferenceLine y={0.94} stroke="#10b981" strokeDasharray="3 1" label={{ value: "Excellent (0.94)", fill: "#10b981", fontSize: 9, position: "right" }} />
                  <ReferenceLine y={0.70} stroke="#f59e0b" strokeDasharray="3 1" label={{ value: "Fair (0.70)", fill: "#f59e0b", fontSize: 9, position: "right" }} />
                  {deployMarkerTimes.map((t, i) => (
                    <ReferenceLine key={i} x={t} stroke="#6366f1" strokeDasharray="4 2" />
                  ))}
                  <Area type="monotone" dataKey="apdex" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "traces" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{serviceTraces.length} traces — {selectedService}</span>
            <span>·</span>
            <span>Click any trace to expand the waterfall breakdown</span>
          </div>
          <div className="flex flex-wrap gap-3 mb-2">
            {[
              { label: "Total", value: serviceTraces.length, color: "text-foreground" },
              { label: "Errors", value: serviceTraces.filter(t => t.statusCode >= 400).length, color: "text-red-400" },
              {
                label: "Slow (>500ms)",
                value: serviceTraces.filter(t => t.totalMs > 500).length,
                color: "text-amber-400",
              },
              {
                label: "Avg Latency",
                value: formatMs(serviceTraces.reduce((s, t) => s + t.totalMs, 0) / (serviceTraces.length || 1)),
                color: "text-cyan-400",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-card border border-border rounded-lg px-3 py-2 text-center">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          {serviceTraces
            .sort((a, b) => b.totalMs - a.totalMs)
            .map(trace => (
              <TraceWaterfall key={trace.traceId} trace={trace} />
            ))}
        </div>
      )}

      {selectedTab === "heatmap" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {SERVICES.map(svc => {
              const cells = errorHeatmap.filter(c => c.service === svc);
              return (
                <div key={svc} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{svc}</span>
                    <span className="text-xs text-muted-foreground">{cells.length} endpoints monitored</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cells.map(cell => (
                      <div
                        key={cell.endpoint}
                        className={`rounded-lg px-3 py-2 border ${
                          cell.severity === "critical" ? "bg-red-500/15 border-red-500/25" :
                          cell.severity === "high" ? "bg-orange-500/15 border-orange-500/25" :
                          cell.severity === "medium" ? "bg-amber-500/15 border-amber-500/25" :
                          "bg-muted/30 border-border"
                        }`}
                      >
                        <p className="text-[10px] font-mono text-foreground">{cell.endpoint}</p>
                        <p className={`text-xs font-bold mt-0.5 ${
                          cell.severity === "critical" ? "text-red-400" :
                          cell.severity === "high" ? "text-orange-400" :
                          cell.severity === "medium" ? "text-amber-400" : "text-muted-foreground"
                        }`}>
                          {cell.errorRate.toFixed(1)}% err · {cell.errorCount} events
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTab === "deployments" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {SERVICES.flatMap(svc =>
              deploymentMarkers[svc]?.map(d => ({ ...d, _service: svc })) ?? []
            ).sort((a, b) => b.timestamp - a.timestamp).map(d => (
              <div key={d.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <GitCommit className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono text-sm text-foreground">{d.version}</span>
                      <span className="text-xs text-muted-foreground">{d.service}</span>
                      <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-500/20">
                        {d.environment}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{timeAgo(d.timestamp)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Deployed by: <span className="text-foreground">{d.triggeredBy}</span></p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className={d.metricShift.latencyDelta < 0 ? "text-emerald-400" : "text-red-400"}>
                        {d.metricShift.latencyDelta > 0 ? "+" : ""}{d.metricShift.latencyDelta.toFixed(0)}ms latency
                      </span>
                      <span className={d.metricShift.errorRateDelta < 0 ? "text-emerald-400" : "text-red-400"}>
                        {d.metricShift.errorRateDelta > 0 ? "+" : ""}{d.metricShift.errorRateDelta.toFixed(2)}% error rate
                      </span>
                      <span className={d.metricShift.throughputDelta > 0 ? "text-emerald-400" : "text-amber-400"}>
                        {d.metricShift.throughputDelta > 0 ? "+" : ""}{d.metricShift.throughputDelta.toFixed(0)} req/s throughput
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">SLO Status — All Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sloStatuses.map(slo => (
            <div
              key={slo.service}
              className={`rounded-xl border p-4 ${
                slo.status === "exhausted" ? "border-red-500/30" :
                slo.status === "burning" ? "border-orange-500/20" :
                slo.status === "at_risk" ? "border-amber-500/20" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium">{slo.service}</span>
                  <span className="text-xs text-muted-foreground ml-2">{slo.sloName} · {slo.target}%</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize ${
                    slo.status === "exhausted" ? "text-red-400 border-red-500/20" :
                    slo.status === "burning" ? "text-orange-400 border-orange-500/20" :
                    slo.status === "at_risk" ? "text-amber-400 border-amber-500/20" :
                    "text-emerald-400 border-emerald-500/20"
                  }`}
                >
                  {slo.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">{slo.errorBudgetConsumedPct.toFixed(1)}%</p>
                  <p>Budget used</p>
                </div>
                <div>
                  <p className={`font-medium ${slo.burnRate1h > 1.5 ? "text-red-400" : "text-foreground"}`}>
                    {slo.burnRate1h.toFixed(2)}x
                  </p>
                  <p>1h burn rate</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{slo.burnRate24h.toFixed(2)}x</p>
                  <p>24h burn rate</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    slo.errorBudgetConsumedPct >= 100 ? "bg-red-500" :
                    slo.errorBudgetConsumedPct >= 80 ? "bg-orange-500" :
                    slo.errorBudgetConsumedPct >= 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, slo.errorBudgetConsumedPct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
