import { globalCollector } from '@workspace/cognitive-observability';
import { type GatewayInvocationResult, defaultGateway, type ToolMeshGateway } from './gateway.js';
import type { ToolManifest } from './manifest.js';
import { type ToolRegistry, defaultToolRegistry } from './registry.js';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
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
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean | undefined;
  traceId?: string | undefined;
}

export interface McpServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  tools: McpToolDefinition[];
}

export interface ProgressiveDiscoveryConfig {
  enabled: boolean;
  contextWindowTokens: number;
  thresholdFraction: number;
  avgTokensPerToolSchema: number;
}

const DEFAULT_DISCOVERY_CONFIG: ProgressiveDiscoveryConfig = {
  enabled: true,
  contextWindowTokens: 128_000,
  thresholdFraction: 0.05,
  avgTokensPerToolSchema: 150,
};

const MCP_PROTOCOL_VERSION = '2025-11-25';

const META_TOOL_SEARCH: McpToolDefinition = {
  name: 'search_tools',
  description:
    'Search for tools by natural-language query. Returns name + one-line description for matches. ' +
    'Call get_tool_details to retrieve the full input/output schema for a specific tool.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Natural-language search query' },
      limit: { type: 'number', description: 'Maximum results to return (default: 10)' },
      domainTag: {
        type: 'string',
        description: 'Restrict results to a specific domain tag (optional)',
      },
    },
    required: ['query'],
  },
};

const META_TOOL_DETAILS: McpToolDefinition = {
  name: 'get_tool_details',
  description:
    'Retrieve the full JSON Schema definition (inputSchema, outputSchema, policyTier, rateLimits) ' +
    'for a specific tool by its ID.',
  inputSchema: {
    type: 'object',
    properties: {
      toolId: { type: 'string', description: 'Tool ID returned by search_tools' },
    },
    required: ['toolId'],
  },
};

const META_TOOL_CALL: McpToolDefinition = {
  name: 'call_tool',
  description:
    'Stable meta-tool for invoking any registered tool by name with structured arguments. ' +
    'Use this instead of the tool directly to preserve prompt-cache stability — ' +
    'the tools array never changes during a conversation.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Tool ID to invoke' },
      args: { type: 'object', description: 'Input arguments for the tool' },
    },
    required: ['name', 'args'],
  },
};

