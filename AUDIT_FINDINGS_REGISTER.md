# SZL Holdings — Audit Findings Register

**Last updated:** 2026-04-16 (Phase 6–9 Ops Audit)
**Owner:** Platform Engineering / Engineering
**Scope:** Full SZL Holdings monorepo — all apps, libraries, routes, secrets, CI/CD, docs, and flows

This register catalogs every finding from all operational audit phases (Phase 0–5). It is the canonical findings reference. For the gap register with full remediation tracking, see `KNOWN-GAPS.md`. For detailed series A findings, see `docs/audit/series-a-gap-register.md`.

**Related:** [KNOWN-GAPS.md](KNOWN-GAPS.md) · [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) · [TENANCY-MODEL.md](TENANCY-MODEL.md) · [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) · [DEPENDENCY_MAP.md](DEPENDENCY_MAP.md) · [CONTROL_PLANE_ARCHITECTURE.md](CONTROL_PLANE_ARCHITECTURE.md)

---

## Audit History

| Audit | Date | Phases | Outcome |
|-------|------|--------|---------|
| Phase 0–1: Inventory & Architecture | Apr 2026 | Code inventory, route audit, auth audit, secret hygiene, env vars | Completed |
| Phase 2–3: Security & Auth Hardening | Apr 2026 | Auth, secrets, tenant isolation | P0 items resolved |
| Phase 4–5: Flow Audit & Quality Pass | Apr 2026 | Flows, testing, lint, build, QA docs | Completed |
| Phase 6–9: Ops, Billing & Release | Apr 2026 | Observability, analytics, billing, support, incident, release safety | Completed — 6 new findings |

---

## Finding ID Legend

| Prefix | Category |
|---|---|
| `SEC-` | Security / credentials |
| `ARCH-` | Architecture / design |
| `API-` | API server / routes |
| `DB-` | Database / schema |
| `CI-` | CI/CD / workflows |
| `OBS-` | Observability / monitoring |
| `DATA-` | Data modes / mocks / stubs |
| `DOC-` | Documentation |
| `OPS-` | Operational hygiene |
| `QUAL-` | Quality / testing |
| `AF-T-` | Test quality (Phase 4–5) |
| `AF-F-` | Flow audit (Phase 4–5) |
| `AF-` | Phase 2–3 Architecture/Auth/Tenancy Finding |

---

## Severity Definitions

| Severity | Definition |
|---|---|
| **P0 — Critical** | Active security risk or data exposure / auth bypass — fix immediately |
| **P1 — High** | Significant exposure; must fix before first paying tenant or public launch |
| **P2 — Medium** | Limited exposure; should resolve before broad go-to-market |
| **P3 — Low** | Quality / informational / hardening; no blocking impact |
| **INFO** | Tracked for awareness — no action urgency |

---

## Phase 0–1 Summary Table

