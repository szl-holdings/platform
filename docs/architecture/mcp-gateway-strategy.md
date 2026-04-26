# MCP Gateway Strategy — SZL Holdings Platform

**Version:** 2.0 · **Date:** April 2026
**Audience:** Engineers, platform architects, security reviewers, enterprise evaluators, integration teams

**Related:** [AI_EVALUATION_STRATEGY.md](ai-evaluation-strategy.md) · [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) · [TENANCY-MODEL.md](tenancy-model.md) · [API-SPEC.md](api-spec.md)

---

## Overview

The SZL Holdings MCP (Model Context Protocol) gateway exposes platform capabilities as a structured, scoped, auditable tool interface for agents and operator assistants. It allows AI systems — internal (NuroMesh orchestrator, Alloy agents) and external (Claude, GPT-4, operator-built assistants) — to safely interact with the platform without access to raw APIs.

The gateway is not a raw API proxy. It exposes **fewer, better, goal-specific tools** — each one scoped, validated, tenant-isolated, and audit-logged.

**Implementation:** `artifacts/api-server/src/routes/mcp.ts`
**Protocol:** [Model Context Protocol 2025-03-26](https://spec.modelcontextprotocol.io/) via `@modelcontextprotocol/sdk@1.29.0`
**Transport:** StreamableHTTP (`POST /api/mcp`) + SSE fallback (`GET /api/mcp/sse`)

---

## SDK Foundation (NEXUS Evolution — v2)

As of April 2026, all MCP surfaces have been migrated from a hand-rolled JSON-RPC implementation to the official `@modelcontextprotocol/sdk@1.29.0` TypeScript SDK as the protocol foundation.

### What Changed

| Surface | Before | After |
|---------|--------|-------|
| `artifacts/api-server` | Custom JSON-RPC dispatch | `NexusMcpServer` + `StreamableHTTPServerTransport` |
| `services/substrate-mcp-gateway` | Custom HTTP/stdio parsing | SDK `StreamableHTTPServerTransport` + `StdioServerTransport` |
| `packages/tool-mesh` | Raw JSON-RPC bridge | `NexusMcpServer` via `toNexusMcpServer()` |
| `lib/mcp-client` | Raw fetch + JSON-RPC | `SdkMcpClientAdapter` using `StreamableHTTPClientTransport` |

### NexusMcpServer Wrapper (`packages/nexus-mcp`)

All SZL MCP surfaces instantiate `NexusMcpServer` instead of the raw SDK `McpServer`. The wrapper is transparent to downstream consumers while injecting governance at every interaction boundary:

- **Guardian policy evaluation** — every tool call checked against `policyEvaluator` before dispatch
- **Proof chain audit** — every tool invocation, sampling call, elicitation, resource read, and app render written to the immutable proof chain
- **Tenant isolation** — `TenantContext` propagated into every handler; `tenantId` required
- **Role enforcement** — `roleRequirements` checked per-tool with role hierarchy resolution
- **Sampling** — `createSample()` wraps SDK `server.createMessage()` with policy + audit
- **Elicitation** — `elicitInput()` wraps SDK `server.elicitInput()` with policy + audit
- **Tasks** — `createTask()` / `updateTaskProgress()` / `finalizeTask()` with MCP progress notifications
- **Apps** — `registerApp()` / `renderApp()` for inline HTML micro-dashboards
- **Instructions** — `setInstructions()` / `setInstruction()` for dynamic system prompt fragments
- **Discovery** — `notifyListChanged()` for tools/resources/prompts list-changed notifications
- **Roots** — `addRoot()` / `getRoots()` for workspace root management

---

## Design Principles

1. **Minimal surface** — Only expose what agents actually need. No raw CRUD access.
2. **Tenant isolation** — Every tool invocation is scoped to the authenticated tenant's `org_id`.
3. **Role awareness** — Tools enforce the same RBAC model as the REST API. Agent identity is mapped to user roles.
4. **Approval awareness** — High-risk tool calls that trigger workflow actions require human approval before execution. The tool returns a `pending_approval` status, not an error.
5. **Audit logging** — Every tool invocation is recorded in the immutable audit log via `logActivity()`.
6. **Goal-specific naming** — Tools are named for intent (`aegis_triage_incident`), not for resource access (`POST /api/firestorm/incidents`).
7. **Safe defaults** — Tools return `propose_only` decisions by default. Execution requires explicit approval or an `approved_execute` decision.
8. **Immutable history** — Tools cannot modify audit trail or proof chain entries. All such tools are read-only.

---

## Gateway Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /api/mcp` | POST | Optional (public tool subset) | JSON-RPC 2.0 message endpoint |
| `GET /api/mcp/sse` | GET | Optional | Server-Sent Events stream for MCP clients |
| `GET /api/mcp/health` | GET | Public | Gateway health and capabilities |
| `GET /api/mcp/tools` | GET | Optional | Tool inventory with schema |
| `GET /api/mcp/resources` | GET | Optional | Resource inventory |
| `GET /api/mcp/prompts` | GET | Optional | Prompt template inventory |

CSRF exemption: `/api/mcp` and `/api/mcp/*` are in the CSRF exempt list (verified via JWT/session instead).

---

## Tool Inventory

Tools are organized into three categories: **Domain**, **Platform**, and **Data**.

### Domain Tools

These tool names match `DOMAIN_TOOLS` in `artifacts/api-server/src/routes/mcp.ts`.

| Tool Name | Domain | Description | Risk Level | Approval Required |
|-----------|--------|-------------|------------|------------------|
| `vessels_fleet_status` | Vessels | Current fleet positions, status, and AIS data | Low | No |
| `vessels_weather_risk` | Vessels | Weather risk assessment for vessel routes | Low | No |
| `firestorm_threat_scan` | Aegis | Scan for active threats and IOCs | Medium | Review |
| `firestorm_compliance_check` | Aegis | Check tenant assets against compliance frameworks | Low | No |
| `terra_property_search` | Terra | Search distressed properties by criteria | Low | No |
| `terra_market_signals` | Terra | Retrieve real estate market signal aggregates | Low | No |
| `lyte_health_check` | Lyte | Business observability health check for the tenant | Low | No |
| `lyte_executive_summary` | Lyte | Executive summary of key business metrics | Low | No |
| `inca_experiment_status` | INCA | Retrieve active experiment and research status | Low | No |

### Platform Tools

These tool names match `PLATFORM_TOOLS` in `artifacts/api-server/src/routes/mcp.ts`.

| Tool Name | Domain | Description | Risk Level | Approval Required |
|-----------|--------|-------------|------------|------------------|
| `alloy_launch_workflow` | Alloy | Start a named workflow with parameters | Medium | Review |
| `alloy_workflow_status` | Alloy | Check status of a running workflow by ID | Low | No |
| `alloy_create_artifact` | Alloy | Create a structured artifact from workflow output | Medium | Review |
| `alloy_research` | Alloy | Invoke Alloy's multi-domain research agent | Medium | Review |
| `alloy_decision_status` | Alloy | Retrieve status of an Alloy decision record | Low | No |
| `alloy_approve_decision` | Alloy | Submit approval decision for a pending action | High | Operator+ |
| `alloy_skill_list` | Alloy | List available registered skills | Low | No |
| `alloy_skill_invoke` | Alloy | Invoke a skill by slug | High | Admin only |
| `connector_hub_discover` | Platform | Discover available connector integrations | Low | No |
| `connector_hub_execute` | Platform | Execute a connector action | High | Admin only |
| `connector_hub_health` | Platform | Check connector health status | Low | No |

### Data Tools

These tool names match `DATA_TOOLS` in `artifacts/api-server/src/routes/mcp.ts`, plus four MCP resource items.

| Tool Name | Domain | Description | Risk Level | Approval Required |
|-----------|--------|-------------|------------|------------------|
| `query_holdings_ecosystem` | Global | Query SZL Holdings ecosystem metrics | Low | No |
| `query_audit_log` | Global | Query tenant audit log with filters | Low | Analyst+ |
| `query_notifications` | Global | Retrieve notification feed for the tenant | Low | No |
| `research_brief` | Global | Generate a research brief on any topic | Low | No |
| `threat_assessment` | Global | Full threat assessment for an asset or system | Medium | Review |
| `property_analysis` | Global | Structured real estate property analysis | Low | No |
| `fleet_report` | Global | Comprehensive maritime fleet report | Low | No |
| `executive_digest` | Global | Cross-domain executive intelligence digest | Low | No |

#### MCP Resources (read-only context objects)

| Resource Name | Description |
|---------------|-------------|
| `Platform Entity Schema` | JSON schema of all core platform entities |
| `Domain Agent System Prompts` | System prompts for all registered domain agents |
| `Skill Registry Catalog` | Full catalog of available Alloy skills |
| `Workflow Templates` | Library of named workflow templates |

---

## Security Model

### Authentication

The MCP gateway accepts:
1. **Session cookie** (`sid`) — same as the REST API
2. **Bearer token** (`Authorization: Bearer <token>`) — opaque session token from PostgreSQL
3. **No auth** — only for the public tool subset (read-only tools that do not require tenant scope)

Tools that require tenant scope will return `PERMISSION_DENIED` if called without valid authentication.

### Tenant Isolation

Every authenticated tool call is scoped to the caller's `org_id`. The gateway:
1. Extracts `org_id` from `req.user.orgs[0].orgId`
2. Passes it as a filter to all database queries
3. Returns only records belonging to the caller's tenant
4. Prevents tools from accepting `org_id` as a parameter (removes the vector for cross-tenant access)

Global admins (`super_admin`) may optionally pass `orgId` to scope to a specific tenant, but this access is additionally logged with elevated audit detail.

### Role Enforcement

Tool execution follows the same RBAC matrix as the REST API:

| Role | Available Tools |
|------|----------------|
| Unauthenticated | Public read-only tools only |
| `viewer` | All read-only domain tools |
| `analyst` | Read + analysis tools |
| `operator` | Read + write + workflow launch tools |
| `approver` | + Approval actions |
| `admin` / `super_admin` | All tools including `admin_only` class |

Tools with `approvalClass: "admin_only"` (e.g., `alloy_skill_invoke`) require `admin` or `super_admin` role and return `PERMISSION_DENIED` otherwise.

### High-Risk Action Guard

A built-in guard in the Covenant Policy Engine (`lib/covenant-policy/src/engine.ts`) blocks the following action names unless the caller has `approver`, `tenant_admin`, or `super_admin` role:

- `deploy`, `delete_tenant`, `export_all`, `modify_policy`, `escalate_privilege`
- `bypass_sandbox`, `force_approve`, `purge_data`, `external_transfer`, `modify_audit_log`

This guard fires on tool invocations that route to high-risk Alloy workflow actions.

### Approval Awareness

Tools that trigger consequential actions follow the approval flow:

1. Tool is invoked — agent receives `status: "pending_approval"` with a `workflowRunId`
2. Human approver sees the pending action in the Alloy approvals queue
3. On approval: action executes, result available via `alloy_get_decision`
4. On rejection: `status: "rejected"` returned

The agent does not re-invoke the tool after approval — it polls `alloy_get_approval_status` or waits for a webhook notification.

### Audit Logging

Every tool invocation is recorded in the audit trail via `logActivity()`:

```json
{
  "action": "mcp_tool_invoke",
  "resource": "mcp_tool",
  "resourceId": "<tool_name>",
  "metadata": {
    "toolName": "<tool_name>",
    "args": { ... },
    "latencyMs": 123,
    "resultLength": 456
  }
}
```

Audit entries are immutable (append-only, hash-chained). They include: timestamp, user ID, org ID, tool name, arguments, result summary, and latency.

---

## Tenant-Aware Tool Design

Tools are designed so that tenant context is never a parameter the caller can manipulate:

```
❌ WRONG: { "tool": "vessels_fleet_status", "params": { "orgId": 999 } }
✅ RIGHT: { "tool": "vessels_fleet_status", "params": { "vesselType": "tanker" } }
          -- org_id is injected from the authenticated session, not from params
```

The exception is super-admin tools, where `orgId` is an explicit parameter gated behind `adminGuard` role.

---

## Rate Limiting

| Caller Type | Limit |
|-------------|-------|
| Unauthenticated | 10 requests/min per IP |
| Authenticated (operator) | 120 requests/min per user |
| Authenticated (admin) | 300 requests/min per user |
| Batch (array request body) | Max 20 requests per batch |

Rate limiting is applied by the `perUserApiSlidingLimiter` middleware mounted at `/api/mcp`.

---

## Error Handling

MCP errors follow JSON-RPC 2.0 error codes:

| Code | Name | Description |
|------|------|-------------|
| `-32700` | `PARSE_ERROR` | Invalid JSON |
| `-32600` | `INVALID_REQUEST` | Malformed request |
| `-32601` | `METHOD_NOT_FOUND` | Unknown method |
| `-32602` | `INVALID_PARAMS` | Missing or invalid parameters |
| `-32603` | `INTERNAL_ERROR` | Server-side error |
| `-32000` | `PERMISSION_DENIED` | Auth or role check failed |
| `-32001` | `NOT_FOUND` | Requested resource not found |
| `-32002` | `APPROVAL_REQUIRED` | Action queued for approval |

---

## SSE Transport

For long-running agent sessions, the SSE endpoint (`GET /api/mcp/sse`) establishes a persistent connection that:
1. Sends an `$/ready` event with server info and capabilities
2. Sends `$/ping` keepalives every 30 seconds
3. Clients send requests to `POST /api/mcp` (the SSE stream is receive-only)

The SSE endpoint returns the `POST /api/mcp` URL in the `endpoint` field of the ready event.

---

## Adding New Tools

To add a new tool to the MCP gateway:

1. Define the `McpTool` descriptor with name, description, and `inputSchema`
2. Add handler logic in `handleToolCall()` in `artifacts/api-server/src/routes/mcp.ts`
3. Apply tenant scope: use `getUserOrgIds(user)` and filter all DB queries by org
4. Add role check: call `isGlobalAdmin(user)` or check `user.roles` before sensitive operations
5. Call `writeAuditLog()` before returning the result
6. Add to the appropriate tool category array (`DOMAIN_TOOLS`, `PLATFORM_TOOLS`, `DATA_TOOLS`)
7. Update this document and `API-SPEC.md` with the new tool

---

## MCP Gateway vs REST API

| Characteristic | MCP Gateway | REST API |
|----------------|-------------|----------|
| Caller | AI agents, operator assistants | Web/mobile frontends, M2M |
| Interface | Goal-oriented tools | Resource-oriented endpoints |
| Granularity | Domain operations | CRUD |
| Response format | JSON (tool result) | JSON (REST response) |
| Approval flow | Built-in `pending_approval` status | External |
| Tenant scope | Automatically injected | Caller-provided |
| Tool count | ~25 curated tools | 2,300+ endpoints |
| Schema discovery | `tools/list` method | OpenAPI 3.1 |
| Auth | Session cookie or Bearer | Session cookie or Bearer |

---

## Current Limitations

- Tool results are not streamed (full response required before returning)
- No per-tool rate limiting (global per-user limit only)
- No tool versioning (all tools are at `v1` implicitly)
- SSE stream does not push tool execution results (polling required)

These limitations are tracked in `KNOWN-GAPS.md`.

---

*Last updated: 2026-04-16. Re-verify against `artifacts/api-server/src/routes/mcp.ts` and `lib/covenant-policy/src/engine.ts` after gateway or policy changes.*
