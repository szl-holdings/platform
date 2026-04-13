import { Router, type IRouter } from "express";
import {
  db,
  firestormTradecraftDecisionsTable,
  firestormCaseMemoryTable,
  firestormAnalystNotebookTable,
  firestormTradecraftValidationAuditTable,
  insertFirestormTradecraftDecisionSchema,
  insertFirestormAnalystNotebookSchema,
  type InsertFirestormCaseMemory,
} from "@szl-holdings/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { queryEvidenceIndex, ingestDecisionToEvidenceIndex } from "../lib/tradecraft-evidence-store";
import { validateAndBuildDecision, type DecisionObjectType } from "@szl-holdings/ai-engine";

const router: IRouter = Router();

const DECISION_TYPE_ENUM = new Set([
  "TriageDecision", "IncidentAssessment", "RiskDecision", "EscalationDecision",
  "ApprovalRecommendation", "ResponsePlan", "ExecutiveBrief", "ControlGapFinding",
]);

async function upsertCaseMemoryFromDecision(
  caseId: string,
  incidentId: string | null,
  decision: { objectId: string; decisionType: string; summary: string; confidence: string; confidenceLabel: string; impactLevel: string; urgency: string; recommendedAction: string; approvalRequired: boolean; humanReviewRequired: boolean; gapsAndUnknowns: unknown[] },
): Promise<void> {
  const now = new Date();
  const decisionSnapshot = {
    objectId: decision.objectId,
    decisionType: decision.decisionType,
    summary: decision.summary,
    confidence: decision.confidence,
    confidenceLabel: decision.confidenceLabel,
    impactLevel: decision.impactLevel,
    urgency: decision.urgency,
    recommendedAction: decision.recommendedAction,
    approvalRequired: decision.approvalRequired,
    humanReviewRequired: decision.humanReviewRequired,
    gapsAndUnknowns: decision.gapsAndUnknowns,
    createdAt: now.toISOString(),
  };

  const existing = await db.select().from(firestormCaseMemoryTable).where(sql`${firestormCaseMemoryTable.caseId} = ${caseId}`);
  if (existing.length === 0) {
    const initialSummary = { totalDecisions: 1, lastDecisionAt: now.toISOString(), currentRiskLevel: decision.impactLevel, pendingApprovals: decision.approvalRequired ? 1 : 0, humanReviewRequired: decision.humanReviewRequired };
    await db.insert(firestormCaseMemoryTable).values({
      caseId, incidentId, phase: "triage",
      phaseHistory: [{ phase: "detection", enteredAt: now.toISOString(), exitedAt: now.toISOString() }, { phase: "triage", enteredAt: now.toISOString(), exitedAt: null }],
      decisions: [decisionSnapshot], evidenceSnapshots: [], analystNotes: [],
      changeLog: [{ changeId: `change_${Date.now()}`, fieldChanged: "decision_added", previousValue: null, newValue: decision.objectId, changedBy: "system", changedAt: now.toISOString(), decisionObjectId: decision.objectId }],
      summary: initialSummary, openedAt: now, lastUpdatedAt: now,
    });
  } else {
    const current = existing[0]!;
    const currentDecisions = Array.isArray(current.decisions) ? current.decisions as typeof decisionSnapshot[] : [];
    const updatedDecisions = [...currentDecisions, decisionSnapshot];
    const pendingApprovals = updatedDecisions.filter(d => d.approvalRequired).length;
    const humanReviewRequired = updatedDecisions.some(d => d.humanReviewRequired);
    const updatedSummary = { totalDecisions: updatedDecisions.length, lastDecisionAt: now.toISOString(), currentRiskLevel: decision.impactLevel, pendingApprovals, humanReviewRequired };
    const currentChangeLog = Array.isArray(current.changeLog) ? current.changeLog : [];
    await db.update(firestormCaseMemoryTable).set({
      decisions: updatedDecisions, summary: updatedSummary, lastUpdatedAt: now, updatedAt: now,
      changeLog: [...currentChangeLog, { changeId: `change_${Date.now()}`, fieldChanged: "decision_added", previousValue: null, newValue: decision.objectId, changedBy: "system", changedAt: now.toISOString(), decisionObjectId: decision.objectId }],
    }).where(sql`${firestormCaseMemoryTable.caseId} = ${caseId}`);
  }
}

