import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted before route import
// ---------------------------------------------------------------------------

type Captured = {
  insertedValues: Record<string, unknown> | null;
  updatedValues: Record<string, unknown> | null;
};
const captured: Captured = { insertedValues: null, updatedValues: null };

const advisoryClientRows = [
  { externalId: 'meridian-tech', name: 'Meridian Technologies', industry: 'Technology', sortOrder: 1 },
  { externalId: 'northwind', name: 'Northwind Logistics', industry: 'Logistics', sortOrder: 2 },
];

const knowledgeRows = [
  { id: 1, type: 'case-study', title: 'Tech Pricing Overhaul', description: 'Pricing reset',
    tags: ['pricing'], industries: ['Technology'], uses: 12, isSeeded: true, organizationId: null },
  { id: 2, type: 'framework', title: 'Logistics Network Reset', description: 'Network design',
    tags: ['ops'], industries: ['Logistics'], uses: 9, isSeeded: true, organizationId: null },
  { id: 3, type: 'playbook', title: 'Generic Playbook', description: 'Generic',
    tags: [], industries: ['Other'], uses: 3, isSeeded: true, organizationId: null },
];

vi.mock('@szl-holdings/db', () => {
  const carlotaAdvisoryClientsTable = { externalId: 'externalId', name: 'name',
    industry: 'industry', sortOrder: 'sortOrder' };
  const carlotaKnowledgeItemsTable = { id: 'id', type: 'type', industries: 'industries',
    isSeeded: 'isSeeded', organizationId: 'organizationId', uses: 'uses' };
  const carlotaProposalDraftsTable = { id: 'id', organizationId: 'organizationId',
    createdByUserId: 'createdByUserId', updatedAt: 'updatedAt' };

  let lastFromTable: unknown = null;
  let proposalById: Record<number, Record<string, unknown>> = {
    42: {
      id: 42,
      organizationId: null,
      createdByUserId: 1,
      clientExternalId: null,
      title: 'Existing',
      prospectName: '',
      prospectCompany: '',
      template: 'standard',
      formData: {},
      generatedProposal: null,
      status: 'draft',
    },
  };

  const makeSelect = () => {
    const chain: Record<string, unknown> = {};
    let pendingTable: unknown = null;
    const resolve = () => {
      if (pendingTable === carlotaAdvisoryClientsTable) {
        return Promise.resolve(advisoryClientRows.map((r) => ({
          externalId: r.externalId, name: r.name, industry: r.industry,
        })));
      }
      if (pendingTable === carlotaKnowledgeItemsTable) {
        return Promise.resolve(knowledgeRows);
      }
      if (pendingTable === carlotaProposalDraftsTable) {
        return Promise.resolve(Object.values(proposalById));
      }
      return Promise.resolve([]);
    };
    const makeThenable = () => {
      chain.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
        resolve().then(onF, onR);
    };
    chain.from = (table: unknown) => {
      pendingTable = table; lastFromTable = table; makeThenable(); return chain;
    };
    chain.where = () => { makeThenable(); return chain; };
    chain.orderBy = () => { makeThenable(); return chain; };
    chain.limit = () => resolve();
    return chain;
  };

  const db = {
    select: () => makeSelect(),
    insert: () => ({
      values: (vals: Record<string, unknown>) => ({
        returning: () => {
          captured.insertedValues = vals;
          const row = { id: 999, ...vals };
          proposalById[999] = row as typeof proposalById[number];
          return Promise.resolve([row]);
        },
      }),
    }),
    update: () => ({
      set: (vals: Record<string, unknown>) => ({
        where: () => ({
          returning: () => {
            captured.updatedValues = vals;
            const merged = { ...proposalById[42], ...vals };
            proposalById[42] = merged;
            return Promise.resolve([merged]);
          },
        }),
      }),
    }),
    delete: () => ({ where: () => Promise.resolve() }),
    // Expose for assertions
    __lastFromTable: () => lastFromTable,
  };

  return {
    db,
    carlotaAdvisoryClientsTable,
    carlotaClientCompetitorsTable: {},
    carlotaClientMarginHistoryTable: {},
    carlotaClientMarketTrendTable: {},
    carlotaClientProfilesTable: {},
    carlotaClientRadarSignalsTable: {},
    carlotaClientRoiBenchmarksTable: {},
    carlotaClientRoiTrendTable: {},
    carlotaDiagnosticsTable: {},
    carlotaEngagementsTable: {},
    carlotaExpertsTable: {},
    carlotaInquiriesTable: {},
    carlotaKnowledgeItemsTable,
    carlotaProposalDraftsTable,
    carlotaRadarCompetitorsTable: {},
    carlotaRadarNotifPrefsTable: {},
    carlotaRadarSeenSignalsTable: {},
    carlotaReservationsTable: {},
    carlotaScenariosTable: {},
    carlotaServicesTable: {},
    clientAccountsTable: {},
    clientDocumentsTable: {},
    clientMessagesTable: {},
    clientUpdatesTable: {},
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

const app = express();
app.use(express.json());
app.use('/api', carlotaRouter);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /carlota/proposals/clients', () => {
  it('returns advisory clients for autopopulate dropdown', async () => {
    const res = await request(app).get('/api/carlota/proposals/clients');
    expect(res.status).toBe(200);
    const clients = (res.body as { clients: { externalId: string; name: string }[] }).clients;
    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBe(2);
    expect(clients[0]).toMatchObject({ externalId: 'meridian-tech', name: 'Meridian Technologies' });
  });
});

describe('GET /carlota/proposals/knowledge-suggestions', () => {
  it('returns up to 2 industry-matched knowledge items', async () => {
    const res = await request(app)
      .get('/api/carlota/proposals/knowledge-suggestions')
      .query({ industry: 'Technology' });
    expect(res.status).toBe(200);
    const items = (res.body as { items: { title: string }[] }).items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(2);
    expect(items.some((i) => i.title === 'Tech Pricing Overhaul')).toBe(true);
  });

  it('falls back to case-study/framework items when industry has no match', async () => {
    const res = await request(app)
      .get('/api/carlota/proposals/knowledge-suggestions')
      .query({ industry: 'Aerospace' });
    expect(res.status).toBe(200);
    const items = (res.body as { items: { type: string }[] }).items;
    expect(items.length).toBeLessThanOrEqual(2);
    for (const it of items) {
      expect(['case-study', 'framework']).toContain(it.type);
    }
  });
});

describe('POST /carlota/proposals — clientExternalId persistence', () => {
  it('persists clientExternalId on create', async () => {
    captured.insertedValues = null;
    const res = await request(app)
      .post('/api/carlota/proposals')
      .send({
        title: 'Meridian — Growth Strategy',
        prospectName: 'Sarah Williams',
        prospectCompany: 'Meridian Technologies',
        clientExternalId: 'meridian-tech',
        template: 'standard',
        status: 'draft',
        formData: { industry: 'Technology' },
      });
    expect(res.status).toBe(201);
    expect(captured.insertedValues?.clientExternalId).toBe('meridian-tech');
    expect((res.body as { clientExternalId: string }).clientExternalId).toBe('meridian-tech');
  });

  it('defaults clientExternalId to null when omitted', async () => {
    captured.insertedValues = null;
    const res = await request(app)
      .post('/api/carlota/proposals')
      .send({ title: 'Cold lead', formData: {} });
    expect(res.status).toBe(201);
    expect(captured.insertedValues?.clientExternalId).toBeNull();
  });
});

describe('PUT /carlota/proposals/:id — clientExternalId update', () => {
  it('updates clientExternalId when provided', async () => {
    captured.updatedValues = null;
    const res = await request(app)
      .put('/api/carlota/proposals/42')
      .send({ clientExternalId: 'northwind' });
    expect(res.status).toBe(200);
    expect(captured.updatedValues?.clientExternalId).toBe('northwind');
  });

  it('clears clientExternalId when null is sent explicitly', async () => {
    captured.updatedValues = null;
    const res = await request(app)
      .put('/api/carlota/proposals/42')
      .send({ clientExternalId: null });
    expect(res.status).toBe(200);
    expect(captured.updatedValues?.clientExternalId).toBeNull();
  });
});
