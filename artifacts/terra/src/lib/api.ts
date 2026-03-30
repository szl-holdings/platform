const API_BASE = "/api";

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
