# Environment Matrix

Updated: 2026-04-16

## Environment Ladder

| Environment | Platform | URL Pattern | Purpose |
|-------------|----------|-------------|---------|
| Local | Replit workspace (dev) | `*.repl.co/...` | Active feature development |
| Replit Preview | Replit workspace (preview) | `*.repl.co/...` | Real-time dev preview |
| Staging | Replit deployment (staging) | `staging.szlholdings.com` | Pre-production validation, demos |
| Production | Replit deployment (production) or Azure | `szlholdings.com` | Live customer traffic |

---

## Per-Environment Configuration

### Local (Development)

| Item | Value |
|------|-------|
| API URL | `https://<replit-dev-domain>/api` |
| Database | Replit PostgreSQL (dev namespace) |
| Secrets | Replit Secrets (no prefix) |
| Auth | Replit Auth dev credentials |
| Mobile API | `EXPO_PUBLIC_API_URL=https://<replit-dev-domain>/api` |
| Logging | Console (verbose/debug) |
| Seed data | Full demo dataset via `pnpm --filter scripts run seed` |
| Feature flags | All enabled |

### Replit Preview

| Item | Value |
|------|-------|
| API URL | `https://<replit-preview-domain>/api` |
| Database | Same Replit PostgreSQL as local (shared schema) |
| Secrets | Replit Secrets (shared with local) |
| Purpose | Hot-reload preview of current branch |

### Staging

| Item | Value |
|------|-------|
| API URL | `https://staging.szlholdings.com/api` |
| Database | Replit PostgreSQL (staging namespace) OR Azure staging instance |
| Secrets | Replit Secrets with `STAGING_` prefix |
| Auth | Production Replit Auth app (staging callback URL registered) |
| Mobile API | `EXPO_PUBLIC_API_URL=https://staging.szlholdings.com/api` |
| Logging | Structured JSON (info level) |
| Seed data | Sanitized subset of production data OR fresh demo seed |
| Feature flags | Mirrors production (canary flags allowed) |

Staging is the demo environment shown to prospects and investors.

### Production

| Item | Value |
|------|-------|
| API URL | `https://api.szlholdings.com/api` (Azure target) |
| Database | Azure PostgreSQL Flexible Server (General Purpose) |
| Secrets | Azure Key Vault (managed identity access) |
| Auth | Production Replit Auth / Clerk production credentials |
| Mobile API | `EXPO_PUBLIC_API_URL=https://api.szlholdings.com/api` |
| Logging | Application Insights + Log Analytics |
| Seed data | Real customer data — never reset |
| Feature flags | Conservative rollout only |

---

## Secret Namespace Convention

| Environment | Naming Pattern | Example |
|-------------|---------------|---------|
| Local/Dev | No prefix | `DATABASE_URL` |
| Staging | `STAGING_` prefix | `STAGING_DATABASE_URL` |
| Production | `PROD_` prefix (Azure: no prefix, Key Vault namespaced) | `PROD_DATABASE_URL` |

All secrets managed in Replit Secrets for Replit-hosted environments. Azure Key Vault for Azure-hosted production.

---

## Database Separation

| Environment | Database | Migrations | Seed |
|-------------|----------|-----------|------|
| Local | Replit PostgreSQL (shared) | `pnpm --filter db push` | `pnpm --filter scripts run seed` |
| Staging | Separate DB instance | `pnpm --filter db run migrate` | Sanitized demo seed |
| Production | Azure PostgreSQL | Migration-only (never `push`) | Never |

> **Rule**: Never run `drizzle-kit push` (schema push) against production. Always use migration files. Never seed production with test data.

---

## Mobile Environment Handling

Mobile apps use `EXPO_PUBLIC_API_URL` to target the correct environment:

| EAS Build Profile | API Target | How Set |
|-------------------|-----------|---------|
| `development` | Local Replit domain | Hardcoded in `eas.json` env block |
| `preview` | Staging domain | Hardcoded in `eas.json` env block |
| `production` | Production domain | Hardcoded in `eas.json` env block |

No `.env` files are committed. All environment variables for mobile are set in EAS secrets or `eas.json` env blocks (non-sensitive values only).

---

## Promotion Workflow

```
Local development
  → PR created → GitHub Actions CI (lint, typecheck, test)
    → Merge to main → Post-merge script (install deps, push schema, verify build)
      → Replit preview auto-updates
        → Manual: Deploy to Staging (Replit publish)
          → Validation: smoke tests, demo walkthrough
            → Manual: Promote to Production (Replit publish or Azure slot swap)
```

---

*See also: `ops/infra/target-production-architecture.md`, `docs/deployment.md`, `ENV_MATRIX.md`*
