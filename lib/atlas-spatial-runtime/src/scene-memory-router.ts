import {
  db,
  type SpatialTwinCategory,
  sceneMemoryIndexTable,
  spatialTwinSnapshotsTable,
} from '@szl-holdings/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { SceneMemoryQuery, SceneMemorySlice } from './types.js';

function computeRecencyScore(snapshotAt: Date): number {
  const ageMs = Date.now() - snapshotAt.getTime();
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, 1 - ageMs / maxAgeMs);
}

function computeCompositeScore(
  overlapScore: number,
  recencyScore: number,
  trustWeight: number,
  causalRelevanceScore: number,
): number {
  return overlapScore * 0.35 + recencyScore * 0.25 + trustWeight * 0.2 + causalRelevanceScore * 0.2;
}

export interface IndexSnapshotParams {
  orgId?: number | null;
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  snapshotId: number;
  retrievalTags?: string[];
  spatialOverlap?: Record<string, unknown>;
  causalLinks?: Array<{ targetEntityId: string; linkType: string; strength: number }>;
  trustWeight?: number;
  causalRelevanceScore?: number;
  overlapScore?: number;
  expiresAt?: Date | null;
}

export async function indexSnapshot(params: IndexSnapshotParams): Promise<void> {
  const snapshot = await db
    .select({ snapshotAt: spatialTwinSnapshotsTable.snapshotAt })
    .from(spatialTwinSnapshotsTable)
    .where(eq(spatialTwinSnapshotsTable.id, params.snapshotId))
    .then((r) => r[0]);

  if (!snapshot) {
    throw Object.assign(new Error(`Snapshot ${params.snapshotId} not found for indexing`), {
      code: 'NOT_FOUND',
    });
  }

  const recencyScore = computeRecencyScore(snapshot.snapshotAt);
  const overlapScore = params.overlapScore ?? 0.5;
  const trustWeight = params.trustWeight ?? 0.7;
  const causalRelevanceScore = params.causalRelevanceScore ?? 0.5;
  const compositeRankScore = computeCompositeScore(
    overlapScore,
    recencyScore,
    trustWeight,
    causalRelevanceScore,
  );

  await db.insert(sceneMemoryIndexTable).values({
    orgId: params.orgId ?? null,
    twinId: params.twinId,
    entityId: params.entityId,
    twinCategory: params.twinCategory,
    snapshotId: params.snapshotId,
    overlapScore,
    recencyScore,
    trustWeight,
    causalRelevanceScore,
    compositeRankScore,
    retrievalTags: params.retrievalTags ?? [],
    spatialOverlap: params.spatialOverlap ?? {},
    causalLinks: params.causalLinks ?? [],
    expiresAt: params.expiresAt ?? null,
  });
}

export async function recallSceneMemory(query: SceneMemoryQuery): Promise<SceneMemorySlice[]> {
  const conditions = [];

  if (query.orgId != null) conditions.push(eq(sceneMemoryIndexTable.orgId, query.orgId));
  if (query.twinId) conditions.push(eq(sceneMemoryIndexTable.twinId, query.twinId));
  if (query.entityId) conditions.push(eq(sceneMemoryIndexTable.entityId, query.entityId));
  if (query.twinCategory)
    conditions.push(eq(sceneMemoryIndexTable.twinCategory, query.twinCategory));
  if (query.minCompositeScore != null) {
    conditions.push(sql`${sceneMemoryIndexTable.compositeRankScore} >= ${query.minCompositeScore}`);
  }

  const rows = await db
    .select({
      id: sceneMemoryIndexTable.id,
      snapshotId: sceneMemoryIndexTable.snapshotId,
      twinId: sceneMemoryIndexTable.twinId,
      entityId: sceneMemoryIndexTable.entityId,
      twinCategory: sceneMemoryIndexTable.twinCategory,
      overlapScore: sceneMemoryIndexTable.overlapScore,
      recencyScore: sceneMemoryIndexTable.recencyScore,
      trustWeight: sceneMemoryIndexTable.trustWeight,
      causalRelevanceScore: sceneMemoryIndexTable.causalRelevanceScore,
      compositeRankScore: sceneMemoryIndexTable.compositeRankScore,
      retrievalTags: sceneMemoryIndexTable.retrievalTags,
      indexedAt: sceneMemoryIndexTable.indexedAt,
      snapshotAt: spatialTwinSnapshotsTable.snapshotAt,
      state: spatialTwinSnapshotsTable.state,
    })
    .from(sceneMemoryIndexTable)
    .leftJoin(
      spatialTwinSnapshotsTable,
      eq(sceneMemoryIndexTable.snapshotId, spatialTwinSnapshotsTable.id),
    )
    .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
    .orderBy(desc(sceneMemoryIndexTable.compositeRankScore))
    .limit(query.limit ?? 20);

  return rows
    .filter((r) => r.snapshotId != null)
    .map((r) => ({
      snapshotId: r.snapshotId!,
      twinId: r.twinId,
      entityId: r.entityId,
      twinCategory: r.twinCategory as SpatialTwinCategory,
      overlapScore: r.overlapScore,
      recencyScore: r.recencyScore,
      trustWeight: r.trustWeight,
      causalRelevanceScore: r.causalRelevanceScore,
      compositeRankScore: r.compositeRankScore,
      retrievalTags: (r.retrievalTags as string[]) ?? [],
      state: (r.state as Record<string, unknown>) ?? {},
      snapshotAt: (r.snapshotAt ?? new Date()).toISOString(),
    }));
}

export async function getTopMemorySlices(
  twinId: string,
  limit = 5,
  orgId?: number,
): Promise<SceneMemorySlice[]> {
  return recallSceneMemory({ twinId, orgId, limit });
}

export async function pruneExpiredMemory(twinId?: string): Promise<number> {
  const conditions = [
    sql`${sceneMemoryIndexTable.expiresAt} IS NOT NULL AND ${sceneMemoryIndexTable.expiresAt} < NOW()`,
  ];
  if (twinId) conditions.push(eq(sceneMemoryIndexTable.twinId, twinId));

  const result = await db
    .delete(sceneMemoryIndexTable)
    .where(and(...conditions))
    .returning({ id: sceneMemoryIndexTable.id });

  return result.length;
}

export class SceneMemoryRouter {
  async index(params: IndexSnapshotParams): Promise<void> {
    return indexSnapshot(params);
  }

  async recall(query: SceneMemoryQuery): Promise<SceneMemorySlice[]> {
    return recallSceneMemory(query);
  }

  async topSlices(twinId: string, limit = 5, orgId?: number): Promise<SceneMemorySlice[]> {
    return getTopMemorySlices(twinId, limit, orgId);
  }

  async prune(twinId?: string): Promise<number> {
    return pruneExpiredMemory(twinId);
  }
}

export const sceneMemoryRouter = new SceneMemoryRouter();
