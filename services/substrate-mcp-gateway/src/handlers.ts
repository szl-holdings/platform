/**
 * Substrate MCP Gateway — Tool and Resource Handlers
 *
 * Every handler is a pure transport translation layer:
 *   1. Validate the incoming MCP params via Zod (reject on schema error)
 *   2. Call the appropriate @szl/substrate API
 *   3. Return a structured MCP tool result
 *
 * No business logic lives here. Policy evaluation, approval gating, and
 * evidence-chain writes happen inside the substrate runtime itself.
 */

import { randomUUID } from 'node:crypto';
import {
  defaultRunStore,
  defaultRuntime,
  listWorkflows,
  lookupWorkflow,
  replay,
  SUBSTRATE_VERSION,
} from '@szl/substrate';
import type { RuntimeStartOptions, WorkflowDefinition } from '@szl/substrate/types';
import {
  type ApprovalVerdict,
  getApprovalActions,
  getInboxByVerdict,
  submitApprovalAction,
} from '@workspace/approvals-inbox';
import { globalCollector } from '@workspace/cognitive-observability';
import {
  defaultGateway,
  defaultToolRegistry,
  McpServerRegistry,
  ToolManifestSchema,
  type ToolManifest,
} from '@workspace/tool-mesh';
import { z } from 'zod';
import { type McpToolDescriptor, SUBSTRATE_TOOLS } from './descriptor.js';
import { emitRunEvent, emitToolListChanged } from './run-events.js';
import { getAllRuns, getRun, storeRun, updateRun } from './run-store.js';

// ─── Per-server dynamic tool cache ────────────────────────────────────────────
// HTTP-connected servers: tool schemas fetched on connect, cleared on disconnect.
// Internal non-tool-mesh servers: populated from INTERNAL_SERVER_TOOLS on connect.
const externalServerToolCache = new Map<string, import('./descriptor.js').McpToolDescriptor[]>();

// Tracks which tool IDs were registered in defaultToolRegistry for each server
// so they can be cleanly unregistered when the server is disabled.
const internalServerRegisteredTools = new Map<string, string[]>();

// ─── Internal server tool catalog ─────────────────────────────────────────────
// Manifests registered on connect → discoverable via BM25 search and tools/list.
// No in-process handlers wired; calling returns "No handler registered" until a
// real service adapter is attached via defaultGateway.registerHandler().
type InternalServerEntry = {
  manifests: ToolManifest[];
};

const INTERNAL_SERVER_TOOLS: Record<string, InternalServerEntry> = {
  'szl-counsel-evidence': {
    manifests: [
      ToolManifestSchema.parse({
        id: 'counsel_search_evidence',
        name: 'counsel_search_evidence',
        description: 'Search legal matter evidence packages and contract analysis results.',
        domainTags: ['legal', 'documents'],
        policyTier: 'operator-assisted',
        inputSchema: { type: 'object', properties: { query: { type: 'string' }, matterId: { type: 'string' } }, required: ['query'] },
      }),
      ToolManifestSchema.parse({
        id: 'counsel_analyze_contract',
        name: 'counsel_analyze_contract',
        description: 'Analyze a contract document for regulatory compliance and risk clauses.',
        domainTags: ['legal', 'documents'],
        policyTier: 'operator-assisted',
        inputSchema: { type: 'object', properties: { contractText: { type: 'string' }, jurisdiction: { type: 'string' } }, required: ['contractText'] },
      }),
    ],
  },
  'szl-terra-portfolio': {
    manifests: [
      ToolManifestSchema.parse({
        id: 'terra_get_portfolio',
        name: 'terra_get_portfolio',
        description: 'Retrieve real estate portfolio summary and performance metrics.',
        domainTags: ['finance', 'analytics'],
        policyTier: 'internal-workflow',
        timeoutMs: 15000,
        inputSchema: { type: 'object', properties: { portfolioId: { type: 'string' }, period: { type: 'string' } }, required: ['portfolioId'] },
      }),
      ToolManifestSchema.parse({
        id: 'terra_analyze_anomaly',
        name: 'terra_analyze_anomaly',
        description: 'Detect and analyze anomalies in property valuations and transaction data.',
        domainTags: ['finance', 'analytics'],
        policyTier: 'internal-workflow',
        timeoutMs: 15000,
        inputSchema: { type: 'object', properties: { propertyId: { type: 'string' }, threshold: { type: 'number' } }, required: ['propertyId'] },
      }),
    ],
  },
  'szl-aegis-threat': {
    manifests: [
      ToolManifestSchema.parse({
        id: 'aegis_triage_threat',
        name: 'aegis_triage_threat',
        description: 'Triage and classify an incoming threat signal using adversarial pattern matching.',
        domainTags: ['security', 'analytics'],
        policyTier: 'operator-assisted',
        timeoutMs: 20000,
        inputSchema: { type: 'object', properties: { signalId: { type: 'string' }, severity: { type: 'string' } }, required: ['signalId'] },
      }),
      ToolManifestSchema.parse({
        id: 'aegis_search_signals',
        name: 'aegis_search_signals',
        description: 'Search defense and intelligence threat signals by domain, actor, or time range.',
        domainTags: ['security', 'analytics'],
        policyTier: 'operator-assisted',
        timeoutMs: 20000,
        inputSchema: { type: 'object', properties: { query: { type: 'string' }, domain: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] },
      }),
    ],
  },
  'szl-vessels-maritime': {
    manifests: [
      ToolManifestSchema.parse({
        id: 'vessels_track_voyage',
        name: 'vessels_track_voyage',
        description: 'Track a maritime vessel voyage by IMO number and return current position and route.',
        domainTags: ['infrastructure', 'analytics'],
        policyTier: 'internal-workflow',
        timeoutMs: 15000,
        inputSchema: { type: 'object', properties: { imoNumber: { type: 'string' }, includeHistory: { type: 'boolean' } }, required: ['imoNumber'] },
      }),
      ToolManifestSchema.parse({
        id: 'vessels_detect_anomaly',
        name: 'vessels_detect_anomaly',
        description: 'Detect anomalous voyage behavior such as AIS gaps, dark periods, or route deviations.',
        domainTags: ['infrastructure', 'analytics'],
        policyTier: 'internal-workflow',
        timeoutMs: 15000,
        inputSchema: { type: 'object', properties: { vesselId: { type: 'string' }, lookbackHours: { type: 'number' } }, required: ['vesselId'] },
      }),
    ],
  },
  'szl-cognitive-observability': {
    manifests: [
      ToolManifestSchema.parse({
        id: 'observability_get_trace',
        name: 'observability_get_trace',
        description: 'Retrieve a cognitive agent run trace by trace ID.',
        domainTags: ['analytics', 'infrastructure'],
        policyTier: 'internal-workflow',
        timeoutMs: 10000,
        observabilityHooks: { emitTrace: false, emitMetrics: true },
        inputSchema: { type: 'object', properties: { traceId: { type: 'string' } }, required: ['traceId'] },
      }),
      ToolManifestSchema.parse({
        id: 'observability_query_metrics',
        name: 'observability_query_metrics',
        description: 'Query collected cognitive metrics by name, label, or time window.',
        domainTags: ['analytics', 'infrastructure'],
        policyTier: 'internal-workflow',
        timeoutMs: 10000,
        observabilityHooks: { emitTrace: false, emitMetrics: true },
        inputSchema: { type: 'object', properties: { metricName: { type: 'string' }, labels: { type: 'object' }, limitMs: { type: 'number' } }, required: ['metricName'] },
      }),
    ],
  },
};

