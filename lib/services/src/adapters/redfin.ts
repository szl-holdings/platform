import { ServiceAdapter } from "../base.js";

export interface RedfinListing {
  listingId: string;
  mlsId: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  price: number;
  pricePerSqFt: number | null;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  lotSize: number | null;
  yearBuilt: number | null;
  propertyType: string;
  listingStatus: string;
  daysOnMarket: number;
  priceDropPercent: number | null;
  estimatedMonthlyMortgage: number | null;
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;
  listingUrl: string;
  photoCount: number;
}

export interface RedfinMarketStats {
  regionId: string;
  regionName: string;
  medianSalePrice: number;
  medianPricePerSqFt: number;
  avgDaysOnMarket: number;
  totalListings: number;
  newListings: number;
  pendingSales: number;
  soldLastMonth: number;
  priceDropPercent: number;
  period: string;
}

const MOCK_LISTINGS: RedfinListing[] = [
  {
    listingId: "rf-1001", mlsId: "REBNY-2026-8821", address: "1240 Broadway", city: "New York", state: "NY", zipCode: "10001",
    latitude: 40.747, longitude: -73.989, price: 3900000, pricePerSqFt: 812, bedrooms: 0, bathrooms: 2,
    livingArea: 4800, lotSize: null, yearBuilt: 1908, propertyType: "COMMERCIAL", listingStatus: "FOR_SALE",
    daysOnMarket: 47, priceDropPercent: 7.1, estimatedMonthlyMortgage: null, walkScore: 99, transitScore: 100,
    bikeScore: 91, listingUrl: "https://www.redfin.com/NY/New-York/1240-Broadway-10001", photoCount: 24,
  },
  {
    listingId: "rf-1002", mlsId: "REBNY-2026-9140", address: "312 W 23rd St Apt 4B", city: "New York", state: "NY", zipCode: "10011",
    latitude: 40.745, longitude: -74.000, price: 890000, pricePerSqFt: 909, bedrooms: 2, bathrooms: 1,
    livingArea: 980, lotSize: null, yearBuilt: 1920, propertyType: "CONDO", listingStatus: "FOR_SALE",
    daysOnMarket: 12, priceDropPercent: null, estimatedMonthlyMortgage: 4890, walkScore: 97, transitScore: 100,
    bikeScore: 85, listingUrl: "https://www.redfin.com/NY/New-York/312-W-23rd-St-10011", photoCount: 18,
  },
];

const MOCK_MARKET_STATS: RedfinMarketStats = {
  regionId: "29470", regionName: "Manhattan, NY", medianSalePrice: 1150000,
  medianPricePerSqFt: 1320, avgDaysOnMarket: 38, totalListings: 2847, newListings: 342,
  pendingSales: 518, soldLastMonth: 421, priceDropPercent: 22.4, period: "2026-03",
};

export class RedfinAdapter extends ServiceAdapter {
  readonly name = "redfin";
  readonly description =
    "Redfin real estate data — MLS listings, market statistics, price history, and neighborhood intelligence via the Redfin Data API. Falls back to demo mode when REDFIN_API_KEY is absent.";
  readonly requiredEnvVars = ["REDFIN_API_KEY"];

  private get apiKey(): string | undefined { return process.env.REDFIN_API_KEY; }

  private readonly BASE_URL = "https://redfin-com-data.p.rapidapi.com";

  private async rfRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": this.apiKey!,
        "x-rapidapi-host": "redfin-com-data.p.rapidapi.com",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Redfin API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.rfRequest("/properties/search", { location: "New York, NY", limit: "1" });
  }

  async searchListings(location: string, maxPrice?: number, minBeds?: number, propertyType?: string): Promise<RedfinListing[]> {
    if (this.isDemoMode) return MOCK_LISTINGS;
    const params: Record<string, string> = { location };
    if (maxPrice) params.maxPrice = String(maxPrice);
    if (minBeds) params.minBeds = String(minBeds);
    if (propertyType) params.homeType = propertyType;
    const data = await this.rfRequest<{ data: { homes: Array<Record<string, unknown>> } }>("/properties/search", params);
    return (data.data?.homes ?? []).map(h => ({
      listingId: String(h.mlsId ?? ""), mlsId: h.mlsId ? String(h.mlsId) : null,
      address: String(h.streetLine ?? ""), city: String(h.city ?? ""),
      state: String(h.state ?? ""), zipCode: String(h.zip ?? ""),
      latitude: Number(h.latitude ?? 0), longitude: Number(h.longitude ?? 0),
      price: Number(h.price ?? 0), pricePerSqFt: h.pricePerSqFt ? Number(h.pricePerSqFt) : null,
      bedrooms: Number(h.beds ?? 0), bathrooms: Number(h.baths ?? 0),
      livingArea: Number(h.sqFt ?? 0), lotSize: h.lotSize ? Number(h.lotSize) : null,
      yearBuilt: h.yearBuilt ? Number(h.yearBuilt) : null,
      propertyType: String(h.propertyType ?? ""), listingStatus: String(h.status ?? ""),
      daysOnMarket: Number(h.dom ?? 0), priceDropPercent: h.priceDrop ? Number(h.priceDrop) : null,
      estimatedMonthlyMortgage: null, walkScore: null, transitScore: null, bikeScore: null,
      listingUrl: String(h.url ?? ""), photoCount: Number(h.numPhotos ?? 0),
    }));
  }

  async getMarketStats(regionId: string): Promise<RedfinMarketStats> {
    if (this.isDemoMode) return MOCK_MARKET_STATS;
    const data = await this.rfRequest<{ data: Record<string, unknown> }>("/market-stats", { region_id: regionId });
    const d = data.data;
    return {
      regionId, regionName: String(d.regionName ?? ""),
      medianSalePrice: Number(d.medianSalePrice ?? 0),
      medianPricePerSqFt: Number(d.medianPricePerSqFt ?? 0),
      avgDaysOnMarket: Number(d.avgDom ?? 0), totalListings: Number(d.totalListings ?? 0),
      newListings: Number(d.newListings ?? 0), pendingSales: Number(d.pendingSales ?? 0),
      soldLastMonth: Number(d.sold ?? 0), priceDropPercent: Number(d.priceDropPercent ?? 0),
      period: String(d.period ?? ""),
    };
  }

  getMockListings(): RedfinListing[] { return MOCK_LISTINGS; }
  getMockMarketStats(): RedfinMarketStats { return MOCK_MARKET_STATS; }
}
