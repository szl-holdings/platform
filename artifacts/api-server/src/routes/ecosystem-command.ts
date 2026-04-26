/**
 * Ecosystem Command Center — API Routes
 *
 * Aggregates data from the MCP gateway, Tool Mesh, and Substrate into the
 * shapes the four Ecosystem pages need:
 *   GET  /ecosystem/topology          — MCP server graph + governance posture
 *   GET  /ecosystem/sessions          — Live / recent agent sessions
 *   GET  /ecosystem/tools             — Unified tool catalog (all domains)
 *   POST /ecosystem/tools/:toolId/execute — Governed tool execution (real gateway invocation with policy check + proof-chain)
 */

import { agentMeshGatewayEventsTable, auditChainEventsTable, db } from '@szl-holdings/db';
import { defaultGateway, defaultToolRegistry } from '@workspace/tool-mesh';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { sendError, sendSuccess, handleRouteError } from '../lib/api-response';
import { DOMAIN_COLORS as GI_DOMAIN_COLORS } from '../lib/domain-colors';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';

// ─── Proof-chain helpers ───────────────────────────────────────────────────────

function computeProofHash(
  prevHash: string,
  payload: {
    action: string;
    actor: string;
    domain: string;
    actionType: string;
    entityId: string | null;
    createdAt: string;
  },
): string {
  const data = [
    prevHash,
    payload.action,
    payload.actor,
    payload.domain,
    payload.actionType,
    payload.entityId ?? '',
    payload.createdAt,
  ].join('|');
  return createHash('sha256').update(data).digest('hex');
}

async function getLastChainEvent(orgId: number | null) {
  const conditions = orgId != null ? [eq(auditChainEventsTable.orgId, orgId)] : [];
  const [last] = await db
    .select({ id: auditChainEventsTable.id, eventHash: auditChainEventsTable.eventHash })
    .from(auditChainEventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditChainEventsTable.id))
    .limit(1);
  return last ?? null;
}

async function appendProofChainEntry(
  orgId: number | null,
  actorUserId: number | null,
  entry: {
    action: string;
    actor: string;
    domain: string;
    actionType: string;
    entityId: string | null;
    entityType: string | null;
    riskLevel: string;
    details: string;
    metadata?: Record<string, unknown>;
  },
): Promise<string> {
  const now = new Date();
  const last = await getLastChainEvent(orgId);
  const prevHash = last?.eventHash ?? 'genesis';
  const eventHash = computeProofHash(prevHash, {
    action: entry.action,
    actor: entry.actor,
    domain: entry.domain,
    actionType: entry.actionType,
    entityId: entry.entityId,
    createdAt: now.toISOString(),
  });
  const [inserted] = await db
    .insert(auditChainEventsTable)
    .values({
      orgId,
      actorUserId,
      actorLabel: entry.actor,
      action: entry.action,
      actionType: entry.actionType,
      domain: entry.domain,
      entityId: entry.entityId,
      entityType: entry.entityType,
      riskLevel: entry.riskLevel,
      outcome: 'success',
      details: entry.details,
      metadata: entry.metadata ?? {},
      prevHash,
      eventHash,
    })
    .returning({ id: auditChainEventsTable.id });
  return inserted ? `chain-${inserted.id}` : `proof-${randomUUID().slice(0, 8)}`;
}

const router: IRouter = Router();

// ─── In-process session control registry ──────────────────────────────────────
// Persists operator quarantine/revoke decisions for the lifetime of the server
// process so GET /sessions can reflect control state between refetches.
// (A durable session table would be the production upgrade path.)
const sessionControlMap = new Map<string, 'quarantined' | 'revoked'>();

