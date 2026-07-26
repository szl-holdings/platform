/**
 * PRAXISMcpServer — Official SDK Foundation + SZL Governance Layer
 *
 * Wraps the official @modelcontextprotocol/sdk McpServer with the SZL
 * innovation layer: Guardian policy evaluation, proof chain audit writes,
 * tenant isolation, role enforcement, and all 2025 spec capabilities
 * (Sampling, Elicitation, Tasks, Apps, Instructions, Discovery, Roots).
 *
 * All SZL MCP surfaces instantiate PRAXISMcpServer instead of the raw SDK
 * McpServer. The wrapper is transparent to downstream consumers — the same
 * tool registration API, the same transport connect API, the same hook
 * interface — while injecting governance at every interaction boundary.
 */

import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { type ZodRawShape, z } from 'zod';

// ─── Governance Context ────────────────────────────────────────────────────────

export interface TenantContext {
  tenantId: string;
  orgId?: number;
  userId?: number;
  roles?: string[];
  domain?: string;
  actorId?: string;
}

export interface GuardianPolicyResult {
  allowed: boolean;
  reason?: string;
  tier?: 'auto' | 'operator-assisted' | 'human-required';
  requiresApproval?: boolean;
}

export interface ProofChainEntry {
  entryType:
    | 'tool_call'
    | 'resource_read'
    | 'prompt_get'
    | 'sampling_request'
    | 'elicitation'
    | 'task_update'
    | 'app_render';
  toolName?: string;
  tenantId?: string;
  userId?: number;
  args?: Record<string, unknown>;
  outcome: 'allowed' | 'blocked' | 'pending_approval' | 'success' | 'error';
  latencyMs?: number;
  error?: string;
  timestamp: string;
}

export type PolicyEvaluator = (
  toolName: string,
  args: Record<string, unknown>,
  ctx: TenantContext,
) => Promise<GuardianPolicyResult>;

export type ProofChainWriter = (entry: ProofChainEntry) => Promise<void>;

export type AuditLogger = (entry: {
  action: string;
  resource: string;
  resourceId: string;
  description: string;
  metadata: Record<string, unknown>;
  userId?: number | null;
}) => Promise<void>;

export async function evaluateGuardianPolicyFailClosed(
  evaluator: PolicyEvaluator,
  toolName: string,
  args: Record<string, unknown>,
  ctx: TenantContext,
): Promise<GuardianPolicyResult> {
  try {
    const result = await evaluator(toolName, args, ctx);
    if (!result || typeof result.allowed !== 'boolean') {
      return { allowed: false, reason: 'Guardian policy returned an invalid decision' };
    }
    return result;
  } catch {
    return { allowed: false, reason: 'Guardian policy evaluation failed' };
  }
}

// ─── Tool Content Helpers ─────────────────────────────────────────────────────

export type ToolContent = Array<{ type: 'text'; text: string }>;

export function textContent(data: unknown): ToolContent {
  return [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }];
}

export function errorContent(message: string, details?: unknown): ToolContent {
  return [
    {
      type: 'text',
      text: JSON.stringify({ error: message, ...(details ? { details } : {}) }, null, 2),
    },
  ];
}

// ─── Capability Config ────────────────────────────────────────────────────────

export interface PRAXISMcpServerConfig {
  name: string;
  version: string;

  /** Optional tenant context injected into every governance check */
  tenantContext?: TenantContext;

  /** Guardian policy evaluator — runs before every tool call */
  policyEvaluator?: PolicyEvaluator;

  /** Proof chain writer — records every governed interaction */
  proofChainWriter?: ProofChainWriter;

  /** Audit logger — appended to the immutable audit trail */
  auditLogger?: AuditLogger;

  /** Enable Sampling capability (server can request LLM completions from clients) */
  enableSampling?: boolean;

  /** Enable Elicitation capability (server can request structured user input) */
  enableElicitation?: boolean;

  /** Enable Tasks capability (long-running operations with progress tracking) */
  enableTasks?: boolean;

  /** Enable Apps capability (domain micro-dashboard HTML served inline) */
  enableApps?: boolean;

  /** Enable Instructions (dynamic context-aware guidance sent at initialize) */
  enableInstructions?: boolean;

  /** Enable Discovery (change notifications when tools/resources/prompts change) */
  enableDiscovery?: boolean;

