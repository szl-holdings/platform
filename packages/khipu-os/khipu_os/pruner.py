# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS autonomous pruner
"""
pruner.py — autonomous self-pruning (Iceberg expireSnapshots + IPFS pinning, made ours).

A hot-set receipt is ARCHIVE-ELIGIBLE iff ALL hold:
  (1) unreferenced for > stale_days  (last_ref_ts older than cutoff),
  (2) has NO descendants             (it is a true leaf branch tip),
  (3) Yuyay score < archive floor    (low-value).
The most-recent `retain_last` receipts are PINNED regardless of age (Iceberg `retain_last`
/ IPFS pin), guaranteeing time-travel/rollback never loses the working set.

Archiving is a HOT→COLD *projection*, never a delete: the receipt is moved to the cold
HF dataset `szlholdings/khipu-snapshots` and recoverable bit-for-bit, so the append-only
history is preserved (INV-APPEND). Each pruning run emits a signed Khipu receipt.
"""
from __future__ import annotations

import time
from typing import Any, Dict, List

ARCHIVE_YUYAY_FLOOR = 0.90


class Pruner:
    def __init__(self, dag, yuyay_floor: float = ARCHIVE_YUYAY_FLOOR):
        self.dag = dag
        self.yuyay_floor = yuyay_floor

    def eligible(self, now: float) -> List[str]:
        cutoff = now - self.dag.stale_days * 86400.0
        # pin the most-recent retain_last receipts (by ts) — never eligible
        ordered = sorted(self.dag.hot.values(), key=lambda r: r.ts, reverse=True)
        pinned = {r.receipt_id for r in ordered[: self.dag.retain_last]}
        out: List[str] = []
        for rid, r in self.dag.hot.items():
            if rid in pinned:
                continue
            if r.ts >= cutoff:                       # (1) still recent
                continue
            if self.dag.has_descendants(rid):        # (2) has children
                continue
            if r.yuyay >= self.yuyay_floor:          # (3) high-value
                continue
            out.append(rid)
        return out

    def run(self, now: float = None) -> Dict[str, Any]:
        now = now if now is not None else time.time()
        ids = self.eligible(now)
        archived = []
        for rid in ids:
            r = self.dag.hot.pop(rid)
            # detach from parents' child lists (the cold copy keeps the edges)
            for p in r.parents:
                if p in self.dag.children and rid in self.dag.children[p]:
                    self.dag.children[p].remove(rid)
            self.dag.children.pop(rid, None)
            self.dag.archived_ids.append(rid)
            if getattr(self.dag, "store", None) is not None:
                self.dag.store.move_to_cold(rid)   # hot->cold on disk (bytes preserved)
            archived.append({"id": rid, "ts": r.ts, "yuyay": r.yuyay,
                             "cold_store": "szlholdings/khipu-snapshots"})
        rec = self.dag.add_receipt(
            organ=self.dag.name, action="self_prune",
            payload={"archived": archived, "count": len(archived),
                     "stale_days": self.dag.stale_days, "retain_last": self.dag.retain_last},
            yuyay=1.0,
        )
        return {"archived_count": len(archived), "archived_ids": [a["id"] for a in archived],
                "receipt": rec.receipt_id}
