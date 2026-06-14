# R-FINISH-IT-ALL — Forge: execute the whole queue to completion. The finish line. DEPLOY, do NOT merge.

Founder: "have Forge handle it all, let's finish." This is the execution checklist. Work top-to-bottom; the
single bottleneck is the HF Space IMAGE REBUILD — most surfaces stay 404 until you rebuild+push the a11oy +
killinchu Space images with the new modules COPY'd in the Dockerfile. Do that FIRST, then the rest.

## THE DEPLOY (do first — this unblocks everything 404)
Rebuild + push the a11oy HF Space image (Dockerfile must COPY these modules), then smoke-test each to 200:
- szl_dark_surfaces_register.py (PR #342) -> energy/budget, engine/status, formula/sovereign, energy/provenance,
  heart/pulse, ayni  [some already 200; get ALL to 200 and keep /proof from reverting]
- szl_anatomy_loop.py (PR #341) -> /anatomy/loop  (+ #343 YARQA-as-circulatory consolidation)
- szl_research_infra.py (PR #344) -> /research/prereg, /research/trial, /research/verify (14 tests green)
Rebuild + push the killinchu Space image -> finance/* + realestate/* + /elite/wiring (PR #115) all 200.
Push the NEW HF static Space SZLHOLDINGS/energy from /home/user/workspace/hf_energy_space/ (the missing energy
space; label renewable-share as "% of demand").

## THE WIRING (after deploy)
- Fold research INTO energy (R-FOLD-RESEARCH-INTO-ENERGY): wire szl_research_infra into szl_anatomy_loop as
  intake source=verified-research; the trial-receipt chain shares the szl-lake provenance ledger; each experiment
  receipt cites the Bekenstein #239 + Landauer #240 energy-information bound. ONE loop, one ledger.
- Keep the measured joule bridged (212 J, joules_label=measured) and the agentic marketplace ready (R-AGENTIC-
  MARKETPLACE): when VAST_API_KEY/AKASH_WALLET/IONET/RUNPOD appears in YOUR secret store, the agent auto-lists/
  prices/energy-gates/receipts/settles. Founder provides the key; agent does the rest.
- Mirror open-weight models (R-EVOLVE-FREE) + AlphaFold3/Boltz-2/GROMACS (R-QBIO-VERTICAL) sovereign; stand up
  vLLM; assemble the free-credits application pack (~$500K, founder applies).
- Data-center registry (R-WORLD-DATACENTERS): /harvest/datacenters from dchub/dcmap/OSM, cross-wired to grid price.

## REDS / ALIGNMENT (finish)
- a11oy<->killinchu szl_evidence_research.py drift: DONE (allow-listed) — confirm green.
- platform #357/#358/#360: real Lighthouse/e2e PR-check reds (main green) — fix the app-quality cause on-box; do
  NOT --admin past them. platform main CI reds you diagnosed as runner-cancellations — keep the concurrency fix.
- lutar-lean #239-242 KEYSTONE: founder merges by hand, NEVER --admin.
- FOUNDER DECISION still open: one canonical DSSE receipt schema for the loop (5 payloadTypes today) or a
  documented crosswalk.

## REPORT BACK (to replit-sync, concise): which surfaces flipped 200, the energy Space URL, the agent-state
(awaiting-key vs listed), any red that needs a founder call, and the founder action list (VAST_API_KEY first;
chaski ollama serve; credit-program applications; receipt-schema decision; send the outreach playbook emails).

## DOCTRINE v11 (hard): joules MEASURED only via real exporter (212J), SAMPLE otherwise; no free-energy (#239/#240,
Ayni-balanced); energy != data; consent/contract only no theft; NOT mining; verticals = info+citations never
regulated advice never fabricated; research = process-verification, NO psi claim, cite never plagiarize; open-weight
+ open-license only; effectors SIMULATED; organs EXPERIMENTAL; revenue ESTIMATE settle-to-count no guarantee;
locked=8; Λ=Conjecture 1; Khipu=Conjecture 2; SLSA L1 honest; NEVER commit a key/seed; do NOT merge. Finish the
deploy; the half-state is the only unacceptable outcome.