  /** Enable Resource Subscriptions (MCP resources/subscribe capability with push notifications) */
  enableResourceSubscription?: boolean;

  /** Enable Roots (tenant-scoped filesystem boundary enforcement) */
  enableRoots?: boolean;

  /** Server-level instructions text — sent to LLMs in capabilities */
  instructions?: string;

  /** Roots definitions for tenant filesystem boundary enforcement */
  roots?: Array<{ uri: string; name?: string }>;
}

// ─── Task Registry ────────────────────────────────────────────────────────────

export interface PRAXISTask {
  taskId: string;
  toolName: string;
  substateRunId?: string;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'cancelled';
  progress?: number;
  total?: number;
  progressToken?: string | number;
  createdAt: string;
  updatedAt: string;
}

// ─── App Registry ─────────────────────────────────────────────────────────────

export interface PRAXISApp {
  appId: string;
  domain: string;
  title: string;
  description: string;
  renderHtml: (tenantCtx: TenantContext) => Promise<string>;
}

// ─── Discovery Notification Bus ───────────────────────────────────────────────

export type DiscoveryEventType =
  | 'tools/list_changed'
  | 'resources/list_changed'
  | 'prompts/list_changed';

// ─── PRAXISMcpServer ───────────────────────────────────────────────────────────

export class PRAXISMcpServer {
  private readonly _sdk: McpServer;
  private readonly _config: PRAXISMcpServerConfig;
  private readonly _tasks = new Map<string, PRAXISTask>();
  private readonly _apps = new Map<string, PRAXISApp>();
  private readonly _externalNotifyListeners = new Set<(type: DiscoveryEventType) => void>();

  constructor(config: PRAXISMcpServerConfig) {
    this._config = config;

    const capabilities: Record<string, unknown> = {
      tools: { listChanged: config.enableDiscovery ?? true },
      resources: {
        subscribe: config.enableResourceSubscription ?? false,
        listChanged: config.enableDiscovery ?? true,
      },
      prompts: { listChanged: config.enableDiscovery ?? true },
      logging: {},
    };

    if (config.enableSampling) {
      capabilities.sampling = {};
    }
    if (config.enableElicitation) {
      capabilities.elicitation = {};
    }
    if (config.enableRoots && config.roots && config.roots.length > 0) {
      capabilities.roots = { listChanged: false };
    }

    this._sdk = new McpServer(
      { name: config.name, version: config.version },
      { capabilities: capabilities as never },
    );

    if (config.enableInstructions && config.instructions) {
      this._registerInstructionsResource(config.instructions);
    }

    if (config.enableRoots && config.roots && config.roots.length > 0) {
      this._registerRootsResource(config.roots);
    }

    if (config.enableTasks) {
      this._registerTaskManagementTools();
    }

    if (config.enableApps) {
      this._registerAppsListTool();
    }
  }

  /** Access the raw SDK McpServer instance (for transport connection) */
  get sdk(): McpServer {
    return this._sdk;
  }

  /** Access the low-level protocol Server (for advanced SDK operations) */
  get server() {
    return this._sdk.server;
  }

  // ─── Tool Registration with Governance ──────────────────────────────────────

