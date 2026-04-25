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

export default router;
