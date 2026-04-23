import { bodyShape } from '@szl-holdings/contracts/common';
import { assetsTable, db, filesTable } from '@szl-holdings/db';
import { desc, eq, inArray } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { validateFileType } from '../lib/fileTypeAllowlist';
import { setObjectAclPolicy } from '../lib/objectAcl';
import { ObjectNotFoundError, ObjectStorageService } from '../lib/objectStorage';
import { checkOrgStorageQuota } from '../lib/storageQuota';
import { consumeUploadIntent, peekUploadIntent } from '../lib/uploadIntentStore';
import { validateBody } from '../lib/validation';
import { dispatchVirusScan } from '../lib/virusScan';
import { authMiddleware, parseIdParam } from '../middlewares/auth';
import { assertTenantAccess, getUserOrgIds } from '../middlewares/tenant-scope';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

// MIME types allowed for inline preview (no download forced)
const PREVIEWABLE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'text/plain',
]);

router.get('/files', authMiddleware(), async (req, res) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      sendSuccess(res, []);
      return;
    }
    const files = await db
      .select()
      .from(filesTable)
      .where(orgIds !== null ? inArray(filesTable.orgId, [...orgIds]) : undefined)
      .orderBy(desc(filesTable.createdAt));
    sendSuccess(res, files);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list files');
  }
});

router.get('/files/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [file] = await db.select().from(filesTable).where(eq(filesTable.id, id));
    if (!file) {
      sendNotFound(res, 'File');
      return;
    }
    if (!assertTenantAccess(req, res, file.orgId)) return;
    sendSuccess(res, file);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get file');
  }
});

/**
 * GET /files/:id/preview
 * Serves the file inline in the browser (Content-Disposition: inline).
 *
 * Security:
 * - Requires authentication.
 * - ACL: only the file owner or a privileged role (admin / ops / compliance) may preview.
 * - Scan gating: only scanStatus='clean' files are served.
 *   infected → 403, pending/scanning → 202, error/skipped → 503.
 * - Only PDF and common image formats are rendered inline; others are rejected (415).
 */
router.get('/files/:id/preview', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const [file] = await db.select().from(filesTable).where(eq(filesTable.id, id));
    if (!file) {
      sendNotFound(res, 'File');
      return;
    }

    if (!assertTenantAccess(req, res, file.orgId)) return;

    // ── ACL enforcement ──────────────────────────────────────────────────────
    const authedUser = (req as Request & { user?: { id: number; role: string } }).user;
    const userId = authedUser?.id ?? null;
    const role = authedUser?.role ?? 'viewer';
    const isPrivileged = role === 'admin' || role === 'ops' || role === 'compliance';

    if (!isPrivileged && (userId === null || file.userId !== userId)) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN',
        message: 'You do not have permission to preview this file.',
      });
      return;
    }

    // ── Scan-status gating ───────────────────────────────────────────────────
    if (file.scanStatus === 'infected') {
      res.status(403).json({
        error: 'File is quarantined',
        code: 'FILE_QUARANTINED',
        message: 'This file has been flagged as malicious and cannot be previewed or downloaded.',
        quarantinedAt: file.quarantinedAt,
      });
      return;
    }

    if (file.scanStatus === 'pending' || file.scanStatus === 'scanning') {
      res.status(202).json({
        error: 'Scan pending',
        code: 'SCAN_PENDING',
        message: 'This file is awaiting virus scan. Please try again shortly.',
        scanStatus: file.scanStatus,
      });
      return;
    }

    if (file.scanStatus === 'error' || file.scanStatus === 'skipped') {
      res.status(503).json({
        error: 'Scan incomplete',
        code: 'SCAN_INCOMPLETE',
        message: 'This file could not be scanned and will not be served until scanning completes successfully.',
        scanStatus: file.scanStatus,
      });
      return;
    }

    // At this point only scanStatus='clean' passes through.
    if (file.scanStatus !== 'clean') {
      res.status(503).json({
        error: 'File not available',
        code: 'NOT_CLEAN',
        message: 'This file is not available for preview.',
        scanStatus: file.scanStatus,
      });
      return;
    }

    if (!PREVIEWABLE_MIME_TYPES.has(file.mimeType)) {
      res.status(415).json({
        error: 'Preview not supported',
        code: 'NOT_PREVIEWABLE',
        message: `Inline preview is not supported for ${file.mimeType}. Download the file instead.`,
        mimeType: file.mimeType,
      });
      return;
    }

    let objectFile;
    try {
      objectFile = await objectStorageService.getObjectEntityFile(file.storageKey);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        res.status(404).json({ error: 'File content not found in storage' });
        return;
      }
      throw err;
    }

    const [content] = await objectFile.download();
    const fileBuffer = content as Buffer;

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', String(fileBuffer.length));
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Scan-Status', file.scanStatus);
    res.send(fileBuffer);
  } catch (err) {
    handleRouteError(res, err, 'Failed to preview file');
  }
});

