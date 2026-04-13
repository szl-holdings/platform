import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, gatewayPerfApi, promptPipelineApi, type RoutingEvent, type GatewayPerfStats, type CacheEntry, type PromptTemplate, type PromptABTest } from "../lib/api";
import { cn, formatCost, formatLatency, timeAgo, formatNumber } from "../lib/utils";
import { AlertTriangle, Loader2, RefreshCw, Database, Zap, BarChart3, Clock, Layers, FlaskConical, Trash2, ChevronDown, ChevronRight, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

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
  "replit-proxy": "#f43f5e",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  normal: "#60a5fa",
  low: "#a78bfa",
  background: "#6b7280",
};

type ConsoleTab = "routing" | "cache" | "queue" | "context" | "prompts" | "prompt-tests";

export function AIGatewayConsole() {
  const [activeTab, setActiveTab] = useState<ConsoleTab>("routing");
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["inca-routing-events"],
    queryFn: () => api.getRoutingEvents(),
    staleTime: 20000,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const perfStatsQuery = useQuery({
    queryKey: ["gateway-perf-stats"],
    queryFn: () => gatewayPerfApi.getStats(),
    staleTime: 15000,
    refetchInterval: autoRefresh ? 20000 : false,
  });

  const cacheEntriesQuery = useQuery({
    queryKey: ["cache-entries"],
    queryFn: () => gatewayPerfApi.getCacheEntries(),
    staleTime: 30000,
    enabled: activeTab === "cache",
  });

  const promptsQuery = useQuery({
    queryKey: ["prompt-templates"],
    queryFn: () => promptPipelineApi.listTemplates(),
    staleTime: 60000,
    enabled: activeTab === "prompts" || activeTab === "prompt-tests",
  });

  const promptTestsQuery = useQuery({
    queryKey: ["prompt-ab-tests"],
    queryFn: () => promptPipelineApi.listABTests(),
    staleTime: 30000,
    enabled: activeTab === "prompt-tests",
  });

  const invalidateDomainMut = useMutation({
    mutationFn: (domain: string) => gatewayPerfApi.invalidateDomain(domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-perf-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cache-entries"] });
    },
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

  const perfStats: GatewayPerfStats | undefined = perfStatsQuery.data;
  const cacheEntries: CacheEntry[] = cacheEntriesQuery.data?.entries ?? [];
  const templates: PromptTemplate[] = promptsQuery.data?.templates ?? [];
  const promptTests: PromptABTest[] = promptTestsQuery.data?.tests ?? [];

  const queueData = perfStats ? Object.entries(PRIORITY_COLORS).map(([priority]) => ({
    priority,
    depth: perfStats.queue.queueByPriority?.[priority] ?? 0,
    processed: perfStats.queue.byPriority?.[priority] ?? 0,
  })) : [];

  const tabs: { id: ConsoleTab; label: string; icon: typeof Database }[] = [
    { id: "routing", label: "Routing", icon: Zap },
    { id: "cache", label: "Cache", icon: Database },
    { id: "queue", label: "Queue", icon: BarChart3 },
    { id: "context", label: "Context", icon: Clock },
    { id: "prompts", label: "Prompt Pipeline", icon: Layers },
    { id: "prompt-tests", label: "Prompt A/B Tests", icon: FlaskConical },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            <h1 className="text-xl font-display font-semibold text-foreground">AI Gateway Console</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3.5">
            Performance & resilience — cache, streaming, context, priority queue, prompt pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(eventsQuery.isFetching || perfStatsQuery.isFetching) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <button
            onClick={() => {
              eventsQuery.refetch();
              perfStatsQuery.refetch();
              queryClient.invalidateQueries({ queryKey: ["cache-entries"] });
              queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
              queryClient.invalidateQueries({ queryKey: ["prompt-ab-tests"] });
            }}
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
            <div className={cn("w-2 h-2 rounded-full", autoRefresh ? "bg-green-500 animate-pulse" : "bg-muted-foreground")} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
        </div>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Routing Cost</div>
          <div className="text-xl font-display font-bold text-foreground">{formatCost(totalCost)}</div>
          <div className="text-xs text-muted-foreground">{filtered.length} events</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Cache Hit Rate</div>
          <div className={cn("text-xl font-display font-bold", (perfStats?.cache.hitRatePct ?? 0) > 30 ? "text-green-400" : "text-foreground")}>
            {perfStats ? `${perfStats.cache.hitRatePct}%` : "—"}
          </div>
          <div className="text-xs text-muted-foreground">{formatCost(perfStats?.cache.estimatedSavingsUsd ?? 0)} saved</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Queue Depth</div>
          <div className={cn("text-xl font-display font-bold", (perfStats?.queue.queueDepth ?? 0) > 5 ? "text-amber-400" : "text-foreground")}>
            {perfStats ? perfStats.queue.queueDepth : "—"}
          </div>
          <div className="text-xs text-muted-foreground">{perfStats?.queue.activeConcurrent ?? 0} active</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Avg Latency</div>
          <div className="text-xl font-display font-bold text-foreground">{formatLatency(avgLatency)}</div>
          <div className="text-xs text-muted-foreground">{fallbackCount} fallbacks</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Prompt Templates</div>
          <div className="text-xl font-display font-bold text-foreground">{templates.length}</div>
          <div className="text-xs text-muted-foreground">{promptTests.filter(t => t.status === "active").length} A/B tests active</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Routing Tab ─────────────────────────────────────────────────── */}
      {activeTab === "routing" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
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
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Provider Split</div>
              {Object.entries(providerDist).length > 0 ? (
                <div className="space-y-2.5">
                  {Object.entries(providerDist).map(([p, cnt]) => (
                    <div key={p} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PROVIDER_COLORS[p] || "#888" }} />
                      <div className="text-xs text-muted-foreground w-20 flex-shrink-0 capitalize">{p}</div>
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: events.length > 0 ? `${(cnt / events.length) * 100}%` : "0%", backgroundColor: PROVIDER_COLORS[p] || "#888" }} />
                      </div>
                      <div className="text-xs text-foreground w-8 text-right">{cnt}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No provider data</div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="text-xs text-muted-foreground self-center">Filter:</div>
            {["openai", "anthropic", "gemini", "huggingface"].map((p) => (
              <button key={p} onClick={() => setFilterProvider(filterProvider === p ? null : p)}
                className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-all", filterProvider === p ? "text-white border" : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent")}
                style={filterProvider === p ? { background: `${PROVIDER_COLORS[p]}20`, borderColor: `${PROVIDER_COLORS[p]}40`, color: PROVIDER_COLORS[p] } : {}}
              >{p}</button>
            ))}
            {(filterProvider || filterClass) && (
              <button onClick={() => { setFilterProvider(null); setFilterClass(null); }} className="px-2.5 py-1 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors">Clear</button>
            )}
          </div>

          {/* MCP Module Health */}
          <McpHealthPanel />

          {/* Event stream */}
          <div className="inca-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-medium text-foreground">Request Stream</div>
              <div className="text-xs text-muted-foreground">{filtered.length} events</div>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Time</th>
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Model</th>
                    <th className="px-4 py-2 text-left text-muted-foreground font-medium">Provider</th>
                    <th className="px-4 py-2 text-right text-muted-foreground font-medium">Latency</th>
                    <th className="px-4 py-2 text-right text-muted-foreground font-medium">Cost</th>
                    <th className="px-4 py-2 text-right text-muted-foreground font-medium">Tokens</th>
                    <th className="px-4 py-2 text-center text-muted-foreground font-medium">Cached</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 30).map((evt) => (
                    <tr key={evt.id} className="border-b border-border/30 hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-2 text-muted-foreground font-mono">{timeAgo(evt.timestamp)}</td>
                      <td className="px-4 py-2 font-mono text-foreground truncate max-w-[120px]">{evt.model}</td>
                      <td className="px-4 py-2"><span style={{ color: PROVIDER_COLORS[evt.provider] || "#888" }}>{evt.provider}</span></td>
                      <td className="px-4 py-2 text-right font-mono">{formatLatency(evt.latencyMs)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">{formatCost(evt.costEstimateUsd)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">{formatNumber(evt.totalTokens)}</td>
                      <td className="px-4 py-2 text-center">
                        {evt.usedFallback && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-xs">No events found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── Cache Tab ───────────────────────────────────────────────────── */}
      {activeTab === "cache" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Hit Rate</div>
              <div className={cn("text-2xl font-display font-bold", (perfStats?.cache.hitRatePct ?? 0) > 40 ? "text-green-400" : "text-foreground")}>
                {perfStats ? `${perfStats.cache.hitRatePct}%` : "—"}
              </div>
              <div className="text-xs text-muted-foreground">{perfStats?.cache.hits ?? 0} hits / {perfStats?.cache.misses ?? 0} misses</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Cost Savings</div>
              <div className="text-2xl font-display font-bold text-green-400">{formatCost(perfStats?.cache.estimatedSavingsUsd ?? 0)}</div>
              <div className="text-xs text-muted-foreground">{formatNumber(perfStats?.cache.savedTokens ?? 0)} tokens saved</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Cache Entries</div>
              <div className="text-2xl font-display font-bold text-foreground">{perfStats?.cache.totalEntries ?? 0}</div>
              <div className="text-xs text-muted-foreground">across all domains</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Similarity Threshold</div>
              <div className="text-2xl font-display font-bold text-foreground">85%</div>
              <div className="text-xs text-muted-foreground">Jaccard similarity</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Domain TTL Configuration</div>
              <div className="space-y-2">
                {perfStats ? Object.entries(perfStats.domainTtls).map(([domain, ttl]) => (
                  <div key={domain} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">{domain}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground font-mono">{Math.round(ttl / 60000)}m TTL</span>
                      <button
                        onClick={() => invalidateDomainMut.mutate(domain)}
                        disabled={invalidateDomainMut.isPending}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                        title={`Invalidate ${domain} cache`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )) : <div className="text-xs text-muted-foreground">Loading...</div>}
              </div>
            </div>

            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Cache Performance</div>
              {perfStats && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Hit Rate</span>
                      <span className="text-foreground">{perfStats.cache.hitRatePct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${perfStats.cache.hitRatePct}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <div className="text-xs text-muted-foreground">Hits</div>
                      <div className="text-sm font-bold text-green-400">{perfStats.cache.hits}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <div className="text-xs text-muted-foreground">Misses</div>
                      <div className="text-sm font-bold text-foreground">{perfStats.cache.misses}</div>
                    </div>
                  </div>
                  <div className="pt-1 text-xs text-muted-foreground">
                    Semantic similarity cache — rephrased questions return cached responses. Cache keys use Jaccard token similarity above 85% threshold.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="inca-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-medium text-foreground">Cache Entries</div>
              <div className="text-xs text-muted-foreground">{cacheEntries.length} entries</div>
            </div>
            {cacheEntriesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-auto max-h-80">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Domain</th>
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Prompt Preview</th>
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Model</th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">Hits</th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">Tokens</th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cacheEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/30 hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">{entry.domain}</span></td>
                        <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{entry.promptText?.slice(0, 60)}…</td>
                        <td className="px-4 py-2 font-mono text-foreground">{entry.model}</td>
                        <td className="px-4 py-2 text-right font-bold text-green-400">{entry.hitCount}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatNumber(entry.usage?.totalTokens ?? 0)}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">{timeAgo(new Date(entry.expiresAt).toISOString())}</td>
                      </tr>
                    ))}
                    {cacheEntries.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No cache entries yet — make some requests to populate the cache</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Queue Tab ───────────────────────────────────────────────────── */}
      {activeTab === "queue" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Queue Depth</div>
              <div className={cn("text-2xl font-display font-bold", (perfStats?.queue.queueDepth ?? 0) > 5 ? "text-amber-400" : "text-green-400")}>
                {perfStats?.queue.queueDepth ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">pending requests</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Active</div>
              <div className="text-2xl font-display font-bold text-foreground">{perfStats?.queue.activeConcurrent ?? 0}</div>
              <div className="text-xs text-muted-foreground">concurrent</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Processed</div>
              <div className="text-2xl font-display font-bold text-foreground">{perfStats?.queue.processed ?? 0}</div>
              <div className="text-xs text-muted-foreground">total requests</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Shed</div>
              <div className={cn("text-2xl font-display font-bold", (perfStats?.queue.shed ?? 0) > 0 ? "text-amber-400" : "text-foreground")}>
                {perfStats?.queue.shed ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">low-priority dropped</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Priority Queue Depth</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={queueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,14%,15%,1)" />
                  <XAxis dataKey="priority" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(240 16% 8%)", border: "1px solid hsl(240 14% 10%)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="depth" name="Queued">
                    {queueData.map((entry, idx) => (
                      <Cell key={idx} fill={PRIORITY_COLORS[entry.priority] || "#888"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Priority Processing</div>
              <div className="space-y-3">
                {Object.entries(PRIORITY_COLORS).map(([priority, color]) => {
                  const processed = perfStats?.queue.byPriority?.[priority] ?? 0;
                  const total = Object.values(perfStats?.queue.byPriority ?? {}).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
                  return (
                    <div key={priority}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="capitalize text-muted-foreground">{priority}</span>
                        </div>
                        <span className="text-foreground">{processed} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                Critical requests (Aegis defense, active copilot) bypass queue. Background work shed under load.
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Context Intelligence Tab ─────────────────────────────────────── */}
      {activeTab === "context" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-3">Model Context Windows</div>
            <div className="space-y-2.5">
              {[
                { model: "gpt-5.2", limit: 128000, provider: "openai" },
                { model: "gpt-4o", limit: 128000, provider: "openai" },
                { model: "gpt-4o-mini", limit: 128000, provider: "openai" },
                { model: "claude-sonnet-4-20250514", limit: 200000, provider: "anthropic" },
                { model: "claude-3-haiku-20240307", limit: 200000, provider: "anthropic" },
                { model: "gemini-2.0-flash", limit: 1048576, provider: "gemini" },
                { model: "Mixtral-8x7B-Instruct", limit: 32768, provider: "huggingface" },
              ].map(({ model, limit, provider }) => (
                <div key={model} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PROVIDER_COLORS[provider] || "#888" }} />
                  <div className="text-xs text-muted-foreground flex-1 truncate">{model}</div>
                  <div className="text-xs font-mono text-foreground">{limit >= 1000000 ? `${(limit / 1000000).toFixed(1)}M` : `${(limit / 1000).toFixed(0)}k`}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-3">Context Overflow Strategies</div>
            <div className="space-y-3">
              {[
                { strategy: "upgrade", label: "Model Upgrade", desc: "Automatically route to a larger-context model (e.g. gpt-4o-mini → gpt-5.2). Applied first when a larger model can handle the load.", color: "#22c55e" },
                { strategy: "summarize", label: "Message Summarization", desc: "Compress older conversation turns into a rolling summary injected as a system message. Preserves recent context, summarizes history.", color: "#60a5fa" },
                { strategy: "truncate", label: "Priority Truncation", desc: "Drop oldest non-system messages when conversation is short or no larger model is available. Always preserves system prompt and last 6 turns.", color: "#f97316" },
              ].map(s => (
                <div key={s.strategy} className="p-3 rounded-lg border border-border bg-secondary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-medium text-foreground">{s.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              ))}
              <div className="p-3 rounded-lg border border-border/50 bg-secondary/10 text-xs text-muted-foreground">
                Context utilization % is tracked per request in telemetry. Overflow handling triggers at 90% of the model's context limit.
              </div>
            </div>
          </div>

          <div className="inca-panel p-4 lg:col-span-2">
            <div className="text-sm font-medium text-foreground mb-3">Streaming Gateway</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Streaming Mode", value: "SSE", sub: "Server-sent events", color: "#22c55e" },
                { label: "Provider Support", value: "4/5", sub: "OpenAI, Anthropic, Gemini, HuggingFace", color: "#60a5fa" },
                { label: "Fallback", value: "Buffered", sub: "Providers without streaming support", color: "#f97316" },
                { label: "Chunk Size", value: "3 tokens", sub: "Words per SSE event", color: "#a78bfa" },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg border border-border bg-secondary/20">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-lg border border-border/50 bg-secondary/10 text-xs text-muted-foreground">
              Streaming endpoint: <code className="font-mono text-primary bg-primary/10 px-1 rounded">/gateway-perf/infer/stream</code> — yields SSE tokens with time-to-first-token tracked. Cache hits stream from memory instantly.
            </div>
          </div>
        </div>
      )}

      {/* ─── Prompts Tab ──────────────────────────────────────────────────── */}
      {activeTab === "prompts" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Templates</div>
              <div className="text-xl font-display font-bold text-foreground">{templates.length}</div>
              <div className="text-xs text-muted-foreground">{templates.filter(t => t.status === "active").length} active</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Domains</div>
              <div className="text-xl font-display font-bold text-foreground">{new Set(templates.map(t => t.domain)).size}</div>
              <div className="text-xs text-muted-foreground">with templates</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Active A/B Tests</div>
              <div className="text-xl font-display font-bold text-foreground">{promptTests.filter(t => t.status === "active").length}</div>
              <div className="text-xs text-muted-foreground">prompt experiments</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Max Version</div>
              <div className="text-xl font-display font-bold text-foreground">
                {templates.length > 0 ? Math.max(...templates.map(t => t.version)) : 0}
              </div>
              <div className="text-xs text-muted-foreground">highest version seen</div>
            </div>
          </div>

          {promptsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {templates.map(template => (
                <div key={template.id} className="inca-panel overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setExpandedPrompt(expandedPrompt === template.id ? null : template.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedPrompt === template.id ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-foreground">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.domain} · {template.taskType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", template.status === "active" ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground")}>
                        {template.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-secondary text-muted-foreground">v{template.version}</span>
                    </div>
                  </button>

                  {expandedPrompt === template.id && (
                    <div className="border-t border-border px-4 pb-4 pt-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">System Prompt</div>
                          <pre className="text-xs text-foreground bg-secondary/30 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">{template.systemPrompt || "(empty)"}</pre>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">User Template</div>
                          <pre className="text-xs text-foreground bg-secondary/30 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">{template.userPromptTemplate || "(empty)"}</pre>
                        </div>
                      </div>
                      {template.variables.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Variables</div>
                          <div className="flex flex-wrap gap-2">
                            {template.variables.map(v => (
                              <span key={v.name} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono">
                                {`{{${v.name}}}`}
                                {v.required && <span className="ml-1 text-red-400">*</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                        <span>Updated {timeAgo(template.updatedAt)}</span>
                        <span>·</span>
                        <span>Template ID: <code className="font-mono">{template.id}</code></span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {templates.length === 0 && (
                <div className="inca-panel p-8 text-center text-xs text-muted-foreground">
                  No prompt templates yet. Use <code className="font-mono text-primary">POST /prompt-pipeline/templates</code> to create your first template.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── Prompt A/B Tests Tab ─────────────────────────────────────────── */}
      {activeTab === "prompt-tests" && (
        <>
          <div className="inca-panel overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-medium text-foreground">Prompt A/B Tests</div>
              <div className="text-xs text-muted-foreground">{promptTests.length} total</div>
            </div>
            {promptTestsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Name</th>
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Template</th>
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Versions</th>
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Metric</th>
                      <th className="px-4 py-2 text-left text-muted-foreground font-medium">Status</th>
                      <th className="px-4 py-2 text-right text-muted-foreground font-medium">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promptTests.map(test => (
                      <tr key={test.testId} className="border-b border-border/30 hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-2 text-foreground font-medium">{test.name}</td>
                        <td className="px-4 py-2 font-mono text-muted-foreground">{test.templateId.slice(0, 12)}…</td>
                        <td className="px-4 py-2">
                          <span className="font-mono text-primary">v{test.versionA}</span>
                          <span className="text-muted-foreground mx-1">vs</span>
                          <span className="font-mono text-amber-400">v{test.versionB}</span>
                        </td>
                        <td className="px-4 py-2 capitalize text-muted-foreground">{test.metric}</td>
                        <td className="px-4 py-2">
                          <span className={cn("px-1.5 py-0.5 rounded text-xs", test.status === "active" ? "bg-green-500/10 text-green-400" : test.status === "completed" ? "bg-blue-500/10 text-blue-400" : "bg-secondary text-muted-foreground")}>
                            {test.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {test.results?.winner ? (
                            <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium", test.results.winner === "A" ? "bg-primary/10 text-primary" : test.results.winner === "B" ? "bg-amber-500/10 text-amber-400" : "bg-secondary text-muted-foreground")}>
                              {test.results.winner === "tie" ? "Tie" : `v${test.results.winner === "A" ? test.versionA : test.versionB} wins`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {promptTests.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No prompt A/B tests yet. Use <code className="font-mono text-primary">POST /prompt-pipeline/ab-tests</code> to start an experiment.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-3">How Prompt A/B Testing Works</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[
                { step: "1", label: "Version Templates", desc: "Create multiple versions of a prompt template with different system prompts, few-shot examples, or instruction styles." },
                { step: "2", label: "Create A/B Test", desc: "Define which two versions to compare, set traffic weights (e.g. 50/50), and choose a metric: quality score, latency, or engagement." },
                { step: "3", label: "Track & Decide", desc: "Each resolved render records quality outcomes. When confidence is high enough, the winning version is declared and can be promoted." },
              ].map(s => (
                <div key={s.step} className="p-3 rounded-lg border border-border bg-secondary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">{s.step}</div>
                    <span className="text-xs font-medium text-foreground">{s.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
