/**
 * LeaderboardTable — renders a ranked leaderboard for a benchmark×task.
 */

import { Trophy, ExternalLink } from 'lucide-react';
import { EvalBadge, type EvalBadgeState } from './EvalBadge.js';
import { ScoreChip } from './ScoreChip.js';
import { v } from '../tokens/vars.js';
import { cn } from '../utils.js';

export interface LeaderboardEntry {
  rank: number;
  resultId: string;
  entityId: string;
  entityLabel: string;
  entityType: string;
  domain: string;
  metric: string;
  value: string | number;
  numericValue?: string | null;
  unit?: string | null;
  badgeState: EvalBadgeState;
  evaluationFramework?: string | null;
  evalDate?: string | null;
  sourceUrl?: string | null;
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  benchmarkId?: string;
  taskId?: string;
  /** Whether higher metric values are better. Used for colour coding. */
  higherIsBetter?: boolean;
  /** Callback when user clicks a row */
  onRowClick?: (entry: LeaderboardEntry) => void;
  className?: string;
  compact?: boolean;
  title?: string;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function rankColor(rank: number): string {
  if (rank === 1) return 'var(--gi-accent-amber)';
  if (rank === 2) return 'var(--gi-text-secondary)';
  if (rank === 3) return 'rgba(180,120,60,0.9)';
  return 'var(--gi-text-muted)';
}

export function LeaderboardTable({
  entries,
  benchmarkId,
  taskId,
  higherIsBetter = true,
  onRowClick,
  className,
  compact = false,
  title,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div
        className={cn('rounded border p-6 text-center text-sm', className)}
        style={{ borderColor: v.borderDefault, color: v.textMuted }}
      >
        No results yet. Be the first to{' '}
        <span style={{ color: v.accentBlue }}>submit a score</span>.
      </div>
    );
  }

  return (
    <div
      className={cn('rounded border overflow-hidden', className)}
      style={{ borderColor: v.borderDefault, backgroundColor: v.bgSurface }}
    >
      {(title || benchmarkId) && (
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: v.borderSubtle, backgroundColor: v.bgOverlay }}
        >
          <Trophy className="h-4 w-4 shrink-0" style={{ color: v.accentAmber }} />
          <span className="text-sm font-semibold" style={{ color: v.textPrimary }}>
            {title ?? `Leaderboard — ${benchmarkId}${taskId ? ` / ${taskId}` : ''}`}
          </span>
          <span className="ml-auto text-xs" style={{ color: v.textMuted }}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: v.bgOverlay }}>
              <th
                className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider w-12"
                style={{ color: v.textMuted, borderBottom: `1px solid ${v.borderSubtle}` }}
              >
                #
              </th>
              <th
                className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: v.textMuted, borderBottom: `1px solid ${v.borderSubtle}` }}
              >
                Entity
              </th>
              {!compact && (
                <th
                  className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider hidden sm:table-cell"
                  style={{ color: v.textMuted, borderBottom: `1px solid ${v.borderSubtle}` }}
                >
                  Type
                </th>
              )}
              <th
                className="text-right px-3 py-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: v.textMuted, borderBottom: `1px solid ${v.borderSubtle}` }}
              >
                Score
              </th>
              <th
                className="text-center px-3 py-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: v.textMuted, borderBottom: `1px solid ${v.borderSubtle}` }}
              >
                Status
              </th>
              {!compact && (
                <th
                  className="text-right px-3 py-2 text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                  style={{ color: v.textMuted, borderBottom: `1px solid ${v.borderSubtle}` }}
                >
                  Date
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.resultId}
                onClick={() => onRowClick?.(entry)}
                className={cn(
                  'transition-colors duration-100',
                  onRowClick && 'cursor-pointer',
                )}
                style={{
                  borderBottom:
                    i < entries.length - 1 ? `1px solid ${v.borderSubtle}` : 'none',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = v.bgHover)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = '')
                }
              >
                <td className="px-3 py-2.5 font-mono font-bold text-xs">
                  <span style={{ color: rankColor(entry.rank) }}>
                    {MEDAL[entry.rank] ?? `#${entry.rank}`}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-medium" style={{ color: v.textPrimary }}>
                    {entry.entityLabel}
                  </span>
                </td>
                {!compact && (
                  <td
                    className="px-3 py-2.5 text-xs hidden sm:table-cell"
                    style={{ color: v.textMuted }}
                  >
                    {entry.entityType}
                  </td>
                )}
                <td className="px-3 py-2.5 text-right">
                  <ScoreChip
                    metric={entry.metric}
                    value={
                      typeof entry.value === 'number'
                        ? entry.value
                        : Number(entry.numericValue ?? entry.value) || entry.value
                    }
                    unit={entry.unit ?? undefined}
                    higherIsBetter={higherIsBetter}
                    strong={entry.rank === 1}
                    compact
                  />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <EvalBadge
                    state={entry.badgeState}
                    href={entry.sourceUrl ?? undefined}
                    compact
                  />
                </td>
                {!compact && (
                  <td
                    className="px-3 py-2.5 text-right text-xs hidden md:table-cell"
                    style={{ color: v.textMuted }}
                  >
                    {entry.evalDate ?? '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
