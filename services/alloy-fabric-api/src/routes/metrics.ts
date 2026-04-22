import type { IRouter, Request, RequestHandler, Response } from 'express';

interface RouteStats {
  requests: number;
  errors: number;
  latencySumMs: number;
  latencyBuckets: Record<string, number>; // le => count, for histogram
}

const HISTOGRAM_BOUNDS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

const routeStats = new Map<string, RouteStats>();
let totalRequests = 0;
let totalErrors = 0;

// Extended operational metrics
interface OperationalCounters {
  rebuildRequests: number;
  rebuildDurationSumMs: number;
  approvalWaitSumMs: number;
  approvalWaitCount: number;
  backendRequests: Map<string, number>; // key: `${kind}:${model}:${warmth}`
}

const ops: OperationalCounters = {
  rebuildRequests: 0,
  rebuildDurationSumMs: 0,
  approvalWaitSumMs: 0,
  approvalWaitCount: 0,
  backendRequests: new Map(),
};

export function recordRebuildDuration(durationMs: number): void {
  ops.rebuildRequests++;
  ops.rebuildDurationSumMs += durationMs;
}

export function recordApprovalWait(waitMs: number): void {
  ops.approvalWaitCount++;
  ops.approvalWaitSumMs += waitMs;
}

export function recordBackendRequest(kind: string, model: string, warm: boolean): void {
  const key = `${kind}:${model}:${warm ? 'warm' : 'cold'}`;
  ops.backendRequests.set(key, (ops.backendRequests.get(key) ?? 0) + 1);
}

const recentLatencies: number[] = [];
const MAX_LATENCY_SAMPLES = 10_000;

const processStartMs = Date.now();

function getOrCreateRoute(route: string): RouteStats {
  let s = routeStats.get(route);
  if (!s) {
    const latencyBuckets: Record<string, number> = {};
    for (const b of HISTOGRAM_BOUNDS) latencyBuckets[String(b)] = 0;
    latencyBuckets['+Inf'] = 0;
    s = { requests: 0, errors: 0, latencySumMs: 0, latencyBuckets };
    routeStats.set(route, s);
  }
  return s;
}

export function recordRequest(route: string, latencyMs: number, isError: boolean): void {
  totalRequests++;
  if (isError) totalErrors++;

  const s = getOrCreateRoute(route);
  s.requests++;
  if (isError) s.errors++;
  s.latencySumMs += latencyMs;

  for (const b of HISTOGRAM_BOUNDS) {
    if (latencyMs <= b) s.latencyBuckets[String(b)]!++;
  }
  s.latencyBuckets['+Inf']!++;

  recentLatencies.push(latencyMs);
  if (recentLatencies.length > MAX_LATENCY_SAMPLES) recentLatencies.shift();
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil(p * sorted.length) - 1);
  return sorted[Math.min(sorted.length - 1, idx)]!;
}

