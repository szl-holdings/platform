import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, HashId } from '../components/ui';

const ENTRIES = [
  {
    id: 'pce-c9f2e5b8',
    kind: 'EXECUTION',
    title: 'MV Cascade port standby authorized',
    actor: 'vp-operations:sarah.chen',
    ts: '2026-04-25T04:32:11Z',
    domain: 'Maritime',
    signalRef: 'sig-001',
    policyRef: 'pol-maritime-002',
    hash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2',
    verified: true,
    causalLinks: 4,
    executionStatus: 'completed',
  },
  {
    id: 'pce-e3a1d4f7',
    kind: 'DECISION',
    title: 'Q1 capex variance acknowledged — CFO notified',
    actor: 'cfo-delegate:james.okafor',
    ts: '2026-04-25T01:12:44Z',
    domain: 'Finance',
    signalRef: 'sig-007',
    policyRef: 'pol-finance-001',
    hash: 'sha256:e3a1d4f7b2c8e1a6d3f2a7c4e1b8d5f3',
    verified: true,
    causalLinks: 2,
    executionStatus: 'completed',
  },
  {
    id: 'pce-b8c3f9e2',
    kind: 'EXECUTION',
    title: 'TG-Ember threat tier escalated — perimeter hardened',
    actor: 'security-ops:automated:guardian-v2',
    ts: '2026-04-24T18:55:00Z',
    domain: 'Defense',
    signalRef: 'sig-005',
    policyRef: 'pol-security-007',
    hash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6',
    verified: true,
    causalLinks: 6,
    executionStatus: 'completed',
  },
  {
    id: 'pce-a2d7e1f4',
    kind: 'APPROVAL',
    title: 'Talbot matter escalation approved by General Counsel',
    actor: 'general-counsel:patricia.mwangi',
    ts: '2026-04-24T14:20:33Z',
    domain: 'Legal',
    signalRef: 'sig-002',
    policyRef: 'pol-legal-003',
    hash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2',
    verified: true,
    causalLinks: 3,
    executionStatus: 'completed',
  },
  {
    id: 'pce-f1c6b3a8',
    kind: 'POLICY_EVAL',
    title: 'Revenue pipeline intervention — policy gate passed',
    actor: 'policy-engine:covenant-v1',
    ts: '2026-04-24T10:05:18Z',
    domain: 'Revenue',
    signalRef: 'sig-003',
    policyRef: 'pol-revenue-001',
    hash: 'sha256:f1c6b3a8d5e2f7c1b4a9e3d6f2b8c5a1',
    verified: true,
    causalLinks: 2,
    executionStatus: 'pending_approval',
  },
];

const KIND_STYLES: Record<string, { bg: string; color: string }> = {
  EXECUTION:   { bg: 'rgba(201,183,135,0.1)', color: '#c9b787' },
  DECISION:    { bg: 'rgba(201,183,135,0.1)', color: '#c9b787' },
  APPROVAL:    { bg: 'rgba(138,138,138,0.1)', color: '#8a8a8a' },
  POLICY_EVAL: { bg: 'rgba(176,141,82,0.1)', color: '#b08d52' },
};

export function ProofLedger() {
  return (
    <Layout>
      <PageHeader
        label="PROOF LEDGER"
        title="Immutable Audit Chain"
        subtitle="Every governed decision, approval, and execution is recorded with cryptographic proof. The board-level audit trail — not compliance theater, but structural certainty."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="TOTAL ENTRIES" value="5" sub="Demo chain" accent="#b08d52" />
        <KpiCard label="VERIFIED" value="5 / 5" sub="All hashes valid" accent="#c9b787" />
        <KpiCard label="CAUSAL LINKS" value="17" sub="Across all entries" accent="#c9b787" />
        <KpiCard label="CHAIN INTEGRITY" value="100%" sub="No tampering detected" accent="#c9b787" />
      </div>

      <div className="mb-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(176,141,82,0.06)', border: '1px solid rgba(176,141,82,0.2)', color: '#b08d52' }}>
        Proof-Carrying Execution: every entry below contains the originating signal reference, policy evaluation outcome, approval actor, and cryptographic hash of the complete execution context.
      </div>

      <div className="flex flex-col gap-3">
        {ENTRIES.map((e, idx) => (
          <Card key={e.id}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}
                >
                  #{ENTRIES.length - idx}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: KIND_STYLES[e.kind]?.bg, color: KIND_STYLES[e.kind]?.color }}
                    >
                      {e.kind}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.domain}</span>
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{e.title}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono" style={{ color: '#c9b787' }}>{e.verified ? '✓ verified' : 'unverified'}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.causalLinks} causal links</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
              <div>
                <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ACTOR</div>
                <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{e.actor}</div>
              </div>
              <div>
                <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SIGNAL</div>
                <HashId id={e.signalRef} />
              </div>
              <div>
                <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>POLICY</div>
                <HashId id={e.policyRef} />
              </div>
              <div>
                <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>STATUS</div>
                <span style={{ color: e.executionStatus === 'completed' ? '#c9b787' : '#c9b787' }}>{e.executionStatus}</span>
              </div>
            </div>

            <div
              className="font-mono text-xs px-3 py-2 rounded"
              style={{ backgroundColor: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', wordBreak: 'break-all' }}
            >
              {e.hash}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              {new Date(e.ts).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> All proof entries are illustrative demo data. Production Proof Ledger entries are cryptographically immutable and append-only.
      </div>
    </Layout>
  );
}
