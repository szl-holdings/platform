import { m } from 'framer-motion';

const developments = [
  {
    date: 'March 2026',
    tag: 'Platform',
    tagColor: 'hsl(192,70%,46%)',
    tagBg: 'hsla(192,70%,46%,0.10)',
    tagBorder: 'hsla(192,70%,46%,0.20)',
    title: 'KORA observability layer expanded',
    body: 'Advanced workflow friction analysis and KPI drift detection rolled out to all enterprise clients. Signal card architecture now surfaces consequence framing automatically.',
  },
  {
    date: 'February 2026',
    tag: 'Maritime',
    tagColor: 'hsl(208,65%,52%)',
    tagBg: 'hsla(208,65%,48%,0.10)',
    tagBorder: 'hsla(208,65%,48%,0.20)',
    title: 'SEXTANT intelligence layer expanded',
    body: 'Advanced anomaly detection and route deviation alerting rolled out to all fleet operator clients. Route intelligence now covers 94% of major global shipping lanes.',
  },
  {
    date: 'January 2026',
    tag: 'Advisory',
    tagColor: 'hsl(32,38%,62%)',
    tagBg: 'hsla(32,38%,58%,0.10)',
    tagBorder: 'hsla(32,38%,58%,0.20)',
    title: 'Carlota Jo Q1 mandates underway',
    body: 'Principal advisory practice at capacity with governance and capital allocation mandates across three industry verticals. New structured intake process launched.',
  },
];

export function LatestDevelopments() {
  return (
    <section
      id="developments"
      style={{
        background: 'hsl(210,12%,7%)',
        paddingTop: 'clamp(5rem,9vw,8rem)',
        paddingBottom: 'clamp(5rem,9vw,8rem)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
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
            Updates
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
            Latest from the ecosystem
          </h2>
        </m.div>

        <div>
          {developments.map((d, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.52, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 'clamp(1rem,4vw,3rem)',
                alignItems: 'flex-start',
                padding: '1.75rem 0',
                borderBottom:
                  i < developments.length - 1 ? '1px solid hsla(0,0%,100%,0.05)' : 'none',
              }}
            >
              <div style={{ minWidth: '120px' }}>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'hsl(210,5%,42%)',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  {d.date}
                </p>
                <span
                  style={{
                    display: 'inline-flex',
                    fontSize: '10px',
                    fontWeight: '600',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: d.tagColor,
                    background: d.tagBg,
                    border: `1px solid ${d.tagBorder}`,
                  }}
                >
                  {d.tag}
                </span>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    letterSpacing: '-0.008em',
                    color: 'hsl(38,12%,92%)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {d.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'hsl(210,5%,56%)',
                    lineHeight: '1.62',
                    maxWidth: '42rem',
                  }}
                >
                  {d.body}
                </p>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
