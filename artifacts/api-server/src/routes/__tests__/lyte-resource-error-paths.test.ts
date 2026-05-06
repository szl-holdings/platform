/**
 * Lyte resource error-path tests
 *
 * Companion to lyte-action-queue.test.ts. Extends the same shared mock pattern
 * (Error sentinels in the result queues, InvalidIdError-throwing parseIdParam
 * mock) to the remaining Lyte resource PATCH/DELETE routes.
 *
 * For each route below, two cases are exercised:
 *   1. A non-numeric ID returns 400 with a structured BAD_REQUEST envelope
 *      and never touches the DB.
 *   2. An unexpected DB failure returns 500 with the structured INTERNAL_ERROR
 *      envelope including requestId / correlationId.
 *
 * Routes covered (per task #4601):
 *   - PATCH/DELETE /lyte/signals/:id
 *   - PATCH/DELETE /lyte/command-cards/:id
 *   - PATCH/DELETE /lyte/incidents/:id
 *   - PATCH/DELETE /lyte/playbooks/:id
 *   - PATCH/DELETE /lyte/recommendations/:id
 *   - PATCH/DELETE /lyte/views/:id
 *   - PATCH    /lyte/readiness/:id  (no DELETE route exists)
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ChainResult = unknown[] | Error;
let _updateReturnQueue: ChainResult[] = [];
let _deleteReturnQueue: ChainResult[] = [];
let _updateSetArgs: unknown[] = [];

class InvalidIdError extends Error {
  constructor() {
    super('Invalid ID parameter');
    this.name = 'InvalidIdError';
  }
}

const passThruSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
};

vi.mock('@szl-holdings/db', () => {
  const makeTable = (name: string) =>
    ({
      _name: name,
      id: { _col: 'id' },
      createdAt: { _col: 'created_at' },
      receivedAt: { _col: 'received_at' },
      updatedAt: { _col: 'updated_at' },
    }) as Record<string, unknown>;

  function makeUpdateChain() {
    const result = _updateReturnQueue.shift() ?? [];
    const finalize = () =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    const chain: Record<string, unknown> = {};
    chain.set = (args: unknown) => {
      _updateSetArgs.push(args);
      return chain;
    };
    chain.where = () => chain;
    chain.returning = () => finalize();
    return chain;
  }

  function makeDeleteChain() {
    const result = _deleteReturnQueue.shift() ?? [];
    const finalize = () =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    const chain: Record<string, unknown> = {};
    chain.where = () => chain;
    chain.returning = () => finalize();
    return chain;
  }

  function makeSelectChain() {
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => chain;
    chain.offset = () => Promise.resolve([]);
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve([]).then(resolve);
    chain.catch = () => chain;
    return chain;
  }

  const db = {
    select: (_projection?: unknown) => makeSelectChain(),
    insert: (_table?: unknown) => ({
      values: () => ({ returning: () => Promise.resolve([]) }),
    }),
    update: (_table?: unknown) => makeUpdateChain(),
    delete: (_table?: unknown) => makeDeleteChain(),
  };

  return {
    db,
    lyteWorkspacesTable: makeTable('lyte_workspaces'),
    lyteSignalsTable: makeTable('lyte_signals'),
    lyteCommandCardsTable: makeTable('lyte_command_cards'),
    lyteIncidentsTable: makeTable('lyte_incidents'),
    lytePlaybooksTable: makeTable('lyte_playbooks'),
    lyteRecommendationsTable: makeTable('lyte_recommendations'),
    lyteSavedViewsTable: makeTable('lyte_saved_views'),
    lyteReadinessItemsTable: makeTable('lyte_readiness_items'),
    lyteInterventionsTable: makeTable('lyte_interventions'),
    lytePressureCellsTable: makeTable('lyte_pressure_cells'),
    lyteActionsTable: makeTable('lyte_actions'),
    lyteDriftItemsTable: makeTable('lyte_drift_items'),
    lyteDriftHistoryTable: makeTable('lyte_drift_history'),
    lyteDebtItemsTable: makeTable('lyte_debt_items'),
    lyteDebtScoreHistoryTable: makeTable('lyte_debt_score_history'),
    insertLyteActionSchema: passThruSchema,
    insertLyteCommandCardSchema: passThruSchema,
    insertLyteIncidentSchema: passThruSchema,
    insertLytePlaybookSchema: passThruSchema,
    insertLyteReadinessItemSchema: passThruSchema,
    insertLyteRecommendationSchema: passThruSchema,
    insertLyteSavedViewSchema: passThruSchema,
    insertLyteSignalSchema: passThruSchema,
    insertLyteWorkspaceSchema: passThruSchema,
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (_col: unknown, _val: unknown) => ({ op: 'eq', _col, _val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ op: 'sql' }), {
    raw: (_s: string) => ({ op: 'sql_raw' }),
  }),
}));

const _authMockExports = {
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  denyIfReadOnly: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole:
    (..._roles: string[]) =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
  parseIdParam: (raw: string | string[]) => {
    const str = Array.isArray(raw) ? raw[0]! : raw;
    const id = parseInt(str, 10);
    if (Number.isNaN(id) || id < 1) throw new InvalidIdError();
    return id;
  },
  InvalidIdError,
};

vi.mock('../../middlewares/auth', () => _authMockExports);
vi.mock('../../middlewares/auth.js', () => _authMockExports);

vi.mock('../../lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
}));

vi.mock('../../lib/websocket.js', () => ({
  publish: vi.fn(),
  WS_CHANNELS: {
    LYTE_SIGNAL_NEW: 'lyte:signal:new',
    LYTE_SIGNAL_UPDATE: 'lyte:signal:update',
    LYTE_ACTION_QUEUE: 'lyte:action:queue',
  },
}));

vi.mock('@szl-holdings/ai-engine/domain-embedding-hooks', () => ({
  ingestLyteSystem: vi.fn().mockResolvedValue(undefined),
}));

function injectUser(user: Record<string, unknown> | null) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (user) (req as unknown as Record<string, unknown>).user = user;
    next();
  };
}

async function buildApp(user: Record<string, unknown> | null = { displayName: 'Operator' }) {
  vi.resetModules();
  const { default: router } = await import('../lyte');
  const app = express();
  app.use(express.json());
  app.use(injectUser(user));
  app.use(router);
  return app;
}

function resetState() {
  _updateReturnQueue = [];
  _deleteReturnQueue = [];
  _updateSetArgs = [];
}

/**
 * Drives every Lyte resource PATCH/DELETE route through the same two
 * error-path scenarios. Encoded as a table so each new resource only adds a
 * single row instead of duplicating the full describe/it scaffolding.
 */
