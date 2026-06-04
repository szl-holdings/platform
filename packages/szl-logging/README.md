<!-- SPDX-License-Identifier: Apache-2.0 -->
# szl-logging

Pydantic-validated structured JSON logging for the SZL flagship mesh. A drop-in
replacement for stdlib `logging` that emits one validated JSON line per record
and auto-correlates with traces via OpenTelemetry.

## Install

```bash
pip install szl-logging          # core (pydantic only)
pip install "szl-logging[otel]"  # + OpenTelemetry trace/span auto-injection
```

## Use (drop-in)

```python
import szl_logging
logger = szl_logging.get_logger(__name__, organ="rosie")

logger.info("recall complete", endpoint="/recall", attrs={"score": 0.92})
logger.warning("cache miss", endpoint="/recall")
logger.error("lmdb durable=0", endpoint="/persist", caller_id="user-7", khipu_seq=4218)
```

Output (one line per record):

```json
{"ts":"2026-06-01T13:22:41.501Z","level":"INFO","organ":"rosie","endpoint":"/recall","trace_id":"7c99bf223dc49f6b932d4203ab47ddf1","span_id":"7477a74d794115d7","msg":"recall complete","attrs":{"score":0.92}}
```

## Schema

| Key | Required | Type | Notes |
|---|---|---|---|
| `ts` | ✅ | str | ISO 8601 UTC, millisecond precision, `Z` suffix |
| `level` | ✅ | enum | `DEBUG` / `INFO` / `WARN` / `ERROR` / `CRITICAL` |
| `organ` | ✅ | enum | `a11oy` / `amaru` / `sentra` / `rosie` / `killinchu` / `otel-collector` / `mesh-cathedral` |
| `endpoint` | ✅ | str | route or operation name |
| `trace_id` | ✅ | 32-hex | auto-injected from active OTel span |
| `span_id` | ✅ | 16-hex | auto-injected from active OTel span |
| `msg` | ✅ | str | human message |
| `caller_id` | optional | str | from kwarg or `set_caller_id()` contextvar |
| `khipu_seq` | optional | int | Khipu chain sequence for the action |
| `attrs` | optional | dict | high-cardinality structured fields (Honeycomb-style) |

Records are validated by `LogRecordModel` (Pydantic v2). Unknown organs and
malformed trace/span ids raise at format time, so bad telemetry never ships.

## OpenTelemetry correlation

When an OTel span is active, `trace_id`/`span_id` are pulled from the current
span context automatically. With no active span they fall back to zero ids
(`000…`). No extra wiring is required — install the `[otel]` extra and your
existing tracer just works.

## Migration (existing flagships)

Two lines:

```python
import szl_logging
logger = szl_logging.get_logger(__name__, organ="amaru")   # replace logging.getLogger(__name__)
```

Existing `logger.info(...)`, `logger.warning(...)`, etc. keep working. Add
`endpoint=` / `attrs=` kwargs incrementally where useful.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.
Licensed under Apache-2.0.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
