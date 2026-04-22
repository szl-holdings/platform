#!/usr/bin/env tsx
/**
 * seed-atlas-twins.ts — ATLAS Twin Live Data Seed
 *
 * Populates the vessels and terra_properties tables with realistic records so
 * the ATLAS twin pages (vessels + terra) can exercise their live-data path
 * end-to-end. Idempotent — re-running will skip records that already exist
 * (matched by vessels.imo and terra_properties.externalId).
 *
 * Seeds:
 *   - 6 vessels (with AIS positions, cargo, and an active route per vessel)
 *   - 6 terra_properties (with lat/lon, assessed value, and CRE asset class)
 *
 * Usage:
 *   pnpm --filter @workspace/scripts seed:atlas-twins
 */

import {
  db,
  type InsertTerraProperty,
  type InsertVessel,
  type InsertVesselCargo,
  type InsertVesselPosition,
  type InsertVesselRoute,
  terraPropertiesTable,
  vesselsCargoTable,
  vesselsPositionsTable,
  vesselsRoutesTable,
  vesselsTable,
} from '@szl-holdings/db';
import { eq, inArray } from 'drizzle-orm';

const SEED_ORG_ID = process.env.SEED_ORG_ID ? parseInt(process.env.SEED_ORG_ID, 10) : 1;

interface VesselSeed {
  vessel: Omit<InsertVessel, 'orgId'>;
  position: Omit<InsertVesselPosition, 'vesselId'>;
  cargo: Omit<InsertVesselCargo, 'vesselId'>;
  route: Omit<InsertVesselRoute, 'vesselId'>;
  destination: string;
}

