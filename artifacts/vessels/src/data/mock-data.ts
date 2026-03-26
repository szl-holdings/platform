export interface VesselProfile {
  id: number;
  name: string;
  imo: string;
  mmsi: string;
  vesselType: string;
  flag: string;
  yearBuilt: number;
  grossTonnage: number;
  deadweight: number;
  length: number;
  beam: number;
  draft: number;
  status: string;
  fleetId: number;
  currentLat: number;
  currentLon: number;
  currentSpeed: number;
  currentHeading: number;
  lastPort: string;
  nextPort: string;
  eta: string;
  fuelConsumptionDaily: number;
  co2EmissionsDaily: number;
  ciiRating: string;
  hullCondition: number;
  engineHealth: number;
  maintenanceScore: number;
  tce: number;
  utilization: number;
  eexi: number;
}

export interface MaintenanceLog {
  id: number;
  vesselId: number;
  vesselName: string;
  component: string;
  type: string;
  status: string;
  severity: string;
  scheduledDate: string;
  description: string;
  estimatedHours: number;
  cost: number;
}

export interface ComplianceCertificate {
  id: number;
  vesselId: number;
  vesselName: string;
  certificateType: string;
  issuer: string;
  issuedDate: string;
  expiryDate: string;
  status: string;
  daysUntilExpiry: number;
}

export interface PortStateDeficiency {
  id: number;
  vesselId: number;
  vesselName: string;
  port: string;
  inspectionDate: string;
  deficiencyCode: string;
  description: string;
  severity: string;
  status: string;
  rectifiedDate: string | null;
}

export interface ShipmentRecord {
  id: number;
  vesselId: number;
  vesselName: string;
  shipmentId: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight: number;
  status: string;
  departureDate: string;
  eta: string;
  actualArrival: string | null;
  onTimeScore: number;
  customerSatisfaction: number;
  demurrageRisk: string;
}

export interface EventLog {
  id: number;
  timestamp: string;
  vesselId: number;
  vesselName: string;
  severity: "Critical" | "Warning" | "Info" | "Debug";
  category: string;
  message: string;
  details: string;
  source: string;
}

export interface EmissionRecord {
  vesselId: number;
  vesselName: string;
  month: string;
  fuelConsumed: number;
  fuelType: string;
  co2Emissions: number;
  sox: number;
  nox: number;
  pm: number;
  ciiScore: number;
  ciiRating: string;
  eeoiValue: number;
  distanceTraveled: number;
  cargoCarried: number;
}

export interface AIBriefing {
  id: number;
  title: string;
  category: string;
  severity: string;
  summary: string;
  details: string;
  confidence: number;
  generatedAt: string;
  actionItems: string[];
  affectedVessels: string[];
}

export interface PredictiveMaintenance {
  id: number;
  vesselId: number;
  vesselName: string;
  component: string;
  failureProbability: number;
  predictedFailureDate: string;
  recommendedAction: string;
  estimatedCost: number;
  confidence: number;
  riskLevel: string;
}

export interface ForecastModule {
  id: number;
  title: string;
  metric: string;
  currentValue: number;
  forecastValue: number;
  forecastDate: string;
  confidence: number;
  trend: string;
  dataPoints: { date: string; value: number; forecast?: number }[];
}

const fleets = [
  { id: 1, name: "Atlantic Fleet", region: "North Atlantic", status: "active" },
  { id: 2, name: "Pacific Fleet", region: "Trans-Pacific", status: "active" },
  { id: 3, name: "Mediterranean Division", region: "Mediterranean Sea", status: "active" },
  { id: 4, name: "Middle East Corridor", region: "Arabian Gulf / Indian Ocean", status: "active" },
];

