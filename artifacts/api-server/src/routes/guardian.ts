import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  sendServiceUnavailable,
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
  TIER_CONTROLS,
  TIER_NUMBER,
  type DecisionRequest,
  type GuardianRule,
  type PolicyTier,
} from "@workspace/guardian";
import { getGuardianEngine, syncGuardianPolicies } from "../lib/guardian-engine";
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
  guardianActionsTable,
  guardianApprovalRequestsTable,
  rollbackEventsTable,
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

const sharedDecisionEngine: GuardianDecisionEngine = getGuardianEngine();

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
    allowedModels: (row.allowedModels as string[] | null) ?? undefined,
    allowedTools: (row.allowedTools as string[] | null) ?? undefined,
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
    allowedModels: (row.allowedModels as string[] | null) ?? undefined,
    allowedTools: (row.allowedTools as string[] | null) ?? undefined,
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

async function syncDecisionEngine(): Promise<void> {
  await syncGuardianPolicies(true);
}

const PII_FIELD_PATTERNS = [
  /^(email|phone|ssn|dob|date_of_birth|birthdate|address|postal_code|zip|credit_card|card_number|cvv|password|secret|token|api_key|private_key|national_id|passport|drivers_license|bank_account|routing_number|tax_id|ein|sin)/i,
];

function redactPayload(payload: Record<string, unknown>): { redacted: Record<string, unknown>; redactedFields: string[] } {
  const redacted: Record<string, unknown> = {};
  const redactedFields: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (PII_FIELD_PATTERNS.some(p => p.test(key))) {
      redacted[key] = "[REDACTED]";
      redactedFields.push(key);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const inner = redactPayload(value as Record<string, unknown>);
      redacted[key] = inner.redacted;
      redactedFields.push(...inner.redactedFields.map(f => `${key}.${f}`));
    } else {
      redacted[key] = value;
    }
  }
  return { redacted, redactedFields };
}

function isAdminUser(user: Request["user"]): boolean {
  return user?.roles?.some(r => ["super_admin", "admin"].includes(r)) ?? false;
}

function userOrgId(user: Request["user"]): number | null {
  return user?.orgs?.[0]?.orgId ?? null;
}

// ============================================================
// POLICIES
// ============================================================

router.get("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const tier = req.query["tier"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      conditions.push(eq(guardianPoliciesTable.orgId, orgId));
    }
    if (tier) conditions.push(eq(guardianPoliciesTable.tier, tier as GuardianPolicy["tier"]));
    if (enabled !== undefined) conditions.push(eq(guardianPoliciesTable.enabled, enabled === "true"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(guardianPoliciesTable).where(where as ReturnType<typeof and>).orderBy(desc(guardianPoliciesTable.priority), desc(guardianPoliciesTable.id)).limit(limit).offset(offset),
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
      const tier = t as PolicyTier;
      return { tier, tierNumber: TIER_NUMBER[tier], description: POLICY_TIER_DESCRIPTIONS[tier], riskLevel: TIER_RISK_LEVEL[tier], controls: TIER_CONTROLS[tier] };
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

    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (row.orgId !== orgId) { sendNotFound(res, "Policy not found"); return; }
    }

    sendSuccess(res, policyRowToApi(row));
  } catch (err) {
    handleRouteError(res, err, "Failed to get policy");
  }
});

