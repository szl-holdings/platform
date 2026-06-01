# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. Standards watcher source adapter.
"""
standards_watcher.py — WAYRA's standards-body watcher.

LEGAL: reads PUBLIC standards feeds only — IETF datatracker public Atom feeds, W3C
public news/TR feeds. These bodies publish open feeds of draft activity for exactly
this purpose; read-only, no auth. ASTM F38 (drone committee) and NATO STANAG working
groups are catalogued in WAYRA_SOURCES_CATALOG.md as where-publicly-accessible only —
their member-only material is NOT ingested (LEGAL boundary).

Tracks SCITT / SLSA / in-toto / supply-chain draft activity (sentra, amaru) and W3C
TR updates (a11oy). Accepts injected `fetch_fn` for tests.
"""
from __future__ import annotations

from typing import Any, Callable, Iterator

from ..core.normalize import IngestEvent, make_event
from .base import Source, http_get
from .feedparse import parse_feed

# Public standards feeds (name, url, routing).
STANDARDS_FEEDS = [
    # IETF datatracker per-group + new-RFC public Atom feeds.
    ("IETF-SCITT", "https://datatracker.ietf.org/wg/scitt/atom.xml", ["sentra", "amaru"]),
    ("IETF-new-RFCs", "https://www.rfc-editor.org/rfcrss.xml", ["sentra", "a11oy"]),
    ("IETF-COSE", "https://datatracker.ietf.org/wg/cose/atom.xml", ["sentra"]),
    ("IETF-OAUTH", "https://datatracker.ietf.org/wg/oauth/atom.xml", ["sentra"]),
    # W3C public news feed (covers TR publications).
    ("W3C-news", "https://www.w3.org/blog/news/feed/", ["a11oy"]),
]


class StandardsWatcher(Source):
    source_id = "standards"
    route_to = ["sentra", "amaru"]
    rate_limit_s = 2.0
    cadence = "daily"

    def __init__(self, log=None, feeds: list[tuple[str, str, list[str]]] | None = None,
                 fetch_fn: Callable[[str], bytes] | None = None,
                 per_feed_limit: int = 5) -> None:
        super().__init__(log)
        self.feeds = feeds or STANDARDS_FEEDS
        self._fetch_fn = fetch_fn or (lambda url: http_get(url, timeout=30))
        self.per_feed_limit = per_feed_limit

    def stream(self) -> Iterator[dict[str, Any]]:
        for name, url, route in self.feeds:
            self._throttle()
            try:
                items = parse_feed(self._fetch_fn(url))
            except Exception:
                continue
            for it in items[: self.per_feed_limit]:
                it["_name"] = name
                it["_route"] = route
                yield it

    def parse(self, it: dict[str, Any]) -> dict[str, Any]:
        return {
            "name": it.get("_name", ""),
            "route": it.get("_route", self.route_to),
            "title": it.get("title", ""),
            "link": it.get("link", ""),
            "summary": it.get("summary", "")[:1200],
            "published": it.get("published", ""),
            "id": it.get("id", "") or it.get("link", ""),
        }

    def normalize(self, p: dict[str, Any]) -> IngestEvent:
        ev = make_event(
            source=self.source_id,
            source_detail=p["name"],
            timestamp=p["published"],
            title=f"{p['name']}: {p['title']}",
            url=p["link"],
            raw=p,
            parsed_summary=p["summary"],
            license="standards-public",
            identity_parts=[self.source_id, p["id"] or p["link"]],
        )
        self.route_to = p["route"]
        return ev
