/**
 * Substrate MCP Gateway — PRAXISMcpServer Registration
 *
 * Builds the **single** `PRAXISMcpServer` instance that backs every transport
 * (Streamable HTTP, legacy SSE, and stdio). Tool / resource / prompt
 * registration happens exactly once, at module load. Concurrent Streamable
 * HTTP sessions are multiplexed onto this one server via
 * `PRAXISMcpServer.attachSession(subTransport)` — see
 * `packages/nexus-mcp/src/multiplexing-transport.ts` and the changelog entry
 * for task #5068.
 */

import { z } from 'zod';
import {
  PRAXISMcpServer,
  buildTenantInstructions,
  createDomainApps,
  type TenantContext,
} from '@workspace/nexus-mcp';
import { getCurrentActorId } from './request-context.js';
import { CAPABILITIES, GATEWAY_VERSION, SERVER_INFO, SUBSTRATE_RESOURCES, SUBSTRATE_PROMPTS } from './descriptor.js';
import { initGatewayIdentity } from './pqc-identity-init.js';
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

// ─── Singleton PRAXISMcpServer (shared across every transport / session) ─────
//
// Task #5068: previously each Streamable HTTP session built its own
// `PRAXISMcpServer` because the SDK's underlying `Server` is one-shot
// (`Server.connect()` may only be invoked once; `_initialized` flips once).
// `PRAXISMcpServer.attachSession()` now wires each per-session
// `StreamableHTTPServerTransport` onto a long-lived multiplexing transport,
// so a single server instance can host many concurrent sessions. The
// expensive setup work (PQC identity bootstrap, domain root enumeration,
// domain App construction, ~26 tool / N resource / N prompt SDK
// registrations) happens here exactly once.

let _server: PRAXISMcpServer | null = null;
let _bridgesInstalled = false;

function ensureGlobalBridges(server: PRAXISMcpServer): void {
  if (_bridgesInstalled) return;
  _bridgesInstalled = true;

  setSamplingBridge({
    requestSampling: async (params) => {
      // With a shared server, target the first live multiplexer session.
      // The multiplexer routes the server-initiated request back to that
      // session's transport (see MultiplexingTransport.runWithSession).
      return server.requestSampling(params);
    },
  });

  setResourceUpdateCallback((uri: string) => {
    void server.notifyResourceUpdated(uri);
  });
}

/**
 * Return (or build) the singleton PRAXISMcpServer for the Substrate Gateway.
 * All callers — Streamable HTTP, legacy SSE, and stdio — share this instance.
 */
export async function getGatewayServer(): Promise<PRAXISMcpServer> {
  if (_server) return _server;

  const cryptographicIdentity = await initGatewayIdentity();
  const domainRoots = listRoots('substrate-gateway').map((r) => ({
    uri: r.uri,
    name: r.name,
  }));

  const server = new PRAXISMcpServer({
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
    cryptographicIdentity,
    governanceTools: [
      'substrate_approve',
      'substrate_reject',
      'agent_delegate',
      'enable_server',
      'disable_server',
      'roots_enable_domain',
      'roots_disable_domain',
    ],
    identityEnforcementMode: 'block',
    instructions: buildTenantInstructions({
      tenantId: 'substrate-gateway',
      domain: 'analytics',
    }),
    extensions: (CAPABILITIES as unknown as { extensions: Record<string, unknown> }).extensions,
  });

  // ── Register domain Apps ────────────────────────────────────────────────────
  for (const app of createDomainApps()) {
    server.registerApp(app);
  }

  // ── Register substrate tools via SDK ─────────────────────────────────────────
  for (const tool of getAvailableTools()) {
    _registerSubstrateTool(server, tool.name, tool.description, tool.inputSchema);
  }

  // ── Register resources ───────────────────────────────────────────────────────
  for (const res of SUBSTRATE_RESOURCES) {
    const capturedRes = res;
    server.resource(
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
    server.prompt(
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

  ensureGlobalBridges(server);
  _server = server;
  return server;
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
      const enriched: { content: typeof result.content; isError?: boolean; _meta: Record<string, unknown> } = {
        content: [...result.content, nexusBlock],
        isError: result.isError,
        _meta: {
          'x-nexus-consciousness': result._nexus['x-nexus-consciousness'],
          'x-nexus-proof': result._nexus['x-nexus-proof'],
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
 * Notify connected MCP clients that the tool list has changed. The shared
 * PRAXISMcpServer broadcasts the SDK notification through every active
 * multiplexer session; in-process SSE consumers are notified separately via
 * the gateway's run-event bus.
 */
export async function notifyToolListChanged(): Promise<void> {
  const srv = await getGatewayServer();
  await srv.notifyListChanged('tools/list_changed');
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
