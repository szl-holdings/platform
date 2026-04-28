import {
  db,
  experimentAssignmentsTable,
  experimentEventsTable,
  experimentsTable,
  experimentVariantsTable,
  type Experiment,
  type ExperimentVariant,
} from '@szl-holdings/db';
import { and, eq, sql } from 'drizzle-orm';
import { runBayesianConversionAnalysis, runBayesianContinuousAnalysis } from '@szl-holdings/ai-engine/ml-pipeline';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Hash-based bucketing (compatible with existing feature-flag rollout logic)
// ---------------------------------------------------------------------------

function computeExperimentBucket(experimentKey: string, entityId: string): number {
  const combined = `${experimentKey}:${entityId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 10000;
}

// ---------------------------------------------------------------------------
// Variant assignment
// ---------------------------------------------------------------------------

export async function resolveVariant(
  experimentKey: string,
  entityId: string,
  entityType: 'user' | 'org' | 'session' | 'device' = 'user',
): Promise<{ variantKey: string; variantId: number; experimentId: number } | null> {
  try {
    const [experiment] = await db
      .select()
      .from(experimentsTable)
      .where(eq(experimentsTable.key, experimentKey))
      .limit(1);

    if (!experiment || experiment.status !== 'running') return null;

    const variants = await db
      .select()
      .from(experimentVariantsTable)
      .where(eq(experimentVariantsTable.experimentId, experiment.id))
      .orderBy(experimentVariantsTable.id);

    if (variants.length === 0) return null;

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

    if (existing) {
      const assignedVariant = variants.find((v) => v.id === existing.variantId);
      if (assignedVariant) {
        return {
          variantKey: assignedVariant.key,
          variantId: assignedVariant.id,
          experimentId: experiment.id,
        };
      }
    }

    let assignedVariant: ExperimentVariant | null;

    if (experiment.isBandit) {
      const banditWeights = await getBanditWeights(experiment, variants);
      assignedVariant = sampleBanditVariant(variants, banditWeights);
    } else {
      assignedVariant = deterministicAssign(experiment, variants, entityId);
    }

    if (!assignedVariant) return null;

    await db
      .insert(experimentAssignmentsTable)
      .values({
        experimentId: experiment.id,
        variantId: assignedVariant.id,
        entityType,
        entityId,
      })
      .onConflictDoNothing();

    return {
      variantKey: assignedVariant.key,
      variantId: assignedVariant.id,
      experimentId: experiment.id,
    };
  } catch (err) {
    logger.warn({ err, experimentKey, entityId }, 'Experiment variant resolution failed');
    return null;
  }
}

function deterministicAssign(
  experiment: Experiment,
  variants: ExperimentVariant[],
  entityId: string,
): ExperimentVariant | null {
  const totalWeight = variants.reduce((s, v) => s + v.trafficWeight, 0);
  const bucket = computeExperimentBucket(experiment.key, entityId);
  const inTraffic = bucket < (experiment.trafficAllocation / 100) * 10000;

  if (!inTraffic) {
    return null;
  }

  const normalized = bucket % totalWeight;
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.trafficWeight;
    if (normalized < cumulative) return variant;
  }
  return variants[variants.length - 1] as ExperimentVariant;
}

async function getBanditWeights(
  experiment: Experiment,
  variants: ExperimentVariant[],
): Promise<Record<number, number>> {
  const events = await db
    .select({
      variantId: experimentEventsTable.variantId,
      eventType: experimentEventsTable.eventType,
      count: sql<number>`count(*)::int`,
    })
    .from(experimentEventsTable)
    .where(eq(experimentEventsTable.experimentId, experiment.id))
    .groupBy(experimentEventsTable.variantId, experimentEventsTable.eventType);

  const exposures: Record<number, number> = {};
  const conversions: Record<number, number> = {};
  for (const e of events) {
    if (e.eventType === 'exposure') exposures[e.variantId] = e.count;
    if (e.eventType === 'conversion') conversions[e.variantId] = e.count;
  }

  const inputs = variants.map((v) => ({
    variantKey: String(v.id),
    conversions: conversions[v.id] ?? 0,
    exposures: exposures[v.id] ?? 1,
    isControl: v.isControl,
  }));

  const analysis = runBayesianConversionAnalysis(inputs, { isBandit: true });
  const weights: Record<number, number> = {};
  for (const r of analysis.variants) {
    const variantId = parseInt(r.variantKey, 10);
    weights[variantId] = analysis.banditWeights[r.variantKey] ?? 1 / variants.length;
  }
  return weights;
}

function sampleBanditVariant(
  variants: ExperimentVariant[],
  weights: Record<number, number>,
): ExperimentVariant {
  const totalWeight = variants.reduce((s, v) => s + (weights[v.id] ?? 1 / variants.length), 0);
  let r = Math.random() * totalWeight;
  for (const v of variants) {
    r -= weights[v.id] ?? 1 / variants.length;
    if (r <= 0) return v;
  }
  return variants[variants.length - 1] as ExperimentVariant;
}

// ---------------------------------------------------------------------------
// Event tracking
// ---------------------------------------------------------------------------

export async function trackExposure(
  experimentId: number,
  variantId: number,
  entityId: string,
): Promise<void> {
  try {
    await db.insert(experimentEventsTable).values({
      experimentId,
      variantId,
      entityId,
      eventType: 'exposure',
    });
  } catch (err) {
    logger.warn({ err, experimentId, variantId }, 'Failed to track exposure event');
  }
}

export async function trackConversion(
  experimentId: number,
  variantId: number,
  entityId: string,
  metricKey?: string,
  metricValue?: number,
): Promise<void> {
  try {
    await db.insert(experimentEventsTable).values({
      experimentId,
      variantId,
      entityId,
      eventType: 'conversion',
      metricKey: metricKey ?? null,
      metricValue: metricValue !== undefined ? String(metricValue) : null,
    });
  } catch (err) {
    logger.warn({ err, experimentId, variantId }, 'Failed to track conversion event');
  }
}

export async function trackMetric(
  experimentId: number,
  variantId: number,
  entityId: string,
  metricKey: string,
  metricValue: number,
): Promise<void> {
  try {
    await db.insert(experimentEventsTable).values({
      experimentId,
      variantId,
      entityId,
      eventType: 'metric',
      metricKey,
      metricValue: String(metricValue),
    });
  } catch (err) {
    logger.warn({ err, experimentId, variantId }, 'Failed to track metric event');
  }
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface VariantMetrics {
  variantId: number;
  variantKey: string;
  variantName: string;
  isControl: boolean;
  exposures: number;
  conversions: number;
  conversionRate: number;
  metricSum: number;
  metricSumSq: number;
  errorCount: number;
}

export interface ExperimentAnalysis {
  experimentId: number;
  experimentKey: string;
  variantMetrics: VariantMetrics[];
  bayesian: ReturnType<typeof runBayesianConversionAnalysis> | ReturnType<typeof runBayesianContinuousAnalysis>;
  frequentist: FrequentistResult | null;
  guardRailsStatus: GuardRailStatus[];
  shouldAutoStop: boolean;
  autoStopReason: string | null;
}

export interface FrequentistResult {
  pValue: number;
  effectSize: number;
  winner: 'control' | 'treatment' | 'inconclusive';
}

export interface GuardRailStatus {
  metric: string;
  status: 'ok' | 'warning' | 'violated';
  controlValue: number;
  variantValue: number;
  relativeDrop: number;
  threshold: number;
}

export async function analyzeExperiment(experimentId: number): Promise<ExperimentAnalysis | null> {
  try {
    const [experiment] = await db
      .select()
      .from(experimentsTable)
      .where(eq(experimentsTable.id, experimentId))
      .limit(1);

    if (!experiment) return null;

    const variants = await db
      .select()
      .from(experimentVariantsTable)
      .where(eq(experimentVariantsTable.experimentId, experimentId))
      .orderBy(experimentVariantsTable.id);

    const eventAggregates = await db
      .select({
        variantId: experimentEventsTable.variantId,
        eventType: experimentEventsTable.eventType,
        count: sql<number>`count(*)::int`,
        metricSum: sql<number>`coalesce(sum(metric_value::numeric), 0)`,
        metricSumSq: sql<number>`coalesce(sum((metric_value::numeric)^2), 0)`,
      })
      .from(experimentEventsTable)
      .where(eq(experimentEventsTable.experimentId, experimentId))
      .groupBy(experimentEventsTable.variantId, experimentEventsTable.eventType);

    const variantMetrics: VariantMetrics[] = variants.map((v) => {
      const exposure = eventAggregates.find(
        (e) => e.variantId === v.id && e.eventType === 'exposure',
      );
      const conversion = eventAggregates.find(
        (e) => e.variantId === v.id && e.eventType === 'conversion',
      );
      const metric = eventAggregates.find(
        (e) => e.variantId === v.id && e.eventType === 'metric',
      );
      const error = eventAggregates.find(
        (e) => e.variantId === v.id && e.eventType === 'error',
      );

      const exposures = exposure?.count ?? 0;
      const conversions = conversion?.count ?? 0;
      return {
        variantId: v.id,
        variantKey: v.key,
        variantName: v.name,
        isControl: v.isControl,
        exposures,
        conversions,
        conversionRate: exposures > 0 ? conversions / exposures : 0,
        metricSum: metric?.metricSum ?? 0,
        metricSumSq: metric?.metricSumSq ?? 0,
        errorCount: error?.count ?? 0,
      };
    });

    const minSampleSize = experiment.minSampleSize;
    const isPrimaryMetricContinuous =
      variantMetrics.some((v) => v.metricSum !== 0) &&
      variantMetrics.every((v) => v.conversions === 0);

    const bayesianInputs = variantMetrics.map((v) => ({
      variantKey: v.variantKey,
      conversions: v.conversions,
      exposures: v.exposures,
      metricSum: v.metricSum,
      metricSumSq: v.metricSumSq,
      isControl: v.isControl,
    }));

    const bayesian = isPrimaryMetricContinuous
      ? runBayesianContinuousAnalysis(bayesianInputs, { isBandit: experiment.isBandit, minSampleSize })
      : runBayesianConversionAnalysis(bayesianInputs, { isBandit: experiment.isBandit, minSampleSize });

    const frequentist = computeFrequentist(variantMetrics);

    const guardRails = evaluateGuardRails(experiment, variantMetrics);
    const violated = guardRails.filter((g) => g.status === 'violated');
    const shouldAutoStop = violated.length > 0;
    const autoStopReason = shouldAutoStop
      ? `Guard rail violated: ${violated.map((g) => g.metric).join(', ')}`
      : null;

    return {
      experimentId,
      experimentKey: experiment.key,
      variantMetrics,
      bayesian,
      frequentist,
      guardRailsStatus: guardRails,
      shouldAutoStop,
      autoStopReason,
    };
  } catch (err) {
    logger.error({ err, experimentId }, 'Experiment analysis failed');
    return null;
  }
}

function computeFrequentist(variantMetrics: VariantMetrics[]): FrequentistResult | null {
  const control = variantMetrics.find((v) => v.isControl);
  const treatment = variantMetrics.find((v) => !v.isControl);
  if (!control || !treatment) return null;

  const cn = control.exposures;
  const tn = treatment.exposures;
  if (cn === 0 || tn === 0) return null;

  const cp = control.conversionRate;
  const tp = treatment.conversionRate;
  const pooledP = (control.conversions + treatment.conversions) / (cn + tn);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / cn + 1 / tn));
  if (se === 0) return null;

  const z = (tp - cp) / se;
  const absZ = Math.abs(z);
  const pValue = 2 * (1 - normalCdf(absZ));

  const pooledStd = Math.sqrt(
    (cn * cp * (1 - cp) + tn * tp * (1 - tp)) / (cn + tn - 2),
  );
  const effectSize = pooledStd > 0 ? (tp - cp) / pooledStd : 0;

  let winner: 'control' | 'treatment' | 'inconclusive' = 'inconclusive';
  if (pValue < 0.05) {
    winner = tp > cp ? 'treatment' : 'control';
  }

  return { pValue: parseFloat(pValue.toFixed(6)), effectSize, winner };
}

function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

function evaluateGuardRails(
  experiment: Experiment,
  variantMetrics: VariantMetrics[],
): GuardRailStatus[] {
  const guardRailMetrics = (experiment.guardRailMetrics as { metric: string; maxAllowedRelativeDrop?: number }[] | null) ?? [];
  if (guardRailMetrics.length === 0) {
    const control = variantMetrics.find((v) => v.isControl);
    const treatments = variantMetrics.filter((v) => !v.isControl);

    const statuses: GuardRailStatus[] = [];
    for (const treatment of treatments) {
      const controlErrors = control?.errorCount ?? 0;
      const treatmentErrors = treatment.errorCount;
      const controlRate = control && control.exposures > 0 ? controlErrors / control.exposures : 0;
      const treatmentRate = treatment.exposures > 0 ? treatmentErrors / treatment.exposures : 0;
      const relativeDrop = controlRate > 0 ? (treatmentRate - controlRate) / controlRate : 0;

      statuses.push({
        metric: 'error_rate',
        status:
          relativeDrop > 0.5 ? 'violated' : relativeDrop > 0.2 ? 'warning' : 'ok',
        controlValue: controlRate,
        variantValue: treatmentRate,
        relativeDrop,
        threshold: 0.5,
      });
    }
    return statuses;
  }

  const statuses: GuardRailStatus[] = [];
  const control = variantMetrics.find((v) => v.isControl);

  for (const guardRail of guardRailMetrics) {
    const maxAllowedRelativeDrop = guardRail.maxAllowedRelativeDrop ?? 0.2;
    const treatments = variantMetrics.filter((v) => !v.isControl);
    for (const treatment of treatments) {
      const controlValue = control?.conversionRate ?? 0;
      const treatmentValue = treatment.conversionRate;
      const relativeDrop =
        controlValue > 0 ? (controlValue - treatmentValue) / controlValue : 0;

      statuses.push({
        metric: guardRail.metric,
        status:
          relativeDrop > maxAllowedRelativeDrop
            ? 'violated'
            : relativeDrop > maxAllowedRelativeDrop * 0.7
              ? 'warning'
              : 'ok',
        controlValue,
        variantValue: treatmentValue,
        relativeDrop,
        threshold: maxAllowedRelativeDrop,
      });
    }
  }
  return statuses;
}

// ---------------------------------------------------------------------------
// Auto-stopping guard rail check
// ---------------------------------------------------------------------------

export async function checkAndEnforceGuardRails(experimentId: number): Promise<void> {
  try {
    const analysis = await analyzeExperiment(experimentId);
    if (!analysis || !analysis.shouldAutoStop) return;

    await db
      .update(experimentsTable)
      .set({
        status: 'stopped',
        concludedAt: new Date(),
        stopReason: analysis.autoStopReason,
        updatedAt: new Date(),
      })
      .where(
        and(eq(experimentsTable.id, experimentId), eq(experimentsTable.status, 'running')),
      );

    logger.warn(
      { experimentId, reason: analysis.autoStopReason },
      'Experiment auto-stopped by guard rail',
    );
  } catch (err) {
    logger.error({ err, experimentId }, 'Guard rail check failed');
  }
}
