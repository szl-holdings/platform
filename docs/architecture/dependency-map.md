# Dependency Map — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Engineers, technical advisors, enterprise architects

> Canonical reference for the monorepo's shared package graph, ownership boundaries, and inter-package dependency relationships.

**Related:** [architecture.md](architecture.md) · [AUDIT_FINDINGS_REGISTER.md](../operations/audit-findings-register.md) · [API-SPEC.md](api-spec.md)

---

## Monorepo Package Overview

The SZL Holdings platform is a pnpm monorepo with three top-level namespaces:

| Namespace | Count | Purpose |
|-----------|-------|---------|
| `artifacts/` | 14 | Deployable applications (web + mobile) |
| `lib/` | 37 | Shared TypeScript packages |
| `packages/` | 2 | Marketplace integrations (Salesforce, Atlassian) |

All packages and artifacts share the `@szl-holdings/` npm scope.

---

## Layer 1: Foundation Packages

These packages have **no internal dependencies** on other `@szl-holdings/` packages. Everything else depends on them.

| Package | Path | Role | Consumers |
|---------|------|------|-----------|
| `@szl-holdings/db` | `lib/db/` | Drizzle ORM schema, migrations, Zod schema exports | All artifacts + most lib packages |
| `@szl-holdings/observability` | `lib/observability/` | Pino logger, APM, metrics, health endpoints | All artifacts + most lib packages |
| `@szl-holdings/api-zod` | `lib/api-zod/` | Shared Zod validation schemas | `api-server`, `api-spec`, `api-client-react` |
| `@szl-holdings/api-spec` | `lib/api-spec/` | OpenAPI 3.1 specification (single source of truth for all API contracts) | `api-server`, `api-client-react` |

---

## Layer 2: Auth & Access Packages

| Package | Path | Internal Deps | Role |
|---------|------|---------------|------|
| `@szl-holdings/auth` | `lib/auth/` | `@szl-holdings/db` | OIDC/PKCE session management, `lib/auth/src/` |
| `@szl-holdings/replit-auth-web` | `lib/replit-auth-web/` | `@szl-holdings/auth` | Replit OAuth integration for web clients |
| `@szl-holdings/policy-engine` | `lib/policy-engine/` | `@szl-holdings/db` | Permission evaluation engine |
| `@szl-holdings/covenant-policy` | `lib/covenant-policy/` | `@szl-holdings/db`, `@szl-holdings/policy-engine` | Covenant Policy enforcement |

---

## Layer 3: Data & AI Packages

| Package | Path | Internal Deps | Role |
|---------|------|---------------|------|
| `@szl-holdings/ai-engine` | `lib/ai-engine/` | `@szl-holdings/db`, `@szl-holdings/observability` | Multi-provider AI inference, Nuro Mesh routing, tenant-scoped RAG |
| `@szl-holdings/intelligence-feeds` | `lib/intelligence-feeds/` | `@szl-holdings/db` | AIS, STIX/TAXII, CourtListener, sanctions adapters |
| `@szl-holdings/outcome-graph` | `lib/outcome-graph/` | `@szl-holdings/db` | Decision lifecycle tracking |
| `@szl-holdings/proof-chain` | `lib/proof-chain/` | `@szl-holdings/db` | Cryptographic audit trail |
| `@szl-holdings/worldline` | `lib/worldline/` | `@szl-holdings/db` | Timeline and event sequencing |
| `@szl-holdings/monte-carlo` | `lib/monte-carlo/` | `@szl-holdings/db` | Probabilistic risk simulation |
| `@szl-holdings/receipt-graph` | `lib/receipt-graph/` | `@szl-holdings/db` | Receipt and transaction graph |
| `@szl-holdings/pulse-evals` | `lib/pulse-evals/` | `@szl-holdings/db`, `@szl-holdings/ai-engine` | PRISM signal evaluation |

---

## Layer 4: Execution & Workflow Packages

| Package | Path | Internal Deps | Role |
|---------|------|---------------|------|
| `@szl-holdings/workflow-engine` | `lib/workflow-engine/` | `@szl-holdings/db`, `@szl-holdings/audit`, `@szl-holdings/covenant-policy` | Alloy workflow orchestration, approval gates |
| `@szl-holdings/forge-runtime` | `lib/forge-runtime/` | `@szl-holdings/db`, `@szl-holdings/workflow-engine` | Durable job queue, agent execution |
| `@szl-holdings/audit` | `lib/audit/` | `@szl-holdings/db` | Immutable compliance audit trail |
| `@szl-holdings/approvals` | `lib/approvals/` | `@szl-holdings/db`, `@szl-holdings/workflow-engine` | Approval chain management |
| `@szl-holdings/prism-bus` | `lib/prism-bus/` | `@szl-holdings/db` | Cross-domain event bus |
| `@szl-holdings/decision-engine` | `lib/decision-engine/` | `@szl-holdings/db`, `@szl-holdings/outcome-graph` | Decision execution routing |
| `@szl-holdings/decision-fabric` | `lib/decision-fabric/` | `@szl-holdings/db`, `@szl-holdings/decision-engine` | Decision fabric orchestration layer |

