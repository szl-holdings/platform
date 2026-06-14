# SZL Holdings — Real-Data Sources & APIs (Per-Vertical Wiring Guide)

**Prepared by:** Research Lead, SZL Holdings
**Date of verification:** 2026-06-14 (all sample calls executed live this date)
**Consumers:** Dev A (a11oy — server-side Forge wiring) · Dev B (killinchu — tracking/defense + cyber)
**Doctrine:** cite-never-plagiarize · every source verified with a real sample call · honest about auth/CORS/rate-limits · no over-claims · **Λ = Conjecture 1 advisory** (CORS verdicts derived from header inspection at test time; browsers may behave differently on preflight/`OPTIONS` — Dev should confirm with a real `fetch()` from the target origin before committing client-side).

---

## How to read this document

- **Browser-fetchable (wire client-side NOW)** = endpoint returned a usable response AND an `Access-Control-Allow-Origin` header (usually `*`) was observed. Safe to `fetch()` directly from the SZL tab.
- **Server-proxy (Forge wires server-side)** = endpoint works but did **not** return a CORS header, OR requires a secret key that must not be exposed in the browser, OR returns huge bulk files, OR terms forbid client-side key exposure. Route through the a11oy/killinchu server.
- **REJECTED** = paid-only for this use, or terms forbid this use. Honest alternative given.
- A "CORS header absent in HEAD" is treated conservatively as **needs proxy** (Λ advisory: some servers omit CORS on HEAD but send it on GET — verify if you want to attempt client-side).

> **Sample-call honesty note:** CORS verdicts are from `curl -I` header inspection. `curl` ignores CORS (it is a browser-only policy), so every "data shape" sample below proves the endpoint *returns real data*; the CORS column separately states whether a *browser* can read it cross-origin.

---

## 1. DEFENSE / TRACKING  → feeds **killinchu**

| Source | Endpoint (sample call) | Auth | CORS | Rate limit | Data shape | License / terms | Verdict |
|---|---|---|---|---|---|---|---|
| **adsb.lol** (live aircraft, incl. military) | `GET https://api.adsb.lol/v2/mil` · point query `https://api.adsb.lol/v2/lat/40.0/lon/-74.0/dist/25` | **None** | **No `ACAO` header observed** → needs proxy | None published; community/feeder-funded — be courteous (cache 1–5 s) | JSON `{ "ac": [ {hex, flight, t(type), lat, lon, alt_baro, gs, track, squawk, ...} ] }` | Fed data waived to **CC0** per their license page; community reports unfiltered data is effectively free incl. commercial with attribution courtesy | **SERVER-PROXY** (works, no CORS) |
| **OpenSky Network** (states) | `GET https://opensky-network.org/api/states/all?lamin=45&lomin=5&lamax=47&lomax=8` | **OAuth2 client-credentials** (anonymous still allowed but weak); Basic-auth removed | No CORS mentioned → proxy | **Anonymous = 400 credits/day bucketed by IP**; Standard user 4,000/day; Licensed 14,400/hr. `/states/all` costs 1–4 credits by bbox area. 429 + `X-Rate-Limit-Retry-After-Seconds` when exhausted | JSON `{ time, states: [ [icao24, callsign, origin_country, ..., lon, lat, baro_alt, ...] ] }` | Free; non-commercial tilt. Token expires 30 min | **SERVER-PROXY** (token must stay server-side; anon timed out at test → use OAuth2) |
| **Digitraffic (Fintraffic) AIS** (live vessels, Baltic/Finnish waters) | `GET https://meri.digitraffic.fi/api/ais/v1/locations` **(requires `Accept-Encoding: gzip`)** | **None** | **No `ACAO` header** → proxy | Generous; gzip mandatory (406 without it) | GeoJSON `FeatureCollection` → `features[].properties {mmsi, sog, cog, navStat, heading, timestamp}` | **CC BY 4.0** (Fintraffic open data) — attribution required | **SERVER-PROXY** (gzip + no CORS) |
| **CelesTrak GP/TLE** (satellite elements) | `GET https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle` | **None** | Verify (text feed; commonly proxied) | Polite-use; cache ≥2 h, do not poll faster than elements update | TLE plain-text (3-line sets) or JSON/CSV via `FORMAT=` | Free for non-commercial/research; attribution to CelesTrak/Dr. Kelso | **SERVER-PROXY** (treat as cached server fetch) |
| **Space-Track.org** (authoritative TLE/catalog) | `https://www.space-track.org` (login → query API) | **Free account login required** (session cookie) | No (cookie auth) | Throttled; ≤30 req/min, ≤300 req/hr per their rules | JSON/XML/CSV catalog & TLE | Free; **US Gov account + acceptable-use**; no redistribution of bulk | **SERVER-PROXY** (credentials server-side) |
| **OFAC SDN list** (sanctions) | `GET https://www.treasury.gov/ofac/downloads/sdn.csv` (302→`sanctionslistservice.ofac.treas.gov/...`) — returns real CSV | **None** | Verify (bulk file; fetch server-side) | None; it's a file download — fetch on a schedule, not per-request | CSV / also `SDN_ADVANCED.xml`, JSON via the new sanctionslistservice API | **US Gov public domain** — free, no restriction | **SERVER-PROXY** (bulk list, refresh daily) |
| **OpenSanctions (bulk)** | `GET https://data.opensanctions.org/datasets/latest/default/targets.simple.csv` (479 MB) · index `…/latest/index.json` | **None for bulk files**; hosted match API now **paid/metered** | **`ACAO: *` on bulk files** (but 479 MB — not a browser download) | Bulk = none; hosted API = pay-as-you-go | CSV / FtM-JSON entities (sanctions, PEPs, crime) | **CC BY 4.0** for bulk data — attribution required | **SERVER-PROXY** (download bulk server-side, index locally) |