const RESOURCES: Array<{
  name: string;
  path: string; // route prefix, e.g. '/lyte/signals'
  resourceLabel: RegExp; // expected label in 404/error envelopes
  patchBody: Record<string, unknown>;
  hasDelete: boolean;
  patchFailureMessage: RegExp; // matches the route's handleRouteError fallback message
  deleteFailureMessage?: RegExp;
}> = [
  {
    name: 'signals',
    path: '/lyte/signals',
    resourceLabel: /signal/i,
    patchBody: { status: 'acknowledged' },
    hasDelete: true,
    patchFailureMessage: /failed to update signal/i,
    deleteFailureMessage: /failed to delete signal/i,
  },
  {
    name: 'command-cards',
    path: '/lyte/command-cards',
    resourceLabel: /command card/i,
    patchBody: { status: 'in-progress' },
    hasDelete: true,
    patchFailureMessage: /failed to update command card/i,
    deleteFailureMessage: /failed to delete command card/i,
  },
  {
    name: 'incidents',
    path: '/lyte/incidents',
    resourceLabel: /incident/i,
    patchBody: { status: 'resolved' },
    hasDelete: true,
    patchFailureMessage: /failed to update incident/i,
    deleteFailureMessage: /failed to delete incident/i,
  },
  {
    name: 'playbooks',
    path: '/lyte/playbooks',
    resourceLabel: /playbook/i,
    patchBody: { name: 'Renamed' },
    hasDelete: true,
    patchFailureMessage: /failed to update playbook/i,
    deleteFailureMessage: /failed to delete playbook/i,
  },
  {
    name: 'recommendations',
    path: '/lyte/recommendations',
    resourceLabel: /recommendation/i,
    patchBody: { status: 'accepted' },
    hasDelete: true,
    patchFailureMessage: /failed to update recommendation/i,
    deleteFailureMessage: /failed to delete recommendation/i,
  },
  {
    name: 'saved views',
    path: '/lyte/views',
    resourceLabel: /view/i,
    patchBody: { name: 'Renamed View' },
    hasDelete: true,
    patchFailureMessage: /failed to update view/i,
    deleteFailureMessage: /failed to delete view/i,
  },
  {
    name: 'readiness items',
    path: '/lyte/readiness',
    resourceLabel: /readiness/i,
    patchBody: { status: 'complete' },
    hasDelete: false,
    patchFailureMessage: /failed to update readiness/i,
  },
];

