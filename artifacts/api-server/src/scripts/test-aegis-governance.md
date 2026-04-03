# Aegis Phase 3 Governance — Integration Test Scenarios

## Platform invariant

Aegis is a **shared-platform SOC** — all firestorm data belongs to tenant `"default"`.
`tenantId` is never accepted from request bodies or query params by unprivileged callers.
This document describes how to verify enforcement using curl or a REST client.

Set `BASE=http://localhost:3000` and authenticate as needed.

---

## 1. Decision Approval Role Gate

### 1a. Analyst role cannot approve (expect 403)
```bash
curl -s -X PUT "$BASE/api/firestorm/tradecraft/decisions/$DECISION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -d '{"action":"approve"}' | jq .code
# Expected: "INSUFFICIENT_ROLE"
```

### 1b. Ops role can approve (expect 200 + approvedBy from user identity)
```bash
curl -s -X PUT "$BASE/api/firestorm/tradecraft/decisions/$DECISION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPS_TOKEN" \
  -d '{"action":"approve"}' | jq '{reviewStatus, approvedBy}'
# Expected: { reviewStatus: "approved", approvedBy: "<user display name from auth>" }
```

### 1c. Generic patch cannot set approvedBy (field silently stripped)
```bash
curl -s -X PUT "$BASE/api/firestorm/tradecraft/decisions/$DECISION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPS_TOKEN" \
  -d '{"approvedBy":"injected","status":"active"}' | jq .approvedBy
# Expected: null or prior value — "injected" is never accepted
```

---

## 2. Cross-Tenant Decision Isolation

### 2a. GET by objectId for non-existent or wrong-tenant record (expect 404)
```bash
curl -s "$BASE/api/firestorm/tradecraft/decisions/obj-from-other-tenant" \
  -H "Authorization: Bearer $ANALYST_TOKEN" | jq .status
# Expected: 404 — tenant predicate (WHERE tenant_id = 'default') excludes other-tenant records
```

### 2b. POST cannot inject tenant (body tenantId ignored)
```bash
curl -s -X POST "$BASE/api/firestorm/tradecraft/decisions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPS_TOKEN" \
  -d '{"decisionType":"TriageDecision","summary":"Test decision injection","recommendedAction":"monitor","tenantId":"attacker"}' | jq .tenantId
# Expected: "default" — user-supplied tenantId is discarded; server always uses "default"
```

---

## 3. Tool Execution Approval-Required Gating

### 3a. High-risk tool blocked in approval_required mode (when not yet approved)
```bash
# Set AI_EXECUTION_MODE=approval_required on server, then:
curl -s -X POST "$BASE/api/ai/tools/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANALYST_TOKEN" \
  -d '{"toolName":"containment_step","arguments":{"targetId":"host-123","action":"isolate"}}' | jq '{blocked, approvalRequired}'
# Expected: { blocked: true, approvalRequired: true }
```

### 3b. Same tool executes in approved_execute mode
```bash
# Set AI_EXECUTION_MODE=approved_execute on server, then:
curl -s -X POST "$BASE/api/ai/tools/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPS_TOKEN" \
  -d '{"toolName":"containment_step","arguments":{"targetId":"host-123","action":"isolate"}}' | jq .success
# Expected: true — tool executes and writes audit row
```

### 3c. Cross-tenant tool argument blocked
```bash
# The tenantId argument in the tool call must match context tenant (always "default")
curl -s -X POST "$BASE/api/ai/tools/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPS_TOKEN" \
  -d '{"toolName":"create_case","arguments":{"title":"test","tenantId":"attacker"}}' | jq '{blocked, crossTenantViolation}'
# Expected: { blocked: true, crossTenantViolation: true }
```

---

## 4. Propose-Only Mode — All Write Tools Blocked

```bash
# Set AI_EXECUTION_MODE=propose_only on server
WRITE_TOOLS=(create_case update_case close_case create_action_item close_action assign_owner open_workflow close_workflow reopen_workflow containment_step recovery_step notify_team route_for_approval generate_executive_brief update_trust_posture)
for tool in "${WRITE_TOOLS[@]}"; do
  result=$(curl -s -X POST "$BASE/api/ai/tools/execute" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPS_TOKEN" \
    -d "{\"toolName\":\"$tool\",\"arguments\":{}}" | jq -r '.output.blocked')
  echo "$tool: blocked=$result"
done
# Expected: all 15 tools show blocked=true
```

---

## 5. Audit Log Access Control

### 5a. Non-admin cannot specify tenantId (always scoped to "default")
```bash
curl -s "$BASE/api/firestorm/tool-audit-log?tenantId=attacker" \
  -H "Authorization: Bearer $ANALYST_TOKEN" | jq '[.[].tenantId] | unique'
# Expected: ["default"] — attacker tenant rows not returned
```

### 5b. Admin can specify tenantId for cross-tenant audit review
```bash
curl -s "$BASE/api/firestorm/tool-audit-log?tenantId=other-org" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[0].tenantId'
# Expected: "other-org" if records exist (authorized cross-tenant read)
```

### 5c. Every tool execution writes an audit row
```bash
# Execute any tool in approved_execute mode, then verify audit row exists
curl -s "$BASE/api/firestorm/tool-audit-log?limit=1" \
  -H "Authorization: Bearer $OPS_TOKEN" | jq '.[0] | {toolName, calledBy, result}'
# Expected: row with calledBy = authenticated user display name (not request body value)
```