**REJECTED in this vertical:**
- **aisstream.io** — documentation explicitly states cross-origin/browser connections are **NOT supported**, and warns API keys must not be exposed on a public site. *Usable only server-side* via WebSocket with a secret key. Honest alt: use Digitraffic for client-relevant regions, or run aisstream server-side only.
- **MarineTraffic** — Terms forbid this use. Free tier is **non-commercial/personal only**, prohibits embedding live widgets, feeding AIS into custom dashboards, or sharing tracks with clients; automated extraction prohibited without a formal agreement; violations trigger IP blocking. **Do not wire.** Honest alt: Digitraffic (CC BY) or a licensed paid AIS feed.

---

## 2. FINANCE  → feeds **a11oy finq / finc / finp / finr**

| Source | Endpoint (sample call) | Auth | CORS | Rate limit | Data shape | License / terms | Verdict |
|---|---|---|---|---|---|---|---|
| **Yahoo Finance v8 chart** (equities/ETF/index OHLC) | `GET https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=5d` (also `query2.`) | None (informal) | **No `ACAO`** → proxy | Unofficial; aggressive polling gets soft-blocked. Send a browser `User-Agent` | JSON `chart.result[0].meta {regularMarketPrice, ...}` + `timestamp[]` + `indicators.quote[0] {open,high,low,close,volume}` | **Unofficial / no public API ToS** — Λ advisory: not an officially licensed API; use modestly, cache, attribute "data via Yahoo Finance". Acceptable for display, not for redistribution-at-scale | **SERVER-PROXY** (no CORS + UA needed) |
| **Stooq** (equities/FX/index CSV) | `https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv` | None | n/a | — | CSV quote line | **Now behind a JavaScript anti-bot challenge** at test time (returned JS-required page / 404) → **not reliably developer-accessible** | **DEGRADED — avoid as primary** |
| **Coinbase** (crypto spot) | `GET https://api.coinbase.com/v2/prices/BTC-USD/spot` | None (public) | **`ACAO: *`** → client-side OK | Reasonable public limits | JSON `{ data: { amount, base, currency } }` | Free public price endpoint | **CLIENT-SIDE NOW** |
| **CoinGecko** (crypto prices/market) | `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd` | None for public/demo; Pro key for higher tiers | **`ACAO: *`** → client-side OK | Free/demo ≈ 5–30 calls/min (varies); 429 on overuse — cache aggressively | JSON `{ bitcoin: { usd } }` | Free tier for attribution + non-abusive use | **CLIENT-SIDE NOW** (cache!) |
| **Kraken** (crypto ticker/OHLC) | `GET https://api.kraken.com/0/public/Ticker?pair=XBTUSD` | None (public) | **No `ACAO: *` observed** in HEAD → Λ verify; treat as proxy | ~1 req/s public counter | JSON `{ error:[], result:{ XXBTZUSD:{ a,b,c(last),v,p,l,h,o } } }` | Free public market data | **SERVER-PROXY** (CORS unconfirmed) |
| **Polymarket Gamma** (prediction markets) | `GET https://gamma-api.polymarket.com/markets?limit=2&closed=false` | None | **No `ACAO` in HEAD** → proxy (Λ verify) | Public; be polite | JSON array `[ {id, question, slug, endDate, liquidity, outcomes, ...} ]` | Free public read API | **SERVER-PROXY** (CORS unconfirmed) |
| **Manifold** (prediction markets) | `GET https://api.manifold.markets/v0/markets?limit=2` | None for reads | **`ACAO: *`** → client-side OK | Public; documented limits modest | JSON array `[ {id, question, probability, closeTime, ...} ]` | Free read API | **CLIENT-SIDE NOW** |
| **NVD CVE 2.0** (risk/CVE) | `GET https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1` | None; **free API key recommended** | **`ACAO: *`** → client-side OK | **Without key: 5 req / 30 s. With key: 50 req / 30 s.** | JSON `{ totalResults, vulnerabilities:[ {cve:{id, descriptions, metrics, ...}} ] }` | US Gov / NIST public | **CLIENT-SIDE NOW** for light use; key (server-side) for heavy |
| **CISA KEV** (known-exploited) | `GET https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | None | **No `ACAO` header** → proxy | File feed — fetch on schedule | JSON `{ catalogVersion, count, vulnerabilities:[ {cveID, vendorProject, product, dueDate, knownRansomwareCampaignUse} ] }` | US Gov / CISA public | **SERVER-PROXY** (no CORS; cache the catalog) |

**REJECTED / notes:**
- **Alpha Vantage free tier** — works (sample `GLOBAL_QUOTE` returned real IBM data with `apikey=demo`), but **free tier = 25 requests/day** and the key would be exposed client-side; **no CORS header observed**. → **SERVER-PROXY only**, and the 25/day cap makes it unsuitable as a primary equities feed. Honest alt: Yahoo v8 (server-proxied) for breadth, Stooq is degraded.
- **Stooq** — flagged degraded above; if needed, fetch server-side with a real browser session, but do not rely on it.

---

## 3. REAL ESTATE  → feeds **a11oy red / rem / reo / redeal**

| Source | Endpoint (sample call) | Auth | CORS | Rate limit | Data shape | License / terms | Verdict |
|---|---|---|---|---|---|---|---|
| **NYC Open Data — HPD Housing Maintenance Code Violations** (`wvxf-dwi5`) | `GET https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=1` (SoQL) | None for public read; optional free **app token** lifts throttling | **Socrata supports CORS** for public datasets (auto-drops auth on CORS, read-only) → client-side OK *when up* | Without app token: shared throttle pool. With token: higher. | JSON array of violation records `{violationid, buildingid, boro, class, novdescription, currentstatus, ...}` | NYC Open Data — public, attribution courteous | **CLIENT-SIDE NOW** (Λ: platform was in maintenance/503 at test time — endpoint & dataset ID confirmed correct) |
| **NYC Open Data — DOB** (e.g. complaints/permits) | Same Socrata host, different dataset 4-4 code (e.g. `ipu4-2q9a` DOB complaints) | None / app token | Socrata CORS → client-side | As above | JSON SoQL records | NYC public | **CLIENT-SIDE NOW** (same platform) |
| **SEC EDGAR submissions/ownership** | `GET https://data.sec.gov/submissions/CIK0000320193.json` (must send descriptive `User-Agent`) | None; **declared `User-Agent` required** | **`ACAO: *`** → client-side OK (but UA header needed) | Max **10 req/s**; UA mandatory or blocked | JSON `{cik, name, tickers, filings:{recent:{form, filingDate, accessionNumber, ...}}}` | US Gov public domain | **SERVER-PROXY recommended** (UA requirement is awkward in-browser; works client-side but set UA via fetch where allowed) |
| **FRED — rates/Treasury** | `GET https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=KEY&file_type=json` | **Free key (32-char) required** | Key must stay server-side | 120 req/min documented | JSON `{ observations:[ {date, value} ] }` | Free; attribution to FRED/St. Louis Fed | **SERVER-PROXY** (key secret) |
| **US Census (ACS/PEP)** | `GET https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E&for=state:36&key=KEY` | **Key-free ≤500 req/day/IP; free key above that** (enforcement now stricter — recommend key) | Verify | 500/day without key | JSON 2-D array `[[header...],[row...]]` | US Gov public domain | **SERVER-PROXY** (key recommended; keep server-side) |

