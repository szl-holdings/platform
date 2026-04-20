import { seededRng } from './prng.js';

export interface MetricPoint {
  timestamp: number;
  value: number;
  anomaly?: boolean;
  deploymentMarker?: string;
}

export interface GoldenSignalsSnapshot {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  throughput: number;
  errorRate: number;
  saturation: number;
  apdex: number;
  timestamp: number;
}

export interface ServiceApmTrace {
  traceId: string;
  service: string;
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  totalMs: number;
  statusCode: number;
  timestamp: number;
  spans: ApmSpanBreakdown[];
  userId?: string;
  deployVersion: string;
}

export interface ApmSpanBreakdown {
  name: string;
  type: 'middleware' | 'auth' | 'db' | 'external' | 'render' | 'cache' | 'queue';
  durationMs: number;
  startOffset: number;
  error?: string;
  detail?: string;
}

export interface DeploymentMarker {
  id: string;
  timestamp: number;
  version: string;
  service: string;
  environment: 'production' | 'staging';
  triggeredBy: string;
  metricShift: {
    latencyDelta: number;
    errorRateDelta: number;
    throughputDelta: number;
  };
}

export interface ErrorHeatmapCell {
  service: string;
  endpoint: string;
  errorCount: number;
  errorRate: number;
  window: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SloStatus {
  service: string;
  sloName: string;
  target: number;
  current: number;
  unit: string;
  errorBudgetMinutes: number;
  errorBudgetConsumedPct: number;
  burnRate1h: number;
  burnRate6h: number;
  burnRate24h: number;
  status: 'healthy' | 'at_risk' | 'burning' | 'exhausted';
  windowDays: number;
}

const SERVICES = [
  'api-gateway',
  'auth-service',
  'payment-service',
  'checkout-api',
  'inventory-api',
  'notification-worker',
  'search-service',
  'user-service',
  'order-processor',
  'analytics-service',
  'ml-inference',
  'cdn-edge',
];

const ROUTES: Record<string, string[]> = {
  'api-gateway': ['/v2/', '/v2/auth', '/v2/checkout', '/v2/search', '/v2/user', '/health'],
  'auth-service': ['/auth/login', '/auth/refresh', '/auth/verify', '/auth/logout', '/auth/mfa'],
  'payment-service': ['/payment/charge', '/payment/refund', '/payment/status', '/payment/webhook'],
  'checkout-api': ['/checkout/init', '/checkout/complete', '/checkout/abandon'],
  'inventory-api': ['/inventory/check', '/inventory/reserve', '/inventory/release'],
  'notification-worker': ['/notify/email', '/notify/sms', '/notify/push', '/notify/webhook'],
  'search-service': ['/search/query', '/search/suggest', '/search/index', '/search/facets'],
  'user-service': ['/user/profile', '/user/preferences', '/user/activity', '/user/sessions'],
  'order-processor': ['/order/create', '/order/update', '/order/cancel', '/order/status'],
  'analytics-service': ['/analytics/event', '/analytics/report', '/analytics/export'],
  'ml-inference': ['/infer/classify', '/infer/recommend', '/infer/score', '/infer/embed'],
  'cdn-edge': ['/edge/purge', '/edge/prefetch', '/edge/stats'],
};

const EXTERNAL_DEPS = [
  'stripe-api',
  'twilio-sms',
  'sendgrid',
  'algolia',
  'auth0',
  's3',
  'elasticache',
  'rds-primary',
  'kafka',
];
const DB_QUERIES = [
  'SELECT users WHERE id = ?',
  'INSERT INTO orders (user_id, total)',
  'UPDATE inventory SET quantity',
  'SELECT products WHERE category = ?',
  'BEGIN; INSERT payment_events',
  'SELECT sessions WHERE token = ?',
];

export class MetricTimeSeriesSimulator {
  private rng: ReturnType<typeof seededRng>;
  private seed: number;

