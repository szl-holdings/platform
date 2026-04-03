import { ServiceAdapter } from "../base.js";

export interface MlsListing {
  listingKey: string;
  listingId: string;
  standardStatus: "Active" | "Pending" | "Closed" | "Expired" | "Withdrawn" | "Coming Soon";
  listPrice: number;
  originalListPrice: number;
  address: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: "Residential" | "Residential Income" | "Commercial Sale" | "Commercial Lease" | "Land" | "Other";
  propertySubType: string;
  bedroomsTotal: number | null;
  bathroomsTotalInteger: number | null;
  livingArea: number | null;
  lotSizeSquareFeet: number | null;
  yearBuilt: number | null;
  daysOnMarket: number;
  modificationTimestamp: string;
  listingContractDate: string;
  media: Array<{ mediaUrl: string; mediaType: string; order: number }>;
  listAgentFullName: string;
  listOfficeName: string;
  publicRemarks: string;
  mlsName: string;
}

export interface ODataQueryParams {
  filter?: string;
  select?: string[];
  top?: number;
  skip?: number;
  orderby?: string;
  expand?: string[];
  count?: boolean;
}

export interface MlsIncrementalSyncResult {
  fetched: number;
  upserted: number;
  errors: number;
  lastModificationTimestamp: string | null;
}

const MOCK_MLS_LISTINGS: MlsListing[] = [
  {
    listingKey: "mls-rbny-2024001",
    listingId: "RBN-2024-001",
    standardStatus: "Active",
    listPrice: 2850000,
    originalListPrice: 2950000,
    address: "425 W 53rd St, Unit 12A",
    city: "New York",
    stateOrProvince: "NY",
    postalCode: "10019",
    county: "New York",
    latitude: 40.7649,
    longitude: -73.9903,
    propertyType: "Residential",
    propertySubType: "Condominium",
    bedroomsTotal: 3,
    bathroomsTotalInteger: 2,
    livingArea: 1840,
    lotSizeSquareFeet: null,
    yearBuilt: 2019,
    daysOnMarket: 23,
    modificationTimestamp: "2026-03-28T14:30:00Z",
    listingContractDate: "2026-03-05",
    media: [{ mediaUrl: "https://example.com/mls/rbny-2024001-01.jpg", mediaType: "Photo", order: 1 }],
    listAgentFullName: "Sarah Chen",
    listOfficeName: "REBNY Premier Realty",
    publicRemarks: "Stunning 3BR/2BA condo with floor-to-ceiling windows and Hudson River views. High-floor unit in boutique doorman building.",
    mlsName: "REBNY RLS",
  },
  {
    listingKey: "mls-rbny-2024002",
    listingId: "RBN-2024-002",
    standardStatus: "Active",
    listPrice: 1425000,
    originalListPrice: 1525000,
    address: "189 Montague St, Unit 5C",
    city: "Brooklyn",
    stateOrProvince: "NY",
    postalCode: "11201",
    county: "Kings",
    latitude: 40.6944,
    longitude: -73.9954,
    propertyType: "Residential",
    propertySubType: "Cooperative",
    bedroomsTotal: 2,
    bathroomsTotalInteger: 2,
    livingArea: 1250,
    lotSizeSquareFeet: null,
    yearBuilt: 1962,
    daysOnMarket: 47,
    modificationTimestamp: "2026-03-27T09:15:00Z",
    listingContractDate: "2026-02-09",
    media: [],
    listAgentFullName: "Michael Torres",
    listOfficeName: "Brooklyn Heights Realty",
    publicRemarks: "Sunny pre-war co-op with original hardwood floors and exposed brick. Pets allowed.",
    mlsName: "REBNY RLS",
  },
  {
    listingKey: "mls-rbny-2024003",
    listingId: "RBN-2024-003",
    standardStatus: "Pending",
    listPrice: 4200000,
    originalListPrice: 4200000,
    address: "333 E 86th St, PHB",
    city: "New York",
    stateOrProvince: "NY",
    postalCode: "10028",
    county: "New York",
    latitude: 40.7793,
    longitude: -73.9510,
    propertyType: "Residential",
    propertySubType: "Condominium",
    bedroomsTotal: 4,
    bathroomsTotalInteger: 3,
    livingArea: 2800,
    lotSizeSquareFeet: null,
    yearBuilt: 2015,
    daysOnMarket: 12,
    modificationTimestamp: "2026-03-29T11:00:00Z",
    listingContractDate: "2026-03-17",
    media: [],
    listAgentFullName: "Diana Rosenstein",
    listOfficeName: "Upper East Side Luxury Group",
    publicRemarks: "Penthouse duplex with private rooftop terrace. Panoramic views of the East River. Chef's kitchen.",
    mlsName: "REBNY RLS",
  },
  {
    listingKey: "mls-onkey-2024001",
    listingId: "ONK-2024-001",
    standardStatus: "Active",
    listPrice: 875000,
    originalListPrice: 895000,
    address: "42 Maple Ave",
    city: "Scarsdale",
    stateOrProvince: "NY",
    postalCode: "10583",
    county: "Westchester",
    latitude: 40.9895,
    longitude: -73.7849,
    propertyType: "Residential",
    propertySubType: "Single Family Residence",
    bedroomsTotal: 4,
    bathroomsTotalInteger: 3,
    livingArea: 2650,
    lotSizeSquareFeet: 9200,
    yearBuilt: 1991,
    daysOnMarket: 31,
    modificationTimestamp: "2026-03-26T16:45:00Z",
    listingContractDate: "2026-02-24",
    media: [],
    listAgentFullName: "Robert Kim",
    listOfficeName: "Westchester Premier Properties",
    publicRemarks: "Pristine colonial in top-rated school district. Updated kitchen, finished basement. Close to Metro-North.",
    mlsName: "OneKey MLS",
  },
  {
    listingKey: "mls-onkey-2024002",
    listingId: "ONK-2024-002",
    standardStatus: "Active",
    listPrice: 650000,
    originalListPrice: 650000,
    address: "78 Harbor View Rd",
    city: "Port Washington",
    stateOrProvince: "NY",
    postalCode: "11050",
    county: "Nassau",
    latitude: 40.8307,
    longitude: -73.6927,
    propertyType: "Residential",
    propertySubType: "Single Family Residence",
    bedroomsTotal: 3,
    bathroomsTotalInteger: 2,
    livingArea: 1890,
    lotSizeSquareFeet: 7500,
    yearBuilt: 1958,
    daysOnMarket: 9,
    modificationTimestamp: "2026-03-30T08:00:00Z",
    listingContractDate: "2026-03-21",
    media: [],
    listAgentFullName: "Lisa Park",
    listOfficeName: "Long Island Shoreline Realty",
    publicRemarks: "Charming expanded ranch, meticulously maintained. New roof, updated electric, large deck with seasonal water views.",
    mlsName: "OneKey MLS",
  },
];

