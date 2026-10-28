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
import json
import math
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from ._puriq_compat import (
    OrganAgent, KhipuSigner, KhipuReceipt, YuyayGate, YuyayScores, HukullaTripwires,
    LOCKED,
)


_RECEIPT_SCHEMA = "szl.khipu.receipt/v1"
_RECEIPT_FIELDS = frozenset({
    "receipt_id", "organ", "action", "payload", "parents", "ts", "yuyay",
    "content_hash", "signature", "chain_verified",
})


def _receipt_number(value: Any, label: str) -> Any:
    """Return a ts/yuyay value unchanged, or raise ValueError if it is out of contract.

    Receipts are signed over these values exactly as JSON writes them, so an int must
    stay an int (``1`` and ``1.0`` hash differently) and a large int must keep every
    digit. Booleans, non-numbers, NaN/inf and ints beyond float range are refused.
    """
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label} is malformed")
    try:
        finite = math.isfinite(value)
    except OverflowError:  # int too large to convert to float
        finite = False
    if not finite:
        raise ValueError(f"{label} is malformed")
    return value


def _receipt_record(receipt: KhipuReceipt) -> Dict[str, Any]:
    """Return the versioned, signed receipt record written to the durable store."""
    return {
        "receipt_id": receipt.receipt_id,
        "organ": receipt.organ,
        "action": receipt.action,
        "payload": receipt.payload,
        "parents": list(receipt.parents),
        "ts": receipt.ts,
        "yuyay": receipt.yuyay,
        "content_hash": receipt.content_hash,
        "signature": receipt.signature,
        "chain_verified": getattr(receipt, "chain_verified", True),
    }