/**
 * POST /files
 * Upload-complete callback: register a file record after a direct GCS upload.
 *
 * Security:
 * - orgId comes from the server-issued upload intent, not client body.
 * - size/mimeType are read from GCS metadata (not client body) to prevent quota/type bypass.
 * - Intent is peeked before expensive GCS calls so a recoverable failure (object not yet ready)
 *   doesn't burn the one-time intent. The intent is consumed only after all validation passes,
 *   and the consumption result is checked — concurrent or stale finalizations are rejected.
 */
router.post(
  '/files',
  authMiddleware(),
  validateBody(
    bodyShape({
      category: z.unknown().optional(),
      objectPath: z.unknown().optional(),
      originalName: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { objectPath, originalName, category } = req.body as {
        objectPath?: string;
        originalName?: string;
        category?: string;
      };

      if (!objectPath) return sendBadRequest(res, 'objectPath is required');
      if (!originalName) return sendBadRequest(res, 'originalName is required');

      const userId = (req as Request & { user?: { id: number } }).user?.id ?? null;
      if (userId === null) return sendBadRequest(res, 'Authenticated user identity is required');

      // Validate intent without consuming — preserves intent if GCS is not ready yet.
      const intent = peekUploadIntent(objectPath, userId);
      if (!intent) {
        res.status(403).json({
          error:
            'Forbidden: no valid upload intent found for this objectPath and user. Request a fresh upload URL and retry.',
        });
        return;
      }

      // Confirm the object exists in GCS before creating a DB record.
      let objectFile;
      try {
        objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      } catch (err) {
        if (err instanceof ObjectNotFoundError) {
          res.status(404).json({
            error: 'Object not found in storage',
            message:
              'The file upload may not have completed. Ensure the PUT to the presigned URL succeeded before calling this endpoint.',
          });
          return;
        }
        throw err;
      }

      // Read authoritative content-type and size from GCS — do not trust client-supplied values.
      const [gcsMetadata] = await objectFile.getMetadata();
      const authoritativeContentType: string =
        (gcsMetadata.contentType as string | undefined) || 'application/octet-stream';
      const authoritativeSize: number = Number(gcsMetadata.size ?? 0);

      // Re-validate using authoritative GCS metadata and the domain bound to the intent.
      const typeCheck = validateFileType(
        authoritativeContentType,
        authoritativeSize,
        intent.domain,
      );
      if (!typeCheck.allowed) {
        req.log.warn(
          { objectPath, authoritativeContentType, authoritativeSize, domain: intent.domain },
          'Upload finalization rejected: authoritative GCS metadata violates allowlist',
        );
        res.status(400).json({
          error: 'File type or size not allowed',
          message: typeCheck.reason,
          domain: intent.domain ?? 'default',
          contentType: authoritativeContentType,
        });
        return;
      }

      // Re-enforce org quota with authoritative GCS size (client-declared size at presign may differ).
      const resolvedOrgId = intent.resolvedOrgId;
      const quotaCheck = await checkOrgStorageQuota(resolvedOrgId, authoritativeSize);
      if (!quotaCheck.allowed) {
        req.log.warn(
          { objectPath, authoritativeSize, resolvedOrgId },
          'Upload finalization rejected: authoritative GCS size exceeds org quota',
        );
        res.status(413).json({
          error: 'Storage quota exceeded',
          message: quotaCheck.reason,
          currentUsageBytes: quotaCheck.currentUsageBytes,
          quotaBytes: quotaCheck.quotaBytes,
          remainingBytes: quotaCheck.remainingBytes,
        });
        return;
      }

      // Consume the intent — authoritative one-time enforcement.
      // If concurrent or stale (already consumed, expired), reject immediately.
      const consumed = consumeUploadIntent(objectPath, userId);
      if (!consumed) {
        res.status(409).json({
          error:
            'Conflict: upload intent was already consumed or has expired. Request a fresh upload URL and retry.',
        });
        return;
      }

      const validCategories = ['document', 'image', 'video', 'audio', 'archive', 'other'] as const;
      type FileCategory = (typeof validCategories)[number];
      const resolvedCategory: FileCategory = validCategories.includes(category as FileCategory)
        ? (category as FileCategory)
        : 'other';

      const filename = objectPath.split('/').pop() || originalName;

      const [file] = await db
        .insert(filesTable)
        .values({
          userId,
          orgId: resolvedOrgId,
          filename,
          originalName,
          mimeType: authoritativeContentType,
          size: authoritativeSize,
          storageUrl: `/api/storage${objectPath}`,
          storageKey: objectPath,
          category: resolvedCategory,
          scanStatus: 'pending',
        })
        .returning();

      // Set ACL: private object owned by the uploading user.
      try {
        await setObjectAclPolicy(objectFile, {
          owner: String(userId),
          visibility: 'private',
        });
      } catch (aclErr) {
        req.log.warn(
          { err: aclErr, objectPath },
          'Failed to set ACL policy — object inaccessible via GET /storage/objects/* until ACL is applied',
        );
      }

      // Run the virus scan (updates the DB record on completion).
      let scanStatus = 'pending';
      let scanThreat: string | undefined;
      try {
        const scanResult = await dispatchVirusScan(file.id, objectPath, authoritativeContentType);
        scanStatus = scanResult.status;
        scanThreat = scanResult.threat;
      } catch (scanErr) {
        req.log.warn({ err: scanErr, fileId: file.id, objectPath }, 'Virus scan dispatch failed');
        scanStatus = 'error';
      }

      sendCreated(res, { ...file, scanStatus, scanThreat: scanThreat ?? null });
    } catch (err) {
      handleRouteError(res, err, 'Failed to register file');
    }
  },
);

/**
 * DELETE /files/:id
 * Soft-delete (remove record) for a file. Does not delete the GCS object.
 */
router.delete(
  '/files/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const authedUser = (req as Request & { user?: { id: number; role: string } }).user;
      const userId = authedUser?.id ?? null;
      const role = authedUser?.role ?? 'viewer';
      const isPrivileged = role === 'admin' || role === 'editor';

      const [file] = await db.select().from(filesTable).where(eq(filesTable.id, id));
      if (!file) {
        sendNotFound(res, 'File');
        return;
      }

      if (!assertTenantAccess(req, res, file.orgId)) return;

      if (!isPrivileged && (userId === null || file.userId !== userId)) {
        res.status(403).json({ error: 'Forbidden: you do not own this file' });
        return;
      }

      await db.delete(filesTable).where(eq(filesTable.id, id));
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete file');
    }
  },
);

router.get('/assets', authMiddleware(), async (req, res) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      sendSuccess(res, []);
      return;
    }
    const assets = await db
      .select({ ...assetsTable })
      .from(assetsTable)
      .leftJoin(filesTable, eq(assetsTable.fileId, filesTable.id))
      .where(orgIds !== null ? inArray(filesTable.orgId, [...orgIds]) : undefined)
      .orderBy(desc(assetsTable.createdAt));
    sendSuccess(res, assets);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list assets');
  }
});

export default router;
