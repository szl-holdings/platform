import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ConnectorRunner } from '../runner';
import type {
  Connector,
  ConnectorContext,
  OntologyWrite,
  SyncResult,
} from '../types';
import type { DriftBaseline } from '../drift';

interface RecorderState {
  audits: Array<{ connectorId: string; status: string; summary: Record<string, unknown> }>;
  registered: OntologyWrite[];
  baseline: DriftBaseline | null;
  escalated: SyncResult[];
}

function makeHooks(state: RecorderState) {
  return {
    appendAudit: async (event: { connectorId: string; status: string; summary: Record<string, unknown> }) => {
      state.audits.push(event);
      return `evt-${state.audits.length}`;
    },
    registerEntity: async (write: OntologyWrite) => {
      state.registered.push(write);
    },
    loadBaseline: async () => state.baseline,
    saveBaseline: async (baseline: DriftBaseline) => {
      state.baseline = baseline;
    },
    escalate: async (result: SyncResult) => {
      state.escalated.push(result);
    },
  };
}

const PingSchema = z.object({ id: z.string(), v: z.number() });

function makeConnector(overrides: Partial<Connector<{ id: string; v: number }>> = {}): Connector<{
  id: string;
  v: number;
}> {
  return {
    id: 'ping',
    name: 'Ping',
    kind: 'other',
    description: 'unit test',
    source: 'mock',
    schedule: { intervalSec: 60, maxRetries: 2, timeoutMs: 1_000 },
    recordSchema: PingSchema,
    fetch: async (_ctx: ConnectorContext) => [
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ],
    transform: (r) => ({
      kind: 'ping',
      namespace: 'test',
      identifier: r.id,
      properties: { v: r.v },
    }),
    ...overrides,
  };
}

describe('ConnectorRunner', () => {
  it('runs a happy-path sync, registers entities, writes audit, captures baseline', async () => {
    const state: RecorderState = { audits: [], registered: [], baseline: null, escalated: [] };
    const runner = new ConnectorRunner(makeHooks(state));
    const result = await runner.run(makeConnector());
    expect(result.status).toBe('ok');
    expect(result.recordsFetched).toBe(2);
    expect(result.entitiesRegistered).toBe(2);
    expect(result.ledgerEventId).toBe('evt-1');
    expect(state.registered.map((e) => e.identifier).sort()).toEqual(['a', 'b']);
    expect(state.baseline).not.toBeNull();
    expect(state.baseline?.recordCount).toBe(2);
    expect(state.escalated).toHaveLength(0);
  });

  it('retries on transient failure and reports retried status', async () => {
    let attempts = 0;
    const conn = makeConnector({
      fetch: async () => {
        attempts += 1;
        if (attempts < 2) throw new Error('transient');
        return [{ id: 'a', v: 1 }];
      },
    });
    const state: RecorderState = { audits: [], registered: [], baseline: null, escalated: [] };
    const runner = new ConnectorRunner(makeHooks(state));
    const result = await runner.run(conn);
    expect(result.status).toBe('retried');
    expect(result.attempts).toBe(2);
    expect(result.entitiesRegistered).toBe(1);
  });

  it('dead-letters after exhausting retries and escalates', async () => {
    const conn = makeConnector({
      fetch: async () => {
        throw new Error('boom');
      },
    });
    const state: RecorderState = { audits: [], registered: [], baseline: null, escalated: [] };
    const runner = new ConnectorRunner(makeHooks(state));
    const result = await runner.run(conn);
    expect(result.status).toBe('dead-letter');
    expect(result.errorMessage).toBe('boom');
    expect(state.escalated).toHaveLength(1);
  });

  it('detects volume drift and escalates when severity is critical', async () => {
    const state: RecorderState = {
      audits: [],
      registered: [],
      baseline: { connectorId: 'ping', recordCount: 100, fieldNames: ['id', 'v'], capturedAt: 'x' },
      escalated: [],
    };
    const runner = new ConnectorRunner(makeHooks(state));
    const result = await runner.run(makeConnector());
    expect(result.drift?.severity).toBe('critical');
    expect(state.escalated).toHaveLength(1);
  });

  it('detects schema drift when fields disappear', async () => {
    const state: RecorderState = {
      audits: [],
      registered: [],
      baseline: {
        connectorId: 'ping',
        recordCount: 2,
        fieldNames: ['id', 'v', 'extra'],
        capturedAt: 'x',
      },
      escalated: [],
    };
    const runner = new ConnectorRunner(makeHooks(state));
    const result = await runner.run(makeConnector());
    expect(result.drift?.removedFields).toContain('extra');
    expect(result.drift?.severity).toBe('critical');
  });

  it('skips fetch on dryRun and writes a skipped audit event', async () => {
    const state: RecorderState = { audits: [], registered: [], baseline: null, escalated: [] };
    const runner = new ConnectorRunner(makeHooks(state));
    const result = await runner.run(makeConnector(), { dryRun: true });
    expect(result.status).toBe('skipped');
    expect(state.audits[0]?.summary).toEqual({ reason: 'dryRun' });
    expect(state.registered).toHaveLength(0);
  });
});
