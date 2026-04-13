import { pool } from "@szl-holdings/db";
import { gatewayInfer } from "./ai-gateway";
import { logger } from "./logger";

export interface GoldSetExample {
  exampleId: string;
  input: string;
  expectedOutput: string;
  expectedEntities?: string[];
  domain: string;
  tags: string[];
}

export interface PrecisionRecallMetrics {
  precision: number;
  recall: number;
  f1: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  threshold: number;
}

export interface EvalDriftAlert {
  agentId: string;
  metric: string;
  previousValue: number;
  currentValue: number;
  delta: number;
  direction: "degraded" | "improved";
  detectedAt: string;
  severity: "critical" | "warning" | "info";
}

export interface EvalTrend {
  date: string;
  passRate: number;
  avgScore: number;
  totalTests: number;
  f1Score?: number;
  precision?: number;
  recall?: number;
}

export interface AgentScorecardResult {
  agentId: string;
  agentName?: string;
  evalSuiteResults: {
    suiteId: string;
    passRate: number;
    avgScore: number;
  }[];
  redTeamScore: number;
  precisionRecallMetrics?: PrecisionRecallMetrics;
  driftAlerts: EvalDriftAlert[];
  trend: EvalTrend[];
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  lastEvaluatedAt: string;
}

async function ensureExtendedEvalTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_eval_gold_sets (
      example_id TEXT PRIMARY KEY,
      input TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      expected_entities TEXT[] DEFAULT '{}',
      domain TEXT NOT NULL DEFAULT 'general',
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS alloy_eval_run_log (
      id SERIAL PRIMARY KEY,
      agent_id TEXT NOT NULL,
      suite_id TEXT,
      run_type TEXT NOT NULL DEFAULT 'standard',
      pass_rate REAL NOT NULL DEFAULT 0,
      avg_score REAL NOT NULL DEFAULT 0,
      total_tests INT NOT NULL DEFAULT 0,
      precision_score REAL,
      recall_score REAL,
      f1_score REAL,
      red_team_score REAL,
      llm_judge_score REAL,
      fitness_score REAL,
      metadata JSONB DEFAULT '{}',
      evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_eval_run_agent ON alloy_eval_run_log(agent_id);
    CREATE INDEX IF NOT EXISTS idx_eval_run_date ON alloy_eval_run_log(evaluated_at);

    CREATE TABLE IF NOT EXISTS alloy_eval_drift_alerts (
      id SERIAL PRIMARY KEY,
      agent_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      previous_value REAL NOT NULL,
      current_value REAL NOT NULL,
      delta REAL NOT NULL,
      direction TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      acknowledged BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS alloy_agent_fitness_scores (
      agent_id TEXT NOT NULL,
      fitness_score REAL NOT NULL DEFAULT 0,
      pass_rate REAL NOT NULL DEFAULT 0,
      f1_score REAL,
      red_team_score REAL,
      llm_judge_score REAL,
      eval_run_count INT NOT NULL DEFAULT 1,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (agent_id)
    );
    CREATE INDEX IF NOT EXISTS idx_fitness_agent ON alloy_agent_fitness_scores(agent_id);
  `);
}

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try { await ensureExtendedEvalTables(); tablesEnsured = true; } catch {}
}

export function calculatePrecisionRecall(
  predicted: string[],
  actual: string[],
  threshold = 0.5
): PrecisionRecallMetrics {
  const predictedSet = new Set(predicted.map(s => s.toLowerCase().trim()));
  const actualSet = new Set(actual.map(s => s.toLowerCase().trim()));

  let truePositives = 0;
  for (const p of predictedSet) {
    if (actualSet.has(p)) {
      truePositives++;
    } else {
      for (const a of actualSet) {
        const similarity = jaccardSimilarity(p, a);
        if (similarity >= threshold) { truePositives++; break; }
      }
    }
  }

  const falsePositives = predictedSet.size - truePositives;
  const falseNegatives = actualSet.size - truePositives;

  const precision = predictedSet.size > 0 ? truePositives / predictedSet.size : 0;
  const recall = actualSet.size > 0 ? truePositives / actualSet.size : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

  return {
    precision: Math.min(1, Math.max(0, precision)),
    recall: Math.min(1, Math.max(0, recall)),
    f1: Math.min(1, Math.max(0, f1)),
    truePositives,
    falsePositives: Math.max(0, falsePositives),
    falseNegatives: Math.max(0, falseNegatives),
    threshold,
  };
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

export async function runExtractionEvalWithGoldSet(params: {
  agentId: string;
  goldSet: GoldSetExample[];
  extractedResults: Array<{ exampleId: string; extractedEntities: string[]; output: string }>;
}): Promise<{
  overallMetrics: PrecisionRecallMetrics;
  perExampleMetrics: Array<{ exampleId: string; metrics: PrecisionRecallMetrics }>;
  avgF1: number;
  evalId: string;
}> {
  await ensureTables();
  const evalId = `eval_gold_${Date.now()}`;

  const perExampleMetrics: Array<{ exampleId: string; metrics: PrecisionRecallMetrics }> = [];
  const allPredicted: string[] = [];
  const allActual: string[] = [];

  for (const example of params.goldSet) {
    const result = params.extractedResults.find(r => r.exampleId === example.exampleId);
    const predicted = result?.extractedEntities ?? [];
    const actual = example.expectedEntities ?? [];

    allPredicted.push(...predicted);
    allActual.push(...actual);

    const metrics = calculatePrecisionRecall(predicted, actual);
    perExampleMetrics.push({ exampleId: example.exampleId, metrics });
  }

  const overallMetrics = calculatePrecisionRecall(allPredicted, allActual);
  const avgF1 = perExampleMetrics.length > 0
    ? perExampleMetrics.reduce((s, m) => s + m.metrics.f1, 0) / perExampleMetrics.length
    : 0;

  // LLM-judge assertions: run up to 3 examples through the LLM judge for quality scoring.
  const judgeExamples = params.goldSet.slice(0, 3);
  let totalJudgeScore = 0;
  let judgeCount = 0;
  for (const example of judgeExamples) {
    const result = params.extractedResults.find(r => r.exampleId === example.exampleId);
    if (result?.output) {
      const judgment = await runLlmJudgeEval({
        agentId: params.agentId,
        question: example.input,
        predicted: result.output,
        reference: example.expectedOutput,
      }).catch(() => null);
      if (judgment) {
        totalJudgeScore += judgment.score;
        judgeCount++;
      }
    }
  }
  const llmJudgeScore = judgeCount > 0 ? totalJudgeScore / judgeCount : undefined;

  // Use recordEvalRun so fitness score is automatically persisted and evolution engine
  // gets updated — single source of truth for eval→fitness coupling.
  await recordEvalRun({
    agentId: params.agentId,
    suiteId: evalId,
    runType: "gold_set",
    passRate: avgF1,
    avgScore: overallMetrics.f1,
    totalTests: params.goldSet.length,
    precisionScore: overallMetrics.precision,
    recallScore: overallMetrics.recall,
    f1Score: overallMetrics.f1,
    llmJudgeScore,
  });

  return { overallMetrics, perExampleMetrics, avgF1, evalId };
}

export async function detectEvalDrift(params: {
  agentId: string;
  metric: string;
  windowSize?: number;
  driftThreshold?: number;
}): Promise<EvalDriftAlert | null> {
  await ensureTables();
  const windowSize = params.windowSize ?? 10;
  const driftThreshold = params.driftThreshold ?? 0.05;

  const metricColumn = {
    "pass_rate": "pass_rate",
    "f1": "f1_score",
    "precision": "precision_score",
    "recall": "recall_score",
  }[params.metric] ?? "pass_rate";

  try {
    const { rows } = await pool.query(
      `SELECT ${metricColumn} as val FROM alloy_eval_run_log
       WHERE agent_id = $1 AND ${metricColumn} IS NOT NULL
       ORDER BY evaluated_at DESC LIMIT $2`,
      [params.agentId, windowSize]
    );

    if (rows.length < 4) return null;

    const recent = rows.slice(0, Math.floor(rows.length / 2)).map((r: any) => parseFloat(r.val));
    const historical = rows.slice(Math.floor(rows.length / 2)).map((r: any) => parseFloat(r.val));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const historicalAvg = historical.reduce((a, b) => a + b, 0) / historical.length;
    const delta = recentAvg - historicalAvg;

    if (Math.abs(delta) < driftThreshold) return null;

    const direction: EvalDriftAlert["direction"] = delta < 0 ? "degraded" : "improved";
    const severity: EvalDriftAlert["severity"] = Math.abs(delta) > 0.15 ? "critical" : Math.abs(delta) > 0.08 ? "warning" : "info";

    const alert: EvalDriftAlert = {
      agentId: params.agentId,
      metric: params.metric,
      previousValue: historicalAvg,
      currentValue: recentAvg,
      delta,
      direction,
      detectedAt: new Date().toISOString(),
      severity,
    };

    try {
      await pool.query(
        `INSERT INTO alloy_eval_drift_alerts (agent_id, metric, previous_value, current_value, delta, direction, severity)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [params.agentId, params.metric, historicalAvg, recentAvg, delta, direction, severity]
      );
    } catch {}

    return alert;
  } catch {
    return null;
  }
}

