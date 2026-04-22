import { ServiceAdapter } from "../base.js";

export interface CompStakLeaseComp {
  compId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  propertyType: "Office" | "Retail" | "Industrial" | "Multifamily" | "Hotel" | "Other";
  tenantName: string;
  tenantIndustry: string;
  transactionType: "New Lease" | "Renewal" | "Expansion" | "Sublease";
  leasedSqft: number;
  startingRentPerSqft: number | null;
  effectiveRentPerSqft: number | null;
  freeRentMonths: number | null;
  tenantImprovementAllowance: number | null;
  leaseTermMonths: number | null;
  leaseStartDate: string;
  leaseExpirationDate: string | null;
  floorOccupied: string | null;
  buildingClass: "Class A" | "Class B" | "Class C" | null;
  landlordName: string | null;
  submarketName: string;
}

export interface CompStakSaleComp {
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
  occupancyAtSale: number | null;
  saleDate: string;
  buyerName: string | null;
  sellerName: string | null;
  buyerType: "Institutional" | "Private Equity" | "Family Office" | "REIT" | "Owner-User" | "Other" | null;
  financeType: "All Cash" | "Conventional" | "Bridge" | "CMBS" | "Life Co" | "Other" | null;
}

export interface CompStakPropertyDetail {
  propertyId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  buildingClass: string | null;
  rentableArea: number | null;
  yearBuilt: number | null;
  stories: number | null;
  occupancyRate: number | null;
  askingRentPerSqft: number | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  recentLeaseComps: CompStakLeaseComp[];
}

const MOCK_LEASE_COMPS: CompStakLeaseComp[] = [
  {
    compId: "csk-lease-001",
    address: "1 World Trade Center",
    city: "New York",
    state: "NY",
    zipCode: "10007",
    county: "New York",
    propertyType: "Office",
    tenantName: "HPS Investment Partners",
    tenantIndustry: "Finance / Investment Management",
    transactionType: "New Lease",
    leasedSqft: 92000,
    startingRentPerSqft: 110.00,
    effectiveRentPerSqft: 98.50,
    freeRentMonths: 12,
    tenantImprovementAllowance: 250,
    leaseTermMonths: 120,
    leaseStartDate: "2026-01-01",
    leaseExpirationDate: "2035-12-31",
    floorOccupied: "65-70",
    buildingClass: "Class A",
    landlordName: "Silverstein Properties / The Durst Organization",
    submarketName: "Downtown Manhattan",
  },
  {
    compId: "csk-lease-002",
    address: "330 Hudson St",
    city: "New York",
    state: "NY",
    zipCode: "10013",
    county: "New York",
    propertyType: "Office",
    tenantName: "Dentsu International",
    tenantIndustry: "Advertising / Marketing",
    transactionType: "Renewal",
    leasedSqft: 248000,
    startingRentPerSqft: 74.00,
    effectiveRentPerSqft: 68.00,
    freeRentMonths: 18,
    tenantImprovementAllowance: 180,
    leaseTermMonths: 84,
    leaseStartDate: "2025-10-01",
    leaseExpirationDate: "2032-09-30",
    floorOccupied: "5-14",
    buildingClass: "Class A",
    landlordName: "Beacon Capital Partners",
    submarketName: "Hudson Square",
  },
  {
    compId: "csk-lease-003",
    address: "1 Metrotech Center",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11201",
    county: "Kings",
    propertyType: "Office",
    tenantName: "Fidelity Investments",
    tenantIndustry: "Finance / Asset Management",
    transactionType: "Expansion",
    leasedSqft: 38500,
    startingRentPerSqft: 58.00,
    effectiveRentPerSqft: 54.00,
    freeRentMonths: 6,
    tenantImprovementAllowance: 120,
    leaseTermMonths: 60,
    leaseStartDate: "2025-07-01",
    leaseExpirationDate: "2030-06-30",
    floorOccupied: "8-9",
    buildingClass: "Class A",
    landlordName: "Forest City / Brookfield",
    submarketName: "Brooklyn Heights / Downtown Brooklyn",
  },
  {
    compId: "csk-lease-004",
    address: "55-15 Queens Blvd",
    city: "Woodside",
    state: "NY",
    zipCode: "11377",
    county: "Queens",
    propertyType: "Industrial",
    tenantName: "Amazon Logistics",
    tenantIndustry: "E-Commerce / Logistics",
    transactionType: "New Lease",
    leasedSqft: 142000,
    startingRentPerSqft: 32.00,
    effectiveRentPerSqft: 32.00,
    freeRentMonths: 3,
    tenantImprovementAllowance: 45,
    leaseTermMonths: 84,
    leaseStartDate: "2025-11-01",
    leaseExpirationDate: "2032-10-31",
    floorOccupied: "1",
    buildingClass: "Class B",
    landlordName: "Queens Industrial Partners LLC",
    submarketName: "Queens Industrial",
  },
  {
    compId: "csk-lease-005",
    address: "890 River Ave",
    city: "Bronx",
    state: "NY",
    zipCode: "10452",
    county: "Bronx",
    propertyType: "Retail",
    tenantName: "BJ's Wholesale Club",
    tenantIndustry: "Retail / Wholesale",
    transactionType: "New Lease",
    leasedSqft: 95000,
    startingRentPerSqft: 35.00,
    effectiveRentPerSqft: 35.00,
    freeRentMonths: 0,
    tenantImprovementAllowance: 85,
    leaseTermMonths: 240,
    leaseStartDate: "2025-09-15",
    leaseExpirationDate: "2045-09-14",
    floorOccupied: "1",
    buildingClass: "Class B",
    landlordName: "Bronx River Properties",
    submarketName: "South Bronx Retail",
  },
  {
    compId: "csk-lease-006",
    address: "222 W 14th St",
    city: "New York",
    state: "NY",
    zipCode: "10011",
    county: "New York",
    propertyType: "Office",
    tenantName: "Warby Parker Inc.",
    tenantIndustry: "Consumer / E-Commerce",
    transactionType: "Sublease",
    leasedSqft: 22000,
    startingRentPerSqft: 65.00,
    effectiveRentPerSqft: 65.00,
    freeRentMonths: 0,
    tenantImprovementAllowance: null,
    leaseTermMonths: 36,
    leaseStartDate: "2026-02-01",
    leaseExpirationDate: "2029-01-31",
    floorOccupied: "4-5",
    buildingClass: "Class B",
    landlordName: "Chelsea Properties Group",
    submarketName: "Chelsea / Meatpacking",
  },
];

