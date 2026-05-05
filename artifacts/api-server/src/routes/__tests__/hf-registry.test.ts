/**
 * Integration tests for the HF Inference Operator Workflow API
 * — /hf/registry (registry CRUD, lifecycle, license, sensitivity, gates, audit)
 * — /hf/registry/failover-chains (chain management)
 *
 * Covers:
 *   - Propose a new HF model entry (happy path + duplicate rejection)
 *   - List entries with lifecycle state filter
 *   - Read a single entry
 *   - Lifecycle transition (happy path + invalid transition rejection)
 *   - License approval request
 *   - License decision (approved / rejected)
 *   - Sensitivity update
 *   - Gate flag toggles
 *   - Audit history query
 *   - Failover chain CRUD (create, read, update, retire)
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Stub types ──────────────────────────────────────────────────────────────

interface RegistryEntry {
  id: number;
  modelId: string;
  displayName: string;
  provider: string;
  lifecycleState: string;
  licenseId: string | null;
  licenseSourceUrl: string | null;
  licenseApproverId: number | null;
  licenseApprovalId: number | null;
  licenseExpiresAt: Date | null;
  licenseApprovedAt: Date | null;
  sensitivityAllowance: string;
  gateLicenseApproved: boolean;
  gateSensitivityMatch: boolean;
  gateLiveInferenceAllowed: boolean;
  gateProductionApproved: boolean;
  failoverChainId: number | null;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  capabilities: unknown;
  tier: string | null;
  lastInferenceAt: Date | null;
  recentFailureCount: number;
  proposedById: number | null;
  proposedAt: Date;
  approvedAt: Date | null;
  retiredAt: Date | null;
  notes: string | null;
  orgId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FailoverChain {
  id: number;
  name: string;
  lane: string;
  primaryModelId: string;
  fallbackModelIds: unknown;
  isActive: boolean;
  isSeeded: boolean;
  createdById: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── In-memory stores ─────────────────────────────────────────────────────────

let registryStore: RegistryEntry[] = [];
let chainsStore: FailoverChain[] = [];
let approvalsStore: Array<{
  id: number;
  status: string;
  resourceType: string;
  resourceId: string;
  approvedById: number | null;
  rejectedById: number | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
}> = [];
let auditStore: Array<{
  id: number;
  entityType: string;
  entityId: string | null;
  actionType: string;
  actorUserId: number | null;
  payloadJson: unknown;
  createdAt: Date;
}> = [];
let nextId = 1;

// ─── Hoisted table stubs ───────────────────────────────────────────────────────
// vi.hoisted() runs before vi.mock() factories, making these refs safe to use
// in both the factory closure and in the test dispatch logic.
//
// Column properties are string values matching the JS field names so the
// WHERE condition evaluator in makeFluentChain can map col→field correctly.

// requireRoleMode controls whether requireRole enforces role membership.
// Set check=true and userRoles=['viewer'] in RBAC tests to exercise real rejection.
const {
  hfModelRegistryTable,
  hfFailoverChainsTable,
  auditLogsTable,
  approvalRequestsTable,
  requireRoleMode,
} = vi.hoisted(() => ({
  requireRoleMode: { check: false, userRoles: ['ops'] as string[] },
  hfModelRegistryTable: {
      __t: 'hfModelRegistryTable',
      id: 'id',
      modelId: 'modelId',
      lifecycleState: 'lifecycleState',
      sensitivityAllowance: 'sensitivityAllowance',
      gateLicenseApproved: 'gateLicenseApproved',
      gateSensitivityMatch: 'gateSensitivityMatch',
      gateLiveInferenceAllowed: 'gateLiveInferenceAllowed',
      gateProductionApproved: 'gateProductionApproved',
    } as unknown,
    hfFailoverChainsTable: {
      __t: 'hfFailoverChainsTable',
      id: 'id',
      lane: 'lane',
      isActive: 'isActive',
      createdAt: 'createdAt',
    } as unknown,
    auditLogsTable: {
      __t: 'auditLogsTable',
      id: 'id',
      entityType: 'entityType',
      entityId: 'entityId',
      createdAt: 'createdAt',
    } as unknown,
    approvalRequestsTable: {
      __t: 'approvalRequestsTable',
      id: 'id',
      status: 'status',
    } as unknown,
  }));

// ─── DB mock ──────────────────────────────────────────────────────────────────

vi.mock('@szl-holdings/db', () => ({
  hfModelRegistryTable,
  hfFailoverChainsTable,
  auditLogsTable,
  approvalRequestsTable,
  HF_LIFECYCLE_STATES: ['proposed', 'under_review', 'approved', 'active', 'retired'],
  HF_SENSITIVITY_LEVELS: ['public', 'internal', 'confidential', 'restricted'],
  VALID_HF_TRANSITIONS: {
    proposed: ['under_review', 'retired'],
    under_review: ['approved', 'proposed'],
    approved: ['active', 'proposed', 'retired'],
    active: ['retired'],
    retired: [],
  },
  db: {
    select: (projection?: unknown) => ({
      from: (table: unknown) => {
        // Detect count-shaped projections: db.select({ total: count() })
        // count() returns { $type: 'count' }, so projection is { total: {...} }.
        // When detected, the chain resolves to [{ total: N }] instead of full rows.
        const isCount =
          projection !== undefined &&
          projection !== null &&
          typeof projection === 'object' &&
          'total' in (projection as object);

        // Minimal SQL condition evaluator for WHERE clause support.
        // Column values in the mock table stubs are plain strings matching
        // the JS field name of the corresponding row object (e.g.
        // hfModelRegistryTable.gateLicenseApproved === 'gateLicenseApproved').
        type Cond = { $type: string; col?: string; val?: unknown; args?: Cond[]; vals?: unknown[] };
        function evalCond(cond: Cond, row: Record<string, unknown>): boolean {
          if (cond.$type === 'and') return (cond.args ?? []).every((a) => evalCond(a, row));
          if (cond.$type === 'or') return (cond.args ?? []).some((a) => evalCond(a, row));
          if (cond.$type === 'eq') return row[cond.col as string] === cond.val;
          if (cond.$type === 'inArray')
            return (cond.vals as unknown[]).includes(row[cond.col as string]);
          return true; // unknown condition types pass through
        }

        // Build a universal fluent chain for this table.
        // If isCount, resolves to [{ total: filteredData.length }] not full rows.
        const makeFluentChain = (data: () => unknown[]): Record<string, unknown> => {
          const chain: Record<string, unknown> = {};
          const resolve = () =>
            isCount
              ? Promise.resolve([{ total: data().length }])
              : Promise.resolve(data());
          Object.assign(chain, {
            where: (cond?: unknown) =>
              cond
                ? makeFluentChain(() =>
                    data().filter((row) =>
                      evalCond(cond as Cond, row as Record<string, unknown>),
                    ),
                  )
                : makeFluentChain(data),
            orderBy: () => makeFluentChain(data),
            limit: (n: number) => makeFluentChain(() => data().slice(0, n)),
            offset: (n: number) => makeFluentChain(() => data().slice(n)),
            then: (
              onFulfilled: (v: unknown[]) => unknown,
              onRejected?: (e: unknown) => unknown,
            ) => resolve().then(onFulfilled, onRejected),
          });
          return chain;
        };

        if (table === hfModelRegistryTable) return makeFluentChain(() => [...registryStore]);
        if (table === hfFailoverChainsTable) return makeFluentChain(() => [...chainsStore]);
        if (table === auditLogsTable) return makeFluentChain(() => [...auditStore]);
        if (table === approvalRequestsTable) return makeFluentChain(() => [...approvalsStore]);
        return makeFluentChain(() => []);
      },
    }),
    insert: (table: unknown) => ({
      values: (vals: Record<string, unknown> | Record<string, unknown>[]) => ({
        returning: () => {
          const arr = Array.isArray(vals) ? vals : [vals];
          const results: unknown[] = [];
          for (const v of arr) {
            if (table === hfModelRegistryTable) {
              const entry: RegistryEntry = {
                id: nextId++,
                modelId: String(v.modelId ?? ''),
                displayName: String(v.displayName ?? ''),
                provider: String(v.provider ?? 'huggingface'),
                lifecycleState: String(v.lifecycleState ?? 'proposed'),
                licenseId: (v.licenseId as string) ?? null,
                licenseSourceUrl: (v.licenseSourceUrl as string) ?? null,
                licenseApproverId: null,
                licenseApprovalId: null,
                licenseExpiresAt: null,
                licenseApprovedAt: null,
                sensitivityAllowance: String(v.sensitivityAllowance ?? 'internal'),
                gateLicenseApproved: false,
                gateSensitivityMatch: false,
                gateLiveInferenceAllowed: false,
                gateProductionApproved: false,
                failoverChainId: (v.failoverChainId as number) ?? null,
                contextWindow: (v.contextWindow as number) ?? null,
                maxOutputTokens: (v.maxOutputTokens as number) ?? null,
                capabilities: v.capabilities ?? [],
                tier: (v.tier as string) ?? null,
                lastInferenceAt: null,
                recentFailureCount: 0,
                proposedById: (v.proposedById as number) ?? null,
                proposedAt: new Date(),
                approvedAt: null,
                retiredAt: null,
                notes: (v.notes as string) ?? null,
                orgId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              registryStore.push(entry);
              results.push(entry);
            } else if (table === hfFailoverChainsTable) {
              const chain: FailoverChain = {
                id: nextId++,
                name: String(v.name ?? ''),
                lane: String(v.lane ?? ''),
                primaryModelId: String(v.primaryModelId ?? ''),
                fallbackModelIds: v.fallbackModelIds ?? [],
                isActive: (v.isActive as boolean) ?? true,
                isSeeded: (v.isSeeded as boolean) ?? false,
                createdById: (v.createdById as number) ?? null,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              chainsStore.push(chain);
              results.push(chain);
            } else if (table === approvalRequestsTable) {
              const approval = {
                id: nextId++,
                status: 'pending',
                resourceType: String(v.resourceType ?? ''),
                resourceId: String(v.resourceId ?? ''),
                approvedById: null,
                rejectedById: null,
                approvedAt: null,
                rejectedAt: null,
                ...v,
              };
              approvalsStore.push(approval);
              results.push(approval);
            } else if (table === auditLogsTable) {
              const entry = { id: nextId++, ...v, createdAt: new Date() };
              auditStore.push(entry as never);
              results.push(entry);
            } else {
              results.push(v);
            }
          }
          return Promise.resolve(results);
        },
      }),
    }),
    update: (table: unknown) => ({
      set: (updates: Record<string, unknown>) => ({
        where: () => ({
          returning: () => {
            if (table === hfModelRegistryTable && registryStore.length > 0) {
              registryStore[0] = { ...registryStore[0], ...updates };
              return Promise.resolve([registryStore[0]]);
            }
            if (table === hfFailoverChainsTable && chainsStore.length > 0) {
              chainsStore[0] = { ...chainsStore[0], ...updates };
              return Promise.resolve([chainsStore[0]]);
            }
            if (table === approvalRequestsTable && approvalsStore.length > 0) {
              approvalsStore[0] = { ...approvalsStore[0], ...updates };
              return Promise.resolve([approvalsStore[0]]);
            }
            return Promise.resolve([]);
          },
        }),
      }),
    }),
  },
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ $type: 'and', args }),
  or: (...args: unknown[]) => ({ $type: 'or', args }),
  eq: (col: unknown, val: unknown) => ({ $type: 'eq', col, val }),
  desc: (col: unknown) => ({ $type: 'desc', col }),
  inArray: (col: unknown, vals: unknown) => ({ $type: 'inArray', col, vals }),
  count: () => ({ $type: 'count' }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (req as Record<string, unknown>).user = {
        id: requireRoleMode.check ? 2 : 1,
        displayName: requireRoleMode.check ? 'Read-Only User' : 'Test Operator',
        roles: requireRoleMode.userRoles,
      };
      next();
    },
  requireRole:
    (...roles: string[]) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!requireRoleMode.check) { next(); return; }
      const user = (req as Record<string, unknown>).user as { roles?: string[] } | undefined;
      if (!user?.roles?.some((r) => roles.includes(r))) {
        res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
        return;
      }
      next();
    },
  InvalidIdError: class InvalidIdError extends Error {
    constructor() {
      super('Invalid ID');
      this.name = 'InvalidIdError';
    }
  },
}));

vi.mock('../../lib/validation', () => ({
  validateBody:
    (schema: {
      safeParse: (b: unknown) => { success: boolean; data?: unknown; error?: { format: () => unknown } };
    }) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: 'Validation failed', details: result.error?.format() });
        return;
      }
      req.body = result.data;
      next();
    },
  validateQuery:
    (schema: {
      safeParse: (q: unknown) => { success: boolean; data?: unknown; error?: { format: () => unknown } };
    }) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({ error: 'Validation failed', details: result.error?.format() });
        return;
      }
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      next();
    },
}));

vi.mock('@szl-holdings/ai-engine', () => ({
  FAILOVER_CHAINS: [
    { lane: 'batch', primary: 'Qwen/Qwen3-8B', fallbacks: ['gpt-4o-mini', 'Qwen/Qwen3-0.6B'] },
  ],
  MODEL_REGISTRY: {
    'Qwen/Qwen3-8B': {
      id: 'Qwen/Qwen3-8B',
      displayName: 'Qwen3 8B',
      provider: 'huggingface',
      contextWindow: 32768,
      maxOutputTokens: 4096,
      capabilities: ['speed', 'extraction', 'summarization'],
      tier: 'local',
    },
    'Qwen/Qwen3-0.6B': {
      id: 'Qwen/Qwen3-0.6B',
      displayName: 'Qwen3 0.6B',
      provider: 'huggingface',
      contextWindow: 8192,
      maxOutputTokens: 1024,
      capabilities: ['speed', 'extraction'],
      tier: 'local',
    },
    'gpt-4o': {
      id: 'gpt-4o',
      displayName: 'GPT-4o',
      provider: 'openai',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      capabilities: ['speed', 'reasoning'],
      tier: 'cloud',
    },
  },
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ─── App factory ─────────────────────────────────────────────────────────────

const { default: hfRegistryRouter } = await import('../hf-registry.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', hfRegistryRouter as unknown as ExpressRouter);
  return app;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return {
    id: nextId++,
    modelId: 'Qwen/Qwen3-8B',
    displayName: 'Qwen3 8B',
    provider: 'huggingface',
    lifecycleState: 'proposed',
    licenseId: null,
    licenseSourceUrl: null,
    licenseApproverId: null,
    licenseApprovalId: null,
    licenseExpiresAt: null,
    licenseApprovedAt: null,
    sensitivityAllowance: 'internal',
    gateLicenseApproved: false,
    gateSensitivityMatch: false,
    gateLiveInferenceAllowed: false,
    gateProductionApproved: false,
    failoverChainId: null,
    contextWindow: null,
    maxOutputTokens: null,
    capabilities: [],
    tier: null,
    lastInferenceAt: null,
    recentFailureCount: 0,
    proposedById: null,
    proposedAt: new Date(),
    approvedAt: null,
    retiredAt: null,
    notes: null,
    orgId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeChain(overrides: Partial<FailoverChain> = {}): FailoverChain {
  return {
    id: nextId++,
    name: 'Batch inference chain',
    lane: 'batch',
    primaryModelId: 'Qwen/Qwen3-8B',
    fallbackModelIds: ['gpt-4o-mini'],
    isActive: true,
    isSeeded: false,
    createdById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HF Registry Operator Workflow API', () => {
  beforeEach(() => {
    registryStore = [];
    chainsStore = [];
    approvalsStore = [];
    auditStore = [];
    nextId = 1;
  });

  // ── Propose ────────────────────────────────────────────────────────────────

  describe('POST /hf/registry — propose model', () => {
    it('creates a new registry entry with proposed state', async () => {
      const res = await request(buildApp())
        .post('/hf/registry')
        .send({
          modelId: 'Qwen/Qwen3-8B',
          displayName: 'Qwen3 8B',
          sensitivityAllowance: 'internal',
          capabilities: ['speed', 'extraction'],
          tier: 'local',
        });

      expect(res.status).toBe(201);
      expect(res.body.entry.modelId).toBe('Qwen/Qwen3-8B');
      expect(res.body.entry.lifecycleState).toBe('proposed');
      expect(res.body.entry.gates.allPass).toBe(false);
    });

    it('rejects a duplicate modelId', async () => {
      registryStore.push(makeEntry({ modelId: 'Qwen/Qwen3-8B' }));

      const res = await request(buildApp())
        .post('/hf/registry')
        .send({ modelId: 'Qwen/Qwen3-8B', displayName: 'Qwen3 8B' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already in the registry/);
    });

    it('returns 400 when modelId is missing', async () => {
      const res = await request(buildApp())
        .post('/hf/registry')
        .send({ displayName: 'Qwen3 8B' });

      expect(res.status).toBe(400);
    });
  });

  // ── List ───────────────────────────────────────────────────────────────────

  describe('GET /hf/registry — list entries', () => {
    it('returns an empty list when the registry is empty', async () => {
      const res = await request(buildApp()).get('/hf/registry');
      expect(res.status).toBe(200);
      expect(res.body.entries).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('returns entries when registry has items', async () => {
      registryStore.push(
        makeEntry({
          lifecycleState: 'active',
          licenseId: 'apache-2.0',
          gateLicenseApproved: true,
          gateSensitivityMatch: true,
          gateLiveInferenceAllowed: true,
          gateProductionApproved: true,
          contextWindow: 32768,
          maxOutputTokens: 4096,
          tier: 'local',
          approvedAt: new Date(),
        }),
      );

      const res = await request(buildApp()).get('/hf/registry');
      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBe(1);
      expect(res.body.entries[0].modelId).toBe('Qwen/Qwen3-8B');
      expect(res.body.entries[0].gates.allPass).toBe(true);
    });

    it('respects the limit query parameter', async () => {
      registryStore.push(makeEntry({ modelId: 'Qwen/A' }));
      registryStore.push(makeEntry({ modelId: 'Qwen/B' }));
      registryStore.push(makeEntry({ modelId: 'Qwen/C' }));

      const res = await request(buildApp()).get('/hf/registry?limit=2');
      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBeLessThanOrEqual(2);
    });

    it('gatesPass=any filters to entries with at least one gate true', async () => {
      registryStore.push(
        makeEntry({
          modelId: 'Qwen/A',
          gateLicenseApproved: true,
          gateSensitivityMatch: false,
          gateLiveInferenceAllowed: false,
          gateProductionApproved: false,
        }),
      );
      registryStore.push(
        makeEntry({
          modelId: 'Qwen/B',
          gateLicenseApproved: false,
          gateSensitivityMatch: false,
          gateLiveInferenceAllowed: false,
          gateProductionApproved: false,
        }),
      );

      const res = await request(buildApp()).get('/hf/registry?gatesPass=any');
      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBe(1);
      expect(res.body.entries[0].modelId).toBe('Qwen/A');
    });

    it('gatesPass=none filters to entries with all gates false', async () => {
      registryStore.push(
        makeEntry({
          modelId: 'Qwen/A',
          gateLicenseApproved: true,
          gateSensitivityMatch: false,
          gateLiveInferenceAllowed: false,
          gateProductionApproved: false,
        }),
      );
      registryStore.push(
        makeEntry({
          modelId: 'Qwen/B',
          gateLicenseApproved: false,
          gateSensitivityMatch: false,
          gateLiveInferenceAllowed: false,
          gateProductionApproved: false,
        }),
      );

      const res = await request(buildApp()).get('/hf/registry?gatesPass=none');
      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBe(1);
      expect(res.body.entries[0].modelId).toBe('Qwen/B');
    });
  });

  // ── Read one ───────────────────────────────────────────────────────────────

  describe('GET /hf/registry/:modelId — read one', () => {
    it('returns 404 when model not found', async () => {
      const res = await request(buildApp()).get('/hf/registry/Unknown%2FModel');
      expect(res.status).toBe(404);
    });

    it('returns the entry when found', async () => {
      registryStore.push(makeEntry({ modelId: 'Qwen/Qwen3-0.6B', displayName: 'Qwen3 0.6B' }));

      const res = await request(buildApp()).get('/hf/registry/Qwen%2FQwen3-0.6B');
      expect(res.status).toBe(200);
      expect(res.body.entry.modelId).toBe('Qwen/Qwen3-0.6B');
    });
  });

  // ── Lifecycle transition ───────────────────────────────────────────────────

  describe('POST /hf/registry/:modelId/lifecycle — lifecycle transition', () => {
    it('transitions from proposed → under_review', async () => {
      registryStore.push(makeEntry({ lifecycleState: 'proposed' }));

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/lifecycle')
        .send({ toState: 'under_review', reason: 'Ready for review' });

      expect(res.status).toBe(200);
      expect(res.body.transition.from).toBe('proposed');
      expect(res.body.transition.to).toBe('under_review');
    });

    it('rejects an invalid transition (proposed → active)', async () => {
      registryStore.push(makeEntry({ lifecycleState: 'proposed' }));

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/lifecycle')
        .send({ toState: 'active', reason: 'Skipping steps' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not allowed/);
    });

    it('returns 404 when entry does not exist', async () => {
      const res = await request(buildApp())
        .post('/hf/registry/Unknown%2FModel/lifecycle')
        .send({ toState: 'under_review', reason: 'Test' });

      expect(res.status).toBe(404);
    });

    it('rejects transition from retired (terminal state)', async () => {
      registryStore.push(makeEntry({ lifecycleState: 'retired' }));

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/lifecycle')
        .send({ toState: 'proposed', reason: 'Attempting to revive' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not allowed/);
    });
  });

  // ── Lifecycle timestamp correctness ───────────────────────────────────────

  describe('Lifecycle timestamp correctness', () => {
    it('sets approvedAt when transitioning to approved (not active)', async () => {
      registryStore.push(makeEntry({ lifecycleState: 'under_review', approvedAt: null }));

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/lifecycle')
        .send({ toState: 'approved', reason: 'Review complete' });

      expect(res.status).toBe(200);
      expect(res.body.entry.approvedAt).not.toBeNull();
    });

    it('does not set approvedAt when transitioning to active (already set at approved)', async () => {
      const approvedAt = new Date('2026-01-01T00:00:00Z');
      registryStore.push(
        makeEntry({ lifecycleState: 'approved', approvedAt }),
      );

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/lifecycle')
        .send({ toState: 'active', reason: 'Promoting to active' });

      expect(res.status).toBe(200);
    });
  });

  // ── License approval flow ──────────────────────────────────────────────────

  describe('POST /hf/registry/:modelId/license-approval — request license approval', () => {
    it('creates a pending approval request', async () => {
      registryStore.push(makeEntry({ lifecycleState: 'under_review' }));

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/license-approval')
        .send({
          licenseId: 'apache-2.0',
          licenseSourceUrl: 'https://huggingface.co/Qwen/Qwen3-8B/blob/main/LICENSE',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(typeof res.body.approvalId).toBe('number');
      expect(res.body.status).toBe('pending');
    });
  });

  // ── License decision ───────────────────────────────────────────────────────

  describe('POST /hf/registry/:modelId/license-decision — record decision', () => {
    it('approves the license and sets gateLicenseApproved=true', async () => {
      registryStore.push(
        makeEntry({
          lifecycleState: 'under_review',
          licenseId: 'apache-2.0',
          licenseSourceUrl: 'https://huggingface.co/Qwen/Qwen3-8B/blob/main/LICENSE',
          licenseApprovalId: 99,
        }),
      );
      approvalsStore.push({
        id: 99,
        status: 'pending',
        resourceType: 'hf_model_registry',
        resourceId: 'Qwen/Qwen3-8B',
        approvedById: null,
        rejectedById: null,
        approvedAt: null,
        rejectedAt: null,
      });

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/license-decision')
        .send({ decision: 'approved', reason: 'License reviewed and approved' });

      expect(res.status).toBe(200);
      expect(res.body.decision).toBe('approved');
    });

    it('returns 400 if no pending license approval exists', async () => {
      registryStore.push(
        makeEntry({ lifecycleState: 'under_review', licenseApprovalId: null }),
      );

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/license-decision')
        .send({ decision: 'approved', reason: 'Approving' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/No pending license approval/);
    });

    it('returns 400 if the linked approval is already decided (not pending)', async () => {
      registryStore.push(
        makeEntry({
          lifecycleState: 'under_review',
          licenseId: 'apache-2.0',
          licenseSourceUrl: 'https://example.com/LICENSE',
          licenseApprovalId: 77,
        }),
      );
      approvalsStore.push({
        id: 77,
        status: 'approved',
        resourceType: 'hf_model_registry',
        resourceId: 'Qwen/Qwen3-8B',
        approvedById: 1,
        rejectedById: null,
        approvedAt: new Date(),
        rejectedAt: null,
      });

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/license-decision')
        .send({ decision: 'approved', reason: 'Attempting to re-approve' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not in pending status/);
    });
  });

  // ── Sensitivity ────────────────────────────────────────────────────────────

  describe('PATCH /hf/registry/:modelId/sensitivity', () => {
    it('updates sensitivity allowance and writes audit entry', async () => {
      registryStore.push(
        makeEntry({ lifecycleState: 'approved', approvedAt: new Date() }),
      );

      const res = await request(buildApp())
        .patch('/hf/registry/Qwen%2FQwen3-8B/sensitivity')
        .send({ sensitivityAllowance: 'confidential', reason: 'Upgraded data classification' });

      expect(res.status).toBe(200);
      expect(res.body.entry).toBeDefined();
    });
  });

  // ── Gate flags ─────────────────────────────────────────────────────────────

  describe('PATCH /hf/registry/:modelId/gates', () => {
    it('toggles gate flags and returns updated state', async () => {
      registryStore.push(makeEntry({ lifecycleState: 'approved', licenseId: 'apache-2.0' }));

      const res = await request(buildApp())
        .patch('/hf/registry/Qwen%2FQwen3-8B/gates')
        .send({
          gateLicenseApproved: true,
          gateSensitivityMatch: true,
          reason: 'Gates verified by compliance team',
        });

      expect(res.status).toBe(200);
      expect(res.body.gates).toBeDefined();
    });

    it('returns 400 when reason is missing', async () => {
      const res = await request(buildApp())
        .patch('/hf/registry/Qwen%2FQwen3-8B/gates')
        .send({ gateLicenseApproved: true });

      expect(res.status).toBe(400);
    });
  });

  // ── Audit history ──────────────────────────────────────────────────────────

  describe('GET /hf/registry/:modelId/audit', () => {
    it('returns 404 when model does not exist', async () => {
      const res = await request(buildApp()).get('/hf/registry/Unknown%2FModel/audit');
      expect(res.status).toBe(404);
    });

    it('returns empty audit entries for a model with no history', async () => {
      registryStore.push(makeEntry({ lifecycleState: 'active' }));

      const res = await request(buildApp()).get('/hf/registry/Qwen%2FQwen3-8B/audit');
      expect(res.status).toBe(200);
      expect(res.body.modelId).toBe('Qwen/Qwen3-8B');
      expect(Array.isArray(res.body.entries)).toBe(true);
      expect(res.body.entries).toHaveLength(0);
    });
  });

  // ── Failover chains ────────────────────────────────────────────────────────

  describe('Failover chain management', () => {
    it('GET /hf/registry/failover-chains — returns empty list initially', async () => {
      const res = await request(buildApp()).get('/hf/registry/failover-chains');
      expect(res.status).toBe(200);
      expect(res.body.chains).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('POST /hf/registry/failover-chains — creates a new chain', async () => {
      const res = await request(buildApp())
        .post('/hf/registry/failover-chains')
        .send({
          name: 'Batch inference chain',
          lane: 'batch',
          primaryModelId: 'Qwen/Qwen3-8B',
          fallbackModelIds: ['gpt-4o-mini', 'Qwen/Qwen3-0.6B'],
          reason: 'Initial configuration',
        });

      expect(res.status).toBe(201);
      expect(res.body.chain.lane).toBe('batch');
      expect(res.body.chain.primaryModelId).toBe('Qwen/Qwen3-8B');
      expect(Array.isArray(res.body.chain.fallbackModelIds)).toBe(true);
      expect(res.body.chain.isSeeded).toBe(false);
    });

    it('POST /hf/registry/failover-chains — requires lane field', async () => {
      const res = await request(buildApp())
        .post('/hf/registry/failover-chains')
        .send({
          name: 'Missing lane',
          primaryModelId: 'Qwen/Qwen3-8B',
          fallbackModelIds: [],
        });

      expect(res.status).toBe(400);
    });

    it('PUT /hf/registry/failover-chains/:chainId — updates the chain', async () => {
      chainsStore.push(makeChain({ id: 10 }));

      const res = await request(buildApp())
        .put('/hf/registry/failover-chains/10')
        .send({
          name: 'Updated batch chain',
          lane: 'batch',
          primaryModelId: 'Qwen/Qwen3-8B',
          fallbackModelIds: ['Qwen/Qwen3-0.6B'],
          reason: 'Added fallback',
        });

      expect(res.status).toBe(200);
      expect(res.body.chain.name).toBe('Updated batch chain');
    });

    it('DELETE /hf/registry/failover-chains/:chainId — retires the chain', async () => {
      chainsStore.push(makeChain({ id: 10 }));

      const res = await request(buildApp())
        .delete('/hf/registry/failover-chains/10')
        .send({ reason: 'No longer needed' });

      expect(res.status).toBe(204);
    });

    it('GET /hf/registry/failover-chains/:chainId — returns 404 for unknown chain', async () => {
      const res = await request(buildApp()).get('/hf/registry/failover-chains/999');
      expect(res.status).toBe(404);
    });
  });

  // ── Role-based access control ──────────────────────────────────────────────
  // These tests use the real requireRole middleware logic (via requireRoleMode)
  // so that actual role-checking code in the mounted router is exercised,
  // not a hardcoded catch-all handler.

  describe('Role enforcement — viewer role rejected on mutating endpoints', () => {
    beforeEach(() => {
      requireRoleMode.check = true;
      requireRoleMode.userRoles = ['viewer'];
    });

    afterEach(() => {
      requireRoleMode.check = false;
      requireRoleMode.userRoles = ['ops'];
    });

    it('returns 403 when a viewer attempts to propose a model', async () => {
      const res = await request(buildApp())
        .post('/hf/registry')
        .send({ modelId: 'Qwen/Qwen3-8B', displayName: 'Qwen3 8B' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('returns 403 when a viewer attempts a lifecycle transition', async () => {
      registryStore.push(makeEntry({ modelId: 'Qwen/Qwen3-8B' }));

      const res = await request(buildApp())
        .post('/hf/registry/Qwen%2FQwen3-8B/lifecycle')
        .send({ toState: 'under_review', reason: 'Unauthorized attempt' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('returns 403 when a viewer attempts to toggle gate flags', async () => {
      registryStore.push(makeEntry({ modelId: 'Qwen/Qwen3-8B' }));

      const res = await request(buildApp())
        .patch('/hf/registry/Qwen%2FQwen3-8B/gates')
        .send({ gateLicenseApproved: true });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('returns 403 when a viewer attempts to create a failover chain', async () => {
      const res = await request(buildApp())
        .post('/hf/registry/failover-chains')
        .send({ name: 'Unauthorized chain', lane: 'batch', primaryModelId: 'Qwen/Qwen3-8B', fallbackModelIds: [] });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('allows a viewer to read registry entries (read-only access)', async () => {
      registryStore.push(makeEntry({ modelId: 'Qwen/Qwen3-8B' }));

      const res = await request(buildApp()).get('/hf/registry');

      expect(res.status).toBe(200);
    });
  });
});
