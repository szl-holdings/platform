/**
 * Substrate MCP Gateway — PRAXISMcpServer Registration
 *
 * Creates and configures the PRAXISMcpServer instance that backs the Substrate
 * MCP Gateway. All substrate tools plus server-discovery tools are registered
 * here using the official SDK's typed registration API.
 *
 * This module is the single source of truth for the gateway's tool surface.
 * Both the HTTP transport and the stdio transport share this instance — the
 * SDK handles concurrent client sessions via transport-level session isolation.
 */

import { z } from 'zod';
import { PRAXISMcpServer, buildTenantInstructions, createDomainApps, type TenantContext } from '@workspace/nexus-mcp';
import { getCurrentActorId } from './request-context.js';
import { GATEWAY_VERSION, SERVER_INFO, SUBSTRATE_RESOURCES, SUBSTRATE_PROMPTS } from './descriptor.js';
import {
  getAvailableTools,
  handleToolCall,
  handleResourceRead,
  handlePromptGet,
} from './handlers.js';
import { buildPRAXISEnvelopes, setResourceUpdateCallback } from './nexus-fabric.js';
import { emitToolListChanged, type RunLifecycleEvent } from './run-events.js';
import { listRoots } from './domain-roots.js';
import { setSamplingBridge } from './governed-sampling.js';

// ─── Singleton PRAXISMcpServer ─────────────────────────────────────────────────

let _server: PRAXISMcpServer | null = null;

/**
 * Return (or create) the singleton PRAXISMcpServer for the Substrate Gateway.
 * Called once at startup by both HTTP and stdio entry points.
 */
export function getGatewayServer(): PRAXISMcpServer {
  if (_server) return _server;

  const domainRoots = listRoots('substrate-gateway').map((r) => ({
    uri: r.uri,
    name: r.name,
  }));

  _server = new PRAXISMcpServer({
    name: SERVER_INFO.name,
    version: GATEWAY_VERSION,
    enableSampling: true,
    enableElicitation: true,
    enableTasks: true,
    enableApps: true,
    enableInstructions: true,
    enableDiscovery: true,
    enableResourceSubscription: true,
    enableRoots: true,
    roots: domainRoots,
    instructions: buildTenantInstructions({
      tenantId: 'substrate-gateway',
      domain: 'analytics',
    }),
  });

  setSamplingBridge({
    requestSampling: (params) => _server!.requestSampling(params),
  });

  // ── Register domain Apps ─────────────────────────────────────────────────────
  for (const app of createDomainApps()) {
    _server.registerApp(app);
  }

  // ── Wire resource update notifications (Prism Bus → MCP subscriptions) ──────
  // When startConvergenceBridge() receives a cross_domain_correlation event from
  // the Prism Bus, it calls this callback which pushes notifications/resources/updated
  // to all connected MCP clients that have subscribed to the affected URIs.
  setResourceUpdateCallback((uri: string) => {
    void _server?.notifyResourceUpdated(uri);
  });

  // ── Register substrate tools via SDK ─────────────────────────────────────────
  const tools = getAvailableTools();
  for (const tool of tools) {
    _registerSubstrateTool(_server, tool.name, tool.description, tool.inputSchema);
  }

  // ── Register resources ───────────────────────────────────────────────────────
  for (const res of SUBSTRATE_RESOURCES) {
    const capturedRes = res;
    _server.resource(
      capturedRes.name,
      capturedRes.uri,
      { description: capturedRes.description, mimeType: capturedRes.mimeType },
      async (uri: string, ctx: TenantContext) => {
        const tenantId = ctx.tenantId !== 'system' ? ctx.tenantId : undefined;
        const result = await handleResourceRead(uri, tenantId);
        if (result && typeof result === 'object' && 'error' in result) {
          throw new Error(String((result as { error: unknown }).error));
        }
        const r = result as { contents: Array<{ uri: string; text?: string; mimeType?: string }> };
        const primaryText = r.contents[0]?.text ?? '';

        // Append PRAXIS consciousness + proof envelopes to every resource read
        const envelopes = buildPRAXISEnvelopes({
          toolName: `resource:${String(uri)}`,
          actor: 'mcp-resource',
          responseText: primaryText,
          isError: false,
        });
        const envelopeContent = { uri: String(uri), mimeType: 'application/json', text: JSON.stringify({ _nexus: envelopes }, null, 2) };

        return {
          contents: [...r.contents.map(c => ({ ...c, uri: c.uri, text: c.text ?? '' })), envelopeContent],
        };
      },
    );
  }

  // ── Register prompts ─────────────────────────────────────────────────────────
  for (const prompt of SUBSTRATE_PROMPTS) {
    const capturedPrompt = prompt;
    const argsShape: Record<string, import('zod').ZodTypeAny> = {};
    for (const arg of capturedPrompt.arguments ?? []) {
      argsShape[arg.name] = arg.required
        ? z.string().describe(arg.description)
        : z.string().optional().describe(arg.description);
    }
    _server.prompt(
      capturedPrompt.name,
      capturedPrompt.description,
      argsShape,
      async (args: Record<string, string | undefined>) => {
        const result = handlePromptGet(capturedPrompt.name, args as Record<string, string>);
        if (result && typeof result === 'object' && 'error' in result) {
          throw new Error(String((result as { error: unknown }).error));
        }
        const r = result as { messages: Array<{ role: string; content: { type: string; text: string } }> };
        return {
          messages: r.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: { type: 'text' as const, text: m.content.text },
          })),
        };
      },
    );
  }

  return _server;
}

