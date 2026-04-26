import { randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendCreated, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import {
  type Agent,
  agentsStore,
  enrollmentTokensStore,
  generateEnrollmentToken,
  markStaleAgents,
  startStaleAgentMonitor,
} from '../services/sentra-agents-store';

startStaleAgentMonitor();

const router: IRouter = Router();

const enrollSchema = z.object({
  tenantId: z.string().min(1).max(100).default('default'),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

const heartbeatSchema = z.object({
  token: z.string().min(8),
  hostname: z.string().min(1).max(253),
  os: z.enum(['linux', 'windows', 'macos']),
  version: z.string().min(1).max(50).default('1.0.0'),
  agentId: z.string().optional(),
});

const agentActionSchema = z.object({
  action: z.enum(['isolate', 'release', 'uninstall', 'rotate-token']),
  actor: z.string().optional().default('Operator'),
  reason: z.string().optional(),
});

// Redact sensitive token material before sending agent data to the client.
// enrollmentToken is needed only by the agent process at enroll/rotation time;
// subsequent list/read responses should not expose it.
function sanitizeAgent(agent: Agent): Omit<Agent, 'enrollmentToken'> {
  const { enrollmentToken: _drop, ...safe } = agent;
  return safe;
}

// GET /api/sentra/agents
router.get('/sentra/agents', (_req: Request, res: Response) => {
  try {
    markStaleAgents();
    const agents = Array.from(agentsStore.values())
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
      .map(sanitizeAgent);
    const hasRealAgents = agents.length > 0;
    sendSuccess(res, {
      agents,
      total: agents.length,
      source: hasRealAgents ? 'live' : 'seed',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list agents');
  }
});

// POST /api/sentra/agents/enroll  — issues an enrollment token
router.post('/sentra/agents/enroll', validateBody(enrollSchema), (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof enrollSchema>;
    const token = generateEnrollmentToken(body.tenantId, body.tags ?? []);

    const installSnippets = {
      linux: `curl -fsSL https://agent.sentra.io/install.sh | bash -s -- --token ${token.token}`,
      windows: `Invoke-Expression (Invoke-WebRequest -Uri 'https://agent.sentra.io/install.ps1').Content; Install-SentraAgent -Token ${token.token}`,
      macos: `brew install sentra-agent && sentra-agent enroll --token ${token.token}`,
    };

    logger.info({ tenantId: body.tenantId, tags: body.tags }, '[sentra] enrollment token issued');
    sendCreated(res, { token, installSnippets });
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate enrollment token');
  }
});

// POST /api/sentra/agents/heartbeat  — agent-side check-in (public, no CSRF)
router.post('/sentra/agents/heartbeat', validateBody(heartbeatSchema), (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof heartbeatSchema>;
    const enrollment = enrollmentTokensStore.get(body.token);
    if (!enrollment) {
      res.status(401).json({ error: 'Invalid or expired enrollment token' });
      return;
    }

    let agent: Agent;
    const now = new Date().toISOString();

    if (enrollment.usedByAgentId) {
      const existing = agentsStore.get(enrollment.usedByAgentId);
      if (!existing) {
        sendBadRequest(res, 'Agent not found');
        return;
      }
      existing.lastHeartbeatAt = now;
      existing.updatedAt = now;
      if (existing.status === 'stale') existing.status = 'healthy';
      agentsStore.set(existing.id, existing);
      agent = existing;
    } else {
      const agentId = body.agentId ?? randomUUID();
      agent = {
        id: agentId,
        hostname: body.hostname,
        os: body.os,
        version: body.version,
        enrollmentToken: body.token,
        tenantId: enrollment.tenantId,
        tags: enrollment.tags,
        status: 'healthy',
        lastHeartbeatAt: now,
        enrolledAt: now,
        updatedAt: now,
        auditTrail: [
          {
            id: randomUUID(),
            action: 'enrolled',
            actor: 'Agent',
            timestamp: now,
            detail: `First heartbeat from ${body.hostname}`,
          },
        ],
      };
      agentsStore.set(agentId, agent);
      enrollment.usedByAgentId = agentId;
      enrollmentTokensStore.set(body.token, enrollment);
    }

    logger.info({ agentId: agent.id, hostname: agent.hostname }, '[sentra] agent heartbeat');
    sendSuccess(res, { agentId: agent.id, status: agent.status });
  } catch (err) {
    handleRouteError(res, err, 'Failed to process heartbeat');
  }
});

// POST /api/sentra/agents/:id/action
router.post(
  '/sentra/agents/:id/action',
  validateBody(agentActionSchema),
  (req: Request, res: Response) => {
    try {
      const agent = agentsStore.get(req.params.id as string);
      if (!agent) {
        sendNotFound(res, 'Agent');
        return;
      }
      const body = req.body as z.infer<typeof agentActionSchema>;
      const now = new Date().toISOString();
      const actor = body.actor ?? 'Operator';

      let newTokenValue: string | undefined;

      switch (body.action) {
        case 'isolate':
          agent.status = 'isolated';
          break;
        case 'release':
          agent.status = 'healthy';
          break;
        case 'uninstall':
          agent.status = 'uninstalled';
          break;
        case 'rotate-token': {
          const newToken = generateEnrollmentToken(agent.tenantId, agent.tags);
          newToken.usedByAgentId = agent.id;
          agent.enrollmentToken = newToken.token;
          enrollmentTokensStore.set(newToken.token, newToken);
          newTokenValue = newToken.token;
          break;
        }
      }

      agent.updatedAt = now;
      agent.auditTrail.unshift({
        id: randomUUID(),
        action: body.action,
        actor,
        timestamp: now,
        detail: body.reason,
      });
      agentsStore.set(agent.id, agent);

      logger.info({ agentId: agent.id, action: body.action, actor }, '[sentra] agent action');
      // Return the sanitized agent; for rotate-token, surface the new token
      // separately so operators can re-provision without exposing it in all responses.
      const response = newTokenValue
        ? { ...sanitizeAgent(agent), newEnrollmentToken: newTokenValue }
        : sanitizeAgent(agent);
      sendSuccess(res, response);
    } catch (err) {
      handleRouteError(res, err, 'Failed to execute agent action');
    }
  },
);

// DELETE /api/sentra/agents/:id
router.delete('/sentra/agents/:id', (req: Request, res: Response) => {
  try {
    const exists = agentsStore.has(req.params.id as string);
    if (!exists) {
      sendNotFound(res, 'Agent');
      return;
    }
    agentsStore.delete(req.params.id as string);
    logger.info({ agentId: req.params.id }, '[sentra] agent deleted');
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete agent');
  }
});

export default router;