> **Λ advisory (Real Estate):** All NYC Socrata hosts (NYC *and* Chicago) returned `503 Service Temporarily Unavailable` at test time — this was a **platform-wide Tyler/Socrata outage**, not an endpoint problem. The `wvxf-dwi5` dataset ID and the `/resource/{id}.json` SoQL pattern are confirmed correct via the official dataset page. Build with retry/backoff; expect occasional platform downtime.

---

## 4. CYBER  → feeds **a11oy / killinchu cve / kev**

| Source | Endpoint (sample call) | Auth | CORS | Rate limit | Data shape | License / terms | Verdict |
|---|---|---|---|---|---|---|---|
| **NVD CVE 2.0** | `GET https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1` (357,791 total results returned live) | None; free key recommended | **`ACAO: *`** → client-side OK | No key: 5/30 s · Key: 50/30 s | JSON vulnerabilities array (CVSS metrics, refs) | US Gov public | **CLIENT-SIDE NOW** (light) / proxy w/ key (heavy) |
| **CISA KEV catalog** | `GET https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` (count 1,619 live) | None | **No CORS** → proxy | File feed | JSON catalog | US Gov public | **SERVER-PROXY** (cache catalog, diff daily) |
| **GitHub Security Advisories (GHSA)** | `GET https://api.github.com/advisories?per_page=1` | Optional token (strongly recommended) | **`ACAO: *`** → client-side capable | **Unauth 60 req/hr/IP; authed 5,000 req/hr** (hit the 60/hr cap at test from shared IP) | JSON array `[ {ghsa_id, cve_id, severity, summary, vulnerabilities:[...]} ]` | GitHub API ToS; advisory data CC-BY-style | **SERVER-PROXY** (token raises 60→5000/hr; keep token server-side) |

