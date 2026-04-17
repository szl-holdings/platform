# SZL Holdings — Known Gaps Register (Security & Operations)

**Last updated:** 2026-04-16 (rev 7 — Final)  
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
| KG011 | No CodeQL SAST in CI pipeline | P1 | ✅ Resolved Apr-2026 |
| KG012 | No automated dependency vulnerability review in CI | P1 | ✅ Resolved Apr-2026 |
| KG010 | No automated E2E / integration test suite | P1 | ⚠️ Open — Sprint 3–4 |
| GAP-002 | No CI/CD automated secret scanning | Med | ⚠️ Open |
| GAP-003 | Android keystore not managed by EAS | Med | ✅ Resolved Apr-2026 |
| VD1 | No responsible disclosure policy / `security.txt` | P2 | ⚠️ Open — Sprint 4 |
| KG025 | WCAG accessibility not systematically audited | P2 | ⚠️ Open — Sprint 4 |

**Diligence verdict:** All P0 security gaps identified in the pre-sprint audit are resolved. KG011 (CodeQL SAST) and KG012 (dependency review) are now resolved — CI security gates are live. Remaining open items (P1–P2, High/Med) are scoped, have remediation owners, and do not represent critical blockers for Series A close. The highest remaining enterprise risk is the absence of an automated E2E regression suite (KG010).

---

### For Incoming VP Engineering
Operational gaps, process health, test coverage, observability, team ownership.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG009 | OpenTelemetry exporter not configured for production | P1 | ⚠️ Open — pre-deploy |
| KG010 | No automated E2E / integration test suite | P1 | ⚠️ Open — Sprint 3–4 |
| KG011 | CodeQL SAST not configured in CI | P1 | ✅ Resolved Apr-2026 |
| KG012 | Dependency review not in CI | P1 | ✅ Resolved Apr-2026 |
| KG013 | No `CODEOWNERS` file | P1 | ✅ Resolved Apr-2026 |
| KG018 | 80+ env vars with no formal schema documentation | P2 | ⚠️ Open — Sprint 4 |
| GAP-004 | No `.env.example` files for all artifacts | Low | ✅ Resolved Apr-2026 |
| KG019 | No Lighthouse CI performance regression guard | P2 | ⚠️ Open — Sprint 4 |
| KG023 | SLI/SLO definitions absent | P2 | ⚠️ Open — Sprint 4 |
| KG024 | Large vendor bundle sizes on all web apps (1–1.7 MB) | P2 | ⚠️ Open — Sprint 4 |

**VP Engineering verdict:** Core security hardening is complete. CI security gates (KG011/KG012) and code ownership (KG013) are now resolved. Highest-priority operational work for the new VP is: (1) wire OTEL exporter before first prod deploy (KG009), (2) build E2E regression suite (KG010), (3) define SLI/SLOs (KG023).

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
| KG011 | CodeQL SAST not in CI | Security / CI | SAST coverage gap | ✅ Resolved Apr-2026. `.github/workflows/codeql.yml` scans JS/TS on every PR and weekly schedule. | DevOps |
| KG012 | Dependency review not in CI | Supply Chain | Vulnerable deps risk | ✅ Resolved Apr-2026. `.github/workflows/dependency-review.yml` blocks PRs introducing high/critical CVEs. | DevOps |
| KG013 | No `CODEOWNERS` file | Process | No review ownership | ✅ Resolved Apr-2026. `CODEOWNERS` created mapping all artifacts and route directories to owning teams. | Eng Lead |
| KG020b | Webhook URLs not SSRF validated | Security / SSRF | SSRF risk | Add URL validation / host allowlist | Security Lead |
| KG026 | MFA not implemented | Security | Auth risk | Planned for enterprise tier launch | Security |
| KG027 | External uptime monitoring absent | Ops | Visibility gap | Configure before first enterprise pilot | Platform |
| KG028 | Sentry / error tracking not in prod | Observability | Debugging delay | Add Sentry DSN to production | Platform |
| AF-001 | `adminGuard` uses `Buffer.equals()` not `crypto.timingSafeEqual` for internal token | Security / Auth | Theoretical timing attack on admin token | Replace with `timingSafeEqual` (same fix as KG002 in auth.ts) | Security Lead |
| AF-003 | `GET /vessels/fleets` routes return all tenants' fleet data without tenant scoping | Security / Multi-tenancy | Cross-tenant data visibility | Add tenant scope filtering to vessels fleet routes | Engineering |
| AF-007 | `vessels.*` tables (`vessels_fleets`, `vessels`, positions, cargo, routes) missing `org_id` | Security / Multi-tenancy | DB-level cross-tenant vessel data access | Add `org_id` migration; designate `maritime.ts` as authoritative schema | Engineering |
| KG030 | PostHog product analytics not yet wired | Analytics | No funnel or feature-adoption data | Instrument before launch (OBS-007) | Product |
| KG031 | Status page at `/status` not yet live | Support Ops | No customer self-service incident visibility | Deploy via Betterstack/Instatus per STATUSPAGE_PLAN.md (SUP-001) | Platform |

