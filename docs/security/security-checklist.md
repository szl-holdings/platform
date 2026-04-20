# SZL Holdings — Security Checklist (API & Credentials)

**Last updated:** 2026-04-18
**Audience:** Enterprise architects, Series A technical advisors, security reviewers, compliance officers
**Scope:** `artifacts/api-server` — multi-tenant Express/Node.js API

**Related:** [ACCESS-CONTROL-MATRIX.md](access-control-matrix.md) · [KNOWN-GAPS.md](../operations/known-gaps.md) · [DEPLOYMENT-GUIDE.md](../operations/deployment-guide.md)

This checklist maps security controls to their actual implementation in the codebase. Controls are marked with their current status. Source references point to specific locations in the codebase where controls are enforced. See [KNOWN-GAPS.md](../operations/known-gaps.md) for gap detail.

---

## Part 1: API Server & Multi-Tenancy Controls

### Authentication & Token Security
| # | Control | Status | Evidence |
|---|---------|--------|----------|
| A1 | All internal service tokens compared with `crypto.timingSafeEqual` | ✅ Done | `middlewares/auth.ts` `checkInternalToken()` |
| A2 | Session secret rotatable via `SESSION_SECRET` env var | ✅ Done | `app.ts` — express-session config |
| A3 | `ALLOY_INTERNAL_TOKEN` enforces min 32 chars; secure fallback in dev | ✅ Done | `lib/startup-validation.ts` |
| A4 | JWT/session expiry enforced | ✅ Done | Session `maxAge` and token expiry validated |
| A5 | Auth middleware applied to all non-public routes | ✅ Done | Required on all write routes |
| A6 | RBAC (`requireRole`) on admin/exec routes | ✅ Done | Enforced on admin, ops, exec, and certification routes |
| A7 | Impersonation requires `admin` role and persists audit log | ✅ Done | `routes/admin/index.ts` logs activity on start/end |

### Tenant Isolation
| # | Control | Status | Evidence |
|---|---------|--------|----------|
| T1 | `AlloyRetrievalEngine` enforces per-tenant filtering on all paths | ✅ Done | `lib/ai-engine/src/retrieval/alloy-retrieval.ts` |
| T2 | Retrieval without explicit tenant ID returns empty (fail-closed) | ✅ Done | All retrieval methods fail-closed |
| T3 | Alloy policy creation enforces org membership (`canWriteForOrg`) | ✅ Done | `routes/alloy-governance.ts` |
| T6 | DB-level tenant isolation: `rag_knowledge_chunks.tenant_id` | ✅ Done | Migration: `0001_add_tenant_id_to_rag_knowledge_chunks.sql` |
| T7 | `totalIndexed` metadata is tenant-scoped (no global leak) | ✅ Done | `AlloyRetrievalEngine.tenantIndexedCount(tenantId)` |

### Input Validation & Logging
| # | Control | Status | Evidence |
|---|---------|--------|----------|
| V1-V8 | Zod `validateBody` applied to all write routes | ✅ Done | Applied to Dreamscape, Certification, Governance, CMS, Alloy, etc. |
| L1-L2 | Structured Pino logger used; `console.*` removed | ✅ Done | `lib/logger.ts` used across all production route/lib files |
| L5 | Audit log table populated on privileged mutations | ✅ Done | Certification, alloy governance, and admin routes write audit rows |
| L6 | AI guardrail trigger visibility via structured log | ✅ Done | `event: guardrail.triggered` emitted from `routes/ai-engine.ts`; see [GUARDRAILS_MODEL.md](../architecture/guardrails-model.md) |
| L7 | AI trace capture with tenant-scoped observability | ✅ Done | `lib/ai-engine/src/evals/trace-capture.ts` + `routes/ai-ops-dashboard.ts`; see [AI_RUNTIME_OBSERVABILITY.md](../architecture/ai-runtime-observability.md) |
| L8 | Agent Gateway tool calls audited + rate-limited | ✅ Done | `routes/mcp.ts` — per-tool RBAC + `logActivity()`; see [AGENT_GATEWAY_STRATEGY.md](../architecture/agent-gateway-strategy.md) |

### Network & External Security
| # | Control | Status | Evidence |
|---|---------|--------|----------|
| N1 | Rate limiting on write-heavy and AI endpoints | ✅ Done | `express-rate-limit` applied |
| N3 | Helmet HTTP security headers | ✅ Done | `app.ts` — `helmet()` applied |
| X1 | Outbound geocoding uses provider allow-list | ✅ Done | `lib/geocoding.ts` restricted to Mapbox/Google |
| X3 | Webhook delivery URL SSRF validation | ⚠️ Open | Tracked as **KG020b** |

---

## Part 2: Credential Hygiene & Repository Security

### What Must Never Be Committed
| File / Pattern | Reason |
|---|---|
| `google-services.json`, `GoogleService-Info.plist` | Firebase configs containing API keys |
| `service-account*.json` | Private keys for Play Store/Cloud access |
| `*.keystore`, `*.jks`, `*.p12`, `*.cer` | Signing keys and certificates |
| `.env`, `.env.local` | Runtime secrets and API keys |

