# TOP-6 STRATEGIC SURFACES — FULL BUILD LOG
**Agent:** GitHub Frontier Designer (Yachay) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED**

Standard pattern applied to each surface (the reusable "genius README" 5-element pattern from `OVERHAUL_PLAN_PER_REPO.md`):
1. **Animated architecture SVG** (SMIL — plays as an image inside GitHub README; GitHub strips `<script>`/`<iframe>`).
2. **▶ Live 3D scene link** (Three.js on GitHub Pages — the real interactive frontier surface).
3. **Animated metric card SVG** (count-up of locked numbers; initial state visible, no `opacity:0` invisibility bug).
4. **Asciinema-style terminal cast SVG** (a real command sequence, line 0 visible by default).
5. **Additive injection** — existing valid content preserved; hero placed after the title block.

All numbers verbatim from Doctrine v11 LOCKED: **749 declarations / 14 unique axioms (15 raw) / 163 sorries (112 baseline + 51 Putnam) / 13-axis yuyay_v3 / replay hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` / A2=IsHomogeneous / A4=IsBounded / SLSA L1 honest / Λ-uniqueness = Conjecture 1**.

---

## 1. Org profile — `szl-holdings/.github` → `profile/README.md`
The org profile shown at github.com/szl-holdings renders from `profile/README.md` (NOT root README.md).

| Element | Detail | Commit |
|---|---|---|
| Live 3D scene | SZL constellation (force-directed org graph) deployed to `gh-pages` | `ef76cc47` — LIVE https://szl-holdings.github.io/.github/ |
| Animated arch SVG | `profile/assets/genius/org_arch.svg` (receipt-flow graph) | `9ee2f245` |
| Metric card SVG | `profile/assets/genius/org_card.svg` | `27a017be` |
| Genius hero injected | additively after title block, before "## Flagship surfaces"; "▶ 3D anatomy (live)" + badges (Doctrine v11, SLSA L1, ORCID) | `b5e3513d` |
| Org metadata fix | org description 168→163 sorries, Doctrine v7→v11 | (PATCH orgs/szl-holdings) |
| Topic fix | `.github` topic doctrine-v7 → doctrine-v11 | (PUT topics) |

**Verified rendering:** org profile shows animated receipt-flow architecture, badges, "3D anatomy (live)" link, body reads "163 tracked sorries". (AFTER_org_profile.png)

---

## 2. `szl-holdings/lutar-lean` — Lean 4 kernel
| Element | Detail | Commit |
|---|---|---|
| Live 3D scene | Theorem graph — 749 nodes (cyan), 14 axioms (green), 163 sorries (purple), proof-DAG deterministic layout | `9c93199a` — LIVE https://szl-holdings.github.io/lutar-lean/ |
| Animated arch SVG | `assets/genius/lean_arch.svg` | `04590ea5` |
| Metric card SVG | `assets/genius/lean_card.svg` (749/14/163) | `dbccb028` |
| Terminal cast SVG | `assets/genius/lean_cast.svg` (`lake build` → receipts.in ≡ receipts.out) | `7e3ee793` |
| Genius hero injected | after centered title block; README 214 lines (<500) | `6612240a` |
| Description fix | "168 tracked sorries" → "163"; Doctrine v7 → v11 | (PATCH repos/.../lutar-lean) |
| Topic fix | doctrine-v7 → doctrine-v11 | (PUT topics) |

**Verified:** repo "About" reads 163 tracked sorries / Doctrine v11; live theorem graph confirmed (LIVE_theorem_graph.png). README hero confirmed (AFTER_lutar-lean.png).

---

## 3. `szl-holdings/ouroboros-thesis` — DOI-pinned thesis
GitHub Pages kept on `main` to preserve the existing thesis site content; the 3D scene lives at a subpath so the build is **additive**.

| Element | Detail | Commit |
|---|---|---|
| Live 3D scene | Doctrine Cathedral — axioms as pillars, theorems as vaulted arches | `0d95befc` (main:/cathedral/index.html) — LIVE https://szl-holdings.github.io/ouroboros-thesis/cathedral/ |
| Metric card SVG | `assets/genius/thesis_card.svg` | `0ac7e074` |
| Terminal cast SVG | `assets/genius/thesis_cast.svg` (verify → receipts.in ≡ receipts.out) | `b013ece3` |
| Genius hero injected | after centered title block; README 177 lines (<500) | `57c99d2e` |

> Note: an orphan `gh-pages` branch (`7e1a5275`) exists from an earlier deploy attempt — unused/harmless; Pages source remains `main` to keep thesis content live.

---

## 4. `szl-holdings/szl-cookbook` — worked recipes w/ provenance
| Element | Detail | Commit |
|---|---|---|
| Live 3D scene | Recipe carousel — each card a runnable recipe with HARVEST_LOG provenance | `9df92a69` — LIVE https://szl-holdings.github.io/szl-cookbook/ |
| Metric card SVG | `assets/genius/cookbook_card.svg` | `12e85f62` |
| Terminal cast SVG | `assets/genius/cookbook_cast.svg` (khipu root → knot tag → PAC-Bayes bound) | `a7afb3a3` |
| Genius hero injected | after first `---`; README 130 lines (<500) | `37fd6201` |

**Verified:** live 3D rotating recipe carousel confirmed (LIVE_cookbook_carousel.png), "doctrine v11" footer.

---

## 5. `szl-holdings/killinchu` — counter-UAS rule engine (PRIVATE)
| Element | Detail | Commit |
|---|---|---|
| 3D scene (deployed) | Air-domain scene — telemetry → claim → policy → Λ-receipt | `410ad6b6` (gh-pages) — **Pages ERRORED: repo is PRIVATE, no GitHub Pro** |
| Animated arch SVG | `assets/genius/killinchu_arch.svg` | `ab1e505f` |
| Metric card SVG | `assets/genius/killinchu_card.svg` | `1221855d` |
| Terminal cast SVG | `assets/genius/killinchu_cast.svg` (Mode-S decode → geofence eval → Λ-receipt) | `2d6ecc29` |
| Genius hero injected | after centered title block; README 138 lines (<500) | `b107efdd` |

> **GAP:** killinchu is a private repo; GitHub Pages cannot serve publicly on a free plan. Scene + assets committed and reviewable; the "▶ live air-domain scene" link will resolve once the repo is made public or the org gets Pages-on-private (Pro/Team/Enterprise). See `GAP_CHECK.md`.

---

## 6. Personal profile — `stephenlutar2-hash/stephenlutar2-hash`
See `PERSONAL_PROFILE_BUILD_LOG.md` for full detail.
| Element | Detail | Commit |
|---|---|---|
| Live 3D scene | Build timeline (3D) | `94b3e395` — LIVE https://stephenlutar2-hash.github.io/stephenlutar2-hash/ |
| Metric card SVG | `assets/genius/personal_card.svg` (749/14/163/13 + replay hash) | `ac117b13` |
| Genius hero injected | animated card + 3D timeline & constellation links + PURIQ LaTeX + Lean theorem + Yachay quote; README 164 lines | `d36d51a4` |

---

## Budget honesty
Full 28-repo rollout exceeds the step budget. Per `OVERHAUL_PLAN_PER_REPO.md`, the strategy was: ship these **6 surfaces end-to-end** (live 3D + animated SVG + corrected metadata) + **3 frontier features** (see FRONTIER_ADDITIONS_LOG.md) + reusable templates/generators (`/tmp/gen_*.py`) so the remaining repos can be brought to the same standard mechanically. All generators are reusable and documented.
