import {
  db,
  type SpatialTwinCategory,
  scenarioBranchesTable,
  spatialTwinSnapshotsTable,
} from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { ScenarioBranch, ScenarioBranchComparison, ScenarioForgeInput } from './types.js';

function generateBranchId(): string {
  return `branch-${randomUUID()}`;
}

function applyParametersToState(
  baseState: Record<string, unknown>,
  parameters: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...baseState };
  for (const [key, value] of Object.entries(parameters)) {
    if (key.includes('.')) {
      const parts = key.split('.');
      let current: Record<string, unknown> = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]!;
        if (typeof current[part] !== 'object' || current[part] === null) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]!] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function computeDeltaMetrics(
  baseState: Record<string, unknown>,
  branchState: Record<string, unknown>,
): Record<string, { before: unknown; after: unknown; changePercent?: number }> {
  const delta: Record<string, { before: unknown; after: unknown; changePercent?: number }> = {};
  const allKeys = new Set([...Object.keys(baseState), ...Object.keys(branchState)]);

  for (const key of allKeys) {
    const before = baseState[key];
    const after = branchState[key];

    if (before !== after) {
      const entry: { before: unknown; after: unknown; changePercent?: number } = { before, after };
      if (typeof before === 'number' && typeof after === 'number' && before !== 0) {
        entry.changePercent = ((after - before) / Math.abs(before)) * 100;
      }
      delta[key] = entry;
    }
  }

  return delta;
}

function assessBranchRisk(
  deltaMetrics: Record<string, { before: unknown; after: unknown; changePercent?: number }>,
): {
  riskAssessment: string;
  recommendedActions: string[];
  confidenceScore: number;
} {
  const changes = Object.values(deltaMetrics);
  const majorChanges = changes.filter(
    (c) => typeof c.changePercent === 'number' && Math.abs(c.changePercent) > 20,
  );

  let riskLevel: string;
  let confidenceScore: number;

  if (majorChanges.length > 3) {
    riskLevel = 'HIGH';
    confidenceScore = 0.65;
  } else if (majorChanges.length > 1) {
    riskLevel = 'MODERATE';
    confidenceScore = 0.78;
  } else {
    riskLevel = 'LOW';
    confidenceScore = 0.88;
  }

  const riskAssessment = `${riskLevel}: Branch simulation produced ${majorChanges.length} major state changes (>20% deviation). ${changes.length} total fields affected.`;
  const recommendedActions: string[] = [];

  if (majorChanges.length > 2) {
    recommendedActions.push(
      'Review branch parameters for plausibility before applying to live twin',
    );
    recommendedActions.push('Cross-validate simulation results against trusted source data');
  }
  if (majorChanges.length > 3) {
    recommendedActions.push('Require senior analyst approval before scenario branch promotion');
  }

  return { riskAssessment, recommendedActions, confidenceScore };
}

