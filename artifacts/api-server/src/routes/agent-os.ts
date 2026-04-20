import { bodyShape } from '@szl-holdings/contracts/common';
import { Router } from 'express';
import { z } from 'zod';
import { agentScheduler } from '../lib/agent-scheduler';
import { sendError, sendSuccess } from '../lib/api-response';
import { agentEventBus } from '../lib/event-bus';
import { type KnowledgeDomain, knowledgeStore } from '../lib/knowledge-store';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router = Router();

router.use('/agent-os', tenantScope({ required: true }));

router.get('/agent-os/status', authMiddleware(), (_req, res) => {
  const schedulerStats = agentScheduler.getStats();
  const knowledgeStats = knowledgeStore.getStats();
  const eventBusStats = agentEventBus.getStats();

  sendSuccess(res, {
    scheduler: schedulerStats,
    knowledge: knowledgeStats,
    eventBus: eventBusStats,
    timestamp: new Date().toISOString(),
  });
});

router.get('/agent-os/schedules', authMiddleware(), (_req, res) => {
  const stats = agentScheduler.getStats();
  sendSuccess(res, {
    schedules: stats.schedules,
    isRunning: stats.isRunning,
    agentCount: stats.agentCount,
  });
});

router.post(
  '/agent-os/run/:agentId',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    const agentId = Array.isArray(req.params.agentId) ? req.params.agentId[0] : req.params.agentId;
    if (!agentId) {
      sendError(res, 'agentId is required', 400);
      return;
    }
    try {
      logger.info({ agentId, triggeredBy: req.user?.id }, 'Manual agent run triggered');
      const record = await agentScheduler.runAgent(agentId);
      sendSuccess(res, { record });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      sendError(res, `Agent run failed: ${msg}`, 500);
    }
  },
);

router.get('/agent-os/runs', authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  const { agentId, domain, limit } = req.query;
  const runs = agentScheduler.getRunHistory({
    agentId: agentId as string,
    domain: domain as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
  });
  sendSuccess(res, { runs, total: runs.length });
});

router.get('/agent-os/knowledge', authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  const { domain, type, limit, since, minConfidence, tags } = req.query;

  const entries = knowledgeStore.query({
    domain: domain as KnowledgeDomain,
    type: type as unknown as undefined,
    limit: limit ? parseInt(limit as string, 10) : 50,
    since: since ? parseInt(since as string, 10) : undefined,
    minConfidence: minConfidence ? parseFloat(minConfidence as string) : undefined,
    tags: tags ? (tags as string).split(',').map((t) => t.trim()) : undefined,
  });

  sendSuccess(res, { entries, total: entries.length, stats: knowledgeStore.getStats() });
});

router.get('/agent-os/events', authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  const { type, sourceDomain, limit, since } = req.query;
  const events = agentEventBus.getHistory({
    type: type as unknown as undefined,
    sourceDomain: sourceDomain as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
    since: since ? parseInt(since as string, 10) : undefined,
  });
  sendSuccess(res, { events, stats: agentEventBus.getStats() });
});

router.get(
  '/agent-os/feed/:domain',
  authMiddleware(),
  validateQuery(listQuerySchema),
  (req, res) => {
    const { domain } = req.params;
    const { limit } = req.query;
    const maxResults = limit ? parseInt(limit as string, 10) : 20;

    const domainEntries = knowledgeStore.query({
      domain: domain as KnowledgeDomain,
      limit: 10,
      minConfidence: 0.5,
    });

    const correlations = knowledgeStore.query({
      domain: 'global',
      type: 'correlation',
      limit: 5,
      tags: [domain],
    });

    const domainEvents = agentEventBus.getHistory({
      sourceDomain: domain,
      limit: 10,
    });

    const recentRuns = agentScheduler.getRunHistory({
      domain,
      limit: 5,
    });

    const globalAlerts = knowledgeStore
      .query({
        type: 'alert',
        limit: 5,
        minConfidence: 0.8,
      })
      .filter((e) => e.domain !== domain);

    sendSuccess(res, {
      domain,
      feed: {
        domainFindings: domainEntries,
        crossDomainCorrelations: correlations,
        recentEvents: domainEvents,
        recentAgentRuns: recentRuns,
        globalAlerts,
      },
      stats: {
        findingsCount: domainEntries.length,
        correlationsCount: correlations.length,
        eventsCount: domainEvents.length,
      },
      lastUpdated: new Date().toISOString(),
    });
  },
);

router.get('/agent-os/feed', authMiddleware(), validateQuery(listQuerySchema), (req, res) => {
  const { limit } = req.query;
  const maxResults = limit ? parseInt(limit as string, 10) : 30;

  const recentFindings = knowledgeStore.query({ limit: maxResults, minConfidence: 0.6 });
  const correlations = knowledgeStore.query({ domain: 'global', type: 'correlation', limit: 10 });
  const recentEvents = agentEventBus.getHistory({ limit: 20 });
  const schedulerStats = agentScheduler.getStats();
  const knowledgeStats = knowledgeStore.getStats();
  const eventBusStats = agentEventBus.getStats();

  sendSuccess(res, {
    globalFeed: {
      recentFindings,
      correlations,
      recentEvents,
    },
    stats: {
      knowledge: knowledgeStats,
      scheduler: schedulerStats,
      eventBus: eventBusStats,
    },
    lastUpdated: new Date().toISOString(),
  });
});

router.get('/agent-os/agent-stats', authMiddleware(), (_req, res) => {
  const stats = agentScheduler.getStats();
  const knowledgeStats = knowledgeStore.getStats();
  const eventBusStats = agentEventBus.getStats();

  const agentDetails = stats.schedules.map((schedule) => {
    const agentRuns = agentScheduler.getRunHistory({ agentId: schedule.agentId, limit: 20 });
    const successRuns = agentRuns.filter((r) => r.status === 'completed').length;
    const failedRuns = agentRuns.filter((r) => r.status === 'failed').length;
    const knowledgeCount = knowledgeStore.query({ domain: schedule.domain, limit: 1000 }).length;
    const avgDuration =
      agentRuns.reduce((sum, r) => sum + (r.durationMs ?? 0), 0) / (agentRuns.length || 1);

    return {
      agentId: schedule.agentId,
      name: schedule.name,
      domain: schedule.domain,
      intervalMs: schedule.intervalMs,
      enabled: schedule.enabled,
      taskDescription: schedule.taskDescription,
      lastRunAt: schedule.lastRunAt,
      nextRunAt: schedule.nextRunAt,
      totalRuns: agentRuns.length,
      successRuns,
      failedRuns,
      successRate: agentRuns.length > 0 ? Math.round((successRuns / agentRuns.length) * 100) : null,
      avgDurationMs: Math.round(avgDuration),
      knowledgeEntriesCount: knowledgeCount,
    };
  });

  sendSuccess(res, {
    isRunning: stats.isRunning,
    totalAgents: stats.agentCount,
    totalRuns: stats.totalRuns,
    agents: agentDetails,
    knowledge: knowledgeStats,
    eventBus: eventBusStats,
  });
});

export default router;
