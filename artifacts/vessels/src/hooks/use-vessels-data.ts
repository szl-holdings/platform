import { useQuery } from '@tanstack/react-query';
import type { VesselProfile } from '@/data/types';
import {
  api,
  type PortCall,
  type RosterVessel,
  type SanctionsScreening,
  type VesselDetail,
  type VoyageEconomics,
} from '@/lib/api';

type ExceptionType =
  | 'route_deviation'
  | 'delay_risk'
  | 'port_congestion'
  | 'weather_disruption'
  | 'maintenance_risk'
  | 'fuel_anomaly'
  | 'schedule_variance'
  | 'security_alert'
  | 'ais_dark'
  | 'sanctions_match'
  | 'overdue_arrival'
  | 'inspection_failure';
type ExceptionSeverity = 'critical' | 'high' | 'watch' | 'normal';
type ExceptionStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';
type MaintenanceType = 'scheduled' | 'emergency' | 'predictive' | 'regulatory';
type MaintenanceStatus = 'overdue' | 'due_soon' | 'scheduled' | 'in_progress' | 'completed';
type MaintenancePriority = 'critical' | 'high' | 'medium' | 'low';
type CharterType = 'time_charter' | 'voyage_charter' | 'spot' | 'bareboat';
type VoyageStatus = 'planned' | 'loading' | 'at_sea' | 'completed' | 'cancelled' | 'active';

function toExceptionType(val: string | null | undefined): ExceptionType {
  const valid: ExceptionType[] = [
    'route_deviation',
    'delay_risk',
    'port_congestion',
    'weather_disruption',
    'maintenance_risk',
    'fuel_anomaly',
    'schedule_variance',
    'security_alert',
    'ais_dark',
    'sanctions_match',
    'overdue_arrival',
    'inspection_failure',
  ];
  return val && valid.includes(val as ExceptionType) ? (val as ExceptionType) : 'route_deviation';
}

function toExceptionSeverity(val: string | null | undefined): ExceptionSeverity {
  const valid: ExceptionSeverity[] = ['critical', 'high', 'watch', 'normal'];
  return val && valid.includes(val as ExceptionSeverity) ? (val as ExceptionSeverity) : 'watch';
}

function toExceptionStatus(val: string | null | undefined): ExceptionStatus {
  const valid: ExceptionStatus[] = ['active', 'acknowledged', 'resolved', 'dismissed'];
  return val && valid.includes(val as ExceptionStatus) ? (val as ExceptionStatus) : 'active';
}

function toMaintenanceType(val: string | null | undefined): MaintenanceType {
  const valid: MaintenanceType[] = ['scheduled', 'emergency', 'predictive', 'regulatory'];
  return val && valid.includes(val as MaintenanceType) ? (val as MaintenanceType) : 'scheduled';
}

function toMaintenanceStatus(val: string | null | undefined): MaintenanceStatus {
  const valid: MaintenanceStatus[] = [
    'overdue',
    'due_soon',
    'scheduled',
    'in_progress',
    'completed',
  ];
  return val && valid.includes(val as MaintenanceStatus) ? (val as MaintenanceStatus) : 'scheduled';
}

function toMaintenancePriority(val: string | null | undefined): MaintenancePriority {
  const valid: MaintenancePriority[] = ['critical', 'high', 'medium', 'low'];
  return val && valid.includes(val as MaintenancePriority)
    ? (val as MaintenancePriority)
    : 'medium';
}

function toCharterType(val: string | null | undefined): CharterType {
  const valid: CharterType[] = ['time_charter', 'voyage_charter', 'spot', 'bareboat'];
  return val && valid.includes(val as CharterType) ? (val as CharterType) : 'spot';
}

function toVoyageStatus(val: string | null | undefined): VoyageStatus {
  const valid: VoyageStatus[] = ['planned', 'loading', 'at_sea', 'completed', 'cancelled'];
  return val && valid.includes(val as VoyageStatus) ? (val as VoyageStatus) : 'at_sea';
}

function mapStatusToProfile(apiStatus: string): VesselProfile['status'] {
  const map: Record<string, VesselProfile['status']> = {
    active: 'at_sea',
    at_sea: 'at_sea',
    in_port: 'in_port',
    anchored: 'anchored',
    maintenance: 'maintenance',
    decommissioned: 'maintenance',
  };
  return map[apiStatus] ?? 'at_sea';
}

