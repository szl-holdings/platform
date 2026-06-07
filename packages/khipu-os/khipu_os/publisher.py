# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS constellation delta publisher
"""
publisher.py — self-publish (Hypercore/CRDT append-log delta streaming, made ours).

Each tick emits a JSON DELTA (added receipt ids since last publish, new Merkle root, pruned
branch ids) to the `khipu-constellation` 3D viz — never a full snapshot, so the viz updates
in O(Δ). The transport is an injectable `sink` callable (default: in-memory buffer) so the
loop is testable offline; production wires an SSE stream / HF Space event channel.
"""
from __future__ import annotations

import time
from typing import Any, Callable, Dict, List, Optional


class ConstellationPublisher:
    def __init__(self, dag, sink: Optional[Callable[[Dict[str, Any]], None]] = None):
        self.dag = dag
        # persist published-watermark + sink on the DAG so it survives across ticks
        if not hasattr(dag, "_constellation_buffer"):
            dag._constellation_buffer = []  # type: ignore[attr-defined]
        if not hasattr(dag, "_published_ids"):
            dag._published_ids = set()      # type: ignore[attr-defined]
        self.sink = sink or (lambda delta: dag._constellation_buffer.append(delta))

    def run(self, now: float = None) -> Dict[str, Any]:
        now = now if now is not None else time.time()
        current_ids = set(self.dag.hot.keys())
        new_ids = [rid for rid in current_ids if rid not in self.dag._published_ids]
        pruned_ids = [rid for rid in self.dag._published_ids
                      if rid not in current_ids]
        delta = {
            "type": "khipu-constellation-delta",
            "ts": now,
            "space": self.dag.space,
            "added": sorted(new_ids),
            "pruned": sorted(pruned_ids),
            "merkle_root": self.dag.current_root(),
            "hot_count": self.dag.hot_count(),
        }
        self.sink(delta)
        self.dag._published_ids = current_ids
        return {"added": len(new_ids), "pruned": len(pruned_ids),
                "root": delta["merkle_root"]}
