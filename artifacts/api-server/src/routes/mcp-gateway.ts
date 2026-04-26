/**
 * ALPHA — MCP Governance & Agent Gateway
 *
 * Status: Alpha — access controls under development.
 *
 * MCP gateway governance routes are currently accessible to any authenticated
 * user without an operator-level role check. Multi-tenant production exposure
 * requires resolving AF-022 (operator-only RBAC on governance routes) and
 * AF-026 (anonymous telemetry/discovery surface) in `threat_model.md`.
 *
 * Do NOT expose MCP governance routes to external tenants without resolving AF-022.
 */
import {
  agentMeshContainmentRulesTable,
  agentMeshExposuresTable,
  agentMeshGatewayEventsTable,
  approvalRequestsTable,
  db,
} from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { and, avg, count, desc, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { gatewayEventBus } from '../lib/gateway-event-bus';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

type EnforcementMode = 'log-only' | 'block' | 'quarantine';
type Tier = 'critical' | 'elevated' | 'standard';
type Decision = 'allowed' | 'logged' | 'blocked' | 'quarantined';

interface PendingModeChange {
  requestedMode: EnforcementMode;
  requestedBy: string;
  requestedAt: string;
  guardianApprovalId: string;
}

interface GatewayRule {
  id: string;
  name: string;
  agentClass: string;
  tier: Tier;
  enforcementMode: EnforcementMode;
  allowedMcpServers: string[];
  allowedTools: string[];
  allowedEgressDomains: string[];
  pendingModeChange?: PendingModeChange;
}

const GATEWAY_ENDPOINT =
  process.env.MCP_GATEWAY_ENDPOINT ?? 'https://mcp-gateway.sentra.szl.local/v1/proxy';
// Only attempt a real upstream round-trip when the operator has explicitly
// configured an endpoint. Otherwise the placeholder hostname above would
// cause every allowed/logged call to wait for a DNS/connect timeout in dev,
// which would poison the recorded latency_ms average.
const GATEWAY_ENDPOINT_CONFIGURED = process.env.MCP_GATEWAY_ENDPOINT !== undefined;
function parseUpstreamTimeoutMs(raw: string | undefined): number {
  if (raw === undefined) return 5000;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 5000;
  // Clamp to a sane operator-facing range (50ms .. 60s).
  return Math.min(60_000, Math.max(50, Math.floor(n)));
}
const UPSTREAM_TIMEOUT_MS = parseUpstreamTimeoutMs(process.env.MCP_GATEWAY_UPSTREAM_TIMEOUT_MS);

const startedAt = Date.now();

// Default gateway-managed rules. These are seeded into the database on
// first access so the rules survive restarts. The id is the stable key
// used for upserts.
const DEFAULT_RULES: Array<{
  id: string;
  name: string;
  agentClass: string;
  tier: Tier;
  enforcementMode: EnforcementMode;
  allowedMcpServers: string[];
  allowedTools: string[];
  allowedEgressDomains: string[];
}> = [
  {
    id: 'rule-claude-standard',
    name: 'Claude Standard Policy',
    agentClass: 'claude-desktop',
    tier: 'standard',
    enforcementMode: 'log-only',
    allowedMcpServers: ['mcp-github', 'mcp-filesystem', 'mcp-sequential-thinking', 'mcp-huggingface'],
    allowedTools: ['read_file', 'list_directory', 'brave_web_search', 'sequentialthinking', 'hf_search_models', 'hf_search_datasets', 'hf_search_papers', 'hf_search_spaces', 'hf_get_model_info', 'hf_get_dataset_info'],
    allowedEgressDomains: ['api.github.com', 'api.search.brave.com', 'huggingface.co'],
  },
  {
    id: 'rule-cursor-elevated',
    name: 'Cursor Elevated Policy',
    agentClass: 'cursor',
    tier: 'elevated',
    enforcementMode: 'block',
    allowedMcpServers: ['mcp-github', 'mcp-filesystem', 'mcp-sequential-thinking', 'mcp-huggingface'],
    allowedTools: [
      'read_file',
      'write_file',
      'list_directory',
      'create_pull_request',
      'sequentialthinking',
      'hf_search_models',
      'hf_search_datasets',
      'hf_search_papers',
      'hf_search_spaces',
      'hf_get_model_info',
      'hf_get_dataset_info',
    ],
    allowedEgressDomains: ['api.github.com', 'huggingface.co'],
  },
  {
    id: 'rule-codex-restricted',
    name: 'Codex CLI Restricted Policy',
    agentClass: 'codex-cli',
    tier: 'critical',
    enforcementMode: 'quarantine',
    allowedMcpServers: ['mcp-filesystem'],
    allowedTools: ['read_file', 'write_file'],
    allowedEgressDomains: [],
  },
];

let seedPromise: Promise<void> | null = null;
async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      for (const r of DEFAULT_RULES) {
        await db
          .insert(agentMeshContainmentRulesTable)
          .values({
            id: r.id,
            orgId: null,
            name: r.name,
            agentClass: r.agentClass,
            allowedMcpServers: r.allowedMcpServers,
            allowedTools: r.allowedTools,
            allowedReadPaths: [],
            allowedEgressDomains: r.allowedEgressDomains,
            tier: r.tier,
            enforcementMode: r.enforcementMode,
            violationCount: 0,
            lastEvaluatedAt: new Date(),
          })
          .onConflictDoNothing({ target: agentMeshContainmentRulesTable.id });
      }
    } catch (err) {
      logger.warn({ err }, '[mcp-gateway] failed to seed default containment rules');
      // Allow retry on next call.
      seedPromise = null;
      throw err;
    }
  })();
  return seedPromise;
}

