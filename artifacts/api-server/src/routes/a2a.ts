/** A2A v0.3 — Agent Cards, Discovery, Task Delegation, and JSON-RPC interoperability routes. */

import {
  type A2AJsonRpcRequest,
  AGENT_REGISTRY,
  a2aTaskManager,
  buildAgentCard,
  buildMeshAgentIndex,
  nuroMeshOrchestrator,
} from '@szl-holdings/ai-engine';
import {
  delegateTask,
  getActiveDelegations,
  getDelegationHistory,
  getDelegationStats,
  multiDelegateAndMerge,
} from '@szl-holdings/ai-engine/a2a/agent-delegation';
import {
  discoverAgentsByCapability,
  discoverAgentsByDomain,
  getAgentCard,
  getAllAgentCards,
  rankAgentsForTask,
  recordHeartbeat,
} from '@szl-holdings/ai-engine/a2a/agent-registry';
import { bodyShape } from '@szl-holdings/contracts/common';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { sendError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';

const router = Router();

const VALID_AGENT_IDS = new Set([
  'alloy',
  'helmsman',
  'sentinel',
  'inca',
  'muse',
  'beacon',
  'zeus',
  'compass',
]);

router.get('/.well-known/agent-card.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(buildMeshAgentIndex());
});

// RFC 9116 — security.txt (VD1 closure)
// Mirrors the static file at artifacts/szl-holdings/public/.well-known/security.txt
// so external scanners that probe the API origin also receive a valid response.
//
// Mounting chain (how this route becomes reachable at GET /api/.well-known/security.txt):
//   app.ts:675        app.use('/api', router)              → main router mounted at /api
//   routes/index.ts:231  ai.register(router)               → AI group registered
//   groups/ai.ts:150  lazyMatch(['/.well-known', '/a2a']) → a2a module matched on path prefix
//   a2a.ts            router.get('/.well-known/security.txt') → this handler
//
// lazyMatch does NOT strip prefixes (see lib/lazy-router.ts) — the full path is preserved
// and matched against route patterns, which is why '/.well-known/security.txt' works.
router.get('/.well-known/security.txt', (_req: Request, res: Response) => {
  const expires = new Date('2027-04-25T00:00:00.000Z').toISOString();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(
    [
      'Contact: mailto:security@szlholdings.com',
      `Expires: ${expires}`,
      'Preferred-Languages: en',
      'Canonical: https://szlholdings.com/.well-known/security.txt',
      'Policy: https://szlholdings.com/security',
      'Acknowledgments: https://szlholdings.com/security#acknowledgements',
    ].join('\n') + '\n',
  );
});

router.get('/a2a/agents', (_req: Request, res: Response) => {
  res.json(buildMeshAgentIndex());
});

