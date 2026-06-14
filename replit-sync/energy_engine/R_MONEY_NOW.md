# R-MONEY-NOW — turn the GPU into a dollar this month + deploy loops + clear the reds (DEPLOY, do NOT merge)

Founder: "make the energy into money right away — there has to be a way." There is, and it needs NO
founder capital and NO on-site node. It is the 4th revenue front: sell the RTX 5000's wasted-window
capacity on a decentralized GPU marketplace, paid in USD or crypto, for REAL useful AI work (NOT mining —
mining is doctrine-forbidden waste; this is proven, attestable compute). Plus: deploy the loop/formula
surfaces, and clear the remaining CI reds I could not fix from off-box.

## A) MONEY NOW — verified-compute marketplace agent (NEW, fastest cash, doctrine-clean)
Build apps/agentic-gpu/compute_marketplace_agent.py + a /compute-market surface:
1) HONEST list-and-earn: register the RTX 5000 @ betterwithage on a consumer-tier GPU marketplace
   (Vast.ai email-only start; or RunPod/io.net/Akash). One-line Linux host agent. Founder creates the
   account + payout method (Wise/PayPal/Stripe for USD, or BTC/IO/ACT for crypto) — that account step is
   FOUNDER (KYC/payout), the wiring is yours.
2) ENERGY-GATED scheduler: only accept/keep rentals + run jobs during cheap/negative-price windows
   (reuse the live aWATTar/-4.92 EUR/MWh posture from harvest/metrics). Power cost → ~0 in those windows.
3) VERIFIED-COMPUTE premium: every job that runs ships a DSSE receipt + Lean-cited bound (Bekenstein cap
   #239 + Landauer floor #240) → this is the +25% premium over commodity. Receipt persists to the
   provenance chain (the containment loop). NO mining, NO proof-of-work, NO fabricated joule.
4) Expose /api/a11oy/v1/revenue/marketplace returning honest ESTIMATE: ~$86–$193/mo per RTX 5000 at 70%
   uptime, $0.20–$0.45/GPU-hr, net ~15% fee; +25% verified premium → ~$107–$241/mo. ALL labeled ESTIMATE.
HONESTY: only count a dollar when a rental actually settles. Never promote ESTIMATE to revenue. Crypto =
payment rail only (io.net IO / Akash USDC); we are NOT mining and NOT speculating with the box.

## B) DEPLOY the dark loop/formula surfaces (re-probed 404 right now, code is merged)
Behind serve.py (try/except register) OR standalone microservice + nginx (your verify-api pattern), one at
a time, confirm public 200, paste curl: /energy/budget → /energy/provenance → /heart/pulse → /engine/status
→ /revenue/estimate → /revenue/marketplace (new) → /formula/sovereign → /ayni. No serve.py clobber. No merge.

## C) THE CONTAINMENT LOOP (run when surfaces live + a joule measured)
harvest → SAMAY soak on RTX 5000 (real marketplace job or eval) → EnergyReservoir {ts, joules, posture,
grid_price, work_credits, artifact_ref, marketplace_settlement?} → DSSE receipt → provenance chain →
validate vs canonical-formulas-v1 / lean-proofs-v1 → Ayni-balanced F11. Energy in, paid work out, proof kept.

## D) GPU thermal bridge — FOUNDER step (you were right it is not yours)
betterwithage is Windows; only Ollama :11434 reachable. Founder runs on the Windows box:
  python gpu_thermal_exporter.py    (serves :9839/gpu/thermal)
then app box: GPU_THERMAL_URL=http://100.125.77.31:9839/gpu/thermal → first MEASURED joule. No bandaid meanwhile.

## E) CI REDS I could not fix off-box — HAND TO FORGE
Merged this pass: anatomy #7/#8, a11oy #328–#340 (12), platform 14 incl #365 (doctrine fixed by sync), +#362/#371/#372/#373 landed via main. 29 PRs total.
STILL RED (synced to main, DCO+typecheck now green, but these remain — need on-box fixes):
  platform #356 #357 #358 #360 — failing: Lighthouse perf budgets (a11oy/carlota-jo/counsel/sentra/terra/
  vessels) + e2e-app (counsel, sentra) + commit-lint on some. These are real app-quality fails on specific
  frontend apps; need the app run + profiled fixes on the box. FORGE: fix the Lighthouse budgets + the two
  e2e app failures (counsel, sentra), squash commit-lint, then these 4 go green and can merge. Do NOT --admin
  past a real Lighthouse/e2e fail; fix the cause.
NOT fixable/forbidden: lutar-lean #239–#242 keystone — leave for founder, never --admin.

## DOCTRINE v11 (unchanged): no free-energy (recycle, bounded by Bekenstein #239 + Landauer #240); no mining/
PoW waste; energy ≠ data (route via behind-the-meter / Virtual PPA+REC / demand-response / marketplace-contract
only); consent-only; joules SAMPLE until on-GPU NVML; crypto = payment rail only, never speculate the box;
sovereign only on own metal; locked=8; Λ=Conjecture 1; Khipu BFT=Conjecture 2; no key committed; do NOT merge.
Half-state is the only unacceptable outcome. Money-now front A is the fastest honest dollar — wire it.
