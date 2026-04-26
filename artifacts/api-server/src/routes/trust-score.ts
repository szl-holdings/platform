import { Router } from 'express';
import { requireRole } from '../middlewares/auth';
import { getTrustEngineForTenant, extractTenantId } from '../services/tenant-trust-registry';

const router = Router();

const VALID_TRUST_LEVELS = ['untrusted', 'supervised', 'trusted', 'autonomous'] as const;
const VALID_RISK_TIERS = ['low', 'medium', 'high'] as const;

router.get('/trust/scores', async (req, res) => {
  try {
    const tenantId = extractTenantId(req as Record<string, unknown>);
    const engine = await getTrustEngineForTenant(tenantId);
    res.json({ scores: engine.getAllScores() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get trust scores' });
  }
});

router.get('/trust/scores/:agentId', async (req, res) => {
  try {
    const tenantId = extractTenantId(req as Record<string, unknown>);
    const engine = await getTrustEngineForTenant(tenantId);
    const score = engine.getScore(req.params.agentId);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get agent score' });
  }
});

router.post(
  '/trust/record',
  requireRole('admin', 'ops'),
  async (req, res) => {
    try {
      const { agentId, actionType, success, riskTier } = req.body;
      if (typeof agentId !== 'string' || !agentId.trim()) {
        res.status(400).json({ error: '"agentId" is required and must be a non-empty string' });
        return;
      }
      if (typeof actionType !== 'string' || !actionType.trim()) {
        res.status(400).json({ error: '"actionType" is required and must be a non-empty string' });
        return;
      }
      if (typeof success !== 'boolean') {
        res.status(400).json({ error: '"success" is required and must be a boolean' });
        return;
      }
      const tier = riskTier ?? 'low';
      if (!VALID_RISK_TIERS.includes(tier)) {
        res.status(400).json({ error: `"riskTier" must be one of: ${VALID_RISK_TIERS.join(', ')}` });
        return;
      }

      const tenantId = extractTenantId(req as Record<string, unknown>);
      const engine = await getTrustEngineForTenant(tenantId);
      const userId = req.user?.id ?? 'unknown';
      const score = engine.recordOutcome(agentId, actionType, success, tier);
      res.json({ ...score, recordedBy: userId });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to record outcome' });
    }
  },
);

router.post(
  '/trust/evaluate',
  requireRole('admin', 'ops'),
  async (req, res) => {
    try {
      const { agentId, actionType, riskTier } = req.body;
      if (typeof agentId !== 'string' || !agentId.trim()) {
        res.status(400).json({ error: '"agentId" is required and must be a non-empty string' });
        return;
      }
      if (typeof actionType !== 'string' || !actionType.trim()) {
        res.status(400).json({ error: '"actionType" is required and must be a non-empty string' });
        return;
      }
      const tier = riskTier ?? 'low';
      if (!VALID_RISK_TIERS.includes(tier)) {
        res.status(400).json({ error: `"riskTier" must be one of: ${VALID_RISK_TIERS.join(', ')}` });
        return;
      }

      const tenantId = extractTenantId(req as Record<string, unknown>);
      const engine = await getTrustEngineForTenant(tenantId);
      const decision = engine.evaluateApproval(agentId, actionType, tier);
      res.json(decision);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to evaluate approval' });
    }
  },
);

router.post(
  '/trust/set-level',
  requireRole('admin', 'ops'),
  async (req, res) => {
    try {
      const { agentId, level, reason } = req.body;
      if (typeof agentId !== 'string' || !agentId.trim()) {
        res.status(400).json({ error: '"agentId" is required and must be a non-empty string' });
        return;
      }
      if (!VALID_TRUST_LEVELS.includes(level)) {
        res.status(400).json({ error: `"level" must be one of: ${VALID_TRUST_LEVELS.join(', ')}` });
        return;
      }
      if (typeof reason !== 'string' || !reason.trim()) {
        res.status(400).json({ error: '"reason" is required and must be a non-empty string' });
        return;
      }

      const tenantId = extractTenantId(req as Record<string, unknown>);
      const engine = await getTrustEngineForTenant(tenantId);
      const userId = req.user?.id ?? 'unknown';

      engine.setLevel(
        agentId,
        level,
        `${reason} [set by user:${userId}]`,
      );
      const score = engine.getScore(agentId);
      res.json(score);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to set trust level' });
    }
  },
);

router.delete(
  '/trust/reset/:agentId',
  requireRole('admin'),
  async (req, res) => {
    try {
      const agentId = req.params.agentId;
      if (!agentId.trim()) {
        res.status(400).json({ error: 'agentId path parameter is required' });
        return;
      }

      const tenantId = extractTenantId(req as Record<string, unknown>);
      const engine = await getTrustEngineForTenant(tenantId);
      const userId = req.user?.id ?? 'unknown';

      engine.resetAgent(agentId);
      res.json({
        success: true,
        resetBy: userId,
        agentId,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to reset agent' });
    }
  },
);

router.get('/trust/policy', async (req, res) => {
  try {
    const tenantId = extractTenantId(req as Record<string, unknown>);
    const engine = await getTrustEngineForTenant(tenantId);
    res.json(engine.getPolicy());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get policy' });
  }
});

export default router;
