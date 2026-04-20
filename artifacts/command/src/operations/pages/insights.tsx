import { narrativeInsights, severityColors } from '@lyte/lib/business-data';
import { cn } from '@lyte/lib/utils';
import { Activity, Minus, TrendingDown, TrendingUp } from 'lucide-react';

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function InsightsPage() {
  return (
    <div className="max-w-[860px] space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">
          Narrative Intelligence
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Raw signals translated into operating intelligence — decision-ready, not data-dump
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Insights', value: narrativeInsights.length, color: 'text-white' },
          {
            label: 'Worsening',
            value: narrativeInsights.filter((i) => i.trend === 'worsening').length,
            color: 'text-[#c45a4a]',
          },
          {
            label: 'Total VaR Covered',
            value: formatCurrency(narrativeInsights.reduce((sum, i) => sum + i.valueAtRisk, 0)),
            color: 'text-[#d4a054]',
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
            <div className={cn('font-display font-bold text-xl', stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {narrativeInsights.map((ins) => {
          const c = severityColors[ins.severity];
          const TrendIcon =
            ins.trend === 'worsening'
              ? TrendingUp
              : ins.trend === 'improving'
                ? TrendingDown
                : Minus;
          const trendColor =
            ins.trend === 'worsening'
              ? 'text-[#c45a4a]'
              : ins.trend === 'improving'
                ? 'text-[#6b8f71]'
                : 'text-[#d4a054]';

          return (
            <article key={ins.id} className={cn('rounded-xl border p-5', c.border, c.bg)}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn('w-1 self-stretch rounded-full shrink-0 mt-0.5', c.dot)}
                    style={{ minHeight: 20 }}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={cn(
                          'text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase',
                          c.text,
                          c.bg,
                          c.border,
                        )}
                      >
                        {ins.severity}
                      </span>
                      <span className="text-[10px] text-slate-500">{ins.function}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[10px] text-slate-500">{timeAgo(ins.detectedAt)}</span>
                    </div>
                    <h2 className="font-display font-semibold text-base text-white/95 leading-snug">
                      {ins.title}
                    </h2>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={cn('font-mono font-bold text-lg', c.text)}>
                    {formatCurrency(ins.valueAtRisk)}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] flex items-center gap-1 justify-end mt-0.5',
                      trendColor,
                    )}
                  >
                    <TrendIcon className="w-3 h-3" />
                    {ins.trend}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed ml-4">{ins.body}</p>

              <div className="flex items-center gap-3 mt-4 ml-4">
                <div className="flex gap-1">
                  {ins.signalIds.map((id) => (
                    <span
                      key={id}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-slate-500 bg-white/[0.02]"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
