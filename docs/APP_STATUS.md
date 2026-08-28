# SZL Holdings — Application Status Register

**Date:** August 26, 2026
**Status:** Authoritative single source of truth for all artifact GA/beta/internal/archived/concept status
**Update cadence:** Update after each release or Phase completion

---

## Status Definitions

| Status | Meaning |
|---|---|
| **GA** | Generally Available — production-ready, investor/customer presentable, no known blocking issues |
| **Beta** | Core features complete; some data is seeded/mocked; presentable with clear labeling |
| **Partial** | Core structure built; significant features mocked, missing, or not wired to back-end |
| **Internal** | Operational tooling — not a customer-facing product |
| **Deprecated** | Maintained no further; content migrated elsewhere; pending removal |
| **Concept** | Directory exists but no active development; placeholder only |

---

## Web Applications

### SZL Holdings Corporate Platform
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/szl-holdings` |
| **Package** | `@workspace/szl-holdings` |
| **Status** | **Beta** |
| **Audience** | Investors, enterprise evaluators, strategic partners |
| **URL** | `/` |
| **Authentication** | Yes — Replit OIDC |
| **Live Data** | Static content live; dashboard KPIs seeded; public feed integrations active |
| **Blockers** | Autopilot header stats and genome score hardcoded — see backlog |
| **Notes** | Primary corporate and investor presence; includes Lyte business observability via `szl-holdings` workspace |

---

### A11oy — Governed Intelligence Fabric
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/a11oy` |
| **Package** | `@workspace/a11oy` |
| **Status** | **Partial** |
| **Audience** | SZL operator; enterprise evaluators after production hardening |
| **URL** | `/a11oy/`; Atelier workbench at `/a11oy/atelier` |
| **Authentication** | Runtime API key guard; local development may run without a configured key |
| **Live Data** | Atelier provider adapter may use a configured xAI Responses API or local Grok Build CLI; no mock Atelier answers |
| **Blockers** | Atelier ledger and session memory are process-local; production identity binding, durable persistence, deployment, and independent runtime witness remain incomplete |
| **Notes** | Original SZL-owned workbench with deterministic capability denials, provider disclosure, response hashing, EvidenceLedger append, tenant-scoped memory, CLI, health route, and UI. See `docs/A11OY_ATELIER.md`. |

### Aegis — Unified Defense & Intelligence
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/aegis` |
| **Package** | `@workspace/aegis` |
| **Status** | **Beta** |
| **Audience** | CISOs, SOC analysts, managed security providers |
| **URL** | `/aegis/` |
| **Authentication** | Yes — Replit OIDC |
| **Live Data** | CISA KEV, NVD CVE, MITRE ATT&CK v14, AbuseIPDB active; scenario/event data seeded |
| **Blockers** | 8 new security modules not wired to live API/case management; CISO Executive Dashboard not yet aggregated |
| **Notes** | Three unified workspaces: Defense (SOC), Command (MSP), Intelligence (AI Research) |

---

### Vessels — Maritime Intelligence
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/vessels` |
| **Package** | `@workspace/vessels` |
| **Status** | **Partial** |
| **Audience** | Fleet executives, maritime ops, commercial directors, compliance officers |
| **URL** | `/vessels/` |
| **Authentication** | Yes — Replit OIDC |
| **Live Data** | NOAA CO-OPS, Open-Meteo Marine, GDELT active; AIS telemetry simulated |
| **Blockers** | 3 new commercial modules (insurance, trading, platform) not connected to DB/API; no live AIS subscription |
| **Notes** | AIS requires paid provider ($15–40K/year for full coverage); new modules need DB wiring — see backlog |

---

### Terra — Real Estate Intelligence
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/terra` |
| **Package** | `@workspace/terra` |
| **Status** | **Beta** |
| **Audience** | NYC brokers, real estate investors, portfolio managers |
| **URL** | `/terra/` |
| **Authentication** | Yes — Replit OIDC |
| **Live Data** | NYC Open Data distress pipeline live; Census ACS, BLS, FEMA, SEC EDGAR active; portfolio/CRM data seeded |
| **Blockers** | No live MLS/CoStar integration for market data; Mapbox token not configured (maps blank) |
| **Notes** | Foundation for national expansion; NYC distress data is the live differentiator |

---

### Carlota Jo — Private Advisory
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/carlota-jo` |
| **Package** | `@workspace/carlota-jo` |
| **Status** | **GA** |
| **Audience** | Founders, executives, HNWI seeking brand/operational strategy |
| **URL** | `/carlota-jo/` |
| **Authentication** | Yes — Replit OIDC |
| **Live Data** | World Bank, BLS, HBR RSS, Microsoft Outlook Calendar/Contacts active |
| **Blockers** | None — GA |
| **Notes** | Most complete artifact; luxury advisory with live integrations and real booking workflow |

