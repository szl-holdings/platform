import { Router, type IRouter } from "express";
import {
  db,
  readinessProgramsTable,
  readinessDimensionsTable,
  readinessScoreHistoryTable,
  readinessMilestonesTable,
  readinessRisksTable,
  readinessAlertsTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/readiness/programs", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(readinessProgramsTable).orderBy(desc(readinessProgramsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(readinessProgramsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list programs");
  }
});

router.post("/readiness/programs", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(readinessProgramsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create program");
  }
});

router.get("/readiness/programs/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(readinessProgramsTable).where(eq(readinessProgramsTable.id, id));
    if (!row) { sendNotFound(res, "Program"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get program");
  }
});

router.patch("/readiness/programs/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessProgramsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(readinessProgramsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Program"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update program");
  }
});

router.delete("/readiness/programs/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessProgramsTable).where(eq(readinessProgramsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Program"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete program");
  }
});

router.get("/readiness/programs/:id/dimensions", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessDimensionsTable).where(eq(readinessDimensionsTable.programId, id)).orderBy(readinessDimensionsTable.category);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list dimensions");
  }
});

router.post("/readiness/dimensions", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(readinessDimensionsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create dimension");
  }
});

router.patch("/readiness/dimensions/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessDimensionsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(readinessDimensionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Dimension"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update dimension");
  }
});

router.delete("/readiness/dimensions/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessDimensionsTable).where(eq(readinessDimensionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Dimension"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete dimension");
  }
});

router.get("/readiness/dimensions/:id/scores", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessScoreHistoryTable).where(eq(readinessScoreHistoryTable.dimensionId, id)).orderBy(desc(readinessScoreHistoryTable.recordedAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list score history");
  }
});

router.post("/readiness/scores", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(readinessScoreHistoryTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to record score");
  }
});

router.get("/readiness/programs/:id/milestones", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessMilestonesTable).where(eq(readinessMilestonesTable.programId, id)).orderBy(readinessMilestonesTable.dueDate);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list milestones");
  }
});

router.post("/readiness/milestones", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(readinessMilestonesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create milestone");
  }
});

router.patch("/readiness/milestones/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessMilestonesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(readinessMilestonesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Milestone"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update milestone");
  }
});

router.delete("/readiness/milestones/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessMilestonesTable).where(eq(readinessMilestonesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Milestone"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete milestone");
  }
});

router.get("/readiness/programs/:id/risks", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessRisksTable).where(eq(readinessRisksTable.programId, id)).orderBy(desc(readinessRisksTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list risks");
  }
});

router.post("/readiness/risks", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(readinessRisksTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create risk");
  }
});

router.patch("/readiness/risks/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessRisksTable).set({ ...req.body, updatedAt: new Date() }).where(eq(readinessRisksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Risk"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update risk");
  }
});

router.delete("/readiness/risks/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessRisksTable).where(eq(readinessRisksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Risk"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete risk");
  }
});

router.get("/readiness/programs/:id/alerts", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(readinessAlertsTable).where(eq(readinessAlertsTable.programId, id)).orderBy(desc(readinessAlertsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alerts");
  }
});

router.post("/readiness/alerts", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(readinessAlertsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert");
  }
});

router.patch("/readiness/alerts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(readinessAlertsTable).set(req.body).where(eq(readinessAlertsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Alert"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update alert");
  }
});

router.delete("/readiness/alerts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(readinessAlertsTable).where(eq(readinessAlertsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Alert"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete alert");
  }
});

router.get("/readiness/executive-rollup", authMiddleware(), async (_req, res) => {
  try {
    const programs = await db.select().from(readinessProgramsTable).orderBy(desc(readinessProgramsTable.createdAt));
    const dimensions = await db.select().from(readinessDimensionsTable);
    const milestones = await db.select().from(readinessMilestonesTable);
    const risks = await db.select().from(readinessRisksTable);
    const alerts = await db.select().from(readinessAlertsTable).where(eq(readinessAlertsTable.isRead, false));

    const activePrograms = programs.filter(p => p.status === "active");
    const overdueMilestones = milestones.filter(m => m.status === "overdue");
    const openRisks = risks.filter(r => !["resolved", "accepted"].includes(r.status));
    const criticalRisks = openRisks.filter(r => r.severity === "critical");

    sendSuccess(res, {
      programCount: programs.length,
      activeProgramCount: activePrograms.length,
      dimensionCount: dimensions.length,
      overdueMilestoneCount: overdueMilestones.length,
      openRiskCount: openRisks.length,
      criticalRiskCount: criticalRisks.length,
      unreadAlertCount: alerts.length,
      programs: activePrograms,
      recentAlerts: alerts.slice(0, 10),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build executive rollup");
  }
});

export default router;
