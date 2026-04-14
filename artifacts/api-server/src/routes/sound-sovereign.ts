import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, handleRouteError } from "../lib/api-response";
import {
  createArtist,
  listArtists,
  createTrack,
  listTracks,
  getRoyaltyAnalytics,
  generateForecast,
  listFingerprints,
  createDispute,
  listDisputes,
  updateDisputeStatus,
  soundSovereignDashboard,
  type RoyaltyPlatform,
  type DisputeStatus,
} from "../lib/sound-sovereign";

const router = Router();

function getOrgId(req: Request): number {
  return (req as { orgId?: number }).orgId ?? 1;
}

router.get("/sound-sovereign/dashboard", async (req: Request, res: Response) => {
  try {
    const data = await soundSovereignDashboard(getOrgId(req));
    sendSuccess(res, { dashboard: data });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch Sound Sovereign dashboard");
  }
});

router.get("/sound-sovereign/artists", async (req: Request, res: Response) => {
  try {
    const artists = await listArtists(getOrgId(req));
    sendSuccess(res, { artists });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch artists");
  }
});

router.post("/sound-sovereign/artists", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { name, bio, genres } = req.body;
    if (!name) return sendBadRequest(res, "name is required");
    const artist = await createArtist({ orgId: getOrgId(req), name, bio, genres });
    sendCreated(res, { artist });
  } catch (err) {
    handleRouteError(res, err, "Failed to create artist");
  }
});

router.get("/sound-sovereign/tracks", async (req: Request, res: Response) => {
  try {
    const { artistId } = req.query;
    const tracks = await listTracks(getOrgId(req), artistId ? parseInt(artistId as string) : undefined);
    sendSuccess(res, { tracks });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch tracks");
  }
});

router.post("/sound-sovereign/tracks", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { artistId, title, isrc, duration, genres, splits } = req.body;
    if (!title || !artistId) return sendBadRequest(res, "title and artistId are required");
    const track = await createTrack({ orgId: getOrgId(req), artistId: parseInt(artistId), title, isrc, duration, genres, splits });
    sendCreated(res, { track });
  } catch (err) {
    handleRouteError(res, err, "Failed to create track");
  }
});

router.get("/sound-sovereign/royalties", async (req: Request, res: Response) => {
  try {
    const { trackId, platform, limit } = req.query;
    const data = await getRoyaltyAnalytics(getOrgId(req), {
      trackId: trackId ? parseInt(trackId as string) : undefined,
      platform: platform as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    sendSuccess(res, data);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch royalty analytics");
  }
});

router.post("/sound-sovereign/forecasts", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { trackId, horizon } = req.body;
    if (!trackId) return sendBadRequest(res, "trackId is required");
    const validHorizons = ["30d", "90d", "1y"] as const;
    const h = validHorizons.includes(horizon) ? horizon : "30d";
    const forecast = await generateForecast({ orgId: getOrgId(req), trackId: parseInt(trackId), horizon: h });
    sendSuccess(res, { forecast });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate forecast");
  }
});

router.get("/sound-sovereign/fingerprints", async (req: Request, res: Response) => {
  try {
    const fingerprints = await listFingerprints(getOrgId(req));
    sendSuccess(res, { fingerprints });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch fingerprints");
  }
});

router.get("/sound-sovereign/disputes", async (req: Request, res: Response) => {
  try {
    const disputes = await listDisputes(getOrgId(req));
    sendSuccess(res, { disputes });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch disputes");
  }
});

router.post("/sound-sovereign/disputes", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { trackId, platform, royaltyRecordIds, description, claimAmountUsd } = req.body;
    if (!trackId || !platform || !description) {
      return sendBadRequest(res, "trackId, platform, and description are required");
    }
    const dispute = await createDispute({
      orgId: getOrgId(req),
      trackId: parseInt(trackId),
      platform: platform as RoyaltyPlatform,
      royaltyRecordIds: Array.isArray(royaltyRecordIds) ? royaltyRecordIds.map(Number) : [],
      description,
      claimAmountUsd: parseFloat(claimAmountUsd) || 0,
    });
    sendCreated(res, { dispute });
  } catch (err) {
    handleRouteError(res, err, "Failed to create dispute");
  }
});

router.patch("/sound-sovereign/disputes/:id/status", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { status, resolvedAmount } = req.body;
    const validStatuses: DisputeStatus[] = ["open", "submitted", "under_review", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return sendBadRequest(res, `status must be one of: ${validStatuses.join(", ")}`);
    }
    await updateDisputeStatus(parseInt(req.params.id), getOrgId(req), status, resolvedAmount ? parseFloat(resolvedAmount) : undefined);
    sendSuccess(res, { updated: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to update dispute status");
  }
});

export default router;
