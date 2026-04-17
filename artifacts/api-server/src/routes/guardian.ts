import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";
import {
  GuardianDecisionEngine,
  GuardianRuleSchema,
  PolicyTierSchema,
  POLICY_TIER_DESCRIPTIONS,
  TIER_RISK_LEVEL,
  type DecisionRequest,
  type GuardianRule,
} from "@workspace/guardian";
import {
  defaultToolRegistry,
  ToolManifestSchema,
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  SECURITY_TOOL_MANIFESTS,
  FINANCE_TOOL_MANIFESTS,
  OPERATIONS_TOOL_MANIFESTS,
  type ToolManifest,
} from "@workspace/tool-mesh";
import {
  db,
  guardianPoliciesTable,
  guardianPolicyAssignmentsTable,
  toolMeshToolsTable,
  toolMeshToolVersionsTable,
  toolMeshToolPermissionsTable,
  toolMeshActionApprovalsTable,
  type GuardianPolicy,
  type GuardianPolicyAssignment,
  type ToolMeshTool,
  type ToolMeshToolVersion,
  type ToolMeshToolPermission,
  type ToolMeshActionApproval,
} from "@szl-holdings/db";
import { and, desc, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const sharedDecisionEngine = new GuardianDecisionEngine();

const allToolManifests = [
  GRAPH_QUERY_TOOL_MANIFEST,
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  ...SECURITY_TOOL_MANIFESTS,
  ...FINANCE_TOOL_MANIFESTS,
  ...OPERATIONS_TOOL_MANIFESTS,
];
for (const manifest of allToolManifests) {
  defaultToolRegistry.register(manifest);
}

function policyRowToApi(row: GuardianPolicy) {
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
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

function policyRowToRule(row: GuardianPolicy): GuardianRule {
  return {
    id: `policy-${row.id}`,
    name: row.name,
    description: row.description ?? undefined,
    tier: row.tier as GuardianRule["tier"],
    conditions: ((row.conditions as unknown[]) ?? []) as GuardianRule["conditions"],
    action: row.action as GuardianRule["action"],
    priority: row.priority,
    enabled: row.enabled,
    owner: row.owner ?? undefined,
    tags: ((row.tags as string[]) ?? []),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : (row.createdAt as unknown as string),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : (row.updatedAt as unknown as string),
  };
}

function toolRowToManifest(row: ToolMeshTool): ToolManifest {
  return {
    id: row.toolId,
    name: row.name,
    version: row.version,
    description: row.description,
    domainTags: ((row.domainTags as string[]) ?? []) as ToolManifest["domainTags"],
    policyTier: row.policyTier as ToolManifest["policyTier"],
    allowedEnvironments: ((row.allowedEnvironments as string[]) ?? []) as ToolManifest["allowedEnvironments"],
    inputSchema: (row.inputSchema as Record<string, unknown> | null) ?? undefined,
    outputSchema: (row.outputSchema as Record<string, unknown> | null) ?? undefined,
    rateLimits: (row.rateLimits as ToolManifest["rateLimits"]) ?? {},
    timeoutMs: row.timeoutMs,
    failureModes: ((row.failureModes as unknown[]) ?? []) as ToolManifest["failureModes"],
    approvalRequired: row.approvalRequired,
    owner: row.owner ?? undefined,
    observabilityHooks: (row.observabilityHooks as ToolManifest["observabilityHooks"]) ?? {
      emitTrace: true,
      emitMetrics: true,
      sensitiveFields: [],
    },
    enabled: row.enabled,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : (row.createdAt as unknown as string),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : (row.updatedAt as unknown as string),
  };
}

function assignmentRowToApi(row: GuardianPolicyAssignment) {
  return {
    id: row.id,
    policyId: row.policyId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    context: (row.context as Record<string, unknown>) ?? {},
    grantedById: row.grantedById ?? undefined,
    expiresAt: row.expiresAt instanceof Date ? row.expiresAt.toISOString() : row.expiresAt ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

function versionRowToApi(row: ToolMeshToolVersion) {
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

function permissionRowToApi(row: ToolMeshToolPermission) {
  return {
    id: row.id,
    toolDbId: row.toolDbId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    permission: row.permission,
    grantedById: row.grantedById ?? undefined,
    expiresAt: row.expiresAt instanceof Date ? row.expiresAt.toISOString() : row.expiresAt ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

function approvalRowToApi(row: ToolMeshActionApproval) {
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
    approvedById: row.approvedById ?? undefined,
    approvedAt: row.approvedAt instanceof Date ? row.approvedAt.toISOString() : row.approvedAt ?? undefined,
    rejectedById: row.rejectedById ?? undefined,
    rejectedAt: row.rejectedAt instanceof Date ? row.rejectedAt.toISOString() : row.rejectedAt ?? undefined,
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

let policyEngineSyncedAt = 0;
async function syncDecisionEngine(): Promise<void> {
  // Periodically reload all enabled policies into the in-process decision engine.
  // Cheap query (single index scan); we throttle to once per 10s.
  if (Date.now() - policyEngineSyncedAt < 10_000) return;
  policyEngineSyncedAt = Date.now();
  const rows = await db.select().from(guardianPoliciesTable).where(eq(guardianPoliciesTable.enabled, true));
  for (const r of sharedDecisionEngine.getRules()) {
    sharedDecisionEngine.removeRule(r.id);
  }
  for (const row of rows) {
    sharedDecisionEngine.addRule(policyRowToRule(row));
  }
}

router.get("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const tier = req.query["tier"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;

    const conditions = [] as ReturnType<typeof eq>[];
    if (tier) conditions.push(eq(guardianPoliciesTable.tier, tier as GuardianPolicy["tier"]));
    if (enabled !== undefined) conditions.push(eq(guardianPoliciesTable.enabled, enabled === "true"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(guardianPoliciesTable)
        .where(where as ReturnType<typeof and>)
        .orderBy(desc(guardianPoliciesTable.priority), desc(guardianPoliciesTable.id))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(guardianPoliciesTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows.map(policyRowToApi), 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list policies");
  }
});

router.get("/policies/tiers", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const tiers = (PolicyTierSchema.options as string[]).map(t => {
      const tier = t as import("@workspace/guardian").PolicyTier;
      return { tier, description: POLICY_TIER_DESCRIPTIONS[tier], riskLevel: TIER_RISK_LEVEL[tier] };
    });
    sendSuccess(res, tiers);
  } catch (err) {
    handleRouteError(res, err, "Failed to list policy tiers");
  }
});

router.get("/policies/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const [row] = await db.select().from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id)).limit(1);
    if (!row) { sendNotFound(res, "Policy not found"); return; }
    sendSuccess(res, policyRowToApi(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to get policy");
  }
});

router.post("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();
    const parsed = GuardianRuleSchema.safeParse({
      ...req.body,
      id: req.body.id ?? `policy-pending`,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    if (!parsed.success) {
      sendBadRequest(res, "Invalid policy schema", parsed.error.flatten());
      return;
    }
    const rule = parsed.data;

    const [inserted] = await db.insert(guardianPoliciesTable).values({
      name: rule.name,
      description: rule.description ?? null,
      tier: rule.tier,
      conditions: rule.conditions,
      action: rule.action,
      priority: rule.priority,
      enabled: rule.enabled,
      owner: rule.owner ?? null,
      tags: rule.tags,
      createdById: req.user?.id ?? null,
    }).returning();

    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to create policy"); return; }

    if (inserted.enabled) {
      sharedDecisionEngine.addRule(policyRowToRule(inserted));
    }

    logger.info({ policyId: inserted.id, tier: inserted.tier, action: inserted.action }, "Policy created");
    sendCreated(res, policyRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create policy");
  }
});

router.patch("/policies/:id", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }

    const body = req.body as Partial<{
      name: string;
      description: string | null;
      tier: GuardianPolicy["tier"];
      conditions: unknown[];
      action: GuardianPolicy["action"];
      priority: number;
      enabled: boolean;
      owner: string | null;
      tags: string[];
    }>;

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateValues.name = body.name;
    if (body.description !== undefined) updateValues.description = body.description;
    if (body.tier !== undefined) updateValues.tier = body.tier;
    if (body.conditions !== undefined) updateValues.conditions = body.conditions;
    if (body.action !== undefined) updateValues.action = body.action;
    if (body.priority !== undefined) updateValues.priority = body.priority;
    if (body.enabled !== undefined) updateValues.enabled = body.enabled;
    if (body.owner !== undefined) updateValues.owner = body.owner;
    if (body.tags !== undefined) updateValues.tags = body.tags;

    const [updated] = await db.update(guardianPoliciesTable)
      .set(updateValues)
      .where(eq(guardianPoliciesTable.id, id))
      .returning();

    if (!updated) { sendNotFound(res, "Policy not found"); return; }

    // Force decision engine resync on next decide call
    policyEngineSyncedAt = 0;

    sendSuccess(res, policyRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to update policy");
  }
});

router.delete("/policies/:id", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const deleted = await db.delete(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id)).returning({ id: guardianPoliciesTable.id });
    if (deleted.length === 0) { sendNotFound(res, "Policy not found"); return; }
    policyEngineSyncedAt = 0;
    logger.info({ policyId: id }, "Policy deleted");
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete policy");
  }
});

// ---- Policy assignments (subject -> policy) ----

router.get("/policies/:id/assignments", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params["id"] as string, 10);
    if (isNaN(policyId)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const rows = await db
      .select()
      .from(guardianPolicyAssignmentsTable)
      .where(eq(guardianPolicyAssignmentsTable.policyId, policyId))
      .orderBy(desc(guardianPolicyAssignmentsTable.createdAt));
    sendSuccess(res, rows.map(assignmentRowToApi));
  } catch (err) {
    handleRouteError(res, err, "Failed to list policy assignments");
  }
});

router.post("/policies/:id/assignments", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params["id"] as string, 10);
    if (isNaN(policyId)) { sendBadRequest(res, "Invalid policy ID"); return; }

    const body = req.body as {
      subjectType?: GuardianPolicyAssignment["subjectType"];
      subjectId?: string;
      context?: Record<string, unknown>;
      expiresAt?: string;
    };
    if (!body.subjectType || !body.subjectId) {
      sendBadRequest(res, "subjectType and subjectId are required");
      return;
    }

    // Ensure parent policy exists
    const [policy] = await db.select({ id: guardianPoliciesTable.id }).from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, policyId)).limit(1);
    if (!policy) { sendNotFound(res, "Policy not found"); return; }

    const [inserted] = await db
      .insert(guardianPolicyAssignmentsTable)
      .values({
        policyId,
        subjectType: body.subjectType,
        subjectId: body.subjectId,
        context: body.context ?? {},
        grantedById: req.user?.id ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      })
      .onConflictDoNothing({
        target: [
          guardianPolicyAssignmentsTable.policyId,
          guardianPolicyAssignmentsTable.subjectType,
          guardianPolicyAssignmentsTable.subjectId,
        ],
      })
      .returning();

    if (!inserted) {
      const [existing] = await db
        .select()
        .from(guardianPolicyAssignmentsTable)
        .where(and(
          eq(guardianPolicyAssignmentsTable.policyId, policyId),
          eq(guardianPolicyAssignmentsTable.subjectType, body.subjectType),
          eq(guardianPolicyAssignmentsTable.subjectId, body.subjectId),
        )).limit(1);
      if (existing) { sendSuccess(res, assignmentRowToApi(existing)); return; }
      handleRouteError(res, new Error("insert returned no row"), "Failed to create assignment");
      return;
    }

    logger.info({ policyId, subject: `${inserted.subjectType}:${inserted.subjectId}` }, "Policy assignment created");
    sendCreated(res, assignmentRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create policy assignment");
  }
});

