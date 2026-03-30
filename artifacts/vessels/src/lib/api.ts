import { apiFetch, type PaginatedResponse } from "@workspace/shared-ui";

async function apiFetchList<T>(path: string): Promise<T[]> {
  const json = await apiFetch<T[] | PaginatedResponse<T>>(path);
  if (json && typeof json === "object" && "data" in json && "meta" in json) {
    return (json as PaginatedResponse<T>).data;
  }
  return json as T[];
}

export interface FleetException {
  id: number;
  orgId?: number;
  vesselId?: number;
  voyageId?: number;
  exceptionRef: string;
  exceptionType: string;
  severity: string;
  title: string;
  description: string;
  whyItMatters?: string;
  recommendedResponse?: string;
  businessConsequence?: string;
  owner?: string;
  ownerFunction?: string;
  estimatedImpactUsd?: string;
  status: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  detectedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Voyage {
  id: number;
  orgId?: number;
  vesselId?: number;
  voyageRef: string;
  originPortId?: number;
  destinationPortId?: number;
  originLabel?: string;
  destinationLabel?: string;
  cargoType?: string;
  cargoQuantity?: string;
  cargoUnit?: string;
  charterType?: string;
  estimatedRevenue?: string;
  operatingCost?: string;
  fuelCost?: string;
  portCost?: string;
  delayCost?: string;
  marginEstimate?: string;
  marginPct?: string;
  tce?: string;
  delayHours: number;
  routeProgress: number;
  status: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  estimatedArrival?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Corridor {
  id: number;
  name: string;
  origin: string;
  destination: string;
  region?: string;
  commodity?: string;
  vesselCount: number;
  delayRate?: string;
  avgTransitDays?: string;
  weeklyVolume?: string;
  profitabilityIndex?: string;
  weatherRisk: string;
  portCongestionRisk: string;
  trend: string;
  activeAlerts: number;
}

export interface VesselMaintenance {
  id: number;
  vesselId: number;
  component: string;
  maintenanceType: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  estimatedCost?: string;
  riskOfServiceIssue?: string;
  impactsVoyageAvailability: boolean;
  assetHealth?: string;
  technician?: string;
}

export interface VesselsDashboard {
  summary: {
    totalVessels: number;
    activeExceptions: number;
    overdueMaintenanceItems: number;
    activeVoyages: number;
  };
  recentExceptions: FleetException[];
  fleetSummary: unknown[];
  fetchedAt: string;
}

export const api = {
  fleets: {
    list: () => apiFetch<any[]>("/vessels/fleets"),
    get: (id: number) => apiFetch<any>(`/vessels/fleets/${id}`),
    create: (data: any) => apiFetch<any>("/vessels/fleets", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/vessels/fleets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/fleets/${id}`, { method: "DELETE" }),
  },
  vessels: {
    list: () => apiFetch<any[]>("/vessels"),
    get: (id: number) => apiFetch<any>(`/vessels/${id}`),
    create: (data: any) => apiFetch<any>("/vessels", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/vessels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/${id}`, { method: "DELETE" }),
    positions: (id: number) => apiFetch<any[]>(`/vessels/${id}/positions`),
    cargo: (id: number) => apiFetch<any[]>(`/vessels/${id}/cargo`),
    routes: (id: number) => apiFetch<any[]>(`/vessels/${id}/routes`),
  },
  routes: {
    list: () => apiFetch<any[]>("/vessels/routes/all"),
    create: (data: any) => apiFetch<any>("/vessels/routes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/vessels/routes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/routes/${id}`, { method: "DELETE" }),
  },
  alertRules: {
    list: () => apiFetch<any[]>("/vessels/alert-rules/all"),
    create: (data: any) => apiFetch<any>("/vessels/alert-rules", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/vessels/alert-rules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/alert-rules/${id}`, { method: "DELETE" }),
  },
  alerts: {
    list: () => apiFetch<any[]>("/vessels/alerts/all"),
  },
  weather: {
    snapshots: (routeId?: number) => apiFetch<any[]>(`/vessels/weather/snapshots${routeId ? `?routeId=${routeId}` : ""}`),
  },
  simulations: {
    list: () => apiFetch<any[]>("/vessels/simulations/all"),
    get: (id: number) => apiFetch<any>(`/vessels/simulations/${id}`),
    create: (data: any) => apiFetch<any>("/vessels/simulations", { method: "POST", body: JSON.stringify(data) }),
  },
  dashboard: () => apiFetch<VesselsDashboard>("/vessels/dashboard"),
  fleetSummary: () => apiFetch<any>("/vessels/fleet-summary"),
  exceptions: {
    list: (params?: { status?: string; severity?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.severity) q.set("severity", params.severity);
      const qs = q.toString();
      return apiFetchList<FleetException>(`/vessels/exceptions${qs ? `?${qs}` : ""}`);
    },
    get: (id: number) => apiFetch<FleetException>(`/vessels/exceptions/${id}`),
    create: (data: any) => apiFetch<FleetException>("/vessels/exceptions", { method: "POST", body: JSON.stringify(data) }),
    acknowledge: (id: number, notes?: string) => apiFetch<FleetException>(`/vessels/exceptions/${id}/acknowledge`, { method: "POST", body: JSON.stringify({ notes }) }),
    resolve: (id: number, notes: string) => apiFetch<FleetException>(`/vessels/exceptions/${id}/resolve`, { method: "POST", body: JSON.stringify({ notes }) }),
    escalate: (id: number, escalateTo?: string, notes?: string) => apiFetch<FleetException>(`/vessels/exceptions/${id}/escalate`, { method: "POST", body: JSON.stringify({ escalateTo, notes }) }),
  },
  voyages: {
    list: (params?: { status?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      const qs = q.toString();
      return apiFetchList<Voyage>(`/vessels/voyages${qs ? `?${qs}` : ""}`);
    },
    get: (id: number) => apiFetch<Voyage>(`/vessels/voyages/${id}`),
    create: (data: any) => apiFetch<Voyage>("/vessels/voyages", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<Voyage>(`/vessels/voyages/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  corridors: {
    list: () => apiFetchList<Corridor>("/vessels/corridors"),
    get: (id: number) => apiFetch<Corridor>(`/vessels/corridors/${id}`),
  },
  maintenance: {
    list: (params?: { status?: string; vesselId?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.vesselId) q.set("vesselId", String(params.vesselId));
      const qs = q.toString();
      return apiFetchList<VesselMaintenance>(`/vessels/maintenance${qs ? `?${qs}` : ""}`);
    },
    get: (id: number) => apiFetch<VesselMaintenance>(`/vessels/maintenance/${id}`),
    create: (data: any) => apiFetch<VesselMaintenance>("/vessels/maintenance", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<VesselMaintenance>(`/vessels/maintenance/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  ports: {
    list: () => apiFetchList<any>("/vessels/ports"),
    get: (id: number) => apiFetch<any>(`/vessels/ports/${id}`),
  },
  readiness: () => apiFetch<any>("/vessels/readiness"),
  live: {
    chokepoints: () => apiFetch<any>("/vessels/live/chokepoints"),
    geopoliticalEvents: () => apiFetch<any>("/vessels/live/geopolitical-events"),
    portCongestion: () => apiFetch<any>("/vessels/live/port-congestion"),
    marineWeather: (lat?: number, lon?: number) =>
      apiFetch<any>(`/vessels/live/weather-marine${lat != null && lon != null ? `?lat=${lat}&lon=${lon}` : ""}`),
  },
};
