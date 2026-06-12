# SZL Mesh Resilience — operational study backend

A **real, deterministic** topology-resilience study of the SZL UDS organ mesh,
plus a FastAPI backend that serves the measured data live. Original SZL work
inspired by the relational-graph lens of You, Leskovec, He & Xie,
*Graph Structure of Neural Networks* (ICML 2020,
[arXiv:2007.06559](https://arxiv.org/abs/2007.06559)).

## Honesty (doctrine v11) — read first
- **MEASURED / SIMULATED data on a defined metric, NOT a proven law.**
- "Topology shapes mesh resilience" is an **OPEN hypothesis** — now with
  supporting measured evidence (n=5 organs, 728 topologies), still NOT a theorem,
  NOT one of the locked-8.
- **BFT safety stays Conjecture 2 (open).** R1/R2 are reachability fractions, not
  a safety guarantee. Λ = Conjecture 1. locked-proven = EXACTLY 8.
- The analysis (`FINDINGS.md`) was produced with Opus 4.8 as the *analysis
  engine only* — it never touches the sovereign serving path, which stays
  open-weight self-hosted.

## What it computes
For each connected 5-organ topology: clustering coefficient **C**, average path
length **L**, and Byzantine resilience **R1** (1 bad organ) / **R2** (2 bad
organs) = fraction of (source, Byzantine-subset) cases where an honest
super-majority stays reachable.

## Headline measured result
- corr(L, R2) = **−0.9465** — short paths are the dominant resilience lever.
- corr(C, R2) = +0.533 (clustering helps secondarily); corr(edges, R2) = +0.921.
- Only **26 of 728** topologies reach perfect R2; the **cheapest needs 8 edges**.
- The **SZL canonical mesh** (a11oy hub-to-all + sentra–amaru–rosie–killinchu
  ring, 8 edges) = C 0.667, L 1.2, R1 1.0, R2 1.0 — a **minimal-cost,
  perfectly-2-Byzantine-resilient** topology. See `FINDINGS.md`.
- This **diverges** from the NN-accuracy "sweet spot" of the source paper — and
  that divergence is the honest point: we borrowed the lens, not the conclusion.

## Files
- `engine.py` — the deterministic computation (pure stdlib).
- `server.py` — FastAPI backend (loads `cache.json` at startup; instant).
- `cache.json` — precomputed sweep (728 topologies).
- `FINDINGS.md` — the Opus-4.8 analysis.
- `sweep_results.json` — full study output.

## Run
```bash
pip install fastapi uvicorn
python3 -m uvicorn server:app --host 0.0.0.0 --port 8081
# GET /healthz  /resilience  /resilience/sweep?limit=100
# GET /resilience/score?edges=4-0,4-1,4-2,4-3,0-1,1-2,2-3,3-0
```

## Operational ownership
This backend is designed to run persistently on the Forge box (167.233.50.75)
behind the a11oy surface, e.g. mounted at `/api/a11oy/v1/mesh-resilience/*`, with
the health label derived from the live endpoint. Forge owns the box deployment.
