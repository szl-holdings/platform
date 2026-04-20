import { m } from 'framer-motion';

const problems = [
  {
    label: 'Approval Latency',
    desc: 'Workflows stalling for days with no visibility into who is blocking or why.',
  },
  {
    label: 'Ownership Gaps',
    desc: 'Critical processes with no clear owner — decisions delayed, value at risk.',
  },
  {
    label: 'Forecast Drift',
    desc: 'Pipeline numbers shifting without explanation, too late to course correct.',
  },
  {
    label: 'Readiness Tracking',
    desc: 'No structured view of execution readiness before milestones hit.',
  },
  {
    label: 'Voyage Profitability',
    desc: 'Fleet economics invisible until the voyage is complete and the damage is done.',
  },
  {
    label: 'Operational Exceptions',
    desc: 'Alerts without context, incidents without ownership, noise without resolution.',
  },
  {
    label: 'Workflow Routing',
    desc: 'Actions falling through cracks because routing is manual, inconsistent, or absent.',
  },
  {
    label: 'White-Glove Execution Support',
    desc: 'High-trust environments with no structured support model to match the complexity.',
  },
];

export function WhatItSolves() {
  return (
    <section
      style={{
        padding: '6rem 0',
        background: 'hsl(210,12%,6%)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <p
            style={{
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'hsl(210,5%,40%)',
              marginBottom: '0.75rem',
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            }}
          >
            What the System Solves
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: '700',
              letterSpacing: '-0.026em',
              color: 'hsl(38,12%,94%)',
              lineHeight: '1.06',
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            }}
          >
            Eight problems. One ecosystem.
          </h2>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {problems.map((p, i) => (
            <m.div
              key={p.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{
                padding: '1.25rem',
                borderRadius: '4px',
                background: 'hsla(0,0%,100%,0.02)',
                border: '1px solid hsla(0,0%,100%,0.055)',
                borderBottom: '1px solid hsla(0,0%,100%,0.04)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'hsla(0,0%,100%,0.04)';
                el.style.borderColor = 'hsla(0,0%,100%,0.10)';
                el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.28)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'hsla(0,0%,100%,0.02)';
                el.style.borderColor = 'hsla(0,0%,100%,0.055)';
                el.style.boxShadow = 'none';
              }}
            >
              <p
                style={{
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: 'hsl(38,12%,88%)',
                  marginBottom: '0.4rem',
                  letterSpacing: '-0.005em',
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
              >
                {p.label}
              </p>
              <p style={{ fontSize: '12px', lineHeight: '1.58', color: 'hsl(210,5%,50%)' }}>
                {p.desc}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
