/**
 * NEXUS Orchestration trace ID — durable persistence regression (Task #4870).
 *
 * Verifies:
 *   1. POST /nexus/orchestrate persists `traceId` to the orchestration_plans
 *      table via the `insert(...).values({...})` call — proving the value is
 *      written durably and not just derived on read.
 *   2. The persisted `traceId` matches the value returned to the caller (via
 *      the in-memory plan available through GET /orchestrate/:id), so the
 *      hydrated row will round-trip to the same trace ID across restarts.
 *   3. When a row from the DB has a stored `trace_id` that differs from the
 *      legacy `buildTraceId(row.id)` derivation, the stored value wins —
 *      protecting historical plans from silently drifting if the derivation
 *      convention ever changes.
 */

import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ─── Capture insert values written through the drizzle stub ───────────────────

const capturedInserts: Array<Record<string, unknown>> = [];
let nextSelectRows: Array<Record<string, unknown>> = [];

vi.mock('drizzle-orm', () => {
  const noop = (..._args: unknown[]) => ({});
  return {
    eq: noop,
    and: noop,
    or: noop,
    desc: noop,
    sql: noop,
    ilike: noop,
    ne: noop,
    gte: noop,
    lte: noop,
  };
});

vi.mock('@szl-holdings/db', () => {
  const stubTable = {};
  const makeChain = (): Record<string, unknown> => {
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => Promise.resolve(nextSelectRows);
    chain.offset = () => chain;
    chain.select = () => chain;
    chain.insert = () => chain;
    chain.values = (vals: Record<string, unknown>) => {
      capturedInserts.push(vals);
      return chain;
    };
    chain.update = () => chain;
    chain.set = () => chain;
    chain.delete = () => chain;
    chain.returning = () => Promise.resolve([]);
    chain.onConflictDoNothing = () => Promise.resolve([]);
    chain.onConflictDoUpdate = () => Promise.resolve([]);
    chain.execute = () => Promise.resolve({ rowCount: 0, rows: nextSelectRows });
    chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve(nextSelectRows).then(resolve);
    return chain;
  };
  const db = new Proxy({}, { get: () => () => makeChain() });
  return {
    db,
    nexusMemoryTable: stubTable,
    nexusSkillsTable: stubTable,
    nexusProtocolToolsTable: stubTable,
    nexusOrchestrationPlansTable: stubTable,
    nexusIngestJobsTable: stubTable,
    thirdPartyLeadersTable: stubTable,
    auditEventsTable: stubTable,
    usersTable: stubTable,
  };
});

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (schema: unknown) => schema,
}));
vi.mock('@szl-holdings/forge-runtime', () => ({
  forgeEvidenceStore: { get: vi.fn(), set: vi.fn(), clear: vi.fn(), delete: vi.fn() },
  forgeRuntime: { run: vi.fn(), registerHandler: vi.fn(), execute: vi.fn() },
  forgeTimeline: { record: vi.fn(), append: vi.fn() },
  runCodeHandler: vi.fn(),
}));
vi.mock('@workspace/tool-mesh', () => ({
  defaultCatalogSearch: vi.fn().mockResolvedValue([]),
  defaultToolRegistry: { get: vi.fn(), set: vi.fn(), has: vi.fn(), values: vi.fn(() => []) },
  registerPRAXISHandlers: vi.fn(),
}));
vi.mock('../../lib/api-response', () => ({
  sendSuccess: (res: Response, data: unknown) => res.status(200).json(data),
  sendError: (res: Response, message: string, status = 500) => res.status(status).json({ error: message }),
  sendCreated: (res: Response, data: unknown) => res.status(201).json(data),
  sendBadRequest: (res: Response, message: string) => res.status(400).json({ error: message }),
  sendNoContent: (res: Response) => res.status(204).send(),
  sendConflict: (res: Response, message: string) => res.status(409).json({ error: message }),
  handleRouteError: (res: Response, _err: unknown, _ctx: string) => {
    if (!res.headersSent) res.status(500).json({ error: 'internal error' });
  },
}));
vi.mock('../../lib/ai-gateway', () => ({ gatewayInfer: vi.fn().mockResolvedValue('ok') }));
vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../lib/validation', () => ({
  listQuerySchema: {},
  validateBody: (_schema: unknown) => (_req: Request, _res: Response, next: NextFunction) => next(),
  validateQuery: (_schema: unknown) => (_req: Request, _res: Response, next: NextFunction) => next(),
}));
vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (_opts: unknown) => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));
vi.mock('../../middlewares/session-policy', () => ({
  writeAuditEvent: vi.fn().mockResolvedValue(undefined),
  sessionPolicy: (_req: Request, _res: Response, next: NextFunction) => next(),
}));
vi.mock('../../middlewares/sliding-window-limiter', () => ({
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const nexusModule = await import('../nexus');
const { default: nexusRouter, rowToOrchestrationPlan } = nexusModule;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as Request & { user?: { email: string; id: number; roles: string[] } }).user = {
      email: 'ops@example.com',
      id: 1,
      roles: ['ops'],
    };
    next();
  });
  app.use('/nexus', nexusRouter);
  return app;
}

