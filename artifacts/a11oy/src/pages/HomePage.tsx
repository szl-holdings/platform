import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  mono: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (path: string) => (path === '/' ? `${BASE}/` : `${BASE}${path}`);

const FABRIC_API_BASE = (import.meta.env.VITE_FABRIC_API_BASE as string | undefined) ?? '/api/a11oy';

interface NowData {
  signals?: number;
  activeOutcomes?: number;
  pendingActions?: number;
  fabricStatus?: string;
}

function useLiveData() {
  const [data, setData] = useState<NowData | null>(null);
  useEffect(() => {
    fetch(`${FABRIC_API_BASE}/now`)
      .then(r => r.json())
      .then(json => setData(json?.data ?? json))
      .catch(() => setData({ signals: 30, activeOutcomes: 5, pendingActions: 5, fabricStatus: 'demo' }));
  }, []);
  return data;
}

const ALLOY_CHARS = [
  { ch: 'a', word: 'Attribution', desc: 'Every action records who proposed it, who approved it, what evidence supported it, and which model recommended it.' },
  { ch: '1', word: 'One Decision Loop', desc: 'Signal, Context, Recommendation, Simulation, Policy, Execution, Proof, Outcome, Learning — the single canonical path.' },
  { ch: '1', word: 'One Proof Chain', desc: 'Immutable, append-only record of every consequential action across every product. Tamper-resistant. Queryable.' },
  { ch: 'o', word: 'Orchestration', desc: 'Durable multi-step workflow execution with checkpoint recovery, agent coordination, and policy gates at the platform layer.' },
  { ch: 'y', word: 'Yield', desc: 'The Outcome Graph closes the loop — recording the real-world consequence and feeding it back to calibrate future confidence.' },
];

const PRIMITIVES = [
  { name: 'Decision Loop', num: '01', desc: 'Nine canonical stages from signal to outcome. Detection, recommendation, simulation, policy, execution, proof, outcome, learning.' },
  { name: 'Proof Chain', num: '02', desc: 'Immutable append-only ledger of every consequential action. Cryptographically verifiable. Queryable by actor or decision.' },
  { name: 'Covenant Policy', num: '03', desc: 'Policy-as-code engine that gates every action. Who can approve, when, under what conditions — enforced at the platform layer.' },
  { name: 'Outcome Graph', num: '04', desc: 'Closes the loop. Records the real-world consequence of each decision and feeds the result back to calibrate future confidence.' },
];

const VERTICALS = [
  { name: 'Vessels', desc: 'Maritime fleet intelligence — positions, voyage economics, compliance, exceptions.', domain: 'Maritime' },
  { name: 'Counsel', desc: 'Legal matter lifecycle — filings, obligations, risk scoring, document intelligence.', domain: 'Legal' },
  { name: 'Terra', desc: 'Real estate portfolio intelligence — valuations, climate risk, deal pipeline, analytics.', domain: 'Real Estate' },
  { name: 'Aegis', desc: 'Security and defense — threat detection, incident response, compliance posture, resilience.', domain: 'Security' },
];

function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease }}
      style={style}
    >{children}</motion.div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: T.textMuted, margin: '0 0 1.5rem',
    }}>{children}</p>
  );
}

