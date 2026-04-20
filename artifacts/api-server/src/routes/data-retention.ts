import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { db, pool } from "@szl-holdings/db";
import { dataRetentionPoliciesTable, dataRetentionAuditLogTable } from "@szl-holdings/db";
import { authMiddleware, requireRole, type AuthenticatedUser } from "../middlewares/auth";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";
import { z } from "zod";
import { eq, desc, and, inArray, isNull } from "drizzle-orm";
import { logger } from "../lib/logger";
import { durableJobQueue, durableScheduler } from "../lib/durable-init";
import { PLATFORM_JOB_TYPES } from "../lib/platform-jobs";

const router: IRouter = Router();

router.use("/data-retention", authMiddleware());
router.use("/data-retention", requireRole("admin"));

type PiiColumnMap = Record<string, string> | null;

const PURGEABLE_TABLES: Array<{ name: string; label: string; description: string; defaultRetentionDays: number; hasTenantColumn: boolean; piiColumns: PiiColumnMap }> = [
  { name: "audit_events", label: "Audit Events", description: "System audit log entries", defaultRetentionDays: 365, hasTenantColumn: true, piiColumns: null },
  { name: "activity_log", label: "Activity Log", description: "User activity records", defaultRetentionDays: 180, hasTenantColumn: true, piiColumns: null },
  { name: "usage_events", label: "Usage Events", description: "Feature usage telemetry", defaultRetentionDays: 90, hasTenantColumn: true, piiColumns: null },
  { name: "connector_logs", label: "Connector Logs", description: "Integration connector logs", defaultRetentionDays: 60, hasTenantColumn: false, piiColumns: null },
  { name: "webhook_events", label: "Webhook Events", description: "Outbound webhook delivery records", defaultRetentionDays: 90, hasTenantColumn: true, piiColumns: null },
  { name: "sessions", label: "Sessions", description: "User session records", defaultRetentionDays: 30, hasTenantColumn: false, piiColumns: null },
  { name: "notifications", label: "Notifications", description: "User notification history", defaultRetentionDays: 90, hasTenantColumn: false, piiColumns: null },
  { name: "platform_contact_requests", label: "Contact Requests", description: "Public contact form submissions", defaultRetentionDays: 730, hasTenantColumn: false, piiColumns: { email: "redacted@purged.invalid", name: "Purged User" } },
  { name: "support_tickets", label: "Support Tickets", description: "Customer support ticket history", defaultRetentionDays: 1825, hasTenantColumn: true, piiColumns: { submitter_email: "redacted@purged.invalid", submitter_name: "Purged User" } },
];

function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.roles.includes("super_admin");
}

function callerOrgIds(user: AuthenticatedUser): number[] {
  return user.orgs.map((o) => o.orgId);
}

const upsertPolicySchema = z.object({
  orgId: z.number().int().positive().nullable().optional(),
  tableName: z.string().min(1),
  retentionDays: z.number().int().min(1).max(36500),
  purgeStrategy: z.enum(["delete", "anonymize", "archive"]).default("delete"),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional(),
});

router.get("/data-retention/tables", (_req: Request, res: Response) => {
  res.json({ tables: PURGEABLE_TABLES });
});

router.get("/data-retention/policies", validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { orgId } = req.query as { orgId?: string };

    const filterParts: ReturnType<typeof eq>[] = [];

    if (orgId) {
      const orgIdNum = parseInt(orgId);
      if (isNaN(orgIdNum)) {
        res.status(400).json({ error: "Invalid orgId" });
        return;
      }
      if (!isSuperAdmin(user) && !user.orgs.some((o) => o.orgId === orgIdNum)) {
        res.status(403).json({ error: "Access denied to this organization's policies" });
        return;
      }
      filterParts.push(eq(dataRetentionPoliciesTable.orgId, orgIdNum));
    } else if (!isSuperAdmin(user)) {
      const orgIds = callerOrgIds(user);
      if (orgIds.length === 0) {
        res.json({ policies: [] });
        return;
      }
      filterParts.push(inArray(dataRetentionPoliciesTable.orgId, orgIds));
    }

    const policies = await db
      .select()
      .from(dataRetentionPoliciesTable)
      .where(filterParts.length > 0 ? and(...filterParts) : undefined)
      .orderBy(dataRetentionPoliciesTable.tableName);

    res.json({ policies });
  } catch (err) {
    logger.error({ err }, "Failed to fetch retention policies");
    res.status(500).json({ error: "Failed to fetch policies" });
  }
});