---

## 5. PROVENANCE / TRUST  → feeds **chain / ledger / pvaAnchor**

| Source | Endpoint (sample call) | Auth | CORS | Rate limit | Data shape | License / terms | Verdict |
|---|---|---|---|---|---|---|---|
| **Google CT log list** (authoritative CT log roster) | `GET https://www.gstatic.com/ct/log_list/v3/log_list.json` (version 85.107 live) | None | gstatic CDN — generally CORS-friendly (verify) | Static CDN file | JSON `{ version, operators:[ {name, logs:[ {url, key, ...} ]} ] }` | Public (Google CT program) | **CLIENT-SIDE NOW** (static CDN) |
| **crt.sh** (CT search by domain) | `GET https://crt.sh/?q=example.com&output=json` | None | n/a | — | JSON cert array | **Returned `502 Bad Gateway` on every attempt (3×)** — chronically overloaded; **unreliable** | **DEGRADED — do not rely on** |
| **Rekor (Sigstore transparency log)** | `GET https://rekor.sigstore.dev/api/v1/log` (returned signed tree head live) | None (public good instance) | **No `ACAO` in HEAD** → proxy (Λ verify) | Public-good fair use | JSON `{ rootHash, treeSize, signedTreeHead, ... }`; entries via `/api/v1/log/entries` | Public good; Sigstore/OpenSSF | **SERVER-PROXY** (CORS unconfirmed) |
| **OpenTimestamps calendar** | `https://alice.btc.calendar.opentimestamps.org` (HTTP 200 live) | None | Designed for OTS client, not browser fetch | Fair use | OTS binary proof (.ots); submit hash, get Bitcoin-anchored timestamp | Free public good (MIT-licensed protocol) | **SERVER-PROXY** (binary protocol; use OTS lib server-side) |
| **blockchain.info** (Bitcoin tip/anchor verify) | `GET https://blockchain.info/latestblock` (height 953,573 live) | None | **`ACAO: *`** → client-side OK | Polite-use; cache | JSON `{ hash, time, block_index, height, txIndexes }` | Free public read | **CLIENT-SIDE NOW** (for displaying current BTC tip / anchor confirmations) |

