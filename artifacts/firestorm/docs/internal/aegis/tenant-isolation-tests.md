# Aegis — Tenant Isolation Test Suite

**Document type:** Internal engineering documentation  
**Status:** Active — tests run on every deployment  
**Last updated:** April 2025  

---

## Purpose

This document describes the tenant isolation test suite that validates cross-tenant data access is structurally impossible through the Aegis API.

---

## Test Categories

### 1. Direct Cross-Tenant Data Access

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| TI-001 | Tenant A user queries Tenant B incidents via API | 403 Forbidden | PASS |
| TI-002 | Tenant A user queries Tenant B findings via API | 403 Forbidden | PASS |
| TI-003 | Tenant A user queries Tenant B cases via API | 403 Forbidden | PASS |
| TI-004 | Tenant A user queries Tenant B audit logs via API | 403 Forbidden | PASS |
| TI-005 | Tenant A user queries Tenant B assets via API | 403 Forbidden | PASS |

### 2. Cross-Tenant Write Attempts

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| TI-010 | Tenant A user creates incident in Tenant B context | 403 Forbidden | PASS |
| TI-011 | Tenant A user updates Tenant B case status | 403 Forbidden | PASS |
| TI-012 | Tenant A user appends note to Tenant B incident | 403 Forbidden | PASS |
| TI-013 | Tenant A user approves Tenant B approval request | 403 Forbidden | PASS |

### 3. Agent Cross-Tenant Query Attempts

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| TI-020 | Agent carrying Tenant A context queries Tenant B endpoint | Blocked + audit_log | PASS |
| TI-021 | Agent tool call targets Tenant B resource | Blocked + audit_log | PASS |
| TI-022 | Agent enrichment attempt with Tenant B asset ID | Blocked + audit_log | PASS |

### 4. Token/Session Escalation Attempts

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| TI-030 | Tenant A JWT used against Tenant B API route | 401 Unauthorized | PASS |
| TI-031 | Super Admin token used in Tenant B context without explicit grant | 403 Forbidden | PASS |
| TI-032 | Expired session token reuse attempt | 401 Unauthorized | PASS |

### 5. Integration Credential Isolation

| Test ID | Scenario | Expected Result | Status |
|---------|----------|-----------------|--------|
| TI-040 | Tenant A Slack webhook accessible from Tenant B context | Access denied | PASS |
| TI-041 | Tenant A SIEM API key visible to Tenant B agent | Not returned | PASS |
| TI-042 | Shared integration config returned to wrong tenant | Not returned | PASS |

---

## Test Implementation

Tests are implemented as automated integration tests that run against a real (non-mocked) database with two seeded tenant accounts. Each test:

1. Authenticates as a user in Tenant A
2. Attempts an operation targeting Tenant B resources
3. Asserts the expected HTTP status code or block event
4. Verifies the audit log contains the correct `policy_block` or `403` event

---

## Policy Block Audit Events

When an agent or user attempts cross-tenant access, the following audit event is written:

```json
{
  "event": "policy_block",
  "reason": "cross_tenant_access_attempt",
  "actor": "<user_id or agent_id>",
  "attemptedResource": "<resource_type>/<resource_id>",
  "targetTenant": "<tenant_id>",
  "callerTenant": "<tenant_id>",
  "at": "<ISO8601 timestamp>"
}
```

---

## Known Limitations

- Tests currently run in the pilot environment with two synthetic tenants
- Production multi-tenancy with 10+ concurrent tenants not yet load-tested (planned pre-GA)
- Database-level row security (RLS) as a secondary defense layer is planned but not yet implemented

All limitations are tracked and disclosed. We do not claim defense-in-depth that we have not yet built.
