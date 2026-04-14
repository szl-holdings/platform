import { Router, type Request, type Response } from "express";
import {
  captureConsciousnessSnapshot,
  metacognitiveMonitor,
  selfModelEngine,
  cognitiveWorkspace,
  innerMonologue,
  goalEngine,
  emotionalSignals,
  temporalAwareness,
} from "@szl-holdings/ai-engine";
import { db } from "@szl-holdings/db";
import {
  consciousnessSnapshotsTable,
  consciousnessMonologueTable,
  consciousnessGoalsTable,
  consciousnessAgentProfilesTable,
  consciousnessEmotionalHistoryTable,
  consciousnessTemporalMetricsTable,
} from "@szl-holdings/db";
import { desc, eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router = Router();

const adminOnly = [authMiddleware(), requireRole("admin")];

function safeHandler(label: string, fn: (req: Request) => unknown) {
  return (req: Request, res: Response) => {
    try {
      const result = fn(req);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: `consciousness/${label} failed`, message });
    }
  };
}

function asyncHandler(label: string, fn: (req: Request) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    try {
      const result = await fn(req);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: `consciousness/${label} failed`, message });
    }
  };
}

router.get("/nuro-mesh/consciousness/snapshot", ...adminOnly, safeHandler("snapshot", () => captureConsciousnessSnapshot()));

router.get("/nuro-mesh/consciousness/metacognition", ...adminOnly, safeHandler("metacognition", () => metacognitiveMonitor.getState()));

router.get("/nuro-mesh/consciousness/self-model", ...adminOnly, safeHandler("self-model", () => selfModelEngine.getSelfModel()));

router.get("/nuro-mesh/consciousness/workspace", ...adminOnly, safeHandler("workspace", () => cognitiveWorkspace.getState()));

router.get("/nuro-mesh/consciousness/monologue", ...adminOnly, safeHandler("monologue", (req) => {
  const limit = Math.min(50, parseInt(String(req.query?.limit ?? "20"), 10));
  const state = innerMonologue.getState();
  state.recentThoughts = state.recentThoughts.slice(0, limit);
  return state;
}));

router.get("/nuro-mesh/consciousness/goals", ...adminOnly, safeHandler("goals", () => goalEngine.getState()));

router.get("/nuro-mesh/consciousness/emotions", ...adminOnly, safeHandler("emotions", () => emotionalSignals.getState()));

router.get("/nuro-mesh/consciousness/temporal", ...adminOnly, safeHandler("temporal", () => temporalAwareness.getState()));

function safeLimit(raw: unknown, fallback: number, max: number): number {
  const parsed = parseInt(String(raw ?? fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

router.get("/nuro-mesh/consciousness/history/snapshots", ...adminOnly, asyncHandler("history/snapshots", async (req) => {
  const limit = safeLimit(req.query?.limit, 20, 100);
  return db.select().from(consciousnessSnapshotsTable).orderBy(desc(consciousnessSnapshotsTable.createdAt)).limit(limit);
}));

router.get("/nuro-mesh/consciousness/history/monologue", ...adminOnly, asyncHandler("history/monologue", async (req) => {
  const limit = safeLimit(req.query?.limit, 50, 200);
  return db.select().from(consciousnessMonologueTable).orderBy(desc(consciousnessMonologueTable.createdAt)).limit(limit);
}));

router.get("/nuro-mesh/consciousness/history/goals", ...adminOnly, asyncHandler("history/goals", async () => {
  return db.select().from(consciousnessGoalsTable).orderBy(desc(consciousnessGoalsTable.updatedAt)).limit(50);
}));

router.get("/nuro-mesh/consciousness/history/profiles", ...adminOnly, asyncHandler("history/profiles", async () => {
  return db.select().from(consciousnessAgentProfilesTable).orderBy(desc(consciousnessAgentProfilesTable.updatedAt)).limit(50);
}));

router.get("/nuro-mesh/consciousness/history/emotions", ...adminOnly, asyncHandler("history/emotions", async (req) => {
  const limit = safeLimit(req.query?.limit, 50, 200);
  return db.select().from(consciousnessEmotionalHistoryTable).orderBy(desc(consciousnessEmotionalHistoryTable.capturedAt)).limit(limit);
}));

router.get("/nuro-mesh/consciousness/history/temporal", ...adminOnly, asyncHandler("history/temporal", async (req) => {
  const agentId = req.query?.agentId ? String(req.query.agentId) : undefined;
  const limit = safeLimit(req.query?.limit, 50, 200);
  const query = db.select().from(consciousnessTemporalMetricsTable);
  if (agentId) {
    return query.where(eq(consciousnessTemporalMetricsTable.agentId, agentId)).orderBy(desc(consciousnessTemporalMetricsTable.createdAt)).limit(limit);
  }
  return query.orderBy(desc(consciousnessTemporalMetricsTable.createdAt)).limit(limit);
}));

export default router;
