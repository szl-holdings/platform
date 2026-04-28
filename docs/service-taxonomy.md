# SZL Holdings — Service Taxonomy & Backstage Catalog Model

**Version:** 1.0  
**Date:** 2026-04-28  
**Purpose:** Define the domain taxonomy and the Backstage catalog model that the Developer Control Plane task will implement. This document is the decision record — the next task executes without re-deciding shape.  
**Audience:** Platform engineers, Developer Control Plane task executor

---

## 1. Domain Taxonomy

The platform organizes services into six first-class domains. Each domain maps to one or more Backstage `Domain` kinds.

| Domain ID | Name | Backstage Domain Kind | Purpose | Current Services/Artifacts |
|-----------|------|-----------------------|---------|---------------------------|
| `platform` | Platform | `platform` | Shared substrate — API server, database, auth, CI/CD, packaging | api-server, packages/*, lib/*, apps/alloy-*, workers/alloy-*, services/alloy-fabric-* |
| `alloy` | Alloy AI Fabric | `alloy` | AI orchestration, embedding, ingestion, proof chain | apps/alloy-*, workers/alloy-*, services/alloy-fabric-*, services/substrate-*, packages/aef-*, packages/agents-* |
| `lyte` | Lyte Intelligence | `lyte` | Operational intelligence, observability, decision analytics | artifacts/lyte-command-center, services/lyte-metrics-store, packages/cognitive-observability, packages/otel |
| `aegis` | Aegis Governance | `aegis` | Trust, policy, compliance, vulnerability, audit | artifacts/aegis, packages/policy-*, packages/aef-policy-guard, lib/proof-chain, lib/evidence-* |
| `operations` | Operations | `operations` | Unified command, maritime, real estate, legal, advisory, cyber, briefing, reverse ETL | artifacts/command, artifacts/vessels, artifacts/terra, artifacts/counsel, artifacts/carlota-jo, artifacts/sentra, artifacts/pulse, artifacts/conduit |
| `corporate` | Corporate | `corporate` | Investor-facing, marketing, mobile command, brand | artifacts/szl-holdings, artifacts/szl-holdings-mobile, artifacts/a11oy, artifacts/szl-demo-video, artifacts/carlota-jo |

---

## 2. Backstage Entity Kinds Used

Backstage uses six entity kinds. This table maps each to the SZL platform model.

| Kind | Backstage Meaning | SZL Usage |
|------|-------------------|-----------|
| `Domain` | A high-level grouping of systems | 6 domains (platform, alloy, lyte, aegis, operations, corporate) |
| `System` | A bounded set of components with a coherent purpose | ~15 systems (see §4) |
| `Component` | A deployable unit (service, library, website, mobile app, worker) | 130+ components |
| `API` | A machine-readable API contract | ~10 APIs (REST, async event, library) |
| `Resource` | An external resource a component depends on | ~12 resources (databases, queues, external APIs) |
| `Group` | A team that owns components | ~8 groups (see §5) |

---

## 3. Domain → System Mapping

### Domain: `platform`

| System Name | Backstage System ID | Components |
|------------|--------------------|-----------| 
| API Gateway | `system:api-gateway` | `artifacts/api-server`, `lib/api-spec`, `lib/api-client-react`, `lib/api-zod` |
| Data Layer | `system:data-layer` | `lib/db`, `packages/db-schema`, `packages/db-repository`, `packages/db-migrations` |
| Config & Env | `system:config-env` | `packages/env`, `packages/config`, `packages/shared-contracts`, `packages/contracts` |
| Auth | `system:auth` | `packages/auth-shared`, `packages/replit-auth-web`, `lib/auth` |
| Developer Portal | `system:developer-portal` | `/platform/backstage/` (Phase 3) |

### Domain: `alloy`

| System Name | Backstage System ID | Components |
|------------|--------------------|-----------| 
| AEF Embedding | `system:aef-embedding` | `apps/alloy-embedding-api`, `workers/alloy-embed-worker`, `workers/alloy-rerank-worker` |
| AEF Ingestion | `system:aef-ingestion` | `apps/alloy-ingestion-orchestrator`, `services/alloy-fabric-ingest-control` |
| AEF Runtime | `system:aef-runtime` | `apps/alloy-runtime-api`, `services/alloy-fabric-api`, `workers/alloy-rank-worker`, `workers/alloy-vector-worker` |
| Substrate Inference | `system:substrate-inference` | `apps/substrate-inference`, `workers/substrate-python`, `services/substrate-py-workers`, `services/substrate-mcp-gateway` |
| Proof Chain | `system:proof-chain` | `lib/proof-chain`, `lib/evidence-ledger`, `lib/evidence-graph`, `lib/run-ledger` |
| Agent Fabric | `system:agent-fabric` | `packages/agents-core`, `packages/agents-sdk-bridge`, `packages/agents-prompts`, `packages/agents-tools` |

### Domain: `lyte`

| System Name | Backstage System ID | Components |
|------------|--------------------|-----------| 
| Lyte Command Center | `system:lyte-command` | `artifacts/lyte-command-center`, `services/lyte-metrics-store` |
| Platform Observability | `system:observability` | `packages/observability-core`, `packages/otel`, `packages/cognitive-observability`, `packages/telemetry-standards` |

### Domain: `aegis`

| System Name | Backstage System ID | Components |
|------------|--------------------|-----------| 
| Aegis Trust Surface | `system:aegis-trust` | `artifacts/aegis` |
| Policy Engine | `system:policy-engine` | `packages/policy-engine`, `packages/policy-guard`, `packages/aef-policy-guard`, `/platform/policy/` (Phase 4) |
| Audit Chain | `system:audit-chain` | `lib/audit`, `lib/outcome-graph`, `packages/receipt-graph` |

### Domain: `operations`

| System Name | Backstage System ID | Components |
|------------|--------------------|-----------| 
| Unified Command | `system:command` | `artifacts/command` |
| Maritime Intelligence | `system:vessels` | `artifacts/vessels` |
| Real Estate Intelligence | `system:terra` | `artifacts/terra` |
| Legal Command | `system:counsel` | `artifacts/counsel` |
| Advisory Platform | `system:carlota` | `artifacts/carlota-jo` |
| Cyber Resilience | `system:sentra` | `artifacts/sentra` |
| AI Briefing | `system:pulse` | `artifacts/pulse` |
| Reverse ETL | `system:conduit` | `artifacts/conduit` |

### Domain: `corporate`

| System Name | Backstage System ID | Components |
|------------|--------------------|-----------| 
| Corporate Dashboard | `system:szl-holdings` | `artifacts/szl-holdings` |
| Mobile Command | `system:mobile` | `artifacts/szl-holdings-mobile` |
| Brand Orchestration | `system:a11oy` | `artifacts/a11oy` |
| Demo Media | `system:demo` | `artifacts/szl-demo-video` |

---

## 4. Component Type Classification

Every component has a `spec.type` in its `catalog-info.yaml`. Use these canonical types:

| Type | Used For | Examples |
|------|----------|---------|
| `website` | Frontend SPA artifacts | `artifacts/szl-holdings`, `artifacts/command`, `artifacts/terra` |
| `service` | Backend HTTP services | `artifacts/api-server`, `services/alloy-fabric-api`, `apps/alloy-runtime-api` |
| `library` | Shared packages | All `packages/*` and `lib/*` |
| `worker` | Async/queue workers | All `workers/*` |
| `mobile` | Mobile app | `artifacts/szl-holdings-mobile` |
| `video` | Video/animation artifact | `artifacts/szl-demo-video` |
| `infrastructure` | IaC / platform config | `infra/`, `/platform/backstage/`, `/platform/crossplane/` |

---

## 5. Ownership Groups

| Group ID | Name | Owns |
|----------|------|------|
| `platform-team` | Platform Engineering | All substrate packages, api-server, infra, CI/CD, Backstage |
| `alloy-team` | Alloy AI Fabric | All alloy apps/services/workers, AEF packages, proof chain |
| `lyte-team` | Lyte Intelligence | lyte-command-center, lyte-metrics-store, observability packages |
| `aegis-team` | Aegis Governance | aegis artifact, policy packages, audit chain |
| `domain-vessels` | Vessels Domain | artifacts/vessels and its API routes |
| `domain-terra` | Terra Domain | artifacts/terra and its API routes |
| `domain-counsel` | Counsel Domain | artifacts/counsel and its API routes |
| `domain-carlota` | Carlota Jo Domain | artifacts/carlota-jo and its API routes |
| `mobile-team` | Mobile | artifacts/szl-holdings-mobile |

---

## 6. API Catalog

Machine-readable APIs that Backstage will catalog:

| API ID | Kind | Spec Format | Owner | Consumers |
|--------|------|-------------|-------|-----------|
| `api:szl-rest-v1` | REST | OpenAPI 3.1 (`lib/api-spec`) | platform-team | All frontend SPAs, mobile |
| `api:alloy-embed-v1` | REST | OpenAPI (to be authored) | alloy-team | Internal embedding consumers |
| `api:alloy-runtime-v1` | REST | OpenAPI (to be authored) | alloy-team | Command, Lyte, ai-engine |
| `api:substrate-inference-v1` | REST | OpenAPI (FastAPI auto-gen) | alloy-team | alloy-runtime-api, command |
| `api:substrate-mcp` | AsyncAPI | MCP protocol (to be authored) | alloy-team | MCP clients |
| `api:lyte-metrics` | REST | OpenAPI (to be authored) | lyte-team | lyte-command-center |

---

## 7. Resource Catalog

External resources that Backstage will register:

| Resource ID | Type | Provider | Used By |
|-------------|------|----------|---------|
| `resource:postgresql-dev` | database | Replit PostgreSQL 16 | api-server, all apps |
| `resource:postgresql-prod` | database | Azure Database for PostgreSQL (target) | api-server (prod) |
| `resource:azure-key-vault` | secret-store | Azure Key Vault (target) | All services (prod) |
| `resource:azure-acr` | container-registry | Azure Container Registry | container-publish CI |
| `resource:azure-service-bus` | message-queue | Azure Service Bus (target) | Workers (prod) |
| `resource:azure-redis` | cache | Azure Cache for Redis (target) | api-server (prod) |
| `resource:openai` | external-api | OpenAI | api-server, alloy-embed-worker |
| `resource:anthropic` | external-api | Anthropic | api-server, alloy stack |
| `resource:mapbox` | external-api | Mapbox | szl-holdings, command |
| `resource:marine-traffic` | external-api | Marine Traffic | vessels |
| `resource:stripe` | external-api | Stripe | api-server, carlota-jo |
| `resource:plausible` | analytics | Plausible | szl-holdings |

---

## 8. `catalog-info.yaml` Template Shape

Every component gets a `catalog-info.yaml` at its package/service root. Template:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: <slug>                          # e.g. api-server
  title: <Display Title>               # e.g. API Server
  description: <One-line description>
  annotations:
    github.com/project-slug: szl-holdings/<repo>
    backstage.io/techdocs-ref: dir:.
  tags:
    - <domain>                          # e.g. platform, alloy, lyte
    - <type>                            # e.g. typescript, python, react
spec:
  type: <type>                         # website | service | library | worker | mobile | video
  lifecycle: production                # production | experimental | deprecated
  owner: group:<team>                  # e.g. group:platform-team
  system: system:<system-id>
  dependsOn:
    - component:api-server             # for frontend SPAs
    - resource:postgresql-dev
  providesApis:
    - api:szl-rest-v1                  # for api-server
  consumesApis:
    - api:szl-rest-v1                  # for frontends
```

---

## 9. Backstage TechDocs Mapping

All documentation in `docs/` is served as TechDocs from Backstage. The existing `docs/` tree maps to the Backstage catalog root. Individual components can have their own `docs/` subdirectories for component-level documentation.

| TechDocs Source | Backstage Location |
|-----------------|-------------------|
| `docs/` (repo root) | Root TechDocs site |
| `artifacts/<name>/docs/` (if exists) | Component-level docs |
| `packages/<name>/README.md` | Auto-ingested library docs |

---

## 10. Implementation Checklist for Phase 3 Task

The Developer Control Plane task should use this document as its specification. The following must be produced:

- [ ] `/platform/backstage/` — Backstage app bootstrapped and running
- [ ] `catalog-info.yaml` in every `artifacts/*` directory (15 files)
- [ ] `catalog-info.yaml` in every `apps/*` directory (4 files)
- [ ] `catalog-info.yaml` in every `services/*` directory (8 files)
- [ ] `catalog-info.yaml` in every `workers/*` directory (5 files)
- [ ] `catalog-info.yaml` for top-level packages (priority: P1 packages first — ~20 files)
- [ ] Domain entity files (`domain-platform.yaml`, `domain-alloy.yaml`, etc.) in `/platform/backstage/catalog/`
- [ ] System entity files for all 15 systems in `/platform/backstage/catalog/`
- [ ] Group entity files for all 8 groups in `/platform/backstage/catalog/`
- [ ] API entity stubs for the 6 APIs in `/platform/backstage/catalog/`
- [ ] Resource entity files for the 12 resources in `/platform/backstage/catalog/`
- [ ] `score.yaml` in at least `artifacts/api-server` and `apps/alloy-runtime-api` as pilot workloads
- [ ] Three software templates in `/platform/backstage/templates/` (matching `docs/golden-paths.md`)
- [ ] Backstage `app-config.yaml` wired to GitHub integration and TechDocs
