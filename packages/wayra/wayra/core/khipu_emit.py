# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. Khipu receipt emission + SQLite ingest log.
"""
khipu_emit.py — WAYRA's append-only, hash-chained Khipu receipt store backed by
SQLite, plus the IngestLog that holds the canonical events.

Every ingested event (accept / review / drop) emits a Khipu receipt — HARD RULE.
The receipt is an append-only SHA3-256 hash-chained record: each links to the prior
receipt's digest, so the chain is tamper-evident by additive arithmetic alone
(mirrors the v11 YAWAR ledger + `khipuReceipt_checksum_invariant`, and the v13
edge-organ szl_khipu.py KhipuDAG discipline).

Honest label (Doctrine v12 §2): the receipt SIGNATURE is DSSE PLACEHOLDER (Sigstore
not wired). This store verifies the HASH CHAIN, not a cryptographic signature.

Storage (Doctrine WAYRA §Architecture): SQLite for the ingest log — 60-day hot,
1-year warm, then archive to an HF dataset. SQLite is stdlib (no new pip install) and
gives durable WHERE/ORDER queries the in-memory KhipuDAG lacked (that durability gap
was explicitly WASI-RIKUQ's P1 concern in the v13 edge-organ store).
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any, Iterable

from .normalize import IngestEvent

_GENESIS = "0" * 64


def _digest(obj: Any) -> str:
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    return hashlib.sha3_256(raw).hexdigest()


class IngestLog:
    """SQLite-backed ingest log + chained Khipu receipt store for WAYRA.

    Two tables:
      events   — one row per IngestEvent (dedup on content_hash)
      receipts — append-only hash-chained Khipu receipts (organ='wayra')
    """

    def __init__(self, db_path: str | Path = "data/wayra_ingest.db") -> None:
        self.db_path = str(db_path)
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        with self._conn:
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS events (
                    content_hash   TEXT PRIMARY KEY,
                    source         TEXT NOT NULL,
                    source_detail  TEXT,
                    timestamp      TEXT,
                    ingested_at    TEXT,
                    title          TEXT,
                    url            TEXT,
                    license        TEXT,
                    parsed_summary TEXT,
                    yuyay_score    REAL,
                    novelty_score  REAL,
                    wayra_factor   REAL,
                    decision       TEXT,
                    organ_routing  TEXT,
                    raw            TEXT
                )
                """
            )
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS receipts (
                    seq             INTEGER PRIMARY KEY,
                    organ           TEXT NOT NULL,
                    ns              TEXT NOT NULL,
                    action          TEXT NOT NULL,
                    content_hash    TEXT,
                    payload_digest  TEXT NOT NULL,
                    ts              REAL NOT NULL,
                    prev            TEXT NOT NULL,
                    digest          TEXT NOT NULL,
                    signature       TEXT NOT NULL,
                    chain_verified  INTEGER NOT NULL
                )
                """
            )
            self._conn.execute("CREATE INDEX IF NOT EXISTS idx_events_source ON events(source)")
            self._conn.execute("CREATE INDEX IF NOT EXISTS idx_events_decision ON events(decision)")

    # ----- dedup helpers -----
    def known_hashes(self) -> set[str]:
        with self._lock:
            rows = self._conn.execute("SELECT content_hash FROM events").fetchall()
        return {r["content_hash"] for r in rows}

    def known_titles(self, source: str | None = None, limit: int = 2000) -> set[str]:
        with self._lock:
            if source:
                rows = self._conn.execute(
                    "SELECT title FROM events WHERE source=? ORDER BY ingested_at DESC LIMIT ?",
                    (source, limit)).fetchall()
            else:
                rows = self._conn.execute(
                    "SELECT title FROM events ORDER BY ingested_at DESC LIMIT ?",
                    (limit,)).fetchall()
        return {r["title"] for r in rows if r["title"]}

    def has(self, content_hash: str) -> bool:
        with self._lock:
            row = self._conn.execute(
                "SELECT 1 FROM events WHERE content_hash=?", (content_hash,)).fetchone()
        return row is not None

    # ----- the load-bearing op: persist event + chain a Khipu receipt -----
    def emit(self, ev: IngestEvent, ns: str = "a11oy") -> dict[str, Any]:
        """Persist the event (idempotent on content_hash) and chain a Khipu receipt.

        Returns the receipt dict. Always emits a receipt — even for drops/duplicates —
        because the HARD RULE is: a Khipu receipt on every ingested event.
        """
        with self._lock:
            with self._conn:
                # Idempotent upsert of the event row.
                self._conn.execute(
                    """
                    INSERT INTO events (content_hash, source, source_detail, timestamp,
                        ingested_at, title, url, license, parsed_summary, yuyay_score,
                        novelty_score, wayra_factor, decision, organ_routing, raw)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    ON CONFLICT(content_hash) DO UPDATE SET
                        yuyay_score=excluded.yuyay_score,
                        novelty_score=excluded.novelty_score,
                        wayra_factor=excluded.wayra_factor,
                        decision=excluded.decision,
                        organ_routing=excluded.organ_routing
                    """,
                    (ev.content_hash, ev.source, ev.source_detail, ev.timestamp,
                     ev.ingested_at, ev.title, ev.url, ev.license, ev.parsed_summary,
                     ev.yuyay_score, ev.novelty_score, ev.wayra_factor, ev.decision,
                     json.dumps(ev.organ_routing), json.dumps(ev.raw)),
                )
                # Chain the receipt.
                row = self._conn.execute(
                    "SELECT digest FROM receipts ORDER BY seq DESC LIMIT 1").fetchone()
                prev = row["digest"] if row else _GENESIS
                seq_row = self._conn.execute("SELECT COUNT(*) AS c FROM receipts").fetchone()
                seq = seq_row["c"]
                body = {
                    "organ": "wayra",
                    "ns": ns,
                    "seq": seq,
                    "action": f"ingest:{ev.decision}",
                    "content_hash": ev.content_hash,
                    "payload_digest": _digest({
                        "source": ev.source, "url": ev.url,
                        "wayra_factor": ev.wayra_factor, "decision": ev.decision,
                        "routing": ev.organ_routing}),
                    "ts": time.time(),
                    "prev": prev,
                }
                digest = _digest(body)
                self._conn.execute(
                    """
                    INSERT INTO receipts (seq, organ, ns, action, content_hash,
                        payload_digest, ts, prev, digest, signature, chain_verified)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)
                    """,
                    (seq, body["organ"], body["ns"], body["action"], ev.content_hash,
                     body["payload_digest"], body["ts"], body["prev"], digest,
                     "DSSE_PLACEHOLDER", 1),
                )
                return {**body, "digest": digest, "signature": "DSSE_PLACEHOLDER",
                        "chain_verified": True}

    def verify_chain(self) -> dict[str, Any]:
        """Re-walk the receipt chain; return {ok, depth, broken_at, reason}."""
        with self._lock:
            rows = self._conn.execute(
                "SELECT * FROM receipts ORDER BY seq ASC").fetchall()
        prev = _GENESIS
        for i, r in enumerate(rows):
            body = {
                "organ": r["organ"], "ns": r["ns"], "seq": r["seq"],
                "action": r["action"], "content_hash": r["content_hash"],
                "payload_digest": r["payload_digest"], "ts": r["ts"], "prev": r["prev"],
            }
            if r["prev"] != prev:
                return {"ok": False, "depth": len(rows), "broken_at": i,
                        "reason": "prev-link mismatch"}
            if _digest(body) != r["digest"]:
                return {"ok": False, "depth": len(rows), "broken_at": i,
                        "reason": "digest mismatch"}
            prev = r["digest"]
        return {"ok": True, "depth": len(rows), "broken_at": None}

    # ----- read API (powers the a11oy /wayra tab) -----
    def count(self) -> int:
        with self._lock:
            return self._conn.execute("SELECT COUNT(*) AS c FROM events").fetchone()["c"]

    def receipt_depth(self) -> int:
        with self._lock:
            return self._conn.execute("SELECT COUNT(*) AS c FROM receipts").fetchone()["c"]

    def recent(self, n: int = 100, decision: str | None = None) -> list[dict[str, Any]]:
        with self._lock:
            if decision:
                rows = self._conn.execute(
                    "SELECT * FROM events WHERE decision=? ORDER BY ingested_at DESC LIMIT ?",
                    (decision, n)).fetchall()
            else:
                rows = self._conn.execute(
                    "SELECT * FROM events ORDER BY ingested_at DESC LIMIT ?", (n,)).fetchall()
        return [self._row_to_event_dict(r) for r in rows]

    def search(self, q: str, n: int = 100) -> list[dict[str, Any]]:
        like = f"%{q}%"
        with self._lock:
            rows = self._conn.execute(
                "SELECT * FROM events WHERE title LIKE ? OR parsed_summary LIKE ? "
                "OR source_detail LIKE ? ORDER BY ingested_at DESC LIMIT ?",
                (like, like, like, n)).fetchall()
        return [self._row_to_event_dict(r) for r in rows]

    def source_stats(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                """
                SELECT source,
                       COUNT(*) AS total,
                       MAX(ingested_at) AS last_fetch,
                       SUM(CASE WHEN decision='accept' THEN 1 ELSE 0 END) AS accepted,
                       SUM(CASE WHEN decision='review' THEN 1 ELSE 0 END) AS review,
                       SUM(CASE WHEN decision='drop' THEN 1 ELSE 0 END) AS dropped
                FROM events GROUP BY source ORDER BY total DESC
                """).fetchall()
        return [dict(r) for r in rows]

    def top_n(self, n: int = 5, decision: str = "accept") -> list[dict[str, Any]]:
        """Top-N by wayra_factor (for the daily digest)."""
        with self._lock:
            rows = self._conn.execute(
                "SELECT * FROM events WHERE decision=? ORDER BY wayra_factor DESC, "
                "ingested_at DESC LIMIT ?", (decision, n)).fetchall()
        return [self._row_to_event_dict(r) for r in rows]

    @staticmethod
    def _row_to_event_dict(r: sqlite3.Row) -> dict[str, Any]:
        d = dict(r)
        try:
            d["organ_routing"] = json.loads(d.get("organ_routing") or "[]")
        except Exception:
            d["organ_routing"] = []
        d.pop("raw", None)  # keep the read API light
        return d

    def close(self) -> None:
        with self._lock:
            self._conn.close()
