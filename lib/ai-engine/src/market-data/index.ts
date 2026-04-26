/**
 * Market Data Feed — Pluggable Adapter Layer
 *
 * Defines a clean MarketDataAdapter interface that any provider can implement,
 * then registers built-in adapters for:
 *
 *   • Alpha Vantage  (equity / FX / commodity — delayed / EOD)
 *   • FRED           (Federal Reserve Economic Data — macro indicators)
 *   • Yahoo Finance  (equity quotes — unofficial free endpoint)
 *
 * Usage:
 *   import { marketFeedRegistry } from '@ai-engine/market-data';
 *   const indicators = await marketFeedRegistry.fetchAll(['alpha-vantage', 'fred']);
 */

// Use a lightweight logger shim for this library module
const _logger = {
  info: (meta: Record<string, unknown> | string, msg?: string) => {
    const message = typeof meta === 'string' ? meta : msg ?? '';
    const extra = typeof meta === 'object' ? meta : {};
    if (process.env.LOG_LEVEL !== 'silent') {
      // eslint-disable-next-line no-console
      console.log('[market-data]', message, Object.keys(extra).length ? extra : '');
    }
  },
  warn: (meta: Record<string, unknown> | string, msg?: string) => {
    const message = typeof meta === 'string' ? meta : msg ?? '';
    const extra = typeof meta === 'object' ? meta : {};
    // eslint-disable-next-line no-console
    console.warn('[market-data:warn]', message, Object.keys(extra).length ? extra : '');
  },
  error: (meta: Record<string, unknown> | string, msg?: string) => {
    const message = typeof meta === 'string' ? meta : msg ?? '';
    const extra = typeof meta === 'object' ? meta : {};
    // eslint-disable-next-line no-console
    console.error('[market-data:error]', message, Object.keys(extra).length ? extra : '');
  },
};

// ---------------------------------------------------------------------------
// Shared indicator type (mirrors MacroIndicator from market-data-adapter.ts)
// ---------------------------------------------------------------------------

export type IndicatorCategory = 'equity' | 'fx' | 'commodity' | 'rates' | 'macro';
export type DataQuality = 'live' | 'delayed' | 'eod' | 'monthly' | 'quarterly' | 'seed';

