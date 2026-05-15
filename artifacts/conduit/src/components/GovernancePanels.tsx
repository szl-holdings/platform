import {
  OmniaEvidencePanel,
  StatusChip,
  StatusChipGroup,
  DeploymentContext,
  OwnershipMeta,
  type EvidenceEntry,
} from '@szl-holdings/omnia-shell';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const CONDUIT_EVIDENCE: EvidenceEntry[] = [
  { id: 'cd-sig-1', type: 'signal', label: 'Relay sync risk — destination drift', value: '4 destinations flagged', timestamp: ago(5 * 60_000), confidence: 0.91, domain: 'conduit' },
  { id: 'cd-der-1', type: 'derivation', label: 'Innovation panel — ranked action', value: 'Re-route via amaru-axis-2', timestamp: ago(3 * 60_000), confidence: 0.88, domain: 'conduit' },
  { id: 'cd-pol-1', type: 'policy', label: 'Governance — relay policy tier', value: 'Block on sigma > 0.7', timestamp: ago(2 * 60_000), domain: 'conduit' },
  { id: 'cd-agt-1', type: 'agent', label: 'Amaru agent — recommended action', value: 'Pause sync, alert operator', timestamp: ago(60_000), confidence: 0.92 },
];

export function ConduitGovernancePanels() {
  return (
    <section className="conduit-card mt-6 p-6" style={{ background: 'rgba(6,11,18,0.6)', border: '1px solid rgba(201,183,135,0.18)' }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.2em', color: '#c9b787', textTransform: 'uppercase' as const, marginBottom: 6 }}>
          Governance posture · live
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f5f5f5' }}>
          Every relay recommendation is proof-anchored
        </h3>
      </div>

      <div style={{ marginBottom: 16 }}>
        <StatusChipGroup>
          <StatusChip status="warning" label="4 destinations — drift" pulsing />
          <StatusChip status="enforced" label="Relay policy" />
          <StatusChip status="healthy" label="Amaru axis-2" />
          <StatusChip status="approved" label="Operator gate" />
        </StatusChipGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <OmniaEvidencePanel
          title="Innovation panel — re-route recommendation"
          entries={CONDUIT_EVIDENCE}
          correlationId="conduit-amaru-2026-05-15"
          auditId="audit-cd-4471"
        />
        <DeploymentContext
          serviceName="conduit-relay"
          environment="production"
          version="0.9.3"
          deploymentStatus="deployed"
          uptime={99.86}
          lastDeployedAt={ago(24 * 3600_000)}
          deployedBy="conduit-platform"
          healthProbes={[
            { name: 'Relay queue', url: '/health/queue', status: 'passing', latencyMs: 92, lastChecked: ago(20_000) },
            { name: 'Mapper', url: '/health/mapper', status: 'passing', latencyMs: 145, lastChecked: ago(30_000) },
          ]}
          sloName="Relay roundtrip < 10s"
          sloTarget={99.0}
          sloCurrent={99.21}
        />
        <OwnershipMeta
          ownerTeam="Conduit Platform"
          system="conduit-relay"
          domain="conduit"
          lifecycle="production"
          tier="tier-1"
          healthEndpoint="https://conduit.szl-holdings.com/health"
          runbookUrl="https://runbooks.szl-holdings.com/conduit"
          scorecardScore={86}
          lastDeploy={ago(24 * 3600_000)}
        />
      </div>
    </section>
  );
}
