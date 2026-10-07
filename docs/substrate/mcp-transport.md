# Substrate MCP Transport

**Version:** 1.1 · **Date:** 2026-10-07
**Service:** `services/substrate-mcp-gateway`
**Protocol:** MCP Streamable HTTP 2025-11-25 plus legacy SSE 2024-11-05

**Related:** [sdk.md](./sdk.md) · [architecture.md](../architecture/architecture.md) · [MCP_GATEWAY_STRATEGY.md](../architecture/mcp-gateway-strategy.md)

---

## Overview

The Substrate MCP Gateway exposes the governed Substrate runtime through MCP.
It is not a pure byte-forwarding layer: it owns transport authentication,
enterprise scope checks, credential-bound tenant propagation, session handling,
tool/resource registration, optional external federation, and explicitly
labelled synthetic Nexus fixtures. Substrate run, replay, counterfactual, and
approval tools call the `@szl/substrate` runtime; inventory, schema, fixture,
registry, and dynamic-tool paths have narrower contracts and must not be
described as traversing every Substrate policy stage.

---

## Gateway Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /mcp` | POST | Required except `tools/list` and `ping` | JSON-RPC 2.0 message endpoint |
| `GET /mcp/sse` | GET | Required | Legacy Server-Sent Events stream |
| `GET /mcp/health` | GET | Public | Health + capabilities |
| `GET /mcp/tools` | GET | Required | Tool inventory with schemas |
| `GET /mcp/resources` | GET | Required | Resource inventory |
| `GET /mcp/prompts` | GET | Required | Prompt template inventory |

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

Production mutations also require an authenticated tenant context. The
HTTP transport derives it from the authenticated request. The current stdio
transport has no equivalent authenticated tenant carrier, so production
run submission, replay, approval/rejection, registry mutation, delegation, and
dynamic tool calls over stdio fail closed with
`TENANT_CONTEXT_REQUIRED`. Treat production stdio mutation support as a HOLD
until an authenticated, credential-bound tenant transport is implemented;
read-only operations are unaffected.

---

## Tool Inventory

The descriptor currently defines 12 static tools; connected servers can add a
dynamic tool surface. Unknown/dynamic tools are classified as write operations
by default at the enterprise authorization boundary.

| Tool group | Access requirement | Runtime boundary |
|------------|--------------------|------------------|
| `substrate_get_run`, `substrate_list_approvals`, `substrate_list_workflows`, `search_available_servers` | `mcp:read` | Read-only gateway/runtime views |
| `substrate_approve`, `substrate_reject` | `mcp:approve` | Authenticated actor is authoritative; caller-selected actor labels are rejected |
| Run submission, replay, counterfactual, server enable/disable, delegation, unknown/dynamic tools | `mcp:write` | Tenant context required in production; execution depends on the named backend |

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

The HTTP gateway accepts:

1. **Bearer token** — `Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY>`  
   Required for protected HTTP routes. The credential is bound to
   `SUBSTRATE_GATEWAY_TENANT_ID`.
2. **Enterprise bearer token** — issued by the ID-JAG exchange and bound to the
   token's tenant, role, and exact space-delimited MCP scopes.
3. **No auth** — limited to the root/health endpoints, hash-gated proof lookup,
   token/revocation entrypoints with their own credentials, and JSON-RPC
   `tools/list`/`ping`.

Production startup fails before listen unless the gateway API key, gateway
tenant, and 64-hex signing key are all non-blank and valid. Development without
an API key remains an explicit local-only bypass.

### Authorization

Enterprise tokens are enforced at the gateway with `mcp:read`, `mcp:write`,
`mcp:approve`, or `mcp:admin`. Approval/rejection records use the authenticated
principal; a supplied compatibility `actor` field must match that principal.
Run tools then apply the runtime's policy/approval behavior. Dynamic external
tools have their own downstream enforcement boundary and are not evidence of a
Substrate policy evaluation.

### Rate Limits

| Caller Type | Limit |
|-------------|-------|
| Unauthenticated | Schema discovery endpoints only |
| Authenticated | IP/global and gateway request limits, plus downstream/runtime limits |

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

## Policy and Audit Boundary

Substrate run, replay, counterfactual, and approval handlers call the tracked
runtime primitives and emit gateway proof metadata. This statement does not
extend to schema reads, synthetic resources, registry discovery, or externally
federated tools. The current gateway proof WAL defaults to local `/tmp`; set
`PRAXIS_PROOF_WAL_PATH` to a persistent mounted path when restart retention is
required. A configured signing key makes Substrate evidence signatures stable
across processes; it does not by itself make local storage durable.

---

## Sentra MCP Traffic Gateway Integration Target

The repository contains a target configuration shape for a future Sentra
catalog registration. This local source is not a deployment receipt and does
not establish that a live Sentra instance currently routes, filters, or records
gateway traffic.

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
PORT=3700 SUBSTRATE_GATEWAY_API_KEY=<key> SUBSTRATE_GATEWAY_TENANT_ID=<tenant> SUBSTRATE_SIGNING_KEY=<64-hex-key> tsx services/substrate-mcp-gateway/src/index.ts

# stdio (for MCP host integration)
SUBSTRATE_GATEWAY_API_KEY=<key> SUBSTRATE_GATEWAY_TENANT_ID=<tenant> SUBSTRATE_SIGNING_KEY=<64-hex-key> tsx services/substrate-mcp-gateway/src/index.ts --stdio
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUBSTRATE_GATEWAY_API_KEY` | Yes (prod) | Bearer credential for protected HTTP operations |
| `SUBSTRATE_GATEWAY_TENANT_ID` | Yes (prod) | Non-secret tenant scope bound to the gateway API credential |
| `SUBSTRATE_PYTHON_WORKER_URL` | For Python stages | Internal Python worker endpoint |
| `SUBSTRATE_PYTHON_WORKER_API_KEY` | For Python stages | Bearer credential injected into the gateway/authority and worker; no default |
| `SUBSTRATE_PYTHON_WORKER_TENANT_ID` | Yes in prod for Python stages | Single tenant bound to the worker bearer credential; must match authenticated run context |
| `SUBSTRATE_SIGNING_KEY` | Yes (prod) | Exactly 64 hexadecimal characters (32 bytes) for restart-verifiable HMAC-signed evidence bundles |
| `PRAXIS_PROOF_WAL_PATH` | For durable gateway proof lookup | Persistent JSONL path; default `/tmp` is local and ephemeral |
| `PORT` | No | HTTP listen port (default: 3700) |
| `NODE_ENV` | No | `production` enables strict auth enforcement |

---

*Last updated: 2026-10-07. Source boundary: local candidate under `services/substrate-mcp-gateway/`; no hosted deployment is implied.*
