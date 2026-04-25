/**
 * Support reply history — integration tests
 *
 * Coverage:
 *  - GET  /admin/support-queue/:id/replies  — returns replies in chronological order
 *  - POST /admin/support-queue/:id/reply    — persists record before sending email,
 *                                             updates delivery status after send,
 *                                             records failure when sendEmail throws
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mutable queues — reset in beforeEach
// ---------------------------------------------------------------------------

// Each `db.select()` call pops the next result from this queue.
// Push results in call order to match the production code.
let _selectQueue: unknown[][] = [];
let _insertReturnRow: unknown = { id: 42, contactSubmissionId: 1, subject: 'Hi', body: 'Test body', sentBy: 'Admin', emailSuccess: false, messageId: null, sentAt: new Date().toISOString() };
let _updateReturnRow: unknown = null;
let _sendEmailResult: { success: boolean; messageId?: string; provider?: string; error?: string } = { success: true, messageId: 'msg-1', provider: 'test' };
let _sendEmailShouldThrow = false;
let _poolQueryRows: unknown[] = [];

// ---------------------------------------------------------------------------
// Module mocks (declared before any dynamic import)
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  const poolMock = {
    query: vi.fn(() => Promise.resolve({ rows: _poolQueryRows })),
  };

  // Each db.select() call resolves from the front of _selectQueue.
  const makeSelectChain = (): unknown => {
    const rows = _selectQueue.shift() ?? [];
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.from = self;
    chain.leftJoin = self;
    chain.where = () => {
      // check if caller chains further (orderBy) or awaits directly
      const subchain: Record<string, unknown> = {};
      subchain.orderBy = () => Promise.resolve(rows);
      subchain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
        Promise.resolve(rows).then(resolve, reject);
      return subchain;
    };
    chain.orderBy = () => Promise.resolve(rows);
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(rows).then(resolve, reject);
    return chain;
  };

  const db = {
    select: vi.fn(() => makeSelectChain()),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([_insertReturnRow])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve(_updateReturnRow ? [_updateReturnRow] : [_insertReturnRow])),
        })),
      })),
    })),
  };

  const stubTable = {};
  return new Proxy(
    { db, pool: poolMock } as Record<string, unknown>,
    {
      get(target, prop) {
        if (prop in target) return target[prop as string];
        return stubTable;
      },
      has() { return true; },
    },
  );
});

vi.mock('drizzle-orm', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createDrizzleOrmMock();
});

vi.mock('../../lib/logger.js', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../../lib/email.js', () => ({
  sendEmail: vi.fn(async () => {
    if (_sendEmailShouldThrow) throw new Error('SMTP timeout');
    return _sendEmailResult;
  }),
  buildAgentTicketReplyEmail: vi.fn(() => ({
    subject: 'Re: Hi',
    html: '<p>body</p>',
    text: 'body',
  })),
  buildTicketStatusEmail: vi.fn(() => ({ subject: 'S', html: '<p>s</p>', text: 's' })),
  generateUnsubscribeToken: vi.fn(() => 'tok-123'),
  logNotificationAudit: vi.fn(),
}));

vi.mock('../../lib/validation.js', () => ({
  validateBody: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  validateQuery: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  listQuerySchema: {},
  supportTicketTransitionSchema: {},
  kbArticleArchiveSchema: {},
}));

const { register } = await import('../admin/support.js');

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  register(router);
  app.use('/api', router);
  return app;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SUBMISSION = {
  id: 1,
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  emailOptOut: false,
  status: 'open',
};

const makeReply = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  contactSubmissionId: 1,
  subject: 'Re: Your inquiry',
  body: 'Thanks for reaching out.',
  sentBy: 'Agent Alice',
  emailSuccess: true,
  messageId: 'msg-abc',
  sentAt: '2025-01-01T10:00:00.000Z',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  _selectQueue = [];
  _insertReturnRow = makeReply({ emailSuccess: false, messageId: null });
  _updateReturnRow = null;
  _sendEmailResult = { success: true, messageId: 'msg-1', provider: 'test' };
  _sendEmailShouldThrow = false;
  _poolQueryRows = [{ notification_email: 'support@szlholdings.com' }];
});

// ---------------------------------------------------------------------------
// GET /admin/support-queue/:id/replies
// ---------------------------------------------------------------------------

// GET endpoint: first select = submission lookup, second select = replies fetch
describe('GET /api/admin/support-queue/:id/replies', () => {
  it('returns 404 when ticket does not exist', async () => {
    _selectQueue = [[]]; // submission not found
    const res = await request(buildApp()).get('/api/admin/support-queue/999/replies');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-numeric ticket ID', async () => {
    const res = await request(buildApp()).get('/api/admin/support-queue/abc/replies');
    expect(res.status).toBe(400);
  });

  it('returns empty replies array when no replies exist', async () => {
    _selectQueue = [[SUBMISSION], []]; // submission found, no replies
    const res = await request(buildApp()).get('/api/admin/support-queue/1/replies');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('replies');
    expect(res.body.replies).toEqual([]);
  });

  it('returns replies in the order provided by the query (chronological)', async () => {
    const r1 = makeReply({ id: 1, sentAt: '2025-01-01T09:00:00.000Z', subject: 'First reply' });
    const r2 = makeReply({ id: 2, sentAt: '2025-01-01T10:00:00.000Z', subject: 'Second reply' });
    _selectQueue = [[SUBMISSION], [r1, r2]];

    const res = await request(buildApp()).get('/api/admin/support-queue/1/replies');
    expect(res.status).toBe(200);
    expect(res.body.replies).toHaveLength(2);
    expect(res.body.replies[0].subject).toBe('First reply');
    expect(res.body.replies[1].subject).toBe('Second reply');
  });

  it('includes emailSuccess on each reply entry', async () => {
    _selectQueue = [
      [SUBMISSION],
      [makeReply({ id: 1, emailSuccess: true }), makeReply({ id: 2, emailSuccess: false })],
    ];

    const res = await request(buildApp()).get('/api/admin/support-queue/1/replies');
    expect(res.status).toBe(200);
    expect(res.body.replies[0].emailSuccess).toBe(true);
    expect(res.body.replies[1].emailSuccess).toBe(false);
  });

  it('includes sentBy on each reply entry', async () => {
    _selectQueue = [[SUBMISSION], [makeReply({ sentBy: 'Support Agent Bob' })]];

    const res = await request(buildApp()).get('/api/admin/support-queue/1/replies');
    expect(res.status).toBe(200);
    expect(res.body.replies[0].sentBy).toBe('Support Agent Bob');
  });
});

// ---------------------------------------------------------------------------
// POST /admin/support-queue/:id/reply — persistence ordering
// ---------------------------------------------------------------------------

// POST endpoint: only one select = submission lookup
describe('POST /api/admin/support-queue/:id/reply — persistence', () => {
  it('returns 404 when ticket does not exist', async () => {
    _selectQueue = [[]], // submission not found
    await request(buildApp())
      .post('/api/admin/support-queue/999/reply')
      .send({ subject: 'Hi', body: 'Hello there.' })
      .expect(404);
  });

  it('returns 400 for a non-numeric ticket ID', async () => {
    await request(buildApp())
      .post('/api/admin/support-queue/bad/reply')
      .send({ subject: 'Hi', body: 'Hello.' })
      .expect(400);
  });

  it('blocks reply and returns error when contact has opted out', async () => {
    _selectQueue = [[{ ...SUBMISSION, emailOptOut: true }]];
    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/reply')
      .send({ subject: 'Hi', body: 'Hello.' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.sent).toBe(false);
  });

  it('persists reply and returns success when email sends successfully', async () => {
    _selectQueue = [[SUBMISSION]];
    _sendEmailResult = { success: true, messageId: 'msg-ok', provider: 'smtp' };
    _updateReturnRow = makeReply({ emailSuccess: true, messageId: 'msg-ok' });

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/reply')
      .send({ subject: 'Re: inquiry', body: 'We will follow up.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sent).toBe(true);
    expect(res.body.reply).toBeDefined();
  });

  it('persists reply record and returns failure details when email delivery fails', async () => {
    _selectQueue = [[SUBMISSION]];
    _sendEmailResult = { success: false, error: 'SMTP connection refused' };
    _updateReturnRow = makeReply({ emailSuccess: false, messageId: null });

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/reply')
      .send({ subject: 'Re: inquiry', body: 'We will follow up.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.sent).toBe(false);
    // Reply record must still be returned (persisted before send attempt)
    expect(res.body.reply).toBeDefined();
  });

  it('persists reply record even when sendEmail throws an exception', async () => {
    _selectQueue = [[SUBMISSION]];
    _sendEmailShouldThrow = true;

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/reply')
      .send({ subject: 'Re: inquiry', body: 'We will follow up.' });

    // Inner try/catch captures sendEmail throws — response must be 200, not 500
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(false);
    // Reply record was already inserted before sendEmail was called
    expect(res.body.reply).toBeDefined();
  });
});
