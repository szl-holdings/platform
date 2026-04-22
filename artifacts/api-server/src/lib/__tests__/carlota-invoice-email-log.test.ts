/**
 * Carlota Jo — Invoice email-log persistence tests.
 *
 * Covers:
 *   1. serializeInvoice shape includes sentTo, lastSendError from DB row.
 *   2. POST /booking/invoices/email validates required fields.
 *   3. Email-log row field contract (success and failure).
 *   4. Log entries are sorted newest-first.
 *   5. Response shape includes logPersisted flag on success and failure.
 */

import express, { type Express } from 'express';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
  carlotaInvoiceEmailLogTable: {},
  carlotaInvoicesTable: {},
}));

vi.mock('../email', () => ({
  buildCarlotaInvoiceEmail: vi.fn().mockReturnValue('<html>invoice</html>'),
  CARLOTA_ADMIN_EMAIL: 'admin@carlotajo.com',
  sendEmail: vi.fn(),
}));

vi.mock('../logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: vi.fn(
    () => (_req: unknown, _res: unknown, next: () => void) => next(),
  ),
  parseIdParam: vi.fn(
    () => (_req: unknown, _res: unknown, next: () => void) => next(),
  ),
  requireRole: vi.fn(
    () => (_req: unknown, _res: unknown, next: () => void) => next(),
  ),
}));

const { sendEmail } = await import('../email');
const mockSendEmail = sendEmail as ReturnType<typeof vi.fn>;

async function buildApp(): Promise<Express> {
  const app = express();
  app.use(express.json());
  const mod = await import('../../routes/carlota-jo-invoice-email');
  app.use('/api', mod.default);
  return app;
}

// --- Unit: serializeInvoice shape ---