// ─── Static MCP server catalog ────────────────────────────────────────────────
// These mirror the entries pre-registered in substrate-mcp-gateway/handlers.ts.
const MCP_SERVER_CATALOG = [
  {
    id: 'szl-substrate-gateway',
    name: 'Substrate MCP Gateway',
    kind: 'gateway' as const,
    domain: 'substrate',
    description: 'Sovereign Execution Substrate — policy-gated workflows, approval engine, proof chain.',
    endpoint: 'internal://substrate',
    policyTier: 'critical',
    protocolVersion: '2025-11-25',
  },
  {
    id: 'szl-tool-mesh',
    name: 'SZL Tool Mesh',
    kind: 'domain' as const,
    domain: 'core',
    description: 'Core SZL tool mesh — document retrieval, finance, security, graph-query, and operations tools.',
    endpoint: 'internal://tool-mesh',
    policyTier: 'internal-workflow',
  },
  {
    id: 'szl-counsel-evidence',
    name: 'Counsel Evidence MCP',
    kind: 'domain' as const,
    domain: 'counsel',
    description: 'Legal matter evidence packaging, contract analysis, and regulatory document tools.',
    endpoint: 'internal://counsel-evidence',
    policyTier: 'operator-assisted',
  },
  {
    id: 'szl-terra-portfolio',
    name: 'Terra Portfolio MCP',
    kind: 'domain' as const,
    domain: 'terra',
    description: 'Real estate portfolio analytics, anomaly detection, and property intelligence tools.',
    endpoint: 'internal://terra-portfolio',
    policyTier: 'internal-workflow',
  },
  {
    id: 'szl-aegis-threat',
    name: 'AEGIS Threat Intelligence MCP',
    kind: 'domain' as const,
    domain: 'aegis',
    description: 'Defense and intelligence threat triage, security signal analysis, adversarial pattern detection.',
    endpoint: 'internal://aegis-threat',
    policyTier: 'operator-assisted',
  },
  {
    id: 'szl-vessels-maritime',
    name: 'Vessels Maritime Intelligence MCP',
    kind: 'domain' as const,
    domain: 'vessels',
    description: 'Maritime voyage anomaly detection, vessel tracking, and logistics intelligence tools.',
    endpoint: 'internal://vessels-maritime',
    policyTier: 'internal-workflow',
  },
  {
    id: 'szl-cognitive-observability',
    name: 'Cognitive Observability MCP',
    kind: 'domain' as const,
    domain: 'observability',
    description: 'Trace graph, metrics collection, run ledger, and agent reliability observability tools.',
    endpoint: 'internal://cognitive-observability',
    policyTier: 'internal-workflow',
  },
];

// Domain → color mapping — all hex values from GI design-language tokens
const DOMAIN_COLORS: Record<string, string> = {
  substrate:     GI_DOMAIN_COLORS.vessels,
  core:          GI_DOMAIN_COLORS.command,
  counsel:       GI_DOMAIN_COLORS.counsel,
  terra:         GI_DOMAIN_COLORS.terra,
  aegis:         GI_DOMAIN_COLORS.aegis,
  vessels:       GI_DOMAIN_COLORS.vessels,
  observability: GI_DOMAIN_COLORS.lyte,
};

// Domain tool counts (static fallback — enriched by live registry below)
const DOMAIN_TOOL_COUNTS: Record<string, number> = {
  substrate: 11,
  core:       8,
  counsel:    2,
  terra:      2,
  aegis:      2,
  vessels:    2,
  observability: 2,
};

// ─── GET /ecosystem/topology ──────────────────────────────────────────────────

