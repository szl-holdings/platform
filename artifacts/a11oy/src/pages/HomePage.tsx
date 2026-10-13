import { motion } from 'framer-motion';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { Link } from 'wouter';
import { SEVEN_PRINCIPLES } from '../data/blueprint';
import { CANONICAL_STEPS, INDUSTRY_SOLUTIONS } from '../data/solutionsData';
import { useAlloyDashboard } from '../graphql';

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.045)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  // Small labels use this token extensively; keep it above WCAG AA contrast
  // against both the page background and translucent surface cards.
  textMuted: '#828282',
  accent: '#c9b787',
  accentDim: 'rgba(201,183,135,0.15)',
  accentGlow: 'rgba(201,183,135,0.06)',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (path: string) => (path === '/' ? `${BASE}/` : `${BASE}${path}`);

const CAPABILITIES = [
  {
    icon: 'S',
    title: 'Signal Intelligence',
    sub: "Like Claude's analysis — but governed",
    desc: 'Candidate ingestion contracts cover market feeds, telemetry, documents, and webhooks. Each source still requires explicit attribution and runtime qualification.',
    features: [
      'Ingestion contract',
      'Multi-source fusion',
      'Anomaly detection',
      'Signal attribution',
    ],
  },
  {
    icon: 'G',
    title: 'Governed Agents',
    sub: 'Candidate agent workflows with explicit proof boundaries',
    desc: 'The prototype demonstrates planning, policy, approval, and evidence contracts. Production execution remains held unless its live policy, workflow, tenant, and durable evidence dependencies are admitted.',
    features: ['Policy contract', 'Workflow design', 'Human-in-the-loop', 'Evidence boundary'],
  },
  {
    icon: 'E',
    title: 'Enterprise Connectors',
    sub: 'MCP-oriented connector catalogue',
    desc: 'Explore 24 named connector examples in this interface. A listed name is not evidence of a configured, authorized, or production-admitted integration.',
    features: ['24 catalogue examples', 'MCP-oriented', 'Admission required', 'Tenant boundary'],
  },
  {
    icon: 'P',
    title: 'Proof Chain',
    sub: 'Target evidence contract',
    desc: 'The interface demonstrates the fields a durable proof record must carry. Current local fixtures and process-local stores are not immutable, production evidence or cryptographic attestations.',
    features: [
      'Deterministic fixtures',
      'Durability required',
      'Signing required',
      'Independent verification required',
    ],
  },
];

const ALLOY_CHARS = [
  {
    ch: 'a',
    word: 'Attribution',
    desc: 'The target contract attributes proposer, approver, evidence, and model; candidate runtimes must prove those fields before promotion.',
  },
  {
    ch: '1',
    word: 'One Decision Loop',
    desc: 'Signal, Context, Recommendation, Simulation, Policy, Execution, Proof, Outcome, Learning — the single canonical path.',
  },
  {
    ch: '1',
    word: 'One Proof Chain',
    desc: 'Target: durable, append-only, tenant-bound records. The current prototype does not claim that production property.',
  },
  {
    ch: 'o',
    word: 'Orchestration',
    desc: 'Target: durable multi-step execution with checkpoint recovery, coordination, and policy gates; current candidate services remain held without durable infrastructure.',
  },
  {
    ch: 'y',
    word: 'Yield',
    desc: 'The Outcome Graph closes the loop — recording the real-world consequence and feeding it back to calibrate future confidence.',
  },
];

const PRIMITIVES = [
  {
    name: 'Decision Loop',
    num: '01',
    desc: 'Nine canonical stages from signal to outcome. Detection, recommendation, simulation, policy, execution, proof, outcome, learning.',
  },
  {
    name: 'Proof Chain',
    num: '02',
    desc: 'Target contract for durable, signed, queryable records; current demo fixtures are explicitly non-authoritative.',
  },
  {
    name: 'Covenant Policy',
    num: '03',
    desc: 'Policy-as-code contract for approvals and execution. Production use requires a live policy engine and fail-closed runtime admission.',
  },
  {
    name: 'Outcome Graph',
    num: '04',
    desc: 'Closes the loop. Records the real-world consequence of each decision and feeds the result back to calibrate future confidence.',
  },
  {
    name: 'Hatun Doctrine',
    num: '05',
    desc: 'Frontier-grade alignment governance — versioned constitutions, behavioral audit, reward-hacking watchdog, red-team probes, agent welfare telemetry, and per-agent system cards. Open Spec (CC-BY-4.0).',
  },
  {
    name: 'Glasswing Layer',
    num: '06',
    desc: 'Transparency-first partner program — 4-stage cyber verification, CAVD coordinated disclosure, 90-day public transparency reports, Constitution-as-Code DSL, adversarial robustness wall, and welfare intervention playbooks.',
  },
  {
    name: 'Compliance Fabric',
    num: '07',
    desc: 'Candidate control mappings for EU AI Act, NIST AI RMF, ISO 42001, and CSA Agentic Profile, plus demo Compass, Agent-BOM, delegation, trust-exchange, and CARE surfaces. These are not certifications.',
  },
];

const VERTICALS = [
  {
    name: 'Vessels',
    desc: 'Maritime fleet intelligence — positions, voyage economics, compliance, exceptions.',
    domain: 'Maritime',
    icon: '\u2693',
  },
  {
    name: 'Counsel',
    desc: 'Legal matter lifecycle — filings, obligations, risk scoring, document intelligence.',
    domain: 'Legal',
    icon: '\u2696',
  },
  {
    name: 'Terra',
    desc: 'Real estate portfolio intelligence — valuations, climate risk, deal pipeline, analytics.',
    domain: 'Real Estate',
    icon: '\u{1F3D7}',
  },
  {
    name: 'Aegis',
    desc: 'Security and defense — threat detection, incident response, compliance posture, resilience.',
    domain: 'Security',
    icon: '\u{1F6E1}',
  },
];

