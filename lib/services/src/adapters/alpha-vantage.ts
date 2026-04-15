import { ServiceAdapter } from "../base.js";

export interface AVQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: number;
}

export interface AVTimeSeries {
  symbol: string;
  interval: string;
  dataPoints: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjustedClose?: number;
  }>;
}

export interface AVForexRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastRefreshed: string;
  bidPrice: number;
  askPrice: number;
}

export interface AVEarnings {
  symbol: string;
  annualEarnings: Array<{ fiscalDateEnding: string; reportedEPS: string }>;
  quarterlyEarnings: Array<{
    fiscalDateEnding: string;
    reportedDate: string;
    reportedEPS: string;
    estimatedEPS: string;
    surprise: string;
    surprisePercentage: string;
  }>;
}

const MOCK_QUOTES: Record<string, AVQuote> = {
  "AAPL": { symbol: "AAPL", open: 187.40, high: 189.20, low: 186.80, price: 188.52, volume: 52341200, latestTradingDay: "2026-04-14", previousClose: 187.90, change: 0.62, changePercent: 0.33 },
  "JPM": { symbol: "JPM", open: 212.10, high: 214.80, low: 211.40, price: 213.75, volume: 8941200, latestTradingDay: "2026-04-14", previousClose: 213.20, change: 0.55, changePercent: 0.26 },
  "GS": { symbol: "GS", open: 498.40, high: 502.20, low: 496.80, price: 500.12, volume: 1842100, latestTradingDay: "2026-04-14", previousClose: 497.80, change: 2.32, changePercent: 0.47 },
};

export class AlphaVantageAdapter extends ServiceAdapter {
  readonly name = "alpha-vantage";
  readonly description =
    "Alpha Vantage — real-time and historical stock quotes, technical indicators, forex rates, crypto prices, and company fundamentals. Requires API key. Falls back to demo mode when ALPHA_VANTAGE_API_KEY is absent.";
  readonly requiredEnvVars = ["ALPHA_VANTAGE_API_KEY"];

  private get apiKey(): string | undefined { return process.env["ALPHA_VANTAGE_API_KEY"]; }

  private readonly BASE_URL = "https://www.alphavantage.co/query";

