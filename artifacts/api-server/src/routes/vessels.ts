import { Router, type IRouter } from "express";
import { db, vesselsTable, vesselsPositionsTable, vesselsCargoTable, vesselsRoutesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/vessels", authMiddleware(), async (_req, res) => {
  try {
    const vessels = await db.select().from(vesselsTable).orderBy(desc(vesselsTable.createdAt));
    sendSuccess(res, vessels);
  } catch (err) {
    handleRouteError(res, err, "Failed to list vessels");
  }
});

router.get("/vessels/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [vessel] = await db.select().from(vesselsTable).where(eq(vesselsTable.id, id));
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendSuccess(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel");
  }
});

router.get("/vessels/:id/positions", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const positions = await db.select().from(vesselsPositionsTable).where(eq(vesselsPositionsTable.vesselId, id)).orderBy(desc(vesselsPositionsTable.recordedAt));
    sendSuccess(res, positions);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel positions");
  }
});

router.get("/vessels/:id/cargo", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const cargo = await db.select().from(vesselsCargoTable).where(eq(vesselsCargoTable.vesselId, id)).orderBy(desc(vesselsCargoTable.createdAt));
    sendSuccess(res, cargo);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel cargo");
  }
});

router.get("/vessels/:id/routes", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const routes = await db.select().from(vesselsRoutesTable).where(eq(vesselsRoutesTable.vesselId, id)).orderBy(desc(vesselsRoutesTable.createdAt));
    sendSuccess(res, routes);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel routes");
  }
});

export default router;
