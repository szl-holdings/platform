import { Router, type IRouter } from "express";
import {
  db,
  dreamscapeCampaignsTable,
  dreamscapeScriptsTable,
  dreamscapeStoryboardsTable,
  dreamscapeVoiceAssetsTable,
  dreamscapeCampaignAssetsTable,
  dreamscapeReviewsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dreamscape/campaigns", authMiddleware(), async (_req, res) => {
  try {
    const rows = await db.select().from(dreamscapeCampaignsTable).orderBy(desc(dreamscapeCampaignsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list campaigns");
  }
});

router.post("/dreamscape/campaigns", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeCampaignsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create campaign");
  }
});

router.get("/dreamscape/campaigns/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(dreamscapeCampaignsTable).where(eq(dreamscapeCampaignsTable.id, id));
    if (!row) { sendNotFound(res, "Campaign"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get campaign");
  }
});

router.patch("/dreamscape/campaigns/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeCampaignsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dreamscapeCampaignsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Campaign"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update campaign");
  }
});

router.delete("/dreamscape/campaigns/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(dreamscapeCampaignsTable).where(eq(dreamscapeCampaignsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Campaign"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete campaign");
  }
});

router.get("/dreamscape/campaigns/:id/scripts", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeScriptsTable).where(eq(dreamscapeScriptsTable.campaignId, id)).orderBy(desc(dreamscapeScriptsTable.updatedAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list scripts");
  }
});

router.post("/dreamscape/scripts", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeScriptsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create script");
  }
});

router.get("/dreamscape/scripts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(dreamscapeScriptsTable).where(eq(dreamscapeScriptsTable.id, id));
    if (!row) { sendNotFound(res, "Script"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get script");
  }
});

router.patch("/dreamscape/scripts/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeScriptsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dreamscapeScriptsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Script"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update script");
  }
});

router.get("/dreamscape/campaigns/:id/storyboards", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeStoryboardsTable).where(eq(dreamscapeStoryboardsTable.campaignId, id)).orderBy(dreamscapeStoryboardsTable.sceneNumber);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list storyboards");
  }
});

router.post("/dreamscape/storyboards", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeStoryboardsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create storyboard");
  }
});

router.patch("/dreamscape/storyboards/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeStoryboardsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dreamscapeStoryboardsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Storyboard"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update storyboard");
  }
});

router.get("/dreamscape/campaigns/:id/voice-assets", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeVoiceAssetsTable).where(eq(dreamscapeVoiceAssetsTable.campaignId, id)).orderBy(desc(dreamscapeVoiceAssetsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list voice assets");
  }
});

router.post("/dreamscape/voice-assets", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeVoiceAssetsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create voice asset");
  }
});

router.patch("/dreamscape/voice-assets/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeVoiceAssetsTable).set(req.body).where(eq(dreamscapeVoiceAssetsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Voice asset"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update voice asset");
  }
});

router.get("/dreamscape/campaigns/:id/assets", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeCampaignAssetsTable).where(eq(dreamscapeCampaignAssetsTable.campaignId, id)).orderBy(desc(dreamscapeCampaignAssetsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list campaign assets");
  }
});

router.post("/dreamscape/campaign-assets", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeCampaignAssetsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create campaign asset");
  }
});

router.delete("/dreamscape/campaign-assets/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(dreamscapeCampaignAssetsTable).where(eq(dreamscapeCampaignAssetsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Campaign asset"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete campaign asset");
  }
});

router.get("/dreamscape/campaigns/:id/reviews", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(dreamscapeReviewsTable).where(eq(dreamscapeReviewsTable.campaignId, id)).orderBy(desc(dreamscapeReviewsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list reviews");
  }
});

router.post("/dreamscape/reviews", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(dreamscapeReviewsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create review");
  }
});

router.patch("/dreamscape/reviews/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(dreamscapeReviewsTable).set(req.body).where(eq(dreamscapeReviewsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Review"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update review");
  }
});

export default router;
