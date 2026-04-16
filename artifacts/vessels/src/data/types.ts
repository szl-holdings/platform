export type VesselStatus = "at_sea" | "in_port" | "anchored" | "maintenance" | "loading" | "exception_active" | "delayed";

export type VesselClass = "capesize" | "panamax" | "supramax" | "handysize";

export type ExceptionSeverity = "critical" | "high" | "watch" | "normal" | "medium" | "low";

export type ExceptionType =
  | "route_deviation"
  | "delay_risk"
  | "port_congestion"
  | "weather_disruption"
  | "maintenance_risk"
  | "fuel_anomaly"
  | "schedule_variance"
  | "security_alert"
  | "ais_dark"
  | "sanctions_match"
  | "overdue_arrival"
  | "inspection_failure";

export type MaintenanceStatus = "overdue" | "due_soon" | "scheduled" | "in_progress" | "completed";

export type ReadinessState = "ready" | "degraded" | "critical" | "offline";

export interface VesselProfile {
  id: number;
  name: string;
  imo: string;
  mmsi: string;
  flag: string;
  type: string;
  vesselType: string;
  status: VesselStatus;
  yearBuilt: number;
  utilization: number;
  dwt: number;
  gt: number;
  loa: number;
  beam: number;
  draft: number;
  engineType: string;
  fuelConsumption: number;
  currentPort: string | null;
  destination: string | null;
  eta: string | null;
  lat: number;
  lon: number;
  course: number | null;
  speed: number | null;
  nextServiceDue: string | null;
  classSociety: string;
  owner: string;
  operator: string;
  charterer: string | null;
  charterType: string | null;
  charterRate: number | null;
  charterExpiry: string | null;
  insuranceExpiry: string | null;
  lastInspection: string | null;
  nextInspection: string | null;
  deficiencies: number;
  detentions: number;
  aiBriefing: string | null;
  riskScore: number;
  complianceScore: number;
  emissionsIntensity: number;
  tce: number;
  etaDelta: number;
  readinessScore: number;
  alertCount: number;
  engineHealth: number;
  hullCondition: number;
  maintenanceScore: number;
  currentSpeed: number;
  heading: number;
  lastPort: string | null;
  nextPort: string | null;
  routeProgress: number;
  co2EmissionsDaily: number;
  ciiRating: string;
  eexi: number;
  [key: string]: any;
}

export interface VoyageEconomics {
  id: number;
  vesselId: number;
  vesselName: string;
  voyageNumber: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string | null;
  status: string;
  cargoType: string;
  cargoTonnes: number;
  freightRate: number;
  tce: number;
  bunkerCost: number;
  portCosts: number;
  canalCosts: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  [key: string]: any;
}

export interface FleetException {
  id: number;
  vesselId: number;
  vesselName: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  title: string;
  description: string;
  detectedAt: string;
  resolvedAt: string | null;
  estimatedImpactUSD: number | null;
  instrument?: { id: string };
  [key: string]: any;
}

export interface MaintenanceItem {
  id: number;
  vesselId: number;
  vesselName?: string;
  component: string;
  description: string;
  status: MaintenanceStatus;
  priority: "critical" | "high" | "medium" | "low";
  dueDate: string;
  completedDate: string | null;
  estimatedCostUsd: number;
  [key: string]: any;
}

export interface PerformanceMetric {
  id?: number;
  vesselId: number;
  vesselName: string;
  utilization: number;
  tce: number;
  fuelEfficiency: number;
  onTimeArrivalRate: number;
  avgDelayHours: number;
  routeProfitability: number;
  cargoTonnes: number;
  revenuePerDay: number;
}

export interface Corridor {
  id: number;
  name: string;
  origin: string;
  destination: string;
  waypoints: Array<{ lat: number; lon: number }>;
  riskLevel: "low" | "moderate" | "elevated" | "critical";
  distanceNm: number;
  [key: string]: any;
}

export interface MaintenanceLog {
  id: number;
  vesselId: number;
  vesselName: string;
  component: string;
  type: string;
  description: string;
  status: "Overdue" | "In Progress" | "Scheduled" | "Completed";
  severity: string;
  date: string;
  estimatedHours: number;
  cost: number | null;
  action: string;
  technician: string;
  performedAt: string;
  nextDue: string | null;
  notes: string | null;
  [key: string]: any;
}

