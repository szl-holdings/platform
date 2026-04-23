/**
 * OT/ICS Triage endpoints — integration tests
 *
 * Tests the acknowledge, false-positive, and open-incident routes
 * using in-memory stores and the real router.
 */

import express, { type IRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface FrameRow {
  id: number;
  frameId: string;
  observedAt: Date;
  protocol: string;
  src: string;
  dst: string;
  assetId: string | null;
  functionLabel: string;
  summary: string;
  severity: string;
  rawHex: string;
  fields: unknown[];
  forensicEventId: string | null;
  conversationSessionId: string | null;
  triageStatus: string;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  incidentRef: string | null;
  createdAt: Date;
}

interface IncidentRow {
  id: number;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  affectedAssets: unknown;
  notes: string | null;
  attackTechnique: string | null;
}

const framesStore: { rows: FrameRow[]; nextId: number } = { rows: [], nextId: 1 };
const incidentsStore: { rows: IncidentRow[]; nextId: number } = { rows: [], nextId: 1 };

function seedFrame(overrides: Partial<FrameRow> = {}): FrameRow {
  const row: FrameRow = {
    id: framesStore.nextId++,
    frameId: overrides.frameId ?? `PKT-TEST-${framesStore.nextId}`,
    observedAt: overrides.observedAt ?? new Date(),
    protocol: overrides.protocol ?? 'Modbus',
    src: overrides.src ?? '10.4.12.18 (HMI-A)',
    dst: overrides.dst ?? '10.4.12.41 (PLC-Boiler-2)',
    assetId: overrides.assetId ?? 'PLC-Boiler-2',
    functionLabel: overrides.functionLabel ?? 'FC=06 Write Single Register',
    summary: overrides.summary ?? 'Write 0x07D0 to register 40021',
    severity: overrides.severity ?? 'critical',
    rawHex: overrides.rawHex ?? '00 19 00 00 00 06 01 06 00 14 07 D0',
    fields: overrides.fields ?? [],
    forensicEventId: overrides.forensicEventId ?? null,
    conversationSessionId: overrides.conversationSessionId ?? null,
    triageStatus: overrides.triageStatus ?? 'open',
    acknowledgedAt: overrides.acknowledgedAt ?? null,
    acknowledgedBy: overrides.acknowledgedBy ?? null,
    incidentRef: overrides.incidentRef ?? null,
    createdAt: overrides.createdAt ?? new Date(),
  };
  framesStore.rows.push(row);
  return row;
}

const makeTable = () =>
  new Proxy({} as Record<string, unknown>, {
    get: (_t, p) => ({ _colName: String(p) }),
  });

const makeSchema = () => ({
  parse: (v: unknown) => v,
  omit: () => ({ parse: (v: unknown) => v }),
});

vi.mock('drizzle-orm', () => {
  const tag =
    (kind: string) =>
    (..._args: unknown[]) => ({ _kind: kind, _args });
  return {
    and: tag('and'),
    or: tag('or'),
    eq: (col: { _colName?: string }, val: unknown) => ({ _kind: 'eq', col: col?._colName, val }),
    asc: tag('asc'),
    desc: tag('desc'),
    gte: tag('gte'),
    lte: tag('lte'),
    sql: tag('sql'),
  };
});

vi.mock('@szl-holdings/db', () => {
  function findFrame(cond: unknown): FrameRow | undefined {
    if (cond && typeof cond === 'object' && '_kind' in cond) {
      const c = cond as { _kind: string; col?: string; val?: unknown };
      if (c._kind === 'eq' && c.col === 'frameId') {
        return framesStore.rows.find((r) => r.frameId === c.val);
      }
    }
    return framesStore.rows[0];
  }

  function makeSelectChain() {
    let matchCond: unknown;
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = (cond: unknown) => {
      matchCond = cond;
      return chain;
    };
    chain.orderBy = () => chain;
    chain.limit = () => {
      const found = findFrame(matchCond);
      return Promise.resolve(found ? [found] : []);
    };
    chain.then = (resolve: (v: unknown[]) => unknown) => {
      const found = findFrame(matchCond);
      return Promise.resolve(found ? [found] : []).then(resolve);
    };
    return chain;
  }

  function makeUpdateChain() {
    let setData: Record<string, unknown> = {};
    let matchCond: unknown;
    const chain: Record<string, unknown> = {};
    chain.set = (data: Record<string, unknown>) => {
      setData = data;
      return chain;
    };
    chain.where = (cond: unknown) => {
      matchCond = cond;
      return chain;
    };
    chain.returning = () => {
      const frame = findFrame(matchCond);
      if (!frame) return Promise.resolve([]);
      Object.assign(frame, setData);
      return Promise.resolve([frame]);
    };
    return chain;
  }

  function makeInsertChain() {
    let insertedValues: Record<string, unknown> = {};
    const chain: Record<string, unknown> = {};
    chain.values = (data: Record<string, unknown> | Record<string, unknown>[]) => {
      insertedValues = Array.isArray(data) ? data[0] : data;
      return chain;
    };
    chain.onConflictDoNothing = () => chain;
    chain.returning = (projection?: Record<string, unknown>) => {
      const row = {
        id: incidentsStore.nextId++,
        ...insertedValues,
      };
      incidentsStore.rows.push(row as unknown as IncidentRow);
      if (projection) {
        const partial: Record<string, unknown> = {};
        for (const key of Object.keys(projection)) {
          partial[key] = (row as Record<string, unknown>)[key];
        }
        return Promise.resolve([partial]);
      }
      return Promise.resolve([row]);
    };
    return chain;
  }

  const mockDb = {
    select: () => makeSelectChain(),
    insert: () => makeInsertChain(),
    update: () => makeUpdateChain(),
    delete: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => {
      const txProxy = {
        select: () => makeSelectChain(),
        insert: () => makeInsertChain(),
        update: () => makeUpdateChain(),
      };
      return fn(txProxy);
    },
  };

  return {
    db: mockDb,
    pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
    otIcsDecodedFramesTable: makeTable(),
    otIcsAssetsTable: makeTable(),
    otIcsConversationsTable: makeTable(),
    otIcsAnomalyScoresTable: makeTable(),
    firestormIncidentsTable: makeTable(),
    insertOtIcsDecodedFrameSchema: makeSchema(),
    insertOtIcsAssetSchema: makeSchema(),
    insertOtIcsConversationSchema: makeSchema(),
    insertOtIcsAnomalyScoreSchema: makeSchema(),
  };
});

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (_shape: unknown) => ({
    parse: (v: unknown) => v,
  }),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
  },
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (_opts?: unknown) => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/seed-guard', () => ({
  guardSeedInProduction: vi.fn(),
}));

