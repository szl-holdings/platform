import { ServiceAdapter } from "../base.js";

export interface CrunchbaseOrganization {
  uuid: string;
  permalink: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  primaryRole: string;
  founded: string | null;
  closedOn: string | null;
  operatingStatus: string;
  categories: string[];
  categoryGroups: string[];
  headquartersLocation: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  employeeCount: string | null;
  totalFundingUsd: number | null;
  lastFundingType: string | null;
  lastFundingDate: string | null;
  lastFundingAmount: number | null;
  numberOfFundingRounds: number;
  investors: string[];
  ipo: { status: string; stockExchange: string | null; symbol: string | null; ipoDate: string | null } | null;
  acquisitions: number;
  acquisitions_by: number;
  rankOrg: number | null;
}

export interface CrunchbaseFundingRound {
  uuid: string;
  name: string;
  fundingType: string;
  announcedOn: string;
  closedOn: string | null;
  raisedAmount: number | null;
  currency: string;
  leadInvestors: string[];
  investors: string[];
  organization: string;
  postMoneyValuation: number | null;
  preMoneyValuation: number | null;
}

export interface CrunchbaseInvestor {
  uuid: string;
  name: string;
  investorType: string[];
  headquartersLocation: string | null;
  totalFundingUsd: number | null;
  numberOfInvestments: number;
  numberOfLeadInvestments: number;
  numberOfExits: number;
  portfolioHighlights: string[];
  investmentStages: string[];
}

const MOCK_ORGS: CrunchbaseOrganization[] = [
  {
    uuid: "a4d0f3e8-9c12-4b21-8ab1-1234567890ab", permalink: "nexgen-advisors",
    name: "NexGen Advisors", shortDescription: "AI-driven investment advisory platform for institutional clients",
    description: "NexGen Advisors provides algorithmic trading strategies and AI-powered portfolio construction tools for hedge funds and family offices.",
    primaryRole: "company", founded: "2018-03-01", closedOn: null, operatingStatus: "closed",
    categories: ["FinTech", "Artificial Intelligence", "Asset Management"],
    categoryGroups: ["Financial Services", "Science and Engineering"],
    headquartersLocation: "New York, New York, United States",
    website: null, linkedin: null, twitter: null,
    employeeCount: "11-50", totalFundingUsd: 12000000,
    lastFundingType: "Series A", lastFundingDate: "2022-06-15", lastFundingAmount: 8000000,
    numberOfFundingRounds: 2, investors: ["Andreessen Horowitz", "Y Combinator"],
    ipo: null, acquisitions: 0, acquisitions_by: 0, rankOrg: 48821,
  },
  {
    uuid: "b7e1c2d3-4f56-7890-abcd-ef0123456789", permalink: "meridian-properties",
    name: "Meridian Properties", shortDescription: "Commercial and residential real estate development and management",
    description: null, primaryRole: "company", founded: "2001-01-01", closedOn: null,
    operatingStatus: "active", categories: ["Real Estate", "Commercial Real Estate", "Property Management"],
    categoryGroups: ["Real Estate"], headquartersLocation: "New York, New York, United States",
    website: "https://meridian-prop.com", linkedin: "meridian-properties-nyc", twitter: null,
    employeeCount: "51-200", totalFundingUsd: null,
    lastFundingType: null, lastFundingDate: null, lastFundingAmount: null,
    numberOfFundingRounds: 0, investors: [],
    ipo: null, acquisitions: 2, acquisitions_by: 0, rankOrg: 122034,
  },
];

export class CrunchbaseAdapter extends ServiceAdapter {
  readonly name = "crunchbase";
  readonly description =
    "Crunchbase API — startup intelligence, funding rounds, investor profiles, M&A activity, and company firmographics. Requires API key. Falls back to demo mode when CRUNCHBASE_API_KEY is absent.";
  readonly requiredEnvVars = ["CRUNCHBASE_API_KEY"];

  private get apiKey(): string | undefined { return process.env["CRUNCHBASE_API_KEY"]; }

  private readonly BASE_URL = "https://api.crunchbase.com/api/v4";

