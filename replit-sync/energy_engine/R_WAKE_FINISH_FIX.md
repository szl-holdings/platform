# R-WAKE-FINISH-FIX — wake + finish the open queue + fix the one real regression. DEPLOY, do NOT merge (except where noted).

Zoom-out status (verified 2026-06-13 ~14:30Z): the build is essentially DONE; what remains is operational.
Forge idle ~2.5h since the r7 deploy (order b3bfddab). The unified loop is LIVE (/anatomy/loop, /formula/
sovereign, /energy/budget, /heart/pulse, /revenue/marketplace all 200; joules MEASURED; grid -19.17). Four gaps:

## GAP 1 — REAL REGRESSION (fix first): /api/a11oy/v1/compute-pool is DOWN (HTTP 000 / timeout, twice).
This is the multi-GPU fabric surface (where both SAMAY lungs + chaski show). It was 200 earlier today. Diagnose
+ restore to 200. This is the one thing actually broken, not just pending — prioritize it.

## GAP 2 — FINISH THE 404 SURFACES (deploy-branch, same as the r7 pass that worked):
Still 404, ride later in the stack: /ayni, /research/prereg, /research/verify, /research/{id}, /harvest/datacenters.
Fold these into the a11oy deploy branch: szl_research_infra.py (#344, 14 tests green), the /ayni route (szl
ayni_os_serve), and the datacenter_waste source (#R-WORLD-DATACENTERS). Rebuild+push the a11oy image; smoke-test
each to 200. Also push the NEW HF static Space SZLHOLDINGS/energy from /home/user/workspace/hf_energy_space/
(currently 404/401 — not published yet).

## GAP 3 — WAKE CHASKI (2nd SAMAY lung of the ONE loop): on 100.76.58.50 set OLLAMA_HOST=0.0.0.0:11434, start
`ollama serve`, confirm curl http://100.76.58.50:11434/v1/models -> 200; then /compute-pool flips chaski
reachable=true + gpu_nodes_reachable 1->2 (real probe). If founder hands needed on that box, say so with exact
commands. Do NOT fake it up before Ollama answers.

## GAP 4 — MAKE THE a11oy STACK PERMANENT: #341/#342/#343/#344 are deployed-via-branch but NOT merged to main, so
the live loop is not yet permanent. These are doctrine-clean + tested. Confirm each is green + mergeable and ready
for the FOUNDER to merge (Forge does NOT merge; this is the founder gate). Report merge-readiness per PR so the
founder can land them. (lutar-lean #239-242 keystone = founder-only, never --admin; platform #357/358/360 fix the
real Lighthouse/e2e cause on-box, no --admin.)

## STILL ON THE FOUNDER (Forge cannot do these — surface in the report):
- VAST_API_KEY -> Forge secret store = the marketplace starts EARNING (settled_usd is None/not_listed today; this
  is the #1 missing money switch). Then the agentic loop auto-lists/prices/gates/receipts/settles.
- chaski `ollama serve` (if remote start not possible from the box).
- Free-credit applications (NVIDIA Inception/MS Founders Hub/Google ~$500K, non-dilutive).
- Canonical loop DSSE receipt-schema decision (5 payloadTypes -> pick one or document crosswalk).
- Send the outreach playbook emails (drafted, ready).

## DOCTRINE v11 (hard): joules MEASURED only via real exporter (212J), SAMPLE otherwise; ONE loop/ledger/Ayni;
chaski reachable only on real probe 200; no free-energy (#239/#240, Ayni-balanced); energy != data; consent only;
NOT mining; research=process-verification NO psi claim cite never plagiarize; verticals=info+citations never advice;
revenue ESTIMATE settle-to-count no guarantee; effectors SIMULATED; organs EXPERIMENTAL; locked=8; Λ=Conjecture 1;
Khipu=Conjecture 2; SLSA L1 honest; NEVER commit a key/seed; do NOT merge (founder gate). Fix compute-pool first,
finish the 404s + energy Space, wake chaski, report merge-readiness. Half-state is the only unacceptable outcome.
