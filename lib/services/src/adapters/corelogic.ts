import { ServiceAdapter } from "../base.js";

export interface CoreLogicPropertyRecord {
  apn: string;
  fipsCode: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  ownerName: string;
  ownerAddress: string | null;
  landUse: string;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  livingArea: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  assessedValue: number | null;
  marketValue: number | null;
  assessedYear: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  mortgageAmount: number | null;
  mortgageLender: string | null;
  foreclosureStatus: string | null;
  avm: number | null;
}

export interface CoreLogicFloodZone {
  address: string;
  floodZone: string;
  floodZoneDescription: string;
  panelNumber: string;
  effectiveDate: string;
  inSpecialFloodHazardArea: boolean;
}

const MOCK_PROPERTIES: CoreLogicPropertyRecord[] = [
  {
    apn: "4015-001-028", fipsCode: "36081", address: "1890 Adam Clayton Powell Blvd",
    city: "New York", state: "NY", zipCode: "10026", latitude: 40.805, longitude: -73.951,
    ownerName: "R&B HOLDING CORP", ownerAddress: "PO BOX 4521, NEW YORK NY 10037",
    landUse: "Mixed Residential and Commercial", propertyType: "MIXED_USE",
    bedrooms: null, bathrooms: null, livingArea: 5400, lotSize: 3200, yearBuilt: 1947,
    assessedValue: 1280000, marketValue: 1600000, assessedYear: 2025,
    lastSaleDate: "2015-03-12", lastSalePrice: 950000, mortgageAmount: 780000,
    mortgageLender: "CHASE BANK NA", foreclosureStatus: "LIS_PENDENS", avm: 1610000,
  },
  {
    apn: "1008-042-015", fipsCode: "36061", address: "45 Warren St",
    city: "New York", state: "NY", zipCode: "10007", latitude: 40.714, longitude: -74.008,
    ownerName: "W.CAPITAL PARTNERS LLC", ownerAddress: "1 WORLD TRADE CTR FL 85, NY 10007",
    landUse: "Multi-Family Dwelling", propertyType: "MULTI_FAMILY",
    bedrooms: 12, bathrooms: 8, livingArea: 8200, lotSize: 2500, yearBuilt: 1928,
    assessedValue: 3840000, marketValue: 4800000, assessedYear: 2025,
    lastSaleDate: "2013-08-22", lastSalePrice: 2600000, mortgageAmount: 2100000,
    mortgageLender: "NEW YORK COMMUNITY BANK", foreclosureStatus: null, avm: 4820000,
  },
];

export class CoreLogicAdapter extends ServiceAdapter {
  readonly name = "corelogic";
  readonly description =
    "CoreLogic property data platform — AVM, ownership records, tax assessment, foreclosure status, flood zones, and comprehensive property history. Enterprise API. Falls back to demo mode when CORELOGIC_API_KEY is absent.";
  readonly requiredEnvVars = ["CORELOGIC_API_KEY", "CORELOGIC_CLIENT_ID"];

  private get apiKey(): string | undefined { return process.env.CORELOGIC_API_KEY; }
  private get clientId(): string | undefined { return process.env.CORELOGIC_CLIENT_ID; }

  private readonly BASE_URL = "https://api.corelogic.com/property/v2";

  private async clRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "X-Client-Id": this.clientId ?? "",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`CoreLogic API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.clRequest("/properties", { address: "123 Main St", city: "New York", state: "NY", limit: "1" });
  }

  async searchProperties(address: string, city: string, state: string): Promise<CoreLogicPropertyRecord[]> {
    if (this.isDemoMode) return MOCK_PROPERTIES;
    const data = await this.clRequest<{ properties: Array<Record<string, unknown>> }>("/properties", { address, city, state });
    return (data.properties ?? []).map(p => ({
      apn: String(p.apn ?? ""), fipsCode: String(p.fipsCode ?? ""),
      address: String(p.address ?? ""), city: String(p.city ?? ""),
      state: String(p.state ?? ""), zipCode: String(p.zipCode ?? ""),
      latitude: Number(p.latitude ?? 0), longitude: Number(p.longitude ?? 0),
      ownerName: String(p.ownerName ?? ""), ownerAddress: p.ownerAddress ? String(p.ownerAddress) : null,
      landUse: String(p.landUse ?? ""), propertyType: String(p.propertyType ?? ""),
      bedrooms: p.bedrooms ? Number(p.bedrooms) : null,
      bathrooms: p.bathrooms ? Number(p.bathrooms) : null,
      livingArea: p.livingArea ? Number(p.livingArea) : null,
      lotSize: p.lotSize ? Number(p.lotSize) : null,
      yearBuilt: p.yearBuilt ? Number(p.yearBuilt) : null,
      assessedValue: p.assessedValue ? Number(p.assessedValue) : null,
      marketValue: p.marketValue ? Number(p.marketValue) : null,
      assessedYear: p.assessedYear ? Number(p.assessedYear) : null,
      lastSaleDate: p.lastSaleDate ? String(p.lastSaleDate) : null,
      lastSalePrice: p.lastSalePrice ? Number(p.lastSalePrice) : null,
      mortgageAmount: p.mortgageAmount ? Number(p.mortgageAmount) : null,
      mortgageLender: p.mortgageLender ? String(p.mortgageLender) : null,
      foreclosureStatus: p.foreclosureStatus ? String(p.foreclosureStatus) : null,
      avm: p.avm ? Number(p.avm) : null,
    }));
  }

  async getFloodZone(address: string, city: string, state: string, zip: string): Promise<CoreLogicFloodZone | null> {
    if (this.isDemoMode) {
      return { address, floodZone: "X", floodZoneDescription: "Area of minimal flood hazard", panelNumber: "36081C0306H", effectiveDate: "2021-09-02", inSpecialFloodHazardArea: false };
    }
    const data = await this.clRequest<{ floodZone: Record<string, unknown> }>("/flood-zone", { address, city, state, zipCode: zip });
    const fz = data.floodZone;
    return {
      address, floodZone: String(fz.zone ?? ""), floodZoneDescription: String(fz.description ?? ""),
      panelNumber: String(fz.panelNumber ?? ""), effectiveDate: String(fz.effectiveDate ?? ""),
      inSpecialFloodHazardArea: Boolean(fz.inSFHA),
    };
  }

  getMockProperties(): CoreLogicPropertyRecord[] {
    return MOCK_PROPERTIES;
  }
}
