import { Router, type Request, type Response } from "express";
import { logger } from "../../logger";
import { logActivity } from "@szl-holdings/audit";
import type { AuthenticatedUser } from "../../../middlewares/auth";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  domain?: string;
  requiredRoles?: string[];
}

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface McpPrompt {
  name: string;
  description: string;
  arguments?: Array<{ name: string; description: string; required?: boolean }>;
}

export interface McpServerModule {
  moduleId: string;
  name: string;
  description: string;
  version: string;
  domain: string;
  tools: McpTool[];
  resources?: McpResource[];
  prompts?: McpPrompt[];
  healthCheck?: () => Promise<{ healthy: boolean; details?: string }>;
  executeTool: (toolName: string, args: Record<string, unknown>, user?: AuthenticatedUser) => Promise<unknown>;
  readResource?: (uri: string, user?: AuthenticatedUser) => Promise<unknown>;
  getPrompt?: (name: string, args: Record<string, unknown>, user?: AuthenticatedUser) => Promise<unknown>;
}

const registeredModules = new Map<string, McpServerModule>();

interface ModuleStats {
  callTimestamps: number[];
  errorTimestamps: number[];
  circuitState: "closed" | "half-open" | "open";
  lastStateChange: number;
  lastError?: string;
}

const moduleStats = new Map<string, ModuleStats>();

function getOrCreateStats(moduleId: string): ModuleStats {
  if (!moduleStats.has(moduleId)) {
    moduleStats.set(moduleId, {
      callTimestamps: [],
      errorTimestamps: [],
      circuitState: "closed",
      lastStateChange: Date.now(),
    });
  }
  return moduleStats.get(moduleId)!;
}

function pruneWindow(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter(t => t > cutoff);
}

export function recordMcpCall(moduleId: string, success: boolean, errorMsg?: string): void {
  const stats = getOrCreateStats(moduleId);
  const now = Date.now();
  stats.callTimestamps = pruneWindow(stats.callTimestamps, 60_000);
  stats.callTimestamps.push(now);
  if (!success) {
    stats.errorTimestamps = pruneWindow(stats.errorTimestamps, 60_000);
    stats.errorTimestamps.push(now);
    if (errorMsg) stats.lastError = errorMsg;
  }
  const recentCalls = stats.callTimestamps.length;
  const recentErrors = stats.errorTimestamps.length;
  const errorRate = recentCalls > 0 ? recentErrors / recentCalls : 0;
  if (errorRate >= 0.5 && recentCalls >= 3 && stats.circuitState === "closed") {
    stats.circuitState = "open";
    stats.lastStateChange = now;
    logger.warn({ moduleId, errorRate: (errorRate * 100).toFixed(0) + "%" }, "MCP circuit breaker opened");
  } else if (stats.circuitState === "open" && now - stats.lastStateChange > 30_000) {
    stats.circuitState = "half-open";
    stats.lastStateChange = now;
    logger.info({ moduleId }, "MCP circuit breaker moved to half-open");
  } else if (stats.circuitState === "half-open" && success) {
    stats.circuitState = "closed";
    stats.lastStateChange = now;
    logger.info({ moduleId }, "MCP circuit breaker closed");
  }
}

export function getMcpModuleStats(moduleId: string): {
  callsPerMinute: number;
  errorsPerMinute: number;
  circuitState: "closed" | "half-open" | "open";
  lastStateChange: number;
  lastError?: string;
} {
  const stats = getOrCreateStats(moduleId);
  return {
    callsPerMinute: pruneWindow(stats.callTimestamps, 60_000).length,
    errorsPerMinute: pruneWindow(stats.errorTimestamps, 60_000).length,
    circuitState: stats.circuitState,
    lastStateChange: stats.lastStateChange,
    lastError: stats.lastError,
  };
}

export function registerMcpModule(module: McpServerModule): void {
  registeredModules.set(module.moduleId, module);
  getOrCreateStats(module.moduleId);
  logger.info({ moduleId: module.moduleId, tools: module.tools.length }, "MCP module registered");
}

export function getMcpModule(moduleId: string): McpServerModule | undefined {
  return registeredModules.get(moduleId);
}

export function listMcpModules(): McpServerModule[] {
  return Array.from(registeredModules.values());
}

export function getAllMcpTools(): McpTool[] {
  return Array.from(registeredModules.values()).flatMap(m => m.tools);
}

export function getAllMcpResources(): McpResource[] {
  return Array.from(registeredModules.values()).flatMap(m => m.resources ?? []);
}

export function getAllMcpPrompts(): McpPrompt[] {
  return Array.from(registeredModules.values()).flatMap(m => m.prompts ?? []);
}

export function findModuleForTool(toolName: string): McpServerModule | undefined {
  for (const module of registeredModules.values()) {
    if (module.tools.some(t => t.name === toolName)) return module;
  }
  return undefined;
}