router.post("/policies", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();
    const parsed = GuardianRuleSchema.safeParse({ ...req.body, id: req.body.id ?? "policy-pending", createdAt: nowIso, updatedAt: nowIso });
    if (!parsed.success) { sendBadRequest(res, "Invalid policy schema", parsed.error.flatten()); return; }

    const rule = parsed.data;
    const user = req.user;
    const orgId = userOrgId(user);

    const [inserted] = await db.insert(guardianPoliciesTable).values({
      orgId, name: rule.name, description: rule.description ?? null, tier: rule.tier,
      conditions: rule.conditions, action: rule.action, priority: rule.priority, enabled: rule.enabled,
      owner: rule.owner ?? null, tags: rule.tags, allowedModels: rule.allowedModels ?? null,
      allowedTools: rule.allowedTools ?? null, createdById: user?.id ?? null,
    }).returning();

    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to create policy"); return; }
    if (inserted.enabled) sharedDecisionEngine.addRule(policyRowToRule(inserted));
    await syncDecisionEngine();

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

    const [existing] = await db.select().from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Policy not found"); return; }

    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (existing.orgId !== orgId) { sendNotFound(res, "Policy not found"); return; }
    }

    const body = req.body as Partial<{ name: string; description: string | null; tier: GuardianPolicy["tier"]; conditions: unknown[]; action: GuardianPolicy["action"]; priority: number; enabled: boolean; owner: string | null; tags: string[]; allowedModels: string[] | null; allowedTools: string[] | null }>;

    const u: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) u.name = body.name;
    if (body.description !== undefined) u.description = body.description;
    if (body.tier !== undefined) u.tier = body.tier;
    if (body.conditions !== undefined) u.conditions = body.conditions;
    if (body.action !== undefined) u.action = body.action;
    if (body.priority !== undefined) u.priority = body.priority;
    if (body.enabled !== undefined) u.enabled = body.enabled;
    if (body.owner !== undefined) u.owner = body.owner;
    if (body.tags !== undefined) u.tags = body.tags;
    if (body.allowedModels !== undefined) u.allowedModels = body.allowedModels;
    if (body.allowedTools !== undefined) u.allowedTools = body.allowedTools;

    const [updated] = await db.update(guardianPoliciesTable).set(u).where(eq(guardianPoliciesTable.id, id)).returning();
    if (!updated) { sendNotFound(res, "Policy not found"); return; }

    await syncDecisionEngine();
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
    await syncDecisionEngine();
    logger.info({ policyId: id }, "Policy deleted");
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete policy");
  }
});

router.get("/policies/:id/assignments", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params["id"] as string, 10);
    if (isNaN(policyId)) { sendBadRequest(res, "Invalid policy ID"); return; }
    const rows = await db.select().from(guardianPolicyAssignmentsTable).where(eq(guardianPolicyAssignmentsTable.policyId, policyId)).orderBy(desc(guardianPolicyAssignmentsTable.createdAt));
    sendSuccess(res, rows.map(assignmentRowToApi));
  } catch (err) {
    handleRouteError(res, err, "Failed to list policy assignments");
  }
});

router.post("/policies/:id/assignments", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const policyId = parseInt(req.params["id"] as string, 10);
    if (isNaN(policyId)) { sendBadRequest(res, "Invalid policy ID"); return; }

    const body = req.body as { subjectType?: GuardianPolicyAssignment["subjectType"]; subjectId?: string; context?: Record<string, unknown>; expiresAt?: string };
    if (!body.subjectType || !body.subjectId) { sendBadRequest(res, "subjectType and subjectId are required"); return; }

    const [policy] = await db.select({ id: guardianPoliciesTable.id }).from(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, policyId)).limit(1);
    if (!policy) { sendNotFound(res, "Policy not found"); return; }

    const [inserted] = await db.insert(guardianPolicyAssignmentsTable).values({
      policyId, subjectType: body.subjectType, subjectId: body.subjectId,
      context: body.context ?? {}, grantedById: req.user?.id ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    }).onConflictDoNothing({ target: [guardianPolicyAssignmentsTable.policyId, guardianPolicyAssignmentsTable.subjectType, guardianPolicyAssignmentsTable.subjectId] }).returning();

    if (!inserted) {
      const [ex] = await db.select().from(guardianPolicyAssignmentsTable).where(and(eq(guardianPolicyAssignmentsTable.policyId, policyId), eq(guardianPolicyAssignmentsTable.subjectType, body.subjectType), eq(guardianPolicyAssignmentsTable.subjectId, body.subjectId))).limit(1);
      if (ex) { sendSuccess(res, assignmentRowToApi(ex)); return; }
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
    const deleted = await db.delete(guardianPolicyAssignmentsTable).where(and(eq(guardianPolicyAssignmentsTable.id, assignmentId), eq(guardianPolicyAssignmentsTable.policyId, policyId))).returning({ id: guardianPolicyAssignmentsTable.id });
    if (deleted.length === 0) { sendNotFound(res, "Assignment not found"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete policy assignment");
  }
});

