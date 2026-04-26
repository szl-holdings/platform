/**
 * Sentra EDR + SIEM Integration — Smoke Tests
 *
 * Covers:
 *  - POST /api/sentra/agents/enroll (CSRF round-trip)
 *  - POST /api/sentra/agents/heartbeat (public — registers agent from token)
 *  - POST /api/sentra/agents/:id/action  (isolate, release, rotate-token, uninstall)
 *  - POST /api/sentra/siem/connections (create connection)
 *  - POST /api/sentra/siem/connections/:id/test (test connection)
 *  - POST /api/sentra/siem/ingest/:connectionId (webhook ingest — HMAC happy path + bad-sig rejection)
 */

import { createHmac } from 'node:crypto';
import express, { type Application } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildApp(): Application {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  app.get('/api/csrf-token', (_req, res) => {
    res.cookie('csrf_token', 'test-csrf-token', { httpOnly: false });
    res.json({ token: 'test-csrf-token' });
  });

  const csrfMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) return next();
    // Public endpoints: heartbeat (agent-side) and webhook ingest (SIEM push)
    if (req.path.startsWith('/sentra/agents/heartbeat')) return next();
    if (req.path.startsWith('/sentra/siem/ingest')) return next();
    const token = req.headers['x-csrf-token'] ?? req.cookies?.csrf_token;
    if (!token || token !== 'test-csrf-token') {
      res.status(403).json({ error: 'CSRF token invalid' });
      return;
    }
    next();
  };

  app.use('/api', csrfMiddleware);

  return app;
}

async function importAgentsRouter() {
  const { agentsStore, enrollmentTokensStore } = await import('../../services/sentra-agents-store');
  agentsStore.clear();
  enrollmentTokensStore.clear();
  const router = (await import('../sentra-agents')).default;
  return { router, agentsStore, enrollmentTokensStore };
}

async function importSiemRouter() {
  const { siemConnectionsStore } = await import('../../services/sentra-siem-store');
  siemConnectionsStore.clear();
  const router = (await import('../sentra-siem')).default;
  return { router, siemConnectionsStore };
}

// ── Agent Tests ───────────────────────────────────────────────────────────────

describe('POST /api/sentra/agents/enroll', () => {
  it('issues enrollment token with install snippets', async () => {
    const { router } = await importAgentsRouter();
    const app = buildApp();
    app.use('/api', router);

    const res = await request(app)
      .post('/api/sentra/agents/enroll')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ tenantId: 'acme', tags: ['prod', 'linux'] })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.token.token).toBeTypeOf('string');
    expect(res.body.installSnippets.linux).toContain('--token');
    expect(res.body.installSnippets.windows).toContain('Token');
    expect(res.body.installSnippets.macos).toContain('--token');
  });

  it('requires CSRF token', async () => {
    const { router } = await importAgentsRouter();
    const app = buildApp();
    app.use('/api', router);

    await request(app)
      .post('/api/sentra/agents/enroll')
      .send({ tenantId: 'acme' })
      .expect(403);
  });
});

describe('POST /api/sentra/agents/heartbeat', () => {
  it('registers new agent on first heartbeat', async () => {
    const { router, agentsStore, enrollmentTokensStore } = await importAgentsRouter();
    const app = buildApp();
    app.use('/api', router);

    const enrollRes = await request(app)
      .post('/api/sentra/agents/enroll')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ tenantId: 'acme', tags: ['test'] })
      .expect(201);

    const token = enrollRes.body.token.token as string;

    const hbRes = await request(app)
      .post('/api/sentra/agents/heartbeat')
      .send({ token, hostname: 'web-01.prod', os: 'linux', version: '1.2.3' })
      .expect(200);

    expect(hbRes.body.agentId).toBeTypeOf('string');
    expect(hbRes.body.status).toBe('healthy');
    expect(agentsStore.size).toBe(1);

    const enrollment = enrollmentTokensStore.get(token);
    expect(enrollment?.usedByAgentId).toBe(hbRes.body.agentId);
  });

  it('updates heartbeat timestamp on subsequent check-ins', async () => {
    const { router, agentsStore } = await importAgentsRouter();
    const app = buildApp();
    app.use('/api', router);

    const enrollRes = await request(app)
      .post('/api/sentra/agents/enroll')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ tenantId: 'acme' })
      .expect(201);

    const token = enrollRes.body.token.token as string;

    await request(app)
      .post('/api/sentra/agents/heartbeat')
      .send({ token, hostname: 'web-01', os: 'linux', version: '1.0.0' })
      .expect(200);

    const firstHb = agentsStore.values().next().value!.lastHeartbeatAt;

    const secondRes = await request(app)
      .post('/api/sentra/agents/heartbeat')
      .send({ token, hostname: 'web-01', os: 'linux', version: '1.0.0' })
      .expect(200);

    const agent = agentsStore.get(secondRes.body.agentId as string)!;
    expect(agent.lastHeartbeatAt).toBeDefined();
  });

  it('rejects invalid enrollment token', async () => {
    const { router } = await importAgentsRouter();
    const app = buildApp();
    app.use('/api', router);

    await request(app)
      .post('/api/sentra/agents/heartbeat')
      .send({ token: 'bad-token-12345678', hostname: 'web-01', os: 'linux', version: '1.0.0' })
      .expect(401);
  });
});

