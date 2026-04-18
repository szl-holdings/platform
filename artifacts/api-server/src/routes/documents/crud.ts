import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID, createHash, createSign, createHmac } from "crypto";
import { logger } from "../../lib/logger";
import { db, documentsTable, documentVersionsTable, documentCommentsTable, documentTemplatesTable, contentLibraryBlocksTable, signaturesTable, pdfJobsTable, pdfBatchesTable } from "@szl-holdings/db";
import { eq, desc, sql, and, or, ne } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, handleRouteError, sendBadRequest, parsePagination } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { renderEntityDataToPdfBuffer, renderDocumentToPdfBuffer } from "../../lib/pdf-renderer";
import type { BlockNode } from "../../lib/pdf-renderer-types";
import { ObjectStorageService, ObjectNotFoundError } from "../../lib/objectStorage";
import { setObjectAclPolicy } from "../../lib/objectAcl";
import { getRequestUserId, canAccessDocument, getUserRole, canMutateDocument, getRequestUserEmail } from "./shared";

interface AuthUser { id: number; role: string; email?: string; displayName?: string }
type ExtendedRequest = Request & { user?: AuthUser }
const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.get("/documents", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const { appSource, status, entityType, entityId } = req.query as Record<string, string>;

    const userId = getRequestUserId(req);
    const role = getUserRole(req);

    const conditions = [];
    if (appSource) conditions.push(eq(documentsTable.appSource, appSource as typeof documentsTable.appSource._.data));
    if (status) conditions.push(eq(documentsTable.status, status as typeof documentsTable.status._.data));
    if (entityType) conditions.push(eq(documentsTable.entityType, entityType));
    if (entityId) conditions.push(eq(documentsTable.entityId, entityId));

    // Scope: admins/editors see all; others see own + demo docs
    if (role !== "admin" && role !== "editor") {
      const scopeCondition = userId !== null
        ? or(eq(documentsTable.isDemo, true), eq(documentsTable.ownerId, userId))!
        : eq(documentsTable.isDemo, true);
      conditions.push(scopeCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db.select().from(documentsTable)
      .where(whereClause)
      .orderBy(desc(documentsTable.updatedAt))
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(documentsTable).where(whereClause);

    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list documents");
  }
});

// NOTE: GET /documents/:id is registered AFTER all literal-segment routes below
// to prevent Express from matching e.g. /documents/templates as :id = "templates".

router.post("/documents", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { title, type, templateId, contentJson, appSource, entityType, entityId, mergeFieldValues } = req.body as {
      title?: string; type?: string; templateId?: string; contentJson?: object;
      appSource?: string; entityType?: string; entityId?: string; mergeFieldValues?: Record<string, string>;
    };

    if (!title) return sendBadRequest(res, "Title is required");

    const ownerId = getRequestUserId(req);

    const [doc] = await db.insert(documentsTable).values({
      title,
      type: (type || "general") as typeof documentsTable.type._.data,
      templateId: templateId || null,
      contentJson: contentJson || {},
      appSource: (appSource || "general") as typeof documentsTable.appSource._.data,
      entityType: entityType || null,
      entityId: entityId || null,
      mergeFieldValues: mergeFieldValues || {},
      ownerId,
      isDemo: false,
    }).returning();

    await db.insert(documentVersionsTable).values({
      documentId: doc.id,
      version: 1,
      contentJson: contentJson || {},
      changeNote: "Initial version",
      savedById: ownerId,
    });

    sendCreated(res, doc);
  } catch (err) {
    handleRouteError(res, err, "Failed to create document");
  }
});

router.put("/documents/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid document ID");

    const [existing] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!existing) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canMutateDocument(userId, role, existing)) {
      return res.status(403).json({ error: "Access denied: you do not have permission to modify this document" });
    }

    const { title, contentJson, status, mergeFieldValues, changeNote } = req.body as {
      title?: string; contentJson?: object; status?: string; mergeFieldValues?: Record<string, string>; changeNote?: string;
    };

    const [updated] = await db.update(documentsTable)
      .set({
        ...(title !== undefined && { title }),
        ...(contentJson !== undefined && { contentJson }),
        ...(status !== undefined && { status: status as typeof documentsTable.status._.data }),
        ...(mergeFieldValues !== undefined && { mergeFieldValues }),
        updatedAt: new Date(),
      })
      .where(eq(documentsTable.id, id))
      .returning();

    if (contentJson !== undefined) {
      const [{ maxVer }] = await db.select({ maxVer: sql<number>`max(version)` }).from(documentVersionsTable).where(eq(documentVersionsTable.documentId, id));
      await db.insert(documentVersionsTable).values({
        documentId: id,
        version: (maxVer || 0) + 1,
        contentJson,
        changeNote: changeNote || "Updated",
        savedById: userId,
      });
    }

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update document");
  }
});

router.delete("/documents/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid document ID");

    const [existing] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!existing) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canMutateDocument(userId, role, existing) && role !== "admin" && role !== "editor") {
      return res.status(403).json({ error: "Access denied" });
    }

    await db.update(documentsTable).set({ status: "archived", updatedAt: new Date() }).where(eq(documentsTable.id, id));
    sendSuccess(res, { archived: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to archive document");
  }
});

