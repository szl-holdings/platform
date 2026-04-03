import { logger } from "./logger";
import { db } from "@szl-holdings/db";
import {
  terraMlsListingsTable,
  terraCommercialPropertiesTable,
  terraCommercialCompsTable,
  terraDistressPropertiesTable,
  type InsertTerraMlsListing,
  type InsertTerraCommercialProperty,
  type InsertTerraCommercialComp,
} from "@szl-holdings/db";
import { services } from "@szl-holdings/services";
import { eq, and, ilike, desc, gte } from "drizzle-orm";
import { startIngestionRun, completeIngestionRun } from "./terra-distress-service";

const MLS_ENABLED = process.env["TERRA_MLS_ENABLED"] !== "false";
const COSTAR_ENABLED = process.env["TERRA_COSTAR_ENABLED"] !== "false";
const COMPSTAK_ENABLED = process.env["TERRA_COMPSTAK_ENABLED"] !== "false";

export async function runMlsListingSync(): Promise<{
  fetched: number;
  upserted: number;
  errors: number;
  demoMode: boolean;
}> {
  if (!MLS_ENABLED) {
    logger.info("MLS sync skipped — terra_mls_enabled is false");
    return { fetched: 0, upserted: 0, errors: 0, demoMode: false };
  }

  const runId = await startIngestionRun("mls_listing_sync");
  const adapter = services.resoMls;
  const isDemoMode = adapter.isDemoMode;

  logger.info({ isDemoMode, status: adapter.status }, "Starting MLS listing sync");

  let lastTimestamp: string | null = null;

  if (!isDemoMode) {
    const mostRecent = await db
      .select({ modificationTimestamp: terraMlsListingsTable.modificationTimestamp })
      .from(terraMlsListingsTable)
      .orderBy(desc(terraMlsListingsTable.modificationTimestamp))
      .limit(1);
    lastTimestamp = mostRecent[0]?.modificationTimestamp ?? null;
  }

  const listings = isDemoMode
    ? adapter.getMockListings()
    : (await adapter.incrementalSync(lastTimestamp)).fetched > 0
      ? await adapter.queryListings({})
      : [];

  let upserted = 0;
  let errors = 0;

  for (const listing of listings) {
    try {
      const existing = await db
        .select({ id: terraMlsListingsTable.id })
        .from(terraMlsListingsTable)
        .where(eq(terraMlsListingsTable.listingKey, listing.listingKey))
        .limit(1);

      const postalCode = listing.postalCode || null;
      const county = listing.county || null;

      const distressCrossRef = await checkDistressCrossRef(listing.address, postalCode);

      const record: InsertTerraMlsListing = {
        listingKey: listing.listingKey,
        listingId: listing.listingId,
        mlsName: listing.mlsName,
        standardStatus: listing.standardStatus,
        listPrice: String(listing.listPrice),
        originalListPrice: listing.originalListPrice ? String(listing.originalListPrice) : null,
        address: listing.address,
        city: listing.city,
        stateOrProvince: listing.stateOrProvince,
        postalCode,
        county,
        latitude: listing.latitude != null ? String(listing.latitude) : null,
        longitude: listing.longitude != null ? String(listing.longitude) : null,
        propertyType: listing.propertyType,
        propertySubType: listing.propertySubType || null,
        bedroomsTotal: listing.bedroomsTotal,
        bathroomsTotalInteger: listing.bathroomsTotalInteger,
        livingArea: listing.livingArea,
        lotSizeSquareFeet: listing.lotSizeSquareFeet,
        yearBuilt: listing.yearBuilt,
        daysOnMarket: listing.daysOnMarket,
        modificationTimestamp: listing.modificationTimestamp,
        listingContractDate: listing.listingContractDate || null,
        media: listing.media,
        listAgentFullName: listing.listAgentFullName || null,
        listOfficeName: listing.listOfficeName || null,
        publicRemarks: listing.publicRemarks || null,
        hasDistressCrossRef: distressCrossRef.matched,
        distressPropertyId: distressCrossRef.propertyId,
        ingestSource: isDemoMode ? "demo" : "mls_sync",
        isActive: listing.standardStatus === "Active" || listing.standardStatus === "Pending" || listing.standardStatus === "Coming Soon",
      };

      if (existing.length > 0) {
        await db
          .update(terraMlsListingsTable)
          .set({ ...record, updatedAt: new Date(), lastSyncedAt: new Date() })
          .where(eq(terraMlsListingsTable.listingKey, listing.listingKey));
      } else {
        await db.insert(terraMlsListingsTable).values(record);
      }

      upserted++;
    } catch (err) {
      logger.warn({ err, listingKey: listing.listingKey }, "Failed to upsert MLS listing");
      errors++;
    }
  }

  await completeIngestionRun(runId, {
    recordsFetched: listings.length,
    recordsInserted: upserted,
    recordsSkipped: 0,
    recordsFailed: errors,
    alertsGenerated: 0,
    status: errors > 0 ? "partial" : "completed",
  });

  logger.info({ fetched: listings.length, upserted, errors, isDemoMode }, "MLS listing sync complete");
  return { fetched: listings.length, upserted, errors, demoMode: isDemoMode };
}

