/**
 * load-shedder.ts
 *
 * Adaptive load shedding middleware.
 *
 * Monitors event-loop lag and DB pool saturation. When pressure exceeds
 * configured thresholds, the middleware progressively rejects lower-priority
 * traffic before shedding user-facing requests:
 *
 *   Priority 1 (highest) — user-facing API calls
 *   Priority 2           — bulk/export operations
 *   Priority 3 (lowest)  — background syncs, analytics, webhooks
 *
 * When shedding, the middleware responds with 503 + Retry-After headers and
 * emits an OpenTelemetry span event so the shed appears in traces.
 */

import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

const isProduction = process.env.NODE_ENV === 'production';

const EL_WARN_MS = Number(process.env.LOAD_SHED_EL_WARN_MS ?? '100');
const EL_CRITICAL_MS = Number(process.env.LOAD_SHED_EL_CRITICAL_MS ?? '500');
const POOL_WARN_PCT = Number(process.env.LOAD_SHED_POOL_WARN_PCT ?? '75');
const POOL_CRITICAL_PCT = Number(process.env.LOAD_SHED_POOL_CRITICAL_PCT ?? '90');
const SAMPLE_INTERVAL_MS = Number(process.env.LOAD_SHED_SAMPLE_INTERVAL_MS ?? '1000');

type PressureLevel = 'normal' | 'elevated' | 'critical';

interface LoadMetrics {
  eventLoopLagMs: number;
  poolUsedPct: number;
  pressureLevel: PressureLevel;
  sampledAt: number;
}

let currentMetrics: LoadMetrics = {
  eventLoopLagMs: 0,
  poolUsedPct: 0,
  pressureLevel: 'normal',
  sampledAt: Date.now(),
};

function sampleEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1_000_000;
      resolve(lag);
    });
  });
}

function getPoolUsedPct(): number {
  try {
    const { pool } = require('@szl-holdings/db');
    const total: number = (pool as { totalCount?: number }).totalCount ?? 0;
    const idle: number = (pool as { idleCount?: number }).idleCount ?? 0;
    const max: number = (pool as { options?: { max?: number } }).options?.max ?? 10;
    const active = Math.max(0, total - idle);
    return max > 0 ? (active / max) * 100 : 0;
  } catch {
    return 0;
  }
}

function computePressure(lagMs: number, poolPct: number): PressureLevel {
  if (lagMs >= EL_CRITICAL_MS || poolPct >= POOL_CRITICAL_PCT) return 'critical';
  if (lagMs >= EL_WARN_MS || poolPct >= POOL_WARN_PCT) return 'elevated';
  return 'normal';
}

let samplerTimer: ReturnType<typeof setInterval> | null = null;

export function startLoadMetricsSampling(): void {
  if (samplerTimer) return;
  samplerTimer = setInterval(async () => {
    try {
      const lagMs = await sampleEventLoopLag();
      const poolUsedPct = getPoolUsedPct();
      const pressureLevel = computePressure(lagMs, poolUsedPct);
      currentMetrics = { eventLoopLagMs: lagMs, poolUsedPct, pressureLevel, sampledAt: Date.now() };

      if (pressureLevel !== 'normal') {
        logger.warn(
          { lagMs, poolUsedPct, pressureLevel },
          '[load-shedder] Elevated system pressure detected',
        );

        try {
          const { trace } = require('@opentelemetry/api');
          const span = trace.getActiveSpan();
          if (span) {
            span.addEvent('load_shedder.pressure', {
              'load.lag_ms': lagMs,
              'load.pool_pct': poolUsedPct,
              'load.level': pressureLevel,
            });
          }
        } catch {}
      }
    } catch {}
  }, SAMPLE_INTERVAL_MS);
  samplerTimer.unref();
}

export function stopLoadMetricsSampling(): void {
  if (samplerTimer) {
    clearInterval(samplerTimer);
    samplerTimer = null;
  }
}

export function getLoadMetrics(): LoadMetrics {
  return { ...currentMetrics };
}

type TrafficPriority = 'background' | 'bulk' | 'user';

const BACKGROUND_PATH_PATTERNS = [
  /\/sync\b/i,
  /\/webhooks?\//i,
  /\/analytics\//i,
  /\/metrics\//i,
  /\/batch\//i,
  /\/bulk\//i,
  /\/export\//i,
  /\/reports?\//i,
  /\/feed\b/i,
  /\/intel\/refresh/i,
  /\/background\//i,
];

const BULK_PATH_PATTERNS = [
  /\/import\//i,
  /\/export\b/i,
  /\/generate\b/i,
  /\/demand-packet/i,
  /\/forecast\b/i,
];

function classifyTraffic(req: Request): TrafficPriority {
  const path = req.path ?? '';
  if (BACKGROUND_PATH_PATTERNS.some((r) => r.test(path))) return 'background';
  if (BULK_PATH_PATTERNS.some((r) => r.test(path))) return 'bulk';
  return 'user';
}

function shouldShed(priority: TrafficPriority, pressure: PressureLevel): boolean {
  if (pressure === 'normal') return false;
  if (pressure === 'elevated') return priority === 'background';
  if (pressure === 'critical') return priority === 'background' || priority === 'bulk';
  return false;
}

export function adaptiveLoadShedder(req: Request, res: Response, next: NextFunction): void {
  if (!isProduction && process.env.ENABLE_LOAD_SHEDDER !== 'true') {
    next();
    return;
  }

  const { pressureLevel } = currentMetrics;
  if (pressureLevel === 'normal') {
    next();
    return;
  }

  const priority = classifyTraffic(req);
  if (!shouldShed(priority, pressureLevel)) {
    next();
    return;
  }

  const retryAfter = pressureLevel === 'critical' ? 30 : 10;

  logger.warn(
    {
      path: req.path,
      method: req.method,
      priority,
      pressureLevel,
      lagMs: currentMetrics.eventLoopLagMs,
      poolPct: currentMetrics.poolUsedPct,
    },
    '[load-shedder] Shedding low-priority request',
  );

  try {
    const { trace } = require('@opentelemetry/api');
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent('load_shedder.shed', {
        'load.path': req.path,
        'load.priority': priority,
        'load.pressure': pressureLevel,
      });
    }
  } catch {}

  res.setHeader('Retry-After', String(retryAfter));
  res.status(503).json({
    error: 'Service temporarily under high load. Please retry after a moment.',
    code: 'LOAD_SHED',
    retryAfterSeconds: retryAfter,
    priority,
    requestId: (res.getHeader('X-Request-ID') as string | undefined) ?? undefined,
  });
}
