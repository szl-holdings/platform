# GAP CHECK — GitHub Overhaul
**Date:** 2026-06-01 · Doctrine v11 LOCKED · Agent: GitHub Frontier Designer (Yachay)

## Directive compliance checklist
| Requirement | Status |
|---|---|
| "Genius runs this" standard on org + personal | ✅ org profile, personal profile, + 4 repos overhauled with live 3D + animated SVG |
| Less text, more 3D/animation | ✅ 6 live Three.js scenes + animated arch SVGs + count-up metric cards + asciinema casts |
| Each repo shows something "unique and real" | ✅ each surface has its own scene + real command cast |
| Doctrine v11 LOCKED numbers verbatim (749/14/163/13/replay hash/A2/A4/SLSA L1/Conjecture 1) | ✅ verified in every asset + README + the personal card screenshot |
| DO NOT touch IP-HOLD PRs (a11oy#57, amaru#46, sentra#45) | ✅ untouched |
| Open-source fonts only | ✅ Inter / IBM Plex / JetBrains Mono in SVGs & scenes |
| No mysticism in README copy | ✅ |
| Sign as Yachay; "Perplexity Computer Agent" in git trailers | ✅ all commits |
| Personal profile: NO biographical text | ✅ hero is visuals + math + links only; existing body preserved |
| ADDITIVE for org repos | ✅ all injections additive; existing content preserved |
| Coordinate with hf_org_overhaul (constellation shared infra) | ✅ constellation deployed as shared infra; section appended to PONDER.md |
| NO BANDAID | ✅ real assets, real deployed scenes, real metadata fixes |

## Bugs found & fixed
1. **Stale "168 sorries"** in (a) org profile description and (b) lutar-lean repo description → corrected to **163** in both.
2. **Stale "Doctrine v7"** in org description, and the descriptions + `doctrine-v7` topics of `lutar-lean`, `szl-cookbook`, `ouroboros-thesis`, and `.github` → all corrected to **v11** / `doctrine-v11`.

## OPEN GAPS (flagged for parent agent / founder)
1. **killinchu live 3D scene not publicly served.** `killinchu` is a PRIVATE repo; GitHub Pages cannot publish from private repos on a free plan. The scene (`410ad6b6`), arch/card/cast SVGs, and README hero are all committed and reviewable, but `https://szl-holdings.github.io/killinchu/` returns Pages-error until the repo is made **public** or the org upgrades to **Pro/Team/Enterprise** (Pages-on-private). **Action needed:** founder decision on public-vs-Pro.
2. **Remaining repos not yet overhauled** (additive heroes only on top-6). The other ~14 public repos (uds-mesh, vsp-otel, platform, rosie, vessels, sentra, amaru, a11oy, carlota-jo, counsel, szl-brand, szl-trust, agi-forecast, ouroboros, terra) still have the prior "Series A hygiene" READMEs — solid but not genius-tier. The reusable generators (`/tmp/gen_arch_svg.py`, `gen_stat_card.py`, `gen_term_cast.py`, `deploy_ghpages.py`, `commit_file.py`) make this a mechanical rollout. Budget-bounded per `OVERHAUL_PLAN_PER_REPO.md`.
3. **Metric cards are static SVGs, not auto-updating.** If the locked numbers change again, the SVGs must be regenerated. Recommended follow-up: F4 (GitHub Action to regenerate cards from `lean_numbers.py`) — see `FRONTIER_ADDITIONS_LOG.md`. This is the durable fix for the "168" class of bug.
4. **ouroboros-thesis orphan `gh-pages` branch** (`7e1a5275`) from an earlier deploy attempt is unused (Pages source is `main`). Harmless; can be deleted for tidiness.
5. **/tmp build artifacts are ephemeral.** All generators and scene HTML live in `/tmp` (tmpfs). The *deployed* assets are safe on GitHub, but the generator scripts should be committed to a repo (e.g. `szl-cookbook` or a `szl-brand`/tooling repo) if the org wants them version-controlled. Not done to respect the additive mandate without an obvious home.

## Verification artifacts
- `BEFORE_AFTER_SCREENSHOTS/` — BEFORE + AFTER for org & personal profiles, AFTER for lutar-lean, LIVE_theorem_graph.png, LIVE_cookbook_carousel.png, and 5 scene_*.png renders.
- All six live URLs confirmed `built`/serving except killinchu (gap #1).