function rowToRule(row: typeof agentMeshContainmentRulesTable.$inferSelect): GatewayRule {
  return {
    id: row.id,
    name: row.name,
    agentClass: row.agentClass,
    tier: (row.tier as Tier) ?? 'standard',
    enforcementMode: (row.enforcementMode as EnforcementMode) ?? 'log-only',
    allowedMcpServers: row.allowedMcpServers ?? [],
    allowedTools: row.allowedTools ?? [],
    allowedEgressDomains: row.allowedEgressDomains ?? [],
    pendingModeChange: (row.pendingModeChange ?? undefined) as PendingModeChange | undefined,
  };
}

async function loadRules(): Promise<GatewayRule[]> {
  const rows = await db
    .select()
    .from(agentMeshContainmentRulesTable)
    .where(isNull(agentMeshContainmentRulesTable.orgId));
  return rows.map(rowToRule);
}

async function findRuleForAgentClass(agentClass: string): Promise<GatewayRule | undefined> {
  const rows = await db
    .select()
    .from(agentMeshContainmentRulesTable)
    .where(
      and(
        isNull(agentMeshContainmentRulesTable.orgId),
        eq(agentMeshContainmentRulesTable.agentClass, agentClass),
      ),
    )
    .limit(1);
  const row = rows[0];
  return row ? rowToRule(row) : undefined;
}

async function findRuleById(ruleId: string): Promise<GatewayRule | undefined> {
  const rows = await db
    .select()
    .from(agentMeshContainmentRulesTable)
    .where(eq(agentMeshContainmentRulesTable.id, ruleId))
    .limit(1);
  const row = rows[0];
  return row ? rowToRule(row) : undefined;
}

function evaluateRule(
  rule: GatewayRule,
  params: {
    mcpServerId: string;
    tool: string;
    egressDomain?: string;
  },
): { violation: boolean; reason: string } {
  if (!rule.allowedMcpServers.includes(params.mcpServerId)) {
    return { violation: true, reason: `MCP server ${params.mcpServerId} not in allowlist` };
  }
  if (!rule.allowedTools.includes(params.tool)) {
    return { violation: true, reason: `Tool '${params.tool}' not permitted by rule` };
  }
  if (
    params.egressDomain &&
    rule.allowedEgressDomains.length > 0 &&
    !rule.allowedEgressDomains.includes(params.egressDomain)
  ) {
    return { violation: true, reason: `Egress domain ${params.egressDomain} not in allowlist` };
  }
  if (params.egressDomain && rule.allowedEgressDomains.length === 0) {
    return { violation: true, reason: `Egress blocked for tier '${rule.tier}'` };
  }
  return { violation: false, reason: 'matches policy' };
}

