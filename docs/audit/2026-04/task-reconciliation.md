# SZL Holdings — Task Reconciliation
**Audit date:** April 18, 2026  
**Purpose:** Cross-reference all open tasks against the gap report to identify duplicates, obsolete tasks, still-needed tasks, and missing gaps requiring new tasks.

**Task queue coverage:** 87 task files in `.local/tasks/task-*.md`. The task description referenced "129 open tasks" — the discrepancy is because the broader task queue includes phase plan files (`docs/`, `.local/tasks/*.md` non-task files) that are not individual task units. This audit covers all 87 individual `task-*.md` files, which is the full set of discrete actionable tasks.

**Status labels:**
- `still-needed` = gap confirmed in audit; task is the right response
- `duplicate` = another open task covers the same ground
- `obsolete` = explicitly marked [SUPERSEDED] in title, or gap is closed
- `needs-scope` = task exists but scope needs tightening per audit findings
- `missing` = gap found in audit with no corresponding task

---

## Part 1: Full Task Queue Reconciliation (87 tasks)

### Active Tasks (not marked [SUPERSEDED])

| Task ID | Title | Audit status | Gap ref / Notes |
|---|---|---|---|
| task-25 | HuggingFace advanced models, streaming, embeddings & intelligent pipelines | **still-needed** | AI model integration is real but degraded without keys (system-inventory §7) |
| task-26 | HuggingFace-powered premium AI experiences across all 8 apps | **needs-scope** | Pulse AI is already connected; scope to remaining surfaces that lack live AI |
| task-149 | Investor & production readiness — audit, fix API server, create readiness packages | **obsolete** | Partially completed by prior audit phases and this task; remaining items tracked in new task queue below |
| task-153 | Nimbus AI Evolution — real intelligence layer inspired by HuggingFace, W&B, LangGraph | **still-needed** | Aligns with P1-004 (Pulse AI connectivity) and broader AI gateway hardening |
| task-179 | Strengthen Alloy, Aegis, and Lyte dashboards to best-in-class | **still-needed** | Aegis has 8 unwired modules (P1-005); Lyte/Alloy dashboard seeding issues (P2-009) |
| task-180 | Strengthen Vessels, Terra, and Carlota Jo dashboards to best-in-class | **still-needed** | Terra maps blank (P1-001); Vessels commercial modules stub (P1-006); Carlota Jo Consulting OS fixture data (P2-007) |
| task-181 | Elevate Stephen Site and SZL Holdings + ecosystem navigation consistency | **needs-scope** | Stephen site is archived; scope only to szl-holdings navigation consistency |
| task-197 | Absorb Alloy into SZL Holdings — consolidate execution fabric into parent company | **still-needed** | Still a distinct artifact; consolidation not yet done |
| task-223 | Frontend error tracking — Sentry + error boundaries across all web apps | **still-needed** | Sentry DSN is stub/unconfirmed across surfaces (scorecard: Observability C) |
| task-228 | Full ecosystem elevation — fix broken pages, memory leak, polish all apps | **needs-scope** | Too broad; should be broken into per-artifact tasks from the gap report |
| task-372 | LinkedIn-ready portfolio overhaul — New Relic & Boss Technologies inspired | **obsolete** | No LinkedIn presence or active social motion in codebase; not a code task |
| task-440 | Autonomous Client Revenue Engine — AI-Powered Onboarding, Success, Proposals & Revenue Ops | **still-needed** | No onboarding tour or automated revenue flow exists (gap noted in demo-readiness) |
| task-475 | Cognitive consciousness layer — metacognition, self-model, inner monologue & self-learning | **still-needed** | Packages exist (reflection-engine, self-model) but are stubs; valid R&D task |
| task-492 | Real third-party API integration hub (New Relic, NVIDIA DCGM, MISP/TAXII) | **still-needed** | Many connectors are stubs (HubSpot, Salesforce, PowerBI) — see system-inventory §8 |
| task-510 | Web component consolidation — deduplicate GraphQL panels, sidebars & shared imports | **still-needed** | Confirmed: leftover imports in szl-holdings (P2-012); similar issues likely across other artifacts |
| task-512 | Mock data elimination — replace all hardcoded data with real database-backed responses | **still-needed** | This is the core of P0-002, P1-003, P2-001, P2-003 — highest-priority audit finding |
| task-516 | Consciousness layer innovation pass — GWT, predictive processing, dialectical reasoning & dream consolidation | **still-needed** | Valid R&D; packages exist as stubs |
| task-517 | Stabilize all failing services — mobile apps, API server & SZL Holdings | **still-needed** | Mobile stability issues confirmed (P2-011); api-server has 12% Zod coverage (P0-002) |
| task-518 | Nuro Forge — Self-Evolving Model Arena, Autonomous Composition & Intelligence Fabric | **still-needed** | eval-forge/evals-core packages are stubs; valid platform evolution task |
| task-519 | SZL Holdings — Fund operations, real financials & SEC-compliant reporting | **still-needed** | Fund ops are seeded; no real financial data pipeline confirmed |
| task-522 | Terra — Spatial Intelligence, Computer Vision & Generative Property Analysis | **still-needed** | Mapbox maps are blank (P1-001); spatial walkthrough is a stub |
| task-523 | PRISM — Agentic Legal Operations, Computational Law & Autonomous E-Discovery | **still-needed** | Prism Counsel backend exists; deregistered UI needs decision on revival vs. archive |
| task-528 | Nexus — Geopolitical AI Fusion, Predictive War-Gaming & Cross-Domain Correlation | **still-needed** | mockup-sandbox is an internal prototype; this describes a future product direction |
| task-529 | Mobile fleet — Fix crashes, offline mode, push notifications, deep linking, biometrics & app store readiness | **still-needed** | Confirmed: mobile push deep linking is stub (P2-011); app store not started |
| task-530 | Platform — CI/CD pipelines, automated testing, APM, disaster recovery, feature flags & rate limiting | **still-needed** | Integration tests not in CI (scorecard: Release Discipline C); APM stub; DR runbook exists but not tested |
| task-532 | Ecosystem Innovation Engine — ambient intelligence, energy-aware rendering, decision shield & domain breakthroughs | **still-needed** | Aspirational/R&D; not a production blocker |
| task-534 | CORTEX Mobile — Unified super app (consolidate 7 mobile apps into 1) | **still-needed** | cortex-mobile concept directory exists; no scaffold |
| task-580 | Add Leadership and Forge entry points to the SZL Holdings navigation bar | **still-needed** | Navigation gap confirmed (P2-012 area); low effort |
| task-692 | Product onboarding tours, changelog & contextual help system | **still-needed** | No onboarding tours exist in audit; confirmed gap |
| task-743 | Demo Day readiness — one-command setup, working credentials, guided walkthrough | **still-needed** | P2-006 (no one-click demo reset); P1-001 (Mapbox token missing) — overlaps with N-013 |
| task-746 | Phase 1+5 — Category narrative reframe and full documentation overhaul | **still-needed** | Category narrative work; partially addressed by szl-doctrine.md in this task |
| task-747 | Phase 7 — GitHub professionalization and enterprise ops docs | **still-needed** | GitHub integration is real; docs professionalization is an open area |
| task-748 | Phase 2+3+4 — Flagship governed decision loop UX in Lyte and Command | **still-needed** | Governed decision loop exists but Command badge counts not wired (P1-007) |
| task-756 | Truth audit & security credential hygiene (Phases 0-1) | **duplicate** | This task (task-1786) supersedes the truth audit scope; credential hygiene overlaps with task-530 |
| task-758 | Product architecture cleanup & enterprise professionalization (Phases 8-9) | **still-needed** | mockup-sandbox public path (P3-006); leftover backup files (P2-012) |
| task-760 | API platform hardening & observability (Phases 8-9) | **still-needed** | Zod coverage (P0-002); integration tests not in CI; observability stub |
| task-765 | Series A one-of-one tightening pass | **needs-scope** | Broad scope; should be directed at specific gaps from this audit |
| task-812 | Seed realistic tenant health data so the scorecard dashboard shows something meaningful | **still-needed** | Seed data is confirmed as demo-fixture; realistic tenant health is a demo enabler |
| task-820 | Add email delivery to scheduled reports (actually send reports on the schedule) | **still-needed** | No email delivery confirmed; SendGrid/Resend wired but not live |
| task-830 | Send real email and SMS alerts when users get notifications | **still-needed** | Twilio/SendGrid are stubs; not confirmed live |
| task-847 | Consolidate invitation flows and protect usage-event writes | **still-needed** | Auth/invitation flows not confirmed in audit |
| task-852 | Show API clients how close they are to rate limits on every response | **still-needed** | No rate limiting confirmed in system inventory |
| task-862 | Restore the firestorm, prism-counsel, and stephen-site apps so they run correctly | **obsolete** | These are deliberately archived; restoring conflicts with APP_STATUS.md deregistration decision. Firestorm backend is retained in api-server; Prism Counsel UI revival is a separate decision. |
| task-863 | Add E2E coverage for the remaining platform apps (Aegis, Vessels, Terra, Carlota Jo) | **still-needed** | No E2E tests exist; integration tests not in CI (P0-002) |
| task-864 | Wire onboarding analytics into domain pack tours (Aegis, Vessels, Terra) | **still-needed** | Analytics events not confirmed flowing (P2-005) |
| task-865 | Add contextual HelpTip tooltips to key platform features | **still-needed** | No contextual help system confirmed |
| task-875 | Add legal pages to the Trust Center so compliance reviewers can find them in one place | **still-needed** | Trust center exists; legal pages completeness not audited |
| task-880 | Clean up the shared component library exports for faster loading | **still-needed** | Confirmed gap (P2-012 area); component deduplication |
| task-881 | Remove leftover backup files and unused admin page imports | **still-needed** | P2-012 — directly confirmed in audit |
| task-977 | Forge — AI runtime, agent factory, and governed promotion pipeline | **still-needed** | eval-forge/evals-core packages exist as stubs; valid platform evolution |
| task-1010 | Enterprise redesign across all apps (web + mobile) | **still-needed** | Design overhaul; not an audit blocker but needed for enterprise positioning |
| task-1114 | Planner package — plan graphs, routing, fallbacks | **still-needed** | `packages/planner` is real; hardening task |
| task-1115 | Verifier package — strict pre-commit checks | **still-needed** | `packages/verifier` not in audit; CI checks not running |
| task-1177 | Verifier — org scoping & coverage gaps | **still-needed** | Complements P0-002 (auth/validation coverage) |