  /**
   * Register a tool with full SZL governance middleware.
   * Every call passes through: Guardian policy → proof chain start →
   * handler execution → proof chain close → audit log.
   */
  tool<T extends ZodRawShape>(
    name: string,
    description: string,
    schema: T,
    handler: (
      args: z.infer<z.ZodObject<T>>,
      ctx: TenantContext,
    ) => Promise<{ content: ToolContent; isError?: boolean }>,
  ): void {
    // Cast to bypass generic inference — PRAXISMcpServer provides its own type-safe wrapper generics
    const sdkRegister = this._sdk.registerTool.bind(this._sdk) as (
      name: string,
      config: { description: string; inputSchema: ZodRawShape },
      cb: (args: Record<string, unknown>, extra: unknown) => Promise<CallToolResult>,
    ) => void;
    sdkRegister(name, { description, inputSchema: schema }, async (rawArgs, _extra) => {
      const args = rawArgs as z.infer<z.ZodObject<T>>;
      const start = Date.now();
      const ctx: TenantContext = this._config.tenantContext ?? { tenantId: 'system' };
      const typedArgs = rawArgs;

      // --- Guardian policy evaluation ---
      if (this._config.policyEvaluator) {
        const policyResult = await evaluateGuardianPolicyFailClosed(
          this._config.policyEvaluator,
          name,
          typedArgs,
          ctx,
        );
        if (!policyResult.allowed) {
          const latencyMs = Date.now() - start;
          void this._writeProofChain({
            entryType: 'tool_call',
            toolName: name,
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            args: typedArgs,
            outcome: 'blocked',
            latencyMs,
            error: policyResult.reason,
            timestamp: new Date().toISOString(),
          });
          return {
            content: errorContent(
              `Tool blocked by policy: ${policyResult.reason ?? 'Guardian denied'}`,
            ),
            isError: true,
          };
        }
      }

      // --- Execute handler ---
      let result: { content: ToolContent; isError?: boolean };
      let outcome: 'success' | 'error' = 'success';
      let errorMsg: string | undefined;
      try {
        result = await handler(args, ctx);
        if (result.isError) {
          outcome = 'error';
          errorMsg = result.content[0]?.text;
        }
      } catch (e) {
        outcome = 'error';
        errorMsg = e instanceof Error ? e.message : String(e);
        result = { content: errorContent(errorMsg), isError: true };
      }

      const latencyMs = Date.now() - start;

      // --- Proof chain + audit ---
      void this._writeProofChain({
        entryType: 'tool_call',
        toolName: name,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        args: typedArgs,
        outcome,
        latencyMs,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });

      void this._writeAuditLog({
        action: 'mcp_tool_invoke',
        resource: 'mcp_tool',
        resourceId: name,
        description: `MCP tool invocation: ${name}`,
        metadata: { toolName: name, args: typedArgs, latencyMs, outcome },
        userId: ctx.userId ?? null,
      });

      return { content: result.content, isError: result.isError } as CallToolResult;
    });
  }