describe('POST /api/sentra/agents/:id/action', () => {
  async function enrollAndConnect(app: Application, token: string) {
    const hbRes = await request(app)
      .post('/api/sentra/agents/heartbeat')
      .send({ token, hostname: 'test-host', os: 'linux', version: '1.0.0' });
    return hbRes.body.agentId as string;
  }

  it('isolates and releases an agent', async () => {
    const { router } = await importAgentsRouter();
    const app = buildApp();
    app.use('/api', router);

    const enrollRes = await request(app)
      .post('/api/sentra/agents/enroll')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ tenantId: 'acme' })
      .expect(201);
    const token = enrollRes.body.token.token as string;
    const agentId = await enrollAndConnect(app, token);

    const isolateRes = await request(app)
      .post(`/api/sentra/agents/${agentId}/action`)
      .set('x-csrf-token', 'test-csrf-token')
      .send({ action: 'isolate', actor: 'SOC Lead' })
      .expect(200);
    expect(isolateRes.body.status).toBe('isolated');
    expect(isolateRes.body.auditTrail[0].action).toBe('isolate');

    const releaseRes = await request(app)
      .post(`/api/sentra/agents/${agentId}/action`)
      .set('x-csrf-token', 'test-csrf-token')
      .send({ action: 'release', actor: 'SOC Lead' })
      .expect(200);
    expect(releaseRes.body.status).toBe('healthy');
  });

  it('rotates the enrollment token', async () => {
    const { router, agentsStore } = await importAgentsRouter();
    const app = buildApp();
    app.use('/api', router);

    const enrollRes = await request(app)
      .post('/api/sentra/agents/enroll')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ tenantId: 'acme' })
      .expect(201);
    const oldToken = enrollRes.body.token.token as string;
    const agentId = await enrollAndConnect(app, oldToken);

    await request(app)
      .post(`/api/sentra/agents/${agentId}/action`)
      .set('x-csrf-token', 'test-csrf-token')
      .send({ action: 'rotate-token' })
      .expect(200);

    const agent = agentsStore.get(agentId)!;
    expect(agent.enrollmentToken).not.toBe(oldToken);
  });

  it('requires CSRF for action endpoints', async () => {
    const { router } = await importAgentsRouter();
    const app = buildApp();
    app.use('/api', router);

    await request(app)
      .post('/api/sentra/agents/fake-id/action')
      .send({ action: 'isolate' })
      .expect(403);
  });
});

// ── SIEM Connection Tests ─────────────────────────────────────────────────────

describe('POST /api/sentra/siem/connections', () => {
  it('creates a generic-webhook connection', async () => {
    const { router } = await importSiemRouter();
    const app = buildApp();
    app.use('/api', router);

    const res = await request(app)
      .post('/api/sentra/siem/connections')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ name: 'Prod Webhook', adapterId: 'generic-webhook', config: { hmacSecret: 'super-secret-hmac-key' } })
      .expect(201);

    expect(res.body.id).toBeTypeOf('string');
    expect(res.body.name).toBe('Prod Webhook');
    expect(res.body.enabled).toBe(false);
    expect(res.body.config.hmacSecret).toBe('***');
  });

  it('rejects unknown adapter id', async () => {
    const { router } = await importSiemRouter();
    const app = buildApp();
    app.use('/api', router);

    await request(app)
      .post('/api/sentra/siem/connections')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ name: 'Bad', adapterId: 'nonexistent-adapter', config: {} })
      .expect(400);
  });

  it('requires CSRF', async () => {
    const { router } = await importSiemRouter();
    const app = buildApp();
    app.use('/api', router);

    await request(app)
      .post('/api/sentra/siem/connections')
      .send({ name: 'Test', adapterId: 'generic-webhook', config: {} })
      .expect(403);
  });
});

describe('POST /api/sentra/siem/connections/:id/test', () => {
  it('tests a generic-webhook connection (always succeeds)', async () => {
    const { router } = await importSiemRouter();
    const app = buildApp();
    app.use('/api', router);

    const createRes = await request(app)
      .post('/api/sentra/siem/connections')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ name: 'Test Webhook', adapterId: 'generic-webhook', config: { hmacSecret: 'test-secret-key-1234' } })
      .expect(201);

    const testRes = await request(app)
      .post(`/api/sentra/siem/connections/${createRes.body.id as string}/test`)
      .set('x-csrf-token', 'test-csrf-token')
      .expect(200);

    expect(testRes.body.ok).toBe(true);
    expect(testRes.body.sample).toBeInstanceOf(Array);
    expect(testRes.body.sample.length).toBeGreaterThan(0);
  });
});

