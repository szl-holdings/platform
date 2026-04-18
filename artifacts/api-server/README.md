# API Server

Backend API platform serving all web and mobile clients. Runs Express.js with Apollo GraphQL, Drizzle ORM, and PostgreSQL.

**Kind:** web (API)
**Preview path:** `/api/`
**Artifact dir:** `artifacts/api-server/`

## Local development

```bash
pnpm --filter @szl-holdings/api-server dev
```

## Key capabilities

- REST and GraphQL endpoints
- 11-role RBAC with deny-by-default enforcement
- Org-scoped query isolation (multi-tenancy)
- Immutable Proof Chain audit logging
- Rate limiting, CORS, Zod validation, structured errors, request IDs
- SSE streams for real-time domain signal feeds

## Notable modules

| Path | Purpose |
|------|---------|
| `src/app.ts`, `src/index.ts` | Express bootstrap and entrypoint |
| `src/routes/` | REST route handlers |
| `src/graphql/` | Apollo GraphQL schema and resolvers |
| `src/middlewares/` | Auth, RBAC, rate limit, CORS, validation, request ID |
| `src/services/` | Domain services (proof chain, signals, alloy, etc.) |
| `src/data/` | Drizzle ORM schema and repositories |
| `src/jobs/` | Scheduled and background jobs |
| `src/config/` | Environment and runtime configuration |
| `src/__tests__/` | Vitest test suites |
| `supervisor.mjs`, `port-proxy.mjs`, `fast-start.mjs` | Process supervision and dev startup |

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `APP_ENV`, `APP_URL`, `APP_BASE_URL` | Runtime mode and public URLs |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET`, `JWT_SECRET` | Auth/session signing |
| `ADMIN_PIN` | Forge admin PIN gate |
| `AI_EXECUTION_MODE` | AI execution policy (`live`, `mock`, etc.) |
| `AI_INTEGRATIONS_OPENAI_API_KEY`, `..._ANTHROPIC_API_KEY`, `..._GEMINI_API_KEY` | AI provider keys |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Override for OpenAI-compatible base URL |
| `ALLOY_INTERNAL_TOKEN`, `ALLOY_EMAIL_INGEST_SECRET` | Alloy ingest auth |
| `ALLOY_DIGEST_SLACK_CHANNEL`, `ALLOY_WORKFLOW_AUTO_RUN`, `ALLOY_REQUIRE_APPROVAL_CRITICAL`, `ALLOY_MAX_BATCH_SIZE` | Alloy runtime tuning |
| `AIS_FEED_ENABLED` | Toggle AIS maritime feed |
| `AMPLITUDE_API_KEY` | Server-side analytics |

See `ops/infra/environment-matrix.md` for the full environment variable matrix.

## Architecture

See `ARCHITECTURE.md` and `API-SPEC.md` for route inventory and the auth model.