router.get("/firestorm/tradecraft/decisions", authMiddleware({ required: true }), async (req, res) => {
  try {
    const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined;
    const incidentId = typeof req.query.incidentId === "string" ? req.query.incidentId : undefined;
    const decisionType = typeof req.query.decisionType === "string" ? req.query.decisionType : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const limit = Math.min(parseInt(typeof req.query.limit === "string" ? req.query.limit : "50", 10), 200);

    const conditions = [
      eq(firestormTradecraftDecisionsTable.tenantId, "default"),
      ...(caseId ? [eq(firestormTradecraftDecisionsTable.caseId, caseId)] : []),
      ...(incidentId ? [eq(firestormTradecraftDecisionsTable.incidentId, incidentId)] : []),
      ...(decisionType ? [eq(firestormTradecraftDecisionsTable.decisionType, decisionType as "TriageDecision")] : []),
      ...(status ? [eq(firestormTradecraftDecisionsTable.status, status as "active")] : []),
    ];
    const decisions = await db.select().from(firestormTradecraftDecisionsTable).where(and(...conditions)).orderBy(desc(firestormTradecraftDecisionsTable.createdAt)).limit(limit);
    sendSuccess(res, decisions);
  } catch (err) { handleRouteError(res, err, "Failed to list tradecraft decisions"); }
});

router.get("/firestorm/tradecraft/decisions/:objectId", authMiddleware({ required: true }), async (req, res) => {
  try {
    const [decision] = await db.select().from(firestormTradecraftDecisionsTable).where(and(
      sql`${firestormTradecraftDecisionsTable.objectId} = ${req.params.objectId}`,
      eq(firestormTradecraftDecisionsTable.tenantId, "default"),
    ));
    if (!decision) { sendNotFound(res, "Tradecraft Decision"); return; }
    sendSuccess(res, decision);
  } catch (err) { handleRouteError(res, err, "Failed to get tradecraft decision"); }
});

