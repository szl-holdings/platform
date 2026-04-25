/**
 * Market Data Adapter — Alpha Vantage (delayed / EOD feeds)
 *
 * Fetches macro indicators: equity indices, FX rates, commodity prices, and
 * treasury yields from Alpha Vantage's free / standard API tier.
 *
 * Provider key is read from ALPHA_VANTAGE_API_KEY. When the key is absent the
 * adapter returns the built-in seed snapshot so the UI stays functional without
 * credentials.
 *
 * Each indicator carries:
 *  - value / change / changePct
 *  - asOf      — ISO timestamp of when the provider last reported the value
 *  - delayWindow — human description ("15-min delayed", "EOD", "Monthly avg")
 *  - isStale   — true when the cache entry is older than the indicator's
 *                stale threshold (different for intraday vs EOD vs monthly)
 */

import { LRUCache } from 'lru-cache';
import { logger } from './logger';

export interface MacroIndicator {
  id: string;
  label: string;
  category: 'equity' | 'fx' | 'commodity' | 'rates';
  value: number;
  formattedValue: string;
  change: number | null;
  changePct: number | null;
  unit: string;
  asOf: string;
  provider: string;
  delayWindow: string;
  staleThresholdHours: number;
  isStale: boolean;
  dataQuality: 'live' | 'delayed' | 'eod' | 'monthly' | 'seed';
}

export interface MarketDataSnapshot {
  indicators: MacroIndicator[];
  refreshedAt: string;
  nextRefreshAt: string;
  providerConfigured: boolean;
  cacheAgeSeconds: number;
  isStale: boolean;
  provider: string;
}

const CACHE_KEY = 'market-data-snapshot';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const STALE_WARN_THRESHOLD_MS = 6 * 60 * 60 * 1000;

/**
 * Validate provider credentials at startup.
 *
 * - When the key is present: logs INFO confirming live feeds are enabled.
 * - When the key is absent in development: logs INFO noting seed mode.
 * - When the key is absent in production: logs ERROR so the missing credential
 *   is immediately visible in production monitoring dashboards. The adapter
 *   still degrades gracefully to seed data — this avoids a hard failure in
 *   production — but the ERROR ensures the gap is not silently ignored.
 *
 * Returns true when the provider is fully configured (key present), false
 * when running in seed-fallback mode. Callers that require a live feed can
 * check the return value and act accordingly.
 */
export function validateMarketDataConfig(): boolean {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const isProd = process.env.NODE_ENV === 'production';
  if (!apiKey) {
    if (isProd) {
      logger.error(
        { configKey: 'ALPHA_VANTAGE_API_KEY', severity: 'startup-config-missing' },
        'market-data-adapter [PRODUCTION]: ALPHA_VANTAGE_API_KEY is not configured. ' +
          'All market indicator requests will return the built-in seed snapshot ' +
          '(isStale=true, dataQuality=seed). ' +
          'Set ALPHA_VANTAGE_API_KEY in the deployment environment to enable live Alpha Vantage feeds.',
      );
    } else {
      logger.info(
        'market-data-adapter: ALPHA_VANTAGE_API_KEY not set — seed snapshot will be used ' +
          '(configure the key to fetch live delayed/EOD data from Alpha Vantage).',
      );
    }
    return false;
  } else {
    logger.info(
      { keyPrefix: apiKey.slice(0, 4) + '****' },
      'market-data-adapter: Alpha Vantage key configured — live feeds enabled.',
    );
    return true;
  }
}

/**
 * Returns the list of equity symbols to fetch from Alpha Vantage.
 *
 * Defaults to ['SPY', 'QQQ'] but can be overridden at runtime via the
 * LYTE_MARKET_SYMBOLS_EQUITY environment variable (comma-separated list of
 * valid Alpha Vantage GLOBAL_QUOTE symbols, e.g. "SPY,QQQ,DIA,IWM").
 *
 * This allows operators to change the tracked equities without a code deploy.
 */
