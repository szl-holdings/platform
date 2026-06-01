# AUDIT_PER_REPO — szl-holdings org + stephenlutar2-hash personal

Audited via `gh` CLI against live GitHub on 2026-06-01. Scoring rubric below. **Critical finding: 0 of 28 repos have a `gh-pages` branch and 0 use Three.js — the entire live-3D surface is greenfield.** Most READMEs already carry badges (counted as `svg`) and Mermaid, but none carry an *animated* SVG architecture diagram or a terminal cast.

## Scoring rubric
- **GENIUS** — animated/3D visual + live demo + architecture diagram + rich (≥5 signal pts).
- **SOLID** — diagram or demo present, decent length (3–4 pts).
- **NEEDS-WORK** — thin README, no diagram/demo, or scaffold stub (<3 pts).
- **DEAD** — archived / placeholder.

Signals: `mer`=native Mermaid block · `3d`=Three.js or gh-pages live scene · `svg`=any SVG (badges or animated) · `demo`=live-demo/Pages/HF link · `arch`=architecture/diagram language.

| Owner | Repo | Vis | README lines | gh-pages | 3D | Mermaid | anim-SVG | demo-link | arch | Last commit | **Score** |
|---|---|---|---:|:--:|:--:|:--:|:--:|:--:|:--:|---|---|
| szl-holdings | `.github` | PUB | 128 | no | no | no | yes | yes | no | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `uds-mesh` | PUB | 107 | no | no | yes | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `vsp-otel` | PUB | 137 | no | no | yes | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `platform` | PUB | 153 | no | no | yes | yes | no | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `rosie` | PUB | 237 | no | no | yes | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `vessels` | PUB | 234 | no | no | yes | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `sentra` | PUB | 100 | no | no | yes | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `amaru` | PUB | 241 | no | no | yes | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `a11oy` | PUB | 241 | no | no | yes | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `ouroboros-thesis` | PUB | 164 | no | no | no | yes | yes | no | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `carlota-jo` | PUB | 99 | no | no | no | yes | no | yes | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `counsel` | PUB | 106 | no | no | no | yes | no | yes | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `szl-brand` | PUB | 186 | no | no | no | yes | yes | no | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `szl-cookbook` | PUB | 117 | no | no | no | yes | yes | no | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `szl-trust` | PUB | 106 | no | no | no | yes | no | no | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `agi-forecast` | PUB | 114 | no | no | no | yes | yes | no | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `ouroboros` | PUB | 181 | no | no | no | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `lutar-lean` | PUB | 199 | no | no | no | yes | yes | no | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `terra` | PUB | 99 | no | no | no | yes | no | yes | 2026-06-01 | **NEEDS-WORK** |
| szl-holdings | `killinchu` | PRI | 123 | no | no | yes | yes | yes | yes | 2026-06-01 | **SOLID** |
| szl-holdings | `du-upstream-contributions` | PRI | 40 | no | no | no | no | no | no | 2026-05-31 | **NEEDS-WORK** |
| szl-holdings | `szl-uds-deployment` | PRI | 132 | no | no | no | yes | yes | yes | 2026-05-31 | **SOLID** |
| szl-holdings | `demo-repository` | PRI | 8 | no | no | no | yes | no | no | 2026-05-05 | **DEAD** |
| personal | `stephenlutar2-hash` | PUB | 133 | no | no | no | no | yes | no | 2026-06-01 | **NEEDS-WORK** |
| personal | `szl-holdings-platform` | PRI | 128 | no | no | no | no | no | no | 2026-04-30 | **NEEDS-WORK** |
| personal | `.github` | PRI | 5 | no | no | no | no | no | no | 2026-04-25 | **NEEDS-WORK** |
| personal | `inca-intelligence-platform` | PRI | 30 | no | no | no | no | no | yes | 2026-04-08 | **NEEDS-WORK** |
| personal | `szl-holdings` | PRI | 145 | no | no | no | no | no | yes | 2026-04-08 | **NEEDS-WORK** |

## Tally

- **GENIUS**: 0
- **SOLID**: 11
- **NEEDS-WORK**: 16
- **DEAD**: 1

## Key per-repo notes
- `lutar-lean` — README body carries the LOCKED numbers correctly (749 / 14 unique / 163 sorries) and lists verify commands. **BUG: the repo *description* still says "168 tracked sorries"** — the only surviving stale figure; must be corrected to 163 (additive, non-drifting).
- `.github` (org profile) — 128-line org card, badges + demo links, but no Mermaid, no 3D, no animated architecture SVG. Top overhaul target #1.
- `ouroboros-thesis` — thesis substrate, DOI-pinned, but no live PDF embed, no Zenodo DOI badge surfaced visually, no 3D. Target #2.
- `szl-cookbook` — recipe/how-to repo, no visual carousel. Target #4.
- `killinchu` (PRIVATE) — drone counter-UAS engine, has Mermaid + demo link; no 3D/Cesium preview. Target #5. Stays PRIVATE.
- `stephenlutar2-hash` (personal profile) — 133 lines of bio-heavy copy, no animated SVG, no 3D, no live constellation. Full reinvention target (Phase 3).
- Scaffold stubs (`carlota-jo`, `counsel`, `terra`) — '[scaffold — implementation pending]'; light-touch visual polish only, no fake demos.
- `demo-repository` — archived placeholder → DEAD, skip.
- IP-HOLD repos `a11oy`, `amaru`, `sentra` — open PRs #57/#46/#45 are **OFF-LIMITS** per hard rules; READMEs may receive additive visual upgrades via NEW branches/PRs only, never touching those PRs.