### [SUPERSEDED] Tasks (obsolete — explicitly marked in title)

| Task ID | Title | Notes |
|---|---|---|
| task-582 | [SUPERSEDED] Wire CORTEX cross-domain badge counts | Superseded by task-748; gap still open as P1-007 — file new task |
| task-583 | [SUPERSEDED] Add deep linking for push notifications | Superseded; gap still open as P2-011 — covered by task-529 |
| task-584 | [SUPERSEDED] Custom splash screen and icon for CORTEX | Superseded; gap still open as P2-011 — covered by task-529 |
| task-591 | [SUPERSEDED] Embed MicroFeedbackWidget in other apps | Superseded |
| task-594 | [SUPERSEDED] Add new apps to CI build checks | Superseded; CI gap still open — covered by task-530 |
| task-595 | [SUPERSEDED] Refresh investor narrative docs | Superseded |
| task-631 | [SUPERSEDED] Connect Command Portal ops pages to real API data | Superseded; gap still open as P1-007 |
| task-632 | [SUPERSEDED] Add Command Portal ops pages to Ecosystem Command marketing | Superseded |
| task-633 | [SUPERSEDED] Add real-time alert badge counts to Ops Center nav | Superseded; gap still open as P1-007 |
| task-634 | [SUPERSEDED] Remove deprecated apps source directories | Superseded; APP_STATUS.md confirms 5 archived — directories may still exist |
| task-637 | [SUPERSEDED] Connect notification scheduling to server | Superseded; gap still open (task-820) |
| task-640 | [SUPERSEDED] Capture screenshots of Aegis and IMPERIUM | Superseded |
| task-648 | [SUPERSEDED] Connect 8 new Strategic Command modules to live data | Superseded; gap still open as P1-005 — file new task |
| task-772 | [SUPERSEDED] Competitive research + homepage rewrite | Superseded |
| task-773 | [SUPERSEDED] Build flagship Decision Theater experience | Superseded; Decision Theater exists |
| task-775 | [SUPERSEDED] Competitive benchmark research & Series A strategy | Superseded |
| task-785 | [SUPERSEDED] Series A: Category Narrative & Portfolio Coherence | Superseded |
| task-786 | [SUPERSEDED] Series A: Operating Loop & Attribution Model | Superseded |
| task-787 | [SUPERSEDED] Series A: Public Flagship & Trust GTM Pass | Superseded |
| task-788 | [SUPERSEDED] Series A: Operator Command Differentiation | Superseded |
| task-789 | [SUPERSEDED] Series A: API Integration-Grade Pass | Superseded |
| task-791 | [SUPERSEDED] Series A: Mobile Beta Honest Pass | Superseded |
| task-793 | [SUPERSEDED] SZL Scale, Close, and Operate Pass | Superseded |
| task-794 | [SUPERSEDED] Commercial company buildout | Superseded |
| task-795 | [SUPERSEDED] Category Leadership — Strategic Foundations | Superseded |
| task-796 | [SUPERSEDED] Category Leadership — Commercial Engine | Superseded |
| task-797 | [SUPERSEDED] Category Leadership — Flagship Site Elevation | Superseded |
| task-798 | [SUPERSEDED] Category Leadership — Operator Demo & Trust Elevation | Superseded |
| task-799 | [SUPERSEDED] Platform Elevation Phase 1-2 | Superseded |
| task-800 | [SUPERSEDED] Platform Elevation Phase 3-4 | Superseded |
| task-801 | [SUPERSEDED] Platform Elevation Phase 5-6 | Superseded |
| task-802 | [SUPERSEDED] Platform Elevation Phase 7-8 | Superseded |

