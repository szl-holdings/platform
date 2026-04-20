import {
  db,
  type GuardianPolicy,
  guardianActionsTable,
  guardianPoliciesTable,
} from '@szl-holdings/db';
import {
  type DecisionRequest,
  type DecisionResult,
  GuardianDecisionEngine,
  type GuardianRule,
  type PolicyTier,
} from '@workspace/guardian';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { logger } from './logger';
import { publishToSse } from './sse-server';

export const GUARDIAN_LEDGER_SSE_CHANNEL = 'guardian:ledger';

/**
 * Shape of a streamed guardian decision event. Mirrors the row shape returned
 * by GET /api/guardian/ledger so the front-end timeline can prepend without
 * extra mapping. Trace fields are nullable because a decision may be persisted
 * before its trace span closes.
 */
export interface StreamedGuardianDecision {
  id: number | null;
  requestId: string;
  agentId: string | null;
  sessionId: string | null;
  workflowId: string | null;
  orgId: number | null;
  tier: string;
  action: string;
  toolId: string | null;
  model: string | null;
  environment: string | null;
  decision: string;
  matchedRuleId: string | null;
  reason: string;
  rollbackRequired: boolean;
  controlViolations: unknown[];
  domain: string | null;
  latencyMs: number | null;
  traceId: string | null;
  traceStatus: string | null;
  decidedAt: string;
}

/**
 * Broadcast a freshly persisted guardian decision to every SSE subscriber on
 * the live-activity channel. Failures are swallowed because streaming must
 * never break a request.
 *
 * Delivery scope mirrors the org-scoping enforced by `GET /api/guardian/ledger`:
 *   - row.orgId === number → delivered to admin (unscoped) clients AND to
 *     non-admin clients whose subscription is scoped to that org.
 *   - row.orgId === null   → delivered to admin (unscoped) clients ONLY.
 *     This matches `/ledger`, where non-admins never see rows with no org.
 *
 * Callers should invoke this immediately after their insert into
 * guardian_actions so the operator UI sees the new decision in ~real-time
 * without polling.
 */
export function publishGuardianDecisionEvent(row: StreamedGuardianDecision): void {
  try {
    const tenantId = row.orgId !== null ? String(row.orgId) : null;
    const adminOnly = row.orgId === null;
    publishToSse(GUARDIAN_LEDGER_SSE_CHANNEL, 'decision', row, tenantId, { adminOnly });
  } catch (err) {
    logger.debug(
      { err, requestId: row.requestId },
      '[guardian-engine] Failed to publish decision event (non-fatal)',
    );
  }
}

const engine = new GuardianDecisionEngine();
let lastSyncedAt = 0;
let initialized = false;

const POLICY_SYNC_INTERVAL_MS = parseInt(
  process.env.GUARDIAN_POLICY_SYNC_INTERVAL_MS ?? '30000',
  10,
);

/**
 * Convert a persisted GuardianPolicy row to an in-memory GuardianRule.
 */
function policyRowToRule(row: GuardianPolicy): GuardianRule {
  return {
    id: `policy-${row.id}`,
    name: row.name,
    description: row.description ?? undefined,
    tier: row.tier as GuardianRule['tier'],
    conditions: ((row.conditions as unknown[]) ?? []) as GuardianRule['conditions'],
    action: row.action as GuardianRule['action'],
    priority: row.priority,
    enabled: row.enabled,
    owner: row.owner ?? undefined,
    tags: (row.tags as string[]) ?? [],
    allowedModels: (row.allowedModels as string[] | null) ?? undefined,
    allowedTools: (row.allowedTools as string[] | null) ?? undefined,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : (row.createdAt as unknown as string),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : (row.updatedAt as unknown as string),
  };
}

/**
 * Bootstrap fallback rules so the engine never deny-by-default for known
 * agent-facing route categories before the DB-seeded policies are applied.
 * Very low priority — they only act as a safety net.
 *
 * Single source of truth for policy domains. MUST stay aligned with the
 * categories emitted by `guardian-policy.ts::deriveCategory()` so every
 * agent-facing API call has at least one matching fallback rule and is
 * never deny-by-default in enforce mode. "general" is the catch-all
 * category used when a route prefix is unmapped.
 */
const FALLBACK_DOMAINS = [
  'general',
  'alloy',
  'agents',
  'ai',
  'memory',
  'skills',
  'verifier',
  'self-model',
  'decisions',
  'governance',
  'plans',
  'reflections',
  'nexus',
  'signals',
  'graph',
  'documents',
  'data',
  'communication',
  'finance',
  'legal',
  'security',
  'infrastructure',
  'analytics',
] as const;

const FALLBACK_TIERS: PolicyTier[] = ['advisory', 'supervised', 'operator-approved'];

function installFallbackRules(): void {
  for (const tier of FALLBACK_TIERS) {
    for (const domain of FALLBACK_DOMAINS) {
      engine.addRule({
        id: `fallback-${domain}-${tier}`,
        name: `Fallback allow ${domain} (${tier})`,
        description: 'Bootstrap fallback rule installed at startup',
        tier,
        conditions: [{ field: 'domain', operator: 'eq', value: domain }],
        action: 'allow',
        priority: 9990,
        enabled: true,
        owner: 'guardian-engine-bootstrap',
        tags: ['fallback', 'bootstrap', domain],
      });
    }
  }
}

