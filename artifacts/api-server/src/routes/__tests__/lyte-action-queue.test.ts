/**
 * Action Queue API Tests
 *
 * Tests the GET /lyte/actions and PATCH /lyte/actions/:id endpoints via supertest
 * with a mocked DB layer. Auth and mutation middleware are bypassed so the route
 * logic, response formatting, and state-transition behaviour are exercised directly.
 *
 * Covers:
 *  - GET /lyte/actions returns 200 with evidence, auditHistory, and workflowStage
 *    mapped out of the metadata / stateHistory columns.
 *  - GET /lyte/actions?role=<role> passes the role filter to the DB query without
 *    crashing, returning only the rows provided by the mock.
 *  - PATCH /lyte/actions/:id transitions state correctly, appends an entry to
 *    stateHistory, and returns the formatted row.
 *  - PATCH /lyte/actions/:id returns 404 when the action does not exist.
 *  - PATCH /lyte/actions/:id does NOT append a stateHistory entry when the
 *    supplied state matches the current state (no-op transition).
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SelectResult = unknown[] | Error;
let _selectQueue: SelectResult[] = [];
let _updateSetArgs: unknown[] = [];
let _updateReturnQueue: unknown[][] = [];

class InvalidIdError extends Error {
  constructor() {
    super('Invalid ID parameter');
    this.name = 'InvalidIdError';
  }
}

vi.mock('@szl-holdings/db', () => {
  const lyteActionsTable = {
    _name: 'lyte_actions',
    id: { _col: 'id' },
    state: { _col: 'state', _: { data: '' } },
    signalCategory: { _col: 'signal_category', _: { data: '' } },
    roleVisibility: { _col: 'role_visibility' },
    createdAt: { _col: 'created_at' },
    stateHistory: { _col: 'state_history' },
    updatedAt: { _col: 'updated_at' },
    resolvedAt: { _col: 'resolved_at' },
  } as Record<string, unknown>;

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
    update: (_table?: unknown) => makeUpdateChain(),
  };

  return {
    db,
    lyteActionsTable,
    lyteWorkspacesTable: { _name: 'lyte_workspaces' },
    lyteSignalsTable: { _name: 'lyte_signals' },
    lyteCommandCardsTable: { _name: 'lyte_command_cards' },
    lyteIncidentsTable: { _name: 'lyte_incidents' },
    lytePlaybooksTable: { _name: 'lyte_playbooks' },
    lyteRecommendationsTable: { _name: 'lyte_recommendations' },
    lyteSavedViewsTable: { _name: 'lyte_saved_views' },
    lyteReadinessItemsTable: { _name: 'lyte_readiness_items' },
    lyteInterventionsTable: { _name: 'lyte_interventions' },
    lytePressureCellsTable: { _name: 'lyte_pressure_cells' },
    lyteDriftItemsTable: { _name: 'lyte_drift_items' },
    lyteDriftHistoryTable: { _name: 'lyte_drift_history' },
    lyteDebtItemsTable: { _name: 'lyte_debt_items' },
    lyteDebtScoreHistoryTable: { _name: 'lyte_debt_score_history' },
    insertLyteActionSchema: { parse: (v: unknown) => v },
    insertLyteCommandCardSchema: { parse: (v: unknown) => v },
    insertLyteIncidentSchema: { parse: (v: unknown) => v },
    insertLytePlaybookSchema: { parse: (v: unknown) => v },
    insertLyteReadinessItemSchema: { parse: (v: unknown) => v },
    insertLyteRecommendationSchema: { parse: (v: unknown) => v },
    insertLyteSavedViewSchema: { parse: (v: unknown) => v },
    insertLyteSignalSchema: { parse: (v: unknown) => v },
    insertLyteWorkspaceSchema: { parse: (v: unknown) => v },
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
  WS_CHANNELS: { LYTE_SIGNAL_NEW: 'lyte:signal:new' },
}));

vi.mock('@szl-holdings/ai-engine/domain-embedding-hooks', () => ({
  ingestLyteSystem: vi.fn().mockResolvedValue(undefined),
}));

function makeActionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    workspaceId: null,
    signalId: null,
    title: 'Test Action',
    description: 'A test action description.',
    signalCategory: 'approval_latency',
    state: 'new',
    priority: 'high',
    owner: 'Jordan Alvarez',
    assignedTo: null,
    valueAtRisk: null,
    notes: null,
    dueAt: null,
    resolvedAt: null,
    roleVisibility: { executive: true, operations: true },
    metadata: {
      workflowStage: 'Legal Review',
      evidence: [
        { id: 'e1', label: 'Queue Dwell', value: '48h', source: 'audit-log', confidence: 0.98 },
      ],
    },
    stateHistory: [],
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

describe('GET /lyte/actions — response contract', () => {
  beforeEach(() => {
    _selectQueue = [];
    _updateSetArgs = [];
    _updateReturnQueue = [];
  });

  it('returns 200 with data array and pagination meta', async () => {
    const app = await buildApp();
    const action = makeActionRow();
    _selectQueue = [[action], [{ count: 1 }]];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body).toHaveProperty('meta');
    expect(typeof res.body.meta.total).toBe('number');
  });

  it('maps workflowStage from metadata onto the response row', async () => {
    const app = await buildApp();
    const action = makeActionRow({ metadata: { workflowStage: 'Contract Review', evidence: [] } });
    _selectQueue = [[action], [{ count: 1 }]];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(200);
    const row = res.body.data[0];
    expect(row.workflowStage).toBe('Contract Review');
  });

  it('maps evidence array from metadata onto the response row', async () => {
    const app = await buildApp();
    const evidence = [
      { id: 'e1', label: 'SLA Breach', value: '48h', source: 'audit', confidence: 0.99 },
    ];
    const action = makeActionRow({ metadata: { workflowStage: 'Review', evidence } });
    _selectQueue = [[action], [{ count: 1 }]];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(200);
    const row = res.body.data[0];
    expect(Array.isArray(row.evidence)).toBe(true);
    expect(row.evidence.length).toBe(1);
    expect(row.evidence[0].label).toBe('SLA Breach');
  });

  it('populates auditHistory from stateHistory when stateHistory is non-empty', async () => {
    const app = await buildApp();
    const historyEntry = {
      id: 'sh-001',
      action: 'Transitioned to acknowledged',
      actor: 'Jordan Alvarez',
      actorType: 'user',
      timestamp: '2026-01-02T10:00:00.000Z',
    };
    const action = makeActionRow({
      stateHistory: [historyEntry],
      metadata: { workflowStage: 'Review', evidence: [], auditHistory: [] },
    });
    _selectQueue = [[action], [{ count: 1 }]];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(200);
    const row = res.body.data[0];
    expect(Array.isArray(row.auditHistory)).toBe(true);
    expect(row.auditHistory.length).toBe(1);
    expect(row.auditHistory[0].action).toBe('Transitioned to acknowledged');
  });

  it('falls back to auditHistory from metadata when stateHistory is empty', async () => {
    const app = await buildApp();
    const fallbackEntry = { id: 'ah-001', event: 'created', actor: 'System' };
    const action = makeActionRow({
      stateHistory: [],
      metadata: { workflowStage: 'Pending', evidence: [], auditHistory: [fallbackEntry] },
    });
    _selectQueue = [[action], [{ count: 1 }]];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(200);
    const row = res.body.data[0];
    expect(Array.isArray(row.auditHistory)).toBe(true);
    expect(row.auditHistory[0].id).toBe('ah-001');
  });

  it('sets dueDate to ISO string from dueAt', async () => {
    const app = await buildApp();
    const dueAt = new Date('2026-06-01T12:00:00Z');
    const action = makeActionRow({ dueAt });
    _selectQueue = [[action], [{ count: 1 }]];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(200);
    expect(res.body.data[0].dueDate).toBe(dueAt.toISOString());
  });

  it('sets dueDate to null when dueAt is null', async () => {
    const app = await buildApp();
    const action = makeActionRow({ dueAt: null });
    _selectQueue = [[action], [{ count: 1 }]];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(200);
    expect(res.body.data[0].dueDate).toBeNull();
  });

  it('returns empty data array when DB returns no actions', async () => {
    const app = await buildApp();
    _selectQueue = [[], [{ count: 0 }]];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('GET with role filter returns all actions provided by the mock (role-visible)', async () => {
    const app = await buildApp();
    const execAction = makeActionRow({
      id: 10,
      roleVisibility: { executive: true },
      title: 'Executive Action',
    });
    _selectQueue = [[execAction], [{ count: 1 }]];
    const res = await request(app).get('/lyte/actions?role=executive');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Executive Action');
  });

  it('GET with role filter returns empty list when mock returns no matching actions', async () => {
    const app = await buildApp();
    _selectQueue = [[], [{ count: 0 }]];
    const res = await request(app).get('/lyte/actions?role=analyst');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});

describe('PATCH /lyte/actions/:id — state transition and stateHistory', () => {
  beforeEach(() => {
    _selectQueue = [];
    _updateSetArgs = [];
    _updateReturnQueue = [];
  });

  it('transitions state and appends an entry to stateHistory', async () => {
    const app = await buildApp({ displayName: 'Alice' });
    const current = makeActionRow({ id: 42, state: 'new', stateHistory: [] });
    const updated = {
      ...current,
      state: 'acknowledged',
      stateHistory: [
        {
          id: 'sh-123',
          action: 'Transitioned to acknowledged',
          actor: 'Alice',
          actorType: 'user',
          timestamp: new Date().toISOString(),
        },
      ],
    };
    _selectQueue = [[current]];
    _updateReturnQueue = [[updated]];
    const res = await request(app)
      .patch('/lyte/actions/42')
      .set('Content-Type', 'application/json')
      .send({ state: 'acknowledged' });
    expect(res.status).toBe(200);
    const row = res.body.data ?? res.body;
    expect(row.state).toBe('acknowledged');
    expect(_updateSetArgs.length).toBeGreaterThan(0);
    const setArg = _updateSetArgs[0] as Record<string, unknown>;
    expect(setArg.state).toBe('acknowledged');
    const history = setArg.stateHistory as Array<Record<string, unknown>>;
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(1);
    expect(history[0]!.action).toBe('Transitioned to acknowledged');
    expect(history[0]!.actor).toBe('Alice');
  });

  it('does not append to stateHistory when state is unchanged', async () => {
    const app = await buildApp({ displayName: 'Bob' });
    const current = makeActionRow({ id: 43, state: 'new', stateHistory: [] });
    const updated = { ...current, notes: 'Internal note added' };
    _selectQueue = [[current]];
    _updateReturnQueue = [[updated]];
    const res = await request(app)
      .patch('/lyte/actions/43')
      .set('Content-Type', 'application/json')
      .send({ state: 'new', notes: 'Internal note added' });
    expect(res.status).toBe(200);
    expect(_updateSetArgs.length).toBeGreaterThan(0);
    const setArg = _updateSetArgs[0] as Record<string, unknown>;
    const history = setArg.stateHistory as unknown[];
    expect(history.length).toBe(0);
  });

  it('sets resolvedAt when transitioning to resolved', async () => {
    const app = await buildApp({ displayName: 'Carol' });
    const current = makeActionRow({ id: 44, state: 'assigned', stateHistory: [] });
    const resolvedRow = { ...current, state: 'resolved', resolvedAt: new Date() };
    _selectQueue = [[current]];
    _updateReturnQueue = [[resolvedRow]];
    const res = await request(app)
      .patch('/lyte/actions/44')
      .set('Content-Type', 'application/json')
      .send({ state: 'resolved' });
    expect(res.status).toBe(200);
    const setArg = _updateSetArgs[0] as Record<string, unknown>;
    expect(setArg).toHaveProperty('resolvedAt');
    expect(setArg.resolvedAt).toBeInstanceOf(Date);
  });

  it('does not set resolvedAt for non-resolved state transitions', async () => {
    const app = await buildApp({ displayName: 'Dave' });
    const current = makeActionRow({ id: 45, state: 'new', stateHistory: [] });
    const updatedRow = { ...current, state: 'acknowledged' };
    _selectQueue = [[current]];
    _updateReturnQueue = [[updatedRow]];
    const res = await request(app)
      .patch('/lyte/actions/45')
      .set('Content-Type', 'application/json')
      .send({ state: 'acknowledged' });
    expect(res.status).toBe(200);
    const setArg = _updateSetArgs[0] as Record<string, unknown>;
    expect(setArg).not.toHaveProperty('resolvedAt');
  });

  it('returns 404 when action does not exist', async () => {
    const app = await buildApp();
    _selectQueue = [[]];
    const res = await request(app)
      .patch('/lyte/actions/9999')
      .set('Content-Type', 'application/json')
      .send({ state: 'acknowledged' });
    expect(res.status).toBe(404);
  });

  it('preserves existing stateHistory entries and appends new one', async () => {
    const app = await buildApp({ displayName: 'Eve' });
    const existingEntry = {
      id: 'sh-old',
      action: 'Transitioned to acknowledged',
      actor: 'Alice',
      actorType: 'user',
      timestamp: '2026-01-01T09:00:00.000Z',
    };
    const current = makeActionRow({
      id: 46,
      state: 'acknowledged',
      stateHistory: [existingEntry],
    });
    const updatedRow = { ...current, state: 'escalated', stateHistory: [existingEntry, {}] };
    _selectQueue = [[current]];
    _updateReturnQueue = [[updatedRow]];
    const res = await request(app)
      .patch('/lyte/actions/46')
      .set('Content-Type', 'application/json')
      .send({ state: 'escalated' });
    expect(res.status).toBe(200);
    const setArg = _updateSetArgs[0] as Record<string, unknown>;
    const history = setArg.stateHistory as unknown[];
    expect(history.length).toBe(2);
  });

  it('returns formatted row with evidence and auditHistory after patch', async () => {
    const app = await buildApp({ displayName: 'Frank' });
    const current = makeActionRow({ id: 47, state: 'new', stateHistory: [] });
    const newEntry = {
      id: 'sh-xyz',
      action: 'Transitioned to assigned',
      actor: 'Frank',
      actorType: 'user',
      timestamp: new Date().toISOString(),
    };
    const updatedRow = {
      ...current,
      state: 'assigned',
      stateHistory: [newEntry],
      metadata: {
        workflowStage: 'Escalated',
        evidence: [{ id: 'e2', label: 'Risk Score', value: '82', source: 'risk-engine' }],
      },
    };
    _selectQueue = [[current]];
    _updateReturnQueue = [[updatedRow]];
    const res = await request(app)
      .patch('/lyte/actions/47')
      .set('Content-Type', 'application/json')
      .send({ state: 'assigned', assignedTo: 'Frank' });
    expect(res.status).toBe(200);
    const row = res.body.data ?? res.body;
    expect(row.workflowStage).toBe('Escalated');
    expect(Array.isArray(row.evidence)).toBe(true);
    expect(row.evidence[0].label).toBe('Risk Score');
    expect(Array.isArray(row.auditHistory)).toBe(true);
    expect(row.auditHistory[0].action).toBe('Transitioned to assigned');
  });
});

describe('Action queue error paths — invalid input and DB failures', () => {
  beforeEach(() => {
    _selectQueue = [];
    _updateSetArgs = [];
    _updateReturnQueue = [];
  });

  it('PATCH /lyte/actions/abc rejects non-numeric ID with a structured 400 error', async () => {
    const app = await buildApp({ displayName: 'Operator' });
    const res = await request(app)
      .patch('/lyte/actions/abc')
      .set('Content-Type', 'application/json')
      .send({ state: 'acknowledged' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toMatch(/invalid id/i);
    expect(res.body.code).toBe('BAD_REQUEST');
    // No DB lookup or update should have run for an invalid ID.
    expect(_updateSetArgs.length).toBe(0);
  });

  it('PATCH /lyte/actions/:id with an empty body returns 200 (no required fields)', async () => {
    const app = await buildApp({ displayName: 'Operator' });
    const current = makeActionRow({ id: 50, state: 'new', stateHistory: [] });
    // Update returns the row unchanged — only stateHistory + updatedAt are set.
    _selectQueue = [[current]];
    _updateReturnQueue = [[current]];
    const res = await request(app)
      .patch('/lyte/actions/50')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(200);
    const row = res.body.data ?? res.body;
    expect(row.id).toBe(50);
    expect(_updateSetArgs.length).toBe(1);
    const setArg = _updateSetArgs[0] as Record<string, unknown>;
    // No state was supplied, so no state-transition fields should be set.
    expect(setArg).not.toHaveProperty('state');
    expect(setArg).not.toHaveProperty('resolvedAt');
    expect(setArg).toHaveProperty('updatedAt');
    // stateHistory is still rewritten to its existing value (no new entry).
    const history = setArg.stateHistory as unknown[];
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(0);
  });

  it('PATCH /lyte/actions/:id rejects an unknown state value with 400 before any DB write', async () => {
    const app = await buildApp({ displayName: 'Operator' });
    // No select queue entries — the route should NEVER reach the DB lookup,
    // because state validation runs before the select.
    const res = await request(app)
      .patch('/lyte/actions/55')
      .set('Content-Type', 'application/json')
      .send({ state: 'frobnicated' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toMatch(/invalid state/i);
    expect(res.body.error).toMatch(/frobnicated/);
    expect(res.body.code).toBe('BAD_REQUEST');
    // No update should have run.
    expect(_updateSetArgs.length).toBe(0);
  });

  it('GET /lyte/actions returns a structured 500 when the DB throws unexpectedly', async () => {
    const app = await buildApp();
    // Both parallel select chains reject — Promise.all rejects on the first.
    const dbErr = new Error('connection terminated unexpectedly');
    _selectQueue = [dbErr, dbErr];
    const res = await request(app).get('/lyte/actions');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toMatch(/failed to list actions/i);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body).toHaveProperty('requestId');
    expect(res.body).toHaveProperty('correlationId');
  });
});
