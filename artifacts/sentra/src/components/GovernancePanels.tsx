import {
  OmniaEvidencePanel,
  StatusChip,
  StatusChipGroup,
  DeploymentContext,
  OwnershipMeta,
  type EvidenceEntry,
} from '@szl-holdings/omnia-shell';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const SENTRA_EVIDENCE: EvidenceEntry[] = [
  { id: 's-sig-1', type: 'signal', label: 'IOC match — APT-41 cluster', value: '14 indicators corroborated', timestamp: ago(45_000), confidence: 0.92, domain: 'sentra' },
  { id: 's-der-1', type: 'derivation', label: 'Threat severity uplift', value: 'medium → HIGH', timestamp: ago(40_000), confidence: 0.92, domain: 'sentra' },
  { id: 's-pol-1', type: 'policy', label: 'Containment policy — defensive only', value: 'No retaliation actions permitted', timestamp: ago(30_000), domain: 'sentra' },
  { id: 's-agt-1', type: 'agent', label: 'Triage agent recommendation', value: 'Isolate DMZ host srv-edge-07', timestamp: ago(20_000), confidence: 0.88 },
  { id: 's-app-1', type: 'approval', label: 'Human-in-the-loop approval', author: 'SOC Lead', timestamp: ago(10_000), confidence: 1 },
];

export function SentraGovernancePanels() {
  return (
    <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', background: '#070707' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.2em', color: 'rgba(16,185,129,0.7)', textTransform: 'uppercase' as const, marginBottom: 8 }}>
            Live: Governance posture
          </p>
          <h3 style={{ fontSize: 24, fontWeight: 600, color: '#f5f5f5', letterSpacing: '-0.01em' }}>
            Every containment carries its proof packet
          </h3>
        </div>

        <div style={{ marginBottom: 16 }}>
          <StatusChipGroup>
            <StatusChip status="critical" label="APT-41 — HIGH" pulsing />
            <StatusChip status="warning" label="DMZ exposure" />
            <StatusChip status="enforced" label="Defensive only" />
            <StatusChip status="approved" label="SOC sign-off" />
            <StatusChip status="healthy" label="SIEM ingest" />
          </StatusChipGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <OmniaEvidencePanel
            title="APT-41 containment — proof packet"
            entries={SENTRA_EVIDENCE}
            correlationId="sentra-apt41-2026-05-15"
            auditId="audit-sn-9081"
          />
          <DeploymentContext
            serviceName="sentra-triage"
            environment="production"
            version="3.1.4"
            deploymentStatus="deployed"
            uptime={99.97}
            lastDeployedAt={ago(12 * 3600_000)}
            deployedBy="sentra-soc"
            healthProbes={[
              { name: 'Threat feed', url: '/health/feed', status: 'passing', latencyMs: 88, lastChecked: ago(20_000) },
              { name: 'SIEM correlation', url: '/health/siem', status: 'passing', latencyMs: 312, lastChecked: ago(15_000) },
              { name: 'Containment exec', url: '/health/contain', status: 'passing', latencyMs: 124, lastChecked: ago(25_000) },
            ]}
            sloName="Triage decision < 60s"
            sloTarget={99.0}
            sloCurrent={99.42}
          />
          <OwnershipMeta
            ownerTeam="Sentra SOC"
            system="sentra-triage"
            domain="sentra"
            lifecycle="production"
            tier="tier-0"
            healthEndpoint="https://sentra.szl-holdings.com/health"
            runbookUrl="https://runbooks.szl-holdings.com/sentra"
            scorecardScore={94}
            lastDeploy={ago(12 * 3600_000)}
          />
        </div>
      </div>
    </section>
  );
}