async function loadStats(sinceDate?: Date): Promise<{
  calls: number;
  blocked: number;
  quarantined: number;
  logged: number;
  allowed: number;
}> {
  const baseQuery = db
    .select({
      decision: agentMeshGatewayEventsTable.decision,
      c: count(),
    })
    .from(agentMeshGatewayEventsTable);
  const rows = sinceDate
    ? await baseQuery
        .where(gte(agentMeshGatewayEventsTable.occurredAt, sinceDate))
        .groupBy(agentMeshGatewayEventsTable.decision)
    : await baseQuery.groupBy(agentMeshGatewayEventsTable.decision);
  const stats = { calls: 0, blocked: 0, quarantined: 0, logged: 0, allowed: 0 };
  for (const r of rows) {
    const c = Number(r.c ?? 0);
    stats.calls += c;
    if (r.decision === 'blocked') stats.blocked += c;
    else if (r.decision === 'quarantined') stats.quarantined += c;
    else if (r.decision === 'logged') stats.logged += c;
    else if (r.decision === 'allowed') stats.allowed += c;
  }
  return stats;
}

export interface GatewayLiveSummaryFilters {
  decision?: Decision;
  agentClass?: string;
  ruleId?: string;
}

export interface GatewayLiveSummary {
  endpoint: string;
  status: 'online';
  protocolVersion: string;
  uptimeSeconds: number;
  callsLast24h: number;
  blockedLast24h: number;
  quarantinedLast24h: number;
  loggedLast24h: number;
  allowedLast24h: number;
  averageLatencyMs: number | null;
  filters: GatewayLiveSummaryFilters;
  filteredEventCount: number;
  events: Array<{
    id: string;
    ruleId: string;
    agentClass: string;
    mcpServerId: string;
    tool: string;
    egressDomain?: string;
    decision: Decision;
    reason: string;
    enforcementMode: EnforcementMode;
    linkedExposureId?: string;
    occurredAt: string;
  }>;
}

export async function getGatewayLiveSummary(
  eventLimit = 50,
  filters: GatewayLiveSummaryFilters = {},
): Promise<GatewayLiveSummary> {
  await ensureSeeded();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const filterConditions = [
    filters.decision ? eq(agentMeshGatewayEventsTable.decision, filters.decision) : undefined,
    filters.agentClass ? eq(agentMeshGatewayEventsTable.agentClass, filters.agentClass) : undefined,
    filters.ruleId ? eq(agentMeshGatewayEventsTable.ruleId, filters.ruleId) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);
  const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;
  const eventQuery = db
    .select()
    .from(agentMeshGatewayEventsTable)
    .orderBy(desc(agentMeshGatewayEventsTable.occurredAt))
    .limit(eventLimit);
  const countQuery = db.select({ c: count() }).from(agentMeshGatewayEventsTable);
  const [stats, eventRows, filteredCountRows, latencyRows] = await Promise.all([
    loadStats(since),
    whereClause ? eventQuery.where(whereClause) : eventQuery,
    whereClause ? countQuery.where(whereClause) : countQuery,
    db
      .select({ avg: avg(agentMeshGatewayEventsTable.latencyMs) })
      .from(agentMeshGatewayEventsTable)
      .where(
        and(
          gte(agentMeshGatewayEventsTable.occurredAt, since),
          isNotNull(agentMeshGatewayEventsTable.latencyMs),
        ),
      ),
  ]);
  const filteredEventCount = Number(filteredCountRows[0]?.c ?? 0);
  const avgRaw = latencyRows[0]?.avg;
  const averageLatencyMs = avgRaw == null ? null : Math.round(Number(avgRaw));
  const events = eventRows.map((r) => ({
    id: r.id,
    ruleId: r.ruleId,
    agentClass: r.agentClass,
    mcpServerId: r.mcpServerId,
    tool: r.tool,
    egressDomain: r.egressDomain ?? undefined,
    decision: r.decision as Decision,
    reason: r.reason,
    enforcementMode: r.enforcementMode as EnforcementMode,
    linkedExposureId: r.linkedExposureId ?? undefined,
    occurredAt: r.occurredAt instanceof Date ? r.occurredAt.toISOString() : String(r.occurredAt),
  }));
  return {
    endpoint: GATEWAY_ENDPOINT,
    status: 'online',
    protocolVersion: '2024-11-05',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    callsLast24h: stats.calls,
    blockedLast24h: stats.blocked,
    quarantinedLast24h: stats.quarantined,
    loggedLast24h: stats.logged,
    allowedLast24h: stats.allowed,
    // Mean of the latency_ms column over the last 24h, ignoring rows
    // recorded before the column existed (NULL). Null when no timed
    // calls have been observed in the window.
    averageLatencyMs,
    filters,
    filteredEventCount,
    events,
  };
}