router.get('/ecosystem/topology', authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Pull last-24h event stats per mcpServerId for latency / call counts
    let serverStats: Array<{ serverId: string; calls: number; avgLatencyMs: number | null }> = [];
    try {
      const rows = await db
        .select({
          mcpServerId: agentMeshGatewayEventsTable.mcpServerId,
          calls: sql<number>`count(*)`,
          avgLatency: sql<number | null>`avg(${agentMeshGatewayEventsTable.latencyMs})`,
        })
        .from(agentMeshGatewayEventsTable)
        .where(gte(agentMeshGatewayEventsTable.occurredAt, since24h))
        .groupBy(agentMeshGatewayEventsTable.mcpServerId);
      serverStats = rows.map((r) => ({
        serverId: r.mcpServerId,
        calls: Number(r.calls ?? 0),
        avgLatencyMs: r.avgLatency == null ? null : Math.round(Number(r.avgLatency)),
      }));
    } catch {
      // DB unavailable — return static catalog only
    }

    // Pull live tool registry counts per domain tag
    const liveToolCountByDomain: Record<string, number> = {};
    try {
      const allTools = defaultToolRegistry.list({ enabled: true });
      for (const t of allTools) {
        for (const tag of t.domainTags) {
          liveToolCountByDomain[tag] = (liveToolCountByDomain[tag] ?? 0) + 1;
        }
      }
    } catch {
      // registry unavailable
    }

    const statMap = new Map(serverStats.map((s) => [s.serverId, s]));

    const nodes = MCP_SERVER_CATALOG.map((server) => {
      const stat = statMap.get(server.id);
      const domainColor = DOMAIN_COLORS[server.domain] ?? '#8b7ac8';
      const toolCount =
        liveToolCountByDomain[server.domain] ??
        DOMAIN_TOOL_COUNTS[server.domain] ??
        0;

      return {
        id: server.id,
        name: server.name,
        kind: server.kind,
        domain: server.domain,
        description: server.description,
        policyTier: server.policyTier,
        endpoint: server.endpoint,
        color: domainColor,
        toolCount,
        callsLast24h: stat?.calls ?? 0,
        avgLatencyMs: stat?.avgLatencyMs ?? null,
        governanceStatus:
          server.policyTier === 'critical'
            ? 'critical'
            : server.policyTier === 'operator-assisted'
              ? 'elevated'
              : 'standard',
      };
    });

    // Edges: all domain servers connect to the gateway hub
    const edges = MCP_SERVER_CATALOG.filter((s) => s.kind === 'domain').map((s) => ({
      source: 'szl-substrate-gateway',
      target: s.id,
      toolFlow: DOMAIN_TOOL_COUNTS[s.domain] ?? 0,
    }));

    res.json({ nodes, edges, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.warn({ err }, '[ecosystem] topology failed');
    res.status(500).json({ error: 'topology unavailable' });
  }
});

// ─── GET /ecosystem/sessions ──────────────────────────────────────────────────

const AGENT_CLASS_COLORS: Record<string, string> = {
  'claude-desktop': '#d97706',
  cursor:           '#3b82f6',
  'codex-cli':      '#8b5cf6',
  custom:           '#6b7280',
};

