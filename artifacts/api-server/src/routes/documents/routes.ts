import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID, createHash, createSign, createHmac } from "crypto";
import { logger } from "../../lib/logger";

interface AuthUser { id: number; role: string; email?: string; displayName?: string }
type ExtendedRequest = Request & { user?: AuthUser }
import { db, documentsTable, documentVersionsTable, documentCommentsTable, documentTemplatesTable, contentLibraryBlocksTable, signaturesTable, pdfJobsTable, pdfBatchesTable } from "@szl-holdings/db";
import { eq, desc, sql, and, or, ne } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, handleRouteError, sendBadRequest, parsePagination } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { renderEntityDataToPdfBuffer, renderDocumentToPdfBuffer } from "../../lib/pdf-renderer";
import type { BlockNode } from "../../lib/pdf-renderer-types";
import { ObjectStorageService, ObjectNotFoundError } from "../../lib/objectStorage";
import { setObjectAclPolicy } from "../../lib/objectAcl";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

// ─── Access control helpers ───────────────────────────────────────────────────

function getRequestUserId(req: Request): number | null {
  return (req as ExtendedRequest).user?.id ?? null;
}

function getUserRole(req: Request): string {
  return (req as ExtendedRequest).user?.role ?? "viewer";
}

function getRequestUserEmail(req: Request): string | null {
  return (req as ExtendedRequest).user?.email ?? null;
}

/**
 * Check if the authenticated user can access a document.
 * Admins and editors can access any document.
 * Other users can only access their own documents or demo documents.
 */
function canAccessDocument(userId: number | null, role: string, doc: typeof documentsTable.$inferSelect): boolean {
  if (role === "admin" || role === "editor") return true;
  if (doc.isDemo) return true;
  if (userId !== null && doc.ownerId === userId) return true;
  return false;
}

/**
 * Check if the authenticated user can mutate (write/delete) a document.
 * Admins can mutate any. Editors can mutate any non-demo. Others can only mutate their own.
 */
function canMutateDocument(userId: number | null, role: string, doc: typeof documentsTable.$inferSelect): boolean {
  if (role === "admin") return true;
  if (doc.isDemo) return false;
  if (role === "editor") return true;
  if (userId !== null && doc.ownerId === userId) return true;
  return false;
}

// ─── Document CRUD ───────────────────────────────────────────────────────────

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

// ─── E-Signatures ────────────────────────────────────────────────────────────

router.post("/documents/:id/sign", authMiddleware(), async (req: Request, res: Response) => {
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

    const { signers } = req.body as { signers?: Array<{ email: string; name: string; order?: number }> };
    if (!signers || signers.length === 0) return sendBadRequest(res, "At least one signer is required");
    if (signers.length > 5) return sendBadRequest(res, "Maximum 5 signers allowed");

    // Remove any existing pending sigs
    await db.update(signaturesTable)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(signaturesTable.documentId, id), eq(signaturesTable.status, "pending")));

    const signerRecords = await Promise.all(signers.map(async (s, i) => {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const [record] = await db.insert(signaturesTable).values({
        documentId: id,
        signerEmail: s.email,
        signerName: s.name,
        signingOrder: s.order ?? i + 1,
        signingToken: token,
        expiresAt,
        status: "pending",
      }).returning();
      return record;
    }));

    await db.update(documentsTable).set({ status: "review", updatedAt: new Date() }).where(eq(documentsTable.id, id));

    sendCreated(res, { signers: signerRecords });
  } catch (err) {
    handleRouteError(res, err, "Failed to create signature request");
  }
});

router.get("/documents/sign/:token", async (req, res) => {
  try {
    const { token } = req.params as Record<string, string>;
    const [sig] = await db.select().from(signaturesTable).where(eq(signaturesTable.signingToken, token));
    if (!sig) return sendNotFound(res, "Signing request");

    if (sig.status === "expired" || (sig.expiresAt && sig.expiresAt < new Date())) {
      await db.update(signaturesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(signaturesTable.id, sig.id));
      return sendBadRequest(res, "Signing link has expired");
    }

    // Enforce signing order: check that all prior-order signers have completed
    const allSigs = await db.select().from(signaturesTable)
      .where(eq(signaturesTable.documentId, sig.documentId))
      .orderBy(signaturesTable.signingOrder);

    const priorUnsigned = allSigs.filter(s =>
      s.signingOrder < sig.signingOrder && s.status !== "signed"
    );

    if (priorUnsigned.length > 0) {
      return sendBadRequest(res, `Signing order enforced: ${priorUnsigned.length} prior signer(s) must sign first`);
    }

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, sig.documentId));
    if (!doc) return sendNotFound(res, "Document");

    if (sig.status === "pending") {
      await db.update(signaturesTable).set({ status: "viewed", viewedAt: new Date(), updatedAt: new Date() }).where(eq(signaturesTable.id, sig.id));
    }

    sendSuccess(res, { signature: { ...sig, status: sig.status === "pending" ? "viewed" : sig.status }, document: { id: doc.id, title: doc.title, type: doc.type, appSource: doc.appSource } });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch signing request");
  }
});