router.put("/data-retention/policies", validateBody(upsertPolicySchema), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { orgId, tableName, retentionDays, purgeStrategy, isActive, description } = req.body as z.infer<typeof upsertPolicySchema>;

    const validTable = PURGEABLE_TABLES.find((t) => t.name === tableName);
    if (!validTable) {
      res.status(400).json({ error: "Invalid table name" });
      return;
    }

    if (orgId == null && !isSuperAdmin(user)) {
      res.status(403).json({ error: "Only super admins can create global retention policies" });
      return;
    }

    if (orgId != null && !isSuperAdmin(user) && !user.orgs.some((o) => o.orgId === orgId)) {
      res.status(403).json({ error: "Access denied to this organization" });
      return;
    }

    const whereClause = orgId != null
      ? and(eq(dataRetentionPoliciesTable.tableName, tableName), eq(dataRetentionPoliciesTable.orgId, orgId))
      : and(eq(dataRetentionPoliciesTable.tableName, tableName), isNull(dataRetentionPoliciesTable.orgId));

    const [existing] = await db
      .select()
      .from(dataRetentionPoliciesTable)
      .where(whereClause)
      .limit(1);

    let policy: typeof dataRetentionPoliciesTable.$inferSelect;
    let action: "policy_created" | "policy_updated";

    if (existing) {
      const [updated] = await db
        .update(dataRetentionPoliciesTable)
        .set({ retentionDays, purgeStrategy, isActive, description, updatedBy: user.id, updatedAt: new Date() })
        .where(eq(dataRetentionPoliciesTable.id, existing.id))
        .returning();
      policy = updated!;
      action = "policy_updated";
    } else {
      const [created] = await db
        .insert(dataRetentionPoliciesTable)
        .values({ orgId: orgId ?? null, tableName, retentionDays, purgeStrategy, isActive, description, createdBy: user.id, updatedBy: user.id })
        .returning();
      policy = created!;
      action = "policy_created";
    }

    await db.insert(dataRetentionAuditLogTable).values({
      policyId: policy.id,
      orgId: policy.orgId ?? null,
      tableName,
      action,
      actorId: user.id,
      actorName: user.displayName ?? user.email,
      details: { retentionDays, purgeStrategy, isActive },
      status: "success",
    });

    res.json({ policy });
  } catch (err) {
    logger.error({ err }, "Failed to upsert retention policy");
    res.status(500).json({ error: "Failed to save policy" });
  }
});

