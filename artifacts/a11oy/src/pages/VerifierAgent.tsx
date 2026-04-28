import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const GOLD = '#c9b787';

const VERIFICATION_RUNS = [
  {
    id: 'vr-001',
    task: 'MV Cascade port standby authorized and executed',
    agent: 'Cascade Navigator',
    domain: 'Maritime',
    executedAt: '2026-04-25T04:32:11Z',
    verifiedAt: '2026-04-25T04:34:58Z',
    timeToVerifyMs: 167000,
    method: 'AIS position confirmation + port authority API',
    status: 'passed',
    evidence: [
      { key: 'AIS Position', value: '1.28N 103.67E — anchorage confirmed', verified: true },
      { key: 'Port Status', value: 'Standby registered — Tanjung Pelepas', verified: true },
      { key: 'Cost Log', value: '$14,200/day standby rate confirmed', verified: true },
      { key: 'ETA Delta', value: '+18h delay recorded in voyage plan', verified: true },
    ],
    proofHash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2',
    notes: 'All four verification signals confirmed within 3 minutes of execution. No discrepancies detected.',
  },
  {
    id: 'vr-002',
    task: 'Talbot discovery escalation sent to lead counsel',
    agent: 'Counsel Sentinel',
    domain: 'Legal',
    executedAt: '2026-04-24T14:22:10Z',
    verifiedAt: '2026-04-24T14:23:45Z',
    timeToVerifyMs: 95000,
    method: 'Email delivery confirmation + Clio matter status update',
    status: 'passed',
    evidence: [
      { key: 'Email Delivered', value: 'Lead counsel confirmed receipt at 14:22 UTC', verified: true },
      { key: 'Clio Matter Status', value: 'Status updated: "escalated — discovery team engaged"', verified: true },
      { key: 'Calendar Invite', value: 'Emergency call scheduled T+4h', verified: true },
    ],
    proofHash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2',
    notes: 'Escalation path fully verified. Matter timeline updated in Clio.',
  },
  {
    id: 'vr-003',
    task: 'TG-Ember threat tier escalated to ORANGE — perimeter hardened',
    agent: 'Guardian',
    domain: 'Defense',
    executedAt: '2026-04-24T18:55:00Z',
    verifiedAt: '2026-04-24T18:56:12Z',
    timeToVerifyMs: 72000,
    method: 'SIEM alert confirmation + firewall rule audit',
    status: 'passed',
    evidence: [
      { key: 'SIEM Alert', value: 'TG-Ember elevated to ORANGE in threat registry', verified: true },
      { key: 'Firewall Rules', value: '14 new block rules applied — confirmed active', verified: true },
      { key: 'CISO Notification', value: 'Delivered to CISO at 18:55:03 UTC', verified: true },
      { key: 'Perimeter Scan', value: 'Vulnerability surface reduced by 22%', verified: true },
    ],
    proofHash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6',
    notes: 'Full perimeter hardening confirmed within 72 seconds. All verification signals positive.',
  },
  {
    id: 'vr-004',
    task: 'Q2 pipeline executive outreach initiated — Meridian, Apex, NovaTech',
    agent: 'Pipeline Oracle',
    domain: 'Revenue',
    executedAt: '2026-04-24T09:15:00Z',
    verifiedAt: '2026-04-24T09:17:30Z',
    timeToVerifyMs: 150000,
    method: 'CRM activity log + email delivery confirmation',
    status: 'passed',
    evidence: [
      { key: 'CRM Activity', value: '3 executive outreach tasks created in Salesforce', verified: true },
      { key: 'Email Sent', value: 'CEO-level intro emails delivered to all 3 accounts', verified: true },
      { key: 'Opportunity Updated', value: 'Stage "Executive Review" set on all 3 opps', verified: true },
    ],
    proofHash: 'sha256:d4e8f2a6b1c9e3f7a2d5b8c4e1f6a3d7',
    notes: 'All 3 accounts contacted. Salesforce confirmed. Response tracking active.',
  },
  {
    id: 'vr-005',
    task: 'Cap rate compression alert — Westfield portfolio valuation model updated',
    agent: 'DOMAINE Analyst',
    domain: 'Real Estate',
    executedAt: '2026-04-23T16:40:00Z',
    verifiedAt: '2026-04-23T16:42:18Z',
    timeToVerifyMs: 138000,
    method: 'Portfolio model version check + report generation confirmation',
    status: 'failed',
    evidence: [
      { key: 'Model Version', value: 'v2.4.1 deployed — cap rate inputs updated', verified: true },
      { key: 'CoStar Feed', value: 'Latest comp data ingested at 16:38 UTC', verified: true },
      { key: 'Report Generation', value: 'Portfolio summary PDF generation failed — timeout', verified: false },
    ],
    proofHash: 'sha256:e5f9a3b7c2d6e1f8a4b9c5d2e7f3a8b1',
    notes: 'Model update verified but PDF report generation failed. Manual report generation required. Issue flagged to ops team.',
  },
  {
    id: 'vr-006',
    task: 'Fabric layer health check — all 7 layers nominal',
    agent: 'Fabric Watchdog',
    domain: 'System',
    executedAt: '2026-04-26T10:00:00Z',
    verifiedAt: '2026-04-26T10:00:08Z',
    timeToVerifyMs: 8200,
    method: 'Internal health probe — all 7 fabric layer endpoints',
    status: 'passed',
    evidence: [
      { key: 'Signal Mesh', value: 'Health: 99% · Latency: 12ms', verified: true },
      { key: 'Causal Core', value: 'Health: 98% · Latency: 28ms', verified: true },
      { key: 'Context Engine', value: 'Health: 97% · Latency: 45ms', verified: true },
      { key: 'Workcell Engine', value: 'Health: 96% · Latency: 820ms', verified: true },
      { key: 'Covenant Layer', value: 'Health: 100% · Latency: 8ms', verified: true },
      { key: 'MirrorEval', value: 'Health: 95% · Latency: 1.2s', verified: true },
      { key: 'Proof Ledger', value: 'Health: 100% · Latency: 4ms', verified: true },
    ],
    proofHash: 'sha256:f6a1b4c8d2e5f9a3b7c1d6e2f8a4b9c3',
    notes: 'All layers nominal. No anomalies detected. Scheduled verification complete.',
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  Maritime: '#8a8a8a',
  Legal: '#c9b787',
  Revenue: '#c9b787',
  Defense: '#f5f5f5',
  'Real Estate': '#8a8a8a',
  Finance: '#c9b787',
  System: '#5e5e5e',
};

function fmt(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

function fmtMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function VerifierAgent() {
  const [selected, setSelected] = useState<string>('vr-001');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = VERIFICATION_RUNS.filter(r => filterStatus === 'all' || r.status === filterStatus);
  const passed = VERIFICATION_RUNS.filter(r => r.status === 'passed').length;
  const failed = VERIFICATION_RUNS.filter(r => r.status === 'failed').length;
  const passRate = Math.round((passed / VERIFICATION_RUNS.length) * 100);
  const avgVerify = Math.round(VERIFICATION_RUNS.reduce((a, r) => a + r.timeToVerifyMs, 0) / VERIFICATION_RUNS.length / 1000);
  const selectedRun = VERIFICATION_RUNS.find(r => r.id === selected);

  return (
    <Layout>
      <PageHeader
        label="VERIFIER AGENT"
        title="Autonomous Verification Suite"
        subtitle="Every action executed by A11oy is automatically verified by an independent Verifier Agent. Pass/fail evidence is cryptographically linked to the Proof Ledger."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="VERIFICATIONS RUN" value={VERIFICATION_RUNS.length} sub="total in demo" accent={GOLD} />
        <KpiCard label="PASS RATE" value={`${passRate}%`} sub={`${passed} of ${VERIFICATION_RUNS.length} passed`} accent={GOLD} />
        <KpiCard label="FAILURES" value={failed} sub="require attention" accent={failed > 0 ? '#ef4444' : GOLD} />
        <KpiCard label="AVG VERIFY TIME" value={`${avgVerify}s`} sub="time to confirm" accent={GOLD} />
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'passed', 'failed'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="text-xs px-3 py-1.5 rounded font-mono"
            style={{
              backgroundColor: filterStatus === s ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
              color: filterStatus === s ? GOLD : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${filterStatus === s ? 'rgba(201,183,135,0.3)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <SectionTitle>Verification Runs ({filtered.length})</SectionTitle>
          {filtered.map(run => {
            const domainColor = DOMAIN_COLORS[run.domain] ?? GOLD;
            const isPassed = run.status === 'passed';
            const isSelected = selected === run.id;
            return (
              <div
                key={run.id}
                className="rounded-lg border p-3 cursor-pointer transition-all"
                onClick={() => setSelected(run.id)}
                style={{
                  backgroundColor: isSelected ? 'rgba(201,183,135,0.04)' : 'var(--color-a11oy-card)',
                  borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)',
                  borderLeft: `3px solid ${isPassed ? '#22c55e' : '#ef4444'}`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: domainColor, backgroundColor: `${domainColor}12` }}>{run.domain}</span>
                  <span className="text-xs font-mono" style={{ color: isPassed ? '#22c55e' : '#ef4444' }}>
                    {isPassed ? '✓ PASSED' : '✗ FAILED'}
                  </span>
                </div>
                <div className="text-xs font-medium truncate mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{run.task}</div>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  <span>{run.agent}</span>
                  <span>{fmtMs(run.timeToVerifyMs)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {selectedRun ? (
            <Card>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{
                        color: selectedRun.status === 'passed' ? '#22c55e' : '#ef4444',
                        backgroundColor: selectedRun.status === 'passed' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        border: `1px solid ${selectedRun.status === 'passed' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}
                    >
                      {selectedRun.status === 'passed' ? '✓ VERIFICATION PASSED' : '✗ VERIFICATION FAILED'}
                    </span>
                    <span className="text-xs font-mono" style={{ color: DOMAIN_COLORS[selectedRun.domain] ?? GOLD }}>{selectedRun.domain}</span>
                  </div>
                  <div className="text-base font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{selectedRun.task}</div>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                  <div className="font-mono" style={{ color: GOLD }}>
                    {fmtMs(selectedRun.timeToVerifyMs)}
                  </div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>verify time</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4 text-xs">
                <div>
                  <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>VERIFICATION METHOD</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedRun.method}</div>
                </div>
                <div>
                  <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>VERIFIER AGENT</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedRun.agent} → Verifier v2</div>
                </div>
                <div>
                  <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EXECUTED AT</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(selectedRun.executedAt)}</div>
                </div>
                <div>
                  <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>VERIFIED AT</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(selectedRun.verifiedAt)}</div>
                </div>
              </div>

              <SectionTitle>Verification Evidence</SectionTitle>
              <div className="flex flex-col gap-2 mb-4">
                {selectedRun.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{
                      backgroundColor: ev.verified ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
                      border: `1px solid ${ev.verified ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    <span style={{ color: ev.verified ? '#22c55e' : '#ef4444', flexShrink: 0, marginTop: 1, fontSize: 14 }}>
                      {ev.verified ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{ev.key}</div>
                      <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{ev.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedRun.notes && (
                <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                  <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>VERIFIER NOTES</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedRun.notes}</div>
                </div>
              )}

              <div>
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PROOF LEDGER HASH</div>
                <div className="font-mono text-xs px-3 py-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)', wordBreak: 'break-all' }}>
                  {selectedRun.proofHash}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Cryptographically linked to Proof Ledger entry. Immutable and append-only.
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center py-16 text-sm" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              Select a verification run to view evidence.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <SectionTitle>How the Verifier Agent Works</SectionTitle>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Action Executed', desc: 'An operator executes a governed action after human approval. The Verifier Agent is notified immediately via the Proof Ledger.' },
            { step: '02', title: 'Evidence Collection', desc: 'The Verifier Agent queries external systems (APIs, SIEM, CRM, AIS) to confirm the action produced the intended outcome with measurable signals.' },
            { step: '03', title: 'Proof Sealed', desc: 'Verification result — pass or fail — is appended to the Proof Ledger with cryptographic proof. Failures trigger immediate alerts and replay queues.' },
          ].map(s => (
            <Card key={s.step}>
              <div className="text-2xl font-mono font-bold mb-2" style={{ color: 'rgba(201,183,135,0.3)' }}>{s.step}</div>
              <div className="text-sm font-semibold mb-1.5" style={{ color: 'var(--color-a11oy-text)' }}>{s.title}</div>
              <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
