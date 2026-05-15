import {
  OmniaEvidencePanel,
  StatusChip,
  StatusChipGroup,
  DeploymentContext,
  OwnershipMeta,
  type EvidenceEntry,
} from '@szl-holdings/omnia-shell';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const A11OY_EVIDENCE: EvidenceEntry[] = [
  { id: 'a-sig-1', type: 'signal', label: 'Signal mesh — workcell drift', value: '24 active workcells, 2 design-token drifts', timestamp: ago(5_000), confidence: 0.97, domain: 'a11oy' },
  { id: 'a-der-1', type: 'derivation', label: 'Recommended action — fabric retune', value: 'Recompose 3 cells, escalate 1', timestamp: ago(3_000), confidence: 0.93, domain: 'a11oy' },
  { id: 'a-pol-1', type: 'policy', label: 'Governance — adaptive tier', value: 'Auto-apply tier-2; require gate for tier-0', timestamp: ago(2_000), domain: 'a11oy' },
  { id: 'a-app-1', type: 'approval', label: 'Pending operator approval', value: '3 actions awaiting human-in-the-loop', timestamp: ago(20 * 60_000), confidence: 1 },
  { id: 'a-aud-1', type: 'audit', label: 'Proof ledger entry', value: 'a11oy-proof:00000147', timestamp: ago(1_000), domain: 'a11oy' },
];

export function A11oyGovernancePanels() {
  return (
    <section style={{ padding: '80px clamp(2rem, 5vw, 4rem)', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: '0.16em', color: '#c9b787', textTransform: 'uppercase', marginBottom: 8 }}>
            Governance posture · live
          </p>
          <h3 style={{ fontSize: 28, fontWeight: 600, color: '#f5f5f5', letterSpacing: '-0.01em' }}>
            Every governed action — proof on the wire
          </h3>
        </div>

        <div style={{ marginBottom: 16 }}>
          <StatusChipGroup>
            <StatusChip status="healthy" label="Fabric — 24 workcells" pulsing />
            <StatusChip status="warning" label="2 drift alerts" />
            <StatusChip status="pending" label="3 awaiting approval" />
            <StatusChip status="enforced" label="Adaptive policy" />
            <StatusChip status="approved" label="Proof ledger" />
          </StatusChipGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <OmniaEvidencePanel
            title="Recommendations — fabric retune"
            entries={A11OY_EVIDENCE}
            correlationId="a11oy-fabric-2026-05-15"
            auditId="audit-a11-9987"
          />
          <DeploymentContext
            serviceName="a11oy-fabric"
            environment="production"
            version="4.2.1"
            deploymentStatus="deployed"
            uptime={99.98}
            lastDeployedAt={ago(6 * 3600_000)}
            deployedBy="a11oy-platform"
            healthProbes={[
              { name: 'Signal mesh', url: '/health/mesh', status: 'passing', latencyMs: 48, lastChecked: ago(5_000) },
              { name: 'Proof ledger', url: '/health/proof', status: 'passing', latencyMs: 72, lastChecked: ago(10_000) },
              { name: 'Workcell scheduler', url: '/health/scheduler', status: 'passing', latencyMs: 96, lastChecked: ago(15_000) },
            ]}
            sloName="Decision proof < 5s"
            sloTarget={99.5}
            sloCurrent={99.78}
          />
          <OwnershipMeta
            ownerTeam="a11oy Platform"
            system="a11oy-fabric"
            domain="a11oy"
            lifecycle="production"
            tier="tier-0"
            healthEndpoint="https://a11oy.szl-holdings.com/health"
            runbookUrl="https://runbooks.szl-holdings.com/a11oy"
            scorecardScore={96}
            lastDeploy={ago(6 * 3600_000)}
          />
        </div>
      </div>
    </section>
  );
}