const MODEL_PROVIDERS = [
  'Anthropic',
  'OpenAI',
  'DeepSeek',
  'Google',
  'Qwen',
  'Meta',
  'Moonshot',
  'HuggingFace',
].map((name) => ({
  name,
  models: ['No model admitted in this candidate'],
  tier: 'catalogue target',
  desc: 'Registry placeholder only. Access, exact model identity, licensing, task suitability, safety posture, and execution receipts require deployment-specific qualification.',
}));

const CONNECTORS = [
  { name: 'Salesforce', cat: 'CRM' },
  { name: 'HubSpot', cat: 'CRM' },
  { name: 'Slack', cat: 'Communication' },
  { name: 'Microsoft Teams', cat: 'Communication' },
  { name: 'Jira', cat: 'Project Mgmt' },
  { name: 'Linear', cat: 'Project Mgmt' },
  { name: 'GitHub', cat: 'Engineering' },
  { name: 'GitLab', cat: 'Engineering' },
  { name: 'Snowflake', cat: 'Data' },
  { name: 'BigQuery', cat: 'Data' },
  { name: 'PostgreSQL', cat: 'Database' },
  { name: 'MongoDB', cat: 'Database' },
  { name: 'AWS S3', cat: 'Cloud' },
  { name: 'Azure Blob', cat: 'Cloud' },
  { name: 'Google Sheets', cat: 'Productivity' },
  { name: 'Notion', cat: 'Productivity' },
  { name: 'Stripe', cat: 'Payments' },
  { name: 'Bloomberg', cat: 'Finance' },
  { name: 'Datadog', cat: 'Observability' },
  { name: 'PagerDuty', cat: 'Ops' },
  { name: 'ServiceNow', cat: 'ITSM' },
  { name: 'Workday', cat: 'HR' },
  { name: 'SAP', cat: 'ERP' },
  { name: 'NetSuite', cat: 'ERP' },
];

const SOLUTIONS = [
  {
    title: 'Governed AI Agents',
    desc: 'Prototype agent flows with explicit policy, approval, outcome, and production-admission boundaries.',
  },
  {
    title: 'Code Modernization',
    desc: 'Candidate modernization workflow with reviewable diffs and evidence fields; no integrity guarantee is made without workload-specific verification.',
  },
  {
    title: 'Financial Intelligence',
    desc: 'Candidate portfolio, risk, and filing workflows with an explicit attribution requirement.',
  },
  {
    title: 'Legal Operations',
    desc: 'Candidate matter, contract, and compliance workflows with reviewable evidence requirements.',
  },
  {
    title: 'Security & Defense',
    desc: 'Threat detection, incident response, MITRE ATT&CK mapping — governed and accountable.',
  },
  {
    title: 'Maritime Intelligence',
    desc: 'Candidate fleet, voyage, and sanctions workflows with source and evidence requirements.',
  },
];

function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, delay, ease }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: '0.6875rem',
        fontFamily: T.mono,
        fontWeight: 500,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: T.textMuted,
        margin: '0 0 1.75rem',
      }}
    >
      {children}
    </p>
  );
}

function HeroArt() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 500 500"
      fill="none"
      style={{ width: '100%', maxWidth: 480, opacity: 0.9 }}
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={T.accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="250" cy="250" r="200" fill="url(#glow)" />
      <circle cx="250" cy="250" r="160" stroke={T.border} strokeWidth="0.5" fill="none" />
      <circle cx="250" cy="250" r="120" stroke={T.border} strokeWidth="0.5" fill="none" />
      <circle
        cx="250"
        cy="250"
        r="80"
        stroke="rgba(201,183,135,0.2)"
        strokeWidth="0.5"
        fill="none"
      />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const r1 = 80,
          r2 = 160;
        const x1 = 250 + r1 * Math.cos((angle * Math.PI) / 180);
        const y1 = 250 + r1 * Math.sin((angle * Math.PI) / 180);
        const x2 = 250 + r2 * Math.cos((angle * Math.PI) / 180);
        const y2 = 250 + r2 * Math.sin((angle * Math.PI) / 180);
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(201,183,135,0.12)"
            strokeWidth="0.5"
          />
        );
      })}
      {[0, 72, 144, 216, 288].map((angle) => {
        const r = 120;
        const cx = 250 + r * Math.cos((angle * Math.PI) / 180);
        const cy = 250 + r * Math.sin((angle * Math.PI) / 180);
        return <circle key={angle} cx={cx} cy={cy} r="4" fill={T.accent} opacity="0.6" />;
      })}
      <circle cx="250" cy="250" r="6" fill={T.accent} opacity="0.9" />
      {[30, 90, 150, 210, 270, 330].map((angle) => {
        const r = 160;
        const cx = 250 + r * Math.cos((angle * Math.PI) / 180);
        const cy = 250 + r * Math.sin((angle * Math.PI) / 180);
        return (
          <circle key={`outer-${angle}`} cx={cx} cy={cy} r="2.5" fill={T.textMuted} opacity="0.4" />
        );
      })}
      <text
        x="250"
        y="254"
        textAnchor="middle"
        fill={T.text}
        fontSize="14"
        fontFamily={T.mono}
        opacity="0.5"
      >
        a11oy
      </text>
    </svg>
  );
}