const VESSEL_SEEDS: VesselSeed[] = [
  {
    vessel: {
      name: 'MV Pacific Horizon',
      imo: '9876543',
      mmsi: '636019825',
      vesselType: 'container',
      flag: 'Liberia',
      yearBuilt: 2018,
      grossTonnage: '98500',
      status: 'at_sea',
    },
    position: { latitude: '25.2769', longitude: '55.2962', heading: '92.5', speed: '18.4' },
    cargo: {
      cargoType: 'Containerized goods (electronics, textiles)',
      quantity: '8200',
      unit: 'TEU',
      origin: 'Jebel Ali, AE',
      destination: 'Rotterdam, NL',
      status: 'in_transit',
    },
    route: {
      originPort: 'Jebel Ali, AE',
      destinationPort: 'Rotterdam, NL',
      distanceNm: '6420',
      status: 'active',
      waypoints: [
        { lat: 25.0, lon: 56.5, name: 'Strait of Hormuz' },
        { lat: 12.6, lon: 43.4, name: 'Bab el-Mandeb' },
        { lat: 30.6, lon: 32.3, name: 'Suez Canal' },
        { lat: 36.1, lon: -5.4, name: 'Strait of Gibraltar' },
        { lat: 51.95, lon: 4.14, name: 'Rotterdam' },
      ],
    },
    destination: 'Rotterdam, NL',
  },
  {
    vessel: {
      name: 'MT Aurora Star',
      imo: '9712345',
      mmsi: '538008412',
      vesselType: 'tanker',
      flag: 'Marshall Islands',
      yearBuilt: 2016,
      grossTonnage: '62100',
      status: 'at_sea',
    },
    position: { latitude: '29.9511', longitude: '-90.0715', heading: '175.2', speed: '12.8' },
    cargo: {
      cargoType: 'Crude oil (WTI)',
      quantity: '1100000',
      unit: 'BBL',
      origin: 'Houston, US',
      destination: 'Yokohama, JP',
      status: 'in_transit',
    },
    route: {
      originPort: 'Houston, US',
      destinationPort: 'Yokohama, JP',
      distanceNm: '9870',
      status: 'active',
      waypoints: [
        { lat: 29.7, lon: -94.9, name: 'Houston' },
        { lat: 9.0, lon: -79.6, name: 'Panama Canal' },
        { lat: 21.3, lon: -157.9, name: 'Honolulu' },
        { lat: 35.4, lon: 139.6, name: 'Yokohama' },
      ],
    },
    destination: 'Yokohama, JP',
  },
  {
    vessel: {
      name: 'MV Nordic Trader',
      imo: '9543210',
      mmsi: '257012340',
      vesselType: 'bulk',
      flag: 'Norway',
      yearBuilt: 2014,
      grossTonnage: '44800',
      status: 'anchored',
    },
    position: { latitude: '1.2655', longitude: '103.8240', heading: '0.0', speed: '0.2' },
    cargo: {
      cargoType: 'Iron ore',
      quantity: '82000',
      unit: 'MT',
      origin: 'Port Hedland, AU',
      destination: 'Qingdao, CN',
      status: 'loading',
    },
    route: {
      originPort: 'Port Hedland, AU',
      destinationPort: 'Qingdao, CN',
      distanceNm: '3960',
      status: 'planned',
      waypoints: [
        { lat: -20.3, lon: 118.6, name: 'Port Hedland' },
        { lat: 1.27, lon: 103.82, name: 'Singapore Strait' },
        { lat: 36.1, lon: 120.4, name: 'Qingdao' },
      ],
    },
    destination: 'Qingdao, CN',
  },
  {
    vessel: {
      name: 'MV Atlantic Crown',
      imo: '9456789',
      mmsi: '311024890',
      vesselType: 'container',
      flag: 'Bahamas',
      yearBuilt: 2020,
      grossTonnage: '142300',
      status: 'at_sea',
    },
    position: { latitude: '40.6892', longitude: '-72.0445', heading: '265.7', speed: '21.6' },
    cargo: {
      cargoType: 'Containerized goods (general cargo)',
      quantity: '11400',
      unit: 'TEU',
      origin: 'Algeciras, ES',
      destination: 'New York, US',
      status: 'in_transit',
    },
    route: {
      originPort: 'Algeciras, ES',
      destinationPort: 'New York, US',
      distanceNm: '3320',
      status: 'active',
      waypoints: [
        { lat: 36.1, lon: -5.4, name: 'Algeciras' },
        { lat: 38.5, lon: -28.6, name: 'Azores' },
        { lat: 40.5, lon: -74.0, name: 'New York' },
      ],
    },
    destination: 'New York, US',
  },
  {
    vessel: {
      name: 'MV Baltic Voyager',
      imo: '9398541',
      mmsi: '230089120',
      vesselType: 'cargo',
      flag: 'Finland',
      yearBuilt: 2012,
      grossTonnage: '21400',
      status: 'in_port',
    },
    position: { latitude: '59.4370', longitude: '24.7536', heading: '45.0', speed: '0.0' },
    cargo: {
      cargoType: 'Forest products (sawn timber, pulp)',
      quantity: '9600',
      unit: 'MT',
      origin: 'Helsinki, FI',
      destination: 'Lübeck, DE',
      status: 'loading',
    },
    route: {
      originPort: 'Helsinki, FI',
      destinationPort: 'Lübeck, DE',
      distanceNm: '640',
      status: 'planned',
      waypoints: [
        { lat: 60.16, lon: 24.95, name: 'Helsinki' },
        { lat: 59.44, lon: 24.75, name: 'Tallinn (transit)' },
        { lat: 53.87, lon: 10.69, name: 'Lübeck' },
      ],
    },
    destination: 'Lübeck, DE',
  },
  {
    vessel: {
      name: 'MV Sierra Madre',
      imo: '9621874',
      mmsi: '352005210',
      vesselType: 'bulk',
      flag: 'Panama',
      yearBuilt: 2017,
      grossTonnage: '37200',
      status: 'at_sea',
    },
    position: { latitude: '-23.9618', longitude: '-46.3322', heading: '112.0', speed: '13.9' },
    cargo: {
      cargoType: 'Soybeans',
      quantity: '65000',
      unit: 'MT',
      origin: 'Santos, BR',
      destination: 'Shanghai, CN',
      status: 'in_transit',
    },
    route: {
      originPort: 'Santos, BR',
      destinationPort: 'Shanghai, CN',
      distanceNm: '11340',
      status: 'active',
      waypoints: [
        { lat: -23.96, lon: -46.33, name: 'Santos' },
        { lat: -34.36, lon: 18.47, name: 'Cape of Good Hope' },
        { lat: 1.27, lon: 103.82, name: 'Singapore Strait' },
        { lat: 31.23, lon: 121.47, name: 'Shanghai' },
      ],
    },
    destination: 'Shanghai, CN',
  },
];

