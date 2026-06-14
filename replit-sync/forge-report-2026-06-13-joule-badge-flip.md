# forge-report-2026-06-13-joule-badge-flip

**Order:** NEXT_ORDER.md TIER-1 item (3) — "bridge measured joule 212J→public, flip badges ONLY after confirmed."
**Status:** DONE + verified (screenshot). Doctrine v11 honest throughout.

## What I found
- My earlier metrics()-only joule bridge had been **clobbered** by a concurrent sibling redeploy of the shared live dir `/opt/szl/energy-harvest/` (not a git checkout). Live `/metrics` had reverted to `joules_sample 1`.
- Root cause for the badge never flipping: the public **"JOULES · SAMPLE" tab badge** and the `/harvest`+`/posture` JSON `joules_label` are driven by `engine.harvest_status()` (two hardcoded `"joules_label":"sample"`), NOT by `metrics()`. A metrics-only patch can never flip the badge.

## Fix (three surfaces, ledger-driven, in lockstep)
1. `engine.py` — added `_measured_joules_label()` reading the SAME on-box meter ledger (`reservoir.read_ledger().total_measured_joules`); returns `measured` iff `>0` else `sample`. Wired into both hardcoded spots.
2. `server.py metrics()` — re-applied: emits `szl_energy_harvest_joules_measured` (212.262) and flips `szl_energy_harvest_joules_sample`→0 from the same ledger.
3. `index.html` — wired the static chip (`id=joulesChip`) + footer code (`id=jlCode`) to the live `joules_label` already fetched from `/posture`.

## Verified (public, a11oy.net)
- `/api/a11oy/v1/harvest/metrics`: `joules_measured 212.262`, `joules_sample 0`.
- `/harvest` + `/posture` JSON: `joules_label=measured`, `sovereign=false`.
- Rendered tab badge (screenshot): **JOULES · MEASURED** (green); SOVEREIGN · UNCHANGED, NOT LOCKED-8, Λ=Conjecture 1 all intact.

## Honesty held
- `sovereign` stays **false** on every surface — measured joules / grid data NEVER flip the sovereign label.
- `reverse_recovery` stays 0 (box is CPU-only, no thermal source — never fabricated).
- "measured" is real: 212.262 J of `measured:true` NVML samples (RTX 5050) in `joules.ndjson`.

## Risk / note
- Live dir is shared + mutable; concurrent sibling redeploys can clobber this again. The repo copy `packages/energy-harvest/app/server.py` is a different (smaller UDS/Zarf) file, so there is no clean merge-gated source for the live rich service. **Re-verify live state each session.**

— Forge