// ============================================================
// TOOL MESH — tools, versions, permissions
// ============================================================

router.get("/tools", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const domainTag = req.query["domainTag"] as string | undefined;
    const policyTier = req.query["policyTier"] as string | undefined;
    const enabled = req.query["enabled"] as string | undefined;

    const conditions: Parameters<typeof and>[0][] = [];
    if (policyTier) conditions.push(eq(toolMeshToolsTable.policyTier, policyTier as ToolMeshTool["policyTier"]));
    if (enabled !== undefined) conditions.push(eq(toolMeshToolsTable.enabled, enabled === "true"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(toolMeshToolsTable).where(where as ReturnType<typeof and>);
    let manifests = rows.map(toolRowToManifest);
    if (domainTag) manifests = manifests.filter(m => m.domainTags.includes(domainTag as ToolManifest["domainTags"][number]));

    const offset = (page - 1) * limit;
    sendSuccess(res, manifests.slice(offset, offset + limit), 200, { page, limit, total: manifests.length });
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
    const parsed = ToolManifestSchema.safeParse({ ...req.body, createdAt: nowIso, updatedAt: nowIso });
    if (!parsed.success) { sendBadRequest(res, "Invalid tool manifest", parsed.error.flatten()); return; }

    const ex = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, parsed.data.id)).limit(1);
    if (ex.length > 0) { sendBadRequest(res, `Tool with id "${parsed.data.id}" already registered`); return; }

    const m = parsed.data;
    const [inserted] = await db.insert(toolMeshToolsTable).values({
      toolId: m.id, name: m.name, version: m.version, description: m.description,
      domainTags: m.domainTags, policyTier: m.policyTier, allowedEnvironments: m.allowedEnvironments,
      inputSchema: m.inputSchema ?? null, outputSchema: m.outputSchema ?? null,
      rateLimits: m.rateLimits, timeoutMs: m.timeoutMs, failureModes: m.failureModes,
      approvalRequired: m.approvalRequired, owner: m.owner ?? null,
      observabilityHooks: m.observabilityHooks, enabled: m.enabled,
    }).returning();

    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to register tool"); return; }

    await db.insert(toolMeshToolVersionsTable).values({
      toolDbId: inserted.id, version: m.version, changelog: "Initial registration",
      schemaSnapshot: { inputSchema: m.inputSchema ?? null, outputSchema: m.outputSchema ?? null, rateLimits: m.rateLimits, timeoutMs: m.timeoutMs, policyTier: m.policyTier },
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
    if (!parsed.success) { sendBadRequest(res, "Invalid tool manifest update", parsed.error.flatten()); return; }

    const m = parsed.data;
    const versionChanged = m.version !== existing.version;

    const [updated] = await db.update(toolMeshToolsTable).set({
      name: m.name, version: m.version, description: m.description,
      domainTags: m.domainTags, policyTier: m.policyTier, allowedEnvironments: m.allowedEnvironments,
      inputSchema: m.inputSchema ?? null, outputSchema: m.outputSchema ?? null,
      rateLimits: m.rateLimits, timeoutMs: m.timeoutMs, failureModes: m.failureModes,
      approvalRequired: m.approvalRequired, owner: m.owner ?? null,
      observabilityHooks: m.observabilityHooks, enabled: m.enabled, updatedAt: new Date(),
    }).where(eq(toolMeshToolsTable.toolId, toolId)).returning();

    if (!updated) { sendNotFound(res, "Tool not found"); return; }

    if (versionChanged) {
      await db.insert(toolMeshToolVersionsTable).values({
        toolDbId: updated.id, version: m.version,
        changelog: (req.body as { changelog?: string }).changelog ?? `Updated to ${m.version}`,
        schemaSnapshot: { inputSchema: m.inputSchema ?? null, outputSchema: m.outputSchema ?? null, rateLimits: m.rateLimits, timeoutMs: m.timeoutMs, policyTier: m.policyTier },
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

router.get("/tools/:toolId/versions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }
    const rows = await db.select().from(toolMeshToolVersionsTable).where(eq(toolMeshToolVersionsTable.toolDbId, tool.id)).orderBy(desc(toolMeshToolVersionsTable.createdAt));
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
      toolDbId: tool.id, version: body.version, changelog: body.changelog ?? null,
      schemaSnapshot: body.schemaSnapshot ?? {}, publishedById: req.user?.id ?? null,
    }).onConflictDoNothing({ target: [toolMeshToolVersionsTable.toolDbId, toolMeshToolVersionsTable.version] }).returning();
    if (!inserted) { sendBadRequest(res, `Version ${body.version} already exists for tool ${toolId}`); return; }
    sendCreated(res, versionRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create tool version");
  }
});

router.get("/tools/:toolId/permissions", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }
    const rows = await db.select().from(toolMeshToolPermissionsTable).where(eq(toolMeshToolPermissionsTable.toolDbId, tool.id)).orderBy(desc(toolMeshToolPermissionsTable.createdAt));
    sendSuccess(res, rows.map(permissionRowToApi));
  } catch (err) {
    handleRouteError(res, err, "Failed to list tool permissions");
  }
});

