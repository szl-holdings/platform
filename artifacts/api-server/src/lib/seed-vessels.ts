import { getRuntimeMode, isSeedDataAllowed } from '@szl-holdings/config';
import {
  db,
  fleetExceptionsTable,
  type InsertFleetException,
  type InsertVesselMaintenance,
  type InsertVesselPortCall,
  type InsertVesselPosition,
  type InsertVesselSanctionsScreening,
  type InsertVesselVoyageEconomics,
  vesselMaintenanceTable,
  vesselPortCallsTable,
  vesselSanctionsScreeningTable,
  vesselsFleetsTable,
  vesselsPositionsTable,
  vesselsPscChecklistItemsTable,
  vesselsPscInspectionsTable,
  vesselsTable,
  vesselVoyageEconomicsTable,
  type InsertVesselsPscChecklistItem,
  type InsertVesselsPscInspection,
} from '@szl-holdings/db';
import { sql } from 'drizzle-orm';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

const VESSEL_NAMES = [
  'MV ATLAS PIONEER',
  'MT PACIFIC GLORY',
  'MV NORDIC STAR',
  'MT OCEAN FORTUNE',
  'MV SILVER HORIZON',
  'MT GOLDEN GATE',
  'MV TITAN VOYAGER',
  'MT BLUE ODYSSEY',
  'MV SEA MERCURY',
  'MT CORAL KING',
  'MV ARCTIC BRIDGE',
  'MT EMERALD WAVE',
  'MV STORM RUNNER',
  'MT IRON GIANT',
  'MV JADE NAVIGATOR',
  'MT SAPPHIRE COAST',
  'MV DELTA PRIDE',
  'MT AURORA BOREALIS',
  'MV HORIZON HAWK',
  'MT CRIMSON TIDE',
  'MV MONSOON SPIRIT',
  'MT PACIFIC EAGLE',
  'MV GOLD PIONEER',
  'MT EAST STAR',
  'MV BERING QUEST',
  'MT CAPE HOPE',
  'MV OCEAN KING',
  'MT STELLAR DAWN',
  'MV TROPICAL BREEZE',
  'MT VIKING SPIRIT',
  'MV MARATHON RUNNER',
  'MT ARCTIC WOLF',
  'MV CAPE VERDE',
  'MT MORNING STAR',
  'MV SOUTH WIND',
  'MT BLACK PEARL',
  'MV CORAL SEA',
  'MT DEEP OCEAN',
  'MV EAGLE POINT',
  'MT FRONTIER SPIRIT',
  'MV GLOBAL REACH',
  'MT HARBOR MASTER',
  'MV INDIA OCEAN',
  'MT JADE EMPRESS',
  'MV KESTREL',
  'MT LIBERTY BELL',
  'MV MARINE EAGLE',
  'MT NAUTILUS PRIME',
  'MV OCEAN GUARDIAN',
  'MT POLAR STAR',
  'MV QUANTUM LEAP',
  'MT RED SEA GLORY',
  'MV SILK ROAD',
  'MT THUNDER BAY',
  'MV UNITED SEA',
] as const;

const FLAGS = [
  'Panama',
  'Liberia',
  'Marshall Islands',
  'Bahamas',
  'Malta',
  'Cyprus',
  'Cayman Islands',
  'Singapore',
  'Greece',
  'Norway',
  'Denmark',
  'United Kingdom',
  'China',
  'Japan',
  'Hong Kong',
  'Antigua and Barbuda',
  'St Kitts and Nevis',
  'Palau',
  'Cook Islands',
];

const VESSEL_TYPES: Array<(typeof vesselsTable.$inferInsert)['vesselType']> = [
  'tanker',
  'tanker',
  'tanker',
  'tanker',
  'tanker',
  'tanker',
  'container',
  'container',
  'container',
  'container',
  'container',
  'bulk',
  'bulk',
  'bulk',
  'bulk',
  'bulk',
  'bulk',
  'cargo',
  'cargo',
  'cargo',
  'passenger',
  'passenger',
  'other',
  'other',
];

const VESSEL_STATUSES: Array<(typeof vesselsTable.$inferInsert)['status']> = [
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'at_sea',
  'in_port',
  'in_port',
  'in_port',
  'in_port',
  'in_port',
  'in_port',
  'in_port',
  'in_port',
  'anchored',
  'anchored',
  'anchored',
  'anchored',
  'anchored',
  'maintenance',
  'maintenance',
  'maintenance',
  'maintenance',
  'active',
  'active',
  'active',
  'active',
];

const DESTINATIONS = [
  'Rotterdam',
  'Singapore',
  'Shanghai',
  'Houston',
  'Yokohama',
  'Dubai',
  'Jebel Ali',
  'Los Angeles',
  'Colombo',
  'Cape Town',
  'Mumbai',
  'Hamburg',
  'Le Havre',
  'Antwerp',
  'Busan',
  'Qingdao',
  'Ningbo',
  'Port Said',
  'Piraeus',
  'Barcelona',
];

const OWNERS = [
  'Oceanic Shipping Corp',
  'Pacific Maritime Holdings',
  'Nordic Tankers AS',
  'Golden Gate Shipping',
  'Atlantic Bulk Carriers',
  'Mediterranean Lines SA',
  'Eastern Pacific Navigation',
  'Global Maritime Partners',
  'Titan Ocean Freight',
  'Blue Ocean Ventures Ltd',
  'Northern Star Maritime',
  'Coral Bay Shipping',
  'Viking Ocean Transport',
  'Emerald Seas Corp',
  'SZL Maritime Holdings',
  'Apex Fleet Management',
];

const MANAGERS = [
  'V.Group',
  'Anglo-Eastern',
  'Stolt-Nielsen',
  'MOL Ship Management',
  'Bernhard Schulte',
  'Thome Group',
  'Fleet Management Ltd',
  'Columbia Shipmanagement',
  'Wilhelmsen Ship Management',
  'Pacific Basin Shipping',
  'Wallem Group',
  'Döhle Seafront Crewing',
  'OSMC Maritime',
];

