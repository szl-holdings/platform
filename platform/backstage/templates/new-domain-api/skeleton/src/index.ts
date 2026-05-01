import 'dotenv/config';
import express from 'express';
import { env } from '@workspace/env';
import { initOtel } from '@workspace/otel';
import { createLogger } from '@workspace/telemetry-standards';
import { authMiddleware } from '@workspace/auth-shared';
import { policyMiddleware } from '@workspace/policy-guard';
import { securityHeaders } from '@workspace/security-headers';
import { healthRouter } from './health.js';
import { ${{ values.domainSlug }}Router } from './routes/${{ values.domainSlug }}.js';

// Bootstrap OTel before any other imports instrument the runtime
initOtel({ serviceName: '${{ values.domainSlug }}-api' });

const log = createLogger({ service: '${{ values.domainSlug }}-api' });
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(securityHeaders());
app.use(express.json());

// ── Health (no auth — checked by load balancer) ───────────────────────────────
app.use(healthRouter);

// ── Authenticated + policy-gated domain routes ────────────────────────────────
app.use('/api/${{ values.domainSlug }}', authMiddleware(), policyMiddleware(), ${{ values.domainSlug }}Router);

// ── Error envelope ─────────────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    log.error({ err }, 'Unhandled error');
    res.status(500).json({
      error: 'internal_server_error',
      code: 'INTERNAL',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  },
);

const port = env.PORT ?? ${{ values.port }};
app.listen(port, '0.0.0.0', () => {
  log.info({ port }, '${{ values.domainName }} API listening');
});

export default app;