const vessels: VesselProfile[] = [
  { id: 1, name: "MV Pacific Voyager", imo: "9876543", mmsi: "311000001", vesselType: "container", flag: "Panama", yearBuilt: 2018, grossTonnage: 94000, deadweight: 109000, length: 334, beam: 48.2, draft: 14.5, status: "at_sea", fleetId: 2, currentLat: 34.05, currentLon: -152.3, currentSpeed: 18.2, currentHeading: 275, lastPort: "Los Angeles", nextPort: "Yokohama", eta: "2026-04-02", fuelConsumptionDaily: 185, co2EmissionsDaily: 576, ciiRating: "B", hullCondition: 87, engineHealth: 92, maintenanceScore: 88, tce: 24500, utilization: 94, eexi: 8.2 },
  { id: 2, name: "MV Atlantic Guardian", imo: "9876544", mmsi: "311000002", vesselType: "tanker", flag: "Marshall Islands", yearBuilt: 2016, grossTonnage: 81000, deadweight: 157000, length: 274, beam: 48, draft: 17.1, status: "at_sea", fleetId: 1, currentLat: 42.5, currentLon: -38.7, currentSpeed: 14.8, currentHeading: 85, lastPort: "Houston", nextPort: "Rotterdam", eta: "2026-04-05", fuelConsumptionDaily: 62, co2EmissionsDaily: 193, ciiRating: "A", hullCondition: 92, engineHealth: 95, maintenanceScore: 94, tce: 31200, utilization: 97, eexi: 5.1 },
  { id: 3, name: "MV Mediterranean Star", imo: "9876545", mmsi: "311000003", vesselType: "container", flag: "Greece", yearBuilt: 2020, grossTonnage: 48000, deadweight: 58000, length: 260, beam: 37, draft: 12.5, status: "in_port", fleetId: 3, currentLat: 36.45, currentLon: 28.22, currentSpeed: 0, currentHeading: 180, lastPort: "Piraeus", nextPort: "Alexandria", eta: "2026-03-30", fuelConsumptionDaily: 0, co2EmissionsDaily: 0, ciiRating: "B", hullCondition: 95, engineHealth: 97, maintenanceScore: 96, tce: 18900, utilization: 88, eexi: 7.8 },
  { id: 4, name: "MV Gulf Trader", imo: "9876546", mmsi: "311000004", vesselType: "bulk", flag: "Singapore", yearBuilt: 2015, grossTonnage: 43000, deadweight: 82000, length: 229, beam: 32.3, draft: 14.4, status: "at_sea", fleetId: 4, currentLat: 12.85, currentLon: 55.3, currentSpeed: 12.1, currentHeading: 45, lastPort: "Jebel Ali", nextPort: "Mumbai", eta: "2026-03-29", fuelConsumptionDaily: 38, co2EmissionsDaily: 118, ciiRating: "C", hullCondition: 78, engineHealth: 82, maintenanceScore: 75, tce: 15800, utilization: 85, eexi: 10.2 },
  { id: 5, name: "MV Nordic Explorer", imo: "9876547", mmsi: "311000005", vesselType: "cargo", flag: "Norway", yearBuilt: 2019, grossTonnage: 35000, deadweight: 42000, length: 200, beam: 30, draft: 11.2, status: "at_sea", fleetId: 1, currentLat: 58.2, currentLon: 2.5, currentSpeed: 15.5, currentHeading: 195, lastPort: "Bergen", nextPort: "Felixstowe", eta: "2026-03-28", fuelConsumptionDaily: 32, co2EmissionsDaily: 99, ciiRating: "A", hullCondition: 91, engineHealth: 93, maintenanceScore: 90, tce: 19200, utilization: 91, eexi: 6.4 },
  { id: 6, name: "MV Dragon Pearl", imo: "9876548", mmsi: "311000006", vesselType: "container", flag: "Hong Kong", yearBuilt: 2021, grossTonnage: 120000, deadweight: 145000, length: 366, beam: 51, draft: 16, status: "at_sea", fleetId: 2, currentLat: 22.3, currentLon: 114.2, currentSpeed: 20.1, currentHeading: 315, lastPort: "Shanghai", nextPort: "Singapore", eta: "2026-03-31", fuelConsumptionDaily: 220, co2EmissionsDaily: 684, ciiRating: "B", hullCondition: 98, engineHealth: 99, maintenanceScore: 97, tce: 28700, utilization: 96, eexi: 7.1 },
  { id: 7, name: "MV Sahara Wind", imo: "9876549", mmsi: "311000007", vesselType: "tanker", flag: "Liberia", yearBuilt: 2014, grossTonnage: 160000, deadweight: 300000, length: 333, beam: 60, draft: 22.5, status: "anchored", fleetId: 4, currentLat: 26.2, currentLon: 50.2, currentSpeed: 0, currentHeading: 90, lastPort: "Ras Tanura", nextPort: "Ningbo", eta: "2026-04-10", fuelConsumptionDaily: 0, co2EmissionsDaily: 0, ciiRating: "C", hullCondition: 72, engineHealth: 78, maintenanceScore: 70, tce: 35600, utilization: 82, eexi: 11.5 },
  { id: 8, name: "MV Baltic Queen", imo: "9876550", mmsi: "311000008", vesselType: "passenger", flag: "Finland", yearBuilt: 2022, grossTonnage: 56000, deadweight: 8500, length: 218, beam: 32, draft: 6.8, status: "in_port", fleetId: 1, currentLat: 60.16, currentLon: 24.94, currentSpeed: 0, currentHeading: 0, lastPort: "Helsinki", nextPort: "Stockholm", eta: "2026-03-27", fuelConsumptionDaily: 0, co2EmissionsDaily: 0, ciiRating: "A", hullCondition: 99, engineHealth: 98, maintenanceScore: 99, tce: 0, utilization: 78, eexi: 4.8 },
  { id: 9, name: "MV Coral Reef", imo: "9876551", mmsi: "311000009", vesselType: "bulk", flag: "Philippines", yearBuilt: 2017, grossTonnage: 38000, deadweight: 75000, length: 225, beam: 32.3, draft: 14.3, status: "at_sea", fleetId: 2, currentLat: -5.8, currentLon: 106.8, currentSpeed: 11.5, currentHeading: 165, lastPort: "Hay Point", nextPort: "Tanjung Priok", eta: "2026-03-30", fuelConsumptionDaily: 35, co2EmissionsDaily: 109, ciiRating: "B", hullCondition: 83, engineHealth: 86, maintenanceScore: 81, tce: 14200, utilization: 89, eexi: 8.9 },
  { id: 10, name: "MV Crimson Tide", imo: "9876552", mmsi: "311000010", vesselType: "tanker", flag: "Bahamas", yearBuilt: 2013, grossTonnage: 62000, deadweight: 110000, length: 250, beam: 44, draft: 15.2, status: "maintenance", fleetId: 1, currentLat: 50.9, currentLon: -1.4, currentSpeed: 0, currentHeading: 0, lastPort: "Southampton", nextPort: "Southampton", eta: "2026-04-15", fuelConsumptionDaily: 0, co2EmissionsDaily: 0, ciiRating: "D", hullCondition: 62, engineHealth: 58, maintenanceScore: 55, tce: 0, utilization: 45, eexi: 14.2 },
  { id: 11, name: "MV Indigo Horizon", imo: "9876553", mmsi: "311000011", vesselType: "container", flag: "Denmark", yearBuilt: 2023, grossTonnage: 140000, deadweight: 170000, length: 400, beam: 58.6, draft: 16.5, status: "at_sea", fleetId: 2, currentLat: 1.3, currentLon: 103.8, currentSpeed: 22.3, currentHeading: 350, lastPort: "Singapore", nextPort: "Busan", eta: "2026-04-01", fuelConsumptionDaily: 250, co2EmissionsDaily: 777, ciiRating: "A", hullCondition: 99, engineHealth: 99, maintenanceScore: 98, tce: 32100, utilization: 98, eexi: 5.5 },
  { id: 12, name: "MV Cape Falcon", imo: "9876554", mmsi: "311000012", vesselType: "bulk", flag: "South Africa", yearBuilt: 2016, grossTonnage: 45000, deadweight: 85000, length: 229, beam: 32.3, draft: 14.4, status: "at_sea", fleetId: 1, currentLat: -33.9, currentLon: 18.4, currentSpeed: 13.4, currentHeading: 210, lastPort: "Durban", nextPort: "Santos", eta: "2026-04-08", fuelConsumptionDaily: 40, co2EmissionsDaily: 124, ciiRating: "B", hullCondition: 85, engineHealth: 88, maintenanceScore: 83, tce: 16400, utilization: 90, eexi: 8.5 },
  { id: 13, name: "MV Emerald Strait", imo: "9876555", mmsi: "311000013", vesselType: "container", flag: "United Kingdom", yearBuilt: 2020, grossTonnage: 72000, deadweight: 85000, length: 300, beam: 42, draft: 13.8, status: "at_sea", fleetId: 3, currentLat: 35.9, currentLon: -5.3, currentSpeed: 16.8, currentHeading: 90, lastPort: "Algeciras", nextPort: "Genoa", eta: "2026-03-29", fuelConsumptionDaily: 145, co2EmissionsDaily: 451, ciiRating: "B", hullCondition: 93, engineHealth: 91, maintenanceScore: 92, tce: 22300, utilization: 93, eexi: 7.4 },
  { id: 14, name: "MV Silver Albatross", imo: "9876556", mmsi: "311000014", vesselType: "cargo", flag: "Japan", yearBuilt: 2018, grossTonnage: 28000, deadweight: 34000, length: 180, beam: 28, draft: 10.5, status: "in_port", fleetId: 2, currentLat: 35.45, currentLon: 139.64, currentSpeed: 0, currentHeading: 0, lastPort: "Yokohama", nextPort: "Kobe", eta: "2026-03-28", fuelConsumptionDaily: 0, co2EmissionsDaily: 0, ciiRating: "A", hullCondition: 90, engineHealth: 94, maintenanceScore: 91, tce: 11800, utilization: 86, eexi: 6.1 },
  { id: 15, name: "MV Amazon Breeze", imo: "9876557", mmsi: "311000015", vesselType: "bulk", flag: "Brazil", yearBuilt: 2019, grossTonnage: 52000, deadweight: 95000, length: 240, beam: 38, draft: 15, status: "at_sea", fleetId: 1, currentLat: -2.5, currentLon: -44.3, currentSpeed: 10.8, currentHeading: 30, lastPort: "São Luís", nextPort: "Hamburg", eta: "2026-04-12", fuelConsumptionDaily: 42, co2EmissionsDaily: 131, ciiRating: "B", hullCondition: 88, engineHealth: 90, maintenanceScore: 87, tce: 17600, utilization: 92, eexi: 7.9 },
  { id: 16, name: "MV Polar Star", imo: "9876558", mmsi: "311000016", vesselType: "cargo", flag: "Canada", yearBuilt: 2021, grossTonnage: 32000, deadweight: 38000, length: 190, beam: 29, draft: 11, status: "at_sea", fleetId: 1, currentLat: 64.1, currentLon: -21.9, currentSpeed: 14.2, currentHeading: 135, lastPort: "Reykjavik", nextPort: "Liverpool", eta: "2026-03-30", fuelConsumptionDaily: 30, co2EmissionsDaily: 93, ciiRating: "A", hullCondition: 96, engineHealth: 95, maintenanceScore: 94, tce: 13500, utilization: 87, eexi: 5.9 },
  { id: 17, name: "MV Jade Dragon", imo: "9876559", mmsi: "311000017", vesselType: "container", flag: "China", yearBuilt: 2022, grossTonnage: 110000, deadweight: 130000, length: 350, beam: 51, draft: 15.8, status: "at_sea", fleetId: 2, currentLat: 15.4, currentLon: 120.6, currentSpeed: 19.5, currentHeading: 180, lastPort: "Kaohsiung", nextPort: "Port Klang", eta: "2026-04-03", fuelConsumptionDaily: 210, co2EmissionsDaily: 653, ciiRating: "B", hullCondition: 97, engineHealth: 96, maintenanceScore: 95, tce: 26800, utilization: 95, eexi: 6.8 },
  { id: 18, name: "MV Sunset Carrier", imo: "9876560", mmsi: "311000018", vesselType: "tanker", flag: "Malta", yearBuilt: 2015, grossTonnage: 75000, deadweight: 130000, length: 264, beam: 46, draft: 16, status: "at_sea", fleetId: 3, currentLat: 37.0, currentLon: 15.3, currentSpeed: 12.9, currentHeading: 270, lastPort: "Augusta", nextPort: "Cartagena", eta: "2026-03-31", fuelConsumptionDaily: 55, co2EmissionsDaily: 171, ciiRating: "C", hullCondition: 76, engineHealth: 80, maintenanceScore: 74, tce: 22100, utilization: 83, eexi: 10.8 },
];