export async function forgeBranch(input: ScenarioForgeInput): Promise<ScenarioBranch> {
  const baseSnapshotCond =
    input.orgId != null
      ? and(
          eq(spatialTwinSnapshotsTable.id, input.baselineSnapshotId),
          eq(spatialTwinSnapshotsTable.orgId, input.orgId),
        )
      : eq(spatialTwinSnapshotsTable.id, input.baselineSnapshotId);

  const baseSnapshot = await db
    .select()
    .from(spatialTwinSnapshotsTable)
    .where(baseSnapshotCond)
    .then((r) => r[0]);

  if (!baseSnapshot) {
    throw Object.assign(
      new Error(`Baseline snapshot ${input.baselineSnapshotId} not found or not accessible`),
      { code: 'NOT_FOUND' },
    );
  }

  const baseState = (baseSnapshot.state as Record<string, unknown>) ?? {};
  const branchState = applyParametersToState(baseState, input.parameters);
  const deltaMetrics = computeDeltaMetrics(baseState, branchState);
  const { riskAssessment, recommendedActions, confidenceScore } = assessBranchRisk(deltaMetrics);

  const branchId = generateBranchId();
  const now = new Date();

  const [branchSnapshot] = await db
    .insert(spatialTwinSnapshotsTable)
    .values({
      orgId: input.orgId ?? null,
      twinId: input.twinId,
      entityId: input.entityId,
      twinCategory: input.twinCategory,
      sequenceNumber: (baseSnapshot.sequenceNumber ?? 0) + 1,
      state: branchState,
      predictedStates: baseSnapshot.predictedStates ?? [],
      alerts: [],
      confidenceScore,
      parentSnapshotId: input.baselineSnapshotId,
      derivedBranchId: branchId,
      sourceEvidenceList: baseSnapshot.sourceEvidenceList ?? [],
      spatialContext: baseSnapshot.spatialContext ?? {},
      metadata: { branchName: input.branchName, parameters: input.parameters },
    })
    .returning();

  const [branch] = await db
    .insert(scenarioBranchesTable)
    .values({
      orgId: input.orgId ?? null,
      branchId,
      twinId: input.twinId,
      entityId: input.entityId,
      twinCategory: input.twinCategory,
      name: input.branchName,
      description: input.branchDescription ?? null,
      baselineSnapshotId: input.baselineSnapshotId,
      branchSnapshotId: branchSnapshot.id,
      parameters: input.parameters,
      deltaMetrics,
      riskAssessment,
      recommendedActions,
      confidenceScore,
      status: 'completed',
      correlationId: input.correlationId ?? null,
      createdByUserId: input.createdByUserId ?? null,
      completedAt: now,
    })
    .returning();

  return {
    id: branch.id,
    branchId: branch.branchId,
    twinId: branch.twinId,
    entityId: branch.entityId,
    twinCategory: branch.twinCategory as SpatialTwinCategory,
    name: branch.name,
    description: branch.description,
    baselineSnapshotId: branch.baselineSnapshotId,
    branchSnapshotId: branch.branchSnapshotId,
    parameters: (branch.parameters as Record<string, unknown>) ?? {},
    deltaMetrics:
      (branch.deltaMetrics as Record<
        string,
        { before: unknown; after: unknown; changePercent?: number }
      >) ?? {},
    riskAssessment: branch.riskAssessment,
    recommendedActions: (branch.recommendedActions as string[]) ?? [],
    confidenceScore: branch.confidenceScore,
    status: branch.status as ScenarioBranch['status'],
    proofChainId: branch.proofChainId,
    correlationId: branch.correlationId,
  };
}

export async function getBranch(branchId: string, orgId?: number): Promise<ScenarioBranch | null> {
  const cond =
    orgId != null
      ? and(eq(scenarioBranchesTable.branchId, branchId), eq(scenarioBranchesTable.orgId, orgId))
      : eq(scenarioBranchesTable.branchId, branchId);

  const [row] = await db.select().from(scenarioBranchesTable).where(cond);
  if (!row) return null;

  return {
    id: row.id,
    branchId: row.branchId,
    twinId: row.twinId,
    entityId: row.entityId,
    twinCategory: row.twinCategory as SpatialTwinCategory,
    name: row.name,
    description: row.description,
    baselineSnapshotId: row.baselineSnapshotId,
    branchSnapshotId: row.branchSnapshotId,
    parameters: (row.parameters as Record<string, unknown>) ?? {},
    deltaMetrics:
      (row.deltaMetrics as Record<
        string,
        { before: unknown; after: unknown; changePercent?: number }
      >) ?? {},
    riskAssessment: row.riskAssessment,
    recommendedActions: (row.recommendedActions as string[]) ?? [],
    confidenceScore: row.confidenceScore,
    status: row.status as ScenarioBranch['status'],
    proofChainId: row.proofChainId,
    correlationId: row.correlationId,
  };
}

export async function updateBranch(
  branchId: string,
  updates: {
    name?: string;
    description?: string;
    status?: ScenarioBranch['status'];
    metadata?: Record<string, unknown>;
  },
  orgId?: number,
): Promise<ScenarioBranch | null> {
  const cond =
    orgId != null
      ? and(eq(scenarioBranchesTable.branchId, branchId), eq(scenarioBranchesTable.orgId, orgId))
      : eq(scenarioBranchesTable.branchId, branchId);

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name != null) updateValues.name = updates.name;
  if (updates.description != null) updateValues.description = updates.description;
  if (updates.status != null) updateValues.status = updates.status;
  if (updates.metadata != null) updateValues.metadata = updates.metadata;

  const [row] = await db
    .update(scenarioBranchesTable)
    .set(updateValues as typeof scenarioBranchesTable.$inferInsert)
    .where(cond)
    .returning();

  if (!row) return null;

  return {
    id: row.id,
    branchId: row.branchId,
    twinId: row.twinId,
    entityId: row.entityId,
    twinCategory: row.twinCategory as SpatialTwinCategory,
    name: row.name,
    description: row.description,
    baselineSnapshotId: row.baselineSnapshotId,
    branchSnapshotId: row.branchSnapshotId,
    parameters: (row.parameters as Record<string, unknown>) ?? {},
    deltaMetrics:
      (row.deltaMetrics as Record<
        string,
        { before: unknown; after: unknown; changePercent?: number }
      >) ?? {},
    riskAssessment: row.riskAssessment,
    recommendedActions: (row.recommendedActions as string[]) ?? [],
    confidenceScore: row.confidenceScore,
    status: row.status as ScenarioBranch['status'],
    proofChainId: row.proofChainId,
    correlationId: row.correlationId,
  };
}

