import { cn } from '@szl-holdings/shared-ui/utils';
import { AlertTriangle, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { type InsightCategory, insights } from '@/data/seed-data';

const categoryConfig: Record<
  InsightCategory,
  {
    label: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
  }
> = {
  success: {
    label: 'Success',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/8',
    border: 'border-emerald-400/20',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-400/8',
    border: 'border-amber-400/20',
  },
  trend: {
    label: 'Trend',
    icon: TrendingUp,
    color: 'text-blue-400',
    bg: 'bg-blue-400/8',
    border: 'border-blue-400/20',
  },
  discovery: {
    label: 'Discovery',
    icon: Sparkles,
    color: 'text-violet-400',
    bg: 'bg-violet-400/8',
    border: 'border-violet-400/20',
  },
};

const impactColors: Record<string, string> = {
  high: 'text-red-400 bg-red-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  low: 'text-muted-foreground bg-muted',
};

function InsightCard({ insight }: { insight: (typeof insights)[0] }) {
  const config = categoryConfig[insight.category];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'border rounded-xl p-5 transition-all duration-200 hover:shadow-lg',
        config.bg,
        config.border,
        'bg-card/60 backdrop-blur-sm',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', config.color)} />
          <span
            className={cn(
              'text-[10px] font-mono uppercase px-2 py-0.5 rounded-full',
              config.color,
              `${config.bg}`,
            )}
          >
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[10px] font-mono px-2 py-0.5 rounded-full',
              impactColors[insight.impact],
            )}
          >
            {insight.impact}
          </span>
        </div>
      </div>

      <h3 className="text-sm font-display font-semibold text-foreground mb-2 leading-snug">
        {insight.title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{insight.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="font-mono bg-muted/30 px-2 py-0.5 rounded">
            {insight.sourceExperiment}
          </span>
          <span>
            {new Date(insight.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1 w-12 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 rounded-full"
              style={{ width: `${insight.confidence}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{insight.confidence}%</span>
        </div>
      </div>
    </div>
  );
}

export default function Insights() {
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory | 'all'>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');

  const filtered = insights.filter((i) => {
    const matchCat = categoryFilter === 'all' || i.category === categoryFilter;
    const matchImpact = impactFilter === 'all' || i.impact === impactFilter;
    return matchCat && matchImpact;
  });

  const categoryCounts = {
    all: insights.length,
    success: insights.filter((i) => i.category === 'success').length,
    warning: insights.filter((i) => i.category === 'warning').length,
    trend: insights.filter((i) => i.category === 'trend').length,
    discovery: insights.filter((i) => i.category === 'discovery').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Research Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Findings from experiment results, model evaluations, and cross-project analysis
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'success', 'warning', 'trend', 'discovery'] as const).map((cat) => {
            const config = cat === 'all' ? null : categoryConfig[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5',
                  categoryFilter === cat
                    ? cat === 'all'
                      ? 'bg-primary/15 text-primary'
                      : cn(config?.bg, config?.color)
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                {config && <config.icon className="w-3 h-3" />}
                {cat === 'all' ? 'All' : config?.label}
                <span className="text-[10px] opacity-60">{categoryCounts[cat]}</span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto">
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className="text-xs bg-card/60 border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="all">All Impact</option>
            <option value="high">High Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="low">Low Impact</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No insights match the selected filters
        </div>
      )}
    </div>
  );
}