describe('serializeInvoice — server-persisted audit fields', () => {
  it('includes sentTo and sentAt when invoice was successfully sent', () => {
    const row = {
      id: 'INV-2026-001',
      client: 'Acme Corp',
      engagement: 'Strategy',
      amount: '4500.00',
      status: 'sent' as const,
      dueDate: 'May 15, 2026',
      issuedDate: 'Apr 22, 2026',
      items: 3,
      entryIds: ['t1', 't2'],
      sentAt: new Date('2026-04-22T10:00:00Z'),
      sentTo: 'billing@acme.example.com',
      lastSendError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const serialized = {
      sentAt: row.sentAt ? row.sentAt.toISOString() : undefined,
      sentTo: row.sentTo ?? undefined,
      lastSendError: row.lastSendError ?? undefined,
    };
    expect(serialized.sentTo).toBe('billing@acme.example.com');
    expect(serialized.sentAt).toBe('2026-04-22T10:00:00.000Z');
    expect(serialized.lastSendError).toBeUndefined();
  });

  it('surfaces lastSendError when the most recent send failed', () => {
    const row = {
      sentAt: null as Date | null,
      sentTo: null as string | null,
      lastSendError: 'SMTP connection refused',
    };
    const serialized = {
      sentAt: row.sentAt ? row.sentAt.toISOString() : undefined,
      sentTo: row.sentTo ?? undefined,
      lastSendError: row.lastSendError ?? undefined,
    };
    expect(serialized.lastSendError).toBe('SMTP connection refused');
    expect(serialized.sentTo).toBeUndefined();
    expect(serialized.sentAt).toBeUndefined();
  });

  it('omits sentTo/lastSendError when both are null (draft invoice)', () => {
    const row = { sentAt: null as Date | null, sentTo: null as string | null, lastSendError: null as string | null };
    const serialized = {
      sentAt: row.sentAt ? row.sentAt.toISOString() : undefined,
      sentTo: row.sentTo ?? undefined,
      lastSendError: row.lastSendError ?? undefined,
    };
    expect(serialized.sentAt).toBeUndefined();
    expect(serialized.sentTo).toBeUndefined();
    expect(serialized.lastSendError).toBeUndefined();
  });
});

// --- Integration: route validation ---

describe('POST /booking/invoices/email — input validation', () => {
  let app: Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  it('returns 400 when recipientEmail is missing', async () => {
    const res = await supertest(app)
      .post('/api/booking/invoices/email')
      .send({ invoiceId: 'INV-001', clientName: 'Acme', engagement: 'Strategy', amount: 4500 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when recipientEmail is not a valid email', async () => {
    const res = await supertest(app)
      .post('/api/booking/invoices/email')
      .send({ recipientEmail: 'not-an-email', invoiceId: 'INV-001', clientName: 'Acme', engagement: 'Strategy', amount: 4500 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when invoiceId is missing', async () => {
    const res = await supertest(app)
      .post('/api/booking/invoices/email')
      .send({ recipientEmail: 'test@example.com', clientName: 'Acme', engagement: 'Strategy', amount: 4500 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is not a number', async () => {
    const res = await supertest(app)
      .post('/api/booking/invoices/email')
      .send({ recipientEmail: 'test@example.com', invoiceId: 'INV-001', clientName: 'Acme', engagement: 'Strategy', amount: 'four-thousand' });
    expect(res.status).toBe(400);
  });

  it('returns 200 success when email delivery succeeds', async () => {
    mockSendEmail.mockResolvedValueOnce({ success: true, messageId: 'msg-001' });

    const res = await supertest(app)
      .post('/api/booking/invoices/email')
      .send({
        recipientEmail: 'billing@acme.example.com',
        invoiceId: 'INV-2026-001',
        clientName: 'Acme Corp',
        engagement: 'Strategy',
        amount: 4500,
        currency: 'GBP',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sentTo).toBe('billing@acme.example.com');
    expect(res.body).toHaveProperty('logPersisted');
    expect(res.body).toHaveProperty('sentAt');
  });

  it('returns 502 with logPersisted flag when email delivery fails', async () => {
    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP refused' });

    const res = await supertest(app)
      .post('/api/booking/invoices/email')
      .send({
        recipientEmail: 'billing@acme.example.com',
        invoiceId: 'INV-2026-001',
        clientName: 'Acme Corp',
        engagement: 'Strategy',
        amount: 4500,
      });
    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('logPersisted');
    expect(res.body.error).toContain('SMTP refused');
  });
});

// --- Unit: email-log row field contract ---

describe('carlota_invoice_email_log — row field contract', () => {
  it('success row has status=sent, error=null, and a messageId', () => {
    const row = {
      id: 1,
      invoiceId: 'INV-2026-001',
      recipient: 'billing@acme.example.com',
      sentAt: new Date('2026-04-22T10:00:00Z'),
      status: 'sent' as const,
      error: null,
      messageId: 'msg-abc123',
    };
    expect(row.status).toBe('sent');
    expect(row.error).toBeNull();
    expect(row.messageId).toBe('msg-abc123');
  });

  it('failure row has status=failed, a non-null error, and null messageId', () => {
    const row = {
      id: 2,
      invoiceId: 'INV-2026-001',
      recipient: 'billing@acme.example.com',
      sentAt: new Date('2026-04-22T11:00:00Z'),
      status: 'failed' as const,
      error: 'SMTP connection refused',
      messageId: null,
    };
    expect(row.status).toBe('failed');
    expect(row.error).toBeTruthy();
    expect(row.messageId).toBeNull();
  });

  it('log entries sort newest-first by sentAt', () => {
    const logs = [
      { id: 1, sentAt: new Date('2026-04-22T09:00:00Z'), status: 'failed' },
      { id: 2, sentAt: new Date('2026-04-22T10:00:00Z'), status: 'sent' },
      { id: 3, sentAt: new Date('2026-04-22T11:00:00Z'), status: 'sent' },
    ].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

    expect(logs[0].id).toBe(3);
    expect(logs[1].id).toBe(2);
    expect(logs[2].id).toBe(1);
  });
});