const maintenanceLogs: MaintenanceLog[] = [
  { id: 1, vesselId: 10, vesselName: "MV Crimson Tide", component: "Main Engine - Cylinder 3", type: "Overhaul", status: "In Progress", severity: "Critical", scheduledDate: "2026-03-20", description: "Complete cylinder liner replacement and piston ring renewal due to excessive wear", estimatedHours: 120, cost: 285000 },
  { id: 2, vesselId: 7, vesselName: "MV Sahara Wind", component: "Ballast Water Treatment System", type: "Repair", status: "Scheduled", severity: "High", scheduledDate: "2026-04-01", description: "UV reactor chamber replacement - failing to meet IMO D-2 discharge standards", estimatedHours: 48, cost: 95000 },
  { id: 3, vesselId: 4, vesselName: "MV Gulf Trader", component: "Hull Coating", type: "Scheduled", status: "Overdue", severity: "Medium", scheduledDate: "2026-03-15", description: "Anti-fouling paint application due - biofouling observed during underwater inspection", estimatedHours: 72, cost: 180000 },
  { id: 4, vesselId: 18, vesselName: "MV Sunset Carrier", component: "Auxiliary Generator #2", type: "Preventive", status: "Scheduled", severity: "Medium", scheduledDate: "2026-04-05", description: "6000-hour service interval - fuel injector and turbocharger inspection", estimatedHours: 24, cost: 35000 },
  { id: 5, vesselId: 1, vesselName: "MV Pacific Voyager", component: "Crane #4 - Port Side", type: "Repair", status: "Completed", severity: "Low", scheduledDate: "2026-03-10", description: "Hydraulic hose replacement and load test certification renewal", estimatedHours: 8, cost: 4500 },
  { id: 6, vesselId: 9, vesselName: "MV Coral Reef", component: "Propeller Shaft Bearing", type: "Inspection", status: "Scheduled", severity: "High", scheduledDate: "2026-04-08", description: "Vibration analysis indicates potential bearing wear - requires docking inspection", estimatedHours: 36, cost: 120000 },
  { id: 7, vesselId: 2, vesselName: "MV Atlantic Guardian", component: "Cargo Pump #1", type: "Preventive", status: "Completed", severity: "Low", scheduledDate: "2026-03-05", description: "Routine pump performance test and seal inspection", estimatedHours: 6, cost: 3200 },
  { id: 8, vesselId: 12, vesselName: "MV Cape Falcon", component: "Navigation Radar", type: "Calibration", status: "Scheduled", severity: "Medium", scheduledDate: "2026-04-02", description: "Annual radar performance check and ARPA calibration per SOLAS requirements", estimatedHours: 4, cost: 8500 },
  { id: 9, vesselId: 6, vesselName: "MV Dragon Pearl", component: "Scrubber System", type: "Maintenance", status: "In Progress", severity: "High", scheduledDate: "2026-03-25", description: "Scrubber wash water pH sensor replacement and calibration", estimatedHours: 12, cost: 22000 },
  { id: 10, vesselId: 15, vesselName: "MV Amazon Breeze", component: "Steering Gear", type: "Inspection", status: "Completed", severity: "Medium", scheduledDate: "2026-03-18", description: "Annual steering gear test and hydraulic system pressure check", estimatedHours: 3, cost: 2100 },
  { id: 11, vesselId: 10, vesselName: "MV Crimson Tide", component: "Boiler System", type: "Repair", status: "In Progress", severity: "Critical", scheduledDate: "2026-03-22", description: "Steam drum tube leak repair - water side corrosion identified", estimatedHours: 96, cost: 195000 },
  { id: 12, vesselId: 13, vesselName: "MV Emerald Strait", component: "Reefer Container Plugs", type: "Preventive", status: "Scheduled", severity: "Low", scheduledDate: "2026-04-10", description: "Inspection of reefer power supply connections and monitoring system", estimatedHours: 16, cost: 6800 },
];