/**
 * Reload all enabled GuardianPolicy rows from the database into the in-process
 * engine. Safe to call repeatedly. Throttled by POLICY_SYNC_INTERVAL_MS unless
 * `force` is true.
 */
export async function syncGuardianPolicies(force = false): Promise<number> {
  if (!force && Date.now() - lastSyncedAt < POLICY_SYNC_INTERVAL_MS) {
    return engine.getRules().length;
  }
  lastSyncedAt = Date.now();
  try {
    const rows = await db
      .select()
      .from(guardianPoliciesTable)
      .where(eq(guardianPoliciesTable.enabled, true));
    for (const r of engine.getRules()) engine.removeRule(r.id);
    installFallbackRules();
    for (const row of rows) engine.addRule(policyRowToRule(row));
    return rows.length;
  } catch (err) {
    logger.warn({ err }, '[guardian-engine] Policy sync failed');
    return engine.getRules().length;
  }
}

/**
 * Initialize the shared Guardian decision engine: install fallback rules and
 * hydrate from the database. Called once at server bootstrap.
 */
export async function initGuardianEngine(): Promise<void> {
  if (initialized) return;
  installFallbackRules();
  if (process.env.DATABASE_URL) {
    try {
      const loaded = await syncGuardianPolicies(true);
      logger.info(
        { rulesLoaded: loaded, totalRules: engine.getRules().length },
        '[guardian-engine] Decision engine hydrated from policies table',
      );
    } catch (err) {
      logger.warn(
        { err },
        '[guardian-engine] Initial policy hydration failed — using fallback rules only',
      );
    }
  } else {
    logger.info('[guardian-engine] DATABASE_URL not set — running with fallback rules only');
  }
  initialized = true;
}

/**
 * Get the shared GuardianDecisionEngine singleton. The engine is the same
 * instance used by both the policy-check middleware and the /api/guardian
 * routes, so policy edits reflect immediately.
 */
export function getGuardianEngine(): GuardianDecisionEngine {
  return engine;
}

/**
 * Force the engine to be re-synced on the next access. Called by the
 * guardian routes after a policy mutation.
 */
export function invalidateGuardianEngine(): void {
  lastSyncedAt = 0;
}

/**
 * Persist a Guardian decision to the action_ledger (guardian_actions table).
 * Failures are swallowed — the audit trail must never break a request.
 */
export async function recordGuardianAction(params: {
  request: DecisionRequest;
  result: DecisionResult;
  orgId?: number | null;
  payload?: Record<string, unknown>;
  redactApplied?: boolean;
  controlViolations?: string[];
}): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const inserted = await db
      .insert(guardianActionsTable)
      .values({
        requestId: params.request.requestId,
        agentId: params.request.agentId ?? null,
        sessionId: params.request.sessionId ?? null,
        workflowId: params.request.workflowId ?? null,
        orgId: params.orgId ?? null,
        tier: (params.request.tier ?? 'advisory') as GuardianPolicy['tier'],
        action: params.request.action,
        toolId: params.request.toolId ?? null,
        model: params.request.model ?? null,
        environment: params.request.environment ?? null,
        outcome: params.result.outcome === 'deny' ? 'block' : params.result.outcome,
        matchedRuleId: params.result.matchedRuleId ?? null,
        reason: params.result.reason,
        rollbackRequired: false,
        redactApplied: params.redactApplied ?? false,
        controlViolations: params.controlViolations ?? [],
        payload: params.payload ?? {},
      })
      .onConflictDoNothing({ target: guardianActionsTable.requestId })
      .returning({ id: guardianActionsTable.id });

    // Only stream when this call actually persisted a new row. An idempotent
    // conflict (re-submission of the same requestId) returns no rows here, so
    // we skip publishing to avoid duplicate/phantom entries on the live feed.
    if (inserted.length === 0) return;
    const insertedId = inserted[0]?.id ?? null;

    publishGuardianDecisionEvent({
      id: insertedId,
      requestId: params.request.requestId,
      agentId: params.request.agentId ?? null,
      sessionId: params.request.sessionId ?? null,
      workflowId: params.request.workflowId ?? null,
      orgId: params.orgId ?? null,
      tier: (params.request.tier ?? 'advisory') as string,
      action: params.request.action,
      toolId: params.request.toolId ?? null,
      model: params.request.model ?? null,
      environment: params.request.environment ?? null,
      decision: params.result.outcome === 'deny' ? 'block' : params.result.outcome,
      matchedRuleId: params.result.matchedRuleId ?? null,
      reason: params.result.reason,
      rollbackRequired: false,
      controlViolations: params.controlViolations ?? [],
      domain: params.request.domain ?? null,
      latencyMs: null,
      traceId: null,
      traceStatus: null,
      decidedAt: new Date(params.result.decidedAt ?? Date.now()).toISOString(),
    });
  } catch (err) {
    logger.debug(
      { err, requestId: params.request.requestId },
      '[guardian-engine] Failed to record action ledger entry (non-fatal)',
    );
  }
}

/**
 * Build a request id suitable for both the decision call and the
 * audit-log row (must be unique per call).
 */
export function makeGuardianRequestId(prefix = 'req'): string {
  return `${prefix}-${randomUUID()}`;
}
