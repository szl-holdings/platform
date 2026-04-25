import type { ActionBrief } from '../schema';

export interface ActionRailInterface {
  recommend(signalId: string): Promise<ActionBrief[]>;
  list(): Promise<{ actions: ActionBrief[]; total: number }>;
  get(id: string): Promise<ActionBrief | undefined>;
}

const DEMO_ACTIONS: ActionBrief[] = [
  {
    id: 'act-001',
    title: 'Executive Outreach to At-Risk Mid-Market Accounts',
    description: 'Initiate direct executive-to-executive outreach for the three cancelling accounts. Offer a 60-day credit and dedicated CSM assignment.',
    vertical: 'lyte-revenue',
    status: 'approved',
    recommendedBy: 'causal-core-v1',
    assignedTo: 'VP Revenue, Lyte',
    priority: 'urgent',
    estimatedImpact: 'Retain $180K ARR; reduce churn contagion risk by 60%',
    requiresApproval: true,
    approvalTier: 'executive',
    linkedSignalIds: ['sig-lyte-002'],
    linkedOutcomeIds: ['out-001'],
    proofPacketId: 'prf-003',
    createdAt: new Date(Date.now() - 17 * 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - 16 * 3_600_000).toISOString(),
  },
  {
    id: 'act-002',
    title: 'Emergency Covenant Remediation: Lease-Up Campaign',
    description: 'Activate emergency broker network for the Wilshire office portfolio. Authorize below-market concessions up to 3 months free rent to close deals within 30 days.',
    vertical: 'terra-real-estate',
    status: 'pending_approval',
    recommendedBy: 'causal-core-v1',
    priority: 'urgent',
    estimatedImpact: 'Reduce vacancy from 34% to <30% within 30 days; resolve lender covenant breach',
    requiresApproval: true,
    approvalTier: 'executive',
    linkedSignalIds: ['sig-terra-001'],
    linkedOutcomeIds: ['out-002'],
    createdAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
  },
  {
    id: 'act-003',
    title: 'Notify Lender: Covenant Remediation Plan Submission',
    description: 'Prepare and submit covenant remediation plan to lender within 48 hours per loan agreement terms.',
    vertical: 'terra-real-estate',
    status: 'recommended',
    recommendedBy: 'causal-core-v1',
    priority: 'urgent',
    estimatedImpact: 'Avoid debt acceleration on $28M facility; preserve lender relationship',
    requiresApproval: true,
    approvalTier: 'executive',
    linkedSignalIds: ['sig-terra-001'],
    linkedOutcomeIds: ['out-002'],
    createdAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
  },
  {
    id: 'act-004',
    title: 'Dispatch SIRE 2.0 Remediation Team to 4 Non-Compliant Tankers',
    description: 'Deploy specialist SIRE 2.0 compliance team to each vessel for targeted deficiency remediation and crew coaching.',
    vertical: 'vessels-maritime',
    status: 'recommended',
    recommendedBy: 'causal-core-v1',
    priority: 'high',
    estimatedImpact: 'Bring all 4 vessels to SIRE 2.0 score ≥75 within 8 weeks, protecting $4.8M charter revenue',
    requiresApproval: true,
    approvalTier: 'operator',
    linkedSignalIds: ['sig-vessels-002'],
    linkedOutcomeIds: ['out-004'],
    createdAt: new Date(Date.now() - 12 * 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3_600_000).toISOString(),
  },
  {
    id: 'act-005',
    title: 'Resolve State Engine Snapshot Contention',
    description: 'Apply state engine snapshot isolation patch (PR #1847) to resolve P95 latency regression. Schedule maintenance window for 02:00 UTC.',
    vertical: 'alloy-core',
    status: 'executing',
    recommendedBy: 'causal-core-v1',
    assignedTo: 'Platform Engineering, A11oy',
    priority: 'high',
    estimatedImpact: 'Restore P95 signal ingestion latency to <200ms; clear proof verification backlog',
    requiresApproval: false,
    approvalTier: 'auto',
    linkedSignalIds: ['sig-alloy-001', 'sig-alloy-002'],
    linkedOutcomeIds: ['out-005'],
    createdAt: new Date(Date.now() - 0.75 * 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - 0.25 * 3_600_000).toISOString(),
  },
];

class InMemoryActionRail implements ActionRailInterface {
  private store: Map<string, ActionBrief> = new Map(DEMO_ACTIONS.map(a => [a.id, a]));

  async recommend(signalId: string): Promise<ActionBrief[]> {
    return Array.from(this.store.values()).filter(a => a.linkedSignalIds.includes(signalId));
  }

  async list(): Promise<{ actions: ActionBrief[]; total: number }> {
    const actions = Array.from(this.store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { actions, total: actions.length };
  }

  async get(id: string): Promise<ActionBrief | undefined> {
    return this.store.get(id);
  }
}

export const actionRail: ActionRailInterface = new InMemoryActionRail();