// Cap a single export at 50k rows so a runaway query can't blow up
// memory or hold the response open for minutes. The Containment Rules
// dashboard surfaces the filter chips, so operators can narrow down
// further if they need a deeper slice.
const GATEWAY_EXPORT_MAX_ROWS = 50_000;

export interface GatewayExportRow {
  occurredAt: string;
  decision: Decision;
  ruleId: string;
  agentClass: string;
  mcpServerId: string;
  tool: string;
  egressDomain: string | null;
  reason: string;
  linkedExposureId: string | null;
}

export async function getGatewayEventsForExport(
  filters: GatewayLiveSummaryFilters = {},
): Promise<GatewayExportRow[]> {
  await ensureSeeded();
  const filterConditions = [
    filters.decision ? eq(agentMeshGatewayEventsTable.decision, filters.decision) : undefined,
    filters.agentClass ? eq(agentMeshGatewayEventsTable.agentClass, filters.agentClass) : undefined,
    filters.ruleId ? eq(agentMeshGatewayEventsTable.ruleId, filters.ruleId) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);
  const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;
  const baseQuery = db
    .select({
      occurredAt: agentMeshGatewayEventsTable.occurredAt,
      decision: agentMeshGatewayEventsTable.decision,
      ruleId: agentMeshGatewayEventsTable.ruleId,
      agentClass: agentMeshGatewayEventsTable.agentClass,
      mcpServerId: agentMeshGatewayEventsTable.mcpServerId,
      tool: agentMeshGatewayEventsTable.tool,
      egressDomain: agentMeshGatewayEventsTable.egressDomain,
      reason: agentMeshGatewayEventsTable.reason,
      linkedExposureId: agentMeshGatewayEventsTable.linkedExposureId,
    })
    .from(agentMeshGatewayEventsTable)
    .orderBy(desc(agentMeshGatewayEventsTable.occurredAt))
    .limit(GATEWAY_EXPORT_MAX_ROWS);
  const rows = whereClause ? await baseQuery.where(whereClause) : await baseQuery;
  return rows.map((r) => ({
    occurredAt: r.occurredAt instanceof Date ? r.occurredAt.toISOString() : String(r.occurredAt),
    decision: r.decision as Decision,
    ruleId: r.ruleId,
    agentClass: r.agentClass,
    mcpServerId: r.mcpServerId,
    tool: r.tool,
    egressDomain: r.egressDomain ?? null,
    reason: r.reason,
    linkedExposureId: r.linkedExposureId ?? null,
  }));
}

export interface GatewayLatencyBucket {
  mcpServerId: string;
  tool: string | null;
  calls: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
}

export interface GatewayLatencyBreakdown {
  windowHours: number;
  perServer: GatewayLatencyBucket[];
  perTool: GatewayLatencyBucket[];
}

