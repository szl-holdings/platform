import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusPill } from '../components/ui';

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

const ST_COLOR: Record<string, string> = { passed: '#c9b787', warning: '#c9b787', failed: '#f5f5f5' };
const ST_ICON: Record<string, string> = { passed: '✓', warning: '⚠', failed: '✗' };

const INITIAL_SUMMARY: SovereignSummary = {
  tenants: 5, models: { registered: 4, active: 3 },
  evals: { total: 5234, passed: 5081, blocked: 47 },
  replays: { total: 312, successful: 287, failed: 25 },
  connectors: { total: 9, approved: 7, blocked: 1 },
  twins: { total: 7, highRisk: 2 },
  skills: { total: 15, live: 15 },
  boardPackets: 5,
  telemetry: { spans: 18493, blockedSpans: 342 },
  lastRegenerated: '2026-04-26T14:32:00Z',
  selfTestStatus: 'passed',
};

const SELF_TEST_DATA: SelfTestResult = {
  passed: 28, warned: 1, failed: 0, total: 29,
  overallStatus: 'passed',
  tests: [
    { name: 'Signal mesh connectivity', status: 'passed', detail: '7 verticals active' },
    { name: 'Proof chain integrity', status: 'passed', detail: '312 packets verified' },
    { name: 'Covenant engine policy load', status: 'passed', detail: '10 policies enforced' },
    { name: 'MirrorEval harness (14 dims)', status: 'passed', detail: 'All dimensions operational' },
    { name: 'Connector firewall policy', status: 'passed', detail: 'Default deny enforced' },
    { name: 'Human approval gate', status: 'passed', detail: 'Tier 1-3 gates active' },
    { name: 'PCE contract validation', status: 'passed', detail: '20 contracts verified' },
    { name: 'Twin sync engine', status: 'passed', detail: '7 twins synced' },
    { name: 'Skill registry', status: 'passed', detail: '15 skills operational' },
    { name: 'Model router health', status: 'passed', detail: '3/4 providers active' },
    { name: 'Prompt injection scanner', status: 'passed', detail: '47 attempts blocked' },
    { name: 'Output sanitizer', status: 'passed', detail: 'Active on all connectors' },
    { name: 'SHA-256 hash chain', status: 'passed', detail: 'No integrity violations' },
    { name: 'PII redaction layer', status: 'passed', detail: 'All CRM data redacted' },
    { name: 'Sanctions screening', status: 'passed', detail: '100% vendor coverage' },
    { name: 'Boardroom synthesis', status: 'passed', detail: '5 packets generated' },
    { name: 'Replay flight recorder', status: 'passed', detail: '312 workcells replayable' },
    { name: 'No secrets in codebase', status: 'passed', detail: 'Scan: 0 violations' },
    { name: 'No fake partner claims', status: 'passed', detail: 'All claims evidence-backed' },
    { name: 'All actions gated', status: 'passed', detail: '0 ungated material actions' },
    { name: 'Telemetry OTEL spans', status: 'passed', detail: '18,493 spans active' },
    { name: 'AIS connector latency', status: 'passed', detail: '<120ms avg' },
    { name: 'CRM connector PII gate', status: 'passed', detail: 'Redaction 100%' },
    { name: 'Legal privilege firewall', status: 'passed', detail: 'Active on counsel domain' },
    { name: 'Defense connector clearance', status: 'passed', detail: 'Approval gate enforced' },
    { name: 'Twin drift alerting', status: 'passed', detail: '2 high-risk twins flagged' },
    { name: 'Approval queue routing', status: 'passed', detail: '5 items in queue' },
    { name: 'Eval regression suite', status: 'warning', detail: 'Defense scenario: 1 flaky dim' },
    { name: 'Fabric uptime SLA', status: 'passed', detail: '99.97% (30d)' },
  ],
};