function mapApiVesselToProfile(apiVessel: Record<string, unknown>): VesselProfile {
  return {
    id: apiVessel['id'] as number,
    name: (apiVessel['name'] as string) ?? 'Unknown Vessel',
    imo: (apiVessel['imo'] as string | null) ?? '—',
    mmsi: (apiVessel['mmsi'] as string | null) ?? '—',
    flag: (apiVessel['flag'] as string | null) ?? '—',
    type: (apiVessel['vesselType'] as string | null) ?? 'Cargo',
    status: mapStatusToProfile(apiVessel['status'] as string),
    yearBuilt: (apiVessel['yearBuilt'] as number | null) ?? 2000,
    utilization: 0,
    dwt: 0,
    gt: 0,
    loa: 0,
    beam: 0,
    draft: 0,
    engineType: '—',
    fuelConsumption: 0,
    currentPort: null,
    destination: null,
    eta: null,
    lat: null,
    lon: null,
    course: null,
    speed: null,
    nextServiceDue: null,
    classSociety: '—',
    owner: '—',
    operator: '—',
    charterer: null,
    charterType: null,
    charterRate: null,
    charterExpiry: null,
    insuranceExpiry: null,
    lastInspection: null,
    nextInspection: null,
    deficiencies: 0,
    detentions: 0,
    aiBriefing: null,
    riskScore: 0,
    complianceScore: 100,
    emissionsIntensity: 0,
  } as unknown as VesselProfile;
}

export function useVessels() {
  const {
    data: apiVessels = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => api.vessels.list(),
    refetchInterval: 300_000,
  });

  const isLive = apiVessels.length > 0;
  const vessels: VesselProfile[] = (apiVessels as Record<string, unknown>[]).map(
    mapApiVesselToProfile,
  );

  return { vessels, isLoading, error, isLive, refetch };
}

export function useVesselsDashboard() {
  return useQuery({
    queryKey: ['vessels-dashboard'],
    queryFn: () => api.dashboard(),
    refetchInterval: 300_000,
  });
}

export function useFleetExceptions(params?: { status?: string; severity?: string; type?: string }) {
  const {
    data: apiExceptions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['fleet-exceptions', params],
    queryFn: () => api.exceptions.list(params),
    refetchInterval: 300_000,
  });

  const isLive = apiExceptions.length > 0;

  const fleetExceptions = apiExceptions.map((e: any) => ({
    id: String(e['id']),
    type: toExceptionType(e['exceptionType'] as string | null | undefined),
    severity: toExceptionSeverity(e['severity'] as string | null | undefined),
    vesselId: (e['vesselId'] as number) ?? 0,
    vesselName: (e['vesselName'] as string) ?? `Vessel #${(e['vesselId'] as number) ?? 0}`,
    route: '—',
    title: (e['title'] as string) ?? '',
    description: (e['description'] as string) ?? '',
    whyItMatters: (e['whyItMatters'] as string) ?? '',
    recommendedResponse: (e['recommendedResponse'] as string) ?? '',
    businessConsequence: (e['businessConsequence'] as string) ?? '',
    owner: (e['owner'] as string) ?? '—',
    ownerFunction: (e['ownerFunction'] as string) ?? '—',
    detectedAt: (e['detectedAt'] as string) ?? '',
    acknowledgedAt: (e['acknowledgedAt'] as string | null) ?? null,
    resolvedAt: (e['resolvedAt'] as string | null) ?? null,
    status: toExceptionStatus(e['status'] as string | null | undefined),
    estimatedImpactUSD: parseFloat((e['estimatedImpactUsd'] as string) ?? '0'),
  }));

  return { fleetExceptions, isLoading, error, isLive, refetch };
}

export type VoyageRow = {
  voyageId: string;
  vesselId: number;
  vesselName: string;
  route: string;
  origin: string | null;
  destination: string | null;
  cargoType: string;
  estimatedRevenue: number;
  operatingCost: number;
  fuelCost: number;
  portCost: number;
  delayCost: number;
  marginEstimate: number;
  marginPct: number;
  tce: number;
  delayHours: number;
  charterType: CharterType;
  status: VoyageStatus;
  distanceNm: number;
  durationDays: number;
  performanceVsBudget?: number;
  voyageRef: string | null;
  vesselClass: string | null;
};

export function useVoyages() {
  // Use the new vessel_voyage_economics table which has real seeded data
  const {
    data: apiVoyages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['voyage-economics'],
    queryFn: () => api.voyageEconomics.list(),
    refetchInterval: 120_000,
  });

  const isLive = apiVoyages.length > 0;

  const voyageEconomics: VoyageRow[] = (apiVoyages as VoyageEconomics[]).map((v) => {
    const grossRevenue = parseFloat(v.grossRevenue ?? '0');
    const totalCosts = parseFloat(v.totalCostsUsd ?? '0');
    const netMargin = parseFloat(v.netMarginUsd ?? '0');
    const marginPct = parseFloat(v.marginPct ?? '0');
    const tce = parseFloat(v.tcePerDay ?? '0');
    const delayHours = parseFloat(v.delayHours ?? '0');
    const delayCost = parseFloat(v.delayCostUsd ?? '0');
    return {
      voyageId: String(v.id),
      vesselId: v.vesselId,
      route: `${v.originPort} → ${v.destinationPort}`,
      origin: v.originPort,
      destination: v.destinationPort,
      cargoType: v.cargoType ?? '—',
      estimatedRevenue: grossRevenue,
      operatingCost: totalCosts,
      fuelCost: parseFloat(v.fuelCostUsd ?? '0'),
      portCost: parseFloat(v.portCostsUsd ?? '0'),
      delayCost: delayCost,
      marginEstimate: netMargin,
      marginPct: marginPct,
      tce: tce,
      delayHours: delayHours,
      charterType: toCharterType(v.charterType),
      status: toVoyageStatus(v.status),
      distanceNm: parseFloat(v.distanceNm ?? '0'),
      durationDays: parseFloat(v.durationDays ?? '0'),
      voyageRef: v.voyageRef,
      vesselName: v.vesselName ?? `Vessel #${v.vesselId}`,
      vesselClass: v.vesselClass ?? null,
    };
  });

  return { voyageEconomics, isLoading, error, isLive, refetch };
}

