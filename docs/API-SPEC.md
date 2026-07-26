# API Specification — SZL Platform

Canonical reference for API surface metrics cited in investor due diligence.
See `DATA-MODEL.md` for schema and table counts; `ARCHITECTURE.md` for system topology.

> **TRUTH LOCK — 2026-07-25.** The generated artifact
> `artifacts/SOURCE_OF_TRUTH.json` is authoritative for current estate counts.
> The April inventory retained below is a historical `REPORTED` snapshot, not a
> current measurement.

## Current Evidence

| Claim | Value | Label | Source |
|---|---:|---|---|
| TypeScript route declarations across scanned workspace roots | UNAVAILABLE | UNAVAILABLE | runtime router inventory is unavailable in `artifacts/SOURCE_OF_TRUTH.json` |
| Tracked route modules under `artifacts/api-server/src/routes` | 1 | MEASURED | repository tree at truth-lock commit |
| OpenAPI operation and path coverage | UNAVAILABLE | UNKNOWN | no current generated OpenAPI receipt |
| GraphQL type count | UNAVAILABLE | UNKNOWN | no current generated schema receipt |

The tracked artifact server currently exposes the Ouroboros route module and a
global authentication enforcer. The CSRF package implements safe-method
classification, timing-safe pair comparison, and cookie options. Whether every
state-changing host route mounts that helper is `UNKNOWN` until a runtime
middleware receipt is produced.

## Current Key Route Paths

These route-relative paths are verified directly against the one tracked
artifact-server route module. The host mount is not inferred here.

| Group | Path | Route File |
|---|---|---|
| A11oy | `/a11oy/guard` | `artifacts/api-server/src/routes/ouroboros.ts` |
| A11oy | `/a11oy/pulse` | `artifacts/api-server/src/routes/ouroboros.ts` |
| Amaru | `/amaru/observe-metric` | `artifacts/api-server/src/routes/ouroboros.ts` |
| Sentra | `/sentra/anchor-event` | `artifacts/api-server/src/routes/ouroboros.ts` |
| Sentra | `/sentra/anchor-state` | `artifacts/api-server/src/routes/ouroboros.ts` |

---

## Historical Quick Reference (REPORTED April 2026 Snapshot)

| Metric | Stated value | Source |
|--------|-------------|--------|
| Route files | 357 | `find artifacts/api-server/src/routes -name '*.ts' ! -name '*.test.ts' ! -name '*.spec.ts' \| wc -l` |
| Total endpoints | 5,065 | OpenAPI 3.1 operations in `lib/api-spec/openapi.yaml` (run `pnpm docs:generate` to refresh) |
| Documented paths | 4,071 | Unique URL paths in the OpenAPI spec |
| GraphQL types | 120 | `artifacts/api-server/src/graphql/` |
| Spec format | OpenAPI 3.1 | served at `/api/docs` |

> **Route file count updated 2026-04-25** from 315 to 357 by Moonshot Phase 1 audit. Source: `audit/source-of-truth.json` v1.3.0.

---

## API Surface Detail

### REST Endpoints

The API contract defines **5,065 REST operations** across **4,071 paths** in `lib/api-spec/openapi.yaml`, rendered into `API-CATALOGUE.md` by `pnpm docs:generate`.
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
| Counsel | `/api/prism-counsel` | Legal matter management, court filing |
| IMPERIUM | `/api/imperium` | Cloud sovereignty, infrastructure governance |
| Carlota Jo | `/api/carlota-jo` | Advisory operations, client portal |
| Command | `/api/command` | Ecosystem hub, cross-domain health |
| Pulse | `/api/pulse` | AI executive briefing, signal aggregation |
| Continuum / Workflow | `/api/continuum` | Business Observability Fabric, execution fabric, approval gates |
| Decision Fabric | `/api/decision-fabric` | Cross-primitive views, workflow 360 |
| Forge | `/api/forge` | AI agent registry, lifecycle, promotion |
| Billing | `/api/billing` | Stripe subscriptions, usage metering |
| AI | `/api/ai` | LLM orchestration, Fusion Bar, copilots |
| Admin | `/api/admin` | Platform admin, org provisioning |
| Observability | `/api/observability` | Telemetry ingest, metrics, alerts |
| GraphQL | `/api/graphql` | Complex cross-domain queries |
| WebSocket | `/api/ws` | Real-time SSE and WebSocket channels |

---

## Key Route Paths

Representative paths drawn from the route-group table above. `check-docs-claims.js` §"Key route paths" verifies that each path string appears as a quoted literal in the listed route handler file, catching renames and removals before they silently invalidate this document.

| Group | Path | Route File |
|-------|------|------------|
| Auth | `/auth/login` | `artifacts/api-server/src/routes/auth.ts` |
| Auth | `/auth/me` | `artifacts/api-server/src/routes/auth.ts` |
| Auth | `/auth/ws-ticket` | `artifacts/api-server/src/routes/auth.ts` |
| Auth | `/auth/login-password` | `artifacts/api-server/src/routes/auth.ts` |
| Vessels | `/vessels/fleets` | `artifacts/api-server/src/routes/vessels.ts` |
| Vessels | `/vessels` | `artifacts/api-server/src/routes/vessels.ts` |
| Terra | `/terra/geocoding-status` | `artifacts/api-server/src/routes/terra.ts` |
| Terra | `/terra/market-intelligence` | `artifacts/api-server/src/routes/terra.ts` |
| Billing | `/billing/plans` | `artifacts/api-server/src/routes/billing.ts` |
| Billing | `/billing/products` | `artifacts/api-server/src/routes/billing.ts` |
| Continuum | `/continuum/workflows` | `artifacts/api-server/src/routes/continuum.ts` |
| Continuum | `/continuum/ingest/signal` | `artifacts/api-server/src/routes/continuum.ts` |
| Forge | `/forge/agents` | `artifacts/api-server/src/routes/forge.ts` |
| Command | `/snapshot` | `artifacts/api-server/src/routes/command.ts` |
| Command | `/alerts` | `artifacts/api-server/src/routes/command.ts` |
| Pulse | `/today` | `artifacts/api-server/src/routes/pulse.ts` |
| Pulse | `/briefings` | `artifacts/api-server/src/routes/pulse.ts` |
| Counsel | `/prism-counsel/matters` | `artifacts/api-server/src/routes/prism-counsel-core.ts` |
| Counsel | `/prism-counsel/health` | `artifacts/api-server/src/routes/prism-counsel-core.ts` |
| IMPERIUM | `/imperium/cloud/resources` | `artifacts/api-server/src/routes/imperium.ts` |
| IMPERIUM | `/imperium/senate/proposals` | `artifacts/api-server/src/routes/imperium.ts` |
| Carlota Jo | `/booking/inquiries` | `artifacts/api-server/src/routes/carlota-jo.ts` |
| Carlota Jo | `/booking/services` | `artifacts/api-server/src/routes/carlota-jo.ts` |

---

## Notes for Due Diligence

- Endpoint counts are derived from static analysis and may vary slightly from runtime counts.
- GraphQL type count covers `type`, `input`, `enum`, and `interface` definitions.
- Both figures are automatically tracked by `scripts/docs/check-docs-sync.js`.
- For full route inventory see [`docs/architecture/route-inventory.md`](docs/architecture/route-inventory.md).