function expectStructuredErrorEnvelope(
  body: Record<string, unknown>,
  code: 'BAD_REQUEST' | 'INTERNAL_ERROR',
) {
  expect(body).toHaveProperty('error');
  expect(typeof body.error).toBe('string');
  expect(body.code).toBe(code);
  expect(body).toHaveProperty('requestId');
  expect(body).toHaveProperty('correlationId');
  expect(typeof body.requestId).toBe('string');
  expect(typeof body.correlationId).toBe('string');
  expect((body.requestId as string).length).toBeGreaterThan(0);
  expect((body.correlationId as string).length).toBeGreaterThan(0);
}

for (const resource of RESOURCES) {
  describe(`PATCH ${resource.path}/:id — error paths`, () => {
    beforeEach(resetState);

    it('rejects a non-numeric ID with a structured 400 BAD_REQUEST envelope', async () => {
      const app = await buildApp();
      const res = await request(app)
        .patch(`${resource.path}/abc`)
        .set('Content-Type', 'application/json')
        .send(resource.patchBody);
      expect(res.status).toBe(400);
      expectStructuredErrorEnvelope(res.body, 'BAD_REQUEST');
      expect(res.body.error).toMatch(/invalid id/i);
      // The route never reached the DB call.
      expect(_updateSetArgs.length).toBe(0);
    });

    it('returns a structured 500 INTERNAL_ERROR when the DB throws unexpectedly', async () => {
      const app = await buildApp();
      _updateReturnQueue = [new Error('connection terminated unexpectedly')];
      const res = await request(app)
        .patch(`${resource.path}/42`)
        .set('Content-Type', 'application/json')
        .send(resource.patchBody);
      expect(res.status).toBe(500);
      expectStructuredErrorEnvelope(res.body, 'INTERNAL_ERROR');
      expect(res.body.error).toMatch(resource.patchFailureMessage);
    });
  });

  if (resource.hasDelete) {
    describe(`DELETE ${resource.path}/:id — error paths`, () => {
      beforeEach(resetState);

      it('rejects a non-numeric ID with a structured 400 BAD_REQUEST envelope', async () => {
        const app = await buildApp();
        const res = await request(app)
          .delete(`${resource.path}/abc`)
          .set('Content-Type', 'application/json')
          .send({});
        expect(res.status).toBe(400);
        expectStructuredErrorEnvelope(res.body, 'BAD_REQUEST');
        expect(res.body.error).toMatch(/invalid id/i);
        // The route never reached the DB call.
        expect(_deleteReturnQueue.length).toBe(0);
      });

      it('returns a structured 500 INTERNAL_ERROR when the DB throws unexpectedly', async () => {
        const app = await buildApp();
        _deleteReturnQueue = [new Error('connection terminated unexpectedly')];
        const res = await request(app)
          .delete(`${resource.path}/42`)
          .set('Content-Type', 'application/json')
          .send({});
        expect(res.status).toBe(500);
        expectStructuredErrorEnvelope(res.body, 'INTERNAL_ERROR');
        expect(res.body.error).toMatch(resource.deleteFailureMessage!);
      });
    });
  }
}