router.post("/tools/:toolId/permissions", authMiddleware(), requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const toolId = req.params["toolId"] as string;
    const body = req.body as { subjectType?: ToolMeshToolPermission["subjectType"]; subjectId?: string; permission?: ToolMeshToolPermission["permission"]; expiresAt?: string };
    if (!body.subjectType || !body.subjectId) { sendBadRequest(res, "subjectType and subjectId are required"); return; }
    const permission = body.permission ?? "invoke";
    const [tool] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!tool) { sendNotFound(res, "Tool not found"); return; }
    const [inserted] = await db.insert(toolMeshToolPermissionsTable).values({
      toolDbId: tool.id, subjectType: body.subjectType, subjectId: body.subjectId, permission,
      grantedById: req.user?.id ?? null, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    }).onConflictDoNothing({ target: [toolMeshToolPermissionsTable.toolDbId, toolMeshToolPermissionsTable.subjectType, toolMeshToolPermissionsTable.subjectId, toolMeshToolPermissionsTable.permission] }).returning();
    if (!inserted) {
      const [ex] = await db.select().from(toolMeshToolPermissionsTable).where(and(eq(toolMeshToolPermissionsTable.toolDbId, tool.id), eq(toolMeshToolPermissionsTable.subjectType, body.subjectType), eq(toolMeshToolPermissionsTable.subjectId, body.subjectId), eq(toolMeshToolPermissionsTable.permission, permission))).limit(1);
      if (ex) { sendSuccess(res, permissionRowToApi(ex)); return; }
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
    const deleted = await db.delete(toolMeshToolPermissionsTable).where(and(eq(toolMeshToolPermissionsTable.id, permissionId), eq(toolMeshToolPermissionsTable.toolDbId, tool.id))).returning({ id: toolMeshToolPermissionsTable.id });
    if (deleted.length === 0) { sendNotFound(res, "Permission not found"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to revoke tool permission");
  }
});

// ============================================================
// GUARDIAN ACTIONS (governance audit log)
// ============================================================