vi.mock('../../lib/api-response', () => ({
  sendSuccess: (_res: any, data: unknown) => {
    _res.status(200).json({ success: true, data });
  },
  sendCreated: (_res: any, data: unknown) => {
    _res.status(201).json({ success: true, data });
  },
  handleRouteError: (_res: any, err: unknown, msg: string) => {
    _res.status(500).json({ error: msg, detail: (err as Error)?.message });
  },
}));

vi.mock('../../lib/validation', () => ({
  listQuerySchema: { parse: (v: unknown) => v },
  validateBody:
    (_schema: unknown) => (_req: unknown, _res: unknown, next: () => void) =>
      next(),
  validateQuery:
    (_schema: unknown) => (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));

const { default: otIcsRouter } = await import('../ot-ics.js');

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(otIcsRouter);
  return app;
}

beforeEach(() => {
  framesStore.rows = [];
  framesStore.nextId = 1;
  incidentsStore.rows = [];
  incidentsStore.nextId = 1;
});

describe('POST /aegis/ot-ics/frames/:frameId/acknowledge', () => {
  it('returns 200 and sets triageStatus to acknowledged', async () => {
    const frame = seedFrame({ frameId: 'PKT-ACK-001' });
    const app = buildApp();

    const res = await request(app)
      .post('/aegis/ot-ics/frames/PKT-ACK-001/acknowledge')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.frameId).toBe('PKT-ACK-001');
    expect(res.body.data.triageStatus).toBe('acknowledged');
    expect(frame.triageStatus).toBe('acknowledged');
    expect(frame.acknowledgedAt).toBeInstanceOf(Date);
  });

  it('stores acknowledgedBy when provided', async () => {
    seedFrame({ frameId: 'PKT-ACK-002' });
    const app = buildApp();

    const res = await request(app)
      .post('/aegis/ot-ics/frames/PKT-ACK-002/acknowledge')
      .send({ acknowledgedBy: 'analyst-jane' });

    expect(res.status).toBe(200);
    const frame = framesStore.rows.find((r) => r.frameId === 'PKT-ACK-002');
    expect(frame?.acknowledgedBy).toBe('analyst-jane');
  });

  it('returns 404 for non-existent frame', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/aegis/ot-ics/frames/NONEXISTENT/acknowledge')
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Frame not found');
  });
});

