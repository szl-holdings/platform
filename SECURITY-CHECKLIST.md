# SZL Holdings API — Security Checklist

**Last updated:** 2026-04-16  
**Audience:** Enterprise architects, Series A technical advisors, incoming VP Engineering  
**Scope:** `artifacts/api-server` — multi-tenant Express/Node.js API

---

## Authentication & Token Security

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| A1 | All internal service tokens compared with `crypto.timingSafeEqual` | ✅ Done | `middlewares/auth.ts` `checkInternalToken()`, `app.ts` `/api/health/detailed` |
| A2 | Session secret rotatable via `SESSION_SECRET` env var | ✅ Done | `app.ts` — express-session with `SESSION_SECRET` |
| A3 | `ALLOY_INTERNAL_TOKEN` enforces minimum 32-character length; auto-generates secure fallback in dev | ✅ Done | `lib/startup-config.ts` — warns and substitutes in dev, rejects weak tokens |
| A4 | JWT/session expiry enforced | ✅ Done | Session `maxAge` configured; token expiry validated in auth middleware |
| A5 | Auth middleware applied to all non-public routes | ✅ Done | `authMiddleware()` required on all write routes; explicit `authMiddleware({ required: false })` for public reads |
| A6 | Role-based access control (`requireRole`) on admin/exec routes | ✅ Done | `middlewares/auth.ts` — `requireRole` enforced on admin, ops, exec, and certification routes |
| A7 | Impersonation requires `admin` role and persists audit log | ✅ Done | `routes/admin.ts` — `requireRole("admin")` + `logActivity` on impersonation start/end |

---

## Tenant Isolation

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| T1 | `AlloyRetrievalEngine` enforces per-tenant filtering on all retrieval paths | ✅ Done | `lib/ai-engine/src/retrieval/alloy-retrieval.ts` — `tenantId: string` (required, non-optional) on `ingest`, `retrieveSemantic`, `retrieveKeyword`, `retrieveHybrid`, `retrieveFromDb`; caller routes enforce tenant via 403 guard |
| T2 | Retrieval without explicit tenant ID returns empty result set (fail-closed) | ✅ Done | All retrieval methods fail-closed; DB search functions return `[]` and log when `tenantId` is absent |
| T3 | Alloy policy creation enforces org membership (`canWriteForOrg`) | ✅ Done | `routes/alloy-governance.ts` — org-scoped policies validated against caller's org memberships |
| T4 | Knowledge graph ingestion skipped when no tenant context is available | ✅ Done | `routes/msp.ts`, `routes/firestorm.ts` — `if (_tid)` guard before every `ingest*` call |
| T5 | MSP/AI embedding paths are fail-closed on missing tenant | ✅ Done | Noted in code comments; no globally-visible artifact created without tenant |
| T6 | DB-level tenant isolation: `rag_knowledge_chunks.tenant_id` column + index | ✅ Done | `tenant_id TEXT` + `rag_chunks_tenant_id_idx` verified live in DB via `psql`. Migration: `lib/db/migrations/0001_add_tenant_id_to_rag_knowledge_chunks.sql`. Strict `WHERE tenant_id = $N` predicate (no `IS NULL` fallback). `getChunkCount()` tenant-scoped so `totalIndexed` never leaks cross-tenant corpus size. `retrieveFromDb` fail-closed. |
| T7 | `totalIndexed` metadata in retrieval responses is tenant-scoped (not global) | ✅ Done | `AlloyRetrievalEngine.tenantIndexedCount(tenantId)` used in keyword path (`routes/ai-engine.ts`); `retrieveHybrid` uses `this.chunks.filter(c => c.tenantId === tenantId).length` |

---

