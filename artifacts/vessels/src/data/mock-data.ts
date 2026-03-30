export interface VesselProfile {
  id: number;
  name: string;
  imo: string;
  mmsi: string;
  flag: string;
  type: string;
  status: "at_sea" | "in_port" | "anchored" | "maintenance";
  lat: number;
  lon: number;
  currentSpeed: number;
  heading: number;
  nextPort: string;
  eta: string;
  tce: number;
  utilization: number;
  ciiRating: string;
  co2EmissionsDaily: number;
  riskScore: number;
  fleet: string;
  cargoType: string;
  dwt: number;
  yearBuilt: number;
  owner: string;
  manager: string;
  lastPort: string;
  draught: number;
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
  { id: 1, name: "Pacific Meridian", imo: "9876543", mmsi: "123456789", flag: "Panama", type: "Bulk Carrier", status: "at_sea", lat: 35.2, lon: 142.5, currentSpeed: 14.2, heading: 87, nextPort: "Yokohama", eta: "2026-04-02", tce: 28500, utilization: 94.2, ciiRating: "A", co2EmissionsDaily: 42.3, riskScore: 22, fleet: "Pacific Fleet", cargoType: "Iron Ore", dwt: 82000, yearBuilt: 2019, owner: "SZL Maritime", manager: "Pacific Ship Management", lastPort: "Port Hedland", draught: 12.4 },
  { id: 2, name: "Atlantic Pioneer", imo: "9765432", mmsi: "234567890", flag: "Liberia", type: "Container Ship", status: "in_port", lat: 51.9, lon: 4.4, currentSpeed: 0, heading: 0, nextPort: "Hamburg", eta: "2026-04-05", tce: 45200, utilization: 88.7, ciiRating: "B", co2EmissionsDaily: 68.1, riskScore: 35, fleet: "Atlantic Fleet", cargoType: "General Cargo", dwt: 65000, yearBuilt: 2017, owner: "SZL Maritime", manager: "Atlantic Ship Management", lastPort: "Rotterdam", draught: 11.2 },
  { id: 3, name: "Crimson Voyager", imo: "9654321", mmsi: "345678901", flag: "Marshall Islands", type: "Tanker", status: "at_sea", lat: 25.1, lon: 55.3, currentSpeed: 12.8, heading: 215, nextPort: "Fujairah", eta: "2026-04-01", tce: 52000, utilization: 96.1, ciiRating: "A", co2EmissionsDaily: 55.7, riskScore: 18, fleet: "Middle East Fleet", cargoType: "Crude Oil", dwt: 115000, yearBuilt: 2020, owner: "SZL Maritime", manager: "Gulf Ship Management", lastPort: "Ras Tanura", draught: 14.8 },
  { id: 4, name: "Nordic Star", imo: "9543210", mmsi: "456789012", flag: "Norway", type: "Ro-Ro", status: "anchored", lat: 59.9, lon: 10.7, currentSpeed: 0, heading: 0, nextPort: "Oslo", eta: "2026-04-03", tce: 18900, utilization: 72.3, ciiRating: "C", co2EmissionsDaily: 31.2, riskScore: 48, fleet: "Nordic Fleet", cargoType: "Vehicles", dwt: 28000, yearBuilt: 2015, owner: "SZL Maritime", manager: "Nordic Ship Management", lastPort: "Bremerhaven", draught: 8.1 },
  { id: 5, name: "Southern Cross", imo: "9432109", mmsi: "567890123", flag: "Singapore", type: "Bulk Carrier", status: "at_sea", lat: -33.8, lon: 151.2, currentSpeed: 13.5, heading: 32, nextPort: "Brisbane", eta: "2026-04-04", tce: 31200, utilization: 91.5, ciiRating: "B", co2EmissionsDaily: 44.6, riskScore: 28, fleet: "Pacific Fleet", cargoType: "Coal", dwt: 76000, yearBuilt: 2018, owner: "SZL Maritime", manager: "Pacific Ship Management", lastPort: "Newcastle", draught: 12.1 },
  { id: 6, name: "Indian Ocean Star", imo: "9321098", mmsi: "678901234", flag: "India", type: "Tanker", status: "maintenance", lat: 19.1, lon: 72.8, currentSpeed: 0, heading: 0, nextPort: "Mumbai", eta: "2026-04-10", tce: 0, utilization: 0, ciiRating: "B", co2EmissionsDaily: 0, riskScore: 62, fleet: "Indian Ocean Fleet", cargoType: "LNG", dwt: 95000, yearBuilt: 2016, owner: "SZL Maritime", manager: "Indian Ship Management", lastPort: "Mumbai", draught: 7.2 },
  { id: 7, name: "Mediterranean Dawn", imo: "9210987", mmsi: "789012345", flag: "Malta", type: "Container Ship", status: "at_sea", lat: 35.9, lon: 14.5, currentSpeed: 16.1, heading: 275, nextPort: "Genoa", eta: "2026-04-01", tce: 38700, utilization: 87.4, ciiRating: "B", co2EmissionsDaily: 61.3, riskScore: 31, fleet: "Mediterranean Fleet", cargoType: "Consumer Goods", dwt: 52000, yearBuilt: 2021, owner: "SZL Maritime", manager: "Med Ship Management", lastPort: "Piraeus", draught: 10.5 },
  { id: 8, name: "Arctic Falcon", imo: "9109876", mmsi: "890123456", flag: "Cyprus", type: "Bulk Carrier", status: "in_port", lat: 68.9, lon: 33.1, currentSpeed: 0, heading: 0, nextPort: "Murmansk", eta: "2026-04-06", tce: 22400, utilization: 78.9, ciiRating: "C", co2EmissionsDaily: 38.9, riskScore: 55, fleet: "Arctic Fleet", cargoType: "Nickel Ore", dwt: 68000, yearBuilt: 2014, owner: "SZL Maritime", manager: "Arctic Ship Management", lastPort: "Narvik", draught: 11.8 },
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
  { id: 2, name: "Atlantic Fleet", vessels: [2], region: "Atlantic", manager: "Atlantic Ship Management" },
  { id: 3, name: "Middle East Fleet", vessels: [3], region: "Middle East", manager: "Gulf Ship Management" },
  { id: 4, name: "Nordic Fleet", vessels: [4], region: "Northern Europe", manager: "Nordic Ship Management" },
  { id: 5, name: "Mediterranean Fleet", vessels: [7], region: "Mediterranean", manager: "Med Ship Management" },
  { id: 6, name: "Indian Ocean Fleet", vessels: [6], region: "Indian Ocean", manager: "Indian Ship Management" },
  { id: 7, name: "Arctic Fleet", vessels: [8], region: "Arctic", manager: "Arctic Ship Management" },
];

export const vesselsDomainMockData = {
  vessels,
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
