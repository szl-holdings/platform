import { logActivity } from '@szl-holdings/audit';
import {
  db,
  nexusMcpAnomaliesTable,
  nexusMcpExternalServersTable,
  nexusMcpSessionsTable,
  nexusMcpToolCallsTable,
  nexusGovernedWorkflowsTable,
} from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

type ServerRow = {
  authConfig?: Record<string, unknown> | null;
  [key: string]: unknown;
};

function redactServer(server: ServerRow): ServerRow {
  const { authConfig, ...rest } = server;
  const redacted: Record<string, unknown> = {};
  if (authConfig && typeof authConfig === 'object') {
    for (const key of Object.keys(authConfig)) {
      const val = (authConfig as Record<string, unknown>)[key];
      if (typeof val === 'string' && val.length > 0) {
        redacted[key] = val.slice(0, 4) + '***';
      } else {
        redacted[key] = '***';
      }
    }
  }
  return { ...rest, authConfig: Object.keys(redacted).length > 0 ? redacted : null };
}

function hashProof(data: string, prev?: string | null): string {
  const payload = `${prev ?? ''}:${data}`;
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0') + '-' + Date.now().toString(36);
}

function classifyRisk(
  toolCallCount: number,
  errorCount: number,
  policyViolations: number,
): string {
  if (policyViolations > 0 || errorCount > 5) return 'high';
  if (toolCallCount > 50 || errorCount > 2) return 'medium';
  return 'low';
}

async function detectAnomaliesForSession(sessionId: string): Promise<void> {
  try {
    const since = new Date(Date.now() - 60_000);
    const [burstResult, errorResult, totalResult] = await Promise.all([
      db
        .select({ c: count() })
        .from(nexusMcpToolCallsTable)
        .where(
          and(
            eq(nexusMcpToolCallsTable.sessionId, sessionId),
            gte(nexusMcpToolCallsTable.occurredAt, since),
          ),
        ),
      db
        .select({ c: count() })
        .from(nexusMcpToolCallsTable)
        .where(
          and(
            eq(nexusMcpToolCallsTable.sessionId, sessionId),
            eq(nexusMcpToolCallsTable.outcome, 'error'),
          ),
        ),
      db
        .select({ c: count() })
        .from(nexusMcpToolCallsTable)
        .where(eq(nexusMcpToolCallsTable.sessionId, sessionId)),
    ]);

    const callsInWindow = Number(burstResult[0]?.c ?? 0);
    const errorCount = Number(errorResult[0]?.c ?? 0);
    const total = Number(totalResult[0]?.c ?? 0);

    if (callsInWindow > 30) {
      await db
        .insert(nexusMcpAnomaliesTable)
        .values({
          id: randomUUID(),
          sessionId,
          anomalyType: 'burst_activity',
          severity: 'high',
          description: `Burst detected: ${callsInWindow} tool calls in the last 60 seconds`,
          evidence: { callsInWindow, windowSeconds: 60, threshold: 30 },
        })
        .onConflictDoNothing();
    }

    if (total > 5 && errorCount / total > 0.4) {
      await db
        .insert(nexusMcpAnomaliesTable)
        .values({
          id: randomUUID(),
          sessionId,
          anomalyType: 'elevated_error_rate',
          severity: 'medium',
          description: `Elevated error rate: ${Math.round((errorCount / total) * 100)}% of calls failing`,
          evidence: { errorCount, totalCalls: total, errorRate: errorCount / total },
        })
        .onConflictDoNothing();
    }
  } catch (err) {
    logger.warn({ err, sessionId }, '[nexus-mcp] anomaly detection failed (non-fatal)');
  }
}

