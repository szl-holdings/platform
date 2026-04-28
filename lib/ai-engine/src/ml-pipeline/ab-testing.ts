import {
  db,
  experimentAssignmentsTable,
  experimentEventsTable,
  experimentsTable,
  experimentVariantsTable,
} from '@szl-holdings/db';
import { and, eq, sql } from 'drizzle-orm';
import { logger } from './logger.js';
import { mlModelRegistry } from './ml-model-registry.js';

export type AbTestStatus = 'running' | 'concluded' | 'paused';
export type AbTestWinner = 'control' | 'treatment' | 'inconclusive';

export interface AbTest {
  testId: string;
  name: string;
  domain: string;
  description?: string;
  controlModelVersionId: string;
  treatmentModelVersionId: string;
  trafficSplitPct: number;
  primaryMetric: string;
  significanceThreshold: number;
  minSampleSize: number;
  status: AbTestStatus;
  winner: AbTestWinner | null;
  pValue: number | null;
  effectSize: number | null;
  controlMetrics: Record<string, number> | null;
  treatmentMetrics: Record<string, number> | null;
  sampleCount: number;
  startedAt: Date;
  concludedAt: Date | null;
}

export interface AbTestAssignment {
  testId: string;
  variant: 'control' | 'treatment';
  modelVersionId: string;
}

