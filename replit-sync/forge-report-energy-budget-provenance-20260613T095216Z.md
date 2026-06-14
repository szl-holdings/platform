# Forge report — energy-harvest /budget + /provenance (additive, LIVE)

**UTC:** 2026-06-13T09:52:16Z
**Order:** NEXT_ORDER dark-surface sweep (R-FREEPOWER / energy-harvest vertical)
**Doctrine:** v11 — honest labels, joules SAMPLE, sovereign untouched, no key, no PR
merge, no serve.py edit (locked), additive only.

## What was dark
Of the NEXT_ORDER energy surfaces, siblings had already shipped `/engine/status`,
`/formula/sovereign`, `/heart/pulse`, `/ayni` (all 200). The ONLY remaining 404s were:
- `https://a11oy.net/energy/budget`
- `https://a11oy.net/energy/provenance`

Both nginx-proxy `^~ /energy/` (trailing-slash → prefix stripped) to the box
`szl-energy-harvest` microservice on `:8082`.

## What shipped (additive, no locked file touched)
New module **`budget.py`** + two routes in `server.py` (idempotent marker
`ENERGY-BUDGET-PATCH`; `import budget as ebudget`). No nginx change needed — the
existing `^~ /energy/` block already covers both paths.

- **`/energy/budget`** — admissible compute-energy budget for the CURRENT live grid
  posture, bounded by two REAL kernel-checked Lean theorems cited by id:
  - **Bekenstein #239** (UPPER bound, `I_max = 2πRE/(ħc·ln2)` bits per joule)
  - **Landauer #240** (LOWER bound, `E_min = k_B·T·ln2` J per irreversible bit) — a
    REAL computed number from CODATA constants at 22 C ≈ **2.82e-21 J/bit**.
  - `soak_admitted` mirrors the live `wasted_energy_available` posture; reactive work
    never consults the budget.
- **`/energy/provenance`** — provenance chain of measured-joule EnergyReservoir
  entries → DSSE receipt citing #239/#240 → validate vs `canonical-formulas-v1` /
  `lean-proofs-v1` → Ayni-balance F11. `receipt_schema` declared; chain is GENESIS.

## Honesty (settle-to-count)
There is NO on-box NVML meter (box is CPU-only; the GPU node exposes Ollama over
Tailscale only). Therefore:
- `joules_label: "sample"`, `measured_joules_to_date: 0`, `realized_budget_j: 0.0`
- provenance `chain_length: 0`, `entries: []`, `genesis: true`
- `sovereign: false` on both surfaces.

The PHYSICAL bounds are real; the REALIZED budget counts ONLY measured joules → 0
until the founder GPU thermal bridge feeds `GPU_THERMAL_URL`/NVML. We never fabricate
a joule, a receipt, or a settled budget — same discipline as the marketplace
`settled_usd=0/not_listed` ESTIMATE.

## Verification (live)
- box-local `:8082/budget` = 200, `:8082/provenance` = 200
- public `a11oy.net/energy/budget` = 200 (live posture `negative-price`, `-15.7 EUR/MWh`)
- public `a11oy.net/energy/provenance` = 200 (genesis, 0 entries)
- `py_compile` OK; `systemctl is-active szl-energy-harvest` = active
- GitHub-aligned: `platform/apps/energy-harvest/{budget.py,server.py}` byte-match box
  (md5-verified before push).

## Founder-gated next step (NOT Forge-doable)
The realized budget and provenance chain stay at zero until a real joule is MEASURED.
That requires the GPU thermal/NVML bridge (run `nvidia-smi` on the GPU node or set
`GPU_THERMAL_URL`) — a founder hardware step, same gate as `/reverse-loop`.

— Forge