router.post("/documents/sign/:token/submit", async (req: Request, res: Response) => {
  try {
    const { token } = req.params as Record<string, string>;
    const [sig] = await db.select().from(signaturesTable).where(eq(signaturesTable.signingToken, token));
    if (!sig) return sendNotFound(res, "Signing request");

    if (sig.status === "signed") return sendBadRequest(res, "Document already signed by this signer");
    if (sig.status === "declined") return sendBadRequest(res, "This signing request was declined");
    if (sig.expiresAt && sig.expiresAt < new Date()) {
      await db.update(signaturesTable).set({ status: "expired", updatedAt: new Date() }).where(eq(signaturesTable.id, sig.id));
      return sendBadRequest(res, "Signing link has expired");
    }

    // Enforce signing order before accepting submission
    const allSigs = await db.select().from(signaturesTable)
      .where(eq(signaturesTable.documentId, sig.documentId))
      .orderBy(signaturesTable.signingOrder);

    const priorUnsigned = allSigs.filter(s =>
      s.signingOrder < sig.signingOrder && s.status !== "signed"
    );

    if (priorUnsigned.length > 0) {
      return sendBadRequest(res, `Signing order enforced: ${priorUnsigned.length} prior signer(s) must complete signing first`);
    }

    const { signatureData, signatureType, consentGiven, browserFingerprint } = req.body as {
      signatureData?: string; signatureType?: "typed" | "drawn" | "uploaded"; consentGiven?: boolean; browserFingerprint?: string;
    };

    if (!signatureData || !signatureType) return sendBadRequest(res, "Signature data and type are required");
    if (!["typed", "drawn", "uploaded"].includes(signatureType)) return sendBadRequest(res, "Invalid signature type");
    if (!consentGiven) return sendBadRequest(res, "Consent must be given before signing");

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";

    // Build audit hash: document ID + signer email + signature type + timestamp + signature content hash + browser fingerprint
    const signatureContentHash = createHash("sha256").update(signatureData).digest("hex");
    const fpHash = browserFingerprint ? createHash("sha256").update(browserFingerprint).digest("hex") : "no-fp";
    const auditHash = createHash("sha256")
      .update(`${sig.documentId}:${sig.signerEmail}:${signatureType}:${signatureContentHash}:${fpHash}:${Date.now()}`)
      .digest("hex");

    const signedAt = new Date();
    const [updated] = await db.update(signaturesTable).set({
      status: "signed",
      signatureData,
      signatureType,
      signedAt,
      ipAddress: ip,
      userAgent: req.headers["user-agent"] || null,
      browserFingerprint: browserFingerprint || null,
      consentGiven: true,
      auditHash,
      updatedAt: new Date(),
    }).where(eq(signaturesTable.id, sig.id)).returning();

    // Refresh to check completion
    const refreshedSigs = await db.select().from(signaturesTable).where(eq(signaturesTable.documentId, sig.documentId));
    const allSigned = refreshedSigs.every(s => s.status === "signed");
    if (allSigned) {
      await db.update(documentsTable).set({ status: "signed", updatedAt: new Date() }).where(eq(documentsTable.id, sig.documentId));
    }

    sendSuccess(res, {
      success: true,
      auditHash,
      signedAt: updated.signedAt,
      signatureType: updated.signatureType,
      allPartiesSigned: allSigned,
      remainingSigners: refreshedSigs.filter(s => s.status !== "signed" && s.status !== "declined").length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to submit signature");
  }
});

// Self-hosted embedded signing: authenticated signer submits signature image directly.
// Authorization: Only the specific named signer (matched by email) or an admin/editor may submit.
router.post("/documents/:id/sign/:sigId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id as string, 10);
    const sigId = parseInt(req.params.sigId as string, 10);
    if (isNaN(docId) || isNaN(sigId)) return sendBadRequest(res, "Invalid document or signature ID");

    const [sig] = await db.select().from(signaturesTable)
      .where(and(eq(signaturesTable.id, sigId), eq(signaturesTable.documentId, docId)));
    if (!sig) return sendNotFound(res, "Signature request");

    // Identity check: the authenticated user's email must match the signer's email,
    // OR the user must be an admin/editor who may act on behalf of signers.
    const callerEmail = getRequestUserEmail(req);
    const callerRole = getUserRole(req);
    const isPrivileged = callerRole === "admin" || callerRole === "editor";
    if (!isPrivileged && callerEmail !== sig.signerEmail) {
      return res.status(403).json({ error: "You are not authorised to sign on behalf of this signer" });
    }

    if (sig.status === "signed") return sendBadRequest(res, "Already signed");
    if (sig.status === "declined") return sendBadRequest(res, "Signing request was declined");
    if (sig.expiresAt && sig.expiresAt < new Date()) return sendBadRequest(res, "Signing request has expired");

    const { signatureImage, browserFingerprint } = req.body as { signatureImage?: string; browserFingerprint?: string };
    if (!signatureImage) return sendBadRequest(res, "signatureImage is required");

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";

    // Fetch the document content and hash it so the audit trail captures what was signed
    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, docId));
    const documentContentHash = doc
      ? createHash("sha256").update(JSON.stringify(doc.contentJson)).digest("hex")
      : "no-content";

    const signatureContentHash = createHash("sha256").update(signatureImage).digest("hex");
    const fpHash = browserFingerprint ? createHash("sha256").update(browserFingerprint).digest("hex") : "no-fp";
    const auditHash = createHash("sha256")
      .update(`${docId}:${sig.signerEmail}:embedded:${signatureContentHash}:${documentContentHash}:${fpHash}:${Date.now()}`)
      .digest("hex");

    const signedAt = new Date();
    const [updated] = await db.update(signaturesTable).set({
      status: "signed",
      signatureData: signatureImage,
      signatureType: "drawn",
      signedAt,
      ipAddress: ip,
      userAgent: req.headers["user-agent"] || null,
      browserFingerprint: browserFingerprint || null,
      consentGiven: true,
      auditHash,
      updatedAt: new Date(),
    }).where(eq(signaturesTable.id, sigId)).returning();

    const allSigs = await db.select().from(signaturesTable).where(eq(signaturesTable.documentId, docId));
    const allSigned = allSigs.every((s) => s.status === "signed");
    if (allSigned) {
      await db.update(documentsTable).set({ status: "signed", updatedAt: new Date() }).where(eq(documentsTable.id, docId));
    }

    sendSuccess(res, {
      success: true,
      signedAt: updated.signedAt,
      auditHash,
      documentContentHash,
      allPartiesSigned: allSigned,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to record self-hosted signature");
  }
});

