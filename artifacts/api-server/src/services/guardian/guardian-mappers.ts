import {
  db,
  type GuardianPolicy,
  type GuardianPolicyAssignment,
  type ToolMeshActionApproval,
  type ToolMeshTool,
  type ToolMeshToolPermission,
  type ToolMeshToolVersion,
  usersTable,
} from '@szl-holdings/db';
import { type GuardianRule, type ToolManifest } from '@workspace/guardian';
import { syncGuardianPolicies } from '../../lib/guardian-engine';
import { sql } from 'drizzle-orm';

export function policyRowToApi(row: GuardianPolicy) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    tier: row.tier,
    conditions: (row.conditions as unknown[]) ?? [],
    action: row.action,
    priority: row.priority,
    enabled: row.enabled,
    owner: row.owner ?? undefined,
    tags: (row.tags as string[]) ?? [],
    allowedModels: (row.allowedModels as string[] | null) ?? undefined,
    allowedTools: (row.allowedTools as string[] | null) ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

export function policyRowToRule(row: GuardianPolicy): GuardianRule {
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

export function toolRowToManifest(row: ToolMeshTool): ToolManifest {
  return {
    id: row.toolId,
    name: row.name,
    version: row.version,
    description: row.description,
    domainTags: ((row.domainTags as string[]) ?? []) as ToolManifest['domainTags'],
    policyTier: row.policyTier as ToolManifest['policyTier'],
    allowedEnvironments: ((row.allowedEnvironments as string[]) ??
      []) as ToolManifest['allowedEnvironments'],
    inputSchema: (row.inputSchema as Record<string, unknown> | null) ?? undefined,
    outputSchema: (row.outputSchema as Record<string, unknown> | null) ?? undefined,
    rateLimits: (row.rateLimits as ToolManifest['rateLimits']) ?? {},
    timeoutMs: row.timeoutMs,
    failureModes: ((row.failureModes as unknown[]) ?? []) as ToolManifest['failureModes'],
    approvalRequired: row.approvalRequired,
    owner: row.owner ?? undefined,
    observabilityHooks: (row.observabilityHooks as ToolManifest['observabilityHooks']) ?? {
      emitTrace: true,
      emitMetrics: true,
      sensitiveFields: [],
    },
    enabled: row.enabled,
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

export function assignmentRowToApi(row: GuardianPolicyAssignment) {
  return {
    id: row.id,
    policyId: row.policyId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    context: (row.context as Record<string, unknown>) ?? {},
    grantedById: row.grantedById ?? undefined,
    expiresAt:
      row.expiresAt instanceof Date ? row.expiresAt.toISOString() : (row.expiresAt ?? undefined),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

export function versionRowToApi(row: ToolMeshToolVersion) {
  return {
    id: row.id,
    toolDbId: row.toolDbId,
    version: row.version,
    changelog: row.changelog ?? undefined,
    schemaSnapshot: (row.schemaSnapshot as Record<string, unknown>) ?? {},
    publishedById: row.publishedById ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

export function permissionRowToApi(row: ToolMeshToolPermission) {
  return {
    id: row.id,
    toolDbId: row.toolDbId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    permission: row.permission,
    grantedById: row.grantedById ?? undefined,
    expiresAt:
      row.expiresAt instanceof Date ? row.expiresAt.toISOString() : (row.expiresAt ?? undefined),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

export interface ResolvedActor {
  id: number;
  displayName: string;
  email: string | null;
}

export type ActorMap = Map<number, ResolvedActor>;

export async function resolveActorMap(ids: Array<number | null | undefined>): Promise<ActorMap> {
  const map: ActorMap = new Map();
  const unique = Array.from(
    new Set(ids.filter((v): v is number => typeof v === 'number' && v > 0)),
  );
  if (unique.length === 0) return map;
  const rows = await db
    .select({ id: usersTable.id, displayName: usersTable.displayName, email: usersTable.email })
    .from(usersTable)
    .where(
      sql`${usersTable.id} IN (${sql.join(
        unique.map((v) => sql`${v}`),
        sql`, `,
      )})`,
    );
  for (const r of rows) {
    map.set(r.id, { id: r.id, displayName: r.displayName, email: r.email ?? null });
  }
  return map;
}

export function actorOrUndefined(
  id: number | null | undefined,
  actors: ActorMap,
): ResolvedActor | undefined {
  if (typeof id !== 'number' || id <= 0) return undefined;
  return actors.get(id);
}

export function approvalRowToApi(row: ToolMeshActionApproval, actors?: ActorMap) {
  const map = actors ?? new Map<number, ResolvedActor>();
  return {
    id: row.id,
    requestId: row.requestId,
    toolId: row.toolId,
    action: row.action,
    agentId: row.agentId ?? undefined,
    sessionId: row.sessionId ?? undefined,
    workflowId: row.workflowId ?? undefined,
    status: row.status,
    decisionReason: row.decisionReason ?? undefined,
    requestedById: row.requestedById ?? undefined,
    requestedBy: actorOrUndefined(row.requestedById, map),
    approvedById: row.approvedById ?? undefined,
    approvedBy: actorOrUndefined(row.approvedById, map),
    approvedAt:
      row.approvedAt instanceof Date
        ? row.approvedAt.toISOString()
        : (row.approvedAt ?? undefined),
    rejectedById: row.rejectedById ?? undefined,
    rejectedBy: actorOrUndefined(row.rejectedById, map),
    rejectedAt:
      row.rejectedAt instanceof Date
        ? row.rejectedAt.toISOString()
        : (row.rejectedAt ?? undefined),
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

export async function syncDecisionEngine(): Promise<void> {
  await syncGuardianPolicies(true);
}

export const PII_FIELD_PATTERNS = [
  /^(email|phone|ssn|dob|date_of_birth|birthdate|address|postal_code|zip|credit_card|card_number|cvv|password|secret|token|api_key|private_key|national_id|passport|drivers_license|bank_account|routing_number|tax_id|ein|sin)/i,
];

export function redactPayload(payload: Record<string, unknown>): {
  redacted: Record<string, unknown>;
  redactedFields: string[];
} {
  const redacted: Record<string, unknown> = {};
  const redactedFields: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (PII_FIELD_PATTERNS.some((p) => p.test(key))) {
      redacted[key] = '[REDACTED]';
      redactedFields.push(key);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const inner = redactPayload(value as Record<string, unknown>);
      redacted[key] = inner.redacted;
      redactedFields.push(...inner.redactedFields.map((f) => `${key}.${f}`));
    } else {
      redacted[key] = value;
    }
  }
  return { redacted, redactedFields };
}

export function isAdminUser(user: { roles?: string[] } | null | undefined): boolean {
  return user?.roles?.some((r) => ['super_admin', 'admin'].includes(r)) ?? false;
}

export function userOrgId(user: { orgs?: Array<{ orgId: number }> } | null | undefined): number | null {
  return user?.orgs?.[0]?.orgId ?? null;
}
