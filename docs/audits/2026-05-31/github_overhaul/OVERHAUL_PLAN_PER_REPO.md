# OVERHAUL_PLAN_PER_REPO

Design spec for bringing every szl-holdings + personal repo to "genius runs this" standard. Strategy is **additive** for org repos (preserve existing valid content), **less text / more visual**, all surfaces sharing the `szl-constellation` palette and open-source fonts (Inter / IBM Plex / JetBrains Mono). No mysticism. Signed Yachay. Git trailer: Perplexity Computer Agent.

## The reusable "genius README" pattern (applied to every repo)
Each README leads with a **5-element hero block**, then ≤500 lines of dense, diagram-led content:
1. **Animated SVG header** — title/typing line + one-line purpose (self-contained SVG, plays in README).
2. **Animated SVG architecture diagram** — the repo's unique component, flowing edges + pulsing nodes (Excalidraw→SVG + SMIL/CSS), OR a native **Mermaid** `flowchart`/`classDiagram`/`sequenceDiagram` block where a clickable hot-region SVG isn't warranted.
3. **`▶ Open live 3D` image-link** → the repo's `gh-pages` Three.js mini-scene (since iframes are stripped in README; the image opens the real scene).
4. **Custom metric card SVG** — auto-generated from repo metrics (commits / theorems / receipts / tests), committed by a GitHub Action.
5. **Asciinema cast (animated SVG)** — the tool actually running, exported to self-contained SVG.

Details beyond the hero push to the docs site (coordinate with `szl_unified_documentation_site`).

## Shared infrastructure
- **One base Three.js scene** (`szl-constellation`) deployed to `gh-pages`, re-skinned per repo. Palette + fonts locked to match the HF org card (coordinate with `hf_org_overhaul`).
- **One metric-card generator** (`gen_stat_card.py`) reused across repos; reads `gh api` metrics, emits SVG.
- **One animated-SVG architecture template** with CSS keyframe edge-flow, recolored per repo.

---

## Per-repo plan

### Top-6 FULL BUILD (executed this run)
| Repo | Unique component to 3D | Hero diagram | Metric card | Cast |
|---|---|---|---|---|
| `.github` (org) | SZL constellation (all flagships as stars) | Mermaid org map + animated SVG | org rollup (repos, DOIs, theorems) | n/a (org banner) |
| `ouroboros-thesis` | Doctrine cathedral (749/14/163 as nave/columns/gaps) | bounded-loop flow anim-SVG | DOI + thesis version card | `lake` thesis-check cast |
| `lutar-lean` | Live theorem dependency graph (749 nodes) | classDiagram of Λ axioms | 749/14/163/tests card | `lake build` cast |
| `szl-cookbook` | 3D recipe-card carousel | recipe index Mermaid | recipe count card | recipe-run cast |
| `killinchu` (PRIVATE) | Drone fleet 3D + Cesium scene preview | counter-UAS rule flow anim-SVG | rule/detection card | detect-run cast |
| `stephenlutar2-hash` (personal) | Khipu career timeline 3D | see Phase 3 (no bio text) | live counts card | n/a |

### org infra repos — anim-SVG architecture + Mermaid + metric card (additive PR)
`platform`, `rosie`, `vessels`, `uds-mesh`, `vsp-otel`, `agi-forecast`, `ouroboros`, `szl-trust`, `szl-uds-deployment`, `du-upstream-contributions`
- Add: animated SVG architecture header reusing the template; native Mermaid for the data/governance flow; metric card. No new fake demos.

### IP-HOLD repos — additive visual ONLY via NEW branch/PR (never touch open PRs #57/#46/#45)
`a11oy`, `amaru`, `sentra`
- Add animated SVG architecture header + metric card on a fresh branch; PR left for founder review. **Do not rebase or touch the IP-HOLD PRs.**

### Scaffold stubs — honest light polish (no fake demos)
`carlota-jo`, `counsel`, `terra`
- Keep `[scaffold — implementation pending]`. Add a single "planned architecture" Mermaid diagram + roadmap badge. No live-demo links (would be dishonest).

### Brand / housekeeping
- `szl-brand` — add an animated SVG palette/typography card (showcases the brand system itself). 
- `demo-repository` — DEAD/archived, skip.

### Number-integrity fix (additive)
- Correct `lutar-lean` repo **description** "168 tracked sorries" → "163 tracked sorries" to match the LOCKED doctrine number and the README body.

---

## Budget-honest execution note
Full Three.js + asciinema + gh-pages deploy for all 28 repos exceeds this run's step budget. This run **ships the 6 full builds + 3 frontier features end-to-end** (real commits, real gh-pages, verified URLs) and delivers the reusable templates + per-repo specs above so the remaining repos can be rolled out mechanically. Every claim shipped is real and verifiable — no bandaid placeholders.
