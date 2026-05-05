/**
 * Lyte Signals / Incidents / Playbooks API Tests
 *
 * Companion to lyte-action-queue.test.ts. Exercises the remaining lyte.ts
 * resource groups via supertest with a mocked DB layer. Auth and mutation
 * middleware are bypassed so route logic, response formatting, broadcast
 * wiring, and 404 paths are exercised directly.
 *
 * Covers (per task #4327):
 *  - GET /lyte/signals returns paginated rows
 *  - POST /lyte/signals creates a row and triggers broadcastWs + publish
 *  - PATCH /lyte/signals/:id returns 404 for missing record
 *  - PATCH /lyte/incidents/:id updates state correctly
 *
 * Also covers (paranoid extras for full lane coverage):
 *  - GET /lyte/incidents pagination
 *  - POST /lyte/incidents creates a row
 *  - PATCH /lyte/incidents/:id returns 404 for missing record
 *  - GET /lyte/playbooks pagination
 *  - GET /lyte/playbooks/:id returns 404 for missing record
 *  - POST /lyte/playbooks creates a row
 *  - PATCH /lyte/playbooks/:id updates correctly + 404 for missing
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SelectResult = unknown[] | Error;
let _selectQueue: SelectResult[] = [];
let _insertReturnQueue: unknown[][] = [];
let _insertValues: unknown[] = [];
let _updateSetArgs: unknown[] = [];
let _updateReturnQueue: unknown[][] = [];
let _broadcastCalls: Array<{ channel: string; event: string; payload: unknown }> = [];
let _publishCalls: Array<{ channel: string; event: string; payload: unknown }> = [];

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

  function makeSelectChain() {
    const result = _selectQueue.shift() ?? [];
    const finalize = () =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => chain;
    chain.offset = () => finalize();
    chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      finalize().then(resolve, reject);
    chain.catch = (rej: (e: unknown) => unknown) => finalize().catch(rej);
    return chain;
  }

  function makeInsertChain() {
    const result = (_insertReturnQueue.shift() ?? []) as unknown[];
    const chain: Record<string, unknown> = {};
    chain.values = (v: unknown) => {
      _insertValues.push(v);
      return chain;
    };
    chain.returning = () => Promise.resolve(result);
    return chain;
  }

  function makeUpdateChain() {
    const result = (_updateReturnQueue.shift() ?? []) as unknown[];
    const chain: Record<string, unknown> = {};
    chain.set = (args: unknown) => {
      _updateSetArgs.push(args);
      return chain;
    };
    chain.where = () => chain;
    chain.returning = () => Promise.resolve(result);
    return chain;
  }

  const db = {
    select: (_projection?: unknown) => makeSelectChain(),
    insert: (_table?: unknown) => makeInsertChain(),
    update: (_table?: unknown) => makeUpdateChain(),
    delete: (_table?: unknown) => ({
      where: () => ({ returning: () => Promise.resolve([]) }),
    }),
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
  broadcastWs: vi.fn((channel: string, event: string, payload: unknown) => {
    _broadcastCalls.push({ channel, event, payload });
  }),
}));

vi.mock('../../lib/websocket.js', () => ({
  publish: vi.fn((channel: string, event: string, payload: unknown) => {
    _publishCalls.push({ channel, event, payload });
  }),
  WS_CHANNELS: {
    LYTE_SIGNAL_NEW: 'lyte:signal:new',
    LYTE_SIGNAL_UPDATE: 'lyte:signal:update',
  },
}));

vi.mock('@szl-holdings/ai-engine/domain-embedding-hooks', () => ({
  ingestLyteSystem: vi.fn().mockResolvedValue(undefined),
}));

function makeSignalRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    workspaceId: null,
    sourceType: 'monitoring',
    severity: 'high',
    status: 'new',
    title: 'High latency detected',
    description: 'p95 over threshold for 10m',
    payload: {},
    receivedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeIncidentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    workspaceId: null,
    title: 'Test Incident',
    description: 'A test incident.',
    severity: 'high',
    status: 'open',
    assignedTo: null,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makePlaybookRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    workspaceId: null,
    name: 'Test Playbook',
    description: 'A test playbook.',
    steps: [{ id: 's1', title: 'Step 1' }],
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

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
  _selectQueue = [];
  _insertReturnQueue = [];
  _insertValues = [];
  _updateSetArgs = [];
  _updateReturnQueue = [];
  _broadcastCalls = [];
  _publishCalls = [];
}

describe('GET /lyte/signals — pagination', () => {
  beforeEach(resetState);

  it('returns 200 with data array and pagination meta', async () => {
    const app = await buildApp();
    _selectQueue = [[makeSignalRow()], [{ count: 1 }]];
    const res = await request(app).get('/lyte/signals');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta.total).toBe(1);
  });

  it('returns multiple paginated rows preserving order from the mock', async () => {
    const app = await buildApp();
    const rows = [
      makeSignalRow({ id: 1, title: 'Newer' }),
      makeSignalRow({ id: 2, title: 'Older' }),
    ];
    _selectQueue = [rows, [{ count: 2 }]];
    const res = await request(app).get('/lyte/signals?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].title).toBe('Newer');
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.limit).toBe(10);
  });

  it('returns empty data when no signals exist', async () => {
    const app = await buildApp();
    _selectQueue = [[], [{ count: 0 }]];
    const res = await request(app).get('/lyte/signals');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('returns a structured 500 when the DB throws', async () => {
    const app = await buildApp();
    const dbErr = new Error('connection terminated');
    _selectQueue = [dbErr, dbErr];
    const res = await request(app).get('/lyte/signals');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to list signals/i);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});

describe('POST /lyte/signals — create + broadcast', () => {
  beforeEach(resetState);

  it('creates a row, returns 201, and triggers broadcastWs + publish', async () => {
    const app = await buildApp();
    const created = makeSignalRow({ id: 99, severity: 'critical', sourceType: 'security' });
    _insertReturnQueue = [[created]];
    const res = await request(app)
      .post('/lyte/signals')
      .set('Content-Type', 'application/json')
      .send({ sourceType: 'security', severity: 'critical', title: 'Breach attempt' });
    expect(res.status).toBe(201);
    const row = res.body.data ?? res.body;
    expect(row.id).toBe(99);
    expect(_insertValues.length).toBe(1);
    // broadcastWs called once with the canonical signal payload
    expect(_broadcastCalls.length).toBe(1);
    expect(_broadcastCalls[0]).toMatchObject({
      channel: 'lyte-metrics',
      event: 'signal-created',
      payload: { id: 99, type: 'security', severity: 'critical' },
    });
    // publish called once on the LYTE_SIGNAL_NEW channel with the full row
    expect(_publishCalls.length).toBe(1);
    expect(_publishCalls[0]?.channel).toBe('lyte:signal:new');
    expect(_publishCalls[0]?.event).toBe('signal-created');
    expect((_publishCalls[0]?.payload as { id: number }).id).toBe(99);
  });
});

describe('PATCH /lyte/signals/:id — update + 404', () => {
  beforeEach(resetState);

  it('updates an existing signal and broadcasts an update event', async () => {
    const app = await buildApp();
    const updated = makeSignalRow({ id: 7, severity: 'medium', status: 'acknowledged' });
    _updateReturnQueue = [[updated]];
    const res = await request(app)
      .patch('/lyte/signals/7')
      .set('Content-Type', 'application/json')
      .send({ status: 'acknowledged', severity: 'medium' });
    expect(res.status).toBe(200);
    const row = res.body.data ?? res.body;
    expect(row.id).toBe(7);
    expect(row.status).toBe('acknowledged');
    expect(_updateSetArgs.length).toBe(1);
    expect(_broadcastCalls.length).toBe(1);
    expect(_broadcastCalls[0]).toMatchObject({
      channel: 'lyte-metrics',
      event: 'signal-updated',
      payload: { id: 7 },
    });
  });

  it('returns 404 when the signal does not exist', async () => {
    const app = await buildApp();
    _updateReturnQueue = [[]];
    const res = await request(app)
      .patch('/lyte/signals/9999')
      .set('Content-Type', 'application/json')
      .send({ status: 'acknowledged' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/signal/i);
    // No broadcast should have fired for a missing record.
    expect(_broadcastCalls.length).toBe(0);
  });

  it('rejects a non-numeric ID with 400 before any DB write', async () => {
    const app = await buildApp();
    const res = await request(app)
      .patch('/lyte/signals/abc')
      .set('Content-Type', 'application/json')
      .send({ status: 'acknowledged' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid id/i);
    expect(_updateSetArgs.length).toBe(0);
  });
});

describe('GET /lyte/incidents — pagination', () => {
  beforeEach(resetState);

  it('returns 200 with paginated rows', async () => {
    const app = await buildApp();
    _selectQueue = [[makeIncidentRow(), makeIncidentRow({ id: 2 })], [{ count: 2 }]];
    const res = await request(app).get('/lyte/incidents');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
  });
});

describe('POST /lyte/incidents — create', () => {
  beforeEach(resetState);

  it('creates an incident and returns 201', async () => {
    const app = await buildApp();
    const created = makeIncidentRow({ id: 11, title: 'New Incident' });
    _insertReturnQueue = [[created]];
    const res = await request(app)
      .post('/lyte/incidents')
      .set('Content-Type', 'application/json')
      .send({ title: 'New Incident', severity: 'high', status: 'open' });
    expect(res.status).toBe(201);
    const row = res.body.data ?? res.body;
    expect(row.id).toBe(11);
    expect(_insertValues.length).toBe(1);
  });
});

describe('PATCH /lyte/incidents/:id — update state + 404', () => {
  beforeEach(resetState);

  it('updates state correctly and returns the updated row', async () => {
    const app = await buildApp();
    const updated = makeIncidentRow({ id: 5, status: 'resolved' });
    _updateReturnQueue = [[updated]];
    const res = await request(app)
      .patch('/lyte/incidents/5')
      .set('Content-Type', 'application/json')
      .send({ status: 'resolved' });
    expect(res.status).toBe(200);
    const row = res.body.data ?? res.body;
    expect(row.id).toBe(5);
    expect(row.status).toBe('resolved');
    expect(_updateSetArgs.length).toBe(1);
    const setArg = _updateSetArgs[0] as Record<string, unknown>;
    expect(setArg.status).toBe('resolved');
    // The route stamps updatedAt server-side.
    expect(setArg).toHaveProperty('updatedAt');
    expect(setArg.updatedAt).toBeInstanceOf(Date);
  });

  it('returns 404 when the incident does not exist', async () => {
    const app = await buildApp();
    _updateReturnQueue = [[]];
    const res = await request(app)
      .patch('/lyte/incidents/9999')
      .set('Content-Type', 'application/json')
      .send({ status: 'resolved' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/incident/i);
  });

  it('rejects a non-numeric ID with 400', async () => {
    const app = await buildApp();
    const res = await request(app)
      .patch('/lyte/incidents/abc')
      .set('Content-Type', 'application/json')
      .send({ status: 'resolved' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid id/i);
    expect(_updateSetArgs.length).toBe(0);
  });
});

describe('GET /lyte/playbooks — list and detail', () => {
  beforeEach(resetState);

  it('returns 200 with paginated playbooks', async () => {
    const app = await buildApp();
    _selectQueue = [[makePlaybookRow()], [{ count: 1 }]];
    const res = await request(app).get('/lyte/playbooks');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Test Playbook');
  });

  it('GET /lyte/playbooks/:id returns 404 when missing', async () => {
    const app = await buildApp();
    _selectQueue = [[]];
    const res = await request(app).get('/lyte/playbooks/9999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/playbook/i);
  });

  it('GET /lyte/playbooks/:id returns the row when present', async () => {
    const app = await buildApp();
    _selectQueue = [[makePlaybookRow({ id: 42, name: 'Recovery' })]];
    const res = await request(app).get('/lyte/playbooks/42');
    expect(res.status).toBe(200);
    const row = res.body.data ?? res.body;
    expect(row.id).toBe(42);
    expect(row.name).toBe('Recovery');
  });
});

describe('POST /lyte/playbooks — create', () => {
  beforeEach(resetState);

  it('creates a playbook and returns 201', async () => {
    const app = await buildApp();
    const created = makePlaybookRow({ id: 21, name: 'Created Playbook' });
    _insertReturnQueue = [[created]];
    const res = await request(app)
      .post('/lyte/playbooks')
      .set('Content-Type', 'application/json')
      .send({ name: 'Created Playbook', steps: [{ id: 's1', title: 'Step 1' }] });
    expect(res.status).toBe(201);
    const row = res.body.data ?? res.body;
    expect(row.id).toBe(21);
    expect(_insertValues.length).toBe(1);
  });
});

describe('PATCH /lyte/playbooks/:id — update + 404', () => {
  beforeEach(resetState);

  it('updates a playbook and returns 200', async () => {
    const app = await buildApp();
    const updated = makePlaybookRow({ id: 12, name: 'Renamed Playbook' });
    _updateReturnQueue = [[updated]];
    const res = await request(app)
      .patch('/lyte/playbooks/12')
      .set('Content-Type', 'application/json')
      .send({ name: 'Renamed Playbook' });
    expect(res.status).toBe(200);
    const row = res.body.data ?? res.body;
    expect(row.id).toBe(12);
    expect(row.name).toBe('Renamed Playbook');
    expect(_updateSetArgs.length).toBe(1);
    const setArg = _updateSetArgs[0] as Record<string, unknown>;
    expect(setArg).toHaveProperty('updatedAt');
  });

  it('returns 404 when the playbook does not exist', async () => {
    const app = await buildApp();
    _updateReturnQueue = [[]];
    const res = await request(app)
      .patch('/lyte/playbooks/9999')
      .set('Content-Type', 'application/json')
      .send({ name: 'Anything' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/playbook/i);
  });
});