const complianceCertificates: ComplianceCertificate[] = [
  { id: 1, vesselId: 10, vesselName: "MV Crimson Tide", certificateType: "Safety Management Certificate (SMC)", issuer: "Lloyd's Register", issuedDate: "2022-06-15", expiryDate: "2026-04-10", status: "Expiring Soon", daysUntilExpiry: 15 },
  { id: 2, vesselId: 7, vesselName: "MV Sahara Wind", certificateType: "International Oil Pollution Prevention (IOPP)", issuer: "Bureau Veritas", issuedDate: "2021-09-01", expiryDate: "2026-09-01", status: "Valid", daysUntilExpiry: 159 },
  { id: 3, vesselId: 4, vesselName: "MV Gulf Trader", certificateType: "ISM Document of Compliance", issuer: "DNV", issuedDate: "2023-01-15", expiryDate: "2026-05-15", status: "Expiring Soon", daysUntilExpiry: 50 },
  { id: 4, vesselId: 1, vesselName: "MV Pacific Voyager", certificateType: "SOLAS Safety Equipment Certificate", issuer: "ABS", issuedDate: "2023-03-20", expiryDate: "2028-03-20", status: "Valid", daysUntilExpiry: 724 },
  { id: 5, vesselId: 2, vesselName: "MV Atlantic Guardian", certificateType: "International Tonnage Certificate", issuer: "Lloyd's Register", issuedDate: "2016-05-10", expiryDate: "2031-05-10", status: "Valid", daysUntilExpiry: 1871 },
  { id: 6, vesselId: 18, vesselName: "MV Sunset Carrier", certificateType: "MARPOL Annex VI IAPP Certificate", issuer: "RINA", issuedDate: "2022-11-01", expiryDate: "2026-03-30", status: "Expiring Soon", daysUntilExpiry: 4 },
  { id: 7, vesselId: 6, vesselName: "MV Dragon Pearl", certificateType: "Ballast Water Management Certificate", issuer: "ClassNK", issuedDate: "2024-01-15", expiryDate: "2029-01-15", status: "Valid", daysUntilExpiry: 1026 },
  { id: 8, vesselId: 10, vesselName: "MV Crimson Tide", certificateType: "Class Certificate", issuer: "Lloyd's Register", issuedDate: "2021-03-01", expiryDate: "2026-03-28", status: "Expired", daysUntilExpiry: -2 },
  { id: 9, vesselId: 9, vesselName: "MV Coral Reef", certificateType: "International Load Line Certificate", issuer: "Bureau Veritas", issuedDate: "2022-07-20", expiryDate: "2027-07-20", status: "Valid", daysUntilExpiry: 481 },
  { id: 10, vesselId: 12, vesselName: "MV Cape Falcon", certificateType: "Cargo Ship Safety Construction Certificate", issuer: "DNV", issuedDate: "2023-06-01", expiryDate: "2026-06-01", status: "Valid", daysUntilExpiry: 67 },
  { id: 11, vesselId: 15, vesselName: "MV Amazon Breeze", certificateType: "CII Rating Certificate", issuer: "Lloyd's Register", issuedDate: "2025-01-01", expiryDate: "2026-12-31", status: "Valid", daysUntilExpiry: 280 },
  { id: 12, vesselId: 11, vesselName: "MV Indigo Horizon", certificateType: "EEDI Technical File", issuer: "DNV", issuedDate: "2023-06-15", expiryDate: "2028-06-15", status: "Valid", daysUntilExpiry: 812 },
];

const portStateDeficiencies: PortStateDeficiency[] = [
  { id: 1, vesselId: 10, vesselName: "MV Crimson Tide", port: "Southampton", inspectionDate: "2026-03-01", deficiencyCode: "0130", description: "Fire detection system - smoke detector in engine room inoperative", severity: "High", status: "Open", rectifiedDate: null },
  { id: 2, vesselId: 7, vesselName: "MV Sahara Wind", port: "Fujairah", inspectionDate: "2026-02-15", deficiencyCode: "0740", description: "MARPOL Annex I - oil water separator discharge exceeds 15 ppm limit", severity: "High", status: "Rectified", rectifiedDate: "2026-02-20" },
  { id: 3, vesselId: 4, vesselName: "MV Gulf Trader", port: "Mumbai", inspectionDate: "2026-03-10", deficiencyCode: "0610", description: "Lifesaving appliances - lifeboat release mechanism requires servicing", severity: "Medium", status: "Open", rectifiedDate: null },
  { id: 4, vesselId: 18, vesselName: "MV Sunset Carrier", port: "Algeciras", inspectionDate: "2026-01-20", deficiencyCode: "0950", description: "Working conditions - crew rest hour records incomplete for two officers", severity: "Low", status: "Rectified", rectifiedDate: "2026-01-25" },
  { id: 5, vesselId: 9, vesselName: "MV Coral Reef", port: "Tanjung Priok", inspectionDate: "2026-03-05", deficiencyCode: "0430", description: "Navigation equipment - ECDIS backup arrangement not compliant", severity: "Medium", status: "Open", rectifiedDate: null },
];

