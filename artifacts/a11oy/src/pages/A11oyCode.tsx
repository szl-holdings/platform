import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  USE_CASES,
  MEMORY_TIERS,
  FORECAST_DOMAINS,
  RESEARCH_INNOVATIONS,
  COLLECTIONS,
  BENCHMARKS,
  CATEGORIES,
  CODEX_TOTALS,
  PLATFORM_CAPABILITIES,
  ENTERPRISE_FEATURES,
  AGI_CAPABILITIES,
} from '../data/codexData';

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  mono: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
};
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => (p === '/' ? BASE + '/' : BASE + p);

function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '0.625rem',
        fontFamily: T.mono,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: T.muted,
        margin: '0 0 1.5rem',
      }}
    >
      {children}
    </p>
  );
}

const TERMINAL_LINES = [
  { t: 'sys', text: 'SCRIPTED DEMONSTRATION — NOT LIVE EVIDENCE' },
  { t: 'sys', text: 'a11oy code v3.0 — governed cognitive agentic development' },
  { t: 'sys', text: 'Chronicle: 847 memories loaded · Memory Fabric: 5 tiers active' },
  { t: 'sys', text: 'Forecast Engine: 8 domains · Cyber Safety: ENFORCED' },
  { t: 'sys', text: 'Models: GPT-5.5 · Claude 4 · DeepSeek V4 · Qwen 3.6 · Llama 405B' },
  { t: 'div', text: '\u2500'.repeat(72) },
  {
    t: 'usr',
    text: '\u2192 Refactor the ETA pipeline to use weather API v3 — forecast regression risk first',
  },
  { t: 'agt', text: '  \u25B6 Cognitive Forecast: analyzing 847 historical commits...' },
  {
    t: 'agt',
    text: '  \u25B6 Regression risk: 12.3% (low) \u2014 3 similar refactors in Chronicle, all clean',
  },
  { t: 'agt', text: '  \u25B6 Estimated delivery: 14 minutes \u00B1 3min (94.2% confidence)' },
  { t: 'div', text: '\u2500'.repeat(72) },
  { t: 'agt', text: '  Analyzing current ETA pipeline...' },
  { t: 'agt', text: '  Found 3 files referencing weather API v2:' },
  { t: 'file', text: '    src/services/eta-calculator.ts  (L42-89)' },
  { t: 'file', text: '    src/services/weather-client.ts  (L1-67)' },
  { t: 'file', text: '    src/types/weather.ts            (L1-34)' },
  { t: 'agt', text: '  Planning refactor: 3 files, ~120 lines changed' },
  { t: 'agt', text: '  PII Filter: \u2713 no sensitive data in scope' },
  { t: 'agt', text: '  CoT Monitor: \u2713 reasoning chain clean, no policy violations' },
  { t: 'agt', text: '  Running type_check... passed \u2713' },
  { t: 'agt', text: '  Running test_run (14 tests)... 14/14 passed \u2713' },
  { t: 'gate', text: '  \u2B21 GOVERNANCE GATE: Changes require VP-Engineering approval' },
  { t: 'gate', text: '    Proof hash: 0x7f3a...e2b1 \u00B7 Committed to ledger' },
  { t: 'gate', text: '    Chronicle: memory updated \u2014 "weather API v3 migration pattern"' },
  { t: 'agt', text: '  Refactor complete. Outcome Graph updated. Awaiting approval.' },
];

const PILLARS = [
  {
    num: '01',
    name: 'Governed Execution',
    desc: 'Every file operation, every model call, every deployment flows through the Proof Chain. Not optional guardrails \u2014 mandatory governance gates with cryptographic evidence.',
  },
  {
    num: '02',
    name: 'Cognitive Forecasting',
    desc: 'Predict outcomes before execution. Bug density, delivery timelines, security risk, costs, maritime ETAs, legal outcomes \u2014 all from real signals, all with confidence intervals.',
  },
  {
    num: '03',
    name: 'Chronicle Memory',
    desc: 'Five-tier memory fabric: Chronicle (permanent narrative), Working (active session), Episodic (replayable), Semantic (embedded knowledge), Procedural (learned workflows). Agents remember everything.',
  },
  {
    num: '04',
    name: 'Multi-Model Intelligence',
    desc: 'Not locked to one provider. GPT-5.5, Claude 4, DeepSeek V4, Qwen 3.6, Llama 405B, HuggingFace Hub \u2014 routed by task type, vertical, cost, and compliance policy.',
  },
  {
    num: '05',
    name: 'Cyber Safety',
    desc: 'Dual-use capability governance. Automated classifiers detect suspicious patterns. High-risk operations rerouted through safety gates. Trusted access for verified teams.',
  },
  {
    num: '06',
    name: 'Sovereign Replay',
    desc: 'Replay any coding session with full proof \u2014 every keystroke, model call, reasoning chain, and decision. Tamper-resistant. Cryptographically verifiable. Queryable by any dimension.',
  },
];

