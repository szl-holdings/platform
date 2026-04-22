/**
 * fund-inbound-deals — confirmation email tests
 *
 * Verifies that a successful deal submission triggers a confirmation email to
 * the founder's address, that the pipeline ID is included, and that an email
 * delivery failure does NOT fail the HTTP response.
 *
 * All external I/O (DB, object storage, email, platform flags) is mocked so
 * the tests run in isolation without any real network or database access.
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock: @szl-holdings/db
// ---------------------------------------------------------------------------

const mockRow = {
  pipelineId: 'DF-TEST1234',
  submittedAt: new Date('2026-04-22T12:00:00Z'),
  company: 'Acme Corp',
  founderEmail: 'founder@acme.io',
  founderName: 'Jane Doe',
  sector: 'SaaS',
  stage: 'Series A',
  convictionScore: 75,
  scoreTeam: 80,
  scoreMarket: 70,
  scoreProduct: 75,
  scoreTraction: 65,
  scoreCompetitive: 70,
  scoreFinancials: 60,
  status: 'screening',
  strengths: [],
  risks: [],
  attachments: [],
  source: 'inbound',
  notes: null,
  updatedAt: null,
};

vi.mock('@szl-holdings/db', () => {
  const mockDb = {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([mockRow]),
      }),
    }),
    select: () => ({
      from: () => ({
        orderBy: () => ({
          limit: () => Promise.resolve([mockRow]),
        }),
        where: () => ({
          limit: () => Promise.resolve([mockRow]),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([mockRow]),
        }),
      }),
    }),
  };

  return {
    db: mockDb,
    fundInboundDealsTable: {
      pipelineId: 'pipelineId',
      submittedAt: 'submittedAt',
    },
  };
});

// ---------------------------------------------------------------------------
// Mock: object storage — verifyAndCanonicalizeAttachments short-circuits for
// empty arrays, so we only need a minimal stub.
// ---------------------------------------------------------------------------

vi.mock('../../lib/objectStorage', () => ({
  ObjectStorageService: class MockObjectStorageService {
    uploadBuffer = vi.fn().mockResolvedValue('/objects/test/file.pdf');
    getObjectEntityFile = vi.fn().mockResolvedValue({});
    downloadObject = vi.fn().mockResolvedValue({ status: 200, headers: new Headers(), body: null });
  },
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
}));

// ---------------------------------------------------------------------------
// Mock: email — spy so we can assert calls and simulate failures
// ---------------------------------------------------------------------------

const sendEmailMock = vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123' });

vi.mock('../../lib/email', () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
  buildDealSubmissionAckEmail: vi.fn().mockReturnValue({
    subject: 'Deal submission received — Acme Corp (DF-TEST1234)',
    html: '<p>confirmation html</p>',
    text: 'confirmation text',
  }),
}));

// ---------------------------------------------------------------------------
// Mock: platform flags — email delivery enabled
// ---------------------------------------------------------------------------

vi.mock('../../lib/platform-flags', () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Mock: rate limiters — pass-through in tests
// ---------------------------------------------------------------------------

vi.mock('../../middlewares/rate-limiters', () => ({
  publicSubmitLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  publicUploadLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ---------------------------------------------------------------------------
// Mock: lib/validation — validateBody is a pass-through in tests so we can
// deliver any body shape without fighting schema validation.
// ---------------------------------------------------------------------------

vi.mock('../../lib/validation', () => ({
  validateBody: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  validateQuery: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ---------------------------------------------------------------------------
// Mock: logger
// ---------------------------------------------------------------------------

const warnMock = vi.fn();

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: warnMock, error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Mock: contracts/common bodyShape
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: () => ({ parse: (v: unknown) => v }),
}));

// ---------------------------------------------------------------------------
// Build minimal express app from the real router
// ---------------------------------------------------------------------------

const { default: dealRouter } = await import('../fund-inbound-deals.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(dealRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Minimal valid submission body
// ---------------------------------------------------------------------------

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    company: 'Acme Corp',
    sector: 'SaaS',
    stage: 'Series A',
    founderName: 'Jane Doe',
    founderEmail: 'founder@acme.io',
    summary: 'An exciting startup building the future of AI-driven workflow automation.',
    convictionScore: 75,
    scores: {
      team: 80,
      market: 70,
      product: 75,
      traction: 65,
      competitive: 70,
      financials: 60,
    },
    attachments: [],
    strengths: [],
    risks: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /public/fund-inbound-deals — confirmation email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmailMock.mockResolvedValue({ success: true, messageId: 'msg-123' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 with pipelineId and confirmationEmail on a valid submission', async () => {
    const app = buildApp();
    const res = await request(app).post('/public/fund-inbound-deals').send(validBody());

    expect(res.status).toBe(201);
    expect(res.body.pipelineId).toBe('DF-TEST1234');
    expect(res.body.confirmationEmail).toBe('founder@acme.io');
    expect(res.body.message).toContain('DF-TEST1234');
  });

  it('fires a confirmation email to the founder after a successful submission', async () => {
    const app = buildApp();
    await request(app).post('/public/fund-inbound-deals').send(validBody());

    // Wait for the setImmediate callback to run
    await new Promise((resolve) => setImmediate(resolve));

    expect(sendEmailMock).toHaveBeenCalledOnce();
    const [emailOpts] = sendEmailMock.mock.calls[0] as [{ to: string; subject: string }];
    expect(emailOpts.to).toBe('founder@acme.io');
    expect(emailOpts.subject).toContain('Acme Corp');
    expect(emailOpts.subject).toContain('DF-TEST1234');
  });

  it('does NOT fail the HTTP response when email delivery throws', async () => {
    sendEmailMock.mockRejectedValue(new Error('SMTP connection refused'));

    const app = buildApp();
    const res = await request(app).post('/public/fund-inbound-deals').send(validBody());

    // Submission still succeeds despite the email failure
    expect(res.status).toBe(201);
    expect(res.body.pipelineId).toBe('DF-TEST1234');

    // Wait for the setImmediate callback
    await new Promise((resolve) => setImmediate(resolve));

    // Email failure is logged as a warning, not rethrown
    expect(warnMock).toHaveBeenCalledOnce();
    const [ctx, msg] = warnMock.mock.calls[0] as [{ pipelineId: string; to: string }, string];
    expect(ctx.pipelineId).toBe('DF-TEST1234');
    expect(ctx.to).toBe('founder@acme.io');
    expect(msg).toContain('[fund-inbound-deals]');
  });

  it('logs a warning when sendEmail resolves with success: false (all-providers-failed path)', async () => {
    sendEmailMock.mockResolvedValue({ success: false, error: 'All providers failed' });

    const app = buildApp();
    const res = await request(app).post('/public/fund-inbound-deals').send(validBody());

    // Submission still succeeds
    expect(res.status).toBe(201);
    expect(res.body.pipelineId).toBe('DF-TEST1234');

    // Wait for the setImmediate callback
    await new Promise((resolve) => setImmediate(resolve));

    // The fulfilled-but-failed path is logged as a warning
    expect(warnMock).toHaveBeenCalledOnce();
    const [ctx, msg] = warnMock.mock.calls[0] as [
      { pipelineId: string; to: string; error: string },
      string,
    ];
    expect(ctx.pipelineId).toBe('DF-TEST1234');
    expect(ctx.to).toBe('founder@acme.io');
    expect(ctx.error).toBe('All providers failed');
    expect(msg).toContain('[fund-inbound-deals]');
  });

  it('does NOT send an email for honeypot-flagged submissions', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/public/fund-inbound-deals')
      .send(validBody({ _hp: 'bot-filled-value' }));

    // Returns fake success
    expect(res.status).toBe(201);

    await new Promise((resolve) => setImmediate(resolve));

    // No email should be sent for bot submissions
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
