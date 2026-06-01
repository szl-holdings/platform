# SZL Holdings — Go / No-Go Launch Checklist

**Date:** 2026-04-16  
**Owner:** Stephen Lutar (Founder)  
**Audience:** Launch team, engineering lead, legal counsel, investors  
**Scope:** Decision framework for public launch authorization

This checklist is the final gate before any external user accesses the SZL Holdings platform in a public or semi-public launch context. It synthesizes the full launch readiness posture into a single decision document.

**How to use:** Complete each section in order. All mandatory items must be resolved or formally accepted before the final GO decision. Document the outcome in the sign-off section.

---

## Section 1 — Security Gates (All Mandatory)

| # | Item | Status | Notes |
|---|------|--------|-------|
| S1 | All P0 security gaps are confirmed resolved | ☐ | See KNOWN-GAPS.md — all confirmed Apr 2026 |
| S2 | Firebase / Google credential rotation confirmed complete | ⚠️ | LB-001 — git history verified clean Apr-2026 (only `PLACEHOLDER_*` values in committed `google-services.json`); operator must still rotate the live Firebase Web API key in the Firebase Console and tick this box |
| S3 | No live secrets in committed source code | ☑ | Verified Apr-2026 via Task #1034: `git log --all --full-history -- '**/.env' '**/.env.local' '**/.env.production' '**/.env.prod'` returns 0 commits; `git ls-files` shows only `.env.example` templates; no Firebase admin SDK or service-account JSON in history |
| S4 | Production `SESSION_SECRET` is environment-specific (≥32 chars) | ☐ | Must not match any dev value |
| S5 | Production `SECRET_ENCRYPTION_KEY` set independently | ☐ | Must not match `SESSION_SECRET` |
| S6 | `CORS_ORIGINS` set to production domains only (not `*`) | ☐ | |
| S7 | Stripe is using live keys (`sk_live_...`) if billing is active | ☐ | N/A if not charging at launch |
| S8 | `ADMIN_PIN` set in production and matches a hash | ☐ | |
| S9 | All private routes require authentication (spot-check 5 routes) | ☐ | See ACCESS-CONTROL-MATRIX.md |
| S10 | Webhook SSRF validation status accepted or resolved | ☐ | LC-004 conditional blocker |

**Section verdict:** ☐ GO — all items confirmed  |  ☐ NO-GO — unresolved items above

---

## Section 2 — Infrastructure & Reliability (All Mandatory)

| # | Item | Status | Notes |
|---|------|--------|-------|
| I1 | Production database is separate from development | ☐ | LB-004 — separate `DATABASE_URL` confirmed |
| I2 | Production database has no demo/seed data | ☐ | Verify with DB query |
| I3 | All migrations run cleanly on production database | ☐ | Run `pnpm --filter artifacts/api-server db:migrate` |
| I4 | `GET /api/health` returns 200 from production URL | ☐ | `curl https://<prod-url>/api/health` |
| I5 | `GET /api/health/detailed` returns healthy with auth token | ☐ | Check DB pool, job queue, AI providers |
| I6 | External uptime monitoring active on production health endpoint | ☐ | LB-002 — configure before launch |
| I7 | Error tracking (Sentry or equivalent) capturing exceptions in production | ☐ | LB-003 — configure before launch |
| I8 | OpenTelemetry exporter wired to production OTLP backend | ☐ | LB-006 — KG009 |
| I9 | All workflows / services started and healthy in production | ☐ | API server, all frontends |
| I10 | No JavaScript console errors on public landing page | ☐ | Test in incognito Chrome |
| I11 | Authentication flow tested end-to-end in production | ☐ | Login → dashboard → logout |
| I12 | Contact form submission verified (submission reaches inbox) | ☐ | Test in production |

**Section verdict:** ☐ GO — all items confirmed  |  ☐ NO-GO — unresolved items above

---

## Section 3 — Code Quality (All Mandatory)

| # | Item | Status | Notes |
|---|------|--------|-------|
| Q1 | `pnpm typecheck` passes with no errors | ☐ | |
| Q2 | `pnpm lint` passes with no errors | ☐ | |
| Q3 | `pnpm -r build` succeeds for all artifacts | ☐ | |
| Q4 | Integration smoke tests pass (`node scripts/qa/smoke-routes.js`) | ☐ | |
| Q5 | No `TODO` or `FIXME` comments in production-critical paths | ☐ | |

