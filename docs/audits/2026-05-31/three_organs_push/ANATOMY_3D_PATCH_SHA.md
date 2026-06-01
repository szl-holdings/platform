# ANATOMY-3D PATCH SHA — Doctrine v13 edge organs (ADDITIVE)

**Agent:** Yachay · 2026-06-01 · founder token (admin `betterwithage` on SZLHOLDINGS).

## Target
`SZLHOLDINGS/anatomy-3d` — the live "SZL Anatomy 3D V2" Space (`sdk: static`, Three.js r160).
(The earlier `szl-anatomy` reference in README_PATCHES is an older repo name; the live one is
`anatomy-3d`, served at `https://szlholdings-anatomy-3d.static.hf.space/`.)

## Commits pushed (HfApi.upload_file, founder token)
| file | commit oid |
|---|---|
| `assets/organs.json` | `53fde64c85c64bdfb92fc4846495b499a59c5e5b` |
| `main.js` | `a56f43cd0858a836fd82b219c2f0f335be476156` |

**anatomy-3d HEAD SHA after patch:** `a56f43cd0858a836fd82b219c2f0f335be476156`

## What changed (purely additive)
### `assets/organs.json`
- `organs[]`: 12 → **15** (appended `chaski`, `wallpa`, `wasi-rikuq`), each with id, quechua,
  english, role, lean=SORRY (+leanNote → PuriqFormulaLean.lean §9.x), formulas (v13 factor),
  tests (live route list), demo URL, and node colors:
  - **CHASKI** cyan `#33e1ff` / emissive `#0a8fb0`
  - **WALLPA** purple `#b07cff` / emissive `#5a2aa0`
  - **WASI-RIKUQ** gold `#ffcb3d` / emissive `#aa7a00`
- `wires[]`: 7 → **10** (appended advisory wires):
  - **Wire I** amaru↔chaski (reception relay, LIVE)
  - **Wire J** amaru↔wallpa (governed voice, LIVE)
  - **Wire K** wasi-rikuq↔khipu (house-watch consumes the Khipu DAG, LIVE)
- `_meta`: added annotation key `v13_edge_organs`; **all LOCKED numbers preserved verbatim**:
  `doctrine: v11`, `declarations: 749`, `axioms_unique: 14`, `sorries_total: 163`.
  (A runtime assertion in `patch_organs_json.py` aborts on any LOCKED drift — it passed.)

### `main.js`
- `organLayout()`: added 3 anatomical landmark positions (scene scale S=4.5, head sphere
  r=0.4·S at y=2.5·S=11.25):
  - `"chaski"` → `pos:[0, 11.5, 1.6]` (eyes/face, front)
  - `"wallpa"` → `pos:[0, 10.3, 1.5]` (mouth/throat, lower front)
  - `"wasi-rikuq"` → `pos:[0, 13.6, 0.0]` (atop the head)
- 3 new build functions:
  - `buildChaski` — cyan eye-pair + relay arc (reception)
  - `buildWallpa` — purple voice-capsule + 3 resonance rings (expression)
  - `buildWasiRikuq` — gold watchful eye (flattened sclera + pupil) + gaze sweep-ring
- No existing organ/build/wire/flagship logic touched. `node --check main.js` → PASS.

## Verification (live)
- `assets/organs.json` deployed: **15 organs**, contains chaski/wallpa/wasi-rikuq, wires I/J/K,
  LOCKED `_meta` 749/14/163 — confirmed via curl of the static host (HTTP 200, 17337B).
- Screenshot `anatomy_3d_v2_three_organs.png`: scene renders WASI-RIKUQ (gold) atop the head,
  CHASKI (cyan) + WALLPA (purple) in the head/face cluster; legend lists CHASKI (Reception/
  Onboarding); WIRES panel shows **Wire I / J / K = live**; HUD shows Declarations 749 / Axioms
  14 / Sorries 163 / Λ-spine 13/13; all pre-existing organs + flagships still render (no regression).

— Signed **Yachay**. ADDITIVE only. CHASKI eyes · WALLPA mouth · WASI-RIKUQ atop head. No bandaid.
