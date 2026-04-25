/**
 * Support per-contact email opt-out — integration tests
 *
 * Coverage:
 *  - POST /admin/support-queue/:id/opt-out
 *      • 400 for non-numeric ID
 *      • 404 when ticket does not exist
 *      • persists opt-out (true) and returns updated flag
 *      • persists re-enable (false) and returns updated flag
 *
 *  - POST /admin/support-queue/:id/status — email suppression
 *      • notificationQueued=false when contact has emailOptOut=true (no notify override)
 *      • notificationQueued=true  when contact has emailOptOut=false (no notify override)
 *      • emailOptOut is reflected in the response body
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mutable test state — reset in beforeEach
// ---------------------------------------------------------------------------

let _selectQueue: unknown[][] = [];
let _insertReturnRow: unknown = null;
let _updateReturnRow: unknown = null;

// pool.query response controls (rowCount for opt-out 404 check)
let _poolQueryRows: unknown[] = [{ notification_email: 'support@szlholdings.com' }];
let _poolQueryRowCount = 1;

const _sendEmail = vi.fn(async () => ({ success: true, messageId: 'msg-1', provider: 'test' }));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  const poolMock = {
    query: vi.fn(() =>
      Promise.resolve({ rows: _poolQueryRows, rowCount: _poolQueryRowCount }),
    ),
  };

  const makeSelectChain = (): unknown => {
    const rows = _selectQueue.shift() ?? [];
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.from = self;
    chain.leftJoin = self;
    chain.where = () => {
      const subchain: Record<string, unknown> = {};
      subchain.orderBy = () => Promise.resolve(rows);
      subchain.limit = () => Promise.resolve(rows);
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
        returning: vi.fn(() => Promise.resolve(_insertReturnRow ? [_insertReturnRow] : [])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() =>
            Promise.resolve(_updateReturnRow ? [_updateReturnRow] : (_insertReturnRow ? [_insertReturnRow] : [])),
          ),
          catch: vi.fn(),
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
      has() {
        return true;
      },
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
  sendEmail: _sendEmail,
  buildAgentTicketReplyEmail: vi.fn(() => ({ subject: 'Re', html: '<p>hi</p>', text: 'hi' })),
  buildTicketStatusEmail: vi.fn(() => ({
    subject: 'Status update',
    html: '<p>status</p>',
    text: 'status',
  })),
  generateUnsubscribeToken: vi.fn(() => 'tok-abc'),
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

const SUBMISSION_OPT_IN = {
  id: 1,
  fullName: 'John Smith',
  email: 'john@example.com',
  emailOptOut: false,
  status: 'open',
};

const SUBMISSION_OPT_OUT = {
  ...SUBMISSION_OPT_IN,
  emailOptOut: true,
};

const LEAD_ROW = {
  id: 10,
  contactSubmissionId: 1,
  status: 'new',
  ownerUserId: null,
  notes: null,
  updatedAt: new Date().toISOString(),
  notificationSentAt: null,
};

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  _selectQueue = [];
  _insertReturnRow = null;
  _updateReturnRow = null;
  _poolQueryRows = [{ notification_email: 'support@szlholdings.com' }];
  _poolQueryRowCount = 1;
  _sendEmail.mockClear();
  _sendEmail.mockResolvedValue({ success: true, messageId: 'msg-1', provider: 'test' });
});

// ---------------------------------------------------------------------------
// POST /admin/support-queue/:id/opt-out
// ---------------------------------------------------------------------------

describe('POST /api/admin/support-queue/:id/opt-out', () => {
  it('returns 400 for a non-numeric ticket ID', async () => {
    const res = await request(buildApp())
      .post('/api/admin/support-queue/abc/opt-out')
      .send({ optOut: true });
    expect(res.status).toBe(400);
  });

  it('returns 404 when the ticket does not exist', async () => {
    _poolQueryRowCount = 0;
    const res = await request(buildApp())
      .post('/api/admin/support-queue/999/opt-out')
      .send({ optOut: true });
    expect(res.status).toBe(404);
  });

  it('sets emailOptOut=true and returns the updated flag', async () => {
    _poolQueryRowCount = 1;
    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/opt-out')
      .send({ optOut: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, emailOptOut: true });
  });

  it('sets emailOptOut=false (re-enable) and returns the updated flag', async () => {
    _poolQueryRowCount = 1;
    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/opt-out')
      .send({ optOut: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, emailOptOut: false });
  });

  it('defaults to optOut=true when the field is omitted', async () => {
    _poolQueryRowCount = 1;
    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/opt-out')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.emailOptOut).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /admin/support-queue/:id/status — email suppression based on emailOptOut
// ---------------------------------------------------------------------------

describe('POST /api/admin/support-queue/:id/status — emailOptOut suppression', () => {
  it('suppresses notification email when contact emailOptOut=true (no notify override)', async () => {
    _selectQueue = [
      [SUBMISSION_OPT_OUT],
      [{ ...LEAD_ROW, status: 'new' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(false);
    expect(res.body.emailOptOut).toBe(true);
    expect(_sendEmail).not.toHaveBeenCalled();
  });

  it('queues notification email when contact emailOptOut=false (no notify override)', async () => {
    _selectQueue = [
      [SUBMISSION_OPT_IN],
      [{ ...LEAD_ROW, status: 'new' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(true);
    expect(res.body.emailOptOut).toBe(false);
  });

  it('suppresses email for opted-out contact even when status is unchanged but notes are added', async () => {
    _selectQueue = [
      [SUBMISSION_OPT_OUT],
      [{ ...LEAD_ROW, status: 'contacted', notes: null }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted', notes: 'Follow up next week' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ notes: 'Follow up next week' });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(false);
    expect(_sendEmail).not.toHaveBeenCalled();
  });

  it('returns 404 when ticket submission does not exist', async () => {
    _selectQueue = [[]];
    const res = await request(buildApp())
      .post('/api/admin/support-queue/999/status')
      .send({ status: 'contacted' });
    expect(res.status).toBe(404);
  });
});
