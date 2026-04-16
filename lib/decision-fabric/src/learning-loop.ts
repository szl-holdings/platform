/**
 * Learning loop — wire realized outcomes back into ranking & confidence.
 *
 * The fabric does not own ranking weights or confidence calibration tables,
 * but it produces a deterministic calibration report from the decision
 * record corpus that callers (decision-engine, monte-carlo) consume to
 * adjust their priors. The report is also persisted as an outcome-graph
 * learning job so the existing learning-jobs surface remains the single
 * source of truth for "what did we learn this cycle".
 */

import {
  db,
  decisionRecordsTable,
  outcomeGraphLearningJobsTable,
  type DecisionRecord,
  type OutcomeGraphLearningJob,
} from "@szl-holdings/db";
import { and, eq, gte, sql } from "drizzle-orm";

export interface CalibrationReport {
  domain: DecisionRecord["domain"];
  totalDecisions: number;
  meanAbsError: number | null;
  rollbackRate: number;
  rankingWeightDelta: number; // suggested adjustment in [-0.25, 0.25]
  confidenceMultiplier: number; // suggested multiplier in [0.5, 1.5]
}

export interface RunLearningCycleOptions {
  orgId?: number | null;
  windowDays?: number;
  triggeredBy?: string;
}

export interface LearningCycleResult {
  job: OutcomeGraphLearningJob;
  reports: CalibrationReport[];
}

/**
 * Compute per-domain calibration adjustments from realized outcomes and
 * persist the bundle as an outcome-graph learning job.
 *
 * Heuristic (deterministic, replayable):
 *   • rollbackRate > 0.2  → confidence × 0.85, weight − 0.05
 *   • meanAbsError > 0.3  → confidence × 0.9
 *   • rollbackRate < 0.05 ∧ meanAbsError ≤ 0.15 → confidence × 1.1, weight + 0.05
 */
export async function runLearningCycle(
  options: RunLearningCycleOptions = {},
): Promise<LearningCycleResult> {
  const since = new Date(Date.now() - (options.windowDays ?? 30) * 86400_000);
  const conditions: any[] = [gte(decisionRecordsTable.decidedAt, since)];
  if (options.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, options.orgId));

  const rows = await db
    .select({
      domain: decisionRecordsTable.domain,
      total: sql<number>`count(*)::int`,
      meanAbsError: sql<number | null>`avg(abs(${decisionRecordsTable.predictionError}))::float`,
      rollbacks: sql<number>`count(*) filter (where ${decisionRecordsTable.status} = 'rolled_back')::int`,
    })
    .from(decisionRecordsTable)
    .where(and(...conditions))
    .groupBy(decisionRecordsTable.domain);

  const reports: CalibrationReport[] = rows.map((r) => {
    const total = Number(r.total ?? 0);
    const rollbackRate = total > 0 ? Number(r.rollbacks ?? 0) / total : 0;
    const meanAbsError = r.meanAbsError != null ? Number(r.meanAbsError) : null;

    let rankingWeightDelta = 0;
    let confidenceMultiplier = 1;

    if (rollbackRate > 0.2) {
      confidenceMultiplier *= 0.85;
      rankingWeightDelta -= 0.05;
    }
    if (meanAbsError != null && meanAbsError > 0.3) {
      confidenceMultiplier *= 0.9;
    }
    if (rollbackRate < 0.05 && (meanAbsError == null || meanAbsError <= 0.15)) {
      confidenceMultiplier *= 1.1;
      rankingWeightDelta += 0.05;
    }

    rankingWeightDelta = Math.max(-0.25, Math.min(0.25, rankingWeightDelta));
    confidenceMultiplier = Math.max(0.5, Math.min(1.5, confidenceMultiplier));

    return {
      domain: r.domain as DecisionRecord["domain"],
      totalDecisions: total,
      meanAbsError,
      rollbackRate,
      rankingWeightDelta,
      confidenceMultiplier,
    };
  });

  const [job] = await db
    .insert(outcomeGraphLearningJobsTable)
    .values({
      orgId: options.orgId ?? null,
      jobType: "confidence_calibration",
      status: "completed",
      inputSampleSize: reports.reduce((acc, r) => acc + r.totalDecisions, 0),
      outputSummary: {
        kind: "decision_fabric_calibration",
        windowDays: options.windowDays ?? 30,
        reports,
      } as unknown as Record<string, unknown>,
      changesApplied: [],
      triggeredBy: options.triggeredBy ?? "decision-fabric",
      startedAt: new Date(),
      completedAt: new Date(),
    })
    .returning();

  return { job, reports };
}
