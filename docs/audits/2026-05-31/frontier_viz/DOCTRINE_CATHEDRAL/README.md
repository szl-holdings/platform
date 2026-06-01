---
title: Doctrine Cathedral
emoji: ⛪
colorFrom: yellow
colorTo: gray
sdk: static
app_file: index.html
pinned: false
license: apache-2.0
---

# Doctrine Cathedral

A first-person walkthrough of **Doctrine v11**, rendered as architecture (a dependency graph in stone).
**No mysticism** — pillars, tiles, windows and dim-spots are data-cartographic metaphors.

LOCKED v11 numbers, shown **verbatim** (confirmed against the repo description of `szl-holdings/lutar-lean`:
*"749 declarations, 14 unique axioms, 163 tracked sorries. Doctrine v11"*):

- **749 declarations → 749 floor tiles** (GPU instanced grid).
- **14 axioms → 14 stone pillars** — click a pillar to read its **Lean type signature** (A2 = `IsHomogeneous`, A4 = `IsBounded`, A12 = replay-hash, A13 = SLSA L1).
- **163 sorries → 163 dim spots** — click to open the **real GitHub line link** (`github.com/szl-holdings/lutar-lean/blob/main/<file>#L<line>`). Line data is enumerated from the live repo into `real_sorries.json`.
- **13 axes → 13 stained-glass clerestory windows** (`yuyay_v3` gate: 2 sacred ≥0.95, 7 structural ≥0.90, 4 introspection ↔ HUKLLA T03/T04/T09/T10), each titled with its axis name.
- **Master formula** floats above the altar: `P(x,t) = argmax_{a∈𝒜} [ Λ(x) · Yuyay₁₃(a) · exp(−β·HUKLLA(a)) · ∏_i Khipu_i(a) ]`.

**Controls**: click to enter, **WASD** to move, **mouse** to look, **Shift** to run, **Esc** to release the pointer.

**Data**: `real_sorries.json` (real Lean file paths + line numbers from `szl-holdings/lutar-lean@main`) and an honest liveness probe of `https://szlholdings-a11oy.hf.space/api/a11oy/v1/honest`. The LOCKED counts are never overwritten by the endpoint; the probe only flips a LIVE/DEMO badge.

**Tech**: Three.js **r171**, **WebGPURenderer** baseline + **WebGL2 fallback**, `PointerLockControls`, instanced floor, Kanchay tokens.

Embeddable: `<iframe src="https://szlholdings-doctrine-cathedral.hf.space"></iframe>`.

— Yachay (CTO), SZL Holdings