function buildPrometheusText(): string {
  const lines: string[] = [];
  const uptime = (Date.now() - processStartMs) / 1000;

  lines.push('# HELP aef_requests_total Total HTTP requests');
  lines.push('# TYPE aef_requests_total counter');
  lines.push(`aef_requests_total ${totalRequests}`);

  lines.push('# HELP aef_errors_total Total HTTP error responses (4xx/5xx)');
  lines.push('# TYPE aef_errors_total counter');
  lines.push(`aef_errors_total ${totalErrors}`);

  lines.push('# HELP aef_uptime_seconds Service uptime in seconds');
  lines.push('# TYPE aef_uptime_seconds gauge');
  lines.push(`aef_uptime_seconds ${uptime.toFixed(2)}`);

  lines.push('# HELP aef_route_requests_total Requests per route');
  lines.push('# TYPE aef_route_requests_total counter');
  for (const [route, s] of routeStats) {
    const label = `route="${route}"`;
    lines.push(`aef_route_requests_total{${label}} ${s.requests}`);
  }

  lines.push('# HELP aef_route_errors_total Errors per route');
  lines.push('# TYPE aef_route_errors_total counter');
  for (const [route, s] of routeStats) {
    const label = `route="${route}"`;
    lines.push(`aef_route_errors_total{${label}} ${s.errors}`);
  }

  lines.push('# HELP aef_request_latency_ms_bucket Request latency histogram (ms)');
  lines.push('# TYPE aef_request_latency_ms_bucket histogram');
  for (const [route, s] of routeStats) {
    const label = `route="${route}"`;
    for (const b of HISTOGRAM_BOUNDS) {
      lines.push(
        `aef_request_latency_ms_bucket{${label},le="${b}"} ${s.latencyBuckets[String(b)]}`,
      );
    }
    lines.push(`aef_request_latency_ms_bucket{${label},le="+Inf"} ${s.latencyBuckets['+Inf']}`);
    lines.push(`aef_request_latency_ms_sum{${label}} ${s.latencySumMs}`);
    lines.push(`aef_request_latency_ms_count{${label}} ${s.requests}`);
  }

  lines.push('# HELP aef_rebuild_duration_ms_sum Total rebuild duration (ms)');
  lines.push('# TYPE aef_rebuild_duration_ms_sum gauge');
  lines.push(`aef_rebuild_duration_ms_sum ${ops.rebuildDurationSumMs.toFixed(2)}`);

  lines.push('# HELP aef_rebuild_requests_total Total index rebuild requests');
  lines.push('# TYPE aef_rebuild_requests_total counter');
  lines.push(`aef_rebuild_requests_total ${ops.rebuildRequests}`);

  if (ops.approvalWaitCount > 0) {
    lines.push('# HELP aef_approval_wait_ms_avg Average approval wait time (ms)');
    lines.push('# TYPE aef_approval_wait_ms_avg gauge');
    lines.push(
      `aef_approval_wait_ms_avg ${(ops.approvalWaitSumMs / ops.approvalWaitCount).toFixed(2)}`,
    );
  }

  if (ops.backendRequests.size > 0) {
    lines.push('# HELP aef_backend_requests_total Requests per embedding backend');
    lines.push('# TYPE aef_backend_requests_total counter');
    for (const [key, count] of ops.backendRequests) {
      const [kind, model, warmth] = key.split(':');
      lines.push(
        `aef_backend_requests_total{kind="${kind}",model="${model}",warmth="${warmth}"} ${count}`,
      );
    }
  }

  return `${lines.join('\n')}\n`;
}

export function metricsInstrumentationMiddleware(): RequestHandler {
  return (req: Request, res: Response, next) => {
    const startMs = Date.now();
    res.on('finish', () => {
      const latencyMs = Date.now() - startMs;
      const route = req.route?.path ?? req.path ?? 'unknown';
      const isError = res.statusCode >= 400;
      recordRequest(route, latencyMs, isError);
    });
    next();
  };
}

export function registerMetricsRoute(router: IRouter): void {
  router.get('/metrics', (_req: Request, res: Response) => {
    const accept = _req.headers.accept ?? '';
    if (accept.includes('text/plain') || accept.includes('*/*') || accept === '') {
      res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(buildPrometheusText());
      return;
    }

    const sorted = [...recentLatencies].sort((a, b) => a - b);

    res.json({
      service: 'alloy-fabric-api',
      uptimeSeconds: Math.floor((Date.now() - processStartMs) / 1000),
      requests: {
        total: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
        byRoute: Object.fromEntries(
          Array.from(routeStats.entries()).map(([r, s]) => [r, s.requests]),
        ),
        errorsByRoute: Object.fromEntries(
          Array.from(routeStats.entries()).map(([r, s]) => [r, s.errors]),
        ),
      },
      latency: {
        p50Ms: percentile(sorted, 0.5),
        p95Ms: percentile(sorted, 0.95),
        p99Ms: percentile(sorted, 0.99),
        maxMs: sorted[sorted.length - 1] ?? 0,
        samples: sorted.length,
      },
    });
  });
}