All of these patterns are listed in `.gitignore`. Run `git status` before every commit.

### Pre-Commit Review Procedure
1. Run `git diff --cached --name-only` and inspect every file.
2. If any credential file appears, run `git reset HEAD <file>` immediately.
3. If a real credential was committed in the past, rotate it immediately (see below).
4. Use `git log --all --full-history -- "**/google-services.json"` to check history.

### Credential Rotation Schedule
| Credential | Rotate When | Maximum Age |
|---|---|---|
| Firebase API key | Suspected exposure or team departure | 12 months |
| Play Service Account key | Suspected exposure or team departure | 12 months |
| Backend API secrets / JWT | Suspected exposure | 6 months |

### Incident Response
If a credential is accidentally committed:
1. **Do not** just delete and re-commit — it remains in history.
2. Rotate the credential immediately (treat it as compromised).
3. Use `git filter-repo` to rewrite history if the repo is/will be public.
4. Notify the security lead within 1 hour.
5. Document the incident in `KNOWN-GAPS.md` under the incident log.

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
| CI1 | CodeQL static analysis configured in CI | ✅ Done | `.github/workflows/codeql.yml` — runs on every PR and push to main (KG011 resolved) |
| CI2 | Automated dependency vulnerability review on PRs | ✅ Done | `.github/workflows/dependency-review.yml` — blocks PRs that introduce known-vulnerable deps (KG012 resolved) |
| CI3 | Secret scanning in CI (Gitleaks) | ✅ Done | `.github/workflows/ci.yml` `secret-scan` job — gitleaks v8.21 with `.gitleaks.toml` allowlist; required by `CI Gate` (GAP-002 resolved) |
| CI4 | GitHub repository-level secret scanning + push protection | ✅ Configured | Enable under Settings → Code security and analysis (see `BRANCH_PROTECTION.md` §5) |
| CI5 | `CODEOWNERS` file defining mandatory review ownership | ✅ Done | `.github/CODEOWNERS` configured |
| CI6 | Lockfile integrity check in CI | ✅ Done | `.github/workflows/security.yml` `lockfile-integrity` job |

---

## Vulnerability Disclosure

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| VD1 | `security.txt` / responsible disclosure policy published | ⚠️ Missing | No `/.well-known/security.txt` endpoint; no public disclosure policy |
| VD2 | Internal security reporting process defined | ⚠️ Open | No documented process for internal security issue triage |

**Do not open a public GitHub issue for security vulnerabilities.**

- **Email:** security@szlholdings.com
- **Response SLA:** 48-hour initial acknowledgement
- See [SECURITY.md](../../SECURITY.md) for full responsible disclosure process

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
| D4 | IP addresses anonymized before storage | ✅ Done Apr-2026 | `hashIp()` in `lib/audit/src/ip-hash.ts` applies SHA-256 with optional `IP_HASH_SALT` env var. Applied to all audit log and session storage paths. Raw IPs are never persisted. |

---

## Dependency Pinning

| # | Control | Status | Evidence |
|---|---------|--------|----------|
| DP1 | Exact dependency versions pinned for all installs | ✅ Formally Accepted Apr-2026 | `pnpm-lock.yaml` pins exact versions for every package. CI uses `pnpm install --frozen-lockfile` — fresh installs never run without the lockfile. The `^` semver ranges in `package.json` only apply to manual installs without the lockfile, which don't occur in CI or production. Supply chain protection via `dependency-review.yml` (KG012). No further action required. |

---

## CI Security Gates

Every commit and pull request runs:

| Gate | Tool | Policy |
|------|------|--------|
| TypeScript typecheck | `tsc --noEmit` | Block on type errors |
| Lint | ESLint | Block on errors |
| Build validation | `pnpm -r build` | Block on any build failure |
| Secret scanning | Gitleaks v8.21 + custom pattern scanner | Block on any detected secret or credential (GAP-002 resolved) |
| CodeQL SAST | `github/codeql-action` (JS/TS) | Block on code-level security vulnerabilities (KG011 resolved) |
| Dependency review | `actions/dependency-review-action` | Block PRs introducing high/critical CVEs or GPL-3.0/AGPL-3.0 deps (KG012 resolved) |
| Lockfile integrity | `pnpm install --frozen-lockfile --dry-run` | Block if lockfile is out of sync |

---

## Phase 2–3 Audit Findings (April 2026)

The following gaps were identified in the Phase 2–3 Architecture, Auth & Tenancy audit. Full detail in [AUDIT_FINDINGS_REGISTER.md](../operations/audit-findings-register.md).

