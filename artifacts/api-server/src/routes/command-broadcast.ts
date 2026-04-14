import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, handleRouteError } from "../lib/api-response";
import {
  createStream,
  startStream,
  endStream,
  listStreams,
  getStream,
  getStreamCaptions,
  searchTranscript,
  getStreamHighlights,
  getStreamReport,
  getAttentionHeatmap,
  getLiveEngagement,
  commandBroadcastDashboard,
  type StreamStatus,
  type DomainVocabulary,
} from "../lib/command-broadcast";

const router = Router();

function getOrgId(req: Request): number {
  return (req as { orgId?: number }).orgId ?? 1;
}

router.get("/command-broadcast/dashboard", async (req: Request, res: Response) => {
  try {
    const data = await commandBroadcastDashboard(getOrgId(req));
    sendSuccess(res, { dashboard: data });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch Command Broadcast dashboard");
  }
});

router.get("/command-broadcast/streams", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const streams = await listStreams(getOrgId(req), status as StreamStatus | undefined);
    sendSuccess(res, { streams });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch streams");
  }
});

router.post("/command-broadcast/streams", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { title, description, hostName, domainVocabulary, scheduledAt } = req.body;
    if (!title) return sendBadRequest(res, "title is required");
    const stream = await createStream({
      orgId: getOrgId(req),
      title,
      description,
      hostName,
      domainVocabulary: domainVocabulary as DomainVocabulary | undefined,
      scheduledAt,
    });
    sendCreated(res, { stream });
  } catch (err) {
    handleRouteError(res, err, "Failed to create stream");
  }
});

router.get("/command-broadcast/streams/:id", async (req: Request, res: Response) => {
  try {
    const stream = await getStream(parseInt(req.params.id), getOrgId(req));
    if (!stream) return sendBadRequest(res, "Stream not found");
    sendSuccess(res, { stream });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch stream");
  }
});

router.post("/command-broadcast/streams/:id/start", authMiddleware(), async (req: Request, res: Response) => {
  try {
    await startStream(parseInt(req.params.id), getOrgId(req));
    sendSuccess(res, { started: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to start stream");
  }
});

router.post("/command-broadcast/streams/:id/end", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const report = await endStream(parseInt(req.params.id), getOrgId(req));
    sendSuccess(res, { ended: true, report });
  } catch (err) {
    handleRouteError(res, err, "Failed to end stream");
  }
});

router.get("/command-broadcast/streams/:id/captions", async (req: Request, res: Response) => {
  try {
    const captions = await getStreamCaptions(parseInt(req.params.id));
    sendSuccess(res, { captions });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch captions");
  }
});

router.get("/command-broadcast/streams/:id/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return sendBadRequest(res, "query parameter 'q' is required");
    const results = await searchTranscript(parseInt(req.params.id), q as string);
    sendSuccess(res, { results, query: q });
  } catch (err) {
    handleRouteError(res, err, "Failed to search transcript");
  }
});

router.get("/command-broadcast/streams/:id/highlights", async (req: Request, res: Response) => {
  try {
    const highlights = await getStreamHighlights(parseInt(req.params.id));
    sendSuccess(res, { highlights });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch highlights");
  }
});

router.get("/command-broadcast/streams/:id/report", async (req: Request, res: Response) => {
  try {
    const report = await getStreamReport(parseInt(req.params.id));
    if (!report) return sendBadRequest(res, "Report not found — stream may still be live or not yet processed");
    sendSuccess(res, { report });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch broadcast report");
  }
});

router.get("/command-broadcast/streams/:id/heatmap", async (req: Request, res: Response) => {
  try {
    const heatmap = await getAttentionHeatmap(parseInt(req.params.id));
    sendSuccess(res, { heatmap });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch attention heatmap");
  }
});

router.get("/command-broadcast/streams/:id/engagement", async (req: Request, res: Response) => {
  try {
    const engagement = await getLiveEngagement(parseInt(req.params.id));
    sendSuccess(res, { engagement });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch engagement data");
  }
});

export default router;
