export type VesselStatus = "at_sea" | "in_port" | "anchored" | "maintenance" | "delayed" | "loading" | "risk_watch" | "exception_active";
export type VesselClass = "bulk_carrier" | "container" | "tanker" | "ro_ro" | "lng" | "vlcc" | "capesize" | "panamax";
export type ExceptionSeverity = "critical" | "high" | "watch" | "normal";
export type ExceptionType = "route_deviation" | "delay_risk" | "port_congestion" | "weather_disruption" | "maintenance_risk" | "fuel_anomaly" | "schedule_variance" | "security_alert";
export type MaintenanceStatus = "overdue" | "due_soon" | "scheduled" | "in_progress" | "completed";
export type ReadinessState = "ready" | "watch" | "limited" | "unavailable";

export interface VesselProfile {
  id: number;
  name: string;
  imo: string;
  mmsi: string;
  flag: string;
  type: string;
  vesselClass: VesselClass;
  vesselType?: string;
  status: VesselStatus;
  lat: number;
  lon: number;
  currentSpeed: number;
  heading: number;
  nextPort: string;
  lastPort: string;
  destination?: string;
  eta: string;
  etaDelta: number;
  routeProgress: number;
  tce: number;
  utilization: number;
  ciiRating: string;
  co2EmissionsDaily: number;
  riskScore: number;
  readinessScore: number;
  fleet: string;
  cargoType: string;
  dwt: number;
  grossTonnage?: number;
  yearBuilt: number;
  owner: string;
  manager: string;
  draught: number;
  fuelConsumptionMT: number;
  voyageRevenue: number;
  voyageOpex: number;
  voyageMargin: number;
  alertCount: number;
  maintenanceStatus: MaintenanceStatus;
  maintenanceScore?: number;
  engineHealth?: number;
  hullCondition?: number;
  eexi?: number;
  readinessState: ReadinessState;
  currentVoyageId: string;
  region: string;
  [key: string]: unknown;
}

export interface VoyageEconomics {
  voyageId: string;
  vesselId: number;
  vesselName: string;
  route: string;
  origin: string;
  destination: string;
  cargoType: string;
  cargoQuantity: number;
  departureDate: string;
  etaDate: string;
  estimatedRevenue: number;
  operatingCost: number;
  fuelCost: number;
  portCost: number;
  delayCost: number;
  marginEstimate: number;
  marginPct: number;
  tce: number;
  fuelConsumptionTotal: number;
  delayHours: number;
  charterType: "time_charter" | "voyage_charter" | "spot";
  performanceVsBudget: number;
  status: "active" | "completed" | "planned";
}

export interface FleetException {
  id: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  vesselId: number;
  vesselName: string;
  route: string;
  title: string;
  description: string;
  whyItMatters: string;
  recommendedResponse: string;
  businessConsequence: string;
  owner: string;
  ownerFunction: string;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  status: "active" | "acknowledged" | "resolved";
  estimatedImpactUSD: number;
}

export interface MaintenanceItem {
  id: number;
  vesselId: number;
  vesselName: string;
  component: string;
  type: "preventive" | "corrective" | "scheduled" | "predictive";
  description: string;
  dueDate: string;
  status: MaintenanceStatus;
  priority: "low" | "medium" | "high" | "critical";
  estimatedCost: number;
  daysToDue: number;
  riskOfServiceIssue: number;
  impactsVoyageAvailability: boolean;
  technician: string;
  assetHealth: number;
}

export interface PerformanceMetric {
  vesselId: number;
  vesselName: string;
  month: string;
  utilization: number;
  onTimeArrivalRate: number;
  avgDelayHours: number;
  routeProfitability: number;
  fuelEfficiency: number;
  tce: number;
}

