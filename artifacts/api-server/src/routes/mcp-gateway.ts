import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";

const router: IRouter = Router();

type EnforcementMode = "log-only" | "block" | "quarantine";
type Tier = "critical" | "elevated" | "standard";
type Decision = "allowed" | "logged" | "blocked" | "quarantined";

interface GatewayRule {
  id: string;
  name: string;
  agentClass: string;
  tier: Tier;
  enforcementMode: EnforcementMode;
  allowedMcpServers: string[];
  allowedTools: string[];
  allowedEgressDomains: string[];
  pendingModeChange?: {
    requestedMode: EnforcementMode;
    requestedBy: string;
    requestedAt: string;
    guardianApprovalId: string;
  };
}

interface GatewayEvent {
  id: string;
  ruleId: string;
  agentClass: string;
  mcpServerId: string;
  tool: string;
  egressDomain?: string;
  decision: Decision;
  reason: string;
  enforcementMode: EnforcementMode;
  linkedExposureId?: string;
  occurredAt: string;
}

const GATEWAY_ENDPOINT = process.env["MCP_GATEWAY_ENDPOINT"]
  ?? "https://mcp-gateway.sentra.szl.local/v1/proxy";

const rules = new Map<string, GatewayRule>([
  ["rule-claude-standard", {
    id: "rule-claude-standard",
    name: "Claude Standard Policy",
    agentClass: "claude-desktop",
    tier: "standard",
    enforcementMode: "log-only",
    allowedMcpServers: ["mcp-github", "mcp-filesystem", "mcp-sequential-thinking"],
    allowedTools: ["read_file", "list_directory", "brave_web_search", "sequentialthinking"],
    allowedEgressDomains: ["api.github.com", "api.search.brave.com"],
  }],
  ["rule-cursor-elevated", {
    id: "rule-cursor-elevated",
    name: "Cursor Elevated Policy",
    agentClass: "cursor",
    tier: "elevated",
    enforcementMode: "block",
    allowedMcpServers: ["mcp-github", "mcp-filesystem", "mcp-sequential-thinking"],
    allowedTools: ["read_file", "write_file", "list_directory", "create_pull_request", "sequentialthinking"],
    allowedEgressDomains: ["api.github.com"],
  }],
  ["rule-codex-restricted", {
    id: "rule-codex-restricted",
    name: "Codex CLI Restricted Policy",
    agentClass: "codex-cli",
    tier: "critical",
    enforcementMode: "quarantine",
    allowedMcpServers: ["mcp-filesystem"],
    allowedTools: ["read_file", "write_file"],
    allowedEgressDomains: [],
  }],
]);

const events: GatewayEvent[] = [];
const stats = { calls: 0, blocked: 0, quarantined: 0, logged: 0, allowed: 0 };
const startedAt = Date.now();

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

function recordEvent(evt: GatewayEvent) {
  events.unshift(evt);
  if (events.length > 200) events.length = 200;
  stats.calls++;
  if (evt.decision === "blocked") stats.blocked++;
  else if (evt.decision === "quarantined") stats.quarantined++;
  else if (evt.decision === "logged") stats.logged++;
  else stats.allowed++;
}

function findRuleForAgentClass(agentClass: string): GatewayRule | undefined {
  for (const rule of rules.values()) {
    if (rule.agentClass === agentClass) return rule;
  }
  return undefined;
}

router.get("/mcp-gateway/config", (_req: Request, res: Response) => {
  try {
    const uptime = Math.floor((Date.now() - startedAt) / 1000);
    return sendSuccess(res, {
      endpoint: GATEWAY_ENDPOINT,
      status: "online" as const,
      protocolVersion: "2024-11-05",
      uptimeSeconds: uptime,
      stats: { ...stats },
      rules: Array.from(rules.values()),
    });
  } catch (err) {
    return handleRouteError(res, err, "mcp-gateway-config");
  }
});

router.get("/mcp-gateway/events", (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query["limit"] ?? 50), 200);
    return sendSuccess(res, { events: events.slice(0, limit), total: events.length });
  } catch (err) {
    return handleRouteError(res, err, "mcp-gateway-events");
  }
});

router.post("/mcp-gateway/proxy", (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const agentClass = String(body["agentClass"] ?? "");
    const mcpServerId = String(body["mcpServerId"] ?? "");
    const tool = String(body["tool"] ?? "");
    const egressDomain = body["egressDomain"] ? String(body["egressDomain"]) : undefined;

    if (!agentClass || !mcpServerId || !tool) {
      return sendError(res, "agentClass, mcpServerId, and tool are required", 400);
    }

    const rule = findRuleForAgentClass(agentClass);
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
      linkedExposureId = `exp-gw-${randomUUID().slice(0, 8)}`;
      effectiveReason = evaluation.violation
        ? `Quarantine: ${evaluation.reason}`
        : "Quarantine: agent class is fully isolated from MCP traffic";
    } else if (evaluation.violation) {
      if (rule.enforcementMode === "log-only") {
        decision = "logged";
      } else {
        decision = "blocked";
      }
      linkedExposureId = `exp-gw-${randomUUID().slice(0, 8)}`;
    }

    const evt: GatewayEvent = {
      id: `gw-evt-${randomUUID().slice(0, 8)}`,
      ruleId: rule.id,
      agentClass,
      mcpServerId,
      tool,
      egressDomain,
      decision,
      reason: effectiveReason,
      enforcementMode: rule.enforcementMode,
      linkedExposureId,
      occurredAt: new Date().toISOString(),
    };
    recordEvent(evt);

    const passthrough = decision === "allowed" || decision === "logged";
    return sendSuccess(res, {
      decision,
      passthrough,
      reason: effectiveReason,
      ruleId: rule.id,
      enforcementMode: rule.enforcementMode,
      linkedExposureId,
      eventId: evt.id,
    });
  } catch (err) {
    return handleRouteError(res, err, "mcp-gateway-proxy");
  }
});

router.patch("/mcp-gateway/rules/:ruleId/enforcement-mode", (req: Request, res: Response) => {
  try {
    const ruleId = req.params["ruleId"];
    if (!ruleId) return sendError(res, "ruleId is required", 400);
    const rule = rules.get(ruleId);
    if (!rule) return sendError(res, `Rule '${ruleId}' not found`, 404);

    const body = (req.body ?? {}) as Record<string, unknown>;
    const requestedMode = String(body["mode"] ?? "") as EnforcementMode;
    if (!["log-only", "block", "quarantine"].includes(requestedMode)) {
      return sendError(res, "mode must be one of: log-only, block, quarantine", 400);
    }
    const requestedBy = String(body["requestedBy"] ?? "operator");

    if (rule.tier === "critical" && rule.enforcementMode !== requestedMode) {
      rule.pendingModeChange = {
        requestedMode,
        requestedBy,
        requestedAt: new Date().toISOString(),
        guardianApprovalId: `approval-mcp-gw-${randomUUID().slice(0, 8)}`,
      };
      rules.set(ruleId, rule);
      return sendSuccess(res, {
        applied: false,
        pendingApproval: true,
        rule,
        message: "Critical-tier mode changes require Guardian approval before taking effect.",
      });
    }

    rule.enforcementMode = requestedMode;
    rule.pendingModeChange = undefined;
    rules.set(ruleId, rule);
    return sendSuccess(res, { applied: true, pendingApproval: false, rule });
  } catch (err) {
    return handleRouteError(res, err, "mcp-gateway-mode");
  }
});

export default router;