async function checkDistressCrossRef(
  address: string,
  postalCode: string | null
): Promise<{ matched: boolean; propertyId: number | null }> {
  try {
    const conditions = [
      ilike(terraDistressPropertiesTable.address, `%${address.split(",")[0]?.trim() ?? address}%`),
      eq(terraDistressPropertiesTable.isActive, true),
    ];
    if (postalCode) {
      conditions.push(eq(terraDistressPropertiesTable.zipCode, postalCode));
    }

    const match = await db
      .select({ id: terraDistressPropertiesTable.id })
      .from(terraDistressPropertiesTable)
      .where(and(...conditions))
      .limit(1);

    if (match.length > 0) {
      return { matched: true, propertyId: match[0]!.id };
    }
  } catch {
    // non-fatal
  }
  return { matched: false, propertyId: null };
}

export async function runCommercialDataRefresh(): Promise<{
  costar: { properties: number; comps: number; errors: number; demoMode: boolean };
  compstak: { leaseComps: number; saleComps: number; errors: number; demoMode: boolean };
}> {
  const result = {
    costar: { properties: 0, comps: 0, errors: 0, demoMode: false },
    compstak: { leaseComps: 0, saleComps: 0, errors: 0, demoMode: false },
  };

  if (COSTAR_ENABLED) {
    result.costar = await refreshCoStarData();
  }

  if (COMPSTAK_ENABLED) {
    result.compstak = await refreshCompStakData();
  }

  return result;
}