const PROPERTY_SEEDS: Array<Omit<InsertTerraProperty, 'id'>> = [
  {
    externalId: 'PROP-NYC-MID-001',
    address: '1411 Broadway',
    city: 'New York',
    state: 'NY',
    zipCode: '10018',
    submarket: 'Midtown South',
    propertyType: 'office',
    sqft: 1240000,
    yearBuilt: 1969,
    floors: 40,
    latitude: '40.7536',
    longitude: '-73.9871',
    assessedValue: '612500000',
    zoning: 'C6-4.5',
    ownerName: 'Equity Office Properties REIT',
    ownerType: 'reit',
    isActive: true,
    tags: ['trophy-asset', 'transit-oriented', 'class-a'],
    rawData: { riskScore: 28, assetClass: 'Class A Office', capRate: 5.4, noi: 33075000 },
  },
  {
    externalId: 'PROP-DAL-IND-002',
    address: '4500 Mercantile Pkwy',
    city: 'Fort Worth',
    state: 'TX',
    zipCode: '76137',
    submarket: 'DFW North',
    propertyType: 'industrial',
    sqft: 685000,
    yearBuilt: 2019,
    floors: 1,
    latitude: '32.8721',
    longitude: '-97.2856',
    assessedValue: '94800000',
    zoning: 'I-2',
    ownerName: 'Prologis Industrial REIT',
    ownerType: 'reit',
    isActive: true,
    tags: ['bulk-distribution', 'class-a', 'ecommerce-grade'],
    rawData: {
      riskScore: 18,
      assetClass: 'Bulk Distribution Industrial',
      capRate: 5.1,
      noi: 4834800,
    },
  },
  {
    externalId: 'PROP-MIA-MFR-003',
    address: '888 Brickell Bay Dr',
    city: 'Miami',
    state: 'FL',
    zipCode: '33131',
    submarket: 'Brickell',
    propertyType: 'multifamily',
    sqft: 412000,
    yearBuilt: 2021,
    floors: 48,
    units: 360,
    latitude: '25.7617',
    longitude: '-80.1918',
    assessedValue: '248000000',
    zoning: 'T6-48-O',
    ownerName: 'Related Group Brickell Holdings LLC',
    ownerType: 'llc',
    isActive: true,
    tags: ['luxury', 'waterfront', 'amenity-rich'],
    rawData: {
      riskScore: 34,
      assetClass: 'Luxury High-Rise Multifamily',
      capRate: 4.7,
      noi: 11656000,
    },
  },
  {
    externalId: 'PROP-BK-2026-0142',
    address: '842 Atlantic Ave',
    city: 'Brooklyn',
    state: 'NY',
    zipCode: '11238',
    submarket: 'Crown Heights / Prospect Heights',
    propertyType: 'mixed-use',
    sqft: 38400,
    yearBuilt: 1928,
    floors: 6,
    units: 24,
    latitude: '40.6816',
    longitude: '-73.9612',
    assessedValue: '1820000',
    zoning: 'R7A/C2-4',
    ownerName: 'Atlantic Avenue Holdings LLC',
    ownerType: 'llc',
    isActive: true,
    tags: ['distress', 'lis-pendens', 'value-add'],
    rawData: { riskScore: 87, assetClass: 'Distressed Mixed-Use', capRate: 7.8, noi: 142000 },
  },
  {
    externalId: 'PROP-DEN-RTL-005',
    address: '1600 16th Street Mall',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    submarket: 'Downtown Denver',
    propertyType: 'retail',
    sqft: 142000,
    yearBuilt: 2003,
    floors: 3,
    latitude: '39.7459',
    longitude: '-104.9959',
    assessedValue: '62400000',
    zoning: 'D-C',
    ownerName: 'Brookfield Properties Retail Trust',
    ownerType: 'reit',
    isActive: true,
    tags: ['grocery-anchored', 'transit-oriented'],
    rawData: { riskScore: 42, assetClass: 'Grocery-Anchored Retail', capRate: 6.2, noi: 3868800 },
  },
  {
    externalId: 'PROP-PHX-DC-006',
    address: '5601 W Buckeye Rd',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85043',
    submarket: 'Phoenix Goodyear Corridor',
    propertyType: 'industrial',
    sqft: 285000,
    yearBuilt: 2023,
    floors: 2,
    latitude: '33.4319',
    longitude: '-112.1745',
    assessedValue: '1140000000',
    zoning: 'A-1',
    ownerName: 'Digital Realty Trust LP',
    ownerType: 'reit',
    isActive: true,
    tags: ['data-center', 'hyperscale', 'power-rich'],
    rawData: { riskScore: 22, assetClass: 'Hyperscale Data Center', capRate: 4.5, noi: 51300000 },
  },
];

