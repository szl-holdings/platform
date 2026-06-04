import {
  db,
  driftAssessmentsTable,
  type SpatialTwinCategory,
} from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import type { DriftAssessment, DriftGuardInput } from './types.js';

const DRIFT_THRESHOLDS = {
  stable: 0.2,
  watch: 0.4,
  degraded: 0.65,
};

function computeFieldDivergence(
  current: Record<string, unknown>,
  trusted: Record<string, unknown>,
): Array<{ field: string; currentValue: unknown; trustedValue: unknown; divergenceScore: number }> {
  const divergent: Array<{
    field: string;
    currentValue: unknown;
    trustedValue: unknown;
    divergenceScore: number;
  }> = [];

  for (const [field, trustedValue] of Object.entries(trusted)) {
    const currentValue = current[field];
    if (currentValue === undefined) continue;

    let divergenceScore = 0;

    if (typeof currentValue === 'number' && typeof trustedValue === 'number') {
      if (trustedValue !== 0) {
        divergenceScore = Math.abs(currentValue - trustedValue) / Math.abs(trustedValue);
      } else if (currentValue !== 0) {
        divergenceScore = 1.0;
      }
    } else if (currentValue !== trustedValue) {
      divergenceScore = 1.0;
    }

    if (divergenceScore > 0.05) {
      divergent.push({ field, currentValue, trustedValue, divergenceScore });
    }
  }

  return divergent;
}

function classifyDrift(driftScore: number, divergentCount: number): DriftAssessment['driftStatus'] {
  if (driftScore >= DRIFT_THRESHOLDS.degraded || divergentCount > 5) return 'blocked';
  if (driftScore >= DRIFT_THRESHOLDS.watch || divergentCount > 2) return 'degraded';
  if (driftScore >= DRIFT_THRESHOLDS.stable || divergentCount > 0) return 'watch';
  return 'stable';
}

function adjustConfidence(
  originalConfidence: number,
  driftScore: number,
  driftStatus: DriftAssessment['driftStatus'],
): { adjustedConfidence: number; reason: string | null } {
  if (driftStatus === 'stable') {
    return { adjustedConfidence: originalConfidence, reason: null };
  }

  const degradeMap: Record<DriftAssessment['driftStatus'], number> = {
    stable: 0,
    watch: 0.05,
    degraded: 0.15,
    blocked: 0.35,
  };

  const degradeAmount = (degradeMap[driftStatus] ?? 0) + driftScore * 0.1;
  const adjustedConfidence = Math.max(0, originalConfidence - degradeAmount);
  const reason = `Confidence downgraded by ${(degradeAmount * 100).toFixed(1)}% due to ${driftStatus} drift (score: ${driftScore.toFixed(3)})`;

  return { adjustedConfidence, reason };
}

export async function assessDrift(input: DriftGuardInput): Promise<DriftAssessment> {
  const allDivergent: ReturnType<typeof computeFieldDivergence> = [];

  for (const delta of input.trustedSourceDeltas ?? []) {
    const fieldDivergences = computeFieldDivergence(input.currentState, delta.delta);
    allDivergent.push(...fieldDivergences);
  }

  const uniqueFields = new Map<string, ReturnType<typeof computeFieldDivergence>[number]>();
  for (const d of allDivergent) {
    const existing = uniqueFields.get(d.field);
    if (!existing || d.divergenceScore > existing.divergenceScore) {
      uniqueFields.set(d.field, d);
    }
  }

  const divergentFields = [...uniqueFields.values()];
  const driftScore =
    divergentFields.length > 0
      ? divergentFields.reduce((sum, d) => sum + d.divergenceScore, 0) / divergentFields.length
      : 0;

  const driftStatus = classifyDrift(driftScore, divergentFields.length);
  const { adjustedConfidence, reason } = adjustConfidence(
    input.currentConfidence,
    driftScore,
    driftStatus,
  );

  const blockedReason =
    driftStatus === 'blocked'
      ? `Output blocked: drift score ${driftScore.toFixed(3)} exceeds threshold. ${divergentFields.length} divergent fields detected.`
      : null;

  const assessment: DriftAssessment = {
    twinId: input.twinId,
    entityId: input.entityId,
    twinCategory: input.twinCategory,
    driftStatus,
    driftScore,
    divergentFields,
    trustedSourceDeltas: input.trustedSourceDeltas ?? [],
    confidenceDowngradeReason: reason,
    originalConfidence: input.currentConfidence,
    adjustedConfidence,
    blockedReason,
    assessedAt: new Date().toISOString(),
  };

  const [inserted] = await db
    .insert(driftAssessmentsTable)
    .values({
      orgId: input.orgId ?? null,
      twinId: input.twinId,
      entityId: input.entityId,
      twinCategory: input.twinCategory,
      currentSnapshotId: input.currentSnapshotId ?? null,
      approvedSnapshotId: input.approvedSnapshotId ?? null,
      driftStatus,
      driftScore,
      divergentFields,
      trustedSourceDeltas: input.trustedSourceDeltas ?? [],
      confidenceDowngradeReason: reason,
      originalConfidence: input.currentConfidence,
      adjustedConfidence,
      blockedReason,
      assessedAt: new Date(),
    })
    .returning();

  return { ...assessment, id: inserted.id };
}

export async function getLatestDriftAssessment(
  twinId: string,
  orgId?: number,
): Promise<DriftAssessment | null> {
  const conditions = [eq(driftAssessmentsTable.twinId, twinId)];
  if (orgId != null) conditions.push(eq(driftAssessmentsTable.orgId, orgId));

  const [row] = await db
    .select()
    .from(driftAssessmentsTable)
    .where(and(...conditions))
    .orderBy(desc(driftAssessmentsTable.assessedAt))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    twinId: row.twinId,
    entityId: row.entityId,
    twinCategory: row.twinCategory as SpatialTwinCategory,
    driftStatus: row.driftStatus as DriftAssessment['driftStatus'],
    driftScore: row.driftScore,
    divergentFields: (row.divergentFields as DriftAssessment['divergentFields']) ?? [],
    trustedSourceDeltas: (row.trustedSourceDeltas as DriftAssessment['trustedSourceDeltas']) ?? [],
    confidenceDowngradeReason: row.confidenceDowngradeReason ?? null,
    originalConfidence: row.originalConfidence ?? 0,
    adjustedConfidence: row.adjustedConfidence ?? 0,
    blockedReason: row.blockedReason ?? null,
    assessedAt: row.assessedAt.toISOString(),
  };
}

export class DriftGuard {
  async assess(input: DriftGuardInput): Promise<DriftAssessment> {
    return assessDrift(input);
  }

  async latest(twinId: string, orgId?: number): Promise<DriftAssessment | null> {
    return getLatestDriftAssessment(twinId, orgId);
  }

  isOutputSafe(assessment: DriftAssessment): boolean {
    return assessment.driftStatus !== 'blocked';
  }
}

export const driftGuard = new DriftGuard();
