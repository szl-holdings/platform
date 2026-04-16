import { createLogger } from "./logger.js";
import { toolRegistry, enforceToolCallPolicy } from "./registry.js";
import type { ToolContext, ToolResult } from "./registry.js";

const logger = createLogger("tool-registry:mcp-bridge");

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpCallRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface McpCallResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface McpServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  tools: McpToolDefinition[];
}

const MCP_PROTOCOL_VERSION = "2024-11-05";
const SERVER_NAME = "szl-tool-registry-mcp";
const SERVER_VERSION = "1.0.0";

class McpBridge {
  private externalTools: Map<string, {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    requiresApproval?: boolean;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
  }> = new Map();

  getServerInfo(): McpServerInfo {
    const registryTools = toolRegistry.getMcpSchema();
    const externalMcpTools: McpToolDefinition[] = Array.from(this.externalTools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: {
        type: "object" as const,
        properties: t.inputSchema as Record<string, unknown>,
      },
    }));

    return {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocolVersion: MCP_PROTOCOL_VERSION,
      tools: [...registryTools, ...externalMcpTools],
    };
  }

  registerExternalTool(params: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    requiresApproval?: boolean;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
  }): void {
    this.externalTools.set(params.name, params);
    logger.info({ toolName: params.name, requiresApproval: params.requiresApproval }, "External MCP tool registered");
  }

  unregisterExternalTool(name: string): void {
    this.externalTools.delete(name);
  }

  async call(req: McpCallRequest, context: ToolContext): Promise<McpCallResult> {
    const args = req.arguments ?? {};
    const start = Date.now();

    const externalTool = this.externalTools.get(req.name);
    if (externalTool) {
      if (externalTool.requiresApproval && !context.dryRun) {
        return {
          content: [{ type: "text", text: `Tool '${req.name}' requires approval before execution via MCP` }],
          isError: true,
        };
      }
      try {
        const output = await externalTool.handler(args);
        const text = typeof output === "string" ? output : JSON.stringify(output, null, 2);
        logger.debug({ toolName: req.name, latencyMs: Date.now() - start }, "External MCP tool called");
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Tool execution failed";
        logger.error({ toolName: req.name, error: msg }, "External MCP tool error");
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }

    const tool = toolRegistry.getByName(req.name);
    if (!tool) {
      return { content: [{ type: "text", text: `Tool '${req.name}' not found` }], isError: true };
    }

    const enforcement = enforceToolCallPolicy(tool.id, context);
    if (enforcement.blocked) {
      logger.warn({ toolName: req.name, reason: enforcement.reason }, "MCP tool call blocked by policy");
      return {
        content: [{ type: "text", text: `Policy blocked: ${enforcement.reason}` }],
        isError: true,
      };
    }

    if (!tool.handler) {
      return { content: [{ type: "text", text: `Tool '${req.name}' has no handler registered` }], isError: true };
    }

    try {
      const result: ToolResult = await tool.handler(args, context);
      const text = result.success
        ? (typeof result.output === "string" ? result.output : JSON.stringify(result.output, null, 2))
        : `Error: ${result.error}`;
      logger.debug({ toolName: req.name, latencyMs: Date.now() - start, success: result.success }, "Registry tool called via MCP");
      return { content: [{ type: "text", text }], isError: !result.success };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
    }
  }

  listTools(): McpToolDefinition[] {
    return this.getServerInfo().tools;
  }
}

export const mcpBridge = new McpBridge();
export { McpBridge };
