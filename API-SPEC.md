# API Specification — SZL Platform

Canonical reference for API surface metrics cited in investor due diligence.
See `DATA-MODEL.md` for schema and table counts; `ARCHITECTURE.md` for system topology.

---

## Quick Reference

| Metric | Stated value | Source |
|--------|-------------|--------|
| Route files | 256 | `artifacts/api-server/src/routes/` |
| Total endpoints | 2,300 | `router.{get,post,put,patch,delete}` calls across all route files |
| GraphQL types | 120 | `artifacts/api-server/src/graphql/` |

---

## API Surface Detail

### REST Endpoints

The API server exposes approximately **2,300+ REST endpoints** across ~256 route files.
Each route file maps to a distinct product domain (e.g. `agents.ts`, `terra.ts`, `vessels.ts`).
Endpoints follow the pattern `/api/<domain>/<resource>[/:id]` and are versioned via path prefix when needed.

HTTP methods in use: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

### GraphQL

A unified GraphQL layer (schema-first) complements the REST surface for relational queries
and real-time subscriptions. The schema currently defines approximately **120 named types**
across domain packs located in `artifacts/api-server/src/graphql/domains/`.

---

## Notes for Due Diligence

- Endpoint counts are derived from static analysis (`router.*` call counting) and may vary
  slightly from runtime counts due to conditional registrations or middleware-mounted routers.
- GraphQL type count covers `type`, `input`, `enum`, and `interface` definitions; it excludes
  built-in scalars and directives.
- Both figures are automatically tracked by `scripts/docs/check-docs-sync.js` which emits
  advisory warnings when the codebase diverges from the stated values by more than the
  configured tolerance bands.
