import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendCreated, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import {
  type Agent,
  type AgentCommand,
  agentsStore,
  enrollmentTokensStore,
  agentBearerStore,
  commandsStore,
  generateEnrollmentToken,
  issueAgentBearer,
  lookupAgentBearer,
  revokeAgentBearersByAgent,
  consumeEnrollmentToken,
  invalidateEnrollmentTokensByAgent,
  enqueueCommand,
  getCommand,
  getNextPendingCommand,
  ackCommand,
  markStaleAgents,
  startStaleAgentMonitor,
} from '../services/sentra-agents-store';

startStaleAgentMonitor();

const router: IRouter = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function agentApiBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}/api`;
  const deployDomain = process.env.REPLIT_DOMAINS?.split(',')[0]?.trim();
  if (deployDomain) return `https://${deployDomain}/api`;
  return 'http://localhost:3001/api';
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function requireAgentBearer(req: Request, res: Response): { agentId: string; token: string } | null {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing agent bearer token' });
    return null;
  }
  const record = lookupAgentBearer(token);
  if (!record) {
    res.status(401).json({ error: 'Invalid or revoked agent token' });
    return null;
  }
  return { agentId: record.agentId, token };
}

function sanitizeAgent(agent: Agent): Omit<Agent, 'enrollmentToken'> {
  const { enrollmentToken: _drop, ...safe } = agent;
  return safe;
}

// ── Zod schemas ──────────────────────────────────────────────────────────────

