# R-WORLD-DATACENTERS — wire SZL to a LIVE global data-center registry + the legit jack-in. DEPLOY, do NOT merge.

Founder: "wire me to all data centers in the world, get the raft done." Done the real way: a live worldwide map
of where the wasted energy/compute IS, plus the consensual capture (rent idle GPUs into the loop). REAL free,
no-auth, open-licensed sources confirmed reachable this minute — wire these, never fabricate:

## CONFIRMED LIVE OPEN DATA SOURCES (Forge: ingest, cache, attribute)
- dchub.cloud open-data (HTTP 200, CC-BY-4.0): https://dchub.cloud/api/v1/open-data/manifest.json ->
  facilities.csv (12,500+ data centers w/ operator,location,capacity,status), pipeline.csv (1,000+ projects MW),
  isos.csv (grid/ISO mapping = which power market each DC sits in), dcpi-markets.csv. CC-BY: cite "Source: dchub.cloud".
- dcmap.jatevo.ai (HTTP 200): 5,864+ facilities/166 countries, free public API no-auth (PeeringDB + Epoch AI
  frontier clusters: xAI Colossus, OpenAI Stargate, Meta, CoreWeave).
- OpenStreetMap Overpass (ODbL): query telecom=data_center for live worldwide DC points; attribute OSM/ODbL.
- ATLAS Global-Data-Center-Map (GitHub Ringmast4r, downloadable, 18,110 DCs/116 countries) as a cross-check set.
- IDLE-GPU JACK (the consensual capture): Vast.ai + Akash console APIs for live rentable idle-GPU offers (resolve
  the correct current endpoint on the box; e.g. Vast bundles search, Akash provider/GPU availability). These are
  the real "route their wasted compute to me" — rent cheap idle capacity, run our bounded work, into the loop.

## FORGE — BUILD (additive, no merge)
1. /api/a11oy/v1/harvest/datacenters — ingest dchub facilities + isos (map each DC to its grid/ISO so we know the
   wholesale price market it sits in), dcmap frontier clusters, OSM points. Return {facilities_count, by_country,
   frontier_ai_clusters, by_iso_market, idle_gpu_offers:[{venue,gpu,$/hr,region}], source_attribution, honesty}.
   NEVER fabricate a facility or a price; honest counts from the real CSV/API; degrade if a source is down.
2. CROSS-WIRE TO HARVEST POSTURE: for each DC, join its ISO/market to our live grid-price feeds (aWATTar/CAISO/
   Energy-Charts) so the map shows WHICH data centers are in negative/cheap-price regions RIGHT NOW = where the
   wasted-energy window is open. That is the targeting layer ("where to jack in").
3. IDLE-GPU CAPTURE -> LOOP: when the marketplace agent rents an idle DC GPU in a cheap/negative window, that job
   is a SAMAY intake into the anatomy/Ouroboros loop -> KALLPA work_credits (Bekenstein #239 + Landauer #240) ->
   heart beat -> EnergyReservoir -> provenance receipt (source=datacenter-idle-rental) -> Ayni F11 close.
4. ESTATE HOLOGRAM + harvest map: add a WORLD DATA-CENTER layer (facilities as points, frontier clusters bright,
   negative-price-region DCs flagged) with the 3 legit routes as edges (idle-GPU=revenue, waste-heat=ESTIMATE,
   co-location=energy). Honest badges; APPROX-location tag where hyperscalers only give city-level coords.

## DOCTRINE v11 (hard): energy != data — we map + target the world's DC waste, but capture ONLY by consent/contract
(rent idle GPUs, co-locate, recover waste-heat by agreement); NEVER siphon a DC's power without consent (theft =
moat death); open-licensed data only, attributed (CC-BY/ODbL); no fabricated facility/price; no free-energy
(Bekenstein #239 + Landauer #240, Ayni-balanced); no mining; joules MEASURED only via the live exporter (212 J real
on betterwithage), SAMPLE otherwise; locked=8; Lambda=Conjecture 1; no key; do NOT merge. Map the whole world;
jack in only where it's consensual; keep it all contained in the loop. "Raft" = the global registry + the loop.
