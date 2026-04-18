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

## Environment variables

See `ops/infra/environment-matrix.md` for the full environment variable matrix.

## Architecture

See `ARCHITECTURE.md` and `API-SPEC.md` for route inventory and the auth model.
