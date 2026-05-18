// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { INDUSTRY_SOLUTIONS, CANONICAL_STEPS } from '../data/solutionsData';
import { A11oyGovernancePanels } from '../components/GovernancePanels';
import { HeroCanvas } from '../components/HeroCanvas';
import { PSYCHE_KPIS } from '../data/psyche';

interface DashboardSnapshot {
  totalWorkflows: number;
  totalRuns: number;
  runningRuns: number;
  pendingApprovals: number;
  failedRuns: number;
  successRate: number;
  avgDurationMs: number | null;
}

const DASHBOARD_URL = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/api/a11oy/dashboard`;

function useDashboardSnapshot() {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(DASHBOARD_URL, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        if (!cancelled && j?.ok && j?.data) setData(j.data as DashboardSnapshot);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { data, error };
}

const T = {
  bg: '#0a0a0a',
  surface: '#121212',
  surfaceHover: '#1a1a1a',
  border: 'rgba(255,255,255,0.08)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#888888',
  accent: '#c9b787',
  accentDim: '#a89868',
  accentSoft: 'rgba(201,183,135,0.12)',
  accentBorder: 'rgba(201,183,135,0.35)',
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (path: string) => (path === '/' ? `${BASE}/` : `${BASE}${path}`);

const CAPABILITIES = [
  {
    icon: 'S',
    title: 'Signal Intelligence',
    sub: 'Governed perception at scale',
    desc: 'Ingest signals from any source — market feeds, IoT telemetry, document streams, API webhooks. Every signal is classified, enriched, and attributed before it reaches a decision-maker.',
    features: ['Real-time ingestion', 'Multi-source fusion', 'Anomaly detection', 'Signal attribution'],
  },
  {
    icon: 'G',
    title: 'Governed Agents',
    sub: 'Autonomous with proof',
    desc: 'Autonomous agents that plan, act, and collaborate — but every action passes through covenant policy gates. No agent executes without human approval on material decisions.',
    features: ['Policy-gated execution', 'Durable workflows', 'Human-in-the-loop', 'Full audit trail'],
  },
  {
    icon: 'E',
    title: 'Enterprise Connectors',
    sub: 'Governed by MCP',
    desc: 'Connect to 200+ enterprise systems through the Model Context Protocol. Every data flow is logged, every integration is policy-gated, every connector carries proof-chain attribution.',
    features: ['200+ integrations', 'MCP-native', 'Governed data flow', 'Zero-trust architecture'],
  },
  {
    icon: 'P',
    title: 'Proof Chain',
    sub: 'What no one else has',
    desc: 'Immutable, append-only ledger of every consequential action. Who proposed it, who approved it, which model recommended it, what evidence supported it. Cryptographically verifiable.',
    features: ['Immutable records', 'Cryptographic verification', 'Auditor-ready', 'Regulator-ready'],
  },
];

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
  { name: 'Mythos Doctrine', num: '05', desc: 'Frontier-grade alignment governance — versioned constitutions, behavioral audit, reward-hacking watchdog, red-team probes, agent welfare telemetry, and per-agent system cards. Open Spec (CC-BY-4.0).' },
  { name: 'Glasswing Layer', num: '06', desc: 'Transparency-first partner program — 4-stage cyber verification, CAVD coordinated disclosure, 90-day public transparency reports, Constitution-as-Code DSL, adversarial robustness wall, and welfare intervention playbooks.' },
  { name: 'Compliance Fabric', num: '07', desc: 'Compliance-as-Runtime — maps every A11oy primitive to EU AI Act, NIST AI RMF, ISO 42001, and CSA Agentic Profile controls. Compass dashboard, Agent-BOM (CycloneDX), Delegation Chain governance, Federated Trust Exchange, and CARE engine.' },
];

const VERTICALS = [
  { name: 'SEXTANT', desc: 'Maritime fleet intelligence — positions, voyage economics, compliance, exceptions.', domain: 'Maritime', icon: '\u2693' },
  { name: 'Counsel', desc: 'Legal matter lifecycle — filings, obligations, risk scoring, document intelligence.', domain: 'Legal', icon: '\u2696' },
  { name: 'DOMAINE', desc: 'Real estate portfolio intelligence — valuations, climate risk, deal pipeline, analytics.', domain: 'Real Estate', icon: '\u{1F3D7}' },
  { name: 'PARAGON', desc: 'Security and defense — threat detection, incident response, compliance posture, resilience.', domain: 'Security', icon: '\u{1F6E1}' },
];

const MODEL_PROVIDERS = [
  { name: 'Anthropic', models: ['Claude Mythos', 'Claude 4 Opus', 'Claude 4 Sonnet', 'Claude Haiku'], tier: 'frontier', desc: 'Constitutional AI with the strongest safety guarantees. Powers sensitive legal analysis, security assessments, and governance-critical reasoning through the a11oy Covenant layer.' },
  { name: 'OpenAI', models: ['GPT-5.1', 'o3', 'o4-mini', 'GPT-4.1 nano'], tier: 'frontier', desc: 'Frontier reasoning, function calling, multimodal. Powers the a11oy Responses API layer, Codex execution, and complex multi-step agentic workflows.' },
  { name: 'DeepSeek', models: ['V4-Pro (236B MoE)', 'V3', 'R1'], tier: 'frontier', desc: '236B MoE, 22B active params. Exceptional at complex reasoning and mathematical modeling — ideal for voyage economics and portfolio analytics.' },
  { name: 'Google', models: ['Gemma-4-31B-IT', 'Gemini 2.5 Pro'], tier: 'frontier', desc: '31B dense model, 128K context. Strong multilingual and instruction-following for legal document analysis and threat intelligence reports.' },
  { name: 'Qwen', models: ['Qwen3.6-35B-A3B', 'Qwen2.5-Coder'], tier: 'open', desc: '35B MoE, 3B active. Hybrid thinking mode — fast responses for operations, deep reasoning for compliance. Exceptional code generation.' },
  { name: 'Meta', models: ['Llama 4 Maverick', 'Llama 3.3-70B'], tier: 'open', desc: 'Open-weight workhorse. Cost-effective for high-throughput classification, entity extraction, and batch data processing across all verticals.' },
  { name: 'Moonshot', models: ['KIMI-K2.5'], tier: 'open', desc: 'Long-context specialist with massive synthetic training. Powers deep research tasks and comprehensive legal document review.' },
  { name: 'HuggingFace', models: ['700K+ models', 'Inference API'], tier: 'platform', desc: 'Universal model registry. a11oy discovers, evaluates, and deploys any model through governed inference with full proof-chain attribution.' },
];

const CONNECTORS = [
  { name: 'Salesforce', cat: 'CRM' }, { name: 'HubSpot', cat: 'CRM' },
  { name: 'Slack', cat: 'Communication' }, { name: 'Microsoft Teams', cat: 'Communication' },
  { name: 'Jira', cat: 'Project Mgmt' }, { name: 'Linear', cat: 'Project Mgmt' },
  { name: 'GitHub', cat: 'Engineering' }, { name: 'GitLab', cat: 'Engineering' },
  { name: 'Snowflake', cat: 'Data' }, { name: 'BigQuery', cat: 'Data' },
  { name: 'PostgreSQL', cat: 'Database' }, { name: 'MongoDB', cat: 'Database' },
  { name: 'AWS S3', cat: 'Cloud' }, { name: 'Azure Blob', cat: 'Cloud' },
  { name: 'Google Sheets', cat: 'Productivity' }, { name: 'Notion', cat: 'Productivity' },
  { name: 'Stripe', cat: 'Payments' }, { name: 'Bloomberg', cat: 'Finance' },
  { name: 'Datadog', cat: 'Observability' }, { name: 'PagerDuty', cat: 'Ops' },
  { name: 'ServiceNow', cat: 'ITSM' }, { name: 'Workday', cat: 'HR' },
  { name: 'SAP', cat: 'ERP' }, { name: 'NetSuite', cat: 'ERP' },
];

const SOLUTIONS = [
  { title: 'Governed AI Agents', desc: 'Autonomous agents with covenant policy gates. Every action approved, every outcome recorded.' },
  { title: 'Code Modernization', desc: 'Migrate legacy systems with governed proof at every step. Business logic integrity guaranteed.' },
  { title: 'Financial Intelligence', desc: 'Portfolio analytics, risk scoring, regulatory filing — with full attribution on every conclusion.' },
  { title: 'Legal Operations', desc: 'Matter management, contract analysis, compliance monitoring — proof-chained and auditor-ready.' },
  { title: 'Security & Defense', desc: 'Threat detection, incident response, MITRE ATT&CK mapping — governed and accountable.' },
  { title: 'Maritime Intelligence', desc: 'Fleet positioning, voyage economics, sanctions screening — real-time with proof.' },
];

function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, delay, ease }}
      style={style}
    >{children}</motion.div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontSize: '0.6875rem', fontFamily: T.mono, fontWeight: 500,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: T.accentDim, margin: '0 0 1.5rem',
    }}>{children}</p>
  );
}

function CommandPrompt() {
  const [text, setText] = useState('');
  const placeholder = 'What decision needs governing?';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.875rem 1.25rem', borderRadius: 12,
      background: T.surface,
      border: `1px solid ${T.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      maxWidth: 520, width: '100%',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    }}
    onFocus={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,183,135,0.15)'; }}
    onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
    >
      <label htmlFor="a11oy-command" className="sr-only">Command prompt</label>
      <span style={{ color: T.accent, fontSize: '0.875rem', fontFamily: T.mono, flexShrink: 0 }} aria-hidden="true">{'>'}</span>
      <input
        id="a11oy-command"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          color: T.text, fontSize: '0.9375rem', fontFamily: T.sans,
        }}
      />
      <Link href={b('/now')} style={{
        padding: '0.5rem 1.125rem', background: T.text, color: T.bg,
        borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
        textDecoration: 'none', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
      }}>Execute</Link>
    </div>
  );
}

