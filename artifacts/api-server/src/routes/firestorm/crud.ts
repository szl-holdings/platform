import { Router, type IRouter, type RequestHandler } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { LRUCache } from "lru-cache";
import rateLimit from "express-rate-limit";
import {
  db,
  firestormScenariosTable,
  firestormAssessmentsTable,
  firestormSimulationRunsTable,
  firestormFindingsTable,
  firestormRiskScoresTable,
  firestormIncidentsTable,
  firestormAlertsTable,
  firestormAssetsTable,
  firestormWorkflowActionsTable,
  firestormHardeningControlsTable,
  firestormComplianceControlsTable,
  firestormCasesTable,
  firestormMitreDetectionsTable,
  firestormTradecraftDecisionsTable,
  firestormCaseMemoryTable,
  firestormAnalystNotebookTable,
  firestormTradecraftValidationAuditTable,
  insertFirestormScenarioSchema,
  insertFirestormAssessmentSchema,
  insertFirestormSimulationRunSchema,
  insertFirestormFindingSchema,
  insertFirestormRiskScoreSchema,
  insertFirestormIncidentSchema,
  insertFirestormAlertSchema,
  insertFirestormAssetSchema,
  insertFirestormWorkflowActionSchema,
  insertFirestormCaseSchema,
  insertFirestormTradecraftDecisionSchema,
  insertFirestormAnalystNotebookSchema,
  type InsertFirestormCaseMemory,
  alloyRuntimeAgentsTable,
  alloyRuntimeAgentVersionsTable,
  auditEventsTable,
} from "@szl-holdings/db";
import { REFERENCE_COMPLIANCE_CONTROLS } from "../readiness.js";
import { eq, desc, sql, inArray, and, or } from "drizzle-orm";
import { z } from "zod";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, sendError, handleRouteError } from "../../lib/api-response";
import { authMiddleware, parseIdParam } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import { validateIfMatch } from "../../middlewares/optimistic-concurrency";
import { queryEvidenceIndex, ingestDecisionToEvidenceIndex } from "../../lib/tradecraft-evidence-store";
import { validateAndBuildDecision, type DecisionObjectType } from "@szl-holdings/ai-engine";
import { broadcastWs, pubsub, FIRESTORM_EVENTS } from "../../lib/pubsub-bridge.js";
import {
  ingestFirestormFinding,
  ingestFirestormScenario,
  ingestFirestormAlert,
} from "@szl-holdings/ai-engine/domain-embedding-hooks";
import { firestormCrudLimit, getFirestormTenantId } from "./shared";
import { listQuerySchema, validateBody, validateQuery } from "../../lib/validation";
const router = Router();

router.get("/firestorm/scenarios", firestormCrudLimit, authMiddleware(), async (_req, res) => {
  try {
    const scenarios = await db.select().from(firestormScenariosTable).orderBy(desc(firestormScenariosTable.createdAt));
    sendSuccess(res, scenarios);
  } catch (err) {
    handleRouteError(res, err, "Failed to list scenarios");
  }
});

router.get("/firestorm/scenarios/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [scenario] = await db.select().from(firestormScenariosTable).where(eq(firestormScenariosTable.id, id));
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    sendSuccess(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to get scenario");
  }
});

router.post("/firestorm/scenarios", authMiddleware({ required: true }), validateBody(bodyShape({})), async (req, res) => {
  try {
    const data = insertFirestormScenarioSchema.parse(req.body);
    const [scenario] = await db.insert(firestormScenariosTable).values(data).returning();
    void ingestFirestormScenario(scenario, getFirestormTenantId(req));
    sendCreated(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to create scenario");
  }
});

router.put("/firestorm/scenarios/:id", authMiddleware({ required: true }), validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const data = insertFirestormScenarioSchema.partial().parse(req.body);
    const [scenario] = await db.update(firestormScenariosTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormScenariosTable.id, id)).returning();
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    void ingestFirestormScenario(scenario, getFirestormTenantId(req));
    sendSuccess(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to update scenario");
  }
});

