<!-- SPDX-License-Identifier: Apache-2.0 -->
# Structured Logging — `szl-logging`

The canonical logging schema and package for the SZL flagship mesh. Part of the
**SZL O11Y** stack (see [`szl-o11y-stack.md`](./szl-o11y-stack.md)). Logs are the
Loki tier of the stack — structured JSON, correlated to traces, searchable by
the high-cardinality dimensions Honeycomb popularised, audited by the Khipu chain.

Package: [`packages/szl-logging`](../../packages/szl-logging).

---

## 1. Schema spec

Every log line is a single JSON object validated against `LogRecordModel`
(Pydantic v2). Records that fail validation are rejected at emit time.

| Key | Required | Type | Constraint |
|---|---|---|---|
| `ts` | ✅ | string | ISO 8601 UTC, millisecond precision, `Z` suffix |
| `level` | ✅ | enum | `DEBUG` \| `INFO` \| `WARN` \| `ERROR` \| `CRITICAL` |
| `organ` | ✅ | enum | `a11oy` \| `amaru` \| `sentra` \| `rosie` \| `killinchu` \| `otel-collector` \| `mesh-cathedral` |
| `endpoint` | ✅ | string | route template or operation name |
| `trace_id` | ✅ | string | 32 lowercase hex (OTel trace id) |
| `span_id` | ✅ | string | 16 lowercase hex (OTel span id) |
| `msg` | ✅ | string | human-readable message |
| `caller_id` | optional | string | authenticated caller / actor id |
| `khipu_seq` | optional | int | Khipu chain sequence for the signed action |
| `attrs` | optional | object | high-cardinality structured fields |

`trace_id` and `span_id` are auto-injected from the active OpenTelemetry span
context. The stdlib `WARNING` level is normalised to the schema's `WARN`.

### Example line

```json
{"ts":"2026-06-01T13:22:41.501Z","level":"INFO","organ":"rosie","endpoint":"/recall","trace_id":"7c99bf223dc49f6b932d4203ab47ddf1","span_id":"7477a74d794115d7","msg":"recall complete","khipu_seq":4218,"attrs":{"score":0.92,"vss_active":true}}
```

---

## 2. Migration guide (existing flagships)

Migration is **1 import + 1 init call**. No call-site rewrites required.

**Before:**

```python
import logging
logger = logging.getLogger(__name__)
```

**After:**

```python
import szl_logging
logger = szl_logging.get_logger(__name__, organ="rosie")   # pick your organ
```

All existing `logger.info(...)`, `logger.warning(...)`, `logger.error(...)`
calls keep working unchanged. Enrich incrementally:

```python
logger.info("recall complete", endpoint="/recall", attrs={"score": 0.92})
```

Install the OTel extra so trace/span ids auto-populate from your existing tracer:

```bash
pip install "szl-logging[otel]"
```

Per-flagship organ mapping:

| Flagship | `organ=` |
|---|---|
| a11oy | `a11oy` |
| amaru | `amaru` |
| sentra | `sentra` |
| rosie | `rosie` |
| killinchu | `killinchu` |
| OTel collector | `otel-collector` |
| mesh cathedral | `mesh-cathedral` |

---

## 3. Search patterns (log analysis)

With JSON logs shipped to Loki (or any JSON-aware store), these queries cover the
common investigations. LogQL examples:

```logql
# All ERROR/CRITICAL across the mesh, last 1h
{job="szl-flagship"} | json | level=~"ERROR|CRITICAL"

# One trace end-to-end (correlate with Tempo)
{job="szl-flagship"} | json | trace_id="7c99bf223dc49f6b932d4203ab47ddf1"

# Signing failures on amaru
{organ="amaru"} | json | endpoint="/sign" | level="ERROR"

# High-cardinality slice: slow recalls (Honeycomb-style)
{organ="rosie"} | json | endpoint="/recall" | attrs_score < 0.5

# Actor audit trail: everything caller user-7 did
{job="szl-flagship"} | json | caller_id="user-7"

# Tie a log line to its Khipu receipt
{job="szl-flagship"} | json | khipu_seq="4218"
```

Because `trace_id`, `span_id`, and `khipu_seq` are first-class keys, any log line
joins cleanly to (a) its distributed trace in Tempo and (b) its signed receipt in
the Khipu audit chain. That three-way correlation — log ↔ trace ↔ signed receipt
— is the SZL differentiator.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