  constructor(seed = 0xdeadbeef) {
    this.seed = seed;
    this.rng = seededRng(seed);
  }

  reset() {
    this.rng = seededRng(this.seed);
  }

  generateTimeSeries(
    baseValue: number,
    points: number,
    intervalMs: number,
    options: {
      variance?: number;
      anomalyRate?: number;
      anomalyMultiplier?: number;
      trend?: number;
      nowMs?: number;
    } = {},
  ): MetricPoint[] {
    const {
      variance = 0.1,
      anomalyRate = 0.04,
      anomalyMultiplier = 3.5,
      trend = 0,
      nowMs = Date.now(),
    } = options;

    const result: MetricPoint[] = [];
    let current = baseValue;

    for (let i = points - 1; i >= 0; i--) {
      const ts = nowMs - i * intervalMs;
      const isAnomaly = this.rng.bool(anomalyRate);
      const jitter = this.rng.gauss(0, baseValue * variance);
      current = Math.max(0, baseValue + jitter + trend * (points - 1 - i));

      if (isAnomaly) {
        current = current * (anomalyMultiplier + this.rng.range(-0.5, 0.5));
      }

      result.push({ timestamp: ts, value: parseFloat(current.toFixed(3)), anomaly: isAnomaly });
    }

    return result;
  }

  generateGoldenSignalsHistory(
    service: string,
    points = 60,
    intervalMs = 60_000,
    nowMs = Date.now(),
  ): GoldenSignalsSnapshot[] {
    const rng = this.rng;
    const baseLatency = 50 + rng.range(20, 200);
    const baseThroughput = 50 + rng.range(50, 500);
    const baseErrorRate = 0.2 + rng.range(0, 1.5);
    const baseSaturation = 30 + rng.range(10, 40);

    const result: GoldenSignalsSnapshot[] = [];
    let latency = baseLatency;
    let throughput = baseThroughput;
    let errorRate = baseErrorRate;
    let saturation = baseSaturation;

    for (let i = points - 1; i >= 0; i--) {
      const ts = nowMs - i * intervalMs;
      const isSpike = rng.bool(0.05);

      latency = Math.max(5, latency + rng.gauss(0, latency * 0.08));
      throughput = Math.max(1, throughput + rng.gauss(0, throughput * 0.06));
      errorRate = Math.max(0, errorRate + rng.gauss(0, 0.15));
      saturation = Math.max(5, Math.min(100, saturation + rng.gauss(0, 3)));

      if (isSpike) {
        latency *= 2.5 + rng.range(0, 2);
        errorRate += 5 + rng.range(0, 10);
        saturation = Math.min(100, saturation + 20 + rng.range(0, 15));
      }

      const p50 = latency * 0.7;
      const p95 = latency * 1.8;
      const p99 = latency * 2.8;
      const apdexT = baseLatency * 1.5;
      const satisfiedRate =
        Math.max(0, 1 - errorRate / 100) * (p95 <= apdexT ? 1 : p95 <= apdexT * 4 ? 0.5 : 0);
      const apdex = Math.min(1, satisfiedRate + rng.range(-0.05, 0.05));

      result.push({
        latencyP50: parseFloat(p50.toFixed(1)),
        latencyP95: parseFloat(p95.toFixed(1)),
        latencyP99: parseFloat(p99.toFixed(1)),
        throughput: parseFloat(throughput.toFixed(1)),
        errorRate: parseFloat(Math.min(100, errorRate).toFixed(3)),
        saturation: parseFloat(saturation.toFixed(1)),
        apdex: parseFloat(Math.max(0, Math.min(1, apdex)).toFixed(3)),
        timestamp: ts,
      });

      if (isSpike) {
        latency = baseLatency + rng.gauss(0, baseLatency * 0.1);
        errorRate = baseErrorRate + rng.range(0, 0.5);
      }
    }

    return result;
  }

