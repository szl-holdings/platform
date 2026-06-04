# Technical Buyer Integration Brief

**Owner:** Stephen Lutar · **Audience:** Buyer-side engineering lead, security reviewer, integration architect

This is the document we hand to the technical buyer in the first 48 hours after a successful executive demo. It is not a marketing piece. It is a working brief that lets a senior engineer answer three questions:

1. *What does it cost me to integrate?*
2. *What guarantees do I get from the API surface?*
3. *What is the path from a read-only pilot to a fully event-driven production deployment?*

## 1. Architecture in one diagram (verbal)

The platform exposes three surfaces:

- **Public API** (HTTPS, OAuth 2.0 / OIDC) — read and write resources within a tenant; this is what your engineering team will integrate against.
- **Webhooks** (HMAC-signed POST) — outbound events tied to the canonical 9-step loop; you register URLs per event class. See `event-and-webhook-roadmap.md` for current event classes.
- **Streaming endpoint** (Phase 3, strategic accounts only) — server-sent events for low-latency consumption.

Internal surfaces — admin operations, tenant provisioning, telemetry ingest — are explicitly *not* part of the public contract and may change without notice. Public route prefixes are documented in section 4.

## 2. Authentication & tenancy

- OAuth 2.0 with PKCE for user-context flows; OIDC for SSO.
- Service-to-service: tenant-scoped API keys, rotated on demand. Each key carries an attestation of the integration tier (0/1/2/3) it is approved for.
- Every request is tenant-scoped at the gateway; cross-tenant requests are rejected at the perimeter and produce an audit row.
- All write operations carry the calling identity into the audit log under `actorType: "agent"` (service) or `"user"` (delegated).

## 3. The four integration tiers (recap)

See `integration-expansion-model.md` for commercial detail. Engineering implications:

| Tier | What you ship | Effort | Risk |
|------|--------------|--------|------|
| 0 — Read-only signal ingest | Connector config + credential | Hours | None — read-only |
| 1 — Receipt write-back | A field / comment / message hook in your system | Days | Low — additive writes |
| 2 — Action execution | Approved write paths in your system, gated by our policy engine | Weeks | Medium — your security review owns the surface area |
| 3 — Bidirectional events | Webhook receiver + (optionally) event emission to us | Weeks | Strategic — full loop integration |

## 4. API surface — public vs internal

The public API is organised under stable route prefixes. Anything **not** in this list should be treated as internal and may change.

> **Status note (current):** The platform today exposes domain-mounted routes under `/api/{domain}/*` (for example `/api/lyte/*`, `/api/command/*`, `/api/approvals/*`, `/api/audit/*`). The **public, versioned contract described below is the canonical surface we will publish at GA**, mapped from the existing domain routes with explicit deprecation windows. Design partners receive both the current and the canonical surface in parallel during the pilot window.

### Public (canonical contract at GA — `/api/v1/*`)
- `/api/v1/signals` — list, get, search signals (current: `/api/lyte/signals`, `/api/command/signals`)
- `/api/v1/recommendations` — list, get, search decision receipts (current: `/api/decisioning/*`)
- `/api/v1/approvals` — list, get, transition approvals (current: `/api/approvals/*`)
- `/api/v1/actions` — list, get, transition actions (current: `/api/lyte/actions`)
- `/api/v1/audit` — list and search audit records, read-only (current: `/api/audit/*`)
- `/api/v1/webhooks` — register, list, delete webhook subscriptions (current: `/api/webhooks/*`)
- `/api/v1/integrations` — connector configuration for Tier 0/1 (current: `/api/integrations/*`, `/api/connectors/*`)

### Internal (no public guarantee, subject to change)
- Admin routes (`/api/admin/*`)
- Tenant provisioning (`/api/tenant-provisioning/*`)
- Internal telemetry ingest (`/api/telemetry/*`, `/api/genai-telemetry/*`)
- Live-data and demo routes (`/api/lyte-live/*`, `/api/aegis-live/*`, `/api/terra-live/*`, `/api/vessels-live/*`, `/api/carlota-live/*`)
- AI runtime / agent gateway internals (`/api/ai-engine/*`, `/api/agent-os/*`, `/api/forge-runtime-api/*`)
- Any route file suffixed `*-live.ts`, `*-extended.ts`, or under `routes/admin/` and `routes/tenant-provisioning/`

If your integration depends on an internal route, raise it with us before going to production — we will either promote it into the canonical `/api/v1/*` surface or provide a stable equivalent.

## 5. Provenance & receipt contract

Every public resource carries:

- A **stable resource ID** of the form `{type}-{numeric}` (e.g. `S-9041`, `R-4412`, `APR-1041`).
- A **provenance object** (`source`, `sourceType`, `confidence`, `ingestedAt`).
- An **audit pointer** (`auditIds: string[]`) listing the audit rows produced by mutations to that resource.

Recommendation resources additionally carry a **receipt** (`scoringFactors[]`, `evidence[]`, `alternatives[]`). Action resources carry their **decision pointer** (`decisionId`) so the chain `signal → context → recommendation → simulation → policy → execution → proof → outcome` is reconstructible from the API alone.

## 6. Idempotency & retries

- All `POST` and `PATCH` mutations accept an `Idempotency-Key` header. Replays within 24 hours return the original response.
- Retries are safe; receipts and audit rows are deduplicated on `(resource, idempotencyKey)`.
- Webhook deliveries are at-least-once; consumers must dedupe on `eventId`.

## 7. Error model

- Errors return `{ "error": { "code": string, "message": string, "auditId": string?, "documentationUrl": string? } }`.
- Policy denials (HTTP 403 with `code: "policy_denied"`) include the `policyId` and `auditId` of the denial. Buyers can reproduce the denial in their own monitoring without privileged access.
- Rate-limit denials (HTTP 429) include retry hints and tier context.
- We do not silently degrade. A request that cannot be honoured fails loudly with an audit row.

## 8. Security review pack

For your security review, we provide on request:

- SOC 2 Type II report (current).
- Penetration test summary (most recent).
- Data flow diagram covering ingest, processing, storage, and webhook emission.
- Tenant isolation attestation.
- Subprocessor list.

## 9. The 90-day path

| Window | Goal | Expected effort on your side |
|--------|------|------------------------------|
| Days 0–14 | Tier 0 read-only ingest live for 1–2 source systems | < 1 engineer-day |
| Days 15–45 | Tier 1 receipt write-back for the same systems | 1–3 engineer-days |
| Days 46–90 | Tier 2 action execution with policy gating | 1–2 engineer-weeks |
| Day 90+ | Optional: Tier 3 bidirectional event integration | Strategic project — staffed jointly |

A buyer who has not reached Tier 2 by day 90 is a buyer who has not yet seen the system protect real value. We treat that as our problem to solve, not yours.

## 10. Who to contact

- **Integration design questions:** founder@szlholdings.com (interim — direct to Stephen until partner engineering staffed).
- **Security review:** same.
- **Production incident:** to be issued upon contract execution.

## Companion docs (internal cross-reference)

- `integration-expansion-model.md`
- `event-and-webhook-roadmap.md`
- `productized-governance.md`
- `trust-narrative-final.md`