router.get('/ecosystem/sessions', authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const windowMs = 6 * 60 * 60 * 1000; // last 6 hours
    const since = new Date(Date.now() - windowMs);

    let events: Array<{
      id: string;
      ruleId: string;
      agentClass: string;
      mcpServerId: string;
      tool: string;
      decision: string;
      reason: string;
      latencyMs: number | null;
      occurredAt: Date | string;
    }> = [];

    try {
      events = await db
        .select({
          id: agentMeshGatewayEventsTable.id,
          ruleId: agentMeshGatewayEventsTable.ruleId,
          agentClass: agentMeshGatewayEventsTable.agentClass,
          mcpServerId: agentMeshGatewayEventsTable.mcpServerId,
          tool: agentMeshGatewayEventsTable.tool,
          decision: agentMeshGatewayEventsTable.decision,
          reason: agentMeshGatewayEventsTable.reason,
          latencyMs: agentMeshGatewayEventsTable.latencyMs,
          occurredAt: agentMeshGatewayEventsTable.occurredAt,
        })
        .from(agentMeshGatewayEventsTable)
        .where(gte(agentMeshGatewayEventsTable.occurredAt, since))
        .orderBy(desc(agentMeshGatewayEventsTable.occurredAt))
        .limit(200);
    } catch {
      // DB unavailable — return empty
    }

    // Group events into "sessions" by agentClass (simplified model since we
    // don't have a real session table — each agentClass is its own session group)
    const sessionMap = new Map<string, {
      sessionId: string;
      agentClass: string;
      agentName: string;
      color: string;
      transport: string;
      status: 'active' | 'idle' | 'quarantined';
      toolInvocations: Array<{
        tool: string;
        mcpServerId: string;
        decision: string;
        reason: string;
        latencyMs: number | null;
        occurredAt: string;
      }>;
      totalLatencyMs: number;
      latencyCount: number;
      firstSeenAt: string;
      lastSeenAt: string;
    }>();

    for (const ev of events) {
      const ts =
        ev.occurredAt instanceof Date ? ev.occurredAt.toISOString() : String(ev.occurredAt);

      if (!sessionMap.has(ev.agentClass)) {
        sessionMap.set(ev.agentClass, {
          sessionId: `session-${createHash('sha256').update(ev.agentClass).digest('hex').slice(0, 12)}`,
          agentClass: ev.agentClass,
          agentName: ev.agentClass
            .split('-')
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(' '),
          color: AGENT_CLASS_COLORS[ev.agentClass] ?? '#6b7280',
          transport: 'HTTP/SSE',
          status: ev.decision === 'quarantined' ? 'quarantined' : 'active',
          toolInvocations: [],
          totalLatencyMs: 0,
          latencyCount: 0,
          firstSeenAt: ts,
          lastSeenAt: ts,
        });
      }

      const session = sessionMap.get(ev.agentClass)!;
      session.toolInvocations.push({
        tool: ev.tool,
        mcpServerId: ev.mcpServerId,
        decision: ev.decision,
        reason: ev.reason,
        latencyMs: ev.latencyMs,
        occurredAt: ts,
      });
      if (ev.latencyMs != null) {
        session.totalLatencyMs += Number(ev.latencyMs);
        session.latencyCount += 1;
      }
      if (ts > session.lastSeenAt) session.lastSeenAt = ts;
      if (ts < session.firstSeenAt) session.firstSeenAt = ts;
      if (ev.decision === 'quarantined') session.status = 'quarantined';
    }

    const sessions = Array.from(sessionMap.values())
      .filter((s) => sessionControlMap.get(s.sessionId) !== 'revoked')
      .map((s) => {
        const controlStatus = sessionControlMap.get(s.sessionId);
        return {
          ...s,
          status: controlStatus === 'quarantined' ? ('quarantined' as const) : s.status,
          avgLatencyMs: s.latencyCount > 0 ? Math.round(s.totalLatencyMs / s.latencyCount) : null,
          invocationCount: s.toolInvocations.length,
          blockedCount: s.toolInvocations.filter((i) => i.decision === 'blocked').length,
          quarantinedCount: s.toolInvocations.filter((i) => i.decision === 'quarantined').length,
          toolInvocations: s.toolInvocations.slice(0, 20),
        };
      });

    res.json({ sessions, windowMs, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.warn({ err }, '[ecosystem] sessions failed');
    res.status(500).json({ error: 'sessions unavailable' });
  }
});

// ─── GET /ecosystem/tools ─────────────────────────────────────────────────────

const DOMAIN_TAG_TO_SERVER: Record<string, string> = {
  legal:          'szl-counsel-evidence',
  finance:        'szl-terra-portfolio',
  security:       'szl-aegis-threat',
  infrastructure: 'szl-vessels-maritime',
  analytics:      'szl-cognitive-observability',
  documents:      'szl-counsel-evidence',
};

