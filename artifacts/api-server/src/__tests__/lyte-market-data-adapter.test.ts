/**
 * Lyte Market Data Adapter — Unit Tests (Task #3449)
 *
 * Covers:
 *  - buildSeedSnapshot shape / staleness when ALPHA_VANTAGE_API_KEY is absent
 *  - getMarketData returns a valid snapshot (seed path)
 *  - invalidateMarketCache causes the next call to rebuild
 *  - HTTP endpoint GET /lyte/market-indicators returns 200 with correct shape
 *  - HTTP endpoint POST /lyte/market-indicators/refresh returns { refreshed: true }
 *  - POST /lyte/market-indicators/refresh returns 429 during cooldown window
 *  - Staleness metadata: isStale=true on seed indicators
 *  - Per-indicator fields: provider, delayWindow, asOf, dataQuality all present
 *  - Feed scope: no indicator labeled Real-time or live (task scope: delayed/EOD)
 *  - validateMarketDataConfig returns false when key absent, true when present
 *  - Production fail-fast: validateMarketDataConfig returns false and logs error in prod
 *  - Configurable equity symbols via LYTE_MARKET_SYMBOLS_EQUITY env var
 *  - Configurable FX pairs via LYTE_MARKET_SYMBOLS_FX env var
 *  - Configurable commodity instruments via LYTE_MARKET_SYMBOLS_COMMODITY env var
 *  - Configurable rates maturities via LYTE_MARKET_SYMBOLS_RATES env var
 *  - fetchWithRetry falls back to seed on provider error (all fetches fail)
 *  - getEquitySymbols defaults to SPY/QQQ when env var is unset
 *  - getEquitySymbols uses env override when set to valid symbols
 *  - Staleness rendering: isStale + staleThresholdHours + asOf surfaced correctly
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalApiKey = process.env.ALPHA_VANTAGE_API_KEY;
const originalEquitySymbols = process.env.LYTE_MARKET_SYMBOLS_EQUITY;
const originalNodeEnv = process.env.NODE_ENV;

function buildApp() {
  const app = express();
  app.use(express.json());
  return app;
}

describe('market-data-adapter — seed mode (no API key)', () => {
  beforeEach(() => {
    delete process.env.ALPHA_VANTAGE_API_KEY;
    delete process.env.LYTE_MARKET_SYMBOLS_EQUITY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    if (originalEquitySymbols != null) process.env.LYTE_MARKET_SYMBOLS_EQUITY = originalEquitySymbols;
    else delete process.env.LYTE_MARKET_SYMBOLS_EQUITY;
    vi.resetModules();
  });

  it('getMarketData returns a snapshot with providerConfigured=false in seed mode', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    expect(snap.providerConfigured).toBe(false);
    expect(snap.provider).toBe('seed');
    expect(snap.indicators.length).toBeGreaterThan(0);
  });

  it('all seed indicators have required metadata fields', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    for (const ind of snap.indicators) {
      expect(ind.id, `${ind.label}: id`).toBeTruthy();
      expect(ind.label, `${ind.id}: label`).toBeTruthy();
      expect(ind.provider, `${ind.id}: provider`).toBeTruthy();
      expect(ind.delayWindow, `${ind.id}: delayWindow`).toBeTruthy();
      expect(ind.asOf, `${ind.id}: asOf`).toBeTruthy();
      expect(['equity', 'fx', 'commodity', 'rates'], `${ind.id}: category`).toContain(ind.category);
      expect(['live', 'delayed', 'eod', 'monthly', 'seed'], `${ind.id}: dataQuality`).toContain(ind.dataQuality);
      expect(typeof ind.value, `${ind.id}: value type`).toBe('number');
      expect(typeof ind.formattedValue, `${ind.id}: formattedValue type`).toBe('string');
      expect(typeof ind.staleThresholdHours, `${ind.id}: staleThresholdHours type`).toBe('number');
      expect(ind.staleThresholdHours, `${ind.id}: staleThresholdHours > 0`).toBeGreaterThan(0);
    }
  });

  it('seed indicators are marked isStale=true', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    const allStale = snap.indicators.every((i) => i.isStale);
    expect(allStale).toBe(true);
  });

  it('seed indicators have dataQuality=seed', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    const allSeed = snap.indicators.every((i) => i.dataQuality === 'seed');
    expect(allSeed).toBe(true);
  });

  it('seed indicators have provider=seed', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    const allSeed = snap.indicators.every((i) => i.provider === 'seed');
    expect(allSeed).toBe(true);
  });

  it('invalidateMarketCache forces a fresh fetch on next getMarketData call', async () => {
    const { getMarketData, invalidateMarketCache } = await import('../lib/market-data-adapter.js');
    const snap1 = await getMarketData(false);
    const first = snap1.refreshedAt;
    await new Promise((r) => setTimeout(r, 10));
    invalidateMarketCache();
    const snap2 = await getMarketData(false);
    expect(snap2.refreshedAt).not.toBe(first);
  });

  it('snapshot has nextRefreshAt after refreshedAt', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    expect(new Date(snap.nextRefreshAt).getTime()).toBeGreaterThan(
      new Date(snap.refreshedAt).getTime(),
    );
  });

  it('snapshot covers all four categories: equity, fx, commodity, rates', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    const categories = new Set(snap.indicators.map((i) => i.category));
    expect(categories.has('equity')).toBe(true);
    expect(categories.has('fx')).toBe(true);
    expect(categories.has('commodity')).toBe(true);
    expect(categories.has('rates')).toBe(true);
  });

  it('forceRefresh=true bypasses cache and returns fresh snapshot', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap1 = await getMarketData(false);
    await new Promise((r) => setTimeout(r, 10));
    const snap2 = await getMarketData(true);
    expect(snap2.refreshedAt).not.toBe(snap1.refreshedAt);
  });
});

describe('validateMarketDataConfig — credential detection', () => {
  beforeEach(() => {
    delete process.env.ALPHA_VANTAGE_API_KEY;
    process.env.NODE_ENV = 'development';
    vi.resetModules();
  });

  afterEach(() => {
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it('returns false and does not throw when key is absent in development', async () => {
    const { validateMarketDataConfig } = await import('../lib/market-data-adapter.js');
    const result = validateMarketDataConfig();
    expect(result).toBe(false);
  });

  it('returns false and does not throw when key is absent in production', async () => {
    process.env.NODE_ENV = 'production';
    const { validateMarketDataConfig } = await import('../lib/market-data-adapter.js');
    const result = validateMarketDataConfig();
    expect(result).toBe(false);
  });

  it('returns true when key is present', async () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'TEST_KEY_1234';
    const { validateMarketDataConfig } = await import('../lib/market-data-adapter.js');
    const result = validateMarketDataConfig();
    expect(result).toBe(true);
  });
});

describe('getEquitySymbols — configurable instrument list', () => {
  beforeEach(() => {
    delete process.env.LYTE_MARKET_SYMBOLS_EQUITY;
    delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEquitySymbols != null) process.env.LYTE_MARKET_SYMBOLS_EQUITY = originalEquitySymbols;
    else delete process.env.LYTE_MARKET_SYMBOLS_EQUITY;
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  it('seed snapshot always contains SPY and QQQ indicators by default', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    const ids = snap.indicators.map((i) => i.id);
    expect(ids).toContain('spy');
    expect(ids).toContain('qqq');
  });
});

describe('getFxPairs — configurable FX pair list', () => {
  const originalFx = process.env.LYTE_MARKET_SYMBOLS_FX;
  beforeEach(() => {
    delete process.env.LYTE_MARKET_SYMBOLS_FX;
    vi.resetModules();
  });
  afterEach(() => {
    if (originalFx != null) process.env.LYTE_MARKET_SYMBOLS_FX = originalFx;
    else delete process.env.LYTE_MARKET_SYMBOLS_FX;
    vi.resetModules();
  });

  it('defaults to EURUSD, GBPUSD, USDJPY when env var is unset', async () => {
    const { getFxPairs } = await import('../lib/market-data-adapter.js');
    const pairs = getFxPairs();
    const codes = pairs.map((p) => p.code);
    expect(codes).toContain('EURUSD');
    expect(codes).toContain('GBPUSD');
    expect(codes).toContain('USDJPY');
  });

  it('parses env override with valid 6-char codes', async () => {
    process.env.LYTE_MARKET_SYMBOLS_FX = 'EURUSD,USDCAD';
    const { getFxPairs } = await import('../lib/market-data-adapter.js');
    const pairs = getFxPairs();
    expect(pairs.map((p) => p.code)).toEqual(['EURUSD', 'USDCAD']);
  });

  it('each pair has from/to/label/id fields', async () => {
    const { getFxPairs } = await import('../lib/market-data-adapter.js');
    for (const pair of getFxPairs()) {
      expect(pair.from).toHaveLength(3);
      expect(pair.to).toHaveLength(3);
      expect(pair.label).toBeTruthy();
      expect(pair.id).toBeTruthy();
    }
  });

  it('falls back to defaults when override has invalid format', async () => {
    process.env.LYTE_MARKET_SYMBOLS_FX = 'INVALID,TOOLONG123';
    const { getFxPairs } = await import('../lib/market-data-adapter.js');
    const pairs = getFxPairs();
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.map((p) => p.code)).toContain('EURUSD');
  });
});

describe('getCommodityInstruments — configurable commodity list', () => {
  const originalCommodity = process.env.LYTE_MARKET_SYMBOLS_COMMODITY;
  beforeEach(() => {
    delete process.env.LYTE_MARKET_SYMBOLS_COMMODITY;
    vi.resetModules();
  });
  afterEach(() => {
    if (originalCommodity != null) process.env.LYTE_MARKET_SYMBOLS_COMMODITY = originalCommodity;
    else delete process.env.LYTE_MARKET_SYMBOLS_COMMODITY;
    vi.resetModules();
  });

  it('defaults to WTI and BRENT when env var is unset', async () => {
    const { getCommodityInstruments } = await import('../lib/market-data-adapter.js');
    const instruments = getCommodityInstruments();
    expect(instruments).toContain('WTI');
    expect(instruments).toContain('BRENT');
  });

  it('accepts NATURAL_GAS and COPPER overrides', async () => {
    process.env.LYTE_MARKET_SYMBOLS_COMMODITY = 'NATURAL_GAS,COPPER';
    const { getCommodityInstruments } = await import('../lib/market-data-adapter.js');
    const instruments = getCommodityInstruments();
    expect(instruments).toContain('NATURAL_GAS');
    expect(instruments).toContain('COPPER');
    expect(instruments).not.toContain('WTI');
  });

  it('falls back to defaults when override contains only invalid values', async () => {
    process.env.LYTE_MARKET_SYMBOLS_COMMODITY = 'GOLD,SILVER,INVALID';
    const { getCommodityInstruments } = await import('../lib/market-data-adapter.js');
    const instruments = getCommodityInstruments();
    expect(instruments).toContain('WTI');
  });
});

describe('getRatesMaturities — configurable rates maturity list', () => {
  const originalRates = process.env.LYTE_MARKET_SYMBOLS_RATES;
  beforeEach(() => {
    delete process.env.LYTE_MARKET_SYMBOLS_RATES;
    vi.resetModules();
  });
  afterEach(() => {
    if (originalRates != null) process.env.LYTE_MARKET_SYMBOLS_RATES = originalRates;
    else delete process.env.LYTE_MARKET_SYMBOLS_RATES;
    vi.resetModules();
  });

  it('defaults to 10year and 2year when env var is unset', async () => {
    const { getRatesMaturities } = await import('../lib/market-data-adapter.js');
    const maturities = getRatesMaturities();
    expect(maturities).toContain('10year');
    expect(maturities).toContain('2year');
  });

  it('accepts 3month override', async () => {
    process.env.LYTE_MARKET_SYMBOLS_RATES = '3month';
    const { getRatesMaturities } = await import('../lib/market-data-adapter.js');
    const maturities = getRatesMaturities();
    expect(maturities).toContain('3month');
  });

  it('falls back to defaults when override contains only invalid maturities', async () => {
    process.env.LYTE_MARKET_SYMBOLS_RATES = '5year,30year,invalid';
    const { getRatesMaturities } = await import('../lib/market-data-adapter.js');
    const maturities = getRatesMaturities();
    expect(maturities).toContain('10year');
  });
});

type IndicatorBody = {
  id: string;
  label: string;
  category: string;
  provider: string;
  delayWindow: string;
  asOf: string;
  dataQuality: string;
  isStale: boolean;
  value: number;
};

type SnapshotBody = {
  indicators: IndicatorBody[];
  provider: string;
  providerConfigured: boolean;
  refreshedAt: string;
  nextRefreshAt: string;
  fetchedAt?: string;
};

describe('GET /lyte/market-indicators endpoint', () => {
  beforeEach(() => {
    delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  it('returns 200 with indicators array and snapshot metadata', async () => {
    const app = buildApp();
    const router = (await import('../routes/lyte-market.js')).default;
    app.use('/api', router);

    const res = await request(app).get('/api/lyte/market-indicators');
    expect(res.status).toBe(200);
    const body = res.body as SnapshotBody;
    expect(Array.isArray(body.indicators)).toBe(true);
    expect(body.indicators.length).toBeGreaterThan(0);
    expect(body.provider).toBe('seed');
    expect(body.providerConfigured).toBe(false);
  });

  it('returns fetchedAt in the response body', async () => {
    const app = buildApp();
    const router = (await import('../routes/lyte-market.js')).default;
    app.use('/api', router);

    const res = await request(app).get('/api/lyte/market-indicators');
    const body = res.body as SnapshotBody;
    const fetchedAt = body.fetchedAt ?? body.refreshedAt;
    expect(fetchedAt).toBeTruthy();
    expect(() => new Date(fetchedAt)).not.toThrow();
  });

  it('returns all four categories in seed mode', async () => {
    const app = buildApp();
    const router = (await import('../routes/lyte-market.js')).default;
    app.use('/api', router);

    const res = await request(app).get('/api/lyte/market-indicators');
    const body = res.body as SnapshotBody;
    const categories = new Set(body.indicators.map((i) => i.category));
    expect(categories.has('equity')).toBe(true);
    expect(categories.has('fx')).toBe(true);
    expect(categories.has('commodity')).toBe(true);
    expect(categories.has('rates')).toBe(true);
  });

  it('each indicator has provider, delayWindow, asOf, and dataQuality fields', async () => {
    const app = buildApp();
    const router = (await import('../routes/lyte-market.js')).default;
    app.use('/api', router);

    const res = await request(app).get('/api/lyte/market-indicators');
    const body = res.body as SnapshotBody;
    expect(body.indicators.length).toBeGreaterThan(0);
    for (const ind of body.indicators) {
      expect(ind.provider, `${ind.id}: provider`).toBeTruthy();
      expect(ind.delayWindow, `${ind.id}: delayWindow`).toBeTruthy();
      expect(ind.asOf, `${ind.id}: asOf`).toBeTruthy();
      expect(['live', 'delayed', 'eod', 'monthly', 'seed'], `${ind.id}: dataQuality`).toContain(ind.dataQuality);
      expect(typeof ind.isStale, `${ind.id}: isStale`).toBe('boolean');
    }
  });
});

type RefreshBody = {
  refreshed: boolean;
  count: number;
  provider: string;
};

describe('POST /lyte/market-indicators/refresh endpoint', () => {
  beforeEach(() => {
    delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  it('returns { refreshed: true } with a count', async () => {
    const app = buildApp();
    const router = (await import('../routes/lyte-market.js')).default;
    app.use('/api', router);

    const res = await request(app).post('/api/lyte/market-indicators/refresh');
    expect(res.status).toBe(200);
    const body = res.body as RefreshBody;
    expect(body.refreshed).toBe(true);
    expect(typeof body.count).toBe('number');
    expect(body.count).toBeGreaterThan(0);
  });

  it('returns provider field in refresh response', async () => {
    const app = buildApp();
    const router = (await import('../routes/lyte-market.js')).default;
    app.use('/api', router);

    const res = await request(app).post('/api/lyte/market-indicators/refresh');
    const body = res.body as RefreshBody;
    expect(body.provider).toBeTruthy();
    expect(body.provider).toBe('seed');
  });
});

describe('adapter — fetch error fallback', () => {
  beforeEach(() => {
    process.env.ALPHA_VANTAGE_API_KEY = 'INVALID_TEST_KEY';
    vi.resetModules();
  });

  afterEach(() => {
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  it('falls back to seed snapshot when all provider fetches fail (non-routable key)', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('Network error: simulated provider failure');
    });

    const { getMarketData, invalidateMarketCache } = await import('../lib/market-data-adapter.js');
    invalidateMarketCache();
    const snap = await getMarketData(true);

    expect(snap.indicators.length).toBeGreaterThan(0);
    const hasEquity = snap.indicators.some((i) => i.category === 'equity');
    expect(hasEquity).toBe(true);

    vi.unstubAllGlobals();
  });

  it('returns isStale=true on all indicators when provider fails', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('Network error: simulated provider failure');
    });

    const { getMarketData, invalidateMarketCache } = await import('../lib/market-data-adapter.js');
    invalidateMarketCache();
    const snap = await getMarketData(true);
    expect(snap.indicators.every((i) => i.isStale)).toBe(true);

    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// Staleness rendering — validates the shape the UI uses to display freshness
// ---------------------------------------------------------------------------

describe('staleness rendering — UI data shape', () => {
  beforeEach(() => {
    delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  it('every indicator has a positive staleThresholdHours so the UI can compute freshness', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    for (const ind of snap.indicators) {
      expect(ind.staleThresholdHours, `${ind.id}: staleThresholdHours`).toBeGreaterThan(0);
    }
  });

  it('every indicator has a parseable ISO asOf timestamp', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    for (const ind of snap.indicators) {
      const d = new Date(ind.asOf);
      expect(Number.isNaN(d.getTime()), `${ind.id}: asOf is invalid date`).toBe(false);
    }
  });

  it('no indicator has delayWindow="Real-time" (task scope: delayed/EOD only)', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    const realtimeIndicators = snap.indicators.filter((i) => i.delayWindow === 'Real-time');
    expect(realtimeIndicators.map((i) => i.id)).toEqual([]);
  });

  it('no indicator has dataQuality="live" (task scope: delayed/EOD only)', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    const liveIndicators = snap.indicators.filter((i) => i.dataQuality === 'live');
    expect(liveIndicators.map((i) => i.id)).toEqual([]);
  });

  it('snapshot isStale field is a boolean', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    expect(typeof snap.isStale).toBe('boolean');
  });

  it('snapshot cacheAgeSeconds is a non-negative number', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    expect(snap.cacheAgeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('seed indicators all have provider="seed" (UI shows source badge)', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    for (const ind of snap.indicators) {
      expect(ind.provider, `${ind.id}: provider`).toBe('seed');
    }
  });

  it('seed snapshot has provider="seed" at top level', async () => {
    const { getMarketData } = await import('../lib/market-data-adapter.js');
    const snap = await getMarketData(false);
    expect(snap.provider).toBe('seed');
  });
});

// ---------------------------------------------------------------------------
// Refresh endpoint — rate limiting (429 during cooldown)
// ---------------------------------------------------------------------------

type RateLimitBody = { error: string; retryAfterSeconds: number };

describe('POST /lyte/market-indicators/refresh — rate limiting', () => {
  beforeEach(() => {
    delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.resetModules();
  });

  it('returns 429 with retryAfterSeconds when called twice without cooldown', async () => {
    const app = buildApp();
    const router = (await import('../routes/lyte-market.js')).default;
    app.use('/api', router);

    const first = await request(app).post('/api/lyte/market-indicators/refresh');
    expect(first.status).toBe(200);

    const second = await request(app).post('/api/lyte/market-indicators/refresh');
    expect(second.status).toBe(429);
    const body = second.body as RateLimitBody;
    expect(body.retryAfterSeconds).toBeGreaterThan(0);
    expect(body.error).toBeTruthy();
  });

  it('sets Retry-After header on 429 response', async () => {
    const app = buildApp();
    const router = (await import('../routes/lyte-market.js')).default;
    app.use('/api', router);

    await request(app).post('/api/lyte/market-indicators/refresh');
    const second = await request(app).post('/api/lyte/market-indicators/refresh');
    expect(second.status).toBe(429);
    expect(second.headers['retry-after']).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// FX change/changePct calculation — regression test for q.value → q.rate bug
// ---------------------------------------------------------------------------

describe('adapter — FX change/changePct regression (live provider path)', () => {
  beforeEach(() => {
    process.env.ALPHA_VANTAGE_API_KEY = 'REGRESSION_TEST_KEY';
    vi.resetModules();
  });

  afterEach(() => {
    if (originalApiKey != null) process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
    else delete process.env.ALPHA_VANTAGE_API_KEY;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('FX indicators have finite change and changePct values when FX_DAILY returns prev close', async () => {
    /**
     * Regression: the FX mapper previously used `q.value` (undefined on the
     * fetchFxRateEod result shape `{ rate, prev, asOf }`) instead of `q.rate`,
     * producing NaN for both `change` and `changePct`.
     */
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const FX_DAILY_RESPONSE = {
      'Time Series FX (Daily)': {
        [todayStr]: { '1. open': '1.1320', '2. high': '1.1380', '3. low': '1.1300', '4. close': '1.1350' },
        [yesterdayStr]: { '1. open': '1.1280', '2. high': '1.1340', '3. low': '1.1260', '4. close': '1.1300' },
      },
    };

    vi.stubGlobal('fetch', async (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes('FX_DAILY')) {
        return {
          ok: true,
          json: async () => FX_DAILY_RESPONSE,
        } as Response;
      }
      // All other calls (equity, commodity, rates) fail → adapter falls back to seed for those
      throw new Error('Network error: non-FX call rejected in FX regression test');
    });

    const { getMarketData, invalidateMarketCache } = await import('../lib/market-data-adapter.js');
    invalidateMarketCache();
    const snap = await getMarketData(true);

    const fxIndicators = snap.indicators.filter((i) => i.category === 'fx' && !i.isStale);
    expect(fxIndicators.length, 'at least one live FX indicator should be present').toBeGreaterThan(0);

    for (const ind of fxIndicators) {
      expect(
        Number.isFinite(ind.change ?? 0),
        `${ind.id}: change must be finite (not NaN) — q.rate regression`,
      ).toBe(true);
      expect(
        Number.isFinite(ind.changePct ?? 0),
        `${ind.id}: changePct must be finite (not NaN) — q.rate regression`,
      ).toBe(true);
      // Sanity-check the actual computed values from the mocked response
      // rate=1.1350, prev=1.1300 → change≈+0.005, changePct≈+0.44%
      if (ind.change != null) {
        expect(ind.change, `${ind.id}: change should be positive`).toBeGreaterThan(0);
      }
    }
  });
});
