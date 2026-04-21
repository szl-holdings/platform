import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestApp } from '../utils/test-app';

vi.mock('@szl-holdings/db', () => ({
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [{ cnt: 5 }], rowCount: 1 }),
    totalCount: 1,
    idleCount: 1,
    waitingCount: 0,
    options: { max: 10 },
    end: vi.fn(),
  },
}));

vi.mock('../../artifacts/api-server/src/lib/backup-service', () => ({
  getBackupHealthStatus: vi.fn().mockReturnValue({ healthy: true, lastBackup: null }),
}));

vi.mock('../../artifacts/api-server/src/lib/sentry', () => ({
  Sentry: {
    captureException: vi.fn(),
    withScope: vi.fn(),
    isInitialized: vi.fn().mockReturnValue(false),
  },
}));

vi.mock('../../artifacts/api-server/src/lib/internal-tokens', () => ({
  verifyInternalHeader: vi.fn().mockReturnValue(null),
  tokenHasScope: vi.fn().mockReturnValue(false),
}));

vi.mock('../../artifacts/api-server/src/middlewares/admin-guard', () => ({
  adminGuard: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import healthRouter from '../../artifacts/api-server/src/routes/health';

describe('GET /healthz', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.use(healthRouter);
    process.env.SESSION_SECRET = 'test-secret';
  });

  it('returns 200 with a status field', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  }, 10000);

  it('responds with JSON content type', async () => {
    const res = await request(app).get('/healthz');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  }, 10000);

  it('returns status ok when SESSION_SECRET is set and database is healthy', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  }, 10000);
});
