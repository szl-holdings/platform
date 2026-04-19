import { Router, type IRouter, type Request, type Response } from "express";
import { runMeshScan, loadMeshState } from "../services/agent-mesh-collector";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function orgIdFromReq(req: Request): number | null {
  const u = req.user as { orgId?: number | string } | undefined;
  if (!u?.orgId) return null;
  const n = typeof u.orgId === "string" ? parseInt(u.orgId, 10) : u.orgId;
  return Number.isFinite(n) ? n : null;
}

router.get("/agent-mesh/state", async (req: Request, res: Response) => {
  try {
    const state = await loadMeshState(orgIdFromReq(req));
    res.json(state);
  } catch (err) {
    logger.warn({ err }, "[agent-mesh] state failed");
    res.status(500).json({ error: "agent-mesh state unavailable" });
  }
});

router.get("/agent-mesh/index", async (req: Request, res: Response) => {
  try {
    const state = await loadMeshState(orgIdFromReq(req));
    if (!state.resilienceIndex) {
      res.status(404).json({ error: "no resilience index — run /agent-mesh/scan first" });
      return;
    }
    res.json(state.resilienceIndex);
  } catch (err) {
    logger.warn({ err }, "[agent-mesh] index failed");
    res.status(500).json({ error: "index unavailable" });
  }
});

router.post("/agent-mesh/scan", async (req: Request, res: Response) => {
  try {
    const extraPaths = Array.isArray(req.body?.paths) ? (req.body.paths as string[]) : [];
    const result = await runMeshScan({ extraPaths, orgId: orgIdFromReq(req) });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "[agent-mesh] scan failed");
    res.status(500).json({ error: "scan failed" });
  }
});

export default router;
