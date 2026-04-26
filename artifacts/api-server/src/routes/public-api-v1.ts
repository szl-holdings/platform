/**
 * Public REST API — v1
 *
 * Versioned developer-facing API surface. Authenticated via API key (Bearer
 * token with szl_ prefix). Supports portfolio data queries, briefing retrieval,
 * and event subscriptions.
 *
 * OpenAPI spec is served at /api/v1/openapi.json
 * SDK wraps this surface at packages/szl-sdk.
 *
 * Rate limiting: per-key sliding window (see middleware/public-api-rate-limit.ts)
 * Scopes: portfolio:read, briefings:read, alerts:read, webhooks:manage
 */

import { apiKeysTable, db } from '@szl-holdings/db';
import crypto from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { bodyShape } from '@szl-holdings/contracts/common';
import { eq, and } from 'drizzle-orm';

const router: IRouter = Router();

export const PUBLIC_API_SCOPES = [
  'portfolio:read',
  'briefings:read',
  'alerts:read',
  'matters:read',
  'vessels:read',
  'analytics:read',
  'webhooks:manage',
  'admin:read',
] as const;

export type PublicApiScope = (typeof PUBLIC_API_SCOPES)[number];

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = `szl_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = raw.slice(0, 12);
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { key: raw, hash, prefix };
}

async function resolveApiKey(rawKey: string): Promise<typeof apiKeysTable.$inferSelect | null> {
  if (!rawKey.startsWith('szl_')) return null;
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const [record] = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.keyHash, hash), eq(apiKeysTable.isActive, true)));
  return record ?? null;
}

function apiKeyAuth(requiredScope?: PublicApiScope) {
  return async (req: Request, res: Response, next: () => void) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer szl_')) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Public API requires a Bearer token. Generate one at /api/v1/api-keys.',
      });
      return;
    }

    const rawKey = authHeader.slice(7);
    try {
      const keyRecord = await resolveApiKey(rawKey);
      if (!keyRecord) {
        res.status(401).json({
          error: 'INVALID_API_KEY',
          message: 'The provided API key is invalid or has been revoked.',
        });
        return;
      }

      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        res.status(401).json({ error: 'API_KEY_EXPIRED', message: 'This API key has expired.' });
        return;
      }

      if (requiredScope && keyRecord.scopes && !keyRecord.scopes.includes(requiredScope)) {
        res.status(403).json({
          error: 'INSUFFICIENT_SCOPE',
          message: `This key does not have the '${requiredScope}' scope.`,
          required: requiredScope,
          granted: keyRecord.scopes,
        });
        return;
      }

      await db
        .update(apiKeysTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeysTable.id, keyRecord.id));

      (req as Request & { apiKeyRecord?: typeof keyRecord }).apiKeyRecord = keyRecord;
      next();
    } catch (err) {
      logger.error({ err }, 'API key resolution failed');
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'API key verification failed.' });
    }
  };
}

const createKeySchema = z.object({
  name: z.string().min(1).max(200),
  scopes: z.array(z.enum(PUBLIC_API_SCOPES)).min(1).max(8),
  expiresInDays: z.number().int().min(1).max(730).optional(),
});

router.post(
  '/v1/api-keys',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = createKeySchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    try {
      const { name, scopes, expiresInDays } = parsed.data;
      const { key, hash, prefix } = generateApiKey();

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      const [record] = await db
        .insert(apiKeysTable)
        .values({
          userId: req.user!.id,
          orgId: req.user!.orgId ?? null,
          name,
          keyHash: hash,
          keyPrefix: prefix,
          scopes,
          isActive: true,
          expiresAt,
        })
        .returning();

      logger.info({ userId: req.user!.id, keyId: record.id, scopes }, 'Public API key created');

      sendSuccess(res, {
        id: record.id,
        name: record.name,
        key,
        prefix: record.keyPrefix,
        scopes: record.scopes,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
        warning: 'Store this key securely. It will not be shown again.',
      }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create API key');
    }
  },
);

router.get('/v1/api-keys', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const keys = await db
      .select({
        id: apiKeysTable.id,
        name: apiKeysTable.name,
        prefix: apiKeysTable.keyPrefix,
        scopes: apiKeysTable.scopes,
        isActive: apiKeysTable.isActive,
        lastUsedAt: apiKeysTable.lastUsedAt,
        expiresAt: apiKeysTable.expiresAt,
        createdAt: apiKeysTable.createdAt,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.userId, req.user!.id));

    sendSuccess(res, keys);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list API keys');
  }
});

router.delete('/v1/api-keys/:id', authMiddleware(), validateBody(bodyShape({})), async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    sendBadRequest(res, 'Invalid key ID');
    return;
  }

  try {
    const [key] = await db
      .select()
      .from(apiKeysTable)
      .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, req.user!.id)));

    if (!key) {
      sendNotFound(res, 'API key');
      return;
    }

    await db
      .update(apiKeysTable)
      .set({ isActive: false })
      .where(eq(apiKeysTable.id, id));

    res.status(204).send();
  } catch (err) {
    handleRouteError(res, err, 'Failed to revoke API key');
  }
});

router.post('/v1/api-keys/:id/rotate', authMiddleware(), validateBody(bodyShape({})), async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    sendBadRequest(res, 'Invalid key ID');
    return;
  }

  try {
    const [key] = await db
      .select()
      .from(apiKeysTable)
      .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, req.user!.id)));

    if (!key) {
      sendNotFound(res, 'API key');
      return;
    }

    await db.update(apiKeysTable).set({ isActive: false }).where(eq(apiKeysTable.id, id));

    const { key: newKey, hash, prefix } = generateApiKey();

    const [rotated] = await db
      .insert(apiKeysTable)
      .values({
        userId: key.userId,
        orgId: key.orgId,
        name: `${key.name} (rotated)`,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: key.scopes,
        isActive: true,
        expiresAt: key.expiresAt,
      })
      .returning();

    sendSuccess(res, {
      id: rotated.id,
      name: rotated.name,
      key: newKey,
      prefix: rotated.keyPrefix,
      scopes: rotated.scopes,
      expiresAt: rotated.expiresAt,
      createdAt: rotated.createdAt,
      rotatedFromId: id,
      warning: 'Store this key securely. It will not be shown again.',
    }, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to rotate API key');
  }
});

router.get('/v1/portfolio', apiKeyAuth('portfolio:read'), (_req: Request, res: Response) => {
  sendSuccess(res, {
    summary: 'Portfolio data is available through authenticated API access.',
    note: 'Connect to /api/v1/portfolio/holdings, /api/v1/portfolio/performance, /api/v1/portfolio/allocations',
    version: 'v1',
  });
});

router.get('/v1/briefings', apiKeyAuth('briefings:read'), (_req: Request, res: Response) => {
  sendSuccess(res, {
    note: 'Briefings are available via /api/v1/briefings/latest and /api/v1/briefings/:id',
    version: 'v1',
  });
});

router.get('/v1/alerts', apiKeyAuth('alerts:read'), (_req: Request, res: Response) => {
  sendSuccess(res, {
    note: 'Alerts are available via /api/v1/alerts/active and /api/v1/alerts/history',
    version: 'v1',
  });
});

router.get('/v1/openapi.json', (_req: Request, res: Response) => {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'SZL Holdings Public API',
      version: '1.0.0',
      description:
        'Versioned REST API for SZL Holdings platform. Authenticate with a Bearer token (szl_...).',
      contact: { email: 'api@szlholdings.com' },
      license: { name: 'Proprietary' },
    },
    servers: [{ url: '/api', description: 'SZL Holdings API' }],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'SZL API Key (szl_...)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            prefix: { type: 'string' },
            scopes: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        WebhookEndpoint: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            eventTypes: {
              oneOf: [{ type: 'string', enum: ['*'] }, { type: 'array', items: { type: 'string' } }],
            },
            active: { type: 'boolean' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/v1/api-keys': {
        post: {
          summary: 'Create API key',
          tags: ['API Keys'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'scopes'],
                  properties: {
                    name: { type: 'string', maxLength: 200 },
                    scopes: { type: 'array', items: { type: 'string', enum: PUBLIC_API_SCOPES } },
                    expiresInDays: { type: 'integer', minimum: 1, maximum: 730 },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'API key created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [{ $ref: '#/components/schemas/ApiKey' }, { properties: { key: { type: 'string' }, warning: { type: 'string' } } }],
                  },
                },
              },
            },
          },
        },
        get: {
          summary: 'List API keys',
          tags: ['API Keys'],
          responses: {
            '200': {
              description: 'List of API keys',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } } } },
            },
          },
        },
      },
      '/v1/api-keys/{id}': {
        delete: {
          summary: 'Revoke API key',
          tags: ['API Keys'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Key revoked' } },
        },
      },
      '/v1/api-keys/{id}/rotate': {
        post: {
          summary: 'Rotate API key',
          tags: ['API Keys'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '201': { description: 'New rotated key' } },
        },
      },
      '/v1/portfolio': {
        get: {
          summary: 'Get portfolio summary',
          tags: ['Portfolio'],
          security: [{ BearerAuth: [] }],
          responses: { '200': { description: 'Portfolio summary' } },
        },
      },
      '/v1/briefings': {
        get: {
          summary: 'List briefings',
          tags: ['Briefings'],
          security: [{ BearerAuth: [] }],
          responses: { '200': { description: 'Briefings list' } },
        },
      },
      '/v1/alerts': {
        get: {
          summary: 'List alerts',
          tags: ['Alerts'],
          security: [{ BearerAuth: [] }],
          responses: { '200': { description: 'Alerts list' } },
        },
      },
      '/webhooks': {
        get: {
          summary: 'List webhook endpoints',
          tags: ['Webhooks'],
          security: [{ BearerAuth: [] }],
          responses: { '200': { description: 'Webhook endpoints' } },
        },
        post: {
          summary: 'Create webhook endpoint',
          tags: ['Webhooks'],
          security: [{ BearerAuth: [] }],
          responses: { '201': { description: 'Endpoint created' } },
        },
      },
    },
  };

  res.json(spec);
});

export default router;