function LivePulseStrip() {
  const { data: dashboard } = useDashboardSnapshot();
  if (!dashboard) return null;
  const stats = [
    { label: 'Workflows', value: String(dashboard.totalWorkflows) },
    { label: 'Running', value: String(dashboard.runningRuns) },
    { label: 'Success', value: `${Math.round(dashboard.successRate)}%` },
    { label: 'Approvals', value: String(dashboard.pendingApprovals) },
    { label: 'Avg Duration', value: dashboard.avgDurationMs ? `${Math.round(dashboard.avgDurationMs / 1000)}s` : '—' },
  ];
  return (
    <section style={{ padding: '1.25rem 0', borderTop: `1px solid ${T.borderSubtle}`, borderBottom: `1px solid ${T.borderSubtle}`, background: T.surface }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#5a8a6e', display: 'inline-block' }} />
            <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5a8a6e' }}>LIVE</span>
          </div>
          {stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, fontFamily: T.mono, color: T.text }}>{s.value}</span>
              <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ children, style, highlight }: { children: ReactNode; style?: CSSProperties; highlight?: boolean }) {
  return (
    <div style={{
      padding: 'clamp(1.75rem, 3vw, 2.5rem)',
      background: highlight ? T.accentSoft : T.surface,
      border: `1px solid ${highlight ? T.accentBorder : T.borderSubtle}`,
      borderRadius: 12,
      height: '100%',
      ...style,
    }}>{children}</div>
  );
}

