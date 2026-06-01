# Replit Runtime Audit — SZL Holdings Platform

**Date:** 2026-04-26
**Scope:** Replit environment runtime model, port assignments, env contracts, and known-good boot sequence.

---

## 1. Runtime Model

The SZL Holdings platform is a **pnpm monorepo** running 15+ artifacts in Replit's parallel-workflow runtime. Each artifact is an independent process bound to a unique `PORT`. Replit's path-based reverse proxy routes external requests to the appropriate artifact by URL prefix.

### Key constraints

| Constraint | Detail |
|---|---|
| Node runtime | Node ≥ 24 (via `nodejs-24` Nix module) |
| Package manager | pnpm ≥ 10 (enforced via `preinstall` hook) |
| Database | PostgreSQL 16 (via `postgresql-16` Nix module) |
| Process supervisor | Replit workflow engine (parallel mode) |
| Reverse proxy | Replit path-router — mTLS, no direct `localhost` access from browser |

---

## 2. Port Assignments

| Port | External | Artifact / Service |
|------|----------|--------------------|
| 8080 | 80 | `api-server` (primary API + WebSocket) |
| 9090 | 3000 | `lyte-command-center` (KORA — Decision Intelligence) |
| 21130 | 3001 | `szl-holdings` (main dashboard) |
| *(dynamic)* | — | All other web artifacts use `PORT` env var assigned at workflow start |

Port assignments are configured in `.replit` under `[[ports]]` and in each artifact's workflow command.

---

## 3. Artifact Inventory

| Artifact dir | Brand name | Kind | Preview path |
|---|---|---|---|
| `api-server` | API Server | backend | `/api/` |
| `szl-holdings` | SZL Holdings Dashboard | web | `/` |
| `a11oy` | A11oy — Brand Orchestration Layer | web | `/a11oy/` |
| `sentra` | Sentra / TENAX — Cyber Resilience | web | `/sentra/` |
| `counsel` | Counsel — Legal Matter Command | web | `/counsel/` |
| `lyte-command-center` | KORA — Decision Intelligence | web | `/lyte/` |
| `command` | Unified Command | web | `/command/` |
| `pulse` | Pulse / LUMINA — AI Executive Briefing | web | `/pulse/` |
| `terra` | Terra / DOMAINE — Real Estate Intelligence | web | `/terra/` |
| `vessels` | Vessels / SEXTANT — Maritime Intelligence | web | `/vessels/` |
| `carlota-jo` | Carlota Jo Consulting | web | `/carlota-jo/` |
| `aegis` | Aegis / PARAGON (archived → Sentra) | web | `/aegis/` |
| `szl-holdings-mobile` | CORTEX Mobile Command | mobile (Expo) | `/szl-holdings-mobile/` |
| `mockup-sandbox` | PRAXIS — Unified Agentic AI Layer | design | `/nexus/` |
| `szl-demo-video` | SZL Holdings Demo Video | video | `/szl-demo-video/` |

---

## 4. Environment Variable Contract

### 4.1 Required (server will refuse to start without these in production)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Session cookie signing secret (≥32 chars) |
| `SECRET_ENCRYPTION_KEY` | Field-level encryption key (≥32 chars) |
| `ISSUER_URL` | OIDC/auth issuer URL |
| `PUBLIC_APP_URL` | Canonical public URL for OIDC redirects and email links |

Validation is enforced by `artifacts/api-server/src/lib/startup-validation.ts` (`failFastOnInvalidConfig()`).

### 4.2 Recommended (service degrades gracefully without these)

| Variable | Purpose |
|---|---|
| `ALLOY_INTERNAL_TOKEN` | Internal service auth token (≥64 chars) |
| `CONNECTOR_ENCRYPTION_KEY` | OAuth connector credential encryption |
| `IP_HASH_SALT` | IP address hashing salt (≥32 chars) |
| `OAUTH_STATE_SECRET` | OAuth state CSRF token |
| `ADMIN_PIN` | Admin console numeric PIN |
| `CORS_ORIGINS` | Allowed CORS origins |
| `SENTRY_DSN` | Error tracking |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry tracing |

### 4.3 Optional integrations (mock/demo mode if absent)

AI: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_GEMINI_API_KEY`
Email: `RESEND_API_KEY`, `SENDGRID_API_KEY`
Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
Maritime: `MARINETRAFFIC_API_KEY`, `AISHUB_USERNAME`
Legal: `COURT_LISTENER_API_TOKEN`
Storage: `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`
Comms: `SLACK_BOT_TOKEN`, `SLACK_WEBHOOK_URL`, `TWILIO_ACCOUNT_SID`

Full list: see `.env.example`.

### 4.4 Replit-injected (do not set manually)

| Variable | Injected by |
|---|---|
| `REPL_ID` | Replit runtime |
| `REPLIT_DEV_DOMAIN` | Replit runtime |
| `DATABASE_URL` | Replit PostgreSQL module |
| `PORT` | Replit workflow engine (per-artifact) |

### 4.5 Production overrides (`.replit` → `[userenv.production]`)

```
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGINS=https://*.replit.app,https://*.replit.dev,https://*.repl.co
PUBLIC_APP_URL=https://szlholdings.replit.app
GUARDIAN_ENFORCE=true
DB_CONNECT_TIMEOUT_MS=90000
```

---

## 5. Health Check Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /healthz` | None | Liveness probe — returns server, database, auth, AI, storage, backup status |
| `GET /readyz` | None | Readiness probe — verifies DB connectivity before accepting traffic |
| `GET /health` | None | Alias for `/healthz` |
| `GET /health/detailed` | Admin/internal token in prod | Full diagnostics: pool stats, memory, env status |
| `GET /api/ready` | None | Alias for `/readyz` |
| `GET /api/health/ready` | None | Alias for `/readyz` |

