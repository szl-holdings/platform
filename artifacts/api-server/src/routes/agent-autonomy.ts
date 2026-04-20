import {
  getDelegationHistory,
  getDelegationStats,
} from '@szl-holdings/ai-engine/a2a/agent-delegation';
import { getAllAgentCards } from '@szl-holdings/ai-engine/a2a/agent-registry';
import { connectorRegistry } from '@szl-holdings/ai-engine/connectors';
import {
  getAgentSelfReflectionHistory,
  getAllAgentPerformanceSnapshots,
  runSelfReflection,
} from '@szl-holdings/ai-engine/learning/self-improvement';
import { AGENT_REGISTRY } from '@szl-holdings/ai-engine/nuro-mesh';
import {
  autoIngestFromDecisionStore,
  getKnowledgeStoreStats,
} from '@szl-holdings/ai-engine/rag/knowledge-store';
import { getSkillUsageStats } from '@szl-holdings/ai-engine/skills/skill-manager';
import { getAllSkills } from '@szl-holdings/ai-engine/skills/skill-registry';
import { bodyShape } from '@szl-holdings/contracts/common';
import { Router } from 'express';
import { z } from 'zod';
import { sendError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware());

router.get('/agent-autonomy/overview', async (_req, res) => {
  try {
    const [delegationStats, agentCards, skillStats, connectorSummary, perfSnapshots, ragStats] =
      await Promise.all([
        Promise.resolve(getDelegationStats()),
        Promise.resolve(getAllAgentCards()),
        Promise.resolve(getSkillUsageStats()),
        Promise.resolve(connectorRegistry.getSummary()),
        getAllAgentPerformanceSnapshots(),
        getKnowledgeStoreStats(),
      ]);

    const activeAgents = agentCards.filter((c) => c.availability === 'online').length;
    const degradedAgents = agentCards.filter((c) => c.availability === 'degraded').length;
    const flaggedAgents = perfSnapshots.filter((s) => s.flaggedForReview).length;

    sendSuccess(res, {
      systemHealth: {
        totalAgents: agentCards.length,
        activeAgents,
        degradedAgents,
        offlineAgents: agentCards.length - activeAgents - degradedAgents,
        flaggedForReview: flaggedAgents,
      },
      delegationStats,
      skillStats: {
        totalSkills: getAllSkills().length,
        totalInvocations: skillStats.totalInvocations,
        topSkills: Object.entries(skillStats.bySkill)
          .sort((a, b) => b[1].invocations - a[1].invocations)
          .slice(0, 5)
          .map(([skillId, data]) => ({ skillId, ...data })),
      },
      connectorStats: {
        totalConnectors: connectorSummary.length,
        configuredConnectors: connectorSummary.filter((c) => c.configured).length,
        connectors: connectorSummary,
      },
      ragStats,
      performanceSummary: {
        avgAccuracy: perfSnapshots.length
          ? Math.round(
              (perfSnapshots.reduce((s, p) => s + p.accuracyScore, 0) / perfSnapshots.length) * 100,
            )
          : null,
        snapshotCount: perfSnapshots.length,
        flaggedCount: flaggedAgents,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Agent autonomy overview failed');
    sendError(res, 'Failed to load autonomy overview', 500);
  }
});

router.get('/agent-autonomy/agents', async (_req, res) => {
  try {
    const [cards, snapshots] = await Promise.all([
      Promise.resolve(getAllAgentCards()),
      getAllAgentPerformanceSnapshots(),
    ]);

    const snapshotMap = new Map(snapshots.map((s) => [s.agentId, s]));
    const skillStats = getSkillUsageStats();

    const agents = cards.map((card) => {
      const snapshot = snapshotMap.get(card.agentId);
      const agentSkillStats = skillStats.byAgent[card.agentId];
      return {
        ...card,
        performance: snapshot ?? null,
        skillUsage: agentSkillStats ?? { invocations: 0, skills: [] },
      };
    });

    sendSuccess(res, { agents, total: agents.length });
  } catch (err) {
    logger.error({ err }, 'Failed to get agent list');
    sendError(res, 'Failed to get agents', 500);
  }
});

router.get('/agent-autonomy/agents/:agentId/reflection', async (req, res) => {
  try {
    const agentId = req.params.agentId!;
    const known = AGENT_REGISTRY.find((a) => a.id === agentId);
    if (!known) return sendError(res, 'Agent not found', 404);

    const [reflection, history] = await Promise.all([
      runSelfReflection(agentId),
      getAgentSelfReflectionHistory(agentId, 5),
    ]);

    sendSuccess(res, { current: reflection, history });
  } catch (err) {
    logger.error({ err }, 'Self-reflection failed');
    sendError(res, 'Failed to run self-reflection', 500);
  }
});

router.get('/agent-autonomy/delegations', (_req, res) => {
  try {
    const history = getDelegationHistory(50);
    const stats = getDelegationStats();
    sendSuccess(res, { history, stats });
  } catch (err) {
    sendError(res, 'Failed to get delegation data', 500);
  }
});

router.get('/agent-autonomy/skills', (_req, res) => {
  try {
    const skills = getAllSkills();
    const usage = getSkillUsageStats();
    sendSuccess(res, { skills, usage });
  } catch (err) {
    sendError(res, 'Failed to get skill data', 500);
  }
});

router.get('/agent-autonomy/connectors', async (_req, res) => {
  try {
    const summary = connectorRegistry.getSummary();
    sendSuccess(res, {
      connectors: summary,
      total: summary.length,
      configured: summary.filter((c) => c.configured).length,
    });
  } catch (err) {
    sendError(res, 'Failed to get connector data', 500);
  }
});

router.post(
  '/agent-autonomy/connectors/:connectorId/health',
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const health = await connectorRegistry.checkHealth(req.params.connectorId!);
      sendSuccess(res, health);
    } catch (err) {
      sendError(res, 'Health check failed', 500);
    }
  },
);

router.get('/agent-autonomy/rag', async (_req, res) => {
  try {
    const stats = await getKnowledgeStoreStats();
    sendSuccess(res, stats);
  } catch (err) {
    sendError(res, 'Failed to get RAG stats', 500);
  }
});

router.post('/agent-autonomy/rag/ingest', validateBody(bodyShape({})), async (_req, res) => {
  try {
    const count = await autoIngestFromDecisionStore();
    sendSuccess(res, {
      ingested: count,
      message: `Ingested ${count} decisions into the knowledge store`,
    });
  } catch (err) {
    logger.error({ err }, 'RAG auto-ingest failed');
    sendError(res, 'Ingest failed', 500);
  }
});

router.get('/agent-autonomy/performance', async (_req, res) => {
  try {
    const snapshots = await getAllAgentPerformanceSnapshots();
    sendSuccess(res, { snapshots, total: snapshots.length });
  } catch (err) {
    sendError(res, 'Failed to get performance data', 500);
  }
});

export default router;
