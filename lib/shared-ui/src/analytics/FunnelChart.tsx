import type { FunnelAnalysisResult } from '@szl-holdings/observability/analytics';

export interface FunnelChartProps {
  result: FunnelAnalysisResult;
  label?: string;
  loading?: boolean;
  showDropoff?: boolean;
}

function getFunnelColor(conversionRate: number): string {
  if (conversionRate >= 80) return 'bg-emerald-500';
  if (conversionRate >= 60) return 'bg-blue-500';
  if (conversionRate >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function FunnelChart({
  result,
  label,
  loading = false,
  showDropoff = true,
}: FunnelChartProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse space-y-3">
        <div className="h-3 w-32 rounded bg-white/10" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 rounded bg-white/10" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    );
  }

  const maxCount = result.steps[0]?.count ?? 1;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{result.totalEntries.toLocaleString()} entered</span>
            <span>·</span>
            <span className="text-emerald-400">
              {result.overallConversionRate.toFixed(1)}% completed
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {result.steps.map((step, idx) => {
          const widthPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const colorClass = getFunnelColor(step.conversionRate);
          const isLast = idx === result.steps.length - 1;

          return (
            <div key={step.stepId} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`h-9 rounded-md flex items-center px-3 transition-all ${colorClass} bg-opacity-20 border border-opacity-30`}
                    style={{ width: `${widthPct}%`, minWidth: '60px' }}
                  >
                    <span className="text-xs font-medium text-white truncate">{step.stepName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-white font-semibold tabular-nums">
                    {step.count.toLocaleString()}
                  </span>
                  {idx > 0 && (
                    <span className="text-zinc-400">{step.conversionRate.toFixed(1)}%</span>
                  )}
                  {step.avgTimeToStep !== undefined && (
                    <span className="text-zinc-500">
                      avg{' '}
                      {step.avgTimeToStep < 60
                        ? `${step.avgTimeToStep.toFixed(0)}s`
                        : `${(step.avgTimeToStep / 60).toFixed(1)}m`}
                    </span>
                  )}
                </div>
              </div>

              {showDropoff && !isLast && step.dropoffRate > 0 && (
                <div className="flex items-center gap-2 pl-3">
                  <div className="w-px h-4 bg-white/10 mx-auto" />
                  <span className="text-xs text-red-400">
                    −{step.dropoffRate.toFixed(1)}% dropped (
                    {Math.round((step.count * step.dropoffRate) / 100).toLocaleString()})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{result.totalEntries.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">Entered</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-400">
            {result.totalCompletions.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-400">
            {result.overallConversionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-zinc-500">Conversion</p>
        </div>
      </div>
    </div>
  );
}
