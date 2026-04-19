import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import {
  db,
  agentMeshContainmentRulesTable,
  agentMeshGatewayEventsTable,
  agentMeshExposuresTable,
  approvalRequestsTable,
} from "@szl-holdings/db";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";

const router: IRouter = Router();

type EnforcementMode = "log-only" | "block" | "quarantine";
type Tier = "critical" | "elevated" | "standard";
type Decision = "allowed" | "logged" | "blocked" | "quarantined";

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

const GATEWAY_ENDPOINT = process.env["MCP_GATEWAY_ENDPOINT"]
  ?? "https://mcp-gateway.sentra.szl.local/v1/proxy";

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
    id: "rule-claude-standard",
    name: "Claude Standard Policy",
    agentClass: "claude-desktop",
    tier: "standard",
    enforcementMode: "log-only",
    allowedMcpServers: ["mcp-github", "mcp-filesystem", "mcp-sequential-thinking"],
    allowedTools: ["read_file", "list_directory", "brave_web_search", "sequentialthinking"],
    allowedEgressDomains: ["api.github.com", "api.search.brave.com"],
  },
  {
    id: "rule-cursor-elevated",
    name: "Cursor Elevated Policy",
    agentClass: "cursor",
    tier: "elevated",
    enforcementMode: "block",
    allowedMcpServers: ["mcp-github", "mcp-filesystem", "mcp-sequential-thinking"],
    allowedTools: ["read_file", "write_file", "list_directory", "create_pull_request", "sequentialthinking"],
    allowedEgressDomains: ["api.github.com"],
  },
  {
    id: "rule-codex-restricted",
    name: "Codex CLI Restricted Policy",
    agentClass: "codex-cli",
    tier: "critical",
    enforcementMode: "quarantine",
    allowedMcpServers: ["mcp-filesystem"],
    allowedTools: ["read_file", "write_file"],
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
      logger.warn({ err }, "[mcp-gateway] failed to seed default containment rules");
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
    tier: (row.tier as Tier) ?? "standard",
    enforcementMode: (row.enforcementMode as EnforcementMode) ?? "log-only",
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
    .where(and(
      isNull(agentMeshContainmentRulesTable.orgId),
      eq(agentMeshContainmentRulesTable.agentClass, agentClass),
    ))
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

function evaluateRule(rule: GatewayRule, params: {
  mcpServerId: string;
  tool: string;
  egressDomain?: string;
}): { violation: boolean; reason: string } {
  if (!rule.allowedMcpServers.includes(params.mcpServerId)) {
    return { violation: true, reason: `MCP server ${params.mcpServerId} not in allowlist` };
  }
  if (!rule.allowedTools.includes(params.tool)) {
    return { violation: true, reason: `Tool '${params.tool}' not permitted by rule` };
  }
  if (params.egressDomain && rule.allowedEgressDomains.length > 0 && !rule.allowedEgressDomains.includes(params.egressDomain)) {
    return { violation: true, reason: `Egress domain ${params.egressDomain} not in allowlist` };
  }
  if (params.egressDomain && rule.allowedEgressDomains.length === 0) {
    return { violation: true, reason: `Egress blocked for tier '${rule.tier}'` };
  }
  return { violation: false, reason: "matches policy" };
}

async function loadStats(): Promise<{
  calls: number;
  blocked: number;
  quarantined: number;
  logged: number;
  allowed: number;
}> {
  const rows = await db
    .select({
      decision: agentMeshGatewayEventsTable.decision,
      c: count(),
    })
    .from(agentMeshGatewayEventsTable)
    .groupBy(agentMeshGatewayEventsTable.decision);
  const stats = { calls: 0, blocked: 0, quarantined: 0, logged: 0, allowed: 0 };
  for (const r of rows) {
    const c = Number(r.c ?? 0);
    stats.calls += c;
    if (r.decision === "blocked") stats.blocked += c;
    else if (r.decision === "quarantined") stats.quarantined += c;
    else if (r.decision === "logged") stats.logged += c;
    else if (r.decision === "allowed") stats.allowed += c;
  }
  return stats;
}

function buildExposureRow(opts: {
  rule: GatewayRule;
  decision: Decision;
  reason: string;
  mcpServerId: string;
  tool: string;
}) {
  const id = `exp-gw-${randomUUID().slice(0, 8)}`;
  const severity = opts.decision === "quarantined"
    ? "critical"
    : opts.rule.tier === "critical" ? "high" : "medium";
  return {
    id,
    orgId: null,
    title: opts.decision === "quarantined"
      ? `Gateway quarantined ${opts.rule.agentClass} call to ${opts.mcpServerId}/${opts.tool}`
      : `Gateway blocked ${opts.rule.agentClass} call to ${opts.mcpServerId}/${opts.tool}`,
    severity,
    affectedAgentIds: [] as string[],
    affectedSecretIds: [] as string[],
    affectedMcpIds: [opts.mcpServerId],
    explanation: opts.reason,
    owaspCategory: "LLM06: Excessive Agency",
    owaspRef: "OWASP-LLM06",
    cveRefs: [] as string[],
    fixType: "scope-token",
    fixLabel: `Tighten ${opts.rule.name} or expand allowlist`,
    proofHash: "",
    status: "open",
    detectedAt: new Date(),
    updatedAt: new Date(),
  };
}

router.get("/mcp-gateway/config", async (_req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const [rules, stats] = await Promise.all([loadRules(), loadStats()]);
    const uptime = Math.floor((Date.now() - startedAt) / 1000);
    return sendSuccess(res, {
      endpoint: GATEWAY_ENDPOINT,
      status: "online" as const,
      protocolVersion: "2024-11-05",
      uptimeSeconds: uptime,
      stats,
      rules,
    });
  } catch (err) {
    return handleRouteError(res, err, "mcp-gateway-config");
  }
});

