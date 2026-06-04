import type * as React from 'react';
import { colors, effects } from '../tokens';
import { cn, toAlpha } from '../utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  note?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  variant?: 'default' | 'compact' | 'prominent';
  className?: string;
  onClick?: () => void;
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up')
    return (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M6 9V3M3 6l3-3 3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (trend === 'down')
    return (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M6 3v6M3 6l3 3 3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return <span className="text-[10px] font-medium">—</span>;
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  trend = 'neutral',
  note,
  icon,
  accentColor,
  variant = 'default',
  className,
  onClick,
}: MetricCardProps) {
  const trendColor =
    trend === 'up'
      ? colors.semantic.success
      : trend === 'down'
        ? colors.semantic.error
        : colors.text.muted;

  const isCompact = variant === 'compact';
  const isProminent = variant === 'prominent';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'relative flex flex-col rounded-xl border transition-colors duration-150',
        onClick &&
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsla(210_60%_58%_/_0.4)]',
        isCompact ? 'p-3 gap-1.5' : isProminent ? 'p-6 gap-3' : 'p-4 gap-2',
        onClick ? 'hover:border-white/10 hover:bg-white/[0.04]' : '',
        className,
      )}
      style={{
        background: effects.surface.card.background,
        border: effects.surface.card.border,
      }}
    >
      {accentColor && (
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${toAlpha(accentColor, 0.35)}, transparent)`,
          }}
          aria-hidden="true"
        />
      )}

      <div className="flex items-start justify-between">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.07em]"
          style={{ color: colors.text.muted }}
        >
          {label}
        </p>
        {icon && (
          <span className="w-4 h-4 shrink-0" style={{ color: accentColor ?? colors.text.muted }}>
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <p
          className={cn(
            'font-semibold leading-none',
            isProminent ? 'text-4xl' : isCompact ? 'text-xl' : 'text-2xl',
          )}
          style={{ color: colors.text.primary, letterSpacing: '-0.02em' }}
        >
          {value}
        </p>
        {unit && (
          <span className="text-xs font-medium mb-0.5" style={{ color: colors.text.muted }}>
            {unit}
          </span>
        )}
      </div>

      {(delta || note) && (
        <div className="flex items-center gap-1.5">
          {delta && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-medium"
              style={{ color: trendColor }}
            >
              <TrendArrow trend={trend} />
              {delta}
            </span>
          )}
          {deltaLabel && (
            <span className="text-[11px]" style={{ color: colors.text.subtle }}>
              {deltaLabel}
            </span>
          )}
          {note && !delta && (
            <span className="text-[11px]" style={{ color: colors.text.subtle }}>
              {note}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