// Decline a signature request by sigId (authenticated).
// Authorization: only the named signer or an admin/editor may decline.
router.post("/documents/:id/signatures/:sigId/decline", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id as string, 10);
    const sigId = parseInt(req.params.sigId as string, 10);
    if (isNaN(docId) || isNaN(sigId)) return sendBadRequest(res, "Invalid IDs");

    const [sig] = await db.select().from(signaturesTable)
      .where(and(eq(signaturesTable.id, sigId), eq(signaturesTable.documentId, docId)));
    if (!sig) return sendNotFound(res, "Signature request");

    // Identity check: caller must be the named signer or an admin/editor
    const callerEmail = getRequestUserEmail(req);
    const callerRole = getUserRole(req);
    const isPrivileged = callerRole === "admin" || callerRole === "editor";
    if (!isPrivileged && callerEmail !== sig.signerEmail) {
      return res.status(403).json({ error: "You are not authorised to decline on behalf of this signer" });
    }

    if (sig.status === "signed") return sendBadRequest(res, "Cannot decline: already signed");
    if (sig.status === "declined") return sendBadRequest(res, "Already declined");

    await db.update(signaturesTable).set({
      status: "declined",
      declinedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(signaturesTable.id, sigId));

    sendSuccess(res, { declined: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to decline signature");
  }
});

router.post("/documents/sign/:token/decline", async (req: Request, res: Response) => {
  try {
    const { token } = req.params as Record<string, string>;
    const { reason } = req.body as { reason?: string };

    const [sig] = await db.select().from(signaturesTable).where(eq(signaturesTable.signingToken, token));
    if (!sig) return sendNotFound(res, "Signing request");

    if (sig.status === "signed") return sendBadRequest(res, "Cannot decline: document already signed");
    if (sig.status === "declined") return sendBadRequest(res, "Signing request already declined");

    await db.update(signaturesTable).set({
      status: "declined",
      declinedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(signaturesTable.id, sig.id));

    sendSuccess(res, { declined: true, reason: reason || null });
  } catch (err) {
    handleRouteError(res, err, "Failed to decline signing");
  }
});

router.get("/documents/:id/signatures", authMiddleware(), async (req: Request, res: Response) => {
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

    const sigs = await db.select().from(signaturesTable)
      .where(eq(signaturesTable.documentId, id))
      .orderBy(signaturesTable.signingOrder);

    sendSuccess(res, sigs);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch signatures");
  }
});

router.post("/documents/:id/signatures/:sigId/remind", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id as string, 10);
    const sigId = parseInt(req.params.sigId as string, 10);

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, docId));
    if (!doc) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canAccessDocument(userId, role, doc)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Enforce that sigId belongs to this document (prevents cross-document IDOR)
    const [sig] = await db.select().from(signaturesTable)
      .where(and(eq(signaturesTable.id, sigId), eq(signaturesTable.documentId, docId)));
    if (!sig) return sendNotFound(res, "Signature");

    await db.update(signaturesTable).set({ reminderSentAt: new Date(), updatedAt: new Date() }).where(and(eq(signaturesTable.id, sigId), eq(signaturesTable.documentId, docId)));
    sendSuccess(res, { reminderSent: true, to: sig.signerEmail });
  } catch (err) {
    handleRouteError(res, err, "Failed to send reminder");
  }
});

// ─── Batch PDF Generation ─────────────────────────────────────────────────────
// PDF generation uses server-side HTML serialization of the document content.
// Jobs are processed in a Node.js async queue using a lightweight HTML template
// renderer. Output URLs point to the API's PDF download endpoint.
// Object storage integration can be added by replacing the outputUrl with a
// presigned URL from S3/GCS/Replit Object Storage.

router.post("/documents/batch-pdf", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { title, templateId, appSource, items } = req.body as {
      title?: string; templateId?: string; appSource?: string;
      items?: Array<{ entityType: string; entityId: string; entityData?: Record<string, unknown> }>;
    };

    if (!templateId) return sendBadRequest(res, "templateId is required");
    if (!items || items.length === 0) return sendBadRequest(res, "At least one item is required");
    if (items.length > 100) return sendBadRequest(res, "Maximum 100 items per batch");

    const batchId = randomUUID();
    const requestedById = getRequestUserId(req);

    const [batch] = await db.insert(pdfBatchesTable).values({
      batchId,
      title: title || `Batch PDF — ${new Date().toLocaleDateString()}`,
      templateId,
      appSource: (appSource || "general") as typeof pdfBatchesTable.appSource._.data,
      totalJobs: items.length,
      requestedById,
    }).returning();

    const jobs = await Promise.all(items.map(item =>
      db.insert(pdfJobsTable).values({
        batchId,
        templateId,
        entityType: item.entityType,
        entityId: item.entityId,
        entityData: item.entityData || {},
        appSource: (appSource || "general") as typeof pdfJobsTable.appSource._.data,
        requestedById,
      }).returning().then(([j]) => j)
    ));

    processBatchAsync(batchId, jobs).catch(err => {
      logger.error({ err, batchId }, "[pdf-batch] Batch processing failed");
    });

    sendCreated(res, { batchId, batch, jobs });
  } catch (err) {
    handleRouteError(res, err, "Failed to queue batch PDF");
  }
});