const MOCK_SALE_COMPS: CompStakSaleComp[] = [
  {
    compId: "csk-sale-001",
    address: "601 W 26th St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    propertyType: "Mixed-Use",
    rentableArea: 680000,
    salePrice: 975000000,
    pricePerSqft: 1434,
    capRate: 4.6,
    occupancyAtSale: 87.5,
    saleDate: "2025-08-20",
    buyerName: "Equity Commonwealth",
    sellerName: "RFR Holding",
    buyerType: "REIT",
    financeType: "CMBS",
  },
  {
    compId: "csk-sale-002",
    address: "175 Water St",
    city: "New York",
    state: "NY",
    zipCode: "10038",
    propertyType: "Office",
    rentableArea: 380000,
    salePrice: 310000000,
    pricePerSqft: 816,
    capRate: 5.9,
    occupancyAtSale: 71.0,
    saleDate: "2025-10-05",
    buyerName: "Northbridge Capital",
    sellerName: "L&L Holding Company",
    buyerType: "Private Equity",
    financeType: "Bridge",
  },
  {
    compId: "csk-sale-003",
    address: "50 Bridge St",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11201",
    propertyType: "Multifamily",
    rentableArea: 285000,
    salePrice: 148000000,
    pricePerSqft: 519,
    capRate: 5.4,
    occupancyAtSale: 96.8,
    saleDate: "2025-12-12",
    buyerName: "Brooklyn Heights Capital",
    sellerName: "Fortis Property Group",
    buyerType: "Institutional",
    financeType: "Life Co",
  },
];

export class CompStakAdapter extends ServiceAdapter {
  readonly name = "compstak";
  readonly description =
    "CompStak commercial real estate lease and sale comps — NYC office, retail, industrial, and multifamily transaction data from broker-sourced exchange. Demo mode provides realistic NYC comp data.";
  readonly requiredEnvVars = [
    "COMPSTAK_API_KEY",
    "COMPSTAK_API_SECRET",
  ];

