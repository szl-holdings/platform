/**
 * Lyte Market Indicators — delayed/EOD macro feed endpoint
 *
 * Serves real market data fetched by the Alpha Vantage adapter. When the
 * provider key is absent, returns the built-in seed snapshot with
 * dataQuality='seed' so the UI can surface that context.
 *
 * Routes:
 *   GET  /lyte/market-indicators          — current snapshot (cached)
 *   POST /lyte/market-indicators/refresh  — force re-fetch (rate-limited to
 *                                           1 request per REFRESH_COOLDOWN_MS;
 *                                           returns 429 during cooldown)
 *
 * Mounted in routes/index.ts BEFORE the lyte tenantScope group so these
 * remain public read endpoints (same whitelist pattern as lyte-surfaces.ts).
 */

import { type IRouter, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { getMarketData, invalidateMarketCache } from '../lib/market-data-adapter';
import { authMiddleware } from '../middlewares/auth';
import { writeLimiter } from '../middlewares/rate-limiters';

const router: IRouter = Router();
const noAuth = authMiddleware({ required: false });

const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
let lastRefreshAt = 0;

router.get('/lyte/market-indicators', noAuth, async (_req, res) => {
  try {
    const snapshot = await getMarketData(false);
    sendSuccess(res, {
      ...snapshot,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch market indicators');
  }
});

router.post('/lyte/market-indicators/refresh', writeLimiter, noAuth, async (_req, res) => {
  const now = Date.now();
  const elapsed = now - lastRefreshAt;
  if (elapsed < REFRESH_COOLDOWN_MS) {
    const retryAfterSec = Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000);
    res.setHeader('Retry-After', retryAfterSec.toString());
    res.status(429).json({
      error: 'Too many refresh requests',
      retryAfterSeconds: retryAfterSec,
    });
    return;
  }

  try {
    lastRefreshAt = now;
    invalidateMarketCache();
    const snapshot = await getMarketData(true);
    sendSuccess(res, {
      refreshed: true,
      count: snapshot.indicators.length,
      provider: snapshot.provider,
      refreshedAt: snapshot.refreshedAt,
    });
  } catch (err) {
    lastRefreshAt = 0;
    handleRouteError(res, err, 'Failed to refresh market indicators');
  }
});

// ─── Multi-Feed Adapters (FRED + Yahoo Finance) ───────────────────────────────
//
// GET /lyte/market-feeds         — list all registered feed adapters
// GET /lyte/market-feeds/data    — fetch all configured feed adapters' data
// GET /lyte/market-feeds/:id     — fetch a specific adapter's data (e.g. 'fred')

router.get('/lyte/market-feeds', noAuth, async (_req, res) => {
  try {
    const { marketFeedRegistry } = await import('@szl-holdings/ai-engine/market-data');
    const adapters = marketFeedRegistry.listAdapters();
    res.json({ adapters, count: adapters.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list feed adapters' });
  }
});

router.get('/lyte/market-feeds/data', noAuth, async (req, res) => {
  try {
    const { marketFeedRegistry } = await import('@szl-holdings/ai-engine/market-data');
    const adapterParam = req.query.adapters as string | undefined;
    const adapterIds = adapterParam ? adapterParam.split(',').map((s) => s.trim()) : undefined;
    const data = await marketFeedRegistry.fetchAll(adapterIds);
    res.json({
      ...data,
      fetchedAt: new Date().toISOString(),
      adapterCount: Object.keys(data.byAdapter).length,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch feed data' });
  }
});

router.get('/lyte/market-feeds/:id', noAuth, async (req, res) => {
  try {
    const { marketFeedRegistry } = await import('@szl-holdings/ai-engine/market-data');
    const adapterId = req.params.id as string;
    const adapter = marketFeedRegistry.get(adapterId);
    if (!adapter) {
      res.status(404).json({ error: `Feed adapter '${adapterId}' not found` });
      return;
    }
    const indicators = await adapter.fetch();
    res.json({
      adapterId,
      displayName: adapter.displayName,
      configured: adapter.isConfigured(),
      indicators,
      count: indicators.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch adapter data' });
  }
});

export default router;
