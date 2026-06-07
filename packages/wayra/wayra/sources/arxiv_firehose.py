# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. arXiv daily firehose source adapter.
"""
arxiv_firehose.py — WAYRA's daily arXiv new-paper firehose.

LEGAL: subscribes to arXiv's OFFICIAL public RSS feeds, e.g.
`https://rss.arxiv.org/rss/cs.AI`. arXiv explicitly publishes these per-category RSS
feeds for exactly this use; we read abstracts only (the RSS payload IS the abstract),
never full PDFs, honoring arXiv's "abstracts only" posture. Read-only, daily cadence.
(Doctrine WAYRA §Sources → arXiv firehose; LEGAL_COMPLIANCE: paywalled/full-text never
ingested — abstracts only.)

Categories watched: cs.AI cs.LG cs.CR cs.LO cs.RO eess.SY — AI, machine learning,
crypto/security, logic (formal verification!), robotics, systems & control.

Routing: cs.LO/cs.AI → a11oy/puriq (reasoning, formal methods), cs.CR → sentra,
cs.RO/eess.SY → killinchu (drone autonomy). Accepts an injected `fetch_fn` for tests.
"""
from __future__ import annotations

from typing import Any, Callable, Iterator

from ..core.normalize import IngestEvent, make_event
from .base import Source, http_get
from .feedparse import parse_feed

ARXIV_CATEGORIES = ["cs.AI", "cs.LG", "cs.CR", "cs.LO", "cs.RO", "eess.SY"]

_ROUTING = {
    "cs.AI": ["a11oy", "puriq"], "cs.LG": ["a11oy"], "cs.CR": ["sentra"],
    "cs.LO": ["puriq", "a11oy"], "cs.RO": ["killinchu"], "eess.SY": ["killinchu"],
}


class ArxivFirehose(Source):
    source_id = "arxiv"
    route_to = ["a11oy", "puriq"]
    rate_limit_s = 3.0           # arXiv asks for polite, low-frequency polling
    cadence = "daily"

    def __init__(self, log=None, categories: list[str] | None = None,
                 fetch_fn: Callable[[str], bytes] | None = None,
                 per_cat_limit: int = 15) -> None:
        super().__init__(log)
        self.categories = categories or ARXIV_CATEGORIES
        self._fetch_fn = fetch_fn or (lambda url: http_get(url, timeout=30))
        self.per_cat_limit = per_cat_limit

    def stream(self) -> Iterator[dict[str, Any]]:
        for cat in self.categories:
            self._throttle()
            url = f"https://rss.arxiv.org/rss/{cat}"
            try:
                xml = self._fetch_fn(url)
                items = parse_feed(xml)
            except Exception:
                continue
            for it in items[: self.per_cat_limit]:
                it["_cat"] = cat
                yield it

    def parse(self, it: dict[str, Any]) -> dict[str, Any]:
        return {
            "cat": it.get("_cat", ""),
            "title": it.get("title", ""),
            "link": it.get("link", ""),
            "summary": it.get("summary", "")[:1800],
            "published": it.get("published", ""),
            "id": it.get("id", ""),
            "creator": it.get("creator", ""),
        }

    def normalize(self, p: dict[str, Any]) -> IngestEvent:
        route = _ROUTING.get(p["cat"], self.route_to)
        ev = make_event(
            source=self.source_id,
            source_detail=p["cat"],
            timestamp=p["published"],
            title=p["title"],
            url=p["link"],
            raw=p,
            # arXiv abstracts are CC-licensed metadata; many under CC-BY/CC-BY-SA.
            parsed_summary=f"[{p['cat']}] {p['summary']}",
            license="arxiv-abstract-cc",
            identity_parts=[self.source_id, p["id"] or p["link"]],
        )
        self.route_to = route
        return ev