describe('POST /aegis/ot-ics/frames/:frameId/false-positive', () => {
  it('returns 200 and sets triageStatus to false_positive', async () => {
    const frame = seedFrame({ frameId: 'PKT-FP-001' });
    const app = buildApp();

    const res = await request(app)
      .post('/aegis/ot-ics/frames/PKT-FP-001/false-positive')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.frameId).toBe('PKT-FP-001');
    expect(res.body.data.triageStatus).toBe('false_positive');
    expect(frame.triageStatus).toBe('false_positive');
  });

  it('returns 404 for non-existent frame', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/aegis/ot-ics/frames/NONEXISTENT/false-positive')
      .send({});

    expect(res.status).toBe(404);
  });
});

describe('POST /aegis/ot-ics/frames/:frameId/open-incident', () => {
  it('returns 200, creates SOC incident, and sets triageStatus to incident_opened', async () => {
    seedFrame({
      frameId: 'PKT-INC-001',
      severity: 'critical',
      assetId: 'PLC-Boiler-2',
      conversationSessionId: 'INC-2024-0329',
      forensicEventId: 'FE-006',
    });
    const app = buildApp();

    const res = await request(app)
      .post('/aegis/ot-ics/frames/PKT-INC-001/open-incident')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.frameId).toBe('PKT-INC-001');
    expect(res.body.data.triageStatus).toBe('incident_opened');
    expect(res.body.data.socIncidentId).toBeDefined();
    expect(res.body.data.incidentRef).toMatch(/^INC-OT-/);

    expect(incidentsStore.rows.length).toBe(1);
    const incident = incidentsStore.rows[0];
    expect(incident.title).toContain('OT/ICS Anomaly');
    expect(incident.title).toContain('PLC-Boiler-2');
    expect(incident.severity).toBe('critical');
    expect(incident.status).toBe('triage');
  });

  it('uses caller-provided incidentRef when given', async () => {
    seedFrame({ frameId: 'PKT-INC-002' });
    const app = buildApp();

    const res = await request(app)
      .post('/aegis/ot-ics/frames/PKT-INC-002/open-incident')
      .send({ incidentRef: 'CUSTOM-REF-001' });

    expect(res.status).toBe(200);
    expect(res.body.data.incidentRef).toBe('CUSTOM-REF-001');
  });

  it('maps info severity to low in the SOC incident', async () => {
    seedFrame({ frameId: 'PKT-INC-003', severity: 'info' });
    const app = buildApp();

    await request(app)
      .post('/aegis/ot-ics/frames/PKT-INC-003/open-incident')
      .send({});

    expect(incidentsStore.rows[0].severity).toBe('low');
  });

  it('returns 404 for non-existent frame', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/aegis/ot-ics/frames/NONEXISTENT/open-incident')
      .send({});

    expect(res.status).toBe(404);
  });

  it('stores acknowledgedBy on the frame when provided', async () => {
    seedFrame({ frameId: 'PKT-INC-004' });
    const app = buildApp();

    await request(app)
      .post('/aegis/ot-ics/frames/PKT-INC-004/open-incident')
      .send({ acknowledgedBy: 'analyst-bob' });

    const frame = framesStore.rows.find((r) => r.frameId === 'PKT-INC-004');
    expect(frame?.acknowledgedBy).toBe('analyst-bob');
    expect(frame?.triageStatus).toBe('incident_opened');
  });
});
