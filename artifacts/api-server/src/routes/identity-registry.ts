/**
 * Identity Registry — operator API surface
 *
 * Provides read and admin endpoints for the platform DID registry and
 * key custody service. These are operator-only routes.
 *
 * GET  /identity-registry/dids              — list all platform DIDs
 * GET  /identity-registry/dids/:did         — resolve a single DID
 * POST /identity-registry/dids              — create a new platform DID
 * POST /identity-registry/dids/:did/rotate  — rotate the signing key
 * POST /identity-registry/dids/:did/revoke  — revoke a DID
 * GET  /identity-registry/key-custody       — key custody status panel
 * GET  /identity-registry/audit-summary     — audit chain signature summary
 */

import { Router, type Request, type Response } from 'express';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  listPlatformDids,
  resolvePlatformDid,
  createPlatformDid,
  rotatePlatformDidKey,
  revokePlatformDid,
  type ActorKind,
} from '../lib/platform-did-registry';
import { getKeyCustodyProvider } from '../lib/key-custody';
import { db, auditChainEventsTable } from '@szl-holdings/db';
import { count, isNotNull, isNull } from 'drizzle-orm';
import { logger } from '../lib/logger';

const router = Router();

router.use(authMiddleware());
router.use(requireRole('ops', 'admin'));

router.get('/identity-registry/dids', async (req: Request, res: Response) => {
  try {
    const actorKind = req.query['actorKind'] as ActorKind | undefined;
    const activeOnly = req.query['activeOnly'] !== 'false';
    const limit = Math.min(Number(req.query['limit'] ?? 100), 500);
    const offset = Number(req.query['offset'] ?? 0);

    const dids = await listPlatformDids({ actorKind, activeOnly, limit, offset });
    sendSuccess(res, { dids, total: dids.length, limit, offset });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list platform DIDs');
  }
});

router.get('/identity-registry/dids/:did', async (req: Request, res: Response) => {
  try {
    const did = decodeURIComponent(req.params['did']!);
    const resolution = await resolvePlatformDid(did);
    sendSuccess(res, resolution);
  } catch (err) {
    handleRouteError(res, err, 'Failed to resolve DID');
  }
});

router.post('/identity-registry/dids', async (req: Request, res: Response) => {
  try {
    const { actorKind, displayName, orgId, hint, metadata } = req.body as {
      actorKind: ActorKind;
      displayName: string;
      orgId?: string;
      hint?: string;
      metadata?: Record<string, unknown>;
    };

    if (!actorKind || !displayName) {
      res.status(400).json({ ok: false, error: 'actorKind and displayName are required' });
      return;
    }

    const info = await createPlatformDid({ actorKind, displayName, orgId, hint, metadata });
    sendCreated(res, info);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create platform DID');
  }
});

router.post('/identity-registry/dids/:did/rotate', async (req: Request, res: Response) => {
  try {
    const did = decodeURIComponent(req.params['did']!);
    const reason = (req.body as Record<string, unknown>)?.reason as string | undefined;
    const result = await rotatePlatformDidKey(did, reason);
    logger.info({ did, actor: req.user?.displayName }, '[identity-registry] Key rotated by operator');
    sendSuccess(res, { did, newKeyId: result.keyMeta.keyId, reason });
  } catch (err) {
    handleRouteError(res, err, 'Failed to rotate key');
  }
});

router.post('/identity-registry/dids/:did/revoke', async (req: Request, res: Response) => {
  try {
    const did = decodeURIComponent(req.params['did']!);
    const reason = ((req.body as Record<string, unknown>)?.reason as string) ?? 'operator_revocation';
    await revokePlatformDid(did, reason);
    logger.info({ did, reason, actor: req.user?.displayName }, '[identity-registry] DID revoked by operator');
    sendSuccess(res, { did, revoked: true, reason });
  } catch (err) {
    handleRouteError(res, err, 'Failed to revoke DID');
  }
});

router.get('/identity-registry/key-custody', async (_req: Request, res: Response) => {
  try {
    const backend = process.env.KEY_CUSTODY_BACKEND ?? 'software-encrypted';
    const kekSource = process.env.KEK_SOURCE ?? 'env';
    const kekPresent = !!(process.env.KEK || process.env.SECRET_ENCRYPTION_KEY || process.env.SESSION_SECRET);
    const rollout = process.env.AUDIT_CHAIN_ROLLOUT ?? 'warn';
    const webvhLog = process.env.DID_WEBVH_LOG ?? 'off';

    let platformServiceDid: string | null = null;
    let custodyReachable = false;

    try {
      const custody = getKeyCustodyProvider();
      const { getPlatformServiceDid } = await import('../lib/platform-did-registry.js');
      platformServiceDid = getPlatformServiceDid();
      if (platformServiceDid) {
        const meta = await custody.getActiveKeyMeta(platformServiceDid);
        custodyReachable = !!meta;
      } else {
        custodyReachable = true;
      }
    } catch {
      custodyReachable = false;
    }

    sendSuccess(res, {
      backend,
      kekSource,
      kekPresent,
      custodyReachable,
      platformServiceDid,
      rollout,
      webvhLog,
      schemeVersion: 'hybrid-v1',
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get key custody status');
  }
});

router.get('/identity-registry/audit-summary', async (_req: Request, res: Response) => {
  try {
    const [hybridRow] = await db
      .select({ c: count() })
      .from(auditChainEventsTable)
      .where(isNotNull(auditChainEventsTable.signingDid));

    const [legacyRow] = await db
      .select({ c: count() })
      .from(auditChainEventsTable)
      .where(isNull(auditChainEventsTable.signingDid));

    sendSuccess(res, {
      hybrid_signed: Number(hybridRow?.c ?? 0),
      legacy_unsigned: Number(legacyRow?.c ?? 0),
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get audit summary');
  }
});

export default router;
