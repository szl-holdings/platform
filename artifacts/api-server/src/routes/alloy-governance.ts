import { bodyShape } from '@szl-holdings/contracts/common';
import {
  alloyAuditLogTable,
  alloyGovernanceIncidentsTable,
  alloyPoliciesTable,
  alloyUsageEventsTable,
  alloyWorkflowRunsTable,
  db,
  insertAlloyGovernanceIncidentSchema,
  insertAlloyPolicySchema,
  insertAlloyUsageEventSchema,
} from '@szl-holdings/db';
import { and, count, desc, eq, gte, isNull, sql, sum } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendCreated,
  sendForbidden,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import {
  type AuthenticatedUser,
  authMiddleware,
  canAccessOrgRecord,
  isElevatedUser,
  requireRole,
} from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const updatePolicySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['draft', 'active', 'archived', 'suspended']).optional(),
  rules: z.record(z.unknown()).optional(),
});

const router: IRouter = Router();

// Defense-in-depth: this router is mounted under /alloy and /governance in
// routes/groups/alloy.ts which already apply tenantScope({ required: true }),
// but we keep an explicit gate here so the file cannot silently regress to
// no-org access if it is ever re-mounted under a different prefix.
router.use(tenantScope({ required: true }));

function getUserOrgIds(user?: AuthenticatedUser): number[] {
  if (!user) return [];
  return user.orgs.map((o) => o.orgId);
}

function isGlobalAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes('super_admin') || user.roles.includes('admin');
}

function canWriteForOrg(
  user: AuthenticatedUser | undefined,
  orgId: number | null | undefined,
): boolean {
  if (!user) return false;
  if (isGlobalAdmin(user)) return true;
  if (orgId == null) return false;
  return getUserOrgIds(user).includes(orgId);
}

async function writeAudit(params: {
  orgId?: number | null;
  userId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await db.insert(alloyAuditLogTable).values({
      orgId: params.orgId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      before: (params.before as Record<string, unknown>) ?? null,
      after: (params.after as Record<string, unknown>) ?? null,
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to write audit log for governance action');
  }
}

// ─── Policy CRUD ────────────────────────────────────────────────────────────

router.get(
  '/alloy/policies',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      const orgIds = getUserOrgIds(user);
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

      const kindFilter = req.query.kind as string | undefined;
      const statusFilter = req.query.status as string | undefined;

      // Build WHERE clause that filters at DB level for org scope
      const whereClauses = [];
      if (!isGlobalAdmin(user)) {
        if (orgIds.length > 0) {
          // Visible: org-scoped policies for caller's orgs OR global compliance templates
          whereClauses.push(
            sql`("platform_alloy_policies"."org_id" IN (${sql.join(
              orgIds.map((id) => sql`${id}`),
              sql`, `,
            )}) OR ("platform_alloy_policies"."org_id" IS NULL AND "platform_alloy_policies"."kind" = 'compliance_template'))`,
          );
        } else {
          // No org memberships: only global compliance templates visible
          whereClauses.push(
            and(
              isNull(alloyPoliciesTable.orgId),
              eq(alloyPoliciesTable.kind, 'compliance_template'),
            ),
          );
        }
      }
      if (kindFilter)
        whereClauses.push(
          eq(
            alloyPoliciesTable.kind,
            kindFilter as
              | 'approval_matrix'
              | 'model_routing'
              | 'cost_control'
              | 'agent_permission'
              | 'compliance_template',
          ),
        );
      if (statusFilter)
        whereClauses.push(
          eq(alloyPoliciesTable.status, statusFilter as 'active' | 'draft' | 'archived'),
        );

      const visible = await db
        .select()
        .from(alloyPoliciesTable)
        .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
        .orderBy(desc(alloyPoliciesTable.updatedAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, visible);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch policies');
    }
  },
);

router.get('/alloy/policies/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id as string));
    if (isNaN(id)) return sendBadRequest(res, 'Invalid policy ID');
    const user = req.user as AuthenticatedUser | undefined;

    const [policy] = await db
      .select()
      .from(alloyPoliciesTable)
      .where(eq(alloyPoliciesTable.id, id))
      .limit(1);

    if (!policy) return sendNotFound(res, 'Policy not found');

    if (!isGlobalAdmin(user)) {
      if (policy.orgId !== null && !getUserOrgIds(user).includes(policy.orgId)) {
        return sendNotFound(res, 'Policy not found');
      }
      if (policy.orgId === null && policy.kind !== 'compliance_template') {
        return sendNotFound(res, 'Policy not found');
      }
    }

    sendSuccess(res, policy);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch policy');
  }
});

