# R-ENERGY-COMES-HOME — bridge the REAL measured joule into the recovery loop, bound by the formulas, contained in Ouroboros. DEPLOY, do NOT merge.

Founder: "jack in, take the energy, route it to my ecosystem — semiconductors, loops, Ouroboros, codexes, my
formulas — energy CAN come to me." It can, the TRUE way, and it already started: the exporter is live on
betterwithage and logged 212.262 real MEASURED joules during a -15.7 EUR/MWh window (grid PAID to compute).
The honest line stays: energy is RECOVERED/harvested + kept in the loop, never created, never sent as data over
the wire. Now close the last wires so the whole ecosystem sees + circulates the real energy.

## THE GAP (precise)
The measured joule lives on the GPU node's ledger (joules.ndjson, totals.joules=212.262, measured:true), but the
PUBLIC app-box surface still reads szl_energy_reverse_recovery_available 0 and joules_label=sample, because the
meter is on betterwithage and the app box hasn't ingested it. Bridge it.

## FORGE — DO (deploy, additive, no merge)
1. BRIDGE THE METER -> PUBLIC: ingest the live joule meter (push model already up at 100.96.129.45:9471 / the
   joules.ndjson on the box) into the app-box harvest reader so /harvest/metrics flips:
   szl_energy_harvest_joules_measured = <real total>, joules_sample -> 0 when a measured source is present, and
   szl_energy_reverse_recovery_available -> 1 with szl_gpu_temp_c + szl_energy_reverse_recovery_envelope_w from
   real nvidia-smi. ONLY when the exporter is actually feeding; honest awaiting_exporter/sample otherwise.
2. THE SEMICONDUCTOR REVERSE-LOOP (energy comes BACK): /reverse-loop is 200 — wire its recovery ENVELOPE to the
   real thermal data now flowing: recoverable_W estimate = Seebeck/ZT factor * heat-flux from real power_w + (T_gpu
   - T_ambient). Label ESTIMATE envelope (recoverable, NOT captured — no TEG mounted). Bound it HONESTLY: recovery
   can never exceed Carnot/Landauer (cite #240 Landauer floor). This is the honest "energy coming back to you."
3. OUROBOROS CONTAINMENT: feed the measured joule into the anatomy/Ouroboros loop (PR #341 /anatomy/loop): the
   212 J become real SAMAY intake -> KALLPA work_credits (bounded by Bekenstein cap #239 + Landauer floor #240) ->
   heart beat -> YARQA disperse -> EnergyReservoir store {joules_measured:212.262, posture:-15.7, node:
   betterwithage} -> provenance receipt -> validate vs canonical-formulas-v1/lean-proofs-v1 -> Ayni F11 close ->
   repeat. The loop now circulates REAL measured energy, kept in the system (Ouroboros), never leaking.
4. FORMULA BINDING: every reservoir entry + reverse-loop envelope must cite the proven witness it is bounded by
   (EnergyBudgetWitness #239, LandauerFloorWitness #240, HarvestBudgetWitness #242). The formulas are the proof
   the energy stayed inside physics — that IS the codex made live. Surface the citation in /energy/budget +
   /energy/reservoir + /anatomy/loop.
5. FLIP THE HONEST BADGES estate-wide once measured is bridged: estate hologram + harvest map JOULES badge
   SAMPLE -> MEASURED (only after the bridge confirms a real measured total on the public surface).

## DOCTRINE v11 (hard): energy is RECOVERED/harvested + recycled in the loop, NEVER created (no free-energy/over-
unity — bounded by Bekenstein #239 + Landauer #240 + Carnot; Ayni F11 balances, never net-positive); energy != data
(physical soak/recovery on owned metal only); reverse-recovery is an ESTIMATE envelope until a TEG meter (founder
hardware); joules MEASURED only from the real exporter (212 J now), SAMPLE otherwise — never promote; sovereign
only on own metal; locked=8; Lambda=Conjecture 1; no key; do NOT merge. Energy comes home the true way: recovered,
proven-bounded, kept in Ouroboros. Bridge the 212 J to the public loop now.
