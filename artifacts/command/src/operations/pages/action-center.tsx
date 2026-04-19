// @ts-nocheck
import { useState, useEffect } from "react";
import { Zap, Clock, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Users, DollarSign, ArrowRight, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRealtimeChannel } from "@szl-holdings/shared-ui/use-realtime-channel";
import { doctrineEventBus } from "@szl-holdings/observability";
import { DoctrineLayerBadge } from "@szl-holdings/shared-ui/doctrine-layer-badge";
import { cn } from "@lyte/lib/utils";
import { resolveTimeZone } from "@szl-holdings/shared-ui/utils";
import { api, type LyteAction } from "@lyte/lib/api";
import { LyteGraphQLPanel } from "@lyte/components/graphql-data-panel";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "TBD";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: resolveTimeZone(),
  }).format(new Date(iso));
}

const urgencyConfig = {
  immediate: { label: "Immediate", color: "text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20", border: "border-[#c45a4a]/20" },
  today: { label: "Today", color: "text-[#c8953c] bg-[#c8953c]/10 border-[#c8953c]/20", border: "border-[#c8953c]/20" },
  this_week: { label: "This Week", color: "text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/20", border: "border-[#d4a054]/15" },
  next_week: { label: "Next Week", color: "text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/20", border: "border-[#4a90b8]/10" },
};

const statusConfig = {
  open: { label: "Open", color: "text-slate-400", icon: <AlertTriangle className="w-3 h-3" /> },
  in_progress: { label: "In Progress", color: "text-cyan-400", icon: <ArrowRight className="w-3 h-3" /> },
  blocked: { label: "Blocked", color: "text-[#c45a4a]", icon: <AlertTriangle className="w-3 h-3" /> },
  done: { label: "Done", color: "text-[#6b8f71]", icon: <CheckCircle2 className="w-3 h-3" /> },
  resolved: { label: "Resolved", color: "text-[#6b8f71]", icon: <CheckCircle2 className="w-3 h-3" /> },
};

type UrgencyKey = keyof typeof urgencyConfig;
type StatusKey = keyof typeof statusConfig;

function priorityToUrgency(priority?: string): UrgencyKey {
  if (priority === "urgent" || priority === "critical") return "immediate";
  if (priority === "high") return "today";
  if (priority === "medium") return "this_week";
  return "next_week";
}

interface DisplayAction {
  id: string;
  title: string;
  urgency: UrgencyKey;
  status: StatusKey;
  owner: string;
  ownerTeam: string;
  dueBy: string;
  valueProtected: number;
  signalIds: string[];
  dependencies: string[];
  description?: string;
  backendId?: number;
}

function stateToStatus(state: string): StatusKey {
  const map: Record<string, StatusKey> = {
    new: "open",
    acknowledged: "open",
    assigned: "in_progress",
    escalated: "blocked",
    resolved: "resolved",
    dismissed: "done",
  };
  return map[state] ?? "open";
}

function liveActionToDisplay(a: LyteAction): DisplayAction {
  const meta = (a.metadata ?? {}) as Record<string, unknown>;
  return {
    id: `A-${a.id}`,
    title: a.title,
    urgency: priorityToUrgency(a.priority ?? a.urgency),
    status: stateToStatus(a.state),
    owner: a.assignedTo ?? a.owner ?? "Unassigned",
    ownerTeam: (meta.team as string) ?? a.ownerTeam ?? a.signalCategory ?? "Platform",
    dueBy: formatDate(a.dueAt ?? a.dueBy),
    valueProtected: a.valueAtRisk ? parseFloat(a.valueAtRisk) : (a.valueProtected ?? 0),
    signalIds: a.signalId ? [`S-${a.signalId}`] : [],
    dependencies: Array.isArray(meta.dependencies) ? (meta.dependencies as string[]) : [],
    description: a.description,
    backendId: a.id,
  };
}


