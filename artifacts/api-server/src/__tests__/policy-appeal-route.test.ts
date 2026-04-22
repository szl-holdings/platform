/**
 * Integration tests for POST /api/audit-log/policy-appeal (Task #1021).
 *
 * Locks in the audit-integrity contract for the endpoint operators hit when
 * they appeal a policy denial from /trust-provenance:
 *
 *   401 — globalAuthEnforcer blocks unauthenticated requests before the
 *         route handler runs.
 *   403 — csrfMiddleware blocks cookie-authed POSTs without a matching
 *         X-CSRF-Token header (bearer-token requests are exempt by design).
 *   400 — handler rejects missing requestId, missing action, invalid action
 *         enum, and short justification (<8 chars) for action="appeal".
 *   201 — happy path: returns the recorded envelope AND emits the
 *         structured "policy.appeal.recorded" log entry containing the
 *         authenticated actor id, role, orgId, requestId, action, and
 *         justificationLength.
 */

import cookieParser from 'cookie-parser';
import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/observability', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createObservabilityMock();
});

vi.mock('@szl-holdings/db', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createDbMock();
});

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../middlewares/auth.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createAuthMiddlewareMock({
    id: 4242,
    email: 'operator@szl-holdings.test',
    roles: ['operator'],
    orgs: [{ orgId: 7, orgSlug: 'acme', orgName: 'Acme Inc', role: 'operator' }],
  });
});

const { globalAuthEnforcer } = await import('../middlewares/global-auth-enforcer.js');
const { csrfMiddleware } = await import('../middlewares/csrf.js');
const { default: approvalsRouter } = await import('../routes/approvals.js');
const { logger } = await import('../lib/logger.js');

interface AppealResponseBody {
  requestId: string;
  action: string;
  recordedAt: string;
  actorId: number | null;
}

interface ErrorBody {
  error: string;
  code?: string;
}

function buildAuthEnforcedApp() {
  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer as express.RequestHandler);
  app.use('/api', approvalsRouter as unknown as ExpressRouter);
  return app;
}

function buildCsrfEnforcedApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(csrfMiddleware as unknown as express.RequestHandler);
  app.use('/api', approvalsRouter as unknown as ExpressRouter);
  return app;
}

function buildHandlerApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', approvalsRouter as unknown as ExpressRouter);
  return app;
}

beforeEach(() => {
  (logger.info as unknown as ReturnType<typeof vi.fn>).mockClear();
});

describe('POST /api/audit-log/policy-appeal — 401 unauthenticated', () => {
  const app = buildAuthEnforcedApp();

  it('returns 401 UNAUTHORIZED when no credentials are presented', async () => {
    const res = await request(app).post('/api/audit-log/policy-appeal').send({
      requestId: 'req-123',
      action: 'appeal',
      justification: 'Policy was misapplied to this decision.',
    });

    expect(res.status).toBe(401);
    const body = res.body as ErrorBody;
    expect(body.code).toBe('UNAUTHORIZED');
    const recordedCalls = (logger.info as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => c[1] === 'policy.appeal.recorded',
    );
    expect(recordedCalls).toHaveLength(0);
  });
});

describe('POST /api/audit-log/policy-appeal — 403 CSRF enforcement', () => {
  const app = buildCsrfEnforcedApp();

  it('rejects cookie-authed POST with no CSRF token (CSRF_TOKEN_MISSING)', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .set('Cookie', ['session=fake-session-cookie'])
      .send({
        requestId: 'req-123',
        action: 'appeal',
        justification: 'Policy was misapplied to this decision.',
      });

    expect(res.status).toBe(403);
    const body = res.body as ErrorBody;
    expect(body.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('rejects cookie-authed POST with mismatched CSRF tokens (CSRF_TOKEN_MISMATCH)', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .set('Cookie', ['session=fake; csrf_token=cookie-value'])
      .set('X-CSRF-Token', 'header-value-different')
      .send({
        requestId: 'req-123',
        action: 'appeal',
        justification: 'Policy was misapplied to this decision.',
      });

    expect(res.status).toBe(403);
    const body = res.body as ErrorBody;
    expect(body.code).toBe('CSRF_TOKEN_MISMATCH');
  });

  it('allows bearer-authed POST through CSRF (no cookie path required)', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .set('Authorization', 'Bearer fake-token')
      .send({
        requestId: 'req-bearer',
        action: 'escalate',
      });

    // CSRF is bypassed for bearer auth; the (mocked) auth middleware then
    // injects a user and the handler should record the appeal.
    expect(res.status).toBe(201);
  });
});

describe('POST /api/audit-log/policy-appeal — 400 validation', () => {
  const app = buildHandlerApp();

  it('rejects missing requestId (handler validation)', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .send({ action: 'appeal', justification: 'long enough justification' });

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error).toMatch(/requestId/i);
  });

  it('rejects missing action', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .send({ requestId: 'req-1' });

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error).toMatch(/action/i);
  });

  it('rejects invalid action enum value', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .send({ requestId: 'req-1', action: 'delete' });

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error).toMatch(/escalate|appeal/i);
  });

  it('rejects appeal with justification shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .send({ requestId: 'req-1', action: 'appeal', justification: 'short' });

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error).toMatch(/justification/i);
  });

  it('rejects appeal with whitespace-only justification', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .send({ requestId: 'req-1', action: 'appeal', justification: '          ' });

    // Trim then length-check — produces same 400 as missing justification.
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error).toMatch(/justification/i);
  });

  it('rejects non-object body via validateBody middleware', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify('not-an-object'));

    expect(res.status).toBe(400);
  });
});

describe('POST /api/audit-log/policy-appeal — 201 happy path + structured audit log', () => {
  const app = buildHandlerApp();

  it('records an appeal and emits policy.appeal.recorded with actor + org context', async () => {
    const justification = 'The control should not have applied here because…';
    const res = await request(app).post('/api/audit-log/policy-appeal').send({
      requestId: 'req-2024-0329',
      action: 'appeal',
      justification,
    });

    expect(res.status).toBe(201);
    const body = res.body as AppealResponseBody;
    expect(body.requestId).toBe('req-2024-0329');
    expect(body.action).toBe('appeal');
    expect(body.actorId).toBe(4242);
    expect(typeof body.recordedAt).toBe('string');
    expect(Number.isNaN(Date.parse(body.recordedAt))).toBe(false);

    // The structured audit log line — the heart of the audit-integrity
    // guarantee this endpoint exists to provide.
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-2024-0329',
        action: 'appeal',
        justificationLength: justification.length,
        actorId: 4242,
        actorRole: 'operator',
        orgId: 7,
      }),
      'policy.appeal.recorded',
    );
  });

  it('records an escalate (no justification required)', async () => {
    const res = await request(app)
      .post('/api/audit-log/policy-appeal')
      .send({ requestId: 'req-escalate-1', action: 'escalate' });

    expect(res.status).toBe(201);
    expect((res.body as AppealResponseBody).action).toBe('escalate');

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-escalate-1',
        action: 'escalate',
        justificationLength: 0,
        actorId: 4242,
        actorRole: 'operator',
        orgId: 7,
      }),
      'policy.appeal.recorded',
    );
  });
});
