# SZL Holdings — Out-of-Scope Register

**Last updated:** 2026-04-16 (Phase 0–1 Audit)
**Owner:** Platform Engineering
**Audience:** Technical advisors, incoming VP Engineering, Sprint planning

This register catalogs every item that is explicitly deferred, marked "out of scope", or intentionally not implemented in the current phase. Each entry records why it was deferred, current state, severity, and whether it should be reconsidered.

For the full gap register with detailed remediation tracking, see `docs/audit/series-a-out-of-scope-register.md` and `docs/audit/series-a-gap-register.md`.

---

## Column Definitions

| Column | Description |
|---|---|
| **Item** | What was deferred |
| **Location** | Where in the codebase or docs |
| **Why it was deferred** | The rationale for exclusion |
| **Current State** | What exists today |
| **Severity** | Impact if not addressed |
| **Recommended Action** | What should be done |
| **Bring In Scope?** | Should this be done now? |
| **Owner Suggestion** | Who should own this |
| **Launch Impact** | Effect on production launch |

---

## Register

### OOS-001 — Architecture Refactoring

| Field | Detail |
|---|---|
| **Item** | Code-level refactoring of apps or libraries (component structure, library internals) |
| **Location** | All artifacts and lib/ packages |
| **Why deferred** | Phases 0–1 are strictly inventory and secrets hardening; code changes require separate scope |
| **Current State** | Architecture is functionally sound; no structural blockers identified |
| **Severity** | Low |
| **Recommended Action** | Proceed with Phase 2–3 architecture review before any structural changes |
| **Bring In Scope?** | No — Phase 2 work |
| **Owner Suggestion** | Platform Engineering |
| **Launch Impact** | None for initial launch |

---

### OOS-002 — Demo/Production Mode Separation at Runtime Level

| Field | Detail |
|---|---|
| **Item** | Environment-gated mock data, feature flags for demo vs live, demo org isolation |
| **Location** | All artifacts; `scripts/seed-*.ts`; `lib/platform-flags.ts` |
| **Why deferred** | Requires runtime code changes — not documentation/inventory work |
| **Current State** | Demo data is seeded via seed scripts; platform flags exist but do not gate demo vs production data paths globally |
| **Severity** | Medium — important before enterprise multi-tenant onboarding |
| **Recommended Action** | Implement environment-gated data modes in Phase 3–4 |
| **Bring In Scope?** | Yes — Phase 3 priority |
| **Owner Suggestion** | Platform Engineering |
| **Launch Impact** | Required before first external enterprise tenant |

---

### OOS-003 — Testing Framework Expansion

| Field | Detail |
|---|---|
| **Item** | New test files, expanded E2E coverage, integration test expansion for write paths |
| **Location** | `playwright.config.ts`; `vitest.*.config.ts`; `scripts/qa/` |
| **Why deferred** | Not documentation/inventory work; requires code changes |
| **Current State** | Unit tests exist (lib/). E2E sparse — write paths for Aegis, Vessels, Firestorm not covered. Integration tests cover read paths. |
| **Severity** | Medium (GAP-013) |
| **Recommended Action** | Phase 5–6: build Playwright suite for critical user flows |
| **Bring In Scope?** | Yes — Phase 5 |
| **Owner Suggestion** | Platform Engineering |
| **Launch Impact** | Not blocking for initial launch; required before GA |

---

### OOS-004 — Frontend UI Cleanup and Design System Consolidation

| Field | Detail |
|---|---|
| **Item** | UI refactors, design system consolidation, visual improvements |
| **Location** | All web artifacts; `lib/shared-ui` |
| **Why deferred** | Not a security or inventory concern |
| **Current State** | Shared-ui component library exists. Each artifact has minor design variations. |
| **Severity** | Low |
| **Recommended Action** | Post-launch design system sprint |
| **Bring In Scope?** | No — post-launch |
| **Owner Suggestion** | Design / Frontend Engineering |
| **Launch Impact** | None |

---

### OOS-005 — Zod Validation Coverage Expansion (Beyond High-Risk Routes)