// Returns p50/p95/avg/max latency for the last `windowHours` hours, grouped
// by mcpServerId and (server, tool). Rows where latency_ms is NULL are
// ignored — those events were recorded before the latency column existed.
export async function getGatewayLatencyBreakdown(
  windowHours = 24,
): Promise<GatewayLatencyBreakdown> {
  await ensureSeeded();
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const latencyCol = agentMeshGatewayEventsTable.latencyMs;
  const baseFilter = and(gte(agentMeshGatewayEventsTable.occurredAt, since), isNotNull(latencyCol));

  const perServerRows = await db
    .select({
      mcpServerId: agentMeshGatewayEventsTable.mcpServerId,
      calls: count(),
      avgMs: sql<number | string>`avg(${latencyCol})`,
      p50Ms: sql<number | string>`percentile_cont(0.5) within group (order by ${latencyCol})`,
      p95Ms: sql<number | string>`percentile_cont(0.95) within group (order by ${latencyCol})`,
      maxMs: sql<number | string>`max(${latencyCol})`,
    })
    .from(agentMeshGatewayEventsTable)
    .where(baseFilter)
    .groupBy(agentMeshGatewayEventsTable.mcpServerId);

  const perToolRows = await db
    .select({
      mcpServerId: agentMeshGatewayEventsTable.mcpServerId,
      tool: agentMeshGatewayEventsTable.tool,
      calls: count(),
      avgMs: sql<number | string>`avg(${latencyCol})`,
      p50Ms: sql<number | string>`percentile_cont(0.5) within group (order by ${latencyCol})`,
      p95Ms: sql<number | string>`percentile_cont(0.95) within group (order by ${latencyCol})`,
      maxMs: sql<number | string>`max(${latencyCol})`,
    })
    .from(agentMeshGatewayEventsTable)
    .where(baseFilter)
    .groupBy(agentMeshGatewayEventsTable.mcpServerId, agentMeshGatewayEventsTable.tool);

  const toMs = (v: number | string | null | undefined): number =>
    v == null ? 0 : Math.round(Number(v));

  const perServer: GatewayLatencyBucket[] = perServerRows
    .map((r) => ({
      mcpServerId: r.mcpServerId,
      tool: null,
      calls: Number(r.calls ?? 0),
      avgMs: toMs(r.avgMs),
      p50Ms: toMs(r.p50Ms),
      p95Ms: toMs(r.p95Ms),
      maxMs: toMs(r.maxMs),
    }))
    .sort((a, b) => b.p95Ms - a.p95Ms);

  const perTool: GatewayLatencyBucket[] = perToolRows
    .map((r) => ({
      mcpServerId: r.mcpServerId,
      tool: r.tool,
      calls: Number(r.calls ?? 0),
      avgMs: toMs(r.avgMs),
      p50Ms: toMs(r.p50Ms),
      p95Ms: toMs(r.p95Ms),
      maxMs: toMs(r.maxMs),
    }))
    .sort((a, b) => b.p95Ms - a.p95Ms);

  return { windowHours, perServer, perTool };
}

function buildExposureRow(opts: {
  rule: GatewayRule;
  decision: Decision;
  reason: string;
  mcpServerId: string;
  tool: string;
}) {
  const id = `exp-gw-${randomUUID().slice(0, 8)}`;
  const severity =
    opts.decision === 'quarantined'
      ? 'critical'
      : opts.rule.tier === 'critical'
        ? 'high'
        : 'medium';
  return {
    id,
    orgId: null,
    title:
      opts.decision === 'quarantined'
        ? `Gateway quarantined ${opts.rule.agentClass} call to ${opts.mcpServerId}/${opts.tool}`
        : `Gateway blocked ${opts.rule.agentClass} call to ${opts.mcpServerId}/${opts.tool}`,
    severity,
    affectedAgentIds: [] as string[],
    affectedSecretIds: [] as string[],
    affectedMcpIds: [opts.mcpServerId],
    explanation: opts.reason,
    owaspCategory: 'LLM06: Excessive Agency',
    owaspRef: 'OWASP-LLM06',
    cveRefs: [] as string[],
    fixType: 'scope-token',
    fixLabel: `Tighten ${opts.rule.name} or expand allowlist`,
    proofHash: '',
    status: 'open',
    detectedAt: new Date(),
    updatedAt: new Date(),
  };
}

router.get('/mcp-gateway/config', authMiddleware(), requireRole('super_admin', 'ops'), async (_req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const [rules, stats] = await Promise.all([loadRules(), loadStats()]);
    const uptime = Math.floor((Date.now() - startedAt) / 1000);
    return sendSuccess(res, {
      endpoint: GATEWAY_ENDPOINT,
      status: 'online' as const,
      protocolVersion: '2024-11-05',
      uptimeSeconds: uptime,
      stats,
      rules,
    });
  } catch (err) {
    return handleRouteError(res, err, 'mcp-gateway-config');
  }
});

