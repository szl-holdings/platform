# Developer Onboarding — 10-Minute Path

**Goal:** From a clean clone to a running artifact with tests passing in under 10 minutes.

> See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full contribution workflow, branch naming, PR requirements, and engineering standards.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 22+ | `node --version` |
| pnpm | 10+ | `pnpm --version` |
| PostgreSQL | 16 | `psql --version` |

No Docker required. No virtual environments. PostgreSQL must be running locally or accessible via `DATABASE_URL`.

---

## Step 1 — Clone and Install

```bash
git clone https://github.com/szl-holdings/szl-holdings-platform.git
cd szl-holdings-platform
pnpm install
```

pnpm installs all workspace packages from root. This takes 60–90 seconds on first run. Subsequent installs are cached.

---

## Step 2 — Environment Setup

Copy the environment template and fill in required values:

```bash
cp ops/infra/.env.example .env
```

Minimum required for local development:

```env
DATABASE_URL=postgresql://localhost:5432/szl_dev
SESSION_SECRET=any-32-char-string-for-local-dev
NODE_ENV=development
```

Full variable reference: [`docs/operations/environment-variables.md`](operations/environment-variables.md)

Secrets reference (AI keys, third-party tokens): [`docs/security/secrets-setup.md`](security/secrets-setup.md)

---

## Step 3 — Database Setup

```bash
# Run all migrations
pnpm --filter @workspace/api-server db:migrate

# Seed demo data
pnpm --filter @workspace/api-server db:seed
```

This creates all schema tables and loads representative demo data across all domain packs.

---

## Step 4 — Start One Artifact

Pick any artifact to start. The API server must run alongside it.

**Recommended starting point — Carlota Jo (most complete, GA status):**

```bash
# Terminal 1: Start the API server
pnpm --filter @workspace/api-server dev

# Terminal 2: Start the artifact
pnpm --filter @workspace/carlota-jo dev
```

Other artifact filter names:

| Artifact | Filter name |
|----------|-------------|
| Sentra — Cyber Resilience | `@workspace/sentra` |
| Counsel — Legal Matter | `@workspace/counsel` |
| Command — Unified Command | `@workspace/command` |
| Vessels — Maritime Intel | `@workspace/vessels` |
| Pulse — AI Briefing | `@workspace/pulse` |
| Aegis — Defense & Intel | `@workspace/aegis` |
| Terra — Real Estate | `@workspace/terra` |
| SZL Holdings Dashboard | `@workspace/szl-holdings` |

Once running, open the preview in your browser. Each artifact's primary route is listed in its own `README.md` under `artifacts/<name>/README.md`.

---

## Step 5 — Run Tests

```bash
# Security test suite (runs in CI on every push)
pnpm --filter @workspace/api-server test

# TypeScript typecheck across all packages
pnpm typecheck

# Lint all packages
pnpm lint
```

The security test suite (`security-middleware.test.ts`, `security-routes.test.ts`, `security-hardening.test.ts`) is the CI blocking gate. It must pass before any PR merges.

---

## Step 6 — Verify README Assets

```bash
pnpm readme:check
```

This validates all local image paths in `README.md` exist on disk and all badge workflow references point to real workflow files. Run this before any PR that touches `README.md` or documentation assets.

---

## Monorepo Layout Quick Reference

```
szl-holdings-platform/
├── artifacts/          # 14 deployable surfaces (web, mobile, API, video)
│   ├── api-server/     # Shared Express backend — start this first
│   ├── carlota-jo/     # Best starting artifact (GA, fully functional)
│   └── <others>/       # See artifacts/<name>/README.md for each
├── lib/                # 41 shared libraries: db, auth, AI, event bus, UI
├── packages/           # 82 domain packages: design system, agent core, evidence ledger
├── docs/               # Architecture, security, investor, and operations docs
│   └── architecture/   # Canonical system architecture (start here for deep dives)
├── scripts/            # Seed, QA, screenshot capture, and validation utilities
└── .github/
    ├── assets/screenshots/  # Canonical artifact hero screenshots
    └── workflows/           # CI, CodeQL, security, and README QA pipelines
```

---

## Where to Go Next

| Goal | Resource |
|------|----------|
| Understand the platform architecture | [`docs/architecture/architecture.md`](architecture/architecture.md) |
| See all environment variables | [`docs/operations/environment-variables.md`](operations/environment-variables.md) |
| Understand the security model | [`docs/security/access-control-matrix.md`](security/access-control-matrix.md) |
| See the full artifact status | [`docs/APP_STATUS.md`](APP_STATUS.md) |
| Contribution workflow | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Demo guide for sales/investors | [`docs/sales/demo-guide.md`](sales/demo-guide.md) |
| Working with model weights / datasets (Hugging Face Xet) | [`docs/operations/xet-developer-guide.md`](operations/xet-developer-guide.md) |
| Bring up Temporal locally for approval workflows | [`infra/temporal/README.md`](../infra/temporal/README.md) |

---

*Onboarding doc last updated: April 2026. For issues, open a GitHub issue or contact inquiries@szlholdings.com.*
