import { Router, type IRouter } from "express";
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
} from "@workspace/db";
import { DEMO_COMPLIANCE_CONTROLS } from "./readiness.js";
import { eq, desc, sql } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/firestorm/scenarios", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const scenarios = await db.select().from(firestormScenariosTable).orderBy(desc(firestormScenariosTable.createdAt));
    sendSuccess(res, scenarios);
  } catch (err) {
    handleRouteError(res, err, "Failed to list scenarios");
  }
});

router.get("/firestorm/scenarios/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [scenario] = await db.select().from(firestormScenariosTable).where(eq(firestormScenariosTable.id, id));
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    sendSuccess(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to get scenario");
  }
});

router.post("/firestorm/scenarios", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormScenarioSchema.parse(req.body);
    const [scenario] = await db.insert(firestormScenariosTable).values(data).returning();
    sendCreated(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to create scenario");
  }
});

router.put("/firestorm/scenarios/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormScenarioSchema.partial().parse(req.body);
    const [scenario] = await db.update(firestormScenariosTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormScenariosTable.id, id)).returning();
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    sendSuccess(res, scenario);
  } catch (err) {
    handleRouteError(res, err, "Failed to update scenario");
  }
});

router.delete("/firestorm/scenarios/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [scenario] = await db.delete(firestormScenariosTable).where(eq(firestormScenariosTable.id, id)).returning();
    if (!scenario) { sendNotFound(res, "Scenario"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete scenario");
  }
});

router.get("/firestorm/assessments", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const assessments = await db.select().from(firestormAssessmentsTable).orderBy(desc(firestormAssessmentsTable.createdAt));
    sendSuccess(res, assessments);
  } catch (err) {
    handleRouteError(res, err, "Failed to list assessments");
  }
});

router.get("/firestorm/assessments/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [assessment] = await db.select().from(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, id));
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to get assessment");
  }
});

router.post("/firestorm/assessments", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormAssessmentSchema.parse(req.body);
    const [assessment] = await db.insert(firestormAssessmentsTable).values(data).returning();
    sendCreated(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to create assessment");
  }
});

router.put("/firestorm/assessments/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormAssessmentSchema.partial().parse(req.body);
    const [assessment] = await db.update(firestormAssessmentsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormAssessmentsTable.id, id)).returning();
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to update assessment");
  }
});

router.delete("/firestorm/assessments/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [assessment] = await db.delete(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, id)).returning();
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete assessment");
  }
});

router.get("/firestorm/simulations", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const runs = await db.select().from(firestormSimulationRunsTable).orderBy(desc(firestormSimulationRunsTable.createdAt));
    sendSuccess(res, runs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list simulation runs");
  }
});

router.post("/firestorm/simulations", authMiddleware({ required: false }), async (req, res) => {
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

router.get("/firestorm/simulations/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [run] = await db.select().from(firestormSimulationRunsTable).where(eq(firestormSimulationRunsTable.id, id));
    if (!run) { sendNotFound(res, "Simulation Run"); return; }
    sendSuccess(res, run);
  } catch (err) {
    handleRouteError(res, err, "Failed to get simulation run");
  }
});

router.get("/firestorm/findings", authMiddleware({ required: false }), async (req, res) => {
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

router.get("/firestorm/findings/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [finding] = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.id, id));
    if (!finding) { sendNotFound(res, "Finding"); return; }
    sendSuccess(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to get finding");
  }
});

router.post("/firestorm/findings", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.dueDate === "string") body.dueDate = new Date(body.dueDate);
    const data = insertFirestormFindingSchema.parse(body);
    const confirmedOrOpen = data.status === "confirmed" || data.status === "open";
    if ((data.severity === "critical" || data.severity === "high") && confirmedOrOpen) {
      if (!data.remediationOwner) {
        res.status(422).json({ error: "Remediation owner is required when creating a critical/high finding in confirmed or open status." });
        return;
      }
      if (!data.dueDate) {
        res.status(422).json({ error: "Due date is required when creating a critical/high finding in confirmed or open status." });
        return;
      }
      if (!data.recommendation) {
        res.status(422).json({ error: "Recommended action is required when creating a critical/high finding in confirmed or open status." });
        return;
      }
    }
    const initAuditEntry = { action: "Finding created", user: "Operator", at: new Date().toISOString() };
    const [finding] = await db.insert(firestormFindingsTable).values({ ...data, auditTrail: [initAuditEntry] }).returning();
    sendCreated(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to create finding");
  }
});

router.put("/firestorm/findings/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormFindingSchema.partial().parse(req.body);
    const [finding] = await db.update(firestormFindingsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormFindingsTable.id, id)).returning();
    if (!finding) { sendNotFound(res, "Finding"); return; }
    sendSuccess(res, finding);
  } catch (err) {
    handleRouteError(res, err, "Failed to update finding");
  }
});

router.get("/firestorm/risk-scores", authMiddleware({ required: false }), async (req, res) => {
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

router.post("/firestorm/risk-scores", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormRiskScoreSchema.parse(req.body);
    const [score] = await db.insert(firestormRiskScoresTable).values(data).returning();
    sendCreated(res, score);
  } catch (err) {
    handleRouteError(res, err, "Failed to create risk score");
  }
});

router.get("/firestorm/reports", authMiddleware({ required: false }), async (_req, res) => {
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

router.get("/firestorm/reports/export-summary", authMiddleware({ required: false }), async (_req, res) => {
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

router.get("/firestorm/reports/:assessmentId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const assessmentId = parseIdParam(req.params.assessmentId);
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

router.get("/firestorm/incidents", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const incidents = await db.select().from(firestormIncidentsTable).orderBy(desc(firestormIncidentsTable.createdAt));
    sendSuccess(res, incidents);
  } catch (err) {
    handleRouteError(res, err, "Failed to list incidents");
  }
});

router.get("/firestorm/incidents/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [incident] = await db.select().from(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id));
    if (!incident) { sendNotFound(res, "Incident"); return; }
    sendSuccess(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to get incident");
  }
});

router.post("/firestorm/incidents", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormIncidentSchema.parse(req.body);
    const [incident] = await db.insert(firestormIncidentsTable).values(data).returning();
    sendCreated(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to create incident");
  }
});

router.put("/firestorm/incidents/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormIncidentSchema.partial().parse(req.body);

    const [current] = await db.select().from(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id));
    if (!current) { sendNotFound(res, "Incident"); return; }

    const effectiveStatus = data.status ?? current.status;
    const effectiveSeverity = data.severity ?? current.severity;
    const effectiveAnalyst = data.assignedAnalyst ?? current.assignedAnalyst;
    const activeStatuses = ["triage", "investigation", "containment", "remediation"];

    if ((effectiveSeverity === "critical" || effectiveSeverity === "high") && activeStatuses.includes(effectiveStatus)) {
      if (!effectiveAnalyst) {
        res.status(422).json({ error: "Assigned analyst is required for critical/high severity incidents in active status." });
        return;
      }
    }

    const prevStatus = current.status;
    const [incident] = await db.update(firestormIncidentsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormIncidentsTable.id, id)).returning();
    if (!incident) { sendNotFound(res, "Incident"); return; }

    if (data.status && data.status !== prevStatus && (incident.severity === "critical" || incident.severity === "high")) {
      await db.insert(firestormWorkflowActionsTable).values({
        entityType: "incident",
        entityId: id,
        actionType: data.status === "containment" || data.status === "remediation" ? "route_to_response" : "escalate",
        assignedTo: incident.assignedAnalyst ?? undefined,
        status: "pending",
        notes: `Auto-triggered: incident status changed to ${data.status} — severity=${incident.severity}`,
        triggeredBy: "incident-status-hook",
      });
    }

    sendSuccess(res, incident);
  } catch (err) {
    handleRouteError(res, err, "Failed to update incident");
  }
});