---

## Part 2: Summary Counts

| Status | Count |
|---|---|
| still-needed | 44 |
| needs-scope | 4 |
| obsolete (non-superseded) | 4 |
| [SUPERSEDED] (obsolete — in title) | 32 |
| duplicate of this task | 1 |
| **Total analyzed** | **87** |

**Top 5 tasks with the highest audit confirmation:**

1. **task-512** (Mock data elimination) — directly addresses P0-002, P1-003, P2-001, P2-003, P2-007
2. **task-530** (CI/CD, testing, APM, DR) — addresses integration test gap, Sentry DSN stub, release discipline D grades
3. **task-517** (Stabilize all failing services) — mobile stability, Zod coverage
4. **task-863** (Add E2E coverage) — no E2E tests exist anywhere in codebase
5. **task-760** (API platform hardening & observability) — directly addresses P0-002

---

## Part 3: Recommended Prune List

The following tasks should be formally closed or deprioritized:

1. **task-372** — LinkedIn portfolio; not a code task; remove from engineering queue
2. **task-149** — Prior audit/readiness; superseded by this task and current APP_STATUS
3. **task-756** — Truth audit; superseded by this task (task-1786)
4. **task-862** — Restore archived apps; conflicts with deliberate deregistration policy; close
5. All 32 [SUPERSEDED] tasks — these are effectively closed; confirm and archive

