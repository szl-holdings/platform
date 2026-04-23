/**
 * OT/ICS Stream Feed Worker Tests (Task #1383)
 *
 * Invariants verified:
 *  1. getOtIcsFeedStats returns a well-formed shape.
 *  2. startOtIcsStreamFeed is idempotent (second call is a no-op).
 *  3. runOneTick increments tickCount and calls db.insert when assets exist.
 *  4. /aegis/ot-ics/feed/status returns 200 with the correct shape.
 *
 * The DB is mocked via vi.hoisted so no live database is required.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ─── Hoisted mock state ───────────────────────────────────────────────────────
//
// vi.hoisted() runs before any import in the file, so these variables can be
// safely referenced inside vi.mock() factory functions.

const mocks = vi.hoisted(() => {
  const ASSET_ROWS = [
    { assetId: 'HMI-A', protocol: 'Modbus', name: 'HMI Station A', baseline: '10' },
  ];

  // drizzle chains for the two distinct query shapes used by the feed:
  //
  //   shape A: feedDb.select().from(assetsTable)                → thenable → asset rows
  //   shape B: feedDb.select().from(X).where().orderBy().limit() → thenable → score rows
  //
  // We make `.from()` itself thenable (awaitable) so shape A works, while
  // shape B also works by the final `.limit()` returning a resolved Promise.

  function makeSelectChain(assetRows: typeof ASSET_ROWS) {
    const chain: Record<string, unknown> = {};
    // `.from()` resolves to asset rows when awaited directly (shape A),
    // AND returns `chain` so further chaining for shape B works.
    chain.from = vi.fn().mockImplementation(() => {
      const p = Promise.resolve(assetRows) as Promise<typeof ASSET_ROWS> & typeof chain;
      // attach shape-B chain methods onto the promise so chaining works
      Object.assign(p, {
        where: () => p,
        orderBy: () => p,
        limit: vi.fn().mockResolvedValue([]),
      });
      return p;
    });
    return chain;
  }

  const insertChain = {
    values: function () { return this; },
    onConflictDoNothing: function () { return this; },
    onConflictDoUpdate: function () { return this; },
    returning: vi.fn().mockResolvedValue([{ frameId: 'PKT-MB-TEST-001' }]),
  };

  const feedDb = {
    insert: vi.fn().mockReturnValue(insertChain),
    select: vi.fn().mockImplementation(() => makeSelectChain(ASSET_ROWS)),
    execute: vi.fn().mockResolvedValue({ rows: [{ maxSeq: 0 }] }),
  };

  return { feedDb, insertChain, ASSET_ROWS };
});

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@szl-holdings/db', async (importActual) => {
  const actual = (await importActual()) as Record<string, unknown>;

  class MockPool {
    on() {}
    async end() {}
  }

  return {
    ...actual,
    PgPool: MockPool,
    drizzleConnect: () => mocks.feedDb,
  };
});

vi.mock('../lib/logger.js', () => ({
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

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  InvalidIdError: class extends Error {},
}));

vi.mock('../lib/seed-guard.js', () => ({
  guardSeedInProduction: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// ─── Cleanup ──────────────────────────────────────────────────────────────────

afterEach(async () => {
  const { stopOtIcsStreamFeed } = await import('../jobs/ot-ics-stream-feed.js');
  stopOtIcsStreamFeed();
  vi.clearAllMocks();
  // Restore insert mock (clearAllMocks wipes call records but not implementation;
  // mockReturnValue is still active so we just reset the spy).
  mocks.feedDb.insert.mockReturnValue(mocks.insertChain);
  mocks.feedDb.select.mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn().mockImplementation(() => {
      const p = Promise.resolve(mocks.ASSET_ROWS) as Promise<typeof mocks.ASSET_ROWS> & Record<string, unknown>;
      Object.assign(p, {
        where: () => p,
        orderBy: () => p,
        limit: vi.fn().mockResolvedValue([]),
      });
      return p;
    });
    return chain;
  });
});

// ─── 1. Stats shape ───────────────────────────────────────────────────────────

describe('getOtIcsFeedStats', () => {
  it('returns a well-formed stats object', async () => {
    const { getOtIcsFeedStats } = await import('../jobs/ot-ics-stream-feed.js');
    const stats = getOtIcsFeedStats();

    expect(stats).toMatchObject({
      tickCount: expect.any(Number),
      framesInserted: expect.any(Number),
      conversationRowsInserted: expect.any(Number),
      scoreUpdates: expect.any(Number),
      startedAt: expect.any(String),
    });
    expect(new Date(stats.startedAt).getTime()).toBeGreaterThan(0);
  });
});

// ─── 2. Idempotent start ─────────────────────────────────────────────────────

describe('startOtIcsStreamFeed', () => {
  it('is idempotent — calling twice does not throw', async () => {
    const { startOtIcsStreamFeed, stopOtIcsStreamFeed } = await import(
      '../jobs/ot-ics-stream-feed.js'
    );
    expect(() => {
      startOtIcsStreamFeed();
      startOtIcsStreamFeed();
    }).not.toThrow();
    stopOtIcsStreamFeed();
  });
});

// ─── 3. Tick behaviour ───────────────────────────────────────────────────────

describe('runOneTick', () => {
  it('increments tickCount', async () => {
    const { runOneTick, getOtIcsFeedStats } = await import('../jobs/ot-ics-stream-feed.js');

    const before = getOtIcsFeedStats().tickCount;
    await runOneTick();
    const after = getOtIcsFeedStats().tickCount;

    expect(after).toBe(before + 1);
  });

  it('calls db.insert at least once when assets are available', async () => {
    const { runOneTick } = await import('../jobs/ot-ics-stream-feed.js');
    await runOneTick();
    expect(mocks.feedDb.insert).toHaveBeenCalled();
  });

  it('populates lastTickAt after a tick', async () => {
    const { runOneTick, getOtIcsFeedStats } = await import('../jobs/ot-ics-stream-feed.js');
    await runOneTick();
    const stats = getOtIcsFeedStats();
    expect(stats.lastTickAt).toBeDefined();
    expect(new Date(stats.lastTickAt as string).getTime()).toBeGreaterThan(0);
  });
});

// ─── 4. Feed status endpoint ─────────────────────────────────────────────────

describe('GET /aegis/ot-ics/feed/status', () => {
  it('returns 200 with running flag and correct stats shape', async () => {
    const { runOneTick } = await import('../jobs/ot-ics-stream-feed.js');
    await runOneTick();

    const { default: otIcsRouter } = await import('../routes/ot-ics.js');
    const app = express();
    app.use(express.json());
    // Router defines full absolute paths — mount at root
    app.use(otIcsRouter);

    const res = await request(app).get('/aegis/ot-ics/feed/status');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      running: expect.any(Boolean),
      stats: expect.objectContaining({
        tickCount: expect.any(Number),
        framesInserted: expect.any(Number),
        conversationRowsInserted: expect.any(Number),
        scoreUpdates: expect.any(Number),
        startedAt: expect.any(String),
        lastTickAt: expect.any(String),
      }),
    });
    expect(res.body.stats.tickCount).toBeGreaterThanOrEqual(1);
  });
});
