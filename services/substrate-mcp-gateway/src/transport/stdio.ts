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

import readline from "readline";
import {
  SERVER_INFO,
  CAPABILITIES,
  SUBSTRATE_TOOLS,
  SUBSTRATE_RESOURCES,
  SUBSTRATE_PROMPTS,
} from "../descriptor.js";
import { handleToolCall, handleResourceRead, handlePromptGet } from "../handlers.js";

// ─── JSON-RPC Helpers ─────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function send(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function ok(id: string | number | null, result: unknown): void {
  send({ jsonrpc: "2.0", id, result });
}

function err(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): void {
  send({ jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } });
}

// ─── Method Router ────────────────────────────────────────────────────────────

async function handle(req: JsonRpcRequest): Promise<void> {
  const { method, params = {}, id } = req;

  try {
    switch (method) {
      case "initialize":
        ok(id, {
          protocolVersion: SERVER_INFO.protocolVersion,
          capabilities: CAPABILITIES,
          serverInfo: { name: SERVER_INFO.name, version: SERVER_INFO.version },
        });
        break;

      case "ping":
        ok(id, {});
        break;

      case "tools/list":
        ok(id, { tools: SUBSTRATE_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
        break;

      case "tools/call": {
        const toolName = String(params["name"] ?? "");
        const toolArgs = (params["arguments"] ?? {}) as Record<string, unknown>;
        if (!toolName) { err(id, -32602, "INVALID_PARAMS", { reason: "Missing tool name" }); break; }
        const known = SUBSTRATE_TOOLS.find((t) => t.name === toolName);
        if (!known) { err(id, -32601, "METHOD_NOT_FOUND", { reason: `No tool '${toolName}'` }); break; }
        const result = await handleToolCall(toolName, toolArgs, "stdio:anonymous");
        ok(id, result);
        break;
      }

      case "resources/list":
        ok(id, { resources: SUBSTRATE_RESOURCES });
        break;

      case "resources/read": {
        const uri = String(params["uri"] ?? "");
        if (!uri) { err(id, -32602, "INVALID_PARAMS", { reason: "Missing URI" }); break; }
        const result = await handleResourceRead(uri);
        if ("error" in result) { err(id, -32001, "NOT_FOUND", { reason: result.error }); break; }
        ok(id, result);
        break;
      }

      case "prompts/list":
        ok(id, { prompts: SUBSTRATE_PROMPTS });
        break;

      case "prompts/get": {
        const name = String(params["name"] ?? "");
        const promptArgs = (params["arguments"] ?? {}) as Record<string, string>;
        if (!name) { err(id, -32602, "INVALID_PARAMS", { reason: "Missing prompt name" }); break; }
        const result = handlePromptGet(name, promptArgs);
        if ("error" in result) { err(id, -32001, "NOT_FOUND", { reason: result.error }); break; }
        ok(id, result);
        break;
      }

      default:
        err(id, -32601, "METHOD_NOT_FOUND", { method });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[substrate-mcp-gateway:stdio] Error handling ${method}:`, e);
    err(id, -32603, "INTERNAL_ERROR", { reason: msg });
  }
}

// ─── Stdio Loop ───────────────────────────────────────────────────────────────

export function startStdioTransport(): void {
  console.error(
    `[substrate-mcp-gateway] Starting stdio transport (${SERVER_INFO.name} v${SERVER_INFO.version})`,
  );

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      err(null, -32700, "PARSE_ERROR", { reason: "Invalid JSON" });
      return;
    }

    // Handle both single and batch requests
    if (Array.isArray(parsed)) {
      if (parsed.length > 20) {
        err(null, -32600, "INVALID_REQUEST", { reason: "Batch size limit is 20" });
        return;
      }
      void Promise.all(parsed.map((item: unknown) => {
        const req = item as JsonRpcRequest;
        if (!req.jsonrpc || !req.method) {
          err(req.id ?? null, -32600, "INVALID_REQUEST");
          return;
        }
        return handle(req);
      }));
    } else {
      const req = parsed as JsonRpcRequest;
      if (!req.jsonrpc || !req.method) {
        err(req.id ?? null, -32600, "INVALID_REQUEST");
        return;
      }
      void handle(req);
    }
  });

  rl.on("close", () => {
    console.error("[substrate-mcp-gateway] stdin closed — shutting down stdio transport");
    process.exit(0);
  });
}
