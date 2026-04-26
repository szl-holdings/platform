/**
 * Integration tests for the Metered Billing layer (Task #2963).
 *
 * Covers:
 *  1. Meter admin CRUD (POST/GET/PUT/DELETE /metering/meters)
 *  2. High-level ingestion endpoint (/metering/ingest) — idempotency, quota
 *  3. Usage dashboard (/metering/dashboard) — real & demo modes
 *  4. Admin corrections (/metering/corrections) — audit trace, synthetic event
 *  5. Meter allotments (/metering/allotments) — upsert semantics
 *  6. Stripe usage record submission (/metering/stripe/submit-usage) — dry-run
 *  7. Aggregation rollup — period totals reflect ingested events
 *
 * Response shape reference (from api-response.ts):
 *  sendSuccess(res, data)         → res.body === data   (no wrapper)
 *  sendBadRequest(res, msg)       → res.status(400), res.body.error === msg
 *  sendNotFound(res, 'X')        → res.status(404), res.body.error === 'X not found'
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── DB mock infrastructure ───────────────────────────────────────────────────

type DbRow = Record<string, unknown>;

interface InsertCall { table: unknown; values: DbRow | DbRow[] }
interface UpdateCall { table: unknown; set: DbRow }

const insertCalls: InsertCall[] = [];
const updateCalls: UpdateCall[] = [];

// Sentinel table identities
const METERS_TABLE          = { __tableName: 'billing_meters' };
const EVENTS_TABLE          = { __tableName: 'metering_events' };
const CORRECTIONS_TABLE     = { __tableName: 'metering_corrections' };
const ALLOTMENTS_TABLE      = { __tableName: 'billing_meter_allotments' };
const AGGREGATES_TABLE      = { __tableName: 'usage_aggregates' };
const THRESHOLD_NOTIF_TABLE = { __tableName: 'usage_threshold_notifications' };
const ORGS_TABLE            = { __tableName: 'organizations' };
const SUBS_TABLE            = { __tableName: 'subscriptions' };

let nextId = 1000;

function createMockMeter(overrides: DbRow = {}): DbRow {
  return {
    id: nextId++,
    key: 'lyte.decision_runs',
    displayName: 'Lyte Decision Runs',
    unit: 'run',
    aggregation: 'sum',
    billingWindow: 'month',
    pricingModel: 'per_unit',
    includedUnits: '1000',
    unitAmount: '0.01',
    stripePriceId: null,
    stripeMeterId: null,
    product: 'lyte',
    isActive: true,
    description: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Single stable mock db object — we only mutate methods, never reassign the reference.
// This is critical: ESM live bindings mean the route module captures the reference
// at import time; reassigning `mockDb` in tests would be invisible to the handler.
const mockDb = {
  select: vi.fn(),
  selectDistinct: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

function resetDbMocks() {
  insertCalls.length = 0;
  updateCalls.length = 0;
  nextId = 1000;

  // Clear all queued mockReturnValueOnce values and call history
  mockDb.select.mockReset();
  mockDb.selectDistinct.mockReset();
  mockDb.insert.mockReset();
  mockDb.update.mockReset();
  mockDb.delete.mockReset();

  mockDb.selectDistinct.mockImplementation(() => ({
    from: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })),
  }));

  mockDb.select.mockImplementation(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => Promise.resolve([])),
        limit: vi.fn(() => Promise.resolve([])),
      })),
      orderBy: vi.fn(() => Promise.resolve([])),
      innerJoin: vi.fn(() => Promise.resolve([])),
    })),
  }));

  mockDb.insert.mockImplementation((table: unknown) => ({
    values: vi.fn((vals: DbRow | DbRow[]) => {
      insertCalls.push({ table, values: vals });
      const row = Array.isArray(vals) ? vals[0] : vals;
      const newRow = { ...row, id: nextId++ };
      return {
        returning: vi.fn(() => Promise.resolve([newRow])),
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newRow])),
        })),
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([newRow])),
        })),
      };
    }),
  }));

  mockDb.update.mockImplementation((table: unknown) => ({
    set: vi.fn((vals: DbRow) => {
      updateCalls.push({ table, set: vals });
      return {
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ ...vals, id: nextId++ }])),
        })),
      };
    }),
  }));

  mockDb.delete.mockImplementation(() => ({
    where: vi.fn(() => Promise.resolve({ rowCount: 1 })),
  }));
}

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@szl-holdings/db', () => ({
  db: mockDb,
  billingMetersTable: METERS_TABLE,
  billingMeterAllotmentsTable: ALLOTMENTS_TABLE,
  meteringEventsTable: EVENTS_TABLE,
  meteringCorrectionsTable: CORRECTIONS_TABLE,
  usageAggregatesTable: AGGREGATES_TABLE,
  usageThresholdNotificationsTable: THRESHOLD_NOTIF_TABLE,
  organizationsTable: ORGS_TABLE,
  subscriptionsTable: SUBS_TABLE,
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const recomputeAggregateMock = vi.fn(() => Promise.resolve());
const computeBillableQtyMock = vi.fn(() => Promise.resolve(0));

vi.mock('../routes/metering/shared', () => ({
  recomputeAggregate: recomputeAggregateMock,
  computeBillableQty: computeBillableQtyMock,
  periodBounds: vi.fn((period = 'month', ref = new Date()) => {
    const y = ref.getUTCFullYear();
    const m = ref.getUTCMonth();
    return {
      start: new Date(Date.UTC(y, m, 1)),
      end: new Date(Date.UTC(y, m + 1, 1)),
    };
  }),
  meteringRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
  checkAndEnforceQuota: vi.fn(() => Promise.resolve({ allowed: true })),
  computeCharge: vi.fn(() => 0),
}));

vi.mock('../middlewares/auth', () => ({
  authMiddleware: vi.fn(
    () =>
      (req: Record<string, unknown>, _res: unknown, next: () => void) => {
        req.isInternalAgent = true;
        next();
      },
  ),
  requireRole: vi.fn(
    (..._roles: string[]) => (_req: unknown, _res: unknown, next: () => void) => next(),
  ),
  parseIdParam: vi.fn((p: string) => parseInt(p, 10)),
}));

// ─── App factory ─────────────────────────────────────────────────────────────

let _app: express.Express | null = null;

async function getApp() {
  if (_app) return _app;
  const { register } = await import('../routes/metering/metered-billing.js');
  const app = express();
  app.use(express.json());
  const router = express.Router() as unknown as ExpressRouter;
  register(router as ExpressRouter);
  app.use(router);
  _app = app;
  return _app;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Mock a single `.select().from().where().limit()` call to return `result`
function mockSelectOnce(result: unknown) {
  mockDb.select.mockReturnValueOnce({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => Promise.resolve(result)),
        limit: vi.fn(() => Promise.resolve(result)),
      })),
      orderBy: vi.fn(() => Promise.resolve(result)),
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(result)),
      })),
    })),
  });
}

// Mock a `.select().from().where()` that resolves directly (no further chaining)
function mockSelectWhereDirect(result: unknown) {
  mockDb.select.mockReturnValueOnce({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(result)),
      innerJoin: vi.fn(() => Promise.resolve(result)),
    })),
  });
}

// Mock a `.select().from().innerJoin()` call
function mockSelectInnerJoin(result: unknown) {
  mockDb.select.mockReturnValueOnce({
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => Promise.resolve(result)),
    })),
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Meter Admin CRUD', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetDbMocks();
    recomputeAggregateMock.mockClear();
    app = await getApp();
  });

  describe('GET /metering/meters', () => {
    it('returns an array (empty when no meters exist)', async () => {
      const res = await request(app).get('/metering/meters').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns meters when they exist', async () => {
      const meter = createMockMeter({ product: 'lyte' });
      mockSelectOnce([meter]);

      const res = await request(app).get('/metering/meters?product=lyte').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /metering/meters', () => {
    it('creates a meter with required fields and returns 201', async () => {
      await request(app)
        .post('/metering/meters')
        .send({
          key: 'test.runs',
          displayName: 'Test Runs',
          unit: 'run',
          aggregation: 'sum',
          billingWindow: 'month',
          pricingModel: 'per_unit',
          includedUnits: 500,
          product: 'test',
        })
        .expect(201);

      expect(insertCalls.some((c) => c.table === METERS_TABLE)).toBe(true);
    });

    it('rejects invalid meter key format (spaces/special chars)', async () => {
      await request(app)
        .post('/metering/meters')
        .send({ key: 'Invalid Key With Spaces!', displayName: 'Bad Meter' })
        .expect(400);
    });

    it('rejects invalid aggregation type', async () => {
      await request(app)
        .post('/metering/meters')
        .send({ key: 'test.meter', displayName: 'Test', aggregation: 'invalid_type' })
        .expect(400);
    });

    it('accepts all valid aggregation types', async () => {
      for (const aggregation of ['sum', 'last', 'unique_count']) {
        await request(app)
          .post('/metering/meters')
          .send({ key: `test.${aggregation}.${nextId}`, displayName: 'T', aggregation })
          .expect(201);
      }
    });
  });

  describe('PUT /metering/meters/:id', () => {
    it('updates displayName on existing meter', async () => {
      // existence check
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: 42 }])),
          })),
        })),
      });

      await request(app)
        .put('/metering/meters/42')
        .send({ displayName: 'Updated Name' })
        .expect(200);

      expect(updateCalls.some((c) => c.table === METERS_TABLE)).toBe(true);
    });

    it('returns 404 for an unknown meter id', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });

      const res = await request(app)
        .put('/metering/meters/9999')
        .send({ displayName: 'Ghost' })
        .expect(404);

      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('DELETE /metering/meters/:id (soft delete)', () => {
    it('soft-deletes by setting isActive=false', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([{ id: 42, key: 'lyte.decision_runs' }]),
            ),
          })),
        })),
      });

      const res = await request(app).delete('/metering/meters/42').expect(200);

      expect(res.body.deleted).toBe(true);
      expect(res.body.note).toMatch(/soft delete/i);
      expect(
        updateCalls.some((c) => c.table === METERS_TABLE && c.set.isActive === false),
      ).toBe(true);
    });

    it('returns 404 for an unknown meter', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });

      await request(app).delete('/metering/meters/9999').expect(404);
    });
  });
});

describe('High-Level Usage Event Ingestion (POST /metering/ingest)', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetDbMocks();
    recomputeAggregateMock.mockClear();
    app = await getApp();
  });

  it('records a usage event against a known active meter and returns 201', async () => {
    const meter = createMockMeter();

    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([meter])),
        })),
      })),
    });

    const res = await request(app)
      .post('/metering/ingest')
      .send({ tenantId: 1, meterKey: 'lyte.decision_runs', quantity: 5, idempotencyKey: 'key-001' })
      .expect(201);

    expect(res.body.status).toBe('recorded');
    expect(res.body.meterKey).toBe('lyte.decision_runs');
    expect(res.body.quantity).toBe(5);
    expect(insertCalls.some((c) => c.table === EVENTS_TABLE)).toBe(true);
  });

  it('deduplicates events with the same idempotency key (200 deduplicated)', async () => {
    const meter = createMockMeter();

    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([meter])),
        })),
      })),
    });

    // Simulate conflict → empty returning = deduplicated
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    });

    const res = await request(app)
      .post('/metering/ingest')
      .send({ tenantId: 1, meterKey: 'lyte.decision_runs', quantity: 5, idempotencyKey: 'dup-key' })
      .expect(200);

    expect(res.body.status).toBe('deduplicated');
    expect(res.body.idempotencyKey).toBe('dup-key');
  });

  it('rejects unknown or inactive meter key with 400', async () => {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    });

    const res = await request(app)
      .post('/metering/ingest')
      .send({ tenantId: 1, meterKey: 'unknown.meter', quantity: 1 })
      .expect(400);

    expect(res.body.error).toMatch(/Unknown or inactive meter/);
  });

  it('rejects non-positive quantity values', async () => {
    await request(app)
      .post('/metering/ingest')
      .send({ tenantId: 1, meterKey: 'lyte.decision_runs', quantity: -5 })
      .expect(400);
  });

  it('accepts string tenantId (coerced to number)', async () => {
    const meter = createMockMeter();

    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([meter])),
        })),
      })),
    });

    const res = await request(app)
      .post('/metering/ingest')
      .send({ tenantId: '1', meterKey: 'lyte.decision_runs', quantity: 1 })
      .expect(201);

    expect(res.body.tenantId).toBe(1);
  });

  it('accepts dimensions and metadata pass-through', async () => {
    const meter = createMockMeter();

    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([meter])),
        })),
      })),
    });

    const res = await request(app)
      .post('/metering/ingest')
      .send({
        tenantId: 1,
        meterKey: 'lyte.decision_runs',
        quantity: 1,
        dimensions: { region: 'us-east-1', model: 'gpt-4o' },
        metadata: { requestId: 'req_abc123' },
      })
      .expect(201);

    expect(res.body.status).toBe('recorded');
    expect(insertCalls.some((c) => c.table === EVENTS_TABLE)).toBe(true);
  });
});

describe('Usage Dashboard (GET /metering/dashboard)', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetDbMocks();
    app = await getApp();
  });

  it('returns demo data when demo=true is provided', async () => {
    mockSelectOnce([createMockMeter()]);

    const res = await request(app).get('/metering/dashboard?demo=true').expect(200);
    expect(res.body.demoMode).toBe(true);
    expect(Array.isArray(res.body.meters)).toBe(true);
  });

  it('returns demo data when no orgId is provided', async () => {
    mockSelectOnce([createMockMeter()]);

    const res = await request(app).get('/metering/dashboard').expect(200);
    expect(res.body.demoMode).toBe(true);
  });

  it('demo meter rows contain expected usage shape', async () => {
    mockSelectOnce([createMockMeter({ includedUnits: '1000', key: 'lyte.decision_runs' })]);

    const res = await request(app).get('/metering/dashboard?demo=true').expect(200);
    const row = res.body.meters?.[0];
    expect(row).toBeDefined();
    expect(row).toHaveProperty('currentUsage');
    expect(row).toHaveProperty('includedUnits');
    expect(row).toHaveProperty('overage');
    expect(row).toHaveProperty('projectedEop');
    expect(row).toHaveProperty('pctOfAllotment');
  });

  it('returns real data with orgId=1', async () => {
    const meter = createMockMeter({ key: 'sentra.scans', includedUnits: '500' });

    // 1. Active meters: .from().where().orderBy()
    mockSelectOnce([meter]);

    // 2. Subscription lookup: .from(subscriptionsTable).where().limit(1)
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{ planId: 1 }])),
        })),
      })),
    });

    // 3. Promise.all[0] — aggregates: .from(usageAggregatesTable).where(...)
    mockSelectWhereDirect([
      {
        featureKey: 'sentra.scans',
        totalQuantity: '412',
        eventCount: 412,
        computedAt: new Date().toISOString(),
        orgId: 1,
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
      },
    ]);

    // 4. Promise.all[1] — allotments: .from().innerJoin().where()
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    });

    // 5. Corrections: .from().where().orderBy().limit()
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    });

    const res = await request(app).get('/metering/dashboard?orgId=1').expect(200);
    expect(res.body.demoMode).toBe(false);
    expect(res.body.orgId).toBe(1);
    expect(Array.isArray(res.body.meters)).toBe(true);
  });
});

describe('Usage Corrections (POST /metering/corrections)', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetDbMocks();
    recomputeAggregateMock.mockClear();
    app = await getApp();
  });

  it('creates a correction record and injects a synthetic metering event', async () => {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([{ id: 1, key: 'sentra.scans', product: 'sentra' }]),
          ),
        })),
      })),
    });

    await request(app)
      .post('/metering/corrections')
      .send({
        orgId: 1,
        meterKey: 'sentra.scans',
        quantity: -50,
        reasonCode: 'data_correction',
        reason: 'Customer reported double-count',
      })
      .expect(201);

    expect(insertCalls.some((c) => c.table === CORRECTIONS_TABLE)).toBe(true);
    expect(insertCalls.some((c) => c.table === EVENTS_TABLE)).toBe(true);
  });

  it('synthetic event idempotencyKey is tied to the correction id', async () => {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([{ id: 2, key: 'api.calls', product: 'platform' }]),
          ),
        })),
      })),
    });

    await request(app)
      .post('/metering/corrections')
      .send({ orgId: 1, meterKey: 'api.calls', quantity: -10, reasonCode: 'customer_request' })
      .expect(201);

    const evInsert = insertCalls.find((c) => c.table === EVENTS_TABLE);
    expect(evInsert).toBeDefined();
    const vals = evInsert!.values as DbRow;
    expect(String(vals.idempotencyKey)).toMatch(/^correction-/);
  });

  it('rejects corrections for unknown meter keys', async () => {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    });

    const res = await request(app)
      .post('/metering/corrections')
      .send({ orgId: 1, meterKey: 'nonexistent.meter', quantity: -10, reasonCode: 'other' })
      .expect(400);

    expect(res.body.error).toMatch(/Unknown meter/);
  });

  it('accepts positive corrections (promotional credits)', async () => {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([{ id: 3, key: 'api.calls', product: 'platform' }]),
          ),
        })),
      })),
    });

    await request(app)
      .post('/metering/corrections')
      .send({ orgId: 2, meterKey: 'api.calls', quantity: 1000, reasonCode: 'promotional', reason: 'Launch bonus' })
      .expect(201);
  });

  it('validates reasonCode enum — rejects invalid values', async () => {
    await request(app)
      .post('/metering/corrections')
      .send({ orgId: 1, meterKey: 'api.calls', quantity: -5, reasonCode: 'made_up_reason' })
      .expect(400);
  });

  it('triggers recomputeAggregate after applying a correction', async () => {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([{ id: 4, key: 'pulse.briefings', product: 'pulse', aggregation: 'sum' }]),
          ),
        })),
      })),
    });

    await request(app)
      .post('/metering/corrections')
      .send({ orgId: 7, meterKey: 'pulse.briefings', quantity: 5, reasonCode: 'promotional' })
      .expect(201);

    await new Promise((r) => setImmediate(r));
    expect(recomputeAggregateMock).toHaveBeenCalledWith(7, 'pulse.briefings', 'pulse', 'sum');
  });
});

describe('Meter Allotments (POST /metering/allotments)', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetDbMocks();
    app = await getApp();
  });

  it('creates an allotment and returns 201', async () => {
    await request(app)
      .post('/metering/allotments')
      .send({ planId: 10, meterId: 1, includedUnits: 5000, overageUnitAmount: 0.005 })
      .expect(201);

    expect(insertCalls.some((c) => c.table === ALLOTMENTS_TABLE)).toBe(true);
  });

  it('upserts without error on planId+meterId conflict', async () => {
    for (let i = 0; i < 2; i++) {
      await request(app)
        .post('/metering/allotments')
        .send({ planId: 5, meterId: 2, includedUnits: 500 })
        .expect(201);
    }
  });
});

describe('Stripe Usage Record Submission (POST /metering/stripe/submit-usage)', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetDbMocks();
    computeBillableQtyMock.mockClear();
    app = await getApp();
  });

  it('requires orgId — returns 400 without it', async () => {
    const res = await request(app)
      .post('/metering/stripe/submit-usage')
      .send({ dryRun: true })
      .expect(400);

    expect(res.body.error).toMatch(/orgId/i);
  });

  it('returns dry-run results without submitting to Stripe', async () => {
    const meter = createMockMeter({ stripePriceId: 'price_test_123' });

    // 1. Meters with Stripe price
    mockSelectWhereDirect([meter]);

    // 2. Org lookup
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([{ billingCustomerId: 'cus_test_abc' }]),
          ),
        })),
      })),
    });

    // 3. computeBillableQty is called via shared module mock
    computeBillableQtyMock.mockResolvedValueOnce(847);

    const res = await request(app)
      .post('/metering/stripe/submit-usage')
      .send({ orgId: 1, dryRun: true })
      .expect(200);

    expect(res.body.dryRun).toBe(true);
    expect(Array.isArray(res.body.results)).toBe(true);
    const result = res.body.results[0];
    expect(result.stripeSubmitted).toBe(false);
    expect(result.currentUsage).toBe(847);
  });

  it('passes the meter aggregation mode to computeBillableQty', async () => {
    const sumMeter = createMockMeter({ key: 'api.calls', aggregation: 'sum', stripePriceId: 'price_sum' });
    const lastMeter = createMockMeter({ key: 'storage.bytes', aggregation: 'last', stripePriceId: 'price_last' });
    const ucMeter = createMockMeter({ key: 'seats.active', aggregation: 'unique_count', stripePriceId: 'price_uc' });

    // Meters lookup
    mockSelectWhereDirect([sumMeter, lastMeter, ucMeter]);

    // Org lookup — no billingCustomerId → all go dry-run
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{ billingCustomerId: null }])),
        })),
      })),
    });

    // Three calls to computeBillableQty
    computeBillableQtyMock.mockResolvedValueOnce(500); // sum
    computeBillableQtyMock.mockResolvedValueOnce(1024); // last
    computeBillableQtyMock.mockResolvedValueOnce(7);    // unique_count

    await request(app)
      .post('/metering/stripe/submit-usage')
      .send({ orgId: 2, dryRun: true })
      .expect(200);

    // Verify aggregation modes were passed correctly
    expect(computeBillableQtyMock).toHaveBeenCalledTimes(3);
    expect(computeBillableQtyMock.mock.calls[0][4]).toBe('sum');
    expect(computeBillableQtyMock.mock.calls[1][4]).toBe('last');
    expect(computeBillableQtyMock.mock.calls[2][4]).toBe('unique_count');
  });
});

describe('Idempotency guarantees', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetDbMocks();
    recomputeAggregateMock.mockClear();
    app = await getApp();
  });

  it('first ingest returns 201 recorded, second returns 200 deduplicated', async () => {
    const meter = createMockMeter();
    const payload = {
      tenantId: 1,
      meterKey: 'lyte.decision_runs',
      quantity: 1,
      idempotencyKey: 'idem-test-xyz',
    };

    // First call meter lookup
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve([meter])) })),
      })),
    });

    // First insert: new event
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(() =>
            Promise.resolve([{ id: 1, orgId: 1, featureKey: 'lyte.decision_runs' }]),
          ),
        })),
      })),
    });

    // Second call meter lookup
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve([meter])) })),
      })),
    });

    // Second insert: conflict → empty = deduplicated
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    });

    const first = await request(app).post('/metering/ingest').send(payload);
    const second = await request(app).post('/metering/ingest').send(payload);

    expect(first.status).toBe(201);
    expect(first.body.status).toBe('recorded');

    expect(second.status).toBe(200);
    expect(second.body.status).toBe('deduplicated');
  });
});

describe('Aggregation rollup integrity', () => {
  it('recomputeAggregate is called after each successful ingest', async () => {
    resetDbMocks();
    recomputeAggregateMock.mockClear();

    const app = await getApp();
    const meter = createMockMeter({ key: 'agent.compute_mins', product: 'platform' });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve([meter])) })),
      })),
    });

    await request(app)
      .post('/metering/ingest')
      .send({ tenantId: 5, meterKey: 'agent.compute_mins', quantity: 15 })
      .expect(201);

    await new Promise((r) => setImmediate(r));
    expect(recomputeAggregateMock).toHaveBeenCalledWith(5, 'agent.compute_mins', 'platform', 'sum');
  });

  it('recomputeAggregate receives last aggregation mode from meter config', async () => {
    resetDbMocks();
    recomputeAggregateMock.mockClear();

    const app = await getApp();
    const lastMeter = createMockMeter({ key: 'storage.bytes', aggregation: 'last', product: 'platform' });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve([lastMeter])) })),
      })),
    });

    await request(app)
      .post('/metering/ingest')
      .send({ tenantId: 3, meterKey: 'storage.bytes', quantity: 2048 })
      .expect(201);

    await new Promise((r) => setImmediate(r));
    expect(recomputeAggregateMock).toHaveBeenCalledWith(3, 'storage.bytes', 'platform', 'last');
  });

  it('recomputeAggregate receives unique_count aggregation mode from meter config', async () => {
    resetDbMocks();
    recomputeAggregateMock.mockClear();

    const app = await getApp();
    const ucMeter = createMockMeter({ key: 'seats.active', aggregation: 'unique_count', product: 'lyte' });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve([ucMeter])) })),
      })),
    });

    await request(app)
      .post('/metering/ingest')
      .send({ tenantId: 7, meterKey: 'seats.active', quantity: 1 })
      .expect(201);

    await new Promise((r) => setImmediate(r));
    expect(recomputeAggregateMock).toHaveBeenCalledWith(7, 'seats.active', 'lyte', 'unique_count');
  });
});

describe('Corrections path — aggregation mode forwarding', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetDbMocks();
    recomputeAggregateMock.mockClear();
    app = await getApp();
  });

  it('passes aggregation mode from meter row to recomputeAggregate after correction', async () => {
    const lastMeter = createMockMeter({
      key: 'storage.bytes',
      aggregation: 'last',
      product: 'platform',
    });

    // 1. Meter lookup (includes aggregation field)
    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([lastMeter])),
        })),
      })),
    });

    // 2. Correction insert
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 42, orgId: 1, meterKey: 'storage.bytes' }])),
      })),
    });

    // 3. Synthetic event insert
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(() =>
            Promise.resolve([{ id: 100, orgId: 1, featureKey: 'storage.bytes' }]),
          ),
        })),
      })),
    });

    await request(app)
      .post('/metering/corrections')
      .send({
        orgId: 1,
        meterKey: 'storage.bytes',
        quantity: -500,
        reasonCode: 'data_correction',
        reason: 'test correction',
      })
      .expect(201);

    await new Promise((r) => setImmediate(r));
    expect(recomputeAggregateMock).toHaveBeenCalledWith(
      1,
      'storage.bytes',
      'platform',
      'last',
    );
  });

  it('passes unique_count aggregation from corrections meter lookup', async () => {
    const ucMeter = createMockMeter({
      key: 'seats.active',
      aggregation: 'unique_count',
      product: 'lyte',
    });

    mockDb.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([ucMeter])),
        })),
      })),
    });

    mockDb.insert.mockReturnValueOnce({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 43, orgId: 2, meterKey: 'seats.active' }])),
      })),
    });

    mockDb.insert.mockReturnValueOnce({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(() =>
            Promise.resolve([{ id: 101, orgId: 2, featureKey: 'seats.active' }]),
          ),
        })),
      })),
    });

    await request(app)
      .post('/metering/corrections')
      .send({
        orgId: 2,
        meterKey: 'seats.active',
        quantity: -1,
        reasonCode: 'data_correction',
        reason: 'seat correction',
      })
      .expect(201);

    await new Promise((r) => setImmediate(r));
    expect(recomputeAggregateMock).toHaveBeenCalledWith(
      2,
      'seats.active',
      'lyte',
      'unique_count',
    );
  });
});
