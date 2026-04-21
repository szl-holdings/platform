import { ServiceAdapter } from "../base.js";

export interface CoStarProperty {
  propertyId: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: "Office" | "Retail" | "Industrial" | "Multifamily" | "Hotel" | "Land" | "Mixed-Use" | "Other";
  buildingClass: "Class A" | "Class B" | "Class C" | null;
  rentableArea: number | null;
  yearBuilt: number | null;
  stories: number | null;
  units: number | null;
  parkingSpaces: number | null;
  occupancyRate: number | null;
  marketVacancyRate: number | null;
  askingRentPerSqft: number | null;
  effectiveRentPerSqft: number | null;
  capRate: number | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  tenants: Array<{
    tenantName: string;
    leaseExpiration: string;
    leasedSqft: number;
    floorOccupied: string;
  }>;
  submarketName: string;
  ownerName: string | null;
  ownerType: string | null;
}

export interface CoStarMarketStats {
  submarket: string;
  propertyType: string;
  vacancyRate: number;
  netAbsorptionSqft: number;
  avgAskingRentPerSqft: number;
  completionsSqft: number;
  underConstructionSqft: number;
  capRateAvg: number;
  pricePerSqft: number;
  salesVolume: number;
  period: string;
}

export interface CoStarSaleComp {
  compId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  rentableArea: number | null;
  salePrice: number;
  pricePerSqft: number | null;
  capRate: number | null;
  saleDate: string;
  buyerName: string | null;
  sellerName: string | null;
}

const MOCK_COSTAR_PROPERTIES: CoStarProperty[] = [
  {
    propertyId: "cs-nyc-001",
    propertyName: "1600 Broadway",
    address: "1600 Broadway",
    city: "New York",
    state: "NY",
    zipCode: "10019",
    county: "New York",
    latitude: 40.7625,
    longitude: -73.9841,
    propertyType: "Office",
    buildingClass: "Class B",
    rentableArea: 148000,
    yearBuilt: 1971,
    stories: 20,
    units: null,
    parkingSpaces: null,
    occupancyRate: 72.4,
    marketVacancyRate: 21.8,
    askingRentPerSqft: 62.50,
    effectiveRentPerSqft: 54.00,
    capRate: 5.8,
    lastSalePrice: 185000000,
    lastSaleDate: "2021-08-15",
    tenants: [
      { tenantName: "Creative Media Group", leaseExpiration: "2026-12-31", leasedSqft: 18500, floorOccupied: "5-6" },
      { tenantName: "Allied Financial Partners", leaseExpiration: "2027-06-30", leasedSqft: 12000, floorOccupied: "12" },
    ],
    submarketName: "Midtown West",
    ownerName: "Broadway Properties LLC",
    ownerType: "LLC",
  },
  {
    propertyId: "cs-nyc-002",
    propertyName: "345 Park Ave South",
    address: "345 Park Ave South",
    city: "New York",
    state: "NY",
    zipCode: "10010",
    county: "New York",
    latitude: 40.7428,
    longitude: -73.9819,
    propertyType: "Office",
    buildingClass: "Class A",
    rentableArea: 390000,
    yearBuilt: 1963,
    stories: 29,
    units: null,
    parkingSpaces: null,
    occupancyRate: 88.2,
    marketVacancyRate: 14.1,
    askingRentPerSqft: 89.00,
    effectiveRentPerSqft: 82.00,
    capRate: 4.7,
    lastSalePrice: 590000000,
    lastSaleDate: "2022-03-10",
    tenants: [
      { tenantName: "Global Tech Corp", leaseExpiration: "2029-03-31", leasedSqft: 85000, floorOccupied: "15-19" },
      { tenantName: "Law Partners LLP", leaseExpiration: "2027-09-30", leasedSqft: 42000, floorOccupied: "22-23" },
      { tenantName: "Venture Capital Fund IV", leaseExpiration: "2028-12-31", leasedSqft: 28500, floorOccupied: "24" },
    ],
    submarketName: "Midtown South",
    ownerName: "Park Avenue REIT",
    ownerType: "REIT",
  },
  {
    propertyId: "cs-bk-001",
    propertyName: "Industry City Building 1",
    address: "220 36th St",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11232",
    county: "Kings",
    latitude: 40.6572,
    longitude: -74.0059,
    propertyType: "Industrial",
    buildingClass: "Class B",
    rentableArea: 240000,
    yearBuilt: 1895,
    stories: 6,
    units: null,
    parkingSpaces: 120,
    occupancyRate: 94.5,
    marketVacancyRate: 6.2,
    askingRentPerSqft: 38.00,
    effectiveRentPerSqft: 36.50,
    capRate: 5.2,
    lastSalePrice: null,
    lastSaleDate: null,
    tenants: [
      { tenantName: "Artisan Foods Co", leaseExpiration: "2028-06-30", leasedSqft: 35000, floorOccupied: "1-2" },
      { tenantName: "Creative Studio Hub", leaseExpiration: "2026-12-31", leasedSqft: 28000, floorOccupied: "3" },
    ],
    submarketName: "Sunset Park Industrial",
    ownerName: "Industry City Associates",
    ownerType: "Partnership",
  },
  {
    propertyId: "cs-qns-001",
    propertyName: "Queens Center Mall",
    address: "90-15 Queens Blvd",
    city: "Elmhurst",
    state: "NY",
    zipCode: "11373",
    county: "Queens",
    latitude: 40.7340,
    longitude: -73.8718,
    propertyType: "Retail",
    buildingClass: "Class A",
    rentableArea: 1100000,
    yearBuilt: 1973,
    stories: 3,
    units: null,
    parkingSpaces: 2800,
    occupancyRate: 91.2,
    marketVacancyRate: 8.9,
    askingRentPerSqft: 95.00,
    effectiveRentPerSqft: 88.00,
    capRate: 5.5,
    lastSalePrice: 1250000000,
    lastSaleDate: "2020-11-20",
    tenants: [
      { tenantName: "Macy's", leaseExpiration: "2030-12-31", leasedSqft: 265000, floorOccupied: "All Floors" },
      { tenantName: "JCPenney", leaseExpiration: "2028-06-30", leasedSqft: 192000, floorOccupied: "All Floors" },
    ],
    submarketName: "Queens Boulevard Retail",
    ownerName: "Macerich Company",
    ownerType: "REIT",
  },
  {
    propertyId: "cs-bx-001",
    propertyName: "Port Morris Distribution Center",
    address: "800 Exterior St",
    city: "Bronx",
    state: "NY",
    zipCode: "10451",
    county: "Bronx",
    latitude: 40.8080,
    longitude: -73.9238,
    propertyType: "Industrial",
    buildingClass: "Class B",
    rentableArea: 185000,
    yearBuilt: 1988,
    stories: 2,
    units: null,
    parkingSpaces: 85,
    occupancyRate: 100,
    marketVacancyRate: 3.8,
    askingRentPerSqft: 28.00,
    effectiveRentPerSqft: 28.00,
    capRate: 5.8,
    lastSalePrice: 42000000,
    lastSaleDate: "2023-05-08",
    tenants: [
      { tenantName: "Regional Logistics Corp", leaseExpiration: "2031-12-31", leasedSqft: 185000, floorOccupied: "Full Building" },
    ],
    submarketName: "South Bronx Industrial",
    ownerName: "Bronx Industrial Holdings LLC",
    ownerType: "LLC",
  },
];

