"""Qullqa's offline Python-first port of the legacy health_checks seam.

Only synthetic SQLite fixtures are supported. No connection to production
PostgreSQL, no Drizzle migration authority and no deployment are provided.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import sqlite3
import tempfile
from collections.abc import Callable, Iterator
from contextlib import closing, contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

CONTRACT = "szl.qullqa.health-checks.python-candidate.v1"
STATES = frozenset({"healthy", "degraded", "down"})
SOURCE_FIELDS = (
    "id: serial('id')",
    "service: text('service')",
    "status: text('status'",
    "responseTimeMs: integer('response_time_ms')",
    "details: jsonb('details')",
    "checkedAt: timestamp('checked_at')",
)
MARKER = "QULLQA_SQLITE_SYNTHETIC_V1"
MAX_SYNTHETIC_ROWS_FOR_BACKUP = 10_000


class HoldError(RuntimeError):
    """A missing/unqualified source must not produce a green readiness state."""


def source_fingerprint(schema_file: Path) -> dict[str, Any]:
    """Bind the candidate to recognizable source text; not a TS semantic proof."""
    raw = Path(schema_file).read_bytes()
    try:
        source = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HoldError("SCHEMA_NOT_UTF8") from exc
    if not re.search(
        r"\bhealthChecksTable\s*=\s*pgTable\(\s*['\"]health_checks['\"]", source
    ):
        raise HoldError("SCHEMA_TABLE_SIGNATURE_MISSING")
    if any(field not in source for field in SOURCE_FIELDS):
        raise HoldError("SCHEMA_COLUMN_SIGNATURE_MISMATCH")
    return {
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "table": "health_checks",
        "contract": CONTRACT,
        "verification": "STATIC_SOURCE_PATTERN_ONLY",
        "actual_database_schema_verified": False,
    }


def _reserve_new(path: Path) -> None:
    path = Path(path)
    if path.is_symlink():
        raise HoldError("REFUSE_SYMLINK_DESTINATION")
    path.parent.mkdir(parents=True, exist_ok=True)
    # Windows may raise PermissionError, not FileExistsError, for a directory.
    if path.exists():
        raise HoldError("DESTINATION_ALREADY_EXISTS")
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY
    try:
        fd = os.open(path, flags, 0o600)
    except FileExistsError as exc:
        raise HoldError("DESTINATION_ALREADY_EXISTS") from exc
    except OSError as exc:
        raise HoldError("DESTINATION_CREATE_FAILED") from exc
    else:
        os.close(fd)


@contextmanager
def _open_readonly(path: Path) -> Iterator[sqlite3.Connection]:
    path = Path(path)
    if path.is_symlink() or not path.is_file():
        raise HoldError("SYNTHETIC_DB_UNAVAILABLE")
    # Absolute file URI, never a DB connection string from environment.
    from urllib.parse import quote

    uri = "file:" + quote(path.resolve().as_posix(), safe="/:") + "?mode=ro"
    db = sqlite3.connect(uri, uri=True)
    try:
        try:
            if db.execute("PRAGMA quick_check").fetchone() != ("ok",):
                raise HoldError("SYNTHETIC_DB_INTEGRITY_FAIL")
            marker = db.execute("SELECT marker FROM qullqa_identity LIMIT 1").fetchone()
            if marker != (MARKER,):
                raise HoldError("NOT_A_QULLQA_SYNTHETIC_DB")
        except sqlite3.DatabaseError as exc:
            raise HoldError("SYNTHETIC_DB_SCHEMA_INVALID") from exc
        yield db
    finally:
        db.close()


def create_demo(path: Path) -> None:
    """Initialize an exclusively new demo DB. Never opens an existing DB for writes."""
    path = Path(path)
    _reserve_new(path)
    try:
        with closing(sqlite3.connect(path)) as db, db:
            db.execute("CREATE TABLE qullqa_identity (marker TEXT NOT NULL)")
            db.execute("INSERT INTO qullqa_identity VALUES (?)", (MARKER,))
            db.execute(
                """CREATE TABLE health_checks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    service TEXT NOT NULL,
                    status TEXT NOT NULL CHECK(status IN ('healthy','degraded','down')),
                    response_time_ms INTEGER,
                    checked_at TEXT NOT NULL
                )"""
            )
    except BaseException:
        path.unlink(missing_ok=True)
        raise


def record_synthetic(
    path: Path, *, service: str, status: str, response_time_ms: int | None = None
) -> None:
    """Write only explicit synthetic test observations, never customer or production data."""
    if (
        not isinstance(service, str)
        or not 1 <= len(service) <= 96
        or not service.isascii()
    ):
        raise ValueError("INVALID_SYNTHETIC_SERVICE")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", service):
        raise ValueError("INVALID_SYNTHETIC_SERVICE")
    if status not in STATES:
        raise ValueError("INVALID_SYNTHETIC_STATUS")
    if response_time_ms is not None and (
        not isinstance(response_time_ms, int)
        or isinstance(response_time_ms, bool)
        or not 0 <= response_time_ms <= 600_000
    ):
        raise ValueError("INVALID_SYNTHETIC_LATENCY")
    db_path = Path(path)
    if db_path.is_symlink() or not db_path.is_file():
        raise HoldError("SYNTHETIC_DB_UNAVAILABLE")
    from urllib.parse import quote

    uri = "file:" + quote(db_path.resolve().as_posix(), safe="/:") + "?mode=rw"
    try:
        with closing(sqlite3.connect(uri, uri=True, timeout=2)) as db, db:
            # Marker verification and insertion share one transaction.
            db.execute("BEGIN IMMEDIATE")
            marker = db.execute("SELECT marker FROM qullqa_identity LIMIT 1").fetchone()
            if marker != (MARKER,):
                raise HoldError("NOT_A_QULLQA_SYNTHETIC_DB")
            db.execute(
                "INSERT INTO health_checks (service,status,response_time_ms,checked_at) "
                "VALUES (?,?,?,?)",
                (
                    service,
                    status,
                    response_time_ms,
                    datetime.now(UTC).isoformat(timespec="seconds"),
                ),
            )
    except sqlite3.DatabaseError as exc:
        raise HoldError("SYNTHETIC_DB_SCHEMA_INVALID") from exc


def read_synthetic(path: Path, limit: int = 25) -> list[dict[str, Any]]:
    if type(limit) is not int or not 1 <= limit <= 100:
        raise ValueError("INVALID_LIMIT")
    with _open_readonly(path) as db:
        rows = db.execute(
            "SELECT id,service,status,response_time_ms,checked_at "
            "FROM health_checks ORDER BY id LIMIT ?",
            (limit,),
        ).fetchall()
    return [
        {
            "id": item[0],
            "service": item[1],
            "source_reported_status": item[2],
            "response_time_ms": item[3],
            "source_reported_at": item[4],
            "independently_measured": False,
        }
        for item in rows
    ]


def _row_digest(path: Path) -> str:
    with _open_readonly(path) as db:
        data = db.execute(
            "SELECT id,service,status,response_time_ms,checked_at "
            "FROM health_checks ORDER BY id LIMIT ?",
            (MAX_SYNTHETIC_ROWS_FOR_BACKUP + 1,),
        ).fetchall()
    if len(data) > MAX_SYNTHETIC_ROWS_FOR_BACKUP:
        raise HoldError("SYNTHETIC_DB_ROW_LIMIT")
    return hashlib.sha256(
        json.dumps(data, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    ).hexdigest()


def backup_and_verify_synthetic(
    source: Path, backup: Path, restored: Path
) -> dict[str, Any]:
    """Snapshot and restore two new demo files, checking full row digest and integrity."""
    expected = _row_digest(source)
    _reserve_new(backup)
    try:
        with _open_readonly(source) as src, closing(sqlite3.connect(backup)) as dest:
            src.backup(dest)
        if _row_digest(backup) != expected:
            raise HoldError("BACKUP_ROW_DIGEST_MISMATCH")
        _reserve_new(restored)
        with _open_readonly(backup) as src, closing(sqlite3.connect(restored)) as dest:
            src.backup(dest)
        if _row_digest(restored) != expected:
            raise HoldError("RESTORE_ROW_DIGEST_MISMATCH")
    except BaseException:
        # Do not delete an existing caller-owned destination. Only our backup
        # reservation is removed; restored remains as forensic evidence.
        backup.unlink(missing_ok=True)
        raise
    return {
        "scope": "LOCAL_SYNTHETIC_SQLITE_ONLY",
        "row_sha256": expected,
        "backup_file_sha256": hashlib.sha256(backup.read_bytes()).hexdigest(),
        "restore_verified": True,
        "postgres_restore_verified": False,
        "production_ready": False,
    }


class CandidateApp:
    """Read-only WSGI demo. A configured local token is required to reveal demo rows."""

    def __init__(self, store: Path | None = None, *, token: str | None = None):
        if token is not None and (not isinstance(token, str) or len(token) > 256):
            raise ValueError("INVALID_SYNTHETIC_TOKEN")
        self.store = Path(store) if store is not None else None
        self.token = token if token else None

    def __call__(
        self,
        environ: dict[str, Any],
        start_response: Callable[[str, list[tuple[str, str]]], Any],
    ) -> list[bytes]:
        method = environ.get("REQUEST_METHOD")
        route = environ.get("PATH_INFO")
        status = "404 Not Found"
        data: dict[str, Any] = {"reason": "ROUTE_NOT_FOUND", "production_ready": False}
        if method != "GET":
            status = "405 Method Not Allowed"
            data["reason"] = "READ_ONLY_GET_ONLY"
        elif route == "/healthz":
            status = "200 OK"
            data = {
                "process_live": True,
                "backend": "SYNTHETIC_SQLITE_CANDIDATE",
                "production_ready": False,
            }
        elif route == "/readyz":
            status = "503 Service Unavailable"
            data = {"ready": False, "reason": "PRODUCTION_POSTGRES_UNVERIFIED"}
        elif route == "/api/qullqa/v1/health-checks":
            if self.token is None:
                status = "503 Service Unavailable"
                data = {"reason": "READ_AUTH_UNCONFIGURED", "rows": None}
            elif (
                not isinstance(environ.get("HTTP_AUTHORIZATION"), str)
                or len(environ["HTTP_AUTHORIZATION"]) > 512
                or not hmac.compare_digest(
                    environ["HTTP_AUTHORIZATION"], "Bearer " + self.token
                )
            ):
                status = "403 Forbidden"
                data = {"reason": "DENIED", "rows": None}
            elif self.store is None:
                status = "503 Service Unavailable"
                data = {"reason": "SYNTHETIC_STORE_UNAVAILABLE", "rows": None}
            else:
                try:
                    records = read_synthetic(self.store)
                except (HoldError, sqlite3.DatabaseError):
                    status = "503 Service Unavailable"
                    data = {"reason": "SYNTHETIC_STORE_UNAVAILABLE", "rows": None}
                else:
                    status = "200 OK"
                    data = {
                        "origin": "LOCAL_SYNTHETIC_ONLY",
                        "production_ready": False,
                        "rows": records,
                    }
        body = json.dumps(data, sort_keys=True).encode("utf-8")
        start_response(
            status,
            [
                ("Content-Type", "application/json"),
                ("Cache-Control", "no-store"),
                ("X-Content-Type-Options", "nosniff"),
                ("Content-Length", str(len(body))),
            ],
        )
        return [body]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Qullqa Python candidate — offline only"
    )
    parser.add_argument("--schema", type=Path, required=True)
    parser.add_argument("--synthetic-restore-drill", action="store_true")
    args = parser.parse_args()
    try:
        source = source_fingerprint(args.schema)
        report: dict[str, Any] = {
            **source,
            "runtime_database": None,
            "postgres_backup": None,
            "production_ready": False,
        }
        if args.synthetic_restore_drill:
            with tempfile.TemporaryDirectory(prefix="qullqa-health-") as tmp:
                base = Path(tmp)
                create_demo(base / "source.sqlite")
                record_synthetic(
                    base / "source.sqlite", service="local-probe", status="degraded"
                )
                report["demo_restore"] = backup_and_verify_synthetic(
                    base / "source.sqlite",
                    base / "backup.sqlite",
                    base / "restored.sqlite",
                )
        print(json.dumps(report, sort_keys=True))
        return 0
    except (HoldError, OSError) as exc:
        print(
            json.dumps(
                {"status": "HOLD", "reason": str(exc), "production_ready": False}
            )
        )
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