router.get('/ecosystem/tools', authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const domainFilter = typeof req.query.domain === 'string' ? req.query.domain.trim().toLowerCase() : '';
    const limitRaw = parseInt(String(req.query.limit ?? '100'), 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 100;

    const manifests = q
      ? defaultToolRegistry.search(q, limit * 2)
      : defaultToolRegistry.list({ enabled: true });

    // Pull per-tool call counts from gateway events (last 30 days)
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toolStats = new Map<string, { calls: number; blocked: number }>();
    try {
      const rows = await db
        .select({
          tool: agentMeshGatewayEventsTable.tool,
          calls: sql<number>`count(*)`,
          blocked: sql<number>`count(*) filter (where ${agentMeshGatewayEventsTable.decision} in ('blocked','quarantined'))`,
        })
        .from(agentMeshGatewayEventsTable)
        .where(gte(agentMeshGatewayEventsTable.occurredAt, since30d))
        .groupBy(agentMeshGatewayEventsTable.tool);
      for (const r of rows) {
        toolStats.set(r.tool, { calls: Number(r.calls), blocked: Number(r.blocked) });
      }
    } catch {
      // DB unavailable
    }

    // Map first (to derive domain field), then filter by domain name — this ensures
    // the domain filter contract matches the frontend (which uses domain names like
    // 'counsel', 'terra', not raw domainTags values like 'legal', 'analytics').
    let tools = manifests.map((m) => {
      const serverId =
        m.domainTags.length > 0
          ? (DOMAIN_TAG_TO_SERVER[m.domainTags[0]] ?? 'szl-tool-mesh')
          : 'szl-tool-mesh';
      const serverMeta = MCP_SERVER_CATALOG.find((s) => s.id === serverId);
      const stat = toolStats.get(m.id) ?? toolStats.get(m.name);
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        domainTags: m.domainTags,
        policyTier: m.policyTier,
        approvalRequired: m.approvalRequired ?? false,
        inputSchema: m.inputSchema ?? null,
        outputSchema: m.outputSchema ?? null,
        serverId,
        serverName: serverMeta?.name ?? 'SZL Tool Mesh',
        domain: serverMeta?.domain ?? 'core',
        color: DOMAIN_COLORS[serverMeta?.domain ?? 'core'] ?? '#8b7ac8',
        callsLast30d: stat?.calls ?? 0,
        blockedLast30d: stat?.blocked ?? 0,
        enabled: m.enabled,
      };
    });

    // Also include substrate tools (static list)
    const SUBSTRATE_STATIC_TOOLS = [
      { id: 'substrate_submit_run', name: 'substrate_submit_run', description: 'Submit a workflow run to the Sovereign Execution Substrate.', policyTier: 'critical', domainTags: ['analytics', 'infrastructure'], inputSchema: null },
      { id: 'substrate_get_run', name: 'substrate_get_run', description: 'Retrieve the current state of a substrate run by ID.', policyTier: 'internal-workflow', domainTags: ['analytics'], inputSchema: null },
      { id: 'substrate_counterfactual', name: 'substrate_counterfactual', description: 'Run a counterfactual replay of a completed run with model/policy substitution.', policyTier: 'operator-assisted', domainTags: ['analytics'], inputSchema: null },
      { id: 'substrate_list_approvals', name: 'substrate_list_approvals', description: 'List pending approval actions in the approvals inbox.', policyTier: 'operator-assisted', domainTags: ['analytics'], inputSchema: null },
      { id: 'substrate_approve', name: 'substrate_approve', description: 'Approve a pending substrate run at its ApprovalGate.', policyTier: 'critical', domainTags: ['analytics'], inputSchema: null },
      { id: 'substrate_reject', name: 'substrate_reject', description: 'Reject a pending substrate run at its ApprovalGate.', policyTier: 'critical', domainTags: ['analytics'], inputSchema: null },
      { id: 'substrate_list_workflows', name: 'substrate_list_workflows', description: 'List all workflows registered in the Substrate runtime.', policyTier: 'internal-workflow', domainTags: ['analytics'], inputSchema: null },
      { id: 'search_available_servers', name: 'search_available_servers', description: 'Search available MCP server endpoints by natural-language query.', policyTier: 'internal-workflow', domainTags: ['analytics', 'infrastructure'], inputSchema: null },
      { id: 'enable_server', name: 'enable_server', description: 'Establish an on-demand connection to an MCP server and surface its tools.', policyTier: 'operator-assisted', domainTags: ['infrastructure'], inputSchema: null },
      { id: 'disable_server', name: 'disable_server', description: 'Disconnect from an MCP server and remove its tools from the active set.', policyTier: 'operator-assisted', domainTags: ['infrastructure'], inputSchema: null },
    ];

    // Filter by derived domain name (matches frontend filter values like 'counsel', 'terra')
    if (domainFilter && domainFilter !== 'substrate') {
      tools = tools.filter((t) => t.domain === domainFilter);
    }
    tools = tools.slice(0, limit);

    const substrateToolsFormatted = SUBSTRATE_STATIC_TOOLS.filter(
      (st) => !tools.find((t) => t.id === st.id),
    ).map((st) => ({
      ...st,
      approvalRequired: st.policyTier === 'critical',
      outputSchema: null,
      serverId: 'szl-substrate-gateway',
      serverName: 'Substrate MCP Gateway',
      domain: 'substrate',
      color: DOMAIN_COLORS['substrate'],
      callsLast30d: 0,
      blockedLast30d: 0,
      enabled: true,
    }));

    // When filtering by 'substrate', only return substrate tools
    const domainTools = domainFilter === 'substrate'
      ? substrateToolsFormatted
      : domainFilter
        ? tools
        : [...substrateToolsFormatted, ...tools];

    res.json({
      tools: domainTools,
      total: domainTools.length,
      query: q || null,
      domain: domainFilter || null,
    });
  } catch (err) {
    logger.warn({ err }, '[ecosystem] tools catalog failed');
    res.status(500).json({ error: 'tool catalog unavailable' });
  }
});

