/**
 * Substrate MCP Gateway — stdio Transport
 *
 * Implements the MCP stdio transport so the gateway can be launched as a
 * subprocess by Claude Desktop, the MCP CLI, or any other MCP host that
 * manages agent tools via stdio.
 *
 * Protocol:
 *   - Each message is a single newline-terminated JSON object
 *   - Requests arrive on stdin; responses are written to stdout
 *   - stderr is used exclusively for diagnostic logs (never for MCP messages)
 *
 * Usage:
 *   node dist/index.js --stdio
 *   tsx src/index.ts --stdio
 */

import readline from 'node:readline';
import {
  CAPABILITIES,
  SERVER_INFO,
  SUBSTRATE_PROMPTS,
  SUBSTRATE_RESOURCES,
  SUBSTRATE_TOOLS,
} from '../descriptor.js';
import { getAvailableTools, handlePromptGet, handleResourceRead, handleToolCall } from '../handlers.js';
import { runEventBus } from '../run-events.js';

// ─── JSON-RPC Helpers ─────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function send(obj: unknown): void {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function ok(id: string | number | null, result: unknown): void {
  send({ jsonrpc: '2.0', id, result });
}

function err(id: string | number | null, code: number, message: string, data?: unknown): void {
  send({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } });
}

// ─── Method Router ────────────────────────────────────────────────────────────

async function handle(req: JsonRpcRequest): Promise<void> {
  const { method, params = {}, id } = req;

  try {
    switch (method) {
      case 'initialize': {
        const clientExtensions = (params as Record<string, unknown>).extensions;
        const accepted: Record<string, unknown> = {};
        const serverExts = (CAPABILITIES as unknown as Record<string, unknown>).extensions as Record<string, unknown>;
        if (clientExtensions && typeof clientExtensions === 'object') {
          for (const key of Object.keys(clientExtensions as object)) {
            if (key in serverExts) accepted[key] = serverExts[key];
          }
        }
        ok(id, {
          protocolVersion: SERVER_INFO.protocolVersion,
          capabilities: CAPABILITIES,
          serverInfo: { name: SERVER_INFO.name, version: SERVER_INFO.version },
          extensions: accepted,
        });
        break;
      }

      case 'ping':
        ok(id, {});
        break;

      case 'tools/list': {
        // Use the live tool set — changes when enable_server / disable_server is called.
        const availableTools = getAvailableTools();
        ok(id, {
          tools: availableTools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        });
        break;
      }

      case 'tools/call': {
        const toolName = String(params.name ?? '');
        const toolArgs = (params.arguments ?? {}) as Record<string, unknown>;
        if (!toolName) {
          err(id, -32602, 'INVALID_PARAMS', { reason: 'Missing tool name' });
          break;
        }
        const liveTools = getAvailableTools();
        const known = liveTools.find((t) => t.name === toolName);
        if (!known) {
          err(id, -32601, 'METHOD_NOT_FOUND', { reason: `No tool '${toolName}'` });
          break;
        }
        const result = await handleToolCall(toolName, toolArgs, 'stdio:anonymous');
        ok(id, result);
        break;
      }

      case 'resources/list':
        ok(id, { resources: SUBSTRATE_RESOURCES });
        break;

      case 'resources/read': {
        const uri = String(params.uri ?? '');
        if (!uri) {
          err(id, -32602, 'INVALID_PARAMS', { reason: 'Missing URI' });
          break;
        }
        const result = await handleResourceRead(uri);
        if ('error' in result) {
          err(id, -32001, 'NOT_FOUND', { reason: result.error });
          break;
        }
        ok(id, result);
        break;
      }

      case 'prompts/list':
        ok(id, { prompts: SUBSTRATE_PROMPTS });
        break;

      case 'prompts/get': {
        const name = String(params.name ?? '');
        const promptArgs = (params.arguments ?? {}) as Record<string, string>;
        if (!name) {
          err(id, -32602, 'INVALID_PARAMS', { reason: 'Missing prompt name' });
          break;
        }
        const result = handlePromptGet(name, promptArgs);
        if ('error' in result) {
          err(id, -32001, 'NOT_FOUND', { reason: result.error });
          break;
        }
        ok(id, result);
        break;
      }

      case 'notifications/initialized':
      case 'notifications/cancelled':
      case 'notifications/roots/list_changed':
        // Notifications have no id and require no response; just acknowledge.
        return;

      default:
        err(id, -32601, 'METHOD_NOT_FOUND', { method });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    err(id, -32603, 'INTERNAL_ERROR', { reason: msg });
  }
}

// ─── Stdio Loop ───────────────────────────────────────────────────────────────

export function startStdioTransport(): void {
  // Forward tool_list_changed events to the connected MCP host as a proper
  // notifications/tools/list_changed notification (MCP spec §6.5). The host
  // will respond by calling tools/list again to refresh its working set.
  runEventBus.subscribe((event) => {
    if (event.type === 'tool_list_changed') {
      send({ jsonrpc: '2.0', method: 'notifications/tools/list_changed', params: {} });
    }
  });

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      err(null, -32700, 'PARSE_ERROR', { reason: 'Invalid JSON' });
      return;
    }

    // Handle both single and batch requests
    if (Array.isArray(parsed)) {
      if (parsed.length > 20) {
        err(null, -32600, 'INVALID_REQUEST', { reason: 'Batch size limit is 20' });
        return;
      }
      void Promise.all(
        parsed.map((item: unknown) => {
          const req = item as JsonRpcRequest;
          if (!req.jsonrpc || !req.method) {
            err(req.id ?? null, -32600, 'INVALID_REQUEST');
            return;
          }
          return handle(req);
        }),
      );
    } else {
      const req = parsed as JsonRpcRequest;
      if (!req.jsonrpc || !req.method) {
        err(req.id ?? null, -32600, 'INVALID_REQUEST');
        return;
      }
      void handle(req);
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });
}