router.delete("/firestorm/scenarios/:id", validateBody(bodyShape({})), authMiddleware({ required: true }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [scenario] = await db.delete(firestormScenariosTable).where(eq(firestormScenariosTable.id, id)).returning();
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete scenario");
  }
});

router.get("/firestorm/assessments", authMiddleware(), async (_req, res) => {
  try {
    const assessments = await db.select().from(firestormAssessmentsTable).orderBy(desc(firestormAssessmentsTable.createdAt));
    sendSuccess(res, assessments);
  } catch (err) {
    handleRouteError(res, err, "Failed to list assessments");
  }
});

router.get("/firestorm/assessments/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [assessment] = await db.select().from(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, id));
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to get assessment");
  }
});

router.post("/firestorm/assessments", authMiddleware({ required: true }), validateBody(bodyShape({})), async (req, res) => {
  try {
    const data = insertFirestormAssessmentSchema.parse(req.body);
    const [assessment] = await db.insert(firestormAssessmentsTable).values(data).returning();
    sendCreated(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to create assessment");
  }
});

router.put("/firestorm/assessments/:id", authMiddleware({ required: true }), validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const data = insertFirestormAssessmentSchema.partial().parse(req.body);
    const [assessment] = await db.update(firestormAssessmentsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormAssessmentsTable.id, id)).returning();
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to update assessment");
  }
});

router.delete("/firestorm/assessments/:id", validateBody(bodyShape({})), authMiddleware({ required: true }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [assessment] = await db.delete(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, id)).returning();
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete assessment");
  }
});

router.get("/firestorm/simulations", authMiddleware(), async (_req, res) => {
  try {
    const runs = await db.select().from(firestormSimulationRunsTable).orderBy(desc(firestormSimulationRunsTable.createdAt));
    sendSuccess(res, runs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list simulation runs");
  }
});

router.post("/firestorm/simulations", authMiddleware({ required: true }), validateBody(bodyShape({
      "mode": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const data = insertFirestormSimulationRunSchema.parse(req.body);
    const [run] = await db.insert(firestormSimulationRunsTable).values({
      ...data,
      status: "pending",
      mode: data.mode ?? "controlled",
    }).returning();

    await db.insert(firestormWorkflowActionsTable).values({
      entityType: "simulation",
      entityId: run.id,
      actionType: "escalate",
      status: "pending",
      notes: `Auto-triggered: simulation run created — scenario=${run.scenarioId ?? "unknown"}, mode=${run.mode}`,
      triggeredBy: "simulation-create-hook",
    });

    sendCreated(res, run);
  } catch (err) {
    handleRouteError(res, err, "Failed to create simulation run");
  }
});

router.get("/firestorm/simulations/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [run] = await db.select().from(firestormSimulationRunsTable).where(eq(firestormSimulationRunsTable.id, id));
    if (!run) { sendNotFound(res, "Simulation Run"); return; }
    sendSuccess(res, run);
  } catch (err) {
    handleRouteError(res, err, "Failed to get simulation run");
  }
});

router.get("/firestorm/findings", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string, 10) : undefined;
    const query = assessmentId
      ? db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.assessmentId, assessmentId)).orderBy(desc(firestormFindingsTable.createdAt))
      : db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt));
    const findings = await query;
    sendSuccess(res, findings);
  } catch (err) {
    handleRouteError(res, err, "Failed to list findings");
  }
});

router.get("/firestorm/findings/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const [finding] = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.id, id));
    if (!finding) { sendNotFound(res, "Finding"); return; }
    sendSuccess(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to get finding");
  }
});

