/**
 * AI Evals Persistence
 *
 * Wires the trace sink and review queue write hooks to PostgreSQL so that
 * captured AI evaluation traces and review queue items survive server restarts.
 *
 * On startup:
 *   - Hydrates the in-memory trace ring buffer from the last N traces in DB
 *   - Hydrates the in-memory review queue from all non-resolved items in DB
 *
 * On every new trace / review event:
 *   - Writes synchronously to DB (fire-and-forget, non-blocking)
 */

import {
  type AITrace,
  hydrateReviewQueue,
  hydrateTraces,
  type ReviewQueueItem,
  registerReviewQueueSink,
  registerTraceSink,
  registerTraceUpdateSink,
  type TraceStatus,
} from '@szl-holdings/ai-engine';
import { setDbPool } from './ai-evals-db-reader';
import { logger } from './logger';

const TRACE_HYDRATE_LIMIT = parseInt(process.env.AI_TRACE_HYDRATE_LIMIT ?? '2000', 10);
const REVIEW_HYDRATE_LIMIT = parseInt(process.env.AI_REVIEW_HYDRATE_LIMIT ?? '500', 10);

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

export async function initAiEvalsPersistence(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    logger.info(
      '[ai-evals] DATABASE_URL not set — AI traces and review queue remain in-memory only',
    );
    return;
  }

  try {
    const { pool } = await import('@szl-holdings/db');

    // Make the pool available to the DB reader module for dashboard queries
    setDbPool(pool);

    // ── Register trace sink (write-through to DB) ──────────────────────────
    registerTraceSink(async (trace: AITrace) => {
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO ai_traces (
            trace_id, correlation_id, org_id, agent_id, model, model_provider,
            model_version, route_class, domain, recommendation_type, prompt_hash,
            prompt_tokens, completion_tokens, latency_ms, cost_estimate_usd,
            confidence, risk_level, requires_review, review_reason, proof_chain_id,
            outcome_graph_id, input_summary, output_summary, tools_used,
            eval_score, eval_passed, status, metadata, captured_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
            $21,$22,$23,$24,$25,$26,$27,$28,$29
          ) ON CONFLICT (trace_id) DO NOTHING`,
          [
            trace.traceId,
            trace.correlationId ?? null,
            trace.orgId ?? null,
            trace.agentId ?? null,
            trace.model,
            trace.modelProvider,
            trace.modelVersion ?? null,
            trace.routeClass ?? null,
            trace.domain,
            trace.recommendationType,
            trace.promptHash,
            trace.promptTokens,
            trace.completionTokens,
            trace.latencyMs,
            trace.costEstimateUsd,
            trace.confidence,
            trace.riskLevel ?? null,
            trace.requiresReview,
            trace.reviewReason ?? null,
            trace.proofChainId ?? null,
            trace.outcomeGraphId ?? null,
            trace.inputSummary ?? null,
            trace.outputSummary ?? null,
            trace.toolsUsed ? JSON.stringify(trace.toolsUsed) : null,
            trace.evalScore ?? null,
            trace.evalPassed ?? null,
            trace.status,
            JSON.stringify(trace.metadata ?? {}),
            new Date(trace.capturedAt),
          ],
        );
      } finally {
        client.release();
      }
    });

    // ── Register trace status update sink ─────────────────────────────────
    registerTraceUpdateSink(
      async (traceId: string, status: TraceStatus, evalScore?: number, evalPassed?: boolean) => {
        const client = await pool.connect();
        try {
          await client.query(
            `UPDATE ai_traces
           SET status = $1,
               eval_score = COALESCE($2, eval_score),
               eval_passed = COALESCE($3, eval_passed)
           WHERE trace_id = $4`,
            [status, evalScore ?? null, evalPassed ?? null, traceId],
          );
        } finally {
          client.release();
        }
      },
    );

    // ── Register review queue sink (write-through to DB) ──────────────────
    registerReviewQueueSink({
      onEnqueue: async (item: ReviewQueueItem) => {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO ai_review_queue (
              review_id, trace_id, org_id, domain, recommendation_type, model,
              confidence, risk_level, review_reason, priority, input_summary,
              output_summary, cost_estimate_usd, latency_ms, eval_score, eval_passed,
              verdict, reviewed_by, review_notes, escalated_to, status,
              enqueued_at, reviewed_at, metadata
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
              $17,$18,$19,$20,$21,$22,$23,$24
            ) ON CONFLICT (review_id) DO NOTHING`,
            [
              item.reviewId,
              item.traceId,
              item.orgId ?? null,
              item.domain,
              item.recommendationType,
              item.model,
              item.confidence,
              item.riskLevel ?? null,
              item.reviewReason,
              item.priority,
              item.inputSummary ?? null,
              item.outputSummary ?? null,
              item.costEstimateUsd,
              item.latencyMs,
              item.evalScore ?? null,
              item.evalPassed ?? null,
              item.verdict ?? null,
              item.reviewedBy ?? null,
              item.reviewNotes ?? null,
              item.escalatedTo ?? null,
              item.status,
              new Date(item.enqueuedAt),
              item.reviewedAt ? new Date(item.reviewedAt) : null,
              JSON.stringify(item.metadata ?? {}),
            ],
          );
        } finally {
          client.release();
        }
      },

      onDecision: async (item: ReviewQueueItem) => {
        const client = await pool.connect();
        try {
          await client.query(
            `UPDATE ai_review_queue
             SET verdict = $1, reviewed_by = $2, review_notes = $3,
                 escalated_to = $4, status = $5, reviewed_at = $6
             WHERE review_id = $7`,
            [
              item.verdict ?? null,
              item.reviewedBy ?? null,
              item.reviewNotes ?? null,
              item.escalatedTo ?? null,
              item.status,
              item.reviewedAt ? new Date(item.reviewedAt) : null,
              item.reviewId,
            ],
          );
        } finally {
          client.release();
        }
      },

      onClaim: async (reviewId: string) => {
        const client = await pool.connect();
        try {
          await client.query(
            `UPDATE ai_review_queue SET status = 'in_review' WHERE review_id = $1 AND status = 'pending'`,
            [reviewId],
          );
        } finally {
          client.release();
        }
      },
    });

    // ── Hydrate in-memory caches from DB ──────────────────────────────────
    const client = await pool.connect();
    try {
      const [tracesResult, reviewResult] = await Promise.all([
        client
          .query(`SELECT * FROM ai_traces ORDER BY captured_at DESC LIMIT $1`, [
            TRACE_HYDRATE_LIMIT,
          ])
          .catch(() => ({ rows: [] })),
        client
          .query(
            `SELECT * FROM ai_review_queue
           WHERE status IN ('pending', 'in_review', 'escalated')
           ORDER BY enqueued_at DESC LIMIT $1`,
            [REVIEW_HYDRATE_LIMIT],
          )
          .catch(() => ({ rows: [] })),
      ]);

      const traces = (tracesResult.rows as Record<string, unknown>[]).map(rowToTrace);
      const reviewItems = (reviewResult.rows as Record<string, unknown>[]).map(rowToReviewItem);

      hydrateTraces(traces);
      hydrateReviewQueue(reviewItems);

      logger.info(
        { tracesLoaded: traces.length, reviewItemsLoaded: reviewItems.length },
        '[ai-evals] AI traces and review queue hydrated from PostgreSQL',
      );
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error(
      { err },
      '[ai-evals] Failed to initialize AI evals persistence — falling back to in-memory',
    );
  }
}
