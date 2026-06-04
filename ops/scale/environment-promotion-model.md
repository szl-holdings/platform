# Environment Promotion Model

Phase B · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

Lock the environment topology so that any change has a single, known
path from a workspace edit to a production user. Deviation from this
path is itself an incident.

## Tiers

| Tier | Host | Purpose | Data |
|------|------|---------|------|
| Local | Engineer laptop or Replit workspace | Author and unit-test changes | Synthetic only |
| Workspace (this Repl) | Replit dev container | Integration target for all artifacts; what the founder sees in chat preview | Synthetic + safe demo seed (`pnpm run seed:demo`) |
| Staging | Replit Autoscale staging deployment | Pre-production verification; design partner demos may use this with consent | Anonymized partner-shaped data; no Restricted-class records |
| Production | Replit Autoscale production deployment | Real partner workloads | Real partner data, including Restricted-class with `FIELD_ENCRYPTION_KEY` |

The repo currently runs only Local + Workspace at full fidelity.
Staging and Production deployment slots exist as Replit deployment
configurations and as `deploy-staging.yml` / `deploy-production.yml`
GitHub workflows. See `manual-actions-left.md` for the steps still
required to bring Staging and Production online with real secrets.

## Promotion Path

```
Local → Workspace (PR merge) → Staging (auto on push to main) → Production (release-tag triggered)
```

There is no direct promotion to Production. Every production change
must pass through Staging — even hotfixes — because the smoke tests in
`staging-and-prod-smoke-tests.md` are the only mechanism that has
caught regressions in the last three founder-initiated changes.

## Promotion Triggers

| From → To | Trigger | Approver |
|-----------|---------|----------|
| Local → Workspace | PR merge to `main` (after code review verdict APPROVED per `.local/skills/code_review`) | Founder |
| Workspace → Staging | Push to `main` (auto via `deploy-staging.yml`) | None — automated |
| Staging → Production | Tagged release `vX.Y.Z` triggers `deploy-production.yml`; manual confirm gate | Founder (release approval per `founder-release-approval.md`) |

## Per-Workload Deployment Targets

| Workload | Where it Runs in Production |
|----------|----------------------------|
| `artifacts/szl-holdings` (flagship web) | Replit Autoscale, mounted at `/` |
| `artifacts/api-server` | Replit Autoscale (same deployment), backend route `/api/*` |
| `artifacts/aegis` / `terra` / `vessels` / `carlota-jo` / `command` | Replit Autoscale, mounted at their respective `/<artifact>/` paths |
| `artifacts/szl-holdings-mobile` (CORTEX) | Built by EAS, distributed via TestFlight + Play Internal until store release (see `mobile-beta-ops.md`) |
| `artifacts/cortex-mobile` | DEFERRED — never deployed (see `artifacts/cortex-mobile/DEFERRED.md`) |
| `artifacts/mockup-sandbox` | INTERNAL — never deployed |
| Archived artifacts (5 surfaces — see `ops/frontier/disposition-matrix.md`) | NOT deployed; redirects only |

## What Cannot Differ Between Tiers

These must be identical in Workspace, Staging, and Production:

- Drizzle schema in `lib/db/src/schema/*.ts` (currently 116 schema files,
  569 tables)
- API route surface (`artifacts/api-server/src/routes/`)
- ATLAS event taxonomy (`packages/atlas-events`)
- RBAC role definitions (`lib/services/rbac`)
- Zod validation schemas (`lib/api-zod`)

Any environment that drifts from these is treated as broken and
regenerated.

## What Must Differ Between Tiers

| Item | Workspace | Staging | Production |
|------|-----------|---------|------------|
| `NODE_ENV` | `development` | `staging` | `production` |
| `DATABASE_URL` | Replit-managed dev DB | Replit-managed staging DB | Replit-managed prod DB |
| `SESSION_SECRET` | Workspace value | Unique staging value | Unique production value |
| `FIELD_ENCRYPTION_KEY` | Workspace value | Unique staging value | Unique production value |
| `OAUTH_STATE_SECRET` | Workspace value | Unique staging value | Unique production value (rotate) |
| `VAPID_PRIVATE_KEY` | Workspace value | Unique staging value | Unique production value (rotate) |
| External API keys (OpenAI, Anthropic, Stripe, etc.) | Dev/test keys where available | Test keys | Live keys |
| `CORS_ORIGINS` | localhost + workspace domains | staging domain | production domain only |
| `LOG_LEVEL` | `debug` | `info` | `info` (or `warn` for noisy classes) |

Full per-secret inventory: `ops/security/secret-inventory.md` and the
new env registry doc `docs/architecture/env-registry.md` introduced by
the ATLAS task.

## Drift Detection

Any of the following triggers an environment-drift incident:

1. A schema migration applied to one tier but not another
2. A feature flag enabled in Production but not Staging
3. A secret rotated in Production but not Staging (excluding values
   that are deliberately tier-specific)
4. A canonical artifact running a different version across tiers

Detection mechanism today: manual diff at release time. Automated
drift detection is on the roadmap (see
`scale-constraints-memo.md`, "Tier-drift detector").