async function discoverToolsFromServer(
  endpointUrl: string,
  authMethod: string,
  authConfig: Record<string, string>,
): Promise<{
  success: boolean;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (authMethod === 'api_key' && authConfig.apiKey) {
      headers['Authorization'] = `Bearer ${authConfig.apiKey}`;
    } else if (authMethod === 'header' && authConfig.headerName && authConfig.headerValue) {
      headers[authConfig.headerName] = authConfig.headerValue;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let resp: { ok: boolean; status: number; json: () => Promise<unknown> };
    try {
      resp = (await fetch(endpointUrl, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      })) as unknown as { ok: boolean; status: number; json: () => Promise<unknown> };
    } finally {
      clearTimeout(timer);
    }

    const latencyMs = Date.now() - start;
    if (!resp.ok) {
      return { success: false, tools: [], latencyMs, error: `HTTP ${resp.status}` };
    }

    const body = (await resp.json()) as {
      result?: {
        tools?: Array<{
          name: string;
          description?: string;
          inputSchema?: Record<string, unknown>;
        }>;
      };
      error?: { message: string };
    };

    if (body.error) {
      return { success: false, tools: [], latencyMs, error: body.error.message };
    }

    const rawTools = body.result?.tools ?? [];
    const tools = rawTools.map((t) => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: t.inputSchema ?? {},
      riskLevel: (
        t.name.includes('delete') ||
        t.name.includes('write') ||
        t.name.includes('exec') ||
        t.name.includes('modify')
          ? 'high'
          : 'low'
      ) as 'low' | 'medium' | 'high',
    }));

    return { success: true, tools, latencyMs };
  } catch (err) {
    return {
      success: false,
      tools: [],
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

router.use(authMiddleware);

router.get('/stats', requireRole('operator', 'admin', 'super_admin'), async (_req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [activeSessions, toolCallsHour, avgLatency, violations, pendingApprovals, anomalies, externalServers] =
      await Promise.all([
        db
          .select({ c: count() })
          .from(nexusMcpSessionsTable)
          .where(eq(nexusMcpSessionsTable.status, 'active')),
        db
          .select({ c: count() })
          .from(nexusMcpToolCallsTable)
          .where(gte(nexusMcpToolCallsTable.occurredAt, since)),
        db
          .select({ avg: sql<number>`avg(latency_ms)` })
          .from(nexusMcpToolCallsTable)
          .where(gte(nexusMcpToolCallsTable.occurredAt, since)),
        db
          .select({ c: count() })
          .from(nexusMcpSessionsTable)
          .where(
            and(
              gte(nexusMcpSessionsTable.startedAt, since),
              gte(nexusMcpSessionsTable.policyViolationCount, 1),
            ),
          ),
        db
          .select({ c: count() })
          .from(nexusMcpSessionsTable)
          .where(gte(nexusMcpSessionsTable.pendingApprovalCount, 1)),
        db
          .select({ c: count() })
          .from(nexusMcpAnomaliesTable)
          .where(eq(nexusMcpAnomaliesTable.acknowledged, false)),
        db
          .select({ c: count() })
          .from(nexusMcpExternalServersTable)
          .where(eq(nexusMcpExternalServersTable.enabled, true)),
      ]);

    const toolsPerHour = Number(toolCallsHour[0]?.c ?? 0);
    sendSuccess(res, {
      activeSessions: Number(activeSessions[0]?.c ?? 0),
      toolCallsPerMinute: Math.round(toolsPerHour / 60),
      avgLatencyMs: Math.round(Number(avgLatency[0]?.avg ?? 0)),
      pendingApprovals: Number(pendingApprovals[0]?.c ?? 0),
      policyViolationsLastHour: Number(violations[0]?.c ?? 0),
      unacknowledgedAnomalies: Number(anomalies[0]?.c ?? 0),
      activeExternalServers: Number(externalServers[0]?.c ?? 0),
    });
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] GET /stats');
  }
});

router.get('/servers', requireRole('operator', 'admin', 'super_admin'), async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(nexusMcpExternalServersTable)
      .orderBy(desc(nexusMcpExternalServersTable.createdAt));
    sendSuccess(res, rows.map(redactServer));
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] GET /servers');
  }
});