function manifestToMcpTool(manifest: ToolManifest): McpToolDefinition {
  const schema = manifest.inputSchema;
  let properties: Record<string, unknown> = {};
  let required: string[] | undefined;

  if (schema) {
    const schemaProperties = schema.properties;
    if (
      schemaProperties &&
      typeof schemaProperties === 'object' &&
      !Array.isArray(schemaProperties)
    ) {
      properties = schemaProperties as Record<string, unknown>;
    }
    const schemaRequired = schema.required;
    if (Array.isArray(schemaRequired) && schemaRequired.every((f) => typeof f === 'string')) {
      required = schemaRequired as string[];
    }
  }

  const inputSchema: McpToolDefinition['inputSchema'] = { type: 'object', properties };
  if (required && required.length > 0) {
    inputSchema.required = required;
  }

  return {
    name: manifest.id,
    description: `[${manifest.domainTags.join(',')}] ${manifest.description}`,
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
  private readonly discoveryConfig: ProgressiveDiscoveryConfig;
  private readonly listChangedListeners = new Set<() => void>();
  /**
   * Tracks tool IDs that a client has explicitly inspected via `get_tool_details`
   * during the current session. Tools in this set are included with their full
   * schemas in all subsequent `listTools()` / `getServerInfo()` responses so
   * the client can reference them directly without calling `call_tool`. The set
   * is append-only — tools are never removed once injected — to preserve
   * prompt-cache stability across multi-turn conversations.
   */
  private readonly injectedToolIds = new Set<string>();

  constructor(
    registry: ToolRegistry = defaultToolRegistry,
    gateway: ToolMeshGateway = defaultGateway,
    serverName = 'szl-tool-mesh-mcp',
    serverVersion = '2.0.0',
    discoveryConfig: Partial<ProgressiveDiscoveryConfig> = {},
  ) {
    this.registry = registry;
    this.gateway = gateway;
    this.serverName = serverName;
    this.serverVersion = serverVersion;
    this.discoveryConfig = { ...DEFAULT_DISCOVERY_CONFIG, ...discoveryConfig };

    if (registry.onToolsChanged) {
      registry.onToolsChanged(() => {
        for (const listener of this.listChangedListeners) {
          try {
            listener();
          } catch {
            // listeners must not throw
          }
        }
      });
    }
  }

  onListChanged(listener: () => void): () => void {
    this.listChangedListeners.add(listener);
    return () => {
      this.listChangedListeners.delete(listener);
    };
  }

  isProgressiveMode(): boolean {
    if (!this.discoveryConfig.enabled) return false;
    const toolCount = this.registry.count();
    const estimatedTokens = toolCount * this.discoveryConfig.avgTokensPerToolSchema;
    const threshold =
      this.discoveryConfig.contextWindowTokens * this.discoveryConfig.thresholdFraction;
    return estimatedTokens > threshold;
  }

  registerExternalTool(tool: ExternalToolRegistration): void {
    this.externalTools.set(tool.name, tool);
  }

  unregisterExternalTool(name: string): void {
    this.externalTools.delete(name);
  }

  getServerInfo(): McpServerInfo {
    const progressive = this.isProgressiveMode();

    const externalMcpTools: McpToolDefinition[] = Array.from(this.externalTools.values()).map(
      (ext) => {
        const rawSchema = ext.inputSchema;
        const properties: Record<string, unknown> = {};
        const required: string[] = [];
        for (const [key, val] of Object.entries(rawSchema)) {
          if (key === 'required' && Array.isArray(val)) {
            required.push(...(val as string[]));
          } else {
            properties[key] = val;
          }
        }
        const inputSchema: McpToolDefinition['inputSchema'] = { type: 'object', properties };
        if (required.length > 0) inputSchema.required = required;
        return { name: ext.name, description: ext.description, inputSchema };
      },
    );

    if (progressive) {
      const t0 = Date.now();
      const metaTools = [META_TOOL_SEARCH, META_TOOL_DETAILS, META_TOOL_CALL];

      // Include full schemas for any tools the client has previously inspected
      // via get_tool_details. This append-only injection gives the model stable
      // direct-call access to tools it has already examined, without cycling the
      // rest of the tools list and invalidating prompt cache for every turn.
      const injectedTools: McpToolDefinition[] = [];
      for (const toolId of this.injectedToolIds) {
        const manifest = this.registry.getToolDetails(toolId);
        if (manifest) {
          injectedTools.push(manifestToMcpTool(manifest));
        }
      }

      globalCollector.recordKnown('token_count', 0, {
        phase: 'progressive_discovery',
        mode: 'meta_tools_only',
        toolCount: String(this.registry.count()),
        injectedCount: String(injectedTools.length),
        latencyMs: String(Date.now() - t0),
      });
      return {
        name: this.serverName,
        version: this.serverVersion,
        protocolVersion: MCP_PROTOCOL_VERSION,
        tools: [...metaTools, ...injectedTools, ...externalMcpTools],
      };
    }

    // META_TOOL_CALL is always included so prompt-cache-safe invocation works
    // whether or not progressive discovery is active.
    const registryTools = this.registry.list({ enabled: true }).map((m) => manifestToMcpTool(m));
    return {
      name: this.serverName,
      version: this.serverVersion,
      protocolVersion: MCP_PROTOCOL_VERSION,
      tools: [META_TOOL_CALL, ...registryTools, ...externalMcpTools],
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

    if (req.name === 'search_tools') {
      return this.handleSearchTools(req.arguments ?? {});
    }

    if (req.name === 'get_tool_details') {
      return this.handleGetToolDetails(req.arguments ?? {});
    }

    if (req.name === 'call_tool') {
      const args = req.arguments ?? {};
      const innerName = typeof args.name === 'string' ? args.name : '';

      // Reject a call_tool invocation that targets call_tool itself. Without this
      // guard a misbehaving or adversarial caller can trigger unbounded recursion
      // that grows the call stack until V8 throws a RangeError.
      if (!innerName || innerName === 'call_tool') {
        return {
          content: [
            {
              type: 'text',
              text:
                innerName === 'call_tool'
                  ? 'Error: call_tool cannot invoke itself. Provide the actual tool ID in the name field.'
                  : 'Error: call_tool requires a non-empty name field.',
            },
          ],
          isError: true,
        };
      }

      const innerArgs =
        args.args && typeof args.args === 'object' && !Array.isArray(args.args)
          ? (args.args as Record<string, unknown>)
          : {};
      return this.call({ name: innerName, arguments: innerArgs, requestId }, context);
    }

    const externalTool = this.externalTools.get(req.name);
    if (externalTool) {
      if (externalTool.requiresApproval) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: External tool '${req.name}' requires human approval before execution`,
            },
          ],
          isError: true,
        };
      }
      try {
        const output = await externalTool.handler(req.arguments ?? {});
        const text = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
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
        typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2);
      return { content: [{ type: 'text', text }], traceId: result.traceId };
    }

    return {
      content: [{ type: 'text', text: `Error: ${result.error}` }],
      isError: true,
      traceId: result.traceId,
    };
  }

  private handleSearchTools(args: Record<string, unknown>): McpCallResult {
    const t0 = Date.now();
    const query = typeof args.query === 'string' ? args.query : '';
    const limit = typeof args.limit === 'number' ? args.limit : 10;
    const domainTag = typeof args.domainTag === 'string' ? args.domainTag : undefined;

    const results = this.registry.searchTools(query, { limit, domainTag });
    const latencyMs = Date.now() - t0;

    globalCollector.recordKnown('latency_ms', latencyMs, {
      phase: 'discovery_search',
      query: query.slice(0, 50),
      resultCount: String(results.length),
    });

    const output = {
      query,
      count: results.length,
      tools: results.map((r) => ({
        toolId: r.toolId,
        name: r.name,
        description: r.description,
        domainTags: r.domainTags,
        score: Math.round(r.score * 100) / 100,
      })),
      hint: 'Call get_tool_details with a toolId to retrieve the full input/output schema.',
    };

    return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
  }

  private handleGetToolDetails(args: Record<string, unknown>): McpCallResult {
    const toolId = typeof args.toolId === 'string' ? args.toolId : '';
    const manifest = this.registry.getToolDetails(toolId);

    if (!manifest) {
      return {
        content: [{ type: 'text', text: `Error: Tool '${toolId}' not found in registry` }],
        isError: true,
      };
    }

    // Append-only injection: track this tool so its full schema is included in
    // every subsequent listTools() response. If this is the first time the
    // client inspects this tool, notify list_changed listeners so the host
    // knows to re-fetch the tool list and surface the newly injected entry.
    const isNew = !this.injectedToolIds.has(toolId);
    this.injectedToolIds.add(toolId);

    if (isNew) {
      for (const listener of this.listChangedListeners) {
        try {
          listener();
        } catch {
          // listeners must not throw
        }
      }
    }

    globalCollector.recordKnown('token_count', 0, {
      phase: 'discovery_inspect',
      toolId,
      injected: String(isNew),
    });

    const output = {
      toolId: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      domainTags: manifest.domainTags,
      policyTier: manifest.policyTier,
      approvalRequired: manifest.approvalRequired,
      inputSchema: manifest.inputSchema ?? null,
      outputSchema: manifest.outputSchema ?? null,
      rateLimits: manifest.rateLimits,
      timeoutMs: manifest.timeoutMs,
      enabled: manifest.enabled,
    };

    return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
  }
}

export const defaultMcpBridge = new ToolMeshMcpBridge();
