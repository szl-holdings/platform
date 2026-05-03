/**
 * Counsel — Governance Dock
 *
 * Phase 13 UX Normalization adoption: surfaces the shared @szl-holdings/omnia-shell
 * governance components on the Counsel surface so legal operators can see
 * matter-level evidence, privilege posture, ownership and deployment context
 * in the same enterprise-minimal language used across every SZL domain pack.
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
    label: 'New filing in matter #C-2451 (federal docket)',
    timestamp: minutesAgo(75),
    confidence: 0.99,
    domain: 'legal',
  },
  {
    id: 'ev-2',
    type: 'derivation',
    label: 'Privilege classifier: attorney work-product',
    timestamp: minutesAgo(72),
    confidence: 0.93,
    author: 'counsel-privilege-engine',
    domain: 'legal',
  },
  {
    id: 'ev-3',
    type: 'policy',
    label: 'OPA: szl.legal.discovery.holdback',
    value: 'enforced',
    timestamp: minutesAgo(70),
    domain: 'legal',
  },
  {
    id: 'ev-4',
    type: 'agent',
    label: 'Agent draft: response brief outline',
    timestamp: minutesAgo(45),
    confidence: 0.86,
    author: 'agent-gateway',
    domain: 'legal',
  },
];

const TIMELINE: TimelineEvent[] = [
  { id: 't1', label: 'New filing ingested', timestamp: minutesAgo(75), severity: 'info' },
  { id: 't2', label: 'Privilege classification', timestamp: minutesAgo(72), severity: 'info' },
  { id: 't3', label: 'Discovery holdback enforced', timestamp: minutesAgo(70), severity: 'success' },
  { id: 't4', label: 'Brief outline drafted', timestamp: minutesAgo(45), severity: 'info' },
];

export function GovernanceDock() {
  return (
    <section className="space-y-6 mt-10">
      <header>
        <h2 className="text-xl font-display font-bold text-slate-100">Governance Dock</h2>
        <p className="text-slate-400 mt-1 text-sm">
          Shared OMNIA shell surface — privilege posture, matter evidence, ownership, deployment.
        </p>
      </header>

      <StatusChipGroup
        chips={[
          { status: 'enforced', label: 'Privilege guard' },
          { status: 'enforced', label: 'OPA policies' },
          { status: 'healthy', label: 'Docket feeds' },
          { status: 'advisory', label: 'Agent gateway' },
        ]}
      />

      <PolicySummaryBar
        policies={[
          { id: 'legal.privilege', name: 'Privilege guard', status: 'enforced' },
          { id: 'legal.discovery', name: 'Discovery holdback', status: 'enforced' },
          { id: 'legal.brief.draft', name: 'Brief draft', status: 'advisory' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OmniaEvidencePanel
          title="Matter #C-2451 — evidence chain"
          entries={EVIDENCE}
          correlationId="counsel-2026-05-03-2f88"
          auditId="audit-2f88a1"
        />
        <OmniaTimeline title="Matter timeline" events={TIMELINE} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OwnershipMeta
          ownerTeam="counsel-legal-team"
          system="Counsel Legal Matter Command"
          domain="legal"
          lifecycle="production"
          healthEndpoint="/health"
          runbookUrl="https://backstage.szl/catalog/component/counsel/runbook"
          scorecard={{ score: 89, scale: 100 }}
          lastDeploy={minutesAgo(60 * 18)}
        />
        <DeploymentContext
          environment="production"
          deploymentStatus="healthy"
          version="2026.05.02-r1"
          uptimeSeconds={60 * 60 * 50}
          probes={[
            { name: 'web', status: 'healthy', latencyMs: 47 },
            { name: 'matter-api', status: 'healthy', latencyMs: 31 },
            { name: 'docket-ingest', status: 'healthy', latencyMs: 88 },
          ]}
          slo={{ name: 'docket-freshness-min', target: 15, current: 8 }}
        />
      </div>
    </section>
  );
}

export default GovernanceDock;
