# SZL Holdings — Platform Canonical Reference

**Canonical version:** April 16, 2026
**Status:** Authoritative — supersedes all prior runtime/build references in scattered docs
**Audience:** Engineers, CI/CD systems, deployment operators

---

## Runtime Stack (Canonical)

| Component | Canonical Version | Source of Truth |
|---|---|---|
| **Node.js** | **22 LTS** | Dockerfiles (`node:22-alpine`); CI (`node-version: '22'`); `engines` in `package.json`. Replit dev env uses Node 24 (platform constraint — acceptable gap, compatible) |
| **pnpm** | **10.x (10.26.1)** | Verified: `pnpm --version` output |
| **PostgreSQL** | **16** | `.replit` → `modules = ["postgresql-16"]` |
| **TypeScript** | **5.x** | `pnpm-workspace.yaml` catalog; enforced via `tsconfig` |
| **NixOS channel** | **stable-25_05** | `.replit` → `[nix] channel = "stable-25_05"` |
| **Replit Nix extras** | See `replit.nix` | Chromium, OpenGL, X11 libraries for Playwright |

### CI/CD Runtime (Phase 2 Complete)

> ✅ Phase 2 complete — CI now uses Node.js 22 and pnpm 10. Dockerfiles use node:22-alpine. The Replit dev environment uses Node.js 24 (platform-managed, acceptable gap — Node 24 is compatible). `engines` field enforced in root `package.json`.

---

## Package Manager (Canonical)

**pnpm** is the only supported package manager. `npm` and `yarn` must never be used in this workspace.

- Workspace config: `pnpm-workspace.yaml`
- Lock file: `pnpm-lock.yaml`
- Install command: `pnpm install` (frozen lockfile in CI: `pnpm install --frozen-lockfile`)
- Package catalog: `pnpm-workspace.yaml` → `catalog:` section defines pinned versions for shared dependencies (React 19, Vite 7, Drizzle 0.45.1, Tailwind 4, Zod 3.25, etc.)

### Workspace Package Name Conventions

| Scope | Convention | Examples |
|---|---|---|
| Artifacts | `@workspace/<name>` | `@workspace/api-server`, `@workspace/vessels` |
| Libraries | `@szl-holdings/<name>` | `@szl-holdings/db`, `@szl-holdings/shared-ui` |
| Object storage wrapper | `@workspace/object-storage-web` | Exception to lib naming convention |

---

## Build Commands (Canonical)

### Root-Level (Monorepo)

| Command | Purpose |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages with `build` script |
| `pnpm typecheck` | TypeScript typecheck across all libs |
| `pnpm typecheck:libs` | Typecheck shared libraries only |
| `pnpm lint` | ESLint across all packages |
| `pnpm test` | Run test suite |
| `pnpm test:api` | API-level tests |
| `pnpm test:integration` | Integration tests (not yet wired to CI) |
| `pnpm test:e2e` | End-to-end tests (no active suite yet) |
| `pnpm seed` | Run canonical seed |
| `pnpm seed:all` | Run all seed scripts |
| `pnpm migrate` | Run Drizzle schema migration (`db:push`) |
| `pnpm start` | Alias for `pnpm -r --if-present run dev` — starts all artifact dev servers (same as `pnpm dev`; not a production server start) |
| `pnpm health:check` | Ping API health endpoints |

### Per-Artifact Commands

Most web artifacts support: `pnpm dev`, `pnpm build`, `pnpm serve`, `pnpm typecheck`

**Exceptions:**
- `artifacts/mockup-sandbox` — uses `pnpm preview` instead of `pnpm serve` (Vite preview mode)
- `artifacts/api-server` — no `serve` script; uses `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm typecheck`

API server additionally supports: `pnpm seed:terra`, `pnpm seed:ecosystem`

### Audit Scripts

| Command | Purpose |
|---|---|
| `pnpm audit:mocks` | Detect mock data in production paths |
| `pnpm audit:routes` | Verify all registered routes exist as files |
| `pnpm audit:copy` | Find stale/placeholder copy |
| `pnpm audit:deps` | Check dependency version conflicts |
| `pnpm audit:design-system` | Check for hardcoded colors/fonts |
| `pnpm audit:broken-links` | Find broken internal imports |
| `pnpm audit:all` | Run all audits sequentially |

---

## Monorepo Structure (Canonical)

