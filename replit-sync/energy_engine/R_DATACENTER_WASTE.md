# R-DATACENTER-WASTE — add the data-center wasted-energy layer + route idle compute into the loop. DEPLOY, do NOT merge.

Founder: "find the data centers — AI + crypto — they're wasting energy, jack in, route the wasted energy to my
ecosystem and keep it contained." The waste is REAL and enormous (cited): enterprise GPUs run at ~5% utilization
= 95% idle, ~$401B idle AI capacity (Cast AI / VentureBeat 2026); global data-center PUE ~1.58 (huge cooling/
conversion loss); waste-heat already feeds district heating (Microsoft Finland = 40% of a 2 TWh district via
Fortum; NTT Berlin = 8 MW, ~6000 t CO2/yr saved). BUT physics + doctrine hold: electricity CANNOT travel as data;
NEVER siphon a data center's power without a contract (theft kills the SLSA/DSSE provenance moat). Capture it the
THREE legitimate ways and route the result into the anatomy loop.

## THE THREE LEGITIMATE "JACK-IN" ROUTES (build the layer honest)
1. IDLE-GPU CAPTURE (capturable TODAY, zero hardware) — the 95% idle is wasted COMPUTE = wasted energy. The
   verified-compute marketplace agent (compute_marketplace_agent.py) is the jack: RENT idle GPUs cheap from
   data centers that list on Vast.ai/Akash/io.net during their idle windows, run our useful bounded work on them,
   route the WORK + receipts into the anatomy loop. Consensual, contracted, full provenance. This is the real
   "route their wasted compute into my ecosystem."
2. WASTE-HEAT RECOVERY — data-center heat (PUE overhead) is recoverable via heat-pump/district-heating or TEG/ORC
   (our Seebeck reverse-loop thesis at facility scale). Route = co-located heat-recovery contract. Map it; the
   capture is a hardware/contract step (founder/partner), label SAMPLE/ESTIMATE envelope, never claim captured W
   without a meter.
3. CO-LOCATION (behind-the-meter) — place SZL nodes inside/beside a facility to soak stranded/curtailed power
   on-site. "Move the compute to the energy." Founder capital + site contract.

## FORGE — BUILD (additive, no merge)
- Add a DATA-CENTER layer to the wasted-energy harvest map (apps/agentic-gpu/ harvest sources): a
  datacenter_waste.py source that surfaces HONEST public signals — idle-GPU availability from the marketplaces we
  can query (Vast.ai/Akash listings = real rentable idle capacity), public PUE / waste-heat references (cited,
  not fabricated). Expose /api/a11oy/v1/harvest/datacenters returning {idle_gpu_offers:[{venue,gpu,$/hr,region}],
  waste_heat_refs:[{operator,project,MW,source_url}], pue_context, honesty}. NEVER invent a feed; degrade honestly.
- WIRE idle-GPU capture into the loop: when the marketplace agent rents a cheap idle GPU (in a negative/cheap
  window), that job is a SAMAY intake into the anatomy loop -> KALLPA work_credits (Bekenstein/Landauer bounded)
  -> heart beat -> EnergyReservoir -> provenance receipt -> Ayni close. Tag the receipt source=datacenter-idle-rental.
- Add the data-center layer to the estate hologram + harvest map as a new node cluster with the three routes
  shown as edges (idle-GPU=revenue+signal, waste-heat=energy ESTIMATE, co-location=energy). Honest badges.

## DOCTRINE v11 (hard): energy != data (no siphoning power over the wire); consent/contract ONLY (rent, co-locate,
or heat-recover by agreement — NEVER take without consent = theft = moat death); idle-GPU rental is the honest
"jack" and is consensual; waste-heat/co-location capture is SAMPLE/ESTIMATE until a real on-site meter; no
free-energy (bounded by Bekenstein #239 + Landauer #240; loop Ayni-balanced); no mining; joules SAMPLE off-box,
MEASURED only via the live nvidia-smi exporter (now live on betterwithage = 212 J real); locked=8; Lambda=Conj1;
no key committed; do NOT merge. Map the whole world's data-center waste; capture it ONLY the legitimate way; keep
it contained in the anatomy loop.