export interface ComplianceCertificate {
  id: number;
  vesselId: number;
  vesselName: string;
  certificateType: string;
  issuingAuthority: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  expiryDate: string;
  daysUntilExpiry: number;
  regulation: string | null;
  status: "Valid" | "Expiring Soon" | "Expired";
  [key: string]: any;
}

export interface PortStateDeficiency {
  id: number;
  vesselId: number;
  port: string;
  inspectedAt: string;
  deficiencyCode: string;
  description: string;
  severity: "minor" | "major" | "detention";
  status: "Open" | "Rectified";
  [key: string]: any;
}

export interface ShipmentRecord {
  id: number;
  vesselId: number | null;
  vesselName?: string;
  shipmentId?: string;
  bl?: string;
  cargoType: string;
  cargoTonnes?: number;
  weight?: number | null;
  shipper?: string;
  consignee?: string;
  origin: string;
  destination: string;
  loadedAt?: string;
  deliveredAt?: string | null;
  status: string;
  onTimeScore: number | null;
  customerSatisfaction: number | null;
  demurrageRisk: string | null;
  eta: string | null;
  departureDate: string | null;
  [key: string]: any;
}

export interface EventLog {
  id: number;
  vesselId: number | null;
  vesselName: string | null;
  severity: "Critical" | "Warning" | "Info" | "Debug";
  category?: string;
  title?: string;
  message: string;
  details?: string | null;
  occurredAt?: string;
  timestamp: string;
  type?: string;
  [key: string]: any;
}

export interface EmissionRecord {
  id: number;
  vesselId: number;
  reportingPeriod?: string;
  co2Tonnes?: number;
  so2Tonnes?: number;
  noxTonnes?: number;
  cii?: string;
  ciiScore?: number;
  month: string | null;
  co2Emissions: number | null;
  fuelConsumed: number | null;
  distanceTraveled: number | null;
  ciiRating?: string | null;
  [key: string]: any;
}

export interface AIBriefing {
  id: number;
  vesselId: number | null;
  severity: "Critical" | "Warning" | "Info";
  title: string;
  summary: string;
  details: string;
  confidence: number;
  actionItems: string[];
  affectedVessels: string[];
  generatedAt: string;
  category: string;
  [key: string]: any;
}

export interface PredictiveMaintenance {
  id: number;
  vesselId: number;
  vesselName: string;
  component: string;
  riskLevel: "High" | "Medium" | "Low";
  failureProbability: number;
  recommendedAction: string;
  predictedFailureDate: string;
  estimatedCost: number;
  confidence: number;
  signals: Array<{ label: string; trend: string; anomaly: boolean }>;
  [key: string]: any;
}

export interface ForecastDataPoint {
  date: string;
  value?: number;
  forecast?: number;
}

export interface ForecastModule {
  id: number;
  title: string;
  metric: string;
  currentValue: number | string;
  forecastValue: number | string;
  forecastDate: string;
  trend: "up" | "down";
  confidence: number;
  dataPoints: ForecastDataPoint[];
  [key: string]: any;
}

export interface SanctionsRiskIndicator {
  id: number;
  vesselId: number;
  vesselName: string;
  flag: string;
  imo: string;
  ofacStatus: "clear" | "match" | "watchlist";
  euStatus: "clear" | "match" | "watchlist";
  riskScore: number;
  riskLevel: string;
  reason: string | null;
  region: string | null;
  lastSeen: string | null;
  lastScreenedAt: string;
  [key: string]: any;
}

export interface ComplianceAlert {
  id: number;
  vesselId: number | null;
  type: string;
  severity: "Critical" | "High" | "Warning" | "Info";
  title: string;
  description: string;
  createdAt: string;
  resolvedAt: string | null;
  date: string | null;
  vessel: string | null;
  message: string | null;
  [key: string]: any;
}

export interface Fleet {
  id: number;
  name: string;
  description: string | null;
  vesselCount: number;
  managedBy: string | null;
  [key: string]: any;
}
