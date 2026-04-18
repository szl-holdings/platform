import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { Activity, AlertTriangle, RefreshCw, TrendingUp, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";

interface MetricRow {
  id: number;
  service: string;
  metricName: string;
  metricType: string;
  value: number;
  unit: string;
  anomaly: boolean;
  anomalyScore: number | null;
  recordedAt: string;
}

interface MetricsResponse {
  rows: MetricRow[];
  services: string[];
  metricNames: string[];
  total: number;
  window: string;
}

const WINDOWS = ["1h", "6h", "24h", "7d", "30d"] as const;
const METRIC_TYPE_COLORS: Record<string, string> = {
  latency:      "#4a90b8",
  error_rate:   "#c45a4a",
  throughput:   "#6b8f71",
  queue_depth:  "#d4a054",
  cpu:          "#8b7ac8",
  memory:       "#4a90b8",
  availability: "#22d3ee",
  revenue:      "#c8953c",
  churn_rate:   "#f87171",
  nps:          "#4ade80",
};

const UNIT_LABELS: Record<string, string> = {
  latency: "ms",
  error_rate: "%",
  throughput: "req/s",
  queue_depth: "jobs",
  cpu: "%",
  memory: "%",
  availability: "%",
  revenue: "$",
  churn_rate: "%",
  nps: "pts",
};

function AnomalyBand({ anomalies, allData, dataKey }: { anomalies: MetricRow[]; allData: any[]; dataKey: string }) {
  if (anomalies.length === 0) return null;
  return null;
}

function formatValue(v: number, unit: string) {
  if (unit === "$") return `$${v.toLocaleString()}`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(1);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg border text-xs" style={{ background: "#0c1626", borderColor: "rgba(255,255,255,0.12)", minWidth: 160 }}>
      <p className="font-mono text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "rgba(255,255,255,0.7)" }}>{p.name}:</span>
          <span className="font-mono font-bold text-white">{p.value?.toFixed(2)}</span>
          {p.payload?.anomaly && <span className="text-[9px] px-1 rounded" style={{ color: "#c45a4a", background: "rgba(196,90,74,0.15)" }}>ANOMALY</span>}
        </div>
      ))}
    </div>
  );
};

