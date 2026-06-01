import { loadSeedDataSync } from '../lib/seed-loader.js';

export interface VesselProfile {
  id: number;
  name: string;
  imo: string;
  mmsi: string;
  vesselType: string;
  shipClass: string;
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
  ciiValue: number;
  attainedCII: number;
  requiredCII: number;
  hullCondition: number;
  engineHealth: number;
  maintenanceScore: number;
  tce: number;
  utilization: number;
  eexi: number;
  tradeLane: string;
  operator: string;
  classificationSociety: string;
  builder: string;
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
  regulation: string;
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
  mouRegime: string;
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
  severity: 'Critical' | 'Warning' | 'Info' | 'Debug';
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

const fleets = loadSeedDataSync<
  Array<{ id: number; name: string; region: string; status: string; description: string }>
>('vessels/fleets.json', []);

const vessels = loadSeedDataSync<VesselProfile[]>('vessels/vessels.json', []);

const maintenanceLogs = loadSeedDataSync<MaintenanceLog[]>('vessels/maintenance-logs.json', []);

const complianceCertificates = loadSeedDataSync<ComplianceCertificate[]>(
  'vessels/compliance-certificates.json',
  [],
);

const portStateDeficiencies = loadSeedDataSync<PortStateDeficiency[]>(
  'vessels/port-state-deficiencies.json',
  [],
);

const shipmentRecords = loadSeedDataSync<ShipmentRecord[]>('vessels/shipment-records.json', []);

const eventLogs = loadSeedDataSync<EventLog[]>('vessels/event-logs.json', []);

const aiBriefings = loadSeedDataSync<AIBriefing[]>('vessels/ai-briefings.json', []);

const predictiveMaintenanceItems = loadSeedDataSync<PredictiveMaintenance[]>(
  'vessels/predictive-maintenance.json',
  [],
);

const forecastModules = loadSeedDataSync<ForecastModule[]>('vessels/forecast-modules.json', []);

const sanctionsRiskIndicators = [
  {
    id: 1,
    vesselName: 'SHUI SPIRIT',
    imo: '9180281',
    flag: 'Cameroon',
    riskLevel: 'Critical',
    reason:
      'OFAC SDN listed (06/2025) — Identified as part of PRC-linked fleet conducting STS transfers of Iranian crude oil in Gulf of Oman. Previously named SUEZ RAJAN.',
    lastSeen: '2026-03-20',
    region: 'Gulf of Oman',
  },
  {
    id: 2,
    vesselName: 'BILLION STAR 7',
    imo: '9126592',
    flag: 'Palau',
    riskLevel: 'Critical',
    reason:
      'UN Panel of Experts Report S/2026/115 — DPRK-flagged vessel engaged in coal exports violating UNSCR 2397 (2017). AIS dark periods >72 hours detected.',
    lastSeen: '2026-03-18',
    region: 'East China Sea',
  },
  {
    id: 3,
    vesselName: 'ELENA',
    imo: '9187637',
    flag: 'Gabon',
    riskLevel: 'High',
    reason:
      'EU Regulation 2022/879 — Russian oil price cap violation. Transporting Urals crude above $60/bbl ceiling. Previously registered as ASTRA under Marshall Islands flag.',
    lastSeen: '2026-03-22',
    region: 'Laconian Gulf (STS Zone)',
  },
  {
    id: 4,
    vesselName: 'COMET',
    imo: '9215378',
    flag: 'Tanzania',
    riskLevel: 'High',
    reason:
      'OFAC identified — Venezuelan PDVSA crude transport circumventing Executive Order 13884. Repeated flag changes: Liberia → Comoros → Tanzania since 2024.',
    lastSeen: '2026-03-15',
    region: 'Caribbean Sea',
  },
  {
    id: 5,
    vesselName: 'LINDA I',
    imo: '9196454',
    flag: 'Unknown',
    riskLevel: 'Critical',
    reason:
      'OFAC SDN listed — Part of Syrian Arab Republic sanctions network. Identified delivering refined products to Baniyas Terminal. AIS spoofing detected.',
    lastSeen: '2026-03-24',
    region: 'Eastern Mediterranean',
  },
];

const complianceAlerts = [
  {
    id: 1,
    type: 'CII Rating D — Corrective Action Plan Required',
    vessel: 'TORM HELLAS',
    message:
      'Attained CII 9.82 vs required 6.88. MEPC.355(78) requires corrective action plan submission within 60 days of annual rating publication. Operational restrictions may apply per MARPOL Annex VI Reg. 28.',
    severity: 'Critical',
    date: '2026-03-26',
  },
  {
    id: 2,
    type: 'BWMS Non-Compliance — D-2 Standard Failure',
    vessel: 'GALATA BRIDGE',
    message:
      'Alfa Laval PureBallast 3 UV reactor failing to achieve >10 viable organisms per m³ discharge standard per BWM Convention Regulation D-2. Constanta PSC inspection imminent.',
    severity: 'High',
    date: '2026-03-25',
  },
  {
    id: 3,
    type: 'EU MRV / IMO DCS Annual Reporting Deadline',
    vessel: 'Fleet-wide',
    message:
      'Annual Data Collection System reports due to flag states by March 31 per MARPOL Annex VI Reg. 27. EU MRV verified emissions reports due in Thetis-MRV by same date per EU Reg. 2015/757.',
    severity: 'Warning',
    date: '2026-03-26',
  },
  {
    id: 4,
    type: 'EU ETS Maritime — Q1 2026 Allowance Obligation',
    vessel: 'Fleet-wide',
    message:
      'First compliance year under EU ETS maritime extension (Directive 2003/87/EC amended by 2023/959). 40% of 2025 emissions require EUA coverage by September 30, 2026. Estimated fleet exposure: 42,000 EUAs (~€3.57M).',
    severity: 'Warning',
    date: '2026-03-26',
  },
  {
    id: 5,
    type: 'Paris MOU Detention Risk — Class Survey Overdue',
    vessel: 'TORM HELLAS',
    message:
      "Annual Lloyd's Register class survey overdue since 2026-03-15. Vessel flagged in Paris MOU THETIS database as high-priority for inspection. PSC detention probable at next port call.",
    severity: 'Critical',
    date: '2026-03-26',
  },
  {
    id: 6,
    type: 'FuelEU Maritime — GHG Intensity Baseline Year',
    vessel: 'Fleet-wide',
    message:
      '2026 is baseline year for FuelEU Maritime Regulation (EU 2023/1805). Well-to-wake GHG intensity monitoring required. Compliance balance tracking must begin January 2026.',
    severity: 'Info',
    date: '2026-03-26',
  },
  {
    id: 7,
    type: 'IMO Polar Code Compliance — ARCTIC AURORA',
    vessel: 'ARCTIC AURORA',
    message:
      'Polar Ship Certificate valid. Next Polar Waters Operational Assessment due before 2027 Arctic navigation season per MEPC.264(68)/MSC.385(94) Chapter 1.',
    severity: 'Info',
    date: '2026-03-26',
  },
];

const emissionRecords: EmissionRecord[] = [];
const months = [
  '2025-07',
  '2025-08',
  '2025-09',
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
];

function calculateCII(
  co2Tonnes: number,
  dwt: number,
  distanceNm: number,
): { attainedCII: number; rating: string } {
  const attainedCII = distanceNm > 0 && dwt > 0 ? (co2Tonnes * 1000000) / (dwt * distanceNm) : 0;

  let a: number, c: number;
  if (dwt >= 279000) {
    a = 4745;
    c = 0.622;
  } else if (dwt >= 120000) {
    a = 4745;
    c = 0.622;
  } else if (dwt >= 80000) {
    a = 4745;
    c = 0.622;
  } else if (dwt >= 40000) {
    a = 4745;
    c = 0.622;
  } else {
    a = 5247;
    c = 0.61;
  }

  const refCII = a * dwt ** -c;
  const year2026ReductionFactor = 0.89;
  const requiredCII = refCII * year2026ReductionFactor;

  const d1 = requiredCII * 0.86;
  const d2 = requiredCII * 0.94;
  const d3 = requiredCII * 1.06;
  const d4 = requiredCII * 1.18;

  let rating: string;
  if (attainedCII <= d1) rating = 'A';
  else if (attainedCII <= d2) rating = 'B';
  else if (attainedCII <= d3) rating = 'C';
  else if (attainedCII <= d4) rating = 'D';
  else rating = 'E';

  return { attainedCII: Math.round(attainedCII * 100) / 100, rating };
}

vessels.forEach((v) => {
  months.forEach((month, idx) => {
    const seasonalFactor = 1 + 0.1 * Math.sin((idx / 12) * Math.PI * 2);
    const baseFuel =
      v.fuelConsumptionDaily > 0
        ? v.fuelConsumptionDaily * 30 * seasonalFactor
        : (v.deadweight / 50) * seasonalFactor;
    const fuel = Math.round(baseFuel * (0.9 + Math.random() * 0.2));

    let emissionFactor: number;
    const fuelType: string =
      v.vesselType === 'tanker' ? 'VLSFO' : v.shipClass.includes('LNG') ? 'LNG' : 'VLSFO';
    switch (fuelType) {
      case 'LNG':
        emissionFactor = 2.75;
        break;
      case 'MGO':
        emissionFactor = 3.206;
        break;
      case 'HFO':
        emissionFactor = 3.114;
        break;
      default:
        emissionFactor = 3.151;
        break;
    }

    const co2 = Math.round(fuel * emissionFactor);
    const distance = Math.round(
      v.currentSpeed > 0
        ? v.currentSpeed * 24 * 30 * (0.85 + Math.random() * 0.3)
        : 4000 + Math.random() * 3000,
    );
    const cargo = Math.round(v.deadweight * (0.7 + Math.random() * 0.25));

    const { attainedCII, rating } = calculateCII(co2, v.deadweight, distance);

    emissionRecords.push({
      vesselId: v.id,
      vesselName: v.name,
      month,
      fuelConsumed: fuel,
      fuelType,
      co2Emissions: co2,
      sox: Math.round(fuel * (fuelType === 'LNG' ? 0.0001 : 0.005) * 10) / 10,
      nox: Math.round(fuel * (fuelType === 'LNG' ? 0.02 : 0.15) * 10) / 10,
      pm: Math.round(fuel * (fuelType === 'LNG' ? 0.0001 : 0.001) * 100) / 100,
      ciiScore: attainedCII,
      ciiRating: rating,
      eeoiValue: Math.round((co2 / ((distance * cargo) / 1000000)) * 100) / 100,
      distanceTraveled: distance,
      cargoCarried: cargo,
    });
  });
});

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
