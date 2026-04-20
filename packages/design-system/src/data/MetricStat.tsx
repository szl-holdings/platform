import React, { type ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface MetricStatProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  trend?: 'up' | 'down' | 'flat';
  unit?: string;
  footnote?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricStat({
  label,
  value,
  delta,
  deltaPositive,
  trend,
  unit,
  footnote,
  icon,
  className,
}: MetricStatProps) {
  const trendColor =
    deltaPositive === true
      ? color.accent.green
      : deltaPositive === false
        ? color.accent.red
        : color.text.secondary;

  return (
    <div
      className={cn('flex flex-col gap-1 p-4 rounded-lg border', className)}
      style={{ background: color.bg.surface, borderColor: color.border.subtle }}
    >
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontSize: '11px', color: color.text.secondary, fontWeight: 500 }}>
          {label}
        </span>
        {icon && <span style={{ color: color.text.muted }}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-semibold leading-none"
          style={{ fontSize: '24px', color: color.text.primary, letterSpacing: '-0.03em' }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: '12px', color: color.text.muted }}>{unit}</span>}
      </div>
      {delta && (
        <div className="flex items-center gap-1">
          <span style={{ color: trendColor, fontSize: '11px' }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'} {delta}
          </span>
        </div>
      )}
      {footnote && <span style={{ fontSize: '10px', color: color.text.muted }}>{footnote}</span>}
    </div>
  );
}

export function MetricStatGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('grid gap-3', className)}
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
    >
      {children}
    </div>
  );
}