const shipmentRecords: ShipmentRecord[] = [
  { id: 1, vesselId: 1, vesselName: "MV Pacific Voyager", shipmentId: "SHP-2026-0451", origin: "Los Angeles", destination: "Yokohama", cargoType: "Consumer Electronics", weight: 42000, status: "In Transit", departureDate: "2026-03-20", eta: "2026-04-02", actualArrival: null, onTimeScore: 95, customerSatisfaction: 4.7, demurrageRisk: "Low" },
  { id: 2, vesselId: 2, vesselName: "MV Atlantic Guardian", shipmentId: "SHP-2026-0452", origin: "Houston", destination: "Rotterdam", cargoType: "Crude Oil", weight: 150000, status: "In Transit", departureDate: "2026-03-18", eta: "2026-04-05", actualArrival: null, onTimeScore: 92, customerSatisfaction: 4.5, demurrageRisk: "Medium" },
  { id: 3, vesselId: 6, vesselName: "MV Dragon Pearl", shipmentId: "SHP-2026-0453", origin: "Shanghai", destination: "Singapore", cargoType: "Mixed Containers", weight: 85000, status: "In Transit", departureDate: "2026-03-24", eta: "2026-03-31", actualArrival: null, onTimeScore: 98, customerSatisfaction: 4.9, demurrageRisk: "Low" },
  { id: 4, vesselId: 4, vesselName: "MV Gulf Trader", shipmentId: "SHP-2026-0448", origin: "Jebel Ali", destination: "Mumbai", cargoType: "Iron Ore", weight: 78000, status: "In Transit", departureDate: "2026-03-22", eta: "2026-03-29", actualArrival: null, onTimeScore: 88, customerSatisfaction: 4.2, demurrageRisk: "Medium" },
  { id: 5, vesselId: 13, vesselName: "MV Emerald Strait", shipmentId: "SHP-2026-0449", origin: "Algeciras", destination: "Genoa", cargoType: "Automotive Parts", weight: 32000, status: "In Transit", departureDate: "2026-03-25", eta: "2026-03-29", actualArrival: null, onTimeScore: 97, customerSatisfaction: 4.8, demurrageRisk: "Low" },
  { id: 6, vesselId: 15, vesselName: "MV Amazon Breeze", shipmentId: "SHP-2026-0445", origin: "São Luís", destination: "Hamburg", cargoType: "Soybeans", weight: 90000, status: "In Transit", departureDate: "2026-03-15", eta: "2026-04-12", actualArrival: null, onTimeScore: 85, customerSatisfaction: 4.1, demurrageRisk: "High" },
  { id: 7, vesselId: 12, vesselName: "MV Cape Falcon", shipmentId: "SHP-2026-0440", origin: "Durban", destination: "Santos", cargoType: "Coal", weight: 82000, status: "In Transit", departureDate: "2026-03-20", eta: "2026-04-08", actualArrival: null, onTimeScore: 90, customerSatisfaction: 4.3, demurrageRisk: "Medium" },
  { id: 8, vesselId: 11, vesselName: "MV Indigo Horizon", shipmentId: "SHP-2026-0455", origin: "Singapore", destination: "Busan", cargoType: "Machinery", weight: 95000, status: "In Transit", departureDate: "2026-03-25", eta: "2026-04-01", actualArrival: null, onTimeScore: 99, customerSatisfaction: 4.9, demurrageRisk: "Low" },
  { id: 9, vesselId: 17, vesselName: "MV Jade Dragon", shipmentId: "SHP-2026-0456", origin: "Kaohsiung", destination: "Port Klang", cargoType: "Textiles", weight: 65000, status: "In Transit", departureDate: "2026-03-24", eta: "2026-04-03", actualArrival: null, onTimeScore: 93, customerSatisfaction: 4.6, demurrageRisk: "Low" },
  { id: 10, vesselId: 5, vesselName: "MV Nordic Explorer", shipmentId: "SHP-2026-0443", origin: "Bergen", destination: "Felixstowe", cargoType: "Seafood Products", weight: 15000, status: "In Transit", departureDate: "2026-03-26", eta: "2026-03-28", actualArrival: null, onTimeScore: 96, customerSatisfaction: 4.8, demurrageRisk: "Low" },
];

