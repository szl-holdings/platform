import {
  db,
  guardianPoliciesTable,
  toolMeshToolsTable,
  toolMeshToolVersionsTable,
} from "@szl-holdings/db";
import {
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  SECURITY_TOOL_MANIFESTS,
  FINANCE_TOOL_MANIFESTS,
  OPERATIONS_TOOL_MANIFESTS,
  type ToolManifest,
} from "@workspace/tool-mesh";
import { PolicyTierSchema } from "@workspace/guardian";
import { inArray, isNull, and } from "drizzle-orm";
import { logger } from "./logger";

const DEFAULT_TIERS = PolicyTierSchema.options;

const DEFAULT_DOMAINS = ["graph", "documents", "data", "communication", "finance", "legal", "security", "infrastructure", "analytics"] as const;

function defaultPolicyForTier(tier: string, domain: string) {
  const isMandatory = tier === "human-approval-mandatory";
  return {
    name: `default-${domain}-${tier}`,
    description: `Default tier policy for ${domain} (${tier}) — seeded at startup`,
    tier: tier as (typeof DEFAULT_TIERS)[number],
    conditions: [{ field: "domain", operator: "eq" as const, value: domain }],
    action: (isMandatory ? "require-approval" : "allow") as
      | "allow" | "require-approval",
    priority: 900,
    enabled: true,
    owner: "guardian-defaults",
    tags: ["default", "tier-baseline", domain] as string[],
  };
}

const ALL_TOOL_MANIFESTS: ToolManifest[] = [
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  ...SECURITY_TOOL_MANIFESTS,
  ...FINANCE_TOOL_MANIFESTS,
  ...OPERATIONS_TOOL_MANIFESTS,
];

export async function seedGuardianDefaults(): Promise<void> {
  try {
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
      .where(and(isNull(guardianPoliciesTable.orgId), inArray(guardianPoliciesTable.name, defaultNames)));
    const existingNames = new Set(existing.map((r) => r.name));
    const missing = defaults.filter((p) => !existingNames.has(p.name));

    if (missing.length > 0) {
      await db.insert(guardianPoliciesTable).values(missing);
      logger.info({ inserted: missing.length, alreadyPresent: existingNames.size }, "[seed-guardian] Default tier policies seeded");
    } else {
      logger.info({ alreadyPresent: existingNames.size }, "[seed-guardian] All default tier policies already present");
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
        .values(toolRows)
        .onConflictDoNothing({ target: toolMeshToolsTable.toolId })
        .returning({ id: toolMeshToolsTable.id, toolId: toolMeshToolsTable.toolId, version: toolMeshToolsTable.version });

      logger.info({ inserted: inserted.length, attempted: toolRows.length }, "[seed-guardian] Default tool manifests seeded");

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
            changelog: "Initial seed version",
            schemaSnapshot: {
              inputSchema: manifest.inputSchema ?? null,
              outputSchema: manifest.outputSchema ?? null,
              rateLimits: manifest.rateLimits,
              timeoutMs: manifest.timeoutMs,
              policyTier: manifest.policyTier,
            },
          })
          .onConflictDoNothing({ target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version] });
      }
    }
  } catch (err) {
    logger.warn({ err }, "[seed-guardian] Seed failed (non-fatal)");
  }
}