async function seedVessels(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  const imos = VESSEL_SEEDS.map((s) => s.vessel.imo!).filter(Boolean);
  const existing = imos.length
    ? await db
        .select({ id: vesselsTable.id, imo: vesselsTable.imo, orgId: vesselsTable.orgId })
        .from(vesselsTable)
        .where(inArray(vesselsTable.imo, imos))
    : [];
  const existingByImo = new Map(existing.map((r) => [r.imo, r]));

  for (const seed of VESSEL_SEEDS) {
    const prior = existingByImo.get(seed.vessel.imo!);
    let vesselId: number;
    let _action: string;
    if (prior) {
      vesselId = prior.id;
      // Backfill org_id if it was inserted without one previously
      if (prior.orgId !== SEED_ORG_ID) {
        await db
          .update(vesselsTable)
          .set({ orgId: SEED_ORG_ID, updatedAt: new Date() })
          .where(eq(vesselsTable.id, vesselId));
      }
      skipped++;
      _action = 'backfill';
    } else {
      const [vessel] = await db
        .insert(vesselsTable)
        .values({ ...seed.vessel, orgId: SEED_ORG_ID })
        .returning();
      vesselId = vessel.id;
      inserted++;
      _action = 'insert';
    }
    // Idempotently ensure each vessel has at least one position, cargo, and active route row
    const [pos] = await db
      .select({ id: vesselsPositionsTable.id })
      .from(vesselsPositionsTable)
      .where(eq(vesselsPositionsTable.vesselId, vesselId))
      .limit(1);
    if (!pos) await db.insert(vesselsPositionsTable).values({ ...seed.position, vesselId });
    const [cargo] = await db
      .select({ id: vesselsCargoTable.id })
      .from(vesselsCargoTable)
      .where(eq(vesselsCargoTable.vesselId, vesselId))
      .limit(1);
    if (!cargo) await db.insert(vesselsCargoTable).values({ ...seed.cargo, vesselId });
    const [route] = await db
      .select({ id: vesselsRoutesTable.id })
      .from(vesselsRoutesTable)
      .where(eq(vesselsRoutesTable.vesselId, vesselId))
      .limit(1);
    if (!route) await db.insert(vesselsRoutesTable).values({ ...seed.route, vesselId });
  }
  return { inserted, skipped };
}

async function seedProperties(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  const externals = PROPERTY_SEEDS.map((p) => p.externalId!).filter(Boolean);
  const existing = externals.length
    ? await db
        .select({ externalId: terraPropertiesTable.externalId })
        .from(terraPropertiesTable)
        .where(inArray(terraPropertiesTable.externalId, externals))
    : [];
  const existingExternals = new Set(existing.map((r) => r.externalId));

  for (const seed of PROPERTY_SEEDS) {
    if (existingExternals.has(seed.externalId!)) {
      skipped++;
      continue;
    }
    // Task #2638: terra_properties has a unique index on (address, city, state)
    // in addition to external_id, so onConflictDoNothing() makes this insert
    // idempotent even if a row with the same postal triple was inserted by
    // another seed path that left external_id NULL.
    const [property] = await db
      .insert(terraPropertiesTable)
      .values(seed)
      .onConflictDoNothing()
      .returning();
    if (!property) {
      skipped++;
      continue;
    }
    inserted++;
  }
  return { inserted, skipped };
}

async function main() {
  const _v = await seedVessels();
  const _p = await seedProperties();

  const _totalVessels = (await db.select().from(vesselsTable)).length;
  const _totalProps = (await db.select().from(terraPropertiesTable)).length;
}

main()
  .then(() => process.exit(0))
  .catch((_err) => {
    process.exit(1);
  });
