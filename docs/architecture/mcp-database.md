# Where is Hatun-MCP's database?

**Owner:** Yachay `<yachay@szlholdings.dev>`
**Status:** LOCKED · Doctrine v11 (749 declarations · 14 unique axioms · 163 tracked sorries)
**Question answered:** "Where is Hatun-MCP's database?"

---

## TL;DR

**Hatun-MCP has no separate database. The database *is* the Khipu DAG.**

The MCP server is stateless in the conventional sense — it holds **no side table, no ORM,
no app DB**. Every tool call it serves writes a **signed receipt** to the Khipu chain, and
**the chain is simultaneously the audit log, the memory, and the replayable state**. There
is nothing else to query: to know what an MCP tool did, you read its receipt in the chain.

---

## 1. The storage substrate (per flagship)

Each flagship ("chakra") carries its own Khipu chain with a **two-tier on-disk store**
(see `szl_khipu_os/khipu_os/store.py`, `open_store(path, prefer="auto")`):

| Tier | Backend | Package | Role |
|------|---------|---------|------|
| Primary | **SQLite** (WAL mode) | `szl_khipu_os` | append-only `receipts` table — the canonical chain |
| Mirror | **LMDB** (memory-mapped) | `szl_khipu_lmdb` | fast key→value mirror of the same signed bytes |

`open_store` prefers **LMDB** when `lmdb-python` is importable; otherwise it falls back to
**SQLite**. Both persist the *exact signed bytes* of every receipt so a restart replays the
identical chain (the AYNI REPLAY kernel depends on this).

### SQLite chain table (`SQLiteStore`)

```sql
CREATE TABLE IF NOT EXISTS receipts (
  seq  INTEGER PRIMARY KEY AUTOINCREMENT,  -- monotonic append order
  rid  TEXT    UNIQUE NOT NULL,            -- receipt id (e.g. khipu-os::a11oy-<ms>-<seq>)
  blob BLOB    NOT NULL,                   -- the receipt's signed bytes (never mutated)
  cold INTEGER NOT NULL DEFAULT 0,         -- hot/cold projection flag (pruning is a flag flip, not a delete)
  ts   REAL    NOT NULL                    -- append timestamp
);
PRAGMA journal_mode = WAL;     -- concurrent reads while appending
PRAGMA synchronous  = NORMAL;
```

- **Append-only (INV-APPEND):** an `INSERT` of an existing `rid` raises an append-only
  violation; receipts are never deleted or mutated. "Pruning" only flips `cold=1` — a
  hot/cold *projection*, recoverable bit-for-bit.
- **SQLite path:** `<store_path>.sqlite` (the store appends `.sqlite` if the path lacks `.db`).

### LMDB environment (`szl_khipu_lmdb`, `LMDBStore`)

- **Env path:** a directory (`subdir=True`) holding `data.mdb` + `lock.mdb`, opened via
  `lmdb.open(path, max_dbs=4, map_size=1<<30)`.
- **Named sub-DBs:** `hot`, `cold`, `order` (and a reserved 4th) — the hot/cold projection
  plus an append-order index, mirroring the SQLite semantics.
- **One env per absolute path:** a process-wide registry shares a single env per path (LMDB
  forbids opening the same env twice), keeping re-opens correct and idempotent.

---

## 2. The receipt — schema of a single chain entry

Each receipt (`_Receipt`, `szl_khipu_os`) carries:

| Field | Meaning |
|-------|---------|
| `rid` / `receipt_id` | unique monotonic id: `khipu-os::<space>-<epoch_ms>-<seq>` |
| `organ` | which chakra emitted it (a11oy / amaru / sentra / rosie / killinchu) |
| `action` | the action / MCP tool name |
| `payload` | the action's canonical JSON payload |
| `parents` | parent receipt ids — the DAG edges (acyclic, INV-DAG: no forward refs) |
| `ts` | timestamp (rounded, 6 dp, for deterministic signing) |
| `yuyay` | the 13-axis `yuyay_v3` policy value at signing time |
| `content_hash` | SHA3 over the canonical `signing_bytes()` — the Merkle leaf |
| `signature` | **DSSE / ECDSA signature column** (real when an EC key is present, else explicitly labelled PLACEHOLDER — no fake signature ever claims to be real) |

**`prev_hash` / chain linkage.** The "previous-hash" linkage is expressed through the
`parents` edges plus the **Merkle root**: `merkle_root(leaf_hashes)` is a pure function of
the *set* of receipt content hashes (sorted), so any tamper to any receipt's `content_hash`
changes the root (INV-MERKLE, collision-resistance). The `seq` column gives the linear
append order; `parents` gives the DAG ancestry; the Merkle root binds the whole set.

**Chain depth** is exported as a live metric (e.g. `rosie_chain_depth`, the count of
receipts in the chain) alongside `*_receipts_total`.

---

## 3. Every MCP tool call = one chained receipt

The Hatun-MCP front door does not persist tool results anywhere of its own. The flow is:

```
MCP tool call
  → SIGN   (DSSE envelope over the action)
  → GATE   (Yuyay-13 axis check)
  → ACTION
  → CHAIN  (append _Receipt to SQLite `receipts` + LMDB mirror; RS(10,6) the cold set)
```

So **the chain IS the state**: audit log (what happened), memory (Unay indexes by `rid`),
and replay source (AYNI re-derives state from the blobs). "Querying Hatun-MCP's database"
means **reading the Khipu chain**.

---

## 4. The differentiator

Most MCP servers are **stateless** or use **ephemeral / unsigned storage**. SZL's Hatun-MCP
is backed by a substrate that is:

- **Lean-proven** — INV-APPEND, INV-MERKLE, INV-DAG are checked in the Lean corpus
  (`agentic_dag_soundness`), Doctrine v11 LOCKED.
- **DSSE-signed** — every receipt has a `signature` column; tamper is detectable via the
  Merkle root.
- **Reed–Solomon erasure-coded** — the cold set is RS(10,6) coded so the chain survives
  partial loss.
- **Append-only & replayable** — restart replays the exact chain; pruning is a projection,
  never a delete.

---

## 5. References

- `szl_khipu_os` — `khipu_os/store.py` (SQLite/LMDB `open_store`), `khipu_os/dag.py`
  (Merkle root, invariants), `a11oy_register/szl_khipu_os_routes.py` (`_Receipt`, routes).
- `szl_khipu_lmdb` — `szl_khipu_lmdb.py` (LMDB env, hot/cold/order sub-DBs),
  `szl_khipu_replicate.py`.

---

*Signed — Yachay `<yachay@szlholdings.dev>` · SZL Holdings · Doctrine v11 LOCKED (749 declarations · 14 unique axioms · 163 tracked sorries)*