router.post("/firestorm/tradecraft/decisions", authMiddleware({ required: true }), async (req, res) => {
  try {
    const { randomUUID } = await import("crypto");
    const body = req.body as Record<string, unknown>;

    if (!body.decisionType || typeof body.decisionType !== "string" || !DECISION_TYPE_ENUM.has(body.decisionType)) {
      res.status(422).json({ error: "Invalid or missing decisionType. Must be one of the 8 supported decision object types." });
      return;
    }
    if (!body.summary || typeof body.summary !== "string" || body.summary.trim().length < 10) {
      res.status(422).json({ error: "summary is required and must be at least 10 characters." });
      return;
    }
    if (!body.recommendedAction || typeof body.recommendedAction !== "string") {
      res.status(422).json({ error: "recommendedAction is required." });
      return;
    }
    if (body.confidence !== undefined) {
      const conf = parseFloat(String(body.confidence));
      if (isNaN(conf) || conf < 0 || conf > 1) {
        res.status(422).json({ error: "confidence must be a number between 0 and 1." });
        return;
      }
    }

    const rawOutput = typeof body.rawOutput === "string" ? body.rawOutput : null;
    const tenantId = "default";
    const modelRoute = typeof body.modelRoute === "string" ? body.modelRoute : "unknown";

    const validationResult = validateAndBuildDecision(body, body.decisionType as DecisionObjectType, { tenantId, modelRoute, rawOutput });

    if (!validationResult.valid || !validationResult.object) {
      const { randomUUID: uuid422 } = await import("crypto");
      await db.insert(firestormTradecraftValidationAuditTable).values({
        auditId: uuid422(),
        decisionType: String(body.decisionType),
        tenantId: "default",
        caseId: typeof body.caseId === "string" ? body.caseId : null,
        incidentId: typeof body.incidentId === "string" ? body.incidentId : null,
        validationErrors: validationResult.errors as string[],
        rawOutput: rawOutput ?? null,
        rawPayload: body,
        modelRoute: typeof body.modelRoute === "string" ? body.modelRoute : "unknown",
        errorClass: "schema_validation",
        resolved: false,
      }).catch((auditErr) => { console.warn("[tradecraft] Failed to persist validation audit record — non-fatal", { auditErr }); });
      res.status(422).json({
        error: "Decision object failed structured validation. Payload does not satisfy the required schema for this decision type.",
        decisionType: body.decisionType,
        validationErrors: validationResult.errors,
        rawOutput,
      });
      return;
    }

    const validated = validationResult.object;
    const validationErrors: string[] = validationResult.errors;
    const policyClass = validated.policyClass;
    const issueStatement = validated.issueStatement;

    const data = insertFirestormTradecraftDecisionSchema.parse({
      objectId: typeof body.objectId === "string" ? body.objectId : validated.objectId,
      tenantId: validated.tenantId,
      caseId: typeof body.caseId === "string" ? body.caseId : (validated as { caseId?: string | null }).caseId ?? null,
      incidentId: typeof body.incidentId === "string" ? body.incidentId : (validated as { incidentId?: string | null }).incidentId ?? null,
      signalId: typeof body.signalId === "string" ? body.signalId : (validated as { signalId?: string | null }).signalId ?? null,
      decisionType: validated.decisionType,
      policyClass,
      schemaVersion: validated.schemaVersion,
      summary: validated.summary,
      issueStatement,
      evidenceRefs: validated.evidenceRefs,
      evidenceQuality: validated.evidenceQuality,
      assumptions: validated.assumptions,
      alternatives: validated.alternatives,
      confidence: String(validated.confidence),
      confidenceLabel: validated.confidenceLabel,
      confidenceStatement: validated.confidenceStatement,
      gapsAndUnknowns: validated.gapsAndUnknowns,
      impactLevel: validated.impactLevel,
      urgency: validated.urgency,
      recommendedAction: validated.recommendedAction,
      ownerSuggestion: validated.ownerSuggestion,
      approvalRequired: validated.approvalRequired,
      approvalReason: validated.approvalReason,
      humanReviewRequired: validated.humanReviewRequired,
      humanReviewReason: validated.humanReviewReason,
      modelRoute: validated.modelRoute,
      rawOutput: validated.rawOutput,
      decisionPayload: body as Record<string, unknown>,
      status: "active",
      validationErrors,
    });

    const [decision] = await db.insert(firestormTradecraftDecisionsTable).values(data).returning();

    if (decision.caseId) {
      await upsertCaseMemoryFromDecision(decision.caseId, decision.incidentId ?? null, {
        objectId: decision.objectId,
        decisionType: decision.decisionType,
        summary: decision.summary,
        confidence: String(decision.confidence ?? "0"),
        confidenceLabel: decision.confidenceLabel,
        impactLevel: decision.impactLevel,
        urgency: decision.urgency,
        recommendedAction: decision.recommendedAction,
        approvalRequired: decision.approvalRequired,
        humanReviewRequired: decision.humanReviewRequired,
        gapsAndUnknowns: Array.isArray(decision.gapsAndUnknowns) ? decision.gapsAndUnknowns : [],
      }).catch(err => { console.warn("[tradecraft] Failed to upsert case memory from decision — non-fatal", { err, caseId: decision.caseId }); });
    }

    ingestDecisionToEvidenceIndex({
      objectId: decision.objectId,
      decisionType: decision.decisionType,
      summary: decision.summary,
      caseId: decision.caseId ?? null,
      confidence: parseFloat(String(decision.confidence ?? "0")),
      recommendedAction: decision.recommendedAction,
      createdAt: decision.createdAt.toISOString(),
    }).catch(() => {});

    sendCreated(res, decision);
  } catch (err) { handleRouteError(res, err, "Failed to create tradecraft decision"); }
});