router.post(
  '/alloy/policies',
  authMiddleware(),
  requireRole('admin'),
  validateBody(
    bodyShape({
      orgId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const parsed = insertAlloyPolicySchema.safeParse({
        ...req.body,
        createdBy: user.id,
      });
      if (!parsed.success) return sendBadRequest(res, parsed.error.message);

      const data = parsed.data;

      // Global policies (orgId null) are only creatable by global admins
      if (data.orgId == null && !isGlobalAdmin(user)) {
        return sendForbidden(res, 'Only platform admins can create global policies');
      }

      // Org-scoped policies: admin must also be a member of that org (unless global admin)
      if (data.orgId != null && !canWriteForOrg(user, data.orgId)) {
        return sendForbidden(res, 'Cannot create policy for an org you do not belong to');
      }

      const [created] = await db.insert(alloyPoliciesTable).values(data).returning();

      await writeAudit({
        orgId: data.orgId,
        userId: user.id,
        action: 'create',
        resourceType: 'alloy_policy',
        resourceId: String(created.id),
        after: created,
      });

      sendCreated(res, created);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create policy');
    }
  },
);

router.patch(
  '/alloy/policies/:id',
  authMiddleware(),
  requireRole('admin'),
  validateBody(updatePolicySchema),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id as string));
      if (isNaN(id)) return sendBadRequest(res, 'Invalid policy ID');
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const [existing] = await db
        .select()
        .from(alloyPoliciesTable)
        .where(eq(alloyPoliciesTable.id, id))
        .limit(1);

      if (!existing) return sendNotFound(res, 'Policy not found');

      // Admin must own the org or be global admin
      if (!canWriteForOrg(user, existing.orgId)) {
        return sendForbidden(res, 'Cannot modify a policy belonging to another org');
      }

      const body = req.body as z.infer<typeof updatePolicySchema>;
      const updates: Partial<typeof alloyPoliciesTable.$inferInsert> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.status !== undefined) updates.status = body.status as any;
      if (body.rules !== undefined) updates.rules = body.rules as Record<string, unknown>;
      updates.updatedAt = new Date();

      const [updated] = await db
        .update(alloyPoliciesTable)
        .set(updates)
        .where(eq(alloyPoliciesTable.id, id))
        .returning();

      await writeAudit({
        orgId: existing.orgId,
        userId: user.id,
        action: 'update',
        resourceType: 'alloy_policy',
        resourceId: String(id),
        before: existing,
        after: updated,
      });

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update policy');
    }
  },
);

router.delete(
  '/alloy/policies/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  requireRole('admin'),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id as string));
      if (isNaN(id)) return sendBadRequest(res, 'Invalid policy ID');
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const [existing] = await db
        .select()
        .from(alloyPoliciesTable)
        .where(eq(alloyPoliciesTable.id, id))
        .limit(1);

      if (!existing) return sendNotFound(res, 'Policy not found');

      // Enforce org-ownership: non-global-admins cannot archive cross-tenant policies
      if (!canWriteForOrg(user, existing.orgId)) {
        return sendForbidden(res, 'Cannot archive a policy belonging to another org');
      }

      await db
        .update(alloyPoliciesTable)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(eq(alloyPoliciesTable.id, id));

      await writeAudit({
        orgId: existing.orgId,
        userId: user.id,
        action: 'archive',
        resourceType: 'alloy_policy',
        resourceId: String(id),
        before: existing,
      });

      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to archive policy');
    }
  },
);

