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
import { authMiddleware } from "../middlewares/auth";

const router = Router();

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

router.get("/nuro-mesh/consciousness/snapshot", authMiddleware(), safeHandler("snapshot", () => captureConsciousnessSnapshot()));

router.get("/nuro-mesh/consciousness/metacognition", authMiddleware(), safeHandler("metacognition", () => metacognitiveMonitor.getState()));

router.get("/nuro-mesh/consciousness/self-model", authMiddleware(), safeHandler("self-model", () => selfModelEngine.getSelfModel()));

router.get("/nuro-mesh/consciousness/workspace", authMiddleware(), safeHandler("workspace", () => cognitiveWorkspace.getState()));

router.get("/nuro-mesh/consciousness/monologue", authMiddleware(), safeHandler("monologue", (req) => {
  const limit = Math.min(50, parseInt(String(req.query?.limit ?? "20"), 10));
  const state = innerMonologue.getState();
  state.recentThoughts = state.recentThoughts.slice(0, limit);
  return state;
}));

router.get("/nuro-mesh/consciousness/goals", authMiddleware(), safeHandler("goals", () => goalEngine.getState()));

router.get("/nuro-mesh/consciousness/emotions", authMiddleware(), safeHandler("emotions", () => emotionalSignals.getState()));

router.get("/nuro-mesh/consciousness/temporal", authMiddleware(), safeHandler("temporal", () => temporalAwareness.getState()));

export default router;
