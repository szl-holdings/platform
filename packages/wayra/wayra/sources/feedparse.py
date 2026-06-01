# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. Stdlib-only RSS/Atom feed parser.
"""
feedparse.py — minimal, dependency-free RSS 2.0 + Atom 1.0 parser.

WAYRA's RSS/Atom adapters (GitHub releases, arXiv, press releases, IETF, W3C) all
share this parser so there is one place that turns feed XML into a list of normalized
item dicts {title, link, summary, published, id}. Uses xml.etree (stdlib) only — no
feedparser pip dependency, so it runs in the slim a11oy image.
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from typing import Any

_ATOM = "{http://www.w3.org/2005/Atom}"


def _text(el: Any) -> str:
    if el is None:
        return ""
    return (el.text or "").strip()


def _strip_html(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"&lt;|&gt;|&amp;|&quot;|&#\d+;", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def parse_feed(xml_bytes: bytes | str) -> list[dict[str, str]]:
    """Parse RSS 2.0 or Atom 1.0 bytes into a list of item dicts.

    Returns [{title, link, summary, published, id}]. Robust to either format.
    """
    if isinstance(xml_bytes, bytes):
        xml_bytes = xml_bytes.decode("utf-8", errors="replace")
    # Strip a leading BOM / whitespace.
    xml_bytes = xml_bytes.lstrip("\ufeff \n\r\t")
    root = ET.fromstring(xml_bytes)
    items: list[dict[str, str]] = []

    # RSS 2.0: <rss><channel><item>...
    for item in root.iter("item"):
        title = _text(item.find("title"))
        link = _text(item.find("link"))
        desc = _strip_html(_text(item.find("description")))
        pub = _text(item.find("pubDate"))
        guid = _text(item.find("guid")) or link
        # Dublin-core creator (arXiv)
        creator = ""
        for child in item:
            if child.tag.endswith("creator"):
                creator = (child.text or "").strip()
            if child.tag.endswith("rights") and not creator:
                pass
        items.append({"title": title, "link": link, "summary": desc,
                      "published": pub, "id": guid, "creator": creator})

    # Atom 1.0: <feed><entry>...
    for entry in root.iter(f"{_ATOM}entry"):
        title = _text(entry.find(f"{_ATOM}title"))
        link = ""
        for lk in entry.findall(f"{_ATOM}link"):
            if lk.get("rel") in (None, "alternate"):
                link = lk.get("href", "") or link
        summary = _strip_html(
            _text(entry.find(f"{_ATOM}summary")) or _text(entry.find(f"{_ATOM}content")))
        pub = _text(entry.find(f"{_ATOM}updated")) or _text(entry.find(f"{_ATOM}published"))
        eid = _text(entry.find(f"{_ATOM}id")) or link
        items.append({"title": title, "link": link, "summary": summary,
                      "published": pub, "id": eid, "creator": ""})

    return items
