/**
 * BenchmarkCard — shows a benchmark definition with task list and metadata.
 */

import { BarChart3, ExternalLink, Tag, ChevronRight } from 'lucide-react';
import { v } from '../tokens/vars.js';
import { cn } from '../utils.js';

export interface BenchmarkTask {
  taskId: string;
  name: string;
  description?: string;
  taskType?: string;
  primaryMetric: string;
  higherIsBetter?: boolean;
  baseline?: number;
}

export interface BenchmarkCardProps {
  benchmarkId: string;
  name: string;
  description?: string;
  domain: string;
  evaluationFramework?: string;
  tasks?: BenchmarkTask[];
  tags?: string[];
  paperUrl?: string;
  isCrossCutting?: boolean;
  source?: 'seed' | 'tenant';
  onClick?: () => void;
  onLeaderboardClick?: (taskId: string) => void;
  className?: string;
  compact?: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  maritime:    'var(--gi-accent-teal)',
  legal:       'var(--gi-accent-blue)',
  terra:       'var(--gi-accent-green)',
  cyber:       'var(--gi-accent-red)',
  executive:   'var(--gi-accent-amber)',
  decision:    'var(--gi-text-secondary)',
  cross:       'var(--gi-accent-blue)',
};

function domainColor(domain: string): string {
  const key = Object.keys(DOMAIN_COLORS).find((k) => domain.toLowerCase().includes(k));
  return key ? DOMAIN_COLORS[key] : v.textSecondary;
}

export function BenchmarkCard({
  benchmarkId,
  name,
  description,
  domain,
  evaluationFramework,
  tasks = [],
  tags = [],
  paperUrl,
  isCrossCutting = false,
  source = 'seed',
  onClick,
  onLeaderboardClick,
  className,
  compact = false,
}: BenchmarkCardProps) {
  return (
    <div
      className={cn(
        'rounded border transition-shadow duration-150',
        onClick && 'cursor-pointer hover:shadow-md',
        className,
      )}
      style={{
        borderColor: v.borderDefault,
        backgroundColor: v.bgSurface,
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: v.borderSubtle }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3
            className="h-4 w-4 shrink-0"
            style={{ color: domainColor(domain) }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate" style={{ color: v.textPrimary }}>
                {name}
              </span>
              {isCrossCutting && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                  style={{
                    color: v.accentBlue,
                    borderColor: 'rgba(59,130,246,0.3)',
                    backgroundColor: 'rgba(59,130,246,0.08)',
                  }}
                >
                  Cross-platform
                </span>
              )}
              {source === 'seed' && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                  style={{
                    color: v.textMuted,
                    borderColor: v.borderSubtle,
                    backgroundColor: v.bgOverlay,
                  }}
                >
                  Platform seed
                </span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: v.textMuted }}>
              {benchmarkId}
              {evaluationFramework && ` · ${evaluationFramework}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {paperUrl && (
            <a
              href={paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="View benchmark specification"
            >
              <ExternalLink
                className="h-3.5 w-3.5"
                style={{ color: v.textMuted }}
              />
            </a>
          )}
          {onClick && (
            <ChevronRight className="h-4 w-4" style={{ color: v.textMuted }} />
          )}
        </div>
      </div>

      {/* Description */}
      {!compact && description && (
        <p className="px-4 py-2 text-xs leading-relaxed" style={{ color: v.textSecondary }}>
          {description}
        </p>
      )}

      {/* Tasks */}
      {!compact && tasks.length > 0 && (
        <div className="px-4 py-2 flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: v.textMuted }}>
            Tasks ({tasks.length})
          </span>
          {tasks.map((task) => (
            <div
              key={task.taskId}
              className="flex items-center justify-between gap-2 rounded px-2 py-1.5"
              style={{ backgroundColor: v.bgOverlay, border: `1px solid ${v.borderSubtle}` }}
            >
              <div className="min-w-0">
                <span className="text-xs font-medium" style={{ color: v.textPrimary }}>
                  {task.name}
                </span>
                {task.description && (
                  <span className="ml-2 text-xs hidden sm:inline" style={{ color: v.textMuted }}>
                    {task.description.length > 60
                      ? `${task.description.slice(0, 60)}…`
                      : task.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono" style={{ color: v.textMuted }}>
                  {task.primaryMetric}
                  {task.higherIsBetter === false && ' ↓'}
                </span>
                {onLeaderboardClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLeaderboardClick(task.taskId);
                    }}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors"
                    style={{ color: v.accentBlue, borderColor: 'rgba(59,130,246,0.3)' }}
                    title={`View leaderboard for ${task.name}`}
                  >
                    Leaderboard
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {!compact && tags.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 flex-wrap">
          <Tag className="h-3 w-3 shrink-0" style={{ color: v.textMuted }} />
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                color: v.textSecondary,
                backgroundColor: v.bgOverlay,
                border: `1px solid ${v.borderSubtle}`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
