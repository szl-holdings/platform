import { useState } from 'react';
import { Layout } from '../components/layout';
import { motion } from 'framer-motion';
import { SEVEN_PRINCIPLES, BLUEPRINT_COMPONENTS, IMPLEMENTATION_PRIORITIES } from '../data/blueprint';

const T = {
  bg: '#0a0a0a',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', Times, serif",
};

const CATEGORY_COLORS: Record<string, string> = {
  Core: '#c9b787',
  Intelligence: '#8a8a8a',
  Execution: '#8a8a8a',
  Governance: '#b08d52',
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, delay, ease }}
    >{children}</motion.div>
  );
}

export function ArchitectureOverview() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Layout>
      <div style={{ paddingBottom: '4rem' }}>
        <div style={{
          padding: '3rem 0 2.5rem',
          borderBottom: `1px solid ${T.border}`,
          marginBottom: '3rem',
        }}>
          <p style={{
            fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: T.textMuted, margin: '0 0 1.25rem',
          }}>Architecture</p>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: T.serif,
            fontWeight: 400, letterSpacing: '-0.03em', color: T.text,
            lineHeight: 1.1, margin: '0 0 1rem',
          }}>
            Eleven architecture components.{' '}
            <span style={{ color: T.accent }}>One governed system.</span>
          </h1>
          <p style={{
            fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim,
            maxWidth: '64ch', margin: '0 0 2rem',
          }}>
            A governed agentic OS that perceives business events, reasons across domains, calls tools,
            executes workflows, verifies outcomes, and leaves a proof trail. These eleven components
            make that north star operational.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            {SEVEN_PRINCIPLES.map((p, i) => {
              const isAccent = p.label === 'Act' || p.label === 'Audit';
              return (
                <span key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{
                    padding: '0.25rem 0.625rem', borderRadius: 6,
                    fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
                    color: isAccent ? T.accent : T.textDim,
                    background: isAccent ? 'rgba(201,183,135,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isAccent ? 'rgba(201,183,135,0.25)' : T.border}`,
                  }}>{p.label}</span>
                  {i < SEVEN_PRINCIPLES.length - 1 && (
                    <span style={{ fontSize: '0.625rem', color: T.textMuted, fontFamily: T.mono }}>→</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <FadeIn>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1px', background: T.border, borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${T.border}`, marginBottom: '3rem',
          }}>
            {BLUEPRINT_COMPONENTS.map((c, i) => {
              const catColor = CATEGORY_COLORS[c.category] ?? T.textDim;
              const isSelected = selected === c.id;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease }}
                  onClick={() => setSelected(isSelected ? null : c.id)}
                  style={{
                    padding: '1.75rem',
                    background: isSelected ? `${catColor}08` : T.bg,
                    borderTop: `2px solid ${isSelected ? catColor : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
                      letterSpacing: '0.16em', textTransform: 'uppercase',
                      padding: '0.2rem 0.5rem', borderRadius: 4,
                      color: catColor,
                      background: `${catColor}12`,
                    }}>{c.category}</span>
                    <span style={{ fontSize: '0.625rem', color: T.textMuted, fontFamily: T.mono }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.015em', color: T.text, margin: 0 }}>
                    {c.name}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>
                    {c.purpose}
                  </p>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {c.principles.map(pr => (
                      <span key={pr} style={{
                        fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500,
                        padding: '0.15rem 0.45rem', borderRadius: 4,
                        color: T.accent, background: 'rgba(201,183,135,0.08)',
                        border: '1px solid rgba(201,183,135,0.2)',
                      }}>{pr}</span>
                    ))}
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      style={{ paddingTop: '0.75rem', borderTop: `1px solid ${T.border}` }}
                    >
                      <div style={{
                        fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
                        letterSpacing: '0.14em', color: T.textMuted, marginBottom: '0.5rem',
                      }}>ADJACENT COMPONENTS</div>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {c.adjacent.map(adj => (
                          <span key={adj} style={{
                            fontSize: '0.625rem', fontFamily: T.mono,
                            padding: '0.15rem 0.5rem', borderRadius: 4,
                            color: T.textDim, background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${T.border}`,
                          }}>{adj}</span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div style={{ marginBottom: '3rem' }}>
            <p style={{
              fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: T.textMuted, margin: '0 0 1.75rem',
            }}>Implementation Priorities</p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1px', background: T.border, borderRadius: 12, overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}>
              {IMPLEMENTATION_PRIORITIES.map((p, i) => (
                <motion.div
                  key={p.num}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.45, delay: i * 0.04, ease }}
                  style={{ padding: '1.5rem', background: T.bg, display: 'flex', gap: '1rem' }}
                >
                  <span style={{
                    fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
                    color: T.textMuted, flexShrink: 0, paddingTop: '0.125rem',
                  }}>{p.num}</span>
                  <div>
                    <div style={{
                      fontSize: '0.9375rem', fontWeight: 600, color: T.text,
                      marginBottom: '0.375rem', letterSpacing: '-0.01em',
                    }}>{p.name}</div>
                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.textDim, margin: 0 }}>{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{
            padding: '2rem', borderRadius: 12,
            background: 'rgba(201,183,135,0.04)',
            border: '1px solid rgba(201,183,135,0.15)',
          }}>
            <p style={{
              fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: T.accent, margin: '0 0 0.75rem',
            }}>Positioning</p>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: T.textDim, margin: 0 }}>
              A11oy does not claim to be AGI. It is a governed agentic intelligence layer that integrates
              domain-specific agents, business observability, human approval, tool execution, and proof-chain
              auditability. This differentiates it from general AI models and from unverified automation platforms.
            </p>
          </div>
        </FadeIn>
      </div>
    </Layout>
  );
}
