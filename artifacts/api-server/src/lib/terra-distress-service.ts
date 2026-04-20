import {
  db,
  type InsertTerraDistressAlert,
  type InsertTerraDistressProperty,
  type TerraDistressProperty,
  terraDistressAlertsTable,
  terraDistressPropertiesTable,
  terraIngestionRunsTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, gte, ilike, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import { logger } from './logger';

export interface DistressSearchParams {
  borough?: string;
  county?: string;
  zip?: string;
  propertyType?: string;
  distressType?: string;
  minValue?: number;
  maxValue?: number;
  sort?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

function toPropertyShape(row: TerraDistressProperty) {
  return {
    id: row.externalId ?? String(row.id),
    address: row.address,
    borough: row.borough,
    county: row.county,
    zipCode: row.zipCode,
    propertyType: row.propertyType,
    distressType: row.distressType,
    stage: row.stage,
    estimatedValue: Number(row.estimatedValue),
    debtAmount: row.debtAmount !== null ? Number(row.debtAmount) : undefined,
    lienAmount: row.lienAmount !== null ? Number(row.lienAmount) : undefined,
    auctionDate: row.auctionDate ?? undefined,
    filingDate: row.filingDate,
    lastActivityDate: row.lastActivityDate,
    ownerName: row.ownerName,
    ownerType: row.ownerType,
    opportunityScore: row.opportunityScore,
    confidenceLevel: row.confidenceLevel,
    scoreRationale: row.scoreRationale,
    latitude: row.latitude !== null ? Number(row.latitude) : 0,
    longitude: row.longitude !== null ? Number(row.longitude) : 0,
    sqft: row.sqft ?? undefined,
    yearBuilt: row.yearBuilt ?? undefined,
    beds: row.beds ?? undefined,
    baths: row.baths ?? undefined,
    daysInDistress: row.daysInDistress,
    tags: (row.tags as string[]) ?? [],
    timeline: (row.timeline as Array<{ date: string; type: string; description: string }>) ?? [],
    priceHistory: row.priceHistory as Array<{ date: string; price: number }> | undefined,
    connectorSource: row.connectorSource,
    notes: row.notes ?? undefined,
    linkedDealId: row.linkedDealId ?? undefined,
  };
}

export async function searchDistressedProperties(params: DistressSearchParams) {
  const conditions = [eq(terraDistressPropertiesTable.isActive, true)];

  if (params.borough) {
    conditions.push(
      eq(terraDistressPropertiesTable.borough, params.borough as TerraDistressProperty['borough']),
    );
  }
  if (params.county) {
    conditions.push(ilike(terraDistressPropertiesTable.county, `%${params.county}%`));
  }
  if (params.zip) {
    conditions.push(eq(terraDistressPropertiesTable.zipCode, params.zip));
  }
  if (params.propertyType) {
    conditions.push(
      eq(
        terraDistressPropertiesTable.propertyType,
        params.propertyType as TerraDistressProperty['propertyType'],
      ),
    );
  }
  if (params.distressType) {
    conditions.push(
      eq(
        terraDistressPropertiesTable.distressType,
        params.distressType as TerraDistressProperty['distressType'],
      ),
    );
  }
  if (params.minValue !== undefined) {
    conditions.push(gte(terraDistressPropertiesTable.estimatedValue, String(params.minValue)));
  }
  if (params.maxValue !== undefined) {
    conditions.push(lte(terraDistressPropertiesTable.estimatedValue, String(params.maxValue)));
  }
  if (params.q) {
    const tsQuery = params.q.trim().split(/\s+/).join(' & ');
    conditions.push(
      or(
        sql`to_tsvector('english', ${terraDistressPropertiesTable.address} || ' ' || ${terraDistressPropertiesTable.ownerName} || ' ' || COALESCE(${terraDistressPropertiesTable.zipCode}, '') || ' ' || ${terraDistressPropertiesTable.borough}) @@ to_tsquery('english', ${tsQuery})`,
        ilike(terraDistressPropertiesTable.address, `%${params.q}%`),
        ilike(terraDistressPropertiesTable.ownerName, `%${params.q}%`),
      )!,
    );
  }

  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;
  const whereClause = and(...conditions);

  let rows: TerraDistressProperty[];

  if (params.sort === 'newest') {
    rows = (await db
      .select()
      .from(terraDistressPropertiesTable)
      .where(whereClause)
      .orderBy(desc(terraDistressPropertiesTable.filingDate))
      .limit(limit)
      .offset(offset)) as TerraDistressProperty[];
  } else if (params.sort === 'highest-value') {
    rows = (await db
      .select()
      .from(terraDistressPropertiesTable)
      .where(whereClause)
      .orderBy(desc(terraDistressPropertiesTable.estimatedValue))
      .limit(limit)
      .offset(offset)) as TerraDistressProperty[];
  } else if (params.sort === 'highest-risk') {
    rows = (await db
      .select()
      .from(terraDistressPropertiesTable)
      .where(whereClause)
      .orderBy(desc(terraDistressPropertiesTable.opportunityScore))
      .limit(limit)
      .offset(offset)) as TerraDistressProperty[];
  } else if (params.sort === 'closest-auction') {
    rows = (await db
      .select()
      .from(terraDistressPropertiesTable)
      .where(whereClause)
      .orderBy(
        sql`CASE WHEN ${terraDistressPropertiesTable.auctionDate} IS NULL THEN 1 ELSE 0 END`,
        asc(terraDistressPropertiesTable.auctionDate),
      )
      .limit(limit)
      .offset(offset)) as TerraDistressProperty[];
  } else {
    rows = (await db
      .select()
      .from(terraDistressPropertiesTable)
      .where(whereClause)
      .orderBy(desc(terraDistressPropertiesTable.opportunityScore))
      .limit(limit)
      .offset(offset)) as TerraDistressProperty[];
  }

  return rows.map((r) => toPropertyShape(r));
}

export async function getDistressPropertyById(idOrExternal: string) {
  const byExternal = await db
    .select()
    .from(terraDistressPropertiesTable)
    .where(
      and(
        eq(terraDistressPropertiesTable.externalId, idOrExternal),
        eq(terraDistressPropertiesTable.isActive, true),
      ),
    )
    .limit(1);

  if (byExternal.length > 0) return toPropertyShape(byExternal[0]!);

  const numericId = parseInt(idOrExternal, 10);
  if (!isNaN(numericId)) {
    const byId = await db
      .select()
      .from(terraDistressPropertiesTable)
      .where(
        and(
          eq(terraDistressPropertiesTable.id, numericId),
          eq(terraDistressPropertiesTable.isActive, true),
        ),
      )
      .limit(1);
    if (byId.length > 0) return toPropertyShape(byId[0]!);
  }

  return null;
}

export interface AlertSearchParams {
  borough?: string;
  type?: string;
  severity?: string;
  limit?: number;
}

export async function searchDistressAlerts(params: AlertSearchParams) {
  const conditions = [];

  if (params.borough) {
    conditions.push(ilike(terraDistressAlertsTable.borough, params.borough));
  }
  if (params.type) {
    conditions.push(
      eq(terraDistressAlertsTable.alertType, params.type as TerraDistressAlert['alertType']),
    );
  }
  if (params.severity) {
    conditions.push(
      eq(terraDistressAlertsTable.severity, params.severity as TerraDistressAlert['severity']),
    );
  }

  const query = db
    .select()
    .from(terraDistressAlertsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(terraDistressAlertsTable.triggeredAt))
    .limit(params.limit ?? 50);

  const rows = await query;

  return rows.map((row) => ({
    id: row.externalId ?? String(row.id),
    type: row.alertType,
    message: row.message,
    propertyId: row.propertyExternalId ?? (row.propertyId ? String(row.propertyId) : undefined),
    severity: row.severity,
    timestamp: row.triggeredAt.toISOString(),
    zipCode: row.zipCode ?? undefined,
    borough: row.borough ?? undefined,
  }));
}

type TerraDistressAlert = typeof terraDistressAlertsTable.$inferSelect;

export async function generateAlertsForProperty(
  property: InsertTerraDistressProperty,
  dbPropertyId: number,
  externalId: string,
): Promise<number> {
  const alerts: InsertTerraDistressAlert[] = [];
  const today = new Date();

  if (property.distressType === 'auction' && property.auctionDate) {
    const auctionDate = new Date(property.auctionDate);
    const daysUntilAuction = Math.ceil((auctionDate.getTime() - today.getTime()) / 86400000);

    if (daysUntilAuction >= 0 && daysUntilAuction <= 30) {
      alerts.push({
        externalId: `alert-auction-${externalId}`,
        propertyId: dbPropertyId,
        propertyExternalId: externalId,
        alertType: 'auction',
        message: `${property.address} auction in ${daysUntilAuction} days — ${property.borough} ${property.propertyType}`,
        severity: 'critical',
        borough: property.borough ?? undefined,
        zipCode: property.zipCode ?? undefined,
        metadata: { auctionDate: property.auctionDate, daysUntil: daysUntilAuction },
      });
    }
  }

  if (property.distressType === 'foreclosure' || property.distressType === 'pre-foreclosure') {
    const filingDate = property.filingDate ? new Date(property.filingDate) : null;
    const daysSinceFiling = filingDate
      ? Math.ceil((today.getTime() - filingDate.getTime()) / 86400000)
      : null;

    if (daysSinceFiling !== null && daysSinceFiling <= 14) {
      alerts.push({
        externalId: `alert-foreclosure-${externalId}`,
        propertyId: dbPropertyId,
        propertyExternalId: externalId,
        alertType: 'foreclosure',
        message: `New ${property.distressType} filed in ZIP ${property.zipCode} — ${property.address}`,
        severity: 'high',
        borough: property.borough ?? undefined,
        zipCode: property.zipCode ?? undefined,
        metadata: { filingDate: property.filingDate, daysAgo: daysSinceFiling },
      });
    }
  }

  if (
    property.distressType === 'tax-lien' &&
    property.lienAmount !== undefined &&
    property.lienAmount !== null
  ) {
    const lienVal = Number(property.lienAmount);
    if (lienVal >= 100000) {
      alerts.push({
        externalId: `alert-lien-${externalId}`,
        propertyId: dbPropertyId,
        propertyExternalId: externalId,
        alertType: 'lien',
        message: `Tax lien escalated — ${property.address}: $${lienVal.toLocaleString()}`,
        severity: lienVal >= 200000 ? 'high' : 'medium',
        borough: property.borough ?? undefined,
        zipCode: property.zipCode ?? undefined,
        metadata: { lienAmount: lienVal },
      });
    }
  }

  if (property.distressType === 'reo') {
    alerts.push({
      externalId: `alert-reo-${externalId}`,
      propertyId: dbPropertyId,
      propertyExternalId: externalId,
      alertType: 'reo',
      message: `REO/Bank-owned property available — ${property.address}, ${property.borough}`,
      severity: 'medium',
      borough: property.borough ?? undefined,
      zipCode: property.zipCode ?? undefined,
      metadata: { ownerName: property.ownerName },
    });
  }

  if (alerts.length === 0) return 0;

  let inserted = 0;
  for (const alert of alerts) {
    try {
      const result = await db
        .insert(terraDistressAlertsTable)
        .values(alert)
        .onConflictDoNothing({ target: terraDistressAlertsTable.externalId })
        .returning({ id: terraDistressAlertsTable.id });
      if (result.length > 0) inserted++;
    } catch (err) {
      logger.warn({ err, alertId: alert.externalId }, 'Failed to insert distress alert');
    }
  }

  return inserted;
}

export async function normalizeAddress(raw: string): Promise<string> {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bAVE\b/gi, 'Ave')
    .replace(/\bST\b/gi, 'St')
    .replace(/\bBLVD\b/gi, 'Blvd')
    .replace(/\bRD\b/gi, 'Rd')
    .replace(/\bPL\b/gi, 'Pl')
    .replace(/\bDR\b/gi, 'Dr')
    .replace(/\bLN\b/gi, 'Ln')
    .replace(/\bCT\b/gi, 'Ct')
    .replace(/\bTERR\b/gi, 'Terrace')
    .replace(/\bPKWY\b/gi, 'Pkwy');
}

export function mapBoroughFromCounty(
  county: string,
): 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island' | null {
  const c = county.toLowerCase().trim();
  if (c === 'new york' || c === 'new york county') return 'Manhattan';
  if (c === 'kings' || c === 'kings county') return 'Brooklyn';
  if (c === 'queens' || c === 'queens county') return 'Queens';
  if (c === 'bronx' || c === 'bronx county') return 'Bronx';
  if (c === 'richmond' || c === 'richmond county') return 'Staten Island';
  return null;
}