| Field | Detail |
|---|---|
| **Item** | Expanding Zod input validation from 21% to ≥80% of API routes |
| **Location** | `artifacts/api-server/src/routes/` (150+ route files unvalidated) |
| **Why deferred** | Phase 0–1 documented the gap; actually closing it requires code changes (Phase 3–4) |
| **Current State** | 21 of ~170 route files apply Zod validation. All DB queries use Drizzle ORM (parameterized — no raw SQL injection risk). High-risk routes covered. |
| **Severity** | Medium (GAP-001) |
| **Recommended Action** | Phase 3–4: systematic Zod validation sweep; target ≥80% coverage |
| **Bring In Scope?** | Yes — Phase 3 |
| **Owner Suggestion** | Platform Engineering |
| **Launch Impact** | Not blocking; partially mitigated by Drizzle ORM |

---

### OOS-006 — Automated Route Security Matrix

| Field | Detail |
|---|---|
| **Item** | CI step to automatically detect routes missing auth middleware |
| **Location** | `.github/workflows/`; `artifacts/api-server/src/routes/` |
| **Why deferred** | Phase 0–1 cataloged the gap; CI tooling changes are Phase 3–4 |
| **Current State** | 155/170 routes have auth middleware (manual audit). No CI guard. |
| **Severity** | Medium (GAP-002) |
| **Recommended Action** | Build `audit-routes.js` CI step to flag unauthenticated routes on every merge |
| **Bring In Scope?** | Yes — Phase 3 |
| **Owner Suggestion** | Platform Engineering / DevOps |
| **Launch Impact** | Conditional blocker (LC) — recommended before enterprise launch |

---

### OOS-007 — Redis Session Store

| Field | Detail |
|---|---|
| **Item** | Persistent session store (Redis) replacing in-memory sessions |
| **Location** | `artifacts/api-server/src/app.ts` session config |
| **Why deferred** | Infrastructure change; requires Redis provisioning |
| **Current State** | In-memory session store. Sessions lost on server restart. `REDIS_URL` / `AZURE_REDIS_CONNECTION_STRING` accepted when present. |
| **Severity** | Medium (GAP-003) |
| **Recommended Action** | Provision Replit Redis or Azure Redis Cache before horizontal scaling |
| **Bring In Scope?** | Yes — before first horizontal scale event |
| **Owner Suggestion** | Infrastructure |
| **Launch Impact** | Not blocking for single-instance launch; required before multi-instance |

---

### OOS-008 — CORS Origins Update for Custom Domain

| Field | Detail |
|---|---|
| **Item** | Update `CORS_ORIGINS` in production env for `szlholdings.com` custom domain |
| **Location** | `.replit [userenv.production]` |
| **Why deferred** | Not relevant until custom domain DNS cutover |
| **Current State** | `CORS_ORIGINS` set to `*.replit.app,*.replit.dev,*.repl.co` |
| **Severity** | High (GAP-004) |
| **Recommended Action** | Update to include `szlholdings.com` and relevant subdomains before DNS cutover |
| **Bring In Scope?** | Yes — mandatory before DNS cutover |
| **Owner Suggestion** | Infrastructure |
| **Launch Impact** | Blocking before custom domain |

---

### OOS-009 — Stripe Live Credentials / Revenue Mode