router.post("/firestorm/findings", authMiddleware({ required: true }), validateBody(bodyShape({
      "dueDate": z.unknown().optional(),
      "recommendation": z.unknown().optional(),
      "remediationOwner": z.unknown().optional(),
      "severity": z.unknown().optional(),
      "status": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.dueDate === "string") body.dueDate = new Date(body.dueDate);
    const data = insertFirestormFindingSchema.parse(body);
    const confirmedOrOpen = data.status === "confirmed" || data.status === "open";
    if ((data.severity === "critical" || data.severity === "high") && confirmedOrOpen) {
      if (!data.remediationOwner) {
        sendError(res, "Remediation owner is required when creating a critical/high finding in confirmed or open status.", 422, "UNPROCESSABLE_ENTITY");
        return;
      }
      if (!data.dueDate) {
        sendError(res, "Due date is required when creating a critical/high finding in confirmed or open status.", 422, "UNPROCESSABLE_ENTITY");
        return;
      }
      if (!data.recommendation) {
        sendError(res, "Recommended action is required when creating a critical/high finding in confirmed or open status.", 422, "UNPROCESSABLE_ENTITY");
        return;
      }
    }
    const initAuditEntry = { action: "Finding created", user: "Operator", at: new Date().toISOString() };
    const [finding] = await db.insert(firestormFindingsTable).values({ ...data, auditTrail: [initAuditEntry] }).returning();
    broadcastWs("aegis-incidents", "finding-created", { id: finding.id, severity: finding.severity, status: finding.status });
    void ingestFirestormFinding(finding, getFirestormTenantId(req));
    sendCreated(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to create finding");
  }
});

router.put("/firestorm/findings/:id", authMiddleware({ required: true }), validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id as string);
    const data = insertFirestormFindingSchema.partial().parse(req.body);
    const [finding] = await db.update(firestormFindingsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormFindingsTable.id, id)).returning();
    if (!finding) { sendNotFound(res, "Finding"); return; }
    broadcastWs("aegis-incidents", "finding-updated", { id: finding.id, severity: finding.severity, status: finding.status });
    void ingestFirestormFinding(finding, getFirestormTenantId(req));
    sendSuccess(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to update finding");
  }
});

router.get("/firestorm/risk-scores", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string, 10) : undefined;
    const query = assessmentId
      ? db.select().from(firestormRiskScoresTable).where(eq(firestormRiskScoresTable.assessmentId, assessmentId)).orderBy(desc(firestormRiskScoresTable.calculatedAt))
      : db.select().from(firestormRiskScoresTable).orderBy(desc(firestormRiskScoresTable.calculatedAt));
    const scores = await query;
    sendSuccess(res, scores);
  } catch (err) {
    handleRouteError(res, err, "Failed to list risk scores");
  }
});

router.post("/firestorm/risk-scores", authMiddleware({ required: true }), validateBody(bodyShape({})), async (req, res) => {
  try {
    const data = insertFirestormRiskScoreSchema.parse(req.body);
    const [score] = await db.insert(firestormRiskScoresTable).values(data).returning();
    sendCreated(res, score);
  } catch (err) {
    handleRouteError(res, err, "Failed to create risk score");
  }
});

router.get("/firestorm/reports", authMiddleware(), async (_req, res) => {
  try {
    const assessments = await db.select().from(firestormAssessmentsTable).orderBy(desc(firestormAssessmentsTable.createdAt));
    const reports = await Promise.all(assessments.map(async (assessment) => {
      const findings = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.assessmentId, assessment.id));
      const bySeverity: Record<string, typeof findings> = { critical: [], high: [], medium: [], low: [], informational: [] };
      for (const f of findings) { (bySeverity[f.severity] ?? (bySeverity[f.severity] = [])).push(f); }
      return {
        id: assessment.id,
        name: assessment.name,
        assessmentType: assessment.assessmentType,
        status: assessment.status,
        createdAt: assessment.createdAt,
        totalFindings: findings.length,
        criticalCount: bySeverity.critical.length,
        highCount: bySeverity.high.length,
        mediumCount: bySeverity.medium.length,
        lowCount: bySeverity.low.length,
        openCount: findings.filter(f => f.status === "open" || f.status === "confirmed").length,
        mitigatedCount: findings.filter(f => f.status === "mitigated").length,
        findingsBySeverity: {
          critical: bySeverity.critical.map(f => ({ id: f.id, title: f.title, status: f.status, affectedAsset: f.affectedAsset, remediationOwner: f.remediationOwner, dueDate: f.dueDate })),
          high: bySeverity.high.map(f => ({ id: f.id, title: f.title, status: f.status, affectedAsset: f.affectedAsset, remediationOwner: f.remediationOwner, dueDate: f.dueDate })),
          medium: bySeverity.medium.map(f => ({ id: f.id, title: f.title, status: f.status, affectedAsset: f.affectedAsset, remediationOwner: f.remediationOwner, dueDate: f.dueDate })),
          low: bySeverity.low.map(f => ({ id: f.id, title: f.title, status: f.status, affectedAsset: f.affectedAsset, remediationOwner: f.remediationOwner, dueDate: f.dueDate })),
        },
      };
    }));
    sendSuccess(res, reports);
  } catch (err) {
    handleRouteError(res, err, "Failed to list reports");
  }
});

