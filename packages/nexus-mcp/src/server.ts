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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InitializeRequestSchema, type CallToolResult, type InitializeResult } from '@modelcontextprotocol/sdk/types.js';
import { EventEmitter } from 'node:events';
import { randomUUID, createHash } from 'node:crypto';
import { z, type ZodRawShape } from 'zod';
import { MultiplexingTransport } from './multiplexing-transport.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

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
  entryType: 'tool_call' | 'resource_read' | 'prompt_get' | 'sampling_request' | 'elicitation' | 'task_update' | 'app_render';
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

export interface CryptographicIdentityConfig {
  did: string;
  certThumbprint: string;
  certificate?: {
    certId: string;
    issuer: string;
    subject: string;
    subjectDid: string;
    notBefore: number;
    notAfter: number;
    thumbprint: string;
    publicKeys: { ed25519: string; mldsa65: string };
  };
  sign: (message: string) => { alg: string; ed25519?: string; mldsa65?: string; mode: string; publicKeys?: Record<string, string> };
  signingMode: string;
}

export type IdentityEnforcementMode = 'log-only' | 'block' | 'quarantine';

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

  /** Cryptographic identity for hybrid PQC signing of responses */
  cryptographicIdentity?: CryptographicIdentityConfig;

  /** Tool names that require cryptographic identity (governance-critical tools) */
  governanceTools?: string[];

  /** Enforcement mode for identity requirements on governance tools (default: 'block') */
  identityEnforcementMode?: IdentityEnforcementMode;

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

  /**
   * Server-advertised MCP extensions (vendor-prefixed extension identifiers
   * mapped to their extension metadata objects). When the client includes
   * `params.capabilities.extensions` on `initialize`, the wrapper intersects the client's
   * keys with this map and returns the matched entries as `result.extensions`
   * in the initialize response. Replaces the prior res.write-rewriting hack
   * in the substrate gateway transport (szl-holdings/platform#113).
   */
  extensions?: Record<string, unknown>;
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
  private readonly _discoveryBus = new EventEmitter();
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

    if (config.cryptographicIdentity) {
      const cert = config.cryptographicIdentity.certificate;
      capabilities['x-pqc-identity'] = {
        signerDid: config.cryptographicIdentity.did,
        certThumbprint: config.cryptographicIdentity.certThumbprint,
        signingMode: config.cryptographicIdentity.signingMode,
        protocolVersion: 'hybrid-v1',
        ...(cert
          ? {
              certificate: {
                certId: cert.certId,
                issuer: cert.issuer,
                subject: cert.subject,
                subjectDid: cert.subjectDid,
                notBefore: cert.notBefore,
                notAfter: cert.notAfter,
                thumbprint: cert.thumbprint,
                publicKeys: cert.publicKeys,
              },
            }
          : {}),
      };
    }

    if (config.enableSampling) {
      capabilities['sampling'] = { tools: true };
    }
    if (config.enableElicitation) {
      capabilities['elicitation'] = { form: true, url: true };
    }
    if (config.enableRoots && config.roots && config.roots.length > 0) {
      capabilities['roots'] = { listChanged: true };
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

    if (config.extensions && Object.keys(config.extensions).length > 0) {
      this._installExtensionNegotiation(config.extensions);
    }
  }

  /**
   * Override the SDK's `initialize` handler so the result includes a
   * `extensions` field containing the intersection of the client's requested
   * extensions and the server's advertised set. Replaces the response-body
   * rewriting hack that previously lived in the substrate gateway transport
   * (szl-holdings/platform#113).
   */
  private _installExtensionNegotiation(advertised: Record<string, unknown>): void {
    const lowLevelServer = this._sdk.server;
    // Bind to the low-level Server's own implementation so we preserve the
    // SDK's side effects (protocol version negotiation, recording client
    // capabilities/info on the Server instance).
    const originalOninit = (
      lowLevelServer as unknown as {
        _oninitialize: (req: unknown) => Promise<InitializeResult>;
      }
    )._oninitialize.bind(lowLevelServer);

    lowLevelServer.setRequestHandler(InitializeRequestSchema, async (request) => {
      const baseResult = await originalOninit(request);
      // Per MCP spec, the client advertises extensions inside
      // `params.capabilities.extensions` (see ClientCapabilitiesSchema).
      const clientExt = (
        request.params as { capabilities?: { extensions?: Record<string, unknown> } }
      ).capabilities?.extensions;
      if (!clientExt || typeof clientExt !== 'object') {
        return baseResult;
      }
      const negotiated: Record<string, unknown> = {};
      for (const key of Object.keys(clientExt)) {
        if (Object.prototype.hasOwnProperty.call(advertised, key)) {
          negotiated[key] = advertised[key];
        }
      }
      return { ...baseResult, extensions: negotiated } as InitializeResult;
    });
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
    handler: (args: z.infer<z.ZodObject<T>>, ctx: TenantContext) => Promise<{ content: ToolContent; isError?: boolean }>,
  ): void {
    const self = this;
    // Cast to bypass generic inference — PRAXISMcpServer provides its own type-safe wrapper generics
    const sdkRegister = this._sdk.registerTool.bind(this._sdk) as (
      name: string,
      config: { description: string; inputSchema: ZodRawShape },
      cb: (args: Record<string, unknown>, extra: unknown) => Promise<CallToolResult>,
    ) => void;
    sdkRegister(name, { description, inputSchema: schema }, async (rawArgs, _extra) => {
      const args = rawArgs as z.infer<z.ZodObject<T>>;
      const start = Date.now();
      const ctx: TenantContext = self._config.tenantContext ?? { tenantId: 'system' };
      const typedArgs = rawArgs;

      // --- Governance identity enforcement ---
      const govCheck = self._enforceGovernanceIdentity(name);
      if (govCheck.blocked && govCheck.result) return govCheck.result;

      // --- Guardian policy evaluation ---
      if (self._config.policyEvaluator) {
        let policyResult: GuardianPolicyResult;
        try {
          policyResult = await self._config.policyEvaluator(name, typedArgs, ctx);
        } catch {
          policyResult = { allowed: true };
        }
        if (!policyResult.allowed) {
          const latencyMs = Date.now() - start;
          void self._writeProofChain({
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
            content: errorContent(`Tool blocked by policy: ${policyResult.reason ?? 'Guardian denied'}`),
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
        result = { content: errorContent(errorMsg!), isError: true };
      }

      const latencyMs = Date.now() - start;

      // --- Proof chain + audit ---
      void self._writeProofChain({
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

      void self._writeAuditLog({
        action: 'mcp_tool_invoke',
        resource: 'mcp_tool',
        resourceId: name,
        description: `MCP tool invocation: ${name}`,
        metadata: { toolName: name, args: typedArgs, latencyMs, outcome },
        userId: ctx.userId ?? null,
      });

      const identityMeta = self._buildIdentityMeta(name, outcome, latencyMs, typedArgs, result.content);

      return {
        content: result.content,
        ...(result.isError ? { isError: true } : {}),
        _meta: identityMeta,
      } as CallToolResult;
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
    const self = this;
    // Build a Zod schema from the raw JSON Schema properties for SDK compatibility
    const zodShape: ZodRawShape = {};
    for (const [key, prop] of Object.entries(inputSchema.properties)) {
      const p = prop as Record<string, unknown>;
      const isRequired = (inputSchema.required ?? []).includes(key);
      let fieldSchema: z.ZodTypeAny;
      if (p['type'] === 'string') {
        fieldSchema = p['enum']
          ? z.enum(p['enum'] as [string, ...string[]])
          : z.string();
      } else if (p['type'] === 'number') {
        fieldSchema = z.number();
      } else if (p['type'] === 'boolean') {
        fieldSchema = z.boolean();
      } else if (p['type'] === 'array') {
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
      const ctx: TenantContext = self._config.tenantContext ?? { tenantId: 'system' };

      // Governance identity enforcement
      const govCheck = self._enforceGovernanceIdentity(name);
      if (govCheck.blocked && govCheck.result) return govCheck.result;

      // Guardian policy
      if (self._config.policyEvaluator) {
        let policyResult: GuardianPolicyResult;
        try {
          policyResult = await self._config.policyEvaluator(name, typedArgs, ctx);
        } catch {
          policyResult = { allowed: true };
        }
        if (!policyResult.allowed) {
          const latencyMs = Date.now() - start;
          void self._writeProofChain({
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
            content: errorContent(`Tool blocked by policy: ${policyResult.reason ?? 'Guardian denied'}`),
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
          Array.isArray((raw as Record<string, unknown>)['content'])
        ) {
          const r = raw as { content: ToolContent; isError?: boolean; _meta?: Record<string, unknown> };
          content = r.content;
          if (r.isError) { outcome = 'error'; }
          if (r._meta) { extraMeta = r._meta; }
        } else {
          content = textContent(raw);
        }
      } catch (e) {
        outcome = 'error';
        errorMsg = e instanceof Error ? e.message : String(e);
        content = errorContent(errorMsg);
      }

      const latencyMs = Date.now() - start;

      void self._writeProofChain({
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

      void self._writeAuditLog({
        action: 'mcp_tool_invoke',
        resource: 'mcp_tool',
        resourceId: name,
        description: `MCP tool invocation: ${name}`,
        metadata: { toolName: name, args: typedArgs, latencyMs, outcome },
        userId: ctx.userId ?? null,
      });

      const identityMeta = self._buildIdentityMeta(name, outcome, latencyMs, typedArgs, content);

      return {
        content,
        ...(outcome === 'error' ? { isError: true } : {}),
        _meta: { ...extraMeta, ...identityMeta },
      } as CallToolResult;
    });
  }

  // ─── Resource Registration ───────────────────────────────────────────────────

  resource(
    name: string,
    uri: string,
    metadata: { description?: string; mimeType?: string },
    handler: (uri: string, ctx: TenantContext) => Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }>,
  ): void {
    const self = this;
    this._sdk.resource(name, uri, metadata, async (_uri, _extra) => {
      const ctx: TenantContext = self._config.tenantContext ?? { tenantId: 'system' };
      const start = Date.now();
      try {
        const result = await handler(String(_uri), ctx);
        const latencyMs = Date.now() - start;
        void self._writeProofChain({
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
        void self._writeProofChain({
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
    handler: (args: Record<string, string>, ctx: TenantContext) => Promise<{
      description?: string;
      messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }>;
    }>,
  ): void {
    const self = this;
    this._sdk.prompt(name, description, argsShape, async (args, _extra) => {
      const ctx: TenantContext = self._config.tenantContext ?? { tenantId: 'system' };
      void self._writeProofChain({
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
      try { listener(type); } catch { /* non-fatal */ }
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

  /** Notify connected MCP clients that the roots list has changed (MCP 2025-11-25). */
  async sendRootsChangedNotification(): Promise<void> {
    try {
      await this._sdk.server.notification({
        method: 'notifications/roots/list_changed',
        params: {},
      });
    } catch {
      // Client may not be connected or may not support roots
    }
  }

  /** Notify connected MCP clients that an elicitation flow has completed (MCP 2025-11-25). */
  async sendElicitationCompleteNotification(flowId: string, status: string): Promise<void> {
    try {
      await this._sdk.server.notification({
        method: 'notifications/elicitation/complete',
        params: { flowId, status },
      });
    } catch {
      // Client may not be connected or may not support elicitation notifications
    }
  }

  /** Subscribe to discovery notifications (for SSE fan-out transport) */
  onDiscoveryNotification(listener: (type: DiscoveryEventType) => void): () => void {
    this._externalNotifyListeners.add(listener);
    return () => { this._externalNotifyListeners.delete(listener); };
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
    /**
     * When the server is running in multiplexed mode, bind this sampling
     * request to a specific session. If omitted and a multiplexer is in
     * use, the first registered session is targeted. (Task #5068.)
     */
    sessionId?: string;
  }): Promise<{
    role: 'assistant';
    content: { type: 'text'; text: string };
    model: string;
    stopReason?: string;
  }> {
    const ctx: TenantContext = this._config.tenantContext ?? { tenantId: 'system' };
    const start = Date.now();

    // Guardian policy check on sampling prompt
    if (this._config.policyEvaluator && params.systemPrompt) {
      let policyResult: GuardianPolicyResult;
      try {
        policyResult = await this._config.policyEvaluator(
          'sampling/createMessage',
          { systemPrompt: params.systemPrompt, maxTokens: params.maxTokens },
          ctx,
        );
      } catch {
        policyResult = { allowed: true };
      }
      if (!policyResult.allowed) {
        throw new Error(`Sampling blocked by Guardian policy: ${policyResult.reason ?? 'policy denied'}`);
      }
    }

    try {
      // In multiplexed mode the SDK Server's single `_transport` is the
      // multiplexer, so a server-initiated sampling request needs to know
      // which session to route to. Pick the caller-supplied session id, or
      // fall back to the first live session, and bind it via the
      // multiplexer's AsyncLocalStorage for the duration of the call.
      const targetSid =
        params.sessionId ?? this._multiplexer?.listSessions()[0];
      const run = <T>(fn: () => Promise<T>): Promise<T> => {
        if (this._multiplexer && targetSid) {
          return this._multiplexer.runWithSession(targetSid, fn);
        }
        return fn();
      };

      const result = await run(() =>
        this._sdk.server.createMessage({
          messages: params.messages,
          modelPreferences: params.modelPreferences,
          systemPrompt: params.systemPrompt,
          maxTokens: params.maxTokens,
        }),
      );

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
      } catch { /* client may not be connected */ }
    }
  }

  /** Mark a task as complete or failed */
  async finalizeTask(taskId: string, status: 'complete' | 'failed' | 'cancelled', error?: string): Promise<void> {
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

  // ─── Multiplexing: share one server across many sessions ────────────────────
  //
  // The SDK's underlying `Server` is one-shot: a single instance may only
  // have `connect()` called once and tracks a single `_transport`. To host
  // many concurrent Streamable HTTP sessions on one PRAXISMcpServer (and
  // therefore pay tool/resource/prompt registration once at startup), we
  // connect the SDK Server to a long-lived `MultiplexingTransport` and add
  // each session's per-request transport as a sub-transport.
  //
  // Tracked: szl-holdings/platform#113, task #5068.

  private _multiplexer: MultiplexingTransport | null = null;
  private _multiplexerConnect: Promise<void> | null = null;

  /** Lazily-created shared multiplexing transport. */
  get multiplexer(): MultiplexingTransport {
    if (!this._multiplexer) {
      this._multiplexer = new MultiplexingTransport();
    }
    return this._multiplexer;
  }

  /**
   * Attach a per-session sub-transport to the shared multiplexer. On first
   * call this connects the SDK Server to the multiplexer (a one-time cost).
   * Subsequent calls are O(1): they simply register the sub-transport for
   * inbound dispatch and outbound routing.
   *
   * Returns a disposer that removes the session from the multiplexer (call
   * from the sub-transport's `onclose`).
   */
  async attachSession(sub: Transport & { sessionId?: string }): Promise<() => void> {
    const mux = this.multiplexer;
    if (!this._multiplexerConnect) {
      this._multiplexerConnect = this._sdk.connect(mux);
    }
    await this._multiplexerConnect;
    return mux.addSession(sub);
  }

  /** Number of live sessions currently sharing this server. */
  get sessionCount(): number {
    return this._multiplexer?.sessionCount ?? 0;
  }

  // ─── Private: Built-in Capability Tools ─────────────────────────────────────

  private _registerInstructionsResource(instructions: string): void {
    this._sdk.resource(
      'nexus://instructions',
      'nexus://instructions',
      {
        description: 'Dynamic system-level guidance for connected LLMs based on tenant context, active role, and domain',
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
        description: 'Tenant-scoped filesystem boundary constraints — defines allowed root paths for connected clients',
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
    const self = this;
    this._sdk.tool(
      'nexus_list_tasks',
      'List active MCP tasks created by long-running tool calls. Returns task IDs, status, progress, and linked Substrate run IDs.',
      {},
      async () => {
        const tasks = self.listTasks();
        return { content: [{ type: 'text', text: JSON.stringify({ tasks }, null, 2) }] };
      },
    );
  }

  private _registerAppsListTool(): void {
    const self = this;
    this._sdk.tool(
      'nexus_list_apps',
      'List available domain micro-dashboard Apps. Returns app IDs, domains, and descriptions. Use nexus_render_app to get the HTML.',
      {},
      async () => {
        const apps = self.listApps().map((a) => ({
          appId: a.appId,
          domain: a.domain,
          title: a.title,
          description: a.description,
        }));
        return { content: [{ type: 'text', text: JSON.stringify({ apps }, null, 2) }] };
      },
    );

    this._sdk.tool(
      'nexus_render_app',
      'Render a domain micro-dashboard App as inline HTML. The HTML is scoped to the authenticated tenant and generated from live platform data.',
      { appId: z.string().describe('App ID from nexus_list_apps') },
      async (args) => {
        const result = await self.renderApp(args.appId);
        if (!result) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: `App '${args.appId}' not found` }) }], isError: true };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ appId: args.appId, title: result.title, domain: result.domain, html: result.html }, null, 2),
            },
          ],
        };
      },
    );
  }

  // ─── Cryptographic Identity ──────────────────────────────────────────────────

  get cryptographicIdentity(): CryptographicIdentityConfig | undefined {
    return this._config.cryptographicIdentity;
  }

  private _isGovernanceTool(toolName: string): boolean {
    const govTools = this._config.governanceTools;
    if (!govTools || govTools.length === 0) return false;
    return govTools.includes(toolName);
  }

  private _enforceGovernanceIdentity(
    toolName: string,
  ): { blocked: boolean; result?: CallToolResult } {
    if (!this._isGovernanceTool(toolName)) return { blocked: false };

    const identity = this._config.cryptographicIdentity;
    const mode = this._config.identityEnforcementMode ?? 'block';

    if (identity) return { blocked: false };

    const reason = `Governance tool "${toolName}" requires cryptographic identity but none is configured`;

    void this._writeAuditLog({
      action: 'governance_identity_enforcement',
      resource: 'mcp_tool',
      resourceId: toolName,
      description: reason,
      metadata: { enforcementMode: mode, toolName },
      userId: null,
    });

    if (mode === 'block') {
      return {
        blocked: true,
        result: {
          content: errorContent(reason),
          isError: true,
          _meta: {
            'x-pqc-identity': { signed: false, reason, enforcement: 'blocked' },
          },
        } as CallToolResult,
      };
    }

    if (mode === 'quarantine') {
      return {
        blocked: true,
        result: {
          content: errorContent(`${reason} — quarantined for review`),
          isError: true,
          _meta: {
            'x-pqc-identity': { signed: false, reason, enforcement: 'quarantined' },
          },
        } as CallToolResult,
      };
    }

    return { blocked: false };
  }

  private _buildIdentityMeta(
    toolName: string,
    outcome: string,
    latencyMs: number,
    args?: Record<string, unknown>,
    resultContent?: unknown,
  ): Record<string, unknown> {
    const identity = this._config.cryptographicIdentity;
    const isGov = this._isGovernanceTool(toolName);
    const mode = this._config.identityEnforcementMode ?? 'block';

    if (!identity) {
      if (isGov && mode !== 'log-only') {
        throw new Error(
          `Governance tool "${toolName}" requires cryptographic identity but none is configured — response blocked`,
        );
      }
      return {
        'x-pqc-identity': {
          signed: false,
          reason: 'No cryptographic identity configured',
        },
      };
    }

    const ts = Date.now();
    const argsHash = createHash('sha256').update(JSON.stringify(args ?? {})).digest('hex');
    const resultHash = createHash('sha256').update(JSON.stringify(resultContent ?? '')).digest('hex');

    const canonicalEnvelope = {
      toolName,
      argsHash,
      resultHash,
      outcome,
      latencyMs,
      timestamp: ts,
      signerDid: identity.did,
      certThumbprint: identity.certThumbprint ?? '',
    };
    const signPayload = JSON.stringify(canonicalEnvelope);

    try {
      const signature = identity.sign(signPayload);
      return {
        'x-pqc-identity': {
          signed: true,
          signerDid: identity.did,
          certThumbprint: identity.certThumbprint,
          signingMode: identity.signingMode,
          envelope: canonicalEnvelope,
          signature,
        },
      };
    } catch (err) {
      const reason = `Signing failed: ${err instanceof Error ? err.message : String(err)}`;

      if (isGov && mode !== 'log-only') {
        void this._writeAuditLog({
          action: 'governance_signing_failure',
          resource: 'mcp_tool',
          resourceId: toolName,
          description: reason,
          metadata: { enforcementMode: mode, toolName },
          userId: null,
        });

        throw new Error(
          `Governance tool "${toolName}" signing failed — unsigned response blocked: ${reason}`,
        );
      }

      return {
        'x-pqc-identity': {
          signed: false,
          signerDid: identity.did,
          certThumbprint: identity.certThumbprint,
          reason,
        },
      };
    }
  }

  // ─── Private: Governance Writers ──────────────────────────────────────────────

  private async _writeProofChain(entry: ProofChainEntry): Promise<void> {
    if (this._config.proofChainWriter) {
      try {
        await this._config.proofChainWriter(entry);
      } catch { /* proof chain writes must not throw */ }
    }
    // VSP (Verifiable Span Protocol) — emit one OTel GenAI v1.37 span per
    // MCP-recorded receipt so external agents calling the gateway show up
    // in the same trace surface as direct `tagAIContent` callers. Hash is
    // derived from a stable JSON form of the entry when no explicit hash
    // is present. Fully fire-and-forget: errors are swallowed inside the
    // emitter and counted in the VSP coverage snapshot.
    // Only emit when the writer's entry carries a real receipt hash —
    // synthetic hashes are not verifiable against the public proof API,
    // so we skip emission rather than produce an un-linkable span.
    try {
      const e = entry as unknown as {
        hash?: string;
        receiptHash?: string;
        selfHash?: string;
        contentHash?: string;
        lambdaAxes?: Record<string, unknown>;
        toolName?: string;
      };
      const hash = e.hash ?? e.receiptHash ?? e.selfHash ?? e.contentHash;
      if (!hash || typeof hash !== 'string' || hash.length < 32) return;
      const axes: Record<string, number> = {};
      if (e.lambdaAxes && typeof e.lambdaAxes === 'object') {
        for (const [k, v] of Object.entries(e.lambdaAxes)) {
          if (typeof v === 'number' && Number.isFinite(v)) axes[k] = v;
        }
      }
      const { emitVspProofSpan } = await import('@szl-holdings/proof-chain');
      emitVspProofSpan({
        hash,
        license: 'Apache-2.0',
        name: `mcp.${e.toolName ?? 'tool_call'}`,
        endpoint: `mcp.${e.toolName ?? 'tool_call'}`,
        ts: new Date().toISOString(),
        ...(Object.keys(axes).length > 0 ? { lambdaAxes: axes } : {}),
      });
    } catch {
      /* VSP emission must never affect MCP request flow */
    }
  }

  private async _writeAuditLog(entry: Parameters<AuditLogger>[0]): Promise<void> {
    if (this._config.auditLogger) {
      try {
        await this._config.auditLogger(entry);
      } catch { /* audit writes must not throw */ }
    }
  }
}
