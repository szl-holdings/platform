import React, { type ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  meta?: Array<{ label: string; value: string }>;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, badge, meta, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1
            className="font-semibold leading-tight"
            style={{ fontSize: '20px', color: color.text.primary, letterSpacing: '-0.02em' }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm" style={{ color: color.text.secondary }}>
            {subtitle}
          </p>
        )}
        {meta && meta.length > 0 && (
          <div className="flex items-center gap-4 mt-1">
            {meta.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span style={{ color: color.text.muted, fontSize: '11px' }}>{item.label}</span>
                <span style={{ color: color.text.secondary, fontSize: '11px' }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