export function mapCountyFromBorough(borough: string): string {
  const b = borough.toLowerCase().trim();
  if (b === 'manhattan') return 'New York';
  if (b === 'brooklyn') return 'Kings';
  if (b === 'queens') return 'Queens';
  if (b === 'bronx') return 'Bronx';
  if (b === 'staten island') return 'Richmond';
  return borough;
}

export function classifyDistressType(
  source: string,
  stage?: string,
): 'pre-foreclosure' | 'foreclosure' | 'auction' | 'reo' | 'tax-lien' | 'expired-listing' {
  const s = source.toLowerCase();
  const st = (stage ?? '').toLowerCase();

  if (s.includes('tax lien') || s.includes('dof') || s.includes('dept of finance'))
    return 'tax-lien';
  if (
    s.includes('reo') ||
    s.includes('fdic') ||
    s.includes('bank-owned') ||
    st.includes('bank-owned')
  )
    return 'reo';
  if (s.includes('auction') || st.includes('auction') || st.includes('scheduled')) return 'auction';
  if (s.includes('lis pendens') || st.includes('lis-pendens') || st.includes('filing'))
    return 'pre-foreclosure';
  if (s.includes('foreclosure') || st.includes('foreclosure') || st.includes('notice'))
    return 'foreclosure';
  if (s.includes('expired') || st.includes('expired')) return 'expired-listing';
  if (s.includes('hpd') || s.includes('violation')) return 'pre-foreclosure';

  return 'pre-foreclosure';
}