export async function deleteBranch(branchId: string, orgId?: number): Promise<boolean> {
  const cond =
    orgId != null
      ? and(eq(scenarioBranchesTable.branchId, branchId), eq(scenarioBranchesTable.orgId, orgId))
      : eq(scenarioBranchesTable.branchId, branchId);

  const [deleted] = await db
    .delete(scenarioBranchesTable)
    .where(cond)
    .returning({ id: scenarioBranchesTable.id });

  return deleted != null;
}

export async function compareBranches(
  branchAId: string,
  branchBId?: string,
  orgId?: number,
): Promise<ScenarioBranchComparison> {
  const condA =
    orgId != null
      ? and(eq(scenarioBranchesTable.branchId, branchAId), eq(scenarioBranchesTable.orgId, orgId))
      : eq(scenarioBranchesTable.branchId, branchAId);

  const [branchARow] = await db.select().from(scenarioBranchesTable).where(condA);

  if (!branchARow) {
    throw Object.assign(new Error(`Branch ${branchAId} not found or not accessible`), {
      code: 'NOT_FOUND',
    });
  }

  const condB = branchBId
    ? orgId != null
      ? and(eq(scenarioBranchesTable.branchId, branchBId), eq(scenarioBranchesTable.orgId, orgId))
      : eq(scenarioBranchesTable.branchId, branchBId)
    : undefined;

  const branchBRow = condB
    ? await db
        .select()
        .from(scenarioBranchesTable)
        .where(condB)
        .then((r) => r[0])
    : undefined;

  const baselineSnapshot = branchARow.baselineSnapshotId
    ? await db
        .select()
        .from(spatialTwinSnapshotsTable)
        .where(eq(spatialTwinSnapshotsTable.id, branchARow.baselineSnapshotId))
        .then((r) => r[0])
    : null;

  const branchASnapshot = branchARow.branchSnapshotId
    ? await db
        .select()
        .from(spatialTwinSnapshotsTable)
        .where(eq(spatialTwinSnapshotsTable.id, branchARow.branchSnapshotId))
        .then((r) => r[0])
    : null;

  const branchBSnapshot = branchBRow?.branchSnapshotId
    ? await db
        .select()
        .from(spatialTwinSnapshotsTable)
        .where(eq(spatialTwinSnapshotsTable.id, branchBRow.branchSnapshotId))
        .then((r) => r[0])
    : null;

  const baselineState = (baselineSnapshot?.state as Record<string, unknown>) ?? {};
  const branchAState = (branchASnapshot?.state as Record<string, unknown>) ?? {};
  const branchBState = (branchBSnapshot?.state as Record<string, unknown>) ?? undefined;

  const allFields = new Set([
    ...Object.keys(baselineState),
    ...Object.keys(branchAState),
    ...(branchBState ? Object.keys(branchBState) : []),
  ]);

  const fieldComparisons: ScenarioBranchComparison['fieldComparisons'] = {};
  for (const field of allFields) {
    fieldComparisons[field] = {
      baseline: baselineState[field],
      branchA: branchAState[field],
      ...(branchBState ? { branchB: branchBState[field] } : {}),
    };
  }

  const toScenarioBranch = (row: typeof branchARow): ScenarioBranch => ({
    id: row.id,
    branchId: row.branchId,
    twinId: row.twinId,
    entityId: row.entityId,
    twinCategory: row.twinCategory as SpatialTwinCategory,
    name: row.name,
    description: row.description,
    baselineSnapshotId: row.baselineSnapshotId,
    branchSnapshotId: row.branchSnapshotId,
    parameters: (row.parameters as Record<string, unknown>) ?? {},
    deltaMetrics:
      (row.deltaMetrics as Record<
        string,
        { before: unknown; after: unknown; changePercent?: number }
      >) ?? {},
    riskAssessment: row.riskAssessment,
    recommendedActions: (row.recommendedActions as string[]) ?? [],
    confidenceScore: row.confidenceScore,
    status: row.status as ScenarioBranch['status'],
    proofChainId: row.proofChainId,
    correlationId: row.correlationId,
  });

  const branchA = toScenarioBranch(branchARow);
  const branchB = branchBRow ? toScenarioBranch(branchBRow) : undefined;

  const baseline = toScenarioBranch({ ...branchARow, branchId: 'baseline', name: 'Baseline' });

  const riskRanking: ScenarioBranchComparison['riskRanking'] = [
    {
      branchId: branchARow.branchId,
      riskScore: 1 - branchARow.confidenceScore,
      label: branchARow.name,
    },
    ...(branchBRow
      ? [
          {
            branchId: branchBRow.branchId,
            riskScore: 1 - branchBRow.confidenceScore,
            label: branchBRow.name,
          },
        ]
      : []),
  ].sort((a, b) => b.riskScore - a.riskScore);

  const highestRisk = riskRanking[0];
  const recommendation =
    highestRisk && highestRisk.riskScore > 0.3
      ? `Branch "${highestRisk.label}" carries the highest risk (score: ${highestRisk.riskScore.toFixed(2)}). Consider the lower-risk alternative.`
      : 'All branches within acceptable risk parameters. Select based on operational priority.';

  return { baseline, branchA, branchB, fieldComparisons, riskRanking, recommendation };
}

