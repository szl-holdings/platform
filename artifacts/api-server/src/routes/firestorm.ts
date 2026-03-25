import { Router, type IRouter } from "express";
import { db, firestormCampaignsTable, firestormLeadsTable, firestormAnalyticsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/firestorm/campaigns", authMiddleware(), async (_req, res) => {
  try {
    const campaigns = await db.select().from(firestormCampaignsTable).orderBy(desc(firestormCampaignsTable.createdAt));
    sendSuccess(res, campaigns);
  } catch (err) {
    handleRouteError(res, err, "Failed to list campaigns");
  }
});

router.get("/firestorm/campaigns/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [campaign] = await db.select().from(firestormCampaignsTable).where(eq(firestormCampaignsTable.id, id));
    if (!campaign) { sendNotFound(res, "Campaign"); return; }
    sendSuccess(res, campaign);
  } catch (err) {
    handleRouteError(res, err, "Failed to get campaign");
  }
});

router.get("/firestorm/leads", authMiddleware(), async (_req, res) => {
  try {
    const leads = await db.select().from(firestormLeadsTable).orderBy(desc(firestormLeadsTable.createdAt));
    sendSuccess(res, leads);
  } catch (err) {
    handleRouteError(res, err, "Failed to list leads");
  }
});

router.get("/firestorm/analytics", authMiddleware(), async (req, res) => {
  try {
    const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string, 10) : undefined;
    const query = campaignId
      ? db.select().from(firestormAnalyticsTable).where(eq(firestormAnalyticsTable.campaignId, campaignId)).orderBy(desc(firestormAnalyticsTable.date))
      : db.select().from(firestormAnalyticsTable).orderBy(desc(firestormAnalyticsTable.date));
    const analytics = await query;
    sendSuccess(res, analytics);
  } catch (err) {
    handleRouteError(res, err, "Failed to get analytics");
  }
});

export default router;