async function refreshCoStarData(): Promise<{ properties: number; comps: number; errors: number; demoMode: boolean }> {
  const adapter = services.costar;
  const isDemoMode = adapter.isDemoMode;

  logger.info({ isDemoMode }, "Starting CoStar data refresh");

  let properties = 0;
  let comps = 0;
  let errors = 0;

  try {
    const propList = isDemoMode ? adapter.getMockProperties() : await adapter.getProperties({ limit: 200 });

    for (const prop of propList) {
      try {
        const externalId = `costar-${prop.propertyId}`;
        const existing = await db
          .select({ id: terraCommercialPropertiesTable.id })
          .from(terraCommercialPropertiesTable)
          .where(eq(terraCommercialPropertiesTable.externalId, externalId))
          .limit(1);

        const record: InsertTerraCommercialProperty = {
          externalId,
          source: isDemoMode ? "demo" : "costar",
          propertyName: prop.propertyName,
          address: prop.address,
          city: prop.city,
          state: prop.state,
          zipCode: prop.zipCode,
          county: prop.county,
          latitude: prop.latitude != null ? String(prop.latitude) : null,
          longitude: prop.longitude != null ? String(prop.longitude) : null,
          propertyType: prop.propertyType,
          buildingClass: prop.buildingClass,
          rentableArea: prop.rentableArea,
          yearBuilt: prop.yearBuilt,
          stories: prop.stories,
          units: prop.units,
          parkingSpaces: prop.parkingSpaces,
          occupancyRate: prop.occupancyRate != null ? String(prop.occupancyRate) : null,
          marketVacancyRate: prop.marketVacancyRate != null ? String(prop.marketVacancyRate) : null,
          askingRentPerSqft: prop.askingRentPerSqft != null ? String(prop.askingRentPerSqft) : null,
          effectiveRentPerSqft: prop.effectiveRentPerSqft != null ? String(prop.effectiveRentPerSqft) : null,
          capRate: prop.capRate != null ? String(prop.capRate) : null,
          lastSalePrice: prop.lastSalePrice != null ? String(prop.lastSalePrice) : null,
          lastSaleDate: prop.lastSaleDate,
          tenants: prop.tenants,
          submarketName: prop.submarketName,
          ownerName: prop.ownerName,
          ownerType: prop.ownerType,
          isActive: true,
        };

        if (existing.length > 0) {
          await db
            .update(terraCommercialPropertiesTable)
            .set({ ...record, updatedAt: new Date(), lastSyncedAt: new Date() })
            .where(eq(terraCommercialPropertiesTable.externalId, externalId));
        } else {
          await db.insert(terraCommercialPropertiesTable).values(record);
        }

        properties++;
      } catch (err) {
        logger.warn({ err, propertyId: prop.propertyId }, "Failed to upsert CoStar property");
        errors++;
      }
    }

    const saleCompList = isDemoMode ? adapter.getMockSaleComps() : await adapter.getSaleComps({ limit: 100 });

    for (const comp of saleCompList) {
      try {
        const externalId = `costar-sale-${comp.compId}`;
        const existing = await db
          .select({ id: terraCommercialCompsTable.id })
          .from(terraCommercialCompsTable)
          .where(eq(terraCommercialCompsTable.externalId, externalId))
          .limit(1);

        const record: InsertTerraCommercialComp = {
          externalId,
          source: isDemoMode ? "demo" : "costar",
          compType: "sale",
          address: comp.address,
          city: comp.city,
          state: comp.state,
          zipCode: comp.zipCode,
          propertyType: comp.propertyType,
          rentableArea: comp.rentableArea,
          salePrice: String(comp.salePrice),
          pricePerSqft: comp.pricePerSqft != null ? String(comp.pricePerSqft) : null,
          capRate: comp.capRate != null ? String(comp.capRate) : null,
          transactionDate: comp.saleDate,
          buyerName: comp.buyerName,
          sellerName: comp.sellerName,
        };

        if (existing.length > 0) {
          await db
            .update(terraCommercialCompsTable)
            .set({ ...record, updatedAt: new Date() })
            .where(eq(terraCommercialCompsTable.externalId, externalId));
        } else {
          await db.insert(terraCommercialCompsTable).values(record);
        }

        comps++;
      } catch (err) {
        logger.warn({ err, compId: comp.compId }, "Failed to upsert CoStar sale comp");
        errors++;
      }
    }
  } catch (err) {
    logger.error({ err }, "CoStar refresh failed");
    errors++;
  }

  logger.info({ properties, comps, errors, isDemoMode }, "CoStar refresh complete");
  return { properties, comps, errors, demoMode: isDemoMode };
}

