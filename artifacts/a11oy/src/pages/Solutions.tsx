import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateVerticalPDF, generatePlatformBriefPDF, VERTICAL_SPECS } from '../lib/vertical-marketing-pdf';
import { COMPETITIVE_VERTICALS } from '../data/solutionsData';
import type { CompetitiveVertical } from '../data/solutionsData';

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
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

function toAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
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
      color: T.textMuted, margin: '0 0 1.25rem',
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
        padding: '0.55rem 1.125rem',
        background: toAlpha(color, 0.08),
        border: `1px solid ${toAlpha(color, 0.4)}`,
        borderRadius: 8,
        color: color,
        fontSize: '0.75rem', fontWeight: 600, fontFamily: T.mono,
        cursor: 'pointer', letterSpacing: '0.02em',
        transition: 'all 0.2s ease', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = toAlpha(color, 0.16); }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = toAlpha(color, 0.08); }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6 1v7M3 6l3 3 3-3M1 11h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {downloading ? 'Generating…' : label}
    </button>
  );
}

function PlatformAdvantageCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{
      padding: 'clamp(1.5rem, 2.5vw, 2.25rem)',
      background: T.bg,
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{
        fontSize: '0.6rem', fontFamily: T.mono, fontWeight: 700,
        color: T.accent, letterSpacing: '0.14em',
      }}>{num}</div>
      <h3 style={{
        fontSize: '0.9375rem', fontWeight: 600, color: T.text,
        margin: 0, lineHeight: 1.4, letterSpacing: '-0.01em',
      }}>{title}</h3>
      <p style={{ fontSize: '0.8375rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>{desc}</p>
    </div>
  );
}

const PANEL_IDS = ['strength', 'gap', 'advantage'] as const;
type PanelId = typeof PANEL_IDS[number];

const PANEL_LABELS: Record<PanelId, string> = {
  strength: 'What the incumbent does well',
  gap: 'What it structurally cannot do',
  advantage: 'How A11oy fills the gap',
};

