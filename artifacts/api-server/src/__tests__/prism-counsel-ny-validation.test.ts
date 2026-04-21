/**
 * Integration tests — Zod validateBody rejects invalid payloads on the five
 * POST mutation routes in prism-counsel-ny.ts (Task #1308).
 *
 * What is tested
 * ──────────────
 * Each of the five POST routes has `validateBody(schema)` as express
 * middleware, which fires BEFORE the handler body runs.  When a required
 * field is absent (or an enum value is invalid) the middleware calls
 * `sendBadRequest` and the response is:
 *
 *   HTTP 400 with JSON body: { error: "Validation error: …", details: { issues: [ … ] } }
 *
 * The tests assert:
 *   - status is 400
 *   - body.error matches /Validation error/i
 *   - body.details.issues is a non-empty array
 *
 * No live database is required — validateBody rejects invalid payloads
 * before any handler code (and therefore any DB call) is reached.  The
 * @szl-holdings/db mock's chain always resolves to [] so that valid-body
 * requests (not tested here) would still short-circuit gracefully.
 *
 * Routes under test
 * ─────────────────
 *   POST /prism-counsel/ny/matters/:matterId/clocks
 *   POST /prism-counsel/ny/matters/:matterId/no-fault-claims
 *   POST /prism-counsel/ny/matters/:matterId/appeals
 *   POST /prism-counsel/ny/matters/:matterId/offer-movements
 *   POST /prism-counsel/ny/matters/:matterId/demand-packets
 */

import type { Router as ExpressRouter } from 'express';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any dynamic imports.
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/observability', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createObservabilityMock();
});

vi.mock('@szl-holdings/db', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createDbMock();
});

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../lib/websocket.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createWebsocketMock();
});

vi.mock('../middlewares/auth.js', async () => {
  const m = await import('./helpers/mocks.js');
  const base = m.createAuthMiddlewareMock();
  return {
    ...base,
    // Override parseIdParam to match the prism-counsel-ny.ts usage:
    // it is called as parseIdParam(req.params.matterId) → number,
    // NOT as route middleware.
    parseIdParam: (raw: string | string[]) => {
      const n = Number(Array.isArray(raw) ? raw[0] : raw);
      if (!Number.isInteger(n) || n <= 0) throw new Error('Invalid ID');
      return n;
    },
  };
});

vi.mock('../lib/ny-forecast-engine.js', () => ({
  runAllForecasts: vi.fn(async () => []),
  runSingleForecast: vi.fn(async () => ({})),
}));

// ---------------------------------------------------------------------------
// Dynamic imports after mocks are in place
// ---------------------------------------------------------------------------

