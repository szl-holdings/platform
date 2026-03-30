import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import {
  Brain,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  TrendingUp,
  Play,
  Database,
  Radio,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return `${Math.round(diff / 86400000)}d ago`;
}

function timeUntil(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return "now";
  if (diff < 60000) return `${Math.round(diff / 1000)}s`;
  return `${Math.round(diff / 60000)}m`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface AgentSchedule {
  agentId: string;
  name: string;
  domain: string;
  intervalMs: number;
  enabled: boolean;
  taskDescription: string;
  lastRunAt?: number;
  nextRunAt?: number;
  totalRuns?: number;
  successRuns?: number;
  failedRuns?: number;
  successRate?: number | null;
  avgDurationMs?: number;
  knowledgeEntriesCount?: number;
}

interface AgentRun {
  runId: string;
  agentId: string;
  domain: string;
  startedAt: number;
  completedAt?: number;
  status: "running" | "completed" | "failed";
  summary?: string;
  knowledgeEntryIds: string[];
  eventsPublished: string[];
  error?: string;
  durationMs?: number;
}

interface KnowledgeEntry {
  id: string;
  type: string;
  domain: string;
  sourceAgent: string;
  title: string;
  summary: string;
  confidence: number;
  tags: string[];
  timestamp: number;
  data?: Record<string, unknown>;
}

interface AgentEvent {
  id: string;
  type: string;
  sourceAgent: string;
  sourceDomain: string;
  severity: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

function SeverityDot({ severity }: { severity: string }) {
  const cls =
    severity === "critical" ? "bg-red-500" :
    severity === "high" ? "bg-orange-500" :
    severity === "medium" ? "bg-yellow-500" :
    severity === "info" ? "bg-sky-500" :
    "bg-emerald-500";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${cls}`} />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-2.5 h-2.5" />completed</span>;
  if (status === "failed") return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"><AlertTriangle className="w-2.5 h-2.5" />failed</span>;
  if (status === "running") return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20"><RefreshCw className="w-2.5 h-2.5 animate-spin" />running</span>;
  return <span className="text-[10px] text-muted-foreground">{status}</span>;
}

function AgentCard({ agent, onManualRun, isRunning }: { agent: AgentSchedule; onManualRun: (id: string) => void; isRunning: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const successRate = agent.successRate;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-muted/20 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">{agent.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${agent.enabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>
              {agent.enabled ? "active" : "disabled"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.taskDescription}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onManualRun(agent.agentId)}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Run now
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1 rounded-md hover:bg-accent/10 text-muted-foreground transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-border border-t border-border text-center">
        <div className="px-3 py-2.5">
          <div className="text-xs font-semibold text-foreground">{agent.totalRuns ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Total Runs</div>
        </div>
        <div className="px-3 py-2.5">
          <div className={`text-xs font-semibold ${successRate != null ? (successRate >= 90 ? "text-emerald-400" : successRate >= 70 ? "text-yellow-400" : "text-red-400") : "text-muted-foreground"}`}>
            {successRate != null ? `${successRate}%` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">Success Rate</div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-xs font-semibold text-foreground">{agent.knowledgeEntriesCount ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Knowledge</div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-xs font-semibold text-sky-400">{agent.nextRunAt ? timeUntil(agent.nextRunAt) : "—"}</div>
          <div className="text-[10px] text-muted-foreground">Next Run</div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/5">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Domain: </span>
              <span className="font-medium">{agent.domain}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Interval: </span>
              <span className="font-medium">{Math.round(agent.intervalMs / 60000)}m</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Run: </span>
              <span className="font-medium">{agent.lastRunAt ? timeAgo(agent.lastRunAt) : "Never"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Duration: </span>
              <span className="font-medium">{agent.avgDurationMs ? formatMs(agent.avgDurationMs) : "—"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentOSDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"agents" | "knowledge" | "events" | "runs">("agents");

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{ isRunning: boolean; totalAgents: number; totalRuns: number; agents: AgentSchedule[]; knowledge: { totalEntries?: number; byDomain?: Record<string, number>; byType?: Record<string, number> }; eventBus: { totalPublished?: number; subscriptionCount?: number } }>({
    queryKey: ["agent-os-stats"],
    queryFn: () => apiFetch("/agent-os/agent-stats"),
    refetchInterval: 30000,
  });

  const { data: knowledgeData } = useQuery<{ entries: KnowledgeEntry[]; stats: Record<string, unknown> }>({
    queryKey: ["agent-os-knowledge"],
    queryFn: () => apiFetch("/agent-os/knowledge?limit=30"),
    refetchInterval: 30000,
    enabled: activeTab === "knowledge",
  });

  const { data: eventsData } = useQuery<{ events: AgentEvent[] }>({
    queryKey: ["agent-os-events"],
    queryFn: () => apiFetch("/agent-os/events?limit=30"),
    refetchInterval: 20000,
    enabled: activeTab === "events",
  });

  const { data: runsData } = useQuery<{ runs: AgentRun[] }>({
    queryKey: ["agent-os-runs"],
    queryFn: () => apiFetch("/agent-os/runs?limit=30"),
    refetchInterval: 20000,
    enabled: activeTab === "runs",
  });

  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const manualRunMutation = useMutation({
    mutationFn: (agentId: string) => apiFetch(`/agent-os/run/${agentId}`, { method: "POST" }),
    onMutate: (agentId) => {
      setRunningAgents(prev => new Set([...prev, agentId]));
    },
    onSettled: (_, __, agentId) => {
      setRunningAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["agent-os-stats"] });
      queryClient.invalidateQueries({ queryKey: ["agent-os-runs"] });
      queryClient.invalidateQueries({ queryKey: ["agent-os-knowledge"] });
    },
  });

  const agents = stats?.agents ?? [];
  const knowledgeStats = stats?.knowledge;
  const eventBusStats = stats?.eventBus;
  const entries = knowledgeData?.entries ?? [];
  const events = eventsData?.events ?? [];
  const runs = runsData?.runs ?? [];

  const totalSuccessRuns = agents.reduce((sum, a) => sum + (a.successRuns ?? 0), 0);
  const totalFailedRuns = agents.reduce((sum, a) => sum + (a.failedRuns ?? 0), 0);
  const overallSuccessRate = stats?.totalRuns ? Math.round((totalSuccessRuns / stats.totalRuns) * 100) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Operating System</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Autonomous AI agents running 24/7 across the SZL Holdings ecosystem
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${stats?.isRunning ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>
            <span className={`w-2 h-2 rounded-full ${stats?.isRunning ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
            {stats?.isRunning ? "Scheduler Running" : "Scheduler Stopped"}
          </div>
          <button
            onClick={() => { refetchStats(); queryClient.invalidateQueries({ queryKey: ["agent-os"] }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Agents", value: stats?.totalAgents ?? "—", icon: Brain, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Runs", value: stats?.totalRuns ?? "—", icon: Activity, color: "text-sky-400", bg: "bg-sky-500/10" },
          { label: "Knowledge Entries", value: knowledgeStats?.totalEntries ?? "—", icon: Database, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Events Published", value: eventBusStats?.totalPublished ?? "—", icon: Radio, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400" />Success Rate</div>
          <div className={`text-3xl font-bold ${overallSuccessRate != null ? (overallSuccessRate >= 90 ? "text-emerald-400" : overallSuccessRate >= 70 ? "text-yellow-400" : "text-red-400") : "text-muted-foreground"}`}>
            {overallSuccessRate != null ? `${overallSuccessRate}%` : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{totalSuccessRuns} success / {totalFailedRuns} failed</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Database className="w-3 h-3 text-purple-400" />Knowledge by Domain</div>
          {knowledgeStats?.byDomain && Object.keys(knowledgeStats.byDomain).length > 0 ? (
            <div className="space-y-1.5">
              {Object.entries(knowledgeStats.byDomain).slice(0, 4).map(([domain, count]) => (
                <div key={domain} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{domain}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No data yet</div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Radio className="w-3 h-3 text-amber-400" />Event Bus</div>
          <div className="text-3xl font-bold text-amber-400">{eventBusStats?.totalPublished?.toLocaleString() ?? "0"}</div>
          <div className="text-xs text-muted-foreground mt-1">{eventBusStats?.subscriptionCount ?? 0} active subscriptions</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex border-b border-border">
          {(["agents", "knowledge", "events", "runs"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors capitalize ${activeTab === tab ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab === "agents" && "Agent Schedules"}
              {tab === "knowledge" && "Knowledge Graph"}
              {tab === "events" && "Event Bus"}
              {tab === "runs" && "Run History"}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === "agents" && (
            <div className="space-y-3">
              {statsLoading && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!statsLoading && agents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No agents registered</div>
              )}
              {agents.map(agent => (
                <AgentCard
                  key={agent.agentId}
                  agent={agent}
                  onManualRun={id => manualRunMutation.mutate(id)}
                  isRunning={runningAgents.has(agent.agentId)}
                />
              ))}
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="space-y-2">
              {entries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No knowledge entries yet. Agents will populate this after their first run.
                </div>
              ) : (
                entries.map(entry => {
                  const sev = (entry.data?.severity as string) ?? "";
                  const severityColor =
                    sev === "critical" ? "text-red-400 border-red-500/20 bg-red-500/5" :
                    sev === "high" ? "text-orange-400 border-orange-500/20 bg-orange-500/5" :
                    entry.type === "correlation" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" :
                    "text-sky-400 border-sky-500/20 bg-sky-500/5";
                  return (
                    <div key={entry.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border text-xs ${severityColor}`}>
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        {entry.type === "alert" || entry.type === "anomaly" ? <AlertTriangle className="w-3.5 h-3.5" /> :
                         entry.type === "correlation" ? <Zap className="w-3.5 h-3.5" /> :
                         entry.type === "trend" ? <TrendingUp className="w-3.5 h-3.5" /> :
                         <Brain className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{entry.title}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded-full border bg-current/10 uppercase shrink-0">{entry.domain}</span>
                        </div>
                        <div className="text-[10px] opacity-70 mt-0.5 line-clamp-2">{entry.summary}</div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] opacity-50">
                          <span>{timeAgo(entry.timestamp)}</span>
                          <span>{Math.round(entry.confidence * 100)}% confidence</span>
                          <span>{entry.sourceAgent}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No events published yet.
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/10 text-xs">
                    <SeverityDot severity={event.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono">{event.type}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{event.sourceDomain}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{event.sourceAgent}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground/50 shrink-0">{timeAgo(event.timestamp)}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "runs" && (
            <div className="space-y-2">
              {runs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No agent runs recorded yet.
                </div>
              ) : (
                runs.map(run => (
                  <div key={run.runId} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/10 text-xs">
                    <div className="mt-0.5">
                      {run.status === "completed" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
                       run.status === "failed" ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> :
                       <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{run.agentId.replace("-autonomous", "")}</span>
                        <StatusBadge status={run.status} />
                        <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">{run.domain}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {run.summary || run.error || run.status}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/50">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{timeAgo(run.startedAt)}</span>
                        {run.durationMs && <span>• {formatMs(run.durationMs)}</span>}
                        {run.knowledgeEntryIds.length > 0 && <span>• {run.knowledgeEntryIds.length} entries</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
