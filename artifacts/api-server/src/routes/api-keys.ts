/**
 * API Key CRUD Routes
 *
 * POST   /api-keys           — generate a new key (returns raw key once)
 * GET    /api-keys           — list active keys for the authenticated user/org
 * DELETE /api-keys/:id       — revoke a key
 * POST   /api-keys/:id/rotate — issue new secret, revoke old
 *
 * All routes require an authenticated session.
 */

import { apiKeysTable, db } from '@szl-holdings/db';
import { and, eq, isNull } from 'drizzle-orm';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { sendError } from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../lib/validation';

const router = Router();

/**
 * Session-only guard for API key management.
 *
 * API key CRUD is a privileged browser-session operation. Machine principals
 * (api_key, oauth_client, internal_agent) must not be able to create or revoke
 * keys — that would allow a compromised token to self-escalate privileges.
 */
function requireSessionPrincipal(req: Request, res: Response, next: NextFunction): void {
  const principal = req.meshPrincipal;
  if (!principal || principal.type !== 'session') {
    res.status(403).json({
      error: 'Session authentication required',
      hint: 'API key management is only available to users authenticated via browser session',
    });
    return;
  }
  next();
}

const createKeySchema = z.object({
  name: z.string().min(1).max(200),
  scopes: z.array(z.string().max(100)).optional().default([]),
  orgId: z.number().int().positive().optional(),
  expiresInDays: z.number().int().positive().max(3650).optional(),
});

function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const rawBytes = randomBytes(32).toString('hex');
  const rawKey = `szl_sk_${rawBytes}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = `szl_sk_${rawBytes.slice(0, 8)}`;
  return { rawKey, keyHash, keyPrefix };
}

router.post(
  '/api-keys',
  authMiddleware({ required: true }),
  requireSessionPrincipal,
  async (req: Request, res: Response): Promise<void> => {
    const parse = createKeySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.flatten().fieldErrors });
      return;
    }
    const { name, scopes, orgId, expiresInDays } = parse.data;

    const userId = req.user!.id;
    if (!userId) {
      sendError(res, 'Cannot create API key for an anonymous principal', 403);
      return;
    }

    const { rawKey, keyHash, keyPrefix } = generateApiKey();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    try {
      const [apiKey] = await db
        .insert(apiKeysTable)
        .values({
          userId,
          orgId: orgId ?? null,
          name,
          keyHash,
          keyPrefix,
          scopes,
          isActive: true,
          expiresAt: expiresAt ?? undefined,
        })
        .returning();

      logger.info({ keyId: apiKey!.id, userId, name }, '[api-keys] API key created');

      res.status(201).json({
        id: apiKey!.id,
        name: apiKey!.name,
        key: rawKey,
        keyPrefix: apiKey!.keyPrefix,
        scopes: apiKey!.scopes ?? [],
        orgId: apiKey!.orgId ?? null,
        expiresAt: apiKey!.expiresAt?.toISOString() ?? null,
        createdAt: apiKey!.createdAt.toISOString(),
        _note: 'Store this key securely — it will not be shown again',
      });
    } catch (err) {
      logger.error({ err }, '[api-keys] Failed to create API key');
      sendError(res, 'Failed to create API key', 500);
    }
  },
);

router.get(
  '/api-keys',
  authMiddleware({ required: true }),
  requireSessionPrincipal,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const keys = await db
        .select({
          id: apiKeysTable.id,
          name: apiKeysTable.name,
          keyPrefix: apiKeysTable.keyPrefix,
          scopes: apiKeysTable.scopes,
          orgId: apiKeysTable.orgId,
          isActive: apiKeysTable.isActive,
          lastUsedAt: apiKeysTable.lastUsedAt,
          expiresAt: apiKeysTable.expiresAt,
          createdAt: apiKeysTable.createdAt,
        })
        .from(apiKeysTable)
        .where(
          and(
            eq(apiKeysTable.userId, userId),
            eq(apiKeysTable.isActive, true),
          ),
        );

      res.json({
        keys: keys.map((k) => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          maskedKey: `${k.keyPrefix}••••••••`,
          scopes: k.scopes ?? [],
          orgId: k.orgId ?? null,
          isActive: k.isActive,
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          expiresAt: k.expiresAt?.toISOString() ?? null,
          createdAt: k.createdAt.toISOString(),
        })),
        total: keys.length,
      });
    } catch (err) {
      logger.error({ err }, '[api-keys] Failed to list API keys');
      sendError(res, 'Failed to list API keys', 500);
    }
  },
);

router.delete(
  '/api-keys/:id',
  authMiddleware({ required: true }),
  requireSessionPrincipal,
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id < 1) {
      res.status(400).json({ error: 'Invalid key ID' });
      return;
    }

    try {
      const userId = req.user!.id;
      const [revoked] = await db
        .update(apiKeysTable)
        .set({ isActive: false })
        .where(
          and(
            eq(apiKeysTable.id, id),
            eq(apiKeysTable.userId, userId),
            eq(apiKeysTable.isActive, true),
          ),
        )
        .returning({ id: apiKeysTable.id });

      if (!revoked) {
        res.status(404).json({ error: 'API key not found' });
        return;
      }

      logger.info({ keyId: id, userId }, '[api-keys] API key revoked');
      res.json({ success: true, id });
    } catch (err) {
      logger.error({ err }, '[api-keys] Failed to revoke API key');
      sendError(res, 'Failed to revoke API key', 500);
    }
  },
);

router.post(
  '/api-keys/:id/rotate',
  authMiddleware({ required: true }),
  requireSessionPrincipal,
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id < 1) {
      res.status(400).json({ error: 'Invalid key ID' });
      return;
    }

    try {
      const userId = req.user!.id;

      // Fetch existing key first to copy its metadata
      const [existing] = await db
        .select()
        .from(apiKeysTable)
        .where(
          and(
            eq(apiKeysTable.id, id),
            eq(apiKeysTable.userId, userId),
            eq(apiKeysTable.isActive, true),
          ),
        )
        .limit(1);

      if (!existing) {
        res.status(404).json({ error: 'API key not found' });
        return;
      }

      const { rawKey, keyHash, keyPrefix } = generateApiKey();

      // Revoke old key and insert new key in a transaction
      const [newKey] = await db.transaction(async (tx) => {
        await tx
          .update(apiKeysTable)
          .set({ isActive: false })
          .where(eq(apiKeysTable.id, id));

        return tx
          .insert(apiKeysTable)
          .values({
            userId: existing.userId,
            orgId: existing.orgId ?? undefined,
            name: existing.name,
            keyHash,
            keyPrefix,
            scopes: existing.scopes ?? [],
            isActive: true,
            expiresAt: existing.expiresAt ?? undefined,
          })
          .returning();
      });

      logger.info({ oldKeyId: id, newKeyId: newKey!.id, userId }, '[api-keys] API key rotated');

      res.status(201).json({
        id: newKey!.id,
        name: newKey!.name,
        key: rawKey,
        keyPrefix: newKey!.keyPrefix,
        scopes: newKey!.scopes ?? [],
        orgId: newKey!.orgId ?? null,
        expiresAt: newKey!.expiresAt?.toISOString() ?? null,
        createdAt: newKey!.createdAt.toISOString(),
        rotatedFromId: id,
        _note: 'Store this key securely — it will not be shown again',
      });
    } catch (err) {
      logger.error({ err }, '[api-keys] Failed to rotate API key');
      sendError(res, 'Failed to rotate API key', 500);
    }
  },
);

export default router;
