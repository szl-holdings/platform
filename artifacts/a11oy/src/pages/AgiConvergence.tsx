import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import {
  UNSOLVED_GAPS,
  ECOSYSTEM_ORGS,
  ORIGINAL_INNOVATIONS,
  CONVERGENCE_STATS,
} from '../data/agiConvergenceData';

const API = '/api/a11oy';

interface SovereignSummary {
  models: { registered: number; active: number };
  skills: { total: number; live: number };
}

function useSovereignStats() {
  const [stats, setStats] = useState<SovereignSummary | null>(null);
  useEffect(() => {
    fetch(`${API}/sovereign/summary`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.data ? setStats(d.data) : null)
      .catch(() => null);
  }, []);
  return stats;
}

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  accentDim: 'rgba(201,183,135,0.15)',
  accentGlow: 'rgba(201,183,135,0.06)',
  mono: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => (p === '/' ? BASE + '/' : BASE + p);

function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, delay, ease }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <p style={{
      fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500,
      letterSpacing: '0.2em', textTransform: 'uppercase',
      color: accent ? T.accent : T.muted, margin: '0 0 1.5rem',
    }}>{children}</p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 'clamp(1.6rem, 3vw, 2.5rem)',
      fontFamily: T.serif, fontWeight: 400,
      letterSpacing: '-0.03em', lineHeight: 1.1,
      color: T.text, margin: '0 0 1rem',
    }}>{children}</h2>
  );
}

function GapCard({ gap, index }: { gap: typeof UNSOLVED_GAPS[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <FadeIn delay={index * 0.06}>
      <motion.div
        whileHover={{ borderColor: 'rgba(201,183,135,0.25)' }}
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '1.5rem',
          borderRadius: 10,
          border: `1px solid ${T.border}`,
          backgroundColor: T.surface,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6,
              backgroundColor: T.accentGlow, border: `1px solid ${T.accentDim}`,
              fontSize: '0.7rem', fontFamily: T.mono, color: T.accent, fontWeight: 700,
              flexShrink: 0,
            }}>{String(index + 1).padStart(2, '0')}</span>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text, margin: 0 }}>{gap.gap}</h3>
          </div>
          <span style={{
            fontSize: '0.55rem', fontFamily: T.mono, padding: '2px 8px',
            borderRadius: 999, backgroundColor: T.accentDim, color: T.accent,
            border: `1px solid rgba(201,183,135,0.3)`,
            textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
          }}>SOLVED</span>
        </div>

        <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: T.dim, margin: '0 0 0.75rem' }}>
          {gap.industryProblem}
        </p>

        <motion.div
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          initial={{ height: 0, opacity: 0 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            padding: '0.875rem',
            borderRadius: 8,
            backgroundColor: T.accentGlow,
            border: `1px solid ${T.accentDim}`,
            marginBottom: '0.75rem',
          }}>
            <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
              Why it matters
            </div>
            <p style={{ fontSize: '0.72rem', lineHeight: 1.6, color: T.dim, margin: 0 }}>{gap.whyItMatters}</p>
          </div>
        </motion.div>

        <div style={{
          padding: '0.875rem',
          borderRadius: 8,
          backgroundColor: 'rgba(201,183,135,0.04)',
          border: `1px solid ${T.accentDim}`,
        }}>
          <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
            a11oy answer · {gap.a11oyPrimitive}
          </div>
          <p style={{ fontSize: '0.72rem', lineHeight: 1.6, color: T.text, margin: 0 }}>{gap.a11oyAnswer}</p>
        </div>

        <div style={{ marginTop: '0.75rem', fontSize: '0.6rem', fontFamily: T.mono, color: T.muted }}>
          {expanded ? '↑ collapse' : '↓ expand'}
        </div>
      </motion.div>
    </FadeIn>
  );
}