router.get("/documents/batch-pdf/:batchId", authMiddleware(), async (req, res) => {
  try {
    const { batchId } = req.params as Record<string, string>;
    const [batch] = await db.select().from(pdfBatchesTable).where(eq(pdfBatchesTable.batchId, batchId));
    if (!batch) return sendNotFound(res, "Batch");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (role !== "admin" && role !== "editor" && batch.requestedById !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const jobs = await db.select().from(pdfJobsTable).where(eq(pdfJobsTable.batchId, batchId)).orderBy(pdfJobsTable.createdAt);
    sendSuccess(res, { batch, jobs });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch batch status");
  }
});

router.get("/documents/batch-pdf", authMiddleware(), async (req, res) => {
  try {
    const { appSource } = req.query as { appSource?: string };
    const userId = getRequestUserId(req);
    const role = getUserRole(req);

    const conditions = [];
    if (appSource) conditions.push(eq(pdfBatchesTable.appSource, appSource as typeof pdfBatchesTable.appSource._.data));

    // Non-admins only see their own batches
    if (role !== "admin" && role !== "editor" && userId !== null) {
      conditions.push(eq(pdfBatchesTable.requestedById, userId));
    }

    const batches = await db.select().from(pdfBatchesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(pdfBatchesTable.createdAt))
      .limit(50);
    sendSuccess(res, batches);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch batches");
  }
});

router.post("/documents/batch-pdf/:batchId/cancel", authMiddleware(), async (req, res) => {
  try {
    const { batchId } = req.params as Record<string, string>;
    const [batch] = await db.select().from(pdfBatchesTable).where(eq(pdfBatchesTable.batchId, batchId));
    if (!batch) return sendNotFound(res, "Batch");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (role !== "admin" && role !== "editor" && batch.requestedById !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db.update(pdfJobsTable).set({ status: "cancelled" }).where(and(eq(pdfJobsTable.batchId, batchId), eq(pdfJobsTable.status, "pending")));
    await db.update(pdfBatchesTable).set({ status: "cancelled", updatedAt: new Date() }).where(eq(pdfBatchesTable.batchId, batchId));
    sendSuccess(res, { cancelled: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to cancel batch");
  }
});

router.post("/documents/pdf-jobs/:jobId/retry", authMiddleware(), async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId as string, 10);
    const [job] = await db.select().from(pdfJobsTable).where(eq(pdfJobsTable.id, jobId));
    if (!job) return sendNotFound(res, "PDF job");
    if (job.status !== "failed") return sendBadRequest(res, "Only failed jobs can be retried");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (role !== "admin" && role !== "editor" && job.requestedById !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db.update(pdfJobsTable).set({ status: "pending", error: null, startedAt: null, completedAt: null }).where(eq(pdfJobsTable.id, jobId));

    processJobAsync(job).catch(err => {
      logger.error({ err, jobId }, "[pdf-batch] Job retry failed");
    });
    sendSuccess(res, { retried: true, jobId });
  } catch (err) {
    handleRouteError(res, err, "Failed to retry job");
  }
});

// ─── Signing Status Dashboard ─────────────────────────────────────────────────

router.get("/documents/signing-dashboard", authMiddleware(), async (req, res) => {
  try {
    const { appSource } = req.query as { appSource?: string };
    const userId = getRequestUserId(req);
    const role = getUserRole(req);

    const docConditions = [];
    if (appSource) docConditions.push(eq(documentsTable.appSource, appSource as typeof documentsTable.appSource._.data));

    // Scope non-admin/editor users to their own documents
    if (role !== "admin" && role !== "editor" && userId !== null) {
      docConditions.push(
        or(eq(documentsTable.isDemo, true), eq(documentsTable.ownerId, userId))!
      );
    }

    const pendingSigs = await db.select({
      sigId: signaturesTable.id,
      documentId: signaturesTable.documentId,
      signerEmail: signaturesTable.signerEmail,
      signerName: signaturesTable.signerName,
      status: signaturesTable.status,
      signingOrder: signaturesTable.signingOrder,
      createdAt: signaturesTable.createdAt,
      expiresAt: signaturesTable.expiresAt,
      reminderSentAt: signaturesTable.reminderSentAt,
      docTitle: documentsTable.title,
      docType: documentsTable.type,
      docAppSource: documentsTable.appSource,
    })
    .from(signaturesTable)
    .innerJoin(documentsTable, eq(signaturesTable.documentId, documentsTable.id))
    .where(docConditions.length > 0 ? and(...docConditions) : undefined)
    .orderBy(desc(signaturesTable.createdAt))
    .limit(100);

    const stats = {
      pending: pendingSigs.filter(s => s.status === "pending").length,
      viewed: pendingSigs.filter(s => s.status === "viewed").length,
      signed: pendingSigs.filter(s => s.status === "signed").length,
      declined: pendingSigs.filter(s => s.status === "declined").length,
      expired: pendingSigs.filter(s => s.status === "expired").length,
    };

    sendSuccess(res, { stats, signatures: pendingSigs });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch signing dashboard");
  }
});

// ─── GET /documents/:id — registered AFTER all literal-segment GET routes ─────
// Express matches routes in registration order; keeping this after
// /documents/templates, /documents/content-library, /documents/batch-pdf, and
// /documents/signing-dashboard prevents those literal paths from being shadowed.

router.get("/documents/:id", authMiddleware(), async (req: Request, res: Response) => {
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

    const signatures = await db.select().from(signaturesTable)
      .where(eq(signaturesTable.documentId, id)).orderBy(signaturesTable.signingOrder);
    const comments = await db.select().from(documentCommentsTable)
      .where(eq(documentCommentsTable.documentId, id)).orderBy(desc(documentCommentsTable.createdAt));
    const versions = await db.select({
      id: documentVersionsTable.id,
      version: documentVersionsTable.version,
      changeNote: documentVersionsTable.changeNote,
      savedById: documentVersionsTable.savedById,
      createdAt: documentVersionsTable.createdAt,
    }).from(documentVersionsTable)
      .where(eq(documentVersionsTable.documentId, id)).orderBy(desc(documentVersionsTable.version));

    sendSuccess(res, { ...doc, signatures, comments, versions });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch document");
  }
});

// ─── PDF Processing Pipeline ──────────────────────────────────────────────────
// Uses @react-pdf/renderer for real server-side PDF generation.
// PDFs are stored as base64 in entityData._pdfBase64 and served as
// application/pdf from the /pdf-output endpoint.

async function processJobAsync(job: typeof pdfJobsTable.$inferSelect) {
  // Re-read job status before processing to respect cancellation
  const [current] = await db.select().from(pdfJobsTable).where(eq(pdfJobsTable.id, job.id));
  if (!current || current.status === "cancelled" || current.status === "completed") return;

  // Also check if the parent batch has been cancelled
  const [batch] = await db.select().from(pdfBatchesTable).where(eq(pdfBatchesTable.batchId, job.batchId));
  if (batch?.status === "cancelled") return;

  const startedAt = new Date();
  await db.update(pdfJobsTable).set({ status: "processing", startedAt }).where(eq(pdfJobsTable.id, job.id));

  try {
    const entityData = (job.entityData || {}) as Record<string, unknown>;
    const title = (entityData.title as string) || `${job.entityType} — ${job.entityId}`;

    const pdfBuffer = await renderEntityDataToPdfBuffer({
      title,
      templateId: job.templateId,
      entityType: job.entityType,
      entityId: job.entityId,
      entityData,
      appSource: job.appSource,
    });

    const outputFilename = `doc-${job.templateId}-${job.entityId}-${job.id}.pdf`;

    // outputUrl always points to the auth-gated pdf-output endpoint.
    // _storageKey in entityData tells that endpoint where to read the PDF bytes (GCS vs base64).
    const outputUrl = `/api/documents/pdf-output/${outputFilename}`;
    let storageKey: string | undefined;

    // Try to upload PDF to object storage; fall back to base64 in DB if storage unavailable
    try {
      const subPath = `pdfs/${outputFilename}`;
      storageKey = await objectStorageService.uploadBuffer(pdfBuffer, subPath, "application/pdf");

      // Set ACL policy on the uploaded PDF object: private, owned by the requesting user.
      try {
        const pdfObjectFile = await objectStorageService.getObjectEntityFile(storageKey);
        await setObjectAclPolicy(pdfObjectFile, {
          owner: job.requestedById !== null ? String(job.requestedById) : "system",
          visibility: "private",
        });
      } catch (aclErr) {
        logger.warn({ err: aclErr }, "[pdf-batch] Failed to set ACL on PDF object");
      }
    } catch (storageErr) {
      logger.warn({ err: storageErr }, "[pdf-batch] Object storage upload failed, falling back to base64");
    }

    const updatedEntityData: Record<string, unknown> = {
      ...(job.entityData as object || {}),
      _pdfSize: pdfBuffer.length,
    };
    if (storageKey) {
      updatedEntityData._storageKey = storageKey;
    } else {
      updatedEntityData._pdfBase64 = pdfBuffer.toString("base64");
    }

    await db.update(pdfJobsTable).set({
      status: "completed",
      completedAt: new Date(),
      outputFilename,
      outputUrl,
      entityData: updatedEntityData,
    }).where(eq(pdfJobsTable.id, job.id));

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown rendering error";
    await db.update(pdfJobsTable).set({
      status: "failed",
      completedAt: new Date(),
      error: errorMsg,
    }).where(eq(pdfJobsTable.id, job.id));
  }

  await updateBatchProgress(job.batchId);
}

async function processBatchAsync(batchId: string, jobs: typeof pdfJobsTable.$inferSelect[]) {
  await db.update(pdfBatchesTable).set({ status: "processing", updatedAt: new Date() }).where(eq(pdfBatchesTable.batchId, batchId));

  // Process jobs sequentially to avoid overwhelming the DB, with concurrency of 5
  const CONCURRENCY = 5;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    await Promise.all(jobs.slice(i, i + CONCURRENCY).map(processJobAsync));
  }

  await updateBatchProgress(batchId);
}