export function HomePage() {
  const data = useLiveData();
  const signals = data?.signals ?? 30;
  const outcomes = data?.activeOutcomes ?? 5;

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text,
      fontFeatureSettings: '"ss01", "cv11"',
    }}>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.5rem, 4vw, 3rem)',
        background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <Link href={b('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, border: `1px solid ${T.borderStrong}`,
            borderRadius: 4, fontSize: 11, fontFamily: T.mono, color: T.text,
          }}>a</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: T.text, letterSpacing: '-0.01em' }}>a11oy</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {[
            { label: 'Platform', href: b('/fabric') },
            { label: 'Proof Chain', href: b('/proof') },
            { label: 'Governance', href: b('/governance') },
          ].map(link => (
            <Link key={link.label} href={link.href} style={{
              fontSize: '0.8125rem', color: T.textDim, textDecoration: 'none',
              letterSpacing: '-0.005em',
            }}>{link.label}</Link>
          ))}
          <Link href={b('/investor-demo')} style={{
            padding: '0.4rem 1rem', fontSize: '0.8125rem', fontWeight: 500,
            color: T.bg, background: T.text, borderRadius: 999,
            textDecoration: 'none', letterSpacing: '-0.005em',
          }}>Investor demo</Link>
        </div>
      </nav>

      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '7rem 2rem 5rem',
      }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
            <defs>
              <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              </pattern>
              <radialGradient id="grid-fade" cx="0.5" cy="0.45" r="0.5">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              <mask id="grid-mask"><rect width="100%" height="100%" fill="url(#grid-fade)" /></mask>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" mask="url(#grid-mask)" />
          </svg>
        </div>

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            style={{
              fontSize: '0.6875rem', fontFamily: T.mono, fontWeight: 500,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: T.textMuted, marginBottom: '3rem',
            }}
          >Governed Decision Operating System</motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 6rem)',
              fontWeight: 500, letterSpacing: '-0.05em',
              lineHeight: 0.95, color: T.text, margin: '0 0 2.5rem',
            }}
          >a<span style={{ color: T.accent }}>11</span>oy</motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease }}
            style={{
              fontSize: 'clamp(1rem, 1.3vw, 1.125rem)',
              lineHeight: 1.7, color: T.textDim,
              maxWidth: '48ch', margin: '0 auto 3rem',
            }}
          >
            The structural layer between signal detection and action execution.
            Governance, attribution, and proof on every decision that matters.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease }}
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}
          >
            <Link href={b('/now')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.75rem', background: T.text, color: T.bg,
              borderRadius: 999, fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none',
            }}>Open Now Board</Link>
            <Link href={b('/investor-demo')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.75rem', background: 'transparent', color: T.text,
              border: `1px solid ${T.borderStrong}`, borderRadius: 999,
              fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none',
            }}>Investor brief →</Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '2.5rem',
              fontFamily: T.mono, fontSize: '0.75rem', color: T.textDim,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.accent }} />
              Operational
            </span>
            <span><span style={{ color: T.text }}>{signals}</span> signals</span>
            <span><span style={{ color: T.text }}>{outcomes}</span> outcomes</span>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: 'clamp(6rem, 12vw, 10rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <FadeIn>
            <Label>Premise</Label>
            <h2 style={{
              fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
              fontWeight: 500, letterSpacing: '-0.035em',
              color: T.text, lineHeight: 1.1, margin: '0 0 1.75rem',
            }}>
              The enterprise does not need another dashboard.
            </h2>
            <p style={{
              fontSize: '1.0625rem', lineHeight: 1.75,
              color: T.textDim, maxWidth: '50ch', margin: '0 auto',
            }}>
              It needs a system that senses signals across every domain,
              understands their cause, recommends governed responses,
              executes them with human approval, and proves it did so correctly.
            </p>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '4rem', maxWidth: 720 }}>
              <Label>Each character carries weight</Label>
              <h2 style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontWeight: 500, letterSpacing: '-0.035em', color: T.text, lineHeight: 1.1, margin: 0 }}>
                What a11oy means.
              </h2>
            </div>
          </FadeIn>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 1, background: T.border,
            border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden',
          }}>
            {ALLOY_CHARS.map((c, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div style={{ background: T.bg, padding: '2.5rem 1.5rem', height: '100%' }}>
                  <div style={{
                    fontSize: '2.5rem', fontWeight: 400, fontFamily: T.mono,
                    color: T.text, lineHeight: 1, marginBottom: '1.5rem',
                  }}>{c.ch}</div>
                  <p style={{
                    fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 500,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: T.accent, marginBottom: '0.75rem',
                  }}>{c.word}</p>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{c.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 720 }}>
              <Label>Platform Primitives</Label>
              <h2 style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontWeight: 500, letterSpacing: '-0.035em', color: T.text, lineHeight: 1.1, margin: '0 0 1rem' }}>
                Four governed objects. One coherent system.
              </h2>
              <p style={{ fontSize: '1rem', lineHeight: 1.65, color: T.textDim, margin: 0, maxWidth: '58ch' }}>
                Every action that matters flows through the same primitives — the building blocks that
                make decisions reproducible, auditable, and improvable.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: T.border, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            {PRIMITIVES.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.07}>
                <div style={{ padding: '2.25rem', background: T.bg, height: '100%' }}>
                  <p style={{
                    fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 500,
                    letterSpacing: '0.16em', color: T.textMuted, marginBottom: '0.75rem',
                  }}>{p.num}</p>
                  <h3 style={{
                    fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.015em',
                    color: T.text, margin: '0 0 0.625rem',
                  }}>{p.name}</h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 720 }}>
              <Label>Domain Packs</Label>
              <h2 style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontWeight: 500, letterSpacing: '-0.035em', color: T.text, lineHeight: 1.1, margin: '0 0 1rem' }}>
                One orchestration layer. Four governed verticals.
              </h2>
              <p style={{ fontSize: '1rem', lineHeight: 1.65, color: T.textDim, margin: 0, maxWidth: '58ch' }}>
                Each vertical runs on the same a11oy decision loop — Signal to Outcome — with
                domain-specific intelligence applied at the context layer.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: T.border, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            {VERTICALS.map((v, i) => (
              <FadeIn key={v.name} delay={i * 0.06}>
                <div style={{ padding: '2.25rem', background: T.bg, height: '100%' }}>
                  <p style={{
                    fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 500,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: T.accent, marginBottom: '0.75rem',
                  }}>{v.domain}</p>
                  <h3 style={{
                    fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.015em',
                    color: T.text, margin: '0 0 0.625rem',
                  }}>{v.name}</h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{v.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem' }}>
              <Label>The Decision Loop</Label>
              <h2 style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontWeight: 500, letterSpacing: '-0.035em', color: T.text, lineHeight: 1.1, margin: '0 0 1rem' }}>
                Nine stages. One canonical path.
              </h2>
              <p style={{ fontSize: '1rem', lineHeight: 1.65, color: T.textDim, margin: 0, maxWidth: '58ch' }}>
                Every consequential action follows the same governed sequence — detection through outcome,
                recorded as one continuous proof chain.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {['Signal', 'Context', 'Recommendation', 'Simulation', 'Policy', 'Execution', 'Proof', 'Outcome', 'Learning'].map((step, i) => (
              <FadeIn key={step} delay={i * 0.04}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1.5rem',
                  padding: '1.25rem 0',
                  borderBottom: i < 8 ? `1px solid ${T.border}` : 'none',
                }}>
                  <span style={{
                    fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500,
                    color: T.textMuted, minWidth: 28, letterSpacing: '0.1em',
                  }}>0{i + 1}</span>
                  <span style={{
                    fontSize: '1rem', fontWeight: 500, color: T.text, letterSpacing: '-0.01em',
                  }}>{step}</span>
                  <span style={{
                    marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%',
                    background: i === 0 ? T.accent : T.textMuted,
                  }} />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(8rem, 16vw, 14rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <FadeIn>
            <Label>See it in motion</Label>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 500,
              letterSpacing: '-0.04em', color: T.text,
              lineHeight: 1.05, margin: '0 0 1.25rem',
            }}>
              Watch the loop close.
            </h2>
            <p style={{
              fontSize: '1.0625rem', lineHeight: 1.7,
              color: T.textDim, maxWidth: '44ch', margin: '0 auto 2.5rem',
            }}>
              A guided walk-through of a single decision — from signal capture to executed outcome,
              with the proof chain visible at every step.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={b('/investor-demo')} style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.75rem 1.75rem', background: T.text, color: T.bg,
                borderRadius: 999, fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none',
              }}>Investor demo</Link>
              <Link href={b('/proof')} style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.75rem 1.75rem', background: 'transparent', color: T.text,
                border: `1px solid ${T.borderStrong}`, borderRadius: 999,
                fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none',
              }}>Browse Proof Ledger →</Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: T.textMuted, fontFamily: T.mono }}>
            a11oy
          </span>
          <span style={{ fontSize: '0.6875rem', color: T.textMuted }}>
            © {new Date().getFullYear()} a11oy
          </span>
        </div>
      </footer>

    </div>
  );
}
