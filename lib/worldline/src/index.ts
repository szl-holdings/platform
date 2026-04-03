import {
  db,
  worldlineSourceRegistryTable,
  worldlineFetchLogsTable,
  worldlineSignalPublicationsTable,
  type InsertWorldlineSource,
  type WorldlineSource,
  type WorldlineFetchLog,
  type WorldlineSourceType,
  type WorldlineFreshnessCadence,
  type WorldlineSourceStatus,
} from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

export type { WorldlineSource, WorldlineFetchLog, WorldlineSourceType, WorldlineFreshnessCadence, WorldlineSourceStatus };

export interface RegisterSourceParams {
  orgId?: number | null;
  slug: string;
  name: string;
  description?: string;
  sourceType: WorldlineSourceType;
  domain: string;
  freshnessCadence?: WorldlineFreshnessCadence;
  confidenceBaseline?: number;
  connectionConfig?: Record<string, unknown>;
  normalizationConfig?: Record<string, unknown>;
  createdBy?: number | null;
  metadata?: Record<string, unknown>;
}

export interface FetchResult {
  status: "success" | "partial" | "failed" | "skipped";
  recordsReceived: number;
  recordsNormalized: number;
  recordsRejected: number;
  latencyMs?: number;
  errorMessage?: string;
  normalizedRecords?: unknown[];
  confidenceScore?: number;
}

export interface NormalizationPipeline<TRaw, TNormalized> {
  sourceSlug: string;
  normalize(raw: TRaw[]): Promise<{ records: TNormalized[]; rejected: number }>;
  validate?(record: TNormalized): boolean;
}

function computeFreshnessScore(
  lastSuccessAt: Date | null,
  cadence: WorldlineFreshnessCadence,
): number {
  if (!lastSuccessAt) return 0.0;
  const ageMs = Date.now() - lastSuccessAt.getTime();
  const cadenceMs: Record<WorldlineFreshnessCadence, number> = {
    realtime: 60 * 1000,
    minutely: 60 * 1000,
    hourly: 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    on_demand: Infinity,
  };
  const maxAge = cadenceMs[cadence] ?? cadenceMs.daily;
  if (maxAge === Infinity) return 1.0;
  const score = Math.max(0, 1 - ageMs / (maxAge * 2));
  return Math.round(score * 100) / 100;
}

