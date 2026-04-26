import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'wouter';
import { m } from 'framer-motion';
import { Layout } from '../components/layout';

// ── Publication Design Tokens (mirrors lib/shared-ui/src/publication.tsx) ──
const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.018)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)',
  borderActive: 'rgba(255,255,255,0.25)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  accentDim: 'rgba(201,183,135,0.55)',
  mono: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
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
  { ch: 'a', word: 'Attribution', desc: 'Every action records who proposed it, who approved it, what evidence supported it, and which model — if any — recommended it.' },
  { ch: '1', word: 'One Decision Loop', desc: 'Signal, Context, Recommendation, Simulation, Policy, Execution, Proof, Outcome, Learning. The single canonical path every governed action follows.' },
  { ch: '1', word: 'One Proof Chain', desc: 'An immutable, append-only record of every consequential action across every product. Tamper-resistant. Queryable by actor, decision, or outcome.' },
  { ch: 'o', word: 'Orchestration', desc: 'Durable, multi-step workflow execution with checkpoint recovery, agent coordination, and policy gates enforced at the platform layer.' },
  { ch: 'y', word: 'Yield', desc: 'The Outcome Graph closes the loop — recording the real-world consequence of every decision and feeding it back to calibrate future confidence.' },
];

const PRIMITIVES = [
  { name: 'Decision Loop', desc: 'Nine canonical stages from signal to outcome. Detection, recommendation, simulation, policy, execution, proof, outcome, learning.' },
  { name: 'Proof Chain', desc: 'Immutable append-only ledger of every consequential action. Cryptographically verifiable. Queryable by actor or decision.' },
  { name: 'Covenant Policy', desc: 'Policy-as-code engine that gates every action. Who can approve, when, under what conditions — enforced at the platform layer.' },
  { name: 'Outcome Graph', desc: 'Closes the loop. Records the real-world consequence of each decision and feeds the result back to calibrate future confidence.' },
];

const SURFACES = [
  { name: 'Lyte', desc: 'Web command for analysts and operators.', href: '/' },
  { name: 'APEX Mobile', desc: 'iOS and Android command on the move.', href: '/' },
  { name: 'Boardroom', desc: 'Executive briefing and outcome ledger.', href: '/boardroom' },
  { name: 'Verticals', desc: 'Aegis, Vessels, Terra, Counsel, IMPERIUM.', href: '/verticals' },
];

// ── Helpers ──────────────────────────────────────────
function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease }}
      style={style}
    >
      {children}
    </m.div>
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

function Primary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        background: '#f5f5f5', color: '#0a0a0a',
        borderRadius: 999,
        fontSize: '0.8125rem', fontWeight: 500,
        textDecoration: 'none',
      }}
    >{children}</Link>
  );
}

function Secondary({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        background: 'transparent', color: T.text,
        border: `1px solid ${T.borderStrong}`,
        borderRadius: 999,
        fontSize: '0.8125rem', fontWeight: 500,
        textDecoration: 'none',
      }}
    >{children}</Link>
  );
}

