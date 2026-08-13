# Screenshot Catalog — SZL Holdings Platform
**Track 6 — 2026-04-21**
**Updated — 2026-07-31 (Workcell VERTICAL-RUNTIME-CONTRACTS-2026-07-31)**
**Updated — 2026-04-22 (Task #3103, README screenshot block refresh)**
**Status:** Complete disposition ledger. Per-file keep/archive executed.

---

## Summary

| Location | File Count | Disposition |
|----------|-----------|-------------|
| `docs/assets/screenshots/current/` | 7 | **REFRESHED 2026-04-22 (Task #3103)** — README screenshot block. Files renamed from product slugs to in-app codenames so captions match chrome (KORA, SEXTANT, DOMAINE, TENAX, FORGE). See Section 0 below. |
| `screenshots/approved/` | 3 committed (13 catalogued) | **KEPT** — 3 post-DB authenticated-surface captures from 2026-04-22 (Task #2890) are the only files currently committed to this directory. The 10 entries dated 2026-04-21 in Section 1 below were captured live from dev servers but were never committed to the repository; they are documented for reference only. See "Repository state" note in Section 1. |
| `screenshots/archive/` | 280 | **ARCHIVED** — legacy/pre-redesign/iteration/superseded |
| `demo-assets/screenshots/` | 9 | **KEPT in place** — actively linked from LinkedIn carousel |
| `docs/screenshots/` | 19 | **KEPT in place** — actively linked from docs/ |
| `artifacts/*/public/` | N/A | **KEPT in place** — static OpenGraph and product assets embedded in artifacts |

---

## 2026-07-31 runtime-contract release-proof disposition

| Workcell | Surface | Evidence | Screenshot disposition | Reason | Proof packet |
|----------|---------|----------|------------------------|--------|--------------|
| `VERTICAL-RUNTIME-CONTRACTS-2026-07-31` | Killinchu `/healthz`, `/version`, `/evidence`, and `/api/build-info` | Exact-SHA JSON readback, governed deployment run, and GitHub OIDC attestation | **N/A — no screenshot counts as proof** | The released change is a machine-readable runtime contract; no UI surface changed. A screenshot would weaken rather than improve exact JSON/SHA evidence. | [`VERTICAL_RUNTIME_CONTRACT_PROOF_2026-07-31.md`](frontier/VERTICAL_RUNTIME_CONTRACT_PROOF_2026-07-31.md) |

This is a full catalog disposition, not a screenshot waiver for a modified UI.
Any later UI surface associated with this release requires a fresh live capture
under the normal screenshot doctrine.

---

## Section 0: `docs/assets/screenshots/current/` — README Screenshot Block (Task #3103)

Refreshed 2026-04-22 to align filenames and visuals with the new in-app codenames referenced in `README.md` (KORA, SEXTANT, DOMAINE, TENAX, FORGE Command Portal). Files were renamed from product slugs to codenames; new captures were taken from the running dev servers so the surface chrome matches the README captions.

| Filename | Caption (README) | Source artifact | Codename in chrome | Capture date | Notes |
|----------|------------------|-----------------|--------------------|--------------|-------|
| `szl-holdings-dashboard.jpg` | SZL Holdings Dashboard | `artifacts/szl-holdings` `/` | SZL · FORGE · KORA · PARAGON · SEXTANT · DOMAINE · IMPERIUM (ecosystem ribbon) | 2026-04-22 | Refreshed. |
| `kora-praxis-command.jpg` | KORA — PRAXIS Command | `artifacts/lyte-command-center` `/` | `KORA-PROOF · LIVE` chip; `KORA DECISION INTELLIGENCE` rail; `KORA` row labels | 2026-04-22 | Renamed from `lyte-prism-command.jpg`. New capture shows KORA-branded chrome and live KPI tiles. |
| `sextant-fleet-command.jpg` | SEXTANT — Fleet Command | `artifacts/vessels` `/` | Vessels marketing landing with live fleet ribbon (SEXTANT-class capture; codename rollout to chrome in progress) | 2026-04-22 | Renamed from `vessels-fleet-command.jpg`. |
| `domaine-deal-pipeline.jpg` | DOMAINE — Deal Pipeline | `artifacts/terra` `/` | `DOMAINE PROPERTY INTELLIGENCE` lockup in nav | 2026-04-22 | Renamed from `terra-deal-pipeline.jpg`. |
| `carlota-jo-client-portal.jpg` | Carlota Jo — Client Portal | `artifacts/carlota-jo` `/` | `Carlota Jo · PREMIUM SERVICE BRAND` (codename: Carlota Jo, no rebrand) | 2026-04-22 | Refreshed. |
| `forge-command-portal-executive.jpg` | FORGE Command Portal — Executive View | `artifacts/command` `/` | FORGE Command Portal (executive view) | 2026-04-21 | Renamed from `command-portal-executive.jpg`. Re-capture deferred — `artifacts/command: web` workflow currently fails to bind its port; previous live capture retained until workflow is fixed. |
| `tenax-soc-command.jpg` | TENAX — SOC Command | `artifacts/sentra` `/` | `TENAX Cyber Resilience` chip; `TENAX Cyber Resilience Command · Powered by FORGE` lockup | 2026-04-22 | Renamed from `sentra-soc-command.jpg`. |

**Slug-to-codename mapping (canonical):**

| Artifact slug | In-app codename |
|---------------|-----------------|
| `lyte-command-center` | KORA (PRAXIS Command) |
| `vessels` | SEXTANT |
| `terra` | DOMAINE |
| `sentra` | TENAX |
| `command` | FORGE Command Portal |
| `szl-holdings` | SZL Holdings (parent) |
| `carlota-jo` | Carlota Jo (no rebrand) |

**Disposition actions executed 2026-04-21:**
- Created `screenshots/archive/` with mirror of original directory structure.
- Moved 280 legacy files (all of `screenshots/` root, all named subdirs, all of `launch-shots/`) into `screenshots/archive/`.
- Only `screenshots/approved/` (10 files) and `screenshots/README.md` remain active at root.

---

## Disposition Criteria

| Criterion | Action |
|-----------|--------|
| Post-redesign, live surface, captured 2026-04-21 | KEEP in `approved/` |
| Actively linked from docs/, demo-assets/ | KEEP in place |
| Pre-redesign (Design System v1 or earlier) | ARCHIVE |
| Archived/renamed product (Firestorm, Alloy, Prism Counsel, CORTEX, Stephen Lutar site) | ARCHIVE |
| Design iteration / variant shot | ARCHIVE |
| Duplicate or near-duplicate (multiple `-fresh`, `-clean` variants) | ARCHIVE |
| Unrelated personal site | ARCHIVE |
| Test artifact | ARCHIVE |

---

## Section 1: `screenshots/approved/` — 13 Verified Captures (KEPT)

All 10 original captures taken live from running dev servers, 2026-04-21. 3 new authenticated-surface captures added 2026-04-22 after Task #2890 provisioned `DATABASE_URL` and seeded the demo data set (6 organizations, 7 users, 205 lyte_signals, 5 vessels, 13 ports, 8 terra_properties). Post-redesign Design System v2.

**Repository state (2026-04-22):** Only the 3 captures dated `2026-04-22` are committed to `screenshots/approved/`. The 10 captures dated `2026-04-21` listed below were captured live from the running dev servers and verified at the time but were not committed to the repository (the directory was empty before Task #2890). They are documented here for traceability and can be re-captured deterministically by restarting the relevant workflows and running the surface-capture flow described in `audit/task-2890-evidence.md`.

| Filename | Surface | URL | Environment | Data State | Notes |
|----------|---------|-----|-------------|------------|-------|
| `szl-holdings-home-2026-04-21.jpg` | SZL Holdings — Home | `/` | dev | Public | Hero, nav, product grid. Design System v2. |
| `szl-holdings-ecosystem-2026-04-21.jpg` | SZL Holdings — Ecosystem | `/ecosystem` | dev | Public | Full product ecosystem page. |
| `szl-holdings-trust-2026-04-21.jpg` | SZL Holdings — Trust | `/trust` | dev | Public | Trust center, compliance, Proof Chain overview. |
| `sentra-home-2026-04-21.jpg` | Sentra — Cyber Resilience | `/` | dev | Public | Public landing renders (unauthenticated). Dashboard requires auth + DATABASE_URL. Screenshot shows public landing / sign-in surface. |
| `vessels-home-2026-04-21.jpg` | Vessels — Maritime Intelligence | `/` | dev | Public | Public landing renders (unauthenticated). Dashboard requires auth + DATABASE_URL. Screenshot shows public landing / sign-in surface. |
| `counsel-home-2026-04-21.jpg` | Counsel — Legal Matter Command | `/` | dev | Public | Public landing renders (unauthenticated). Dashboard requires auth + DATABASE_URL. Screenshot shows public landing / sign-in surface. |
| `terra-home-2026-04-21.jpg` | Terra — Real Estate Intelligence | `/` | dev | Public | Public landing renders (unauthenticated). Dashboard requires auth + DATABASE_URL. Screenshot shows public landing / sign-in surface. |
| `carlota-jo-home-2026-04-21.jpg` | Carlota Jo Consulting | `/` | dev | Public | Full public marketing homepage. No auth required. Fully visible without DATABASE_URL. |
| `pulse-home-2026-04-21.jpg` | Pulse — AI Executive Briefing | `/` | dev | Public | Public landing renders (unauthenticated). Dashboard requires auth + DATABASE_URL. Screenshot shows public landing / sign-in surface. |
| `aegis-home-2026-04-21.jpg` | Aegis — Investor Pitch Deck | `/` | dev | Public | Full pitch deck slide view. |
| `lyte-command-center-2026-04-22.jpg` | Lyte — Decision Intelligence (authenticated) | `/lyte/` | dev | **Seeded** — 205 lyte_signals, KORA decision intelligence summary, Vantex Acquisition risk cluster | First authenticated-surface capture after Task #2890 DB provisioning. Shows live KPIs, signal feed, decision backlog populated from seed. |
| `vessels-2026-04-22.jpg` | Vessels — Maritime Intelligence (authenticated landing + live fleet) | `/vessels/` | dev | **Seeded** — 5 vessels, 13 ports, vessel events; "LIVE FLEET — 214 VESSELS TRACKED" widget rendering | First post-DB capture. Hero plus live fleet table with MV Horizon Singapore→Rotterdam. |
| `terra-2026-04-22.jpg` | Terra — Real Estate Intelligence | `/terra/` | dev | **Seeded** — 8 demo terra_properties (CA/NY/IL/FL/MA/CO trophy assets) | First post-DB capture. Domaine landing with property intelligence positioning. Property dashboard reachable behind auth. |

---

## Section 2: `screenshots/archive/` — 280 Archived Files

All files in `screenshots/archive/` are retained for historical reference. None are referenced in any active public document after Track 6.

### 2a: `archive/launch-shots/` — 7 files
Prior curated launch set. Superseded by `screenshots/approved/`.

| Filename | Surface | Disposition | Reason |
|----------|---------|-------------|--------|
| `01-szl-home.jpg` | SZL Holdings Home | ARCHIVED | Pre-v2 design generation |
| `02-pulse.jpg` | Pulse | ARCHIVED | Pre-v2 design generation |
| `03-aegis.jpg` | Aegis (prior positioning) | ARCHIVED | Aegis was defense SOC at time of capture; now investor pitch deck |
| `04-vessels.jpg` | Vessels | ARCHIVED | Pre-v2 design generation |
| `05-terra.jpg` | Terra | ARCHIVED | Pre-v2 design generation |
| `06-carlota-jo.jpg` | Carlota Jo | ARCHIVED | Pre-v2 design generation |
| `07-command.jpg` | Command | ARCHIVED | Pre-v2; Command currently failed (startup timeout) |

### 2b: `archive/root/` — 156 files
Unorganized dump from prior development iterations. Mixed products, design variants, and duplicates.

#### Aegis/Firestorm — archived defense product
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `aegis-command-clean.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-command-home-fresh.jpg` | ARCHIVED | Archived Firestorm/SOC product — design variant |
| `aegis-command-home.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-command.jpg` | ARCHIVED | Archived Firestorm/SOC product — was removed from README in Track 6 |
| `aegis-defense.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-demo-dashboard.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-enterprise-demo.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-executive-board.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-firestorm.jpg` | ARCHIVED | Firestorm — superseded product name |
| `aegis-hero-clean.jpg` | ARCHIVED | Design variant — pre-redesign |
| `aegis-hero-fresh.jpg` | ARCHIVED | Design variant — pre-redesign |
| `aegis-hero.jpg` | ARCHIVED | Pre-redesign |
| `aegis-incidents.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-marketing.jpg` | ARCHIVED | Pre-v2 marketing screenshot |
| `aegis-pricing-clean.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-quipu-command.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-soc-dashboard.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-soc.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `aegis-threat-intel.jpg` | ARCHIVED | Archived Firestorm/SOC product |
| `firestorm-aegis.jpg` | ARCHIVED | Firestorm — superseded product name |
| `02-aegis-firestorm.jpg` | ARCHIVED | Numbered series; archived Firestorm product |
| `06-aegis-firestorm.jpg` | ARCHIVED | Numbered series; duplicate/variant |
| `gh-aegis-landing.jpg` | ARCHIVED | GitHub/PR preview screenshot — not product screenshot |

#### Alloy Platform — archived product name
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `alloy-connectors.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-dag.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-decisions.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-execution-history.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-governance.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-home.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-operator-control.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-platform.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-public-page.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-signals.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-skills.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-workflows.jpg` | ARCHIVED | Alloy — archived product name |
| `02-alloy-platform.jpg` | ARCHIVED | Numbered series; archived Alloy product |
| `03-alloy-full-page.jpg` | ARCHIVED | Numbered series; archived Alloy product |
| `11-alloy-evolution-radar.jpg` | ARCHIVED | Numbered series; archived Alloy product |

#### Carlota Jo — pre-redesign
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `carlota-jo-dashboard-clean.jpg` | ARCHIVED | Pre-redesign design variant |
| `carlota-jo-dashboard.jpg` | ARCHIVED | Pre-redesign |
| `carlota-jo-hero-clean.jpg` | ARCHIVED | Design variant — pre-v2 |
| `carlota-jo-hero-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `carlota-jo-hero.jpg` | ARCHIVED | Pre-redesign |
| `carlota-jo.jpg` | ARCHIVED | Pre-redesign |
| `carlota-jo-mobile.jpg` | ARCHIVED | Pre-redesign mobile |
| `carlota-jo-services-clean.jpg` | ARCHIVED | Design variant — pre-v2 |
| `carlota-jo-services.jpg` | ARCHIVED | Pre-redesign |
| `carlota-jo-who-we-serve-clean.jpg` | ARCHIVED | Design variant — pre-v2 |
| `carlota-jo-who-we-serve-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `carlota-jo-who-we-serve.jpg` | ARCHIVED | Pre-redesign |
| `07-carlota-jo.jpg` | ARCHIVED | Numbered series; pre-redesign |
| `09-carlota-jo.jpg` | ARCHIVED | Numbered series; duplicate/variant |
| `gh-carlota-landing.jpg` | ARCHIVED | GitHub/PR preview screenshot |

#### GitHub/PR previews
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `gh-investor-dashboard.jpg` | ARCHIVED | GitHub/PR preview screenshot — not product screenshot |
| `gh-lyte-landing.jpg` | ARCHIVED | GitHub/PR preview screenshot |
| `gh-prism-landing.jpg` | ARCHIVED | GitHub/PR preview; Prism = old product name |
| `gh-stephen-landing.jpg` | ARCHIVED | GitHub/PR preview; personal site |
| `gh-szl-landing.jpg` | ARCHIVED | GitHub/PR preview screenshot |
| `gh-terra-landing.jpg` | ARCHIVED | GitHub/PR preview screenshot |
| `gh-vessels-landing.jpg` | ARCHIVED | GitHub/PR preview screenshot |

#### Investor dashboard
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `investor-dashboard-full.jpg` | ARCHIVED | Pre-v2 investor portal |
| `investor-dashboard-hero.jpg` | ARCHIVED | Pre-v2 investor portal |
| `investor-dashboard.jpg` | ARCHIVED | Pre-v2 investor portal |
| `investor-final.jpg` | ARCHIVED | Pre-v2 investor portal |
| `investor-hero.jpg` | ARCHIVED | Pre-v2 investor portal |

#### Lyte — pre-redesign
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `lyte-blocker-board.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-board-clean.jpg` | ARCHIVED | Design variant — pre-v2 |
| `lyte-board-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `lyte-board-mode.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-capabilities.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-command-center.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-dashboard.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-demo-dashboard.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-demo-live.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-exec-command.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-exec-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `lyte-hero-clean.jpg` | ARCHIVED | Design variant — pre-v2 |
| `lyte-hero.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-overview.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-platform.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-signals.jpg` | ARCHIVED | Pre-redesign Lyte |
| `04-lyte-command-center.jpg` | ARCHIVED | Numbered series; pre-redesign |

#### Nerve center
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `nerve-center.jpg` | ARCHIVED | Archived product concept; not in current artifact lineup |

#### Prism Counsel — archived product name
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `prism-counsel-capabilities.jpg` | ARCHIVED | Prism Counsel — product renamed to Counsel |
| `prism-counsel-dashboard.jpg` | ARCHIVED | Prism Counsel — product renamed to Counsel |
| `prism-counsel-demo-clean.jpg` | ARCHIVED | Design variant; product renamed |
| `prism-counsel-demo-interior.jpg` | ARCHIVED | Prism Counsel — product renamed |
| `prism-counsel-demo.jpg` | ARCHIVED | Prism Counsel — product renamed |
| `prism-counsel-full-demo.jpg` | ARCHIVED | Prism Counsel — product renamed |
| `prism-counsel-hero.jpg` | ARCHIVED | Prism Counsel — product renamed |
| `prism-counsel.jpg` | ARCHIVED | Prism Counsel — product renamed |
| `prism-counsel-marketing.jpg` | ARCHIVED | Prism Counsel — product renamed |
| `prism-counsel-use-cases.jpg` | ARCHIVED | Prism Counsel — product renamed |
| `08-prism-counsel.jpg` | ARCHIVED | Numbered series; product renamed |

#### SZL Holdings — pre-redesign
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `szl-holdings-command.jpg` | ARCHIVED | Pre-redesign |
| `szl-holdings-dashboard.jpg` | ARCHIVED | Pre-redesign |
| `szl-holdings-ecosystem-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `szl-holdings-ecosystem.jpg` | ARCHIVED | Pre-redesign |
| `szl-holdings-founder.jpg` | ARCHIVED | Pre-redesign |
| `szl-holdings-hero-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `szl-holdings-hero.jpg` | ARCHIVED | Pre-redesign |
| `szl-holdings.jpg` | ARCHIVED | Pre-redesign |
| `szl-holdings-platform.jpg` | ARCHIVED | Pre-redesign |
| `01-szl-holdings-dashboard.jpg` | ARCHIVED | Numbered series; pre-redesign |
| `01-szl-holdings-home.jpg` | ARCHIVED | Numbered series; pre-redesign |
| `13-szl-founder.jpg` | ARCHIVED | Numbered series; pre-redesign |
| `szl-portfolio-linkedin.pdf` | ARCHIVED | PDF — not a screenshot; LinkedIn carousel export |

#### Stephen Lutar personal site
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `stephen-case-studies.jpg` | ARCHIVED | Personal site — not part of SZL Holdings platform |
| `stephen-hero-clean.jpg` | ARCHIVED | Design variant; personal site |
| `stephen-hero-fresh.jpg` | ARCHIVED | Design variant; personal site |
| `stephen-hero.jpg` | ARCHIVED | Personal site |
| `stephen-lutar.jpg` | ARCHIVED | Personal site |
| `stephen-mobile.jpg` | ARCHIVED | Personal site |
| `stephen-now.jpg` | ARCHIVED | Personal site |
| `stephen-site-fresh.jpg` | ARCHIVED | Design variant; personal site |
| `stephen-site.jpg` | ARCHIVED | Personal site |
| `stephen-work-clean.jpg` | ARCHIVED | Design variant; personal site |
| `stephen-work.jpg` | ARCHIVED | Personal site |
| `06-stephen-site.jpg` | ARCHIVED | Numbered series; personal site |
| `10-stephen-lutar.jpg` | ARCHIVED | Numbered series; personal site |
| `12-stephen-investor.jpg` | ARCHIVED | Numbered series; personal site with investor nav |
| `stephen-home-with-investor-nav.jpg` | ARCHIVED | Personal site with investor navigation overlay |

#### Terra — pre-redesign
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `terra-alloy-intelligence.jpg` | ARCHIVED | Pre-redesign; references old Alloy product |
| `terra-app-dashboard.jpg` | ARCHIVED | Pre-redesign Terra |
| `terra-dashboard.jpg` | ARCHIVED | Pre-redesign Terra |
| `terra-doctrine.jpg` | ARCHIVED | Pre-redesign Terra |
| `terra-hero.jpg` | ARCHIVED | Pre-redesign Terra |
| `terra.jpg` | ARCHIVED | Pre-redesign Terra |
| `terra-mobile.jpg` | ARCHIVED | Pre-redesign Terra mobile |
| `terra-pipeline.jpg` | ARCHIVED | Pre-redesign Terra |
| `terra-platform.jpg` | ARCHIVED | Pre-redesign Terra |
| `terra-realestate.jpg` | ARCHIVED | Pre-redesign Terra |
| `04-terra-real-estate.jpg` | ARCHIVED | Numbered series; pre-redesign |
| `07-terra-real-estate.jpg` | ARCHIVED | Numbered series; duplicate/variant |

#### Vessels — pre-redesign
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `vessels-capabilities.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-command.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-command-mode.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-dashboard-clean.jpg` | ARCHIVED | Design variant — pre-v2 |
| `vessels-dashboard.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-demo-interior.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-fleet-clean.jpg` | ARCHIVED | Design variant — pre-v2 |
| `vessels-fleet-command.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-fleet.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-fleet-map.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-hero-clean.jpg` | ARCHIVED | Design variant — pre-v2 |
| `vessels-hero.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-maritime.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-marketing-home.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-mobile.jpg` | ARCHIVED | Pre-redesign Vessels mobile |
| `vessels-platform.jpg` | ARCHIVED | Pre-redesign Vessels |
| `vessels-use-cases.jpg` | ARCHIVED | Pre-redesign Vessels |
| `03-vessels-maritime.jpg` | ARCHIVED | Numbered series; pre-redesign |
| `05-vessels-maritime.jpg` | ARCHIVED | Numbered series; duplicate/variant |

#### Miscellaneous
| Filename | Disposition | Reason |
|----------|-------------|--------|
| `05-command-portal.jpg` | ARCHIVED | Numbered series; pre-v2 Command portal |
| `test-root-access.jpg` | ARCHIVED | Test artifact — no product value |

---

### 2c: `archive/aegis/` — 11 image files + 2 README files
Aegis SOC/defense command center screenshots. This product surface (Firestorm/SOC) is archived. Aegis is now the investor pitch deck artifact.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `01-soc-dashboard.jpg` | ARCHIVED | Firestorm SOC — archived product surface |
| `02b-aegis-marketing.jpg` | ARCHIVED | Firestorm marketing — archived |
| `02-enterprise-demo.jpg` | ARCHIVED | Firestorm enterprise demo — archived |
| `02-soc-command.jpg` | ARCHIVED | Firestorm SOC — archived |
| `02-soc-dashboard.jpg` | ARCHIVED | Firestorm SOC — duplicate of 01 |
| `03-convergence.jpg` | ARCHIVED | Firestorm — archived |
| `03-incidents.jpg` | ARCHIVED | Firestorm incidents — archived |
| `04-architecture.jpg` | ARCHIVED | Firestorm architecture — archived |
| `04-mitre-attack.jpg` | ARCHIVED | MITRE ATT&CK view — archived |
| `05-citadel-war-room.jpg` | ARCHIVED | Firestorm Citadel — archived |
| `05-pricing.jpg` | ARCHIVED | Firestorm pricing — archived |
| `README.md` | ARCHIVED | Index for archived set |
| `README.txt` | ARCHIVED | Index for archived set |

---

### 2d: `archive/alloy-platform/` — 12 files
Alloy was a prior product name. Now internal. No current public-facing artifact.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `alloy-analytics.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-command-home.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-connectors.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-decisions.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-governance.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-operator-control.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-operators.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-public-page.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-signals.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-skills.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-workflows.jpg` | ARCHIVED | Alloy — archived product name |
| `alloy-workspace.jpg` | ARCHIVED | Alloy — archived product name |

---

### 2e: `archive/carlota-jo/` — 5 image files + 2 README files
Pre-redesign Carlota Jo screenshots. Superseded by `approved/carlota-jo-home-2026-04-21.jpg`.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `01-carlota-jo-home.jpg` | ARCHIVED | Pre-redesign |
| `02-services.jpg` | ARCHIVED | Pre-redesign |
| `03-approach.jpg` | ARCHIVED | Pre-redesign |
| `04-who-we-serve.jpg` | ARCHIVED | Pre-redesign |
| `05-advisory-intel.jpg` | ARCHIVED | Pre-redesign |
| `README.md` | ARCHIVED | Index for archived set |
| `README.txt` | ARCHIVED | Index for archived set |

---

### 2f: `archive/command/` — 5 image files + 1 README file
Pre-v2 Command portal screenshots. Command artifact currently failed (startup timeout).

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `01-unified-command-home.jpg` | ARCHIVED | Pre-v2 design |
| `02-strategy-dashboard.jpg` | ARCHIVED | Pre-v2 design |
| `03-executive-briefing.jpg` | ARCHIVED | Pre-v2 design |
| `04-operations-center.jpg` | ARCHIVED | Pre-v2 design |
| `05-blocker-board.jpg` | ARCHIVED | Pre-v2 design |
| `README.md` | ARCHIVED | Index for archived set |

---

### 2g: `archive/cortex-mobile/` — 6 image files + 1 README file
CORTEX mobile — deferred product. Not in current artifact lineup as a deployed product.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `advisory.jpg` | ARCHIVED | Deferred mobile product |
| `defense-aegis.jpg` | ARCHIVED | Deferred mobile product; references archived Aegis SOC |
| `fleet.jpg` | ARCHIVED | Deferred mobile product |
| `home-dashboard.jpg` | ARCHIVED | Deferred mobile product |
| `operations.jpg` | ARCHIVED | Deferred mobile product |
| `portfolio.jpg` | ARCHIVED | Deferred mobile product |
| `README.md` | ARCHIVED | Index for archived set |

---

### 2h: `archive/lyte/` — 5 image files + 2 README files
Pre-redesign Lyte Command Center screenshots. Lyte artifact exists but is not started.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `01-home-dashboard.jpg` | ARCHIVED | Pre-redesign |
| `02-platform-pulse.jpg` | ARCHIVED | Pre-redesign |
| `03-blocker-board.jpg` | ARCHIVED | Pre-redesign |
| `04-performance-intelligence.jpg` | ARCHIVED | Pre-redesign |
| `05-executive-briefing.jpg` | ARCHIVED | Pre-redesign |
| `README.md` | ARCHIVED | Index for archived set |
| `README.txt` | ARCHIVED | Index for archived set |

---

### 2i: `archive/mobile-apps/` — 7 files
Pre-redesign mobile app screenshots (mixed products).

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `aegis-mobile-home.jpg` | ARCHIVED | Archived Aegis SOC mobile; pre-redesign |
| `carlota-jo-mobile-home.jpg` | ARCHIVED | Pre-redesign mobile |
| `stephen-mobile-home.jpg` | ARCHIVED | Personal site mobile; not SZL Holdings product |
| `terra-mobile-home.jpg` | ARCHIVED | Pre-redesign Terra mobile |
| `terra-mobile-map.jpg` | ARCHIVED | Pre-redesign Terra mobile |
| `vessels-mobile-fleet.jpg` | ARCHIVED | Pre-redesign Vessels mobile |
| `vessels-mobile-home.jpg` | ARCHIVED | Pre-redesign Vessels mobile |

---

### 2j: `archive/szl-holdings/` — 7 image files + 1 README file
Pre-v2 SZL Holdings dashboard screenshots.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `01-home-dashboard.jpg` | ARCHIVED | Pre-v2 design generation |
| `02-platform-overview.jpg` | ARCHIVED | Pre-v2 design generation |
| `02-portfolio-dashboard.jpg` | ARCHIVED | Pre-v2 design generation |
| `03-app-ecosystem.jpg` | ARCHIVED | Pre-v2 design generation |
| `03-forge.jpg` | ARCHIVED | Pre-v2; references Forge — archived concept |
| `04-solutions-aegis.jpg` | ARCHIVED | Pre-v2; Aegis now investor pitch deck |
| `05-solutions-vessels.jpg` | ARCHIVED | Pre-v2 design generation |
| `README.md` | ARCHIVED | Index for archived set |

---

### 2k: `archive/terra/` — 5 image files + 2 README files
Pre-redesign Terra screenshots. Superseded by `approved/terra-home-2026-04-21.jpg`.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `01-terra-home.jpg` | ARCHIVED | Pre-redesign |
| `02-property-dashboard.jpg` | ARCHIVED | Pre-redesign |
| `03-deal-flow.jpg` | ARCHIVED | Pre-redesign |
| `04-market-analytics.jpg` | ARCHIVED | Pre-redesign |
| `05-distress-engine.jpg` | ARCHIVED | Pre-redesign |
| `README.md` | ARCHIVED | Index for archived set |
| `README.txt` | ARCHIVED | Index for archived set |

---

### 2l: `archive/vessels/` — 7 image files + 2 README files
Pre-redesign Vessels screenshots. Superseded by `approved/vessels-home-2026-04-21.jpg`.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `01-vessels-home.jpg` | ARCHIVED | Pre-redesign |
| `02-fleet-dashboard.jpg` | ARCHIVED | Pre-redesign |
| `03-fleet-map.jpg` | ARCHIVED | Pre-redesign |
| `04-voyage-economics.jpg` | ARCHIVED | Pre-redesign |
| `05-exceptions-center.jpg` | ARCHIVED | Pre-redesign |
| `06-compliance.jpg` | ARCHIVED | Pre-redesign |
| `06-port-intelligence.jpg` | ARCHIVED | Pre-redesign; duplicate number |
| `README.md` | ARCHIVED | Index for archived set |
| `README.txt` | ARCHIVED | Index for archived set |

---

### 2m: `archive/web-apps/` — 33 files
Design iteration screenshots. Mixed products, variants from iterative dev sessions.

| Filename | Disposition | Reason |
|----------|-------------|--------|
| `aegis-command-fresh.jpg` | ARCHIVED | Archived Firestorm/SOC; design variant |
| `aegis-firestorm-hero.jpg` | ARCHIVED | Archived Firestorm product |
| `aegis-hero.jpg` | ARCHIVED | Pre-redesign |
| `aegis-home-fresh.jpg` | ARCHIVED | Design variant |
| `aegis-soc-dashboard.jpg` | ARCHIVED | Archived SOC product |
| `aegis-soc-fresh.jpg` | ARCHIVED | Archived SOC product; design variant |
| `carlota-jo-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `carlota-jo-hero.jpg` | ARCHIVED | Pre-redesign |
| `carlota-jo-operator.jpg` | ARCHIVED | Pre-redesign |
| `command-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `lyte-alloy-actions.jpg` | ARCHIVED | Pre-redesign; references archived Alloy |
| `lyte-command-center-hero.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-executive-command.jpg` | ARCHIVED | Pre-redesign Lyte |
| `lyte-hero.jpg` | ARCHIVED | Pre-redesign Lyte |
| `prism-counsel-demo.jpg` | ARCHIVED | Prism Counsel — product renamed to Counsel |
| `prism-counsel-hero.jpg` | ARCHIVED | Prism Counsel — product renamed to Counsel |
| `stephen-hero.jpg` | ARCHIVED | Personal site — not SZL Holdings product |
| `stephen-lutar-hero.jpg` | ARCHIVED | Personal site — not SZL Holdings product |
| `szl-holdings-dashboard-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `szl-holdings-demo-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `szl-holdings-ecosystem-fresh-new.jpg` | ARCHIVED | Design variant — pre-v2 |
| `szl-holdings-hero.jpg` | ARCHIVED | Pre-redesign |
| `szl-holdings-platform-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `terra-dashboard-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `terra-dashboard.jpg` | ARCHIVED | Pre-redesign |
| `terra-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `terra-hero.jpg` | ARCHIVED | Pre-redesign |
| `terra-pipeline.jpg` | ARCHIVED | Pre-redesign |
| `vessels-fleet-command-fresh.jpg` | ARCHIVED | Design variant — pre-v2 |
| `vessels-fleet-command.jpg` | ARCHIVED | Pre-redesign |
| `vessels-fleet.jpg` | ARCHIVED | Pre-redesign |
| `vessels-hero.jpg` | ARCHIVED | Pre-redesign |
| `vessels.jpg` | ARCHIVED | Pre-redesign |

---

## Section 3: `demo-assets/screenshots/` — 9 Files (KEPT in place)

Actively linked from `demo-assets/linkedin-carousel.md` and `demo-assets/generate-carousel.mjs`. These are the hero images used in the LinkedIn carousel deck.

| Filename | Surface | Disposition | Notes |
|----------|---------|-------------|-------|
| `carlota-jo-hero.jpg` | Carlota Jo | KEPT in place | LinkedIn carousel asset |
| `command-hero.jpg` | Command | KEPT in place | LinkedIn carousel asset |
| `firestorm-hero.jpg` | Firestorm/Aegis | KEPT in place | LinkedIn carousel asset — note product rename |
| `lyte-hero.jpg` | Lyte | KEPT in place | LinkedIn carousel asset |
| `prism-counsel-hero.jpg` | Prism Counsel/Counsel | KEPT in place | LinkedIn carousel asset — note product rename |
| `stephen-site-hero.jpg` | Stephen Lutar site | KEPT in place | LinkedIn carousel asset |
| `szl-holdings-hero.jpg` | SZL Holdings | KEPT in place | LinkedIn carousel asset |
| `terra-hero.jpg` | Terra | KEPT in place | LinkedIn carousel asset |
| `vessels-hero.jpg` | Vessels | KEPT in place | LinkedIn carousel asset |

**Note:** Some LinkedIn carousel assets reference archived product names (Firestorm, Prism Counsel). They are kept as-is since they are historical marketing materials, not product documentation.

---

## Section 4: `docs/screenshots/` — 19 Files (KEPT in place)

Actively linked from documentation in `docs/`. These support the trust, platform, and solution documentation pages.

| Filename | Surface | Disposition | Notes |
|----------|---------|-------------|-------|
| `admin/szl-holdings-admin-command-center.jpg` | SZL Holdings admin | KEPT in place | Docs reference |
| `admin/szl-holdings-admin.jpg` | SZL Holdings admin | KEPT in place | Docs reference |
| `mobile/cortex-mobile-home.jpg` | CORTEX mobile | KEPT in place | Docs reference; mobile product deferred |
| `platform/szl-holdings-architecture.jpg` | Architecture | KEPT in place | Docs reference |
| `platform/szl-holdings-company.jpg` | Company overview | KEPT in place | Docs reference |
| `platform/szl-holdings-home.jpg` | SZL Holdings home | KEPT in place | Docs reference |
| `platform/szl-holdings-platform.jpg` | Platform overview | KEPT in place | Docs reference |
| `platform/szl-holdings-solutions.jpg` | Solutions | KEPT in place | Docs reference |
| `platform/szl-holdings-trust-ai.jpg` | Trust — AI | KEPT in place | Docs reference |
| `platform/szl-holdings-trust-approvals.jpg` | Trust — Approvals | KEPT in place | Docs reference |
| `platform/szl-holdings-trust-architecture.jpg` | Trust — Architecture | KEPT in place | Docs reference |
| `platform/szl-holdings-trust.jpg` | Trust overview | KEPT in place | Docs reference |
| `platform/szl-holdings-trust-operations.jpg` | Trust — Operations | KEPT in place | Docs reference |
| `platform/szl-holdings-trust-security.jpg` | Trust — Security | KEPT in place | Docs reference |
| `solutions/carlota-jo.jpg` | Carlota Jo | KEPT in place | Docs reference |
| `solutions/sentra-cyber-resilience.jpg` | Sentra | KEPT in place | Docs reference |
| `solutions/szl-holdings-solutions.jpg` | Solutions page | KEPT in place | Docs reference |
| `solutions/terra-real-estate.jpg` | Terra | KEPT in place | Docs reference |
| `solutions/vessels-maritime-intelligence.jpg` | Vessels | KEPT in place | Docs reference |

**Note:** `docs/screenshots/manifest.md` provides the manifest for this directory. File is retained.

---

## README Asset Alignment

The README Screens section references images under `assets/readme/products/`. This catalog audited the references as shipped after Track 6 edits:

| README Reference | File Exists? | As-Shipped Status |
|-----------------|-------------|-------------------|
| `szl-holdings-dashboard.jpg` | ✅ | Active in README — represents SZL Holdings |
| `sentra-cyber-resilience.jpg` | ✅ | Active in README — represents Sentra |
| `counsel-legal-command.jpg` | ✅ | Active in README — represents Counsel |
| `aegis-command.jpg` | ✅ (file on disk) | **REMOVED from README in Track 6.** Was pointing to archived Firestorm/defense surface, not the current investor pitch deck. File remains on disk but is no longer referenced in any public doc. |
| `vessels-maritime.jpg` | ✅ | Active in README — represents Vessels |
| `terra-real-estate.jpg` | ✅ | Active in README — represents Terra |
| `command-portal.jpg` | ✅ | Active in README — represents Command Portal |
| `cortex-mobile.jpg` | ✅ | Active in README — CORTEX mobile deferred; this is a design/mock asset |

**Current state:** README Screens section contains 7 images (aegis-command.jpg removed). The embedded images (`assets/readme/products/`) are pre-v2 design generation assets. The README note explicitly labels them as such and directs readers to `screenshots/approved/` for verified current captures. Replacement with `screenshots/approved/` assets is tracked as follow-up task #2895.

---

## Artifact-Local Image Assets

Artifact `public/` and `dist/public/` directories contain static assets embedded in the artifact builds. These are not screenshots — they are OpenGraph images and in-product assets. They are KEPT in place as part of the build artifacts.

| Location | Count | Type | Status |
|----------|-------|------|--------|
| `artifacts/*/public/opengraph.jpg` | 11 | OpenGraph social card | KEPT — embedded in artifact build |
| `artifacts/szl-holdings/public/og/og-*.jpg` | 13 | Per-page OpenGraph cards | KEPT — embedded in artifact build |
| `artifacts/szl-holdings/public/prism-counsel/screenshot-*.jpg` | 6 | In-product screenshots | KEPT — embedded in artifact build |
| `artifacts/lyte-command-center/public/images/exec-bg.png` | 1 | Background image | KEPT — embedded in artifact build |
| `artifacts/szl-holdings-mobile/assets/images/*.png` | 3 | App icons | KEPT — embedded in artifact build |

---

*Catalog generated: 2026-04-21. All numeric claims verifiable by `find screenshots/ -type f | wc -l`.*

---

## SDA canonical verifier repair — 2026-07-22

| Filename | Route | Surface | Capture date | Captured by | Workcell | Proof level | Status | Notes |
|----------|-------|---------|--------------|-------------|----------|-------------|--------|-------|
| `docs/assets/screenshots/current/sda-canonical-verifier-2026-07-22.png` | `http://127.0.0.1:8765/proof-harness.html` | SDA ask-the-fabric receipt verifier | 2026-07-22 | CodexSmith | `SDA-CANONICAL-VERIFIER-20260722` | 4 | current | Live browser capture of the patched widget calling the canonical a11oy endpoint. The sample is explicitly unsigned and the returned `INCONCLUSIVE`, `UNSIGNED-LOCAL`, and `UNAVAILABLE` states are visibly non-green. Temporary proof harness removed after capture. |

---

## P0 Series A local successor UI evidence - 2026-08-11

| Filename | Route | Width | Capture date | Captured by | Workcell | Proof level | Status | Notes |
|----------|-------|------:|--------------|-------------|----------|-------------|--------|-------|
| `audit/screenshots/series-a-local-2026-08-11/a11oy-series-a-320.png` | `http://127.0.0.1:4128/a11oy/start` | 320 | 2026-08-11 | Codex | `P0-SERIES-A-PRODUCT-WIRING-20260811` | DEMONSTRATION/LOCAL_SOURCE | local candidate | Six views, truth states, 2x2 mobile nav, and system-font fallback visible; SHA-256 `3FEEF96D2ABC2CCADB8AE117A37DEC9FB785EC794BD08EF7442A3111009AB84E`. |
| `audit/screenshots/series-a-local-2026-08-11/a11oy-series-a-390.png` | `http://127.0.0.1:4128/a11oy/start` | 390 | 2026-08-11 | Codex | `P0-SERIES-A-PRODUCT-WIRING-20260811` | DEMONSTRATION/LOCAL_SOURCE | local candidate | Narrow mobile composition; SHA-256 `4822BAE2B2B3C118CF8527078CA0742C363C92D3D3BF7A17D7F50210FD5F64BD`. |
| `audit/screenshots/series-a-local-2026-08-11/a11oy-series-a-768.png` | `http://127.0.0.1:4128/a11oy/start` | 768 | 2026-08-11 | Codex | `P0-SERIES-A-PRODUCT-WIRING-20260811` | DEMONSTRATION/LOCAL_SOURCE | local candidate | Tablet composition; SHA-256 `EF5D1298D865F01BB4E8F64A932A323C97D66F4D978D4821A94D77D5E5826511`. |
| `audit/screenshots/series-a-local-2026-08-11/a11oy-series-a-1366.png` | `http://127.0.0.1:4128/a11oy/start` | 1366 | 2026-08-11 | Codex | `P0-SERIES-A-PRODUCT-WIRING-20260811` | DEMONSTRATION/LOCAL_SOURCE | local candidate | Laptop/desktop composition; SHA-256 `E2EBA6DCC1293ACFF47957AC68647DA1D18A66B15F07B49373F2D6D82DE14547`. |
| `audit/screenshots/series-a-local-2026-08-11/a11oy-series-a-1728.png` | `http://127.0.0.1:4128/a11oy/start` | 1728 | 2026-08-11 | Codex | `P0-SERIES-A-PRODUCT-WIRING-20260811` | DEMONSTRATION/LOCAL_SOURCE | local candidate | Wide-desktop composition; SHA-256 `C4B9C902FCBAFA30B4F0F887098056751EBA9D23622DB15799962518D628CD3B`. |

The browser sandbox denied the optional Google Fonts request. These captures fulfilled that
stylesheet with empty CSS and prove the declared system-font fallback, not external font delivery.
They prove local layout and claim presentation only; they do not prove merge, deployment,
production operation, customer data, or live service parity.

---

## Series A W1 truth-lock UI evidence — 2026-07-26

| Filename | Route | Surface | Capture date | Captured by | Workcell | Proof level | Status | Notes |
|----------|-------|---------|--------------|-------------|----------|-------------|--------|-------|
| `docs/assets/screenshots/current/a11oy-sdk-2026-07-26.jpg` | `http://127.0.0.1:4110/a11oy/sdk` | A11oy developer platform | 2026-07-26 | Codex | `SERIES-A-W1-TRUTH-LOCK-20260726` | DEMONSTRATION/REPORTED | current | Live local-app capture at the patched route. The `WARN` status, product-exploration subtitle, and `SEEDED DEMONSTRATION · NOT LIVE EVIDENCE` banner are visible above the seeded KPI and SDK registries. Route is recorded here because browser chrome is not included. |
| `docs/assets/screenshots/current/a11oy-code-2026-07-26.jpg` | `http://127.0.0.1:4110/a11oy/a11oy-code` | A11oy Code governed-session terminal | 2026-07-26 | Codex | `SERIES-A-W1-TRUTH-LOCK-20260726` | DEMONSTRATION/REPORTED | current | Live local-app capture scrolled to the modified terminal. `SCRIPTED DEMONSTRATION — NOT LIVE EVIDENCE` is visible; the marketing hero was rejected as proof. Route is recorded here because browser chrome is not included. |
