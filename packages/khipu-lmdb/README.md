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

## Local replication outbox

`replication_outbound_state(peer_id, binding_sha256)` reads and validates an
existing delivery record without registering a peer, advancing a cursor, or
repairing state. An unknown peer returns `None`.

`prepare_replication_batch(peer_id, binding_sha256, limit=100,
max_bytes=4194304)` binds a peer on its first explicit write and atomically
persists its next batch. It returns `batch_id` (SHA-256 of `body`), `first_seq`,
exclusive `next_seq`, and exact canonical JSON `body` bytes, or `None` when
there are no unsent receipts. A pending batch is replayed byte for byte, even
if the caller changes limits or new receipts arrive. The batch includes its
peer, binding, source identity, interval, and unchanged receipt envelopes.

`acknowledge_replication_batch(peer_id, binding_sha256, batch_id)` advances
only that peer's exact pending interval, recording its final digest and removing
the pending bytes in the same LMDB transaction. A mismatched or already consumed
ACK fails without writes. After an uncertain local ACK result, read the durable
state and prepare again; there is no caller-supplied cursor or skip operation.

The caller defines `binding_sha256` as a lowercase SHA-256 digest of its immutable
peer/source configuration. The library treats that digest as an opaque binding;
it does not authenticate configuration, transport, or peer identity. Reusing a
peer ID with a different binding, source organ, or namespace is rejected. Peer
IDs contain 1–128 ASCII letters, digits, dots, underscores, or hyphens, starting
with a letter or digit. There are at most 64 registered peers, 1,000 receipts and
4 MiB per pending batch, 1 MiB per receipt, and 4 KiB per metadata record. A first
receipt exceeding a batch limit fails instead of being silently skipped.

The APIs validate canonical finite JSON, receipt payload/envelope hashes,
contiguous pending chain links, and the acknowledged predecessor. They reject
missing, conflicting, or malformed state without automatic repair. These checks
assume a trusted local database; they do not authenticate coordinated arbitrary
edits of its contents. Existing receipts and receiver indexes are unchanged.

**MEASURED:** the package tests exercise local process crashes, reopening,
concurrent preparation, corruption rejection, and lost-ACK replay; see the
[local proof packet](../../audit/REPLICATION_DURABLE_OUTBOX_20261018.md).
That storage-only proof does not cover authenticated transport, durable pause
state, hosted snapshots, cross-host recovery or worker activation. The explicit
transport candidate and its remaining runtime limits are described below.
The installed package includes `outbox.py`; standalone vendored `core.py`
copies require a governed exporter and consumer update before using these APIs.

### Explicit HTTPS delivery

`khipu_lmdb.delivery.Peer` binds an exact HTTPS endpoint, peer ID, source organ,
source namespace and credential environment-variable name. `deliver_once(store,
peer)` reads that credential from the environment and performs one delivery
attempt. It uses normal certificate and hostname verification, never follows a
redirect or an environment proxy, and does not log credentials or remote error
bodies. `ca_file` optionally names an operator-provisioned trust bundle; TLS
verification cannot be disabled through the API. `timeout` is a per-socket
operation limit in seconds, greater than zero and at most 30.

Pending request bytes come from the durable outbox. Only a canonical JSON ACK
matching the exact batch digest, peer/source binding, interval and complete
accepted count advances its cursor. Missing credentials fail before local
registration. Refused, malformed, oversized or lost responses leave the pending
batch available for a later explicit call. There is no automatic retry worker,
environment-based enable switch or in-memory resume flag.

The receiving HTTP service calls `accept_batch(mirror, peer, body,
authorization=header)` with its locally provisioned peer, after enforcing the
exact configured route and a bounded request read. The function authenticates
the bearer credential before parsing or writing. It validates every receipt and
requires the next contiguous source interval. The receipt wrappers, deduplication
index and bound receiver cursor commit in one LMDB transaction; a source fork or
gap is refused. An exact replay of the last committed batch returns the same ACK
without adding wrappers. Credential rotation keeps the same environment-variable
name; changing any bound field requires a new peer ID and separately admitted
reconciliation, not an implicit cursor reset.

This is transport authentication using TLS and a provisioned shared credential,
not an independent signature or source authorization. Local database integrity
assumes trusted storage. The API does not qualify a filesystem, provision peers,
select production destinations, start a worker, or change A11oy/Killinchu routes.
Those existing single-file consumers do not yet export the package modules or
implement this batch ACK protocol. Hosted activation stays **BLOCKED** until the
consumer export, lifecycle fencing and snapshot/restart obligations are met.

The real HTTPS and process-restart test commands and their measured scope are
recorded in [the delivery proof packet](../../audit/REPLICATION_HTTPS_DELIVERY_20261021.md).

---
Doctrine v11 — **749 declarations / 14 unique axioms / 163 sorries** (locked `c7c0ba17`).
Λ = Conjecture 1 (NOT a theorem). SLSA L1 (honest). Reed-Solomon ≠ holographic; event-sourcing ≠ time travel.
Apache-2.0. Signed: Yachay &lt;yachay@szlholdings.dev&gt; · Co-Authored-By: Perplexity Computer Agent.