router.post(
  '/servers',
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, endpointUrl, authMethod, authConfig, allowedTenantScopes } = req.body as {
        name: string;
        endpointUrl: string;
        authMethod?: string;
        authConfig?: Record<string, string>;
        allowedTenantScopes?: string[];
      };

      if (!name || !endpointUrl) {
        return sendError(res, 'name and endpointUrl are required', 400);
      }

      const id = randomUUID();
      const discovery = await discoverToolsFromServer(
        endpointUrl,
        authMethod ?? 'none',
        authConfig ?? {},
      );

      const [row] = await db
        .insert(nexusMcpExternalServersTable)
        .values({
          id,
          name,
          endpointUrl,
          authMethod: authMethod ?? 'none',
          authConfig: authConfig ?? {},
          allowedTenantScopes: allowedTenantScopes ?? [],
          discoveredTools: discovery.tools,
          healthStatus: discovery.success ? 'healthy' : 'degraded',
          latencyMs: discovery.latencyMs,
          lastHealthCheck: new Date(),
          lastToolDiscovery: discovery.success ? new Date() : null,
          createdBy:
            (req as unknown as { user?: { username?: string } }).user?.username ?? 'system',
        })
        .returning();

      await logActivity({
        action: 'nexus_server_register',
        resource: 'nexus_mcp_server',
        resourceId: id,
        description: `Registered external MCP server: ${name}`,
        metadata: { endpointUrl, toolCount: discovery.tools.length },
      }).catch(() => {});

      sendSuccess(res, redactServer(row), 201);
    } catch (err) {
      handleRouteError(res, err, '[nexus-mcp] POST /servers');
    }
  },
);

router.get('/servers/:id', requireRole('operator', 'admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(nexusMcpExternalServersTable)
      .where(eq(nexusMcpExternalServersTable.id, req.params.id))
      .limit(1);
    if (!rows[0]) return sendError(res, 'Server not found', 404);
    sendSuccess(res, redactServer(rows[0]));
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] GET /servers/:id');
  }
});

router.put(
  '/servers/:id',
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, endpointUrl, authMethod, authConfig, allowedTenantScopes, enabled } =
        req.body as Record<string, unknown>;
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (typeof name === 'string') updates.name = name;
      if (typeof endpointUrl === 'string') updates.endpointUrl = endpointUrl;
      if (typeof authMethod === 'string') updates.authMethod = authMethod;
      if (authConfig && typeof authConfig === 'object') updates.authConfig = authConfig;
      if (Array.isArray(allowedTenantScopes)) updates.allowedTenantScopes = allowedTenantScopes;
      if (typeof enabled === 'boolean') updates.enabled = enabled;

      const rows = await db
        .update(nexusMcpExternalServersTable)
        .set(updates)
        .where(eq(nexusMcpExternalServersTable.id, req.params.id))
        .returning();
      if (!rows[0]) return sendError(res, 'Server not found', 404);
      sendSuccess(res, redactServer(rows[0]));
    } catch (err) {
      handleRouteError(res, err, '[nexus-mcp] PUT /servers/:id');
    }
  },
);

router.delete(
  '/servers/:id',
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const rows = await db
        .delete(nexusMcpExternalServersTable)
        .where(eq(nexusMcpExternalServersTable.id, req.params.id))
        .returning();
      if (!rows[0]) return sendError(res, 'Server not found', 404);
      sendSuccess(res, { deleted: true, id: req.params.id });
    } catch (err) {
      handleRouteError(res, err, '[nexus-mcp] DELETE /servers/:id');
    }
  },
);

