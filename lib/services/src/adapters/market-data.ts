import { ServiceAdapter } from '../base.js';

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  marketCap: number | null;
  timestamp: string;
  source: 'alpha_vantage' | 'polygon' | 'mock';
}

export interface MarketBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface MarketOverview {
  symbol: string;
  name: string;
  description: string;
  exchange: string;
  sector: string;
  industry: string;
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  marketCap: number | null;
  week52High: number | null;
  week52Low: number | null;
  analystTargetPrice: number | null;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

const MOCK_QUOTES: Record<string, MarketQuote> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 203.45,
    change: 2.15,
    changePercent: 1.07,
    open: 201.8,
    high: 204.2,
    low: 201.3,
    previousClose: 201.3,
    volume: 58200000,
    marketCap: 3_120_000_000_000,
    timestamp: new Date().toISOString(),
    source: 'mock',
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 419.8,
    change: -1.2,
    changePercent: -0.28,
    open: 421.5,
    high: 422.1,
    low: 418.6,
    previousClose: 421.0,
    volume: 22100000,
    marketCap: 3_110_000_000_000,
    timestamp: new Date().toISOString(),
    source: 'mock',
  },
  JPM: {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    price: 248.6,
    change: 3.4,
    changePercent: 1.39,
    open: 246.0,
    high: 249.5,
    low: 245.8,
    previousClose: 245.2,
    volume: 12800000,
    marketCap: 710_000_000_000,
    timestamp: new Date().toISOString(),
    source: 'mock',
  },
  GS: {
    symbol: 'GS',
    name: 'Goldman Sachs Group',
    price: 512.3,
    change: 8.7,
    changePercent: 1.73,
    open: 505.0,
    high: 515.0,
    low: 504.5,
    previousClose: 503.6,
    volume: 3800000,
    marketCap: 165_000_000_000,
    timestamp: new Date().toISOString(),
    source: 'mock',
  },
  BLK: {
    symbol: 'BLK',
    name: 'BlackRock Inc.',
    price: 995.5,
    change: 12.3,
    changePercent: 1.25,
    open: 985.0,
    high: 998.0,
    low: 983.5,
    previousClose: 983.2,
    volume: 1200000,
    marketCap: 149_000_000_000,
    timestamp: new Date().toISOString(),
    source: 'mock',
  },
  SPY: {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    price: 525.8,
    change: 4.2,
    changePercent: 0.8,
    open: 522.5,
    high: 526.9,
    low: 521.8,
    previousClose: 521.6,
    volume: 82000000,
    marketCap: null,
    timestamp: new Date().toISOString(),
    source: 'mock',
  },
  IYR: {
    symbol: 'IYR',
    name: 'iShares US Real Estate ETF',
    price: 88.4,
    change: 0.85,
    changePercent: 0.97,
    open: 87.8,
    high: 88.7,
    low: 87.6,
    previousClose: 87.55,
    volume: 8500000,
    marketCap: null,
    timestamp: new Date().toISOString(),
    source: 'mock',
  },
};

const MOCK_INDICES: MarketIndex[] = [
  {
    name: 'S&P 500',
    symbol: 'SPX',
    value: 5245.5,
    change: 42.3,
    changePercent: 0.81,
    timestamp: new Date().toISOString(),
  },
  {
    name: 'Dow Jones',
    symbol: 'INDU',
    value: 38850.0,
    change: 185.6,
    changePercent: 0.48,
    timestamp: new Date().toISOString(),
  },
  {
    name: 'Nasdaq Composite',
    symbol: 'COMP',
    value: 16420.0,
    change: 128.4,
    changePercent: 0.79,
    timestamp: new Date().toISOString(),
  },
  {
    name: 'Russell 2000',
    symbol: 'RUT',
    value: 2085.3,
    change: -12.8,
    changePercent: -0.61,
    timestamp: new Date().toISOString(),
  },
  {
    name: 'VIX',
    symbol: 'VIX',
    value: 18.45,
    change: -0.92,
    changePercent: -4.75,
    timestamp: new Date().toISOString(),
  },
];

export class MarketDataAdapter extends ServiceAdapter {
  readonly name = 'market_data';
  readonly description =
    'Market data adapter supporting Alpha Vantage and Polygon.io free tiers for equity quotes, historical bars, and index data. Auto-detects provider from env vars. Falls back to realistic mock data.';
  readonly requiredEnvVars = ['ALPHA_VANTAGE_API_KEY'];

