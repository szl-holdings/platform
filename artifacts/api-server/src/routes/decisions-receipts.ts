/**
 * Decision Receipts API
 *
 * Generates, stores, and retrieves structured Decision Receipts for every
 * governed action flagged as is_decision: true. Each receipt captures:
 *   - Actor identity (user, role)
 *   - Timestamp of the decision
 *   - Data visible at decision time (snapshot)
 *   - AI recommendation (if any)
 *   - Alternative options considered
 *   - Non-repudiation hash (SHA-256)
 *
 * Routes:
 *   POST /decisions/receipts          — create a decision receipt
 *   GET  /decisions/receipts          — list receipts for current user
 *   GET  /decisions/receipts/:id      — get a single receipt by receiptId (owner or admin only)
 *   GET  /decisions/receipts/download/:id — download a receipt as JSON (owner or admin only)
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { createHash, randomUUID } from "crypto";
import { z } from "zod";
import { db, decisionReceipts } from "@szl-holdings/db";
import { desc, eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import type { AuthenticatedUser } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  handleRouteError,
} from "../lib/api-response";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";
import { logActivity } from "@szl-holdings/audit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const EvidenceRefSchema = z.object({
  source: z.string(),
  content: z.string(),
  relevanceScore: z.number().min(0).max(1),
});

const AiRecommendationSchema = z.object({
  recommendedAction: z.string(),
  rationaleSummary: z.string(),
  confidence: z.number().min(0).max(1),
  riskLevel: z.string().optional(),
  modelRoute: z.string().optional(),
  evidenceRefs: z.array(EvidenceRefSchema).optional(),
}).nullable();

const AlternativeSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  riskLevel: z.string().optional(),
});

const CreateReceiptSchema = z.object({
  domain: z.string().min(1),
  actionType: z.string().min(1),
  actionLabel: z.string().min(1),
  outcome: z.enum(["approved", "rejected", "escalated", "executed", "deferred"]),
  riskLevel: z.string().optional(),
  rationale: z.string().optional(),
  dataSnapshot: z.record(z.unknown()).optional(),
  aiRecommendation: AiRecommendationSchema.optional(),
  alternativesConsidered: z.array(AlternativeSchema).optional(),
  decisionId: z.string().optional(),
  workflowId: z.string().optional(),
  approvalId: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
});

function computeHash(fields: object): string {
  const keys = Object.keys(fields).sort();
  const canonical = JSON.stringify(Object.fromEntries(keys.map(k => [k, (fields as Record<string, unknown>)[k]])));
  return createHash("sha256").update(canonical).digest("hex");
}

function isElevatedUser(user: AuthenticatedUser): boolean {
  return user.roles.some(r => ["super_admin", "admin", "exec"].includes(r));
}

router.post("/decisions/receipts", authMiddleware(), validateBody(CreateReceiptSchema), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const body = req.body as z.infer<typeof CreateReceiptSchema>;

    const receiptId = randomUUID();
    const timestamp = new Date();

    const hashFields = {
      receiptId,
      domain: body.domain,
      actionType: body.actionType,
      actionLabel: body.actionLabel,
      outcome: body.outcome,
      actorUserId: user.id,
      actorName: user.displayName,
      timestamp: timestamp.toISOString(),
      dataSnapshot: body.dataSnapshot ?? {},
      aiRecommendation: body.aiRecommendation ?? null,
      alternativesConsidered: body.alternativesConsidered ?? [],
      decisionId: body.decisionId ?? null,
      workflowId: body.workflowId ?? null,
    };

    const hash = computeHash(hashFields);

    const [receipt] = await db.insert(decisionReceipts).values({
      receiptId,
      domain: body.domain,
      actionType: body.actionType,
      actionLabel: body.actionLabel,
      actorUserId: user.id,
      actorName: user.displayName,
      actorRole: user.roles[0] ?? null,
      timestamp,
      dataSnapshot: body.dataSnapshot ?? {},
      aiRecommendation: body.aiRecommendation ?? null,
      alternativesConsidered: body.alternativesConsidered ?? [],
      rationale: body.rationale,
      outcome: body.outcome,
      riskLevel: body.riskLevel,
      decisionId: body.decisionId,
      workflowId: body.workflowId,
      approvalId: body.approvalId,
      nonRepudiationHash: hash,
      hashAlgorithm: "sha256",
      metadata: body.metadata ?? {},
    }).returning();

    await logActivity({
      userId: user.id,
      action: "decision_receipt_created",
      resource: "decisions/receipts",
      resourceId: receiptId,
      description: `Decision receipt created: ${body.actionLabel} (${body.outcome})`,
      metadata: {
        domain: body.domain,
        actionType: body.actionType,
        outcome: body.outcome,
        riskLevel: body.riskLevel,
        receiptId,
      },
    });

    logger.info({ receiptId, domain: body.domain, outcome: body.outcome }, "Decision receipt created");

    return sendCreated(res, receipt);
  } catch (err) {
    return handleRouteError(res, err, "POST /decisions/receipts");
  }
});

router.get("/decisions/receipts", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const domain = req.query["domain"] as string | undefined;
    const limit = Math.min(parseInt(req.query["limit"] as string ?? "50", 10) || 50, 200);

    const conditions = [eq(decisionReceipts.actorUserId, user.id)];
    if (domain) conditions.push(eq(decisionReceipts.domain, domain));

    const rows = await db
      .select()
      .from(decisionReceipts)
      .where(and(...conditions))
      .orderBy(desc(decisionReceipts.createdAt))
      .limit(limit);

    return sendSuccess(res, { receipts: rows, total: rows.length });
  } catch (err) {
    return handleRouteError(res, err, "GET /decisions/receipts");
  }
});

router.get("/decisions/receipts/download/:receiptId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { receiptId } = req.params;

    const [receipt] = await db
      .select()
      .from(decisionReceipts)
      .where(eq(decisionReceipts.receiptId, receiptId))
      .limit(1);

    if (!receipt) return sendNotFound(res, "Decision receipt not found");

    if (receipt.actorUserId !== user.id && !isElevatedUser(user)) {
      return sendForbidden(res, "You do not have permission to download this receipt");
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="decision-receipt-${receiptId}.json"`);
    res.status(200).send(JSON.stringify(receipt, null, 2));
  } catch (err) {
    return handleRouteError(res, err, "GET /decisions/receipts/download/:receiptId");
  }
});

router.get("/decisions/receipts/:receiptId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { receiptId } = req.params;

    const [receipt] = await db
      .select()
      .from(decisionReceipts)
      .where(eq(decisionReceipts.receiptId, receiptId))
      .limit(1);

    if (!receipt) return sendNotFound(res, "Decision receipt not found");

    if (receipt.actorUserId !== user.id && !isElevatedUser(user)) {
      return sendForbidden(res, "You do not have permission to view this receipt");
    }

    return sendSuccess(res, receipt);
  } catch (err) {
    return handleRouteError(res, err, "GET /decisions/receipts/:receiptId");
  }
});

export default router;
