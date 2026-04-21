import { m, useReducedMotion } from 'framer-motion';

const STAGES = [
  {
    id: 'signal',
    label: 'Signal',
    sublabel: 'PRISM detects',
    color: 'hsl(195,80%,50%)',
    bg: 'hsla(195,80%,50%,0.10)',
    border: 'hsla(195,80%,50%,0.25)',
  },
  {
    id: 'interpret',
    label: 'Interpret',
    sublabel: 'Context + risk',
    color: 'hsl(195,60%,55%)',
    bg: 'hsla(195,60%,55%,0.10)',
    border: 'hsla(195,60%,55%,0.25)',
  },
  {
    id: 'recommend',
    label: 'Recommend',
    sublabel: 'FORGE proposes',
    color: 'var(--color-alloy-light)',
    bg: 'var(--color-alloy-muted)',
    border: 'var(--color-alloy-border)',
  },
  {
    id: 'approve',
    label: 'Approve',
    sublabel: 'Human gate',
    color: 'hsl(40,90%,54%)',
    bg: 'hsla(40,90%,54%,0.10)',
    border: 'hsla(40,90%,54%,0.25)',
  },
  {
    id: 'execute',
    label: 'Execute',
    sublabel: 'FORGE acts',
    color: 'var(--color-alloy)',
    bg: 'var(--color-alloy-muted)',
    border: 'var(--color-alloy-border)',
  },
  {
    id: 'audit',
    label: 'Audit',
    sublabel: 'Immutable record',
    color: 'hsl(145,62%,46%)',
    bg: 'hsla(145,62%,40%,0.10)',
    border: 'hsla(145,62%,40%,0.25)',
  },
];

export function SignalToActionDiagram() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'hsla(214,12%,6%,0.80)',
        borderRadius: '0.875rem',
        border: '1px solid var(--color-szl-border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-szl-text-muted)',
          marginBottom: '1.25rem',
        }}
      >
        Signal → Action Pipeline
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {STAGES.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <m.div
              initial={prefersReduced ? false : { opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.38, delay: i * 0.08 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.875rem 1rem',
                background: stage.bg,
                border: `1px solid ${stage.border}`,
                borderRadius: '0.625rem',
                minWidth: '90px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: stage.color,
                }}
              />
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'hsl(38,8%,88%)',
                  letterSpacing: '-0.01em',
                }}
              >
                {stage.label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5625rem',
                  fontWeight: 500,
                  color: 'hsl(214,7%,48%)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                {stage.sublabel}
              </span>
            </m.div>
            {i < STAGES.length - 1 && (
              <m.div
                initial={prefersReduced ? false : { opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 + 0.25 }}
                style={{ transformOrigin: 'left' }}
              >
                <svg
                  width="28"
                  height="16"
                  viewBox="0 0 28 16"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M2 8 H22" stroke="hsl(214,7%,28%)" strokeWidth="1.5" />
                  <path
                    d="M18 4 L26 8 L18 12"
                    stroke="hsl(214,7%,28%)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </m.div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Tenant-isolated at every stage', color: 'hsl(145,62%,46%)' },
          { label: 'HITL gate non-bypassable', color: 'hsl(40,90%,54%)' },
          { label: 'Full lineage exportable', color: 'var(--color-alloy-light)' },
        ].map((t) => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: t.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5625rem',
                fontWeight: 500,
                color: 'hsl(214,7%,44%)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
