import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let _selectQueue: unknown[][] = [];
let _insertReturnRow: unknown = null;
let _updateReturnRow: unknown = null;
let _insertCalls: unknown[][] = [];

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
      values: vi.fn((...args: unknown[]) => {
        _insertCalls.push(args);
        return {
          returning: vi.fn(() => Promise.resolve(_insertReturnRow ? [_insertReturnRow] : [])),
        };
      }),
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
  buildAgentTicketReplyEmail: vi.fn(() => ({ subject: 'Re: inquiry', html: '<p>hi</p>', text: 'hi' })),
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
  _insertCalls = [];
  _poolQueryRows = [];
  _poolQueryRowCount = 1;
  _sendEmail.mockClear();
  _sendEmail.mockResolvedValue({ success: true, messageId: 'msg-1', provider: 'test' });
});

describe('GET /api/admin/support-queue/:id/email-log', () => {
  it('returns 400 for invalid ticket ID', async () => {
    const res = await request(buildApp()).get('/api/admin/support-queue/abc/email-log');
    expect(res.status).toBe(400);
  });

  it('returns 404 when ticket does not exist', async () => {
    _selectQueue = [[]];
    const res = await request(buildApp()).get('/api/admin/support-queue/999/email-log');
    expect(res.status).toBe(404);
  });

  it('returns empty logs array for ticket with no email history', async () => {
    _selectQueue = [
      [{ id: 1 }],
      [],
    ];
    const res = await request(buildApp()).get('/api/admin/support-queue/1/email-log');
    expect(res.status).toBe(200);
    expect(res.body.logs).toEqual([]);
  });

  it('returns log entries for a ticket', async () => {
    const logEntry = {
      id: 1,
      contactSubmissionId: 1,
      recipient: 'jane@example.com',
      subject: 'Status update',
      template: 'status_change',
      previousStatus: 'new',
      newStatus: 'contacted',
      deliveryStatus: 'sent',
      provider: 'test',
      messageId: 'msg-1',
      error: null,
      sentAt: '2025-01-15T12:00:00.000Z',
    };
    _selectQueue = [
      [{ id: 1 }],
      [logEntry],
    ];
    const res = await request(buildApp()).get('/api/admin/support-queue/1/email-log');
    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.logs[0]).toMatchObject({
      recipient: 'jane@example.com',
      template: 'status_change',
      deliveryStatus: 'sent',
    });
  });

  it('returns failed delivery entries with error details', async () => {
    const failedEntry = {
      id: 2,
      contactSubmissionId: 1,
      recipient: 'jane@example.com',
      subject: 'Status update',
      template: 'status_change',
      previousStatus: 'new',
      newStatus: 'contacted',
      deliveryStatus: 'failed',
      provider: null,
      messageId: null,
      error: 'SMTP timeout',
      sentAt: '2025-01-15T12:00:00.000Z',
    };
    _selectQueue = [
      [{ id: 1 }],
      [failedEntry],
    ];
    const res = await request(buildApp()).get('/api/admin/support-queue/1/email-log');
    expect(res.status).toBe(200);
    expect(res.body.logs[0].deliveryStatus).toBe('failed');
    expect(res.body.logs[0].error).toBe('SMTP timeout');
  });
});

describe('POST /api/admin/support-queue/:id/status — email log persistence', () => {
  it('persists email log when status change triggers notification', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'new' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(true);

    await vi.waitFor(() => {
      expect(_sendEmail).toHaveBeenCalledTimes(1);
    });

    await vi.waitFor(() => {
      const emailLogInsert = _insertCalls.find(
        (args) => (args[0] as Record<string, unknown>)?.template === 'status_change',
      );
      expect(emailLogInsert).toBeDefined();
      const data = emailLogInsert![0] as Record<string, unknown>;
      expect(data.contactSubmissionId).toBe(1);
      expect(data.recipient).toBe('jane@example.com');
      expect(data.deliveryStatus).toBe('sent');
      expect(data.previousStatus).toBe('new');
      expect(data.newStatus).toBe('contacted');
    });
  });

  it('persists failed email log when sendEmail rejects', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'new' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted' };
    _sendEmail.mockRejectedValueOnce(new Error('Network down'));

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(true);

    await vi.waitFor(() => {
      const emailLogInsert = _insertCalls.find(
        (args) => (args[0] as Record<string, unknown>)?.template === 'status_change',
      );
      expect(emailLogInsert).toBeDefined();
      const data = emailLogInsert![0] as Record<string, unknown>;
      expect(data.deliveryStatus).toBe('failed');
      expect(data.error).toContain('Network down');
    });
  });

  it('does not persist email log when no notification is sent', async () => {
    _selectQueue = [
      [SUBMISSION],
      [{ ...LEAD_ROW, status: 'contacted', notes: 'old' }],
    ];
    _updateReturnRow = { ...LEAD_ROW, status: 'contacted', notes: 'old' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/status')
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.notificationQueued).toBe(false);
    expect(_sendEmail).not.toHaveBeenCalled();
    const emailLogInsert = _insertCalls.find(
      (args) => (args[0] as Record<string, unknown>)?.template === 'status_change',
    );
    expect(emailLogInsert).toBeUndefined();
  });
});

describe('POST /api/admin/support-queue/:id/reply — email log persistence', () => {
  it('persists email log entry when reply is sent successfully', async () => {
    _selectQueue = [
      [SUBMISSION],
    ];
    _insertReturnRow = {
      id: 5,
      contactSubmissionId: 1,
      subject: 'Re: inquiry',
      body: 'Hello',
      sentBy: 'Admin',
      emailSuccess: false,
      messageId: null,
      sentAt: new Date().toISOString(),
    };
    _updateReturnRow = { ..._insertReturnRow, emailSuccess: true, messageId: 'msg-1' };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/reply')
      .send({ subject: 'Re: inquiry', body: 'Hello' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sent).toBe(true);

    const emailLogInsert = _insertCalls.find(
      (args) => (args[0] as Record<string, unknown>)?.template === 'agent_reply',
    );
    expect(emailLogInsert).toBeDefined();
    const data = emailLogInsert![0] as Record<string, unknown>;
    expect(data.contactSubmissionId).toBe(1);
    expect(data.recipient).toBe('jane@example.com');
    expect(data.deliveryStatus).toBe('sent');
    expect(data.provider).toBe('test');
  });

  it('persists failed delivery in email log when send fails', async () => {
    _selectQueue = [
      [SUBMISSION],
    ];
    _insertReturnRow = {
      id: 5,
      contactSubmissionId: 1,
      subject: 'Re: inquiry',
      body: 'Hello',
      sentBy: 'Admin',
      emailSuccess: false,
      messageId: null,
      sentAt: new Date().toISOString(),
    };
    _sendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP connection refused' });
    _updateReturnRow = { ..._insertReturnRow, emailSuccess: false };

    const res = await request(buildApp())
      .post('/api/admin/support-queue/1/reply')
      .send({ subject: 'Re: inquiry', body: 'Hello' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.sent).toBe(false);
    expect(res.body.error).toBe('SMTP connection refused');

    const emailLogInsert = _insertCalls.find(
      (args) => (args[0] as Record<string, unknown>)?.template === 'agent_reply',
    );
    expect(emailLogInsert).toBeDefined();
    const data = emailLogInsert![0] as Record<string, unknown>;
    expect(data.deliveryStatus).toBe('failed');
    expect(data.error).toBe('SMTP connection refused');
  });
});
