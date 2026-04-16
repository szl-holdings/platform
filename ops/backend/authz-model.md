# Authorization Model

Generated: 2026-04-16
Status: Canonical

## Role Hierarchy

```
super_admin > ops > manager > analyst > viewer > guest
```

Each role inherits all permissions of roles below it.

## Role Definitions

| Role | Description | Typical Holder |
|------|-------------|---------------|
| `super_admin` | Full platform access, all CRUD, all domains | Founder, CTO |
| `ops` | Operational access, user/settings management | Operations team |
| `manager` | Domain-level management, approve/reject | Domain leads |
| `analyst` | Read + analysis access, can create reports | Intelligence analysts |
| `viewer` | Read-only access to assigned domains | Clients, stakeholders |
| `guest` | Public endpoints only | Unauthenticated |

## Authentication Methods

### Cookie Sessions (primary)

- Cookie name: `sid`
- Expiry: 24 hours with sliding refresh
- Flags: `Secure`, `HttpOnly`, `SameSite=Lax`
- Used by: Web apps (command, lyte, szl-holdings, etc.)

### Bearer Tokens

- Header: `Authorization: Bearer <token>`
- Used by: Mobile apps (CORTEX), API consumers, webhooks

### Internal Token (service-to-service)

- Header: `X-Internal-Token: <ALLOY_INTERNAL_TOKEN>`
- Grants: `super_admin` role
- Used by: Cross-service calls, scheduler, background jobs
- Never expose to end users or external callers

## Middleware Stack (Auth)

Applied in order on every `/api/*` route:

```
correlationMiddleware    → Assign X-Correlation-Id
authMiddleware           → Parse session cookie / bearer token → set req.user
globalAuthEnforcer       → Block public routes if not in allowlist
csrfMiddleware           → Validate CSRF token for state-mutating requests
sessionRefreshPolicy     → Extend session expiry on activity
```

## Route Authorization

### `requireRole(role)` middleware

```typescript
import { requireRole } from "../middlewares/auth";

// Require manager or above
router.post("/resource", requireRole("manager"), handler);

// Require analyst or above
router.get("/reports", requireRole("analyst"), handler);
```

### Public Route Allowlist

Routes exempt from `globalAuthEnforcer`:

- `GET /api/health*` (all health endpoints)
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/docs`
- `GET /api/openapi`
- `GET /api/openapi.json`
- `GET /api/version`
- `GET /api/csrf-token`
- `POST /api/contact`
- `POST /api/demo-requests`

### Endpoint Authorization Matrix

| Action | Minimum Role |
|--------|-------------|
| `GET /api/*/list` | `viewer` |
| `GET /api/*/:id` | `viewer` |
| `GET /api/dashboard/*` | `viewer` |
| `POST /api/*/search` | `analyst` |
| `POST /api/*/export` | `analyst` |
| `GET /api/audit/*` | `analyst` |
| `POST /api/*/create` | `manager` |
| `PUT /api/*/:id` | `manager` |
| `POST /api/*/approve` | `manager` |
| `POST /api/admin/*` | `ops` |
| `PUT /api/users/*` | `ops` |
| `DELETE /api/*/:id` | `super_admin` |
| `GET /api/health/detailed` | `super_admin` or internal token |
| `POST /api/cortex/*` | `super_admin` |

## Multi-Tenant Isolation

All data queries must be scoped by organization ID:

```typescript
// Extract caller org IDs from authenticated user
const orgIds = callerOrgIds(req);

// Apply to every query
.where(inArray(table.orgId, orgIds))
```

- Cross-org access returns `404 NOT_FOUND` (not `403`) to prevent information leakage
- Platform-level entities (feature flags, audit log) require `ops` or `super_admin`

## Sensitive Action Authorization

Additional authorization gates for high-impact actions:

| Action | Gate |
|--------|------|
| Delete user | `super_admin` + confirmation token |
| Export PII data | `ops` + audit log entry |
| Execute AI action | `manager` + approval workflow if confidence < 0.70 |
| Provision new tenant | `super_admin` + idempotency key |
| Access billing data | `manager` (own org) or `ops` (any org) |

## Feature Flags

Feature access is also gated by internal feature flags:

```typescript
// Checked via req.featureFlags middleware
req.featureFlags.has("internal_audit_console_enabled")
```

Current flags:
- `internal_audit_console_enabled` — audit log viewer
- `ai_autonomous_execution_enabled` — allow AI to self-execute approved actions
- `cortex_full_access` — CORTEX domain-level intelligence
- `admin_seed_endpoints` — enable `/seed` admin routes

## Session Security

- CSRF tokens required for all POST/PUT/PATCH/DELETE when using cookie auth
- Bearer token callers are exempt from CSRF (stateless)
- Session rotation on privilege escalation
- Concurrent session limit: 5 active sessions per user
