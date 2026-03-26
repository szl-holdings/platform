import { Router, type IRouter } from "express";
import {
  db,
  firestormScenariosTable,
  firestormAssessmentsTable,
  firestormSimulationRunsTable,
  firestormFindingsTable,
  firestormRiskScoresTable,
  insertFirestormScenarioSchema,
  insertFirestormAssessmentSchema,
  insertFirestormSimulationRunSchema,
  insertFirestormFindingSchema,
  insertFirestormRiskScoreSchema,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
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
      status: "running",
      mode: "demo",
      startedAt: new Date(),
    }).returning();

    setTimeout(async () => {
      try {
        await db.update(firestormSimulationRunsTable).set({
          status: "completed",
          completedAt: new Date(),
          durationSeconds: Math.floor(Math.random() * 120 + 30),
          results: {
            vulnerabilitiesFound: Math.floor(Math.random() * 8 + 2),
            criticalFindings: Math.floor(Math.random() * 3),
            highFindings: Math.floor(Math.random() * 4 + 1),
            mediumFindings: Math.floor(Math.random() * 5 + 2),
            controlsValidated: Math.floor(Math.random() * 10 + 5),
            overallScore: (Math.random() * 40 + 40).toFixed(2),
            executionLog: [
              "Initializing simulation environment...",
              "Loading scenario parameters...",
              "Executing controlled assessment...",
              "Analyzing results...",
              "Generating findings report...",
              "Simulation complete.",
            ],
          },
        }).where(eq(firestormSimulationRunsTable.id, run.id));
      } catch {}
    }, 3000);

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
    const data = insertFirestormFindingSchema.parse(req.body);
    const [finding] = await db.insert(firestormFindingsTable).values(data).returning();
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

export default router;