export async function registerSource(params: RegisterSourceParams): Promise<WorldlineSource> {
  const [existing] = await db
    .select()
    .from(worldlineSourceRegistryTable)
    .where(
      and(
        params.orgId != null
          ? eq(worldlineSourceRegistryTable.orgId, params.orgId)
          : sql`${worldlineSourceRegistryTable.orgId} IS NULL`,
        eq(worldlineSourceRegistryTable.slug, params.slug),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(worldlineSourceRegistryTable)
      .set({
        name: params.name,
        description: params.description ?? null,
        sourceType: params.sourceType,
        freshnessCadence: params.freshnessCadence ?? "daily",
        confidenceBaseline: params.confidenceBaseline ?? 0.7,
        connectionConfig: params.connectionConfig ?? {},
        normalizationConfig: params.normalizationConfig ?? {},
        metadata: params.metadata ?? {},
        updatedAt: new Date(),
      })
      .where(eq(worldlineSourceRegistryTable.id, existing.id))
      .returning();
    return updated;
  }

  const [source] = await db.insert(worldlineSourceRegistryTable).values({
    orgId: params.orgId ?? null,
    slug: params.slug,
    name: params.name,
    description: params.description ?? null,
    sourceType: params.sourceType,
    domain: params.domain,
    status: "pending_setup",
    freshnessCadence: params.freshnessCadence ?? "daily",
    confidenceBaseline: params.confidenceBaseline ?? 0.7,
    connectionConfig: params.connectionConfig ?? {},
    normalizationConfig: params.normalizationConfig ?? {},
    isEnabled: true,
    createdBy: params.createdBy ?? null,
    metadata: params.metadata ?? {},
  }).returning();

  return source;
}

export async function recordFetch(
  sourceId: number,
  orgId: number | null | undefined,
  result: FetchResult,
  correlationId?: string,
): Promise<WorldlineFetchLog> {
  const [source] = await db
    .select()
    .from(worldlineSourceRegistryTable)
    .where(eq(worldlineSourceRegistryTable.id, sourceId));

  if (!source) {
    throw Object.assign(new Error(`Worldline source ${sourceId} not found`), { code: "NOT_FOUND" });
  }

  const now = new Date();
  const freshness = computeFreshnessScore(
    result.status === "success" ? now : source.lastSuccessAt,
    source.freshnessCadence as WorldlineFreshnessCadence,
  );

  const [log] = await db.insert(worldlineFetchLogsTable).values({
    sourceId,
    orgId: orgId ?? null,
    status: result.status,
    recordsReceived: result.recordsReceived,
    recordsNormalized: result.recordsNormalized,
    recordsRejected: result.recordsRejected,
    confidenceScore: result.confidenceScore ?? (source.confidenceBaseline ?? 0.7),
    freshnessScore: freshness,
    latencyMs: result.latencyMs ?? null,
    errorMessage: result.errorMessage ?? null,
    completedAt: now,
    correlationId: correlationId ?? null,
  }).returning();

  const stateUpdate: Partial<typeof worldlineSourceRegistryTable.$inferInsert> = {
    lastFetchedAt: now,
    totalFetches: (source.totalFetches ?? 0) + 1,
    freshnessScore: freshness,
    updatedAt: now,
  };

  if (result.status === "success" || result.status === "partial") {
    stateUpdate.lastSuccessAt = now;
    stateUpdate.consecutiveFailures = 0;
    stateUpdate.totalRecordsIngested = (source.totalRecordsIngested ?? 0) + result.recordsNormalized;
    stateUpdate.status = "active";
  } else if (result.status === "failed") {
    stateUpdate.lastErrorAt = now;
    stateUpdate.lastErrorMessage = result.errorMessage ?? "Unknown error";
    const failures = (source.consecutiveFailures ?? 0) + 1;
    stateUpdate.consecutiveFailures = failures;
    stateUpdate.status = failures >= 3 ? "degraded" : source.status;
  }

  await db.update(worldlineSourceRegistryTable)
    .set(stateUpdate)
    .where(eq(worldlineSourceRegistryTable.id, sourceId));

  return log;
}

export async function publishSignals(params: {
  sourceId: number;
  fetchLogId?: number;
  orgId?: number | null;
  targetPack: string;
  recordCount: number;
  payloadSummary?: Record<string, unknown>;
  correlationId?: string;
}): Promise<void> {
  await db.insert(worldlineSignalPublicationsTable).values({
    sourceId: params.sourceId,
    fetchLogId: params.fetchLogId ?? null,
    orgId: params.orgId ?? null,
    targetPack: params.targetPack,
    recordCount: params.recordCount,
    payloadSummary: params.payloadSummary ?? {},
    correlationId: params.correlationId ?? null,
  });
}

export async function getSourceBySlug(
  slug: string,
  orgId?: number | null,
): Promise<WorldlineSource | undefined> {
  const conditions = [eq(worldlineSourceRegistryTable.slug, slug)];
  if (orgId != null) conditions.push(eq(worldlineSourceRegistryTable.orgId, orgId));

  const [row] = await db
    .select()
    .from(worldlineSourceRegistryTable)
    .where(and(...conditions));
  return row;
}

export async function listSources(options: {
  orgId?: number;
  domain?: string;
  status?: WorldlineSourceStatus;
  limit?: number;
} = {}): Promise<WorldlineSource[]> {
  const conditions = [];
  if (options.orgId != null) conditions.push(eq(worldlineSourceRegistryTable.orgId, options.orgId));
  if (options.domain) conditions.push(eq(worldlineSourceRegistryTable.domain, options.domain));
  if (options.status) conditions.push(eq(worldlineSourceRegistryTable.status, options.status));

  const q = db
    .select()
    .from(worldlineSourceRegistryTable)
    .orderBy(desc(worldlineSourceRegistryTable.updatedAt))
    .limit(options.limit ?? 100);

  if (conditions.length > 0) return q.where(and(...conditions));
  return q;
}

export async function getFetchHistory(
  sourceId: number,
  limit = 50,
): Promise<WorldlineFetchLog[]> {
  return db
    .select()
    .from(worldlineFetchLogsTable)
    .where(eq(worldlineFetchLogsTable.sourceId, sourceId))
    .orderBy(desc(worldlineFetchLogsTable.fetchedAt))
    .limit(limit);
}

export function scoreFreshness(
  lastSuccessAt: Date | null,
  cadence: WorldlineFreshnessCadence,
): number {
  return computeFreshnessScore(lastSuccessAt, cadence);
}
