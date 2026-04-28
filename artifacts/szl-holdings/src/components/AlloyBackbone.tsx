import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const capabilities = [
  {
    label: 'Signal Ingestion',
    desc: 'Cross-platform data acquisition from operational, financial, and environmental sources.',
  },
  {
    label: 'Workflow Orchestration',
    desc: 'Multi-step process sequencing with conditional logic and dependency resolution.',
  },
  {
    label: 'Action Routing',
    desc: 'Intelligent distribution of tasks to the right person, system, or workflow queue.',
  },
  {
    label: 'Output Generation',
    desc: 'Structured reports, briefs, and automated workflows produced from raw signal.',
  },
  {
    label: 'Human Approval',
    desc: 'Built-in governance checkpoints that keep humans in the loop on high-stakes decisions.',
  },
];

const ALLOY_RGB = '92,155,228';

export function AlloyBackbone() {
  return (
    <section
      id="continuum"
      style={{
        padding: '6rem 0',
        background: 'hsl(210,12%,5%)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[480px,1fr] gap-16 lg:gap-24 items-start">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'hsl(214,75%,58%)',
                marginBottom: '0.75rem',
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              }}
            >
              Powered by Counsel
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: '700',
                letterSpacing: '-0.026em',
                color: 'hsl(38,12%,94%)',
                lineHeight: '1.06',
                marginBottom: '1.25rem',
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              }}
            >
              The intelligence and orchestration layer.
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: '1.7',
                color: 'hsl(210,5%,56%)',
                marginBottom: '2rem',
              }}
            >
              Counsel is the intelligence and orchestration layer powering workflows, signals,
              outputs, and decision support across the SZL ecosystem.
            </p>
            <a
              href="/continuum"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'hsl(214,80%,65%)',
                textDecoration: 'none',
                transition: 'all 0.18s ease',
                letterSpacing: '-0.003em',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'hsl(214,80%,75%)';
                (e.currentTarget as HTMLElement).style.gap = '10px';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'hsl(214,80%,65%)';
                (e.currentTarget as HTMLElement).style.gap = '6px';
              }}
            >
              View Architecture
              <ArrowRight size={13} strokeWidth={2.5} />
            </a>
          </m.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {capabilities.map((cap, i) => (
              <m.div
                key={cap.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.48, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  gap: '0.875rem',
                  padding: '1rem 1.125rem',
                  borderRadius: '4px',
                  background: `rgba(${ALLOY_RGB}, 0.04)`,
                  border: `1px solid rgba(${ALLOY_RGB}, 0.09)`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `rgba(${ALLOY_RGB}, 0.07)`;
                  el.style.borderColor = `rgba(${ALLOY_RGB}, 0.20)`;
                  el.style.boxShadow = `0 0 14px rgba(${ALLOY_RGB}, 0.06)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `rgba(${ALLOY_RGB}, 0.04)`;
                  el.style.borderColor = `rgba(${ALLOY_RGB}, 0.09)`;
                  el.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'hsl(214,80%,65%)',
                    flexShrink: 0,
                    marginTop: '5px',
                    boxShadow: `0 0 5px rgba(${ALLOY_RGB}, 0.5)`,
                  }}
                />
                <div>
                  <p
                    style={{
                      fontSize: '12.5px',
                      fontWeight: '600',
                      color: 'hsl(38,12%,88%)',
                      marginBottom: '0.2rem',
                      letterSpacing: '-0.005em',
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                    }}
                  >
                    {cap.label}
                  </p>
                  <p style={{ fontSize: '12px', lineHeight: '1.55', color: 'hsl(210,5%,50%)' }}>
                    {cap.desc}
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