router.get('/a2a/agents/:agentId', (req: Request, res: Response) => {
  const agentId = String(req.params.agentId);
  if (!VALID_AGENT_IDS.has(agentId)) {
    res.status(404).json({ error: 'Agent not found', agentId });
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(buildAgentCard(agentId));
});

router.get('/a2a/agents/:agentId/health', (req: Request, res: Response) => {
  const agentId = String(req.params.agentId);
  if (!VALID_AGENT_IDS.has(agentId)) {
    res.status(404).json({ status: 'unknown', agentId });
    return;
  }
  res.json({
    status: 'healthy',
    agentId,
    timestamp: new Date().toISOString(),
    platform: 'Nuro Mesh',
    version: '1.0.0',
  });
});

router.get('/a2a/agents/:agentId/status', (req: Request, res: Response) => {
  try {
    const card = getAgentCard(req.params.agentId as string);
    if (!card) return sendError(res, 'Agent not found', 404);
    sendSuccess(res, {
      agentId: card.agentId,
      availability: card.availability,
      trustLevel: card.trustLevel,
      lastHeartbeat: card.metadata.lastHeartbeat,
      successRate: card.metadata.successRate,
      totalDelegations: card.metadata.totalDelegations,
    });
  } catch (_err) {
    sendError(res, 'Failed to get agent status', 500);
  }
});

router.post(
  '/a2a/agents/:agentId/heartbeat',
  validateBody(bodyShape({})),
  (req: Request, res: Response) => {
    try {
      recordHeartbeat(req.params.agentId as string);
      sendSuccess(res, { recorded: true, agentId: req.params.agentId });
    } catch (_err) {
      sendError(res, 'Failed to record heartbeat', 500);
    }
  },
);

router.post(
  '/a2a/agents/:agentId/tasks',
  validateBody(
    bodyShape({
      callerAgentId: z.unknown().optional(),
      callerPlatform: z.unknown().optional(),
      input: z.unknown().optional(),
      query: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    const agentId = String(req.params.agentId);
    if (!VALID_AGENT_IDS.has(agentId)) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    const { input, callerAgentId, callerPlatform } = req.body as {
      input?: { query?: string; context?: Record<string, unknown>; preferredOutputMode?: string };
      callerAgentId?: string;
      callerPlatform?: string;
    };

    if (!input?.query) {
      res.status(400).json({ error: 'input.query is required' });
      return;
    }

    const task = a2aTaskManager.createTask(
      agentId,
      input as Parameters<typeof a2aTaskManager.createTask>[1],
      callerAgentId,
      callerPlatform,
    );
    a2aTaskManager.updateTask(task.taskId, { status: 'running' });

    res
      .status(202)
      .json({ taskId: task.taskId, status: 'running', agentId, createdAt: task.createdAt });

    setImmediate(async () => {
      try {
        const agent = AGENT_REGISTRY.find((a) => a.id === agentId);
        let output = '';

        if (agentId === 'alloy' || !agent) {
          const result = await nuroMeshOrchestrator.orchestrate(input.query!, {
            workflowId: `a2a_${task.taskId}`,
          });
          output = result.synthesis;
        } else {
          const result = await nuroMeshOrchestrator.orchestrate(input.query!, {
            preferredAgents: [agentId],
            workflowId: `a2a_${task.taskId}`,
          });
          output = result.agentResponses[0]?.response ?? result.synthesis;
        }

        a2aTaskManager.updateTask(task.taskId, {
          status: 'completed',
          output,
          completedAt: new Date().toISOString(),
        });
      } catch (err) {
        a2aTaskManager.updateTask(task.taskId, {
          status: 'failed',
          error: String(err),
          completedAt: new Date().toISOString(),
        });
      }
    });
  },
);

router.get(
  '/a2a/agents/:agentId/tasks',
  validateQuery(listQuerySchema),
  (req: Request, res: Response) => {
    const agentId = String(req.params.agentId);
    const limit = Math.min(100, parseInt(String(req.query.limit ?? '50'), 10));
    res.json({ tasks: a2aTaskManager.listTasks(agentId, limit), agentId });
  },
);

router.get('/a2a/agents/:agentId/tasks/:taskId', (req: Request, res: Response) => {
  const taskId = String(req.params.taskId);
  const task = a2aTaskManager.getTask(taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found', taskId });
    return;
  }
  res.json(task);
});

router.get(
  '/a2a/agents/:agentId/stream',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    const agentId = String(req.params.agentId);
    const query = String(req.query.query ?? '');

    if (!VALID_AGENT_IDS.has(agentId) || !query) {
      res.status(400).json({ error: 'Invalid agentId or missing query parameter' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('start', {
      agentId,
      query: query.slice(0, 100),
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await nuroMeshOrchestrator.orchestrate(query, {
        preferredAgents: agentId !== 'alloy' ? [agentId] : undefined,
        workflowId: `a2a_stream_${Date.now()}`,
      });

      for (const agentResp of result.agentResponses) {
        sendEvent('agent_response', {
          agentId: agentResp.agentId,
          agentName: agentResp.agentName,
          confidence: agentResp.confidence,
          domain: agentResp.domain,
          response: agentResp.response.slice(0, 500),
        });
      }

      sendEvent('synthesis', {
        synthesis: result.synthesis,
        averageConfidence: result.averageConfidence,
      });
      sendEvent('complete', { status: 'completed', traceId: result.traceId });
    } catch (err) {
      sendEvent('error', { error: String(err) });
    }

    res.end();
  },
);

router.post(
  '/a2a/agents/:agentId/rpc',
  validateBody(
    bodyShape({
      jsonrpc: z.unknown().optional(),
    }),
  ),
  (req: Request, res: Response) => {
    const agentId = String(req.params.agentId);
    const request = req.body as A2AJsonRpcRequest;

    if (request.jsonrpc !== '2.0') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: 'Invalid JSON-RPC request' },
      });
      return;
    }

    const response = a2aTaskManager.handleJsonRpc(request, agentId);
    res.json(response);
  },
);

router.get('/a2a/discover', validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const { capability, domain, query } = req.query as Record<string, string>;

    let agents;
    if (query) {
      agents = rankAgentsForTask(query);
    } else if (domain) {
      agents = discoverAgentsByDomain(domain);
    } else if (capability) {
      agents = discoverAgentsByCapability(capability);
    } else {
      agents = getAllAgentCards();
    }

    sendSuccess(res, {
      agents,
      total: agents.length,
      discoveryMode: query ? 'task_rank' : domain ? 'domain' : capability ? 'capability' : 'all',
    });
  } catch (err) {
    logger.error({ err }, 'Discovery failed');
    sendError(res, 'Discovery failed', 500);
  }
});

