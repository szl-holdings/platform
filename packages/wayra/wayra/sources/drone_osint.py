# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. Drone OSINT firehose source adapter.
"""
drone_osint.py — WAYRA's drone open-source-intelligence (OSINT) firehose.

LEGAL — RECEIVE-ONLY from PUBLIC sources (HARD RULE). WAYRA monitors the PUBLIC moves
of drone leaders; it NEVER bakes code into their systems and NEVER touches a non-public
source. Concretely:
  - Vendor PRESS-RELEASE RSS (Anduril, Shield AI, Skydio, AeroVironment, Saronic) —
    public newsroom feeds the companies publish for exactly this purpose.
  - USASpending.gov AWARDS API (https://api.usaspending.gov) — official open government
    API; no auth; the public record of federal contract awards.
  - SAM.gov contract-opportunity public feed + FCC IBFS public queries are catalogued
    in WAYRA_SOURCES_CATALOG.md; this adapter wires the two that need no API key
    (press RSS + USASpending) so it runs live out of the box; SAM.gov is added behind
    an API key in the catalog.

Routing → killinchu (drone flagship) + sentra (threat/supply-chain). Accepts injected
`fetch_fn` / `post_fn` so tests run against canned payloads with no network.
"""
from __future__ import annotations

import json
from typing import Any, Callable, Iterator

from ..core.normalize import IngestEvent, make_event
from .base import Source, http_get
from .feedparse import parse_feed

# Public vendor newsroom RSS feeds (press releases the vendors publish openly).
PRESS_FEEDS = [
    ("Anduril", "https://www.anduril.com/feed.xml"),
    ("Shield AI", "https://shield.ai/feed/"),
    ("Skydio", "https://www.skydio.com/blog/rss.xml"),
    ("AeroVironment", "https://www.avinc.com/rss/press-releases"),
    ("DefenseNews-UAS", "https://www.defensenews.com/arc/outboundfeeds/rss/category/unmanned/?outputType=xml"),
]

# USASpending keyword searches for drone / counter-UAS award awareness (public API).
USASPENDING_KEYWORDS = ["counter-UAS", "unmanned aircraft system", "drone autonomy"]


class DroneOSINT(Source):
    source_id = "drone_osint"
    route_to = ["killinchu", "sentra"]
    rate_limit_s = 2.0
    cadence = "daily"

    def __init__(self, log=None,
                 press_feeds: list[tuple[str, str]] | None = None,
                 keywords: list[str] | None = None,
                 fetch_fn: Callable[[str], bytes] | None = None,
                 post_fn: Callable[[str, dict], bytes] | None = None,
                 per_feed_limit: int = 5, award_limit: int = 5) -> None:
        super().__init__(log)
        self.press_feeds = press_feeds or PRESS_FEEDS
        self.keywords = keywords or USASPENDING_KEYWORDS
        self._fetch_fn = fetch_fn or (lambda url: http_get(url, timeout=30))
        self._post_fn = post_fn or self._default_post
        self.per_feed_limit = per_feed_limit
        self.award_limit = award_limit

    @staticmethod
    def _default_post(url: str, body: dict) -> bytes:
        import urllib.request
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            url, data=data,
            headers={"Content-Type": "application/json",
                     "User-Agent": "WAYRA/0.1 (SZL public-OSINT receive-only)"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read()

    def stream(self) -> Iterator[dict[str, Any]]:
        # 1) vendor press RSS
        for vendor, url in self.press_feeds:
            self._throttle()
            try:
                items = parse_feed(self._fetch_fn(url))
            except Exception:
                continue
            for it in items[: self.per_feed_limit]:
                it["_kind"] = "press"
                it["_vendor"] = vendor
                yield it
        # 2) USASpending awards (public API)
        for kw in self.keywords:
            self._throttle()
            body = {
                "filters": {"keywords": [kw],
                            "award_type_codes": ["A", "B", "C", "D"]},
                "fields": ["Award ID", "Recipient Name", "Award Amount",
                           "Description", "Awarding Agency", "Start Date"],
                "page": 1, "limit": self.award_limit, "sort": "Award Amount",
                "order": "desc",
            }
            try:
                raw = self._post_fn(
                    "https://api.usaspending.gov/api/v2/search/spending_by_award/", body)
                results = json.loads(raw).get("results", [])
            except Exception:
                results = []
            for r in results:
                yield {"_kind": "award", "_kw": kw, "award": r}

    def parse(self, it: dict[str, Any]) -> dict[str, Any]:
        if it.get("_kind") == "award":
            a = it["award"]
            aid = a.get("Award ID") or a.get("generated_internal_id", "")
            return {
                "kind": "award", "kw": it.get("_kw", ""),
                "title": f"Federal award: {a.get('Recipient Name','?')} — {a.get('Awarding Agency','?')}",
                "link": f"https://www.usaspending.gov/award/{a.get('generated_internal_id', aid)}",
                "summary": (f"{a.get('Description','(no description)')} "
                            f"Amount: {a.get('Award Amount','?')}. "
                            f"Start: {a.get('Start Date','?')}."),
                "published": str(a.get("Start Date", "")),
                "id": str(aid),
            }
        return {
            "kind": "press", "vendor": it.get("_vendor", ""),
            "title": it.get("title", ""),
            "link": it.get("link", ""),
            "summary": it.get("summary", "")[:1200],
            "published": it.get("published", ""),
            "id": it.get("id", "") or it.get("link", ""),
        }

    def normalize(self, p: dict[str, Any]) -> IngestEvent:
        if p["kind"] == "award":
            detail = f"USASpending:{p['kw']}"
            lic = "us-gov-public-domain"
            title = p["title"]
        else:
            detail = f"press:{p['vendor']}"
            lic = "vendor-press-release"
            title = f"{p['vendor']}: {p['title']}"
        return make_event(
            source=self.source_id,
            source_detail=detail,
            timestamp=p["published"],
            title=title,
            url=p["link"],
            raw=p,
            parsed_summary=p["summary"],
            license=lic,
            identity_parts=[self.source_id, p["id"] or p["link"]],
        )
