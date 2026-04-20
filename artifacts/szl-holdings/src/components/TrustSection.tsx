import { m } from 'framer-motion';

const credibilityBlocks = [
  {
    label: 'Architecture philosophy',
    value: 'Signal-first',
    description:
      'Lyte and Alloy are designed around the signal-to-action pipeline — not dashboards bolted onto existing workflow tools.',
  },
  {
    label: 'Execution model',
    value: 'Founder-led',
    description:
      'Stephen Lutar operates directly across every platform. No layers of account management between the founder and the work.',
  },
  {
    label: 'Audit posture',
    value: 'Built in',
    description:
      'Governance, audit trail, and accountability are core architecture — not compliance add-ons applied retroactively.',
  },
  {
    label: 'Design stage',
    value: 'Design-partner',
    description:
      'Lyte + Alloy is in active design-partner mode. Purpose-built for operators who want to co-develop the platform with direct founder access.',
  },
];

export function TrustSection() {
  return (
    <section
      id="trust"
      style={{
        background: 'hsl(210,12%,5%)',
        paddingTop: 'clamp(5rem,9vw,8rem)',
        paddingBottom: 'clamp(5rem,9vw,8rem)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1.25rem,5vw,2.5rem)' }}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 'clamp(2.5rem,5vw,4rem)' }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'hsl(210,5%,46%)',
              marginBottom: '1rem',
            }}
          >
            Operating posture
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.75rem,3.5vw,2.5rem)',
              fontWeight: '700',
              letterSpacing: '-0.022em',
              lineHeight: '1.12',
              color: 'hsl(38,12%,94%)',
              marginBottom: '0.75rem',
            }}
          >
            Built differently by design
          </h2>
          <p
            style={{
              fontSize: '1.0625rem',
              color: 'hsl(210,5%,58%)',
              lineHeight: '1.65',
              maxWidth: '36rem',
            }}
          >
            Lyte and Alloy are not built for the demo — they are built for the operator. The
            architecture reflects that.
          </p>
        </m.div>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4"
          style={{
            background: 'hsla(0,0%,100%,0.03)',
            borderRadius: '1rem',
            border: '1px solid hsla(0,0%,100%,0.06)',
            overflow: 'hidden',
          }}
        >
          {credibilityBlocks.map((b, i) => (
            <m.div
              key={b.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{
                padding: 'clamp(1.5rem,3vw,2rem)',
                borderRight:
                  i < credibilityBlocks.length - 1 ? '1px solid hsla(0,0%,100%,0.05)' : 'none',
              }}
              className={i < 2 ? 'sm:border-b sm:border-[hsla(0,0%,100%,0.05)] lg:border-b-0' : ''}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'hsl(210,5%,40%)',
                  marginBottom: '0.75rem',
                }}
              >
                {b.label}
              </p>
              <p
                style={{
                  fontSize: 'clamp(1.25rem,2.5vw,1.625rem)',
                  fontWeight: '700',
                  letterSpacing: '-0.025em',
                  lineHeight: '1.1',
                  color: 'hsl(38,12%,94%)',
                  marginBottom: '0.625rem',
                }}
              >
                {b.value}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'hsl(210,5%,52%)',
                  lineHeight: '1.58',
                }}
              >
                {b.description}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
