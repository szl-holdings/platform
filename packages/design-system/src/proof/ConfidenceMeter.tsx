import { AlertTriangle } from 'lucide-react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface ConfidenceMeterProps {
  value: number;
  contradiction?: boolean;
  label?: string;
  className?: string;
  variant?: 'compact' | 'full';
}

function colorForValue(v: number): string {
  if (v >= 75) return color.confidence.high;
  if (v >= 45) return color.confidence.medium;
  return color.confidence.low;
}

export function ConfidenceMeter({
  value,
  contradiction = false,
  label,
  className,
  variant = 'compact',
}: ConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const fill = colorForValue(clamped);
  const fillColor = contradiction ? color.confidence.contradiction : fill;

  return (
    <div className={cn('inline-flex flex-col gap-1 min-w-0', className)}>
      {variant === 'full' && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-xs uppercase tracking-wider" style={{ color: color.text.muted }}>
              {label}
            </span>
          )}
          <div className="flex items-center gap-1">
            {contradiction && (
              <span
                title="Contradictory evidence detected"
                style={{ color: color.confidence.contradiction }}
              >
                <AlertTriangle className="h-3 w-3" />
              </span>
            )}
            <span className="text-xs font-semibold tabular-nums" style={{ color: fillColor }}>
              {clamped}%
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ?? 'Confidence'}
          className="relative h-1.5 flex-1 rounded-full overflow-hidden"
          style={{ background: color.border.subtle }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{ width: `${clamped}%`, backgroundColor: fillColor }}
          />
        </div>

        {variant === 'compact' && (
          <div className="flex items-center gap-1 shrink-0">
            {contradiction && (
              <span
                title="Contradictory evidence"
                style={{ color: color.confidence.contradiction }}
              >
                <AlertTriangle className="h-3 w-3" />
              </span>
            )}
            <span className="text-xs font-semibold tabular-nums" style={{ color: fillColor }}>
              {clamped}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