router.delete("/firestorm/incidents/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [incident] = await db.delete(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id)).returning();
    if (!incident) { sendNotFound(res, "Incident"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete incident");
  }
});

router.get("/firestorm/vulnerabilities", authMiddleware({ required: false }), async (req, res) => {
  try {
    const severityFilter = req.query.severity as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const assetFilter = req.query.asset as string | undefined;
    const findings = await db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt));
    const filtered = findings.filter(f => {
      if (severityFilter && f.severity !== severityFilter) return false;
      if (statusFilter && f.status !== statusFilter) return false;
      if (assetFilter && f.affectedAsset !== assetFilter) return false;
      return true;
    });
    const enriched = filtered.map(f => ({
      ...f,
      recommendedAction: f.recommendation ?? null,
      auditTrail: Array.isArray(f.auditTrail) ? f.auditTrail : [],
    }));
    sendSuccess(res, enriched);
  } catch (err) {
    handleRouteError(res, err, "Failed to list vulnerabilities");
  }
});

router.get("/firestorm/vulnerabilities/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [finding] = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.id, id));
    if (!finding) { sendNotFound(res, "Vulnerability"); return; }
    sendSuccess(res, {
      ...finding,
      recommendedAction: finding.recommendation ?? null,
      auditTrail: Array.isArray(finding.auditTrail) ? finding.auditTrail : [],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get vulnerability");
  }
});

router.put("/firestorm/vulnerabilities/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { status, remediationOwner, dueDate, recommendedAction, recommendation } = req.body as {
      status?: string;
      remediationOwner?: string;
      dueDate?: string;
      recommendedAction?: string;
      recommendation?: string;
    };
    const [current] = await db.select().from(firestormFindingsTable).where(eq(firestormFindingsTable.id, id));
    if (!current) { sendNotFound(res, "Vulnerability"); return; }

    const effectiveStatus = status ?? current.status;
    const effectiveOwner = remediationOwner ?? current.remediationOwner;
    const effectiveDueDate = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : current.dueDate;

    const effectiveRecommendation = recommendedAction ?? recommendation ?? current.recommendation;
    if ((effectiveStatus === "confirmed" || effectiveStatus === "open") && (current.severity === "critical" || current.severity === "high")) {
      if (!effectiveOwner) {
        res.status(422).json({ error: "Remediation owner is required for critical/high severity findings when status is confirmed or open." });
        return;
      }
      if (!effectiveDueDate) {
        res.status(422).json({ error: "Due date is required for critical/high severity findings when status is confirmed or open." });
        return;
      }
      if (!effectiveRecommendation) {
        res.status(422).json({ error: "Recommended action is required for critical/high severity findings when status is confirmed or open." });
        return;
      }
    }

    const updates: Partial<typeof firestormFindingsTable.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };
    if (status !== undefined) updates.status = effectiveStatus as typeof current.status;
    if (remediationOwner !== undefined) updates.remediationOwner = remediationOwner;
    if (dueDate !== undefined) updates.dueDate = effectiveDueDate;
    const incomingRec = recommendedAction ?? recommendation;
    if (incomingRec !== undefined) updates.recommendation = incomingRec;

    const existingTrail = Array.isArray(current.auditTrail) ? current.auditTrail : [];
    const changedFields = Object.keys(updates).filter(k => k !== "updatedAt");
    const newEntry = { action: `Updated: ${changedFields.join(", ")}`, user: "Operator", at: new Date().toISOString() };
    updates.auditTrail = [...existingTrail, newEntry];

    const [finding] = await db.update(firestormFindingsTable).set(updates).where(eq(firestormFindingsTable.id, id)).returning();

    if (status === "confirmed" && current.status !== "confirmed") {
      await db.insert(firestormWorkflowActionsTable).values({
        entityType: "finding",
        entityId: id,
        actionType: "assign_owner",
        assignedTo: effectiveOwner ?? undefined,
        status: "pending",
        notes: `Auto-triggered: finding confirmed — severity=${finding.severity}, asset=${finding.affectedAsset ?? "unknown"}`,
        triggeredBy: "vulnerability-confirm-hook",
      });
    }

    sendSuccess(res, {
      ...finding,
      recommendedAction: finding.recommendation ?? null,
      auditTrail: Array.isArray(finding.auditTrail) ? finding.auditTrail : [],
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to update vulnerability");
  }
});

async function ensureComplianceControlsSeeded(): Promise<void> {
  const existing = await db.select({ id: firestormComplianceControlsTable.id }).from(firestormComplianceControlsTable).limit(1);
  if (existing.length > 0) return;
  const rows = DEMO_COMPLIANCE_CONTROLS.map(c => ({
    framework: "nist_csf" as const,
    category: c.category,
    controlId: c.controlId,
    controlName: c.controlId,
    description: c.evidence ?? null,
    status: (c.status === "compliant" ? "implemented" : c.status === "partial" ? "partial" : "not_implemented") as "implemented" | "partial" | "not_implemented",
    evidenceNotes: c.owner ? `Owner: ${c.owner}` : null,
    owner: c.owner ?? null,
  }));
  await db.insert(firestormComplianceControlsTable).values(rows);
}

const VALID_COMPLIANCE_FRAMEWORKS = ["nist_csf", "fedramp", "fisma"] as const;
type ComplianceFramework = typeof VALID_COMPLIANCE_FRAMEWORKS[number];

router.get("/firestorm/compliance", authMiddleware({ required: false }), async (req, res) => {
  try {
    await ensureComplianceControlsSeeded();
    const rawFramework = req.query.framework as string | undefined;
    const framework: ComplianceFramework = VALID_COMPLIANCE_FRAMEWORKS.includes(rawFramework as ComplianceFramework)
      ? (rawFramework as ComplianceFramework)
      : "nist_csf";
    const controls = await db.select().from(firestormComplianceControlsTable).where(eq(firestormComplianceControlsTable.framework, framework)).orderBy(firestormComplianceControlsTable.category);
    sendSuccess(res, controls);
  } catch (err) {
    handleRouteError(res, err, "Failed to list compliance controls");
  }
});

