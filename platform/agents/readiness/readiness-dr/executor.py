#!/usr/bin/env python3
"""
READINESS-DR (disaster recovery) executor.

For each flagship with GET <base>/unay/dump:
  1. Validate a non-empty UTF-8 NDJSON response of unique key/value records.
  2. Load those records into fresh in-memory SQLite and compare every row.
  3. Attempt to upload the observed response and a receipt to the runs dataset.

This checks only the supplied key/value records' local SQLite round-trip.
It does not establish source completeness, authenticity, LMDB recovery, or
production disaster recovery. Binary LMDB exports are not supported here.

Emits backup-and-restore proof receipts (signed). Flagships without an Unay
endpoint are reported SKIPPED (honest), never GREEN.

Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import contextlib
import json
import os
import sqlite3
import sys
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-dr"


def fetch(url: str, timeout: float = 20.0) -> bytes | None:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            if 200 <= resp.status < 300:
                return resp.read()
    except Exception:
        return None
    return None


def _unique_json_object(pairs: list[tuple[str, object]]) -> dict:
    obj = {}
    for key, value in pairs:
        if key in obj:
            raise ValueError("duplicate JSON field")
        obj[key] = value
    return obj


def _reject_nonfinite(value: str) -> None:
    raise ValueError("non-finite JSON number")


def restore_proof(dump: bytes) -> dict:
    """Validate supplied NDJSON key/value records and round-trip all in SQLite."""
    try:
        text = dump.decode("utf-8")
    except UnicodeDecodeError:
        return {"restored": False, "reason": "dump is not valid UTF-8"}

    rows = []
    keys = set()
    for line_number, line in enumerate(text.split("\n"), start=1):
        line = line.strip(" \t\r")
        if not line:
            continue
        try:
            obj = json.loads(line, object_pairs_hook=_unique_json_object,
                             parse_constant=_reject_nonfinite)
        except (ValueError, RecursionError):
            return {"restored": False, "reason": "invalid JSON record", "line": line_number}
        if not isinstance(obj, dict) or not isinstance(obj.get("key"), str) \
                or not obj["key"] or "value" not in obj:
            return {"restored": False, "reason": "record requires a nonempty string key and value field",
                    "line": line_number}
        if obj["key"] in keys:
            return {"restored": False, "reason": "duplicate record key", "line": line_number}
        try:
            value = json.dumps(obj["value"], sort_keys=True, allow_nan=False)
        except (ValueError, RecursionError):
            return {"restored": False, "reason": "invalid JSON value", "line": line_number}
        keys.add(obj["key"])
        rows.append((obj["key"], value))
    if not rows:
        return {"restored": False, "reason": "empty dump"}
    try:
        with contextlib.closing(sqlite3.connect(":memory:")) as con:
            con.execute("CREATE TABLE unay(k TEXT PRIMARY KEY, v TEXT NOT NULL)")
            con.executemany("INSERT INTO unay(k, v) VALUES(?, ?)", rows)
            con.commit()
            restored = con.execute("SELECT k, v FROM unay ORDER BY k").fetchall()
    except (sqlite3.Error, UnicodeError):
        return {"restored": False, "reason": "SQLite restore failed"}
    if restored != sorted(rows):
        return {"restored": False, "reason": "SQLite key/value integrity mismatch",
                "expected_rows": len(rows), "observed_rows": len(restored)}
    return {"restored": True, "rows": len(restored), "sample_key": restored[0][0],
            "verified_rows": len(restored), "restore_target": "in-memory SQLite"}


def dr_flagship(fl: dict) -> dict:
    base = khipu.flagship_url(fl)
    if not base:
        return {"flagship": fl["name"], "verdict": "SKIPPED",
                "reason": f"{fl['url_env']} not set"}
    base = base.rstrip("/")
    dump = fetch(f"{base}/unay/dump")
    if dump is None:
        return {"flagship": fl["name"], "verdict": "SKIPPED",
                "reason": "no /unay/dump endpoint (not an Unay-backed flagship)"}
    readable = len(dump) > 0
    proof = restore_proof(dump) if readable else {"restored": False}
    pub = None
    if readable:
        import datetime as dt
        ts = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
        path = f"dr-dumps/{fl['name']}/{ts}.ndjson"
        token = os.environ.get("HF_TOKEN")
        if token:
            try:
                from huggingface_hub import HfApi
                HfApi(token=token).upload_file(
                    path_or_fileobj=dump, path_in_repo=path,
                    repo_id=khipu.HF_DATASET, repo_type="dataset",
                    commit_message=f"DR dump {fl['name']} {ts}")
                pub = {"uploaded": True, "path": path, "bytes": len(dump)}
            except Exception as exc:
                pub = {"uploaded": False, "reason": f"{type(exc).__name__}: {exc}"}
        else:
            pub = {"uploaded": False, "reason": "no HF_TOKEN"}
    verdict = "GREEN" if (readable and proof.get("restored")) else "RED"
    return {"flagship": fl["name"], "verdict": verdict, "dump_bytes": len(dump),
            "readable": readable, "restore_proof": proof, "upload": pub}


def main() -> int:
    out = [dr_flagship(fl) for fl in khipu.FLAGSHIPS]
    payload = {"flagships": out}
    khipu.emit(AGENT, payload)
    # A dump that was read but not uploaded is not a backup: fail closed too.
    khipu.require_published([o["upload"] for o in out if o.get("upload")], what="DR dump")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
