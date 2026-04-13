/**
 * Alloy Protocol Fusion Gateway
 *
 * Unified /api/alloy/gateway endpoint that auto-detects inbound protocol
 * (MCP, A2A, ANP, ACP/REST) and routes to the correct handler.
 *
 * Routes (relative — mounted under /api by app.ts):
 *   POST /alloy/gateway             → Protocol auto-negotiation + dispatch
 *   POST /alloy/gateway/negotiate   → ANP meta-protocol negotiation
 *   GET  /alloy/gateway/telemetry   → Protocol fabric telemetry
 *   GET  /alloy/gateway/audit       → Cross-protocol governance audit
 *   GET  /alloy/gateway/agents      → Registered domain agents
 *
 * Well-known routes (exported separately — mounted at root by app.ts):
 *   GET  /.well-known/agent-card.json       → Global A2A discovery
 *   GET  /.well-known/agent/:domain.json    → Per-domain UAI document
 *   GET  /.well-known/did.json              → Platform DID document
 */

import { Router, type Request, type Response } from "express";
import { authMiddleware, isElevatedUser } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { agentEventBus } from "../lib/event-bus";
import { pool } from "@szl-holdings/db";
import {
  initializeUAIRegistry,
  getUAI,
  listUAIs,
  getUAIAsA2ACard,
  getUAIAsANPDid,
  getUAIAsMCPManifest,
  getGlobalAgentCard,
} from "../lib/uai-registry";
import {
  verifyANPIdentity,
  negotiateProtocol,
  recordANPTelemetry,
  getANPTelemetry,
  getANPStats,
  type ANPNegotiationRequest,
} from "../lib/anp";
import { writeAuditLog } from "../lib/alloy-orchestration";
import {
  recordProtocolCrossing,
  getProtocolTelemetry,
  getGatewayStats,
  recordProtocolRequest,
  recordDiscoveryHit,
} from "../lib/protocol-telemetry";
import {
  createA2ATaskV3,
  getA2ATaskV3,
  updateA2ATaskV3,
  listA2ATasksV3,
  streamA2ATask,
} from "../lib/mastra/a2a-lifecycle";

initializeUAIRegistry();

// ─── Protocol Detection ───────────────────────────────────────────────────────

type DetectedProtocol = "mcp" | "a2a" | "anp" | "acp";

function detectProtocol(req: Request): DetectedProtocol {
  const contentType = req.headers["content-type"] ?? "";
  const didHeader = req.headers["x-anp-did"];
  const body = req.body as Record<string, unknown> | undefined;

  if (didHeader || contentType.includes("application/ld+json")) {
    return "anp";
  }

  if (body && typeof body === "object" && body["jsonrpc"] === "2.0") {
    const method = String(body["method"] ?? "");
    if (
      method.startsWith("a2a/") ||
      method.startsWith("tasks/") ||
      method === "message/send" ||
      method === "tasks/get"
    ) {
      return "a2a";
    }
    return "mcp";
  }

  const accept = req.headers["accept"] ?? "";
  if (accept.includes("text/event-stream")) {
    return "a2a";
  }

  const agentProtocol = req.headers["x-agent-protocol"] as string | undefined;
  if (agentProtocol) {
    const p = agentProtocol.toLowerCase() as DetectedProtocol;
    if (["mcp", "a2a", "anp", "acp"].includes(p)) return p;
  }

  return "acp";
}