| Finding ID | Category | Severity | Location | Impact | Fix Status | Manual Review Needed | Blocking |
|---|---|---|---|---|---|---|---|
| SEC-001 | Credentials | P0 | `artifacts/szl-holdings-mobile/` | Placeholder credentials confirmed safe | ✅ Resolved | No | No |
| SEC-002 | Credentials | P1 | Mobile credential files / Firebase | Potential active credential exposure in git history | ⚠️ Open — manual action | **Yes** — rotate Firebase/Google credentials | Yes (LB-001) |
| SEC-003 | Credentials | P0 | `.gitignore` | All credential patterns now gitignored | ✅ Resolved | No | No |
| SEC-004 | Auth | P0 | `middlewares/auth.ts` | Timing attack vector on internal token compare | ✅ Resolved | No | No |
| SEC-005 | Tenant Isolation | P0 | `lib/ai-engine` / `lib/db` | Cross-tenant RAG data leakage possible | ✅ Resolved | No | No |
| SEC-006 | Input Validation | P0 | API routes (high-risk) | Unvalidated inputs on auth/payment/admin routes | ✅ Resolved (high-risk routes) | No | No |
| SEC-007 | SSRF | P1 | `routes/webhooks.ts` | SSRF via malicious webhook URLs | ⚠️ Open | No | Conditional (LC-004) |
| SEC-008 | File Upload | P2 | `routes/files.ts` / `lib/virusScan.ts` | Malware upload risk — no AV scanning | ⚠️ Open — KG020c | No | No |
| SEC-009 | MFA | P1 | Auth system | Single-factor only — enterprise risk | ⚠️ Planned (enterprise tier) | No | Conditional (LC-005) |
| SEC-010 | PII Encryption | P2 | DB schema (PII columns) | PII columns not field-encrypted | ⚠️ Open — KG020d | No | No |
| SEC-011 | Secret Scanning CI | P2 | `.github/workflows/` | No automated CI secret detection | ⚠️ Open — GAP-002 | No | Conditional (LC-001) |
| ARCH-001 | Session Store | P2 | API server sessions | Sessions lost on restart; no horizontal scale | ⚠️ Open — GAP-003 | No | No |
| ARCH-002 | CORS Config | P1 | `.replit` production env | CORS errors when custom domain goes live | ⚠️ Open — GAP-004 | No | Yes (before DNS cutover) |
| ARCH-003 | In-Memory Sessions | P2 | API server | Duplicate of ARCH-001 — in-memory only | ⚠️ Open | No | No |
| API-001 | Zod Coverage | P2 | API routes (21% covered) | Unvalidated inputs on low-traffic routes | ⚠️ Open — GAP-001 | No | No |
| API-002 | Route Auth Matrix | P2 | API routes | Auth coverage gaps undetectable without manual audit | ⚠️ Open — GAP-002 | No | No |
| API-003 | Integration Test Stub | P3 | `routes/alloy-integrations.ts:345` | "Test not implemented" for some connector types | ⚠️ Open | No | No |
| API-004 | Stub: Virus Scan | P2 | `artifacts/api-server/src/lib/virusScan.ts` | No malware scanning on uploaded files | ⚠️ Open — KG020c | No | No |
| API-005 | Rate Limit (marketing) | P2 | Public marketing routes | Public pages susceptible to crawling/DDoS | ⚠️ Open — GAP-007 | No | No |
| DB-001 | Tenant ID — RAG chunks | P0 | `rag_knowledge_chunks` table | Cross-tenant AI data exposure | ✅ Resolved | No | No |
| DB-002 | Broken Seed Script | P2 | `scripts/seed-prism-counsel.ts` | Dev environment setup failure for PRISM recovery tables | ⚠️ Open — TD-002 | No | No |
| CI-001 | GitHub Action SHA pins | P1 | All 13 workflows | Supply chain risk from mutable action tags | ✅ Resolved | No | No |
| CI-002 | CodeQL SAST | P1 | `.github/workflows/codeql.yml` | SAST coverage gap — static analysis not fully configured | ✅ Workflow exists — config pending | **Yes** — verify CodeQL config | Conditional (LC-002) |
| CI-003 | Dependency Review | P1 | `.github/workflows/dependency-review.yml` | Vulnerable dependency PRs may not be blocked | ✅ Workflow exists — config pending | **Yes** — verify dependency-review config | Conditional (LC-003) |
| CI-004 | CI pnpm/Node version inconsistency | P3 | `ci.yml` integration-test job | Integration tests run in different environment than unit tests | ⚠️ Open — GAP-009 | No | No |
| CI-005 | container-publish stale entry | P3 | `container-publish.yml` | Container publish would fail on archived artifact | ✅ Resolved | No | No |
| OBS-001 | OTEL Exporter | P1 | API server / observability | No production tracing — blind to performance/errors | ⚠️ Open — KG009 | No | Yes (LB-006) |
| OBS-002 | Sentry / Error Tracking | P1 | Not configured | Silent failures in production | ⚠️ Open — KG028 | No | Yes (LB-003) |
| OBS-003 | Uptime Monitoring | P1 | External — none configured | No alerting on service downtime | ⚠️ Open — KG027 | No | Yes (LB-002) |
| OBS-004 | Log Aggregation | P2 | Production only | Logs lost after server restart; no searchable history | ⚠️ Open — GAP-014 | No | No |
| OBS-005 | SLI/SLO Definitions | P2 | None defined | No reliability targets or alerting thresholds | ⚠️ Open — KG023 | No | No |
| DATA-001 | Hardcoded Autopilot Stats | P2 | `artifacts/szl-holdings` | Fake metrics shown as live intelligence | ⚠️ Open | No | No |
| DATA-002 | Hardcoded Client Scores | P2 | Forge client module in `artifacts/szl-holdings` | Hardcoded satisfaction scores misleading in live context | ⚠️ Open | No | No |
| DATA-003 | Simulated AIS Positions | P2 | `routes/vessels-live.ts` | Vessel positions are seeded — not live AIS | ⚠️ Open | No | No |
| DATA-004 | CISO Dashboard not wired | P2 | `artifacts/aegis` | 8 security module KPIs not aggregated | ⚠️ Open | No | No |
| DATA-005 | Aegis new security modules | P2 | `artifacts/aegis/src/pages/` | UI built; not connected to case management APIs | ⚠️ Open | No | No |
| DATA-006 | Vessels commercial modules | P2 | `artifacts/vessels/src/pages/` | 3 new modules (insurance, trading, platform) not DB-connected | ⚠️ Open | No | No |
| DATA-007 | CORTEX badge counts | P2 | `artifacts/command` | Cross-domain badge counts not wired to live API | ⚠️ Open | No | No |
| DATA-008 | Command Overview KPIs | P2 | `artifacts/command` | New module KPIs not yet wired | ⚠️ Open | No | No |
| DATA-009 | Stripe demo/test mode | P1 | Billing routes | No revenue collectible — test mode only | ⚠️ Open — GAP-005 | No | Yes (before first revenue) |
| DOC-001 | TRUST_CENTER_INDEX.md model ref | P2 | `docs/trust/trust-center.md` (~line 94) | Incorrect AI model reference misleads external reviewers | ⚠️ Re-opened — TD-004 | **Yes** — editorial review before external trust center share | Before external review |
| DOC-002 | Domain-specific mobile apps listed but unregistered | P2 | `PRODUCT-SURFACES.md` | Product narrative claims unbuilt surfaces | ⚠️ Open — TD-006 | **Yes** — product roadmap decision needed | Before external product eval |
| DOC-003 | Stale Azure deployment refs | P3 | Several docs | Confusing deployment narrative (Azure vs Replit) | ⚠️ Partially resolved — GAP-010 | No | No |
| DOC-004 | PRISM naming inconsistency | P3 | Internal docs | Two naming conventions in use | ⚠️ Open — TD-001 | No | No |
| OPS-001 | Archived artifacts not cleaned up | P3 | `artifacts/` (5 deprecated dirs) | Dev confusion; pressure on 15-artifact limit | ⚠️ Open — GAP-012 | No | No |
| OPS-002 | cortex-mobile unregistered artifact | P3 | `artifacts/cortex-mobile` | Active dev without artifact registration | ⚠️ Open — GAP-011 | No | No |
| OPS-003 | PUBLIC_APP_URL using replit.app domain | INFO | `.replit` production env | OG tags/emails reference wrong domain post-launch | ⚠️ Update before DNS cutover — GAP-015 | No | No |
| OPS-004 | No CODEOWNERS | P1 | Repo root | No mandatory review ownership on critical paths | ⚠️ Open — KG013 | No | No |
| OPS-005 | No security.txt | P2 | Public domain | No responsible disclosure channel for external researchers | ⚠️ Open — VD1 | No | No |
| OPS-006 | No Lighthouse CI performance guard | P2 | CI | Performance regressions uncaught on merge | ⚠️ Open — KG019 | No | No |
| OPS-007 | Large vendor bundle sizes (1–1.7 MB) | P2 | All web artifacts | Slow initial load for users | ⚠️ Open — KG024 | No | No |
| OPS-008 | Android keystore not EAS-managed | P2 | Mobile ops / signing | SPOF — keystore loss would block app releases | ⚠️ Open — GAP-003 | **Yes** — verify backup status | No |
| QUAL-001 | E2E test coverage sparse | P2 | `playwright.config.ts` | Write-path regressions may not be caught | ⚠️ Open — GAP-013 | No | No |
| QUAL-002 | No Lighthouse performance CI | P2 | CI (duplicate of OPS-006) | Performance regressions uncaught on merge | ⚠️ Open — KG019 | No | No |
| QUAL-003 | No accessibility audit | P2 | All web artifacts | WCAG compliance unknown — enterprise risk | ⚠️ Open — KG025 | No | No |
| AF-001 | Auth | P1 | `middlewares/admin-guard.ts` | `adminGuard` non-timing-safe token comparison | ⚠️ Open | No | Conditional |
| AF-003 | Tenancy | P1 | `routes/vessels.ts` | Vessels fleet routes return all tenants' data | ⚠️ Open | No | Conditional |
| AF-007 | Tenancy / DB | P1 | `lib/db/src/schema/vessels.ts` | `vessels.*` tables missing `org_id` | ⚠️ Open | No | Conditional |
| AF-004 | Admin / Privileged | P2 | `routes/backup.ts` | Backup export lacks orgId authority check | ⚠️ Open | No | No |
| AF-008 | Tenancy / DB | P2 | `lib/db/src/schema/conversations.ts` | `conversations` table missing `org_id` | ⚠️ Open | No | No |
| AF-010 | Auth / Session | P2 | `lib/auth/` | Sessions not invalidated on role change | ⚠️ Open | No | No |
| AF-012 | Auth / Session | P2 | `lib/auth/` | Sessions not invalidated on `SESSION_SECRET` rotation | ⚠️ Open | No | No |
| AF-013 | Architecture | P2 | `middlewares/` | Duplicate divergent internal token verification | ⚠️ Open | No | No |
| AF-014 | Tenancy | P2 | ORM layer | No cross-tenant query guard at ORM layer | ⚠️ Open | No | No |