router.get('/mcp-gateway/events', authMiddleware(), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const rows = await db
      .select()
      .from(agentMeshGatewayEventsTable)
      .orderBy(desc(agentMeshGatewayEventsTable.occurredAt))
      .limit(limit);
    const [{ c: total } = { c: 0 }] = await db
      .select({ c: count() })
      .from(agentMeshGatewayEventsTable);
    const events = rows.map((r) => ({
      id: r.id,
      ruleId: r.ruleId,
      agentClass: r.agentClass,
      mcpServerId: r.mcpServerId,
      tool: r.tool,
      egressDomain: r.egressDomain ?? undefined,
      decision: r.decision,
      reason: r.reason,
      enforcementMode: r.enforcementMode,
      linkedExposureId: r.linkedExposureId ?? undefined,
      occurredAt: r.occurredAt instanceof Date ? r.occurredAt.toISOString() : String(r.occurredAt),
    }));
    return sendSuccess(res, { events, total: Number(total ?? 0) });
  } catch (err) {
    return handleRouteError(res, err, 'mcp-gateway-events');
  }
});

router.get('/mcp-gateway/latency', authMiddleware(), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    const hoursRaw = Number(req.query.hours);
    const windowHours =
      Number.isFinite(hoursRaw) && hoursRaw > 0 && hoursRaw <= 24 * 30 ? hoursRaw : 24;
    const breakdown = await getGatewayLatencyBreakdown(windowHours);
    return sendSuccess(res, breakdown);
  } catch (err) {
    return handleRouteError(res, err, 'mcp-gateway-latency');
  }
});

