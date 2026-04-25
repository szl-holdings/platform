import { cn } from '@lyte/lib/utils';
import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Hourglass,
  Play,
  RefreshCw,
  RotateCcw,
  StopCircle,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

interface WorkflowRun {
  id: number;
  workflowId: number;
  state: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'canceled';
  trigger?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  queuedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  retryCount: number;
  maxRetries?: number | null;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

const stateStyles: Record<
  string,
  { label: string; color: string; icon: typeof Clock; pulse?: boolean }
> = {
  queued: {
    label: 'Queued',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    icon: Hourglass,
  },
  running: {
    label: 'Running',
    color: 'text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/20',
    icon: Play,
    pulse: true,
  },
  waiting_approval: {
    label: 'Awaiting Approval',
    color: 'text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/20',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/20',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20',
    icon: XCircle,
  },
  canceled: {
    label: 'Canceled',
    color: 'text-muted-foreground bg-white/5 border-white/10',
    icon: StopCircle,
  },
};

const filterLabels: Record<string, string> = {
  all: 'All',
  queued: 'Queued',
  running: 'Running',
  waiting_approval: 'Awaiting Approval',
  completed: 'Completed',
  failed: 'Failed',
  canceled: 'Canceled',
};

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDuration(ms?: number | null) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export default function RunViewer() {
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [selected, setSelected] = useState<WorkflowRun | null>(null);
  const qc = useQueryClient();

  const {
    data: resp,
    isLoading,
    error,
  } = useStandardQuery<PaginatedResponse<WorkflowRun>>({
    queryKey: ['admin-runs', stateFilter],
    queryFn: () => apiFetch(`/alloy/runs${stateFilter !== 'all' ? `?state=${stateFilter}` : ''}`),
    refetchInterval: 10000,
  });

  const retryMutation = useStandardMutation({
    mutationFn: (id: number) => apiFetch(`/alloy/runs/${id}/retry`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-runs'] }),
  });

  const cancelMutation = useStandardMutation({
    mutationFn: (id: number) => apiFetch(`/alloy/runs/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-runs'] }),
  });

  const runs = resp?.data ?? [];
  const total = resp?.meta?.total ?? 0;

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Workflow Runs
        </h1>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Failed to load runs — API unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Workflow Runs
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Counsel workflow execution history and state
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{total} total runs</span>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['admin-runs'] })}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(filterLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStateFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              stateFilter === key
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : runs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Play className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No workflow runs found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Run ID</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">
                  Workflow
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">
                  Queued
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">
                  Duration
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">State</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const s = stateStyles[run.state] ?? stateStyles.queued;
                const StateIcon = s.icon;
                return (
                  <tr
                    key={run.id}
                    className="border-b border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelected(run)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-muted-foreground">#{run.id}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground font-mono text-[10px]">
                      WF-{run.workflowId}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {timeAgo(run.queuedAt)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-muted-foreground">
                      {formatDuration(run.durationMs)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          s.color,
                        )}
                      >
                        <StateIcon className={cn('w-2.5 h-2.5', s.pulse && 'animate-pulse')} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        {(run.state === 'running' || run.state === 'queued') && (
                          <button
                            onClick={() => cancelMutation.mutate(run.id)}
                            disabled={cancelMutation.isPending}
                            className="px-2 py-1 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                        {run.state === 'failed' && (
                          <button
                            onClick={() => retryMutation.mutate(run.id)}
                            disabled={retryMutation.isPending}
                            className="px-2 py-1 rounded text-[10px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/20 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display font-bold text-base mb-1">
              Run #{selected.id} — WF-{selected.workflowId}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Queued {timeAgo(selected.queuedAt)}
            </p>
            <dl className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div>
                <dt className="text-muted-foreground mb-0.5">State</dt>
                <dd>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      stateStyles[selected.state]?.color,
                    )}
                  >
                    {stateStyles[selected.state]?.label ?? selected.state}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Duration</dt>
                <dd className="font-mono">{formatDuration(selected.durationMs)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Started</dt>
                <dd className="font-mono">
                  {selected.startedAt ? timeAgo(selected.startedAt) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-0.5">Retries</dt>
                <dd>
                  {selected.retryCount} / {selected.maxRetries ?? 3}
                </dd>
              </div>
            </dl>
            {selected.errorMessage && (
              <div className="bg-[#c45a4a]/10 border border-[#c45a4a]/20 rounded-lg p-3 text-xs text-[#c45a4a] mb-4">
                <span className="font-medium block mb-1">Error</span>
                {selected.errorMessage}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {selected.state === 'failed' && (
                <button
                  onClick={() => {
                    retryMutation.mutate(selected.id);
                    setSelected(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/20 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
