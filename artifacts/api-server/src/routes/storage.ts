import { RequestUploadUrlBody, RequestUploadUrlResponse } from '@szl-holdings/api-zod';
import { bodyShape } from '@szl-holdings/contracts/common';
import { db, filesTable } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { Readable } from 'node:stream';
import { validateFileType } from '../lib/fileTypeAllowlist';
import { getObjectAclPolicy, ObjectPermission } from '../lib/objectAcl';
import { ObjectNotFoundError, ObjectStorageService } from '../lib/objectStorage';
import { checkOrgStorageQuota } from '../lib/storageQuota';
import { recordUploadIntent } from '../lib/uploadIntentStore';
import { validateBody } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

type AuthRequest = Request & { user?: AuthenticatedUser };

/**
 * POST /storage/uploads/request-url
 *
 * Issues a presigned GCS URL for direct client upload. Enforces:
 * - Org membership: if orgId is supplied, it must be in the user's verified session membership.
 *   Defaults to the user's first org if none supplied.
 * - File type allowlist: contentType and size are validated against the domain's allowlist.
 * - Org quota: current org storage usage + requested size must not exceed the org limit.
 *
 * The resolved org context and domain are bound to the upload intent so POST /files can
 * enforce them at finalization without trusting the client again.
 */
router.post(
  '/storage/uploads/request-url',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      const { name, size, contentType, domain, orgId: requestedOrgId } = parsed.data;
      const authedReq = req as AuthRequest;
      const userId = authedReq.user?.id;
      const userOrgs = authedReq.user?.orgs ?? [];

      let resolvedOrgId: number | null = null;

      if (requestedOrgId !== undefined && requestedOrgId !== null) {
        const membership = userOrgs.find((o) => o.orgId === requestedOrgId);
        if (!membership) {
          res.status(403).json({
            error: 'Forbidden',
            message: `You are not a member of org ${requestedOrgId}.`,
          });
          return;
        }
        resolvedOrgId = membership.orgId;
      } else if (userOrgs.length > 0) {
        resolvedOrgId = userOrgs[0].orgId;
      }

      const typeCheck = validateFileType(contentType, size, domain ?? null);
      if (!typeCheck.allowed) {
        res.status(400).json({
          error: 'File type not allowed',
          message: typeCheck.reason,
          domain: domain ?? 'default',
          contentType,
        });
        return;
      }

      const quotaCheck = await checkOrgStorageQuota(resolvedOrgId, size);
      if (!quotaCheck.allowed) {
        res.status(413).json({
          error: 'Storage quota exceeded',
          message: quotaCheck.reason,
          currentUsageBytes: quotaCheck.currentUsageBytes,
          quotaBytes: quotaCheck.quotaBytes,
          remainingBytes: quotaCheck.remainingBytes,
        });
        return;
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      recordUploadIntent(objectPath, userId, resolvedOrgId, domain ?? null);

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

/**
 * GET /storage/public-objects/*
 * Serves assets from PUBLIC_OBJECT_SEARCH_PATHS — unconditionally public, no auth.
 */
router.get('/storage/public-objects/*filePath', async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join('/') : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const response = await objectStorageService.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, 'Error serving public object');
    res.status(500).json({ error: 'Failed to serve public object' });
  }
});

/**
 * GET /storage/objects/*
 * Serves private object entities from PRIVATE_OBJECT_DIR. Requires auth.
 *
 * ACL rules:
 * - No ACL on object: only admin/super_admin/editor may access.
 * - ACL visibility "public": any authenticated user may read.
 * - ACL visibility "private": owner (by userId) or privileged role; group rules checked if neither.
 *
 * Virus scan gating:
 * - Files are only served when their scan_status = 'clean'.
 * - Infected files return 403 Quarantined.
 * - Pending / scanning files return 202 with retry guidance.
 * - Error / skipped scan status returns 503 — file cannot be served until rescanned.
 * - Untracked objects (no filesTable record) are passed through (system-uploaded assets).
 */
router.get('/storage/objects/*path', authMiddleware(), async (req: Request, res: Response) => {
  const authedReq = req as AuthRequest;

  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const userId = authedReq.user?.id;
    const userRoles = authedReq.user?.roles ?? [];
    const isPrivileged = userRoles.some(
      (r) => r === 'admin' || r === 'super_admin' || r === 'editor',
    );

    const aclPolicy = await getObjectAclPolicy(objectFile);

    if (!aclPolicy) {
      if (!isPrivileged) {
        res.status(403).json({ error: 'Forbidden: no access policy on this object' });
        return;
      }
    } else if (aclPolicy.visibility !== 'public') {
      const isOwner = userId !== undefined && String(userId) === aclPolicy.owner;
      if (!isOwner && !isPrivileged) {
        const canAccess = await objectStorageService.canAccessObjectEntity({
          userId: userId !== undefined ? String(userId) : undefined,
          objectFile,
          requestedPermission: ObjectPermission.READ,
        });
        if (!canAccess) {
          res.status(403).json({ error: 'Forbidden: insufficient access to this object' });
          return;
        }
      }
    }

    // ─── Virus scan gating ────────────────────────────────────────────────────
    // Only files with scanStatus = 'clean' are served. All other statuses block
    // the download to prevent distribution of unscanned or malicious content.
    // Untracked objects (no DB record) are passed through — these are system
    // assets uploaded directly to GCS that do not go through the file upload pipeline.
    const [fileRecord] = await db
      .select({
        scanStatus: filesTable.scanStatus,
        quarantinedAt: filesTable.quarantinedAt,
      })
      .from(filesTable)
      .where(eq(filesTable.storageKey, objectPath))
      .limit(1);

    if (fileRecord) {
      if (fileRecord.scanStatus === 'infected') {
        res.status(403).json({
          error: 'File quarantined',
          code: 'FILE_QUARANTINED',
          message:
            'This file has been flagged as malicious and is not available for download. Contact your administrator.',
          quarantinedAt: fileRecord.quarantinedAt,
        });
        return;
      }
      if (fileRecord.scanStatus === 'pending' || fileRecord.scanStatus === 'scanning') {
        res.status(202).json({
          error: 'Scan in progress',
          code: 'SCAN_PENDING',
          message: 'This file is awaiting virus scan. Please try again in a few seconds.',
          scanStatus: fileRecord.scanStatus,
          retryAfterSeconds: 10,
        });
        return;
      }
      if (fileRecord.scanStatus === 'error') {
        res.status(503).json({
          error: 'Scan failed',
          code: 'SCAN_ERROR',
          message:
            'Virus scan failed for this file. It cannot be served until a successful scan completes. Contact your administrator.',
        });
        return;
      }
      if (fileRecord.scanStatus === 'skipped') {
        res.status(503).json({
          error: 'Scan unavailable',
          code: 'SCAN_SKIPPED',
          message:
            'This file could not be scanned and cannot be served. Contact your administrator.',
        });
        return;
      }
      // scanStatus === 'clean' — proceed to serve.
    }

    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, 'Object not found');
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

export default router;