  generateTransactionTrace(service: string, nowMs = Date.now()): ServiceApmTrace {
    const rng = this.rng;
    const routes = ROUTES[service] ?? ['/api/v1/resource'];
    const route = rng.pick(routes);
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
    const method =
      route.includes('create') || route.includes('charge') || route.includes('init')
        ? 'POST'
        : route.includes('update') || route.includes('cancel')
          ? 'PUT'
          : 'GET';

    const hasError = rng.bool(0.06);
    const isSlowQuery = rng.bool(0.08);

    const spans: ApmSpanBreakdown[] = [];
    let offset = 0;

    const middlewareMs = rng.range(2, 12);
    spans.push({
      name: 'express.middleware',
      type: 'middleware',
      durationMs: parseFloat(middlewareMs.toFixed(1)),
      startOffset: offset,
    });
    offset += middlewareMs;

    const authMs = rng.range(5, 40);
    spans.push({
      name: 'auth.verify_token',
      type: 'auth',
      durationMs: parseFloat(authMs.toFixed(1)),
      startOffset: offset,
      detail: 'JWT RS256 + Redis session check',
    });
    offset += authMs;

    const dbCount = rng.int(1, 4);
    for (let i = 0; i < dbCount; i++) {
      const dbMs = isSlowQuery && i === 0 ? rng.range(200, 800) : rng.range(4, 45);
      const query = rng.pick(DB_QUERIES);
      spans.push({
        name: `db.${rng.bool(0.3) ? 'write' : 'read'}`,
        type: 'db',
        durationMs: parseFloat(dbMs.toFixed(1)),
        startOffset: offset,
        detail: query,
        ...(hasError && i === dbCount - 1 ? { error: 'Connection pool exhausted' } : {}),
      });
      offset += dbMs;
    }

    if (rng.bool(0.4)) {
      const extMs = rng.range(20, 180);
      const dep = rng.pick(EXTERNAL_DEPS);
      spans.push({
        name: `external.${dep}`,
        type: 'external',
        durationMs: parseFloat(extMs.toFixed(1)),
        startOffset: offset,
        detail: dep,
      });
      offset += extMs;
    }

    const renderMs = rng.range(1, 8);
    spans.push({
      name: 'json.serialize',
      type: 'render',
      durationMs: parseFloat(renderMs.toFixed(1)),
      startOffset: offset,
    });
    offset += renderMs;

    const totalMs = parseFloat(offset.toFixed(1));
    const statusCode = hasError ? (rng.bool(0.6) ? 500 : 503) : rng.bool(0.02) ? 429 : 200;

    return {
      traceId: `${service.slice(0, 4)}-${Math.floor(rng.range(0x10000000, 0xffffffff)).toString(16)}`,
      service,
      route,
      method,
      totalMs,
      statusCode,
      timestamp: nowMs - Math.floor(rng.range(0, 3_600_000)),
      spans,
      ...(rng.bool(0.7) ? { userId: `usr_${rng.int(10000, 99999)}` } : {}),
      deployVersion: `v${rng.int(3, 5)}.${rng.int(10, 20)}.${rng.int(0, 8)}`,
    };
  }

  generateManyTraces(service: string, count = 50, nowMs = Date.now()): ServiceApmTrace[] {
    return Array.from({ length: count }, () => this.generateTransactionTrace(service, nowMs));
  }