router.get("/firestorm/reports/export-summary", authMiddleware(), async (_req, res) => {
  try {
    const findings = await db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt));
    const bySeverity: Record<string, typeof findings> = { critical: [], high: [], medium: [], low: [] };
    for (const f of findings) { if (bySeverity[f.severity]) bySeverity[f.severity].push(f); }
    const criticalUnowned = bySeverity.critical.filter(f => !f.remediationOwner);
    const highUnowned = bySeverity.high.filter(f => !f.remediationOwner);
    const overdue = findings.filter(f => f.dueDate && new Date(f.dueDate) < new Date() && f.status !== "mitigated" && f.status !== "accepted");
    sendSuccess(res, {
      exportedAt: new Date().toISOString(),
      totalFindings: findings.length,
      criticalCount: bySeverity.critical.length,
      highCount: bySeverity.high.length,
      mediumCount: bySeverity.medium.length,
      lowCount: bySeverity.low.length,
      unownedCritical: criticalUnowned.length,
      unownedHigh: highUnowned.length,
      overdueCount: overdue.length,
      findingsBySeverity: {
        critical: bySeverity.critical.map(f => ({ id: f.id, title: f.title, status: f.status, affectedAsset: f.affectedAsset, remediationOwner: f.remediationOwner, dueDate: f.dueDate, recommendation: f.recommendation, auditTrail: f.auditTrail })),
        high: bySeverity.high.map(f => ({ id: f.id, title: f.title, status: f.status, affectedAsset: f.affectedAsset, remediationOwner: f.remediationOwner, dueDate: f.dueDate, recommendation: f.recommendation, auditTrail: f.auditTrail })),
        medium: bySeverity.medium.map(f => ({ id: f.id, title: f.title, status: f.status, affectedAsset: f.affectedAsset, remediationOwner: f.remediationOwner, dueDate: f.dueDate })),
        low: bySeverity.low.map(f => ({ id: f.id, title: f.title, status: f.status, affectedAsset: f.affectedAsset })),
      },
      overdueFindings: overdue.map(f => ({ id: f.id, title: f.title, severity: f.severity, dueDate: f.dueDate, remediationOwner: f.remediationOwner })),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate export summary");
  }
});

router.get("/firestorm/reports/:assessmentId", authMiddleware(), async (req, res) => {
  try {
    const assessmentId = parseIdParam(req.params.assessmentId as string);
    const [assessment] = await db.select().from(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, assessmentId));
    if (!assessment) { sendNotFound(res, "Assessment"); return; }

    const findings = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.assessmentId, assessmentId));
    const riskScores = await db.select().from(firestormRiskScoresTable).where(eq(firestormRiskScoresTable.assessmentId, assessmentId));
    const simulations = await db.select().from(firestormSimulationRunsTable).where(eq(firestormSimulationRunsTable.assessmentId, assessmentId));

    const criticalCount = findings.filter(f => f.severity === "critical").length;
    const highCount = findings.filter(f => f.severity === "high").length;
    const mediumCount = findings.filter(f => f.severity === "medium").length;
    const lowCount = findings.filter(f => f.severity === "low").length;

    sendSuccess(res, {
      assessment,
      summary: {
        totalFindings: findings.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        simulationsRun: simulations.length,
        riskCategories: riskScores.length,
      },
      findings,
      riskScores,
      simulations,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate report");
  }
});



export function register(r: IRouter): void { r.use(router); }
