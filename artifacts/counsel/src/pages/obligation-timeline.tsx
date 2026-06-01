import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Filter,
} from 'lucide-react';
import { useState } from 'react';

interface Obligation {
  id: string;
  matterId: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  assignee: string;
  dependencies: string[];
  filingRequired: boolean;
  privilegeLevel: string;
  courtId?: string;
  consequence?: string;
  completedDate?: string;
}

interface ObligationsResponse {
  obligations: Obligation[];
  provenance?: string;
}

type FilterTab = 'all' | 'overdue' | 'upcoming' | 'complete';

const STATUS_COLORS: Record<string, string> = {
  overdue: 'border-red-500 bg-red-500/10 text-red-400',
  'at-risk': 'border-amber-500 bg-amber-500/10 text-amber-400',
  'in-progress': 'border-violet-500 bg-violet-500/10 text-violet-400',
  complete: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  pending: 'border-violet-500/30 bg-violet-500/5 text-violet-400/60',
};

const DOT_COLORS: Record<string, string> = {
  overdue: 'border-red-500',
  'at-risk': 'border-amber-500',
  'in-progress': 'border-violet-500',
  complete: 'border-emerald-500',
  pending: 'border-violet-500/30',
};

function isOverdue(o: Obligation): boolean {
  return o.status === 'overdue' || o.status === 'at-risk';
}

function isUpcoming(o: Obligation): boolean {
  const days = (new Date(o.dueDate).getTime() - Date.now()) / 86400000;
  return days >= 0 && days <= 30 && o.status !== 'complete';
}

function ProvenanceBadge({ provenance }: { provenance?: string }) {
  if (!provenance) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <Database className="w-2.5 h-2.5" />
      {provenance === 'seeded' ? 'Demo Data' : 'Live DB'}
    </span>
  );
}

function SkeletonObligation() {
  return (
    <div className="relative pl-12">
      <div className="absolute left-[21px] top-4 w-2 h-2 rounded-full border-2 border-violet-500/30 bg-[#060e1a]" />
      <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-4 animate-pulse">
        <div className="h-3 bg-violet-500/10 rounded w-1/2 mb-2" />
        <div className="h-2 bg-violet-500/10 rounded w-3/4" />
      </div>
    </div>
  );
}

export default function ObligationTimeline() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ObligationsResponse>({
    queryKey: ['counsel-obligations'],
    queryFn: () => apiFetch<ObligationsResponse>('/counsel/obligations', { skipAuth: true }),
    staleTime: 30_000,
    retry: 2,
  });

  const snoozeMutation = useMutation({
    mutationFn: (obl: Obligation) =>
      apiFetch(`/counsel/obligations/${obl.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matterId: obl.matterId, status: 'pending' }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counsel-obligations'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: (obl: Obligation) =>
      apiFetch(`/counsel/obligations/${obl.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matterId: obl.matterId,
          status: 'complete',
          completedDate: new Date().toISOString().split('T')[0],
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counsel-obligations'] }),
  });

  const allObligations = data?.obligations ?? [];
  const provenance = data?.provenance;

  const filtered = allObligations.filter((o) => {
    if (filter === 'overdue') return isOverdue(o);
    if (filter === 'upcoming') return isUpcoming(o);
    if (filter === 'complete') return o.status === 'complete';
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  const overdueCount = allObligations.filter(isOverdue).length;
  const upcomingCount = allObligations.filter(isUpcoming).length;

  const nextDeadline = allObligations
    .filter((o) => o.status !== 'complete' && new Date(o.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const daysToNext = nextDeadline
    ? Math.ceil((new Date(nextDeadline.dueDate).getTime() - Date.now()) / 86400000)
    : null;

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: allObligations.length },
    { id: 'overdue', label: 'Overdue / At Risk', count: overdueCount },
    { id: 'upcoming', label: 'Upcoming (30d)', count: upcomingCount },
    { id: 'complete', label: 'Complete' },
  ];

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-violet-100">Obligation Timeline</h1>
          <p className="text-violet-400/60 text-sm">Chronological view of matter deliverables.</p>
        </div>
        <div className="flex items-center gap-3">
          <ProvenanceBadge provenance={provenance} />
          {daysToNext !== null && (
            <div className="bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-xl">
              <div className="text-[10px] font-medium text-violet-400 uppercase tracking-wider">
                Next Deadline
              </div>
              <div className="text-xl font-bold text-violet-100">{daysToNext} Days</div>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {error instanceof Error ? error.message : 'Failed to load obligations'}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-violet-400/40" />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
              filter === tab.id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-violet-400/50 hover:text-violet-400 border border-transparent hover:border-violet-500/20',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] font-mono',
                  filter === tab.id ? 'bg-violet-500/30 text-violet-300' : 'bg-violet-500/10 text-violet-400/60',
                  tab.id === 'overdue' && tab.count > 0 ? 'text-red-400 bg-red-500/10' : '',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative space-y-4">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-violet-500/10" />

        {isLoading ? (
          <>
            <SkeletonObligation />
            <SkeletonObligation />
            <SkeletonObligation />
            <SkeletonObligation />
          </>
        ) : sorted.length === 0 ? (
          <div className="pl-12 py-12 text-center text-violet-400/40 text-sm">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-3 opacity-30" />
            No obligations match this filter
          </div>
        ) : (
          sorted.map((obl) => (
            <div key={obl.id} className="relative pl-12">
              <div
                className={cn(
                  'absolute left-[21px] top-4 w-2 h-2 rounded-full border-2 bg-[#060e1a] z-10',
                  DOT_COLORS[obl.status] ?? 'border-violet-500/30',
                )}
              />

              <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-4 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-violet-100 truncate">{obl.title}</span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border',
                          STATUS_COLORS[obl.status] ?? 'border-violet-500/20 bg-violet-500/5 text-violet-400',
                        )}
                      >
                        {obl.status.replace(/-/g, ' ')}
                      </span>
                      {obl.filingRequired && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-blue-500/20 bg-blue-500/10 text-blue-400">
                          Filing Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-violet-400/60 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(obl.dueDate).toLocaleDateString()}
                      </div>
                      <span>Assigned: {obl.assignee}</span>
                      {obl.courtId && <span className="font-mono">{obl.courtId}</span>}
                    </div>
                    {obl.consequence && (
                      <p className="text-[10px] text-red-400/70 leading-relaxed mt-1">
                        ⚠ {obl.consequence}
                      </p>
                    )}
                  </div>

                  {obl.status !== 'complete' && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => resolveMutation.mutate(obl)}
                        disabled={resolveMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50"
                        title="Mark as resolved"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Resolve
                      </button>
                      {(obl.status === 'overdue' || obl.status === 'at-risk') && (
                        <button
                          onClick={() => snoozeMutation.mutate(obl)}
                          disabled={snoozeMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors disabled:opacity-50"
                          title="Snooze obligation"
                        >
                          <Clock className="w-3 h-3" />
                          Snooze
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