async function refreshCompStakData(): Promise<{ leaseComps: number; saleComps: number; errors: number; demoMode: boolean }> {
  const adapter = services.compstak;
  const isDemoMode = adapter.isDemoMode;

  logger.info({ isDemoMode }, "Starting CompStak data refresh");

  let leaseComps = 0;
  let saleComps = 0;
  let errors = 0;

  try {
    const leaseList = isDemoMode ? adapter.getMockLeaseComps() : await adapter.getLeaseComps({ limit: 200 });

    for (const comp of leaseList) {
      try {
        const externalId = `compstak-lease-${comp.compId}`;
        const existing = await db
          .select({ id: terraCommercialCompsTable.id })
          .from(terraCommercialCompsTable)
          .where(eq(terraCommercialCompsTable.externalId, externalId))
          .limit(1);

        const record: InsertTerraCommercialComp = {
          externalId,
          source: isDemoMode ? "demo" : "compstak",
          compType: "lease",
          address: comp.address,
          city: comp.city,
          state: comp.state,
          zipCode: comp.zipCode,
          propertyType: comp.propertyType,
          tenantName: comp.tenantName,
          tenantIndustry: comp.tenantIndustry,
          transactionType: comp.transactionType,
          leasedSqft: comp.leasedSqft,
          startingRentPerSqft: comp.startingRentPerSqft != null ? String(comp.startingRentPerSqft) : null,
          effectiveRentPerSqft: comp.effectiveRentPerSqft != null ? String(comp.effectiveRentPerSqft) : null,
          freeRentMonths: comp.freeRentMonths,
          tenantImprovementAllowance: comp.tenantImprovementAllowance != null ? String(comp.tenantImprovementAllowance) : null,
          leaseTermMonths: comp.leaseTermMonths,
          transactionDate: comp.leaseStartDate,
          leaseExpirationDate: comp.leaseExpirationDate,
          floorOccupied: comp.floorOccupied,
          buildingClass: comp.buildingClass,
          landlordName: comp.landlordName,
          submarketName: comp.submarketName,
        };

        if (existing.length > 0) {
          await db
            .update(terraCommercialCompsTable)
            .set({ ...record, updatedAt: new Date() })
            .where(eq(terraCommercialCompsTable.externalId, externalId));
        } else {
          await db.insert(terraCommercialCompsTable).values(record);
        }

        leaseComps++;
      } catch (err) {
        logger.warn({ err, compId: comp.compId }, "Failed to upsert CompStak lease comp");
        errors++;
      }
    }

    const saleList = isDemoMode ? adapter.getMockSaleComps() : await adapter.getSaleComps({ limit: 100 });

    for (const comp of saleList) {
      try {
        const externalId = `compstak-sale-${comp.compId}`;
        const existing = await db
          .select({ id: terraCommercialCompsTable.id })
          .from(terraCommercialCompsTable)
          .where(eq(terraCommercialCompsTable.externalId, externalId))
          .limit(1);

        const record: InsertTerraCommercialComp = {
          externalId,
          source: isDemoMode ? "demo" : "compstak",
          compType: "sale",
          address: comp.address,
          city: comp.city,
          state: comp.state,
          zipCode: comp.zipCode,
          propertyType: comp.propertyType,
          rentableArea: comp.rentableArea,
          salePrice: String(comp.salePrice),
          pricePerSqft: comp.pricePerSqft != null ? String(comp.pricePerSqft) : null,
          capRate: comp.capRate != null ? String(comp.capRate) : null,
          transactionDate: comp.saleDate,
          buyerName: comp.buyerName,
          sellerName: comp.sellerName,
          buyerType: comp.buyerType,
          financeType: comp.financeType,
        };

        if (existing.length > 0) {
          await db
            .update(terraCommercialCompsTable)
            .set({ ...record, updatedAt: new Date() })
            .where(eq(terraCommercialCompsTable.externalId, externalId));
        } else {
          await db.insert(terraCommercialCompsTable).values(record);
        }

        saleComps++;
      } catch (err) {
        logger.warn({ err, compId: comp.compId }, "Failed to upsert CompStak sale comp");
        errors++;
      }
    }
  } catch (err) {
    logger.error({ err }, "CompStak refresh failed");
    errors++;
  }

  logger.info({ leaseComps, saleComps, errors, isDemoMode }, "CompStak refresh complete");
  return { leaseComps, saleComps, errors, demoMode: isDemoMode };
}