export interface FeedIndicator {
  id: string;
  label: string;
  category: IndicatorCategory;
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
  dataQuality: DataQuality;
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface MarketDataAdapter {
  readonly id: string;
  readonly displayName: string;
  isConfigured(): boolean;
  fetch(): Promise<FeedIndicator[]>;
}

// ---------------------------------------------------------------------------
// Simple in-process logger wrapper (works even if logger import fails)
// ---------------------------------------------------------------------------

function safeLog(level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) {
  _logger[level](meta ?? {}, msg);
}

// ---------------------------------------------------------------------------
// FRED Adapter — Federal Reserve Economic Data
// ---------------------------------------------------------------------------
//
// Uses FRED's public JSON API. Requires FRED_API_KEY (free registration at
// fred.stlouisfed.org). Falls back to seed data when the key is absent.
//
// Selected series (configurable via LYTE_FRED_SERIES env var):
//   DFF   — Fed Funds Rate (daily, effective)
//   GS10  — 10-Year Treasury Constant Maturity Rate
//   T10YIE — 10-Year Breakeven Inflation Rate
//   UNRATE — US Unemployment Rate (monthly)
//   CPIAUCSL — CPI, All Items (monthly)
//   DCOILWTICO — WTI Crude Oil Price (daily)

const FRED_DEFAULT_SERIES: Array<{
  seriesId: string;
  label: string;
  category: IndicatorCategory;
  unit: string;
  delayWindow: string;
  staleHours: number;
  quality: DataQuality;
}> = [
  {
    seriesId: 'DFF',
    label: 'Fed Funds Rate',
    category: 'rates',
    unit: '%',
    delayWindow: 'Daily (next-day lag)',
    staleHours: 48,
    quality: 'eod',
  },
  {
    seriesId: 'GS10',
    label: '10-Year Treasury Yield',
    category: 'rates',
    unit: '%',
    delayWindow: 'Monthly avg',
    staleHours: 720,
    quality: 'monthly',
  },
  {
    seriesId: 'T10YIE',
    label: '10-Year Breakeven Inflation',
    category: 'rates',
    unit: '%',
    delayWindow: 'Daily (next-day lag)',
    staleHours: 48,
    quality: 'eod',
  },
  {
    seriesId: 'UNRATE',
    label: 'US Unemployment Rate',
    category: 'macro',
    unit: '%',
    delayWindow: 'Monthly',
    staleHours: 720,
    quality: 'monthly',
  },
  {
    seriesId: 'CPIAUCSL',
    label: 'CPI (All Items)',
    category: 'macro',
    unit: 'index',
    delayWindow: 'Monthly',
    staleHours: 720,
    quality: 'monthly',
  },
  {
    seriesId: 'DCOILWTICO',
    label: 'WTI Crude Oil',
    category: 'commodity',
    unit: 'USD/bbl',
    delayWindow: 'Daily',
    staleHours: 48,
    quality: 'eod',
  },
];

// Seed fallback for FRED (avoids blank UI when key is absent)
const FRED_SEED: FeedIndicator[] = [
  {
    id: 'fred-dff',
    label: 'Fed Funds Rate',
    category: 'rates',
    value: 5.33,
    formattedValue: '5.33%',
    change: 0,
    changePct: 0,
    unit: '%',
    asOf: '2026-04-01T00:00:00Z',
    provider: 'FRED (seed)',
    delayWindow: 'Daily',
    staleThresholdHours: 48,
    isStale: true,
    dataQuality: 'seed',
  },
  {
    id: 'fred-gs10',
    label: '10-Year Treasury Yield',
    category: 'rates',
    value: 4.38,
    formattedValue: '4.38%',
    change: null,
    changePct: null,
    unit: '%',
    asOf: '2026-04-01T00:00:00Z',
    provider: 'FRED (seed)',
    delayWindow: 'Monthly avg',
    staleThresholdHours: 720,
    isStale: true,
    dataQuality: 'seed',
  },
  {
    id: 'fred-t10yie',
    label: '10-Year Breakeven Inflation',
    category: 'rates',
    value: 2.31,
    formattedValue: '2.31%',
    change: null,
    changePct: null,
    unit: '%',
    asOf: '2026-04-01T00:00:00Z',
    provider: 'FRED (seed)',
    delayWindow: 'Daily',
    staleThresholdHours: 48,
    isStale: true,
    dataQuality: 'seed',
  },
  {
    id: 'fred-unrate',
    label: 'US Unemployment Rate',
    category: 'macro',
    value: 4.2,
    formattedValue: '4.2%',
    change: null,
    changePct: null,
    unit: '%',
    asOf: '2026-03-01T00:00:00Z',
    provider: 'FRED (seed)',
    delayWindow: 'Monthly',
    staleThresholdHours: 720,
    isStale: true,
    dataQuality: 'seed',
  },
  {
    id: 'fred-cpiaucsl',
    label: 'CPI (All Items)',
    category: 'macro',
    value: 314.7,
    formattedValue: '314.7',
    change: null,
    changePct: null,
    unit: 'index',
    asOf: '2026-03-01T00:00:00Z',
    provider: 'FRED (seed)',
    delayWindow: 'Monthly',
    staleThresholdHours: 720,
    isStale: true,
    dataQuality: 'seed',
  },
  {
    id: 'fred-dcoilwtico',
    label: 'WTI Crude Oil',
    category: 'commodity',
    value: 73.41,
    formattedValue: '$73.41',
    change: null,
    changePct: null,
    unit: 'USD/bbl',
    asOf: '2026-04-01T00:00:00Z',
    provider: 'FRED (seed)',
    delayWindow: 'Daily',
    staleThresholdHours: 48,
    isStale: true,
    dataQuality: 'seed',
  },
];

async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
): Promise<{ value: number; date: string } | null> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}` +
    `&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2&observation_start=2020-01-01`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    observations?: Array<{ date: string; value: string }>;
  };
  const obs = data.observations ?? [];
  // Find latest non-null value
  for (const ob of obs) {
    const num = parseFloat(ob.value);
    if (Number.isFinite(num)) {
      return { value: num, date: ob.date };
    }
  }
  return null;
}

export const fredAdapter: MarketDataAdapter = {
  id: 'fred',
  displayName: 'FRED — Federal Reserve Economic Data',

  isConfigured(): boolean {
    return Boolean(process.env.FRED_API_KEY);
  },

  async fetch(): Promise<FeedIndicator[]> {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
      safeLog('info', 'FRED: API key not configured, returning seed data');
      return FRED_SEED;
    }

    const now = Date.now();
    const results: FeedIndicator[] = [];

    await Promise.allSettled(
      FRED_DEFAULT_SERIES.map(async (series) => {
        try {
          const obs = await fetchFredSeries(series.seriesId, apiKey);
          if (!obs) {
            const seed = FRED_SEED.find((s) => s.id === `fred-${series.seriesId.toLowerCase()}`);
            if (seed) results.push(seed);
            return;
          }

          const asOfMs = new Date(obs.date).getTime();
          const ageHours = (now - asOfMs) / 3_600_000;
          const isStale = ageHours > series.staleHours;

          let formattedValue = obs.value.toLocaleString('en-US', { maximumFractionDigits: 2 });
          if (series.unit === '%') formattedValue = `${obs.value.toFixed(2)}%`;
          if (series.unit === 'USD/bbl') formattedValue = `$${obs.value.toFixed(2)}`;

          results.push({
            id: `fred-${series.seriesId.toLowerCase()}`,
            label: series.label,
            category: series.category,
            value: obs.value,
            formattedValue,
            change: null,
            changePct: null,
            unit: series.unit,
            asOf: new Date(obs.date).toISOString(),
            provider: 'FRED',
            delayWindow: series.delayWindow,
            staleThresholdHours: series.staleHours,
            isStale,
            dataQuality: series.quality,
          });
        } catch (err) {
          safeLog('warn', `FRED: Failed to fetch ${series.seriesId}`, {
            err: err instanceof Error ? err.message : String(err),
          });
          const seed = FRED_SEED.find((s) => s.id === `fred-${series.seriesId.toLowerCase()}`);
          if (seed) results.push(seed);
        }
      }),
    );

    return results;
  },
};

// ---------------------------------------------------------------------------
// Yahoo Finance Adapter — unofficial free endpoint (no key required)
// ---------------------------------------------------------------------------
//
// Uses the unofficial Yahoo Finance v8 quote API. No authentication required
// for basic quotes. Rate limits apply (~2000 req/day per IP). Subject to
// change without notice — treat as best-effort.
//
// NOTE: Yahoo Finance data is NOT for commercial redistribution.
//       For production use, replace with a licensed provider.

const YF_DEFAULT_SYMBOLS: Array<{
  symbol: string;
  id: string;
  label: string;
  category: IndicatorCategory;
  unit: string;
}> = [
  { symbol: 'SPY', id: 'yf-spy', label: 'S&P 500 (SPY)', category: 'equity', unit: 'USD' },
  { symbol: 'QQQ', id: 'yf-qqq', label: 'NASDAQ 100 (QQQ)', category: 'equity', unit: 'USD' },
  { symbol: 'GLD', id: 'yf-gld', label: 'Gold ETF (GLD)', category: 'commodity', unit: 'USD' },
  { symbol: 'TLT', id: 'yf-tlt', label: '20Y Treasury ETF (TLT)', category: 'rates', unit: 'USD' },
  { symbol: 'DX-Y.NYB', id: 'yf-dxy', label: 'US Dollar Index (DXY)', category: 'fx', unit: 'index' },
];

const YF_SEED: FeedIndicator[] = [
  { id: 'yf-spy', label: 'S&P 500 (SPY)', category: 'equity', value: 538.74, formattedValue: '$538.74', change: -2.11, changePct: -0.39, unit: 'USD', asOf: '2026-04-01T20:00:00Z', provider: 'Yahoo Finance (seed)', delayWindow: '15-min delayed', staleThresholdHours: 24, isStale: true, dataQuality: 'seed' },
  { id: 'yf-qqq', label: 'NASDAQ 100 (QQQ)', category: 'equity', value: 466.89, formattedValue: '$466.89', change: 1.44, changePct: 0.31, unit: 'USD', asOf: '2026-04-01T20:00:00Z', provider: 'Yahoo Finance (seed)', delayWindow: '15-min delayed', staleThresholdHours: 24, isStale: true, dataQuality: 'seed' },
  { id: 'yf-gld', label: 'Gold ETF (GLD)', category: 'commodity', value: 241.88, formattedValue: '$241.88', change: 0.55, changePct: 0.23, unit: 'USD', asOf: '2026-04-01T20:00:00Z', provider: 'Yahoo Finance (seed)', delayWindow: '15-min delayed', staleThresholdHours: 24, isStale: true, dataQuality: 'seed' },
  { id: 'yf-tlt', label: '20Y Treasury ETF (TLT)', category: 'rates', value: 87.44, formattedValue: '$87.44', change: -0.34, changePct: -0.39, unit: 'USD', asOf: '2026-04-01T20:00:00Z', provider: 'Yahoo Finance (seed)', delayWindow: '15-min delayed', staleThresholdHours: 24, isStale: true, dataQuality: 'seed' },
  { id: 'yf-dxy', label: 'US Dollar Index (DXY)', category: 'fx', value: 104.82, formattedValue: '104.82', change: -0.12, changePct: -0.11, unit: 'index', asOf: '2026-04-01T20:00:00Z', provider: 'Yahoo Finance (seed)', delayWindow: 'EOD', staleThresholdHours: 24, isStale: true, dataQuality: 'seed' },
];

async function fetchYahooQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePct: number;
  asOf: number;
} | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8_000),
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
    },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
          regularMarketTime?: number;
        };
      }>;
    };
  };

  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) return null;

  return {
    price: meta.regularMarketPrice,
    change: meta.regularMarketChange ?? 0,
    changePct: meta.regularMarketChangePercent ?? 0,
    asOf: (meta.regularMarketTime ?? Date.now() / 1000) * 1000,
  };
}

export const yahooFinanceAdapter: MarketDataAdapter = {
  id: 'yahoo-finance',
  displayName: 'Yahoo Finance (unofficial free feed)',

  isConfigured(): boolean {
    return true; // no key required
  },

  async fetch(): Promise<FeedIndicator[]> {
    const now = Date.now();
    const results: FeedIndicator[] = [];

    const customSymbols = process.env.LYTE_YAHOO_SYMBOLS;
    const symbolsToFetch = customSymbols
      ? customSymbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 10).map((sym) => {
          const def = YF_DEFAULT_SYMBOLS.find((d) => d.symbol === sym);
          return def ?? { symbol: sym, id: `yf-${sym.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, label: sym, category: 'equity' as IndicatorCategory, unit: 'USD' };
        })
      : YF_DEFAULT_SYMBOLS;

    await Promise.allSettled(
      symbolsToFetch.map(async (def) => {
        try {
          const quote = await fetchYahooQuote(def.symbol);
          if (!quote) {
            const seed = YF_SEED.find((s) => s.id === def.id);
            if (seed) results.push(seed);
            return;
          }

          const ageHours = (now - quote.asOf) / 3_600_000;
          const isStale = ageHours > 24;
          const formattedValue =
            def.unit === 'USD' ? `$${quote.price.toFixed(2)}` : quote.price.toFixed(2);

          results.push({
            id: def.id,
            label: def.label,
            category: def.category,
            value: quote.price,
            formattedValue,
            change: parseFloat(quote.change.toFixed(2)),
            changePct: parseFloat(quote.changePct.toFixed(4)),
            unit: def.unit,
            asOf: new Date(quote.asOf).toISOString(),
            provider: 'Yahoo Finance',
            delayWindow: '15-min delayed',
            staleThresholdHours: 24,
            isStale,
            dataQuality: 'delayed',
          });
        } catch (err) {
          safeLog('warn', `Yahoo Finance: Failed to fetch ${def.symbol}`, {
            err: err instanceof Error ? err.message : String(err),
          });
          const seed = YF_SEED.find((s) => s.id === def.id);
          if (seed) results.push(seed);
        }
      }),
    );

    return results;
  },
};