All health endpoints are served by the `api-server` artifact on its assigned `PORT` (external port 80 / internal port 8080).

**liveness vs readiness:**
- `/healthz` (liveness): server process is alive. Does a lightweight DB ping.
- `/readyz` (readiness): server is fully bootstrapped and ready to handle traffic. Returns 503 during the migration/seed bootstrap phase.

---

## 6. Known-Good Boot Sequence

### Development (local / Replit dev environment)

```
pnpm install                    # install all workspace dependencies
pnpm run codegen                # generate API client types from spec
pnpm migrate                    # apply database migrations (push-non-interactive)
pnpm seed:demo                  # seed demo data (ENABLE_DEMO_SEED=true)
pnpm dev                        # start all artifacts in parallel
```

Or use the bootstrap script:
```
bash scripts/bootstrap.sh       # idempotent: install → codegen → migrate → seed → validate
```

### API server startup sequence (internal)

1. `failFastOnInvalidConfig()` — validates env vars, logs missing required vars, calls `process.exit(1)` on failure.
2. Database migration (`runMigrations()`) — applies any pending Drizzle schema migrations.
3. `runBootSeedSequence()` — seeds platform defaults, guardian tiers, AI budget policies, knowledge base, etc.
4. Feature flags, GraphQL middleware, agent scheduler, prism bus, WebSocket, self-monitor, health degradation watcher all initialize.
5. HTTP server switches from 503 "starting" handler to live handler.
6. `logger.info('[startup] API server fully ready — configuration summary')` is emitted.

### Fail-fast behaviour

- `PORT` not set → `throw new Error('PORT environment variable is required but was not provided.')` (hard crash).
- Required env vars missing in production → `failFastOnInvalidConfig()` logs all missing vars and calls `process.exit(1)`.
- Migration failure → `logger.fatal(...)` + `process.exit(1)`.

---

## 7. Helper Scripts

| Script | Purpose |
|---|---|
| `scripts/bootstrap.sh` | Idempotent full bootstrap (install → codegen → migrate → seed → env validate) |
| `scripts/doctor.sh` | Runtime diagnostics: env, ports, DB, API health |
| `scripts/verify.sh` | Thin wrapper: env validation + API health check |
| `scripts/release/alpha.sh` | Alpha release gate (env → brand → typecheck → tests → publish) |
| `scripts/screenshots/refresh.sh` | Refresh product screenshots (requires platform running) |
| `scripts/inventory/generate.sh` | Generate workspace artifact inventory |
| `scripts/qa/verify-env.js` | Structured env var check (required / recommended / optional) |
| `scripts/qa/health-check.js` | API server health probe (all downstream services) |
| `scripts/post-merge.sh` | Post-merge hook (install → migrate → seed → brand-check) |

---

## 8. Canonical Commands

### Development
```bash
pnpm dev          # start all artifacts in parallel (Replit: use "Run" button)
```

### Production-ish (local simulation)
```bash
# Note: pnpm start is an alias for pnpm dev in package.json.
# Set NODE_ENV to activate production env vars and [userenv.production] overrides:
NODE_ENV=production pnpm dev    # starts all artifacts with production env vars
```

### One-shot bootstrap
```bash
bash scripts/bootstrap.sh       # safe to run after any fresh clone or upstream pull
```

### Pre-flight check
```bash
bash scripts/doctor.sh          # diagnose env, ports, DB, API health before starting
```

### Verify after start
```bash
bash scripts/verify.sh          # env validation + API health check
```

---

## 9. `.replit` Notes (Known)

| Item | Status |
|---|---|
| `artifacts/pluginmesh` | Present in the repo and registered as a workflow; not in the main registered artifact list but operational as a standalone web artifact |
| `praxis-smoke-e2e` workflow | Depends on Playwright and a built `mockup-sandbox` dist — not run in normal dev mode |
| `GI Design System Storybook` workflow | Requires `@workspace/storybook` to be installed and built |
| `security-tests` and `brand-strings` | Validation workflows — run independently, not blocking the main dev start |

---

## 10. Known Limitations

- **No central process manager**: each Replit workflow is independent; there is no automatic restart policy across artifacts.
- **No shared port registry**: port assignments are manually documented here and in `.replit`. Conflicts require manual resolution.
- **Demo mode fallback**: missing optional integrations silently degrade to mock data — this is intentional for demo environments but can mask misconfiguration in production.
- **Bootstrap is non-atomic**: if `seed:demo` fails mid-run, some tables may be partially populated. Re-running `bash scripts/bootstrap.sh` is safe and idempotent.
