import {
  db,
  spatialTwinSnapshotsTable,
  driftAssessmentsTable,
  worldlineSignalOverlaysTable,
  type SpatialTwinCategory,
} from "@szl-holdings/db";
import { eq, and, gte, lte, asc, desc, sql } from "drizzle-orm";
import type { ReplayFrame, ReplayTimeline, DriftStatus } from "./types.js";

export interface ReplayOptions {
  twinId: string;
  entityId?: string;
  twinCategory?: SpatialTwinCategory;
  orgId?: number;
  startAt?: string;
  endAt?: string;
  maxFrames?: number;
  includeOverlays?: boolean;
}

export async function buildReplayTimeline(options: ReplayOptions): Promise<ReplayTimeline> {
  const conditions = [eq(spatialTwinSnapshotsTable.twinId, options.twinId)];

  if (options.orgId != null) conditions.push(eq(spatialTwinSnapshotsTable.orgId, options.orgId));
  if (options.entityId) conditions.push(eq(spatialTwinSnapshotsTable.entityId, options.entityId));
  if (options.twinCategory) conditions.push(eq(spatialTwinSnapshotsTable.twinCategory, options.twinCategory));
  if (options.startAt) {
    conditions.push(sql`${spatialTwinSnapshotsTable.snapshotAt} >= ${options.startAt}::timestamptz`);
  }
  if (options.endAt) {
    conditions.push(sql`${spatialTwinSnapshotsTable.snapshotAt} <= ${options.endAt}::timestamptz`);
  }

  const snapshots = await db
    .select()
    .from(spatialTwinSnapshotsTable)
    .where(and(...conditions))
    .orderBy(asc(spatialTwinSnapshotsTable.snapshotAt))
    .limit(options.maxFrames ?? 200);

  if (snapshots.length === 0) {
    return {
      twinId: options.twinId,
      entityId: options.entityId ?? "",
      twinCategory: (options.twinCategory ?? "vessel") as SpatialTwinCategory,
      frames: [],
      totalFrames: 0,
      startAt: options.startAt ?? new Date().toISOString(),
      endAt: options.endAt ?? new Date().toISOString(),
      durationMs: 0,
      snapshotIds: [],
    };
  }

  const snapshotIds = snapshots.map(s => s.id);
  const firstSnapshot = snapshots[0]!;
  const lastSnapshot = snapshots[snapshots.length - 1]!;

  let activeOverlayIds: string[] = [];
  if (options.includeOverlays) {
    const overlayRows = await db
      .select({ overlayId: worldlineSignalOverlaysTable.overlayId })
      .from(worldlineSignalOverlaysTable)
      .where(
        and(
          eq(worldlineSignalOverlaysTable.isActive, true),
          options.orgId != null ? eq(worldlineSignalOverlaysTable.orgId, options.orgId) : sql`1=1`,
        ),
      )
      .limit(50);
    activeOverlayIds = overlayRows.map(r => r.overlayId);
  }

  const driftRows = await db
    .select({
      twinId: driftAssessmentsTable.twinId,
      driftStatus: driftAssessmentsTable.driftStatus,
      assessedAt: driftAssessmentsTable.assessedAt,
    })
    .from(driftAssessmentsTable)
    .where(eq(driftAssessmentsTable.twinId, options.twinId))
    .orderBy(desc(driftAssessmentsTable.assessedAt))
    .limit(snapshots.length);

  const driftByTime = new Map<string, DriftStatus>();
  for (const d of driftRows) {
    driftByTime.set(d.assessedAt.toISOString(), d.driftStatus as DriftStatus);
  }

  const frames: ReplayFrame[] = snapshots.map((snapshot, index) => {
    const closestDrift = driftRows.find(d => d.assessedAt <= snapshot.snapshotAt);
    const driftStatus = closestDrift ? (closestDrift.driftStatus as DriftStatus) : null;

    return {
      frameIndex: index,
      twinId: snapshot.twinId,
      entityId: snapshot.entityId,
      twinCategory: snapshot.twinCategory as SpatialTwinCategory,
      timestamp: snapshot.snapshotAt.toISOString(),
      state: (snapshot.state as Record<string, unknown>) ?? {},
      alerts: (snapshot.alerts as Array<{ id: string; severity: string; message: string }>) ?? [],
      confidenceScore: snapshot.confidenceScore,
      driftStatus,
      overlaysActive: index === snapshots.length - 1 ? activeOverlayIds : [],
      metadata: (snapshot.metadata as Record<string, unknown>) ?? {},
    };
  });

  const startAt = firstSnapshot.snapshotAt.toISOString();
  const endAt = lastSnapshot.snapshotAt.toISOString();
  const durationMs = lastSnapshot.snapshotAt.getTime() - firstSnapshot.snapshotAt.getTime();

  return {
    twinId: options.twinId,
    entityId: firstSnapshot.entityId,
    twinCategory: firstSnapshot.twinCategory as SpatialTwinCategory,
    frames,
    totalFrames: frames.length,
    startAt,
    endAt,
    durationMs,
    snapshotIds,
  };
}

export async function getReplayFrame(
  twinId: string,
  frameIndex: number,
  orgId?: number,
): Promise<ReplayFrame | null> {
  const conditions = [eq(spatialTwinSnapshotsTable.twinId, twinId)];
  if (orgId != null) conditions.push(eq(spatialTwinSnapshotsTable.orgId, orgId));

  const rows = await db
    .select()
    .from(spatialTwinSnapshotsTable)
    .where(and(...conditions))
    .orderBy(asc(spatialTwinSnapshotsTable.snapshotAt))
    .limit(frameIndex + 1);

  const snapshot = rows[frameIndex];
  if (!snapshot) return null;

  return {
    frameIndex,
    twinId: snapshot.twinId,
    entityId: snapshot.entityId,
    twinCategory: snapshot.twinCategory as SpatialTwinCategory,
    timestamp: snapshot.snapshotAt.toISOString(),
    state: (snapshot.state as Record<string, unknown>) ?? {},
    alerts: (snapshot.alerts as Array<{ id: string; severity: string; message: string }>) ?? [],
    confidenceScore: snapshot.confidenceScore,
    driftStatus: null,
    overlaysActive: [],
    metadata: (snapshot.metadata as Record<string, unknown>) ?? {},
  };
}

export class ReplayEngine {
  async buildTimeline(options: ReplayOptions): Promise<ReplayTimeline> {
    return buildReplayTimeline(options);
  }

  async getFrame(twinId: string, frameIndex: number, orgId?: number): Promise<ReplayFrame | null> {
    return getReplayFrame(twinId, frameIndex, orgId);
  }

  renderFrameCard(frame: ReplayFrame): Record<string, unknown> {
    return {
      frameIndex: frame.frameIndex,
      timestamp: frame.timestamp,
      twinId: frame.twinId,
      entityId: frame.entityId,
      twinCategory: frame.twinCategory,
      confidence: `${(frame.confidenceScore * 100).toFixed(0)}%`,
      driftStatus: frame.driftStatus ?? "unknown",
      alertCount: frame.alerts.length,
      criticalAlerts: frame.alerts.filter(a => a.severity === "critical").length,
      statePreview: Object.fromEntries(Object.entries(frame.state).slice(0, 5)),
      overlaysActive: frame.overlaysActive.length,
      renderType: "card_2d",
    };
  }
}

export const replayEngine = new ReplayEngine();