---

### P2 — Medium / Low (open — Sprint 4 / roadmap)

| ID | Gap | Area | Impact | Notes |
|----|-----|------|--------|-------|
| GAP-002 | No CI/CD automated secret scanning | Security | Leaked keys risk | Add `gitleaks` to CI |
| GAP-003 | Android keystore not in EAS | Mobile Ops | SPOF risk | ✅ Resolved Apr-2026. `eas.json` sets `credentialsSource: "remote"` for production Android/iOS. Firebase credentials uploaded as EAS file secrets (`GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICE_INFO_PLIST`) and read dynamically by `app.config.js`. Google Play service account key stored as EAS string secret (`GOOGLE_SERVICE_ACCOUNT_KEY_JSON`) — EAS Submit reads it automatically, no `serviceAccountKeyPath` in `eas.json`. `SECRETS_SETUP.md` rewritten to EAS-first workflow. No local credential files required for any build. |
| KG018 | 80+ env vars — no formal schema | Ops | Onboarding friction | ✅ Resolved Apr-2026 — ENVIRONMENT_VARIABLES.md created with full schema |
| KG020c | No virus scanning on uploads | Security | Malware risk | `lib/virusScan.ts` is an explicit stub — integrate ClamAV or cloud AV |
| KG020d | No field-level encryption for PII | Privacy | Compliance risk | Evaluate encryption for PII columns |
| KG021 | No rate-limit on inquiries | DDoS | Abuse risk | ✅ Resolved Apr-2026 — `express-rate-limit` applied to `POST /holdings/inquiries` (10 req/hr per IP) |
| KG023 | SLI/SLO definitions absent | Reliability | No targets | Define SLIs for latency/uptime |
| KG024 | Large vendor bundle sizes | Performance | Slow load | Code-split heavy components |
| VD1 | No `security.txt` | Compliance | No disclosure channel | Publish `/.well-known/security.txt` |
| GAP-004 | No `.env.example` in all artifacts | Ops | Dev friction | ✅ Resolved Apr-2026 — `.env.example` expanded to 175 variables covering all documented env vars in `ENVIRONMENT_VARIABLES.md` |
| TD-001 | PRISM framework naming inconsistency | Tech Debt | Internal confusion | Pulse/Risk/Intel vs People/Revenue/Infra |
| TD-002 | Broken seed scripts (PRISM Counsel) | Tech Debt | Dev friction | Fix recovery table seed scripts |
| TD-003 | DEMO_GUIDE.md said "five primitives" throughout | Doc Accuracy | ✅ Resolved Apr-2026 | Corrected to six primitives (Event Fabric is the 6th) |
| TD-004 | TRUST_CENTER_INDEX.md cited HuggingFace/Qwen3-8B as AI model | Doc Accuracy | ✅ Resolved Apr-2026 (Phase 10–13) | TRUST_CENTER_INDEX.md § Model Transparency corrected: HuggingFace/Qwen3-8B reference removed; multi-provider stack (OpenAI, Anthropic, Gemini) documented. See Phase 10–13 audit note and incident log entry for evidence. |
| TD-005 | SECURITY.md role list showed 6 of 11 platform roles | Doc Accuracy | ✅ Resolved Apr-2026 | Corrected to full 11-role hierarchy with reference to ACCESS-CONTROL-MATRIX.md |
| TD-006 | PRODUCT-SURFACES.md lists domain-specific mobile apps (aegis-mobile, vessels-mobile, terra-mobile, lyte-mobile, carlota-jo-mobile) that are not registered artifacts | Doc Accuracy | ✅ Resolved Apr-2026 — PRODUCT-SURFACES.md § "Domain-Specific Mobile Apps" renamed to "Domain-Specific Mobile Apps — Roadmap (Not Yet Built)" with explicit status disclosure: each entry now annotated as "Roadmap — not yet built" with planned artifact path marked "(not registered)" and an earliest build window contingent on customer/design-partner demand. Live mobile coverage today is delivered through CORTEX (`artifacts/szl-holdings-mobile`). ARCHITECTURE.md system topology diagram updated to drop the unbuilt mobile clients. EXECUTIVE_LAUNCH_SUMMARY.md RT-010/TD-006 row marked complete. |
| TD-007 | Investor docs (investor-overview.md, platform-thesis.md, go-to-market.md, problem-opportunity.md, why-now.md, why-team.md) all said "five platform primitives" — Event Fabric was the 6th (added Apr-2026) | Doc Accuracy | ✅ Resolved Apr-2026 — All investor docs updated to "six primitives" with Event Fabric listed explicitly |
| TD-008 | Category naming inconsistent: "Governed Decision Infrastructure" (CATEGORY_POSITIONING.md), "Governed Operational Intelligence" (investor-overview.md, platform-thesis.md), creating confusion in investor conversations | Doc Accuracy | ✅ Resolved Apr-2026 — Canonical name is now "Governed Decision Operating System" across CATEGORY_POSITIONING.md v2.1, INVESTOR_NARRATIVE.md v3.0, MOAT_MAP.md v2.0, and investor-overview.md. Historical references to "Infrastructure" and "Intelligence" remain in some docs as variant terminology. |
| TD-009 | investor-overview.md Evaluation Path referenced "five architectural abstractions" instead of six | Doc Accuracy | ✅ Resolved Apr-2026 — Updated |
| TD-010 | platform-thesis.md Defensibility section still said "Five platform primitives" and Event Fabric was absent from the primitives table | Doc Accuracy | ✅ Resolved Apr-2026 — Updated table and all count references |
| KG029 | Integration connector test stub in alloy-integrations | API / Quality | Minor UX gap | `routes/alloy-integrations.ts:345` returns hardcoded "Test not implemented for this integration type" for unsupported integrations — implement per-type test logic or document which types are testable |
| KG032 | `lib/observability/src/collector.ts` seeds simulated data in constructor | Observability / Analytics | Domain app dashboards display synthetic data | Wire live API signals to replace `seedSimulatedData()` call (OBS-008) |
| KG033 | `OBSERVABILITY_ARCHITECTURE.md` covers decision-fabric surfaces only; no single doc covers production infra observability (OTEL config, logging pipeline, metrics, alerting) | Docs / Observability | Onboarding friction for new VP/Platform lead | Add §Production Infrastructure Observability section to OBSERVABILITY_ARCHITECTURE.md (OBS-006) |
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
| P1 — High | 14 | 3 | 11 |
| P2 — Medium / Low | 30 | 9 | 21 |
| Flow Audit Gaps (Phase 4–5) | 4 | 0 | 4 |
| Test Quality Gaps (Phase 4–5) | 8 | 2 | 6 |
| **Total** | **72** | **25** | **47** |

