import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type RoutingEvent } from "../lib/api";
import { cn, formatCost, formatLatency, timeAgo, formatNumber } from "../lib/utils";
import { AlertTriangle, Loader2, RefreshCw, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CIRCUIT_STATE_CONFIG = {
  closed: { label: "Closed", color: "#22c55e", icon: CheckCircle2, desc: "Healthy" },
  "half-open": { label: "Half-open", color: "#f59e0b", icon: ShieldAlert, desc: "Recovering" },
  open: { label: "Open", color: "#ef4444", icon: XCircle, desc: "Tripped" },
};

function McpHealthPanel() {
  const mcpHealthQuery = useQuery({
    queryKey: ["mcp-gateway-health"],
    queryFn: () => api.getMcpHealth(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const modules = mcpHealthQuery.data?.modules ?? [];

  return (
    <div className="inca-panel mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="text-sm font-medium text-foreground">MCP Gateway — Module Observability</div>
        <div className="flex items-center gap-2">
          {mcpHealthQuery.isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{modules.length} modules</span>
        </div>
      </div>
      {mcpHealthQuery.isLoading ? (
        <div className="flex items-center gap-2 px-4 py-5 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading MCP health…
        </div>
      ) : modules.length === 0 ? (
        <div className="px-4 py-5 text-xs text-muted-foreground">No MCP modules registered.</div>
      ) : (
        <div className="divide-y divide-border/50">
          {modules.map((m) => {
            const circuit = CIRCUIT_STATE_CONFIG[m.circuitState];
            const Icon = circuit.icon;
            return (
              <div key={m.moduleId} className="px-4 py-3 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.healthy ? "#22c55e" : "#ef4444" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground capitalize">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-secondary border border-border">{m.domain}</span>
                    <span className="text-[10px] text-muted-foreground">{m.tools} tools</span>
                  </div>
                  {m.lastError && <div className="text-[10px] text-destructive mt-0.5 truncate">{m.lastError}</div>}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <div className="text-foreground font-mono">{m.callsPerMinute}</div>
                    <div className="text-[10px] text-muted-foreground">calls/min</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("font-mono", m.errorsPerMinute > 0 ? "text-amber-400" : "text-foreground")}>{m.errorsPerMinute}</div>
                    <div className="text-[10px] text-muted-foreground">errors/min</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium" style={{ background: `${circuit.color}10`, borderColor: `${circuit.color}30`, color: circuit.color }}>
                    <Icon className="w-3 h-3" />
                    {circuit.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  huggingface: "#a78bfa",
};

const ROUTE_CLASS_COLORS: Record<string, string> = {
  standard: "#a78bfa",
  "high-risk": "#f43f5e",
  research: "#60a5fa",
  fast: "#22c55e",
  "self-hosted": "#22d3ee",
  classification: "#a78bfa",
  triage: "#60a5fa",
  reasoning: "#22c55e",
  planning: "#f97316",
  tool_calling: "#f43f5e",
  summarization: "#22d3ee",
  extraction: "#facc15",
  background_batch: "#94a3b8",
  vision_understanding: "#ec4899",
};

export function AIGatewayConsole() {
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const eventsQuery = useQuery({
    queryKey: ["inca-routing-events"],
    queryFn: () => api.getRoutingEvents(),
    staleTime: 20000,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const events: RoutingEvent[] = eventsQuery.data?.data ?? [];

  const filtered = events.filter(e => {
    if (filterProvider && e.provider !== filterProvider) return false;
    if (filterClass && e.routeClass !== filterClass) return false;
    return true;
  });

  const totalCost = filtered.reduce((s, e) => s + e.costEstimateUsd, 0);
  const avgLatency = filtered.length > 0 ? filtered.reduce((s, e) => s + e.latencyMs, 0) / filtered.length : 0;
  const fallbackCount = filtered.filter(e => e.usedFallback).length;
  const totalTokens = filtered.reduce((s, e) => s + e.totalTokens, 0);

  const latencyTrend = events.slice(0, 12).reverse().map((e, i) => ({
    t: `T-${12 - i}`,
    latency: Math.round(e.latencyMs),
    cost: parseFloat((e.costEstimateUsd * 1000).toFixed(4)),
  }));

  const providerDist = events.reduce((acc, e) => {
    acc[e.provider] = (acc[e.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const routeClassDist = events.reduce((acc, e) => {
    acc[e.routeClass] = (acc[e.routeClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const providers = Object.keys(providerDist);

  const isLoading = eventsQuery.isLoading;
  const isError = eventsQuery.isError;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            <h1 className="text-xl font-display font-semibold text-foreground">AI Gateway Console</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3.5">
            Agent routing telemetry — derived from logged platform events over the last 72 hours.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {eventsQuery.isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <button
            onClick={() => eventsQuery.refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
              autoRefresh
                ? "bg-green-500/10 border-green-500/25 text-green-400"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", autoRefresh ? "bg-green-500 animate-pulse-dot" : "bg-muted-foreground")} />
            {autoRefresh ? "Auto-refresh" : "Paused"}
          </button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Failed to load routing events. Check API server connection.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading routing telemetry…
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
              <div className="text-xl font-display font-bold text-foreground">{formatCost(totalCost)}</div>
              <div className="text-xs text-muted-foreground">{filtered.length} events</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Avg Latency</div>
              <div className="text-xl font-display font-bold text-foreground">{formatLatency(avgLatency)}</div>
              <div className="text-xs text-muted-foreground">P50 estimate</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Fallback Events</div>
              <div className={cn("text-xl font-display font-bold", fallbackCount > 0 ? "text-amber-400" : "text-foreground")}>{fallbackCount}</div>
              <div className="text-xs text-muted-foreground">{filtered.length > 0 ? ((fallbackCount / filtered.length) * 100).toFixed(1) : 0}% rate</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Tokens</div>
              <div className="text-xl font-display font-bold text-foreground">{formatNumber(totalTokens)}</div>
              <div className="text-xs text-muted-foreground">all providers</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Latency chart */}
            <div className="lg:col-span-2 inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Latency Trend (Recent 12 Events)</div>
              {latencyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={latencyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,14%,15%,1)" />
                    <XAxis dataKey="t" tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(240 16% 8%)", border: "1px solid hsl(240 14% 10%)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(v) => [`${v}ms`, "Latency"]}
                    />
                    <Area type="monotone" dataKey="latency" stroke="#7c3aed" fill="url(#latencyGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-xs text-muted-foreground">No event data yet</div>
              )}
            </div>

            {/* Provider distribution */}
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Provider Split</div>
              {providers.length > 0 ? (
                <div className="space-y-2.5">
                  {providers.map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PROVIDER_COLORS[p] || "#888" }}
                      />
                      <div className="text-xs text-muted-foreground w-20 flex-shrink-0 capitalize">{p}</div>
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: events.length > 0 ? `${(providerDist[p]! / events.length) * 100}%` : "0%",
                            backgroundColor: PROVIDER_COLORS[p] || "#888"
                          }}
                        />
                      </div>
                      <div className="text-xs text-foreground w-8 text-right flex-shrink-0">{providerDist[p]}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No provider data</div>
              )}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-2">Route Classes</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(routeClassDist).slice(0, 6).map(([cls, cnt]) => (
                    <span
                      key={cls}
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: `${ROUTE_CLASS_COLORS[cls] || "#888"}18`, color: ROUTE_CLASS_COLORS[cls] || "#888", border: `1px solid ${ROUTE_CLASS_COLORS[cls] || "#888"}33` }}
                    >
                      {cls}: {cnt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="text-xs text-muted-foreground self-center">Filter:</div>
            {["openai", "anthropic", "gemini", "huggingface"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterProvider(filterProvider === p ? null : p)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  filterProvider === p
                    ? "text-white border"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                )}
                style={filterProvider === p ? { background: `${PROVIDER_COLORS[p]}20`, borderColor: `${PROVIDER_COLORS[p]}40`, color: PROVIDER_COLORS[p] } : {}}
              >
                {p}
              </button>
            ))}
            <div className="w-px h-5 bg-border self-center mx-1" />
            {["standard", "high-risk", "research"].map((cls) => (
              <button
                key={cls}
                onClick={() => setFilterClass(filterClass === cls ? null : cls)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  filterClass === cls
                    ? "text-white border"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                )}
                style={filterClass === cls ? { background: `${ROUTE_CLASS_COLORS[cls]}20`, borderColor: `${ROUTE_CLASS_COLORS[cls]}40`, color: ROUTE_CLASS_COLORS[cls] } : {}}
              >
                {cls}
              </button>
            ))}
            {(filterProvider || filterClass) && (
              <button onClick={() => { setFilterProvider(null); setFilterClass(null); }} className="px-2.5 py-1 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors">
                Clear
              </button>
            )}
          </div>

          {/* MCP Module Health */}
          <McpHealthPanel />

          {/* Event stream */}
          <div className="inca-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-medium text-foreground">Request Stream</div>
              <div className="text-xs text-muted-foreground">{filtered.length} events (last 72h)</div>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Time</th>
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Route Class</th>
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Model</th>
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Provider</th>
                    <th className="px-4 py-2 text-right text-muted-foreground font-medium">Latency</th>
                    <th className="px-4 py-2 text-right text-muted-foreground font-medium">Cost</th>
                    <th className="px-4 py-2 text-right text-muted-foreground font-medium">Tokens</th>
                    <th className="px-4 py-2 text-center text-muted-foreground font-medium">Fallback</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 30).map((evt) => (
                    <tr
                      key={evt.id}
                      className="border-b border-border/30 transition-colors hover:bg-secondary/40"
                    >
                      <td className="px-4 py-2 text-muted-foreground font-mono">{timeAgo(evt.timestamp)}</td>
                      <td className="px-4 py-2">
                        <span
                          className="px-1.5 py-0.5 rounded font-mono"
                          style={{ background: `${ROUTE_CLASS_COLORS[evt.routeClass] || "#888"}18`, color: ROUTE_CLASS_COLORS[evt.routeClass] || "#888" }}
                        >
                          {evt.routeClass}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-foreground truncate max-w-[120px]">{evt.model}</td>
                      <td className="px-4 py-2">
                        <span style={{ color: PROVIDER_COLORS[evt.provider] || "#888" }}>{evt.provider}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{formatLatency(evt.latencyMs)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">{formatCost(evt.costEstimateUsd)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">{formatNumber(evt.totalTokens)}</td>
                      <td className="px-4 py-2 text-center">
                        {evt.usedFallback && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-xs">
                        {events.length === 0 ? "No routing events logged in the last 72 hours." : "No events match the current filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