function CommandPrompt() {
  const [text, setText] = useState('');
  const placeholder = 'What decision needs governing?';

  return (
    <fieldset
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1.25rem',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${T.border}`,
        maxWidth: 520,
        width: '100%',
        margin: 0,
        minWidth: 0,
        transition: 'border-color 0.3s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(201,183,135,0.3)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = T.border;
      }}
    >
      <legend className="sr-only">Governed command prompt</legend>
      <label htmlFor="a11oy-command" className="sr-only">
        Command prompt
      </label>
      <span
        style={{ color: T.accent, fontSize: '0.875rem', fontFamily: T.mono, flexShrink: 0 }}
        aria-hidden="true"
      >
        {'>'}
      </span>
      <input
        id="a11oy-command"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          color: T.text,
          fontSize: '0.9375rem',
          fontFamily: T.sans,
        }}
      />
      <Link
        href={b('/agent-viz')}
        style={{
          padding: '0.5rem 1.125rem',
          background: T.accent,
          color: T.bg,
          borderRadius: 8,
          fontSize: '0.8125rem',
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}
      >
        Explore fixture
      </Link>
    </fieldset>
  );
}

function RuntimeSampleStrip() {
  const { data: dashboard } = useAlloyDashboard();
  if (!dashboard) return null;
  const stats = [
    { label: 'Workflows', value: String(dashboard.totalWorkflows) },
    { label: 'Running', value: String(dashboard.runningRuns) },
    { label: 'Success', value: `${Math.round(dashboard.successRate * 100)}%` },
    { label: 'Approvals', value: String(dashboard.pendingApprovals) },
    {
      label: 'Avg Duration',
      value: dashboard.avgDurationMs ? `${Math.round(dashboard.avgDurationMs / 1000)}s` : '—',
    },
  ];
  return (
    <section
      style={{
        padding: '1.25rem 0',
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#c9b787',
                display: 'inline-block',
                animation: 'pulse 2s infinite',
              }}
            />
            <span
              style={{
                fontSize: '0.5625rem',
                fontFamily: T.mono,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: T.accent,
              }}
            >
              CONNECTED SAMPLE · SOURCE MUST BE VERIFIED
            </span>
          </div>
          {stats.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
              <span
                style={{ fontSize: '1rem', fontWeight: 600, fontFamily: T.mono, color: T.text }}
              >
                {s.value}
              </span>
              <span
                style={{
                  fontSize: '0.5625rem',
                  fontFamily: T.mono,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.textMuted,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const [activeIndustry, setActiveIndustry] = useState(INDUSTRY_SOLUTIONS[0].id);
  const [expandedUseCase, setExpandedUseCase] = useState<string | null>(null);
  const activeSolution =
    INDUSTRY_SOLUTIONS.find((s) => s.id === activeIndustry) ?? INDUSTRY_SOLUTIONS[0];
  const [connectorFilter, setConnectorFilter] = useState('All');
  const connectorCats = ['All', ...Array.from(new Set(CONNECTORS.map((c) => c.cat)))];
  const filteredConnectors =
    connectorFilter === 'All' ? CONNECTORS : CONNECTORS.filter((c) => c.cat === connectorFilter);

  return (
    <div
      id="main-content"
      tabIndex={-1}
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: T.sans,
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
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1.5rem, 5vw, 4rem)',
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <Link
          href={b('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              border: `1.5px solid ${T.accent}`,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: T.mono,
              color: T.accent,
              fontWeight: 600,
            }}
          >
            a
          </span>
          <span
            style={{ fontSize: '1rem', fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}
          >
            a11oy
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.25rem' }}>
          {[
            { label: 'Agent visualization', href: b('/agent-viz') },
            { label: 'Stress test', href: b('/adversarial') },
            { label: 'Positioning UI', href: b('/frontier') },
            { label: 'Verifier', href: b('/verifier') },
            { label: 'Security agents', href: b('/security-agents') },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              style={{
                fontSize: '0.8125rem',
                color: T.textDim,
                textDecoration: 'none',
                letterSpacing: '-0.005em',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={b('/agent-viz')}
            style={{
              padding: '0.45rem 1.125rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: T.bg,
              background: T.text,
              borderRadius: 8,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Explore fixtures
          </Link>
        </div>
      </nav>

      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(8rem, 14vh, 12rem) clamp(2rem, 6vw, 5rem) clamp(5rem, 10vh, 8rem)',
        }}
      >
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0, opacity: 0.25 }}
          >
            <defs>
              <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="rgba(255,255,255,0.015)"
                  strokeWidth="0.5"
                />
              </pattern>
              <radialGradient id="grid-fade" cx="0.3" cy="0.4" r="0.6">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              <mask id="grid-mask">
                <rect width="100%" height="100%" fill="url(#grid-fade)" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" mask="url(#grid-mask)" />
          </svg>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 0.7fr',
            gap: 'clamp(3rem, 6vw, 6rem)',
            alignItems: 'center',
            maxWidth: 1320,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div>
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
                marginBottom: '2.5rem',
              }}
            >
              CANDIDATE PROTOTYPE · NOT PRODUCTION-ADMITTED
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease }}
              style={{
                fontSize: 'clamp(3rem, 6.5vw, 5.5rem)',
                fontFamily: T.serif,
                fontWeight: 400,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: T.text,
                margin: '0 0 2rem',
              }}
            >
              Governed intelligence{'\n'}
              <span style={{ color: T.accent }}>your unfair</span> advantage
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease }}
              style={{
                fontSize: 'clamp(1.0625rem, 1.4vw, 1.1875rem)',
                lineHeight: 1.7,
                color: T.textDim,
                maxWidth: '48ch',
                margin: '0 0 2.5rem',
              }}
            >
              This interface demonstrates a governed decision loop across signals, models, tools,
              workflows, approvals, and evidence. Production execution, durable state, and signed
              proof remain unavailable until each dependency passes its admission and verification
              gate.
            </motion.p>

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
              {['Ingest', 'Understand', 'Plan', 'Act', 'Verify', 'Audit', 'Learn', 'Doctrine'].map(
                (chip) => (
                  <span
                    key={chip}
                    style={{
                      padding: '0.4rem 0.875rem',
                      borderRadius: 8,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${T.border}`,
                      color: T.textDim,
                      cursor: 'default',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {chip}
                  </span>
                ),
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <HeroArt />
          </motion.div>
        </div>
      </section>

      <section
        style={{
          padding: '4rem 0',
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <p
            style={{
              fontSize: '0.625rem',
              fontFamily: T.mono,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.textMuted,
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            Provider families represented in the routing design · availability is not implied
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(2rem, 5vw, 4rem)',
              flexWrap: 'wrap',
              opacity: 0.7,
            }}
          >
            {['OpenAI', 'Anthropic', 'DeepSeek', 'Google', 'Meta', 'Qwen', 'HuggingFace'].map(
              (name) => (
                <span
                  key={name}
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: T.text,
                    letterSpacing: '-0.01em',
                    fontFamily: T.sans,
                  }}
                >
                  {name}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      <RuntimeSampleStrip />

      <section style={{ padding: 'clamp(7rem, 14vw, 12rem) 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <FadeIn>
            <SectionLabel>Premise</SectionLabel>
            <h2
              style={{
                fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
                fontFamily: T.serif,
                fontWeight: 400,
                letterSpacing: '-0.03em',
                color: T.text,
                lineHeight: 1.1,
                margin: '0 0 2rem',
              }}
            >
              The enterprise does not need{' '}
              <span style={{ color: T.accent }}>another dashboard.</span>
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: 1.75,
                color: T.textDim,
                maxWidth: '52ch',
                margin: '0 auto',
              }}
            >
              It needs a system that can attribute signals, propose governed responses, require
              human approval where policy demands it, and preserve independently verifiable
              evidence. This prototype demonstrates that contract, not a production guarantee.
            </p>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem' }}>
              <SectionLabel>Seven Governing Principles</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                From signal to outcome.{' '}
                <span style={{ color: T.accent }}>Seven steps. One proof.</span>
              </h2>
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.7,
                  color: T.textDim,
                  maxWidth: '60ch',
                  margin: 0,
                }}
              >
                The prototype organizes candidate actions around seven governing principles — a
                reviewable lifecycle whose production guarantees depend on admitted runtimes.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {SEVEN_PRINCIPLES.map((p, i) => (
              <FadeIn key={p.label} delay={i * 0.05}>
                <div
                  style={{
                    padding: '2rem 1.5rem',
                    background: T.bg,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span
                      style={{
                        fontSize: '1.25rem',
                        color: T.accent,
                        lineHeight: 1,
                        fontFamily: T.mono,
                      }}
                    >
                      {p.glyph}
                    </span>
                    <span
                      style={{
                        fontSize: '0.5625rem',
                        fontFamily: T.mono,
                        fontWeight: 600,
                        letterSpacing: '0.16em',
                        color: T.textMuted,
                      }}
                    >
                      {p.step}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      color: T.text,
                      margin: 0,
                    }}
                  >
                    {p.label}
                  </h3>
                  <p
                    style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}
                  >
                    {p.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '4rem', maxWidth: 640 }}>
              <SectionLabel>Core Capabilities</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1.25rem',
                }}
              >
                Governed intelligence.{' '}
                <span style={{ color: T.accent }}>Inspectable boundaries.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                The candidate brings signal, agent, connector, policy, and evidence contracts into
                one reviewable interface. It does not claim immutable production proof today.
              </p>
            </div>
          </FadeIn>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {CAPABILITIES.map((cap, i) => (
              <FadeIn key={cap.title} delay={i * 0.08}>
                <div
                  style={{
                    padding: 'clamp(2rem, 3vw, 3rem)',
                    background: T.bg,
                    height: '100%',
                    transition: 'background 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: T.accentGlow,
                      border: `1px solid ${T.accentDim}`,
                      fontSize: '1.125rem',
                      fontFamily: T.serif,
                      fontWeight: 400,
                      color: T.accent,
                      marginBottom: '1.5rem',
                    }}
                  >
                    {cap.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: T.text,
                      margin: '0 0 0.375rem',
                    }}
                  >
                    {cap.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: T.mono,
                      fontWeight: 500,
                      color: T.accent,
                      margin: '0 0 1rem',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {cap.sub}
                  </p>
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      lineHeight: 1.7,
                      color: T.textDim,
                      margin: '0 0 1.5rem',
                    }}
                  >
                    {cap.desc}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {cap.features.map((f) => (
                      <span
                        key={f}
                        style={{
                          fontSize: '0.6875rem',
                          fontFamily: T.mono,
                          padding: '0.25rem 0.625rem',
                          borderRadius: 6,
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${T.border}`,
                          color: T.textDim,
                        }}
                      >
                        {f}
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
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '4rem', maxWidth: 640 }}>
              <SectionLabel>Each character carries weight</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                What a11oy means.
              </h2>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '1px',
              background: T.border,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {ALLOY_CHARS.map((c, i) => (
              <FadeIn key={`${c.ch}-${c.word}`} delay={i * 0.06}>
                <div style={{ background: T.bg, padding: '2.5rem 1.5rem', height: '100%' }}>
                  <div
                    style={{
                      fontSize: '2.75rem',
                      fontWeight: 300,
                      fontFamily: T.serif,
                      color: T.text,
                      lineHeight: 1,
                      marginBottom: '1.5rem',
                    }}
                  >
                    {c.ch}
                  </div>
                  <p
                    style={{
                      fontSize: '0.5625rem',
                      fontFamily: T.mono,
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: T.accent,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {c.word}
                  </p>
                  <p
                    style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}
                  >
                    {c.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Platform Primitives</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Four governed objects. <span style={{ color: T.accent }}>One coherent system.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                Candidate actions are modeled through the same primitives — building blocks for
                reproducibility, auditability, and improvement once their runtime dependencies are
                admitted.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {PRIMITIVES.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.07}>
                <div style={{ padding: '2.5rem', background: T.bg, height: '100%' }}>
                  <p
                    style={{
                      fontSize: '0.625rem',
                      fontFamily: T.mono,
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      color: T.textMuted,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {p.num}
                  </p>
                  <h3
                    style={{
                      fontSize: '1.1875rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: T.text,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {p.name}
                  </h3>
                  <p
                    style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}
                  >
                    {p.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
              <SectionLabel>Enterprise Connectors</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Connect a11oy to <span style={{ color: T.accent }}>your entire stack.</span>
              </h2>
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.7,
                  color: T.textDim,
                  margin: '0 auto',
                  maxWidth: '56ch',
                }}
              >
                This catalogue contains {CONNECTORS.length} named examples organized for an MCP
                integration path. Each connector needs separate credentials, authorization, tenant
                isolation, runtime tests, and evidence admission before it is called live.
              </p>
            </div>
          </FadeIn>

          <div
            style={{
              display: 'flex',
              gap: '0.375rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '2rem',
            }}
          >
            {connectorCats.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setConnectorFilter(cat)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 6,
                  border: `1px solid ${connectorFilter === cat ? T.accent : T.border}`,
                  background: connectorFilter === cat ? T.accentGlow : 'transparent',
                  color: connectorFilter === cat ? T.accent : T.textDim,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: T.sans,
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {filteredConnectors.map((c) => (
              <div
                key={c.name}
                style={{
                  padding: '1.25rem',
                  background: T.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                  transition: 'background 0.2s',
                }}
              >
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: T.text,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {c.name}
                </span>
                <span
                  style={{
                    fontSize: '0.5625rem',
                    fontFamily: T.mono,
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: T.textMuted,
                  }}
                >
                  {c.cat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Solutions</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                One candidate platform.{' '}
                <span style={{ color: T.accent }}>Reviewable use cases.</span>
              </h2>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {SOLUTIONS.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.06}>
                <div style={{ padding: '2.25rem', background: T.bg, height: '100%' }}>
                  <h3
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      color: T.text,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{ fontSize: '0.875rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}
                  >
                    {s.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Domain Packs</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                One candidate layer. <span style={{ color: T.accent }}>Seven design domains.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                Each vertical runs on the same seven governing principles — from Ingest to Learn —
                with domain-specific intelligence applied at the context layer. Twelve applications
                across maritime, legal, real estate, defense, and more.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {VERTICALS.map((v, i) => (
              <FadeIn key={v.name} delay={i * 0.06}>
                <div style={{ padding: '2.25rem', background: T.bg, height: '100%' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>
                    {v.icon}
                  </span>
                  <p
                    style={{
                      fontSize: '0.5625rem',
                      fontFamily: T.mono,
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: T.accent,
                      marginBottom: '0.625rem',
                    }}
                  >
                    {v.domain}
                  </p>
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      color: T.text,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {v.name}
                  </h3>
                  <p
                    style={{ fontSize: '0.875rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}
                  >
                    {v.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 640 }}>
              <SectionLabel>Model Hub</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Provider catalogue. <span style={{ color: T.accent }}>One admission contract.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                The router design selects among frontier, open-weight, and domain candidates. A
                provider is usable only after access, model identity, policy, and durable evidence
                are configured and verified.
              </p>
            </div>
          </FadeIn>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {MODEL_PROVIDERS.map((m, i) => (
              <FadeIn key={m.name} delay={i * 0.05}>
                <div
                  style={{
                    padding: '2rem',
                    background: T.bg,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.0625rem',
                        fontWeight: 600,
                        color: T.text,
                        margin: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {m.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.5625rem',
                        fontFamily: T.mono,
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        color:
                          m.tier === 'frontier'
                            ? T.accent
                            : m.tier === 'platform'
                              ? '#7ab8d9'
                              : T.textMuted,
                        background: m.tier === 'frontier' ? T.accentGlow : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${m.tier === 'frontier' ? T.accentDim : T.border}`,
                      }}
                    >
                      {m.tier}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {m.models.map((model) => (
                      <span
                        key={model}
                        style={{
                          fontSize: '0.6875rem',
                          fontFamily: T.mono,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.03)',
                          color: T.textDim,
                          border: `1px solid ${T.border}`,
                        }}
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                  <p
                    style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}
                  >
                    {m.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 640 }}>
              <SectionLabel>Industry Solutions</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                One governed-loop design. <span style={{ color: T.accent }}>Seven domains.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                Other platforms give you a chatbot. a11oy gives you a governed decision operating
                system — this prototype applies the same nine-stage contract across seven design
                verticals.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {INDUSTRY_SOLUTIONS.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setActiveIndustry(s.id);
                  setExpandedUseCase(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: `1px solid ${activeIndustry === s.id ? T.accent : T.border}`,
                  background: activeIndustry === s.id ? T.accentGlow : 'transparent',
                  color: activeIndustry === s.id ? T.accent : T.textDim,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                  fontFamily: T.sans,
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
            <div
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  padding: '2rem',
                  background: T.surface,
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
                  <span style={{ fontSize: '1.75rem' }}>{activeSolution.icon}</span>
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
                      {activeSolution.name}
                    </h3>
                    <p
                      style={{ fontSize: '0.8125rem', color: T.accent, margin: 0, fontWeight: 500 }}
                    >
                      {activeSolution.tagline}
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.7,
                    color: T.textDim,
                    margin: '0 0 1rem',
                    maxWidth: '72ch',
                  }}
                >
                  {activeSolution.desc}
                </p>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {activeSolution.models.map((m) => (
                    <span
                      key={m}
                      style={{
                        fontSize: '0.6875rem',
                        fontFamily: T.mono,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        background: T.accentGlow,
                        color: T.accent,
                        border: `1px solid ${T.accentDim}`,
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1px',
                  background: T.border,
                }}
              >
                {activeSolution.stats.map((s) => (
                  <div key={s.label} style={{ padding: '1.25rem', background: T.bg }}>
                    <p
                      style={{
                        fontSize: '1.375rem',
                        fontWeight: 600,
                        color: T.text,
                        margin: '0 0 0.25rem',
                        fontFamily: T.mono,
                      }}
                    >
                      {s.value}
                    </p>
                    <p
                      style={{
                        fontSize: '0.5625rem',
                        fontFamily: T.mono,
                        fontWeight: 500,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: T.textMuted,
                        margin: 0,
                      }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p
                style={{
                  fontSize: '0.625rem',
                  fontFamily: T.mono,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: T.textMuted,
                  margin: '0 0 0.75rem',
                }}
              >
                Governed Use Cases
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {activeSolution.useCases.map((uc) => {
                  const key = `${activeSolution.id}-${uc.title}`;
                  const isExpanded = expandedUseCase === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedUseCase(isExpanded ? null : key)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '1.25rem',
                        borderRadius: 10,
                        cursor: 'pointer',
                        color: 'inherit',
                        font: 'inherit',
                        textAlign: 'left',
                        border: `1px solid ${isExpanded ? 'rgba(201,183,135,0.25)' : T.border}`,
                        background: isExpanded ? T.accentGlow : T.bg,
                        transition: 'all 0.2s ease',
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
                            color: T.textMuted,
                            flexShrink: 0,
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                          }}
                        >
                          &#9660;
                        </span>
                      </div>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.25 }}
                        >
                          <div
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.02)',
                              border: `1px solid ${T.border}`,
                            }}
                          >
                            <p
                              style={{
                                fontSize: '0.625rem',
                                fontFamily: T.mono,
                                fontWeight: 600,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                color: T.accent,
                                margin: '0 0 0.375rem',
                              }}
                            >
                              Prompt
                            </p>
                            <p
                              style={{
                                fontSize: '0.8125rem',
                                lineHeight: 1.6,
                                color: T.textDim,
                                margin: 0,
                                fontStyle: 'italic',
                              }}
                            >
                              "{uc.prompt}"
                            </p>
                          </div>
                          <div
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.75rem',
                              borderRadius: 8,
                              background: T.accentGlow,
                              border: `1px solid ${T.accentDim}`,
                            }}
                          >
                            <p
                              style={{
                                fontSize: '0.625rem',
                                fontFamily: T.mono,
                                fontWeight: 600,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                color: T.accent,
                                margin: '0 0 0.375rem',
                              }}
                            >
                              Proof Chain
                            </p>
                            <p
                              style={{
                                fontSize: '0.8125rem',
                                lineHeight: 1.6,
                                color: T.textDim,
                                margin: 0,
                              }}
                            >
                              {uc.proof}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', maxWidth: 640 }}>
              <SectionLabel>The Canonical Loop</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Nine stages. <span style={{ color: T.accent }}>One canonical path.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                The candidate models a governed Decision Loop from signal detection to outcome. Each
                stage exposes the evidence it would need; durable signed proof is a production
                admission requirement, not a property of these fixtures.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
              marginBottom: '2.5rem',
            }}
          >
            {CANONICAL_STEPS.map((step, i) => (
              <FadeIn key={step.name} delay={i * 0.04}>
                <div style={{ padding: '1.75rem', background: T.bg, height: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{step.icon}</span>
                    <span
                      style={{
                        fontSize: '0.5625rem',
                        fontFamily: T.mono,
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        color: T.textMuted,
                      }}
                    >
                      {step.num}
                    </span>
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: T.text,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {step.name}
                    </span>
                  </div>
                  <p
                    style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}
                  >
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div
              style={{
                padding: '2.25rem',
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                background: T.surface,
              }}
            >
              <p
                style={{
                  fontSize: '0.625rem',
                  fontFamily: T.mono,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: T.accent,
                  margin: '0 0 1rem',
                }}
              >
                Deterministic Scenario — {activeSolution.icon} {activeSolution.name}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {Object.entries(activeSolution.loopExample).map(([stage, text], i) => (
                  <div
                    key={stage}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '0.875rem 0',
                      borderBottom: i < 8 ? `1px solid ${T.border}` : 'none',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: 140,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '0.875rem' }}>{CANONICAL_STEPS[i]?.icon}</span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontFamily: T.mono,
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: stage === 'proof' ? T.accent : T.text,
                        }}
                      >
                        {stage}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.65,
                        color: T.textDim,
                        margin: 0,
                      }}
                    >
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <SectionLabel>Why a11oy</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Not a copilot. <span style={{ color: T.accent }}>A governed operating system.</span>
              </h2>
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.7,
                  color: T.textDim,
                  margin: '0 auto',
                  maxWidth: '58ch',
                }}
              >
                The prototype shows how model calls, approvals, actions, and outcomes can share one
                governance contract. Runtime attribution, proof persistence, and learning must be
                observed in an admitted deployment before those capabilities are claimed.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {[
              {
                title: 'Proof Contract on Every Decision',
                desc: 'A reviewable target schema for model calls, approvals, and outcomes. Durable append-only storage, signatures, and independent verification remain required.',
              },
              {
                title: '8 Provider Families, One Router Design',
                desc: 'OpenAI, Anthropic, DeepSeek, Google, Qwen, Meta, Moonshot, and HuggingFace are catalogue targets; configured access and qualified model identity must be verified separately.',
              },
              {
                title: 'Fail-Closed Policy Contract',
                desc: 'The design requires an admitted live policy engine to decide who can approve, when, and under what conditions; unavailable dependencies hold execution.',
              },
              {
                title: 'Outcome Feedback Target',
                desc: 'The design compares observed outcomes with recommendations. Production learning requires durable lineage and separately validated recalibration.',
              },
              {
                title: 'Durable Execution Requirement',
                desc: 'Checkpoint recovery, coordination, and human handoffs are promotion requirements. Process-local candidate services remain held.',
              },
              {
                title: '7 Industry Verticals',
                desc: 'Finance, Science, Engineering, Legal, Maritime, Real Estate, Defense. Same canonical loop. Domain-specific intelligence.',
              },
              {
                title: 'Glasswing Transparency',
                desc: 'Candidate trust portal, disclosure, transparency-report, and robustness surfaces. Published artifacts must be bound to exact source and independently verified before promotion.',
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.05}>
                <div style={{ padding: '2.25rem', background: T.bg, height: '100%' }}>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: T.text,
                      margin: '0 0 0.75rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(3rem, 6vw, 6rem)',
                alignItems: 'start',
              }}
            >
              <div>
                <SectionLabel>Publication</SectionLabel>
                <h2
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                    fontFamily: T.serif,
                    fontWeight: 400,
                    letterSpacing: '-0.03em',
                    color: T.text,
                    lineHeight: 1.08,
                    margin: '0 0 2rem',
                  }}
                >
                  What is <span style={{ color: T.accent }}>a11oy?</span>
                </h2>
                <div style={{ fontSize: '1.0625rem', lineHeight: 1.8, color: T.textDim }}>
                  <p style={{ margin: '0 0 1.25rem' }}>
                    a11oy is a{' '}
                    <strong style={{ color: T.text }}>governed decision operating system</strong> —
                    the infrastructure layer that sits between frontier AI models and real-world
                    consequence.
                  </p>
                  <p style={{ margin: '0 0 1.25rem' }}>
                    The name comes from metallurgy: an alloy is multiple elements fused into
                    something stronger than any single part. a11oy fuses signal intelligence, causal
                    reasoning, policy contracts, and an evidence architecture into one candidate
                    execution fabric.
                  </p>
                  <p style={{ margin: '0 0 1.25rem' }}>
                    Most AI platforms stop at recommendation. a11oy governs what happens after the
                    recommendation — who approves the action, under what conditions, with what
                    evidence, and how the outcome is recorded.
                  </p>
                  <p style={{ margin: 0 }}>
                    The target is attributable actions, reviewable decisions, and outcome feedback.
                    This prototype separates that design from the durable, signed runtime evidence
                    still required for production promotion.
                  </p>
                </div>
              </div>
              <div>
                <div
                  style={{
                    padding: '2.5rem',
                    borderRadius: 12,
                    border: `1px solid ${T.border}`,
                    background: T.surface,
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.5625rem',
                      fontFamily: T.mono,
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: T.accent,
                      margin: '0 0 1.5rem',
                    }}
                  >
                    The Governing Principle
                  </p>
                  <blockquote
                    style={{
                      fontSize: '1.5rem',
                      fontFamily: T.serif,
                      fontWeight: 400,
                      lineHeight: 1.4,
                      color: T.text,
                      margin: '0 0 2rem',
                      borderLeft: `2px solid ${T.accent}`,
                      paddingLeft: '1.5rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Target invariant: material actions require the approvals selected by policy.
                    Candidate runtimes stay held until a live policy engine, durable workflow, and
                    fail-closed evidence path prove that invariant.
                  </blockquote>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1px',
                      background: T.border,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {[
                      { val: '59', label: 'SDK Primitives' },
                      { val: '133', label: 'API Endpoints' },
                      { val: '7', label: 'Fabric Layers' },
                      { val: 'HOLD', label: 'Production Proof' },
                    ].map((m) => (
                      <div key={m.label} style={{ padding: '1rem', background: T.bg }}>
                        <p
                          style={{
                            fontSize: '1.5rem',
                            fontFamily: T.mono,
                            fontWeight: 600,
                            color: T.accent,
                            margin: '0 0 0.25rem',
                          }}
                        >
                          {m.val}
                        </p>
                        <p
                          style={{
                            fontSize: '0.5625rem',
                            fontFamily: T.mono,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: T.textMuted,
                            margin: 0,
                          }}
                        >
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      lineHeight: 1.6,
                      color: T.textMuted,
                      margin: 0,
                      fontFamily: T.mono,
                    }}
                  >
                    SZL Holdings &middot; Est. 2023 &middot; London
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(2rem, 5vw, 4rem)' }}>
          <FadeIn>
            <div style={{ marginBottom: '3.5rem', maxWidth: 720 }}>
              <SectionLabel>Competitive Landscape</SectionLabel>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontFamily: T.serif,
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  color: T.text,
                  lineHeight: 1.1,
                  margin: '0 0 1rem',
                }}
              >
                Questions before <span style={{ color: T.accent }}>comparison.</span>
              </h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, margin: 0 }}>
                The entries below are procurement questions, not findings, rankings, or claims about
                another vendor. Current product documentation, commercial terms, and reproducible
                testing are required before any comparison is published.
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1px',
              background: T.border,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.border}`,
            }}
          >
            {[
              {
                name: 'Palantir',
                category: 'Decision Intelligence',
                has: 'UNASSESSED — confirm current scope and deployment model directly with the vendor.',
                gap: 'PROCUREMENT QUESTION — verify approval controls, policy enforcement, provenance, auditability, and developer interfaces.',
              },
              {
                name: 'Datadog / New Relic',
                category: 'Technical Observability',
                has: 'UNASSESSED — confirm current scope and deployment model directly with each vendor.',
                gap: 'PROCUREMENT QUESTION — test business-decision context, approval controls, policy enforcement, and durable evidence.',
              },
              {
                name: 'ServiceNow',
                category: 'Workflow Automation',
                has: 'UNASSESSED — confirm current scope and deployment model directly with the vendor.',
                gap: 'PROCUREMENT QUESTION — compare workflow, evidence, policy, approval, and audit capabilities using current documentation and tests.',
              },
              {
                name: 'BOSS Technology',
                category: 'Business Observability',
                has: 'UNASSESSED — confirm the product identity, current scope, and deployment model directly with the vendor.',
                gap: 'PROCUREMENT QUESTION — verify post-aggregation policy, approval, execution, and evidence capabilities.',
              },
              {
                name: 'OpenAI / LangChain',
                category: 'Agent Frameworks',
                has: 'UNASSESSED — these are distinct products; evaluate each current surface independently.',
                gap: 'PROCUREMENT QUESTION — test authenticated approval, policy enforcement, durable state, and evidence boundaries for the proposed deployment.',
              },
              {
                name: 'a11oy',
                category: 'Governed Execution',
                has: 'Candidate stack: signal, causal, policy, orchestration, evidence, and alignment contracts across seven design verticals, with explicit non-promotion holds for unqualified runtimes.',
                gap: 'Durable state, signed evidence, external infrastructure, provider access, and independent production observations remain admission requirements.',
              },
            ].map((comp, i) => (
              <FadeIn key={comp.name} delay={i * 0.05}>
                <div
                  style={{
                    padding: '2rem',
                    background: comp.name === 'a11oy' ? T.accentGlow : T.bg,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: comp.name === 'a11oy' ? `1px solid ${T.accentDim}` : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: comp.name === 'a11oy' ? T.accent : T.text,
                        margin: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {comp.name}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '0.625rem',
                      fontFamily: T.mono,
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: T.textMuted,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {comp.category}
                  </p>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      lineHeight: 1.65,
                      color: T.textDim,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {comp.has}
                  </p>
                  {comp.gap && (
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.65,
                        color: T.accent,
                        margin: 0,
                        marginTop: 'auto',
                        paddingTop: '0.75rem',
                        borderTop: `1px solid ${T.border}`,
                      }}
                    >
                      {comp.gap}
                    </p>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{ padding: 'clamp(8rem, 16vw, 14rem) 0', borderTop: `1px solid ${T.border}` }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <FadeIn>
            <SectionLabel>See it in motion</SectionLabel>
            <h2
              style={{
                fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
                fontFamily: T.serif,
                fontWeight: 400,
                letterSpacing: '-0.03em',
                color: T.text,
                lineHeight: 1.05,
                margin: '0 0 1.5rem',
              }}
            >
              Watch the loop <span style={{ color: T.accent }}>close.</span>
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: 1.75,
                color: T.textDim,
                maxWidth: '46ch',
                margin: '0 auto 2.5rem',
              }}
            >
              A deterministic walk-through of a candidate decision, with the intended evidence
              fields visible at each step. It is not a production execution receipt.
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
                href={b('/agent-viz')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.875rem 2rem',
                  background: T.text,
                  color: T.bg,
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                }}
              >
                Agent trace fixture
              </Link>
              <Link
                href={b('/verifier')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.875rem 2rem',
                  background: 'transparent',
                  color: T.text,
                  border: `1px solid ${T.borderStrong}`,
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Verification fixture
              </Link>
              <Link
                href={b('/security-agents')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.875rem 2rem',
                  background: 'transparent',
                  color: T.accent,
                  border: `1px solid ${T.accentDim}`,
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Security workflow fixture
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer
        style={{ borderTop: `1px solid ${T.border}`, padding: '4rem clamp(2rem, 5vw, 4rem)' }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '2rem',
          }}
        >
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  border: `1px solid ${T.accent}`,
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: T.mono,
                  color: T.accent,
                }}
              >
                a
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text }}>a11oy</span>
            </div>
            <p
              style={{
                fontSize: '0.8125rem',
                color: T.textMuted,
                maxWidth: '32ch',
                lineHeight: 1.6,
              }}
            >
              Governed decision-system prototype. Production proof requires durable signed evidence.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)' }}>
            {[
              {
                title: 'Candidate',
                links: [
                  { label: 'Home', href: b('/') },
                  { label: 'Agent Visualization', href: b('/agent-viz') },
                ],
              },
              {
                title: 'Governance Fixtures',
                links: [
                  { label: 'Stress Test', href: b('/adversarial') },
                  { label: 'Verifier', href: b('/verifier') },
                ],
              },
              {
                title: 'Research Fixtures',
                links: [
                  { label: 'Positioning UI', href: b('/frontier') },
                  { label: 'Security Agents', href: b('/security-agents') },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p
                  style={{
                    fontSize: '0.5625rem',
                    fontFamily: T.mono,
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: T.textMuted,
                    marginBottom: '0.75rem',
                  }}
                >
                  {col.title}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {col.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      style={{
                        fontSize: '0.8125rem',
                        color: T.textDim,
                        textDecoration: 'none',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            maxWidth: 1320,
            margin: '3rem auto 0',
            paddingTop: '2rem',
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
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
