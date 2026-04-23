import { type CascadeHorizon, type DomainKey, type FusionAlertCategory, type FusionAlertSeverity, fusionCortex, patternLibrary, predictiveCascadeEngine } from '@szl-holdings/ai-engine';
import { bodyShape } from '@szl-holdings/contracts/common';
import { Router } from 'express';
import { z } from 'zod';
import { sendBadRequest, sendError } from '../lib/api-response';
import { syncAlertStatus } from '../lib/fusion-persistence';
import { guardSeedInProduction } from '../lib/seed-guard';
import { anyQuerySchema, listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/fusion/alerts', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  const severity = req.query.severity
    ? (String(req.query.severity).split(',') as FusionAlertSeverity[])
    : undefined;
  const categories = req.query.categories
    ? (String(req.query.categories).split(',') as FusionAlertCategory[])
    : undefined;
  const domains = req.query.domains ? String(req.query.domains).split(',') : undefined;
  const status = req.query.status
    ? (String(req.query.status).split(',') as Array<
        'active' | 'acknowledged' | 'resolved' | 'escalated'
      >)
    : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10), 100);

  const alerts = fusionCortex.getAlerts({ severity, categories, domains, status, limit });
  res.json({ success: true, alerts, total: alerts.length });
});

router.get('/fusion/stats', authMiddleware(), async (_req, res) => {
  const stats = fusionCortex.getStats();
  res.json({ success: true, stats });
});

router.post('/fusion/scan', validateBody(bodyShape({})), authMiddleware(), async (_req, res) => {
  try {
    const result = await fusionCortex.scan();
    res.json({ success: true, result });
  } catch (_err) {
    res.status(500).json({ success: false, error: 'Fusion scan failed' });
  }
});

router.post(
  '/fusion/alerts/:id/acknowledge',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    const ok = fusionCortex.acknowledgeAlert(req.params.id as string);
    if (!ok) return sendError(res, 'Alert not found', 404);
    void syncAlertStatus(req.params.id as string, 'acknowledged');
    res.json({ success: true, message: 'Alert acknowledged' });
  },
);

router.post(
  '/fusion/alerts/:id/resolve',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    const ok = fusionCortex.resolveAlert(req.params.id as string);
    if (!ok) return sendError(res, 'Alert not found', 404);
    void syncAlertStatus(req.params.id as string, 'resolved');
    res.json({ success: true, message: 'Alert resolved' });
  },
);

router.post(
  '/fusion/alerts/inject',
  authMiddleware(),
  validateBody(
    bodyShape({
      advisoryContext: z.unknown().optional(),
      affectedDomains: z.unknown().optional(),
      affectedEntities: z.unknown().optional(),
      category: z.unknown().optional(),
      confidence: z.unknown().optional(),
      evidenceChain: z.unknown().optional(),
      recommendedActions: z.unknown().optional(),
      severity: z.unknown().optional(),
      summary: z.unknown().optional(),
      tags: z.unknown().optional(),
      title: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const {
        title,
        summary,
        severity,
        category,
        affectedDomains,
        affectedEntities,
        evidenceChain,
        recommendedActions,
        tags = [],
        advisoryContext,
      } = req.body;
      if (!title || !summary || !severity || !category)
        return sendBadRequest(res, 'title, summary, severity, and category are required');

      const alert = fusionCortex.injectAlert({
        title,
        summary,
        severity,
        category,
        confidence: req.body.confidence ?? 0.8,
        affectedDomains: affectedDomains ?? [],
        affectedEntities: affectedEntities ?? [],
        evidenceChain: evidenceChain ?? [],
        recommendedActions: recommendedActions ?? [],
        advisoryContext,
        tags,
      });

      res.json({ success: true, alert });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to inject alert' });
    }
  },
);

router.post(
  '/fusion/demo/seed',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (_req, res) => {
    if (guardSeedInProduction(res)) return;
    fusionCortex.seedDemoAlerts();
    predictiveCascadeEngine.seedDemoAlerts();
    res.json({
      success: true,
      message: 'Demo fusion alerts seeded',
      alerts: fusionCortex.getAlerts({ limit: 10 }),
    });
  },
);

router.post(
  '/fusion/start-continuous',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    const intervalMs = parseInt(String(req.query.intervalMs ?? '300000'), 10);
    fusionCortex.startContinuousScan(intervalMs);
    res.json({ success: true, message: 'Fusion Cortex continuous scan started', intervalMs });
  },
);

router.post(
  '/fusion/stop-continuous',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (_req, res) => {
    fusionCortex.stopContinuousScan();
    res.json({ success: true, message: 'Fusion Cortex continuous scan stopped' });
  },
);

router.get('/fusion/patterns', authMiddleware(), async (_req, res) => {
  const patterns = patternLibrary.getAll();
  const stats = patternLibrary.getLibraryStats();
  res.json({ success: true, patterns, stats });
});

router.get('/fusion/patterns/:id', authMiddleware(), async (req, res) => {
  const pattern = patternLibrary.getById(req.params.id as string);
  if (!pattern) return sendError(res, 'Pattern not found', 404);
  res.json({ success: true, pattern });
});