---

## Layer 5: Integration & Client Packages

| Package | Path | Internal Deps | Role |
|---------|------|---------------|------|
| `@szl-holdings/services` | `lib/services/` | `@szl-holdings/db`, external SDKs | Business logic adapters (Stripe, Resend, etc.) |
| `@szl-holdings/data-connectors` | `lib/data-connectors/` | `@szl-holdings/db` | External data source connectors |
| `@szl-holdings/mcp-client` | `lib/mcp-client/` | `@szl-holdings/db`, `@szl-holdings/auth` | Model Context Protocol client |
| `@szl-holdings/graphql-client` | `lib/graphql-client/` | `@szl-holdings/api-spec` | Apollo GraphQL client |
| `@szl-holdings/api-client-react` | `lib/api-client-react/` | `@szl-holdings/api-spec`, `@szl-holdings/api-zod` | Generated React Query hooks |

---

## Layer 6: Domain-Specific Packages

| Package | Path | Internal Deps | Domain |
|---------|------|---------------|--------|
| `@szl-holdings/analytics` | `lib/analytics/` | `@szl-holdings/db`, `@szl-holdings/observability` | Event tracking and analytics |
| `@szl-holdings/atlas-artifacts` | `lib/atlas-artifacts/` | `@szl-holdings/db` | Geospatial artifact registry |
| `@szl-holdings/atlas-spatial-runtime` | `lib/atlas-spatial-runtime/` | `@szl-holdings/db`, `@szl-holdings/atlas-artifacts` | Geospatial runtime engine |
| `@szl-holdings/action-engine` | `lib/action-engine/` | `@szl-holdings/db`, `@szl-holdings/workflow-engine` | Action execution layer |
| `@szl-holdings/crdt-sync` | `lib/crdt-sync/` | `@szl-holdings/db` | Conflict-free replicated data type sync |
| `@szl-holdings/scene-export` | `lib/scene-export/` | `@szl-holdings/db` | Scene/report export engine |
| `@szl-holdings/i18n` | `lib/i18n/` | None | Internationalization utilities |

---

## Layer 7: UI & Mobile Packages

| Package | Path | Internal Deps | Role |
|---------|------|---------------|------|
| `@szl-holdings/shared-ui` | `lib/shared-ui/` | None (UI primitives only) | Cross-app React component library |
| `@szl-holdings/mobile-shared` | `lib/mobile-shared/` | `@szl-holdings/shared-ui` | React Native shared components |
| `@szl-holdings/offline-engine` | `lib/offline-engine/` | `@szl-holdings/db`, `@szl-holdings/mobile-shared` | Offline sync for mobile apps |
| `@szl-holdings/object-storage-web` | `lib/object-storage-web/` | None | Browser-side object storage client |
| `@szl-holdings/config` | `lib/config/` | None | Shared configuration utilities |

---

## Artifact Applications

| Artifact | Path | Key Lib Dependencies | Serves |
|----------|------|---------------------|--------|
| `api-server` | `artifacts/api-server/` | `@szl-holdings/db`, `@szl-holdings/auth`, `@szl-holdings/workflow-engine`, `@szl-holdings/ai-engine`, `@szl-holdings/audit`, `@szl-holdings/services`, `@szl-holdings/observability` | All web + mobile clients |
| `szl-holdings` | `artifacts/szl-holdings/` | `@szl-holdings/shared-ui`, `@szl-holdings/api-client-react` | Corporate/investor portal |
| `command` | `artifacts/command/` | `@szl-holdings/shared-ui`, `@szl-holdings/api-client-react`, `@szl-holdings/prism-bus` | Unified command portal |
| `aegis` | `artifacts/aegis/` | `@szl-holdings/shared-ui`, `@szl-holdings/api-client-react` | Aegis security & defense |
| `vessels` | `artifacts/vessels/` | `@szl-holdings/shared-ui`, `@szl-holdings/api-client-react` | Vessels maritime intelligence |
| `terra` | `artifacts/terra/` | `@szl-holdings/shared-ui`, `@szl-holdings/api-client-react` | Terra real estate intelligence |
| `carlota-jo` | `artifacts/carlota-jo/` | `@szl-holdings/shared-ui`, `@szl-holdings/api-client-react` | Carlota Jo advisory |
| `szl-holdings-mobile` | `artifacts/szl-holdings-mobile/` | `@szl-holdings/mobile-shared`, `@szl-holdings/offline-engine` | CORTEX mobile command |
| `mockup-sandbox` | `artifacts/mockup-sandbox/` | `@szl-holdings/shared-ui` | Design system preview |

