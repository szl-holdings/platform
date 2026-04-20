import { Bug, ChevronDown, ShieldCheck, Sparkles, Wrench, Zap } from 'lucide-react';
import * as React from 'react';
import { cn } from '../utils';

export interface ChangelogEntry {
  id: number;
  version: string;
  title: string;
  date: string;
  category: 'feature' | 'improvement' | 'bugfix' | 'security' | 'breaking';
  body: string;
  tags?: string[];
}

const CATEGORY_CONFIG = {
  feature: { icon: Sparkles, label: 'New Feature', color: '#8b7ac8' },
  improvement: { icon: Zap, label: 'Improvement', color: '#3b82f6' },
  bugfix: { icon: Bug, label: 'Bug Fix', color: '#ef4444' },
  security: { icon: ShieldCheck, label: 'Security', color: '#10b981' },
  breaking: { icon: Wrench, label: 'Breaking Change', color: '#f59e0b' },
};

interface ChangelogPageProps {
  entries?: ChangelogEntry[];
  loading?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

export function ChangelogPage({
  entries = [],
  loading = false,
  title = 'Changelog',
  description = 'Stay up to date with the latest platform improvements and updates.',
  className,
}: ChangelogPageProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(
    () => new Set(entries.slice(0, 3).map((e) => e.id)),
  );
  const [filterCategory, setFilterCategory] = React.useState<string>('all');

  const filteredEntries =
    filterCategory === 'all' ? entries : entries.filter((e) => e.category === filterCategory);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className={cn('max-w-2xl mx-auto py-12 px-4', className)}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-96 bg-muted rounded-lg" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 p-6 rounded-xl border border-border">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-2xl mx-auto py-12 px-4', className)}>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['all', ...Object.keys(CATEGORY_CONFIG)].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              filterCategory === cat
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG].label}
          </button>
        ))}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No entries found.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {filteredEntries.map((entry) => {
              const config = CATEGORY_CONFIG[entry.category];
              const Icon = config.icon;
              const isExpanded = expandedIds.has(entry.id);

              return (
                <div key={entry.id} className="relative pl-14">
                  <div
                    className="absolute left-4 top-4 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-card"
                    style={{ borderColor: config.color }}
                  >
                    <Icon className="w-2.5 h-2.5" style={{ color: config.color }} />
                  </div>

                  <div
                    className={cn(
                      'rounded-xl border border-border p-4 transition-colors',
                      isExpanded ? 'bg-card' : 'bg-card/50 hover:bg-card',
                    )}
                  >
                    <button onClick={() => toggleExpand(entry.id)} className="w-full text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded-md border"
                            style={{
                              color: config.color,
                              borderColor: `${config.color}30`,
                              backgroundColor: `${config.color}08`,
                            }}
                          >
                            {entry.version}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-muted-foreground transition-transform',
                            isExpanded && 'rotate-180',
                          )}
                        />
                      </div>

                      <h3 className="text-sm font-semibold text-foreground mt-2">{entry.title}</h3>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {entry.body}
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
