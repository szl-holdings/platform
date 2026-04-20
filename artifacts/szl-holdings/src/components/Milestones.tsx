import { m } from 'framer-motion';

const milestones = [
  {
    date: 'Q1 2022',
    title: 'Company founded',
    description:
      'SZL Holdings incorporated with initial capital deployment into maritime intelligence.',
  },
  {
    date: 'Q3 2022',
    title: 'Vessels launched',
    description:
      'Vessels Maritime Intelligence enters private beta with first fleet operator clients.',
  },
  {
    date: 'Q1 2023',
    title: 'Alloy engine operational',
    description:
      'Alloy execution fabric reaches operational status powering predictive intelligence across the ecosystem.',
  },
  {
    date: 'Q2 2023',
    title: 'Carlota Jo Advisory established',
    description:
      'Principal advisory practice launched serving boards, leadership teams, and investors.',
  },
  {
    date: 'Q4 2023',
    title: 'Lyte enters production',
    description:
      'Lyte decision intelligence platform operational, delivering continuous operational observability and risk detection for enterprise clients.',
  },
  {
    date: '2024–2025',
    title: 'Ecosystem expansion',
    description:
      'Lyte and Alloy platforms launched. Shared infrastructure layer connects all operating platforms.',
  },
];

export function Milestones() {
  return (
    <section
      id="milestones"
      style={{
        background: 'hsl(210,12%,7%)',
        paddingTop: 'clamp(5rem,9vw,8rem)',
        paddingBottom: 'clamp(5rem,9vw,8rem)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
        borderBottom: '1px solid hsla(0,0%,100%,0.04)',
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
            Proof of Execution
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.75rem,3.5vw,2.5rem)',
              fontWeight: '700',
              letterSpacing: '-0.022em',
              lineHeight: '1.12',
              color: 'hsl(38,12%,94%)',
            }}
          >
            Building since 2022
          </h2>
        </m.div>

        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '7px',
              top: '8px',
              bottom: '8px',
              width: '1px',
              background: 'hsla(0,0%,100%,0.06)',
            }}
            className="hidden sm:block"
            aria-hidden="true"
          />

          <div className="space-y-0">
            {milestones.map((item, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.52, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'relative',
                  paddingBottom: i < milestones.length - 1 ? '2rem' : 0,
                }}
                className="sm:pl-9"
              >
                <div
                  className="hidden sm:block"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '8px',
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    border: '1.5px solid hsla(210,10%,72%,0.30)',
                    background: 'hsl(210,12%,7%)',
                    zIndex: 1,
                  }}
                  aria-hidden="true"
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '1rem',
                    marginBottom: '0.375rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: 'hsl(210,5%,40%)',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                      minWidth: '5rem',
                    }}
                  >
                    {item.date}
                  </span>
                  <h3
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      letterSpacing: '-0.005em',
                      color: 'hsl(38,12%,92%)',
                    }}
                  >
                    {item.title}
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'hsl(210,5%,56%)',
                    lineHeight: '1.58',
                    maxWidth: '36rem',
                    paddingLeft: '6rem',
                  }}
                  className="sm:pl-0"
                >
                  {item.description}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
