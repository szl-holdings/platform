/**
 * Substrate MCP Gateway — Entry Point
 *
 * Starts either:
 *   - HTTP+SSE transport (default)        → node dist/index.js
 *   - stdio transport (for MCP hosts)     → node dist/index.js --stdio
 *
 * Environment variables:
 *   PORT                        — HTTP port (default: 3700)
 *   SUBSTRATE_GATEWAY_API_KEY   — Bearer token required for write operations
 *   SUBSTRATE_SIGNING_KEY       — 32-byte hex key for evidence bundle HMAC
 *   NODE_ENV                    — production | development
 */

import express from "express";
import { createHttpTransport } from "./transport/http.js";
import { startStdioTransport } from "./transport/stdio.js";
import { SERVER_INFO } from "./descriptor.js";

const IS_STDIO = process.argv.includes("--stdio");
const PORT = parseInt(process.env["PORT"] ?? "3700", 10);
const IS_PRODUCTION = process.env["NODE_ENV"] === "production";

// Fail-fast: refuse to start in production without an API key.
// In development a warning is logged by auth.ts and unauthenticated mode is used.
if (IS_PRODUCTION && !process.env["SUBSTRATE_GATEWAY_API_KEY"]) {
  console.error(
    "[substrate-mcp-gateway] FATAL: SUBSTRATE_GATEWAY_API_KEY is not set. " +
    "The gateway cannot start in production without an API key.",
  );
  process.exit(1);
}

if (IS_STDIO) {
  startStdioTransport();
} else {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // MCP gateway mounted at /mcp
  app.use("/mcp", createHttpTransport());

  // Root redirect for discoverability
  app.get("/", (_req, res) => {
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

  const server = app.listen(PORT, () => {
    console.log(
      `[substrate-mcp-gateway] ${SERVER_INFO.name} v${SERVER_INFO.version} ` +
      `listening on port ${PORT}`,
    );
    console.log(
      `[substrate-mcp-gateway] Endpoints: ` +
      `POST /mcp (JSON-RPC), GET /mcp/sse, GET /mcp/health`,
    );
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[substrate-mcp-gateway] Received SIGTERM — shutting down gracefully");
    server.close(() => process.exit(0));
  });

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
}
