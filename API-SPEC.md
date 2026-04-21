# API Specification — SZL Platform

Canonical reference for API surface metrics cited in investor due diligence.
See `DATA-MODEL.md` for schema and table counts; `ARCHITECTURE.md` for system topology.

---

## Quick Reference

| Metric | Stated value | Source |
|--------|-------------|--------|
| Route files | 256 | `artifacts/api-server/src/routes/` |
| Total endpoints | ~2,800+ | `router.{get,post,put,patch,delete}` calls across all route files |
| GraphQL types | 120 | `artifacts/api-server/src/graphql/` |
| Spec format | OpenAPI 3.1 | served at `/api/docs` |

---

## API Surface Detail

### REST Endpoints

The API server exposes approximately **2,800+ REST endpoints** across ~256 route files.
Each route file maps to a distinct product domain (e.g. `agents.ts`, `terra.ts`, `vessels.ts`).
Endpoints follow the pattern `/api/<domain>/<resource>[/:id]` and are versioned via path prefix when needed.

HTTP methods in use: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.

### GraphQL

A unified GraphQL layer (schema-first) complements the REST surface for relational queries
and real-time subscriptions. The schema currently defines approximately **120 named types**
across domain packs located in `artifacts/api-server/src/graphql/domains/`.

---

## Authentication Model

- **OIDC (Primary):** Cookie-based via Replit Auth / Azure AD. Session TTL: 7 days.
- **Credential (Fallback):** Bearer token in JSON response. Session TTL: 30 days.
- **Mobile / API:** `Authorization: Bearer <token>` with opaque PostgreSQL session token.
- **WebSocket:** HMAC-signed 5-minute tickets via `POST /api/auth/ws-ticket`.
- **CSRF:** Double-submit pattern on all state-changing requests.

---

## Route Groups (Summary)

| Group | Prefix | Purpose |
|-------|--------|---------|
| Auth | `/api/auth` | Session management, OIDC flows, CSRF |
| Users & Orgs | `/api/users`, `/api/orgs` | User and organization CRUD |
| Aegis / Security | `/api/aegis` | Threat detection, SOC operations, SOAR |
| Vessels / Maritime | `/api/vessels` | Fleet telemetry, voyage economics, sanctions |
| Terra / Real Estate | `/api/terra` | Distress data, ownership graph, deal pipeline |
| PRISM Counsel | `/api/prism-counsel` | Legal matter management, court filing |
| IMPERIUM | `/api/imperium` | Cloud sovereignty, infrastructure governance |
| Carlota Jo | `/api/carlota-jo` | Advisory operations, client portal |
| Command | `/api/command` | Ecosystem hub, cross-domain health |
| Pulse | `/api/pulse` | AI executive briefing, signal aggregation |
| Alloy / Workflow | `/api/alloy` | Execution fabric, approval gates |
| Decision Fabric | `/api/decision-fabric` | Cross-primitive views, workflow 360 |
| Forge | `/api/forge` | AI agent registry, lifecycle, promotion |
| Billing | `/api/billing` | Stripe subscriptions, usage metering |
| AI | `/api/ai` | LLM orchestration, Fusion Bar, copilots |
| Admin | `/api/admin` | Platform admin, org provisioning |
| Observability | `/api/observability` | Telemetry ingest, metrics, alerts |
| GraphQL | `/api/graphql` | Complex cross-domain queries |
| WebSocket | `/api/ws` | Real-time SSE and WebSocket channels |

---

## Notes for Due Diligence

- Endpoint counts are derived from static analysis and may vary slightly from runtime counts.
- GraphQL type count covers `type`, `input`, `enum`, and `interface` definitions.
- Both figures are automatically tracked by `scripts/docs/check-docs-sync.js`.
- For full route inventory see [`docs/architecture/route-inventory.md`](docs/architecture/route-inventory.md).
