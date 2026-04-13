import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, Zap, Eye, AlertTriangle, CheckCircle2, XCircle, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, BarChart3, Clock, Layers, Tag, Globe, ArrowRight,
  RefreshCw, Settings, Activity, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = "/api";

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(needsCsrf ? { "x-csrf-token": getCsrfToken() } : {}),
      ...(opts?.headers || {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

const AUTONOMY_LEVELS = {
  observer: { label: "Observer", color: "text-slate-400", bg: "bg-slate-800", icon: Eye, description: "Surfaces insights only, no actions" },
  advisor: { label: "Advisor", color: "text-amber-400", bg: "bg-amber-900/30", icon: AlertTriangle, description: "Suggests actions — human approves each" },
  operator: { label: "Operator", color: "text-red-400", bg: "bg-red-900/20", icon: Zap, description: "Executes autonomously within approved scope" },
};

const STATUS_STYLES = {
  active: "text-emerald-400 bg-emerald-900/30 border-emerald-700/50",
  degraded: "text-amber-400 bg-amber-900/30 border-amber-700/50",
  inactive: "text-slate-400 bg-slate-800/50 border-slate-700/50",
  deprecated: "text-red-400 bg-red-900/20 border-red-700/40",
};

const CATEGORY_ICONS: Record<string, string> = {
  content: "📝", communication: "✉️", visual: "🎨", data: "📊",
  productivity: "⚡", intelligence: "🧠", media: "🎬", orchestration: "🔗",
};

interface Skill {
  skill_id: string;
  label: string;
  description: string;
  category: string;
  domains: string[];
  status: string;
  required_autonomy_level: string;
  consent_category: string;
  invocations: number;
  successful_invocations: number;
  avg_latency_ms: number;
  last_used_at: string | null;
  tags: string[];
  composability: {
    canChainWith: string[];
    canBeChainedBy: string[];
    parallelizable: boolean;
  };
}

interface SkillStats {
  total: number;
  active: number;
  byCategory: Record<string, number>;
  topByUsage: Array<{ skillId: string; label: string; invocations: number }>;
}

interface McpModule {
  moduleId: string;
  name: string;
  domain: string;
  healthy: boolean;
  tools: number;
  details?: string;
}

interface McpHealth {
  gateway: string;
  modules: McpModule[];
}

function SkillCard({ skill, onToggleStatus }: {
  skill: Skill;
  onToggleStatus: (skillId: string, newStatus: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const autonomy = AUTONOMY_LEVELS[skill.required_autonomy_level as keyof typeof AUTONOMY_LEVELS];
  const AutonomyIcon = autonomy?.icon ?? Eye;
  const successRate = skill.invocations > 0
    ? Math.round((skill.successful_invocations / skill.invocations) * 100)
    : 0;

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200",
      skill.status === "active"
        ? "bg-white/5 border-white/10 hover:border-white/20"
        : "bg-white/2 border-white/5 opacity-60"
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0 mt-0.5">
              {CATEGORY_ICONS[skill.category] ?? "🔧"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-white">{skill.label}</h3>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                  STATUS_STYLES[skill.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.inactive
                )}>
                  {skill.status}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1 line-clamp-2">{skill.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide", autonomy?.bg)}>
              <AutonomyIcon size={10} className={autonomy?.color} />
              <span className={autonomy?.color}>{autonomy?.label}</span>
            </div>

            <button
              onClick={() => onToggleStatus(skill.skill_id, skill.status === "active" ? "inactive" : "active")}
              className="text-white/30 hover:text-white/70 transition-colors"
              title={skill.status === "active" ? "Disable skill" : "Enable skill"}
            >
              {skill.status === "active"
                ? <ToggleRight size={20} className="text-emerald-400" />
                : <ToggleLeft size={20} />
              }
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <BarChart3 size={11} className="text-white/30" />
            <span className="text-[10px] text-white/40">{skill.invocations.toLocaleString()} calls</span>
          </div>
          {skill.invocations > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 size={11} className={successRate > 90 ? "text-emerald-400" : successRate > 70 ? "text-amber-400" : "text-red-400"} />
              <span className="text-[10px] text-white/40">{successRate}% success</span>
            </div>
          )}
          {skill.avg_latency_ms > 0 && (
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-white/30" />
              <span className="text-[10px] text-white/40">{Math.round(skill.avg_latency_ms)}ms avg</span>
            </div>
          )}
          <div className="flex gap-1 ml-auto">
            {skill.domains.slice(0, 3).map(d => (
              <span key={d} className="text-[9px] bg-white/5 border border-white/8 rounded px-1.5 py-0.5 text-white/35">
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/8 p-4 space-y-3">
          <div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Composability</div>
            <div className="space-y-1">
              {skill.composability?.canChainWith?.length > 0 && (
                <div className="flex items-center gap-2">
                  <ArrowRight size={10} className="text-indigo-400 flex-shrink-0" />
                  <span className="text-[10px] text-white/40">Chains into: </span>
                  <div className="flex flex-wrap gap-1">
                    {skill.composability.canChainWith.map(s => (
                      <span key={s} className="text-[9px] bg-indigo-900/30 border border-indigo-700/30 text-indigo-300 rounded px-1.5 py-0.5">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {skill.composability?.parallelizable && (
                <div className="flex items-center gap-1">
                  <Layers size={10} className="text-violet-400" />
                  <span className="text-[10px] text-violet-400">Parallelizable</span>
                </div>
              )}
            </div>
          </div>

          {skill.tags?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={10} className="text-white/25" />
              {skill.tags.map(t => (
                <span key={t} className="text-[9px] text-white/30 bg-white/4 rounded px-1.5 py-0.5">{t}</span>
              ))}
            </div>
          )}

          <div className="text-[10px] text-white/30">
            Consent: <span className="text-white/50 capitalize">{skill.consent_category}</span>
            {skill.last_used_at && (
              <> · Last used: <span className="text-white/50">{new Date(skill.last_used_at).toLocaleDateString()}</span></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function McpModuleCard({ module }: { module: McpModule }) {
  const domainColors: Record<string, string> = {
    maritime: "text-blue-400 bg-blue-900/20",
    security: "text-red-400 bg-red-900/20",
    "real-estate": "text-emerald-400 bg-emerald-900/20",
    legal: "text-amber-400 bg-amber-900/20",
    orchestration: "text-violet-400 bg-violet-900/20",
  };
  const domainColor = domainColors[module.domain] ?? "text-white/60 bg-white/5";

  return (
    <div className={cn(
      "rounded-xl border p-4",
      module.healthy
        ? "bg-white/5 border-white/10"
        : "bg-red-900/10 border-red-700/30"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              module.healthy ? "bg-emerald-400" : "bg-red-400"
            )} />
            <h4 className="text-sm font-semibold text-white">{module.name}</h4>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider", domainColor)}>
              {module.domain}
            </span>
            <span className="text-[10px] text-white/30">{module.tools} tools</span>
          </div>
        </div>
        <div className={cn("text-xs font-bold", module.healthy ? "text-emerald-400" : "text-red-400")}>
          {module.healthy ? "● Online" : "○ Offline"}
        </div>
      </div>
      {module.details && !module.healthy && (
        <p className="text-[10px] text-red-300/70 mt-2">{module.details}</p>
      )}
    </div>
  );
}

export function SkillsCatalogPanel() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const skillsQuery = useQuery({
    queryKey: ["admin", "skills", categoryFilter, statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      return apiFetch<Skill[]>(`/skills?${params}`);
    },
  });

  const statsQuery = useQuery({
    queryKey: ["admin", "skills", "stats"],
    queryFn: () => apiFetch<SkillStats>("/skills/stats"),
  });

  const mcpHealthQuery = useQuery({
    queryKey: ["admin", "skills", "mcp-health"],
    queryFn: () => apiFetch<McpHealth>("/skills/mcp/health"),
    refetchInterval: 60000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ skillId, status }: { skillId: string; status: string }) =>
      apiFetch(`/skills/${skillId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "skills"] });
    },
  });

  const stats = statsQuery.data;
  const skills = skillsQuery.data ?? [];
  const mcpHealth = mcpHealthQuery.data;

  const categories = stats ? Object.keys(stats.byCategory) : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain size={18} className="text-indigo-400" />
            AI Skills Catalog
          </h2>
          <p className="text-sm text-white/40 mt-0.5">
            Manage the dynamic skills registry, autonomy levels, and composable workflows
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "skills"] })}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-white/40 mt-1">Total Skills</div>
          </div>
          <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/30 p-4">
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
            <div className="text-xs text-white/40 mt-1">Active Skills</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-2xl font-bold text-white">{Object.keys(stats.byCategory).length}</div>
            <div className="text-xs text-white/40 mt-1">Categories</div>
          </div>
          <div className="rounded-xl bg-indigo-900/20 border border-indigo-700/30 p-4">
            <div className="text-xs font-semibold text-white/70 mb-2">Top Skill</div>
            {stats.topByUsage[0] ? (
              <div>
                <div className="text-sm font-bold text-indigo-300 truncate">{stats.topByUsage[0].label}</div>
                <div className="text-xs text-white/40">{stats.topByUsage[0].invocations} calls</div>
              </div>
            ) : <div className="text-xs text-white/30">No usage yet</div>}
          </div>
        </div>
      )}

      {mcpHealth && (
        <div>
          <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
            <Globe size={14} className="text-violet-400" />
            MCP Gateway Status
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto",
              mcpHealth.modules.every(m => m.healthy)
                ? "text-emerald-400 bg-emerald-900/30"
                : "text-amber-400 bg-amber-900/30"
            )}>
              {mcpHealth.modules.filter(m => m.healthy).length}/{mcpHealth.modules.length} Online
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mcpHealth.modules.map(m => (
              <McpModuleCard key={m.moduleId} module={m} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search skills…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50"
          />

          <div className="flex gap-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors", statusFilter === "all" ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300" : "border-white/10 text-white/40 hover:text-white/60")}
            >
              All
            </button>
            {["active", "inactive", "deprecated"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize", statusFilter === s ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300" : "border-white/10 text-white/40 hover:text-white/60")}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setCategoryFilter("all")}
              className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors", categoryFilter === "all" ? "bg-violet-600/20 border-violet-500/40 text-violet-300" : "border-white/10 text-white/40 hover:text-white/60")}
            >
              All Categories
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize", categoryFilter === c ? "bg-violet-600/20 border-violet-500/40 text-violet-300" : "border-white/10 text-white/40 hover:text-white/60")}
              >
                {CATEGORY_ICONS[c]} {c}
              </button>
            ))}
          </div>
        </div>

        {skillsQuery.isLoading ? (
          <div className="text-center py-12 text-white/30 text-sm">Loading skills…</div>
        ) : skills.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">No skills found</div>
        ) : (
          <div className="space-y-3">
            {skills.map(skill => (
              <SkillCard
                key={skill.skill_id}
                skill={skill}
                onToggleStatus={(skillId, status) => updateStatusMutation.mutate({ skillId, status })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AgentGovernancePanel() {
  const pendingQuery = useQuery({
    queryKey: ["admin", "skills", "approvals", "pending"],
    queryFn: () => apiFetch<any[]>("/skills/approvals/pending?limit=20"),
    refetchInterval: 15000,
  });

  const activityStatsQuery = useQuery({
    queryKey: ["admin", "skills", "activity", "stats"],
    queryFn: () => apiFetch<any>("/skills/activity/stats?windowHours=24"),
  });

  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: ({ actionId, notes }: { actionId: string; notes?: string }) =>
      apiFetch(`/skills/approvals/${actionId}/approve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "skills", "approvals"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ actionId, reason }: { actionId: string; reason?: string }) =>
      apiFetch(`/skills/approvals/${actionId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "skills", "approvals"] }),
  });

  const pending = pendingQuery.data ?? [];
  const stats = activityStatsQuery.data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield size={18} className="text-amber-400" />
          Agent Governance
        </h2>
        <p className="text-sm text-white/40 mt-0.5">
          Approval queue, autonomy oversight, and agent activity intelligence
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-2xl font-bold text-white">{stats.totalEvents ?? 0}</div>
            <div className="text-xs text-white/40 mt-1">Events (24h)</div>
          </div>
          <div className="rounded-xl bg-amber-900/20 border border-amber-700/30 p-4">
            <div className="text-2xl font-bold text-amber-400">
              {Math.round((stats.approvalRate ?? 1) * 100)}%
            </div>
            <div className="text-xs text-white/40 mt-1">Approval Rate</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-2xl font-bold text-white">
              {Object.keys(stats.byAgent ?? {}).length}
            </div>
            <div className="text-xs text-white/40 mt-1">Active Agents</div>
          </div>
          <div className="rounded-xl bg-violet-900/20 border border-violet-700/30 p-4">
            <div className="text-xs font-semibold text-white/70 mb-1.5">Top Skill</div>
            {stats.topSkills?.[0] ? (
              <div>
                <div className="text-sm font-bold text-violet-300 truncate">{stats.topSkills[0].skillLabel}</div>
                <div className="text-xs text-white/35">{stats.topSkills[0].count} invocations</div>
              </div>
            ) : <div className="text-xs text-white/25">No data</div>}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <Activity size={14} className="text-amber-400" />
          Pending Approvals
          {pending.length > 0 && (
            <span className="ml-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </h3>

        {pending.length === 0 ? (
          <div className="rounded-xl bg-white/3 border border-white/8 p-8 text-center">
            <CheckCircle2 size={24} className="text-emerald-400/50 mx-auto mb-2" />
            <p className="text-sm text-white/30">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((approval: any) => (
              <div key={approval.actionId} className="rounded-xl bg-amber-900/10 border border-amber-700/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-white">{approval.skillLabel ?? approval.skillId}</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1">{approval.reason}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30">
                      <span>Agent: {approval.agentId}</span>
                      {approval.userId && <span>User: {approval.userId}</span>}
                      <span>{new Date(approval.requestedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => approveMutation.mutate({ actionId: approval.actionId })}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1 text-xs bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 hover:bg-emerald-900/50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={11} />
                      Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate({ actionId: approval.actionId })}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1 text-xs bg-red-900/20 border border-red-700/30 text-red-400 hover:bg-red-900/40 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={11} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats && Object.keys(stats.byEventType ?? {}).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/70 mb-3">Activity Breakdown (24h)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(stats.byEventType ?? {})
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 9)
              .map(([type, count]) => (
                <div key={type} className="rounded-lg bg-white/4 border border-white/8 p-3">
                  <div className="text-sm font-bold text-white">{count as number}</div>
                  <div className="text-[10px] text-white/35 mt-0.5 capitalize">{type.replace(/_/g, " ")}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
