import { useState, useEffect } from "react";
import { Activity, Database, Zap, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "/api";

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body.data ?? body;
}

interface RouteBreakdown {
  route: string;
  avgTotal: number;
  avgDb: number;
  avgExternal: number;
  avgSerialization: number;
  count: number;
  p99: number;
}

interface LatencyBreakdown {
  routes: RouteBreakdown[];
  overallP50: number;
  overallP95: number;
  overallP99: number;
  avgDbFraction: number;
  avgExternalFraction: number;
}

interface ExternalCallStats {
  [provider: string]: { count: number; avgMs: number; p99Ms: number };
}

interface ApmSnapshot {
  apm: {
    latencyBreakdown: LatencyBreakdown;
    externalCalls: ExternalCallStats;
  };
  requestCount?: number;
  errorRate?: number;
}

function MetricCard({ label, value, unit, color, icon: Icon }: {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-[11px] text-slate-400">{label}</span>
      </div>
      <div className={cn("font-display font-bold text-xl", color)}>
        {value}{unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function FractionBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-white">{pct.toFixed(1)}%</span>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700", color)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function RouteRow({ r }: { r: RouteBreakdown }) {
  const p99Color = r.p99 > 500 ? "text-red-400" : r.p99 > 200 ? "text-amber-400" : "text-emerald-400";
  const dbPct = r.avgTotal > 0 ? ((r.avgDb / r.avgTotal) * 100).toFixed(0) : "0";
  const extPct = r.avgTotal > 0 ? ((r.avgExternal / r.avgTotal) * 100).toFixed(0) : "0";
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-2 pr-3 text-[11px] font-mono text-slate-300 truncate max-w-[180px]">{r.route}</td>
      <td className="py-2 pr-3 text-center text-[11px] font-mono text-slate-400">{r.count}</td>
      <td className="py-2 pr-3 text-center text-[11px] font-mono text-slate-400">{r.avgTotal.toFixed(0)}ms</td>
      <td className="py-2 pr-3 text-center text-[11px] font-mono text-blue-400/80">{dbPct}%</td>
      <td className="py-2 pr-3 text-center text-[11px] font-mono text-purple-400/80">{extPct}%</td>
      <td className={cn("py-2 text-center text-[11px] font-mono font-semibold", p99Color)}>{r.p99.toFixed(0)}ms</td>
    </tr>
  );
}

export default function ApmInstrumentationPage() {
  const [snapshot, setSnapshot] = useState<ApmSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await apiFetch("/apm/snapshot");
      setSnapshot(data);
      setLastRefresh(new Date());
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const bd = snapshot?.apm?.latencyBreakdown;
  const extCallsMap = snapshot?.apm?.externalCalls ?? {};
  const extCalls = Object.entries(extCallsMap).map(([provider, s]) => ({ provider, ...s }));
  const routes = bd?.routes ?? [];
  const appFraction = bd ? Math.max(0, 100 - (bd.avgDbFraction + bd.avgExternalFraction)) : 0;

  return (
    <div className="max-w-[960px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">APM Instrumentation</h1>
          <p className="text-sm text-slate-400 mt-1">Real latency breakdowns from OpenTelemetry spans — DB query time, external API time, and application time per route</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-slate-600 font-mono">Updated {lastRefresh.toLocaleTimeString()}</span>
          )}
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[11px] text-slate-300 hover:bg-white/10 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Loading APM telemetry...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">Failed to load APM data: {error}</span>
        </div>
      )}

      {!loading && bd && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="Routes Monitored" value={routes.length} icon={Activity} color="text-cyan-400" />
            <MetricCard label="p50 Latency" value={bd.overallP50.toFixed(0)} unit="ms" icon={Clock} color="text-emerald-400" />
            <MetricCard label="p95 Latency" value={bd.overallP95.toFixed(0)} unit="ms" icon={TrendingUp} color={bd.overallP95 > 300 ? "text-amber-400" : "text-emerald-400"} />
            <MetricCard label="p99 Latency" value={bd.overallP99.toFixed(0)} unit="ms" icon={TrendingUp} color={bd.overallP99 > 500 ? "text-red-400" : bd.overallP99 > 200 ? "text-amber-400" : "text-emerald-400"} />
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
            <div className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Time Allocation Breakdown (avg across all instrumented routes)</div>
            <div className="space-y-3">
              <FractionBar label="DB Query Time" pct={bd.avgDbFraction} color="bg-blue-500" />
              <FractionBar label="External API Time" pct={bd.avgExternalFraction} color="bg-purple-500" />
              <FractionBar label="Application + Serialization" pct={appFraction} color="bg-emerald-500" />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5 text-center">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                  <Database className="w-3 h-3" /> DB
                </div>
                <div className="font-mono text-sm text-blue-400">{bd.avgDbFraction.toFixed(1)}%</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                  <Zap className="w-3 h-3" /> External
                </div>
                <div className="font-mono text-sm text-purple-400">{bd.avgExternalFraction.toFixed(1)}%</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                  <Activity className="w-3 h-3" /> App
                </div>
                <div className="font-mono text-sm text-emerald-400">{appFraction.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {routes.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-4">Route Latency Breakdown — Top {Math.min(routes.length, 20)} by avg total</div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-2 text-left text-[10px] text-slate-500 uppercase tracking-wide pr-3">Route</th>
                      <th className="pb-2 text-center text-[10px] text-slate-500 uppercase tracking-wide pr-3">Reqs</th>
                      <th className="pb-2 text-center text-[10px] text-slate-500 uppercase tracking-wide pr-3">Avg</th>
                      <th className="pb-2 text-center text-[10px] text-blue-400/70 uppercase tracking-wide pr-3">DB%</th>
                      <th className="pb-2 text-center text-[10px] text-purple-400/70 uppercase tracking-wide pr-3">Ext%</th>
                      <th className="pb-2 text-center text-[10px] text-slate-500 uppercase tracking-wide">p99</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((r) => (
                      <RouteRow key={r.route} r={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {extCalls.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-4">External API Performance</div>
              <div className="space-y-3">
                {extCalls.map(stat => {
                  const maxAvg = Math.max(...extCalls.map(e => e.avgMs), 1);
                  return (
                    <div key={stat.provider} className="flex items-center gap-4">
                      <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono text-slate-300">{stat.provider}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500">{stat.count} calls</span>
                            <span className="text-slate-400">avg: <span className="text-white font-mono">{stat.avgMs.toFixed(0)}ms</span></span>
                            <span className="text-slate-400">p99: <span className={cn("font-mono", stat.p99Ms > 3000 ? "text-red-400" : stat.p99Ms > 1000 ? "text-amber-400" : "text-emerald-400")}>{stat.p99Ms.toFixed(0)}ms</span></span>
                          </div>
                        </div>
                        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-purple-500/60"
                            style={{ width: `${(stat.avgMs / maxAvg) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {routes.length === 0 && extCalls.length === 0 && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <Database className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <div className="text-sm text-slate-400">No APM spans recorded in the 5-minute window.</div>
              <div className="text-[11px] text-slate-600 mt-1">Navigate other pages to generate traces, then refresh to see live data.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
