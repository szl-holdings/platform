import type { WorkcellDefinition } from '../schema';

export interface WorkcellsInterface {
  list(): Promise<{ workcells: WorkcellDefinition[]; total: number }>;
  get(id: string): Promise<WorkcellDefinition | undefined>;
}

const DEMO_WORKCELLS: WorkcellDefinition[] = [
  {
    id: 'wc-lyte-churn',
    name: 'Lyte Churn Response Workcell',
    description: 'Detects mid-market churn signals, runs retention analysis, drafts executive outreach, and queues approval.',
    vertical: 'lyte-revenue',
    status: 'running',
    operatorId: 'op-csm-lyte',
    tools: ['crm-read', 'health-score-read', 'email-draft', 'approval-request'],
    approvalTier: 'executive',
    maxRunDurationMs: 3_600_000,
    lastRunAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
    lastRunStatus: 'running',
    proofPacketIds: ['prf-001', 'prf-002', 'prf-003'],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
  },
  {
    id: 'wc-terra-covenant',
    name: 'Terra Covenant Breach Response Workcell',
    description: 'Monitors covenant thresholds, drafts lender notification, and coordinates lease-up emergency actions.',
    vertical: 'terra-real-estate',
    status: 'idle',
    operatorId: 'op-portfolio-terra',
    tools: ['covenant-monitor', 'lease-read', 'document-draft', 'lender-notify', 'approval-request'],
    approvalTier: 'executive',
    maxRunDurationMs: 7_200_000,
    proofPacketIds: [],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
  },
  {
    id: 'wc-vessels-psc',
    name: 'Vessels PSC Risk Workcell',
    description: 'Tracks Port State Control deficiency accumulation and triggers remediation dispatch when detention risk threshold is approached.',
    vertical: 'vessels-maritime',
    status: 'idle',
    operatorId: 'op-fleet-vessels',
    tools: ['psc-deficiency-read', 'risk-score-calculate', 'remediation-dispatch', 'approval-request'],
    approvalTier: 'operator',
    maxRunDurationMs: 1_800_000,
    proofPacketIds: [],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: now(),
  },
  {
    id: 'wc-aegis-threat',
    name: 'Aegis Threat Intelligence Workcell',
    description: 'Ingests threat intelligence feeds, performs TTP matching, generates attribution assessments, and escalates to security leads.',
    vertical: 'aegis-defense',
    status: 'running',
    operatorId: 'op-ti-aegis',
    tools: ['threat-intel-read', 'ttp-matcher', 'attribution-engine', 'escalation-notify'],
    approvalTier: 'executive',
    maxRunDurationMs: 900_000,
    lastRunAt: new Date(Date.now() - 0.25 * 3_600_000).toISOString(),
    lastRunStatus: 'running',
    proofPacketIds: [],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 0.25 * 3_600_000).toISOString(),
  },
  {
    id: 'wc-a11oy-fabric-health',
    name: 'A11oy Fabric Health Workcell',
    description: 'Continuously monitors fabric layer health, detects latency anomalies, applies auto-remediation patches within approved parameters.',
    vertical: 'alloy-core',
    status: 'running',
    operatorId: 'op-platform-a11oy',
    tools: ['fabric-metrics-read', 'anomaly-detect', 'patch-apply', 'proof-record'],
    approvalTier: 'auto',
    maxRunDurationMs: 300_000,
    lastRunAt: new Date(Date.now() - 0.1 * 3_600_000).toISOString(),
    lastRunStatus: 'running',
    proofPacketIds: ['prf-004', 'prf-005'],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: new Date(Date.now() - 0.1 * 3_600_000).toISOString(),
  },
];

function now() { return new Date().toISOString(); }

class InMemoryWorkcells implements WorkcellsInterface {
  private store: Map<string, WorkcellDefinition> = new Map(DEMO_WORKCELLS.map(w => [w.id, w]));

  async list() {
    const workcells = Array.from(this.store.values());
    return { workcells, total: workcells.length };
  }

  async get(id: string) {
    return this.store.get(id);
  }
}

export const workcells: WorkcellsInterface = new InMemoryWorkcells();
