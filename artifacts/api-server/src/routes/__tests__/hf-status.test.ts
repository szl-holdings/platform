/**
 * Integration tests for GET /hf/status — modelRegistry section.
 *
 * Covers the new gate breakdown (registryActive, licenseApproved,
 * sensitivityMatch, liveInferenceAllowed, productionApproved, allPass),
 * failoverChain object, ops counters, and fullyGated summary that were
 * added as part of the HF inference operator workflow API.
 *
 * All external network calls and DB queries are mocked.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted table stubs ────────────────────────────────────────────────────────

const { hfModelRegistryTable, hfFailoverChainsTable } = vi.hoisted(() => ({
  hfModelRegistryTable: {
    __t: 'hfModelRegistryTable',
    createdAt: 'createdAt',
    failoverChainId: 'failoverChainId',
    id: 'id',
  } as unknown,
  hfFailoverChainsTable: {
    __t: 'hfFailoverChainsTable',
    id: 'id',
  } as unknown,
}));

// ── In-memory stores ──────────────────────────────────────────────────────────

type RegistryRow = {
  id: number;
  modelId: string;
  displayName: string;
  lifecycleState: string;
  gateLicenseApproved: boolean;
  gateSensitivityMatch: boolean;
  gateLiveInferenceAllowed: boolean;
  gateProductionApproved: boolean;
  failoverChainId: number | null;
  lastInferenceAt: Date | null;
  recentFailureCount: number;
  createdAt: Date;
};

type ChainRow = {
  id: number;
  lane: string;
  primaryModelId: string;
  fallbackModelIds: string[];
  isActive: boolean;
};

let registryStore: RegistryRow[] = [];
let chainsStore: ChainRow[] = [];

// ── DB mock ───────────────────────────────────────────────────────────────────
// importOriginal spreads all real table/schema exports (so transitive imports
// like ml-pipeline that need mlModelVersions, etc. don't fail). Only `db`
// and the two HF table stubs are overridden.

vi.mock('@szl-holdings/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@szl-holdings/db')>();

  const makeChain = (data: () => unknown[]) => ({
    where: () => makeChain(data),
    orderBy: () => makeChain(data),
    limit: (n: number) => makeChain(() => data().slice(0, n)),
    then: (
      onFulfilled: (v: unknown[]) => unknown,
      onRejected?: (e: unknown) => unknown,
    ) => Promise.resolve(data()).then(onFulfilled, onRejected),
  });

  return {
    ...actual,
    hfModelRegistryTable,
    hfFailoverChainsTable,
    db: {
      ...((actual as Record<string, unknown>).db as object),
      select: () => ({
        from: (table: unknown) => {
          if (table === hfModelRegistryTable)
            return makeChain(() => [...registryStore]);
          if (table === hfFailoverChainsTable)
            return makeChain(() => [...chainsStore]);
          return makeChain(() => []);
        },
      }),
    },
  };
});

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return { ...actual };
});

// ── Silence external fetches ──────────────────────────────────────────────────

vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'mocked' }),
);

// ── App factory ───────────────────────────────────────────────────────────────

const { default: hfStatusRouter } = await import('../hf-status.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', hfStatusRouter as Parameters<typeof app.use>[1]);
  return app;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let nextId = 1;

function makeRegistryRow(overrides: Partial<RegistryRow> = {}): RegistryRow {
  return {
    id: nextId++,
    modelId: 'Qwen/Qwen3-8B',
    displayName: 'Qwen3 8B',
    lifecycleState: 'active',
    gateLicenseApproved: true,
    gateSensitivityMatch: true,
    gateLiveInferenceAllowed: true,
    gateProductionApproved: true,
    failoverChainId: null,
    lastInferenceAt: null,
    recentFailureCount: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /hf/status — modelRegistry section', () => {
  beforeEach(() => {
    registryStore = [];
    chainsStore = [];
    nextId = 1;
  });

  it('includes modelRegistry with empty models and summary when registry is empty', async () => {
    const res = await request(buildApp()).get('/hf/status');

    expect(res.status).toBe(200);
    expect(res.body.modelRegistry).toMatchObject({
      models: [],
      summary: { total: 0, active: 0, blocked: 0, fullyGated: 0 },
    });
  });

  it('returns correct gate breakdown for an active fully-gated model', async () => {
    registryStore.push(makeRegistryRow({
      modelId: 'Qwen/Qwen3-8B',
      lifecycleState: 'active',
      gateLicenseApproved: true,
      gateSensitivityMatch: true,
      gateLiveInferenceAllowed: true,
      gateProductionApproved: true,
    }));

    const res = await request(buildApp()).get('/hf/status');

    expect(res.status).toBe(200);
    const { models, summary } = res.body.modelRegistry;
    expect(models).toHaveLength(1);

    const model = models[0];
    expect(model.modelId).toBe('Qwen/Qwen3-8B');
    expect(model.lifecycleState).toBe('active');
    expect(model.gates.registryActive).toBe(true);
    expect(model.gates.licenseApproved).toBe(true);
    expect(model.gates.sensitivityMatch).toBe(true);
    expect(model.gates.liveInferenceAllowed).toBe(true);
    expect(model.gates.productionApproved).toBe(true);
    expect(model.gates.allPass).toBe(true);

    expect(summary.total).toBe(1);
    expect(summary.active).toBe(1);
    expect(summary.blocked).toBe(0);
    expect(summary.fullyGated).toBe(1);
  });

  it('sets registryActive=false and allPass=false when lifecycleState is not active', async () => {
    registryStore.push(makeRegistryRow({
      modelId: 'Qwen/Qwen3-8B',
      lifecycleState: 'proposed',
      gateLicenseApproved: true,
      gateSensitivityMatch: true,
      gateLiveInferenceAllowed: true,
      gateProductionApproved: true,
    }));

    const res = await request(buildApp()).get('/hf/status');

    const model = res.body.modelRegistry.models[0];
    expect(model.gates.registryActive).toBe(false);
    expect(model.gates.allPass).toBe(false);
    const { summary } = res.body.modelRegistry;
    expect(summary.active).toBe(0);
    expect(summary.fullyGated).toBe(0);
  });

  it('marks active model as blocked when a gate flag is false', async () => {
    registryStore.push(makeRegistryRow({
      lifecycleState: 'active',
      gateLicenseApproved: false,
    }));

    const res = await request(buildApp()).get('/hf/status');

    const model = res.body.modelRegistry.models[0];
    expect(model.gates.licenseApproved).toBe(false);
    expect(model.gates.allPass).toBe(false);

    const { summary } = res.body.modelRegistry;
    expect(summary.active).toBe(1);
    expect(summary.blocked).toBe(1);
    expect(summary.fullyGated).toBe(0);
  });

  it('includes failoverChain object when model has a linked chain', async () => {
    chainsStore.push({
      id: 7,
      lane: 'batch',
      primaryModelId: 'Qwen/Qwen3-8B',
      fallbackModelIds: ['Qwen/Qwen3-0.6B'],
      isActive: true,
    });
    registryStore.push(makeRegistryRow({ failoverChainId: 7 }));

    const res = await request(buildApp()).get('/hf/status');

    const model = res.body.modelRegistry.models[0];
    expect(model.failoverChain).not.toBeNull();
    expect(model.failoverChain.id).toBe(7);
    expect(model.failoverChain.lane).toBe('batch');
    expect(model.failoverChain.isActive).toBe(true);
    expect(model.failoverChain.fallbackModelIds).toEqual(['Qwen/Qwen3-0.6B']);
  });

  it('sets failoverChain to null when no chain is assigned', async () => {
    registryStore.push(makeRegistryRow({ failoverChainId: null }));

    const res = await request(buildApp()).get('/hf/status');

    const model = res.body.modelRegistry.models[0];
    expect(model.failoverChain).toBeNull();
  });

  it('exposes ops counters (lastInferenceAt, recentFailureCount)', async () => {
    const ts = new Date('2025-01-15T10:00:00Z');
    registryStore.push(makeRegistryRow({
      lastInferenceAt: ts,
      recentFailureCount: 3,
    }));

    const res = await request(buildApp()).get('/hf/status');

    const model = res.body.modelRegistry.models[0];
    expect(model.lastInferenceAt).toBe(ts.toISOString());
    expect(model.recentFailureCount).toBe(3);
  });

  it('computes summary correctly across multiple models', async () => {
    registryStore.push(makeRegistryRow({ modelId: 'A', lifecycleState: 'active', gateLicenseApproved: true, gateSensitivityMatch: true, gateLiveInferenceAllowed: true, gateProductionApproved: true }));
    registryStore.push(makeRegistryRow({ modelId: 'B', lifecycleState: 'active', gateLicenseApproved: false }));
    registryStore.push(makeRegistryRow({ modelId: 'C', lifecycleState: 'proposed' }));

    const res = await request(buildApp()).get('/hf/status');

    const { summary } = res.body.modelRegistry;
    expect(summary.total).toBe(3);
    expect(summary.active).toBe(2);
    expect(summary.blocked).toBe(1);
    expect(summary.fullyGated).toBe(1);
  });
});
