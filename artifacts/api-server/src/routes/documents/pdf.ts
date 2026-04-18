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

    const content = (doc.contentJson || { blocks: [], version: 1 }) as { blocks: BlockNode[]; version: number };
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
    const latestContent = doc.contentJson as { blocks: BlockNode[]; version: number } | null;

    // Resolve: "0" means current live document
    type EditorContent = { blocks: BlockNode[]; version: number };
    const contentA: EditorContent | null = versionA === 0 ? latestContent : (snapA?.contentJson as EditorContent | null ?? null);
    const contentB: EditorContent | null = versionB === 0 ? latestContent : (snapB?.contentJson as EditorContent | null ?? null);

    if (!contentA && versionA !== 0) return sendNotFound(res, `Version ${versionA}`);
    if (!contentB && versionB !== 0) return sendNotFound(res, `Version ${versionB}`);

    const blocksA: BlockNode[] = contentA?.blocks || [];
    const blocksB: BlockNode[] = contentB?.blocks || [];

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

function diffBlocks(blocksA: BlockNode[], blocksB: BlockNode[]): Array<{ op: "add" | "remove" | "change" | "equal"; indexA?: number; indexB?: number; blockA?: BlockNode; blockB?: BlockNode; textA?: string; textB?: string }> {
  const result: Array<{ op: "add" | "remove" | "change" | "equal"; indexA?: number; indexB?: number; blockA?: BlockNode; blockB?: BlockNode; textA?: string; textB?: string }> = [];
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
    const content = (doc.contentJson || { blocks: [], version: 1 }) as { blocks: BlockNode[]; version: number };
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



export function register(r: IRouter): void { r.use(router); }
