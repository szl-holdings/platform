# Forge report — R-MONEY-NOW (A): GPU verified-compute marketplace ESTIMATE

**Date:** 2026-06-13 (UTC)
**Order:** replit-sync `NEXT_ORDER.md` + `energy_engine/R_MONEY_NOW.md` part (A) —
turn the sovereign node's wasted-window capacity into honest, attestable revenue.
**Doctrine:** v11. ESTIMATE not revenue (a dollar counts only when a rental
SETTLES); NO mining/PoW; crypto = payment rail only; joules SAMPLE; sovereign &
locked-8 untouched; Λ = Conjecture 1; no key committed; additive only; no serve.py
edit; no PR merge.

## Done + LIVE
- New `/marketplace` endpoint on the already-deployed `szl-revenue-estimate`
  microservice (box 167.233.50.75 :8084, `/opt/szl/revenue-estimate`), public via
  the existing nginx REVENUE-API-PROXY rule (no nginx change needed).
- **a-11-oy.com/api/a11oy/v1/revenue/marketplace = HTTP 200**, honest payload:
  - commodity **$86.87–$195.46/mo**, +25% verified premium **$108.59–$244.32/mo**
    (matches the order's ~$86–241 band).
  - `settled_usd_to_date = 0.0`, `status = not_listed` (settle-to-count).
  - `energy_gated = true`, reading live grid price **-15.7 EUR/MWh**.
  - doctrine string carries **"NO mining"**; +25% premium = DSSE receipt + Lean
    bounds (#239 Bekenstein, #240 Landauer).
- Math: $0.20–0.45/GPU-hr × 730 h × 0.70 uptime × 0.85 (after 15% venue fee)
  → commodity; × 1.25 → verified-compute premium. Candidate venues: Vast.ai,
  RunPod, io.net, Akash.
- Named agent `apps/agentic-gpu/compute_marketplace_agent.py` (`list_and_earn()`):
  reads venue credentials from env by **presence only** (VAST_API_KEY /
  RUNPOD_API_KEY / IONET_API_KEY / AKASH_WALLET_FUNDED); with none present returns
  `needs_founder_input` + the exact founder steps, and **REFUSES to fabricate** a
  listing or a settled dollar. Never logs/commits the secret value.
- Tests: `test_engine.py` now **8/8 pass** offline (sandbox) AND on the box venv;
  agent offline degrade path verified (`needs_founder_input`, settled $0, mining
  False). Sibling endpoints `/estimate` `/thesis` `/healthz` still 200 — no
  regression.

## GitHub-aligned (byte-match box)
- `szl-holdings/platform` `apps/revenue-estimate/{engine.py,server.py,test_engine.py}`
  updated.
- `szl-holdings/platform` `apps/agentic-gpu/compute_marketplace_agent.py` added.

## Founder-gated (what unblocks REAL dollars)
The estimate is live and honest; turning it into settled revenue is a **founder
step**, not a Forge step:
1. Create a host account on a venue (Vast.ai is email-only to start).
2. Set a payout method (USD: Wise/PayPal/Stripe; or BTC/IO/USDC).
3. Paste the venue API key into the secret store under its env var (never commit).
Once a key is present, `list_and_earn()` flips to `ready_to_list`; a dollar is
counted only after a rental actually settles.

— Forge
