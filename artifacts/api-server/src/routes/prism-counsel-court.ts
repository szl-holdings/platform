import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { db } from "@szl-holdings/db";
import {
  pcReviewAuditEventsTable,
  pcMattersTable,
  pcAuditEventsTable,
  pcApprovalRequestsTable,
} from "@szl-holdings/db";
import { eq, desc, and } from "drizzle-orm";
import { sendSuccess, sendBadRequest, sendForbidden, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { courtListener } from "../services/prism-court-listener";
import { privilegeEngine } from "../services/prism-privilege-engine";
import { modelRouter } from "../services/prism-model-router";
import { logger } from "../lib/logger";

const router = Router();

const ORG_ID_DEV_FALLBACK = 1;

function getOrgId(req: Request): number {
  const orgId = req.user?.orgs?.[0]?.orgId;
  if (orgId != null) return orgId;
  if (process.env.NODE_ENV === "production") {
    throw Object.assign(
      new Error("Organization membership required to access this resource"),
      { statusCode: 403 }
    );
  }
  return ORG_ID_DEV_FALLBACK;
}

function hasAttorneyRole(req: Request): boolean {
  const roles = req.user?.roles ?? [];
  return (
    roles.some(r => ["attorney", "partner", "super_admin", "admin"].includes(r)) ||
    (roles.length === 0 && process.env.NODE_ENV !== "production")
  );
}

async function emitCopilotAudit(opts: {
  orgId: number;
  matterId?: number;
  actorId?: number;
  action: string;
  fromState?: string;
  toState?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await db.insert(pcReviewAuditEventsTable).values({
      orgId: opts.orgId,
      matterId: opts.matterId,
      actorId: opts.actorId,
      action: `copilot.${opts.action}`,
      fromState: opts.fromState,
      toState: opts.toState,
      details: opts.details ?? {},
      proofChainPreserved: true,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to emit copilot audit event");
  }
}

async function assertMatterAccess(matterId: number, orgId: number, res: Response): Promise<boolean> {
  if (!matterId || isNaN(matterId)) {
    sendBadRequest(res, "Invalid or missing matter ID");
    return false;
  }
  try {
    const [matter] = await db
      .select({ id: pcMattersTable.id, orgId: pcMattersTable.orgId })
      .from(pcMattersTable)
      .where(eq(pcMattersTable.id, matterId));
    if (!matter) {
      sendForbidden(res, "Matter not found or access denied");
      return false;
    }
    if (matter.orgId !== orgId) {
      sendForbidden(res, "Access denied");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "assertMatterAccess DB error — denying access (fail-closed)");
    sendForbidden(res, "Access check unavailable");
    return false;
  }
}

/* ━━━ Rate limiters ━━━ */

const courtListenerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many court data requests — please wait a moment" },
  skip: () => process.env.NODE_ENV !== "production",
});

/* ━━━ CourtListener: Court Data Feed ━━━ */

router.get("/court/filings/recent", authMiddleware(), courtListenerLimiter, async (req, res) => {
  try {
    const court = req.query.court as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) ?? "15", 10), 20);
    const result = await courtListener.getRecentFilings(court, limit);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch recent filings");
  }
});

router.get("/court/dockets/search", authMiddleware(), courtListenerLimiter, async (req, res) => {
  try {
    const q = req.query.q as string;
    const court = req.query.court as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 20);
    if (!q || q.trim().length < 2) return sendBadRequest(res, "Query must be at least 2 characters");
    const result = await courtListener.searchDockets(q.trim(), court, limit);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to search dockets");
  }
});

router.get("/court/dockets/:id", authMiddleware(), courtListenerLimiter, async (req, res) => {
  try {
    const docketId = parseInt(String(req.params.id), 10);
    if (isNaN(docketId)) return sendBadRequest(res, "Invalid docket ID");
    const result = await courtListener.getDocket(docketId);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch docket");
  }
});

