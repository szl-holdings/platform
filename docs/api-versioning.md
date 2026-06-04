<!-- SPDX-License-Identifier: Apache-2.0 -->
# API Versioning Policy

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17** · Maintained by Yachay
**Effective:** 2026-06-01

---

## Policy

- **`v1` is deprecated as of 2026-06-01** and reaches **end-of-life (EOL) on
  2026-12-01**. After EOL, v1 routes may return `410 Gone`.
- **All new endpoints ship under `/v2` or `/v3`** with explicit semantic versioning
  (`MAJOR.MINOR.PATCH`). Breaking changes require a new MAJOR (`/v3`); additive
  changes are MINOR; fixes are PATCH.
- **Deprecation requires a 90-day notice** before sunset, communicated via:
  - a public CHANGELOG entry + release note, and
  - response headers on every call to the deprecated endpoint:
    - `Deprecation: <RFC-1123 date>` — when the endpoint became deprecated.
    - `Sunset: <RFC-1123 date>` — when it will be removed (≥ 90 days later).
    - optional `Link: <…>; rel="successor-version"` pointing at the replacement.

### Example deprecation headers

```
Deprecation: Sun, 01 Jun 2026 00:00:00 GMT
Sunset: Mon, 30 Nov 2026 00:00:00 GMT
Link: </api/a11oy/v2/verify>; rel="successor-version"
```

FastAPI helper (drop into any flagship `serve.py`):

```python
from datetime import datetime, timezone
def deprecate(resp, sunset: str, successor: str | None = None):
    resp.headers["Deprecation"] = "Sun, 01 Jun 2026 00:00:00 GMT"
    resp.headers["Sunset"] = sunset
    if successor:
        resp.headers["Link"] = f'<{successor}>; rel="successor-version"'
    return resp
```

---

## Public endpoint version + status matrix

Status legend: **active** · **deprecated** (sunset announced) · **sunset** (removed/410).

### a11oy — governance substrate

| Endpoint | Version | Status |
|----------|---------|--------|
| `/khipu/sign`, `/khipu/verify`, `/khipu/ledger` | v-unversioned (stable) | active |
| `/api/a11oy/healthz`, `/api/a11oy/readyz` | n/a | active |
| `/api/a11oy/v1/ledger`, `/v1/verify`, `/v1/policy/evaluate` | v1 | **deprecated** (EOL 2026-12-01) |
| `/api/a11oy/v1/puriq/formulas` | v1 | **deprecated** (EOL 2026-12-01) |
| `/api/a11oy/v1/khipu-os/{archive,checkpoint,stats,verify}` | v1 | **deprecated** |
| `/api/a11oy/v2/unay/{remember,recall,stats,verify,healthz}` | v2 | active |
| `/api/a11oy/v2/khipu/lmdb/{append,tail,stats,verify}` | v2 | active |
| `/api/a11oy/v2/khipu/replicate` | v2 | active |
| `/api/a11oy/v3/doctrine` | v3 | active |

### killinchu — drone intelligence

| Endpoint | Version | Status |
|----------|---------|--------|
| `/api/killinchu/v1/*` (protocol decoders, drone DB) | v1 | **deprecated** (EOL 2026-12-01) |
| `/api/killinchu/v2/geofence/check`, `/v2/mission/plan` | v2 | active |
| `/api/killinchu/v2/unay/*`, `/v2/khipu/lmdb/*` | v2 | active |

### rosie — companion / command

| Endpoint | Version | Status |
|----------|---------|--------|
| `/v1/unay/{query,write}` | v1 | **deprecated** (EOL 2026-12-01) |
| `/api/rosie/v2/command` (auth-gated) | v2 | active |
| `/api/rosie/v2/unay/*`, `/v2/khipu/{lmdb,dag,replicate}/*` | v2 | active |

### sentra — dual-use / filter

| Endpoint | Version | Status |
|----------|---------|--------|
| `/dual-use/check`, `/sentra/rosie/filter` | unversioned | active (⚠ route contract under review — see load-test follow-up) |

### amaru — receipts / tick

| Endpoint | Version | Status |
|----------|---------|--------|
| `/api/amaru/v1/*` | v1 | **deprecated** (EOL 2026-12-01) |
| `/api/amaru/v2/*` | v2 | active |

> **Source of truth:** this matrix is mirrored into the SDK reference
> (`sdk-js` / `sdk-py` docs). When an endpoint's version or status changes, update
> both this file and the SDK reference in the same PR.

---
*Doctrine v11 — 749/14/163 — c7c0ba17 — signed Yachay · Co-Authored-By: Perplexity Computer Agent*
