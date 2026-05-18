/**
 * Sentra Core HTTP Routes — Integration Tests
 *
 * Boots an Express app whose middleware chain matches the production
 * api-server in the parts that gate /api/sentra/core/*:
 *   cookieParser → csrfMiddleware → authMiddleware({ required: false })
 *                → globalAuthEnforcer → router
 *
 * No mock of `callSentraCore`, no mock of `spawn`. Every assertion drives
 * the real Python sentra-core sidecar through the subprocess bridge, so
 * regressions in routing, CSRF, the auth enforcer, the bridge, the
 * stdin/stdout contract, or the shape of sidecar responses all surface
 * here.
 *
 * Auth strategy:
 *   - Positive paths authenticate via the `x-internal-token` header. The
 *     internal-token bypass is the same one used by service-to-service
 *     callers in production. We register a scoped INTERNAL_SERVICE_TOKENS
 *     entry with `pathPrefixes: ["/api/sentra/"]` so the token can reach
 *     /api/sentra/core/* but nothing else.
 *   - The CSRF endpoint /api/csrf-token is wired up so the negative-CSRF
 *     path can fetch a real token and the real csrfMiddleware path is
 *     exercised end-to-end (rather than relying solely on the internal-
 *     token CSRF bypass).
 *   - Two negative gating tests prove the request actually traverses
 *     CSRF + auth in production order: one rejects with 403 when no CSRF
 *     and no internal token are presented, and one rejects with 401 when
 *     CSRF is satisfied but no auth is presented.
 *
 * Coverage:
 *   - GET  /api/sentra/core/health (public GET — exercised via the read-only
 *     Sentra GET allowlist in globalAuthEnforcer)
 *   - POST /api/sentra/core/threat-model
 *   - POST /api/sentra/core/posture-drift
 *   - POST /api/sentra/core/incident-response (with stub policy runtime)
 *   - POST /api/sentra/core/evidence-pack    (with stub policy runtime)
 *   - POST /api/sentra/core/policy-gate      (with stub policy runtime)
 *   - Zod validation 400 on malformed body
 *   - SSRF allowlist 400 on out-of-band runtime_url
 *   - CSRF 403 when no token + no internal-token bypass is presented
 *   - Auth 401 when CSRF is satisfied but no auth principal exists
 */

import { randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';

import cookieParser from 'cookie-parser';
import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Avoid the per-agent DID DB round-trip authMiddleware does for internal
// tokens — the unit-of-work here is the HTTP boundary, not identity
// persistence, and we don't want a missing DB to spuriously fail tests.
// authMiddleware calls `ensureInternalAgentDid` from platform-did-registry.
vi.mock('../../../lib/platform-did-registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/platform-did-registry')>();
  return {
    ...actual,
    ensureInternalAgentDid: vi.fn(async (name: string) => ({
      did: `did:test:${name}`,
      revoked: false,
    })),
  };
});

// ── Test fixture configuration ──────────────────────────────────────────────

const INTERNAL_TOKEN = `sentra-integration-${randomBytes(16).toString('hex')}`;

function configureInternalToken() {
  // Scoped registry entry whose pathPrefixes include the Sentra surface so
  // the token can reach /api/sentra/core/* but no other route. Scopes
  // chosen to satisfy callers (sentra is not gated by an internal scope
  // currently, but we provide read/write for completeness).
  process.env.INTERNAL_SERVICE_TOKENS = JSON.stringify([
    {
      name: 'sentra-integration-tests',
      token: INTERNAL_TOKEN,
      scopes: ['internal:read', 'internal:write', 'agent:read', 'agent:write'],
      pathPrefixes: ['/api/sentra/'],
    },
  ]);
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function buildApp(): Promise<Application> {
  configureInternalToken();
  const { resetInternalTokenRegistry } = await import('../../../lib/internal-tokens');
  resetInternalTokenRegistry();

  // Import middleware AFTER env is configured so any module-load-time
  // env reads see the right values.
  const { csrfMiddleware } = await import('../../../middlewares/csrf');
  const { authMiddleware } = await import('../../../middlewares/auth');
  const { globalAuthEnforcer } = await import('../../../middlewares/global-auth-enforcer');
  const router = (await import('../routes')).default;

  const app = express();
  app.use(cookieParser());
  app.use(express.json({ limit: '512kb' }));

  // Real /api/csrf-token endpoint, copied byte-for-byte from app.ts so
  // tests fetch a token the same way browser clients do.
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    let token = req.cookies?.csrf_token as string | undefined;
    if (!token) {
      token = randomBytes(32).toString('hex');
      res.cookie('csrf_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
    res.json({ csrfToken: token });
  });

  app.use(csrfMiddleware);
  app.use(authMiddleware({ required: false }));
  app.use(globalAuthEnforcer);

  app.use('/api', router);

  // Default error handler so route-thrown errors yield 5xx responses with
  // a readable body for the test to surface.
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message, stack: err.stack });
  });

  return app;
}

