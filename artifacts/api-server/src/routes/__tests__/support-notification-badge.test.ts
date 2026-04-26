import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let _selectQueue: unknown[][] = [];
let _insertReturnRow: unknown = null;
let _updateReturnRow: unknown = null;

let _poolQueryRows: unknown[] = [];
let _poolQueryRowCount = 1;

const _sendEmail = vi.fn(async () => ({ success: true, messageId: 'msg-1', provider: 'test' }));

vi.mock('@szl-holdings/db', () => {
  const poolMock = {
    query: vi.fn(() =>
      Promise.resolve({ rows: _poolQueryRows, rowCount: _poolQueryRowCount }),
    ),
  };

  const makeSelectChain = (): unknown => {
    const rows = _selectQueue.shift() ?? [];

    const makeTerminal = (): Record<string, unknown> => {
      const t: Record<string, unknown> = {};
      t.limit = () => makeTerminal();
      t.orderBy = () => makeTerminal();
      t.where = () => makeTerminal();
      t.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
        Promise.resolve(rows).then(resolve, reject);
      return t;
    };

    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.from = self;
    chain.leftJoin = self;
    chain.where = () => makeTerminal();
    chain.orderBy = () => makeTerminal();
    chain.limit = () => makeTerminal();
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

function buildApp() {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  register(router);
  app.use('/api', router);
  return app;
}

const SUBMISSION = {
  id: 1,
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  emailOptOut: false,
  status: 'open',
  formKey: 'szl_contact',
  company: 'Acme',
  message: 'Help needed',
  createdAt: new Date('2025-01-15'),
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

beforeEach(() => {
  _selectQueue = [];
  _insertReturnRow = null;
  _updateReturnRow = null;
  _poolQueryRows = [];
  _poolQueryRowCount = 1;
  _sendEmail.mockClear();
  _sendEmail.mockResolvedValue({ success: true, messageId: 'msg-1', provider: 'test' });
});

describe('GET /api/admin/support-queue — notificationSentAt in response', () => {
  it('includes notificationSentAt: null when no notification has been sent', async () => {
    const ticket = {
      ...SUBMISSION,
      leadStatusId: 10,
      status: 'new',
      notes: null,
      ownerUserId: null,
      submissionStatus: 'open',
      resolvedAt: null,
    };
    _selectQueue = [
      [ticket],
      [{ total: 1 }],
      [{ openTotal: 1 }],
    ];
    _poolQueryRows = [{ id: 1, email_opt_out: false, notification_sent_at: null }];

    const res = await request(buildApp()).get('/api/admin/support-queue');
    expect(res.status).toBe(200);
    expect(res.body.tickets).toHaveLength(1);
    expect(res.body.tickets[0]).toHaveProperty('notificationSentAt', null);
    expect(res.body.tickets[0]).toHaveProperty('emailOptOut', false);
  });

  it('includes notificationSentAt timestamp when a notification has been sent', async () => {
    const sentAt = '2025-01-15T12:00:00.000Z';
    const ticket = {
      ...SUBMISSION,
      leadStatusId: 10,
      status: 'contacted',
      notes: null,
      ownerUserId: null,
      submissionStatus: 'open',
      resolvedAt: null,
    };
    _selectQueue = [
      [ticket],
      [{ total: 1 }],
      [{ openTotal: 1 }],
    ];
    _poolQueryRows = [{ id: 1, email_opt_out: false, notification_sent_at: sentAt }];

    const res = await request(buildApp()).get('/api/admin/support-queue');
    expect(res.status).toBe(200);
    expect(res.body.tickets).toHaveLength(1);
    expect(res.body.tickets[0].notificationSentAt).toBe(sentAt);
  });
});

describe('POST /api/admin/support-queue/:id/status — notificationQueued badge contract', () => {
  it('returns notificationQueued: true when status changes', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'new' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notificationQueued).toBe(true);
  });

  it('returns notificationQueued: true when notes are added', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'contacted', notes: null }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted', notes: 'Follow up needed' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ notes: 'Follow up needed' });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(true);
  });

  it('returns notificationQueued: false when status is unchanged and no new notes', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'contacted', notes: 'old note' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted', notes: 'old note' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(false);
  });

  it('returns notificationQueued: false when only ownerUserId changes', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'new' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'new', ownerUserId: 5 };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ ownerUserId: 5 });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(false);
  });

  it('returns notificationQueued: false when notify is explicitly false', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'new' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted', notify: false });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(false);
  });

  it('includes emailOptOut field in the response', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'new' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('emailOptOut');
    expect(typeof res.body.emailOptOut).toBe('boolean');
  });
});
