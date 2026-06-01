# Observability — Structured Logging

> Doctrine v11 LOCKED · 749/14/163 · locked_at `c7c0ba17`

All SZL flagships emit **one JSON object per line** (JSONL) using
`platform/packages/szl-logging`. Every record MUST contain these keys:

| Key | Type | Meaning |
|---|---|---|
| `ts` | string (RFC3339 UTC) | event timestamp |
| `level` | string | INFO / WARN / ERROR / DEBUG |
| `organ` | string | flagship name (a11oy, amaru, sentra, rosie, killinchu, hatun-mcp) |
| `endpoint` | string | request path, e.g. `/khipu/sign` |
| `trace_id` | string | OTel trace id (links to OTel collector) |
| `span_id` | string | OTel span id |
| `caller_id` | string | authenticated caller / org id |
| `khipu_seq` | int \| null | Khipu chain sequence number if a receipt was signed |

## Usage

```python
from szl_logging import get_logger
log = get_logger("a11oy")
log.info("/khipu/sign", trace_id=ctx.trace_id, span_id=ctx.span_id,
         caller_id=req.org_id, khipu_seq=receipt.seq, latency_ms=12.4)
```

Extra kwargs (e.g. `latency_ms`) are merged into the record but can never override
a required key. Output goes to stdout by default (captured by the HF Space log
pipeline and forwarded to the OTel collector at
`https://szlholdings-otel-collector.hf.space`).

## Why JSONL

- Greppable in HF Space logs.
- Directly ingestable by the OTel collector and Grafana Loki.
- `trace_id`/`span_id` correlate logs with traces; `khipu_seq` correlates logs with the
  signed-receipt chain.
