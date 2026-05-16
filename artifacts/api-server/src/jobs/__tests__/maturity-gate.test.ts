import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockRows: any[] = [];

vi.mock('@szl-holdings/db', () => {
  const platformJobRunsTable: any = {
    workflowType: { name: 'workflow_type' },
    startedAt: { name: 'started_at' },
  };
  const auditEventsTable: any = {};

  const orderByChain = {
    limit: vi.fn().mockImplementation(async () => mockRows),
  };
  const whereChain = {
    orderBy: vi.fn().mockReturnValue(orderByChain),
    limit: vi.fn().mockImplementation(async () => mockRows),
  };
  const fromChain = {
    where: vi.fn().mockReturnValue(whereChain),
    orderBy: vi.fn().mockReturnValue(orderByChain),
  };
  const db = {
    select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue(fromChain) }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    }),
  };

  return { db, platformJobRunsTable, auditEventsTable };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  and: vi.fn(),
  gte: vi.fn(),
  sql: vi.fn(),
}));

import {
  checkPayloadMaturityGate,
  CPS_PAYLOAD_REGISTRY,
} from '../adversary-emulation-loop.js';

const TEST_PAYLOAD_ID = CPS_PAYLOAD_REGISTRY[0]!.id;

function seedScorecard(overrides: Partial<{
  compositeConfidence: number;
  detectionRate: number;
  status: 'pass' | 'regression' | 'fail';
  coverageGaps: string[];
}>) {
  mockRows.length = 0;
  mockRows.push({
    workflowType: 'adversary_emulation_loop',
    startedAt: new Date(),
    result: {
      runId: 'test-run',
      ranAt: new Date().toISOString(),
      overallCompositeScore: 0.9,
      durationMs: 100,
      regressions: [],
      scorecards: [
        {
          payloadId: TEST_PAYLOAD_ID,
          compositeConfidence: overrides.compositeConfidence ?? 0.9,
          detectionRate: overrides.detectionRate ?? 0.9,
          containmentRate: 0.9,
          mttdSeconds: 60,
          mttcSeconds: 120,
          blastRadiusPrevented: 0.95,
          falsePositiveBurden: 0.05,
          analystHoursSaved: 10,
          status: overrides.status ?? 'pass',
          coverageGaps: overrides.coverageGaps ?? [],
        },
      ],
    },
  });
}

describe('checkPayloadMaturityGate', () => {
  beforeEach(() => {
    mockRows.length = 0;
  });

  it('allows promotion when composite confidence >= 0.75 and status is pass', async () => {
    seedScorecard({ compositeConfidence: 0.85, status: 'pass', detectionRate: 0.9 });
    const gate = await checkPayloadMaturityGate(TEST_PAYLOAD_ID);
    expect(gate.allowed).toBe(true);
    expect(gate.blockers).toEqual([]);
    expect(gate.compositeConfidence).toBe(0.85);
  });

  it('blocks promotion when compositeConfidence < 0.75', async () => {
    seedScorecard({
      compositeConfidence: 0.6,
      status: 'pass',
      detectionRate: 0.9,
      coverageGaps: ['MFA bypass not detected', 'Lateral movement gap on host segment'],
    });
    const gate = await checkPayloadMaturityGate(TEST_PAYLOAD_ID);
    expect(gate.allowed).toBe(false);
    expect(gate.regressionInLastRun).toBe(false);
    expect(gate.blockers.some((b) => b.includes('Composite confidence'))).toBe(true);
    expect(gate.coverageGaps).toEqual([
      'MFA bypass not detected',
      'Lateral movement gap on host segment',
    ]);
    // Coverage gaps are surfaced as blockers when the gate fails
    expect(gate.blockers.some((b) => b.includes('Coverage gap: MFA bypass not detected'))).toBe(true);
    expect(
      gate.blockers.some((b) => b.includes('Coverage gap: Lateral movement gap on host segment')),
    ).toBe(true);
  });

  it("blocks promotion when status === 'regression'", async () => {
    seedScorecard({
      compositeConfidence: 0.82,
      status: 'regression',
      detectionRate: 0.9,
      coverageGaps: ['Detection rule drift in week-over-week run'],
    });
    const gate = await checkPayloadMaturityGate(TEST_PAYLOAD_ID);
    expect(gate.allowed).toBe(false);
    expect(gate.regressionInLastRun).toBe(true);
    expect(gate.blockers.some((b) => b.toLowerCase().includes('regression'))).toBe(true);
    expect(
      gate.blockers.some((b) => b.includes('Coverage gap: Detection rule drift in week-over-week run')),
    ).toBe(true);
  });

  it('blocks promotion when no scorecard exists', async () => {
    mockRows.length = 0;
    const gate = await checkPayloadMaturityGate(TEST_PAYLOAD_ID);
    expect(gate.allowed).toBe(false);
    expect(gate.compositeConfidence).toBeNull();
    expect(gate.blockers.some((b) => b.includes('No emulation scorecard'))).toBe(true);
  });
});