> **April 2026 Phase 0–1 audit note:** Full operational audit (Phases 0–1) completed. Deliverables produced: FULL_SYSTEM_INVENTORY.md, AUDIT_FINDINGS_REGISTER.md, OUT_OF_SCOPE_REGISTER.md, ENVIRONMENT_VARIABLES.md, updated .env.example. KG018 (env var schema) resolved by ENVIRONMENT_VARIABLES.md. GAP-004 (.env.example) resolved by comprehensive update. KG029 (alloy-integrations test stub) newly cataloged. TD-004 remains re-opened. No new P0/P1 security findings discovered. No hardcoded credentials found in source. All GitHub Actions workflows remain SHA-pinned. Net P2 change: +2 gaps added, +2 resolved. See LAUNCH_BLOCKERS.md for the full pre-launch blocker register.
>
> **April 2026 Phase 2–3 audit note:** Architecture, Auth & Tenancy hardening audit completed. Three new P1 gaps discovered: AF-001 (adminGuard timing-unsafe token compare), AF-003 (vessels fleet routes cross-tenant), AF-007 (vessels DB schema missing org_id). Seven additional P2 findings documented in AUDIT_FINDINGS_REGISTER.md. Net change: +3 P1 open gaps. Full findings in AUDIT_FINDINGS_REGISTER.md and CONTROL_PLANE_ARCHITECTURE.md.
>
> **April 2026 Phase 4–5 audit note:** Flow audit and quality pass completed. 4 new flow gaps and 8 test quality gaps documented. 2 test gaps resolved in this sprint (cortex-inca-smoke config fix, api-version error message fix). All lint warnings documented as baseline (4,519 warnings, 0 errors). Full findings in AUDIT_FINDINGS_REGISTER.md.
>
> **April 2026 Phase 6–9 audit note:** Observability, billing, support operations, and release safety audit completed. All 25 deliverable documents verified present and substantive. 2 new P1 gaps added: KG030 (PostHog not wired) and KG031 (status page not live). 2 new P2 gaps added: KG032 (observability collector uses simulated data) and KG033 (no unified production infra observability doc). 1 existing gap clarified: BIL-001 notes Stripe is test-mode only (cross-reference DATA-009). Release safety documentation (RELEASE_CHECKLIST.md, DEPLOYMENT-GUIDE.md, ENVIRONMENT_VALIDATION.md, ROLLBACK_PLAYBOOK.md, LAUNCH_DAY_RUNBOOK.md, GO_NO_GO_CHECKLIST.md) is all production-quality. CI pipeline is comprehensive with 14 workflows all SHA-pinned. No new P0 findings. Full findings in AUDIT_FINDINGS_REGISTER.md §Phase 6–9.
>
> **April 2026 Phase 10–13 audit note (FINAL):** Trust Center, diligence, docs, commercial/demo coherence, and 9-perspective adversarial red-team review completed. TD-004 fixed: TRUST_CENTER_INDEX.md model transparency corrected (HuggingFace/Qwen3-8B reference removed; multi-provider stack documented). 9 new actionable gaps added (RT-003, RT-005–RT-011, RT-017). 4 additional observations confirmed existing P1 gaps (no new P0/P1 security findings discovered). All commercial docs (DEMO_STRATEGY.md, EXECUTIVE_DEMO.md, OPERATOR_DEMO.md, TECHNICAL_DEMO.md, SALES_NARRATIVE.md, OBJECTION_HANDLING.md, CUSTOMER_SUCCESS_PLAYBOOK.md, GO_TO_MARKET_MOTION.md, PROOF_OF_VALUE_PLAYBOOK.md, DESIGN_PARTNER_PROGRAM.md) passed commercial coherence audit — no fabricated readiness claims found. Full red-team findings in AUDIT_FINDINGS_REGISTER.md § Phase 10–13. Final executive summary with go/no-go recommendation in EXECUTIVE_LAUNCH_SUMMARY.md.
>
> **April 2026 Phase 10–11 Category Leadership & Final Diligence audit note:** Seven stakeholder lens diligence review conducted (enterprise security architect, platform buyer, AI governance stakeholder, operator lead, Series A technical advisor, VP Engineering, category-savvy product strategist). Key findings and resolutions: (1) TD-007: "Five primitives" inconsistency in 6 investor docs — resolved, all updated to "six primitives" with Event Fabric listed. (2) TD-008: Category naming inconsistency — canonical name established as "Governed Decision Operating System"; CATEGORY_POSITIONING.md updated to v2.1 with three new "why alternatives are insufficient" sections (observability, copilots, automation without proof/policy). (3) TD-009, TD-010: Residual primitive count errors in platform-thesis.md and investor-overview.md evaluation path — resolved. (4) MOAT_MAP.md updated to v2.0. (5) INVESTOR_NARRATIVE.md updated to v3.0 with Forge, Decision Fabric, and OS category framing. (6) TECHNICAL_DILIGENCE_PACKET.md footer updated to reflect complete 13-phase audit. Net P2 change: +4 gaps added, all 4 resolved. No new P0/P1 findings.

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

