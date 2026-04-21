import {
  db,
  type OverlaySignalType,
  type SourceTrustClass,
  type SpatialTwinCategory,
  worldlineSignalOverlaysTable,
} from '@szl-holdings/db';
import { randomUUID } from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';

export type { OverlaySignalType, SourceTrustClass };

export interface CreateOverlayParams {
  orgId?: number | null;
  signalType: OverlaySignalType;
  sourceId?: number | null;
  sourceTrustClass?: SourceTrustClass;
  signalTimestamp: Date;
  expiresAt?: Date | null;
  coordinates?: { lat: number; lon: number; alt?: number; timestamp: string } | null;
  boundingRegion?: Record<string, unknown> | null;
  affectedEntityIds?: string[];
  affectedTwinCategories?: SpatialTwinCategory[];
  payload: Record<string, unknown>;
  confidenceScore?: number;
  causalLinkage?: Array<{ targetEntityId: string; linkType: string; strength: number }>;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface OverlayQueryOptions {
  orgId?: number;
  signalType?: OverlaySignalType;
  sourceTrustClass?: SourceTrustClass;
  severity?: 'info' | 'warning' | 'critical';
  isActive?: boolean;
  entityId?: string;
  twinCategory?: SpatialTwinCategory;
  limit?: number;
}

export async function createSignalOverlay(
  params: CreateOverlayParams,
): Promise<typeof worldlineSignalOverlaysTable.$inferSelect> {
  const overlayId = `overlay-${randomUUID()}`;

  const [overlay] = await db
    .insert(worldlineSignalOverlaysTable)
    .values({
      orgId: params.orgId ?? null,
      overlayId,
      signalType: params.signalType,
      sourceId: params.sourceId ?? null,
      sourceTrustClass: params.sourceTrustClass ?? 'inferred',
      signalTimestamp: params.signalTimestamp,
      expiresAt: params.expiresAt ?? null,
      coordinates: params.coordinates ?? null,
      boundingRegion: params.boundingRegion ?? null,
      affectedEntityIds: params.affectedEntityIds ?? [],
      affectedTwinCategories: params.affectedTwinCategories ?? [],
      payload: params.payload,
      confidenceScore: params.confidenceScore ?? 0.7,
      causalLinkage: params.causalLinkage ?? [],
      severity: params.severity ?? 'info',
      isActive: true,
      metadata: params.metadata ?? {},
    })
    .returning();

  return overlay!;
}

export async function querySignalOverlays(
  options: OverlayQueryOptions,
): Promise<Array<typeof worldlineSignalOverlaysTable.$inferSelect>> {
  const conditions = [];

  if (options.orgId != null) conditions.push(eq(worldlineSignalOverlaysTable.orgId, options.orgId));
  if (options.signalType)
    conditions.push(eq(worldlineSignalOverlaysTable.signalType, options.signalType));
  if (options.sourceTrustClass)
    conditions.push(eq(worldlineSignalOverlaysTable.sourceTrustClass, options.sourceTrustClass));
  if (options.severity)
    conditions.push(eq(worldlineSignalOverlaysTable.severity, options.severity));
  if (options.isActive != null)
    conditions.push(eq(worldlineSignalOverlaysTable.isActive, options.isActive));

  if (options.entityId) {
    conditions.push(
      sql`${worldlineSignalOverlaysTable.affectedEntityIds} @> ${JSON.stringify([options.entityId])}::jsonb`,
    );
  }

  if (options.twinCategory) {
    conditions.push(
      sql`${worldlineSignalOverlaysTable.affectedTwinCategories} @> ${JSON.stringify([options.twinCategory])}::jsonb`,
    );
  }

  const q = db
    .select()
    .from(worldlineSignalOverlaysTable)
    .orderBy(desc(worldlineSignalOverlaysTable.signalTimestamp))
    .limit(options.limit ?? 100);

  if (conditions.length > 0) return q.where(and(...conditions));
  return q;
}

export async function getActiveOverlaysForEntity(
  entityId: string,
  options?: { orgId?: number; signalType?: OverlaySignalType },
): Promise<Array<typeof worldlineSignalOverlaysTable.$inferSelect>> {
  return querySignalOverlays({
    entityId,
    isActive: true,
    ...(options?.orgId !== undefined ? { orgId: options.orgId } : {}),
    ...(options?.signalType !== undefined ? { signalType: options.signalType } : {}),
  });
}

export async function expireOverlay(overlayId: string, orgId?: number): Promise<boolean> {
  const cond =
    orgId != null
      ? and(
          eq(worldlineSignalOverlaysTable.overlayId, overlayId),
          eq(worldlineSignalOverlaysTable.orgId, orgId),
        )
      : eq(worldlineSignalOverlaysTable.overlayId, overlayId);

  const result = await db
    .update(worldlineSignalOverlaysTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(cond)
    .returning({ id: worldlineSignalOverlaysTable.id });

  return result.length > 0;
}

export async function expireStaleOverlays(): Promise<number> {
  const result = await db
    .update(worldlineSignalOverlaysTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(worldlineSignalOverlaysTable.isActive, true),
        sql`${worldlineSignalOverlaysTable.expiresAt} IS NOT NULL AND ${worldlineSignalOverlaysTable.expiresAt} < NOW()`,
      ),
    )
    .returning({ id: worldlineSignalOverlaysTable.id });

  return result.length;
}

export async function getOverlayById(
  overlayId: string,
): Promise<typeof worldlineSignalOverlaysTable.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(worldlineSignalOverlaysTable)
    .where(eq(worldlineSignalOverlaysTable.overlayId, overlayId));
  return row ?? null;
}

export function scoreOverlayTrust(
  sourceTrustClass: SourceTrustClass,
  baseConfidence: number,
): number {
  const trustMultipliers: Record<SourceTrustClass, number> = {
    authoritative: 1.0,
    verified: 0.9,
    inferred: 0.7,
    unverified: 0.5,
  };
  return baseConfidence * (trustMultipliers[sourceTrustClass] ?? 0.7);
}