**Section verdict:** ☐ GO — all items confirmed  |  ☐ NO-GO — unresolved items above

---

## Section 4 — Rollback Readiness (All Mandatory)

| # | Item | Status | Notes |
|---|------|--------|-------|
| R1 | Rollback procedure reviewed by on-call owner | ☐ | See DEPLOYMENT-GUIDE.md § Rollback |
| R2 | Production database backup taken before launch | ☐ | Store securely, document location |
| R3 | Previous deployment state documented | ☐ | Which version is current |
| R4 | Rollback decision criteria understood by on-call owner | ☐ | If deployed <2h ago and broken → rollback first |
| R5 | Rollback can be completed in < 15 minutes (tested in staging) | ☐ | |

**Section verdict:** ☐ GO — all items confirmed  |  ☐ NO-GO — unresolved items above

---

## Section 5 — Legal, Trust, and Commercial (Mandatory If Applicable)

| # | Item | Applicable? | Status | Notes |
|---|------|------------|--------|-------|
| L1 | Privacy Policy reviewed by qualified legal counsel | ✅ | ☐ | Required before external users accept |
| L2 | Terms of Service reviewed by qualified legal counsel | ✅ | ☐ | Required before external users accept |
| L3 | Privacy Policy and ToS accessible at `/legal/privacy` and `/legal/terms` | ✅ | ☐ | |
| L4 | Design-partner / pilot agreements reviewed by counsel | ✅ | ☐ | Before any commercial engagement |
| L5 | No fabricated customer logos, testimonials, or traction data in public materials | ✅ | ☐ | Review all public-facing copy |
| L6 | Stripe live keys and payment terms in place | If charging | ☐ | N/A if not charging at launch |
| L7 | Tax/VAT configuration reviewed by accountant | If charging | ☐ | N/A if domestic-only and pre-revenue |
| L8 | Trust Center content reviewed for accuracy | ✅ | ☐ | No outdated model references |
| L9 | `security@szlholdings.com` monitored with 48h acknowledgement SLA | ✅ | ☐ | |

**Note:** Items in this section require human judgment from legal counsel, finance advisors, and the Founder. Engineering cannot sign off on legal and commercial items.

**Section verdict:** ☐ GO — all items confirmed  |  ☐ NO-GO — unresolved items above  |  ☐ Items accepted with documented risk

---

## Section 6A — GTM, Docs & Sales Readiness (All Mandatory for Design-Partner Launch)

| # | Item | Status | Notes |
|---|------|--------|-------|
| G1 | Public docs available: Getting Started, Admin Guide, End User Guide, Operator Guide, FAQ, Troubleshooting | ☑ | GETTING_STARTED.md, ADMIN_SETUP_GUIDE.md, END_USER_GUIDE.md, OPERATOR_GUIDE.md, FAQ.md, TROUBLESHOOTING_GUIDE.md — all complete Apr 2026 |
| G2 | Product Overview and Feature Overview complete | ☑ | PRODUCT_OVERVIEW.md, FEATURE_OVERVIEW.md — complete Apr 2026 |
| G3 | Launch messaging house defined | ☑ | LAUNCH_MESSAGE_HOUSE.md — complete Apr 2026 |
| G4 | Website copy refresh aligned with launch messaging | ☑ | WEBSITE_COPY_REFRESH.md — complete Apr 2026 |
| G5 | Demo strategy documented for all three audiences (exec, operator, technical) | ☑ | DEMO_STRATEGY.md, EXECUTIVE_DEMO.md, OPERATOR_DEMO.md, TECHNICAL_DEMO.md — complete |
| G6 | Design partner program defined with terms and pricing | ☑ | DESIGN_PARTNER_PROGRAM.md — complete |
| G7 | Go-to-market motion documented | ☑ | GO_TO_MARKET_MOTION.md — complete |
| G8 | Sales handoff guide complete | ☑ | SALES_HANDOFF_GUIDE.md — complete Apr 2026 |
| G9 | Customer success playbook complete | ☑ | CUSTOMER_SUCCESS_PLAYBOOK.md — complete Apr 2026 |
| G10 | Proof-of-value and land-and-expand playbooks documented | ☑ | PROOF_OF_VALUE_PLAYBOOK.md, LAND_AND_EXPAND.md — complete |
| G11 | ROI model documented | ☑ | ROI_MODEL.md — complete |
| G12 | Enterprise deal design documented | ☑ | ENTERPRISE_DEAL_DESIGN.md — complete |
| G13 | Investor narrative updated and complete | ☑ | INVESTOR_NARRATIVE.md — current Apr 2026 |
| G14 | Green-light diligence review complete (6 perspectives) | ☑ | GREEN_LIGHT_REVIEW.md — complete Apr 2026 |
| G15 | At least one design partner in active conversation | ☐ | NOT YET — first design partner signing is the next milestone |

