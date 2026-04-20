import { m } from 'framer-motion';

const capabilities = [
  {
    market: 'Maritime & Logistics',
    description:
      'Real-time fleet intelligence across global shipping lanes, port operations, and cargo tracking.',
    accent: 'hsl(208,65%,48%)',
  },
  {
    market: 'Business Intelligence',
    description:
      'Enterprise observability platforms for operational risk, accountability, and workforce intelligence.',
    accent: 'hsl(192,70%,46%)',
  },
  {
    market: 'Strategic Advisory',
    description:
      'Principal-led advisory on governance, capital allocation, and operational transformation.',
    accent: 'hsl(32,38%,58%)',
  },
  {
    market: 'Cyber & Security',
    description:
      'Adversarial simulation, red-team exercises, and cyber readiness assessment at enterprise scale.',
    accent: 'hsl(28,78%,56%)',
  },
];

export function StrategicThesis() {
  return (
    <section
      style={{
        background: 'hsl(210,12%,5%)',
        paddingTop: 'clamp(5rem,9vw,8rem)',
        paddingBottom: 'clamp(5rem,9vw,8rem)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1.25rem,5vw,2.5rem)' }}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
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
              Ecosystem Logic
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.75rem,3.5vw,2.5rem)',
                fontWeight: '700',
                letterSpacing: '-0.022em',
                lineHeight: '1.12',
                color: 'hsl(38,12%,94%)',
                marginBottom: '1.5rem',
              }}
            >
              Why this ecosystem exists
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                color: 'hsl(210,5%,58%)',
                lineHeight: '1.65',
                marginBottom: '1.25rem',
              }}
            >
              The most defensible technology companies aren't built on a single product. They're
              built on ecosystems where data compounds across verticals, and every platform makes
              the others stronger.
            </p>
            <p
              style={{
                fontSize: '1.0625rem',
                color: 'hsl(210,5%,58%)',
                lineHeight: '1.65',
                marginBottom: '2.5rem',
              }}
            >
              SZL Holdings was founded on this conviction. We build and operate platforms across
              maritime intelligence, AI research, strategic advisory, and enterprise security — not
              as separate bets, but as an integrated system.
            </p>
            <blockquote
              style={{
                borderLeft: '2px solid hsla(210,10%,72%,0.25)',
                paddingLeft: '1.25rem',
              }}
            >
              <p
                style={{
                  fontSize: '1rem',
                  color: 'hsl(210,5%,68%)',
                  lineHeight: '1.65',
                  fontStyle: 'italic',
                  fontWeight: '300',
                  marginBottom: '0.75rem',
                }}
              >
                "Vertical integration of AI across critical infrastructure creates defensible,
                compounding value that horizontal platforms cannot replicate."
              </p>
              <footer
                style={{
                  fontSize: '11px',
                  color: 'hsl(210,5%,42%)',
                  fontWeight: '500',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                SZL Holdings — Investment Thesis
              </footer>
            </blockquote>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.62, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,46%)',
                marginBottom: '1.5rem',
              }}
            >
              Market Verticals
            </span>

            <div>
              {capabilities.map((cap, i) => (
                <m.div
                  key={cap.market}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'flex',
                    gap: '1.125rem',
                    padding: '1.25rem 0',
                    borderBottom:
                      i < capabilities.length - 1 ? '1px solid hsla(0,0%,100%,0.05)' : 'none',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: `${cap.accent}14`,
                      border: `1px solid ${cap.accent}28`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: cap.accent,
                      }}
                    />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        letterSpacing: '-0.005em',
                        color: 'hsl(38,12%,88%)',
                        marginBottom: '0.375rem',
                      }}
                    >
                      {cap.market}
                    </h3>
                    <p
                      style={{ fontSize: '0.875rem', color: 'hsl(210,5%,56%)', lineHeight: '1.58' }}
                    >
                      {cap.description}
                    </p>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