def _persisted_receipt_blob(receipt: KhipuReceipt) -> bytes:
    """Serialize the complete signed receipt, including verification material."""
    return json.dumps(
        {"schema": _RECEIPT_SCHEMA, "receipt": _receipt_record(receipt)},
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _restore_receipt(blob: bytes, expected_id: str) -> KhipuReceipt:
    """Decode one durable record and reject legacy or malformed bytes."""
    try:
        envelope = json.loads(blob.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("persisted receipt is not valid UTF-8 JSON") from exc
    if not isinstance(envelope, dict) or envelope.get("schema") != _RECEIPT_SCHEMA:
        raise ValueError("unsupported persisted receipt schema")
    record = envelope.get("receipt")
    if not isinstance(record, dict) or set(record) != _RECEIPT_FIELDS:
        raise ValueError("persisted receipt fields are incomplete or unknown")
    if record["receipt_id"] != expected_id or not isinstance(record["receipt_id"], str):
        raise ValueError("persisted receipt id does not match its store key")
    if any(not isinstance(record[key], str) or not record[key]
           for key in ("organ", "action", "signature")):
        raise ValueError("persisted receipt identity or signature is malformed")
    if not isinstance(record["payload"], dict):
        raise ValueError("persisted receipt payload is not an object")
    parents = record["parents"]
    if (not isinstance(parents, list)
            or any(not isinstance(parent, str) or not parent for parent in parents)
            or len(set(parents)) != len(parents)):
        raise ValueError("persisted receipt parents are malformed")
    ts = _receipt_number(record["ts"], "persisted receipt timestamp")
    yuyay = _receipt_number(record["yuyay"], "persisted receipt yuyay")
    if (not isinstance(record["content_hash"], str)
            or len(record["content_hash"]) != 64
            or any(char not in "0123456789abcdef" for char in record["content_hash"])):
        raise ValueError("persisted receipt content hash is malformed")
    if record["chain_verified"] is not True:
        raise ValueError("persisted receipt is not chain-verified")

    try:
        receipt = KhipuReceipt(
            receipt_id=record["receipt_id"], organ=record["organ"],
            action=record["action"], payload=record["payload"],
            parents=list(parents), ts=ts, yuyay=yuyay,
        )
    except TypeError as exc:
        raise ValueError("installed KhipuReceipt type cannot be restored") from exc
    receipt.content_hash = record["content_hash"]
    receipt.signature = record["signature"]
    receipt.chain_verified = True
    return receipt


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
        if self.store is not None:
            try:
                self._restore_persisted()
            except Exception:
                self.store.close()
                raise

    def _restore_persisted(self) -> None:
        """Rebuild the in-memory graph from durable signed receipt records.

        Recovery is fail-closed: legacy signing-byte-only rows, malformed records,
        invalid signatures, missing parents, and cycles stop startup rather than
        inventing state or silently dropping history.
        """
        hot_ids = list(self.store.keys())
        cold_ids = list(self.store.cold_keys())
        if set(hot_ids).intersection(cold_ids):
            raise ValueError("persisted receipt appears in both hot and cold stores")
        all_ids = hot_ids + cold_ids
        if len(set(all_ids)) != len(all_ids):
            raise ValueError("persisted receipt ids are duplicated")
        restored: Dict[str, KhipuReceipt] = {}
        for receipt_id in all_ids:
            blob = self.store.get(receipt_id)
            if blob is None:
                raise ValueError(f"persisted receipt bytes missing: {receipt_id}")
            receipt = _restore_receipt(blob, receipt_id)
            if not self.signer.verify(receipt):
                raise ValueError(f"persisted receipt signature invalid: {receipt_id}")
            restored[receipt_id] = receipt

        for receipt_id, receipt in restored.items():
            for parent in receipt.parents:
                if parent not in restored:
                    raise ValueError(
                        f"persisted receipt {receipt_id} references missing parent {parent}"
                    )
                if parent == receipt_id:
                    raise ValueError(f"persisted receipt self-cycle: {receipt_id}")

        # Detect cycles independently of insertion order. Children tracks hot
        # descendants only, matching the pruner's hot/cold projection semantics.
        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(receipt_id: str) -> None:
            if receipt_id in visiting:
                raise ValueError(f"persisted receipt cycle detected at {receipt_id}")
            if receipt_id in visited:
                return
            visiting.add(receipt_id)
            for parent in restored[receipt_id].parents:
                visit(parent)
            visiting.remove(receipt_id)
            visited.add(receipt_id)

        for receipt_id in all_ids:
            visit(receipt_id)

        self.hot = {receipt_id: restored[receipt_id] for receipt_id in hot_ids}
        self.archived_ids = cold_ids
        self.children = {receipt_id: [] for receipt_id in all_ids}
        for receipt_id in hot_ids:
            for parent in restored[receipt_id].parents:
                self.children[parent].append(receipt_id)
        self.receipts = list(self.hot.values())
        self._seq = max(
            (int(receipt_id.rsplit("-", 1)[1])
             for receipt_id in hot_ids + cold_ids
             if receipt_id.startswith(f"{self.name}-")
             and receipt_id.rsplit("-", 1)[1].isdigit()),
            default=0,
        )

    # ---- canonical append-only API (INV-APPEND, INV-DAG) --------------------
    def add_receipt(self, organ: str, action: str, payload: Dict[str, Any],
                    parents: Optional[List[str]] = None, yuyay: float = 1.0,
                    ts: Optional[float] = None) -> KhipuReceipt:
        """Append a new receipt. Parents must already exist (acyclic, INV-DAG).
        Returns the signed receipt; never overwrites an existing id (INV-APPEND)."""
        parents = parents or []
        if ts is None:
            ts = time.time()
        # refuse values recovery would reject, so append never writes unrestorable history
        _receipt_number(ts, "receipt timestamp")
        _receipt_number(yuyay, "receipt yuyay")
        for p in parents:
            if p not in self.hot and p not in self.archived_ids:
                raise ValueError(f"parent {p} does not exist (forward edge forbidden, INV-DAG)")
        r = KhipuReceipt(receipt_id=self._next_id(), organ=organ, action=action,
                         payload=payload, parents=list(parents), yuyay=yuyay,
                         ts=ts)
        self.signer.sign(r)
        if r.receipt_id in self.hot:  # defensive: ids are monotonic, should never collide
            raise ValueError(f"id collision {r.receipt_id} (INV-APPEND violated)")
        if self.store is not None:                       # durable append (INV-APPEND on disk)
            self.store.put(r.receipt_id, _persisted_receipt_blob(r), cold=False)
        self.hot[r.receipt_id] = r
        self.children.setdefault(r.receipt_id, [])
        for p in parents:
            self.children.setdefault(p, []).append(r.receipt_id)
        return r

    def close(self) -> None:
        """Close the durable backend without changing the append-only history."""
        if self.store is not None:
            self.store.close()

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
