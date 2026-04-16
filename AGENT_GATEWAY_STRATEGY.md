# Agent Gateway Strategy — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Platform architects, agent authors, integration partners, enterprise evaluators

**Related:** [MCP_GATEWAY_STRATEGY.md](MCP_GATEWAY_STRATEGY.md) · [AI_RUNTIME_OBSERVABILITY.md](AI_RUNTIME_OBSERVABILITY.md) · [GUARDRAILS_MODEL.md](GUARDRAILS_MODEL.md) · [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) · [TENANCY-MODEL.md](TENANCY-MODEL.md) · [API-SPEC.md](API-SPEC.md)

---

## Two gateways, two jobs

The platform separates two responsibilities that are often conflated in AI products:

| Gateway | Purpose | Implementation |
|---------|---------|----------------|
| **AI Gateway (model router)** | Picks the right LLM, handles retries, fallbacks, cost/latency telemetry | `artifacts/api-server/src/lib/ai-gateway.ts` |
| **Agent Gateway (tool gateway)** | Governs what agents may do on behalf of a tenant — narrow, scoped, auditable tools | `artifacts/api-server/src/routes/mcp.ts` (MCP protocol) |

This document covers the **Agent Gateway** — the governed tool surface. For model routing, see `ai-gateway.ts` inline docs.

The Agent Gateway is **not** a raw API proxy. Agents cannot perform arbitrary CRUD. They can only call a hand-curated inventory of tools that map to business-meaningful verbs, each one tenant-scoped, role-gated, approval-aware, and fully audit-logged.

---

## Design principles

1. **Narrow surface.** Agents see goal-shaped tools (`aegis_triage_incident`, `terra_run_deal_simulation`), not resource-shaped HTTP routes. The inventory is deliberately small.
2. **Safe by default.** Most tools return `propose_only` decisions. Execution requires an explicit `approved_execute` verdict or approval-workflow completion.
3. **Tenant-isolated.** Every call is scoped to the caller's `orgs[0].orgId`. There is no "global" fallback for data reads.
4. **Role-aware.** Tool-level RBAC mirrors the REST API RBAC. See [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md).
5. **Approval-aware.** Tools that trigger workflow side-effects hit the same Covenant Policy engine as the REST API. Denials return `policy_denied`; gated tools return `pending_approval` and surface in the review queue.
6. **Auditable.** Every invocation is logged via `logActivity()` and captured as an `AITrace`. See [AI_RUNTIME_OBSERVABILITY.md](AI_RUNTIME_OBSERVABILITY.md).
7. **Immutable history.** No tool can mutate the audit trail, Proof Chain, or Outcome Graph.

---

## Scoped tool inventory

