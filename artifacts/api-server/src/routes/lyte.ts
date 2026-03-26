import { Router, type IRouter } from "express";
import {
  db,
  lyteWorkspacesTable,
  lyteSignalsTable,
  lyteCommandCardsTable,
  lyteIncidentsTable,
  lytePlaybooksTable,
  lyteRecommendationsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/lyte/workspaces", authMiddleware(), async (_req, res) => {
  try {
    const rows = await db.select().from(lyteWorkspacesTable).orderBy(desc(lyteWorkspacesTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list workspaces");
  }
});

router.post("/lyte/workspaces", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteWorkspacesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create workspace");
  }
});

router.get("/lyte/workspaces/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(lyteWorkspacesTable).where(eq(lyteWorkspacesTable.id, id));
    if (!row) { sendNotFound(res, "Workspace"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get workspace");
  }
});

router.get("/lyte/signals", authMiddleware(), async (_req, res) => {
  try {
    const rows = await db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.receivedAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list signals");
  }
});

router.post("/lyte/signals", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteSignalsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create signal");
  }
});

router.patch("/lyte/signals/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteSignalsTable).set(req.body).where(eq(lyteSignalsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Signal"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update signal");
  }
});

router.get("/lyte/command-cards", authMiddleware(), async (_req, res) => {
  try {
    const rows = await db.select().from(lyteCommandCardsTable).orderBy(desc(lyteCommandCardsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list command cards");
  }
});

router.post("/lyte/command-cards", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteCommandCardsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create command card");
  }
});

router.patch("/lyte/command-cards/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteCommandCardsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteCommandCardsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Command card"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update command card");
  }
});

router.delete("/lyte/command-cards/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(lyteCommandCardsTable).where(eq(lyteCommandCardsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Command card"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete command card");
  }
});

router.get("/lyte/incidents", authMiddleware(), async (_req, res) => {
  try {
    const rows = await db.select().from(lyteIncidentsTable).orderBy(desc(lyteIncidentsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list incidents");
  }
});

router.post("/lyte/incidents", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteIncidentsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create incident");
  }
});

router.patch("/lyte/incidents/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteIncidentsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteIncidentsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Incident"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update incident");
  }
});

router.get("/lyte/playbooks", authMiddleware(), async (_req, res) => {
  try {
    const rows = await db.select().from(lytePlaybooksTable).orderBy(desc(lytePlaybooksTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list playbooks");
  }
});

router.post("/lyte/playbooks", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(lytePlaybooksTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create playbook");
  }
});

router.get("/lyte/playbooks/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(lytePlaybooksTable).where(eq(lytePlaybooksTable.id, id));
    if (!row) { sendNotFound(res, "Playbook"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get playbook");
  }
});

router.patch("/lyte/playbooks/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lytePlaybooksTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lytePlaybooksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Playbook"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update playbook");
  }
});

router.get("/lyte/recommendations", authMiddleware(), async (_req, res) => {
  try {
    const rows = await db.select().from(lyteRecommendationsTable).orderBy(desc(lyteRecommendationsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list recommendations");
  }
});

router.post("/lyte/recommendations", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(lyteRecommendationsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create recommendation");
  }
});

router.patch("/lyte/recommendations/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(lyteRecommendationsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(lyteRecommendationsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Recommendation"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update recommendation");
  }
});

router.get("/lyte/executive-summary", authMiddleware(), async (_req, res) => {
  try {
    const signals = await db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.receivedAt));
    const incidents = await db.select().from(lyteIncidentsTable).orderBy(desc(lyteIncidentsTable.createdAt));
    const recommendations = await db.select().from(lyteRecommendationsTable).orderBy(desc(lyteRecommendationsTable.createdAt));
    const commandCards = await db.select().from(lyteCommandCardsTable).orderBy(desc(lyteCommandCardsTable.createdAt));

    const openIncidents = incidents.filter(i => !["resolved", "closed"].includes(i.status));
    const criticalSignals = signals.filter(s => s.severity === "critical" && s.status === "new");
    const pendingRecs = recommendations.filter(r => r.status === "suggested");
    const activeCards = commandCards.filter(c => !["completed", "deferred"].includes(c.status));

    sendSuccess(res, {
      totalSignals: signals.length,
      criticalSignalCount: criticalSignals.length,
      openIncidentCount: openIncidents.length,
      pendingRecommendationCount: pendingRecs.length,
      activeCommandCardCount: activeCards.length,
      recentSignals: signals.slice(0, 5),
      recentIncidents: incidents.slice(0, 5),
      topRecommendations: pendingRecs.slice(0, 5),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build executive summary");
  }
});

export default router;