**Section verdict:** ⚠️ CONDITIONAL GO — all docs and strategy complete; no signed design partners yet

---

## Section 6 — Support and Operations (All Mandatory)

| # | Item | Status | Notes |
|---|------|--------|-------|
| O1 | `stephen@szlholdings.com` monitored and staffed | ☐ | |
| O2 | On-call owner designated for first 72 hours post-launch | ☐ | |
| O3 | INCIDENT_RESPONSE.md reviewed by on-call team | ☐ | |
| O4 | SEV1 escalation contact confirmed (stephen@szlholdings.com) | ☐ | |
| O5 | Launch-day communication channel active (Slack or equivalent) | ☐ | |
| O6 | Monitoring dashboard accessible to on-call owner | ☐ | |

**Section verdict:** ☐ GO — all items confirmed  |  ☐ NO-GO — unresolved items above

---

## Section 7 — Conditional Blockers (Founder Accept or Resolve)

For each conditional blocker not resolved before launch, the Founder must formally accept the associated risk in writing.

| Blocker | Resolution | Accepted? | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| LC-001 No CI/CD secret scanning | Resolve or accept | ☐ | | |
| LC-002 No CodeQL SAST | Resolve or accept | ☐ | | |
| LC-003 No automated dep vulnerability scan | Resolve or accept | ☐ | | |
| LC-004 Webhook SSRF not validated | Resolve or accept | ☐ | | |
| LC-005 MFA not implemented | Accept — enterprise tier roadmap | ☐ | | |
| LC-006 Bundle sizes > 500 KB | Resolve or accept | ☐ | | |

---

## Final Go / No-Go Decision

### Decision Rules

| Decision | Conditions |
|----------|-----------|
| **GO** | All mandatory sections complete. Conditional blockers resolved or formally accepted. Legal/commercial items signed off by counsel/Founder. |
| **CONDITIONAL GO** | All mandatory sections complete. One or more conditional blockers accepted with documented risk. Timeline set for post-launch resolution. |
| **NO-GO** | Any mandatory item in Sections 1–6 is unresolved. |
| **DEFER** | An external dependency (legal review, credential access, infra provisioning) prevents resolution — set a target date. |

### Decision Record

**Launch target date:** _______________________

**Sections 1–6 verdict:** ☐ All GO  |  ☐ One or more NO-GO (see above)

**Conditional blocker disposition:** ☐ All resolved  |  ☐ Accepted with documented risk

**Final decision:** ☐ GO  |  ☐ CONDITIONAL GO  |  ☐ NO-GO  |  ☐ DEFER

**Decision rationale:** _______________________________________________

**Decision made by:** Stephen Lutar

**Signature / Date:** _________________________ · ___________________

---

## Post-Launch Monitoring (First 72 Hours)

After GO decision, the on-call owner must monitor the following for 72 hours:

| Monitor | Check Interval | Alert Threshold |
|---------|---------------|-----------------|
| `GET /api/health` | Every 5 minutes (automated) | Any 503 → immediate SEV1 |
| Error rate (Sentry or App Insights) | Every 30 minutes | Error rate > 1% → SEV2 |
| P95 latency | Every 30 minutes | > 2 seconds sustained → SEV2 |
| Contact form submissions | Every 4 hours | Verify delivery |
| User authentication issues | Real-time | Any auth failure reported → immediate |

---

*Related: [LAUNCH_BLOCKERS.md](launch-blockers.md) · [PUBLIC_LAUNCH_READINESS.md](public-launch-readiness.md) · [OPERATIONAL_READINESS_SCORECARD.md](operational-readiness-scorecard.md) · [DEPLOYMENT-GUIDE.md](../operations/deployment-guide.md) · [INCIDENT_RESPONSE.md](../operations/incident-response.md)*

*Last reviewed: 2026-04-16*
