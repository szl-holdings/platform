import { Router, type IRouter } from "express";
import {
  db,
  incaProjectsTable,
  incaExperimentsTable,
  incaModelsTable,
  incaInsightsTable,
  incaDatasetsTable,
} from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/inca/health", (_req, res) => {
  res.json({ service: "inca", status: "ok", timestamp: new Date().toISOString() });
});

router.get("/inca/dashboard", async (_req, res) => {
  try {
    const projects = await db.select().from(incaProjectsTable);
    const experiments = await db.select().from(incaExperimentsTable);
    const models = await db.select().from(incaModelsTable);
    const insights = await db.select().from(incaInsightsTable);

    const activeProjects = projects.length;
    const runningExperiments = experiments.filter(e => e.status === "running").length;
    const deployedModels = models.filter(m => m.status === "production").length;
    const totalInsights = insights.length;
    const avgAccuracy = projects.length > 0
      ? projects.reduce((s, p) => s + Number(p.accuracy || 0), 0) / projects.length
      : 0;

    sendSuccess(res, {
      activeProjects, runningExperiments, deployedModels, totalInsights,
      avgAccuracy: Number(avgAccuracy.toFixed(1)), healthScore: 82,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build dashboard");
  }
});

router.get("/inca/projects", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaProjectsTable).orderBy(desc(incaProjectsTable.updatedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaProjectsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list projects");
  }
});

router.get("/inca/projects/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(incaProjectsTable).where(eq(incaProjectsTable.id, id));
    if (!row) { sendNotFound(res, "Project"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get project");
  }
});

router.post("/inca/projects", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(incaProjectsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create project");
  }
});

router.patch("/inca/projects/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaProjectsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaProjectsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Project"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update project");
  }
});

router.delete("/inca/projects/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaProjectsTable).where(eq(incaProjectsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Project"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete project");
  }
});

router.get("/inca/projects/:id/experiments", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(incaExperimentsTable).where(eq(incaExperimentsTable.projectId, id)).orderBy(desc(incaExperimentsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list experiments");
  }
});

router.get("/inca/projects/:id/models", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(incaModelsTable).where(eq(incaModelsTable.projectId, id)).orderBy(desc(incaModelsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list models");
  }
});

router.get("/inca/experiments", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaExperimentsTable).orderBy(desc(incaExperimentsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaExperimentsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list experiments");
  }
});

router.post("/inca/experiments", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(incaExperimentsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create experiment");
  }
});

router.patch("/inca/experiments/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaExperimentsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaExperimentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Experiment"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update experiment");
  }
});

router.delete("/inca/experiments/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaExperimentsTable).where(eq(incaExperimentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Experiment"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete experiment");
  }
});

router.get("/inca/models", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaModelsTable).orderBy(desc(incaModelsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaModelsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list models");
  }
});

router.post("/inca/models", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(incaModelsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create model");
  }
});

router.patch("/inca/models/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(incaModelsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(incaModelsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Model"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update model");
  }
});

router.delete("/inca/models/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaModelsTable).where(eq(incaModelsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Model"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete model");
  }
});

router.get("/inca/insights", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(incaInsightsTable).orderBy(desc(incaInsightsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(incaInsightsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list insights");
  }
});

router.post("/inca/insights", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(incaInsightsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create insight");
  }
});

router.delete("/inca/insights/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(incaInsightsTable).where(eq(incaInsightsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Insight"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete insight");
  }
});

router.get("/inca/search", async (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    if (!query) { sendSuccess(res, []); return; }
    const pattern = `%${query}%`;
    const projects = await db.select().from(incaProjectsTable).where(
      or(ilike(incaProjectsTable.name, pattern), ilike(incaProjectsTable.description, pattern))
    );
    sendSuccess(res, projects);
  } catch (err) {
    handleRouteError(res, err, "Failed to search");
  }
});

router.get("/inca/provider/models", async (req, res) => {
  try {
    const rows = await db.select().from(incaModelsTable).orderBy(desc(incaModelsTable.createdAt));
    sendSuccess(res, rows, 200, { page: 1, limit: 25, total: rows.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list provider models");
  }
});

router.get("/inca/provider/models/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(incaModelsTable).where(eq(incaModelsTable.id, id));
    if (!row) { res.status(404).json({ error: "Model not found" }); return; }
    res.json({ data: row });
  } catch (err) {
    handleRouteError(res, err, "Failed to get provider model");
  }
});

export default router;
