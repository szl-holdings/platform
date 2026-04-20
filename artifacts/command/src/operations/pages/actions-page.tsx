import { useActions, useUpdateAction } from '@lyte/hooks/use-lyte';
import { cn } from '@lyte/lib/utils';
import { CheckCircle, ChevronRight, Clock, RefreshCw, User, Zap } from 'lucide-react';
import { useState } from 'react';

type ActionRole = 'executive_viewer' | 'operator' | 'analyst';

const urgencyColors: Record<string, string> = {
  immediate: 'text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20',
  today: 'text-[#c8953c] bg-[#c8953c]/10 border-[#c8953c]/20',
  this_week: 'text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/20',
  next_week: 'text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/20',
};

const stateColors: Record<string, string> = {
  open: 'text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20',
  in_progress: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  blocked: 'text-[#c8953c] bg-[#c8953c]/10 border-[#c8953c]/20',
  resolved: 'text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/20',
  done: 'text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/20',
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function ActionDrawer({
  action,
  onClose,
  onTransition,
}: {
  action: any;
  onClose: () => void;
  onTransition: (id: number, state: string) => void;
}) {
  const transitions = [
    {
      label: 'Mark In Progress',
      state: 'in_progress',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    },
    {
      label: 'Mark Resolved',
      state: 'resolved',
      color: 'text-[#6b8f71] border-[#6b8f71]/30 bg-[#6b8f71]/10',
    },
    {
      label: 'Mark Blocked',
      state: 'blocked',
      color: 'text-[#c8953c] border-[#c8953c]/30 bg-[#c8953c]/10',
    },
  ];
  const history = (action.stateHistory as Array<{ from: string; to: string; at: string }>) ?? [];
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        className="w-full max-w-lg bg-[#0c1626] border-l border-white/10 flex flex-col h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wide',
                stateColors[action.state] ?? stateColors.open,
              )}
            >
              {action.state}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
          <h2 className="text-sm font-semibold text-white">{action.title}</h2>
          {action.description && (
            <p className="text-[11px] text-slate-400 mt-1">{action.description}</p>
          )}
        </div>
        <div className="p-5 border-b border-white/5 space-y-2">
          {action.owner && (
            <div className="flex items-center gap-2 text-[11px]">
              <User className="w-3 h-3 text-slate-500" />
              <span className="text-slate-400">{action.owner}</span>
              {action.ownerTeam && <span className="text-slate-600">· {action.ownerTeam}</span>}
            </div>
          )}
          {action.valueProtected > 0 && (
            <div className="text-[11px] text-[#6b8f71] font-mono">
              {formatCurrency(action.valueProtected)} protected
            </div>
          )}
          {action.dueBy && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" /> Due: {action.dueBy}
            </div>
          )}
          {action.notes && (
            <div className="text-[11px] text-slate-300 bg-white/[0.03] rounded p-2 border border-white/5 mt-2">
              {action.notes}
            </div>
          )}
        </div>
        {history.length > 0 && (
          <div className="p-5 border-b border-white/5">
            <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">History</h3>
            <div className="space-y-1.5">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <div className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                  <span className="text-slate-500">{h.from}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-slate-400">{h.to}</span>
                  <span className="ml-auto text-slate-600">
                    {new Date(h.at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-5">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Transition</h3>
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t.state}
                onClick={() => {
                  onTransition(action.id, t.state);
                  onClose();
                }}
                className={cn(
                  'text-[10px] px-3 py-1.5 rounded-lg border font-medium transition-all hover:opacity-80',
                  t.color,
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActionsPage() {
  const [role, setRole] = useState<ActionRole>('operator');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const { data: actions = [], isLoading, isError, refetch } = useActions();
  const updateAction = useUpdateAction();
  const [selectedAction, setSelectedAction] = useState<any | null>(null);

  const roleMap: Record<ActionRole, string> = {
    executive_viewer: 'Executive',
    operator: 'Operator',
    analyst: 'Analyst',
  };

  const filtered = actions.filter((a) => {
    if (stateFilter !== 'all' && a.state !== stateFilter) return false;
    return true;
  });

  const openCount = actions.filter((a) => a.state === 'open').length;
  const inProgressCount = actions.filter((a) => a.state === 'in_progress').length;
  const blockedCount = actions.filter((a) => a.state === 'blocked').length;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#d4a054]" />
            <span className="text-xs font-medium uppercase tracking-widest text-[#d4a054]">
              Lyte · Action Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Action Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Assigned actions, state transitions, escalations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            {(Object.keys(roleMap) as ActionRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  role === r
                    ? 'bg-[#d4a054]/20 text-[#d4a054] border border-[#d4a054]/30'
                    : 'text-slate-400 hover:text-white',
                )}
              >
                {roleMap[r]}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', value: openCount, color: 'text-[#c45a4a]' },
          { label: 'In Progress', value: inProgressCount, color: 'text-cyan-400' },
          { label: 'Blocked', value: blockedCount, color: 'text-[#c8953c]' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-[10px] text-slate-500 mb-1">{c.label}</div>
            <div className={cn('text-2xl font-bold', c.color)}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-slate-500">Filter:</span>
        {['all', 'open', 'in_progress', 'blocked', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setStateFilter(f)}
            className={cn(
              'text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all',
              stateFilter === f
                ? 'bg-[#d4a054]/10 border-[#d4a054]/30 text-[#d4a054]'
                : 'border-white/5 text-slate-500 hover:text-white',
            )}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-500">{filtered.length} actions</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-[#d4a054] border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-slate-400">Loading actions…</span>
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-[#c45a4a]/20 bg-[#c45a4a]/5 p-4 text-sm text-[#c45a4a]">
          Failed to load actions. Check API connectivity.
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl border border-white/5 p-12 text-center">
          <CheckCircle className="w-10 h-10 text-[#6b8f71]/20 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No actions match current filters</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((action) => {
          const sc = stateColors[action.state] ?? stateColors.open;
          const uc = urgencyColors[action.urgency ?? ''] ?? '';
          return (
            <div
              key={action.id}
              className={cn(
                'rounded-xl border bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition-all',
                action.state === 'open'
                  ? 'border-[#c45a4a]/10'
                  : action.state === 'blocked'
                    ? 'border-[#c8953c]/10'
                    : 'border-white/5',
              )}
              onClick={() => setSelectedAction(action)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {action.urgency && (
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wide font-mono',
                          uc,
                        )}
                      >
                        {action.urgency.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white/90 leading-tight mb-1">
                    {action.title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    {action.owner && (
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {action.owner}
                      </span>
                    )}
                    {action.dueBy && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {action.dueBy}
                      </span>
                    )}
                    {(action.valueProtected ?? 0) > 0 && (
                      <span className="text-[#6b8f71] font-mono">
                        {formatCurrency(action.valueProtected ?? 0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wide',
                      sc,
                    )}
                  >
                    {action.state}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedAction && (
        <ActionDrawer
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onTransition={(id, state) => updateAction.mutate({ id, state })}
        />
      )}
    </div>
  );
}