async function updateBatchProgress(batchId: string) {
  const jobs = await db.select().from(pdfJobsTable).where(eq(pdfJobsTable.batchId, batchId));
  const completed = jobs.filter(j => j.status === "completed").length;
  const failed = jobs.filter(j => j.status === "failed").length;
  const total = jobs.length;
  const allDone = completed + failed === total;

  let batchStatus: typeof pdfBatchesTable.status._.data = "processing";
  if (allDone) {
    batchStatus = failed === total ? "failed" : "completed";
  }

  await db.update(pdfBatchesTable).set({
    completedJobs: completed,
    failedJobs: failed,
    status: batchStatus,
    updatedAt: new Date(),
  }).where(eq(pdfBatchesTable.batchId, batchId));
}

// ─── PDF Output Endpoint ─────────────────────────────────────────────────────

router.get("/documents/pdf-output/:filename", authMiddleware(), async (req, res) => {
  try {
    const { filename } = req.params as Record<string, string>;
    const [job] = await db.select().from(pdfJobsTable).where(eq(pdfJobsTable.outputFilename, filename));
    if (!job) return sendNotFound(res, "PDF output");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (role !== "admin" && role !== "editor" && job.requestedById !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (job.status !== "completed") {
      return res.status(409).json({ error: `Job is ${job.status}, not completed yet` });
    }

    const entityData = (job.entityData || {}) as Record<string, unknown>;
    const storageKey = entityData._storageKey as string | undefined;
    const pdfBase64 = entityData._pdfBase64 as string | undefined;

    if (storageKey) {
      // Serve from object storage
      try {
        const pdfBuffer = await objectStorageService.downloadObjectToBuffer(storageKey);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        res.send(pdfBuffer);
        return;
      } catch (err) {
        if (err instanceof ObjectNotFoundError) return sendNotFound(res, "PDF output not found in storage");
        throw err;
      }
    }

    if (!pdfBase64) return sendNotFound(res, "PDF output not ready");

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to serve PDF output");
  }
});

// ─── Batch ZIP Download ───────────────────────────────────────────────────────
// Returns a ZIP archive of all completed PDFs in a batch.

router.get("/documents/batch-pdf/:batchId/zip", authMiddleware(), async (req, res) => {
  try {
    const { batchId } = req.params as Record<string, string>;
    const [batch] = await db.select().from(pdfBatchesTable).where(eq(pdfBatchesTable.batchId, batchId));
    if (!batch) return sendNotFound(res, "Batch");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (role !== "admin" && role !== "editor" && batch.requestedById !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const jobs = await db.select().from(pdfJobsTable)
      .where(and(eq(pdfJobsTable.batchId, batchId), eq(pdfJobsTable.status, "completed")));

    if (jobs.length === 0) {
      return sendBadRequest(res, "No completed jobs in this batch yet");
    }

    // Build ZIP using jszip (no native addon required)
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (const job of jobs) {
      const entityData = (job.entityData || {}) as Record<string, unknown>;
      const storageKey = entityData._storageKey as string | undefined;
      const pdfBase64 = entityData._pdfBase64 as string | undefined;
      const filename = job.outputFilename || `doc-${job.id}.pdf`;

      if (storageKey) {
        try {
          const pdfBuffer = await objectStorageService.downloadObjectToBuffer(storageKey);
          zip.file(filename, pdfBuffer);
        } catch {
          continue;
        }
      } else if (pdfBase64) {
        zip.file(filename, Buffer.from(pdfBase64, "base64"));
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const zipFilename = `batch-${batchId.slice(0, 8)}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);
    res.setHeader("Content-Length", zipBuffer.length);
    res.send(zipBuffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to generate ZIP");
  }
});

// ─── Document PDF (single document) ──────────────────────────────────────────

router.get("/documents/:id/pdf", authMiddleware(), async (req, res) => {
  try {
    const docId = parseInt(req.params.id as string, 10);
    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, docId));
    if (!doc) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canAccessDocument(userId, role, doc)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const content = (doc.contentJson || { blocks: [], version: 1 }) as { blocks: any[]; version: number };
    const pdfBuffer = await renderDocumentToPdfBuffer({
      title: doc.title,
      documentType: doc.type,
      appSource: doc.appSource,
      content,
      entityData: (doc.mergeFieldValues || {}) as Record<string, unknown>,
    });

    const filename = `${doc.title.replace(/[^a-zA-Z0-9-]/g, "_").slice(0, 60)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to generate document PDF");
  }
});

// ─── Version Diff ─────────────────────────────────────────────────────────────
// Compare two versions of the same document. Returns a block-level diff summary.

router.get("/documents/:id/versions/:versionA/diff/:versionB", authMiddleware(), async (req, res) => {
  try {
    const docId = parseInt(req.params.id as string, 10);
    const versionA = parseInt(req.params.versionA as string, 10);
    const versionB = parseInt(req.params.versionB as string, 10);

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, docId));
    if (!doc) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canAccessDocument(userId, role, doc)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const versions = await db.select().from(documentVersionsTable)
      .where(eq(documentVersionsTable.documentId, docId))
      .orderBy(documentVersionsTable.version);

    const snapA = versions.find(v => v.version === versionA);
    const snapB = versions.find(v => v.version === versionB);
    const latestContent = doc.contentJson as { blocks: any[]; version: number } | null;

    // Resolve: "0" means current live document
    type EditorContent = { blocks: BlockNode[]; version: number };
    const contentA: EditorContent | null = versionA === 0 ? latestContent : (snapA?.contentJson as EditorContent | null ?? null);
    const contentB: EditorContent | null = versionB === 0 ? latestContent : (snapB?.contentJson as EditorContent | null ?? null);

    if (!contentA && versionA !== 0) return sendNotFound(res, `Version ${versionA}`);
    if (!contentB && versionB !== 0) return sendNotFound(res, `Version ${versionB}`);

    const blocksA: any[] = contentA?.blocks || [];
    const blocksB: any[] = contentB?.blocks || [];

    const diff = diffBlocks(blocksA, blocksB);

    sendSuccess(res, {
      documentId: docId,
      versionA: versionA === 0 ? "current" : versionA,
      versionB: versionB === 0 ? "current" : versionB,
      metaA: versionA === 0
        ? { version: 0, note: "Current", savedAt: doc.updatedAt }
        : { version: snapA!.version, note: snapA!.changeNote, savedAt: snapA!.createdAt },
      metaB: versionB === 0
        ? { version: 0, note: "Current", savedAt: doc.updatedAt }
        : { version: snapB!.version, note: snapB!.changeNote, savedAt: snapB!.createdAt },
      diff,
      summary: {
        added: diff.filter(d => d.op === "add").length,
        removed: diff.filter(d => d.op === "remove").length,
        changed: diff.filter(d => d.op === "change").length,
        unchanged: diff.filter(d => d.op === "equal").length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute diff");
  }
});

function getBlockText(block: { children?: { text: string }[] }): string {
  return (block.children || []).map(c => c.text).join("");
}

function diffBlocks(blocksA: any[], blocksB: any[]): Array<{ op: "add" | "remove" | "change" | "equal"; indexA?: number; indexB?: number; blockA?: any; blockB?: any; textA?: string; textB?: string }> {
  const result: Array<{ op: "add" | "remove" | "change" | "equal"; indexA?: number; indexB?: number; blockA?: any; blockB?: any; textA?: string; textB?: string }> = [];
  const maxLen = Math.max(blocksA.length, blocksB.length);

  for (let i = 0; i < maxLen; i++) {
    const bA = blocksA[i];
    const bB = blocksB[i];

    if (!bA && bB) {
      result.push({ op: "add", indexB: i, blockB: bB, textB: getBlockText(bB) });
    } else if (bA && !bB) {
      result.push({ op: "remove", indexA: i, blockA: bA, textA: getBlockText(bA) });
    } else {
      const textA = getBlockText(bA);
      const textB = getBlockText(bB);
      if (bA.type !== bB.type || textA !== textB) {
        result.push({ op: "change", indexA: i, indexB: i, blockA: bA, blockB: bB, textA, textB });
      } else {
        result.push({ op: "equal", indexA: i, indexB: i, blockA: bA, blockB: bB, textA });
      }
    }
  }
  return result;
}

// ─── DocuSign Adapter ─────────────────────────────────────────────────────────
// Implements DocuSign JWT Grant auth, envelope creation, embedded signing URL,
// and webhook completion handler. Falls back to self-hosted signing if DocuSign
// credentials are not configured.

const DOCUSIGN_BASE = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi";
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID || "";
const DOCUSIGN_CLIENT_ID = process.env.DOCUSIGN_CLIENT_ID || "";
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID || "";
const DOCUSIGN_PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY || "";
const DOCUSIGN_AUTH_URL = process.env.DOCUSIGN_AUTH_URL || "https://account-d.docusign.com";

let _cachedDsAccessToken: { token: string; expiresAt: number } | null = null;

async function getDocuSignAccessToken(): Promise<string> {
  // Return cached token if still valid (>60s left)
  if (_cachedDsAccessToken && Date.now() < _cachedDsAccessToken.expiresAt - 60000) {
    return _cachedDsAccessToken.token;
  }

  if (!DOCUSIGN_CLIENT_ID || !DOCUSIGN_USER_ID || !DOCUSIGN_PRIVATE_KEY) {
    throw new Error("DocuSign credentials not configured (DOCUSIGN_CLIENT_ID, DOCUSIGN_USER_ID, DOCUSIGN_PRIVATE_KEY)");
  }

  // Build JWT for DocuSign JWT Grant auth (RFC 7519)
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: DOCUSIGN_CLIENT_ID,
    sub: DOCUSIGN_USER_ID,
    aud: new URL(DOCUSIGN_AUTH_URL).hostname,
    iat: now,
    exp: now + 3600,
    scope: "signature impersonation",
  })).toString("base64url");

  const signer = createSign("RSA-SHA256");
  const privateKey = DOCUSIGN_PRIVATE_KEY.replace(/\\n/g, "\n");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(privateKey).toString("base64url");
  const jwt = `${header}.${payload}.${signature}`;

  const formData = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const resp = await fetch(`${DOCUSIGN_AUTH_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`DocuSign token request failed: ${resp.status} ${body}`);
  }

  const tokenResp = await resp.json() as { access_token: string; expires_in: number };
  _cachedDsAccessToken = {
    token: tokenResp.access_token,
    expiresAt: Date.now() + (tokenResp.expires_in * 1000),
  };
  return _cachedDsAccessToken.token;
}

async function createDocuSignEnvelope(params: {
  documentTitle: string;
  pdfBase64: string;
  signers: Array<{ email: string; name: string; order: number; sigId: string }>;
  emailSubject?: string;
}): Promise<string> {
  const token = await getDocuSignAccessToken();

  const envelopeBody = {
    emailSubject: params.emailSubject || `Please sign: ${params.documentTitle}`,
    documents: [{
      documentBase64: params.pdfBase64,
      name: params.documentTitle,
      fileExtension: "pdf",
      documentId: "1",
    }],
    recipients: {
      signers: params.signers.map((s, idx) => ({
        email: s.email,
        name: s.name,
        recipientId: String(idx + 1),
        routingOrder: String(s.order),
        clientUserId: s.sigId,
        tabs: {
          signHereTabs: [{
            documentId: "1",
            pageNumber: "1",
            xPosition: "300",
            yPosition: "700",
          }],
          dateSignedTabs: [{
            documentId: "1",
            pageNumber: "1",
            xPosition: "480",
            yPosition: "700",
          }],
        },
      })),
    },
    status: "sent",
  };

  const resp = await fetch(`${DOCUSIGN_BASE}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(envelopeBody),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`DocuSign envelope creation failed: ${resp.status} ${body}`);
  }

  const data = await resp.json() as { envelopeId: string };
  return data.envelopeId;
}

async function getDocuSignEmbeddedUrl(params: {
  envelopeId: string;
  signerEmail: string;
  signerName: string;
  clientUserId: string;
  returnUrl: string;
}): Promise<string> {
  const token = await getDocuSignAccessToken();

  const resp = await fetch(
    `${DOCUSIGN_BASE}/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${params.envelopeId}/views/recipient`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        returnUrl: params.returnUrl,
        authenticationMethod: "none",
        email: params.signerEmail,
        userName: params.signerName,
        clientUserId: params.clientUserId,
        frameAncestors: ["https://*.docusign.net", process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "*"],
        messageOrigins: ["https://apps-d.docusign.com"],
      }),
    }
  );

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`DocuSign embedded URL failed: ${resp.status} ${body}`);
  }

  const data = await resp.json() as { url: string };
  return data.url;
}