const MOCK_MARKET_STATS: CoStarMarketStats[] = [
  { submarket: "Midtown Manhattan", propertyType: "Office", vacancyRate: 18.4, netAbsorptionSqft: -245000, avgAskingRentPerSqft: 98.50, completionsSqft: 0, underConstructionSqft: 1200000, capRateAvg: 5.1, pricePerSqft: 1250, salesVolume: 2100000000, period: "Q4 2025" },
  { submarket: "Midtown South", propertyType: "Office", vacancyRate: 14.1, netAbsorptionSqft: 85000, avgAskingRentPerSqft: 82.00, completionsSqft: 350000, underConstructionSqft: 800000, capRateAvg: 4.8, pricePerSqft: 1050, salesVolume: 780000000, period: "Q4 2025" },
  { submarket: "Brooklyn Industrial", propertyType: "Industrial", vacancyRate: 5.8, netAbsorptionSqft: 320000, avgAskingRentPerSqft: 35.50, completionsSqft: 410000, underConstructionSqft: 650000, capRateAvg: 5.0, pricePerSqft: 420, salesVolume: 540000000, period: "Q4 2025" },
  { submarket: "Queens Boulevard", propertyType: "Retail", vacancyRate: 9.2, netAbsorptionSqft: 42000, avgAskingRentPerSqft: 78.00, completionsSqft: 0, underConstructionSqft: 85000, capRateAvg: 5.6, pricePerSqft: 680, salesVolume: 320000000, period: "Q4 2025" },
];

