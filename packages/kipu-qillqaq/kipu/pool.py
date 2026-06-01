# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — KIPU substrate (PURIQ Doctrine v15 over Doctrine v11)
# Doctrine v11 LOCKED: 749 declarations · 14 unique axioms · 163 sorries.
# git trailer: Perplexity Computer Agent
"""kipu/pool.py — the KipuPool tuple space.

KipuPool is the in-process Linda-style tuple space (Gelernter & Carriero 1986) that
holds content-addressed :class:`~kipu.cell.ReceiptCell` knots. Organs `write` cells,
`read`/`take` cells matching an associative template (antituple), and `subscribe` to
be notified of future matches. Reads are themselves receipted (`read_receipt`) so the
substrate stays append-only and auditable (event sourcing: Fowler/Young).

This is the SUBSTRATE; the Khipu DAG is the STRUCTURE a pool snapshots itself into.
Matching reuses the associative-addressing logic in :mod:`kipu.subscribe` verbatim —
no new semantics are introduced here.
"""
from __future__ import annotations

from threading import RLock
from typing import Callable, Iterator, Optional

from .cell import ReceiptCell, read_receipt
from .subscribe import Subscription, match_pattern


class KipuPool:
    """A content-addressed, subscribable tuple space of ReceiptCells.

    Cells are stored by their content id (CID); writing the same content twice is
    idempotent (content addressing). All mutating operations are guarded by a
    re-entrant lock so a pool can be shared across organ threads in one process.
    """

    def __init__(self) -> None:
        self._cells: dict[str, ReceiptCell] = {}
        self._subs: list[Subscription] = []
        self._lock = RLock()

    # ---- writing (append-only) ----
    def write(self, cell: ReceiptCell) -> str:
        """Knot a cell into the pool; returns its CID. Notifies matching subscribers."""
        if not cell.cid:
            cell.sign()
        with self._lock:
            self._cells[cell.cid] = cell
            subs = list(self._subs)
        for sub in subs:
            if sub.matches(cell):
                sub.deliver(cell)
        return cell.cid

    # ---- reading (associative addressing) ----
    def read(self, pattern: dict, *, organ: str = "anon") -> Optional[ReceiptCell]:
        """Return the most recent cell matching `pattern` (or None). Emits a read_receipt."""
        matches = self.read_all(pattern, organ=organ)
        return matches[-1] if matches else None

    def read_all(self, pattern: dict, *, organ: str = "anon") -> list[ReceiptCell]:
        """Return all cells matching `pattern`, oldest first. Emits a read_receipt."""
        with self._lock:
            found = [c for c in self._cells.values() if match_pattern(c, pattern)]
        found.sort(key=lambda c: c.ts)
        # every substrate read emits a receipt (HR: auditable reads)
        rr = read_receipt(organ, pattern, [c.cid for c in found])
        with self._lock:
            self._cells.setdefault(rr.cid, rr)
        return found

    def take(self, pattern: dict, *, organ: str = "anon") -> Optional[ReceiptCell]:
        """Linda `in`: read+remove the most recent matching cell (or None)."""
        with self._lock:
            cell = self.read(pattern, organ=organ)
            if cell is not None:
                self._cells.pop(cell.cid, None)
            return cell

    def get(self, cid: str) -> Optional[ReceiptCell]:
        with self._lock:
            return self._cells.get(cid)

    # ---- subscriptions ----
    def subscribe(
        self,
        organ: str,
        pattern: dict,
        callback: Callable[[ReceiptCell], None],
        *,
        label: str = "",
    ) -> Subscription:
        sub = Subscription(organ=organ, pattern=pattern, callback=callback, patterns_label=label)
        with self._lock:
            self._subs.append(sub)
        return sub

    def unsubscribe(self, sub: Subscription) -> bool:
        with self._lock:
            if sub in self._subs:
                self._subs.remove(sub)
                return True
            return False

    # ---- introspection ----
    def __len__(self) -> int:
        with self._lock:
            return len(self._cells)

    def __iter__(self) -> Iterator[ReceiptCell]:
        with self._lock:
            return iter(list(self._cells.values()))

    def cids(self) -> list[str]:
        with self._lock:
            return list(self._cells.keys())