## Input Validation

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| V1 | Zod `validateBody` middleware applied to all dreamscape write routes | ✅ Done | `routes/dreamscape.ts` — POST/PATCH campaigns, scripts, storyboards, voice-assets |
| V2 | Zod `validateBody` middleware applied to all certification-readiness write routes | ✅ Done | `routes/certification-readiness.ts` — POST/PATCH programs, requirements, status, tasks |
| V3 | Zod validation on alloy governance write routes | ✅ Done | `routes/alloy-governance.ts` — `insertAlloyPolicySchema` on POST /alloy/policies; inline Zod on PATCH /alloy/policies/:id |
| V4 | Holdings inquiry POST has manual validation (name, email regex, message min-length) | ✅ Done | `routes/holdings.ts` — inline validation before DB insert |
| V5 | `validateBody`, `validateQuery`, `validateParams` helpers centralized | ✅ Done | `lib/validation.ts` |
| V6 | Zod validation on all governance write routes | ✅ Done | `routes/governance.ts` — `validateBody` applied to all 6 POST/PATCH routes |
| V7 | Zod validation on all CMS write routes | ✅ Done | `routes/cms.ts` — `validateBody` applied to all 8 write routes |
| V8 | Zod validation on all alloy route write paths | ✅ Done | `routes/alloy.ts` — `validateBody` on flags upsert/patch and approval-decide; `routes/tenant-provisioning.ts` — `validateBody` on all 6 admin write routes |
| V9 | URL parameter sanitization via `parseIdParam` | ✅ Done | All numeric ID params parsed-and-rejected via `parseIdParam` helper |
| V10 | Optimistic concurrency (`If-Match`) enforced on firestorm write paths | ✅ Done | `middlewares/optimistic-concurrency.ts` — `validateIfMatch` applied |
| V11 | Billing write routes Zod-validated (checkout, subscribe, cancel, update) | ✅ Done | `routes/billing.ts` — Zod schemas on 7 high-risk write routes (checkout, customer-portal, stripe/checkout, command/subscribe, terra/subscribe, cancel-subscription, update-subscription) |
| V12 | Admin write routes Zod-validated (users, feature flags, impersonation, sessions) | ✅ Done | `routes/admin.ts` — Zod on connectors/enable, POST /users, feature-flags, artifact-approvals/reject, push-notifications/broadcast, impersonate, impersonate/end, DELETE /sessions |
| V13 | Webhook endpoint creation/update Zod-validated | ✅ Done | `routes/webhooks.ts` — `webhookEndpointSchema.safeParse` on POST, `webhookEndpointUpdateSchema.safeParse` on PATCH |

---

## Logging & Observability

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| L1 | Structured Pino logger used throughout (`lib/logger.ts`) | ✅ Done | All route files import `logger`; `console.*` removed from production paths |
| L2 | No `console.log/error/warn/info` in production route handlers or shared lib files | ✅ Done | Replaced in route files and lib files (`lib/email.ts`, `lib/geocoding.ts`, `lib/ny-forecast-engine.ts`, `lib/ai-engine/src/rag-vector-store.ts`) — all use Pino |
| L3 | Error context (stack, err object) passed as structured fields | ✅ Done | `{ err }` field pattern used throughout |
| L4 | Sensitive data not logged (tokens, session secrets) | ✅ Done | Startup config redacts `DATABASE_URL`, `SESSION_SECRET`, `ALLOY_INTERNAL_TOKEN` |
| L5 | Audit log table (`auditLogsTable`) populated on all privileged mutations | ✅ Done | Certification, alloy governance, and admin routes write audit rows |
| L6 | OpenTelemetry traces exported | ⚠️ Dev-only | OTEL initialized but `exporters=[none]` in development — requires prod exporter config (KG009) |

---

## Secrets & Environment

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| S1 | All secrets injected via environment variables, never hardcoded | ✅ Done | `lib/startup-config.ts` |
| S2 | `CONNECTOR_ENCRYPTION_KEY` warns when using derived dev key | ✅ Done | Warning emitted at startup |
| S3 | Minimum token length enforced for `ALLOY_INTERNAL_TOKEN` | ✅ Done | See A3 |
| S4 | `.env` files excluded from version control | ✅ Done | `.gitignore` |
| S5 | Object storage ACL applied to PDF uploads | ✅ Done | `routes/documents.ts` — ACL set to `private` with `owner` assignment |

---

## Network & Transport

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| N1 | Rate limiting on write-heavy and AI endpoints | ✅ Done | `express-rate-limit` applied — firestorm, dreamscape, AI engine |
| N2 | CORS configured | ✅ Done | `app.ts` — CORS restricted to known origins |
| N3 | Helmet HTTP security headers | ✅ Done | `app.ts` — `helmet()` applied |
| N4 | Trusted proxy configured for rate limiting | ✅ Done | `validate: { xForwardedForHeader: false, ip: false }` |
| N5 | WebSocket connections authenticated | ✅ Done | WS endpoint requires valid session |
| N6 | TLS enforced in production | ✅ Done | Replit reverse proxy enforces TLS; mTLS used on platform preview proxy |

---

## SSRF & External Request Security

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| X1 | Outbound geocoding requests use provider allow-list (Mapbox, Google only) | ✅ Done | `lib/geocoding.ts` — only calls `MAPBOX_ACCESS_TOKEN` and `GOOGLE_MAPS_API_KEY` provider URLs; no user-supplied URLs forwarded |
| X2 | Stripe/payment SDK handles all payment HTTP — no user-supplied payment URLs | ✅ Done | All Stripe calls via SDK; no user-provided redirect hosts allowed by Stripe checkout |
| X3 | Webhook delivery URLs not validated against SSRF allowlist | ⚠️ Open | User-supplied webhook endpoint URLs stored and delivered to without host validation — **KG020b** |
| X4 | Internal metadata endpoint (`169.254.x.x`) not explicitly blocked | ⚠️ Open | No explicit SSRF block list in place — mitigated by Replit sandbox isolation; tracked as KG020b |

