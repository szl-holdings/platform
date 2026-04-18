import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock, User, Shield, ArrowUpRight, Target, RefreshCw } from "lucide-react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { EmptyState } from "@szl-holdings/shared-ui";
import { api } from "../lib/api";

type ActionQueuePriority = "critical" | "high" | "medium" | "low";
type ActionQueueStatus = "open" | "in_progress" | "blocked" | "escalated" | "completed";

interface AuditEntry { actor: string; action: string; at: string; note?: string }

interface ActionQueueItem {
  id: string;
  title: string;
  description: string;
  priority: ActionQueuePriority;
  status: ActionQueueStatus;
  assignedTo?: string;
  dueDate?: string;
  dueAt?: string;
  type?: string;
  blocker?: string;
  incidentId?: string;
  auditTrail: AuditEntry[];
  completedAt?: string;
  createdAt: string;
}

const ACCENT = "hsl(220 72% 56%)";
const ACCENT_DIM = "hsl(220 72% 40%)";

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return `${Math.ceil(Math.abs(diff) / 86400000)}d overdue`;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function isDue(iso?: string) { return iso ? new Date(iso).getTime() < Date.now() : false; }

const PRIORITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#f87171", bg: "#9b1c1c10", border: "#9b1c1c40" },
  high: { color: "#c04a2a", bg: "#c04a2a08", border: "#c04a2a25" },
  medium: { color: "#c08a2c", bg: "#c08a2c08", border: "#c08a2c20" },
  low: { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)" },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open: { color: "#c04a2a", bg: "#c04a2a20" },
  in_progress: { color: "#c08a2c", bg: "#c08a2c20" },
  blocked: { color: "#f87171", bg: "#9b1c1c20" },
  completed: { color: "#40856a", bg: "#40856a20" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  containment: Shield,
  remediation: Target,
  investigation: AlertTriangle,
  governance: User,
  communication: User,
};

