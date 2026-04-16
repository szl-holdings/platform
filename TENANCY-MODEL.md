# Tenancy Model — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Engineers, security reviewers, enterprise evaluators, compliance officers

---

## Overview

The SZL Holdings platform uses a **shared-infrastructure, logically-isolated multi-tenant architecture**. All tenants share the same application deployment, database instance, and platform primitives, but data is isolated at the query layer via mandatory `org_id` scoping.

This model balances operational simplicity (single deployment to manage) with strong tenant isolation (no tenant can access another tenant's data through any code path).

---

## Tenant Identity

Every tenant is an **organization** (`org`). Each organization has:

| Attribute | Description |
|-----------|-------------|
| `org_id` | Primary key — UUID, immutable after creation |
| `name` | Display name for the organization |
| `slug` | URL-safe identifier (used in sub-paths where applicable) |
| `plan` | Subscription plan (free, starter, professional, enterprise) |
| `status` | Active, suspended, or deactivated |
| `created_at` | Provisioning timestamp |

Users belong to one or more organizations. Each user-org membership carries a **role** (see `ACCESS-CONTROL-MATRIX.md` for the full 11-role hierarchy).

---

## Data Isolation

### Query-Level Enforcement

Every database query involving tenant-specific data includes an explicit `WHERE org_id = ?` predicate. This is enforced at multiple layers:

1. **ORM query builders** — Shared Drizzle ORM query builders include `org_id` scope by default. Domain-specific queries use these builders as the foundation.
2. **API middleware** — The `tenantScope` middleware extracts `org_id` from the authenticated session and injects it into the request context. Routes protected by `tenantScope` cannot execute queries without an org context.
3. **Route handlers** — Domain routes (Alloy, Aegis, Terra, Vessels, etc.) enforce org scope internally within their handlers using the session's `org_id`.
4. **Proof Chain** — Audit trail entries are scoped by `org_id`. No cross-tenant audit visibility.

### What Is NOT Tenant-Scoped

| Resource | Scoping | Rationale |
|----------|---------|-----------|
| Platform configuration | Global | Feature flags, system health, platform version |
| Public content | Global | Marketing pages, documentation, legal pages |
| Demo data | Demo org only | Synthetic data in a dedicated demo organization |
| Platform primitives | Shared code, tenant-scoped data | Outcome Graph, Proof Chain, etc. execute per-org |

### Cross-Tenant Access Prevention

Cross-tenant data access is **architecturally prevented**:

- **No `IS NULL` fallback** — Queries never fall back to `WHERE org_id IS NULL`. If `org_id` is absent from the request context, the query fails with a 403.
- **No global admin data views** — `super_admin` users see their own org's data by default. Cross-org visibility requires explicit admin tooling (not available in standard product surfaces).
- **WebSocket channels** — Channel names include `org_id` as prefix. Connection tickets are HMAC-signed with `SESSION_SECRET` and scoped to a single org.
- **File storage** — Object storage paths include `org_id` in the key prefix, preventing cross-tenant file access.

---

## Tenant Provisioning

### Self-Service (SaaS)

1. User signs up via OIDC flow
2. System creates a new `org` record with default plan
3. User is assigned `org_owner` role in the new org
4. Default configuration (feature flags, plan limits) applied
5. Onboarding wizard guides initial setup

### Enterprise (SCIM)

Enterprise tenants are provisioned via Azure AD integration:

1. Azure AD admin configures SCIM 2.0 connector pointing to `/api/scim/v2/`
2. Platform creates org record with enterprise plan
3. Azure AD groups are mapped to platform roles
4. Users are automatically provisioned/deprovisioned via SCIM sync
5. SSO is configured via OIDC with Azure AD as the identity provider

### Demo Provisioning

A dedicated demo organization exists with:
- Synthetic data across all domain packs
- `demo` role for unauthenticated or guest access
- Data resets on a schedule (not on user action)
- No real PII or customer data

---

## Tenant Configuration

Each tenant can configure:

| Setting | Scope | Storage |
|---------|-------|---------|
| Plan and entitlements | Org | `organizations` table |
| Feature flags | Org | `feature_flags` table (org-scoped overrides) |
| Branding (white-label) | Org | `tenant_branding` table |
| SSO configuration | Org | `azure_tenants` table (encrypted) |
| Notification preferences | User-Org | `notification_preferences` table |
| AI model preferences | Org | `ai_config` table |

---

## Data Residency

### Current Model (Replit / Single Region)

All tenant data resides in a single PostgreSQL instance managed by Replit. No per-tenant database isolation. Data residency is US-based (Replit's infrastructure region).

### Future Model (Azure / Multi-Region)

Enterprise deployments on Azure support:
- Per-region database instances
- Tenant-level data residency configuration
- Encrypted per-tenant secrets in Azure Key Vault
- Row-Level Security (RLS) policies as an additional enforcement layer

---

## Tenant Lifecycle

| State | Description | Data Handling |
|-------|-------------|---------------|
| **Active** | Normal operation | Full access per plan |
| **Suspended** | Payment issue or admin action | Read-only access for org admins |
| **Deactivated** | Tenant offboarded | Access revoked; data retained per retention policy |
| **Deleted** | Retention period expired | All tenant data permanently removed |

### Data Retention

- Active tenants: data retained indefinitely
- Deactivated tenants: data retained for 90 days (configurable per enterprise contract)
- After retention period: data is permanently deleted (irreversible)
- Audit trail entries (Proof Chain) are retained for the full retention period

---

## Compliance Considerations

| Requirement | Implementation |
|-------------|---------------|
| **Data isolation** | Query-level `org_id` scoping on all tenant data |
| **Access control** | 11-role RBAC with deny-by-default enforcement |
| **Audit trail** | Immutable, org-scoped Proof Chain entries |
| **Encryption at rest** | PostgreSQL encryption (Replit-managed); Azure Key Vault (enterprise) |
| **Encryption in transit** | TLS 1.2+ on all connections |
| **Right to erasure (GDPR)** | Tenant deletion removes all org-scoped data |
| **SOC 2 alignment** | Logical access controls (CC6.1–CC6.8) |

---

## MCP Gateway Tenancy

The MCP gateway enforces the same tenant isolation model as the REST API with additional guarantees specific to agent access patterns.

### Tenant Context Injection

MCP tool callers cannot supply `orgId` as a tool parameter. The gateway extracts `org_id` from the authenticated session and injects it into every database query. This eliminates a class of tenant hopping attacks that can occur when callers supply their own tenant context.

**Exception:** Super-admin tools (e.g., `platform_get_tenant_state` with `orgId` override) are gated behind `adminGuard` middleware and require `super_admin` role. All such invocations are logged with elevated audit detail.

### Agent Session Binding

AI agents that access the platform through the MCP gateway must authenticate using a session token bound to a human user or a provisioned service account. The session carries an `org_id` that binds the agent to a single tenant for the duration of the session.

Multi-tenant agent orchestration (a single agent serving multiple tenants) is not supported in the current model. Each tenant interaction requires a separate session scoped to that tenant's `org_id`.

### Isolation at the Tool Layer

Every MCP tool is implemented with the org-scope invariant:
1. `getUserOrgIds(user)` extracts the caller's tenant(s)
2. All DB queries include `WHERE org_id IN (?)` with the caller's org IDs
3. Results are never filtered post-retrieval to avoid TOCTOU gaps — the DB query scope is authoritative

### AI Trace Tenant Scoping

AI evaluation traces (`lib/ai-engine/src/evals/trace-capture.ts`) are stored with `orgId` and only returned for the authenticated user's tenant. The AI Ops dashboard endpoints (`/api/ai/ops/*`) enforce tenant scope identically to other domain APIs.

---

## Related Documents

| Document | Path |
|----------|------|
| Access control matrix | `ACCESS-CONTROL-MATRIX.md` |
| Architecture overview | `ARCHITECTURE.md` |
| Security checklist | `SECURITY-CHECKLIST.md` |
| Deployment guide | `DEPLOYMENT-GUIDE.md` |
| Secrets policy | `SECRETS_SETUP.md` |
| MCP gateway strategy | `MCP_GATEWAY_STRATEGY.md` |
| AI evaluation strategy | `AI_EVALUATION_STRATEGY.md` |
