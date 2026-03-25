import { Router, type IRouter } from "express";
import { db, dreamscapeProjectsTable, dreamscapeAssetsTable, dreamscapeReviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dreamscape/projects", authMiddleware(), async (_req, res) => {
  try {
    const projects = await db.select().from(dreamscapeProjectsTable).orderBy(desc(dreamscapeProjectsTable.createdAt));
    sendSuccess(res, projects);
  } catch (err) {
    handleRouteError(res, err, "Failed to list dreamscape projects");
  }
});

router.get("/dreamscape/projects/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [project] = await db.select().from(dreamscapeProjectsTable).where(eq(dreamscapeProjectsTable.id, id));
    if (!project) { sendNotFound(res, "Dreamscape project"); return; }
    sendSuccess(res, project);
  } catch (err) {
    handleRouteError(res, err, "Failed to get dreamscape project");
  }
});

router.get("/dreamscape/projects/:id/assets", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const assets = await db.select().from(dreamscapeAssetsTable).where(eq(dreamscapeAssetsTable.projectId, id)).orderBy(desc(dreamscapeAssetsTable.createdAt));
    sendSuccess(res, assets);
  } catch (err) {
    handleRouteError(res, err, "Failed to get dreamscape assets");
  }
});

router.get("/dreamscape/projects/:id/reviews", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const reviews = await db.select().from(dreamscapeReviewsTable).where(eq(dreamscapeReviewsTable.projectId, id)).orderBy(desc(dreamscapeReviewsTable.createdAt));
    sendSuccess(res, reviews);
  } catch (err) {
    handleRouteError(res, err, "Failed to get dreamscape reviews");
  }
});

export default router;