function VerticalShowcase({ cv, specId }: { cv: CompetitiveVertical; specId: string | undefined }) {
  const [panel, setPanel] = useState<PanelId>('strength');

  const panelContent: Record<PanelId, string> = {
    strength: cv.incumbentStrength,
    gap: cv.incumbentGap,
    advantage: cv.alloyAdvantage,
  };

  const panelColors: Record<PanelId, string> = {
    strength: T.textMuted,
    gap: '#d4765a',
    advantage: cv.color,
  };

  const spec = VERTICAL_SPECS.find(s => s.id === specId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.06 }}
      transition={{ duration: 0.65, ease }}
      style={{
        borderRadius: 16,
        border: `1px solid ${toAlpha(cv.color, 0.22)}`,
        background: `linear-gradient(140deg, ${toAlpha(cv.color, 0.04)} 0%, transparent 55%)`,
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '1.75rem 2rem 1.25rem',
        borderBottom: `1px solid ${T.border}`,
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48, height: 48, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 12, fontSize: '1.5rem', lineHeight: 1,
            background: toAlpha(cv.color, 0.1),
            border: `1px solid ${toAlpha(cv.color, 0.25)}`,
          }}>{cv.emoji}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <span style={{
                fontSize: '1.125rem', fontWeight: 700, color: T.text,
                fontFamily: T.serif, letterSpacing: '-0.02em',
              }}>{cv.name}</span>
              <span style={{
                fontSize: '0.6rem', fontFamily: T.mono, fontWeight: 600,
                color: cv.color, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '0.2rem 0.5rem', borderRadius: 4,
                background: toAlpha(cv.color, 0.1),
              }}>{cv.domain}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: T.textMuted, fontFamily: T.mono }}>
              vs{' '}
              <span style={{ color: T.textDim, fontWeight: 600 }}>{cv.incumbent}</span>
              <span style={{ color: T.textMuted }}> · {cv.incumbentCategory}</span>
            </div>
          </div>
        </div>
        {spec && (
          <DownloadButton
            label={`${cv.name} Brief`}
            onClick={() => generateVerticalPDF(spec.id)}
            color={cv.color}
          />
        )}
      </div>

      <div style={{
        display: 'flex', gap: 0, padding: '0 2rem',
        borderBottom: `1px solid ${T.border}`,
      }}>
        {PANEL_IDS.map(id => (
          <button
            key={id}
            onClick={() => setPanel(id)}
            style={{
              padding: '0.7rem 1.125rem 0.7rem 0',
              fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
              color: panel === id ? panelColors[id] : T.textMuted,
              background: 'none', border: 'none',
              borderBottom: `2px solid ${panel === id ? panelColors[id] : 'transparent'}`,
              cursor: 'pointer', transition: 'all 0.2s',
              marginBottom: '-1px', letterSpacing: '0.02em',
              marginRight: '1.25rem',
            }}
          >{PANEL_LABELS[id]}</button>
        ))}
      </div>

      <div style={{ padding: '1.5rem 2rem 1.75rem' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={panel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <p style={{
              fontSize: '0.875rem', lineHeight: 1.78, color: T.textDim,
              margin: '0 0 1.25rem', maxWidth: '72ch',
            }}>{panelContent[panel]}</p>
            {panel === 'advantage' && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                background: toAlpha(cv.color, 0.07),
                border: `1px solid ${toAlpha(cv.color, 0.25)}`,
                borderRadius: 8,
              }}>
                <span style={{
                  fontSize: '0.6rem', fontFamily: T.mono, fontWeight: 700,
                  color: cv.color, letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>Proof Point</span>
                <span style={{ fontSize: '0.8125rem', color: T.textDim }}>{cv.proofPoint}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const VERTICAL_SPEC_MAP: Record<string, string> = {
  paragon: 'aegis',
  sextant: 'vessels',
  domaine: 'terra',
  counsel: 'counsel',
  kora: 'lyte',
  pulse: 'pulse',
  'carlota-jo': 'carlota-jo',
};

export function Solutions() {
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
            color: T.textDim, background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 8, textDecoration: 'none', letterSpacing: '-0.01em',
            fontFamily: T.mono,
          }}>Investor Overview</a>
        </div>
      </nav>

      <div style={{ paddingTop: 60 }}>

        {/* ── Hero ── */}
        <section style={{
          padding: 'clamp(6rem, 12vw, 9rem) clamp(2rem, 6vw, 5rem) clamp(5rem, 8vw, 7rem)',
          position: 'relative', overflow: 'hidden',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
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
            <div style={{
              position: 'absolute', top: '30%', right: '-10%',
              width: 600, height: 600,
              background: 'radial-gradient(circle, rgba(201,183,135,0.04) 0%, transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
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
              }}>SZL Holdings · Product Showcase</span>
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
                maxWidth: '22ch',
              }}
            >
              The governed AI execution fabric{' '}
              <span style={{ color: T.accent }}>incumbents cannot build.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              style={{
                fontSize: 'clamp(1rem, 1.4vw, 1.125rem)', lineHeight: 1.75,
                color: T.textDim, maxWidth: '58ch', margin: '0 0 0.875rem',
              }}
            >
              Seven enterprise verticals. One governed execution fabric. Palantir, Bloomberg, CoStar,
              Relativity, Windward, and CRM intelligence tools all do one thing well. A11oy does
              what none of them can: govern the decision, prove the outcome, and compound intelligence
              across every domain simultaneously.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              style={{
                fontSize: '0.875rem', lineHeight: 1.7,
                color: T.textMuted, maxWidth: '52ch', margin: '0 0 2.5rem',
                fontStyle: 'italic',
              }}
            >
              Observability shows what happened. Governance proves who decided, on what basis,
              with what authorization — and what the outcome was.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38, ease }}
              style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
            >
              <DownloadButton
                label="Download Platform Brief"
                onClick={generatePlatformBriefPDF}
                color={T.accent}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.52 }}
              style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '3rem' }}
            >
              {[
                ['Proof Chain', T.accent],
                ['Covenant Policy', T.textMuted],
                ['Cross-Vertical Intelligence', T.textMuted],
                ['Governed Execution', T.textMuted],
                ['Outcome Attribution', T.textMuted],
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

        {/* ── Platform Advantage ── */}
        <section style={{
          padding: 'clamp(4rem, 8vw, 6.5rem) clamp(2rem, 6vw, 5rem)',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <FadeIn style={{ marginBottom: '3rem' }}>
              <SectionLabel>Platform Advantage — A11oy vs Observability-Only Tools</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.375rem)', fontFamily: T.serif,
                fontWeight: 400, letterSpacing: '-0.025em', color: T.text,
                lineHeight: 1.15, margin: '0 0 1rem', maxWidth: '28ch',
              }}>
                What observability tools like New Relic{' '}
                <span style={{ color: T.accent }}>structurally cannot deliver.</span>
              </h2>
              <p style={{
                fontSize: '0.9375rem', lineHeight: 1.75, color: T.textDim,
                maxWidth: '62ch', margin: 0,
              }}>
                Observability platforms tell you what your systems are doing. They cannot tell you
                who decided to act on that information, whether that decision was authorized, what
                model recommended it, or what the outcome proved. A11oy is not an observability
                platform — it is a governed execution fabric with proof at every layer.
              </p>
            </FadeIn>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1px', background: T.border,
              borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}>
              {[
                {
                  num: '01',
                  title: 'Observability shows. Governance proves.',
                  desc: 'New Relic, Datadog, and Dynatrace surface what happened to your systems. A11oy proves who decided what to do about it — on what basis, with what model, under whose authorization. The difference is not feature depth. It is architectural intent.',
                },
                {
                  num: '02',
                  title: 'Dashboards expire. Proof chains persist.',
                  desc: 'Observability dashboards are a view into the present. A11oy\'s Proof Ledger is an immutable record of the past — SHA-256 hashed, tamper-evident, queryable by decision, actor, or outcome. Regulators and auditors do not need dashboards. They need proof.',
                },
                {
                  num: '03',
                  title: 'Single-domain intelligence plateaus. Cross-vertical compounds.',
                  desc: 'Every observability platform is domain-bounded. A11oy\'s Signal Mesh connects a maritime sanctions flag to a legal obligation, connects a real estate risk to a portfolio exposure. No single-domain tool can produce this. The more verticals share the fabric, the more intelligence compounds.',
                },
                {
                  num: '04',
                  title: 'Configuration is not governance. Architecture is.',
                  desc: 'Observability tools offer configurable alerting. A11oy\'s Covenant Policy enforces who can approve, when, under what conditions — built into the execution layer, not toggled in a UI. Every new vertical inherits governance at zero marginal cost.',
                },
              ].map((item, i) => (
                <FadeIn key={item.num} delay={i * 0.06}>
                  <PlatformAdvantageCard {...item} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Per-Vertical Showcase ── */}
        <section style={{
          padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 6vw, 5rem)',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <FadeIn style={{ marginBottom: '3.5rem' }}>
              <SectionLabel>Seven Verticals — Competitive Positioning</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.375rem)', fontFamily: T.serif,
                fontWeight: 400, letterSpacing: '-0.025em', color: T.text,
                lineHeight: 1.15, margin: '0 0 1rem', maxWidth: '28ch',
              }}>
                What the established leaders{' '}
                <span style={{ color: T.accent }}>cannot structurally provide.</span>
              </h2>
              <p style={{
                fontSize: '0.9375rem', lineHeight: 1.75, color: T.textDim,
                maxWidth: '60ch', margin: 0,
              }}>
                Each vertical is positioned against the tool category that dominates its space.
                The positioning is structural — not a feature comparison, but an architectural
                distinction between intelligence delivery and governed execution with proof.
              </p>
            </FadeIn>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {COMPETITIVE_VERTICALS.map((cv, i) => (
                <FadeIn key={cv.id} delay={i * 0.04}>
                  <VerticalShowcase
                    cv={cv}
                    specId={VERTICAL_SPEC_MAP[cv.id]}
                  />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Download All Briefs ── */}
        <section style={{
          padding: 'clamp(4rem, 8vw, 7rem) clamp(2rem, 6vw, 5rem)',
          borderBottom: `1px solid ${T.border}`,
          background: 'rgba(255,255,255,0.008)',
        }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <FadeIn style={{ marginBottom: '2.75rem' }}>
              <SectionLabel>Download All Vertical Briefs</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontFamily: T.serif,
                fontWeight: 400, letterSpacing: '-0.025em', color: T.text,
                lineHeight: 1.15, margin: '0 0 0.75rem',
              }}>Seven briefs. One platform document.</h2>
              <p style={{ fontSize: '0.875rem', color: T.textDim, margin: 0, maxWidth: '50ch' }}>
                Each vertical brief details the philosophy, architecture, and capability proof points
                for that product. The platform brief covers the full SZL Holdings ecosystem.
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}>
                {VERTICAL_SPECS.map(spec => {
                  const cv = COMPETITIVE_VERTICALS.find(c => VERTICAL_SPEC_MAP[c.id] === spec.id);
                  const color = cv?.color ?? T.accent;
                  const rgbArr = spec.color;
                  const hexColor = `#${rgbArr[0].toString(16).padStart(2, '0')}${rgbArr[1].toString(16).padStart(2, '0')}${rgbArr[2].toString(16).padStart(2, '0')}`;
                  return (
                    <div
                      key={spec.id}
                      style={{
                        padding: '1.25rem',
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderTop: `2px solid ${toAlpha(hexColor, 0.5)}`,
                        borderRadius: 12,
                        display: 'flex', flexDirection: 'column', gap: '0.875rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{spec.emoji}</span>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>{spec.name}</div>
                          <div style={{
                            fontSize: '0.6rem', color: T.textMuted,
                            fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em',
                          }}>{spec.domain}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0, lineHeight: 1.55 }}>{spec.tagline}</p>
                      <DownloadButton
                        label="Download Brief"
                        onClick={() => generateVerticalPDF(spec.id)}
                        color={hexColor}
                      />
                    </div>
                  );
                })}

                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(201,183,135,0.04)',
                  border: '1px solid rgba(201,183,135,0.2)',
                  borderTop: '2px solid rgba(201,183,135,0.5)',
                  borderRadius: 12,
                  display: 'flex', flexDirection: 'column', gap: '0.875rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>◈</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>Platform Brief</div>
                      <div style={{
                        fontSize: '0.6rem', color: T.textMuted,
                        fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>All Verticals</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0, lineHeight: 1.55 }}>
                    Full SZL Holdings ecosystem overview — the governed AI execution fabric across all seven verticals.
                  </p>
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

        {/* ── Footer ── */}
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
