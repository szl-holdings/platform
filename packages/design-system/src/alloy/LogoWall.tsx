import type { CSSProperties } from 'react';

export interface LogoWallItem {
  id: string;
  name: string;
  glyph?: string;
  color?: string;
  href?: string;
}

export interface LogoWallProps {
  items: LogoWallItem[];
  label?: string;
  animate?: boolean;
  style?: CSSProperties;
  className?: string;
}

function LogoChip({ item }: { item: LogoWallItem }) {
  const inner = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 0.875rem',
        background: 'var(--ah-surface, rgba(255,255,255,0.04))',
        border: '1px solid var(--ah-border, rgba(255,255,255,0.08))',
        borderRadius: 8,
        fontSize: '0.8125rem',
        fontWeight: 500,
        color: 'var(--ah-text-dim, #a8a8a8)',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        cursor: item.href ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLSpanElement;
        el.style.background = 'var(--ah-border, rgba(255,255,255,0.07))';
        el.style.borderColor = 'var(--ah-border-strong, rgba(255,255,255,0.14))';
        el.style.color = 'var(--ah-text, #f5f5f5)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLSpanElement;
        el.style.background = 'var(--ah-surface, rgba(255,255,255,0.04))';
        el.style.borderColor = 'var(--ah-border, rgba(255,255,255,0.08))';
        el.style.color = 'var(--ah-text-dim, #a8a8a8)';
      }}
    >
      {item.glyph && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: 4,
            background: item.color ? `${item.color}20` : 'var(--ah-surface, rgba(255,255,255,0.08))',
            border: `1px solid ${item.color ? `${item.color}40` : 'var(--ah-border, rgba(255,255,255,0.1))'}`,
            fontSize: 9,
            fontWeight: 700,
            color: item.color ?? 'var(--ah-accent, #c9b787)',
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          }}
        >
          {item.glyph}
        </span>
      )}
      {item.name}
    </span>
  );

  if (item.href) {
    return (
      <a href={item.href} style={{ textDecoration: 'none' }}>
        {inner}
      </a>
    );
  }
  return inner;
}

export function LogoWall({ items, label, animate = false, style, className }: LogoWallProps) {
  const row = (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center',
        ...(animate
          ? {
              flexWrap: 'nowrap',
              overflow: 'hidden',
              maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            }
          : {}),
      }}
    >
      {items.map((item) => (
        <LogoChip key={item.id} item={item} />
      ))}
    </div>
  );

  return (
    <div style={{ textAlign: 'center', ...style }} className={className}>
      {label && (
        <p
          style={{
            fontSize: '0.625rem',
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ah-text-muted, rgba(255,255,255,0.3))',
            marginBottom: '1rem',
          }}
        >
          {label}
        </p>
      )}
      {row}
    </div>
  );
}
