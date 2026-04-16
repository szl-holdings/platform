# Disposition Matrix

Generated: 2026-04-16 (updated)
Authority: Phase 0 Truth Audit — verified against live repo

---

## Classification Legend

| Class | Meaning |
|-------|---------|
| CANONICAL-NOW | Production now — canonical, investor-ready, actively maintained |
| CANONICAL-MOBILE | Mobile flagship — primary |
| INTERNAL | Dev tool, never customer-facing |
| ARCHIVE | Has DEPRECATED.md or ARCHIVED.md; code removed; marker file remains |
| SHELL | Scaffold exists but no real application code |

---

## Artifact Disposition

### Web Artifacts

| Artifact | Dir | Src Files | Classification | Disposition |
|----------|-----|-----------|----------------|-------------|
| szl-holdings | `artifacts/szl-holdings` | 375 | CANONICAL-NOW | Keep — primary public flagship |
| api-server | `artifacts/api-server` | 389 | CANONICAL-NOW | Keep — sole backend |
| aegis | `artifacts/aegis` | 166 | CANONICAL-NOW | Keep — defense & security UI |
| terra | `artifacts/terra` | 88 | CANONICAL-NOW | Keep — real estate intelligence |
| vessels | `artifacts/vessels` | 103 | CANONICAL-NOW | Keep — maritime intelligence |
| carlota-jo | `artifacts/carlota-jo` | 70 | CANONICAL-NOW | Keep — advisory consulting |
| command | `artifacts/command` | 222 | CANONICAL-NOW | Keep — unified ops command (absorbed Lyte + IMPERIUM) |
| firestorm | `artifacts/firestorm` | 0 | ARCHIVE | Code removed; ARCHIVED.md; superseded by aegis |
| lyte-command-center | `artifacts/lyte-command-center` | 1 | ARCHIVE | Code removed; DEPRECATED.md; merged into command |
| imperium | `artifacts/imperium` | 0 | ARCHIVE | Code removed; DEPRECATED.md; merged into command |
| prism-counsel | `artifacts/prism-counsel` | 0 | ARCHIVE | Code removed; DEPRECATED.md; deprecated task #579 |
| stephen-site | `artifacts/stephen-site` | 0 | ARCHIVE | Code removed; DEPRECATED.md; content moved to /founder |
| mockup-sandbox | `artifacts/mockup-sandbox` | 5 | INTERNAL | Keep; dev-only prototyping tool |

### Mobile Artifacts

| Artifact | Dir | Src Files | Classification | Disposition |
|----------|-----|-----------|----------------|-------------|
| szl-holdings-mobile | `artifacts/szl-holdings-mobile` | 167 | CANONICAL-MOBILE | Keep — primary mobile app; full Expo app |
| cortex-mobile | `artifacts/cortex-mobile` | 2 | SHELL | Scaffold only; 8-domain concept not yet implemented |

---

## Shared Library Disposition

### Active — Keep and Maintain

| Library | Activity | Notes |
|---------|----------|-------|
| `lib/ai-engine` | HIGH | Core AI orchestration |
| `lib/api-zod` | HIGH | Core validation layer |
| `lib/shared-ui` | HIGH | Design system |
| `lib/services` | HIGH | Business services |
| `lib/db` | HIGH | Database schemas |
| `lib/observability` | MEDIUM | Telemetry |
| `lib/mobile-shared` | MEDIUM | Mobile components |
| `lib/forge-runtime` | MEDIUM | Agent engine |
| `lib/intelligence-feeds` | MEDIUM | Threat intel ingestion |
| `lib/offline-engine` | LOW | Mobile offline sync |
| `lib/monte-carlo` | LOW | Financial simulation |
| `lib/graphql-client` | LOW | GraphQL client |
| `lib/covenant-policy` | LOW | Policy engine |
| `lib/prism-bus` | LOW | Event bus |
| `lib/mcp-client` | LOW | Model Context Protocol |
| `lib/object-storage-web` | LOW | Object storage |
| `lib/replit-auth-web` | LOW | Replit auth integration |

### Light — Keep, Low Priority

| Library | Files | Notes |
|---------|-------|-------|
| `lib/analytics` | 3 | Thin wrapper |
| `lib/api-client-react` | 4 | Thin React client |
| `lib/auth` | 1 | Auth middleware entry |
| `lib/audit` | 2 | Audit wrapper |
| `lib/config` | 1 | Config entry |
| `lib/crdt-sync` | 3 | CRDT |
| `lib/data-connectors` | 1 | Connectors stub |
| `lib/i18n` | 3 | Internationalization |
| `lib/outcome-graph` | 1 | Decision modeling |
| `lib/proof-chain` | 1 | Audit chain |
| `lib/pulse-evals` | 5 | Evaluations |
| `lib/receipt-graph` | 4 | Receipt tracking |
| `lib/worldline` | 1 | Signal routing |
| `lib/workflow-engine` | 1 | Workflow entry |
| `lib/atlas-artifacts` | 1 | Artifacts helper |

### Shell — Evaluate for Deletion

| Library | Files | Issue | Action |
|---------|-------|-------|--------|
| `lib/api-spec` | 0 | No src, no index.ts | Evaluate: fill with OpenAPI spec or delete |
| `lib/approvals` | 0 | No src, no index.ts | Evaluate: implement or delete |

---

## CI/CD Disposition

| Workflow | Disposition | Action |
|----------|-------------|--------|
| `ci.yml` | KEEP | Add canonical apps to build matrix |
| `e2e.yml` | UPDATE | Remove lyte-command-center; add command |
| `security.yml` | KEEP | — |
| `codeql.yml` | KEEP | — |
| `dependency-review.yml` | KEEP | — |
| `lighthouse.yml` | KEEP | — |
| `deploy-staging.yml` | KEEP | — |
| `deploy-production.yml` | KEEP | — |
| `deploy.yml` | REVIEW | May be legacy duplicate of above two |
| `container-publish.yml` | KEEP | — |
| `release.yml` | KEEP | — |
| `npm-publish.yml` | REVIEW | Confirm still needed for pnpm workspace |
| `prism-counsel-ci.yml` | DELETE | Deprecated app; stale workflow |

---

## README Accuracy Status

README was updated as part of Task #893. Current accuracy:

| Claim | Status | Notes |
|-------|--------|-------|
| DB tables: 561 | CLOSE | Actual: 569 (8 tables added since last count) |
| Schema files: 112 | CLOSE | Actual: 116 |
| Packages: 51 | CLOSE | Actual: 53 dirs (35 lib + 17 artifact + 1 packages) |
| Products table | ACCURATE | Deprecated apps correctly marked |
| Node 24 | ACCURATE | Matches .replit modules |
| CORTEX Mobile: "Alpha prep" | MISLEADING | Only 2 src files — scaffold, not alpha |
