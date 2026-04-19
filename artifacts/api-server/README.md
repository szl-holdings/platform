# API Server — Platform Backend

> The shared infrastructure backbone: 2,816 REST and GraphQL endpoints, 11-role RBAC, org-scoped multi-tenancy, immutable Proof Chain, and real-time SSE signal feeds.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

---

## What it does

The API Server is the shared backend platform that powers every SZL Holdings surface: the Dashboard, Command, Vessels, Terra, Sentra, Carlota Jo, Pulse, and the mobile CORTEX app. It is the single source of truth for authentication, authorization, data access, AI orchestration, audit logging, and real-time signal delivery.

It is not a microservice. It is a carefully structured monolith with domain-scoped service layers — a deliberate architectural choice that preserves cross-domain correlation (the PRISM Bus event system) without the operational complexity of distributed services.

## Capabilities

- **REST + GraphQL** — 2,816 endpoints across REST route handlers and Apollo GraphQL schema
- **11-Role RBAC** — Deny-by-default role-based access control. Every route is access-controlled; no unprotected endpoints
- **Org-Scoped Multi-Tenancy** — All database queries include `org_id` isolation. Cross-tenant access architecturally prevented
- **Proof Chain** — Immutable, append-only audit log for every consequential action with actor attribution, timestamp, source, and decision context
- **Alloy Execution Fabric** — Durable workflow orchestration, approval chains, human-in-the-loop gates, and agent coordination
- **PRISM Bus** — Cross-domain event system that normalizes, routes, and correlates signals across all domain packs
- **SSE Real-Time Feeds** — Server-Sent Events for live domain signal feeds (one per domain pack, one aggregate)
- **AI Orchestration** — Multi-provider AI (Anthropic, OpenAI, Gemini) with evidence-backed retrieval and mock/live execution modes
- **Rate Limiting** — Per-route and per-tenant rate limits with structured error responses
- **Request Tracing** — Every request carries a correlation ID for end-to-end traceability

## Architecture

```
Client (Web / Mobile)
          |
    Express 5 (middleware chain)
          |
    Auth Middleware (OIDC/PKCE token verification)
          |
    RBAC Middleware (role check, deny-by-default)
          |
    Rate Limiter + Request ID
          |
    Route Handler → Domain Service
          |
    Repository Layer (Drizzle ORM)
          |
    PostgreSQL 16
```

See [`ARCHITECTURE.md`](../../ARCHITECTURE.md) and [`API-SPEC.md`](../../API-SPEC.md) for the full route inventory and auth model.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 22, Express 5 |
| **Language** | TypeScript (strict mode) |
| **API** | REST (Express Router) + GraphQL (Apollo Server) |
| **ORM** | Drizzle ORM (type-safe, PostgreSQL-first) |
| **Database** | PostgreSQL 16 |
| **Auth** | OIDC/PKCE, JWT, session signing (express-session) |
| **AI** | Anthropic Claude, OpenAI GPT, Google Gemini |
| **Real-time** | Server-Sent Events (SSE) |
| **Validation** | Zod (all request/response schemas) |
| **Testing** | Vitest, Supertest |
| **Process** | Custom supervisor (fast-start, port-proxy, graceful restart) |

## Quick Start

```bash
# From the monorepo root
pnpm install

# Set required environment variables (see Environment Variables section)
# Then:
pnpm --filter @szl-holdings/api-server dev
```

Run tests:

```bash
pnpm test:unit               # API server unit tests
pnpm test:integration        # Integration tests (requires live database)
```

## Notable Source Paths

| Path | Purpose |
|------|---------|
| `src/app.ts`, `src/index.ts` | Express bootstrap and entrypoint |
| `src/routes/` | REST route handlers (organized by domain) |
| `src/graphql/` | Apollo GraphQL schema and resolvers |
| `src/middlewares/` | Auth, RBAC, rate limit, CORS, validation, request ID |
| `src/services/` | Domain services (proof chain, signals, alloy, AI, etc.) |
| `src/data/` | Drizzle ORM schema and repositories |
| `src/jobs/` | Scheduled and background jobs |
| `src/config/` | Environment and runtime configuration |
| `src/__tests__/` | Vitest test suites |
| `supervisor.mjs`, `port-proxy.mjs`, `fast-start.mjs` | Process supervision and dev startup |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `APP_ENV`, `APP_URL`, `APP_BASE_URL` | Runtime mode and public URLs |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET`, `JWT_SECRET` | Auth/session signing |
| `ADMIN_PIN` | Forge admin PIN gate |
| `AI_EXECUTION_MODE` | AI execution policy (`live`, `mock`, etc.) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic API key |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Google Gemini API key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Override for OpenAI-compatible base URL |
| `ALLOY_INTERNAL_TOKEN`, `ALLOY_EMAIL_INGEST_SECRET` | Alloy ingest auth |
| `ALLOY_WORKFLOW_AUTO_RUN`, `ALLOY_REQUIRE_APPROVAL_CRITICAL` | Alloy runtime policy |
| `AIS_FEED_ENABLED` | Toggle AIS maritime feed |
| `AMPLITUDE_API_KEY` | Server-side analytics |

See [`ops/infra/environment-matrix.md`](../../ops/infra/environment-matrix.md) for the complete matrix.

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [security@szlholdings.com](mailto:security@szlholdings.com)