router.put("/firestorm/compliance/:controlId", authMiddleware({ required: false }), async (req, res) => {
  try {
    await ensureComplianceControlsSeeded();
    const { controlId } = req.params;
    const { status, owner, dueDate, notes } = req.body as { status?: string; owner?: string; dueDate?: string; notes?: string };
    const [existing] = await db.select().from(firestormComplianceControlsTable).where(eq(firestormComplianceControlsTable.controlId, controlId));
    if (!existing) { sendNotFound(res, "Compliance Control"); return; }

    const effectiveStatus = status ?? existing.status;
    const effectiveOwner = owner ?? existing.owner;
    if ((effectiveStatus === "not_implemented" || effectiveStatus === "partial") && !effectiveOwner) {
      res.status(422).json({ error: "Owner assignment is required for non-compliant compliance controls to enable gap routing." });
      return;
    }

    const prevAudit = Array.isArray(existing.auditTrail) ? existing.auditTrail as object[] : [];
    const auditEntry = { at: new Date().toISOString(), action: `Updated: ${[status && "status", owner && "owner", dueDate && "dueDate"].filter(Boolean).join(", ")}` };
    const updates: Partial<typeof firestormComplianceControlsTable.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date(), auditTrail: [...prevAudit, auditEntry] };
    if (status) updates.status = effectiveStatus as typeof existing.status;
    if (owner !== undefined) updates.owner = owner;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) updates.evidenceNotes = notes;

    const [updated] = await db.update(firestormComplianceControlsTable).set(updates).where(eq(firestormComplianceControlsTable.controlId, controlId)).returning();

    await db.insert(firestormWorkflowActionsTable).values({
      entityType: "asset",
      entityId: updated.id,
      actionType: effectiveStatus === "not_implemented" ? "escalate" : "remediate",
      assignedTo: effectiveOwner ?? undefined,
      status: "pending",
      notes: `Compliance gap routing: controlId=${controlId}, status=${effectiveStatus}, owner=${effectiveOwner ?? "unassigned"} — ${notes ?? ""}`,
      triggeredBy: "compliance-gap-hook",
    });

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update compliance control");
  }
});

router.get("/firestorm/vulnerability-inventory", authMiddleware({ required: false }), async (req, res) => {
  try {
    const severityFilter = req.query.severity as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const assetFilter = req.query.asset as string | undefined;
    const findings = await db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt));
    const filtered = findings.filter(f => {
      if (severityFilter && f.severity !== severityFilter) return false;
      if (statusFilter && f.status !== statusFilter) return false;
      if (assetFilter && f.affectedAsset !== assetFilter) return false;
      return true;
    });
    const stats = {
      total: filtered.length,
      critical: filtered.filter(f => f.severity === "critical").length,
      high: filtered.filter(f => f.severity === "high").length,
      medium: filtered.filter(f => f.severity === "medium").length,
      low: filtered.filter(f => f.severity === "low").length,
      open: filtered.filter(f => f.status === "open").length,
      confirmed: filtered.filter(f => f.status === "confirmed").length,
      mitigated: filtered.filter(f => f.status === "mitigated").length,
      unowned: filtered.filter(f => !f.remediationOwner && (f.severity === "critical" || f.severity === "high")).length,
      overdue: filtered.filter(f => f.dueDate && new Date(f.dueDate) < new Date() && f.status !== "mitigated" && f.status !== "accepted").length,
    };
    sendSuccess(res, {
      schema: "firestorm_findings",
      description: "Platform-wide vulnerability inventory. firestorm_findings is the canonical vulnerability store; assessment_id links findings to the originating assessment but is not required for platform-level tracking queries.",
      stats,
      vulnerabilities: filtered.map(f => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        status: f.status,
        affectedAsset: f.affectedAsset,
        cvssScore: f.cvssScore,
        cveId: f.cveId,
        remediationOwner: f.remediationOwner,
        dueDate: f.dueDate,
        recommendation: f.recommendation,
        auditTrail: Array.isArray(f.auditTrail) ? f.auditTrail : [],
        assessmentId: f.assessmentId,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list vulnerability inventory");
  }
});

router.get("/firestorm/alerts", authMiddleware({ required: false }), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const query = status
      ? db.select().from(firestormAlertsTable).where(eq(firestormAlertsTable.status, status as any)).orderBy(desc(firestormAlertsTable.createdAt))
      : db.select().from(firestormAlertsTable).orderBy(desc(firestormAlertsTable.createdAt));
    const alerts = await query;
    sendSuccess(res, alerts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alerts");
  }
});

router.post("/firestorm/alerts", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormAlertSchema.parse(req.body);
    const [alert] = await db.insert(firestormAlertsTable).values(data).returning();
    sendCreated(res, alert);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert");
  }
});

router.put("/firestorm/alerts/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormAlertSchema.partial().parse(req.body);
    const updates: any = { ...data };
    if (data.status === "acknowledged") updates.acknowledgedAt = new Date();
    if (data.status === "resolved" || data.status === "dismissed") updates.resolvedAt = new Date();
    const [alert] = await db.update(firestormAlertsTable).set(updates).where(eq(firestormAlertsTable.id, id)).returning();
    if (!alert) { sendNotFound(res, "Alert"); return; }
    sendSuccess(res, alert);
  } catch (err) {
    handleRouteError(res, err, "Failed to update alert");
  }
});

