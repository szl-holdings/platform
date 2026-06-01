# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS periodic verifier
"""
verifier.py — periodic random-sample verification (Filecoin WindowPoSt challenge, made ours).

Every 5 min, sample up to N=100 random hot receipts, recompute the SHA3-256 content hash,
and verify the DSSE signature. Mismatch ⇒ ok=False with the offending ids — the caller
(KhipuDAG.tick) then fires the tamper prosecutor (T22). Random sampling keeps the loop O(1)
in DAG size, which is exactly why Filecoin samples a random partition rather than re-proving
everything.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List, Optional


class Verifier:
    def __init__(self, dag, rng: Optional[random.Random] = None):
        self.dag = dag
        self.rng = rng or random.Random()

    def run(self, sample_n: int = 100) -> Dict[str, Any]:
        ids = list(self.dag.hot.keys())
        n = min(sample_n, len(ids))
        sample = self.rng.sample(ids, n) if n > 0 else []
        bad: List[Dict[str, str]] = []
        for rid in sample:
            r = self.dag.hot[rid]
            expect = self.dag.signer.content_hash(r)
            if expect != r.content_hash:
                bad.append({"id": rid, "kind": "hash_mismatch",
                            "expected": expect, "stored": r.content_hash})
                continue
            if not self.dag.signer.verify(r):
                bad.append({"id": rid, "kind": "signature_invalid"})
        ok = len(bad) == 0
        rec = self.dag.add_receipt(
            organ=self.dag.name, action="self_verify",
            payload={"sampled": n, "ok": ok, "bad_count": len(bad)},
            yuyay=1.0,
        )
        return {"ok": ok, "sampled": n, "bad": bad, "receipt": rec.receipt_id}