router.get("/mcp-gateway/events", async (req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const limit = Math.min(Number(req.query["limit"] ?? 50), 200);
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
    return handleRouteError(res, err, "mcp-gateway-events");
  }
});

router.post("/mcp-gateway/proxy", async (req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const agentClass = String(body["agentClass"] ?? "");
    const mcpServerId = String(body["mcpServerId"] ?? "");
    const tool = String(body["tool"] ?? "");
    const egressDomain = body["egressDomain"] ? String(body["egressDomain"]) : undefined;

    if (!agentClass || !mcpServerId || !tool) {
      return sendError(res, "agentClass, mcpServerId, and tool are required", 400);
    }

    const rule = await findRuleForAgentClass(agentClass);
    if (!rule) {
      return sendError(res, `No containment rule registered for agent class '${agentClass}'`, 404);
    }

    const evaluation = evaluateRule(rule, { mcpServerId, tool, egressDomain });
    let decision: Decision = "allowed";
    let linkedExposureId: string | undefined;
    let effectiveReason = evaluation.reason;

    if (rule.enforcementMode === "quarantine") {
      // Quarantine mode rejects every call from this agent class until the
      // rule is cleared, regardless of whether the specific call violates.
      decision = "quarantined";
      effectiveReason = evaluation.violation
        ? `Quarantine: ${evaluation.reason}`
        : "Quarantine: agent class is fully isolated from MCP traffic";
    } else if (evaluation.violation) {
      if (rule.enforcementMode === "log-only") {
        decision = "logged";
      } else {
        decision = "blocked";
      }
    }

    const eventId = `gw-evt-${randomUUID().slice(0, 8)}`;
    const occurredAt = new Date();
    const exposureRow = (decision === "blocked" || decision === "quarantined")
      ? buildExposureRow({ rule, decision, reason: effectiveReason, mcpServerId, tool })
      : null;
    const incrementViolation = decision !== "allowed";

    // All persistence — exposure (if any), gateway event, and rule
    // counters — runs in a single transaction so we never return a
    // linkedExposureId or eventId that wasn't actually committed.
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
        "[mcp-gateway] failed to persist gateway decision; rejecting request",
      );
      return sendError(res, "Failed to persist gateway decision", 500);
    }

    linkedExposureId = exposureRow ? exposureRow.id : undefined;

    const passthrough = decision === "allowed" || decision === "logged";
    return sendSuccess(res, {
      decision,
      passthrough,
      reason: effectiveReason,
      ruleId: rule.id,
      enforcementMode: rule.enforcementMode,
      linkedExposureId,
      eventId,
    });
  } catch (err) {
    return handleRouteError(res, err, "mcp-gateway-proxy");
  }
});

router.patch("/mcp-gateway/rules/:ruleId/enforcement-mode", async (req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const ruleId = req.params["ruleId"];
    if (!ruleId) return sendError(res, "ruleId is required", 400);
    const rule = await findRuleById(ruleId);
    if (!rule) return sendError(res, `Rule '${ruleId}' not found`, 404);

    const body = (req.body ?? {}) as Record<string, unknown>;
    const requestedMode = String(body["mode"] ?? "") as EnforcementMode;
    if (!["log-only", "block", "quarantine"].includes(requestedMode)) {
      return sendError(res, "mode must be one of: log-only, block, quarantine", 400);
    }
    const requestedBy = String(body["requestedBy"] ?? "operator");

    if (rule.tier === "critical" && rule.enforcementMode !== requestedMode) {
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
              resourceType: "policy",
              resourceId: ruleId,
              title: `MCP gateway: change ${rule.name} enforcement to '${requestedMode}'`,
              description:
                `Critical-tier containment rule '${rule.name}' (agent class ${rule.agentClass}) ` +
                `requested mode change from '${rule.enforcementMode}' to '${requestedMode}'.`,
              actionClass: "policy.enforcement-mode",
              priority: "high",
              status: "pending",
              requestedByRole: requestedBy,
              requiredApproverRole: "guardian",
              correlationId: ruleId,
              serviceAttribution: "mcp-gateway",
              payload: {
                ruleId,
                currentMode: rule.enforcementMode,
                requestedMode,
                tier: rule.tier,
              },
            })
            .returning({ id: approvalRequestsTable.id });
          if (!inserted?.id) {
            throw new Error("approval_requests insert returned no id");
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
        logger.error({ err, ruleId }, "[mcp-gateway] failed to enqueue guardian approval — rejecting mode change");
        return sendError(res, "Failed to enqueue Guardian approval for critical-tier mode change", 500);
      }

      const updated = await findRuleById(ruleId);
      return sendSuccess(res, {
        applied: false,
        pendingApproval: true,
        rule: updated ?? { ...rule, pendingModeChange },
        message: "Critical-tier mode changes require Guardian approval before taking effect.",
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
    return handleRouteError(res, err, "mcp-gateway-mode");
  }
});

export default router;
