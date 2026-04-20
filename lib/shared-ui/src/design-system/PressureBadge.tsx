import * as React from 'react';
import { colors } from '../tokens';
import { cn } from '../utils';

export type PressureLevel = keyof typeof colors.pressure;

export interface PressureBadgeProps {
  level: PressureLevel;
  showDot?: boolean;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function PressureBadge({
  level,
  showDot = true,
  showLabel = true,
  size = 'sm',
  className,
}: PressureBadgeProps) {
  const token = colors.pressure[level];

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        sizeClasses[size],
        className,
      )}
      style={{
        background: token.bg,
        color: token.color,
        border: `1px solid ${token.border}`,
      }}
    >
      {showDot && (
        <span
          className={cn('rounded-full shrink-0', dotSizes[size])}
          style={{ background: token.color }}
        />
      )}
      {showLabel && <span>Pressure: {token.label}</span>}
    </span>
  );
}
