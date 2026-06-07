import type * as React from 'react';
import { cn } from '../utils';

export interface Feature {
  id?: string;
  icon?: React.ReactNode;
  color?: string;
  title: string;
  description: string;
  metrics?: { label: string; value: string }[];
  badge?: string;
}

export interface FeatureGridProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
  variant?: 'light' | 'dark';
  accentColor?: string;
}

export function FeatureGrid({
  eyebrow,
  title,
  subtitle,
  features,
  columns = 3,
  className,
  variant = 'light',
  accentColor = 'hsl(215 45% 32%)',
}: FeatureGridProps) {
  const isDark = variant === 'dark';

  return (
    <section
      className={cn(
        'py-24 lg:py-32',
        isDark ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900',
        className,
      )}
    >
      <div className="max-w-6xl mx-auto px-6">
        {(eyebrow || title || subtitle) && (
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
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <h2
                  className={cn(
                    'text-3xl sm:text-4xl font-bold leading-tight',
                    isDark ? 'text-white' : 'text-neutral-900',
                  )}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p
                    className={cn(
                      'text-sm max-w-sm leading-relaxed',
                      isDark ? 'text-white/50' : 'text-neutral-500',
                    )}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            'grid gap-4',
            columns === 2 && 'md:grid-cols-2',
            columns === 3 && 'md:grid-cols-2 lg:grid-cols-3',
            columns === 4 && 'md:grid-cols-2 lg:grid-cols-4',
          )}
        >
          {features.map((feature, index) => (
            <div
              key={feature.id ?? index}
              className={cn(
                'group rounded-xl border p-6 hover:shadow-sm transition-all duration-200',
                isDark
                  ? 'border-white/8 bg-white/3 hover:border-white/12 hover:bg-white/5'
                  : 'border-neutral-100 bg-white hover:border-neutral-200',
              )}
            >
              {feature.icon && (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: `${feature.color ?? accentColor}18`,
                    color: feature.color ?? accentColor,
                  }}
                >
                  {feature.icon}
                </div>
              )}

              {feature.badge && (
                <span
                  className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3"
                  style={{
                    backgroundColor: `${accentColor}12`,
                    color: accentColor,
                  }}
                >
                  {feature.badge}
                </span>
              )}

              <h3
                className={cn(
                  'text-base font-bold mb-2',
                  isDark ? 'text-white' : 'text-neutral-900',
                )}
              >
                {feature.title}
              </h3>
              <p
                className={cn(
                  'text-sm leading-relaxed mb-5',
                  isDark ? 'text-white/50' : 'text-neutral-500',
                )}
              >
                {feature.description}
              </p>

              {feature.metrics && feature.metrics.length > 0 && (
                <div
                  className={cn(
                    'space-y-2.5 pt-4 border-t',
                    isDark ? 'border-white/8' : 'border-neutral-100',
                  )}
                >
                  {feature.metrics.slice(0, 2).map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between">
                      <span
                        className={cn('text-xs', isDark ? 'text-white/40' : 'text-neutral-400')}
                      >
                        {metric.label}
                      </span>
                      <span
                        className={cn(
                          'font-semibold text-sm',
                          isDark ? 'text-white' : 'text-neutral-900',
                        )}
                      >
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
