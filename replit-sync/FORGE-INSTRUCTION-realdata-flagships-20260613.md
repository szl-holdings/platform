# FORGE-INSTRUCTION — flagships real-data wiring + deploy — 2026-06-13 (late)

**To:** Forge + Replit. **Authority:** Founder, full green light. Addendum to the SDA + wire-up orders.

## WHAT MERGED TO MAIN (deploy these)
Every flagship tab now populates with REAL data (server-proxied) or an honest labeled fallback — NO perpetual spinners. Merged:
- **a11oy #358** — all 124 tabs: abortable fetch (6.5s cap) + no-spinner watchdog; tabs wire real public sources via existing serve.py proxies; 0 stuck spinners.
- **killinchu #119** — 57 /elite tabs: fetch hardening + 429-aware + loading watchdog (27 stuck → 0); ADS-B live; effectors honestly SIMULATED.
- **yarqa #6** — fetch watchdog; backend already live (Open-Meteo Marine + NOAA CO-OPS).
- **hatun-mcp #34** — console 9s no-spinner watchdog; content-negotiation intact (browser=HTML, MCP=JSON); 48/48 pytest.

## FORGE — DEPLOY (when dispatched)
1. Rebuild **a11oy**, **killinchu**, **yarqa**, **hatun-mcp** images FROM MAIN; readiness-gate; redeploy each HF Space. Confirm /healthz=200 and spot-check tabs populate (no perpetual spinner).
2. **KEEP THE SERVER-SIDE PROXIES HEALTHY** — this is the real-data backbone. The tabs fetch live public sources through serve.py same-origin proxies because the browser can't reach them cross-origin (CORS). Verified real sources (Dev C, with live curl proofs, in replit-sync/realdata_sources.md):
   - **Client-fetchable (already work):** Coinbase, CoinGecko, Manifold, NVD CVE 2.0, NYC Socrata (HPD wvxf-dwi5 + DOB), SEC EDGAR, USGS, Crossref, Zenodo, GitHub (≤60/hr), Statuspage JSON, blockchain.info, Google CT log list.
   - **Need the server proxy (Forge keeps these alive on the deployment egress IP):** Yahoo v8 (finq), Kraken, Polymarket gamma (finp), Digitraffic AIS (u_maritime — needs `Digitraffic-User` header + gzip; sandbox got 406, deployment IP works), adsb.lol/OpenSky (tracks/swarm — OpenSky now OAuth2 client-credentials), CelesTrak/Space-Track TLEs (SDA orbital), OFAC/OpenSanctions bulk (dark-vessel), CISA KEV, FRED/Census (real estate rates), arXiv, Rekor/OpenTimestamps (provenance anchor).
   - Cache last-good + periodic refresh; respect rate limits (NVD 5/30s anon, GitHub 60/hr anon, ADS-B/AIS per-IP). On upstream fail, serve last-good SNAPSHOT honestly — never fabricate.
3. **REJECTED sources (do NOT wire):** MarineTraffic (ToS forbids), aisstream browser (no CORS, key exposure), OpenSanctions hosted API (now paid), Alpha Vantage (25/day) — use the free alternatives Dev C listed (Digitraffic, Yahoo-proxied, free CC-BY bulk).
4. Static surfaces already promoted to REAL by the agent + redeployed previews: **mechanics** (genuine FE-NO solve L2=7.24e-3) + **sda** (real sgp4 conjunction 2.368 km + 3-of-4 witness quorum). Push their sources (replit-sync/hf_spaces/) to the HF static spaces.

## DOCTRINE v11 (never violate)
A tab shows LIVE only when it truly fetched live; else SNAPSHOT/SAMPLE/SIMULATED honestly. Λ=Conjecture 1 advisory · locked=8 · Khipu BFT=Conjecture 2 · killinchu effectors SIMULATED · orbital=screening-grade ROADMAP · SLSA L1 honest · sovereign own-metal · NO free-energy · NEVER fabricate numbers · attribution for each data source in the UI footer · no banned codenames user-visible · szl-router PRIVATE.

## REPORT into AUTO_STATE.json
images rebuilt + redeployed? · proxies healthy (which live, which last-good)? · tabs populate (no spinner)? · mechanics+sda pushed? · any source that needs a founder API key (OpenSky OAuth, FRED, Census) flagged as `needs:`.