---

## Phase 0–1 Resolved Findings

| Finding ID | Resolution |
|---|---|
| SEC-001 | Mobile credential files confirmed as placeholder-only; `.gitignore` patterns hardened |
| SEC-003 | `.gitignore` updated with comprehensive credential patterns |
| SEC-004 | Internal token comparison replaced with `crypto.timingSafeEqual` |
| SEC-005 | `tenant_id` added to `rag_knowledge_chunks`; retrieval engine enforces per-tenant filtering; `totalIndexed` is tenant-scoped |
| SEC-006 | Zod validation applied to all high-risk write routes (auth, forms, payments, governance, admin) |
| CI-001 | All 13 GitHub Actions workflows pinned to commit SHAs |
| CI-005 | `lyte-command-center` entry removed from `container-publish.yml` build matrix |
| DB-001 | Migration `0001_add_tenant_id_to_rag_knowledge_chunks.sql` applied; index + strict predicates enforced |

---

## Phase 0–1 Open Findings — Detailed Notes

### SEC-002 — Firebase / Google Credentials Manual Rotation Required
**Severity:** P1 (High) | **Status:** Open | **Blocking:** Yes (LB-001)
- Mobile credential files (`google-services.json`, `GoogleService-Info.plist`) currently contain `PLACEHOLDER_*` values.
- Any previously committed real values (if they existed in git history) require manual rotation at Firebase Console and Google Cloud Console.
- Action: Rotate as a precaution before first production tenant access.
- Owner: Founder / Infrastructure