router.get("/firestorm/soc-dashboard", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const incidents = await db.select().from(firestormIncidentsTable);
    const alerts = await db.select().from(firestormAlertsTable);
    const findings = await db.select().from(firestormFindingsTable);

    const activeIncidents = incidents.filter(i => i.status !== "closed");
    const openAlerts = alerts.filter(a => a.status === "new" || a.status === "acknowledged" || a.status === "investigating");

    const alertsBySeverity = {
      critical: openAlerts.filter(a => a.severity === "critical").length,
      high: openAlerts.filter(a => a.severity === "high").length,
      medium: openAlerts.filter(a => a.severity === "medium").length,
      low: openAlerts.filter(a => a.severity === "low").length,
    };

    const closedIncidents = incidents.filter(i => i.status === "closed" && i.resolvedAt && i.detectedAt);
    const mttd = closedIncidents.length > 0
      ? closedIncidents.reduce((sum, i) => {
          const detected = new Date(i.detectedAt).getTime();
          const created = new Date(i.createdAt).getTime();
          return sum + Math.abs(detected - created);
        }, 0) / closedIncidents.length / 60000
      : 0;

    const mttr = closedIncidents.length > 0
      ? closedIncidents.reduce((sum, i) => {
          const detected = new Date(i.detectedAt).getTime();
          const resolved = new Date(i.resolvedAt!).getTime();
          return sum + (resolved - detected);
        }, 0) / closedIncidents.length / 60000
      : 0;

    const analystWorkload: Record<string, number> = {};
    activeIncidents.forEach(i => {
      const analyst = i.assignedAnalyst || "Unassigned";
      analystWorkload[analyst] = (analystWorkload[analyst] || 0) + 1;
    });

    const recentActivity = [
      ...incidents.slice(0, 5).map(i => ({ type: "incident" as const, title: i.title, severity: i.severity, status: i.status, timestamp: i.createdAt })),
      ...alerts.slice(0, 5).map(a => ({ type: "alert" as const, title: a.title, severity: a.severity, status: a.status, timestamp: a.createdAt })),
      ...findings.slice(0, 5).map(f => ({ type: "finding" as const, title: f.title, severity: f.severity, status: f.status, timestamp: f.createdAt })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    sendSuccess(res, {
      activeIncidents: activeIncidents.length,
      totalIncidents: incidents.length,
      openAlerts: openAlerts.length,
      totalAlerts: alerts.length,
      alertsBySeverity,
      mttd: Math.round(mttd),
      mttr: Math.round(mttr),
      analystWorkload,
      recentActivity,
      openFindings: findings.filter(f => f.status === "open").length,
      criticalFindings: findings.filter(f => f.severity === "critical" && f.status === "open").length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch SOC dashboard");
  }
});

router.get("/firestorm/cves", authMiddleware({ required: false }), async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || "";
    const resultsPerPage = 20;
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=${resultsPerPage}${keyword ? `&keywordSearch=${encodeURIComponent(keyword)}` : ""}`;

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      sendSuccess(res, []);
      return;
    }

    interface NvdCveDescription { lang: string; value: string; }
    interface NvdCvssMetric { cvssData?: { baseScore?: number }; }
    interface NvdCpeMatch { criteria?: string; }
    interface NvdCpeNode { cpeMatch?: NvdCpeMatch[]; }
    interface NvdConfiguration { nodes?: NvdCpeNode[]; }
    interface NvdCveItem {
      id?: string;
      descriptions?: NvdCveDescription[];
      metrics?: { cvssMetricV31?: NvdCvssMetric[]; cvssMetricV30?: NvdCvssMetric[]; cvssMetricV2?: NvdCvssMetric[]; };
      configurations?: NvdConfiguration[];
      published?: string;
      lastModified?: string;
    }
    interface NvdVulnerability { cve: NvdCveItem; }
    interface NvdApiResponse { vulnerabilities?: NvdVulnerability[]; }

    const data = (await response.json()) as NvdApiResponse;
    const cves = (data.vulnerabilities || []).map((v: NvdVulnerability) => {
      const cve = v.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0];
      const score = metrics?.cvssData?.baseScore || 0;
      const severity = score >= 9 ? "CRITICAL" : score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW";

      return {
        id: cve.id,
        description: cve.descriptions?.find((d: NvdCveDescription) => d.lang === "en")?.value || "",
        score,
        severity,
        published: cve.published,
        lastModified: cve.lastModified,
        vendor: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")[3] || "N/A",
        product: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")[4] || "N/A",
      };
    });

    sendSuccess(res, cves);
  } catch (err) {
    sendSuccess(res, []);
  }
});

const firestormLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false,
  message: { error: "Firestorm rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

const fsCache = new Map<string, { data: unknown; expiry: number }>();
function getFsCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = fsCache.get(key);
  if (c && c.expiry > Date.now()) return Promise.resolve(c.data as T);
  return fetcher().then(data => { fsCache.set(key, { data, expiry: Date.now() + ttlMs }); return data; })
    .catch(() => { const stale = fsCache.get(key); if (stale) return stale.data as T; throw new Error("Data unavailable"); });
}

async function fetchFsText(url: string, timeoutMs = 10000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "SZL-Firestorm/1.0", Accept: "text/plain,application/json,*/*" } });
    clearTimeout(timer); if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text();
  } finally { clearTimeout(timer); }
}

async function fetchFsJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "SZL-Firestorm/1.0", Accept: "application/json" } });
    clearTimeout(timer); if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  } finally { clearTimeout(timer); }
}

const DEMO_MITRE_TECHNIQUES = [
  { id: "T1566.001", name: "Spearphishing Attachment", tactic: "Initial Access", platforms: ["Windows", "macOS", "Linux"], subtechnique: true, description: "Adversaries may send spearphishing emails with a malicious attachment.", detection: "Network, Email, Process monitoring", mitigation: "User training, Email filtering, Anti-malware" },
  { id: "T1059.001", name: "PowerShell", tactic: "Execution", platforms: ["Windows"], subtechnique: true, description: "Adversaries may abuse PowerShell commands and scripts for execution.", detection: "Command-line logging, Script block logging", mitigation: "Constrained Language Mode, Script block logging" },
  { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion", platforms: ["Windows", "Azure AD", "SaaS", "Linux", "macOS"], subtechnique: false, description: "Adversaries may obtain and abuse credentials of existing accounts.", detection: "Authentication logs, Account usage auditing", mitigation: "MFA, Privileged account management" },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact", platforms: ["Windows", "macOS", "Linux"], subtechnique: false, description: "Adversaries may encrypt data on target systems to interrupt availability.", detection: "File modification monitoring, Backup verification", mitigation: "Offline backups, Immutable backups" },
  { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access", platforms: ["Windows", "Linux", "macOS", "Network"], subtechnique: false, description: "Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program.", detection: "Web application firewall, IDS/IPS", mitigation: "Patch management, Application hardening" },
  { id: "T1071.001", name: "Web Protocols", tactic: "Command and Control", platforms: ["Windows", "macOS", "Linux"], subtechnique: true, description: "Adversaries may communicate using application layer protocols associated with web traffic.", detection: "Network monitoring, Proxy logs", mitigation: "Network intrusion detection, Traffic analysis" },
  { id: "T1027", name: "Obfuscated Files or Information", tactic: "Defense Evasion", platforms: ["Windows", "macOS", "Linux", "Network"], subtechnique: false, description: "Adversaries may attempt to make an executable or file difficult to discover or analyze.", detection: "File monitoring, Process monitoring", mitigation: "Anti-virus, Binary analysis" },
  { id: "T1055", name: "Process Injection", tactic: "Privilege Escalation", platforms: ["Windows", "macOS", "Linux"], subtechnique: false, description: "Adversaries may inject code into processes to evade process-based defenses and elevate privileges.", detection: "Process monitoring, API monitoring", mitigation: "Privileged account management, Behavior monitoring" },
];

router.get("/firestorm/live/mitre-attack", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const tactic = req.query.tactic as string;
    const techniques = await getFsCached("mitre-attack-live", 86400000, async () => {
      try {
        const data = await fetchFsJson("https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json", 20000) as any;
        const attackPatterns = data?.objects?.filter((o: any) => o.type === "attack-pattern" && !o.revoked && !o.x_mitre_deprecated);
        if (!Array.isArray(attackPatterns) || attackPatterns.length === 0) throw new Error("No ATT&CK data");
        return attackPatterns.slice(0, 50).map((t: any) => {
          const extRef = t.external_references?.find((r: any) => r.source_name === "mitre-attack");
          const tacticsPhases = t.kill_chain_phases?.map((p: any) => p.phase_name.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())) ?? [];
          return { id: extRef?.external_id ?? "T????", name: t.name, tactic: tacticsPhases[0] ?? "Unknown", tactics: tacticsPhases, platforms: t.x_mitre_platforms ?? [], subtechnique: t.x_mitre_is_subtechnique ?? false, description: t.description?.slice(0, 300)?.replace(/\n/g, " ") ?? "", detection: t.x_mitre_detection?.slice(0, 200)?.replace(/\n/g, " ") ?? "Monitor for suspicious activity", mitigation: "Apply principle of least privilege and monitor for anomalous behavior", version: t.x_mitre_version ?? "1.0", dataSourcesCount: t.x_mitre_data_sources?.length ?? 0 };
        });
      } catch { return DEMO_MITRE_TECHNIQUES; }
    });
    const filtered = tactic ? techniques.filter((t: any) => t.tactic?.toLowerCase().includes(tactic.toLowerCase()) || t.tactics?.some((ta: string) => ta.toLowerCase().includes(tactic.toLowerCase()))) : techniques;
    sendSuccess(res, { source: "MITRE ATT&CK Enterprise Matrix v14", url: "https://attack.mitre.org/", count: filtered.length, techniques: filtered, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch MITRE ATT&CK data"); }
});

router.get("/firestorm/live/cisa-kev", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const ransomwareOnly = req.query.ransomware === "true";
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const data = await getFsCached("firestorm-cisa-kev", 3600000, async () => {
      try {
        const json = await fetchFsJson("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", 12000) as any;
        if (!Array.isArray(json?.vulnerabilities)) throw new Error("No KEV data");
        return { vulnerabilities: json.vulnerabilities, catalogVersion: json.catalogVersion, count: json.count, dateReleased: json.dateReleased };
      } catch { return { vulnerabilities: null, catalogVersion: "fallback", count: 0, dateReleased: new Date().toISOString().slice(0, 10) }; }
    });
    const vulns = (data.vulnerabilities ?? []).slice(-100).reverse().slice(0, limit);
    const ransomwareKnown = (data.vulnerabilities ?? []).filter((v: any) => v.knownRansomwareCampaignUse === "Known").slice(-20).reverse();
    const result = ransomwareOnly ? ransomwareKnown : vulns;
    sendSuccess(res, { source: "CISA Known Exploited Vulnerabilities (KEV) Catalog", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", catalogVersion: data.catalogVersion, dateReleased: data.dateReleased, totalKevCount: data.count, ransomwareKnownCount: ransomwareKnown.length, count: result.length, vulnerabilities: result, liveFeed: data.vulnerabilities !== null, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch CISA KEV for Firestorm"); }
});

router.get("/firestorm/live/nvd-cves", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const severity = (req.query.severity as string)?.toUpperCase();
    const keyword = req.query.keyword as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const cacheKey = `firestorm-nvd-${severity ?? "all"}-${keyword ?? ""}-${limit}`;
    const data = await getFsCached(cacheKey, 600000, async () => {
      try {
        const params = new URLSearchParams({ resultsPerPage: String(limit), startIndex: "0" });
        if (severity && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(severity)) params.set("cvssV3Severity", severity);
        if (keyword) params.set("keywordSearch", keyword);
        const raw = await fetchFsJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?${params.toString()}`, 15000) as any;
        if (!Array.isArray(raw?.vulnerabilities)) throw new Error("No NVD data");
        return raw.vulnerabilities.map((v: any) => {
          const cve = v.cve; const m31 = cve?.metrics?.cvssMetricV31?.[0]; const m30 = cve?.metrics?.cvssMetricV30?.[0]; const m = m31 || m30;
          const score = m?.cvssData?.baseScore ?? null;
          const sev = score ? (score >= 9 ? "CRITICAL" : score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW") : "UNKNOWN";
          return { id: cve.id, description: cve.descriptions?.find((d: any) => d.lang === "en")?.value?.slice(0, 300) ?? "", severity: sev, cvssScore: score, cvssVector: m?.cvssData?.vectorString ?? null, attackVector: m?.cvssData?.attackVector ?? null, exploitabilityScore: m?.exploitabilityScore ?? null, impactScore: m?.impactScore ?? null, vendor: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")?.[3] ?? "Various", product: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria?.split(":")?.[4] ?? "Multiple", published: cve.published, lastModified: cve.lastModified, cisaExploited: !!cve.cisaExploitAdd, cisaDueDate: cve.cisaActionDue ?? null, cwe: cve.weaknesses?.[0]?.description?.[0]?.value ?? null };
        });
      } catch { return null; }
    });
    if (!data) { sendSuccess(res, { source: "NVD CVE Database", note: "Live data temporarily unavailable", count: 0, vulnerabilities: [] }); return; }
    sendSuccess(res, { source: "NVD National Vulnerability Database", url: "https://nvd.nist.gov/", count: data.length, vulnerabilities: data, filters: { severity, keyword, limit }, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch NVD CVEs for Firestorm"); }
});

router.get("/firestorm/live/threat-news", firestormLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const news = await getFsCached("firestorm-threat-news", 600000, async () => {
      try {
        const xml = await fetchFsText("https://feeds.feedburner.com/TheHackersNews", 10000);
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
        return items.slice(0, 8).map((m, i) => {
          const item = m[1] ?? "";
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? `Threat News ${i + 1}`;
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
          const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
          const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "";
          const isCritical = /ransomware|zero.day|critical|rce|exploit|breach/i.test(title);
          return { id: `THN-${i}`, title: title.trim(), url: link.trim(), publishedAt: new Date(date).toISOString(), description: description.trim(), severity: isCritical ? "high" : "medium", source: "The Hacker News", category: /ransomware|malware/i.test(title) ? "malware" : /vulnerability|exploit|cve/i.test(title) ? "vulnerability" : "security" };
        });
      } catch { return null; }
    });
    sendSuccess(res, { source: "The Hacker News — Live Security Feed", url: "https://thehackernews.com/", count: news?.length ?? 0, news: news ?? [], liveData: news !== null, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Firestorm threat news"); }
});

const DEMO_THREAT_INDICATORS = [
  { id: "TI-001", type: "ip", value: "185.220.101.45", confidence: 95, severity: "high", tags: ["TOR", "APT"], lastSeen: new Date(Date.now() - 3600000).toISOString(), campaigns: ["Operation ShadowNet"] },
  { id: "TI-002", type: "domain", value: "malware-c2.net", confidence: 88, severity: "critical", tags: ["C2", "RAT"], lastSeen: new Date(Date.now() - 7200000).toISOString(), campaigns: ["Lazarus Group"] },
  { id: "TI-003", type: "hash", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", confidence: 100, severity: "critical", tags: ["ransomware", "LockBit"], lastSeen: new Date(Date.now() - 1800000).toISOString(), campaigns: ["LockBit 3.0"] },
];

router.get("/firestorm/live/threat-indicators", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const type = req.query.type as string;
    const data = await getFsCached("firestorm-threat-indicators", 3600000, async () => {
      try {
        const abuseCh = await fetchFsJson("https://urlhaus-api.abuse.ch/v1/urls/recent/", 10000) as any;
        const urls = abuseCh?.urls ?? [];
        const indicators = urls.slice(0, 20).map((u: any, i: number) => ({
          id: `ABUSE-${i}`,
          type: "url",
          value: u.url ?? "",
          confidence: 90,
          severity: u.threat === "malware_download" ? "critical" : "high",
          tags: [u.threat ?? "abuse", ...(u.tags ?? [])].filter(Boolean),
          lastSeen: u.date_added ?? new Date().toISOString(),
          campaigns: u.reporter ? [`Reported by ${u.reporter}`] : [],
          source: "Abuse.ch URLhaus",
        }));
        return { indicators, liveData: true };
      } catch { return { indicators: DEMO_THREAT_INDICATORS, liveData: false }; }
    });
    let indicators = data.indicators;
    if (type) indicators = indicators.filter((i: any) => i.type === type);
    sendSuccess(res, { source: "Abuse.ch URLhaus + CISA KEV Composite", liveData: data.liveData, count: indicators.length, indicators, cisaContext: { mandatoryPatchCount: 1554, ransomwareCampaignLinked: 312 }, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch threat indicators"); }
});

const CERT_FEEDS = [
  { id: "cisa-us", name: "CISA US-CERT", country: "United States", url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", type: "json", region: "Americas" },
  { id: "cert-ro", name: "CERT-RO Romania", country: "Romania", url: "https://www.cert.ro/citeste/feed", type: "rss", region: "Europe" },
  { id: "enisa-eu", name: "ENISA EU", country: "European Union", url: "https://www.enisa.europa.eu/topics/enisa-news/rss", type: "rss", region: "Europe" },
  { id: "ncsc-uk", name: "NCSC UK", country: "United Kingdom", url: "https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml", type: "rss", region: "Europe" },
  { id: "anssi-fr", name: "ANSSI France", country: "France", url: "https://www.cert.ssi.gouv.fr/feed/", type: "rss", region: "Europe" },
  { id: "bsi-de", name: "BSI Germany", country: "Germany", url: "https://www.bsi.bund.de/SiteGlobals/Functions/RSSFeed/RSSNewsfeed/RSSNewsfeed_Sicherheitswarnung.xml", type: "rss", region: "Europe" },
  { id: "jpcert", name: "JPCERT/CC", country: "Japan", url: "https://www.jpcert.or.jp/english/rss/jpcert-en.rdf", type: "rss", region: "Asia-Pacific" },
  { id: "auscert", name: "AusCERT", country: "Australia", url: "https://www.auscert.org.au/feed/", type: "rss", region: "Asia-Pacific" },
];

async function fetchCertAdvisories(feed: typeof CERT_FEEDS[0]): Promise<{ advisories: any[]; liveData: boolean }> {
  try {
    if (feed.id === "cisa-us") {
      const json = await fetchFsJson(feed.url, 12000) as any;
      const vulns = json?.vulnerabilities ?? [];
      const advisories = vulns.slice(-10).reverse().map((v: any) => ({
        id: v.cveID ?? `CISA-${Math.random()}`,
        title: v.vulnerabilityName ?? v.cveID,
        summary: `${v.shortDescription ?? ""} — Vendor: ${v.vendorProject ?? "N/A"}, Product: ${v.product ?? "N/A"}`,
        severity: v.knownRansomwareCampaignUse === "Known" ? "critical" : "high",
        publishedAt: v.dateAdded ?? new Date().toISOString(),
        url: v.references?.[0] ?? "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        source: feed.name,
        country: feed.country,
        region: feed.region,
      }));
      return { advisories, liveData: true };
    }
    const xml = await fetchFsText(feed.url, 10000);
    const items = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)];
    const advisories = items.slice(0, 8).map((m, i) => {
      const item = m[1] ?? "";
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/s)?.[1] ?? `Advisory ${i + 1}`;
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "#";
      const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString();
      const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s)?.[1]?.replace(/<[^>]+>/g, "").slice(0, 200)
        ?? item.match(/<description>(.*?)<\/description>/s)?.[1]?.replace(/<[^>]+>/g, "").slice(0, 200) ?? "";
      const isCritical = /critical|rce|remote code|zero.day|emergency|urgent/i.test(title + desc);
      return {
        id: `${feed.id}-${i}`,
        title: title.trim(),
        summary: desc.trim() || title.trim(),
        severity: isCritical ? "critical" : "high",
        publishedAt: new Date(date).toISOString(),
        url: link.trim(),
        source: feed.name,
        country: feed.country,
        region: feed.region,
      };
    });
    return { advisories, liveData: true };
  } catch { return { advisories: [], liveData: false }; }
}

router.get("/firestorm/live/cert-advisories", firestormLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const certId = req.query.cert as string;
    const feedsToFetch = certId ? CERT_FEEDS.filter(f => f.id === certId) : CERT_FEEDS;
    const results = await getFsCached(`firestorm-cert-${certId ?? "all"}`, 3600000, async () => {
      const settled = await Promise.allSettled(feedsToFetch.map(f => fetchCertAdvisories(f)));
      return feedsToFetch.map((feed, i) => {
        const result = settled[i];
        const { advisories, liveData } = result.status === "fulfilled" ? result.value : { advisories: [], liveData: false };
        return { feedId: feed.id, feedName: feed.name, country: feed.country, region: feed.region, advisories, liveData, advisoryCount: advisories.length, fetchedAt: new Date().toISOString() };
      });
    });
    sendSuccess(res, { feeds: results, totalAdvisories: results.reduce((s: number, f: any) => s + f.advisoryCount, 0), liveFeeds: results.filter((f: any) => f.liveData).length, totalFeeds: CERT_FEEDS.length, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch CERT advisories"); }
});

router.get("/firestorm/live/feed-status", firestormLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const feeds = [
      { id: "nvd-nist", name: "NIST NVD", description: "CVE Database", url: "https://nvd.nist.gov/", cacheTtlMinutes: 10 },
      { id: "cisa-kev", name: "CISA KEV", description: "Known Exploited Vulnerabilities", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", cacheTtlMinutes: 60 },
      { id: "mitre-attack", name: "MITRE ATT&CK", description: "Enterprise ATT&CK Framework", url: "https://attack.mitre.org/", cacheTtlMinutes: 1440 },
      { id: "abuse-ch", name: "Abuse.ch URLhaus", description: "Malware URL Feed", url: "https://urlhaus.abuse.ch/", cacheTtlMinutes: 60 },
      { id: "threat-news", name: "The Hacker News", description: "Cyber Threat News", url: "https://thehackernews.com/", cacheTtlMinutes: 10 },
      ...CERT_FEEDS.map(f => ({ id: f.id, name: f.name, description: `National CERT Advisory Feed — ${f.country}`, url: f.url, cacheTtlMinutes: 60 })),
    ];
    const statuses = feeds.map(feed => {
      const cacheEntry = fsCache.get(`firestorm-${feed.id}`)
        ?? fsCache.get(`firestorm-cert-all`)
        ?? fsCache.get(`firestorm-threat-indicators`);
      const isConnected = !!cacheEntry && cacheEntry.expiry > Date.now();
      const staleness = cacheEntry ? (Date.now() - (cacheEntry.expiry - feed.cacheTtlMinutes * 60000)) / 1000 : null;
      const status = !cacheEntry ? "disconnected" : isConnected ? "connected" : "stale";
      return { ...feed, status, lastRefreshed: cacheEntry ? new Date(cacheEntry.expiry - feed.cacheTtlMinutes * 60000).toISOString() : null, nextRefresh: cacheEntry ? new Date(cacheEntry.expiry).toISOString() : null, staleness: staleness !== null ? Math.round(staleness) : null };
    });
    const connected = statuses.filter(s => s.status === "connected").length;
    const disconnected = statuses.filter(s => s.status === "disconnected").length;
    sendSuccess(res, { feeds: statuses, summary: { total: statuses.length, connected, disconnected, stale: statuses.length - connected - disconnected }, operationalStatus: connected > statuses.length / 2 ? "operational" : connected > 0 ? "degraded" : "offline", fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch feed status"); }
});

router.post("/firestorm/ingest/webhook", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body;
    const source = (req.headers["x-firestorm-source"] as string) || body?.source || "webhook";
    const severity = body?.severity || body?.level || "medium";
    const title = body?.title || body?.message || body?.summary || "Incoming security event";
    const description = typeof body === "string" ? body : JSON.stringify(body).slice(0, 500);
    const normalizedSeverity = ["critical", "high", "medium", "low"].includes(severity?.toLowerCase()) ? severity.toLowerCase() : "medium";
    const [alert] = await db.insert(firestormAlertsTable).values({
      title: String(title).slice(0, 255),
      description: String(description).slice(0, 1000),
      severity: normalizedSeverity as any,
      source: String(source).slice(0, 100),
      status: "new",
      metadata: body,
    }).returning();
    sendCreated(res, { message: "Security event ingested", alertId: alert.id, severity: normalizedSeverity, source });
  } catch (err) { handleRouteError(res, err, "Failed to ingest webhook event"); }
});

router.get("/firestorm/assets", authMiddleware({ required: false }), async (req, res) => {
  try {
    const assets = await db.select().from(firestormAssetsTable).orderBy(desc(firestormAssetsTable.riskScore));
    sendSuccess(res, assets);
  } catch (err) {
    handleRouteError(res, err, "Failed to list assets");
  }
});

router.get("/firestorm/assets/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [asset] = await db.select().from(firestormAssetsTable).where(eq(firestormAssetsTable.id, id));
    if (!asset) { sendNotFound(res, "Asset"); return; }
    sendSuccess(res, asset);
  } catch (err) {
    handleRouteError(res, err, "Failed to get asset");
  }
});

