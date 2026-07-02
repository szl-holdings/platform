import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, DollarSign, Loader2, Scale, Timer, TrendingDown, TrendingUp } from 'lucide-react';

interface ApiObligation {
  id: string;
  matterId: string;
  title: string;
  dueDate: string;
  status: string;
  assignee: string;
  dependencies: string[];
  completedDate?: string;
}

interface ApiMatter {
  id: string;
  name: string;
  status: string;
  leadCounsel: string;
  estimatedExposure?: number;
  pressureScore: number;
  complexityScore: number;
  nextDeadline: string;
  obligations: ApiObligation[];
}

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-violet-500/10 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function CounselPerformance() {
  const { data: mattersData, isLoading: mattersLoading, isError: mattersError } = useQuery<{ matters: ApiMatter[] }>({
    queryKey: ['counsel-matters-performance'],
    queryFn: () => apiFetch<{ matters: ApiMatter[] }>('/counsel/matters'),
  });

  const { data: obligationsData, isLoading: obligationsLoading, isError: obligationsError } = useQuery<{ obligations: ApiObligation[] }>({
    queryKey: ['counsel-obligations-performance'],
    queryFn: () => apiFetch<{ obligations: ApiObligation[] }>('/counsel/obligations'),
  });

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
          <p className="text-sm text-red-300">Failed to load performance data. Please try again.</p>
        </div>
      </div>
    );
  }

  const matters = mattersData?.matters ?? [];
  const allObligations: ApiObligation[] = obligationsData?.obligations ?? matters.flatMap((m) => m.obligations);

  const totalObligations = allObligations.length;
  const overdueObligations = allObligations.filter((o) => o.status === 'overdue').length;
  const atRiskObligations = allObligations.filter((o) => o.status === 'at-risk').length;
  const completedObligations = allObligations.filter((o) => o.status === 'complete').length;
  const onTimeCount = totalObligations - overdueObligations - atRiskObligations;
  const onTimePct = pct(onTimeCount, totalObligations);

  const totalExposure = matters.reduce((sum, m) => sum + (m.estimatedExposure ?? 0), 0);
  const activeMatters = matters.filter((m) => m.status === 'active').length;
  const escalatedMatters = matters.filter((m) => m.status === 'escalated').length;

  const avgPressure = matters.length > 0
    ? Math.round(matters.reduce((sum, m) => sum + m.pressureScore, 0) / matters.length)
    : 0;

  const avgComplexity = matters.length > 0
    ? Math.round(matters.reduce((sum, m) => sum + m.complexityScore, 0) / matters.length)
    : 0;

  const overdueDelays = allObligations
    .filter((o) => o.status === 'overdue')
    .map((o) => daysBetween(o.dueDate, new Date().toISOString()));
  const avgResponseDelay = overdueDelays.length > 0
    ? Math.round(overdueDelays.reduce((a, b) => a + b, 0) / overdueDelays.length)
    : 0;

  const completedWithDates = allObligations.filter((o) => o.completedDate);
  const avgCompletionDelta = completedWithDates.length > 0
    ? Math.round(completedWithDates.reduce((sum, o) => sum + daysBetween(o.dueDate, o.completedDate!), 0) / completedWithDates.length)
    : 0;

  const escalatedExposure = matters
    .filter((m) => m.status === 'escalated')
    .reduce((sum, m) => sum + (m.estimatedExposure ?? 0), 0);
  const budgetVariancePct = totalExposure > 0 ? Math.round((escalatedExposure / totalExposure) * 100) : 0;

  const byCounsel = matters.reduce<Record<string, { name: string; obligations: ApiObligation[]; exposure: number }>>((acc, m) => {
    if (!acc[m.leadCounsel]) {
      acc[m.leadCounsel] = { name: m.leadCounsel, obligations: [], exposure: 0 };
    }
    const matterObligations = allObligations.filter((o) => o.matterId === m.id);
    acc[m.leadCounsel].obligations.push(...matterObligations);
    acc[m.leadCounsel].exposure += m.estimatedExposure ?? 0;
    return acc;
  }, {});

  const counselPerf = Object.values(byCounsel).map((c) => {
    const total = c.obligations.length;
    const overdue = c.obligations.filter((o) => o.status === 'overdue').length;
    const risk = c.obligations.filter((o) => o.status === 'at-risk').length;
    const onTime = total - overdue - risk;
    return {
      name: c.name,
      total,
      onTimePct: pct(onTime, total),
      overdueCount: overdue,
      exposure: c.exposure,
    };
  }).sort((a, b) => b.onTimePct - a.onTimePct);

  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-4 h-4 text-violet-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">
            Intelligence · Counsel Performance
          </span>
        </div>
        <h1 className="text-2xl font-bold text-violet-100">Counsel Performance</h1>
        <p className="text-violet-400/60 text-sm">
          On-time delivery, matter complexity, and exposure metrics across all active matters.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-1">On-Time</div>
          <div className={cn('text-3xl font-bold', onTimePct >= 80 ? 'text-emerald-400' : onTimePct >= 60 ? 'text-amber-400' : 'text-red-400')}>
            {onTimePct}%
          </div>
          <ProgressBar value={onTimePct} color={onTimePct >= 80 ? 'bg-emerald-500' : onTimePct >= 60 ? 'bg-amber-500' : 'bg-red-500'} />
        </div>
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-1">Active Matters</div>
          <div className="text-3xl font-bold text-violet-50">{activeMatters}</div>
          {escalatedMatters > 0 && (
            <div className="text-[10px] text-amber-400 mt-1">{escalatedMatters} escalated</div>
          )}
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-red-300/70 mb-1">Overdue Oblig.</div>
          <div className="text-3xl font-bold text-red-400">{overdueObligations}</div>
          {atRiskObligations > 0 && (
            <div className="text-[10px] text-amber-400 mt-1">{atRiskObligations} at risk</div>
          )}
        </div>
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-1">Total Exposure</div>
          <div className="text-xl font-bold text-violet-50">
            ${(totalExposure / 1_000_000).toFixed(1)}M
          </div>
          <div className="text-[10px] text-violet-400/60 mt-1">across {matters.length} matters</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-1">Avg Pressure Score</div>
          <div className={cn('text-2xl font-bold', avgPressure >= 80 ? 'text-red-400' : avgPressure >= 60 ? 'text-amber-400' : 'text-emerald-400')}>
            {avgPressure}/100
          </div>
          <ProgressBar value={avgPressure} color={avgPressure >= 80 ? 'bg-red-500' : avgPressure >= 60 ? 'bg-amber-500' : 'bg-emerald-500'} />
        </div>
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-1">Avg Complexity Score</div>
          <div className={cn('text-2xl font-bold', avgComplexity >= 80 ? 'text-red-400' : avgComplexity >= 60 ? 'text-amber-400' : 'text-violet-200')}>
            {avgComplexity}/100
          </div>
          <ProgressBar value={avgComplexity} color={avgComplexity >= 80 ? 'bg-red-500' : avgComplexity >= 60 ? 'bg-amber-500' : 'bg-violet-500'} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Timer className="w-3.5 h-3.5 text-violet-400" />
            <h2 className="text-xs font-semibold text-violet-100 uppercase tracking-wider">Response Time</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-violet-400/60">Avg Overdue Delay</span>
                <span className={cn('font-bold', avgResponseDelay >= 14 ? 'text-red-400' : avgResponseDelay >= 7 ? 'text-amber-400' : 'text-emerald-400')}>
                  {avgResponseDelay > 0 ? `+${avgResponseDelay}d` : 'On time'}
                </span>
              </div>
              <ProgressBar
                value={Math.min(avgResponseDelay * 4, 100)}
                color={avgResponseDelay >= 14 ? 'bg-red-500' : avgResponseDelay >= 7 ? 'bg-amber-500' : 'bg-emerald-500'}
              />
              <div className="text-[10px] text-violet-400/40 mt-1">{overdueDelays.length} overdue obligation{overdueDelays.length !== 1 ? 's' : ''} contributing</div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-violet-400/60">Avg Completion Delta</span>
                <span className={cn('font-bold', avgCompletionDelta > 0 ? 'text-amber-400' : avgCompletionDelta < 0 ? 'text-emerald-400' : 'text-violet-200')}>
                  {avgCompletionDelta > 0 ? `+${avgCompletionDelta}d late` : avgCompletionDelta < 0 ? `${Math.abs(avgCompletionDelta)}d early` : 'On time'}
                </span>
              </div>
              <div className="text-[10px] text-violet-400/40">{completedWithDates.length} completed obligation{completedWithDates.length !== 1 ? 's' : ''} with resolution dates</div>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-3.5 h-3.5 text-violet-400" />
            <h2 className="text-xs font-semibold text-violet-100 uppercase tracking-wider">Budget Variance</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-violet-400/60">Exposure at Escalation Risk</span>
                <span className={cn('font-bold', budgetVariancePct >= 30 ? 'text-red-400' : budgetVariancePct >= 15 ? 'text-amber-400' : 'text-emerald-400')}>
                  {budgetVariancePct}%
                </span>
              </div>
              <ProgressBar
                value={budgetVariancePct}
                color={budgetVariancePct >= 30 ? 'bg-red-500' : budgetVariancePct >= 15 ? 'bg-amber-500' : 'bg-emerald-500'}
              />
              <div className="text-[10px] text-violet-400/40 mt-1">
                ${(escalatedExposure / 1_000_000).toFixed(1)}M escalated of ${(totalExposure / 1_000_000).toFixed(1)}M total
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-violet-400/60">Matters in Escalation</span>
                <span className={cn('font-bold', escalatedMatters > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                  {escalatedMatters} / {matters.length}
                </span>
              </div>
              <div className="text-[10px] text-violet-400/40">
                {escalatedMatters === 0 ? 'No matters currently escalated.' : `${escalatedMatters} matter${escalatedMatters !== 1 ? 's' : ''} escalated — financial review recommended.`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-violet-500/10">
          <h2 className="text-xs font-semibold text-violet-100 uppercase tracking-wider">
            Performance by Lead Counsel
          </h2>
        </div>
        <div className="divide-y divide-violet-500/5">
          {counselPerf.map((c) => (
            <div key={c.name} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-violet-100 mb-1">{c.name}</div>
                <div className="text-[10px] text-violet-400/50">
                  {c.total} obligations · ${(c.exposure / 1_000_000).toFixed(1)}M exposure
                </div>
              </div>
              <div className="w-24 text-right">
                <div className={cn('text-sm font-bold', c.onTimePct >= 80 ? 'text-emerald-400' : c.onTimePct >= 60 ? 'text-amber-400' : 'text-red-400')}>
                  {c.onTimePct}%
                </div>
                <div className="text-[10px] text-violet-400/40">on-time</div>
              </div>
              <div className="w-20 text-right">
                {c.overdueCount > 0 ? (
                  <div className="flex items-center justify-end gap-1 text-red-400">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-xs font-medium">{c.overdueCount} late</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1 text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">On track</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {counselPerf.length === 0 && (
            <div className="px-5 py-8 text-center text-[11px] text-violet-400/40">
              No performance data available.
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-violet-500/10">
          <h2 className="text-xs font-semibold text-violet-100 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            Obligation Status Breakdown
          </h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Complete', count: completedObligations, color: 'bg-emerald-500', icon: CheckCircle2, textColor: 'text-emerald-400' },
            { label: 'In Progress', count: allObligations.filter((o) => o.status === 'in-progress').length, color: 'bg-violet-500', icon: Clock, textColor: 'text-violet-400' },
            { label: 'Pending', count: allObligations.filter((o) => o.status === 'pending').length, color: 'bg-zinc-500', icon: Clock, textColor: 'text-zinc-400' },
            { label: 'At Risk', count: atRiskObligations, color: 'bg-amber-500', icon: AlertTriangle, textColor: 'text-amber-400' },
            { label: 'Overdue', count: overdueObligations, color: 'bg-red-500', icon: AlertTriangle, textColor: 'text-red-400' },
          ].map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className={cn('font-medium', row.textColor)}>{row.label}</span>
                <span className="text-violet-300/70">{row.count} / {totalObligations}</span>
              </div>
              <ProgressBar
                value={pct(row.count, totalObligations)}
                color={row.color}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
