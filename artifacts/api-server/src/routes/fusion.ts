import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendBadRequest, sendError } from "../lib/api-response";
import { fusionCortex, patternLibrary, predictiveCascadeEngine } from "@szl-holdings/ai-engine";
import type { FusionAlertSeverity, FusionAlertCategory, DomainKey, CascadeHorizon } from "@szl-holdings/ai-engine";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router = Router();

router.get("/fusion/alerts", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  const severity = req.query.severity ? String(req.query.severity).split(",") as FusionAlertSeverity[] : undefined;
  const categories = req.query.categories ? String(req.query.categories).split(",") as FusionAlertCategory[] : undefined;
  const domains = req.query.domains ? String(req.query.domains).split(",") : undefined;
  const status = req.query.status ? String(req.query.status).split(",") as Array<"active" | "acknowledged" | "resolved" | "escalated"> : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 100);

  const alerts = fusionCortex.getAlerts({ severity, categories, domains, status, limit });
  res.json({ success: true, alerts, total: alerts.length });
});

router.get("/fusion/stats", authMiddleware(), async (_req, res) => {
  const stats = fusionCortex.getStats();
  res.json({ success: true, stats });
});

router.post("/fusion/scan", authMiddleware(), async (_req, res) => {
  try {
    const result = await fusionCortex.scan();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: "Fusion scan failed" });
  }
});

router.post("/fusion/alerts/:id/acknowledge", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  const ok = fusionCortex.acknowledgeAlert(req.params.id as string);
  if (!ok) return sendError(res, "Alert not found", 404);
  res.json({ success: true, message: "Alert acknowledged" });
});

router.post("/fusion/alerts/:id/resolve", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  const ok = fusionCortex.resolveAlert(req.params.id as string);
  if (!ok) return sendError(res, "Alert not found", 404);
  res.json({ success: true, message: "Alert resolved" });
});

router.post("/fusion/alerts/inject", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
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

router.post("/fusion/demo/seed", authMiddleware(), async (_req, res) => {
  fusionCortex.seedDemoAlerts();
  predictiveCascadeEngine.seedDemoAlerts();
  res.json({ success: true, message: "Demo fusion alerts seeded", alerts: fusionCortex.getAlerts({ limit: 10 }) });
});

router.post("/fusion/start-continuous", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  const intervalMs = parseInt(String(req.query.intervalMs ?? "300000"));
  fusionCortex.startContinuousScan(intervalMs);
  res.json({ success: true, message: "Fusion Cortex continuous scan started", intervalMs });
});

router.post("/fusion/stop-continuous", authMiddleware(), async (_req, res) => {
  fusionCortex.stopContinuousScan();
  res.json({ success: true, message: "Fusion Cortex continuous scan stopped" });
});

router.get("/fusion/patterns", authMiddleware(), async (req, res) => {
  const patterns = patternLibrary.getAll();
  const stats = patternLibrary.getLibraryStats();
  res.json({ success: true, patterns, stats });
});

router.get("/fusion/patterns/:id", authMiddleware(), async (req, res) => {
  const pattern = patternLibrary.getById(req.params.id as string);
  if (!pattern) return sendError(res, "Pattern not found", 404);
  res.json({ success: true, pattern });
});

router.post("/fusion/patterns/:id/feedback", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { alertId, relevance, rating, notes, reviewedBy } = req.body;
    if (!alertId || !relevance || !rating) return sendBadRequest(res, "alertId, relevance, and rating are required");

    const feedback = patternLibrary.submitFeedback({
      patternId: req.params.id as string,
      alertId,
      relevance,
      rating: Number(rating),
      notes,
      reviewedBy,
    });

    if (!feedback) return sendError(res, "Pattern not found", 404);
    res.json({ success: true, feedback, updatedPattern: patternLibrary.getById(req.params.id as string) });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to submit feedback" });
  }
});

router.post("/fusion/alerts/:alertId/feedback", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { patternId, relevance, rating, notes, reviewedBy } = req.body;
    if (!relevance || !rating) return sendBadRequest(res, "relevance and rating are required");

    const effectivePatternId = patternId ?? fusionCortex.getAlerts({ limit: 500 }).find(a => a.id === req.params.alertId as string)?.patternId;

    if (effectivePatternId) {
      const feedback = patternLibrary.submitFeedback({
        patternId: effectivePatternId,
        alertId: req.params.alertId as string,
        relevance,
        rating: Number(rating),
        notes,
        reviewedBy,
      });
      if (feedback) {
        return res.json({ success: true, feedback, patternUpdated: true });
      }
    }

    res.json({ success: true, feedback: { alertId: req.params.alertId as string, relevance, rating: Number(rating), notes, reviewedBy, reviewedAt: new Date().toISOString() }, patternUpdated: false });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to submit feedback" });
  }
});

router.post("/fusion/patterns/custom", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { name, description, category, requiredDomains, evidenceTypes, tags } = req.body;
    if (!name || !description || !category || !requiredDomains) {
      return sendBadRequest(res, "name, description, category, and requiredDomains are required");
    }
    const pattern = patternLibrary.addCustomPattern({ name, description, category, requiredDomains, evidenceTypes: evidenceTypes ?? [], tags });
    res.json({ success: true, pattern });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create pattern" });
  }
});

router.get("/fusion/predictive/alerts", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  const status = req.query.status ? String(req.query.status).split(",") as Array<"active" | "monitoring" | "resolved"> : undefined;
  const severity = req.query.severity ? String(req.query.severity).split(",") as Array<"low" | "medium" | "high" | "critical"> : undefined;
  const domains = req.query.domains ? String(req.query.domains).split(",") as DomainKey[] : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 100);

  const alerts = predictiveCascadeEngine.getAlerts({ status, severity, domains, limit });
  res.json({ success: true, alerts, total: alerts.length });
});

router.post("/fusion/predictive/project", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { rootDomain, rootSignal, rootProbability, horizon = "30d" } = req.body;
    if (!rootDomain || !rootSignal || rootProbability === undefined) {
      return sendBadRequest(res, "rootDomain, rootSignal, and rootProbability are required");
    }
    const tree = predictiveCascadeEngine.projectCascade(
      rootDomain as DomainKey,
      rootSignal,
      Number(rootProbability),
      horizon as CascadeHorizon,
    );
    res.json({ success: true, tree });
  } catch (err) {
    res.status(500).json({ success: false, error: "Cascade projection failed" });
  }
});

router.post("/fusion/predictive/generate", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { title, triggerDomain, triggerSignal, confidence, horizon = "30d", tags = [] } = req.body;
    if (!title || !triggerDomain || !triggerSignal || confidence === undefined) {
      return sendBadRequest(res, "title, triggerDomain, triggerSignal, and confidence are required");
    }
    const alert = predictiveCascadeEngine.generatePredictiveAlert(
      title,
      triggerDomain as DomainKey,
      triggerSignal,
      Number(confidence),
      horizon as CascadeHorizon,
      tags,
    );
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to generate predictive alert" });
  }
});

router.post("/fusion/predictive/alerts/:id/resolve", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  const ok = predictiveCascadeEngine.resolveAlert(req.params.id as string);
  if (!ok) return sendError(res, "Predictive alert not found", 404);
  res.json({ success: true, message: "Predictive alert resolved" });
});

export default router;
