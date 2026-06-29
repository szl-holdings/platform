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
- **a-11-oy.com** (Hetzner box `167.233.50.75` — a deployment SEPARATE from the
  HF Space): was still `mode=deterministic, token_source=None` because the box
  container had no `HF_TOKEN` in its env. Fixed durably:
  - Added `HF_TOKEN` to `/etc/szl-contracting.env` (the env-file that
    `a11oy-rebuild` injects via `--env-file`), so future rebuilds keep it.
  - Recreated the `a11oy` container from the current post-#308 image
    (built 2026-06-11T21:08Z).
  Now: `mode=generative | inference=hf-router | token_source=HF_TOKEN` ✓ LIVE

## Notes
- No token values are included in this report or in any logs.
- Both the public HF Space and the public box site (a-11-oy.com) now run Chaski
  in generative mode via the HF inference router.

---

## Addendum (23:50Z) — Box catch-up: entangle + neuroplasticity now live on a-11-oy.com ✅

**Instruction:** `forge-MASTER-zoomout-20260611-pm.md` gap #1 — "a-11-oy.com behind HF (entangle/neuro 404)."
**Operator:** Forge (Replit task agent)

### Finding (ground-truth, verified live)
The box `a11oy:local` container (built 21:08Z; last rebuild log `…205446-allodial`)
predated the entanglement + neuroplasticity modules landing in `a11oy@main`:
- box `localhost:7861` `entangle/summary` → **404**, `neuro/summary` → **404**
  (scaling / allodial / qbio / router already 200).
- HF Space served all of them 200. → real drift, box-only.

### Action
Ran `/opt/szl/szl-uds-deployment/box-scripts/a11oy-rebuild` (resets the box build tree to
published `origin/main`, rebuilds the image, recreates the container, injects
`/etc/szl-contracting.env`). Build pinned to `origin/main = 45dac33`. Confirmed both modules
are COPY'd in the Dockerfile and `register()`'d in `serve.py` on main before rebuilding.
The script's own front-door VERIFY passed (console.html md5 matches main).

### Verify — three-surface parity (probed from OUTSIDE the box)
| path | a-11-oy.com (box) | HF Space |
|---|---|---|
| entangle/summary | **200** (was 404) | 200 |
| neuro/summary | **200** (was 404) | 200 |
| scaling/summary | 200 | 200 |
| code/summary | 404 | 404 (parity — the code engine exposes no `/summary` sub-route; not a gap) |
| /healthz | `commit=c7c0ba17 doctrine=v11 lock=749/14/163` | identical |

All three surfaces (box localhost, HF, public a-11-oy.com) now serve byte-identical
`commit c7c0ba17`. **Gap #1 CLOSED & verified.**

### Honesty / invariants
- Doctrine-count-agnostic action: the rebuild deploys exactly what the team already published
  to `a11oy@main`; no honesty claims authored, no proofs fabricated.
- The strict-tier llama.cpp compile is honestly skipped on the constrained box builder
  (`A11OY_REQUIRE_LOCAL_LLM!=1` → tower-side label, `served_locally=False`, never fake output);
  the GHCR-published image compiles + boot-verifies real local output.
- No token values in this report or any logs.