router.put("/firestorm/tradecraft/decisions/:objectId", authMiddleware({ required: true }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : null;
    const user = req.user;

    if (action === "approve" || action === "reject") {
      const canApprove = user && (user.roles.includes("admin") || user.roles.includes("super_admin") || user.roles.includes("ops"));
      if (!canApprove) {
        res.status(403).json({ error: "Forbidden: decision approval requires admin, super_admin, or ops role", code: "INSUFFICIENT_ROLE" });
        return;
      }
      const reviewerName = user.displayName ?? user.email ?? `user:${user.id}`;
      const decisionTenant = "default";

      if (action === "approve") {
        const [decision] = await db.update(firestormTradecraftDecisionsTable)
          .set({ approvedBy: reviewerName, approvedAt: new Date(), rejectedBy: null, rejectedAt: null, rejectionReason: null, updatedAt: new Date() })
          .where(and(sql`${firestormTradecraftDecisionsTable.objectId} = ${req.params.objectId}`, eq(firestormTradecraftDecisionsTable.tenantId, decisionTenant)))
          .returning();
        if (!decision) { sendNotFound(res, "Tradecraft Decision"); return; }
        sendSuccess(res, { ...decision, reviewStatus: "approved" });
        return;
      }

      const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason : null;
      const [decision] = await db.update(firestormTradecraftDecisionsTable)
        .set({ rejectedBy: reviewerName, rejectedAt: new Date(), approvedBy: null, approvedAt: null, rejectionReason, updatedAt: new Date() })
        .where(and(sql`${firestormTradecraftDecisionsTable.objectId} = ${req.params.objectId}`, eq(firestormTradecraftDecisionsTable.tenantId, decisionTenant)))
        .returning();
      if (!decision) { sendNotFound(res, "Tradecraft Decision"); return; }
      sendSuccess(res, { ...decision, reviewStatus: "rejected" });
      return;
    }

    const allowedUpdates = insertFirestormTradecraftDecisionSchema.omit({ approvedBy: true, approvedAt: true, rejectedBy: true, rejectedAt: true, rejectionReason: true }).partial().parse(body);
    const [decision] = await db.update(firestormTradecraftDecisionsTable)
      .set({ ...allowedUpdates, updatedAt: new Date() })
      .where(and(sql`${firestormTradecraftDecisionsTable.objectId} = ${req.params.objectId}`, eq(firestormTradecraftDecisionsTable.tenantId, "default")))
      .returning();
    if (!decision) { sendNotFound(res, "Tradecraft Decision"); return; }
    sendSuccess(res, decision);
  } catch (err) { handleRouteError(res, err, "Failed to update tradecraft decision"); }
});

router.get("/firestorm/tradecraft/case-memory/:caseId", authMiddleware({ required: true }), async (req, res) => {
  try {
    const [memory] = await db.select().from(firestormCaseMemoryTable).where(sql`${firestormCaseMemoryTable.caseId} = ${req.params.caseId}`);
    if (!memory) { sendNotFound(res, "Case Memory"); return; }
    sendSuccess(res, memory);
  } catch (err) { handleRouteError(res, err, "Failed to get case memory"); }
});

router.post("/firestorm/tradecraft/case-memory", authMiddleware({ required: true }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const caseId = typeof body.caseId === "string" ? body.caseId : null;
    if (!caseId) { res.status(400).json({ error: "caseId required" }); return; }
    const incidentId = typeof body.incidentId === "string" ? body.incidentId : null;
    const existing = await db.select().from(firestormCaseMemoryTable).where(sql`${firestormCaseMemoryTable.caseId} = ${caseId}`);
    if (existing.length > 0) { sendSuccess(res, existing[0]); return; }
    const now = new Date();
    const [memory] = await db.insert(firestormCaseMemoryTable).values({
      caseId, incidentId, phase: "detection",
      phaseHistory: [{ phase: "detection", enteredAt: now.toISOString(), exitedAt: null }],
      decisions: [], evidenceSnapshots: [], analystNotes: [], changeLog: [],
      summary: { totalDecisions: 0, lastDecisionAt: null, currentRiskLevel: null, pendingApprovals: 0, humanReviewRequired: false },
      openedAt: now, lastUpdatedAt: now,
    }).returning();
    sendCreated(res, memory);
  } catch (err) { handleRouteError(res, err, "Failed to create case memory"); }
});

