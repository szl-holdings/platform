export type VesselStatus =
  | "at_sea"
  | "in_port"
  | "anchored"
  | "idle"
  | "maintenance"
  | "underway"
  | "delayed"
  | "loading"
  | "risk_watch"
  | "exception_active";

export type VesselClass = "capesize" | "panamax" | "supramax" | "handysize" | "vlcc" | "aframax" | "suezmax";

export type ExceptionSeverity = "critical" | "high" | "watch" | "normal" | "medium" | "low";

export type ExceptionType = "speed" | "deviation" | "compliance" | "sanctions" | "maintenance" | "weather" | "technical";

export type MaintenanceStatus = "scheduled" | "overdue" | "in_progress" | "completed" | "cancelled" | string;

export type ReadinessState = "ready" | "restricted" | "unavailable" | "maintenance";

export interface VesselProfile {
  id: number;
  name: string;
  imo?: string | null;
  mmsi?: string | null;
  vesselType?: string | null;
  type?: string | null;
  flag?: string | null;
  yearBuilt?: number | null;
  grossTonnage?: number | null;
  status: string;
  charterType?: string | null;
  cargoType?: string | null;
  destination?: string | null;
  eta?: string | null;
  heading?: number | null;
  latitude?: string | null;
  longitude?: string | null;
  lat?: number | null;
  lon?: number | null;
  speed?: string | number | null;
  currentSpeed?: number | null;
  tcePerDay?: number | null;
  tce?: number | null;
  utilization?: number | null;
  ciiRating?: string | null;
  readinessScore?: number | null;
  alertCount?: number | null;
  engineHealth?: number | null;
  hullCondition?: number | null;
  maintenanceScore?: number | null;
  eexi?: number | null;
  voyageRef?: string | null;
  lastPort?: string | null;
  nextPort?: string | null;
  routeProgress?: number | null;
  etaDelta?: number | null;
  activeExceptions?: number | null;
  co2EmissionsDaily?: number | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface VoyageEconomics {
  voyageId?: number | string;
  voyageRef?: string;
  route?: string;
  status?: string;
  charterType?: string;
  cargoType?: string;
  estimatedRevenue?: number;
  tce?: number;
  fuelCost?: number;
  portCost?: number;
  operatingCost?: number;
  delayCost?: number;
  marginEstimate?: number;
  marginPct?: number;
  distanceNm?: number;
  durationDays?: number;
  delayHours?: number;
}

export interface FleetException {
  id?: number | string;
  type?: string;
  severity?: ExceptionSeverity | string;
  description?: string;
  detectedAt?: string | Date;
  status?: string;
  entityName?: string;
  assignedTo?: string | null;
  vesselId?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface MaintenanceItem {
  id?: number | string;
  vesselId?: number;
  title?: string;
  description?: string;
  status?: MaintenanceStatus;
  scheduledDate?: string | Date | null;
  completedDate?: string | Date | null;
  priority?: string;
  cost?: number;
}

export interface PerformanceMetric {
  id?: number | string;
  vesselId?: number;
  metricType?: string;
  value?: number;
  unit?: string;
  recordedAt?: string | Date;
}

export interface Corridor {
  id?: number | string;
  name?: string;
  description?: string;
  origin?: string;
  destination?: string;
  distanceNm?: number;
  transitDays?: number;
}

export interface MaintenanceLog {
  id?: number | string;
  vesselId?: number;
  vesselName?: string;
  component?: string;
  type?: string;
  description?: string;
  severity?: string;
  status?: string;
  date?: string | Date | null;
  scheduledDate?: string | Date | null;
  completedDate?: string | Date | null;
  estimatedHours?: number;
  cost?: number;
  action?: string;
  performedBy?: string;
  performedAt?: string | Date;
  notes?: string;
}

export interface ComplianceCertificate {
  id?: number | string;
  vesselId?: number;
  vesselName?: string;
  certificateType?: string;
  issuedBy?: string;
  issuer?: string;
  issuedAt?: string | Date;
  expiresAt?: string | Date;
  expiryDate?: string | Date;
  daysUntilExpiry?: number;
  regulation?: string;
  status?: string;
}

export interface PortStateDeficiency {
  id?: number | string;
  vesselId?: number;
  vesselName?: string;
  port?: string;
  deficiencyCode?: string;
  description?: string;
  severity?: string;
  rectificationDeadline?: string | Date;
  inspectionDate?: string | Date;
  mouRegime?: string;
  status?: string;
}

export interface ShipmentRecord {
  id?: number | string;
  vesselId?: number;
  shipmentId?: string;
  vesselName?: string;
  voyageRef?: string;
  cargoType?: string;
  quantity?: number;
  weight?: number;
  unit?: string;
  origin?: string;
  destination?: string;
  status?: string;
  eta?: string | Date | null;
  departureDate?: string | Date | null;
  onTimeScore?: number;
  customerSatisfaction?: number;
  demurrageRisk?: string;
}

export interface EventLog {
  id: number;
  vesselId?: number;
  vesselName?: string;
  eventType?: string;
  category?: string;
  severity?: string;
  message?: string;
  description?: string;
  details?: string;
  timestamp?: string | Date;
  source?: string;
}

export interface EmissionRecord {
  id?: number | string;
  vesselId?: number;
  voyageRef?: string;
  month?: string;
  co2Tonnes?: number;
  co2Emissions?: number;
  soxTonnes?: number;
  noxTonnes?: number;
  fuelConsumed?: number;
  distanceTraveled?: number;
  recordedAt?: string | Date;
}

export interface AIBriefing {
  id?: number | string;
  vesselId?: number;
  title?: string;
  summary?: string;
  details?: string;
  severity?: string;
  confidence?: number;
  category?: string;
  actionItems?: string[];
  affectedVessels?: string[];
  generatedAt?: string | Date;
  modelId?: string;
}

export interface PredictiveMaintenance {
  id?: number | string;
  vesselId?: number;
  vesselName?: string;
  component?: string;
  predictedFailureDate?: string | Date | null;
  confidenceScore?: number;
  confidence?: number;
  failureProbability?: number;
  riskLevel?: string;
  estimatedCost?: number;
  recommendedAction?: string;
  priority?: string;
}

export interface ForecastModule {
  id?: number | string;
  moduleType?: string;
  vesselId?: number;
  title?: string;
  metric?: string;
  trend?: string;
  confidence?: number;
  currentValue?: number | string;
  forecastValue?: number | string;
  forecastDate?: string;
  dataPoints?: Array<{ date: string; value: number; forecast?: boolean }>;
  value?: number;
  unit?: string;
}

export interface SanctionsRiskIndicator {
  id?: number | string;
  vesselId?: number;
  vesselName?: string;
  imo?: string;
  flag?: string;
  riskLevel?: string;
  sanctionsList?: string;
  reason?: string;
  region?: string;
  flaggedAt?: string | Date;
  lastSeen?: string | Date;
  description?: string;
  status?: string;
}

export interface ComplianceAlert {
  id?: number | string;
  vesselId?: number;
  type?: string;
  alertType?: string;
  severity?: string;
  vessel?: string;
  message?: string;
  date?: string | Date;
  status?: string;
  createdAt?: string | Date;
}

export interface Fleet {
  id?: number | string;
  name?: string;
  status?: string;
  vesselCount?: number;
  vessels?: VesselProfile[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
