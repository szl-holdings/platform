/**
 * ScoreChip — displays a single eval metric value with unit and trend indicator.
 */

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { v } from '../tokens/vars.js';
import { cn } from '../utils.js';

export interface ScoreChipProps {
  /** Metric name (e.g. "accuracy", "f1", "latency_p95_ms") */
  metric: string;
  /** The value to display */
  value: number | string | boolean;
  /** Optional unit label (e.g. "%" or "ms") */
  unit?: string;
  /** Whether higher is better — affects colour coding */
  higherIsBetter?: boolean;
  /** Optional delta vs baseline for trend arrow */
  delta?: number;
  /** Show a "strong" highlight when above threshold */
  strong?: boolean;
  /** Compact mode — hides metric label */
  compact?: boolean;
  className?: string;
}

function formatValue(value: number | string | boolean, unit?: string): string {
  if (typeof value === 'boolean') return value ? 'Pass' : 'Fail';
  if (typeof value === 'number') {
    const formatted =
      Math.abs(value) >= 1000
        ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : value.toLocaleString(undefined, { maximumFractionDigits: 3, minimumFractionDigits: 0 });
    return unit ? `${formatted} ${unit}` : formatted;
  }
  return String(value);
}

export function ScoreChip({
  metric,
  value,
  unit,
  higherIsBetter = true,
  delta,
  strong = false,
  compact = false,
  className,
}: ScoreChipProps) {
  const numericValue = typeof value === 'number' ? value : null;
  const numericDelta = delta !== undefined ? delta : null;

  const isGood =
    numericValue !== null
      ? higherIsBetter
        ? numericValue >= 0.8
        : numericValue <= 200
      : typeof value === 'boolean'
        ? value
        : null;

  const scoreColor =
    isGood === true
      ? 'var(--gi-accent-green)'
      : isGood === false
        ? 'var(--gi-accent-red)'
        : v.textPrimary;

  const TrendIcon =
    numericDelta === null
      ? null
      : numericDelta === 0
        ? Minus
        : (higherIsBetter ? numericDelta > 0 : numericDelta < 0)
          ? TrendingUp
          : TrendingDown;

  const trendColor =
    TrendIcon === TrendingUp
      ? 'var(--gi-accent-green)'
      : TrendIcon === TrendingDown
        ? 'var(--gi-accent-red)'
        : v.textMuted;

  return (
    <div
      className={cn(
        'inline-flex flex-col items-start gap-0.5 rounded border px-2 py-1.5',
        strong && 'border-[var(--gi-accent-green)] bg-[rgba(34,197,94,0.06)]',
        !strong && 'border-[var(--gi-border-default)] bg-[var(--gi-bg-overlay)]',
        className,
      )}
    >
      {!compact && (
        <span
          className="truncate max-w-[120px] text-[10px] font-medium uppercase tracking-wider"
          style={{ color: v.textMuted }}
          title={metric}
        >
          {metric.replace(/_/g, ' ')}
        </span>
      )}
      <div className="flex items-center gap-1">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: scoreColor }}
        >
          {formatValue(value, unit)}
        </span>
        {TrendIcon && (
          <TrendIcon
            className="h-3 w-3 shrink-0"
            style={{ color: trendColor }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