router.post(
  '/fusion/patterns/:id/feedback',
  authMiddleware(),
  validateBody(
    bodyShape({
      alertId: z.unknown().optional(),
      notes: z.unknown().optional(),
      rating: z.unknown().optional(),
      relevance: z.unknown().optional(),
      reviewedBy: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { alertId, relevance, rating, notes, reviewedBy } = req.body;
      if (!alertId || !relevance || !rating)
        return sendBadRequest(res, 'alertId, relevance, and rating are required');

      const feedback = patternLibrary.submitFeedback({
        patternId: req.params.id as string,
        alertId,
        relevance,
        rating: Number(rating),
        notes,
        reviewedBy,
      });

      if (!feedback) return sendError(res, 'Pattern not found', 404);
      res.json({
        success: true,
        feedback,
        updatedPattern: patternLibrary.getById(req.params.id as string),
      });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to submit feedback' });
    }
  },
);

router.post(
  '/fusion/alerts/:alertId/feedback',
  authMiddleware(),
  validateBody(
    bodyShape({
      notes: z.unknown().optional(),
      patternId: z.unknown().optional(),
      rating: z.unknown().optional(),
      relevance: z.unknown().optional(),
      reviewedBy: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { patternId, relevance, rating, notes, reviewedBy } = req.body;
      if (!relevance || !rating) return sendBadRequest(res, 'relevance and rating are required');

      const effectivePatternId =
        patternId ??
        fusionCortex.getAlerts({ limit: 500 }).find((a) => a.id === (req.params.alertId as string))
          ?.patternId;

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

      res.json({
        success: true,
        feedback: {
          alertId: req.params.alertId as string,
          relevance,
          rating: Number(rating),
          notes,
          reviewedBy,
          reviewedAt: new Date().toISOString(),
        },
        patternUpdated: false,
      });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to submit feedback' });
    }
  },
);

router.post(
  '/fusion/patterns/custom',
  authMiddleware(),
  validateBody(
    bodyShape({
      category: z.unknown().optional(),
      description: z.unknown().optional(),
      evidenceTypes: z.unknown().optional(),
      name: z.unknown().optional(),
      requiredDomains: z.unknown().optional(),
      tags: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { name, description, category, requiredDomains, evidenceTypes, tags } = req.body;
      if (!name || !description || !category || !requiredDomains) {
        return sendBadRequest(res, 'name, description, category, and requiredDomains are required');
      }
      const pattern = patternLibrary.addCustomPattern({
        name,
        description,
        category,
        requiredDomains,
        evidenceTypes: evidenceTypes ?? [],
        tags,
      });
      res.json({ success: true, pattern });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to create pattern' });
    }
  },
);

router.get(
  '/fusion/predictive/alerts',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const status = req.query.status
      ? (String(req.query.status).split(',') as Array<'active' | 'monitoring' | 'resolved'>)
      : undefined;
    const severity = req.query.severity
      ? (String(req.query.severity).split(',') as Array<'low' | 'medium' | 'high' | 'critical'>)
      : undefined;
    const domains = req.query.domains
      ? (String(req.query.domains).split(',') as DomainKey[])
      : undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10), 100);

    const alerts = predictiveCascadeEngine.getAlerts({ status, severity, domains, limit });
    res.json({ success: true, alerts, total: alerts.length });
  },
);

router.post(
  '/fusion/predictive/project',
  authMiddleware(),
  validateBody(
    bodyShape({
      horizon: z.unknown().optional(),
      rootDomain: z.unknown().optional(),
      rootProbability: z.unknown().optional(),
      rootSignal: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { rootDomain, rootSignal, rootProbability, horizon = '30d' } = req.body;
      if (!rootDomain || !rootSignal || rootProbability === undefined) {
        return sendBadRequest(res, 'rootDomain, rootSignal, and rootProbability are required');
      }
      const tree = predictiveCascadeEngine.projectCascade(
        rootDomain as DomainKey,
        rootSignal,
        Number(rootProbability),
        horizon as CascadeHorizon,
      );
      res.json({ success: true, tree });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Cascade projection failed' });
    }
  },
);

router.post(
  '/fusion/predictive/generate',
  authMiddleware(),
  validateBody(
    bodyShape({
      confidence: z.unknown().optional(),
      horizon: z.unknown().optional(),
      tags: z.unknown().optional(),
      title: z.unknown().optional(),
      triggerDomain: z.unknown().optional(),
      triggerSignal: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const {
        title,
        triggerDomain,
        triggerSignal,
        confidence,
        horizon = '30d',
        tags = [],
      } = req.body;
      if (!title || !triggerDomain || !triggerSignal || confidence === undefined) {
        return sendBadRequest(
          res,
          'title, triggerDomain, triggerSignal, and confidence are required',
        );
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
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to generate predictive alert' });
    }
  },
);

router.post(
  '/fusion/predictive/alerts/:id/resolve',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    const ok = predictiveCascadeEngine.resolveAlert(req.params.id as string);
    if (!ok) return sendError(res, 'Predictive alert not found', 404);
    res.json({ success: true, message: 'Predictive alert resolved' });
  },
);

export default router;