### SEC-007 — Webhook SSRF Validation Absent
**Severity:** P1 | **Status:** Open | **Blocking:** Conditional (LC-004)
- Webhook delivery URLs are not validated against an SSRF host allowlist.
- Risk: Malicious webhook URLs could trigger internal metadata requests.
- Fix: Add URL validation / host allowlist in `routes/webhooks.ts`.

### API-001 — Zod Input Validation at 21%
**Severity:** P2 | **Status:** Open
- Only 21 of ~170 route files apply Zod input validation.
- All DB queries use parameterized Drizzle ORM (no raw SQL) — partial mitigation.
- High-risk routes (auth, payments, admin) are covered.
- Target: ≥80% coverage by Q2 2026.

### API-003 — "Test not implemented" in Integration Connector
**Severity:** P3 | **Status:** Open
- `artifacts/api-server/src/routes/alloy-integrations.ts:345` returns hardcoded `{ connected: false, message: "Test not implemented for this integration type" }` for unsupported integration types.
- Not a security issue; affects test connectivity UI for some integration types.

### API-004 — Virus Scan is a Stub
**Severity:** P2 | **Status:** Open (KG020c)
- `artifacts/api-server/src/lib/virusScan.ts` is explicitly a stub: "Virus scan stub — pipeline placeholder for future AV integration."
- No malware scanning occurs on uploaded files.
- Fix: Integrate ClamAV or cloud AV on object storage upload path.

### OBS-001 — OTEL Exporter Not Configured for Production
**Severity:** P1 | **Status:** Open | **Blocking:** Yes (LB-006)
- OpenTelemetry is instrumented but no OTLP endpoint is configured.
- Configure `OTEL_EXPORTER_OTLP_ENDPOINT` before first production deploy.

### DATA-001/002 — Hardcoded Autopilot Stats and Client Satisfaction
**Severity:** P2 | **Status:** Open
- Autopilot header (genome score, job count) hardcoded in `artifacts/szl-holdings`.
- Forge client satisfaction scores hardcoded.
- Both need live API wiring.

### DOC-001 — TRUST_CENTER_INDEX.md Stale AI Model Reference
**Severity:** P2 | **Status:** Re-opened (TD-004)
- `docs/trust/trust-center.md` §Model Transparency still reads "Current primary model: HuggingFace Inference (Qwen3-8B)".
- Correct to reflect multi-provider stack (OpenAI, Anthropic, Gemini).
- Must fix before external trust center review.

