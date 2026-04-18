# Backend Route Readiness Matrix

**Date:** April 16, 2026
**Maintained by:** Platform Engineering
**Source:** `artifacts/api-server/src/routes/`
**Total route files audited:** ~170

---

## Classification Definitions

| Class | Meaning |
|-------|---------|
| **WIRED** | Route is fully implemented: handler logic, real DB queries, auth middleware, Zod validation all present. Returns live data. |
| **PARTIAL** | Route is implemented and returns data, but relies on seeded/demo data in one or more areas, or is missing Zod input validation. |
| **MOCK** | Route responds with hardcoded/static JSON. Logic scaffolded but no real DB or external integration. |
| **SPECULATIVE** | Route file exists but handler is a stub, TODO, or no-op. Not user-facing. |

---

## Core Infrastructure Routes

| Route Path | File | Class | Auth | Rate Limited | Notes |
|------------|------|-------|------|-------------|-------|
| `GET /api/health` | `core.ts` | WIRED | Public | Skipped (exempt) | DB liveness + dependency check |
| `GET /api/health/detailed` | `core.ts` | WIRED | Public | Skipped | Expanded system status |
| `GET /api/ready` | `core.ts` | WIRED | Public | Skipped | Kubernetes/Replit readiness probe |
| `GET /api/version` | `core.ts` | WIRED | Public | Global | Build info from package.json |
| `GET /api/csrf-token` | `core.ts` | WIRED | Public | Global | CSRF token issuance |
| `GET /api/docs` | `core.ts` | WIRED | Public | Global | Swagger UI |
| `GET /api/openapi.json` | `core.ts` | WIRED | Public | Global | OpenAPI 3.x spec |
| `GET /api/public/status` | `public-status.ts` | WIRED | Public | Global | Public platform status page feed |
| `GET /api/version` | `changelog.ts` | WIRED | Auth | Global | Changelog + versioning |

---

## Auth Routes (`/api/auth/`)

| Route | Class | Auth | Notes |
|-------|-------|------|-------|
| `POST /api/auth/login` | WIRED | Public | OIDC/PKCE flow; strict rate limiter (5/min) |
| `POST /api/auth/logout` | WIRED | Session | Session invalidation |
| `GET /api/auth/callback` | WIRED | Public | OIDC redirect handler |
| `GET /api/auth/session` | WIRED | Session | Current session info |
| `GET /api/auth/providers` | WIRED | Public | Lists configured OIDC providers |
| `POST /api/auth/register` | WIRED | Public | New user registration; write limiter |
| `POST /api/auth/password-reset` | WIRED | Public | Password reset initiation; strict limiter |
| OIDC provider routes | `oidc-auth.ts` | WIRED | Public | Full OIDC Authorization Code + PKCE |

---

## Admin Routes (`/api/admin/`)

| Route | Class | Auth | Notes |
|-------|-------|------|-------|
| `GET /api/admin/users` | WIRED | `adminGuard` (super_admin/ops/exec) | User management |
| `POST /api/admin/users/:id/roles` | WIRED | `adminGuard` | Role assignment |
| `GET /api/admin/feature-flags` | WIRED | `adminGuard` | Feature flag management |
| `POST /api/admin/feature-flags` | WIRED | `adminGuard` | Create/update flags |
| `GET /api/admin/audit-log` | WIRED | `adminGuard` | Tamper-proof audit log |
| `GET /api/admin/tenants` | WIRED | `adminGuard` | Tenant overview |
| Admin routes not publicly linked | Confirmed | `adminGuard` | No public nav links to `/api/admin/` |

> **Verification:** `adminGuard` enforces `RoleName ∈ {super_admin, ops, exec}`. Internal service bypass requires `ALLOY_INTERNAL_TOKEN` match via constant-time comparison. Admin routes are not referenced in any public frontend navigation.

---