router.delete("/policies/:id/assignments/:assignmentId", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params["id"] as string, 10);
    const assignmentId = parseInt(req.params["assignmentId"] as string, 10);
    if (isNaN(policyId) || isNaN(assignmentId)) { sendBadRequest(res, "Invalid ID"); return; }
    const deleted = await db
      .delete(guardianPolicyAssignmentsTable)
      .where(and(
        eq(guardianPolicyAssignmentsTable.id, assignmentId),
        eq(guardianPolicyAssignmentsTable.policyId, policyId),
      ))
      .returning({ id: guardianPolicyAssignmentsTable.id });
    if (deleted.length === 0) { sendNotFound(res, "Assignment not found"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete policy assignment");
  }
});

router.get("/tools", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const domainTag = req.query["domainTag"] as string | undefined;
    const policyTier = req.query["policyTier"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;

    const conditions = [] as ReturnType<typeof eq>[];
    if (policyTier) conditions.push(eq(toolMeshToolsTable.policyTier, policyTier as ToolMeshTool["policyTier"]));
    if (enabled !== undefined) conditions.push(eq(toolMeshToolsTable.enabled, enabled === "true"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db.select().from(toolMeshToolsTable).where(where as ReturnType<typeof and>);
    let manifests = rows.map(toolRowToManifest);
    if (domainTag) {
      manifests = manifests.filter(m => m.domainTags.includes(domainTag as ToolManifest["domainTags"][number]));
    }

    const offset = (page - 1) * limit;
    const paginated = manifests.slice(offset, offset + limit);

    sendSuccess(res, paginated, 200, { page, limit, total: manifests.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list tools");
  }
});

router.get("/tools/:toolId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [row] = await db.select().from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!row) { sendNotFound(res, "Tool not found"); return; }
    sendSuccess(res, toolRowToManifest(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to get tool");
  }
});

router.post("/tools", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();
    const parsed = ToolManifestSchema.safeParse({
      ...req.body,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    if (!parsed.success) {
      sendBadRequest(res, "Invalid tool manifest", parsed.error.flatten());
      return;
    }

    const existing = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, parsed.data.id)).limit(1);
    if (existing.length > 0) {
      sendBadRequest(res, `Tool with id "${parsed.data.id}" already registered`);
      return;
    }

    const m = parsed.data;
    const [inserted] = await db.insert(toolMeshToolsTable).values({
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
    }).returning();

    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to register tool"); return; }

    // Record initial version snapshot
    await db.insert(toolMeshToolVersionsTable).values({
      toolDbId: inserted.id,
      version: m.version,
      changelog: "Initial registration",
      schemaSnapshot: {
        inputSchema: m.inputSchema ?? null,
        outputSchema: m.outputSchema ?? null,
        rateLimits: m.rateLimits,
        timeoutMs: m.timeoutMs,
        policyTier: m.policyTier,
      },
      publishedById: req.user?.id ?? null,
    }).onConflictDoNothing({ target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version] });

    const manifest = toolRowToManifest(inserted);
    defaultToolRegistry.register(manifest);
    logger.info({ toolId: manifest.id, policyTier: manifest.policyTier }, "Tool registered");
    sendCreated(res, manifest);
  } catch (err) {
    handleRouteError(res, err, "Failed to register tool");
  }
});