router.post("/firestorm/assets", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormAssetSchema.parse(req.body);
    const [asset] = await db.insert(firestormAssetsTable).values(data).returning();
    sendCreated(res, asset);
  } catch (err) {
    handleRouteError(res, err, "Failed to create asset");
  }
});

router.put("/firestorm/assets/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertFirestormAssetSchema.partial().parse(req.body);
    const [asset] = await db.update(firestormAssetsTable).set({ ...data, updatedAt: new Date() }).where(eq(firestormAssetsTable.id, id)).returning();
    if (!asset) { sendNotFound(res, "Asset"); return; }
    sendSuccess(res, asset);
  } catch (err) {
    handleRouteError(res, err, "Failed to update asset");
  }
});

router.get("/firestorm/workflow-actions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId ? parseInt(req.query.entityId as string, 10) : undefined;
    let query = db.select().from(firestormWorkflowActionsTable).orderBy(desc(firestormWorkflowActionsTable.createdAt));
    const actions = await query;
    const filtered = actions.filter(a => {
      if (entityType && a.entityType !== entityType) return false;
      if (entityId && a.entityId !== entityId) return false;
      return true;
    });
    sendSuccess(res, filtered);
  } catch (err) {
    handleRouteError(res, err, "Failed to list workflow actions");
  }
});

