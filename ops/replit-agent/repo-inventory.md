# SZL Holdings — Repository Inventory

Generated: 2026-04-15

## Monorepo Overview

| Metric | Value |
|--------|-------|
| Package manager | pnpm (workspace) |
| Language | TypeScript (full stack) |
| Database | PostgreSQL (Replit-hosted) |
| DB tables | 561 |
| Shared libraries | 37 |
| Artifact directories | 26 |
| Active web apps | 11 (all HTTP 200) |
| Mobile apps | 2 (Expo/React Native) |
| GitHub workflows | 12 |
| Root-level docs | 28 .md files |

## Active Web Artifacts (HTTP 200, registered, with workflows)

| App | Path | Port | Status |
|-----|------|------|--------|
| szl-holdings | `/szl-holdings/` | 21130 | Production flagship |
| firestorm (Aegis) | `/firestorm/` | 23932 | Defense/Intel command |
| aegis | `/aegis/` | 23933 | Aegis alt entry |
| terra | `/terra/` | 25100 | Real estate intel |
| vessels | `/vessels/` | 18485 | Maritime intel |
| carlota-jo | `/carlota-jo/` | 21200 | Advisory consulting |
| command | `/command/` | 25200 | Unified ops command |
| imperium | `/imperium/` | 22100 | Strategic command |
| prism-counsel | `/prism-counsel/` | 26500 | Legal matter command |
| stephen-site | `/stephen-site/` | 5173 | Founder profile |
| lyte-command-center | `/lyte-command-center/` | 19290 | Lyte ops (merged into command) |

## API Server

| Attribute | Value |
|-----------|-------|
| Path | `artifacts/api-server` |
| Port | 8080 |
| Framework | Express.js + Apollo GraphQL |
| Health | `/api/health`, `/api/health/live`, `/api/health/ready` |
| Docs | `/api/docs` (Swagger) |
| Auth | Bearer token + cookie sessions + internal token |
| Rate limiting | Global (200/15m prod), read/write/auth-specific |
| Input validation | Zod schemas |
| CORS | Dynamic origin via env |
| Logging | Pino structured + audit trail |
| Error format | `{ error, message, statusCode }` |

## Mobile Apps

| App | Framework | Status |
|-----|-----------|--------|
| cortex-mobile | Expo/React Native | Active, workflow running |
| szl-holdings-mobile | Expo/React Native | Active, workflow running |

## Shared Libraries (37)

### Core Infrastructure
ai-engine, auth, config, db, observability, replit-auth-web, workflow-engine

### Domain Services
audit, approvals, covenant-policy, intelligence-feeds, monte-carlo, outcome-graph, prism-bus, proof-chain, receipt-graph, forge-runtime, pulse-evals, worldline

### API & Data
api-spec, api-zod, api-client-react, graphql-client, data-connectors, services

### UI & Mobile
shared-ui, mobile-shared, i18n

### Storage & Sync
object-storage-web, offline-engine, crdt-sync, mcp-client

### Analytics & Atlas
analytics, atlas-artifacts

### Zombie (consolidated into ai-engine, dirs still exist)
integrations-anthropic-ai, integrations-gemini-ai, integrations-openai-ai-server

## Stale/Empty Artifact Directories (11)

These directories have no `package.json` or `artifact.toml`:

aegis-mobile, alloy-mobile, carlota-jo-mobile, forge, inca-lab,
lyte-mobile, nexus, partner-portal, stephen-mobile, terra-mobile, vessels-mobile

## Root-Level Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Run all dev servers |
| `build` | Typecheck + build all |
| `typecheck` | Libs + artifacts |
| `test` | API + component tests |
| `test:integration` | Integration suite (161 tests) |
| `test:e2e` | Playwright E2E |
| `qa:site` | Routes + links + trust + metadata |
| `audit:all` | Mocks + routes + copy + deps + design + links |
| `security:sbom` | SBOM generation |

## GitHub Workflows

ci.yml, codeql.yml, container-publish.yml, dependency-review.yml,
deploy.yml (deprecated), deploy-staging.yml, deploy-production.yml,
e2e.yml, lighthouse.yml, npm-publish.yml, prism-counsel-ci.yml,
release.yml, security.yml

## Existing Documentation

### ops/github/ (9 files)
Profile values, default branch plan, topics, release plan, manual steps, etc.

### infra/ (7 files)
Bicep IaC, runbooks (demo, deployment, rollback, custom domain, incident response, secrets), OWASP checklist, SOC2 checklist

### docs/ (40+ files)
Architecture, investor narrative, trust center, deployment, mobile guide, design, audit, reports, wiki content

### Root docs (28 files)
README, SECURITY, CONTRIBUTING, CHANGELOG, CODE_OF_CONDUCT, BRAND_GUIDELINES, ENV_MATRIX, INCIDENT_RESPONSE, RELEASE_PROCESS, ANALYTICS_PLAN, APP_STORE_SUBMISSION_CHECKLIST, and more