Eight categories cover the Phase 5–6 target surface for governed agents. Current tool names may vary slightly — the canonical list lives in [MCP_GATEWAY_STRATEGY.md § Tool Inventory](MCP_GATEWAY_STRATEGY.md#tool-inventory).

| Category | Purpose | Read / Write | Typical role |
|----------|---------|--------------|-------------|
| Query decision records | Retrieve past decisions for a workflow, entity, or recommendation | Read | `analyst`+ |
| Inspect proof | Fetch the Proof Chain entry behind any decision | Read | `analyst`+ |
| Inspect policy state | Resolve which policies apply to a proposed action and what verdict they would give | Read | `analyst`+ |
| Run simulation | Execute a sandboxed scenario against the simulation engine — never mutates reality | Read-only | `operator`+ |
| Request approval | Queue an approval workflow for a proposed action | Write (proposing) | `operator`+ |
| Trigger permitted workflows | Launch an approved workflow — only when the workflow is on the permit list for the role + org | Write | `operator`+ (approval-gated) |
| Retrieve tenant-scoped state | Read entities, documents, or metrics scoped to the caller's org | Read | `analyst`+ |
| Retrieve outcome history | Pull realised outcomes + prediction errors from the Outcome Graph | Read | `analyst`+ |

None of these expose cross-tenant data. None of them bypass the Covenant Policy engine.

---

## Call lifecycle

```
Agent tool invocation
        │
        ▼
[Auth] Resolve user → orgs[0].orgId, roles
        │
        ▼
[RBAC] Tool requires role? If not held → mcp_tool_denied {reason: insufficient_role}
        │
        ▼
[Tenant] Tool's declared scope vs. caller's orgId — mismatch → mcp_tool_denied {reason: tenant_scope_mismatch}
        │
        ▼
[Policy] If write-class tool: run through Covenant Policy engine
            │
            ├─ deny            → policy_denied (Proof Chain entry written)
            ├─ require_approval → pending_approval (mcp_approval_queued)
            └─ allow           → continue
        │
        ▼
[Execute] Invoke tool handler
        │
        ▼
[Capture] captureTrace() → AITrace → AI Ops dashboard + review queue
[Audit]   logActivity() → immutable audit log
[Analytics] mcp_tool_invoked event emitted
        │
        ▼
Return structured result to caller
```

If any step fails closed, the agent receives a structured error — it cannot proceed via silent fallback.

---

## Tenant + role enforcement

The gateway reads `req.user` via the standard `authMiddleware`. Anonymous callers may only access a small read-only subset (health, tool inventory schemas). All data-touching tools require an authenticated session.

`orgId` is resolved via the canonical path:

```ts
const orgId = req.user?.orgs?.[0]?.orgId ?? null;
```

There is no ambient or impersonation shortcut. Impersonation (`admin` role only) requires an explicit session switch and is itself audit-logged.

Roles follow the canonical role ladder (`user` < `analyst` < `operator` < `executor` < `admin` < `super_admin`). Tool-level role requirements are declared in the tool registration and validated before handler dispatch.

---

## Approval gating

Tools flagged `requires_approval: true` return:

```jsonc
{
  "status": "pending_approval",
  "approvalId": "apr-...",
  "workflowRunId": "wfr-...",
  "reason": "policy: high_value_trade_approval",
  "approvers": ["role:executor", "role:admin"],
  "eta_sla_hours": 4
}
```

The caller must poll the approval status or subscribe to the workflow-run SSE channel. On approval, the tool may be re-invoked with `approvalId` to complete execution.

Analytics events: `mcp_approval_queued` at pend time, `approval_cycle_completed` on verdict, `approval_escalated` if bounced.

---

## Observability contract

Every tool call emits:

1. `mcp_tool_invoked { tool_name, domain, caller_role, org_id (hashed), latency_ms, result_status }`
2. An `AITrace` (searchable via `GET /api/ai/ops/traces`)
3. An immutable audit-log row (`activity_log`)
4. On denial: `mcp_tool_denied { tool_name, caller_role, deny_reason }`
5. On approval gating: `mcp_approval_queued`

Guardrail firings during tool invocation are covered in [GUARDRAILS_MODEL.md § 4. Tool-gateway guardrails](GUARDRAILS_MODEL.md#4-tool-gateway-guardrails-mcp--agent-gateway).

---

## What the Agent Gateway is not

- **Not a general-purpose HTTP proxy.** No `GET /api/anything` passthrough.
- **Not a long-lived agent runtime.** The gateway is stateless per-call; agent memory is the agent's own concern.
- **Not a bypass for policy.** Tools run the same Covenant Policy engine as REST writes.
- **Not a cross-tenant oracle.** Global admins must use a separate admin surface; no agent tool grants cross-tenant visibility.

---

## Evolution

The tool inventory grows only through explicit additions in `routes/mcp.ts` plus documentation in [MCP_GATEWAY_STRATEGY.md](MCP_GATEWAY_STRATEGY.md) and [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md). New tools must:

1. Declare role + tenant scope
2. Declare approval flag (`requires_approval: boolean`)
3. Emit `mcp_tool_invoked` and `AITrace`
4. Have an offline eval hook if the output is interpretive (not a pure pass-through read)
5. Be listed in the `GET /api/mcp/tools` inventory with a full JSON Schema

---

*Last verified against source code: 2026-04-16.*