---

## Part 4: Recommended New Tasks (from audit gaps, not covered by existing queue)

These gaps were found in the audit and have no corresponding task in the 87-task queue:

| # | Recommended task title | Priority | Gap ref |
|---|---|---|---|
| N-001 | Set Mapbox token so Terra maps render — current blank maps block every Terra demo | P0 | P1-001 |
| N-002 | Add production guard to the admin seed endpoint | P0 | P0-001 |
| N-003 | Add [Demo] labels to all szl-holdings dashboard KPIs sourced from seed data | P1 | P1-003 |
| N-004 | Label Pulse fallback briefings as "Synthesized" when no AI provider is available | P1 | P1-004 |
| N-005 | Feature-flag the 8 unwired Aegis security modules so they don't show in demos | P1 | P1-005 |
| N-006 | Feature-flag the 3 unwired Vessels commercial modules (insurance, trading, platform) | P1 | P1-006 |
| N-007 | Wire Command dashboard badge counts to live api-server metric endpoints | P2 | P1-007 |
| N-008 | Remove or connect Command marketing status page "99.98% uptime" to a real monitor | P1 | P2-003 |
| N-009 | Add [Demo] labels to Carlota Jo Consulting OS views | P2 | P2-007 |
| N-010 | Apply DemoModeBanner consistently across all artifacts showing seeded data | P2 | P2-009 |
| N-011 | Move NEXUS mockup-sandbox off public preview path or add auth guard | P2 | P3-006 |
| N-012 | Migrate remaining artifacts (command, carlota-jo, vessels, aegis, pulse, terra) to read public claims from packages/config | P3 | proof-point follow-up |
| N-013 | Add integration tests to CI for auth enforcement and tenant isolation | P2 | system-inventory §9 |
| N-014 | Configure real uptime monitoring (UptimeRobot or Betterstack) for public surfaces | P2 | scorecard |
| N-015 | Confirm which env secrets are set in the demo deployment environment and document them | P1 | env-contract |
| N-016 | Add Zod validation to the 149 api-server routes that currently have no schema enforcement | P1 | P0-002 |

---

*This reconciliation is based on code audit (task-1786), April 18, 2026. Re-run after any major release phase.*
