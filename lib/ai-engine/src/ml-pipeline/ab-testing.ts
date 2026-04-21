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
// In-memory test store
// ---------------------------------------------------------------------------

const testStore = new Map<string, AbTest>();

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

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

  // Approximate two-tailed p-value from z-score
  const absZ = Math.abs(z);
  const pValue = 2 * (1 - normalCdf(absZ));

  return { pValue: parseFloat(pValue.toFixed(6)), effectSize: parseFloat(cohensD.toFixed(4)) };
}

function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

// ---------------------------------------------------------------------------
// A/B Test API
// ---------------------------------------------------------------------------

export function createAbTest(input: {
  name: string;
  domain: string;
  description?: string;
  controlModelVersionId: string;
  treatmentModelVersionId: string;
  trafficSplitPct?: number;
  primaryMetric?: string;
  significanceThreshold?: number;
  minSampleSize?: number;
}): AbTest {
  const control = mlModelRegistry.getModel(input.controlModelVersionId);
  const treatment = mlModelRegistry.getModel(input.treatmentModelVersionId);

  if (!control) throw new Error(`Control model ${input.controlModelVersionId} not found`);
  if (!treatment) throw new Error(`Treatment model ${input.treatmentModelVersionId} not found`);
  if (control.domain !== treatment.domain)
    throw new Error('Control and treatment models must belong to the same domain');

  const test: AbTest = {
    testId: `ab-${crypto.randomUUID()}`,
    name: input.name,
    domain: input.domain,
    ...(input.description !== undefined ? { description: input.description } : {}),
    controlModelVersionId: input.controlModelVersionId,
    treatmentModelVersionId: input.treatmentModelVersionId,
    trafficSplitPct: input.trafficSplitPct ?? 0.5,
    primaryMetric: input.primaryMetric ?? 'accuracy',
    significanceThreshold: input.significanceThreshold ?? 0.05,
    minSampleSize: input.minSampleSize ?? 100,
    status: 'running',
    winner: null,
    pValue: null,
    effectSize: null,
    controlMetrics: null,
    treatmentMetrics: null,
    sampleCount: 0,
    startedAt: new Date(),
    concludedAt: null,
  };

  testStore.set(test.testId, test);
  logger.info({ testId: test.testId, domain: input.domain, name: input.name }, 'A/B test created');
  return test;
}

export function assignVariant(testId: string, entityId: string): AbTestAssignment | null {
  const test = testStore.get(testId);
  if (!test || test.status !== 'running') return null;

  const hash = entityId.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  const normalised = (hash % 1000) / 1000;
  const variant: 'control' | 'treatment' =
    normalised < test.trafficSplitPct ? 'treatment' : 'control';
  const modelVersionId =
    variant === 'treatment' ? test.treatmentModelVersionId : test.controlModelVersionId;

  return { testId, variant, modelVersionId };
}

export function recordAbTestOutcome(
  testId: string,
  variant: 'control' | 'treatment',
  metricValue: number,
): void {
  const test = testStore.get(testId);
  if (!test || test.status !== 'running') return;

  test.sampleCount++;

  if (!test.controlMetrics) test.controlMetrics = { sum: 0, count: 0, sumSq: 0 };
  if (!test.treatmentMetrics) test.treatmentMetrics = { sum: 0, count: 0, sumSq: 0 };

  const target = variant === 'control' ? test.controlMetrics : test.treatmentMetrics;
  target['sum'] = (target['sum'] ?? 0) + metricValue;
  target['sumSq'] = (target['sumSq'] ?? 0) + metricValue ** 2;
  target['count'] = (target['count'] ?? 0) + 1;
}

export function evaluateAbTest(testId: string): AbTestResult | null {
  const test = testStore.get(testId);
  if (!test) return null;

  const cm = test.controlMetrics;
  const tm = test.treatmentMetrics;
  if (!cm || !tm) return null;

  const cCount = cm['count'] ?? 0;
  const tCount = tm['count'] ?? 0;

  if (cCount < test.minSampleSize || tCount < test.minSampleSize) return null;

  const cMean = cCount > 0 ? (cm['sum'] ?? 0) / cCount : 0;
  const tMean = tCount > 0 ? (tm['sum'] ?? 0) / tCount : 0;
  const cVariance = cCount > 1 ? ((cm['sumSq'] ?? 0) - cCount * cMean ** 2) / (cCount - 1) : 0;
  const tVariance = tCount > 1 ? ((tm['sumSq'] ?? 0) - tCount * tMean ** 2) / (tCount - 1) : 0;
  const cStd = Math.sqrt(Math.max(0, cVariance));
  const tStd = Math.sqrt(Math.max(0, tVariance));

  const { pValue, effectSize } = computeZTest(cMean, tMean, cCount, tCount, cStd, tStd);

  let winner: AbTestWinner = 'inconclusive';
  if (pValue < test.significanceThreshold) {
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
        : `Continue test — insufficient evidence (p=${pValue}, threshold ${test.significanceThreshold}). Need ${Math.max(0, test.minSampleSize - Math.min(cCount, tCount))} more samples.`;

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

export function concludeAbTest(testId: string): AbTest | null {
  const test = testStore.get(testId);
  if (!test || test.status !== 'running') return null;

  const result = evaluateAbTest(testId);
  if (result) {
    test.winner = result.winner;
    test.pValue = result.pValue;
    test.effectSize = result.effectSize;
    test.controlMetrics = result.controlMetrics;
    test.treatmentMetrics = result.treatmentMetrics;
  }

  test.status = 'concluded';
  test.concludedAt = new Date();

  if (result?.winner === 'treatment') {
    mlModelRegistry.promoteModel(test.treatmentModelVersionId, 'production', 'ab-test-auto');
    logger.info(
      { testId, winner: 'treatment' },
      'A/B test concluded — treatment model promoted to production',
    );
  }

  return test;
}

export function getAbTest(testId: string): AbTest | null {
  return testStore.get(testId) ?? null;
}

export function listAbTests(domain?: string): AbTest[] {
  const all = Array.from(testStore.values());
  return domain ? all.filter((t) => t.domain === domain) : all;
}

export function getAbTestSummary() {
  const tests = Array.from(testStore.values());
  return {
    total: tests.length,
    running: tests.filter((t) => t.status === 'running').length,
    concluded: tests.filter((t) => t.status === 'concluded').length,
    treatmentWins: tests.filter((t) => t.winner === 'treatment').length,
    controlWins: tests.filter((t) => t.winner === 'control').length,
    inconclusive: tests.filter((t) => t.winner === 'inconclusive').length,
  };
}
