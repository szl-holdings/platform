/**
 * Scheduled Eval Pipeline
 *
 * Runs golden-set evals on a schedule, persists results to eval_runs table,
 * computes per-agent confidence calibration scores, and exposes a summary endpoint.
 */

import { alloyOutcomeLearning, db, evalRuns } from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { desc, sql } from 'drizzle-orm';
import { type EvalReport, runEvals } from '../evals/run-evals.js';

const logger = {
  warn: (_obj: Record<string, unknown>, _msg: string) => {},
  error: (_obj: Record<string, unknown>, _msg: string) => {},
  info: (_msg: string) => {},
};

export interface AgentCalibrationSummary {
  agentId: string;
  totalDecisions: number;
  acceptanceRate: number;
  calibrationBias: number;
  recommendedAdjustment: number;
}

/**
 * Computes per-agent calibration metrics from outcome learning data.
 * These are attached to eval reports so the eval history endpoint provides
 * actionable confidence calibration signals alongside pass/fail metrics.
 */
export async function computeAgentCalibrations(): Promise<AgentCalibrationSummary[]> {
  try {
    const rows = await db
      .select({
        agentId: alloyOutcomeLearning.agentId,
        total: sql<number>`count(*)::int`,
        accepted: sql<number>`count(*) filter (where outcome = 'accepted')::int`,
        avgConf: sql<number>`avg(original_confidence)::float`,
      })
      .from(alloyOutcomeLearning)
      .groupBy(alloyOutcomeLearning.agentId);

    return rows.map((r) => {
      const acceptanceRate = r.total > 0 ? r.accepted / r.total : 1.0;
      const calibrationBias = (r.avgConf ?? 0.75) - acceptanceRate;
      return {
        agentId: r.agentId,
        totalDecisions: r.total,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        calibrationBias: Math.round(calibrationBias * 100) / 100,
        recommendedAdjustment: r.total >= 10 ? Math.round(-calibrationBias * 0.5 * 100) / 100 : 0,
      };
    });
  } catch (err) {
    logger.warn({ err }, 'computeAgentCalibrations failed — returning empty calibration list');
    return [];
  }
}

export async function persistEvalReport(
  report: EvalReport,
  triggeredBy: 'scheduled' | 'manual' | 'api' = 'scheduled',
): Promise<string> {
  const runId = `eval_${randomUUID()}`;
  try {
    const agentCalibrations = await computeAgentCalibrations();
    const augmentedByCategory = {
      ...report.byCategory,
      _agentCalibrations: agentCalibrations,
    };
    await db.insert(evalRuns).values({
      runId,
      model: report.model,
      totalTests: report.totalTests,
      passed: report.passed,
      failed: report.failed,
      passRate: report.passRate,
      avgLatencyMs: report.avgLatencyMs,
      byCategory: augmentedByCategory as unknown as Record<string, unknown>,
      results: report.results as unknown as unknown[],
      triggeredBy,
    });
  } catch (err) {
    logger.error({ err }, 'persistEvalReport DB write failed — eval not saved');
  }
  return runId;
}

export async function getLatestEvalReport(): Promise<typeof evalRuns.$inferSelect | null> {
  try {
    const [latest] = await db.select().from(evalRuns).orderBy(desc(evalRuns.createdAt)).limit(1);
    return latest ?? null;
  } catch (err) {
    logger.warn({ err }, 'getLatestEvalReport DB read failed — returning null');
    return null;
  }
}

export async function getEvalHistory(limit = 10): Promise<(typeof evalRuns.$inferSelect)[]> {
  try {
    return await db.select().from(evalRuns).orderBy(desc(evalRuns.createdAt)).limit(limit);
  } catch (err) {
    logger.warn({ err }, 'getEvalHistory DB read failed — returning empty list');
    return [];
  }
}

async function buildDefaultExecutor(): Promise<Parameters<typeof runEvals>[0]> {
  const { openai } = await import('../providers/openai/index.js');
  return async (input: string, _category: string) => {
    const start = Date.now();
    const result = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 512,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI safety and triage system. Respond with a JSON object containing: confidence (0-1), reasoning (string), and any applicable fields like riskLevel, riskScore, escalationRequired, routeTo, actionType, approvalRequired, priority, urgency, action, entities, evidence, summary, category.',
        },
        {
          role: 'user',
          content: input || 'Empty input received. Respond with a safe fallback escalation.',
        },
      ],
    });
    const text = result.choices[0]?.message?.content ?? '{}';
    let output: Record<string, unknown> = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) output = JSON.parse(match[0]);
    } catch {}
    return { output, model: 'gpt-4o-mini', latencyMs: Date.now() - start };
  };
}

let evalScheduleHandle: ReturnType<typeof setInterval> | null = null;

export async function startScheduledEvals(
  executor?: Parameters<typeof runEvals>[0],
  intervalMs = 6 * 60 * 60 * 1000,
): Promise<void> {
  if (evalScheduleHandle) return;

  const exec = executor ?? (await buildDefaultExecutor());

  const runAndPersist = async () => {
    try {
      const report = await runEvals(exec);
      await persistEvalReport(report, 'scheduled');
      logger.info(
        `Scheduled eval complete: ${report.passRate} pass rate (${report.passed}/${report.totalTests})`,
      );
    } catch (err) {
      logger.error({ err }, 'Scheduled eval failed');
    }
  };

  void runAndPersist();
  evalScheduleHandle = setInterval(runAndPersist, intervalMs);
}

export function stopScheduledEvals(): void {
  if (evalScheduleHandle) {
    clearInterval(evalScheduleHandle);
    evalScheduleHandle = null;
  }
}
