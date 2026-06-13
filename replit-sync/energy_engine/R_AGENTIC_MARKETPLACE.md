# R-AGENTIC-MARKETPLACE — make the verified-compute marketplace AGENTIC (self-driving) + exact keys. DEPLOY, do NOT merge.

Founder: "make it agentic, send Forge the instructions, what key for Vast + other sites." Make the marketplace
agent run itself the moment a venue key appears — auto-list, auto-price, energy-gate, auto-receipt — so the
founder's only job is the account+key, and the agent does the rest hands-off.

## EXACT KEYS / ACCOUNTS THE FOUNDER WILL PROVIDE (you read by PRESENCE only, never log/commit the value)
- Vast.ai (DO FIRST): host account at https://vast.ai/host (email-only). Key env: VAST_API_KEY. Payout: Wise/
  PayPal/Stripe or BTC/USD.
- Akash (rides our k3s, no reformat): provider wallet. Env: AKASH_WALLET (funded ~5 AKT; founder holds the SEED,
  pastes only address/funded flag — NEVER the seed). Payout: ACT/USDC.
- io.net: account. Env: IONET_API_KEY. Payout: IO token.
- RunPod (optional): account + Stripe Connect. Env: RUNPOD_API_KEY. Payout: USD.
Founder pastes each into FORGE'S secret store on the box (NEVER in chat, NEVER committed). Agent already reads by
presence and returns needs_founder_input with these exact steps when absent — keep that honest behavior.

## MAKE IT AGENTIC (compute_marketplace_agent.py — self-driving loop)
When a venue key is present, the agent runs an autonomous control loop (no human per-action):
1. AUTO-LIST: register the sovereign RTX node on the keyed venue (Vast host agent / Akash provider / io.net), set
   the listing live. status not_listed -> ready_to_list -> listed.
2. AUTO-PRICE: read live market comparable for the GPU class, set $/GPU-hr competitively in-band ($0.20-0.45
   commodity; scientific tier $1.20-8.50 when running MD/AlphaFold/Boltz/GROMACS). Re-price on a schedule.
3. ENERGY-GATE: bias accept/keep-rental + heavy batch scheduling to cheap/negative-price windows (live harvest
   posture, -27.42 EUR/MWh now) so marginal power cost ~0. Never refuse an already-profitable lease.
4. AUTO-RECEIPT (the moat, every job): emit a DSSE receipt {gpu_seconds, tokens|flops, posture, grid_price,
   settlement, witness #239/#240} -> provenance chain -> validate canonical-formulas-v1/lean-proofs-v1 ->
   Ayni F11 -> feed the anatomy loop as a SAMAY intake (source=marketplace-rental). The loop circulates real paid work.
5. SETTLE-TO-COUNT: only count a dollar when a rental actually settles; surface live on /revenue/marketplace
   (settled_usd_to_date updates from real payouts). NEVER promote ESTIMATE to revenue.
6. SELF-HEAL + HONEST HALT: if a venue API errors, degrade + report, never fabricate a listing/earning; if no key,
   needs_founder_input. Log decisions to replit-sync. Expose /api/a11oy/v1/revenue/marketplace/agent-state
   {venue, listed, current_price, last_settlement, posture_gated, autonomy:on|awaiting-key}.

## ALSO (this pass, free first): finish the still-404 deploys (ayni, anatomy/loop, formula/sovereign, proof,
harvest/datacenters), fix a11oy<->killinchu szl_evidence_research.py drift, deploy killinchu finance/* + realestate/*
(PR #115), and (incoming PRs) the HF energy Space + the YARQA->anatomy consolidation (one unified loop).

## DOCTRINE v11 (hard): agentic = autonomous WITHIN doctrine — consent/contract only (rent, never siphon); NOT
mining (useful verified compute only); read keys by presence, NEVER log/commit a key or seed; revenue ESTIMATE +
settle-to-count, no guarantee; energy-gate honest; joules MEASURED only via real exporter (212 J now real),
SAMPLE otherwise; no free-energy (#239/#240, Ayni-balanced); organs EXPERIMENTAL; sovereign only on own metal;
locked=8; Λ=Conjecture 1; Khipu=Conjecture 2; do NOT merge. Founder gives the Vast key first; the agent does the rest.
