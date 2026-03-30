import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { vesselsDomainMockData, type VesselProfile } from "@/data/mock-data";

function mapStatusToProfile(apiStatus: string): VesselProfile["status"] {
  const map: Record<string, VesselProfile["status"]> = {
    active: "at_sea",
    at_sea: "at_sea",
    in_port: "in_port",
    anchored: "anchored",
    maintenance: "maintenance",
    decommissioned: "maintenance",
  };
  return map[apiStatus] ?? "at_sea";
}

function mergeApiVesselWithMock(apiVessel: any, mockFallback: VesselProfile): VesselProfile {
  return {
    ...mockFallback,
    id: apiVessel.id,
    name: apiVessel.name,
    imo: apiVessel.imo ?? mockFallback.imo,
    mmsi: apiVessel.mmsi ?? mockFallback.mmsi,
    flag: apiVessel.flag ?? mockFallback.flag,
    type: apiVessel.vesselType ?? mockFallback.type,
    status: mapStatusToProfile(apiVessel.status),
    yearBuilt: apiVessel.yearBuilt ?? mockFallback.yearBuilt,
  };
}

export function useVessels() {
  const { data: apiVessels = [], isLoading, error, refetch } = useQuery({
    queryKey: ["vessels"],
    queryFn: () => api.vessels.list(),
    refetchInterval: 60_000,
  });

  const isLive = apiVessels.length > 0;
  const mockVessels = vesselsDomainMockData.vessels;

  const vessels: VesselProfile[] = isLive
    ? apiVessels.map((v: any, i: number) => mergeApiVesselWithMock(v, mockVessels[i % mockVessels.length]))
    : mockVessels;

  return { vessels, isLoading, error, isLive, refetch };
}

export function useFleetExceptions() {
  const { data: apiExceptions = [], isLoading, error, refetch } = useQuery({
    queryKey: ["fleet-exceptions"],
    queryFn: () => api.exceptions.list(),
    refetchInterval: 60_000,
  });

  const isLive = apiExceptions.length > 0;
  const mockExceptions = vesselsDomainMockData.fleetExceptions;

  const fleetExceptions = isLive
    ? apiExceptions.map((e: any) => ({
        id: String(e.id),
        type: (e.exceptionType ?? "route_deviation") as any,
        severity: (e.severity ?? "watch") as any,
        vesselId: e.vesselId ?? 0,
        vesselName: e.owner ?? `Vessel #${e.vesselId ?? 0}`,
        route: "—",
        title: e.title,
        description: e.description,
        whyItMatters: e.whyItMatters ?? "",
        recommendedResponse: e.recommendedResponse ?? "",
        businessConsequence: e.businessConsequence ?? "",
        owner: e.owner ?? "—",
        ownerFunction: e.ownerFunction ?? "—",
        detectedAt: e.detectedAt,
        acknowledgedAt: e.acknowledgedAt,
        resolvedAt: e.resolvedAt,
        status: (e.status ?? "active") as any,
        estimatedImpactUSD: parseFloat(e.estimatedImpactUsd ?? "0"),
      }))
    : mockExceptions;

  return { fleetExceptions, isLoading, error, isLive, refetch };
}

export function useVoyages() {
  const { data: apiVoyages = [], isLoading, error, refetch } = useQuery({
    queryKey: ["voyages"],
    queryFn: () => api.voyages.list(),
    refetchInterval: 120_000,
  });

  const isLive = apiVoyages.length > 0;
  const mockVoyages = vesselsDomainMockData.voyageEconomics;

  const voyageEconomics = isLive
    ? apiVoyages.map((v: any, i: number) => {
        const mock = mockVoyages[i % mockVoyages.length];
        return {
          ...mock,
          voyageId: String(v.id),
          vesselId: v.vesselId ?? mock.vesselId,
          vesselName: mock.vesselName,
          route: v.originLabel && v.destinationLabel ? `${v.originLabel} → ${v.destinationLabel}` : mock.route,
          origin: v.originLabel ?? mock.origin,
          destination: v.destinationLabel ?? mock.destination,
          cargoType: v.cargoType ?? mock.cargoType,
          estimatedRevenue: parseFloat(v.estimatedRevenue ?? "0") || mock.estimatedRevenue,
          operatingCost: parseFloat(v.operatingCost ?? "0") || mock.operatingCost,
          fuelCost: parseFloat(v.fuelCost ?? "0") || mock.fuelCost,
          portCost: parseFloat(v.portCost ?? "0") || mock.portCost,
          delayCost: parseFloat(v.delayCost ?? "0") || mock.delayCost,
          marginEstimate: parseFloat(v.marginEstimate ?? "0") || mock.marginEstimate,
          marginPct: parseFloat(v.marginPct ?? "0") || mock.marginPct,
          tce: parseFloat(v.tce ?? "0") || mock.tce,
          delayHours: v.delayHours ?? mock.delayHours,
          charterType: (v.charterType ?? mock.charterType) as any,
          status: (v.status ?? mock.status) as any,
        };
      })
    : mockVoyages;

  return { voyageEconomics, isLoading, error, isLive, refetch };
}

export function useMaintenance() {
  const { data: apiMaintenance = [], isLoading, error, refetch } = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => api.maintenance.list(),
    refetchInterval: 120_000,
  });

  const isLive = apiMaintenance.length > 0;
  const mockItems = vesselsDomainMockData.maintenanceItems;

  const maintenanceItems = isLive
    ? apiMaintenance.map((m: any) => ({
        id: m.id,
        vesselId: m.vesselId,
        vesselName: `Vessel #${m.vesselId}`,
        component: m.component,
        type: (m.maintenanceType ?? "scheduled") as any,
        description: m.description ?? "",
        dueDate: m.dueDate ?? "",
        status: (m.status ?? "scheduled") as any,
        priority: (m.priority ?? "medium") as any,
        estimatedCost: parseFloat(m.estimatedCost ?? "0"),
        daysToDue: m.dueDate ? Math.round((new Date(m.dueDate).getTime() - Date.now()) / 86400000) : 999,
        riskOfServiceIssue: parseFloat(m.riskOfServiceIssue ?? "0"),
        impactsVoyageAvailability: m.impactsVoyageAvailability ?? false,
        technician: m.technician ?? "—",
        assetHealth: parseFloat(m.assetHealth ?? "75"),
      }))
    : mockItems;

  return { maintenanceItems, isLoading, error, isLive, refetch };
}

export function usePerformanceMetrics() {
  const { vessels, isLoading: vLoading } = useVessels();
  const { voyageEconomics, isLoading: voyLoading } = useVoyages();

  const isLoading = vLoading || voyLoading;
  const mockMetrics = vesselsDomainMockData.performanceMetrics;

  const performanceMetrics = vessels.map((v, i) => {
    const mock = mockMetrics[i % mockMetrics.length];
    const vesselVoyages = voyageEconomics.filter(voyage => voyage.vesselId === v.id);
    const tce = vesselVoyages.length > 0
      ? vesselVoyages.reduce((s, voy) => s + voy.tce, 0) / vesselVoyages.length
      : mock.tce;
    return {
      ...mock,
      vesselId: v.id,
      vesselName: v.name,
      utilization: v.utilization,
      tce,
    };
  });

  return { performanceMetrics, isLoading };
}
