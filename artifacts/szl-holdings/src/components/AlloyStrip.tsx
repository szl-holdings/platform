import { m } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const capabilities = [
  {
    label: 'Agent orchestration',
    description: 'Multi-agent workflows with structured approval chains',
  },
  { label: 'Signal routing', description: 'Intelligent signal dispatch across the ecosystem' },
  {
    label: 'AI governance',
    description: 'Explainability, audit trails, and decision accountability',
  },
  {
    label: 'Ecosystem backbone',
    description: 'Shared intelligence layer connecting all platforms',
  },
];

function FlowDiagram() {
  const nodes = [
    { label: 'Inputs', x: 8 },
    { label: 'FORGE', x: 38, highlight: true },
    { label: 'Agents', x: 62 },
    { label: 'Outputs', x: 90 },
  ];

  return (
    <div style={{ position: 'relative', height: '64px', overflow: 'visible' }}>
      <svg
        viewBox="0 0 100 20"
        className="w-full h-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <m.line
            key={i}
            x1={nodes[i].x + 8}
            y1="10"
            x2={nodes[i + 1].x - 8}
            y2="10"
            stroke="hsla(218,50%,58%,0.25)"
            strokeWidth="0.5"
            strokeDasharray="1 1"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }}
          />
        ))}
        {nodes.map((n, i) => (
          <m.g
            key={n.label}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${n.x}% 50%` }}
          >
            <circle
              cx={n.x}
              cy="10"
              r={n.highlight ? '5' : '3.5'}
              fill={n.highlight ? 'hsla(218,50%,58%,0.16)' : 'hsla(0,0%,100%,0.04)'}
              stroke={n.highlight ? 'hsl(218,50%,58%)' : 'hsla(0,0%,100%,0.12)'}
              strokeWidth="0.5"
            />
          </m.g>
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-around px-4">
        {nodes.map((n) => (
          <span
            key={n.label}
            style={{
              fontSize: '10px',
              fontWeight: n.highlight ? '600' : '500',
              color: n.highlight ? 'hsl(218,50%,66%)' : 'hsl(210,5%,48%)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {n.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AlloyStrip() {
  return (
    <section
      style={{
        background: 'hsl(210,12%,7%)',
        paddingTop: 'clamp(5rem,9vw,8rem)',
        paddingBottom: 'clamp(5rem,9vw,8rem)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
        borderBottom: '1px solid hsla(0,0%,100%,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 60% 50%, hsla(218,50%,58%,0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1.25rem,5vw,2.5rem)' }}>
        <div className="grid lg:grid-cols-[1fr,400px] gap-12 lg:gap-16 items-center">
          <m.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  background: 'hsla(218,50%,58%,0.10)',
                  border: '1px solid hsla(218,50%,58%,0.20)',
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'hsl(218,50%,68%)',
                }}
              >
                Powered by FORGE
              </div>
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.75rem,3.5vw,2.5rem)',
                fontWeight: '700',
                letterSpacing: '-0.022em',
                lineHeight: '1.12',
                color: 'hsl(38,12%,94%)',
                marginBottom: '1rem',
              }}
            >
              The technical backbone
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                color: 'hsl(210,5%,58%)',
                lineHeight: '1.65',
                marginBottom: '2rem',
                maxWidth: '30rem',
              }}
            >
              FORGE is the AI orchestration engine that connects the entire ecosystem. Every
              intelligent workflow, agent decision, and cross-platform signal flows through Alloy.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {capabilities.map((cap, i) => (
                <m.div
                  key={cap.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.48, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    background: 'hsla(218,20%,10%,0.50)',
                    border: '1px solid hsla(218,50%,58%,0.12)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      letterSpacing: '-0.005em',
                      color: 'hsl(38,12%,92%)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {cap.label}
                  </p>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'hsl(210,5%,54%)',
                      lineHeight: '1.55',
                    }}
                  >
                    {cap.description}
                  </p>
                </m.div>
              ))}
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.62, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              style={{
                padding: '1.75rem',
                borderRadius: '1rem',
                background: 'hsla(218,20%,9%,0.60)',
                border: '1px solid hsla(218,50%,58%,0.14)',
                boxShadow: '0 8px 32px hsla(218,50%,20%,0.18)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'hsl(210,5%,44%)',
                  }}
                >
                  Orchestration flow
                </span>
                <a
                  href="/alloy"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'hsl(218,50%,62%)',
                    textDecoration: 'none',
                    letterSpacing: '-0.003em',
                  }}
                >
                  View Alloy <ArrowUpRight size={12} />
                </a>
              </div>
              <FlowDiagram />
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'hsla(0,0%,100%,0.03)',
                  border: '1px solid hsla(0,0%,100%,0.05)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'hsl(152,50%,42%)',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'hsl(210,5%,46%)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    System status
                  </span>
                </div>
                {[
                  { name: 'Agent orchestration', status: 'Operational', color: 'hsl(152,50%,42%)' },
                  { name: 'Signal routing', status: 'Operational', color: 'hsl(152,50%,42%)' },
                  { name: 'Governance layer', status: 'Operational', color: 'hsl(152,50%,42%)' },
                ].map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.375rem 0',
                      borderBottom: '1px solid hsla(0,0%,100%,0.04)',
                    }}
                  >
                    <span style={{ fontSize: '12.5px', color: 'hsl(210,5%,56%)' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: item.color }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
