import type { NextFunction, Request, Response } from 'express';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

export const registry = new Registry();
registry.setDefaultLabels({ service: 'alloy-embedding-api' });

export const requestCounter = new Counter({
  name: 'aef_requests_total',
  help: 'Total number of AEF API requests',
  labelNames: ['method', 'path', 'status_code', 'tenant_id'],
  registers: [registry],
});

export const requestLatency = new Histogram({
  name: 'aef_request_duration_ms',
  help: 'AEF API request latency in milliseconds',
  labelNames: ['method', 'path', 'tenant_id'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [registry],
});

export const embedQueueDepth = new Gauge({
  name: 'aef_embed_queue_depth',
  help: 'Current depth of the embedding micro-batch queue',
  registers: [registry],
});

export const rerankQueueDepth = new Gauge({
  name: 'aef_rerank_queue_depth',
  help: 'Current depth of the rerank queue',
  registers: [registry],
});

export const warmStartCounter = new Counter({
  name: 'aef_worker_warm_starts_total',
  help: 'Number of requests served from a warm backend',
  labelNames: ['backend_id'],
  registers: [registry],
});

export const coldStartCounter = new Counter({
  name: 'aef_worker_cold_starts_total',
  help: 'Number of requests that triggered a cold backend start',
  labelNames: ['backend_id'],
  registers: [registry],
});

export const errorBudgetCounter = new Counter({
  name: 'aef_errors_total',
  help: 'Total number of AEF errors by kind',
  labelNames: ['kind', 'tenant_id'],
  registers: [registry],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const tenantId = req.tenantId ?? 'unknown';

  res.on('finish', () => {
    const labels = {
      method: req.method,
      path: req.route?.path ?? req.path,
      status_code: String(res.statusCode),
      tenant_id: tenantId,
    };
    requestCounter.inc(labels);
    requestLatency.observe(
      { method: req.method, path: req.route?.path ?? req.path, tenant_id: tenantId },
      Date.now() - start,
    );
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', registry.contentType);
  res.send(await registry.metrics());
}