/** Register tool manifests for an internal server on connect (discoverable, not yet callable). */
function registerInternalServerTools(serverId: string): void {
  const entry = INTERNAL_SERVER_TOOLS[serverId];
  if (!entry) return;
  const registeredIds: string[] = [];
  for (const manifest of entry.manifests) {
    defaultToolRegistry.register(manifest);
    registeredIds.push(manifest.id);
  }
  internalServerRegisteredTools.set(serverId, registeredIds);
}

/** Unregister tool manifests for an internal server on disconnect. */
function unregisterInternalServerTools(serverId: string): void {
  const ids = internalServerRegisteredTools.get(serverId) ?? [];
  for (const toolId of ids) {
    defaultToolRegistry.unregister(toolId);
  }
  internalServerRegisteredTools.delete(serverId);
}

/**
 * Attempt to fetch the MCP tool listing from an HTTP/HTTPS endpoint and
 * populate the per-server tool cache. Supports two standard discovery routes:
 *   GET {endpoint}/tools        — returns { tools: [...] }
 *   GET {endpoint}/v1/tools     — returns { tools: [...] }
 * Failures are logged but non-fatal — the server is still marked connected
 * in the registry (it may offer non-tool capabilities or the route may differ).
 */
async function fetchAndCacheExternalTools(serverId: string, endpoint: string): Promise<void> {
  const routes = [`${endpoint}/tools`, `${endpoint}/v1/tools`];
  for (const url of routes) {
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'szl-substrate-mcp-gateway/1.0' },
        signal: AbortSignal.timeout(5_000),
      });
      if (!resp.ok) continue;
      const body = (await resp.json()) as Record<string, unknown>;
      const rawTools = Array.isArray(body['tools']) ? (body['tools'] as unknown[]) : [];
      const descriptors: import('./descriptor.js').McpToolDescriptor[] = rawTools
        .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
        .map((t) => ({
          name: String(t['name'] ?? ''),
          description: String(t['description'] ?? ''),
          inputSchema: (t['inputSchema'] ?? { type: 'object', properties: {} }) as import('./descriptor.js').McpToolDescriptor['inputSchema'],
        }))
        .filter((d) => d.name.length > 0);
      if (descriptors.length > 0) {
        externalServerToolCache.set(serverId, descriptors);
        globalCollector.recordKnown('token_count', 0, {
          phase: 'server_registry',
          event: 'tools_fetched',
          serverId,
          toolCount: String(descriptors.length),
        });
        // Emit a second notification now that tools are populated so clients
        // that refreshed immediately after enable_server see the complete list.
        emitToolListChanged();
        return;
      }
    } catch {
      // Connection refused / timeout / parse error — try next route
    }
  }
}

