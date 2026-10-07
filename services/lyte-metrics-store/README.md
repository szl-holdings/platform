# Lyte Metrics Store

**Package:** `services/lyte-metrics-store`
**Runtime:** Python 3.11+, FastAPI

The development/test retrieval backend that the Substrate engine's Opportunity
Audit and Operational Drift workflows hit when configured with
`retrieverAdapterId = "lyte-metrics-store"` (or the alias `"lyte-retriever"`).

The bundled records are explicitly labelled deterministic synthetic fixtures.
They are not observations from a live Lyte system and are never served as
successful production retrieval evidence.

## Wire contract

The Substrate Python worker fleet's retrieval stage POSTs to this service —
see `services/substrate-py-workers/src/worker/adapters/retriever.py` for the
client side.

```http
POST /v1/retrieve
Authorization: Bearer ${LYTE_METRICS_STORE_API_KEY}
X-Tenant-ID: ${LYTE_METRICS_STORE_TENANT_ID}
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
      "metadata": {
        "service": "lyte-api-gateway",
        "kind": "latency-anomaly",
        "fixture": true,
        "fixtureKind": "deterministic-synthetic",
        "fixtureCorpusId": "lyte-deterministic-fixture-v1",
        "evidenceState": "SYNTHETIC_FIXTURE"
      }
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
| Matching bearer outside production | accepted; returns labelled deterministic fixtures |
| `LYTE_METRICS_STORE_API_KEY` set + missing / wrong / `local-dev` token | `401` |
| Key unset + explicit development/test bypass | accepted for local development/tests |
| Key unset + bypass unset | `503`; readiness is false and lifespan startup fails |
| Bypass enabled with any production environment marker | startup/configuration failure |
| Valid tenant-bound production credential | authenticated, then `503` production HOLD before scoring |

In production, bearer acceptance also requires an exact `X-Tenant-ID` match
against `LYTE_METRICS_STORE_TENANT_ID`.

Client source addresses are never an authentication decision. For local loops,
set `LYTE_METRICS_STORE_ENV=development` and
`LYTE_METRICS_STORE_AUTH_BYPASS=1` explicitly. Once
`LYTE_METRICS_STORE_API_KEY` is set and the bypass is disabled, only the
configured bearer is accepted; the adapter's literal `local-dev` fallback is
not a credential.
Production deploys must set both `LYTE_METRICS_STORE_API_KEY` (here) and the
matching value in the substrate worker's environment. They must also bind that
credential to one `LYTE_METRICS_STORE_TENANT_ID`; cross-tenant or missing
`X-Tenant-ID` headers fail before the capability HOLD is evaluated.

Authentication is necessary but not sufficient for production execution. This
release has no real tenant-scoped metrics backend, backend qualification, or
verified source receipt. Consequently `GET /ready` and an authenticated,
tenant-matched `POST /v1/retrieve` return HTTP 503 with
`PRODUCTION_RETRIEVAL_UNAVAILABLE`, `evidenceState: UNAVAILABLE`, and no result
fields. There is intentionally no environment flag that promotes the fixture.

`GET /health` is a minimal public liveness response and exposes no corpus or
query state. `GET /ready` requires both usable fail-closed security
configuration and an execution-capable backend; it remains 503 in production
for this release. Retrieval data and corpus size remain behind the
authenticated `/v1/retrieve` boundary in development/test.

## Running locally

```bash
cd services/lyte-metrics-store
pip install -e ".[dev]"

LYTE_METRICS_STORE_ENV=development \
LYTE_METRICS_STORE_AUTH_BYPASS=1 \
PORT=8081 python -m lyte_metrics_store.main
# → http://localhost:8081/health
# → POST http://localhost:8081/v1/retrieve
```

Then point the substrate engine at it:

```bash
export LYTE_METRICS_STORE_URL=http://localhost:8081
# Use the explicit service-side bypass above or inject the same real key into
# both processes. Loopback alone never bypasses authentication.
```

## Tests

```bash
cd services/lyte-metrics-store
pytest -v tests/
```

## Corpus

Documents are loaded from `src/lyte_metrics_store/corpus.py`. The default
corpus is a deterministic synthetic fixture covering:

- per-service SLO snapshots (target vs. observed, error-budget burn)
- latency anomalies (P99 vs. baseline)
- throughput degradations (RPS vs. baseline)
- capacity trends (CPU / memory headroom)
- alert digests (firing / resolved counts)
- configuration divergence (declared vs. observed)

Every record carries `fixture: true`, `fixtureKind:
"deterministic-synthetic"`, `fixtureCorpusId`, and `evidenceState:
"SYNTHETIC_FIXTURE"`. Phase 2 will swap this loader for a tenant-scoped query
against real Lyte metrics tables (pgvector + Elasticsearch), backed by a
qualified backend and verified source receipt; the document shape returned to
the substrate adapter does not change.

## Release packaging hold

This service currently uses range-based Python dependency declarations without
a committed, hashed lock or a reproducible tracked image build. Do not promote
it as a reproducible production artifact until CI installs an exact dependency
graph and proves a clean image rebuild digest/SBOM.
