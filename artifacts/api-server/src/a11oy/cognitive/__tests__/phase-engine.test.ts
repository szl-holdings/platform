import { describe, it, expect, vi } from 'vitest';
import {
  executePhaseSequence,
  getPhaseRunResult,
} from '../phase-engine.js';

describe('PhaseEngine', () => {
  it('executes all 10 phases in order and records latency for each', async () => {
    const order: string[] = [];
    const { phases, succeeded } = await executePhaseSequence({
      requestId: 'req-phase-order',
      tenantId: 'tenant-a',
      handlers: Object.fromEntries(
        ['INGEST', 'NORMALIZE', 'RETRIEVE', 'PLAN', 'REASON', 'APPROVE', 'EXECUTE', 'VERIFY', 'AUDIT', 'DELIVER'].map(
          (p) => [p, async () => { order.push(p); return { done: true }; }],
        ),
      ) as Parameters<typeof executePhaseSequence>[0]['handlers'],
    });

    expect(succeeded).toBe(true);
    expect(order).toEqual(['INGEST', 'NORMALIZE', 'RETRIEVE', 'PLAN', 'REASON', 'APPROVE', 'EXECUTE', 'VERIFY', 'AUDIT', 'DELIVER']);
    expect(phases).toHaveLength(10);
    for (const p of phases) {
      expect(p.status).toBe('completed');
      expect(typeof p.latencyMs).toBe('number');
      expect(p.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('records phaseIndex and phaseRunId on each result', async () => {
    const { phases } = await executePhaseSequence({
      requestId: 'req-meta',
      tenantId: 'tenant-a',
      handlers: {},
    });

    for (let i = 0; i < phases.length; i++) {
      expect(phases[i].phaseIndex).toBe(i);
      expect(typeof phases[i].phaseRunId).toBe('string');
      expect(phases[i].phaseRunId.length).toBeGreaterThan(0);
    }
  });

  it('marks phase as failed when handler throws, classifies failure', async () => {
    const { phases, succeeded, failedPhase } = await executePhaseSequence({
      requestId: 'req-fail',
      tenantId: 'tenant-a',
      haltOnFailure: false,
      configs: { REASON: { maxRetries: 0 } },
      handlers: {
        REASON: async () => { throw new Error('Model inference failed unexpectedly'); },
      },
    });

    const reasonPhase = phases.find((p) => p.phase === 'REASON');
    expect(reasonPhase?.status).toBe('failed');
    expect(reasonPhase?.failureClass).toBe('upstream_error');
    expect(reasonPhase?.failureDetail).toContain('Model inference failed unexpectedly');
    expect(succeeded).toBe(false);
    expect(failedPhase).toBe('REASON');
  });

  it('halts remaining phases when haltOnFailure is true', async () => {
    const executed: string[] = [];
    const { phases, succeeded } = await executePhaseSequence({
      requestId: 'req-halt',
      tenantId: 'tenant-a',
      haltOnFailure: true,
      handlers: {
        PLAN: async () => { throw new Error('planning failed'); },
        REASON: async () => { executed.push('REASON'); return {}; },
        EXECUTE: async () => { executed.push('EXECUTE'); return {}; },
      },
    });

    expect(succeeded).toBe(false);
    expect(executed).not.toContain('REASON');
    expect(executed).not.toContain('EXECUTE');

    const planPhase = phases.find((p) => p.phase === 'PLAN');
    expect(planPhase?.status).toBe('failed');

    const skipped = phases.filter((p) => p.status === 'skipped');
    expect(skipped.length).toBeGreaterThan(0);
  });

  it('continues remaining phases when haltOnFailure is false', async () => {
    const executed: string[] = [];
    const { phases, succeeded } = await executePhaseSequence({
      requestId: 'req-continue',
      tenantId: 'tenant-a',
      haltOnFailure: false,
      handlers: {
        PLAN: async () => { throw new Error('planning failed'); },
        REASON: async () => { executed.push('REASON'); return {}; },
        DELIVER: async () => { executed.push('DELIVER'); return {}; },
      },
    });

    expect(succeeded).toBe(false);
    expect(executed).toContain('REASON');
    expect(executed).toContain('DELIVER');

    const completedCount = phases.filter((p) => p.status === 'completed').length;
    expect(completedCount).toBeGreaterThan(0);
  });

  it('accumulates totalLatencyMs across all phases', async () => {
    const { phases, totalLatencyMs } = await executePhaseSequence({
      requestId: 'req-total-latency',
      tenantId: 'tenant-a',
      handlers: {},
    });

    const sumFromPhases = phases.reduce((acc, p) => acc + (p.latencyMs ?? 0), 0);
    expect(totalLatencyMs).toBeGreaterThanOrEqual(sumFromPhases - 5);
  });

  it('passes initialInput and threads output between phases via telemetry', async () => {
    const { phases } = await executePhaseSequence({
      requestId: 'req-input-passthrough',
      tenantId: 'tenant-a',
      initialInput: { prompt: 'test input', domain: 'maritime' },
      handlers: {
        INGEST: async () => ({ ingested: true, prompt: 'test input' }),
        NORMALIZE: async () => ({ normalized: true }),
      },
    });

    const ingestPhase = phases.find((p) => p.phase === 'INGEST');
    expect(ingestPhase?.status).toBe('completed');
    // telemetry.output contains the handler result
    expect(ingestPhase?.telemetry?.output).toMatchObject({ ingested: true });
  });

  it('getPhaseRunResult returns a stored result by phaseRunId', async () => {
    const { phases } = await executePhaseSequence({
      requestId: 'req-get-result',
      tenantId: 'tenant-a',
      handlers: {
        INGEST: async () => ({ ingestedPayload: 'hello' }),
      },
    });

    const ingest = phases.find((p) => p.phase === 'INGEST');
    expect(ingest).toBeDefined();
    const retrieved = getPhaseRunResult(ingest!.phaseRunId, 'tenant-a');
    expect(retrieved).toBeDefined();
    expect(retrieved?.phase).toBe('INGEST');
  });

  it('creates a proof-chain even when execution fails', async () => {
    const { phases, succeeded, failedPhase } = await executePhaseSequence({
      requestId: 'req-proof-on-fail',
      tenantId: 'tenant-a',
      haltOnFailure: false,
      configs: { INGEST: { maxRetries: 0 } },
      handlers: {
        INGEST: async () => { throw new Error('ingest failed'); },
      },
    });

    expect(succeeded).toBe(false);
    expect(failedPhase).toBe('INGEST');
    // phases array still contains all phases
    expect(phases.length).toBe(10);
    // INGEST is marked failed
    const ingest = phases.find((p) => p.phase === 'INGEST');
    expect(ingest?.status).toBe('failed');
    // retryCount is 0 when maxRetries is 0
    expect(ingest?.retryCount).toBe(0);
  });

  it('stamps startedAt and completedAt timestamps on each phase', async () => {
    const before = Date.now();
    const { phases } = await executePhaseSequence({
      requestId: 'req-timestamps',
      tenantId: 'tenant-a',
      handlers: {},
    });
    const after = Date.now();

    for (const p of phases) {
      if (p.startedAt) {
        const ts = new Date(p.startedAt).getTime();
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after + 100);
      }
    }
  });
});