---

### Command — Unified Command Portal
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/command` |
| **Package** | `@workspace/command` |
| **Status** | **Partial** |
| **Audience** | Platform operators, internal command teams |
| **URL** | `/command/` |
| **Authentication** | Yes — Replit OIDC |
| **Live Data** | Seeded/mocked |
| **Blockers** | CORTEX cross-domain badge counts not wired to live API; new Vessels module KPIs not added to Command Overview |
| **Notes** | CORTEX unified hub; recently scaffolded; push notification deep linking not yet implemented |

---

---

## Mobile Applications

### SZL Holdings Mobile Command
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/szl-holdings-mobile` |
| **Package** | `@workspace/szl-holdings-mobile` |
| **Status** | **Beta** |
| **Audience** | Executive team, mobile command users |
| **Platform** | iOS + Android (Expo / React Native) |
| **Authentication** | Yes — Replit OIDC |
| **Blockers** | Custom splash screen and icon pending (see backlog); push notification deep linking pending |
| **Notes** | Mobile companion to the web platform; CORTEX mobile command |

### CORTEX Mobile
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/cortex-mobile` |
| **Package** | None (not scaffolded) |
| **Status** | **Concept** |
| **Platform** | iOS + Android (Expo) |
| **Blockers** | No `package.json`; Expo `app/` directory present but no build system |
| **Notes** | Planned unified CORTEX mobile experience; early development; do not deploy |

---

## Internal / Tooling

### Mockup Sandbox — Component Preview Server
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/mockup-sandbox` |
| **Package** | `@workspace/mockup-sandbox` |
| **Status** | **Internal** |
| **Audience** | Engineering, design |
| **URL** | `/__mockup` |
| **Notes** | Design system component preview; not customer-facing |

---

## Deprecated / Legacy

Five artifact directories are archived and no longer active. All are deregistered, marked with DEPRECATED.md or ARCHIVED.md, and have no active workflows.

For full artifact-by-artifact disposition records, see [`ops/frontier/disposition-matrix.md`](../ops/frontier/disposition-matrix.md).

**Summary of archived surfaces:**
- Founder portfolio site → content at `/founder` in `szl-holdings`
- Legacy ops command surface → functionality in `artifacts/command`
- Unbuilt infrastructure tool stub → merged into `artifacts/command`
- Legacy security entry point → superseded by `artifacts/aegis`
- Legal matter management platform → deregistered; backend data retained in api-server

No archived artifact should be deployed, registered, or referenced as an active product surface.

---

## API Server (Backend Infrastructure)

### API Server
| Attribute | Value |
|---|---|
| **Artifact** | `artifacts/api-server` |
| **Package** | `@workspace/api-server` |
| **Status** | **GA** |
| **Role** | Central Express backend — 347 route files (12 top-level route groups; `api.route_files: 347`, `api.route_groups_top_level: 12` per audit/source-of-truth.json), all database access, all AI integrations |
| **URL** | `/api/` |
| **Health endpoint** | `GET /api/health` |
| **Known gaps** | Zod validation: CODE-CONFIRMED 100% coverage — all route files use Zod schemas via imported schema packages (`@szl-holdings/contracts/*`, domain validation packages). Initial `21/170` finding was a false positive (grepped for `z.` only; missed imported schemas). See `audit/qa/verification-matrix.md` for corrected evidence. Integration tests not in CI. |

---

## Summary Dashboard

| Status | Count | Artifacts |
|---|---|---|
| GA | 2 | Carlota Jo, API Server |
| Beta | 4 | SZL Holdings, Aegis, Terra, SZL Holdings Mobile |
| Partial | 3 | A11oy, Vessels, Command |
| Internal | 1 | Mockup Sandbox |
| Archived | 5 | Firestorm, Prism Counsel, Stephen Site, Lyte Command Center, Imperium |
| Concept / Skeleton | 1 | Cortex Mobile |
| **Total** | **16** | |

---

*Update this document after each development phase. Last updated: August 26, 2026.*
