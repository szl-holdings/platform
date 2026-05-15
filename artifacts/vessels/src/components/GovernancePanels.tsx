import {
  OmniaEvidencePanel,
  StatusChip,
  StatusChipGroup,
  DeploymentContext,
  OwnershipMeta,
  type EvidenceEntry,
} from '@szl-holdings/omnia-shell';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const VESSELS_EVIDENCE: EvidenceEntry[] = [
  { id: 'v-sig-1', type: 'signal', label: 'AIS deviation — MV Stellarwind', value: '14 nm off planned route', timestamp: ago(60_000), confidence: 0.94, domain: 'vessels' },
  { id: 'v-der-1', type: 'derivation', label: 'Insurance tier breach probability', value: '82% (threshold 85%)', timestamp: ago(45_000), confidence: 0.88, domain: 'vessels' },
  { id: 'v-pol-1', type: 'policy', label: 'Voyage governance — escalation rule', value: 'Notify ops + insurer at ≥85%', timestamp: ago(30_000), domain: 'vessels' },
  { id: 'v-app-1', type: 'approval', label: 'Hold deviation alert until 85% threshold', author: 'M. Okafor (Ops Lead)', timestamp: ago(20_000), confidence: 0.97 },
];

export function VesselsGovernancePanels() {
  return (
    <section style={{ padding: '60px 24px', borderTop: '1px solid rgba(56,189,248,0.10)', background: 'rgba(6,14,26,0.6)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.55)', marginBottom: 6 }}>
            Governance posture — live
          </p>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(224,242,254,0.92)', letterSpacing: '-0.01em' }}>
            Every recommendation carries its evidence chain
          </h3>
        </div>

        <div style={{ marginBottom: 16 }}>
          <StatusChipGroup>
            <StatusChip status="healthy" label="Fleet sync" pulsing />
            <StatusChip status="warning" label="MV Stellarwind — deviation" />
            <StatusChip status="healthy" label="MV Ariadne — on schedule" />
            <StatusChip status="enforced" label="Voyage policy" />
            <StatusChip status="approved" label="Insurance tier" />
          </StatusChipGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <OmniaEvidencePanel
            title="MV Stellarwind — deviation recommendation"
            entries={VESSELS_EVIDENCE}
            correlationId="vessels-stellarwind-2026-05-15"
            auditId="audit-vsl-3471"
          />
          <DeploymentContext
            serviceName="vessels-twin"
            environment="production"
            version="2.4.1"
            deploymentStatus="deployed"
            uptime={99.94}
            lastDeployedAt={ago(36 * 3600_000)}
            deployedBy="vessels-platform"
            healthProbes={[
              { name: 'AIS ingest', url: '/health/ais', status: 'passing', latencyMs: 142, lastChecked: ago(45_000) },
              { name: 'Twin sync', url: '/health/twin', status: 'passing', latencyMs: 198, lastChecked: ago(30_000) },
            ]}
            sloName="Alert ingestion < 90s"
            sloTarget={99.5}
            sloCurrent={99.71}
          />
          <OwnershipMeta
            ownerTeam="Vessels Platform"
            system="vessels-twin"
            domain="vessels"
            lifecycle="production"
            tier="tier-0"
            healthEndpoint="https://vessels.szl-holdings.com/health"
            runbookUrl="https://runbooks.szl-holdings.com/vessels"
            scorecardScore={92}
            lastDeploy={ago(36 * 3600_000)}
          />
        </div>
      </div>
    </section>
  );
}
