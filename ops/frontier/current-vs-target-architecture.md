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
| firestorm | `/firestorm/` | 23932 | Running — thin entry, same domain as aegis |
| terra | `/terra/` | 25100 | Running — canonical |
| vessels | `/vessels/` | 18485 | Running — canonical |
| carlota-jo | `/carlota-jo/` | 21200 | Running — canonical |
| command | `/command/` | 25200 | Running — canonical unified ops |
| lyte-command-center | `/lyte-command-center/` | 19290 | Running — REDUNDANT (merged into command) |
| imperium | `/imperium/` | 22100 | Running — REDUNDANT (merged into command) |
| prism-counsel | `/prism-counsel/` | 26500 | Running — DEPRECATED, has DEPRECATED.md |
| stephen-site | `/stephen-site/` | 5173 | Running — DEPRECATED, has DEPRECATED.md |
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
- **CI/CD:** 13 GitHub workflows; 2 stale (prism-counsel-ci.yml, partially e2e.yml)
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
| command | `/command/` | Unified ops command (absorbs lyte + imperium) |

**Eliminated:**
- `firestorm` — route at /firestorm/ redirects to /aegis/
- `lyte-command-center` — deregistered; /lyte-command-center/ redirects to /command/
- `imperium` — deregistered; /imperium/ redirects to /command/infrastructure
- `prism-counsel` — deregistered; archive code; /prism-counsel/ returns 410 or redirects
- `stephen-site` — deregistered; /stephen-site/ redirects to /founder

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
| `e2e.yml` | Update — remove lyte-command-center, add command |
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
| `prism-counsel-ci.yml` | **DELETE** — deprecated app |

---

## Gap Summary

| Gap | Priority | Downstream Task |
|-----|----------|-----------------|
| 5 redundant/deprecated apps still registered and running | P1 | Product topology & portfolio rationalization (Phases 2-3) |
| OAUTH_STATE_SECRET hardcoded in .replit | P0 | This task (Phase 1) |
| VAPID_PRIVATE_KEY hardcoded in .replit | P0 | This task (Phase 1) |
| Mobile Firebase configs need .gitignore protection | P0 | This task (Phase 1) |
| README claims outdated (22 apps, 2331 endpoints, 644 tables, Node 20) | P1 | Product topology task |
| `prism-counsel-ci.yml` workflow is stale | P2 | CI/CD cleanup task |
| `e2e.yml` tests deprecated `lyte-command-center` | P2 | CI/CD cleanup task |
| api-spec and approvals lib packages are empty shells | P2 | Lib cleanup task |
| CORTEX mobile not yet in app stores | P1 | Mobile task |
