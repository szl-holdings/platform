import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useLocation } from "wouter";
import {
  Zap, Activity, GitBranch, Shield, Radio, Bell, RefreshCw,
  ChevronRight, AlertTriangle, CheckCircle, Clock, XCircle,
  ArrowUpRight, Brain, Layers, Play, Pause, TrendingUp,
} from "lucide-react";

function formatRelative(ts: string | null) {
  if (!ts) return "—";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  return `${m}m ${Math.round((ms % 60000) / 1000)}s`;
}


const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#10b981", info: "#6b7280",
};

const SOURCE_COLORS: Record<string, string> = {
  terra: "#10b981", aegis: "#ef4444", vessels: "#0ea5e9", lyte: "#8b5cf6", alloy: "#4B8BDB",
};

const STATE_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  running: { color: "#4B8BDB", label: "Running", icon: <Activity className="w-3 h-3" /> },
  queued: { color: "#f59e0b", label: "Queued", icon: <Clock className="w-3 h-3" /> },
  waiting_approval: { color: "#8b5cf6", label: "Awaiting Approval", icon: <AlertTriangle className="w-3 h-3" /> },
  completed: { color: "#10b981", label: "Done", icon: <CheckCircle className="w-3 h-3" /> },
  failed: { color: "#ef4444", label: "Failed", icon: <XCircle className="w-3 h-3" /> },
};

const DECISION_STATUS: Record<string, { color: string; label: string }> = {
  propose_only: { color: "#f59e0b", label: "Propose" },
  approval_required: { color: "#8b5cf6", label: "Needs Approval" },
  approved_execute: { color: "#10b981", label: "Approved" },
  blocked_by_policy: { color: "#ef4444", label: "Blocked" },
};

function SectionCard({ title, icon, count, urgent, onClick, children }: {
  title: string; icon: React.ReactNode; count?: number; urgent?: boolean; onClick?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: urgent ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)", background: "rgba(12,18,30,0.95)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: urgent ? "#ef4444" : "rgba(75,139,219,0.7)" }}>{icon}</span>
          <span className="text-xs font-semibold text-white">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: urgent ? "rgba(239,68,68,0.15)" : "rgba(75,139,219,0.15)", color: urgent ? "#ef4444" : "#4B8BDB" }}>
              {count}
            </span>
          )}
        </div>
        {onClick && (
          <button onClick={onClick} className="flex items-center gap-1 text-[10px] hover:opacity-80 transition-opacity" style={{ color: "rgba(75,139,219,0.6)" }}>
            View all <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  );
}

function StatCard({ label, value, color, icon, sub }: { label: string; value: number | string; color: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(12,18,30,0.95)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</div>}
    </div>
  );
}

