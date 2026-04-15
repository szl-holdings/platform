import { apiFetch, graphqlRequest } from "@szl-holdings/shared-ui";

export async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  return graphqlRequest<T>(query, variables);
}

export interface GqlTerraActionItem {
  id: string;
  externalId: string | null;
  propertyId: string;
  issue: string;
  severity: string;
  ownerName: string;
  ownerRole: string;
  dueDate: string | null;
  status: string;
  recommendedAction: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  marketIntelligence: (market?: string) =>
    apiFetch<any>(`/terra/market-intelligence${market ? `?market=${encodeURIComponent(market)}` : ""}`),
  reitFilings: (type?: string) =>
    apiFetch<any>(`/terra/reit-filings${type ? `?type=${encodeURIComponent(type)}` : ""}`),
  demographics: (market?: string) =>
    apiFetch<any>(`/terra/demographics${market ? `?market=${encodeURIComponent(market)}` : ""}`),
  propertyRisk: (propertyId?: string) =>
    apiFetch<any>(`/terra/property-risk${propertyId ? `?propertyId=${propertyId}` : ""}`),
  employmentOutlook: () => apiFetch<any>("/terra/employment-outlook"),
  sectorPerformance: () => apiFetch<any>("/terra/sector-performance"),
  live: {
    censusHousing: (msa?: string) =>
      apiFetch<any>(`/terra/live/census-housing${msa ? `?msa=${msa}` : ""}`),
    hudFairMarketRents: () => apiFetch<any>("/terra/live/hud-fair-market-rents"),
    mortgageRates: () => apiFetch<any>("/terra/live/mortgage-rates"),
    blsConstruction: () => apiFetch<any>("/terra/live/bls-construction"),
    femaNri: (state?: string) =>
      apiFetch<any>(`/terra/live/fema-nri${state ? `?state=${state}` : ""}`),
  },
};