const eventLogs: EventLog[] = [
  { id: 1, timestamp: "2026-03-26T14:32:18Z", vesselId: 10, vesselName: "MV Crimson Tide", severity: "Critical", category: "Engine", message: "Main engine cylinder 3 temperature exceeding safe limits", details: "Exhaust gas temperature reading 520°C, normal range 380-450°C. Auto-shutdown protocol initiated. Maintenance team on standby.", source: "Engine Room Monitoring System" },
  { id: 2, timestamp: "2026-03-26T14:28:05Z", vesselId: 6, vesselName: "MV Dragon Pearl", severity: "Warning", category: "Emissions", message: "Scrubber wash water pH below threshold", details: "pH reading 5.8, minimum threshold 6.0. Dosing pump rate increased automatically. Monitoring for compliance restoration.", source: "Scrubber Control System" },
  { id: 3, timestamp: "2026-03-26T14:15:42Z", vesselId: 1, vesselName: "MV Pacific Voyager", severity: "Info", category: "Navigation", message: "Vessel entered Japanese EEZ boundary", details: "Position: 34.05°N, 152.30°W. Speed: 18.2 knots. Heading: 275°. Estimated arrival Yokohama in 7 days.", source: "AIS/Navigation System" },
  { id: 4, timestamp: "2026-03-26T14:10:33Z", vesselId: 2, vesselName: "MV Atlantic Guardian", severity: "Info", category: "Cargo", message: "Cargo tank ullage levels verified", details: "All 14 cargo tanks within normal parameters. Total cargo volume: 148,500 m³. No leaks detected.", source: "Cargo Management System" },
  { id: 5, timestamp: "2026-03-26T13:58:20Z", vesselId: 4, vesselName: "MV Gulf Trader", severity: "Warning", category: "Weather", message: "Heavy weather warning - approaching monsoon system", details: "Wind speed forecast: 45-55 knots. Wave height: 4-6m. Recommended speed reduction and course alteration. Current position: 12.85°N, 55.30°E.", source: "Weather Routing Service" },
  { id: 6, timestamp: "2026-03-26T13:45:11Z", vesselId: 7, vesselName: "MV Sahara Wind", severity: "Warning", category: "Security", message: "Vessel approaching high-risk area - Gulf of Aden transit", details: "BMP5 procedures activated. SSAS armed. Citadel readiness confirmed. Armed security team briefed. ETA transit: 2026-04-02.", source: "Security Management System" },
  { id: 7, timestamp: "2026-03-26T13:30:00Z", vesselId: 11, vesselName: "MV Indigo Horizon", severity: "Info", category: "Performance", message: "Daily fuel consumption report generated", details: "HFO: 210 MT, MDO: 8 MT. Average speed: 22.3 knots. Slip: 2.1%. Weather factor: 1.05. CII on target.", source: "Noon Report System" },
  { id: 8, timestamp: "2026-03-26T13:22:45Z", vesselId: 9, vesselName: "MV Coral Reef", severity: "Warning", category: "Mechanical", message: "Propeller shaft vibration levels elevated", details: "Vibration reading: 4.2 mm/s (threshold: 4.5 mm/s). Bearing temperature: 62°C. Monitoring frequency increased to every 15 minutes.", source: "Condition Monitoring System" },
  { id: 9, timestamp: "2026-03-26T13:15:30Z", vesselId: 15, vesselName: "MV Amazon Breeze", severity: "Info", category: "Compliance", message: "Ballast water exchange completed", details: "Tanks 1-6 exchanged in open ocean (>200nm from shore, depth >200m). Volume: 24,000 m³. Salinity verified at 35 PSU.", source: "Ballast Water Management System" },
  { id: 10, timestamp: "2026-03-26T12:55:18Z", vesselId: 18, vesselName: "MV Sunset Carrier", severity: "Critical", category: "Compliance", message: "IAPP Certificate expiring in 4 days", details: "MARPOL Annex VI IAPP Certificate expires 2026-03-30. Vessel must complete renewal survey before expiry. Nearest surveyor available at Cartagena.", source: "Certificate Management System" },
  { id: 11, timestamp: "2026-03-26T12:40:05Z", vesselId: 13, vesselName: "MV Emerald Strait", severity: "Debug", category: "System", message: "ECDIS chart update package received", details: "Week 13/2026 chart corrections applied. 847 corrections processed. All charts updated successfully. Next update: Week 14/2026.", source: "ECDIS System" },
  { id: 12, timestamp: "2026-03-26T12:30:00Z", vesselId: 16, vesselName: "MV Polar Star", severity: "Info", category: "Navigation", message: "Ice chart advisory received for North Atlantic", details: "Icebergs reported south of 48°N between 43°W and 49°W. Course adjusted 15° south to maintain safe distance. No impact on ETA.", source: "Ice Navigation Service" },
  { id: 13, timestamp: "2026-03-26T12:15:22Z", vesselId: 10, vesselName: "MV Crimson Tide", severity: "Critical", category: "Safety", message: "Enclosed space entry permit expired during maintenance", details: "Permit for engine room lower platform expired at 12:00. Atmosphere last tested at 09:00. O2: 20.8%, LEL: 0%. Personnel evacuated per SMS procedure.", source: "Permit to Work System" },
  { id: 14, timestamp: "2026-03-26T11:50:10Z", vesselId: 17, vesselName: "MV Jade Dragon", severity: "Debug", category: "System", message: "Satellite communication bandwidth optimized", details: "VSAT link stabilized at 4.2 Mbps download / 1.8 Mbps upload. Latency: 580ms. Ku-band primary, C-band backup active.", source: "Communication System" },
  { id: 15, timestamp: "2026-03-26T11:35:45Z", vesselId: 5, vesselName: "MV Nordic Explorer", severity: "Info", category: "Environmental", message: "Emission monitoring report - within IMO limits", details: "SOx: 0.42% m/m (limit: 0.50%). NOx: 12.4 g/kWh (Tier II compliant). PM: 0.08 g/kWh. Using 0.5% VLSFO.", source: "Continuous Emission Monitoring System" },
  { id: 16, timestamp: "2026-03-26T11:20:00Z", vesselId: 12, vesselName: "MV Cape Falcon", severity: "Warning", category: "Cargo", message: "Hold #3 bilge alarm activated", details: "Water ingress detected in cargo hold #3. Bilge well level: 0.4m. Sounding pipe readings stable. Bilge pump started. Investigating source.", source: "Bilge Alarm System" },
  { id: 17, timestamp: "2026-03-26T11:05:30Z", vesselId: 3, vesselName: "MV Mediterranean Star", severity: "Info", category: "Port", message: "Berth allocation confirmed for Alexandria", details: "Berth 7, Container Terminal 2. ETA: March 30, 0600 LT. Pilot boarding: 31°12'N, 029°52'E. Tugs: 2x required.", source: "Port Agent System" },
  { id: 18, timestamp: "2026-03-26T10:45:15Z", vesselId: 8, vesselName: "MV Baltic Queen", severity: "Debug", category: "System", message: "Passenger Wi-Fi system firmware updated", details: "Access point firmware updated to v4.2.1 across all decks. 342 APs updated. Service interruption: 3 minutes. All APs operational.", source: "IT Management System" },
  { id: 19, timestamp: "2026-03-26T10:30:00Z", vesselId: 14, vesselName: "MV Silver Albatross", severity: "Info", category: "Crew", message: "Crew change completed at Yokohama", details: "8 crew signed off, 8 crew signed on. All documentation verified. Medical certificates valid. STCW compliance confirmed.", source: "Crew Management System" },
  { id: 20, timestamp: "2026-03-26T10:15:42Z", vesselId: 10, vesselName: "MV Crimson Tide", severity: "Critical", category: "Safety", message: "Class survey overdue - vessel subject to detention risk", details: "Annual class survey was due 2026-03-15. Lloyd's Register notified. Temporary class suspension may apply if not completed by 2026-04-15.", source: "Classification Society Portal" },
];