router.post("/data-retention/policies/:policyId/run", validateBody(bodyShape({})), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const policyId = parseInt(req.params["policyId"] as string);

    if (isNaN(policyId)) {
      res.status(400).json({ error: "Invalid policy ID" });
      return;
    }

    const [policy] = await db
      .select()
      .from(dataRetentionPoliciesTable)
      .where(eq(dataRetentionPoliciesTable.id, policyId))
      .limit(1);

    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }

    if (policy.orgId != null) {
      if (!isSuperAdmin(user) && !user.orgs.some((o) => o.orgId === policy.orgId)) {
        res.status(403).json({ error: "Access denied: policy belongs to a different organization" });
        return;
      }
    } else if (!isSuperAdmin(user)) {
      res.status(403).json({ error: "Only super admins can run global retention policies" });
      return;
    }

    const validTable = PURGEABLE_TABLES.find((t) => t.name === policy.tableName);
    if (!validTable) {
      res.status(400).json({ error: "Invalid table name in policy" });
      return;
    }

    if (!policy.isActive) {
      res.status(400).json({ error: "Policy is not active" });
      return;
    }

    await db.insert(dataRetentionAuditLogTable).values({
      policyId: policy.id,
      orgId: policy.orgId ?? null,
      tableName: policy.tableName,
      action: "purge_started",
      actorId: user.id,
      actorName: user.displayName ?? user.email,
      details: { retentionDays: policy.retentionDays, purgeStrategy: policy.purgeStrategy, orgId: policy.orgId, triggeredBy: "manual_trigger" },
      status: "success",
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    let affectedRows = 0;
    let errorMessage: string | null = null;
    let status: "success" | "failure" = "success";

    try {
      const hasTenantCol = validTable.hasTenantColumn && policy.orgId != null;
      const tenantFilter = hasTenantCol ? ` AND org_id = $2` : "";
      const params: (string | number)[] = [cutoffDate.toISOString()];
      if (hasTenantCol && policy.orgId != null) params.push(policy.orgId);

      if (policy.purgeStrategy === "delete") {
        const result = await pool.query(
          `DELETE FROM "${policy.tableName}" WHERE created_at < $1${tenantFilter}`,
          params
        );
        affectedRows = result.rowCount ?? 0;
      } else if (policy.purgeStrategy === "anonymize") {
        const piiColumns = validTable.piiColumns;
        if (!piiColumns || Object.keys(piiColumns).length === 0) {
          const countResult = await pool.query(
            `SELECT COUNT(*)::int AS cnt FROM "${policy.tableName}" WHERE created_at < $1${tenantFilter}`,
            params
          );
          affectedRows = countResult.rows[0]?.cnt ?? 0;
          logger.warn({ tableName: policy.tableName, policyId: policy.id }, "Anonymize strategy: no PII columns defined for this table — skipping data modification");
        } else {
          const setClauses = Object.entries(piiColumns).map(([col, val]) => `"${col}" = '${val}'`).join(", ");
          const whereExtra = Object.keys(piiColumns).map((col) => `"${col}" IS NOT NULL`).join(" OR ");
          const result = await pool.query(
            `UPDATE "${policy.tableName}" SET ${setClauses} WHERE created_at < $1${tenantFilter} AND (${whereExtra})`,
            params
          );
          affectedRows = result.rowCount ?? 0;
        }
      } else if (policy.purgeStrategy === "archive") {
        const countResult = await pool.query(
          `SELECT COUNT(*)::int AS cnt FROM "${policy.tableName}" WHERE created_at < $1${tenantFilter}`,
          params
        );
        affectedRows = countResult.rows[0]?.cnt ?? 0;
        logger.info({ tableName: policy.tableName, policyId: policy.id, affectedRows }, "Archive strategy: rows identified for archival. External archival pipeline required before deletion.");
      }
    } catch (purgeErr: unknown) {
      errorMessage = purgeErr instanceof Error ? purgeErr.message : "Purge execution failed";
      status = "failure";
      logger.error({ err: purgeErr, tableName: policy.tableName, policyId: policy.id }, "Retention purge failed");
    }

    await db.update(dataRetentionPoliciesTable)
      .set({ lastRunAt: new Date(), updatedAt: new Date() })
      .where(eq(dataRetentionPoliciesTable.id, policy.id));

    await db.insert(dataRetentionAuditLogTable).values({
      policyId: policy.id,
      orgId: policy.orgId ?? null,
      tableName: policy.tableName,
      action: status === "success" ? "purge_completed" : "purge_failed",
      actorId: user.id,
      actorName: user.displayName ?? user.email,
      affectedRows,
      details: {
        retentionDays: policy.retentionDays,
        purgeStrategy: policy.purgeStrategy,
        orgId: policy.orgId,
        cutoffDate: cutoffDate.toISOString(),
      },
      status,
      errorMessage,
    });

    res.json({ success: status === "success", affectedRows, status, errorMessage, tableName: policy.tableName });
  } catch (err) {
    logger.error({ err }, "Failed to run retention purge");
    res.status(500).json({ error: "Failed to run purge" });
  }
});