| Field | Detail |
|---|---|
| **Item** | Configure live `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for production billing |
| **Location** | `artifacts/api-server/src/routes/billing.ts` |
| **Why deferred** | Pre-commercial — no revenue to collect yet |
| **Current State** | Stripe integration fully implemented. Test/demo mode only. No live charges. |
| **Severity** | High (GAP-005) |
| **Recommended Action** | Configure live Stripe keys before first paid transaction |
| **Bring In Scope?** | Yes — before first paying customer |
| **Owner Suggestion** | Founder / Finance |
| **Launch Impact** | Blocking for revenue |

---

### OOS-010 — MFA (Multi-Factor Authentication)

| Field | Detail |
|---|---|
| **Item** | Multi-factor authentication for platform users |
| **Location** | Auth system / OIDC layer |
| **Why deferred** | Enterprise tier feature — not required for pilot launch |
| **Current State** | OIDC (PKCE) single-factor. MFA not implemented (KG026). |
| **Severity** | P1 (KG026) |
| **Recommended Action** | Implement TOTP or authenticator-app MFA before enterprise commitment |
| **Bring In Scope?** | Yes — before enterprise signed contract |
| **Owner Suggestion** | Security Lead |
| **Launch Impact** | Conditional blocker (LC-005) |

---

### OOS-011 — SSRF Validation on Webhook URLs

| Field | Detail |
|---|---|
| **Item** | Host allowlist / SSRF validation for outbound webhook delivery URLs |
| **Location** | `artifacts/api-server/src/routes/webhooks.ts` |
| **Why deferred** | Code change required — Phase 3–4 |
| **Current State** | No SSRF validation on webhook delivery URLs (KG020b). |
| **Severity** | P1 |
| **Recommended Action** | Add `ssrf-req-filter` or host allowlist before webhook feature is externally visible |
| **Bring In Scope?** | Yes — Phase 3 |
| **Owner Suggestion** | Security Lead |
| **Launch Impact** | Conditional blocker (LC-004) |

---

### OOS-012 — Virus / Malware Scanning on Uploads

| Field | Detail |
|---|---|
| **Item** | AV scanning on object storage file uploads |
| **Location** | `artifacts/api-server/src/lib/virusScan.ts` (stub) |
| **Why deferred** | External service integration required; low risk for pre-commercial operation |
| **Current State** | `virusScan.ts` is an explicit stub with pipeline placeholder comment |
| **Severity** | P2 (KG020c) |
| **Recommended Action** | Integrate ClamAV or cloud AV service (Phase 4) |
| **Bring In Scope?** | Yes — before enterprise with sensitive document uploads |
| **Owner Suggestion** | Security / Platform Engineering |
| **Launch Impact** | Not blocking for initial launch |

---

### OOS-013 — Field-Level PII Encryption

| Field | Detail |
|---|---|
| **Item** | Column-level encryption for PII fields (contact email, user profile) |
| **Location** | `lib/db/src/schema/` (PII columns) |
| **Why deferred** | Complex schema change; DB-level encryption provides baseline protection |
| **Current State** | DB-level encryption at rest (Replit-managed PostgreSQL). No field-level encryption for PII columns (KG020d). Connector credentials are field-encrypted via `CONNECTOR_ENCRYPTION_KEY`. |
| **Severity** | P2 |
| **Recommended Action** | Evaluate before SOC 2 Type II preparation |
| **Bring In Scope?** | Roadmap |
| **Owner Suggestion** | Platform Engineering / Security |
| **Launch Impact** | Not blocking for initial launch |

---

### OOS-014 — SOC 2 Type II / StateRAMP Readiness

| Field | Detail |
|---|---|
| **Item** | Formal compliance certifications |
| **Location** | Platform-wide |
| **Why deferred** | Post-revenue, post-first-enterprise-contract work |
| **Current State** | Security controls in place; not formally audited (RD-001) |
| **Severity** | High — sales blocker for certain enterprise segments |
| **Recommended Action** | Initiate audit prep after growth capital close and first enterprise signed |
| **Bring In Scope?** | Post-growth capital |
| **Owner Suggestion** | Compliance Lead / CISO |
| **Launch Impact** | Not blocking for growth capital close or pilot launch |

---

### OOS-015 — Horizontal Scaling / Load Testing

| Field | Detail |
|---|---|
| **Item** | Validate Azure autoscale under realistic load; load test critical paths |
| **Location** | Infra / `infra/` Bicep templates |
| **Why deferred** | Pre-commercial; single-instance sufficient for current scale |
| **Current State** | Single-instance deployment. No load test results. (RD-002) |
| **Severity** | Medium |
| **Recommended Action** | Conduct load testing with realistic concurrent users before enterprise SLA commitment |
| **Bring In Scope?** | Before first enterprise SLA |
| **Owner Suggestion** | Infrastructure / DevOps |
| **Launch Impact** | Not blocking for growth capital or pilot |

---

### OOS-016 — Archived Artifact Directory Cleanup

| Field | Detail |
|---|---|
| **Item** | Remove or archive 5 deprecated artifact directories |
| **Location** | `artifacts/firestorm`, `artifacts/lyte-command-center`, `artifacts/imperium`, `artifacts/prism-counsel`, `artifacts/stephen-site` |
| **Why deferred** | Repository hygiene; no functional impact |
| **Current State** | All 5 directories exist with residual build artifacts, node_modules, or config. `stephen-site` workflow may still be configured. |
| **Severity** | Low (GAP-012) |
| **Recommended Action** | Remove residual content and stop any active workflows in Phase 2–3 |
| **Bring In Scope?** | Yes — Phase 2 cleanup |
| **Owner Suggestion** | Platform Engineering |
| **Launch Impact** | None |

---

### OOS-017 — Responsible Disclosure / security.txt

| Field | Detail |
|---|---|
| **Item** | `/.well-known/security.txt` and public responsible disclosure policy |
| **Location** | Public-facing infrastructure |
| **Why deferred** | Low priority pre-commercial |
| **Current State** | `SECURITY.md` exists with disclosure email. No `security.txt` published (VD1). |
| **Severity** | P2 |
| **Recommended Action** | Publish `/.well-known/security.txt` before first external security evaluation |
| **Bring In Scope?** | Yes — Phase 4 |
| **Owner Suggestion** | Security Lead |
| **Launch Impact** | Not blocking |

---

### OOS-018 — TRUST_CENTER_INDEX.md Model Reference Correction

| Field | Detail |
|---|---|
| **Item** | Update stale AI model reference from HuggingFace/Qwen3-8B to multi-provider stack |
| **Location** | `docs/trust/trust-center.md` §Model Transparency (~line 94) |
| **Why deferred** | Documentation-only fix; was previously marked resolved but file not updated |
| **Current State** | File still reads "HuggingFace Inference (Qwen3-8B)" — stale. Actual stack: OpenAI, Anthropic, Gemini via Replit AI proxy. |
| **Severity** | P2 (TD-004) |
| **Recommended Action** | Fix immediately before any external trust center review |
| **Bring In Scope?** | Yes — immediate |
| **Owner Suggestion** | Platform Engineering |
| **Launch Impact** | Blocks external trust center review |

---

### OOS-019 — domain-specific Mobile Apps Not Registered

| Field | Detail |
|---|---|
| **Item** | PRODUCT-SURFACES.md references domain-specific mobile apps (aegis-mobile, vessels-mobile, terra-mobile, lyte-mobile) that are not registered |
| **Location** | `PRODUCT-SURFACES.md`; `artifacts/` |
| **Why deferred** | These are planned surfaces, not yet built |
| **Current State** | `szl-holdings-mobile` (CORTEX unified) is the only active mobile artifact. Domain-specific mobile apps not started. |
| **Severity** | P2 (TD-006) |
| **Recommended Action** | Clarify product roadmap: build domain-specific apps or remove from public surface documentation |
| **Bring In Scope?** | Yes — before first external product evaluation |
| **Owner Suggestion** | Product / Founder |
| **Launch Impact** | Not blocking for growth capital; may affect product narrative |

---

### OOS-020 — PRISM Framework Naming Inconsistency

| Field | Detail |
|---|---|
| **Item** | Inconsistent naming in PRISM framework (Pulse/Risk/Intel vs People/Revenue/Infra) |
| **Location** | Internal documentation and platform codebase |
| **Why deferred** | Internal consistency issue; no external impact |
| **Current State** | Two naming conventions exist across different documents (TD-001) |
| **Severity** | Low |
| **Recommended Action** | Standardize naming in documentation sprint |
| **Bring In Scope?** | Yes — low priority |
| **Owner Suggestion** | Platform Engineering / Product |
| **Launch Impact** | None |

---

*Related: `AUDIT_FINDINGS_REGISTER.md` · `KNOWN-GAPS.md` · `docs/audit/series-a-out-of-scope-register.md`*

*Last audited: 2026-04-16*