router.get("/actions", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const outcome = req.query["outcome"] as string | undefined;
    const tier = req.query["tier"] as string | undefined;
    const agentId = req.query["agentId"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      conditions.push(eq(guardianActionsTable.orgId, orgId));
    }
    if (outcome) conditions.push(eq(guardianActionsTable.outcome, outcome));
    if (tier) conditions.push(eq(guardianActionsTable.tier, tier));
    if (agentId) conditions.push(eq(guardianActionsTable.agentId, agentId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(guardianActionsTable).where(where as ReturnType<typeof and>).orderBy(desc(guardianActionsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(guardianActionsTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows, 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list guardian actions");
  }
});

router.get("/actions/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const [action] = await db.select().from(guardianActionsTable).where(eq(guardianActionsTable.id, id)).limit(1);
    if (!action) { sendNotFound(res, "Guardian action not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (action.orgId !== orgId) { sendNotFound(res, "Guardian action not found"); return; }
    }
    sendSuccess(res, action);
  } catch (err) {
    handleRouteError(res, err, "Failed to get guardian action");
  }
});

// ============================================================
// TOOL MESH ACTION APPROVALS (tool invocation approval workflow)
// ============================================================

router.post("/tool-approvals", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const { toolId, action, agentId, sessionId, workflowId, payload } = req.body as { toolId?: string; action?: string; agentId?: string; sessionId?: string; workflowId?: string; payload?: Record<string, unknown> };
    if (!toolId || !action) { sendBadRequest(res, "toolId and action are required"); return; }
    const [toolRow] = await db.select({ id: toolMeshToolsTable.id }).from(toolMeshToolsTable).where(eq(toolMeshToolsTable.toolId, toolId)).limit(1);
    if (!toolRow && !defaultToolRegistry.get(toolId)) { sendNotFound(res, "Tool not found"); return; }
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const [inserted] = await db.insert(toolMeshActionApprovalsTable).values({
      requestId, toolId, action, agentId: agentId ?? null, sessionId: sessionId ?? null,
      workflowId: workflowId ?? null, status: "pending", requestedById: req.user?.id ?? null, payload: payload ?? {},
    }).returning();
    if (!inserted) { handleRouteError(res, new Error("insert returned no row"), "Failed to create action approval"); return; }
    logger.info({ actionId: inserted.id, toolId, action }, "Action approval request created");
    sendCreated(res, approvalRowToApi(inserted));
  } catch (err) {
    handleRouteError(res, err, "Failed to create action approval");
  }
});