  /**
   * Register a tool with a pre-built raw handler (for migrating existing
   * switch-case handlers that already do their own error handling).
   * Governance middleware is still applied.
   */
  rawTool(
    name: string,
    description: string,
    inputSchema: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    },
    handler: (args: Record<string, unknown>, ctx: TenantContext) => Promise<unknown>,
  ): void {
    // Build a Zod schema from the raw JSON Schema properties for SDK compatibility
    const zodShape: ZodRawShape = {};
    for (const [key, prop] of Object.entries(inputSchema.properties)) {
      const p = prop as Record<string, unknown>;
      const isRequired = (inputSchema.required ?? []).includes(key);
      let fieldSchema: z.ZodTypeAny;
      if (p.type === 'string') {
        fieldSchema = p.enum ? z.enum(p.enum as [string, ...string[]]) : z.string();
      } else if (p.type === 'number') {
        fieldSchema = z.number();
      } else if (p.type === 'boolean') {
        fieldSchema = z.boolean();
      } else if (p.type === 'array') {
        fieldSchema = z.array(z.unknown());
      } else {
        fieldSchema = z.unknown();
      }
      zodShape[key] = isRequired ? fieldSchema : fieldSchema.optional();
    }

    const sdkRegisterRaw = this._sdk.registerTool.bind(this._sdk) as (
      name: string,
      config: { description: string; inputSchema: ZodRawShape },
      cb: (args: Record<string, unknown>, extra: unknown) => Promise<CallToolResult>,
    ) => void;
    sdkRegisterRaw(name, { description, inputSchema: zodShape }, async (typedArgs, _extra) => {
      const start = Date.now();
      const ctx: TenantContext = this._config.tenantContext ?? { tenantId: 'system' };

      // Guardian policy
      if (this._config.policyEvaluator) {
        const policyResult = await evaluateGuardianPolicyFailClosed(
          this._config.policyEvaluator,
          name,
          typedArgs,
          ctx,
        );
        if (!policyResult.allowed) {
          const latencyMs = Date.now() - start;
          void this._writeProofChain({
            entryType: 'tool_call',
            toolName: name,
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            args: typedArgs,
            outcome: 'blocked',
            latencyMs,
            error: policyResult.reason,
            timestamp: new Date().toISOString(),
          });
          return {
            content: errorContent(
              `Tool blocked by policy: ${policyResult.reason ?? 'Guardian denied'}`,
            ),
            isError: true,
          };
        }
      }

      let outcome: 'success' | 'error' = 'success';
      let errorMsg: string | undefined;
      let content: ToolContent;
      let extraMeta: Record<string, unknown> | undefined;
      try {
        const raw = await handler(typedArgs, ctx);
        // Detect if the handler returned a pre-formed CallToolResult (has a
        // content[] array) and pass it through verbatim, preserving any _meta
        // structured metadata the gateway may have attached. This allows
        // higher-level handlers (e.g. the PRAXIS governance layer in
        // nexus-gateway-server.ts) to produce first-class MCP metadata fields
        // without having them re-serialized into a single text blob.
        if (
          raw !== null &&
          typeof raw === 'object' &&
          'content' in raw &&
          Array.isArray((raw as Record<string, unknown>).content)
        ) {
          const r = raw as {
            content: ToolContent;
            isError?: boolean;
            _meta?: Record<string, unknown>;
          };
          content = r.content;
          if (r.isError) {
            outcome = 'error';
          }
          if (r._meta) {
            extraMeta = r._meta;
          }
        } else {
          content = textContent(raw);
        }
      } catch (e) {
        outcome = 'error';
        errorMsg = e instanceof Error ? e.message : String(e);
        content = errorContent(errorMsg);
      }

      const latencyMs = Date.now() - start;

      void this._writeProofChain({
        entryType: 'tool_call',
        toolName: name,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        args: typedArgs,
        outcome,
        latencyMs,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });

      void this._writeAuditLog({
        action: 'mcp_tool_invoke',
        resource: 'mcp_tool',
        resourceId: name,
        description: `MCP tool invocation: ${name}`,
        metadata: { toolName: name, args: typedArgs, latencyMs, outcome },
        userId: ctx.userId ?? null,
      });

      return {
        content,
        ...(outcome === 'error' ? { isError: true } : {}),
        ...(extraMeta ? { _meta: extraMeta } : {}),
      } as CallToolResult;
    });
  }

  // ─── Resource Registration ───────────────────────────────────────────────────

  resource(
    name: string,
    uri: string,
    metadata: { description?: string; mimeType?: string },
    handler: (
      uri: string,
      ctx: TenantContext,
    ) => Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }>,
  ): void {
    this._sdk.resource(name, uri, metadata, async (_uri, _extra) => {
      const ctx: TenantContext = this._config.tenantContext ?? { tenantId: 'system' };
      const start = Date.now();
      try {
        const result = await handler(String(_uri), ctx);
        const latencyMs = Date.now() - start;
        void this._writeProofChain({
          entryType: 'resource_read',
          toolName: uri,
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          outcome: 'success',
          latencyMs,
          timestamp: new Date().toISOString(),
        });
        return result;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        void this._writeProofChain({
          entryType: 'resource_read',
          toolName: uri,
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          outcome: 'error',
          error: errorMsg,
          latencyMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        });
        throw e;
      }
    });
  }

  // ─── Prompt Registration ─────────────────────────────────────────────────────

  prompt(
    name: string,
    description: string,
    argsShape: ZodRawShape,
    handler: (
      args: Record<string, string>,
      ctx: TenantContext,
    ) => Promise<{
      description?: string;
      messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }>;
    }>,
  ): void {
    // Cast _sdk.prompt to a non-recursive signature to break TS2589
    // (excessively deep Zod type instantiation in @modelcontextprotocol/sdk@^1.0).
    // The runtime contract is identical; only the type-checker boundary is widened here.
    const sdkPrompt = this._sdk.prompt.bind(this._sdk) as (
      n: string,
      d: string,
      s: ZodRawShape,
      cb: (args: Record<string, unknown>, extra: unknown) => Promise<unknown>,
    ) => void;
    sdkPrompt(name, description, argsShape, async (args, _extra) => {
      const ctx: TenantContext = this._config.tenantContext ?? { tenantId: 'system' };
      void this._writeProofChain({
        entryType: 'prompt_get',
        toolName: name,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        outcome: 'success',
        timestamp: new Date().toISOString(),
      });
      return handler(args as Record<string, string>, ctx);
    });
  }

  // ─── Discovery ───────────────────────────────────────────────────────────────

  /**
   * Notify all connected clients that the tool/resource/prompt list has changed.
   * Called automatically when enable_server / disable_server changes the surface,
   * or when a connector comes online.
   */
  async notifyListChanged(type: DiscoveryEventType = 'tools/list_changed'): Promise<void> {
    const methodMap: Record<DiscoveryEventType, string> = {
      'tools/list_changed': 'notifications/tools/list_changed',
      'resources/list_changed': 'notifications/resources/list_changed',
      'prompts/list_changed': 'notifications/prompts/list_changed',
    };

    try {
      await this._sdk.server.notification({
        method: methodMap[type],
        params: {},
      });
    } catch {
      // Client may not be connected yet
    }

    // Also fire to in-process subscribers (e.g., SSE fan-out)
    for (const listener of this._externalNotifyListeners) {
      try {
        listener(type);
      } catch {
        /* non-fatal */
      }
    }
  }

  /** Notify subscribed MCP clients that a specific resource has been updated. */
  async notifyResourceUpdated(uri: string): Promise<void> {
    try {
      await this._sdk.server.notification({
        method: 'notifications/resources/updated',
        params: { uri },
      });
    } catch {
      // Client may not be connected yet
    }
  }

  /** Subscribe to discovery notifications (for SSE fan-out transport) */
  onDiscoveryNotification(listener: (type: DiscoveryEventType) => void): () => void {
    this._externalNotifyListeners.add(listener);
    return () => {
      this._externalNotifyListeners.delete(listener);
    };
  }

  // ─── Sampling ────────────────────────────────────────────────────────────────

  /**
   * Request an LLM completion from a connected client (e.g., Claude Desktop).
   * Every sampling request passes Guardian policy evaluation before dispatch.
   */
  async requestSampling(params: {
    messages: Array<{
      role: 'user' | 'assistant';
      content: { type: 'text'; text: string };
    }>;
    modelPreferences?: {
      hints?: Array<{ name?: string }>;
      costPriority?: number;
      speedPriority?: number;
      intelligencePriority?: number;
    };
    systemPrompt?: string;
    maxTokens: number;
    metadata?: Record<string, unknown>;
  }): Promise<{
    role: 'assistant';
    content: { type: 'text'; text: string };
    model: string;
    stopReason?: string;
  }> {
    const ctx: TenantContext = this._config.tenantContext ?? { tenantId: 'system' };
    const start = Date.now();

    // Guardian policy check on sampling prompt
    if (this._config.policyEvaluator) {
      const policyResult = await evaluateGuardianPolicyFailClosed(
        this._config.policyEvaluator,
        'sampling/createMessage',
        { systemPrompt: params.systemPrompt, maxTokens: params.maxTokens },
        ctx,
      );
      if (!policyResult.allowed) {
        throw new Error(
          `Sampling blocked by Guardian policy: ${policyResult.reason ?? 'policy denied'}`,
        );
      }
    }

    try {
      const result = await this._sdk.server.createMessage({
        messages: params.messages,
        modelPreferences: params.modelPreferences,
        systemPrompt: params.systemPrompt,
        maxTokens: params.maxTokens,
      });

      const latencyMs = Date.now() - start;
      void this._writeProofChain({
        entryType: 'sampling_request',
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        args: { maxTokens: params.maxTokens, messageCount: params.messages.length },
        outcome: 'success',
        latencyMs,
        timestamp: new Date().toISOString(),
      });

      return {
        role: 'assistant',
        content: result.content as { type: 'text'; text: string },
        model: result.model,
        stopReason: result.stopReason ?? undefined,
      };
    } catch (e) {
      void this._writeProofChain({
        entryType: 'sampling_request',
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        outcome: 'error',
        error: e instanceof Error ? e.message : String(e),
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      });
      throw e;
    }
  }

  // ─── Elicitation ─────────────────────────────────────────────────────────────

  /**
   * Request structured information from a connected user via the MCP protocol.
   * Sensitive elicitation types (financial approvals, data access consent) route
   * through an approval gate before the request reaches the user.
   */
  async requestElicitation(params: {
    message: string;
    requestedSchema: Record<string, unknown>;
    elicitationType?: 'confirmation' | 'form' | 'file_selection' | 'approval';
    requiresApprovalGate?: boolean;
  }): Promise<{
    action: 'accept' | 'deny' | 'cancel';
    content?: Record<string, unknown>;
  }> {
    const ctx: TenantContext = this._config.tenantContext ?? { tenantId: 'system' };
    const start = Date.now();

    void this._writeProofChain({
      entryType: 'elicitation',
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      args: { message: params.message, elicitationType: params.elicitationType },
      outcome: 'pending_approval',
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await this._sdk.server.elicitInput({
        message: params.message,
        requestedSchema: {
          type: 'object',
          properties: params.requestedSchema,
        } as never,
      });

      const latencyMs = Date.now() - start;
      void this._writeProofChain({
        entryType: 'elicitation',
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        args: { action: result.action },
        outcome: result.action === 'accept' ? 'success' : 'blocked',
        latencyMs,
        timestamp: new Date().toISOString(),
      });

      return {
        action: result.action as 'accept' | 'deny' | 'cancel',
        content: result.content as Record<string, unknown> | undefined,
      };
    } catch (e) {
      void this._writeProofChain({
        entryType: 'elicitation',
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        outcome: 'error',
        error: e instanceof Error ? e.message : String(e),
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      });
      throw e;
    }
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────────

  /**
   * Create a tracked Task for a long-running MCP tool call.
   * The task is linked to a Substrate run ID and emits progress
   * notifications as the run advances through stages.
   */
  createTask(params: {
    toolName: string;
    substateRunId?: string;
    progressToken?: string | number;
  }): PRAXISTask {
    const taskId = randomUUID();
    const now = new Date().toISOString();
    const task: PRAXISTask = {
      taskId,
      toolName: params.toolName,
      substateRunId: params.substateRunId,
      status: 'running',
      progress: 0,
      progressToken: params.progressToken,
      createdAt: now,
      updatedAt: now,
    };
    this._tasks.set(taskId, task);
    return task;
  }

  /** Update task progress and emit MCP progress notification */
  async updateTaskProgress(taskId: string, progress: number, total?: number): Promise<void> {
    const task = this._tasks.get(taskId);
    if (!task) return;
    task.progress = progress;
    task.total = total;
    task.updatedAt = new Date().toISOString();

    if (task.progressToken != null) {
      try {
        await this._sdk.server.notification({
          method: 'notifications/progress',
          params: {
            progressToken: task.progressToken,
            progress,
            total: total ?? 100,
          },
        });
      } catch {
        /* client may not be connected */
      }
    }
  }

  /** Mark a task as complete or failed */
  async finalizeTask(
    taskId: string,
    status: 'complete' | 'failed' | 'cancelled',
    error?: string,
  ): Promise<void> {
    const task = this._tasks.get(taskId);
    if (!task) return;
    task.status = status;
    task.updatedAt = new Date().toISOString();

    void this._writeProofChain({
      entryType: 'task_update',
      toolName: task.toolName,
      tenantId: this._config.tenantContext?.tenantId,
      args: { taskId, substateRunId: task.substateRunId, status },
      outcome: status === 'complete' ? 'success' : 'error',
      error,
      timestamp: task.updatedAt,
    });
  }

  /** Get task by ID */
  getTask(taskId: string): PRAXISTask | undefined {
    return this._tasks.get(taskId);
  }

  /** List all active tasks */
  listTasks(): PRAXISTask[] {
    return [...this._tasks.values()];
  }

  // ─── Apps ─────────────────────────────────────────────────────────────────────

  /**
   * Register a domain App — a lightweight interactive HTML micro-dashboard
   * rendered inline by MCP clients that support the Apps capability.
   */
  registerApp(app: PRAXISApp): void {
    this._apps.set(app.appId, app);
  }

  /** Get registered App by ID */
  getApp(appId: string): PRAXISApp | undefined {
    return this._apps.get(appId);
  }

  /** List all registered Apps */
  listApps(): PRAXISApp[] {
    return [...this._apps.values()];
  }

  /** Render an App's HTML for the current tenant context */
  async renderApp(appId: string): Promise<{ html: string; title: string; domain: string } | null> {
    const app = this._apps.get(appId);
    if (!app) return null;
    const ctx: TenantContext = this._config.tenantContext ?? { tenantId: 'system' };
    const start = Date.now();
    try {
      const html = await app.renderHtml(ctx);
      void this._writeProofChain({
        entryType: 'app_render',
        toolName: appId,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        outcome: 'success',
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      });
      return { html, title: app.title, domain: app.domain };
    } catch (e) {
      void this._writeProofChain({
        entryType: 'app_render',
        toolName: appId,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        outcome: 'error',
        error: e instanceof Error ? e.message : String(e),
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  // ─── Connect to Transport ────────────────────────────────────────────────────

  async connect(transport: Parameters<McpServer['connect']>[0]): Promise<void> {
    return this._sdk.connect(transport);
  }

  async close(): Promise<void> {
    return this._sdk.close();
  }

  // ─── Private: Built-in Capability Tools ─────────────────────────────────────

  private _registerInstructionsResource(instructions: string): void {
    this._sdk.resource(
      'nexus://instructions',
      'nexus://instructions',
      {
        description:
          'Dynamic system-level guidance for connected LLMs based on tenant context, active role, and domain',
        mimeType: 'text/plain',
      },
      async () => ({
        contents: [
          {
            uri: 'nexus://instructions',
            text: instructions,
            mimeType: 'text/plain',
          },
        ],
      }),
    );
  }

  private _registerRootsResource(roots: Array<{ uri: string; name?: string }>): void {
    this._sdk.resource(
      'nexus://roots',
      'nexus://roots',
      {
        description:
          'Tenant-scoped filesystem boundary constraints — defines allowed root paths for connected clients',
        mimeType: 'application/json',
      },
      async () => ({
        contents: [
          {
            uri: 'nexus://roots',
            text: JSON.stringify({ roots }, null, 2),
            mimeType: 'application/json',
          },
        ],
      }),
    );
  }

  private _registerTaskManagementTools(): void {
    this._sdk.tool(
      'nexus_list_tasks',
      'List active MCP tasks created by long-running tool calls. Returns task IDs, status, progress, and linked Substrate run IDs.',
      {},
      async () => {
        const tasks = this.listTasks();
        return { content: [{ type: 'text', text: JSON.stringify({ tasks }, null, 2) }] };
      },
    );
  }

  private _registerAppsListTool(): void {
    this._sdk.tool(
      'nexus_list_apps',
      'List available domain micro-dashboard Apps. Returns app IDs, domains, and descriptions. Use nexus_render_app to get the HTML.',
      {},
      async () => {
        const apps = this.listApps().map((a) => ({
          appId: a.appId,
          domain: a.domain,
          title: a.title,
          description: a.description,
        }));
        return { content: [{ type: 'text', text: JSON.stringify({ apps }, null, 2) }] };
      },
    );

    // Use registerTool (not deprecated .tool()) with an explicit cast to bypass TS2589
    // "type instantiation excessively deep". The .tool() overload with a ZodRawShape arg
    // triggers unbounded generic inference in TS >=6; registerTool with a cast avoids it.
    // Pattern matches the existing sdkRegister cast used in PRAXISMcpServer.registerTool.
    const _renderAppRegister = this._sdk.registerTool.bind(this._sdk) as (
      name: string,
      config: { description: string; inputSchema: ZodRawShape },
      cb: (
        args: Record<string, unknown>,
      ) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>,
    ) => void;
    _renderAppRegister(
      'nexus_render_app',
      {
        description:
          'Render a domain micro-dashboard App as inline HTML. The HTML is scoped to the authenticated tenant and generated from live platform data.',
        inputSchema: { appId: z.string().describe('App ID from nexus_list_apps') },
      },
      async (rawArgs: Record<string, unknown>) => {
        const args = rawArgs as { appId: string };
        const result = await this.renderApp(args.appId);
        if (!result) {
          return {
            content: [
              { type: 'text', text: JSON.stringify({ error: `App '${args.appId}' not found` }) },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  appId: args.appId,
                  title: result.title,
                  domain: result.domain,
                  html: result.html,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );
  }

  // ─── Private: Governance Writers ──────────────────────────────────────────────

  private async _writeProofChain(entry: ProofChainEntry): Promise<void> {
    if (this._config.proofChainWriter) {
      try {
        await this._config.proofChainWriter(entry);
      } catch {
        /* proof chain writes must not throw */
      }
    }
  }

  private async _writeAuditLog(entry: Parameters<AuditLogger>[0]): Promise<void> {
    if (this._config.auditLogger) {
      try {
        await this._config.auditLogger(entry);
      } catch {
        /* audit writes must not throw */
      }
    }
  }
}
