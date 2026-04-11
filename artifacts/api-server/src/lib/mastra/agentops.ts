import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import type { TraceSpan, AgentOpsMetrics } from "./types";

export async function emitTrace(
  runId: string,
  agentId: string,
  span: TraceSpan
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO agentops_traces
       (trace_id, run_id, agent_id, parent_trace_id, span_type, name, status,
        input, output, error, tokens_input, tokens_output, cost_usd, latency_ms,
        model, provider, metadata, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(),
               CASE WHEN $7 IN ('completed','failed') THEN NOW() ELSE NULL END)
       ON CONFLICT (trace_id) DO UPDATE SET
         status = EXCLUDED.status, output = EXCLUDED.output, error = EXCLUDED.error,
         tokens_input = EXCLUDED.tokens_input, tokens_output = EXCLUDED.tokens_output,
         cost_usd = EXCLUDED.cost_usd, latency_ms = EXCLUDED.latency_ms,
         completed_at = CASE WHEN EXCLUDED.status IN ('completed','failed') THEN NOW() ELSE agentops_traces.completed_at END`,
      [
        span.traceId, runId, agentId, span.parentTraceId, span.spanType, span.name,
        span.status, span.input ? JSON.stringify(span.input) : null,
        span.output ? JSON.stringify(span.output) : null, span.error,
        span.tokensInput ?? 0, span.tokensOutput ?? 0, span.costUsd ?? 0,
        span.latencyMs ?? 0, span.model, span.provider,
        span.metadata ? JSON.stringify(span.metadata) : "{}",
      ]
    );
  } catch (err) {
    logger.error({ err, traceId: span.traceId }, "Failed to emit trace");
  }
}

export async function recordEval(
  runId: string,
  agentId: string,
  evalType: string,
  score: number,
  explanation?: string,
  evaluator = "auto"
): Promise<void> {
  const evalId = `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  try {
    await pool.query(
      `INSERT INTO agentops_evals (eval_id, run_id, agent_id, eval_type, score, explanation, evaluator, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [evalId, runId, agentId, evalType, score, explanation, evaluator]
    );
  } catch (err) {
    logger.error({ err, evalId }, "Failed to record eval");
  }
}

export async function autoEvaluate(
  runId: string,
  agentId: string,
  response: string,
  latencyMs: number,
  tokensUsed: number
): Promise<{ quality: number; latency: number; cost: number }> {
  const qualityScore = Math.min(1, Math.max(0,
    (response.length > 50 ? 0.3 : 0.1) +
    (response.length > 200 ? 0.3 : 0.1) +
    (response.includes("```") || response.includes("- ") ? 0.2 : 0.05) +
    (latencyMs < 5000 ? 0.2 : latencyMs < 10000 ? 0.1 : 0.05)
  ));

  const latencyScore = Math.min(1, Math.max(0,
    latencyMs < 1000 ? 1.0 :
    latencyMs < 3000 ? 0.8 :
    latencyMs < 5000 ? 0.6 :
    latencyMs < 10000 ? 0.4 : 0.2
  ));

  const costScore = Math.min(1, Math.max(0,
    tokensUsed < 500 ? 1.0 :
    tokensUsed < 2000 ? 0.8 :
    tokensUsed < 5000 ? 0.6 :
    tokensUsed < 10000 ? 0.4 : 0.2
  ));

  await Promise.all([
    recordEval(runId, agentId, "quality", qualityScore, `Response length: ${response.length}, structured: ${response.includes("- ")}`, "auto"),
    recordEval(runId, agentId, "latency", latencyScore, `${latencyMs}ms`, "auto"),
    recordEval(runId, agentId, "cost", costScore, `${tokensUsed} tokens`, "auto"),
  ]);

  return { quality: qualityScore, latency: latencyScore, cost: costScore };
}

