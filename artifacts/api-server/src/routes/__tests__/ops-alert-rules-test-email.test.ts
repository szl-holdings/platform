/**
 * POST /ops/alert-rules/test-email — integration tests
 *
 * Verifies the free-form test-email endpoint added to ops-management.ts:
 *   1. Returns { ok: true, provider } on successful delivery
 *   2. Returns 400 when recipient is not a valid email
 *   3. Returns 400 when recipient is missing
 *   4. Returns 503 when no email provider is configured
 *   5. Returns 502 when sendEmail reports a delivery failure
 *   6. Returns 401 for unauthenticated callers
 *
 * Auth, boot-orchestrator, DB pool, and email utilities are all mocked so
 * no live infrastructure is required.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── @szl-holdings/db ─────────────────────────────────────────────────────────

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  },
  pool: { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
  alertEvaluationRunsTable: {},
}));

// ─── drizzle-orm ──────────────────────────────────────────────────────────────

vi.mock('drizzle-orm', () => {
  const noop = (..._a: unknown[]) => ({});
  return { desc: noop, eq: noop, and: noop, asc: noop, inArray: noop };
});

// ─── Email utilities ──────────────────────────────────────────────────────────

const mockSendEmail = vi.fn();
const mockHasEmailProviderConfigured = vi.fn(() => true);
const mockBuildAlertFiredEmail = vi.fn(() => ({
  subject: '[WARNING] Alert fired: [TEST] Sample Alert Rule',
  html: '<p>test</p>',
  text: 'test',
}));
const mockGenerateUnsubscribeToken = vi.fn(() => 'mock-token');
const mockLogNotificationAudit = vi.fn(() => Promise.resolve());

vi.mock('../../lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  hasEmailProviderConfigured: () => mockHasEmailProviderConfigured(),
  buildAlertFiredEmail: (...args: unknown[]) => mockBuildAlertFiredEmail(...args),
  generateUnsubscribeToken: (...args: unknown[]) => mockGenerateUnsubscribeToken(...args),
  logNotificationAudit: (...args: unknown[]) => mockLogNotificationAudit(...args),
}));

// ─── Boot orchestrator ────────────────────────────────────────────────────────

vi.mock('../../lib/boot-orchestrator', () => ({
  requireOpsReady: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// ─── Logger ───────────────────────────────────────────────────────────────────

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

// ─── Platform flags ───────────────────────────────────────────────────────────

vi.mock('../../lib/platform-flags', () => ({
  isFlagEnabled: vi.fn(() => Promise.resolve(true)),
}));

// ─── Auth ─────────────────────────────────────────────────────────────────────

interface MockUser {
  id: number;
  roles: string[];
  orgs: { orgId: number; orgSlug: string; orgName: string; role: string }[];
}

let authUser: MockUser | null = null;

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    () =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (!authUser) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      (req as Request & { user: MockUser }).user = authUser;
      next();
    },
  requireRole:
    () =>
    (_req: Request, _res: Response, next: NextFunction): void => {
      next();
    },
}));

// ─── observability / config / audit (pulled in transitively) ─────────────────

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordRequest: vi.fn(), recordAuthFailure: vi.fn(), recordError: vi.fn() },
}));
vi.mock('@szl-holdings/platform-registry', () => ({
  isProductionMode: vi.fn(() => false),
  isDemoMode: vi.fn(() => false),
  resolveRuntimeMode: vi.fn(() => 'local-dev'),
  isSeedDataAllowed: vi.fn(() => true),
}));
vi.mock('@szl-holdings/audit', () => ({ hashIp: (ip: string) => `hashed-${ip}` }));

// ─── App factory ──────────────────────────────────────────────────────────────

async function buildApp() {
  const { default: router } = await import('../ops-management');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeAdminUser(): MockUser {
  return {
    id: 1,
    roles: ['admin'],
    orgs: [{ orgId: 1, orgSlug: 'test-org', orgName: 'Test Org', role: 'admin' }],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /ops/alert-rules/test-email', () => {
  beforeEach(() => {
    authUser = makeAdminUser();
    mockSendEmail.mockReset();
    mockHasEmailProviderConfigured.mockReset();
    mockHasEmailProviderConfigured.mockReturnValue(true);
    mockBuildAlertFiredEmail.mockReset();
    mockBuildAlertFiredEmail.mockReturnValue({
      subject: '[WARNING] Alert fired: [TEST] Sample Alert Rule',
      html: '<p>test</p>',
      text: 'test',
    });
    mockGenerateUnsubscribeToken.mockReset();
    mockGenerateUnsubscribeToken.mockReturnValue('mock-token');
    mockLogNotificationAudit.mockReset();
    mockLogNotificationAudit.mockResolvedValue(undefined);
  });

  it('returns { ok: true, provider } when email is sent successfully', async () => {
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-001', provider: 'sendgrid' });
    const app = await buildApp();

    const res = await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'ops-test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, provider: 'sendgrid' });
  });

  it('passes the recipient and mock email content to sendEmail', async () => {
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-002', provider: 'resend' });
    const app = await buildApp();

    await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'someone@example.com', ruleName: 'High Latency' });

    expect(mockSendEmail).toHaveBeenCalledOnce();
    const callArgs = mockSendEmail.mock.calls[0]![0] as Record<string, unknown>;
    expect(callArgs.to).toBe('someone@example.com');
    expect(typeof callArgs.subject).toBe('string');
    expect(typeof callArgs.html).toBe('string');
    expect(callArgs.headers).toBeDefined();
    const headers = callArgs.headers as Record<string, string>;
    expect(headers['List-Unsubscribe']).toContain('/api/notifications/unsubscribe');
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
  });

  it('includes a notification unsubscribe URL in the alert email', async () => {
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-unsub', provider: 'sendgrid' });
    mockBuildAlertFiredEmail.mockImplementation((opts: Record<string, unknown>) => {
      expect(opts.notificationUnsubscribeUrl).toBeDefined();
      expect(String(opts.notificationUnsubscribeUrl)).toContain('/api/notifications/unsubscribe');
      return { subject: 'test', html: '<p>test</p>', text: 'test' };
    });
    const app = await buildApp();

    await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'unsub-test@example.com' });

    expect(mockBuildAlertFiredEmail).toHaveBeenCalledOnce();
  });

  it('prefixes the ruleName with [TEST] when building the email', async () => {
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-003', provider: 'sendgrid' });
    const app = await buildApp();

    await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'ops@example.com', ruleName: 'My Custom Rule' });

    expect(mockBuildAlertFiredEmail).toHaveBeenCalledOnce();
    const emailOpts = mockBuildAlertFiredEmail.mock.calls[0]![0] as Record<string, unknown>;
    expect(emailOpts.ruleName).toBe('[TEST] My Custom Rule');
  });

  it('uses "Sample Alert Rule" as default when ruleName is omitted', async () => {
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-004', provider: 'smtp' });
    const app = await buildApp();

    await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'ops@example.com' });

    const emailOpts = mockBuildAlertFiredEmail.mock.calls[0]![0] as Record<string, unknown>;
    expect(emailOpts.ruleName).toBe('[TEST] Sample Alert Rule');
  });

  it('writes a notification audit log entry on success', async () => {
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-005', provider: 'sendgrid' });
    const app = await buildApp();

    await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'audit@example.com' });

    expect(mockLogNotificationAudit).toHaveBeenCalledOnce();
    const auditArgs = mockLogNotificationAudit.mock.calls[0]![0] as Record<string, unknown>;
    expect(auditArgs.template).toBe('alert_rule_test_email');
    expect(auditArgs.recipient).toBe('audit@example.com');
    expect(auditArgs.deliveryStatus).toBe('sent');
  });

  it('returns 503 when no email provider is configured', async () => {
    mockHasEmailProviderConfigured.mockReturnValue(false);
    const app = await buildApp();

    const res = await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'ops@example.com' });

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ error: expect.stringContaining('provider') });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('returns 502 when sendEmail reports a delivery failure', async () => {
    mockSendEmail.mockResolvedValue({ success: false, error: 'SMTP connection refused' });
    const app = await buildApp();

    const res = await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'ops@example.com' });

    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ error: 'SMTP connection refused' });
  });

  it('returns 400 when recipient is not a valid email address', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when recipient is missing from the request body', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/ops/alert-rules/test-email')
      .send({});

    expect(res.status).toBe(400);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('returns 401 for unauthenticated callers', async () => {
    authUser = null;
    const app = await buildApp();

    const res = await request(app)
      .post('/ops/alert-rules/test-email')
      .send({ recipient: 'ops@example.com' });

    expect(res.status).toBe(401);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
