import React from 'react';
import { ChevronRight, Grid3X3 } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  artifact?: string;
  accentColor?: string;
}

interface OmniaBreadcrumbProps {
  items: BreadcrumbItem[];
  accentColor?: string;
}

const ARTIFACT_ACCENTS: Record<string, string> = {
  command: '#8b7ac8',
  holdings: '#c9b787',
  aegis: '#ef4444',
  sentra: '#22c55e',
  terra: '#22c55e',
  vessels: '#0ea5e9',
  counsel: '#8b5cf6',
  a11oy: '#c9b787',
  pulse: '#f59e0b',
  lyte: '#3b82f6',
  praxis: '#8b5cf6',
};

export function OmniaBreadcrumb({ items, accentColor = '#8b7ac8' }: OmniaBreadcrumbProps) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: 'rgba(255,255,255,0.45)',
      }}
      aria-label="Portfolio breadcrumb"
    >
      <a
        href="/command/omnia"
        title="OMNIA Hub"
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'rgba(255,255,255,0.35)',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = accentColor; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}
      >
        <Grid3X3 size={12} />
      </a>
      {items.map((item, i) => {
        const itemAccent = item.accentColor ?? (item.artifact ? ARTIFACT_ACCENTS[item.artifact] : undefined) ?? accentColor;
        return (
          <React.Fragment key={i}>
            <ChevronRight size={11} style={{ opacity: 0.35 }} />
            {item.href ? (
              <a
                href={item.href}
                style={{
                  color: i === items.length - 1 ? 'rgba(235,230,220,0.75)' : 'rgba(255,255,255,0.45)',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = itemAccent; }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color =
                    i === items.length - 1 ? 'rgba(235,230,220,0.75)' : 'rgba(255,255,255,0.45)';
                }}
              >
                {item.label}
              </a>
            ) : (
              <span style={{ color: i === items.length - 1 ? 'rgba(235,230,220,0.75)' : 'rgba(255,255,255,0.45)' }}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
