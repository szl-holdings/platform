import {
  OmniaEvidencePanel,
  StatusChip,
  StatusChipGroup,
  DeploymentContext,
  OwnershipMeta,
  type EvidenceEntry,
} from '@szl-holdings/omnia-shell';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const CJ_EVIDENCE: EvidenceEntry[] = [
  { id: 'cj-sig-1', type: 'signal', label: 'Strategic diagnostic — client engagement', value: '12 KPIs flagged for review', timestamp: ago(20 * 60_000), confidence: 0.92, domain: 'carlota-jo' },
  { id: 'cj-der-1', type: 'derivation', label: 'Decision center recommendation', value: 'Re-tier capital allocation — Lane B', timestamp: ago(15 * 60_000), confidence: 0.86, domain: 'carlota-jo' },
  { id: 'cj-pol-1', type: 'policy', label: 'Advisory policy — fiduciary tier', value: 'Disclose conflicts before commitment', timestamp: ago(10 * 60_000), domain: 'carlota-jo' },
  { id: 'cj-app-1', type: 'approval', label: 'Carlota Jo — sign-off', author: 'C. Jiménez', timestamp: ago(5 * 60_000), confidence: 1 },
];

export function CarlotaJoGovernancePanels() {
  return (
    <section
      style={{
        padding: '80px 24px',
        background: 'var(--color-cream-warm, #f5efe5)',
        borderTop: '1px solid var(--color-stone-200, rgba(0,0,0,0.08))',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-gold, #b89858)', marginBottom: 6 }}>
            Governance posture · live
          </p>
          <h3 style={{ fontSize: 26, fontWeight: 600, color: 'var(--color-ink-900, #1a1a1a)', letterSpacing: '-0.01em' }}>
            Every advisory recommendation, fully attributable
          </h3>
        </div>

        <div style={{ marginBottom: 16 }}>
          <StatusChipGroup>
            <StatusChip status="approved" label="Advisory engagement" />
            <StatusChip status="enforced" label="Fiduciary policy" />
            <StatusChip status="healthy" label="Decision center" />
            <StatusChip status="advisory" label="Lane B — re-tier" />
          </StatusChipGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <OmniaEvidencePanel
            title="Decision Center — Lane B recommendation"
            entries={CJ_EVIDENCE}
            correlationId="carlota-jo-laneb-2026-05-15"
            auditId="audit-cj-2391"
          />
          <DeploymentContext
            serviceName="carlota-jo-advisory"
            environment="production"
            version="1.4.0"
            deploymentStatus="deployed"
            uptime={99.88}
            lastDeployedAt={ago(96 * 3600_000)}
            deployedBy="carlota-jo-team"
            healthProbes={[
              { name: 'Advisory feed', url: '/health/advisory', status: 'passing', latencyMs: 134, lastChecked: ago(60_000) },
            ]}
            sloName="Advisory cycle freshness < 1h"
            sloTarget={97.0}
            sloCurrent={98.12}
          />
          <OwnershipMeta
            ownerTeam="Carlota Jo Consulting"
            system="cj-advisory"
            domain="carlota-jo"
            lifecycle="production"
            tier="tier-1"
            healthEndpoint="https://carlota-jo.szl-holdings.com/health"
            runbookUrl="https://runbooks.szl-holdings.com/carlota-jo"
            scorecardScore={87}
            lastDeploy={ago(96 * 3600_000)}
          />
        </div>
      </div>
    </section>
  );
}