  generateDeploymentMarkers(service: string, count = 3, nowMs = Date.now()): DeploymentMarker[] {
    const rng = this.rng;
    const actors = ['CI/CD pipeline', 'Sarah M.', 'Alex C.', 'auto-deploy', 'Priya P.'];
    const results: DeploymentMarker[] = [];

    for (let i = 0; i < count; i++) {
      const hoursAgo = rng.range(1, 72);
      const isGoodDeploy = rng.bool(0.7);
      results.push({
        id: `deploy-${service}-${i}`,
        timestamp: nowMs - hoursAgo * 3_600_000,
        version: `v${rng.int(3, 5)}.${rng.int(10, 20)}.${rng.int(0, 8)}`,
        service,
        environment: 'production',
        triggeredBy: rng.pick(actors),
        metricShift: {
          latencyDelta: isGoodDeploy ? rng.range(-30, -5) : rng.range(20, 120),
          errorRateDelta: isGoodDeploy ? rng.range(-0.5, 0) : rng.range(0.5, 4),
          throughputDelta: isGoodDeploy ? rng.range(5, 25) : rng.range(-30, -5),
        },
      });
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  }

  generateErrorHeatmap(services = SERVICES.slice(0, 6), nowMs = Date.now()): ErrorHeatmapCell[] {
    const rng = this.rng;
    const windows = ['1m', '5m', '15m', '1h'];
    const cells: ErrorHeatmapCell[] = [];

    for (const service of services) {
      const routes = ROUTES[service] ?? ['/api'];
      for (const route of routes.slice(0, 4)) {
        const errorRate = Math.max(0, rng.gauss(1.2, 2));
        const errorCount = Math.floor(errorRate * rng.range(50, 500));
        const severity: ErrorHeatmapCell['severity'] =
          errorRate > 10 ? 'critical' : errorRate > 5 ? 'high' : errorRate > 2 ? 'medium' : 'low';
        cells.push({
          service,
          endpoint: route,
          errorCount,
          errorRate: parseFloat(errorRate.toFixed(2)),
          window: rng.pick(windows),
          severity,
        });
      }
    }

    return cells;
  }

  generateSloStatuses(services = SERVICES.slice(0, 8)): SloStatus[] {
    const rng = this.rng;

    return services.map((service) => {
      const target = rng.pick([99.9, 99.95, 99.99, 99.5]);
      const degraded = rng.bool(0.25);
      const current = degraded ? target - rng.range(0.05, 0.5) : target + rng.range(-0.02, 0.08);

      const windowDays = 30;
      const totalMinutes = windowDays * 24 * 60;
      const allowedDowntimeMin = ((100 - target) / 100) * totalMinutes;
      const usedDowntimeMin = ((100 - Math.min(current, target + 0.1)) / 100) * totalMinutes;
      const consumedPct = Math.min(200, (usedDowntimeMin / allowedDowntimeMin) * 100);

      const burnRate1h = Math.max(0, consumedPct > 100 ? rng.range(2, 8) : rng.range(0.1, 1.2));
      const burnRate6h = Math.max(0, consumedPct > 100 ? rng.range(1.5, 4) : rng.range(0.1, 0.8));
      const burnRate24h = Math.max(0, consumedPct > 100 ? rng.range(1, 2.5) : rng.range(0.05, 0.5));

      const status: SloStatus['status'] =
        consumedPct >= 100
          ? 'exhausted'
          : consumedPct >= 80
            ? 'burning'
            : consumedPct >= 50
              ? 'at_risk'
              : 'healthy';

      return {
        service,
        sloName: rng.pick(['Availability', 'P95 Latency', 'Success Rate', 'P99 Latency']),
        target,
        current: parseFloat(current.toFixed(4)),
        unit: rng.pick(['%', 'ms']),
        errorBudgetMinutes: parseFloat(allowedDowntimeMin.toFixed(2)),
        errorBudgetConsumedPct: parseFloat(consumedPct.toFixed(1)),
        burnRate1h: parseFloat(burnRate1h.toFixed(2)),
        burnRate6h: parseFloat(burnRate6h.toFixed(2)),
        burnRate24h: parseFloat(burnRate24h.toFixed(2)),
        status,
        windowDays,
      };
    });
  }

  getServices(): string[] {
    return SERVICES;
  }
}

export const defaultMetricSimulator = new MetricTimeSeriesSimulator(0xc0ffee42);
