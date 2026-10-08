# SZL Holdings — Platform Canonical Reference

**Canonical version:** October 6, 2026
**Status:** Authoritative — supersedes all prior runtime/build references in scattered docs
**Audience:** Engineers, CI/CD systems, deployment operators

---

## Runtime Stack (Canonical)

| Component | Canonical Version | Source of Truth |
|---|---|---|
| **Node.js** | **>=24** | Root `engines`; Node 24 GitHub/CircleCI/devcontainer; digest-pinned Node 26 service builders |
| **pnpm** | **10.26.1 exactly** | Root `packageManager` + `engines`, preinstall guard, and `scripts/activate-pnpm.sh` |
| **PostgreSQL** | **16 target** | `.replit` declares `modules = ["postgresql-16"]`; no live database version is inferred |
| **TypeScript** | **6.x** | `pnpm-workspace.yaml` catalog; enforced via `tsconfig` |
| **NixOS channel** | **stable-25_05** | `.replit` → `[nix] channel = "stable-25_05"` |
| **Replit Nix extras** | Source declaration | `replit.nix` lists Chromium, OpenGL, and X11 libraries for Playwright; installation/runtime state is separate evidence |

### CI/CD Source Contract

> GitHub Actions, CircleCI, `.replit`, and devcontainer source configuration
> declare Node 24. Reviewed Node service Dockerfiles declare digest-pinned Node
> 26 images. Both satisfy the root Node >=24 contract at the configuration
> layer. Every executed path must still prove that bare `pnpm` resolves to
> 10.26.1 exactly before install, build, or test.

---

## Package Manager (Canonical)

**pnpm** is the only supported package manager for workspace dependencies.
The bootstrap helper may use npm solely to install the exact pnpm executable
when running on a Node release that does not bundle Corepack; it never resolves
the workspace dependency graph with npm.

- Workspace config: `pnpm-workspace.yaml`
- Lock file: `pnpm-lock.yaml`
- Bootstrap: `source scripts/activate-pnpm.sh` (Corepack-first, exact fallback)
- Install command: `pnpm install --frozen-lockfile`
- Package catalog: `pnpm-workspace.yaml` → `catalog:` is the machine-readable authority; do not maintain a second version list here

### Workspace Package Name Conventions

| Scope | Convention | Examples |
|---|---|---|
| Artifacts | `@workspace/<name>` | `@workspace/vessels`; `@workspace/api-server` is a retained compatibility-stub name |
| Libraries | `@szl-holdings/<name>` | `@szl-holdings/db`, `@szl-holdings/shared-ui` |
| Object storage wrapper | `@workspace/object-storage-web` | Exception to lib naming convention |

---

## Build Commands (Canonical)

### Root-Level (Monorepo)

| Command | Purpose |
|---|---|
| `pnpm install --frozen-lockfile` | Install the committed dependency graph |
| `pnpm build` | Build all packages with `build` script |
| `pnpm typecheck` | TypeScript typecheck across all libs |
| `pnpm typecheck:libs` | Typecheck shared libraries only |
| `pnpm lint` | ESLint across all packages |
| `pnpm test` | Run test suite |
| `pnpm test:api` | API-level tests |
| `pnpm test:integration` | Integration tests (not yet wired to CI) |
| `pnpm test:e2e` | Run the Playwright end-to-end suite; hosted E2E uses `.github/workflows/e2e.yml` |
| `pnpm seed` | Run canonical seed |
| `pnpm seed:all` | Run all seed scripts |
| `pnpm migrate` | Run Drizzle schema migration (`db:push`) |
| `pnpm start` | Alias for `pnpm -r --if-present run dev` — starts workspace packages that define `dev`; not a production server start |
| `pnpm health:check` | Run the legacy configurable HTTP health probe; default mode can report degraded secondary checks with exit 0, so use deployment-bound strict evidence for promotion |

### Per-Artifact Commands

Most web artifacts support: `pnpm dev`, `pnpm build`, `pnpm serve`, `pnpm typecheck`

**Boundary:**
- `artifacts/api-server` — historical compatibility stub with only a
  `typecheck` script and one narrow route export; it has no `dev`, `build`,
  `start`, `serve`, or seed script and is not the runnable canonical backend.
- Current startable Express implementations in `apps/*` are
  `apps/alloy-runtime-api`, `apps/alloy-embedding-api`, and
  `apps/alloy-ingestion-orchestrator`. Their source presence establishes
  implementations, not deployment, provider, or production authority.
