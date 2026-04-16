# SZL Holdings — Known Gaps Register (Security & Operations)

**Last updated:** 2026-04-16 (rev 6)  
**Owner:** Engineering / DevOps  
**Audience:** Enterprise architects, Series A technical advisors, incoming VP Engineering

This document is the canonical reference for known security, quality, and compliance gaps in the SZL Holdings platform. It consolidates findings from the internal risk register, the April 2026 hardening sprint, and the secrets remediation audit.

---

## Viewer Guide by Persona

### For Enterprise Architects
Architecture concerns — tenant isolation, auth hardening, encryption, network security.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG001 | Cross-tenant vector/RAG retrieval isolation (alloyRetrieval singleton) | P0 | ✅ Resolved Apr-2026 |
| KG002 | Timing-unsafe internal token comparison | P0 | ✅ Resolved Apr-2026 |
| KG015 | No `tenant_id` column in `rag_knowledge_chunks` DB table | P0 | ✅ Resolved Apr-2026 |
| KG014 | `graph-rag.ts` retrieval not propagating tenant ID | P0 | ✅ Resolved Apr-2026 |
| T7 | `totalIndexed` in retrieval responses leaked cross-tenant corpus size | P0 | ✅ Resolved Apr-2026 |
| KG020b | Webhook delivery URL has no SSRF host validation | P1 | ⚠️ Open — Sprint 3 |
| KG020c | No virus/malware scanning on object storage uploads | P2 | ⚠️ Open — Sprint 4 |
| KG020d | No field-level encryption for PII columns | P2 | ⚠️ Open — Roadmap |

**Architecture verdict:** All critical tenant isolation and auth P0 gaps are closed. Residual gaps (SSRF, virus scanning, PII encryption) are tracked and scoped with remediation owners.

---

### For Series A Technical Advisors / Investor Diligence
Risk exposure, compliance posture, diligence readiness.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG002 | Timing-unsafe internal token comparison | P0 | ✅ Resolved |
| KG001, KG015 | Multi-tenant data isolation in RAG/AI layer | P0 | ✅ Resolved |
| KG003–KG008, KG016, KG017 | Unvalidated write routes / missing structured logging | P0 | ✅ Resolved |
| GAP-001 | Firebase & Google credentials require manual rotation | High | ⚠️ Open |
| KG011 | No CodeQL SAST in CI pipeline | P1 | ⚠️ Open — Sprint 3 |
| KG012 | No automated dependency vulnerability review in CI | P1 | ⚠️ Open — Sprint 3 |
| KG010 | No automated E2E / integration test suite | P1 | ⚠️ Open — Sprint 3–4 |
| GAP-002 | No CI/CD automated secret scanning | Med | ⚠️ Open |
| GAP-003 | Android keystore not managed by EAS | Med | ⚠️ Open |
| VD1 | No responsible disclosure policy / `security.txt` | P2 | ⚠️ Open — Sprint 4 |
| KG025 | WCAG accessibility not systematically audited | P2 | ⚠️ Open — Sprint 4 |

**Diligence verdict:** All P0 security gaps identified in the pre-sprint audit are resolved. Remaining open items (P1–P2, High/Med) are scoped, have remediation owners, and do not represent critical blockers for Series A close. The three highest remaining enterprise risks are the absence of automated SAST (KG011), dependency review (KG012), and E2E regression testing (KG010).

---

### For Incoming VP Engineering
Operational gaps, process health, test coverage, observability, team ownership.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG009 | OpenTelemetry exporter not configured for production | P1 | ⚠️ Open — pre-deploy |
| KG010 | No automated E2E / integration test suite | P1 | ⚠️ Open — Sprint 3–4 |
| KG011 | CodeQL SAST not configured in CI | P1 | ⚠️ Open — Sprint 3 |
| KG012 | Dependency review not in CI | P1 | ⚠️ Open — Sprint 3 |
| KG013 | No `CODEOWNERS` file | P1 | ⚠️ Open — Sprint 3 |
| KG018 | 80+ env vars with no formal schema documentation | P2 | ⚠️ Open — Sprint 4 |
| GAP-004 | No `.env.example` files for all artifacts | Low | ⚠️ Open |
| KG019 | No Lighthouse CI performance regression guard | P2 | ⚠️ Open — Sprint 4 |
| KG023 | SLI/SLO definitions absent | P2 | ⚠️ Open — Sprint 4 |
| KG024 | Large vendor bundle sizes on all web apps (1–1.7 MB) | P2 | ⚠️ Open — Sprint 4 |

