<!-- SPDX-License-Identifier: Apache-2.0 -->
# szl-throttle

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17** · Maintained by Yachay

FastAPI **rate limiting + CORS + Khipu-audited rejections** for SZL flagships.

## Install

```bash
pip install ./packages/szl-throttle          # from the monorepo
# or, editable for local dev:
pip install -e ./packages/szl-throttle
```

## For flagship operators — one line in `serve.py`

Add to the app startup hook in `serve.py`:

```python
from szl_throttle import setup
setup(app)
```

That's it. This installs:

1. **Token-bucket rate limiter** — 100 req/min per client IP by default
   (configurable). `/healthz`, `/readyz`, `/metrics` are exempt. Over-budget
   requests get `429` + `Retry-After`.
2. **CORS** — allow-list of `szlholdings.com`, `*.hf.space`, `*.github.io`, and
   `localhost` (any port). Allowed origins get proper `Access-Control-Allow-*`
   headers; disallowed origins are **not** granted ACAO and are audited.
3. **Khipu audit** — every `429` and every CORS rejection emits a hash-chained
   Khipu receipt to an in-process ledger, surfaced at
   `GET /api/throttle/khipu/ledger` (with `verified` chain-integrity flag).

## Configuration

| Knob | Default | Env override |
|------|---------|--------------|
| rate (req/min/IP) | `100` | `SZL_RATE_PER_MIN` |
| CORS allow-list | szlholdings.com, *.hf.space, *.github.io, localhost | `SZL_CORS_ALLOW` (comma-separated) |
| burst | = rate | `setup(app, burst=...)` |

```python
# Custom rate + extra origins + real DSSE signing of receipts:
from szl_throttle import setup

def cosign_signer(receipt: dict) -> str | None:
    # return a real ECDSA-P256 cosign signature when SZL_COSIGN_PRIVATE_PEM is set,
    # else None (receipts are then honestly UNSIGNED — same policy as the flagships).
    ...

ledger = setup(
    app,
    rate_per_min=200,
    cors_allow=["https://szlholdings.com", "https://*.hf.space"],
    signer=cosign_signer,
)
assert ledger.verify()   # replay the receipt chain
```

## Khipu receipt shape

```json
{
  "kind": "rate_limit_429",
  "ts": 1780000000.0,
  "detail": {"ip": "1.2.3.4", "path": "/api/a11oy/v1/verify", "method": "POST"},
  "prev_hash": "….",
  "hash": "sha256(prev_hash + canonical(payload))",
  "signature": null
}
```

`signature: null` means **honestly UNSIGNED** (no cosign secret present) — matching
the flagship provenance policy (SLSA L2 when signed, never falsely L3).

## Tests

```bash
pip install -e '.[test]'
pytest tests/ -q          # 4 passed
```

> **Note:** This package is shipped to the monorepo **only** — it is intentionally
> NOT pushed into the flagship Spaces here, to avoid colliding with the 14-agent
> concurrency window on those repos. Operators wire it in during the next flagship
> deploy cycle.

---
*Doctrine v11 — 749/14/163 — c7c0ba17 — signed Yachay · Co-Authored-By: Perplexity Computer Agent*