**REJECTED / notes:**
- **crt.sh** — degraded (502s). Honest alts: query CT directly via the **Google CT log list** + a server-side log reader, or use **Censys/SSLMate cert-spotter** (cert-spotter has a free tier, server-side).

---

## 6. SCIENCE / EVIDENCE  → feeds **evidence / forecast / putnam**

| Source | Endpoint (sample call) | Auth | CORS | Rate limit | Data shape | License / terms | Verdict |
|---|---|---|---|---|---|---|---|
| **arXiv API** | `GET https://export.arxiv.org/api/query?search_query=all:transformer&max_results=1` (use **https**; http 301-redirects) | None | **No `ACAO`** → proxy | Be gentle: ≤1 req / 3 s, burst-limited | Atom/XML feed `<entry>{title, summary, author, published, id(arXiv URL)}` | Free; arXiv terms — attribution, no bulk hammering | **SERVER-PROXY** (XML + no CORS) |
| **USGS Earthquake feed** | `GET https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson` (count 4 live) | None | **`ACAO: *`** → client-side OK | Static-ish feeds; generous | GeoJSON `FeatureCollection` → `features[].properties {mag, place, time, ...}` + geometry | US Gov public domain | **CLIENT-SIDE NOW** |
| **Crossref** (DOIs/metadata) | `GET https://api.crossref.org/works?rows=1` (183M results live) | None; "polite pool" via `mailto` param recommended | **`ACAO: *`** → client-side OK | Polite pool faster; no hard free limit but be reasonable | JSON `{ message:{ items:[ {DOI, title, author, published, ...} ] } }` | Open metadata (CC0 for most metadata) | **CLIENT-SIDE NOW** (add `?mailto=` for polite pool) |
| **Zenodo** (records/DOIs) | `GET https://zenodo.org/api/records?size=1` (returned live record w/ DOI) | None for public read; token for deposit | **`ACAO: *`** → client-side OK | Documented modest limits; token raises | JSON `{ hits:{ hits:[ {id, doi, metadata, files} ] } }` | Open; per-record license varies (CC-BY common) | **CLIENT-SIDE NOW** (read) |
| **GitHub API** (repos/commits as evidence) | `GET https://api.github.com/repos/sigstore/rekor` | Optional token | **`ACAO: *`** → client-side capable | **Unauth 60/hr/IP; authed 5,000/hr** | JSON repo/commit objects | GitHub API ToS | **SERVER-PROXY** if volume > 60/hr (token server-side) |

---

## 7. ENTERPRISE  → feeds **entCockpit**

| Source | Endpoint (sample call) | Auth | CORS | Rate limit | Data shape | License / terms | Verdict |
|---|---|---|---|---|---|---|---|
| **Statuspage.io JSON** (any vendor on Atlassian Statuspage) | `GET https://www.githubstatus.com/api/v2/status.json` ("All Systems Operational" live); also `/api/v2/summary.json`, `/components.json`, `/incidents.json` | None | **`ACAO: *`** → client-side OK | Generous; cache | JSON `{ page:{...}, status:{ indicator, description } }` | Public status feeds — free to read | **CLIENT-SIDE NOW** (works for any `*.statuspage.io`-style host) |
| **GitHub org/repo API** | `GET https://api.github.com/orgs/{org}` · `…/orgs/{org}/repos` | Optional token | **`ACAO: *`** | Unauth 60/hr; authed 5,000/hr | JSON org/repo objects | GitHub API ToS | **SERVER-PROXY** if polling many orgs (token server-side) |

> **entCockpit tip:** Most enterprise SaaS expose `<status-host>/api/v2/summary.json` (Atlassian Statuspage standard). These are CORS-`*` and safe to wire client-side. Maintain a small allow-list of status hosts.

---

## CLIENT-SIDE-NOW vs SERVER-PROXY — the split

