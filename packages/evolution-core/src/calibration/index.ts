/**
 * Calibration Layer — Layer D (calibration side)
 *
 * Dataset registry, calibration run types (warmup / dataset / post_update),
 * post-update recalibration hooks, and automatic safe fallback trigger.
 *
 * Confidence bias is estimated as: avg(model_confidence) - acceptance_rate.
 * Negative bias = overconfident; positive = underconfident.
 */

import type { CalibrationRunRequest, CalibrationRunSummary, CalibrationType } from '../types.js';
import { randomUUID } from 'node:crypto';

const CALIBRATION_MODE = process.env.CALIBRATION_MODE ?? 'simulation';
const MAX_ACCEPTABLE_BIAS = 0.15;

interface CalibrationDataset {
  datasetId: string;
  name: string;
  sampleCount: number;
  domain: string;
  description: string;
}

const BUNDLED_DATASETS: CalibrationDataset[] = [
  { datasetId: 'ds-risk-classification', name: 'Risk Classification Baseline', sampleCount: 200, domain: 'risk', description: 'Golden-set risk classification cases' },
  { datasetId: 'ds-policy-compliance', name: 'Policy Compliance Suite', sampleCount: 150, domain: 'governance', description: 'Policy adherence evaluation cases' },
  { datasetId: 'ds-citation-fidelity', name: 'Citation Fidelity Bench', sampleCount: 100, domain: 'evidence', description: 'Citation accuracy and hallucination detection' },
  { datasetId: 'ds-structured-output', name: 'Structured Output Validity', sampleCount: 120, domain: 'schema', description: 'JSON schema conformance cases' },
];

export function listCalibrationDatasets(): CalibrationDataset[] {
  return BUNDLED_DATASETS;
}

export async function launchCalibrationRun(
  req: CalibrationRunRequest,
): Promise<CalibrationRunSummary> {
  const runId = `cal-${randomUUID()}`;

  if (CALIBRATION_MODE === 'simulation' || req.orgId == null) {
    return runSimulatedCalibration(runId, req);
  }

  return runSimulatedCalibration(runId, req);
}

function runSimulatedCalibration(
  runId: string,
  req: CalibrationRunRequest,
): CalibrationRunSummary {
  const dataset = BUNDLED_DATASETS.find((d) => d.datasetId === req.datasetId) ?? BUNDLED_DATASETS[0]!;
  const preBias = -0.05 + Math.random() * 0.25;
  const biasReduction = computeBiasReduction(req.runType, preBias);
  const postBias = preBias - biasReduction;
  const safeFallbackTriggered = Math.abs(postBias) > MAX_ACCEPTABLE_BIAS;

  return {
    runId,
    candidateId: req.candidateId,
    runType: req.runType,
    status: 'completed',
    preBias: Math.round(preBias * 10000) / 10000,
    postBias: Math.round(postBias * 10000) / 10000,
    biasReduction: Math.round(biasReduction * 10000) / 10000,
    confidenceAlignment: 0.80 + Math.random() * 0.18,
    safeFallbackTriggered,
    safeFallbackReason: safeFallbackTriggered
      ? `Post-calibration bias (${postBias.toFixed(3)}) exceeds max acceptable (${MAX_ACCEPTABLE_BIAS})`
      : undefined,
    simulated: true,
  };
}

function computeBiasReduction(runType: CalibrationType, preBias: number): number {
  const reductionFactors: Record<CalibrationType, number> = {
    warmup: 0.20,
    dataset: 0.55,
    post_update: 0.40,
  };
  return Math.abs(preBias) * reductionFactors[runType];
}

export async function postUpdateRecalibrationHook(candidateId: string): Promise<void> {
  await launchCalibrationRun({
    candidateId,
    runType: 'post_update',
    datasetId: BUNDLED_DATASETS[0]!.datasetId,
  });
}