describe('Orchestration trace ID — durable persistence (Task #4870)', () => {
  it('writes traceId to the DB insert payload at plan creation time', async () => {
    capturedInserts.length = 0;
    const app = buildApp();

    const submit = await request(app)
      .post('/nexus/orchestrate')
      .send({ intent: 'Earnings brief for AAPL Q1 2026' });

    expect(submit.status).toBe(200);
    const planId = submit.body.id as string;
    expect(planId).toBeTruthy();

    // Allow the fire-and-forget persist call(s) to flush.
    await new Promise((r) => setTimeout(r, 25));

    const planInsert = capturedInserts.find((v) => v.id === planId);
    expect(planInsert, 'orchestration plan should be persisted via db.insert(...).values({...})').toBeTruthy();
    expect(planInsert?.traceId, 'traceId must be in the persisted row').toBe(
      `trace_${planId.slice(0, 12)}`,
    );
  });

  it('GET /orchestrate/:id returns the same traceId that was persisted', async () => {
    capturedInserts.length = 0;
    const app = buildApp();

    const submit = await request(app)
      .post('/nexus/orchestrate')
      .send({ intent: 'Earnings brief for NVDA Q4 2025' });
    const planId = submit.body.id as string;

    await new Promise((r) => setTimeout(r, 25));

    const detail = await request(app).get(`/nexus/orchestrate/${planId}`);
    expect(detail.status).toBe(200);

    const planInsert = capturedInserts.find((v) => v.id === planId);
    expect(detail.body.traceId).toBe(planInsert?.traceId);
    expect(detail.body.traceId).toMatch(/^trace_/);
  });

  it('hydrates a stored trace_id verbatim through rowToOrchestrationPlan, even if it disagrees with the legacy derivation', async () => {
    // Exercise the actual production hydrator: feed it a row whose stored
    // trace_id does NOT match what `trace_${id.slice(0,12)}` would produce
    // today, and verify the stored value wins. This is the regression guard
    // for "trace IDs silently drift after a derivation change".
    const archivalId = randomUUID();
    const archivalTraceId = 'trace_legacy_v0_xyz';
    const row = {
      id: archivalId,
      intent: 'historical plan',
      status: 'completed' as const,
      steps: [],
      stitchedOutput: 'done',
      createdBy: 'ops@example.com',
      traceId: archivalTraceId,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      completedAt: new Date('2025-01-01T00:01:00Z'),
    };

    const hydrated = rowToOrchestrationPlan(row as Parameters<typeof rowToOrchestrationPlan>[0]);
    expect(hydrated.traceId).toBe(archivalTraceId);
    expect(hydrated.traceId).not.toBe(`trace_${archivalId.slice(0, 12)}`);

    // And confirm the legacy fallback still kicks in for a pre-migration row
    // (no stored traceId).
    const legacyRow = { ...row, traceId: null };
    const legacyHydrated = rowToOrchestrationPlan(
      legacyRow as Parameters<typeof rowToOrchestrationPlan>[0],
    );
    expect(legacyHydrated.traceId).toBe(`trace_${archivalId.slice(0, 12)}`);
  });
});
