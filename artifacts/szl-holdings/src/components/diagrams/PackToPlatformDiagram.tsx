import { m, useReducedMotion } from 'framer-motion';
import { Package } from 'lucide-react';

const PACKS = [
  {
    id: 'aegis',
    label: 'PARAGON',
    sublabel: 'Defense & security ops',
    color: 'hsl(358,75%,58%)',
    bg: 'hsla(358,75%,58%,0.10)',
    border: 'hsla(358,75%,58%,0.22)',
  },
  {
    id: 'vessels',
    label: 'SEXTANT',
    sublabel: 'Maritime logistics',
    color: 'hsl(210,80%,60%)',
    bg: 'hsla(210,80%,60%,0.10)',
    border: 'hsla(210,80%,60%,0.22)',
  },
  {
    id: 'terra',
    label: 'DOMAINE',
    sublabel: 'Real estate intelligence',
    color: 'hsl(145,62%,46%)',
    bg: 'hsla(145,62%,40%,0.10)',
    border: 'hsla(145,62%,40%,0.22)',
  },
  {
    id: 'counsel',
    label: 'Counsel',
    sublabel: 'Legal operations',
    color: 'hsl(258,55%,68%)',
    bg: 'hsla(258,55%,68%,0.10)',
    border: 'hsla(258,55%,68%,0.22)',
  },
];

const PLATFORM_LAYERS = [
  { label: 'Lyte command layer', color: 'var(--color-lyte-light)' },
  { label: 'FORGE action spine + HITL approval', color: 'var(--color-alloy-light)' },
  { label: 'Proof Chain + audit trail', color: 'hsl(145,62%,46%)' },
  { label: 'GraphQL control plane', color: 'hsl(258,55%,68%)' },
  { label: 'Model mesh + Worldline', color: 'hsl(40,90%,54%)' },
];

export function PackToPlatformDiagram() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'hsla(214,12%,6%,0.80)',
        borderRadius: '0.875rem',
        border: '1px solid var(--color-szl-border)',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}
      >
        <Package size={13} color="hsl(40,90%,54%)" />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-szl-text-muted)',
          }}
        >
          Pack-to-Platform Relationship
        </span>
      </div>
      {/* Packs on top */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {PACKS.map((pack, i) => (
          <m.div
            key={pack.id}
            initial={prefersReduced ? false : { opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: i * 0.07 }}
            style={{
              background: pack.bg,
              border: `1px solid ${pack.border}`,
              borderRadius: '0.5rem',
              padding: '0.75rem 0.5rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: pack.color,
                marginBottom: '0.25rem',
              }}
            >
              {pack.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5rem',
                color: 'hsl(214,7%,44%)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.4,
              }}
            >
              {pack.sublabel}
            </div>
          </m.div>
        ))}
      </div>

      {/* Connection arrows */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
          {[0, 1, 2, 3].map((i) => (
            <svg key={i} width="16" height="24" viewBox="0 0 16 24" fill="none" style={{ flex: 1 }}>
              <path d="M8 0 L8 16" stroke="hsl(214,7%,26%)" strokeWidth="1.5" />
              <path
                d="M4 12 L8 20 L12 12"
                stroke="hsl(214,7%,26%)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          ))}
        </div>
      </div>

      {/* Core platform */}
      <m.div
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.38, delay: 0.28 }}
        style={{
          background: 'hsla(214,12%,8%,0.80)',
          border: '1px solid hsla(195,80%,50%,0.25)',
          borderRadius: '0.625rem',
          padding: '1rem 1.125rem',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'var(--color-lyte-light)',
            marginBottom: '0.625rem',
          }}
        >
          Core platform — governance model unchanged for all packs
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {PLATFORM_LAYERS.map((layer) => (
            <div
              key={layer.label}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: layer.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'hsl(214,7%,58%)' }}>{layer.label}</span>
            </div>
          ))}
        </div>
      </m.div>
      <div
        style={{
          marginTop: '0.875rem',
          padding: '0.625rem 0.875rem',
          background: 'hsla(40,90%,54%,0.06)',
          border: '1px solid hsla(40,90%,54%,0.18)',
          borderRadius: '0.4375rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            fontWeight: 500,
            color: 'hsl(40,90%,54%)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Packs extend governance — they cannot remove or bypass it
        </span>
      </div>
    </div>
  );
}
