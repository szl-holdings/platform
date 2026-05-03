/**
 * Terra — Governance Dock
 *
 * Phase 13 UX Normalization adoption: surfaces the shared @szl-holdings/omnia-shell
 * governance components on the Terra trust & provenance surface so analysts can
 * see policy posture, decision evidence, ownership and deployment context in
 * the same enterprise-minimal language used across every SZL domain pack.
 */

import {
  DeploymentContext,
  OmniaEvidencePanel,
  OmniaTimeline,
  OwnershipMeta,
  PolicySummaryBar,
  StatusChipGroup,
  type EvidenceEntry,
  type TimelineEvent,
} from '@szl-holdings/omnia-shell';

const NOW = new Date();
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

const EVIDENCE: EvidenceEntry[] = [
  {
    id: 'ev-1',
    type: 'signal',
    label: 'County tax delinquency posted (parcel 4421-019)',
    timestamp: minutesAgo(120),
    confidence: 0.99,
    domain: 'real-estate',
  },
  {
    id: 'ev-2',
    type: 'derivation',
    label: 'Distress probability raised: 0.31 → 0.62',
    timestamp: minutesAgo(115),
    confidence: 0.84,
    author: 'terra-distress-engine',
    domain: 'real-estate',
  },
  {
    id: 'ev-3',
    type: 'policy',
    label: 'OPA: szl.real-estate.lender-notify',
    value: 'advisory',
    timestamp: minutesAgo(110),
    domain: 'real-estate',
  },
  {
    id: 'ev-4',
    type: 'agent',
    label: 'Agent draft: lender exposure summary',
    timestamp: minutesAgo(60),
    confidence: 0.88,
    author: 'agent-gateway',
    domain: 'real-estate',
  },
];

const TIMELINE: TimelineEvent[] = [
  { id: 't1', label: 'Tax delinquency feed processed', timestamp: minutesAgo(120), severity: 'warning' },
  { id: 't2', label: 'Distress score recomputed', timestamp: minutesAgo(115), severity: 'info' },
  { id: 't3', label: 'Lender notify policy evaluated', timestamp: minutesAgo(110), severity: 'info' },
  { id: 't4', label: 'Exposure summary drafted', timestamp: minutesAgo(60), severity: 'info' },
];

export function GovernanceDock() {
  return (
    <section className="space-y-6 mt-10">
      <header>
        <h2 className="text-xl font-display font-bold text-slate-100">Governance Dock</h2>
        <p className="text-slate-400 mt-1 text-sm">
          Shared OMNIA shell surface — policy posture, decision evidence, ownership, deployment.
        </p>
      </header>

      <StatusChipGroup
        chips={[
          { status: 'warning', label: '12 distressed parcels' },
          { status: 'advisory', label: 'OPA policies' },
          { status: 'healthy', label: 'County feeds' },
          { status: 'approved', label: 'Last release' },
        ]}
      />

      <PolicySummaryBar
        policies={[
          { id: 'realestate.lender-notify', name: 'Lender notify', status: 'advisory' },
          { id: 'realestate.distress-trigger', name: 'Distress trigger', status: 'enforced' },
          { id: 'realestate.fairhousing', name: 'Fair-housing review', status: 'enforced' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OmniaEvidencePanel
          title="Decision evidence chain — parcel 4421-019"
          entries={EVIDENCE}
          correlationId="terra-2026-05-03-3b7c"
          auditId="audit-3b7c0e"
        />
        <OmniaTimeline title="Workflow timeline" events={TIMELINE} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OwnershipMeta
          ownerTeam="terra-realestate-team"
          system="Terra Real Estate Intelligence"
          domain="real-estate"
          lifecycle="production"
          healthEndpoint="/health"
          runbookUrl="https://backstage.szl/catalog/component/terra/runbook"
          scorecard={{ score: 78, scale: 100 }}
          lastDeploy={minutesAgo(60 * 26)}
        />
        <DeploymentContext
          environment="production"
          deploymentStatus="healthy"
          version="2026.05.01-r2"
          uptimeSeconds={60 * 60 * 26}
          probes={[
            { name: 'web', status: 'healthy', latencyMs: 51 },
            { name: 'avm-api', status: 'healthy', latencyMs: 84 },
            { name: 'feed-ingest', status: 'healthy', latencyMs: 102 },
          ]}
          slo={{ name: 'avm-latency-p95', target: 200, current: 142 }}
        />
      </div>
    </section>
  );
}

export default GovernanceDock;