// Apply a compliance template to a tenant (clone it with orgId set)
router.post(
  '/alloy/policies/:id/apply',
  authMiddleware(),
  requireRole('admin'),
  validateBody(
    bodyShape({
      orgId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id as string));
      if (isNaN(id)) return sendBadRequest(res, 'Invalid template policy ID');
      const orgId = parseInt(req.body.orgId);
      if (isNaN(orgId)) return sendBadRequest(res, 'orgId is required');
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      // Caller must belong to the target org or be a global admin
      if (!canWriteForOrg(user, orgId)) {
        return sendForbidden(res, 'Cannot apply template to an org you do not belong to');
      }

      const [template] = await db
        .select()
        .from(alloyPoliciesTable)
        .where(
          and(eq(alloyPoliciesTable.id, id), eq(alloyPoliciesTable.kind, 'compliance_template')),
        )
        .limit(1);

      if (!template) return sendNotFound(res, 'Compliance template not found');

      const [applied] = await db
        .insert(alloyPoliciesTable)
        .values({
          orgId,
          name: template.name,
          slug: `${template.slug}-applied-${Date.now()}`,
          kind: 'compliance_template',
          status: 'active',
          rules: template.rules as Record<string, unknown>,
          description: template.description,
          createdBy: user.id,
        })
        .returning();

      await writeAudit({
        orgId,
        userId: user.id,
        action: 'apply_template',
        resourceType: 'alloy_policy',
        resourceId: String(applied.id),
        after: { templateId: id, appliedPolicy: applied },
      });

      sendCreated(res, applied);
    } catch (err) {
      handleRouteError(res, err, 'Failed to apply compliance template');
    }
  },
);

// ─── Governance Incidents ────────────────────────────────────────────────────