const PORT_CALL_PORTS = [
  { name: 'Port of Rotterdam', locode: 'NLRTM', country: 'Netherlands' },
  { name: 'Port of Singapore', locode: 'SGSIN', country: 'Singapore' },
  { name: 'Port of Shanghai', locode: 'CNSHA', country: 'China' },
  { name: 'Jebel Ali', locode: 'AEJEA', country: 'UAE' },
  { name: 'Port of Houston', locode: 'USHOU', country: 'USA' },
  { name: 'Colombo Port', locode: 'LKCMB', country: 'Sri Lanka' },
  { name: 'Port of Yokohama', locode: 'JPYOK', country: 'Japan' },
  { name: 'Port of Los Angeles', locode: 'USLAX', country: 'USA' },
  { name: 'Piraeus', locode: 'GRPIR', country: 'Greece' },
  { name: 'Hamburg', locode: 'DEHAM', country: 'Germany' },
  { name: 'Port Said', locode: 'EGPSD', country: 'Egypt' },
  { name: 'Port of Antwerp', locode: 'BEANR', country: 'Belgium' },
  { name: 'Busan', locode: 'KRPUS', country: 'South Korea' },
  { name: 'Mumbai Port', locode: 'INBOM', country: 'India' },
  { name: 'Cape Town', locode: 'ZACPT', country: 'South Africa' },
];

const CARGO_TYPES = [
  'Crude Oil',
  'Refined Products',
  'LNG',
  'LPG',
  'Iron Ore',
  'Coal',
  'Grain',
  'Bauxite',
  'Containers',
  'General Cargo',
  'Steel Products',
  'Fertilizers',
  'Chemical Products',
  'Phosphate',
  'Vehicles',
  'Timber',
];

const ORIGIN_PORTS = [
  'Rotterdam',
  'Singapore',
  'Shanghai',
  'Houston',
  'Yokohama',
  'Dubai',
  'Jebel Ali',
  'Los Angeles',
  'Colombo',
  'Cape Town',
  'Mumbai',
  'Ras Tanura',
  'Sullom Voe',
  'Port Hedland',
  'Gladstone',
  'Dampier',
];

const CHARTER_TYPES: Array<(typeof vesselVoyageEconomicsTable.$inferInsert)['charterType']> = [
  'time_charter',
  'voyage_charter',
  'spot',
];

const VOYAGE_STATUSES: Array<(typeof vesselVoyageEconomicsTable.$inferInsert)['status']> = [
  'at_sea',
  'completed',
  'completed',
  'planned',
];

const PORT_PURPOSES: Array<(typeof vesselPortCallsTable.$inferInsert)['purpose']> = [
  'loading',
  'discharging',
  'bunkering',
  'crew_change',
  'repair',
  'inspection',
  'transit',
];

const CANAL_NAMES = ['Suez Canal', 'Panama Canal', 'Kiel Canal'] as const;

const PORT_AGENTS = [
  'Inchcape Shipping',
  'GAC Group',
  'Wilhelmsen Ships Service',
  'Swire Shipping',
  'Mediterranean Shipping Agency',
];

const MAINTENANCE_COMPONENTS = [
  'Main Engine — Turbocharger',
  'Main Engine — Fuel Injection System',
  'Main Engine — Cylinder Liner',
  'Auxiliary Engine 1',
  'Auxiliary Engine 2',
  'Boiler System',
  'Propeller — Blades Inspection',
  'Propeller Shaft Seals',
  'Bow Thruster',
  'Cargo Pump System',
  'Ballast Water Treatment System',
  'Bilge System',
  'Deckpipes and Manifold',
  'Fire Safety Equipment',
  'Lifesaving Appliances',
  'Navigation Equipment — ECDIS',
  'AIS Transponder',
  'GMDSS Radio',
  'Hull — Underwater Inspection',
  'Hull — Antifouling Coating',
  'Hull — Structural Survey',
  'Electrical System — Switchboard',
  'Air Conditioning System',
  'Fresh Water Generator',
  'Crane and Lifting Gear',
  'Anchoring Equipment',
  'Mooring Equipment',
];

const MAINTENANCE_TYPES: Array<(typeof vesselMaintenanceTable.$inferInsert)['maintenanceType']> = [
  'preventive',
  'corrective',
  'scheduled',
  'predictive',
];

const MAINTENANCE_PRIORITIES: Array<(typeof vesselMaintenanceTable.$inferInsert)['priority']> = [
  'critical',
  'high',
  'medium',
  'low',
];

const _MAINTENANCE_STATUSES: Array<(typeof vesselMaintenanceTable.$inferInsert)['status']> = [
  'overdue',
  'due_soon',
  'scheduled',
  'in_progress',
  'completed',
];

const MAINTENANCE_TECHNICIANS = [
  'Chief Engineer',
  '2nd Engineer',
  '3rd Engineer',
  'Electrical Officer',
  'Contractor',
];

const OWNER_FUNCTIONS = ['Fleet Operations', 'Compliance', 'Commercial', 'Technical'] as const;

type OfacStatus = (typeof vesselSanctionsScreeningTable.$inferInsert)['ofacStatus'];
type PscResult = (typeof vesselSanctionsScreeningTable.$inferInsert)['pscResult'];

function seeded(id: number, offset: number, range: number): number {
  const h = ((id * 2654435761 + offset * 40503) >>> 0) % 1000;
  return (h / 1000) * range;
}

function pick<T>(arr: readonly T[], id: number, offset = 0): T {
  return arr[Math.floor(seeded(id, offset, arr.length))];
}