---

## Phase 4–5 Findings

### Test Quality Findings

| ID | Finding | Severity | Status | Resolution |
|----|---------|----------|--------|------------|
| AF-T001 | `cortex-inca-smoke.test.ts` included in unit test config despite requiring live DB | Medium | ✅ Fixed | Excluded from `vitest.config.ts` (Apr 2026) |
| AF-T002 | `api-version.ts` error messages did not match test expectations — 4 tests failing | Medium | ✅ Fixed | Error messages updated to match test contract (Apr 2026) |
| AF-T003 | No tests for billing event flows | P1 | ⚠️ Open | Sprint 3 (TG-001) |
| AF-T004 | No tests for webhook delivery | P1 | ⚠️ Open | Sprint 3 (TG-002) |
| AF-T005 | Admin-only route tests incomplete | P1 | ⚠️ Open | Sprint 3 (TG-003) |
| AF-T006 | Approval escalation not tested | P1 | ⚠️ Open | Sprint 3 (TG-004) |
| AF-T007 | No automated E2E test suite for mobile (Expo) | P2 | ⚠️ Open | Sprint 4 (TG-007) |
| AF-T008 | Policy engine, proof chain, forge runtime have no dedicated tests | P1 | ⚠️ Open | Sprint 4 (RR-007, RR-008, RR-011) |
| AF-T009 | WebSocket tenant isolation not tested | P1 | ⚠️ Open | Sprint 4 (RR-016) |
| AF-T010 | No automated WCAG/a11y regression | P2 | ⚠️ Open | Sprint 4 (KG025) |

### Code Quality Findings

| ID | Finding | Severity | Status | Notes |
|----|---------|----------|--------|-------|
| AF-Q001 | 4,519 lint warnings across the monorepo (no errors) | Low | ⚠️ Accepted baseline | All warnings; 0 errors |
| AF-Q002 | Unused variables in `shared-ui`, `worldline`, and several scripts | Low | ⚠️ Open | No functional impact |
| AF-Q003 | `console.log` calls in `web-push-registration.ts` | Low | ⚠️ Open | Replace with structured logger |

### Flow Audit Findings

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| AF-F001 | No new-user guided onboarding wizard — actual UI has sparse empty states | P1 | ⚠️ Open (FLOW-001) |
| AF-F002 | Live billing integration not fully wired for all billing flows | P1 | ⚠️ Open (FLOW-002) |
| AF-F003 | No SLA enforcement automation in support intake | P2 | ⚠️ Open (FLOW-003) |
| AF-F004 | No escalation path for timed-out approvals | P2 | ⚠️ Open (FLOW-004) |
| AF-F005 | PRISM Counsel seed scripts broken (recovery tables) | Medium | ⚠️ Open (TD-002) |
| AF-F006 | Some domain packs use mock/demo data in UI | Medium | ⚠️ Open |

---

## Phase 6–9 Findings (Ops, Billing & Release Audit — Apr 2026)

### Phase 6: Observability & Analytics

| ID | Finding | Severity | Status | Notes |
|----|---------|----------|--------|-------|
| OBS-006 | `OBSERVABILITY_ARCHITECTURE.md` is scoped to decision-fabric observability (Layer 4 surfaces) only. Production infrastructure observability — OTEL export config, structured logging pipeline, metrics aggregation, business events tracking, alerting architecture — is distributed across `OPERATIONS-RUNBOOK.md`, `DEPLOYMENT-GUIDE.md`, and `AI_RUNTIME_OBSERVABILITY.md` with no single unified reference. | P2 | ⚠️ Open | Recommend adding a §Production Infrastructure Observability section to OBSERVABILITY_ARCHITECTURE.md covering logging stack, OTEL export, metrics, and alerting |
| OBS-007 | PostHog product analytics listed as "Planned" in `ANALYTICS-EVENTS.md`. No instrumentation exists for product funnels, feature adoption, or cohort analysis. GA4 is configured for page views only. | P1 | ⚠️ Open | Must be wired before launch to support activation and engagement measurement |
| OBS-008 | `lib/observability/src/collector.ts` calls `seedSimulatedData()` in its constructor — the observability collector is pre-populated with synthetic data rather than real telemetry signals. This is a frontend-rendering component, not server telemetry, but it means the observability dashboards in domain apps display simulated rather than live metrics. | P2 | ⚠️ Open | Wire live API signals to replace seed data; tracked in KNOWN-GAPS.md |

### Phase 7: Billing & Entitlements