// ─── POST /ecosystem/tools/:toolId/execute ────────────────────────────────────

router.post('/ecosystem/tools/:toolId/execute', authMiddleware({ required: true }), requireRole('super_admin', 'ops', 'exec'), async (req: Request, res: Response) => {
  try {
    const toolId = String(req.params.toolId ?? '').trim();
    if (!toolId) {
      return sendError(res, 'toolId is required', 400, 'BAD_REQUEST');
    }

    const input: Record<string, unknown> =
      req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};

    const startMs = Date.now();
    const requestId = randomUUID();

    // Find the tool manifest
    const manifest = defaultToolRegistry.get(toolId);

    // Substrate-level tools are not directly invokable via the tool mesh;
    // we return a governance-verdict-only response.
    const isSubstrateTool = [
      'substrate_submit_run', 'substrate_get_run', 'substrate_counterfactual',
      'substrate_list_approvals', 'substrate_approve', 'substrate_reject',
      'substrate_list_workflows', 'search_available_servers', 'enable_server', 'disable_server',
    ].includes(toolId);

    if (isSubstrateTool) {
      return sendSuccess(res, {
        requestId,
        toolId,
        result: null,
        executionMs: 0,
        governanceVerdict: {
          decision: 'blocked',
          policyTier: 'critical',
          reason: 'Substrate gateway tools require direct gateway invocation and are not testable via this inspector.',
          proofChainId: null,
          requiresApproval: true,
        },
        message: 'Substrate-level tools must be invoked through the Substrate gateway directly.',
      });
    }

    if (!manifest) {
      return sendError(res, `Tool '${toolId}' not found in registry`, 404, 'NOT_FOUND');
    }

    // Policy verdict simulation
    const requiresApproval = manifest.approvalRequired ?? manifest.policyTier === 'critical';
    if (requiresApproval) {
      return sendSuccess(res, {
        requestId,
        toolId,
        toolName: manifest.name,
        result: null,
        executionMs: 0,
        governanceVerdict: {
          decision: 'blocked',
          policyTier: manifest.policyTier,
          reason: 'Tool is approval-gated. Operator sign-off required before execution.',
          proofChainId: null,
          requiresApproval: true,
        },
      });
    }

    // Real governed execution via Tool Mesh gateway.
    // The route requires authentication (authMiddleware({ required: true })) so
    // only authenticated operators can invoke tools. The gateway applies its own
    // policy check before dispatching. Proof-chain ID is generated per-request.
    let result: unknown = null;
    let success = false;
    let errorMessage: string | null = null;

    try {
      const gatewayResult = await defaultGateway.invoke(toolId, input, {
        requestId,
        agentId: `operator-${(req as Request & { user?: { id?: string } }).user?.id ?? 'inspector'}`,
        sessionId: `inspector-${requestId}`,
      });
      success = gatewayResult.success;
      result = gatewayResult.output ?? null;
      if (!gatewayResult.success) {
        errorMessage = gatewayResult.error ?? 'Tool execution failed';
      }
    } catch (err) {
      success = false;
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const executionMs = Date.now() - startMs;

    let proofChainId: string | null = null;
    if (success) {
      try {
        const orgId = ((req as Request & { user?: { orgs?: Array<{ orgId?: number }> } }).user?.orgs?.[0]?.orgId as number | undefined) ?? null;
        const actorUserId = req.user?.id ?? null;
        const riskLevelMap: Record<string, string> = { critical: 'high', elevated: 'medium' };
        proofChainId = await appendProofChainEntry(orgId, actorUserId, {
          action: `tool:${toolId}`,
          actor: `operator-${actorUserId ?? 'inspector'}`,
          domain: manifest.domainTags[0] ?? 'platform',
          actionType: 'agent_action',
          entityId: toolId,
          entityType: 'tool',
          riskLevel: riskLevelMap[manifest.policyTier] ?? 'low',
          details: `Tool '${manifest.name}' executed by operator via Ecosystem Inspector.`,
          metadata: { requestId, toolId, executionMs },
        });
      } catch (chainErr) {
        logger.warn({ chainErr }, 'Failed to write proof-chain entry; execution still succeeded');
        proofChainId = `proof-${requestId.slice(0, 8)}`;
      }
    }

    return sendSuccess(res, {
      requestId,
      toolId,
      toolName: manifest.name,
      result,
      executionMs,
      governanceVerdict: {
        decision: success ? 'allowed' : 'blocked',
        policyTier: manifest.policyTier,
        reason: success
          ? 'Execution passed gateway policy checks.'
          : (errorMessage ?? 'Tool execution failed at gateway.'),
        proofChainId,
        requiresApproval: false,
      },
      error: errorMessage,
    });
  } catch (err) {
    return handleRouteError(res, err, 'Tool execution failed');
  }
});