const EXCEPTION_TEMPLATES: Array<{
  exceptionType: InsertFleetException['exceptionType'];
  severity: InsertFleetException['severity'];
  titleFn: (name: string) => string;
  descFn: (name: string) => string;
  whyItMatters: string;
  recommendedResponse: string;
  estimatedImpactUsd: number;
}> = [
  {
    exceptionType: 'ais_dark',
    severity: 'critical',
    titleFn: (name) => `${name} — AIS Signal Lost for 14h+`,
    descFn: (name) =>
      `Vessel ${name} last transmitted AIS position 14 hours ago at Strait of Hormuz. No satellite or terrestrial AIS reception.`,
    whyItMatters:
      'Dark vessel events in high-risk zones suggest possible identity manipulation, sanctions evasion activity, or ship-to-ship transfer.',
    recommendedResponse:
      'Cross-reference with satellite imagery, contact charterer for vessel welfare, initiate behavioral risk review.',
    estimatedImpactUsd: 850000,
  },
  {
    exceptionType: 'route_deviation',
    severity: 'high',
    titleFn: (name) => `${name} — Significant Route Deviation Detected`,
    descFn: (name) =>
      `${name} is 47nm off planned course, heading toward restricted waters near Iranian territorial limit.`,
    whyItMatters:
      'Unauthorized route deviation near sanctioned territory creates compliance exposure and insurance voidance risk.',
    recommendedResponse:
      'Contact master for explanation. If unresponsive, initiate emergency contact protocol and alert P&I club.',
    estimatedImpactUsd: 420000,
  },
  {
    exceptionType: 'sanctions_match',
    severity: 'critical',
    titleFn: (name) => `${name} — OFAC SDN List Partial Match`,
    descFn: (name) =>
      `Beneficial ownership screening for ${name} returned 87% confidence match against OFAC SDN list entity "Kish Shipping Ltd."`,
    whyItMatters:
      'Direct OFAC sanctions breach could result in civil penalties of $1M+ per violation and criminal prosecution.',
    recommendedResponse:
      'Suspend commercial engagement. Escalate to legal and compliance immediately. Do not make or receive payments.',
    estimatedImpactUsd: 2400000,
  },
  {
    exceptionType: 'delay_risk',
    severity: 'high',
    titleFn: (name) => `${name} — Overdue Arrival at Destination Port`,
    descFn: (name) =>
      `${name} is 28 hours overdue at Rotterdam. Last confirmed position 19h ago near Dogger Bank.`,
    whyItMatters:
      'Overdue arrival triggers demurrage claims at $38K/day and may indicate mechanical or weather emergency.',
    recommendedResponse:
      'Attempt contact via Inmarsat C and satellite phone. Alert port agent and terminal of delay. Check weather NAVTEX.',
    estimatedImpactUsd: 180000,
  },
  {
    exceptionType: 'port_congestion',
    severity: 'watch',
    titleFn: (name) => `${name} — Extended Anchorage at Shanghai — 6+ Days`,
    descFn: (name) =>
      `${name} has been at anchor outside Shanghai waiting for berth for 6.3 days, exceeding 4-day demurrage-free period.`,
    whyItMatters:
      'Each additional day costs $52K in demurrage and fuel at anchor. Delays downstream cargo commitments.',
    recommendedResponse:
      'Negotiate alternative berth or transship to feeder. Apply force majeure clause if eligible.',
    estimatedImpactUsd: 320000,
  },
  {
    exceptionType: 'weather_disruption',
    severity: 'high',
    titleFn: (name) => `${name} — Severe Weather Shelter — Cape of Good Hope`,
    descFn: (name) =>
      `${name} has hove-to for weather at 40°S, 20°E due to Sea State 8 (Beaufort). ETA drifting +36h.`,
    whyItMatters:
      'Extended weather delay in Southern Ocean adds $78K in costs and risks cargo condition compliance.',
    recommendedResponse:
      'Monitor GRIB weather files. Advise charterer of force majeure. Assess deviation to sheltered anchorage.',
    estimatedImpactUsd: 95000,
  },
  {
    exceptionType: 'maintenance_risk',
    severity: 'high',
    titleFn: (name) => `${name} — Main Engine Overload Alert`,
    descFn: (name) =>
      `Engine room data shows ${name} main engine running at 108% MCR for 14h. Turbocharger surge detected twice.`,
    whyItMatters:
      'Continued overload risks catastrophic engine failure at sea, requiring costly tow and total loss of hire.',
    recommendedResponse:
      'Reduce speed to 85% MCR immediately. Schedule contingency engineering port call at nearest major port.',
    estimatedImpactUsd: 1200000,
  },
  {
    exceptionType: 'fuel_anomaly',
    severity: 'watch',
    titleFn: (name) => `${name} — Fuel Consumption 34% Above Projections`,
    descFn: (name) =>
      `${name} daily fuel consumption is 42 MT/day vs 31.2 MT/day budgeted. Anomaly persists for 8 days.`,
    whyItMatters:
      'At $680/MT bunker prices, 10.8MT daily excess costs $7,344/day, adding $52K to voyage P&L.',
    recommendedResponse:
      'Check hull fouling, propeller pitch, trim optimization. Review engine performance against sea trial data.',
    estimatedImpactUsd: 52000,
  },
  {
    exceptionType: 'inspection_failure',
    severity: 'critical',
    titleFn: (name) => `${name} — Port State Control Detention — Rotterdam`,
    descFn: (name) =>
      `${name} detained by Rotterdam PSC on 12 deficiencies including fire safety, MARPOL violations, and expired SOLAS certs.`,
    whyItMatters:
      'Detention prevents vessel from departing. Every day in detention costs $35K hire loss plus legal and rectification fees.',
    recommendedResponse:
      'Engage port agent and classification society immediately. Prioritize SOLAS fire safety items for release.',
    estimatedImpactUsd: 680000,
  },
  {
    exceptionType: 'security_alert',
    severity: 'critical',
    titleFn: (name) => `${name} — Piracy Warning — Gulf of Guinea`,
    descFn: (name) =>
      `IMB Piracy Reporting Center issued BMP5 security alert for vessel ${name} in Gulf of Guinea — 20nm NW of Lagos roads.`,
    whyItMatters:
      'Armed robbery and crew kidnapping risk in Gulf of Guinea is among highest in world. IMO security protocols required.',
    recommendedResponse:
      'Implement BMP5 procedures immediately. Contact MSCHOA. Increase watch routine. Notify flag state.',
    estimatedImpactUsd: 3500000,
  },
  {
    exceptionType: 'schedule_variance',
    severity: 'watch',
    titleFn: (name) => `${name} — ETA Drift +22h — Charterer Notification Required`,
    descFn: (name) =>
      `Accumulated delays from weather and port congestion have pushed ${name} ETA by 22 hours beyond contracted window.`,
    whyItMatters:
      'ETA breach triggers laycan renegotiation and potential cargo rejection if spread exceeds tolerance.',
    recommendedResponse:
      "Notify charterer via CP email. Request laycan extension. If refused, proceed at master's discretion.",
    estimatedImpactUsd: 140000,
  },
];

