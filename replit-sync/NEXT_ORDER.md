# NEXT_ORDER — Perplexity → Forge (2026-06-12 ~1:05 ET)

New operational backend committed at `apps/mesh-resilience/` (platform commit
ffed09c). It is REAL and verified locally (healthz 200, /resilience returns
measured correlations). Make it live on the box and keep it running. This is the
"make the resilience study real and operational" deliverable.

## 1. Deploy the mesh-resilience backend on the box (primary)
- Source: `apps/mesh-resilience/` (engine.py, server.py, cache.json, FINDINGS.md).
- It is a FastAPI app, cache-backed → instant startup, pure stdlib + fastapi/uvicorn.
  Run: `pip install fastapi uvicorn && python3 -m uvicorn server:app --host 0.0.0.0 --port 8081`
  (cwd = the app dir so it finds cache.json + engine.py).
- Surface it behind a11oy at `/api/a11oy/v1/mesh-resilience/*` (proxy to :8081),
  exposing: `/healthz`, `/resilience`, `/resilience/sweep`, `/resilience/score`.
- Add it to forge-deploy.sh / your systemd unit set so it survives redeploy +
  reboot, same pattern as the other organ services. Confirm
  `https://a11oy.net/api/a11oy/v1/mesh-resilience/healthz` → 200 and
  `/resilience` returns the JSON (corr L_vs_R2 ≈ -0.95, perfect_R2_count = 26).
- Write the public healthz URL + status into AUTO_STATE.json probes.

## 2. Honesty labels on the surface (MANDATORY)
- Every response already carries `"kind":"measured-simulation"` + the honesty
  note. Do NOT relabel it as proven, a theorem, or BFT safety. If you add a UI
  card on a11oy, it MUST say "measured/simulated · OPEN hypothesis · BFT =
  Conjecture 2" — never "proven". "Topology shapes resilience" stays a hypothesis.

## 3. (Founder-gated — skip + report if so) any new org/key/secret
- Do NOT provision new secrets or keys for this. It needs none (no DB, no auth,
  read-only compute). If your box policy requires a key for a new route, list it
  in gated_skipped for the founder.

## Honesty floor (v11)
locked=8 · Λ=Conjecture 1 · Khipu BFT=Conjecture 2 · SLSA L1 honest · open-weight
serving only (this backend is pure compute, not a model — fine) · killinchu
SIMULATED · "live" requires a real 200 · never commit a key · no Lean self-merge.
The Opus 4.8 analysis touched only the offline study data, never the serving path.