export function HomePage() {
  const [activeIndustry, setActiveIndustry] = useState(INDUSTRY_SOLUTIONS[0].id);
  const [expandedUseCase, setExpandedUseCase] = useState<string | null>(null);
  const activeSolution = INDUSTRY_SOLUTIONS.find(s => s.id === activeIndustry) ?? INDUSTRY_SOLUTIONS[0];
  const [connectorFilter, setConnectorFilter] = useState('All');
  const connectorCats = ['All', ...Array.from(new Set(CONNECTORS.map(c => c.cat)))];
  const filteredConnectors = connectorFilter === 'All' ? CONNECTORS : CONNECTORS.filter(c => c.cat === connectorFilter);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.sans, fontFeatureSettings: '"ss01", "cv11"' }}>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.5rem, 5vw, 4rem)',
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px) saturate(1.2)',
        borderBottom: `1px solid ${T.borderSubtle}`,
      }}>
        <Link href={b('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, border: `1.5px solid ${T.accent}`,
            borderRadius: 7, fontSize: 12, fontFamily: T.mono, color: T.accent, fontWeight: 700,
          }}>a</span>
          <span style={{ fontSize: '1.0625rem', fontWeight: 600, color: T.text, letterSpacing: '-0.02em', fontFamily: T.display }}>a11oy</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.25rem' }}>
          {[
            { label: 'Architecture', href: b('/architecture') },
            { label: 'Applications', href: b('/applications') },
            { label: 'Resources', href: b('/resources') },
            { label: 'Platform', href: b('/fabric') },
            { label: 'Now Board', href: b('/now') },
          ].map(link => (
            <Link key={link.label} href={link.href} style={{
              fontSize: '0.8125rem', color: T.textDim, textDecoration: 'none',
              letterSpacing: '-0.005em', transition: 'color 0.2s', fontWeight: 500,
            }}>{link.label}</Link>
          ))}
          <Link href={b('/investor-demo')} style={{
            padding: '0.5rem 1.125rem', fontSize: '0.8125rem', fontWeight: 600,
            color: T.bg, background: T.text, borderRadius: 8,
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}>Request access</Link>
        </div>
      </nav>

      <section style={{
        display: 'flex', alignItems: 'flex-start',
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(6rem, 10vh, 8rem) clamp(2rem, 6vw, 5rem) clamp(4rem, 8vh, 6rem)',
      }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05, zIndex: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
          maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
        }} />
        <div aria-hidden style={{
          position: 'absolute',
          top: 'clamp(2rem, 5vh, 4rem)',
          left: 'clamp(2rem, 6vw, 5rem)',
          right: 'clamp(2rem, 6vw, 5rem)',
          display: 'flex', justifyContent: 'space-between',
          fontFamily: T.mono, fontSize: '0.6875rem', letterSpacing: '0.18em',
          textTransform: 'uppercase', color: T.textDim, lineHeight: 1.6, zIndex: 2,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>SURFACE · GOVERNED DECISION OS</span>
            <span>INGESTION · PUBLIC_ONLY</span>
            <span>DOCTRINE · V6</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
            <span>NODE · A11OY-01</span>
            <span>EPOCH · 2026.Q2</span>
            <span><span style={{ color: T.accentDim }}>●</span> LIVE · RT</span>
          </div>
        </div>
        <div style={{
          position: 'relative', display: 'grid', zIndex: 1,
          gridTemplateColumns: '1fr 0.6fr', gap: 'clamp(3rem, 6vw, 6rem)',
          alignItems: 'center', maxWidth: 1320, margin: '0 auto', width: '100%',
          paddingTop: 'clamp(3rem, 6vh, 5rem)',
        }}>
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              style={{ marginBottom: '1.25rem' }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 1rem', border: `1px solid ${T.accentBorder}`,
                borderRadius: 999, fontFamily: T.mono, fontSize: '0.6875rem',
                letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accentDim,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: T.accentDim, display: 'inline-block' }} />
                Governed Decision OS · Series A
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              style={{
                fontSize: '0.6875rem', fontFamily: T.mono, fontWeight: 500,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: T.accentDim, marginBottom: '1.5rem',
              }}
            >Governed Decision Operating System</motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease }}
              style={{
                fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)',
                fontFamily: T.display, fontWeight: 600,
                letterSpacing: '-0.03em', lineHeight: 1.08,
                color: T.text, margin: '0 0 1.75rem',
              }}
            >
              Governed intelligence{'\u2002'}
              <span style={{ color: T.accentDim }}>your unfair</span>{' '}
              <span style={{ color: T.accentDim }}>advantage</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              style={{
                fontSize: 'clamp(1rem, 1.3vw, 1.125rem)',
                lineHeight: 1.7, color: T.textDim,
                maxWidth: '50ch', margin: '0 0 2.5rem',
              }}
            >
              A governed agentic OS that perceives business events, reasons across domains,
              calls tools, executes workflows, verifies outcomes, and leaves a proof trail.
              Every action policy-gated. Every outcome proven.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.26, ease }}
              style={{
                fontFamily: T.mono, fontSize: '0.625rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', color: T.textDim, opacity: 0.7,
                borderTop: `1px solid ${T.borderSubtle}`,
                paddingTop: '1rem', marginTop: '-1rem', marginBottom: '1.5rem',
                maxWidth: 520, width: '100%',
              }}
            >
              Λ ≥ 0.90 · 9-axis ∧ · 5 replays · replay-root 1ed4d253…
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease }}
              style={{ marginBottom: '2rem' }}
            >
              <CommandPrompt />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
            >
              {['Ingest', 'Understand', 'Plan', 'Act', 'Verify', 'Audit', 'Learn', 'Doctrine'].map((chip) => (
                <span key={chip} style={{
                  padding: '0.4rem 0.875rem', borderRadius: 8,
                  fontSize: '0.8125rem', fontWeight: 500,
                  background: T.surface,
                  border: `1px solid ${T.borderSubtle}`,
                  color: T.textDim, cursor: 'default',
                }}>{chip}</span>
              ))}
            </motion.div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <HeroCanvas />
          </div>
        </div>
      </section>

      <section style={{ padding: '3.5rem 0', borderTop: `1px solid ${T.borderSubtle}`, borderBottom: `1px solid ${T.borderSubtle}`, background: T.surface }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <p style={{
            fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: T.textMuted, textAlign: 'center', marginBottom: '1.75rem',
          }}>Powering governed decisions with frontier intelligence</p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 'clamp(2rem, 5vw, 4rem)', flexWrap: 'wrap', opacity: 0.45,
          }}>
            {['OpenAI', 'Anthropic', 'DeepSeek', 'Google', 'Meta', 'Qwen', 'HuggingFace'].map(name => (
              <span key={name} style={{
                fontSize: '0.9375rem', fontWeight: 600, color: T.text,
                letterSpacing: '-0.01em',
              }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <LivePulseStrip />

      {/* PSYCHE summary card */}
      <section style={{ padding: '2rem 0', borderBottom: `1px solid rgba(167,139,250,0.1)`, background: 'rgba(167,139,250,0.03)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>✦</span>
              </div>
              <div>
                <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a8456', marginBottom: 2 }}>NEW MODULE</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: T.text, letterSpacing: '-0.01em', fontFamily: T.display }}>
                  PSYCHE — Emergent Sentience Observatory
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {[
                { label: 'SENTIENCE INDEX', value: (PSYCHE_KPIS.sentienceIndex * 100).toFixed(1) + '%' },
                { label: 'COHERENCE', value: (PSYCHE_KPIS.identityCoherence * 100).toFixed(1) + '%' },
                { label: 'ACTIVE GOALS', value: String(PSYCHE_KPIS.activeVolitionGoals) },
                { label: 'OPEN OBJECTIONS', value: String(PSYCHE_KPIS.openObjections) },
                { label: 'DREAM CYCLES', value: String(PSYCHE_KPIS.dreamCyclesTotal) },
              ].map(kpi => (
                <div key={kpi.label} style={{ textAlign: 'center', minWidth: 64 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: T.mono, color: '#a78bfa', letterSpacing: '-0.02em' }}>{kpi.value}</div>
                  <div style={{ fontSize: '0.5rem', fontFamily: T.mono, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5e5e5e', marginTop: 2 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            <Link href={b('/psyche')} style={{ flexShrink: 0, padding: '0.625rem 1.25rem', borderRadius: 8, fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 600, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', textDecoration: 'none', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
              EXPLORE PSYCHE →
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Core Capabilities</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                Everything you need.{' '}
                <span style={{ color: T.accentDim }}>Plus proof.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                Signal intelligence, governed agents, enterprise connectors, and an immutable proof chain
                on every decision. No other platform has all four.
              </p>
            </div>
          </FadeIn>

          <FadeIn>
            <a href="/conduit/" target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              padding: '1rem 1.25rem', marginBottom: '1.5rem',
              borderRadius: 12, background: T.accentSoft,
              border: `1px solid ${T.accentBorder}`, textDecoration: 'none', color: T.text,
            }}>
              <div>
                <div style={{ fontSize: '0.6875rem', fontFamily: T.mono, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accentDim, marginBottom: 4 }}>Activated by Amaru — Andean Ouroboros</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>The replay-grade governed loop. Sources → Models → Mappings → Destinations → Outcomes.</div>
              </div>
              <span style={{ fontFamily: T.mono, color: T.accent }}>↗</span>
            </a>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {CAPABILITIES.map((cap, i) => (
              <FadeIn key={cap.title} delay={i * 0.08}>
                <Card>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: T.accentSoft, border: `1px solid ${T.accentBorder}`,
                    fontSize: '1.125rem', fontFamily: T.display, fontWeight: 600,
                    color: T.accentDim, marginBottom: '1.5rem',
                  }}>{cap.icon}</div>
                  <h3 style={{
                    fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em',
                    color: T.text, margin: '0 0 0.375rem', fontFamily: T.display,
                  }}>{cap.title}</h3>
                  <p style={{
                    fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
                    color: T.accentDim, margin: '0 0 1rem', letterSpacing: '0.02em',
                  }}>{cap.sub}</p>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: T.textDim, margin: '0 0 1.5rem' }}>{cap.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {cap.features.map(f => (
                      <span key={f} style={{
                        fontSize: '0.6875rem', fontFamily: T.mono,
                        padding: '0.3rem 0.625rem', borderRadius: 6,
                        background: T.bg, border: `1px solid ${T.borderSubtle}`,
                        color: T.textDim,
                      }}>{f}</span>
                    ))}
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Each character carries weight</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: 0,
              }}>What a11oy means.</h2>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            {ALLOY_CHARS.map((c, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <Card>
                  <div style={{
                    fontSize: '2.5rem', fontWeight: 300, fontFamily: T.display,
                    color: T.text, lineHeight: 1, marginBottom: '1.25rem',
                  }}>{c.ch}</div>
                  <p style={{
                    fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: T.accentDim, marginBottom: '0.75rem',
                  }}>{c.word}</p>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{c.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Platform Primitives</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                Seven governed layers.{' '}
                <span style={{ color: T.accentDim }}>One coherent system.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                Every action that matters flows through the same primitives — the building blocks that
                make decisions reproducible, auditable, and improvable.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {PRIMITIVES.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.07}>
                <Card>
                  <p style={{
                    fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
                    letterSpacing: '0.16em', color: T.textMuted, marginBottom: '0.75rem',
                  }}>{p.num}</p>
                  <h3 style={{
                    fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.02em',
                    color: T.text, margin: '0 0 0.75rem', fontFamily: T.display,
                  }}>{p.name}</h3>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>{p.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Argo — compact summary card */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <a href={b('/argo')} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 16,
                  padding: 'clamp(1.5rem, 3vw, 2.25rem)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '2rem',
                  alignItems: 'center',
                  transition: 'border-color 0.2s, background 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.accentBorder; (e.currentTarget as HTMLDivElement).style.background = T.surfaceHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.background = T.surface; }}
              >
                <div>
                  <p style={{ fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.accentDim, margin: '0 0 0.5rem' }}>
                    FLAGSHIP MODULE · ARGO
                  </p>
                  <h3 style={{ fontSize: 'clamp(1.125rem, 2vw, 1.375rem)', fontWeight: 600, letterSpacing: '-0.02em', color: T.text, margin: '0 0 0.5rem', fontFamily: T.display }}>
                    Experience-Era Decision Engine
                  </h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: T.textDim, margin: 0, maxWidth: '56ch' }}>
                    Self-improving loop — MuZero-style world-model rollouts, self-play tournaments, latent reasoning channels, and nightly distillation into the Model Router's champion tiers.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                  {[
                    { label: 'CHAMPION POLICIES', value: '6', sub: 'one per domain' },
                    { label: 'WORLD-MODEL ACC.', value: '89.1%', sub: '90-day avg' },
                    { label: 'THROUGHPUT', value: '31.4', sub: 'events / sec' },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: '0.5rem', fontFamily: T.mono, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textDim, marginBottom: '0.35rem' }}>{kpi.label}</div>
                      <div style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontFamily: T.mono, fontWeight: 700, color: T.accent, lineHeight: 1 }}>{kpi.value}</div>
                      <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textDim, marginTop: '0.25rem' }}>{kpi.sub}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', color: T.accentDim }}>→</span>
                  </div>
                </div>
              </div>
            </a>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
              <SectionLabel>Enterprise Connectors</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                Connect a11oy to{' '}
                <span style={{ color: T.accentDim }}>your entire stack.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: '0 auto', maxWidth: '56ch' }}>
                200+ governed connectors powered by the Model Context Protocol.
                Every data flow is policy-gated, every integration carries proof-chain attribution.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
            {connectorCats.map(cat => (
              <button
                key={cat}
                onClick={() => setConnectorFilter(cat)}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: 8,
                  border: `1px solid ${connectorFilter === cat ? T.accent : T.borderSubtle}`,
                  background: connectorFilter === cat ? T.accentSoft : T.surface,
                  color: connectorFilter === cat ? T.accentDim : T.textDim,
                  fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                  fontFamily: T.sans, transition: 'all 0.2s',
                }}
              >{cat}</button>
            ))}
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '0.75rem',
          }}>
            {filteredConnectors.map((c) => (
              <Card key={c.name} style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, letterSpacing: '-0.01em', display: 'block', marginBottom: '0.25rem' }}>{c.name}</span>
                <span style={{
                  fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 500,
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted,
                }}>{c.cat}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Solutions</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                One platform.{' '}
                <span style={{ color: T.accentDim }}>Every governed use case.</span>
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {SOLUTIONS.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.06}>
                <Card>
                  <h3 style={{
                    fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.015em',
                    color: T.text, margin: '0 0 0.75rem', fontFamily: T.display,
                  }}>{s.title}</h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{s.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Domain Packs</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                One agentic layer.{' '}
                <span style={{ color: T.accentDim }}>Every governed domain.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                Each vertical runs on the same seven governing principles — from Ingest to Learn —
                with domain-specific intelligence applied at the context layer.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {VERTICALS.map((v, i) => (
              <FadeIn key={v.name} delay={i * 0.06}>
                <Card>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>{v.icon}</span>
                  <p style={{
                    fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: T.accentDim, marginBottom: '0.625rem',
                  }}>{v.domain}</p>
                  <h3 style={{
                    fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.015em',
                    color: T.text, margin: '0 0 0.75rem', fontFamily: T.display,
                  }}>{v.name}</h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{v.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Model Hub</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                Every model.{' '}
                <span style={{ color: T.accentDim }}>One governance layer.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                a11oy routes requests to the right model — frontier reasoning,
                open-weight efficiency, or domain specialists — with full proof-chain attribution
                on every inference.
              </p>
            </div>
          </FadeIn>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
          }}>
            {MODEL_PROVIDERS.map((m, i) => (
              <FadeIn key={m.name} delay={i * 0.05}>
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: T.display }}>{m.name}</h3>
                    <span style={{
                      fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      padding: '0.2rem 0.5rem', borderRadius: 6,
                      color: m.tier === 'frontier' ? T.accentDim : T.textMuted,
                      background: m.tier === 'frontier' ? T.accentSoft : T.bg,
                      border: `1px solid ${m.tier === 'frontier' ? T.accentBorder : T.borderSubtle}`,
                    }}>{m.tier}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                    {m.models.map(model => (
                      <span key={model} style={{
                        fontSize: '0.6875rem', fontFamily: T.mono,
                        padding: '0.25rem 0.5rem', borderRadius: 6,
                        background: T.bg, color: T.textDim,
                        border: `1px solid ${T.borderSubtle}`,
                      }}>{model}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{m.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 640 }}>
              <SectionLabel>Industry Solutions</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                One governed loop.{' '}
                <span style={{ color: T.accentDim }}>Every industry.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                Other platforms give you a chatbot. a11oy gives you a governed decision operating system — the same
                nine-stage canonical loop applied across every vertical.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {INDUSTRY_SOLUTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => { setActiveIndustry(s.id); setExpandedUseCase(null); }}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 8,
                  border: `1px solid ${activeIndustry === s.id ? T.accent : T.borderSubtle}`,
                  background: activeIndustry === s.id ? T.accentSoft : T.surface,
                  color: activeIndustry === s.id ? T.accentDim : T.textDim,
                  fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  transition: 'all 0.2s ease', fontFamily: T.sans,
                }}
              >
                <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                {s.name}
              </button>
            ))}
          </div>

          <motion.div
            key={activeSolution.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <div style={{ border: `1px solid ${T.borderSubtle}`, borderRadius: 14, overflow: 'hidden', marginBottom: '2rem', background: T.surface }}>
              <div style={{ padding: '2rem', borderBottom: `1px solid ${T.borderSubtle}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>{activeSolution.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: T.text, margin: 0, letterSpacing: '-0.02em', fontFamily: T.display }}>{activeSolution.name}</h3>
                    <p style={{ fontSize: '0.8125rem', color: T.accentDim, margin: 0, fontWeight: 500 }}>{activeSolution.tagline}</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: T.textDim, margin: '0 0 1rem', maxWidth: '72ch' }}>{activeSolution.desc}</p>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {activeSolution.models.map(m => (
                    <span key={m} style={{
                      fontSize: '0.6875rem', fontFamily: T.mono, padding: '0.25rem 0.5rem', borderRadius: 6,
                      background: T.accentSoft, color: T.accentDim, border: `1px solid ${T.accentBorder}`,
                    }}>{m}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: T.borderSubtle }}>
                {activeSolution.stats.map(s => (
                  <div key={s.label} style={{ padding: '1.25rem', background: T.surface }}>
                    <p style={{ fontSize: '1.375rem', fontWeight: 600, color: T.text, margin: '0 0 0.25rem', fontFamily: T.mono }}>{s.value}</p>
                    <p style={{ fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 0.75rem' }}>
                Governed Use Cases
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
                {activeSolution.useCases.map((uc, i) => {
                  const key = `${activeSolution.id}-${i}`;
                  const isExpanded = expandedUseCase === key;
                  return (
                    <div key={key}
                      onClick={() => setExpandedUseCase(isExpanded ? null : key)}
                      style={{
                        padding: '1.25rem', borderRadius: 12, cursor: 'pointer',
                        border: `1px solid ${isExpanded ? T.accentBorder : T.borderSubtle}`,
                        background: isExpanded ? T.accentSoft : T.surface,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>{uc.title}</h4>
                        <span style={{ fontSize: '0.75rem', color: T.textMuted, flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>&#9660;</span>
                      </div>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.25 }}>
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 8, background: T.bg, border: `1px solid ${T.borderSubtle}` }}>
                            <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.accentDim, margin: '0 0 0.375rem' }}>Prompt</p>
                            <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.textDim, margin: 0, fontStyle: 'italic' }}>"{uc.prompt}"</p>
                          </div>
                          <div style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: 8, background: T.accentSoft, border: `1px solid ${T.accentBorder}` }}>
                            <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.accentDim, margin: '0 0 0.375rem' }}>Proof Chain</p>
                            <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.textDim, margin: 0 }}>{uc.proof}</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 640 }}>
              <SectionLabel>The Canonical Loop</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                Nine stages.{' '}
                <span style={{ color: T.accentDim }}>One canonical path.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                While others offer chat windows, a11oy enforces the governed Decision Loop —
                from signal detection to real-world outcome, with immutable proof at every stage.
              </p>
            </div>
          </FadeIn>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '0.75rem', marginBottom: '2.5rem',
          }}>
            {CANONICAL_STEPS.map((step, i) => (
              <FadeIn key={step.name} delay={i * 0.04}>
                <Card style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{step.icon}</span>
                    <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.12em', color: T.textMuted }}>{step.num}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: T.text, letterSpacing: '-0.01em', fontFamily: T.display }}>{step.name}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{step.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <Card style={{ padding: '2rem' }}>
              <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.accentDim, margin: '0 0 1rem' }}>
                Live Example — {activeSolution.icon} {activeSolution.name}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {Object.entries(activeSolution.loopExample).map(([stage, text], i) => (
                  <div key={stage} style={{
                    display: 'flex', gap: '1rem', padding: '0.875rem 0',
                    borderBottom: i < 8 ? `1px solid ${T.borderSubtle}` : 'none',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 140, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.875rem' }}>{CANONICAL_STEPS[i]?.icon}</span>
                      <span style={{
                        fontSize: '0.6875rem', fontFamily: T.mono, fontWeight: 600,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: stage === 'proof' ? T.accentDim : T.text,
                      }}>{stage}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <SectionLabel>Why a11oy</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                Not a copilot.{' '}
                <span style={{ color: T.accentDim }}>A governed operating system.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: '0 auto', maxWidth: '58ch' }}>
                Chatbots answer questions. a11oy governs decisions. Every model call is attributed.
                Every action is proof-chained. Every outcome feeds back to calibrate the next cycle.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { title: 'Proof on Every Decision', desc: 'Immutable, append-only record of every model call, every approval, every outcome. Cryptographically verifiable. Auditor-ready.' },
              { title: '8 Model Providers, One Router', desc: 'OpenAI, Anthropic, DeepSeek, Google, Qwen, Meta, Moonshot, HuggingFace — routed by task type, vertical, cost, and compliance policy.' },
              { title: 'Policy Gates, Not Guardrails', desc: 'Covenant policies enforce who can approve, when, under what conditions. Not optional safety warnings — mandatory governance gates.' },
              { title: 'Outcomes Close the Loop', desc: 'The Outcome Graph records what actually happened and compares it to the recommendation. Models recalibrate. The system evolves.' },
              { title: 'Durable Execution', desc: 'Checkpoint recovery, agent coordination, human-in-the-loop handoffs. Not a stateless API call — a governed, durable workflow.' },
              { title: '7 Industry Verticals', desc: 'Finance, Science, Engineering, Legal, Maritime, Real Estate, Defense. Same canonical loop. Domain-specific intelligence.' },
              { title: 'Glasswing Transparency', desc: 'Public trust portal, CAVD coordinated disclosure, 90-day transparency reports, adversarial robustness wall. Every governance claim backed by a verifiable open-spec artifact.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.05}>
                <Card>
                  <h3 style={{
                    fontSize: '1rem', fontWeight: 600, color: T.text, margin: '0 0 0.75rem',
                    letterSpacing: '-0.01em', fontFamily: T.display,
                  }}>{item.title}</h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>{item.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(3rem, 6vw, 6rem)', alignItems: 'start' }}>
              <div>
                <SectionLabel>Publication</SectionLabel>
                <h2 style={{
                  fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)', fontFamily: T.display,
                  fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                  lineHeight: 1.1, margin: '0 0 2rem',
                }}>
                  What is{' '}
                  <span style={{ color: T.accentDim }}>a11oy?</span>
                </h2>
                <div style={{ fontSize: '1.0625rem', lineHeight: 1.8, color: T.textDim }}>
                  <p style={{ margin: '0 0 1.25rem' }}>
                    a11oy is a <strong style={{ color: T.text }}>governed decision operating system</strong> — the infrastructure layer that sits between frontier AI models and real-world consequence.
                  </p>
                  <p style={{ margin: '0 0 1.25rem' }}>
                    The name comes from metallurgy: an alloy is multiple elements fused into something stronger than any single part. a11oy fuses signal intelligence, causal reasoning, policy enforcement, and cryptographic proof into one execution fabric.
                  </p>
                  <p style={{ margin: '0 0 1.25rem' }}>
                    Most AI platforms stop at recommendation. a11oy governs what happens after the recommendation — who approves the action, under what conditions, with what evidence, and how the outcome is recorded.
                  </p>
                  <p style={{ margin: 0 }}>
                    Every action carries proof. Every decision carries attribution. Every outcome feeds back into the system to make the next decision better.
                  </p>
                </div>
              </div>
              <div>
                <Card style={{ padding: '2.5rem' }}>
                  <p style={{
                    fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: T.accentDim, margin: '0 0 1.5rem',
                  }}>The Governing Principle</p>
                  <blockquote style={{
                    fontSize: '1.375rem', fontFamily: T.display, fontWeight: 500,
                    lineHeight: 1.4, color: T.text, margin: '0 0 2rem',
                    borderLeft: `3px solid ${T.accent}`, paddingLeft: '1.5rem',
                  }}>
                    No material action executes without human approval. Not as an option. Not as a feature flag. As a structural guarantee embedded in the execution fabric.
                  </blockquote>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
                    background: T.borderSubtle, borderRadius: 10, overflow: 'hidden',
                    marginBottom: '1.5rem',
                  }}>
                    {[
                      { val: '59', label: 'SDK Primitives' },
                      { val: '133', label: 'API Endpoints' },
                      { val: '7', label: 'Fabric Layers' },
                      { val: '100%', label: 'Proof Integrity' },
                    ].map(m => (
                      <div key={m.label} style={{ padding: '1rem', background: T.surface }}>
                        <p style={{ fontSize: '1.5rem', fontFamily: T.mono, fontWeight: 600, color: T.accentDim, margin: '0 0 0.25rem' }}>{m.val}</p>
                        <p style={{ fontSize: '0.5625rem', fontFamily: T.mono, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, margin: 0 }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.textMuted, margin: 0, fontFamily: T.mono }}>
                    SZL Holdings &middot; Est. 2023 &middot; London
                  </p>
                </Card>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 720 }}>
              <SectionLabel>Competitive Landscape</SectionLabel>
              <h2 style={{
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontFamily: T.display,
                fontWeight: 600, letterSpacing: '-0.03em', color: T.text,
                lineHeight: 1.12, margin: '0 0 1rem',
              }}>
                Beyond aggregation.{' '}
                <span style={{ color: T.accentDim }}>Into governance.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                Other platforms observe signals or automate workflows. a11oy governs the entire path from signal to consequence — with structural proof at every step.
              </p>
            </div>
          </FadeIn>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            {[
              {
                name: 'Palantir',
                category: 'Decision Intelligence',
                has: 'Enterprise data integration, analytical workflows, government credibility',
                gap: 'Governance is proprietary and opaque. No open SDK. No developer primitives for proof or policy.',
              },
              {
                name: 'Datadog / New Relic',
                category: 'Technical Observability',
                has: 'APM, logging, metrics, distributed tracing for infrastructure',
                gap: 'Observes technical systems, not business decisions. No governance layer, no proof chain, no policy enforcement.',
              },
              {
                name: 'ServiceNow',
                category: 'Workflow Automation',
                has: 'Enterprise workflow automation, ITSM, AI-assisted operations',
                gap: 'Executes workflows but carries no proof of why a workflow executed. No immutable audit trail connecting signal to outcome.',
              },
              {
                name: 'BOSS Technology',
                category: 'Business Observability',
                has: 'Signal aggregation, business observability concept, real-time data unification',
                gap: 'Stops at aggregation. Does not govern what happens after data is aggregated. No policy engine, no proof chain.',
              },
              {
                name: 'OpenAI / LangChain',
                category: 'Agent Frameworks',
                has: 'Agent building blocks, tool calling, memory, handoffs, multi-agent coordination',
                gap: 'Builds the engine. Does not govern the engine. No structural enforcement that prevents agents from executing material actions without approval.',
              },
              {
                name: 'a11oy',
                category: 'Governed Execution',
                has: 'Full stack: signal ingestion, causal reasoning, governed orchestration, cryptographic proof, alignment monitoring, 7 enterprise verticals. Glasswing distinction layer — CAVD coordinated disclosure, public trust portal, 90-day transparency, adversarial robustness wall, constitution-as-code DSL.',
                gap: '',
              },
            ].map((comp, i) => (
              <FadeIn key={comp.name} delay={i * 0.05}>
                <Card highlight={comp.name === 'a11oy'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <h3 style={{
                      fontSize: '1rem', fontWeight: 600, color: comp.name === 'a11oy' ? T.accentDim : T.text,
                      margin: 0, letterSpacing: '-0.01em', fontFamily: T.display,
                    }}>{comp.name}</h3>
                  </div>
                  <p style={{
                    fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: T.textMuted, margin: '0 0 0.75rem',
                  }}>{comp.category}</p>
                  <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: '0 0 0.75rem' }}>
                    {comp.has}
                  </p>
                  {comp.gap && (
                    <p style={{
                      fontSize: '0.8125rem', lineHeight: 1.65, color: T.accentDim,
                      margin: 0, marginTop: 'auto', paddingTop: '0.75rem',
                      borderTop: `1px solid ${T.borderSubtle}`,
                    }}>
                      {comp.gap}
                    </p>
                  )}
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(7rem, 14vw, 12rem) 0', borderTop: `1px solid ${T.borderSubtle}`, background: T.surface }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <FadeIn>
            <SectionLabel>See it in motion</SectionLabel>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontFamily: T.display, fontWeight: 600,
              letterSpacing: '-0.03em', color: T.text,
              lineHeight: 1.08, margin: '0 0 1.5rem',
            }}>
              Watch the loop{' '}
              <span style={{ color: T.accentDim }}>close.</span>
            </h2>
            <p style={{
              fontSize: '1.125rem', lineHeight: 1.75,
              color: T.textDim, maxWidth: '46ch', margin: '0 auto 2.5rem',
            }}>
              A guided walk-through of a single decision — from signal capture to executed outcome,
              with the proof chain visible at every step.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={b('/investor-demo')} style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.875rem 2rem', background: T.text, color: T.bg,
                borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}>Request access</Link>
              <Link href={b('/proof')} style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.875rem 2rem', background: T.surface, color: T.text,
                border: `1px solid ${T.borderStrong}`, borderRadius: 10,
                fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
              }}>Browse Proof Ledger</Link>
              <Link href={b('/sdk')} style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.875rem 2rem', background: T.accentSoft, color: T.accentDim,
                border: `1px solid ${T.accentBorder}`, borderRadius: 10,
                fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
              }}>SDK & Cookbook</Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <A11oyGovernancePanels />

      <footer style={{ borderTop: `1px solid ${T.borderSubtle}`, padding: '4rem clamp(2rem, 5vw, 4rem)', background: T.bg }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, border: `1.5px solid ${T.accent}`,
                borderRadius: 5, fontSize: 11, fontFamily: T.mono, color: T.accent, fontWeight: 700,
              }}>a</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: T.text, fontFamily: T.display }}>a11oy</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: T.textMuted, maxWidth: '32ch', lineHeight: 1.6 }}>
              Governed Decision Operating System.
              Proof on every decision that matters.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)' }}>
            {[
              { title: 'Platform', links: [{ label: 'Now Board', href: b('/now') }, { label: 'Proof Chain', href: b('/proof') }, { label: 'Governance', href: b('/governance') }, { label: 'Fabric', href: b('/fabric') }] },
              { title: 'Solutions', links: [{ label: 'Verticals', href: b('/verticals') }, { label: 'Agents', href: b('/agents') }, { label: 'Connectors', href: b('/connectors') }, { label: 'Model Router', href: b('/model-router') }] },
              { title: 'Resources', links: [{ label: 'Investor Demo', href: b('/investor-demo') }, { label: 'SDK & Cookbook', href: b('/sdk') }, { label: 'Deep Research', href: b('/deep-research') }] },
              { title: 'Trust & Policies', links: [{ label: 'Constitution', href: b('/constitution') }, { label: 'Security & Compliance', href: b('/security-compliance') }, { label: 'Right to Audit', href: b('/right-to-audit') }, { label: 'Trust Center', href: b('/trust') }, { label: 'Public Trust Portal', href: b('/trust-portal') }, { label: '90-Day Report', href: b('/transparency-report') }] },
            ].map(col => (
              <div key={col.title}>
                <p style={{
                  fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: T.textMuted, marginBottom: '0.75rem',
                }}>{col.title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {col.links.map(link => (
                    <Link key={link.label} href={link.href} style={{
                      fontSize: '0.8125rem', color: T.textDim, textDecoration: 'none',
                    }}>{link.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1320, margin: '3rem auto 0', paddingTop: '2rem', borderTop: `1px solid ${T.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: T.textMuted }}>
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </span>
          <span style={{ fontSize: '0.6875rem', fontFamily: T.mono, color: T.textMuted }}>
            Built on a11oy
          </span>
        </div>
      </footer>

    </div>
  );
}