// ─── Server lifecycle hooks ────────────────────────────────────────────────────
// `onConnect` and `onDisconnect` are invoked by McpServerRegistry.enableServer /
// disableServer and represent the full connection lifecycle contract for this
// registry instance.
//
// Internal endpoints (internal://…) are in-process and need no TCP socket.
// External HTTP/HTTPS endpoints trigger an automatic tool-discovery fetch
// so `getAvailableTools()` returns an accurate, live tool surface for the
// newly connected server. stdio/process endpoints are noted in observability
// but require a spawned subprocess (see the stdio transport module).
const serverRegistry = new McpServerRegistry({
  onConnect: async (entry) => {
    globalCollector.recordKnown('token_count', 0, {
      phase: 'server_registry',
      event: 'connected',
      serverId: entry.serverId,
      endpoint: entry.endpoint,
    });
    const ep = entry.endpoint;
    if (ep.startsWith('http://') || ep.startsWith('https://')) {
      // External HTTP MCP server: fetch tool listing and cache it for discovery.
      void fetchAndCacheExternalTools(entry.serverId, ep);
    } else if (ep.startsWith('stdio://') || ep.startsWith('exec://')) {
      // Stdio server: transport must be established externally; record the intent.
      globalCollector.recordKnown('token_count', 0, {
        phase: 'server_registry',
        event: 'stdio_connect_pending',
        serverId: entry.serverId,
        endpoint: ep,
      });
    } else if (ep.startsWith('internal://') && entry.serverId !== 'szl-tool-mesh') {
      // Internal domain server: register tool manifests and gateway handlers so
      // tools are both discoverable and callable while the server is connected.
      registerInternalServerTools(entry.serverId);
    }
  },
  onDisconnect: async (entry) => {
    globalCollector.recordKnown('token_count', 0, {
      phase: 'server_registry',
      event: 'disconnected',
      serverId: entry.serverId,
      endpoint: entry.endpoint,
    });
    // Clear external HTTP tool cache.
    externalServerToolCache.delete(entry.serverId);
    // Unregister internal server tools from the registry so they are no longer
    // discoverable or routable while the server is disconnected.
    if (entry.endpoint.startsWith('internal://') && entry.serverId !== 'szl-tool-mesh') {
      unregisterInternalServerTools(entry.serverId);
    }
  },
});

// ─── Pre-registered MCP server catalog ────────────────────────────────────────
// These entries describe the available tool-mesh endpoints, domain verticals,
// and external MCP integrations that agents can connect to on demand.
// Connections are lazy — established only when enable_server is called.

serverRegistry.register({
  serverId: 'szl-tool-mesh',
  name: 'SZL Tool Mesh',
  description: 'Core SZL tool mesh — document retrieval, finance, security, graph-query, and operations tools.',
  capabilitiesSummary: 'documents, finance, security, infrastructure, analytics, graph',
  endpoint: 'internal://tool-mesh',
});

serverRegistry.register({
  serverId: 'szl-counsel-evidence',
  name: 'Counsel Evidence MCP',
  description: 'Legal matter evidence packaging, contract analysis, and regulatory document tools for PRISM Counsel.',
  capabilitiesSummary: 'legal, documents, evidence, contracts, compliance',
  endpoint: 'internal://counsel-evidence',
});

serverRegistry.register({
  serverId: 'szl-terra-portfolio',
  name: 'Terra Portfolio MCP',
  description: 'Real estate portfolio analytics, anomaly detection, and property intelligence tools for DOMAINE.',
  capabilitiesSummary: 'finance, analytics, real-estate, portfolio, data',
  endpoint: 'internal://terra-portfolio',
});

serverRegistry.register({
  serverId: 'szl-aegis-threat',
  name: 'AEGIS Threat Intelligence MCP',
  description: 'Defense and intelligence threat triage, security signal analysis, and adversarial pattern detection.',
  capabilitiesSummary: 'security, intelligence, threat, defense, analytics',
  endpoint: 'internal://aegis-threat',
});

serverRegistry.register({
  serverId: 'szl-vessels-maritime',
  name: 'Vessels Maritime Intelligence MCP',
  description: 'Maritime voyage anomaly detection, vessel tracking, and logistics intelligence tools.',
  capabilitiesSummary: 'logistics, analytics, infrastructure, maritime, data',
  endpoint: 'internal://vessels-maritime',
});

serverRegistry.register({
  serverId: 'szl-cognitive-observability',
  name: 'Cognitive Observability MCP',
  description: 'Trace graph, metrics collection, run ledger, and agent reliability observability tools.',
  capabilitiesSummary: 'analytics, infrastructure, observability, tracing, metrics',
  endpoint: 'internal://cognitive-observability',
});

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const SubmitRunSchema = z.object({
  workflowId: z.string().min(1),
  input: z.record(z.unknown()).default({}),
  mode: z.enum(['live', 'dry-run']).default('live'),
  metadata: z.record(z.unknown()).optional(),
});

const GetRunSchema = z.object({
  runId: z.string().uuid('runId must be a UUID'),
});

const ReplaySchema = z.object({
  runId: z.string().min(1),
  workflowId: z.string().min(1),
});

const CounterfactualSchema = z.object({
  runId: z.string().min(1),
  workflowId: z.string().min(1),
  modelAdapterId: z.string().optional(),
  policyId: z.string().optional(),
});

const ListApprovalsSchema = z.object({
  verdict: z.enum(['approved', 'rejected', 'escalated']).optional(),
  domain: z.string().optional(),
});

const ApproveSchema = z.object({
  recommendationId: z.string().min(1),
  actor: z.string().default('mcp-gateway'),
  note: z.string().optional(),
  domain: z.string().default('substrate'),
});

const RejectSchema = z.object({
  recommendationId: z.string().min(1),
  note: z.string().min(1, 'A rejection note is required'),
  actor: z.string().default('mcp-gateway'),
  domain: z.string().default('substrate'),
});

const _ListWorkflowsSchema = z.object({});

const SearchServersSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(50).default(10),
});

const EnableServerSchema = z.object({
  serverId: z.string().min(1),
});

const DisableServerSchema = z.object({
  serverId: z.string().min(1),
});

// ─── Registered workflows cache ───────────────────────────────────────────────
// Since WorkflowRegistry in the substrate is module-local, we maintain our own
// copy of known workflow definitions from submit calls.

const knownWorkflows = new Map<string, WorkflowDefinition>();

function cacheWorkflow(def: WorkflowDefinition): void {
  knownWorkflows.set(def.id, def);
}

// ─── Telemetry helper ─────────────────────────────────────────────────────────

