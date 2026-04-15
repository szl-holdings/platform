# Authorization Matrix

Generated: 2026-04-15

## Role Definitions

| Role | Description | Typical User |
|------|-------------|-------------|
| `super_admin` | Full platform access, all CRUD, all domains | Founder, CTO |
| `ops` | Operational access, can manage users and settings | Operations team |
| `manager` | Domain-level management, can approve/reject | Domain leads |
| `analyst` | Read + analysis access, can create reports | Intelligence analysts |
| `viewer` | Read-only access to assigned domains | Clients, stakeholders |
| `guest` | Public endpoints only | Unauthenticated users |

## Endpoint Authorization

### Public (no auth)
- `GET /api/health/*` — health checks
- `POST /api/auth/login` — login
- `POST /api/auth/register` — registration
- `GET /api/docs` — API documentation

### Viewer+
- `GET /api/*/list` — list resources in assigned domains
- `GET /api/*/detail/:id` — view resource details
- `GET /api/dashboard/*` — dashboard data

### Analyst+
- `POST /api/*/search` — advanced search/filter
- `POST /api/*/export` — data export
- `GET /api/audit/activity` — view audit logs

### Manager+
- `POST /api/*/create` — create resources
- `PUT /api/*/:id` — update resources
- `POST /api/*/approve` — approve workflows
- `POST /api/*/reject` — reject workflows

### Ops+
- `POST /api/admin/*` — admin operations
- `PUT /api/users/*` — user management
- `POST /api/system/*` — system configuration

### Super Admin
- `DELETE /api/*/:id` — delete resources
- `GET /api/health/detailed` — detailed metrics
- `POST /api/cortex/*` — CORTEX intelligence actions
- All mutation endpoints

## Multi-Tenant Isolation

All data queries are scoped by organization ID:
- `callerOrgIds()` extracts org IDs from authenticated user
- `inArray(orgId, orgIds)` applied to all WHERE clauses
- Cross-org access returns 404 (not 403) to prevent information leakage

## Feature Flags

Internal feature flags control access to experimental features:
- `internal_audit_console_enabled` — audit log viewer
- Checked via `req.featureFlags` middleware