/**
 * Tiny in-process HTTP server that mimics the a11oy-runtime /evaluate
 * endpoint, so policy-gate / evidence-pack / incident-response paths can
 * exercise the real PolicyGate code path end-to-end without a real
 * a11oy-runtime deployment.
 */
type PolicyResponder = (body: unknown) => { status?: number; body: unknown };

function startPolicyStub(
  responder: PolicyResponder,
): Promise<{ url: string; close: () => Promise<void>; calls: unknown[] }> {
  return new Promise((resolve) => {
    const calls: unknown[] = [];
    const server: Server = createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk.toString('utf-8');
      });
      req.on('end', () => {
        let parsed: unknown = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = raw;
        }
        calls.push({ method: req.method, path: req.url, body: parsed });
        const out = responder(parsed);
        res.statusCode = out.status ?? 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(out.body));
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        calls,
        close: () =>
          new Promise<void>((done, fail) => {
            server.close((err) => (err ? fail(err) : done()));
          }),
      });
    });
  });
}

function authed(req: request.Test): request.Test {
  // Internal token bypasses both CSRF and globalAuthEnforcer in
  // production, exactly as service-to-service callers do.
  return req.set('x-internal-token', INTERNAL_TOKEN);
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const threatModelBody = {
  assets: [
    { id: 'web-1', name: 'Web frontend', kind: 'endpoint', exposure: 'high' },
    { id: 'db-1', name: 'Primary DB', kind: 'data', exposure: 'critical' },
  ],
  sources: [
    {
      id: 'apt-x',
      name: 'APT-X',
      motivation: 'espionage',
      techniques: ['T1059', 'T1078'],
      targets: ['endpoint', 'data'],
    },
  ],
};

const postureBody = {
  baseline: {
    snapshot_id: 'baseline-1',
    captured_at: '2025-01-01T00:00:00Z',
    controls: [
      { id: 'edr', name: 'EDR', severity: 'high', state: 'enabled' },
      { id: 'mfa', name: 'MFA', severity: 'critical', state: 'enabled' },
    ],
  },
  current: {
    snapshot_id: 'current-1',
    captured_at: '2025-01-02T00:00:00Z',
    controls: [
      { id: 'edr', name: 'EDR', severity: 'high', state: 'disabled' },
      { id: 'mfa', name: 'MFA', severity: 'critical', state: 'enabled' },
    ],
  },
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Sentra Core HTTP routes (real auth + CSRF + Python sidecar)', () => {
  let app: Application;

  // Snapshot every env var this suite mutates so we leave the process
  // environment exactly as we found it, isolating this suite from any
  // other tests vitest schedules in the same worker.
  const ENV_KEYS_MUTATED = [
    'INTERNAL_SERVICE_TOKENS',
    'NODE_ENV',
    'SENTRA_YAWAR_URL',
    'A11OY_RUNTIME_URL',
  ] as const;
  const envSnapshot: Record<string, string | undefined> = {};

  beforeAll(async () => {
    for (const k of ENV_KEYS_MUTATED) envSnapshot[k] = process.env[k];
    // NODE_ENV=test ensures the SSRF allowlist in routes.ts auto-permits
    // 127.0.0.1 / localhost, so the policy-stub URL passes Zod validation.
    process.env.NODE_ENV = 'test';
    delete process.env.SENTRA_YAWAR_URL;
    delete process.env.A11OY_RUNTIME_URL;
    app = await buildApp();
  });

  afterAll(async () => {
    for (const k of ENV_KEYS_MUTATED) {
      const orig = envSnapshot[k];
      if (orig === undefined) delete process.env[k];
      else process.env[k] = orig;
    }
    const { resetInternalTokenRegistry } = await import('../../../lib/internal-tokens');
    resetInternalTokenRegistry();
  });

  describe('Auth + CSRF gating (production order)', () => {
    it('rejects POST with no CSRF token and no auth → 403 from csrfMiddleware', async () => {
      const res = await request(app)
        .post('/api/sentra/core/threat-model')
        .send(threatModelBody);
      expect(res.status).toBe(403);
      expect(res.body.code ?? res.body.error?.code ?? '').toMatch(/CSRF/i);
    });

    it('rejects POST that satisfies CSRF but has no auth → 401 from globalAuthEnforcer', async () => {
      // Fetch a real CSRF token + cookie, then call without an internal
      // token. csrfMiddleware passes; globalAuthEnforcer must reject.
      const agent = request.agent(app);
      const tokenRes = await agent.get('/api/csrf-token').expect(200);
      const csrfToken: string = tokenRes.body.csrfToken;
      expect(csrfToken).toMatch(/^[a-f0-9]{64}$/);

      const res = await agent
        .post('/api/sentra/core/threat-model')
        .set('x-csrf-token', csrfToken)
        .send(threatModelBody);
      expect(res.status).toBe(401);
    });

    it('accepts authenticated POST via x-internal-token → 200', async () => {
      const res = await authed(
        request(app).post('/api/sentra/core/threat-model').send(threatModelBody),
      );
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/sentra/core/health', () => {
    it('probes the sidecar and reports liveness (public read)', async () => {
      // Sentra GET routes are explicitly public in globalAuthEnforcer, so
      // no auth header is needed.
      const res = await request(app).get('/api/sentra/core/health').expect(200);
      expect(res.body).toMatchObject({
        sidecar: expect.objectContaining({ ok: expect.any(Boolean) }),
        dataState: expect.stringMatching(/^(live|stub)$/),
      });
    });
  });

  describe('POST /api/sentra/core/threat-model', () => {
    it('builds a threat graph with findings via the Python sidecar', async () => {
      const res = await authed(
        request(app).post('/api/sentra/core/threat-model').send(threatModelBody),
      ).expect(200);

      const result = res.body;
      expect(result).toMatchObject({
        assets: expect.any(Array),
        sources: expect.any(Array),
        edges: expect.any(Array),
        findings: expect.any(Array),
        top_risks: expect.any(Array),
        coverage: expect.any(Object),
      });
      expect(result.findings.length).toBeGreaterThan(0);
      const finding = result.findings[0];
      expect(finding).toMatchObject({
        technique: expect.any(String),
        asset: expect.any(String),
        source: expect.any(String),
        severity: expect.stringMatching(/^(critical|high|medium|low)$/),
        score: expect.any(Number),
      });
    });

    it('rejects malformed bodies before invoking the sidecar', async () => {
      const res = await authed(
        request(app)
          .post('/api/sentra/core/threat-model')
          .send({ assets: [], sources: [] }),
      ).expect(400);
      expect(res.body.error).toMatch(/Validation error/i);
    });
  });

  describe('POST /api/sentra/core/posture-drift', () => {
    it('computes drift and surfaces a lambda score', async () => {
      const res = await authed(
        request(app).post('/api/sentra/core/posture-drift').send(postureBody),
      ).expect(200);

      const result = res.body;
      expect(result).toMatchObject({
        baseline_id: 'baseline-1',
        current_id: 'current-1',
        added: expect.any(Array),
        removed: expect.any(Array),
        changed: expect.any(Array),
        lambda_score: expect.any(Number),
        severity_band: expect.stringMatching(/^(critical|high|medium|low|none)$/),
      });
      const changed = result.changed.find((c: { control_id: string }) => c.control_id === 'edr');
      expect(changed).toBeDefined();
      expect(changed.change).toBe('changed');
    });
  });

  describe('POST /api/sentra/core/incident-response', () => {
    it('runs a runbook through the policy gate and returns event stream', async () => {
      const policy = await startPolicyStub(() => ({
        body: { decision: 'allow', reason: 'integration-test', policy_id: 'sentra.test.allow' },
      }));
      try {
        const res = await authed(
          request(app)
            .post('/api/sentra/core/incident-response')
            .send({
              incident: {
                id: 'inc-1',
                title: 'Suspicious lateral movement',
                severity: 'high',
                mitre_techniques: ['T1078'],
                affected_assets: ['web-1'],
              },
              runbook_name: 'ransomware',
              approvals: { operator_confirm_eradication: true },
              policy_runtime_url: policy.url,
            }),
        );
        if (res.status !== 200) {
          throw new Error(
            `incident-response failed: ${res.status} ${JSON.stringify(res.body)}`,
          );
        }
        const result = res.body;
        expect(result).toMatchObject({
          runbook: expect.any(String),
          incident_id: 'inc-1',
          status: expect.any(String),
          events: expect.any(Array),
        });
        expect(result.events.length).toBeGreaterThan(0);
        for (const ev of result.events) {
          expect(ev).toMatchObject({
            incident_id: 'inc-1',
            step_name: expect.any(String),
            kind: expect.any(String),
            status: expect.any(String),
          });
        }
        expect(policy.calls.length).toBeGreaterThan(0);
      } finally {
        await policy.close();
      }
    });
  });

  describe('POST /api/sentra/core/evidence-pack', () => {
    it('builds a signed evidence pack and returns a hash chain receipt', async () => {
      const policy = await startPolicyStub(() => ({
        body: { decision: 'allow', reason: 'integration-test', policy_id: 'sentra.test.allow' },
      }));
      try {
        const res = await authed(
          request(app)
            .post('/api/sentra/core/evidence-pack')
            .send({
              incident_id: 'inc-1',
              items: [
                {
                  id: 'item-1',
                  kind: 'log',
                  description: 'process tree snapshot',
                  payload: 'pid=4242 cmd=cmd.exe',
                },
                {
                  id: 'item-2',
                  kind: 'log',
                  description: 'edr alert',
                  payload: 'isolated=true',
                },
              ],
              publish: false,
              policy_runtime_url: policy.url,
            }),
        );
        if (res.status !== 200) {
          throw new Error(`evidence-pack failed: ${res.status} ${JSON.stringify(res.body)}`);
        }
        const result = res.body;
        expect(result).toMatchObject({
          pack_id: expect.any(String),
          incident_id: 'inc-1',
          pack_hash: expect.any(String),
          signature: expect.any(String),
          signer_id: expect.any(String),
          chain: expect.any(Array),
          items: expect.any(Array),
        });
        expect(result.chain).toHaveLength(2);
        expect(result.chain[0].prev_hash).toMatch(/^0+$/);
        expect(result.chain[1].prev_hash).toBe(result.chain[0].chain_hash);
        expect(result.pack_hash).toBe(result.chain[1].chain_hash);
      } finally {
        await policy.close();
      }
    });
  });

  describe('POST /api/sentra/core/policy-gate', () => {
    it('returns an allow decision from the stub runtime', async () => {
      const policy = await startPolicyStub(() => ({
        body: {
          decision: 'allow',
          reason: 'integration-allow',
          policy_id: 'sentra.test.policy',
          evaluated_at: '2025-01-01T00:00:00Z',
        },
      }));
      try {
        const res = await authed(
          request(app).post('/api/sentra/core/policy-gate').send({
            runtime_url: policy.url,
            action: 'sentra.incident.isolate',
            subject: { incident_id: 'inc-1', asset_id: 'web-1' },
          }),
        ).expect(200);

        expect(res.body).toMatchObject({
          allow: true,
          reason: 'integration-allow',
          policy_id: 'sentra.test.policy',
        });
        expect(policy.calls).toHaveLength(1);
      } finally {
        await policy.close();
      }
    });

    it('returns a deny decision when the runtime refuses', async () => {
      const policy = await startPolicyStub(() => ({
        body: { decision: 'deny', reason: 'integration-deny', policy_id: 'sentra.test.policy' },
      }));
      try {
        const res = await authed(
          request(app).post('/api/sentra/core/policy-gate').send({
            runtime_url: policy.url,
            action: 'sentra.incident.isolate',
            subject: { incident_id: 'inc-2' },
          }),
        ).expect(200);

        expect(res.body).toMatchObject({ allow: false, reason: 'integration-deny' });
      } finally {
        await policy.close();
      }
    });

    it('rejects runtime_url hosts not in the SSRF allowlist', async () => {
      const res = await authed(
        request(app).post('/api/sentra/core/policy-gate').send({
          runtime_url: 'http://example.com/policy',
          action: 'sentra.incident.isolate',
          subject: {},
        }),
      ).expect(400);
      expect(res.body.error).toMatch(/Validation error/i);
    });
  });
});