router.post('/mcp-gateway/proxy', authMiddleware(), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  const proxyStartedAt = performance.now();
  try {
    await ensureSeeded();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const agentClass = String(body.agentClass ?? '');
    const mcpServerId = String(body.mcpServerId ?? '');
    const tool = String(body.tool ?? '');
    const egressDomain = body.egressDomain ? String(body.egressDomain) : undefined;

    if (!agentClass || !mcpServerId || !tool) {
      return sendError(res, 'agentClass, mcpServerId, and tool are required', 400);
    }

    const rule = await findRuleForAgentClass(agentClass);
    if (!rule) {
      return sendError(res, `No containment rule registered for agent class '${agentClass}'`, 404);
    }

    const evaluation = evaluateRule(rule, { mcpServerId, tool, egressDomain });
    let decision: Decision = 'allowed';
    let linkedExposureId: string | undefined;
    let effectiveReason = evaluation.reason;

    if (rule.enforcementMode === 'quarantine') {
      // Quarantine mode rejects every call from this agent class until the
      // rule is cleared, regardless of whether the specific call violates.
      decision = 'quarantined';
      effectiveReason = evaluation.violation
        ? `Quarantine: ${evaluation.reason}`
        : 'Quarantine: agent class is fully isolated from MCP traffic';
    } else if (evaluation.violation) {
      if (rule.enforcementMode === 'log-only') {
        decision = 'logged';
      } else {
        decision = 'blocked';
      }
    }

    const eventId = `gw-evt-${randomUUID().slice(0, 8)}`;
    const occurredAt = new Date();
    const exposureRow =
      decision === 'blocked' || decision === 'quarantined'
        ? buildExposureRow({ rule, decision, reason: effectiveReason, mcpServerId, tool })
        : null;
    const incrementViolation = decision !== 'allowed';

    // Capture the policy-evaluation time (rule lookup + allowlist check)
    // separately from the upstream round trip so the Containment Rules
    // dashboard can distinguish gateway overhead from real network cost.
    const evalMs = Math.max(0, Math.round(performance.now() - proxyStartedAt));

    // For passthrough decisions, actually forward the call to the
    // configured MCP_GATEWAY_ENDPOINT and capture the upstream
    // round-trip time. Skipped when no endpoint is configured (dev) and
    // skipped for blocked/quarantined calls — those never leave the
    // gateway by design.
    let upstreamMs: number | null = null;
    let upstreamStatus: number | null = null;
    let upstreamBody: unknown = null;
    let upstreamError: string | null = null;
    const willPassthrough = decision === 'allowed' || decision === 'logged';
    if (willPassthrough && GATEWAY_ENDPOINT_CONFIGURED) {
      const upstreamStart = performance.now();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
      try {
        const upstreamRes = await fetch(GATEWAY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentClass,
            mcpServerId,
            tool,
            egressDomain: egressDomain ?? null,
            payload: body.payload ?? null,
          }),
          signal: ctrl.signal,
        });
        upstreamStatus = upstreamRes.status;
        const ct = upstreamRes.headers.get('content-type') ?? '';
        if (ct.includes('application/json')) {
          upstreamBody = await upstreamRes.json().catch(() => null);
        } else {
          upstreamBody = await upstreamRes.text().catch(() => null);
        }
      } catch (err) {
        upstreamError = err instanceof Error ? err.message : String(err);
        logger.warn(
          { err, ruleId: rule.id, agentClass, mcpServerId, tool },
          '[mcp-gateway] upstream forward failed; persisting decision with upstreamError',
        );
      } finally {
        clearTimeout(timer);
        upstreamMs = Math.max(0, Math.round(performance.now() - upstreamStart));
      }
    }

    // latency_ms now reflects the wall-clock time the calling agent
    // actually waited: policy evaluation plus (when we forwarded) the
    // upstream round trip. The 24h average on the Containment Rules
    // dashboard is therefore meaningful for capacity planning. All
    // persistence — exposure (if any), gateway event, and rule
    // counters — runs in a single transaction so we never return a
    // linkedExposureId or eventId that wasn't actually committed.
    const latencyMs = evalMs + (upstreamMs ?? 0);
    try {
      await db.transaction(async (tx) => {
        if (exposureRow) {
          await tx.insert(agentMeshExposuresTable).values(exposureRow);
        }
        await tx.insert(agentMeshGatewayEventsTable).values({
          id: eventId,
          orgId: null,
          ruleId: rule.id,
          agentClass,
          mcpServerId,
          tool,
          egressDomain: egressDomain ?? null,
          decision,
          reason: effectiveReason,
          enforcementMode: rule.enforcementMode,
          linkedExposureId: exposureRow ? exposureRow.id : null,
          latencyMs,
          occurredAt,
        });
        if (incrementViolation) {
          await tx
            .update(agentMeshContainmentRulesTable)
            .set({
              violationCount: sql`${agentMeshContainmentRulesTable.violationCount} + 1`,
              lastEvaluatedAt: occurredAt,
            })
            .where(eq(agentMeshContainmentRulesTable.id, rule.id));
        }
      });
    } catch (err) {
      logger.error(
        { err, eventId, ruleId: rule.id, decision },
        '[mcp-gateway] failed to persist gateway decision; rejecting request',
      );
      return sendError(res, 'Failed to persist gateway decision', 500);
    }

    linkedExposureId = exposureRow ? exposureRow.id : undefined;

    // Notify SSE subscribers so the Containment Rules dashboard can prepend
    // this event without waiting for the next 30s poll. Fired only after the
    // transaction above has committed successfully.
    try {
      gatewayEventBus.emitEvent({
        id: eventId,
        ruleId: rule.id,
        agentClass,
        mcpServerId,
        tool,
        egressDomain: egressDomain ?? undefined,
        decision,
        reason: effectiveReason,
        enforcementMode: rule.enforcementMode,
        linkedExposureId,
        occurredAt: occurredAt.toISOString(),
      });
    } catch (err) {
      logger.warn({ err, eventId }, '[mcp-gateway] failed to publish gateway event to SSE bus');
    }

    const passthrough = decision === 'allowed' || decision === 'logged';
    return sendSuccess(res, {
      decision,
      passthrough,
      reason: effectiveReason,
      ruleId: rule.id,
      enforcementMode: rule.enforcementMode,
      linkedExposureId,
      eventId,
      evalMs,
      upstreamMs,
      latencyMs,
      upstream: passthrough
        ? {
            forwarded: GATEWAY_ENDPOINT_CONFIGURED,
            endpoint: GATEWAY_ENDPOINT_CONFIGURED ? GATEWAY_ENDPOINT : null,
            status: upstreamStatus,
            body: upstreamBody,
            error: upstreamError,
          }
        : null,
    });
  } catch (err) {
    return handleRouteError(res, err, 'mcp-gateway-proxy');
  }
});

