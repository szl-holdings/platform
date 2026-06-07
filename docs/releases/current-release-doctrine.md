# Current Release Doctrine

**Date:** April 16, 2026
**Status:** Authoritative — supersedes `release-strategy.md` and `release-governance.md` where there is conflict
**Scope:** How code becomes a build, how builds are validated, how a release is cut and rolled back, how secrets enter runtime, and how environments differ

---

## 1. How Code Becomes a Build

The SZL Holdings platform is a pnpm monorepo managed by Replit. The build pipeline is as follows:

### Development Build

1. Code changes are authored by the Replit Agent or collaborators in the Replit workspace.
2. Replit automatically commits and checkpoints changes after each task merge — no manual `git commit` is required during development.
3. Each artifact (web app, mobile app, API server) is built independently via its own `pnpm build` script.
4. The top-level build command is: `pnpm -r build`
5. Each artifact runs Vite (web frontends) or tsc (API server) to produce a compiled output.
6. TypeScript compilation errors fail the build.

### Build Artifacts

| Artifact | Build Command | Output |
|----------|-------------|--------|
| `api-server` | `pnpm --filter @workspace/api-server build` | `dist/` — compiled JS |
| `szl-holdings` | `pnpm --filter @workspace/szl-holdings build` | `dist/` — Vite bundle |
| `aegis` | `pnpm --filter @workspace/aegis build` | `dist/` — Vite bundle |
| `vessels` | `pnpm --filter @workspace/vessels build` | `dist/` — Vite bundle |
| `terra` | `pnpm --filter @workspace/terra build` | `dist/` — Vite bundle |
| `command` | `pnpm --filter @workspace/command build` | `dist/` — Vite bundle |
| `carlota-jo` | `pnpm --filter @workspace/carlota-jo build` | `dist/` — Vite bundle |
| `szl-holdings-mobile` | `expo export` | Expo export bundle |

### CI Validation (GitHub Actions)

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and PR:

1. **Lint:** `pnpm -r lint` — ESLint across all packages
2. **Type-check:** `pnpm -r type-check` — TypeScript strict mode
3. **Unit tests:** `pnpm -r test` — Vitest unit tests
4. **Integration tests:** Separate job with PostgreSQL service container
5. **Build check:** `pnpm -r build` — confirms all artifacts compile

> **Known issue:** Integration test job uses pnpm 9 / Node 20 while other jobs use pnpm 10 / Node 22 (GAP-009 in gap register). Remediate in Q2 2026.

---

## 2. How Builds Are Validated

### Pre-Release Checklist

Before tagging any release:

- [ ] `pnpm -r build` — clean build, no errors
- [ ] `pnpm -r type-check` — no TypeScript errors
- [ ] `pnpm -r lint` — no lint errors
- [ ] `pnpm -r test` — all unit tests pass
- [ ] Smoke test: `pnpm qa:site` or `scripts/smoke-tests/run-smoke-tests.sh`
- [ ] `GET /api/health` returns `status: "healthy"`
- [ ] `GET /api/ready` returns ready
- [ ] Review `CHANGELOG.md` entry for the release
- [ ] No new `console.log` or debug artifacts in production code
- [ ] No secrets committed (verify with `git diff`)
- [ ] Screenshots updated if UI changed significantly

The full checklist lives at `docs/releases/release-checklist.md`.

### Release Gates

Formal release gates are documented in `docs/RELEASE_GATES.md`. Key gates:

| Gate | Requirement |
|------|-------------|
| Build | All artifacts build without error |
| Type safety | Zero TypeScript errors |
| Auth | Global auth enforcer verified active |
| Health | API health endpoint returns healthy |
| Smoke tests | Smoke test matrix passes |
| CHANGELOG | Release notes written |

---

## 3. How a Release Is Cut

SZL Holdings follows Semantic Versioning (`MAJOR.MINOR.PATCH`).

