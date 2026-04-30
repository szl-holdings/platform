/**
 * NEXUS HyperFrames video.render — Route Tests
 *
 * Coverage:
 *   - POST /nexus/bridge/video-render — submits a render job, returns job_id + poll_url
 *   - GET  /nexus/bridge/video-render/:jobId — polls job status (queued → rendering → done)
 *   - GET  /nexus/bridge/video-render — lists all jobs
 *   - Source-level validation schema is tighter than z.unknown()
 *   - Render simulation transitions the job to "done" with a non-empty mp4_url
 */

import { createHash, randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// ─── Heavy module mocks — hoisted before dynamic imports ─────────────────────

vi.mock('drizzle-orm', () => {
  const noop = (..._args: unknown[]) => ({});
  return { eq: noop, and: noop, or: noop, desc: noop, sql: noop, ilike: noop, ne: noop, gte: noop, lte: noop };
});

vi.mock('@szl-holdings/db', () => {
  const stubTable = {};
  const chainable = {
    from: () => chainable,
    where: () => chainable,
    orderBy: () => chainable,
    limit: () => Promise.resolve([]),
    offset: () => chainable,
    select: () => chainable,
    insert: () => chainable,
    values: () => chainable,
    update: () => chainable,
    set: () => chainable,
    delete: () => chainable,
    returning: () => Promise.resolve([]),
    onConflictDoNothing: () => Promise.resolve([]),
    execute: () => Promise.resolve({ rowCount: 0, rows: [] }),
    then: (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve),
  };
  const db = new Proxy({}, { get: () => () => chainable });
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
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
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

// ─── Import the router under test ─────────────────────────────────────────────

const { default: nexusRouter } = await import('../nexus');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/nexus', nexusRouter);
  return app;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /nexus/bridge/video-render', () => {
  it('returns 200 with a job_id and poll_url for a valid composition', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/nexus/bridge/video-render')
      .send({ composition: '<section>Hello</section>', duration: 5, seed: 'test-seed' });

    expect(res.status).toBe(200);
    expect(res.body.job_id).toMatch(/^hvj_/);
    expect(res.body.poll_url).toContain('/nexus/bridge/video-render/');
    expect(res.body.audit_trace).toMatch(/^trace_/);
    expect(res.body.status).toBe('queued');
  });

  it('accepts minimal body with defaults', async () => {
    const app = buildApp();
    const res = await request(app).post('/nexus/bridge/video-render').send({});
    expect(res.status).toBe(200);
    expect(res.body.job_id).toMatch(/^hvj_/);
  });
});

describe('GET /nexus/bridge/video-render/:jobId', () => {
  it('returns 404 for unknown job', async () => {
    const app = buildApp();
    const res = await request(app).get('/nexus/bridge/video-render/hvj_unknown999');
    expect(res.status).toBe(404);
  });

  it('reflects a submitted job immediately as queued or rendering', async () => {
    const app = buildApp();
    const submit = await request(app)
      .post('/nexus/bridge/video-render')
      .send({ composition: '<p>Test</p>', duration: 1 });

    expect(submit.status).toBe(200);
    const jobId = submit.body.job_id as string;
    const poll = await request(app).get(`/nexus/bridge/video-render/${jobId}`);
    expect(poll.status).toBe(200);
    expect(poll.body.job_id).toBe(jobId);
    expect(['queued', 'rendering', 'done']).toContain(poll.body.status);
  });

  it('eventually resolves to done with a non-empty mp4_url', async () => {
    const app = buildApp();
    const submit = await request(app)
      .post('/nexus/bridge/video-render')
      .send({ composition: '<p>tiny</p>', duration: 1 });

    expect(submit.status).toBe(200);
    const jobId = submit.body.job_id as string;

    let mp4Url: string | null = null;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const poll = await request(app).get(`/nexus/bridge/video-render/${jobId}`);
      if (poll.body.status === 'done') {
        mp4Url = poll.body.mp4_url;
        break;
      }
    }

    expect(mp4Url).not.toBeNull();
    expect(mp4Url).toContain(jobId);
    expect(mp4Url?.endsWith('.mp4')).toBe(true);
  }, 20_000);
});

describe('GET /nexus/bridge/video-render (list)', () => {
  it('returns a jobs array', async () => {
    const app = buildApp();
    await request(app).post('/nexus/bridge/video-render').send({ composition: '<p>a</p>', duration: 1 });
    const res = await request(app).get('/nexus/bridge/video-render');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});

describe('video.render source-level validation checks', () => {
  it('validates duration has a max of 3600', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(resolve(__dirname, '../nexus.ts'), 'utf8');
    expect(src).toMatch(/duration.*z\.number\(\).*max\(3600\)/);
  });

  it('validates composition has a max byte limit', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(resolve(__dirname, '../nexus.ts'), 'utf8');
    expect(src).toMatch(/composition.*z\.string\(\).*max\(/);
  });
});
