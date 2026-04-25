/**
 * Alloy Meridian — API Routes
 *
 * Exposes endpoints for: model router status, agent health, forecast
 * queries, signal graph, governance, flight recorder, MCP status,
 * Decision Weather, Counterfactual Ledger, and Founder Intent.
 *
 * All routes are read-safe. Mutation routes require authentication
 * and explicit approval in production.
 */

import { type Request, type Response, Router } from 'express';
import { sendError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { modelRouter } from '../services/model-router.js';
import {
  counterfactualLedger,
  flightRecorder,
  forecastCouncil,
  generateDecisionWeather,
  getAgentHealth,
  getRegistryStatus,
  getMcpRegistry,
  checkGovernance,
  FOUNDER_INTENT,
  evaluateAgainstDoctrine,
  validateRecommendationCompleteness,
  listAgents,
  getAgent,
  GOVERNANCE_POLICY,
  signalGraphService,
  type BusinessMetric,
} from '../services/meridian/index.js';

const router = Router();

router.get('/meridian/status', (_req: Request, res: Response) => {
  try {
    const lanes = modelRouter.status();
    const agents = getAgentHealth();
    const mcpStatus = getRegistryStatus();

    sendSuccess(res, {
      layer: 'alloy-meridian',
      version: '1.0.0',
      modelRouter: {
        lanes,
        liveCount: lanes.filter((l) => l.mode === 'live').length,
        mockCount: lanes.filter((l) => l.mode === 'mock').length,
      },
      agents: {
        total: agents.length,
        healthy: agents.filter((a) => a.status === 'healthy').length,
        agents,
      },
      mcpServers: mcpStatus,
      retrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'meridian status error');
    sendError(res, 'Failed to retrieve Meridian status');
  }
});

router.get('/meridian/model-router', (_req: Request, res: Response) => {
  try {
    const lanes = modelRouter.getAllLanes();
    const status = modelRouter.status();

    sendSuccess(res, {
      lanes,
      status,
      defaultProvider: process.env.MODEL_ROUTER_DEFAULT_PROVIDER ?? 'deepseek',
      requireHumanApproval: process.env.MERIDIAN_REQUIRE_HUMAN_APPROVAL === 'true',
      retrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'model router error');
    sendError(res, 'Failed to retrieve model router configuration');
  }
});

router.post('/meridian/model-router/route', (req: Request, res: Response) => {
  try {
    const { lane, preferredModelId } = req.body as { lane?: string; preferredModelId?: string };
    if (!lane) {
      res.status(400).json({ error: 'lane is required' });
      return;
    }
    const decision = modelRouter.route(lane as Parameters<typeof modelRouter.route>[0], preferredModelId);
    sendSuccess(res, decision);
  } catch (err) {
    logger.error({ err }, 'model router route error');
    sendError(res, err instanceof Error ? err.message : 'Routing error');
  }
});

router.get('/meridian/agents', (_req: Request, res: Response) => {
  try {
    const agents = listAgents();
    const health = getAgentHealth();
    const healthMap = new Map(health.map((h) => [h.id, h.status]));

    sendSuccess(res, {
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        primaryLane: a.primaryLane,
        approvalClass: a.approvalClass,
        status: healthMap.get(a.id) ?? 'healthy',
        capabilityCount: a.capabilities.length,
        tags: a.tags,
      })),
      total: agents.length,
    });
  } catch (err) {
    logger.error({ err }, 'agents list error');
    sendError(res, 'Failed to retrieve agent constellation');
  }
});

router.get('/meridian/agents/:agentId', (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = getAgent(agentId);
    if (!agent) {
      res.status(404).json({ error: `Agent '${agentId}' not found` });
      return;
    }
    sendSuccess(res, agent);
  } catch (err) {
    logger.error({ err }, 'agent detail error');
    sendError(res, 'Failed to retrieve agent');
  }
});

