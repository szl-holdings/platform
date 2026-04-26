/**
 * OAuth 2.0 client_credentials grant + OAuth client management.
 *
 * POST /oauth/token           — exchange client_id:client_secret (Basic auth) for JWT access token
 * GET  /oauth/clients         — list OAuth clients (admin only)
 * POST /oauth/clients         — register a new OAuth client (admin only)
 * DELETE /oauth/clients/:id   — deactivate an OAuth client (admin only)
 */

import { oauthClientsTable, db } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { sendError } from '../lib/api-response';
import { logger } from '../lib/logger';
import { signMeshToken } from '../lib/mesh-jwt';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

function hashClientSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

function generateClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = `szl_cid_${randomBytes(16).toString('hex')}`;
  const clientSecret = `szl_cs_${randomBytes(32).toString('hex')}`;
  return { clientId, clientSecret };
}

/**
 * POST /oauth/token
 *
 * Standard OAuth 2.0 client_credentials grant.
 * Accepts Basic auth (client_id:client_secret) in Authorization header
 * OR client_id/client_secret in the request body.
 */
router.post('/oauth/token', async (req: Request, res: Response): Promise<void> => {
  try {
    const grantType = req.body?.grant_type ?? req.query.grant_type;
    if (grantType !== 'client_credentials') {
      res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only client_credentials grant is supported',
      });
      return;
    }

    let clientId: string | undefined;
    let clientSecret: string | undefined;

    // Try Basic auth first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Basic ')) {
      const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
      const colonIdx = decoded.indexOf(':');
      if (colonIdx > 0) {
        clientId = decoded.slice(0, colonIdx);
        clientSecret = decoded.slice(colonIdx + 1);
      }
    }

    // Fall back to body params
    if (!clientId) clientId = req.body?.client_id as string | undefined;
    if (!clientSecret) clientSecret = req.body?.client_secret as string | undefined;

    if (!clientId || !clientSecret) {
      res.status(401).json({
        error: 'invalid_client',
        error_description: 'client_id and client_secret are required',
      });
      return;
    }

    const secretHash = hashClientSecret(clientSecret);

    const [client] = await db
      .select()
      .from(oauthClientsTable)
      .where(
        and(
          eq(oauthClientsTable.clientId, clientId),
          eq(oauthClientsTable.clientSecretHash, secretHash),
          eq(oauthClientsTable.isActive, true),
        ),
      )
      .limit(1);

    if (!client) {
      res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      });
      return;
    }

    // Scope intersection: only grant scopes the client is allowed to have
    const requestedScopes = typeof req.body?.scope === 'string'
      ? req.body.scope.split(' ').filter(Boolean)
      : [];
    const grantedScopes = requestedScopes.length > 0
      ? requestedScopes.filter((s: string) => client.allowedScopes.includes(s))
      : client.allowedScopes;

    const accessToken = signMeshToken({
      sub: client.clientId,
      name: client.name,
      clientId: client.clientId,
      orgId: client.orgId ?? null,
      scopes: grantedScopes,
      type: 'oauth_client',
    });

    logger.info({ clientId: client.clientId, name: client.name, scopes: grantedScopes }, '[oauth] Access token issued');

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      scope: grantedScopes.join(' '),
    });
  } catch (err) {
    logger.error({ err }, '[oauth] Token endpoint error');
    res.status(500).json({ error: 'server_error', error_description: 'Internal server error' });
  }
});

const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  orgId: z.number().int().positive().optional(),
  allowedScopes: z.array(z.string().max(100)).optional().default([]),
});

/**
 * GET /oauth/clients — list OAuth clients (admin only)
 */
router.get(
  '/oauth/clients',
  authMiddleware({ required: true }),
  requireRole('admin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const clients = await db
        .select({
          id: oauthClientsTable.id,
          clientId: oauthClientsTable.clientId,
          name: oauthClientsTable.name,
          orgId: oauthClientsTable.orgId,
          allowedScopes: oauthClientsTable.allowedScopes,
          isActive: oauthClientsTable.isActive,
          createdAt: oauthClientsTable.createdAt,
        })
        .from(oauthClientsTable);

      res.json({
        clients: clients.map((c) => ({
          id: c.id,
          clientId: c.clientId,
          name: c.name,
          orgId: c.orgId ?? null,
          allowedScopes: c.allowedScopes,
          isActive: c.isActive,
          createdAt: c.createdAt.toISOString(),
        })),
        total: clients.length,
      });
    } catch (err) {
      logger.error({ err }, '[oauth] Failed to list clients');
      sendError(res, 'Failed to list OAuth clients', 500);
    }
  },
);

/**
 * POST /oauth/clients — register a new OAuth client (admin only)
 */
router.post(
  '/oauth/clients',
  authMiddleware({ required: true }),
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    const parse = createClientSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.flatten().fieldErrors });
      return;
    }
    const { name, orgId, allowedScopes } = parse.data;

    try {
      const { clientId, clientSecret } = generateClientCredentials();
      const clientSecretHash = hashClientSecret(clientSecret);

      const [client] = await db
        .insert(oauthClientsTable)
        .values({
          clientId,
          clientSecretHash,
          name,
          orgId: orgId ?? null,
          allowedScopes,
          isActive: true,
        })
        .returning();

      logger.info({ clientId, name }, '[oauth] OAuth client registered');

      res.status(201).json({
        id: client!.id,
        clientId: client!.clientId,
        clientSecret,
        name: client!.name,
        orgId: client!.orgId ?? null,
        allowedScopes: client!.allowedScopes,
        createdAt: client!.createdAt.toISOString(),
        _note: 'Store the client_secret securely — it will not be shown again',
      });
    } catch (err) {
      logger.error({ err }, '[oauth] Failed to register client');
      sendError(res, 'Failed to register OAuth client', 500);
    }
  },
);

/**
 * DELETE /oauth/clients/:id — deactivate an OAuth client (admin only)
 */
router.delete(
  '/oauth/clients/:id',
  authMiddleware({ required: true }),
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id < 1) {
      res.status(400).json({ error: 'Invalid client ID' });
      return;
    }

    try {
      const [deactivated] = await db
        .update(oauthClientsTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(oauthClientsTable.id, id))
        .returning({ id: oauthClientsTable.id });

      if (!deactivated) {
        res.status(404).json({ error: 'OAuth client not found' });
        return;
      }

      logger.info({ clientDbId: id }, '[oauth] OAuth client deactivated');
      res.json({ success: true, id });
    } catch (err) {
      logger.error({ err }, '[oauth] Failed to deactivate client');
      sendError(res, 'Failed to deactivate OAuth client', 500);
    }
  },
);

export default router;
