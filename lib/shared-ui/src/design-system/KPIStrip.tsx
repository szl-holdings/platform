import type * as React from 'react';
import { cn } from '../utils';

export interface KPIItem {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  note?: string;
  delta?: string;
}

export interface KPIStripProps {
  items: KPIItem[];
  variant?: 'default' | 'dark' | 'border' | 'glass';
  accentColor?: string;
  className?: string;
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up')
    return (
      <span style={{ color: 'hsl(152 50% 44%)' }} className="text-sm font-medium">
        ↑
      </span>
    );
  if (trend === 'down')
    return (
      <span style={{ color: 'hsl(0 62% 52%)' }} className="text-sm font-medium">
        ↓
      </span>
    );
  return (
    <span style={{ color: 'hsl(210 5% 46%)' }} className="text-sm font-medium">
      —
    </span>
  );
}

export function KPIStrip({ items, variant = 'default', accentColor, className }: KPIStripProps) {
  const isDark = variant === 'dark' || variant === 'glass';

  const gridClass = cn(
    'grid gap-px rounded-2xl overflow-hidden',
    items.length === 2 && 'grid-cols-2',
    items.length === 3 && 'grid-cols-3',
    items.length === 4 && 'grid-cols-2 sm:grid-cols-4',
    items.length === 5 && 'grid-cols-2 sm:grid-cols-5',
    items.length > 5 && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    variant === 'border' && 'border border-[hsla(0_0%_100%_/_0.08)]',
    variant === 'glass' && 'border border-[hsla(0_0%_100%_/_0.08)]',
  );

  const wrapperStyle: React.CSSProperties =
    variant === 'glass'
      ? { background: 'hsla(210 15% 18% / 0.06)' }
      : variant === 'dark'
        ? { background: 'hsla(0 0% 100% / 0.04)' }
        : variant === 'border'
          ? {}
          : { background: 'hsla(0 0% 100% / 0.04)' };

  const cellStyle: React.CSSProperties = isDark
    ? {
        background: 'hsla(210 10% 12% / 0.55)',
      }
    : {
        background: 'hsl(0 0% 100%)',
      };

  return (
    <div className={cn(gridClass, className)} style={wrapperStyle}>
      {items.map((item, i) => (
        <div key={i} className="px-5 py-4 text-center" style={cellStyle}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <p
              className="font-semibold text-2xl sm:text-3xl"
              style={{
                color: isDark ? 'hsl(38 12% 94%)' : 'hsl(210 12% 10%)',
                letterSpacing: '-0.02em',
                lineHeight: '1.1',
              }}
            >
              {item.value}
            </p>
            {item.trend && <TrendIcon trend={item.trend} />}
          </div>
          <p
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{
              color: isDark ? 'hsl(210 5% 46%)' : 'hsl(210 6% 52%)',
              letterSpacing: '0.07em',
            }}
          >
            {item.label}
          </p>
          {item.note && (
            <p
              className="text-[10px] mt-0.5"
              style={{ color: isDark ? 'hsl(210 5% 34%)' : 'hsl(210 5% 46%)' }}
            >
              {item.note}
            </p>
          )}
          {item.delta && (
            <p
              className="text-[10px] font-semibold mt-0.5"
              style={{
                color:
                  item.trend === 'up'
                    ? 'hsl(152 50% 44%)'
                    : item.trend === 'down'
                      ? 'hsl(0 62% 52%)'
                      : 'hsl(210 5% 46%)',
              }}
            >
              {item.delta}
            </p>
          )}
          {accentColor && i === 0 && (
            <div
              className="mx-auto mt-2 h-px w-8 rounded-full"
              style={{ background: `${accentColor}50` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