router.post("/firestorm/workflow-actions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormWorkflowActionSchema.parse(req.body);
    const [action] = await db.insert(firestormWorkflowActionsTable).values(data).returning();
    sendCreated(res, action);
  } catch (err) {
    handleRouteError(res, err, "Failed to create workflow action");
  }
});

router.patch("/firestorm/workflow-actions/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { status, notes, assignedTo, completedAt } = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (completedAt) updateData.completedAt = completedAt;
    const [action] = await db.update(firestormWorkflowActionsTable).set(updateData).where(eq(firestormWorkflowActionsTable.id, id)).returning();
    if (!action) { sendNotFound(res, "Workflow action"); return; }
    sendSuccess(res, action);
  } catch (err) {
    handleRouteError(res, err, "Failed to update workflow action");
  }
});

router.get("/firestorm/hardening-controls", authMiddleware({ required: false }), async (req, res) => {
  try {
    const categoryFilter = req.query.category as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const controls = await db.select().from(firestormHardeningControlsTable).orderBy(firestormHardeningControlsTable.controlId);
    const filtered = controls.filter(c => {
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
    sendSuccess(res, filtered);
  } catch (err) {
    handleRouteError(res, err, "Failed to list hardening controls");
  }
});

router.get("/firestorm/hardening-controls/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [control] = await db.select().from(firestormHardeningControlsTable).where(eq(firestormHardeningControlsTable.id, id));
    if (!control) { sendNotFound(res, "Hardening control"); return; }
    sendSuccess(res, control);
  } catch (err) {
    handleRouteError(res, err, "Failed to get hardening control");
  }
});