const { default: prismCounselNyRouter } = await import('../routes/prism-counsel-ny.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ValidationErrorBody {
  error: string;
  details?: {
    issues: Array<{ path: (string | number)[]; message: string; code: string }>;
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(prismCounselNyRouter as unknown as ExpressRouter);
  return app;
}

function expectValidationError(body: ValidationErrorBody) {
  expect(body.error).toMatch(/Validation error/i);
  expect(body.details?.issues).toBeDefined();
  expect(Array.isArray(body.details!.issues)).toBe(true);
  expect(body.details!.issues.length).toBeGreaterThan(0);
}

const app = buildApp();
const MATTER_ID = 1;

// ===========================================================================
// POST /prism-counsel/ny/matters/:matterId/clocks
// ===========================================================================

describe('POST /prism-counsel/ny/matters/:matterId/clocks — validateBody', () => {
  const url = `/prism-counsel/ny/matters/${MATTER_ID}/clocks`;

  it('returns 400 when body is empty (all required fields missing)', async () => {
    const res = await request(app).post(url).send({});
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when clockType is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ startedAt: '2025-01-01', deadlineAt: '2025-06-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when startedAt is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ clockType: 'statute_of_limitations', deadlineAt: '2025-06-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when deadlineAt is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ clockType: 'statute_of_limitations', startedAt: '2025-01-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when clockType is an empty string', async () => {
    const res = await request(app)
      .post(url)
      .send({ clockType: '', startedAt: '2025-01-01', deadlineAt: '2025-06-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when body is a JSON array instead of an object', async () => {
    const res = await request(app)
      .post(url)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify([{ clockType: 'x', startedAt: '2025-01-01', deadlineAt: '2025-06-01' }]));
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });
});

// ===========================================================================
// POST /prism-counsel/ny/matters/:matterId/no-fault-claims
// ===========================================================================

describe('POST /prism-counsel/ny/matters/:matterId/no-fault-claims — validateBody', () => {
  const url = `/prism-counsel/ny/matters/${MATTER_ID}/no-fault-claims`;

  it('returns 400 when body is empty (all required fields missing)', async () => {
    const res = await request(app).post(url).send({});
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when claimantName is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ dateOfLoss: '2024-11-15' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when dateOfLoss is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ claimantName: 'John Doe' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when claimantName is an empty string', async () => {
    const res = await request(app)
      .post(url)
      .send({ claimantName: '', dateOfLoss: '2024-11-15' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when body is a JSON array instead of an object', async () => {
    const res = await request(app)
      .post(url)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify([{ claimantName: 'Jane', dateOfLoss: '2024-11-15' }]));
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });
});

// ===========================================================================
// POST /prism-counsel/ny/matters/:matterId/appeals
// ===========================================================================

describe('POST /prism-counsel/ny/matters/:matterId/appeals — validateBody', () => {
  const url = `/prism-counsel/ny/matters/${MATTER_ID}/appeals`;

  it('returns 400 when body is empty (all required fields missing)', async () => {
    const res = await request(app).post(url).send({});
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when appealType is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ filedAt: '2025-03-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when filedAt is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ appealType: 'internal' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when appealType is an empty string', async () => {
    const res = await request(app)
      .post(url)
      .send({ appealType: '', filedAt: '2025-03-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when denialId is not a positive integer', async () => {
    const res = await request(app)
      .post(url)
      .send({ appealType: 'internal', filedAt: '2025-03-01', denialId: -5 });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when body is a JSON array instead of an object', async () => {
    const res = await request(app)
      .post(url)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify([{ appealType: 'internal', filedAt: '2025-03-01' }]));
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });
});

// ===========================================================================
// POST /prism-counsel/ny/matters/:matterId/offer-movements
// ===========================================================================

describe('POST /prism-counsel/ny/matters/:matterId/offer-movements — validateBody', () => {
  const url = `/prism-counsel/ny/matters/${MATTER_ID}/offer-movements`;

  it('returns 400 when body is empty (all required fields missing)', async () => {
    const res = await request(app).post(url).send({});
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when offerType is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ amount: 50000, offeredAt: '2025-04-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when amount is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ offerType: 'demand', offeredAt: '2025-04-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when offeredAt is missing', async () => {
    const res = await request(app)
      .post(url)
      .send({ offerType: 'demand', amount: 50000 });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when offerType is not a valid enum value', async () => {
    const res = await request(app)
      .post(url)
      .send({ offerType: 'invalid_type', amount: 50000, offeredAt: '2025-04-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await request(app)
      .post(url)
      .send({ offerType: 'demand', amount: -1000, offeredAt: '2025-04-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when amount is zero', async () => {
    const res = await request(app)
      .post(url)
      .send({ offerType: 'offer', amount: 0, offeredAt: '2025-04-01' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when body is a JSON array instead of an object', async () => {
    const res = await request(app)
      .post(url)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify([{ offerType: 'demand', amount: 50000, offeredAt: '2025-04-01' }]));
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });
});

// ===========================================================================
// POST /prism-counsel/ny/matters/:matterId/demand-packets
// ===========================================================================

describe('POST /prism-counsel/ny/matters/:matterId/demand-packets — validateBody', () => {
  const url = `/prism-counsel/ny/matters/${MATTER_ID}/demand-packets`;

  it('returns 400 when body is empty (recipientName missing)', async () => {
    const res = await request(app).post(url).send({});
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when recipientName is an empty string', async () => {
    const res = await request(app)
      .post(url)
      .send({ recipientName: '' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when recipientType is not a valid enum value', async () => {
    const res = await request(app)
      .post(url)
      .send({ recipientName: 'Acme Insurance', recipientType: 'unknown_party' });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when demandAmount is negative', async () => {
    const res = await request(app)
      .post(url)
      .send({ recipientName: 'Acme Insurance', demandAmount: -500 });
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });

  it('returns 400 when body is a JSON array instead of an object', async () => {
    const res = await request(app)
      .post(url)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify([{ recipientName: 'Acme Insurance' }]));
    expect(res.status).toBe(400);
    expectValidationError(res.body as ValidationErrorBody);
  });
});