export default function WorkspaceHome() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: approvals } = useQuery({
    queryKey: ["alloyApprovalsHome"],
    queryFn: async () => {
      try {
        const r = await apiFetch<{ data: unknown[] }>("/alloy/approvals?status=pending&limit=5");
        return r?.data ?? [];
      } catch { return []; }
    },
    refetchInterval: 30000,
  });

  const { data: runsData } = useQuery({
    queryKey: ["alloyRunsHome"],
    queryFn: async () => {
      try {
        const r = await apiFetch<{ data: Array<{ id: number; workflowId: number; state: string; startedAt: string; durationMs: number | null }> }>("/alloy/runs?state=running&limit=5");
        return r?.data ?? [];
      } catch { return []; }
    },
    refetchInterval: 15000,
  });

  const { data: signals } = useQuery({
    queryKey: ["alloySignalsHome"],
    queryFn: async () => {
      try {
        const r = await apiFetch<{ data: Array<{ id: number; source: string; severity: string; title: string; status: string; receivedAt: string }> }>("/alloy/signals?severity=critical&limit=5");
        return r?.data ?? [];
      } catch { return []; }
    },
    refetchInterval: 30000,
  });

  const { data: decisions } = useQuery({
    queryKey: ["alloyDecisionsHome"],
    queryFn: async () => {
      try {
        const r = await apiFetch<{ data: Array<{ id: number; title: string; approvalStatus: string; confidence: number; agentName: string }> }>("/alloy/decisions?status=approval_required&limit=5");
        return r?.data ?? [];
      } catch { return []; }
    },
    refetchInterval: 30000,
  });

  const { data: recentArtifactsData } = useQuery({
    queryKey: ["alloyRecentArtifacts"],
    queryFn: async () => {
      try {
        const r = await apiFetch<{ data: Array<{ id: number; title: string; status: string; createdAt: string; artifactType?: string }> }>("/alloy/artifacts?limit=6");
        return r?.data ?? [];
      } catch { return []; }
    },
    staleTime: 60000,
  });

  const recentArtifacts = recentArtifactsData ?? [];

  const pendingApprovals = approvals ?? [];
  const activeRuns = runsData ?? [];
  const criticalSignals = signals ?? [];
  const pendingDecisions = decisions ?? [];

  const pendingCount = pendingApprovals.length;
  const runCount = activeRuns.length;
  const signalCount = criticalSignals.length;
  const decisionsCount = pendingDecisions.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#4B8BDB" }}>Alloy · Workspace</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Command Home</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Priority view — critical approvals, active agents, and unresolved signals surface first.</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries()}
          className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 shrink-0"
          style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pending Approvals" value={pendingCount} color={pendingCount > 0 ? "#f59e0b" : "#10b981"} icon={<Shield className="w-3.5 h-3.5" />} sub={pendingCount > 0 ? "Action required" : "All clear"} />
        <StatCard label="Active Runs" value={runCount} color="#4B8BDB" icon={<Activity className="w-3.5 h-3.5" />} sub="Running now" />
        <StatCard label="Critical Signals" value={signalCount} color={signalCount > 0 ? "#ef4444" : "#10b981"} icon={<Radio className="w-3.5 h-3.5" />} sub={signalCount > 0 ? "Unresolved" : "All clear"} />
        <StatCard label="Open Decisions" value={decisionsCount} color="#8b5cf6" icon={<Brain className="w-3.5 h-3.5" />} sub="Pending review" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard
          title="Pending Approvals"
          icon={<Shield className="w-4 h-4" />}
          count={pendingCount}
          urgent={pendingCount > 0}
          onClick={() => navigate("/alloy/governance")}
        >
          {pendingApprovals.slice(0, 4).map((a: any) => (
            <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border transition-all hover:border-amber-500/20 cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }} onClick={() => navigate("/alloy/governance")}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a.urgent ? "#ef4444" : "#f59e0b" }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-white truncate">{a.label ?? `Approval #${a.id}`}</div>
                <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {a.role ? `Role: ${a.role}` : ""} · {a.age ?? formatRelative(a.createdAt)}
                </div>
              </div>
              <ChevronRight className="w-3 h-3 shrink-0 mt-1" style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
          ))}
          {pendingCount === 0 && (
            <div className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No pending approvals</div>
          )}
        </SectionCard>

        <SectionCard
          title="Active Agent Runs"
          icon={<Activity className="w-4 h-4" />}
          count={runCount}
          onClick={() => navigate("/alloy/runs")}
        >
          {activeRuns.slice(0, 4).map((r: any) => {
            const cfg = STATE_CONFIG[r.state] ?? STATE_CONFIG.running;
            return (
              <div key={r.id} className="p-2.5 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="text-[11px] font-medium text-white truncate flex-1">{r.name ?? `Run #${r.id}`}</div>
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0" style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}10` }}>
                    {cfg.label}
                  </span>
                </div>
                {r.progress !== undefined && (
                  <div className="h-1 rounded-full overflow-hidden mb-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.progress}%`, background: cfg.color }} />
                  </div>
                )}
                <div className="flex items-center gap-3 text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {r.model && <span className="font-mono">{r.model}</span>}
                  {r.cost !== undefined && <span>${r.cost.toFixed(2)}</span>}
                  {r.latency !== undefined && <span>{r.latency}ms</span>}
                  {r.startedAt && <span>{formatRelative(r.startedAt)}</span>}
                </div>
              </div>
            );
          })}
          {runCount === 0 && (
            <div className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No active runs</div>
          )}
        </SectionCard>

        <SectionCard
          title="Critical Signals"
          icon={<Radio className="w-4 h-4" />}
          count={signalCount}
          urgent={signalCount > 0}
          onClick={() => navigate("/alloy/signals")}
        >
          {criticalSignals.slice(0, 4).map((s: any) => {
            const sevColor = SEVERITY_COLORS[s.severity] ?? "#6b7280";
            const srcColor = SOURCE_COLORS[s.source] ?? "#4B8BDB";
            return (
              <div key={s.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all hover:border-red-500/20" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }} onClick={() => navigate("/alloy/signals")}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: sevColor, boxShadow: `0 0 6px ${sevColor}60` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: srcColor, background: `${srcColor}15` }}>{s.source}</span>
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-bold" style={{ color: sevColor, borderColor: `${sevColor}30`, background: `${sevColor}10` }}>{s.severity}</span>
                  </div>
                  <div className="text-[11px] font-medium text-white truncate">{s.title}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{formatRelative(s.receivedAt)}</div>
                </div>
              </div>
            );
          })}
          {signalCount === 0 && (
            <div className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No critical signals</div>
          )}
        </SectionCard>

        <SectionCard
          title="Pending Decisions"
          icon={<Brain className="w-4 h-4" />}
          count={decisionsCount}
          onClick={() => navigate("/alloy/decisions")}
        >
          {pendingDecisions.slice(0, 4).map((d: any) => {
            const dStatus = DECISION_STATUS[d.approvalStatus ?? d.status] ?? DECISION_STATUS.propose_only;
            const conf = d.confidence ?? 78;
            return (
              <div key={d.id} className="p-2.5 rounded-lg border cursor-pointer transition-all hover:border-violet-500/20" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }} onClick={() => navigate("/alloy/decisions")}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="text-[11px] font-medium text-white line-clamp-2 flex-1">{d.title}</div>
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0 font-bold" style={{ color: dStatus.color, borderColor: `${dStatus.color}30`, background: `${dStatus.color}10` }}>
                    {dStatus.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${conf}%`, background: conf > 80 ? "#10b981" : conf > 60 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <span className="text-[9px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{conf}%</span>
                </div>
                {(d.agentName ?? d.agent) && (
                  <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Agent: {d.agentName ?? d.agent}</div>
                )}
              </div>
            );
          })}
          {decisionsCount === 0 && (
            <div className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No pending decisions</div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent Artifacts"
        icon={<TrendingUp className="w-4 h-4" />}
        onClick={() => navigate("/alloy/documents")}
      >
        <div className="grid md:grid-cols-3 gap-2">
          {recentArtifacts.length === 0 ? (
            <div className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No artifacts yet</div>
          ) : recentArtifacts.map(a => (
            <div key={a.id} className="p-2.5 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
              <div className="text-[11px] font-medium text-white truncate mb-1">{a.title}</div>
              <div className="flex items-center gap-2 text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                <span className={`px-1.5 py-0.5 rounded ${a.status === "published" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>{a.status === "published" ? "Published" : "Pending Review"}</span>
                <span>{formatRelative(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="rounded-xl border p-4" style={{ borderColor: "rgba(75,139,219,0.1)", background: "rgba(75,139,219,0.03)" }}>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(75,139,219,0.5)" }}>Quick Access</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Operator Control", icon: <Shield className="w-3 h-3" />, nav: "/alloy/operator", badge: "New" },
            { label: "Decision Objects", icon: <Brain className="w-3 h-3" />, nav: "/alloy/decisions", badge: "New" },
            { label: "Skill Registry", icon: <Layers className="w-3 h-3" />, nav: "/alloy/skills", badge: "New" },
            { label: "Workflow Orchestration", icon: <GitBranch className="w-3 h-3" />, nav: "/alloy/workflows" },
            { label: "Signal Feed", icon: <Radio className="w-3 h-3" />, nav: "/alloy/signals" },
            { label: "Governance", icon: <CheckCircle className="w-3 h-3" />, nav: "/alloy/governance" },
          ].map(link => (
            <button
              key={link.nav}
              onClick={() => navigate(link.nav)}
              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-all hover:border-blue-400/30 hover:bg-white/5"
              style={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.07)" }}
            >
              {link.icon} {link.label}
              {link.badge && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: "rgba(75,139,219,0.15)", color: "#4B8BDB" }}>{link.badge}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
