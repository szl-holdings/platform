# Substrate MCP Transport

**Version:** 1.0 · **Date:** April 2026  
**Service:** `services/substrate-mcp-gateway`  
**Protocol:** [Model Context Protocol 2024-11-05](https://spec.modelcontextprotocol.io/)

**Related:** [sdk.md](./sdk.md) · [architecture.md](../architecture/architecture.md) · [MCP_GATEWAY_STRATEGY.md](../architecture/mcp-gateway-strategy.md)

---

## Overview

The Substrate MCP Gateway exposes the Sovereign Execution Substrate to any MCP-compatible client — Claude Desktop, GPT-4 with function calling, partner agents, internal apps that don't share the monorepo, and future agent gateway integrations.

The gateway is a **pure transport layer**. No business logic lives here. Policy evaluation, approval gating, and evidence-chain writes happen inside the `@szl/substrate` runtime. Every MCP call flows through the same policy compiler, approval engine, and audit chain as in-process calls — there is no policy bypass via the wire protocol.

---

## Gateway Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /mcp` | POST | Required (write tools) | JSON-RPC 2.0 message endpoint |
| `GET /mcp/sse` | GET | Optional | Server-Sent Events stream |
| `GET /mcp/health` | GET | Public | Health + capabilities |
| `GET /mcp/tools` | GET | Public | Tool inventory with schemas |
| `GET /mcp/resources` | GET | Public | Resource inventory |
| `GET /mcp/prompts` | GET | Public | Prompt template inventory |

---

## Transports

### HTTP + SSE

The primary transport. Suitable for all network-accessible callers.

**JSON-RPC endpoint:**

```
POST /mcp
Content-Type: application/json
Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY>

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "substrate_submit_run",
    "arguments": {
      "workflowId": "opportunity-audit",
      "input": { "tenantId": "acme" }
    }
  }
}
```

**Batch requests:** Send an array of JSON-RPC objects. Max 20 per batch.

**SSE stream:**

```
GET /mcp/sse
Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY>
Accept: text/event-stream
```

The SSE connection:
1. Sends `$/ready` event with server info, session ID, and capabilities
2. Sends `$/ping` keepalives every 30 seconds
3. Callers send tool invocations to `POST /mcp` — the SSE stream is receive-only

### stdio

For MCP hosts (Claude Desktop, MCP CLI) that manage agents as subprocesses:

```bash
# In claude_desktop_config.json
{
  "mcpServers": {
    "szl-substrate": {
      "command": "node",
      "args": ["/path/to/services/substrate-mcp-gateway/dist/index.js", "--stdio"],
      "env": {
        "SUBSTRATE_GATEWAY_API_KEY": "<your-key>"
      }
    }
  }
}
```

The stdio transport:
- Reads newline-delimited JSON from stdin
- Writes responses to stdout
- Uses stderr exclusively for diagnostic logs

---

## Tool Inventory

All 8 tools are defined in `services/substrate-mcp-gateway/src/descriptor.ts` with full Zod-validated JSON Schemas.

| Tool | Description | Policy Bypass? |
|------|-------------|---------------|
| `substrate_submit_run` | Submit a workflow run (live or dry-run) | Never |
| `substrate_get_run` | Poll run state by ID | N/A (read-only) |
| `substrate_replay` | Replay a completed run from journal | Never |
| `substrate_counterfactual` | Counterfactual replay with model/policy substitution | Never |
| `substrate_list_approvals` | List approvals inbox entries | N/A (read-only) |
| `substrate_approve` | Approve a pending ApprovalGate | Never |
| `substrate_reject` | Reject a pending ApprovalGate | Never |
| `substrate_list_workflows` | List registered workflows | N/A (read-only) |

### Example: Submit a run

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "substrate_submit_run",
    "arguments": {
      "workflowId": "opportunity-audit",
      "input": { "tenantId": "acme", "period": "2026-Q1" },
      "mode": "live"
    }
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"runId\":\"abc-123\",\"status\":\"running\",\"workflowId\":\"opportunity-audit\",\"traceId\":\"...\"}"
    }]
  }
}
```

---

## Resource Inventory

| URI | Description | MIME type |
|-----|-------------|-----------|
| `substrate://schema/run` | JSON Schema for `PipelineRun` | `application/schema+json` |
| `substrate://schema/stage-result` | JSON Schema for `StageResult` | `application/schema+json` |
| `substrate://schema/counterfactual-diff` | JSON Schema for `CounterfactualDiff` | `application/schema+json` |
| `substrate://policy/active` | Active policy profiles | `application/json` |