router.patch("/tools/:toolId", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [existing] = await db.select().from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!existing) { sendNotFound(res, "Tool not found"); return; }

    const merged = { ...toolRowToManifest(existing), ...req.body, id: toolId, updatedAt: new Date().toISOString() };
    const parsed = ToolManifestSchema.safeParse(merged);
    if (!parsed.success) {
      sendBadRequest(res, "Invalid tool manifest update", parsed.error.flatten());
      return;
    }

    const m = parsed.data;
    const versionChanged = m.version !== existing.version;

    const [updated] = await db.update(toolMeshToolsTable).set({
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
      updatedAt: new Date(),
    }).where(eq(toolMeshToolsTable.toolId, toolId)).returning();

    if (!updated) { sendNotFound(res, "Tool not found"); return; }

    if (versionChanged) {
      // Snapshot the new version into tool_mesh_tool_versions
      await db.insert(toolMeshToolVersionsTable).values({
        toolDbId: updated.id,
        version: m.version,
        changelog: (req.body as { changelog?: string }).changelog ?? `Updated to ${m.version}`,
        schemaSnapshot: {
          inputSchema: m.inputSchema ?? null,
          outputSchema: m.outputSchema ?? null,
          rateLimits: m.rateLimits,
          timeoutMs: m.timeoutMs,
          policyTier: m.policyTier,
        },
        publishedById: req.user?.id ?? null,
      }).onConflictDoNothing({ target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version] });
    }

    const manifest = toolRowToManifest(updated);
    defaultToolRegistry.register(manifest);
    sendSuccess(res, manifest);
  } catch (err) {
    handleRouteError(res, err, "Failed to update tool");
  }
});