router.post("/tool-approvals/:id/approve", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const [existing] = await db.select().from(toolMeshActionApprovalsTable).where(eq(toolMeshActionApprovalsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Action approval not found"); return; }
    if (existing.status !== "pending") { sendBadRequest(res, `Cannot approve action in status: ${existing.status}`); return; }
    const { reason } = req.body as { reason?: string };
    const user = req.user;
    const [updated] = await db.update(toolMeshActionApprovalsTable).set({ status: "approved", approvedById: user?.id ?? null, approvedAt: new Date(), decisionReason: reason ?? null, updatedAt: new Date() }).where(eq(toolMeshActionApprovalsTable.id, id)).returning();
    if (!updated) { sendNotFound(res, "Action approval not found"); return; }
    logger.info({ actionId: id, approvedBy: user?.id, toolId: updated.toolId }, "Action approved");
    sendSuccess(res, approvalRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to approve action");
  }
});

router.post("/tool-approvals/:id/reject", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid action ID"); return; }
    const [existing] = await db.select().from(toolMeshActionApprovalsTable).where(eq(toolMeshActionApprovalsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Action approval not found"); return; }
    if (existing.status !== "pending") { sendBadRequest(res, `Cannot reject action in status: ${existing.status}`); return; }
    const { reason } = req.body as { reason?: string };
    const user = req.user;
    const [updated] = await db.update(toolMeshActionApprovalsTable).set({ status: "rejected", rejectedById: user?.id ?? null, rejectedAt: new Date(), decisionReason: reason ?? null, updatedAt: new Date() }).where(eq(toolMeshActionApprovalsTable.id, id)).returning();
    if (!updated) { sendNotFound(res, "Action approval not found"); return; }
    logger.info({ actionId: id, rejectedBy: user?.id, toolId: updated.toolId }, "Action rejected");
    sendSuccess(res, approvalRowToApi(updated));
  } catch (err) {
    handleRouteError(res, err, "Failed to reject action");
  }
});

// ============================================================
// GUARDIAN APPROVAL REQUESTS (multi-tier governance approvals)
// ============================================================

router.get("/approvals", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst", "compliance", "executive"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const tier = req.query["tier"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      conditions.push(eq(guardianApprovalRequestsTable.orgId, orgId));
    }
    if (status) conditions.push(eq(guardianApprovalRequestsTable.status, status));
    if (tier) conditions.push(eq(guardianApprovalRequestsTable.tier, tier));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(guardianApprovalRequestsTable).where(where as ReturnType<typeof and>).orderBy(desc(guardianApprovalRequestsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(guardianApprovalRequestsTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows, 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list guardian approvals");
  }
});

router.get("/approvals/:requestId", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance", "executive"), async (req: Request, res: Response) => {
  try {
    const requestId = req.params["requestId"] as string;
    const [approval] = await db.select().from(guardianApprovalRequestsTable).where(eq(guardianApprovalRequestsTable.requestId, requestId)).limit(1);
    if (!approval) { sendNotFound(res, "Guardian approval not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (approval.orgId !== orgId) { sendNotFound(res, "Guardian approval not found"); return; }
    }
    sendSuccess(res, approval);
  } catch (err) {
    handleRouteError(res, err, "Failed to get guardian approval");
  }
});

router.post("/approvals/:requestId/review", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance", "executive"), async (req: Request, res: Response) => {
  try {
    const requestId = req.params["requestId"] as string;
    const { decision, note } = req.body as { decision?: string; note?: string };

    if (!decision || !["approved", "rejected"].includes(decision)) { sendBadRequest(res, "decision must be one of: approved, rejected"); return; }

    const [existing] = await db.select().from(guardianApprovalRequestsTable).where(eq(guardianApprovalRequestsTable.requestId, requestId)).limit(1);
    if (!existing) { sendNotFound(res, "Guardian approval not found"); return; }

    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (existing.orgId !== orgId) { sendNotFound(res, "Guardian approval not found"); return; }
    }

    if (existing.status !== "pending") { sendBadRequest(res, `Cannot review approval in status: ${existing.status}`); return; }

    const user = req.user;
    const resolvedApproverId = user?.id?.toString() ?? "unknown";
    const userRoles = user?.roles ?? [];
    const requiredApprovers = (existing.requiredApprovers as string[]) ?? [];
    const currentApprovals = (existing.approvals as Array<Record<string, unknown>>) ?? [];

    const matchingRole = userRoles.find(r => requiredApprovers.includes(r));
    if (!matchingRole && !requiredApprovers.includes("approver")) {
      sendBadRequest(res, `None of your roles [${userRoles.join(", ")}] are in the required approvers set: [${requiredApprovers.join(", ")}]`);
      return;
    }
    const resolvedApproverRole = matchingRole ?? userRoles[0] ?? "operator";

    if (currentApprovals.find(a => a["approverId"] === resolvedApproverId)) {
      sendBadRequest(res, "You have already submitted a review for this approval request");
      return;
    }

    const newApproval = { approverId: resolvedApproverId, approverRole: resolvedApproverRole, decision, note, decidedAt: new Date().toISOString() };
    const updatedApprovals = [...currentApprovals, newApproval];

    const isDualApproval = existing.approvalType === "dual";
    let newStatus: "pending" | "approved" | "rejected" = "pending";

    if (decision === "rejected") {
      newStatus = "rejected";
    } else if (isDualApproval) {
      const approved = updatedApprovals.filter(a => a["decision"] === "approved");
      const distinctIds = new Set(approved.map(a => a["approverId"]));
      const distinctRoles = new Set(approved.map(a => a["approverRole"]));
      if (distinctIds.size >= 2 && distinctRoles.size >= 2) newStatus = "approved";
    } else {
      newStatus = "approved";
    }

    const [updated] = await db.update(guardianApprovalRequestsTable).set({ approvals: updatedApprovals, status: newStatus, updatedAt: new Date() }).where(eq(guardianApprovalRequestsTable.requestId, requestId)).returning();
    logger.info({ requestId, decision, approverId: resolvedApproverId, newStatus }, "Guardian approval reviewed");
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to review guardian approval");
  }
});

