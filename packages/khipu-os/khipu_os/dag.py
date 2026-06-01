# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS canonical agentic DAG
"""
dag.py — the canonical agentic Khipu DAG.

The Khipu DAG is an append-only, Merkle-signed receipt graph. KHIPU-OS makes it an
OrganAgent (PURIQ-OS base): a Wiener feedback loop whose reference is the Doctrine, that
on each 60 s tick runs the six autonomous behaviours (self-prune, self-checkpoint,
self-verify, self-link-suggest, self-publish, self-prosecute), each emitting a signed
Khipu receipt — the DAG signs itself, recursively (intentional, per directive).

Invariants (proved in Lean `agentic_dag_soundness`, see LEAN_PATCHES.md):
  INV-APPEND  : receipts are never deleted/mutated; pruning is a hot/cold *projection*.
  INV-MERKLE  : the Merkle root is a pure function of the (sorted) receipt-id set; any
                tamper to a receipt's content_hash changes the root (collision-resistance
                of SHA3-256), so a checkpoint pins the exact committed set.
  INV-DAG     : parent links only point to already-existing receipts (acyclic, no forward
                edges) — enforced at add-time.

LOCKED v11 numbers preserved verbatim (see _puriq_compat.LOCKED). NO mysticism.
"""
from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from ._puriq_compat import (
    OrganAgent, KhipuSigner, KhipuReceipt, YuyayGate, YuyayScores, HukullaTripwires,
    LOCKED,
)


def merkle_root(leaf_hashes: List[str]) -> str:
    """Deterministic binary Merkle root over leaf hex-hashes (SHA3-256). Leaves are
    sorted so the root is a pure function of the *set* of receipts, not insertion order
    (INV-MERKLE). Empty set ⇒ the SHA3-256 of the empty string (a fixed, well-defined root)."""
    if not leaf_hashes:
        return hashlib.sha3_256(b"").hexdigest()
    level = sorted(leaf_hashes)
    while len(level) > 1:
        nxt: List[str] = []
        for i in range(0, len(level), 2):
            a = level[i]
            b = level[i + 1] if i + 1 < len(level) else level[i]  # duplicate last if odd
            nxt.append(hashlib.sha3_256((a + b).encode()).hexdigest())
        level = nxt
    return level[0]


def merkle_proof(leaf_hashes: List[str], target: str) -> Optional[List[Tuple[bool, str]]]:
    """Build a Merkle inclusion (audit) path for `target` among `leaf_hashes`.
    Returns a list of (is_right_sibling, sibling_hash) steps that fold `target` up to
    the root via `verify_merkle_proof`, or None if `target` is absent. Mirrors the Lean
    `MerkleProof` (leaf + path of (Bool x Hash)) and `toRoot` fold. Leaves are sorted,
    last duplicated on odd levels — identical to `merkle_root`."""
    level = sorted(leaf_hashes)
    if target not in level:
        return None
    idx = level.index(target)
    path: List[Tuple[bool, str]] = []
    while len(level) > 1:
        nxt: List[str] = []
        for i in range(0, len(level), 2):
            a = level[i]
            b = level[i + 1] if i + 1 < len(level) else level[i]
            if i == idx or i + 1 == idx:
                if idx == i:                       # target on the left, sibling on right
                    path.append((True, b))
                else:                              # target on the right, sibling on left
                    path.append((False, a))
                new_idx = len(nxt)
            nxt.append(hashlib.sha3_256((a + b).encode()).hexdigest())
        idx = new_idx
        level = nxt
    return path


def verify_merkle_proof(leaf: str, path: List[Tuple[bool, str]], root: str) -> bool:
    """Fold an inclusion proof from `leaf` and check it reproduces `root`. This is the
    Python twin of Lean `verifyInclusion` / `MerkleProof.toRoot`."""
    acc = leaf
    for is_right_sibling, sib in path:
        body = (acc + sib) if is_right_sibling else (sib + acc)
        acc = hashlib.sha3_256(body.encode()).hexdigest()
    return acc == root


@dataclass
class BranchMeta:
    """Per-branch bookkeeping used by the pruner (tip receipt id → metadata)."""
    tip_id: str
    last_ref_ts: float
    has_descendants: bool
    yuyay: float


