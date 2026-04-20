/**
 * Admin — Observability Panel
 *
 * GET /api/admin/observability
 * Shows request latency p50/p95, job failures, retry counts,
 * agent/tool success rate, and top error hotspots over the last 24h.
 *
 * Access: admin+ role (enforced by adminRouter middleware).
 *
 * This route aggregates from:
 *   - serverTelemetry (in-process latency/error metrics)
 *   - AI ops summary (@szl-holdings/observability)
 *   - DB queries for job queue stats
 */

import { observabilityTimeRangeQuerySchema } from '@szl-holdings/contracts/admin';
import { db } from '@szl-holdings/db';
import { serverTelemetry } from '@szl-holdings/observability';
import { getInMemorySpans } from '@szl-holdings/otel';
import type { IRouter, Request, Response } from 'express';
import { sendError, sendSuccess } from '../../lib/api-response.js';
import { logger } from '../../lib/logger.js';
import { validateQuery } from '../../lib/validation.js';

const WINDOW_MS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

async function getJobStats(windowMs: number): Promise<{
  pending: number;
  running: number;
  failed: number;
  completed: number;
  retryCount: number;
}> {
  try {
    const since = new Date(Date.now() - windowMs).toISOString();
    const result = await db.execute<{
      status: string;
      cnt: string;
      retries: string;
    }>(`
      SELECT
        status,
        COUNT(*) AS cnt,
        COALESCE(SUM(attempts), 0) AS retries
      FROM alloy_runs
      WHERE created_at >= '${since}'
      GROUP BY status
    `);
    const byStatus: Record<string, number> = {};
    let retryCount = 0;
    for (const row of result.rows) {
      byStatus[row.status] = Number(row.cnt);
      retryCount += Number(row.retries);
    }
    return {
      pending: byStatus['pending'] ?? 0,
      running: byStatus['in_progress'] ?? 0,
      failed: byStatus['failed'] ?? 0,
      completed: byStatus['completed'] ?? 0,
      retryCount,
    };
  } catch {
    return { pending: 0, running: 0, failed: 0, completed: 0, retryCount: 0 };
  }
}

async function getAgentToolStats(windowMs: number): Promise<{
  totalCalls: number;
  successCalls: number;
  successRate: number;
  topErrors: Array<{ tool: string; errorCount: number }>;
}> {
  try {
    const since = new Date(Date.now() - windowMs).toISOString();
    const result = await db.execute<{
      tool_name: string;
      total: string;
      succeeded: string;
    }>(`
      SELECT
        tool_name,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE succeeded = true) AS succeeded
      FROM mcp_tool_invocations
      WHERE created_at >= '${since}'
      GROUP BY tool_name
      ORDER BY total DESC
      LIMIT 20
    `);
    let totalCalls = 0;
    let successCalls = 0;
    const topErrors: Array<{ tool: string; errorCount: number }> = [];
    for (const row of result.rows) {
      const t = Number(row.total);
      const s = Number(row.succeeded);
      totalCalls += t;
      successCalls += s;
      const failCount = t - s;
      if (failCount > 0) topErrors.push({ tool: row.tool_name, errorCount: failCount });
    }
    topErrors.sort((a, b) => b.errorCount - a.errorCount);
    return {
      totalCalls,
      successCalls,
      successRate: totalCalls > 0 ? successCalls / totalCalls : 1,
      topErrors: topErrors.slice(0, 10),
    };
  } catch {
    return { totalCalls: 0, successCalls: 0, successRate: 1, topErrors: [] };
  }
}

function computePercentiles(values: number[]): { p50: number; p95: number } {
  if (!values.length) return { p50: 0, p95: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  return { p50, p95 };
}

export function register(router: IRouter): void {
  router.get(
    '/admin/observability',
    validateQuery(observabilityTimeRangeQuerySchema),
    async (req: Request, res: Response) => {
      try {
        const { window: windowKey = '24h' } = req.query as { window?: string };
        const windowMs = WINDOW_MS[windowKey] ?? WINDOW_MS['24h']!;

        const [jobStats, agentToolStats] = await Promise.all([
          getJobStats(windowMs),
          getAgentToolStats(windowMs),
        ]);

        const spans = getInMemorySpans?.() ?? [];
        const httpSpans = spans.filter(
          (s: { name?: string; durationMs?: number }) =>
            s.name?.startsWith?.('http.') && typeof s.durationMs === 'number',
        );
        const latencies = httpSpans.map((s: { durationMs: number }) => s.durationMs);
        const { p50: httpP50, p95: httpP95 } = computePercentiles(latencies);

        const telemetrySummary = serverTelemetry?.getSummary?.() ?? {};

        const errorHotspots = await (async () => {
          try {
            const since = new Date(Date.now() - windowMs).toISOString();
            const result = await db.execute<{ path: string; error_count: string }>(`
              SELECT
                route_path AS path,
                COUNT(*) AS error_count
              FROM request_telemetry
              WHERE status_code >= 500 AND recorded_at >= '${since}'
              GROUP BY route_path
              ORDER BY error_count DESC
              LIMIT 10
            `);
            return result.rows.map((r) => ({
              path: r.path,
              errorCount: Number(r.error_count),
            }));
          } catch {
            return [];
          }
        })();

        return sendSuccess(res, {
          window: windowKey,
          generatedAt: new Date().toISOString(),
          http: {
            p50LatencyMs: Math.round(httpP50),
            p95LatencyMs: Math.round(httpP95),
            sampleCount: latencies.length,
            ...telemetrySummary,
          },
          jobs: jobStats,
          agentTools: agentToolStats,
          errorHotspots,
        });
      } catch (err) {
        logger.error({ err }, 'Failed to load observability metrics');
        return sendError(res, 'Failed to load observability metrics', 500);
      }
    },
  );
}
