# SZL Holdings — Gap-Closure Roadmap

**Generated:** April 18, 2026  
**Task:** #1725 — Zoom out, sweep every plan's out-of-scope items, ship the high-value gaps  
**Owner:** Platform team  
**Update cadence:** After each task closes; mark shipped items Done with commit SHA

---

## Scope boundary — what task #1725 shipped vs. deferred

Task #1725 explicitly called out two shipping targets:

1. **NEXUS gaps**: agent audit trail, "explain this decision" panel, per-agent rate limits
2. **Demo video gaps**: captions/transcript, chapter markers, social-cut variants (15s/30s/60s)

**All other items in this roadmap are explicitly deferred**, categorised by reason:

| Defer reason | Status label used below |
|---|---|
| Has an existing pending task that owns it | `Pending task (#NNN)` |
| Ready to build but out of scope for #1725 — pick up in next task | `Deferred — next task` |
| Cannot build until user provides credential, account, or approval | `Blocked — needs: <reason>` |
| Revenue-phase / post-launch architectural decision | `Blocked — revenue phase` |

Nothing in this document is "abandoned". Every item has an explicit disposition.

---

## How to read this document

| Field | Values |
|---|---|
| **Priority** | P0 = ship immediately, P1 = next sprint, P2 = next quarter, P3 = future/architecture |
| **Status** | `Pending task` · `Done (task #1725)` · `Deferred — next task` · `Blocked — needs: X` · `Blocked — revenue phase` |
| **Champion** | Category-leading product whose pattern we adapted |