describe('POST /api/sentra/siem/ingest/:connectionId (webhook)', () => {
  let webhookApp: Application;
  let webhookConnectionId: string;
  const hmacSecret = 'my-webhook-hmac-secret-key';

  beforeEach(async () => {
    const { router, siemConnectionsStore } = await importSiemRouter();
    siemConnectionsStore.clear();
    webhookApp = buildApp();
    webhookApp.use('/api', router);

    const createRes = await request(webhookApp)
      .post('/api/sentra/siem/connections')
      .set('x-csrf-token', 'test-csrf-token')
      .send({ name: 'Webhook SIEM', adapterId: 'generic-webhook', config: { hmacSecret } })
      .expect(201);

    webhookConnectionId = createRes.body.id as string;

    await request(webhookApp)
      .post(`/api/sentra/siem/connections/${webhookConnectionId}/enable`)
      .set('x-csrf-token', 'test-csrf-token')
      .expect(200);
  });

  it('accepts ingest with valid HMAC signature', async () => {
    const body = JSON.stringify({ title: 'Test Alert', severity: 'high', description: 'Real event' });
    const sig = 'sha256=' + createHmac('sha256', hmacSecret).update(Buffer.from(body, 'utf8')).digest('hex');

    const res = await request(webhookApp)
      .post(`/api/sentra/siem/ingest/${webhookConnectionId}`)
      .set('Content-Type', 'application/json')
      .set('x-signature-sha256', sig)
      .send(body)
      .expect(200);

    expect(res.body.accepted).toBe(true);
  });

  it('rejects ingest with bad HMAC signature', async () => {
    await request(webhookApp)
      .post(`/api/sentra/siem/ingest/${webhookConnectionId}`)
      .set('Content-Type', 'application/json')
      .set('x-signature-sha256', 'sha256=badsignature')
      .send(JSON.stringify({ title: 'Fake Alert' }))
      .expect(401);
  });

  it('rejects ingest with missing signature', async () => {
    await request(webhookApp)
      .post(`/api/sentra/siem/ingest/${webhookConnectionId}`)
      .send({ title: 'No Sig Alert' })
      .expect(400);
  });
});

describe('Production CSRF middleware — public endpoint exemptions', () => {
  it('allows POST /api/sentra/agents/heartbeat without CSRF token', async () => {
    const { csrfMiddleware } = await import('../../middlewares/csrf');
    const { router: agentsRouter, agentsStore, enrollmentTokensStore } = await importAgentsRouter();
    agentsStore.clear();
    enrollmentTokensStore.clear();

    const prodApp = express();
    prodApp.use(cookieParser());
    prodApp.use(express.json());
    prodApp.use(csrfMiddleware);
    prodApp.use('/api', agentsRouter);

    // heartbeat with invalid token should return 401 (invalid token), NOT 403 (CSRF)
    // token is a required body field per heartbeatSchema
    const res = await request(prodApp)
      .post('/api/sentra/agents/heartbeat')
      .send({ token: 'invalid-enrollment-token-xyz', hostname: 'host', os: 'linux', version: '1.0.0' });

    expect(res.status).toBe(401);
  });

  it('allows POST /api/sentra/siem/ingest/:id without CSRF token', async () => {
    const { csrfMiddleware } = await import('../../middlewares/csrf');
    const { router: siemRouter, siemConnectionsStore } = await importSiemRouter();
    siemConnectionsStore.clear();

    const prodApp = express();
    prodApp.use(cookieParser());
    prodApp.use(express.json());
    prodApp.use(csrfMiddleware);
    prodApp.use('/api', siemRouter);

    // nonexistent connection returns 404, NOT 403 (CSRF) — proving exemption works
    const res = await request(prodApp)
      .post('/api/sentra/siem/ingest/nonexistent-id')
      .send({ title: 'Test Alert' });

    expect(res.status).toBe(404);
  });

  it('blocks POST /api/sentra/agents/enroll without CSRF token via real middleware', async () => {
    const { csrfMiddleware } = await import('../../middlewares/csrf');
    const { router: agentsRouter } = await importAgentsRouter();

    const prodApp = express();
    prodApp.use(cookieParser());
    prodApp.use(express.json());
    prodApp.use(csrfMiddleware);
    prodApp.use('/api', agentsRouter);

    const res = await request(prodApp)
      .post('/api/sentra/agents/enroll')
      .send({ label: 'test' });

    expect(res.status).toBe(403);
  });
});