```
/
├── artifacts/          # Deployable applications (web + mobile)
│   ├── api-server/     # Central Express API (all backend routes)
│   ├── aegis/          # Security command (Unified Defense & Intelligence)
│   ├── carlota-jo/     # Private advisory
│   ├── command/        # Unified Command Portal (CORTEX hub)
│   ├── firestorm/      # ARCHIVED — superseded by aegis (marker file only)
│   ├── mockup-sandbox/ # Internal design tool
│   ├── prism-counsel/  # DEPRECATED — consolidated into aegis (marker file only)
│   ├── stephen-site/   # DEPRECATED — consolidated into szl-holdings (marker file only)
│   ├── szl-holdings/   # Corporate platform + Lyte
│   ├── szl-holdings-mobile/ # Mobile app (Expo)
│   ├── terra/          # Real estate intelligence
│   └── vessels/        # Maritime intelligence
├── lib/                # Shared libraries (33 with package.json)
├── scripts/            # Build, seed, deploy, QA scripts
├── packages/           # Shared packages (Atlassian Connect, etc.)
├── infra/              # Azure Bicep IaC templates
├── docs/               # Platform documentation
│   ├── audit/          # This audit (authoritative)
│   ├── trust/          # Security and trust documentation
│   └── ...             # Product and investor docs
├── .github/workflows/  # CI/CD pipeline definitions
├── pnpm-workspace.yaml # Workspace package catalog
├── .replit             # Replit platform configuration
└── replit.nix          # Nix environment for Replit
```

---

## Environment Loading (Canonical)

### Precedence Order (highest to lowest)

1. **Replit Secrets** — `DATABASE_URL`, `SESSION_SECRET`, `ALLOY_INTERNAL_TOKEN`, AI proxy keys, PGPASSWORD
2. **`.replit [userenv.production]`** — `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGINS`, `PUBLIC_APP_URL` (applied automatically in production deployment)
3. **`.replit [userenv.shared]`** — `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT` (applied in all environments)
4. **`.env`** (local dev only, never committed) — local overrides from `.env.example` template

**Never commit `.env` to source control.** The `.env.example` file is the canonical reference and uses `YOUR_*_HERE` placeholder values.

---

## Database (Canonical)

| Attribute | Value |
|---|---|
| Engine | PostgreSQL 16 |
| ORM | Drizzle ORM `0.45.1` |
| Migration strategy | Forward-only (`drizzle-kit push`) — no rollback migrations |
| Schema location | `lib/db/src/schema/` |
| Connection | `DATABASE_URL` environment variable (primary) |
| Seed strategy | Idempotent seeds using `onConflictDoNothing()` |
| Session store | In-memory (all environments — Redis is documented but not activated; sessions lost on restart — see audit B-10) |

---

## Authentication (Canonical)

| Attribute | Value |
|---|---|
| Protocol | OpenID Connect (OIDC) with PKCE |
| Provider | Replit Auth (`https://replit.com/oidc`) |
| Library | `@szl-holdings/replit-auth-web` (frontend), `lib/auth` (backend) |
| Sessions | Express session with cookie-based tokens |
| RBAC roles | Dual system: `platformRole` enum (12 values) + `rolesTable` (4 roles). Consolidation required — see audit B-05. Canonical roles: `founder_admin`, `platform_admin`, `operator`, `analyst`, `executive_viewer`, `ops_manager`, `sales_delivery_user`, `maritime_ops_user`, `service_coordinator`, `pilot_customer_user`, `compliance_viewer`, `anonymous_visitor` |
| Internal token | `ALLOY_INTERNAL_TOKEN` → grants `super_admin`; service-to-service only |

---

## CI Expectations (Canonical)

All of the following must pass before any merge to `master`/`main`:

1. `pnpm run lint` — ESLint (zero errors)
2. `pnpm run typecheck` — TypeScript (zero errors)
3. `pnpm run test` — Test suite (zero failures)
4. `pnpm -r --if-present run build` — All packages build successfully

**Integration tests (`pnpm test:integration`) are not yet part of the CI gate.** This is a tracked gap in `docs/known-gaps.md`. Phase 3 adds this step.

---

## Post-Merge Automation

`scripts/post-merge.sh` runs automatically after every task merge (configured in `.replit [postMerge]`, timeout 120 seconds):

1. `pnpm install` — sync dependencies
2. `pnpm --filter db push` — apply schema migrations
3. Build integrity verification

---

*This document is the canonical reference. Update it when runtimes, build tooling, or workspace structure changes. Do not let individual package README files diverge from this document.*
