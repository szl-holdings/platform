import { m, useReducedMotion } from 'framer-motion';
import { Network } from 'lucide-react';

const LAYERS = [
  {
    label: 'Frontend surfaces',
    items: ['Lyte Today', 'Counsel Workflows', 'Pack apps', 'Mobile'],
    color: 'var(--color-lyte-light)',
    bg: 'var(--color-lyte-muted)',
    border: 'var(--color-lyte-border)',
  },
  {
    label: 'GraphQL control plane',
    items: [
      'Typed resolvers',
      'Tenant-scoped middleware',
      'Permission checks',
      'Schema versioning',
    ],
    color: 'hsl(258,55%,68%)',
    bg: 'hsla(258,55%,68%,0.10)',
    border: 'hsla(258,55%,68%,0.25)',
    highlight: true,
  },
  {
    label: 'Platform services',
    items: ['Signal engine', 'Action engine', 'Audit trail', 'Model mesh'],
    color: 'var(--color-alloy-light)',
    bg: 'var(--color-alloy-muted)',
    border: 'var(--color-alloy-border)',
  },
  {
    label: 'Data + connectors',
    items: ['Tenant DBs', 'External APIs', 'Worldline', 'Proof Chain store'],
    color: 'hsl(145,62%,46%)',
    bg: 'hsla(145,62%,40%,0.10)',
    border: 'hsla(145,62%,40%,0.25)',
  },
];

export function ControlPlaneDiagram() {
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
        <Network size={13} color="hsl(258,55%,68%)" />
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
          GraphQL Control Plane — Layer Model
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {LAYERS.map((layer, i) => (
          <m.div
            key={layer.label}
            initial={prefersReduced ? false : { opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            style={{
              background: layer.bg,
              border: `1px solid ${layer.border}`,
              borderRadius: '0.5rem',
              padding: '0.875rem 1rem',
              outline: layer.highlight ? `1px solid ${layer.color}30` : 'none',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5625rem',
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: layer.color,
                marginBottom: '0.5rem',
              }}
            >
              {layer.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {layer.items.map((item) => (
                <span
                  key={item}
                  style={{
                    fontSize: '0.75rem',
                    color: 'hsl(38,8%,74%)',
                    background: 'hsla(214,12%,8%,0.60)',
                    border: '1px solid var(--color-szl-border)',
                    borderRadius: '0.25rem',
                    padding: '0.125rem 0.5rem',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </m.div>
        ))}
      </div>
      <div
        style={{
          marginTop: '1rem',
          padding: '0.625rem 0.875rem',
          background: 'hsla(258,55%,68%,0.06)',
          border: '1px solid hsla(258,55%,68%,0.18)',
          borderRadius: '0.4375rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            fontWeight: 500,
            color: 'hsl(258,55%,68%)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          All data access flows through GraphQL · Tenant-scoped at middleware · No side channels
        </span>
      </div>
    </div>
  );
}
