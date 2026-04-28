/**
 * Hono Edge Router Layer
 *
 * Mounts a Hono router alongside Express for new endpoints.
 * Provides automatic OpenAPI spec generation from route definitions.
 * All new endpoints are defined here using @hono/zod-openapi.
 *
 * The Hono app is adapted to Express via a thin bridge that:
 *  1. Transfers auth/correlation headers set by Express middleware
 *  2. Forwards the request body and query params
 *  3. Returns Hono responses as Express responses
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { logger } from '../lib/logger.js';

// ── Schema definitions ──────────────────────────────────────────────────────

const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  requestId: z.string().optional(),
  correlationId: z.string().optional(),
  details: z.unknown().optional(),
});

const HealthSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  router: z.literal('hono'),
  version: z.string(),
});

const SseInfoSchema = z.object({
  endpoint: z.string(),
  channels: z.array(z.string()),
  protocol: z.string(),
  authRequired: z.boolean(),
});

const ApiVersionSchema = z.object({
  current: z.string(),
  supported: z.array(z.string()),
  deprecated: z.array(z.string()),
});

// ── Route definitions ───────────────────────────────────────────────────────

const honoHealthRoute = createRoute({
  method: 'get',
  path: '/api/hono/health',
  tags: ['Infrastructure'],
  summary: 'Hono router health check',
  description: 'Confirms the Hono edge router layer is operational.',
  responses: {
    200: {
      description: 'Hono router is healthy',
      content: { 'application/json': { schema: HealthSchema } },
    },
  },
});

const sseInfoRoute = createRoute({
  method: 'get',
  path: '/api/hono/sse-info',
  tags: ['Streaming'],
  summary: 'SSE endpoint information',
  description: 'Returns available SSE channels and connection details.',
  responses: {
    200: {
      description: 'SSE endpoint metadata',
      content: { 'application/json': { schema: SseInfoSchema } },
    },
  },
});

const apiVersionRoute = createRoute({
  method: 'get',
  path: '/api/hono/api-version',
  tags: ['Infrastructure'],
  summary: 'API version information',
  description: 'Returns the current API version and supported versions with deprecation metadata.',
  responses: {
    200: {
      description: 'API version metadata',
      content: { 'application/json': { schema: ApiVersionSchema } },
    },
  },
});

const openApiSpecRoute = createRoute({
  method: 'get',
  path: '/api/hono/openapi.json',
  tags: ['Infrastructure'],
  summary: 'OpenAPI specification',
  description: 'Auto-generated OpenAPI 3.1 spec from Hono route definitions.',
  responses: {
    200: {
      description: 'OpenAPI JSON specification',
      content: { 'application/json': { schema: z.record(z.unknown()) } },
    },
  },
});

// ── Hono app ────────────────────────────────────────────────────────────────

export function createHonoApp() {
  const app = new OpenAPIHono();

  // Telemetry middleware — record each Hono request
  app.use('*', async (c, next) => {
    const start = Date.now();
    const correlationId = c.req.header('x-correlation-id') ?? c.req.header('x-szl-correlation-id');
    if (correlationId) {
      c.header('x-correlation-id', correlationId);
    }
    await next();
    const durationMs = Date.now() - start;
    logger.debug(
      {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs,
        router: 'hono',
      },
      'Hono request',
    );
  });

  // ── Route implementations ──────────────────────────────────────────────

  app.openapi(honoHealthRoute, (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      router: 'hono' as const,
      version: process.env.npm_package_version ?? '0.0.0',
    });
  });

  app.openapi(sseInfoRoute, (c) => {
    return c.json({
      endpoint: '/api/realtime/stream',
      channels: [
        'alloy-signals',
        'alloy-workflows',
        'vessels-positions',
        'terra-deals',
        'lyte-incidents',
        'guardian-ledger',
        'ai-tokens',
        'platform-metrics',
      ],
      protocol: 'text/event-stream',
      authRequired: true,
    });
  });

  app.openapi(apiVersionRoute, (c) => {
    return c.json({
      current: '2026-04-15',
      supported: ['2025-01-01', '2026-04-15'],
      deprecated: ['2025-01-01'],
    });
  });

  app.openapi(openApiSpecRoute, (c) => {
    const spec = app.getOpenAPIDocument({
      openapi: '3.1.0',
      info: {
        title: 'SZL Platform API — Hono Router',
        version: process.env.npm_package_version ?? '0.0.0',
        description:
          'Edge-ready endpoints powered by Hono, with automatic OpenAPI spec generation. ' +
          'All endpoints here are new capabilities added alongside the Express router. ' +
          'Express continues to serve domain endpoints.',
        contact: { name: 'SZL Platform Team' },
      },
      tags: [
        { name: 'Infrastructure', description: 'Platform health and metadata endpoints' },
        { name: 'Streaming', description: 'SSE and real-time streaming endpoints' },
      ],
    });
    return c.json(spec as Record<string, unknown>);
  });

  // ── OpenAPI doc routes ──────────────────────────────────────────────────
  app.doc('/api/hono/openapi', {
    openapi: '3.1.0',
    info: {
      title: 'SZL Platform API — Hono Router',
      version: process.env.npm_package_version ?? '0.0.0',
    },
  });

  return app;
}

/**
 * Creates an Express-compatible handler for the Hono app.
 * This adapter bridges Express middleware context into Hono and back.
 */
export function createHonoExpressHandler(honoApp: ReturnType<typeof createHonoApp>) {
  return async (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => {
    try {
      const url = `http://localhost${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }

      // Forward auth context set by Express auth middleware
      const user = (req as typeof req & { user?: { id?: number; email?: string } }).user;
      if (user?.id) headers.set('x-user-id', String(user.id));
      if (user?.email) headers.set('x-user-email', user.email);

      // Forward correlation IDs
      const correlationId = (req as typeof req & { correlationId?: string }).correlationId;
      if (correlationId) headers.set('x-correlation-id', correlationId);
      const requestId = (req as typeof req & { requestId?: string }).requestId;
      if (requestId) headers.set('x-request-id', requestId);

      let body: BodyInit | null = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
        if (rawBody) {
          body = rawBody;
        } else if (req.body !== undefined) {
          body = JSON.stringify(req.body);
        }
      }

      const fetchReq = new Request(url, {
        method: req.method,
        headers,
        body,
      });

      const honoRes = await honoApp.fetch(fetchReq);

      if (honoRes.status === 404) {
        // Hono didn't match — pass to next Express handler
        next();
        return;
      }

      res.status(honoRes.status);
      honoRes.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'content-encoding') {
          res.setHeader(key, value);
        }
      });

      const body2 = await honoRes.text();
      res.send(body2);
    } catch (err) {
      next(err);
    }
  };
}
