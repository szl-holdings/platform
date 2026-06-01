# Stack Detection Summary

**Generated:** 2026-04-20T21:30:00Z  
**Pass:** Series-A foundation inventory

---

## Monorepo Tool
- **Tool:** Turborepo v2.9.6 + pnpm v10.26.1 workspaces
- **Config:** `turbo.json`, `pnpm-workspace.yaml`
- **Node Requirement:** >=24.0.0
- **Package Manager Lock:** `pnpm-lock.yaml` (pnpm-enforced via preinstall script)
- **stray lockfiles found:** None (package-lock.json/yarn.lock/bun.lockb not present)

---

## App Types

| Category | Count | Examples |
|----------|-------|---------|
| Web SPAs (Vite + React 19 + Tailwind v4) | 11 | szl-holdings, aegis, sentra, counsel, terra, vessels, pulse, lyte-command-center, command, carlota-jo, carlota-jo |
| Mobile (Expo/React Native) | 1 | szl-holdings-mobile |
| Video (Remotion-style React animation) | 1 | szl-demo-video |
| Design Mockup (React SPA) | 1 | mockup-sandbox |
| Backend API (Express 5 + Node) | 1 | api-server |
| Microservices (Node + Express) | 8 | alloy-* apps, substrate-mcp-gateway, lyte-metrics-store |
| Workers (Node) | 5 | alloy-embed, alloy-rank, alloy-rerank, alloy-vector, substrate-python |
| Python Services | 2 | lyte-metrics-store, substrate-python |

---

## Data Layer
- **Primary DB:** PostgreSQL (via Replit managed Postgres)
- **ORM:** Drizzle ORM v0.45.2 + Drizzle Kit for migrations
- **Schema:** `lib/db/src/schema/` (canonical schema), `packages/db-schema/`, `packages/db-repository/`
- **Connection:** `@szl-holdings/env` validates DATABASE_URL at startup
- **Vector Store:** pgvector (Alloy Embedding Service)
- **Cache:** In-memory LRU (lru-cache v11)

---

## Test Stack
- **Unit/Integration:** Vitest v4.1.2 (root: `vitest.config.ts`), per-package vitest configs
- **Component tests:** Vitest + @testing-library/react v16 (`vitest.components.config.ts`)
- **E2E:** Playwright v1.58.2 (`playwright.config.ts`)
- **Linting:** Biome v2.4.12 + oxlint v1.60.0 (dual-linting)
- **Type checking:** TypeScript 5.9.2 via tsc --build (project references)

---

## Shared Packages Summary

| Directory | Count | Purpose |
|-----------|-------|---------|
| `lib/` | 28 packages | Core shared libraries (db, auth, services, ai-engine, shared-ui, etc.) |
| `packages/` | 82 packages | Domain engines, protocol packages, agentic runtime, infra contracts |
| `apps/` | 8 services | Backend microservices (Alloy embedding/ranking/fabric/ingestion, substrate) |
| `workers/` | 5 workers | Background processing workers |
| `artifacts/` | 14 artifacts | Frontend deployables |
| `services/` | 2 services | Additional backend services |
| `scripts/` | 1 | Root-level devtools, QA scripts, seed scripts |

---

## CI Platform
- **Provider:** GitHub Actions
- **Workflows:** 18 total (ci, build, e2e, security, deploy-staging, deploy-production, codeql, lighthouse, audit-full, prism-counsel-ci, backup, container-publish, npm-publish, readme-qa, release, secret-scan-scheduled, dependency-review, uptime-monitor)
- **Triggers:** push/PR on main/master, scheduled (weekly/monthly security scans), release events
- **Deployment:** Replit platform (staging auto-deploy on push; production gated on release)

---

## Key Runtime Decisions
- `moduleResolution: bundler` for all TS packages (Vite-compatible)
- `verbatimModuleSyntax: true` enforced
- `exactOptionalPropertyTypes: true` enforced (strict mode)
- React 19.1.0 with concurrent features
- Tailwind CSS v4 (new engine, no config file)
- Path-based routing via `packages/proxy-routes.ts` → `scripts/shared-proxy.mjs`