---

## File Upload & Data Integrity

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| F1 | File upload metadata validated via Zod schema (`fileUploadMetaSchema`) | ✅ Done | `lib/validation.ts` — filename, mimeType, size constraints |
| F2 | File size limit enforced (`max 100 MB`) | ✅ Done | `fileUploadMetaSchema.size.max(100 * 1024 * 1024)` |
| F3 | Virus / malware scanning on uploaded files | ⚠️ Missing | No antivirus scanning on object storage uploads — tracked as KG020c |
| F4 | Content-Type validated against MIME allowlist | ⚠️ Partial | `mimeType` field validated but no server-side extension/content sniffing block |

---

## Encryption

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| E1 | Data at rest: DB encryption | ✅ Done | Replit-managed PostgreSQL with encryption at rest by default |
| E2 | Data in transit: TLS | ✅ Done | All external traffic via HTTPS; Replit platform enforces TLS |
| E3 | Field-level encryption for connector credentials | ✅ Done | `CONNECTOR_ENCRYPTION_KEY` used to encrypt stored OAuth tokens and API keys |
| E4 | End-to-end field-level encryption for PII fields | ⚠️ Open | No field-level encryption on PII columns (e.g. contact email, user profile) beyond DB-level — tracked as KG020d |

---

## Dependency Security & CI Gates

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| CI1 | CodeQL static analysis configured in CI | ⚠️ Missing | Not configured — KG011 |
| CI2 | Automated dependency vulnerability review on PRs | ⚠️ Missing | `dependency-review-action` not added — KG012 |
| CI3 | `pnpm audit` / `npm audit` run in CI | ⚠️ Missing | No automated audit step in pipeline |
| CI4 | `CODEOWNERS` file defining mandatory review ownership | ⚠️ Missing | Not configured — KG013 |

---

## Vulnerability Disclosure

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| VD1 | `security.txt` / responsible disclosure policy published | ⚠️ Missing | No `/.well-known/security.txt` endpoint; no public disclosure policy |
| VD2 | Internal security reporting process defined | ⚠️ Open | No documented process for internal security issue triage |

---

## Zero-Trust & Service Mesh

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| ZT1 | Internal service-to-service calls authenticated via `ALLOY_INTERNAL_TOKEN` | ✅ Done | All internal endpoints check `checkInternalToken()` with timing-safe compare |
| ZT2 | Platform mTLS on external preview/proxy | ✅ Done | Replit proxy uses mTLS for dev domain; HTTPS enforced for all artifacts |
| ZT3 | Inter-service calls do not trust ambient credentials without explicit token | ✅ Done | Each service call includes explicit Bearer or X-Alloy-Token header |
| ZT4 | Service mesh / mTLS between microservices | ⚠️ N/A | Single-process monolith; no separate service mesh needed at current scale |

---

## Data & Storage

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| D1 | All DB queries use parameterized statements (Drizzle ORM) | ✅ Done | No raw SQL string interpolation |
| D2 | Object storage objects are private by default | ✅ Done | `routes/documents.ts` — explicit ACL set |
| D3 | Soft deletes used where data integrity matters | ✅ Done | Certification programs use `isActive: false`; firestorm uses soft-delete patterns |

---

## Remaining Gaps (see KNOWN-GAPS.md for full detail)

| Gap ID | Description | Severity | ETA |
|--------|-------------|----------|-----|
| KG009 | OTEL exporter not wired for production | P1 | Pre-deploy |
| KG010 | E2E / integration test suite absent | P1 | Sprint 3–4 |
| KG011 | CodeQL scanning not configured in CI | P1 | Sprint 3 |
| KG012 | Dependency review not configured in CI | P1 | Sprint 3 |
| KG013 | No `CODEOWNERS` file | P1 | Sprint 3 |
| KG020b | Webhook delivery URL SSRF validation absent | P1 | Sprint 3 |
| KG020c | No virus scanning on uploaded files | P2 | Sprint 4 |
| KG020d | No PII field-level encryption | P2 | Roadmap |
| VD1 | No `security.txt` / responsible disclosure policy | P2 | Sprint 4 |

> **All P0 items are resolved.** DB-level tenant isolation, timing-safe auth, Zod validation on all high-risk write routes, structured Pino logging in all production paths. See KNOWN-GAPS.md for full resolution log.
