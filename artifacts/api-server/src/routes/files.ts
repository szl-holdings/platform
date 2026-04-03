import { Router, type IRouter } from "express";
import { db, filesTable, assetsTable } from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/files", authMiddleware(), async (_req, res) => {
  try {
    const files = await db.select().from(filesTable).orderBy(desc(filesTable.createdAt));
    sendSuccess(res, files);
  } catch (err) {
    handleRouteError(res, err, "Failed to list files");
  }
});

router.get("/files/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [file] = await db.select().from(filesTable).where(eq(filesTable.id, id));
    if (!file) {
      sendNotFound(res, "File");
      return;
    }
    sendSuccess(res, file);
  } catch (err) {
    handleRouteError(res, err, "Failed to get file");
  }
});

router.get("/assets", authMiddleware(), async (_req, res) => {
  try {
    const assets = await db.select().from(assetsTable).orderBy(desc(assetsTable.createdAt));
    sendSuccess(res, assets);
  } catch (err) {
    handleRouteError(res, err, "Failed to list assets");
  }
});

export default router;