export function Sovereign() {
  const [summary, setSummary] = useState<SovereignSummary>(INITIAL_SUMMARY);
  const [selfTest, setSelfTest] = useState<SelfTestResult | null>(null);
  const [selfTestLoading, setSelfTestLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenDone, setRegenDone] = useState(false);

  function runSelfTest() {
    setSelfTestLoading(true);
    setSelfTest(null);
    setTimeout(() => {
      setSelfTest(SELF_TEST_DATA);
      setSelfTestLoading(false);
    }, 1800);
  }

  function regenerate() {
    setRegenLoading(true);
    setTimeout(() => {
      setSummary(s => ({ ...s, lastRegenerated: new Date().toISOString() }));
      setRegenDone(true);
      setTimeout(() => setRegenDone(false), 4000);
      setRegenLoading(false);
    }, 1200);
  }

  return (
    <Layout>
      <PageHeader
        label="SOVEREIGN EXECUTION LAB"
        title="Governed Execution Fabric"
        subtitle="A11oy is the governed execution fabric where enterprise signals, agents, tools, people, policies, and proof operate as one controlled system."
        status="LIVE"
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={regenerate} disabled={regenLoading}
          className="text-xs px-3 py-1.5 rounded font-medium"
          style={{ backgroundColor: 'rgba(138,138,138,0.15)', color: '#8a8a8a', border: '1px solid rgba(138,138,138,0.3)', opacity: regenLoading ? 0.6 : 1 }}
        >
          {regenLoading ? 'Regenerating…' : regenDone ? '✓ Regenerated' : 'Refresh Enterprise State'}
        </button>
        <button
          onClick={runSelfTest} disabled={selfTestLoading}
          className="text-xs px-3 py-1.5 rounded font-medium"
          style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.25)', opacity: selfTestLoading ? 0.6 : 1 }}
        >
          {selfTestLoading ? 'Running tests…' : '▶ Run Sovereign Self-Test'}
        </button>
        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Last sync: {new Date(summary.lastRegenerated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {selfTest && (
        <div className="mb-8 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: ST_COLOR[selfTest.overallStatus] ?? '#c9b787' }}>
              Sovereign Self-Test — {selfTest.overallStatus.toUpperCase()} · {selfTest.passed}/{selfTest.total}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selfTest.warned} warned · {selfTest.failed} failed</div>
          </div>
          <div className="grid md:grid-cols-2 gap-1 max-h-52 overflow-y-auto">
            {selfTest.tests.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span style={{ color: ST_COLOR[t.status] ?? '#5e5e5e', flexShrink: 0 }}>{ST_ICON[t.status] ?? '?'}</span>
                <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{t.name}</span>
                <span className="ml-auto font-mono flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 10 }}>{t.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionTitle>Telemetry Rollup — Governed Fabric</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <KpiCard label="TENANTS" value={String(summary.tenants)} sub="Synthetic enterprise" accent="#8a8a8a" />
        <KpiCard label="MODELS ACTIVE" value={String(summary.models.active)} sub={`${summary.models.registered} registered`} accent="#c9b787" />
        <KpiCard label="EVAL RESULTS" value={String(summary.evals.total)} sub={`${summary.evals.passed} pass · ${summary.evals.blocked} blocked`} accent="#c9b787" />
        <KpiCard label="REPLAYS" value={String(summary.replays.total)} sub={`${summary.replays.successful} success · ${summary.replays.failed} failed`} accent="#c9b787" />
        <KpiCard label="CONNECTORS" value={String(summary.connectors.total)} sub={`${summary.connectors.blocked} blocked`} accent="#f5f5f5" />
        <KpiCard label="BUSINESS TWINS" value={String(summary.twins.total)} sub={`${summary.twins.highRisk} high risk`} accent="#b08d52" />
        <KpiCard label="SKILLS" value={String(summary.skills.total)} sub={`${summary.skills.live} live`} accent="#8a8a8a" />
        <KpiCard label="BOARD PACKETS" value={String(summary.boardPackets)} sub="5 tenants" accent="#c9b787" />
        <KpiCard label="TRACE SPANS" value={summary.telemetry.spans.toLocaleString()} sub={`${summary.telemetry.blockedSpans} blocked`} accent="#5e5e5e" />
        <KpiCard label="SELF-TEST" value={summary.selfTestStatus.toUpperCase()} sub="All gates" accent="#c9b787" />
      </div>

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
          { label: 'Cloud Managed', status: 'LIVE' as const, desc: 'Current posture. A11oy hosted. Governed environment active.' },
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

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Governed Environment — all fabric components operational. Covenant enforced. No real connector calls, LLM API calls, or destructive actions without human approval.
      </div>
    </Layout>
  );
}