  override get missingEnvVars(): string[] {
    const hasAlphaVantage = !!process.env['ALPHA_VANTAGE_API_KEY'];
    const hasPolygon = !!process.env['POLYGON_API_KEY'];
    if (hasAlphaVantage || hasPolygon) return [];
    return ['ALPHA_VANTAGE_API_KEY'];
  }

  override get presentEnvVars(): string[] {
    const present: string[] = [];
    if (process.env['ALPHA_VANTAGE_API_KEY']) present.push('ALPHA_VANTAGE_API_KEY');
    if (process.env['POLYGON_API_KEY']) present.push('POLYGON_API_KEY');
    return present;
  }

  private get provider(): 'alpha_vantage' | 'polygon' | null {
    if (process.env['POLYGON_API_KEY']) return 'polygon';
    if (process.env['ALPHA_VANTAGE_API_KEY']) return 'alpha_vantage';
    return null;
  }

  private _avLastRequest = 0;
  private readonly AV_RATE_LIMIT_MS = 12500;

  private async alphaVantageRequest<T>(params: Record<string, string>): Promise<T> {
    const now = Date.now();
    const wait = this.AV_RATE_LIMIT_MS - (now - this._avLastRequest);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this._avLastRequest = Date.now();

    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.set('apikey', process.env['ALPHA_VANTAGE_API_KEY']!);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'SZL-Holdings-Platform/1.0' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Alpha Vantage API error: HTTP ${res.status}`);
    const data = (await res.json()) as T;
    if ((data as Record<string, unknown>)['Note'])
      throw new Error('Alpha Vantage rate limit reached');
    return data;
  }

  private async polygonRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`https://api.polygon.io${path}`);
    url.searchParams.set('apiKey', process.env['POLYGON_API_KEY']!);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'SZL-Holdings-Platform/1.0' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Polygon API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    if (this.provider === 'polygon') {
      await this.polygonRequest('/v2/aggs/ticker/AAPL/range/1/day/2025-01-01/2025-01-02');
    } else if (this.provider === 'alpha_vantage') {
      await this.alphaVantageRequest({ function: 'GLOBAL_QUOTE', symbol: 'AAPL' });
    }
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    if (this.isDemoMode) {
      const mock = MOCK_QUOTES[symbol.toUpperCase()];
      if (mock) return mock;
      return {
        symbol: symbol.toUpperCase(),
        name: `${symbol.toUpperCase()} Corporation`,
        price: 100 + Math.random() * 400,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 3,
        open: 100,
        high: 110,
        low: 95,
        previousClose: 99,
        volume: Math.floor(Math.random() * 20_000_000),
        marketCap: null,
        timestamp: new Date().toISOString(),
        source: 'mock',
      };
    }

    if (this.provider === 'polygon') {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const data = (await this.polygonRequest(
        `/v2/aggs/ticker/${symbol}/range/1/day/${yesterday}/${today}`,
        { adjusted: 'true', sort: 'desc', limit: '2' },
      )) as {
        results?: Array<{
          o: number;
          h: number;
          l: number;
          c: number;
          v: number;
          vw?: number;
          t: number;
        }>;
        ticker?: string;
      };
      const latest = data.results?.[0];
      const prev = data.results?.[1];
      if (!latest) throw new Error(`No data for ${symbol}`);
      const change = latest.c - (prev?.c ?? latest.o);
      return {
        symbol: symbol.toUpperCase(),
        name: symbol,
        price: latest.c,
        change,
        changePercent: (change / (prev?.c ?? latest.o)) * 100,
        open: latest.o,
        high: latest.h,
        low: latest.l,
        previousClose: prev?.c ?? latest.o,
        volume: latest.v,
        marketCap: null,
        timestamp: new Date(latest.t).toISOString(),
        source: 'polygon',
      };
    }

    const data = (await this.alphaVantageRequest({ function: 'GLOBAL_QUOTE', symbol })) as {
      'Global Quote': Record<string, string>;
    };
    const q = data['Global Quote'];
    return {
      symbol: symbol.toUpperCase(),
      name: symbol,
      price: parseFloat(q['05. price'] ?? '0'),
      change: parseFloat(q['09. change'] ?? '0'),
      changePercent: parseFloat((q['10. change percent'] ?? '0%').replace('%', '')),
      open: parseFloat(q['02. open'] ?? '0'),
      high: parseFloat(q['03. high'] ?? '0'),
      low: parseFloat(q['04. low'] ?? '0'),
      previousClose: parseFloat(q['08. previous close'] ?? '0'),
      volume: parseInt(q['06. volume'] ?? '0'),
      marketCap: null,
      timestamp: new Date().toISOString(),
      source: 'alpha_vantage',
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<MarketQuote[]> {
    if (this.isDemoMode) {
      return symbols.map((s) => {
        const mock = MOCK_QUOTES[s.toUpperCase()];
        return (
          mock ?? {
            symbol: s.toUpperCase(),
            name: s,
            price: 100,
            change: 0,
            changePercent: 0,
            open: 100,
            high: 105,
            low: 98,
            previousClose: 100,
            volume: 1000000,
            marketCap: null,
            timestamp: new Date().toISOString(),
            source: 'mock' as const,
          }
        );
      });
    }

    const results = await Promise.allSettled(symbols.map((s) => this.getQuote(s)));
    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<MarketQuote>).value);
  }

