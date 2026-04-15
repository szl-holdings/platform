import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendBadRequest, sendError } from "../lib/api-response";
import { fusionCortex } from "@szl-holdings/ai-engine";
import type { FusionAlertSeverity, FusionAlertCategory } from "@szl-holdings/ai-engine";

const router = Router();

router.get("/fusion/alerts", authMiddleware, async (req, res) => {
  const severity = req.query.severity ? String(req.query.severity).split(",") as FusionAlertSeverity[] : undefined;
  const categories = req.query.categories ? String(req.query.categories).split(",") as FusionAlertCategory[] : undefined;
  const domains = req.query.domains ? String(req.query.domains).split(",") : undefined;
  const status = req.query.status ? String(req.query.status).split(",") as Array<"active" | "acknowledged" | "resolved" | "escalated"> : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 100);

  const alerts = fusionCortex.getAlerts({ severity, categories, domains, status, limit });
  res.json({ success: true, alerts, total: alerts.length });
});

router.get("/fusion/stats", authMiddleware, async (_req, res) => {
  const stats = fusionCortex.getStats();
  res.json({ success: true, stats });
});

router.post("/fusion/scan", authMiddleware, async (_req, res) => {
  try {
    const result = await fusionCortex.scan();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: "Fusion scan failed" });
  }
});

router.post("/fusion/alerts/:id/acknowledge", authMiddleware, async (req, res) => {
  const ok = fusionCortex.acknowledgeAlert(req.params.id);
  if (!ok) return sendError(res, 404, "Alert not found");
  res.json({ success: true, message: "Alert acknowledged" });
});

router.post("/fusion/alerts/:id/resolve", authMiddleware, async (req, res) => {
  const ok = fusionCortex.resolveAlert(req.params.id);
  if (!ok) return sendError(res, 404, "Alert not found");
  res.json({ success: true, message: "Alert resolved" });
});

router.post("/fusion/alerts/inject", authMiddleware, async (req, res) => {
  try {
    const { title, summary, severity, category, affectedDomains, affectedEntities, evidenceChain, recommendedActions, tags = [], advisoryContext } = req.body;
    if (!title || !summary || !severity || !category) return sendBadRequest(res, "title, summary, severity, and category are required");

    const alert = fusionCortex.injectAlert({
      title, summary, severity, category,
      confidence: req.body.confidence ?? 0.8,
      affectedDomains: affectedDomains ?? [],
      affectedEntities: affectedEntities ?? [],
      evidenceChain: evidenceChain ?? [],
      recommendedActions: recommendedActions ?? [],
      advisoryContext,
      tags,
    });

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to inject alert" });
  }
});

router.post("/fusion/demo/seed", authMiddleware, async (_req, res) => {
  fusionCortex.seedDemoAlerts();
  res.json({ success: true, message: "Demo fusion alerts seeded", alerts: fusionCortex.getAlerts({ limit: 10 }) });
});

router.post("/fusion/start-continuous", authMiddleware, async (req, res) => {
  const intervalMs = parseInt(String(req.query.intervalMs ?? "300000"));
  fusionCortex.startContinuousScan(intervalMs);
  res.json({ success: true, message: "Fusion Cortex continuous scan started", intervalMs });
});

router.post("/fusion/stop-continuous", authMiddleware, async (_req, res) => {
  fusionCortex.stopContinuousScan();
  res.json({ success: true, message: "Fusion Cortex continuous scan stopped" });
});

export default router;
