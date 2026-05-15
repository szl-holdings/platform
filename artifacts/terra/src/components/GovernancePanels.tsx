// @ts-nocheck
import {
  OmniaEvidencePanel,
  StatusChip,
  StatusChipGroup,
  DeploymentContext,
  OwnershipMeta,
  type EvidenceEntry,
} from '@szl-holdings/omnia-shell';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const TERRA_EVIDENCE: EvidenceEntry[] = [
  { id: 't-sig-1', type: 'signal', label: 'Covenant scan — TER-4402', value: 'DSCR 1.01x (floor 1.00x)', timestamp: ago(2 * 60_000), confidence: 0.94, domain: 'terra' },
  { id: 't-der-1', type: 'derivation', label: 'Watch-list classification', value: 'Marginal — 0.01x above floor', timestamp: ago(90_000), confidence: 0.91, domain: 'terra' },
  { id: 't-pol-1', type: 'policy', label: 'Covenant tier — tier-1 watch', value: 'Notify lender within 48h', timestamp: ago(60_000), domain: 'terra' },
  { id: 't-agt-1', type: 'agent', label: 'AVM recommendation', value: 'Refinance window open — 14 days', timestamp: ago(30_000), confidence: 0.83 },
];

export function TerraGovernancePanels() {
  return (
    <section style={{ padding: '60px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,183,135,0.7)', marginBottom: 6 }}>
            Governance posture — live
          </p>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.01em' }}>
            Covenant health and decision provenance
          </h3>
        </div>

        <div style={{ marginBottom: 16 }}>
          <StatusChipGroup>
            <StatusChip status="warning" label="TER-4402 — watch" pulsing />
            <StatusChip status="approved" label="TER-8821 — compliant" />
            <StatusChip status="enforced" label="Covenant policy" />
            <StatusChip status="healthy" label="AVM engine" />
          </StatusChipGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <OmniaEvidencePanel
            title="TER-4402 — investment readiness"
            entries={TERRA_EVIDENCE}
            correlationId="terra-ter4402-2026-05-15"
            auditId="audit-ter-1147"
          />
          <DeploymentContext
            serviceName="terra-covenant"
            environment="production"
            version="1.9.2"
            deploymentStatus="deployed"
            uptime={99.91}
            lastDeployedAt={ago(48 * 3600_000)}
            deployedBy="terra-platform"
            healthProbes={[
              { name: 'Valuation feed', url: '/health/valuation', status: 'passing', latencyMs: 256, lastChecked: ago(60_000) },
              { name: 'Covenant scan', url: '/health/covenant', status: 'passing', latencyMs: 178, lastChecked: ago(45_000) },
            ]}
            sloName="Covenant scan freshness < 5m"
            sloTarget={99.0}
            sloCurrent={99.36}
          />
          <OwnershipMeta
            ownerTeam="Terra Platform"
            system="terra-covenant"
            domain="terra"
            lifecycle="production"
            tier="tier-1"
            healthEndpoint="https://terra.szl-holdings.com/health"
            runbookUrl="https://runbooks.szl-holdings.com/terra"
            scorecardScore={88}
            lastDeploy={ago(48 * 3600_000)}
          />
        </div>
      </div>
    </section>
  );
}
