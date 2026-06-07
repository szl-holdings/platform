import type * as React from 'react';
import { cn } from '../utils';

export interface TimelineEntry {
  id?: string;
  period: string;
  quarter?: string;
  title: string;
  description: string;
  highlight?: string;
  metric?: { label: string; value: string };
  icon?: React.ReactNode;
  status?: 'completed' | 'active' | 'upcoming';
}

export interface TimelineProps {
  eyebrow?: string;
  title?: string;
  entries: TimelineEntry[];
  variant?: 'light' | 'dark' | 'vertical';
  accentColor?: string;
  className?: string;
}

export function Timeline({
  eyebrow,
  title,
  entries,
  variant = 'light',
  accentColor = 'hsl(215 45% 32%)',
  className,
}: TimelineProps) {
  const isDark = variant === 'dark';
  const isVertical = variant === 'vertical';

  return (
    <section
      className={cn(
        'py-24 lg:py-32',
        isDark ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-900',
        !isVertical && (isDark ? 'border-t border-white/8' : 'border-t border-neutral-200'),
        className,
      )}
    >
      <div className="max-w-6xl mx-auto px-6">
        {(eyebrow || title) && (
          <div className="mb-16">
            {eyebrow && (
              <p
                className={cn(
                  'text-xs font-semibold uppercase tracking-widest mb-4',
                  isDark ? 'text-white/40' : 'text-neutral-400',
                )}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                className={cn(
                  'text-3xl sm:text-4xl font-bold leading-tight',
                  isDark ? 'text-white' : 'text-neutral-900',
                )}
              >
                {title}
              </h2>
            )}
          </div>
        )}

        {isVertical ? (
          <div className="relative pl-8">
            <div
              className="absolute left-0 top-2 bottom-2 w-px"
              style={{ backgroundColor: `${accentColor}30` }}
            />
            <div className="space-y-10">
              {entries.map((entry, index) => (
                <div key={entry.id ?? index} className="relative">
                  <div
                    className="absolute -left-8 top-1.5 w-3 h-3 rounded-full border-2 bg-white"
                    style={{
                      borderColor: accentColor,
                      backgroundColor: entry.status === 'active' ? accentColor : 'white',
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold" style={{ color: accentColor }}>
                        {entry.period}
                      </span>
                      {entry.quarter && (
                        <span
                          className={cn('text-xs', isDark ? 'text-white/30' : 'text-neutral-400')}
                        >
                          {entry.quarter}
                        </span>
                      )}
                      {entry.highlight && (
                        <span
                          className={cn(
                            'hidden sm:inline px-2 py-0.5 rounded-full text-[11px] font-medium',
                            isDark ? 'bg-white/8 text-white/40' : 'bg-neutral-100 text-neutral-400',
                          )}
                        >
                          {entry.highlight}
                        </span>
                      )}
                    </div>
                    <h3
                      className={cn(
                        'text-base font-bold mb-1',
                        isDark ? 'text-white' : 'text-neutral-900',
                      )}
                    >
                      {entry.title}
                    </h3>
                    <p
                      className={cn(
                        'text-sm leading-relaxed',
                        isDark ? 'text-white/50' : 'text-neutral-500',
                      )}
                    >
                      {entry.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={cn('space-y-0 divide-y', isDark ? 'divide-white/8' : 'divide-neutral-200')}
          >
            {entries.map((entry, index) => (
              <div
                key={entry.id ?? index}
                className={cn(
                  'group py-6 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 px-2 -mx-2 rounded-lg transition-colors duration-200',
                  isDark ? 'hover:bg-white/3' : 'hover:bg-neutral-50/50',
                )}
              >
                <div className="shrink-0 sm:w-32">
                  <span className="font-bold text-sm" style={{ color: accentColor }}>
                    {entry.period}
                  </span>
                  {entry.quarter && (
                    <span
                      className={cn(
                        'text-xs ml-1.5',
                        isDark ? 'text-white/30' : 'text-neutral-400',
                      )}
                    >
                      {entry.quarter}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3
                      className={cn(
                        'text-base font-bold',
                        isDark ? 'text-white' : 'text-neutral-900',
                      )}
                    >
                      {entry.title}
                    </h3>
                    {entry.highlight && (
                      <span
                        className={cn(
                          'hidden sm:inline px-2 py-0.5 rounded-full text-[11px] font-medium',
                          isDark ? 'bg-white/8 text-white/40' : 'bg-neutral-100 text-neutral-400',
                        )}
                      >
                        {entry.highlight}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      isDark ? 'text-white/50' : 'text-neutral-500',
                    )}
                  >
                    {entry.description}
                  </p>
                  {entry.metric && (
                    <div
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mt-3',
                        isDark ? 'bg-white/5 border-white/8' : 'bg-neutral-50 border-neutral-200',
                      )}
                    >
                      <span
                        className={cn('text-xs', isDark ? 'text-white/40' : 'text-neutral-400')}
                      >
                        {entry.metric.label}:
                      </span>
                      <span
                        className={cn(
                          'font-semibold text-sm',
                          isDark ? 'text-white' : 'text-neutral-900',
                        )}
                      >
                        {entry.metric.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