export async function mcpGatewayHealth(): Promise<{
  gateway: string;
  modules: Array<{
    moduleId: string;
    name: string;
    domain: string;
    healthy: boolean;
    tools: number;
    details?: string;
    callsPerMinute: number;
    errorsPerMinute: number;
    circuitState: "closed" | "half-open" | "open";
    lastStateChange: number;
    lastError?: string;
  }>;
}> {
  const moduleHealth = await Promise.all(
    Array.from(registeredModules.values()).map(async (m) => {
      let healthy = true;
      let details: string | undefined;
      if (m.healthCheck) {
        try {
          const result = await m.healthCheck();
          healthy = result.healthy;
          details = result.details;
        } catch (err: any) {
          healthy = false;
          details = err.message;
        }
      }
      const stats = getMcpModuleStats(m.moduleId);
      if (stats.circuitState === "open") healthy = false;
      return {
        moduleId: m.moduleId,
        name: m.name,
        domain: m.domain,
        healthy,
        tools: m.tools.length,
        details,
        ...stats,
      };
    })
  );
  return { gateway: "healthy", modules: moduleHealth };
}

export function buildMcpGatewayRouter(authMiddleware: any): Router {
  const router = Router();
  const MCP_PROTOCOL_VERSION = "2024-11-05";
  const GATEWAY_NAME = "szl-mcp-gateway";
  const GATEWAY_VERSION = "2.0.0";

  const JSON_RPC_ERRORS = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    ACCESS_DENIED: -32000,
    MODULE_NOT_FOUND: -32001,
  };

  function mcpResponse(id: any, result?: unknown) {
    return { jsonrpc: "2.0" as const, id, result };
  }

  function mcpError(id: any, code: number, message: string, data?: unknown) {
    return { jsonrpc: "2.0" as const, id, error: { code, message, data } };
  }

  function getUserOrgIds(user?: AuthenticatedUser): number[] {
    if (!user) return [];
    return user.orgs.map((o: any) => o.orgId);
  }

  function canUserAccessTool(tool: McpTool, user?: AuthenticatedUser): boolean {
    if (!tool.requiredRoles?.length) return true;
    if (!user) return false;
    return tool.requiredRoles.some(role => (user.roles as string[]).includes(role));
  }

  async function writeGatewayAuditLog(params: {
    userId?: number | null;
    moduleId?: string;
    toolName: string;
    args: Record<string, unknown>;
    result: string;
    latencyMs: number;
  }) {
    try {
      await logActivity({
        userId: params.userId ?? null,
        action: "mcp_gateway_tool_invoke",
        resource: "mcp_gateway",
        resourceId: params.toolName,
        description: `MCP Gateway tool invocation: ${params.toolName} (module: ${params.moduleId ?? "unknown"})`,
        metadata: {
          toolName: params.toolName,
          moduleId: params.moduleId,
          args: params.args,
          latencyMs: params.latencyMs,
          resultLength: params.result.length,
        },
      });
    } catch {}
  }

  router.get("/.well-known/mcp-server-card", (_req: Request, res: Response) => {
    res.json({
      protocol: "mcp",
      version: MCP_PROTOCOL_VERSION,
      name: GATEWAY_NAME,
      gatewayVersion: GATEWAY_VERSION,
      description: "SZL Holdings AI Agent Platform — Multi-domain MCP Gateway",
      modules: Array.from(registeredModules.values()).map(m => ({
        moduleId: m.moduleId,
        name: m.name,
        domain: m.domain,
        version: m.version,
        toolCount: m.tools.length,
        wellKnown: `/.well-known/mcp-server-card/${m.moduleId}`,
      })),
      authentication: {
        type: "oauth2",
        flows: ["authorization_code", "client_credentials"],
        tokenEndpoint: "/api/auth/token",
        scope: "mcp:read mcp:write",
      },
      capabilities: {
        tools: { listChanged: false },
        resources: { listChanged: false, subscribe: false },
        prompts: { listChanged: false },
        logging: {},
      },
    });
  });

  for (const [moduleId, _module] of Array.from(registeredModules.entries())) {
    router.get(`/.well-known/mcp-server-card/${moduleId}`, (_req: Request, res: Response) => {
      const m = registeredModules.get(moduleId);
      if (!m) { res.status(404).json({ error: "Module not found" }); return; }
      res.json({
        protocol: "mcp",
        protocolVersion: MCP_PROTOCOL_VERSION,
        moduleId: m.moduleId,
        name: m.name,
        description: m.description,
        domain: m.domain,
        version: m.version,
        tools: m.tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
        resources: m.resources ?? [],
        prompts: m.prompts ?? [],
        authentication: { schemes: ["bearer"] },
      });
    });
  }

  router.get("/health", async (_req: Request, res: Response) => {
    try {
      const health = await mcpGatewayHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ gateway: "unhealthy", error: err.message });
    }
  });

  router.post("/", authMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    const body = req.body;

    if (!body || typeof body !== "object" || body.jsonrpc !== "2.0") {
      res.json(mcpError(body?.id, JSON_RPC_ERRORS.INVALID_REQUEST, "Invalid JSON-RPC request"));
      return;
    }

    const { id, method, params = {} } = body;

    try {
      switch (method) {
        case "initialize":
          res.json(mcpResponse(id, {
            protocolVersion: MCP_PROTOCOL_VERSION,
            serverInfo: { name: GATEWAY_NAME, version: GATEWAY_VERSION },
            capabilities: {
              tools: { listChanged: false },
              resources: { listChanged: false, subscribe: false },
              prompts: { listChanged: false },
            },
          }));
          return;

        case "tools/list": {
          const allTools = getAllMcpTools();
          const filteredTools = allTools.filter(t => canUserAccessTool(t, user));
          res.json(mcpResponse(id, { tools: filteredTools }));
          return;
        }

        case "tools/call": {
          const { name: toolName, arguments: toolArgs = {} } = params as any;
          if (!toolName) {
            res.json(mcpError(id, JSON_RPC_ERRORS.INVALID_PARAMS, "Tool name required"));
            return;
          }

          const module = findModuleForTool(toolName);
          if (!module) {
            res.json(mcpError(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Tool "${toolName}" not found`));
            return;
          }

          const tool = module.tools.find(t => t.name === toolName);
          if (!canUserAccessTool(tool!, user)) {
            res.json(mcpError(id, JSON_RPC_ERRORS.ACCESS_DENIED, `Access denied to tool "${toolName}"`));
            return;
          }

          const start = Date.now();
          try {
            const result = await module.executeTool(toolName, toolArgs, user);
            const latencyMs = Date.now() - start;
            recordMcpCall(module.moduleId, true);

            await writeGatewayAuditLog({
              userId: user?.id ? Number(user.id) : null,
              moduleId: module.moduleId,
              toolName,
              args: toolArgs,
              result: JSON.stringify(result).slice(0, 500),
              latencyMs,
            });

            logger.info({ moduleId: module.moduleId, toolName, latencyMs }, "MCP tool invoked");

            res.json(mcpResponse(id, {
              content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }],
              isError: false,
            }));
          } catch (err: any) {
            const latencyMs = Date.now() - start;
            recordMcpCall(module.moduleId, false, err.message);
            await writeGatewayAuditLog({
              userId: user?.id ? Number(user.id) : null,
              moduleId: module.moduleId,
              toolName,
              args: toolArgs,
              result: `ERROR: ${err.message}`,
              latencyMs,
            });
            logger.warn({ moduleId: module.moduleId, toolName, err: err.message, latencyMs }, "MCP tool error");
            res.json(mcpError(id, JSON_RPC_ERRORS.INTERNAL_ERROR, err.message));
          }
          return;
        }

        case "resources/list": {
          res.json(mcpResponse(id, { resources: getAllMcpResources() }));
          return;
        }

        case "resources/read": {
          const { uri } = params as any;
          if (!uri) {
            res.json(mcpError(id, JSON_RPC_ERRORS.INVALID_PARAMS, "Resource URI required"));
            return;
          }

          for (const module of registeredModules.values()) {
            if (module.resources?.some(r => r.uri === uri) && module.readResource) {
              const content = await module.readResource(uri, user);
              res.json(mcpResponse(id, {
                contents: [{ uri, mimeType: "application/json", text: JSON.stringify(content, null, 2) }],
              }));
              return;
            }
          }

          res.json(mcpError(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Resource "${uri}" not found`));
          return;
        }

        case "prompts/list": {
          res.json(mcpResponse(id, { prompts: getAllMcpPrompts() }));
          return;
        }

        case "prompts/get": {
          const { name: promptName, arguments: promptArgs = {} } = params as any;
          if (!promptName) {
            res.json(mcpError(id, JSON_RPC_ERRORS.INVALID_PARAMS, "Prompt name required"));
            return;
          }

          for (const module of registeredModules.values()) {
            if (module.prompts?.some(p => p.name === promptName) && module.getPrompt) {
              const content = await module.getPrompt(promptName, promptArgs, user);
              res.json(mcpResponse(id, content));
              return;
            }
          }

          res.json(mcpError(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Prompt "${promptName}" not found`));
          return;
        }

        case "ping":
          res.json(mcpResponse(id, {}));
          return;

        default:
          res.json(mcpError(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Method "${method}" not found`));
      }
    } catch (err: any) {
      logger.error({ err, method }, "MCP Gateway error");
      res.json(mcpError(id, JSON_RPC_ERRORS.INTERNAL_ERROR, "Internal gateway error"));
    }
  });

  return router;
}