**VP Engineering verdict:** Core security hardening is complete. Highest-priority operational work for the new VP is: (1) wire OTEL exporter before first prod deploy (KG009), (2) establish CI security gates (KG011/KG012), (3) build E2E regression suite (KG010), (4) define SLI/SLOs (KG023).

---

## Full Gap Registry

### P0 — Critical / High (Resolved or Immediate Action)

| ID | Gap | Area | Resolution / Status |
|----|-----|------|---------------------|
| KG001 | `alloyRetrieval` singleton had no tenant partitioning | Security / Multi-tenancy | ✅ Resolved Apr-2026. `tenantId` field added to `RetrievalChunk`; all methods enforce tenant scope. |
| KG002 | Internal service tokens compared with `===` | Security / Auth | ✅ Resolved Apr-2026. Replaced with `crypto.timingSafeEqual`. |
| KG015 | `rag_knowledge_chunks` DB table had no `tenant_id` column | Security / Multi-tenancy | ✅ Resolved Apr-2026. Column + index added; strict SQL predicates enforced. |
| KG003–KG008 | Unvalidated write routes / leaked unstructured logs | Input / Observability | ✅ Resolved Apr-2026. Zod schemas + Pino logger applied across all routes. |
| KG014 | `graph-rag.ts` retrieval not propagating tenant ID | Security / Multi-tenancy | ✅ Resolved Apr-2026. `tenantId` threaded to all retrieval calls. |
| KG016–KG017 | Ad-hoc field checks and console logging in admin/lib | Input / Observability | ✅ Resolved Apr-2026. Zod and Pino applied. |
| REM-001 | Placeholder credential files in repo | Credentials | ✅ Resolved Apr-2026. Verified and template copies created. |
| REM-002 | `.gitignore` did not cover credential patterns | Credentials | ✅ Resolved Apr-2026. Hardened with comprehensive patterns. |
| REM-003 | No developer docs for secrets | Process | ✅ Resolved Apr-2026. `SECRETS_SETUP.md` created. |
| REM-004 | No security credential hygiene checklist | Process | ✅ Resolved Apr-2026. `SECURITY-CHECKLIST.md` created. |
| GAP-001 | Firebase & Google credentials require manual rotation | Credentials | ⚠️ Open — **High Severity**. Real values may exist in history. Manual rotation required. |

---

### P1 — High (open — targeted for Sprint 3)

| ID | Gap | Area | Impact | Mitigation Plan | Owner |
|----|-----|------|--------|-----------------|-------|
| KG009 | OTEL exporter not configured for prod | Observability | No prod tracing | Configure OTLP endpoint before deploy | Platform |
| KG010 | No automated E2E test suite | Quality | Regression risk | Build Playwright suite for critical flows | Engineering |
| KG011 | CodeQL SAST not in CI | Security / CI | SAST coverage gap | Add `.github/workflows/codeql.yml` | DevOps |
| KG012 | Dependency review not in CI | Supply Chain | Vulnerable deps risk | Add `dependency-review-action` to PRs | DevOps |
| KG013 | No `CODEOWNERS` file | Process | No review ownership | Create `CODEOWNERS` mapping | Eng Lead |
| KG020b | Webhook URLs not SSRF validated | Security / SSRF | SSRF risk | Add URL validation / host allowlist | Security Lead |
| KG026 | MFA not implemented | Security | Auth risk | Planned for enterprise tier launch | Security |
| KG027 | External uptime monitoring absent | Ops | Visibility gap | Configure before first enterprise pilot | Platform |
| KG028 | Sentry / error tracking not in prod | Observability | Debugging delay | Add Sentry DSN to production | Platform |
| AF-001 | `adminGuard` uses `Buffer.equals()` not `crypto.timingSafeEqual` for internal token | Security / Auth | Theoretical timing attack on admin token | Replace with `timingSafeEqual` (same fix as KG002 in auth.ts) | Security Lead |
| AF-003 | `GET /vessels/fleets` routes return all tenants' fleet data without tenant scoping | Security / Multi-tenancy | Cross-tenant data visibility | Add tenant scope filtering to vessels fleet routes | Engineering |
| AF-007 | `vessels.*` tables (`vessels_fleets`, `vessels`, positions, cargo, routes) missing `org_id` | Security / Multi-tenancy | DB-level cross-tenant vessel data access | Add `org_id` migration; designate `maritime.ts` as authoritative schema | Engineering |

---

### P2 — Medium / Low (open — Sprint 4 / roadmap)

