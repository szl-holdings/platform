import type { ToolManifest } from "./manifest.js";
import type { ToolRegistry } from "./registry.js";
import { defaultToolRegistry } from "./registry.js";
import type { ToolHandler, GatewayInvocationResult } from "./gateway.js";
import { ToolMeshGateway, defaultGateway } from "./gateway.js";

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
  requestId?: string;
}

export interface McpCallResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  traceId?: string;
}

export interface McpServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  tools: McpToolDefinition[];
}

const MCP_PROTOCOL_VERSION = "2024-11-05";

function manifestToMcpTool(manifest: ToolManifest): McpToolDefinition {
  const schema = manifest.inputSchema;
  let properties: Record<string, unknown> = {};
  let required: string[] | undefined;

  if (schema) {
    const schemaProperties = schema["properties"];
    if (schemaProperties && typeof schemaProperties === "object" && !Array.isArray(schemaProperties)) {
      properties = schemaProperties as Record<string, unknown>;
    }
    const schemaRequired = schema["required"];
    if (Array.isArray(schemaRequired) && schemaRequired.every((f) => typeof f === "string")) {
      required = schemaRequired as string[];
    }
  }

  const inputSchema: McpToolDefinition["inputSchema"] = { type: "object", properties };
  if (required && required.length > 0) {
    inputSchema.required = required;
  }

  return {
    name: manifest.id,
    description: `[${manifest.domainTags.join(",")}] ${manifest.description}`,
    inputSchema,
  };
}

export interface ExternalToolRegistration {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiresApproval: boolean;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export class ToolMeshMcpBridge {
  private readonly registry: ToolRegistry;
  private readonly gateway: ToolMeshGateway;
  private readonly serverName: string;
  private readonly serverVersion: string;
  private readonly externalTools = new Map<string, ExternalToolRegistration>();

  constructor(
    registry: ToolRegistry = defaultToolRegistry,
    gateway: ToolMeshGateway = defaultGateway,
    serverName = "szl-tool-mesh-mcp",
    serverVersion = "2.0.0",
  ) {
    this.registry = registry;
    this.gateway = gateway;
    this.serverName = serverName;
    this.serverVersion = serverVersion;
  }

  registerExternalTool(tool: ExternalToolRegistration): void {
    this.externalTools.set(tool.name, tool);
  }

  unregisterExternalTool(name: string): void {
    this.externalTools.delete(name);
  }

  getServerInfo(): McpServerInfo {
    const registryTools = this.registry
      .list({ enabled: true })
      .map((m) => manifestToMcpTool(m));

    const externalMcpTools: McpToolDefinition[] = Array.from(this.externalTools.values()).map((ext) => {
      const rawSchema = ext.inputSchema;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, val] of Object.entries(rawSchema)) {
        if (key === "required" && Array.isArray(val)) {
          required.push(...(val as string[]));
        } else {
          properties[key] = val;
        }
      }
      const inputSchema: McpToolDefinition["inputSchema"] = { type: "object", properties };
      if (required.length > 0) inputSchema.required = required;
      return { name: ext.name, description: ext.description, inputSchema };
    });

    return {
      name: this.serverName,
      version: this.serverVersion,
      protocolVersion: MCP_PROTOCOL_VERSION,
      tools: [...registryTools, ...externalMcpTools],
    };
  }

  listTools(): McpToolDefinition[] {
    return this.getServerInfo().tools;
  }

  async call(
    req: McpCallRequest,
    context: { requestId: string; agentId?: string; sessionId?: string },
  ): Promise<McpCallResult> {
    const requestId = req.requestId ?? context.requestId;

    const externalTool = this.externalTools.get(req.name);
    if (externalTool) {
      if (externalTool.requiresApproval) {
        return {
          content: [{ type: "text", text: `Error: External tool '${req.name}' requires human approval before execution` }],
          isError: true,
        };
      }
      try {
        const output = await externalTool.handler(req.arguments ?? {});
        const text = typeof output === "string" ? output : JSON.stringify(output, null, 2);
        return { content: [{ type: "text", text }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        };
      }
    }

    const result: GatewayInvocationResult = await this.gateway.invoke(
      req.name,
      req.arguments ?? {},
      { ...context, requestId },
    );

    if (result.success) {
      const text =
        typeof result.output === "string"
          ? result.output
          : JSON.stringify(result.output, null, 2);
      return { content: [{ type: "text", text }], traceId: result.traceId };
    }

    return {
      content: [{ type: "text", text: `Error: ${result.error}` }],
      isError: true,
      traceId: result.traceId,
    };
  }
}

export const defaultMcpBridge = new ToolMeshMcpBridge();
