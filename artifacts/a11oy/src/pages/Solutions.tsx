import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateVerticalPDF, generatePlatformBriefPDF, VERTICAL_SPECS } from '../lib/vertical-marketing-pdf';
import type { VerticalSpec } from '../lib/vertical-marketing-pdf';

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  accentDim: 'rgba(201,183,135,0.12)',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

function toHex(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
function toAlpha(rgb: [number, number, number], a: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, delay, ease }}
      style={style}
    >{children}</motion.div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontSize: '0.6rem', fontFamily: T.mono, fontWeight: 500,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: T.textMuted, margin: '0 0 1.5rem',
    }}>{children}</p>
  );
}

function DownloadButton({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  const [downloading, setDownloading] = useState(false);
  const handleClick = () => {
    setDownloading(true);
    setTimeout(() => {
      onClick();
      setTimeout(() => setDownloading(false), 1200);
    }, 100);
  };
  return (
    <button
      onClick={handleClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.6rem 1.25rem',
        background: toAlpha([201, 183, 135], 0.1),
        border: `1px solid ${color}`,
        borderRadius: 8,
        color: color,
        fontSize: '0.8125rem', fontWeight: 600, fontFamily: T.mono,
        cursor: 'pointer', letterSpacing: '0.02em',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = toAlpha([201, 183, 135], 0.18); }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = toAlpha([201, 183, 135], 0.1); }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6 1v7M3 6l3 3 3-3M1 11h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {downloading ? 'Generating…' : label}
    </button>
  );
}

function VerticalChip({ spec, isActive, onClick }: { spec: VerticalSpec; isActive: boolean; onClick: () => void }) {
  const color = toHex(spec.color);
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        padding: '1.25rem 1.5rem',
        background: isActive ? toAlpha(spec.color, 0.1) : T.surface,
        border: `1px solid ${isActive ? color : T.border}`,
        borderBottom: isActive ? `3px solid ${color}` : `1px solid ${T.border}`,
        borderRadius: 12,
        cursor: 'pointer', transition: 'all 0.25s ease',
        minWidth: 100, flex: '1 1 auto',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = toAlpha(spec.color, 0.06);
          el.style.borderColor = toAlpha(spec.color, 0.4);
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = T.surface;
          el.style.borderColor = T.border;
        }
      }}
    >
      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{spec.emoji}</span>
      <span style={{
        fontSize: '0.75rem', fontWeight: 600, fontFamily: T.mono,
        color: isActive ? color : T.textDim, letterSpacing: '0.04em',
        transition: 'color 0.2s',
      }}>{spec.name}</span>
      <span style={{
        fontSize: '0.625rem', fontFamily: T.mono,
        color: isActive ? toAlpha(spec.color, 0.8) : T.textMuted,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        transition: 'color 0.2s',
      }}>{spec.domain}</span>
    </button>
  );
}

function ArchitectureRow({ layer, desc, index, color }: { layer: string; desc: string; index: number; color: string }) {
  return (
    <div style={{
      display: 'flex', gap: '1rem', alignItems: 'flex-start',
      padding: '0.875rem 1rem',
      background: T.surface, borderRadius: 8,
      border: `1px solid ${T.border}`,
    }}>
      <div style={{
        flexShrink: 0, width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, background: toAlpha([201, 183, 135], 0.06),
        border: `1px solid ${T.border}`,
        fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 700, color,
      }}>L{index + 1}</div>
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color, marginBottom: '0.25rem', fontFamily: T.mono }}>{layer}</div>
        <div style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.textDim }}>{desc}</div>
      </div>
    </div>
  );
}

function CapabilityRow({ title, proof, index, color }: { title: string; proof: string; index: number; color: string }) {
  return (
    <div style={{
      padding: '0.875rem 1rem',
      background: T.surface, borderRadius: 8,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 700, color, letterSpacing: '0.1em' }}>0{index + 1}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>{title}</span>
      </div>
      <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{proof}</p>
    </div>
  );
}

