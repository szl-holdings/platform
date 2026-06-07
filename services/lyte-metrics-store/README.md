# Lyte Metrics Store

**Package:** `services/lyte-metrics-store`
**Runtime:** Python 3.11+, FastAPI

The retrieval backend that the Substrate engine's Opportunity Audit and
Operational Drift workflows hit when configured with
`retrieverAdapterId = "lyte-metrics-store"` (or the alias `"lyte-retriever"`).

## Wire contract

The Substrate Python worker fleet's retrieval stage POSTs to this service —
see `services/substrate-py-workers/src/worker/adapters/retriever.py` for the
client side.

```http
POST /v1/retrieve
Authorization: Bearer ${LYTE_METRICS_STORE_API_KEY}
Content-Type: application/json

{
  "query": "latency spike on lyte-api-gateway",
  "topK": 25,
  "minRelevanceScore": 0.4,
  "filters": { "service": "lyte-api-gateway" }   // optional
}
```

```json
200 OK
{
  "documents": [
    {
      "id": "anom-latency-lyte-api-gateway",
      "content": "Latency anomaly on lyte-api-gateway: ...",
      "relevanceScore": 0.91,
      "source": "lyte-anomaly-detector",
      "metadata": { "service": "lyte-api-gateway", "kind": "latency-anomaly" }
    },
    ...
  ],
  "corpusSize": 28,
  "matched": 7
}
```

## Auth

| Caller | Behaviour |
|---|---|
| `LYTE_METRICS_STORE_API_KEY` set + matching `Authorization: Bearer …` | accepted |
| `LYTE_METRICS_STORE_API_KEY` set + missing / wrong / `local-dev` token | `401` |
| `LYTE_METRICS_STORE_API_KEY` unset + caller from `127.0.0.1` / `::1` | accepted (dev convenience) |
| `LYTE_METRICS_STORE_API_KEY` unset + remote caller | `503` (refuses to serve unauthenticated) |

The substrate retriever adapter sends the literal `Bearer local-dev` header
when no key is configured on its side; this service accepts that token only
when it *also* has no key configured (dev/test loops). Once
`LYTE_METRICS_STORE_API_KEY` is set, only the configured token is accepted —
no localhost or `local-dev` fallback — so a misconfigured proxy that
surfaces remote callers as `127.0.0.1` cannot silently bypass auth.
Production deploys must set both `LYTE_METRICS_STORE_API_KEY` (here) and the
matching value in the substrate worker's environment.

## Running locally

```bash
cd services/lyte-metrics-store
pip install -e ".[dev]"

PORT=8081 python -m lyte_metrics_store.main
# → http://localhost:8081/health
# → POST http://localhost:8081/v1/retrieve
```

Then point the substrate engine at it:

```bash
export LYTE_METRICS_STORE_URL=http://localhost:8081
# optional in dev — local callers are allowed without a key
export LYTE_METRICS_STORE_API_KEY=sk-dev-local
```

## Tests

```bash
cd services/lyte-metrics-store
pytest -v tests/
```

## Corpus

Documents are loaded from `src/lyte_metrics_store/corpus.py`. The default
corpus is a self-contained snapshot covering:

- per-service SLO snapshots (target vs. observed, error-budget burn)
- latency anomalies (P99 vs. baseline)
- throughput degradations (RPS vs. baseline)
- capacity trends (CPU / memory headroom)
- alert digests (firing / resolved counts)
- configuration divergence (declared vs. observed)

Phase 2 will swap this loader for a query against the real Lyte metrics
tables (pgvector + Elasticsearch); the document shape returned to the
substrate adapter does not change.
