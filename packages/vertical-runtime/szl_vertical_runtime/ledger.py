"""Locally persisted, append-guarded hash-chain ledger for vertical cells."""

from __future__ import annotations

import sqlite3
import threading
import uuid
from pathlib import Path
from typing import Any, Iterable, Mapping

from .canonical import canonical_json, digest_value, loads_json, utc_now


GENESIS_HASH = "0" * 64
SCHEMA_VERSION = "szl.vertical-outcome-ledger/v1"
_INITIALIZATION_LOCKS: dict[str, threading.Lock] = {}
_INITIALIZATION_LOCKS_GUARD = threading.Lock()

LEDGER_SCHEMA_DEFINITIONS = (
    (
        "table",
        "ledger_meta",
        "ledger_meta",
        """CREATE TABLE ledger_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )""",
    ),
    (
        "table",
        "ledger_events",
        "ledger_events",
        """CREATE TABLE ledger_events (
            sequence INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL UNIQUE,
            occurred_at TEXT NOT NULL,
            event_type TEXT NOT NULL,
            vertical_id TEXT NOT NULL,
            subject_id TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            previous_hash TEXT NOT NULL CHECK(length(previous_hash) = 64),
            event_hash TEXT NOT NULL UNIQUE CHECK(length(event_hash) = 64)
        )""",
    ),
    (
        "index",
        "ledger_events_vertical",
        "ledger_events",
        """CREATE INDEX ledger_events_vertical
            ON ledger_events(vertical_id, sequence)""",
    ),
    (
        "index",
        "ledger_events_subject",
        "ledger_events",
        """CREATE INDEX ledger_events_subject
            ON ledger_events(subject_id, sequence)""",
    ),
    (
        "trigger",
        "ledger_events_no_update",
        "ledger_events",
        """CREATE TRIGGER ledger_events_no_update
            BEFORE UPDATE ON ledger_events
            BEGIN
                SELECT RAISE(ABORT, 'ledger is append-only');
            END""",
    ),
    (
        "trigger",
        "ledger_events_no_delete",
        "ledger_events",
        """CREATE TRIGGER ledger_events_no_delete
            BEFORE DELETE ON ledger_events
            BEGIN
                SELECT RAISE(ABORT, 'ledger is append-only');
            END""",
    ),
)


def _normalize_schema_sql(value: str | None) -> str:
    return " ".join((value or "").split())


def _initialization_lock(path: Path) -> threading.Lock:
    key = str(path.resolve(strict=False)).casefold()
    with _INITIALIZATION_LOCKS_GUARD:
        return _INITIALIZATION_LOCKS.setdefault(key, threading.Lock())


class LedgerError(RuntimeError):
    pass


class _ClosingConnection(sqlite3.Connection):
    """Commit or roll back like sqlite3, then release the Windows file handle."""

    def __exit__(self, exc_type: object, exc_value: object, traceback: object) -> bool:
        try:
            return bool(super().__exit__(exc_type, exc_value, traceback))
        finally:
            self.close()


