import { ServiceAdapter } from "../base.js";

export interface FredSeries {
  id: string;
  title: string;
  units: string;
  frequency: string;
  seasonalAdjustment: string;
  lastUpdated: string;
  notes: string;
}

export interface FredObservation {
  date: string;
  value: string;
  realtimeStart: string;
  realtimeEnd: string;
}

export interface FredSeriesData {
  series: FredSeries;
  observations: FredObservation[];
}

export interface FredEconomicSnapshot {
  gdp: FredObservation | null;
  cpiInflation: FredObservation | null;
  federalFundsRate: FredObservation | null;
  unemploymentRate: FredObservation | null;
  tenYearTreasury: FredObservation | null;
  mortgageRate30Year: FredObservation | null;
  commercialRealEstatePriceIndex: FredObservation | null;
  fetchedAt: string;
}

const MOCK_ECONOMIC_SNAPSHOT: FredEconomicSnapshot = {
  gdp: { date: "2025-07-01", value: "29850.0", realtimeStart: "2025-10-30", realtimeEnd: "9999-12-31" },
  cpiInflation: { date: "2026-03-01", value: "2.8", realtimeStart: "2026-04-10", realtimeEnd: "9999-12-31" },
  federalFundsRate: { date: "2026-03-01", value: "4.50", realtimeStart: "2026-04-01", realtimeEnd: "9999-12-31" },
  unemploymentRate: { date: "2026-03-01", value: "4.2", realtimeStart: "2026-04-04", realtimeEnd: "9999-12-31" },
  tenYearTreasury: { date: "2026-04-11", value: "4.38", realtimeStart: "2026-04-14", realtimeEnd: "9999-12-31" },
  mortgageRate30Year: { date: "2026-04-10", value: "6.82", realtimeStart: "2026-04-11", realtimeEnd: "9999-12-31" },
  commercialRealEstatePriceIndex: { date: "2026-01-01", value: "218.5", realtimeStart: "2026-04-01", realtimeEnd: "9999-12-31" },
  fetchedAt: new Date().toISOString(),
};

const KEY_SERIES: Record<string, { id: string; title: string; units: string }> = {
  gdp: { id: "GDP", title: "Gross Domestic Product", units: "Billions of Dollars" },
  cpiInflation: { id: "CPIAUCSL", title: "Consumer Price Index for All Urban Consumers", units: "Index 1982-1984=100" },
  federalFundsRate: { id: "FEDFUNDS", title: "Federal Funds Effective Rate", units: "Percent" },
  unemploymentRate: { id: "UNRATE", title: "Unemployment Rate", units: "Percent" },
  tenYearTreasury: { id: "GS10", title: "10-Year Treasury Constant Maturity Rate", units: "Percent" },
  mortgageRate30Year: { id: "MORTGAGE30US", title: "30-Year Fixed Rate Mortgage Average in the United States", units: "Percent" },
  commercialRealEstatePriceIndex: { id: "COMREPUSQ159N", title: "Commercial Real Estate Prices for United States", units: "Index 2010=100" },
  vix: { id: "VIXCLS", title: "CBOE Volatility Index: VIX", units: "Index" },
  sp500: { id: "SP500", title: "S&P 500", units: "Index" },
  corporateBondYield: { id: "BAMLC0A0CM", title: "ICE BofA US Corporate Index Option-Adjusted Spread", units: "Percent" },
  highYieldSpread: { id: "BAMLH0A0HYM2", title: "ICE BofA US High Yield Index Option-Adjusted Spread", units: "Percent" },
};

export class FredAdapter extends ServiceAdapter {
  readonly name = "fred";
  readonly description =
    "Federal Reserve Bank of St. Louis FRED — economic indicators, interest rates, inflation, GDP, treasury yields. Free API with key. Falls back to demo mode when FRED_API_KEY is absent.";
  readonly requiredEnvVars = ["FRED_API_KEY"];

  private get apiKey(): string | undefined {
    return process.env["FRED_API_KEY"];
  }

  private readonly BASE_URL = "https://api.stlouisfed.org/fred";

  private async fredRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    url.searchParams.set("api_key", this.apiKey!);
    url.searchParams.set("file_type", "json");
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": "SZL-Holdings-Platform/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`FRED API error: HTTP ${res.status} — ${path}`);
    return res.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.fredRequest("/series", { series_id: "FEDFUNDS", limit: "1" });
  }

  async getSeriesInfo(seriesId: string): Promise<FredSeries> {
    if (this.isDemoMode) {
      const found = Object.values(KEY_SERIES).find(s => s.id === seriesId);
      return {
        id: seriesId,
        title: found?.title ?? seriesId,
        units: found?.units ?? "",
        frequency: "Monthly",
        seasonalAdjustment: "Seasonally Adjusted",
        lastUpdated: new Date().toISOString(),
        notes: "FRED economic indicator",
      };
    }

    const data = (await this.fredRequest("/series", { series_id: seriesId })) as {
      seriess: Array<{
        id: string;
        title: string;
        units: string;
        frequency: string;
        seasonal_adjustment: string;
        last_updated: string;
        notes: string;
      }>;
    };

    const s = data.seriess[0]!;
    return {
      id: s.id,
      title: s.title,
      units: s.units,
      frequency: s.frequency,
      seasonalAdjustment: s.seasonal_adjustment,
      lastUpdated: s.last_updated,
      notes: s.notes ?? "",
    };
  }

  async getObservations(
    seriesId: string,
    params: { limit?: number; sortOrder?: "asc" | "desc"; observationStart?: string } = {}
  ): Promise<FredObservation[]> {
    if (this.isDemoMode) {
      const snap = MOCK_ECONOMIC_SNAPSHOT as unknown as Record<string, FredObservation | null | string>;
      const key = Object.entries(KEY_SERIES).find(([, v]) => v.id === seriesId)?.[0];
      const obs = key ? (snap[key] as FredObservation | null) : null;
      return obs ? [obs] : [];
    }

    const data = (await this.fredRequest("/series/observations", {
      series_id: seriesId,
      limit: String(params.limit ?? 12),
      sort_order: params.sortOrder ?? "desc",
      ...(params.observationStart ? { observation_start: params.observationStart } : {}),
    })) as {
      observations: Array<{ date: string; value: string; realtime_start: string; realtime_end: string }>;
    };

    return data.observations.map(o => ({
      date: o.date,
      value: o.value,
      realtimeStart: o.realtime_start,
      realtimeEnd: o.realtime_end,
    }));
  }

  async getLatestObservation(seriesId: string): Promise<FredObservation | null> {
    const obs = await this.getObservations(seriesId, { limit: 1, sortOrder: "desc" });
    return obs[0] ?? null;
  }

  async getEconomicSnapshot(): Promise<FredEconomicSnapshot> {
    if (this.isDemoMode) return { ...MOCK_ECONOMIC_SNAPSHOT, fetchedAt: new Date().toISOString() };

    const results = await Promise.allSettled(
      Object.entries(KEY_SERIES).map(async ([key, { id }]) => ({
        key,
        obs: await this.getLatestObservation(id),
      }))
    );

    const snapshot: Partial<FredEconomicSnapshot> = { fetchedAt: new Date().toISOString() };
    for (const result of results) {
      if (result.status === "fulfilled") {
        (snapshot as Record<string, unknown>)[result.value.key] = result.value.obs;
      }
    }

    return snapshot as FredEconomicSnapshot;
  }

  getKeySeriesMap(): typeof KEY_SERIES {
    return KEY_SERIES;
  }
}