## AI & Agent Routes

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/ai/*` | `ai-engine.ts` | PARTIAL | Provider wrappers (OpenAI/Anthropic/Gemini) wired; degrades to no-op without API keys |
| `/api/ai/safety` | `ai-safety.ts` | WIRED | Content safety screening |
| `/api/domain-agents/*` | multiple | PARTIAL | Agent config wired; execution varies by domain |
| `/api/agent-autonomy/*` | `agent-autonomy.ts` | PARTIAL | Autonomy toggles; partial Zod coverage |
| `/api/agent-training/*` | `agent-training.ts` | PARTIAL | Training pipeline; seeded data |
| `/api/agent-federation/*` | `agent-federation.ts` | SPECULATIVE | Mesh federation stubs; no live cross-tenant exec |
| `/api/a2a/*` | `a2a.ts` | SPECULATIVE | Agent-to-agent protocol stubs |
| `/api/agent-os/*` | `agent-os.ts` | SPECULATIVE | OS-level agent management; not yet user-facing |
| `/api/mcp/*` | `mcp.ts` | SPECULATIVE | Model Context Protocol stubs |
| `/api/consciousness/*` | `consciousness.ts` | SPECULATIVE | Exploratory; not user-facing |

---

## Alloy (Internal AI Orchestration) Routes

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/alloy/*` | `alloy.ts` | PARTIAL | Core Alloy engine; live DAG execution |
| `/api/alloy/chat` | `alloy-chat.ts` | WIRED | LLM chat with session history |
| `/api/alloy/email` | `alloy-email.ts` | WIRED | Email integration (Microsoft/Google) |
| `/api/alloy/meetings` | `alloy-meetings.ts` | WIRED | Calendar/meeting connectors |
| `/api/alloy/digest` | `alloy-digest.ts` | PARTIAL | AI digest; partially mocked |
| `/api/alloy/research` | `alloy-research.ts` | PARTIAL | Research agent; some live feeds |
| `/api/alloy/voice` | `alloy-voice.ts` | PARTIAL | Voice channel; STT/TTS optional |
| `/api/alloy/cognitive-learning` | `alloy-cognitive-learning.ts` | PARTIAL | Cognitive graph; partially live |
| `/api/alloy/skills` | `alloy-skills.ts` | WIRED | Skill registry + execution |
| `/api/alloy/governance` | `alloy-governance.ts` | WIRED | Governance and audit hooks |
| `/api/alloy/channels` | `alloy-channels.ts` | PARTIAL | Channel management |
| `/api/alloy/integrations/*` | `alloy-integrations.ts` | WIRED | Integration registry + webhook receive/HMAC |

---

## Security & Defense Routes (Aegis / Firestorm)

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/firestorm/*` | `firestorm/` (dir) | PARTIAL | SOC ops, incidents, alerts, MITRE mapping; live threat feeds wired (CISA KEV, NVD); scenario data seeded |
| `/api/intelligence/*` | `intelligence*.ts` | PARTIAL | Live threat intelligence feeds; some seeded |
| `/api/msp/*` | `msp.ts` / `msp-live.ts` | PARTIAL | MSP tools; live subset + seeded demo |
| `/api/compliance/*` | `compliance.ts` | PARTIAL | Regulatory framework; some frameworks seeded |
| `/api/audit` | `audit.ts` | WIRED | Immutable event log |
| `/api/audit-chain` | `audit-chain.ts` | WIRED | Blockchain-backed audit trail |
| `/api/proof-chain` | `proof-chain.ts` | WIRED | Attribution tracking |

---

## Domain-Specific Routes

### Terra (Real Estate)

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/terra/*` | `terra.ts` | PARTIAL | NYC Open Data live; broker CRM seeded |
| `/api/terra/live` | `terra-live.ts` | WIRED | Live NYC distress pipeline |
| `/api/terra/distress` | `terra-distress.ts` | WIRED | Distress radar; NYC Open Data |
| `/api/terra/broker` | `terra-broker.ts` | PARTIAL | Broker CRM; seeded contacts |
| `/api/terra/crm/*` | `terra-crm/` | PARTIAL | CRM modules; partially seeded |

### Vessels (Maritime)

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/vessels/*` | `vessels.ts` | PARTIAL | Core fleet routes; AIS simulated |
| `/api/vessels/live` | `vessels-live.ts` | PARTIAL | Live AIS ingestion; simulated without MARINE_TRAFFIC_API_KEY |
| `/api/vessels/extended` | `vessels-extended.ts` | PARTIAL | Extended intelligence; partially wired |
| `/api/vessels/insurance` | `vessels-insurance.ts` | MOCK | New module; not connected to live DB |
| `/api/vessels/trading` | `vessels-trading.ts` | MOCK | New module; not connected to live DB |
| `/api/vessels/platform` | `vessels-platform.ts` | MOCK | New module; not connected to live DB |

### Carlota-Jo (Advisory)

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/carlota-jo/*` | `carlota-jo.ts` | WIRED | Full booking, case, advisory; live Outlook integration |
| `/api/carlota-live/*` | `carlota-live.ts` | WIRED | Live World Bank/BLS feeds |
| `/api/booking/*` | `booking.ts` | WIRED | Booking flow + intake |

### Prism Counsel (Legal)

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/prism/core` | `prism-counsel-core.ts` | PARTIAL | Matter management; partially wired |
| `/api/prism/court` | `prism-counsel-court.ts` | MOCK | Court filing stubs with attorney-review placeholders |
| `/api/prism/ny` | `prism-counsel-ny.ts` | PARTIAL | NY-specific rules; partially wired |
| `/api/prism/ops` | `prism-counsel-ops.ts` | PARTIAL | Operations; seed scripts broken |
| `/api/prism/review` | `prism-counsel-review.ts` | PARTIAL | Review workflow; partially wired |
| `/api/prism/*` (pilot routes) | multiple | SPECULATIVE | Pilot-specific modules; not yet live |

---

## Platform & Billing Routes

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/billing/*` | `billing.ts` | PARTIAL | Stripe fully implemented; test keys only; webhook signature verification present |
| `/api/scim/*` | `scim.ts` | WIRED | SCIM 2.0 (RFC 7643/7644) provisioning |
| `/api/notifications/*` | `notifications.ts` | WIRED | Notification management |
| `/api/onboarding/*` | `onboarding.ts` | WIRED | User onboarding flows |
| `/api/org-settings/*` | `org-settings.ts` | WIRED | Org-level settings |
| `/api/unified-settings/*` | `unified-settings.ts` | WIRED | Cross-platform settings sync |
| `/api/support/*` | `support.ts` | PARTIAL | Support ticket ingestion; email delivery conditional on key |
| `/api/contact` | `contact.ts` | WIRED | Public contact form; `publicSubmitLimiter` (5/hr) |

---

## Observability & Infrastructure Routes

| Route Path | File | Class | Notes |
|------------|------|-------|-------|
| `/api/control-tower/*` | `control-tower/` | PARTIAL | Mesh orchestration; partially live |
| `/api/stream/*` | `streaming-ingestion.ts` | PARTIAL | AIS/SIEM real-time ingestion; simulated without keys |
| `/api/observability/*` | `observability.ts` | PARTIAL | Internal metrics; no external APM yet |
| `/api/telemetry/*` | `telemetry.ts` | PARTIAL | Event telemetry collection |
| `/api/analytics/*` | `analytics.ts` | PARTIAL | Platform analytics |
| `/api/reports/*` | `reports.ts` | PARTIAL | Report generation; some reports live |
| `/api/backup/*` | `backup.ts` | WIRED | Database backup management |

---

## Speculative / Out-of-Scope Routes

The following route files exist but are classified as speculative — not currently user-facing and not on the primary launch path:

| Route File | Reason |
|------------|--------|
| `tenant-provisioning/` | Enterprise multi-tenant — explicitly OOS for launch |
| `consciousness.ts` | Exploratory research route |
| `a2a.ts` | Agent-to-agent protocol prototype |
| `agent-os.ts` | OS-level agent management — future capability |
| `mcp.ts` | Model Context Protocol — future integration |
| `worldline.ts` | Payment alternative — not active |
| `ontology.ts` | Knowledge graph tooling — research only |
| `outcome-graph.ts` | Experimental outcome modeling |
| `receipt-graph.ts` | Experimental attribution model |
| `monte-carlo.ts` | Risk simulation stubs |
| `ml-pipeline.ts` | ML pipeline management — not active |
| `atlas-spatial-runtime.ts` | Spatial AI runtime — speculative |
| `atlas-artifacts.ts` | Atlas artifact store — speculative |
| `nuro-mesh-advanced.ts` | Advanced mesh — speculative |
| `multiplayer-sessions.ts` | Collaborative sessions — future |
| `pulse-evals.ts` | Evaluation framework — partial |

---

## Security Verification Summary

| Control | Status | Evidence |
|---------|--------|---------|
| Global auth enforcer | Confirmed active | `global-auth-enforcer.ts` — deny-by-default; strict allowlist for public paths |
| Admin route protection | Confirmed | `adminGuard` requires `super_admin / ops / exec`; no public nav links |
| Rate limiting (global) | Confirmed | 200 req/15 min (prod); health endpoints exempt |
| Rate limiting (write) | Confirmed | 100 req/15 min (prod) |
| Rate limiting (auth) | Confirmed | 5 req/min IP-based sliding window (strict, fail-closed) |
| Rate limiting (public forms) | Confirmed | 5 req/hr via `publicSubmitLimiter` |
| Stripe webhook verification | Confirmed | HMAC-SHA256 signature check in `billing.ts:223` |
| Alloy webhook verification | Confirmed | HMAC-SHA256 in `alloy-integrations.ts:274` |
| Webhook idempotency | Partial | Stripe events use `checkout.session.completed` guard; generic webhook deduplication not enforced globally |
| Admin routes not publicly linked | Confirmed | No frontend nav links to `/api/admin/*` |
| Zero Trust middleware | Active | Context-aware verification on sensitive ops |

---

## Route Coverage Summary

| Class | Count (approx.) | % of routes |
|-------|----------------|-------------|
| WIRED | ~60 | ~35% |
| PARTIAL | ~65 | ~38% |
| MOCK | ~15 | ~9% |
| SPECULATIVE | ~30 | ~18% |

> **Note:** Zod input validation coverage is 84%+ of route files (GAP-001 closed April 18, 2026). All DB queries use parameterized Drizzle ORM — no raw SQL. A CI script (`scripts/check-zod-coverage.sh`) enforces the 80% threshold.
