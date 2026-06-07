# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS on-disk persistence
"""
store.py — on-disk append-only persistence for the Khipu DAG.

Backend selection (honest, per directive: "LMDB via lmdb-python; fallback SQLite"):
  · If `lmdb` is importable -> LMDBStore (memory-mapped key/value, one append-only env).
  · Else                     -> SQLiteStore (WAL-mode, one append-only table).
Both expose the SAME interface:
    put(receipt_id, blob)     append-only write (raises on overwrite attempt)
    get(receipt_id) -> blob
    keys() -> List[str]       insertion order preserved (the append log)
    count() -> int
    move_to_cold(receipt_id)  hot->cold projection (INV-APPEND: never deletes bytes)
    cold_keys() -> List[str]
    close()

The store is the durable substrate; KhipuDAG keeps an in-RAM index for O(1) Merkle/verify
and persists every receipt's signed bytes here so a restart replays the exact chain.
NO mysticism — this is a boring, correct append log.
"""
from __future__ import annotations

import json
import os
import sqlite3
import time
from typing import List, Optional

try:
    import lmdb  # type: ignore
    _HAVE_LMDB = True
except Exception:
    _HAVE_LMDB = False


def open_store(path: str, prefer: str = "auto"):
    """Open the best available on-disk store. `prefer` in {auto, lmdb, sqlite}."""
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    if prefer == "sqlite" or (prefer == "auto" and not _HAVE_LMDB):
        return SQLiteStore(path)
    if prefer == "lmdb" and not _HAVE_LMDB:
        raise RuntimeError("lmdb requested but lmdb-python not installed")
    return LMDBStore(path)


class _BaseStore:
    backend = "base"

    def put(self, receipt_id: str, blob: bytes, cold: bool = False) -> None: ...
    def get(self, receipt_id: str) -> Optional[bytes]: ...
    def keys(self) -> List[str]: ...
    def cold_keys(self) -> List[str]: ...
    def count(self) -> int: ...
    def move_to_cold(self, receipt_id: str) -> None: ...
    def close(self) -> None: ...


class SQLiteStore(_BaseStore):
    """WAL-mode SQLite append log. Two flags column for hot/cold; bytes are never
    deleted (move_to_cold flips the flag only) -> INV-APPEND on disk."""
    backend = "sqlite"

    def __init__(self, path: str):
        self.path = path if path.endswith(".db") else path + ".sqlite"
        self.conn = sqlite3.connect(self.path)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA synchronous=NORMAL")
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS receipts ("
            " seq INTEGER PRIMARY KEY AUTOINCREMENT,"
            " rid TEXT UNIQUE NOT NULL,"
            " blob BLOB NOT NULL,"
            " cold INTEGER NOT NULL DEFAULT 0,"
            " ts REAL NOT NULL)")
        self.conn.commit()

    def put(self, receipt_id: str, blob: bytes, cold: bool = False) -> None:
        try:
            self.conn.execute(
                "INSERT INTO receipts (rid, blob, cold, ts) VALUES (?,?,?,?)",
                (receipt_id, blob, 1 if cold else 0, time.time()))
            self.conn.commit()
        except sqlite3.IntegrityError:
            raise ValueError(f"append-only violation: {receipt_id} already exists")

    def get(self, receipt_id: str) -> Optional[bytes]:
        row = self.conn.execute(
            "SELECT blob FROM receipts WHERE rid=?", (receipt_id,)).fetchone()
        return None if row is None else bytes(row[0])

    def keys(self) -> List[str]:
        return [r[0] for r in self.conn.execute(
            "SELECT rid FROM receipts WHERE cold=0 ORDER BY seq").fetchall()]

    def cold_keys(self) -> List[str]:
        return [r[0] for r in self.conn.execute(
            "SELECT rid FROM receipts WHERE cold=1 ORDER BY seq").fetchall()]

    def count(self) -> int:
        return self.conn.execute(
            "SELECT COUNT(*) FROM receipts WHERE cold=0").fetchone()[0]

    def move_to_cold(self, receipt_id: str) -> None:
        self.conn.execute("UPDATE receipts SET cold=1 WHERE rid=?", (receipt_id,))
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()


class LMDBStore(_BaseStore):
    """LMDB memory-mapped append log (used only when lmdb-python is installed).
    Two sub-dbs: `hot` and `cold`; keys are receipt ids, values are signed bytes.
    Insertion order is tracked in a separate ordered key (seq-prefixed)."""
    backend = "lmdb"

    def __init__(self, path: str, map_size: int = 1 << 30):
        self.env = lmdb.open(path, max_dbs=4, map_size=map_size)
        self.hotdb = self.env.open_db(b"hot")
        self.colddb = self.env.open_db(b"cold")
        self.orderdb = self.env.open_db(b"order")
        with self.env.begin(write=False) as txn:
            self._seq = txn.stat(self.orderdb)["entries"]

    def put(self, receipt_id: str, blob: bytes, cold: bool = False) -> None:
        with self.env.begin(write=True) as txn:
            db = self.colddb if cold else self.hotdb
            if txn.get(receipt_id.encode(), db=db) is not None:
                raise ValueError(f"append-only violation: {receipt_id} already exists")
            txn.put(receipt_id.encode(), blob, db=db)
            txn.put(f"{self._seq:020d}".encode(), receipt_id.encode(), db=self.orderdb)
            self._seq += 1

    def get(self, receipt_id: str) -> Optional[bytes]:
        with self.env.begin(write=False) as txn:
            v = txn.get(receipt_id.encode(), db=self.hotdb)
            if v is None:
                v = txn.get(receipt_id.encode(), db=self.colddb)
            return None if v is None else bytes(v)

    def _ordered_ids(self) -> List[str]:
        out = []
        with self.env.begin(write=False) as txn:
            cur = txn.cursor(db=self.orderdb)
            for _, rid in cur:
                out.append(rid.decode())
        return out

    def keys(self) -> List[str]:
        with self.env.begin(write=False) as txn:
            return [rid for rid in self._ordered_ids()
                    if txn.get(rid.encode(), db=self.hotdb) is not None]

    def cold_keys(self) -> List[str]:
        with self.env.begin(write=False) as txn:
            return [rid for rid in self._ordered_ids()
                    if txn.get(rid.encode(), db=self.colddb) is not None]

    def count(self) -> int:
        with self.env.begin(write=False) as txn:
            return txn.stat(self.hotdb)["entries"]

    def move_to_cold(self, receipt_id: str) -> None:
        with self.env.begin(write=True) as txn:
            v = txn.get(receipt_id.encode(), db=self.hotdb)
            if v is not None:
                txn.put(receipt_id.encode(), v, db=self.colddb)
                txn.delete(receipt_id.encode(), db=self.hotdb)

    def close(self) -> None:
        self.env.close()
