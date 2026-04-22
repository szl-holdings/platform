/**
 * @szl/substrate — Adapter Registries
 *
 * Typed registries for ModelAdapter, RetrieverAdapter, ToolAdapter,
 * ResourceAdapter, and PolicyAdapter.
 *
 * All adapter contracts are MCP-shaped so a future transport layer is a
 * wrapper, not a refactor. Phase 1 ships in-process adapters only.
 */

import type { StageExecutorContext } from './types.js';

// ─── Model Adapter ────────────────────────────────────────────────────────────

export interface ModelAdapterInput {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  /** MCP-shaped tool definitions available to the model */
  tools?: McpToolDefinition[];
  context?: Record<string, unknown>;
}

export interface ModelAdapterOutput {
  content: string;
  confidence: number;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  /** Selected tool call, if model invoked a tool */
  toolCall?: { toolId: string; args: unknown };
  provider: string;
  model: string;
  durationMs: number;
}

export interface ModelAdapter {
  id: string;
  name: string;
  provider: string;
  /** MCP-shaped capability declaration */
  mcpCapabilities: McpCapabilitySpec;
  infer(input: ModelAdapterInput): Promise<ModelAdapterOutput>;
}

// ─── Retriever Adapter ────────────────────────────────────────────────────────

export interface RetrieverAdapterInput {
  query: string;
  topK?: number;
  minRelevanceScore?: number;
  filters?: Record<string, unknown>;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  relevanceScore: number;
  source: string;
  metadata: Record<string, unknown>;
}

export interface RetrieverAdapter {
  id: string;
  name: string;
  mcpCapabilities: McpCapabilitySpec;
  retrieve(input: RetrieverAdapterInput): Promise<RetrievedDocument[]>;
}

// ─── Tool Adapter ─────────────────────────────────────────────────────────────

export interface ToolAdapterInput {
  toolId: string;
  args: unknown;
  /** Full MCP tool call spec */
  mcpCall?: McpToolCall;
}

export interface ToolAdapterOutput {
  result: unknown;
  durationMs: number;
  toolId: string;
  /** MCP-shaped response */
  mcpResponse?: McpToolResult;
}

export interface ToolAdapter {
  id: string;
  name: string;
  mcpCapabilities: McpCapabilitySpec;
  execute(input: ToolAdapterInput, ctx: StageExecutorContext): Promise<ToolAdapterOutput>;
}

// ─── Resource Adapter ─────────────────────────────────────────────────────────

export interface ResourceAdapterInput {
  resourceUri: string;
  operation: 'read' | 'write' | 'list' | 'delete';
  body?: unknown;
  filters?: Record<string, unknown>;
}

export interface ResourceAdapterOutput {
  data: unknown;
  resourceUri: string;
  operation: string;
  durationMs: number;
}

export interface ResourceAdapter {
  id: string;
  name: string;
  mcpCapabilities: McpCapabilitySpec;
  execute(input: ResourceAdapterInput): Promise<ResourceAdapterOutput>;
}

// ─── Policy Adapter ───────────────────────────────────────────────────────────

export interface PolicyAdapterInput {
  action: string;
  agentId?: string;
  riskLevel?: string;
  context?: Record<string, unknown>;
}

export interface PolicyAdapterOutput {
  allowed: boolean;
  requiresApproval: boolean;
  blockedReason: string | null;
  violatedPolicies: string[];
}

export interface PolicyAdapter {
  id: string;
  name: string;
  evaluate(input: PolicyAdapterInput): Promise<PolicyAdapterOutput>;
}

// ─── MCP-Shaped Contracts ─────────────────────────────────────────────────────
// Contracts are MCP-shaped so a future transport is a wrapper, not a refactor.

export interface McpCapabilitySpec {
  id: string;
  name: string;
  version: string;
  description?: string;
  /** For model adapters: supported MCP sampling parameters */
  samplingParams?: Record<string, unknown>;
  /** For tool/resource adapters: exposed MCP resource URIs */
  resourceUris?: string[];
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface McpToolResult {
  toolCallId: string;
  content: Array<{ type: 'text' | 'image' | 'resource'; text?: string; data?: string }>;
  isError?: boolean;
}

// ─── Registry Implementation ──────────────────────────────────────────────────

class AdapterRegistry<T extends { id: string }> {
  private readonly store = new Map<string, T>();

  register(adapter: T): void {
    this.store.set(adapter.id, adapter);
  }

  get(id: string): T | undefined {
    return this.store.get(id);
  }

  getOrThrow(id: string): T {
    const adapter = this.store.get(id);
    if (!adapter) {
      throw new Error(`[SubstrateAdapters] No adapter registered with id '${id}'`);
    }
    return adapter;
  }

  list(): T[] {
    return [...this.store.values()];
  }

  has(id: string): boolean {
    return this.store.has(id);
  }

