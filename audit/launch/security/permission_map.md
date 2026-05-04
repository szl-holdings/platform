# Permission Map
**Phase:** 3 + 6  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Permission Model

The platform uses a hierarchical 11-role RBAC model enforced at four layers:

1. **API middleware** — `requireAuth` on all protected routes; `requireRole(role)` on admin/write routes
2. **Service layer** — `checkPermission()` from `lib/covenant-policy` before governed mutations
3. **Database layer** — All queries include `tenant_id` predicate; row-level scoping
4. **UI layer** — Feature flags and role-conditional rendering (defense in depth only; not primary enforcement)

---

## Role → Permission Mapping

| Permission | super_admin | platform_admin | tenant_admin | executive | operator | analyst | approver | reviewer | auditor | viewer | guest |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Read decisions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Write decisions | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve actions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Read signals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Run simulations | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View proof chain | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage workflows | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete workflows | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage policies | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete policies | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin panel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Billing management | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Run AI agents | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit trail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export data | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Platform settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modify roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Demo User Role Assignments

| User | Role | Purpose |
|---|---|---|
| `demo-investor@szl.demo` | `executive` | Investor persona — read-only across domains |
| `demo-ceo@szl.demo` | `executive` | CEO persona — executive dashboard |
| `demo-coo@szl.demo` | `operator` | COO persona — operational surfaces |
| `demo-ciso@szl.demo` | `operator` | CISO persona — Aegis / security surfaces |
| `demo-analyst@szl.demo` | `analyst` | Analyst persona — decision intelligence |
| `demo-admin@szl.demo` | `tenant_admin` | Demo admin — full tenant management |

---

## Audit Log Coverage

| Action Type | Audit Log Entry | Notes |
|---|---|---|
| Decision written | ✅ | `proof_entries` table |
| Policy check | ✅ | Logged with result and `correlationId` |
| User login | ✅ | Session audit entry |
| User logout | ✅ | Session audit entry |
| Role assignment | ✅ | Actor + target recorded |
| Policy created/modified | ✅ | Version history maintained |
| Agent run | ✅ | Full run trace in `agent_runs` |
| Approval granted/rejected | ✅ | Approver + timestamp recorded |
| Bulk data export | ✅ | Export event recorded |
| Admin action | ✅ | All admin mutations logged |
