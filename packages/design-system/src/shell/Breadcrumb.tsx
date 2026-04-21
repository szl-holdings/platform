import React, { type ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

export function Breadcrumb({ items, separator, className }: BreadcrumbProps) {
  const sep = separator ?? (
    <span style={{ color: color.text.muted, fontSize: '10px', userSelect: 'none' }}>›</span>
  );

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5', className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && sep}
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="inline-flex items-center gap-1 transition-colors"
                style={{
                  fontSize: '12px',
                  color: color.text.secondary,
                  textDecoration: 'none',
                  fontWeight: 400,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = color.text.primary; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = color.text.secondary; }}
              >
                {item.icon && <span style={{ lineHeight: 0 }}>{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <span
                className="inline-flex items-center gap-1"
                aria-current={isLast ? 'page' : undefined}
                style={{
                  fontSize: '12px',
                  color: isLast ? color.text.primary : color.text.secondary,
                  fontWeight: isLast ? 500 : 400,
                }}
              >
                {item.icon && <span style={{ lineHeight: 0 }}>{item.icon}</span>}
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