export interface Corridor {
  id: string;
  name: string;
  origin: string;
  destination: string;
  region: string;
  vesselCount: number;
  delayRate: number;
  avgTransitDays: number;
  weatherRisk: "low" | "moderate" | "high" | "severe";
  portCongestionRisk: "low" | "moderate" | "high";
  profitabilityIndex: number;
  commodity: string;
  weeklyVolume: string;
  trend: "up" | "down" | "stable";
  activeAlerts: number;
}

export interface MaintenanceLog {
  id: number;
  vesselId: number;
  vesselName: string;
  type: string;
  component?: string;
  description: string;
  date: string;
  status: "Completed" | "In Progress" | "Scheduled" | "Overdue";
  priority: "Low" | "Medium" | "High" | "Critical";
  severity?: string;
  estimatedCost: number;
  estimatedHours?: number;
  cost?: number;
  technician: string;
}

export interface ComplianceCertificate {
  id: number;
  vesselId: number;
  vesselName: string;
  certificateType: string;
  issuingAuthority: string;
  issuer?: string;
  regulation?: string;
  issueDate: string;
  expiryDate: string;
  status: "Valid" | "Expiring" | "Expired" | "Expiring Soon";
  daysUntilExpiry: number;
}

export interface PortStateDeficiency {
  id: number;
  vesselId: number;
  vesselName: string;
  port: string;
  deficiencyCode: string;
  description: string;
  date: string;
  inspectionDate?: string;
  mouRegime?: string;
  status: "Open" | "Rectified" | "Closed";
  severity: "Minor" | "Major" | "Detainable";
}

export interface ShipmentRecord {
  id: number;
  shipmentId?: string;
  vesselId: number;
  vesselName: string;
  cargo: string;
  cargoType?: string;
  quantity: number;
  weight?: number;
  unit: string;
  origin: string;
  destination: string;
  loadDate: string;
  departureDate?: string;
  deliveryDate: string;
  eta?: string;
  status: "planned" | "loading" | "in_transit" | "In Transit" | "delivered" | "completed";
  value: number;
  onTimeScore?: number;
  customerSatisfaction?: number;
  demurrageRisk?: string | number;
}

export interface EventLog {
  id: number;
  vesselId: number;
  vesselName: string;
  category: string;
  severity: "Info" | "Warning" | "Critical";
  source?: string;
  message: string;
  details: string;
  timestamp: string;
}

export interface EmissionRecord {
  id: number;
  vesselId: number;
  date: string;
  month?: string;
  co2: number;
  co2Emissions?: number;
  sox: number;
  nox: number;
  ciiScore: string;
  fuelConsumed?: number;
  distanceTraveled?: number;
}

export interface AIBriefing {
  id: number;
  title: string;
  summary: string;
  confidence: number;
  category: string;
  severity?: string;
  details?: string;
  actionItems?: string[];
  affectedVessels?: string[];
  generatedAt?: string;
  timestamp: string;
  priority: "Low" | "Medium" | "High";
}

export interface PredictiveMaintenance {
  id: number;
  vesselId: number;
  vesselName: string;
  component: string;
  predictedFailureDate: string;
  failureProbability?: number;
  riskLevel?: string;
  confidence: number;
  recommendedAction: string;
  estimatedCost: number;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export interface ForecastModule {
  id: number;
  title?: string;
  metric: string;
  currentValue: number;
  forecastValue: number;
  forecastDate?: string;
  dataPoints?: number[];
  unit: string;
  trend: "up" | "down" | "stable";
  confidence: number;
}

export interface SanctionsRiskIndicator {
  id?: number;
  imo?: string;
  vesselName?: string;
  entity: string;
  flag: string;
  riskLevel: string;
  reason?: string;
  region?: string;
  vessels: string[];
  lastUpdated: string;
  lastSeen?: string;
}

export interface ComplianceAlert {
  id: number;
  type: string;
  message: string;
  severity: string;
  date?: string;
  vessel?: string;
  vesselId: number;
  vesselName: string;
}

export interface Fleet {
  id: number;
  name: string;
  vessels: number[];
  region: string;
  manager: string;
}