// ---- Tool versions ----

router.get("/tools/:toolId/versions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }

    const rows = await db.select().from(toolMeshToolVersionsTable)
      .where(eq(toolMeshToolVersionsTable.toolDbId, tool.id))
      .orderBy(desc(toolMeshToolVersionsTable.createdAt));
    sendSuccess(res, rows.map(versionRowToApi));
  } catch (err) {
    handleRouteError(res, err, "Failed to list tool versions");
  }
});

router.post("/tools/:toolId/versions", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const body = req.body as { version?: string; changelog?: string; schemaSnapshot?: Record<string, unknown> };
    if (!body.version) { sendBadRequest(res, "version is required"); return; }

    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }

    const [inserted] = await db.insert(toolMeshToolVersionsTable).values({
      toolDbId: tool.id,
      version: body.version,
      changelog: body.changelog ?? null,
      schemaSnapshot: body.schemaSnapshot ?? {},
      publishedById: req.user?.id ?? null,
    }).onConflictDoNothing({ target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version] }).returning();

    if (!inserted) {
      sendBadRequest(res, `Version ${body.version} already exists for tool ${toolId}`);
      return;
    }

    sendCreated(res, versionRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create tool version");
  }
});

// ---- Tool permissions (subject -> tool grant) ----

router.get("/tools/:toolId/permissions", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }

    const rows = await db.select().from(toolMeshToolPermissionsTable)
      .where(eq(toolMeshToolPermissionsTable.toolDbId, tool.id))
      .orderBy(desc(toolMeshToolPermissionsTable.createdAt));
    sendSuccess(res, rows.map(permissionRowToApi));
  } catch (err) {
    handleRouteError(res, err, "Failed to list tool permissions");
  }
});

