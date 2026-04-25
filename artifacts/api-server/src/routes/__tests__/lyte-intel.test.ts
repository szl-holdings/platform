/**
 * Smoke + integration tests for the lyte-intel router.
 *
 * Verifies:
 *  - All three endpoints (signal-fusion, governance-domains, decision-schemas)
 *    respond 200 with the documented payload shape.
 *  - With an empty database, seed catalogs are returned and dataAvailable is
 *    false (or the live overlay is absent).
 *  - With populated database rows, the live approval queue + violations
 *    overlay replaces the seed defaults in /lyte/governance-domains, and
 *    dataAvailable flips to true.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const _state: {
  signalRows: Array<Record<string, unknown>>;
  actionRows: Array<Record<string, unknown>>;
  incidentRows: Array<Record<string, unknown>>;
} = { signalRows: [], actionRows: [], incidentRows: [] };

vi.mock('@szl-holdings/db', () => {
  const lyteSignalsTable = { _name: 'lyte_signals', receivedAt: { _col: 'received_at' } } as Record<
    string,
    unknown
  >;
  const lyteActionsTable = { _name: 'lyte_actions', createdAt: { _col: 'created_at' } } as Record<
    string,
    unknown
  >;
  const lyteIncidentsTable = {
    _name: 'lyte_incidents',
    createdAt: { _col: 'created_at' },
  } as Record<string, unknown>;

  function makeChain(table: { _name?: string }, projection?: Record<string, unknown>) {
    const isAggregate = !!projection;
    const aggregateResult = (): Array<Record<string, unknown>> => {
      const t = table?._name;
      if (t === 'lyte_actions') {
        const pending = _state.actionRows.filter(
          (r) => r.state === 'new' || r.state === 'assigned',
        ).length;
        const dismissed = _state.actionRows.filter((r) => r.state === 'dismissed').length;
        return [{ pending, total: _state.actionRows.length, dismissed }];
      }
      if (t === 'lyte_signals') {
        return [{ total: _state.signalRows.length, sla: 0 }];
      }
      if (t === 'lyte_incidents') {
        const open = _state.incidentRows.filter(
          (r) => r.status !== 'resolved' && r.status !== 'closed',
        ).length;
        return [{ total: _state.incidentRows.length, open }];
      }
      return [{}];
    };
    const rowsResult = (): Array<Record<string, unknown>> => {
      const t = table?._name;
      if (t === 'lyte_signals') return _state.signalRows;
      if (t === 'lyte_actions') return _state.actionRows;
      if (t === 'lyte_incidents') return _state.incidentRows;
      return [];
    };
    const buildResult = () => (isAggregate ? aggregateResult() : rowsResult());
    const chain: Record<string, unknown> = {};
    chain.from = (t: { _name?: string }) => {
      table = t;
      return chain;
    };
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.groupBy = () => chain;
    chain.limit = () => Promise.resolve(buildResult());
    chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(buildResult()).then(resolve, reject);
    chain.catch = (rej: (e: unknown) => unknown) => Promise.resolve(buildResult()).catch(rej);
    return chain;
  }

  const db = {
    select: (projection?: Record<string, unknown>) => makeChain({}, projection),
  };
  return {
    db,
    lyteSignalsTable,
    lyteActionsTable,
    lyteIncidentsTable,
  };
});

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock('../middlewares/auth', () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

async function buildApp() {
  const mod = await import('../lyte-intel.js');
  const app = express();
  app.use('/api', mod.default);
  return app;
}

describe('lyte-intel router', () => {
  beforeEach(() => {
    _state.signalRows = [];
    _state.actionRows = [];
    _state.incidentRows = [];
  });

  it('GET /api/lyte/signal-fusion returns seed signals when DB empty', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/lyte/signal-fusion');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.signals)).toBe(true);
    expect(res.body.signals.length).toBeGreaterThan(0);
    expect(res.body.dataAvailable).toBe(false);
    expect(typeof res.body.generatedAt).toBe('string');
  });

  it('GET /api/lyte/governance-domains falls back to seed approvalQueue/violations when DB empty', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/lyte/governance-domains');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.domains)).toBe(true);
    expect(res.body.domains.length).toBe(6);
    expect(Array.isArray(res.body.approvalQueue)).toBe(true);
    expect(res.body.approvalQueue.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.violations)).toBe(true);
    expect(res.body.violations.length).toBeGreaterThan(0);
    expect(res.body.dataAvailable).toBe(false);
    // Seed entries have ids prefixed with 'a' / 'v', not 'q' / 'vi'.
    expect(res.body.approvalQueue[0].id.startsWith('a')).toBe(true);
    expect(res.body.violations[0].id.startsWith('v')).toBe(true);
  });

  it('GET /api/lyte/governance-domains overlays live approvalQueue and violations when DB populated', async () => {
    _state.actionRows = [
      {
        id: 101,
        title: 'Investigate Stripe webhook queue delay',
        signalCategory: 'approval_latency',
        state: 'new',
        priority: 'high',
        owner: 'Alex Rivera',
        assignedTo: null,
        dueAt: null,
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
    ];
    _state.incidentRows = [
      {
        id: 202,
        title: 'API gateway latency spike',
        description: 'Intermittent 503 errors on api gateway',
        severity: 'high',
        status: 'open',
        impactArea: 'API Infrastructure',
        rootCause: null,
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
    ];
    _state.signalRows = [{ id: 1 }];

    const app = await buildApp();
    const res = await request(app).get('/api/lyte/governance-domains');
    expect(res.status).toBe(200);
    expect(res.body.dataAvailable).toBe(true);
    expect(res.body.approvalQueue[0].id).toBe('q101');
    expect(res.body.approvalQueue[0].title).toContain('Stripe webhook');
    expect(res.body.approvalQueue[0].domain).toBe('Counsel');
    expect(res.body.violations[0].id).toBe('vi202');
    expect(res.body.violations[0].domain).toBe('API Infrastructure');
    expect(res.body.violations[0].status).toBe('open');
  });

  it('GET /api/lyte/decision-schemas returns schemas with categories', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/lyte/decision-schemas');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.schemas)).toBe(true);
    expect(res.body.schemas.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(typeof res.body.dataAvailable).toBe('boolean');
    // iconKey is a string the client maps to a lucide icon
    expect(typeof res.body.schemas[0].iconKey).toBe('string');
  });
});
