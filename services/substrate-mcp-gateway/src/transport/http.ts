/**
 * Substrate MCP Gateway — HTTP + SSE Transport
 *
 * Mounts all MCP endpoints on an Express app:
 *   POST /mcp        — JSON-RPC 2.0 message endpoint
 *   GET  /mcp/sse    — Server-Sent Events stream (persistent agent sessions)
 *   GET  /mcp/health — Health + capabilities
 *   GET  /mcp/tools  — Tool inventory with full schemas
 *   GET  /mcp/resources — Resource inventory
 *   GET  /mcp/prompts   — Prompt template inventory
 */

import express, { type Request, type Response } from "express";
import {
  SERVER_INFO,
  CAPABILITIES,
  SUBSTRATE_TOOLS,
  SUBSTRATE_RESOURCES,
  SUBSTRATE_PROMPTS,
} from "../descriptor.js";
import { handleToolCall, handleResourceRead, handlePromptGet } from "../handlers.js";
import { authMiddleware, resolveAuthContext } from "../auth.js";
import { runEventBus, type RunLifecycleEvent } from "../run-events.js";
import { runtimeEventBus, type SubstrateRuntimeEvent } from "@szl/substrate";

// ─── JSON-RPC Helpers ─────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function rpcOk(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function rpcErr(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } };
}

// ─── MCP Method Router ────────────────────────────────────────────────────────

