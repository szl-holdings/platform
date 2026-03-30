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
  status: VesselStatus;
  lat: number;
  lon: number;
  currentSpeed: number;
  heading: number;
  nextPort: string;
  lastPort: string;
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
  readinessState: ReadinessState;
  currentVoyageId: string;
  region: string;
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
  description: string;
  date: string;
  status: "Completed" | "In Progress" | "Scheduled" | "Overdue";
  priority: "Low" | "Medium" | "High" | "Critical";
  estimatedCost: number;
  technician: string;
}

export interface ComplianceCertificate {
  id: number;
  vesselId: number;
  vesselName: string;
  certificateType: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: "Valid" | "Expiring" | "Expired";
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
  status: "Open" | "Rectified" | "Closed";
  severity: "Minor" | "Major" | "Detainable";
}

export interface ShipmentRecord {
  id: number;
  vesselId: number;
  vesselName: string;
  cargo: string;
  quantity: number;
  unit: string;
  origin: string;
  destination: string;
  loadDate: string;
  deliveryDate: string;
  status: "planned" | "loading" | "in_transit" | "delivered" | "completed";
  value: number;
}

export interface EventLog {
  id: number;
  vesselId: number;
  vesselName: string;
  category: string;
  severity: "Info" | "Warning" | "Critical";
  message: string;
  details: string;
  timestamp: string;
}

export interface EmissionRecord {
  id: number;
  vesselId: number;
  date: string;
  co2: number;
  sox: number;
  nox: number;
  ciiScore: string;
}

export interface AIBriefing {
  id: number;
  title: string;
  summary: string;
  confidence: number;
  category: string;
  timestamp: string;
  priority: "Low" | "Medium" | "High";
}

