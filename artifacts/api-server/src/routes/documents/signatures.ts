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



export function register(r: IRouter): void { r.use(router); }
