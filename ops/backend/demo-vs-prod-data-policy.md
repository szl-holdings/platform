# Demo vs. Production Data Policy

Generated: 2026-04-16
Status: Enforced

## Core Principle

Synthetic (demo) data must never contaminate production databases or production data flows. Production data must never be exposed in demo sessions.

## Environments

| Environment | `NODE_ENV` | DB | Seed Data | External APIs |
|-------------|------------|-----|-----------|---------------|
| `development` | `development` | Local or dev DB | Always seeded | Mocked or live |
| `staging` | `staging` | Staging DB | Seeded on setup | Live (test keys) |
| `production` | `production` | Production DB | **Never auto-seeded** | Live (prod keys) |
| `demo` | `production` + `ENABLE_DEMO_SEED=true` | Dedicated demo DB | Explicitly seeded | Mocked |

## Seed Isolation Rules

### API Server Startup Seeds

Controlled by: `isDemoSeedEnabled` flag in `artifacts/api-server/src/index.ts`

```typescript
const isDemoSeedEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_DEMO_SEED === "true";
```

Seeds that run only when enabled:
- `seedPlatformData()` — Demo orgs, users, workspaces
- `seedMspData()` — MSP demo tenants and incidents
- `seedDreamscapeData()` — Creative workflow demo records

Seeds that are **always** admin-gated (never auto-run):
- `seedVesselsData()` — Via `POST /api/vessels/seed` (admin + auth required)
- `seedDosData()` — Via dedicated admin endpoint

### Demo Org Naming Convention

All demo/seed orgs must use the slug prefix `*-demo`:
- `alloy-demo`
- `lyte-demo`
- `vessels-demo`
- `msp-demo`

This allows easy identification and cleanup of synthetic records.

## Frontend Demo Mode

### Sandbox Mode (`useSandboxMode`)

Controlled by: `SandboxModeProvider` from `@szl-holdings/shared-ui`

When active:
- `SandboxModeBanner` renders at top of page
- All write operations are intercepted and shown as simulated
- API calls may be routed to demo endpoints or use placeholder data

### Live Demo Mode (`useDemoMode`)

Controlled by: `DemoModeProvider` in `artifacts/command/src/operations/lib/demo-mode.tsx`

When active:
- Gold banner: "Demo Mode — Synthetic data only · No live systems connected"
- `SEEDED` pill shown in header
- All displayed data is from seed scenarios (aegis, vessels, terra)

### URL-Based Demo Activation

`?demo=true` query param:
- Shows `EnvironmentLabel` chips in header
- Does NOT activate live demo or write interception
- Used for marketing/sales demos of specific pages

## Data Isolation in Multi-Tenant API

All API queries use org-scoped filters:

```typescript
const orgIds = callerOrgIds(req);
.where(inArray(table.orgId, orgIds))
```

Demo org IDs (`*-demo` slugs) are never returned to production users because:
1. Demo orgs are only created in non-production environments
2. Production users are never assigned to demo orgs
3. Cross-org access returns 404 (not 403) to prevent leakage

## Allowed Operations in Demo Mode

| Operation | Demo Mode | Sandbox Mode | Production |
|-----------|-----------|-------------|------------|
| Read synthetic data | Yes | Yes | No |
| Write to demo org | Yes | Simulated | No |
| Execute AI workflows | Simulated | Blocked | Live |
| Send email/push | No | No | Live |
| Charge payment | No | No | Live |
| Export data | Yes (demo data only) | No | Yes |

## Compliance Requirements

1. **GDPR**: Production user PII must not appear in demo exports or demo sessions
2. **SOC 2**: Audit log must distinguish demo actions from production actions (`isDemoRecord` flag)
3. **Data Retention**: Demo seed records deleted on demo environment reset, not subject to production retention policy

## Cleanup Procedure

To reset a demo environment:

```sql
-- Delete all records belonging to demo orgs
DELETE FROM <table> WHERE org_id IN (
  SELECT id FROM organizations WHERE slug LIKE '%-demo'
);
```

Or use the admin endpoint:
```
POST /api/admin/demo/reset
X-Internal-Token: <ALLOY_INTERNAL_TOKEN>
```

## Env Variable Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Controls seed gate and security settings |
| `ENABLE_DEMO_SEED` | `false` | Force seed in production (use for demo environments) |
| `DEMO_ORG_PREFIX` | `*-demo` | Prefix for identifying demo org slugs |