function recordTool(toolName: string, success: boolean, latencyMs: number): void {
  try {
    globalCollector.recordKnown(success ? 'token_count' : 'agent_reliability_score', latencyMs, {
      tool: toolName,
      gateway: 'substrate-mcp',
      success: String(success),
    });
  } catch {
    // telemetry must not throw
  }
}

// ─── Tool Handlers ────────────────────────────────────────────────────────────

// ── Dynamic Tool Surface ───────────────────────────────────────────────────────
// Returns SUBSTRATE_TOOLS (always available) plus the tool schemas contributed
// by each currently connected internal MCP server. Callers use this to respond
// to tools/list requests — the result changes whenever enable_server or
// disable_server is called, giving clients an accurate, live tool set.
export function getAvailableTools(): McpToolDescriptor[] {
  const tools: McpToolDescriptor[] = [...SUBSTRATE_TOOLS];

  for (const server of serverRegistry.getConnectedServers()) {
    if (server.endpoint === 'internal://tool-mesh') {
      // The tool-mesh server is in-process: surface its live tool registry.
      for (const m of defaultToolRegistry.list({ enabled: true })) {
        const props = (m.inputSchema?.properties ?? {}) as Record<string, unknown>;
        const required = Array.isArray(m.inputSchema?.required)
          ? (m.inputSchema.required as string[])
          : undefined;
        const schema: McpToolDescriptor['inputSchema'] = { type: 'object', properties: props };
        if (required && required.length > 0) schema.required = required;
        tools.push({
          name: m.id,
          description: `[${m.domainTags.join(',')}] ${m.description}`,
          inputSchema: schema,
        });
      }
    } else {
      // Internal domain servers: surface tools registered on connect.
      const internalIds = internalServerRegisteredTools.get(server.serverId);
      if (internalIds && internalIds.length > 0) {
        for (const toolId of internalIds) {
          const m = defaultToolRegistry.get(toolId);
          if (!m) continue;
          const props = (m.inputSchema?.properties ?? {}) as Record<string, unknown>;
          const required = Array.isArray(m.inputSchema?.required)
            ? (m.inputSchema.required as string[])
            : undefined;
          const schema: McpToolDescriptor['inputSchema'] = { type: 'object', properties: props };
          if (required && required.length > 0) schema.required = required;
          tools.push({
            name: m.id,
            description: `[${m.domainTags.join(',')}] ${m.description}`,
            inputSchema: schema,
          });
        }
      }
      // External HTTP/stdio MCP servers: surface cached tool schemas.
      const cached = externalServerToolCache.get(server.serverId);
      if (cached && cached.length > 0) {
        for (const tool of cached) {
          tools.push(tool);
        }
      }
    }
  }

  return tools;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(message: string, data?: unknown): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, ...(data ? { details: data } : {}) }, null, 2),
      },
    ],
    isError: true,
  };
}

export async function handleToolCall(
  toolName: string,
  rawParams: unknown,
  actorId: string,
): Promise<ToolResult> {
  const t0 = Date.now();
  let success = false;
  try {
    const result = await dispatchTool(toolName, rawParams, actorId);
    success = !result.isError;
    return result;
  } finally {
    recordTool(toolName, success, Date.now() - t0);
  }
}

