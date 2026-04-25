import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const FLOW_NODES = [
  {
    group: 'Intake',
    color: '#d4a054',
    border: 'hsla(38,72%,58%,0.20)',
    bg: 'hsla(38,72%,58%,0.07)',
    nodes: [
      'Case management import',
      'Document ingestion',
      'Regulation 68 clock init',
      'Insurer assignment',
    ],
  },
  {
    group: 'Signal Assembly',
    color: '#8b7ac8',
    border: 'hsla(258,40%,60%,0.20)',
    bg: 'hsla(258,40%,60%,0.07)',
    nodes: [
      'Matter Twin construction',
      'Worldline features',
      'Counsel AI extraction',
      'External feeds merge',
    ],
  },
  {
    group: 'Intelligence',
    color: '#4a90b8',
    border: 'hsla(207,52%,40%,0.20)',
    bg: 'hsla(207,52%,40%,0.07)',
    nodes: [
      'PRISM pillar scoring',
      'Settlement forecast',
      'Deadline risk ranking',
      'Insurer pressure index',
    ],
  },
  {
    group: 'Governed Action',
    color: '#c8953c',
    border: 'hsla(36,56%,50%,0.20)',
    bg: 'hsla(36,56%,50%,0.07)',
    nodes: [
      'Review Before Send',
      'Partner approval gate',
      'Proof chain record',
      'M365 export pipeline',
    ],
  },
];

export function AlloyMatterFlowDiagram() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'hsla(214,12%,5%,0.90)',
        borderRadius: '0.875rem',
        border: '1px solid hsla(0,0%,100%,0.08)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.5625rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'hsl(38,72%,58%)',
          marginBottom: '1rem',
        }}
      >
        Counsel — Matter Signal to Governed Action
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          alignItems: 'start',
        }}
      >
        {FLOW_NODES.map((col, ci) => (
          <m.div
            key={col.group}
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: ci * 0.09 }}
          >
            <div
              style={{
                background: col.bg,
                border: `1px solid ${col.border}`,
                borderRadius: '0.4375rem',
                padding: '0.75rem 0.875rem',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: col.color,
                  marginBottom: '0.625rem',
                }}
              >
                {col.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {col.nodes.map((node) => (
                  <div
                    key={node}
                    style={{
                      fontSize: '0.6875rem',
                      color: 'hsl(214,7%,68%)',
                      padding: '0.25rem 0.375rem',
                      background: 'hsla(214,12%,8%,0.55)',
                      borderRadius: '0.1875rem',
                      border: '1px solid hsla(0,0%,100%,0.04)',
                    }}
                  >
                    {node}
                  </div>
                ))}
              </div>
            </div>
            {ci < FLOW_NODES.length - 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '0.25rem',
                  marginRight: '-0.375rem',
                }}
              >
                <ArrowRight size={10} color="hsl(214,7%,38%)" />
              </div>
            )}
          </m.div>
        ))}
      </div>

      <div
        style={{
          marginTop: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          flexWrap: 'wrap',
        }}
      >
        {[
          'Signal',
          '→',
          'Intelligence',
          '→',
          'Review',
          '→',
          'Approval',
          '→',
          'Proof Chain',
          '→',
          'Export',
        ].map((t, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.5rem',
              color: t === '→' ? 'hsl(214,7%,32%)' : 'hsl(214,7%,52%)',
              letterSpacing: '0.04em',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
