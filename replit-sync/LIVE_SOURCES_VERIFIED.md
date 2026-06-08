# LIVE SOURCES VERIFIED — a11oy Dev2 vertical packs (2026-06-08)

All curled from the build sandbox (same egress class as the HF Space). HTTP code + sample recorded.
All are public GET, no API key required, license-clean for display. Fetched SERVER-SIDE (0 client CDN).

| # | Vertical | Source | Endpoint | HTTP | Sample / notes |
|---|----------|--------|----------|------|----------------|
| 1 | Legal | Federal Register API | `https://www.federalregister.gov/api/v1/documents.json?per_page=N&order=newest` | 200 | `count:10000`; results[].title/type/abstract/publication_date. Public domain (US gov). |
| 2 | Legal | CourtListener API v4 | `https://www.courtlistener.com/api/rest/v4/search/?q=AI&type=o&order_by=dateFiled+desc` | 200 | `count:19835`; results[].caseName/court/dateFiled/absolute_url. Free Law Project, CC. Slower (~1.3s) — cache. |
| 2b| Legal | Midpage connector (case law) | external connector `midpage.search` | CONNECTED | Used agent-side for verification only; server polls CourtListener. |
| 3 | Enterprise/Cyber + Defense | CISA KEV JSON | `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | 200 | `catalogVersion:2026.06.05 count:1612`; vulnerabilities[].cveID/vendorProject/product/dateAdded/requiredAction. US gov public domain. 1.5MB — cache + poll. |
| 4 | Enterprise/Cyber + Defense + Finance | NVD CVE API 2.0 | `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=N` | 200 | `totalResults:356158`; vulnerabilities[].cve.id/descriptions/metrics(CVSS). NIST public. Rate-limited (5 req/30s no key) — poll slow + cache. |
| 5 | Enterprise/Cyber | GitHub REST | `https://api.github.com/repos/{owner}/{repo}` | 200 | stargazers_count/forks_count/open_issues. 60/hr unauth — jittered poll. |
| 6 | Enterprise/Cyber | HuggingFace API | `https://huggingface.co/api/models?limit=N&sort=trendingScore` | 200 | id/likes/trendingScore/downloads. Public. |
| 7 | Finance | Yahoo Finance chart v8 | `https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?interval=1d&range=1d` | 200 | meta.regularMarketPrice/currency/previousClose. Works server-side for equities+indices+crypto (AAPL 314.40, SPY 742.87, MSFT 410.87, BTC-USD 63879). Needs `User-Agent` header. v7 multi-quote returns 401 — use per-symbol v8. |
| 8 | Finance | Coinbase spot | `https://api.coinbase.com/v2/prices/{PAIR}/spot` | 200 | data.amount/base/currency (BTC 63987, ETH 1702, SOL 67.7). Public, no key. Reliable crypto fallback. |
| 9 | Finance | Realtime Finance connector | external `finance.finance_quotes` | CONNECTED | Agent-side only (needs per-call auth); NOT reachable from deployed server → server uses Yahoo v8 + Coinbase. |
| 10| Real Estate | US Treasury fiscaldata avg interest rates | `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page%5Bsize%5D=N` | 200 | data[].security_desc/avg_interest_rate_amt/record_date (T-Bills 3.690% @2026-05-31). US gov public domain. Live rate feed. |
| 11| Real Estate | NYC Open Data — HPD Housing Litigations | `https://data.cityofnewyork.us/resource/59kj-x8nc.json?%24limit=N&%24order=caseopendate%20DESC` | 200 | litigationid/casetype/casestatus/respondent/latitude/longitude/nta/bbl. NYC distress pipeline + 3D map coords. Public (Socrata). |
| 12| Real Estate | NYC Open Data — DOB Violations | `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?%24limit=N` | 200 | violation_type/issue_date/street/boro. Building-distress signal. Public. |

## NOT REACHABLE from this host (documented honestly)
- **Stooq** quotes (`stooq.com/q/l/`) — returns 404 (host/geo block). NOT used. Yahoo v8 + Coinbase cover finance instead.
- **FRED** (`api.stlouisfed.org`) — requires `api_key`. NOT used (Treasury fiscaldata covers rates key-free).
- **Treasury daily par yield curve** (`rates_of_exchange`) wrong dataset → 404; **avg_interest_rates** is the correct working rate dataset.

## SERVER POLICY
- All polls SERVER-SIDE in the FastAPI app (httpx), cached warm with honest `cached`/`stale` degrade labels.
- Auto-poll cadence 10–15s jittered per RESTRUCTURE_SPEC HARD RULE 2 (respect rate limits: NVD slow, GitHub jittered).
- Crypto via Coinbase + Yahoo; equities/indices via Yahoo v8; rates via Treasury. No fabricated data; any synthetic enrichment is SIMULATED-labeled.

## v2 VERTICAL FEEDS (verified 2026-06-08)
- Polymarket: https://gamma-api.polymarket.com/markets?limit=N  [200]
- Coinbase: https://api.coinbase.com/v2/exchange-rates?currency=BTC  [200]
- CoinGecko: https://api.coingecko.com/api/v3/simple/price?ids=...&vs_currencies=usd  [200]
- NYC Open Data HPD violations: https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=N  [200] (DOB: 3h2n-5cm9)
- Treasury rates: https://api.fiscaldata.treasury.gov/...avg_interest_rates  [200]
- SEC EDGAR: https://data.sec.gov/submissions/CIK..........json  -> NEEDS User-Agent header (else 403). Set UA 'SZL Holdings research contact@szlholdings.com'.
- Yahoo finance v8: rate-limited (429) -> FALLBACK to stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&e=csv OR cache. Use jittered polling + cache.
