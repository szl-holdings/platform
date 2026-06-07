# Aegis Tenant Isolation — Verification Guide

## Platform Model

Aegis is a **shared-platform SOC** — all firestorm schema data belongs to a single
platform tenant (`tenantId = "default"`). There are no per-customer tenants in the
current schema; row-level access is partitioned by permission class and owner assignment.

The tenant isolation controls below prevent IDOR-style attacks where an authenticated
user could mutate records belonging to a conceptually different tenant if the platform
were extended to multi-tenant operation. Hardcoding `"default"` ensures correctness
while making the enforcement boundary explicit and testable.

---

## Enforced Boundaries

### 1. Decision Read + Write (All /api/firestorm/tradecraft/decisions routes)

**Enforcement:**
```sql
-- LIST:
WHERE tenant_id = 'default' [AND caseId = ...] [AND ...]
-- GET by objectId:
WHERE object_id = :objectId AND tenant_id = 'default'
-- PUT approve/reject:
WHERE object_id = :objectId AND tenant_id = 'default'
-- PUT generic patch:
WHERE object_id = :objectId AND tenant_id = 'default'
```

- All four CRUD paths (list, get, approve/reject, generic patch) include `tenant_id = 'default'`.
- Role check: `admin`, `super_admin`, or `ops` role required for `action: approve|reject`.
- Reviewer identity derived from `req.user.displayName` — not from request body.
- Approval lifecycle fields (`approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`, `rejectionReason`) are omitted from the generic PATCH Zod schema; they can only be mutated via the gated action path.

**Test scenarios:**
1. `PATCH /decisions/:id { action: "approve" }` as `analyst` role → expect 403
2. `PATCH /decisions/:id { action: "approve" }` as `ops` role → expect 200, `approvedBy` = user display name
3. `PATCH /decisions/:id { approvedBy: "attacker" }` via generic path → field omitted from schema (Zod rejects the key)
4. Cross-tenant attempt: `PATCH /decisions/:otherId` where `otherId` belongs to a different tenant → 404 (tenant predicate prevents match)
5. `GET /decisions?caseId=x` → only rows with `tenant_id = 'default'` returned

### 2. Tool Audit Log (GET /api/firestorm/tool-audit-log)

**Enforcement:**
- Non-admin callers: always filtered to `tenantId = "default"` — user cannot specify a different tenant via query param.
- Admin/super_admin callers: may specify `?tenantId=<value>` for cross-tenant audit review.

**Test scenarios:**
1. `GET /tool-audit-log?tenantId=attacker-tenant` as `analyst` → rows filtered to `"default"`, `attacker-tenant` rows not returned.
2. `GET /tool-audit-log?tenantId=other-tenant` as `super_admin` → rows from `other-tenant` returned (authorized cross-tenant access).

### 3. Tool Execution (POST /api/ai/tools/execute)

**Enforcement:**
- `calledBy` is derived from authenticated user identity (`req.user.displayName`), not from request body.
- `context.tenantId = "default"` is passed to `executeToolCall()`.
- `checkTenantBoundary()` in alloy-tools.ts blocks any tool invocation where `args.tenantId` differs from `context.tenantId`.
- Every tool call writes a durable `firestorm_tool_audit_log` row with `result: "blocked"` and `crossTenantViolation: true` on boundary violations.

**Test scenarios:**
1. `POST /ai/tools/execute { toolName: "create_case", arguments: { tenantId: "other" } }` → blocked, audit row written
2. `POST /ai/tools/execute { toolName: "containment_step", ... }` in `propose_only` mode → blocked (policy gate), audit row written
3. `POST /ai/tools/execute { toolName: "containment_step", ... }` in `approved_execute` mode → executed, audit row written with `result: "success"`

---

## Execution Mode Verification

| Mode | Effect | Blocked tools |
|------|--------|--------------|
| `observe_only` | Read-only, no state changes | All write-capable tools (15 blocked) |
| `propose_only` | Propose only; all writes blocked | All write-capable tools (15 blocked): create_case, update_case, close_case, create_action_item, close_action, assign_owner, open_workflow, close_workflow, reopen_workflow, containment_step, recovery_step, notify_team, route_for_approval, generate_executive_brief, update_trust_posture |
| `approval_required` | High-risk tools queue for approval | containment_step, recovery_step, close_case, update_case, assign_owner |
| `approved_execute` | All tools execute with full audit | None blocked |

Set `AI_EXECUTION_MODE` env var on the API server to change mode.

---

## Migration Note

If Aegis is extended to true multi-tenant operation, the enforcement pattern is:
1. Derive `callerTenantId` from `req.user.orgs[0].orgSlug` or equivalent
2. Add `AND tenant_id = :callerTenantId` to all decision/case/finding WHERE clauses
3. Pass `{ tenantId: callerTenantId }` to `executeToolCall()`
4. The existing `checkTenantBoundary()` and audit log scoping will work correctly without further changes
