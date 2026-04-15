import { Router, type IRouter, type Request, type Response } from "express";
import { db, filesTable, assetsTable } from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { setObjectAclPolicy } from "../lib/objectAcl";
import { peekUploadIntent, consumeUploadIntent } from "../lib/uploadIntentStore";
import { validateFileType } from "../lib/fileTypeAllowlist";
import { checkOrgStorageQuota } from "../lib/storageQuota";
import { dispatchVirusScan } from "../lib/virusScan";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.get("/files", authMiddleware(), async (_req, res) => {
  try {
    const files = await db.select().from(filesTable).orderBy(desc(filesTable.createdAt));
    sendSuccess(res, files);
  } catch (err) {
    handleRouteError(res, err, "Failed to list files");
  }
});

router.get("/files/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [file] = await db.select().from(filesTable).where(eq(filesTable.id, id));
    if (!file) {
      sendNotFound(res, "File");
      return;
    }
    sendSuccess(res, file);
  } catch (err) {
    handleRouteError(res, err, "Failed to get file");
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
router.post("/files", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { objectPath, originalName, category } = req.body as {
      objectPath?: string;
      originalName?: string;
      category?: string;
    };

    if (!objectPath) return sendBadRequest(res, "objectPath is required");
    if (!originalName) return sendBadRequest(res, "originalName is required");

    const userId = (req as Request & { user?: { id: number } }).user?.id ?? null;
    if (userId === null) return sendBadRequest(res, "Authenticated user identity is required");

    // Validate intent without consuming — preserves intent if GCS is not ready yet.
    const intent = peekUploadIntent(objectPath, userId);
    if (!intent) {
      res.status(403).json({ error: "Forbidden: no valid upload intent found for this objectPath and user. Request a fresh upload URL and retry." });
      return;
    }

    // Confirm the object exists in GCS before creating a DB record.
    let objectFile;
    try {
      objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        res.status(404).json({
          error: "Object not found in storage",
          message: "The file upload may not have completed. Ensure the PUT to the presigned URL succeeded before calling this endpoint.",
        });
        return;
      }
      throw err;
    }

    // Read authoritative content-type and size from GCS — do not trust client-supplied values.
    const [gcsMetadata] = await objectFile.getMetadata();
    const authoritativeContentType: string =
      (gcsMetadata.contentType as string | undefined) || "application/octet-stream";
    const authoritativeSize: number = Number(gcsMetadata.size ?? 0);

    // Re-validate using authoritative GCS metadata and the domain bound to the intent.
    const typeCheck = validateFileType(authoritativeContentType, authoritativeSize, intent.domain);
    if (!typeCheck.allowed) {
      req.log.warn({ objectPath, authoritativeContentType, authoritativeSize, domain: intent.domain },
        "Upload finalization rejected: authoritative GCS metadata violates allowlist");
      res.status(400).json({
        error: "File type or size not allowed",
        message: typeCheck.reason,
        domain: intent.domain ?? "default",
        contentType: authoritativeContentType,
      });
      return;
    }

    // Re-enforce org quota with authoritative GCS size (client-declared size at presign may differ).
    const resolvedOrgId = intent.resolvedOrgId;
    const quotaCheck = await checkOrgStorageQuota(resolvedOrgId, authoritativeSize);
    if (!quotaCheck.allowed) {
      req.log.warn({ objectPath, authoritativeSize, resolvedOrgId },
        "Upload finalization rejected: authoritative GCS size exceeds org quota");
      res.status(413).json({
        error: "Storage quota exceeded",
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
      res.status(409).json({ error: "Conflict: upload intent was already consumed or has expired. Request a fresh upload URL and retry." });
      return;
    }

    const validCategories = ["document", "image", "video", "audio", "archive", "other"] as const;
    type FileCategory = (typeof validCategories)[number];
    const resolvedCategory: FileCategory = validCategories.includes(category as FileCategory)
      ? (category as FileCategory)
      : "other";

    const filename = objectPath.split("/").pop() || originalName;

    const [file] = await db.insert(filesTable).values({
      userId,
      orgId: resolvedOrgId,
      filename,
      originalName,
      mimeType: authoritativeContentType,
      size: authoritativeSize,
      storageUrl: `/api/storage${objectPath}`,
      storageKey: objectPath,
      category: resolvedCategory,
    }).returning();

    // Set ACL: private object owned by the uploading user.
    try {
      await setObjectAclPolicy(objectFile, {
        owner: String(userId),
        visibility: "private",
      });
    } catch (aclErr) {
      req.log.warn({ err: aclErr, objectPath },
        "Failed to set ACL policy — object inaccessible via GET /storage/objects/* until ACL is applied");
    }

    // Dispatch virus scan stub (noop until AV integration is configured).
    let scanStatus = "pending";
    try {
      const scanResult = await dispatchVirusScan(file.id, objectPath);
      scanStatus = scanResult.status;
    } catch (scanErr) {
      req.log.warn({ err: scanErr, fileId: file.id, objectPath }, "Virus scan dispatch failed");
      scanStatus = "error";
    }

    sendCreated(res, { ...file, scanStatus });
  } catch (err) {
    handleRouteError(res, err, "Failed to register file");
  }
});

/**
 * DELETE /files/:id
 * Soft-delete (remove record) for a file. Does not delete the GCS object.
 */
router.delete("/files/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseIdParam(req.params.id);
    const authedUser = (req as Request & { user?: { id: number; role: string } }).user;
    const userId = authedUser?.id ?? null;
    const role = authedUser?.role ?? "viewer";
    const isPrivileged = role === "admin" || role === "editor";

    const [file] = await db.select().from(filesTable).where(eq(filesTable.id, id));
    if (!file) {
      sendNotFound(res, "File");
      return;
    }

    if (!isPrivileged && (userId === null || file.userId !== userId)) {
      res.status(403).json({ error: "Forbidden: you do not own this file" });
      return;
    }

    await db.delete(filesTable).where(eq(filesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete file");
  }
});

router.get("/assets", authMiddleware(), async (_req, res) => {
  try {
    const assets = await db.select().from(assetsTable).orderBy(desc(assetsTable.createdAt));
    sendSuccess(res, assets);
  } catch (err) {
    handleRouteError(res, err, "Failed to list assets");
  }
});

export default router;
