import type { CohortAnalysisResult } from '@szl-holdings/observability/analytics';

export interface CohortMatrixProps {
  result: CohortAnalysisResult;
  label?: string;
  loading?: boolean;
  maxPeriods?: number;
}

function getCellColor(retentionRate: number): string {
  if (retentionRate >= 80) return 'bg-emerald-500 text-white';
  if (retentionRate >= 60) return 'bg-emerald-500/60 text-white';
  if (retentionRate >= 40) return 'bg-yellow-500/60 text-white';
  if (retentionRate >= 20) return 'bg-orange-500/50 text-white';
  if (retentionRate > 0) return 'bg-red-500/40 text-white';
  return 'bg-white/5 text-zinc-600';
}

export function CohortMatrix({
  result,
  label,
  loading = false,
  maxPeriods = 8,
}: CohortMatrixProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
        <div className="h-3 w-32 rounded bg-white/10 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-2">
              {[...Array(maxPeriods)].map((_, j) => (
                <div key={j} className="h-8 w-12 rounded bg-white/10" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxPeriodCount = Math.max(...result.cohorts.map((c) => c.periods.length), 1);
  const displayPeriods = Math.min(maxPeriods, maxPeriodCount);

  const periodHeaders = Array.from({ length: displayPeriods }, (_, i) =>
    i === 0 ? 'Week 0' : `W${i}`,
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
          <span className="text-xs text-zinc-500">
            Avg retention:{' '}
            <span className="text-white font-medium">
              {result.overallRetentionRate.toFixed(1)}%
            </span>
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="text-xs border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="text-left text-zinc-500 pr-3 pb-2 font-normal whitespace-nowrap">
                Cohort
              </th>
              <th className="text-center text-zinc-500 pb-2 font-normal px-1">Size</th>
              {periodHeaders.map((header) => (
                <th key={header} className="text-center text-zinc-500 pb-2 font-normal px-1 w-12">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.cohorts.map((cohort) => (
              <tr key={cohort.cohortLabel}>
                <td className="text-zinc-400 pr-3 py-0.5 whitespace-nowrap">
                  {cohort.cohortLabel}
                </td>
                <td className="text-center text-zinc-500 px-1 py-0.5 tabular-nums">
                  {cohort.size.toLocaleString()}
                </td>
                {Array.from({ length: displayPeriods }, (_, i) => {
                  const period = cohort.periods[i];
                  return (
                    <td key={i} className="px-1 py-0.5">
                      {period ? (
                        <div
                          className={`rounded text-center tabular-nums py-1 px-0.5 text-xs font-medium min-w-[44px] ${getCellColor(period.retentionRate)}`}
                          title={`${period.retentionRate.toFixed(1)}% (${period.activeEntities} of ${period.cohortSize})`}
                        >
                          {i === 0 ? '100%' : `${period.retentionRate.toFixed(0)}%`}
                        </div>
                      ) : (
                        <div className="rounded text-center py-1 px-0.5 text-xs text-zinc-700 min-w-[44px]">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-zinc-500">Retention:</span>
        {[
          { label: '80%+', color: 'bg-emerald-500' },
          { label: '60-80%', color: 'bg-emerald-500/60' },
          { label: '40-60%', color: 'bg-yellow-500/60' },
          { label: '20-40%', color: 'bg-orange-500/50' },
          { label: '<20%', color: 'bg-red-500/40' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
            <span className="text-xs text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
