/**
 * Slow Query Monitor
 *
 * Intercepts database queries and automatically runs EXPLAIN ANALYZE
 * for any query that exceeds the configured slow query threshold.
 *
 * Logs structured slow-query events with:
 *  - Query text and parameters
 *  - Duration in milliseconds
 *  - EXPLAIN ANALYZE output (execution plan)
 *  - Correlation context for request tracing
 *
 * Performance: EXPLAIN ANALYZE re-executes the query, so it is only run for
 * queries well above the threshold (2× by default) to avoid overhead.
 */

import { logger } from './logger.js';

export interface SlowQueryEvent {
  query: string;
  params?: unknown[];
  durationMs: number;
  explainPlan?: string;
  correlationId?: string;
  timestamp: string;
}

const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS ?? '200', 10);
const EXPLAIN_THRESHOLD_MULTIPLIER = parseInt(
  process.env.SLOW_QUERY_EXPLAIN_MULTIPLIER ?? '2',
  10,
);
const EXPLAIN_THRESHOLD_MS = SLOW_QUERY_THRESHOLD_MS * EXPLAIN_THRESHOLD_MULTIPLIER;
const MAX_EXPLAIN_QUERIES_PER_MINUTE = parseInt(process.env.SLOW_QUERY_EXPLAIN_MAX_PER_MIN ?? '10', 10);

let explainCallsThisMinute = 0;
let explainWindowStart = Date.now();

function canRunExplain(): boolean {
  const now = Date.now();
  if (now - explainWindowStart > 60_000) {
    explainCallsThisMinute = 0;
    explainWindowStart = now;
  }
  return explainCallsThisMinute < MAX_EXPLAIN_QUERIES_PER_MINUTE;
}

function incrementExplainCounter(): void {
  explainCallsThisMinute++;
}

/**
 * Runs EXPLAIN ANALYZE on the given query using a dedicated connection
 * from the pool. Wraps results in a structured string.
 *
 * SAFETY: uses a SELECT-only wrapper. If the query is a mutation,
 * EXPLAIN ANALYZE will execute it inside an implicit transaction that
 * is immediately rolled back. For pure safety we skip mutations.
 */
async function runExplainAnalyze(
  query: string,
  params: unknown[] | undefined,
): Promise<string | undefined> {
  const queryLower = query.trimStart().toLowerCase();
  const isMutation =
    queryLower.startsWith('insert') ||
    queryLower.startsWith('update') ||
    queryLower.startsWith('delete');

  if (isMutation) return undefined;
  if (!canRunExplain()) return '(EXPLAIN ANALYZE rate-limited this minute)';

  try {
    incrementExplainCounter();
    const { pool } = await import('@szl-holdings/db');
    const client = await (pool as unknown as { connect: () => Promise<import('pg').PoolClient> }).connect();
    try {
      // Use EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) for maximum insight
      const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${query}`;
      const result = await client.query(explainSql, params);
      const lines: string[] = result.rows.map((r: Record<string, unknown>) => {
        const key = Object.keys(r)[0];
        return String(r[key]);
      });
      return lines.join('\n');
    } finally {
      client.release();
    }
  } catch (err) {
    return `(EXPLAIN ANALYZE failed: ${err instanceof Error ? err.message : String(err)})`;
  }
}

/**
 * Records a slow query event. If the duration exceeds the EXPLAIN threshold,
 * also runs EXPLAIN ANALYZE and includes the plan in the log.
 */
export async function recordSlowQuery(
  query: string,
  params: unknown[] | undefined,
  durationMs: number,
  correlationId?: string,
): Promise<void> {
  if (durationMs < SLOW_QUERY_THRESHOLD_MS) return;

  const event: SlowQueryEvent = {
    query: query.slice(0, 2000), // cap at 2000 chars for log safety
    params: params?.slice(0, 20), // cap parameter list
    durationMs,
    correlationId,
    timestamp: new Date().toISOString(),
  };

  if (durationMs >= EXPLAIN_THRESHOLD_MS) {
    event.explainPlan = await runExplainAnalyze(query, params);
  }

  logger.warn(
    {
      ...event,
      slowQueryThresholdMs: SLOW_QUERY_THRESHOLD_MS,
      explainThresholdMs: EXPLAIN_THRESHOLD_MS,
    },
    `[slow-query] Query took ${durationMs}ms (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`,
  );
}

/**
 * Wraps an async database function with slow query monitoring.
 *
 * Example:
 *   const results = await withSlowQueryMonitor(
 *     'SELECT * FROM vessels WHERE status = $1',
 *     [status],
 *     () => db.select().from(vessels).where(eq(vessels.status, status)),
 *     correlationId,
 *   );
 */
export async function withSlowQueryMonitor<T>(
  queryLabel: string,
  params: unknown[] | undefined,
  fn: () => Promise<T>,
  correlationId?: string,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      void recordSlowQuery(queryLabel, params, durationMs, correlationId);
    }
    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      void recordSlowQuery(queryLabel, params, durationMs, correlationId);
    }
    throw err;
  }
}

export { SLOW_QUERY_THRESHOLD_MS, EXPLAIN_THRESHOLD_MS };