  async getHistoricalBars(
    symbol: string,
    from: string,
    to: string,
    timespan: 'day' | 'week' | 'month' = 'day',
  ): Promise<MarketBar[]> {
    if (this.isDemoMode) {
      const bars: MarketBar[] = [];
      const fromDate = new Date(from);
      const toDate = new Date(to);
      let price = 200;
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        price = price * (1 + (Math.random() - 0.5) * 0.03);
        bars.push({
          date: d.toISOString().slice(0, 10),
          open: price * 0.99,
          high: price * 1.01,
          low: price * 0.98,
          close: price,
          volume: Math.floor(Math.random() * 20_000_000),
        });
      }
      return bars;
    }

    if (this.provider === 'polygon') {
      const data = (await this.polygonRequest(
        `/v2/aggs/ticker/${symbol}/range/1/${timespan}/${from}/${to}`,
        { adjusted: 'true', sort: 'asc', limit: '365' },
      )) as {
        results?: Array<{
          o: number;
          h: number;
          l: number;
          c: number;
          v: number;
          vw?: number;
          t: number;
        }>;
      };
      return (data.results ?? []).map((r) => ({
        date: new Date(r.t).toISOString().slice(0, 10),
        open: r.o,
        high: r.h,
        low: r.l,
        close: r.c,
        volume: r.v,
        vwap: r.vw,
      }));
    }

    const outputSize = timespan === 'day' ? 'compact' : 'full';
    const func =
      timespan === 'month'
        ? 'TIME_SERIES_MONTHLY'
        : timespan === 'week'
          ? 'TIME_SERIES_WEEKLY'
          : 'TIME_SERIES_DAILY';
    const data = (await this.alphaVantageRequest({
      function: func,
      symbol,
      outputsize: outputSize,
    })) as Record<string, Record<string, Record<string, string>>>;
    const timeSeries =
      data['Time Series (Daily)'] ??
      data['Weekly Time Series'] ??
      data['Monthly Time Series'] ??
      {};
    return Object.entries(timeSeries)
      .filter(([date]) => date >= from && date <= to)
      .map(([date, bar]) => ({
        date,
        open: parseFloat(bar['1. open'] ?? '0'),
        high: parseFloat(bar['2. high'] ?? '0'),
        low: parseFloat(bar['3. low'] ?? '0'),
        close: parseFloat(bar['4. close'] ?? '0'),
        volume: parseInt(bar['5. volume'] ?? '0'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    if (this.isDemoMode) return MOCK_INDICES;
    const indexSymbols = ['SPY', 'DIA', 'QQQ', 'IWM', 'VIXY'];
    const quotes = await this.getMultipleQuotes(indexSymbols);
    return quotes.map((q) => ({
      name: q.name,
      symbol: q.symbol,
      value: q.price,
      change: q.change,
      changePercent: q.changePercent,
      timestamp: q.timestamp,
    }));
  }

  getMockQuotes(): Record<string, MarketQuote> {
    return { ...MOCK_QUOTES };
  }

  getMockIndices(): MarketIndex[] {
    return [...MOCK_INDICES];
  }
}
