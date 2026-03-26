import { mockData } from "./mock-data";
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
} from "./mock-data";

export interface DataProvider {
  getVessels(): Promise<VesselProfile[]>;
  getVessel(id: number): Promise<VesselProfile | undefined>;
  getFleets(): Promise<typeof mockData.fleets>;
  getMaintenanceLogs(vesselId?: number): Promise<MaintenanceLog[]>;
  getComplianceCertificates(vesselId?: number): Promise<ComplianceCertificate[]>;
  getPortStateDeficiencies(vesselId?: number): Promise<PortStateDeficiency[]>;
  getShipmentRecords(vesselId?: number): Promise<ShipmentRecord[]>;
  getEventLogs(filters?: { severity?: string; search?: string; vesselId?: number }): Promise<EventLog[]>;
  getEmissionRecords(vesselId?: number): Promise<EmissionRecord[]>;
  getAIBriefings(): Promise<AIBriefing[]>;
  getPredictiveMaintenanceItems(): Promise<PredictiveMaintenance[]>;
  getForecastModules(): Promise<ForecastModule[]>;
  getSanctionsRiskIndicators(): Promise<typeof mockData.sanctionsRiskIndicators>;
  getComplianceAlerts(): Promise<typeof mockData.complianceAlerts>;
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

function delay(ms: number = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class MockDataProvider implements DataProvider {
  async getVessels() {
    await delay();
    return mockData.vessels;
  }

  async getVessel(id: number) {
    await delay();
    return mockData.vessels.find(v => v.id === id);
  }

  async getFleets() {
    await delay();
    return mockData.fleets;
  }

  async getMaintenanceLogs(vesselId?: number) {
    await delay();
    if (vesselId) return mockData.maintenanceLogs.filter(m => m.vesselId === vesselId);
    return mockData.maintenanceLogs;
  }

  async getComplianceCertificates(vesselId?: number) {
    await delay();
    if (vesselId) return mockData.complianceCertificates.filter(c => c.vesselId === vesselId);
    return mockData.complianceCertificates;
  }

  async getPortStateDeficiencies(vesselId?: number) {
    await delay();
    if (vesselId) return mockData.portStateDeficiencies.filter(d => d.vesselId === vesselId);
    return mockData.portStateDeficiencies;
  }

  async getShipmentRecords(vesselId?: number) {
    await delay();
    if (vesselId) return mockData.shipmentRecords.filter(s => s.vesselId === vesselId);
    return mockData.shipmentRecords;
  }

  async getEventLogs(filters?: { severity?: string; search?: string; vesselId?: number }) {
    await delay();
    let logs = [...mockData.eventLogs];
    if (filters?.severity && filters.severity !== "All") {
      logs = logs.filter(l => l.severity === filters.severity);
    }
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      logs = logs.filter(l =>
        l.message.toLowerCase().includes(term) ||
        l.vesselName.toLowerCase().includes(term) ||
        l.details.toLowerCase().includes(term) ||
        l.category.toLowerCase().includes(term)
      );
    }
    if (filters?.vesselId) {
      logs = logs.filter(l => l.vesselId === filters.vesselId);
    }
    return logs;
  }

  async getEmissionRecords(vesselId?: number) {
    await delay();
    if (vesselId) return mockData.emissionRecords.filter(e => e.vesselId === vesselId);
    return mockData.emissionRecords;
  }

  async getAIBriefings() {
    await delay();
    return mockData.aiBriefings;
  }

  async getPredictiveMaintenanceItems() {
    await delay();
    return mockData.predictiveMaintenanceItems;
  }

  async getForecastModules() {
    await delay();
    return mockData.forecastModules;
  }

  async getSanctionsRiskIndicators() {
    await delay();
    return mockData.sanctionsRiskIndicators;
  }

  async getComplianceAlerts() {
    await delay();
    return mockData.complianceAlerts;
  }

  async getFleetKPIs(): Promise<FleetKPIs> {
    await delay();
    const v = mockData.vessels;
    const atSea = v.filter(x => x.status === "at_sea").length;
    const inPort = v.filter(x => x.status === "in_port").length;
    const anchored = v.filter(x => x.status === "anchored").length;
    const maintenance = v.filter(x => x.status === "maintenance").length;
    const activeVessels = v.filter(x => x.tce > 0);
    const avgTCE = activeVessels.length > 0 ? Math.round(activeVessels.reduce((s, x) => s + x.tce, 0) / activeVessels.length) : 0;
    const avgUtil = Math.round(v.reduce((s, x) => s + x.utilization, 0) / v.length * 10) / 10;
    const ciiCounts: Record<string, number> = {};
    v.forEach(x => { ciiCounts[x.ciiRating] = (ciiCounts[x.ciiRating] || 0) + 1; });
    const avgCII = Object.entries(ciiCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "B";
    const totalCO2 = v.reduce((s, x) => s + x.co2EmissionsDaily, 0);
    const critLogs = mockData.eventLogs.filter(l => l.severity === "Critical").length;
    const warnLogs = mockData.eventLogs.filter(l => l.severity === "Warning").length;
    const expCerts = mockData.complianceCertificates.filter(c => c.daysUntilExpiry <= 30).length;
    const openDef = mockData.portStateDeficiencies.filter(d => d.status === "Open").length;

    const operationalScore = Math.round(avgUtil * 0.5 + (atSea / v.length) * 50);
    const complianceScore = Math.max(0, 100 - expCerts * 10 - openDef * 8);
    const safetyScore = Math.max(0, 100 - critLogs * 12 - warnLogs * 4);
    const environmentalScore = Math.round(v.filter(x => x.ciiRating === "A" || x.ciiRating === "B").length / v.length * 100);
    const fleetHealthScore = Math.round((operationalScore + complianceScore + safetyScore + environmentalScore) / 4);

    return {
      totalVessels: v.length,
      atSea,
      inPort,
      anchored,
      maintenance,
      averageTCE: avgTCE,
      averageUtilization: avgUtil,
      averageCII: avgCII,
      totalCO2Today: totalCO2,
      activeAlerts: critLogs + warnLogs,
      criticalAlerts: critLogs,
      fleetHealthScore,
      operationalScore,
      complianceScore,
      safetyScore,
      environmentalScore,
    };
  }
}

export const dataProvider: DataProvider = new MockDataProvider();