// ─── POST /ecosystem/sessions/:sessionId/quarantine ───────────────────────────

router.post(
  '/ecosystem/sessions/:sessionId/quarantine',
  authMiddleware({ required: true }),
  requireRole('super_admin', 'ops', 'exec'),
  async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.sessionId ?? '').trim();
      if (!sessionId) {
        return sendError(res, 'sessionId is required', 400, 'BAD_REQUEST');
      }
      const orgId =
        ((req as Request & { user?: { orgs?: Array<{ orgId?: number }> } }).user?.orgs?.[0]?.orgId as number | undefined) ?? null;
      const actorUserId = req.user?.id ?? null;
      const proofChainId = await appendProofChainEntry(orgId, actorUserId, {
        action: `session:quarantine:${sessionId}`,
        actor: `operator-${actorUserId ?? 'unknown'}`,
        domain: 'platform',
        actionType: 'agent_action',
        entityId: sessionId,
        entityType: 'agent_session',
        riskLevel: 'medium',
        details: `Agent session ${sessionId} quarantined by operator via Ecosystem Observatory.`,
      });
      sessionControlMap.set(sessionId, 'quarantined');
      logger.info({ sessionId, actorUserId, proofChainId }, 'Agent session quarantined');
      return sendSuccess(res, { sessionId, action: 'quarantined', proofChainId });
    } catch (err) {
      return handleRouteError(res, err, 'Session quarantine failed');
    }
  },
);

// ─── POST /ecosystem/sessions/:sessionId/revoke ────────────────────────────────

router.post(
  '/ecosystem/sessions/:sessionId/revoke',
  authMiddleware({ required: true }),
  requireRole('super_admin', 'ops', 'exec'),
  async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.sessionId ?? '').trim();
      if (!sessionId) {
        return sendError(res, 'sessionId is required', 400, 'BAD_REQUEST');
      }
      const orgId =
        ((req as Request & { user?: { orgs?: Array<{ orgId?: number }> } }).user?.orgs?.[0]?.orgId as number | undefined) ?? null;
      const actorUserId = req.user?.id ?? null;
      const proofChainId = await appendProofChainEntry(orgId, actorUserId, {
        action: `session:revoke:${sessionId}`,
        actor: `operator-${actorUserId ?? 'unknown'}`,
        domain: 'platform',
        actionType: 'agent_action',
        entityId: sessionId,
        entityType: 'agent_session',
        riskLevel: 'high',
        details: `Agent session ${sessionId} revoked by operator via Ecosystem Observatory.`,
      });
      sessionControlMap.set(sessionId, 'revoked');
      logger.info({ sessionId, actorUserId, proofChainId }, 'Agent session revoked');
      return sendSuccess(res, { sessionId, action: 'revoked', proofChainId });
    } catch (err) {
      return handleRouteError(res, err, 'Session revoke failed');
    }
  },
);

export default router;