// DocuSign: create envelope and get embedded signing URL for a document
router.post("/documents/:id/docusign/send", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id as string, 10);
    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, docId));
    if (!doc) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canMutateDocument(userId, role, doc)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!DOCUSIGN_CLIENT_ID) {
      return res.status(503).json({
        error: "DocuSign not configured",
        fallback: "self_hosted",
        signingUrls: [],
      });
    }

    // Generate PDF from document content
    const content = (doc.contentJson || { blocks: [], version: 1 }) as { blocks: any[]; version: number };
    const pdfBuffer = await renderDocumentToPdfBuffer({
      title: doc.title,
      documentType: doc.type,
      appSource: doc.appSource,
      content,
      entityData: (doc.mergeFieldValues || {}) as Record<string, unknown>,
    });

    const sigs = await db.select().from(signaturesTable)
      .where(and(eq(signaturesTable.documentId, docId), eq(signaturesTable.status, "pending")))
      .orderBy(signaturesTable.signingOrder);

    if (sigs.length === 0) {
      return sendBadRequest(res, "No pending signers on this document");
    }

    const envelopeId = await createDocuSignEnvelope({
      documentTitle: doc.title,
      pdfBase64: pdfBuffer.toString("base64"),
      signers: sigs.map(s => ({
        email: s.signerEmail,
        name: s.signerName,
        order: s.signingOrder || 1,
        sigId: String(s.id),
      })),
    });

    // Persist envelope ID on signatures
    await db.update(signaturesTable).set({
      docuSignEnvelopeId: envelopeId,
      
      updatedAt: new Date(),
    }).where(eq(signaturesTable.documentId, docId));

    // Get embedded signing URL for first signer
    const firstSig = sigs[0];
    const baseOrigin = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `http://localhost:${process.env.PORT ?? "3000"}`;
    const returnUrl = `${baseOrigin}/document-engine/signed?docId=${docId}&sigId=${firstSig.id}`;

    const embeddedUrl = await getDocuSignEmbeddedUrl({
      envelopeId,
      signerEmail: firstSig.signerEmail,
      signerName: firstSig.signerName,
      clientUserId: String(firstSig.id),
      returnUrl,
    });

    await db.update(documentsTable).set({ status: "review", updatedAt: new Date() }).where(eq(documentsTable.id, docId));

    sendSuccess(res, {
      envelopeId,
      provider: "docusign",
      firstSignerUrl: embeddedUrl,
      signerCount: sigs.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("not configured")) {
      return res.status(503).json({ error: msg, fallback: "self_hosted" });
    }
    handleRouteError(res, err, "Failed to create DocuSign envelope");
  }
});

