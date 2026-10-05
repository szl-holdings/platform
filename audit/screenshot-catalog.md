# Screenshot Catalog — SZL Holdings Platform
**Track 6 — 2026-04-21**
**Updated — 2026-07-31 (Workcell VERTICAL-RUNTIME-CONTRACTS-2026-07-31)**
**Updated — 2026-04-22 (Task #3103, README screenshot block refresh)**
**Status:** Complete disposition ledger. Per-file keep/archive executed.

---

## Summary

### 2026-09-29 A11oy Atelier / Grok 4.7

- filename: `a11oy-atelier-2026-09-29.jpg`
- route: `http://127.0.0.1:19090/a11oy/atelier`
- surface: A11oy Atelier operator workbench
- capture_date: `2026-09-29T21:15:57Z`
- captured_by: Codex / PixelProof
- capture_environment: `local-exact-head`, Windows, Node `v24.19.0`, installed Microsoft Edge
- source_revision: `c09107164fcddaededcdff76bd744702f0b93da0`
- workflow_run_or_command: `node node_modules/@playwright/test/cli.js screenshot --browser chromium --channel msedge --viewport-size '1440,1100' --color-scheme dark --wait-for-selector '[aria-label="Provider health"]' --wait-for-timeout 2000 --full-page 'http://127.0.0.1:19090/a11oy/atelier' 'docs/assets/screenshots/current/a11oy-atelier-2026-09-29.jpg'`
- viewport: `1440 x 1100`; full-page artifact `1440 x 1195`
- artifact_sha256: `9b532dbdb9fe1890a8a245b5b4631984f6bf86d401dffefe365d8d3cd6e6d1e7`
- workcell_id: `ATELIER-GROK47-2026-09-29`
- proof_level: `4`
- status: `current`
- notes: Live configured-provider and encrypted-local-continuity state. The image shows the 4.7 labels, pending-retry privacy copy, composer, reasoning control, and capability denials. It does not show a successful provider answer. The bounded live 4.7 probe returned HTTP 402. Source-bound launch metadata and the screenshot sidecar accompany the proof packet. An unrelated `pnpm-workspace.yaml` line-ending-only working-tree change was preserved and excluded from this patch; application source matched the recorded revision.
- sidecar: [`a11oy-atelier-2026-09-29.screenshot.json`](a11oy-atelier-2026-09-29.screenshot.json)
- proof_packet: [`A11OY_ATELIER_GROK47_PROOF_2026-09-29.md`](A11OY_ATELIER_GROK47_PROOF_2026-09-29.md)

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

## Series A W1 truth-lock UI evidence — 2026-07-26

| Filename | Route | Surface | Capture date | Captured by | Workcell | Proof level | Status | Notes |
|----------|-------|---------|--------------|-------------|----------|-------------|--------|-------|
| `docs/assets/screenshots/current/a11oy-sdk-2026-07-26.jpg` | `http://127.0.0.1:4110/a11oy/sdk` | A11oy developer platform | 2026-07-26 | Codex | `SERIES-A-W1-TRUTH-LOCK-20260726` | DEMONSTRATION/REPORTED | current | Live local-app capture at the patched route. The `WARN` status, product-exploration subtitle, and `SEEDED DEMONSTRATION · NOT LIVE EVIDENCE` banner are visible above the seeded KPI and SDK registries. Route is recorded here because browser chrome is not included. |
| `docs/assets/screenshots/current/a11oy-code-2026-07-26.jpg` | `http://127.0.0.1:4110/a11oy/a11oy-code` | A11oy Code governed-session terminal | 2026-07-26 | Codex | `SERIES-A-W1-TRUTH-LOCK-20260726` | DEMONSTRATION/REPORTED | current | Live local-app capture scrolled to the modified terminal. `SCRIPTED DEMONSTRATION — NOT LIVE EVIDENCE` is visible; the marketing hero was rejected as proof. Route is recorded here because browser chrome is not included. |

---

## PR #668 Series A product-view evidence — 2026-08-26

The following five entries share this required capture identity:

- **route:** /a11oy/start
- **surface:** A11oy Series A product view
- **captured_by:** Codex
- **capture_environment:** LOCAL_NON_AUTHORITATIVE exact-source rail
- **source_revision:** 4ca56d79a229a7207883475e368967c24c061df4
- **source_tree:** cb311e5c9fb1caf8e1ccfcc9d5fea0b203ca92b6
- **source_ref:** codex/series-a-product-current-main-v4
- **capture_command:** node scripts/qa/capture-series-a-proof.mjs
- **capture_inputs:** repository, SHA, tree, ref, /a11oy/start route, and a new
  proof output directory were supplied explicitly; PLAYWRIGHT_BASE_URL was not
  accepted
- **workcell_id:** P0-SERIES-A-PRODUCT-WIRING-20260811
- **proof_level:** 4
- **status:** current local source proof; hosted exact-head authority pending
- **metadata_sidecar:**
  [a11oy-series-a-capture-metadata-2026-08-26.json.txt](../docs/assets/screenshots/current/a11oy-series-a-capture-metadata-2026-08-26.json.txt),
  SHA-256
  EB5B78ECDCD1D8D952DA75D4BDADC61B8A48B7CC7427F13FF5AB7DA300327399
- **build_manifest_sha256:**
  806485B29F378B1AAA38F3AF2984AB65C74A677F9CAE1282F6B7D52756B2ACD5
- **entry_document_sha256:**
  6510BCBEC50E14BAF4AAF73DC52DECA5F3CFEF8ADE65B6008744C50935F6E26B

| Filename | Capture time | Viewport | Artifact SHA-256 | Notes |
|---|---|---|---|---|
| docs/assets/screenshots/current/a11oy-series-a-320-2026-08-26.png | 2026-08-26T20:39:02.479Z | 320x900 CSS px; full page 320x9155 | EEE8ED83F6E01A56EF1774EBF2C4426B9763C24A28008636511CB890FF967DCC | PASS; exact served build, six states/tabs, keyboard and ARIA checks, no overflow or undeclared network. |
| docs/assets/screenshots/current/a11oy-series-a-390-2026-08-26.png | 2026-08-26T20:39:05.086Z | 390x900 CSS px; full page 390x8356 | C0EEEB0AE3FF7067D48D50B1038CD75EBD75709FD0289998F456C2BEB87FA6DE | PASS; exact served build, six states/tabs, keyboard and ARIA checks, no overflow or undeclared network. |
| docs/assets/screenshots/current/a11oy-series-a-768-2026-08-26.png | 2026-08-26T20:39:08.761Z | 768x1024 CSS px; full page 768x5205 | 61A210B5C27A8CC666CD5FF1699CAE346BE8D8F5473921695C6065CA34FDB181 | PASS; exact served build, six states/tabs, keyboard and ARIA checks, no overflow or undeclared network. |
| docs/assets/screenshots/current/a11oy-series-a-1366-2026-08-26.png | 2026-08-26T20:39:17.398Z | 1366x900 CSS px; full page 1366x4620 | 431C37C0D8518D05A3F63D58F0BE1756F2CE66633C9CAC83831E7F265FDE3444 | PASS; exact served build, six states/tabs, keyboard and ARIA checks, no overflow or undeclared network. |
| docs/assets/screenshots/current/a11oy-series-a-1728-2026-08-26.png | 2026-08-26T20:39:20.103Z | 1728x1000 CSS px; full page 1728x4665 | D679D023CC298E4442EEB9A272B51B8C0D4C1220D9206547B752FF4278F59008 | PASS; exact served build, six states/tabs, keyboard and ARIA checks, no overflow or undeclared network. |

The rail built 344 files into a fresh temporary directory, served an immutable
in-memory snapshot from an owned ephemeral loopback listener, verified the
entry-document digest and response identity, blocked foreign HTTP/WebSocket
connections and service workers, and removed the owned temporary build. All
five promoted PNG digests match the generated proof bytes.

All five full-page captures were decoded and visually inspected. No responsive
layout defect, horizontal clipping, overlap, error surface, or truth-label
regression was observed. This local evidence proves exact source and local
build behavior only. It does not prove hosted execution, deployment,
production runtime, customer use, or external-service parity. Final PR-head
byte equivalence and hosted checks remain separate promotion requirements.

---

## PR #691 A11oy Model Router lexicon evidence — 2026-08-31

Required capture identity:

- route: /a11oy/model-router
- surface: A11oy Model Router governed recipe lexicon
- captured_by: GitHub Actions + Playwright
- capture_environment: GitHub-hosted ubuntu-24.04 exact-source build
- source_revision: 9e66b0eebb52d4e183e2b9248fec1aa74caf8611
- source_tree: 51fa6d934538233b1ad83ec336ff59498b6b1a50
- source_ref: chore/a11oy-gacm-signed-688
- source_pr: #691
- capture_workflow: https://github.com/szl-holdings/platform/actions/runs/33357789150
- workflow_definition_ref: ops/model-router-proof-691-20260831
- workflow_definition_sha: 926390e0efc0a7bfd1cb7b14ea8919e03e8dfeb4
- viewport: 1440x900 CSS px at device scale factor 1
- workcell_id: PLATFORM-PR-688-MODEL-ROUTER-PROOF
- proof_level: 4
- status: current exact-source UI evidence
- metadata_sidecar: docs/assets/screenshots/current/a11oy-model-router-capture-metadata-2026-08-31.json.txt
- metadata_sha256: 08c659642f0461dc75b57f419d82a2df8b1fe24abcf3de3b00dd00add0b13ca5

| Filename | Capture time | Viewport | Artifact SHA-256 | Notes |
|---|---|---|---|---|
| docs/assets/screenshots/current/a11oy-model-router-2026-08-31.jpg | 2026-08-31T04:39:40.844Z | 1440x900 CSS px | 3646d432fb1ca1a5176c2b4e6d52fbd2e2ef063247fc09e4eb0264ef510abfd0 | PASS; live exact-source build; changed label visible; superseded label absent; no horizontal overflow, browser errors, or undeclared network. |

The same-origin /api/a11oy/* endpoints returned deterministic ok:false JSON, so this capture proves the changed lexicon surface and does not claim live provider data. Expected Google font hosts were replaced with empty deterministic responses. Deployment and production behavior remain outside this proof boundary.

---

## PR #696 A11oy Convergence lexicon evidence — 2026-08-31

Required capture identity:

- route: /a11oy/convergence
- surface: A11oy Convergence vLLM ecosystem absorption lexicon
- captured_by: GitHub Actions + Playwright
- capture_environment: GitHub-hosted ubuntu-24.04 exact-source build
- source_revision: bbd62c7896cbd3a3ee8a9dfac7abed0fabb7d212
- source_tree: 2fd713227df61d4b402d045a2ccd76fdf463146f
- source_ref: chore/a11oy-gacm-dual-proof-20260831
- source_pr: #696
- capture_workflow: https://github.com/szl-holdings/platform/actions/runs/33359744252
- workflow_definition_ref: ops/convergence-proof-final-20260831
- workflow_definition_sha: a4fab59624be84bb80e46b699f332e8fd51428d3
- viewport: 1440x900 CSS px at device scale factor 1
- workcell_id: PLATFORM-GACM-CONVERGENCE-PROOF-FINAL
- proof_level: 4
- status: current exact-source UI evidence
- metadata_sidecar: docs/assets/screenshots/current/a11oy-convergence-capture-metadata-2026-08-31.json.txt
- metadata_sha256: e2b1049e7a052c3b7a7f18ae89b066ce334ae3fba45145f88f858cb16075faa3

| Filename | Capture time | Viewport | Artifact SHA-256 | Notes |
|---|---|---|---|---|
| docs/assets/screenshots/current/a11oy-convergence-2026-08-31.jpg | 2026-08-31T05:14:42.684Z | 1440x900 CSS px | 43fbc7a2fab9f6be0aafc1bf337ed9680628aff2661e4c19bccd9b8de8823504 | PASS; live exact-source build; changed label visible; superseded label absent; no horizontal overflow, browser errors, or undeclared network. |

The same-origin /api/a11oy/* endpoints returned deterministic ok:false JSON, so this capture proves the convergence lexicon surface and does not claim live provider data. Expected Google font hosts were replaced with empty deterministic responses. Deployment and production behavior remain outside this proof boundary.

## P0 Series A product upgrade — 2026-09-24 final local matrix

- Workcell: `P0-SERIES-A-PRODUCT-WIRING-20260811`.
- Repository/ref: `szl-holdings/platform`, `codex/p0-platform-work-20260811`.
- Source commit: `6ca620d578c39a9b97a47259445782bf6b58f159`.
- Source tree: `12c6248a9ec6f0efa3d4f3556ba99d8b24cbbb7f`.
- Captured by Codex desktop agent for Stephen Lutar, from an owned exact-source production build.
- Capture interval: 2026-09-24T13:26:21.723Z through 2026-09-24T13:30:39.082Z; Playwright 1.60.0 / Chromium 148.0.7778.96.
- VERIFIED: 75 images, zero reported failures; 155 interaction states PASS.
- Authority: **LOCAL_NON_AUTHORITATIVE**. Not hosted promotion, deployment or production proof.
- Command: `node scripts/qa/capture-series-a-product-matrix-proof.mjs`; exact environment in [proof packet](P0_SERIES_A_PRODUCT_UPGRADE_20260924.md).
- Served manifest: 348 files / 16,659,010 bytes; SHA-256 `2fbedb670deb85927761784c89f2dea4669750ce6094def131070f9e00712bbc`, unchanged pre/post capture.
- Per-image route, viewport, capture time, geometry/network findings and SHA-256: [complete metadata](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-24-metadata.json.txt), SHA-256 `ced4ba27026da9ead7cf96a8a05bf678bc0d45529327ee963fb1c55e07ff636f`.
- [Source-bound receipt](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-24-source-bound-metadata.json.txt), SHA-256 `76150bbcda8f57a79cf20d9362a68354e2746884a83148d774f208bb566478ba`.
- [Interaction receipt](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-24-interactions.json.txt), SHA-256 `5ab1584cb791bc751bad5440a1f424a8afb9016f7d4d7f0bb7a19f1b0318fcdd`.
- Sidecars preserve original JSON bytes; original names are metadata.json, source-bound-metadata.json and interactions.json respectively. The retained suffix prevents formatting-hook mutation.
- All PNG, receipt, manifest and nine tracked-input digests were independently recomputed. Earlier 8f3f and 022f packets are not this final evidence; evidence-only successors retain the recorded capture source.

| Route | Retained captures (CSS pixels) |
| --- | --- |
| /a11oy/start | [320x900](../docs/assets/screenshots/current/a11oy-start-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-start-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-start-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-start-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-start-2026-09-24-1728x1000.png) |
| /a11oy/product-journey | [320x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-24-1728x1000.png) |
| /a11oy/series-a | [320x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-series-a-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-series-a-2026-09-24-1728x1000.png) |
| /a11oy/investor-demo | [320x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-24-1728x1000.png) |
| /a11oy/workcells | [320x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcells-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcells-2026-09-24-1728x1000.png) |
| /a11oy/workcells/wc-001 | [320x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-24-1728x1000.png) |
| /a11oy/workcells/wc-001/replay | [320x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-24-1728x1000.png) |
| /a11oy/replay | [320x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-24-1728x1000.png) |
| /a11oy/demo | [320x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-demo-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-demo-2026-09-24-1728x1000.png) |
| /a11oy/architecture | [320x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-architecture-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-architecture-2026-09-24-1728x1000.png) |
| /a11oy/fabric | [320x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-fabric-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-fabric-2026-09-24-1728x1000.png) |
| /a11oy/governance | [320x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-governance-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-governance-2026-09-24-1728x1000.png) |
| /a11oy/proof | [320x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-proof-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-proof-2026-09-24-1728x1000.png) |
| /a11oy/resources | [320x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-resources-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-resources-2026-09-24-1728x1000.png) |
| /a11oy/trust | [320x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-24-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-24-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-trust-2026-09-24-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-24-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-trust-2026-09-24-1728x1000.png) |

## P0 Series A product upgrade — 2026-09-25 current-source completion

- Source `c62cac56e4ea84ccff641e0cc119bfe67278e577`; tree `6d85c83195d3dd529df9e03a6360bc232cec60b7`; protected base `9e58f052a7fba212bc74dcc4fd92adc412ffa865`.
- Repository/ref: `szl-holdings/platform` / `codex/p0-platform-work-20260811`; Workcell `P0-SERIES-A-PRODUCT-WIRING-20260811`.
- Captured by Codex desktop agent for Stephen Lutar, local exact-source owned Vite build; Playwright 1.60.0 / Chromium 148.0.7778.96.
- Interval 2026-09-25T12:37:36.111Z through 2026-09-25T12:40:33.97Z. VERIFIED: 75 captures, zero failures; 155 interaction states PASS; wrapper exit 0.
- Authority **LOCAL_NON_AUTHORITATIVE**, not hosted promotion/deployment. [Full proof and reproduction](P0_SERIES_A_PRODUCT_UPGRADE_20260925.md).
- [Per-image route, viewport, timestamp and SHA-256 metadata](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-25-metadata.json.txt), SHA-256 `8ec68be5a681b07856f2e2c1c4e62b717ff70edb11e8829c803ee8ba799fbca8`.
- [Source-bound receipt](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-25-source-bound-metadata.json.txt), SHA-256 `39fa48e245f3e234f189c2b8d5c547e088a555f1f97a21e4d8358589cf8d3534`.
- [155-state interaction receipt](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-25-interactions.json.txt), SHA-256 `5ab1584cb791bc751bad5440a1f424a8afb9016f7d4d7f0bb7a19f1b0318fcdd`.
- Original JSON names map respectively to metadata.json, source-bound-metadata.json and interactions.json; retained bytes are unchanged. Nine source-input hashes, 75 PNGs, receipts and manifest independently verified.
- Served assets: 348 files / 16659010 bytes; stable manifest `2fbedb670deb85927761784c89f2dea4669750ce6094def131070f9e00712bbc`.
- Seventy PNGs match their September 24 counterparts exactly; five Fabric PNGs differ and current narrow/wide visual inspection plus all-width geometry passed. Earlier failed 560ecf capture is not promoted.

| Route | Retained captures (CSS pixels) |
| --- | --- |
| /a11oy/start | [320x900](../docs/assets/screenshots/current/a11oy-start-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-start-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-start-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-start-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-start-2026-09-25-1728x1000.png) |
| /a11oy/product-journey | [320x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-25-1728x1000.png) |
| /a11oy/series-a | [320x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-series-a-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-series-a-2026-09-25-1728x1000.png) |
| /a11oy/investor-demo | [320x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-25-1728x1000.png) |
| /a11oy/workcells | [320x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcells-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcells-2026-09-25-1728x1000.png) |
| /a11oy/workcells/wc-001 | [320x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-25-1728x1000.png) |
| /a11oy/workcells/wc-001/replay | [320x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-25-1728x1000.png) |
| /a11oy/replay | [320x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-25-1728x1000.png) |
| /a11oy/demo | [320x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-demo-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-demo-2026-09-25-1728x1000.png) |
| /a11oy/architecture | [320x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-architecture-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-architecture-2026-09-25-1728x1000.png) |
| /a11oy/fabric | [320x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-fabric-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-fabric-2026-09-25-1728x1000.png) |
| /a11oy/governance | [320x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-governance-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-governance-2026-09-25-1728x1000.png) |
| /a11oy/proof | [320x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-proof-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-proof-2026-09-25-1728x1000.png) |
| /a11oy/resources | [320x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-resources-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-resources-2026-09-25-1728x1000.png) |
| /a11oy/trust | [320x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-25-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-25-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-trust-2026-09-25-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-25-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-trust-2026-09-25-1728x1000.png) |


## P0 Series A product upgrade — 2026-09-30 current protected-base proof

- Source `683c13a1ec3ddfc0a347c103a242ae0c8a17ea46`; tree `3b9f17aa297a54135305fab779f78fd5ddf80af0`; integrated protected base `402c9876c032a9bb532f0a3d1f997aa3254c7653`.
- Repository/ref: `szl-holdings/platform` / `codex/p0-platform-work-20260811`; Workcell `P0-SERIES-A-PRODUCT-WIRING-20260811`.
- Captured by Codex desktop agent for Stephen Lutar, local owned exact-source Vite build; Playwright 1.60.0 / Chromium 148.0.7778.96.
- Screenshot interval 2026-09-30T03:56:39.878Z–04:00:05.482Z. Wrapper exit 0 at 04:00:10.2819447Z: **75 captures, zero failures, 155 interaction states PASS**.
- Authority **LOCAL_NON_AUTHORITATIVE**, not hosted promotion/deployment. [Full proof, commands and release boundaries](P0_SERIES_A_SOURCE_ALIGNMENT_20260929.md).
- [Complete per-image metadata](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-30-metadata.json.txt), SHA-256 `9dcf8a60f8d745789c7ca325992b523a2e5c0d93125b755a4454cbd794aa6115`.
- [Source-bound receipt](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-30-source-bound-metadata.json.txt), SHA-256 `625f984fbbfc535cc86a397b088266330cb0746e7d5e7369bf2a569ff842d5c5`.
- [Interaction receipt](../docs/assets/screenshots/current/a11oy-product-matrix-2026-09-30-interactions.json.txt), SHA-256 `5ab1584cb791bc751bad5440a1f424a8afb9016f7d4d7f0bb7a19f1b0318fcdd`.
- Original JSON bytes retained with formatter-safe suffixes. All 75 PNGs, nine source inputs, receipt bindings and retained asset-manifest digest independently verified; all 78 copied files rehashed without overwriting earlier evidence.
- Served assets: 348 files / 16,686,055 bytes; recorded pre/post and independently recomputed manifest digest `6bd646fff443ae07a6ad551632a9b76611d8df3bae8c3926b0d366f68aec12a0`.
- Seventy PNGs match September 25 exactly. Only five Fabric captures differ; fresh Fabric 320/1366, Product Journey 320 and Workcells 1366 were visually reviewed. All widths pass geometry/text gates; tall-image downsampling is not a claim that every glyph was separately read.

| Route | Retained captures (CSS pixels) |
| --- | --- |
| /a11oy/start | [320x900](../docs/assets/screenshots/current/a11oy-start-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-start-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-start-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-start-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-start-2026-09-30-1728x1000.png) |
| /a11oy/product-journey | [320x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-product-journey-2026-09-30-1728x1000.png) |
| /a11oy/series-a | [320x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-series-a-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-series-a-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-series-a-2026-09-30-1728x1000.png) |
| /a11oy/investor-demo | [320x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-investor-demo-2026-09-30-1728x1000.png) |
| /a11oy/workcells | [320x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcells-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcells-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcells-2026-09-30-1728x1000.png) |
| /a11oy/workcells/wc-001 | [320x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-detail-2026-09-30-1728x1000.png) |
| /a11oy/workcells/wc-001/replay | [320x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-replay-detail-2026-09-30-1728x1000.png) |
| /a11oy/replay | [320x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-workcell-replay-2026-09-30-1728x1000.png) |
| /a11oy/demo | [320x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-demo-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-demo-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-demo-2026-09-30-1728x1000.png) |
| /a11oy/architecture | [320x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-architecture-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-architecture-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-architecture-2026-09-30-1728x1000.png) |
| /a11oy/fabric | [320x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-fabric-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-fabric-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-fabric-2026-09-30-1728x1000.png) |
| /a11oy/governance | [320x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-governance-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-governance-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-governance-2026-09-30-1728x1000.png) |
| /a11oy/proof | [320x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-proof-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-proof-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-proof-2026-09-30-1728x1000.png) |
| /a11oy/resources | [320x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-resources-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-resources-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-resources-2026-09-30-1728x1000.png) |
| /a11oy/trust | [320x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-30-320x900.png) · [390x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-30-390x900.png) · [768x1024](../docs/assets/screenshots/current/a11oy-trust-2026-09-30-768x1024.png) · [1366x900](../docs/assets/screenshots/current/a11oy-trust-2026-09-30-1366x900.png) · [1728x1000](../docs/assets/screenshots/current/a11oy-trust-2026-09-30-1728x1000.png) |


## Carlota Jo PR #892 substrate workflow panel — 2026-10-05

These captures show the running Carlota Jo UI in GitHub Actions Chromium with intercepted synthetic workflow responses. They qualify rendered result states and repeated Run reset only. They do not establish provider inference, live backend execution, runtime persistence, human approval, cryptographic evidence signatures, or estate production readiness. A11oy remains an active prototype and investor demo.

The original PNG bytes and source sidecars are retained unchanged. The `.png` extension preserves the actual captured format. All eight captures came from [E2E workflow run 37309171751](https://github.com/szl-holdings/platform/actions/runs/37309171751), artifact `11345077223`, at the exact source revision recorded below. GitHub's synthetic PR test merge `42e97fbc92447555cd700389006d0986e613e885` has tree `f329da317191745a95e7ae8498f2541bb634c161`, identical to candidate `a8a5fd7322854e7f9b18b635ccc0453ca3f71f92`. That generated test merge is capture provenance only; it is not an authored commit signature, DCO attestation, approval, or merge to protected main. Sidecars retain `candidateTree: null` from the shallow checkout; tree equality was subsequently verified through GitHub Git objects. This catalog append changes evidence retention only; the captured panel, parser and browser-spec source hashes remain unchanged.

### cancelled

- filename: [`carlota-jo-substrate-cancelled-2026-10-05.png`](../docs/assets/screenshots/current/carlota-jo-substrate-cancelled-2026-10-05.png)
- route: `/governed-cockpit` (local CI build, `http://localhost:3004`)
- surface: Carlota Jo governed cockpit / White-Glove Task Routing panel
- capture_date: `2026-10-05T12:24:51.834Z`
- captured_by: GitHub Actions / Codex Carlota panel qualification
- capture_environment: `github-actions`, hosted Chromium, intercepted synthetic workflow response; `HOSTED_SYNTHETIC_UI`
- source_revision: `42e97fbc92447555cd700389006d0986e613e885`
- workflow_run_or_command: [`37309171751`](https://github.com/szl-holdings/platform/actions/runs/37309171751), `pnpm exec playwright test tests/e2e/carlota-jo.spec.ts --project=chromium --reporter=list`
- viewport: `1280 x 720`; panel locator capture
- artifact_sha256: `bf3f336588c0916bbb885ab3736f98d31235158956c3fd8ce94d1e87f296dd3d`
- workcell_id: `CARLOTA-SUBSTRATE-TRUTH-20261005` / PR [#892](https://github.com/szl-holdings/platform/pull/892)
- proof_level: `3` (synthetic UI result presentation only)
- status: `current`
- notes: Synthetic cancelled result remains CANCELLED.
- sidecar: [`carlota-jo-substrate-cancelled-2026-10-05.screenshot.json`](../docs/assets/screenshots/current/carlota-jo-substrate-cancelled-2026-10-05.screenshot.json)

### dry-run-pending

- filename: [`carlota-jo-substrate-dry-run-pending-2026-10-05.png`](../docs/assets/screenshots/current/carlota-jo-substrate-dry-run-pending-2026-10-05.png)
- route: `/governed-cockpit` (local CI build, `http://localhost:3004`)
- surface: Carlota Jo governed cockpit / White-Glove Task Routing panel
- capture_date: `2026-10-05T12:24:47.710Z`
- captured_by: GitHub Actions / Codex Carlota panel qualification
- capture_environment: `github-actions`, hosted Chromium, intercepted synthetic workflow response; `HOSTED_SYNTHETIC_UI`
- source_revision: `42e97fbc92447555cd700389006d0986e613e885`
- workflow_run_or_command: [`37309171751`](https://github.com/szl-holdings/platform/actions/runs/37309171751), `pnpm exec playwright test tests/e2e/carlota-jo.spec.ts --project=chromium --reporter=list`
- viewport: `1280 x 720`; panel locator capture
- artifact_sha256: `381a81d0babb8e73eded1e7ce4068fb57e1c2210a97a0763a8ed9faebe199fac`
- workcell_id: `CARLOTA-SUBSTRATE-TRUTH-20261005` / PR [#892](https://github.com/szl-holdings/platform/pull/892)
- proof_level: `3` (synthetic UI result presentation only)
- status: `current`
- notes: Engine-shaped low-confidence dry-run remains DEMO / PENDING APPROVAL with human review required; no claim that an explicit ApprovalGate was reached.
- sidecar: [`carlota-jo-substrate-dry-run-pending-2026-10-05.screenshot.json`](../docs/assets/screenshots/current/carlota-jo-substrate-dry-run-pending-2026-10-05.screenshot.json)

### failed

- filename: [`carlota-jo-substrate-failed-2026-10-05.png`](../docs/assets/screenshots/current/carlota-jo-substrate-failed-2026-10-05.png)
- route: `/governed-cockpit` (local CI build, `http://localhost:3004`)
- surface: Carlota Jo governed cockpit / White-Glove Task Routing panel
- capture_date: `2026-10-05T12:24:50.456Z`
- captured_by: GitHub Actions / Codex Carlota panel qualification
- capture_environment: `github-actions`, hosted Chromium, intercepted synthetic workflow response; `HOSTED_SYNTHETIC_UI`
- source_revision: `42e97fbc92447555cd700389006d0986e613e885`
- workflow_run_or_command: [`37309171751`](https://github.com/szl-holdings/platform/actions/runs/37309171751), `pnpm exec playwright test tests/e2e/carlota-jo.spec.ts --project=chromium --reporter=list`
- viewport: `1280 x 720`; panel locator capture
- artifact_sha256: `e029bc516d388d0fe700b2f37294f5a202cd89053ba1d0291ccbb21d62cd2d58`
- workcell_id: `CARLOTA-SUBSTRATE-TRUTH-20261005` / PR [#892](https://github.com/szl-holdings/platform/pull/892)
- proof_level: `3` (synthetic UI result presentation only)
- status: `current`
- notes: HTTP 200 carrying a failed run is shown as FAILED with the supplied run error.
- sidecar: [`carlota-jo-substrate-failed-2026-10-05.screenshot.json`](../docs/assets/screenshots/current/carlota-jo-substrate-failed-2026-10-05.screenshot.json)

### live-completed

- filename: [`carlota-jo-substrate-live-completed-2026-10-05.png`](../docs/assets/screenshots/current/carlota-jo-substrate-live-completed-2026-10-05.png)
- route: `/governed-cockpit` (local CI build, `http://localhost:3004`)
- surface: Carlota Jo governed cockpit / White-Glove Task Routing panel
- capture_date: `2026-10-05T12:24:49.114Z`
- captured_by: GitHub Actions / Codex Carlota panel qualification
- capture_environment: `github-actions`, hosted Chromium, intercepted synthetic workflow response; `HOSTED_SYNTHETIC_UI`
- source_revision: `42e97fbc92447555cd700389006d0986e613e885`
- workflow_run_or_command: [`37309171751`](https://github.com/szl-holdings/platform/actions/runs/37309171751), `pnpm exec playwright test tests/e2e/carlota-jo.spec.ts --project=chromium --reporter=list`
- viewport: `1280 x 720`; panel locator capture
- artifact_sha256: `d10dafaf270f5e7ae651c2195138d2cbd2d0edc05367b4b1b6c88463c75d82d0`
- workcell_id: `CARLOTA-SUBSTRATE-TRUTH-20261005` / PR [#892](https://github.com/szl-holdings/platform/pull/892)
- proof_level: `3` (synthetic UI result presentation only)
- status: `current`
- notes: Synthetic live-mode completed response is shown as COMPLETED; absent confidence remains Not reported and no SLA or signature claim is displayed. The fixture mode does not prove live execution.
- sidecar: [`carlota-jo-substrate-live-completed-2026-10-05.screenshot.json`](../docs/assets/screenshots/current/carlota-jo-substrate-live-completed-2026-10-05.screenshot.json)

### mode-mismatch

- filename: [`carlota-jo-substrate-mode-mismatch-2026-10-05.png`](../docs/assets/screenshots/current/carlota-jo-substrate-mode-mismatch-2026-10-05.png)
- route: `/governed-cockpit` (local CI build, `http://localhost:3004`)
- surface: Carlota Jo governed cockpit / White-Glove Task Routing panel
- capture_date: `2026-10-05T12:24:54.586Z`
- captured_by: GitHub Actions / Codex Carlota panel qualification
- capture_environment: `github-actions`, hosted Chromium, intercepted synthetic workflow response; `HOSTED_SYNTHETIC_UI`
- source_revision: `42e97fbc92447555cd700389006d0986e613e885`
- workflow_run_or_command: [`37309171751`](https://github.com/szl-holdings/platform/actions/runs/37309171751), `pnpm exec playwright test tests/e2e/carlota-jo.spec.ts --project=chromium --reporter=list`
- viewport: `1280 x 720`; panel locator capture
- artifact_sha256: `f9458788e6dd5c136cd28b81302e59004df845cac40579b3a526e2667e1e16ab`
- workcell_id: `CARLOTA-SUBSTRATE-TRUTH-20261005` / PR [#892](https://github.com/szl-holdings/platform/pull/892)
- proof_level: `3` (synthetic UI result presentation only)
- status: `current`
- notes: Returned mode inconsistent with the request is shown as UNKNOWN and cannot prove completion.
- sidecar: [`carlota-jo-substrate-mode-mismatch-2026-10-05.screenshot.json`](../docs/assets/screenshots/current/carlota-jo-substrate-mode-mismatch-2026-10-05.screenshot.json)

### repeated-dry-run

- filename: [`carlota-jo-substrate-repeated-dry-run-2026-10-05.png`](../docs/assets/screenshots/current/carlota-jo-substrate-repeated-dry-run-2026-10-05.png)
- route: `/governed-cockpit` (local CI build, `http://localhost:3004`)
- surface: Carlota Jo governed cockpit / White-Glove Task Routing panel
- capture_date: `2026-10-05T12:24:55.910Z`
- captured_by: GitHub Actions / Codex Carlota panel qualification
- capture_environment: `github-actions`, hosted Chromium, intercepted synthetic workflow response; `HOSTED_SYNTHETIC_UI`
- source_revision: `42e97fbc92447555cd700389006d0986e613e885`
- workflow_run_or_command: [`37309171751`](https://github.com/szl-holdings/platform/actions/runs/37309171751), `pnpm exec playwright test tests/e2e/carlota-jo.spec.ts --project=chromium --reporter=list`
- viewport: `1280 x 720`; panel locator capture
- artifact_sha256: `96f582b83aaa38c2ed6151ae8bea2c520d6200cee55852701e076cb63c80d670`
- workcell_id: `CARLOTA-SUBSTRATE-TRUTH-20261005` / PR [#892](https://github.com/szl-holdings/platform/pull/892)
- proof_level: `3` (synthetic UI result presentation only)
- status: `current`
- notes: First synthetic response in repeated Run scenario is DEMO / DRY-RUN COMPLETE.
- sidecar: [`carlota-jo-substrate-repeated-dry-run-2026-10-05.screenshot.json`](../docs/assets/screenshots/current/carlota-jo-substrate-repeated-dry-run-2026-10-05.screenshot.json)

### repeated-live

- filename: [`carlota-jo-substrate-repeated-live-2026-10-05.png`](../docs/assets/screenshots/current/carlota-jo-substrate-repeated-live-2026-10-05.png)
- route: `/governed-cockpit` (local CI build, `http://localhost:3004`)
- surface: Carlota Jo governed cockpit / White-Glove Task Routing panel
- capture_date: `2026-10-05T12:24:56.124Z`
- captured_by: GitHub Actions / Codex Carlota panel qualification
- capture_environment: `github-actions`, hosted Chromium, intercepted synthetic workflow response; `HOSTED_SYNTHETIC_UI`
- source_revision: `42e97fbc92447555cd700389006d0986e613e885`
- workflow_run_or_command: [`37309171751`](https://github.com/szl-holdings/platform/actions/runs/37309171751), `pnpm exec playwright test tests/e2e/carlota-jo.spec.ts --project=chromium --reporter=list`
- viewport: `1280 x 720`; panel locator capture
- artifact_sha256: `6ac07ed2aa21479de65ec3b27a69ac83ae6456452aaaf713ac3427fe0334c5bb`
- workcell_id: `CARLOTA-SUBSTRATE-TRUTH-20261005` / PR [#892](https://github.com/szl-holdings/platform/pull/892)
- proof_level: `3` (synthetic UI result presentation only)
- status: `current`
- notes: Second synthetic response replaces the first result, shows its live mode and missing confidence, and removes the prior dry-run result.
- sidecar: [`carlota-jo-substrate-repeated-live-2026-10-05.screenshot.json`](../docs/assets/screenshots/current/carlota-jo-substrate-repeated-live-2026-10-05.screenshot.json)

### unrecognised

- filename: [`carlota-jo-substrate-unrecognised-2026-10-05.png`](../docs/assets/screenshots/current/carlota-jo-substrate-unrecognised-2026-10-05.png)
- route: `/governed-cockpit` (local CI build, `http://localhost:3004`)
- surface: Carlota Jo governed cockpit / White-Glove Task Routing panel
- capture_date: `2026-10-05T12:24:53.220Z`
- captured_by: GitHub Actions / Codex Carlota panel qualification
- capture_environment: `github-actions`, hosted Chromium, intercepted synthetic workflow response; `HOSTED_SYNTHETIC_UI`
- source_revision: `42e97fbc92447555cd700389006d0986e613e885`
- workflow_run_or_command: [`37309171751`](https://github.com/szl-holdings/platform/actions/runs/37309171751), `pnpm exec playwright test tests/e2e/carlota-jo.spec.ts --project=chromium --reporter=list`
- viewport: `1280 x 720`; panel locator capture
- artifact_sha256: `435fd0e1c5c89dbe80e844a2ff0de77ce80e9695f46cc02530a92333325d878e`
- workcell_id: `CARLOTA-SUBSTRATE-TRUTH-20261005` / PR [#892](https://github.com/szl-holdings/platform/pull/892)
- proof_level: `3` (synthetic UI result presentation only)
- status: `current`
- notes: Unrecognised returned status is shown as UNKNOWN.
- sidecar: [`carlota-jo-substrate-unrecognised-2026-10-05.screenshot.json`](../docs/assets/screenshots/current/carlota-jo-substrate-unrecognised-2026-10-05.screenshot.json)