  private get apiKey(): string | undefined {
    return process.env.COMPSTAK_API_KEY;
  }

  private get apiSecret(): string | undefined {
    return process.env.COMPSTAK_API_SECRET;
  }

  private get baseUrl(): string {
    return process.env.COMPSTAK_BASE_URL ?? "https://api.compstak.com/api/v1";
  }

  private get authHeader(): string {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64");
    return `Basic ${credentials}`;
  }

  private async compstakRequest(path: string, params?: Record<string, string>): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        "User-Agent": "Terra-RealEstateIntelligence/1.0",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      throw new Error(`CompStak API error: HTTP ${response.status} — ${path}`);
    }

    return response.json();
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.compstakRequest("/leasecomps/search", { market: "New York", size: "1" });
  }

  async getLeaseComps(params: {
    market?: string;
    propertyType?: string;
    submarketName?: string;
    startDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<CompStakLeaseComp[]> {
    if (!this.isLive) {
      let comps = [...MOCK_LEASE_COMPS];
      if (params.propertyType) {
        comps = comps.filter(c => c.propertyType.toLowerCase() === params.propertyType?.toLowerCase());
      }
      if (params.limit) comps = comps.slice(params.offset ?? 0, (params.offset ?? 0) + params.limit);
      return comps;
    }

    const data = (await this.compstakRequest("/leasecomps/search", {
      market: params.market ?? "New York",
      ...(params.propertyType ? { propertyType: params.propertyType } : {}),
      ...(params.submarketName ? { submarket: params.submarketName } : {}),
      ...(params.startDate ? { transactionDateFrom: params.startDate } : {}),
      size: String(params.limit ?? 50),
      from: String(params.offset ?? 0),
    })) as { comps?: unknown[] };

    return (data.comps ?? []) as CompStakLeaseComp[];
  }

  async getSaleComps(params: {
    market?: string;
    propertyType?: string;
    startDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<CompStakSaleComp[]> {
    if (!this.isLive) {
      let comps = [...MOCK_SALE_COMPS];
      if (params.propertyType) {
        comps = comps.filter(c => c.propertyType.toLowerCase() === params.propertyType?.toLowerCase());
      }
      if (params.limit) comps = comps.slice(params.offset ?? 0, (params.offset ?? 0) + params.limit);
      return comps;
    }

    const data = (await this.compstakRequest("/salecomps/search", {
      market: params.market ?? "New York",
      ...(params.propertyType ? { propertyType: params.propertyType } : {}),
      ...(params.startDate ? { saleDateFrom: params.startDate } : {}),
      size: String(params.limit ?? 50),
      from: String(params.offset ?? 0),
    })) as { comps?: unknown[] };

    return (data.comps ?? []) as CompStakSaleComp[];
  }

  async getPropertyDetail(propertyId: string): Promise<CompStakPropertyDetail | null> {
    if (!this.isLive) {
      const mockProperty = MOCK_LEASE_COMPS.find(c => c.compId === propertyId);
      if (!mockProperty) return null;
      return {
        propertyId,
        address: mockProperty.address,
        city: mockProperty.city,
        state: mockProperty.state,
        zipCode: mockProperty.zipCode,
        propertyType: mockProperty.propertyType,
        buildingClass: mockProperty.buildingClass,
        rentableArea: mockProperty.leasedSqft * 3,
        yearBuilt: 2005,
        stories: 20,
        occupancyRate: 85,
        askingRentPerSqft: mockProperty.startingRentPerSqft,
        lastSalePrice: null,
        lastSaleDate: null,
        recentLeaseComps: [mockProperty],
      };
    }

    const data = (await this.compstakRequest(`/properties/${propertyId}`)) as CompStakPropertyDetail | null;
    return data;
  }

  getMockLeaseComps(): CompStakLeaseComp[] {
    return [...MOCK_LEASE_COMPS];
  }

  getMockSaleComps(): CompStakSaleComp[] {
    return [...MOCK_SALE_COMPS];
  }
}