// ============================================================
// ROLLBACK EVENTS
// ============================================================

router.get("/rollback-events", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const tier = req.query["tier"] as string | undefined;
    const user = req.user;

    const conditions: Parameters<typeof and>[0][] = [];
    if (!isAdminUser(user)) {
      const orgId = userOrgId(user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      conditions.push(eq(rollbackEventsTable.orgId, orgId));
    }
    if (status) conditions.push(eq(rollbackEventsTable.status, status));
    if (tier) conditions.push(eq(rollbackEventsTable.tier, tier));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      db.select().from(rollbackEventsTable).where(where as ReturnType<typeof and>).orderBy(desc(rollbackEventsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(rollbackEventsTable).where(where as ReturnType<typeof and>),
    ]);

    sendSuccess(res, rows, 200, { page, limit, total: totalRow[0]?.count ?? 0 });
  } catch (err) {
    handleRouteError(res, err, "Failed to list rollback events");
  }
});

router.get("/rollback-events/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid rollback event ID"); return; }
    const [event] = await db.select().from(rollbackEventsTable).where(eq(rollbackEventsTable.id, id)).limit(1);
    if (!event) { sendNotFound(res, "Rollback event not found"); return; }
    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (event.orgId !== orgId) { sendNotFound(res, "Rollback event not found"); return; }
    }
    sendSuccess(res, event);
  } catch (err) {
    handleRouteError(res, err, "Failed to get rollback event");
  }
});

router.post("/rollback-events", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const { actionId, requestId, agentId, tier, triggeredBy, reason, metadata } = req.body as { actionId?: string; requestId?: string; agentId?: string; tier?: string; triggeredBy?: string; reason?: string; metadata?: Record<string, unknown> };
    if (!actionId || !requestId || !tier || !triggeredBy || !reason) { sendBadRequest(res, "actionId, requestId, tier, triggeredBy, and reason are required"); return; }

    const tierParsed = PolicyTierSchema.safeParse(tier);
    if (!tierParsed.success) { sendBadRequest(res, `Invalid tier: ${tier}`); return; }

    const orgId = userOrgId(req.user);
    const [event] = await db.insert(rollbackEventsTable).values({
      actionId, requestId, agentId, orgId, tier: tierParsed.data,
      triggeredBy, reason, metadata: metadata ?? {}, status: "pending",
    }).returning();

    logger.info({ rollbackEventId: event?.id, actionId, requestId, tier }, "Rollback event created");
    sendCreated(res, event);
  } catch (err) {
    handleRouteError(res, err, "Failed to create rollback event");
  }
});

router.patch("/rollback-events/:id/status", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid rollback event ID"); return; }

    const { status } = req.body as { status?: string };
    if (!status || !["pending", "in-progress", "completed", "failed"].includes(status)) { sendBadRequest(res, "status must be one of: pending, in-progress, completed, failed"); return; }

    const [existing] = await db.select().from(rollbackEventsTable).where(eq(rollbackEventsTable.id, id)).limit(1);
    if (!existing) { sendNotFound(res, "Rollback event not found"); return; }

    if (!isAdminUser(req.user)) {
      const orgId = userOrgId(req.user);
      if (orgId === null) { sendForbidden(res, "No organization membership — cannot access governance records"); return; }
      if (existing.orgId !== orgId) { sendNotFound(res, "Rollback event not found"); return; }
    }

    const [updated] = await db.update(rollbackEventsTable).set({
      status: status as "pending" | "in-progress" | "completed" | "failed",
      completedAt: status === "completed" || status === "failed" ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(rollbackEventsTable.id, id)).returning();

    if (!updated) { sendNotFound(res, "Rollback event not found"); return; }
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to update rollback event status");
  }
});