router.post(
  '/a2a/delegate',
  validateBody(
    bodyShape({
      context: z.unknown().optional(),
      fromAgentId: z.unknown().optional(),
      orgId: z.unknown().optional(),
      priority: z.unknown().optional(),
      query: z.unknown().optional(),
      toAgentId: z.unknown().optional(),
    }),
  ),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { fromAgentId, toAgentId, query, context, priority, orgId } = req.body as {
        fromAgentId: string;
        toAgentId: string;
        query: string;
        context?: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        orgId?: number;
      };

      if (!fromAgentId || !toAgentId || !query) {
        return sendError(res, 'fromAgentId, toAgentId, and query are required', 400);
      }

      const result = await delegateTask({
        fromAgentId,
        toAgentId,
        query,
        context,
        priority,
        orgId: orgId ?? null,
      });

      sendSuccess(res, result);
    } catch (err) {
      logger.error({ err }, 'Delegation failed');
      const message = err instanceof Error ? err.message : 'Delegation failed';
      sendError(res, message, 500);
    }
  },
);

router.post(
  '/a2a/multi-delegate',
  validateBody(
    bodyShape({
      context: z.unknown().optional(),
      fromAgentId: z.unknown().optional(),
      orgId: z.unknown().optional(),
      query: z.unknown().optional(),
      toAgentIds: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { fromAgentId, toAgentIds, query, context, orgId } = req.body as {
        fromAgentId: string;
        toAgentIds: string[];
        query: string;
        context?: string;
        orgId?: number;
      };

      if (!fromAgentId || !toAgentIds?.length || !query) {
        return sendError(res, 'fromAgentId, toAgentIds, and query are required', 400);
      }

      const result = await multiDelegateAndMerge({
        fromAgentId,
        toAgentIds,
        query,
        context,
        orgId,
      });
      sendSuccess(res, result);
    } catch (err) {
      logger.error({ err }, 'Multi-delegation failed');
      sendError(res, 'Multi-delegation failed', 500);
    }
  },
);

router.get('/a2a/delegations', (_req: Request, res: Response) => {
  try {
    const active = getActiveDelegations();
    const history = getDelegationHistory(20);
    const stats = getDelegationStats();
    sendSuccess(res, { active, history, stats });
  } catch (_err) {
    sendError(res, 'Failed to get delegations', 500);
  }
});

router.get('/a2a/delegations/stats', (_req: Request, res: Response) => {
  try {
    sendSuccess(res, getDelegationStats());
  } catch {
    sendError(res, 'Failed to get delegation stats', 500);
  }
});

export default router;
