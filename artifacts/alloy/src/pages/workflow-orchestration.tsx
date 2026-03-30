import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import { GitBranch, User, Clock, ArrowRight, ExternalLink, CheckCircle, AlertTriangle, RefreshCw, Play, Pause, XCircle } from "lucide-react";
import { useState } from "react";

interface Workflow {
  id: number;
  orgId: number;
  name: string;
  description?: string | null;
  status: string;
  product: string;
  kind?: string | null;
  config?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function useWorkflows() {
  return useQuery({
    queryKey: ["alloyWorkflows"],
    queryFn: async () => {
      const resp = await apiFetch<Workflow[] | { data: Workflow[] }>("/alloy/workflows");
      if (resp && typeof resp === "object" && "data" in resp) return resp.data;
      return resp as Workflow[];
    },
  });
}

function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Workflow>) => {
      return await apiFetch<Workflow>(`/alloy/workflows/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    },
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ["alloyWorkflows"] });
      const previous = qc.getQueriesData({ queryKey: ["alloyWorkflows"] });
      qc.setQueriesData({ queryKey: ["alloyWorkflows"] }, (old: Workflow[] | undefined) => {
        if (!old) return old;
        return old.map(w => w.id === id ? { ...w, ...data } : w);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyWorkflows"] }),
  });
}

function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workflowId: number) => {
      return await apiFetch<{ id: number }>("/alloy/runs", { method: "POST", body: JSON.stringify({ workflowId }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyRuns"] }),
  });
}

const statusColors: Record<string, { color: string; label: string; bg: string; border: string }> = {
  active: { color: "#10b981", label: "Active", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  paused: { color: "#f59e0b", label: "Paused", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  draft: { color: "#6b7280", label: "Draft", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
  archived: { color: "#4b5563", label: "Archived", bg: "rgba(75,85,99,0.08)", border: "rgba(75,85,99,0.2)" },
  error: { color: "#ef4444", label: "Error", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
};

function WorkflowDrawer({ workflow, onClose, onUpdate, onRunNow }: { workflow: Workflow; onClose: () => void; onUpdate: (id: number, data: Partial<Workflow>) => void; onRunNow: (id: number) => void }) {
  const s = statusColors[workflow.status] ?? statusColors.active;
  const meta = workflow.metadata as Record<string, unknown> ?? {};
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div className="w-full max-w-lg bg-[#0c1420] border-l border-white/10 flex flex-col h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <h2 className="text-sm font-semibold text-white">{workflow.name}</h2>
          {workflow.description && <p className="text-[11px] text-slate-400 mt-1">{workflow.description}</p>}
          {workflow.kind && <p className="text-[10px] text-slate-500 mt-1">Kind: {workflow.kind}</p>}
        </div>
        {Object.keys(meta).length > 0 && (
          <div className="p-5 border-b border-white/5">
            <div className="text-[10px] font-medium text-slate-500 mb-2">Metadata</div>
            <pre className="text-[10px] text-slate-400 overflow-auto bg-white/3 rounded p-2 border border-white/5">{JSON.stringify(meta, null, 2)}</pre>
          </div>
        )}
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {workflow.status !== "active" && (
              <button onClick={() => { onUpdate(workflow.id, { status: "active" }); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:opacity-80 transition-all flex items-center gap-1">
                <Play className="w-3 h-3" /> Activate
              </button>
            )}
            {workflow.status === "active" && (
              <button onClick={() => { onUpdate(workflow.id, { status: "paused" }); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:opacity-80 transition-all flex items-center gap-1">
                <Pause className="w-3 h-3" /> Pause
              </button>
            )}
            <button onClick={() => { onRunNow(workflow.id); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium flex items-center gap-1" style={{ color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
              <Play className="w-3 h-3" /> Run Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowOrchestration() {
  const { data: workflows = [], isLoading, isError, refetch } = useWorkflows();
  const updateWorkflow = useUpdateWorkflow();
  const startRun = useStartRun();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const filtered = workflows.filter(w => statusFilter === "all" || w.status === statusFilter);
  const active = workflows.filter(w => w.status === "active");
  const paused = workflows.filter(w => w.status === "paused");
  const error = workflows.filter(w => w.status === "error");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4" style={{ color: "#00d4ff" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#00d4ff" }}>Alloy · Workflow Orchestration</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Workflow Orchestration</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Visual workflow management — step owners, SLA tracking, blocked steps, and reroute capabilities.</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active", value: active.length, color: "#10b981" },
          { label: "Paused", value: paused.length, color: "#f59e0b" },
          { label: "Error", value: error.length, color: "#ef4444" },
          { label: "Total", value: workflows.length, color: "#00d4ff" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Filter:</span>
        {["all", "active", "paused", "draft", "error"].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className="text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all"
            style={{ background: statusFilter === f ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)", borderColor: statusFilter === f ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.07)", color: statusFilter === f ? "#00d4ff" : "rgba(255,255,255,0.4)" }}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{filtered.length} workflows</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading workflows…</span>
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Failed to load workflows. Check API connectivity.
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <GitBranch className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No workflows found</p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Create a workflow via the API or import from config</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map(w => {
          const s = statusColors[w.status] ?? statusColors.active;
          const isError = w.status === "error";
          const isPaused = w.status === "paused";
          const meta = w.metadata as Record<string, unknown> ?? {};
          const owner = (meta.owner as string) ?? undefined;
          const team = (meta.team as string) ?? undefined;
          const slaDeadline = (meta.sla_deadline as string) ?? undefined;
          const valueAtRisk = (meta.value_at_risk as number) ?? 0;

          return (
            <div
              key={w.id}
              className="rounded-xl border p-5 cursor-pointer hover:bg-white/[0.02] transition-all"
              style={{
                borderColor: isError ? "rgba(239,68,68,0.2)" : isPaused ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.07)",
                background: isError ? "rgba(239,68,68,0.02)" : "rgba(255,255,255,0.01)",
              }}
              onClick={() => setSelectedWorkflow(w)}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>{s.label}</span>
                    {w.kind && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{w.kind}</span>}
                  </div>
                  <div className="text-sm font-semibold text-white mb-0.5">{w.name}</div>
                  {w.description && <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{w.description}</div>}
                  <div className="text-[10px] flex items-center gap-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {owner && <span className="flex items-center gap-1"><User className="w-3 h-3" />{owner}</span>}
                    {team && <span>{team}</span>}
                    {slaDeadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />SLA: {slaDeadline}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {valueAtRisk > 0 && (
                    <>
                      <div className="text-sm font-bold" style={{ color: "#f59e0b" }}>
                        ${valueAtRisk >= 1_000_000 ? `${(valueAtRisk / 1_000_000).toFixed(1)}M` : valueAtRisk >= 1_000 ? `${(valueAtRisk / 1_000).toFixed(0)}K` : valueAtRisk}
                      </div>
                      <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>value at risk</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                {w.status === "active" && (
                  <button
                    onClick={() => updateWorkflow.mutate({ id: w.id, status: "paused" })}
                    className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                    style={{ color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
                  >
                    <Pause className="w-3 h-3" /> Pause
                  </button>
                )}
                {w.status !== "active" && (
                  <button
                    onClick={() => updateWorkflow.mutate({ id: w.id, status: "active" })}
                    className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                    style={{ color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
                  >
                    <Play className="w-3 h-3" /> Activate
                  </button>
                )}
                <button
                  onClick={() => startRun.mutate(w.id)}
                  disabled={startRun.isPending}
                  className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{ color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}
                >
                  Run Now
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedWorkflow && (
        <WorkflowDrawer
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onUpdate={(id, data) => updateWorkflow.mutate({ id, ...data })}
          onRunNow={(id) => startRun.mutate(id)}
        />
      )}
    </div>
  );
}
