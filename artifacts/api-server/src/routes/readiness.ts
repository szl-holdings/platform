import { Router, type IRouter } from "express";
import { db, readinessAssessmentsTable, readinessChecklistsTable, readinessFindingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/readiness/assessments", authMiddleware(), async (_req, res) => {
  try {
    const assessments = await db.select().from(readinessAssessmentsTable).orderBy(desc(readinessAssessmentsTable.createdAt));
    sendSuccess(res, assessments);
  } catch (err) {
    handleRouteError(res, err, "Failed to list assessments");
  }
});

router.get("/readiness/assessments/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [assessment] = await db.select().from(readinessAssessmentsTable).where(eq(readinessAssessmentsTable.id, id));
    if (!assessment) { sendNotFound(res, "Assessment"); return; }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to get assessment");
  }
});

router.get("/readiness/assessments/:id/checklists", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const checklists = await db.select().from(readinessChecklistsTable).where(eq(readinessChecklistsTable.assessmentId, id)).orderBy(readinessChecklistsTable.priority);
    sendSuccess(res, checklists);
  } catch (err) {
    handleRouteError(res, err, "Failed to get checklists");
  }
});

router.get("/readiness/assessments/:id/findings", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const findings = await db.select().from(readinessFindingsTable).where(eq(readinessFindingsTable.assessmentId, id)).orderBy(desc(readinessFindingsTable.createdAt));
    sendSuccess(res, findings);
  } catch (err) {
    handleRouteError(res, err, "Failed to get findings");
  }
});

export default router;