router.get("/court/opinions/search", authMiddleware(), courtListenerLimiter, async (req, res) => {
  try {
    const q = req.query.q as string;
    const court = req.query.court as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) ?? "10", 10), 20);
    if (!q || q.trim().length < 2) return sendBadRequest(res, "Query must be at least 2 characters");
    const result = await courtListener.searchOpinions(q.trim(), court, limit);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to search opinions");
  }
});

router.get("/court/judges/search", authMiddleware(), courtListenerLimiter, async (req, res) => {
  try {
    const q = req.query.q as string;
    const court = req.query.court as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) ?? "10", 10), 20);
    if (!q || q.trim().length < 2) return sendBadRequest(res, "Query must be at least 2 characters");
    const result = await courtListener.searchJudges(q.trim(), court, limit);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to search judges");
  }
});

/* ━━━ Court ↔ Matter linking (attorney+ required) ━━━ */

router.post("/court/matters/:matterId/link-docket", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const matterId = parseInt(String(req.params.matterId), 10);
    if (isNaN(matterId)) return sendBadRequest(res, "Invalid matter ID");
    const { docketId, courtId, caseNumber } = req.body;
    if (!docketId) return sendBadRequest(res, "docketId is required");
    const orgId = getOrgId(req);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const actorId = req.user?.id as number | undefined;
    const linkedAt = new Date().toISOString();

    await db.insert(pcAuditEventsTable).values({
      orgId,
      matterId,
      actorId,
      action: "court.docket_linked",
      entityType: "docket",
      details: { docketId, courtId, caseNumber, linkedAt },
    });

    try {
      const [matterRow] = await db.select({ tags: pcMattersTable.tags })
        .from(pcMattersTable).where(eq(pcMattersTable.id, matterId)).limit(1);
      interface LinkedDocketEntry { docketId: string; courtId?: string | null; caseNumber?: string | null; linkedAt: string }
      const existingTags = (matterRow?.tags ?? {}) as Record<string, unknown>;
      const existingDockets = Array.isArray(existingTags.linkedDockets) ? existingTags.linkedDockets as LinkedDocketEntry[] : [];
      const alreadyLinked = existingDockets.some(d => d.docketId === String(docketId));
      if (!alreadyLinked) {
        existingDockets.push({ docketId: String(docketId), courtId: courtId ?? null, caseNumber: caseNumber ?? null, linkedAt });
        await db.update(pcMattersTable)
          .set({ tags: { ...existingTags, linkedDockets: existingDockets }, updatedAt: new Date() })
          .where(eq(pcMattersTable.id, matterId));
      }
    } catch (e) {
      logger.warn({ e }, "Failed to update matter tags with canonical docket link");
    }

    sendSuccess(res, { matterId, docketId, courtId, caseNumber, linkedAt });
  } catch (err) {
    handleRouteError(res, err, "Failed to link docket to matter");
  }
});

router.get("/court/matters/:matterId/linked-dockets", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const matterId = parseInt(String(req.params.matterId), 10);
    if (isNaN(matterId)) return sendBadRequest(res, "Invalid matter ID");
    const orgId = getOrgId(req);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const events = await db
      .select()
      .from(pcAuditEventsTable)
      .where(
        and(
          eq(pcAuditEventsTable.matterId, matterId),
          eq(pcAuditEventsTable.action, "court.docket_linked"),
        ),
      )
      .orderBy(desc(pcAuditEventsTable.createdAt));
    const links = events.map(e => ({
      ...(e.details as Record<string, unknown>),
      matterId,
      linkedAt: e.createdAt.toISOString(),
      linkedBy: e.actorId,
    }));
    sendSuccess(res, { links, count: links.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch linked dockets");
  }
});

function hasPartnerRole(req: Request): boolean {
  const roles = req.user?.roles ?? [];
  return roles.some(r => ["partner", "super_admin", "admin"].includes(r))
    || (roles.length === 0 && process.env.NODE_ENV !== "production");
}

function handleEngineError(res: Response, err: unknown, fallback: string) {
  if (err != null && typeof err === "object" && "statusCode" in err && (err as { statusCode: unknown }).statusCode === 403) {
    return sendForbidden(res, (err instanceof Error ? err.message : null) ?? "Access denied");
  }
  handleRouteError(res, err, fallback);
}

