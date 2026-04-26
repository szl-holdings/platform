/**
 * Substrate MCP Gateway — NexusMcpServer Registration
 *
 * Creates and configures the NexusMcpServer instance that backs the Substrate
 * MCP Gateway. All substrate tools plus server-discovery tools are registered
 * here using the official SDK's typed registration API.
 *
 * This module is the single source of truth for the gateway's tool surface.
 * Both the HTTP transport and the stdio transport share this instance — the
 * SDK handles concurrent client sessions via transport-level session isolation.
 */

import { z } from 'zod';
import { NexusMcpServer, buildTenantInstructions, createDomainApps } from '@workspace/nexus-mcp';
import { GATEWAY_VERSION, SERVER_INFO, SUBSTRATE_RESOURCES, SUBSTRATE_PROMPTS } from './descriptor.js';
import {
  getAvailableTools,
  handleToolCall,
  handleResourceRead,
  handlePromptGet,
} from './handlers.js';
import { emitToolListChanged, type RunLifecycleEvent } from './run-events.js';

// ─── Singleton NexusMcpServer ─────────────────────────────────────────────────

let _server: NexusMcpServer | null = null;

/**
 * Return (or create) the singleton NexusMcpServer for the Substrate Gateway.
 * Called once at startup by both HTTP and stdio entry points.
 */
export function getGatewayServer(): NexusMcpServer {
  if (_server) return _server;

  _server = new NexusMcpServer({
    name: SERVER_INFO.name,
    version: GATEWAY_VERSION,
    enableSampling: true,
    enableElicitation: true,
    enableTasks: true,
    enableApps: true,
    enableInstructions: true,
    enableDiscovery: true,
    enableRoots: false,
    instructions: buildTenantInstructions({
      tenantId: 'substrate-gateway',
      domain: 'analytics',
    }),
  });

  // ── Register domain Apps ─────────────────────────────────────────────────────
  for (const app of createDomainApps()) {
    _server.registerApp(app);
  }

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
      async (uri) => {
        const result = await handleResourceRead(uri);
        if (result && typeof result === 'object' && 'error' in result) {
          throw new Error(String((result as { error: unknown }).error));
        }
        const r = result as { contents: Array<{ uri: string; text?: string; mimeType?: string }> };
        return {
          contents: r.contents.map(c => ({ ...c, text: c.text ?? '' })),
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
      async (args) => {
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
 * Register a single substrate tool on the NexusMcpServer, bridging to
 * the existing handleToolCall() dispatcher in handlers.ts.
 */
function _registerSubstrateTool(
  server: NexusMcpServer,
  toolName: string,
  description: string,
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[]; additionalProperties?: boolean },
): void {
  server.rawTool(toolName, description, inputSchema, async (args, ctx) => {
    const actorId = ctx.actorId ?? ctx.tenantId ?? 'mcp-gateway';
    return handleToolCall(toolName, args, actorId);
  });
}

/**
 * Notify the gateway's NexusMcpServer that the tool list has changed.
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