export async function getMlsListings(params: {
  status?: string;
  postalCode?: string;
  propertyType?: string;
  mlsName?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [eq(terraMlsListingsTable.isActive, true)];

  if (params.status) {
    conditions.push(eq(terraMlsListingsTable.standardStatus, params.status as "Active" | "Pending" | "Closed" | "Expired" | "Withdrawn" | "Coming Soon"));
  }
  if (params.postalCode) {
    conditions.push(eq(terraMlsListingsTable.postalCode, params.postalCode));
  }
  if (params.propertyType) {
    conditions.push(ilike(terraMlsListingsTable.propertyType, `%${params.propertyType}%`));
  }
  if (params.mlsName) {
    conditions.push(ilike(terraMlsListingsTable.mlsName, `%${params.mlsName}%`));
  }

  const rows = await db
    .select()
    .from(terraMlsListingsTable)
    .where(and(...conditions))
    .orderBy(desc(terraMlsListingsTable.modificationTimestamp))
    .limit(params.limit ?? 100)
    .offset(params.offset ?? 0);

  return rows.map(r => ({
    id: r.listingKey,
    listingKey: r.listingKey,
    listingId: r.listingId,
    mlsName: r.mlsName,
    source: "mls" as const,
    standardStatus: r.standardStatus,
    listPrice: Number(r.listPrice),
    originalListPrice: r.originalListPrice ? Number(r.originalListPrice) : null,
    address: r.address,
    city: r.city,
    stateOrProvince: r.stateOrProvince,
    postalCode: r.postalCode,
    county: r.county,
    latitude: r.latitude ? Number(r.latitude) : null,
    longitude: r.longitude ? Number(r.longitude) : null,
    propertyType: r.propertyType,
    propertySubType: r.propertySubType,
    bedroomsTotal: r.bedroomsTotal,
    bathroomsTotalInteger: r.bathroomsTotalInteger,
    livingArea: r.livingArea,
    lotSizeSquareFeet: r.lotSizeSquareFeet,
    yearBuilt: r.yearBuilt,
    daysOnMarket: r.daysOnMarket,
    modificationTimestamp: r.modificationTimestamp,
    listingContractDate: r.listingContractDate,
    media: r.media as Array<{ mediaUrl: string; mediaType: string; order: number }>,
    listAgentFullName: r.listAgentFullName,
    listOfficeName: r.listOfficeName,
    publicRemarks: r.publicRemarks,
    hasDistressCrossRef: r.hasDistressCrossRef,
    distressPropertyId: r.distressPropertyId,
    lastSyncedAt: r.lastSyncedAt.toISOString(),
  }));
}

export async function getCommercialProperties(params: {
  propertyType?: string;
  zipCode?: string;
  source?: string;
  buildingClass?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [eq(terraCommercialPropertiesTable.isActive, true)];

  if (params.propertyType) {
    conditions.push(ilike(terraCommercialPropertiesTable.propertyType, `%${params.propertyType}%`));
  }
  if (params.zipCode) {
    conditions.push(eq(terraCommercialPropertiesTable.zipCode, params.zipCode));
  }
  if (params.source) {
    conditions.push(eq(terraCommercialPropertiesTable.source, params.source as "costar" | "compstak" | "manual" | "demo"));
  }
  if (params.buildingClass) {
    conditions.push(eq(terraCommercialPropertiesTable.buildingClass, params.buildingClass as "Class A" | "Class B" | "Class C"));
  }

  const rows = await db
    .select()
    .from(terraCommercialPropertiesTable)
    .where(and(...conditions))
    .orderBy(desc(terraCommercialPropertiesTable.lastSyncedAt))
    .limit(params.limit ?? 100)
    .offset(params.offset ?? 0);

  return rows.map(r => ({
    id: r.externalId ?? String(r.id),
    source: r.source,
    propertyName: r.propertyName,
    address: r.address,
    city: r.city,
    state: r.state,
    zipCode: r.zipCode,
    county: r.county,
    latitude: r.latitude ? Number(r.latitude) : null,
    longitude: r.longitude ? Number(r.longitude) : null,
    propertyType: r.propertyType,
    buildingClass: r.buildingClass,
    rentableArea: r.rentableArea,
    yearBuilt: r.yearBuilt,
    stories: r.stories,
    units: r.units,
    parkingSpaces: r.parkingSpaces,
    occupancyRate: r.occupancyRate ? Number(r.occupancyRate) : null,
    marketVacancyRate: r.marketVacancyRate ? Number(r.marketVacancyRate) : null,
    askingRentPerSqft: r.askingRentPerSqft ? Number(r.askingRentPerSqft) : null,
    effectiveRentPerSqft: r.effectiveRentPerSqft ? Number(r.effectiveRentPerSqft) : null,
    capRate: r.capRate ? Number(r.capRate) : null,
    lastSalePrice: r.lastSalePrice ? Number(r.lastSalePrice) : null,
    lastSaleDate: r.lastSaleDate,
    tenants: r.tenants as Array<{ tenantName: string; leaseExpiration: string; leasedSqft: number; floorOccupied: string }>,
    submarketName: r.submarketName,
    ownerName: r.ownerName,
    ownerType: r.ownerType,
    lastSyncedAt: r.lastSyncedAt.toISOString(),
  }));
}

export async function getCommercialComps(params: {
  compType?: "lease" | "sale";
  propertyType?: string;
  source?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (params.compType) {
    conditions.push(eq(terraCommercialCompsTable.compType, params.compType));
  }
  if (params.propertyType) {
    conditions.push(ilike(terraCommercialCompsTable.propertyType, `%${params.propertyType}%`));
  }
  if (params.source) {
    conditions.push(eq(terraCommercialCompsTable.source, params.source as "costar" | "compstak" | "manual" | "demo"));
  }

  const rows = await db
    .select()
    .from(terraCommercialCompsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(terraCommercialCompsTable.transactionDate))
    .limit(params.limit ?? 100)
    .offset(params.offset ?? 0);

  return rows.map(r => ({
    id: r.externalId ?? String(r.id),
    source: r.source,
    compType: r.compType,
    address: r.address,
    city: r.city,
    state: r.state,
    zipCode: r.zipCode,
    propertyType: r.propertyType,
    tenantName: r.tenantName,
    tenantIndustry: r.tenantIndustry,
    transactionType: r.transactionType,
    leasedSqft: r.leasedSqft,
    rentableArea: r.rentableArea,
    startingRentPerSqft: r.startingRentPerSqft ? Number(r.startingRentPerSqft) : null,
    effectiveRentPerSqft: r.effectiveRentPerSqft ? Number(r.effectiveRentPerSqft) : null,
    salePrice: r.salePrice ? Number(r.salePrice) : null,
    pricePerSqft: r.pricePerSqft ? Number(r.pricePerSqft) : null,
    capRate: r.capRate ? Number(r.capRate) : null,
    freeRentMonths: r.freeRentMonths,
    tenantImprovementAllowance: r.tenantImprovementAllowance ? Number(r.tenantImprovementAllowance) : null,
    leaseTermMonths: r.leaseTermMonths,
    transactionDate: r.transactionDate,
    leaseExpirationDate: r.leaseExpirationDate,
    floorOccupied: r.floorOccupied,
    buildingClass: r.buildingClass,
    landlordName: r.landlordName,
    buyerName: r.buyerName,
    sellerName: r.sellerName,
    buyerType: r.buyerType,
    financeType: r.financeType,
    submarketName: r.submarketName,
  }));
}

export function getEnterpriseFeatureFlags() {
  return {
    terra_mls_enabled: MLS_ENABLED,
    terra_costar_enabled: COSTAR_ENABLED,
    terra_compstak_enabled: COMPSTAK_ENABLED,
    mls_connector_status: services.resoMls.status,
    costar_connector_status: services.costar.status,
    compstak_connector_status: services.compstak.status,
  };
}