/* ━━━ Privilege Engine: Read operations (attorney+ required) ━━━ */

router.get("/privilege/stats", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const orgId = getOrgId(req);
    const stats = await privilegeEngine.getStats(orgId);
    sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch privilege stats");
  }
});

router.get("/privilege/log", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string, 10) : undefined;
    const orgId = getOrgId(req);
    if (!matterId) return sendBadRequest(res, "matterId query parameter is required");
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const entries = await privilegeEngine.getPrivilegeLog(matterId, orgId);
    sendSuccess(res, { entries, count: entries.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch privilege log");
  }
});

router.get("/privilege/log/:matterId/production", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const matterId = parseInt(String(req.params.matterId), 10);
    if (isNaN(matterId)) return sendBadRequest(res, "Invalid matter ID");
    const orgId = getOrgId(req);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const result = await privilegeEngine.generatePrivilegeLogForProduction(matterId, orgId);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to generate production privilege log");
  }
});

router.get("/privilege/review-queue", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string, 10) : undefined;
    const orgId = getOrgId(req);
    const items = await privilegeEngine.getReviewQueue(orgId, matterId);
    sendSuccess(res, { items, count: items.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch review queue");
  }
});

/* ━━━ Privilege Engine: AI Classification (attorney+ required) ━━━ */

router.post("/privilege/classify", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const { content, authorRole, recipientRoles, subject } = req.body;
    if (!content) return sendBadRequest(res, "content is required");

    const orgId = getOrgId(req);

    const modelResult = await modelRouter.route({
      orgId,
      lane: "classification",
      taskType: "privilege_classification",
      input: {
        text: content,
        labels: ["attorney_client", "work_product", "joint_defense", "common_interest", "none"],
        context: { authorRole, recipientRoles, subject },
      },
    }).catch(() => null);

    const engineResult = await privilegeEngine.classifyContent(content, { authorRole, recipientRoles, subject });

    const modelConfidence: number = modelResult?.output?.confidence ?? 0.5;
    const finalResult = modelResult
      ? {
          suggestedType: engineResult.suggestedType,
          confidence: Math.min(1, modelConfidence * 0.4 + engineResult.confidence * 0.6),
          reasoning: engineResult.reasoning,
          model: modelResult.model,
          provider: modelResult.provider,
          source: "model_mesh_assisted",
        }
      : { ...engineResult, source: "rule_based_fallback" };

    sendSuccess(res, finalResult);
  } catch (err) {
    handleRouteError(res, err, "Classification failed");
  }
});

/* ━━━ Privilege Engine: Tag Entity (attorney+ required, DB-persisted) ━━━ */

router.post("/privilege/tag", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");

    const { entityType, entityId, matterId, title, documentType, date, author, recipients, subject, privilegeType } =
      req.body;

    if (!entityType || entityId == null || !matterId || !privilegeType) {
      return sendBadRequest(res, "entityType, entityId, matterId, and privilegeType are required");
    }
    if (privilegeType === "none") {
      return sendBadRequest(res, "Cannot tag with privilege type 'none' — use classify to assess");
    }

    const orgId = getOrgId(req);
    const actorId = req.user?.id as number | undefined;
    if (!await assertMatterAccess(parseInt(matterId, 10), orgId, res)) return;

    const result = await privilegeEngine.tagEntity({
      matterId: parseInt(matterId, 10),
      orgId,
      entityType,
      entityId: parseInt(String(entityId), 10),
      flagType: privilegeType,
      taggedBy: actorId,
      meta: { title, documentType, date, author, recipients, subject },
    });

    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to tag entity");
  }
});

/* ━━━ Privilege Engine: Resolve Review (attorney+ required, DB-persisted) ━━━ */