// ─── Document Versions ───────────────────────────────────────────────────────

router.get("/documents/:id/versions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid document ID");

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!doc) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canAccessDocument(userId, role, doc)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const versions = await db.select().from(documentVersionsTable)
      .where(eq(documentVersionsTable.documentId, id))
      .orderBy(desc(documentVersionsTable.version));

    sendSuccess(res, versions);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch document versions");
  }
});

router.post("/documents/:id/restore", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const version = parseInt(req.body.version, 10);
    if (isNaN(id) || isNaN(version)) return sendBadRequest(res, "Invalid document ID or version");

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!doc) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canMutateDocument(userId, role, doc)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [ver] = await db.select().from(documentVersionsTable)
      .where(and(eq(documentVersionsTable.documentId, id), eq(documentVersionsTable.version, version)));

    if (!ver) return sendNotFound(res, "Document version");

    const [{ maxVer }] = await db.select({ maxVer: sql<number>`max(version)` }).from(documentVersionsTable).where(eq(documentVersionsTable.documentId, id));

    await db.update(documentsTable).set({ contentJson: ver.contentJson, updatedAt: new Date() }).where(eq(documentsTable.id, id));
    await db.insert(documentVersionsTable).values({
      documentId: id,
      version: (maxVer || 0) + 1,
      contentJson: ver.contentJson,
      changeNote: `Restored from version ${version}`,
      savedById: userId,
    });

    sendSuccess(res, { restored: true, fromVersion: version, newVersion: (maxVer || 0) + 1 });
  } catch (err) {
    handleRouteError(res, err, "Failed to restore document version");
  }
});

// ─── Comments ────────────────────────────────────────────────────────────────

router.post("/documents/:id/comments", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return sendBadRequest(res, "Invalid document ID");

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!doc) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canAccessDocument(userId, role, doc)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { content, sectionRef, authorName } = req.body as { content?: string; sectionRef?: string; authorName?: string };
    if (!content) return sendBadRequest(res, "Comment content is required");

    const displayName = authorName || (req as ExtendedRequest).user?.displayName || "Unknown";

    const [comment] = await db.insert(documentCommentsTable).values({
      documentId: id,
      authorId: userId,
      authorName: displayName,
      sectionRef: sectionRef || null,
      content,
    }).returning();

    sendCreated(res, comment);
  } catch (err) {
    handleRouteError(res, err, "Failed to add comment");
  }
});

router.patch("/documents/comments/:commentId/resolve", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.commentId as string, 10);
    const [comment] = await db.select().from(documentCommentsTable).where(eq(documentCommentsTable.id, commentId));
    if (!comment) return sendNotFound(res, "Comment");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (role !== "admin" && role !== "editor" && comment.authorId !== userId) {
      return res.status(403).json({ error: "Access denied: only the comment author, editors, or admins can resolve comments" });
    }

    const [updated] = await db.update(documentCommentsTable)
      .set({ resolved: true })
      .where(eq(documentCommentsTable.id, commentId))
      .returning();
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve comment");
  }
});

// ─── Templates ───────────────────────────────────────────────────────────────

router.get("/documents/templates", async (req, res) => {
  try {
    const { appSource } = req.query as { appSource?: string };
    const conditions = [eq(documentTemplatesTable.isActive, true)];
    if (appSource) conditions.push(eq(documentTemplatesTable.appSource, appSource as typeof documentTemplatesTable.appSource._.data));

    const templates = await db.select().from(documentTemplatesTable)
      .where(and(...conditions))
      .orderBy(documentTemplatesTable.sortOrder, documentTemplatesTable.title);

    sendSuccess(res, templates);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch templates");
  }
});

router.get("/documents/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const bySlug = isNaN(id);

    const [template] = bySlug
      ? await db.select().from(documentTemplatesTable).where(eq(documentTemplatesTable.slug, req.params.id))
      : await db.select().from(documentTemplatesTable).where(eq(documentTemplatesTable.id, id));

    if (!template) return sendNotFound(res, "Template");
    sendSuccess(res, template);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch template");
  }
});

// ─── Content Library ─────────────────────────────────────────────────────────

router.get("/documents/content-library", async (req, res) => {
  try {
    const { category, appSource } = req.query as { category?: string; appSource?: string };
    const conditions = [eq(contentLibraryBlocksTable.isActive, true)];
    if (category) conditions.push(eq(contentLibraryBlocksTable.category, category as typeof contentLibraryBlocksTable.category._.data));
    if (appSource) conditions.push(eq(contentLibraryBlocksTable.appSource, appSource));

    const blocks = await db.select().from(contentLibraryBlocksTable).where(and(...conditions)).orderBy(contentLibraryBlocksTable.category, contentLibraryBlocksTable.title);
    sendSuccess(res, blocks);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch content library");
  }
});



export function register(r: IRouter): void { r.use(router); }