// ---------------------------------------------------------------------------
// Alpha Vantage adapter — uses ALPHA_VANTAGE_API_KEY when configured,
// falls back to a curated seed snapshot when the key is absent.
// ---------------------------------------------------------------------------

const AV_SEED: FeedIndicator[] = [
  {
    id: 'av-spx',
    label: 'S&P 500',
    category: 'equity',
    value: 5_117.09,
    formattedValue: '5,117.09',
    change: -12.5,
    changePct: -0.24,
    unit: 'USD',
    asOf: new Date().toISOString(),
    provider: 'Alpha Vantage (seed)',
    delayWindow: '15-min',
    staleThresholdHours: 24,
    isStale: true,
    dataQuality: 'seed',
  },
  {
    id: 'av-vix',
    label: 'VIX Volatility Index',
    category: 'macro',
    value: 17.43,
    formattedValue: '17.43',
    change: 0.31,
    changePct: 1.81,
    unit: '',
    asOf: new Date().toISOString(),
    provider: 'Alpha Vantage (seed)',
    delayWindow: '15-min',
    staleThresholdHours: 24,
    isStale: true,
    dataQuality: 'seed',
  },
  {
    id: 'av-usd-index',
    label: 'US Dollar Index (DXY)',
    category: 'fx',
    value: 104.32,
    formattedValue: '104.32',
    change: -0.08,
    changePct: -0.08,
    unit: '',
    asOf: new Date().toISOString(),
    provider: 'Alpha Vantage (seed)',
    delayWindow: '15-min',
    staleThresholdHours: 24,
    isStale: true,
    dataQuality: 'seed',
  },
];

