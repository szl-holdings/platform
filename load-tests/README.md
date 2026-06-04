<!-- SPDX-License-Identifier: Apache-2.0 -->
# SZL Load Tests (k6)

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17** · Maintained by Yachay

k6 scripts that exercise each flagship's hot endpoints and assert latency + error
budgets. Baseline results land in `results/<date>/<flagship>.json`.

## Install k6

```bash
# Linux (standalone binary, no root):
curl -sL https://github.com/grafana/k6/releases/download/v0.49.0/k6-v0.49.0-linux-amd64.tar.gz | tar xz
sudo mv k6-v0.49.0-linux-amd64/k6 /usr/local/bin/   # or keep local
# macOS:  brew install k6
# Debian/Ubuntu apt:  https://grafana.com/docs/k6/latest/set-up/install-k6/
```

## Run

```bash
# Full profile (50 VUs ramp 30s / sustain 60s / ramp down 15s):
k6 run a11oy.js     -e BASE_URL=https://szlholdings-a11oy.hf.space
k6 run killinchu.js -e BASE_URL=https://szlholdings-killinchu.hf.space
k6 run rosie.js     -e BASE_URL=https://szlholdings-rosie.hf.space
k6 run sentra.js    -e BASE_URL=https://szlholdings-sentra.hf.space

# Calibrated baseline (stay under the HF free-tier edge throttle):
k6 run a11oy.js --stage 10s:5 --stage 30s:5 --stage 5s:0 -e BASE_URL=https://szlholdings-a11oy.hf.space
```

Point `BASE_URL` at the **staging** Space to gate a promotion (see
`../docs/runbooks/deployment.md`).

## Pass criteria

- `http_req_duration` **p99 < 1.5s**
- endpoint error rate **< 1%**

## Baseline results — 2026-06-01

| Flagship  | App latency p95 | Verdict | Note |
|-----------|----------------|---------|------|
| a11oy     | 278 ms | **PASS** (calibrated) | All 3 hot endpoints 2xx; 0% app errors at 5 VUs. |
| killinchu | 73 ms  | **PASS** app / edge-throttled at load | All 3 endpoints 200 individually; HF edge 429 under combined load. |
| rosie     | 92 ms  | **PASS** with note | `/api/rosie/v2/command` is **403 by design** (auth-gated) — not a defect. |
| sentra    | 71 ms  | **FAIL — follow-up** | `/dual-use/check` + `/sentra/rosie/filter` return **405** for POST; live route contract differs from spec. |

### Key finding — HuggingFace free-tier EDGE throttle

App latency is excellent everywhere (p95 < 100 ms except a11oy at 278 ms). The
dominant failure mode at the full 50-VU profile (~400 req/s) is **HTTP 429 from
HuggingFace's edge rate limiter** (returns an HF HTML page, not an app response) —
the per-Space free-tier throughput ceiling sits around **30–40 req/s**. This is HF
infrastructure, not application code.

### Follow-ups (tracked)

1. **HF edge ceiling** — to make any sustained 50-VU SLA claim, upgrade Space
   hardware (paid tier) and/or front the flagships with a CDN. Until then, latency
   SLOs hold but throughput SLOs are HF-capped.
2. **rosie** — load script should send the rosie command auth header, or exclude the
   auth-gated `/api/rosie/v2/command` from the anonymous baseline.
3. **sentra** — reconcile the live route contract: `/dual-use/check` and
   `/sentra/rosie/filter` return 405 for POST. Confirm the correct method/path, fix
   the script (or the route), then re-baseline.

---
*Doctrine v11 — 749/14/163 — c7c0ba17 — signed Yachay · Co-Authored-By: Perplexity Computer Agent*
