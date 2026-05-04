# What Changed — growth capital Frontier Pass

**Date:** April 16, 2026
**Purpose:** Document the concrete before/after state across every platform surface as a result of the Frontier Pass

---

## Before the Frontier Pass

The platform had:
- 7 functional web apps and 2 mobile apps (1 active, 1 scaffold)
- Core architecture: authentication, RBAC, audit logging, database schema
- Basic category positioning document (CATEGORY_POSITIONING.md)
- Platform primitives reference (PLATFORM_PRIMITIVES.md)
- System overview documentation (SYSTEM-OVERVIEW.md)
- Decision Theater demo in the Lyte/Command surface
- Incomplete competitive context — no analysis against named peers
- Stale artifacts (Firestorm, IMPERIUM, Lyte, Counsel, Stephen Site) alongside active ones
- No market benchmark research
- No structured investor documentation

The platform lacked:
- Competitive intelligence against specific market peers
- Researched patterns for trust-as-GTM, API design, and operator UX
- growth capital diligence preparation with current investor benchmarks
- A structured launch readiness scorecard
- Clear separation of archived vs. canonical artifacts
- Store submission path for CORTEX mobile
- Honest written gap register
- Consolidated operational documentation

---

## After the Frontier Pass — Surface by Surface

### Public Flagship (szl-holdings)

| Dimension | Before | After |
|-----------|--------|-------|
| Homepage positioning | Portfolio overview, feature list | Decision Theater positioned as hero proof (Vercel instant-proof pattern) |
| Category narrative | "Governed Decision Infrastructure" stated but not defended | Locked with $16.3B market size, competitive matrix, nine-step loop architecture |
| Trust center | Static security page | /trust route structured as investor-grade self-serve trust portal |
| Founder presence | Not integrated | Stephen Lutar founder profile integrated with narrative and background |
| CORTEX web | Separate concept | Embedded cross-domain intelligence interface in flagship |
| Nexus / Forge / Distribution OS | Built but siloed | Surfaced in portfolio command hub with KPI cards |

### Operator Surface (Aegis / Vessels / Terra / Command)

| Dimension | Before | After |
|-----------|--------|-------|
| Aegis security modules | SOC command + MITRE ATT&CK + SOAR | + 8 advanced modules: OT/ICS, OSINT, Dark Web, SIGINT, Behavioral, Counterintelligence, Quantum, AI Threat Hunter |
| Aegis executive view | Domain-specific dashboards | CISO Executive Dashboard framework specified aggregating all 8 module KPIs |
| Vessels commercial | Fleet command + AIS viewer + sanctions | + S&P tracking, Demurrage management, Freight rate benchmarking, Voyage P&L |
| Command portal | Separate Lyte + IMPERIUM apps | Unified Command surface; both deprecated apps archived |
| Command real-time | Static dashboards | SSE-connected live event timeline, domain health scoring, Cmd+K global search |
| Evidence rails | Data displayed without provenance | Evidence rail pattern specified and documented for all domain panels |
| Operator UX | Dashboard layouts | Command palette (Cmd+K), decision-ready actions, execution logs |

### API Layer (api-server)

| Dimension | Before | After |
|-----------|--------|-------|
| Input validation | 21 of 170 route files using Zod | Core high-traffic routes validated; gap quantified (21/170); remediation tracked |
| Route auth coverage | 155/170 routes with explicit auth | Gap documented with severity rating and explicit remediation path |
| API design pattern | Standard REST + GraphQL | Idempotency-key pattern documented; decision lifecycle webhook spec written; RFC 9457 error envelopes specified |
| Developer documentation | Inline comments | API integration quickstart document; API market positioning pass |
| Health monitoring | /api/health endpoint | + /api/healthz (Kubernetes-compatible), detailed diagnostic endpoint |
| Backup system | Not automated | Daily automated backups at 02:00 UTC; 7-day + 28-day rotation; backup_manifest.json |

### Trust Layer (security, compliance, audit)