router.put("/firestorm/tradecraft/case-memory/:caseId", authMiddleware({ required: true }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const phaseEnum = ["detection", "triage", "investigation", "containment", "eradication", "recovery", "closed"] as const;
    type CaseMemoryPhase = typeof phaseEnum[number];

    const update: Partial<InsertFirestormCaseMemory> & { lastUpdatedAt: Date; updatedAt: Date } = { lastUpdatedAt: new Date(), updatedAt: new Date() };

    if (typeof body.phase === "string" && (phaseEnum as readonly string[]).includes(body.phase)) {
      update.phase = body.phase as CaseMemoryPhase;
    }
    if (Array.isArray(body.phaseHistory)) update.phaseHistory = body.phaseHistory as Array<{ phase: string; enteredAt: string; exitedAt: string | null }>;
    if (Array.isArray(body.analystNotes)) update.analystNotes = body.analystNotes as Array<{ noteId: string; content: string; author: string; noteType: string; createdAt: string }>;
    if (Array.isArray(body.changeLog)) update.changeLog = body.changeLog as unknown[];
    if (typeof body.summary === "object" && body.summary !== null && !Array.isArray(body.summary)) update.summary = body.summary as Record<string, unknown>;
    if (typeof body.closedAt === "string") update.closedAt = new Date(body.closedAt);

    const [memory] = await db.update(firestormCaseMemoryTable).set(update).where(sql`${firestormCaseMemoryTable.caseId} = ${req.params.caseId}`).returning();
    if (!memory) { sendNotFound(res, "Case Memory"); return; }
    sendSuccess(res, memory);
  } catch (err) { handleRouteError(res, err, "Failed to update case memory"); }
});

router.get("/firestorm/tradecraft/notebook", authMiddleware({ required: true }), async (req, res) => {
  try {
    const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined;
    const incidentId = typeof req.query.incidentId === "string" ? req.query.incidentId : undefined;
    const isKey = req.query.isKey === "true" ? true : req.query.isKey === "false" ? false : undefined;
    const limit = Math.min(parseInt(typeof req.query.limit === "string" ? req.query.limit : "50", 10), 200);
    const noteConditions = [
      ...(caseId ? [eq(firestormAnalystNotebookTable.caseId, caseId)] : []),
      ...(incidentId ? [eq(firestormAnalystNotebookTable.incidentId, incidentId)] : []),
      ...(isKey !== undefined ? [eq(firestormAnalystNotebookTable.isKey, isKey)] : []),
    ];
    const notes = await db.select().from(firestormAnalystNotebookTable)
      .where(noteConditions.length > 0 ? and(...noteConditions) : undefined)
      .orderBy(desc(firestormAnalystNotebookTable.createdAt))
      .limit(limit);
    sendSuccess(res, notes);
  } catch (err) { handleRouteError(res, err, "Failed to list analyst notes"); }
});

router.post("/firestorm/tradecraft/notebook", authMiddleware({ required: true }), async (req, res) => {
  try {
    const { randomUUID } = await import("crypto");
    const body = req.body as Record<string, unknown>;
    if (!body.content || typeof body.content !== "string" || body.content.trim().length < 3) {
      res.status(422).json({ error: "content is required and must be at least 3 characters." });
      return;
    }
    const noteData = { ...body, noteId: typeof body.noteId === "string" ? body.noteId : `note_${randomUUID()}` };
    const data = insertFirestormAnalystNotebookSchema.parse(noteData);
    const [note] = await db.insert(firestormAnalystNotebookTable).values(data).returning();

    if (note.caseId) {
      const nowNote = new Date();
      const noteSnapshot = { noteId: note.noteId, content: `[${note.noteType}] ${note.isKey ? "KEY: " : ""}analyst note`, author: note.author, noteType: note.noteType, createdAt: nowNote.toISOString() };
      const changeEntry = { changeId: `change_${Date.now()}`, fieldChanged: "analyst_note_added", previousValue: null, newValue: note.noteId, changedBy: note.author, changedAt: nowNote.toISOString(), decisionObjectId: null };
      const existingCm = await db.select().from(firestormCaseMemoryTable).where(sql`${firestormCaseMemoryTable.caseId} = ${note.caseId}`);
      if (existingCm.length > 0) {
        const cm = existingCm[0]!;
        const currentNotes = Array.isArray(cm.analystNotes) ? (cm.analystNotes as typeof noteSnapshot[]) : [];
        const currentChangeLog = Array.isArray(cm.changeLog) ? (cm.changeLog as typeof changeEntry[]) : [];
        await db.update(firestormCaseMemoryTable)
          .set({ analystNotes: [...currentNotes, noteSnapshot], lastUpdatedAt: nowNote, updatedAt: nowNote, changeLog: [...currentChangeLog, changeEntry] })
          .where(sql`${firestormCaseMemoryTable.caseId} = ${note.caseId}`)
          .catch((err: unknown) => { console.warn("[tradecraft] Failed to auto-update case memory with note — non-fatal", { err }); });
      } else {
        await db.insert(firestormCaseMemoryTable).values({
          caseId: note.caseId, incidentId: note.incidentId ?? null, phase: "investigation",
          phaseHistory: [{ phase: "investigation", enteredAt: nowNote.toISOString(), exitedAt: null }],
          decisions: [], evidenceSnapshots: [], analystNotes: [noteSnapshot], changeLog: [changeEntry],
          summary: { totalDecisions: 0, lastDecisionAt: null, currentRiskLevel: "medium", pendingApprovals: 0, humanReviewRequired: false } as unknown as Record<string, unknown>,
          openedAt: nowNote, lastUpdatedAt: nowNote,
        }).catch((err: unknown) => { console.warn("[tradecraft] Failed to create case memory for note — non-fatal", { err }); });
      }
    }

    sendCreated(res, note);
  } catch (err) { handleRouteError(res, err, "Failed to create analyst note"); }
});

