const API_BASE = "/api";

export async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL request failed: HTTP ${res.status}`);
  const json = await res.json() as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
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