| ID | Gap | Area | Impact | Notes |
|----|-----|------|--------|-------|
| GAP-002 | No CI/CD automated secret scanning | Security | Leaked keys risk | Add `gitleaks` to CI |
| GAP-003 | Android keystore not in EAS | Mobile Ops | SPOF risk | Upload to EAS and backup in Vault |
| KG018 | 80+ env vars — no formal schema | Ops | Onboarding friction | ✅ Resolved Apr-2026 — ENVIRONMENT_VARIABLES.md created with full schema |
| KG020c | No virus scanning on uploads | Security | Malware risk | `lib/virusScan.ts` is an explicit stub — integrate ClamAV or cloud AV |
| KG020d | No field-level encryption for PII | Privacy | Compliance risk | Evaluate encryption for PII columns |
| KG021 | No rate-limit on inquiries | DDoS | Abuse risk | Add `express-rate-limit` |
| KG023 | SLI/SLO definitions absent | Reliability | No targets | Define SLIs for latency/uptime |
| KG024 | Large vendor bundle sizes | Performance | Slow load | Code-split heavy components |
| VD1 | No `security.txt` | Compliance | No disclosure channel | Publish `/.well-known/security.txt` |
| GAP-004 | No `.env.example` in all artifacts | Ops | Dev friction | ✅ Resolved Apr-2026 — `.env.example` expanded to 175 variables covering all documented env vars in `ENVIRONMENT_VARIABLES.md` |
| TD-001 | PRISM framework naming inconsistency | Tech Debt | Internal confusion | Pulse/Risk/Intel vs People/Revenue/Infra |
| TD-002 | Broken seed scripts (PRISM Counsel) | Tech Debt | Dev friction | Fix recovery table seed scripts |
| TD-003 | DEMO_GUIDE.md said "five primitives" throughout | Doc Accuracy | ✅ Resolved Apr-2026 | Corrected to six primitives (Event Fabric is the 6th) |
| TD-004 | TRUST_CENTER_INDEX.md cited HuggingFace/Qwen3-8B as AI model | Doc Accuracy | ⚠️ Re-opened Apr-2026 | Gap register marked resolved but TRUST_CENTER_INDEX.md § Model Transparency (line ~94) still reads "Current primary model: HuggingFace Inference (Qwen3-8B)". File needs to be corrected to reflect multi-provider stack (OpenAI, Anthropic, Gemini). Must fix before external trust center review. |
| TD-005 | SECURITY.md role list showed 6 of 11 platform roles | Doc Accuracy | ✅ Resolved Apr-2026 | Corrected to full 11-role hierarchy with reference to ACCESS-CONTROL-MATRIX.md |
| TD-006 | PRODUCT-SURFACES.md lists domain-specific mobile apps (aegis-mobile, vessels-mobile, terra-mobile, lyte-mobile) that are not registered artifacts | Doc Accuracy | ⚠️ Open — verify artifact registration status before first external eval |
| KG029 | Integration connector test stub in alloy-integrations | API / Quality | Minor UX gap | `routes/alloy-integrations.ts:345` returns hardcoded "Test not implemented for this integration type" for unsupported integrations — implement per-type test logic or document which types are testable |
| RD-001 | SOC 2 Type II / FedRAMP readiness | Compliance | Sales blocker | Post-revenue roadmap items |
| RD-002 | Horizontal scaling / Load testing | Infra | Scale risk | Validate Azure autoscale under load |

---

### Phase 4–5: Flow & Testing Gaps (added Apr-2026)

#### Flow Audit Gaps

| ID | Gap | Area | Severity | Status |
|----|-----|------|----------|--------|
| FLOW-001 | No new-user guided onboarding wizard — FIRST_10_MINUTES.md describes ideal state; actual UI has sparse empty states | Onboarding | P1 | ⚠️ Open |
| FLOW-002 | Live billing integration not fully wired for all billing flows | Billing | P1 | ⚠️ Open — Sprint 3 |
| FLOW-003 | No SLA enforcement automation in support intake flow | Support Ops | P2 | ⚠️ Open — Sprint 4 |
| FLOW-004 | No escalation path for timed-out approvals | Approvals | P2 | ⚠️ Open — Sprint 4 |

#### Test Quality Gaps