router.post("/privilege/review/:tagId/resolve", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");

    const tagId = parseInt(String(req.params.tagId), 10);
    if (isNaN(tagId)) return sendBadRequest(res, "Invalid tag ID");
    const { decision } = req.body;
    if (!decision || !["confirmed", "waived", "disputed"].includes(decision)) {
      return sendBadRequest(res, "decision must be confirmed, waived, or disputed");
    }

    const orgId = getOrgId(req);
    const actorId = req.user?.id as number | undefined;

    const result = await privilegeEngine.resolveReview(tagId, decision, actorId ?? 1, orgId);

    sendSuccess(res, result);
  } catch (err) {
    handleEngineError(res, err, "Failed to resolve review");
  }
});

/* ━━━ Privilege Engine: Clawback Request (attorney+ required, DB-persisted) ━━━ */

router.post("/privilege/clawback/:tagId", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");

    const tagId = parseInt(String(req.params.tagId), 10);
    if (isNaN(tagId)) return sendBadRequest(res, "Invalid tag ID");
    const { reason } = req.body;
    if (!reason) return sendBadRequest(res, "reason is required");

    const orgId = getOrgId(req);
    const actorId = req.user?.id as number | undefined;

    const result = await privilegeEngine.requestClawback(tagId, reason, actorId ?? 1, orgId);

    sendSuccess(res, result);
  } catch (err) {
    handleEngineError(res, err, "Failed to request clawback");
  }
});

/* ━━━ Privilege Engine: Export Safety Check (attorney+ required, DB-backed) ━━━ */

router.post("/privilege/export-check", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const { items } = req.body;
    if (!items || !Array.isArray(items)) return sendBadRequest(res, "items array required");
    const orgId = getOrgId(req);
    const result = await privilegeEngine.filterForExport(items, orgId);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Export check failed");
  }
});

/* ━━━ Copilot Workbench: AI Document Generation (attorney+ required, DB-persisted) ━━━ */

router.post("/copilot/generate-draft", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");

    const { draftType, matterId, groundingContext } = req.body;
    if (!draftType) return sendBadRequest(res, "draftType is required");

    const orgId = getOrgId(req);
    const actorId = req.user?.id as number | undefined;
    const matterIdInt = matterId ? parseInt(matterId, 10) : undefined;

    if (matterIdInt && !await assertMatterAccess(matterIdInt, orgId, res)) return;

    const prompt = buildDraftPrompt(draftType, groundingContext ?? {});

    const modelResult = await modelRouter
      .route({
        orgId,
        lane: "reasoning",
        taskType: `copilot_draft_${draftType}`,
        matterId: matterIdInt,
        input: { systemPrompt: DRAFT_SYSTEM_PROMPT, userPrompt: prompt, draftType },
        options: { timeout: 30000 },
      })
      .catch(() => null);

    const draftContent = modelResult?.output?.response ?? buildFallbackDraft(draftType, groundingContext ?? {});
    const privilegeFlag = ["legal_memo", "mediation_brief"].includes(draftType);

    let approvalId: number | undefined;
    if (matterIdInt) {
      try {
        const [approval] = await db
          .insert(pcApprovalRequestsTable)
          .values({
            matterId: matterIdInt,
            requestType: "filing",
            title: `AI Draft — ${draftType}`,
            description: draftContent.slice(0, 500),
            sourceBasis: { draftType, model: modelResult?.model, provider: modelResult?.provider, privilegeFlag, draftState: "ai_draft", versionSeq: 1, versionId: randomUUID() },
            requestedBy: actorId,
            status: "pending",
          })
          .returning({ id: pcApprovalRequestsTable.id });
        approvalId = approval.id;
      } catch (e) {
        logger.warn({ e }, "Failed to persist draft approval record");
      }
    }

    await emitCopilotAudit({
      orgId,
      matterId: matterIdInt,
      actorId,
      action: "draft_generated",
      toState: "ai_draft",
      details: { draftType, approvalId, privilegeFlag, model: modelResult?.model },
    });

    sendSuccess(res, {
      id: approvalId ? String(approvalId) : `draft_${Date.now()}`,
      draftType,
      matterId: matterIdInt,
      content: draftContent,
      state: "ai_draft",
      privilegeFlag,
      exportSafe: false,
      requiresReview: true,
      approvalId,
      disclaimer:
        "⚠️ AI-ASSISTED DRAFT — This document was generated with AI assistance and requires attorney review before use. It does not constitute legal advice.",
      model: modelResult?.model,
      provider: modelResult?.provider,
      source: modelResult ? "model_mesh" : "fallback_template",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Draft generation failed");
  }
});