function VerticalDetail({ spec }: { spec: VerticalSpec }) {
  const color = toHex(spec.color);
  const [tab, setTab] = useState<'philosophy' | 'architecture' | 'capabilities'>('philosophy');

  const tabs = [
    { id: 'philosophy' as const, label: 'Philosophy' },
    { id: 'architecture' as const, label: 'Architecture' },
    { id: 'capabilities' as const, label: 'Capabilities' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease }}
      style={{
        borderRadius: 16,
        border: `1px solid ${toAlpha(spec.color, 0.25)}`,
        background: `linear-gradient(135deg, ${toAlpha(spec.color, 0.04)} 0%, transparent 60%)`,
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '2rem 2rem 1.5rem',
        borderBottom: `1px solid ${T.border}`,
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 52, height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 14,
            background: toAlpha(spec.color, 0.1),
            border: `1px solid ${toAlpha(spec.color, 0.25)}`,
            fontSize: '1.75rem', lineHeight: 1,
          }}>{spec.emoji}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: T.text, margin: 0, fontFamily: T.serif, letterSpacing: '-0.02em' }}>
                {spec.name}
              </h3>
              <span style={{
                fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
                color, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '0.2rem 0.5rem', borderRadius: 4,
                background: toAlpha(spec.color, 0.1),
              }}>{spec.domain}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: T.textDim, margin: 0, lineHeight: 1.5 }}>{spec.tagline}</p>
          </div>
        </div>
        <DownloadButton
          label={`Download ${spec.name} Brief`}
          onClick={() => generateVerticalPDF(spec.id)}
          color={color}
        />
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, padding: '0 2rem' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '0.8rem', fontFamily: T.mono, fontWeight: 500,
              color: tab === t.id ? color : T.textMuted,
              background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? color : 'transparent'}`,
              cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em',
              marginBottom: '-1px',
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '1.75rem 2rem 2rem' }}>
        <AnimatePresence mode="wait">
          {tab === 'philosophy' && (
            <motion.div key="philosophy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <SectionLabel>Business Observability Philosophy</SectionLabel>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: T.textDim, margin: '0 0 1.5rem', maxWidth: '68ch' }}>
                {spec.philosophy}
              </p>
              <div style={{
                padding: '1.25rem 1.5rem',
                background: T.surface2, borderRadius: 10,
                border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ fontSize: '0.6875rem', fontFamily: T.mono, fontWeight: 600, color, letterSpacing: '0.1em', marginBottom: '0.625rem' }}>
                  HOW A11OY POWERS {spec.name.toUpperCase()}
                </div>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                  {spec.howA11oyPowers}
                </p>
              </div>
            </motion.div>
          )}
          {tab === 'architecture' && (
            <motion.div key="architecture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <SectionLabel>A11oy Seven-Layer Fabric — {spec.name} Configuration</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {spec.architectureLayers.map((layer, i) => (
                  <ArchitectureRow key={layer.layer} layer={layer.layer} desc={layer.desc} index={i} color={color} />
                ))}
              </div>
              <div style={{
                marginTop: '1.5rem', padding: '1rem 1.25rem',
                background: T.surface2, borderRadius: 8, border: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, color: T.textMuted, letterSpacing: '0.14em', marginBottom: '0.5rem' }}>
                  SIGNAL FLOW
                </div>
                <div style={{ fontSize: '0.8125rem', fontFamily: T.mono, color: T.textDim, letterSpacing: '0.01em' }}>
                  Signal Mesh → Causal Core → Action Rail → Covenant Layer → Workcell → Proof Ledger → Outcome Graph
                </div>
              </div>
            </motion.div>
          )}
          {tab === 'capabilities' && (
            <motion.div key="capabilities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <SectionLabel>Key Capabilities with Proof Points</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {spec.capabilities.map((cap, i) => (
                  <CapabilityRow key={cap.title} title={cap.title} proof={cap.proof} index={i} color={color} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function Solutions() {
  const [activeVertical, setActiveVertical] = useState<string | null>(null);
  const activeSpec = VERTICAL_SPECS.find(v => v.id === activeVertical) ?? null;

  const handleChipClick = (id: string) => {
    setActiveVertical(prev => prev === id ? null : id);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.sans }}>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.5rem, 5vw, 4rem)',
        background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <a href={`${BASE}/`} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, border: `1.5px solid ${T.accent}`,
            borderRadius: 6, fontSize: 12, fontFamily: T.mono, color: T.accent, fontWeight: 600,
          }}>a</span>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>a11oy</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {[
            { label: 'Platform', href: `${BASE}/fabric` },
            { label: 'Proof Chain', href: `${BASE}/proof` },
            { label: 'Governance', href: `${BASE}/governance` },
            { label: 'Solutions', href: `${BASE}/solutions` },
          ].map(link => (
            <a key={link.label} href={link.href} style={{
              fontSize: '0.8125rem', color: link.label === 'Solutions' ? T.accent : T.textDim,
              textDecoration: 'none', letterSpacing: '-0.005em', transition: 'color 0.2s',
            }}>{link.label}</a>
          ))}
          <a href={`${BASE}/investor-demo`} style={{
            padding: '0.45rem 1.125rem', fontSize: '0.8125rem', fontWeight: 600,
            color: T.bg, background: T.text, borderRadius: 8,
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}>Request access</a>
        </div>
      </nav>

      <div style={{ paddingTop: 60 }}>

        <section style={{
          padding: 'clamp(6rem, 12vw, 9rem) clamp(2rem, 6vw, 5rem) clamp(5rem, 8vw, 7rem)',
          position: 'relative', overflow: 'hidden',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
              <defs>
                <pattern id="sol-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" />
                </pattern>
                <radialGradient id="sol-fade" cx="0.5" cy="0" r="0.8">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </radialGradient>
                <mask id="sol-mask"><rect width="100%" height="100%" fill="url(#sol-fade)" /></mask>
              </defs>
              <rect width="100%" height="100%" fill="url(#sol-grid)" mask="url(#sol-mask)" />
            </svg>
          </div>

          <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              style={{ marginBottom: '1rem' }}
            >
              <span style={{
                fontSize: '0.6rem', fontFamily: T.mono, fontWeight: 600,
                letterSpacing: '0.22em', textTransform: 'uppercase', color: T.textMuted,
              }}>SZL Holdings · Platform Solutions</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease }}
              style={{
                fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
                fontFamily: T.serif, fontWeight: 400,
                letterSpacing: '-0.03em', lineHeight: 1.08,
                color: T.text, margin: '0 0 1.5rem',
                maxWidth: '20ch',
              }}
            >
              Seven verticals.{' '}
              <span style={{ color: T.accent }}>One governed</span>{' '}
              execution fabric.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              style={{
                fontSize: 'clamp(1rem, 1.4vw, 1.125rem)', lineHeight: 1.75,
                color: T.textDim, maxWidth: '56ch', margin: '0 0 2.5rem',
              }}
            >
              SZL Holdings builds a governed portfolio of enterprise intelligence platforms.
              Each vertical commands its domain. All seven share the A11oy execution fabric —
              compounding intelligence, proof, and governance across the entire ecosystem.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
            >
              <DownloadButton
                label="Download Platform Brief"
                onClick={generatePlatformBriefPDF}
                color={T.accent}
              />
              <span style={{ fontSize: '0.8125rem', color: T.textMuted, fontFamily: T.mono }}>
                or select a vertical below to download its brief
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{
                display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
                marginTop: '3rem',
              }}
            >
              {[
                ['Signal Intelligence', T.textMuted],
                ['Governed Execution', T.textMuted],
                ['Proof Chain', T.accent],
                ['Covenant Policy', T.textMuted],
                ['Outcome Graph', T.textMuted],
                ['Cross-Vertical Correlation', T.textMuted],
              ].map(([label, color]) => (
                <span key={label} style={{
                  padding: '0.35rem 0.75rem', borderRadius: 6,
                  fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
                  background: T.surface, border: `1px solid ${T.border}`,
                  color: color, cursor: 'default',
                }}>{label}</span>
              ))}
            </motion.div>
          </div>
        </section>

        <section style={{ padding: 'clamp(4rem, 8vw, 6rem) clamp(2rem, 6vw, 5rem)' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <FadeIn style={{ marginBottom: '2.5rem' }}>
              <SectionLabel>The SZL Holdings Portfolio</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontFamily: T.serif,
                fontWeight: 400, letterSpacing: '-0.025em', color: T.text,
                lineHeight: 1.15, margin: '0 0 0.75rem',
              }}>Select a vertical</h2>
              <p style={{ fontSize: '0.875rem', color: T.textDim, margin: 0 }}>
                Click any vertical to expand its philosophy, architecture, and capabilities — with a downloadable marketing brief.
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{
                display: 'flex', gap: '0.625rem', flexWrap: 'wrap',
                marginBottom: '2.5rem',
              }}>
                {VERTICAL_SPECS.map(spec => (
                  <VerticalChip
                    key={spec.id}
                    spec={spec}
                    isActive={activeVertical === spec.id}
                    onClick={() => handleChipClick(spec.id)}
                  />
                ))}
              </div>
            </FadeIn>

            <AnimatePresence mode="wait">
              {activeSpec && (
                <motion.div
                  key={activeSpec.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease }}
                  style={{ overflow: 'hidden' }}
                >
                  <VerticalDetail spec={activeSpec} />
                </motion.div>
              )}
            </AnimatePresence>

            {!activeSpec && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: '3rem', textAlign: 'center',
                  border: `1px dashed ${T.border}`, borderRadius: 16,
                  color: T.textMuted, fontSize: '0.875rem', fontFamily: T.mono,
                }}
              >
                ↑ Select a vertical above to explore its philosophy, architecture, and capabilities
              </motion.div>
            )}
          </div>
        </section>

        <section style={{
          padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 6vw, 5rem)',
          borderTop: `1px solid ${T.border}`,
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <FadeIn style={{ marginBottom: '3rem' }}>
              <SectionLabel>Why A11oy Goes Further</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontFamily: T.serif,
                fontWeight: 400, letterSpacing: '-0.025em', color: T.text,
                lineHeight: 1.15, margin: '0 0 0.75rem',
              }}>Beyond aggregation. Into governance.</h2>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: T.textDim, maxWidth: '56ch', margin: 0 }}>
                Competitors aggregate tools and call it a platform. A11oy builds a governed execution fabric
                with structural proof at every layer — the difference is architectural integrity, not feature count.
              </p>
            </FadeIn>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: T.border, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              {[
                {
                  num: '01',
                  title: 'Not tool aggregation — governed intelligence',
                  desc: 'A11oy builds a unified execution loop: Signal, Structure, Recommend, Gate, Decide, Prove. Six stages, no shortcuts — across all seven verticals.',
                },
                {
                  num: '02',
                  title: 'Not dashboards — proof',
                  desc: 'Dashboards show what happened. A11oy proves why — who decided, on what basis, with what model, with what outcome. SHA-256 hashed, tamper-evident.',
                },
                {
                  num: '03',
                  title: 'Not single-domain — compounding intelligence',
                  desc: 'A sanctions match in Vessels surfaces a legal risk in Counsel. No single-domain tool can produce this. The more verticals share the Signal Mesh, the more intelligence compounds.',
                },
                {
                  num: '04',
                  title: 'Not configuration — architecture',
                  desc: 'Every new domain inherits Proof Chain, Covenant Policy, and human-in-the-loop gates from day one — at zero marginal governance cost.',
                },
              ].map((item, i) => (
                <FadeIn key={item.num} delay={i * 0.07}>
                  <div style={{
                    padding: 'clamp(1.75rem, 2.5vw, 2.5rem)', background: T.bg, height: '100%',
                  }}>
                    <div style={{
                      fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 700,
                      color: T.accent, letterSpacing: '0.1em', marginBottom: '0.75rem',
                    }}>{item.num}</div>
                    <h3 style={{
                      fontSize: '1rem', fontWeight: 600, color: T.text,
                      margin: '0 0 0.75rem', lineHeight: 1.35, letterSpacing: '-0.01em',
                    }}>{item.title}</h3>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section style={{
          padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 6vw, 5rem)',
          borderTop: `1px solid ${T.border}`,
        }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <FadeIn>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '2rem',
              }}>
                <div>
                  <SectionLabel>Download All Briefs</SectionLabel>
                  <h2 style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontFamily: T.serif,
                    fontWeight: 400, letterSpacing: '-0.025em', color: T.text,
                    lineHeight: 1.15, margin: '0 0 0.75rem',
                  }}>All seven verticals. One ecosystem brief.</h2>
                  <p style={{ fontSize: '0.9rem', color: T.textDim, margin: 0 }}>
                    Download any vertical-specific brief or the full SZL Holdings platform document.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15} style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {VERTICAL_SPECS.map(spec => {
                  const color = toHex(spec.color);
                  return (
                    <div
                      key={spec.id}
                      style={{
                        padding: '1.25rem',
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{spec.emoji}</span>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>{spec.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{spec.domain}</div>
                        </div>
                      </div>
                      <DownloadButton
                        label="Download PDF"
                        onClick={() => generateVerticalPDF(spec.id)}
                        color={color}
                      />
                    </div>
                  );
                })}
                <div style={{
                  padding: '1.25rem',
                  background: `rgba(201,183,135,0.04)`,
                  border: `1px solid rgba(201,183,135,0.25)`,
                  borderRadius: 12,
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>◈</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>Platform Brief</div>
                      <div style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>All Verticals</div>
                    </div>
                  </div>
                  <DownloadButton
                    label="Download Full Brief"
                    onClick={generatePlatformBriefPDF}
                    color={T.accent}
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <footer style={{
          padding: '2.5rem clamp(2rem, 6vw, 5rem)',
          borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, border: `1.5px solid ${T.accent}`,
              borderRadius: 5, fontSize: 10, fontFamily: T.mono, color: T.accent, fontWeight: 600,
            }}>a</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: T.textDim }}>a11oy · SZL Holdings</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: T.textMuted, fontFamily: T.mono }}>
            Governed Autonomy · 2026
          </div>
        </footer>
      </div>
    </div>
  );
}