| ID | Finding | Severity | Status | Notes |
|----|---------|----------|--------|-------|
| BIL-001 | Stripe integration uses test-mode keys — no live revenue is collectible. `BILLING_ARCHITECTURE.md` honestly documents this. Full billing wiring (live Stripe keys, webhook event handling for all subscription events, invoice lifecycle) is required before first commercial transaction. Cross-reference: DATA-009, FLOW-002, TG-001. | P1 | ⚠️ Open | Must resolve before any paying tenant; LB-007 does not include a billing live check — recommend adding one to GO_NO_GO_CHECKLIST.md Section 1 |
| BIL-002 | `BILLING_ARCHITECTURE.md`, `ENTITLEMENTS_MODEL.md`, `PLAN_MATRIX.md`, `PRICING_PACKAGING.md`, `REVENUE_MODEL.md`, `LAND_AND_EXPAND.md` — all complete, accurate, and internally consistent. No documentation gaps found. | INFO | ✅ Verified | All billing and commercial documentation is production-quality |

### Phase 8: Support Operations

| ID | Finding | Severity | Status | Notes |
|----|---------|----------|--------|-------|
| SUP-001 | Status page at `/status` is described as "Planned — pre-GA" in `SUPPORT_OPERATIONS.md`. No live status page exists. Customers experiencing incidents have no self-service visibility into platform status, increasing support ticket volume during outages. | P1 | ⚠️ Open | `STATUSPAGE_PLAN.md` defines the plan (Betterstack / Instatus recommended). Must be live before first enterprise pilot. |
| SUP-002 | `SUPPORT_OPERATIONS.md`, `INCIDENT_COMMAND_PLAYBOOK.md`, `SEVERITY_MODEL.md`, `STATUSPAGE_PLAN.md`, `CUSTOMER_ESCALATION_MATRIX.md`, `RUNBOOK_COMMON_FAILURES.md`, `SUPPORT_HANDOFF_GUIDE.md` — all complete, operationally sound, and mutually consistent. | INFO | ✅ Verified | Support operations documentation is production-quality |

### Phase 9: Release Safety

| ID | Finding | Severity | Status | Notes |
|----|---------|----------|--------|-------|
| REL-001 | `RELEASE_CHECKLIST.md` header contains `Related: RELEASE-CHECKLIST.md` (dash format) — a stale self-referential doc link. Minor doc hygiene issue; no functional impact. | P3 | ⚠️ Open | Fix header to reference correct companion docs (`RELEASE_INTELLIGENCE.md`, `ROLLBACK_PLAYBOOK.md`, etc.) |
| REL-002 | `RELEASE_CHECKLIST.md`, `DEPLOYMENT-GUIDE.md`, `ENVIRONMENT_VALIDATION.md`, `ROLLBACK_PLAYBOOK.md`, `LAUNCH_DAY_RUNBOOK.md`, `GO_NO_GO_CHECKLIST.md` — all complete, actionable, and mutually consistent. `GO_NO_GO_CHECKLIST.md` is a real decision tool with clear binary pass/fail criteria per section, conditional blocker acceptance table, and named sign-off by Founder. | INFO | ✅ Verified | Release safety documentation is production-quality |
| REL-003 | CI pipeline is comprehensive: lint, typecheck, test, build, integration-test, codeql, dependency-review, e2e, lighthouse, and security workflows all present with SHA-pinned actions. Noted: `integration-test` job in `ci.yml` uses pnpm v9 / Node 20 while other jobs use pnpm v10 / Node 22 (CI-004 — existing finding). | INFO | ⚠️ CI-004 open | Align integration-test job with rest of CI matrix before GA |

---

## Cumulative Findings Summary

| Category | Total | Resolved | Open |
|----------|-------|----------|------|
| Security (SEC-) | 11 | 6 | 5 |
| Architecture (ARCH-) | 3 | 0 | 3 |
| API (API-) | 5 | 0 | 5 |
| Database (DB-) | 2 | 1 | 1 |
| CI/CD (CI-) | 5 | 3 | 2 |
| Observability (OBS-) | 8 | 0 | 8 |
| Data / Mocks (DATA-) | 9 | 0 | 9 |
| Documentation (DOC-) | 4 | 0 | 4 |
| Operations (OPS-) | 8 | 0 | 8 |
| Quality (QUAL-) | 3 | 0 | 3 |
| Phase 2–3 Architecture/Auth/Tenancy (AF-) | 14 | 0 | 14 |
| Test Quality Phase 4–5 (AF-T) | 10 | 2 | 8 |
| Code Quality Phase 4–5 (AF-Q) | 3 | 0 | 3 |
| Flow Audit Phase 4–5 (AF-F) | 6 | 0 | 6 |
| Billing (BIL-) | 2 | 1 | 1 |
| Support (SUP-) | 2 | 1 | 1 |
| Release (REL-) | 3 | 2 | 1 |
| **Total** | **94** | **12** | **82** |