export async function getAgentMetrics(agentId: string, windowHours = 24): Promise<AgentOpsMetrics> {
  try {
    const [runsResult, evalsResult, sloResult, p95Result] = await Promise.all([
      pool.query(
        `SELECT count(*) as total, avg(latency_ms) as avg_latency,
                count(*) FILTER (WHERE status = 'completed') as successful,
                avg(tokens_input + tokens_output) as avg_tokens,
                avg(cost_usd) as avg_cost
         FROM agentops_traces
         WHERE agent_id = $1 AND span_type = 'agent_run'
           AND started_at > NOW() - INTERVAL '1 hour' * $2`,
        [agentId, windowHours]
      ),
      pool.query(
        `SELECT eval_type, avg(score) as avg_score
         FROM agentops_evals
         WHERE agent_id = $1 AND created_at > NOW() - INTERVAL '1 hour' * $2
         GROUP BY eval_type`,
        [agentId, windowHours]
      ),
      pool.query(
        "SELECT status FROM agentops_slos WHERE agent_id = $1",
        [agentId]
      ),
      pool.query(
        `SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95
         FROM agentops_traces
         WHERE agent_id = $1 AND span_type = 'agent_run'
           AND started_at > NOW() - INTERVAL '1 hour' * $2`,
        [agentId, windowHours]
      ),
    ]);

    const runs = runsResult.rows[0];
    const qualityEval = evalsResult.rows.find((e: any) => e.eval_type === "quality");
    const sloStatuses = sloResult.rows.map((r: any) => r.status);
    const worstSlo = sloStatuses.includes("breached") ? "breached" as const :
                     sloStatuses.includes("degraded") ? "degraded" as const : "healthy" as const;

    return {
      agentId,
      totalRuns: parseInt(runs.total),
      avgLatencyMs: Math.round(parseFloat(runs.avg_latency || "0")),
      avgTokensUsed: Math.round(parseFloat(runs.avg_tokens || "0")),
      avgCostUsd: parseFloat(runs.avg_cost || "0"),
      successRate: parseInt(runs.total) > 0 ? parseInt(runs.successful) / parseInt(runs.total) : 0,
      avgQualityScore: parseFloat(qualityEval?.avg_score || "0"),
      p95LatencyMs: Math.round(parseFloat(p95Result.rows[0]?.p95 || "0")),
      runsLast24h: parseInt(runs.total),
      sloStatus: worstSlo,
    };
  } catch (err) {
    logger.error({ err, agentId }, "Failed to get agent metrics");
    return {
      agentId, totalRuns: 0, avgLatencyMs: 0, avgTokensUsed: 0,
      avgCostUsd: 0, successRate: 0, avgQualityScore: 0,
      p95LatencyMs: 0, runsLast24h: 0, sloStatus: "healthy",
    };
  }
}

export async function getAllAgentMetrics(windowHours = 24): Promise<AgentOpsMetrics[]> {
  try {
    const agents = await pool.query("SELECT agent_id FROM ai_agent_configs WHERE enabled = TRUE");
    return Promise.all(agents.rows.map((a: any) => getAgentMetrics(a.agent_id, windowHours)));
  } catch {
    return [];
  }
}

export async function getTraces(
  filters: { runId?: string; agentId?: string; spanType?: string; status?: string; limit?: number }
): Promise<any[]> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (filters.runId) { conditions.push(`run_id = $${idx}`); params.push(filters.runId); idx++; }
  if (filters.agentId) { conditions.push(`agent_id = $${idx}`); params.push(filters.agentId); idx++; }
  if (filters.spanType) { conditions.push(`span_type = $${idx}`); params.push(filters.spanType); idx++; }
  if (filters.status) { conditions.push(`status = $${idx}`); params.push(filters.status); idx++; }

  params.push(filters.limit ?? 50);

  const result = await pool.query(
    `SELECT * FROM agentops_traces WHERE ${conditions.join(" AND ")}
     ORDER BY started_at DESC LIMIT $${idx}`,
    params
  );
  return result.rows;
}

export async function initDefaultSlos(agentId: string): Promise<void> {
  const slos = [
    { metric: "p95_latency_ms", target: 10000 },
    { metric: "success_rate", target: 0.95 },
    { metric: "avg_quality_score", target: 0.7 },
    { metric: "cost_per_run_usd", target: 0.05 },
  ];

  for (const slo of slos) {
    const sloId = `slo_${agentId}_${slo.metric}`;
    await pool.query(
      `INSERT INTO agentops_slos (slo_id, agent_id, metric, target_value, window_minutes, status, created_at)
       VALUES ($1, $2, $3, $4, 60, 'healthy', NOW())
       ON CONFLICT (slo_id) DO NOTHING`,
      [sloId, agentId, slo.metric, slo.target]
    ).catch(() => {});
  }
}