async function handleMcpMethod(
  req: JsonRpcRequest,
  actorId: string,
): Promise<JsonRpcResponse> {
  const { method, params = {}, id } = req;

  try {
    switch (method) {
      case "initialize":
        return rpcOk(id, {
          protocolVersion: SERVER_INFO.protocolVersion,
          capabilities: CAPABILITIES,
          serverInfo: {
            name: SERVER_INFO.name,
            version: SERVER_INFO.version,
          },
        });

      case "ping":
        return rpcOk(id, {});

      case "tools/list":
        return rpcOk(id, {
          tools: SUBSTRATE_TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        });

      case "tools/call": {
        const toolName = String(params["name"] ?? "");
        const toolArgs = (params["arguments"] ?? {}) as Record<string, unknown>;

        if (!toolName) {
          return rpcErr(id, -32602, "INVALID_PARAMS", { reason: "Missing tool name in params.name" });
        }

        const known = SUBSTRATE_TOOLS.find((t) => t.name === toolName);
        if (!known) {
          return rpcErr(id, -32601, "METHOD_NOT_FOUND", { reason: `No tool named '${toolName}'` });
        }

        const result = await handleToolCall(toolName, toolArgs, actorId);
        return rpcOk(id, result);
      }

      case "resources/list":
        return rpcOk(id, {
          resources: SUBSTRATE_RESOURCES.map((r) => ({
            uri: r.uri,
            name: r.name,
            description: r.description,
            mimeType: r.mimeType,
          })),
        });

      case "resources/read": {
        const uri = String(params["uri"] ?? "");
        if (!uri) {
          return rpcErr(id, -32602, "INVALID_PARAMS", { reason: "Missing resource URI in params.uri" });
        }
        const result = await handleResourceRead(uri);
        if ("error" in result) {
          return rpcErr(id, -32001, "NOT_FOUND", { reason: result.error });
        }
        return rpcOk(id, result);
      }

      case "prompts/list":
        return rpcOk(id, {
          prompts: SUBSTRATE_PROMPTS.map((p) => ({
            name: p.name,
            description: p.description,
            arguments: p.arguments ?? [],
          })),
        });

      case "prompts/get": {
        const name = String(params["name"] ?? "");
        const promptArgs = (params["arguments"] ?? {}) as Record<string, string>;
        if (!name) {
          return rpcErr(id, -32602, "INVALID_PARAMS", { reason: "Missing prompt name in params.name" });
        }
        const result = handlePromptGet(name, promptArgs);
        if ("error" in result) {
          return rpcErr(id, -32001, "NOT_FOUND", { reason: result.error });
        }
        return rpcOk(id, result);
      }

      default:
        return rpcErr(id, -32601, "METHOD_NOT_FOUND", { method });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[substrate-mcp-gateway] Error handling ${method}:`, e);
    return rpcErr(id, -32603, "INTERNAL_ERROR", { reason: msg });
  }
}

// ─── SSE Session Registry ─────────────────────────────────────────────────────

const sseClients = new Map<string, Response>();

function sseId(): string {
  return `sse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Express Router Factory ───────────────────────────────────────────────────

export function createHttpTransport(): express.Router {
  const router = express.Router();

  router.use(express.json({ limit: "4mb" }));
  router.use(authMiddleware);

  // ── Index (public) ────────────────────────────────────────────────────────
  // Returning 200 at the router root lets the artifact router probe `/mcp/`
  // and confirm the service is up before considering the workflow ready.

  router.get("/", (_req, res) => {
    res.json({
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: SERVER_INFO.protocolVersion,
      endpoints: {
        health: "GET /mcp/health",
        tools: "GET /mcp/tools",
        resources: "GET /mcp/resources",
        prompts: "GET /mcp/prompts",
        jsonrpc: "POST /mcp",
        sse: "GET /mcp/sse",
      },
    });
  });

  // ── Health ────────────────────────────────────────────────────────────────

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: SERVER_INFO.protocolVersion,
      capabilities: CAPABILITIES,
      toolCount: SUBSTRATE_TOOLS.length,
      resourceCount: SUBSTRATE_RESOURCES.length,
      promptCount: SUBSTRATE_PROMPTS.length,
      activeSseConnections: sseClients.size,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Tool inventory ────────────────────────────────────────────────────────

  router.get("/tools", (_req, res) => {
    res.json({ tools: SUBSTRATE_TOOLS });
  });

  // ── Resource inventory ────────────────────────────────────────────────────

  router.get("/resources", (_req, res) => {
    res.json({ resources: SUBSTRATE_RESOURCES });
  });

  // ── Prompt inventory ──────────────────────────────────────────────────────

  router.get("/prompts", (_req, res) => {
    res.json({ prompts: SUBSTRATE_PROMPTS });
  });

  // ── SSE stream ────────────────────────────────────────────────────────────

  router.get("/sse", (req: Request, res: Response) => {
    const id = sseId();
    const ctx = resolveAuthContext(req);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    sseClients.set(id, res);

    // Helper to safely write an SSE frame to this client
    function writeEvent(eventType: string, data: unknown): void {
      try {
        res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {
        // Client disconnected mid-write — clean up handled by "close" below
      }
    }

    // Send ready event immediately on connect
    writeEvent("$/ready", {
      endpoint: "/mcp",
      sessionId: id,
      serverInfo: SERVER_INFO,
      capabilities: CAPABILITIES,
      actorId: ctx.actorId,
    });

    // Subscribe to run lifecycle events from tool handlers and fan-out to this client
    const unsubscribeRunEvents = runEventBus.subscribe((event: RunLifecycleEvent) => {
      writeEvent(event.type, event);
    });

    // Subscribe to substrate runtime journal events so SSE clients receive
    // stage:start, stage:complete, stage:failed, run:complete, and run:failed
    // pushes as a workflow run progresses (no polling required).
    const unsubscribeRuntimeEvents = runtimeEventBus.subscribe(
      (event: SubstrateRuntimeEvent) => {
        writeEvent(event.type, event);
      },
    );

    // Keepalive pings every 30s
    const keepalive = setInterval(() => {
      writeEvent("$/ping", { timestamp: Date.now() });
    }, 30_000);

    req.on("close", () => {
      clearInterval(keepalive);
      unsubscribeRunEvents();
      unsubscribeRuntimeEvents();
      sseClients.delete(id);
    });
  });

  // ── JSON-RPC 2.0 endpoint ─────────────────────────────────────────────────

  router.post("/", async (req: Request, res: Response) => {
    const ctx = (req as Request & { authCtx?: { authenticated: boolean; actorId: string } }).authCtx;
    const actorId = ctx?.actorId ?? "anonymous";

    const body = req.body as unknown;

    // Batch request
    if (Array.isArray(body)) {
      if (body.length > 20) {
        res.status(400).json(rpcErr(null, -32600, "INVALID_REQUEST", {
          reason: "Batch size limit is 20 requests",
        }));
        return;
      }
      const results = await Promise.all(
        body.map((item: unknown) => {
          const rpcReq = item as JsonRpcRequest;
          if (!rpcReq.jsonrpc || !rpcReq.method) {
            return rpcErr(rpcReq.id ?? null, -32600, "INVALID_REQUEST");
          }
          return handleMcpMethod(rpcReq, actorId);
        }),
      );
      res.json(results);
      return;
    }

    const rpcReq = body as JsonRpcRequest;
    if (!rpcReq || typeof rpcReq !== "object" || !rpcReq.jsonrpc || !rpcReq.method) {
      res.status(400).json(rpcErr(null, -32600, "INVALID_REQUEST"));
      return;
    }

    const result = await handleMcpMethod(rpcReq, actorId);
    res.json(result);
  });

  return router;
}