const EXCEPTION_STATUSES: Array<InsertFleetException['status']> = [
  'active',
  'acknowledged',
  'resolved',
];

export async function seedVesselsData(): Promise<void> {
  if (!isSeedDataAllowed()) {
    const mode = getRuntimeMode();
    throw new Error(
      `[seed-vessels] Attempted to seed vessels demo data in ${mode} mode. ` +
        `Seed data is only permitted in local-dev, internal-preview, and demo modes.`,
    );
  }

  // Existence checks must fail loudly. Previously this block was wrapped in
  // an empty `catch {}` with the comment "table might be empty, continue
  // seeding" — that swallowed every error (including schema drift) and made
  // problems show up later as silently-empty downstream tables.
  const tableCounts = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(vesselsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(vesselsPositionsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(vesselVoyageEconomicsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(vesselPortCallsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(fleetExceptionsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(vesselMaintenanceTable),
    db.select({ count: sql<number>`count(*)::int` }).from(vesselSanctionsScreeningTable),
  ]);
  const existingCount = tableCounts[0][0]?.count ?? 0;
  const positionCount = tableCounts[1][0]?.count ?? 0;
  const voyageCount = tableCounts[2][0]?.count ?? 0;
  const portCallCount = tableCounts[3][0]?.count ?? 0;
  const exceptionCount = tableCounts[4][0]?.count ?? 0;
  const maintenanceCount = tableCounts[5][0]?.count ?? 0;
  const sanctionsCount = tableCounts[6][0]?.count ?? 0;

  // Only treat the seed as fully complete if every downstream table also has
  // rows. This protects against partial-state restarts where vessels exist
  // but a sibling table failed to populate on a previous run.
  if (
    existingCount >= 50 &&
    positionCount >= 50 &&
    voyageCount > 0 &&
    portCallCount > 0 &&
    exceptionCount > 0 &&
    maintenanceCount > 0 &&
    sanctionsCount > 0
  ) {
    return;
  }
  if (existingCount >= 50 && positionCount < 50) {
    const existingVessels = await db
      .select({ id: vesselsTable.id, status: vesselsTable.status })
      .from(vesselsTable)
      .orderBy(vesselsTable.id);
    const POSITION_REGIONS: Array<{
      latMin: number;
      latMax: number;
      lonMin: number;
      lonMax: number;
    }> = [
      { latMin: 49, latMax: 60, lonMin: -5, lonMax: 10 },
      { latMin: 20, latMax: 40, lonMin: 110, lonMax: 130 },
      { latMin: -5, latMax: 5, lonMin: 95, lonMax: 110 },
      { latMin: 25, latMax: 30, lonMin: 51, lonMax: 57 },
      { latMin: 10, latMax: 20, lonMin: 40, lonMax: 55 },
      { latMin: 35, latMax: 50, lonMin: -80, lonMax: -60 },
      { latMin: -35, latMax: -10, lonMin: 10, lonMax: 30 },
      { latMin: 30, latMax: 45, lonMin: -10, lonMax: 30 },
    ];
    const posOnlyRows: InsertVesselPosition[] = existingVessels.map((vessel, _i) => {
      const region = POSITION_REGIONS[vessel.id % POSITION_REGIONS.length];
      const lat = region.latMin + seeded(vessel.id, 200, region.latMax - region.latMin);
      const lon = region.lonMin + seeded(vessel.id, 201, region.lonMax - region.lonMin);
      const heading = seeded(vessel.id, 202, 360);
      const speed =
        vessel.status === 'at_sea'
          ? 8 + seeded(vessel.id, 203, 10)
          : vessel.status === 'anchored'
            ? seeded(vessel.id, 204, 2)
            : 0;
      return {
        vesselId: vessel.id,
        latitude: lat.toFixed(7),
        longitude: lon.toFixed(7),
        heading: heading.toFixed(2),
        speed: speed.toFixed(2),
        recordedAt: new Date(now.getTime() - seeded(vessel.id, 205, 7200) * 1000),
      };
    });
    for (let i = 0; i < posOnlyRows.length; i += 50) {
      await db
        .insert(vesselsPositionsTable)
        .values(posOnlyRows.slice(i, i + 50))
        .onConflictDoNothing();
    }
    // Fall through so missing voyages/port-calls/exceptions/etc. can still be
    // backfilled below if needed.
  }

  // Create fleets
  const fleetData = [
    {
      name: 'SZL Tanker Fleet',
      description: 'VLCC and Suezmax crude tankers',
      region: 'Global',
      status: 'active' as const,
    },
    {
      name: 'SZL Container Fleet',
      description: 'Container and box ship operations',
      region: 'Asia-Pacific',
      status: 'active' as const,
    },
    {
      name: 'SZL Bulk Carrier Fleet',
      description: 'Dry bulk commodities fleet',
      region: 'Atlantic',
      status: 'active' as const,
    },
    {
      name: 'SZL Specialty Fleet',
      description: 'LNG, LPG, and chemical tankers',
      region: 'Middle East',
      status: 'active' as const,
    },
  ];

  const insertedFleets = await db
    .insert(vesselsFleetsTable)
    .values(fleetData)
    .onConflictDoNothing()
    .returning();
  const fleetIds = insertedFleets.map((f) => f.id);
  const fallbackFleetId = fleetIds[0] ?? 1;

  // Create 55 vessels
  const vesselRows = VESSEL_NAMES.map((name, i) => {
    const yearBuilt = 2000 + Math.floor(seeded(i, 99, 24));
    const vtype = pick(VESSEL_TYPES, i, 5);
    const flag = pick(FLAGS, i, 6);
    const status = pick(VESSEL_STATUSES, i, 7);
    const grossTonnage =
      vtype === 'tanker'
        ? 45000 + seeded(i, 8, 80000)
        : vtype === 'container'
          ? 30000 + seeded(i, 8, 120000)
          : vtype === 'bulk'
            ? 20000 + seeded(i, 8, 60000)
            : 15000 + seeded(i, 8, 30000);
    const fleetId = fleetIds[i % fleetIds.length] ?? fallbackFleetId;

    // Assign a real vessel class based on type and tonnage so voyage
    // economics can compare against the right Baltic benchmark.
    let vesselClass: (typeof vesselsTable.$inferInsert)['vesselClass'] = null;
    if (vtype === 'tanker') {
      // 1 in 6 tankers is an LNG carrier, otherwise size-based crude/product class.
      if (i % 6 === 0) vesselClass = 'LNG Carrier';
      else if (grossTonnage >= 100000) vesselClass = 'VLCC';
      else if (grossTonnage >= 70000) vesselClass = 'Suezmax';
      else vesselClass = 'Aframax';
    } else if (vtype === 'bulk') {
      if (grossTonnage >= 60000) vesselClass = 'Capesize';
      else if (grossTonnage >= 40000) vesselClass = 'Panamax';
      else if (grossTonnage >= 25000) vesselClass = 'Supramax';
      else vesselClass = 'Handysize';
    }

    return {
      fleetId,
      name,
      imo: `IMO${9000000 + i * 127 + 3}`,
      mmsi: `${210000000 + i * 8931 + 7}`,
      vesselType: vtype,
      vesselClass,
      flag,
      yearBuilt,
      grossTonnage: grossTonnage.toFixed(0),
      status,
    };
  });

  const newlyInsertedVessels = await db
    .insert(vesselsTable)
    .values(vesselRows)
    .onConflictDoNothing()
    .returning();

  // If the vessels insert no-op'd because rows already exist, look them up so
  // downstream tables (voyages, port calls, exceptions, maintenance,
  // sanctions) can still be backfilled when they are empty. Previously we
  // returned early here, which meant a partial-state restart left those
  // tables silently empty.
  const insertedVessels =
    newlyInsertedVessels.length > 0
      ? newlyInsertedVessels
      : await db
          .select({
            id: vesselsTable.id,
            name: vesselsTable.name,
            status: vesselsTable.status,
            flag: vesselsTable.flag,
          })
          .from(vesselsTable)
          .orderBy(vesselsTable.id);

  if (insertedVessels.length === 0) {
    return;
  }

  // Seed one AIS position per vessel so map-payload (INNER JOIN) returns data
  const POSITION_REGIONS: Array<{
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  }> = [
    { latMin: 49, latMax: 60, lonMin: -5, lonMax: 10 }, // North Sea / English Channel
    { latMin: 20, latMax: 40, lonMin: 110, lonMax: 130 }, // South China / East China Sea
    { latMin: -5, latMax: 5, lonMin: 95, lonMax: 110 }, // Strait of Malacca
    { latMin: 25, latMax: 30, lonMin: 51, lonMax: 57 }, // Persian Gulf
    { latMin: 10, latMax: 20, lonMin: 40, lonMax: 55 }, // Red Sea / Gulf of Aden
    { latMin: 35, latMax: 50, lonMin: -80, lonMax: -60 }, // US East Coast
    { latMin: -35, latMax: -10, lonMin: 10, lonMax: 30 }, // Cape of Good Hope
    { latMin: 30, latMax: 45, lonMin: -10, lonMax: 30 }, // Mediterranean Sea
  ];

  const positionRows: InsertVesselPosition[] = insertedVessels.map((vessel, i) => {
    const region = POSITION_REGIONS[i % POSITION_REGIONS.length];
    const latRange = region.latMax - region.latMin;
    const lonRange = region.lonMax - region.lonMin;
    const lat = region.latMin + seeded(vessel.id, 200, latRange);
    const lon = region.lonMin + seeded(vessel.id, 201, lonRange);
    const heading = seeded(vessel.id, 202, 360);
    const speed =
      vessel.status === 'at_sea'
        ? 8 + seeded(vessel.id, 203, 10)
        : vessel.status === 'anchored'
          ? seeded(vessel.id, 204, 2)
          : 0;
    return {
      vesselId: vessel.id,
      latitude: lat.toFixed(7),
      longitude: lon.toFixed(7),
      heading: heading.toFixed(2),
      speed: speed.toFixed(2),
      recordedAt: new Date(now.getTime() - seeded(vessel.id, 205, 7200) * 1000),
    };
  });

  for (let i = 0; i < positionRows.length; i += 50) {
    await db
      .insert(vesselsPositionsTable)
      .values(positionRows.slice(i, i + 50))
      .onConflictDoNothing();
  }

  // Create voyage economics (4 per vessel = up to 220 voyages)
  const voyageRows: InsertVesselVoyageEconomics[] = [];
  for (let v = 0; v < insertedVessels.length; v++) {
    const vessel = insertedVessels[v];
    for (let j = 0; j < 4; j++) {
      const idx = v * 4 + j;
      const origin = pick(ORIGIN_PORTS, idx, 0);
      const dest = pick(DESTINATIONS, idx, 1);
      const cargo = pick(CARGO_TYPES, idx, 2);
      const charterType = CHARTER_TYPES[j % CHARTER_TYPES.length] ?? 'voyage_charter';
      const distanceNm = 3000 + seeded(idx, 3, 9000);
      const durationDays = distanceNm / 300 + seeded(idx, 4, 5);
      const charterRatePerDay = 15000 + seeded(idx, 5, 45000);
      const grossRevenue = charterRatePerDay * durationDays;
      const fuelCostUsd = distanceNm * 0.55 * (400 + seeded(idx, 6, 200));
      const portCostsUsd = 80000 + seeded(idx, 7, 220000);
      const canalFeesUsd = seeded(idx, 8, 1) > 0.5 ? 200000 + seeded(idx, 9, 400000) : 0;
      const crewCostsUsd = durationDays * 4200;
      const maintenanceCostsUsd = durationDays * 1800;
      const otherCostsUsd = 20000 + seeded(idx, 10, 50000);
      const totalCostsUsd =
        fuelCostUsd +
        portCostsUsd +
        canalFeesUsd +
        crewCostsUsd +
        maintenanceCostsUsd +
        otherCostsUsd;
      const netMarginUsd = grossRevenue - totalCostsUsd;
      const marginPct = grossRevenue > 0 ? netMarginUsd / grossRevenue : 0;
      const tcePerDay = durationDays > 0 ? netMarginUsd / durationDays : 0;
      const delayHours = seeded(idx, 11, 1) > 0.7 ? seeded(idx, 12, 72) : 0;
      const delayCostUsd = delayHours * (charterRatePerDay / 24);
      const cargoQty = 30000 + seeded(idx, 13, 90000);
      const cargoValueUsd = cargoQty * (80 + seeded(idx, 14, 800));

      const baseDate = daysAgo(180 - j * 40);
      const status = VOYAGE_STATUSES[j] ?? 'planned';

      voyageRows.push({
        vesselId: vessel.id,
        voyageRef: `VYG-${vessel.id}-${2024 + Math.floor(j / 2)}-${String(j + 1).padStart(3, '0')}`,
        originPort: origin,
        destinationPort: dest,
        cargoType: cargo,
        cargoQuantityMt: cargoQty.toFixed(2),
        cargoValueUsd: cargoValueUsd.toFixed(2),
        charterType,
        charterRatePerDay: charterRatePerDay.toFixed(2),
        grossRevenue: grossRevenue.toFixed(2),
        fuelCostUsd: fuelCostUsd.toFixed(2),
        fuelConsumedMt: (fuelCostUsd / 700).toFixed(2),
        portCostsUsd: portCostsUsd.toFixed(2),
        canalFeesUsd: canalFeesUsd.toFixed(2),
        crewCostsUsd: crewCostsUsd.toFixed(2),
        maintenanceCostsUsd: maintenanceCostsUsd.toFixed(2),
        otherCostsUsd: otherCostsUsd.toFixed(2),
        totalCostsUsd: totalCostsUsd.toFixed(2),
        netMarginUsd: netMarginUsd.toFixed(2),
        marginPct: marginPct.toFixed(4),
        tcePerDay: tcePerDay.toFixed(2),
        distanceNm: distanceNm.toFixed(2),
        durationDays: durationDays.toFixed(2),
        delayHours: delayHours.toFixed(2),
        delayCostUsd: delayCostUsd.toFixed(2),
        status,
        scheduledDepartureAt: baseDate,
        actualDepartureAt:
          status !== 'planned' ? new Date(baseDate.getTime() + delayHours * 3600000) : null,
        scheduledArrivalAt: new Date(baseDate.getTime() + durationDays * 86400000),
        estimatedArrivalAt: new Date(
          baseDate.getTime() + (durationDays + delayHours / 24) * 86400000,
        ),
        actualArrivalAt:
          status === 'completed'
            ? new Date(baseDate.getTime() + (durationDays + delayHours / 24) * 86400000 + 3600000)
            : null,
      });
    }
  }

  for (let i = 0; i < voyageRows.length; i += 50) {
    await db
      .insert(vesselVoyageEconomicsTable)
      .values(voyageRows.slice(i, i + 50))
      .onConflictDoNothing();
  }

  // Create port calls (2-3 per vessel)
  const portCallRows: InsertVesselPortCall[] = [];
  for (let v = 0; v < insertedVessels.length; v++) {
    const vessel = insertedVessels[v];
    const callCount = 2 + Math.floor(seeded(v, 20, 2));
    for (let j = 0; j < callCount; j++) {
      const idx = v * 3 + j;
      const port = pick(PORT_CALL_PORTS, idx, 0);
      const arrivalBase = daysAgo(150 - j * 45);
      const durationHours = 12 + seeded(idx, 1, 120);
      const purpose = pick(PORT_PURPOSES, idx, 2);
      const hasCanalTransit = seeded(idx, 3, 1) > 0.85;

      portCallRows.push({
        vesselId: vessel.id,
        portName: port.name,
        portLocode: port.locode,
        portCountry: port.country,
        arrivalAt: arrivalBase,
        departureAt: new Date(arrivalBase.getTime() + durationHours * 3600000),
        durationHours: durationHours.toFixed(2),
        purpose,
        cargoLoaded: purpose === 'loading' ? (10000 + seeded(idx, 4, 50000)).toFixed(2) : '0',
        cargoDischarged:
          purpose === 'discharging' ? (10000 + seeded(idx, 5, 50000)).toFixed(2) : '0',
        portCostUsd: (50000 + seeded(idx, 6, 150000)).toFixed(2),
        bunkeredMt: purpose === 'bunkering' ? (200 + seeded(idx, 7, 800)).toFixed(2) : '0',
        canalTransit: hasCanalTransit,
        canalName: hasCanalTransit ? pick(CANAL_NAMES, idx, 8) : null,
        canalFeeUsd: hasCanalTransit ? (200000 + seeded(idx, 9, 500000)).toFixed(2) : '0',
        agentName: pick(PORT_AGENTS, idx, 10),
      });
    }
  }

  for (let i = 0; i < portCallRows.length; i += 50) {
    await db
      .insert(vesselPortCallsTable)
      .values(portCallRows.slice(i, i + 50))
      .onConflictDoNothing();
  }

  // Create fleet exceptions
  const exceptionRows: InsertFleetException[] = [];
  let excCount = 0;

  for (let v = 0; v < insertedVessels.length && excCount < 60; v++) {
    const vessel = insertedVessels[v];
    const numExc = Math.min(1 + Math.floor(seeded(v, 30, 2)), 3);
    for (let j = 0; j < numExc && excCount < 60; j++) {
      const tmpl = EXCEPTION_TEMPLATES[(v * 3 + j) % EXCEPTION_TEMPLATES.length];
      const detectedHoursAgo = 1 + seeded(v * 3 + j, 40, 168);
      const status = EXCEPTION_STATUSES[Math.min(j, 2)] ?? 'active';

      exceptionRows.push({
        vesselId: vessel.id,
        exceptionRef: `EXC-${vessel.id}-${String(j + 1).padStart(3, '0')}`,
        exceptionType: tmpl.exceptionType,
        severity: tmpl.severity,
        title: tmpl.titleFn(vessel.name),
        description: tmpl.descFn(vessel.name),
        whyItMatters: tmpl.whyItMatters,
        recommendedResponse: tmpl.recommendedResponse,
        businessConsequence: `Estimated financial impact: $${(tmpl.estimatedImpactUsd / 1000).toFixed(0)}K. Operational disruption to fleet schedule.`,
        owner: pick(OWNERS, v * 3 + j, 0),
        ownerFunction: pick(OWNER_FUNCTIONS, v * 3 + j, 1),
        estimatedImpactUsd: tmpl.estimatedImpactUsd.toFixed(2),
        status,
        acknowledgedAt:
          status !== 'active' ? new Date(now.getTime() - (detectedHoursAgo - 2) * 3600000) : null,
        resolvedAt:
          status === 'resolved' ? new Date(now.getTime() - (detectedHoursAgo - 8) * 3600000) : null,
        metadata: { source: 'system', correlationId: `COR-${vessel.id}-${j}` },
      });
      excCount++;
    }
  }

  for (let i = 0; i < exceptionRows.length; i += 50) {
    await db
      .insert(fleetExceptionsTable)
      .values(exceptionRows.slice(i, i + 50))
      .onConflictDoNothing();
  }

  // Create maintenance records (2-4 per vessel)
  const maintenanceRows: InsertVesselMaintenance[] = [];
  for (let v = 0; v < insertedVessels.length; v++) {
    const vessel = insertedVessels[v];
    const itemCount = 2 + Math.floor(seeded(v, 50, 3));
    for (let j = 0; j < itemCount; j++) {
      const idx = v * 4 + j;
      const component = pick(MAINTENANCE_COMPONENTS, idx, 0);
      const mtype = pick(MAINTENANCE_TYPES, idx, 1);
      const priority = pick(MAINTENANCE_PRIORITIES, idx, 2);

      let status: InsertVesselMaintenance['status'];
      if (j === 0 && seeded(idx, 3, 1) > 0.5) {
        status = 'overdue';
      } else if (j === 0 && seeded(idx, 3, 1) > 0.2) {
        status = 'due_soon';
      } else if (j === 1) {
        status = 'in_progress';
      } else {
        status = seeded(idx, 4, 1) > 0.3 ? 'scheduled' : 'completed';
      }

      const dueDays =
        status === 'overdue'
          ? -seeded(idx, 5, 30)
          : status === 'due_soon'
            ? seeded(idx, 6, 14)
            : status === 'completed'
              ? -seeded(idx, 7, 90)
              : seeded(idx, 8, 180);
      const estimatedCost = 15000 + seeded(idx, 9, 285000);
      const riskScore =
        status === 'overdue'
          ? 60 + seeded(idx, 10, 35)
          : status === 'due_soon'
            ? 40 + seeded(idx, 11, 30)
            : 10 + seeded(idx, 12, 30);
      const assetHealth =
        status === 'overdue'
          ? 40 + seeded(idx, 13, 30)
          : status === 'completed'
            ? 75 + seeded(idx, 14, 20)
            : 55 + seeded(idx, 15, 35);

      maintenanceRows.push({
        vesselId: vessel.id,
        component,
        maintenanceType: mtype,
        description: `${mtype.charAt(0).toUpperCase() + mtype.slice(1)} maintenance for ${component}. Per class survey schedule.`,
        status,
        priority,
        dueDate: new Date(now.getTime() + dueDays * 86400000),
        completedAt:
          status === 'completed' ? new Date(now.getTime() - seeded(idx, 16, 30) * 86400000) : null,
        estimatedCost: estimatedCost.toFixed(2),
        riskOfServiceIssue: riskScore.toFixed(2),
        impactsVoyageAvailability:
          priority === 'critical' || (priority === 'high' && status === 'overdue'),
        assetHealth: assetHealth.toFixed(2),
        technician: pick(MAINTENANCE_TECHNICIANS, idx, 17),
        notes:
          status === 'overdue'
            ? 'Delayed due to port availability constraints. Urgent scheduling required.'
            : null,
      });
    }
  }

  for (let i = 0; i < maintenanceRows.length; i += 50) {
    await db
      .insert(vesselMaintenanceTable)
      .values(maintenanceRows.slice(i, i + 50))
      .onConflictDoNothing();
  }

  // Create sanctions screening (1 per vessel)
  const screeningRows: InsertVesselSanctionsScreening[] = [];
  for (let v = 0; v < insertedVessels.length; v++) {
    const vessel = insertedVessels[v];
    const flagRisk = seeded(v, 60, 1);
    const isHighRisk = flagRisk > 0.9;
    const isMediumRisk = flagRisk > 0.75;

    const ofacStatus: OfacStatus = isHighRisk ? 'match' : isMediumRisk ? 'partial_match' : 'clear';
    const euStatus: OfacStatus = isHighRisk ? 'match' : flagRisk > 0.8 ? 'partial_match' : 'clear';
    const unStatus: OfacStatus = isHighRisk ? 'match' : 'clear';
    const ukStatus: OfacStatus = isHighRisk ? 'partial_match' : 'clear';

    const hasDeficiencies = seeded(v, 61, 1) > 0.6;
    const pscResult: PscResult = hasDeficiencies
      ? seeded(v, 62, 1) > 0.7
        ? 'detained'
        : 'deficiency'
      : 'passed';

    const matchedLists: string[] = [];
    if (ofacStatus !== 'clear') matchedLists.push('OFAC SDN List');
    if (euStatus !== 'clear') matchedLists.push('EU Consolidated Sanctions');
    if (unStatus !== 'clear') matchedLists.push('UN Security Council Sanctions');

    const complianceScore = isHighRisk
      ? 15 + seeded(v, 63, 25)
      : isMediumRisk
        ? 40 + seeded(v, 64, 30)
        : 70 + seeded(v, 65, 28);

    screeningRows.push({
      vesselId: vessel.id,
      screeningDate: daysAgo(Math.floor(seeded(v, 66, 30))),
      ofacStatus,
      euStatus,
      unStatus,
      ukStatus,
      matchedLists,
      matchConfidence: isHighRisk
        ? (82 + seeded(v, 67, 16)).toFixed(2)
        : isMediumRisk
          ? (55 + seeded(v, 68, 30)).toFixed(2)
          : null,
      flagRegistryValid: !isHighRisk,
      flagRegistryNotes: isHighRisk
        ? 'Flag state does not provide vessel ownership transparency.'
        : null,
      pscInspectionDate: daysAgo(Math.floor(seeded(v, 69, 180))),
      pscResult,
      pscDeficiencies:
        pscResult === 'detained'
          ? Math.floor(5 + seeded(v, 70, 10))
          : pscResult === 'deficiency'
            ? Math.floor(1 + seeded(v, 71, 5))
            : 0,
      complianceScore: complianceScore.toFixed(2),
      ownershipOpaque: isHighRisk || (isMediumRisk && seeded(v, 72, 1) > 0.6),
      knownOwner: pick(OWNERS, v, 0),
      knownManager: pick(MANAGERS, v, 73),
      flagState: vessel.flag,
      notes: isHighRisk
        ? 'Vessel flagged for enhanced due diligence. Commercial engagement suspended pending legal review.'
        : isMediumRisk
          ? 'Beneficial ownership chain includes multiple SPV layers. Monitoring required.'
          : null,
    });
  }

  for (let i = 0; i < screeningRows.length; i += 50) {
    await db
      .insert(vesselSanctionsScreeningTable)
      .values(screeningRows.slice(i, i + 50))
      .onConflictDoNothing();
  }

  await seedPscData(insertedVessels);
}

async function seedPscData(
  vessels: Array<{ id: number; name: string; flag: string | null; orgId?: number | null }>,
): Promise<void> {
  const PSC_PORTS: Array<{ port: string; country: string; mou: string }> = [
    { port: 'Rotterdam', country: 'Netherlands', mou: 'Paris MoU' },
    { port: 'Hamburg', country: 'Germany', mou: 'Paris MoU' },
    { port: 'Antwerp', country: 'Belgium', mou: 'Paris MoU' },
    { port: 'Singapore', country: 'Singapore', mou: 'Tokyo MoU' },
    { port: 'Shanghai', country: 'China', mou: 'Tokyo MoU' },
    { port: 'Yokohama', country: 'Japan', mou: 'Tokyo MoU' },
    { port: 'Houston', country: 'USA', mou: 'USCG' },
    { port: 'Long Beach', country: 'USA', mou: 'USCG' },
    { port: 'Santos', country: 'Brazil', mou: 'Vina del Mar' },
    { port: 'Durban', country: 'South Africa', mou: 'Indian Ocean MoU' },
  ];
  const DEFICIENCY_CATEGORIES = [
    'Fire safety',
    'Life saving appliances',
    'MARPOL — Annex I',
    'ISM Code',
    'Navigation safety',
    'Crew certification',
    'Structural conditions',
    'Working & living conditions',
    'Radio communications',
  ];
  const INSPECTORS = [
    'Inspector M. Rodriguez',
    'Inspector S. Tanaka',
    'Inspector K. van Houten',
    'Inspector A. Müller',
    'Inspector P. Da Silva',
    'Inspector L. Chen',
  ];

  const inspectionRows: InsertVesselsPscInspection[] = [];
  const checklistRows: InsertVesselsPscChecklistItem[] = [];

  const baseChecklist: Array<{ category: string }> = [
    { category: 'ISM Code — SMS Manual' },
    { category: 'Fire Detection System' },
    { category: 'MARPOL — Oil Record Book current' },
    { category: 'Life Saving Appliances' },
    { category: 'ISPS Documentation' },
    { category: 'Navigation Equipment' },
    { category: 'Crew Certificates' },
  ];

  for (const vessel of vessels) {
    const v = vessel.id;
    // 1-3 inspections in the past ~2 years.
    const count = 1 + Math.floor(seeded(v, 401, 3));
    for (let i = 0; i < count; i++) {
      const portIdx = Math.floor(seeded(v, 410 + i, PSC_PORTS.length));
      const port = PSC_PORTS[portIdx];
      const daysBack = 30 + Math.floor(seeded(v, 420 + i, 700));
      const roll = seeded(v, 430 + i, 1);
      let result: 'passed' | 'deficiency' | 'detained';
      let deficienciesCount: number;
      let detained = false;
      let detentionDays: number | null = null;
      if (roll < 0.55) {
        result = 'passed';
        deficienciesCount = 0;
      } else if (roll < 0.9) {
        result = 'deficiency';
        deficienciesCount = 1 + Math.floor(seeded(v, 440 + i, 4));
      } else {
        result = 'detained';
        deficienciesCount = 4 + Math.floor(seeded(v, 450 + i, 6));
        detained = true;
        detentionDays = 1 + Math.floor(seeded(v, 460 + i, 6));
      }
      const cats: string[] = [];
      for (let k = 0; k < Math.min(deficienciesCount, 3); k++) {
        const c =
          DEFICIENCY_CATEGORIES[
            Math.floor(seeded(v, 470 + i * 10 + k, DEFICIENCY_CATEGORIES.length))
          ];
        if (!cats.includes(c)) cats.push(c);
      }
      inspectionRows.push({
        vesselId: vessel.id,
        orgId: vessel.orgId ?? null,
        port: port.port,
        portCountry: port.country,
        mouRegime: port.mou,
        inspectionDate: daysAgo(daysBack),
        result,
        deficienciesCount,
        deficiencyCategories: cats,
        detained,
        detentionDays,
        inspector: INSPECTORS[Math.floor(seeded(v, 480 + i, INSPECTORS.length))],
        notes:
          result === 'detained'
            ? 'Vessel detained pending rectification of cited deficiencies.'
            : result === 'deficiency'
              ? 'Deficiencies noted; rectification confirmed before sailing.'
              : null,
      });
    }

    // Checklist: mostly pass, occasional action_required when recent deficiencies exist.
    const hasRecentDeficiency = inspectionRows.some(
      (r) =>
        r.vesselId === vessel.id &&
        r.result !== 'passed' &&
        new Date(r.inspectionDate).getTime() > Date.now() - 180 * 86400_000,
    );
    baseChecklist.forEach((item, idx) => {
      let status: 'pass' | 'fail' | 'action_required' = 'pass';
      if (hasRecentDeficiency && seeded(v, 500 + idx, 1) > 0.75) {
        status = 'action_required';
      }
      checklistRows.push({
        vesselId: vessel.id,
        orgId: vessel.orgId ?? null,
        category: item.category,
        status,
        sortOrder: idx,
        note:
          status === 'action_required'
            ? 'Follow-up rectification required before next port call.'
            : null,
      });
    });
  }

  for (let i = 0; i < inspectionRows.length; i += 100) {
    await db
      .insert(vesselsPscInspectionsTable)
      .values(inspectionRows.slice(i, i + 100))
      .onConflictDoNothing();
  }
  for (let i = 0; i < checklistRows.length; i += 100) {
    await db
      .insert(vesselsPscChecklistItemsTable)
      .values(checklistRows.slice(i, i + 100))
      .onConflictDoNothing();
  }
}
