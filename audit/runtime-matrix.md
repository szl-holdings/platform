# SZL Holdings — Runtime Matrix

**Generated:** 2026-04-21  
**Track:** Zero-Gap Track 1  
**Source:** `audit/workspace-inventory.md`, `docs/APP_STATUS.md`, `docs/reconciliation-report.md`, direct inspection

---

## Operational Status Definitions

| Status | Meaning |
|--------|---------|
| **Boots** | Artifact starts successfully; UI renders; core routes respond |
| **Partial** | Starts but significant features are mocked, missing, or not wired to API |
| **Unverified** | Not recently confirmed to start without errors in this environment |
| **Mock-only** | No live data connections; all data is seeded/hardcoded |
| **Concept** | Directory exists; no working application |
| **Archived** | Source on disk; no registered workflow; intentionally retired |

---

## Web Artifacts

| Artifact | Preview Path | Operational Status | Stack | Auth | Notes |
|---------|-------------|-------------------|-------|------|-------|
| SZL Holdings Dashboard | `/` | **Partial** | React 19 + Vite | Replit OIDC | KPIs seeded; some stats hardcoded |
| API Server | `/api/` | **Boots** | Express 5 | Session + RBAC | 347 route files; primary backend |
| Unified Command | `/command/` | **Partial** | React 19 + Vite | Replit OIDC | Mostly seeded; Substrate Command Center live |
| Terra | `/terra/` | **Partial** | React 19 + Vite | Replit OIDC | NYC Open Data / Census live; Mapbox needs token |
| Vessels | `/vessels/` | **Partial** | React 19 + Vite | Replit OIDC | NOAA/Open-Meteo live; AIS simulated |
| Carlota Jo | `/carlota-jo/` | **Boots** | React 19 + Vite | `replit-auth-web` | Most live integrations active |
| Pulse | `/pulse/` | **Partial** | React 19 + Vite | Local `useAuth()` | AI generation via gateway; mock fallback |
| Aegis (Pitch Deck) | `/aegis/` | **Boots** | React 19 + Vite | Replit OIDC | CISA KEV / NVD / MITRE live; investor slides |
| Sentra | `/sentra/` | **Partial** | React 19 + Vite | Replit OIDC | Agent mesh data seeded; live telemetry planned |
| Counsel | `/counsel/` | **Mock-only** | React 19 + Vite | Replit OIDC | Placeholder skeleton; no live data |
| Lyte Command Center | `/lyte/` | **Partial** | React 19 + Vite | Replit OIDC | Live overlay endpoints wired (#1040) |
| NEXUS (Mockup Sandbox) | `/nexus/` | **Boots** | React 19 + Vite | Auth guard (`authMiddleware`) | Internal tooling; Pattern Atlas live |

---

## Mobile Artifacts

| Artifact | Status | Stack | Notes |
|---------|--------|-------|-------|
| SZL Holdings Mobile | **Concept/Deferred** | Expo / React Native | Registered; deferred until CORTEX ships |
| CORTEX Mobile (`cortex-mobile/`) | **Concept** | Planned Expo / React Native | Unregistered; no active development |

---

## Video / Design Artifacts

| Artifact | Status | Notes |
|---------|--------|-------|
| SZL Demo Video | **Boots** | Programmatic video artifact; registered |

---

## Apps (Background Services)

| App | Status | Notes |
|-----|--------|-------|
| `alloy-runtime-api` | **Unverified** | AEEP v1 endpoint suite (18 endpoints) |
| `alloy-embedding-api` | **Unverified** | AEF REST gateway |
| `alloy-ingestion-orchestrator` | **Unverified** | Data ingestion pipeline |

---

## Platform Services

| Service | Status | Notes |
|---------|--------|-------|
| `alloy-fabric-api` | **Unverified** | Alloy fabric API |
| `alloy-fabric-ingest-control` | **Unverified** | Ingestion control |
| `lyte-metrics-store` | **Unverified** | Lyte metrics persistence |
| `substrate-mcp-gateway` | **Unverified** | Substrate MCP gateway |
| `substrate-py-workers` | **Unverified** | Python worker substrate |

---

## Workers

| Worker | Status | Notes |
|--------|--------|-------|
| `alloy-embed-worker` | **Unverified** | 5 embedding backends; dev-hash mode requires no model download |
| `alloy-rank-worker` | **Unverified** | Ranking worker |
| `alloy-rerank-worker` | **Unverified** | Cross-encoder + deterministic TF fallback |
| `alloy-vector-worker` | **Unverified** | Vector indexing |
| `substrate-python` | **Unverified** | FastAPI + Pydantic v2 Phase 1 worker |

---

## Archived Artifacts (On Disk, No Workflow)

| Directory | Archived By | Notes |
|-----------|------------|-------|
| `artifacts/firestorm/` | Task #920 | Aegis defense UI; API routes at `/firestorm/*` still live |
| `artifacts/imperium/` | Task #920 | Merged into Command |
| `artifacts/prism-counsel/` | Task #634 | PRISM Counsel UI; API routes at `/prism-counsel/*` still live |

---

## Tech Stack Summary

| Component | Canonical Version | Source |
|-----------|-----------------|--------|
| Node.js | 22 LTS (CI); 24 (Replit dev env) | `.replit`, Dockerfiles, CI configs |
| pnpm | 10.26.1 | `package.json` `packageManager` field |
| TypeScript | ~5.9 | `pnpm-workspace.yaml` catalog |
| React | 19.1.0 | `pnpm-workspace.yaml` catalog |
| Vite | 7.x | `pnpm-workspace.yaml` catalog |
| PostgreSQL | 16 | `.replit` modules |
| Drizzle ORM | 0.45.2 | `pnpm-workspace.yaml` catalog |
| Tailwind CSS | 4.x | `pnpm-workspace.yaml` catalog |
| Express | 5.x | devDependencies |
| NixOS channel | `stable-25_05` | `.replit` `[nix]` |