const MOCK_SALE_COMPS: CoStarSaleComp[] = [
  { compId: "cs-comp-001", address: "299 Park Ave", city: "New York", state: "NY", zipCode: "10171", propertyType: "Office", rentableArea: 1250000, salePrice: 1800000000, pricePerSqft: 1440, capRate: 4.2, saleDate: "2025-11-15", buyerName: "Sovereign Wealth Fund III", sellerName: "Park Avenue Partners" },
  { compId: "cs-comp-002", address: "555 W 34th St", city: "New York", state: "NY", zipCode: "10001", propertyType: "Industrial", rentableArea: 520000, salePrice: 285000000, pricePerSqft: 548, capRate: 5.1, saleDate: "2025-10-22", buyerName: "Prologis NYC Fund", sellerName: "Hudson Yards Industrial LLC" },
  { compId: "cs-comp-003", address: "180 Atlantic Ave", city: "Brooklyn", state: "NY", zipCode: "11201", propertyType: "Retail", rentableArea: 42000, salePrice: 38500000, pricePerSqft: 917, capRate: 5.8, saleDate: "2025-09-14", buyerName: "Brooklyn Retail Partners", sellerName: "Atlantic Properties Group" },
  { compId: "cs-comp-004", address: "3250 Grand Concourse", city: "Bronx", state: "NY", zipCode: "10468", propertyType: "Multifamily", rentableArea: 185000, salePrice: 62000000, pricePerSqft: 335, capRate: 6.2, saleDate: "2025-12-01", buyerName: "Bronx Multifamily LLC", sellerName: "Grand Concourse Holdings" },
];

export class CoStarAdapter extends ServiceAdapter {
  readonly name = "costar";
  readonly description =
    "CoStar Group commercial real estate intelligence — property data, tenant rolls, lease expirations, comparable sales, and submarket analytics. Demo mode provides realistic NYC commercial data.";
  readonly requiredEnvVars = [
    "COSTAR_API_KEY",
    "COSTAR_CLIENT_ID",
  ];

  private get apiKey(): string | undefined {
    return process.env["COSTAR_API_KEY"];
  }

  private get clientId(): string | undefined {
    return process.env["COSTAR_CLIENT_ID"];
  }

  private get baseUrl(): string {
    return process.env["COSTAR_BASE_URL"] ?? "https://api.costar.com/information/v2";
  }

  private async costarRequest(path: string, params?: Record<string, string>): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": this.apiKey!,
        "x-client-id": this.clientId!,
        Accept: "application/json",
        "User-Agent": "Terra-RealEstateIntelligence/1.0",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      throw new Error(`CoStar API error: HTTP ${response.status} — ${path}`);
    }

    return response.json();
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.costarRequest("/property/search", { market: "NewYork", maxResults: "1" });
  }

  async getProperties(params: {
    market?: string;
    propertyType?: string;
    submarket?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<CoStarProperty[]> {
    if (!this.isLive) {
      let results = [...MOCK_COSTAR_PROPERTIES];
      if (params.propertyType) {
        results = results.filter(p => p.propertyType.toLowerCase() === params.propertyType!.toLowerCase());
      }
      if (params.limit) results = results.slice(params.offset ?? 0, (params.offset ?? 0) + params.limit);
      return results;
    }

    const data = (await this.costarRequest("/property/search", {
      market: params.market ?? "NewYork",
      ...(params.propertyType ? { propertyType: params.propertyType } : {}),
      ...(params.submarket ? { submarket: params.submarket } : {}),
      maxResults: String(params.limit ?? 50),
      startIndex: String(params.offset ?? 0),
    })) as { results?: unknown[] };

    return (data.results ?? []) as CoStarProperty[];
  }

  async getMarketStats(market: string, propertyType?: string): Promise<CoStarMarketStats[]> {
    if (!this.isLive) {
      let stats = [...MOCK_MARKET_STATS];
      if (propertyType) {
        stats = stats.filter(s => s.propertyType.toLowerCase() === propertyType.toLowerCase());
      }
      return stats;
    }

    const data = (await this.costarRequest("/market/statistics", {
      market,
      ...(propertyType ? { propertyType } : {}),
    })) as { submarkets?: unknown[] };

    return (data.submarkets ?? []) as CoStarMarketStats[];
  }

  async getSaleComps(params: {
    market?: string;
    propertyType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<CoStarSaleComp[]> {
    if (!this.isLive) {
      let comps = [...MOCK_SALE_COMPS];
      if (params.propertyType) {
        comps = comps.filter(c => c.propertyType.toLowerCase() === params.propertyType!.toLowerCase());
      }
      if (params.limit) comps = comps.slice(0, params.limit);
      return comps;
    }

    const data = (await this.costarRequest("/comps/sale", {
      market: params.market ?? "NewYork",
      ...(params.propertyType ? { propertyType: params.propertyType } : {}),
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
      maxResults: String(params.limit ?? 50),
    })) as { comps?: unknown[] };

    return (data.comps ?? []) as CoStarSaleComp[];
  }

  getMockProperties(): CoStarProperty[] {
    return [...MOCK_COSTAR_PROPERTIES];
  }

  getMockMarketStats(): CoStarMarketStats[] {
    return [...MOCK_MARKET_STATS];
  }

  getMockSaleComps(): CoStarSaleComp[] {
    return [...MOCK_SALE_COMPS];
  }
}