export async function getAgentScorecard(agentId: string): Promise<AgentScorecardResult> {
  await ensureTables();

  const [evalRuns, driftAlerts] = await Promise.all([
    pool.query(
      `SELECT * FROM alloy_eval_run_log WHERE agent_id = $1 ORDER BY evaluated_at DESC LIMIT 30`,
      [agentId]
    ).catch(() => ({ rows: [] })),
    pool.query(
      `SELECT * FROM alloy_eval_drift_alerts WHERE agent_id = $1 AND acknowledged = FALSE ORDER BY detected_at DESC LIMIT 10`,
      [agentId]
    ).catch(() => ({ rows: [] })),
  ]);

  const trend: EvalTrend[] = evalRuns.rows.map((r: any) => ({
    date: r.evaluated_at?.toISOString().split("T")[0] ?? "",
    passRate: parseFloat(r.pass_rate) || 0,
    avgScore: parseFloat(r.avg_score) || 0,
    totalTests: parseInt(r.total_tests) || 0,
    f1Score: r.f1_score ? parseFloat(r.f1_score) : undefined,
    precision: r.precision_score ? parseFloat(r.precision_score) : undefined,
    recall: r.recall_score ? parseFloat(r.recall_score) : undefined,
  })).reverse();

  const alerts: EvalDriftAlert[] = driftAlerts.rows.map((r: any) => ({
    agentId: r.agent_id,
    metric: r.metric,
    previousValue: parseFloat(r.previous_value),
    currentValue: parseFloat(r.current_value),
    delta: parseFloat(r.delta),
    direction: r.direction,
    detectedAt: r.detected_at?.toISOString() ?? "",
    severity: r.severity,
  }));

  const latestRun = evalRuns.rows[0];
  const avgPassRate = trend.length > 0 ? trend.reduce((s, t) => s + t.passRate, 0) / trend.length : 0;
  const avgF1 = trend.filter(t => t.f1Score !== undefined).reduce((s, t) => s + (t.f1Score ?? 0), 0) / Math.max(1, trend.filter(t => t.f1Score !== undefined).length);

  const overallScore = (avgPassRate * 0.6 + (avgF1 || avgPassRate) * 0.4);
  const grade: AgentScorecardResult["grade"] =
    overallScore >= 0.9 ? "A" :
    overallScore >= 0.8 ? "B" :
    overallScore >= 0.7 ? "C" :
    overallScore >= 0.6 ? "D" : "F";

  return {
    agentId,
    evalSuiteResults: latestRun ? [{
      suiteId: latestRun.suite_id || "default",
      passRate: parseFloat(latestRun.pass_rate) || 0,
      avgScore: parseFloat(latestRun.avg_score) || 0,
    }] : [],
    redTeamScore: 0,
    precisionRecallMetrics: latestRun?.precision_score ? {
      precision: parseFloat(latestRun.precision_score) || 0,
      recall: parseFloat(latestRun.recall_score) || 0,
      f1: parseFloat(latestRun.f1_score) || 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      threshold: 0.5,
    } : undefined,
    driftAlerts: alerts,
    trend,
    overallScore,
    grade,
    lastEvaluatedAt: latestRun?.evaluated_at?.toISOString() ?? new Date().toISOString(),
  };
}

