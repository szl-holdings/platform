# Forge report — revenue-estimate microservice LIVE

**When:** see filename UTC stamp
**Directive:** founder "check github more, be exhaustive, no bandaids, get me rich" —
the honest, real, doctrine-v11 answer to *how does SZL make money*, shipped as running
code (not a deck, not a promise).

## What shipped (LIVE, verified 200 from the public internet)
Standalone FastAPI microservice — built like verify-api / mesh-resilience, deliberately
**NOT** an edit to the LOCKED serve.py.

- `https://a11oy.net/api/a11oy/v1/revenue/healthz` → 200
- `https://a11oy.net/api/a11oy/v1/revenue/estimate` → 200 (live grid input)
- `https://a11oy.net/api/a11oy/v1/revenue/thesis` → 200
- `https://a11oy.net/api/a11oy/v1/revenue/` → 200 (landing)
- CORS `*`; nginx marker `REVENUE-API-PROXY`; box systemd `szl-revenue-estimate` :8084.

It reads the **live** wasted-energy posture from the harvest service
(`:8082/posture`, grid price was -15.7 €/MWh at deploy) and turns it into 4 revenue
streams.

## Honesty (doctrine v11 — non-negotiable)
- All 4 streams labelled **ESTIMATE**, never "revenue", never "proven".
  - `energy_arbitrage` — basis **live**; value > 0 *only* when grid price < 0 (paid to
    soak), else 0.
  - `demand_response_floor`, `flare_carbon_credit`, `verified_compute_premium` — basis
    **published-comparable** (Crusoe Energy / DR market / 45Q-style references). These are
    *market context*, explicitly **not** SZL revenue.
- Every stream prints `our_current_node` (~0.3 kW, sub-cent/hr) next to
  `market_reference` (100 MW, e.g. 1570 €/h) so the honest gap is impossible to miss.
- `/thesis` opens: *"stranded-energy→compute is NOT novel — Crusoe already proved it"*,
  then a concrete `what_needs_founder` list (the real blockers: hardware, sited power,
  customers).
- Top-level `disclaimer` always contains the word *promise* ("these are ESTIMATES, not a
  promise"). joules = SAMPLE. sovereign untouched. locked-8 + Λ=Conjecture 1 untouched.
- No key committed. No PR merged. Additive only.

## Source aligned
GitHub `szl-holdings/platform` → `apps/revenue-estimate/{engine.py,server.py,
test_engine.py}` (byte-matches box). `engine.py` pure stdlib → 6 unit tests pass offline
in sandbox and on the box.

## Honest scope / not done (founder-gated)
- Real *measured* joules / GPU thermals still need an nvidia-smi exporter on owned GPU
  hardware (box is CPU-only). Until then joules stay SAMPLE — by design, not a gap I can
  close in software.
- The big market-reference numbers become *our* numbers only with sited power +
  hardware + customers — surfaced explicitly in `/thesis` rather than hidden.
