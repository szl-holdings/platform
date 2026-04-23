import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const sampleInquiries = [
  {
    id: 1,
    name: 'Alice Chen',
    email: 'alice@example.com',
    company: 'Acme Corp',
    phone: null,
    service: 'advisory',
    message: 'Interested in executive advisory.',
    status: 'new',
    metadata: null,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
  },
  {
    id: 2,
    name: 'Bob Martins',
    email: 'bob@example.com',
    company: null,
    phone: null,
    service: 'brand',
    message: 'Need brand strategy help.',
    status: 'in_review',
    metadata: null,
    createdAt: new Date('2026-03-28'),
    updatedAt: new Date('2026-04-02'),
  },
];

let capturedUpdateValues: Record<string, unknown> | null = null;
let capturedUpdateId: number | null = null;

vi.mock('@szl-holdings/db', () => {
  const carlotaInquiriesTable = {
    id: 'id',
    name: 'name',
    email: 'email',
    createdAt: 'createdAt',
  };
  const carlotaReservationsTable = {
    id: 'id',
    name: 'name',
    email: 'email',
    service: 'service',
    createdAt: 'createdAt',
  };
  const carlotaServicesTable = { id: 'id', slug: 'slug' };
  const carlotaClientProfilesTable = { id: 'id', email: 'email' };
  const carlotaEngagementsTable = { id: 'id', externalId: 'externalId', organizationId: 'organizationId', status: 'status' };
  const carlotaDiagnosticsTable = { id: 'id', externalId: 'externalId', organizationId: 'organizationId' };
  const carlotaScenariosTable = { id: 'id', externalId: 'externalId', organizationId: 'organizationId' };
  const carlotaAdvisoryClientsTable = { externalId: 'externalId' };
  const carlotaExpertsTable = { id: 'id', organizationId: 'organizationId' };
  const carlotaKnowledgeItemsTable = { id: 'id', organizationId: 'organizationId', isSeeded: 'isSeeded' };
  const carlotaProposalDraftsTable = { id: 'id', organizationId: 'organizationId' };
  const carlotaRadarCompetitorsTable = { id: 'id', userId: 'userId' };
  const carlotaRadarNotifPrefsTable = { id: 'id', userId: 'userId' };
  const carlotaRadarSeenSignalsTable = { id: 'id', userId: 'userId' };
  const clientAccountsTable = { id: 'id' };
  const clientDocumentsTable = { id: 'id' };
  const clientMessagesTable = { id: 'id' };
  const clientUpdatesTable = { id: 'id' };
  const carlotaClientCompetitorsTable = { id: 'id' };
  const carlotaClientMarginHistoryTable = { id: 'id' };
  const carlotaClientMarketTrendTable = { id: 'id' };
  const carlotaClientRadarSignalsTable = { id: 'id' };
  const carlotaClientRoiBenchmarksTable = { id: 'id' };
  const carlotaClientRoiTrendTable = { id: 'id' };

  const makeChain = (result: unknown) => {
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => chain;
    chain.offset = () => chain;
    chain.returning = () => Promise.resolve(result);
    chain.then = (fn: (v: unknown) => void) => Promise.resolve(result).then(fn);
    return chain;
  };

  const db = {
    select: (cols?: unknown) => {
      if (cols && typeof cols === 'object' && 'count' in (cols as Record<string, unknown>)) {
        return makeChain([{ count: sampleInquiries.length }]);
      }
      return makeChain(sampleInquiries);
    },
    insert: () => ({
      values: (vals: Record<string, unknown>) => ({
        returning: () => Promise.resolve([{ id: 99, ...vals, status: 'new', createdAt: new Date(), updatedAt: new Date() }]),
      }),
    }),
    update: () => ({
      set: (vals: Record<string, unknown>) => {
        capturedUpdateValues = vals;
        return {
          where: (condition: unknown) => {
            void condition;
            return {
              returning: () => {
                const row = sampleInquiries.find((r) => r.id === (capturedUpdateId ?? 1));
                if (!row) return Promise.resolve([]);
                return Promise.resolve([{ ...row, ...vals }]);
              },
            };
          },
        };
      },
    }),
    delete: () => ({
      where: () => ({
        returning: () => Promise.resolve([sampleInquiries[0]]),
      }),
    }),
  };

  return {
    db,
    carlotaInquiriesTable,
    carlotaReservationsTable,
    carlotaServicesTable,
    carlotaClientProfilesTable,
    carlotaEngagementsTable,
    carlotaDiagnosticsTable,
    carlotaScenariosTable,
    carlotaAdvisoryClientsTable,
    carlotaExpertsTable,
    carlotaKnowledgeItemsTable,
    carlotaProposalDraftsTable,
    carlotaRadarCompetitorsTable,
    carlotaRadarNotifPrefsTable,
    carlotaRadarSeenSignalsTable,
    clientAccountsTable,
    clientDocumentsTable,
    clientMessagesTable,
    clientUpdatesTable,
    carlotaClientCompetitorsTable,
    carlotaClientMarginHistoryTable,
    carlotaClientMarketTrendTable,
    carlotaClientRadarSignalsTable,
    carlotaClientRoiBenchmarksTable,
    carlotaClientRoiTrendTable,
  };
});