export async function upsertDistressProperty(
  data: InsertTerraDistressProperty,
  runId?: number,
): Promise<{ dbId: number; isNew: boolean }> {
  if (runId !== undefined) {
    data.ingestRunId = runId;
  }

  if (data.externalId) {
    const byExternal = await db
      .select({ id: terraDistressPropertiesTable.id })
      .from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.externalId, data.externalId))
      .limit(1);

    if (byExternal.length > 0) {
      await db
        .update(terraDistressPropertiesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(terraDistressPropertiesTable.id, byExternal[0]!.id));
      return { dbId: byExternal[0]!.id, isNew: false };
    }
  }

  if (data.address) {
    const normalizedAddr = data.address.trim().toLowerCase().replace(/\s+/g, ' ');
    const addrConditions: ReturnType<typeof eq>[] = [
      sql`lower(trim(${terraDistressPropertiesTable.address})) = ${normalizedAddr}` as unknown as ReturnType<
        typeof eq
      >,
    ];
    if (data.zipCode) {
      addrConditions.push(eq(terraDistressPropertiesTable.zipCode, data.zipCode));
    } else if (data.borough) {
      addrConditions.push(
        eq(terraDistressPropertiesTable.borough, data.borough as TerraDistressProperty['borough']),
      );
    }

    const byAddress = await db
      .select({
        id: terraDistressPropertiesTable.id,
        externalId: terraDistressPropertiesTable.externalId,
      })
      .from(terraDistressPropertiesTable)
      .where(and(...addrConditions))
      .limit(1);

    if (byAddress.length > 0) {
      const existingRow = byAddress[0]!;
      await db
        .update(terraDistressPropertiesTable)
        .set({
          ...data,
          externalId: existingRow.externalId ?? data.externalId,
          updatedAt: new Date(),
        })
        .where(eq(terraDistressPropertiesTable.id, existingRow.id));
      return { dbId: existingRow.id, isNew: false };
    }
  }

  const [inserted] = await db
    .insert(terraDistressPropertiesTable)
    .values(data)
    .returning({ id: terraDistressPropertiesTable.id });

  return { dbId: inserted!.id, isNew: true };
}