### ✅ Wire CLIENT-SIDE now (CORS `*` confirmed, no secret key)
| Source | Vertical | Why client-side |
|---|---|---|
| Coinbase spot | Finance | `ACAO: *`, no key |
| CoinGecko (public) | Finance | `ACAO: *`, cache to dodge 429 |
| Manifold | Finance | `ACAO: *`, read API |
| NVD CVE 2.0 (light) | Finance / Cyber | `ACAO: *`; key only if heavy |
| NYC Open Data Socrata (`wvxf-dwi5` etc.) | Real Estate | Socrata serves CORS for public datasets (when platform up) |
| SEC EDGAR | Real Estate | `ACAO: *` (but needs custom UA — proxy is safer) |
| Google CT log list | Provenance | static gstatic CDN |
| blockchain.info `/latestblock` | Provenance | `ACAO: *` |
| USGS earthquake GeoJSON | Science | `ACAO: *` |
| Crossref | Science | `ACAO: *` (add `?mailto=`) |
| Zenodo (read) | Science | `ACAO: *` |
| GitHub API (≤60/hr) | Science / Enterprise | `ACAO: *`; proxy if > 60/hr |
| Statuspage JSON | Enterprise | `ACAO: *` |

### 🔁 Wire SERVER-SIDE via a11oy/killinchu Forge proxy
| Source | Vertical | Why proxy |
|---|---|---|
| adsb.lol | Defense | No CORS header |
| OpenSky | Defense | OAuth2 token must stay server-side; no CORS |
| Digitraffic AIS | Defense | Mandatory gzip + no CORS |
| CelesTrak TLE | Defense | Polite-use text feed; cache server-side |
| Space-Track | Defense | Login/credentials server-side |
| OFAC SDN | Defense | Bulk file, scheduled refresh |
| OpenSanctions bulk | Defense | 479 MB bulk download |
| Yahoo v8 chart | Finance | No CORS + UA needed |
| Kraken | Finance | CORS `*` unconfirmed |
| Polymarket Gamma | Finance | CORS unconfirmed |
| Alpha Vantage | Finance | Key secret + no CORS + 25/day cap |
| FRED | Real Estate | API key secret |
| Census | Real Estate | Key recommended; keep server-side |
| CISA KEV | Cyber | No CORS; cache catalog |
| GitHub Advisories / API (heavy) | Cyber / Science / Enterprise | Token → 5000/hr; keep server-side |
| Rekor | Provenance | CORS unconfirmed |
| OpenTimestamps | Provenance | Binary protocol; OTS lib server-side |
| arXiv | Science | XML + no CORS + polite-rate |

### ⛔ REJECTED (paid-only for this use, or terms forbid it)
| Source | Reason | Honest alternative |
|---|---|---|
| **MarineTraffic** | ToS: free tier non-commercial/personal only; embedding live data / custom dashboards prohibited; automated extraction forbidden without formal agreement; IP-blocks violators | **Digitraffic AIS** (CC BY 4.0) for covered regions; licensed paid AIS feed if global needed |
| **aisstream.io (browser)** | Docs explicitly: cross-origin/browser connections NOT supported; key must not be exposed client-side | Run **server-side only** (WebSocket, secret key) or use Digitraffic |
| **OpenSanctions hosted match API** | Now pay-as-you-go metered (no free commercial tier) | Use **OpenSanctions bulk CC-BY data** (free) downloaded server-side + local matching |
| **Alpha Vantage (as primary equities feed)** | Free tier 25 req/day — too small | Yahoo v8 (server-proxied) for breadth |
| **crt.sh (as primary CT source)** | Chronic 502s (3/3 failed) — unreliable | Google CT log list + server-side log reader, or cert-spotter free tier |
| **Stooq (as primary)** | Now behind JS anti-bot challenge — not reliably accessible | Yahoo v8 server-proxied |

---

## Attribution / terms cheat-sheet (put these strings in the SZL UI footers)

- **adsb.lol** — "Aircraft data via ADSB.lol (community-fed, CC0)."
- **OpenSky** — "Flight data © The OpenSky Network" (non-commercial tilt; OAuth2).
- **Digitraffic** — "AIS data: Fintraffic / Digitraffic, licensed CC BY 4.0." (attribution **required**)
- **CelesTrak** — "TLE data courtesy CelesTrak (Dr. T.S. Kelso)." (non-commercial/research)
- **OFAC SDN / CISA KEV / NVD / USGS / SEC EDGAR / Census** — US Government public domain; courtesy attribution.
- **OpenSanctions** — "Sanctions/PEP data: OpenSanctions, CC BY 4.0." (attribution **required**)
- **CoinGecko** — "Crypto data by CoinGecko." (attribution expected on free tier)
- **Coinbase / Kraken / Manifold / Polymarket** — name the source; free public read.
- **Crossref** — most metadata CC0; "polite pool" via `?mailto=you@szl`.
- **Zenodo** — per-record license varies; surface each record's license.
- **GitHub** — GitHub API ToS; attribute repo/advisory data to GitHub.
- **Statuspage** — public vendor status; attribute the vendor.
- **Yahoo Finance v8** — *unofficial*; "data via Yahoo Finance"; use modestly, do not redistribute at scale (Λ advisory — not a licensed API).

