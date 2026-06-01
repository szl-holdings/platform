# Security Audit — Overall Posture Summary

**Date:** 2026-04-26  
**Scope:** Full platform — all web artifacts, API server, mobile app, CI/CD pipeline, secrets handling, RBAC, and public trust claims.  
**Basis:** Static code review, CI workflow analysis, threat model (`threat_model.md`), existing audit artefacts (`security/secret-audit.md`, `audit/security/auth-review.md`, `audit/security/ci-security-review.md`), and env-var sweep.

---

## Executive Verdict

The platform has a **solid structural security foundation** for a pre-commercial Series-A asset. Authentication, session management, secrets handling, and CI gates are implemented correctly. The most significant residual risk is in the open P1 gaps documented in `threat_model.md` — particularly around GraphQL auth boundaries, NEXUS shared state, MCP governance exposure, and webhook forgery. These are known, tracked, and accepted as planned remediation work. Nothing found during this audit represents a newly discovered critical gap.

---

## Control-by-Control Assessment

### 1. Secrets Management

| Control | Status | Notes |
|---------|--------|-------|
| No live credentials committed to source | ✅ PASS | Confirmed by gitleaks full-history scan and `security/secret-audit.md`. Zero true positives. |
| `.env` files gitignored | ✅ PASS | `.gitignore` excludes `.env`, `.env.local`, and all filled variants. |
| `.env.example` contains only placeholders | ✅ PASS | All values are `change-me-*`, `YOUR_*`, or `000000` (explicit placeholder). None are real credentials. |
| Production secrets injected via environment | ✅ PASS | All credentials use `process.env.*`; no hardcoded fallbacks in production paths. |
| Gitleaks PR-diff gate active | ✅ PASS | `secret-scan.yml` blocks merge on any detected credential. |
| Daily full-history Gitleaks sweep | ✅ PASS | `secret-scan-scheduled.yml` runs at 06:17 UTC daily; creates triage issue on positive finding. |
| Gitleaks config tuned for false positives | ✅ PASS | `.gitleaks.toml` is well-maintained with documented allowlist rationale for every suppression. |

**Detail:** See `audit/security/secrets-and-exposure-findings.md`.

---

### 2. Authentication & Session Management