export function HomePage() {
  const data = useLiveData();
  const signals = data?.signals ?? 30;
  const outcomes = data?.activeOutcomes ?? 5;

  return (
    <Layout>
      <div style={{
        background: T.bg,
        color: T.text,
        marginInline: '-1.5rem',
        marginBlock: '-1.5rem',
        minHeight: 'calc(100vh - 52px)',
        fontFeatureSettings: '"ss01", "cv11"',
      }}>

        {/* ── Hero ─────────────────────────────────────────── */}
        <section style={{
          minHeight: '85vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          padding: '6rem 2rem 4rem',
        }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                position: 'absolute', top: '30%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 1200, height: 800,
                background: 'radial-gradient(ellipse at center, rgba(201,183,135,0.045) 0%, transparent 55%)',
                filter: 'blur(20px)',
              }}
            />
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
              <defs>
                <pattern id="a11oy-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                </pattern>
                <radialGradient id="a11oy-gridfade" cx="0.5" cy="0.45" r="0.6">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </radialGradient>
                <mask id="a11oy-gridmask"><rect width="100%" height="100%" fill="url(#a11oy-gridfade)" /></mask>
              </defs>
              <rect width="100%" height="100%" fill="url(#a11oy-grid)" mask="url(#a11oy-gridmask)" />
            </svg>
          </div>

          <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              style={{
                fontSize: '0.6875rem', fontFamily: T.mono, fontWeight: 500,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: T.textMuted, marginBottom: '2.5rem',
              }}
            >
              The Execution Fabric · v2.0
            </m.p>
            <m.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.08, ease }}
              style={{
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                fontWeight: 500, letterSpacing: '-0.045em',
                lineHeight: 0.98, color: T.text,
                margin: '0 0 2rem',
              }}
            >
              a<span style={{ fontStyle: 'italic', fontWeight: 400, color: T.accent }}>11</span>oy
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.18, ease }}
              style={{
                fontSize: 'clamp(1rem, 1.4vw, 1.125rem)',
                lineHeight: 1.65, color: T.textDim,
                maxWidth: '52ch', margin: '0 auto 3rem',
                letterSpacing: '-0.005em',
              }}
            >
              The structural layer beneath every SZL product. Senses, recommends, executes, and proves —
              with attribution and policy enforced at the platform layer.
            </m.p>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease }}
              style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}
            >
              <Primary href={b('/now')}>Open Now Board</Primary>
              <Secondary href={b('/investor-demo')}>Investor brief</Secondary>
            </m.div>

            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '2.5rem',
                padding: '1rem 1.75rem',
                border: `1px solid ${T.border}`,
                borderRadius: 999,
                background: T.surface,
                fontFamily: T.mono, fontSize: '0.75rem', color: T.textDim,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, boxShadow: `0 0 8px ${T.accent}` }} />
                Fabric operational
              </span>
              <span><span style={{ color: T.text }}>{signals}</span> signals</span>
              <span><span style={{ color: T.text }}>{outcomes}</span> outcomes</span>
            </m.div>
          </div>
        </section>

        {/* ── Premise ─────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
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
                fontSize: '1.0625rem', lineHeight: 1.7,
                color: T.textDim, maxWidth: '54ch', margin: '0 auto',
              }}>
                It needs a fabric that{' '}
                <span style={{ fontStyle: 'italic', color: T.accent }}>acts</span> —
                that senses signals across every domain, understands their cause,
                recommends governed responses, executes them with human approval,
                and proves it did so correctly.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ── a11oy character breakdown ───────────────────── */}
        <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 2rem' }}>
            <FadeIn>
              <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
                <Label>Each character carries weight</Label>
                <h2 style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontWeight: 500, letterSpacing: '-0.035em', color: T.text, lineHeight: 1.1, margin: '0 0 1rem' }}>
                  What a11oy means.
                </h2>
                <p style={{ fontSize: '1rem', lineHeight: 1.65, color: T.textDim, margin: 0, maxWidth: '58ch' }}>
                  Five primitives that together form the structural layer of governed enterprise decisions.
                </p>
              </div>
            </FadeIn>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 1, background: T.border,
              border: `1px solid ${T.border}`, borderRadius: 12,
              overflow: 'hidden',
            }}>
              {ALLOY_CHARS.map((c, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div style={{ background: T.bg, padding: '2.5rem 1.75rem', height: '100%' }}>
                    <div style={{
                      fontSize: '3.5rem', fontWeight: 400, fontFamily: T.mono,
                      color: T.accent, lineHeight: 1, marginBottom: '1.75rem',
                      letterSpacing: '-0.02em',
                    }}>{c.ch}</div>
                    <p style={{
                      fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500,
                      letterSpacing: '0.16em', textTransform: 'uppercase',
                      color: T.textMuted, marginBottom: '0.625rem',
                    }}>{c.word}</p>
                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.textDim, margin: 0 }}>{c.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Primitives ─────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 2rem' }}>
            <FadeIn>
              <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              {PRIMITIVES.map((p, i) => (
                <FadeIn key={p.name} delay={i * 0.07}>
                  <div style={{
                    padding: '2rem', borderRadius: 10,
                    border: `1px solid ${T.border}`, background: T.surface,
                    height: '100%',
                  }}>
                    <p style={{
                      fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500,
                      letterSpacing: '0.16em', color: T.textMuted, marginBottom: '0.625rem',
                    }}>0{i + 1}</p>
                    <h3 style={{
                      fontSize: '1.125rem', fontWeight: 500,
                      letterSpacing: '-0.015em', color: T.text,
                      marginBottom: '0.625rem', margin: '0 0 0.625rem',
                    }}>{p.name}</h3>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{p.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Surfaces ───────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 2rem' }}>
            <FadeIn>
              <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
                <Label>Surfaces</Label>
                <h2 style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontWeight: 500, letterSpacing: '-0.035em', color: T.text, lineHeight: 1.1, margin: '0 0 1rem' }}>
                  Where operators meet the fabric.
                </h2>
                <p style={{ fontSize: '1rem', lineHeight: 1.65, color: T.textDim, margin: 0, maxWidth: '58ch' }}>
                  Four entry points speak the same governance vocabulary. Different surfaces. Same proof chain.
                </p>
              </div>
            </FadeIn>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1, background: T.border,
              border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden',
            }}>
              {SURFACES.map((s, i) => (
                <FadeIn key={s.name} delay={i * 0.05}>
                  <Link href={b(s.href)} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                    <m.div
                      whileHover={{ background: 'rgba(255,255,255,0.025)' }}
                      transition={{ duration: 0.2 }}
                      style={{
                        background: T.bg, padding: '2rem',
                        cursor: 'pointer', height: '100%', minHeight: 120,
                      }}
                    >
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.015em', color: T.text, margin: '0 0 0.5rem' }}>{s.name}</h3>
                      <p style={{ fontSize: '0.875rem', color: T.textDim, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                    </m.div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────── */}
        <section style={{ padding: 'clamp(7rem, 14vw, 12rem) 0', borderTop: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
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
                fontSize: '1.0625rem', lineHeight: 1.65,
                color: T.textDim, maxWidth: '48ch', margin: '0 auto 2.5rem',
              }}>
                A guided walk-through of a single decision — from signal capture to executed outcome,
                with the proof chain visible at every step.
              </p>
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Primary href={b('/investor-demo')}>Investor demo</Primary>
                <Secondary href={b('/proof')}>Browse Proof Ledger</Secondary>
              </div>
            </FadeIn>
          </div>
        </section>

      </div>
    </Layout>
  );
}