router.patch('/mcp-gateway/rules/:ruleId/enforcement-mode', authMiddleware(), requireRole('super_admin', 'ops'), async (req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const ruleId = req.params.ruleId;
    if (!ruleId) return sendError(res, 'ruleId is required', 400);
    const rule = await findRuleById(ruleId);
    if (!rule) return sendError(res, `Rule '${ruleId}' not found`, 404);

    const body = (req.body ?? {}) as Record<string, unknown>;
    const requestedMode = String(body.mode ?? '') as EnforcementMode;
    if (!['log-only', 'block', 'quarantine'].includes(requestedMode)) {
      return sendError(res, 'mode must be one of: log-only, block, quarantine', 400);
    }
    const requestedBy = String(body.requestedBy ?? 'operator');

    if (rule.tier === 'critical' && rule.enforcementMode !== requestedMode) {
      // Persist the pending mode change AND open an entry in the
      // approvals queue in a single transaction. If either side fails
      // we abort — we never want a rule sitting in 'pending' state
      // without a real approval row to back it.
      const requestedAt = new Date();
      let pendingModeChange: PendingModeChange;
      try {
        pendingModeChange = await db.transaction(async (tx) => {
          const [inserted] = await tx
            .insert(approvalRequestsTable)
            .values({
              resourceType: 'policy',
              resourceId: ruleId,
              title: `MCP gateway: change ${rule.name} enforcement to '${requestedMode}'`,
              description:
                `Critical-tier containment rule '${rule.name}' (agent class ${rule.agentClass}) ` +
                `requested mode change from '${rule.enforcementMode}' to '${requestedMode}'.`,
              actionClass: 'policy.enforcement-mode',
              priority: 'high',
              status: 'pending',
              requestedByRole: requestedBy,
              requiredApproverRole: 'guardian',
              correlationId: ruleId,
              serviceAttribution: 'mcp-gateway',
              payload: {
                ruleId,
                currentMode: rule.enforcementMode,
                requestedMode,
                tier: rule.tier,
              },
            })
            .returning({ id: approvalRequestsTable.id });
          if (!inserted?.id) {
            throw new Error('approval_requests insert returned no id');
          }
          const pmc: PendingModeChange = {
            requestedMode,
            requestedBy,
            requestedAt: requestedAt.toISOString(),
            guardianApprovalId: `approval-${inserted.id}`,
          };
          await tx
            .update(agentMeshContainmentRulesTable)
            .set({ pendingModeChange: pmc })
            .where(eq(agentMeshContainmentRulesTable.id, ruleId));
          return pmc;
        });
      } catch (err) {
        logger.error(
          { err, ruleId },
          '[mcp-gateway] failed to enqueue guardian approval — rejecting mode change',
        );
        return sendError(
          res,
          'Failed to enqueue Guardian approval for critical-tier mode change',
          500,
        );
      }

      const updated = await findRuleById(ruleId);
      return sendSuccess(res, {
        applied: false,
        pendingApproval: true,
        rule: updated ?? { ...rule, pendingModeChange },
        message: 'Critical-tier mode changes require Guardian approval before taking effect.',
      });
    }

    await db
      .update(agentMeshContainmentRulesTable)
      .set({ enforcementMode: requestedMode, pendingModeChange: null })
      .where(eq(agentMeshContainmentRulesTable.id, ruleId));

    const updated = await findRuleById(ruleId);
    return sendSuccess(res, {
      applied: true,
      pendingApproval: false,
      rule: updated ?? { ...rule, enforcementMode: requestedMode, pendingModeChange: undefined },
    });
  } catch (err) {
    return handleRouteError(res, err, 'mcp-gateway-mode');
  }
});

export default router;
