# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. Common Source adapter interface.
"""
base.py — the common Source interface every WAYRA adapter implements.

Adapter pattern (Doctrine WAYRA §Architecture): one class per source CATEGORY, all
sharing the same lifecycle so the orchestrator treats every stream identically:

    start()      — one-time setup (build http session, read cursor)
    stream()     — yield raw items since the last cursor (generator)
    parse(item)  — turn a raw item into a normalized dict
    normalize()  — turn a parsed dict into a canonical IngestEvent
    emit(ev,log) — gate (Yuyay-13) + persist + chain Khipu receipt + route

Every adapter is RECEIVE-ONLY from PUBLIC sources (HARD RULE). No adapter writes to
any third-party system. Politeness: each adapter declares `rate_limit_s` (min seconds
between requests) and a descriptive User-Agent.
"""
from __future__ import annotations

import time
import urllib.request
from typing import Any, Iterable, Iterator

from ..core.normalize import IngestEvent, KNOWN_ORGANS
from ..core.yuyay_gate import gate
from ..core.khipu_emit import IngestLog

USER_AGENT = (
    "WAYRA/0.1 (SZL Holdings empire-lungs; receive-only public-source ingest; "
    "+https://huggingface.co/SZLHOLDINGS)"
)


def http_get(url: str, headers: dict[str, str] | None = None, timeout: int = 30) -> bytes:
    """Polite GET with a descriptive UA. Honors per-source headers (e.g. tokens)."""
    h = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


class Source:
    """Base WAYRA source adapter. Subclasses set `source_id` and `route_to`,
    and implement stream()/parse()/normalize()."""

    source_id: str = "base"
    route_to: list[str] = []          # default organ routing for this category
    rate_limit_s: float = 1.0         # politeness floor between requests
    cadence: str = "hourly"           # documented refresh cadence

    def __init__(self, log: IngestLog | None = None) -> None:
        self.log = log
        self._last_req = 0.0

    # ---- lifecycle ----
    def start(self) -> None:
        """Optional one-time setup."""
        return None

    def stream(self) -> Iterator[Any]:
        """Yield raw source items. Subclass MUST implement."""
        raise NotImplementedError

    def parse(self, item: Any) -> dict[str, Any]:
        """Turn a raw item into a normalized dict. Subclass MUST implement."""
        raise NotImplementedError

    def normalize(self, parsed: dict[str, Any]) -> IngestEvent:
        """Turn a parsed dict into a canonical IngestEvent. Subclass MUST implement."""
        raise NotImplementedError

    # ---- politeness ----
    def _throttle(self) -> None:
        dt = time.time() - self._last_req
        if dt < self.rate_limit_s:
            time.sleep(self.rate_limit_s - dt)
        self._last_req = time.time()

    # ---- the shared emit path: gate → persist → receipt → route ----
    def emit(self, ev: IngestEvent, log: IngestLog) -> dict[str, Any]:
        known_hashes = log.known_hashes()
        known_titles = log.known_titles(source=self.source_id)
        ev = gate(ev, known_hashes, known_titles)
        # Route only on accept; review/drop still get a receipt but no routing.
        if ev.decision == "accept":
            ev.organ_routing = [o for o in self.route_to if o in KNOWN_ORGANS]
        else:
            ev.organ_routing = []
        receipt = log.emit(ev)
        return receipt

    def run_once(self, log: IngestLog, max_items: int = 50) -> dict[str, Any]:
        """Pull the stream, gate+receipt each item, stop at max_items (cost bound).

        Returns a per-run summary {fetched, accepted, review, dropped, duplicates}.
        """
        self.start()
        summary = {"source": self.source_id, "fetched": 0, "accepted": 0,
                   "review": 0, "dropped": 0, "duplicates": 0, "receipts": []}
        for item in self.stream():
            if summary["fetched"] >= max_items:
                break
            try:
                parsed = self.parse(item)
                ev = self.normalize(parsed)
            except Exception as exc:  # one bad item must not kill the stream
                continue
            if log.has(ev.content_hash):
                summary["duplicates"] += 1
                continue
            receipt = self.emit(ev, log)
            summary["fetched"] += 1
            summary[{"accept": "accepted", "review": "review",
                     "drop": "dropped"}[ev.decision]] += 1
            summary["receipts"].append(receipt["digest"][:12])
        return summary
