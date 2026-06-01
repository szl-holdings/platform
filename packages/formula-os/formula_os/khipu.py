"""
khipu.py — Khipu receipt emission for every FormulaAgent cycle.

A Khipu receipt is a content-addressed, chain-linked JSON record (DAG node).
Each receipt references the previous receipt's hash (prev), forming a verifiable
chain. chain_verified=True is required for a non-zero master-formula score
(F1/F21 gate). This is additive and self-contained (open-source: stdlib only).

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from __future__ import annotations
import hashlib
import json
import os
import time
from dataclasses import dataclass, asdict, field


def _canon(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)


@dataclass
class Receipt:
    seq: int
    ts: float
    formula_id: str
    kind: str                 # evaluate | prove | test | tick
    payload: dict
    prev: str                 # hash of previous receipt ("" for genesis)
    self_hash: str = ""

    def compute_hash(self) -> str:
        body = _canon({
            "seq": self.seq, "ts": round(self.ts, 6), "formula_id": self.formula_id,
            "kind": self.kind, "payload": self.payload, "prev": self.prev,
        })
        return hashlib.sha256(body.encode()).hexdigest()


class KhipuChain:
    """Append-only receipt chain, one per formula agent."""

    def __init__(self, formula_id: str, store_dir: str | None = None):
        self.formula_id = formula_id
        self.receipts: list[Receipt] = []
        self.store_dir = store_dir
        if store_dir:
            os.makedirs(store_dir, exist_ok=True)

    def emit(self, kind: str, payload: dict) -> Receipt:
        prev = self.receipts[-1].self_hash if self.receipts else ""
        r = Receipt(seq=len(self.receipts), ts=time.time(),
                    formula_id=self.formula_id, kind=kind, payload=payload, prev=prev)
        r.self_hash = r.compute_hash()
        self.receipts.append(r)
        if self.store_dir:
            with open(os.path.join(self.store_dir, f"{self.formula_id}.jsonl"), "a") as fh:
                fh.write(_canon(asdict(r)) + "\n")
        return r

    def verify(self) -> bool:
        """chain_verified: every link's prev matches and every hash recomputes."""
        prev = ""
        for r in self.receipts:
            if r.prev != prev:
                return False
            if r.compute_hash() != r.self_hash:
                return False
            prev = r.self_hash
        return True

    def last(self, n: int = 5) -> list[dict]:
        return [asdict(r) for r in self.receipts[-n:]]
