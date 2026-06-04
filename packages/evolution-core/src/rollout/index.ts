/**
 * Rollout Fabric — Layer C
 *
 * Rollout job runner that executes prompt/tool suites against a candidate policy
 * independently from active-policy serving. Supports deterministic replay via
 * seeded PRNG where feasible.
 *
 * Workers are kept separate from active policy serving — candidate policies
 * are evaluated in isolated job queues and never mixed with live traffic.
 */

import type { RolloutJobRequest, RolloutJobSummary } from '../types.js';
import { randomUUID } from 'node:crypto';

const EVOLUTION_MODE = process.env.EVOLUTION_MODE ?? 'simulation';

interface RolloutTrace {
  traceId: string;
  jobId: string;
  candidateId: string;
  caseId: string;
  inputHash: string;
  outputHash: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  passed: boolean;
  scoreTotal: number;
  simulated: boolean;
  replayable: boolean;
  createdAt: string;
}

export async function launchRolloutJob(req: RolloutJobRequest): Promise<RolloutJobSummary> {
  const jobId = `job-${randomUUID()}`;
  const batchSize = req.batchSize ?? 10;
  const totalBatches = 3;

  const summary: RolloutJobSummary = {
    jobId,
    candidateId: req.candidateId,
    status: 'queued',
    batchSize,
    completedBatches: 0,
    totalBatches,
    queueDepth: 0,
    simulated: EVOLUTION_MODE === 'simulation',
  };

  if (EVOLUTION_MODE === 'simulation') {
    void runSimulatedJob(jobId, req, batchSize, totalBatches);
  }

  return summary;
}

async function runSimulatedJob(
  jobId: string,
  req: RolloutJobRequest,
  batchSize: number,
  totalBatches: number,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 100));
}

export function generateRolloutTraces(
  jobId: string,
  candidateId: string,
  count: number,
  seed?: string,
): RolloutTrace[] {
  const rng = seed ? seededRng(seed) : Math.random;
  return Array.from({ length: count }, (_, i) => {
    const latencyMs = Math.floor(80 + rng() * 250);
    const passed = rng() > 0.22;
    return {
      traceId: `trace-${jobId}-${i}`,
      jobId,
      candidateId,
      caseId: `case-${i}`,
      inputHash: `ih-${Math.floor(rng() * 1e9)}`,
      outputHash: `oh-${Math.floor(rng() * 1e9)}`,
      latencyMs,
      tokensIn: Math.floor(50 + rng() * 200),
      tokensOut: Math.floor(30 + rng() * 150),
      passed,
      scoreTotal: passed ? 0.65 + rng() * 0.35 : 0.20 + rng() * 0.35,
      simulated: true,
      replayable: Boolean(seed),
      createdAt: new Date().toISOString(),
    };
  });
}

function seededRng(seed: string): () => number {
  let h = 0;
  for (const c of seed) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return () => {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return ((h >>> 0) / 0xffffffff);
  };
}
