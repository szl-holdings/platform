import { m, useReducedMotion } from 'framer-motion';
import { Link2 } from 'lucide-react';

const CHAIN_LINKS = [
  {
    id: 'source',
    label: 'Signal source',
    detail: 'Origin system + classification',
    color: 'hsl(195,80%,50%)',
  },
  {
    id: 'interpretation',
    label: 'Interpretation',
    detail: 'Context, owner, risk score',
    color: 'hsl(195,60%,55%)',
  },
  {
    id: 'recommendation',
    label: 'Recommendation',
    detail: 'Action type + confidence + evidence',
    color: 'var(--color-alloy-light)',
  },
  {
    id: 'approval',
    label: 'Approval decision',
    detail: 'Approver + rationale + timestamp',
    color: 'hsl(40,90%,54%)',
  },
  {
    id: 'execution',
    label: 'Execution',
    detail: 'Connector + scope + SLA start',
    color: 'var(--color-alloy)',
  },
  {
    id: 'outcome',
    label: 'Outcome',
    detail: 'Verification + audit record hash',
    color: 'hsl(145,62%,46%)',
  },
];

export function ProofChainDiagram() {
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
        <Link2 size={13} color="hsl(145,62%,46%)" />
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
          Proof Chain — Complete Lineage Record
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        {/* Vertical connector line */}
        <div
          style={{
            position: 'absolute',
            left: '15px',
            top: '12px',
            bottom: '12px',
            width: '1px',
            background: 'linear-gradient(to bottom, hsl(195,80%,50%), hsl(145,62%,46%))',
            opacity: 0.3,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {CHAIN_LINKS.map((link, i) => (
            <m.div
              key={link.id}
              initial={prefersReduced ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: `${link.color}15`,
                  border: `1.5px solid ${link.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: link.color,
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  background: 'hsla(214,12%,8%,0.60)',
                  border: '1px solid var(--color-szl-border)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'hsl(38,8%,84%)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {link.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.625rem',
                    fontWeight: 500,
                    color: 'hsl(214,7%,44%)',
                    letterSpacing: '0.06em',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {link.detail}
                </span>
              </div>
            </m.div>
          ))}
        </div>
      </div>
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'hsla(145,62%,40%,0.06)',
          border: '1px solid hsla(145,62%,40%,0.18)',
          borderRadius: '0.5rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            fontWeight: 500,
            color: 'hsl(145,62%,46%)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Immutable · Exportable (JSON/CSV) · 7-year retention · Structured for external review
        </span>
      </div>
    </div>
  );
}
