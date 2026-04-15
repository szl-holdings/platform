import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Brain, Network, Zap, Activity, CheckCircle, AlertTriangle, XCircle,
  ArrowRight, ChevronDown, ChevronUp, RefreshCw, Database, Plug,
  TrendingUp, TrendingDown, Minus, Bot, Link2, BookOpen,
  BarChart3, Clock, Globe, Star, Sparkles,
  GitBranch, AlertCircle, Eye, Cpu
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BASE = import.meta.env.BASE_URL ?? "/firestorm/";
const API = BASE.replace(/\/$/, "") + "/../api-server/api";

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${API}${path}`, { credentials: "include", ...opts });
  if (!r.ok) throw new Error(`API ${path} failed: ${r.status}`);
  return r.json();
}

// ─── Shared utilities ────────────────────────────────────────────────────────

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

function EmptyState({ icon: Icon, title, detail }: { icon: React.ElementType; title: string; detail: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
      <div className="text-sm text-zinc-400 font-medium">{title}</div>
      <div className="text-xs text-zinc-600 mt-1">{detail}</div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  if (trend === "improving") return <span className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />Improving</span>;
  if (trend === "declining") return <span className="text-xs text-red-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Declining</span>;
  return <span className="text-xs text-zinc-400 flex items-center gap-1"><Minus className="w-3 h-3" />Stable</span>;
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

function Sparkline({ values, color = "#6366f1", height = 32 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const lastPt = pts[pts.length - 1]!.split(",");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Agent Card ──────────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const perf = agent.performance as Record<string, unknown> | null;
  const capabilities = (agent.capabilities as Array<{ name: string; description: string; costEstimate: string }>) ?? [];
  const skills = (agent.skillUsage as { invocations: number; skills: string[] }) ?? { invocations: 0, skills: [] };
  const metadata = agent.metadata as Record<string, unknown> ?? {};

  const confHistory: number[] = (perf?.confidenceHistory as number[]) ?? [];
  const accHistory: number[] = (perf?.accuracyHistory as number[]) ?? [];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <Bot className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{agent.agentName as string}</span>
            <AgentStatusBadge availability={agent.availability as string} />
            {Boolean(perf?.flaggedForReview) && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">⚠ Flagged</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500 capitalize">{agent.domain as string}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{agent.preferredModel as string}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-right">
          {perf && (
            <div className="flex items-end gap-2">
              <div>
                <div className="text-sm font-bold text-white">{Math.round((perf.accuracyScore as number) * 100)}%</div>
                <div className="text-xs text-zinc-500">accuracy</div>
              </div>
              {accHistory.length >= 2 && <Sparkline values={accHistory.map(v => v * 100)} color="#10b981" height={28} />}
            </div>
          )}
          {perf && (
            <div className="flex items-end gap-2">
              <div>
                <div className="text-sm font-bold text-white">{Math.round((perf.avgConfidence as number) * 100)}%</div>
                <div className="text-xs text-zinc-500">confidence</div>
              </div>
              {confHistory.length >= 2 && <Sparkline values={confHistory.map(v => v * 100)} color="#6366f1" height={28} />}
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
                    <div className="text-lg font-bold text-white">{stat.value ?? 0}</div>
                    <div className="text-xs text-zinc-500">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <TrendBadge trend={perf.confidenceTrend as string} />
                <span className="text-xs text-zinc-500">
                  Avg confidence: {Math.round((perf.avgConfidence as number ?? 0) * 100)}% |
                  Calibration bias: {Math.round((perf.calibrationBias as number ?? 0) * 100)}%
                </span>
              </div>
              {Boolean(perf.reviewReason) && (
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
                    <span className={cn("ml-auto px-1.5 py-0.5 rounded", cap.costEstimate === "high" ? "bg-red-500/20 text-red-400" : cap.costEstimate === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-emerald-500/20 text-emerald-400")}>
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
              <div className="text-zinc-500">Trust Level: <span className="text-white">{agent.trustLevel as string}</span></div>
              <div className="text-zinc-500">Version: <span className="text-white">{agent.version as string}</span></div>
              <div className="text-zinc-500">Provider: <span className="text-white">{agent.preferredProvider as string}</span></div>
              <div className="text-zinc-500">Delegations: <span className="text-white">{(metadata.totalDelegations as number) ?? 0}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── A2A Communication Graph ─────────────────────────────────────────────────

interface GraphNode { id: string; label: string; x: number; y: number; }

const GRAPH_POSITIONS: Record<string, { x: number; y: number }> = {
  default0: { x: 220, y: 60 },
  default1: { x: 80, y: 170 },
  default2: { x: 360, y: 170 },
  default3: { x: 80, y: 290 },
  default4: { x: 360, y: 290 },
  default5: { x: 220, y: 350 },
  default6: { x: 50, y: 60 },
  default7: { x: 390, y: 60 },
};

function A2AGraph({ history, byAgent }: { history: Record<string, unknown>[]; byAgent: Record<string, Record<string, number>> }) {
  const statusColor = { running: "#f59e0b", completed: "#10b981", failed: "#ef4444", pending: "#6b7280" };

  const knownAgentIds = Array.from(new Set([
    ...history.map(h => h.fromAgentId as string),
    ...history.map(h => h.toAgentId as string),
  ])).filter(Boolean);

  const nodes: GraphNode[] = knownAgentIds.map((id, i) => {
    const pos = GRAPH_POSITIONS[`default${i}`] ?? { x: 50 + (i % 4) * 120, y: 60 + Math.floor(i / 4) * 130 };
    return { id, label: id, x: pos.x, y: pos.y };
  });

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  const edges = history.slice(0, 12).map(h => ({
    from: h.fromAgentId as string,
    to: h.toAgentId as string,
    status: (h.status as string) ?? "pending",
    latencyMs: h.result ? (h.result as Record<string, unknown>).latencyMs as number : null,
    task: h.task as string,
  }));

  if (nodes.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8">
        <EmptyState icon={Network} title="No delegation chains yet" detail="A2A task handoffs will appear here as agents delegate work to each other." />
      </div>
    );
  }

  function midpoint(a: GraphNode, b: GraphNode) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">A2A Communication Graph</span>
          <span className="text-xs text-zinc-600 font-mono">({history.length} total delegations)</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {(["running", "completed", "failed"] as const).map(s => (
            <div key={s} className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded" style={{ background: statusColor[s] }} />
              <span className="text-zinc-500 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <svg viewBox="0 0 440 420" className="w-full" style={{ maxHeight: 300 }}>
          <defs>
            {(["running", "completed", "failed", "pending"] as const).map(s => (
              <marker key={s} id={`arrow-${s}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 Z" fill={statusColor[s]} />
              </marker>
            ))}
          </defs>

          {edges.map((edge, i) => {
            const from = nodeMap[edge.from];
            const to = nodeMap[edge.to];
            if (!from || !to || from.id === to.id) return null;
            const color = statusColor[edge.status as keyof typeof statusColor] ?? "#6b7280";
            const mid = midpoint(from, to);
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={color} strokeWidth={edge.status === "running" ? 2 : 1.5}
                  strokeDasharray={edge.status === "running" ? "5,3" : undefined}
                  strokeOpacity={0.65}
                  markerEnd={`url(#arrow-${edge.status})`}
                />
                {edge.latencyMs != null && (
                  <>
                    <rect x={mid.x - 22} y={mid.y - 8} width={44} height={14} rx={3}
                      fill="rgba(9,8,15,0.9)" stroke={color} strokeWidth="0.5" strokeOpacity={0.35} />
                    <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize="7" fill={color} fillOpacity={0.9} fontFamily="monospace">
                      {edge.latencyMs}ms
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {nodes.map(node => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={20} fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.4)" strokeWidth={1.5} />
              <circle cx={node.x} cy={node.y} r={4} fill="#6366f1" opacity={0.8} />
              <text x={node.x} y={node.y + 32} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.45)" fontFamily="sans-serif">
                {node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label}
              </text>
            </g>
          ))}
        </svg>

        {edges.filter(e => e.status === "running").length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Active Chains</div>
            {edges.filter(e => e.status === "running").slice(0, 3).map((e) => (
              <div key={`${e.from}-${e.to}`} className="flex items-center gap-2 text-xs bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
                <span className="text-zinc-400">{e.from}</span>
                <ArrowRight className="w-3 h-3 text-zinc-600" />
                <span className="text-zinc-200 font-medium">{e.to}</span>
                <span className="ml-auto text-zinc-500 truncate max-w-[120px]">{e.task}</span>
                {e.latencyMs != null && <span className="text-yellow-400 font-mono flex-shrink-0">{e.latencyMs}ms</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RAG Activity Monitor ────────────────────────────────────────────────────

function RagActivityMonitor({ ragData }: { ragData: Record<string, unknown> | null }) {
  const byDomain = (ragData?.byDomain ?? {}) as Record<string, number>;
  const bySourceType = (ragData?.bySourceType ?? {}) as Record<string, number>;
  const recentQueries = (ragData?.recentQueries ?? []) as Array<{
    query: string; agent: string; relevanceScore: number;
    cacheHit: boolean; latencyMs: number; resultsCount: number; timestamp: string;
  }>;
  const queryStats = ragData?.queryStats as Record<string, number> | undefined;

  const totalDocs = (ragData?.totalDocuments as number) ?? 0;

  return (
    <div className="space-y-4">
      {queryStats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{queryStats.cacheHitRate ?? "—"}%</div>
            <div className="text-xs text-zinc-500 mt-1">Cache Hit Rate</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-400">{queryStats.avgRelevanceScore ?? "—"}%</div>
            <div className="text-xs text-zinc-500 mt-1">Avg Relevance Score</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{queryStats.avgLatencyMs ?? "—"}ms</div>
            <div className="text-xs text-zinc-500 mt-1">Avg Query Latency</div>
          </div>
        </div>
      )}

      {recentQueries.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Recent Retrieval Queries</span>
            </div>
            <span className="text-xs text-zinc-600 font-mono">{recentQueries.length} queries</span>
          </div>
          <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
            {recentQueries.map((q) => (
              <div key={q.query} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/20 transition-colors">
                <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", q.cacheHit ? "bg-emerald-500/15" : "bg-indigo-500/15")}>
                  {q.cacheHit ? <Star className="w-3 h-3 text-emerald-400" /> : <Database className="w-3 h-3 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-200 font-medium truncate">"{q.query}"</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{q.agent}</div>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  <div className="text-right">
                    <div className={cn("font-bold", q.relevanceScore > 0.85 ? "text-emerald-400" : q.relevanceScore > 0.75 ? "text-yellow-400" : "text-orange-400")}>
                      {(q.relevanceScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-[9px] text-zinc-600">relevance</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("font-mono", q.cacheHit ? "text-emerald-400" : "text-zinc-300")}>{q.latencyMs}ms</div>
                    <div className="text-[9px] text-zinc-600">{q.cacheHit ? "cache" : "vector"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-300">{q.resultsCount}</div>
                    <div className="text-[9px] text-zinc-600">results</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentQueries.length === 0 && !queryStats && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <EmptyState icon={BookOpen} title="No query telemetry yet" detail="Retrieval activity will appear here as agents query the knowledge base." />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Knowledge Base — {totalDocs} Documents
          </div>
          {Object.keys(byDomain).length === 0 ? (
            <div className="text-xs text-zinc-500">No documents indexed yet. Use "Ingest Decisions" to populate the knowledge base.</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(byDomain).map(([domain, count]) => (
                <div key={domain} className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span className="text-sm text-zinc-300 flex-1 capitalize">{domain}</span>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">By Source Type</div>
          {Object.keys(bySourceType).length === 0 ? (
            <div className="text-xs text-zinc-500">No source types indexed yet</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(bySourceType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-indigo-400" />
                  <span className="text-sm text-zinc-300 flex-1 capitalize">{type.replace(/_/g, " ")}</span>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <div className="font-semibold text-zinc-300 mb-1">How RAG Works</div>
        Before each agent call, the orchestrator queries this knowledge base for relevant context. Documents are retrieved using
        full-text search ranked by domain relevance and importance score. The "Ingest Decisions" action indexes recent AI decisions
        so agents can ground future reasoning in past outcomes.
      </div>
    </div>
  );
}

// ─── Self-Improvement Feed ───────────────────────────────────────────────────

type SelfEventType = "strategy_adjusted" | "performance_flagged" | "human_review_requested" | "confidence_recalibrated" | "skill_adopted" | "fallback_triggered";

interface SelfEvent {
  agentId: string;
  eventType: SelfEventType;
  detail: string;
  before?: string;
  after?: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

const EVENT_TYPE_CONFIG: Record<SelfEventType, { label: string; icon: React.ElementType; color: string }> = {
  strategy_adjusted:         { label: "Strategy Adjusted",       icon: GitBranch,   color: "text-indigo-400" },
  performance_flagged:       { label: "Performance Flagged",     icon: AlertTriangle, color: "text-yellow-400" },
  human_review_requested:    { label: "Human Review Requested",  icon: Eye,          color: "text-red-400" },
  confidence_recalibrated:   { label: "Confidence Recalibrated", icon: Cpu,          color: "text-cyan-400" },
  skill_adopted:             { label: "Skill Adopted",           icon: Zap,          color: "text-emerald-400" },
  fallback_triggered:        { label: "Fallback Triggered",      icon: AlertCircle,  color: "text-orange-400" },
};

function timeAgoStr(ts: string | Date): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  return `${Math.round(diff / 3600000)}h ago`;
}

function SelfImprovementFeed({
  snapshots,
  events,
}: {
  snapshots: Record<string, unknown>[];
  events: SelfEvent[];
}) {
  const criticalCount = events.filter(e => e.severity === "critical").length;
  const warningCount = events.filter(e => e.severity === "warning").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{events.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Self-Reflection Events</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
          <div className="text-xs text-zinc-500 mt-1">Human Review Required</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
          <div className="text-xs text-zinc-500 mt-1">Flagged for Review</div>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Self-Reflection Event Stream</span>
        </div>
        {events.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Sparkles} title="No self-reflection events yet" detail="Events are recorded when agents recalibrate confidence, adjust strategies, flag performance issues, or request human review." />
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60 max-h-80 overflow-y-auto">
            {events.map((event, i) => {
              const cfg = EVENT_TYPE_CONFIG[event.eventType] ?? EVENT_TYPE_CONFIG.strategy_adjusted;
              const Icon = cfg.icon;
              const sevBg = event.severity === "critical" ? "bg-red-400/5" : event.severity === "warning" ? "bg-yellow-400/5" : "";
              return (
                <div key={event.id ?? `${event.eventType}-${event.timestamp}`} className={cn("flex gap-3 px-4 py-3 hover:bg-white/[0.01]", sevBg)}>
                  <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                    event.severity === "critical" ? "bg-red-500/15" :
                    event.severity === "warning" ? "bg-yellow-500/15" : "bg-zinc-800")}>
                    <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-200">{event.agentId}</span>
                      <span className={cn("text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border",
                        event.severity === "critical" ? "text-red-400 border-red-500/30 bg-red-500/10" :
                        event.severity === "warning" ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" :
                        "text-zinc-500 border-zinc-700 bg-zinc-800/50")}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{event.detail}</p>
                    {(event.before || event.after) && (
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {event.before && <span className="text-zinc-600 line-through">{event.before}</span>}
                        {event.before && event.after && <ArrowRight className="w-3 h-3 text-zinc-600" />}
                        {event.after && <span className="text-emerald-400">{event.after}</span>}
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-600 mt-1">{timeAgoStr(event.timestamp)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {snapshots.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Per-Agent Confidence & Accuracy Trends</div>
          <div className="space-y-4">
            {snapshots.map((snap: Record<string, unknown>) => {
              const confHistory = (snap.confidenceHistory as number[] | undefined) ?? [];
              const accHistory = (snap.accuracyHistory as number[] | undefined) ?? [];
              const conf = (snap.avgConfidence as number) ?? 0;
              const acc = (snap.accuracyScore as number) ?? 0;
              return (
                <div key={snap.agentId as string} className="flex items-center gap-4 py-2 border-b border-zinc-800 last:border-0">
                  <div className="flex items-center gap-2 w-36 flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="text-xs text-zinc-300 font-medium capitalize truncate">{snap.agentId as string}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">conf</span>
                    {confHistory.length >= 2 ? (
                      <Sparkline values={confHistory.map(v => v * 100)} color="#6366f1" height={24} />
                    ) : (
                      <span className="text-zinc-700 text-xs">—</span>
                    )}
                    <span className="text-xs text-indigo-400 font-mono">{Math.round(conf * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">acc</span>
                    {accHistory.length >= 2 ? (
                      <Sparkline values={accHistory.map(v => v * 100)} color="#10b981" height={24} />
                    ) : (
                      <span className="text-zinc-700 text-xs">—</span>
                    )}
                    <span className="text-xs text-emerald-400 font-mono">{Math.round(acc * 100)}%</span>
                  </div>
                  <div className="ml-auto">
                    <TrendBadge trend={snap.confidenceTrend as string} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {snapshots.length === 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <EmptyState icon={TrendingUp} title="No performance snapshots yet" detail="Per-agent confidence and accuracy trend charts will appear here after agents process decisions." />
        </div>
      )}
    </div>
  );
}

// ─── Connector Health Panel ──────────────────────────────────────────────────

interface ConnectorRecord {
  connectorId?: string;
  id?: string;
  displayName?: string;
  name?: string;
  category: string;
  toolCount: number;
  configured?: boolean;
  status?: string;
  latencyMs?: number;
  errorRate?: number;
  lastSuccess?: string;
}

function resolveConnectorStatus(c: ConnectorRecord): "up" | "degraded" | "down" {
  if (c.status === "degraded") return "degraded";
  if (c.status === "down") return "down";
  if (c.status === "up") return "up";
  return c.configured ? "up" : "down";
}

function ConnectorHealthPanel({ connectors }: { connectors: ConnectorRecord[] }) {
  const upCount = connectors.filter(c => resolveConnectorStatus(c) === "up").length;
  const degradedCount = connectors.filter(c => resolveConnectorStatus(c) === "degraded").length;
  const downCount = connectors.filter(c => resolveConnectorStatus(c) === "down").length;

  const statusStyle = (c: ConnectorRecord) => {
    const st = resolveConnectorStatus(c);
    if (st === "degraded") return { dot: "bg-yellow-400 animate-pulse", text: "text-yellow-400", label: "Degraded", badge: "bg-yellow-500/10 border-yellow-500/20" };
    if (st === "up") return { dot: "bg-emerald-400", text: "text-emerald-400", label: "Operational", badge: "bg-emerald-500/10 border-emerald-500/20" };
    return { dot: "bg-zinc-600", text: "text-zinc-400", label: "Unconfigured / Down", badge: "bg-zinc-700/50 border-zinc-700" };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{upCount}</div>
          <div className="text-xs text-zinc-500 mt-1">Operational</div>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{degradedCount}</div>
          <div className="text-xs text-zinc-500 mt-1">Degraded</div>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-zinc-400">{downCount}</div>
          <div className="text-xs text-zinc-500 mt-1">Unconfigured / Down</div>
        </div>
      </div>

      {connectors.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <EmptyState icon={Plug} title="No connectors registered" detail="Tool connector records will appear here once the connector hub is configured." />
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Connector Status Board</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">{connectors.length} connectors</span>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {connectors.map(conn => {
              const s = statusStyle(conn);
              const name = conn.displayName ?? conn.name ?? conn.connectorId ?? conn.id ?? "Unknown";
              const id = conn.connectorId ?? conn.id ?? name;
              return (
                <div key={id} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-200">{name}</span>
                      <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800">{conn.category}</span>
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">
                      {conn.toolCount} tools
                      {conn.lastSuccess && ` · last success ${timeAgoStr(conn.lastSuccess)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-right flex-shrink-0">
                    {conn.latencyMs != null && (
                      <div>
                        <div className="text-zinc-300 font-mono">{conn.latencyMs}ms</div>
                        <div className="text-[9px] text-zinc-600">latency</div>
                      </div>
                    )}
                    {conn.errorRate != null && (
                      <div>
                        <div className={conn.errorRate > 5 ? "text-red-400" : conn.errorRate > 1 ? "text-yellow-400" : "text-emerald-400"}>
                          {conn.errorRate.toFixed(1)}%
                        </div>
                        <div className="text-[9px] text-zinc-600">error rate</div>
                      </div>
                    )}
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", s.badge, s.text)}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skill Row ───────────────────────────────────────────────────────────────

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
      {Boolean(skill.chainable) && (
        <span className="text-xs text-indigo-400 flex items-center gap-1">
          <Link2 className="w-3 h-3" />chainable
        </span>
      )}
      <span className="text-xs text-zinc-500">~{skill.estimatedTokens as number} tokens</span>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

type Tab = "overview" | "agents" | "a2a" | "skills" | "rag" | "connectors" | "self-improvement";

const BASE_PATH = "/intel/agent-autonomy";

function deriveTab(location: string): Tab {
  const suffix = location.replace(BASE_PATH, "").replace(/^\//, "");
  const valid: Tab[] = ["agents", "a2a", "skills", "rag", "connectors", "self-improvement"];
  return (valid.includes(suffix as Tab) ? suffix : "overview") as Tab;
}

export default function AgentAutonomyDashboard() {
  const [location, navigate] = useLocation();
  const tab = deriveTab(location);

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ["agent-autonomy-overview"],
    queryFn: () => apiFetch("/agent-autonomy/overview"),
    refetchInterval: 30000,
  });

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["agent-autonomy-agents"],
    queryFn: () => apiFetch("/agent-autonomy/agents"),
    enabled: tab === "agents" || tab === "overview",
    refetchInterval: 15000,
  });

  const { data: delegationsData, isLoading: delegationsLoading } = useQuery({
    queryKey: ["agent-autonomy-delegations"],
    queryFn: () => apiFetch("/agent-autonomy/delegations"),
    enabled: tab === "a2a" || tab === "overview",
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
    refetchInterval: 20000,
  });

  const { data: ragData, isLoading: ragLoading } = useQuery({
    queryKey: ["agent-autonomy-rag"],
    queryFn: () => apiFetch("/agent-autonomy/rag"),
    enabled: tab === "rag",
    refetchInterval: 30000,
  });

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ["agent-autonomy-perf"],
    queryFn: () => apiFetch("/agent-autonomy/performance"),
    enabled: tab === "self-improvement",
    refetchInterval: 20000,
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

  const agentsList = (agentsData?.data?.agents ?? []) as Record<string, unknown>[];
  const delegationHistory = (delegationsData?.data?.history ?? []) as Record<string, unknown>[];
  const byAgent = (delegationsData?.data?.stats?.byAgent ?? {}) as Record<string, Record<string, number>>;
  const perfSnapshots = (perfData?.data?.snapshots ?? []) as Record<string, unknown>[];
  const selfEvents = (perfData?.data?.selfImprovementEvents ?? []) as SelfEvent[];
  const connectorsList = (connectorsData?.data?.connectors ?? []) as ConnectorRecord[];

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "overview",          label: "Overview",         icon: BarChart3 },
    { id: "agents",            label: "Live Agents",      icon: Bot },
    { id: "a2a",               label: "A2A Graph",        icon: Network },
    { id: "skills",            label: "Skill Analytics",  icon: Zap },
    { id: "rag",               label: "RAG Monitor",      icon: BookOpen },
    { id: "connectors",        label: "Connector Health", icon: Plug },
    { id: "self-improvement",  label: "Self-Improvement", icon: Sparkles },
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
              onClick={() => navigate(t.id === "overview" ? BASE_PATH : `${BASE_PATH}/${t.id}`)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                tab === t.id ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ─── Overview ─── */}
        {tab === "overview" && (
          <>
            {overviewLoading ? (
              <div className="flex items-center justify-center h-40 text-zinc-500">Loading...</div>
            ) : (
              <>
                <div>
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">System Health</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                    {(skillStats.topSkills ?? []).length === 0 ? (
                      <div className="text-xs text-zinc-500">No skill usage recorded yet</div>
                    ) : (
                      <div className="space-y-2">
                        {(skillStats.topSkills ?? []).map((s: Record<string, unknown>, i: number) => (
                          <div key={s.skillId as string} className="flex items-center gap-2 py-1">
                            <span className="text-xs text-zinc-500 w-4">{i + 1}</span>
                            <span className="text-sm text-white flex-1">{(s.skillId as string).replace(/_/g, " ")}</span>
                            <span className="text-xs text-indigo-400">{s.invocations as number} runs</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Connector Status</div>
                    {(connStats.connectors ?? []).length === 0 ? (
                      <div className="text-xs text-zinc-500">No connectors registered yet</div>
                    ) : (
                      <div className="space-y-2">
                        {(connStats.connectors ?? []).slice(0, 6).map((c: Record<string, unknown>) => (
                          <div key={c.connectorId as string} className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", c.configured ? "bg-emerald-400" : "bg-zinc-600")} />
                            <span className="text-sm text-zinc-300 flex-1">{c.displayName as string}</span>
                            <span className="text-xs text-zinc-500">{c.category as string}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Knowledge Base</div>
                    <div className="flex items-center justify-between mb-2">
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
              </>
            )}
          </>
        )}

        {/* ─── Live Agents ─── */}
        {tab === "agents" && (
          <div className="space-y-3">
            <div className="text-xs text-zinc-500 mb-2">
              {agentsLoading ? "Loading agents..." : `${agentsData?.data?.total ?? agentsList.length} agents in registry`}
            </div>
            {agentsLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : agentsList.length === 0 ? (
              <EmptyState icon={Bot} title="No agents registered yet" detail="Agents appear here once the A2A registry is populated." />
            ) : (
              agentsList.map((agent: Record<string, unknown>) => (
                <AgentCard key={agent.agentId as string} agent={agent} />
              ))
            )}
          </div>
        )}

        {/* ─── A2A Graph ─── */}
        {tab === "a2a" && (
          <div className="space-y-4">
            {delegationsLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <>
                <A2AGraph history={delegationHistory} byAgent={byAgent} />

                {delegationHistory.length > 0 && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                      Delegation History ({delegationHistory.length})
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {delegationHistory.slice(0, 30).map((d: Record<string, unknown>, i) => (
                        <div key={(d.taskId as string) ?? i} className="flex items-center gap-2 py-2 px-3 bg-zinc-800/40 rounded-lg text-xs">
                          <span className="text-zinc-400">{d.fromAgentId as string}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-500" />
                          <span className="text-white font-medium">{d.toAgentId as string}</span>
                          <span className="mx-2 text-zinc-700">|</span>
                          <span className={cn(
                            d.status === "completed" ? "text-emerald-400" :
                            d.status === "failed" ? "text-red-400" :
                            d.status === "running" ? "text-yellow-400" : "text-zinc-400"
                          )}>{d.status as string}</span>
                          {Boolean(d.result) && (
                            <>
                              <span className="text-zinc-700 mx-1">|</span>
                              <span className="text-zinc-400">conf: {(d.result as Record<string, unknown>).confidence as number}%</span>
                              <span className="text-zinc-400 ml-1">{(d.result as Record<string, unknown>).latencyMs as number}ms</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(byAgent).length > 0 && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Per-Agent Delegation Stats</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(byAgent).map(([agentId, data]) => (
                        <div key={agentId} className="bg-zinc-800/50 rounded-lg p-3">
                          <div className="text-sm font-medium text-white capitalize">{agentId}</div>
                          <div className="text-xs text-zinc-500 mt-1">{data.delegations ?? 0} delegations</div>
                          <div className="text-xs text-emerald-400">{data.successes ?? 0} success</div>
                          {(data.failures ?? 0) > 0 && <div className="text-xs text-red-400">{data.failures} failed</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Skill Analytics ─── */}
        {tab === "skills" && (
          <div className="space-y-4">
            {skillsLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Skill Usage by Invocations</div>
                    {Object.entries(skillsData?.data?.usage?.bySkill ?? {}).length === 0 ? (
                      <div className="text-xs text-zinc-500">No skill invocations recorded yet</div>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(skillsData?.data?.usage?.bySkill ?? {})
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
                          })}
                      </div>
                    )}
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
                  {(skillsData?.data?.skills ?? []).length === 0 ? (
                    <EmptyState icon={Zap} title="No skills registered" detail="Skills will appear here once the skill manager is populated." />
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {(skillsData?.data?.skills ?? []).map((skill: Record<string, unknown>) => (
                        <SkillRow key={skill.skillId as string} skill={skill} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── RAG Monitor ─── */}
        {tab === "rag" && (
          <div className="space-y-4">
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
            {ragLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <RagActivityMonitor ragData={ragData?.data ?? null} />
            )}
          </div>
        )}

        {/* ─── Connector Health ─── */}
        {tab === "connectors" && (
          <div className="space-y-4">
            {connectorsLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <>
                <ConnectorHealthPanel connectors={connectorsList} />
                <div className="text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="font-semibold text-zinc-300 mb-1">Configuration Note</div>
                  Connectors showing "Unconfigured" are ready to activate — they need their API keys set as environment variables.
                  Each adapter handles auth normalization, rate limiting, error handling, and request/response mapping automatically.
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Self-Improvement ─── */}
        {tab === "self-improvement" && (
          <div className="space-y-4">
            {perfLoading ? (
              <div className="text-center text-zinc-500 py-10">Loading...</div>
            ) : (
              <SelfImprovementFeed snapshots={perfSnapshots} events={selfEvents} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