---

## Priority Next Actions

1. **Sprint 3 (Immediate):** SEC-007 (SSRF), CI-002 (CodeQL), CI-003 (dep-review), AF-T003–T005 (billing/webhook/admin tests), OBS-001 (OTEL), OBS-002 (Sentry), OPS-004 (CODEOWNERS), OBS-007 (PostHog), SUP-001 (Status page), BIL-001 (Stripe live keys)
2. **Sprint 4:** AF-T007–T009 (mobile E2E, policy/proof tests, WebSocket isolation), OBS-005 (SLO), OPS-006 (Lighthouse), DOC-001 (TRUST_CENTER_INDEX fix), OBS-006 (unified prod observability doc), OBS-008 (collector live data)
3. **Pre-launch blockers:** See LAUNCH_BLOCKERS.md for the authoritative list

---

*Related: `KNOWN-GAPS.md` · `OUT_OF_SCOPE_REGISTER.md` · `docs/audit/series-a-gap-register.md` · `SECURITY-CHECKLIST.md` · `TEST_STRATEGY.md` · `FLOW_AUDIT_MATRIX.md`*

## Phase 2–3 Audit Findings (AF-) — Detailed Notes

### AF-001: `adminGuard` Uses Non-Timing-Safe Token Comparison

| Field | Value |
|-------|-------|
| **ID** | AF-001 |
| **Severity** | P1 — High |
| **Area** | Auth / Internal Token Security |
| **File** | `artifacts/api-server/src/middlewares/admin-guard.ts` |
| **Lines** | ~25–29 |
| **Status** | ⚠️ Open |

**Finding:**
The `adminGuard` middleware compares the `x-internal-token` header using `Buffer.equals()` rather than `crypto.timingSafeEqual`. This is inconsistent with the fix applied in `auth.ts` (SEC-004, resolved Apr-2026) and is theoretically vulnerable to timing attacks.

```typescript
// admin-guard.ts — current (NOT timing-safe)
return header.length === internalSecret.length &&
  Buffer.from(header).equals(Buffer.from(internalSecret));

// auth.ts — correct pattern
return timingSafeEqual(a, b);
```

**Recommendation:** Replace `Buffer.equals()` with `crypto.timingSafeEqual` in `adminGuard`, matching the pattern in `auth.ts`.

---

### AF-003: Vessels Fleet Routes Lack Tenant Scope Filtering

| Field | Value |
|-------|-------|
| **ID** | AF-003 |
| **Severity** | P1 — High |
| **Area** | Tenancy / Multi-tenant Data Isolation |
| **File** | `artifacts/api-server/src/routes/vessels.ts` |
| **Status** | ⚠️ Open |

**Finding:**
`GET /vessels/fleets` and `GET /vessels/fleets/:id` use `authMiddleware()` for authentication but perform no tenant-scoped filtering. The query returns **all fleets** from the `vessels_fleets` table (compounded by AF-007: the table has no `org_id` column).

**Impact:** Any authenticated user can view all fleets belonging to any tenant.

**Recommendation:** Add `org_id` to `vessels_fleets` and add tenant-scoped filtering in route handlers, or designate these as platform-global reference data with explicit documentation.

---

### AF-007: `vessels.*` Tables Missing `org_id` Column

| Field | Value |
|-------|-------|
| **ID** | AF-007 |
| **Severity** | P1 — High |
| **Area** | Tenancy / DB Schema |
| **File** | `lib/db/src/schema/vessels.ts` |
| **Status** | ⚠️ Open |

**Finding:**
The original vessels product schema defines `vessels_fleets`, `vessels`, `vessels_positions`, `vessels_cargo`, `vessels_routes`, `vessels_alert_rules`, `vessels_alerts`, and `vessels_simulations` without `org_id` columns. A newer, parallel schema (`maritime.ts`) exists with proper `org_id` scoping on all tables.

**Recommendation:** Designate `maritime.ts` as the authoritative vessel schema. Add a migration to add `org_id` to the `vessels.*` tables. Deprecate the old schema.

---

### AF-004: Backup Export Lacks `orgId` Authority Validation

