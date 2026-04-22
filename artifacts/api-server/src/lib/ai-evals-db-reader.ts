/**
 * AI Evals DB Reader
 *
 * Provides database-backed read functions for AI traces and review queue items.
 * These shadow the in-memory functions from @szl-holdings/ai-engine and are used
 * by the AI Ops Dashboard routes to ensure all persisted history is queryable —
 * not just the subset held in the in-memory ring buffer.
 */

import type {
  AITrace,
  ReviewPriority,
  ReviewQueueItem,
  ReviewQueueStats,
  ReviewVerdict,
  TraceAggregate,
  TraceDomain,
  TraceStatus,
} from '@szl-holdings/ai-engine';
import { logger } from './logger';

let dbPool: import('pg').Pool | null = null;

export function setDbPool(pool: import('pg').Pool): void {
  dbPool = pool;
}

export function isDbAvailable(): boolean {
  return dbPool !== null;
}

// ─── Trace reads ──────────────────────────────────────────────────────────────

function rowToTrace(row: Record<string, unknown>): AITrace {
  return {
    traceId: String(row.trace_id),
    correlationId: row.correlation_id != null ? String(row.correlation_id) : undefined,
    orgId: row.org_id != null ? Number(row.org_id) : null,
    agentId: row.agent_id != null ? String(row.agent_id) : undefined,
    model: String(row.model),
    modelProvider: String(row.model_provider),
    modelVersion: row.model_version != null ? String(row.model_version) : undefined,
    routeClass: row.route_class != null ? String(row.route_class) : undefined,
    domain: String(row.domain) as AITrace['domain'],
    recommendationType: String(row.recommendation_type) as AITrace['recommendationType'],
    promptHash: String(row.prompt_hash),
    promptTokens: Number(row.prompt_tokens ?? 0),
    completionTokens: Number(row.completion_tokens ?? 0),
    latencyMs: Number(row.latency_ms ?? 0),
    costEstimateUsd: Number(row.cost_estimate_usd ?? 0),
    confidence: Number(row.confidence ?? 1),
    riskLevel:
      row.risk_level != null ? (String(row.risk_level) as AITrace['riskLevel']) : undefined,
    requiresReview: Boolean(row.requires_review),
    reviewReason: row.review_reason != null ? String(row.review_reason) : undefined,
    proofChainId: row.proof_chain_id != null ? Number(row.proof_chain_id) : undefined,
    outcomeGraphId: row.outcome_graph_id != null ? Number(row.outcome_graph_id) : undefined,
    inputSummary: row.input_summary != null ? String(row.input_summary) : undefined,
    outputSummary: row.output_summary != null ? String(row.output_summary) : undefined,
    toolsUsed: Array.isArray(row.tools_used) ? (row.tools_used as string[]) : undefined,
    evalScore: row.eval_score != null ? Number(row.eval_score) : undefined,
    evalPassed: row.eval_passed != null ? Boolean(row.eval_passed) : undefined,
    status: String(row.status) as AITrace['status'],
    metadata: row.metadata != null ? (row.metadata as Record<string, unknown>) : undefined,
    capturedAt:
      row.captured_at instanceof Date
        ? (row.captured_at as Date).toISOString()
        : String(row.captured_at),
  };
}

function rowToReviewItem(row: Record<string, unknown>): ReviewQueueItem {
  return {
    reviewId: String(row.review_id),
    traceId: String(row.trace_id),
    orgId: row.org_id != null ? Number(row.org_id) : null,
    domain: String(row.domain),
    recommendationType: String(row.recommendation_type),
    model: String(row.model),
    confidence: Number(row.confidence ?? 1),
    riskLevel: row.risk_level != null ? String(row.risk_level) : undefined,
    reviewReason: String(row.review_reason ?? ''),
    priority: String(row.priority) as ReviewQueueItem['priority'],
    inputSummary: row.input_summary != null ? String(row.input_summary) : undefined,
    outputSummary: row.output_summary != null ? String(row.output_summary) : undefined,
    costEstimateUsd: Number(row.cost_estimate_usd ?? 0),
    latencyMs: Number(row.latency_ms ?? 0),
    evalScore: row.eval_score != null ? Number(row.eval_score) : undefined,
    evalPassed: row.eval_passed != null ? Boolean(row.eval_passed) : undefined,
    verdict:
      row.verdict != null ? (String(row.verdict) as ReviewQueueItem['verdict']) : undefined,
    reviewedBy: row.reviewed_by != null ? Number(row.reviewed_by) : undefined,
    reviewNotes: row.review_notes != null ? String(row.review_notes) : undefined,
    escalatedTo: row.escalated_to != null ? String(row.escalated_to) : undefined,
    status: String(row.status) as ReviewQueueItem['status'],
    enqueuedAt:
      row.enqueued_at instanceof Date
        ? (row.enqueued_at as Date).toISOString()
        : String(row.enqueued_at),
    reviewedAt:
      row.reviewed_at != null
        ? row.reviewed_at instanceof Date
          ? (row.reviewed_at as Date).toISOString()
          : String(row.reviewed_at)
        : undefined,
    metadata: row.metadata != null ? (row.metadata as Record<string, unknown>) : undefined,
  };
}