router.get('/meridian/forecast', async (_req: Request, res: Response) => {
  try {
    const sessions = await forecastCouncil.runAllMetrics();
    const globalRankings = forecastCouncil.getTournamentRankings(sessions);

    sendSuccess(res, {
      sessions: sessions.map((s) => ({
        id: s.id,
        metric: s.metric,
        winner: s.winner,
        rankings: s.rankings,
        sessionAt: s.sessionAt,
        mode: s.results[0]?.mode ?? 'simulation',
      })),
      globalRankings,
      retrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'forecast error');
    sendError(res, 'Failed to run forecast council');
  }
});

router.get('/meridian/forecast/:metric', async (req: Request, res: Response) => {
  try {
    const { metric } = req.params;
    const session = await forecastCouncil.runSession(metric as BusinessMetric);
    sendSuccess(res, session);
  } catch (err) {
    logger.error({ err }, 'single metric forecast error');
    sendError(res, 'Failed to run forecast for metric');
  }
});

router.get('/meridian/signal-graph', (_req: Request, res: Response) => {
  try {
    const graph = signalGraphService.buildGraph();
    sendSuccess(res, graph);
  } catch (err) {
    logger.error({ err }, 'signal graph error');
    sendError(res, 'Failed to build signal graph');
  }
});

router.get('/meridian/signal-debt', (_req: Request, res: Response) => {
  try {
    const report = signalGraphService.computeSignalDebt();
    sendSuccess(res, report);
  } catch (err) {
    logger.error({ err }, 'signal debt error');
    sendError(res, 'Failed to compute signal debt');
  }
});

router.get('/meridian/decision-weather', (_req: Request, res: Response) => {
  try {
    const weather = generateDecisionWeather();
    sendSuccess(res, weather);
  } catch (err) {
    logger.error({ err }, 'decision weather error');
    sendError(res, 'Failed to generate decision weather');
  }
});

router.get('/meridian/counterfactual-ledger', (_req: Request, res: Response) => {
  try {
    const ledger = counterfactualLedger.getEntries();
    sendSuccess(res, ledger);
  } catch (err) {
    logger.error({ err }, 'counterfactual ledger error');
    sendError(res, 'Failed to retrieve counterfactual ledger');
  }
});

router.get('/meridian/counterfactual-ledger/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = counterfactualLedger.getEntry(id);
    if (!entry) {
      res.status(404).json({ error: `Entry '${id}' not found` });
      return;
    }
    sendSuccess(res, entry);
  } catch (err) {
    logger.error({ err }, 'counterfactual entry error');
    sendError(res, 'Failed to retrieve entry');
  }
});

router.get('/meridian/flight-recorder', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const type = req.query.type as Parameters<typeof flightRecorder.getState>[1];
    const state = flightRecorder.getState(limit, type);
    sendSuccess(res, state);
  } catch (err) {
    logger.error({ err }, 'flight recorder error');
    sendError(res, 'Failed to retrieve flight recorder');
  }
});

router.get('/meridian/mcp-registry', (_req: Request, res: Response) => {
  try {
    // Use getMcpRegistry() so status is derived from env keys at request time.
    const registry = getMcpRegistry();
    const active = registry.filter((s) => s.status === 'active').length;
    const inactive = registry.filter((s) => s.status === 'inactive').length;
    const pendingAuth = registry.filter((s) => s.status === 'pending_auth').length;
    sendSuccess(res, {
      total: registry.length,
      active,
      inactive,
      pendingAuth,
      governancePolicy: GOVERNANCE_POLICY,
      servers: registry,
      retrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'mcp registry error');
    sendError(res, 'Failed to retrieve MCP registry');
  }
});

router.post('/meridian/mcp-governance/check', (req: Request, res: Response) => {
  try {
    const { serverId, capabilityId } = req.body as { serverId?: string; capabilityId?: string };
    if (!serverId || !capabilityId) {
      res.status(400).json({ error: 'serverId and capabilityId are required' });
      return;
    }
    const result = checkGovernance(serverId, capabilityId);
    sendSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'governance check error');
    sendError(res, 'Governance check failed');
  }
});

router.get('/meridian/founder-intent', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, FOUNDER_INTENT);
  } catch (err) {
    logger.error({ err }, 'founder intent error');
    sendError(res, 'Failed to retrieve founder intent vector');
  }
});

router.post('/meridian/governance/evaluate', (req: Request, res: Response) => {
  try {
    const { action, domain } = req.body as { action?: string; domain?: string };
    if (!action) {
      res.status(400).json({ error: 'action is required' });
      return;
    }
    const result = evaluateAgainstDoctrine(action, domain ?? 'general');
    sendSuccess(res, result);
  } catch (err) {
    logger.error({ err }, 'governance evaluate error');
    sendError(res, 'Governance evaluation failed');
  }
});

/**
 * POST /meridian/governance/validate-recommendation
 *
 * Hard-validates a recommendation against the Founder Intent completeness
 * contract (evidence_over_assumption, rollback_by_default, explicit_platform_state).
 *
 * Returns { valid, violations, blockedBy }.
 * Callers must treat { valid: false } as a hard block — the recommendation
 * may not be approved or executed until all violations are resolved.
 */
router.post('/meridian/governance/validate-recommendation', (req: Request, res: Response) => {
  try {
    const { sources, confidence, owner, nextAction, rollbackPath } = req.body as {
      sources?: string[];
      confidence?: number;
      owner?: string;
      nextAction?: string;
      rollbackPath?: string;
    };

    const result = validateRecommendationCompleteness({
      sources: sources ?? [],
      confidence: confidence ?? undefined,
      owner: owner ?? '',
      nextAction: nextAction ?? '',
      rollbackPath: rollbackPath ?? '',
    });

    const statusCode = result.valid ? 200 : 422;
    res.status(statusCode).json({ data: result });
  } catch (err) {
    logger.error({ err }, 'validate recommendation error');
    sendError(res, 'Recommendation validation failed');
  }
});

export default router;