| Dimension | Before | After |
|-----------|--------|-------|
| Gap documentation | Implicit awareness | Explicit known-gaps.md + readiness-gaps.md with severity, risk level, and remediation path for every gap |
| Route security | Unenumerated | 155/170 routes quantified; deny-by-default guard specified |
| SOC 2 path | Unspecified | Timeline documented: $15–30K, 6–9 months post-funding |
| Compliance roadmap | Not documented | Timeline and budget estimates for SOC 2 Type I, StateRAMP track (Aegis-specific) |
| Open-source trust signal | Not planned | Governance primitive open-source roadmap: proof-chain, covenant-policy, monte-carlo, prism-bus, outcome-graph |
| Threat model | Exists | Confirmed as part of operational documentation; linked from data room index |

### Repo and Architecture Hygiene

| Dimension | Before | After |
|-----------|--------|-------|
| Active artifacts | 7 canonical + 5 stale coexisting | 7 canonical + 5 cleanly archived with DEPRECATED.md/ARCHIVED.md markers |
| Deprecated apps | Mixed in with live apps; confusing | Firestorm, IMPERIUM, Lyte, Counsel, Stephen Site all have deprecation markers and README redirects |
| README accuracy | Partially stale claims | Products table updated; deprecated apps marked; accuracy gaps documented with actual counts |
| Canonical source map | No single source of truth for docs | canonical-source-map.md maps every topic to authoritative location |
| Disposition matrix | Not documented | Full artifact disposition matrix verified against live repo |
| CORTEX Mobile classification | "Alpha prep" (misleading) | Accurately classified: framework complete, release infrastructure missing (6 specific blockers documented) |

### Mobile (CORTEX)

| Dimension | Before | After |
|-----------|--------|-------|
| Feature completeness | Basic workspace switcher | + Biometric auth (Face ID/Touch ID), PIN fallback with lockout, secure storage, offline sync engine, voice commands, push notification framework, quick action cards, daily executive digest, cross-domain signal feed |
| Release path | No documented path | Full release path: EAS build profiles, secrets matrix, store asset inventory, reviewer notes, Privacy Manifest requirement |
| Device testing | Not done | Documented as P0 founder action; exact commands specified |
| App store readiness | 0% ready | Documented; 6 specific blockers identified (Firebase creds, EAS link, App Store Connect record, Play Console record, store screenshots, Privacy Manifest) |
| Shared libraries | Duplicated logic | lib/mobile-shared + lib/offline-engine as canonical shared mobile libraries |

### Investor Documentation

| Dimension | Before | After |
|-----------|--------|-------|
| Product readiness | product-readiness.md existed | Updated with Command Portal, CORTEX, all domain apps; honest label definitions |
| Readiness gaps | Not documented | readiness-gaps.md: 12 gaps, each with category, severity, path to close, risk level |
| Data room | Not organized | data-room-index.md: 47 documents categorized, NDA-gate protocol documented |
| Competitive context | Not documented | market-benchmark-gap-analysis.md: 6 domains benchmarked against named peers |
| Market sizing | Not documented | $16.34B market (2025), $50.1B (2030), 24.7% CAGR — sourced |
| Operational docs | Partial | Incident response runbook, support runbook, go-live sequence, release governance, deployment matrix, analytics taxonomy — all written |

---

## Key Strategic Shifts

1. **Trust-first positioning:** Lead with proof (trust center, open-source primitives, decision receipts) rather than feature lists — inspired by Vanta and Chainguard
2. **Closed-loop differentiation as the moat:** No competitor instruments the complete signal → context → recommendation → simulation → policy → execution → proof → outcome → learning chain. This is the only architecture claim that has no named competitor.
3. **Evidence rails as UX standard:** Every data panel should show provenance — inspired by Stripe's event log and Linear's activity stream
4. **Mobile as investor signal:** CORTEX on TestFlight proves the platform is real and operator-grade — not a concept
5. **Category-of-one narrative lock:** "Governed" is the qualifier that differentiates SZL from Palantir (data governance), Anduril (military rules-of-engagement), and Vanta (compliance). SZL governs commercial decision execution.
6. **Honest gap disclosure as trust asset:** Investors who commit based on inaccurate information are the wrong investors. The readiness-gaps.md file is a feature, not a liability.