function ActionCard({ action, expanded, onToggle, onUpdate }: {
  action: DisplayAction;
  expanded: boolean;
  onToggle: () => void;
  onUpdate?: (id: number, status: string) => void;
}) {
  const u = urgencyConfig[action.urgency] ?? urgencyConfig.next_week;
  const s = statusConfig[action.status] ?? statusConfig.open;
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!action.backendId || !onUpdate) return;
    setTransitioning(newStatus);
    await onUpdate(action.backendId, newStatus);
    setTransitioning(null);
  };

  return (
    <div className={cn("rounded-xl border transition-all", action.urgency === "immediate" ? "border-[#c45a4a]/20 bg-[#c45a4a]/[0.03]" : "border-white/5 bg-white/[0.02]")}>
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
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />Due {action.dueBy}
              </span>
            </div>
            <h3 className="text-sm font-medium text-white/90 leading-snug mb-2">{action.title}</h3>
            <div className="flex items-center gap-3 text-[11px] flex-wrap">
              <span className="flex items-center gap-1 text-slate-400"><Users className="w-3 h-3" />{action.owner}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{action.ownerTeam}</span>
              {action.valueProtected > 0 && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-[#6b8f71] font-mono flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(action.valueProtected)} protected</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {action.dependencies.length > 0 && (
              <span className="text-[10px] text-[#d4a054] bg-[#d4a054]/10 px-1.5 py-0.5 rounded border border-[#d4a054]/20">
                {action.dependencies.length} dep
              </span>
            )}
            {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {action.description && (
            <p className="text-sm text-slate-400 leading-relaxed">{action.description}</p>
          )}
          {action.dependencies.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Dependencies</div>
              <div className="flex flex-wrap gap-2">
                {action.dependencies.map(dep => (
                  <span key={dep} className="text-[10px] font-mono px-2 py-1 rounded border border-[#d4a054]/20 text-[#d4a054] bg-[#d4a054]/5">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {action.status !== "in_progress" && action.status !== "done" && action.status !== "resolved" && (
              <button
                disabled={!!transitioning || !action.backendId}
                onClick={() => handleStatusUpdate("in_progress")}
                className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {transitioning === "in_progress" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                Mark In Progress
              </button>
            )}
            {action.status !== "done" && action.status !== "resolved" && (
              <button
                disabled={!!transitioning || !action.backendId}
                onClick={() => handleStatusUpdate("done")}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#6b8f71]/20 bg-[#6b8f71]/5 text-[#6b8f71] hover:bg-[#6b8f71]/10 transition-colors ml-auto disabled:opacity-50 flex items-center gap-1.5"
              >
                {transitioning === "done" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Mark Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActionCenter() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: liveActions = [], isLoading } = useQuery({
    queryKey: ["lyte-actions"],
    queryFn: () => api.actions.list(),
    refetchInterval: 300_000,
  });

  const { lastMessage: wsLyteMsg } = useRealtimeChannel("lyte-metrics");
  useEffect(() => {
    if (!wsLyteMsg) return;
    queryClient.invalidateQueries({ queryKey: ["lyte-actions"] });
  }, [wsLyteMsg, queryClient]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.actions.update(id, { state: status === "done" ? "resolved" : status === "in_progress" ? "assigned" : status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lyte-actions"] });
    },
  });

  const actions: DisplayAction[] = liveActions.map(liveActionToDisplay);

  const immediate = actions.filter(a => a.urgency === "immediate");
  const today = actions.filter(a => a.urgency === "today");
  const thisWeek = actions.filter(a => a.urgency === "this_week");
  const nextWeek = actions.filter(a => a.urgency === "next_week");

  const totalProtected = actions.reduce((sum, a) => sum + a.valueProtected, 0);
  const openCount = actions.filter(a => a.status === "open").length;
  const inProgressCount = actions.filter(a => a.status === "in_progress").length;

  const handleUpdate = async (id: number, status: string) => {
    await updateMutation.mutateAsync({ id, status });
  };

  useEffect(() => {
    if (immediate.length > 0) {
      doctrineEventBus.emit({
        type: "decision",
        sourceApp: "lyte",
        layer: "DECIDE",
        severity: "warning",
        title: `${immediate.length} immediate action${immediate.length > 1 ? "s" : ""} pending decision`,
        description: `Lyte Action Center: ${immediate.length} immediate action(s) require decision. ${openCount} total open items.`,
        entitiesInvolved: immediate.slice(0, 3).map(a => a.title),
        context: {
          source: "action-center",
          sourceApp: "lyte",
          severity: "high",
          confidence: 0.85,
          impactedEntities: immediate.slice(0, 5).map(a => a.title),
          causalFactors: ["priority escalation", "value-at-risk threshold", "signal correlation"],
          suggestedNextAction: "Review immediate items and assign ownership before SLA expiry",
          businessImpact: `${formatCurrency(totalProtected)} value protected — ${immediate.length} action(s) require immediate decision`,
          operationalImpact: `${openCount} total open actions pending; ${inProgressCount} in progress`,
          layer: "DECIDE",
          timestamp: Date.now(),
        },
        metadata: { immediateCount: immediate.length, openCount, totalProtected, source: "action-center", live: true },
      });
    }
  }, [immediate.length]);

  const sections = [
    { key: "immediate", items: immediate, label: "Immediate", icon: Zap, color: "text-[#c45a4a]", badgeColor: "text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20" },
    { key: "today", items: today, label: "Today", icon: Clock, color: "text-[#c8953c]", badgeColor: "text-[#c8953c] bg-[#c8953c]/10 border-[#c8953c]/20" },
    { key: "this_week", items: thisWeek, label: "This Week", icon: Clock, color: "text-[#d4a054]", badgeColor: "text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/15" },
    { key: "next_week", items: nextWeek, label: "Next Week", icon: Clock, color: "text-[#4a90b8]", badgeColor: "text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/10" },
  ];

  return (
    <div className="max-w-[900px] space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="font-display font-bold text-2xl text-white tracking-tight">Action Center</h1>
            <DoctrineLayerBadge appId="lyte" variant="compact" />
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#6b8f71]/30 bg-[#6b8f71]/10 text-[#6b8f71] font-mono uppercase tracking-wide">Live</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Prioritized actions{totalProtected > 0 ? ` · ${formatCurrency(totalProtected)} value protected` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Actions", value: isLoading ? "—" : actions.length, color: "text-white", accent: "rgba(255,255,255,0.1)" },
          { label: "Open", value: isLoading ? "—" : openCount, color: "text-[#d4a054]", accent: "rgba(212,160,84,0.1)" },
          { label: "In Progress", value: isLoading ? "—" : inProgressCount, color: "text-cyan-400", accent: "rgba(34,211,238,0.1)" },
          { label: "Value Protected", value: isLoading ? "—" : formatCurrency(totalProtected), color: "text-[#6b8f71]", accent: "rgba(107,143,113,0.1)" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4 border border-white/5 relative overflow-hidden" style={{ background: stat.accent }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${stat.accent.replace("0.1", "0.6")}, transparent)` }} />
            <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
            <div className={cn("font-display font-bold text-xl", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {!isLoading && actions.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-3">Priority Distribution</div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            {[
              { count: immediate.length, color: "#c45a4a", label: "Immediate" },
              { count: today.length, color: "#c8953c", label: "Today" },
              { count: thisWeek.length, color: "#d4a054", label: "This Week" },
              { count: nextWeek.length, color: "#4a90b8", label: "Next Week" },
            ].filter(b => b.count > 0).map((band) => (
              <div
                key={band.label}
                style={{ flex: band.count, background: band.color, opacity: 0.75, transition: "flex 0.4s ease", borderRadius: "2px" }}
                title={`${band.label}: ${band.count}`}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            {[
              { count: immediate.length, color: "#c45a4a", label: "Immediate" },
              { count: today.length, color: "#c8953c", label: "Today" },
              { count: thisWeek.length, color: "#d4a054", label: "This Week" },
              { count: nextWeek.length, color: "#4a90b8", label: "Next Week" },
            ].map((band) => (
              <div key={band.label} className="flex items-center gap-1.5">
                <div style={{ width: "6px", height: "6px", borderRadius: "2px", background: band.color }} />
                <span style={{ fontSize: "10px", color: "#64748b" }}>{band.label} <span style={{ color: band.color, fontWeight: 700 }}>{band.count}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />)}
        </div>
      ) : (
        <>
          {sections.map(({ key, items, label, icon: Icon, color, badgeColor }) => items.length > 0 && (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("w-4 h-4", color)} />
                <h2 className={cn("font-display font-semibold text-sm", color)}>{label}</h2>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", badgeColor)}>{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(a => (
                  <ActionCard
                    key={a.id}
                    action={a}
                    expanded={expandedId === a.id}
                    onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    onUpdate={useLive ? handleUpdate : undefined}
                  />
                ))}
              </div>
            </div>
          ))}

          {actions.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-[#6b8f71]" />
              <p className="text-sm">No open actions</p>
            </div>
          )}
        </>
      )}

      <LyteGraphQLPanel />
    </div>
  );
}
