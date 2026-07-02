import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Clock, Link2, Loader2 } from 'lucide-react';

interface ApiObligation {
  id: string;
  matterId: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  assignee: string;
  dependencies: string[];
  privilegeLevel: string;
  filingRequired: boolean;
  courtId?: string;
  consequence?: string;
  completedDate?: string;
}

interface ApiMatter {
  id: string;
  name: string;
  obligations: ApiObligation[];
}

function statusDot(status: string) {
  if (status === 'overdue') return 'border-red-500';
  if (status === 'at-risk') return 'border-amber-500';
  if (status === 'in-progress') return 'border-violet-500';
  return 'border-violet-500/30';
}

function statusBadge(status: string) {
  if (status === 'overdue') return 'bg-red-500/10 text-red-400';
  if (status === 'at-risk') return 'bg-amber-500/10 text-amber-400';
  if (status === 'in-progress') return 'bg-violet-500/10 text-violet-400';
  return 'bg-violet-500/5 text-violet-400/70';
}

export default function DependencyGraph() {
  const { data: mattersData, isLoading: mattersLoading, isError: mattersError } = useQuery<{ matters: ApiMatter[] }>({
    queryKey: ['counsel-matters-deps'],
    queryFn: () => apiFetch<{ matters: ApiMatter[] }>('/counsel/matters'),
  });

  const { data: obligationsData, isLoading: obligationsLoading, isError: obligationsError } = useQuery<{ obligations: ApiObligation[] }>({
    queryKey: ['counsel-obligations-deps'],
    queryFn: () => apiFetch<{ obligations: ApiObligation[] }>('/counsel/obligations'),
  });

  const matters = mattersData?.matters ?? [];
  const firstMatter = matters[0];

  const allObligations: (ApiObligation & { matterName: string })[] = obligationsData?.obligations
    ? obligationsData.obligations.map((o) => ({
        ...o,
        matterName: matters.find((m) => m.id === o.matterId)?.name ?? o.matterId,
      }))
    : matters.flatMap((m) => m.obligations.map((o) => ({ ...o, matterName: m.name })));

  const firstMatterObligations = allObligations.filter((o) => o.matterId === firstMatter?.id);
  const blockedObligations = allObligations.filter((o) => o.dependencies.length > 0 && o.status === 'at-risk');
  const totalLinks = allObligations.reduce((acc, o) => acc + o.dependencies.length, 0);

  const isLoading = mattersLoading || obligationsLoading;
  const isError = mattersError || obligationsError;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">Failed to load dependency data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-violet-100">Dependency Graph</h1>
        <p className="text-violet-400/60 text-sm">
          Mapping matter dependencies and blocking events.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-6 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%">
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-violet-500"
                  />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative z-10 w-full max-w-lg space-y-6">
              {firstMatter ? (
                <div className="space-y-8">
                  <div className="flex justify-center">
                    <div className="px-4 py-2 bg-violet-500/20 border border-violet-500/40 rounded-lg text-xs font-bold text-violet-100">
                      {firstMatter.name} (Goal)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {firstMatterObligations
                      .filter((o) => o.dependencies.length === 0)
                      .map((o) => (
                        <div key={o.id} className="relative">
                          <div
                            className={cn(
                              'p-3 rounded-lg border text-[10px] space-y-1',
                              o.status === 'overdue'
                                ? 'bg-red-500/10 border-red-500/40'
                                : 'bg-violet-500/5 border-violet-500/20',
                            )}
                          >
                            <div className="font-bold text-violet-100">{o.title}</div>
                            <div className="text-violet-400/60 uppercase">{o.status}</div>
                          </div>
                          <div className="absolute top-1/2 -right-6 text-violet-500/40">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}

                    {firstMatterObligations
                      .filter((o) => o.dependencies.length > 0)
                      .map((o) => (
                        <div
                          key={o.id}
                          className={cn(
                            'p-3 rounded-lg border text-[10px] space-y-1',
                            o.status === 'at-risk'
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-violet-500/5 border-violet-500/20',
                          )}
                        >
                          <div className="font-bold text-violet-100">{o.title}</div>
                          <div className="text-violet-400/60 uppercase">{o.status}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-violet-400/40 text-sm text-center">No matters found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-violet-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Blocking Events
            </h3>
            {blockedObligations.length === 0 ? (
              <p className="text-[11px] text-violet-400/40">No blocked obligations.</p>
            ) : (
              <div className="space-y-3">
                {blockedObligations.map((o) => {
                  const depTitle = allObligations.find((dep) => o.dependencies.includes(dep.id))?.title;
                  return (
                    <div key={o.id} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-1">
                      <div className="text-xs font-medium text-amber-200">{o.title}</div>
                      {depTitle && (
                        <div className="text-[10px] text-amber-400/60">
                          Blocked by: {depTitle}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-violet-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-violet-400" />
              Dependency Map Stats
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-violet-400/60">Critical Path Confidence</span>
                  <span className="text-violet-100">
                    {allObligations.length > 0
                      ? `${Math.round((allObligations.filter((o) => o.status !== 'overdue' && o.status !== 'at-risk').length / allObligations.length) * 100)}%`
                      : '—'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-violet-500/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500"
                    style={{
                      width: allObligations.length > 0
                        ? `${Math.round((allObligations.filter((o) => o.status !== 'overdue' && o.status !== 'at-risk').length / allObligations.length) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <div className="text-[10px] text-violet-400/60 uppercase">Nodes</div>
                  <div className="text-lg font-bold text-violet-100">{allObligations.length}</div>
                </div>
                <div className="p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <div className="text-[10px] text-violet-400/60 uppercase">Links</div>
                  <div className="text-lg font-bold text-violet-100">{totalLinks}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-violet-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              Obligation Status
            </h3>
            <div className="space-y-2">
              {allObligations.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full border-2 bg-[#060e1a] shrink-0', statusDot(o.status))} />
                  <span className="text-[10px] text-violet-200/70 truncate flex-1">{o.title}</span>
                  <span className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded uppercase', statusBadge(o.status))}>
                    {o.status}
                  </span>
                </div>
              ))}
              {allObligations.length > 6 && (
                <p className="text-[10px] text-violet-400/40 pt-1">+{allObligations.length - 6} more</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