async function fetchFromAlphaVantage(apiKey: string): Promise<FeedIndicator[]> {
  const now = Date.now();
  const queries: Array<{ symbol: string; id: string; label: string; category: IndicatorCategory }> = [
    { symbol: 'SPY', id: 'av-spx', label: 'S&P 500 ETF (SPY)', category: 'equity' },
    { symbol: 'QQQ', id: 'av-qqq', label: 'Nasdaq 100 ETF (QQQ)', category: 'equity' },
    { symbol: 'GLD', id: 'av-gold', label: 'Gold ETF (GLD)', category: 'commodity' },
  ];

  const results: FeedIndicator[] = [];

  await Promise.allSettled(
    queries.map(async (q) => {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${q.symbol}&apikey=${apiKey}`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8_000) });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as {
          'Global Quote'?: Record<string, string>;
          Note?: string;
        };
        const quote = data['Global Quote'];
        if (!quote || !quote['05. price']) {
          throw new Error(data['Note'] ?? 'No quote data');
        }
        const price = parseFloat(quote['05. price']);
        const change = parseFloat(quote['09. change'] ?? '0');
        const changePct = parseFloat((quote['10. change percent'] ?? '0%').replace('%', ''));
        results.push({
          id: q.id,
          label: q.label,
          category: q.category,
          value: price,
          formattedValue: price.toLocaleString('en-US', { minimumFractionDigits: 2 }),
          change,
          changePct,
          unit: 'USD',
          asOf: new Date(quote['07. latest trading day'] ?? now).toISOString(),
          provider: 'Alpha Vantage',
          delayWindow: 'real-time',
          staleThresholdHours: 8,
          isStale: false,
          dataQuality: 'live',
        });
      } catch (err) {
        safeLog('warn', `Alpha Vantage: failed to fetch ${q.symbol}`, {
          err: err instanceof Error ? err.message : String(err),
        });
        const seed = AV_SEED.find((s) => s.id === q.id);
        if (seed) results.push(seed);
      }
    }),
  );

  return results.length > 0 ? results : AV_SEED;
}

export const alphaVantageAdapter: MarketDataAdapter = {
  id: 'alpha-vantage',
  displayName: 'Alpha Vantage — Equities & Macro',

  isConfigured(): boolean {
    return Boolean(process.env.ALPHA_VANTAGE_API_KEY);
  },

  async fetch(): Promise<FeedIndicator[]> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      safeLog('info', 'Alpha Vantage: API key not configured, returning seed data');
      return AV_SEED;
    }
    return fetchFromAlphaVantage(apiKey);
  },
};

// ---------------------------------------------------------------------------
// Market Feed Registry — central adapter registry
// ---------------------------------------------------------------------------

class MarketFeedRegistry {
  private adapters = new Map<string, MarketDataAdapter>();

  register(adapter: MarketDataAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): MarketDataAdapter | undefined {
    return this.adapters.get(id);
  }

  listAdapters(): Array<{ id: string; displayName: string; configured: boolean }> {
    return Array.from(this.adapters.values()).map((a) => ({
      id: a.id,
      displayName: a.displayName,
      configured: a.isConfigured(),
    }));
  }

  async fetchAll(
    adapterIds?: string[],
  ): Promise<{ indicators: FeedIndicator[]; byAdapter: Record<string, FeedIndicator[]> }> {
    const targets = adapterIds
      ? adapterIds.map((id) => this.adapters.get(id)).filter((a): a is MarketDataAdapter => Boolean(a))
      : Array.from(this.adapters.values());

    const byAdapter: Record<string, FeedIndicator[]> = {};
    const all: FeedIndicator[] = [];

    await Promise.allSettled(
      targets.map(async (adapter) => {
        try {
          const indicators = await adapter.fetch();
          byAdapter[adapter.id] = indicators;
          all.push(...indicators);
        } catch (err) {
          safeLog('warn', `MarketFeedRegistry: adapter '${adapter.id}' failed`, {
            err: err instanceof Error ? err.message : String(err),
          });
          byAdapter[adapter.id] = [];
        }
      }),
    );

    return { indicators: all, byAdapter };
  }
}

export const marketFeedRegistry = new MarketFeedRegistry();

// Register built-in adapters
marketFeedRegistry.register(fredAdapter);
marketFeedRegistry.register(yahooFinanceAdapter);
marketFeedRegistry.register(alphaVantageAdapter);