| Increment | When |
|-----------|------|
| MAJOR | Breaking API contract changes or significant architectural shifts |
| MINOR | New features or integrations — backward-compatible |
| PATCH | Bug fixes, documentation, small improvements |

### Current Version Range

- `v0.x.x` = Pre-commercial (platform built and demonstrable; not commercially deployed)
- `v1.0.0` = First commercial release (first paying customer)

### Cutting a Release

```bash
# 1. Ensure build is clean
pnpm -r build

# 2. Run smoke tests
pnpm qa:site

# 3. Tag the release
git tag -a v0.2.0 -m "v0.2.0 — Description"
git push origin v0.2.0

# 4. Create GitHub Release from the tag
#    Title: "v0.2.0 — Description"
#    Body: Contents of docs/releases/v0.2.0.md
#    Mark as pre-release if beta/RC

# 5. Replit deployment update
#    In Replit, the deployment is updated by restarting workflows
#    after the code change is merged/checkpointed
```

### Release Naming Convention

```
v{MAJOR}.{MINOR}.{PATCH}[-{pre-release}.{build}]

Examples:
  v0.2.0           — Minor release
  v0.2.1           — Patch release
  v1.0.0-beta.1    — Beta pre-release
  v1.0.0-rc.1      — Release candidate
```

---

## 4. How Secrets Enter Runtime

**Rule: Secrets are never committed to version control. No exceptions.**

### Development (Replit)

- Secrets are stored in Replit Secrets (isolated environment variable store)
- Available to the runtime as `process.env.*`
- Set via the Replit UI or Replit CLI — never in `.env` files with real values
- Each development workspace has isolated secrets from production

### Production

- Secrets stored in Azure Key Vault (production vault)
- Injected into runtime via Azure App Service application settings / managed identity
- Separate vault from staging — no shared secrets across environments
- Emergency backup: encrypted password manager (offline, founder-only access)

### Secret Rotation Policy

| Secret | Rotation Schedule |
|--------|-----------------|
| Session secret | Every 90 days or on any suspicion of exposure |
| Database credentials | Every 90 days |
| API keys (Stripe, etc.) | Every 180 days |
| OAuth client secrets | Every 180 days |
| Webhook signing secrets | Every 90 days |
| Internal auth token | Every 90 days |

Full policy: `docs/SECRETS_POLICY.md`

---

## 5. How Environments Differ

| Attribute | Development (Replit) | Staging | Production |
|-----------|---------------------|---------|-----------|
| Host | Replit workspace container | Azure App Service (staging slot) | Azure App Service (production) |
| Database | Replit-managed PostgreSQL | Azure PostgreSQL Flexible (staging) | Azure PostgreSQL Flexible (prod) |
| Secrets | Replit Secrets | Azure Key Vault (staging vault) | Azure Key Vault (production vault) |
| Auth | Replit OIDC (dev mode) | Azure AD (staging tenant) | Azure AD (production tenant) |
| Domain | `*.replit.dev` | `staging.szlholdings.com` | `szlholdings.com` |
| Data | Synthetic demo data only | Anonymized/synthetic | Real customer data |
| Rate limiting | Relaxed (1000 req/15 min global) | Production-equivalent | Strict (200 req/15 min global) |
| CORS | `*.replit.app, *.replit.dev, *.repl.co` | Staging domain | `szlholdings.com` (update before DNS cutover — GAP-004) |
| Error reporting | Pino console logging | Sentry (if configured) | Sentry (required before first paid tenant — GAP-006) |

> **Important:** Azure staging/production environments are the documented target. As of April 2026, the active deployment is Replit-hosted. Environment docs represent the production-intent architecture. See environment promotion model for promotion path.

---

## 6. Current Deployment Platform

The platform is currently deployed exclusively on Replit:

- All artifacts run as Replit workflows in the development workspace
- The Replit deployment (Autoscale or Reserved VM) serves as the production environment
- Replit checkpoints serve as the rollback mechanism
- Database is Replit-managed PostgreSQL

See `docs/releases/current-environment-promotion-model.md` for the path to Azure production.
