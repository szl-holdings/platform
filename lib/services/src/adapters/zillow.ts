import { ServiceAdapter } from "../base.js";

export interface ZillowZestimate {
  zpid: string;
  address: string;
  zestimate: number;
  zestimateLow: number;
  zestimateHigh: number;
  rentZestimate: number | null;
  lastUpdated: string;
  changePercent30Day: number | null;
  changePercent1Year: number | null;
}

export interface ZillowPropertyDetails {
  zpid: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  lotSize: number | null;
  yearBuilt: number | null;
  propertyType: string;
  listingStatus: string;
  listingPrice: number | null;
  zestimate: ZillowZestimate;
  latitude: number;
  longitude: number;
  taxAssessedValue: number | null;
  taxAssessedYear: number | null;
  priceHistory: Array<{ date: string; price: number; event: string }>;
}

export interface ZillowSearchResult {
  zpid: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  propertyType: string;
  listingStatus: string;
  zestimate: number | null;
  imageUrl: string | null;
  daysOnMarket: number | null;
}

const MOCK_PROPERTIES: ZillowPropertyDetails[] = [
  {
    zpid: "88271895", address: "847 Park Ave, Queens, NY 11354",
    city: "Queens", state: "NY", zipCode: "11354",
    bedrooms: 3, bathrooms: 2, livingArea: 1450, lotSize: 2000, yearBuilt: 1962,
    propertyType: "SINGLE_FAMILY", listingStatus: "PRE_FORECLOSURE", listingPrice: null,
    zestimate: { zpid: "88271895", address: "847 Park Ave", zestimate: 2100000, zestimateLow: 1890000, zestimateHigh: 2310000, rentZestimate: 4200, lastUpdated: "2026-04-10", changePercent30Day: -2.1, changePercent1Year: -4.3 },
    latitude: 40.723, longitude: -73.842, taxAssessedValue: 1680000, taxAssessedYear: 2025,
    priceHistory: [{ date: "2025-06-01", price: 2280000, event: "Listed" }, { date: "2025-08-15", price: 2190000, event: "Price Change" }, { date: "2025-11-20", price: 2100000, event: "Price Change" }],
  },
  {
    zpid: "76512340", address: "312 W 23rd St, New York, NY 10011",
    city: "New York", state: "NY", zipCode: "10011",
    bedrooms: 2, bathrooms: 1, livingArea: 980, lotSize: null, yearBuilt: 1920,
    propertyType: "CONDO", listingStatus: "FOR_SALE", listingPrice: 890000,
    zestimate: { zpid: "76512340", address: "312 W 23rd St", zestimate: 895000, zestimateLow: 806000, zestimateHigh: 984000, rentZestimate: 3800, lastUpdated: "2026-04-12", changePercent30Day: 0.6, changePercent1Year: 2.1 },
    latitude: 40.745, longitude: -74.000, taxAssessedValue: 714000, taxAssessedYear: 2025,
    priceHistory: [{ date: "2026-03-15", price: 895000, event: "Listed" }],
  },
];

export class ZillowAdapter extends ServiceAdapter {
  readonly name = "zillow";
  readonly description =
    "Zillow / Zestimate API (via Zillow Bridge API or RapidAPI) — property valuations, Zestimates, market data, and listing intelligence. Falls back to demo mode when ZILLOW_API_KEY is absent.";
  readonly requiredEnvVars = ["ZILLOW_API_KEY"];

  private get apiKey(): string | undefined {
    return process.env["ZILLOW_API_KEY"];
  }

  private readonly BASE_URL = "https://zillow-com1.p.rapidapi.com";

  private async zRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": this.apiKey!,
        "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Zillow API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.zRequest("/property", { zpid: "88271895" });
  }

  async getPropertyDetails(zpid: string): Promise<ZillowPropertyDetails | null> {
    if (this.isDemoMode) return MOCK_PROPERTIES.find(p => p.zpid === zpid) ?? MOCK_PROPERTIES[0] ?? null;
    const data = await this.zRequest<Record<string, unknown>>("/property", { zpid });
    const zest = (data["zestimate"] as number) ?? 0;
    return {
      zpid: zpid,
      address: String(data["address"] ?? ""),
      city: String((data["address"] as Record<string, unknown>)?.["city"] ?? ""),
      state: String((data["address"] as Record<string, unknown>)?.["state"] ?? ""),
      zipCode: String((data["address"] as Record<string, unknown>)?.["zipcode"] ?? ""),
      bedrooms: Number(data["bedrooms"] ?? 0),
      bathrooms: Number(data["bathrooms"] ?? 0),
      livingArea: Number(data["livingArea"] ?? 0),
      lotSize: data["lotSize"] ? Number(data["lotSize"]) : null,
      yearBuilt: data["yearBuilt"] ? Number(data["yearBuilt"]) : null,
      propertyType: String(data["propertyType"] ?? ""),
      listingStatus: String(data["homeStatus"] ?? ""),
      listingPrice: data["price"] ? Number(data["price"]) : null,
      zestimate: { zpid, address: String(data["address"] ?? ""), zestimate: zest, zestimateLow: zest * 0.9, zestimateHigh: zest * 1.1, rentZestimate: data["rentZestimate"] ? Number(data["rentZestimate"]) : null, lastUpdated: new Date().toISOString().split("T")[0]!, changePercent30Day: null, changePercent1Year: null },
      latitude: Number(data["latitude"] ?? 0),
      longitude: Number(data["longitude"] ?? 0),
      taxAssessedValue: data["taxAssessedValue"] ? Number(data["taxAssessedValue"]) : null,
      taxAssessedYear: data["taxAssessedYear"] ? Number(data["taxAssessedYear"]) : null,
      priceHistory: [],
    };
  }

  async searchProperties(query: string, maxResults = 10): Promise<ZillowSearchResult[]> {
    if (this.isDemoMode) {
      return MOCK_PROPERTIES.map(p => ({
        zpid: p.zpid, address: p.address, price: p.listingPrice ?? p.zestimate.zestimate,
        bedrooms: p.bedrooms, bathrooms: p.bathrooms, livingArea: p.livingArea,
        propertyType: p.propertyType, listingStatus: p.listingStatus,
        zestimate: p.zestimate.zestimate, imageUrl: null, daysOnMarket: null,
      }));
    }
    const data = await this.zRequest<{ props: Array<Record<string, unknown>> }>("/propertyExtendedSearch", { location: query, status_type: "ForSale" });
    return (data.props ?? []).slice(0, maxResults).map(p => ({
      zpid: String(p["zpid"] ?? ""), address: String(p["address"] ?? ""),
      price: Number(p["price"] ?? 0), bedrooms: Number(p["bedrooms"] ?? 0),
      bathrooms: Number(p["bathrooms"] ?? 0), livingArea: Number(p["livingArea"] ?? 0),
      propertyType: String(p["propertyType"] ?? ""), listingStatus: String(p["listingStatus"] ?? ""),
      zestimate: p["zestimate"] ? Number(p["zestimate"]) : null,
      imageUrl: p["imgSrc"] ? String(p["imgSrc"]) : null,
      daysOnMarket: p["daysOnMarket"] ? Number(p["daysOnMarket"]) : null,
    }));
  }

  getMockProperties(): ZillowPropertyDetails[] {
    return MOCK_PROPERTIES;
  }
}
