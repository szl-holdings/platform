import { db, featureFlagsTable, featureFlagOverridesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

export const PLATFORM_FLAGS = [
  {
    key: "lyte_readiness_enabled",
    name: "Lyte — Readiness Module",
    description: "Enables the Lyte Readiness scoring engine, dimension tracking, and blocker analysis. Disable to hide readiness from the command center.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "lyte_value_at_risk_enabled",
    name: "Lyte — Value at Risk Module",
    description: "Enables the Value at Risk financial exposure model within Lyte signals. Requires readiness data to be present.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "lyte_role_views_enabled",
    name: "Lyte — Role-Based Views",
    description: "Enables role-specific dashboard views in Lyte (CTO, CFO, Operations). When off, shows unified view for all roles.",
    isEnabled: false,
    rolloutPercentage: 0,
  },
  {
    key: "vessels_command_mode_enabled",
    name: "Vessels — Command Mode",
    description: "Enables the vessels command mode with active dispatch and route override capabilities. Requires elevated permissions.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "vessels_corridor_intelligence_enabled",
    name: "Vessels — Corridor Intelligence",
    description: "Enables the AI corridor intelligence layer with route pressure scoring and geopolitical risk overlays.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "alloy_admin_enabled",
    name: "Alloy — Admin Mode",
    description: "Enables the Alloy admin interface for KB management, document ingestion, and advisory configuration. Admin role required.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "alloy_artifact_approvals_enabled",
    name: "Alloy — Artifact Approvals",
    description: "Enables the artifact approval workflow. Generated artifacts require approval before delivery when this flag is on.",
    isEnabled: false,
    rolloutPercentage: 0,
  },
  {
    key: "internal_audit_console_enabled",
    name: "Internal — Audit Console",
    description: "Enables the privileged audit console in the admin panel, showing raw audit events and activity logs. Admin/ops only.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "pilot_customer_portal_enabled",
    name: "Pilot — Customer Portal",
    description: "Enables the pilot customer self-service portal. Targeted at specific org IDs during onboarding pilot phase.",
    isEnabled: false,
    rolloutPercentage: 0,
  },
  {
    key: "advanced_export_enabled",
    name: "Platform — Advanced Export",
    description: "Enables advanced export options including CSV bulk export, scheduled reports, and API data extracts across all modules.",
    isEnabled: false,
    rolloutPercentage: 20,
  },
  {
    key: "dynamics365_sync_enabled",
    name: "Microsoft — Dynamics 365 Sync",
    description: "Enables the Dynamics 365 Dataverse connector for bidirectional CRM sync. Ingests opportunity stage changes, case escalations, and lead scoring signals into Lyte. Requires DYNAMICS_TENANT_ID, DYNAMICS_CLIENT_ID, DYNAMICS_CLIENT_SECRET, and DYNAMICS_ORG_URL to go live; runs in demo mode otherwise.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "sharepoint_spfx_enabled",
    name: "Microsoft — SharePoint SPFx Web Parts",
    description: "Enables the SharePoint SPFx integration endpoints for deploying and managing SZL embedded web parts (Lyte Signal Summary, Vessels Fleet Status, Terra Market Overview, Alloy Workflow Status). Requires SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID, SHAREPOINT_CLIENT_SECRET, and SHAREPOINT_TENANT_URL.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "salesforce_streaming_enabled",
    name: "Salesforce — Streaming API",
    description: "Enables Salesforce real-time streaming via PushTopic and Change Data Capture (CDC) for instant signal ingestion without polling.",
    isEnabled: false,
    rolloutPercentage: 0,
  },
  {
    key: "jira_sync_enabled",
    name: "Jira — Bidirectional Sync",
    description: "Enables Jira Cloud bidirectional sync: ingests sprint burndown risk, blocked issues, and SLA breaches as Lyte signals; auto-creates Jira issues from Vessels exceptions and Aegis incidents.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "power_automate_webhook_enabled",
    name: "Microsoft — Power Automate Webhook",
    description: "Enables the Power Automate webhook endpoint that allows Power Automate flows to trigger Alloy workflows or push signals into Lyte. Supports HMAC signature validation via POWER_AUTOMATE_WEBHOOK_SECRET.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
  {
    key: "jira_webhook_enabled",
    name: "Jira — Webhook Integration",
    description: "Enables Jira webhook listener for issue lifecycle events (created, updated, transitioned). Events are routed through Alloy for cross-tool workflow orchestration.",
    isEnabled: true,
    rolloutPercentage: 100,
  },
] as const;

export type PlatformFlagKey = typeof PLATFORM_FLAGS[number]["key"];

export interface FlagEvaluationContext {
  userId?: number;
  orgId?: number;
  roles?: string[];
}

export interface FlagEvaluationResult {
  key: string;
  enabled: boolean;
  source: "override" | "rollout" | "global" | "default";
  rolloutPercentage?: number;
}

function computeRolloutBucket(key: string, entityId: number | string): number {
  const combined = `${key}:${entityId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 100;
}

export async function evaluateFlag(key: string, ctx: FlagEvaluationContext = {}): Promise<FlagEvaluationResult> {
  try {
    const [flag] = await db
      .select()
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, key))
      .limit(1);

    if (!flag) {
      return { key, enabled: false, source: "default" };
    }

    if (!flag.isEnabled) {
      return { key, enabled: false, source: "global", rolloutPercentage: flag.rolloutPercentage };
    }

    if (ctx.userId !== undefined) {
      const [userOverride] = await db
        .select()
        .from(featureFlagOverridesTable)
        .where(
          and(
            eq(featureFlagOverridesTable.flagId, flag.id),
            eq(featureFlagOverridesTable.entityType, "user"),
            eq(featureFlagOverridesTable.entityId, String(ctx.userId)),
          )
        )
        .limit(1);

      if (userOverride) {
        return { key, enabled: userOverride.isEnabled, source: "override" };
      }
    }

    if (ctx.orgId !== undefined) {
      const [orgOverride] = await db
        .select()
        .from(featureFlagOverridesTable)
        .where(
          and(
            eq(featureFlagOverridesTable.flagId, flag.id),
            eq(featureFlagOverridesTable.entityType, "org"),
            eq(featureFlagOverridesTable.entityId, String(ctx.orgId)),
          )
        )
        .limit(1);

      if (orgOverride) {
        return { key, enabled: orgOverride.isEnabled, source: "override" };
      }
    }

    if (ctx.roles && ctx.roles.length > 0) {
      for (const role of ctx.roles) {
        const [roleOverride] = await db
          .select()
          .from(featureFlagOverridesTable)
          .where(
            and(
              eq(featureFlagOverridesTable.flagId, flag.id),
              eq(featureFlagOverridesTable.entityType, "role"),
              eq(featureFlagOverridesTable.entityId, role),
            )
          )
          .limit(1);

        if (roleOverride) {
          return { key, enabled: roleOverride.isEnabled, source: "override" };
        }
      }
    }

    if (flag.rolloutPercentage < 100) {
      const bucketId = ctx.userId ?? ctx.orgId ?? 0;
      const bucket = computeRolloutBucket(key, bucketId);
      const enabled = bucket < flag.rolloutPercentage;
      return { key, enabled, source: "rollout", rolloutPercentage: flag.rolloutPercentage };
    }

    return { key, enabled: true, source: "global", rolloutPercentage: flag.rolloutPercentage };
  } catch (err) {
    logger.warn({ err, key }, "Feature flag evaluation failed — defaulting to disabled");
    return { key, enabled: false, source: "default" };
  }
}

export async function evaluateFlags(keys: string[], ctx: FlagEvaluationContext = {}): Promise<Record<string, FlagEvaluationResult>> {
  const results = await Promise.all(keys.map(key => evaluateFlag(key, ctx)));
  return Object.fromEntries(results.map(r => [r.key, r]));
}

export async function isFlagEnabled(key: string, ctx: FlagEvaluationContext = {}): Promise<boolean> {
  const result = await evaluateFlag(key, ctx);
  return result.enabled;
}

export async function ensurePlatformFlags(): Promise<void> {
  try {
    for (const flag of PLATFORM_FLAGS) {
      await db
        .insert(featureFlagsTable)
        .values({
          key: flag.key,
          name: flag.name,
          description: flag.description,
          isEnabled: flag.isEnabled,
          rolloutPercentage: flag.rolloutPercentage,
        })
        .onConflictDoNothing();
    }
    logger.info({ count: PLATFORM_FLAGS.length }, "Platform feature flags ensured");
  } catch (err) {
    logger.warn({ err }, "Failed to ensure platform feature flags — flags may be missing from DB");
  }
}
