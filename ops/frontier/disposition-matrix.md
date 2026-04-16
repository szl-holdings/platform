# Disposition Matrix

Generated: 2026-04-15
Authority: Phase 0 Truth Audit

---

## Classification Legend

| Class | Meaning |
|-------|---------|
| CANONICAL-NOW | Production now — canonical, investor-ready, actively maintained |
| CANONICAL-MOBILE | Mobile flagship — primary or secondary |
| SECONDARY | Real functionality, absorbed into canonical app; deregister artifact |
| INTERNAL | Dev tool, never customer-facing |
| ARCHIVE-DEPRECATE | Has DEPRECATED.md, deprecated by prior task; deregister and stop running |

---

## Artifact Disposition

### Web Artifacts

| Artifact | Dir | Classification | Disposition | Owner Task |
|----------|-----|----------------|-------------|------------|
| szl-holdings | `artifacts/szl-holdings` | CANONICAL-NOW | Keep — primary public flagship | Ongoing |
| api-server | `artifacts/api-server` | CANONICAL-NOW | Keep — sole backend | Ongoing |
| aegis | `artifacts/aegis` | CANONICAL-NOW | Keep — full defense UI (164 src files) | Ongoing |
| terra | `artifacts/terra` | CANONICAL-NOW | Keep — real estate intelligence | Live data wiring phase |
| vessels | `artifacts/vessels` | CANONICAL-NOW | Keep — maritime intelligence | Live data wiring phase |
| carlota-jo | `artifacts/carlota-jo` | CANONICAL-NOW | Keep — advisory; most production-ready | Ongoing |
| command | `artifacts/command` | CANONICAL-NOW | Keep — unified ops command | Ongoing |
| firestorm | `artifacts/firestorm` | SECONDARY | Deregister; add 301 → /aegis/; code in place | Phase 2 |
| lyte-command-center | `artifacts/lyte-command-center` | SECONDARY | Deregister; add 301 → /command/; merged | Phase 2 |
| imperium | `artifacts/imperium` | SECONDARY | Deregister; add 301 → /command/infrastructure | Phase 2 |
| prism-counsel | `artifacts/prism-counsel` | ARCHIVE-DEPRECATE | Deregister; DEPRECATED.md; task #579 | Phase 2 |
| stephen-site | `artifacts/stephen-site` | ARCHIVE-DEPRECATE | Deregister; DEPRECATED.md; content in /founder | Phase 2 |
| mockup-sandbox | `artifacts/mockup-sandbox` | INTERNAL | Keep; never list in public docs | Ongoing |

### Mobile Artifacts

| Artifact | Dir | Classification | Disposition | Owner Task |
|----------|-----|----------------|-------------|------------|
| cortex-mobile | `artifacts/cortex-mobile` | CANONICAL-MOBILE | Keep — primary mobile flagship | Mobile release phase |
| szl-holdings-mobile | `artifacts/szl-holdings-mobile` | CANONICAL-MOBILE | Keep — secondary; ship after CORTEX | Mobile release phase |

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

## README Accuracy Corrections Required

| Claim | Current | Correct | Priority |
|-------|---------|---------|----------|
| Apps badge | 22 | 8 canonical web + 2 mobile = 10 | P1 |
| DB tables badge | 644 | 561 | P1 |
| Shared libraries | 37 | 33 (2 empty shells) | P2 |
| Node badge | 20.x | 24 | P2 |
| Products table | Includes PRISM Counsel + Stephen Site as active | Both deprecated | P1 |
| IMPERIUM listed as "Functional alpha" | 11 components | Merged into command | P2 |
| "51 packages" in stack section | 51 | 48 (33 lib + 15 artifact) | P3 |