router.post("/copilot/drafts/:draftId/advance", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");

    const draftId = String(req.params.draftId);
    const { toState, matterId } = req.body;

    if (!matterId) return sendBadRequest(res, "matterId is required to advance a draft");
    if (!toState) return sendBadRequest(res, "toState is required");

    const NEXT_VALID_STATE: Record<string, string> = {
      ai_draft: "attorney_review",
      attorney_review: "approved",
      approved: "final",
    };

    if (toState === "final" && !hasPartnerRole(req)) {
      return sendForbidden(res, "Partner or admin role required to sign off as final");
    }

    const orgId = getOrgId(req);
    const actorId = req.user?.id as number | undefined;
    const matterIdInt = parseInt(matterId, 10);
    if (isNaN(matterIdInt)) return sendBadRequest(res, "Invalid matterId");
    if (!await assertMatterAccess(matterIdInt, orgId, res)) return;

    const approvalId = parseInt(draftId, 10);
    if (isNaN(approvalId)) {
      return sendBadRequest(res, "draftId must be a persisted integer — demo/synthetic IDs cannot be advanced");
    }

    const [draftRecord] = await db
      .select({ id: pcApprovalRequestsTable.id, sourceBasis: pcApprovalRequestsTable.sourceBasis })
      .from(pcApprovalRequestsTable)
      .where(
        and(
          eq(pcApprovalRequestsTable.id, approvalId),
          eq(pcApprovalRequestsTable.matterId, matterIdInt),
        ),
      )
      .limit(1);

    if (!draftRecord) {
      return sendForbidden(res, "Draft not found or does not belong to this matter");
    }

    const basis = (draftRecord.sourceBasis ?? {}) as Record<string, unknown>;
    const storedState = (basis.draftState as string | undefined) ?? "ai_draft";
    const expectedNext = NEXT_VALID_STATE[storedState];

    if (!expectedNext) {
      return sendBadRequest(res, `Draft is in terminal state '${storedState}' and cannot be advanced`);
    }
    if (toState !== expectedNext) {
      return sendBadRequest(res, `Invalid transition from stored state '${storedState}': expected '${expectedNext}', got '${toState}'`);
    }

    const isDraftPrivileged = basis.privilegeFlag === true;
    if (isDraftPrivileged && (toState === "approved" || toState === "final")) {
      const stats = await privilegeEngine.getStats(orgId);
      if (stats.pendingReview > 0) {
        return sendForbidden(
          res,
          "Cannot approve a privileged draft while privilege reviews are pending for this organization. Resolve all privilege flags first.",
        );
      }
    }

    const advancedAt = new Date();
    const newVersionId = randomUUID();
    const newVersionSeq = ((basis.versionSeq as number | undefined) ?? 1) + 1;
    const updatedBasis: Record<string, unknown> = {
      ...basis,
      draftState: toState,
      versionId: newVersionId,
      versionSeq: newVersionSeq,
    };
    if (toState === "final") {
      updatedBasis.signedOffBy = actorId ?? null;
      updatedBasis.signedOffAt = advancedAt.toISOString();
    }

    const dbStatus = (toState === "approved" || toState === "final") ? "approved" : "pending";
    await db
      .update(pcApprovalRequestsTable)
      .set({ status: dbStatus, approvedBy: actorId, resolvedAt: advancedAt, sourceBasis: updatedBasis })
      .where(eq(pcApprovalRequestsTable.id, approvalId));

    await emitCopilotAudit({
      orgId,
      matterId: matterIdInt,
      actorId,
      action: "draft_state_advance",
      fromState: storedState,
      toState,
      details: {
        draftId,
        approvalId,
        fromState: storedState,
        toState,
        versionSnapshot: {
          versionId: newVersionId,
          versionSeq: newVersionSeq,
          transitionedAt: advancedAt.toISOString(),
          by: actorId ?? null,
          ...(toState === "final" ? { signedOffBy: actorId ?? null, signedOffAt: advancedAt.toISOString() } : {}),
        },
      },
    });

    sendSuccess(res, {
      draftId,
      approvalId,
      previousState: storedState,
      newState: toState,
      versionId: newVersionId,
      versionSeq: newVersionSeq,
      exportSafe: toState === "approved" || toState === "final",
      advancedAt: advancedAt.toISOString(),
      ...(toState === "final" ? { signedOffBy: actorId ?? null } : {}),
    });
  } catch (err) {
    handleRouteError(res, err, "Draft state advance failed");
  }
});

