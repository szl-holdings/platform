# Current vs Target Architecture

Generated: 2026-04-16 (updated)

---

## Current State

### Web App Landscape (Current)

| App | Path | Port | State |
|-----|------|------|-------|
| szl-holdings | `/` | 21130 | Running — canonical flagship |
| api-server | `/api/` | 8080 | Running — canonical backend |
| aegis | `/aegis/` | 23933 | Running — canonical defense UI |
| _(5 archived)_ | _(various)_ | — | Archived/deregistered — see disposition-matrix.md |
| terra | `/terra/` | 25100 | Running — canonical |
| vessels | `/vessels/` | 18485 | Running — canonical |
| carlota-jo | `/carlota-jo/` | 21200 | Running — canonical |
| command | `/command/` | 25200 | Running — canonical unified ops |
| mockup-sandbox | `/__mockup/` | — | Internal tool only |

**Problem:** 5 of 13 registered web apps are redundant or deprecated but still running, consuming resources and creating routing confusion.

### Mobile Landscape (Current)

| App | State |
|-----|-------|
| cortex-mobile | Active, not yet in app stores |
| szl-holdings-mobile | Active, deferred behind cortex-mobile |

### Infrastructure (Current)

- **Host:** Replit (Autoscale deployment)
- **DB:** Replit-managed PostgreSQL 16 (561+ tables in `lib/db`)
- **Secrets:** Mix of Replit Secrets panel + hardcoded values in `.replit [userenv.shared]` — **NON-COMPLIANT**
- **CI/CD:** 13 GitHub workflows; 1 legacy (prism-counsel-ci.yml archived — retained as archival record)
- **Credential files:** Both mobile Firebase configs are placeholder-only (compliant)

---

## Target State

### Web App Target Topology

| App | Path | Purpose |
|-----|------|---------|
| szl-holdings | `/` | Canonical flagship — single public web entry point |
| api-server | `/api/` | Backend platform — all REST/GraphQL/WebSocket |
| aegis | `/aegis/` | Defense & intelligence command (full app) |
| terra | `/terra/` | Real estate intelligence |
| vessels | `/vessels/` | Maritime intelligence |
| carlota-jo | `/carlota-jo/` | Premium advisory |
| command | `/command/` | Unified ops command (merged operator surfaces) |

**Eliminated:** 5 archived artifacts deregistered — see `ops/frontier/disposition-matrix.md` for redirect and disposition details.

### Mobile Target Topology

| App | State |
|-----|-------|
| cortex-mobile | Ship via TestFlight + Play Internal Testing |
| szl-holdings-mobile | Ship after CORTEX validated in stores |

### Secret Management Target State

| Secret | Target Location |
|--------|----------------|
| `OAUTH_STATE_SECRET` | Replit Secrets panel only (NOT in .replit) |
| `VAPID_PRIVATE_KEY` | Replit Secrets panel only (NOT in .replit) |
| `VAPID_PUBLIC_KEY` | .replit [userenv.shared] (public key — safe) |
| `VAPID_SUBJECT` | .replit [userenv.shared] (email — safe) |
| All other secrets | Replit Secrets panel |

### CI/CD Target State

| Workflow | Target State |
|----------|-------------|
| `ci.yml` | Keep — add new canonical apps to matrix |
| `e2e.yml` | Updated — archived specs removed, command spec added |
| `security.yml` | Keep as-is |
| `codeql.yml` | Keep as-is |
| `dependency-review.yml` | Keep as-is |
| `lighthouse.yml` | Keep as-is |
| `deploy-staging.yml` | Keep as-is |
| `deploy-production.yml` | Keep as-is |
| `deploy.yml` | Review — may be legacy duplicate |
| `container-publish.yml` | Keep as-is |
| `release.yml` | Keep as-is |
| `npm-publish.yml` | Review — confirm if pnpm workspace still needs this |
| `prism-counsel-ci.yml` | ARCHIVED — retained as archival record; triggers **disabled** (do not re-enable) |

---

## Gap Summary

| Gap | Priority | Downstream Task |
|-----|----------|-----------------|
| 5 redundant/deprecated apps still registered and running | P1 | Product topology & portfolio rationalization (Phases 2-3) |
| OAUTH_STATE_SECRET hardcoded in .replit | P0 | This task (Phase 1) |
| VAPID_PRIVATE_KEY hardcoded in .replit | P0 | This task (Phase 1) |
| Mobile Firebase configs need .gitignore protection | P0 | This task (Phase 1) |
| README claims outdated (22 apps, 2331 endpoints, 644 tables, Node 20) | P1 | Product topology task |
| Legacy CI workflow archived | P2 — RESOLVED | CI/CD cleanup task |
| api-spec and approvals lib packages are empty shells | P2 | Lib cleanup task |
| CORTEX mobile not yet in app stores | P1 | Mobile task |
