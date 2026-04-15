import { getApiBase } from "@/lib/apiClient";
import { cacheSet, cacheGetStale } from "@/lib/cache";

export { cacheSet, cacheGetStale };

export const CACHE_KEYS = {
  VESSELS: "fleet_cache_vessels",
  ALERTS: "fleet_cache_alerts",
  VOYAGE_ECONOMICS: "fleet_cache_voyage_economics",
  POSITIONS: "fleet_cache_positions",
} as const;

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  flag: string;
  vesselType: string;
  status: "underway" | "anchored" | "moored" | "drifting" | "unknown";
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading?: number;
  destination?: string;
  eta?: string;
  lastUpdate: string;
  cargoType?: string;
  grossTonnage?: number;
  deadweightTonnage?: number;
  yearBuilt?: number;
}

export interface FleetException {
  id: string;
  vesselId: string;
  vesselName: string;
  type: "speed" | "route_deviation" | "zone_entry" | "communication_loss" | "ais_gap" | "weather" | "other";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  lat?: number;
  lon?: number;
  createdAt: string;
  resolvedAt?: string;
  status: "active" | "acknowledged" | "resolved";
}

export interface VesselDetail extends Vessel {
  owner?: string;
  operator?: string;
  manager?: string;
  classificationSociety?: string;
  port?: string;
  portCountry?: string;
  nextPort?: string;
  voyageId?: string;
  draughtMax?: number;
  draughtCurrent?: number;
  crew?: number;
  recentPositions?: Array<{ lat: number; lon: number; timestamp: string }>;
}

export interface VoyageEconomics {
  vesselId: string;
  vesselName: string;
  voyageId: string;
  origin: string;
  destination: string;
  departureDate: string;
  estimatedArrival: string;
  cargoType: string;
  cargoTons: number;
  freightRate: number;
  estimatedRevenue: number;
  estimatedCosts: number;
  estimatedProfit: number;
  fuelConsumption: number;
  distanceNm: number;
}

async function getHeaders(token?: string | null): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export const api = {
  async getVessels(token?: string | null): Promise<Vessel[]> {
    const headers = await getHeaders(token);
    const res = await fetch(`${getApiBase()}/api/vessels`, { headers });
    if (!res.ok) throw new Error("Failed to fetch vessels");
    return res.json();
  },

  async getVessel(id: string, token?: string | null): Promise<Vessel> {
    const headers = await getHeaders(token);
    const res = await fetch(`${getApiBase()}/api/vessels/${id}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch vessel");
    return res.json();
  },

  async getExceptions(token?: string | null): Promise<FleetException[]> {
    const headers = await getHeaders(token);
    const res = await fetch(`${getApiBase()}/api/vessels/exceptions`, { headers });
    if (!res.ok) throw new Error("Failed to fetch exceptions");
    return res.json();
  },

  async getVoyageEconomics(vesselId: string, token?: string | null): Promise<VoyageEconomics> {
    const headers = await getHeaders(token);
    const res = await fetch(`${getApiBase()}/api/vessels/${vesselId}/economics`, { headers });
    if (!res.ok) throw new Error("Failed to fetch voyage economics");
    return res.json();
  },

  async acknowledgeException(id: string, token?: string | null): Promise<void> {
    const headers = await getHeaders(token);
    const res = await fetch(`${getApiBase()}/api/vessels/exceptions/${id}/acknowledge`, {
      method: "POST",
      headers,
    });
    if (!res.ok) throw new Error("Failed to acknowledge exception");
  },
};