const enrollSchema = z.object({
  tenantId: z.string().min(1).max(100).default('default'),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

const exchangeSchema = z.object({
  enrollmentToken: z.string().min(8),
  hostname: z.string().min(1).max(253),
  os: z.enum(['linux', 'windows', 'macos']),
  version: z.string().min(1).max(50).default('1.0.0'),
});

const heartbeatSchema = z.object({
  hostname: z.string().min(1).max(253).optional(),
  os: z.enum(['linux', 'windows', 'macos']).optional(),
  version: z.string().min(1).max(50).optional(),
  isolationState: z.enum(['isolated', 'connected']).optional(),
});

const ackSchema = z.object({
  success: z.boolean(),
  output: z.string().max(2000).optional(),
});

const agentActionSchema = z.object({
  action: z.enum(['isolate', 'release', 'uninstall', 'rotate-token']),
  actor: z.string().optional().default('Operator'),
  reason: z.string().optional(),
});

// ── GET /api/sentra/agents ───────────────────────────────────────────────────
router.get('/sentra/agents', (_req: Request, res: Response) => {
  try {
    markStaleAgents();
    const agents = Array.from(agentsStore.values())
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
      .map(sanitizeAgent);
    sendSuccess(res, { agents, total: agents.length, source: agents.length > 0 ? 'live' : 'seed' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list agents');
  }
});

// ── POST /api/sentra/agents/enroll — issues enrollment token + install snippets
router.post('/sentra/agents/enroll', validateBody(enrollSchema), (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof enrollSchema>;
    const token = generateEnrollmentToken(body.tenantId, body.tags ?? []);
    const base = agentApiBaseUrl();

    const installSnippets = {
      linux: [
        `SENTRA_TOKEN="${token.token}"`,
        `SENTRA_API="${base}"`,
        `curl -fsSL "${base}/sentra/agents/stubs/install.sh" | bash -s -- --token "$SENTRA_TOKEN" --api "$SENTRA_API"`,
      ].join('\n'),
      windows: [
        `$Token = "${token.token}"`,
        `$ApiBase = "${base}"`,
        `$ScriptUrl = "$ApiBase/sentra/agents/stubs/install.ps1"`,
        `$Script = (Invoke-WebRequest -Uri $ScriptUrl -UseBasicParsing).Content`,
        `Invoke-Expression "& { $Script } -Token $Token -ApiBase $ApiBase"`,
      ].join('\n'),
      macos: [
        `SENTRA_TOKEN="${token.token}"`,
        `SENTRA_API="${base}"`,
        `curl -fsSL "${base}/sentra/agents/stubs/install-mac.sh" | bash -s -- --token "$SENTRA_TOKEN" --api "$SENTRA_API"`,
      ].join('\n'),
    };

    logger.info({ tenantId: body.tenantId, tags: body.tags }, '[sentra] enrollment token issued');
    sendCreated(res, { token, installSnippets });
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate enrollment token');
  }
});

// ── POST /api/sentra/agents/exchange — agent exchanges enrollment token for long-lived bearer
router.post('/sentra/agents/exchange', validateBody(exchangeSchema), (req: Request, res: Response) => {
  try {
    const body = req.body as z.infer<typeof exchangeSchema>;
    const enrollment = enrollmentTokensStore.get(body.enrollmentToken);
    if (!enrollment) {
      res.status(401).json({ error: 'Invalid or expired enrollment token' });
      return;
    }
    if (new Date(enrollment.expiresAt) < new Date()) {
      res.status(401).json({ error: 'Enrollment token has expired' });
      return;
    }
    // Enforce one-time-use: reject replay attempts
    if (enrollment.usedByAgentId) {
      res.status(409).json({ error: 'Enrollment token has already been used — request a new token from your operator' });
      return;
    }

    const now = new Date().toISOString();
    const agentId = randomUUID();
    const agent = {
      id: agentId,
      hostname: body.hostname,
      os: body.os,
      version: body.version,
      enrollmentToken: body.enrollmentToken,
      tenantId: enrollment.tenantId,
      tags: enrollment.tags,
      status: 'healthy' as const,
      lastHeartbeatAt: now,
      enrolledAt: now,
      updatedAt: now,
      auditTrail: [
        {
          id: randomUUID(),
          action: 'enrolled',
          actor: 'Agent',
          timestamp: now,
          detail: `Agent registered from ${body.hostname} (${body.os})`,
        },
      ],
    };
    agentsStore.set(agentId, agent);
    // Consume the token so it cannot be replayed
    consumeEnrollmentToken(body.enrollmentToken);

    // Issue a fresh bearer token for this new agent
    const bearer = issueAgentBearer(agentId);
    logger.info({ agentId, hostname: body.hostname }, '[sentra] agent token exchanged');
    sendCreated(res, { agentId, agentToken: bearer.token });
  } catch (err) {
    handleRouteError(res, err, 'Failed to exchange enrollment token');
  }
});

// ── POST /api/sentra/agents/heartbeat — agent check-in (bearer token auth, CSRF-exempt)
router.post('/sentra/agents/heartbeat', validateBody(heartbeatSchema), (req: Request, res: Response) => {
  try {
    const auth = requireAgentBearer(req, res);
    if (!auth) return;

    const agent = agentsStore.get(auth.agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found — re-enroll' });
      return;
    }

    const body = req.body as z.infer<typeof heartbeatSchema>;
    const now = new Date().toISOString();

    if (body.hostname) agent.hostname = body.hostname;
    if (body.os) agent.os = body.os;
    if (body.version) agent.version = body.version;
    agent.lastHeartbeatAt = now;
    agent.updatedAt = now;
    if (agent.status === 'stale') agent.status = 'healthy';
    agentsStore.set(agent.id, agent);

    logger.info({ agentId: agent.id, hostname: agent.hostname }, '[sentra] agent heartbeat');
    sendSuccess(res, { agentId: agent.id, status: agent.status });
  } catch (err) {
    handleRouteError(res, err, 'Failed to process heartbeat');
  }
});

// ── GET /api/sentra/agents/poll — agent polls for next pending command (bearer token auth, CSRF-exempt)
router.get('/sentra/agents/poll', (req: Request, res: Response) => {
  try {
    const auth = requireAgentBearer(req, res);
    if (!auth) return;

    const agent = agentsStore.get(auth.agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    const cmd = getNextPendingCommand(auth.agentId);
    sendSuccess(res, { command: cmd ?? null });
  } catch (err) {
    handleRouteError(res, err, 'Failed to poll for commands');
  }
});

// ── POST /api/sentra/agents/commands/:id/ack — agent acknowledges command result (bearer token auth, CSRF-exempt)
router.post('/sentra/agents/commands/:id/ack', validateBody(ackSchema), (req: Request, res: Response) => {
  try {
    const auth = requireAgentBearer(req, res);
    if (!auth) return;

    // Verify ownership BEFORE any state mutation
    const existing = getCommand(req.params.id as string);
    if (!existing) {
      sendNotFound(res, 'Command');
      return;
    }
    if (existing.agentId !== auth.agentId) {
      res.status(403).json({ error: 'Command belongs to a different agent' });
      return;
    }

    const body = req.body as z.infer<typeof ackSchema>;
    const cmd = ackCommand(existing.id, body.success, body.output);
    if (!cmd) {
      sendNotFound(res, 'Command');
      return;
    }

    logger.info({ commandId: cmd.id, agentId: cmd.agentId, success: body.success }, '[sentra] command acked');
    sendSuccess(res, { command: cmd });
  } catch (err) {
    handleRouteError(res, err, 'Failed to acknowledge command');
  }
});

// ── GET /api/sentra/agents/:id — get single agent
router.get('/sentra/agents/:id', (req: Request, res: Response) => {
  try {
    const agent = agentsStore.get(req.params.id as string);
    if (!agent) {
      sendNotFound(res, 'Agent');
      return;
    }
    sendSuccess(res, sanitizeAgent(agent));
  } catch (err) {
    handleRouteError(res, err, 'Failed to get agent');
  }
});

// ── GET /api/sentra/agents/:id/commands — list commands for an agent
router.get('/sentra/agents/:id/commands', (req: Request, res: Response) => {
  try {
    const agent = agentsStore.get(req.params.id as string);
    if (!agent) {
      sendNotFound(res, 'Agent');
      return;
    }
    const cmds = Array.from(commandsStore.values())
      .filter((c) => c.agentId === req.params.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
    sendSuccess(res, { commands: cmds });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list agent commands');
  }
});

// ── POST /api/sentra/agents/:id/action — operator action (queues commands for isolate/release)
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
      let queuedCommand: AgentCommand | undefined;

      switch (body.action) {
        case 'isolate':
        case 'release':
        case 'uninstall': {
          // Queue the command for the agent to pick up on next poll
          queuedCommand = enqueueCommand(agent.id, body.action, actor, body.reason);
          agent.updatedAt = now;
          agent.auditTrail.unshift({
            id: randomUUID(),
            action: `${body.action}-queued`,
            actor,
            timestamp: now,
            detail: body.reason ?? `Command ${body.action} queued — awaiting agent acknowledgement`,
          });
          break;
        }
        case 'rotate-token': {
          // Invalidate ALL prior enrollment tokens for this agent (including any unexchanged rotations)
          invalidateEnrollmentTokensByAgent(agent.id);
          // Generate a fresh, unconsumed token and tag it with the target agent so
          // future calls to invalidateEnrollmentTokensByAgent can find and remove it
          const newToken = generateEnrollmentToken(agent.tenantId, agent.tags);
          newToken.issuedForAgentId = agent.id;
          enrollmentTokensStore.set(newToken.token, newToken);
          agent.enrollmentToken = newToken.token;
          // Revoke bearer tokens so agent must re-exchange with the new enrollment token
          revokeAgentBearersByAgent(agent.id);
          newTokenValue = newToken.token;
          agent.updatedAt = now;
          agent.auditTrail.unshift({
            id: randomUUID(),
            action: 'rotate-token',
            actor,
            timestamp: now,
            detail: 'Enrollment token rotated; prior tokens invalidated; agent must re-exchange',
          });
          break;
        }
      }

      agentsStore.set(agent.id, agent);
      logger.info({ agentId: agent.id, action: body.action, actor }, '[sentra] agent action');

      const response: Record<string, unknown> = { ...sanitizeAgent(agent) };
      if (newTokenValue) response.newEnrollmentToken = newTokenValue;
      if (queuedCommand) response.queuedCommand = queuedCommand;
      sendSuccess(res, response);
    } catch (err) {
      handleRouteError(res, err, 'Failed to execute agent action');
    }
  },
);

// ── DELETE /api/sentra/agents/:id ───────────────────────────────────────────
router.delete('/sentra/agents/:id', (req: Request, res: Response) => {
  try {
    const exists = agentsStore.has(req.params.id as string);
    if (!exists) {
      sendNotFound(res, 'Agent');
      return;
    }
    revokeAgentBearersByAgent(req.params.id as string);
    agentsStore.delete(req.params.id as string);
    logger.info({ agentId: req.params.id }, '[sentra] agent deleted');
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete agent');
  }
});

// ── Helper: resolve a stub file path, trying bundled (dist/) and dev (src/) locations
function resolveStubPath(filename: string): string | null {
  // When bundled by esbuild into dist/server.mjs, __dirname = dist/
  // When running via tsx in dev, __dirname = src/routes/
  const candidates = [
    join(__dirname, 'agents', 'stubs', filename),         // bundled: dist/agents/stubs/
    join(__dirname, '..', 'agents', 'stubs', filename),   // dev: src/agents/stubs/
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function serveStub(filename: string, res: Response): void {
  const stubPath = resolveStubPath(filename);
  if (!stubPath) {
    res.status(404).send('# Stub not found\n');
    return;
  }
  try {
    const content = readFileSync(stubPath, 'utf8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(content);
  } catch {
    res.status(404).send('# Stub not found\n');
  }
}

// ── GET /api/sentra/agents/stubs/install.sh — Linux install stub ─────────────
router.get('/sentra/agents/stubs/install.sh', (_req: Request, res: Response) => {
  serveStub('install.sh', res);
});

// ── GET /api/sentra/agents/stubs/install-mac.sh — macOS install stub ─────────
router.get('/sentra/agents/stubs/install-mac.sh', (_req: Request, res: Response) => {
  serveStub('install-mac.sh', res);
});

// ── GET /api/sentra/agents/stubs/install.ps1 — Windows install stub ──────────
router.get('/sentra/agents/stubs/install.ps1', (_req: Request, res: Response) => {
  serveStub('install.ps1', res);
});

export default router;