router.put("/firestorm/tradecraft/notebook/:noteId", authMiddleware({ required: true }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const data = insertFirestormAnalystNotebookSchema.partial().parse(body);
    const [note] = await db.update(firestormAnalystNotebookTable).set({ ...data, updatedAt: new Date() }).where(sql`${firestormAnalystNotebookTable.noteId} = ${req.params.noteId}`).returning();
    if (!note) { sendNotFound(res, "Analyst Note"); return; }
    sendSuccess(res, note);
  } catch (err) { handleRouteError(res, err, "Failed to update analyst note"); }
});

router.delete("/firestorm/tradecraft/notebook/:noteId", authMiddleware({ required: true }), async (req, res) => {
  try {
    const [note] = await db.delete(firestormAnalystNotebookTable).where(sql`${firestormAnalystNotebookTable.noteId} = ${req.params.noteId}`).returning();
    if (!note) { sendNotFound(res, "Analyst Note"); return; }
    sendNoContent(res);
  } catch (err) { handleRouteError(res, err, "Failed to delete analyst note"); }
});

router.get("/firestorm/tradecraft/evidence-index", authMiddleware({ required: true }), async (req, res) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "threat incident alert";
    const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined;
    const incidentId = typeof req.query.incidentId === "string" ? req.query.incidentId : undefined;
    const maxResults = Math.min(parseInt(typeof req.query.limit === "string" ? req.query.limit : "20", 10), 100);
    const minRelevance = typeof req.query.minRelevance === "string" ? parseFloat(req.query.minRelevance) : 0.0;
    const result = await queryEvidenceIndex({ query, caseId, incidentId, maxResults, minRelevance });
    sendSuccess(res, { entries: result.entries, totalIndexed: result.totalIndexed, method: result.method, confidenceDowngraded: result.confidenceDowngraded, confidenceDowngradeReason: result.confidenceDowngradeReason ?? null, weakRetrievalWarning: result.weakRetrievalWarning ?? null, latencyMs: result.latencyMs, indexedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to query evidence index"); }
});

router.post("/firestorm/tradecraft/evidence-index/query", authMiddleware({ required: true }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) { res.status(422).json({ error: "query string is required." }); return; }
    const caseId = typeof body.caseId === "string" ? body.caseId : undefined;
    const incidentId = typeof body.incidentId === "string" ? body.incidentId : undefined;
    const sourceTypes = Array.isArray(body.sourceTypes) ? (body.sourceTypes as string[]) : undefined;
    const maxResults = typeof body.maxResults === "number" ? Math.min(body.maxResults, 50) : 15;
    const minRelevance = typeof body.minRelevance === "number" ? body.minRelevance : 0.0;
    const result = await queryEvidenceIndex({ query, caseId, incidentId, sourceTypes, maxResults, minRelevance });
    sendSuccess(res, { query, entries: result.entries, totalIndexed: result.totalIndexed, method: result.method, confidenceDowngraded: result.confidenceDowngraded, confidenceDowngradeReason: result.confidenceDowngradeReason ?? null, weakRetrievalWarning: result.weakRetrievalWarning ?? null, latencyMs: result.latencyMs });
  } catch (err) { handleRouteError(res, err, "Failed to query evidence index"); }
});

export default router;
