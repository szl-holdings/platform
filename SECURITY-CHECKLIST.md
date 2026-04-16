# SZL Holdings — Security Checklist (API & Credentials)

**Last updated:** 2026-04-16  
**Audience:** Engineering, DevOps, Technical Advisors  
**Scope:** API Server (Express/Node.js) and Repository Credential Hygiene

---

## Part 1: API Server & Multi-Tenancy Controls

### Authentication & Token Security
| # | Control | Status | Evidence |
|---|---------|--------|----------|
| A1 | All internal service tokens compared with `crypto.timingSafeEqual` | ✅ Done | `middlewares/auth.ts` `checkInternalToken()` |
| A2 | Session secret rotatable via `SESSION_SECRET` env var | ✅ Done | `app.ts` — express-session config |
| A3 | `ALLOY_INTERNAL_TOKEN` enforces min 32 chars; secure fallback in dev | ✅ Done | `lib/startup-config.ts` |
| A4 | JWT/session expiry enforced | ✅ Done | Session `maxAge` and token expiry validated |
| A5 | Auth middleware applied to all non-public routes | ✅ Done | Required on all write routes |
| A6 | RBAC (`requireRole`) on admin/exec routes | ✅ Done | Enforced on admin, ops, exec, and certification routes |
| A7 | Impersonation requires `admin` role and persists audit log | ✅ Done | `routes/admin.ts` logs activity on start/end |

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

## Remaining Gaps (Summary)
| Gap ID | Description | Severity | ETA |
|--------|-------------|----------|-----|
| GAP-001 | Manual rotation of Firebase/Google keys needed | High | Immediate |
| KG009 | OTEL exporter not wired for production | P1 | Pre-deploy |
| KG011 | CodeQL scanning not configured in CI | P1 | Sprint 3 |
| KG012 | Dependency review not configured in CI | P1 | Sprint 3 |
| KG020b | Webhook delivery URL SSRF validation absent | P1 | Sprint 3 |
| KG020c | No virus scanning on uploaded files | P2 | Sprint 4 |

> **Core security hardening complete.** All P0 items (tenant isolation, auth, input validation) are resolved. Mobile secrets transition to template-based management is complete. See `KNOWN-GAPS.md` for full detail.