router.post("/tools/:toolId/permissions", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const body = req.body as {
      subjectType?: ToolMeshToolPermission["subjectType"];
      subjectId?: string;
      permission?: ToolMeshToolPermission["permission"];
      expiresAt?: string;
    };
    if (!body.subjectType || !body.subjectId) {
      sendBadRequest(res, "subjectType and subjectId are required");
      return;
    }
    const permission = body.permission ?? "invoke";

    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }

    const [inserted] = await db.insert(toolMeshToolPermissionsTable).values({
      toolDbId: tool.id,
      subjectType: body.subjectType,
      subjectId: body.subjectId,
      permission,
      grantedById: req.user?.id ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    }).onConflictDoNothing({
      target: [
        toolMeshToolPermissionsTable.toolDbId,
        toolMeshToolPermissionsTable.subjectType,
        toolMeshToolPermissionsTable.subjectId,
        toolMeshToolPermissionsTable.permission,
      ],
    }).returning();

    if (!inserted) {
      const [existing] = await db.select().from(toolMeshToolPermissionsTable)
        .where(and(
          eq(toolMeshToolPermissionsTable.toolDbId, tool.id),
          eq(toolMeshToolPermissionsTable.subjectType, body.subjectType),
          eq(toolMeshToolPermissionsTable.subjectId, body.subjectId),
          eq(toolMeshToolPermissionsTable.permission, permission),
        )).limit(1);
      if (existing) { sendSuccess(res, permissionRowToApi(existing)); return; }
      handleRouteError(res, new Error("insert returned no row"), "Failed to grant permission");
      return;
    }

    sendCreated(res, permissionRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to grant tool permission");
  }
});

router.delete("/tools/:toolId/permissions/:permissionId", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const permissionId = parseInt(req.params["permissionId"] as string, 10);
    if (isNaN(permissionId)) { sendBadRequest(res, "Invalid permission ID"); return; }

    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }

    const deleted = await db.delete(toolMeshToolPermissionsTable)
      .where(and(
        eq(toolMeshToolPermissionsTable.id, permissionId),
        eq(toolMeshToolPermissionsTable.toolDbId, tool.id),
      ))
      .returning({ id: toolMeshToolPermissionsTable.id });
    if (deleted.length === 0) { sendNotFound(res, "Permission not found"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to revoke tool permission");
  }
});