  unregister(id: string): boolean {
    return this.store.delete(id);
  }
}

export const modelAdapterRegistry = new AdapterRegistry<ModelAdapter>();
export const retrieverAdapterRegistry = new AdapterRegistry<RetrieverAdapter>();
export const toolAdapterRegistry = new AdapterRegistry<ToolAdapter>();
export const resourceAdapterRegistry = new AdapterRegistry<ResourceAdapter>();
export const policyAdapterRegistry = new AdapterRegistry<PolicyAdapter>();

// ─── Default / No-Op Adapters (for dry-run and testing) ──────────────────────

const noopModelAdapter: ModelAdapter = {
  id: 'default',
  name: 'No-Op Model Adapter',
  provider: 'substrate-noop',
  mcpCapabilities: { id: 'noop', name: 'No-Op', version: '1.0.0' },
  async infer(input) {
    return {
      content: `[dry-run] Model output for: ${input.prompt.slice(0, 100)}`,
      confidence: 0.75,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      provider: 'substrate-noop',
      model: 'noop',
      durationMs: 1,
    };
  },
};

const noopVerifierAdapter: ModelAdapter = {
  id: 'verifier',
  name: 'No-Op Verifier Adapter',
  provider: 'substrate-noop',
  mcpCapabilities: { id: 'noop-verifier', name: 'No-Op Verifier', version: '1.0.0' },
  async infer(input) {
    return {
      content: `[dry-run] Verification for: ${input.prompt.slice(0, 80)}`,
      confidence: 0.8,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      provider: 'substrate-noop',
      model: 'noop-verifier',
      durationMs: 1,
    };
  },
};

const noopStrongAdapter: ModelAdapter = {
  id: 'strong',
  name: 'No-Op Strong Model Adapter',
  provider: 'substrate-noop',
  mcpCapabilities: { id: 'noop-strong', name: 'No-Op Strong', version: '1.0.0' },
  async infer(input) {
    return {
      content: `[dry-run/escalated] Strong model output for: ${input.prompt.slice(0, 100)}`,
      confidence: 0.88,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      provider: 'substrate-noop',
      model: 'noop-strong',
      durationMs: 1,
    };
  },
};

const noopRetrieverAdapter: RetrieverAdapter = {
  id: 'default',
  name: 'No-Op Retriever Adapter',
  mcpCapabilities: { id: 'noop-retriever', name: 'No-Op Retriever', version: '1.0.0' },
  async retrieve(input) {
    return [
      {
        id: 'noop-doc-1',
        content: `[dry-run] Retrieved document for query: ${input.query.slice(0, 80)}`,
        relevanceScore: 0.8,
        source: 'noop',
        metadata: {},
      },
    ];
  },
};

const noopToolAdapter: ToolAdapter = {
  id: 'default',
  name: 'No-Op Tool Adapter',
  mcpCapabilities: { id: 'noop-tool', name: 'No-Op Tool', version: '1.0.0' },
  async execute(input) {
    return {
      result: { status: 'dry-run', toolId: input.toolId, args: input.args },
      durationMs: 1,
      toolId: input.toolId,
    };
  },
};

const noopPolicyAdapter: PolicyAdapter = {
  id: 'default',
  name: 'No-Op Policy Adapter',
  async evaluate(_input) {
    return {
      allowed: true,
      requiresApproval: false,
      blockedReason: null,
      violatedPolicies: [],
    };
  },
};

// Register no-op defaults (can be overridden by calling register())
modelAdapterRegistry.register(noopModelAdapter);
modelAdapterRegistry.register(noopVerifierAdapter);
modelAdapterRegistry.register(noopStrongAdapter);
retrieverAdapterRegistry.register(noopRetrieverAdapter);
toolAdapterRegistry.register(noopToolAdapter);
policyAdapterRegistry.register(noopPolicyAdapter);

// ─── Wire existing packages as adapters ───────────────────────────────────────

/**
 * Register the tool-mesh as the default ToolAdapter.
 * Called lazily on first use to avoid circular imports.
 */
export async function wireToolMeshAdapter(): Promise<void> {
  const { defaultToolRegistry } = await import('@workspace/tool-mesh');

  const toolMeshAdapter: ToolAdapter = {
    id: 'tool-mesh',
    name: 'SZL Tool Mesh',
    mcpCapabilities: { id: 'tool-mesh', name: 'SZL Tool Mesh', version: '2.0.0' },
    async execute(input, _ctx) {
      const manifest = defaultToolRegistry.get(input.toolId);
      if (!manifest) {
        throw new Error(`Tool '${input.toolId}' not found in tool-mesh registry`);
      }
      const startMs = Date.now();
      // Tool mesh returns the tool manifest — actual execution is done by the executor
      return {
        result: {
          manifest,
          args: input.args,
          executed: false,
          reason: 'tool-mesh adapter resolved manifest',
        },
        durationMs: Date.now() - startMs,
        toolId: input.toolId,
      };
    },
  };

  toolAdapterRegistry.register(toolMeshAdapter);
}

/**
 * Register the policy-engine as the default PolicyAdapter.
 */
export async function wirePolicyEngineAdapter(): Promise<void> {
  const { evaluatePolicies, getRegisteredPolicies } = await import('@szl-holdings/policy-engine');

  const policyEngineAdapter: PolicyAdapter = {
    id: 'policy-engine',
    name: 'SZL Policy Engine',
    async evaluate(input) {
      const policies = getRegisteredPolicies();
      const result = evaluatePolicies(policies, {
        action: input.action,
        subject: {
          id: input.agentId ?? 'substrate-engine',
          roles: ['substrate-agent'],
        },
        resource: {
          type: 'substrate-stage',
          attributes: { riskLevel: input.riskLevel ?? 'low' },
        },
        context: input.context ?? {},
      });

      return {
        allowed: result.allowed,
        requiresApproval: result.requiresApproval ?? false,
        blockedReason: result.violations[0]?.reason ?? null,
        violatedPolicies: result.violations.map((v: { policyId: string }) => v.policyId),
      };
    },
  };

  policyAdapterRegistry.register(policyEngineAdapter);
}
