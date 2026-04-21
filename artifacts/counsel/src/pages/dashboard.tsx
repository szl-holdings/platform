import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Briefcase, Clock, Database, Scale, ShieldAlert } from 'lucide-react';

interface Obligation {
  id: string;
  matterId: string;
  title: string;
  status: string;
  dueDate: string;
  assignee: string;
  consequence?: string;
}

interface Matter {
  id: string;
  name: string;
  status: string;
  type: string;
  nextDeadline: string;
  leadCounsel: string;
  estimatedExposure?: number;
  pressureScore: number;
  complexityScore: number;
  obligations: Obligation[];
}

interface MattersResponse {
  matters: Matter[];
  provenance?: string;
}

function SkeletonCard() {
  return (
    <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl animate-pulse">
      <div className="h-3 bg-violet-500/10 rounded w-1/2 mb-3" />
      <div className="h-8 bg-violet-500/10 rounded w-1/4 mb-2" />
      <div className="h-2 bg-violet-500/10 rounded w-3/4" />
    </div>
  );
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

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<MattersResponse>({
    queryKey: ['counsel-matters'],
    queryFn: () => apiFetch<MattersResponse>('/counsel/matters', { skipAuth: true }),
    staleTime: 30_000,
    retry: 2,
  });

  const matters = data?.matters ?? [];
  const provenance = data?.provenance;

  const activeMatters = matters.filter((m) => m.status !== 'closed' && m.status !== 'pending');
  const atRiskMatters = matters.filter(
    (m) => m.status === 'escalated' || m.pressureScore > 80,
  );
  const totalExposure = matters.reduce((acc, m) => acc + (m.estimatedExposure ?? 0), 0);
  const allObligations = matters.flatMap((m) => m.obligations ?? []);
  const overdueObligations = allObligations.filter(
    (o) => o.status === 'overdue' || o.status === 'at-risk',
  );
  const urgentMatters = matters
    .filter((m) => m.pressureScore > 70 || m.status === 'escalated')
    .sort((a, b) => b.pressureScore - a.pressureScore)
    .slice(0, 4);
  const criticalObligations = allObligations
    .filter((o) => o.status === 'overdue' || o.status === 'at-risk')
    .slice(0, 5);

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-violet-100">Legal Matter Command</h1>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Unable to load matter data:{' '}
          {error instanceof Error ? error.message : 'Connection failed'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-violet-100">Legal Matter Command</h1>
          <p className="text-violet-400/60 text-sm">Real-time legal obligation and risk monitoring.</p>
        </div>
        <ProvenanceBadge provenance={provenance} />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-violet-300/70 uppercase">Active Matters</span>
              </div>
              <div className="text-3xl font-bold text-violet-50">{activeMatters.length}</div>
              <div className="text-[10px] text-violet-400/50 mt-1">
                {atRiskMatters.length} currently at risk
              </div>
            </div>

            <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-violet-300/70 uppercase">Overdue / At Risk</span>
              </div>
              <div className="text-3xl font-bold text-violet-50">{overdueObligations.length}</div>
              <div className="text-[10px] text-violet-400/50 mt-1">Requiring immediate escalation</div>
            </div>

            <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-violet-300/70 uppercase">Total Exposure</span>
              </div>
              <div className="text-3xl font-bold text-violet-50">
                {totalExposure > 0 ? `$${(totalExposure / 1_000_000).toFixed(1)}M` : '—'}
              </div>
              <div className="text-[10px] text-violet-400/50 mt-1">Across all active matters</div>
            </div>

            <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Scale className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-violet-300/70 uppercase">Total Matters</span>
              </div>
              <div className="text-3xl font-bold text-violet-50">{matters.length}</div>
              <div className="text-[10px] text-violet-400/50 mt-1">All active legal matters</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-violet-100 mb-4">Urgent Matters</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-violet-500/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : urgentMatters.length === 0 ? (
            <div className="text-center py-8 text-violet-400/40 text-sm">No urgent matters</div>
          ) : (
            <div className="space-y-3">
              {urgentMatters.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-500/10"
                >
                  <div>
                    <div className="text-xs font-medium text-violet-200">{m.name}</div>
                    <div className="text-[10px] text-violet-400/60 mt-0.5">
                      Deadline: {new Date(m.nextDeadline).toLocaleDateString()} · Pressure: {m.pressureScore}/100
                    </div>
                  </div>
                  <div className="text-right">
                    {m.estimatedExposure ? (
                      <div className="text-xs font-bold text-red-400">
                        ${(m.estimatedExposure / 1_000_000).toFixed(1)}M Exposure
                      </div>
                    ) : null}
                    <div className="text-[10px] text-violet-400/50">{m.leadCounsel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-violet-100 mb-4">Critical Obligations</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-violet-500/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : criticalObligations.length === 0 ? (
            <div className="text-center py-8 text-violet-400/40 text-sm">No critical obligations</div>
          ) : (
            <div className="space-y-3">
              {criticalObligations.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-500/10"
                >
                  <div>
                    <div className="text-xs font-medium text-violet-200">{o.title}</div>
                    <div className="text-[10px] text-violet-400/60 mt-0.5">
                      {o.status.toUpperCase()} — {o.assignee}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      o.status === 'overdue'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    )}
                  >
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