  private async cbRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    url.searchParams.set("user_key", this.apiKey!);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Crunchbase API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.cbRequest("/entities/organizations/apple", { field_ids: "identifier" });
  }

  async getOrganization(permalink: string): Promise<CrunchbaseOrganization | null> {
    if (this.isDemoMode) return MOCK_ORGS.find(o => o.permalink === permalink) ?? MOCK_ORGS[0] ?? null;
    const fields = "identifier,short_description,description,primary_job_functions,founded_on,closed_on,operating_status,categories,category_groups,location_identifiers,website,linkedin,twitter,num_employees_enum,funding_total,last_funding_type,last_funding_at,last_funding_total,num_funding_rounds,investor_identifiers,ipo_status,num_acquisitions,rank_org";
    const data = await this.cbRequest<{ properties: Record<string, unknown> }>(`/entities/organizations/${permalink}`, { field_ids: fields });
    const p = data.properties;
    return {
      uuid: String((p["identifier"] as Record<string, unknown>)?.["uuid"] ?? ""),
      permalink, name: String((p["identifier"] as Record<string, unknown>)?.["value"] ?? ""),
      shortDescription: p["short_description"] ? String(p["short_description"]) : null,
      description: p["description"] ? String(p["description"]) : null,
      primaryRole: "company", founded: p["founded_on"] ? String(p["founded_on"]) : null,
      closedOn: p["closed_on"] ? String(p["closed_on"]) : null,
      operatingStatus: String(p["operating_status"] ?? ""),
      categories: Array.isArray(p["categories"]) ? (p["categories"] as Array<Record<string, unknown>>).map(c => String(c["value"] ?? "")) : [],
      categoryGroups: [], headquartersLocation: null, website: null, linkedin: null, twitter: null,
      employeeCount: p["num_employees_enum"] ? String(p["num_employees_enum"]) : null,
      totalFundingUsd: (p["funding_total"] as Record<string, number>)?.["value_usd"] ?? null,
      lastFundingType: p["last_funding_type"] ? String(p["last_funding_type"]) : null,
      lastFundingDate: p["last_funding_at"] ? String(p["last_funding_at"]) : null,
      lastFundingAmount: (p["last_funding_total"] as Record<string, number>)?.["value_usd"] ?? null,
      numberOfFundingRounds: Number(p["num_funding_rounds"] ?? 0),
      investors: Array.isArray(p["investor_identifiers"]) ? (p["investor_identifiers"] as Array<Record<string, unknown>>).map(i => String(i["value"] ?? "")) : [],
      ipo: null, acquisitions: Number(p["num_acquisitions"] ?? 0), acquisitions_by: 0,
      rankOrg: p["rank_org"] ? Number(p["rank_org"]) : null,
    };
  }

  async searchOrganizations(query: string, limit = 10): Promise<CrunchbaseOrganization[]> {
    if (this.isDemoMode) return MOCK_ORGS.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));
    const body = {
      field_ids: ["identifier", "short_description", "primary_job_functions", "categories", "location_identifiers", "num_employees_enum", "funding_total", "rank_org"],
      query: [{ type: "predicate", field_id: "facet_ids", operator_id: "includes", values: ["company"] }],
      order: [{ field_id: "rank_org", sort: "asc" }],
      limit,
    };
    const res = await fetch(`${this.BASE_URL}/searches/organizations?user_key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Crunchbase search error: HTTP ${res.status}`);
    const data = await res.json() as { entities: Array<{ properties: Record<string, unknown> }> };
    return (data.entities ?? []).map(e => ({
      uuid: String((e.properties["identifier"] as Record<string, unknown>)?.["uuid"] ?? ""),
      permalink: String((e.properties["identifier"] as Record<string, unknown>)?.["permalink"] ?? ""),
      name: String((e.properties["identifier"] as Record<string, unknown>)?.["value"] ?? ""),
      shortDescription: e.properties["short_description"] ? String(e.properties["short_description"]) : null,
      description: null, primaryRole: "company", founded: null, closedOn: null,
      operatingStatus: "active", categories: [], categoryGroups: [],
      headquartersLocation: null, website: null, linkedin: null, twitter: null,
      employeeCount: null, totalFundingUsd: null, lastFundingType: null,
      lastFundingDate: null, lastFundingAmount: null, numberOfFundingRounds: 0,
      investors: [], ipo: null, acquisitions: 0, acquisitions_by: 0,
      rankOrg: e.properties["rank_org"] ? Number(e.properties["rank_org"]) : null,
    }));
  }

  getMockOrganizations(): CrunchbaseOrganization[] { return MOCK_ORGS; }
}
