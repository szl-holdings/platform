/**
 * Substrate MCP Gateway — PRAXISMcpServer Registration
 *
 * Creates and configures the PRAXISMcpServer instance that backs the Substrate
 * MCP Gateway. All substrate tools plus server-discovery tools are registered
 * here using the official SDK's typed registration API.
 *
 * This module is the single source of truth for the gateway's tool surface.
 * The MCP SDK's `Server` carries a one-shot `initialized` flag, so each
 * Streamable HTTP session needs its own `PRAXISMcpServer` + transport pair;
 * `createGatewayServer()` is the per-session factory used by the HTTP
 * transport, while `getGatewayServer()` returns a long-lived singleton for
 * stdio and module-level notifications. Expensive immutable inputs (PQC
 * identity, domain roots, domain Apps) are cached at the module level so
 * per-session construction only pays for SDK tool/resource/prompt
 * registration. A process-wide live-server registry fans out sampling
 * requests and resource/tool-list change notifications across every active
 * session.
 */

import { z } from 'zod';
import {
  PRAXISMcpServer,
  buildTenantInstructions,
  createDomainApps,
  type CryptographicIdentityConfig,
  type PRAXISApp,
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

// ─── Cached, immutable server inputs ──────────────────────────────────────────
//
// The SDK's underlying `Server` carries a one-shot `initialized` flag, so a
// single `PRAXISMcpServer` instance cannot host more than one Streamable HTTP
// session. We therefore still build a fresh server per session, but everything
// that is genuinely immutable across the gateway's lifetime — the PQC identity
// (and its CA cert), the domain roots list, and the domain Apps registry — is
// computed once at module load and reused. Previously each session re-ran the
// identity bootstrap (which talks to the database) and rebuilt the domain apps
// from scratch, which dominated session-creation cost under load.
// Tracked: szl-holdings/platform#113 and the per-session-cost follow-up.

let _cachedIdentity: CryptographicIdentityConfig | null = null;
let _cachedDomainRoots: Array<{ uri: string; name?: string }> | null = null;
let _cachedDomainApps: PRAXISApp[] | null = null;

function getCachedIdentity(): CryptographicIdentityConfig {
  if (!_cachedIdentity) {
    _cachedIdentity = initGatewayIdentity();
  }
  return _cachedIdentity;
}

function getCachedDomainRoots(): Array<{ uri: string; name?: string }> {
  if (!_cachedDomainRoots) {
    _cachedDomainRoots = listRoots('substrate-gateway').map((r) => ({
      uri: r.uri,
      name: r.name,
    }));
  }
  return _cachedDomainRoots;
}

function getCachedDomainApps(): PRAXISApp[] {
  if (!_cachedDomainApps) {
    _cachedDomainApps = createDomainApps();
  }
  return _cachedDomainApps;
}

// ─── Live server registry + global bridge fan-out ─────────────────────────────
//
// `setSamplingBridge` and `setResourceUpdateCallback` install process-wide
// callbacks. When each session installed its own callbacks, the last session
// to be created silently overwrote the bridges of all earlier sessions, so
// resource-updated notifications and sampling requests only reached one
// client. We now install the bridges exactly once and fan out to every live
// server instance — including the stdio singleton.

const _liveServers = new Set<PRAXISMcpServer>();
let _bridgesInstalled = false;

function ensureGlobalBridges(): void {
  if (_bridgesInstalled) return;
  _bridgesInstalled = true;

  setSamplingBridge({
    requestSampling: async (params) => {
      // Any live server can satisfy a sampling request — pick the first
      // (insertion order). In practice the gateway is rarely asked to sample
      // from more than one client at a time.
      const next = _liveServers.values().next();
      if (next.done) {
        throw new Error('No active MCP sessions available for sampling');
      }
      return next.value.requestSampling(params);
    },
  });

  setResourceUpdateCallback((uri: string) => {
    for (const server of _liveServers) {
      void server.notifyResourceUpdated(uri);
    }
  });
}

function registerLiveServer(server: PRAXISMcpServer): () => void {
  _liveServers.add(server);
  return () => {
    _liveServers.delete(server);
  };
}

// ─── Singleton PRAXISMcpServer (stdio / module-level notifications) ──────────

let _server: PRAXISMcpServer | null = null;

/**
 * Build a fully-configured PRAXISMcpServer instance.
 *
 * The MCP SDK's underlying `Server` carries a one-shot "initialized" flag, so
 * a single instance cannot service multiple Streamable HTTP sessions — every
 * fresh `initialize` request needs its own server + transport pair. Use this
 * factory from the HTTP transport's per-session bootstrap path; use
 * `getGatewayServer()` for stdio / singleton consumers (notifications, etc).
 *
 * Heavy inputs (PQC identity, domain roots, domain Apps) are cached at the
 * module level so per-session construction only pays for SDK registration
 * (tool/resource/prompt entries on the new `McpServer`).
 *
 * Tracked: szl-holdings/platform#113.
 */
export function createGatewayServer(): PRAXISMcpServer {
  ensureGlobalBridges();

  const cryptographicIdentity = getCachedIdentity();
  const domainRoots = getCachedDomainRoots();

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

  // ── Register domain Apps (from cached registry) ──────────────────────────────
  for (const app of getCachedDomainApps()) {
    server.registerApp(app);
  }

  // ── Register substrate tools via SDK ─────────────────────────────────────────
  const tools = getAvailableTools();
  for (const tool of tools) {
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

  registerLiveServer(server);
  return server;
}

/**
 * Deregister a session-scoped server when its transport closes. Callers in the
 * HTTP transport invoke this from the transport's `onclose` hook so the live
 * servers set does not leak across the gateway's lifetime.
 */
export function disposeGatewayServer(server: PRAXISMcpServer): void {
  _liveServers.delete(server);
}

/**
 * Return (or create) the singleton PRAXISMcpServer for the Substrate Gateway.
 * Used for stdio transport and module-level notifications. The HTTP transport
 * builds fresh per-session servers via `createGatewayServer()`.
 */
export function getGatewayServer(): PRAXISMcpServer {
  if (!_server) _server = createGatewayServer();
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
 * Notify every live gateway server that the tool list has changed. Call this
 * after enable_server / disable_server so connected clients on any session
 * (Streamable HTTP, legacy SSE, or stdio) receive a discovery refresh.
 */
export async function notifyToolListChanged(): Promise<void> {
  for (const server of _liveServers) {
    await server.notifyListChanged('tools/list_changed');
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
