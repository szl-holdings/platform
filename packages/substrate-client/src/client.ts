/**
 * @szl/substrate-client — Typed HTTP Client
 *
 * Wraps the substrate-mcp-gateway JSON-RPC 2.0 endpoint with typed methods for
 * every substrate operation. Each method performs Zod-free structural validation
 * and surfaces structured SubstrateClientError on failure.
 *
 * All calls go through the same policy compiler, approval engine, and
 * evidence/audit chain as in-process calls — the client is a thin typed wrapper
 * over the MCP JSON-RPC transport.
 *
 * @example
 * ```ts
 * import { SubstrateClient } from "@szl/substrate-client";
 *
 * const client = new SubstrateClient({
 *   baseUrl: "http://localhost:3700",
 *   apiKey: process.env.SUBSTRATE_GATEWAY_API_KEY,
 * });
 *
 * const run = await client.submitRun({
 *   workflowId: "opportunity-audit",
 *   input: { tenantId: "acme" },
 * });
 * console.log(run.runId, run.status);
 * ```
 */

import type {
  SubstrateClientOptions,
  SubmitRunResponse,
  PipelineRunSummary,
  ReplayResponse,
  CounterfactualResponse,
  ApprovalListResponse,
  ApprovalActionResponse,
  WorkflowListResponse,
  ApprovalVerdict,
  ExecutionMode,
} from "./types.js";
import { SubstrateClientError } from "./types.js";

// ─── JSON-RPC Helpers ─────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: Record<string, unknown> | undefined;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

let _idCounter = 1;

function nextId(): number {
  return _idCounter++;
}

// ─── SubstrateClient ──────────────────────────────────────────────────────────

