# Security Audit
**Phase:** 3 + 6  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)  
**Reference:** `KNOWN-GAPS.md`, `AUDIT_FINDINGS_REGISTER.md`, `SECURITY-CHECKLIST.md`

---

## Executive Summary

The April 2026 security hardening sprint resolved all 11 P0 critical security gaps. The platform has been through a 9-perspective adversarial red-team review with no new P0 or P1 findings. The remaining open items are P1–P2 conditional blockers requiring either operator action (credential rotation, monitoring setup) or accepted-risk decisions by the Founder.

**Overall security posture: 🟡 CONDITIONAL — suitable for design-partner phase; not yet cleared for general public launch.**

---

## P0 Gaps — All Resolved

| ID | Gap | Resolution | Date |
|---|---|---|---|
| KG001 | Cross-tenant RAG retrieval isolation | `tenantId` enforcement added to `alloyRetrieval` | Apr-2026 |
| KG002 | Timing-unsafe internal token comparison | Replaced with `crypto.timingSafeEqual` | Apr-2026 |
| KG015 | `rag_knowledge_chunks` missing `tenant_id` | Column + index added; strict SQL predicates enforced | Apr-2026 |
| KG014 | `graph-rag.ts` not propagating tenant ID | `tenantId` threaded to all retrieval calls | Apr-2026 |
| T7 | `totalIndexed` leaking cross-tenant corpus size | Removed from retrieval responses | Apr-2026 |
| KG003–KG008 | Unvalidated write routes | Zod schemas applied to all high-risk routes | Apr-2026 |
| KG016–KG017 | Console logging in admin/lib | Replaced with Pino structured logging | Apr-2026 |
| SEC-003 | `.gitignore` missing credential patterns | Comprehensive patterns added | Apr-2026 |
| SEC-004 | Timing attack on internal token compare | Fixed (same as KG002) | Apr-2026 |
| SEC-005 | Cross-tenant AI data leakage | Fixed (same as KG001) | Apr-2026 |
| SEC-006 | Unvalidated high-risk route inputs | Fixed (same as KG003–KG008) | Apr-2026 |

---

## Open Hard Blockers (Operator Action Required)

### LB-001 — Firebase & Google Credential Rotation
**Severity:** High  
**Status:** Git history verified clean — only `PLACEHOLDER_*` values in committed files. Operator must still rotate the live Firebase Web API key in Firebase Console.  
**Owner:** Stephen Lutar  
**Effort:** 30–60 minutes

---

## Open Conditional Blockers (Founder Acceptance Required)

| ID | Gap | Severity | Status | Default Decision |
|---|---|---|---|---|
| LC-001 | No CI/CD automated secret scanning | P2 | ⚠️ Open | Accept for design-partner phase |
| LC-002 | CodeQL SAST workflow exists; config pending full verification | P1 | ⚠️ Partial | Accept for design-partner phase |
| LC-003 | Dependency review workflow exists; verification pending | P1 | ⚠️ Partial | Accept for design-partner phase |
| LC-004 | Webhook SSRF validation absent | P1 | ⚠️ Open | Accept for design-partner phase |
| LC-005 | MFA not implemented (enterprise tier only) | P1 | ⚠️ Planned | Accept for design-partner phase |
| VD1 | No responsible disclosure `security.txt` endpoint | P2 | ⚠️ Open | SECURITY.md exists; formal endpoint for Sprint 4 |

---

## Open P2 Gaps (Should Fix Before Broad GTM)

| ID | Gap | Notes |
|---|---|---|
| KG020b | Webhook SSRF host validation | Same as LC-004 |
| KG020c | No virus/malware scanning on object storage uploads | `lib/virusScan.ts` stub exists |
| KG020d | No field-level encryption for PII columns | Roadmap |
| SEC-008 | File upload malware risk | Same as KG020c |
| SEC-009 | MFA single-factor only | Planned enterprise tier |
| SEC-010 | PII columns not field-encrypted | Same as KG020d |
| ARCH-001 | In-memory session store (no horizontal scale) | Redis needed for multi-instance |

---

## Session Security

| Setting | Value | Status |
|---|---|---|
| `HttpOnly` | true | ✅ Confirmed in `app.ts` |
| `Secure` | true (production) | ✅ Confirmed |
| `SameSite` | strict | ✅ Confirmed |
| `SESSION_SECRET` min length | 32 chars | ✅ Enforced at startup |
| Session invalidation on logout | Immediate | ✅ Confirmed |

---

## Input Validation Coverage

| Route Category | Zod Coverage | Notes |
|---|---|---|
| Auth routes | 100% | All write routes covered |
| Payment/billing routes | 100% | All write routes covered |
| Admin routes | 100% | All write routes covered |
| AI execution routes | 100% | All write routes covered |
| Domain pack write routes (vessels, terra, etc.) | 95%+ | High-risk routes covered; some low-traffic gaps |
| Read/GET routes | ~60% | Expanding; not a write-safety issue |

---

## Secrets Posture

| Area | Status |
|---|---|
| No live secrets in committed code | ✅ Verified via `git log --all --full-history` (Task #1034) |
| `.env*` runtime files never committed | ✅ Confirmed — 0 commits |
| Firebase service account JSON never committed | ✅ Confirmed — 0 commits |
| `.gitignore` comprehensive | ✅ Updated Apr-2026 |
| `SECRETS_SETUP.md` exists | ✅ |
| `SECURITY-CHECKLIST.md` exists | ✅ |

---

## Red-Team Summary (9-Perspective Adversarial Review)

| Perspective | Findings | P0/P1 |
|---|---|---|
| External attacker | SSRF on webhooks (LC-004) | 0 new P0 |
| Insider threat | Policy gate coverage strong | 0 new P0 |
| Supply chain | GitHub Actions SHA-pinned (CI-001 resolved) | 0 new P0 |
| Multi-tenant isolation | All P0 gaps resolved | 0 new P0 |
| AI safety | Policy gates on destructive actions confirmed | 0 new P0 |
| Data exposure | PII encryption gap (P2, roadmap) | 0 new P0 |
| Session hijacking | HttpOnly/Secure/SameSite confirmed | 0 new P0 |
| Privilege escalation | RBAC 11-role hierarchy tested | 0 new P0 |
| Social engineering | Responsible disclosure gap (VD1, P2) | 0 new P0 |

**Red-team verdict: No new P0 or P1 security vulnerabilities found.**