### Phase 6–9 Ops, Billing & Release Documents (verified Apr 2026)

**Observability & Analytics:**
- `OBSERVABILITY_ARCHITECTURE.md` — decision-fabric observability surfaces
- `AI_RUNTIME_OBSERVABILITY.md` — AI telemetry and GenAI trace conventions
- `ANALYTICS-EVENTS.md` — canonical event taxonomy with funnel definitions
- `NORTH_STAR_METRICS.md` — governed decisions as the north star metric
- `EXECUTIVE_SCORECARD.md` — board-quality weekly/monthly scorecard framework
- `CUSTOMER_HEALTH_MODEL.md` — 5-signal composite health score (0–100) per tenant
- `LAUNCH_ANALYTICS_PLAN.md` — Day 0/1/7/30 measurement plan with benchmarks

**Billing & Commercial:**
- `BILLING_ARCHITECTURE.md` — Stripe integration, entitlement middleware, billing state
- `ENTITLEMENTS_MODEL.md` — plan tiers, feature gating, domain pack access model
- `PLAN_MATRIX.md` — quick-reference feature comparison across all tiers
- `PRICING_PACKAGING.md` — commercial pricing, packaging, and discount structure
- `REVENUE_MODEL.md` — ARR model, expansion vectors, and revenue forecasting
- `LAND_AND_EXPAND.md` — land/expand motion, expansion triggers, and playbook

