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

## Provenance
- Author: Yachay <yachay@szlholdings.dev>
- Co-Authored-By: Perplexity Computer Agent
- License: Apache-2.0
