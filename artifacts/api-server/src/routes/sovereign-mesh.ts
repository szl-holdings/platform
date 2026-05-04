import { type IRouter, type Request, type Response, Router } from 'express';
import {
  FIELD_AGENTS,
  CREWS,
  AGENT_MESSAGES,
  ACTIVITY_STREAM,
  computeMeshSummary,
} from '@szl/a11oy-runtime/data';
import type {
  FieldAgent,
  FieldAgentTemplate,
  CrewComposition,
  AgentMessage,
  AgentActivityEntry,
} from '@szl/a11oy-runtime/types/sovereign-mesh';
import { TEMPLATE_DEFINITIONS, TRUST_TIER_THRESHOLDS } from '@szl/a11oy-runtime/types/sovereign-mesh';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const agents: FieldAgent[] = [...FIELD_AGENTS];
const crews: CrewComposition[] = [...CREWS];
const messages: AgentMessage[] = [...AGENT_MESSAGES];
const activity: AgentActivityEntry[] = [...ACTIVITY_STREAM];

router.get('/summary', (_req: Request, res: Response) => {
  try {
    res.json(computeMeshSummary(agents, crews));
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] summary failed');
    res.status(500).json({ error: 'summary unavailable' });
  }
});

router.get('/agents', (_req: Request, res: Response) => {
  try {
    const template = (_req.query.template as string) || undefined;
    const status = (_req.query.status as string) || undefined;
    let result = agents;
    if (template) result = result.filter(a => a.template === template);
    if (status) result = result.filter(a => a.status === status);
    res.json(result);
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] agents list failed');
    res.status(500).json({ error: 'agents unavailable' });
  }
});

router.get('/agents/:id', (req: Request, res: Response) => {
  try {
    const agent = agents.find(a => a.id === req.params.id);
    if (!agent) { res.status(404).json({ error: 'agent not found' }); return; }
    res.json(agent);
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] agent detail failed');
    res.status(500).json({ error: 'agent unavailable' });
  }
});

router.post('/agents', authMiddleware(), (req: Request, res: Response) => {
  try {
    const { name, template } = req.body as { name?: string; template?: FieldAgentTemplate };
    if (!name || !template || !TEMPLATE_DEFINITIONS[template]) {
      res.status(400).json({ error: 'name and valid template required' });
      return;
    }
    const def = TEMPLATE_DEFINITIONS[template];
    const now = new Date().toISOString();
    const agent: FieldAgent = {
      id: `fa-${template}-${Date.now().toString(36)}`,
      name,
      template,
      status: 'idle',
      config: {
        model: def.defaultModel,
        mcpServers: [...def.defaultMcpServers],
        allowedTools: [...def.defaultTools],
        blockedTools: ['data_purge'],
        covenantBindings: [...def.defaultCovenants],
        maxConcurrentCalls: 2,
        maxCostPerRunUsd: 0.50,
        requiresApprovalAbove: 'standard',
      },
      trustScore: {
        overall: 50,
        rollingAccuracy: 50,
        approvalRate: 50,
        costEfficiency: 50,
        uptimeReliability: 100,
        proofCompleteness: 50,
        tier: 'provisional',
        computedAt: now,
        historyWindow: 0,
      },
      capabilities: [...def.capabilities],
      workcellId: null,
      crewId: null,
      spawnedAt: now,
      lastActiveAt: now,
      tasksCompleted: 0,
      tasksErrored: 0,
      totalCostUsd: 0,
      proofPacketIds: [],
    };
    agents.push(agent);
    activity.unshift({
      id: `act-${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      type: 'status_change',
      detail: `Agent ${agent.name} spawned from ${template} template`,
      timestamp: now,
    });
    res.status(201).json(agent);
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] agent spawn failed');
    res.status(500).json({ error: 'spawn failed' });
  }
});

router.patch('/agents/:id/status', authMiddleware(), (req: Request, res: Response) => {
  try {
    const agent = agents.find(a => a.id === req.params.id);
    if (!agent) { res.status(404).json({ error: 'agent not found' }); return; }
    const { status } = req.body as { status?: string };
    if (!status || !['idle', 'active', 'paused', 'terminated'].includes(status)) {
      res.status(400).json({ error: 'valid status required' }); return;
    }
    agent.status = status as FieldAgent['status'];
    agent.lastActiveAt = new Date().toISOString();
    activity.unshift({
      id: `act-${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      type: 'status_change',
      detail: `Status changed to ${status}`,
      timestamp: new Date().toISOString(),
    });
    res.json(agent);
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] agent status update failed');
    res.status(500).json({ error: 'status update failed' });
  }
});

router.get('/crews', (_req: Request, res: Response) => {
  try {
    res.json(crews.map(c => ({
      ...c,
      agents: c.agentIds.map(id => agents.find(a => a.id === id)).filter(Boolean),
    })));
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] crews list failed');
    res.status(500).json({ error: 'crews unavailable' });
  }
});

router.get('/messages', (_req: Request, res: Response) => {
  try {
    const crewId = (_req.query.crewId as string) || undefined;
    const limit = Math.min(Number(_req.query.limit) || 50, 200);
    let result = messages;
    if (crewId) result = result.filter(m => m.crewId === crewId);
    res.json(result.slice(0, limit));
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] messages list failed');
    res.status(500).json({ error: 'messages unavailable' });
  }
});

router.get('/activity', (_req: Request, res: Response) => {
  try {
    const agentId = (_req.query.agentId as string) || undefined;
    const limit = Math.min(Number(_req.query.limit) || 50, 200);
    let result = activity;
    if (agentId) result = result.filter(a => a.agentId === agentId);
    res.json(result.slice(0, limit));
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] activity stream failed');
    res.status(500).json({ error: 'activity unavailable' });
  }
});

router.get('/templates', (_req: Request, res: Response) => {
  try {
    res.json(TEMPLATE_DEFINITIONS);
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] templates failed');
    res.status(500).json({ error: 'templates unavailable' });
  }
});

router.get('/trust-tiers', (_req: Request, res: Response) => {
  try {
    res.json(TRUST_TIER_THRESHOLDS);
  } catch (err) {
    logger.warn({ err }, '[sovereign-mesh] trust tiers failed');
    res.status(500).json({ error: 'trust tiers unavailable' });
  }
});

export default router;