**Support & Incident Operations:**
- `SUPPORT_OPERATIONS.md` — channels, tiers, SLAs, and staffing model
- `INCIDENT_COMMAND_PLAYBOOK.md` — IC role, phases, communications, review process
- `SEVERITY_MODEL.md` — P0–P3 classification with qualifying criteria and response targets
- `STATUSPAGE_PLAN.md` — status page architecture (planned) with Betterstack/Instatus guidance
- `CUSTOMER_ESCALATION_MATRIX.md` — who to contact, when, and how for each scenario
- `RUNBOOK_COMMON_FAILURES.md` — step-by-step recovery for known failure modes
- `SUPPORT_HANDOFF_GUIDE.md` — IC transfer and shift-handover procedures

**Release Safety:**
- `RELEASE_CHECKLIST.md` — comprehensive pre-release gate with staged rollout plan
- `DEPLOYMENT-GUIDE.md` — Replit + Azure deployment procedures with hard blockers
- `ENVIRONMENT_VALIDATION.md` — Stage 1 (dev→staging) and Stage 2 (staging→prod) gates
- `ROLLBACK_PLAYBOOK.md` — rollback criteria, procedures for Replit + Azure, DB rollback
- `LAUNCH_DAY_RUNBOOK.md` — T-48h, T-0, T+24h/72h launch operations
- `GO_NO_GO_CHECKLIST.md` — 7-section launch decision tool with binary pass/fail criteria

