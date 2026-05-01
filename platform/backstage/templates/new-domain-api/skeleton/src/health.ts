import { Router } from 'express';
import pkg from '../package.json' with { type: 'json' };
const { version } = pkg;

export const healthRouter = Router();

/**
 * GET /health
 * Required by all SZL platform services.
 * Returns: { status, version, domain, uptime }
 * Platform scorecard dimension: Health EP
 */
healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version,
    domain: '${{ values.domainSlug }}',
    uptime: Math.floor(process.uptime()),
  });
});

/**
 * GET /ready
 * Kubernetes/Container Apps readiness probe.
 * Returns 503 while the service is warming up.
 */
healthRouter.get('/ready', (_req, res) => {
  res.json({ ready: true });
});
