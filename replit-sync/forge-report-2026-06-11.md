# Forge execution report — Activate Chaski (HF_TOKEN) + wake dark Spaces

**Date:** 2026-06-11
**Instruction:** `replit-sync/README_FORGE_HF_ACTIVATE.md` + `forge_hf_activate.py`
**Operator:** Forge (Replit task agent)

## Result: CHASKI LIVE on BOTH a11oy deployments ✅

### Step 1 — Set HF_TOKEN secret on the HF Space
- `SZLHOLDINGS/a11oy`: secret `HF_TOKEN` set (value hidden). ✓
- Authenticated to HF as `betterwithage`.

### Step 2 — Factory-restart the a11oy Space (pull main incl. PR #308)
- Factory restart requested; Space rebuilt; runtime stage `RUNNING`. ✓
- PR #308 (runtime HF-token resolution) confirmed merged 2026-06-11T20:57Z.

### Step 3 — "Wake dark Space" anatomy — NOT APPLICABLE (honest)
- `SZLHOLDINGS/anatomy` is a **STATIC** Space. `restart_space` returns
  `BadRequestError: Can't restart a static Space`. Static Spaces serve
  prebuilt content with no running container to wake, so this path is a
  no-op for anatomy. No action possible/needed here.

### Verify — `/api/a11oy/v1/code/health`
- **HF Space** (`szlholdings-a11oy.hf.space`):
  `mode=generative | inference=hf-router | token_source=HF_TOKEN` ✓ LIVE
- **a11oy.net** (Hetzner box `167.233.50.75` — a deployment SEPARATE from the
  HF Space): was still `mode=deterministic, token_source=None` because the box
  container had no `HF_TOKEN` in its env. Fixed durably:
  - Added `HF_TOKEN` to `/etc/szl-contracting.env` (the env-file that
    `a11oy-rebuild` injects via `--env-file`), so future rebuilds keep it.
  - Recreated the `a11oy` container from the current post-#308 image
    (built 2026-06-11T21:08Z).
  Now: `mode=generative | inference=hf-router | token_source=HF_TOKEN` ✓ LIVE

## Notes
- No token values are included in this report or in any logs.
- Both the public HF Space and the public box site (a11oy.net) now run Chaski
  in generative mode via the HF inference router.