async function dispatchTool(
  toolName: string,
  rawParams: unknown,
  actorId: string,
): Promise<ToolResult> {
  switch (toolName) {
    case 'substrate_submit_run':
      return handleSubmitRun(rawParams, actorId);
    case 'substrate_get_run':
      return handleGetRun(rawParams);
    case 'substrate_replay':
      return handleReplay(rawParams);
    case 'substrate_counterfactual':
      return handleCounterfactual(rawParams);
    case 'substrate_list_approvals':
      return handleListApprovals(rawParams);
    case 'substrate_approve':
      return handleApprove(rawParams, actorId);
    case 'substrate_reject':
      return handleReject(rawParams, actorId);
    case 'substrate_list_workflows':
      return handleListWorkflows();
    case 'substrate_search_servers':
    case 'search_available_servers':
      return handleSearchServers(rawParams);
    case 'substrate_enable_server':
    case 'enable_server':
      return handleEnableServer(rawParams);
    case 'substrate_disable_server':
    case 'disable_server':
      return handleDisableServer(rawParams);
    default: {
      const manifest = defaultToolRegistry.getToolDetails(toolName);
      if (manifest) {
        // Determine whether the tool's owning server is currently connected.
        // Dynamic internal-server tools are present in the registry only while
        // connected (registered on enable, unregistered on disable). Tool-mesh
        // tools are pre-loaded, so we check the server connection explicitly.
        const fromDynamicServer = [...internalServerRegisteredTools.values()]
          .flat()
          .includes(toolName);
        const toolMeshConnected = serverRegistry
          .getConnectedServers()
          .some((s) => s.endpoint === 'internal://tool-mesh');

        if (fromDynamicServer || toolMeshConnected) {
          const args =
            rawParams && typeof rawParams === 'object' && !Array.isArray(rawParams)
              ? (rawParams as Record<string, unknown>)
              : {};
          try {
            const result = await defaultGateway.invoke(toolName, args, {
              requestId: randomUUID(),
              agentId: actorId,
            });
            if (!result.success) {
              return err(result.error ?? `Tool '${toolName}' invocation denied by guardrail chain.`);
            }
            return ok(result);
          } catch (e) {
            return err(`Tool '${toolName}' execution failed: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      }

      // External HTTP MCP server: check whether any connected server cached this
      // tool on connect and forward the call to its MCP /tools/call endpoint.
      for (const [serverId, descriptors] of externalServerToolCache) {
        const descriptor = descriptors.find((d) => d.name === toolName);
        if (!descriptor) continue;
        const server = serverRegistry.getServer(serverId);
        if (!server || server.status !== 'connected') continue;
        const ep = server.endpoint;
        if (!ep.startsWith('http://') && !ep.startsWith('https://')) continue;
        try {
          const httpRes = await fetch(`${ep.replace(/\/$/, '')}/tools/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: toolName, arguments: rawParams ?? {} }),
            signal: AbortSignal.timeout(30_000),
          });
          if (!httpRes.ok) {
            return err(`External server '${serverId}' returned HTTP ${httpRes.status} for tool '${toolName}'.`);
          }
          const payload = (await httpRes.json()) as unknown;
          return ok(payload);
        } catch (e) {
          return err(`External tool '${toolName}' call to '${serverId}' failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      return err(`Unknown tool: ${toolName}`);
    }
  }
}

// ── substrate_submit_run ──────────────────────────────────────────────────────

async function handleSubmitRun(rawParams: unknown, actorId: string): Promise<ToolResult> {
  const parsed = SubmitRunSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err('Invalid parameters', parsed.error.flatten());
  }

  const { workflowId, input, mode, metadata } = parsed.data;
  const workflow = lookupWorkflow(workflowId);

  if (!workflow) {
    const registered = listWorkflows();
    if (registered.length === 0) {
      return err(
        `Workflow '${workflowId}' cannot be resolved: the workflow registry is empty. ` +
          'No workflows have been registered in this gateway process via registerWorkflow(). ' +
          'Register at least one workflow before submitting runs.',
        { code: 'REGISTRY_EMPTY', workflowId, registeredCount: 0 },
      );
    }
    return err(
      `Workflow '${workflowId}' is not registered. ` +
        'Call substrate_list_workflows to see available workflows.',
      {
        code: 'WORKFLOW_NOT_FOUND',
        workflowId,
        registeredCount: registered.length,
        availableWorkflowIds: registered.map((w) => w.id),
      },
    );
  }

  cacheWorkflow(workflow);

  const opts: RuntimeStartOptions = {
    mode,
    metadata: {
      ...metadata,
      submittedBy: actorId,
      submittedVia: 'substrate-mcp-gateway',
    },
  };

  const pipelineRun = await defaultRuntime.start(workflow, input, opts);
  storeRun(pipelineRun);

  // Fan-out run lifecycle events to any connected SSE clients
  emitRunEvent({
    type: 'run_started',
    runId: pipelineRun.runId,
    workflowId: pipelineRun.workflowId,
    workflowName: pipelineRun.workflowName,
    timestamp: Date.now(),
  });
  if (pipelineRun.status === 'pending-approval') {
    emitRunEvent({
      type: 'approval_required',
      runId: pipelineRun.runId,
      workflowId: pipelineRun.workflowId,
      status: pipelineRun.status,
      timestamp: Date.now(),
    });
  } else if (pipelineRun.status === 'completed' || pipelineRun.status === 'dry-run-complete') {
    emitRunEvent({
      type: 'run_complete',
      runId: pipelineRun.runId,
      workflowId: pipelineRun.workflowId,
      status: pipelineRun.status,
      timestamp: Date.now(),
    });
  } else if (pipelineRun.status === 'failed') {
    emitRunEvent({
      type: 'run_failed',
      runId: pipelineRun.runId,
      workflowId: pipelineRun.workflowId,
      status: pipelineRun.status,
      ...(pipelineRun.error ? { error: pipelineRun.error } : {}),
      timestamp: Date.now(),
    });
  }

  return ok({
    runId: pipelineRun.runId,
    status: pipelineRun.status,
    workflowId: pipelineRun.workflowId,
    workflowName: pipelineRun.workflowName,
    mode: pipelineRun.mode,
    traceId: pipelineRun.traceId,
    startedAt: pipelineRun.startedAt,
    currentStageId: pipelineRun.currentStageId,
    stageCount: pipelineRun.stageResults.length,
    finalConfidence: pipelineRun.finalConfidence,
    error: pipelineRun.error,
  });
}

// ── substrate_get_run ─────────────────────────────────────────────────────────

async function handleGetRun(rawParams: unknown): Promise<ToolResult> {
  const parsed = GetRunSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err('Invalid parameters', parsed.error.flatten());
  }

  const { runId } = parsed.data;

  // Try in-process store first, then fall back to the substrate journal
  let run = getRun(runId);

  if (!run) {
    const stored = await defaultRunStore.get(runId);
    if (stored) {
      run = stored;
      storeRun(run);
    }
  }

  if (!run) {
    return err(
      `Run '${runId}' not found. The gateway only tracks runs submitted in this process session.`,
    );
  }

  return ok({
    runId: run.runId,
    workflowId: run.workflowId,
    workflowName: run.workflowName,
    mode: run.mode,
    status: run.status,
    currentStageId: run.currentStageId,
    stageResults: run.stageResults.map((sr) => ({
      stageId: sr.stageId,
      stageType: sr.stageType,
      status: sr.status,
      confidence: sr.confidence,
      error: sr.error,
    })),
    finalConfidence: run.finalConfidence,
    output: run.output,
    error: run.error,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: run.durationMs,
    traceId: run.traceId,
    replaySourceRunId: run.replaySourceRunId,
    metadata: run.metadata,
  });
}

// ── substrate_replay ──────────────────────────────────────────────────────────

async function handleReplay(rawParams: unknown): Promise<ToolResult> {
  const parsed = ReplaySchema.safeParse(rawParams);
  if (!parsed.success) {
    return err('Invalid parameters', parsed.error.flatten());
  }

  const { runId, workflowId } = parsed.data;
  const workflow = lookupWorkflow(workflowId) ?? knownWorkflows.get(workflowId);

  if (!workflow) {
    return err(
      `Workflow '${workflowId}' is not registered. Submit a run with this workflow first.`,
    );
  }

  const result = await replay({ runId, workflow });

  if (result.replayRun.status === 'failed') {
    return err('Replay run failed', {
      replayRunId: result.replayRun.runId,
      error: result.replayRun.error,
    });
  }

  storeRun(result.replayRun);

  return ok({
    sourceRunId: result.sourceRun.runId,
    replayRunId: result.replayRun.runId,
    status: result.replayRun.status,
    finalConfidence: result.replayRun.finalConfidence,
    stageCount: result.replayRun.stageResults.length,
    startedAt: result.replayRun.startedAt,
    completedAt: result.replayRun.completedAt,
    durationMs: result.replayRun.durationMs,
  });
}

// ── substrate_counterfactual ──────────────────────────────────────────────────

async function handleCounterfactual(rawParams: unknown): Promise<ToolResult> {
  const parsed = CounterfactualSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err('Invalid parameters', parsed.error.flatten());
  }

  const { runId, workflowId, modelAdapterId, policyId } = parsed.data;
  const workflow = lookupWorkflow(workflowId) ?? knownWorkflows.get(workflowId);

  if (!workflow) {
    return err(`Workflow '${workflowId}' is not registered.`);
  }

  let policyProfile: import('@szl/substrate/types').PolicyProfile | undefined;
  if (policyId) {
    const { resolvePolicyProfileById } = await import('@szl/substrate');
    try {
      policyProfile = await resolvePolicyProfileById(policyId);
    } catch {
      // ignore — policy not found, use default
    }
    if (!policyProfile) {
      return err(`Policy '${policyId}' is not registered in the policy-engine.`);
    }
  }

  const result = await replay({
    runId,
    counterfactual: true,
    ...(modelAdapterId ? { model: modelAdapterId } : {}),
    ...(policyProfile ? { policy: policyProfile } : {}),
    workflow,
  });

  storeRun(result.replayRun);

  return ok({
    baselineRunId: result.sourceRun.runId,
    counterfactualRunId: result.replayRun.runId,
    diff: result.diff ?? null,
    outcomeChanged: result.diff?.outcomeChanged ?? false,
    finalConfidenceDelta: result.diff?.finalConfidenceDelta ?? 0,
    stageDiffCount: result.diff?.stageDiffs.length ?? 0,
    substitutions: {
      modelAdapterId: modelAdapterId ?? null,
      policyId: policyId ?? null,
    },
    generatedAt: result.diff?.generatedAt ?? new Date().toISOString(),
  });
}

// ── substrate_list_approvals ──────────────────────────────────────────────────

function handleListApprovals(rawParams: unknown): ToolResult {
  const parsed = ListApprovalsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err('Invalid parameters', parsed.error.flatten());
  }

  const { verdict, domain } = parsed.data;

  let actions = verdict ? getInboxByVerdict(verdict as ApprovalVerdict) : getApprovalActions();

  if (domain) {
    actions = actions.filter((a) => a.domain === domain);
  }

  return ok({
    count: actions.length,
    approvals: actions.map((a) => ({
      id: a.id,
      recommendationId: a.recommendationId,
      verdict: a.verdict,
      actor: a.actor,
      timestamp: a.timestamp,
      proofRef: a.proofRef,
      simulationId: a.simulationId,
      note: a.note,
      domain: a.domain,
      surface: a.surface,
    })),
  });
}

// ── substrate_approve ─────────────────────────────────────────────────────────

async function handleApprove(rawParams: unknown, actorId: string): Promise<ToolResult> {
  const parsed = ApproveSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err('Invalid parameters', parsed.error.flatten());
  }

  const { recommendationId, actor, note, domain } = parsed.data;
  const resolvedActor = actor !== 'mcp-gateway' ? actor : actorId;

  // Record approval in the approvals-inbox audit trail
  const action = submitApprovalAction(recommendationId, 'approved', {
    actor: resolvedActor,
    ...(note ? { note } : {}),
    domain,
    surface: 'substrate-mcp-gateway',
  });

  // Route the approval through the substrate runtime — this resumes the paused
  // run, writes an HMAC-signed evidence bundle, and continues graph execution.
  const resumedRun = await defaultRuntime.resume(recommendationId, resolvedActor);
  if (resumedRun) {
    updateRun(resumedRun);

    // Fan-out the approval and final run status to SSE clients
    emitRunEvent({
      type: 'approval_granted',
      runId: resumedRun.runId,
      actor: resolvedActor,
      status: resumedRun.status,
      timestamp: Date.now(),
    });
    if (resumedRun.status === 'completed') {
      emitRunEvent({
        type: 'run_complete',
        runId: resumedRun.runId,
        workflowId: resumedRun.workflowId,
        status: resumedRun.status,
        timestamp: Date.now(),
      });
    } else if (resumedRun.status === 'failed') {
      emitRunEvent({
        type: 'run_failed',
        runId: resumedRun.runId,
        workflowId: resumedRun.workflowId,
        status: resumedRun.status,
        ...(resumedRun.error ? { error: resumedRun.error } : {}),
        timestamp: Date.now(),
      });
    }
  }

  return ok({
    approvalId: action.id,
    recommendationId: action.recommendationId,
    verdict: action.verdict,
    actor: action.actor,
    proofRef: action.proofRef,
    timestamp: action.timestamp,
    runStatus: resumedRun?.status ?? 'unknown',
  });
}

// ── substrate_reject ──────────────────────────────────────────────────────────

async function handleReject(rawParams: unknown, actorId: string): Promise<ToolResult> {
  const parsed = RejectSchema.safeParse(rawParams);
  if (!parsed.success) {
    return err('Invalid parameters', parsed.error.flatten());
  }

  const { recommendationId, note, actor, domain } = parsed.data;
  const resolvedActor = actor !== 'mcp-gateway' ? actor : actorId;

  // Record rejection in the approvals-inbox audit trail
  const action = submitApprovalAction(recommendationId, 'rejected', {
    actor: resolvedActor,
    note,
    domain,
    surface: 'substrate-mcp-gateway',
  });

  // Route the rejection through the substrate runtime — this marks the pending
  // approval gate as failed, writes a signed evidence bundle, sets run status to
  // "failed", and persists via the run store. No in-memory mutation needed here.
  const rejectedRun = await defaultRuntime.reject(recommendationId, resolvedActor, note);
  if (rejectedRun) {
    updateRun(rejectedRun);

    // Fan-out rejection and run-failed events to SSE clients
    emitRunEvent({
      type: 'approval_rejected',
      runId: rejectedRun.runId,
      actor: resolvedActor,
      status: rejectedRun.status,
      timestamp: Date.now(),
    });
    emitRunEvent({
      type: 'run_failed',
      runId: rejectedRun.runId,
      workflowId: rejectedRun.workflowId,
      status: rejectedRun.status,
      ...(rejectedRun.error ? { error: rejectedRun.error } : {}),
      timestamp: Date.now(),
    });
  }

  return ok({
    approvalId: action.id,
    recommendationId: action.recommendationId,
    verdict: action.verdict,
    actor: action.actor,
    proofRef: action.proofRef,
    timestamp: action.timestamp,
    note: action.note,
    runStatus: rejectedRun?.status ?? 'unknown',
  });
}

// ── substrate_list_workflows ──────────────────────────────────────────────────

function handleListWorkflows(): ToolResult {
  // Primary source: the live substrate workflow registry (reflects all
  // registerWorkflow() calls made in this process — the authoritative list).
  const registered = listWorkflows();

  // Augment run counts from the in-process run store
  const runCounts = new Map<string, number>();
  for (const run of getAllRuns()) {
    runCounts.set(run.workflowId, (runCounts.get(run.workflowId) ?? 0) + 1);
  }

  const workflows = registered.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description ?? null,
    stageCount: def.stages.length,
    runCount: runCounts.get(def.id) ?? 0,
    policyProfile: def.policy?.name ?? null,
  }));

  return ok({
    count: workflows.length,
    registryEmpty: workflows.length === 0,
    substrateVersion: SUBSTRATE_VERSION,
    workflows,
    ...(workflows.length === 0
      ? {
          warning:
            'Workflow registry is empty. No workflows have been registered ' +
            'in this gateway process via registerWorkflow(). substrate_submit_run ' +
            'will fail with a REGISTRY_EMPTY error until at least one workflow is registered.',
        }
      : {}),
  });
}

// ── substrate_search_servers ──────────────────────────────────────────────────

function handleSearchServers(rawParams: unknown): ToolResult {
  const parsed = SearchServersSchema.safeParse(rawParams);
  if (!parsed.success) return err('Invalid parameters', parsed.error.flatten());

  const { query, limit } = parsed.data;
  const results = serverRegistry.searchServers(query, limit);

  return ok({
    query,
    count: results.length,
    servers: results,
    hint:
      results.length === 0
        ? 'No servers matched the query. Register servers via the McpServerRegistry API.'
        : 'Use enable_server with a serverId to establish a connection.',
  });
}

// ── substrate_enable_server ───────────────────────────────────────────────────

async function handleEnableServer(rawParams: unknown): Promise<ToolResult> {
  const parsed = EnableServerSchema.safeParse(rawParams);
  if (!parsed.success) return err('Invalid parameters', parsed.error.flatten());

  const { serverId } = parsed.data;
  const result = await serverRegistry.enableServer(serverId);

  if (!result.success) {
    return err(`Failed to enable server '${serverId}': ${result.error}`);
  }

  const entry = serverRegistry.getServer(serverId);

  // Notify SSE clients that the tool list has grown. MCP spec §6.5 — clients
  // that receive this notification must call tools/list again to refresh.
  emitToolListChanged();

  return ok({
    serverId,
    status: entry?.status ?? 'connected',
    connectedAt: entry?.connectedAt ?? Date.now(),
    message: `Server '${serverId}' is now connected.`,
  });
}

// ── substrate_disable_server ──────────────────────────────────────────────────

async function handleDisableServer(rawParams: unknown): Promise<ToolResult> {
  const parsed = DisableServerSchema.safeParse(rawParams);
  if (!parsed.success) return err('Invalid parameters', parsed.error.flatten());

  const { serverId } = parsed.data;
  const result = await serverRegistry.disableServer(serverId);

  if (!result.success) {
    return err(`Failed to disable server '${serverId}': ${result.error}`);
  }

  const entry = serverRegistry.getServer(serverId);

  // Notify SSE clients that the tool list has changed. MCP spec §6.5 — clients
  // that receive this notification must call tools/list again to refresh.
  emitToolListChanged();

  return ok({
    serverId,
    status: entry?.status ?? 'disconnected',
    disconnectedAt: entry?.disconnectedAt ?? Date.now(),
    message: `Server '${serverId}' has been disconnected.`,
  });
}

// ─── Resource Handlers ────────────────────────────────────────────────────────

const RUN_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'PipelineRun',
  type: 'object',
  properties: {
    runId: { type: 'string', format: 'uuid' },
    workflowId: { type: 'string' },
    workflowName: { type: 'string' },
    mode: { type: 'string', enum: ['live', 'dry-run', 'replay', 'counterfactual'] },
    status: {
      type: 'string',
      enum: ['running', 'completed', 'failed', 'pending-approval', 'dry-run-complete', 'cancelled'],
    },
    stageResults: { type: 'array', items: { $ref: '#/$defs/StageResult' } },
    currentStageId: { type: 'string' },
    output: { type: 'object' },
    finalConfidence: { type: 'number', minimum: 0, maximum: 1 },
    error: { type: 'string' },
    startedAt: { type: 'string', format: 'date-time' },
    completedAt: { type: 'string', format: 'date-time' },
    durationMs: { type: 'number' },
    traceId: { type: 'string' },
    replaySourceRunId: { type: 'string' },
    metadata: { type: 'object' },
  },
  required: [
    'runId',
    'workflowId',
    'workflowName',
    'mode',
    'status',
    'stageResults',
    'startedAt',
    'traceId',
  ],
  $defs: {
    StageResult: {
      type: 'object',
      properties: {
        stageId: { type: 'string' },
        stageType: {
          type: 'string',
          enum: ['Reason', 'Retrieve', 'ToolCall', 'Verify', 'Decide', 'ApprovalGate'],
        },
        status: {
          type: 'string',
          enum: ['completed', 'failed', 'skipped', 'pending-approval', 'timed-out', 'escalated'],
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        output: {},
        error: { type: 'string' },
        startedAt: { type: 'string', format: 'date-time' },
        completedAt: { type: 'string', format: 'date-time' },
      },
      required: ['stageId', 'stageType', 'status'],
    },
  },
};

const STAGE_RESULT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'StageResult',
  ...RUN_SCHEMA.$defs.StageResult,
};

const COUNTERFACTUAL_DIFF_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'CounterfactualDiff',
  type: 'object',
  properties: {
    baselineRunId: { type: 'string' },
    counterfactualRunId: { type: 'string' },
    counterfactualModel: { type: 'string' },
    counterfactualPolicy: { type: 'string' },
    stageDiffs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stageId: { type: 'string' },
          stageType: { type: 'string' },
          baseline: {
            oneOf: [
              { type: 'null' },
              {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  confidence: { type: 'number' },
                  output: {},
                },
                required: ['status'],
              },
            ],
          },
          counterfactual: {
            oneOf: [
              { type: 'null' },
              {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  confidence: { type: 'number' },
                  output: {},
                },
                required: ['status'],
              },
            ],
          },
          differ: { type: 'boolean' },
          decisionChanged: { type: 'boolean' },
        },
        required: ['stageId', 'stageType', 'differ', 'decisionChanged'],
      },
    },
    finalConfidenceDelta: { type: 'number' },
    outcomeChanged: { type: 'boolean' },
    generatedAt: { type: 'string', format: 'date-time' },
  },
  required: [
    'baselineRunId',
    'counterfactualRunId',
    'stageDiffs',
    'finalConfidenceDelta',
    'outcomeChanged',
    'generatedAt',
  ],
};

export async function handleResourceRead(
  uri: string,
): Promise<
  { contents: Array<{ uri: string; mimeType: string; text: string }> } | { error: string }
> {
  switch (uri) {
    case 'substrate://schema/run':
      return {
        contents: [
          { uri, mimeType: 'application/schema+json', text: JSON.stringify(RUN_SCHEMA, null, 2) },
        ],
      };
    case 'substrate://schema/stage-result':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/schema+json',
            text: JSON.stringify(STAGE_RESULT_SCHEMA, null, 2),
          },
        ],
      };
    case 'substrate://schema/counterfactual-diff':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/schema+json',
            text: JSON.stringify(COUNTERFACTUAL_DIFF_SCHEMA, null, 2),
          },
        ],
      };
    case 'substrate://policy/active': {
      let policies: unknown[] = [];
      try {
        const policyMod = await import('@szl-holdings/policy-engine');
        const fn = (policyMod as Record<string, unknown>).getRegisteredPolicies;
        if (typeof fn === 'function') {
          policies = (fn() as Array<{ id: string; name: string }>).map((p) => ({
            id: p.id,
            name: p.name,
          }));
        }
      } catch {
        policies = [];
      }
      return {
        contents: [
          { uri, mimeType: 'application/json', text: JSON.stringify({ policies }, null, 2) },
        ],
      };
    }
    default:
      return { error: `Unknown resource URI: ${uri}` };
  }
}

// ─── Prompt Handlers ──────────────────────────────────────────────────────────

export function handlePromptGet(
  name: string,
  args: Record<string, string>,
):
  | { messages: Array<{ role: string; content: { type: string; text: string } }> }
  | { error: string } {
  switch (name) {
    case 'substrate_run_summary': {
      const { runId } = args;
      if (!runId) return { error: 'Missing required argument: runId' };
      const run = getRun(runId);
      if (!run) return { error: `Run '${runId}' not found` };

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text:
                `Summarise the following substrate run in 2–3 sentences. Focus on:\n` +
                `1. What decision was made (check the Decide stage output)\n` +
                `2. Overall confidence score (${run.finalConfidence ?? 'unknown'})\n` +
                `3. Whether any approval gate was triggered (status: ${run.status})\n\n` +
                `Run data:\n${JSON.stringify(run, null, 2)}`,
            },
          },
        ],
      };
    }
    case 'substrate_counterfactual_analysis': {
      const { diffJson } = args;
      if (!diffJson) return { error: 'Missing required argument: diffJson' };

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text:
                `Interpret this counterfactual diff and explain:\n` +
                `1. Which model or policy substitution caused the outcome to change\n` +
                `2. Which specific stages changed and why\n` +
                `3. Whether the overall governance posture improved or degraded\n\n` +
                `Diff:\n${diffJson}`,
            },
          },
        ],
      };
    }
    default:
      return { error: `Unknown prompt: ${name}` };
  }
}