| Finding ID | Description | Severity | Status |
|-----------|-------------|----------|--------|
| AF-001 | `adminGuard` uses `Buffer.equals()` instead of `crypto.timingSafeEqual` for internal token | P1 | ⚠️ Open |
| AF-003 | `GET /vessels/fleets` and fleet sub-routes return all tenants' fleet data | P1 | ⚠️ Open |
| AF-007 | `vessels.*` DB tables (fleet, vessel, positions, cargo, routes) missing `org_id` column | P1 | ⚠️ Open |
| AF-004 | Backup export endpoint accepts arbitrary `orgId` without verifying admin authority | P2 | ⚠️ Open |
| AF-008 | `conversations` table missing `org_id` — AI chat history not tenant-scoped at DB level | P2 | ⚠️ Open |
| AF-010 | Sessions not invalidated on role change (up to 30-day exposure window) | P2 | ✅ Resolved Apr-2026 — `revokeUserSessionsOnRoleChange()` in `middlewares/session-policy.ts` deletes all sessions and writes audit event; called on SCIM group changes and new `PUT /admin/users/:userId/roles` endpoint. |
| AF-012 | Sessions not invalidated on `SESSION_SECRET` rotation | P2 | ⚠️ Open |
| AF-013 | Internal token verification duplicated with divergent patterns across middlewares | P2 | ⚠️ Open |
| AF-014 | No ORM-layer cross-tenant query guard — developer can accidentally write cross-tenant query | P2 | ⚠️ Open |

---

## Remaining Gaps (see KNOWN-GAPS.md for full detail)

| Gap ID | Description | Severity | ETA | Launch Impact |
|--------|-------------|----------|-----|---------------|
| GAP-001 | Manual rotation of Firebase/Google keys needed | High | Immediate | 🔴 Hard blocker (LB-001) |
| AF-001 | `adminGuard` non-timing-safe internal token comparison | P1 | Sprint 3 | 🟡 Conditional |
| AF-003 / AF-007 | Vessels schema + routes lack tenant scoping | P1 | Sprint 3 | 🟡 Conditional |
| KG009 | OTEL exporter not wired for production | P1 | Pre-deploy | 🔴 Hard blocker (LB-006) |
| KG026 | MFA not implemented | P1 | Enterprise tier launch | **Formally Accepted Apr-2026.** IdP-level MFA (Replit OIDC / Azure AD) is the current control. Platform-native MFA on roadmap for enterprise tier. Risk accepted with IdP enforcement requirement for enterprise pilots. |
| KG027 | External uptime monitoring absent | P1 | Pre-deploy | 🔴 Hard blocker (LB-002) |
| KG028 | Sentry / error tracking not in production | P1 | Pre-deploy | 🔴 Hard blocker (LB-003) |
| KG011 | CodeQL scanning not configured in CI | P1 | ✅ Resolved Apr-2026 | `.github/workflows/codeql.yml` scans JS/TS on every PR and push to main |
| KG012 | Dependency review not configured in CI | P1 | ✅ Resolved Apr-2026 | `.github/workflows/dependency-review.yml` blocks PRs with high/critical CVEs |
| KG020b | Webhook delivery URL SSRF validation absent | P1 | Sprint 3 | 🟡 Conditional (LC-004) |
| KG020c | No virus scanning on uploaded files | P2 | Sprint 4 | 🟢 Not blocking |
| GAP-002 | No CI/CD automated secret scanning | Med | Sprint 3 | ✅ Resolved Apr-2026 (LC-001) |

> **All original P0 items are resolved.** DB-level tenant isolation, timing-safe auth (in auth.ts), Zod validation on all high-risk write routes, structured Pino logging in all production paths. Mobile secrets transition to template-based management is complete. The Phase 2–3 audit discovered 3 new P1 gaps (AF-001, AF-003, AF-007) — see AUDIT_FINDINGS_REGISTER.md. See `KNOWN-GAPS.md` for full resolution log.

> **For launch decision:** See [LAUNCH_BLOCKERS.md](../launch/launch-blockers.md) for the definitive list of hard blockers and conditional items. See [GO_NO_GO_CHECKLIST.md](../launch/go-no-go-checklist.md) for the final launch sign-off framework.

---

*See also: [ACCESS-CONTROL-MATRIX.md](access-control-matrix.md) · [KNOWN-GAPS.md](../operations/known-gaps.md) · [ENVIRONMENT_VARIABLES.md](../operations/environment-variables.md) · [AUDIT_FINDINGS_REGISTER.md](../operations/audit-findings-register.md) · [docs/trust/security-posture.md](../trust/security-posture.md)*

*Phase 0–1 audit (2026-04-16): No hardcoded credentials found in source — all 175 env vars use `process.env.*` references. Audit confirmed via grep scan of all artifacts, lib, and packages directories. Session secret hygiene verified (SESSION_TTL_MS default = 7 days per env-config.ts). See FULL_SYSTEM_INVENTORY.md Appendix A for reproducible verification commands.*

*Last verified against code on 2026-04-17*

*Apr-2026 Diligence Sprint: 5 pre-commercial security gaps closed or formally accepted. IP hashing (KG034), session revocation on role change (AF-010), input validation confirmation (KG003–KG008 verified), MFA formal acceptance (KG026), dependency pinning formal acceptance (KG035). See KNOWN-GAPS.md rev 9 incident log for full details.*