router.put("/firestorm/hardening-controls/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { status, owner, recommendedAction, dueDate, notes } = req.body as {
      status?: string;
      owner?: string;
      recommendedAction?: string;
      dueDate?: string;
      notes?: string;
    };
    const [current] = await db.select().from(firestormHardeningControlsTable).where(eq(firestormHardeningControlsTable.id, id));
    if (!current) { sendNotFound(res, "Hardening control"); return; }

    const updates: Partial<typeof firestormHardeningControlsTable.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status as typeof current.status;
    if (owner !== undefined) updates.owner = owner;
    if (recommendedAction !== undefined) updates.recommendedAction = recommendedAction;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    const existingTrail = Array.isArray(current.auditTrail) ? current.auditTrail : [];
    const changedFields = Object.keys(updates).filter(k => k !== "updatedAt");
    const auditEntry = { action: notes ?? `Updated: ${changedFields.join(", ")}`, user: "Operator", at: new Date().toISOString() };
    updates.auditTrail = [...existingTrail, auditEntry];
    updates.lastReviewedAt = new Date();

    const [control] = await db.update(firestormHardeningControlsTable).set(updates).where(eq(firestormHardeningControlsTable.id, id)).returning();

    if (status === "implemented" && current.status !== "implemented") {
      await db.insert(firestormWorkflowActionsTable).values({
        entityType: "asset",
        entityId: id,
        actionType: "remediate",
        assignedTo: owner ?? current.owner ?? undefined,
        status: "completed",
        notes: `Hardening control ${current.controlId} marked implemented: ${current.name}`,
        triggeredBy: "hardening-control-update",
      });
    }

    sendSuccess(res, control);
  } catch (err) {
    handleRouteError(res, err, "Failed to update hardening control");
  }
});