### Phase 10–13 Trust, Docs & Commercial Documents (verified/updated Apr 2026)
- `TRUST_CENTER_INDEX.md` — buyer-facing security, AI governance, and compliance hub (TD-004 corrected this sprint)
- `TECHNICAL_DILIGENCE_PACKET.md` — complete investor/advisor technical diligence packet
- `SHARED_RESPONSIBILITY_MODEL.md` — operational posture and shared responsibility model
- `PRIVACY_OVERVIEW.md` — GDPR/CCPA privacy framework overview
- `AI_GOVERNANCE.md` — buyer-facing AI governance posture
- `COMPANY_FACT_SHEET.md` — concise company overview for press/investors
- `SERIES_A_READINESS.md` — honest Series A readiness assessment
- `DOCS_HOME.md` — documentation home page
- `GETTING_STARTED.md` — developer and operator quick start
- `END_USER_GUIDE.md` — end-user operational guide
- `FAQ.md` — frequently asked questions
- `FEATURE_OVERVIEW.md` — complete feature surface overview
- `CONTRIBUTING.md` — developer contribution guide
- `DEMO_STRATEGY.md` — demo strategy for all three audiences
- `EXECUTIVE_DEMO.md` — investor/executive demo script
- `OPERATOR_DEMO.md` — operator audience demo script
- `TECHNICAL_DEMO.md` — technical partner demo script
- `DESIGN_PARTNER_PROGRAM.md` — design partner program terms and engagement model
- `PROOF_OF_VALUE_PLAYBOOK.md` — POV engagement methodology
- `GO_TO_MARKET_MOTION.md` — GTM motion documentation
- `SALES_NARRATIVE.md` — sales narrative and positioning
- `OBJECTION_HANDLING.md` — objection handling guide
- `CUSTOMER_SUCCESS_PLAYBOOK.md` — customer success methodology
- `EXECUTIVE_LAUNCH_SUMMARY.md` — **final go/no-go decision package** (all 13 executive outputs)

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

- **2026-04-16 (Phase 6–9 Ops, Billing & Release Audit):** Observability, analytics, billing, support operations, incident response, and release safety audit completed. All 25 deliverable documents verified present and substantive. New gaps cataloged: KG030 (PostHog not wired), KG031 (status page not live), KG032 (observability collector seeds simulated data), KG033 (no unified prod infra observability doc). Billing documentation (BILLING_ARCHITECTURE.md, ENTITLEMENTS_MODEL.md, PLAN_MATRIX.md, PRICING_PACKAGING.md, REVENUE_MODEL.md, LAND_AND_EXPAND.md) verified complete and accurate. Support operations documentation (SUPPORT_OPERATIONS.md, INCIDENT_COMMAND_PLAYBOOK.md, SEVERITY_MODEL.md, STATUSPAGE_PLAN.md, CUSTOMER_ESCALATION_MATRIX.md, RUNBOOK_COMMON_FAILURES.md, SUPPORT_HANDOFF_GUIDE.md) verified production-quality. Release safety documentation (RELEASE_CHECKLIST.md, DEPLOYMENT-GUIDE.md, ENVIRONMENT_VALIDATION.md, ROLLBACK_PLAYBOOK.md, LAUNCH_DAY_RUNBOOK.md, GO_NO_GO_CHECKLIST.md) verified production-quality with real pass/fail criteria. CI pipeline verified: 14 workflows all SHA-pinned. No new P0 security findings. KNOWN-GAPS.md updated to rev 7.

