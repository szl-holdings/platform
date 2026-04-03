import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, User, Shield, ArrowUpRight, Target } from "lucide-react";
import { EmptyState } from "@workspace/shared-ui";
import { actionQueue, type ActionQueueItem } from "@/data/threat-twin";

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

function ActionCard({ item, onComplete, onEscalate }: {
  item: ActionQueueItem;
  onComplete: (id: string) => void;
  onEscalate: (id: string) => void;
}) {
  const ps = PRIORITY_STYLE[item.priority];
  const ss = STATUS_STYLE[item.status];
  const overdue = isDue(item.dueDate) && item.status !== "completed";
  const Icon = TYPE_ICONS[item.type] ?? AlertTriangle;

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

      {item.status !== "completed" && (
        <div className="flex gap-2">
          <button onClick={() => onComplete(item.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: ACCENT_DIM, color: "white" }}>
            <CheckCircle size={12} /> Complete
          </button>
          <button onClick={() => onEscalate(item.id)} className="text-xs px-3 py-1.5 rounded-lg hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            <ArrowUpRight size={12} className="inline mr-1" />Escalate
          </button>
        </div>
      )}
    </div>
  );
}

export default function ActionQueue() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("open");

  const items = actionQueue.map(a => ({
    ...a,
    status: completedIds.has(a.id) ? "completed" as const : a.status,
  }));

  const displayed = items.filter(a =>
    filter === "all" || (filter === "open" && a.status !== "completed") || a.status === filter || a.priority === filter
  );

  const openCount = items.filter(a => a.status !== "completed").length;
  const blockedCount = items.filter(a => a.status === "blocked").length;
  const overdueCount = items.filter(a => isDue(a.dueDate) && a.status !== "completed").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Action Queue</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Pending containment, remediation, investigation, and governance actions
          </p>
        </div>
        {blockedCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "#9b1c1c20", color: "#f87171", border: "1px solid #9b1c1c40" }}>
            <AlertTriangle size={12} /> {blockedCount} blocked
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open", value: openCount, color: "#c04a2a" },
          { label: "Blocked", value: blockedCount, color: "#f87171" },
          { label: "Overdue", value: overdueCount, color: "#c08a2c" },
          { label: "Completed", value: items.filter(a => a.status === "completed").length, color: "#40856a" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
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

      <div className="space-y-3">
        {displayed.length === 0 ? (
          <EmptyState icon={CheckCircle} headline="No actions" description="No actions match the current filter." accentColor={ACCENT} />
        ) : (
          displayed.map(a => (
            <ActionCard
              key={a.id}
              item={a}
              onComplete={id => setCompletedIds(prev => new Set([...prev, id]))}
              onEscalate={id => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