/**
 * Register a single substrate tool on the PRAXISMcpServer, bridging to
 * the existing handleToolCall() dispatcher in handlers.ts.
 */
function _registerSubstrateTool(
  server: PRAXISMcpServer,
  toolName: string,
  description: string,
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[]; additionalProperties?: boolean },
): void {
  server.rawTool(toolName, description, inputSchema, async (args: Record<string, unknown>, ctx: TenantContext) => {
    // Resolve actor identity for proof attribution. Priority:
    //   1. MCP SDK context actorId (future SDK versions may set this)
    //   2. ctx.tenantId if it is not the static 'system' default
    //   3. Per-request AsyncLocalStorage actor set by the HTTP transport (authenticated caller)
    //   4. Static fallback 'mcp-gateway' for non-HTTP transports (e.g. stdio)
    const ctxTenantId = ctx.tenantId !== 'system' ? ctx.tenantId : undefined;
    const actorId = ctx.actorId ?? ctxTenantId ?? getCurrentActorId();
    const result = await handleToolCall(toolName, args, actorId);

    // ── Inject PRAXIS envelopes as a trailing content item ────────────────────
    // Attach PRAXIS governance envelopes to every tool response (including
    // agent_delegate). Both a trailing text content block (human-readable) and
    // a first-class _meta structured field (programmatic) are emitted.
    //
    // For agent_delegate the outer envelope records the MCP tool invocation
    // itself. The inner proof (inside delegateToAgent) records the delegation
    // act. These are distinct events and distinct proof records — they should
    // both be present on the response.
    if (result._nexus) {
      const nexusBlock = {
        type: 'text' as const,
        text: JSON.stringify({
          _nexus: {
            description: 'PRAXIS Intelligence Fabric — Governed Cognition Metadata',
            ...result._nexus,
          },
        }, null, 2),
      };
      // Return a fully-typed CallToolResult with _meta for programmatic clients.
      // The rawTool passthrough in PRAXISMcpServer.rawTool() detects content[]
      // arrays and preserves _meta without re-serializing to text.
      // Emit _meta with both:
      //   • Canonical flat keys ("x-nexus-consciousness", "x-nexus-proof") for
      //     strict MCP client interoperability and spec compliance.
      //   • A nested "nexus" shorthand for clients that prefer structured access.
      const enriched: { content: typeof result.content; isError?: boolean; _meta: Record<string, unknown> } = {
        content: [...result.content, nexusBlock],
        isError: result.isError,
        _meta: {
          // Canonical key form — primary contract
          'x-nexus-consciousness': result._nexus['x-nexus-consciousness'],
          'x-nexus-proof': result._nexus['x-nexus-proof'],
          // Shorthand form — convenience alias for programmatic clients
          nexus: {
            consciousness: result._nexus['x-nexus-consciousness'],
            proof: result._nexus['x-nexus-proof'],
          },
        },
      };
      return enriched;
    }

    return result;
  });
}

/**
 * Notify the gateway's PRAXISMcpServer that the tool list has changed.
 * Call this after enable_server / disable_server to push discovery
 * notifications to connected clients.
 */
export async function notifyToolListChanged(): Promise<void> {
  if (_server) {
    await _server.notifyListChanged('tools/list_changed');
  }
  emitToolListChanged();
}

/**
 * Emit a run lifecycle event to SSE clients.
 */
export function emitSubstrateRunEvent(event: RunLifecycleEvent): void {
  void import('./run-events.js').then(({ emitRunEvent }) => {
    emitRunEvent(event);
  });
}