function buildODataUrl(baseUrl: string, resource: string, params: ODataQueryParams): string {
  const url = new URL(`${baseUrl}/${resource}`);
  if (params.filter) url.searchParams.set("$filter", params.filter);
  if (params.select?.length) url.searchParams.set("$select", params.select.join(","));
  if (params.top !== undefined) url.searchParams.set("$top", String(params.top));
  if (params.skip !== undefined) url.searchParams.set("$skip", String(params.skip));
  if (params.orderby) url.searchParams.set("$orderby", params.orderby);
  if (params.expand?.length) url.searchParams.set("$expand", params.expand.join(","));
  if (params.count) url.searchParams.set("$count", "true");
  url.searchParams.set("$format", "application/json");
  return url.toString();
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

export class ResoMlsAdapter extends ServiceAdapter {
  readonly name = "reso-mls";
  readonly description =
    "RESO Web API (OData v4) connector for MLS listing feeds — REBNY RLS, OneKey MLS. OAuth 2.0 client credentials with incremental sync via ModificationTimestamp.";
  readonly requiredEnvVars = [
    "MLS_CLIENT_ID",
    "MLS_CLIENT_SECRET",
    "MLS_TOKEN_URL",
    "MLS_BASE_URL",
  ];

  private _tokenCache: TokenCache | null = null;

  private get clientId(): string | undefined {
    return process.env["MLS_CLIENT_ID"];
  }

  private get clientSecret(): string | undefined {
    return process.env["MLS_CLIENT_SECRET"];
  }

  private get tokenUrl(): string | undefined {
    return process.env["MLS_TOKEN_URL"];
  }

  private get baseUrl(): string | undefined {
    return process.env["MLS_BASE_URL"];
  }

  private async fetchToken(): Promise<string> {
    if (this._tokenCache && this._tokenCache.expiresAt > Date.now() + 60000) {
      return this._tokenCache.accessToken;
    }

    const response = await fetch(this.tokenUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        scope: "api",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`MLS token fetch failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this._tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return this._tokenCache.accessToken;
  }

  private async odataRequest(resource: string, params: ODataQueryParams): Promise<{ value: unknown[]; "@odata.count"?: number }> {
    const token = await this.fetchToken();
    const url = buildODataUrl(this.baseUrl!, resource, params);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "Terra-RealEstateIntelligence/1.0",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`MLS OData request failed: HTTP ${response.status} — ${resource}`);
    }

    return response.json() as Promise<{ value: unknown[]; "@odata.count"?: number }>;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.fetchToken();
    await this.odataRequest("Property", { top: 1, select: ["ListingKey"] });
  }

  async queryListings(params: ODataQueryParams): Promise<MlsListing[]> {
    if (!this.isLive) {
      return this.getMockListings(params);
    }

    const data = await this.odataRequest("Property", {
      ...params,
      select: params.select ?? [
        "ListingKey", "ListingId", "StandardStatus", "ListPrice", "OriginalListPrice",
        "UnparsedAddress", "City", "StateOrProvince", "PostalCode", "CountyOrParish",
        "Latitude", "Longitude", "PropertyType", "PropertySubType",
        "BedroomsTotal", "BathroomsTotalInteger", "LivingArea", "LotSizeSquareFeet",
        "YearBuilt", "DaysOnMarket", "ModificationTimestamp", "ListingContractDate",
        "ListAgentFullName", "ListOfficeName", "PublicRemarks",
      ],
    });

    return data.value.map(raw => this.mapResoRecord(raw as Record<string, unknown>));
  }

  async incrementalSync(sinceTimestamp: string | null): Promise<MlsIncrementalSyncResult> {
    if (!this.isLive) {
      return {
        fetched: MOCK_MLS_LISTINGS.length,
        upserted: MOCK_MLS_LISTINGS.length,
        errors: 0,
        lastModificationTimestamp: new Date().toISOString(),
      };
    }

    const filterParts: string[] = [];
    if (sinceTimestamp) {
      filterParts.push(`ModificationTimestamp gt ${sinceTimestamp}`);
    }

    let skip = 0;
    const pageSize = 200;
    let totalFetched = 0;
    let upserted = 0;
    let errors = 0;
    let lastTs: string | null = null;

    while (true) {
      const data = await this.odataRequest("Property", {
        filter: filterParts.join(" and ") || undefined,
        orderby: "ModificationTimestamp asc",
        top: pageSize,
        skip,
        select: [
          "ListingKey", "ListingId", "StandardStatus", "ListPrice", "OriginalListPrice",
          "UnparsedAddress", "City", "StateOrProvince", "PostalCode", "CountyOrParish",
          "Latitude", "Longitude", "PropertyType", "PropertySubType",
          "BedroomsTotal", "BathroomsTotalInteger", "LivingArea", "LotSizeSquareFeet",
          "YearBuilt", "DaysOnMarket", "ModificationTimestamp", "ListingContractDate",
          "ListAgentFullName", "ListOfficeName", "PublicRemarks",
        ],
      });

      const batch = data.value;
      totalFetched += batch.length;

      for (const raw of batch) {
        try {
          const listing = this.mapResoRecord(raw as Record<string, unknown>);
          if (listing.modificationTimestamp) {
            lastTs = listing.modificationTimestamp;
          }
          upserted++;
        } catch {
          errors++;
        }
      }

      if (batch.length < pageSize) break;
      skip += pageSize;
    }

    return { fetched: totalFetched, upserted, errors, lastModificationTimestamp: lastTs };
  }

  private mapResoRecord(raw: Record<string, unknown>): MlsListing {
    return {
      listingKey: String(raw["ListingKey"] ?? ""),
      listingId: String(raw["ListingId"] ?? raw["ListingKey"] ?? ""),
      standardStatus: (raw["StandardStatus"] as MlsListing["standardStatus"]) ?? "Active",
      listPrice: Number(raw["ListPrice"] ?? 0),
      originalListPrice: Number(raw["OriginalListPrice"] ?? raw["ListPrice"] ?? 0),
      address: String(raw["UnparsedAddress"] ?? ""),
      city: String(raw["City"] ?? ""),
      stateOrProvince: String(raw["StateOrProvince"] ?? ""),
      postalCode: String(raw["PostalCode"] ?? ""),
      county: String(raw["CountyOrParish"] ?? ""),
      latitude: raw["Latitude"] != null ? Number(raw["Latitude"]) : null,
      longitude: raw["Longitude"] != null ? Number(raw["Longitude"]) : null,
      propertyType: (raw["PropertyType"] as MlsListing["propertyType"]) ?? "Residential",
      propertySubType: String(raw["PropertySubType"] ?? ""),
      bedroomsTotal: raw["BedroomsTotal"] != null ? Number(raw["BedroomsTotal"]) : null,
      bathroomsTotalInteger: raw["BathroomsTotalInteger"] != null ? Number(raw["BathroomsTotalInteger"]) : null,
      livingArea: raw["LivingArea"] != null ? Number(raw["LivingArea"]) : null,
      lotSizeSquareFeet: raw["LotSizeSquareFeet"] != null ? Number(raw["LotSizeSquareFeet"]) : null,
      yearBuilt: raw["YearBuilt"] != null ? Number(raw["YearBuilt"]) : null,
      daysOnMarket: Number(raw["DaysOnMarket"] ?? 0),
      modificationTimestamp: String(raw["ModificationTimestamp"] ?? new Date().toISOString()),
      listingContractDate: String(raw["ListingContractDate"] ?? ""),
      media: (raw["Media"] as Array<{ MediaURL: string; MediaType: string; Order: number }> ?? []).map(m => ({
        mediaUrl: m.MediaURL,
        mediaType: m.MediaType,
        order: m.Order,
      })),
      listAgentFullName: String(raw["ListAgentFullName"] ?? ""),
      listOfficeName: String(raw["ListOfficeName"] ?? ""),
      publicRemarks: String(raw["PublicRemarks"] ?? ""),
      mlsName: String(raw["OriginatingSystemName"] ?? "RESO MLS"),
    };
  }

  getMockListings(params?: ODataQueryParams): MlsListing[] {
    let results = [...MOCK_MLS_LISTINGS];
    if (params?.top) results = results.slice(0, params.top);
    return results;
  }
}