export function useVoyageEconomicsAnalytics() {
  return useQuery({
    queryKey: ['voyage-economics-analytics'],
    queryFn: () => api.voyageEconomics.analytics(),
    refetchInterval: 300_000,
  });
}

export function useMaintenance(params?: { status?: string; vesselId?: number }) {
  const {
    data: apiMaintenance = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['maintenance', params],
    queryFn: () => api.maintenance.list(params),
    refetchInterval: 120_000,
  });

  const isLive = apiMaintenance.length > 0;

  const maintenanceItems = apiMaintenance.map((m: any) => ({
    id: m['id'] as number,
    vesselId: m['vesselId'] as number,
    vesselName: (m['vesselName'] as string) ?? `Vessel #${m['vesselId'] as number}`,
    vesselType: m['vesselType'] as string | null,
    vesselFlag: m['vesselFlag'] as string | null,
    component: m['component'] as string,
    type: toMaintenanceType(m['maintenanceType'] as string | null | undefined),
    description: (m['description'] as string) ?? '',
    dueDate: (m['dueDate'] as string) ?? '',
    status: toMaintenanceStatus(m['status'] as string | null | undefined),
    priority: toMaintenancePriority(m['priority'] as string | null | undefined),
    estimatedCost: parseFloat((m['estimatedCost'] as string) ?? '0'),
    daysToDue: m['dueDate']
      ? Math.round((new Date(m['dueDate'] as string).getTime() - Date.now()) / 86400000)
      : 999,
    riskOfServiceIssue: parseFloat((m['riskOfServiceIssue'] as string) ?? '0'),
    impactsVoyageAvailability: (m['impactsVoyageAvailability'] as boolean) ?? false,
    technician: (m['technician'] as string) ?? '—',
    assetHealth: parseFloat((m['assetHealth'] as string) ?? '75'),
    notes: m['notes'] as string | null,
  }));

  return { maintenanceItems, isLoading, error, isLive, refetch };
}

export function useSanctions(params?: { ofacStatus?: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sanctions', params],
    queryFn: () => api.sanctions.list(params),
    refetchInterval: 300_000,
  });

  const isLive = (data?.length ?? 0) > 0;

  return { screenings: (data ?? []) as SanctionsScreening[], isLoading, error, isLive, refetch };
}

export function useSanctionsSummary() {
  return useQuery({
    queryKey: ['sanctions-summary'],
    queryFn: () => api.sanctions.summary(),
    refetchInterval: 300_000,
  });
}

export function usePortCalls(params?: { vesselId?: number }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['port-calls', params],
    queryFn: () => api.portCalls.list(params),
    refetchInterval: 120_000,
  });

  return { portCalls: (data ?? []) as PortCall[], isLoading, error, refetch };
}

export function usePerformanceMetrics() {
  const { vessels, isLoading: vLoading } = useVessels();
  const { voyageEconomics, isLoading: voyLoading } = useVoyages();

  const isLoading = vLoading || voyLoading;

  const performanceMetrics = vessels.map((v) => {
    const vesselVoyages = voyageEconomics.filter((voyage) => voyage.vesselId === v.id);
    const tce =
      vesselVoyages.length > 0
        ? vesselVoyages.reduce((s, voy) => s + voy.tce, 0) / vesselVoyages.length
        : 0;
    return {
      vesselId: v.id,
      vesselName: v.name,
      utilization: ((v as any)['utilization'] as number) ?? 0,
      tce,
      fuelEfficiency: 0,
      onTimeArrivalRate: 0,
      avgDelayHours: 0,
      routeProfitability: 0,
      cargoTonnes: 0,
      revenuePerDay: 0,
    };
  });

  return { performanceMetrics, isLoading };
}

export function useRoster() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['vessels-roster'],
    queryFn: () => api.roster(),
    refetchInterval: 60_000,
  });

  const isLive = (data?.length ?? 0) > 0;
  return {
    roster: (data ?? []) as RosterVessel[],
    isLoading,
    error,
    isLive,
    refetch,
    isRefetching,
  };
}

export function useVesselDetail(id: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vessel-detail', id],
    queryFn: () => api.vesselDetail(id),
    enabled: id > 0,
    refetchInterval: 60_000,
  });

  return { detail: (data ?? null) as VesselDetail | null, isLoading, error, refetch };
}
