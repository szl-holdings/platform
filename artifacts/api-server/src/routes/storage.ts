import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@szl-holdings/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { ObjectPermission, getObjectAclPolicy } from "../lib/objectAcl";
import { authMiddleware } from "../middlewares/auth";
import { recordUploadIntent } from "../lib/uploadIntentStore";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

interface AuthUser { id: number; role: string; email?: string; displayName?: string }
type AuthRequest = Request & { user?: AuthUser };

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * Requires authentication — only logged-in users may upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 * After upload completes, call POST /api/files to register the file record and set ACL.
 */
router.post("/storage/uploads/request-url", authMiddleware(), async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;
    const userId = ((req as unknown as AuthRequest).user as AuthUser).id;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    // Record server-issued upload intent so POST /api/files can verify ownership
    recordUploadIntent(objectPath, userId);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve private object entities from PRIVATE_OBJECT_DIR.
 * Requires authentication. Access is controlled by the ACL policy stored on the object.
 *
 * ACL rules:
 * - If no ACL policy on the object: only admin/editor roles may access.
 * - If ACL visibility is "public": any authenticated user may access.
 * - If ACL visibility is "private": the owner (matched by userId) OR admin/editor role may access.
 * - If ACL has group rules: checked against the requestedPermission.
 */
router.get("/storage/objects/*path", authMiddleware(), async (req: Request, res: Response) => {
  const authedReq = req as AuthRequest;

  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const userId = authedReq.user?.id;
    const role = authedReq.user?.role ?? "viewer";
    const isPrivileged = role === "admin" || role === "editor";

    const aclPolicy = await getObjectAclPolicy(objectFile);

    if (!aclPolicy) {
      // No ACL policy: deny unless admin/editor (treat as private by default)
      if (!isPrivileged) {
        res.status(403).json({ error: "Forbidden: no access policy on this object" });
        return;
      }
    } else if (aclPolicy.visibility === "public") {
      // Public visibility: any authenticated user can read
    } else {
      // Private: check owner or privileged role
      const ownerId = aclPolicy.owner;
      const isOwner = userId !== undefined && String(userId) === ownerId;
      if (!isOwner && !isPrivileged) {
        // Also check group-based ACL rules
        const canAccess = await objectStorageService.canAccessObjectEntity({
          userId: userId !== undefined ? String(userId) : undefined,
          objectFile,
          requestedPermission: ObjectPermission.READ,
        });
        if (!canAccess) {
          res.status(403).json({ error: "Forbidden: insufficient access to this object" });
          return;
        }
      }
    }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
