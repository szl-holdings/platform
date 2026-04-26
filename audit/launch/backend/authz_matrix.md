# Authorization Matrix
**Phase:** 3  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## RBAC Role Hierarchy (11 Roles)

| Role | Level | Access |
|---|---|---|
| `super_admin` | 1 (highest) | Full platform access; can modify roles |
| `platform_admin` | 2 | All tenants; no role modification |
| `tenant_admin` | 3 | Full tenant access |
| `executive` | 4 | Read-only across all domains; executive dashboards |
| `operator` | 5 | Full domain access within tenant |
| `analyst` | 6 | Read + recommendations; no writes to governed records |
| `approver` | 7 | Approve/reject governed actions |
| `reviewer` | 8 | Read and comment on decisions |
| `auditor` | 9 | Read-only audit trail access |
| `viewer` | 10 | Read-only; no sensitive data |
| `guest` | 11 (lowest) | Public-facing pages only |

---

## Route-Level Permission Map

| Route Group | Required Role | Notes |
|---|---|---|
| `GET /api/health` | None | Public health check |
| `GET /api/auth/me` | Any session | Self-identification |
| `POST /api/auth/logout` | Any session | Session destruction |
| `GET /api/decisions` | viewer+ | Tenant-scoped |
| `POST /api/decisions` | operator+ | Governed write |
| `POST /api/approvals/:id/approve` | approver+ | Human approval gate |
| `GET /api/signals` | analyst+ | Signal feed |
| `GET /api/recommendations` | analyst+ | Decision recommendations |
| `POST /api/simulations` | analyst+ | Monte Carlo run |
| `GET /api/proof-chain` | auditor+ | Immutable audit trail |
| `GET /api/workflows` | operator+ | Workflow list |
| `POST /api/workflows` | operator+ | Workflow creation |
| `DELETE /api/workflows/:id` | tenant_admin+ | Deletion |
| `POST /api/agents/:id/run` | operator+ | Agent execution |
| `GET /api/agent-runs` | analyst+ | Run history |
| `GET /api/policies` | reviewer+ | Policy registry |
| `POST /api/policies` | tenant_admin+ | Policy creation |
| `PUT /api/policies/:id` | tenant_admin+ | Policy update |
| `DELETE /api/policies/:id` | platform_admin+ | Policy deletion |
| `GET /api/users` | tenant_admin+ | User management |
| `POST /api/users` | tenant_admin+ | User creation |
| `DELETE /api/users/:id` | platform_admin+ | User deletion |
| `GET /api/admin/*` | platform_admin+ | Admin operations |
| `POST /api/admin/*` | super_admin | Admin mutations |
| `GET /api/billing/*` | tenant_admin+ | Billing read |
| `POST /api/billing/*` | tenant_admin+ | Billing write |
| `POST /api/ai/complete` | operator+ | LLM access |
| `/api/graphql` | Session required (varies by query) | Per-field auth |

---

## Multi-Tenant Scoping

| Enforcement Point | Status | Notes |
|---|---|---|
| DB queries | ✅ | All queries include `tenant_id` predicate |
| RAG / vector retrieval | ✅ | Fixed Apr-2026 (KG001, KG015, KG014) |
| AI agent runs | ✅ | Tenant context propagated to all model calls |
| API responses | ✅ | Response serializers filter by tenant |
| Session-to-tenant binding | ✅ | Session stores `tenant_id`; validated per request |
| Audit trail | ✅ | All writes record `tenant_id` and `actor_id` |

---

## Policy Gates on Destructive AI Actions

| Action | Gate | Notes |
|---|---|---|
| Agent executing irreversible workflow step | `checkPermission()` required | Blocks if policy not met |
| SOAR playbook irreversible action | Human review gate enforced | Safety gates on all SOAR irreversible steps |
| Policy deletion | `platform_admin` required | Cannot be delegated |
| Decision simulation affecting governed state | Policy check before commit | Dry-run mode available |
| Bulk data export | `auditor` role + audit log entry | Recorded in proof chain |

---

## RBAC Coverage Verdict

| Dimension | Status |
|---|---|
| Auth middleware on all protected routes | ✅ Confirmed |
| Role checks on admin/write routes | ✅ Confirmed |
| Tenant isolation at DB layer | ✅ Confirmed (post Apr-2026 fixes) |
| Policy gates on destructive AI actions | ✅ Confirmed |
| Timing-safe token comparison | ✅ Fixed Apr-2026 |
| Session HttpOnly / Secure / SameSite | ✅ Confirmed in app.ts |
| SSRF validation on webhooks | ⚠️ Open (LC-004, conditional blocker) |
