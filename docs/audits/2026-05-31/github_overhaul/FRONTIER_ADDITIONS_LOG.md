# FRONTIER ADDITIONS LOG
**Agent:** GitHub Frontier Designer (Yachay) · 2026-06-01 · Doctrine v11 LOCKED

The founder directive asked for "3D animation ... or a way to show the architecture of each in a new frontier way." After Phase 0 research (`INSPIRATION_RESEARCH.md`), I identified six candidate frontier features and **shipped the best three end-to-end**, deferring the rest as P1/P2 with rationale.

---

## SHIPPED (3)

### F1 — SZL / Khipu Constellation (live 3D org graph)
A force-directed Three.js graph of the whole org: every repo a node, every receipt/dependency edge a link, animated and orbit-controllable. **The "genius runs this" centerpiece.**
- Deployed: `szl-holdings/.github` gh-pages `ef76cc47` → https://szl-holdings.github.io/.github/
- Reused by the personal profile and org profile heroes (shared infra; coordinated with `hf_org_overhaul`).
- Why first: it answers "show the architecture in a new frontier way" at the *org* level — the single highest-leverage surface.

### F2 — Doctrine Cathedral (live 3D thesis architecture)
The Ouroboros Thesis rendered as architecture: 14 axioms as **pillars**, theorems as **vaulted arches** — literal spatial metaphor for the proof structure, walkable in 3D.
- Deployed: `ouroboros-thesis` main:/cathedral/index.html `0d95befc` → https://szl-holdings.github.io/ouroboros-thesis/cathedral/
- Why: turns a DOI-pinned text artifact into something explorable; preserves existing thesis Pages content (additive subpath).

### F3 — Asciinema-in-README (animated terminal cast as SVG)
Real command sequences (`lake build`, recipe runs, Mode-S decode) rendered as **self-playing SVG terminal casts** embedded directly in READMEs — no GIF, no external player, no JS (GitHub strips `<script>`). Line 0 visible by default so the cast reads even before animation.
- Generator: `/tmp/gen_term_cast.py`; assets shipped to lutar-lean (`7e3ee793`), thesis (`b013ece3`), cookbook (`a7afb3a3`), killinchu (`2d6ecc29`); a11oy cast also generated.
- Why: lets each repo "show something unique and real" — the actual commands that produce receipts — with zero text bloat.

Also shipped as supporting infra: **animated architecture SVGs** (`/tmp/gen_arch_svg.py`) and **count-up metric cards** (`/tmp/gen_stat_card.py`) on every top-6 surface, plus two more live 3D scenes (**theorem graph** on lutar-lean, **recipe carousel** on cookbook, **build timeline** on the personal profile, **air-domain scene** on killinchu).

---

## DEFERRED — P1 (high value, next sprint)

### F4 — Self-updating metric cards via GitHub Action
Re-run `lean_numbers.py` on push and regenerate the SVG cards so 749/14/163 never drift again (the "168 sorries" bug we just fixed proves the need). P1, not shipped: requires a CI workflow + write token scoping; mechanical once approved.

### F5 — Interactive PURIQ playground (WASM)
A live widget where a visitor drags the 13 yuyay weights \(w_i\) and watches \(\Lambda(x)\) recompute under the A2/A4 constraints. P1: needs a compiled kernel build; the Provenanced Notebook personal site already prototypes the "formula computes live" idea, so this is partly covered.

## DEFERRED — P2 (nice-to-have)

### F6 — Per-repo contribution 3D skyline
`github-profile-3d-contrib`-style isometric commit skyline per repo. P2: lower signal than the architecture scenes; the org constellation already conveys activity at a glance.

---

## Justification summary
The three shipped features map 1:1 to the three things the founder asked for: **(1) org-level architecture in a frontier way** (constellation), **(2) thesis/proof architecture in a frontier way** (cathedral + theorem graph), **(3) "unique and real" per-repo proof** that text alone can't show (asciinema casts of the actual commands). F4–F6 are documented so the org can finish the rollout without re-deriving the approach.
