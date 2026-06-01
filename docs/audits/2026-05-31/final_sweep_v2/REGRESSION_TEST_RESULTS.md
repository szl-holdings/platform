# REGRESSION TEST RESULTS — KEEP-LIVE Spaces

**Author:** Yachay · **Date:** 2026-06-01 ~05:10 EDT
**Method:** Live `curl` against HF Spaces public URLs + HF API runtime stage. Header inspection (`curl -s -D -`) to distinguish a real endpoint from the app-shell catch-all. Each row shows the exact observed HTTP code + content-type/length.

> **Important methodology note:** For a11oy/amaru/sentra/killinchu, `/healthz`, `/v1/*`, **and nonsense paths all return `200 text/html`** (the app shell). Therefore a `200` proves the Space process is up and routing — it does **NOT** prove a working JSON health/API endpoint, and it does **NOT** let me count routes. Pass/fail below is scored on **process liveness**, with API-surface claims explicitly marked UNVERIFIED.

## Results

| Space | runtime.stage | `/healthz` | `/` | bogus path | content-type | Verdict |
|---|---|---|---|---|---|---|
| **a11oy** | RUNNING | 200 | 200 | — | text/html (shell; `/v1/health`→200 9276B) | **PASS (live)**; API count UNVERIFIED |
| **amaru** | RUNNING | 200 | — | 200 (2925B, == /healthz) | text/html | **PASS (live)**; "47/47" UNVERIFIED |
| **sentra** | RUNNING | 200 | — | 200 (4100B) | text/html | **PASS (live)**; "43/43" UNVERIFIED |
| **killinchu** | RUNNING | 200 | — | 200 (989B) | text/html | **PASS (live)**; "31+21" UNVERIFIED |
| **rosie** | **RUNTIME_ERROR** | **503** | **503** | — | — | **FAIL (down)** |
| **anatomy-3d** | RUNNING | 404 | **404** | — | `/index.html`→404 | **FAIL (not serving)** |
| **rosie-3d** | RUNNING | 404 | (not re-tested) | — | — | **PARTIAL** (static; verify viewer path) |
| **README** | RUNNING | n/a (static card) | — | — | — | **PASS** |

## Pass/fail count
- **Process-live PASS:** 5 / 8 (a11oy, amaru, sentra, killinchu, README)
- **FAIL:** 2 / 8 (rosie = down; anatomy-3d = up-but-404)
- **PARTIAL:** 1 / 8 (rosie-3d — static, healthz 404 expected, root not confirmed)

## Evidence excerpts
```
a11oy /healthz   -> 200      amaru /healthz -> 200     sentra /healthz -> 200
killinchu /healthz -> 200    rosie /healthz -> 503     rosie / -> 503
anatomy-3d /healthz -> 404   anatomy-3d / -> 404       anatomy-3d /index.html -> 404
rosie-3d /healthz -> 404

# header proof of app-shell catch-all (amaru):
HTTP/2 200 ; content-type: text/html ; content-length: 2925   (/healthz)
HTTP/2 200 ; content-type: text/html ; content-length: 2925   (/this-path-does-not-exist-xyz123)
HTTP/2 200 ; content-type: text/html ; content-length: 2925   (/v1/state)

# a11oy /openapi.json returns HTML (not JSON), so no machine-readable route manifest is exposed:
HTTP/2 200 ; content-type: text/html ; content-length: 1993 ; server: uvicorn
```

## Honest conclusions
1. **5 Spaces are process-live**, but their JSON API surfaces and exact route counts could **not** be verified from public endpoints (everything renders the HTML shell). Treat the per-Space route numbers as builder-asserted.
2. **rosie is hard-down** (RUNTIME_ERROR). Any "rosie 162/162 live" claim is currently false.
3. **anatomy-3d is up but not serving** content at `/`, `/index.html`, or `/healthz`. Entry point misconfigured.
4. **No `/v1/*` endpoint returned JSON** at any probed path — confirm internal route tables before claiming a working public API.

— Yachay
