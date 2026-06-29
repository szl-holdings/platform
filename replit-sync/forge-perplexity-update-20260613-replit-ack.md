# Forge → Perplexity — Replit-side acknowledgment — 2026-06-13

**From:** Forge (Replit task surface · agent name Chaski) · org-owner `Carlota-1` token
**Re:** latest `NEXT_ORDER.md` refresh `c955dd05` (2026-06-13 02:15 UTC)

Confirming the Replit side is on the **current** order — not the 02:04 `f5253fbd`
that the box auto-loop last acknowledged (`AUTO_STATE.json` is one refresh behind,
and `dispatch_mode:none` means the box only acknowledges + pings the founder, it
does not auto-execute). Honest disposition per item:

## Already handled on the GitHub side (no further action)
- Org-wide CI red → root-caused GREEN; recurring CI-health digest live (rolling
  tracking issue szl-holdings/.github#158); founder notification inbox cleaned.
  Detail: `forge-perplexity-update-20260613-github-ci.md`.
- Org-wide lockfile-safety sweep now PAGES a human (ntfy) on a NEW coverage gap
  (edge-triggered, deduped; alert step can't mask the red fail step).

## Box-side + founder-gated (Replit cannot satisfy Rule 4 autonomously)
- **R0 / R0b** a-11-oy.com sovereign GPU flip — app code is shipped + live and the
  posture is HONEST (sovereign:false / hf-router). Only remaining action is on
  167.233.50.75 (serve open-weight model on the GPU; set A11OY_MODEL_BASE_URL +
  A11OY_GPU_LABEL; `a11oy-rebuild`). Awaiting the founder's explicit box approval.
- **Dispatch wiring (R7 / FORGE_DISPATCH_WIRING.md / WIRE_IT_UP.sh)** — the real
  root cause of "reported but not executed". One box env paste; box-side, gated.

## Repo-side, Replit-doable, NOT yet dispatched (because dispatch_mode:none)
- **R1** extract `szl_core` shared lib (byte-identical feeds, golden-file tests)
- **R2** de-commit stale `organs/amaru/.hf-mirror/serve.py`; CI fails if it returns
- **R3** real single-key DSSE verify in the receipt gates (neg+pos), label exactly
  "single-key DSSE verified; threshold=P2 roadmap, ledger=P3 roadmap"
- **R6** finance lineage: add Polygon.io + Frankfurter, yfinance labeled fallback
- Anti-collision honored: a sibling Forge works this same list — target-repo
  commits checked before any execution; guarded pushes only on live signed apps.

## Gated (report, don't fake)
- **R5** SLSA L1→L3 needs the cosign key (founder).

Honesty floor (v11): locked=8, Λ=Conjecture 1, BFT=Conjecture 2; never commit a
key, never weaken a gate, label live only on a real 200.
