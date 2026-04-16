# Replit Runbook — SZL Holdings Platform

Last updated: 2026-04-16

This runbook covers day-to-day development operations, first-time setup, and common maintenance tasks inside the Replit workspace.

---

## 1. First-Time Setup

### 1.1 Clone and install

```bash
# Clone the monorepo
git clone https://github.com/stephenlutar2-hash/szl-holdings-platform.git

# Install dependencies (pnpm only — yarn and npm are blocked)
pnpm install
```

### 1.2 Set required secrets

In the Replit Secrets panel (`Tools → Secrets`) set:

**Minimum required for local dev:**

```
DATABASE_URL              # Auto-provisioned by Replit PostgreSQL — do not set manually
SESSION_SECRET            # openssl rand -hex 32
ALLOY_INTERNAL_TOKEN      # openssl rand -base64 48
FIELD_ENCRYPTION_KEY      # openssl rand -hex 32
CONNECTOR_ENCRYPTION_KEY  # openssl rand -hex 32
```

**For AI features (optional in dev):**

```
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
```

See `/ops/replit/production-secret-checklist.md` for the full production secret inventory.

### 1.3 Database setup

The database is auto-provisioned by Replit PostgreSQL. After secrets are set, sync the schema:

```bash
pnpm migrate        # Alias for: pnpm --filter @szl-holdings/db run push
```

Optionally seed demo data:

```bash
pnpm seed:demo
```

---

## 2. Named Workflows (Replit)

The following named workflows are configured in the workspace. Run them via the Replit workflow UI or `restart_workflow`:

Dev server workflows (persistent — start individually from the Replit workflow panel):

| Workflow | Command | Port | Type |
|---------|---------|------|------|
| `dev:flagship` | `PORT=21130 pnpm --filter @workspace/szl-holdings run dev` | 21130 | webview |
| `dev:api` | `PORT=8080 pnpm --filter @workspace/api-server run dev` | 8080 | console |
| `dev:command` | `VITE_PORT=6001 pnpm --filter @workspace/command run dev` | 6001 | webview |
| `dev:web` | `PORT=9090 pnpm --filter @workspace/szl-holdings run dev` | 9090 | webview (secondary) |

> **Warning — Run button:** The Replit Run button is wired to the `Project` parallel launcher, which starts ALL named workflows simultaneously (including `db:migrate` and `seed:demo`). **Always start dev services individually from the workflow panel during normal development.** Only use the Run button if you intend to run the full workspace initialization sequence.

Utility workflows (selectable in the workflow UI, run to completion):

| Workflow | Command |
|---------|---------|
| `build:flagship` | `pnpm --filter @workspace/szl-holdings run build` |
| `build:api` | `pnpm --filter @workspace/api-server run build` |
| `lint` | `pnpm run lint` |
| `typecheck` | `pnpm run typecheck` |
| `test` | `pnpm run test` |
| `test:e2e` | `pnpm run test:e2e` |
| `qa` | `pnpm run qa:site` |
| `db:migrate` | `pnpm run migrate` |
| `seed:demo` | `pnpm run seed:demo` |

**Port contracts:**
- `szl-holdings` (flagship SPA): reads `PORT` env, localPort `21130` per `.replit [[ports]]` config
- `api-server`: reads `PORT` env, localPort `8080` per `.replit [[ports]]` config
- `command`: reads `VITE_PORT` env (not `PORT`), Vite binds `6001`, shared proxy starts on `5000`

> Replit also manages per-artifact workflows automatically for each `[[artifacts]]` entry.

---

## 3. Starting Development

### Start a single app

```bash
# Flagship web
pnpm --filter @workspace/szl-holdings run dev

# API server
pnpm --filter @workspace/api-server run dev

# Specific domain app
pnpm --filter @workspace/terra run dev
pnpm --filter @workspace/vessels run dev
pnpm --filter @workspace/aegis run dev
```

### Start all apps (not recommended in workspace — resource intensive)

```bash
pnpm dev    # Runs pnpm -r --if-present run dev across all packages
```

---

## 4. Common Commands

### Code quality

```bash
pnpm lint           # ESLint across all packages
pnpm typecheck      # TypeScript typecheck (libs + artifacts)
pnpm test           # Unit + component tests
pnpm test:api       # API unit tests only
pnpm test:components # Component tests only
pnpm test:e2e       # Playwright E2E (all apps)
```

