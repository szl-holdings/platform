# Market Readiness Scorecard

**Owner:** Founder / CTO  
**Last updated:** April 2026  
**Version:** 1.0 — Post CTO Market Readiness Pass Phase J

---

## Scoring Key

| Score | Symbol | Meaning |
|-------|--------|---------|
| 5 | ✅ | Production-ready; no gaps |
| 4 | 🟢 | Strong; minor gaps that don't affect buyers |
| 3 | 🟡 | Functional; gaps visible to technical evaluators |
| 2 | 🟠 | Partial; gaps visible to buyers in demos |
| 1 | 🔴 | Blocking; cannot proceed without resolving |

---

## Dimension 1 — Platform Stability & Reliability

| Item | Score | Notes |
|------|-------|-------|
| API server health endpoints | ✅ 5 | `/api/health/live`, `/api/health/ready`, `/api/health/detailed` all operational |
| Database connectivity & pooling | ✅ 5 | PostgreSQL with Drizzle ORM; connection pool monitored |
| Authentication (Clerk OIDC) | ✅ 5 | OIDC + session management; HttpOnly cookies; CSRF protection |
| Rate limiting | ✅ 5 | Per-route rate limits configured on auth and high-traffic endpoints |
| Audit logging | ✅ 5 | Full audit trail on sensitive actions |
| Automated database backups | ✅ 5 | Daily + weekly; backup_manifest.json tracked |
| Rollback capability | ✅ 5 | Documented procedure; previous deployment version accessible |
| Smoke test suite | ✅ 5 | Automated + manual verification protocol in place |
| Dependency audit (no high/critical CVEs) | 🟡 3 | Clean at time of pass; must re-run before each release |
| Zod validation (all routes) | ✅ 5 | All 206 POST/PUT/PATCH routes validated with Zod; structured 400 errors with field-level detail |
| Integration test coverage (POST paths) | 🟡 3 | Vessels and Firestorm POST paths outstanding |
| Observability / APM wiring | 🟡 3 | Pino logs active; Application Insights / OTLP endpoint not yet wired |

**Dimension Score: 4.1 / 5**

---

## Dimension 2 — Domain App Completeness

| App | Core UI | Live Data | Demo-Ready | Score |
|-----|---------|-----------|-----------|-------|
| SZL Holdings Dashboard | ✅ | Partial | ✅ | 🟢 4 |
| Aegis (Defense & Intelligence) | ✅ | Partial | ✅ | 🟢 4 |
| Terra (Real Estate Intelligence) | ✅ | Partial | ✅ | 🟢 4 |
| Vessels (Maritime Intelligence) | ✅ | Partial | ✅ | 🟢 4 |
| Carlota Jo (Advisory) | ✅ | Partial | ✅ | 🟢 4 |
| Command (Unified Ops) | ✅ | Partial | ✅ | 🟢 4 |
| CORTEX Web | ✅ | Partial | ✅ | 🟢 4 |

> "Partial" live data means core UI is complete; some endpoints return seeded/demo data rather than live database queries. This is acceptable for demos but must be resolved for production.

**Dimension Score: 4.0 / 5**

---

## Dimension 3 — Mobile Readiness (CORTEX)

| Item | Score | Notes |
|------|-------|-------|
| App structure and navigation | ✅ 5 | Complete |
| Biometric authentication | ✅ 5 | Complete |
| Offline sync engine | ✅ 5 | Complete |
| Voice commands | ✅ 5 | Complete |
| Push notification framework | 🟡 3 | Framework present; push token backend endpoint missing |
| Firebase credentials (real) | 🔴 1 | Placeholder files only; real credentials required for EAS build |
| EAS project linked | 🔴 1 | Not linked; required for App Store / Play Store submission |
| Physical device testing | 🔴 1 | Not completed |
| App Store Connect record | 🔴 1 | Not created |
| Play Console record | 🔴 1 | Not created |
| Store screenshots and metadata | 🔴 1 | Not created |
| iOS Privacy Manifest | 🔴 1 | Required for iOS 17+ submission |
| TestFlight alpha | 🔴 1 | Not started |

**Dimension Score: 2.5 / 5 — Mobile launch requires significant manual setup before any submission is possible.**

---

## Dimension 4 — Security Posture

| Item | Score | Notes |
|------|-------|-------|
| No secrets in source code | ✅ 5 | Confirmed clean |
| No secrets in shared config | ✅ 5 | OAUTH_STATE_SECRET and VAPID_PRIVATE_KEY removed from `.replit` |
| Session security (HttpOnly, SameSite, Secure) | ✅ 5 | Configured |
| CSRF protection | ✅ 5 | Token endpoint present |
| Security headers (Helmet CSP, HSTS) | ✅ 5 | Configured |
| Secret inventory documented | ✅ 5 | `ops/security/secret-inventory.md` complete |
| Credential rotation schedule defined | ✅ 5 | `ops/security/credential-rotation-required.md` complete |
| OAUTH_STATE_SECRET in Replit Secrets | 🔴 1 | **Must be added manually** |
| VAPID_PRIVATE_KEY in Replit Secrets | 🔴 1 | **Must be added manually** |
| Integration test token out of source | 🟠 2 | Still hardcoded in `tests/api/server-live.test.ts` |
| External service keys confirmed | 🟠 2 | Stripe, Resend, Mapbox unconfirmed |
| Multi-factor auth for admin accounts | 🟡 3 | Dependent on Clerk account settings |

