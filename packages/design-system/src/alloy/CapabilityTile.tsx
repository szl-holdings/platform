import type { CSSProperties, ReactNode } from 'react';

export interface CapabilityTileProps {
  icon: ReactNode;
  title: string;
  body: string;
  productBadge?: string;
  productColor?: string;
  href?: string;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

export function CapabilityTile({
  icon,
  title,
  body,
  productBadge,
  productColor = '#c9b787',
  href,
  style,
  className,
  children,
}: CapabilityTileProps) {
  const inner = (
    <div
      style={{
        padding: '1.5rem',
        background: 'var(--ah-surface, rgba(255,255,255,0.025))',
        border: '1px solid var(--ah-border, rgba(255,255,255,0.07))',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
        cursor: href ? 'pointer' : 'default',
        textDecoration: 'none',
        ...style,
      }}
      className={className}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = 'var(--ah-border, rgba(255,255,255,0.045))';
        el.style.borderColor = 'var(--ah-border-strong, rgba(255,255,255,0.12))';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = 'var(--ah-surface, rgba(255,255,255,0.025))';
        el.style.borderColor = 'var(--ah-border, rgba(255,255,255,0.07))';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${productColor}14`,
            border: `1px solid ${productColor}28`,
            color: productColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {productBadge && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.2rem 0.5rem',
              background: `${productColor}12`,
              border: `1px solid ${productColor}24`,
              borderRadius: 4,
              fontSize: '0.625rem',
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: productColor,
              whiteSpace: 'nowrap',
            }}
          >
            {productBadge}
          </span>
        )}
      </div>
      <div>
        <h3
          style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--ah-text, #f5f5f5)',
            marginBottom: '0.375rem',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--ah-text-dim, #7a7a7a)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {body}
        </p>
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </a>
    );
  }
  return inner;
}