export function getEquitySymbols(): string[] {
  const override = process.env.LYTE_MARKET_SYMBOLS_EQUITY;
  if (override) {
    const parsed = override
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{1,5}$/.test(s));
    if (parsed.length > 0) return parsed;
    logger.warn(
      { raw: override },
      'market-data-adapter: LYTE_MARKET_SYMBOLS_EQUITY is set but contains no valid symbols — falling back to defaults.',
    );
  }
  return ['SPY', 'QQQ'];
}

/**
 * FX pair descriptor — six-letter code split into from/to currency.
 */
interface FxPairConfig {
  code: string; // e.g. "EURUSD"
  from: string; // e.g. "EUR"
  to: string;   // e.g. "USD"
  label: string;
  id: string;
}

const FX_PAIR_META: Record<string, { label: string; id: string }> = {
  EURUSD: { label: 'EUR/USD', id: 'eurusd' },
  GBPUSD: { label: 'GBP/USD', id: 'gbpusd' },
  USDJPY: { label: 'USD/JPY', id: 'usdjpy' },
  USDCAD: { label: 'USD/CAD', id: 'usdcad' },
  AUDUSD: { label: 'AUD/USD', id: 'audusd' },
  USDCHF: { label: 'USD/CHF', id: 'usdchf' },
};

/**
 * Returns the list of FX pairs to fetch, driven by LYTE_MARKET_SYMBOLS_FX.
 * Format: comma-separated 6-char codes (e.g. "EURUSD,GBPUSD,USDJPY").
 */
export function getFxPairs(): FxPairConfig[] {
  const override = process.env.LYTE_MARKET_SYMBOLS_FX;
  const parse = (raw: string): FxPairConfig[] =>
    raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{6}$/.test(s))
      .map((code) => ({
        code,
        from: code.slice(0, 3),
        to: code.slice(3, 6),
        label: FX_PAIR_META[code]?.label ?? `${code.slice(0, 3)}/${code.slice(3, 6)}`,
        id: FX_PAIR_META[code]?.id ?? code.toLowerCase(),
      }));

  if (override) {
    const parsed = parse(override);
    if (parsed.length > 0) return parsed;
    logger.warn(
      { raw: override },
      'market-data-adapter: LYTE_MARKET_SYMBOLS_FX contains no valid 6-char pairs — falling back to defaults.',
    );
  }
  return parse('EURUSD,GBPUSD,USDJPY');
}

const VALID_COMMODITIES = new Set(['WTI', 'BRENT', 'NATURAL_GAS', 'COPPER']);
const COMMODITY_META: Record<string, { label: string; id: string; unit: string; prefix: string }> = {
  WTI:         { label: 'WTI Crude',    id: 'wti',         unit: '$/bbl', prefix: '$' },
  BRENT:       { label: 'Brent Crude',  id: 'brent',       unit: '$/bbl', prefix: '$' },
  NATURAL_GAS: { label: 'Natural Gas',  id: 'natural_gas', unit: '$/MMBtu', prefix: '$' },
  COPPER:      { label: 'Copper',       id: 'copper',      unit: '$/lb',  prefix: '$' },
};

/**
 * Returns the list of commodity instruments to fetch, driven by LYTE_MARKET_SYMBOLS_COMMODITY.
 * Valid values: WTI, BRENT, NATURAL_GAS, COPPER.
 */
export function getCommodityInstruments(): string[] {
  const override = process.env.LYTE_MARKET_SYMBOLS_COMMODITY;
  if (override) {
    const parsed = override
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => VALID_COMMODITIES.has(s));
    if (parsed.length > 0) return parsed;
    logger.warn(
      { raw: override },
      'market-data-adapter: LYTE_MARKET_SYMBOLS_COMMODITY contains no valid values — falling back to defaults.',
    );
  }
  return ['WTI', 'BRENT'];
}

const VALID_MATURITIES = new Set(['10year', '2year', '3month']);
const MATURITY_META: Record<string, { label: string; id: string }> = {
  '10year': { label: 'US 10Y Yield', id: 'us10y' },
  '2year':  { label: 'US 2Y Yield',  id: 'us2y'  },
  '3month': { label: 'US 3M Yield',  id: 'us3m'  },
};

/**
 * Returns the list of treasury maturities to fetch, driven by LYTE_MARKET_SYMBOLS_RATES.
 * Valid values: 10year, 2year, 3month.
 */