router.get(
  '/alloy/governance/incidents',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      const orgIds = getUserOrgIds(user);
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const unresolvedOnly = req.query.unresolved === 'true';

      const incidentWhere = [];
      if (!isGlobalAdmin(user)) {
        if (orgIds.length > 0) {
          incidentWhere.push(
            sql`"platform_governance_incidents"."org_id" IN (${sql.join(
              orgIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          );
        } else {
          // No org memberships — return empty
          return sendSuccess(res, []);
        }
      }
      if (unresolvedOnly) incidentWhere.push(isNull(alloyGovernanceIncidentsTable.resolvedAt));

      const visible = await db
        .select()
        .from(alloyGovernanceIncidentsTable)
        .where(incidentWhere.length > 0 ? and(...incidentWhere) : undefined)
        .orderBy(desc(alloyGovernanceIncidentsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, visible);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch governance incidents');
    }
  },
);

router.post(
  '/alloy/governance/incidents',
  authMiddleware(),
  validateBody(
    bodyShape({
      orgId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const parsed = insertAlloyGovernanceIncidentSchema.safeParse(req.body);
      if (!parsed.success) return sendBadRequest(res, parsed.error.message);

      // Caller must belong to the org they're filing an incident against
      if (!canWriteForOrg(user, parsed.data.orgId)) {
        return sendForbidden(res, 'Cannot create incident for an org you do not belong to');
      }

      const [incident] = await db
        .insert(alloyGovernanceIncidentsTable)
        .values(parsed.data)
        .returning();

      await writeAudit({
        orgId: parsed.data.orgId,
        userId: user.id,
        action: 'create',
        resourceType: 'governance_incident',
        resourceId: String(incident.id),
        after: incident,
      });

      sendCreated(res, incident);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create governance incident');
    }
  },
);

router.patch(
  '/alloy/governance/incidents/:id/resolve',
  authMiddleware(),
  validateBody(
    bodyShape({
      resolution: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseInt(String(req.params.id as string));
      if (isNaN(id)) return sendBadRequest(res, 'Invalid incident ID');
      const user = req.user as AuthenticatedUser | undefined;
      if (!user) return sendForbidden(res, 'Authentication required');

      const [existing] = await db
        .select()
        .from(alloyGovernanceIncidentsTable)
        .where(eq(alloyGovernanceIncidentsTable.id, id))
        .limit(1);

      if (!existing) return sendNotFound(res, 'Incident not found');
      if (!canWriteForOrg(user, existing.orgId)) {
        return sendNotFound(res, 'Incident not found');
      }

      const [resolved] = await db
        .update(alloyGovernanceIncidentsTable)
        .set({
          resolution: req.body.resolution ?? 'Resolved',
          resolvedBy: user.id,
          resolvedAt: new Date(),
        })
        .where(eq(alloyGovernanceIncidentsTable.id, id))
        .returning();

      sendSuccess(res, resolved);
    } catch (err) {
      handleRouteError(res, err, 'Failed to resolve incident');
    }
  },
);

// ─── Policy Enforcement Hook ─────────────────────────────────────────────────
// Called by Nuro Mesh / workflow execution to check if a run is allowed

router.post(
  '/alloy/governance/enforce',
  authMiddleware(),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      agentId: z.unknown().optional(),
      callerRoles: z.unknown().optional(),
      callerUserId: z.unknown().optional(),
      estimatedCostCents: z.unknown().optional(),
      model: z.unknown().optional(),
      orgId: z.unknown().optional(),
      workflowRunId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      const {
        orgId,
        action,
        model,
        agentId,
        estimatedCostCents,
        workflowRunId,
        callerUserId,
        callerRoles,
      } = req.body;
      if (!orgId || !action) return sendBadRequest(res, 'orgId and action are required');

      // When called via internal token the service principal is a super_admin.
      // Use caller-provided subject context (userId + roles) for permission decisions
      // so we evaluate the actual end-user's access, not the service identity.
      const subjectRoles: string[] =
        req.isInternalAgent && Array.isArray(callerRoles)
          ? (callerRoles as string[])
          : (user?.roles ?? []);

      // Caller must belong to the org they're enforcing for (or be a global admin / internal agent)
      if (!req.isInternalAgent && !canWriteForOrg(user, orgId)) {
        return sendForbidden(res, 'Cannot enforce policies for an org you do not belong to');
      }

      const activePolicies = await db
        .select()
        .from(alloyPoliciesTable)
        .where(and(eq(alloyPoliciesTable.orgId, orgId), eq(alloyPoliciesTable.status, 'active')));

      const violations: Array<{ policyId: number; policyName: string; reason: string }> = [];
      let requiresApproval = false;
      let approvalLevel: string | null = null;

      let hardBlocked = false;
      let hardBlockReason: string | null = null;

      for (const policy of activePolicies) {
        const rules = policy.rules as Record<string, unknown>;

        // Cost-control: check current MTD spend and enforce hard stop at 100% budget
        if (policy.kind === 'cost_control') {
          const budgetUsd = (rules.monthlyBudgetUsd as number | undefined) ?? 500;
          const hardStopPct = (rules.hardStopPct as number | undefined) ?? 100;
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const [usageResult] = await db
            .select({ total: sum(alloyUsageEventsTable.costCents) })
            .from(alloyUsageEventsTable)
            .where(
              and(
                eq(alloyUsageEventsTable.orgId, orgId),
                gte(alloyUsageEventsTable.createdAt, monthStart),
              ),
            );
          const totalUsd = Number(usageResult?.total ?? 0) / 100;
          const pct = (totalUsd / budgetUsd) * 100;
          if (pct >= hardStopPct) {
            hardBlocked = true;
            hardBlockReason = `Hard stop: Org #${orgId} has exhausted ${Math.round(pct)}% of monthly budget ($${totalUsd.toFixed(2)} / $${budgetUsd}). Policy: "${policy.name}".`;
            violations.push({
              policyId: policy.id,
              policyName: policy.name,
              reason: hardBlockReason,
            });
            await db
              .insert(alloyGovernanceIncidentsTable)
              .values({
                orgId,
                policyId: policy.id,
                workflowRunId: workflowRunId ?? null,
                severity: 'critical',
                type: 'cost_threshold',
                description: hardBlockReason,
                metadata: { pct, totalUsd, budgetUsd, hardStopPct, action },
              })
              .catch(() => {});
          }
        }

        if (policy.kind === 'model_routing' && model) {
          const blocked = (rules.blockedModels as string[] | undefined) ?? [];
          const allowed = (rules.allowedModels as string[] | undefined) ?? [];
          // Enforce allowlist: if allowedModels is non-empty and model is not in it, deny
          const blockedByAllowlist = allowed.length > 0 && !allowed.includes(model);
          if (blocked.includes(model) || blockedByAllowlist) {
            const reason = blocked.includes(model)
              ? `Model ${model} is explicitly blocked by policy "${policy.name}"`
              : `Model ${model} is not in the allowedModels list for policy "${policy.name}" (allowed: ${allowed.join(', ')})`;
            violations.push({ policyId: policy.id, policyName: policy.name, reason });
            await db
              .insert(alloyGovernanceIncidentsTable)
              .values({
                orgId,
                policyId: policy.id,
                workflowRunId: workflowRunId ?? null,
                severity: 'high',
                type: 'model_blocked',
                description: `${reason}. Action: "${action}", Org: ${orgId}.`,
                metadata: {
                  action,
                  model,
                  agentId,
                  blockedByAllowlist,
                  allowedModels: allowed,
                  blockedModels: blocked,
                },
              })
              .catch(() => {});
          }
          const ceiling = rules.costCeilingPerCall as number | undefined;
          if (ceiling && estimatedCostCents && estimatedCostCents / 100 > ceiling) {
            violations.push({
              policyId: policy.id,
              policyName: policy.name,
              reason: `Estimated cost $${(estimatedCostCents / 100).toFixed(2)} exceeds ceiling $${ceiling}`,
            });
          }
        }

        if (policy.kind === 'approval_matrix') {
          const trigger = rules.trigger as string | undefined;
          if (trigger === action || trigger === '*') {
            requiresApproval = true;
            approvalLevel = (rules.requiredApprovalLevel as string | undefined) ?? 'manager';
          }
        }

        if (policy.kind === 'agent_permission' && agentId) {
          const restricted = (rules.restrictedAgents as string[] | undefined) ?? [];
          if (restricted.includes(agentId)) {
            const allowedRoles = (rules.allowedRoles as string[] | undefined) ?? [];
            // Use subjectRoles (caller's actual role claims) for permission check,
            // NOT the service principal role which is always super_admin when called internally
            const hasAccess = allowedRoles.some((r) => subjectRoles.includes(r));
            if (!hasAccess) {
              violations.push({
                policyId: policy.id,
                policyName: policy.name,
                reason: `Agent ${agentId} requires roles: ${allowedRoles.join(', ')}`,
              });
              await db
                .insert(alloyGovernanceIncidentsTable)
                .values({
                  orgId,
                  policyId: policy.id,
                  workflowRunId: workflowRunId ?? null,
                  severity: 'low',
                  type: 'user_override',
                  description: `Unauthorized agent access attempt: agent "${agentId}" requires role [${allowedRoles.join(', ')}]. Subject roles: [${subjectRoles.join(', ')}]. Org: ${orgId}.`,
                  metadata: { action, agentId, subjectRoles, callerUserId: callerUserId ?? null },
                })
                .catch(() => {});
            }
          }
        }
      }

      sendSuccess(res, {
        allowed: violations.length === 0,
        hardBlocked,
        hardBlockReason,
        requiresApproval: violations.length === 0 && requiresApproval,
        approvalLevel,
        violations,
        policiesChecked: activePolicies.length,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to enforce policy');
    }
  },
);