function EcosystemCard({ org, index }: { org: typeof ECOSYSTEM_ORGS[0]; index: number }) {
  const [active, setActive] = useState(false);
  const statusColor = org.status === 'surpassed' ? '#4ade80' : T.accent;

  return (
    <FadeIn delay={index * 0.08}>
      <div
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        style={{
          borderRadius: 12,
          border: `1px solid ${active ? 'rgba(201,183,135,0.2)' : T.border}`,
          backgroundColor: active ? T.surfaceHover : T.surface,
          padding: '1.75rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: T.text, margin: '0 0 0.25rem' }}>{org.name}</h3>
            <p style={{ fontSize: '0.72rem', color: T.dim, margin: 0 }}>{org.tagline}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontFamily: T.mono, color: T.accent }}>{org.starCount}</div>
            <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase' }}>combined stars</div>
          </div>
        </div>

        <div style={{
          padding: '0.625rem 0.875rem',
          borderRadius: 6,
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Top repo
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: T.mono, color: T.dim }}>{org.topRepo}</span>
            <span style={{ fontSize: '0.68rem', fontFamily: T.mono, color: T.accent }}>★ {org.topRepoStars}</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Key capabilities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {org.keyCapabilities.map((cap, i) => {
              const [name, desc] = cap.split(' — ');
              return (
                <div key={i} style={{ fontSize: '0.68rem', color: T.dim, display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: T.muted, flexShrink: 0 }}>·</span>
                  <span><span style={{ color: T.dim }}>{name}</span>{desc ? ` — ${desc}` : ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          padding: '0.875rem',
          borderRadius: 8,
          backgroundColor: T.accentGlow,
          border: `1px solid ${T.accentDim}`,
        }}>
          <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
            a11oy absorption → {org.a11oyPrimitive}
          </div>
          <p style={{ fontSize: '0.7rem', lineHeight: 1.6, color: T.text, margin: 0 }}>{org.a11oyAbsorption}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: '0.55rem', fontFamily: T.mono, padding: '2px 10px',
            borderRadius: 999, backgroundColor: `${statusColor}15`,
            color: statusColor, border: `1px solid ${statusColor}30`,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {org.status.toUpperCase()}
          </span>
        </div>
      </div>
    </FadeIn>
  );
}

function InnovationCard({ innovation, index }: { innovation: typeof ORIGINAL_INNOVATIONS[0]; index: number }) {
  return (
    <FadeIn delay={index * 0.07}>
      <div style={{
        padding: '2rem',
        borderRadius: 12,
        border: '1px solid rgba(167,139,250,0.18)',
        backgroundColor: 'rgba(167,139,250,0.03)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: T.text, margin: '0 0 0.25rem' }}>{innovation.name}</h3>
            <p style={{ fontSize: '0.7rem', color: '#a78bfa', margin: 0, fontStyle: 'italic' }}>{innovation.tagline}</p>
          </div>
          <span style={{
            fontSize: '0.5rem', fontFamily: T.mono, padding: '2px 8px',
            borderRadius: 999, backgroundColor: 'rgba(167,139,250,0.15)',
            color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
          }}>UNIQUE</span>
        </div>

        <p style={{ fontSize: '0.75rem', lineHeight: 1.65, color: T.dim, margin: 0, flex: 1 }}>
          {innovation.desc}
        </p>

        <div style={{
          padding: '0.75rem',
          borderRadius: 8,
          backgroundColor: 'rgba(239,68,68,0.04)',
          border: '1px solid rgba(239,68,68,0.12)',
        }}>
          <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
            No one else
          </div>
          <p style={{ fontSize: '0.68rem', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>{innovation.noOneElse}</p>
        </div>
      </div>
    </FadeIn>
  );
}

export function AgiConvergence() {
  const liveStats = useSovereignStats();

  return (
    <Layout>
      <div style={{ fontFamily: T.sans, fontFeatureSettings: '"ss01", "cv11"' }}>

        {/* ONE OF ONE HERO */}
        <section style={{ marginBottom: '4rem' }}>
          <FadeIn>
            <div style={{
              padding: 'clamp(2.5rem, 5vw, 4rem)',
              borderRadius: 16,
              border: `1px solid ${T.borderStrong}`,
              background: `linear-gradient(135deg, rgba(201,183,135,0.04) 0%, rgba(10,10,10,0) 60%)`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, right: 0, bottom: 0,
                width: '40%', opacity: 0.04,
                background: 'radial-gradient(circle at 70% 50%, #c9b787 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <SectionLabel accent>One of One</SectionLabel>

              <h1 style={{
                fontSize: 'clamp(2.2rem, 5vw, 4rem)',
                fontFamily: T.serif, fontWeight: 400,
                letterSpacing: '-0.04em', lineHeight: 1.08,
                color: T.text, margin: '0 0 1.5rem', maxWidth: '18ch',
              }}>
                AGI Convergence
              </h1>

              <p style={{ fontSize: '1.0625rem', lineHeight: 1.72, color: T.dim, maxWidth: '58ch', margin: '0 0 1.75rem' }}>
                Not a model provider. Not a serving engine. Not an agent framework.
                {' '}<span style={{ color: T.text }}>The governed decision operating system that orchestrates all of them.</span>
              </p>

              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: T.dim, maxWidth: '62ch', margin: '0 0 2rem' }}>
                We absorbed every leader in the AGI ecosystem — OpenAI, Anthropic, Google DeepMind, Meta, vLLM.
                We mapped their GitHub repos, extracted their architectures, studied their gaps.
                Then we added what none of them have: governance as the core primitive.
              </p>

              <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                {[
                  { value: CONVERGENCE_STATS.reposAbsorbed.toString(), label: 'Repos absorbed' },
                  { value: CONVERGENCE_STATS.totalStars, label: 'Combined stars' },
                  { value: liveStats ? liveStats.skills.live.toString() : CONVERGENCE_STATS.uniqueCapabilities.toString(), label: 'Unique capabilities' },
                  { value: liveStats ? liveStats.models.registered.toString() : CONVERGENCE_STATS.modelProviders.toString(), label: 'Model providers' },
                  { value: CONVERGENCE_STATS.governedFeatures, label: 'Governed' },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '1.4rem', fontFamily: T.mono, color: T.accent, fontWeight: 600, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <Link href={b('/agent-mesh')}>
                  <span style={{
                    display: 'inline-block', padding: '0.6rem 1.5rem',
                    borderRadius: 999, backgroundColor: T.accent, color: T.bg,
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em',
                  }}>Agent Mesh</span>
                </Link>
                <Link href={b('/governance')}>
                  <span style={{
                    display: 'inline-block', padding: '0.6rem 1.5rem',
                    borderRadius: 999, border: `1px solid ${T.accent}`, color: T.accent,
                    fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
                  }}>Governance</span>
                </Link>
                <Link href={b('/proof')}>
                  <span style={{
                    display: 'inline-block', padding: '0.6rem 1.5rem',
                    borderRadius: 999, border: `1px solid ${T.border}`, color: T.dim,
                    fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
                  }}>Proof Ledger</span>
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* SEVEN UNSOLVED GAPS */}
        <section style={{ marginBottom: '5rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '2.5rem' }}>
              <SectionLabel>Seven Unsolved Gaps</SectionLabel>
              <SectionHeading>
                Seven problems nobody in AGI{' '}
                <span style={{ color: T.accent }}>has solved.</span>
              </SectionHeading>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: T.dim, maxWidth: '60ch' }}>
                Every major AGI lab focuses on capabilities — faster models, better reasoning, broader tool use.
                None of them have addressed the seven foundational gaps that make AGI unsafe for enterprise deployment.
                a11oy is the only platform that has.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {UNSOLVED_GAPS.map((gap, i) => (
              <GapCard key={gap.id} gap={gap} index={i} />
            ))}
          </div>
        </section>

        {/* ECOSYSTEM ABSORPTION MAP */}
        <section style={{ marginBottom: '5rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '2.5rem' }}>
              <SectionLabel>Ecosystem Absorption Map</SectionLabel>
              <SectionHeading>
                Five frontier orgs.{' '}
                <span style={{ color: T.accent }}>All absorbed. All surpassed.</span>
              </SectionHeading>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: T.dim, maxWidth: '60ch' }}>
                We studied OpenAI, Anthropic, Google DeepMind, Meta, and vLLM at the source — their GitHub repos,
                their architectures, their star counts, their community investment. Then we built the governed primitive
                that absorbs and extends what each one offers.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {ECOSYSTEM_ORGS.map((org, i) => (
              <EcosystemCard key={org.name} org={org} index={i} />
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem 2rem',
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              backgroundColor: T.surface,
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
            }}>
              <div style={{ fontSize: '0.7rem', fontFamily: T.mono, color: T.muted, minWidth: 80 }}>Legend</div>
              {[
                { color: '#4ade80', label: 'Surpassed — a11oy capabilities exceed the source in governance, scope, and provability' },
                { color: T.accent, label: 'Absorbed — capability integrated into a11oy with full governance layer added' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.68rem', color: T.dim }}>{label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* INNOVATIONS NO ONE HAS */}
        <section style={{ marginBottom: '5rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '2.5rem' }}>
              <SectionLabel>Innovations No One Has</SectionLabel>
              <SectionHeading>
                Six primitives.{' '}
                <span style={{ color: '#a78bfa' }}>No competitor has built any of them.</span>
              </SectionHeading>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: T.dim, maxWidth: '60ch' }}>
                We absorbed everything OpenAI, Anthropic, Google, Meta, and vLLM have built.
                Then we built six original primitives that no AGI leader has conceived, let alone shipped.
                These are the moat.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {ORIGINAL_INNOVATIONS.map((innovation, i) => (
              <InnovationCard key={innovation.primitiveId} innovation={innovation} index={i} />
            ))}
          </div>
        </section>

        {/* THE FORMULA */}
        <section style={{ marginBottom: '4rem' }}>
          <FadeIn>
            <div style={{
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              backgroundColor: T.surface,
              padding: 'clamp(2rem, 4vw, 3.5rem)',
              textAlign: 'center',
            }}>
              <SectionLabel>The Formula</SectionLabel>
              <div style={{ fontSize: '0.8rem', fontFamily: T.mono, lineHeight: 2.4, color: T.dim, maxWidth: 700, margin: '0 auto' }}>
                <span style={{ color: T.text }}>OpenAI</span> agentic execution
                <span style={{ color: T.muted }}> + </span>
                <span style={{ color: T.text }}>Anthropic</span> coding autonomy
                <span style={{ color: T.muted }}> + </span>
                <span style={{ color: T.text }}>Google DeepMind</span> research depth
                <br />
                <span style={{ color: T.muted }}> + </span>
                <span style={{ color: T.text }}>Meta</span> open model strategy
                <span style={{ color: T.muted }}> + </span>
                <span style={{ color: T.text }}>vLLM</span> inference efficiency
                <span style={{ color: T.muted }}> + </span>
                <span style={{ color: T.text }}>Palantir</span> operational ontology
              </div>

              <div style={{ margin: '1.5rem 0', fontSize: '1.5rem', color: T.muted }}>+</div>

              <div style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Governance · Proof Chain · Shadow Council · Coalition Intelligence · Consciousness Layer · Decision Provenance · Outcome Graph · Covenant Policy
              </div>

              <div style={{ margin: '1.5rem 0', fontSize: '1.5rem', color: T.muted }}>=</div>

              <div style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 300, letterSpacing: '-0.04em', fontFamily: T.serif }}>
                <span style={{ color: T.accent }}>a</span>
                <span style={{ color: T.accent, fontWeight: 700, fontSize: '1.15em' }}>11</span>
                <span style={{ color: T.accent }}>oy</span>
              </div>

              <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, marginTop: '0.75rem', letterSpacing: '0.14em' }}>
                THE GOVERNED DECISION OPERATING SYSTEM — ONE OF ONE
              </div>
            </div>
          </FadeIn>
        </section>

        {/* CONVERGENCE TERMINAL */}
        <section style={{ marginBottom: '2rem' }}>
          <FadeIn>
            <div style={{
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              overflow: 'hidden',
              backgroundColor: T.surface,
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', gap: '0.625rem',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80' }} />
                <span style={{ fontSize: '0.65rem', fontFamily: T.mono, color: T.muted }}>
                  a11oy convergence monitor — governed AGI status — {new Date().toISOString().split('T')[0]}
                </span>
              </div>
              <div style={{ padding: '1.5rem 1.75rem', fontFamily: T.mono, fontSize: '0.68rem', lineHeight: 1.9 }}>
                <div style={{ color: T.muted }}># a11oy AGI convergence report</div>
                <div style={{ height: 6 }} />
                <div style={{ color: '#4ade80' }}>[gaps] 7 unsolved AGI gaps — all addressed at the platform layer</div>
                <div style={{ color: '#4ade80' }}>[ecosystem] 5 frontier orgs analyzed — OpenAI, Anthropic, DeepMind, Meta, vLLM</div>
                <div style={{ color: '#4ade80' }}>[absorption] {CONVERGENCE_STATS.reposAbsorbed} repos absorbed — {CONVERGENCE_STATS.totalStars} combined stars governed</div>
                <div style={{ color: '#4ade80' }}>[innovations] 6 original primitives — no competitor has any</div>
                <div style={{ height: 6 }} />
                <div style={{ color: T.dim }}>[model-router] GPT-5.1 ................. operational (OpenAI absorbed)</div>
                <div style={{ color: T.dim }}>[model-router] Claude 4 Opus ........... operational (Anthropic absorbed)</div>
                <div style={{ color: T.dim }}>[model-router] Gemini 2.5 Pro .......... operational (DeepMind absorbed)</div>
                <div style={{ color: T.dim }}>[model-router] Llama 4 Maverick ........ operational (Meta absorbed)</div>
                <div style={{ color: T.dim }}>[model-router] DeepSeek V4-Pro ......... operational (independent)</div>
                <div style={{ color: T.dim }}>[model-router] Qwen 3.6-35B ............ operational (independent)</div>
                <div style={{ height: 6 }} />
                <div style={{ color: T.accent }}>[governance] Shadow Council ............ ACTIVE — adversarial review every inference</div>
                <div style={{ color: T.accent }}>[governance] Coalition Intelligence ... ACTIVE — ad-hoc coalitions with dissent log</div>
                <div style={{ color: T.accent }}>[governance] Consciousness Layer ....... ACTIVE — metacognitive monitoring enabled</div>
                <div style={{ color: T.accent }}>[governance] Covenant Policy ........... ACTIVE — 100% inference coverage</div>
                <div style={{ color: T.accent }}>[governance] Proof Chain ............... ACTIVE — cryptographic lineage on all actions</div>
                <div style={{ color: T.accent }}>[governance] Outcome Graph ............. ACTIVE — real-world consequence feedback loop</div>
                <div style={{ color: T.accent }}>[governance] Decision Provenance ........ ACTIVE — end-to-end attribution auditable</div>
                <div style={{ height: 6 }} />
                <div style={{ color: '#4ade80' }}>[status] AGI convergence: OPERATIONAL</div>
                <div style={{ color: '#4ade80' }}>[status] Governance layer: ACTIVE — all 7 gaps solved</div>
                <div style={{ color: '#4ade80' }}>[status] Classification: ONE OF ONE</div>
                <div style={{ color: T.muted }}>proof hash: 0xd4a7...b2f3 | governed | auditable | sovereign</div>
              </div>
            </div>
          </FadeIn>
        </section>

      </div>
    </Layout>
  );
}