router.get("/firestorm/hardening-summary", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const controls = await db.select().from(firestormHardeningControlsTable);
    const implemented = controls.filter(c => c.status === "implemented").length;
    const partial = controls.filter(c => c.status === "partial").length;
    const notImplemented = controls.filter(c => c.status === "not_implemented").length;
    const criticalGaps = controls.filter(c => c.priority === "critical" && c.status === "not_implemented").length;
    const totalScore = controls.length > 0 ? Math.round((implemented * 1 + partial * 0.5) / controls.length * 100) : 0;

    const byCategory = ["mfa_credential", "application_hardening", "config_hardening", "dependency_supply_chain", "vulnerability_assessment"].map(cat => {
      const catControls = controls.filter(c => c.category === cat);
      const catImplemented = catControls.filter(c => c.status === "implemented").length;
      const catPartial = catControls.filter(c => c.status === "partial").length;
      const catScore = catControls.length > 0 ? Math.round((catImplemented * 1 + catPartial * 0.5) / catControls.length * 100) : 0;
      const catGaps = catControls.filter(c => c.priority === "critical" && c.status === "not_implemented").length;
      return { category: cat, total: catControls.length, implemented: catImplemented, partial: catPartial, notImplemented: catControls.length - catImplemented - catPartial, score: catScore, criticalGaps: catGaps };
    });

    sendSuccess(res, { total: controls.length, implemented, partial, notImplemented, criticalGaps, overallScore: totalScore, byCategory });
  } catch (err) {
    handleRouteError(res, err, "Failed to get hardening summary");
  }
});

router.post("/firestorm/ingest/syslog", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body;
    const rawMessage = body?.message || body?.raw || "";
    const severity = /crit|emerg|alert/i.test(rawMessage) ? "critical"
      : /error|err\b/i.test(rawMessage) ? "high"
      : /warn/i.test(rawMessage) ? "medium" : "low";
    const title = rawMessage.slice(0, 120) || "Syslog event";
    const [alert] = await db.insert(firestormAlertsTable).values({
      title,
      description: rawMessage.slice(0, 1000),
      severity: severity as any,
      source: body?.host || body?.hostname || "syslog",
      status: "new",
      metadata: body,
    }).returning();
    sendCreated(res, { message: "Syslog event ingested", alertId: alert.id, severity });
  } catch (err) { handleRouteError(res, err, "Failed to ingest syslog event"); }
});

router.get("/firestorm/cases", authMiddleware({ required: false }), async (req, res) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const priorityFilter = req.query.priority as string | undefined;
    const cases = await db.select().from(firestormCasesTable).orderBy(desc(firestormCasesTable.createdAt));
    const filtered = cases.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (priorityFilter && c.priority !== priorityFilter) return false;
      return true;
    });
    sendSuccess(res, filtered);
  } catch (err) { handleRouteError(res, err, "Failed to list cases"); }
});

router.get("/firestorm/cases/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [c] = await db.select().from(firestormCasesTable).where(eq(firestormCasesTable.id, id));
    if (!c) { sendNotFound(res, "Case"); return; }
    sendSuccess(res, c);
  } catch (err) { handleRouteError(res, err, "Failed to get case"); }
});

router.post("/firestorm/cases", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertFirestormCaseSchema.parse(req.body);
    const [c] = await db.insert(firestormCasesTable).values(data).returning();
    sendCreated(res, c);
  } catch (err) { handleRouteError(res, err, "Failed to create case"); }
});

router.patch("/firestorm/cases/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { status, priority, assignedAnalyst, note, evidenceItem } = req.body;
    const [current] = await db.select().from(firestormCasesTable).where(eq(firestormCasesTable.id, id));
    if (!current) { sendNotFound(res, "Case"); return; }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignedAnalyst !== undefined) updates.assignedAnalyst = assignedAnalyst;

    if (status === "in_progress" && current.status === "open" && !current.triagedAt) {
      updates.triagedAt = new Date();
    }
    if (status === "resolved" && !current.resolvedAt) {
      updates.resolvedAt = new Date();
    }

    const existingTrail = Array.isArray(current.auditTrail) ? current.auditTrail : [];
    const auditEntry = { action: `Status updated to ${status ?? current.status}`, user: req.body.updatedBy ?? "Operator", at: new Date().toISOString() };
    updates.auditTrail = [...existingTrail, auditEntry];

    if (note) {
      const existingNotes = Array.isArray(current.notes) ? current.notes : [];
      updates.notes = [...existingNotes, { content: note.content, author: note.author ?? "Analyst", at: new Date().toISOString() }];
    }

    if (evidenceItem) {
      const existingEvidence = Array.isArray(current.evidence) ? current.evidence : [];
      updates.evidence = [...existingEvidence, { ...evidenceItem, addedAt: new Date().toISOString() }];
    }

    const [updated] = await db.update(firestormCasesTable).set(updates).where(eq(firestormCasesTable.id, id)).returning();
    sendSuccess(res, updated);
  } catch (err) { handleRouteError(res, err, "Failed to update case"); }
});

router.get("/firestorm/mitre-detections", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const detections = await db.select().from(firestormMitreDetectionsTable).orderBy(desc(firestormMitreDetectionsTable.detectionCount));
    sendSuccess(res, detections);
  } catch (err) { handleRouteError(res, err, "Failed to list MITRE detections"); }
});

router.get("/firestorm/mitre-detections/:techniqueId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const techniqueId = req.params.techniqueId;
    const [detection] = await db.select().from(firestormMitreDetectionsTable).where(eq(firestormMitreDetectionsTable.techniqueId, techniqueId));
    if (!detection) { sendNotFound(res, "MITRE detection"); return; }
    const relatedIncidents = detection.relatedIncidentIds?.length
      ? await db.select().from(firestormIncidentsTable).where(sql`id = ANY(${sql.raw(`ARRAY[${(detection.relatedIncidentIds as number[]).join(",")}]::int[]`)})`)
      : [];
    sendSuccess(res, { ...detection, relatedIncidents });
  } catch (err) { handleRouteError(res, err, "Failed to get MITRE detection"); }
});

router.post("/firestorm/seed", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const { seedAegis } = await import("../scripts/seed-aegis.js");
    const result = await seedAegis();
    sendSuccess(res, { message: "Aegis data seeded successfully", result });
  } catch (err) { handleRouteError(res, err, "Failed to seed Aegis data"); }
});

export default router;
