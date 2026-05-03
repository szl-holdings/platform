/**
 * Vessels — Governance Dock
 *
 * Phase 13 UX Normalization adoption: surfaces the shared @szl-holdings/omnia-shell
 * governance components on the Vessels trust & provenance surface so operators
 * can see policy posture, evidence chains, ownership and deployment context
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
    label: 'AIS heartbeat dropout (vessel IMO 9876543)',
    value: '4 missed pings',
    timestamp: minutesAgo(42),
    confidence: 0.92,
    domain: 'vessels',
  },
  {
    id: 'ev-2',
    type: 'derivation',
    label: 'Dark-vessel risk score elevated',
    value: 'risk = 0.78',
    timestamp: minutesAgo(40),
    confidence: 0.87,
    author: 'maritime-risk-engine',
    domain: 'vessels',
  },
  {
    id: 'ev-3',
    type: 'policy',
    label: 'OPA: szl.maritime.dark-vessel.review',
    value: 'requires-approval',
    timestamp: minutesAgo(38),
    domain: 'vessels',
  },
  {
    id: 'ev-4',
    type: 'agent',
    label: 'Agent draft: PSC inspector pre-brief',
    timestamp: minutesAgo(35),
    confidence: 0.81,
    author: 'agent-gateway',
    domain: 'vessels',
  },
  {
    id: 'ev-5',
    type: 'audit',
    label: 'Audit entry written',
    value: 'audit-id 7c1e…',
    timestamp: minutesAgo(34),
    domain: 'vessels',
  },
];

const TIMELINE: TimelineEvent[] = [
  { id: 't1', label: 'Voyage manifest synced', timestamp: minutesAgo(180), severity: 'info' },
  { id: 't2', label: 'Sanctions list refreshed', timestamp: minutesAgo(120), severity: 'info' },
  { id: 't3', label: 'Dark-vessel signal raised', timestamp: minutesAgo(42), severity: 'warning' },
  { id: 't4', label: 'Operator approved review', timestamp: minutesAgo(20), severity: 'success' },
  { id: 't5', label: 'PSC pre-brief delivered', timestamp: minutesAgo(8), severity: 'info' },
];

export function GovernanceDock() {
  return (
    <section className="space-y-6 mt-10">
      <header>
        <h2 className="text-xl font-display font-bold text-slate-100">Governance Dock</h2>
        <p className="text-slate-400 mt-1 text-sm">
          Shared OMNIA shell surface — policy posture, evidence chain, ownership, deployment.
        </p>
      </header>

      <StatusChipGroup
        chips={[
          { status: 'healthy', label: 'AIS pipeline' },
          { status: 'enforced', label: 'OPA policies' },
          { status: 'advisory', label: 'Agent gateway' },
          { status: 'approved', label: 'Last release' },
        ]}
      />

      <PolicySummaryBar
        policies={[
          { id: 'maritime.sanctions', name: 'Sanctions screen', status: 'enforced' },
          { id: 'maritime.dark-vessel', name: 'Dark vessel review', status: 'requires-approval' },
          { id: 'maritime.psc.brief', name: 'PSC pre-brief draft', status: 'advisory' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OmniaEvidencePanel
          title="Latest decision evidence chain"
          entries={EVIDENCE}
          correlationId="vessels-2026-05-03-7c1e"
          auditId="audit-7c1e9f"
        />
        <OmniaTimeline title="Operations timeline (last 3h)" events={TIMELINE} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OwnershipMeta
          ownerTeam="vessels-platform-team"
          system="Vessels Maritime Intelligence"
          domain="maritime"
          lifecycle="production"
          healthEndpoint="/health"
          runbookUrl="https://backstage.szl/catalog/component/vessels/runbook"
          scorecard={{ score: 86, scale: 100 }}
          lastDeploy={minutesAgo(60 * 8)}
        />
        <DeploymentContext
          environment="production"
          deploymentStatus="healthy"
          version="2026.05.03-r4"
          uptimeSeconds={60 * 60 * 36}
          probes={[
            { name: 'web', status: 'healthy', latencyMs: 42 },
            { name: 'api', status: 'healthy', latencyMs: 18 },
            { name: 'ais-stream', status: 'degraded', latencyMs: 240 },
          ]}
          slo={{ name: 'availability', target: 99.9, current: 99.94 }}
        />
      </div>
    </section>
  );
}

export default GovernanceDock;