export function getRatesMaturities(): string[] {
  const override = process.env.LYTE_MARKET_SYMBOLS_RATES;
  if (override) {
    const parsed = override
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => VALID_MATURITIES.has(s));
    if (parsed.length > 0) return parsed;
    logger.warn(
      { raw: override },
      'market-data-adapter: LYTE_MARKET_SYMBOLS_RATES contains no valid maturities — falling back to defaults.',
    );
  }
  return ['10year', '2year'];
}

const marketCache = new LRUCache<
  string,
  { snapshot: MarketDataSnapshot; fetchedAt: number }
>({ max: 10 });

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<unknown> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SZL-Lyte-MarketFeed/1.0' },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      if (attempt === maxRetries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn({ err, attempt, delay }, 'market-data-adapter: retrying after error');
      await sleep(delay);
      attempt++;
    }
  }
  throw new Error('fetchWithRetry: exhausted retries');
}

function fmt(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pct(v: number | null): number | null {
  if (v == null) return null;
  return parseFloat(v.toFixed(3));
}

function isOlderThan(isoStr: string, hours: number): boolean {
  return Date.now() - new Date(isoStr).getTime() > hours * 3_600_000;
}

const BASE = 'https://www.alphavantage.co/query';

async function fetchGlobalQuote(
  symbol: string,
  apiKey: string,
): Promise<{ price: number; change: number; changePct: number; latestDay: string } | null> {
  try {
    const url = `${BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const data = (await fetchWithRetry(url)) as Record<string, unknown>;
    const q = data['Global Quote'] as Record<string, string> | undefined;
    if (!q || !q['05. price']) return null;
    const price = parseFloat(q['05. price']);
    const change = parseFloat(q['09. change'] ?? '0');
    const changePctRaw = q['10. change percent']?.replace('%', '') ?? '0';
    const changePct = parseFloat(changePctRaw);
    const latestDay = q['07. latest trading day'] ?? new Date().toISOString().slice(0, 10);
    if (Number.isNaN(price)) return null;
    return { price, change, changePct, latestDay };
  } catch {
    return null;
  }
}

/**
 * Fetches EOD FX rate using FX_DAILY endpoint (close price of latest trading day).
 * Aligned with task scope: delayed/EOD feeds only. No real-time labeling.
 */
async function fetchFxRateEod(
  fromCurrency: string,
  toCurrency: string,
  apiKey: string,
): Promise<{ rate: number; prev: number | null; asOf: string } | null> {
  try {
    const url = `${BASE}?function=FX_DAILY&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&outputsize=compact&apikey=${apiKey}`;
    const data = (await fetchWithRetry(url)) as Record<string, unknown>;
    const series = data['Time Series FX (Daily)'] as Record<string, Record<string, string>> | undefined;
    if (!series) return null;
    const dates = Object.keys(series).sort().reverse();
    if (dates.length === 0) return null;
    const latestDate = dates[0];
    const latestRow = series[latestDate];
    const rate = parseFloat(latestRow['4. close'] ?? '');
    if (Number.isNaN(rate)) return null;
    const prev = dates[1] ? parseFloat(series[dates[1]]['4. close'] ?? '') : null;
    return {
      rate,
      prev: prev != null && !Number.isNaN(prev) ? prev : null,
      asOf: new Date(latestDate + 'T21:00:00Z').toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchTreasuryYield(
  maturity: '10year' | '2year' | '3month',
  apiKey: string,
): Promise<{ value: number; asOf: string } | null> {
  try {
    const url = `${BASE}?function=TREASURY_YIELD&interval=daily&maturity=${maturity}&apikey=${apiKey}`;
    const data = (await fetchWithRetry(url)) as Record<string, unknown>;
    const series = data['data'] as Array<{ date: string; value: string }> | undefined;
    if (!Array.isArray(series) || series.length === 0) return null;
    const latest = series[0];
    const value = parseFloat(latest.value);
    if (Number.isNaN(value) || value <= 0) return null;
    return { value, asOf: new Date(latest.date).toISOString() };
  } catch {
    return null;
  }
}

async function fetchCommodity(
  commodity: 'WTI' | 'BRENT' | 'NATURAL_GAS' | 'COPPER',
  apiKey: string,
): Promise<{ value: number; prev: number | null; asOf: string } | null> {
  try {
    const url = `${BASE}?function=${commodity}&interval=daily&apikey=${apiKey}`;
    const data = (await fetchWithRetry(url)) as Record<string, unknown>;
    const series = data['data'] as Array<{ date: string; value: string }> | undefined;
    if (!Array.isArray(series) || series.length === 0) return null;
    const latest = series.find((d) => d.value !== '.' && parseFloat(d.value) > 0);
    if (!latest) return null;
    const value = parseFloat(latest.value);
    if (Number.isNaN(value)) return null;
    const prevRaw = series.find(
      (d) => d.date !== latest.date && d.value !== '.' && parseFloat(d.value) > 0,
    );
    const prev = prevRaw ? parseFloat(prevRaw.value) : null;
    return { value, prev, asOf: new Date(latest.date).toISOString() };
  } catch {
    return null;
  }
}

function buildSeedSnapshot(): MarketDataSnapshot {
  const now = new Date();
  const eod = new Date(now);
  eod.setHours(16, 0, 0, 0);
  if (eod > now) eod.setDate(eod.getDate() - 1);
  const eodIso = eod.toISOString();

  const indicators: MacroIndicator[] = [
    {
      id: 'spy',
      label: 'S&P 500',
      category: 'equity',
      value: 5241.5,
      formattedValue: '5,241.50',
      change: -18.2,
      changePct: -0.346,
      unit: 'pts',
      asOf: eodIso,
      provider: 'seed',
      delayWindow: 'EOD (seed)',
      staleThresholdHours: 8,
      isStale: true,
      dataQuality: 'seed',
    },
    {
      id: 'qqq',
      label: 'Nasdaq 100',
      category: 'equity',
      value: 17932.8,
      formattedValue: '17,932.80',
      change: -42.1,
      changePct: -0.234,
      unit: 'pts',
      asOf: eodIso,
      provider: 'seed',
      delayWindow: 'EOD (seed)',
      staleThresholdHours: 8,
      isStale: true,
      dataQuality: 'seed',
    },
    {
      id: 'eurusd',
      label: 'EUR/USD',
      category: 'fx',
      value: 1.0832,
      formattedValue: '1.0832',
      change: -0.0018,
      changePct: -0.166,
      unit: '',
      asOf: eodIso,
      provider: 'seed',
      delayWindow: 'EOD (seed)',
      staleThresholdHours: 4,
      isStale: true,
      dataQuality: 'seed',
    },
    {
      id: 'usdjpy',
      label: 'USD/JPY',
      category: 'fx',
      value: 154.28,
      formattedValue: '154.28',
      change: 0.42,
      changePct: 0.273,
      unit: '',
      asOf: eodIso,
      provider: 'seed',
      delayWindow: 'EOD (seed)',
      staleThresholdHours: 4,
      isStale: true,
      dataQuality: 'seed',
    },
    {
      id: 'wti',
      label: 'WTI Crude',
      category: 'commodity',
      value: 82.14,
      formattedValue: '$82.14',
      change: -0.53,
      changePct: -0.641,
      unit: '$/bbl',
      asOf: eodIso,
      provider: 'seed',
      delayWindow: 'EOD (seed)',
      staleThresholdHours: 24,
      isStale: true,
      dataQuality: 'seed',
    },
    {
      id: 'brent',
      label: 'Brent Crude',
      category: 'commodity',
      value: 86.41,
      formattedValue: '$86.41',
      change: -0.61,
      changePct: -0.701,
      unit: '$/bbl',
      asOf: eodIso,
      provider: 'seed',
      delayWindow: 'EOD (seed)',
      staleThresholdHours: 24,
      isStale: true,
      dataQuality: 'seed',
    },
    {
      id: 'us10y',
      label: 'US 10Y Yield',
      category: 'rates',
      value: 4.63,
      formattedValue: '4.63%',
      change: 0.04,
      changePct: 0.871,
      unit: '%',
      asOf: eodIso,
      provider: 'seed',
      delayWindow: 'EOD (seed)',
      staleThresholdHours: 24,
      isStale: true,
      dataQuality: 'seed',
    },
    {
      id: 'us2y',
      label: 'US 2Y Yield',
      category: 'rates',
      value: 4.97,
      formattedValue: '4.97%',
      change: 0.02,
      changePct: 0.404,
      unit: '%',
      asOf: eodIso,
      provider: 'seed',
      delayWindow: 'EOD (seed)',
      staleThresholdHours: 24,
      isStale: true,
      dataQuality: 'seed',
    },
  ];

  return {
    indicators,
    refreshedAt: now.toISOString(),
    nextRefreshAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
    providerConfigured: false,
    cacheAgeSeconds: 0,
    isStale: true,
    provider: 'seed',
  };
}

const EQUITY_LABELS: Record<string, { label: string; id: string }> = {
  SPY: { label: 'S&P 500', id: 'spy' },
  QQQ: { label: 'Nasdaq 100', id: 'qqq' },
  DIA: { label: 'Dow Jones', id: 'dia' },
  IWM: { label: 'Russell 2000', id: 'iwm' },
  EEM: { label: 'Emerging Markets', id: 'eem' },
};

async function fetchFromAlphaVantage(apiKey: string): Promise<MacroIndicator[]> {
  const now = new Date().toISOString();
  const indicators: MacroIndicator[] = [];
  const equitySymbols = getEquitySymbols();
  const fxPairs = getFxPairs();
  const commodities = getCommodityInstruments();
  const maturities = getRatesMaturities();

  // --- Equities (GLOBAL_QUOTE — 15-min delayed intraday) ---
  const [equityResults] = await Promise.allSettled([
    Promise.allSettled(equitySymbols.map((sym) => fetchGlobalQuote(sym, apiKey))),
  ]);

  if (equityResults.status === 'fulfilled') {
    equitySymbols.forEach((sym, idx) => {
      const result = equityResults.value[idx];
      if (result.status === 'fulfilled' && result.value) {
        const q = result.value;
        const meta = EQUITY_LABELS[sym] ?? { label: sym, id: sym.toLowerCase() };
        indicators.push({
          id: meta.id,
          label: meta.label,
          category: 'equity',
          value: q.price,
          formattedValue: fmt(q.price),
          change: q.change,
          changePct: pct(q.changePct),
          unit: 'pts',
          asOf: new Date(q.latestDay + 'T21:00:00Z').toISOString(),
          provider: 'Alpha Vantage',
          delayWindow: '15-min delayed',
          staleThresholdHours: 8,
          isStale: isOlderThan(q.latestDay + 'T21:00:00Z', 8),
          dataQuality: 'delayed',
        });
      }
    });
  }

  await sleep(500);

  // --- FX (FX_DAILY — EOD closing rates) ---
  const fxResults = await Promise.allSettled(
    fxPairs.map((pair) => fetchFxRateEod(pair.from, pair.to, apiKey)),
  );

  fxPairs.forEach((pair, idx) => {
    const result = fxResults[idx];
    if (result.status === 'fulfilled' && result.value) {
      const q = result.value;
      const change = q.prev != null ? q.rate - q.prev : null;
      const changePct = q.prev != null ? ((q.rate - q.prev) / q.prev) * 100 : null;
      indicators.push({
        id: pair.id,
        label: pair.label,
        category: 'fx',
        value: q.rate,
        formattedValue: fmt(q.rate, 4),
        change,
        changePct: pct(changePct),
        unit: '',
        asOf: q.asOf,
        provider: 'Alpha Vantage',
        delayWindow: 'EOD',
        staleThresholdHours: 24,
        isStale: isOlderThan(q.asOf, 24),
        dataQuality: 'eod',
      });
    }
  });

  await sleep(500);

  // --- Rates (TREASURY_YIELD — EOD) & Commodities (daily series — EOD) ---
  const ratesResults = await Promise.allSettled(
    maturities.map((m) => fetchTreasuryYield(m as '10year' | '2year' | '3month', apiKey)),
  );
  const commodityResults = await Promise.allSettled(
    commodities.map((c) => fetchCommodity(c as 'WTI' | 'BRENT' | 'NATURAL_GAS' | 'COPPER', apiKey)),
  );

  maturities.forEach((maturity, idx) => {
    const result = ratesResults[idx];
    if (result.status === 'fulfilled' && result.value) {
      const q = result.value;
      const meta = MATURITY_META[maturity] ?? { label: `US ${maturity}`, id: maturity.replace('year', 'y').replace('month', 'm') };
      indicators.push({
        id: meta.id,
        label: meta.label,
        category: 'rates',
        value: q.value,
        formattedValue: `${fmt(q.value, 2)}%`,
        change: null,
        changePct: null,
        unit: '%',
        asOf: q.asOf,
        provider: 'Alpha Vantage',
        delayWindow: 'EOD',
        staleThresholdHours: 24,
        isStale: isOlderThan(q.asOf, 24),
        dataQuality: 'eod',
      });
    }
  });

  commodities.forEach((commodity, idx) => {
    const result = commodityResults[idx];
    if (result.status === 'fulfilled' && result.value) {
      const q = result.value;
      const change = q.prev != null ? q.value - q.prev : null;
      const changePct = q.prev != null ? ((q.value - q.prev) / q.prev) * 100 : null;
      const meta = COMMODITY_META[commodity] ?? { label: commodity, id: commodity.toLowerCase(), unit: '$/unit', prefix: '$' };
      indicators.push({
        id: meta.id,
        label: meta.label,
        category: 'commodity',
        value: q.value,
        formattedValue: `${meta.prefix}${fmt(q.value)}`,
        change,
        changePct: pct(changePct),
        unit: meta.unit,
        asOf: q.asOf,
        provider: 'Alpha Vantage',
        delayWindow: 'EOD',
        staleThresholdHours: 24,
        isStale: isOlderThan(q.asOf, 24),
        dataQuality: 'eod',
      });
    }
  });

  if (indicators.length === 0) {
    logger.warn('market-data-adapter: all Alpha Vantage fetches failed — check API key / rate limits');
  } else {
    logger.info({ count: indicators.length, fetchedAt: now }, 'market-data-adapter: fetch complete');
  }

  return indicators;
}

export async function getMarketData(forceRefresh = false): Promise<MarketDataSnapshot> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const cached = marketCache.get(CACHE_KEY);
  const now = Date.now();

  if (!forceRefresh && cached) {
    const ageMs = now - cached.fetchedAt;
    const isSnapshotStale = ageMs > STALE_WARN_THRESHOLD_MS;
    return {
      ...cached.snapshot,
      cacheAgeSeconds: Math.floor(ageMs / 1000),
      isStale: isSnapshotStale,
    };
  }

  if (!apiKey) {
    logger.info('market-data-adapter: ALPHA_VANTAGE_API_KEY not set — returning seed snapshot');
    const seed = buildSeedSnapshot();
    marketCache.set(CACHE_KEY, { snapshot: seed, fetchedAt: now });
    return seed;
  }

  let indicators: MacroIndicator[] = [];
  let usedSeed = false;

  try {
    indicators = await fetchFromAlphaVantage(apiKey);
    if (indicators.length === 0) {
      const seed = buildSeedSnapshot();
      indicators = seed.indicators;
      usedSeed = true;
    }
  } catch (err) {
    logger.error({ err }, 'market-data-adapter: fatal fetch error — falling back to seed');
    if (cached) {
      const ageMs = now - cached.fetchedAt;
      return {
        ...cached.snapshot,
        cacheAgeSeconds: Math.floor(ageMs / 1000),
        isStale: true,
        provider: 'stale-cache',
      };
    }
    const seed = buildSeedSnapshot();
    indicators = seed.indicators;
    usedSeed = true;
  }

  const snapshot: MarketDataSnapshot = {
    indicators,
    refreshedAt: new Date(now).toISOString(),
    nextRefreshAt: new Date(now + CACHE_TTL_MS).toISOString(),
    providerConfigured: !usedSeed && !!apiKey,
    cacheAgeSeconds: 0,
    isStale: false,
    provider: usedSeed ? 'seed' : 'Alpha Vantage',
  };

  marketCache.set(CACHE_KEY, { snapshot, fetchedAt: now });
  return snapshot;
}

export function invalidateMarketCache(): void {
  marketCache.clear();
}