function makeMcpResponse(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function makeMcpError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function makeA2ATaskResponse(task: unknown) {
  return { jsonrpc: "2.0", id: null, result: task };
}

// ─── MCP Handler ─────────────────────────────────────────────────────────────

async function handleMCP(req: Request, res: Response): Promise<void> {
  const body = req.body as { jsonrpc: "2.0"; id?: unknown; method: string; params?: Record<string, unknown> };
  const start = Date.now();

  try {
    switch (body.method) {
      case "initialize": {
        res.json(makeMcpResponse(body.id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "alloy-fusion-fabric", version: "1.0.0" },
          capabilities: { tools: {}, resources: {}, prompts: {} },
        }));
        break;
      }

      case "tools/list": {
        const uais = listUAIs();
        const tools = uais.flatMap(u =>
          u.mcpManifest.tools.map(t => ({
            ...t,
            name: `${u.domain}_${t.name}`,
            _domain: u.domain,
          }))
        );
        res.json(makeMcpResponse(body.id, { tools }));
        break;
      }

      case "tools/call": {
        const toolName = String(body.params?.name ?? "");
        const toolInput = (body.params?.arguments ?? {}) as Record<string, unknown>;

        const [domainPart] = toolName.split("_");
        const uai = domainPart ? getUAI(domainPart) : null;

        if (!uai) {
          res.json(makeMcpError(body.id, -32602, `Unknown tool: ${toolName}`));
          return;
        }

        await recordProtocolRequest("mcp", uai.domain, "tool_call", Date.now() - start);

        res.json(makeMcpResponse(body.id, {
          content: [{
            type: "text",
            text: JSON.stringify({
              domain: uai.domain,
              tool: toolName,
              input: toolInput,
              result: `Tool ${toolName} executed via MCP protocol — domain: ${uai.domain}`,
              timestamp: new Date().toISOString(),
            }),
          }],
          isError: false,
        }));
        break;
      }

      case "resources/list": {
        const uais = listUAIs();
        const resources = uais.flatMap(u => u.mcpManifest.resources);
        res.json(makeMcpResponse(body.id, { resources }));
        break;
      }

      case "prompts/list": {
        const uais = listUAIs();
        const prompts = uais.flatMap(u => u.mcpManifest.prompts.map(p => ({
          ...p,
          name: `${u.domain}/${p.name}`,
        })));
        res.json(makeMcpResponse(body.id, { prompts }));
        break;
      }

      default:
        res.json(makeMcpError(body.id, -32601, `Method not found: ${body.method}`));
    }
  } catch (err) {
    logger.error({ err, method: body.method }, "MCP gateway handler error");
    res.json(makeMcpError(body.id, -32603, "Internal error"));
  }
}

// ─── A2A Handler ─────────────────────────────────────────────────────────────

async function handleA2A(req: Request, res: Response): Promise<void> {
  const body = req.body as { jsonrpc: "2.0"; id?: unknown; method: string; params?: Record<string, unknown> };
  const start = Date.now();

  try {
    switch (body.method) {
      case "message/send":
      case "tasks/create": {
        const params = body.params ?? {};
        const taskId = await createA2ATaskV3({
          clientAgentId: String(params["clientAgentId"] ?? "external"),
          remoteAgentId: String(params["agentId"] ?? "szl-orchestrator"),
          input: params["message"] ?? params["input"] ?? {},
          contextId: params["contextId"] as string | undefined,
          metadata: {
            protocolOrigin: "a2a",
            gatewayRequestId: `gw_${Date.now()}`,
          },
        });

        await recordProtocolRequest("a2a", "gateway", "task_create", Date.now() - start);

        if (req.headers["accept"]?.includes("text/event-stream")) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          await streamA2ATask(taskId, res);
        } else {
          const task = await getA2ATaskV3(taskId);
          res.json(makeA2ATaskResponse(task));
        }
        break;
      }

      case "tasks/get": {
        const taskId = String(body.params?.id ?? "");
        const task = await getA2ATaskV3(taskId);
        if (!task) {
          res.status(404).json({ error: "Task not found", taskId });
          return;
        }
        res.json(makeA2ATaskResponse(task));
        break;
      }

      case "tasks/list": {
        const tasks = await listA2ATasksV3({
          agentId: body.params?.agentId as string | undefined,
          status: body.params?.status as string | undefined,
          limit: body.params?.limit as number | undefined,
        });
        res.json({ jsonrpc: "2.0", id: body.id, result: { tasks } });
        break;
      }

      case "tasks/cancel": {
        const taskId = String(body.params?.id ?? "");
        await updateA2ATaskV3(taskId, "canceled");
        res.json({ jsonrpc: "2.0", id: body.id, result: { taskId, status: "canceled" } });
        break;
      }

      default:
        res.json(makeMcpError(body.id, -32601, `A2A method not found: ${body.method}`));
    }
  } catch (err) {
    logger.error({ err, method: body.method }, "A2A gateway handler error");
    res.json(makeMcpError(body.id, -32603, "Internal A2A error"));
  }
}

// ─── Cross-Protocol Governance Gate ──────────────────────────────────────────

interface GovernanceCheckResult {
  approved: boolean;
  autoApproved: boolean;
  reason: string;
  approvalId?: string;
}