const emissionRecords: EmissionRecord[] = [];
const months = ["2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
vessels.forEach(v => {
  months.forEach((month, idx) => {
    const seasonalFactor = 1 + 0.1 * Math.sin((idx / 12) * Math.PI * 2);
    const baseFuel = v.fuelConsumptionDaily > 0 ? v.fuelConsumptionDaily * 30 * seasonalFactor : (v.deadweight / 50) * seasonalFactor;
    const fuel = Math.round(baseFuel * (0.9 + Math.random() * 0.2));
    const co2 = Math.round(fuel * 3.114);
    const distance = Math.round(v.currentSpeed > 0 ? v.currentSpeed * 24 * 30 * (0.85 + Math.random() * 0.3) : 4000 + Math.random() * 3000);
    const cargo = Math.round(v.deadweight * (0.7 + Math.random() * 0.25));
    const ratings = ["A", "B", "C", "D", "E"];
    const ciiBase = v.ciiRating === "A" ? 0 : v.ciiRating === "B" ? 1 : v.ciiRating === "C" ? 2 : v.ciiRating === "D" ? 3 : 4;
    const ciiVariation = Math.random() > 0.8 ? 1 : 0;
    const ciiIdx = Math.min(4, Math.max(0, ciiBase + ciiVariation - (Math.random() > 0.7 ? 1 : 0)));
    emissionRecords.push({
      vesselId: v.id,
      vesselName: v.name,
      month,
      fuelConsumed: fuel,
      fuelType: v.vesselType === "tanker" ? "VLSFO" : v.vesselType === "passenger" ? "MGO" : "VLSFO",
      co2Emissions: co2,
      sox: Math.round(fuel * 0.005 * 10) / 10,
      nox: Math.round(fuel * 0.15 * 10) / 10,
      pm: Math.round(fuel * 0.001 * 100) / 100,
      ciiScore: Math.round((3 + ciiIdx * 2.5 + Math.random() * 2) * 100) / 100,
      ciiRating: ratings[ciiIdx],
      eeoiValue: Math.round((co2 / (distance * cargo / 1000000)) * 100) / 100,
      distanceTraveled: distance,
      cargoCarried: cargo,
    });
  });
});

const aiBriefings: AIBriefing[] = [
  { id: 1, title: "Fleet Fuel Efficiency Declining", category: "Performance", severity: "Warning", summary: "Fleet-wide fuel efficiency has decreased 4.2% over the past quarter, primarily driven by aging vessels in the Atlantic Fleet.", details: "Analysis of 9-month fuel consumption data shows a consistent upward trend in specific fuel oil consumption (SFOC) for vessels older than 8 years. MV Crimson Tide and MV Sahara Wind are the primary contributors. Hull fouling and engine degradation are the likely root causes. Estimated additional fuel cost: $1.2M per quarter if unaddressed.", confidence: 89, generatedAt: "2026-03-26T14:00:00Z", actionItems: ["Schedule hull cleaning for MV Crimson Tide and MV Sahara Wind", "Implement slow steaming protocol for affected vessels", "Evaluate LNG retrofit feasibility for top 3 emitters"], affectedVessels: ["MV Crimson Tide", "MV Sahara Wind", "MV Sunset Carrier"] },
  { id: 2, title: "Compliance Risk Alert - IMO 2026 Regulations", category: "Compliance", severity: "Critical", summary: "3 vessels are at risk of non-compliance with upcoming IMO 2026 CII thresholds, requiring immediate corrective action plans.", details: "Under tightening CII corridors effective January 2027, MV Crimson Tide (D-rated), MV Sahara Wind (C-rated trending down), and MV Sunset Carrier (C-rated) will likely exceed their reference line values. Corrective action plans must be submitted 6 months before rating period ends. Wind-assisted propulsion and operational speed optimization are recommended interventions.", confidence: 94, generatedAt: "2026-03-26T13:00:00Z", actionItems: ["Submit CII corrective action plans for 3 vessels by June 2026", "Evaluate wind-assisted propulsion retrofit", "Implement dynamic speed optimization across fleet"], affectedVessels: ["MV Crimson Tide", "MV Sahara Wind", "MV Sunset Carrier"] },
  { id: 3, title: "Port Congestion Forecast - Asia-Pacific", category: "Operations", severity: "Info", summary: "Machine learning model predicts 35% increase in port congestion at Singapore and Busan over the next 2 weeks due to seasonal cargo surge.", details: "Historical pattern analysis combined with real-time AIS data shows vessel density increasing around Singapore Strait. Golden Week preparation in East Asia is driving pre-holiday shipment volumes. Recommend adjusting arrival windows for MV Indigo Horizon and MV Jade Dragon to avoid peak congestion periods.", confidence: 82, generatedAt: "2026-03-26T12:00:00Z", actionItems: ["Adjust MV Indigo Horizon arrival to off-peak window", "Pre-arrange berth slots at Busan for MV Jade Dragon", "Monitor VTS advisories for Singapore Strait"], affectedVessels: ["MV Indigo Horizon", "MV Jade Dragon", "MV Dragon Pearl"] },
  { id: 4, title: "Predictive Maintenance - Critical Equipment", category: "Maintenance", severity: "Warning", summary: "AI analysis predicts 73% probability of auxiliary generator failure on MV Coral Reef within 45 days based on vibration trend analysis.", details: "Vibration signature analysis of MV Coral Reef's propeller shaft bearing shows classic pre-failure patterns. Harmonic frequency at 2x and 3x RPM is increasing at 0.3 mm/s per week. If current trend continues, bearing replacement will be required within 30-45 days. Docking at Tanjung Priok presents the most cost-effective repair opportunity.", confidence: 73, generatedAt: "2026-03-26T11:00:00Z", actionItems: ["Schedule emergency docking at Tanjung Priok for MV Coral Reef", "Order replacement bearing assembly (lead time: 14 days)", "Increase vibration monitoring frequency to every 4 hours"], affectedVessels: ["MV Coral Reef"] },
];

const predictiveMaintenanceItems: PredictiveMaintenance[] = [
  { id: 1, vesselId: 9, vesselName: "MV Coral Reef", component: "Propeller Shaft Bearing", failureProbability: 73, predictedFailureDate: "2026-05-10", recommendedAction: "Schedule emergency docking for bearing replacement at next port of call", estimatedCost: 120000, confidence: 73, riskLevel: "High" },
  { id: 2, vesselId: 10, vesselName: "MV Crimson Tide", component: "Main Engine Turbocharger", failureProbability: 62, predictedFailureDate: "2026-06-15", recommendedAction: "Replace turbocharger cartridge during current drydock period", estimatedCost: 85000, confidence: 68, riskLevel: "High" },
  { id: 3, vesselId: 18, vesselName: "MV Sunset Carrier", component: "Cargo Pump Mechanical Seal", failureProbability: 55, predictedFailureDate: "2026-07-20", recommendedAction: "Order spare seals and plan replacement during next cargo discharge", estimatedCost: 12000, confidence: 71, riskLevel: "Medium" },
  { id: 4, vesselId: 7, vesselName: "MV Sahara Wind", component: "Ballast Water UV Reactor", failureProbability: 48, predictedFailureDate: "2026-08-01", recommendedAction: "Replace UV lamp assembly during scheduled BWTS maintenance", estimatedCost: 35000, confidence: 65, riskLevel: "Medium" },
  { id: 5, vesselId: 4, vesselName: "MV Gulf Trader", component: "Auxiliary Boiler Tubes", failureProbability: 41, predictedFailureDate: "2026-09-10", recommendedAction: "Conduct ultrasonic thickness measurement during next port stay", estimatedCost: 55000, confidence: 60, riskLevel: "Medium" },
  { id: 6, vesselId: 12, vesselName: "MV Cape Falcon", component: "Steering Gear Hydraulic Pump", failureProbability: 28, predictedFailureDate: "2026-11-15", recommendedAction: "Replace hydraulic pump seal kit during next scheduled maintenance", estimatedCost: 8000, confidence: 58, riskLevel: "Low" },
];

const forecastModules: ForecastModule[] = [
  { id: 1, title: "Fleet Average TCE", metric: "$/day", currentValue: 21450, forecastValue: 23200, forecastDate: "2026-06-30", confidence: 78, trend: "up", dataPoints: [
    { date: "2025-10", value: 19800 }, { date: "2025-11", value: 20100 }, { date: "2025-12", value: 20500 },
    { date: "2026-01", value: 21000 }, { date: "2026-02", value: 21200 }, { date: "2026-03", value: 21450 },
    { date: "2026-04", value: 21800, forecast: 21800 }, { date: "2026-05", value: 22500, forecast: 22500 }, { date: "2026-06", value: 23200, forecast: 23200 },
  ]},
  { id: 2, title: "Fleet CO2 Intensity", metric: "gCO2/t·nm", currentValue: 8.4, forecastValue: 7.8, forecastDate: "2026-06-30", confidence: 72, trend: "down", dataPoints: [
    { date: "2025-10", value: 9.1 }, { date: "2025-11", value: 8.9 }, { date: "2025-12", value: 8.7 },
    { date: "2026-01", value: 8.6 }, { date: "2026-02", value: 8.5 }, { date: "2026-03", value: 8.4 },
    { date: "2026-04", value: 8.2, forecast: 8.2 }, { date: "2026-05", value: 8.0, forecast: 8.0 }, { date: "2026-06", value: 7.8, forecast: 7.8 },
  ]},
  { id: 3, title: "Fleet Utilization Rate", metric: "%", currentValue: 89.2, forecastValue: 91.5, forecastDate: "2026-06-30", confidence: 85, trend: "up", dataPoints: [
    { date: "2025-10", value: 86.5 }, { date: "2025-11", value: 87.2 }, { date: "2025-12", value: 87.8 },
    { date: "2026-01", value: 88.1 }, { date: "2026-02", value: 88.7 }, { date: "2026-03", value: 89.2 },
    { date: "2026-04", value: 89.8, forecast: 89.8 }, { date: "2026-05", value: 90.5, forecast: 90.5 }, { date: "2026-06", value: 91.5, forecast: 91.5 },
  ]},
  { id: 4, title: "Maintenance Cost Forecast", metric: "$K/quarter", currentValue: 2850, forecastValue: 3200, forecastDate: "2026-06-30", confidence: 68, trend: "up", dataPoints: [
    { date: "2025-10", value: 2400 }, { date: "2025-11", value: 2500 }, { date: "2025-12", value: 2600 },
    { date: "2026-01", value: 2700 }, { date: "2026-02", value: 2780 }, { date: "2026-03", value: 2850 },
    { date: "2026-04", value: 2950, forecast: 2950 }, { date: "2026-05", value: 3080, forecast: 3080 }, { date: "2026-06", value: 3200, forecast: 3200 },
  ]},
];

const sanctionsRiskIndicators = [
  { id: 1, vesselName: "MV Dark Shadow", imo: "9999001", flag: "Unknown", riskLevel: "Critical", reason: "Flagged for STS transfers in sanctioned waters", lastSeen: "2026-03-20", region: "Syrian Coast" },
  { id: 2, vesselName: "MV North Star VII", imo: "9999002", flag: "DPRK", riskLevel: "Critical", reason: "DPRK-flagged vessel engaged in coal transport", lastSeen: "2026-03-18", region: "East China Sea" },
  { id: 3, vesselName: "MV Caspian Dawn", imo: "9999003", flag: "Iran", riskLevel: "High", reason: "Repeated AIS manipulation detected in Persian Gulf", lastSeen: "2026-03-22", region: "Strait of Hormuz" },
];

const complianceAlerts = [
  { id: 1, type: "CII Rating Downgrade Risk", vessel: "MV Crimson Tide", message: "Current D rating may trigger operational restrictions under IMO 2026 framework", severity: "Critical", date: "2026-03-26" },
  { id: 2, type: "BWMS Compliance Gap", vessel: "MV Sahara Wind", message: "Ballast water treatment system failing to meet D-2 standard discharge limits", severity: "High", date: "2026-03-25" },
  { id: 3, type: "Emissions Reporting Deadline", vessel: "Fleet-wide", message: "Annual DCS (Data Collection System) reports due to flag state by March 31", severity: "Warning", date: "2026-03-26" },
  { id: 4, type: "EU ETS Compliance", vessel: "Fleet-wide", message: "Q1 2026 EU ETS allowances submission deadline approaching - April 30", severity: "Info", date: "2026-03-26" },
  { id: 5, type: "Port State Detention Risk", vessel: "MV Crimson Tide", message: "Overdue class survey and open deficiency may result in detention at next port call", severity: "Critical", date: "2026-03-26" },
];

export const mockData = {
  fleets,
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
};
