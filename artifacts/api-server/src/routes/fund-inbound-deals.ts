import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { Readable } from "stream";
import { randomBytes, randomUUID } from "node:crypto";
import multer from "multer";
import { db, fundInboundDealsTable, type DealAttachment } from "@szl-holdings/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { sendSuccess, sendBadRequest, sendNotFound, handleRouteError } from "../lib/api-response";
import { publicSubmitLimiter, publicUploadLimiter } from "../middlewares/rate-limiters";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { validateBody, jsonObjectBodySchema } from "../lib/validation";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

const MB = 1024 * 1024;
const MAX_FILE_BYTES = 25 * MB;
const MAX_ATTACHMENTS = 10;

// Founder uploads are limited to pitch decks and common data-room formats.
const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
]);

const attachmentSchema = z.object({
  kind: z.enum(["deck", "data-room"]),
  name: z.string().min(1).max(260),
  size: z.number().int().min(1).max(MAX_FILE_BYTES),
  contentType: z.string().min(1).max(120).refine(t => ALLOWED_UPLOAD_TYPES.has(t), {
    message: "Unsupported file type",
  }),
  objectPath: z.string().regex(/^\/objects\/[A-Za-z0-9/._\-]+$/, "Invalid object path"),
});

const submitSchema = z.object({
  company: z.string().min(1).max(200),
  website: z.string().max(300).optional().nullable(),
  sector: z.string().min(1).max(100),
  stage: z.string().min(1).max(50),
  askSize: z.string().max(50).optional().nullable(),
  valuation: z.string().max(50).optional().nullable(),
  arr: z.string().max(50).optional().nullable(),
  growth: z.string().max(50).optional().nullable(),
  founderName: z.string().min(1).max(200),
  founderEmail: z.string().email().max(254),
  founderBackground: z.string().max(2000).optional().nullable(),
  founderEducation: z.string().max(500).optional().nullable(),
  founderPriorExits: z.string().max(20).optional().nullable(),
  summary: z.string().min(1).max(4000),
  deckUrl: z.string().max(500).optional().nullable(),
  convictionScore: z.number().int().min(0).max(100),
  scores: z.object({
    team: z.number().int().min(0).max(100),
    market: z.number().int().min(0).max(100),
    product: z.number().int().min(0).max(100),
    traction: z.number().int().min(0).max(100),
    competitive: z.number().int().min(0).max(100),
    financials: z.number().int().min(0).max(100),
  }),
  status: z.enum(["screening", "active", "passed", "invested"]).default("screening"),
  strengths: z.array(z.string().max(500)).max(20).default([]),
  risks: z.array(z.string().max(500)).max(20).default([]),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).default([]),
});

// Server-mediated upload: multer enforces the 25MB ceiling at the network
// boundary BEFORE any bytes reach object storage, and the fileFilter rejects
// disallowed MIME types up-front. This is what makes the public upload path
// safe to expose without authentication — the server, not the client, is
// what controls how much data lands in private storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_UPLOAD_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

function generatePipelineId(): string {
  // DF-<4 time chars>-<4 random chars> — time prefix keeps entries ordered
  // visually; random suffix eliminates collisions under concurrent submits.
  const t = Date.now().toString(36).toUpperCase().slice(-4);
  const r = randomBytes(3).toString("base64").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  return `DF-${t}${r}`;
}

/**
 * Public server-mediated upload endpoint for founders. No session required —
 * rate limited per IP. The file is streamed through multer with a hard 25MB
 * ceiling and a MIME allowlist; only after both checks pass do we write it
 * to private object storage. The returned objectPath is what the client
 * echoes back inside `attachments[]` on the submit call.
 */
