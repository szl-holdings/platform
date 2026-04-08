# The Technical Architecture of SZL Holdings

I get asked about the architecture of SZL Holdings more than anything else. People hear "16 applications, one monorepo, one person" and assume there is either a trick or a lie. There is neither.

This is a technical walkthrough of how the system actually works.

## The Monorepo

Everything lives in a single pnpm monorepo. The workspace structure:

```
artifacts/
  api-server/          # Shared Express API — 1,618 endpoints
  szl-holdings/        # Parent company site
  lyte-command-center/ # Business observability
  vessels/             # Maritime intelligence
  firestorm/           # Unified defense (Aegis)
  terra/               # Real estate intelligence
  prism-counsel/       # Legal matter command
  carlota-jo/          # Private advisory
  stephen-site/        # Founder identity
  *-mobile/            # 8 Expo React Native mobile apps
lib/
  db/                  # Shared Drizzle ORM schema
  shared-ui/           # Shared component library
```

One `pnpm install`. One `node_modules`. Shared TypeScript configuration. Shared ESLint rules. Shared Vite configuration.

## The Database

446 tables in a single PostgreSQL database. This is the most controversial architectural decision and the one I am most confident about.

Conventional wisdom says each service should own its data. This works well for large teams where database ownership boundaries align with team boundaries. For a single-person operation, it creates artificial barriers between data that naturally belongs together.

A maritime vessel has a compliance status. That compliance status is relevant to the security posture tracked in Aegis. That security posture affects the risk assessment in Lyte. In a multi-database architecture, surfacing these relationships requires inter-service communication. In a single-schema architecture, it requires a JOIN.

The schema is organized by domain prefix: `vessels_*`, `aegis_*`, `terra_*`, `prism_*`, etc. Cross-domain queries are explicit and intentional. The shared schema provides integration for free without sacrificing domain clarity.

## The API Layer

The API server is a single Express application with 1,618 endpoints organized by domain. Every endpoint follows the same pattern:

1. Request validation (Zod schemas)
2. Authentication check (session-based with RBAC)
3. Business logic (domain-specific)
4. Response serialization (Zod schemas)
5. Audit logging (structured, immutable)

The consistency matters more than any individual technical choice. Every endpoint behaves the same way. Every error is handled the same way. Every audit log has the same structure.

## The Execution Engine (Alloy)

Alloy is the connective tissue. It handles three things:

**Signal Normalization** — Every platform generates operational signals (alerts, metrics, events). Alloy normalizes them into a common format so they can be processed by cross-platform intelligence.

**Approval Routing** — Actions that require human approval flow through Alloy's governed pipeline. The pipeline enforces approval policies, captures decisions, and maintains the audit trail.

**Workflow Orchestration** — Multi-step operations — from incident response in Aegis to deal progression in Terra — are orchestrated by Alloy workflows with explicit state management and failure handling.

## The Frontend

Every web application is a React + Vite SPA. Every mobile application is an Expo React Native app. They share:

- A design system built on Tailwind CSS with platform-specific theme tokens
- A component library (`@szl-holdings/shared-ui`) with 50+ shared components
- TanStack React Query for data fetching with consistent caching and error handling
- Wouter for routing (web) and React Navigation (mobile)

## The Numbers

- 446 PostgreSQL tables
- 1,618 REST API endpoints
- 16 applications (8 web, 8 mobile)
- 1 TypeScript monorepo
- 1 developer

The architecture makes the numbers possible. The numbers validate the architecture.

---

*Stephen Lutar is the Founder & CEO of SZL Holdings. [szlholdings.com](https://szlholdings.com)*