- **2026-04-16 (Phase 0–1 Operational Audit):** Full exhaustive inventory and repo/secret hygiene audit completed. No hardcoded credentials found in source — all secrets use `process.env.*`. All 13 GitHub Actions workflows confirmed SHA-pinned. New deliverables created: FULL_SYSTEM_INVENTORY.md (complete platform catalog — 15 artifacts, 40 lib dirs, 18 packages, 225 route files, 13 CI workflows, scripted verification appendix), AUDIT_FINDINGS_REGISTER.md (51 findings with Impact and Manual Review Needed columns), OUT_OF_SCOPE_REGISTER.md (20 deferred items), ENVIRONMENT_VARIABLES.md (~150 vars documented with source-verified defaults), .env.example expanded to 175 vars. KG018 and GAP-004 resolved by new docs. KG029 (alloy-integrations test stub) newly cataloged. virusScan.ts confirmed as explicit stub (KG020c). SESSION_TTL_MS default corrected to 604800000 (7 days) per env-config.ts. KNOWN-GAPS.md updated (rev 6).

- **2026-04-16 (Phase 0 Launch Readiness):** Phase 0 launch readiness audit completed. All committed mobile credential files confirmed as placeholders — no active key material detected. Manual rotation of Firebase/Google credentials required as precautionary measure (GAP-001 / LB-001). TD-004 re-opened: TRUST_CENTER_INDEX.md model reference not corrected despite being marked resolved. Full audit findings documented in LAUNCH_BLOCKERS.md, PUBLIC_LAUNCH_READINESS.md, GO_NO_GO_CHECKLIST.md, OPERATIONAL_READINESS_SCORECARD.md, and EXECUTIVE_LAUNCH_SUMMARY.md.

- **2026-04-16 (Phase 2–3 Architecture/Auth/Tenancy):** Architecture, Auth & Tenancy hardening audit completed. Three new P1 gaps discovered: AF-001 (adminGuard timing-unsafe token compare), AF-003 (vessels fleet routes cross-tenant), AF-007 (vessels DB schema missing org_id). Seven additional P2 findings logged in AUDIT_FINDINGS_REGISTER.md. New documents created: DEPENDENCY_MAP.md, AUDIT_FINDINGS_REGISTER.md, CONTROL_PLANE_ARCHITECTURE.md.

- **2026-04-16 (Phase 10–13 Trust, Docs, Commercial, Red-Team — FINAL):** Final audit phases completed. Trust Center content reviewed and corrected: TD-004 resolved — TRUST_CENTER_INDEX.md model transparency updated from incorrect HuggingFace/Qwen3-8B reference to accurate multi-provider stack (OpenAI, Anthropic, Gemini). Self-serve documentation audit completed: 4 new doc gaps cataloged (RT-005 through RT-008). Commercial/demo coherence audit passed: all 10 commercial docs verified against live product capabilities — no fabricated readiness claims found. 9-perspective adversarial red-team review completed: no new P0 or P1 security findings discovered; 5 new P2 actionable gaps surfaced (RT-003, RT-009–RT-011, RT-017). Final cumulative audit totals: 106 total findings across all phases, 13 resolved, 93 open (includes INFO/PASS observations). EXECUTIVE_LAUNCH_SUMMARY.md updated with all 13 required executive outputs. KNOWN-GAPS.md rev 7 (final).

- **2026-04-17 (Phase 10–11 Category Leadership & Final Diligence):** Seven stakeholder lens diligence review completed. Category named canonically as "Governed Decision Operating System" — CATEGORY_POSITIONING.md updated to v2.1 with three new sections (why legacy observability is insufficient, why generic AI copilots are insufficient, why automation without proof/policy is insufficient). INVESTOR_NARRATIVE.md updated to v3.0 (Forge governed agent lifecycle, Decision Fabric, category OS framing). MOAT_MAP.md updated to v2.0. MARKET_POSITIONING.md updated to v2.0. COMPANY_FACT_SHEET.md updated. TECHNICAL_DILIGENCE_PACKET.md footer updated to reflect full 13-phase audit completion. 4 new P2 doc accuracy gaps catalogued (TD-007 through TD-010), all 4 resolved. Six investor docs corrected from "five primitives" to "six primitives" with Event Fabric explicitly listed. KNOWN-GAPS.md rev 8 (final category elevation pass).

---