router.get("/data-retention/audit-log", validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { tableName, orgId, limit = "50" } = req.query as { tableName?: string; orgId?: string; limit?: string };

    const filterParts: ReturnType<typeof eq>[] = [];

    if (orgId) {
      const orgIdNum = parseInt(orgId);
      if (isNaN(orgIdNum)) {
        res.status(400).json({ error: "Invalid orgId" });
        return;
      }
      if (!isSuperAdmin(user) && !user.orgs.some((o) => o.orgId === orgIdNum)) {
        res.status(403).json({ error: "Access denied to this organization's audit log" });
        return;
      }
      filterParts.push(eq(dataRetentionAuditLogTable.orgId, orgIdNum));
    } else if (!isSuperAdmin(user)) {
      const orgIds = callerOrgIds(user);
      if (orgIds.length === 0) {
        res.json({ entries: [] });
        return;
      }
      filterParts.push(inArray(dataRetentionAuditLogTable.orgId, orgIds));
    }

    if (tableName) {
      filterParts.push(eq(dataRetentionAuditLogTable.tableName, tableName));
    }

    const entries = await db
      .select()
      .from(dataRetentionAuditLogTable)
      .where(filterParts.length > 0 ? and(...filterParts) : undefined)
      .orderBy(desc(dataRetentionAuditLogTable.executedAt))
      .limit(Math.min(parseInt(limit), 200));

    res.json({ entries });
  } catch (err) {
    logger.error({ err }, "Failed to fetch retention audit log");
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

router.get("/data-retention/sweep-status", async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const superAdmin = isSuperAdmin(user);

    let scheduleInfo: { name: string; cronExpression: string; enabled: boolean; lastRunAt: string | null; nextRunAt: string | null } | null = null;
    try {
      const schedules = await durableScheduler.getSchedules();
      const sweepSchedule = schedules.find((s: { name: string }) => s.name === "data_retention_sweep_weekly") as any;
      if (sweepSchedule) {
        scheduleInfo = {
          name: sweepSchedule.name,
          cronExpression: sweepSchedule.cronExpression ?? "0 2 * * 0",
          enabled: sweepSchedule.enabled ?? true,
          lastRunAt: sweepSchedule.lastRunAt ?? null,
          nextRunAt: sweepSchedule.nextRunAt ?? null,
        };
      }
    } catch (schedErr) {
      logger.warn({ schedErr }, "data-retention: failed to fetch schedule info (non-fatal)");
    }

    const lastSweepEntry = await db
      .select()
      .from(dataRetentionAuditLogTable)
      .where(eq(dataRetentionAuditLogTable.actorName, "Scheduler"))
      .orderBy(desc(dataRetentionAuditLogTable.executedAt))
      .limit(1);

    const policyFilter = superAdmin
      ? eq(dataRetentionPoliciesTable.isActive, true)
      : (() => {
          const orgIds = callerOrgIds(user);
          return orgIds.length > 0
            ? and(eq(dataRetentionPoliciesTable.isActive, true), inArray(dataRetentionPoliciesTable.orgId, orgIds))
            : eq(dataRetentionPoliciesTable.isActive, false);
        })();

    const activePolicies = await db
      .select()
      .from(dataRetentionPoliciesTable)
      .where(policyFilter);

    res.json({
      schedule: scheduleInfo,
      lastSweepAt: lastSweepEntry[0]?.executedAt ?? null,
      activePolicies: activePolicies.length,
      canTriggerSweep: superAdmin,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch retention sweep status");
    res.status(500).json({ error: "Failed to fetch sweep status" });
  }
});

router.post("/data-retention/sweep", validateBody(bodyShape({})), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    if (!user.roles.includes("super_admin")) {
      res.status(403).json({ error: "Only super admins can trigger the global data retention sweep" });
      return;
    }

    const job = await durableJobQueue.enqueue(PLATFORM_JOB_TYPES.DATA_RETENTION_SWEEP, {
      triggeredBy: "manual",
      triggeredByUserId: user.id,
    });

    logger.info({ jobId: job.id, actorId: user.id, actorName: user.displayName ?? user.email }, "Manual data retention sweep triggered");

    res.json({ success: true, jobId: job.id, message: "Retention sweep enqueued — all active policies will be processed." });
  } catch (err) {
    logger.error({ err }, "Failed to trigger retention sweep");
    res.status(500).json({ error: "Failed to trigger sweep" });
  }
});

export default router;