export class SubstrateClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;
  private readonly _fetch: typeof fetch;

  constructor(options: SubstrateClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this._fetch = options.fetch ?? globalThis.fetch;
  }

  // ─── Internal RPC ──────────────────────────────────────────────────────────

  private async rpc<T>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const body: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: nextId(),
      method,
      params,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await this._fetch(`${this.baseUrl}/mcp`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      throw new SubstrateClientError(
        `Network error: ${e instanceof Error ? e.message : String(e)}`,
        -32603,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      throw new SubstrateClientError(
        `HTTP error ${res.status}`,
        -32603,
        { status: res.status, statusText: res.statusText },
      );
    }

    const json = (await res.json()) as JsonRpcResponse<T>;

    if (json.error) {
      throw new SubstrateClientError(
        json.error.message,
        json.error.code,
        json.error.data,
      );
    }

    return json.result as T;
  }

  private async toolCall<T>(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    const result = await this.rpc<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }>(
      "tools/call",
      { name: toolName, arguments: args },
    );

    const text = result.content?.[0]?.text ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new SubstrateClientError(`Invalid JSON response from tool ${toolName}`, -32603, { raw: text });
    }

    if (result.isError) {
      const e = parsed as { error?: string; details?: unknown };
      throw new SubstrateClientError(
        e.error ?? `Tool ${toolName} returned an error`,
        -32603,
        e.details,
      );
    }

    return parsed as T;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Submit a workflow run to the Substrate runtime.
   * Returns a SubmitRunResponse with the runId to poll with getRun.
   */
  async submitRun(options: {
    workflowId: string;
    input: Record<string, unknown>;
    mode?: ExecutionMode;
    metadata?: Record<string, unknown>;
  }): Promise<SubmitRunResponse> {
    return this.toolCall<SubmitRunResponse>("substrate_submit_run", {
      workflowId: options.workflowId,
      input: options.input,
      mode: options.mode ?? "live",
      ...(options.metadata ? { metadata: options.metadata } : {}),
    });
  }

  /**
   * Get the current state of a run by ID.
   */
  async getRun(runId: string): Promise<PipelineRunSummary> {
    return this.toolCall<PipelineRunSummary>("substrate_get_run", { runId });
  }

  /**
   * Replay a completed run from its journal.
   * Returns a new ReplayResponse with the replay run ID.
   */
  async replay(options: {
    runId: string;
    workflowId: string;
  }): Promise<ReplayResponse> {
    return this.toolCall<ReplayResponse>("substrate_replay", {
      runId: options.runId,
      workflowId: options.workflowId,
    });
  }

  /**
   * Run a counterfactual replay with optional model/policy substitution.
   * Returns the decision diff and the new counterfactual run ID.
   */
  async counterfactual(options: {
    runId: string;
    workflowId: string;
    modelAdapterId?: string;
    policyId?: string;
  }): Promise<CounterfactualResponse> {
    return this.toolCall<CounterfactualResponse>("substrate_counterfactual", {
      runId: options.runId,
      workflowId: options.workflowId,
      ...(options.modelAdapterId ? { modelAdapterId: options.modelAdapterId } : {}),
      ...(options.policyId ? { policyId: options.policyId } : {}),
    });
  }

  /**
   * List entries in the approvals inbox.
   * Optionally filter by verdict or domain.
   */
  async listApprovals(options?: {
    verdict?: ApprovalVerdict;
    domain?: string;
  }): Promise<ApprovalListResponse> {
    return this.toolCall<ApprovalListResponse>("substrate_list_approvals", {
      ...(options?.verdict ? { verdict: options.verdict } : {}),
      ...(options?.domain ? { domain: options.domain } : {}),
    });
  }

  /**
   * Approve a pending approval gate.
   * Records the actor, note, and proof entry in the approvals inbox.
   */
  async approve(options: {
    recommendationId: string;
    actor?: string;
    note?: string;
    domain?: string;
  }): Promise<ApprovalActionResponse> {
    return this.toolCall<ApprovalActionResponse>("substrate_approve", {
      recommendationId: options.recommendationId,
      ...(options.actor ? { actor: options.actor } : {}),
      ...(options.note ? { note: options.note } : {}),
      ...(options.domain ? { domain: options.domain } : {}),
    });
  }

  /**
   * Reject a pending approval gate.
   * Note is required — it is recorded in the proof entry.
   */
  async reject(options: {
    recommendationId: string;
    note: string;
    actor?: string;
    domain?: string;
  }): Promise<ApprovalActionResponse> {
    return this.toolCall<ApprovalActionResponse>("substrate_reject", {
      recommendationId: options.recommendationId,
      note: options.note,
      ...(options.actor ? { actor: options.actor } : {}),
      ...(options.domain ? { domain: options.domain } : {}),
    });
  }

  /**
   * List all registered workflows in the Substrate runtime.
   */
  async listWorkflows(): Promise<WorkflowListResponse> {
    return this.toolCall<WorkflowListResponse>("substrate_list_workflows", {});
  }

  // ─── Discovery ─────────────────────────────────────────────────────────────

  /**
   * Initialize the MCP session and get server capabilities.
   * Useful for verifying connectivity and negotiating protocol version.
   */
  async initialize(): Promise<{
    protocolVersion: string;
    capabilities: unknown;
    serverInfo: { name: string; version: string };
  }> {
    return this.rpc("initialize");
  }

  /**
   * List all available tools with their full JSON Schema definitions.
   */
  async listTools(): Promise<{ tools: Array<{ name: string; description: string; inputSchema: unknown }> }> {
    return this.rpc("tools/list");
  }

  /**
   * Get the health status of the gateway.
   */
  async health(): Promise<{
    status: string;
    service: string;
    version: string;
    toolCount: number;
    timestamp: string;
  }> {
    const res = await this._fetch(`${this.baseUrl}/mcp/health`);
    if (!res.ok) {
      throw new SubstrateClientError(`Health check failed: HTTP ${res.status}`, -32603);
    }
    return res.json() as Promise<{ status: string; service: string; version: string; toolCount: number; timestamp: string }>;
  }

  // ─── SSE URL ──────────────────────────────────────────────────────────────

  /**
   * Returns the SSE endpoint URL. Pass this to your SSE client along with
   * the Authorization header.
   */
  sseUrl(): string {
    return `${this.baseUrl}/mcp/sse`;
  }
}
