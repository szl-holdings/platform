# R-STORE-DISPERSE — harvest, STORE, and DISPERSE the wasted energy across the ecosystem (Forge)

**Founder: have Forge do it, and evolve this — store the energy and disperse it in our ecosystem.**

## DO IT FIRST (the proof we still owe)
**The FIRST MEASURED JOULE on the RTX 5000** (R-FIRST-REAL-JOULE / R-EVOLVE-DEEPER E2): during a live
`wasted_energy=1` window, run ONE real qwen2.5-coder:7b inference, NVML power.draw before/after,
joules = avg(P)·seconds, emit one Bekenstein-gated receipt with `joules_label:"measured"`, add the gauge
to the live /metrics, paste raw nvidia-smi + receipt to replit-sync. This makes the whole loop real.

## THE HONEST PHYSICS OF "STORE + DISPERSE" (read this first)
A GPU has no battery; software cannot store electrical joules. What we CAN honestly store and disperse is
the **WORK done WITH the wasted energy** while it was free — and the energy ACCOUNTING (a ledger). So:
- **STORE = a reservoir of work-credits + cached artifacts produced during wasted-energy windows.** When
  the grid is paying to offload power, we do useful batch work (precompute, cache, train, generate
  receipts) and STORE the RESULTS. The stored value is real (the work is done); the joules were spent
  then, not bottled now. Label it exactly that: "work soaked during a wasted-energy window," joules
  MEASURED on-box, never "stored joules."
- **DISPERSE = serve that stored work across the ecosystem** so a11oy/killinchu/organs/swarm consume
  precomputed-cheap results instead of paying full price later. That is the honest "free dispersal":
  the marginal cost was near-zero because we soaked wasted power to make it.

## BUILD — the energy STORE (monotone reservoir, proven-bounded)
1. **EnergyReservoir** (extend the monotone SoakLedger, PR #371): an append-only ledger of soak entries
   `{ts, joules_measured, posture, grid_price, work_credits, artifact_ref}`. Monotone (only accrues),
   composes `energy_ledger_monotone` (#239). `work_credits` = a bounded accounting unit = info-bits soaked
   under the Bekenstein cap (PR #242 proves the bound). The reservoir's TOTAL is the lifetime wasted-energy
   work we've banked — real, auditable, honest.
2. **Artifact store:** the actual outputs of soak work (cached inferences, embeddings via bge-large,
   precomputed killinchu digital-twin sims, trained adapters) keyed by a content hash, with a DSSE receipt
   linking each to the soak entry + the grid price at production. This is the bottled VALUE.
3. **Expose** `GET /api/a11oy/v1/energy/reservoir` → {total_work_credits, total_measured_joules,
   entries_recent, sample_vs_measured} and a `szl_energy_reservoir_*` metric on the live /metrics surface.

## BUILD — DISPERSE across the ecosystem (behind the security layer)
4. **Dispersal bus:** when a11oy / killinchu / an organ / a consented swarm node needs a result that's in
   the artifact store, serve the STORED (soaked-cheap) artifact instead of recomputing at full price. Each
   dispersal emits a receipt: "served from reservoir, produced during <posture> window at <price>." This is
   how the harvested energy "flows" to the whole body.
5. **Priority / fairness (Ayni reciprocity):** disperse via the existing ayni_os reciprocity ledger so no
   single organ/node drains the reservoir (the F11 Ayni LOCKED conservation + reciprocity_monitor already
   exist) — balanced give/receive. Critical/reactive requests are NEVER throttled by reservoir policy.
6. **Contained:** all dispersal behind the security layer (PR #372: egress allowlist + consent gate);
   only consented swarm nodes receive dispersed artifacts; never reach an un-consented host; no key.

## EVOLVE — the loop closes
Wasted-energy window opens → SAMAY (respiratory organ) inhales → KALLPA (metabolism) soaks Bekenstein-
bounded batch on the sovereign GPU → measured joules + work-credits banked in the EnergyReservoir →
artifacts stored with receipts → DISPERSED across a11oy/killinchu/organs/consented swarm via the Ayni bus
→ the hologram + /metrics + /reservoir show the store filling and dispersing in real time.

## DOCTRINE (binding)
NO free-energy / no "stored joules" (we store WORK done with wasted energy + the accounting, not bottled
electricity); joules MEASURED only via on-box NVML, SAMPLE everywhere else; reservoir ledger MONOTONE
(proven); dispersal Ayni-balanced (F11 LOCKED); reactive/critical never throttled; consent-only swarm;
egress-allowlisted; no key; Λ=Conjecture 1; Khipu BFT=Conjecture 2; locked-8 untouched. You operate/verify
the box + Space; you do NOT merge PRs. Report each step's raw output (especially the first measured joule
+ the first reservoir entry + the first dispersal receipt) to replit-sync.