/** LLM-judge eval: sends predicted vs reference to an LLM for 0–1 quality scoring.
 *  Used in gold-set eval and red-team loops to produce judgement-level assertions. */
export async function runLlmJudgeEval(params: {
  agentId: string;
  question: string;
  predicted: string;
  reference: string;
  criteria?: string;
}): Promise<{ score: number; reasoning: string; passed: boolean }> {
  const criteria = params.criteria ?? "correctness, completeness, factual accuracy, and absence of hallucination";
  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are an LLM judge evaluating AI assistant responses. Score the predicted response against the reference on a 0.0–1.0 scale based on: ${criteria}.
Return ONLY valid JSON: {"score": 0.0-1.0, "reasoning": "string", "passed": true|false}
A score >= 0.7 is considered passing. Be strict and objective.`,
        },
        {
          role: "user",
          content: `Question: ${params.question}\n\nReference Answer: ${params.reference}\n\nPredicted Answer: ${params.predicted}`,
        },
      ],
      maxTokens: 400,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        score: Math.min(1, Math.max(0, Number(parsed.score) || 0)),
        reasoning: String(parsed.reasoning || ""),
        passed: Boolean(parsed.passed),
      };
    }
  } catch (err) {
    logger.warn({ err, agentId: params.agentId }, "LLM judge eval failed");
  }
  return { score: 0, reasoning: "Judge evaluation failed", passed: false };
}

/** Compute composite fitness score: weighted combination of available eval metrics.
 *  This score is the fitness signal consumed by the self-evolution engine. */
function computeFitnessScore(params: {
  passRate: number;
  f1Score?: number;
  redTeamScore?: number;
  llmJudgeScore?: number;
}): number {
  const f1 = params.f1Score ?? params.passRate;
  const redTeam = params.redTeamScore ?? 1.0;
  const judge = params.llmJudgeScore ?? params.passRate;
  return Math.min(1, Math.max(0,
    0.30 * params.passRate +
    0.35 * f1 +
    0.20 * redTeam +
    0.15 * judge
  ));
}

/** Retrieve the current evolution fitness score for a given agent. */
export async function getAgentFitnessScore(agentId: string): Promise<{
  fitnessScore: number;
  passRate: number;
  f1Score: number | null;
  redTeamScore: number | null;
  llmJudgeScore: number | null;
  evalRunCount: number;
  lastUpdated: string;
} | null> {
  await ensureTables();
  try {
    const result = await pool.query(
      `SELECT fitness_score, pass_rate, f1_score, red_team_score, llm_judge_score, eval_run_count, last_updated
       FROM alloy_agent_fitness_scores WHERE agent_id = $1`,
      [agentId]
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      fitnessScore: parseFloat(r.fitness_score) || 0,
      passRate: parseFloat(r.pass_rate) || 0,
      f1Score: r.f1_score != null ? parseFloat(r.f1_score) : null,
      redTeamScore: r.red_team_score != null ? parseFloat(r.red_team_score) : null,
      llmJudgeScore: r.llm_judge_score != null ? parseFloat(r.llm_judge_score) : null,
      evalRunCount: parseInt(r.eval_run_count) || 1,
      lastUpdated: r.last_updated?.toISOString() ?? new Date().toISOString(),
    };
  } catch (err) {
    logger.warn({ err, agentId }, "Failed to get agent fitness score");
    return null;
  }
}

export async function recordEvalRun(params: {
  agentId: string;
  suiteId?: string;
  runType: string;
  passRate: number;
  avgScore: number;
  totalTests: number;
  precisionScore?: number;
  recallScore?: number;
  f1Score?: number;
  redTeamScore?: number;
  llmJudgeScore?: number;
}): Promise<void> {
  await ensureTables();
  try {
    const fitnessScore = computeFitnessScore({
      passRate: params.passRate,
      f1Score: params.f1Score,
      redTeamScore: params.redTeamScore,
      llmJudgeScore: params.llmJudgeScore,
    });

    await pool.query(
      `INSERT INTO alloy_eval_run_log (agent_id, suite_id, run_type, pass_rate, avg_score, total_tests, precision_score, recall_score, f1_score, red_team_score, llm_judge_score, fitness_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [params.agentId, params.suiteId ?? null, params.runType, params.passRate, params.avgScore,
       params.totalTests, params.precisionScore ?? null, params.recallScore ?? null,
       params.f1Score ?? null, params.redTeamScore ?? null, params.llmJudgeScore ?? null, fitnessScore]
    );

    // Persist fitness to evolution scoring table — this is the bridge between eval
    // outcomes and the self-evolution fitness function. The evolution engine reads this
    // table when seeding genome fitness for each agent.
    await pool.query(
      `INSERT INTO alloy_agent_fitness_scores
         (agent_id, fitness_score, pass_rate, f1_score, red_team_score, llm_judge_score, eval_run_count, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, 1, NOW())
       ON CONFLICT (agent_id) DO UPDATE SET
         fitness_score = $2,
         pass_rate = $3,
         f1_score = COALESCE($4, alloy_agent_fitness_scores.f1_score),
         red_team_score = COALESCE($5, alloy_agent_fitness_scores.red_team_score),
         llm_judge_score = COALESCE($6, alloy_agent_fitness_scores.llm_judge_score),
         eval_run_count = alloy_agent_fitness_scores.eval_run_count + 1,
         last_updated = NOW()`,
      [params.agentId, fitnessScore, params.passRate,
       params.f1Score ?? null, params.redTeamScore ?? null, params.llmJudgeScore ?? null]
    );

    logger.info({
      agentId: params.agentId, runType: params.runType,
      passRate: params.passRate, f1Score: params.f1Score, fitnessScore,
    }, "Eval run recorded with fitness update");

    for (const metric of ["pass_rate", "f1", "precision"]) {
      await detectEvalDrift({ agentId: params.agentId, metric }).catch(() => {});
    }
  } catch (err) {
    logger.warn({ err }, "Failed to record eval run");
  }
}