router.get("/actions", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const toolId = req.query["toolId"] as string | undefined;

    const conditions = [] as ReturnType<typeof eq>[];
    if (status) conditions.push(eq(toolMeshActionApprovalsTable.status, status as ToolMeshActionApproval["status"]));
    if (toolId) conditions.push(eq(toolMeshActionApprovalsTable.toolId, toolId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(toolMeshActionApprovalsTable)
        .where(where as ReturnType<typeof and>)
        .orderBy(desc(toolMeshActionApprovalsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(toolMeshActionApprovalsTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows.map(approvalRowToApi), 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list action approvals");
  }
});

router.get("/actions/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const [row] = await db.select().from(toolMeshActionApprovalsTable).where(eq(toolMeshActionApprovalsTable.id, id)).limit(1);
    if (!row) { sendNotFound(res, "Action approval not found"); return; }
    sendSuccess(res, approvalRowToApi(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to get action approval");
  }
});

router.post("/actions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { toolId, action, agentId, sessionId, workflowId, payload } = req.body as {
      toolId?: string;
      action?: string;
      agentId?: string;
      sessionId?: string;
      workflowId?: string;
      payload?: Record<string, unknown>;
    };

    if (!toolId || !action) {
      sendBadRequest(res, "toolId and action are required");
      return;
    }

    const [toolRow] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!toolRow && !defaultToolRegistry.get(toolId)) {
      sendNotFound(res, "Tool not found");
      return;
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const [inserted] = await db.insert(toolMeshActionApprovalsTable).values({
      requestId,
      toolId,
      action,
      agentId: agentId ?? null,
      sessionId: sessionId ?? null,
      workflowId: workflowId ?? null,
      status: "pending",
      requestedById: req.user?.id ?? null,
      payload: payload ?? {},
    }).returning();

    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to create action approval"); return; }

    logger.info({ actionId: inserted.id, toolId, action }, "Action approval request created");
    sendCreated(res, approvalRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create action approval");
  }
});

router.post("/actions/:id/approve", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }

    const [existing] = await db.select().from(toolMeshActionApprovalsTable).where(eq(toolMeshActionApprovalsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Action approval not found"); return; }
    if (existing.status !== "pending") {
      sendBadRequest(res, `Cannot approve action in status: ${existing.status}`);
      return;
    }

    const user = req.user;
    const reason = (req.body as { reason?: string }).reason ?? "Approved by operator";

    const [updated] = await db.update(toolMeshActionApprovalsTable).set({
      status: "approved",
      approvedById: user?.id ?? null,
      approvedAt: new Date(),
      decisionReason: reason,
      updatedAt: new Date(),
    }).where(eq(toolMeshActionApprovalsTable.id, id)).returning();

    if (!updated) { sendNotFound(res, "Action approval not found"); return; }

    logger.info({ actionId: id, approvedBy: user?.id, toolId: updated.toolId }, "Action approved");
    sendSuccess(res, approvalRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to approve action");
  }
});

router.post("/actions/:id/reject", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }

    const [existing] = await db.select().from(toolMeshActionApprovalsTable).where(eq(toolMeshActionApprovalsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Action approval not found"); return; }
    if (existing.status !== "pending") {
      sendBadRequest(res, `Cannot reject action in status: ${existing.status}`);
      return;
    }

    const user = req.user;
    const reason = (req.body as { reason?: string }).reason ?? "Rejected by operator";

    const [updated] = await db.update(toolMeshActionApprovalsTable).set({
      status: "rejected",
      rejectedById: user?.id ?? null,
      rejectedAt: new Date(),
      decisionReason: reason,
      updatedAt: new Date(),
    }).where(eq(toolMeshActionApprovalsTable.id, id)).returning();

    if (!updated) { sendNotFound(res, "Action approval not found"); return; }

    logger.info({ actionId: id, rejectedBy: user?.id, toolId: updated.toolId }, "Action rejected");
    sendSuccess(res, approvalRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to reject action");
  }
});

router.post("/guardian/decide", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { requestId, agentId, sessionId, workflowId, action, domain, tier, context } = req.body as Partial<DecisionRequest>;
    if (!requestId || !action) {
      sendBadRequest(res, "requestId and action are required");
      return;
    }

    await syncDecisionEngine();

    const decision = sharedDecisionEngine.decide({
      requestId,
      agentId,
      sessionId,
      workflowId,
      action,
      domain,
      tier,
      context: (context as Record<string, unknown>) ?? {},
    });

    sendSuccess(res, decision);
  } catch (err) {
    handleRouteError(res, err, "Failed to evaluate policy decision");
  }
});

export default router;