export async function dbListTraces(options: {
  orgId?: number;
  domain?: TraceDomain;
  requiresReview?: boolean;
  status?: TraceStatus;
  riskLevel?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ traces: AITrace[]; total: number }> {
  if (!dbPool) {
    logger.warn('[ai-evals-reader] dbListTraces called before DB pool available');
    return { traces: [], total: 0 };
  }

  const params: unknown[] = [];
  const conditions: string[] = [];
  let paramIdx = 1;

  if (options.orgId != null) {
    conditions.push(`org_id = $${paramIdx++}`);
    params.push(options.orgId);
  }
  if (options.domain) {
    conditions.push(`domain = $${paramIdx++}`);
    params.push(options.domain);
  }
  if (options.requiresReview != null) {
    conditions.push(`requires_review = $${paramIdx++}`);
    params.push(options.requiresReview);
  }
  if (options.status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(options.status);
  }
  if (options.riskLevel) {
    conditions.push(`risk_level = $${paramIdx++}`);
    params.push(options.riskLevel);
  }
  if (options.since) {
    conditions.push(`captured_at >= $${paramIdx++}`);
    params.push(options.since);
  }
  if (options.until) {
    conditions.push(`captured_at <= $${paramIdx++}`);
    params.push(options.until);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(options.limit ?? 50, 200);
  const offset = options.offset ?? 0;

  const client = await dbPool.connect();
  try {
    const [dataResult, countResult] = await Promise.all([
      client.query(
        `SELECT * FROM ai_traces ${where} ORDER BY captured_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset],
      ),
      client.query(`SELECT COUNT(*)::int AS total FROM ai_traces ${where}`, params),
    ]);

    return {
      traces: (dataResult.rows as Record<string, unknown>[]).map(rowToTrace),
      total: (countResult.rows[0] as { total: number })?.total ?? 0,
    };
  } catch (err) {
    logger.error({ err }, '[ai-evals-reader] dbListTraces query failed');
    return { traces: [], total: 0 };
  } finally {
    client.release();
  }
}

export async function dbGetTrace(traceId: string): Promise<AITrace | null> {
  if (!dbPool) return null;
  const client = await dbPool.connect();
  try {
    const result = await client.query(`SELECT * FROM ai_traces WHERE trace_id = $1 LIMIT 1`, [
      traceId,
    ]);
    if (result.rows.length === 0) return null;
    return rowToTrace(result.rows[0] as Record<string, unknown>);
  } catch (err) {
    logger.error({ err, traceId }, '[ai-evals-reader] dbGetTrace query failed');
    return null;
  } finally {
    client.release();
  }
}

export async function dbAggregateTraces(options: {
  orgId?: number;
  since?: Date;
}): Promise<TraceAggregate[]> {
  if (!dbPool) return [];

  const params: unknown[] = [];
  const conditions: string[] = [];
  let paramIdx = 1;

  if (options.orgId != null) {
    conditions.push(`org_id = $${paramIdx++}`);
    params.push(options.orgId);
  }
  if (options.since) {
    conditions.push(`captured_at >= $${paramIdx++}`);
    params.push(options.since);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const client = await dbPool.connect();
  try {
    // Main aggregates per domain
    const mainResult = await client.query(
      `SELECT
        domain,
        COUNT(*)::int AS total_traces,
        SUM(CASE WHEN requires_review THEN 1 ELSE 0 END)::int AS review_required,
        AVG(confidence::numeric)::float AS avg_confidence,
        AVG(latency_ms)::float AS avg_latency_ms,
        SUM(cost_estimate_usd::numeric)::float AS total_cost_usd,
        COUNT(CASE WHEN eval_passed IS NOT NULL THEN 1 END)::int AS evaluated_count,
        COUNT(CASE WHEN eval_passed = true THEN 1 END)::int AS passed_count
       FROM ai_traces ${where}
       GROUP BY domain
       ORDER BY total_traces DESC`,
      params,
    );

    // Risk level breakdown per domain
    const riskResult = await client
      .query(
        `SELECT domain, risk_level, COUNT(*)::int AS cnt
       FROM ai_traces
       ${where ? `${where} AND` : 'WHERE'} risk_level IS NOT NULL
       GROUP BY domain, risk_level`,
        where ? params : [],
      )
      .catch(() => ({ rows: [] }));

    // Build byRiskLevel map
    const riskMap = new Map<string, Record<string, number>>();
    for (const row of riskResult.rows as { domain: string; risk_level: string; cnt: number }[]) {
      if (!riskMap.has(row.domain)) riskMap.set(row.domain, {});
      riskMap.get(row.domain)![row.risk_level] = row.cnt;
    }

    return (mainResult.rows as Record<string, unknown>[]).map((row) => {
      const total = Number(row.total_traces ?? 0);
      const evaluated = Number(row.evaluated_count ?? 0);
      const passed = Number(row.passed_count ?? 0);
      const domain = String(row.domain);
      return {
        domain,
        totalTraces: total,
        reviewRequired: Number(row.review_required ?? 0),
        avgConfidence: Number(row.avg_confidence ?? 0),
        avgLatencyMs: Number(row.avg_latency_ms ?? 0),
        totalCostUsd: Number(row.total_cost_usd ?? 0),
        evalPassRate: evaluated > 0 ? passed / evaluated : null,
        byRiskLevel: riskMap.get(domain) ?? {},
      };
    });
  } catch (err) {
    logger.error({ err }, '[ai-evals-reader] dbAggregateTraces query failed');
    return [];
  } finally {
    client.release();
  }
}

// ─── Review queue reads ────────────────────────────────────────────────────

export async function dbListReviewQueue(options: {
  orgId?: number;
  domain?: string;
  status?: ReviewQueueItem['status'];
  priority?: ReviewPriority;
  verdict?: ReviewVerdict;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ items: ReviewQueueItem[]; total: number }> {
  if (!dbPool) {
    logger.warn('[ai-evals-reader] dbListReviewQueue called before DB pool available');
    return { items: [], total: 0 };
  }

  const params: unknown[] = [];
  const conditions: string[] = [];
  let paramIdx = 1;

  if (options.orgId != null) {
    conditions.push(`org_id = $${paramIdx++}`);
    params.push(options.orgId);
  }
  if (options.domain) {
    conditions.push(`domain = $${paramIdx++}`);
    params.push(options.domain);
  }
  if (options.status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(options.status);
  }
  if (options.priority) {
    conditions.push(`priority = $${paramIdx++}`);
    params.push(options.priority);
  }
  if (options.verdict) {
    conditions.push(`verdict = $${paramIdx++}`);
    params.push(options.verdict);
  }
  if (options.since) {
    conditions.push(`enqueued_at >= $${paramIdx++}`);
    params.push(options.since);
  }
  if (options.until) {
    conditions.push(`enqueued_at <= $${paramIdx++}`);
    params.push(options.until);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(options.limit ?? 50, 200);
  const offset = options.offset ?? 0;

  const client = await dbPool.connect();
  try {
    const [dataResult, countResult] = await Promise.all([
      client.query(
        `SELECT * FROM ai_review_queue ${where} ORDER BY enqueued_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset],
      ),
      client.query(`SELECT COUNT(*)::int AS total FROM ai_review_queue ${where}`, params),
    ]);

    return {
      items: (dataResult.rows as Record<string, unknown>[]).map(rowToReviewItem),
      total: (countResult.rows[0] as { total: number })?.total ?? 0,
    };
  } catch (err) {
    logger.error({ err }, '[ai-evals-reader] dbListReviewQueue query failed');
    return { items: [], total: 0 };
  } finally {
    client.release();
  }
}

export async function dbGetReviewItem(reviewId: string): Promise<ReviewQueueItem | null> {
  if (!dbPool) return null;
  const client = await dbPool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM ai_review_queue WHERE review_id = $1 LIMIT 1`,
      [reviewId],
    );
    if (result.rows.length === 0) return null;
    return rowToReviewItem(result.rows[0] as Record<string, unknown>);
  } catch (err) {
    logger.error({ err, reviewId }, '[ai-evals-reader] dbGetReviewItem query failed');
    return null;
  } finally {
    client.release();
  }
}

export async function dbGetReviewQueueStats(orgId?: number): Promise<ReviewQueueStats | null> {
  if (!dbPool) return null;

  const params: unknown[] = [];
  const orgFilter = orgId != null ? `WHERE org_id = $1` : '';
  if (orgId != null) params.push(orgId);

  const client = await dbPool.connect();
  try {
    const result = await client.query(
      `SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int AS pending,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END)::int AS in_review,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END)::int AS escalated,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END)::int AS p_low,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END)::int AS p_medium,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END)::int AS p_high,
        SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END)::int AS p_critical,
        AVG(confidence::numeric)::float AS avg_confidence
       FROM ai_review_queue ${orgFilter}`,
      params,
    );

    const verdictResult = await client.query(
      `SELECT verdict, COUNT(*)::int AS cnt
       FROM ai_review_queue
       ${orgFilter} ${orgFilter ? 'AND' : 'WHERE'} verdict IS NOT NULL
       GROUP BY verdict`,
      params,
    );

    const domainResult = await client.query(
      `SELECT domain, COUNT(*)::int AS cnt
       FROM ai_review_queue ${orgFilter}
       GROUP BY domain`,
      params,
    );

    const row = result.rows[0] as Record<string, unknown>;
    const byPriority: Record<ReviewPriority, number> = {
      low: Number(row.p_low ?? 0),
      medium: Number(row.p_medium ?? 0),
      high: Number(row.p_high ?? 0),
      critical: Number(row.p_critical ?? 0),
    };

    const byDomain: Record<string, number> = {};
    for (const r of domainResult.rows as { domain: string; cnt: number }[]) {
      byDomain[r.domain] = r.cnt;
    }

    const verdictBreakdown: Partial<Record<ReviewVerdict, number>> = {};
    for (const r of verdictResult.rows as { verdict: string; cnt: number }[]) {
      verdictBreakdown[r.verdict as ReviewVerdict] = r.cnt;
    }

    return {
      total: Number(row.total ?? 0),
      pending: Number(row.pending ?? 0),
      inReview: Number(row.in_review ?? 0),
      resolved: Number(row.resolved ?? 0),
      escalated: Number(row.escalated ?? 0),
      byPriority,
      byDomain,
      avgConfidence: Number(row.avg_confidence ?? 0),
      verdictBreakdown,
    };
  } catch (err) {
    logger.error({ err }, '[ai-evals-reader] dbGetReviewQueueStats query failed');
    return null;
  } finally {
    client.release();
  }
}

// ─── Direct DB writers (decoupled from in-memory cache) ─────────────────────

export async function dbUpdateTraceStatus(
  traceId: string,
  status: TraceStatus,
  evalScore?: number,
  evalPassed?: boolean,
): Promise<AITrace | null> {
  if (!dbPool) return null;
  const client = await dbPool.connect();
  try {
    const sets: string[] = ['status = $2'];
    const params: unknown[] = [traceId, status];
    let idx = 3;
    if (evalScore !== undefined) {
      sets.push(`eval_score = $${idx++}`);
      params.push(String(evalScore));
    }
    if (evalPassed !== undefined) {
      sets.push(`eval_passed = $${idx++}`);
      params.push(evalPassed);
    }
    const result = await client.query(
      `UPDATE ai_traces SET ${sets.join(', ')} WHERE trace_id = $1 RETURNING *`,
      params,
    );
    if (result.rowCount === 0) return null;
    return rowToTrace(result.rows[0] as Record<string, unknown>);
  } catch (err) {
    logger.error({ err, traceId }, '[ai-evals-reader] dbUpdateTraceStatus failed');
    return null;
  } finally {
    client.release();
  }
}

export async function dbMarkInReview(reviewId: string): Promise<ReviewQueueItem | null> {
  if (!dbPool) return null;
  const client = await dbPool.connect();
  try {
    const result = await client.query(
      `UPDATE ai_review_queue
         SET status = 'in_review'
       WHERE review_id = $1 AND status = 'pending'
       RETURNING *`,
      [reviewId],
    );
    if (result.rowCount === 0) return null;
    return rowToReviewItem(result.rows[0] as Record<string, unknown>);
  } catch (err) {
    logger.error({ err, reviewId }, '[ai-evals-reader] dbMarkInReview failed');
    return null;
  } finally {
    client.release();
  }
}

export async function dbRecordReviewDecision(opts: {
  reviewId: string;
  verdict: ReviewVerdict;
  reviewedBy: number;
  reviewNotes?: string;
  escalatedTo?: string;
}): Promise<ReviewQueueItem | null> {
  if (!dbPool) return null;
  const client = await dbPool.connect();
  try {
    const newStatus = opts.verdict === 'escalated' ? 'escalated' : 'resolved';
    const result = await client.query(
      `UPDATE ai_review_queue
         SET verdict = $2,
             reviewed_by = $3,
             review_notes = $4,
             escalated_to = $5,
             status = $6,
             reviewed_at = now()
       WHERE review_id = $1
       RETURNING *`,
      [
        opts.reviewId,
        opts.verdict,
        opts.reviewedBy,
        opts.reviewNotes ?? null,
        opts.escalatedTo ?? null,
        newStatus,
      ],
    );
    if (result.rowCount === 0) return null;
    return rowToReviewItem(result.rows[0] as Record<string, unknown>);
  } catch (err) {
    logger.error(
      { err, reviewId: opts.reviewId },
      '[ai-evals-reader] dbRecordReviewDecision failed',
    );
    return null;
  } finally {
    client.release();
  }
}
