import { type Page } from "../App";
import { useQuery } from "@tanstack/react-query";
import { api, type AgentDef, type RoutingEvent, type BenchmarkEntry } from "../lib/api";
import { cn, formatNumber, formatCost, formatLatency } from "../lib/utils";
import {
  Brain, Zap, Server, BarChart3, ChevronRight,
  Clock, DollarSign, AlertTriangle, Loader2, Users, GitBranch, MessageSquare, Link2
} from "lucide-react";

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  huggingface: "#a78bfa",
  "self-hosted": "#22d3ee",
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  huggingface: "HuggingFace",
  "self-hosted": "Self-Hosted",
};

function KpiCard({ label, value, sub, icon: Icon, accent = false }: { label: string; value: string; sub?: string; icon: React.ComponentType<{className?:string}>; accent?: boolean }) {
  return (
    <div className={cn("kpi-tile p-4 rounded-lg", accent && "border-primary/40")}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", accent ? "bg-primary/10" : "bg-secondary")}>
          <Icon className={cn("w-3.5 h-3.5", accent ? "text-primary" : "text-muted-foreground")} />
        </div>
      </div>
      <div className="text-2xl font-display font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const agentsQuery = useQuery({
    queryKey: ["inca-agents"],
    queryFn: () => api.getAgentRegistry(),
    staleTime: 60000,
  });
  const eventsQuery = useQuery({
    queryKey: ["inca-routing-events"],
    queryFn: () => api.getRoutingEvents(),
    staleTime: 30000,
  });
  const benchmarksQuery = useQuery({
    queryKey: ["inca-benchmarks"],
    queryFn: () => api.getModelBenchmarks(),
    staleTime: 120000,
  });

  const agents: AgentDef[] = agentsQuery.data?.data ?? [];
  const events: RoutingEvent[] = eventsQuery.data?.data ?? [];
  const benchmarks: BenchmarkEntry[] = benchmarksQuery.data?.data ?? [];

  const totalCost = events.reduce((s, e) => s + e.costEstimateUsd, 0);
  const avgLatency = events.length > 0 ? events.reduce((s, e) => s + e.latencyMs, 0) / events.length : 0;
  const fallbackRate = events.length > 0 ? events.filter(e => e.usedFallback).length / events.length : 0;
  const totalTokens = events.reduce((s, e) => s + e.totalTokens, 0);

  const providerDist = agents.reduce((acc, a) => {
    acc[a.preferredProvider] = (acc[a.preferredProvider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const loading = agentsQuery.isLoading || eventsQuery.isLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">AI Command Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Real-time overview of your AI infrastructure. All systems nominal.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Loading infrastructure data...
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Active Agents" value={agents.length > 0 ? String(agents.length) : "—"} sub="Nuro Mesh online" icon={Brain} accent />
        <KpiCard label="Routing Events" value={events.length > 0 ? formatNumber(events.length) : "—"} sub="Last 72 hours" icon={Zap} />
        <KpiCard label="Avg Latency" value={avgLatency > 0 ? formatLatency(avgLatency) : "—"} sub="P50 across all routes" icon={Clock} />
        <KpiCard label="Total Cost" value={totalCost > 0 ? formatCost(totalCost) : "—"} sub="Estimated last 72h" icon={DollarSign} />
      </div>

      {/* Orchestration summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => onNavigate("crew-builder")}
          className="kpi-tile p-4 rounded-lg text-left hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Crews</div>
            <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-foreground">3</div>
          <div className="text-xs text-muted-foreground mt-1">2 active · 1 paused</div>
        </button>
        <button
          onClick={() => onNavigate("workflow-forge")}
          className="kpi-tile p-4 rounded-lg text-left hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Workflows</div>
            <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-foreground">7</div>
          <div className="text-xs text-muted-foreground mt-1">4 running · 3 idle</div>
        </button>
        <button
          onClick={() => onNavigate("consensus-chamber")}
          className="kpi-tile p-4 rounded-lg text-left hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Consensus Sessions</div>
            <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-foreground">2</div>
          <div className="text-xs text-muted-foreground mt-1">1 pending verdict</div>
        </button>
        <button
          onClick={() => onNavigate("protocol-bridge")}
          className="kpi-tile p-4 rounded-lg text-left hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Protocol Health</div>
            <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-foreground"><span className="text-green-400">13</span><span className="text-sm text-muted-foreground">/15</span></div>
          <div className="text-xs text-muted-foreground mt-1">MCP tools connected</div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent Roster */}
        <div className="lg:col-span-1">
          <div className="inca-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-foreground">Nuro Mesh Agents</div>
              <button
                onClick={() => onNavigate("nuro-mesh")}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {agentsQuery.isError && (
              <div className="text-xs text-muted-foreground text-center py-4">
                <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                Could not load agents
              </div>
            )}
            <div className="space-y-2">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2.5 py-1.5 border-b border-border/50 last:border-0">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-primary/8 border border-primary/15 flex-shrink-0">
                    <Brain className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">{agent.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{agent.preferredModel}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: PROVIDER_COLORS[agent.preferredProvider] || "#888" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent routing events */}
          <div className="inca-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-foreground">Recent Routing Events</div>
              <button
                onClick={() => onNavigate("gateway")}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                Full view <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {eventsQuery.isError && (
              <div className="text-xs text-muted-foreground text-center py-4">
                <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                Could not load routing events
              </div>
            )}
            <div className="space-y-1.5">
              {events.slice(0, 6).map((evt) => (
                <div key={evt.id} className="routing-flow px-3 py-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-foreground">{evt.routeClass}</span>
                      {evt.usedFallback && (
                        <span className="badge-warning text-xs px-1.5 py-0 rounded-sm">fallback</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{evt.model}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono text-foreground">{formatLatency(evt.latencyMs)}</div>
                    <div className="text-xs text-muted-foreground">{formatCost(evt.costEstimateUsd)}</div>
                  </div>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PROVIDER_COLORS[evt.provider] || "#888" }}
                  />
                </div>
              ))}
              {events.length === 0 && !eventsQuery.isLoading && !eventsQuery.isError && (
                <div className="text-xs text-muted-foreground text-center py-4">No routing events found</div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="inca-panel p-3 text-center">
              <div className="text-lg font-display font-bold text-foreground">{totalTokens > 0 ? formatNumber(totalTokens) : "—"}</div>
              <div className="text-xs text-muted-foreground">Total Tokens</div>
            </div>
            <div className="inca-panel p-3 text-center">
              <div className="text-lg font-display font-bold text-foreground">{events.length > 0 ? `${(fallbackRate * 100).toFixed(1)}%` : "—"}</div>
              <div className="text-xs text-muted-foreground">Fallback Rate</div>
            </div>
            <div className="inca-panel p-3 text-center">
              <div className="text-lg font-display font-bold text-foreground">{benchmarks.length > 0 ? benchmarks.length : "—"}</div>
              <div className="text-xs text-muted-foreground">Benchmarked Models</div>
            </div>
          </div>

          {/* Provider distribution */}
          {Object.keys(providerDist).length > 0 && (
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Provider Distribution (Nuro Mesh)</div>
              <div className="space-y-2">
                {Object.entries(providerDist).map(([provider, count]) => (
                  <div key={provider} className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PROVIDER_COLORS[provider] || "#888" }}
                    />
                    <div className="text-xs text-muted-foreground w-28 flex-shrink-0">{PROVIDER_LABELS[provider] || provider}</div>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(count / agents.length) * 100}%`, backgroundColor: PROVIDER_COLORS[provider] || "#888" }}
                      />
                    </div>
                    <div className="text-xs text-foreground w-12 text-right flex-shrink-0">{count} agent{count > 1 ? "s" : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {[
          { page: "intelligence" as Page, label: "Model Intelligence", sub: "Scout HuggingFace + arXiv", icon: Telescope },
          { page: "deployment" as Page, label: "Deployment Runway", sub: "Self-hosted readiness calculator", icon: Server },
          { page: "observatory" as Page, label: "LLMOps Observatory", sub: "Cost trends + governance audit", icon: BarChart3 },
        ].map(({ page, label, sub, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className="inca-panel p-3 text-left flex items-center gap-3 hover:inca-panel-active transition-all group"
          >
            <div className="w-8 h-8 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{label}</div>
              <div className="text-xs text-muted-foreground truncate">{sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Telescope(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="6" r="1"/><path d="M20.2 8.5 22 5l-5.3-1.8-1.8 3.5"/><path d="m11.2 5.2 6 16.4"/><path d="m3.4 14.2 6.1-3.1a1 1 0 0 0 .4-1.4L8.1 7.5a1 1 0 0 0-1.4-.4L0 10.2"/><path d="m4 14 3.5 6"/>
    </svg>
  );
}