| Field | Value |
|-------|-------|
| **ID** | AF-004 |
| **Severity** | P2 — Medium |
| **Area** | Admin / Privileged Data Access |
| **File** | `artifacts/api-server/src/routes/backup.ts` |
| **Status** | ⚠️ Open |

**Finding:** `POST /admin/backup/export-tenant` accepts `orgId` in the request body without validating that the requesting admin has authority over that specific org. Any `admin`-role user could export data from any org by specifying an arbitrary `orgId`.

**Recommendation:** Validate `orgId` authority, or restrict to `founder_admin` / `platform_admin` roles only.

---

### AF-008: `conversations` Table Missing `org_id`

| Field | Value |
|-------|-------|
| **ID** | AF-008 |
| **Severity** | P2 — Medium |
| **Area** | Tenancy / DB Schema |
| **File** | `lib/db/src/schema/conversations.ts` |
| **Status** | ⚠️ Open |

**Finding:** The AI chat history `conversations` table has no `org_id` column — conversations from different tenants share the same table without isolation.

**Recommendation:** Add `org_id` and `user_id` foreign keys to `conversations`.

---

### AF-010: Sessions Not Revoked on Role Change

| Field | Value |
|-------|-------|
| **ID** | AF-010 |
| **Severity** | P2 — Medium |
| **Area** | Auth / Session Lifecycle |
| **Status** | ⚠️ Open |

**Finding:** When a user's role is changed or revoked, active sessions remain valid for up to 30 days (credential login TTL).

**Recommendation:** Invalidate all active sessions for a user when their role changes. Or re-validate roles from DB on each request instead of trusting session-cached roles.

---

### AF-012: No Session Invalidation on `SESSION_SECRET` Rotation

| Field | Value |
|-------|-------|
| **ID** | AF-012 |
| **Severity** | P2 — Medium |
| **Area** | Auth / Session Security |
| **Status** | ⚠️ Open |

**Finding:** Rotating `SESSION_SECRET` does not invalidate existing sessions. Sessions signed with the old secret remain valid until they expire naturally.

**Recommendation:** Implement a session version counter; increment on rotation to force re-authentication.

---

### AF-013: Divergent Internal Token Verification Patterns

| Field | Value |
|-------|-------|
| **ID** | AF-013 |
| **Severity** | P2 — Medium |
| **Area** | Architecture / Code Consistency |
| **Files** | `middlewares/admin-guard.ts` · `middlewares/auth.ts` |
| **Status** | ⚠️ Open |

**Finding:** `auth.ts` uses `crypto.timingSafeEqual`; `admin-guard.ts` uses `Buffer.equals()`. The same token is verified two different ways across two middlewares.

**Recommendation:** Extract `checkInternalToken()` to a shared utility (`lib/internal-token.ts`) used by both middlewares.

---

### AF-014: No ORM-Layer Cross-Tenant Query Guard

| Field | Value |
|-------|-------|
| **ID** | AF-014 |
| **Severity** | P2 — Medium |
| **Area** | Tenancy / Defense in Depth |
| **Status** | ⚠️ Open |

**Finding:** Tenant isolation relies entirely on route-handler-level enforcement. There is no ORM-level guard that catches a developer accidentally writing a cross-tenant query.

**Recommendation:** Add a custom ESLint rule flagging Drizzle queries on org-scoped tables that lack a `WHERE org_id = ?` predicate, or create typesafe query builder wrappers that inject `org_id` automatically.

---

## Phase 2–3 Audit Action Items

Priority order for remediation:

1. **AF-001** — Fix `adminGuard` to use `timingSafeEqual` (30 min)
2. **AF-003 + AF-007** — Vessel schema tenancy: designate authoritative schema, add `org_id` migration (estimated: 2–3 days)
3. **AF-013** — Extract token verification to shared utility (1 hour)
4. **AF-004** — Validate `orgId` authorization on backup export (1 hour)
5. **AF-010 + AF-012** — Session invalidation hardening (1–2 days)
6. **AF-008** — Add `org_id` to `conversations` (1 hour + migration)
7. **AF-014** — ORM-layer cross-tenant query guard / ESLint rule (2–3 days)

---

*Related: `KNOWN-GAPS.md` · `OUT_OF_SCOPE_REGISTER.md` · `docs/audit/series-a-gap-register.md` · `SECURITY-CHECKLIST.md` · `CONTROL_PLANE_ARCHITECTURE.md`*

*Last audited: 2026-04-16. Route files audited: representative sample across core, billing, admin, backup, vessels, and middleware layers. For complete route coverage, reference ROUTE_INVENTORY.md.*
