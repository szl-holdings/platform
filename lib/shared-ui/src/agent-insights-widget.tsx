import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, AlertTriangle, TrendingUp, Zap, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export interface KnowledgeEntry {
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

export interface AgentRun {
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

interface AgentFeedResponse {
  domain: string;
  feed: {
    domainFindings: KnowledgeEntry[];
    crossDomainCorrelations: KnowledgeEntry[];
    recentAgentRuns: AgentRun[];
    globalAlerts: KnowledgeEntry[];
  };
  stats: {
    findingsCount: number;
    correlationsCount: number;
    eventsCount: number;
  };
  lastUpdated: string;
}

interface AgentInsightsWidgetProps {
  domain: string;
  apiBase?: string;
  accentColor?: string;
  className?: string;
  compact?: boolean;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return `${Math.round(diff / 86400000)}d ago`;
}

function getSeverityColor(entry: KnowledgeEntry): string {
  const severity = (entry.data?.severity as string) ?? "";
  if (severity === "critical") return "text-red-400 bg-red-500/10 border-red-500/20";
  if (severity === "high") return "text-orange-400 bg-orange-500/10 border-orange-500/20";
  if (severity === "medium") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  if (entry.type === "alert") return "text-orange-400 bg-orange-500/10 border-orange-500/20";
  if (entry.type === "correlation") return "text-purple-400 bg-purple-500/10 border-purple-500/20";
  if (entry.type === "anomaly") return "text-red-400 bg-red-500/10 border-red-500/20";
  return "text-sky-400 bg-sky-500/10 border-sky-500/20";
}

function EntryTypeIcon({ entry }: { entry: KnowledgeEntry }) {
  const severity = (entry.data?.severity as string) ?? "";
  if (severity === "critical" || severity === "high" || entry.type === "alert" || entry.type === "anomaly") {
    return <AlertTriangle className="w-3 h-3 shrink-0" />;
  }
  if (entry.type === "correlation") return <Zap className="w-3 h-3 shrink-0" />;
  if (entry.type === "trend") return <TrendingUp className="w-3 h-3 shrink-0" />;
  return <Brain className="w-3 h-3 shrink-0" />;
}

function RunStatusIcon({ run }: { run: AgentRun }) {
  if (run.status === "completed") return <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />;
  if (run.status === "failed") return <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />;
  return <RefreshCw className="w-3 h-3 text-sky-400 animate-spin shrink-0" />;
}

export function AgentInsightsWidget({
  domain,
  apiBase = "/api",
  accentColor = "#3b82f6",
  className = "",
  compact = false,
}: AgentInsightsWidgetProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [activeTab, setActiveTab] = useState<"findings" | "correlations" | "runs">("findings");

  const { data: feed, isLoading, error, refetch, dataUpdatedAt } = useQuery<AgentFeedResponse>({
    queryKey: ["agent-insights-feed", domain],
    queryFn: async () => {
      const resp = await fetch(`${apiBase}/agent-os/feed/${domain}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2,
  });

  if (error && !feed) {
    return null;
  }

  const findings = feed?.feed.domainFindings ?? [];
  const correlations = feed?.feed.crossDomainCorrelations ?? [];
  const runs = feed?.feed.recentAgentRuns ?? [];
  const globalAlerts = feed?.feed.globalAlerts ?? [];

  const alertCount = findings.filter(f => {
    const sev = (f.data?.severity as string) ?? "";
    return sev === "critical" || sev === "high" || f.type === "alert";
  }).length + globalAlerts.filter(a => {
    const sev = (a.data?.severity as string) ?? "";
    return sev === "critical" || sev === "high";
  }).length;

  const lastRunAt = runs[0]?.startedAt;

  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden ${className}`}
      style={{ borderColor: `${accentColor}20` }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(e => !e)}
        onKeyDown={e => e.key === "Enter" && setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}15` }}
          >
            <Brain className="w-3.5 h-3.5" style={{ color: accentColor }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold leading-tight">Autonomous Intelligence</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              {isLoading ? (
                <span>Scanning...</span>
              ) : lastRunAt ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Last scan {timeAgo(lastRunAt)}
                </>
              ) : (
                <span>Agent OS active</span>
              )}
            </div>
          </div>
          {alertCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/20">
              {alertCount} alert{alertCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); refetch(); }}
            className="p-1 rounded-md hover:bg-accent/10 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground/50" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/50" />}
        </div>
      </div>

      {expanded && (
        <div>
          <div className="flex border-t" style={{ borderColor: `${accentColor}15` }}>
            {(["findings", "correlations", "runs"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 px-3 py-2 text-[11px] font-medium transition-colors"
                style={activeTab === tab ? { color: accentColor, borderBottom: `2px solid ${accentColor}`, background: `${accentColor}08` } : { color: "var(--muted-foreground)", borderBottom: "2px solid transparent" }}
              >
                {tab === "findings" && `Findings${findings.length > 0 ? ` (${findings.length})` : ""}`}
                {tab === "correlations" && `Cross-Domain${correlations.length > 0 ? ` (${correlations.length})` : ""}`}
                {tab === "runs" && `Activity${runs.length > 0 ? ` (${runs.length})` : ""}`}
              </button>
            ))}
          </div>

          <div className="px-3 py-2 max-h-72 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">Fetching intelligence...</span>
              </div>
            )}

            {!isLoading && activeTab === "findings" && (
              <div className="space-y-1.5">
                {findings.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No findings yet. Agents are scanning...
                  </div>
                ) : (
                  findings.map(entry => (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-xs ${getSeverityColor(entry)}`}
                    >
                      <EntryTypeIcon entry={entry} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{entry.title}</div>
                        <div className="text-[10px] opacity-70 mt-0.5 line-clamp-2">{entry.summary}</div>
                        <div className="flex items-center gap-2 mt-1 opacity-50">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeAgo(entry.timestamp)}</span>
                          {entry.confidence && (
                            <span className="ml-1">{Math.round(entry.confidence * 100)}% confidence</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {globalAlerts.length > 0 && (
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 pt-2 pb-1">Cross-System Alerts</div>
                    {globalAlerts.slice(0, 2).map(entry => (
                      <div
                        key={entry.id}
                        className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-xs mt-1.5 ${getSeverityColor(entry)}`}
                      >
                        <EntryTypeIcon entry={entry} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] px-1 py-0.5 rounded bg-current/10 uppercase font-bold opacity-60">{entry.domain}</span>
                            <span className="font-medium truncate">{entry.title}</span>
                          </div>
                          <div className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{entry.summary}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isLoading && activeTab === "correlations" && (
              <div className="space-y-1.5">
                {correlations.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No cross-domain correlations detected yet.
                  </div>
                ) : (
                  correlations.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-2 px-2.5 py-2 rounded-lg border text-xs text-purple-400 bg-purple-500/10 border-purple-500/20"
                    >
                      <Zap className="w-3 h-3 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{entry.title}</div>
                        <div className="text-[10px] opacity-70 mt-0.5 line-clamp-2">{entry.summary}</div>
                        {entry.tags.filter(t => t !== "correlation" && t !== "cross-domain").length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.tags.filter(t => t !== "correlation" && t !== "cross-domain").slice(0, 4).map(t => (
                              <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-purple-500/15 border border-purple-500/20 uppercase font-medium">{t}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 opacity-50">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeAgo(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!isLoading && activeTab === "runs" && (
              <div className="space-y-1.5">
                {runs.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No agent runs recorded yet.
                  </div>
                ) : (
                  runs.map(run => (
                    <div
                      key={run.runId}
                      className="flex items-start gap-2 px-2.5 py-2 rounded-lg border text-xs border-border bg-muted/20"
                    >
                      <RunStatusIcon run={run} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground/80 truncate">{run.agentId.replace("-autonomous", "")}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {run.summary || (run.status === "failed" ? `Error: ${run.error}` : run.status)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/50">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeAgo(run.startedAt)}</span>
                          {run.durationMs && <span>• {(run.durationMs / 1000).toFixed(1)}s</span>}
                          {run.knowledgeEntryIds.length > 0 && <span>• {run.knowledgeEntryIds.length} findings</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {dataUpdatedAt > 0 && (
            <div className="px-4 py-2 border-t text-[10px] text-muted-foreground/40 flex items-center justify-between" style={{ borderColor: `${accentColor}10` }}>
              <span>Updated {timeAgo(dataUpdatedAt)}</span>
              <span>{findings.length + correlations.length} intelligence entries</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AgentInsightsWidget;