router.post('/servers/:id/test', requireRole('operator', 'admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(nexusMcpExternalServersTable)
      .where(eq(nexusMcpExternalServersTable.id, req.params.id))
      .limit(1);
    if (!rows[0]) return sendError(res, 'Server not found', 404);
    const server = rows[0];

    const result = await discoverToolsFromServer(
      server.endpointUrl,
      server.authMethod,
      (server.authConfig ?? {}) as Record<string, string>,
    );

    await db
      .update(nexusMcpExternalServersTable)
      .set({
        healthStatus: result.success ? 'healthy' : 'degraded',
        latencyMs: result.latencyMs,
        lastHealthCheck: new Date(),
        ...(result.success
          ? { discoveredTools: result.tools, lastToolDiscovery: new Date() }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(nexusMcpExternalServersTable.id, req.params.id));

    sendSuccess(res, {
      success: result.success,
      latencyMs: result.latencyMs,
      toolCount: result.tools.length,
      tools: result.tools,
      error: result.error,
    });
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] POST /servers/:id/test');
  }
});

router.get('/sessions', requireRole('operator', 'admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const since = req.query.since
      ? new Date(String(req.query.since))
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const conditions = [gte(nexusMcpSessionsTable.startedAt, since)];
    if (status) conditions.push(eq(nexusMcpSessionsTable.status, status));

    const rows = await db
      .select()
      .from(nexusMcpSessionsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(nexusMcpSessionsTable.startedAt))
      .limit(limit);

    const [activeCount, pendingCount, violationCount] = await Promise.all([
      db
        .select({ c: count() })
        .from(nexusMcpSessionsTable)
        .where(eq(nexusMcpSessionsTable.status, 'active')),
      db
        .select({ c: count() })
        .from(nexusMcpSessionsTable)
        .where(gte(nexusMcpSessionsTable.pendingApprovalCount, 1)),
      db
        .select({ c: count() })
        .from(nexusMcpSessionsTable)
        .where(
          and(
            gte(nexusMcpSessionsTable.startedAt, since),
            gte(nexusMcpSessionsTable.policyViolationCount, 1),
          ),
        ),
    ]);

    sendSuccess(res, {
      sessions: rows,
      kpis: {
        activeSessions: Number(activeCount[0]?.c ?? 0),
        pendingApprovals: Number(pendingCount[0]?.c ?? 0),
        policyViolationsLastHour: Number(violationCount[0]?.c ?? 0),
        totalSessions: rows.length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] GET /sessions');
  }
});

router.get('/sessions/:id', requireRole('operator', 'admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(nexusMcpSessionsTable)
      .where(eq(nexusMcpSessionsTable.id, req.params.id))
      .limit(1);
    if (!rows[0]) return sendError(res, 'Session not found', 404);

    const toolCalls = await db
      .select()
      .from(nexusMcpToolCallsTable)
      .where(eq(nexusMcpToolCallsTable.sessionId, req.params.id))
      .orderBy(nexusMcpToolCallsTable.sequenceIndex);

    sendSuccess(res, { session: rows[0], toolCalls });
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] GET /sessions/:id');
  }
});

router.post('/sessions', requireRole('operator', 'admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const { clientIdentity, clientType, serverIdentity, serverType, externalServerId, tenantId } =
      req.body as {
        clientIdentity: string;
        clientType?: string;
        serverIdentity: string;
        serverType?: string;
        externalServerId?: string;
        tenantId?: string;
      };

    if (!clientIdentity || !serverIdentity) {
      return sendError(res, 'clientIdentity and serverIdentity are required', 400);
    }

    const id = randomUUID();
    const proofHash = hashProof(`session:${id}:${clientIdentity}:${serverIdentity}`);

    const [row] = await db
      .insert(nexusMcpSessionsTable)
      .values({
        id,
        clientIdentity,
        clientType: clientType ?? 'internal',
        serverIdentity,
        serverType: serverType ?? 'internal',
        externalServerId: externalServerId ?? null,
        tenantId: tenantId ?? null,
        proofHash,
      })
      .returning();

    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] POST /sessions');
  }
});

