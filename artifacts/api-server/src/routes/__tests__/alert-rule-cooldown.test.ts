/**
 * Alert rule email cooldown — unit tests
 *
 * Verifies that runAlertRuleEvaluation:
 *   1. Skips email dispatch when last_notified_at is within notify_cooldown_minutes
 *   2. Sends email when last_notified_at is outside notify_cooldown_minutes
 *   3. Sends email when last_notified_at is null (never notified)
 *   4. Updates last_notified_at (and last_email_sent_at) after dispatching email
 *   5. Falls back to cooldown_minutes / last_email_sent_at when the newer columns
 *      are absent (backward-compat for rows created before the migration)
 *
 * All DB, email, and observability calls are mocked so no real database is
 * required.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before the dynamic import of the route
// ---------------------------------------------------------------------------

const poolQueryMock = vi.fn();
const dbInsertMock = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));

vi.mock('@szl-holdings/db', () => ({
  pool: { query: poolQueryMock },
  db: { insert: dbInsertMock },
  alertEvaluationRunsTable: {},
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    getSnapshot: vi.fn(() => ({ errorRate: 10 })),
  },
}));

const sendEmailMock = vi.fn().mockResolvedValue({ success: true, provider: 'mock' });
const logAuditMock = vi.fn();
const hasEmailMock = vi.fn().mockReturnValue(true);

vi.mock('../../lib/email.js', () => ({
  sendEmail: sendEmailMock,
  buildAlertFiredEmail: vi.fn(() => ({ subject: 'Alert', html: '<p>Alert</p>', text: 'Alert' })),
  generateUnsubscribeToken: vi.fn(() => 'tok'),
  logNotificationAudit: logAuditMock,
  hasEmailProviderConfigured: hasEmailMock,
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/boot-orchestrator.js', () => ({
  requireOpsReady: (_req: unknown, _res: unknown, next: () => void) => next(),
  markOpsReady: vi.fn(),
}));

vi.mock('../../middlewares/auth.js', () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = Date.now();

function makeRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Test Rule',
    metric_name: 'api.error_rate',
    condition: 'gt',
    threshold: 5,
    window_minutes: 5,
    severity: 'critical',
    notify_email: true,
    email_recipients: ['ops@example.com'],
    cooldown_minutes: 60,
    last_email_sent_at: null,
    notify_cooldown_minutes: 60,
    last_notified_at: null,
    ...overrides,
  };
}

function isoAgo(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

const MINUTES = 60 * 1000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runAlertRuleEvaluation — per-rule email cooldown', () => {
  let runAlertRuleEvaluation: (trigger?: 'scheduled' | 'manual') => Promise<unknown>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [] });
      return Promise.resolve({ rows: [] });
    });

    const mod = await import('../ops-management.js');
    runAlertRuleEvaluation = mod.runAlertRuleEvaluation;
  });

  it('sends email when last_notified_at is null (never notified)', async () => {
    const rule = makeRule({ last_notified_at: null, last_email_sent_at: null });

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [rule] });
      return Promise.resolve({ rows: [{ p95: null }] });
    });

    await runAlertRuleEvaluation('manual');

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ops@example.com' }),
    );
  });

  it('skips email when last_notified_at is within notify_cooldown_minutes', async () => {
    const rule = makeRule({
      notify_cooldown_minutes: 60,
      last_notified_at: isoAgo(30 * MINUTES),
    });

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [rule] });
      return Promise.resolve({ rows: [{ p95: null }] });
    });

    await runAlertRuleEvaluation('manual');

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends email when last_notified_at is outside notify_cooldown_minutes', async () => {
    const rule = makeRule({
      notify_cooldown_minutes: 60,
      last_notified_at: isoAgo(90 * MINUTES),
    });

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [rule] });
      return Promise.resolve({ rows: [{ p95: null }] });
    });

    await runAlertRuleEvaluation('manual');

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ops@example.com' }),
    );
  });

  it('stamps last_notified_at only after successful email dispatch', async () => {
    const rule = makeRule({ last_notified_at: null });

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [rule] });
      return Promise.resolve({ rows: [{ p95: null }] });
    });

    sendEmailMock.mockResolvedValue({ success: true, provider: 'mock' });

    await runAlertRuleEvaluation('manual');

    const updateCalls = poolQueryMock.mock.calls.filter(
      ([sql]: [string]) => /SET last_notified_at/.test(sql),
    );
    expect(updateCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT stamp last_notified_at when all email sends fail', async () => {
    const rule = makeRule({ last_notified_at: null });

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [rule] });
      return Promise.resolve({ rows: [{ p95: null }] });
    });

    sendEmailMock.mockResolvedValue({ success: false, error: 'SMTP error', provider: 'mock' });

    await runAlertRuleEvaluation('manual');

    const updateCalls = poolQueryMock.mock.calls.filter(
      ([sql]: [string]) => /SET last_notified_at/.test(sql),
    );
    expect(updateCalls.length).toBe(0);
  });

  it('falls back to last_email_sent_at when last_notified_at is null (backward-compat)', async () => {
    const rule = makeRule({
      notify_cooldown_minutes: 60,
      last_notified_at: null,
      last_email_sent_at: isoAgo(30 * MINUTES),
    });

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [rule] });
      return Promise.resolve({ rows: [{ p95: null }] });
    });

    await runAlertRuleEvaluation('manual');

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('falls back to cooldown_minutes when notify_cooldown_minutes is absent', async () => {
    const rule = makeRule({
      notify_cooldown_minutes: undefined,
      cooldown_minutes: 120,
      last_notified_at: isoAgo(90 * MINUTES),
    });

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [rule] });
      return Promise.resolve({ rows: [{ p95: null }] });
    });

    await runAlertRuleEvaluation('manual');

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('does not send email when rule metric is unknown', async () => {
    const rule = makeRule({ metric_name: 'unknown.metric', last_notified_at: null });

    poolQueryMock.mockImplementation((sql: string) => {
      if (/SELECT \* FROM platform_alert_rules/.test(sql)) return Promise.resolve({ rows: [rule] });
      return Promise.resolve({ rows: [{ p95: null }] });
    });

    await runAlertRuleEvaluation('manual');

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