class OutcomeLedger:
    """SQLite-backed ledger with update/delete guards and offline verification."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self._initialized = False
        self._initialization_lock = _initialization_lock(self.path)
        self._lock = threading.RLock()

    def _connect(self, *, readonly: bool = False) -> sqlite3.Connection:
        connection: sqlite3.Connection | None = None
        try:
            if readonly:
                uri = self.path.resolve().as_uri() + "?mode=ro"
                connection = sqlite3.connect(
                    uri, uri=True, timeout=10, factory=_ClosingConnection
                )
            else:
                self.path.parent.mkdir(parents=True, exist_ok=True)
                connection = sqlite3.connect(
                    self.path, timeout=10, factory=_ClosingConnection
                )
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA foreign_keys=ON")
            connection.execute("PRAGMA busy_timeout=10000")
            if readonly:
                connection.execute("PRAGMA query_only=ON")
            else:
                connection.execute("PRAGMA synchronous=FULL")
            return connection
        except BaseException:
            if connection is not None:
                connection.close()
            raise

    def initialize(self) -> None:
        with self._lock:
            if self._initialized:
                return
            with self._initialization_lock:
                if not self._initialized:
                    self._initialize_unlocked()
                    self._initialized = True

    def _initialize_unlocked(self) -> None:
        existed_with_bytes = self.path.exists() and self.path.stat().st_size > 0
        connection = self._initialization_connection()
        try:
            connection.execute("BEGIN EXCLUSIVE")
            tables = {
                row["name"]
                for row in connection.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ).fetchall()
            } - {"sqlite_sequence"}
            if tables:
                findings = self._schema_findings(connection)
                if findings:
                    raise LedgerError(
                        "existing ledger schema is invalid; refusing automatic repair: "
                        + "; ".join(findings)
                    )
                connection.commit()
                return
            if existed_with_bytes:
                raise LedgerError(
                    "existing nonempty database has no admitted ledger schema; refusing automatic repair"
                )

            for _, _, _, statement in LEDGER_SCHEMA_DEFINITIONS:
                connection.execute(statement)
            connection.executemany(
                "INSERT INTO ledger_meta(key, value) VALUES (?, ?)",
                (
                    ("schema", SCHEMA_VERSION),
                    ("head_hash", GENESIS_HASH),
                    ("event_count", "0"),
                ),
            )
            findings = self._schema_findings(connection)
            if findings:
                raise LedgerError(
                    "new ledger schema failed closed: " + "; ".join(findings)
                )
            connection.commit()
        except BaseException:
            if connection.in_transaction:
                connection.rollback()
            raise
        finally:
            connection.close()

    def _initialization_connection(self) -> sqlite3.Connection:
        connection: sqlite3.Connection | None = None
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            connection = sqlite3.connect(
                self.path,
                timeout=30,
                isolation_level=None,
                factory=_ClosingConnection,
            )
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA busy_timeout=30000")
            return connection
        except BaseException:
            if connection is not None:
                connection.close()
            raise

    @staticmethod
    def _schema_findings(connection: sqlite3.Connection) -> list[str]:
        findings: list[str] = []
        expected = {
            (kind, name): (owner, _normalize_schema_sql(sql))
            for kind, name, owner, sql in LEDGER_SCHEMA_DEFINITIONS
        }
        actual = {
            (str(row["type"]), str(row["name"])): (
                str(row["tbl_name"]),
                _normalize_schema_sql(row["sql"]),
            )
            for row in connection.execute(
                """SELECT type, name, tbl_name, sql
                   FROM sqlite_master
                   WHERE name NOT GLOB 'sqlite_*'"""
            ).fetchall()
        }
        missing = sorted(set(expected) - set(actual))
        unexpected = sorted(set(actual) - set(expected))
        for kind, name in missing:
            findings.append(f"required ledger {kind} {name} is missing")
        for kind, name in unexpected:
            findings.append(f"unexpected ledger schema object {kind} {name}")
        for key in sorted(set(expected) & set(actual)):
            if actual[key] != expected[key]:
                kind, name = key
                findings.append(f"ledger {kind} {name} definition is invalid")

        if ("table", "ledger_meta") in actual:
            try:
                metadata = {
                    row["key"]: row["value"]
                    for row in connection.execute("SELECT key, value FROM ledger_meta")
                }
            except sqlite3.Error:
                findings.append("ledger metadata table is unreadable")
            else:
                if set(metadata) != {"event_count", "head_hash", "schema"}:
                    findings.append("ledger metadata keys are missing or unexpected")
                elif metadata["schema"] != SCHEMA_VERSION:
                    findings.append("schema metadata is missing or unsupported")
        return findings

    @staticmethod
    def _hashable_event(
        *,
        event_id: str,
        occurred_at: str,
        event_type: str,
        vertical_id: str,
        subject_id: str,
        payload: Mapping[str, Any],
        previous_hash: str,
    ) -> dict[str, Any]:
        return {
            "event_id": event_id,
            "event_type": event_type,
            "occurred_at": occurred_at,
            "payload": dict(payload),
            "previous_hash": previous_hash,
            "schema": SCHEMA_VERSION,
            "subject_id": subject_id,
            "vertical_id": vertical_id,
        }

    def append(
        self,
        *,
        event_type: str,
        vertical_id: str,
        subject_id: str,
        payload: Mapping[str, Any],
        event_id: str | None = None,
        occurred_at: str | None = None,
    ) -> dict[str, Any]:
        return self.append_batch(
            [
                {
                    "event_type": event_type,
                    "vertical_id": vertical_id,
                    "subject_id": subject_id,
                    "payload": payload,
                    "event_id": event_id,
                    "occurred_at": occurred_at,
                }
            ]
        )[0]

    def append_batch(self, events: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
        """Append a fully validated batch with one chain transaction or none."""

        with self._lock:
            required = {"event_type", "vertical_id", "subject_id", "payload"}
            admitted = required | {"event_id", "occurred_at"}
            prepared: list[dict[str, Any]] = []
            identifiers: set[str] = set()
            if isinstance(events, (Mapping, str, bytes)):
                raise LedgerError("events must be an iterable of event objects")
            try:
                iterator = iter(events)
            except TypeError as error:
                raise LedgerError(
                    "events must be an iterable of event objects"
                ) from error
            for event in iterator:
                if (
                    not isinstance(event, Mapping)
                    or not required <= set(event)
                    or not set(event) <= admitted
                ):
                    raise LedgerError("event has missing or unknown fields")
                for label in ("event_type", "vertical_id", "subject_id"):
                    value = event[label]
                    if not isinstance(value, str) or not value.strip():
                        raise LedgerError(f"{label} must be a non-empty string")
                if not isinstance(event["payload"], Mapping):
                    raise LedgerError("payload must be an object")
                identifier = event.get("event_id")
                if identifier is None:
                    identifier = str(uuid.uuid4())
                if not isinstance(identifier, str) or not identifier.strip():
                    raise LedgerError("event_id must be a non-empty string")
                if identifier in identifiers:
                    raise LedgerError("batch has duplicate event_id")
                identifiers.add(identifier)
                timestamp = event.get("occurred_at")
                if timestamp is None:
                    timestamp = utc_now()
                if not isinstance(timestamp, str) or not timestamp.strip():
                    raise LedgerError("occurred_at must be a non-empty string")
                try:
                    payload_json = canonical_json(dict(event["payload"]))
                    payload = loads_json(payload_json)
                except (TypeError, ValueError) as error:
                    raise LedgerError("payload must be strict JSON") from error
                prepared.append(
                    {
                        "event_id": identifier,
                        "event_type": event["event_type"],
                        "occurred_at": timestamp,
                        "payload": payload,
                        "payload_json": payload_json,
                        "subject_id": event["subject_id"],
                        "vertical_id": event["vertical_id"],
                    }
                )
            if not prepared:
                raise LedgerError("events must contain at least one event")
            return self._append_prepared_batch(prepared)

    def _append_prepared_batch(
        self, prepared: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        self.initialize()
        connection = self._connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            schema_findings = self._schema_findings(connection)
            if schema_findings:
                raise LedgerError(
                    "ledger schema is invalid; refusing append: "
                    + "; ".join(schema_findings)
                )
            meta = {
                row["key"]: row["value"]
                for row in connection.execute(
                    "SELECT key, value FROM ledger_meta WHERE key IN ('head_hash', 'event_count')"
                ).fetchall()
            }
            if set(meta) != {"head_hash", "event_count"}:
                raise LedgerError("ledger head metadata is missing")
            previous = connection.execute(
                "SELECT event_hash FROM ledger_events ORDER BY sequence DESC LIMIT 1"
            ).fetchone()
            previous_hash = previous["event_hash"] if previous else GENESIS_HASH
            stored_rows = connection.execute(
                "SELECT * FROM ledger_events ORDER BY sequence"
            ).fetchall()
            row_count = len(stored_rows)
            try:
                stored_records = [self._record_from_row(row) for row in stored_rows]
            except (TypeError, ValueError) as error:
                raise LedgerError("stored ledger payload is not strict JSON") from error
            integrity = self.verify_records(stored_records)
            if integrity["status"] == "INVALID":
                raise LedgerError(
                    "refusing append because the stored ledger chain is invalid"
                )
            try:
                metadata_count = int(meta["event_count"])
            except (TypeError, ValueError) as error:
                raise LedgerError("ledger event_count metadata is malformed") from error
            if meta["head_hash"] != previous_hash or metadata_count != row_count:
                raise LedgerError("ledger head metadata does not match stored events")
            appended: list[dict[str, Any]] = []
            for event in prepared:
                material = self._hashable_event(
                    event_id=event["event_id"],
                    occurred_at=event["occurred_at"],
                    event_type=event["event_type"],
                    vertical_id=event["vertical_id"],
                    subject_id=event["subject_id"],
                    payload=event["payload"],
                    previous_hash=previous_hash,
                )
                event_hash = digest_value(material)
                cursor = connection.execute(
                    """
                    INSERT INTO ledger_events(
                        event_id, occurred_at, event_type, vertical_id, subject_id,
                        payload_json, previous_hash, event_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        event["event_id"],
                        event["occurred_at"],
                        event["event_type"],
                        event["vertical_id"],
                        event["subject_id"],
                        event["payload_json"],
                        previous_hash,
                        event_hash,
                    ),
                )
                appended.append(
                    {
                        **material,
                        "event_hash": event_hash,
                        "sequence": cursor.lastrowid,
                    }
                )
                previous_hash = event_hash
            if self.verify_records([*stored_records, *appended])["status"] == "INVALID":
                raise LedgerError("appended ledger chain failed verification")
            connection.execute(
                "UPDATE ledger_meta SET value=? WHERE key='head_hash'", (previous_hash,)
            )
            connection.execute(
                "UPDATE ledger_meta SET value=? WHERE key='event_count'",
                (str(row_count + len(appended)),),
            )
            connection.commit()
            return appended
        except sqlite3.IntegrityError as error:
            connection.rollback()
            raise LedgerError(
                f"ledger integrity constraint rejected append: {error}"
            ) from error
        except sqlite3.Error as error:
            connection.rollback()
            raise LedgerError("ledger transaction failed closed") from error
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    @staticmethod
    def _record_from_row(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "event_hash": row["event_hash"],
            "event_id": row["event_id"],
            "event_type": row["event_type"],
            "occurred_at": row["occurred_at"],
            "payload": loads_json(row["payload_json"]),
            "previous_hash": row["previous_hash"],
            "schema": SCHEMA_VERSION,
            "sequence": row["sequence"],
            "subject_id": row["subject_id"],
            "vertical_id": row["vertical_id"],
        }

    def events(self) -> list[dict[str, Any]]:
        with self._lock:
            self.initialize()
            with self._connect(readonly=True) as connection:
                rows = connection.execute(
                    "SELECT * FROM ledger_events ORDER BY sequence"
                ).fetchall()
            return [self._record_from_row(row) for row in rows]

    def get(self, event_id: str) -> dict[str, Any] | None:
        with self._lock:
            self.initialize()
            with self._connect(readonly=True) as connection:
                row = connection.execute(
                    "SELECT * FROM ledger_events WHERE event_id=?", (event_id,)
                ).fetchone()
            return self._record_from_row(row) if row else None

    @classmethod
    def verify_records(cls, records: Iterable[Mapping[str, Any]]) -> dict[str, Any]:
        findings: list[str] = []
        expected_previous = GENESIS_HASH
        seen_ids: set[str] = set()
        seen_hashes: set[str] = set()
        last_hash = GENESIS_HASH
        count = 0
        for position, record in enumerate(records, start=1):
            count += 1
            try:
                event_id = str(record["event_id"])
                if record.get("sequence") != position:
                    findings.append(f"event {position}: sequence mismatch")
                previous_hash = str(record["previous_hash"])
                stated_hash = str(record["event_hash"])
                if event_id in seen_ids:
                    findings.append(f"event {position}: duplicate event_id")
                if stated_hash in seen_hashes:
                    findings.append(f"event {position}: duplicate event_hash")
                if previous_hash != expected_previous:
                    findings.append(f"event {position}: previous_hash mismatch")
                material = cls._hashable_event(
                    event_id=event_id,
                    occurred_at=str(record["occurred_at"]),
                    event_type=str(record["event_type"]),
                    vertical_id=str(record["vertical_id"]),
                    subject_id=str(record["subject_id"]),
                    payload=dict(record["payload"]),
                    previous_hash=previous_hash,
                )
                computed_hash = digest_value(material)
                if computed_hash != stated_hash:
                    findings.append(f"event {position}: event_hash mismatch")
                expected_previous = stated_hash
                last_hash = stated_hash
                seen_ids.add(event_id)
                seen_hashes.add(stated_hash)
            except (KeyError, TypeError, ValueError) as error:
                findings.append(f"event {position}: malformed: {error}")
        return {
            "event_count": count,
            "findings": findings,
            "head_hash": last_hash,
            "schema": "szl.vertical-ledger-verification/v1",
            "status": ("INVALID" if findings else "VERIFIED" if count else "EMPTY"),
        }

    def verify(self) -> dict[str, Any]:
        with self._lock:
            try:
                self.initialize()
            except (LedgerError, OSError, sqlite3.Error) as error:
                return {
                    "event_count": None,
                    "findings": [str(error)],
                    "head_hash": None,
                    "schema": "szl.vertical-ledger-verification/v1",
                    "status": "INVALID",
                }
            connection = self._connect(readonly=True)
            try:
                connection.execute("BEGIN")
                schema_findings = self._schema_findings(connection)
                if schema_findings:
                    connection.rollback()
                    return {
                        "event_count": None,
                        "findings": schema_findings,
                        "head_hash": None,
                        "schema": "szl.vertical-ledger-verification/v1",
                        "status": "INVALID",
                    }
                rows = connection.execute(
                    "SELECT * FROM ledger_events ORDER BY sequence"
                ).fetchall()
                metadata = {
                    row["key"]: row["value"]
                    for row in connection.execute(
                        "SELECT key, value FROM ledger_meta"
                    ).fetchall()
                }
                connection.rollback()
            finally:
                connection.close()

        records: list[dict[str, Any]] = []
        parse_findings: list[str] = []
        for position, row in enumerate(rows, start=1):
            try:
                records.append(self._record_from_row(row))
            except (TypeError, ValueError) as error:
                parse_findings.append(
                    f"event {position}: stored payload is not strict JSON: {error}"
                )
                records.append(
                    {
                        "event_hash": row["event_hash"],
                        "event_id": row["event_id"],
                        "event_type": row["event_type"],
                        "occurred_at": row["occurred_at"],
                        "payload": None,
                        "previous_hash": row["previous_hash"],
                        "schema": SCHEMA_VERSION,
                        "sequence": row["sequence"],
                        "subject_id": row["subject_id"],
                        "vertical_id": row["vertical_id"],
                    }
                )
        report = self.verify_records(records)
        findings = list(report["findings"])
        findings.extend(parse_findings)
        if set(metadata) != {"event_count", "head_hash", "schema"}:
            findings.append("ledger metadata keys are missing or unexpected")
        else:
            if metadata["schema"] != SCHEMA_VERSION:
                findings.append("ledger schema metadata mismatch")
            try:
                if int(metadata["event_count"]) != report["event_count"]:
                    findings.append("event_count metadata mismatch")
            except ValueError:
                findings.append("event_count metadata is malformed")
            if metadata["head_hash"] != report["head_hash"]:
                findings.append("head_hash metadata mismatch")
        report["findings"] = findings
        report["status"] = (
            "INVALID" if findings else "VERIFIED" if report["event_count"] else "EMPTY"
        )
        return report

    def backup(self, destination: str | Path) -> dict[str, Any]:
        with self._lock:
            return self._backup(destination)

    def _backup(self, destination: str | Path) -> dict[str, Any]:
        self.initialize()
        target = Path(destination)
        if target.resolve() == self.path.resolve():
            raise LedgerError("backup destination must differ from the live ledger")
        if target.exists():
            raise LedgerError(
                "backup destination already exists; refusing to overwrite it"
            )
        target.parent.mkdir(parents=True, exist_ok=True)
        source_connection = self._connect(readonly=True)
        destination_connection = sqlite3.connect(target)
        try:
            source_connection.backup(destination_connection)
        finally:
            destination_connection.close()
            source_connection.close()
        verification = OutcomeLedger(target).verify()
        if verification["status"] not in {"EMPTY", "VERIFIED"}:
            raise LedgerError("backup verification failed")
        return verification