---

## Authn/Authz Model

### Authentication

The gateway accepts:

1. **Bearer token** — `Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY>`  
   Required for all write operations.
2. **No auth** — Only for public read-only endpoints: `/mcp/health`, `tools/list`, `resources/list`, `prompts/list`, `initialize`, `ping`.

Set `SUBSTRATE_GATEWAY_API_KEY` in production. If unset in development, all requests are accepted with a warning. If unset in production (`NODE_ENV=production`), write requests are rejected.

### Authorization

Write tools route all calls through the substrate's existing policy compiler and approval engine. There is no role-level RBAC at the gateway layer — policy enforcement happens inside the substrate runtime. The `actor` field on `substrate_approve` / `substrate_reject` is written verbatim into the proof entry for auditability.

### Rate Limits

| Caller Type | Limit |
|-------------|-------|
| Unauthenticated | Schema discovery endpoints only |
| Authenticated | Governed by the substrate runtime's own resource limits |
| Batch | Max 20 requests per batch |

---

## Error Handling

Errors follow JSON-RPC 2.0 codes:

| Code | Name | Description |
|------|------|-------------|
| `-32700` | `PARSE_ERROR` | Invalid JSON |
| `-32600` | `INVALID_REQUEST` | Malformed request |
| `-32601` | `METHOD_NOT_FOUND` | Unknown method or tool |
| `-32602` | `INVALID_PARAMS` | Missing or invalid parameters (Zod validation failed) |
| `-32603` | `INTERNAL_ERROR` | Server-side error |
| `-32000` | `PERMISSION_DENIED` | Auth check failed |
| `-32001` | `NOT_FOUND` | Run / resource / prompt not found |

Tool-level errors are returned inside the MCP tool result with `isError: true` and the error message in the `content[0].text` field.

---

## Policy and Audit Guarantee

The gateway enforces the following invariant:

> All MCP calls flow through the same policy compiler, approval engine, and evidence/audit chain as in-process calls. There is no policy bypass via the wire protocol.

This is implemented by calling `defaultRuntime.start()` (and related substrate primitives) directly from the tool handlers. The gateway never calls internal substrate functions that bypass policy evaluation.

---

## Sentra MCP Traffic Gateway Integration

The Substrate MCP gateway is registered in the Sentra Cyber Resilience platform's MCP server catalog. Sentra applies its allow/deny rules and telemetry to all traffic flowing through the substrate endpoint, matching the behavior applied to every other MCP server in the mesh.

To register the substrate endpoint in Sentra's mesh, add to your Sentra MCP server configuration:

```yaml
mcpServers:
  - id: szl-substrate
    name: SZL Substrate MCP Gateway
    packageRef: "@szl/substrate-mcp-gateway"
    endpoint: "http://substrate-mcp-gateway:3700/mcp"
    trustState: trusted
    allowedEgressDomains: ["substrate-mcp-gateway"]
```

---

## Running the Gateway

```bash
# HTTP + SSE (default)
PORT=3700 SUBSTRATE_GATEWAY_API_KEY=<key> tsx services/substrate-mcp-gateway/src/index.ts

# stdio (for MCP host integration)
SUBSTRATE_GATEWAY_API_KEY=<key> tsx services/substrate-mcp-gateway/src/index.ts --stdio
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUBSTRATE_GATEWAY_API_KEY` | Yes (prod) | Bearer token for write operations |
| `SUBSTRATE_SIGNING_KEY` | Recommended | 32-byte hex key for HMAC-signed evidence bundles |
| `PORT` | No | HTTP listen port (default: 3700) |
| `NODE_ENV` | No | `production` enables strict auth enforcement |

---

*Last updated: 2026-04-20. Source: `services/substrate-mcp-gateway/`.*
