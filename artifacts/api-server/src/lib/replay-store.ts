import { pool } from '@szl-holdings/db';
import { logger } from './logger';

let dbAvailable = false;

async function checkDbAvailable(): Promise<boolean> {
  if (dbAvailable) return true;
  try {
    await pool.query('SELECT 1');
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
  return dbAvailable;
}

export interface ScenarioRow {
  scenarioId: string;
  name: string;
  domain: string;
  description: string;
  tags: string[];
  snapshotCount: number;
  lastReplayed: string | null;
  lastOutcome: string | null;
  groundTruthMatchRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotRow {
  snapshotId: string;
  scenarioId: string;
  label: string;
  domain: string;
  snapshotType: string;
  historicalContext: Record<string, unknown>;
  agentInputs: Record<string, unknown>[];
  groundTruth: Record<string, unknown> | null;
  sanitized: boolean;
  version: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RunRow {
  runId: string;
  scenarioId: string;
  scenarioName: string;
  startedAt: string;
  completedAt: string;
  totalSnapshots: number;
  successful: number;
  failed: number;
  avgLatencyMs: number;
  groundTruthMatchRate: number;
  totalCostUsd: number;
  createdAt: string;
}

export interface EvalBaselineRow {
  suiteId: string;
  model: string;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  version: string;
  recordedAt: string;
}

function mapScenario(r: Record<string, unknown>): ScenarioRow {
  return {
    scenarioId: r.scenario_id as string,
    name: r.name as string,
    domain: r.domain as string,
    description: r.description as string,
    tags: (r.tags as string[]) ?? [],
    snapshotCount: r.snapshot_count as number,
    lastReplayed: r.last_replayed ? (r.last_replayed as Date).toISOString() : null,
    lastOutcome: (r.last_outcome as string | null) ?? null,
    groundTruthMatchRate:
      r.ground_truth_match_rate != null ? Number(r.ground_truth_match_rate) : null,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function mapSnapshot(r: Record<string, unknown>): SnapshotRow {
  return {
    snapshotId: r.snapshot_id as string,
    scenarioId: r.scenario_id as string,
    label: r.label as string,
    domain: r.domain as string,
    snapshotType: r.snapshot_type as string,
    historicalContext: (r.historical_context as Record<string, unknown>) ?? {},
    agentInputs: (r.agent_inputs as Record<string, unknown>[]) ?? [],
    groundTruth: (r.ground_truth as Record<string, unknown> | null) ?? null,
    sanitized: r.sanitized as boolean,
    version: r.version as string,
    tags: (r.tags as string[]) ?? [],
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapRun(r: Record<string, unknown>): RunRow {
  return {
    runId: r.run_id as string,
    scenarioId: r.scenario_id as string,
    scenarioName: r.scenario_name as string,
    startedAt: (r.started_at as Date).toISOString(),
    completedAt: (r.completed_at as Date).toISOString(),
    totalSnapshots: r.total_snapshots as number,
    successful: r.successful as number,
    failed: r.failed as number,
    avgLatencyMs: Number(r.avg_latency_ms),
    groundTruthMatchRate: Number(r.ground_truth_match_rate),
    totalCostUsd: Number(r.total_cost_usd),
    createdAt: (r.created_at as Date).toISOString(),
  };
}

export async function listScenarios(opts?: { domain?: string }): Promise<ScenarioRow[]> {
  if (!(await checkDbAvailable())) return [];
  try {
    const params: unknown[] = [];
    let sql = 'SELECT * FROM replay_scenarios';
    if (opts?.domain) {
      sql += ' WHERE domain = $1';
      params.push(opts.domain);
    }
    sql += ' ORDER BY updated_at DESC';
    const result = await pool.query(sql, params);
    return result.rows.map(mapScenario);
  } catch (err) {
    logger.warn({ err }, '[replay-store] Failed to list scenarios');
    return [];
  }
}

export async function getScenario(scenarioId: string): Promise<ScenarioRow | null> {
  if (!(await checkDbAvailable())) return null;
  try {
    const result = await pool.query('SELECT * FROM replay_scenarios WHERE scenario_id = $1', [
      scenarioId,
    ]);
    if (result.rows.length === 0) return null;
    return mapScenario(result.rows[0] as Record<string, unknown>);
  } catch (err) {
    logger.warn({ err, scenarioId }, '[replay-store] Failed to get scenario');
    return null;
  }
}

export async function upsertScenario(scenario: {
  scenarioId: string;
  name: string;
  domain: string;
  description: string;
  tags: string[];
  snapshotCount: number;
}): Promise<ScenarioRow | null> {
  if (!(await checkDbAvailable())) return null;
  try {
    const result = await pool.query(
      `INSERT INTO replay_scenarios (scenario_id, name, domain, description, tags, snapshot_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (scenario_id) DO UPDATE SET
         name = EXCLUDED.name,
         domain = EXCLUDED.domain,
         description = EXCLUDED.description,
         tags = EXCLUDED.tags,
         snapshot_count = EXCLUDED.snapshot_count,
         updated_at = NOW()
       RETURNING *`,
      [
        scenario.scenarioId,
        scenario.name,
        scenario.domain,
        scenario.description,
        scenario.tags,
        scenario.snapshotCount,
      ],
    );
    return mapScenario(result.rows[0] as Record<string, unknown>);
  } catch (err) {
    logger.warn(
      { err, scenarioId: scenario.scenarioId },
      '[replay-store] Failed to upsert scenario',
    );
    return null;
  }
}

export async function seedScenariosIfEmpty(
  scenarios: Array<{
    scenarioId: string;
    name: string;
    domain: string;
    description: string;
    tags: string[];
    snapshotCount: number;
    lastReplayed?: string;
    lastOutcome?: string;
    groundTruthMatchRate?: number;
  }>,
): Promise<boolean> {
  if (!(await checkDbAvailable())) return false;
  try {
    const existing = await pool.query('SELECT COUNT(*) FROM replay_scenarios');
    const count = parseInt((existing.rows[0] as { count: string }).count, 10);
    if (count > 0) return false;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const s of scenarios) {
        await client.query(
          `INSERT INTO replay_scenarios
            (scenario_id, name, domain, description, tags, snapshot_count, last_replayed, last_outcome, ground_truth_match_rate, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
           ON CONFLICT (scenario_id) DO NOTHING`,
          [
            s.scenarioId,
            s.name,
            s.domain,
            s.description,
            s.tags,
            s.snapshotCount,
            s.lastReplayed ?? null,
            s.lastOutcome ?? null,
            s.groundTruthMatchRate ?? null,
          ],
        );
      }
      await client.query('COMMIT');
      logger.info({ count: scenarios.length }, '[replay-store] Seeded replay scenarios');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn({ err }, '[replay-store] Failed to seed scenarios');
    return false;
  }
}

export async function listSnapshots(scenarioId?: string): Promise<SnapshotRow[]> {
  if (!(await checkDbAvailable())) return [];
  try {
    const params: unknown[] = [];
    let sql = 'SELECT * FROM replay_snapshots';
    if (scenarioId) {
      sql += ' WHERE scenario_id = $1';
      params.push(scenarioId);
    }
    sql += ' ORDER BY created_at ASC';
    const result = await pool.query(sql, params);
    return result.rows.map(mapSnapshot);
  } catch (err) {
    logger.warn({ err }, '[replay-store] Failed to list snapshots');
    return [];
  }
}

export async function persistSnapshot(snapshot: {
  snapshotId: string;
  scenarioId: string;
  label: string;
  domain: string;
  snapshotType: string;
  historicalContext: Record<string, unknown>;
  agentInputs: Record<string, unknown>[];
  groundTruth?: Record<string, unknown>;
  sanitized: boolean;
  version: string;
  tags: string[];
  metadata: Record<string, unknown>;
}): Promise<void> {
  if (!(await checkDbAvailable())) throw new Error('Database unavailable');
  await pool.query(
    `INSERT INTO replay_snapshots
      (snapshot_id, scenario_id, label, domain, snapshot_type, historical_context, agent_inputs, ground_truth, sanitized, version, tags, metadata, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     ON CONFLICT (snapshot_id) DO NOTHING`,
    [
      snapshot.snapshotId,
      snapshot.scenarioId,
      snapshot.label,
      snapshot.domain,
      snapshot.snapshotType,
      JSON.stringify(snapshot.historicalContext),
      JSON.stringify(snapshot.agentInputs),
      snapshot.groundTruth ? JSON.stringify(snapshot.groundTruth) : null,
      snapshot.sanitized,
      snapshot.version,
      snapshot.tags,
      JSON.stringify(snapshot.metadata),
    ],
  );
}

export async function listRuns(opts?: { scenarioId?: string; limit?: number }): Promise<RunRow[]> {
  if (!(await checkDbAvailable())) return [];
  try {
    const params: unknown[] = [opts?.limit ?? 100];
    let sql = 'SELECT * FROM replay_runs';
    if (opts?.scenarioId) {
      sql += ' WHERE scenario_id = $2';
      params.push(opts.scenarioId);
    }
    sql += ' ORDER BY started_at DESC LIMIT $1';
    const result = await pool.query(sql, params);
    return result.rows.map(mapRun);
  } catch (err) {
    logger.warn({ err }, '[replay-store] Failed to list runs');
    return [];
  }
}

export async function persistRun(run: {
  runId: string;
  scenarioId: string;
  scenarioName: string;
  startedAt: string;
  completedAt: string;
  totalSnapshots: number;
  successful: number;
  failed: number;
  avgLatencyMs: number;
  groundTruthMatchRate: number;
  totalCostUsd: number;
}): Promise<void> {
  if (!(await checkDbAvailable())) throw new Error('Database unavailable');
  const insertResult = await pool.query(
    `INSERT INTO replay_runs
      (run_id, scenario_id, scenario_name, started_at, completed_at, total_snapshots, successful, failed, avg_latency_ms, ground_truth_match_rate, total_cost_usd, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
     ON CONFLICT (run_id) DO NOTHING`,
    [
      run.runId,
      run.scenarioId,
      run.scenarioName,
      run.startedAt,
      run.completedAt,
      run.totalSnapshots,
      run.successful,
      run.failed,
      run.avgLatencyMs,
      run.groundTruthMatchRate,
      run.totalCostUsd,
    ],
  );

  if (insertResult.rowCount && insertResult.rowCount > 0) {
    await pool.query(
      `UPDATE replay_scenarios
       SET last_replayed = $1, last_outcome = $2, ground_truth_match_rate = $3, updated_at = NOW()
       WHERE scenario_id = $4
         AND (last_replayed IS NULL OR last_replayed < $1)`,
      [
        run.startedAt,
        run.successful === run.totalSnapshots
          ? 'pass'
          : run.failed === run.totalSnapshots
            ? 'fail'
            : 'partial',
        run.groundTruthMatchRate,
        run.scenarioId,
      ],
    );
  }
}

export async function persistEvalBaseline(baseline: {
  suiteId: string;
  model: string;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  version: string;
  recordedAt: string;
}): Promise<void> {
  if (!(await checkDbAvailable())) return;
  try {
    await pool.query(
      `INSERT INTO eval_baselines (suite_id, model, pass_rate, avg_score, avg_latency_ms, total_cost_usd, version, recorded_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [
        baseline.suiteId,
        baseline.model,
        baseline.passRate,
        baseline.avgScore,
        baseline.avgLatencyMs,
        baseline.totalCostUsd,
        baseline.version,
        baseline.recordedAt,
      ],
    );
  } catch (err) {
    logger.warn(
      { err, suiteId: baseline.suiteId },
      '[replay-store] Failed to persist eval baseline',
    );
  }
}

export async function loadEvalBaselines(): Promise<EvalBaselineRow[]> {
  if (!(await checkDbAvailable())) return [];
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (suite_id, model) * FROM eval_baselines ORDER BY suite_id, model, recorded_at DESC`,
    );
    return result.rows.map((r: Record<string, unknown>) => ({
      suiteId: r.suite_id as string,
      model: r.model as string,
      passRate: Number(r.pass_rate),
      avgScore: Number(r.avg_score),
      avgLatencyMs: Number(r.avg_latency_ms),
      totalCostUsd: Number(r.total_cost_usd),
      version: r.version as string,
      recordedAt: (r.recorded_at as Date).toISOString(),
    }));
  } catch (err) {
    logger.warn({ err }, '[replay-store] Failed to load eval baselines');
    return [];
  }
}