vi.mock('drizzle-orm', () => {
  const sqlTag = () => 'count-tag';
  const sqlProxy = new Proxy(sqlTag, {
    get: (_target, prop) => {
      if (prop === 'raw') return (v: unknown) => v;
      return () => sqlTag;
    },
    apply: (_target, _this, args) => args,
  });
  return {
    desc: vi.fn(),
    eq: vi.fn((col: string, val: unknown) => ({ col, val })),
    and: vi.fn(),
    or: vi.fn(),
    sql: sqlProxy,
    inArray: vi.fn(),
  };
});

vi.mock('@szl-holdings/ai-engine/domain-embedding-hooks', () => ({
  ingestCarlotaService: vi.fn(),
}));

vi.mock('@szl-holdings/services', () => ({ services: {} }));

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: () => (req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = { id: 1, roles: ['admin'], orgs: [] };
    next();
  },
  parseIdParam: (req: { params: { id?: string } }, _res: unknown) => {
    const n = parseInt(String(req.params?.id ?? ''), 10);
    return Number.isNaN(n) ? null : n;
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../lib/email', () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
  buildCarlotaContactAckEmail: () => '',
  buildCarlotaInquiryNotificationEmail: () => '',
  buildCarlotaRadarAlertEmail: () => '',
  buildCarlotaRadarDigestEmail: () => '',
  CARLOTA_ADMIN_EMAIL: 'admin@example.com',
}));

vi.mock('../lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn(async () => {}) },
  CARLOTA_EVENTS: { INQUIRY_CREATED: 'x' },
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { default: carlotaRouter } = await import('../routes/carlota-jo.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(carlotaRouter);
  return app;
}

describe('Inquiry Inbox API', () => {
  describe('GET /booking/inquiries', () => {
    it('returns a paginated list of inquiries', async () => {
      const app = buildApp();
      const res = await request(app).get('/booking/inquiries').expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toHaveProperty('name', 'Alice Chen');
      expect(res.body.data[0]).toHaveProperty('status', 'new');
      expect(res.body.data[1]).toHaveProperty('name', 'Bob Martins');
      expect(res.body.meta).toMatchObject({ total: 2 });
    });
  });

  describe('PATCH /booking/inquiries/:id', () => {
    it('updates inquiry status from new to in_review', async () => {
      capturedUpdateId = 1;
      const app = buildApp();
      const res = await request(app)
        .patch('/booking/inquiries/1')
        .send({ status: 'in_review' })
        .expect(200);
      expect(res.body).toHaveProperty('status', 'in_review');
      expect(capturedUpdateValues).toMatchObject({ status: 'in_review' });
    });

    it('updates inquiry status from in_review to closed', async () => {
      capturedUpdateId = 2;
      const app = buildApp();
      const res = await request(app)
        .patch('/booking/inquiries/2')
        .send({ status: 'closed' })
        .expect(200);
      expect(res.body).toHaveProperty('status', 'closed');
    });

    it('rejects empty body', async () => {
      const app = buildApp();
      const res = await request(app)
        .patch('/booking/inquiries/1')
        .send({})
        .expect(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('code', 'BAD_REQUEST');
    });

    it('rejects invalid status value', async () => {
      const app = buildApp();
      const res = await request(app)
        .patch('/booking/inquiries/1')
        .send({ status: 'invalid_status' })
        .expect(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('code', 'BAD_REQUEST');
    });
  });

  describe('POST /booking/inquiries', () => {
    it('creates a new inquiry', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/booking/inquiries')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test inquiry message',
        })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.inquiryId).toBe(99);
    });
  });
});