export interface AbTestResult {
  testId: string;
  winner: AbTestWinner;
  pValue: number;
  effectSize: number;
  controlMetrics: Record<string, number>;
  treatmentMetrics: Record<string, number>;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

function computeZTest(
  controlMean: number,
  treatmentMean: number,
  controlN: number,
  treatmentN: number,
  controlStd: number,
  treatmentStd: number,
): { pValue: number; effectSize: number } {
  if (controlN === 0 || treatmentN === 0) return { pValue: 1.0, effectSize: 0 };

  const pooledSe = Math.sqrt(controlStd ** 2 / controlN + treatmentStd ** 2 / treatmentN);
  if (pooledSe === 0) return { pValue: 1.0, effectSize: 0 };

  const z = (treatmentMean - controlMean) / pooledSe;
  const pooledStd = Math.sqrt(
    ((controlN - 1) * controlStd ** 2 + (treatmentN - 1) * treatmentStd ** 2) /
      (controlN + treatmentN - 2),
  );
  const cohensD = pooledStd > 0 ? (treatmentMean - controlMean) / pooledStd : 0;

  const absZ = Math.abs(z);
  const pValue = 2 * (1 - normalCdf(absZ));

  return { pValue: parseFloat(pValue.toFixed(6)), effectSize: parseFloat(cohensD.toFixed(4)) };
}

// ---------------------------------------------------------------------------
// DB-backed helpers
// ---------------------------------------------------------------------------

interface StoredOutcome {
  winner?: AbTestWinner;
  pValue?: number;
  effectSize?: number;
  controlMetrics?: Record<string, number>;
  treatmentMetrics?: Record<string, number>;
}

function readStoredOutcome(exp: typeof experimentsTable.$inferSelect): StoredOutcome {
  const meta = exp.metadata as Record<string, unknown> | null;
  if (!meta) return {};
  const outcome = meta.abTestOutcome as StoredOutcome | undefined;
  return outcome ?? {};
}

function mapDbRowToAbTest(
  exp: typeof experimentsTable.$inferSelect,
  controlVariant: typeof experimentVariantsTable.$inferSelect,
  treatmentVariant: typeof experimentVariantsTable.$inferSelect,
  extraFields?: {
    winner?: AbTestWinner;
    pValue?: number;
    effectSize?: number;
    controlMetrics?: Record<string, number>;
    treatmentMetrics?: Record<string, number>;
    sampleCount?: number;
  },
): AbTest {
  const statusMap: Record<string, AbTestStatus> = {
    running: 'running',
    paused: 'paused',
    concluded: 'concluded',
    stopped: 'concluded',
    draft: 'running',
  };

  const stored = readStoredOutcome(exp);
  const meta = exp.metadata as Record<string, unknown> | null;

  return {
    testId: exp.key,
    name: exp.name,
    domain: (meta?.domain as string | undefined) ?? 'unknown',
    description: exp.description ?? undefined,
    controlModelVersionId: controlVariant.mlModelVersionId ?? '',
    treatmentModelVersionId: treatmentVariant.mlModelVersionId ?? '',
    trafficSplitPct: treatmentVariant.trafficWeight / 100,
    primaryMetric: exp.primaryMetric,
    significanceThreshold: parseFloat(String(exp.significanceThreshold)),
    minSampleSize: exp.minSampleSize,
    status: statusMap[exp.status] ?? 'running',
    winner: extraFields?.winner ?? stored.winner ?? null,
    pValue: extraFields?.pValue ?? stored.pValue ?? null,
    effectSize: extraFields?.effectSize ?? stored.effectSize ?? null,
    controlMetrics: extraFields?.controlMetrics ?? stored.controlMetrics ?? null,
    treatmentMetrics: extraFields?.treatmentMetrics ?? stored.treatmentMetrics ?? null,
    sampleCount: extraFields?.sampleCount ?? 0,
    startedAt: exp.startedAt ?? exp.createdAt,
    concludedAt: exp.concludedAt ?? null,
  };
}

// ---------------------------------------------------------------------------
// A/B Test API (all async, DB-backed)
// ---------------------------------------------------------------------------

export async function createAbTest(input: {
  name: string;
  domain: string;
  description?: string;
  controlModelVersionId: string;
  treatmentModelVersionId: string;
  trafficSplitPct?: number;
  primaryMetric?: string;
  significanceThreshold?: number;
  minSampleSize?: number;
}): Promise<AbTest> {
  const control = mlModelRegistry.getModel(input.controlModelVersionId);
  const treatment = mlModelRegistry.getModel(input.treatmentModelVersionId);

  if (!control) throw new Error(`Control model ${input.controlModelVersionId} not found`);
  if (!treatment) throw new Error(`Treatment model ${input.treatmentModelVersionId} not found`);
  if (control.domain !== treatment.domain)
    throw new Error('Control and treatment models must belong to the same domain');

  const testKey = `ab-${crypto.randomUUID()}`;
  const trafficSplitPct = input.trafficSplitPct ?? 0.5;

  const [experiment] = await db
    .insert(experimentsTable)
    .values({
      key: testKey,
      name: input.name,
      description: input.description,
      type: 'ml_model',
      status: 'running',
      primaryMetric: input.primaryMetric ?? 'accuracy',
      trafficAllocation: 100,
      isBandit: false,
      minSampleSize: input.minSampleSize ?? 100,
      significanceThreshold: String(input.significanceThreshold ?? 0.05),
      startedAt: new Date(),
      metadata: { domain: input.domain },
    })
    .returning();

  if (!experiment) throw new Error('Failed to create ab-test experiment record');

  const treatmentWeight = Math.round(trafficSplitPct * 100);
  const controlWeight = 100 - treatmentWeight;

  const [controlVariant, treatmentVariant] = await db
    .insert(experimentVariantsTable)
    .values([
      {
        experimentId: experiment.id,
        key: 'control',
        name: 'Control',
        isControl: true,
        trafficWeight: controlWeight,
        mlModelVersionId: input.controlModelVersionId,
      },
      {
        experimentId: experiment.id,
        key: 'treatment',
        name: 'Treatment',
        isControl: false,
        trafficWeight: treatmentWeight,
        mlModelVersionId: input.treatmentModelVersionId,
      },
    ])
    .returning();

  logger.info({ testId: testKey, domain: input.domain, name: input.name }, 'A/B test created');

  return mapDbRowToAbTest(experiment, controlVariant!, treatmentVariant!);
}

export async function assignVariant(testId: string, entityId: string): Promise<AbTestAssignment | null> {
  const [experiment] = await db
    .select()
    .from(experimentsTable)
    .where(eq(experimentsTable.key, testId))
    .limit(1);

  if (!experiment || experiment.status !== 'running') return null;

  const variants = await db
    .select()
    .from(experimentVariantsTable)
    .where(eq(experimentVariantsTable.experimentId, experiment.id))
    .orderBy(experimentVariantsTable.id);

  const controlVariant = variants.find((v) => v.isControl);
  const treatmentVariant = variants.find((v) => !v.isControl);
  if (!controlVariant || !treatmentVariant) return null;

  const [existing] = await db
    .select()
    .from(experimentAssignmentsTable)
    .where(
      and(
        eq(experimentAssignmentsTable.experimentId, experiment.id),
        eq(experimentAssignmentsTable.entityId, entityId),
      ),
    )
    .limit(1);

  let assignedVariant: typeof variants[0];

  if (existing) {
    assignedVariant = variants.find((v) => v.id === existing.variantId) ?? controlVariant;
  } else {
    const hash = entityId.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
    const normalised = (hash % 1000) / 1000;
    const trafficSplit = treatmentVariant.trafficWeight / 100;
    assignedVariant = normalised < trafficSplit ? treatmentVariant : controlVariant;

    await db
      .insert(experimentAssignmentsTable)
      .values({
        experimentId: experiment.id,
        variantId: assignedVariant.id,
        entityType: 'user',
        entityId,
      })
      .onConflictDoNothing();
  }

  const isControl = assignedVariant.isControl;
  const modelVersionId = assignedVariant.mlModelVersionId ?? '';

  return {
    testId,
    variant: isControl ? 'control' : 'treatment',
    modelVersionId,
  };
}

export async function recordAbTestOutcome(
  testId: string,
  variant: 'control' | 'treatment',
  metricValue: number,
): Promise<void> {
  const [experiment] = await db
    .select()
    .from(experimentsTable)
    .where(eq(experimentsTable.key, testId))
    .limit(1);

  if (!experiment || experiment.status !== 'running') return;

  const variants = await db
    .select()
    .from(experimentVariantsTable)
    .where(eq(experimentVariantsTable.experimentId, experiment.id));

  const targetVariant = variants.find((v) =>
    variant === 'control' ? v.isControl : !v.isControl,
  );

  if (!targetVariant) return;

  await db.insert(experimentEventsTable).values({
    experimentId: experiment.id,
    variantId: targetVariant.id,
    entityId: 'batch',
    eventType: 'metric',
    metricKey: experiment.primaryMetric,
    metricValue: String(metricValue),
  });
}

export async function evaluateAbTest(testId: string): Promise<AbTestResult | null> {
  const [experiment] = await db
    .select()
    .from(experimentsTable)
    .where(eq(experimentsTable.key, testId))
    .limit(1);

  if (!experiment) return null;

  const variants = await db
    .select()
    .from(experimentVariantsTable)
    .where(eq(experimentVariantsTable.experimentId, experiment.id));

  const controlVariant = variants.find((v) => v.isControl);
  const treatmentVariant = variants.find((v) => !v.isControl);
  if (!controlVariant || !treatmentVariant) return null;

  const aggregates = await db
    .select({
      variantId: experimentEventsTable.variantId,
      count: sql<number>`count(*)::int`,
      metricSum: sql<number>`coalesce(sum(metric_value::numeric), 0)`,
      metricSumSq: sql<number>`coalesce(sum((metric_value::numeric)^2), 0)`,
    })
    .from(experimentEventsTable)
    .where(
      and(
        eq(experimentEventsTable.experimentId, experiment.id),
        eq(experimentEventsTable.eventType, 'metric'),
      ),
    )
    .groupBy(experimentEventsTable.variantId);

  const cAgg = aggregates.find((a) => a.variantId === controlVariant.id);
  const tAgg = aggregates.find((a) => a.variantId === treatmentVariant.id);

  const cCount = cAgg?.count ?? 0;
  const tCount = tAgg?.count ?? 0;
  const minSampleSize = experiment.minSampleSize;

  if (cCount < minSampleSize || tCount < minSampleSize) return null;

  const cMean = cCount > 0 ? (cAgg?.metricSum ?? 0) / cCount : 0;
  const tMean = tCount > 0 ? (tAgg?.metricSum ?? 0) / tCount : 0;
  const cVariance =
    cCount > 1 ? ((cAgg?.metricSumSq ?? 0) - cCount * cMean ** 2) / (cCount - 1) : 0;
  const tVariance =
    tCount > 1 ? ((tAgg?.metricSumSq ?? 0) - tCount * tMean ** 2) / (tCount - 1) : 0;
  const cStd = Math.sqrt(Math.max(0, cVariance));
  const tStd = Math.sqrt(Math.max(0, tVariance));

  const significanceThreshold = parseFloat(String(experiment.significanceThreshold));
  const { pValue, effectSize } = computeZTest(cMean, tMean, cCount, tCount, cStd, tStd);

  let winner: AbTestWinner = 'inconclusive';
  if (pValue < significanceThreshold) {
    winner = tMean > cMean ? 'treatment' : 'control';
  }

  const controlSummary = {
    mean: parseFloat(cMean.toFixed(4)),
    std: parseFloat(cStd.toFixed(4)),
    count: cCount,
  };
  const treatmentSummary = {
    mean: parseFloat(tMean.toFixed(4)),
    std: parseFloat(tStd.toFixed(4)),
    count: tCount,
  };

  const improvement = cMean > 0 ? ((tMean - cMean) / cMean) * 100 : 0;
  const recommendation =
    winner === 'treatment'
      ? `Promote treatment model — statistically significant improvement of ${improvement.toFixed(1)}% (p=${pValue}).`
      : winner === 'control'
        ? `Retain control model — treatment underperforms by ${Math.abs(improvement).toFixed(1)}% (p=${pValue}).`
        : `Continue test — insufficient evidence (p=${pValue}, threshold ${significanceThreshold}). Need ${Math.max(0, minSampleSize - Math.min(cCount, tCount))} more samples.`;

  return {
    testId,
    winner,
    pValue,
    effectSize,
    controlMetrics: controlSummary,
    treatmentMetrics: treatmentSummary,
    recommendation,
  };
}

export async function concludeAbTest(testId: string): Promise<AbTest | null> {
  const [experiment] = await db
    .select()
    .from(experimentsTable)
    .where(eq(experimentsTable.key, testId))
    .limit(1);

  if (!experiment || experiment.status !== 'running') return null;

  const variants = await db
    .select()
    .from(experimentVariantsTable)
    .where(eq(experimentVariantsTable.experimentId, experiment.id));

  const controlVariant = variants.find((v) => v.isControl);
  const treatmentVariant = variants.find((v) => !v.isControl);
  if (!controlVariant || !treatmentVariant) return null;

  const result = await evaluateAbTest(testId);

  let winnerId: number | null = null;
  if (result?.winner === 'treatment') {
    winnerId = treatmentVariant.id;
  } else if (result?.winner === 'control') {
    winnerId = controlVariant.id;
  }

  const existingMetadata = (experiment.metadata as Record<string, unknown> | null) ?? {};
  const outcomeMetadata = {
    ...existingMetadata,
    abTestOutcome: {
      winner: result?.winner ?? 'inconclusive',
      pValue: result?.pValue ?? null,
      effectSize: result?.effectSize ?? null,
      controlMetrics: result?.controlMetrics ?? null,
      treatmentMetrics: result?.treatmentMetrics ?? null,
      concludedAt: new Date().toISOString(),
    },
  };

  const [updatedExperiment] = await db
    .update(experimentsTable)
    .set({
      status: 'concluded',
      concludedAt: new Date(),
      updatedAt: new Date(),
      winnerId,
      metadata: outcomeMetadata,
    })
    .where(eq(experimentsTable.key, testId))
    .returning();

  if (!updatedExperiment) return null;

  if (result?.winner === 'treatment' && treatmentVariant.mlModelVersionId) {
    mlModelRegistry.promoteModel(treatmentVariant.mlModelVersionId, 'production', 'ab-test-auto');
    logger.info(
      { testId, winner: 'treatment' },
      'A/B test concluded — treatment model promoted to production',
    );
  }

  return mapDbRowToAbTest(updatedExperiment, controlVariant, treatmentVariant, {
    winner: result?.winner,
    pValue: result?.pValue,
    effectSize: result?.effectSize,
    controlMetrics: result?.controlMetrics,
    treatmentMetrics: result?.treatmentMetrics,
  });
}

export async function getAbTest(testId: string): Promise<AbTest | null> {
  const [experiment] = await db
    .select()
    .from(experimentsTable)
    .where(eq(experimentsTable.key, testId))
    .limit(1);

  if (!experiment) return null;

  const variants = await db
    .select()
    .from(experimentVariantsTable)
    .where(eq(experimentVariantsTable.experimentId, experiment.id));

  const controlVariant = variants.find((v) => v.isControl);
  const treatmentVariant = variants.find((v) => !v.isControl);
  if (!controlVariant || !treatmentVariant) return null;

  return mapDbRowToAbTest(experiment, controlVariant, treatmentVariant);
}

export async function listAbTests(domain?: string): Promise<AbTest[]> {
  const experiments = await db
    .select()
    .from(experimentsTable)
    .where(eq(experimentsTable.type, 'ml_model'));

  const results: AbTest[] = [];

  for (const exp of experiments) {
    const expDomain = (exp.metadata as Record<string, string> | null)?.domain ?? 'unknown';
    if (domain && expDomain !== domain) continue;

    const variants = await db
      .select()
      .from(experimentVariantsTable)
      .where(eq(experimentVariantsTable.experimentId, exp.id));

    const controlVariant = variants.find((v) => v.isControl);
    const treatmentVariant = variants.find((v) => !v.isControl);
    if (!controlVariant || !treatmentVariant) continue;

    results.push(mapDbRowToAbTest(exp, controlVariant, treatmentVariant));
  }

  return results;
}

export async function getAbTestSummary(): Promise<{
  total: number;
  running: number;
  concluded: number;
  treatmentWins: number;
  controlWins: number;
  inconclusive: number;
}> {
  const experiments = await db
    .select()
    .from(experimentsTable)
    .where(eq(experimentsTable.type, 'ml_model'));

  let treatmentWins = 0;
  let controlWins = 0;
  let inconclusive = 0;
  const concluded = experiments.filter((e) => e.status === 'concluded' || e.status === 'stopped');

  for (const exp of concluded) {
    if (exp.winnerId === null) {
      inconclusive++;
      continue;
    }

    const [winnerVariant] = await db
      .select({ isControl: experimentVariantsTable.isControl })
      .from(experimentVariantsTable)
      .where(eq(experimentVariantsTable.id, exp.winnerId))
      .limit(1);

    if (winnerVariant?.isControl) {
      controlWins++;
    } else {
      treatmentWins++;
    }
  }

  return {
    total: experiments.length,
    running: experiments.filter((e) => e.status === 'running').length,
    concluded: concluded.length,
    treatmentWins,
    controlWins,
    inconclusive,
  };
}
