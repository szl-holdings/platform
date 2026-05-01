/**
 * Geo-Intel Pin Persistence — Restart Survival Integration Test (Task #4140)
 *
 * Verifies that POST/PATCH/DELETE mutations against `/api/geo-intel/pins`
 * survive a simulated server restart by:
 *
 *   1. POSTing a new ad-hoc pin and PATCHing an existing baseline pin via
 *      the HTTP API (supertest),
 *   2. DELETEing a baseline pin,
 *   3. Clearing the in-memory store (simulating a process crash),
 *   4. Re-running `hydrateFromDb()` against the same fake DB,
 *   5. Asserting the POSTed pin re-appears with correct values,
 *      the PATCHed pin carries its updated threat level,
 *      and the DELETEd pin is absent.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Fake in-memory "Postgres" — survives store resets (simulated restarts)
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
const pinRows = new Map<string, Row>();

const fakeGeoIntelPinsTable = {
  id: { name: 'id' },
  layer: { name: 'layer' },
  lat: { name: 'lat' },
  lng: { name: 'lng' },
  label: { name: 'label' },
  sublabel: { name: 'sublabel' },
  classification: { name: 'classification' },
  threat: { name: 'threat' },
  stale: { name: 'stale' },
  detailSummary: { name: 'detailSummary' },
  detailSource: { name: 'detailSource' },
  detailTimestamp: { name: 'detailTimestamp' },
  detailConfidence: { name: 'detailConfidence' },
  detailTags: { name: 'detailTags' },
  updatedAt: { name: 'updatedAt' },
  createdAt: { name: 'createdAt' },
};

const fakeSentraIncidentsTable = {};

let lastWhereId: string | undefined;

const fakeDb = {
  select() {
    return {
      from(table: unknown) {
        if (table === fakeGeoIntelPinsTable) {
          return Array.from(pinRows.values());
        }
        return [];
      },
    };
  },
  insert(table: unknown) {
    return {
      values(row: Row | Row[]) {
        const rows = Array.isArray(row) ? row : [row];
        const apply = () => {
          if (table === fakeGeoIntelPinsTable) {
            for (const r of rows) {
              pinRows.set(r.id as string, { ...r });
            }
          }
        };
        return {
          onConflictDoNothing() {
            for (const r of rows) {
              if (table === fakeGeoIntelPinsTable && !pinRows.has(r.id as string)) {
                pinRows.set(r.id as string, { ...r });
              }
            }
            return Promise.resolve();
          },
          onConflictDoUpdate({ set: setData }: { target?: unknown; set?: Row }) {
            apply();
            if (setData && table === fakeGeoIntelPinsTable) {
              for (const r of rows) {
                const id = r.id as string;
                const existing = pinRows.get(id);
                if (existing) {
                  pinRows.set(id, { ...existing, ...setData, id });
                }
              }
            }
            return Promise.resolve();
          },
          returning() {
            return Promise.resolve([]);
          },
        };
      },
    };
  },
  update(table: unknown) {
    return {
      set(data: Row) {
        return {
          where(cond: { _field: string; _value: unknown } | unknown) {
            if (table === fakeGeoIntelPinsTable && lastWhereId) {
              const existing = pinRows.get(lastWhereId);
              if (existing) {
                pinRows.set(lastWhereId, { ...existing, ...data });
              }
              lastWhereId = undefined;
            }
            return Promise.resolve();
          },
        };
      },
    };
  },
  delete(table: unknown) {
    return {
      where(cond: { _field: string; _value: unknown } | unknown) {
        if (table === fakeGeoIntelPinsTable && lastWhereId) {
          pinRows.delete(lastWhereId);
          lastWhereId = undefined;
        }
        return Promise.resolve();
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Mocks — hoisted before any production imports
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => ({
  db: fakeDb,
  geoIntelPinsTable: fakeGeoIntelPinsTable,
  sentraIncidentsTable: fakeSentraIncidentsTable,
  pool: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: (_col: { name: string }, value: unknown) => {
    lastWhereId = value as string;
    return { _field: 'id', _value: value };
  },
  not: () => ({}),
  inArray: () => ({}),
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

vi.mock('../middlewares/auth', () => ({
  authMiddleware:
    () =>
    (req: unknown, _res: unknown, next: () => void) => {
      (req as Record<string, unknown>).user = {
        id: 99,
        email: 'tester@example.com',
        roles: ['member'],
      };
      next();
    },
  denyIfReadOnly: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../services/infrastructure-service', () => ({
  computeStatus: () => ({
    aquilaScore: 100,
    status: 'CLEAR',
    threatLevel: 'CLEAR',
    services: {},
  }),
}));

vi.mock('../services/rf-intel-store', () => ({
  getActiveRfAnomalies: () => [],
}));

// ---------------------------------------------------------------------------
// Imports — after mocks
// ---------------------------------------------------------------------------

const express = (await import('express')).default;
const request = (await import('supertest')).default;

const {
  hydrateFromDb,
  getAllPins,
  _resetForTest,
} = await import('../services/geo-intel-store');

const { default: geoIntelRouter } = await import('../routes/geo-intel');

// ---------------------------------------------------------------------------
// App builder
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(geoIntelRouter);
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(500).json({ error: err.message });
    },
  );
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Geo-Intel Pin Persistence — restart survival', () => {
  beforeEach(async () => {
    pinRows.clear();
    _resetForTest();
    await hydrateFromDb();
  });

  afterEach(() => {
    _resetForTest();
  });

  it('POST, PATCH, and DELETE mutations survive a hydration cycle', async () => {
    const app = buildApp();

    const baselinePins = await getAllPins();
    expect(baselinePins.length).toBe(5);

    const postRes = await request(app)
      .post('/geo-intel/pins')
      .send({
        id: 'geo-adhoc-test-001',
        layer: 'PERSONNEL',
        lat: 51.5074,
        lng: -0.1278,
        label: 'OPERATOR — London',
        sublabel: 'Ad-hoc operator pin',
        classification: 'RESTRICTED',
        threat: 'MEDIUM',
        detail: {
          summary: 'Ad-hoc pin created by operator during incident triage.',
          source: 'Manual Entry',
          timestamp: 'T-00:05',
          confidence: 85,
          tags: ['ADHOC', 'TRIAGE'],
        },
      })
      .expect(201);

    expect(postRes.body.pin).toBeDefined();
    expect(postRes.body.pin.id).toBe('geo-adhoc-test-001');
    expect(postRes.body.pin.threat).toBe('MEDIUM');

    const patchRes = await request(app)
      .patch('/geo-intel/pins/geo-personnel-001')
      .send({ threat: 'HIGH', label: 'EXEC — New York [ESCALATED]' })
      .expect(200);

    expect(patchRes.body.pin).toBeDefined();
    expect(patchRes.body.pin.threat).toBe('HIGH');
    expect(patchRes.body.pin.label).toBe('EXEC — New York [ESCALATED]');

    await request(app).delete('/geo-intel/pins/geo-weather-002').expect(204);

    const pinsBeforeRestart = await getAllPins();
    expect(pinsBeforeRestart.find((p) => p.id === 'geo-adhoc-test-001')).toBeDefined();
    expect(pinsBeforeRestart.find((p) => p.id === 'geo-weather-002')).toBeUndefined();

    _resetForTest();
    await hydrateFromDb();

    const pinsAfterRestart = await getAllPins();

    const adhocPin = pinsAfterRestart.find((p) => p.id === 'geo-adhoc-test-001');
    expect(adhocPin).toBeDefined();
    expect(adhocPin!.layer).toBe('PERSONNEL');
    expect(adhocPin!.lat).toBe(51.5074);
    expect(adhocPin!.lng).toBe(-0.1278);
    expect(adhocPin!.label).toBe('OPERATOR — London');
    expect(adhocPin!.sublabel).toBe('Ad-hoc operator pin');
    expect(adhocPin!.classification).toBe('RESTRICTED');
    expect(adhocPin!.threat).toBe('MEDIUM');

    const patchedPin = pinsAfterRestart.find((p) => p.id === 'geo-personnel-001');
    expect(patchedPin).toBeDefined();
    expect(patchedPin!.threat).toBe('HIGH');
    expect(patchedPin!.label).toBe('EXEC — New York [ESCALATED]');

    const deletedPin = pinsAfterRestart.find((p) => p.id === 'geo-weather-002');
    expect(deletedPin).toBeUndefined();

    expect(pinsAfterRestart.length).toBe(5);
  });

  it('a deleted pin does not reappear after multiple hydration cycles', async () => {
    const app = buildApp();

    const getBeforeDelete = await getAllPins();
    const targetPin = getBeforeDelete.find((p) => p.id === 'geo-personnel-003');
    expect(targetPin).toBeDefined();

    await request(app).delete('/geo-intel/pins/geo-personnel-003').expect(204);

    for (let cycle = 0; cycle < 3; cycle++) {
      _resetForTest();
      await hydrateFromDb();
      const pins = await getAllPins();
      expect(
        pins.find((p) => p.id === 'geo-personnel-003'),
      ).toBeUndefined();
    }
  });

  it('POST 409 when creating a pin with a duplicate ID', async () => {
    const app = buildApp();

    await request(app)
      .post('/geo-intel/pins')
      .send({
        id: 'geo-personnel-001',
        layer: 'PERSONNEL',
        lat: 0,
        lng: 0,
        label: 'Dup',
        sublabel: 'Dup',
        classification: 'OPEN',
        threat: 'NOMINAL',
      })
      .expect(409);
  });

  it('DELETE 404 for a non-existent pin', async () => {
    const app = buildApp();

    await request(app).delete('/geo-intel/pins/does-not-exist').expect(404);
  });

  it('PATCH 404 for a non-existent pin', async () => {
    const app = buildApp();

    await request(app)
      .patch('/geo-intel/pins/does-not-exist')
      .send({ threat: 'HIGH' })
      .expect(404);
  });
});
