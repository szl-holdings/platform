import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import type {
  VesselProfile,
  MaintenanceLog,
  ComplianceCertificate,
  PortStateDeficiency,
  ShipmentRecord,
  EventLog,
  EmissionRecord,
  AIBriefing,
  PredictiveMaintenance,
  ForecastModule,
  SanctionsRiskIndicator,
  ComplianceAlert,
  Fleet,
} from "./types";

export interface DataProvider {
  getVessels(): Promise<VesselProfile[]>;
  getVessel(id: number): Promise<VesselProfile | undefined>;
  getFleets(): Promise<Fleet[]>;
  getMaintenanceLogs(vesselId?: number): Promise<MaintenanceLog[]>;
  getComplianceCertificates(vesselId?: number): Promise<ComplianceCertificate[]>;
  getPortStateDeficiencies(vesselId?: number): Promise<PortStateDeficiency[]>;
  getShipmentRecords(vesselId?: number): Promise<ShipmentRecord[]>;
  getEventLogs(filters?: { severity?: string; search?: string; vesselId?: number }): Promise<EventLog[]>;
  getEmissionRecords(vesselId?: number): Promise<EmissionRecord[]>;
  getAIBriefings(): Promise<AIBriefing[]>;
  getPredictiveMaintenanceItems(): Promise<PredictiveMaintenance[]>;
  getForecastModules(): Promise<ForecastModule[]>;
  getSanctionsRiskIndicators(): Promise<SanctionsRiskIndicator[]>;
  getComplianceAlerts(): Promise<ComplianceAlert[]>;
  getFleetKPIs(): Promise<FleetKPIs>;
}

export interface FleetKPIs {
  totalVessels: number;
  atSea: number;
  inPort: number;
  anchored: number;
  maintenance: number;
  averageTCE: number;
  averageUtilization: number;
  averageCII: string;
  totalCO2Today: number;
  activeAlerts: number;
  criticalAlerts: number;
  fleetHealthScore: number;
  operationalScore: number;
  complianceScore: number;
  safetyScore: number;
  environmentalScore: number;
}

async function safeFetch<T>(fn: () => Promise<T>, emptyVal: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return emptyVal;
  }
}

