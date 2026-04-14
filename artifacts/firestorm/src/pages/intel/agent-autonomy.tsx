import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Brain, Network, Zap, Activity, CheckCircle, AlertTriangle, XCircle,
  ArrowRight, ChevronDown, ChevronUp, RefreshCw, Database, Plug,
  TrendingUp, TrendingDown, Minus, Shield, Bot, Link2, BookOpen,
  BarChart3, Clock, Play, Eye, Cpu, Globe, Star
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL ?? "/firestorm/";
const API = BASE.replace(/\/$/, "") + "/../api-server/api";

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${API}${path}`, { credentials: "include", ...opts });
  if (!r.ok) throw new Error(`API ${path} failed: ${r.status}`);
  return r.json();
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType;
  color: string; trend?: "up" | "down" | "stable";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400";
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && <TrendIcon className={cn("w-4 h-4", trendColor)} />}
      </div>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

function AgentStatusBadge({ availability }: { availability: string }) {
  const map: Record<string, { label: string; color: string }> = {
    online: { label: "Online", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    degraded: { label: "Degraded", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    offline: { label: "Offline", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const style = map[availability] ?? map.offline!;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", style.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", availability === "online" ? "bg-emerald-400 animate-pulse" : availability === "degraded" ? "bg-yellow-400" : "bg-red-400")} />
      {style.label}
    </span>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  if (trend === "improving") return <span className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />Improving</span>;
  if (trend === "declining") return <span className="text-xs text-red-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Declining</span>;
  return <span className="text-xs text-zinc-400 flex items-center gap-1"><Minus className="w-3 h-3" />Stable</span>;
}

function AgentCard({ agent }: { agent: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const perf = agent.performance as Record<string, unknown> | null;
  const card = agent as Record<string, unknown>;
  const capabilities = (card.capabilities as Array<{ name: string; description: string; costEstimate: string }>) ?? [];
  const skills = (agent.skillUsage as { invocations: number; skills: string[] }) ?? { invocations: 0, skills: [] };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <Bot className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{card.agentName as string}</span>
            <AgentStatusBadge availability={card.availability as string} />
            {perf?.flaggedForReview && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">⚠ Flagged</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500 capitalize">{card.domain as string}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{card.preferredModel as string}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          {perf && (
            <div>
              <div className="text-sm font-bold text-white">{Math.round((perf.accuracyScore as number) * 100)}%</div>
              <div className="text-xs text-zinc-500">accuracy</div>
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-white">{skills.invocations}</div>
            <div className="text-xs text-zinc-500">skill runs</div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-zinc-400 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {perf && (
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Performance</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Decisions", value: perf.totalDecisions as number },
                  { label: "Accepted", value: perf.acceptedDecisions as number },
                  { label: "Rejected", value: perf.rejectedDecisions as number },
                  { label: "Overridden", value: perf.overriddenDecisions as number },
                ].map(stat => (
                  <div key={stat.label} className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-zinc-500">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <TrendBadge trend={perf.confidenceTrend as string} />
                <span className="text-xs text-zinc-500">
                  Avg confidence: {Math.round((perf.avgConfidence as number) * 100)}% |
                  Calibration bias: {Math.round((perf.calibrationBias as number) * 100)}%
                </span>
              </div>
              {perf.reviewReason && (
                <div className="mt-2 text-xs text-yellow-400 bg-yellow-500/10 rounded px-2 py-1 border border-yellow-500/20">
                  ⚠ {perf.reviewReason as string}
                </div>
              )}
            </div>
          )}

          {capabilities.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Capabilities ({capabilities.length})</div>
              <div className="space-y-1">
                {capabilities.map(cap => (
                  <div key={cap.name} className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="text-zinc-300 font-medium">{cap.name.replace(/_/g, " ")}</span>
                    <span className="text-zinc-500">— {cap.description}</span>
                    <span className={cn("ml-auto px-1.5 py-0.5 rounded text-xs", cap.costEstimate === "high" ? "bg-red-500/20 text-red-400" : cap.costEstimate === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-emerald-500/20 text-emerald-400")}>
                      {cap.costEstimate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills.skills.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Active Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {skills.skills.map((s: string) => (
                  <span key={s} className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    {s.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Agent Card</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-zinc-500">Trust Level: <span className="text-white">{card.trustLevel as string}</span></div>
              <div className="text-zinc-500">Version: <span className="text-white">{card.version as string}</span></div>
              <div className="text-zinc-500">Provider: <span className="text-white">{card.preferredProvider as string}</span></div>
              <div className="text-zinc-500">Delegations: <span className="text-white">{(card.metadata as Record<string, unknown>)?.totalDelegations as number ?? 0}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DelegationChain({ delegation }: { delegation: Record<string, unknown> }) {
  const statusColors: Record<string, string> = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    running: "text-yellow-400",
    pending: "text-zinc-400",
  };
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-zinc-800/40 rounded-lg text-xs">
      <span className="text-zinc-400">{delegation.fromAgentId as string}</span>
      <ArrowRight className="w-3 h-3 text-zinc-500" />
      <span className="text-white font-medium">{delegation.toAgentId as string}</span>
      <span className="mx-2 text-zinc-700">|</span>
      <span className={statusColors[delegation.status as string] ?? "text-zinc-400"}>{delegation.status as string}</span>
      {delegation.result && (
        <>
          <span className="text-zinc-700 mx-1">|</span>
          <span className="text-zinc-400">conf: {(delegation.result as Record<string, unknown>).confidence as number}%</span>
          <span className="text-zinc-400 ml-1">{(delegation.result as Record<string, unknown>).latencyMs as number}ms</span>
        </>
      )}
      {delegation.error && <span className="text-red-400 ml-1 truncate max-w-xs">{delegation.error as string}</span>}
    </div>
  );
}

function ConnectorCard({ connector }: { connector: Record<string, unknown> }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-lg">
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", connector.configured ? "bg-emerald-400" : "bg-zinc-600")} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{connector.displayName as string}</div>
        <div className="text-xs text-zinc-500">{connector.category as string} · {connector.toolCount as number} tools</div>
      </div>
      <span className={cn("text-xs px-2 py-0.5 rounded-full border", connector.configured
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        : "bg-zinc-700/50 text-zinc-400 border-zinc-700")}>
        {connector.configured ? "Active" : "Unconfigured"}
      </span>
    </div>
  );
}

function SkillRow({ skill }: { skill: Record<string, unknown> }) {
  const categoryColors: Record<string, string> = {
    analysis: "bg-blue-500/20 text-blue-400",
    synthesis: "bg-purple-500/20 text-purple-400",
    generation: "bg-emerald-500/20 text-emerald-400",
    research: "bg-yellow-500/20 text-yellow-400",
    monitoring: "bg-red-500/20 text-red-400",
    validation: "bg-indigo-500/20 text-indigo-400",
    orchestration: "bg-pink-500/20 text-pink-400",
    extraction: "bg-cyan-500/20 text-cyan-400",
  };
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">{skill.name as string}</span>
          <span className={cn("text-xs px-1.5 py-0.5 rounded", categoryColors[skill.category as string] ?? "bg-zinc-700 text-zinc-400")}>
            {skill.category as string}
          </span>
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">{skill.description as string}</div>
      </div>
      {skill.chainable && (
        <span className="text-xs text-indigo-400 flex items-center gap-1">
          <Link2 className="w-3 h-3" />chainable
        </span>
      )}
      <span className="text-xs text-zinc-500">~{skill.estimatedTokens as number} tokens</span>
    </div>
  );
}

type Tab = "overview" | "agents" | "delegations" | "skills" | "connectors" | "rag" | "performance";

export default function AgentAutonomyDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [, navigate] = useLocation();

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ["agent-autonomy-overview"],
    queryFn: () => apiFetch("/agent-autonomy/overview"),
    refetchInterval: 30000,
  });

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["agent-autonomy-agents"],
    queryFn: () => apiFetch("/agent-autonomy/agents"),
    enabled: tab === "agents",
  });

  const { data: delegationsData, isLoading: delegationsLoading } = useQuery({
    queryKey: ["agent-autonomy-delegations"],
    queryFn: () => apiFetch("/agent-autonomy/delegations"),
    enabled: tab === "delegations",
    refetchInterval: 15000,
  });

  const { data: skillsData, isLoading: skillsLoading } = useQuery({
    queryKey: ["agent-autonomy-skills"],
    queryFn: () => apiFetch("/agent-autonomy/skills"),
    enabled: tab === "skills",
  });

  const { data: connectorsData, isLoading: connectorsLoading } = useQuery({
    queryKey: ["agent-autonomy-connectors"],
    queryFn: () => apiFetch("/agent-autonomy/connectors"),
    enabled: tab === "connectors",
  });

  const { data: ragData, isLoading: ragLoading } = useQuery({
    queryKey: ["agent-autonomy-rag"],
    queryFn: () => apiFetch("/agent-autonomy/rag"),
    enabled: tab === "rag",
  });

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ["agent-autonomy-perf"],
    queryFn: () => apiFetch("/agent-autonomy/performance"),
    enabled: tab === "performance",
  });

  const ingestMutation = useMutation({
    mutationFn: () => apiFetch("/agent-autonomy/rag/ingest", { method: "POST" }),
  });

  const overviewData = overview?.data ?? {};
  const health = overviewData.systemHealth ?? {};
  const delStats = overviewData.delegationStats ?? {};
  const skillStats = overviewData.skillStats ?? {};
  const connStats = overviewData.connectorStats ?? {};
  const ragStats = overviewData.ragStats ?? {};
  const perfSummary = overviewData.performanceSummary ?? {};

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "agents", label: "Agents", icon: Bot },
    { id: "delegations", label: "A2A Delegations", icon: Network },
    { id: "skills", label: "Skill Registry", icon: Zap },
    { id: "connectors", label: "Tool Connectors", icon: Plug },
    { id: "rag", label: "Knowledge RAG", icon: BookOpen },
    { id: "performance", label: "Self-Improvement", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Agent Autonomy Dashboard</h1>
              <p className="text-xs text-zinc-400">A2A Protocol · RAG Knowledge · Dynamic Skills · Self-Improvement · Tool Connectors</p>
            </div>
          </div>
          <button
            onClick={() => refetchOverview()}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        <div className="flex gap-1 mt-4 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {tab === "overview" && (
          <>
            {overviewLoading ? (
              <div className="flex items-center justify-center h-40 text-zinc-500">Loading...</div>
            ) : (
              <>
                <div>
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">System Health</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard label="Active Agents" value={health.activeAgents ?? 0} sub={`of ${health.totalAgents ?? 0} total`} icon={Bot} color="bg-emerald-500/20" trend="stable" />
                    <StatCard label="A2A Delegations" value={delStats.totalHistorical ?? 0} sub={`${delStats.completedCount ?? 0} completed`} icon={Network} color="bg-indigo-500/20" />
                    <StatCard label="Skill Invocations" value={skillStats.totalInvocations ?? 0} sub={`${skillStats.totalSkills ?? 0} skills registered`} icon={Zap} color="bg-yellow-500/20" />
                    <StatCard label="Tool Connectors" value={connStats.configuredConnectors ?? 0} sub={`of ${connStats.totalConnectors ?? 0} registered`} icon={Plug} color="bg-purple-500/20" />
                    <StatCard label="RAG Documents" value={ragStats.totalDocuments ?? 0} sub="knowledge base entries" icon={BookOpen} color="bg-cyan-500/20" />
                    <StatCard label="Avg Accuracy" value={perfSummary.avgAccuracy != null ? `${perfSummary.avgAccuracy}%` : "—"} sub={`${perfSummary.flaggedCount ?? 0} agents flagged`} icon={TrendingUp} color="bg-rose-500/20" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">A2A Delegation Activity</div>
                    <div className="space-y-2">
                      {[
                        { label: "Active Delegations", value: delStats.active ?? 0, icon: Activity, color: "text-yellow-400" },
                        { label: "Completed", value: delStats.completedCount ?? 0, icon: CheckCircle, color: "text-emerald-400" },
                        { label: "Failed", value: delStats.failedCount ?? 0, icon: XCircle, color: "text-red-400" },
                        { label: "Avg Latency", value: delStats.avgLatencyMs ? `${delStats.avgLatencyMs}ms` : "—", icon: Clock, color: "text-zinc-400" },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                          <div className="flex items-center gap-2">
                            <row.icon className={cn("w-4 h-4", row.color)} />
                            <span className="text-sm text-zinc-300">{row.label}</span>
                          </div>
                          <span className="text-sm font-bold text-white">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Top Skills</div>
                    <div className="space-y-2">
                      {(skillStats.topSkills ?? []).length === 0 ? (
                        <div className="text-xs text-zinc-500">No skill usage recorded yet</div>
                      ) : (
                        (skillStats.topSkills ?? []).map((s: Record<string, unknown>, i: number) => (
                          <div key={s.skillId as string} className="flex items-center gap-2 py-1">
                            <span className="text-xs text-zinc-500 w-4">{i + 1}</span>
                            <span className="text-sm text-white flex-1">{(s.skillId as string).replace(/_/g, " ")}</span>
                            <span className="text-xs text-indigo-400">{s.invocations as number} runs</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Connector Status</div>
                    <div className="space-y-2">
                      {(connStats.connectors ?? []).slice(0, 6).map((c: Record<string, unknown>) => (
                        <div key={c.connectorId as string} className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", c.configured ? "bg-emerald-400" : "bg-zinc-600")} />
                          <span className="text-sm text-zinc-300 flex-1">{c.displayName as string}</span>
                          <span className="text-xs text-zinc-500">{c.category as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Knowledge Base</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300">Total Documents</span>
                        <span className="text-sm font-bold text-white">{ragStats.totalDocuments ?? 0}</span>
                      </div>
                      {Object.entries(ragStats.byDomain ?? {}).map(([domain, count]) => (
                        <div key={domain} className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-cyan-400" />
                          <span className="text-xs text-zinc-400 flex-1">{domain}</span>
                          <span className="text-xs text-white">{count as number}</span>
                        </div>
                      ))}
                      {Object.keys(ragStats.byDomain ?? {}).length === 0 && (
                        <div className="text-xs text-zinc-500">No documents indexed yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === "agents" && (
          <div className="space-y-3">
            <div className="text-xs text-zinc-500 mb-2">
              {agentsLoading ? "Loading agents..." : `${agentsData?.data?.total ?? 0} agents in registry`}
            </div>
            {agentsLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              (agentsData?.data?.agents ?? []).map((agent: Record<string, unknown>) => (
                <AgentCard key={agent.agentId as string} agent={agent} />
              ))
            )}
          </div>
        )}

        {tab === "delegations" && (
          <div className="space-y-4">
            {delegationsLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Delegation Statistics</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(delegationsData?.data?.stats?.byAgent ?? {}).map(([agentId, data]) => {
                      const d = data as Record<string, number>;
                      return (
                        <div key={agentId} className="bg-zinc-800/50 rounded-lg p-3">
                          <div className="text-sm font-medium text-white capitalize">{agentId}</div>
                          <div className="text-xs text-zinc-500 mt-1">{d.delegations} delegations</div>
                          <div className="text-xs text-emerald-400">{d.successes} success</div>
                          {d.failures > 0 && <div className="text-xs text-red-400">{d.failures} failed</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Delegation History ({(delegationsData?.data?.history ?? []).length} tasks)
                  </div>
                  <div className="space-y-2">
                    {(delegationsData?.data?.history ?? []).slice(0, 20).map((d: Record<string, unknown>) => (
                      <DelegationChain key={d.taskId as string} delegation={d} />
                    ))}
                    {(delegationsData?.data?.history ?? []).length === 0 && (
                      <div className="text-xs text-zinc-500">No delegations recorded yet. Agent-to-agent task handoffs will appear here.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "skills" && (
          <div className="space-y-4">
            {skillsLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Skill Usage</div>
                    <div className="space-y-1">
                      {Object.entries(skillsData?.data?.usage?.bySkill ?? {}).length === 0 ? (
                        <div className="text-xs text-zinc-500">No skill invocations recorded yet</div>
                      ) : (
                        Object.entries(skillsData?.data?.usage?.bySkill ?? {})
                          .sort((a, b) => (b[1] as Record<string, number>).invocations - (a[1] as Record<string, number>).invocations)
                          .map(([skillId, data]) => {
                            const d = data as Record<string, unknown>;
                            return (
                              <div key={skillId} className="flex items-center gap-2 py-1">
                                <span className="text-sm text-white flex-1">{skillId.replace(/_/g, " ")}</span>
                                <span className="text-xs text-indigo-400">{d.invocations as number} invocations</span>
                                <span className="text-xs text-zinc-500">{(d.agents as string[]).length} agents</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Skill Categories</div>
                    <div className="space-y-1">
                      {["analysis", "synthesis", "generation", "research", "monitoring", "validation", "orchestration", "extraction"].map(cat => {
                        const count = (skillsData?.data?.skills ?? []).filter((s: Record<string, unknown>) => s.category === cat).length;
                        return count > 0 ? (
                          <div key={cat} className="flex items-center gap-2 py-1">
                            <span className="text-sm text-zinc-300 capitalize flex-1">{cat}</span>
                            <span className="text-xs text-zinc-400">{count} skills</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    All Skills ({(skillsData?.data?.skills ?? []).length} registered)
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {(skillsData?.data?.skills ?? []).map((skill: Record<string, unknown>) => (
                      <SkillRow key={skill.skillId as string} skill={skill} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "connectors" && (
          <div className="space-y-4">
            {connectorsLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <>
                <div className="flex gap-3 text-sm">
                  <span className="text-white font-semibold">{connectorsData?.data?.configured ?? 0}</span>
                  <span className="text-zinc-400">configured</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-white font-semibold">{connectorsData?.data?.total ?? 0}</span>
                  <span className="text-zinc-400">total registered</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(connectorsData?.data?.connectors ?? []).map((c: Record<string, unknown>) => (
                    <ConnectorCard key={c.connectorId as string} connector={c} />
                  ))}
                </div>
                <div className="text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="font-semibold text-zinc-300 mb-2">Configuration Note</div>
                  Connectors marked "Unconfigured" are ready to use — they just need their API keys set as environment variables.
                  Each connector adapter handles auth normalization, rate limiting, error handling, and request/response mapping.
                </div>
              </>
            )}
          </div>
        )}

        {tab === "rag" && (
          <div className="space-y-4">
            {ragLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{ragData?.data?.totalDocuments ?? 0}</div>
                    <div className="text-xs text-zinc-400">documents in knowledge base</div>
                  </div>
                  <button
                    onClick={() => ingestMutation.mutate()}
                    disabled={ingestMutation.isPending}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Database className="w-4 h-4" />
                    {ingestMutation.isPending ? "Ingesting..." : "Ingest Decisions"}
                  </button>
                </div>
                {ingestMutation.data && (
                  <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    ✓ {ingestMutation.data.data?.message ?? "Ingest complete"}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">By Domain</div>
                    <div className="space-y-2">
                      {Object.entries(ragData?.data?.byDomain ?? {}).length === 0 ? (
                        <div className="text-xs text-zinc-500">No documents yet. Use "Ingest Decisions" to populate the knowledge base from past AI decisions.</div>
                      ) : (
                        Object.entries(ragData?.data?.byDomain ?? {}).map(([domain, count]) => (
                          <div key={domain} className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-cyan-400" />
                            <span className="text-sm text-zinc-300 flex-1 capitalize">{domain}</span>
                            <span className="text-sm font-bold text-white">{count as number}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">By Source Type</div>
                    <div className="space-y-2">
                      {Object.entries(ragData?.data?.bySourceType ?? {}).length === 0 ? (
                        <div className="text-xs text-zinc-500">No source types indexed yet</div>
                      ) : (
                        Object.entries(ragData?.data?.bySourceType ?? {}).map(([type, count]) => (
                          <div key={type} className="flex items-center gap-2">
                            <BookOpen className="w-3 h-3 text-indigo-400" />
                            <span className="text-sm text-zinc-300 flex-1 capitalize">{type.replace(/_/g, " ")}</span>
                            <span className="text-sm font-bold text-white">{count as number}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 space-y-2">
                  <div className="font-semibold text-zinc-200">How RAG Works</div>
                  <p>Before each agent call, the orchestrator queries this knowledge base for relevant context. Documents are retrieved using full-text search ranked by domain relevance and importance score.</p>
                  <p>The "Ingest Decisions" action pulls recent AI decisions from the decision store and indexes them so agents can ground future reasoning in past outcomes.</p>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "performance" && (
          <div className="space-y-4">
            {perfLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <>
                <div className="text-xs text-zinc-500">
                  {(perfData?.data?.snapshots ?? []).length} agent performance snapshots computed
                </div>
                <div className="space-y-3">
                  {(perfData?.data?.snapshots ?? []).length === 0 ? (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <div className="text-sm">Performance snapshots appear after agents process decisions</div>
                      <div className="text-xs mt-1">Self-reflection and confidence calibration data will show here</div>
                    </div>
                  ) : (
                    (perfData?.data?.snapshots ?? []).map((snap: Record<string, unknown>) => (
                      <div key={snap.agentId as string} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-indigo-400" />
                            <span className="font-semibold text-white capitalize">{snap.agentId as string}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendBadge trend={snap.confidenceTrend as string} />
                            {snap.flaggedForReview && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">⚠ Needs Review</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div className="text-center">
                            <div className="text-xl font-bold text-white">{Math.round((snap.accuracyScore as number) * 100)}%</div>
                            <div className="text-xs text-zinc-500">accuracy</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-white">{snap.totalDecisions as number}</div>
                            <div className="text-xs text-zinc-500">decisions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-white">{Math.round((snap.avgConfidence as number) * 100)}%</div>
                            <div className="text-xs text-zinc-500">avg confidence</div>
                          </div>
                          <div className="text-center">
                            <div className={cn("text-xl font-bold", Math.abs(snap.calibrationBias as number) > 0.15 ? "text-yellow-400" : "text-white")}>
                              {(snap.calibrationBias as number) > 0 ? "+" : ""}{Math.round((snap.calibrationBias as number) * 100)}%
                            </div>
                            <div className="text-xs text-zinc-500">cal. bias</div>
                          </div>
                        </div>
                        {snap.reviewReason && (
                          <div className="text-xs text-yellow-400 bg-yellow-500/10 rounded px-2 py-1 border border-yellow-500/20">
                            {snap.reviewReason as string}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
