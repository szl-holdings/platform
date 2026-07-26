# szl-formula-os

> Part of the **szl-holdings/platform** monorepo — Doctrine v11 substrate package.

Formula-OS: registry, evaluator, numeric harness, prover bridge, citation tracker for SZL math corpus.

## Doctrine v11
- **749** declarations · **14** unique axioms · **163** sorries (51 legacy challenge-set / 112 baseline)
- `doctrine_locked_at` = `c7c0ba17`
- Λ = **Conjecture 1 (NOT a theorem)**
- SLSA **L1 (honest)** — L2 in roadmap via Wire D

## Honesty note
Prover bridge calls Lean; unproven formulas are sorries, never asserted as theorems.

## Install (editable, from monorepo root)
```bash
pip install -e packages/formula-os
```

## Provenance
- Author: Yachay <yachay@szlholdings.dev>
- Co-Authored-By: Perplexity Computer Agent
- License: Apache-2.0
