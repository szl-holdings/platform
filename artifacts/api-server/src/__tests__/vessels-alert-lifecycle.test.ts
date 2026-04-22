import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const captured: {
  insertedAlert: Record<string, unknown> | null;
  updatedAlert: Record<string, unknown> | null;
} = { insertedAlert: null, updatedAlert: null };

const seed = {
  vessels: [{ id: 11, orgId: 7, name: 'Org Vessel' }],
  alerts: [
    {
      id: 100,
      vesselId: 11,
      title: 'Existing',
      message: '',
      severity: 'medium',
      status: 'active',
      metadata: null,
      triggeredAt: new Date(),
      resolvedAt: null,
    },
  ],
};

vi.mock('@szl-holdings/db', () => {
  const vesselsTable = { id: 'id', orgId: 'orgId' };
  const vesselsAlertsTable = { id: 'id', vesselId: 'vesselId', status: 'status' };

  const makeSelect = () => {
    let pendingTable: unknown = null;
    const chain: Record<string, unknown> = {};
    const resolve = () => {
      if (pendingTable === vesselsTable) return Promise.resolve(seed.vessels);
      if (pendingTable === vesselsAlertsTable) return Promise.resolve(seed.alerts);
      return Promise.resolve([]);
    };
    const thenable = () => {
      chain.then = (a: (v: unknown) => unknown, b?: (e: unknown) => unknown) =>
        resolve().then(a, b);
    };
    chain.from = (t: unknown) => {
      pendingTable = t;
      thenable();
      return chain;
    };
    chain.where = () => {
      thenable();
      return chain;
    };
    chain.orderBy = () => {
      thenable();
      return chain;
    };
    chain.limit = () => resolve();
    return chain;
  };

  const db = {
    select: () => makeSelect(),
    insert: () => ({
      values: (vals: Record<string, unknown>) => ({
        returning: () => {
          captured.insertedAlert = vals;
          const row = { id: 999, status: 'active', triggeredAt: new Date(), ...vals };
          return Promise.resolve([row]);
        },
      }),
    }),
    update: () => ({
      set: (vals: Record<string, unknown>) => ({
        where: () => ({
          returning: () => {
            captured.updatedAlert = vals;
            const merged = { ...seed.alerts[0], ...vals };
            seed.alerts[0] = merged as typeof seed.alerts[0];
            return Promise.resolve([merged]);
          },
        }),
      }),
    }),
    delete: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
  };

  return {
    db,
    vesselsTable,
    vesselsAlertsTable,
    vesselsAlertRulesTable: {},
    vesselsCargoTable: {},
    vesselsCommandWorkflowsTable: {},
    vesselsEventsTable: {},
    vesselsFleetsTable: {},
    vesselsPositionsTable: {},
    vesselsRoutesTable: {},
    vesselsSimulationsTable: {},
    vesselsWeatherSnapshotsTable: {},
    insertVesselAlertRuleSchema: { parse: (v: unknown) => v },
    insertVesselAlertSchema: { parse: (v: unknown) => v },
    insertVesselCommandWorkflowSchema: { parse: (v: unknown) => v },
    insertVesselFleetSchema: { parse: (v: unknown) => v, partial: () => ({ parse: (v: unknown) => v }) },
    insertVesselRouteSchema: { parse: (v: unknown) => v },
    insertVesselSchema: { parse: (v: unknown) => v, partial: () => ({ parse: (v: unknown) => v }) },
    insertVesselSimulationSchema: { parse: (v: unknown) => v },
    insertVesselsExceptionEventSchema: { parse: (v: unknown) => v },
  };
});

vi.mock('../middlewares/auth', () => ({
  authMiddleware: () => (req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = { id: 1, roles: ['admin'], orgs: [{ orgId: 7 }] };
    next();
  },
  parseIdParam: (raw: string) => {
    const n = parseInt(String(raw), 10);
    return Number.isNaN(n) ? 0 : n;
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../middlewares/tenant-scope', () => ({
  tenantScope: () => (req: { tenantOrgId?: number }, _res: unknown, next: () => void) => {
    req.tenantOrgId = 7;
    next();
  },
}));

vi.mock('../lib/validation', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../lib/validation');
  return {
    ...actual,
    validateBody: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    validateQuery: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  };
});

vi.mock('../lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn(async () => {}) },
  VESSELS_EVENTS: { POSITION_UPDATED: 'x' },
}));

const { default: vesselsRouter } = await import('../routes/vessels.js');

const app = express();
app.use(express.json());
app.use('/api', vesselsRouter);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /vessels/alerts — dark-vessel raise alert', () => {
  it('persists a dark-vessel alert with severity + metadata for org-owned vessel', async () => {
    captured.insertedAlert = null;
    const res = await request(app)
      .post('/api/vessels/alerts')
      .send({
        vesselId: 11,
        title: 'Dark Vessel: PACIFIC MERIDIAN (IMO 9821045)',
        message: 'Suspicion 94/100 — AIS disabled.',
        severity: 'critical',
        status: 'active',
        metadata: { source: 'dark-vessel-detection', suspicionScore: 94 },
      });
    expect(res.status).toBe(201);
    expect(captured.insertedAlert).toMatchObject({
      vesselId: 11,
      severity: 'critical',
      status: 'active',
    });
    const meta = captured.insertedAlert?.metadata as { source: string };
    expect(meta.source).toBe('dark-vessel-detection');
  });

});

describe('PATCH /vessels/alerts/:id — alert lifecycle', () => {
  it('transitions alert from active → acknowledged', async () => {
    captured.updatedAlert = null;
    const res = await request(app)
      .patch('/api/vessels/alerts/100')
      .send({ status: 'acknowledged' });
    expect(res.status).toBe(200);
    expect(captured.updatedAlert?.status).toBe('acknowledged');
    expect(captured.updatedAlert?.resolvedAt).toBeUndefined();
  });

  it('transitions alert to resolved and stamps resolvedAt', async () => {
    captured.updatedAlert = null;
    const res = await request(app)
      .patch('/api/vessels/alerts/100')
      .send({ status: 'resolved' });
    expect(res.status).toBe(200);
    expect(captured.updatedAlert?.status).toBe('resolved');
    expect(captured.updatedAlert?.resolvedAt).toBeInstanceOf(Date);
  });

  it('returns 400 for invalid status values', async () => {
    const res = await request(app)
      .patch('/api/vessels/alerts/100')
      .send({ status: 'bogus' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_STATUS');
  });

  it('rejects invalid lifecycle transitions (resolved → active)', async () => {
    // seed.alerts[0] is now resolved from the previous test
    const res = await request(app)
      .patch('/api/vessels/alerts/100')
      .send({ status: 'active' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('returns 404 for orphan alerts with null vesselId', async () => {
    seed.alerts[0] = { ...seed.alerts[0], vesselId: null as unknown as number, status: 'active' };
    const res = await request(app)
      .patch('/api/vessels/alerts/100')
      .send({ status: 'acknowledged' });
    expect(res.status).toBe(404);
  });
});