// ─── Usage Metering ──────────────────────────────────────────────────────────

router.post(
  '/alloy/usage/events',
  authMiddleware(),
  validateBody(
    bodyShape({
      orgId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user && !req.isInternalAgent) return sendForbidden(res, 'Authentication required');

      const parsed = insertAlloyUsageEventSchema.safeParse(req.body);
      if (!parsed.success) return sendBadRequest(res, parsed.error.message);

      // Caller must belong to the org they are recording usage for
      if (!req.isInternalAgent && !canWriteForOrg(user, parsed.data.orgId)) {
        return sendForbidden(res, 'Cannot record usage for an org you do not belong to');
      }

      const [event] = await db.insert(alloyUsageEventsTable).values(parsed.data).returning();
      sendCreated(res, event);

      // After recording, check if this org has crossed their cost threshold
      if (parsed.data.orgId) {
        const orgId = parsed.data.orgId;
        const costPolicies = await db
          .select()
          .from(alloyPoliciesTable)
          .where(
            and(
              eq(alloyPoliciesTable.orgId, orgId),
              eq(alloyPoliciesTable.kind, 'cost_control'),
              eq(alloyPoliciesTable.status, 'active'),
            ),
          );

        for (const policy of costPolicies) {
          const rules = policy.rules as Record<string, unknown>;
          const budgetUsd = (rules.monthlyBudgetUsd as number | undefined) ?? 500;
          const alertPct = (rules.alertThresholdPct as number | undefined) ?? 80;
          const hardStopPct = (rules.hardStopPct as number | undefined) ?? 100;

          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const [usageResult] = await db
            .select({ total: sum(alloyUsageEventsTable.costCents) })
            .from(alloyUsageEventsTable)
            .where(
              and(
                eq(alloyUsageEventsTable.orgId, orgId),
                gte(alloyUsageEventsTable.createdAt, monthStart),
              ),
            );

          const totalCents = Number(usageResult?.total ?? 0);
          const totalUsd = totalCents / 100;
          const pct = (totalUsd / budgetUsd) * 100;

          if (pct >= alertPct && pct < hardStopPct) {
            await db
              .insert(alloyGovernanceIncidentsTable)
              .values({
                orgId,
                policyId: policy.id,
                severity: 'medium',
                type: 'cost_threshold',
                description: `Cost threshold alert: Org #${orgId} has reached ${Math.round(pct)}% of monthly budget ($${totalUsd.toFixed(2)} / $${budgetUsd}). Policy: "${policy.name}".`,
                metadata: { pct, totalUsd, budgetUsd, alertPct },
              })
              .catch(() => {});
          } else if (pct >= hardStopPct) {
            await db
              .insert(alloyGovernanceIncidentsTable)
              .values({
                orgId,
                policyId: policy.id,
                severity: 'critical',
                type: 'cost_threshold',
                description: `HARD STOP: Org #${orgId} has reached 100% of monthly budget ($${totalUsd.toFixed(2)} / $${budgetUsd}). New agent runs blocked per policy "${policy.name}".`,
                metadata: { pct, totalUsd, budgetUsd, hardStopPct },
              })
              .catch(() => {});
          }
        }
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to record usage event');
    }
  },
);

router.get(
  '/alloy/usage/events',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      const orgIds = getUserOrgIds(user);
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string) : undefined;

      // Non-admins requesting a specific orgId must be members of that org
      if (orgId !== undefined && !isGlobalAdmin(user) && !orgIds.includes(orgId)) {
        return sendForbidden(res, 'Cannot view usage for an org you do not belong to');
      }

      // Build WHERE clause at DB level for org scope
      const usageWhere = [];
      if (!isGlobalAdmin(user)) {
        const scopedOrgIds = orgId !== undefined ? [orgId] : orgIds;
        if (scopedOrgIds.length > 0) {
          usageWhere.push(
            sql`"platform_usage_events"."org_id" IN (${sql.join(
              scopedOrgIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          );
        } else {
          return sendSuccess(res, []);
        }
      } else if (orgId !== undefined) {
        usageWhere.push(eq(alloyUsageEventsTable.orgId, orgId));
      }

      const visible = await db
        .select()
        .from(alloyUsageEventsTable)
        .where(usageWhere.length > 0 ? and(...usageWhere) : undefined)
        .orderBy(desc(alloyUsageEventsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, visible);
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch usage events');
    }
  },
);

// ─── Admin Analytics ─────────────────────────────────────────────────────────

router.get(
  '/alloy/admin/analytics',
  authMiddleware(),
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600000);

      const [runCount] = await db
        .select({ total: count() })
        .from(alloyWorkflowRunsTable)
        .where(gte(alloyWorkflowRunsTable.createdAt, weekAgo));

      const [totalCost] = await db
        .select({ total: sum(alloyUsageEventsTable.costCents) })
        .from(alloyUsageEventsTable)
        .where(gte(alloyUsageEventsTable.createdAt, monthStart));

      const [openIncidents] = await db
        .select({ total: count() })
        .from(alloyGovernanceIncidentsTable)
        .where(isNull(alloyGovernanceIncidentsTable.resolvedAt));

      const [policyCount] = await db
        .select({ total: count() })
        .from(alloyPoliciesTable)
        .where(eq(alloyPoliciesTable.status, 'active'));

      const modelUsage = await db
        .select({
          model: alloyUsageEventsTable.model,
          calls: count(),
          totalCostCents: sum(alloyUsageEventsTable.costCents),
        })
        .from(alloyUsageEventsTable)
        .where(gte(alloyUsageEventsTable.createdAt, monthStart))
        .groupBy(alloyUsageEventsTable.model)
        .orderBy(desc(count()));

      // Skill invocations count MTD
      const [skillInvocations] = await db
        .select({ total: count() })
        .from(alloyUsageEventsTable)
        .where(
          and(
            gte(alloyUsageEventsTable.createdAt, monthStart),
            eq(alloyUsageEventsTable.eventType, 'skill_invocation'),
          ),
        );

      // Approval latency: average time from incident created to resolvedAt for resolved incidents (7d)
      // Computed in JS from resolved incidents to avoid complex SQL date arithmetic
      // Filter to only incidents created in the last 7d that have been resolved (resolvedAt IS NOT NULL)
      const resolvedIncidents7d = await db
        .select({
          createdAt: alloyGovernanceIncidentsTable.createdAt,
          resolvedAt: alloyGovernanceIncidentsTable.resolvedAt,
        })
        .from(alloyGovernanceIncidentsTable)
        .where(
          and(
            gte(alloyGovernanceIncidentsTable.createdAt, weekAgo),
            sql`"platform_governance_incidents"."resolved_at" IS NOT NULL`,
          ),
        )
        .limit(200);

      const avgApprovalLatencyMin =
        resolvedIncidents7d.length > 0
          ? Math.round(
              resolvedIncidents7d.reduce((s, i) => {
                const ms = new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime();
                return s + ms / 60000;
              }, 0) / resolvedIncidents7d.length,
            )
          : 0;

      // Per-tenant usage breakdown (top 10 orgs by MTD cost)
      const tenantBreakdown = await db
        .select({
          orgId: alloyUsageEventsTable.orgId,
          totalCostCents: sum(alloyUsageEventsTable.costCents),
          eventCount: count(),
        })
        .from(alloyUsageEventsTable)
        .where(gte(alloyUsageEventsTable.createdAt, monthStart))
        .groupBy(alloyUsageEventsTable.orgId)
        .orderBy(desc(sum(alloyUsageEventsTable.costCents)))
        .limit(10);

      const recentIncidents = await db
        .select()
        .from(alloyGovernanceIncidentsTable)
        .orderBy(desc(alloyGovernanceIncidentsTable.createdAt))
        .limit(10);

      sendSuccess(res, {
        period: { monthStart, weekAgo },
        runCount7d: Number(runCount.total ?? 0),
        totalCostMtdUsd: Number(totalCost.total ?? 0) / 100,
        openIncidents: Number(openIncidents.total ?? 0),
        activePolicies: Number(policyCount.total ?? 0),
        skillInvocationsMtd: Number(skillInvocations.total ?? 0),
        avgApprovalLatencyMin,
        modelUsage: modelUsage.map((m) => ({
          model: m.model ?? 'unknown',
          calls: Number(m.calls ?? 0),
          costUsd: Number(m.totalCostCents ?? 0) / 100,
        })),
        tenantBreakdown: tenantBreakdown.map((t) => ({
          orgId: t.orgId,
          totalCostMtdUsd: Number(t.totalCostCents ?? 0) / 100,
          eventCount: Number(t.eventCount ?? 0),
        })),
        recentIncidents,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch admin analytics');
    }
  },
);

export default router;
