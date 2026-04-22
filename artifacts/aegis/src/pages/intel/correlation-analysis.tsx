import { cn } from '@szl-holdings/shared-ui/utils';
import {
  GitBranch,
} from 'lucide-react';

const correlationMatrix = [
  { feature1: 'Revenue', feature2: 'Marketing Spend', correlation: 0.87, trend: 'stable' as const },
  { feature1: 'Revenue', feature2: 'User Growth', correlation: 0.92, trend: 'rising' as const },
  { feature1: 'Revenue', feature2: 'Churn Rate', correlation: -0.78, trend: 'stable' as const },
  {
    feature1: 'User Growth',
    feature2: 'Feature Adoption',
    correlation: 0.84,
    trend: 'rising' as const,
  },
  {
    feature1: 'User Growth',
    feature2: 'NPS Score',
    correlation: 0.71,
    trend: 'declining' as const,
  },
  {
    feature1: 'Churn Rate',
    feature2: 'Support Tickets',
    correlation: 0.65,
    trend: 'rising' as const,
  },
  {
    feature1: 'Marketing Spend',
    feature2: 'Lead Volume',
    correlation: 0.89,
    trend: 'stable' as const,
  },
  {
    feature1: 'Lead Volume',
    feature2: 'Conversion Rate',
    correlation: 0.56,
    trend: 'declining' as const,
  },
  {
    feature1: 'Feature Adoption',
    feature2: 'Retention',
    correlation: 0.91,
    trend: 'stable' as const,
  },
  {
    feature1: 'Infrastructure Cost',
    feature2: 'User Growth',
    correlation: 0.73,
    trend: 'rising' as const,
  },
  {
    feature1: 'API Latency',
    feature2: 'User Satisfaction',
    correlation: -0.82,
    trend: 'stable' as const,
  },
  {
    feature1: 'Team Size',
    feature2: 'Deploy Frequency',
    correlation: 0.44,
    trend: 'declining' as const,
  },
];

const features = [
  'Revenue',
  'Marketing Spend',
  'User Growth',
  'Churn Rate',
  'Feature Adoption',
  'NPS Score',
];

function getCorrelationColor(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 0.8)
    return value > 0 ? 'bg-emerald-500/40 text-emerald-300' : 'bg-red-500/40 text-red-300';
  if (abs >= 0.6)
    return value > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400';
  if (abs >= 0.4)
    return value > 0 ? 'bg-emerald-500/10 text-emerald-400/70' : 'bg-red-500/10 text-red-400/70';
  return 'bg-muted/30 text-muted-foreground';
}

function getCorrelationForPair(f1: string, f2: string): number | null {
  const entry = correlationMatrix.find(
    (c) => (c.feature1 === f1 && c.feature2 === f2) || (c.feature1 === f2 && c.feature2 === f1),
  );
  return entry ? entry.correlation : null;
}

export default function CorrelationAnalysis() {
  const strongPositive = correlationMatrix.filter((c) => c.correlation >= 0.8).length;
  const strongNegative = correlationMatrix.filter((c) => c.correlation <= -0.7).length;
  const weakCorrelations = correlationMatrix.filter((c) => Math.abs(c.correlation) < 0.5).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-primary" />
          Correlation Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Feature correlation and relationship mapping across data dimensions
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Strong Positive
          </p>
          <p className="text-2xl font-bold text-emerald-400">{strongPositive}</p>
          <p className="text-xs text-muted-foreground">correlations ≥ 0.80</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Strong Negative
          </p>
          <p className="text-2xl font-bold text-red-400">{strongNegative}</p>
          <p className="text-xs text-muted-foreground">correlations ≤ -0.70</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weak</p>
          <p className="text-2xl font-bold text-muted-foreground">{weakCorrelations}</p>
          <p className="text-xs text-muted-foreground">|correlation| &lt; 0.50</p>
        </div>
      </div>

      <div className="bg-card/60 border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Correlation Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-2 text-xs text-muted-foreground font-medium text-left" />
                {features.map((f) => (
                  <th
                    key={f}
                    className="p-2 text-[10px] text-muted-foreground font-medium text-center uppercase tracking-wider"
                    style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 100 }}
                  >
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f1) => (
                <tr key={f1}>
                  <td className="p-2 text-xs text-foreground font-medium whitespace-nowrap">
                    {f1}
                  </td>
                  {features.map((f2) => {
                    if (f1 === f2)
                      return (
                        <td key={f2} className="p-1">
                          <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center text-xs font-mono text-primary">
                            1.00
                          </div>
                        </td>
                      );
                    const val = getCorrelationForPair(f1, f2);
                    return (
                      <td key={f2} className="p-1">
                        <div
                          className={cn(
                            'w-12 h-12 rounded flex items-center justify-center text-xs font-mono',
                            val !== null
                              ? getCorrelationColor(val)
                              : 'bg-muted/10 text-muted-foreground/30',
                          )}
                        >
                          {val !== null ? val.toFixed(2) : '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card/60 border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">All Correlations</h3>
        <div className="space-y-2">
          {correlationMatrix
            .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
            .map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b border-border/30 last:border-0"
              >
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-foreground">{c.feature1}</span>
                  <span className="text-xs text-muted-foreground">↔</span>
                  <span className="text-sm text-foreground">{c.feature2}</span>
                </div>
                <div className="w-32">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        c.correlation > 0 ? 'bg-emerald-400' : 'bg-red-400',
                      )}
                      style={{ width: `${Math.abs(c.correlation) * 100}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    'text-sm font-mono w-16 text-right',
                    c.correlation > 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {c.correlation > 0 ? '+' : ''}
                  {c.correlation.toFixed(2)}
                </span>
                <span
                  className={cn(
                    'text-xs capitalize px-2 py-0.5 rounded-full',
                    c.trend === 'rising'
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : c.trend === 'declining'
                        ? 'bg-red-400/10 text-red-400'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {c.trend}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
