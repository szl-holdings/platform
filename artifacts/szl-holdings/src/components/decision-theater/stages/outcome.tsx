import type { EngineState } from '@/hooks/useDecisionEngine';
import { cn } from '@/lib/utils';

export function OutcomeStage({ engine }: { engine: EngineState }) {
  const o = engine.outcomeRecord;
  if (!o) return <p className="text-sm text-muted-foreground">Recording outcome...</p>;

  const costVariance = ((o.actualCost - o.predictedCost) / o.predictedCost) * 100;
  const hoursVariance = ((o.actualHours - o.predictedHours) / o.predictedHours) * 100;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The Outcome Graph records the measured result and compares it against the prediction,
        building the decision memory for future calibration.
      </p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Predicted vs Actual</h3>
          <span className="text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            {o.outcomeResult}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Predicted Cost', value: `$${o.predictedCost.toFixed(0)}K`, color: '#94a3b8' },
            { label: 'Actual Cost', value: `$${o.actualCost.toFixed(0)}K`, color: '#10b981' },
            {
              label: 'Predicted Resolution',
              value: `${o.predictedHours.toFixed(1)}h`,
              color: '#94a3b8',
            },
            { label: 'Actual Resolution', value: `${o.actualHours.toFixed(1)}h`, color: '#10b981' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center"
            >
              <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
              <p className="text-lg font-bold font-display" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className={cn(
              'rounded-lg border p-3 text-center',
              costVariance <= 0
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-red-500/20 bg-red-500/5',
            )}
          >
            <p className="text-[10px] text-muted-foreground mb-1">Cost Variance</p>
            <p
              className={cn(
                'text-base font-bold',
                costVariance <= 0 ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {costVariance.toFixed(1)}%
            </p>
            <p
              className={cn(
                'text-[9px]',
                costVariance <= 0 ? 'text-emerald-400/70' : 'text-red-400/70',
              )}
            >
              {costVariance <= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </div>
          <div
            className={cn(
              'rounded-lg border p-3 text-center',
              hoursVariance <= 0
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-red-500/20 bg-red-500/5',
            )}
          >
            <p className="text-[10px] text-muted-foreground mb-1">Resolution Variance</p>
            <p
              className={cn(
                'text-base font-bold',
                hoursVariance <= 0 ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {hoursVariance.toFixed(1)}%
            </p>
            <p
              className={cn(
                'text-[9px]',
                hoursVariance <= 0 ? 'text-emerald-400/70' : 'text-red-400/70',
              )}
            >
              {hoursVariance <= 0 ? 'Faster than predicted' : 'Slower than predicted'}
            </p>
          </div>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Outcome ID:</span>
            <span className="font-mono text-foreground">{o.outcomeId}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Domain:</span>
            <span className="text-foreground">{o.domain}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Decision:</span>
            <span className="text-foreground capitalize">{o.decisionStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Confidence:</span>
            <span className="text-foreground">{(o.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