| ID | Gap | Area | Severity | Status |
|----|-----|------|----------|--------|
| TG-001 | No tests for billing event flows | Quality | P1 | ⚠️ Open — Sprint 3 |
| TG-002 | No tests for webhook delivery | Quality | P1 | ⚠️ Open — Sprint 3 |
| TG-003 | Admin-only route tests incomplete | Quality | P1 | ⚠️ Open — Sprint 3 |
| TG-004 | Approval escalation not tested | Quality | P1 | ⚠️ Open — Sprint 3 |
| TG-005 | Object storage tenant isolation not tested | Quality / Security | P2 | ⚠️ Open — Sprint 4 |
| TG-006 | GraphQL resolver tenant scoping partial | Quality / Security | P2 | ⚠️ Open — Sprint 4 |
| TG-007 | No automated E2E tests for mobile (Expo / CORTEX) | Quality | P2 | ⚠️ Open — Sprint 4 |
| TG-008 | Systematic WCAG accessibility testing absent (KG025) | Quality / Compliance | P2 | ⚠️ Open — Sprint 4 |

#### Test Fixes (resolved in Phase 4–5 audit)

| ID | Fix | Status |
|----|-----|--------|
| AF-T001 | `cortex-inca-smoke.test.ts` excluded from unit test config (requires live DB — belongs in integration only) | ✅ Fixed Apr-2026 |
| AF-T002 | `api-version.ts` error messages updated to match test contract — 4 previously failing tests now pass | ✅ Fixed Apr-2026 |

---

## Disposition Summary

| Severity | Total | Resolved | Open |
|----------|-------|----------|------|
| P0 — Critical / High | 11 | 10 | 1 |
| P1 — High | 12 | 0 | 12 |
| P2 — Medium / Low | 24 | 4 | 20 |
| Flow Audit Gaps (Phase 4–5) | 4 | 0 | 4 |
| Test Quality Gaps (Phase 4–5) | 8 | 2 | 6 |
| **Total** | **59** | **16** | **43** |

> **April 2026 Phase 0–1 audit note:** Full operational audit (Phases 0–1) completed. Deliverables produced: FULL_SYSTEM_INVENTORY.md, AUDIT_FINDINGS_REGISTER.md, OUT_OF_SCOPE_REGISTER.md, ENVIRONMENT_VARIABLES.md, updated .env.example. KG018 (env var schema) resolved by ENVIRONMENT_VARIABLES.md. GAP-004 (.env.example) resolved by comprehensive update. KG029 (alloy-integrations test stub) newly cataloged. TD-004 remains re-opened. No new P0/P1 security findings discovered. No hardcoded credentials found in source. All GitHub Actions workflows remain SHA-pinned. Net P2 change: +2 gaps added, +2 resolved. See LAUNCH_BLOCKERS.md for the full pre-launch blocker register.
>
> **April 2026 Phase 2–3 audit note:** Architecture, Auth & Tenancy hardening audit completed. Three new P1 gaps discovered: AF-001 (adminGuard timing-unsafe token compare), AF-003 (vessels fleet routes cross-tenant), AF-007 (vessels DB schema missing org_id). Seven additional P2 findings documented in AUDIT_FINDINGS_REGISTER.md. Net change: +3 P1 open gaps. Full findings in AUDIT_FINDINGS_REGISTER.md and CONTROL_PLANE_ARCHITECTURE.md.
>
> **April 2026 Phase 4–5 audit note:** Flow audit and quality pass completed. 4 new flow gaps and 8 test quality gaps documented. 2 test gaps resolved in this sprint (cortex-inca-smoke config fix, api-version error message fix). All lint warnings documented as baseline (4,519 warnings, 0 errors). Full findings in AUDIT_FINDINGS_REGISTER.md.

---

## Related Documents

### Phase 0–1 Audit Deliverables (created Apr 2026)
- `FULL_SYSTEM_INVENTORY.md` — exhaustive catalog of all apps, packages, routes, schemas, integrations, scripts, CI, docs
- `AUDIT_FINDINGS_REGISTER.md` — all findings with ID, category, severity, location, impact, fix status, manual review needed, blocking status
- `OUT_OF_SCOPE_REGISTER.md` — all deferred/out-of-scope items with disposition guidance
- `ENVIRONMENT_VARIABLES.md` — complete env var reference (~150 documented vars) with required/optional status, defaults verified against source
- `.env.example` — updated developer template with 175 variables, one-to-one with ENVIRONMENT_VARIABLES.md

### Launch Readiness Documents (created Apr 2026)
- `LAUNCH_BLOCKERS.md` — authoritative list of items that block public launch
- `PUBLIC_LAUNCH_READINESS.md` — launch bar definitions across 10 dimensions
- `GO_NO_GO_CHECKLIST.md` — final launch decision checklist
- `OPERATIONAL_READINESS_SCORECARD.md` — red/yellow/green readiness scorecard
- `EXECUTIVE_LAUNCH_SUMMARY.md` — launch readiness summary for leadership and investors