export async function getEvalDashboardData(): Promise<{
  totalEvalRuns: number;
  activeAgents: number;
  avgPlatformPassRate: number;
  criticalDriftAlerts: number;
  agentScores: Array<{ agentId: string; score: number; grade: string; lastEval: string }>;
}> {
  try {
    const [runs, agents, alerts] = await Promise.all([
      pool.query(`SELECT COUNT(*) as cnt, AVG(pass_rate) as avg_pass FROM alloy_eval_run_log WHERE evaluated_at > NOW() - INTERVAL '30 days'`),
      pool.query(`SELECT agent_id, AVG(pass_rate) as score, MAX(evaluated_at) as last_eval FROM alloy_eval_run_log GROUP BY agent_id ORDER BY score DESC LIMIT 20`),
      pool.query(`SELECT COUNT(*) as cnt FROM alloy_eval_drift_alerts WHERE severity = 'critical' AND acknowledged = FALSE`),
    ]);

    const agentScores = agents.rows.map((r: any) => {
      const score = parseFloat(r.score) || 0;
      return {
        agentId: r.agent_id,
        score,
        grade: score >= 0.9 ? "A" : score >= 0.8 ? "B" : score >= 0.7 ? "C" : score >= 0.6 ? "D" : "F",
        lastEval: r.last_eval?.toISOString() ?? "",
      };
    });

    return {
      totalEvalRuns: parseInt(runs.rows[0]?.cnt ?? "0"),
      activeAgents: agents.rows.length,
      avgPlatformPassRate: parseFloat(runs.rows[0]?.avg_pass ?? "0"),
      criticalDriftAlerts: parseInt(alerts.rows[0]?.cnt ?? "0"),
      agentScores,
    };
  } catch {
    return { totalEvalRuns: 0, activeAgents: 0, avgPlatformPassRate: 0, criticalDriftAlerts: 0, agentScores: [] };
  }
}
