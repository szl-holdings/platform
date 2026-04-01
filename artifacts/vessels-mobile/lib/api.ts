import AsyncStorage from "@react-native-async-storage/async-storage";

function getBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }
  return "/api";
}

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("vessels_auth_token");
    }
    const { default: SecureStore } = await import("expo-secure-store");
    return SecureStore.getItemAsync("vessels_auth_token");
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${getBase()}${path}`, { headers, credentials: "include" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  const json = await res.json();
  return (json.data ?? json) as T;
}

export const CACHE_KEYS = {
  fleet: "vessels_cache_fleet",
  alerts: "vessels_cache_alerts",
  economics: "vessels_cache_economics",
  vesselDetail: (id: number) => `vessels_cache_detail_${id}`,
};

export async function cacheSet(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export async function cacheGet<T>(key: string, maxAgeMs = 300_000): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > maxAgeMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

export async function cacheGetStale<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data as T;
  } catch {
    return null;
  }
}

export interface Vessel {
  id: number;
  name: string;
  imo: string | null;
  mmsi: string | null;
  flag: string | null;
  vesselType: string | null;
  status: string;
  yearBuilt: number | null;
  grossTonnage: string | null;
  latitude?: string | null;
  longitude?: string | null;
  heading?: number | null;
  speed?: string | null;
  destination?: string | null;
  tcePerDay?: string | null;
  marginPct?: string | null;
  activeExceptions?: number;
  positionRecordedAt?: string | null;
}

export interface VesselDetail {
  vessel: Vessel;
  images?: Array<{ id: number; url: string; caption?: string | null }>;
  position: {
    latitude: string;
    longitude: string;
    speed: string;
    heading: number;
    recordedAt: string;
  } | null;
  activeVoyage: {
    originPort: string | null;
    destinationPort: string | null;
    charterType: string | null;
    grossRevenue: string | null;
    totalCostsUsd: string | null;
    netMarginUsd: string | null;
    tcePerDay: string | null;
    estimatedArrivalAt: string | null;
  } | null;
  maintenance: Array<{
    id: number;
    component: string;
    status: string;
    priority: string;
    dueDate: string | null;
  }>;
  portCalls: Array<{
    id: number;
    portName: string;
    arrivalAt: string | null;
    departureAt: string | null;
    purpose: string | null;
  }>;
  exceptions: Array<{
    id: number;
    title: string;
    severity: string;
    exceptionType: string;
    description: string;
    detectedAt: string;
  }>;
  sanctions: {
    ofacStatus: string;
    euStatus: string | null;
    screeningDate: string;
  } | null;
}

export interface FleetException {
  id: number;
  title: string;
  description: string;
  severity: string;
  exceptionType: string;
  status: string;
  vesselId: number | null;
  vesselName?: string;
  detectedAt: string;
  estimatedImpactUsd: string | null;
}

export interface VoyageEconomics {
  id: number;
  vesselId: number | null;
  voyageRef: string | null;
  originPort: string | null;
  destinationPort: string | null;
  charterType: string | null;
  grossRevenue: string | null;
  totalCostsUsd: string | null;
  netMarginUsd: string | null;
  marginPct: string | null;
  tcePerDay: string | null;
  status: string;
  fuelCostUsd: string | null;
  portCostsUsd: string | null;
  delayHours: string | null;
}

export const api = {
  roster: () => apiFetch<Vessel[]>("/vessels/roster"),
  vesselDetail: (id: number) => apiFetch<VesselDetail>(`/vessels/${id}/detail`),
  exceptions: (params?: { status?: string; severity?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<FleetException[]>(`/vessels/exceptions${q ? `?${q}` : ""}`);
  },
  voyageEconomics: (params?: { status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<VoyageEconomics[]>(`/vessels/voyage-economics${q ? `?${q}` : ""}`);
  },
  economicsAnalytics: () => apiFetch<{
    revenueByMonth: Array<{ month: string; revenue: number; costs: number; margin: number }>;
    topRoutes: Array<{ route: string; voyages: number; totalRevenue: number; avgTce: number; avgMargin: number }>;
  }>("/vessels/voyage-economics/analytics"),
  maintenance: () => apiFetch<Array<{
    id: number;
    vesselId: number;
    component: string;
    status: string;
    priority: string;
    dueDate: string | null;
    estimatedCost: string | null;
  }>>("/vessels/maintenance/all"),
  sanctions: () => apiFetch<Array<{
    id: number;
    vesselId: number;
    ofacStatus: string;
    euStatus: string | null;
    screeningDate: string;
  }>>("/vessels/sanctions/all"),
  liveFleetSummary: () => apiFetch<{
    totalVesselsTracked: number;
    underwayCount: number;
    anchoredCount: number;
    mooredCount: number;
    avgSpeedKnots: number;
    liveData: boolean;
  }>("/vessels/live/fleet-summary"),
};