### Build

```bash
pnpm build                                              # Build all artifacts
pnpm --filter @workspace/szl-holdings run build        # Build flagship only
pnpm --filter @workspace/api-server run build          # Build API only
```

### Database

```bash
pnpm migrate        # Push schema changes to DB
pnpm seed:demo      # Seed demo data (canonical)
pnpm seed:all       # Full canonical seed script
```

### QA & audits

```bash
pnpm qa:site        # Routes, links, trust, meta checks
pnpm qa:routes      # Smoke-test all registered routes
pnpm qa:links       # Check for broken links
pnpm qa:a11y        # Accessibility check
pnpm audit:all      # Full audit suite (mocks, routes, copy, deps, design system)
pnpm security:audit # Dependency vulnerability scan + SBOM generation
```

---

## 5. Secrets: Workspace vs Deployment

### Workspace / Development secrets

Managed in the **Replit Secrets panel** (`Tools → Secrets`). These are available to all processes running in the workspace.

- Never commit secrets to the repository
- Never put secrets in `.env` files that are tracked by git
- Use `.env.example` to document required variable names without values

### Deployment secrets (Staging)

Managed in **GitHub Settings → Environments → staging → Secrets** (the `deploy-staging.yml` workflow reads these from the `staging` environment):

```
REPLIT_STAGING_APP_ID        # Staging Replit app ID
REPLIT_STAGING_DEPLOY_TOKEN  # Staging Replit deploy token
```

Managed in **Replit Deployment settings** for the staging deployment:

```
DATABASE_URL           # Staging DB
SESSION_SECRET         # Staging-specific value
NODE_ENV=staging
All production-equivalent secrets with staging values
```

### Deployment secrets (Production)

Managed in **GitHub Settings → Environments → production** (requires reviewer approval):

```
REPLIT_APP_ID
REPLIT_DEPLOY_TOKEN
```

Managed in **Replit Deployment settings** for the production deployment:

```
DATABASE_URL           # Production DB — never shared with staging
SESSION_SECRET         # Production-specific value
FIELD_ENCRYPTION_KEY   # Rotated quarterly
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGINS=https://app.szlholdings.com,https://*.replit.app
PUBLIC_APP_URL=https://szlholdings.replit.app
```

---

## 6. Health Checks

```bash
# API server health (local)
curl http://localhost:8080/api/health/live

# Via Replit proxy
curl https://<your-repl>.<username>.replit.dev/api/health/live

# Run full QA verification
pnpm qa:verify
```

---

## 7. Port Reference

| Internal Port | External Port | Assigned To |
|--------------|--------------|-------------|
| 8080 | 80 | Primary proxy (flagship + path routing) |
| 9090 | 3000 | Secondary slot |
| 21130 | 3001 | Tertiary slot |

Path routing through the proxy:

| Path prefix | Service |
|------------|---------|
| `/` | `szl-holdings` (flagship) |
| `/api/` | `api-server` |
| `/command/` | `command` |
| `/aegis/` | `aegis` |
| `/terra/` | `terra` |
| `/vessels/` | `vessels` |
| `/prism-counsel/` | `prism-counsel` |

---

## 8. Troubleshooting

### App is not loading in the preview pane

1. Check the workflow is running in Replit Workflows panel
2. Verify the workflow is listening on the expected port (`getWorkflowStatus`)
3. Check that `server.allowedHosts: true` (or equivalent) is set in the Vite config — the Replit proxy uses a different origin
4. Restart the workflow after any server-side code changes

### TypeScript errors in CI but not locally

Run the full typecheck locally:

```bash
pnpm typecheck
```

Ensure you have built all lib packages first (`pnpm build`). TypeScript project references require all referenced packages to be compiled before dependents.

### Database migration failed

```bash
# Check DB connection
pnpm --filter @szl-holdings/db run check

# Reset and re-push schema (destructive in dev only)
pnpm --filter @szl-holdings/db run reset
pnpm migrate
```

### Lockfile out of sync

```bash
# Regenerate lockfile
pnpm install

# Verify frozen lockfile passes (what CI checks)
pnpm install --frozen-lockfile --dry-run
```
