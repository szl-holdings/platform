import { pool } from '@szl-holdings/db';
import type { EvalRunReport, EvalSuiteDef } from '@workspace/eval-forge';
import { logger } from './logger';

let dbAvailable: boolean | null = null;

async function checkDbAvailable(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;
  try {
    await pool.query('SELECT 1');
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
  return dbAvailable;
}

export async function upsertEvalForgeSuites(suites: EvalSuiteDef[]): Promise<void> {
  if (!(await checkDbAvailable())) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of suites) {
      await client.query(
        `INSERT INTO eval_forge_suites (
          suite_id, name, description, domain, eval_type, version, tags, case_count, red_team_count, registered_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
        ON CONFLICT (suite_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          domain = EXCLUDED.domain,
          eval_type = EXCLUDED.eval_type,
          version = EXCLUDED.version,
          tags = EXCLUDED.tags,
          case_count = EXCLUDED.case_count,
          red_team_count = EXCLUDED.red_team_count,
          updated_at = NOW()`,
        [
          s.suiteId,
          s.name,
          s.description ?? null,
          s.domain,
          s.evalType,
          s.version ?? 1,
          s.tags ?? [],
          s.cases.length,
          s.cases.filter((c: { isRedTeam?: boolean }) => c.isRedTeam).length,
        ],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.warn({ err }, '[eval-forge-store] Failed to upsert suites');
  } finally {
    client.release();
  }
}

export async function persistEvalForgeRun(report: EvalRunReport): Promise<void> {
  if (!(await checkDbAvailable())) return;
  try {
    await pool.query(
      `INSERT INTO eval_forge_runs (
        run_id, suite_id, suite_name, domain, eval_type, model, triggered_by,
        total_cases, passed, failed, pass_rate, avg_score, avg_latency_ms,
        total_cost_usd, total_tokens_used, metrics, case_results,
        has_regression, regression_severity, regression_notes, improvement_notes,
        baseline_run_id, run_at, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW())
      ON CONFLICT (run_id) DO UPDATE SET
        has_regression = EXCLUDED.has_regression,
        regression_severity = EXCLUDED.regression_severity,
        regression_notes = EXCLUDED.regression_notes,
        improvement_notes = EXCLUDED.improvement_notes,
        baseline_run_id = EXCLUDED.baseline_run_id,
        metrics = EXCLUDED.metrics`,
      [
        report.runId,
        report.suiteId,
        report.suiteName ?? null,
        report.domain ?? null,
        report.evalType ?? null,
        report.model ?? null,
        report.triggeredBy,
        report.totalCases,
        report.passed,
        report.failed,
        report.passRate,
        report.avgScore,
        report.avgLatencyMs,
        report.totalCostUsd,
        report.totalTokensUsed,
        JSON.stringify(report.metrics),
        JSON.stringify(report.caseResults),
        report.hasRegression ?? false,
        report.regressionSeverity ?? null,
        report.regressionNotes ?? [],
        report.improvementNotes ?? [],
        report.baselineRunId ?? null,
        report.runAt,
      ],
    );
  } catch (err) {
    logger.warn({ err, runId: report.runId }, '[eval-forge-store] Failed to persist run');
  }
}

export async function loadRecentRunsFromDb(limit = 100): Promise<EvalRunReport[]> {
  if (!(await checkDbAvailable())) return [];
  try {
    const result = await pool.query<{
      run_id: string;
      suite_id: string;
      suite_name: string | null;
      domain: string | null;
      eval_type: string | null;
      model: string | null;
      triggered_by: string;
      total_cases: number;
      passed: number;
      failed: number;
      pass_rate: number;
      avg_score: number;
      avg_latency_ms: number;
      total_cost_usd: number;
      total_tokens_used: number;
      metrics: unknown;
      case_results: unknown;
      has_regression: boolean | null;
      regression_severity: string | null;
      regression_notes: string[] | null;
      improvement_notes: string[] | null;
      baseline_run_id: string | null;
      run_at: Date;
    }>(`SELECT * FROM eval_forge_runs ORDER BY run_at DESC LIMIT $1`, [limit]);

    return result.rows.map((r) => ({
      runId: r.run_id,
      suiteId: r.suite_id,
      suiteName: r.suite_name ?? undefined,
      domain: r.domain ?? undefined,
      evalType: (r.eval_type as EvalRunReport['evalType']) ?? undefined,
      model: r.model ?? undefined,
      triggeredBy: r.triggered_by,
      totalCases: r.total_cases,
      passed: r.passed,
      failed: r.failed,
      passRate: Number(r.pass_rate),
      avgScore: Number(r.avg_score),
      avgLatencyMs: Number(r.avg_latency_ms),
      totalCostUsd: Number(r.total_cost_usd),
      totalTokensUsed: r.total_tokens_used,
      metrics: (r.metrics ?? {}) as EvalRunReport['metrics'],
      caseResults: (Array.isArray(r.case_results)
        ? r.case_results
        : []) as EvalRunReport['caseResults'],
      hasRegression: r.has_regression ?? undefined,
      regressionSeverity:
        (r.regression_severity as EvalRunReport['regressionSeverity']) ?? undefined,
      regressionNotes: r.regression_notes ?? undefined,
      improvementNotes: r.improvement_notes ?? undefined,
      baselineRunId: r.baseline_run_id ?? undefined,
      runAt: r.run_at.toISOString(),
    }));
  } catch (err) {
    logger.warn({ err }, '[eval-forge-store] Failed to load recent runs from DB');
    return [];
  }
}
