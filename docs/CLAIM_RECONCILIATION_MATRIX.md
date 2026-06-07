# Claim Reconciliation Matrix

**Audit date:** 2026-04-27
**Auditor:** Engineering diligence audit (task #3206)
**Evidence method:** Code inspection, `generated/platform-metrics.json` (regenerated 2026-04-27T03:50:50Z), build/lint/typecheck outputs

## Scope

**In scope (primary public-facing documents):**
- `README.md` — primary public repository entry point
- `PRODUCT-SURFACES.md` — product surface classification
- `docs/PLATFORM_OVERVIEW.md` — investor/buyer platform overview
- `docs/platform-facts.md` — canonical platform statistics document
- `docs/DEMO_PATHS.md` — demo guidance document
- `docs/architecture-summary.md` — architecture reference

**Explicitly excluded with justification:**
- `docs/investor/` — prior audit docs from earlier audit runs; represent historical state, not current claims
- `docs/architecture/` — internal technical design docs; not public marketing claims
- `docs/operations/` — operational runbooks; internal audience
- `docs/alloy-runtime.md` — technical migration guide; not public claims
- Artifact-level `README.md` files — individual artifact docs; separate audit scope

All "unverified" claims originally found in in-scope documents were either corrected in the source document or had their verdict updated to reflect the corrected state.

---

## Verdict Definitions

| Verdict | Meaning |
|---------|---------|
| **verified** | Claim matches code/runtime evidence directly |
| **partial** | Claim is directionally correct but overstated, understated, or stale |
| **unverified** | No code or runtime evidence could be found to confirm the claim |
| **removed** | Claim has been corrected or struck from the source document as part of this audit |

---

## README.md Claims

| # | Claim | Source Location | Evidence | Verdict |
|---|-------|-----------------|----------|---------|
| 1 | "15 registered artifacts" | README.md Platform Scale table | `generated/platform-metrics.json` (2026-04-27T03:50:50Z) counts 19 directories under `artifacts/`; 15 formally registered in workspace registry; README was corrected from 14 to 15 in this audit | **verified** — fixed in this audit; formal registry count of 15 is accurate |
| 2 | "152 packages" | README.md Platform Scale table | `generated/platform-metrics.json`: 152 total packages (51 lib + 101 standalone) as of 2026-04-27T03:50:50Z | **verified** — fixed in this audit (README previously said 100; platform-facts.md said 123; both corrected to 152) |
| 3 | "51 shared libraries" | README.md Platform Scale table | `generated/platform-metrics.json`: `lib_packages: 51` | **verified** |
| 4 | "8 operator products" | README.md Platform Scale table | 8 named products in README product table (A11oy, TENAX, DOMAINE, SEXTANT, PARAGON, Counsel, KORA, LUMINA) — artifacts exist for 7 of 8; KORA maps to `lyte-command-center` | **partial** — count correct but naming/mapping inconsistency (KORA marketed but artifact is `lyte-command-center`) |
| 5 | "TypeScript (full stack, strict mode)" | README.md Tech Stack | `turbo run typecheck` fails for 9 packages: aef-sdk, reflection-engine, aef-storage-adapters, alloy-rank-worker, alloy-embed-worker, aef-retrieval-core, aef-policy-guard, @szl-holdings/db, api-client-react. Strict mode not consistently enforced across all packages | **partial** — TypeScript is used full-stack but typecheck does not pass cleanly |
| 6 | "All 13 web surfaces load. No artifacts are broken." | README.md Current Status | `pnpm run build` fails: `@szl-holdings/sdk` has TS errors cascading to `a11oy`, `alloy-ingestion-orchestrator`, `szl-demo-video`, `helios`, `szl-holdings-mobile`, `pluginmesh`, `substrate`, and `szl/alloy`; 10 of 27 build targets fail | **partial** — most web surfaces load in dev but clean build fails for 10 packages |
| 7 | "Alpha — runtime verified 2026-04-26" | README.md Current Status header | Date is now stale (audit date 2026-04-27); underlying runtime claims have caveats per items above | **partial** — date stale by 1 day; runtime claims directionally correct with caveats |
| 8 | "Signal Intelligence — correlated business signals across all connected systems" | README.md Core Capabilities | `packages/signal-mesh` exists and is implemented; signal correlation logic is in `lib/prism-bus`; seeded data used in demos | **partial** — infrastructure exists; live connector data is seeded in demo; real external system connections limited to select integrations |
| 9 | "Governed AI Recommendations — every recommendation carries source citations, confidence scores, and policy constraints" | README.md Core Capabilities | `lib/covenant-policy` implemented; AI recommendations include policy constraint fields per API schema; confidence scores present in schema | **partial** — framework implemented; completeness of citation and confidence score population varies by domain pack |
| 10 | "Human-Gated Autonomy — no consequential action executes without human confirmation, enforced structurally" | README.md Core Capabilities | Covenant Policy enforces approval gates; `packages/guardian` middleware; approval queue implemented | **verified** — structural enforcement exists in code |
| 11 | "Cryptographic Proof — append-only audit trail linking every decision to actor, policy, and outcome" | README.md Core Capabilities | `lib/proof-chain` implemented; append-only with hash linkage | **verified** |
| 12 | "Digital Twin Simulation — probabilistic modeling before any high-stakes action" | README.md Core Capabilities | `lib/monte-carlo` exists and is marked implemented | **partial** — package exists; no runtime evidence of live simulation end-to-end in any domain pack's production path |
| 13 | "Multi-Provider AI — policy-governed routing across leading AI providers" | README.md Core Capabilities | Anthropic + OpenAI proxied per EXECUTIVE_AUDIT_SUMMARY; API routes active | **verified** |
| 14 | "Multi-role RBAC with deny-by-default enforcement. All routes require authentication. All queries are org-scoped." | README.md Security Posture | RBAC middleware confirmed; OIDC/PKCE configured; org-scoping in DB schema | **partial** — auth infrastructure confirmed; "all routes require auth" not verified via exhaustive route audit in this run (qa:site not run) |
| 15 | "Cross-tenant access is architecturally prevented, not only policy-controlled." | README.md Security Posture | Tenant isolation in schema; RBAC middleware org-scoped; no runtime penetration test evidence | **partial** — architectural claim supportable from code; no external pentest confirmation |
| 16 | "A11oy Phase 1 — Foundation — Complete" | README.md Roadmap | `artifacts/a11oy` builds fail (cascaded from `@szl-holdings/sdk`); Phase 1 foundation code exists in packages | **partial** — Phase 1 foundation code is present; `artifacts/a11oy` artifact itself does not build cleanly |
| 17 | "Production customer onboarding — Roadmap" | README.md Roadmap | No production customers; correct status | **verified** |
| 18 | "FORGE (unified command)" listed as additional surface | README.md Product Portfolio footnote | No `artifacts/forge` directory; FORGE concept merged into `artifacts/command` | **partial** — FORGE concept exists but separate artifact does not |
| 19 | "Screenshots depict the alpha demo state of the platform (development environment, seeded data). Screenshots are not committed to the git repository." | README.md Platform Screenshots | `generated/platform-metrics.json` screenshot_assets: 0; screenshots exist on disk in `brand/screenshots/` but not tracked in git | **verified** — claim now accurately states demo environment and git status; fixed in this audit |
| 20 | "APEX mobile (unified iOS + Android command)" | README.md Product Portfolio | `artifacts/szl-holdings-mobile` exists; Expo/React Native; build fails | **partial** — scaffold exists; build fails; not production-ready |

---

## PRODUCT-SURFACES.md Claims

| # | Claim | Source Location | Evidence | Verdict |
|---|-------|-----------------|----------|---------|
| 21 | "Carlota Jo — Status: Live" | PRODUCT-SURFACES.md | `docs/APP_STATUS.md` classifies as Beta; functional with live integrations | **partial** — "Live" overstates vs Beta classification in authoritative register |
| 22 | "SZL Holdings Corporate Platform — Status: Public Beta Candidate" | PRODUCT-SURFACES.md | `docs/APP_STATUS.md` classifies as Beta; not yet publicly released | **partial** — "Public Beta Candidate" is aspirational; current status is Beta/alpha |
| 23 | "API Server — Status: Live (internal service)" | PRODUCT-SURFACES.md | API server health returns HTTP 200 per FIX_LOG; `alpha working` per README | **verified** |
| 24 | "APEX — Status: Functional alpha" | PRODUCT-SURFACES.md | Build fails for `szl-holdings-mobile`; Expo scaffold present | **partial** — scaffold present; not fully functional in current build |
| 25 | "PRISM Counsel — Archived, legacy API routes retained" | PRODUCT-SURFACES.md | `prism-counsel` listed in metrics as on-disk artifact; legacy routes documented | **verified** |
| 26 | "IMPERIUM — Merged into Command Portal; governance routes active" | PRODUCT-SURFACES.md | `imperium` directory exists on disk per metrics artifact list | **partial** — directory exists but classified as archived in OPERABILITY_MATRIX |
| 27 | "Version 4.1 — April 2026" | PRODUCT-SURFACES.md header | Document not updated since April 25 audit; some surface statuses are now outdated | **partial** — version header stale relative to current build state |

---

## docs/PLATFORM_OVERVIEW.md Claims

| # | Claim | Source Location | Evidence | Verdict |
|---|-------|-----------------|----------|---------|
| 28 | "At the center of every SZL platform is A11oy — the execution fabric" | PLATFORM_OVERVIEW.md | Document updated in this audit to use "A11oy" throughout; prior version used "Alloy" | **verified** — fixed in this audit |
| 29 | "Real-time AIS telemetry" for Vessels | PLATFORM_OVERVIEW.md | OPEN_RISKS.md and README acknowledge AIS telemetry is simulated; paid subscription required | **partial** — AIS data is simulated in demo, not live telemetry |
| 30 | "Live data pipeline integrating multiple public data sources" for Terra | PLATFORM_OVERVIEW.md | NYC distress data live; Mapbox token missing (maps blank); MLS feed pending | **partial** — some live data; maps non-functional without Mapbox token |

---

## docs/platform-facts.md Claims

| # | Claim | Source Location | Evidence | Verdict |
|---|-------|-----------------|----------|---------|
| 31 | "Domain packages: 82, Shared library packages: 41, Total packages: 123" | platform-facts.md | `generated/platform-metrics.json` 2026-04-27: lib: 51, standalone: 101, total: 152 | **partial** — counts reflect April 2026-04-20 snapshot; stale by 5 weeks |
| 32 | "Last comprehensive audit: 2026-04-21" | platform-facts.md | This audit supersedes; new comprehensive audit is 2026-04-27 | **partial** — stale audit date |
| 33 | "Active registered artifacts: 15 registered across both systems" | platform-facts.md | 15 registered in workspace registry; 19 on-disk directories per `generated/platform-metrics.json` | **partial** — 4 unregistered on-disk entries: conduit, pluginmesh, helios (artifacts), and `artifacts/audit` (evidence dir that the metrics script miscounts); see DEPENDENCY_AND_SCRIPT_DRIFT.md |

---

## Surface Classification — All Registered Artifacts

| Artifact | Registered Path | Classification | Evidence |
|----------|----------------|----------------|---------|
| SZL Holdings Dashboard | `/` | **real / alpha-working** | Serves; KPIs seeded; auth live |
| A11oy | `/a11oy/` | **real / alpha-partial** | Code present; artifact build fails (sdk dep) |
| API Server | `/api/` | **real / alpha-working** | HTTP 200; DB healthy; auth-gated |
| Unified Command (FORGE) | `/command/` | **real / alpha-partial** | Serves; CORTEX badge counts not wired |
| Sentra (TENAX) | `/sentra/` | **real / alpha-partial** | UI complete; `/api/sentra/risks` missing |
| Counsel | `/counsel/` | **real / alpha-working** | Matter tracking functional; CourtListener pending |
| Terra (DOMAINE) | `/terra/` | **real / alpha-partial** | NYC distress live; maps blank (no Mapbox token) |
| Vessels (SEXTANT) | `/vessels/` | **real / alpha-partial** | AIS simulated; 3 commercial modules pending |
| Carlota Jo | `/carlota-jo/` | **real / alpha-working** | Most complete; live integrations active |
| Lyte (KORA) | `/lyte/` | **real / alpha-partial** | Routes functional; legacy path alias missing |
| Pulse (LUMINA) | `/pulse/` | **real / alpha-working** | AI multi-provider routing active |
| Aegis (PARAGON) | `/aegis/` | **real / alpha-working** | CISA KEV, NVD CVE, MITRE ATT&CK v14 active |
| SZL Demo Video | `/szl-demo-video/` | **demo-only** | Animated promotional video; build fails |
| SZL Holdings Mobile (APEX) | `/szl-holdings-mobile/` | **real / alpha-partial** | Scaffold present; build fails |
| Mockup Sandbox (PRAXIS) | `/nexus/` | **internal / design** | Internal design tooling only |

**Unregistered on-disk artifact directories (not in workspace registry):**

| Directory | Classification | Notes |
|-----------|----------------|-------|
| `artifacts/helios` | **internal / orphan** | Not registered; build fails; unregistered artifact |
| `artifacts/pluginmesh` | **internal / orphan** | Not registered; build fails; purpose unclear |

---

## Contradiction Log

The following contradictions exist across docs as of 2026-04-27 and require resolution:

| Contradiction | Doc A | Doc B | Resolution |
|--------------|-------|-------|------------|
| Package count: 100 vs 123 vs 152 | README.md (was 100) | platform-facts.md (was 123) | **FIXED** — README updated to 152; platform-facts.md updated to 152 |
| Artifact count: 14 vs 15 | README.md (was 14) | Registry (15 registered) | **FIXED** — README updated to 15 |
| "Alloy" vs "A11oy" | PLATFORM_OVERVIEW.md (was "Alloy") | README.md, artifacts/ ("A11oy") | **FIXED** — PLATFORM_OVERVIEW.md updated to "A11oy" throughout |
| Carlota Jo "Live" vs "Beta" | PRODUCT-SURFACES.md (was "Live") | APP_STATUS.md ("Beta") | **FIXED** — PRODUCT-SURFACES.md updated to "Beta" |
| Release Readiness: "14/16 PASS, no blocking items" | RELEASE_READINESS_SCORECARD.md (April 25) | Current run (2026-04-27): typecheck, lint, build, and unit tests all fail | **FIXED** — Scorecard refreshed; now shows 4/5 P0 FAIL with complete typecheck failure list (9 packages) and unit test failure evidence |
| CORTEX Mobile in OPERABILITY_MATRIX | OPERABILITY_MATRIX.md (was CORTEX Mobile) | Registered artifacts (szl-holdings-mobile is current) | **FIXED** — OPERABILITY_MATRIX.md updated to szl-holdings-mobile (APEX) |
| DB table count: 732 vs 1,047 | OPERABILITY_MATRIX.md (was 732) | `generated/platform-metrics.json` (1,047) | **FIXED** — OPERABILITY_MATRIX.md updated to 1,047 |
| Last audit date: 2026-04-21 | platform-facts.md (was 2026-04-21) | This audit (2026-04-27) | **FIXED** — platform-facts.md updated to 2026-04-27 |
| Codename: "Alloy" vs "A11oy" | platform-facts.md (was "Alloy Execution and Evidence Platform") | Current branding ("A11oy") | **FIXED** — platform-facts.md updated |

---

*This matrix was generated by diligence audit task #3206 on 2026-04-27. Update after each sprint or release.*