  private async avRequest<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(this.BASE_URL);
    url.searchParams.set("apikey", this.apiKey!);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Alpha Vantage API error: HTTP ${res.status}`);
    const data = await res.json() as Record<string, unknown>;
    if (data["Note"] || data["Information"]) throw new Error(`Alpha Vantage rate limit: ${data["Note"] ?? data["Information"]}`);
    return data as T;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.avRequest({ function: "GLOBAL_QUOTE", symbol: "AAPL" });
  }

  async getQuote(symbol: string): Promise<AVQuote> {
    if (this.isDemoMode) return MOCK_QUOTES[symbol.toUpperCase()] ?? { ...MOCK_QUOTES["AAPL"]!, symbol };
    const data = await this.avRequest<{ "Global Quote": Record<string, string> }>({ function: "GLOBAL_QUOTE", symbol });
    const q = data["Global Quote"];
    return {
      symbol, open: parseFloat(q["02. open"] ?? "0"), high: parseFloat(q["03. high"] ?? "0"),
      low: parseFloat(q["04. low"] ?? "0"), price: parseFloat(q["05. price"] ?? "0"),
      volume: parseInt(q["06. volume"] ?? "0"), latestTradingDay: q["07. latest trading day"] ?? "",
      previousClose: parseFloat(q["08. previous close"] ?? "0"), change: parseFloat(q["09. change"] ?? "0"),
      changePercent: parseFloat((q["10. change percent"] ?? "0%").replace("%", "")),
    };
  }

  async getDailyTimeSeries(symbol: string, outputSize: "compact" | "full" = "compact"): Promise<AVTimeSeries> {
    if (this.isDemoMode) {
      const now = new Date();
      return {
        symbol, interval: "daily",
        dataPoints: Array.from({ length: 30 }, (_, i) => {
          const d = new Date(now.getTime() - i * 86400000);
          const base = 188 + (Math.random() - 0.5) * 20;
          return { timestamp: d.toISOString().split("T")[0]!, open: base - 1, high: base + 2, low: base - 2, close: base, volume: Math.round(50000000 + Math.random() * 20000000) };
        }),
      };
    }
    const data = await this.avRequest<Record<string, unknown>>({ function: "TIME_SERIES_DAILY_ADJUSTED", symbol, outputsize: outputSize });
    const series = data["Time Series (Daily)"] as Record<string, Record<string, string>>;
    return {
      symbol, interval: "daily",
      dataPoints: Object.entries(series ?? {}).map(([ts, v]) => ({
        timestamp: ts, open: parseFloat(v["1. open"] ?? "0"), high: parseFloat(v["2. high"] ?? "0"),
        low: parseFloat(v["3. low"] ?? "0"), close: parseFloat(v["4. close"] ?? "0"),
        volume: parseInt(v["6. volume"] ?? "0"), adjustedClose: parseFloat(v["5. adjusted close"] ?? "0"),
      })),
    };
  }

  async getForexRate(fromCurrency: string, toCurrency: string): Promise<AVForexRate> {
    if (this.isDemoMode) {
      const rates: Record<string, number> = { "EUR": 0.923, "GBP": 0.791, "JPY": 153.42, "CAD": 1.363 };
      const rate = rates[toCurrency] ?? 1.0;
      return { fromCurrency, toCurrency, rate, lastRefreshed: new Date().toISOString(), bidPrice: rate - 0.001, askPrice: rate + 0.001 };
    }
    const data = await this.avRequest<Record<string, Record<string, string>>>({ function: "CURRENCY_EXCHANGE_RATE", from_currency: fromCurrency, to_currency: toCurrency });
    const r = data["Realtime Currency Exchange Rate"] ?? {};
    return {
      fromCurrency, toCurrency, rate: parseFloat(r["5. Exchange Rate"] ?? "0"),
      lastRefreshed: r["6. Last Refreshed"] ?? "", bidPrice: parseFloat(r["8. Bid Price"] ?? "0"),
      askPrice: parseFloat(r["9. Ask Price"] ?? "0"),
    };
  }

  async getEarnings(symbol: string): Promise<AVEarnings> {
    if (this.isDemoMode) {
      return {
        symbol,
        annualEarnings: [
          { fiscalDateEnding: "2025-12-31", reportedEPS: "6.42" },
          { fiscalDateEnding: "2024-12-31", reportedEPS: "5.81" },
        ],
        quarterlyEarnings: [
          { fiscalDateEnding: "2025-12-31", reportedDate: "2026-01-28", reportedEPS: "1.62", estimatedEPS: "1.59", surprise: "0.03", surprisePercentage: "1.89" },
          { fiscalDateEnding: "2025-09-30", reportedDate: "2025-10-29", reportedEPS: "1.58", estimatedEPS: "1.54", surprise: "0.04", surprisePercentage: "2.60" },
        ],
      };
    }
    const data = await this.avRequest<{ annualEarnings: Array<Record<string, string>>; quarterlyEarnings: Array<Record<string, string>> }>({ function: "EARNINGS", symbol });
    return {
      symbol,
      annualEarnings: (data.annualEarnings ?? []).map(e => ({ fiscalDateEnding: e["fiscalDateEnding"] ?? "", reportedEPS: e["reportedEPS"] ?? "" })),
      quarterlyEarnings: (data.quarterlyEarnings ?? []).map(e => ({
        fiscalDateEnding: e["fiscalDateEnding"] ?? "", reportedDate: e["reportedDate"] ?? "",
        reportedEPS: e["reportedEPS"] ?? "", estimatedEPS: e["estimatedEPS"] ?? "",
        surprise: e["surprise"] ?? "", surprisePercentage: e["surprisePercentage"] ?? "",
      })),
    };
  }

  getMockQuotes(): Record<string, AVQuote> { return MOCK_QUOTES; }
}