function ActionCard({ item, onComplete, onEscalate, completing, escalating }: {
  item: ActionQueueItem;
  onComplete: (id: string) => void;
  onEscalate: (id: string) => void;
  completing: boolean;
  escalating: boolean;
}) {
  const ps = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.low;
  const ss = STATUS_STYLE[item.status] ?? STATUS_STYLE.open;
  const overdue = isDue(item.dueDate) && item.status !== "completed";
  const Icon = (item.type ? TYPE_ICONS[item.type] : null) ?? AlertTriangle;

  return (
    <div className="rounded-xl border p-4 transition-all" style={{ background: ps.bg, borderColor: overdue ? "#c04a2a40" : ps.border }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: `${ps.color}15` }}>
            <Icon size={12} style={{ color: ps.color }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{item.title}</div>
            <div className="text-xs mt-0.5 capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>
              {item.type} action
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: ss.bg, color: ss.color }}>
            {item.status.replace("_", " ")}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
            {item.priority}
          </span>
        </div>
      </div>

      <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{item.description}</p>

      {item.blocker && (
        <div className="flex items-center gap-1.5 text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "#9b1c1c10", border: "1px solid #9b1c1c30" }}>
          <AlertTriangle size={12} style={{ color: "#f87171" }} />
          <span style={{ color: "#f87171" }}>Blocked: {item.blocker}</span>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
        {item.assignedTo && (
          <span className="flex items-center gap-1"><User size={10} />{item.assignedTo}</span>
        )}
        {item.dueDate && (
          <span className="flex items-center gap-1" style={{ color: overdue ? "#c04a2a" : "rgba(255,255,255,0.3)" }}>
            <Clock size={10} />
            {overdue ? "Overdue: " : "Due: "}{relTime(item.dueDate)}
          </span>
        )}
      </div>

      {item.auditTrail && item.auditTrail.length > 0 && (
        <div className="text-[10px] mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>
          Last action: {item.auditTrail[item.auditTrail.length - 1]?.action?.replace(/_/g, " ")} by {item.auditTrail[item.auditTrail.length - 1]?.actor} · {relTime(item.auditTrail[item.auditTrail.length - 1]?.at)}
        </div>
      )}

      {item.status !== "completed" && (
        <div className="flex gap-2">
          <button
            onClick={() => onComplete(item.id)}
            disabled={completing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
            style={{ background: ACCENT_DIM, color: "white" }}
          >
            {completing ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
            {completing ? "Executing..." : "Execute & Complete"}
          </button>
          <button
            onClick={() => onEscalate(item.id)}
            disabled={escalating}
            className="text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            <ArrowUpRight size={12} className="inline mr-1" />Escalate
          </button>
        </div>
      )}

      {item.status === "completed" && item.completedAt && (
        <div className="text-[10px]" style={{ color: "#40856a" }}>
          <CheckCircle size={10} className="inline mr-1" />Completed {relTime(item.completedAt)}
        </div>
      )}
    </div>
  );
}

export default function ActionQueue() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("open");
  const [activeAction, setActiveAction] = useState<{ id: string; type: "complete" | "escalate" } | null>(null);

  const queueQuery = useQuery({
    queryKey: ["action-queue"],
    queryFn: () => api.actionQueue.list(),
    refetchInterval: 15000,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.actionQueue.complete(id, "Executed via Action Queue"),
    onSuccess: (data: { data?: { message?: string } }) => {
      qc.invalidateQueries({ queryKey: ["action-queue"] });
      toast.success(data?.data?.message ?? "Action completed — outcome recorded in audit trail");
      setActiveAction(null);
    },
    onError: () => {
      toast.error("Failed to complete action");
      setActiveAction(null);
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => api.actionQueue.escalate(id),
    onSuccess: (data: { data?: { message?: string } }) => {
      qc.invalidateQueries({ queryKey: ["action-queue"] });
      toast.success(data?.data?.message ?? "Action escalated");
      setActiveAction(null);
    },
    onError: () => {
      toast.error("Failed to escalate action");
      setActiveAction(null);
    },
  });

  const queueData = (queueQuery.data as { data?: { items?: ActionQueueItem[]; openCount?: number; blockedCount?: number; overdueCount?: number; completedCount?: number } } | null)?.data;
  const items: ActionQueueItem[] = queueData?.items ?? [];
  const openCount: number = queueData?.openCount ?? 0;
  const blockedCount: number = queueData?.blockedCount ?? 0;
  const overdueCount: number = queueData?.overdueCount ?? 0;
  const completedCount: number = queueData?.completedCount ?? 0;

  const displayed = items.filter(a =>
    filter === "all"
    || (filter === "open" && a.status !== "completed")
    || a.status === filter
    || a.priority === filter
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Action Queue</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Pending containment, remediation, investigation, and governance actions — all executions recorded in audit trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          {blockedCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "#9b1c1c20", color: "#f87171", border: "1px solid #9b1c1c40" }}>
              <AlertTriangle size={12} /> {blockedCount} blocked
            </span>
          )}
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["action-queue"] })}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} className={queueQuery.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open", value: openCount, color: "#c04a2a" },
          { label: "Blocked", value: blockedCount, color: "#f87171" },
          { label: "Overdue", value: overdueCount, color: "#c08a2c" },
          { label: "Completed", value: completedCount, color: "#40856a" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>
              {queueQuery.isLoading ? <span className="text-zinc-500 text-base">—</span> : m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {["open", "blocked", "in_progress", "completed", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="text-xs px-3 py-1 rounded-lg capitalize transition-colors"
            style={{
              background: filter === f ? "hsl(220 72% 56% / 0.12)" : "rgba(255,255,255,0.04)",
              color: filter === f ? ACCENT : "rgba(255,255,255,0.4)",
              border: `1px solid ${filter === f ? "hsl(220 72% 56% / 0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {queueQuery.isLoading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Loading action queue…</div>
      ) : (
        <div className="space-y-3">
          {displayed.length === 0 ? (
            <EmptyState icon={CheckCircle} headline="No actions" description="No actions match the current filter." accentColor={ACCENT} />
          ) : (
            displayed.map((a: ActionQueueItem) => (
              <ActionCard
                key={a.id}
                item={a}
                onComplete={(id) => { setActiveAction({ id, type: "complete" }); completeMutation.mutate(id); }}
                onEscalate={(id) => { setActiveAction({ id, type: "escalate" }); escalateMutation.mutate(id); }}
                completing={activeAction?.id === a.id && activeAction?.type === "complete" && completeMutation.isPending}
                escalating={activeAction?.id === a.id && activeAction?.type === "escalate" && escalateMutation.isPending}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