export interface PredictiveMaintenance {
  id: number;
  vesselId: number;
  vesselName: string;
  component: string;
  predictedFailureDate: string;
  confidence: number;
  recommendedAction: string;
  estimatedCost: number;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export interface ForecastModule {
  id: number;
  metric: string;
  currentValue: number;
  forecastValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  confidence: number;
}

const vessels: VesselProfile[] = [
  {
    id: 1, name: "Pacific Meridian", imo: "9876543", mmsi: "123456789", flag: "Panama", type: "Bulk Carrier", vesselClass: "capesize",
    status: "at_sea", lat: 35.2, lon: 142.5, currentSpeed: 14.2, heading: 87, nextPort: "Yokohama", lastPort: "Port Hedland",
    eta: "2026-04-02T08:00:00Z", etaDelta: -14, routeProgress: 78,
    tce: 28500, utilization: 94.2, ciiRating: "A", co2EmissionsDaily: 42.3, riskScore: 22, readinessScore: 91,
    fleet: "Pacific Fleet", cargoType: "Iron Ore", dwt: 82000, yearBuilt: 2019, owner: "SZL Maritime", manager: "Pacific Ship Management",
    draught: 12.4, fuelConsumptionMT: 38.2, voyageRevenue: 4320000, voyageOpex: 2100000, voyageMargin: 2220000,
    alertCount: 0, maintenanceStatus: "scheduled", readinessState: "ready", currentVoyageId: "VOY-001", region: "Asia-Pacific"
  },
  {
    id: 2, name: "Atlantic Pioneer", imo: "9765432", mmsi: "234567890", flag: "Liberia", type: "Container Ship", vesselClass: "container",
    status: "in_port", lat: 51.9, lon: 4.4, currentSpeed: 0, heading: 0, nextPort: "Hamburg", lastPort: "Rotterdam",
    eta: "2026-04-05T14:00:00Z", etaDelta: 6, routeProgress: 100,
    tce: 45200, utilization: 88.7, ciiRating: "B", co2EmissionsDaily: 68.1, riskScore: 35, readinessScore: 72,
    fleet: "Atlantic Fleet", cargoType: "General Cargo", dwt: 65000, yearBuilt: 2017, owner: "SZL Maritime", manager: "Atlantic Ship Management",
    draught: 11.2, fuelConsumptionMT: 52.4, voyageRevenue: 7800000, voyageOpex: 4200000, voyageMargin: 3600000,
    alertCount: 1, maintenanceStatus: "in_progress", readinessState: "watch", currentVoyageId: "VOY-002", region: "Atlantic"
  },
  {
    id: 3, name: "Crimson Voyager", imo: "9654321", mmsi: "345678901", flag: "Marshall Islands", type: "Tanker", vesselClass: "vlcc",
    status: "at_sea", lat: 25.1, lon: 55.3, currentSpeed: 12.8, heading: 215, nextPort: "Fujairah", lastPort: "Ras Tanura",
    eta: "2026-04-01T06:00:00Z", etaDelta: 0, routeProgress: 91,
    tce: 52000, utilization: 96.1, ciiRating: "A", co2EmissionsDaily: 55.7, riskScore: 18, readinessScore: 96,
    fleet: "Middle East Fleet", cargoType: "Crude Oil", dwt: 115000, yearBuilt: 2020, owner: "SZL Maritime", manager: "Gulf Ship Management",
    draught: 14.8, fuelConsumptionMT: 61.0, voyageRevenue: 12400000, voyageOpex: 5100000, voyageMargin: 7300000,
    alertCount: 1, maintenanceStatus: "scheduled", readinessState: "ready", currentVoyageId: "VOY-003", region: "Middle East"
  },
  {
    id: 4, name: "Nordic Star", imo: "9543210", mmsi: "456789012", flag: "Norway", type: "Ro-Ro", vesselClass: "ro_ro",
    status: "anchored", lat: 59.9, lon: 10.7, currentSpeed: 0, heading: 0, nextPort: "Oslo", lastPort: "Bremerhaven",
    eta: "2026-04-03T09:00:00Z", etaDelta: 18, routeProgress: 45,
    tce: 18900, utilization: 72.3, ciiRating: "C", co2EmissionsDaily: 31.2, riskScore: 48, readinessScore: 61,
    fleet: "Nordic Fleet", cargoType: "Vehicles", dwt: 28000, yearBuilt: 2015, owner: "SZL Maritime", manager: "Nordic Ship Management",
    draught: 8.1, fuelConsumptionMT: 22.1, voyageRevenue: 1900000, voyageOpex: 1400000, voyageMargin: 500000,
    alertCount: 2, maintenanceStatus: "due_soon", readinessState: "watch", currentVoyageId: "VOY-004", region: "Northern Europe"
  },
  {
    id: 5, name: "Southern Cross", imo: "9432109", mmsi: "567890123", flag: "Singapore", type: "Bulk Carrier", vesselClass: "panamax",
    status: "at_sea", lat: -33.8, lon: 151.2, currentSpeed: 13.5, heading: 32, nextPort: "Brisbane", lastPort: "Newcastle",
    eta: "2026-04-04T16:00:00Z", etaDelta: 3, routeProgress: 62,
    tce: 31200, utilization: 91.5, ciiRating: "B", co2EmissionsDaily: 44.6, riskScore: 28, readinessScore: 84,
    fleet: "Pacific Fleet", cargoType: "Coal", dwt: 76000, yearBuilt: 2018, owner: "SZL Maritime", manager: "Pacific Ship Management",
    draught: 12.1, fuelConsumptionMT: 41.3, voyageRevenue: 3800000, voyageOpex: 1900000, voyageMargin: 1900000,
    alertCount: 0, maintenanceStatus: "scheduled", readinessState: "ready", currentVoyageId: "VOY-005", region: "Asia-Pacific"
  },
  {
    id: 6, name: "Indian Ocean Star", imo: "9321098", mmsi: "678901234", flag: "India", type: "LNG Carrier", vesselClass: "lng",
    status: "maintenance", lat: 19.1, lon: 72.8, currentSpeed: 0, heading: 0, nextPort: "Mumbai", lastPort: "Mumbai",
    eta: "2026-04-10T00:00:00Z", etaDelta: 0, routeProgress: 0,
    tce: 0, utilization: 0, ciiRating: "B", co2EmissionsDaily: 0, riskScore: 62, readinessScore: 28,
    fleet: "Indian Ocean Fleet", cargoType: "LNG", dwt: 95000, yearBuilt: 2016, owner: "SZL Maritime", manager: "Indian Ship Management",
    draught: 7.2, fuelConsumptionMT: 0, voyageRevenue: 0, voyageOpex: 280000, voyageMargin: -280000,
    alertCount: 3, maintenanceStatus: "in_progress", readinessState: "unavailable", currentVoyageId: "", region: "Indian Ocean"
  },
  {
    id: 7, name: "Mediterranean Dawn", imo: "9210987", mmsi: "789012345", flag: "Malta", type: "Container Ship", vesselClass: "container",
    status: "exception_active", lat: 35.9, lon: 14.5, currentSpeed: 9.1, heading: 275, nextPort: "Genoa", lastPort: "Piraeus",
    eta: "2026-04-01T22:00:00Z", etaDelta: 31, routeProgress: 58,
    tce: 38700, utilization: 87.4, ciiRating: "B", co2EmissionsDaily: 61.3, riskScore: 44, readinessScore: 76,
    fleet: "Mediterranean Fleet", cargoType: "Consumer Goods", dwt: 52000, yearBuilt: 2021, owner: "SZL Maritime", manager: "Med Ship Management",
    draught: 10.5, fuelConsumptionMT: 47.2, voyageRevenue: 5200000, voyageOpex: 2800000, voyageMargin: 2400000,
    alertCount: 2, maintenanceStatus: "scheduled", readinessState: "limited", currentVoyageId: "VOY-007", region: "Mediterranean"
  },
  {
    id: 8, name: "Arctic Falcon", imo: "9109876", mmsi: "890123456", flag: "Cyprus", type: "Bulk Carrier", vesselClass: "panamax",
    status: "delayed", lat: 68.9, lon: 33.1, currentSpeed: 6.2, heading: 180, nextPort: "Murmansk", lastPort: "Narvik",
    eta: "2026-04-06T10:00:00Z", etaDelta: 22, routeProgress: 31,
    tce: 22400, utilization: 78.9, ciiRating: "C", co2EmissionsDaily: 38.9, riskScore: 55, readinessScore: 54,
    fleet: "Arctic Fleet", cargoType: "Nickel Ore", dwt: 68000, yearBuilt: 2014, owner: "SZL Maritime", manager: "Arctic Ship Management",
    draught: 11.8, fuelConsumptionMT: 34.8, voyageRevenue: 2900000, voyageOpex: 2100000, voyageMargin: 800000,
    alertCount: 2, maintenanceStatus: "overdue", readinessState: "watch", currentVoyageId: "VOY-008", region: "Arctic"
  },
  {
    id: 9, name: "Gulf Titan", imo: "9087654", mmsi: "901234567", flag: "UAE", type: "Tanker", vesselClass: "vlcc",
    status: "loading", lat: 26.2, lon: 50.6, currentSpeed: 0, heading: 0, nextPort: "Ningbo", lastPort: "Ras Tanura",
    eta: "2026-04-18T00:00:00Z", etaDelta: 0, routeProgress: 5,
    tce: 48600, utilization: 89.3, ciiRating: "A", co2EmissionsDaily: 58.2, riskScore: 20, readinessScore: 88,
    fleet: "Middle East Fleet", cargoType: "Crude Oil", dwt: 298000, yearBuilt: 2022, owner: "SZL Maritime", manager: "Gulf Ship Management",
    draught: 20.1, fuelConsumptionMT: 68.4, voyageRevenue: 18200000, voyageOpex: 6400000, voyageMargin: 11800000,
    alertCount: 0, maintenanceStatus: "scheduled", readinessState: "ready", currentVoyageId: "VOY-009", region: "Middle East"
  },
  {
    id: 10, name: "Cape Victory", imo: "8976543", mmsi: "012345678", flag: "Bahamas", type: "Bulk Carrier", vesselClass: "capesize",
    status: "risk_watch", lat: -6.0, lon: 12.2, currentSpeed: 11.4, heading: 165, nextPort: "Cape Town", lastPort: "Pointe-Noire",
    eta: "2026-04-07T08:00:00Z", etaDelta: 8, routeProgress: 44,
    tce: 25100, utilization: 81.2, ciiRating: "B", co2EmissionsDaily: 41.8, riskScore: 51, readinessScore: 68,
    fleet: "Atlantic Fleet", cargoType: "Iron Ore", dwt: 172000, yearBuilt: 2016, owner: "SZL Maritime", manager: "Atlantic Ship Management",
    draught: 16.8, fuelConsumptionMT: 52.6, voyageRevenue: 6100000, voyageOpex: 3200000, voyageMargin: 2900000,
    alertCount: 1, maintenanceStatus: "due_soon", readinessState: "watch", currentVoyageId: "VOY-010", region: "West Africa"
  },
];

const voyageEconomics: VoyageEconomics[] = [
  {
    voyageId: "VOY-001", vesselId: 1, vesselName: "Pacific Meridian",
    route: "Port Hedland → Yokohama", origin: "Port Hedland", destination: "Yokohama",
    cargoType: "Iron Ore", cargoQuantity: 72000, departureDate: "2026-03-28", etaDate: "2026-04-02",
    estimatedRevenue: 4320000, operatingCost: 2100000, fuelCost: 980000, portCost: 420000, delayCost: 0,
    marginEstimate: 2220000, marginPct: 51.4, tce: 28500, fuelConsumptionTotal: 412,
    delayHours: 0, charterType: "time_charter", performanceVsBudget: 7.2, status: "active"
  },
  {
    voyageId: "VOY-002", vesselId: 2, vesselName: "Atlantic Pioneer",
    route: "New York → Rotterdam → Hamburg", origin: "New York", destination: "Hamburg",
    cargoType: "General Cargo", cargoQuantity: 42000, departureDate: "2026-03-18", etaDate: "2026-04-05",
    estimatedRevenue: 7800000, operatingCost: 4200000, fuelCost: 1640000, portCost: 870000, delayCost: 180000,
    marginEstimate: 3600000, marginPct: 46.2, tce: 45200, fuelConsumptionTotal: 890,
    delayHours: 6, charterType: "voyage_charter", performanceVsBudget: -2.8, status: "active"
  },
  {
    voyageId: "VOY-003", vesselId: 3, vesselName: "Crimson Voyager",
    route: "Ras Tanura → Fujairah", origin: "Ras Tanura", destination: "Fujairah",
    cargoType: "Crude Oil", cargoQuantity: 95000, departureDate: "2026-03-29", etaDate: "2026-04-01",
    estimatedRevenue: 12400000, operatingCost: 5100000, fuelCost: 1220000, portCost: 580000, delayCost: 0,
    marginEstimate: 7300000, marginPct: 58.9, tce: 52000, fuelConsumptionTotal: 183,
    delayHours: 0, charterType: "spot", performanceVsBudget: 11.4, status: "active"
  },
  {
    voyageId: "VOY-004", vesselId: 4, vesselName: "Nordic Star",
    route: "Bremerhaven → Oslo (via anchor)", origin: "Bremerhaven", destination: "Oslo",
    cargoType: "Vehicles", cargoQuantity: 4200, departureDate: "2026-03-30", etaDate: "2026-04-03",
    estimatedRevenue: 1900000, operatingCost: 1400000, fuelCost: 310000, portCost: 220000, delayCost: 460000,
    marginEstimate: 500000, marginPct: 26.3, tce: 18900, fuelConsumptionTotal: 140,
    delayHours: 18, charterType: "time_charter", performanceVsBudget: -18.4, status: "active"
  },
  {
    voyageId: "VOY-005", vesselId: 5, vesselName: "Southern Cross",
    route: "Newcastle → Brisbane", origin: "Newcastle", destination: "Brisbane",
    cargoType: "Thermal Coal", cargoQuantity: 68000, departureDate: "2026-03-29", etaDate: "2026-04-04",
    estimatedRevenue: 3800000, operatingCost: 1900000, fuelCost: 620000, portCost: 310000, delayCost: 0,
    marginEstimate: 1900000, marginPct: 50.0, tce: 31200, fuelConsumptionTotal: 248,
    delayHours: 0, charterType: "voyage_charter", performanceVsBudget: 3.1, status: "active"
  },
  {
    voyageId: "VOY-007", vesselId: 7, vesselName: "Mediterranean Dawn",
    route: "Piraeus → Genoa", origin: "Piraeus", destination: "Genoa",
    cargoType: "Consumer Electronics", cargoQuantity: 4200, departureDate: "2026-03-30", etaDate: "2026-04-01",
    estimatedRevenue: 5200000, operatingCost: 2800000, fuelCost: 890000, portCost: 440000, delayCost: 620000,
    marginEstimate: 2400000, marginPct: 46.2, tce: 38700, fuelConsumptionTotal: 283,
    delayHours: 31, charterType: "voyage_charter", performanceVsBudget: -11.9, status: "active"
  },
  {
    voyageId: "VOY-008", vesselId: 8, vesselName: "Arctic Falcon",
    route: "Narvik → Murmansk", origin: "Narvik", destination: "Murmansk",
    cargoType: "Nickel Ore", cargoQuantity: 58000, departureDate: "2026-03-26", etaDate: "2026-04-06",
    estimatedRevenue: 2900000, operatingCost: 2100000, fuelCost: 560000, portCost: 340000, delayCost: 420000,
    marginEstimate: 800000, marginPct: 27.6, tce: 22400, fuelConsumptionTotal: 348,
    delayHours: 22, charterType: "time_charter", performanceVsBudget: -14.2, status: "active"
  },
  {
    voyageId: "VOY-009", vesselId: 9, vesselName: "Gulf Titan",
    route: "Ras Tanura → Ningbo", origin: "Ras Tanura", destination: "Ningbo",
    cargoType: "Crude Oil", cargoQuantity: 280000, departureDate: "2026-04-01", etaDate: "2026-04-18",
    estimatedRevenue: 18200000, operatingCost: 6400000, fuelCost: 2800000, portCost: 920000, delayCost: 0,
    marginEstimate: 11800000, marginPct: 64.8, tce: 48600, fuelConsumptionTotal: 1162,
    delayHours: 0, charterType: "spot", performanceVsBudget: 8.6, status: "active"
  },
  {
    voyageId: "VOY-010", vesselId: 10, vesselName: "Cape Victory",
    route: "Pointe-Noire → Cape Town", origin: "Pointe-Noire", destination: "Cape Town",
    cargoType: "Iron Ore", cargoQuantity: 148000, departureDate: "2026-03-25", etaDate: "2026-04-07",
    estimatedRevenue: 6100000, operatingCost: 3200000, fuelCost: 1100000, portCost: 460000, delayCost: 180000,
    marginEstimate: 2900000, marginPct: 47.5, tce: 25100, fuelConsumptionTotal: 632,
    delayHours: 8, charterType: "voyage_charter", performanceVsBudget: -4.3, status: "active"
  },
];

const fleetExceptions: FleetException[] = [
  {
    id: "EXC-001",
    type: "security_alert",
    severity: "critical",
    vesselId: 3,
    vesselName: "Crimson Voyager",
    route: "Ras Tanura → Fujairah",
    title: "Unidentified Dark Vessel Approach — Persian Gulf",
    description: "AIS-dark vessel approached within 800m with no transponder. Security protocol activated. Coast Guard notified.",
    whyItMatters: "Area has active threat intelligence. Vessel approach profile matches documented STS transfer signatures.",
    recommendedResponse: "Maintain heightened watch. Do not approach or engage. Await Coast Guard update. Report to flag state.",
    businessConsequence: "Potential cargo seizure risk. P&I implications. Crew safety priority.",
    owner: "Capt. Al-Rashid",
    ownerFunction: "Operations",
    detectedAt: "2026-03-30T04:41:02Z",
    status: "active",
    estimatedImpactUSD: 12400000
  },
  {
    id: "EXC-002",
    type: "weather_disruption",
    severity: "high",
    vesselId: 7,
    vesselName: "Mediterranean Dawn",
    route: "Piraeus → Genoa",
    title: "Severe Weather Forcing Speed Reduction — Mediterranean",
    description: "Force 8 conditions in Ionian Sea forcing speed reduction to 9.1 knots. Current ETA 31 hours behind schedule.",
    whyItMatters: "Charter party terms require 14-day advance notice for delay claims. Window closing.",
    recommendedResponse: "Issue charterer notification within 6 hours. Re-evaluate port slot booking at Genoa. Consider shelter anchorage at Messina.",
    businessConsequence: "Port slot cancellation fee estimated $82K. Laytime clock running. Cargo claim risk.",
    owner: "T. Kowalski",
    ownerFunction: "Commercial",
    detectedAt: "2026-03-30T06:15:00Z",
    status: "active",
    estimatedImpactUSD: 620000
  },
  {
    id: "EXC-003",
    type: "maintenance_risk",
    severity: "high",
    vesselId: 2,
    vesselName: "Atlantic Pioneer",
    route: "New York → Hamburg",
    title: "Rudder Hydraulic System Degradation — Actionable",
    description: "Port rudder actuator hydraulic pressure drop 15%. Predictive model indicates failure probability 84% within 13 days.",
    whyItMatters: "Main rudder failure at sea requires emergency tow. Insurance excess $2M. DPA notification mandatory.",
    recommendedResponse: "Schedule port call maintenance at Hamburg. Pre-order hydraulic seals. Notify P&I club.",
    businessConsequence: "Potential off-hire period 4–7 days. Revenue exposure $316K. Charter penalty risk.",
    owner: "V. Petrov",
    ownerFunction: "Technical",
    detectedAt: "2026-03-28T11:22:33Z",
    status: "acknowledged",
    estimatedImpactUSD: 316000
  },
  {
    id: "EXC-004",
    type: "delay_risk",
    severity: "high",
    vesselId: 8,
    vesselName: "Arctic Falcon",
    route: "Narvik → Murmansk",
    title: "Ice Condition Delay — Arctic Route Speed Reduction",
    description: "Unexpected ice field expansion forcing 6.2 knot transit. ETA now 22 hours behind. Icebreaker convoy not available until 0800 local.",
    whyItMatters: "Murmansk port slot held for 12-hour window. Missing slot means 48-hour delay in loading operations.",
    recommendedResponse: "Contact Murmansk port authority for slot re-allocation. Engage icebreaker escort service. Inform cargo receiver.",
    businessConsequence: "$420K delay cost. Receiver storage costs accruing. On-time performance SLA breach.",
    owner: "B. Ivanova",
    ownerFunction: "Operations",
    detectedAt: "2026-03-30T02:30:00Z",
    status: "active",
    estimatedImpactUSD: 420000
  },
  {
    id: "EXC-005",
    type: "port_congestion",
    severity: "watch",
    vesselId: 1,
    vesselName: "Pacific Meridian",
    route: "Port Hedland → Yokohama",
    title: "Yokohama Anchorage Congestion — Pre-arrival Monitor",
    description: "Yokohama anchorage showing 12 bulk carriers waiting. Average current wait 18 hours. Pacific Meridian ETA in 36 hours.",
    whyItMatters: "Cargo receiver operating on just-in-time schedule. Steel mill production aligned to ETA.",
    recommendedResponse: "Issue early arrival notice. Request priority anchorage via agent. Consider speed reduction to align arrival.",
    businessConsequence: "If anchorage wait exceeds 24h, demurrage clock starts at $28,500/day.",
    owner: "Y. Tanaka",
    ownerFunction: "Commercial",
    detectedAt: "2026-03-30T07:00:00Z",
    status: "active",
    estimatedImpactUSD: 71250
  },
  {
    id: "EXC-006",
    type: "fuel_anomaly",
    severity: "watch",
    vesselId: 10,
    vesselName: "Cape Victory",
    route: "Pointe-Noire → Cape Town",
    title: "Fuel Consumption Anomaly — 12% Above Voyage Budget",
    description: "Cape Victory fuel consumption 12.4% above voyage plan baseline. Engine monitoring shows no mechanical fault. Likely current conditions.",
    whyItMatters: "Voyage fuel budget $1.1M. Current tracking toward $1.24M. Margin compression on fixed-rate voyage.",
    recommendedResponse: "Adjust speed to weather-optimal routing. Review trim optimization. Submit deviation report to owner.",
    businessConsequence: "$136K margin erosion at current trajectory. Route profitability index at risk.",
    owner: "D. Adewale",
    ownerFunction: "Technical",
    detectedAt: "2026-03-29T18:00:00Z",
    status: "active",
    estimatedImpactUSD: 136000
  },
  {
    id: "EXC-007",
    type: "route_deviation",
    severity: "watch",
    vesselId: 4,
    vesselName: "Nordic Star",
    route: "Bremerhaven → Oslo",
    title: "AIS Signal Interruption — 47-Minute Gap",
    description: "Nordic Star AIS transponder experienced 47-minute outage at 02:08 UTC. Position maintained via VSAT backup. Signal restored.",
    whyItMatters: "Unexplained AIS gaps trigger flag state reporting requirements under SOLAS V/19.",
    recommendedResponse: "Log incident in Official Log Book. Submit AIS gap report to flag state within 24 hours. Technical inspection at next port call.",
    businessConsequence: "Non-compliance exposure. Port State Control inspection risk at Oslo.",
    owner: "Capt. Eriksen",
    ownerFunction: "Compliance",
    detectedAt: "2026-03-30T02:08:45Z",
    status: "acknowledged",
    estimatedImpactUSD: 45000
  },
  {
    id: "EXC-008",
    type: "schedule_variance",
    severity: "normal",
    vesselId: 9,
    vesselName: "Gulf Titan",
    route: "Ras Tanura → Ningbo",
    title: "Cargo Loading Ahead of Schedule — Positive Variance",
    description: "Terminal operations running 6 hours ahead. Loading expected complete by 18:00 vs 00:00 planned departure.",
    whyItMatters: "Early departure enables favorable current window across Indian Ocean. Estimated 1.4 days of fuel savings.",
    recommendedResponse: "Confirm crew readiness for early departure. Notify Ningbo agents of revised ETA. Update charterer.",
    businessConsequence: "Positive variance: $340K fuel savings opportunity. Improved on-time performance record.",
    owner: "S. Mohammed",
    ownerFunction: "Operations",
    detectedAt: "2026-03-30T09:00:00Z",
    status: "active",
    estimatedImpactUSD: -340000
  },
];

const maintenanceItems: MaintenanceItem[] = [
  {
    id: 1, vesselId: 6, vesselName: "Indian Ocean Star", component: "Primary Compressor Unit",
    type: "corrective", description: "Complete compressor unit failure — full replacement required. Secondary engaged. Engine at 70% capacity.",
    dueDate: "2026-04-10", status: "in_progress", priority: "critical", estimatedCost: 185000, daysToDue: 11,
    riskOfServiceIssue: 92, impactsVoyageAvailability: true, technician: "P. Sharma", assetHealth: 18
  },
  {
    id: 2, vesselId: 6, vesselName: "Indian Ocean Star", component: "Fire Detection System — Engine Room",
    type: "corrective", description: "Detainable PSC deficiency. Sensor replacement in progress.",
    dueDate: "2026-04-05", status: "in_progress", priority: "critical", estimatedCost: 42000, daysToDue: 6,
    riskOfServiceIssue: 88, impactsVoyageAvailability: false, technician: "P. Sharma", assetHealth: 31
  },
  {
    id: 3, vesselId: 2, vesselName: "Atlantic Pioneer", component: "Rudder Hydraulic System — Port Actuator",
    type: "predictive", description: "15% hydraulic pressure drop. Predictive failure probability 84% within 13 days.",
    dueDate: "2026-04-12", status: "due_soon", priority: "high", estimatedCost: 78000, daysToDue: 13,
    riskOfServiceIssue: 76, impactsVoyageAvailability: true, technician: "M. Chen", assetHealth: 58
  },
  {
    id: 4, vesselId: 8, vesselName: "Arctic Falcon", component: "Lifeboat Davit System — All Units",
    type: "preventive", description: "Monthly inspection overdue 14 days. Chief Officer reports weather delays.",
    dueDate: "2026-03-16", status: "overdue", priority: "high", estimatedCost: 18000, daysToDue: -14,
    riskOfServiceIssue: 61, impactsVoyageAvailability: false, technician: "V. Kozlov", assetHealth: 62
  },
  {
    id: 5, vesselId: 8, vesselName: "Arctic Falcon", component: "Cargo Hold #3 Hatch Seal",
    type: "predictive", description: "Seal deterioration predicted. Failure risk before next bulk cargo load.",
    dueDate: "2026-04-28", status: "scheduled", priority: "medium", estimatedCost: 12000, daysToDue: 29,
    riskOfServiceIssue: 44, impactsVoyageAvailability: true, technician: "TBD", assetHealth: 71
  },
  {
    id: 6, vesselId: 4, vesselName: "Nordic Star", component: "Bow Thruster Motor Winding",
    type: "preventive", description: "Scheduled motor rewinding overdue. Affecting maneuverability at slow speeds.",
    dueDate: "2026-04-08", status: "due_soon", priority: "medium", estimatedCost: 45000, daysToDue: 9,
    riskOfServiceIssue: 52, impactsVoyageAvailability: false, technician: "E. Larsen", assetHealth: 69
  },
  {
    id: 7, vesselId: 3, vesselName: "Crimson Voyager", component: "Dry Dock Annual Survey",
    type: "scheduled", description: "Planned dry dock in Singapore. Hull inspection and anti-fouling.",
    dueDate: "2026-05-10", status: "scheduled", priority: "medium", estimatedCost: 250000, daysToDue: 41,
    riskOfServiceIssue: 28, impactsVoyageAvailability: true, technician: "TBD", assetHealth: 82
  },
  {
    id: 8, vesselId: 10, vesselName: "Cape Victory", component: "Main Engine Cylinder Liner #4",
    type: "predictive", description: "Wear indicators approaching upper threshold. Liner replacement recommended at next dry dock.",
    dueDate: "2026-04-20", status: "due_soon", priority: "medium", estimatedCost: 64000, daysToDue: 21,
    riskOfServiceIssue: 48, impactsVoyageAvailability: false, technician: "TBD", assetHealth: 64
  },
  {
    id: 9, vesselId: 1, vesselName: "Pacific Meridian", component: "Main Engine — Fuel Injector Overhaul",
    type: "preventive", description: "Injector overhaul completed at Port Hedland. Performing within spec.",
    dueDate: "2026-03-15", status: "completed", priority: "high", estimatedCost: 42000, daysToDue: -15,
    riskOfServiceIssue: 12, impactsVoyageAvailability: false, technician: "J. Anderson", assetHealth: 94
  },
];

const performanceMetrics: PerformanceMetric[] = [
  { vesselId: 1, vesselName: "Pacific Meridian", month: "2026-03", utilization: 94.2, onTimeArrivalRate: 96.0, avgDelayHours: 0.8, routeProfitability: 51.4, fuelEfficiency: 0.52, tce: 28500 },
  { vesselId: 2, vesselName: "Atlantic Pioneer", month: "2026-03", utilization: 88.7, onTimeArrivalRate: 82.0, avgDelayHours: 8.4, routeProfitability: 46.2, fuelEfficiency: 0.61, tce: 45200 },
  { vesselId: 3, vesselName: "Crimson Voyager", month: "2026-03", utilization: 96.1, onTimeArrivalRate: 98.0, avgDelayHours: 0.2, routeProfitability: 58.9, fuelEfficiency: 0.48, tce: 52000 },
  { vesselId: 4, vesselName: "Nordic Star", month: "2026-03", utilization: 72.3, onTimeArrivalRate: 68.0, avgDelayHours: 16.2, routeProfitability: 26.3, fuelEfficiency: 0.79, tce: 18900 },
  { vesselId: 5, vesselName: "Southern Cross", month: "2026-03", utilization: 91.5, onTimeArrivalRate: 91.0, avgDelayHours: 2.1, routeProfitability: 50.0, fuelEfficiency: 0.54, tce: 31200 },
  { vesselId: 6, vesselName: "Indian Ocean Star", month: "2026-03", utilization: 0.0, onTimeArrivalRate: 0.0, avgDelayHours: 240.0, routeProfitability: -100.0, fuelEfficiency: 0.0, tce: 0 },
  { vesselId: 7, vesselName: "Mediterranean Dawn", month: "2026-03", utilization: 87.4, onTimeArrivalRate: 74.0, avgDelayHours: 11.8, routeProfitability: 46.2, fuelEfficiency: 0.59, tce: 38700 },
  { vesselId: 8, vesselName: "Arctic Falcon", month: "2026-03", utilization: 78.9, onTimeArrivalRate: 71.0, avgDelayHours: 12.4, routeProfitability: 27.6, fuelEfficiency: 0.71, tce: 22400 },
  { vesselId: 9, vesselName: "Gulf Titan", month: "2026-03", utilization: 89.3, onTimeArrivalRate: 94.0, avgDelayHours: 1.4, routeProfitability: 64.8, fuelEfficiency: 0.46, tce: 48600 },
  { vesselId: 10, vesselName: "Cape Victory", month: "2026-03", utilization: 81.2, onTimeArrivalRate: 79.0, avgDelayHours: 6.8, routeProfitability: 47.5, fuelEfficiency: 0.63, tce: 25100 },
];

const corridors: Corridor[] = [
  {
    id: "COR-001", name: "Persian Gulf — Far East Crude", origin: "Ras Tanura / Jubail", destination: "Ningbo / Busan",
    region: "Middle East", vesselCount: 3, delayRate: 8, avgTransitDays: 17, weatherRisk: "low", portCongestionRisk: "moderate",
    profitabilityIndex: 88, commodity: "Crude Oil", weeklyVolume: "4.2M bbl", trend: "up", activeAlerts: 1
  },
  {
    id: "COR-002", name: "Australia — Japan Iron Ore", origin: "Port Hedland / Dampier", destination: "Yokohama / Nagoya",
    region: "Asia Pacific", vesselCount: 2, delayRate: 12, avgTransitDays: 10, weatherRisk: "moderate", portCongestionRisk: "high",
    profitabilityIndex: 72, commodity: "Iron Ore", weeklyVolume: "2.8M MT", trend: "stable", activeAlerts: 1
  },
  {
    id: "COR-003", name: "Red Sea — Suez Transit", origin: "Gulf of Aden", destination: "Mediterranean",
    region: "Middle East", vesselCount: 0, delayRate: 48, avgTransitDays: 3, weatherRisk: "high", portCongestionRisk: "high",
    profitabilityIndex: 31, commodity: "Mixed", weeklyVolume: "Restricted", trend: "down", activeAlerts: 4
  },
  {
    id: "COR-004", name: "Atlantic — North Europe Container", origin: "US East Coast", destination: "Rotterdam / Hamburg",
    region: "North Atlantic", vesselCount: 2, delayRate: 18, avgTransitDays: 14, weatherRisk: "moderate", portCongestionRisk: "moderate",
    profitabilityIndex: 64, commodity: "Container (General Cargo)", weeklyVolume: "82K TEU", trend: "stable", activeAlerts: 0
  },
  {
    id: "COR-005", name: "Mediterranean Feeder", origin: "Piraeus / Istanbul", destination: "Genoa / Barcelona",
    region: "Mediterranean", vesselCount: 1, delayRate: 28, avgTransitDays: 2, weatherRisk: "high", portCongestionRisk: "low",
    profitabilityIndex: 58, commodity: "Consumer Goods / Electronics", weeklyVolume: "18K TEU", trend: "down", activeAlerts: 2
  },
  {
    id: "COR-006", name: "Arctic — Russian Arctic Ore", origin: "Narvik / Murmansk", destination: "Rotterdam / Antwerp",
    region: "Arctic", vesselCount: 1, delayRate: 34, avgTransitDays: 9, weatherRisk: "severe", portCongestionRisk: "low",
    profitabilityIndex: 42, commodity: "Nickel / Iron Ore", weeklyVolume: "480K MT", trend: "down", activeAlerts: 2
  },
  {
    id: "COR-007", name: "West Africa — Cape Run", origin: "Gulf of Guinea", destination: "Cape Town / Durban",
    region: "West Africa", vesselCount: 1, delayRate: 14, avgTransitDays: 13, weatherRisk: "moderate", portCongestionRisk: "low",
    profitabilityIndex: 67, commodity: "Iron Ore / Manganese", weeklyVolume: "1.1M MT", trend: "stable", activeAlerts: 1
  },
];

const maintenanceLogs: MaintenanceLog[] = [
  { id: 1, vesselId: 1, vesselName: "Pacific Meridian", type: "Preventive", description: "Main Engine — Fuel Injector Overhaul", date: "2026-03-15", status: "Completed", priority: "High", estimatedCost: 42000, technician: "J. Anderson" },
  { id: 2, vesselId: 2, vesselName: "Atlantic Pioneer", type: "Corrective", description: "Rudder Actuator Hydraulic Seal Replacement", date: "2026-03-28", status: "In Progress", priority: "Critical", estimatedCost: 78000, technician: "M. Chen" },
  { id: 3, vesselId: 3, vesselName: "Crimson Voyager", type: "Scheduled", description: "Dry Dock Annual Survey", date: "2026-05-10", status: "Scheduled", priority: "Medium", estimatedCost: 250000, technician: "TBD" },
  { id: 4, vesselId: 6, vesselName: "Indian Ocean Star", type: "Corrective", description: "Compressor Unit Failure — Full Replacement", date: "2026-03-25", status: "In Progress", priority: "Critical", estimatedCost: 185000, technician: "P. Sharma" },
  { id: 5, vesselId: 4, vesselName: "Nordic Star", type: "Preventive", description: "Bow Thruster Maintenance", date: "2026-04-08", status: "Scheduled", priority: "Medium", estimatedCost: 31000, technician: "E. Larsen" },
];

const complianceCertificates: ComplianceCertificate[] = [
  { id: 1, vesselId: 1, vesselName: "Pacific Meridian", certificateType: "Safety Management Certificate", issuingAuthority: "Panama Maritime Authority", issueDate: "2024-01-10", expiryDate: "2029-01-10", status: "Valid", daysUntilExpiry: 1015 },
  { id: 2, vesselId: 4, vesselName: "Nordic Star", certificateType: "IOPP Certificate", issuingAuthority: "Norwegian Maritime Authority", issueDate: "2023-04-15", expiryDate: "2026-04-20", status: "Expiring", daysUntilExpiry: 21 },
  { id: 3, vesselId: 6, vesselName: "Indian Ocean Star", certificateType: "Cargo Ship Safety Construction Certificate", issuingAuthority: "IMO", issueDate: "2021-06-01", expiryDate: "2026-03-28", status: "Expired", daysUntilExpiry: -2 },
  { id: 4, vesselId: 2, vesselName: "Atlantic Pioneer", certificateType: "Document of Compliance", issuingAuthority: "Lloyd's Register", issueDate: "2023-09-01", expiryDate: "2028-09-01", status: "Valid", daysUntilExpiry: 885 },
  { id: 5, vesselId: 8, vesselName: "Arctic Falcon", certificateType: "Polar Code Certificate", issuingAuthority: "Cyprus Department of Merchant Shipping", issueDate: "2024-03-01", expiryDate: "2026-04-15", status: "Expiring", daysUntilExpiry: 16 },
];

const portStateDeficiencies: PortStateDeficiency[] = [
  { id: 1, vesselId: 8, vesselName: "Arctic Falcon", port: "Narvik", deficiencyCode: "07101", description: "Lifeboat — Launching Appliances — Insufficient Maintenance", date: "2026-02-14", status: "Open", severity: "Major" },
  { id: 2, vesselId: 6, vesselName: "Indian Ocean Star", port: "Mumbai", deficiencyCode: "01105", description: "Fire Detection System — Defective Sensor in Engine Room", date: "2026-01-22", status: "Open", severity: "Detainable" },
  { id: 3, vesselId: 4, vesselName: "Nordic Star", port: "Bremerhaven", deficiencyCode: "03114", description: "ISM — Safety Management System Documentation Incomplete", date: "2026-03-05", status: "Rectified", severity: "Minor" },
];

const shipmentRecords: ShipmentRecord[] = [
  { id: 1, vesselId: 1, vesselName: "Pacific Meridian", cargo: "Iron Ore", quantity: 72000, unit: "MT", origin: "Port Hedland, AUS", destination: "Yokohama, JPN", loadDate: "2026-03-28", deliveryDate: "2026-04-02", status: "in_transit", value: 4320000 },
  { id: 2, vesselId: 3, vesselName: "Crimson Voyager", cargo: "Crude Oil", quantity: 95000, unit: "MT", origin: "Ras Tanura, SAU", destination: "Fujairah, UAE", loadDate: "2026-03-29", deliveryDate: "2026-04-01", status: "in_transit", value: 71250000 },
  { id: 3, vesselId: 7, vesselName: "Mediterranean Dawn", cargo: "Consumer Electronics", quantity: 4200, unit: "TEU", origin: "Piraeus, GRC", destination: "Genoa, ITA", loadDate: "2026-03-30", deliveryDate: "2026-04-01", status: "in_transit", value: 18900000 },
  { id: 4, vesselId: 5, vesselName: "Southern Cross", cargo: "Thermal Coal", quantity: 68000, unit: "MT", origin: "Newcastle, AUS", destination: "Brisbane, AUS", loadDate: "2026-03-29", deliveryDate: "2026-04-04", status: "loading", value: 8840000 },
];

const eventLogs: EventLog[] = [
  { id: 1, vesselId: 6, vesselName: "Indian Ocean Star", category: "Mechanical", severity: "Critical", message: "Compressor Failure — Main Engine Affected", details: "Primary compressor unit has failed, secondary engaged. Engine running at reduced capacity (70%).", timestamp: "2026-03-30T06:14:22Z" },
  { id: 2, vesselId: 8, vesselName: "Arctic Falcon", category: "Safety", severity: "Warning", message: "Lifeboat Davit Inspection Overdue by 14 Days", details: "Monthly lifeboat launching appliance inspection was not completed. Chief Officer reports weather delays.", timestamp: "2026-03-29T14:32:11Z" },
  { id: 3, vesselId: 4, vesselName: "Nordic Star", category: "Navigation", severity: "Warning", message: "AIS Signal Interrupted — 47 Minutes", details: "AIS transponder experienced brief interruption. Signal restored. Position maintained via VSAT.", timestamp: "2026-03-30T02:08:45Z" },
  { id: 4, vesselId: 1, vesselName: "Pacific Meridian", category: "Operations", severity: "Info", message: "ETA Update — Yokohama — 14 Hours Ahead of Schedule", details: "Favorable currents in the North Pacific allowed increased speed.", timestamp: "2026-03-30T08:55:10Z" },
  { id: 5, vesselId: 2, vesselName: "Atlantic Pioneer", category: "Maintenance", severity: "Warning", message: "Rudder Hydraulic Seal Degradation Detected", details: "Predictive sensor indicates 15% hydraulic pressure drop on port rudder actuator.", timestamp: "2026-03-28T11:22:33Z" },
  { id: 6, vesselId: 3, vesselName: "Crimson Voyager", category: "Security", severity: "Critical", message: "Unidentified Vessel Approach — AIS Dark — Persian Gulf", details: "Unidentified vessel approached within 800m without AIS. Coast Guard notified. Vessel departed after 12 minutes.", timestamp: "2026-03-30T04:41:02Z" },
];

const emissionRecords: EmissionRecord[] = [
  { id: 1, vesselId: 1, date: "2026-03-29", co2: 42.3, sox: 0.4, nox: 2.1, ciiScore: "A" },
  { id: 2, vesselId: 2, date: "2026-03-29", co2: 68.1, sox: 0.9, nox: 3.8, ciiScore: "B" },
  { id: 3, vesselId: 3, date: "2026-03-29", co2: 55.7, sox: 0.6, nox: 2.9, ciiScore: "A" },
  { id: 4, vesselId: 5, date: "2026-03-29", co2: 44.6, sox: 0.5, nox: 2.3, ciiScore: "B" },
  { id: 5, vesselId: 7, date: "2026-03-29", co2: 61.3, sox: 0.8, nox: 3.4, ciiScore: "B" },
];

const aiBriefings: AIBriefing[] = [
  { id: 1, title: "Red Sea Transit Risk — Elevated", summary: "Satellite data and AIS analysis indicate elevated risk for southbound transits through Red Sea corridor. Recommend Suez Canal hold or Cape Horn re-routing.", confidence: 87, category: "Geopolitical", timestamp: "2026-03-30T07:00:00Z", priority: "High" },
  { id: 2, title: "Suez Canal Congestion — 18-Hour Delays", summary: "Port congestion algorithm forecasts 18-hour average wait at Suez Canal anchorage. Suggest departure timing adjustment of -6 hours.", confidence: 92, category: "Logistics", timestamp: "2026-03-29T18:30:00Z", priority: "Medium" },
  { id: 3, title: "Bunker Price Optimization Opportunity", summary: "Brent crude decline of 4.2% creates favorable bunker pricing window at Singapore and Rotterdam.", confidence: 78, category: "Commercial", timestamp: "2026-03-30T06:00:00Z", priority: "Medium" },
];

const predictiveMaintenanceItems: PredictiveMaintenance[] = [
  { id: 1, vesselId: 2, vesselName: "Atlantic Pioneer", component: "Rudder Hydraulic System", predictedFailureDate: "2026-04-12", confidence: 84, recommendedAction: "Replace hydraulic seals and inspect actuator cylinder", estimatedCost: 78000, priority: "High" },
  { id: 2, vesselId: 4, vesselName: "Nordic Star", component: "Bow Thruster Motor Winding", predictedFailureDate: "2026-05-20", confidence: 71, recommendedAction: "Schedule motor rewinding during next port call", estimatedCost: 45000, priority: "Medium" },
  { id: 3, vesselId: 8, vesselName: "Arctic Falcon", component: "Cargo Hold #3 Hatch Seal", predictedFailureDate: "2026-04-28", confidence: 68, recommendedAction: "Inspect and replace rubber seal prior to next bulk cargo load", estimatedCost: 12000, priority: "Medium" },
];

const forecastModules: ForecastModule[] = [
  { id: 1, metric: "Fleet TCE Average", currentValue: 33857, forecastValue: 36200, unit: "USD/day", trend: "up", confidence: 76 },
  { id: 2, metric: "Fleet CO2 Intensity", currentValue: 50.3, forecastValue: 47.8, unit: "gCO2/MT-nm", trend: "down", confidence: 82 },
  { id: 3, metric: "Fleet Utilization", currentValue: 87.6, forecastValue: 89.1, unit: "%", trend: "up", confidence: 71 },
  { id: 4, metric: "Active Alerts", currentValue: 6, forecastValue: 4, unit: "alerts", trend: "down", confidence: 65 },
];

const sanctionsRiskIndicators = [
  { entity: "Kavkaz Energy Holdings", flag: "Russia", riskLevel: "Critical", vessels: ["MV Siberian Wind", "MT Caspian Tide"], lastUpdated: "2026-03-28" },
  { entity: "Pacific Grain Trading LLC", flag: "Iran", riskLevel: "High", vessels: ["MV Golden Harvest"], lastUpdated: "2026-03-25" },
  { entity: "Horizon Navigation Ltd", flag: "North Korea", riskLevel: "Critical", vessels: ["MT Blue Star", "MV Seoul Express"], lastUpdated: "2026-03-29" },
];

const complianceAlerts = [
  { id: 1, type: "Certificate Expiry", message: "IOPP Certificate for Nordic Star expires in 21 days", severity: "Warning", vesselId: 4, vesselName: "Nordic Star" },
  { id: 2, type: "Certificate Expired", message: "Safety Construction Certificate for Indian Ocean Star has expired", severity: "Critical", vesselId: 6, vesselName: "Indian Ocean Star" },
  { id: 3, type: "PSC Deficiency", message: "Open PSC deficiency — Arctic Falcon — Narvik Port State Control", severity: "Warning", vesselId: 8, vesselName: "Arctic Falcon" },
  { id: 4, type: "PSC Detainable", message: "Detainable PSC deficiency — Indian Ocean Star — Mumbai — Fire Detection", severity: "Critical", vesselId: 6, vesselName: "Indian Ocean Star" },
];

const fleets = [
  { id: 1, name: "Pacific Fleet", vessels: [1, 5], region: "Asia-Pacific", manager: "Pacific Ship Management" },
  { id: 2, name: "Atlantic Fleet", vessels: [2, 10], region: "Atlantic", manager: "Atlantic Ship Management" },
  { id: 3, name: "Middle East Fleet", vessels: [3, 9], region: "Middle East", manager: "Gulf Ship Management" },
  { id: 4, name: "Nordic Fleet", vessels: [4], region: "Northern Europe", manager: "Nordic Ship Management" },
  { id: 5, name: "Mediterranean Fleet", vessels: [7], region: "Mediterranean", manager: "Med Ship Management" },
  { id: 6, name: "Indian Ocean Fleet", vessels: [6], region: "Indian Ocean", manager: "Indian Ship Management" },
  { id: 7, name: "Arctic Fleet", vessels: [8], region: "Arctic", manager: "Arctic Ship Management" },
];

export const vesselsDomainMockData = {
  vessels,
  voyageEconomics,
  fleetExceptions,
  maintenanceItems,
  performanceMetrics,
  corridors,
  maintenanceLogs,
  complianceCertificates,
  portStateDeficiencies,
  shipmentRecords,
  eventLogs,
  emissionRecords,
  aiBriefings,
  predictiveMaintenanceItems,
  forecastModules,
  sanctionsRiskIndicators,
  complianceAlerts,
  fleets,
};

export const mockData = vesselsDomainMockData;