- Python service implementations also exist under `apps/*`; each has its own
  package/run contract. No whole-estate Python runtime or deployment is implied.

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
├── apps/               # Service implementations; source presence is not deployment evidence
│   ├── alloy-runtime-api/          # Startable TypeScript/Express runtime API
│   ├── alloy-embedding-api/        # Startable TypeScript/Express embedding API
│   └── alloy-ingestion-orchestrator/ # Startable TypeScript/Express ingestion API
├── artifacts/          # Browser/mobile artifacts plus compatibility packages
│   ├── a11oy/          # React/Vite browser artifact
│   ├── api-server/     # Historical compatibility stub; not a central runnable API
│   ├── carlota-jo/     # React/Vite browser artifact
│   ├── counsel/        # React/Vite browser artifact
│   ├── sentra/         # React/Vite browser artifact
│   ├── szl-holdings/   # Retained static OG assets; no package.json
│   ├── terra/          # React/Vite browser artifact
│   └── vessels/        # React/Vite browser artifact
├── lib/                # Shared libraries
├── scripts/            # Build, seed, deploy, QA scripts
├── packages/           # Shared packages (Atlassian Connect, etc.)
├── services/           # Additional service implementations (TypeScript and Python)
├── workers/            # Worker implementations (TypeScript and Python)
├── infra/              # Azure-oriented Bicep target templates; not deployment evidence
├── docs/               # Platform documentation
│   ├── audit/          # This audit (authoritative)
│   ├── trust/          # Security and trust documentation
│   └── ...             # Product and investor docs
├── .github/workflows/  # CI/CD pipeline definitions
├── pnpm-workspace.yaml # Workspace package catalog
├── .replit             # Replit target/source configuration; not a live receipt
└── replit.nix          # Replit-oriented Nix source configuration
```

---

## Environment Loading (Source Contract)

The following is the repository's Replit-oriented loading target, not evidence
that any named value or provider binding is active. Exact deployment bindings
and provider remain **UNKNOWN** without a dated environment receipt.

### Declared Precedence Order (highest to lowest)

1. **Provider secret bindings when configured** — application code expects names such as `DATABASE_URL`, `SESSION_SECRET`, and `ALLOY_INTERNAL_TOKEN`; values and active bindings are not recorded here
2. **`.replit [userenv.production]`** — source declares `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGINS`, and `PUBLIC_APP_URL` for a Replit production target
3. **`.replit [userenv.shared]`** — source declares shared values such as `VAPID_PUBLIC_KEY` and `VAPID_SUBJECT`
4. **`.env`** (local dev only, never committed) — local overrides from `.env.example` template

**Never commit `.env` to source control.** The `.env.example` file is the canonical reference and uses `YOUR_*_HERE` placeholder values.

---

## Database (Canonical)

| Attribute | Value |
|---|---|
| Engine | PostgreSQL 16 source target; active engine/version **UNKNOWN** |
| ORM | Drizzle ORM `0.45.2` |
| Migration strategy | Forward-only (`drizzle-kit push`) — no rollback migrations |
| Schema location | `lib/db/src/schema/` |
| Connection | `DATABASE_URL` environment variable (primary) |
| Seed strategy | Idempotent seeds using `onConflictDoNothing()` |
| Session store | Source defaults include in-memory implementations; active environment and persistence are **UNKNOWN** — see audit B-10 |

---

## Authentication (Canonical)

| Attribute | Value |
|---|---|
| Protocol | OpenID Connect (OIDC) with PKCE |
| Provider | Source includes Replit Auth (`https://replit.com/oidc`); active deployment provider/mode **UNKNOWN** |
| Library | `@szl-holdings/replit-auth-web` (frontend), `lib/auth` (backend) |
| Sessions | Express session with cookie-based tokens |
| RBAC vocabularies | Three divergent source vocabularies are present: the 12-value `platformRole` column enum in `lib/db/src/schema/auth.ts`, the separate 16-value `rolesTable.name` enum in that file, and the 14-role hierarchy in `packages/auth-shared/src/types.ts`. No estate-wide canonical mapping is established; convergence or an explicit tested mapping is required — see audit B-05 and `docs/security-posture.md`. |
| Internal service token | Source consumers use `ALLOY_INTERNAL_TOKEN` for service-to-service calls. Current active source does not establish that possession of this token maps to `super_admin`; authorization scope, tenant binding, and deployed configuration remain service-specific and unverified. |

---

## CI Expectations (Canonical)

Workflow source and live branch enforcement are separate authorities:

- `.github/workflows/ci.yml` runs dependency-free clean-clone contracts on
  Ubuntu and Windows, then lint and full-workspace typecheck jobs.
- Test, build, runtime-audit, E2E, security, CodeQL, dependency-review,
  reproducibility, and Grype controls are declared in separate workflows with
  their own triggers.
- The exact contexts enforced before merge are only those in the dated,
  authenticated ruleset receipt at
  `audit/evidence/github-platform-ruleset-summary-2026-10-06.json`.

Local `pnpm test`, `pnpm run typecheck`, and `pnpm run build` results are
promotion evidence, but they are not represented as branch-required merely
because they passed locally or exist in workflow source.

---

## Post-Merge Automation

`.replit [postMerge]` declares `scripts/post-merge.sh` with a 1,200,000 ms /
20-minute timeout. Whether a given checkout/provider executes that hook must be
observed separately. When executed, the script is intended to:

1. Activate and verify exact pnpm 10.26.1, then perform a frozen install.
2. Attempt the bounded non-interactive database schema push; this migration is
   explicitly best-effort and logs failure.
3. Restore the capability-manifest symlink and attempt bounded solution-brief
   regeneration.

---

*This document is the canonical reference. Update it when runtimes, build tooling, or workspace structure changes. Do not let individual package README files diverge from this document.*
