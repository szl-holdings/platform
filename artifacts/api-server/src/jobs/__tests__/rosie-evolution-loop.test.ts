/**
 * Operational integration test for the ROSIE evolution loop's
 * Hoeffding-LCB gate.
 *
 * Covers the *real* server-side execution path (not just the pure
 * math): the in-process `proposeTuningInProcess` handler that the
 * scheduled tick calls, plus an end-to-end `runRosieEvolutionTick`
 * that drains a seeded drift detector through that handler.
 *
 * Source: docs/ingestion/agent-research.md (Hoeffding LCB upgrade).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const insertedRows: any[] = [];

vi.mock('@szl-holdings/db', () => {
  const formulaTuningProposalsTable: any = {
    id: { name: 'id' },
    formulaId: { name: 'formula_id' },
    parameter: { name: 'parameter' },
    proposalScore: { name: 'proposal_score' },
    evidence: { name: 'evidence' },
    status: { name: 'status' },
  };
  const empty: any = {};
  const db = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
          limit: vi.fn().mockResolvedValue([]),
        }),
        orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((row: any) => ({
        returning: vi.fn().mockImplementation(async () => {
          const inserted = { id: insertedRows.length + 1, createdAt: new Date(), updatedAt: new Date(), ...row };
          insertedRows.push(inserted);
          return [inserted];
        }),
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    }),
  };

  return {
    db,
    formulasTable: empty,
    formulaVersionsTable: empty,
    formulaInvocationsTable: empty,
    formulaTuningProposalsTable,
    usersTable: empty,
  };
});

vi.mock('drizzle-orm', () => ({
  and: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  sql: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { proposeTuningInProcess } from '../../routes/a11oy-formulas-api.js';
import {
  runRosieEvolutionTick,
  _rosieEvolutionDetectorForTest,
} from '../rosie-evolution-loop.js';

/**
 * The formula `risk-score` has a `cap` parameter (range [1_000, 1e9]).
 * Used as the carrier for these proposals — any registered formula
 * with a numeric parameter works.
 */
const FORMULA = 'risk-score';
const PARAM = 'cap';

function mkBody(samples: number, gap: number) {
  return {
    formulaId: FORMULA,
    fromVersion: '1.0.0',
    parameter: PARAM,
    oldValue: 1_000_000,
    candidateValue: 1_200_000,
    observedGap: gap,
    samples,
    gapHistory: Array.from({ length: samples }, () => gap),
    irreversibility: 0.1,
    thesisCitation: 'docs/thesis/v10-canonical.md §6.1',
  };
}

beforeEach(() => {
  insertedRows.length = 0;
  vi.unstubAllEnvs();
});

describe('proposeTuningInProcess + Hoeffding LCB gate (operational)', () => {
  it('default (no env) preserves prior behaviour — thin evidence still proposed', async () => {
    const result = await proposeTuningInProcess(mkBody(30, 0.15));
    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect((result.envelope as any).data.accepted).toBe(true);
    expect(insertedRows).toHaveLength(1);
    // gapLcb should still be surfaced in evidence even when the gate is off,
    // so operators can see it.
    expect(insertedRows[0].evidence.gapLcb).toBeTypeOf('number');
  });

  it('ROSIE_GAP_LCB_MIN=0.10 rejects thin evidence (n=30 @ gap=15%)', async () => {
    vi.stubEnv('ROSIE_GAP_LCB_MIN', '0.10');
    const result = await proposeTuningInProcess(mkBody(30, 0.15));
    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect((result.envelope as any).data.accepted).toBe(false);
    expect((result.envelope as any).data.reason).toMatch(/Hoeffding|LCB|n=30/);
    expect(insertedRows).toHaveLength(0);
  });

  it('ROSIE_GAP_LCB_MIN=0.10 accepts thick evidence (n=3000 @ gap=15%)', async () => {
    vi.stubEnv('ROSIE_GAP_LCB_MIN', '0.10');
    const result = await proposeTuningInProcess(mkBody(3000, 0.15));
    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    expect((result.envelope as any).data.accepted).toBe(true);
    expect(insertedRows).toHaveLength(1);
    const ev = insertedRows[0].evidence;
    expect(ev.gapLcb).toBeGreaterThan(0.10);
    expect(ev.gapLcb).toBeLessThan(0.15);
  });

  it('rejects unknown formula with 404 (envelope contract preserved)', async () => {
    const result = await proposeTuningInProcess({ ...mkBody(3000, 0.15), formulaId: 'no-such-formula' });
    expect(result.status).toBe(404);
    expect(result.envelope.ok).toBe(false);
  });
});

describe('runRosieEvolutionTick (end-to-end through in-process bridge)', () => {
  it('drains a seeded drift bucket through the gate and into the DB', async () => {
    vi.stubEnv('ROSIE_GAP_LCB_MIN', '0.10');
    const detector = _rosieEvolutionDetectorForTest();
    // Seed sustained evidence: baseline 1.0, observed 0.75 → gap ~= 0.25
    // per sample. The detector keeps a rolling window (default 200), so at
    // n=200 the Hoeffding 95% radius is ~0.087; LCB ~= 0.16 > gapLcbMin.
    // We push more than the window to confirm the cap doesn't break things.
    for (let i = 0; i < 600; i++) {
      detector.record({
        formulaId: FORMULA,
        parameter: PARAM,
        observed: 0.75,
        baseline: 1.0,
        oldValue: 1_000_000,
        candidateValue: 1_200_000,
        fromVersion: '1.0.0',
        thesisCitation: 'docs/thesis/v10-canonical.md §6.1',
      });
    }
    const summary = await runRosieEvolutionTick();
    expect(summary.drained).toBeGreaterThan(0);
    expect(summary.proposals).toBeGreaterThanOrEqual(1);
    expect(insertedRows.length).toBeGreaterThanOrEqual(1);
    const ev = insertedRows[0].evidence;
    expect(ev.gapLcb).toBeGreaterThan(0.10);
  });

  it('thin-evidence tick produces only noops under the gate (nothing in DB)', async () => {
    vi.stubEnv('ROSIE_GAP_LCB_MIN', '0.10');
    const detector = _rosieEvolutionDetectorForTest();
    // 30 samples — Hoeffding radius dominates, LCB drops below 0.10.
    for (let i = 0; i < 30; i++) {
      detector.record({
        formulaId: FORMULA,
        parameter: PARAM,
        observed: 0.85,
        baseline: 1.0,
        oldValue: 1_000_000,
        candidateValue: 1_200_000,
        fromVersion: '1.0.0',
        thesisCitation: 'docs/thesis/v10-canonical.md §6.1',
      });
    }
    const summary = await runRosieEvolutionTick();
    expect(summary.proposals).toBe(0);
    expect(summary.noops).toBeGreaterThanOrEqual(1);
    expect(insertedRows).toHaveLength(0);
  });
});
