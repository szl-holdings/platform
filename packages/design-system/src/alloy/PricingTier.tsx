import type { CSSProperties } from 'react';

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingTierProps {
  name: string;
  tagline: string;
  price?: string;
  priceSuffix?: string;
  features: PricingFeature[];
  cta: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  featured?: boolean;
  featuredLabel?: string;
  accentColor?: string;
  style?: CSSProperties;
  className?: string;
}

export function PricingTier({
  name,
  tagline,
  price,
  priceSuffix = '/ mo',
  features,
  cta,
  ctaHref,
  onCtaClick,
  featured = false,
  featuredLabel = 'Most popular',
  accentColor = '#c9b787',
  style,
  className,
}: PricingTierProps) {
  const handleCtaClick = () => {
    if (onCtaClick) onCtaClick();
    else if (ctaHref) window.location.href = ctaHref;
  };

  return (
    <div
      style={{
        padding: '2rem',
        background: featured ? `${accentColor}08` : 'var(--ah-surface, rgba(255,255,255,0.025))',
        border: `1px solid ${featured ? `${accentColor}30` : 'var(--ah-border, rgba(255,255,255,0.07))'}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        position: 'relative',
        ...style,
      }}
      className={className}
    >
      {featured && featuredLabel && (
        <span
          style={{
            position: 'absolute',
            top: '-1px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.875rem',
            background: accentColor,
            borderRadius: '0 0 8px 8px',
            fontSize: '0.625rem',
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ah-bg, #0a0a0a)',
            whiteSpace: 'nowrap',
          }}
        >
          {featuredLabel}
        </span>
      )}

      <div>
        <h3
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--ah-text, #f5f5f5)',
            marginBottom: '0.25rem',
            letterSpacing: '-0.01em',
          }}
        >
          {name}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--ah-text-muted, #6a6a6a)', margin: 0 }}>{tagline}</p>
      </div>

      {price && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: featured ? accentColor : 'var(--ah-text, #f5f5f5)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {price}
          </span>
          {priceSuffix && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--ah-text-muted, #5a5a5a)' }}>{priceSuffix}</span>
          )}
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {features.map((f, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: f.included ? 'var(--ah-text-dim, #c8c8c8)' : 'var(--ah-text-muted, #4a4a4a)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                marginTop: '0.1em',
                width: 14,
                height: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: f.included ? `${accentColor}18` : 'var(--ah-surface, rgba(255,255,255,0.04))',
                color: f.included ? accentColor : 'var(--ah-text-muted, #3a3a3a)',
                fontSize: 9,
                fontWeight: 900,
              }}
            >
              {f.included ? '✓' : '–'}
            </span>
            {f.text}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleCtaClick}
        style={{
          marginTop: 'auto',
          padding: '0.75rem 1.25rem',
          background: featured ? accentColor : 'var(--ah-surface, rgba(255,255,255,0.06))',
          border: `1px solid ${featured ? accentColor : 'var(--ah-border, rgba(255,255,255,0.1))'}`,
          borderRadius: 8,
          fontSize: '0.875rem',
          fontWeight: 600,
          color: featured ? 'var(--ah-bg, #0a0a0a)' : 'var(--ah-text, #f5f5f5)',
          cursor: 'pointer',
          transition: 'background 0.15s, opacity 0.15s',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.opacity = '0.85';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.opacity = '1';
        }}
      >
        {cta}
      </button>
    </div>
  );
}
