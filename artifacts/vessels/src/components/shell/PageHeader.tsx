import type { ReactNode } from 'react';
import { Link } from 'wouter';

const MONO = 'var(--font-mono, monospace)';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, breadcrumbs, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b border-[var(--color-a11oy-border,rgba(255,255,255,0.06))]">
      <div className="min-w-0 flex-1">
        {(eyebrow || (breadcrumbs && breadcrumbs.length > 0)) && (
          <div
            className="flex items-center gap-1.5 flex-wrap mb-3"
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#5e5e5e',
            }}
          >
            {eyebrow && <span style={{ color: '#c9b787', opacity: 0.7 }}>{eyebrow}</span>}
            {eyebrow && breadcrumbs && breadcrumbs.length > 0 && <span style={{ color: '#3a3a3a' }}>·</span>}
            {breadcrumbs?.map((b, i) => (
              <span key={`${b.label}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <span style={{ color: '#3a3a3a' }}>/</span>}
                {b.href ? (
                  <Link href={b.href} className="hover:text-[#c9b787] transition-colors" style={{ color: '#5e5e5e' }}>
                    {b.label}
                  </Link>
                ) : (
                  <span>{b.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1
          className="font-display text-[#f5f5f5] m-0"
          style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-[13px] mt-2 max-w-[68ch]" style={{ color: '#8a8a8a', lineHeight: 1.6 }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