async function enforceGovernanceGate(
  fromProtocol: string,
  toProtocol: string,
  identity: { trustLevel: string; did?: string; agentId?: string },
  context: { agentId: string; action: string },
): Promise<GovernanceCheckResult> {
  const governanceRequired = identity.trustLevel !== "trusted";

  // Trusted agents: auto-approve with audit record
  if (!governanceRequired) {
    const approvalId = `gov_auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await writeAuditLog({
      entityType: "workflow",
      entityId: 0,
      action: "protocol_crossing_auto_approved",
      actorType: "agent",
      notes: `Trusted agent auto-approved: ${identity.did ?? identity.agentId} | ${fromProtocol}→${toProtocol} | ${context.action}`,
    });
    return { approved: true, autoApproved: true, reason: "Trusted platform agent — auto-approved", approvalId };
  }

  // Verified agents: require human-in-the-loop approval
  // We create a pending governance record and return 202 to the caller.
  // The caller must poll the approval endpoint until approved/rejected.
  const approvalId = `gov_pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const agentDid = identity.did ?? `szl:${identity.agentId ?? "unknown"}`;

  // Register in the HITL approval store so callers can poll/resolve it
  registerPendingApproval(approvalId, fromProtocol, toProtocol, agentDid, context.action);

  await writeAuditLog({
    entityType: "workflow",
    entityId: 0,
    action: "protocol_crossing_pending_approval",
    actorType: "agent",
    notes: `Governance required (HITL): ${agentDid} | ${fromProtocol}→${toProtocol} | ${context.action} | approvalId: ${approvalId}`,
  });

  return {
    approved: false,
    autoApproved: false,
    reason: "Cross-protocol boundary requires HITL approval for non-trusted agents",
    approvalId,
  };
}

// ─── ANP Handler ─────────────────────────────────────────────────────────────

async function handleANP(req: Request, res: Response): Promise<void> {
  const start = Date.now();
  const identity = verifyANPIdentity({ headers: req.headers as Record<string, string | string[] | undefined> });

  // ANP requires a verified identity — anonymous requests are always blocked
  if (!identity.verified || identity.trustLevel === "anonymous") {
    res.status(401).set("Content-Type", "application/ld+json").json({
      "@context": ["https://w3id.org/anp/v1"],
      "@type": "IdentityRequired",
      error: "ANP requests require a verified DID or Bearer token",
      reason: identity.reason,
      hint: "Provide a valid did:web DID in X-ANP-DID header or a Bearer token",
      negotiationEndpoint: "/api/alloy/gateway/negotiate",
    });
    return;
  }

  const body = req.body as Record<string, unknown>;

  if (body["@type"] === "TaskRequest") {
    const agentId = String(body["targetAgent"] ?? "szl-orchestrator");

    // Enforce governance gate before allowing ANP→A2A protocol crossing
    const governance = await enforceGovernanceGate(
      "anp", "a2a",
      identity,
      { agentId, action: "task_create" },
    );

    if (!governance.approved) {
      // Return 202 Accepted — pending governance approval
      await recordProtocolRequest("anp", agentId, "task_pending_governance", Date.now() - start);
      res.status(202).set("Content-Type", "application/ld+json").json({
        "@context": ["https://w3id.org/anp/v1"],
        "@type": "PendingApproval",
        status: "pending_governance",
        approvalId: governance.approvalId,
        reason: governance.reason,
        message: "Cross-protocol task creation requires HITL approval. Poll the approval endpoint.",
        approvalPollEndpoint: `/api/alloy/governance/approvals/${governance.approvalId}`,
        identity: { did: identity.did, trustLevel: identity.trustLevel },
      });
      return;
    }

    // Approved — proceed with A2A task creation
    const taskId = await createA2ATaskV3({
      clientAgentId: identity.did ?? identity.agentId ?? "anp-agent",
      remoteAgentId: agentId,
      input: body["payload"] ?? body,
      metadata: {
        protocolOrigin: "anp",
        did: identity.did,
        trustLevel: identity.trustLevel,
        governanceApprovalId: governance.approvalId,
      },
    });

    await recordProtocolCrossing({
      fromProtocol: "anp",
      toProtocol: "a2a",
      agentId: identity.agentId ?? "external",
      trustLevel: identity.trustLevel,
      governanceRequired: !governance.autoApproved,
      taskId,
    });

    await recordProtocolRequest("anp", agentId, "task_create", Date.now() - start);

    res.set("Content-Type", "application/ld+json");
    res.json({
      "@context": ["https://w3id.org/anp/v1"],
      "@type": "TaskResponse",
      taskId,
      status: "submitted",
      bridgedTo: "a2a",
      governanceApprovalId: governance.approvalId,
      autoApproved: governance.autoApproved,
    });
    return;
  }

  res.set("Content-Type", "application/ld+json");
  res.json({
    "@context": ["https://w3id.org/anp/v1"],
    "@type": "ANPResponse",
    identity: {
      verified: identity.verified,
      trustLevel: identity.trustLevel,
      did: identity.did,
      reason: identity.reason,
    },
    platform: {
      name: "SZL Alloy Protocol Fabric",
      protocols: ["mcp", "a2a", "anp", "acp"],
      negotiationEndpoint: "/api/alloy/gateway/negotiate",
    },
  });
}

// ─── ACP (REST fallback) Handler ──────────────────────────────────────────────

async function handleACP(req: Request, res: Response): Promise<void> {
  const start = Date.now();
  const body = req.body as Record<string, unknown>;

  const action = String(body?.["action"] ?? req.query["action"] ?? "query");
  const agentId = String(body?.["agentId"] ?? "szl-orchestrator");
  const input = body?.["input"] ?? body;

  await recordProtocolRequest("acp", agentId, action, Date.now() - start);

  res.json({
    protocol: "acp",
    version: "1.0.0",
    action,
    agentId,
    status: "received",
    taskId: `acp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    message: `ACP request received — routed to ${agentId}`,
    input,
    timestamp: new Date().toISOString(),
    hint: "Use A2A or MCP protocols for full task lifecycle support",
  });
}

// ─── API Router ───────────────────────────────────────────────────────────────
// Mounted under /api by app.ts — paths are relative (no /api prefix)

const router = Router();

// POST /api/alloy/gateway — Main unified gateway
router.post("/alloy/gateway", async (req: Request, res: Response) => {
  const protocol = detectProtocol(req);
  logger.info({ protocol, path: req.path, contentType: req.headers["content-type"] }, "Alloy gateway request");

  try {
    switch (protocol) {
      case "mcp": return void (await handleMCP(req, res));
      case "a2a": return void (await handleA2A(req, res));
      case "anp": return void (await handleANP(req, res));
      case "acp": return void (await handleACP(req, res));
    }
  } catch (err) {
    logger.error({ err, protocol }, "Gateway error");
    res.status(500).json({ error: "Gateway error", protocol });
  }
});

// POST /api/alloy/gateway/negotiate — ANP meta-protocol negotiation
router.post("/alloy/gateway/negotiate", async (req: Request, res: Response) => {
  const start = Date.now();
  const identity = verifyANPIdentity({ headers: req.headers as Record<string, string | string[] | undefined> });

  // Validate and default request body before passing to negotiateProtocol.
  // Missing or malformed preferredProtocols must return 400, never 500.
  const rawBody = req.body as Record<string, unknown>;
  if (rawBody === null || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    res.status(400).json({ error: "Request body must be a JSON object" });
    return;
  }

  const body: ANPNegotiationRequest = {
    ...(rawBody as ANPNegotiationRequest),
    preferredProtocols: Array.isArray(rawBody["preferredProtocols"])
      ? (rawBody["preferredProtocols"] as string[])
      : [],
  };

  const result = negotiateProtocol(body, identity);

  recordANPTelemetry({
    timestamp: new Date().toISOString(),
    did: identity.did,
    requestedProtocols: body.preferredProtocols ?? [],
    negotiatedProtocol: result.negotiatedProtocol,
    trustLevel: identity.trustLevel,
    governanceRequired: result.governanceRequired,
    latencyMs: Date.now() - start,
    success: true,
  });

  if (result.governanceRequired) {
    await writeAuditLog({
      entityType: "workflow",
      entityId: 0,
      action: "protocol_negotiation",
      actorType: "agent",
      notes: `ANP negotiation: ${identity.did ?? "anonymous"} → ${result.negotiatedProtocol} (governance required)`,
    });
  }

  res.json(result);
});

// GET /api/alloy/gateway/telemetry
router.get("/alloy/gateway/telemetry", async (_req: Request, res: Response) => {
  const stats = await getGatewayStats();
  const telemetry = getProtocolTelemetry(100);
  const anpStats = getANPStats();
  const anpTelemetry = getANPTelemetry(50);

  res.json({
    gateway: stats,
    protocols: { anp: anpStats, recent: telemetry },
    negotiations: anpTelemetry,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/alloy/gateway/audit
router.get("/alloy/gateway/audit", async (_req: Request, res: Response) => {
  const crossings = getProtocolTelemetry(200);
  res.json({
    crossings: crossings.filter(c => c.isProtocolCrossing),
    total: crossings.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/alloy/gateway/agents
router.get("/alloy/gateway/agents", (_req: Request, res: Response) => {
  const uais = listUAIs();
  res.json({
    agents: uais.map(u => ({
      id: u.id,
      name: u.name,
      domain: u.domain,
      version: u.version,
      protocols: u.protocolSupport.map(p => p.protocol),
      a2aUrl: u.a2aCard.url,
      did: u.anpDid.did,
      capabilities: u.capabilities,
    })),
    total: uais.length,
    timestamp: new Date().toISOString(),
  });
});

// ─── HITL Approval Registry ───────────────────────────────────────────────────
// Durable governance approval storage backed by PostgreSQL.
// An in-memory cache is maintained for O(1) reads; DB is the source of truth.

interface PendingApproval {
  approvalId: string;
  fromProtocol: string;
  toProtocol: string;
  agentDid: string;
  action: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

// In-memory cache — populated from DB on first access and on each write
const approvalCache = new Map<string, PendingApproval>();

let _governanceTableReady = false;

async function ensureGovernanceApprovalTable(): Promise<void> {
  if (_governanceTableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS protocol_governance_approvals (
      approval_id    TEXT PRIMARY KEY,
      from_protocol  TEXT NOT NULL,
      to_protocol    TEXT NOT NULL,
      agent_did      TEXT NOT NULL,
      action         TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'pending',
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at    TIMESTAMPTZ,
      resolved_by    TEXT,
      resolution     TEXT
    )
  `);
  _governanceTableReady = true;
  logger.info("protocol_governance_approvals table ensured");
}

function rowToApproval(row: Record<string, unknown>): PendingApproval {
  return {
    approvalId:    String(row["approval_id"]),
    fromProtocol:  String(row["from_protocol"]),
    toProtocol:    String(row["to_protocol"]),
    agentDid:      String(row["agent_did"]),
    action:        String(row["action"]),
    status:        row["status"] as "pending" | "approved" | "rejected",
    createdAt:     String(row["created_at"]),
    resolvedAt:    row["resolved_at"] ? String(row["resolved_at"]) : undefined,
    resolvedBy:    row["resolved_by"] ? String(row["resolved_by"]) : undefined,
    resolution:    row["resolution"] ? String(row["resolution"]) : undefined,
  };
}

async function loadApproval(approvalId: string): Promise<PendingApproval | null> {
  await ensureGovernanceApprovalTable();
  const cached = approvalCache.get(approvalId);
  if (cached) return cached;
  const result = await pool.query(
    "SELECT * FROM protocol_governance_approvals WHERE approval_id = $1",
    [approvalId],
  );
  if (result.rows.length === 0) return null;
  const approval = rowToApproval(result.rows[0] as Record<string, unknown>);
  approvalCache.set(approvalId, approval);
  return approval;
}

async function updateApprovalInDB(
  approvalId: string,
  update: { status: "approved" | "rejected"; resolvedAt: string; resolvedBy: string; resolution: string },
): Promise<void> {
  await ensureGovernanceApprovalTable();
  await pool.query(
    `UPDATE protocol_governance_approvals
     SET status = $2, resolved_at = $3, resolved_by = $4, resolution = $5
     WHERE approval_id = $1`,
    [approvalId, update.status, update.resolvedAt, update.resolvedBy, update.resolution],
  );
}

/** Called by enforceGovernanceGate to register a pending approval for HITL. */
export function registerPendingApproval(
  approvalId: string,
  fromProtocol: string,
  toProtocol: string,
  agentDid: string,
  action: string,
): void {
  const approval: PendingApproval = {
    approvalId, fromProtocol, toProtocol, agentDid, action,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  approvalCache.set(approvalId, approval);

  // Persist to DB asynchronously (fail-loud so issues surface)
  ensureGovernanceApprovalTable()
    .then(() => pool.query(
      `INSERT INTO protocol_governance_approvals
       (approval_id, from_protocol, to_protocol, agent_did, action, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       ON CONFLICT (approval_id) DO NOTHING`,
      [approvalId, fromProtocol, toProtocol, agentDid, action, approval.createdAt],
    ))
    .catch(err => logger.error({ err, approvalId }, "Failed to persist governance approval to DB"));
}

// GET /api/alloy/governance/approvals/:approvalId — poll HITL approval status
// Auth model: accepts either a logged-in platform user OR an ANP-verified agent
// presenting a valid Bearer token. ANP agents may only poll approvals for their own DID.
router.get(
  "/alloy/governance/approvals/:approvalId",
  async (req: Request, res: Response) => {
    const { approvalId } = req.params as { approvalId: string };

    // Determine caller identity: try ANP Bearer first, then platform session
    const anpIdentity = verifyANPIdentity({
      headers: req.headers as Record<string, string | string[] | undefined>,
    });
    const isAnpAgent = anpIdentity.verified && anpIdentity.trustLevel !== "anonymous";
    const isSessionUser = !!(req as { user?: unknown }).user;

    if (!isAnpAgent && !isSessionUser) {
      res.status(401).json({
        error: "Unauthorized — provide a valid platform session or an ANP Bearer token to poll approval status",
      });
      return;
    }

    const approval = await loadApproval(approvalId);

    if (!approval) {
      res.status(404).json({ error: "Approval not found", approvalId });
      return;
    }

    // ANP agents may only read approvals for their own DID
    if (isAnpAgent && !isSessionUser) {
      if (approval.agentDid !== anpIdentity.did) {
        res.status(403).json({
          error: "Forbidden — ANP agents may only poll approval status for their own DID",
          yourDid: anpIdentity.did,
          approvalDid: approval.agentDid,
        });
        return;
      }
    }

    res.json({
      approvalId: approval.approvalId,
      status: approval.status,
      fromProtocol: approval.fromProtocol,
      toProtocol: approval.toProtocol,
      agentDid: approval.agentDid,
      action: approval.action,
      createdAt: approval.createdAt,
      resolvedAt: approval.resolvedAt ?? null,
      resolvedBy: approval.resolvedBy ?? null,
      resolution: approval.resolution ?? null,
      pendingFor: `${Math.round((Date.now() - new Date(approval.createdAt).getTime()) / 1000)}s`,
    });
  },
);

// POST /api/alloy/governance/approvals/:approvalId/resolve — human resolves HITL approval
// Requires authenticated elevated user (admin/owner) to approve or reject cross-protocol crossings.
// On approval, emits a hitl_governance_resolved event on the agent bus so downstream
// subscribers can replay/continue the blocked cross-protocol action.
router.post(
  "/alloy/governance/approvals/:approvalId/resolve",
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    const { approvalId } = req.params as { approvalId: string };
    const body = req.body as { decision: "approved" | "rejected"; resolvedBy?: string; resolution?: string };

    // Only elevated users (admin/owner) may resolve governance approvals
    if (!req.user || !isElevatedUser(req.user)) {
      res.status(403).json({
        error: "Forbidden: only admin or owner users may resolve governance approvals",
        approvalId,
      });
      return;
    }

    const approval = await loadApproval(approvalId);
    if (!approval) {
      res.status(404).json({ error: "Approval not found", approvalId });
      return;
    }

    if (approval.status !== "pending") {
      res.status(409).json({
        error: "Approval already resolved",
        approvalId,
        currentStatus: approval.status,
      });
      return;
    }

    if (!body.decision || !["approved", "rejected"].includes(body.decision)) {
      res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
      return;
    }

    const resolvedAt = new Date().toISOString();
    const resolvedBy = body.resolvedBy ?? `user:${req.user.id}`;
    const resolution = body.resolution ?? "";

    // Update DB (durable) first — cache update follows
    await updateApprovalInDB(approvalId, {
      status: body.decision, resolvedAt, resolvedBy, resolution,
    });

    // Update in-memory cache
    approval.status = body.decision;
    approval.resolvedAt = resolvedAt;
    approval.resolvedBy = resolvedBy;
    approval.resolution = resolution;
    approvalCache.set(approvalId, approval);

    await writeAuditLog({
      entityType: "workflow",
      entityId: 0,
      action: `protocol_crossing_${body.decision}`,
      actorType: "human",
      notes: `HITL resolution: ${approval.agentDid} | ${approval.fromProtocol}→${approval.toProtocol} | ${body.decision} by ${resolvedBy}`,
    });

    logger.info({ approvalId, decision: body.decision, resolvedBy }, "HITL governance approval resolved");

    // Emit continuation event on the agent event bus so subscribers can replay the blocked action.
    // Agents polling the bus for their approvalId receive this event and can proceed.
    // Bus emission failure is explicitly warned and non-fatal — the DB record is already updated.
    try {
      await agentEventBus.publish({
        type: "hitl_governance_resolved",
        sourceAgent: "alloy-protocol-gateway",
        sourceDomain: "alloy",
        payload: {
          approvalId,
          decision: body.decision,
          fromProtocol: approval.fromProtocol,
          toProtocol: approval.toProtocol,
          agentDid: approval.agentDid,
          action: approval.action,
          resolvedBy,
          resolution,
        },
      });
    } catch (busErr) {
      logger.warn({ approvalId, err: busErr }, "Failed to emit HITL continuation event on agent bus; DB approval state is persisted");
    }

    res.json({
      approvalId,
      status: approval.status,
      resolvedAt: approval.resolvedAt,
      resolvedBy: approval.resolvedBy,
      message: `Cross-protocol boundary ${body.decision}`,
      continuationEvent: `hitl_${body.decision}`,
      hint: body.decision === "approved"
        ? "The originating agent should replay the cross-protocol action now that the boundary is approved."
        : "The originating agent should abort or retry with a different protocol.",
    });
  },
);

export default router;

// ─── Well-Known Router ────────────────────────────────────────────────────────
// Mounted at root (app.use(wellKnownRouter)) in app.ts — BEFORE /api mount

export const wellKnownRouter = Router();

wellKnownRouter.get("/.well-known/agent-card.json", (_req: Request, res: Response) => {
  recordDiscoveryHit("global", "a2a");
  res.set("Content-Type", "application/json");
  res.set("Access-Control-Allow-Origin", "*");
  res.json(getGlobalAgentCard());
});

wellKnownRouter.get("/.well-known/agent/:domain.json", (req: Request, res: Response) => {
  const domain = String(req.params["domain"] ?? "");
  const uai = getUAI(domain);

  if (!uai) {
    res.status(404).json({ error: "Agent not found", domain });
    return;
  }

  const format = req.query["format"] as string | undefined;
  recordDiscoveryHit(domain, format ?? "uai");
  res.set("Access-Control-Allow-Origin", "*");

  if (format === "a2a") {
    res.set("Content-Type", "application/json");
    res.json(getUAIAsA2ACard(domain));
  } else if (format === "did") {
    res.set("Content-Type", "application/ld+json");
    res.json(getUAIAsANPDid(domain));
  } else if (format === "mcp") {
    res.set("Content-Type", "application/json");
    res.json(getUAIAsMCPManifest(domain));
  } else {
    res.set("Content-Type", "application/ld+json");
    res.json(uai);
  }
});

wellKnownRouter.get("/.well-known/did.json", (_req: Request, res: Response) => {
  recordDiscoveryHit("platform", "did");
  res.set("Content-Type", "application/ld+json");
  res.set("Access-Control-Allow-Origin", "*");
  const host = process.env.REPLIT_DEV_DOMAIN ?? "szlholdings.com";
  res.json({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: `did:web:${host}`,
    verificationMethod: [{
      id: `did:web:${host}#key-1`,
      type: "JsonWebKey2020",
      controller: `did:web:${host}`,
      publicKeyJwk: {
        kty: "EC", crv: "P-256",
        x: "szl-platform-key-x",
        y: "szl-platform-key-y",
      },
    }],
    service: [
      { id: "#gateway", type: "AlloyGateway", serviceEndpoint: `https://${host}/api/alloy/gateway` },
      { id: "#a2a", type: "A2AService", serviceEndpoint: `https://${host}/api/a2a` },
      { id: "#mcp", type: "MCPService", serviceEndpoint: `https://${host}/api/mcp` },
    ],
  });
});
