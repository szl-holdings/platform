# szl-khipu-lmdb

Durable **LMDB** persistence backend for the Khipu hash-chained receipt log.

The in-memory Khipu DAG keeps correct append-only / hash-chain discipline but loses
the chain on Space restart. `khipu-lmdb` gives Khipu a durable, on-disk backend using
the real `lmdb` library (Lightning Memory-Mapped Database — an embedded B+tree KV store).

## What it does
- Append-only, hash-chained receipts: `receipt[n].prev == digest(receipt[n-1])` (SHA3-256 over the canonical body) — tamper-evident by re-walk alone.
- Real on-disk durability: a committed LMDB transaction survives process kill + restart.
- `verify()` re-walks the entire on-disk chain, recomputes every digest + prev-link, and reports real depth and the seq of the first break (if any).
- Signatures are honestly labelled `DSSE_PLACEHOLDER` until the cosign/Sigstore CI path is wired (Zero-Bandaid Law: no path claims integrity it does not have).

## Install
```bash
pip install -e packages/khipu-lmdb
```

## Live in
HF Spaces (vendored at deploy time, source of truth = this monorepo):
`amaru`, `sentra`, `rosie` — used as the durable backend for `szl_khipu_lmdb.py`.

## Import example
```python
from khipu_lmdb import KhipuLMDB

k = KhipuLMDB("/data/khipu", organ="amaru", ns="szl")
receipt = k.append({"event": "gate_pass", "yuyay_score": 0.91})
print(receipt["digest"], receipt["prev"])
print(k.verify())   # {'ok': True, 'depth': 1, ...}
k.close()
```

## Tests
```bash
cd packages/khipu-lmdb && pytest tests/
```

---
Doctrine v11 — **749 declarations / 14 unique axioms / 163 sorries** (locked `c7c0ba17`).
Λ = Conjecture 1 (NOT a theorem). SLSA L1 (honest). Reed-Solomon ≠ holographic; event-sourcing ≠ time travel.
Apache-2.0. Signed: Yachay &lt;yachay@szlholdings.dev&gt; · Co-Authored-By: Perplexity Computer Agent.
