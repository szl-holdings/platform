import {
  db,
  guardianPoliciesTable,
  guardianTiersTable,
  toolMeshToolsTable,
  toolMeshToolVersionsTable,
} from '@szl-holdings/db';
import {
  POLICY_TIER_DESCRIPTIONS,
  type PolicyTier,
  PolicyTierSchema,
  TIER_CONTROLS,
  TIER_NUMBER,
  TIER_RISK_LEVEL,
} from '@workspace/guardian';
import {
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  FINANCE_TOOL_MANIFESTS,
  GRAPH_QUERY_TOOL_MANIFEST,
  OPERATIONS_TOOL_MANIFESTS,
  SECURITY_TOOL_MANIFESTS,
  type ToolManifest,
} from '@workspace/tool-mesh';
import { and, inArray, isNull } from 'drizzle-orm';
import { logger } from './logger';

const DEFAULT_TIERS = PolicyTierSchema.options;

const DEFAULT_DOMAINS = [
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

function defaultPolicyForTier(tier: string, domain: string) {
  const isMandatory = tier === 'human-approval-mandatory';
  return {
    name: `default-${domain}-${tier}`,
    description: `Default tier policy for ${domain} (${tier}) — seeded at startup`,
    tier: tier as (typeof DEFAULT_TIERS)[number],
    conditions: [{ field: 'domain', operator: 'eq' as const, value: domain }],
    action: (isMandatory ? 'require-approval' : 'allow') as 'allow' | 'require-approval',
    priority: 900,
    enabled: true,
    owner: 'guardian-defaults',
    tags: ['default', 'tier-baseline', domain] as string[],
  };
}

const ALL_TOOL_MANIFESTS: ToolManifest[] = [
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  ...SECURITY_TOOL_MANIFESTS,
  ...FINANCE_TOOL_MANIFESTS,
  ...OPERATIONS_TOOL_MANIFESTS,
];

/**
 * Seed the global tier definitions (orgId NULL) from the in-process
 * `TIER_CONTROLS` constants so /policies/tiers can read from the DB and
 * tier definitions survive restart. Idempotent — only inserts missing rows.
 *
 * Failures are loud: this function throws so the caller can decide how to
 * react. Previously errors were swallowed as "non-fatal" warnings, which
 * masked schema drift and left tier tables silently empty.
 */
export async function seedGuardianTiers(): Promise<void> {
  const tierNames = PolicyTierSchema.options as PolicyTier[];
  const existing = await db
    .select({ tier: guardianTiersTable.tier })
    .from(guardianTiersTable)
    .where(isNull(guardianTiersTable.orgId));
  const existingSet = new Set(existing.map((r) => r.tier));
  const missing = tierNames
    .filter((t) => !existingSet.has(t))
    .map((tier) => ({
      orgId: null,
      tier,
      tierNumber: TIER_NUMBER[tier],
      description: POLICY_TIER_DESCRIPTIONS[tier],
      riskLevel: TIER_RISK_LEVEL[tier],
      controls: TIER_CONTROLS[tier] as unknown as Record<string, unknown>,
      enabled: true,
    }));
  if (missing.length > 0) {
    await db.insert(guardianTiersTable).values(missing);
    logger.info(
      { inserted: missing.length, alreadyPresent: existingSet.size },
      '[seed-guardian] Default tier definitions seeded',
    );
  } else {
    logger.info(
      { alreadyPresent: existingSet.size },
      '[seed-guardian] All default tier definitions already present',
    );
  }
}

/**
 * Seed default Guardian policies and Tool-Mesh tool manifests. Idempotent —
 * uses per-row existence checks (policies) and the unique tool_id constraint
 * (tools) so concurrent or repeated calls don't duplicate rows.
 *
 * Throws on failure so the caller can log/escalate. Silent error swallowing
 * was removed because it allowed schema drift to hide an empty Guardian
 * surface area on fresh installs.
 */
export async function seedGuardianDefaults(): Promise<void> {
  // Build the full set of default policies (tier x domain).
  const defaults: Array<ReturnType<typeof defaultPolicyForTier>> = [];
  for (const tier of DEFAULT_TIERS) {
    for (const domain of DEFAULT_DOMAINS) {
      defaults.push(defaultPolicyForTier(tier, domain));
    }
  }
  const defaultNames = defaults.map((p) => p.name);

  // Per-row idempotency: query which default names already exist (org_id IS NULL
  // identifies global/default policies) and only insert the missing ones.
  const existing = await db
    .select({ name: guardianPoliciesTable.name })
    .from(guardianPoliciesTable)
    .where(
      and(isNull(guardianPoliciesTable.orgId), inArray(guardianPoliciesTable.name, defaultNames)),
    );
  const existingNames = new Set(existing.map((r) => r.name));
  const missing = defaults.filter((p) => !existingNames.has(p.name));

  if (missing.length > 0) {
    await db.insert(guardianPoliciesTable).values(missing);
    logger.info(
      { inserted: missing.length, alreadyPresent: existingNames.size },
      '[seed-guardian] Default tier policies seeded',
    );
  } else {
    logger.info(
      { alreadyPresent: existingNames.size },
      '[seed-guardian] All default tier policies already present',
    );
  }

  // Per-row idempotency for tools via the unique tool_id constraint.
  const toolRows = ALL_TOOL_MANIFESTS.map((m) => ({
    toolId: m.id,
    name: m.name,
    version: m.version,
    description: m.description,
    domainTags: m.domainTags,
    policyTier: m.policyTier,
    allowedEnvironments: m.allowedEnvironments,
    inputSchema: m.inputSchema ?? null,
    outputSchema: m.outputSchema ?? null,
    rateLimits: m.rateLimits,
    timeoutMs: m.timeoutMs,
    failureModes: m.failureModes,
    approvalRequired: m.approvalRequired,
    owner: m.owner ?? null,
    observabilityHooks: m.observabilityHooks,
    enabled: m.enabled,
  }));
  if (toolRows.length > 0) {
    const inserted = await db
      .insert(toolMeshToolsTable)
      .values(toolRows as any)
      .onConflictDoNothing({ target: toolMeshToolsTable.toolId })
      .returning({
        id: toolMeshToolsTable.id,
        toolId: toolMeshToolsTable.toolId,
        version: toolMeshToolsTable.version,
      });

    logger.info(
      { inserted: inserted.length, attempted: toolRows.length },
      '[seed-guardian] Default tool manifests seeded',
    );

    // For each newly-inserted tool, write the initial version snapshot so
    // tool_mesh_tool_versions has a baseline row from the start.
    for (const ins of inserted) {
      const manifest = ALL_TOOL_MANIFESTS.find((m) => m.id === ins.toolId);
      if (!manifest) continue;
      await db
        .insert(toolMeshToolVersionsTable)
        .values({
          toolDbId: ins.id,
          version: manifest.version,
          changelog: 'Initial seed version',
          schemaSnapshot: {
            inputSchema: manifest.inputSchema ?? null,
            outputSchema: manifest.outputSchema ?? null,
            rateLimits: manifest.rateLimits,
            timeoutMs: manifest.timeoutMs,
            policyTier: manifest.policyTier,
          },
        })
        .onConflictDoNothing({
          target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version],
        });
    }
  }
}
