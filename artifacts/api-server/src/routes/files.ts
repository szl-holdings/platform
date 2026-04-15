import { Router, type IRouter, type Request, type Response } from "express";
import { db, filesTable, assetsTable } from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { ObjectStorageService } from "../lib/objectStorage";
import { setObjectAclPolicy } from "../lib/objectAcl";
import { consumeUploadIntent } from "../lib/uploadIntentStore";

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
 * Register a file record after a presigned URL upload to GCS.
 * The client uploads directly to GCS via the presigned URL, then calls this
 * endpoint to persist the file metadata (objectPath, name, mimeType, size).
 *
 * objectPath: GCS-internal path returned by POST /storage/uploads/request-url
 *   (e.g. "/objects/uploads/<uuid>.ext"). Stored as `storageKey` in filesTable.
 * storageUrl: the HTTP serving endpoint, always "/api/storage" + objectPath
 *   (e.g. "/api/storage/objects/uploads/<uuid>.ext"). Clients should use this URL;
 *   do NOT append objectPath to GET /storage/objects/* directly to avoid double-prefix.
 */
router.post("/files", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { objectPath, originalName, mimeType, size, category, orgId } = req.body as {
      objectPath?: string;
      originalName?: string;
      mimeType?: string;
      size?: number;
      category?: string;
      orgId?: number;
    };

    if (!objectPath) return sendBadRequest(res, "objectPath is required");
    if (!originalName) return sendBadRequest(res, "originalName is required");
    if (!mimeType) return sendBadRequest(res, "mimeType is required");
    if (size === undefined || size === null) return sendBadRequest(res, "size is required");

    const userId = (req as Request & { user?: { id: number } }).user?.id ?? null;

    // Verify this user was issued the upload URL for this objectPath (one-time intent check).
    // This prevents any authenticated user from claiming an objectPath they did not upload.
    if (userId === null) return sendBadRequest(res, "Authenticated user identity is required");
    if (!consumeUploadIntent(objectPath, userId)) {
      res.status(403).json({ error: "Forbidden: no valid upload intent found for this objectPath and user. Request a fresh upload URL and retry." });
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
      orgId: orgId ?? null,
      filename,
      originalName,
      mimeType,
      size,
      storageUrl: `/api/storage${objectPath}`,
      storageKey: objectPath,
      category: resolvedCategory,
    }).returning();

    // Set ACL policy on the GCS object: private, owned by the uploading user.
    // This protects the object so only the owner (or privileged roles) can serve it
    // via GET /api/storage/objects/*.
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await setObjectAclPolicy(objectFile, {
        owner: userId !== null ? String(userId) : "system",
        visibility: "private",
      });
    } catch (aclErr) {
      // ACL set failure is non-fatal: the file record is persisted, but log the error
      req.log.warn({ err: aclErr, objectPath }, "Failed to set ACL policy on uploaded object — access via GET /storage/objects/* will be denied for non-privileged users until ACL is applied");
    }

    sendCreated(res, file);
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

    // Only the file owner or a privileged role (admin/editor) may delete.
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
