# Local Bootstrap Guide

**Platform:** SZL Holdings Monorepo  
**Updated:** 2026-10-07
**Audience:** Engineers, contributors, QA

> **Source boundary:** This is a local-development guide, not deployment proof.
> Package names, required variables, and listener ports are service-specific.
> The historical `@workspace/api-server` and `@workspace/szl-holdings` start
> commands are no longer valid in the tracked tree; current runnable HTTP
> implementations live under `apps/*`, and current browser packages are listed
> below.

---

## Prerequisites

| Tool | Required Version | Install |
|------|-----------------|---------|
| Node.js | ≥24.0.0 (24.x LTS recommended) | [nodejs.org](https://nodejs.org) or `nvm install 24` |
| pnpm | 10.26.1 exactly | Corepack using the root `packageManager` pin |
| PostgreSQL | 16 | System package or Docker |
| Git | Any | System package |

The required versions are enforced by the root `package.json` `engines` field
(`node >=24.0.0`, exact `pnpm 10.26.1`) and the preinstall guard. The activation
helper prefers Corepack and uses an exact, script-disabled npm bootstrap only
when Corepack is absent; other pnpm versions fail closed. A cache miss needs
access to `registry.npmjs.org`, while a preseeded Corepack cache works offline.

`.replit` and `replit.nix` declare Node 24 and PostgreSQL 16 targets. Verify the
effective versions in any provider environment; source configuration does not
prove that a module was installed or a database was provisioned.

---

## Step 1: Clone and Install

```bash
# Clone (external contributors)
git clone https://github.com/szl-holdings/platform.git
cd platform

# Put the repository-managed exact shim ahead of any system fallback. The
# helper uses Corepack when available and a pinned npm bootstrap on Node 25+.
source scripts/activate-pnpm.sh
test "$(pnpm --version)" = "10.26.1"

# Install all workspace dependencies (frozen lockfile for reproducibility).
# CPU binaries are already packaged; skip the optional CUDA/NuGet download.
ONNXRUNTIME_NODE_INSTALL=skip pnpm install --frozen-lockfile
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

Edit `.env` only for the services you intend to run. There is no safe
whole-estate “minimum” set: each service's `.env.example`, startup validation,
and README are authoritative for its boundary. A database-backed path commonly
needs:

```bash
# Required-local: must be set for any local run
DATABASE_URL=postgresql://user:password@localhost:5432/szlholdings
SESSION_SECRET=<generated above>

# Provider values are package-specific; a blank value is not a universal mock switch
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

**Managed providers:** Bind secret values through the provider's secret vault.
Do not assume `DATABASE_URL` or any other value is injected until the runtime
configuration reports the binding ready and the service verifies it. Never
commit `.env`.

---

## Step 3: Database Setup

```bash
# Run migrations (creates all tables)
pnpm migrate

# Seed the canonical demo data only when that database-backed workflow needs it
pnpm seed:demo
```

Both commands are database mutations. Run them only against an explicitly
selected development database and inspect any failure; do not infer
idempotency or production safety from a local exit code.

**To verify the migration applied (optional, requires psql):**
```bash
psql "$DATABASE_URL" -c "\dt" | head -20
# Expected: list of tables including users, tenants, decisions, etc.
```

Do not health-check the API server yet — it has not started. Health verification is in Step 5.

---

## Step 4: Start Core Artifacts

The repository contains browser artifacts plus independent services/workers.
There is no single required startup sequence for every task.

### Option A: Start all artifacts (parallel)

```bash
pnpm dev
```

This runs `pnpm -r --if-present run dev` across the workspace. Packages with
required credentials or dependencies can fail independently; this command is a
fan-out convenience, not a healthy-platform assertion.

### Option B: Start specific artifacts (recommended for development)

Start only the packages needed for the task:

```bash
# Browser artifacts
pnpm --filter @workspace/a11oy dev
pnpm --filter @workspace/carlota-jo dev
pnpm --filter @workspace/counsel dev
pnpm --filter @workspace/terra dev
pnpm --filter @workspace/vessels dev

# Independent TypeScript HTTP services (configure each service first)
pnpm --filter @workspace/alloy-runtime-api dev
pnpm --filter @workspace/alloy-embedding-api dev
pnpm --filter @workspace/alloy-ingestion-orchestrator dev
```

### Bounded local Docker Compose stack

```bash
# Add the required fail-closed runtime identity to the untracked .env file:
ALLOY_API_KEY=<local-secret>
ALLOY_API_TENANT_ID=<local-tenant-id>

docker compose --env-file .env -f ops/local/docker-compose.yml config --quiet
docker compose --env-file .env -f ops/local/docker-compose.yml up --build
```

`ops/local/docker-compose.yml` is a bounded convenience stack containing only
tracked deployable Dockerfiles: `alloy-runtime-api`, `vessels`, `terra`, and
`carlota-jo`. It does not include PostgreSQL or represent the whole platform.
Its configuration currently validates with Docker Compose when the required
API key and tenant are supplied. That source/configuration check does not prove
that images build, processes become ready, downstream dependencies work, or
the same images are deployed anywhere. Record those observations separately
before using this stack as release or deployment evidence.

---

## Step 5: Verify Health

```bash
# Quick route smoke test
pnpm qa:routes

# Full site QA (routes + links + trust + meta + empty states)
pnpm qa:site
```

For a service listener, use the health/readiness paths and port documented by
that package and inspect the response semantics; do not substitute one service's
`/health` response for whole-platform readiness. A successful liveness response
does not prove credentials, tenants, models, databases, or downstream adapters
are ready.

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
pnpm --filter @workspace/a11oy run build
pnpm test:e2e
```

---

## Local URLs

Vite and service ports are selected by each package configuration and may move
when a port is occupied. Use the URL printed by the process. `.replit` and
artifact TOML files declare provider routing targets, but they do not prove a
gateway is active or that any public URL is reachable.

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
Stop and inspect the selected database and schema history. Do not assume the
error is safe or that `db:push` is idempotent across every schema change.

---

## Python Dependencies (Media & OG-Card Scripts)

Most of the platform is TypeScript, but a handful of media/asset scripts are
Python. Their dependencies are managed by [`uv`](https://docs.astral.sh/uv/) and
the manifest now lives at `scripts/media/`:

- `scripts/media/pyproject.toml` — declared deps (Pillow, python-docx,
  requests, requests-oauthlib)
- `scripts/media/uv.lock` — locked resolution; commit alongside the manifest

To install or refresh the environment:

```bash
cd scripts/media
uv sync          # installs the locked package set into a project venv
uv lock          # regenerate the lockfile after editing pyproject.toml
```

Run the Python scripts from the repo root with `uv run` so they pick up the
managed environment:

```bash
uv run --project scripts/media python scripts/media/build_carousel.py
uv run --project scripts/media python scripts/generate_og_cards.py
```

`scripts/generate_og_cards.py` uses `Pillow`, which is already provided by
`scripts/media/pyproject.toml`, so it shares the same `uv` environment — there
is no separate manifest at the repo root anymore.

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

Do not apply one fallback rule to the whole repository. Several services now
fail closed without explicit authentication, tenant, signing, model, or backend
configuration, especially in production mode. Follow each package's startup
contract and use an explicit development/test-only bypass only where that
package documents and enforces one.