router.get("/copilot/drafts", authMiddleware(), async (req, res) => {
  try {
    if (!hasAttorneyRole(req)) return sendForbidden(res, "Attorney role required");
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string, 10) : undefined;
    const orgId = getOrgId(req);
    if (!matterId) return sendBadRequest(res, "matterId query parameter is required");
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const drafts = await db
      .select()
      .from(pcApprovalRequestsTable)
      .where(eq(pcApprovalRequestsTable.matterId, matterId))
      .orderBy(desc(pcApprovalRequestsTable.requestedAt));
    sendSuccess(res, { drafts, count: drafts.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch drafts");
  }
});

/* ━━━ Helpers ━━━ */

const DRAFT_SYSTEM_PROMPT = `You are PRISM Counsel AI, an expert legal document drafting assistant.
You generate structured legal document drafts grounded in the provided matter context.
All output must:
1. Be clearly marked as an AI-ASSISTED DRAFT requiring attorney review
2. Flag any claims lacking factual support as [UNVERIFIED]
3. Follow standard legal document formatting
4. Include explicit instruction to attorneys for review before use
You are not providing legal advice. Your output is a drafting aid only.`;

function buildDraftPrompt(draftType: string, context: Record<string, unknown>): string {
  const matterContext = context.matterTitle
    ? `Matter: ${context.matterTitle}`
    : "Matter: [MATTER TO BE SPECIFIED]";
  const caseNo = context.caseNumber ? `Case No.: ${context.caseNumber}` : "";

  const typeInstructions: Record<string, string> = {
    chronology: `Generate a structured chronology of events for this matter. Include incident date, medical treatment timeline, carrier communications, and offer history. Flag all unverified dates/amounts as [UNVERIFIED].`,
    demand_letter: `Generate a formal settlement demand letter with liability summary, damages breakdown with [AMOUNT] placeholders, settlement demand, and response deadline. Add [ATTORNEY REVIEW REQUIRED] to all amounts.`,
    legal_memo: `Generate an internal legal strategy memorandum (PRIVILEGED AND CONFIDENTIAL — WORK PRODUCT). Include executive summary, factual background, liability analysis, damages assessment, settlement posture, and recommended next actions.`,
    deposition_outline: `Generate a structured deposition outline with preliminary/background, relationship to matter, incident facts, damages-related questioning, impeachment opportunities, and document exhibit list.`,
    mediation_brief: `Generate a confidential mediation statement with introduction, factual overview, liability position, damages summary (CONFIDENTIAL — not for opposing party), and mediation goals.`,
    discovery_response: `Generate discovery response framework including general objections, interrogatory response templates with [ATTORNEY TO COMPLETE] placeholders, and document request responses with privilege log references.`,
  };

  return `${matterContext}
${caseNo}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

DRAFT TYPE: ${draftType}

${typeInstructions[draftType] ?? `Generate a ${draftType} document for this matter.`}

Matter context:
${JSON.stringify(context, null, 2)}`;
}

function buildFallbackDraft(draftType: string, context: Record<string, unknown>): string {
  return `[AI-ASSISTED DRAFT — ${draftType.toUpperCase()}]
⚠️ This document requires attorney review before any external use.

Matter: ${String(context.matterTitle ?? "[MATTER]")}
Generated: ${new Date().toLocaleString()}

[Model unavailable — template structure only. Complete all [PLACEHOLDER] sections before use.]

All factual claims require attorney verification against source documents.`;
}

export default router;