export async function listBranches(options: {
  twinId?: string;
  entityId?: string;
  twinCategory?: SpatialTwinCategory;
  orgId?: number;
  status?: ScenarioBranch['status'];
  limit?: number;
}): Promise<ScenarioBranch[]> {
  const conditions = [];
  if (options.orgId != null) conditions.push(eq(scenarioBranchesTable.orgId, options.orgId));
  if (options.twinId) conditions.push(eq(scenarioBranchesTable.twinId, options.twinId));
  if (options.entityId) conditions.push(eq(scenarioBranchesTable.entityId, options.entityId));
  if (options.twinCategory)
    conditions.push(eq(scenarioBranchesTable.twinCategory, options.twinCategory));
  if (options.status) conditions.push(eq(scenarioBranchesTable.status, options.status));

  const q = db
    .select()
    .from(scenarioBranchesTable)
    .orderBy(desc(scenarioBranchesTable.createdAt))
    .limit(options.limit ?? 50);

  const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;

  return rows.map((row) => ({
    id: row.id,
    branchId: row.branchId,
    twinId: row.twinId,
    entityId: row.entityId,
    twinCategory: row.twinCategory as SpatialTwinCategory,
    name: row.name,
    description: row.description,
    baselineSnapshotId: row.baselineSnapshotId,
    branchSnapshotId: row.branchSnapshotId,
    parameters: (row.parameters as Record<string, unknown>) ?? {},
    deltaMetrics:
      (row.deltaMetrics as Record<
        string,
        { before: unknown; after: unknown; changePercent?: number }
      >) ?? {},
    riskAssessment: row.riskAssessment,
    recommendedActions: (row.recommendedActions as string[]) ?? [],
    confidenceScore: row.confidenceScore,
    status: row.status as ScenarioBranch['status'],
    proofChainId: row.proofChainId,
    correlationId: row.correlationId,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  }));
}

export class ScenarioForge {
  async forge(input: ScenarioForgeInput): Promise<ScenarioBranch> {
    return forgeBranch(input);
  }

  async get(branchId: string, orgId?: number): Promise<ScenarioBranch | null> {
    return getBranch(branchId, orgId);
  }

  async update(
    branchId: string,
    updates: Parameters<typeof updateBranch>[1],
    orgId?: number,
  ): Promise<ScenarioBranch | null> {
    return updateBranch(branchId, updates, orgId);
  }

  async delete(branchId: string, orgId?: number): Promise<boolean> {
    return deleteBranch(branchId, orgId);
  }

  async compare(
    branchAId: string,
    branchBId?: string,
    orgId?: number,
  ): Promise<ScenarioBranchComparison> {
    return compareBranches(branchAId, branchBId, orgId);
  }

  async list(options: Parameters<typeof listBranches>[0]): Promise<ScenarioBranch[]> {
    return listBranches(options);
  }
}

export const scenarioForge = new ScenarioForge();