export default function MetricsExplorer() {
  const [window, setWindow] = useState<string>("24h");
  const [service, setService] = useState<string>("");
  const [metricName, setMetricName] = useState<string>("");
  const [compareService, setCompareService] = useState<string>("");

  const params = new URLSearchParams({ window });
  if (service) params.set("service", service);
  if (metricName) params.set("metricName", metricName);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["metrics", window, service, metricName],
    queryFn: () => apiFetch<MetricsResponse>(`/lyte/metrics?${params}`),
    refetchInterval: 30000,
  });

  const compareParams = new URLSearchParams({ window });
  if (compareService) compareParams.set("service", compareService);
  if (metricName) compareParams.set("metricName", metricName);

  const { data: compareData } = useQuery({
    queryKey: ["metrics-compare", window, compareService, metricName],
    queryFn: () => apiFetch<MetricsResponse>(`/lyte/metrics?${compareParams}`),
    enabled: !!compareService && compareService !== service,
  });

  const rows = data?.rows ?? [];
  const services = data?.services ?? [];
  const metricNames = data?.metricNames ?? [];
  const anomalies = rows.filter(r => r.anomaly);

  const chartData = useMemo(() => {
    const buckets: Record<string, { time: string; value: number; anomaly: boolean }> = {};
    for (const r of rows) {
      const t = new Date(r.recordedAt);
      const key = t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      if (!buckets[key] || r.anomaly) {
        buckets[key] = { time: key, value: r.value, anomaly: r.anomaly };
      }
    }
    const result = Object.values(buckets).sort((a, b) => a.time.localeCompare(b.time));

    if (compareData?.rows && compareService && compareService !== service) {
      const compareBuckets: Record<string, number> = {};
      for (const r of compareData.rows) {
        const t = new Date(r.recordedAt);
        const key = t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        compareBuckets[key] = r.value;
      }
      return result.map(b => ({ ...b, compareValue: compareBuckets[b.time] ?? null }));
    }

    return result;
  }, [rows, compareData, compareService, service]);

  const avgValue = rows.length > 0 ? rows.reduce((s, r) => s + r.value, 0) / rows.length : 0;
  const maxValue = rows.length > 0 ? Math.max(...rows.map(r => r.value)) : 0;
  const minValue = rows.length > 0 ? Math.min(...rows.map(r => r.value)) : 0;
  const unit = rows[0]?.unit ?? "";
  const color = METRIC_TYPE_COLORS[rows[0]?.metricType ?? ""] ?? "#4a90b8";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#d4a054" }}>Lyte · Metrics Explorer</span>
          </div>
          <h1 className="text-xl font-bold text-white">Metrics Explorer</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Select any metric and service, configure time windows, and overlay anomaly bands across your platform.</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {WINDOWS.map(w => (
            <button key={w} onClick={() => setWindow(w)}
              className="px-3 py-1.5 text-[10px] font-mono font-medium transition-all"
              style={{
                background: window === w ? "rgba(212,160,84,0.15)" : "transparent",
                color: window === w ? "#d4a054" : "rgba(255,255,255,0.35)",
                borderLeft: w !== "1h" ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >{w}</button>
          ))}
        </div>

        <select
          value={service}
          onChange={e => setService(e.target.value)}
          className="text-[11px] px-3 py-1.5 rounded-lg border font-mono"
          style={{ background: "#0c1626", borderColor: "rgba(255,255,255,0.1)", color: service ? "white" : "rgba(255,255,255,0.35)" }}
        >
          <option value="">All services</option>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={metricName}
          onChange={e => setMetricName(e.target.value)}
          className="text-[11px] px-3 py-1.5 rounded-lg border font-mono"
          style={{ background: "#0c1626", borderColor: "rgba(255,255,255,0.1)", color: metricName ? "white" : "rgba(255,255,255,0.35)" }}
        >
          <option value="">All metrics</option>
          {metricNames.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {service && (
          <select
            value={compareService}
            onChange={e => setCompareService(e.target.value)}
            className="text-[11px] px-3 py-1.5 rounded-lg border font-mono"
            style={{ background: "#0c1626", borderColor: "rgba(59,130,246,0.3)", color: compareService ? "#60a5fa" : "rgba(255,255,255,0.25)" }}
          >
            <option value="">+ Compare service</option>
            {services.filter(s => s !== service).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-stretch">
          {[
            { label: "Avg", value: formatValue(avgValue, unit), color },
            { label: "Max", value: formatValue(maxValue, unit), color: "#d4a054" },
            { label: "Min", value: formatValue(minValue, unit), color: "rgba(255,255,255,0.5)" },
            { label: "Anomalies", value: anomalies.length.toString(), color: anomalies.length > 0 ? "#c45a4a" : "rgba(255,255,255,0.3)" },
            { label: "Data Points", value: rows.length.toString(), color: "rgba(255,255,255,0.4)" },
          ].map((c, i) => (
            <div key={c.label} className="flex-1 px-4 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="text-lg font-bold font-mono mb-0.5" style={{ color: c.color }}>{c.value}</div>
              <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-[#d4a054] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <AlertTriangle className="w-6 h-6 text-[#c45a4a]" />
            <p className="text-sm text-slate-400">Failed to load metrics.</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Zap className="w-8 h-8" style={{ color: "rgba(212,160,84,0.2)" }} />
            <p className="text-sm text-slate-400">No metric data found for this selection.</p>
            <p className="text-[11px] text-slate-500">Try a different service, metric, or time window.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }} />
              {anomalies.length > 0 && chartData.some(d => (d as any).anomaly) && (
                <ReferenceLine
                  y={avgValue * 1.5}
                  stroke={color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.3}
                  label={{ value: "Anomaly Band", fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                name={service || "All services"}
                stroke={color}
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload?.anomaly) return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#c45a4a" stroke="#c45a4a" strokeOpacity={0.4} strokeWidth={6} />;
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={0} fill="transparent" />;
                }}
                activeDot={{ r: 4, fill: color }}
              />
              {compareService && compareService !== service && (
                <Line
                  type="monotone"
                  dataKey="compareValue"
                  name={compareService}
                  stroke="#4a90b8"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {anomalies.length > 0 && (
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Detected Anomalies ({anomalies.length})</div>
          <div className="space-y-1.5">
            {anomalies.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border" style={{ borderColor: "rgba(196,90,74,0.2)", background: "rgba(196,90,74,0.05)" }}>
                <AlertTriangle className="w-3.5 h-3.5 text-[#c45a4a] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-white font-medium">{a.service}</span>
                  <span className="text-[10px] ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>{a.metricName}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#c45a4a]">{formatValue(a.value, a.unit)} {a.unit}</span>
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {new Date(a.recordedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