class ApiDataProvider implements DataProvider {
  async getVessels(): Promise<VesselProfile[]> {
    return safeFetch(async () => {
      const raw = await apiFetch<VesselProfile[]>("/vessels");
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getVessel(id: number): Promise<VesselProfile | undefined> {
    try {
      const raw = await apiFetch<VesselProfile>(`/vessels/${id}`);
      if (raw) return raw;
    } catch { /* fall through */ }
    return undefined;
  }

  async getFleets(): Promise<Fleet[]> {
    return safeFetch(async () => {
      const raw = await apiFetch<Fleet[]>("/vessels/fleets");
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getMaintenanceLogs(vesselId?: number): Promise<MaintenanceLog[]> {
    return safeFetch(async () => {
      const qs = vesselId ? `?vesselId=${vesselId}` : "";
      const raw = await apiFetch<MaintenanceLog[]>(`/vessels/maintenance${qs}`);
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getComplianceCertificates(vesselId?: number): Promise<ComplianceCertificate[]> {
    return safeFetch(async () => {
      const qs = vesselId ? `?vesselId=${vesselId}` : "";
      const raw = await apiFetch<ComplianceCertificate[]>(`/vessels/certificates${qs}`);
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getPortStateDeficiencies(vesselId?: number): Promise<PortStateDeficiency[]> {
    return safeFetch(async () => {
      const qs = vesselId ? `?vesselId=${vesselId}` : "";
      const raw = await apiFetch<PortStateDeficiency[]>(`/vessels/port-state-deficiencies${qs}`);
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getShipmentRecords(vesselId?: number): Promise<ShipmentRecord[]> {
    return safeFetch(async () => {
      const qs = vesselId ? `?vesselId=${vesselId}` : "";
      const raw = await apiFetch<ShipmentRecord[]>(`/vessels/shipments${qs}`);
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getEventLogs(filters?: { severity?: string; search?: string; vesselId?: number }): Promise<EventLog[]> {
    return safeFetch(async () => {
      const q = new URLSearchParams();
      if (filters?.severity && filters.severity !== "All") q.set("severity", filters.severity);
      if (filters?.vesselId) q.set("vesselId", String(filters.vesselId));
      if (filters?.search) q.set("search", filters.search);
      const qs = q.toString();
      const raw = await apiFetch<EventLog[]>(`/vessels/event-logs${qs ? `?${qs}` : ""}`);
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getEmissionRecords(vesselId?: number): Promise<EmissionRecord[]> {
    return safeFetch(async () => {
      const qs = vesselId ? `?vesselId=${vesselId}` : "";
      const raw = await apiFetch<EmissionRecord[]>(`/vessels/emissions${qs}`);
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getAIBriefings(): Promise<AIBriefing[]> {
    return safeFetch(async () => {
      const raw = await apiFetch<AIBriefing[]>("/vessels/ai-briefings");
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getPredictiveMaintenanceItems(): Promise<PredictiveMaintenance[]> {
    return safeFetch(async () => {
      const raw = await apiFetch<PredictiveMaintenance[]>("/vessels/predictive-maintenance");
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getForecastModules(): Promise<ForecastModule[]> {
    return safeFetch(async () => {
      const raw = await apiFetch<ForecastModule[]>("/vessels/forecast-modules");
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getSanctionsRiskIndicators(): Promise<SanctionsRiskIndicator[]> {
    return safeFetch(async () => {
      const raw = await apiFetch<SanctionsRiskIndicator[]>("/vessels/sanctions-risk");
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getComplianceAlerts(): Promise<ComplianceAlert[]> {
    return safeFetch(async () => {
      const raw = await apiFetch<ComplianceAlert[]>("/vessels/compliance-alerts");
      return Array.isArray(raw) ? raw : [];
    }, []);
  }

  async getFleetKPIs(): Promise<FleetKPIs> {
    return safeFetch(async () => {
      const dashboard = await apiFetch<{ summary: { totalVessels: number; activeExceptions: number }; statusDistribution: Array<{ status: string; count: number }> }>("/vessels/dashboard");
      if (!dashboard || !dashboard.summary) return {
        totalVessels: 0, atSea: 0, inPort: 0, anchored: 0, maintenance: 0,
        averageTCE: 0, averageUtilization: 0, averageCII: "N/A",
        totalCO2Today: 0, activeAlerts: 0, criticalAlerts: 0,
        fleetHealthScore: 0, operationalScore: 0, complianceScore: 0, safetyScore: 0, environmentalScore: 0,
      };
      const get = (status: string) => dashboard.statusDistribution?.find(d => d.status === status)?.count ?? 0;
      const totalVessels = dashboard.summary.totalVessels ?? 0;
      return {
        totalVessels,
        atSea: get("at_sea"),
        inPort: get("in_port"),
        anchored: get("anchored"),
        maintenance: get("maintenance"),
        averageTCE: 0, averageUtilization: 0, averageCII: "B",
        totalCO2Today: 0,
        activeAlerts: dashboard.summary.activeExceptions ?? 0,
        criticalAlerts: 0,
        fleetHealthScore: 0, operationalScore: 0, complianceScore: 0, safetyScore: 0, environmentalScore: 0,
      };
    }, {
      totalVessels: 0, atSea: 0, inPort: 0, anchored: 0, maintenance: 0,
      averageTCE: 0, averageUtilization: 0, averageCII: "N/A",
      totalCO2Today: 0, activeAlerts: 0, criticalAlerts: 0,
      fleetHealthScore: 0, operationalScore: 0, complianceScore: 0, safetyScore: 0, environmentalScore: 0,
    });
  }
}

export const dataProvider: DataProvider = new ApiDataProvider();