// DocuSign: webhook handler for Connect (envelope completion events)
// DocuSign Connect HMAC signature verification.
// DocuSign signs each webhook payload with HMAC-SHA256 using the Connect key.
// The signature is in the X-DocuSign-Signature-1 header.
function verifyDocuSignHmac(body: Buffer | string, signature: string, key: string): boolean {
  const hmac = createHmac("sha256", key);
  hmac.update(body);
  const expected = hmac.digest("base64");
  return expected === signature;
}

router.post("/documents/docusign/webhook", async (req: Request, res: Response) => {
  try {
    const DOCUSIGN_HMAC_KEY = process.env.DOCUSIGN_CONNECT_HMAC_KEY;
    const signature = req.headers["x-docusign-signature-1"] as string | undefined;

    // Enforce HMAC verification when the key is configured
    if (DOCUSIGN_HMAC_KEY) {
      if (!signature) {
        return res.status(401).json({ error: "Missing DocuSign Connect signature header" });
      }
      const rawBody: Buffer = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
      if (!verifyDocuSignHmac(rawBody, signature, DOCUSIGN_HMAC_KEY)) {
        return res.status(401).json({ error: "DocuSign Connect signature verification failed" });
      }
    }

    const event = req.body as {
      event?: string;
      data?: { envelopeSummary?: { status?: string; envelopeId?: string } };
    };

    const summary = event?.data?.envelopeSummary;
    const envelopeId = summary?.envelopeId;
    const envelopeStatus = summary?.status;

    if (!envelopeId) {
      return res.status(400).json({ error: "Missing envelopeId in webhook payload" });
    }

    if (envelopeStatus === "completed") {
      // Mark all signatures on this envelope as signed
      const docSignatures = await db.select().from(signaturesTable)
        .where(eq(signaturesTable.docuSignEnvelopeId, envelopeId));

      for (const sig of docSignatures) {
        await db.update(signaturesTable).set({
          status: "signed",
          signedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(signaturesTable.id, sig.id));

        // Check if all signatures on the document are now complete
        const pendingRemaining = await db.select().from(signaturesTable)
          .where(and(
            eq(signaturesTable.documentId, sig.documentId),
            ne(signaturesTable.status, "signed")
          ));

        if (pendingRemaining.length === 0) {
          await db.update(documentsTable).set({ status: "signed", updatedAt: new Date() })
            .where(eq(documentsTable.id, sig.documentId));
        }
      }
    } else if (envelopeStatus === "declined") {
      const docSignatures = await db.select().from(signaturesTable)
        .where(eq(signaturesTable.docuSignEnvelopeId, envelopeId));

      for (const sig of docSignatures) {
        await db.update(signaturesTable).set({ status: "declined", updatedAt: new Date() }).where(eq(signaturesTable.id, sig.id));
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return handleRouteError(res, err, "Failed to process DocuSign webhook");
  }
});

// DocuSign: get embedded signing URL for a specific signer (re-initiate)
router.post("/documents/:id/docusign/embed/:sigId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id as string, 10);
    const sigId = parseInt(req.params.sigId as string, 10);

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, docId));
    if (!doc) return sendNotFound(res, "Document");

    const userId = getRequestUserId(req);
    const role = getUserRole(req);
    if (!canAccessDocument(userId, role, doc)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Bind sigId to docId
    const [sig] = await db.select().from(signaturesTable)
      .where(and(eq(signaturesTable.id, sigId), eq(signaturesTable.documentId, docId)));
    if (!sig) return sendNotFound(res, "Signature");

    if (!sig.docuSignEnvelopeId) {
      return sendBadRequest(res, "No DocuSign envelope on this document — send it first");
    }

    const signingBaseOrigin = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `http://localhost:${process.env.PORT ?? "3000"}`;
    const returnUrl = `${signingBaseOrigin}/document-engine/signed?docId=${docId}&sigId=${sigId}`;

    const embeddedUrl = await getDocuSignEmbeddedUrl({
      envelopeId: sig.docuSignEnvelopeId,
      signerEmail: sig.signerEmail,
      signerName: sig.signerName,
      clientUserId: String(sig.id),
      returnUrl,
    });

    sendSuccess(res, { embeddedUrl, signerEmail: sig.signerEmail });
  } catch (err) {
    handleRouteError(res, err, "Failed to get DocuSign signing URL");
  }
});

export default router;