class KhipuDAG(OrganAgent):
    """The self-driving Khipu DAG (an OrganAgent ticking every 60 s by default).

    The loop wiring lives in the helper agents (pruner/checkpointer/verifier/linker/
    publisher/tamper_prosecutor); this class is the canonical store + the tick dispatcher
    that invokes them in order and signs the aggregate tick receipt. It can run fully
    standalone (vendored PURIQ-OS shim) or on the real `szl_puriq_os` runtime."""

    def __init__(self, space: str = "local", cadence_s: float = 60.0,
                 retain_last: int = 1000, stale_days: float = 30.0,
                 checkpoint_interval_s: float = 12 * 3600,
                 verify_interval_s: float = 5 * 60,
                 signer: Optional[KhipuSigner] = None,
                 persist_path: Optional[str] = None, store_backend: str = "auto"):
        super().__init__(name=f"khipu-dag::{space}", cadence_s=cadence_s, signer=signer)
        # optional on-disk persistence (LMDB if available, else SQLite — see store.py)
        self.store = None
        if persist_path is not None:
            from .store import open_store
            self.store = open_store(persist_path, prefer=store_backend)
        self.space = space
        self.retain_last = retain_last
        self.stale_days = stale_days
        self.checkpoint_interval_s = checkpoint_interval_s
        self.verify_interval_s = verify_interval_s

        # canonical store: receipt_id -> KhipuReceipt (hot set)
        self.hot: Dict[str, KhipuReceipt] = {}
        # parent -> children adjacency (for descendant checks / pruning)
        self.children: Dict[str, List[str]] = {}
        # archived (cold) receipt ids — recoverable bit-for-bit from HF dataset
        self.archived_ids: List[str] = []
        # checkpoint history (immutable, Iceberg-snapshot style)
        self.checkpoints: List[Dict[str, Any]] = []
        # last-run timestamps for cadence sub-loops
        self._last_checkpoint = 0.0
        self._last_verify = 0.0
        # register the additive DAG-tamper tripwire (never touches LOCKED T01–T10 core)
        if "T22" not in self.hukulla.extensions:
            self.hukulla.register("T22", "DAG tamper — Merkle/signature verification mismatch")
        self.subscribers: List[Any] = []  # Wire-B subscribers (notified on T22)
        self.tamper_events: List[Dict[str, Any]] = []
        self.locked = dict(LOCKED)

    # ---- canonical append-only API (INV-APPEND, INV-DAG) --------------------
    def add_receipt(self, organ: str, action: str, payload: Dict[str, Any],
                    parents: Optional[List[str]] = None, yuyay: float = 1.0,
                    ts: Optional[float] = None) -> KhipuReceipt:
        """Append a new receipt. Parents must already exist (acyclic, INV-DAG).
        Returns the signed receipt; never overwrites an existing id (INV-APPEND)."""
        parents = parents or []
        for p in parents:
            if p not in self.hot and p not in self.archived_ids:
                raise ValueError(f"parent {p} does not exist (forward edge forbidden, INV-DAG)")
        r = KhipuReceipt(receipt_id=self._next_id(), organ=organ, action=action,
                         payload=payload, parents=list(parents), yuyay=yuyay,
                         ts=ts if ts is not None else time.time())
        self.signer.sign(r)
        if r.receipt_id in self.hot:  # defensive: ids are monotonic, should never collide
            raise ValueError(f"id collision {r.receipt_id} (INV-APPEND violated)")
        self.hot[r.receipt_id] = r
        if self.store is not None:                       # durable append (INV-APPEND on disk)
            self.store.put(r.receipt_id, r.signing_bytes(), cold=False)
        self.children.setdefault(r.receipt_id, [])
        for p in parents:
            self.children.setdefault(p, []).append(r.receipt_id)
        return r

    # ---- read helpers --------------------------------------------------------
    def hot_count(self) -> int:
        return len(self.hot)

    def has_descendants(self, rid: str) -> bool:
        return len(self.children.get(rid, [])) > 0

    def leaf_hashes(self) -> List[str]:
        return [r.content_hash for r in self.hot.values()]

    def current_root(self) -> str:
        return merkle_root(self.leaf_hashes())

    def branch_metas(self) -> List[BranchMeta]:
        """One BranchMeta per hot receipt (tip candidate)."""
        now = time.time()
        out = []
        for rid, r in self.hot.items():
            out.append(BranchMeta(
                tip_id=rid,
                last_ref_ts=r.ts,
                has_descendants=self.has_descendants(rid),
                yuyay=r.yuyay,
            ))
        return out

    # ---- tick dispatcher: the six autonomous behaviours ---------------------
    def tick(self, now: Optional[float] = None) -> Dict[str, Any]:
        """One DAG tick. Runs the cadence-gated sub-loops in order and signs an
        aggregate tick receipt (the DAG signing itself, recursively)."""
        from .pruner import Pruner
        from .checkpointer import Checkpointer
        from .verifier import Verifier
        from .publisher import ConstellationPublisher
        from .tamper_prosecutor import TamperProsecutor

        now = now if now is not None else time.time()
        self.tick_count += 1
        summary: Dict[str, Any] = {"tick": self.tick_count, "ts": now, "space": self.space}

        # a) self-prune (every tick; pruner decides eligibility)
        pruned = Pruner(self).run(now=now)
        summary["pruned"] = pruned

        # b) self-Merkle-checkpoint (every 12h)
        if now - self._last_checkpoint >= self.checkpoint_interval_s:
            cp = Checkpointer(self).run(now=now)
            self._last_checkpoint = now
            summary["checkpoint"] = cp

        # c) self-verify (every 5 min) → on mismatch, self-prosecute
        if now - self._last_verify >= self.verify_interval_s:
            vr = Verifier(self).run(sample_n=100)
            self._last_verify = now
            summary["verify"] = vr
            if not vr["ok"]:
                tp = TamperProsecutor(self).run(vr)
                summary["prosecute"] = tp

        # e) self-publish (delta-stream every tick)
        summary["publish"] = ConstellationPublisher(self).run(now=now)

        # sign the aggregate tick (recursive self-receipt)
        rec = self.add_receipt(
            organ=self.name, action="dag_tick",
            payload={"summary": {k: summary[k] for k in summary if k != "publish"},
                     "root": self.current_root()},
            yuyay=1.0,
        )
        summary["tick_receipt"] = rec.receipt_id
        summary["root"] = self.current_root()
        summary["hot_count"] = self.hot_count()
        summary["archived_count"] = len(self.archived_ids)
        return summary
