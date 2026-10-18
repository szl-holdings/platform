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

## Replication mirror admission

`append_replicated(origin)` validates the foreign payload and envelope digests,
then returns `{"receipt": local_wrapper, "duplicate": boolean}`. The origin-index
lookup, local wrapper append, receipt counter, and migration cursor commit in one
LMDB write transaction. Replaying the same canonical foreign receipt returns its
first local wrapper. Different canonical origin bytes under the same foreign
digest raise `ValueError("REPLICATION_ORIGIN_CONFLICT")`. This conservative
comparison includes auxiliary metadata such as `ts` and `signature`, even though
the foreign digest does not authenticate those fields. Sender authentication and
authorization must be checked by the caller before this write API.

Every JSON object key in the incoming origin must already be a string, including
nested payload and metadata keys. Non-string keys fail before migration or any
write; implicit JSON key coercion is not accepted. This keeps the frozen receipt
and exact replay in the same canonical order. Legacy `append()` is unchanged.

Existing `append("replicated", {"origin": origin})` history is indexed lazily by
the next replication write. Backfill validates local wrappers and foreign
payload/envelope digests, preserves all historical wrappers, and indexes the
first exact copy. Conflicting duplicates, malformed history, invalid index
pointers, or broken local chain links abort the whole transaction. Read methods
never perform migration. The existing `append()` encoding and receipt shape are
unchanged.

A foreign receipt is limited to 1 MiB of canonical JSON. One write may backfill
at most 1,000 local records and 16 MiB of stored bytes. Exceeding a history limit
raises `REPLICATION_HISTORY_RECONCILIATION_REQUIRED` without writes; an operator
must preserve the database and reconcile it offline. Automatic large-history
migration and repair are not implemented. This is an index over a locally trusted
LMDB database, not authentication of arbitrary on-disk modifications.

The local suite covers separate-process concurrent writers, replay after reopening
in another process, and process exit after every transaction write but before
commit. These tests do not qualify a hosted filesystem, cross-host snapshot
recovery, durable sender delivery state, or end-to-end replication. Consumers
must sync the upstream source, replace the separate lookup/append sequence with
this API, and independently qualify their runtime before enabling outbound work.

---
Doctrine v11 — **749 declarations / 14 unique axioms / 163 sorries** (locked `c7c0ba17`).
Λ = Conjecture 1 (NOT a theorem). SLSA L1 (honest). Reed-Solomon ≠ holographic; event-sourcing ≠ time travel.
Apache-2.0. Signed: Yachay &lt;yachay@szlholdings.dev&gt; · Co-Authored-By: Perplexity Computer Agent.
