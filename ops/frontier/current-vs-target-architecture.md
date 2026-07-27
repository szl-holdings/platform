# Current vs Target Architecture

Generated: 2026-04-16 (updated)

---

## Current State

### Web App Landscape (Current)

| App | Path | State |
|-----|------|-------|
| szl-holdings | `/` | Running — canonical flagship |
| api-server | `/api/` | Running — canonical backend |
| terra | `/terra/` | Running — canonical |
| vessels | `/vessels/` | Running — canonical |
| carlota-jo | `/carlota-jo/` | Running — canonical |
| command | `/command/` | Running — canonical unified ops |
| conduit | `/conduit/` | Running — Reverse ETL |
| a11oy | `/a11oy/` | Running — brand orchestration |
| sentra | `/sentra/` | Running — cyber resilience |
| counsel | `/counsel/` | Running — legal matter command |
| pulse | `/pulse/` | Running — AI executive briefing |
| mockup-sandbox | `/nexus/` | Internal tool only (not public) |
| _(6 archived)_ | _(various)_ | Archived/deregistered — see disposition-matrix.md |

**Note:** The 6 archived surfaces (firestorm, aegis, imperium, lyte-command-center, prism-counsel, stephen-site) have been deregistered. Source directories retained for historical reference. See `ops/frontier/disposition-matrix.md` for full disposition record.

### Mobile Landscape (Current)

| App | State |
|-----|-------|
| cortex-mobile | Active, not yet in app stores |
| szl-holdings-mobile | Active, deferred behind cortex-mobile |

### Infrastructure (Current)

- **Host:** Replit (Autoscale deployment)
- **DB:** Replit-managed PostgreSQL 16 (561+ tables in `lib/db`)
- **Secrets:** Mix of Replit Secrets panel + hardcoded values in `.replit [userenv.shared]` — **NON-COMPLIANT**
- **CI/CD:** 43 GitHub workflows are measured in `artifacts/SOURCE_OF_TRUTH.json`; archival workflow state is tracked separately
- **Credential files:** Both mobile Firebase configs are placeholder-only (compliant)

---

## Target State

### Web App Target Topology

| App | Path | Purpose |
|-----|------|---------|
| szl-holdings | `/` | Canonical flagship — single public web entry point |
| api-server | `/api/` | Backend platform — all REST/GraphQL/WebSocket |
| terra | `/terra/` | Real estate intelligence |
| vessels | `/vessels/` | Maritime intelligence |
| carlota-jo | `/carlota-jo/` | Premium advisory |
| command | `/command/` | Unified ops command (merged operator surfaces) |
| conduit | `/conduit/` | Reverse ETL data pipeline |
| a11oy | `/a11oy/` | Brand orchestration layer |
| sentra | `/sentra/` | Cyber resilience command |
| counsel | `/counsel/` | Legal matter command |
| pulse | `/pulse/` | AI executive briefing |

**Eliminated:** 6 archived artifacts deregistered (firestorm, aegis, imperium, lyte-command-center, prism-counsel, stephen-site) — see `ops/frontier/disposition-matrix.md` for redirect and disposition details.

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
| 6 redundant/deprecated apps deregistered and archived (firestorm, aegis, imperium, lyte-command-center, prism-counsel, stephen-site) | ✅ RESOLVED | `ops/frontier/disposition-matrix.md` |
| OAUTH_STATE_SECRET hardcoded in .replit | P0 | This task (Phase 1) |
| VAPID_PRIVATE_KEY hardcoded in .replit | P0 | This task (Phase 1) |
| Mobile Firebase configs need .gitignore protection | P0 | This task (Phase 1) |
| README claims outdated (22 apps, 2331 endpoints, 644 tables, Node 20) | P1 | Product topology task |
| Legacy CI workflow archived | P2 — RESOLVED | CI/CD cleanup task |
| api-spec and approvals lib packages are empty shells | P2 | Lib cleanup task |
| CORTEX mobile not yet in app stores | P1 | Mobile task |