export async function startIngestionRun(
  source: string,
  metadata?: Record<string, unknown>,
): Promise<number> {
  const [run] = await db
    .insert(terraIngestionRunsTable)
    .values({ source, status: 'running', metadata: metadata ?? {} })
    .returning({ id: terraIngestionRunsTable.id });
  return run!.id;
}

export async function completeIngestionRun(
  runId: number,
  stats: {
    recordsFetched: number;
    recordsInserted: number;
    recordsSkipped: number;
    recordsFailed: number;
    alertsGenerated: number;
    errorMessage?: string;
    status?: 'completed' | 'failed' | 'partial';
  },
) {
  await db
    .update(terraIngestionRunsTable)
    .set({
      status: stats.status ?? 'completed',
      recordsFetched: stats.recordsFetched,
      recordsInserted: stats.recordsInserted,
      recordsSkipped: stats.recordsSkipped,
      recordsFailed: stats.recordsFailed,
      alertsGenerated: stats.alertsGenerated,
      errorMessage: stats.errorMessage,
      completedAt: new Date(),
    })
    .where(eq(terraIngestionRunsTable.id, runId));
}

export async function getIngestionStats() {
  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(terraDistressPropertiesTable)
    .where(eq(terraDistressPropertiesTable.isActive, true));

  const byBorough = await db
    .select({
      borough: terraDistressPropertiesTable.borough,
      count: sql<number>`count(*)::int`,
    })
    .from(terraDistressPropertiesTable)
    .where(eq(terraDistressPropertiesTable.isActive, true))
    .groupBy(terraDistressPropertiesTable.borough);

  const byType = await db
    .select({
      distressType: terraDistressPropertiesTable.distressType,
      count: sql<number>`count(*)::int`,
    })
    .from(terraDistressPropertiesTable)
    .where(eq(terraDistressPropertiesTable.isActive, true))
    .groupBy(terraDistressPropertiesTable.distressType);

  const recentRuns = await db
    .select()
    .from(terraIngestionRunsTable)
    .orderBy(desc(terraIngestionRunsTable.startedAt))
    .limit(10);

  return {
    totalProperties: total?.count ?? 0,
    byBorough: Object.fromEntries(byBorough.map((r) => [r.borough, r.count])),
    byDistressType: Object.fromEntries(byType.map((r) => [r.distressType, r.count])),
    recentRuns,
  };
}