router.post(
  "/public/fund-inbound-deals/upload",
  publicUploadLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            sendBadRequest(res, `File exceeds the ${MAX_FILE_BYTES / MB}MB per-file limit`);
            return;
          }
          sendBadRequest(res, `Upload rejected: ${err.message}`);
          return;
        }
        sendBadRequest(res, err instanceof Error ? err.message : "Upload rejected");
        return;
      }
      next();
    });
  },
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        sendBadRequest(res, "No file provided");
        return;
      }
      const kindRaw = String(req.body?.kind ?? "");
      if (kindRaw !== "deck" && kindRaw !== "data-room") {
        sendBadRequest(res, "Invalid attachment kind");
        return;
      }
      // Defense in depth — multer's fileFilter already enforced this.
      if (!ALLOWED_UPLOAD_TYPES.has(file.mimetype)) {
        sendBadRequest(res, `Unsupported file type: ${file.mimetype}`);
        return;
      }
      // Strict safe filename: only alphanumerics, dot, underscore, hyphen.
      // Spaces and other characters are normalized to underscores so the
      // resulting object path always matches attachmentSchema.objectPath.
      const safeName = file.originalname.replace(/[^A-Za-z0-9._\-]/g, "_").slice(0, 200) || "file";
      const subPath = `uploads/${randomUUID()}/${safeName}`;
      const objectPath = await objectStorage.uploadBuffer(file.buffer, subPath, file.mimetype);
      sendSuccess(res, {
        objectPath,
        name: file.originalname.slice(0, 260),
        size: file.size,
        contentType: file.mimetype,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to upload attachment");
    }
  },
);

/**
 * Verify each referenced object actually exists in object storage and that its
 * real size and content type satisfy the upload policy. Client-supplied
 * size/contentType values are NEVER trusted for persistence — they are
 * replaced with the values reported by GCS. This closes the loophole where a
 * caller could request a presigned URL with a small `size` claim and then PUT
 * an arbitrarily large object to private storage.
 */
async function verifyAndCanonicalizeAttachments(
  attachments: z.infer<typeof attachmentSchema>[],
): Promise<{ ok: true; attachments: DealAttachment[] } | { ok: false; error: string }> {
  const verified: DealAttachment[] = [];
  for (const a of attachments) {
    let file;
    try {
      file = await objectStorage.getObjectEntityFile(a.objectPath);
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        return { ok: false, error: `Attachment "${a.name}" was not uploaded` };
      }
      throw err;
    }
    const [metadata] = await file.getMetadata();
    const actualSize = typeof metadata.size === "number"
      ? metadata.size
      : Number.parseInt(String(metadata.size ?? "0"), 10);
    const actualContentType = (metadata.contentType as string | undefined) || a.contentType;
    if (!Number.isFinite(actualSize) || actualSize <= 0) {
      return { ok: false, error: `Attachment "${a.name}" is empty or unreadable` };
    }
    if (actualSize > MAX_FILE_BYTES) {
      return { ok: false, error: `Attachment "${a.name}" exceeds the 25MB per-file limit (actual ${(actualSize / MB).toFixed(1)}MB)` };
    }
    if (!ALLOWED_UPLOAD_TYPES.has(actualContentType)) {
      return { ok: false, error: `Attachment "${a.name}" has an unsupported content type (${actualContentType})` };
    }
    verified.push({
      kind: a.kind,
      name: a.name,
      size: actualSize,
      contentType: actualContentType,
      objectPath: a.objectPath,
    });
  }
  return { ok: true, attachments: verified };
}