---

## Verification ledger (every source proven with a live call on 2026-06-14)

| Source | Sample call result |
|---|---|
| adsb.lol | `/v2/mil` → 200, JSON with live military aircraft (HRCLS67, RCH307 C17, P8 SCORE75) |
| OpenSky | anon `/states/all` timed out (HTTP 000) → confirms OAuth2 now required for reliable use |
| Digitraffic AIS | 406 without gzip; with `--compressed` → 200 GeoJSON vessel features (mmsi 219598000…) |
| CelesTrak | `GROUP=stations` → live ISS/CSS TLEs (epoch 26164) |
| OFAC SDN | legacy URL 302 → new sanctionslistservice; CSV body real (AEROCARIBBEAN, BANCO NACIONAL DE CUBA) |
| OpenSanctions bulk | `targets.simple.csv` HEAD 200, 479 MB, `ACAO: *`; index.json lists datasets |
| OpenSanctions API | `/search` → 401 "No API key provided" → confirms hosted API now keyed/paid |
| Yahoo v8 | `AAPL` → 200 JSON `regularMarketPrice 291.13`; no CORS header |
| Coinbase | BTC-USD spot → 200 `amount 64564.595`; `ACAO: *` |
| CoinGecko | bitcoin/usd → 200 `{bitcoin:{usd:64545}}`; `ACAO: *` |
| Kraken | XBTUSD → 200 ticker (XXBTZUSD last 64570.80); no `ACAO: *` |
| Manifold | markets → 200 JSON array; `ACAO: *` |
| Polymarket | markets → 200 JSON array (Rihanna/GTA VI market); no CORS in HEAD |
| NVD | cves/2.0 → 200, totalResults 357,791; `ACAO: *` |
| CISA KEV | → 200 JSON, catalogVersion 2026.06.12, count 1,619; no CORS |
| Alpha Vantage | GLOBAL_QUOTE IBM demo → 200 (price 272.24); no CORS; free 25/day |
| Stooq | → 404 / JS anti-bot page → degraded |
| NYC Socrata | 503 platform maintenance (NYC + Chicago both) → outage, not endpoint error |
| SEC EDGAR | submissions/CIK0000320193 → 200 (Apple Inc.); `ACAO: *` |
| FRED | demo key → 400 "must be 32-char" → confirms free key required |
| Census | no key → "Missing Key" / enforced → free key recommended |
| Google CT | log_list v3 → 200, version 85.107 |
| crt.sh | 502 Bad Gateway ×3 → degraded |
| Rekor | /api/v1/log → 200 signed tree head; no CORS in HEAD |
| OpenTimestamps | alice calendar → 200 |
| blockchain.info | /latestblock → 200 height 953,573; `ACAO: *` |
| arXiv | https query → 200 Atom XML; http 301; no CORS |
| USGS | significant_week.geojson → 200, count 4; `ACAO: *` |
| Crossref | works → 200, 183M results; `ACAO: *` |
| Zenodo | records → 200 JSON w/ DOI; `ACAO: *` |
| GitHub | repo → 200 but 60/hr cap hit on shared IP; `ACAO: *` |
| Statuspage | githubstatus status.json → 200 "All Systems Operational"; `ACAO: *` |

---

### Λ = Conjecture 1 advisory (explicit)
1. **CORS verdicts** are from HEAD-request header inspection; a browser GET may differ. Dev should confirm any "client-side now" source with a real cross-origin `fetch()` before shipping.
2. **NYC Socrata** and **crt.sh** failures at test time were availability issues, not endpoint errors — build with retry/backoff and treat crt.sh as best-effort only.
3. **Yahoo v8** is an *unofficial* endpoint with no published API ToS — treat as advisory/display-only, cache heavily, and have a licensed fallback in mind.
4. Rate-limit numbers for community feeds (adsb.lol, Polymarket, Manifold) are not formally published — assume conservative caching.
