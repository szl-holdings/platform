# Local Bootstrap Guide

**Platform:** SZL Holdings Monorepo  
**Updated:** 2026-04-21  
**Audience:** Engineers, contributors, QA

---

## Prerequisites

| Tool | Required Version | Install |
|------|-----------------|---------|
| Node.js | ≥24.0.0 (24.x LTS recommended) | [nodejs.org](https://nodejs.org) or `nvm install 24` |
| pnpm | ≥10.0.0 | `npm install -g pnpm@10` |
| PostgreSQL | 16 | System package or Docker |
| Git | Any | System package |

The required versions are enforced by the root `package.json` `engines` field (`node >=24.0.0`, `pnpm >=10.0.0`). pnpm will warn and may refuse to install if versions are lower.

On Replit, all prerequisites are pre-installed via `replit.nix` and the `nodejs-24` / `postgresql-16` modules. Skip manual installation.

---

## Step 1: Clone and Install

```bash
# Clone (external contributors)
git clone https://github.com/szl-holdings/platform.git
cd platform

# Install all workspace dependencies (frozen lockfile for reproducibility)
pnpm install --frozen-lockfile
```

**Expected output:** `Done in Xs` with no `ERR_PNPM_*` errors. A `node_modules/.pnpm` directory is created at the workspace root; each artifact gets its own `node_modules` with symlinks.

---

## Step 2: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Generate required secrets
openssl rand -hex 32   # → use as SESSION_SECRET
openssl rand -hex 32   # → use as OAUTH_STATE_SECRET
```

Edit `.env` and set **at minimum** these variables (see `.env.example` for full list with classifications):

```bash
# Required-local: must be set for any local run
DATABASE_URL=postgresql://user:password@localhost:5432/szlholdings
SESSION_SECRET=<generated above>

# Optional: leave blank to use mock/demo mode for AI features
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

**On Replit:** Environment variables are set via Replit Secrets (Settings → Secrets). The `DATABASE_URL` for the Replit-managed PostgreSQL database is injected automatically when you enable the PostgreSQL module. Do not store secrets in `.env` on Replit.

---

## Step 3: Database Setup

```bash
# Run migrations (creates all tables)
pnpm migrate

# Seed demo data (required for first run)
pnpm seed:demo
```

Both commands exit 0 on success and print a clear error on failure. If `DATABASE_URL` is not set, `pnpm migrate` will fail immediately with a connection error — fix the URL and re-run.

**To verify the migration applied (optional, requires psql):**
```bash
psql "$DATABASE_URL" -c "\dt" | head -20
# Expected: list of tables including users, tenants, decisions, etc.
```

Do not health-check the API server yet — it has not started. Health verification is in Step 5.

---

## Step 4: Start Core Artifacts

The platform runs as a collection of Vite dev servers behind a shared proxy. Start artifacts in this sequence:

### Option A: Start all artifacts (parallel)

```bash
pnpm dev
```

This runs `pnpm -r --if-present run dev` across the workspace. All artifacts with a `dev` script start concurrently.

### Option B: Start specific artifacts (recommended for development)

Start in order — API server must be healthy before frontends:

```bash
# Terminal 1: API Server (required for all frontends)
pnpm --filter @workspace/api-server dev

# Terminal 2: SZL Holdings (main dashboard, Lyte embedded)
pnpm --filter @workspace/szl-holdings dev

# Terminal 3: Any other artifact you're working on
pnpm --filter @workspace/counsel dev
pnpm --filter @workspace/terra dev
pnpm --filter @workspace/vessels dev
# etc.
```

### Option C: Docker Compose (API + core web apps)

```bash
# Requires Docker Desktop
cp .env.example .env   # fill in DATABASE_URL etc.
docker-compose up --build

# Services start on:
#   API:          http://localhost:3000
#   SZL Holdings: http://localhost:4000
#   Vessels:      http://localhost:4002
#   Terra:        http://localhost:4003
#   Aegis:        http://localhost:4004
#   Carlota Jo:   http://localhost:4005
```

Note: `docker-compose.yml` does not include sentra, counsel, pulse, lyte, command, or mockup-sandbox. Start those separately if needed.

---

## Step 5: Verify Health

```bash
# API health check
curl http://localhost:8080/api/health
# Expected: { "status": "ok", "services": { "database": { "status": "ok" }, ... } }

# Quick route smoke test
pnpm qa:routes

# Full site QA (routes + links + trust + meta + empty states)
pnpm qa:site
```

---

## Step 6: Run Tests (Optional)

```bash
# Unit tests
pnpm test:api

# Integration tests (requires running PostgreSQL)
DATABASE_URL=postgresql://... pnpm test:integration

# Component tests
pnpm test:components

# E2E tests (requires built artifacts + Playwright)
pnpm --filter @workspace/szl-holdings run build
pnpm test:e2e
```

---

## Artifact URLs (Local Dev)

Each artifact runs on its own port in local dev:

| Artifact | Local URL | Notes |
|----------|-----------|-------|
| SZL Holdings | `http://localhost:5173` | Default Vite port |
| API Server | `http://localhost:8080` | Express; health at `/api/health` |
| Lyte | `http://localhost:9090` | Configured in `.replit` |
| Counsel | Via proxy | Sub-path |
| Terra | Via proxy | Sub-path |
| Vessels | Via proxy | Sub-path |
| Mockup Sandbox | `http://localhost:21130` | Internal tooling |

**On Replit:** All artifacts are proxied through the Replit gateway. Access them at:  
`https://<your-repl>.<username>.repl.co/<artifact-path>/`

---

## Common Issues

### `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`
A package reference in the workspace is missing. Run `pnpm install --frozen-lockfile` again. If it persists, check that all `pnpm-workspace.yaml` globs are correct.

### `DATABASE_URL connection refused`
PostgreSQL is not running. Start it with `sudo service postgresql start` (Linux) or via Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=local postgres:16`.

### `Cannot find module '@szl-holdings/...'`
Workspace symlinks may be broken. Run `pnpm install --frozen-lockfile` to re-create them.

### Port already in use
Another process is using the port. Find it: `lsof -i :<port>` and kill it: `kill -9 <pid>`.

### `pnpm migrate` fails with "relation already exists"
The migration has already been applied. This is safe — Drizzle `db:push` is idempotent for existing schemas.

---

## Environment Variable Quick Reference

See `.env.example` for the full list. Each variable is annotated with its classification:

- `[required-local]` — Must be set for any local run
- `[required-prod]` — Must be set in production (Replit Secrets)
- `[optional]` — Service degrades gracefully to mock mode if absent
- `[demo-fallback]` — Has a hard-coded demo value; override for real data

Minimum set for local development (demo mode):

```bash
DATABASE_URL=postgresql://...     # [required-local]
SESSION_SECRET=<hex-32>           # [required-local]
```

Everything else is optional for local development — services fall back to mock/demo mode automatically.
