import type { ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface SectionPanelProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionPanel({
  title,
  subtitle,
  actions,
  children,
  className,
  noPadding = false,
}: SectionPanelProps) {
  return (
    <section
      className={cn('rounded-lg border', className)}
      style={{ background: color.bg.surface, borderColor: color.border.subtle }}
    >
      {(title || actions) && (
        <div
          className="flex items-center justify-between gap-4 px-4 border-b"
          style={{ height: '44px', borderColor: color.border.subtle }}
        >
          <div className="flex flex-col">
            {title && (
              <span className="font-semibold text-sm" style={{ color: color.text.primary }}>
                {title}
              </span>
            )}
            {subtitle && (
              <span style={{ fontSize: '11px', color: color.text.muted }}>{subtitle}</span>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
    </section>
  );
}