router.post('/sessions/:id/tool-calls', requireRole('operator', 'admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const sessionRows = await db
      .select()
      .from(nexusMcpSessionsTable)
      .where(eq(nexusMcpSessionsTable.id, req.params.id))
      .limit(1);
    if (!sessionRows[0]) return sendError(res, 'Session not found', 404);
    const session = sessionRows[0];

    const {
      toolName,
      toolSource,
      externalServerId,
      inputParams,
      outputSummary,
      outputRaw,
      latencyMs,
      outcome,
      policyResult,
      policyReason,
      approvalStatus,
      approvalId,
      errorMessage,
    } = req.body as Record<string, unknown>;

    if (!toolName) return sendError(res, 'toolName is required', 400);

    const seqRows = await db
      .select({ c: count() })
      .from(nexusMcpToolCallsTable)
      .where(eq(nexusMcpToolCallsTable.sessionId, req.params.id));
    const sequenceIndex = Number(seqRows[0]?.c ?? 0);

    const callId = randomUUID();
    const [callRow] = await db
      .insert(nexusMcpToolCallsTable)
      .values({
        id: callId,
        sessionId: req.params.id,
        toolName: String(toolName),
        toolSource: String(toolSource ?? 'internal'),
        externalServerId: typeof externalServerId === 'string' ? externalServerId : null,
        inputParams: (inputParams ?? {}) as Record<string, unknown>,
        outputSummary: typeof outputSummary === 'string' ? outputSummary : null,
        outputRaw: outputRaw ?? null,
        latencyMs: typeof latencyMs === 'number' ? latencyMs : null,
        outcome: String(outcome ?? 'success'),
        policyResult: String(policyResult ?? 'pass'),
        policyReason: typeof policyReason === 'string' ? policyReason : null,
        approvalStatus: String(approvalStatus ?? 'not_required'),
        approvalId: typeof approvalId === 'string' ? approvalId : null,
        errorMessage: typeof errorMessage === 'string' ? errorMessage : null,
        sequenceIndex,
      })
      .returning();

    const isError = String(outcome ?? 'success') === 'error';
    const isViolation = String(policyResult ?? 'pass') === 'block';
    const isPending = String(approvalStatus ?? 'not_required') === 'pending';
    const newProofHash = hashProof(`call:${callId}:${String(toolName)}`, session.proofHash);

    await db
      .update(nexusMcpSessionsTable)
      .set({
        toolCallCount: session.toolCallCount + 1,
        errorCount: session.errorCount + (isError ? 1 : 0),
        policyViolationCount: session.policyViolationCount + (isViolation ? 1 : 0),
        pendingApprovalCount: session.pendingApprovalCount + (isPending ? 1 : 0),
        riskLevel: classifyRisk(
          session.toolCallCount + 1,
          session.errorCount + (isError ? 1 : 0),
          session.policyViolationCount + (isViolation ? 1 : 0),
        ),
        previousProofHash: session.proofHash,
        proofHash: newProofHash,
        updatedAt: new Date(),
      })
      .where(eq(nexusMcpSessionsTable.id, req.params.id));

    detectAnomaliesForSession(req.params.id).catch(() => {});

    sendSuccess(res, callRow, 201);
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] POST /sessions/:id/tool-calls');
  }
});

router.patch('/sessions/:id/end', requireRole('operator', 'admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const rows = await db
      .update(nexusMcpSessionsTable)
      .set({ status: 'completed', endedAt: new Date(), updatedAt: new Date() })
      .where(eq(nexusMcpSessionsTable.id, req.params.id))
      .returning();
    if (!rows[0]) return sendError(res, 'Session not found', 404);
    sendSuccess(res, rows[0]);
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] PATCH /sessions/:id/end');
  }
});