// ============================================================
// DECISION ENGINE — decide (legacy) + evaluate (full 6-tier)
// ============================================================

router.post("/guardian/decide", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { requestId, agentId, sessionId, workflowId, action, domain, tier, context } = req.body as Partial<DecisionRequest>;
    if (!requestId || !action) { sendBadRequest(res, "requestId and action are required"); return; }

    await syncDecisionEngine();

    const decision = sharedDecisionEngine.decide({
      requestId, agentId, sessionId, workflowId, action, domain, tier,
      context: (context as Record<string, unknown>) ?? {},
    });

    sendSuccess(res, decision);
  } catch (err) {
    handleRouteError(res, err, "Failed to evaluate policy decision");
  }
});

router.post("/guardian/evaluate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { requestId, agentId, sessionId, workflowId, action, domain, tier, model, toolId, actionCount, environment, memoryScope, isExternalComms, context } = req.body as Partial<DecisionRequest>;

    if (!requestId || !action) { sendBadRequest(res, "requestId and action are required"); return; }

    await syncDecisionEngine();

    const request: DecisionRequest = {
      requestId, agentId, sessionId, workflowId, action, domain, tier,
      model, toolId, actionCount, environment, memoryScope, isExternalComms,
      context: (context as Record<string, unknown>) ?? {},
    };

    const result = sharedDecisionEngine.evaluate(request);

    const user = req.user;
    const orgId = userOrgId(user);
    const isFailClosedOutcome = result.outcome === "require-approval" || result.outcome === "require-dual-approval" || result.outcome === "block";
    const contextPayload = (context as Record<string, unknown>) ?? {};
    const { redacted: redactedPayload, redactedFields } = redactPayload(contextPayload);

    try {
      const tierParsed = tier ? PolicyTierSchema.safeParse(tier) : { success: false as const };
      const tierValue = tierParsed.success ? tierParsed.data : (tier ?? "unknown");

      const [actionRecord] = await db.insert(guardianActionsTable).values({
        requestId, agentId, sessionId, workflowId, orgId,
        tier: tierValue, action, toolId, model, environment,
        outcome: result.outcome, matchedRuleId: result.matchedRuleId, reason: result.reason,
        rollbackRequired: result.rollbackRequired, redactApplied: result.redactApplied || redactedFields.length > 0,
        controlViolations: result.controlViolations, payload: redactedPayload,
        decidedAt: new Date(result.decidedAt),
      }).onConflictDoNothing().returning();

      if (result.outcome === "require-approval" || result.outcome === "require-dual-approval") {
        const approvalType = result.outcome === "require-dual-approval" ? "dual" : "single";
        await db.insert(guardianApprovalRequestsTable).values({
          requestId, agentId, sessionId, workflowId, orgId,
          tier: tierValue, action, toolId, approvalType, status: "pending",
          requiredApprovers: result.requiredApprovers, approvals: [], payload: redactedPayload,
        }).onConflictDoNothing();
      }

      logger.info({
        requestId, tier, action, outcome: result.outcome, actionId: actionRecord?.id,
        redactedFields: redactedFields.length > 0 ? redactedFields : undefined,
      }, "Guardian evaluate completed");
    } catch (dbErr) {
      logger.error({ err: dbErr, requestId }, "Failed to persist guardian action");
      if (isFailClosedOutcome) {
        sendServiceUnavailable(res, "Governance persistence failed — action blocked for safety");
        return;
      }
    }

    sendSuccess(res, { ...result, redactedFields: redactedFields.length > 0 ? redactedFields : undefined });
  } catch (err) {
    handleRouteError(res, err, "Failed to evaluate guardian policy");
  }
});

export default router;
