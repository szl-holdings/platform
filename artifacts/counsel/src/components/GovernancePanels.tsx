import {
  OmniaEvidencePanel,
  StatusChip,
  StatusChipGroup,
  DeploymentContext,
  OwnershipMeta,
  type EvidenceEntry,
} from '@szl-holdings/omnia-shell';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const COUNSEL_EVIDENCE: EvidenceEntry[] = [
  { id: 'c-sig-1', type: 'signal', label: 'Docket update — CJL-2291', value: 'Response window 48h', timestamp: ago(60 * 60_000), confidence: 0.95, domain: 'counsel' },
  { id: 'c-der-1', type: 'derivation', label: 'Exposure quantification', value: '$1.8M downside, P75 settlement $610k', timestamp: ago(45 * 60_000), confidence: 0.81, domain: 'counsel' },
  { id: 'c-pol-1', type: 'policy', label: 'Drafting policy — clause genome match', value: 'Prefer prior-filed precedent CJL-1847', timestamp: ago(30 * 60_000), domain: 'counsel' },
  { id: 'c-agt-1', type: 'agent', label: 'Drafting agent — first draft ready', value: '12 clauses, 3 require GC review', timestamp: ago(15 * 60_000), confidence: 0.87 },
];

export function CounselGovernancePanels() {
  return (
    <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0a0a0a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.25em', color: '#c9b787', textTransform: 'uppercase' as const, marginBottom: 12 }}>
            Governance posture · live
          </p>
          <h3 style={{ fontSize: 24, fontWeight: 600, color: '#f5f5f5', letterSpacing: '-0.01em' }}>
            Every drafted clause carries its proof chain
          </h3>
        </div>

        <div style={{ marginBottom: 16 }}>
          <StatusChipGroup>
            <StatusChip status="warning" label="CJL-2291 — 48h" pulsing />
            <StatusChip status="healthy" label="CJL-1847 — discovery" />
            <StatusChip status="enforced" label="Clause genome policy" />
            <StatusChip status="pending" label="GC review queued" />
          </StatusChipGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <OmniaEvidencePanel
            title="CJL-2291 — drafting recommendation"
            entries={COUNSEL_EVIDENCE}
            correlationId="counsel-cjl2291-2026-05-15"
            auditId="audit-cnl-7723"
          />
          <DeploymentContext
            serviceName="counsel-drafting"
            environment="production"
            version="2.0.7"
            deploymentStatus="deployed"
            uptime={99.92}
            lastDeployedAt={ago(72 * 3600_000)}
            deployedBy="counsel-platform"
            healthProbes={[
              { name: 'Clause KB', url: '/health/kb', status: 'passing', latencyMs: 156, lastChecked: ago(60_000) },
              { name: 'Docket feed', url: '/health/docket', status: 'passing', latencyMs: 220, lastChecked: ago(90_000) },
            ]}
            sloName="Draft turnaround < 4h"
            sloTarget={98.0}
            sloCurrent={98.41}
          />
          <OwnershipMeta
            ownerTeam="Counsel Platform"
            system="counsel-drafting"
            domain="counsel"
            lifecycle="production"
            tier="tier-1"
            healthEndpoint="https://counsel.szl-holdings.com/health"
            runbookUrl="https://runbooks.szl-holdings.com/counsel"
            scorecardScore={89}
            lastDeploy={ago(72 * 3600_000)}
          />
        </div>
      </div>
    </section>
  );
}