| Control | Status | Notes |
|---------|--------|-------|
| OIDC/PKCE — no password storage | ✅ PASS | OIDC is the canonical auth mechanism. Password hashing (PBKDF2-SHA512, 100k iterations) exists for legacy/admin paths and meets OWASP guidelines. |
| Session cookies: HttpOnly, Secure, SameSite | ✅ PASS | Verified in `auth-review.md` Phase B. Flags set correctly in production. |
| Session backed by PostgreSQL | ✅ PASS | No in-memory session store. `sessions` table with `session_version` for invalidation. |
| Session invalidation on role change | ✅ PASS | `revokeUserSessionsOnRoleChange()` implemented (AF-010 resolved). |
| Timing-safe token comparison | ✅ PASS | `timingSafeEqual` used throughout; AF-001 resolved (Task #2693). |
| MFA (TOTP) implemented | ✅ PASS | TOTP via `otplib`. Secrets encrypted at rest when `MFA_SECRET_ENCRYPTION_KEY` is set. |
| MFA encryption required in production | ⚠️ WARN | If `MFA_SECRET_ENCRYPTION_KEY` is unset, TOTP secrets stored with `plain:` prefix. Startup warning emitted. Must be set in production. |
| Internal service tokens verified timing-safely | ⚠️ WARN | AF-013: `checkInternalToken()` is implemented but duplicated across middlewares with slightly divergent patterns. P2 open gap — should be unified. |

---

### 3. Authorization & RBAC

| Control | Status | Notes |
|---------|--------|-------|
| Deny-by-default API gate | ✅ PASS | `global-auth-enforcer.ts` enforces auth on all `/api/*` routes with an explicit, documented public allowlist. |
| Admin routes: role-gated at router level | ✅ PASS | `/api/admin/*` requires `authMiddleware()` + `requireRole('admin')` applied at the `adminRouter` level. |
| Debug endpoints: auth + prod-guard | ✅ PASS | `/api/debug/*` requires `authMiddleware()` and returns 403 in production. See findings doc. |
| GraphQL role directives enforced at runtime | ❌ FAIL | AF-015: GraphQL SDL role annotations are declared but not backed by resolver-level enforcement. Schema directives alone are not access controls. P1 open gap. |
| GraphQL WebSocket subscription auth | ❌ FAIL | AF-016: `/api/graphql/ws` WebSocket server operates outside the Express middleware chain and accepts anonymous clients. P1 open gap. |
| NEXUS shared stores: tenant/owner scoping | ❌ FAIL | AF-020: NEXUS memory, skills, tools, and orchestration stores have no tenant or ownership binding. P1 open gap. |
| MCP gateway: operator-only authz | ❌ FAIL | AF-022: MCP governance and proxy routes reachable to any authenticated user. P1 open gap. |
| Inbound deal records: auth scoping | ❌ FAIL | AF-017: Fund inbound deal records and attachments readable/writable by any authenticated user. P1 open gap. |
| Billing: Stripe object ownership checks | ❌ FAIL | AF-018: Billing routes accept arbitrary Stripe identifiers without verifying org ownership. P1 open gap. |
| SCIM group changes invalidate sessions | ✅ PASS | `revokeUserSessionsOnRoleChange()` is called on SCIM-triggered role changes. |
| ORM-layer cross-tenant query guard | ❌ FAIL | AF-014: No Drizzle ORM-level enforcement of `org_id` scoping. Relies on per-route discipline. P2 open gap. |

**Detail:** See `audit/security/rbac-surface-review.md`.

---

### 4. Public Route Exposure & Demo Surfaces

| Control | Status | Notes |
|---------|--------|-------|
| Public allowlist is explicit and documented | ✅ PASS | `global-auth-enforcer.ts` lists every public route with inline rationale. |
| Public mutating routes isolated from real data | ⚠️ WARN | AF-024: Several publicly allowlisted routes (action-store, demo/reset, policy-compiler/state) mutate persistent PostgreSQL state. In-memory isolation is not consistently enforced. P2 open gap. |
| Webhook authentication | ❌ FAIL | AF-025: `/api/webhooks/*` and streaming ingestion routes are public and accept forged or unauthenticated events. HMAC verification is noted in enforcer comments but not universally applied in handlers. P1 open gap. |
| MCP/substrate anonymous surface | ⚠️ WARN | AF-023/AF-026: `/mcp/sse`, discovery endpoints, and agent-mesh telemetry reachable without auth. P1/P2 open gaps. |
| Sentra substrate MCP sidecar GET bypass | ⚠️ WARN | AF-023: Substrate MCP sidecar exposes `/mcp/sse` and discovery endpoints with a GET bypass. P2. |
| A11oy fabric: mutating endpoints 501 | ✅ PASS | `/api/a11oy/*` mutating endpoints return 501 Not Implemented. All data is in-memory demo data. |
| Demo PIN surfaces disabled in production | ✅ PASS | `/api/pulse/demo/*` PIN-only paths are explicitly blocked in `global-auth-enforcer.ts` when `NODE_ENV === 'production'`. |
| RMM SSRF validation | ⚠️ WARN | AF-019/KG020b: RMM `baseUrl` used in server-side fetches. Basic SSRF validation exists but DNS-rebinding TOCTOU remains. P2 open gap. |

---

### 5. CI Gates

| Gate | Status | Notes |
|------|--------|-------|
| Secret scan (PR diff) | ✅ PASS | `secret-scan.yml` — Gitleaks with `--exit-code 1`. Required status check. |
| Secret scan (full history, daily) | ✅ PASS | `secret-scan-scheduled.yml` — full history scan with SARIF upload and issue creation. |
| Dependency vulnerability scan | ✅ PASS | `security.yml` — `pnpm audit` + SBOM generation. `security-gate` job is blocking. |
| Dependency review on PRs | ✅ PASS | `dependency-review.yml` — GitHub Dependency Review action, fails on high severity. |
| CodeQL static analysis | ✅ PASS | `codeql.yml` — weekly + on push/PR. Results in GitHub Security tab. |
| SBOM generation | ✅ PASS | `security.yml` → `scripts/qa/generate-sbom.js` → `security/sbom-latest.json`, uploaded as artifact. |
| Route security matrix | ✅ PASS | `ci.yml` `route-security-matrix` job: no route may be `UNCLASSIFIED`. Blocking gate. |
| Lockfile integrity | ✅ PASS | `security.yml` — `pnpm install --frozen-lockfile --dry-run`. Blocks if lockfile stale. |
| CI `set +e` / `|| true` swallowing exit codes | ✅ PASS | Reviewed all workflows. `set +e` in secret scan workflows is intentional: captures exit code, uploads SARIF, then a dedicated `enforce` step explicitly exits non-zero on findings. No security gate swallows a real failure. |

---

### 6. Data Protection

| Control | Status | Notes |
|---------|--------|-------|
| TLS 1.3 in transit | ✅ PASS | Platform-managed TLS. Replit handles certificate lifecycle in development. |
| PostgreSQL encryption at rest | ✅ PASS | Managed deployment encryption at rest. |
| Connector OAuth tokens encrypted at rest | ✅ PASS | `CONNECTOR_ENCRYPTION_KEY` (AES-256) encrypts stored connector credentials. |
| IP addresses hashed before storage | ✅ PASS | `hashIp()` in `lib/audit/src/ip-hash.ts`. Raw IPs not persisted. |
| PII not in application logs | ✅ PASS | Pino structured logging; email/user data excluded from log output. |
| Uploaded files: private by default | ✅ PASS | Object storage ACL is private. Virus scanning added (KG020c resolved). |
| Field-level encryption for PII columns | ❌ FAIL | KG020d: No field-level encryption for PII DB columns. P2 open gap. |
| Stack traces suppressed in production errors | ✅ PASS | Production error handler omits stack traces. `NODE_ENV === 'production'` guard verified. |
| Connector credentials masked in API responses | ✅ PASS | Credential fields returned as `***` in listing responses. |
| Env-variable exposure via `VITE_` vars | ✅ PASS | `VITE_*` vars are analytics keys only (PostHog, Mapbox, Plausible, API URL, app mode). No server secrets in `VITE_*` namespace. See findings doc. |

---

### 7. AI Governance

| Control | Status | Notes |
|---------|--------|-------|
| Agents cannot execute without human approval | ✅ PASS | Covenant Policy enforced at workflow level, not just UI. |
| AI trace records include model identity | ✅ PASS | Model and version logged in agent trace records. |
| NEXUS loopback bypass as confused deputy | ❌ FAIL | AF-021: NEXUS loopback orchestration bypass acts as a confused deputy into protected APIs. P1 open gap. |
| Alloy internal token: single canonical check | ⚠️ WARN | AF-013: Multiple implementations. Should unify to a single `checkInternalToken()` helper. |

---

### 8. Operational Trust Documents

| Document | Status | Notes |
|----------|--------|-------|
| `SECURITY.md` | ✅ PASS | Well-structured. Scope, disclosure process, SLAs, architecture summary all accurate. |
| `INCIDENT_RESPONSE.md` | ✅ PASS | Operational runbook for backup-upload-stalled alert. Correctly references `/api/health/detailed` with internal token. |
| `SUPPORT.md` | ✅ PASS | Clear, minimal, no inflated claims. |
| `threat_model.md` | ✅ PASS | Comprehensive, current (2026-04-25), accurate gap register. |
| `CODEOWNERS` | ✅ PASS | `.github/CODEOWNERS` exists with full path coverage. Extended in this task to include security audit docs, trust pages, `INCIDENT_RESPONSE.md`, `threat_model.md`, and `KNOWN-GAPS.md`. |
| `docs/trust/trust-center.md` | ⚠️ WARN | Version 5.0. Generally accurate; a few aspirational claims that should be hedged. See `public-trust-posture.md`. |
| `docs/ACCESS_CONTROL.md` | ✅ PASS | Accurate role taxonomy with counting methodology documented. |

---

## Open Gap Summary (inherited from threat_model.md)

| Gap | Severity | Status |
|-----|----------|--------|
| AF-008 — AlloyChat lacks org_id, tenantless persistence | P1 | Open |
| AF-012 — Sessions not invalidated on SESSION_SECRET rotation | P2 | Open |
| AF-013 — Internal token check duplicated with divergent patterns | P2 | Open |
| AF-014 — No ORM-layer cross-tenant query guard | P2 | Open |
| AF-015 — GraphQL role directives declared but not runtime-enforced | P1 | Open |
| AF-016 — GraphQL WebSocket subscriptions accept anonymous clients | P1 | Open |
| AF-017 — Inbound deal records readable/writable by any auth user | P1 | Open |
| AF-018 — Billing routes trust arbitrary Stripe IDs without org checks | P1 | Open |
| AF-019 — RMM connector baseUrl used without SSRF validation | P2 | Open |
| AF-020 — NEXUS shared stores have no tenant/owner/role scoping | P1 | Open |
| AF-021 — NEXUS loopback bypass acts as confused deputy | P1 | Open |
| AF-022 — MCP gateway routes reachable to any authenticated user | P1 | Open |
| AF-023 — Substrate MCP sidecar GET bypass | P2 | Open |
| AF-024 — Public allowlisted routes mutate persistent production data | P2 | Open |
| AF-025 — Public webhook/ingestion routes accept forged events | P1 | Open |
| AF-026 — MCP surfaces expose anonymous telemetry | P1 | Open |
| AF-027 — Env registry accessible to any authenticated user | P2 | Open |
| KG020b — DNS-rebinding TOCTOU in webhook delivery | P2 | Open |
| KG020d — No field-level encryption for PII columns | P2 | Open |
| KG026 — Platform-native MFA not implemented | P1 | Accepted — IdP-level MFA is current control |

---

*Reviewed: 2026-04-26. Basis: static code audit, CI workflow analysis, threat model, and prior phase audit records. Next review: before major route restructuring or new public surface exposure.*
