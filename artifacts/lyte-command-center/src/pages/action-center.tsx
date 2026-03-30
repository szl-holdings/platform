import { useState } from "react";
import { Zap, Clock, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Users, DollarSign, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  actionItems,
  getActionsForRole,
  roleLabels,
  severityColors,
  signalTypeLabels,
  signals,
  type RoleView,
  type ActionItem,
} from "@/lib/business-data";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const urgencyConfig = {
  immediate: { label: "Immediate", color: "text-red-400 bg-red-500/10 border-red-500/20", border: "border-red-500/20" },
  today: { label: "Today", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", border: "border-orange-500/20" },
  this_week: { label: "This Week", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", border: "border-amber-500/15" },
  next_week: { label: "Next Week", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", border: "border-blue-500/10" },
};

const statusConfig = {
  open: { label: "Open", color: "text-slate-400", icon: <AlertTriangle className="w-3 h-3" /> },
  in_progress: { label: "In Progress", color: "text-cyan-400", icon: <ArrowRight className="w-3 h-3" /> },
  blocked: { label: "Blocked", color: "text-red-400", icon: <AlertTriangle className="w-3 h-3" /> },
  done: { label: "Done", color: "text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" /> },
};

function ActionCard({ action, expanded, onToggle }: { action: ActionItem; expanded: boolean; onToggle: () => void }) {
  const u = urgencyConfig[action.urgency];
  const s = statusConfig[action.status];
  const relatedSignals = signals.filter(sig => action.signalIds.includes(sig.id));

  return (
    <div className={cn("rounded-xl border transition-all", action.urgency === "immediate" ? "border-red-500/20 bg-red-500/[0.03]" : "border-white/5 bg-white/[0.02]")}>
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide", u.color)}>
                {u.label}
              </span>
              <span className={cn("text-[10px] flex items-center gap-1", s.color)}>
                {s.icon}{s.label}
              </span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Due {action.dueBy}</span>
            </div>
            <h3 className="text-sm font-medium text-white/90 leading-snug mb-2">{action.title}</h3>
            <div className="flex items-center gap-3 text-[11px] flex-wrap">
              <span className="flex items-center gap-1 text-slate-400"><Users className="w-3 h-3" />{action.owner}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{action.ownerTeam}</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(action.valueProtected)} protected</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {action.dependencies.length > 0 && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                {action.dependencies.length} dep
              </span>
            )}
            {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {relatedSignals.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Related Signals</div>
              <div className="space-y-1.5">
                {relatedSignals.map(sig => {
                  const c = severityColors[sig.severity];
                  return (
                    <div key={sig.id} className={cn("flex items-center gap-2 p-2 rounded-lg border text-[11px]", c.border, c.bg)}>
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
                      <span className="text-white/80 flex-1 line-clamp-1">{sig.title}</span>
                      <span className={cn("font-mono", c.text)}>{((sig.valueAtRisk / 1_000_000)).toFixed(1)}M</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {action.dependencies.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Dependencies</div>
              <div className="flex flex-wrap gap-2">
                {action.dependencies.map(dep => {
                  const depAction = actionItems.find(a => a.id === dep);
                  return (
                    <span key={dep} className="text-[10px] font-mono px-2 py-1 rounded border border-amber-500/20 text-amber-400 bg-amber-500/5">
                      {dep}: {depAction?.title.slice(0, 40)}...
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
              Mark In Progress
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 transition-colors">
              Reassign
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 transition-colors ml-auto">
              Mark Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActionCenter() {
  const [role, setRole] = useState<RoleView>("executive");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const actions = getActionsForRole(role);

  const immediate = actions.filter(a => a.urgency === "immediate");
  const today = actions.filter(a => a.urgency === "today");
  const thisWeek = actions.filter(a => a.urgency === "this_week");
  const nextWeek = actions.filter(a => a.urgency === "next_week");

  const totalProtected = actions.reduce((sum, a) => sum + a.valueProtected, 0);
  const openCount = actions.filter(a => a.status === "open").length;
  const inProgressCount = actions.filter(a => a.status === "in_progress").length;

  return (
    <div className="max-w-[900px] space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">Action Center</h1>
          <p className="text-sm text-slate-400 mt-1">Prioritized actions · {formatCurrency(totalProtected)} value protected</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {(Object.keys(roleLabels) as RoleView[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                role === r ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
              )}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Actions", value: actions.length, color: "text-white" },
          { label: "Open", value: openCount, color: "text-amber-400" },
          { label: "In Progress", value: inProgressCount, color: "text-cyan-400" },
          { label: "Value Protected", value: formatCurrency(totalProtected), color: "text-emerald-400" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
            <div className={cn("font-display font-bold text-xl", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {immediate.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-red-400" />
            <h2 className="font-display font-semibold text-sm text-red-300">Immediate</h2>
            <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{immediate.length}</span>
          </div>
          <div className="space-y-2">
            {immediate.map(a => (
              <ActionCard
                key={a.id}
                action={a}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {today.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-400" />
            <h2 className="font-display font-semibold text-sm text-orange-300">Today</h2>
            <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">{today.length}</span>
          </div>
          <div className="space-y-2">
            {today.map(a => (
              <ActionCard
                key={a.id}
                action={a}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {thisWeek.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="font-display font-semibold text-sm text-amber-300">This Week</h2>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{thisWeek.length}</span>
          </div>
          <div className="space-y-2">
            {thisWeek.map(a => (
              <ActionCard
                key={a.id}
                action={a}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {nextWeek.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-400" />
            <h2 className="font-display font-semibold text-sm text-blue-300">Next Week</h2>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{nextWeek.length}</span>
          </div>
          <div className="space-y-2">
            {nextWeek.map(a => (
              <ActionCard
                key={a.id}
                action={a}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {actions.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
          <p className="text-sm">No open actions for this role view</p>
        </div>
      )}
    </div>
  );
}
