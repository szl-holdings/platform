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

router.get("/nuro-mesh/consciousness/snapshot", safeHandler("snapshot", () => captureConsciousnessSnapshot()));

router.get("/nuro-mesh/consciousness/metacognition", safeHandler("metacognition", () => metacognitiveMonitor.getState()));

router.get("/nuro-mesh/consciousness/self-model", safeHandler("self-model", () => selfModelEngine.getSelfModel()));

router.get("/nuro-mesh/consciousness/workspace", safeHandler("workspace", () => cognitiveWorkspace.getState()));

router.get("/nuro-mesh/consciousness/monologue", safeHandler("monologue", (req) => {
  const limit = Math.min(50, parseInt(String(req.query?.limit ?? "20"), 10));
  const state = innerMonologue.getState();
  state.recentThoughts = state.recentThoughts.slice(0, limit);
  return state;
}));

router.get("/nuro-mesh/consciousness/goals", safeHandler("goals", () => goalEngine.getState()));

router.get("/nuro-mesh/consciousness/emotions", safeHandler("emotions", () => emotionalSignals.getState()));

router.get("/nuro-mesh/consciousness/temporal", safeHandler("temporal", () => temporalAwareness.getState()));

export default router;
