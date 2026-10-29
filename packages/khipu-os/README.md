# szl-khipu-os

> Part of the **szl-holdings/platform** monorepo — Doctrine v11 substrate package.

Khipu-OS: Merkle DAG receipts, pruner, checkpointer, verifier, tamper prosecutor, publisher.

## Doctrine v11
- **749** declarations · **14** unique axioms · **163** sorries (51 legacy challenge-set / 112 baseline)
- `doctrine_locked_at` = `c7c0ba17`
- Λ = **Conjecture 1 (NOT a theorem)**
- SLSA **L1 (honest)** — L2 in roadmap via Wire D

## Honesty note
Tamper detection is Merkle-hash verification. Reed-Solomon is erasure coding, NOT holographic storage.

## Install (editable, from monorepo root)
```bash
pip install -e packages/khipu-os
```

## Durable restart recovery

When `KhipuDAG` is created with `persist_path=...`, each receipt is written as a
versioned `szl.khipu.receipt/v1` envelope containing its payload, parent links,
content hash, and signature. A new process reconstructs the hot/cold indexes,
rebuilds child links, verifies every signature, and rejects legacy, malformed,
missing-parent, duplicate, or cyclic records before exposing the DAG. Recovery
is fail-closed; it never invents a receipt or silently drops persisted history.

Append uses the same receipt-shape contract: nonempty string organ/action,
an object payload, and a list of unique, nonempty string parent IDs. `None`
and an empty parent list are valid roots. Malformed shapes are rejected before
allocating an ID, signing, or changing durable/in-memory state. Parent IDs must
already exist in the hot or cold graph. Numeric fields retain their exact signed
types and values. This contract does not make arbitrary payload serialization
or storage failures transactional.

The SQLite and LMDB stores preserve receipt bytes during hot-to-cold projection.
Call `dag.close()` during orderly shutdown.

## Provenance
- Author: Yachay <yachay@szlholdings.dev>
- Co-Authored-By: Perplexity Computer Agent
- License: Apache-2.0
