import { RequestUploadUrlBody, RequestUploadUrlResponse } from '@szl-holdings/api-zod';
import { bodyShape } from '@szl-holdings/contracts/common';
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

      // Resolve org context server-side from the authenticated session.
      // Client-supplied orgId is validated against verified membership — prevents quota bypass.
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

      // Bind resolvedOrgId and domain to the intent — POST /files reads these at finalization
      // to enforce the same org context without trusting any further client input.
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