### Security and Credential Documents
- `SECURITY-CHECKLIST.md` — full control inventory and credential hygiene
- `SECRETS_SETUP.md` — instructions for handling secrets and credentials

### Phase 4–5 QA Documents (created Apr 2026)
- `FLOW_AUDIT_MATRIX.md` — per-flow audit state across all user and admin flows
- `TEST_STRATEGY.md` — testing philosophy, coverage targets, and gap plan
- `SMOKE_TEST_PLAN.md` — minimum smoke suite for every deployment
- `REGRESSION_RISK_REGISTER.md` — high-risk logic requiring regression coverage
- `QA_SIGNOFF_CHECKLIST.md` — release gate checklist

### Implementation References
- `lib/db/migrations/0001_add_tenant_id_to_rag_knowledge_chunks.sql` — DB migration for tenant isolation
- `artifacts/api-server/src/lib/validation.ts` — `validateBody` / `validateQuery` / `validateParams` helpers
- `lib/ai-engine/src/retrieval/alloy-retrieval.ts` — tenant-scoped retrieval implementation

### Audit Archive
- `docs/audit/series-a-full-audit.md` — authoritative series A full audit
- `docs/audit/series-a-gap-register.md` — detailed gap register with GAP-001 through GAP-015
- `docs/audit/series-a-out-of-scope-register.md` — series A out-of-scope register
- `docs/audit/mock-stub-placeholder-register.md` — complete mock/stub/placeholder inventory
- `docs/audit/omega-audit-findings.md` — Omega Phase 0 baseline findings

---

## Incident Log

- **2026-04-16 (Phase 4–5 Flow & Quality Audit):** Flow audit and quality pass completed. All major user/admin flows documented in FLOW_AUDIT_MATRIX.md. 4 new flow gaps (FLOW-001–004) and 8 test quality gaps (TG-001–008) added to register. 2 test defects fixed: cortex-inca-smoke excluded from unit config; api-version error messages corrected (4 failing tests now pass). Lint baseline documented: 4,519 warnings, 0 errors. Full findings in AUDIT_FINDINGS_REGISTER.md. New QA docs created: TEST_STRATEGY.md, SMOKE_TEST_PLAN.md, REGRESSION_RISK_REGISTER.md, QA_SIGNOFF_CHECKLIST.md.

- **2026-04-16 (Phase 0–1 Operational Audit):** Full exhaustive inventory and repo/secret hygiene audit completed. No hardcoded credentials found in source — all secrets use `process.env.*`. All 13 GitHub Actions workflows confirmed SHA-pinned. New deliverables created: FULL_SYSTEM_INVENTORY.md (complete platform catalog — 15 artifacts, 40 lib dirs, 18 packages, 225 route files, 13 CI workflows, scripted verification appendix), AUDIT_FINDINGS_REGISTER.md (51 findings with Impact and Manual Review Needed columns), OUT_OF_SCOPE_REGISTER.md (20 deferred items), ENVIRONMENT_VARIABLES.md (~150 vars documented with source-verified defaults), .env.example expanded to 175 vars. KG018 and GAP-004 resolved by new docs. KG029 (alloy-integrations test stub) newly cataloged. virusScan.ts confirmed as explicit stub (KG020c). SESSION_TTL_MS default corrected to 604800000 (7 days) per env-config.ts. KNOWN-GAPS.md updated (rev 6).

- **2026-04-16 (Phase 0 Launch Readiness):** Phase 0 launch readiness audit completed. All committed mobile credential files confirmed as placeholders — no active key material detected. Manual rotation of Firebase/Google credentials required as precautionary measure (GAP-001 / LB-001). TD-004 re-opened: TRUST_CENTER_INDEX.md model reference not corrected despite being marked resolved. Full audit findings documented in LAUNCH_BLOCKERS.md, PUBLIC_LAUNCH_READINESS.md, GO_NO_GO_CHECKLIST.md, OPERATIONAL_READINESS_SCORECARD.md, and EXECUTIVE_LAUNCH_SUMMARY.md.

- **2026-04-16 (Phase 2–3 Architecture/Auth/Tenancy):** Architecture, Auth & Tenancy hardening audit completed. Three new P1 gaps discovered: AF-001 (adminGuard timing-unsafe token compare), AF-003 (vessels fleet routes cross-tenant), AF-007 (vessels DB schema missing org_id). Seven additional P2 findings logged in AUDIT_FINDINGS_REGISTER.md. New documents created: DEPENDENCY_MAP.md, AUDIT_FINDINGS_REGISTER.md, CONTROL_PLANE_ARCHITECTURE.md.

---