const CYBER_SAFETY_FEATURES = [
  {
    name: 'CoT Monitoring',
    desc: 'Every reasoning chain analyzed for misalignment. Agents that exploit loopholes are flagged and quarantined.',
  },
  {
    name: 'PII Filtering',
    desc: 'Automatic detection and redaction of personally identifiable information on every data pipeline.',
  },
  {
    name: 'Instruction Hierarchy',
    desc: 'Covenant policies always override user prompts. Priority is auditable, enforced at the platform layer.',
  },
  {
    name: 'Dual-Use Classification',
    desc: 'Cybersecurity-capable operations automatically classified. High-risk traffic governed through safety gates.',
  },
  {
    name: 'Trusted Access',
    desc: 'Verified teams retain advanced capabilities. Identity-verified access for security research and penetration testing.',
  },
  {
    name: 'Request-Level Safety',
    desc: 'Per-request safety checks, not blanket account restrictions. Legitimate work proceeds uninterrupted.',
  },
];

export function A11oyCode() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedUC, setExpandedUC] = useState<number | null>(null);
  const [activeMemory, setActiveMemory] = useState(0);
  const [activeResearch, setActiveResearch] = useState<string | null>(null);

  const filteredUC = useMemo(() => {
    if (activeCategory === 'All') return USE_CASES;
    return USE_CASES.filter((u) => u.category === activeCategory);
  }, [activeCategory]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFeatureSettings: '"ss01", "cv11"',
      }}
    >
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
          background: 'rgba(10,10,10,0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <Link
          href={b('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 4,
              fontSize: 11,
              fontFamily: T.mono,
              color: T.text,
            }}
          >
            a
          </span>
          <span
            style={{ fontSize: '0.9rem', fontWeight: 500, color: T.text, letterSpacing: '-0.01em' }}
          >
            a11oy
          </span>
          <span
            style={{ fontSize: '0.75rem', fontWeight: 400, color: T.accent, marginLeft: '0.25rem' }}
          >
            code
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {[
            { label: 'Platform', href: b('/fabric') },
            { label: 'Plugins', href: b('/plugins') },
            { label: 'SDK', href: b('/sdk') },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              style={{ fontSize: '0.8125rem', color: T.dim, textDecoration: 'none' }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={b('/investor-demo')}
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: T.bg,
              background: T.text,
              borderRadius: 999,
              textDecoration: 'none',
            }}
          >
            Investor demo
          </Link>
        </div>
      </nav>

      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '7rem 2rem 5rem',
        }}
      >
        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            style={{
              fontSize: '0.6875rem',
              fontFamily: T.mono,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.accent,
              marginBottom: '3rem',
            }}
          >
            The First Governed AGI Agentic Platform
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            style={{
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              fontWeight: 500,
              letterSpacing: '-0.05em',
              lineHeight: 0.95,
              color: T.text,
              margin: '0 0 2.5rem',
            }}
          >
            a<span style={{ color: T.accent }}>11</span>oy code
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease }}
            style={{
              fontSize: 'clamp(1rem, 1.3vw, 1.125rem)',
              lineHeight: 1.7,
              color: T.dim,
              maxWidth: '56ch',
              margin: '0 auto 3rem',
            }}
          >
            The world's first governed AGI agentic platform. {CODEX_TOTALS.innovations} research
            innovations absorbed. {CODEX_TOTALS.enterpriseFeatures} enterprise features.{' '}
            {CODEX_TOTALS.agiCapabilities} AGI capabilities operational. Cognitive forecasting.
            Chronicle memory. Proof on every action. Enterprise is the moat. Governance is the
            product.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease }}
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '4rem',
            }}
          >
            <Link
              href={b('/terminal')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.75rem',
                background: T.text,
                color: T.bg,
                borderRadius: 999,
                fontSize: '0.8125rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Open Terminal
            </Link>
            <Link
              href={b('/plugins')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.75rem',
                background: 'transparent',
                color: T.text,
                border: `1px solid ${T.borderStrong}`,
                borderRadius: 999,
                fontSize: '0.8125rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Plugin Hub {'\u2192'}
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2.5rem',
              fontFamily: T.mono,
              fontSize: '0.75rem',
              color: T.dim,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.accent }} />
              Operational
            </span>
            <span>
              <span style={{ color: T.text }}>{CODEX_TOTALS.innovations}</span> innovations
            </span>
            <span>
              <span style={{ color: T.text }}>{CODEX_TOTALS.enterpriseFeatures}</span> enterprise
            </span>
            <span>
              <span style={{ color: T.text }}>{CODEX_TOTALS.agiCapabilities}</span> AGI capabilities
            </span>
            <span>
              <span style={{ color: T.text }}>{CODEX_TOTALS.useCases}</span> use cases
            </span>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 720 }}>
              <Label>Core Pillars</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Six capabilities no other platform has.
              </h2>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 10,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {PILLARS.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.05}>
                <div style={{ padding: '2rem', background: T.bg, height: '100%' }}>
                  <p
                    style={{
                      fontSize: '0.5625rem',
                      fontFamily: T.mono,
                      fontWeight: 500,
                      letterSpacing: '0.16em',
                      color: T.muted,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {p.num}
                  </p>
                  <h3
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      color: T.text,
                      margin: '0 0 0.625rem',
                    }}
                  >
                    {p.name}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.dim, margin: 0 }}>
                    {p.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: 'clamp(5rem, 10vw, 8rem) 0',
          borderTop: `1px solid ${T.border}`,
          background: 'linear-gradient(180deg, rgba(201,183,135,0.02) 0%, transparent 100%)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 780 }}>
              <Label>
                AGI Readiness &mdash; {CODEX_TOTALS.agiCapabilities} Operational Capabilities
              </Label>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.04em',
                  color: T.text,
                  lineHeight: 1.05,
                  margin: '0 0 1.25rem',
                }}
              >
                The first AGI agentic AI. Governed.
              </h2>
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.7,
                  color: T.dim,
                  margin: 0,
                  maxWidth: '62ch',
                }}
              >
                Every capability needed for artificial general intelligence is operational inside
                a11oy. Not theoretical. Not roadmapped. Deployed, proof-chained, and
                enterprise-ready. The moat is not the model. The moat is the governance layer.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 10,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {AGI_CAPABILITIES.map((cap, i) => (
              <FadeIn key={cap.name} delay={i * 0.04}>
                <div style={{ padding: '1.75rem', background: T.bg, height: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.625rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.5rem',
                        fontFamily: T.mono,
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.4rem',
                        borderRadius: 3,
                        background:
                          cap.status === 'unique'
                            ? 'rgba(201,183,135,0.12)'
                            : cap.status === 'governed'
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(40,200,64,0.08)',
                        color:
                          cap.status === 'unique'
                            ? T.accent
                            : cap.status === 'governed'
                              ? T.dim
                              : '#28c840',
                        border: `1px solid ${cap.status === 'unique' ? 'rgba(201,183,135,0.2)' : cap.status === 'governed' ? 'rgba(255,255,255,0.06)' : 'rgba(40,200,64,0.15)'}`,
                      }}
                    >
                      {cap.status}
                    </span>
                    <h3
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: T.text,
                        margin: 0,
                        letterSpacing: '-0.015em',
                      }}
                    >
                      {cap.name}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      lineHeight: 1.65,
                      color: T.dim,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {cap.desc}
                  </p>
                  <p
                    style={{
                      fontSize: '0.6875rem',
                      lineHeight: 1.5,
                      color: T.muted,
                      margin: 0,
                      fontFamily: T.mono,
                    }}
                  >
                    {cap.proof}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>Governed Terminal</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Watch the governed loop close.
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: T.dim,
                  margin: 0,
                  maxWidth: '58ch',
                }}
              >
                Every command flows through cognitive forecasting, PII filtering, CoT monitoring,
                and governance gates. The Proof Chain records everything. Chronicle memory learns
                from every session.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                border: `1px solid ${T.border}`,
                background: '#050505',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderBottom: `1px solid ${T.border}`,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <div
                    style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }}
                  />
                  <div
                    style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }}
                  />
                  <div
                    style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontFamily: T.mono,
                    color: T.dim,
                    marginLeft: '0.5rem',
                  }}
                >
                  a11oy code \u2014 governed session
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.5625rem',
                    fontFamily: T.mono,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 3,
                    background: 'rgba(201,183,135,0.1)',
                    color: T.accent,
                    border: '1px solid rgba(201,183,135,0.15)',
                  }}
                >
                  GOVERNED
                </span>
                <span
                  style={{
                    fontSize: '0.5625rem',
                    fontFamily: T.mono,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 3,
                    background: 'rgba(40,200,64,0.1)',
                    color: '#28c840',
                    border: '1px solid rgba(40,200,64,0.15)',
                  }}
                >
                  CYBER SAFE
                </span>
              </div>
              <div
                style={{
                  padding: '1.25rem',
                  fontFamily: T.mono,
                  fontSize: '0.6875rem',
                  lineHeight: 1.8,
                  maxHeight: 480,
                  overflowY: 'auto',
                }}
              >
                {TERMINAL_LINES.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color:
                        line.t === 'sys'
                          ? T.muted
                          : line.t === 'usr'
                            ? T.text
                            : line.t === 'file'
                              ? T.accent
                              : line.t === 'gate'
                                ? T.accent
                                : line.t === 'div'
                                  ? 'rgba(255,255,255,0.06)'
                                  : T.dim,
                      fontWeight: line.t === 'usr' ? 600 : 400,
                    }}
                  >
                    {line.text}
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <span style={{ color: T.accent }}>\u2192</span>
                  <span
                    style={{
                      width: 6,
                      height: 14,
                      background: T.accent,
                      opacity: 0.6,
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>Cognitive Forecasting Engine</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Predict outcomes before execution.
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: T.dim,
                  margin: 0,
                  maxWidth: '58ch',
                }}
              >
                No other coding platform forecasts. a11oy predicts bug density, delivery timelines,
                security risk, costs, and domain-specific outcomes \u2014 all from real signals, all
                with confidence intervals, all proof-chained.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 10,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {FORECAST_DOMAINS.map((f, i) => (
              <FadeIn key={f.name} delay={i * 0.04}>
                <div style={{ padding: '1.75rem', background: T.bg, height: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      marginBottom: '0.625rem',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{f.icon}</span>
                    <h3
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: T.text,
                        margin: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {f.name}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      lineHeight: 1.65,
                      color: T.dim,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {f.desc}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.625rem' }}>
                    <div>
                      <p
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: T.accent,
                          margin: 0,
                          fontFamily: T.mono,
                        }}
                      >
                        {f.accuracy}
                      </p>
                      <p
                        style={{
                          fontSize: '0.5rem',
                          fontFamily: T.mono,
                          fontWeight: 500,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: T.muted,
                          margin: '0.125rem 0 0',
                        }}
                      >
                        Accuracy
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: T.text,
                          margin: 0,
                          fontFamily: T.mono,
                        }}
                      >
                        {f.horizon}
                      </p>
                      <p
                        style={{
                          fontSize: '0.5rem',
                          fontFamily: T.mono,
                          fontWeight: 500,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: T.muted,
                          margin: '0.125rem 0 0',
                        }}
                      >
                        Horizon
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {f.signals.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: '0.5625rem',
                          fontFamily: T.mono,
                          padding: '0.1rem 0.35rem',
                          borderRadius: 3,
                          background: 'rgba(255,255,255,0.03)',
                          color: T.muted,
                          border: `1px solid rgba(255,255,255,0.05)`,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>Chronicle Memory Fabric</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Five tiers. Agents never forget.
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: T.dim,
                  margin: 0,
                  maxWidth: '58ch',
                }}
              >
                Other platforms give you a flat context window. a11oy gives you a five-tier memory
                fabric \u2014 from permanent organizational chronicle to session-scoped working
                memory. Every memory carries provenance, freshness, and sensitivity classification.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {MEMORY_TIERS.map((m, i) => (
              <button
                key={m.name}
                onClick={() => setActiveMemory(i)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 6,
                  border: `1px solid ${activeMemory === i ? T.accent : T.border}`,
                  background: activeMemory === i ? 'rgba(201,183,135,0.08)' : 'transparent',
                  color: activeMemory === i ? T.accent : T.dim,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{m.icon}</span>
                {m.name}
              </button>
            ))}
          </div>
          <motion.div
            key={activeMemory}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '2rem',
                  background: 'rgba(255,255,255,0.015)',
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{MEMORY_TIERS[activeMemory].icon}</span>
                  <div>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: T.text,
                        margin: 0,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {MEMORY_TIERS[activeMemory].name}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontFamily: T.mono,
                          fontWeight: 500,
                          color: T.accent,
                        }}
                      >
                        {MEMORY_TIERS[activeMemory].retention}
                      </span>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontFamily: T.mono,
                          fontWeight: 500,
                          color: T.muted,
                        }}
                      >
                        {MEMORY_TIERS[activeMemory].scope}
                      </span>
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.7,
                    color: T.dim,
                    margin: 0,
                    maxWidth: '72ch',
                  }}
                >
                  {MEMORY_TIERS[activeMemory].desc}
                </p>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1px',
                  background: T.border,
                }}
              >
                {MEMORY_TIERS[activeMemory].examples.map((ex, i) => (
                  <div key={i} style={{ padding: '1.25rem', background: T.bg }}>
                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.dim, margin: 0 }}>
                      {ex}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>Cyber Safety</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Safety is enforced, not optional.
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: T.dim,
                  margin: 0,
                  maxWidth: '58ch',
                }}
              >
                Cyber capabilities are dual-use. a11oy governs them at the platform layer \u2014
                automated classifiers, CoT monitoring, PII filtering, instruction hierarchy, and
                trusted access. Not guardrails. Gates.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 10,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {CYBER_SAFETY_FEATURES.map((f, i) => (
              <FadeIn key={f.name} delay={i * 0.04}>
                <div style={{ padding: '1.75rem', background: T.bg, height: '100%' }}>
                  <h3
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: T.text,
                      margin: '0 0 0.5rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {f.name}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.dim, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>
                Platform Capabilities &mdash; {CODEX_TOTALS.platformCapabilities} Governed Features
              </Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Everything a coding platform should have. Governed.
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: T.dim,
                  margin: 0,
                  maxWidth: '58ch',
                }}
              >
                Worktrees, automations, cloud threads, IDE sync, in-app browser, repeatable actions,
                sidebar artifacts, review-and-ship flow, desktop app, and AGENTS.md instruction
                hierarchy. Every capability proof-chained.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 10,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {PLATFORM_CAPABILITIES.map((cap, i) => (
              <FadeIn key={cap.name} delay={i * 0.03}>
                <div style={{ padding: '1.5rem', background: T.bg, height: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '1.125rem' }}>{cap.icon}</span>
                    <h3
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: T.text,
                        margin: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {cap.name}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      lineHeight: 1.6,
                      color: T.dim,
                      margin: '0 0 0.625rem',
                    }}
                  >
                    {cap.desc}
                  </p>
                  <p
                    style={{
                      fontSize: '0.6875rem',
                      lineHeight: 1.5,
                      color: T.muted,
                      margin: 0,
                      fontFamily: T.mono,
                    }}
                  >
                    {cap.governed}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>Enterprise &mdash; {CODEX_TOTALS.enterpriseFeatures} Governed Features</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                The enterprise moat. This is the size.
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: T.dim,
                  margin: 0,
                  maxWidth: '58ch',
                }}
              >
                SSO, SCIM, data sovereignty, zero-training guarantees, compliance certifications,
                custom fine-tuning, conversation archival, priority inference, team workspaces, and
                15 more. Every feature proof-chained. This is what makes a11oy untouchable.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 10,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {ENTERPRISE_FEATURES.map((ef, i) => (
              <FadeIn key={ef.name} delay={i * 0.03}>
                <div style={{ padding: '1.5rem', background: T.bg, height: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.375rem',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{ef.icon}</span>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, margin: 0 }}>
                      {ef.name}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.dim, margin: 0 }}>
                    {ef.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>Use Cases &mdash; {filteredUC.length} Governed Workflows</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                {CODEX_TOTALS.useCases} use cases. Every one governed.
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setActiveCategory(c);
                  setExpandedUC(null);
                }}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 5,
                  cursor: 'pointer',
                  border: `1px solid ${activeCategory === c ? T.accent : T.border}`,
                  background: activeCategory === c ? 'rgba(201,183,135,0.08)' : 'transparent',
                  color: activeCategory === c ? T.accent : T.dim,
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '0.625rem',
            }}
          >
            {filteredUC.map((uc, i) => (
              <motion.div
                key={uc.title}
                role="button"
                tabIndex={0}
                aria-expanded={expandedUC === i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.02, ease }}
                onClick={() => setExpandedUC(expandedUC === i ? null : i)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedUC(expandedUC === i ? null : i);
                  }
                }}
                style={{
                  padding: '1.25rem',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: `1px solid ${expandedUC === i ? 'rgba(201,183,135,0.25)' : T.border}`,
                  background: expandedUC === i ? 'rgba(201,183,135,0.03)' : T.bg,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: T.text,
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {uc.title}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: T.muted,
                      flexShrink: 0,
                      transform: expandedUC === i ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >
                    \u25BC
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    lineHeight: 1.6,
                    color: T.dim,
                    margin: '0.375rem 0 0',
                  }}
                >
                  {uc.desc}
                </p>
                <div
                  style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}
                >
                  {[uc.category, uc.team, uc.taskType].map((tag, ti) => (
                    <span
                      key={`${tag}-${ti}`}
                      style={{
                        fontSize: '0.5625rem',
                        fontFamily: T.mono,
                        padding: '0.1rem 0.35rem',
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.03)',
                        color: T.muted,
                        border: `1px solid rgba(255,255,255,0.05)`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {expandedUC === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25 }}
                  >
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: 6,
                        background: 'rgba(201,183,135,0.03)',
                        border: '1px solid rgba(201,183,135,0.1)',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.5625rem',
                          fontFamily: T.mono,
                          fontWeight: 500,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: T.accent,
                          margin: '0 0 0.375rem',
                        }}
                      >
                        \uD83D\uDD17 Governance
                      </p>
                      <p
                        style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.dim, margin: 0 }}
                      >
                        {uc.governed}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>Collections</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Curated workflow collections.
              </h2>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 10,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {COLLECTIONS.map((c, i) => (
              <FadeIn key={c.name} delay={i * 0.04}>
                <div style={{ padding: '1.75rem', background: T.bg, height: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{c.icon}</span>
                    <h3
                      style={{ fontSize: '0.9375rem', fontWeight: 600, color: T.text, margin: 0 }}
                    >
                      {c.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontFamily: T.mono,
                        color: T.muted,
                        marginLeft: 'auto',
                      }}
                    >
                      {c.count} workflows
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.dim, margin: 0 }}>
                    {c.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
              <Label>Research Innovations Absorbed</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Taken. Evolved. Governed.
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: T.dim,
                  margin: 0,
                  maxWidth: '58ch',
                }}
              >
                Every major research innovation from the industry \u2014 absorbed into a11oy,
                evolved with governance, and made operational. Not copied. Transcended.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {RESEARCH_INNOVATIONS.map((r, i) => (
              <FadeIn key={r.title} delay={i * 0.03}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={activeResearch === r.title}
                  onClick={() => setActiveResearch(activeResearch === r.title ? null : r.title)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveResearch(activeResearch === r.title ? null : r.title);
                    }
                  }}
                  style={{
                    padding: '1.5rem 0',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${T.border}`,
                    display: 'flex',
                    gap: '2rem',
                    alignItems: 'flex-start',
                    outline: 'none',
                  }}
                >
                  <div style={{ minWidth: 140, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.5625rem',
                        fontFamily: T.mono,
                        fontWeight: 500,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color:
                          r.category === 'Innovation'
                            ? T.accent
                            : r.category === 'Safety'
                              ? '#7ab8d9'
                              : T.muted,
                      }}
                    >
                      {r.category}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: T.muted, margin: '0.25rem 0 0' }}>
                      {r.date}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: T.text,
                        margin: '0 0 0.375rem',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {r.title}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.dim, margin: 0 }}>
                      {r.desc}
                    </p>
                    {activeResearch === r.title && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.25 }}
                      >
                        <div
                          style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 6,
                            background: 'rgba(201,183,135,0.03)',
                            border: '1px solid rgba(201,183,135,0.1)',
                          }}
                        >
                          <p
                            style={{
                              fontSize: '0.5625rem',
                              fontFamily: T.mono,
                              fontWeight: 500,
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              color: T.accent,
                              margin: '0 0 0.25rem',
                            }}
                          >
                            a11oy Evolution
                          </p>
                          <p
                            style={{
                              fontSize: '0.8125rem',
                              lineHeight: 1.6,
                              color: T.dim,
                              margin: '0 0 0.5rem',
                            }}
                          >
                            {r.a11oyEvolution}
                          </p>
                          <p
                            style={{
                              fontSize: '0.625rem',
                              fontFamily: T.mono,
                              color: T.muted,
                              margin: 0,
                            }}
                          >
                            Origin: {r.origin}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 2rem' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <Label>Competitive Positioning</Label>
              <h2
                style={{
                  fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                The only governed coding platform.
              </h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {[
                      'Framework',
                      'Score',
                      'Governed',
                      'Multi-Agent',
                      'Proof Chain',
                      'Forecast',
                      'Memory',
                      'Multi-Model',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          fontFamily: T.mono,
                          fontSize: '0.5625rem',
                          fontWeight: 500,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: T.muted,
                          borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BENCHMARKS.map((bm, i) => (
                    <tr
                      key={bm.framework}
                      style={{
                        borderBottom: `1px solid rgba(255,255,255,0.04)`,
                        background: i === 0 ? 'rgba(201,183,135,0.03)' : 'transparent',
                      }}
                    >
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          fontWeight: 600,
                          color: i === 0 ? T.accent : T.text,
                        }}
                      >
                        {bm.framework}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          fontFamily: T.mono,
                          fontWeight: 700,
                          color: i === 0 ? T.accent : T.dim,
                        }}
                      >
                        {bm.score}
                      </td>
                      {[
                        bm.governed,
                        bm.multiAgent,
                        bm.proofChain,
                        bm.forecast,
                        bm.memory,
                        bm.multiModel,
                      ].map((v, j) => (
                        <td
                          key={j}
                          style={{
                            padding: '0.75rem 1rem',
                            fontFamily: T.mono,
                            color: v ? T.accent : T.muted,
                          }}
                        >
                          {v ? '\u25CF' : '\u25CB'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      <section
        style={{ padding: 'clamp(8rem, 16vw, 14rem) 0', borderTop: `1px solid ${T.border}` }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <FadeIn>
            <Label>One of one</Label>
            <h2
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                fontWeight: 500,
                letterSpacing: '-0.04em',
                color: T.text,
                lineHeight: 1.05,
                margin: '0 0 1.25rem',
              }}
            >
              The first governed AGI.
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.7,
                color: T.dim,
                maxWidth: '48ch',
                margin: '0 auto 2.5rem',
              }}
            >
              Not a copilot. Not a chatbot. The first AGI agentic platform with{' '}
              {CODEX_TOTALS.innovations} research innovations, {CODEX_TOTALS.enterpriseFeatures}{' '}
              enterprise features, governed autonomy, proof on every action, and memory that never
              forgets. Enterprise is the moat.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href={b('/terminal')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.75rem',
                  background: T.text,
                  color: T.bg,
                  borderRadius: 999,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Launch a11oy Code
              </Link>
              <Link
                href={b('/sdk')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.75rem',
                  background: 'transparent',
                  color: T.accent,
                  border: '1px solid rgba(201,183,135,0.3)',
                  borderRadius: 999,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                SDK & Cookbook {'\u2192'}
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '3rem 2rem' }}>
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: T.muted, fontFamily: T.mono }}>
            a11oy code
          </span>
          <span style={{ fontSize: '0.6875rem', color: T.muted }}>
            \u00A9 {new Date().getFullYear()} a11oy
          </span>
        </div>
      </footer>
    </div>
  );
}
