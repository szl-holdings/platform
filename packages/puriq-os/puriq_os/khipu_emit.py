# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
khipu_emit.py — Khipu receipt emission + sqlite hash-chain ledger.

Every autonomous tick MUST emit exactly one Khipu receipt (PURIQ-OS hard rule). A
receipt is a DSSE-style envelope (in-toto Statement payload + signature) committed to a
sqlite-backed hash chain: each receipt carries prev_hash -> a verifiable linear chain.

HONEST signing: we compute the DSSE PAE (pre-authentication encoding) and HMAC-SHA256
it with a local keyref. This is NOT a cryptographic identity — it is labelled
"PLACEHOLDER-HMAC" so no verifier mistakes it for a Fulcio/cosign cert. In production
this slot is replaced by `cosign sign-blob` (Sigstore, SLSA L1). `verify_chain` checks
the HASH CHAIN (INV-3), which is what `Khipu_i(a)` verifies until real signing lands.

Open-source / stdlib only: sqlite3, hashlib, hmac, json, base64.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import sqlite3
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DSSE_PAYLOAD_TYPE = "application/vnd.in-toto+json"
SIG_KEYID = "PLACEHOLDER-HMAC"  # honest: NOT a Fulcio/cosign identity
GENESIS_PREV = "0" * 64


def _pae(payload_type: str, payload: bytes) -> bytes:
    """DSSE Pre-Authentication Encoding (in-toto/ITE-5)."""
    return b"DSSEv1 %d %s %d %s" % (
        len(payload_type), payload_type.encode(), len(payload), payload,
    )


def _sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


@dataclass
class KhipuReceipt:
    """One receipt = one autonomous tick. Hash-chained via prev_hash."""
    organ: str
    tick: int
    action: str
    decision_value: float          # U(a|x) at decision time
    yuyay_value: float             # Yuyay_13(a)
    hukulla_clear: bool            # tripwires all clear at decision time
    payload: Dict[str, Any] = field(default_factory=dict)
    ts: float = field(default_factory=time.time)
    prev_hash: str = GENESIS_PREV
    payload_type: str = DSSE_PAYLOAD_TYPE
    # populated by sign()
    receipt_hash: str = ""
    signature_b64: str = ""
    keyid: str = SIG_KEYID

    def statement(self) -> Dict[str, Any]:
        """in-toto Statement (predicateType = puriq-os agentic tick)."""
        return {
            "_type": "https://in-toto.io/Statement/v1",
            "predicateType": "https://szlholdings.dev/puriq-os/agentic-tick/v1",
            "subject": [{
                "name": f"{self.organ}#tick-{self.tick}",
                "digest": {"sha256": _sha256_hex(
                    json.dumps(self.payload, sort_keys=True).encode())},
            }],
            "predicate": {
                "organ": self.organ,
                "tick": self.tick,
                "action": self.action,
                "decision_value": self.decision_value,
                "yuyay_value": self.yuyay_value,
                "hukulla_clear": self.hukulla_clear,
                "ts": self.ts,
                "prev_hash": self.prev_hash,
                "doctrine_layer": "PURIQ-OS",
            },
        }

    def canonical_payload(self) -> bytes:
        return json.dumps(self.statement(), sort_keys=True, separators=(",", ":")).encode()


class KhipuLedger:
    """DSSE-shaped signer + sqlite hash-chain ledger. One ledger per runtime; organs
    share it so the chain is global and forks are detectable (INV-3)."""

    def __init__(self, db_path: str = ":memory:", hmac_key: bytes = b"puriq-os-local"):
        import threading
        self._key = hmac_key
        self._lock = threading.Lock()
        # check_same_thread=False + a lock: safe for FastAPI's threadpool handlers.
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS khipu (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                organ TEXT, tick INTEGER, action TEXT,
                decision_value REAL, yuyay_value REAL, hukulla_clear INTEGER,
                ts REAL, prev_hash TEXT, receipt_hash TEXT,
                signature_b64 TEXT, keyid TEXT, statement TEXT
            )""")
        self._conn.commit()

    # ---- chain head -------------------------------------------------------
    def head_hash(self) -> str:
        row = self._conn.execute(
            "SELECT receipt_hash FROM khipu ORDER BY id DESC LIMIT 1").fetchone()
        return row[0] if row else GENESIS_PREV

    # ---- signing ----------------------------------------------------------
    def _sign(self, receipt: KhipuReceipt) -> Tuple[str, str]:
        payload = receipt.canonical_payload()
        pae = _pae(receipt.payload_type, payload)
        # receipt_hash binds prev_hash + payload -> the chain link
        chain_input = receipt.prev_hash.encode() + b"|" + payload
        receipt_hash = _sha256_hex(chain_input)
        sig = hmac.new(self._key, pae, hashlib.sha256).digest()
        return receipt_hash, base64.b64encode(sig).decode()

    def emit(self, receipt: KhipuReceipt) -> KhipuReceipt:
        """Sign + append exactly one receipt; chain it to the current head (INV-3)."""
        with self._lock:
            return self._emit_locked(receipt)

    def _emit_locked(self, receipt: KhipuReceipt) -> KhipuReceipt:
        receipt.prev_hash = self.head_hash()
        receipt.receipt_hash, receipt.signature_b64 = self._sign(receipt)
        self._conn.execute(
            "INSERT INTO khipu (organ,tick,action,decision_value,yuyay_value,"
            "hukulla_clear,ts,prev_hash,receipt_hash,signature_b64,keyid,statement) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (receipt.organ, receipt.tick, receipt.action, receipt.decision_value,
             receipt.yuyay_value, int(receipt.hukulla_clear), receipt.ts,
             receipt.prev_hash, receipt.receipt_hash, receipt.signature_b64,
             receipt.keyid, json.dumps(receipt.statement(), sort_keys=True)))
        self._conn.commit()
        return receipt

    # ---- verification -----------------------------------------------------
    def count(self) -> int:
        return self._conn.execute("SELECT COUNT(*) FROM khipu").fetchone()[0]

    def all_receipts(self) -> List[sqlite3.Row]:
        self._conn.row_factory = sqlite3.Row
        return self._conn.execute("SELECT * FROM khipu ORDER BY id ASC").fetchall()

    def recent(self, organ: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        self._conn.row_factory = sqlite3.Row
        if organ:
            rows = self._conn.execute(
                "SELECT * FROM khipu WHERE organ=? ORDER BY id DESC LIMIT ?",
                (organ, limit)).fetchall()
        else:
            rows = self._conn.execute(
                "SELECT * FROM khipu ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]

    def verify_chain(self) -> bool:
        """INV-3: each receipt_hash must equal sha256(prev_hash | payload), and each
        receipt's prev_hash must equal the previous receipt's receipt_hash."""
        self._conn.row_factory = sqlite3.Row
        rows = self._conn.execute(
            "SELECT prev_hash,receipt_hash,statement FROM khipu ORDER BY id ASC"
        ).fetchall()
        expected_prev = GENESIS_PREV
        for r in rows:
            if r["prev_hash"] != expected_prev:
                return False
            stmt = json.loads(r["statement"])
            payload = json.dumps(stmt, sort_keys=True, separators=(",", ":")).encode()
            recomputed = _sha256_hex(r["prev_hash"].encode() + b"|" + payload)
            if recomputed != r["receipt_hash"]:
                return False
            expected_prev = r["receipt_hash"]
        return True
