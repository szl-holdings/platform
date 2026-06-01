# KIPU_SOURCE_INDEX.md — the receipt-cell substrate

Package root: `kipu_qillqaq/pkg/` · importable as `import kipu_qillqaq` (version 0.1.0).
All open-source; core needs only the Python standard library.

| File | Lines | Responsibility |
|---|---|---|
| `src/kipu_qillqaq/__init__.py` | 40 | Public API + honest-naming docstring; re-exports all symbols. |
| `src/kipu_qillqaq/cell.py` | 83 | `ReceiptCell` (frozen dataclass) + `content_address()` (SHA-256 of canonical JSON). `verify()` chain-checks the cid. DAG via `parents` cids. |
| `src/kipu_qillqaq/events.py` | 45 | `EventBus` — thread-safe in-process pub/sub; `subscribe(topic, cb) -> unsub`, `publish(topic, payload)`. Topics: `write`, `read`, `organ:<NAME>`. |
| `src/kipu_qillqaq/coding.py` | 185 | `ReedSolomonCoder(n,k)` + GF(2^8) arithmetic + pure-python systematic RS (`_PureRS`) with Gaussian-elimination decode; `encode_cell`/`decode_shards`. **Honest Reed-Solomon, not holographic QEC.** Uses `reedsolo` if present, else pure fallback. |
| `src/kipu_qillqaq/pool.py` | 137 | `KipuPool` — the substrate. `_Store` = LMDB or JSON-file persistence (same API). `write()` (verify → persist → RS-encode → publish), `read()` (publish + read-receipt), `recover(cid, drop=[...])` (RS reconstruction), `stats()`. |

## Module wiring

```
ReceiptCell ─(content_address)→ cid
     │
KipuPool.write(cell) ──→ _Store.put(cid, bytes)            [persistence]
     │                └→ encode_cell → _Store(shards)       [Reed-Solomon durability]
     └→ EventBus.publish("write", cell)                     [pub/sub]

KipuPool.read(cid) ──→ _Store.get → ReceiptCell
     └→ EventBus.publish("read", {...}) + emit read_receipt cell

KipuPool.recover(cid, drop) ──→ decode_shards(manifest w/ losses) → ReceiptCell
```

## Verified behaviors (see VERIFY_REPORT.md / VERIFY_OUTPUT.txt)
- Content addressing + `verify()` round-trips.
- Pub/sub delivers `write` events to subscribers.
- RS(10,6) recovers a cell after losing any 4 of 10 shards; correctly refuses ≥5 losses.
- JSON-file store works with zero non-stdlib deps; LMDB used when installed.

Author: Yachay · Perplexity Computer Agent.
