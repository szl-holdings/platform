import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const API = '/api/a11oy';
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
function b(path: string) { return `${BASE}${path}`; }

interface SovereignSummary {
  tenants: number;
  models: { registered: number; active: number };
  evals: { total: number; passed: number; blocked: number };
  replays: { total: number; successful: number; failed: number };
  connectors: { total: number; approved: number; blocked: number };
  twins: { total: number; highRisk: number };
  skills: { total: number; live: number };
  boardPackets: number;
  telemetry: { spans: number; blockedSpans: number };
  lastRegenerated: string;
  selfTestStatus: string;
  demoMode: boolean;
}

interface SelfTestResult {
  passed: number; warned: number; failed: number; total: number;
  overallStatus: string;
  tests: Array<{ name: string; status: string; detail: string }>;
}

const NAV_LINKS = [
  { href: '/model-router', label: 'Model Router', icon: '⬡', description: 'Provider status, routing policy, latency, cost' },
  { href: '/evals', label: 'MirrorEval 2.0', icon: '◎', description: '14-dimension eval dashboard, regression suite' },
  { href: '/replay', label: 'Workcell Replay', icon: '▶', description: 'Flight recorder, timeline, failure classification' },
  { href: '/connectors', label: 'Connector Firewall', icon: '⊕', description: 'Registry, trust scores, injection blocking' },
  { href: '/twins', label: 'Twin Foundry', icon: '◈', description: 'Business twins, drift map, simulation' },
  { href: '/skills', label: 'Skill Library', icon: '∿', description: '15 named skills, run-demo, policy links' },
  { href: '/boardroom', label: 'Boardroom Mode', icon: '◇', description: 'Board packets, executive snapshot' },
  { href: '/trust', label: 'Trust Center', icon: '⚖', description: 'Security posture, human-gated autonomy' },
  { href: '/investor-demo', label: 'Investor Demo', icon: '▸', description: '12-step guided product story' },
];

const ST_COLOR: Record<string, string> = { passed: '#10b981', warning: '#f59e0b', failed: '#ef4444' };
const ST_ICON: Record<string, string> = { passed: '✓', warning: '⚠', failed: '✗' };

export function Sovereign() {
  const [summary, setSummary] = useState<SovereignSummary | null>(null);
  const [selfTest, setSelfTest] = useState<SelfTestResult | null>(null);
  const [selfTestLoading, setSelfTestLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenDone, setRegenDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/sovereign/summary`)
      .then(r => r.json())
      .then(d => { if (d.ok) setSummary(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function runSelfTest() {
    setSelfTestLoading(true);
    setSelfTest(null);
    fetch(`${API}/selftest/run`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.ok) setSelfTest(d.data); })
      .catch(() => {})
      .finally(() => setSelfTestLoading(false));
  }

  function regenerate() {
    setRegenLoading(true);
    fetch(`${API}/demo/regenerate`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.ok) { setRegenDone(true); setTimeout(() => setRegenDone(false), 4000); } })
      .catch(() => {})
      .finally(() => setRegenLoading(false));
  }

  return (
    <Layout>
      <PageHeader
        label="SOVEREIGN EXECUTION LAB"
        title="Governed Execution Fabric"
        subtitle="A11oy is the governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system."
        status="DEMO"
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={regenerate} disabled={regenLoading}
          className="text-xs px-3 py-1.5 rounded font-medium"
          style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', opacity: regenLoading ? 0.6 : 1 }}
        >
          {regenLoading ? 'Regenerating…' : regenDone ? '✓ Regenerated' : 'Regenerate Demo Enterprise'}
        </button>
        <button
          onClick={runSelfTest} disabled={selfTestLoading}
          className="text-xs px-3 py-1.5 rounded font-medium"
          style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)', opacity: selfTestLoading ? 0.6 : 1 }}
        >
          {selfTestLoading ? 'Running tests…' : 'Run Sovereign Self-Test'}
        </button>
        {summary && (
          <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Regenerated: {new Date(summary.lastRegenerated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {selfTest && (
        <div className="mb-8 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: ST_COLOR[selfTest.overallStatus] ?? '#10b981' }}>
              Sovereign Self-Test — {selfTest.overallStatus.toUpperCase()} · {selfTest.passed}/{selfTest.total}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selfTest.warned} warned · {selfTest.failed} failed</div>
          </div>
          <div className="grid md:grid-cols-2 gap-1 max-h-52 overflow-y-auto">
            {selfTest.tests.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span style={{ color: ST_COLOR[t.status] ?? '#9bacc4', flexShrink: 0 }}>{ST_ICON[t.status] ?? '?'}</span>
                <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-xs mb-8 animate-pulse" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading telemetry rollup…</div>
      ) : summary ? (
        <>
          <SectionTitle>Telemetry Rollup — Phase 3</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            <KpiCard label="DEMO TENANTS" value={String(summary.tenants)} sub="Synthetic enterprise" accent="#8b5cf6" />
            <KpiCard label="MODELS ACTIVE" value={String(summary.models.active)} sub={`${summary.models.registered} registered`} accent="#3b82f6" />
            <KpiCard label="EVAL RESULTS" value={String(summary.evals.total)} sub={`${summary.evals.passed} pass · ${summary.evals.blocked} blocked`} accent="#10b981" />
            <KpiCard label="REPLAYS" value={String(summary.replays.total)} sub={`${summary.replays.successful} success · ${summary.replays.failed} failed`} accent="#f59e0b" />
            <KpiCard label="CONNECTORS" value={String(summary.connectors.total)} sub={`${summary.connectors.blocked} blocked`} accent="#ef4444" />
            <KpiCard label="BUSINESS TWINS" value={String(summary.twins.total)} sub={`${summary.twins.highRisk} high risk`} accent="#b08d52" />
            <KpiCard label="SKILLS" value={String(summary.skills.total)} sub={`${summary.skills.live} live`} accent="#6366f1" />
            <KpiCard label="BOARD PACKETS" value={String(summary.boardPackets)} sub="5 tenants" accent="#ec4899" />
            <KpiCard label="TRACE SPANS" value={String(summary.telemetry.spans)} sub={`${summary.telemetry.blockedSpans} blocked`} accent="#9bacc4" />
            <KpiCard label="SELF-TEST" value={summary.selfTestStatus.toUpperCase()} sub="All gates" accent="#10b981" />
          </div>
        </>
      ) : null}

      <SectionTitle>Sovereign Sub-Surfaces</SectionTitle>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {NAV_LINKS.map(link => (
          <Link key={link.href} href={b(link.href)}>
            <Card className="cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-3">
                <span className="text-xl" style={{ color: 'var(--color-a11oy-gold)' }}>{link.icon}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{link.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{link.description}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <SectionTitle>Deployment Posture</SectionTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Cloud Managed', status: 'LIVE' as const, desc: 'Current demo posture. A11oy hosted. Demo data only.' },
          { label: 'VPC Isolated', status: 'ROADMAP' as const, desc: 'Customer VPC deployment — data stays within cloud boundary.' },
          { label: 'Air-Gapped', status: 'ROADMAP' as const, desc: 'Full on-premises. Local model inference. Defense/gov posture.' },
        ].map(m => (
          <Card key={m.label}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{m.label}</div>
              <StatusPill status={m.status} />
            </div>
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.desc}</p>
          </Card>
        ))}
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Phase 3 — Sovereign Execution Lab. All data is seeded and deterministic. No real connector calls, LLM API calls, or destructive actions are made.
      </div>
    </Layout>
  );
}
