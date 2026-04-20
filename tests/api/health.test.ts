import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import healthRouter from '../../artifacts/api-server/src/routes/health';
import { createTestApp } from '../utils/test-app';

describe('GET /healthz', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.use(healthRouter);
  });

  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('responds with JSON content type', async () => {
    const res = await request(app).get('/healthz');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