Items marked **Pending task** are owned by an existing PENDING task — do NOT re-implement here; cross-reference only.  
Items marked **Done (task #1725)** were implemented in this sweep and verified in browser screenshot.

---

## Summary: Shipped in this task (#1725)

| Area | Gap | Implementation |
|---|---|---|
| NEXUS | Agent-run audit trail viewable in UI | New `AuditTrail` page in mockup-sandbox |
| NEXUS | Per-agent rate limits displayed | Rate limit column in AuditTrail; badge in Orchestrator |
| NEXUS | "Explain this decision" panel on every agent action | `ExplainPanel` component in Orchestrator page |
| Demo Video | Chapter markers overlay with timestamps | `ChapterMarkers` component in VideoTemplate |
| Demo Video | Captions/transcript track | `CaptionTrack` component in VideoTemplate |
| Demo Video | Social-cut mode (15s / 30s / 60s variants) | `SocialCutSelector` in VideoTemplate |

---

## Artifact: SZL Holdings Dashboard (`artifacts/szl-holdings`)

### Theme: Onboarding & Empty States

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| SZL-1 | Finished onboarding wizard / empty states with inline CTAs | `unified-ux-states.md`, `accessibility-performance-onboarding.md` | P0 | Pending task (see also #864 for domain packs) | Stripe Dashboard — empty states include a single prominent action button and a one-liner that explains *why* the section is empty |
| SZL-2 | "What changed since last visit" diff banner on dashboard | `05-business-state-ux-command-surfaces.md` | P1 | Deferred — next task | Notion — "X changes since you were last here" banner at top of page with expandable diff |
| SZL-3 | Persist user preferences (theme, nav layout, sidebar pinned items) | `ux-delight-cross-app-cohesion.md`, `unified-cross-app-experience.md` | P0 | Pending task | Linear — prefs synced server-side so they roam across devices |

### Theme: Contextual Help & Tooltips

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| SZL-4 | HelpTip tooltips on key dashboard features (genome score, autopilot stats) | `web-app-polish-investor-ready.md` | P0 | Pending task | Intercom — anchored tooltip with a "?" icon that slides open a 3-sentence card with a "Learn more" link |
| SZL-5 | Keyboard-first command palette polish (⌘K) | `universal-command-palette.md` | P1 | Deferred — next task | Raycast / Linear — fuzzy search, recent items, grouped by type, keyboard shortcut hints inline |

### Theme: OG Social Cards & SEO

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| SZL-6 | OG social card images for all major pages | `wave1-marketing-narrative.md`, `typescript-seo-mobile-stability.md` | P1 | Pending task | Vercel — per-page dynamic OG images generated at build time with consistent brand chrome |
| SZL-7 | Structured data (JSON-LD) on public pages | `typescript-seo-mobile-stability.md` | P2 | Deferred — next task | Google Search Central — `Organization`, `SoftwareApplication`, and `FAQPage` schemas |

### Theme: Performance & Loading

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| SZL-8 | Route-level code-splitting so initial bundle < 200 KB | `web-efficiency-cleanup.md`, `performance-*` | P1 | Deferred — next task | Next.js — automatic dynamic import at the route level, Suspense fallback with skeleton |
| SZL-9 | Skeleton loaders on dashboard KPI cards | `unified-ux-states.md` | P1 | Deferred — next task | Stripe — shimmer skeleton that matches the exact shape of the loaded card |

### Theme: Accessibility

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| SZL-10 | WCAG 2.1 AA contrast audit + fix on all custom colors | `accessibility-audit.md` | P1 | Deferred — next task | IBM Carbon — all design tokens validated against AA; fail-fast contrast lint in Storybook |
| SZL-11 | Keyboard navigation for all interactive charts | `accessibility-audit.md` | P2 | Deferred — next task | Highcharts accessibility module — focus ring, arrow-key navigation, screen-reader summary |

---

## Artifact: Unified Command (`artifacts/command`)

### Theme: Live Data Connections

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| CMD-1 | 8 strategic intelligence modules connected to live API data | `07-ai-control-plane-nvidia-modules.md`, `unified-command-evolution.md` | P0 | **Pending task** (existing task) | Palantir Foundry — each module pulls from a named data product with a freshness badge and staleness alert |
| CMD-2 | Cross-platform correlation surface (Terra + Aegis + Vessels signals unified) | `05-business-state-ux-command-surfaces.md` | P0 | **Pending task** | Datadog — correlated events timeline where incidents from different sources appear on a unified x-axis |

### Theme: Contextual Help

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| CMD-3 | Contextual help panel on each intelligence module | `unified-command-evolution.md` | P1 | Deferred — next task | Notion — right-rail "About this view" panel that explains the data source, refresh cadence, and how to act on the insight |

### Theme: Notifications

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| CMD-4 | Cross-app alert routing (Command receives alerts from all domain apps) | `universal-notifications.md` | P1 | Deferred — next task | PagerDuty — all alerts funnel to a single inbox with severity color-coding and one-click acknowledge |

---

## Artifact: Pulse — AI Executive Briefing (`artifacts/pulse`)

### Theme: Delivery

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| PUL-1 | Daily Digest delivered via real email/SMS | `pulse-*.md`, `notification*.md`, task-637 | P0 | **Pending task** (task #637 — SUPERSEDED, see existing task) | Superhuman — morning digest email with keyboard-navigable action items that deep-link back to the app |
| PUL-2 | Scheduled report email delivery end-to-end | `04-canonical-demo-web-hardening.md` | P0 | **Pending task** | Datadog — weekly email with sparkline trends, top anomalies, and one CTA per section |
| PUL-3 | Slack / Teams integration for briefing delivery | `pulse-*.md` | P2 | **Blocked: needs user approval** (Slack app review process) | Superhuman — unfurl cards with inline actions so the reader never has to open the app for acknowledge/approve |
| PUL-4 | User notification preference settings (time, format, domains) | `pulse-notifications.md` | P1 | Deferred — next task | Substack — per-publication frequency control with a "preview" of what you'd receive |

### Theme: Mobile reading

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| PUL-5 | Mobile-native reading experience in szl-holdings-mobile | `05-mobile-commercial-activation.md` | P1 | Deferred — next task | Readwise Reader — swipe-to-archive, highlight-to-save, font size control |

---

## Artifact: SZL Holdings Mobile (`artifacts/szl-holdings-mobile`)

### Theme: Push Notifications

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| MOB-1 | Push notifications wired to the same pipeline as web notifications | `05-mobile-commercial-activation.md`, `wave3-cortex-mobile.md` | P0 | **Pending task** (task #637 lineage) | Linear — push notification with deep link that opens the relevant thread directly, no extra taps |
| MOB-2 | Daily Digest push notification at user-configured time | task-637 (SUPERSEDED) | P0 | **Pending task** | Superhuman mobile — rich push with 3 highlighted items and a swipe action |

### Theme: Offline & Resilience

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| MOB-3 | Offline-tolerant home screen with last-known data | `05-mobile-commercial-activation.md` | P0 | **Pending task** | Linear mobile — cached issue list with an "offline" banner; writes queue until reconnect |
| MOB-4 | Background sync when reconnected | `mobile-*.md` | P1 | Deferred — next task | Notion mobile — sync indicator in top bar, conflict resolution dialog for edits made offline |

### Theme: Biometric Security

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| MOB-5 | Biometric unlock for sensitive screens (holdings, governance) | `05-mobile-commercial-activation.md` | P0 | **Pending task** | 1Password — FaceID gate on vault open; graceful fallback to PIN |
| MOB-6 | Per-screen sensitivity classification (which screens gate on biometric) | `mobile-*.md` | P1 | Deferred — next task | Robinhood — only the "Portfolio value" and "Transfer" screens require biometric; browsing is frictionless |

### Theme: App Store Readiness

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| MOB-7 | App Store screenshots and marketing assets | `05-mobile-commercial-activation.md` | P2 | Deferred — next task | Arc browser — every screenshot tells a story, not just a UI screenshot |
| MOB-8 | App Store submission (Apple + Google) | `05-mobile-commercial-activation.md` | P3 | **Blocked: needs developer accounts** | — |

---

## Artifact: API Server (`artifacts/api-server`)

### Theme: Rate Limiting

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| API-1 | Rate-limit headers on every API response (`X-RateLimit-*`) | `03-api-contracts-alloy-fabric.md`, `api-gateway-performance-resilience.md` | P0 | **Pending task** (existing task) | Stripe — `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` on every response; 429 with `retry_after` JSON body |
| API-2 | Per-client, per-tenant, per-endpoint rate limit tiers | `api-gateway-performance-resilience.md` | P1 | Deferred — next task | GitHub API — tiered limits: unauthenticated < authenticated < OAuth apps < GitHub Apps |

### Theme: Invitation & Auth Flows

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| API-3 | Consolidated invitation flow (one canonical endpoint, dedup existing routes) | `02-auth-tenancy-data-hardening.md` | P0 | **Pending task** (existing task) | Notion — single `/invite` endpoint; idempotent token generation; re-send without duplicate |
| API-4 | Usage-event write protection (validate source, prevent spoofing) | `usage-metering-billing.md` | P0 | **Pending task** (existing task) | Stripe — event writes require a signed `Stripe-Signature` header; reject unsigned events with 401 |

### Theme: OpenAPI Documentation

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| API-5 | OpenAPI request/response examples for every endpoint | `03-api-contracts-alloy-fabric.md` | P1 | Deferred — next task | Stripe API docs — every endpoint has a curl example, a JSON request, and a JSON response, all syntax-highlighted |
| API-6 | API versioning strategy documented and applied to `/v1` prefix | `03-api-contracts-alloy-fabric.md` | P2 | Deferred — next task | GitHub REST — `Accept: application/vnd.github.v3+json` header for version negotiation |
| API-7 | API changelog surfaced to consumers | `03-api-contracts-alloy-fabric.md` | P2 | Deferred — next task | Stripe — `/changelog` page with breaking change callouts and migration guides |

### Theme: Validation & Security

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| API-8 | Zod input validation on remaining 149 route files (currently 21/170) | `known-gaps.md` | P0 | Deferred — large scope, needs dedicated task | tRPC — input validation is structurally impossible to skip; types and runtime checks from the same schema |
| API-9 | Route security matrix auto-generated in CI | `known-gaps.md`, `advanced-platform-hardening.md` | P1 | **Pending task** (existing task) | — |

### Theme: Observability

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| API-10 | Request tracing with distributed trace IDs propagated to all downstream calls | `02-business-observability-telemetry.md` | P1 | Deferred — next task | Datadog APM — `X-Datadog-Trace-Id` on every request; waterfall view in the trace explorer |
| API-11 | Redis-backed session store (remove in-memory store) | `known-gaps.md` | P2 | **Blocked: needs Redis provisioning** | — |

---

## Artifact: Aegis — Unified Defense & Intelligence (`artifacts/aegis`)

### Theme: Onboarding Analytics

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| AEG-1 | Onboarding analytics wired into the Aegis domain-pack tour | `aegis-gap-closure.md`, `06-domain-pack-unification.md` | P0 | **Pending task** (existing task) | Segment — `track("onboarding_step_completed", { step, domain, duration })` on every wizard step; funnel in Amplitude |
| AEG-2 | E2E test coverage for Aegis main flows | `aegis-gap-closure.md` | P0 | **Pending task** (existing task) | Vercel — Playwright E2E runs on every PR in preview environments; test report linked from PR |

### Theme: Demo Data

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| AEG-3 | Realistic seeded demo data for SOC dashboard, CISO view, MSP portfolio | `aegis-gap-closure.md`, task-812 lineage | P0 | **Pending task** (existing task) | CrowdStrike Falcon demo tenant — 30 days of threat data, 12 seeded incidents, 5 MSP clients |
| AEG-4 | CISO Executive Dashboard aggregating all Aegis modules | `aegis-*.md` | P1 | Deferred — next task | Darktrace — C-suite summary: risk score + trend, top 5 threats, compliance posture, one recommended action |

### Theme: Trust Center & Legal

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| AEG-5 | Aegis-specific legal pages surfaced in a per-pack Trust Center | `trust-investor-authority.md`, `06-ops-security-release-launch.md` | P0 | **Pending task** (existing task) | Stripe — `/trust` page with SOC 2 badge, DPA download, privacy policy, subprocessor list, all in one place |

### Theme: 8 Security Modules

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| AEG-6 | 8 new security modules wired to live API / case management | `aegis-*.md`, `07-ai-control-plane-nvidia-modules.md` | P0 | **Pending task** (existing task) | Splunk SIEM — each module is a "detection pack"; each pack has a health indicator and a last-updated timestamp |

---

## Artifact: Vessels — Maritime Intelligence (`artifacts/vessels`)

### Theme: Onboarding & Demo Data

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| VES-1 | Onboarding analytics for the Vessels domain-pack tour | `vessels-gap-closure.md`, `06-domain-pack-unification.md` | P0 | **Pending task** (existing task) | Segment + Amplitude — funnel visualization: which step do most maritime analysts abandon? |
| VES-2 | Realistic seeded fleet + voyage data (30+ vessels, AIS-style positions) | `vessels-gap-closure.md`, task-812 lineage | P0 | **Pending task** (existing task) | Windward — demo tenant includes a mix of tankers, containers, and bulk carriers with voyage history |
| VES-3 | AIS live tracking integration (connect vessels-live.ts to a real or stubbed feed) | `vessels-real-data-wiring.md` | P2 | **Blocked: needs Baltic Exchange / AIS API key** | Windward — real-time position polling with a 15-minute AIS refresh cadence |

### Theme: E2E & Trust

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| VES-4 | E2E coverage for Vessels fleet command and voyage economics flows | `vessels-gap-closure.md` | P0 | **Pending task** (existing task) | — |
| VES-5 | Vessels Trust Center legal pages | `trust-investor-authority.md` | P0 | **Pending task** (existing task) | — |

### Theme: Mobile

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| VES-6 | Vessels mobile app (vessels-mobile) wired to same backend as web | `vessels-mobile-app.md` | P2 | Deferred — next task | Windward mobile — push alert when a monitored vessel enters a sanctioned port |

---

## Artifact: Terra — Real Estate Intelligence (`artifacts/terra`)

### Theme: Onboarding & Demo Data

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| TER-1 | Onboarding analytics for the Terra domain-pack tour | `terra-gap-closure.md` | P0 | **Pending task** (existing task) | Segment — `track("property_viewed", { address, distress_score })` feeds into cohort analysis |
| TER-2 | Realistic NYC distress property seeded data (50+ properties) | `terra-gap-closure.md`, task-812 lineage | P0 | **Pending task** (existing task) | Reonomy demo — 50+ seeded properties with distress score, ownership history, and tax lien data |
| TER-3 | NYC MLS data integration | `terra-nyc-listings-and-microsoft-365.md` | P3 | **Blocked: needs paid MLS access** | — |

### Theme: Distress Engine

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| TER-4 | Distress-to-deal pipeline (distress signals → auto-generate acquisition brief) | `terra-distress-engine.md` | P1 | Deferred — next task | Reonomy — "Start acquisition" from any property card; auto-fills CRM deal with property metadata |
| TER-5 | Contagion graph (distress spreads across connected properties) | `terra-distress-contagion-graph.md` | P2 | Deferred — next task | Palantir Foundry — graph view with edge weights representing shared ownership / adjacency risk |

### Theme: E2E & Trust

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| TER-6 | E2E coverage for Terra portfolio and distress flows | `terra-gap-closure.md` | P0 | **Pending task** (existing task) | — |
| TER-7 | Terra Trust Center legal pages | `trust-investor-authority.md` | P0 | **Pending task** (existing task) | — |

---

## Artifact: Carlota Jo Consulting (`artifacts/carlota-jo`)

### Theme: Onboarding & Demo Data

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| CJO-1 | Onboarding analytics for the Carlota Jo domain-pack tour | `06-domain-pack-unification.md` | P0 | **Pending task** (existing task) | — |
| CJO-2 | Realistic demo client and engagement data | `06-domain-pack-unification.md`, task-812 lineage | P0 | **Pending task** (existing task) | Notion consulting template — 5 seeded clients with engagement history, invoices, and deliverables |

### Theme: Booking & CRM

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| CJO-3 | Real booking flow wired to calendar availability | `carlota-jo-*.md` | P1 | **Blocked: needs Calendly / Cal.com API** | Cal.com — embed booking widget that reads available slots from the host's calendar |
| CJO-4 | Client portal with secure document sharing | `carlota-jo-*.md` | P2 | Deferred — next task | Notion — client-scoped workspace with deliverable tracking and comment threads |

### Theme: E2E & Trust

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| CJO-5 | E2E coverage for Carlota Jo booking and client portal flows | `06-domain-pack-unification.md` | P0 | **Pending task** (existing task) | — |
| CJO-6 | Carlota Jo Trust Center legal page (privacy, engagement terms) | `trust-investor-authority.md` | P0 | **Pending task** (existing task) | — |

---

## Artifact: NEXUS — Unified Agentic AI Layer (`artifacts/mockup-sandbox`)

### Theme: Audit & Governance

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| NEX-1 | Agent-run audit trail viewable in the UI | `nexus-agentic-layer.md`, `agent-autonomy-dashboard.md`, `04-replay-eval-trust-infrastructure.md` | P0 | **Done (task #1725)** | Cursor — every AI action is logged with: intent → plan → tool calls → result; expandable in a side panel |
| NEX-2 | Per-agent rate limits displayed in the orchestration UI | `nexus-agentic-layer.md`, `ai-gateway-performance-resilience.md` | P0 | **Done (task #1725)** | Anthropic Claude API console — per-model `TPM / RPM` gauges on the dashboard; amber at 80%, red at 95% |
| NEX-3 | "Explain this decision" panel on every agent action | `nexus-agentic-layer.md`, `agentic-ai-platform-evolution.md` | P0 | **Done (task #1725)** — wire to real API data: Pending task (#1735) | Claude / Cursor — inline reasoning trace: "I chose tool X because Y; I rejected tool Z because W" in collapsible panel |

### Theme: Admin Controls

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| NEX-4 | Admin controls for agent configuration (enable/disable, rate limit overrides) | `nexus-*.md` | P1 | Pending task (#1734) | Retool — admin panel with per-agent toggles, rate-limit sliders, and an audit log of config changes |
| NEX-5 | External/client-facing NEXUS access (scoped read-only view) | `nexus-agentic-layer.md` | P2 | Deferred — next task | Palantir Foundry — "Restricted mode" where external users see output but not agent reasoning chains |

### Theme: Mobile

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| NEX-6 | NEXUS mobile views | `nexus-agentic-layer.md` | P3 | Deferred — P3 future work | — |

### Theme: Agent Marketplace

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| NEX-7 | Paid skill marketplace / agent marketplace | `agent-marketplace-full-build.md`, `nexus-*.md` | P3 | Blocked — revenue phase | Replit Extensions marketplace — browse, install, and rate agent skills from a curated registry |

---

## Artifact: Demo Video (`artifacts/szl-demo-video`)

### Theme: Accessibility & Distribution

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| VID-1 | Captions / transcript track | `08-demo-gtm-readiness.md`, `wave1-demo-polish.md` | P0 | **Done (task #1725)** | Loom — auto-generated captions editable inline; transcript downloadable as `.txt` |
| VID-2 | Chapter markers with timestamps | `08-demo-gtm-readiness.md` | P0 | **Done (task #1725)** | YouTube chapters — click a chapter to jump to timestamp; visible in progress bar as segment dividers |
| VID-3 | Social-cut variants (15s / 30s / 60s) | `08-demo-gtm-readiness.md`, `wave1-marketing-narrative.md` | P0 | **Done (task #1725)** | Loom — "Create clip" button generates a shareable URL for a sub-range; no re-encoding |
| VID-4 | Downloadable high-res MP4 export | `08-demo-gtm-readiness.md` | P2 | Pending task (#1736) | — |

---

## Cross-Cutting Themes

### Theme: Trust Center & Legal Pages

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| TRU-1 | Consolidated Trust Center with all legal pages in one place | `06-ops-security-release-launch.md`, `trust-investor-authority.md` | P0 | **Pending task** (existing task) | Stripe Trust Center — single URL with SOC 2, GDPR, DPA, privacy policy, subprocessor list, incident history |
| TRU-2 | Per-domain-pack Trust Center pages (Aegis, Vessels, Terra, Carlota Jo) | `trust-investor-authority.md` | P0 | **Pending task** (existing task) | — |

### Theme: README & Documentation

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| DOC-1 | Root README updated to reflect which apps are live / beta / archived | `06-ops-security-release-launch.md` | P1 | **Pending task** (existing task) | Vercel monorepo README — each package in a table with: status badge, owner, preview URL |
| DOC-2 | Per-artifact README with: purpose, live URL, auth method, demo credentials | `readme-standards.md` | P2 | Deferred — next task | — |
| DOC-3 | API reference auto-generated from OpenAPI spec and hosted at `/api/docs` | `03-api-contracts-alloy-fabric.md` | P2 | Deferred — next task | Stripe API docs — Redoc / Scalar hosted at a stable URL; always in sync with code |

### Theme: Shared Component Library

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| LIB-1 | Clean up shared component library exports (remove dead re-exports, fix barrel files) | `web-component-consolidation.md` | P1 | **Pending task** (existing task) | Radix UI — single flat barrel export per package; no circular imports; tree-shakeable |
| LIB-2 | Add missing shared primitives exposed by gap closure (HelpTip, EmptyState, RateLimitBadge) | this task | P1 | Deferred — next task | Shadcn/ui — copy-paste primitives that apps own and customise; no hidden dependency |

### Theme: Security & CI

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| SEC-1 | Security scan results block pull requests automatically | `06-ops-security-release-launch.md`, `advanced-platform-hardening.md` | P0 | **Pending task** (existing task) | GitHub Advanced Security — SARIF upload in CI; PR blocked if any High/Critical finding is new |
| SEC-2 | Firestorm seed endpoint guarded against production execution | `truth-audit-security-hygiene.md` | P0 | **Pending task** (existing task) | — |
| SEC-3 | Zod validation on remaining 149 route files (see API-8) | `known-gaps.md` | P0 | Deferred — large scope, needs dedicated task | tRPC — validation impossible to skip at the type level |
| SEC-4 | Redis-backed session store in production (see API-11) | `known-gaps.md` | P2 | **Blocked: needs Redis provisioning** | — |

### Theme: Cleanup & Maintenance

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| CLN-1 | Remove leftover backup files and unused admin page imports | `wave1-repo-cleanup.md`, `web-efficiency-cleanup.md` | P1 | **Pending task** (existing task) | — |
| CLN-2 | Dead code elimination pass across all artifacts | `web-efficiency-cleanup.md` | P2 | Deferred — next task | — |

### Theme: Notifications (Cross-App)

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| NOT-1 | Real email delivery for all notification types | `universal-notifications.md`, `notification-*.md` | P0 | **Pending task** (existing task) | Superhuman — emails with a single focus action, no marketing chrome, plain text fallback |
| NOT-2 | Real SMS delivery for critical alerts | `universal-notifications.md` | P0 | **Pending task** (existing task — blocked: needs Twilio approval) | PagerDuty — SMS with incident ID, severity, and one-tap acknowledge link |
| NOT-3 | Notification preference center (per-user, per-type, per-frequency) | `universal-notifications.md` | P1 | Deferred — next task | GitHub notification settings — granular per-repo, per-event type, per-delivery channel matrix |
| NOT-4 | Unsubscribe / snooze from email / SMS | `universal-notifications.md` | P1 | Deferred — next task | Substack — one-click unsubscribe in email footer; snooze for 1h/24h/7d in the app |

### Theme: Agentic AI (Cross-App)

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| AGT-1 | Fine-tuning or training custom models | `153`, `nexus-*.md` | P3 | Blocked — revenue phase | Anthropic fine-tuning API — domain-specific RLHF on operator-approved examples |
| AGT-2 | A2A / ANP protocol production deployment | `a2a-agent-protocol.md` | P3 | Blocked — architecture decision needed | Google A2A spec — agent-to-agent delegation over HTTPS with signed envelopes |
| AGT-3 | Agentic action execution (not just advisory) | `agent-autonomy-dashboard.md` | P2 | Blocked — governance decision needed | Devin — explicit approval gate before any write action; full undo log |

### Theme: Billing & Commerce

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| BIL-1 | Stripe live mode activation | `usage-metering-billing.md` | P2 | **Blocked: needs Stripe live key approval** | Stripe — test → live promotion takes 15 minutes once business details are verified |
| BIL-2 | Usage-based billing metering (per API call, per agent run) | `usage-metering-billing.md` | P2 | **Blocked: depends on BIL-1** | Stripe Meters — emit events to Stripe; billing portal shows usage breakdown |
| BIL-3 | White-label / multi-tenant billing (each tenant pays independently) | `white-label-multitenancy.md` | P3 | Blocked — revenue phase | Stripe Connect — platform takes a fee; tenants have their own Stripe accounts |

### Theme: Observability (Cross-App)

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| OBS-1 | Distributed trace IDs propagated across all services (see API-10) | `02-business-observability-telemetry.md` | P1 | Deferred — next task | Datadog APM — one W3C `traceparent` header threads through every hop |
| OBS-2 | External uptime monitor configured and alerting | `known-gaps.md` | P1 | Deferred — next task | Better Uptime — public status page; Slack + PagerDuty alerts; 1-min check interval |
| OBS-3 | Business-event dashboards (not just infra metrics — revenue, activation, retention) | `02-business-observability-telemetry.md` | P1 | Deferred — next task | Stripe Dashboard — "Successful payments today" next to "p99 latency today"; business and infra on one screen |

### Theme: Onboarding (Cross-App)

| # | Deferred item | Source tasks | Priority | Status | Champion inspiration |
|---|---|---|---|---|---|
| ONB-1 | Onboarding analytics funnel across all domain-pack tours | `accessibility-performance-onboarding.md`, `06-domain-pack-unification.md` | P0 | **Pending task** (existing task) | Segment + Amplitude — multi-touch funnel: impression → step_completed → tour_finished → first_action |
| ONB-2 | Resumable onboarding (wizard state persists across sessions) | `unified-ux-states.md` | P1 | Deferred — next task | Linear — progress checklist in sidebar; each item checkable; persists to user profile |
| ONB-3 | Onboarding A/B testing | `accessibility-performance-onboarding.md` | P3 | Blocked — needs analytics infrastructure first | — |

---

## Still-Deferred Items Register (P3 / Blocked)

These items were found in "Out of scope" sections of multiple plans but require a decision, paid service, or architectural work before they can be implemented:

| Item | Reason | Action needed |
|---|---|---|
| Custom ML model training / fine-tuning | Requires paid GPU infra + training data | User decision: approve budget |
| Stripe live mode | Requires Stripe live key from user | User action: activate live account |
| Twilio SMS (real) | Requires Twilio account + number provisioning | User action: create Twilio account |
| SendGrid paid tier | Free tier limits deliverability | User action: upgrade SendGrid plan |
| AIS live feed (Baltic Exchange) | Requires API license | User action: purchase license |
| NYC MLS data | Requires REBNY membership | User action: apply for membership |
| App Store / Google Play submission | Requires Apple/Google developer accounts | User action: create developer accounts |
| Redis in production | Requires Redis provisioning on cloud | Infrastructure decision |
| Multi-region failover | Requires Azure multi-region deployment | Revenue-phase decision |
| SOC 2 audit | Requires third-party auditor | Revenue-phase decision |
| A2A protocol public deployment | Architecture decision for public endpoints | Platform decision |
| Argus file import compatibility | Niche requirement; evaluate when first enterprise asks | Defer to customer request |
| On-device ML models (mobile) | Requires Core ML / TFLite integration work | P3 future work |
| Video MP4 export pipeline | Requires headless browser / server-side render | Engineering spike needed |

---

## Appendix: Task Reference Map

| Task # | Title | Overlap items |
|---|---|---|
| #637 | Daily Digest delivery (SUPERSEDED) | PUL-1, MOB-1, MOB-2 |
| #648 | 8 Command strategic modules to live data | CMD-1, CMD-2 |
| #812 | Seed realistic tenant health data | AEG-3, VES-2, TER-2, CJO-2 |
| #820 | Add email delivery to scheduled reports | PUL-2 |
| #830 | Send real email/SMS alerts | NOT-1, NOT-2 |
| #847 | Consolidate invitation flows + protect usage-event writes | API-3, API-4 |
| #852 | Rate-limit headers on every response | API-1 |
| #863 | E2E coverage for Aegis, Vessels, Terra, Carlota Jo | AEG-2, VES-4, TER-6, CJO-5 |
| #864 | Onboarding analytics into domain pack tours | AEG-1, VES-1, TER-1, CJO-1, ONB-1 |
| #875 | Legal pages in Trust Center | TRU-1, TRU-2, AEG-5, VES-5, TER-7, CJO-6 |
| #880 | Clean up shared component library exports | LIB-1 |
| #881 | Remove leftover backup files | CLN-1 |
| #884 | Guard firestorm seed endpoint | SEC-2 |
| #888 | Update root README | DOC-1 |
| #899 | Security scan blocks PRs | SEC-1 |

---

*Last updated: April 18, 2026 — task #1725. Next review: after any P0 item ships.*
