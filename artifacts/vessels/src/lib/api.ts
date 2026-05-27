import { apiFetch, type PaginatedResponse } from '@szl-holdings/shared-ui/api-fetch';
import type { Fleet } from '@/data/types';

async function apiFetchList<T>(path: string): Promise<T[]> {
  const json = await apiFetch<T[] | PaginatedResponse<T>>(path);
  if (json && typeof json === 'object' && 'data' in json && 'meta' in json) {
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
  // joined fields
  vesselName?: string;
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

export interface VoyageEconomics {
  id: number;
  vesselId: number;
  vesselName?: string | null;
  vesselClass?:
    | 'VLCC'
    | 'Suezmax'
    | 'Aframax'
    | 'Capesize'
    | 'Panamax'
    | 'Supramax'
    | 'Handysize'
    | 'LNG Carrier'
    | null;
  vesselType?: string | null;
  voyageRef: string;
  originPort: string;
  destinationPort: string;
  cargoType?: string;
  cargoQuantityMt?: string;
  cargoValueUsd?: string;
  charterType: string;
  charterRatePerDay?: string;
  grossRevenue?: string;
  fuelCostUsd?: string;
  fuelConsumedMt?: string;
  portCostsUsd?: string;
  canalFeesUsd?: string;
  crewCostsUsd?: string;
  maintenanceCostsUsd?: string;
  otherCostsUsd?: string;
  totalCostsUsd?: string;
  netMarginUsd?: string;
  marginPct?: string;
  tcePerDay?: string;
  distanceNm?: string;
  durationDays?: string;
  delayHours?: string;
  delayCostUsd?: string;
  status: string;
  scheduledDepartureAt?: string;
  actualDepartureAt?: string;
  scheduledArrivalAt?: string;
  estimatedArrivalAt?: string;
  actualArrivalAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BunkerPrice {
  port: string;
  vlsfoUsdPerMt: number;
  hfoUsdPerMt: number;
  mgoUsdPerMt: number;
  lngUsdPerMmbtu: number;
  asOfDate: string;
}

export interface BunkerPricesResponse {
  bunkerPrices: BunkerPrice[];
  asOfDate: string;
}

export interface CharterRateEstimate {
  vesselClass: string;
  timeCharterRateUsd: number;
  spotRateUsd: number;
  trend: 'rising' | 'stable' | 'falling';
  weeklyChange: number;
  asOfDate: string;
}

export interface CharterRatesResponse {
  charterRates: CharterRateEstimate[];
  asOfDate: string;
}

export interface VoyageEconomicsAnalytics {
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    costs: number;
    margin: number;
    voyages: number;
  }>;
  topRoutes: Array<{
    route: string;
    voyages: number;
    avgMargin: number;
    totalRevenue: number;
    avgTce: number;
  }>;
  utilizationTrend: Array<{
    status: string;
    count: number;
    avgMarginPct: number;
  }>;
}

export interface SanctionsScreening {
  id: number;
  vesselId: number;
  screeningDate: string;
  ofacStatus: string;
  euStatus: string;
  unStatus: string;
  ukStatus: string;
  matchedLists?: string[];
  matchConfidence?: string;
  flagRegistryValid?: boolean;
  flagRegistryNotes?: string;
  pscInspectionDate?: string;
  pscResult?: string;
  pscDeficiencies?: number;
  complianceScore?: string;
  ownershipOpaque?: boolean;
  knownOwner?: string;
  knownManager?: string;
  flagState?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // joined
  vesselName?: string;
  vesselType?: string;
  vesselFlag?: string;
  vesselImo?: string;
  vesselMmsi?: string;
}

export interface SanctionsSummary {
  ofacDistribution: Array<{ status: string; count: number }>;
  pscDistribution: Array<{ result: string; count: number; avgDeficiencies: number }>;
  stats: {
    avgScore: number;
    minScore: number;
    maxScore: number;
    clearCount: number;
    matchCount: number;
    opaqueCount: number;
  };
}

export interface PortCall {
  id: number;
  vesselId: number;
  portName: string;
  portLocode?: string;
  portCountry?: string;
  arrivalAt?: string;
  departureAt?: string;
  durationHours?: string;
  purpose?: string;
  cargoLoaded?: string;
  cargoDischarged?: string;
  portCostUsd?: string;
  bunkeredMt?: string;
  canalTransit?: boolean;
  canalName?: string;
  canalFeeUsd?: string;
  agentName?: string;
  notes?: string;
  createdAt: string;
  // joined
  vesselName?: string;
  vesselType?: string;
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
  // joined
  vesselName?: string;
  vesselType?: string;
  vesselFlag?: string;
}

export interface RosterVessel {
  id: number;
  name: string;
  imo: string | null;
  mmsi: string | null;
  flag: string | null;
  vesselType: string | null;
  status: string;
  yearBuilt: number | null;
  grossTonnage: string | null;
  latitude: string | null;
  longitude: string | null;
  heading: string | null;
  speed: string | null;
  positionRecordedAt: string | null;
  destination: string | null;
  origin: string | null;
  eta: string | null;
  cargoType: string | null;
  charterType: string | null;
  voyageRef: string | null;
  tcePerDay: string | null;
  marginPct: string | null;
  activeExceptions: number;
}

export interface VesselDetail {
  vessel: {
    id: number;
    name: string;
    imo: string | null;
    mmsi: string | null;
    flag: string | null;
    vesselType: string | null;
    status: string;
    yearBuilt: number | null;
    grossTonnage: string | null;
  };
  position: {
    latitude: string;
    longitude: string;
    heading: string | null;
    speed: string | null;
    recordedAt: string;
  } | null;
  activeVoyage: VoyageEconomics | null;
  voyageHistory: VoyageEconomics[];
  maintenance: VesselMaintenance[];
  portCalls: PortCall[];
  exceptions: FleetException[];
  sanctions: SanctionsScreening | null;
}

export interface VesselsDashboard {
  summary: {
    totalVessels: number;
    activeExceptions: number;
    overdueMaintenanceItems: number;
    activeVoyages: number;
    utilizationRate: number;
  };
  statusDistribution: Array<{ status: string; count: number }>;
  typeDistribution: Array<{ type: string; count: number }>;
  flagDistribution: Array<{ flag: string; count: number }>;
  ageBuckets: Record<string, number>;
  recentExceptions: FleetException[];
  fleetSummary: unknown[];
  economics: {
    totalRevenue: number;
    totalCosts: number;
    totalMargin: number;
    avgMarginPct: number;
    completedVoyages: number;
  };
  fetchedAt: string;
}

type MutationInput = Record<
  string,
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | number[]
  | Record<string, unknown>
>;

export const api = {
  fleets: {
    list: () => apiFetch<Fleet[]>('/vessels/fleets'),
    get: (id: number) => apiFetch<Fleet>(`/vessels/fleets/${id}`),
    create: (data: MutationInput) =>
      apiFetch<Fleet>('/vessels/fleets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: MutationInput) =>
      apiFetch<Fleet>(`/vessels/fleets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/fleets/${id}`, { method: 'DELETE' }),
  },
  vessels: {
    list: () => apiFetch<Record<string, unknown>[]>('/vessels'),
    get: (id: number) => apiFetch<Record<string, unknown>>(`/vessels/${id}`),
    create: (data: MutationInput) =>
      apiFetch<Record<string, unknown>>('/vessels', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: MutationInput) =>
      apiFetch<Record<string, unknown>>(`/vessels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => apiFetch<void>(`/vessels/${id}`, { method: 'DELETE' }),
    positions: (id: number) => apiFetch<Record<string, unknown>[]>(`/vessels/${id}/positions`),
    cargo: (id: number) => apiFetch<Record<string, unknown>[]>(`/vessels/${id}/cargo`),
    routes: (id: number) => apiFetch<Record<string, unknown>[]>(`/vessels/${id}/routes`),
    maintenance: (id: number) => apiFetch<VesselMaintenance[]>(`/vessels/${id}/maintenance`),
    portCalls: (id: number) => apiFetch<PortCall[]>(`/vessels/${id}/port-calls`),
    voyages: (id: number) => apiFetch<VoyageEconomics[]>(`/vessels/${id}/voyages`),
    exceptions: (id: number) => apiFetch<FleetException[]>(`/vessels/${id}/exceptions`),
    sanctions: (id: number) => apiFetch<SanctionsScreening>(`/vessels/${id}/sanctions`),
  },
  sanctionsNetwork: {
    score: (vesselId: number) => apiFetch<Record<string, unknown>>(`/vessels/sanctions/score/${vesselId}`),
    portfolio: () => apiFetch<Record<string, unknown>>('/vessels/sanctions/portfolio'),
    network: (vesselId: number) => apiFetch<Record<string, unknown>>(`/vessels/sanctions/network/${vesselId}`),
    publishHits: (payload: { vesselId: string | number; vesselName?: string; score: number; tier: string; triggeredRules?: string[] }) =>
      apiFetch<Record<string, unknown>>('/vessels/sanctions/publish-hits', { method: 'POST', body: JSON.stringify(payload) }),
  },
  routes: {
    list: () => apiFetch<Record<string, unknown>[]>('/vessels/routes/all'),
    create: (data: MutationInput) =>
      apiFetch<Record<string, unknown>>('/vessels/routes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: MutationInput) =>
      apiFetch<Record<string, unknown>>(`/vessels/routes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => apiFetch<void>(`/vessels/routes/${id}`, { method: 'DELETE' }),
  },
  alertRules: {
    list: () => apiFetch<Record<string, unknown>[]>('/vessels/alert-rules/all'),
    create: (data: MutationInput) =>
      apiFetch<Record<string, unknown>>('/vessels/alert-rules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: MutationInput) =>
      apiFetch<Record<string, unknown>>(`/vessels/alert-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => apiFetch<void>(`/vessels/alert-rules/${id}`, { method: 'DELETE' }),
  },
  alerts: {
    list: () => apiFetch<Record<string, unknown>[]>('/vessels/alerts/all'),
    create: (data: MutationInput) =>
      apiFetch<Record<string, unknown>>('/vessels/alerts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: number, status: 'active' | 'acknowledged' | 'resolved' | 'dismissed') =>
      apiFetch<Record<string, unknown>>(`/vessels/alerts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  weather: {
    snapshots: (routeId?: number) =>
      apiFetch<Record<string, unknown>[]>(
        `/vessels/weather/snapshots${routeId ? `?routeId=${routeId}` : ''}`,
      ),
  },
  simulations: {
    list: () => apiFetch<Record<string, unknown>[]>('/vessels/simulations/all'),
    get: (id: number) => apiFetch<Record<string, unknown>>(`/vessels/simulations/${id}`),
    create: (data: MutationInput) =>
      apiFetch<Record<string, unknown>>('/vessels/simulations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  dashboard: () => apiFetch<VesselsDashboard>('/vessels/dashboard'),
  roster: () => apiFetchList<RosterVessel>('/vessels/roster'),
  vesselDetail: (id: number) => apiFetch<VesselDetail>(`/vessels/${id}/detail`),
  fleetSummary: () => apiFetch<unknown>('/vessels/fleet-summary'),
  exceptions: {
    list: (params?: { status?: string; severity?: string; type?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.severity) q.set('severity', params.severity);
      if (params?.type) q.set('type', params.type);
      const qs = q.toString();
      return apiFetchList<FleetException>(`/vessels/exceptions${qs ? `?${qs}` : ''}`);
    },
    get: (id: number) => apiFetch<FleetException>(`/vessels/exceptions/${id}`),
    create: (data: MutationInput) =>
      apiFetch<FleetException>('/vessels/exceptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    acknowledge: (id: number, notes?: string) =>
      apiFetch<FleetException>(`/vessels/exceptions/${id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    resolve: (id: number, notes: string) =>
      apiFetch<FleetException>(`/vessels/exceptions/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    escalate: (id: number, escalateTo?: string, notes?: string) =>
      apiFetch<FleetException>(`/vessels/exceptions/${id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ escalateTo, notes }),
      }),
  },
  voyages: {
    list: (params?: { status?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      const qs = q.toString();
      return apiFetchList<Voyage>(`/vessels/voyages${qs ? `?${qs}` : ''}`);
    },
    get: (id: number) => apiFetch<Voyage>(`/vessels/voyages/${id}`),
    create: (data: MutationInput) =>
      apiFetch<Voyage>('/vessels/voyages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: MutationInput) =>
      apiFetch<Voyage>(`/vessels/voyages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  voyageEconomics: {
    list: (params?: { status?: string; vesselId?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.vesselId) q.set('vesselId', String(params.vesselId));
      const qs = q.toString();
      return apiFetchList<VoyageEconomics>(`/vessels/voyage-economics${qs ? `?${qs}` : ''}`);
    },
    analytics: () => apiFetch<VoyageEconomicsAnalytics>('/vessels/voyage-economics/analytics'),
  },
  voyageCalc: {
    bunkerPrices: () =>
      apiFetch<BunkerPricesResponse>('/vessels/voyage-calc/bunker-prices'),
    charterRates: () =>
      apiFetch<CharterRatesResponse>('/vessels/voyage-calc/charter-rates'),
  },
  sanctions: {
    list: (params?: { ofacStatus?: string }) => {
      const q = new URLSearchParams();
      if (params?.ofacStatus) q.set('ofacStatus', params.ofacStatus);
      const qs = q.toString();
      return apiFetchList<SanctionsScreening>(`/vessels/sanctions${qs ? `?${qs}` : ''}`);
    },
    summary: () => apiFetch<SanctionsSummary>('/vessels/sanctions/summary'),
  },
  portCalls: {
    list: (params?: { vesselId?: number }) => {
      const q = new URLSearchParams();
      if (params?.vesselId) q.set('vesselId', String(params.vesselId));
      const qs = q.toString();
      return apiFetchList<PortCall>(`/vessels/port-calls${qs ? `?${qs}` : ''}`);
    },
  },
  corridors: {
    list: () => apiFetchList<Corridor>('/vessels/corridors'),
    get: (id: number) => apiFetch<Corridor>(`/vessels/corridors/${id}`),
  },
  maintenance: {
    list: (params?: { status?: string; vesselId?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.vesselId) q.set('vesselId', String(params.vesselId));
      const qs = q.toString();
      return apiFetchList<VesselMaintenance>(`/vessels/maintenance${qs ? `?${qs}` : ''}`);
    },
    get: (id: number) => apiFetch<VesselMaintenance>(`/vessels/maintenance/${id}`),
    create: (data: MutationInput) =>
      apiFetch<VesselMaintenance>('/vessels/maintenance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: MutationInput) =>
      apiFetch<VesselMaintenance>(`/vessels/maintenance/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  ports: {
    list: () => apiFetchList<unknown>('/vessels/ports'),
    get: (id: number) => apiFetch<unknown>(`/vessels/ports/${id}`),
  },
  readiness: () => apiFetch<unknown>('/vessels/readiness'),
  live: {
    chokepoints: () => apiFetch<unknown>('/vessels/live/chokepoints'),
    geopoliticalEvents: () => apiFetch<unknown>('/vessels/live/geopolitical-events'),
    portCongestion: () => apiFetch<unknown>('/vessels/live/port-congestion'),
    marineWeather: (lat?: number, lon?: number) =>
      apiFetch<unknown>(
        `/vessels/live/weather-marine${lat != null && lon != null ? `?lat=${lat}&lon=${lon}` : ''}`,
      ),
  },
  seed: () => apiFetch<{ message: string }>('/vessels/seed', { method: 'POST' }),
  /**
   * A11oy primitive backend (Task #5318). Each surface persists a real
   * Drizzle-backed record:
   *   fleet        = Anatomy
   *   positions    = Substance state-log
   *   risk         = Transformation (Phase-2 perturbation bound)
   *   routePlan    = Connection (Phase-2 anatomy-boundary lemma)
   *   coexistence  = Connection-level Transformation (null-space lemma)
   */
  a11oy: {
    fleet: {
      list: () => apiFetchList<A11oyFleet>('/vessels/fleet'),
      create: (data: A11oyFleetInput) =>
        apiFetch<A11oyFleet>('/vessels/fleet', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
    positions: {
      list: (params?: { fleetRef?: string; vesselImo?: string; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.fleetRef) q.set('fleetRef', params.fleetRef);
        if (params?.vesselImo) q.set('vesselImo', params.vesselImo);
        if (params?.limit) q.set('limit', String(params.limit));
        const qs = q.toString();
        return apiFetchList<A11oyPosition>(`/vessels/positions${qs ? `?${qs}` : ''}`);
      },
      record: (data: A11oyPositionInput) =>
        apiFetch<A11oyPosition>('/vessels/positions', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
    risk: {
      list: (params?: { fleetRef?: string; vesselImo?: string }) => {
        const q = new URLSearchParams();
        if (params?.fleetRef) q.set('fleetRef', params.fleetRef);
        if (params?.vesselImo) q.set('vesselImo', params.vesselImo);
        const qs = q.toString();
        return apiFetchList<A11oyRiskSnapshot>(`/vessels/risk${qs ? `?${qs}` : ''}`);
      },
      compute: (data: A11oyRiskInput) =>
        apiFetch<A11oyRiskSnapshot>('/vessels/risk', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
    routePlan: {
      list: (params?: { fleetRef?: string; vesselImo?: string }) => {
        const q = new URLSearchParams();
        if (params?.fleetRef) q.set('fleetRef', params.fleetRef);
        if (params?.vesselImo) q.set('vesselImo', params.vesselImo);
        const qs = q.toString();
        return apiFetchList<A11oyRoute>(`/vessels/route-plan${qs ? `?${qs}` : ''}`);
      },
      compute: (data: A11oyRouteInput) =>
        apiFetch<{ route: A11oyRoute; anatomyBoundary: A11oyAnatomyBoundary }>(
          '/vessels/route-plan',
          { method: 'POST', body: JSON.stringify(data) },
        ),
    },
    coexistence: {
      list: (params?: { fleetRef?: string; routeId?: number }) => {
        const q = new URLSearchParams();
        if (params?.fleetRef) q.set('fleetRef', params.fleetRef);
        if (params?.routeId) q.set('routeId', String(params.routeId));
        const qs = q.toString();
        return apiFetchList<A11oyCoexistenceReport>(
          `/vessels/coexistence${qs ? `?${qs}` : ''}`,
        );
      },
      compute: (data: A11oyCoexistenceInput) =>
        apiFetch<A11oyCoexistenceReport>('/vessels/coexistence', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
  },
};

// ─── A11oy primitive backend types (Task #5318) ─────────────────────────────

export interface A11oyFleet {
  id: number;
  orgId: number | null;
  fleetRef: string;
  name: string;
  operator: string | null;
  vesselCount: number;
  anatomySeal: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface A11oyFleetInput {
  fleetRef: string;
  name: string;
  operator?: string;
  vesselCount?: number;
  anatomySeal?: string;
  metadata?: Record<string, unknown>;
}

export interface A11oyPosition {
  id: number;
  orgId: number | null;
  fleetRef: string;
  vesselImo: string;
  latitude: number;
  longitude: number;
  speedKnots: number | null;
  headingDeg: number | null;
  source: string;
  recordedAt: string;
}

export interface A11oyPositionInput {
  fleetRef: string;
  vesselImo: string;
  latitude: number;
  longitude: number;
  speedKnots?: number;
  headingDeg?: number;
  source?: string;
  recordedAt?: string;
}

export type A11oyRiskSeverity = 'normal' | 'watch' | 'elevated' | 'critical';

export interface A11oyRiskSnapshot {
  id: number;
  orgId: number | null;
  fleetRef: string;
  vesselImo: string | null;
  perturbationBound: number;
  severity: A11oyRiskSeverity;
  factors: { factors: Record<string, number>; weights: Record<string, number> | null } | null;
  receiptHash: string | null;
  computedAt: string;
}

export interface A11oyRiskInput {
  fleetRef: string;
  vesselImo?: string;
  factors: Record<string, number>;
  weights?: Record<string, number>;
}

export interface A11oyRoute {
  id: number;
  orgId: number | null;
  fleetRef: string;
  vesselImo: string;
  originPort: string;
  destinationPort: string;
  waypoints: Array<{ lat: number; lon: number; label?: string }>;
  rfCoexistenceVector: number[] | null;
  anatomyBoundaryOk: boolean;
  anatomyBoundaryNotes: string | null;
  receiptHash: string | null;
  createdAt: string;
}

export interface A11oyRouteInput {
  fleetRef: string;
  vesselImo: string;
  originPort: string;
  destinationPort: string;
  waypoints: Array<{ lat: number; lon: number; label?: string }>;
  rfCoexistenceVector?: number[];
  anatomyMaxDeviationKm?: number;
}

export interface A11oyAnatomyBoundary {
  ok: boolean;
  notes: string | null;
  maxObservedKm: number;
}

export interface A11oyCoexistenceReport {
  id: number;
  orgId: number | null;
  fleetRef: string;
  routeId: number | null;
  rfBands: Array<{ band: string; utilization: number }>;
  nullSpaceProjection: number[];
  interferenceScore: number;
  receiptHash: string | null;
  computedAt: string;
}

export interface A11oyCoexistenceInput {
  fleetRef: string;
  routeId?: number;
  bands: Array<{ band: string; utilization: number }>;
  bandWeights?: number[];
}
