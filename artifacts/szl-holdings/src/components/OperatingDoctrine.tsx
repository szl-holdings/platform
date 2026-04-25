import { m } from 'framer-motion';

const doctrine = [
  {
    step: '01',
    label: 'Observe',
    desc: 'Every platform surfaces signals continuously — from operational data, fleet movements, business metrics, and environmental inputs. Nothing waits to be discovered.',
    accent: 'hsl(190,90%,55%)',
    accentRgb: '14,201,224',
    platform: 'Lyte',
  },
  {
    step: '02',
    label: 'Interpret',
    desc: 'The Counsel engine normalizes raw signal across all platforms — classifying severity, attributing ownership, and connecting data points into consequence-aware intelligence.',
    accent: 'hsl(214,80%,65%)',
    accentRgb: '92,155,228',
    platform: 'Counsel Engine',
  },
  {
    step: '03',
    label: 'Decide',
    desc: 'Leadership teams receive structured, explainable recommendations with confidence scores, value-at-risk estimates, and clear action options — not data dumps.',
    accent: 'hsl(265,80%,60%)',
    accentRgb: '139,92,246',
    platform: 'Aegis',
  },
  {
    step: '04',
    label: 'Execute',
    desc: 'The Counsel engine orchestrates multi-step workflows with approval gates, routing logic, and audit trails. Vessels applies the same discipline to maritime command. Every action is traceable.',
    accent: 'hsl(205,85%,55%)',
    accentRgb: '38,164,218',
    platform: 'Counsel + Vessels',
  },
  {
    step: '05',
    label: 'Advise',
    desc: "Carlota Jo delivers the human layer — high-trust, discreet, high-consequence support where structured systems meet the principal's reality. White-glove execution at scale.",
    accent: 'hsl(38,55%,58%)',
    accentRgb: '191,152,82',
    platform: 'Carlota Jo',
  },
];

export function OperatingDoctrine() {
  return (
    <section
      id="doctrine"
      style={{
        padding: 'clamp(5rem,9vw,8rem) 0',
        background: 'hsl(210,12%,4%)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1.25rem,5vw,2.5rem)' }}>
        <div className="grid lg:grid-cols-[420px,1fr] gap-12 lg:gap-20 items-start">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,40%)',
                marginBottom: '0.875rem',
                fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
              }}
            >
              Operating Doctrine
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.75rem,3.5vw,2.75rem)',
                fontWeight: '700',
                letterSpacing: '-0.026em',
                color: 'hsl(38,12%,94%)',
                lineHeight: '1.07',
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                marginBottom: '1.25rem',
              }}
            >
              Five disciplines. One system.
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: '1.72',
                color: 'hsl(210,5%,54%)',
                maxWidth: '26rem',
                marginBottom: '1.75rem',
              }}
            >
              Every SZL Holdings platform operates from a shared doctrine: observe reality,
              interpret signal, decide with clarity, execute with precision, and advise with trust.
              The platforms are different. The discipline is identical.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.25rem',
                borderRadius: '4px',
                background: 'hsla(0,0%,100%,0.02)',
                border: '1px solid hsla(0,0%,100%,0.06)',
                fontSize: '11px',
                color: 'hsl(210,5%,52%)',
                fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                letterSpacing: '0.04em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'hsl(152,62%,46%)',
                  display: 'inline-block',
                  boxShadow: '0 0 6px hsla(152,62%,46%,0.5)',
                }}
              />
              Observe → Interpret → Decide → Execute → Advise
            </div>
          </m.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {doctrine.map((d, i) => (
              <m.div
                key={d.step}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.125rem 1.25rem',
                  borderRadius: '4px',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.05)',
                  transition: 'all 0.22s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `rgba(${d.accentRgb}, 0.05)`;
                  el.style.borderColor = `rgba(${d.accentRgb}, 0.18)`;
                  el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.22)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(0,0%,100%,0.02)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.05)';
                  el.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    paddingTop: '2px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      color: `rgba(${d.accentRgb}, 0.7)`,
                      fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                      letterSpacing: '0.06em',
                    }}
                  >
                    {d.step}
                  </span>
                  <div
                    style={{
                      width: '2px',
                      height: i < doctrine.length - 1 ? '32px' : '0',
                      background: `rgba(${d.accentRgb}, 0.2)`,
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.875rem',
                      marginBottom: '0.375rem',
                    }}
                  >
                    <p
                      style={{
                        fontWeight: '700',
                        color: `rgba(${d.accentRgb}, 0.9)`,
                        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontSize: '10px',
                      }}
                    >
                      {d.label}
                    </p>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'hsl(210,5%,38%)',
                        fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                      }}
                    >
                      {d.platform}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'hsl(210,5%,52%)' }}>
                    {d.desc}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