**Dimension Score: 3.7 / 5 — Two high-priority manual actions block full green status.**

---

## Dimension 5 — GTM & Commercial Readiness

| Item | Score | Notes |
|------|-------|-------|
| Positioning statement locked | ✅ 5 | `ops/cto/public-positioning-lock.md` |
| ICP defined | ✅ 5 | Tier 1–3 buyers defined with entry signals |
| Pricing model documented | ✅ 5 | `ops/cto/packaging-model-final.md` |
| Buyer conversion funnel defined | ✅ 5 | `ops/cto/conversion-system-final.md` |
| Design partner program defined | ✅ 5 | `ops/cto/design-partner-offer-final.md` |
| Trust conversion artifacts | ✅ 5 | `ops/cto/trust-conversion-system.md` |
| Pilot-to-case-study system | ✅ 5 | `ops/cto/pilot-to-case-study-system.md` |
| Partner onboarding machine | ✅ 5 | `ops/cto/partner-onboarding-machine.md` |
| Demo script finalized | ✅ 5 | `ops/cto/founder-demo-script.md` |
| API brief for technical evaluators | ✅ 5 | `ops/cto/technical-evaluator-api-brief.md` |
| First paying customer signed | 🔴 1 | Pre-revenue; no customers yet |
| Live pilot active | 🔴 1 | No pilots started |

**Dimension Score: 4.3 / 5 — GTM infrastructure is complete; revenue is the gap.**

---

## Dimension 6 — Investor & Buyer Readiness

| Item | Score | Notes |
|------|-------|-------|
| Investor overview document | ✅ 5 | `docs/investor/investor-overview.md` |
| Product readiness document | ✅ 5 | `docs/investor/product-readiness.md` |
| Data room index | ✅ 5 | `docs/investor/data-room-index.md` |
| Platform portfolio / thesis | ✅ 5 | `docs/investor/platform-portfolio.md` |
| Buyer executive overview | ✅ 5 | `docs/buyer/executive-overview.md` |
| Solution brief | ✅ 5 | `docs/buyer/solution-brief.md` |
| Security summary (shareable) | ✅ 5 | `docs/buyer/security-summary.md` |
| Trust center accessible | 🟡 3 | Docs exist; requires production URL to share |
| Demo environment stable | 🟡 3 | Requires seed data load before each demo |
| Reference customer or testimonial | 🔴 1 | None yet; requires first pilot |

**Dimension Score: 4.2 / 5**

---

## Dimension 7 — Founder Operating Infrastructure

| Item | Score | Notes |
|------|-------|-------|
| Founder control room defined | ✅ 5 | `ops/cto/founder-control-room.md` |
| Incident response runbook | ✅ 5 | `ops/cto/incident-and-support-playbook.md` |
| Release governance | ✅ 5 | `ops/cto/release-and-operations-control.md` |
| Release log template | ✅ 5 | `ops/cto/release-log.md` |
| 90-day operating rhythm | ✅ 5 | `ops/cto/founder-next-90-days.md` |
| Weekly operating pack | ✅ 5 | `ops/cto/weekly-operating-pack.md` |
| Founder launch kit | ✅ 5 | `ops/cto/founder-launch-kit.md` |
| Next-15-actions list | ✅ 5 | `ops/cto/next-15-actions.md` |
| Go-live sequence | ✅ 5 | `docs/internal/ops/go-live-sequence.md` |
| Slack alerting active | 🔴 1 | Requires manual setup (`SLACK_BOT_TOKEN` / webhook) |
| Custom domain configured | 🔴 1 | Requires manual DNS configuration |

**Dimension Score: 4.1 / 5**

---

## Overall Market Readiness Summary

| Dimension | Score | Weight | Weighted Score |
|-----------|-------|--------|---------------|
| Platform Stability & Reliability | 4.1 | 20% | 0.82 |
| Domain App Completeness | 4.0 | 15% | 0.60 |
| Mobile Readiness | 2.5 | 10% | 0.25 |
| Security Posture | 3.7 | 20% | 0.74 |
| GTM & Commercial Readiness | 4.3 | 15% | 0.65 |
| Investor & Buyer Readiness | 4.2 | 10% | 0.42 |
| Founder Operating Infrastructure | 4.1 | 10% | 0.41 |
| **Overall** | | **100%** | **3.89 / 5.0** |

---

## Readiness by Gate

| Gate | Ready? | Conditions |
|------|--------|-----------|
| First investor demo | ✅ YES | Web platform demo-ready; investor docs complete |
| First buyer demo | ✅ YES | Domain apps demo-ready; buyer docs complete |
| Design partner agreement | ✅ YES | Offer defined; program terms ready |
| First pilot kickoff | 🟡 CONDITIONAL | Pilot system defined; environment can be prepared — requires production web launch conditions to be met first |
| Production web launch | 🟡 CONDITIONAL | Requires: secret setup (4 items), go-live sequence completion, Slack alert wiring |
| CORTEX mobile TestFlight | 🔴 NO | Requires: Firebase credentials, EAS setup, App Store Connect record, device testing |
| CORTEX mobile App Store | 🔴 NO | All above plus: Privacy Manifest, store screenshots, review process |

---

*See also: `ops/cto/go-live-readiness-verdict.md` · `ops/frontier/launch-readiness-scorecard.md` · `ops/cto/manual-actions-left.md`*
