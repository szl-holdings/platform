import { useState } from "react";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { alloyApi, type AlloyWorkflow, type AlloyWorkflowRun, type AlloyArtifact, type AlloySignal, type FeatureFlag } from "../lib/api";
import {
  Play, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Zap,
  ChevronDown, ChevronRight, Eye, CheckCheck, X as XIcon, ToggleRight, FileText, Users, Flag,
} from "lucide-react";
import { cn } from "../lib/utils";
import { isAuthError } from "@szl-holdings/shared-ui";

function noRetryOn401(failureCount: number, error: unknown): boolean {
  if (isAuthError(error)) return false;
  return failureCount < 1;
}

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: noRetryOn401,
      staleTime: 30_000,
    },
  },
});

const stateColors: Record<string, string> = {
  queued: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  running: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  waiting_approval: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  failed: "text-red-400 bg-red-500/10 border-red-500/20",
  canceled: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

const severityColors: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-amber-400",
  low: "text-blue-400",
  info: "text-slate-400",
};

function WorkflowCard({ workflow }: { workflow: AlloyWorkflow }) {
  const qcInner = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ["alloy-runs", workflow.id],
    queryFn: () => alloyApi.workflows.runs(workflow.id),
    enabled: expanded,
  });

  const trigger = async () => {
    setTriggering(true);
    try {
      await alloyApi.workflows.trigger(workflow.id);
      qcInner.invalidateQueries({ queryKey: ["alloy-runs", workflow.id] });
      qcInner.invalidateQueries({ queryKey: ["alloy-dashboard"] });
      setExpanded(true);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div
      className="rounded-xl border transition-all"
      style={{ borderColor: "rgba(75,139,219,0.12)", background: "rgba(75,139,219,0.02)" }}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-white/90">{workflow.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: "rgba(75,139,219,0.2)", color: "#4B8BDB80", background: "rgba(75,139,219,0.05)" }}>
              {workflow.trigger}
            </span>
            {!workflow.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 border border-slate-500/20">inactive</span>
            )}
          </div>
          {workflow.description && (
            <p className="text-xs text-white/40 leading-relaxed mb-2">{workflow.description}</p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-white/30">
            <span>Runs: <span className="text-white/50">{workflow.runCount}</span></span>
            <span>Output: <span className="text-white/50">{workflow.outputType}</span></span>
            {workflow.requiresApproval && <span className="text-amber-400/70">Requires approval</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={trigger}
            disabled={triggering || !workflow.isActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
            style={{ background: "rgba(75,139,219,0.1)", border: "1px solid rgba(75,139,219,0.25)", color: "#4B8BDB" }}
          >
            {triggering ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Run
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/70 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Runs
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(75,139,219,0.07)" }}>
          <div className="text-[10px] text-white/30 uppercase tracking-widest mt-3 mb-2">Recent Runs</div>
          {runsLoading ? (
            <div className="h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : runs.length === 0 ? (
            <p className="text-[11px] text-white/30 py-2">No runs yet — click Run to trigger.</p>
          ) : (
            <div className="space-y-1.5">
              {runs.slice(0, 5).map(run => (
                <div key={run.id} className="flex items-center gap-3 p-2 rounded-lg text-[11px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className={cn("px-1.5 py-0.5 rounded border text-[10px] capitalize", stateColors[run.state] ?? stateColors.queued)}>
                    {run.state}
                  </span>
                  <span className="text-white/30 font-mono">#{run.id}</span>
                  <span className="text-white/30 ml-auto">{new Date(run.queuedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {run.durationMs && <span className="text-white/25">{run.durationMs}ms</span>}
                  {run.errorMessage && <span className="text-red-400/70 truncate max-w-[200px]">{run.errorMessage}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignalRow({ signal }: { signal: AlloySignal }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <span className={cn("text-[10px] font-mono uppercase mt-0.5 shrink-0", severityColors[signal.severity] ?? "text-white/40")}>
        {signal.severity}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/80 leading-snug">{signal.title}</p>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-white/30">
          <span>{signal.source}</span>
          <span>·</span>
          <span className="capitalize">{signal.status}</span>
          {signal.valueAtRisk && <span className="text-amber-400/60">${(parseFloat(signal.valueAtRisk) / 1000).toFixed(0)}K at risk</span>}
        </div>
      </div>
      <span className="text-[10px] text-white/25 shrink-0">{new Date(signal.receivedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
    </div>
  );
}

function ArtifactCard({ artifact }: { artifact: AlloyArtifact }) {
  const qcInner = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);

  const doAction = async (action: () => Promise<unknown>, label: string) => {
    setLoading(label);
    try {
      await action();
      qcInner.invalidateQueries({ queryKey: ["alloy-artifacts"] });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/80 leading-snug">{artifact.title}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-white/30">
            <span className="capitalize">{artifact.artifactType}</span>
            <span>·</span>
            <span className="capitalize">{artifact.status}</span>
            <span>·</span>
            <span className="capitalize">{artifact.approvalStatus}</span>
          </div>
        </div>
      </div>
      {artifact.approvalStatus === "pending" && (
        <div className="flex items-center gap-2 mt-2">
          <button
            disabled={loading === "approve"}
            onClick={() => doAction(() => alloyApi.artifacts.approve(artifact.id, "Approved via console"), "approve")}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            {loading === "approve" ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <CheckCheck className="w-2.5 h-2.5" />}
            Approve
          </button>
          <button
            disabled={loading === "reject"}
            onClick={() => doAction(() => alloyApi.artifacts.reject(artifact.id, "Rejected via console"), "reject")}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            {loading === "reject" ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <XIcon className="w-2.5 h-2.5" />}
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function FeatureFlagRow({ flag }: { flag: FeatureFlag }) {
  const qcInner = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => alloyApi.featureFlags.update(flag.key, { isEnabled: !flag.isEnabled }),
    onSuccess: () => qcInner.invalidateQueries({ queryKey: ["alloy-flags"] }),
  });

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-white/80">{flag.name}</p>
          <span className="text-[10px] font-mono text-white/30">{flag.key}</span>
        </div>
        {flag.description && <p className="text-[11px] text-white/30 mt-0.5 truncate">{flag.description}</p>}
        <div className="text-[10px] text-white/20 mt-1">
          Rollout: <span className="text-white/40">{flag.rolloutPercentage}%</span>
          {" · "}Updated: <span className="text-white/40">{new Date(flag.updatedAt).toLocaleDateString("en-GB")}</span>
        </div>
      </div>
      <button
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border disabled:opacity-50",
          flag.isEnabled
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20"
        )}
      >
        {toggle.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ToggleRight className="w-3 h-3" />}
        {flag.isEnabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

type AuditEntry = {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  createdAt: string;
};

function AuditRow({ entry }: { entry: AuditEntry }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-blue-400/70">{entry.action}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-white/30 bg-white/5">{entry.resourceType}</span>
          {entry.resourceId && <span className="text-[10px] text-white/25 font-mono">{entry.resourceId}</span>}
        </div>
        {entry.userEmail && <p className="text-[11px] text-white/30 mt-0.5">{entry.userEmail}</p>}
      </div>
      <span className="text-[10px] text-white/20 shrink-0">{new Date(entry.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
    </div>
  );
}

const TABS = [
  { id: "workflows" as const, label: "Workflows", icon: Zap },
  { id: "signals" as const, label: "Signals", icon: AlertTriangle },
  { id: "artifacts" as const, label: "Artifacts", icon: Eye },
  { id: "feature-flags" as const, label: "Flags", icon: Flag },
  { id: "audit" as const, label: "Audit Log", icon: FileText },
  { id: "users" as const, label: "Users", icon: Users },
] as const;

type Tab = typeof TABS[number]["id"];

function ConsoleInner() {
  const [tab, setTab] = useState<Tab>("workflows");

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["alloy-dashboard"],
    queryFn: () => alloyApi.dashboard(),
    refetchInterval: (query) => {
      if (isAuthError(query.state.error)) return false;
      return 30_000;
    },
  });

  const { data: workflows = [], isLoading: wfLoading } = useQuery({
    queryKey: ["alloy-workflows"],
    queryFn: () => alloyApi.workflows.list(),
  });

  const { data: signals = [], isLoading: sigLoading } = useQuery({
    queryKey: ["alloy-signals"],
    queryFn: () => alloyApi.signals.list(),
    enabled: tab === "signals",
  });

  const { data: artifacts = [], isLoading: artLoading } = useQuery({
    queryKey: ["alloy-artifacts"],
    queryFn: () => alloyApi.artifacts.list(),
    enabled: tab === "artifacts",
  });

  const { data: flags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ["alloy-flags"],
    queryFn: () => alloyApi.featureFlags.list(),
    enabled: tab === "feature-flags",
  });

  const { data: auditEntries = [], isLoading: auditLoading } = useQuery({
    queryKey: ["alloy-audit"],
    queryFn: () => alloyApi.audit.list({ limit: 100 }),
    enabled: tab === "audit",
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["alloy-admin-users"],
    queryFn: () => alloyApi.admin.users(),
    enabled: tab === "users",
  });

  const summaryItems = dashboard ? [
    { label: "Active Workflows", value: dashboard.summary.activeWorkflows, color: "#4B8BDB" },
    { label: "Total Runs", value: dashboard.summary.totalRuns, color: "#a78bfa" },
    { label: "Pending Approvals", value: dashboard.summary.pendingApprovals, color: "#f59e0b" },
    { label: "New Signals", value: dashboard.summary.newSignals, color: "#f97316" },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#4B8BDB" }}>Platform Console</div>
        <h1 className="text-3xl font-bold text-white mb-2">Alloy Control Plane</h1>
        <p className="text-white/40 text-sm">Live workflow management, signal monitoring, artifact approvals, and system administration.</p>
      </div>

      {dashLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryItems.map(item => (
            <div key={item.label} className="rounded-xl p-4 border" style={{ borderColor: `${item.color}20`, background: `${item.color}06` }}>
              <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.value}</div>
              <div className="text-[11px] text-white/40">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg flex-wrap" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: tab === t.id ? "rgba(75,139,219,0.12)" : "transparent",
              color: tab === t.id ? "#4B8BDB" : "rgba(255,255,255,0.4)",
              border: tab === t.id ? "1px solid rgba(75,139,219,0.25)" : "1px solid transparent",
            }}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
            {t.id === "artifacts" && dashboard?.summary.pendingApprovals ? (
              <span className="ml-1 px-1 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/20">{dashboard.summary.pendingApprovals}</span>
            ) : null}
            {t.id === "feature-flags" && flags.length > 0 ? (
              <span className="ml-1 px-1 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">{flags.filter(f => f.isEnabled).length}/{flags.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "workflows" && (
        <div className="space-y-3">
          {wfLoading ? (
            [1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)
          ) : (
            workflows.map(wf => <WorkflowCard key={wf.id} workflow={wf} />)
          )}
          {!wfLoading && workflows.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No workflows found.</div>
          )}
        </div>
      )}

      {tab === "signals" && (
        <div className="space-y-2">
          {sigLoading ? (
            [1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />)
          ) : (
            signals.map(sig => <SignalRow key={sig.id} signal={sig} />)
          )}
          {!sigLoading && signals.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No signals ingested yet.</div>
          )}
        </div>
      )}

      {tab === "artifacts" && (
        <div className="space-y-3">
          {artLoading ? (
            [1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)
          ) : (
            artifacts.map(art => <ArtifactCard key={art.id} artifact={art} />)
          )}
          {!artLoading && artifacts.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No artifacts generated yet.</div>
          )}
        </div>
      )}

      {tab === "feature-flags" && (
        <div className="space-y-2">
          {flagsLoading ? (
            [1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)
          ) : (
            (flags as FeatureFlag[]).map(flag => <FeatureFlagRow key={flag.id} flag={flag} />)
          )}
          {!flagsLoading && flags.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No feature flags found.</div>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-white/30">Showing last 100 audit events across all resources</p>
          </div>
          {auditLoading ? (
            [1,2,3,4].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)
          ) : (
            (auditEntries as AuditEntry[]).map(entry => <AuditRow key={entry.id} entry={entry} />)
          )}
          {!auditLoading && auditEntries.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No audit events recorded yet.</div>
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {usersLoading ? (
            [1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />)
          ) : (
            (users).map(user => (
              <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-400">{(user.name ?? user.email)?.[0]?.toUpperCase() ?? "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80">{user.name ?? user.email}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/30">
                    <span>{user.email}</span>
                    <span>·</span>
                    <span className="capitalize">{user.role}</span>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border",
                  user.status === "active"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                )}>
                  {user.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            ))
          )}
          {!usersLoading && users.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConsolePage() {
  return (
    <QueryClientProvider client={qc}>
      <ConsoleInner />
    </QueryClientProvider>
  );
}