---

## Dependency Visualization (Simplified)

```
                     ┌─────────────────────────┐
                     │    External Consumers    │
                     │  api-server · web apps   │
                     │  mobile apps             │
                     └────────────┬────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │   Execution     │ │      AI &       │ │   Integration   │
    │   workflow-eng  │ │    ai-engine    │ │     services    │
    │   forge-runtime │ │  intelligence-  │ │  data-connect.  │
    │   audit         │ │    feeds        │ │  mcp-client     │
    │   approvals     │ │  outcome-graph  │ │  graphql-client │
    │   prism-bus     │ │  proof-chain    │ └────────┬────────┘
    └────────┬────────┘ └────────┬────────┘          │
             │                   │                   │
             └───────────┬───────┘                   │
                         ▼                           │
              ┌─────────────────┐                    │
              │   Auth Layer    │                    │
              │     auth        │◄───────────────────┘
              │  policy-engine  │
              │ covenant-policy │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   Foundation    │
              │       db        │
              │  observability  │
              │    api-zod      │
              │    api-spec     │
              └─────────────────┘
```

---

## Known Naming Inconsistencies

| Issue | Detail | Status |
|-------|--------|--------|
| `vessels.ts` vs `maritime.ts` schema | Two parallel vessel data schemas exist: `lib/db/src/schema/vessels.ts` and `lib/db/src/schema/maritime.ts`. The original `vessels.ts` schema now declares `org_id` on `vessels_fleets`, `vessels`, and `vessels_alert_rules` (migration `0076_vessels_org_id.sql`); routes in `routes/vessels.ts` enforce tenant scoping via `tenantScope()`. | ✅ Resolved Apr-2026 (Task #1048, AF-007) |
| PRISM framework naming | `PRISM` refers to both the Lyte business observability framework (Pulse/Risk/Intelligence/Signals/Motion) and Counsel (legal matter management). Confusing in docs and codebase. | ⚠️ Open — tracked as TD-001 in KNOWN-GAPS.md |
| `authMiddleware.ts` vs `auth.ts` (routes/middlewares) | Two files named similarly: `middlewares/authMiddleware.ts` (session hydrator, global) and `middlewares/auth.ts` (route-level enforcer with `requireRole`). Should be renamed for clarity. | ⚠️ Open — low priority |
| `lyte-command-center` vs `command` | ARCHITECTURE.md references `lyte-command-center/` but the actual registered artifact is `command/`. | ✅ Noted — docs updated |

---

## Package Ownership Matrix

| Area | Primary Owner | Packages |
|------|---------------|---------|
| Data layer | Platform Engineering | `@szl-holdings/db`, `@szl-holdings/audit`, `@szl-holdings/proof-chain` |
| Auth & Security | Security Lead | `@szl-holdings/auth`, `@szl-holdings/policy-engine`, `@szl-holdings/covenant-policy` |
| AI & Intelligence | AI Engineering | `@szl-holdings/ai-engine`, `@szl-holdings/intelligence-feeds` |
| Workflow & Approvals | Platform Engineering | `@szl-holdings/workflow-engine`, `@szl-holdings/forge-runtime`, `@szl-holdings/approvals` |
| Frontend | Frontend Engineering | `@szl-holdings/shared-ui`, `@szl-holdings/api-client-react` |
| Mobile | Mobile Engineering | `@szl-holdings/mobile-shared`, `@szl-holdings/offline-engine` |

---

## Dependency Risk Flags

| Risk | Detail | Severity |
|------|--------|----------|
| `@szl-holdings/db` is a single point of failure | Every package depends on it; schema changes cascade broadly | P1 — mitigated by TypeScript type safety |
| No `CODEOWNERS` file | Ownership is documented here but not enforced at the git level | P1 — tracked as KG013 in KNOWN-GAPS.md |
| `vessels.ts` schema `org_id` retrofit | Original vessel product schema now includes `org_id` columns + indexes via migration `0076_vessels_org_id.sql` | ✅ Resolved Apr-2026 (Task #1048, AF-007) |
| `conversations` table lacks `org_id` | AI conversation history not tenant-scoped at DB level | P2 — tracked as AF-008 in AUDIT_FINDINGS_REGISTER.md |

---

*Last verified against source code: 2026-04-16. Run `pnpm -r ls --depth=1` for the live dependency graph.*