router.get('/anomalies', requireRole('operator', 'admin', 'super_admin'), async (req: Request, res: Response) => {
  try {
    const acknowledged =
      req.query.acknowledged === 'true'
        ? true
        : req.query.acknowledged === 'false'
          ? false
          : undefined;
    const conditions =
      acknowledged !== undefined ? [eq(nexusMcpAnomaliesTable.acknowledged, acknowledged)] : [];
    const rows = await db
      .select()
      .from(nexusMcpAnomaliesTable)
      .where(
        conditions.length > 0
          ? conditions.length === 1
            ? conditions[0]
            : and(...conditions)
          : undefined,
      )
      .orderBy(desc(nexusMcpAnomaliesTable.detectedAt))
      .limit(100);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] GET /anomalies');
  }
});

router.patch(
  '/anomalies/:id/acknowledge',
  requireRole('admin', 'super_admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const user = (req as unknown as { user?: { username?: string } }).user;
      const rows = await db
        .update(nexusMcpAnomaliesTable)
        .set({
          acknowledged: true,
          acknowledgedBy: user?.username ?? 'unknown',
          acknowledgedAt: new Date(),
        })
        .where(eq(nexusMcpAnomaliesTable.id, req.params.id))
        .returning();
      if (!rows[0]) return sendError(res, 'Anomaly not found', 404);
      sendSuccess(res, rows[0]);
    } catch (err) {
      handleRouteError(res, err, '[nexus-mcp] PATCH /anomalies/:id/acknowledge');
    }
  },
);

router.get('/workflows', requireRole('operator', 'admin', 'super_admin'), async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(nexusGovernedWorkflowsTable)
      .orderBy(desc(nexusGovernedWorkflowsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, '[nexus-mcp] GET /workflows');
  }
});

router.post(
  '/workflows',
  requireRole('admin', 'super_admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const { name, description, triggerType, triggerConfig, steps, tenantId } =
        req.body as Record<string, unknown>;
      if (!name) return sendError(res, 'name is required', 400);

      const user = (req as unknown as { user?: { username?: string } }).user;
      const [row] = await db
        .insert(nexusGovernedWorkflowsTable)
        .values({
          name: String(name),
          description: String(description ?? ''),
          triggerType: String(triggerType ?? 'manual'),
          triggerConfig: (triggerConfig ?? {}) as Record<string, unknown>,
          steps: (steps ?? []) as never,
          createdBy: user?.username ?? 'system',
          tenantId: typeof tenantId === 'string' ? tenantId : null,
        })
        .returning();

      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, '[nexus-mcp] POST /workflows');
    }
  },
);

router.put(
  '/workflows/:id',
  requireRole('admin', 'super_admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const { name, description, triggerType, triggerConfig, steps, status } =
        req.body as Record<string, unknown>;
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (typeof name === 'string') updates.name = name;
      if (typeof description === 'string') updates.description = description;
      if (typeof triggerType === 'string') updates.triggerType = triggerType;
      if (triggerConfig) updates.triggerConfig = triggerConfig;
      if (Array.isArray(steps)) updates.steps = steps;
      if (typeof status === 'string') updates.status = status;

      const rows = await db
        .update(nexusGovernedWorkflowsTable)
        .set(updates)
        .where(sql`id = ${Number(req.params.id)}`)
        .returning();
      if (!rows[0]) return sendError(res, 'Workflow not found', 404);
      sendSuccess(res, rows[0]);
    } catch (err) {
      handleRouteError(res, err, '[nexus-mcp] PUT /workflows/:id');
    }
  },
);

router.delete(
  '/workflows/:id',
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const rows = await db
        .delete(nexusGovernedWorkflowsTable)
        .where(sql`id = ${Number(req.params.id)}`)
        .returning();
      if (!rows[0]) return sendError(res, 'Workflow not found', 404);
      sendSuccess(res, { deleted: true, id: req.params.id });
    } catch (err) {
      handleRouteError(res, err, '[nexus-mcp] DELETE /workflows/:id');
    }
  },
);

export default router;