router.post("/public/fund-inbound-deals", publicSubmitLimiter, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, `Invalid submission: ${parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      return;
    }
    const v = parsed.data;
    const verification = await verifyAndCanonicalizeAttachments(v.attachments);
    if (!verification.ok) {
      sendBadRequest(res, verification.error);
      return;
    }
    const verifiedAttachments = verification.attachments;
    const pipelineId = generatePipelineId();

    const [row] = await db.insert(fundInboundDealsTable).values({
      pipelineId,
      company: v.company,
      website: v.website ?? null,
      sector: v.sector,
      stage: v.stage,
      askSize: v.askSize ?? null,
      valuation: v.valuation ?? null,
      arr: v.arr ?? null,
      growth: v.growth ?? null,
      founderName: v.founderName,
      founderEmail: v.founderEmail,
      founderBackground: v.founderBackground ?? null,
      founderEducation: v.founderEducation ?? null,
      founderPriorExits: v.founderPriorExits ?? null,
      summary: v.summary,
      deckUrl: v.deckUrl ?? null,
      convictionScore: v.convictionScore,
      scoreTeam: v.scores.team,
      scoreMarket: v.scores.market,
      scoreProduct: v.scores.product,
      scoreTraction: v.scores.traction,
      scoreCompetitive: v.scores.competitive,
      scoreFinancials: v.scores.financials,
      status: v.status,
      strengths: v.strengths,
      risks: v.risks,
      attachments: verifiedAttachments,
      source: "inbound",
    }).returning();

    sendSuccess(res, {
      pipelineId: row.pipelineId,
      submittedAt: row.submittedAt,
      confirmationEmail: v.founderEmail,
      message: `Submission received. Confirmation sent to ${v.founderEmail}. Pipeline ID ${row.pipelineId}.`,
    }, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to record inbound deal submission");
  }
});

// Authenticated listing for partners. The /api/ prefix (without /public)
// is protected by the global auth enforcer — only signed-in partners can
// view founder identity, summary, and scoring details.
router.get("/fund-inbound-deals", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(fundInboundDealsTable)
      .orderBy(desc(fundInboundDealsTable.submittedAt))
      .limit(200);

    const mapped = rows.map(r => ({
      id: r.pipelineId,
      company: r.company,
      sector: r.sector,
      stage: r.stage,
      askSize: r.askSize ?? "—",
      valuation: r.valuation ?? "—",
      convictionScore: r.convictionScore,
      scores: {
        team: r.scoreTeam,
        market: r.scoreMarket,
        product: r.scoreProduct,
        traction: r.scoreTraction,
        competitive: r.scoreCompetitive,
        financials: r.scoreFinancials,
      },
      status: r.status,
      founder: r.founderName + (r.founderBackground ? ` (${r.founderBackground.slice(0, 60)}${r.founderBackground.length > 60 ? "…" : ""})` : ""),
      founderEmail: r.founderEmail,
      summary: r.summary,
      strengths: r.strengths ?? [],
      risks: r.risks ?? [],
      deckUrl: r.deckUrl ?? null,
      attachments: (r.attachments ?? []).map((a, idx) => ({
        kind: a.kind,
        name: a.name,
        size: a.size,
        contentType: a.contentType,
        // Relative path; the client prepends its API base so links work in
        // deployments where the frontend and API are on different origins.
        downloadPath: `/api/fund-inbound-deals/${encodeURIComponent(r.pipelineId)}/attachments/${idx}`,
      })),
      date: new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      source: r.source,
    }));

    sendSuccess(res, mapped);
  } catch (err) {
    handleRouteError(res, err, "Failed to list inbound deal submissions");
  }
});

/**
 * Authenticated download for analysts. Streams the GCS-backed file referenced
 * by the attachment at index `idx` for the deal `pipelineId`. Auth is enforced
 * upstream by the global enforcer; index-by-position avoids exposing raw object
 * paths to the client.
 */
router.get("/fund-inbound-deals/:pipelineId/attachments/:idx", async (req: Request, res: Response) => {
  try {
    const idx = Number.parseInt(req.params.idx as string, 10);
    if (!Number.isInteger(idx) || idx < 0) {
      sendBadRequest(res, "Invalid attachment index");
      return;
    }
    const [row] = await db
      .select()
      .from(fundInboundDealsTable)
      .where(eq(fundInboundDealsTable.pipelineId, req.params.pipelineId as string))
      .limit(1);
    if (!row) {
      sendNotFound(res, "Deal not found");
      return;
    }
    const attachment = (row.attachments ?? [])[idx];
    if (!attachment) {
      sendNotFound(res, "Attachment not found");
      return;
    }
    const file = await objectStorage.getObjectEntityFile(attachment.objectPath);
    const response = await objectStorage.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    // Force the browser to use the original filename when downloading.
    const safeName = attachment.name.replace(/[^A-Za-z0-9._\- ]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      sendNotFound(res, "Attachment file no longer exists");
      return;
    }
    handleRouteError(res, err, "Failed to download attachment");
  }
});

export default router;
