"""Loopback HTTP surface for the fail-closed vertical recommendation runtime."""

from __future__ import annotations

import ipaddress
import json
import os
import re
import secrets
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Mapping
from urllib.parse import unquote, urlparse

from .canonical import CANONICAL_JSON_ALGORITHM, digest_value, loads_json
from .contracts import load_catalog
from .ledger import OutcomeLedger
from .policy import DecisionEngine, PolicyError, PolicyPersistenceError
from .receipts import (
    ReceiptConflict,
    ReceiptError,
    get_receipt,
    initial_receipt_id,
    persist_human_disposition,
)
from .release import blocked_release_registry


MAX_REQUEST_BYTES = 1024 * 1024
GIT_SHA = re.compile(r"^[0-9a-f]{40}$")
AUTH_TOKEN = re.compile(r"^[A-Za-z0-9._~+/=-]{32,256}$")
VERTICAL_ID = r"[a-z0-9]+(?:-[a-z0-9]+)*"
DECISION_ID = r"decision:[0-9a-f]{64}"
RECEIPT_ID = r"(?:receipt|human-receipt):[0-9a-f]{64}"
RECEIPT_ROUTE = re.compile(
    rf"^/v1/verticals/(?P<vertical_id>{VERTICAL_ID})/receipts/(?P<receipt_id>{RECEIPT_ID})$"
)
EVALUATE_ROUTE = re.compile(
    rf"^/v1/verticals/(?P<vertical_id>{VERTICAL_ID})/decisions/evaluate$"
)
HUMAN_DISPOSITION_ROUTE = re.compile(
    rf"^/v1/verticals/(?P<vertical_id>{VERTICAL_ID})/decisions/"
    rf"(?P<decision_id>{DECISION_ID})/human-disposition$"
)


def load_cells(directory: str | Path) -> dict[str, dict[str, Any]]:
    cells, _ = load_catalog(directory)
    return cells


def _loopback(host: str) -> bool:
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


class RuntimeServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(
        self,
        address: tuple[str, int],
        *,
        catalog_metadata: Mapping[str, Any],
        cells: Mapping[str, Mapping[str, Any]],
        ledger: OutcomeLedger,
        authorization_token: str | None = None,
        source_revision: str | None = None,
    ):
        self.authorization_token = authorization_token
        self.catalog_metadata = dict(catalog_metadata)
        self.cells = {key: dict(value) for key, value in cells.items()}
        self.ledger = ledger
        self.engine = DecisionEngine(self.cells, ledger=ledger)
        self.release_registry = blocked_release_registry(self.cells)
        self.source_revision = source_revision
        super().__init__(address, RuntimeHandler)


class RuntimeHandler(BaseHTTPRequestHandler):
    server: RuntimeServer
    server_version = "SZLVerticalRuntime/1"
    sys_version = ""

    def log_message(self, format_string: str, *args: object) -> None:
        # Paths and queries can carry sensitive context. Embedders may add a
        # structured, redacted logger around the server lifecycle if needed.
        return

    def _send(self, status: int, payload: Mapping[str, Any]) -> None:
        body = json.dumps(
            dict(payload), sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _error(self, status: int, code: str, message: str) -> None:
        self._send(
            status,
            {
                "error": {"code": code, "message": message},
                "schema": "szl.vertical-runtime-error/v1",
            },
        )

    def _json_body(self) -> dict[str, Any]:
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0]
        if content_type != "application/json":
            raise PolicyError("Content-Type must be application/json")
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise PolicyError("invalid Content-Length") from error
        if length < 1 or length > MAX_REQUEST_BYTES:
            raise PolicyError("request body size is outside the allowed range")
        try:
            raw = self.rfile.read(length)
            value = loads_json(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            raise PolicyError(
                "request body must be strict UTF-8 JSON without duplicate keys"
            ) from error
        if not isinstance(value, dict):
            raise PolicyError("request body must be a JSON object")
        return value

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler contract
        path = unquote(urlparse(self.path).path)
        if path == "/healthz":
            self._send(
                HTTPStatus.OK,
                {
                    "liveness": "LIVE",
                    "production_ready": False,
                    "schema": "szl.vertical-runtime-health/v1",
                    "service": "vertical-runtime",
                },
            )
            return
        if path == "/readyz":
            verification = self.server.ledger.verify()
            source_integrity_valid = verification["status"] in {
                "EMPTY",
                "VERIFIED",
            } and bool(self.server.cells)
            auth_configured = self.server.authorization_token is not None
            mutation_ready = source_integrity_valid and auth_configured
            local_ready = source_integrity_valid and auth_configured
            self._send(
                HTTPStatus.OK if local_ready else HTTPStatus.SERVICE_UNAVAILABLE,
                {
                    "auth_configured": auth_configured,
                    "local_integrity_valid": source_integrity_valid,
                    "local_ready": local_ready,
                    "mutation_ready": mutation_ready,
                    "status": "READY" if local_ready else "BLOCKED",
                    "catalog": self.server.catalog_metadata,
                    "durability_state": "LOCAL_PERSISTENCE_UNVERIFIED"
                    if source_integrity_valid
                    else "UNAVAILABLE",
                    "ledger": verification,
                    "production_ready": False,
                    "release_status": "SOURCE_ONLY",
                    "schema": "szl.vertical-runtime-readiness/v1",
                    "vertical_count": len(self.server.cells),
                },
            )
            return
        if path == "/version":
            source_revision = self.server.source_revision
            self._send(
                HTTPStatus.OK,
                {
                    "canonicalization": CANONICAL_JSON_ALGORITHM,
                    "catalog_digest": self.server.catalog_metadata["catalog_digest"],
                    "gitSha": source_revision,
                    "identity_state": (
                        "CALLER_DECLARED_UNVERIFIED"
                        if source_revision is not None
                        else "UNAVAILABLE"
                    ),
                    "production_ready": False,
                    "schema": "szl.vertical-runtime-version/v1",
                    "service": "vertical-runtime",
                    "version": "1.0.0",
                },
            )
            return
        if path == "/evidence":
            verification = self.server.ledger.verify()
            self._send(
                HTTPStatus.OK,
                {
                    "deployment_evidence_state": "ABSENT",
                    "ledger": verification,
                    "production_ready": False,
                    "receipts": [],
                    "schema": "szl.vertical-runtime-evidence/v1",
                    "signed_receipt_state": "ABSENT",
                    "source_revision": self.server.source_revision,
                },
            )
            return
        if path == "/production-readyz":
            self._send(
                HTTPStatus.SERVICE_UNAVAILABLE,
                {
                    "production_ready": False,
                    "reason": "NO_ADMITTED_PRODUCTION_RELEASE",
                    "release_registry": self.server.release_registry,
                    "schema": "szl.vertical-runtime-production-readiness/v1",
                },
            )
            return
        if path == "/v1/verticals":
            verticals = [
                {
                    "display_name": cell.get("display_name"),
                    "manifest_digest": digest_value(cell),
                    "production_status": "BLOCKED",
                    "vertical_id": vertical_id,
                    "visibility": cell.get("space_visibility"),
                }
                for vertical_id, cell in sorted(self.server.cells.items())
            ]
            self._send(
                HTTPStatus.OK,
                {"schema": "szl.vertical-catalog/v1", "verticals": verticals},
            )
            return
        receipt_match = RECEIPT_ROUTE.fullmatch(path)
        if receipt_match is not None:
            if not self._authorize_protected_route():
                return
            vertical_id = receipt_match.group("vertical_id")
            cell = self.server.cells.get(vertical_id)
            if cell is None:
                self._error(HTTPStatus.NOT_FOUND, "NOT_FOUND", "vertical not found")
                return
            try:
                receipt = get_receipt(
                    self.server.ledger,
                    receipt_id=receipt_match.group("receipt_id"),
                    source_manifest_sha256=digest_value(cell),
                    vertical_id=vertical_id,
                )
            except ReceiptError:
                self._error(
                    HTTPStatus.SERVICE_UNAVAILABLE,
                    "RECEIPT_UNAVAILABLE",
                    "receipt retrieval failed closed",
                )
                return
            if receipt is None:
                self._error(HTTPStatus.NOT_FOUND, "NOT_FOUND", "receipt not found")
            else:
                self._send(HTTPStatus.OK, receipt)
            return
        prefix = "/v1/verticals/"
        if path.startswith(prefix):
            vertical_id = path[len(prefix) :]
            cell = self.server.cells.get(vertical_id)
            if cell is None:
                self._error(HTTPStatus.NOT_FOUND, "NOT_FOUND", "vertical not found")
            else:
                self._send(HTTPStatus.OK, cell)
            return
        if path == "/v1/ledger/verify":
            verification = self.server.ledger.verify()
            self._send(
                HTTPStatus.OK
                if verification["status"] in {"EMPTY", "VERIFIED"}
                else HTTPStatus.SERVICE_UNAVAILABLE,
                verification,
            )
            return
        event_prefix = "/v1/ledger/events/"
        if path.startswith(event_prefix):
            if not self._authorize_protected_route():
                return
            verification = self.server.ledger.verify()
            if verification["status"] == "INVALID":
                self._send(
                    HTTPStatus.SERVICE_UNAVAILABLE,
                    {
                        "error": {
                            "code": "LEDGER_INVALID",
                            "message": "event retrieval is unavailable while ledger integrity is invalid",
                        },
                        "ledger": verification,
                        "schema": "szl.vertical-runtime-error/v1",
                    },
                )
                return
            event = self.server.ledger.get(path[len(event_prefix) :])
            if event is None:
                self._error(HTTPStatus.NOT_FOUND, "NOT_FOUND", "ledger event not found")
            else:
                self._send(HTTPStatus.OK, event)
            return
        if path == "/v1/releases":
            self._send(HTTPStatus.OK, self.server.release_registry)
            return
        self._error(HTTPStatus.NOT_FOUND, "NOT_FOUND", "route not found")

    def do_HEAD(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler contract
        self.do_GET()

    def _method_not_allowed(self) -> None:
        self._error(
            HTTPStatus.METHOD_NOT_ALLOWED,
            "METHOD_NOT_ALLOWED",
            "method is not admitted for this route",
        )

    def do_DELETE(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler contract
        self._method_not_allowed()

    def do_PATCH(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler contract
        self._method_not_allowed()

    def do_PUT(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler contract
        self._method_not_allowed()

    def do_OPTIONS(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler contract
        self._method_not_allowed()

    def do_TRACE(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler contract
        self._method_not_allowed()

    def _authorize_protected_route(self) -> bool:
        expected = self.server.authorization_token
        if expected is None:
            self._error(
                HTTPStatus.SERVICE_UNAVAILABLE,
                "AUTH_NOT_CONFIGURED",
                "protected contract routes are disabled until a local bearer token is configured",
            )
            return False
        authorization_headers = self.headers.get_all("Authorization", [])
        header = authorization_headers[0] if len(authorization_headers) == 1 else ""
        prefix = "Bearer "
        candidate = header[len(prefix) :] if header.startswith(prefix) else ""
        if (
            not candidate
            or not AUTH_TOKEN.fullmatch(candidate)
            or not secrets.compare_digest(candidate, expected)
        ):
            self._error(
                HTTPStatus.UNAUTHORIZED,
                "AUTHORIZATION_REQUIRED",
                "a valid local bearer token is required",
            )
            return False
        return True

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler contract
        if not self._authorize_protected_route():
            return
        path = unquote(urlparse(self.path).path)
        try:
            body = self._json_body()
            evaluate_match = EVALUATE_ROUTE.fullmatch(path)
            if evaluate_match is not None or path == "/v1/evaluate":
                vertical_id = body.get("vertical_id")
                request = body.get("request")
                if set(body) != {"request", "vertical_id"}:
                    raise PolicyError(
                        "evaluation body must contain exactly request and vertical_id"
                    )
                if not isinstance(vertical_id, str) or not isinstance(request, dict):
                    raise PolicyError("vertical_id and request object are required")
                if evaluate_match is not None and vertical_id != evaluate_match.group(
                    "vertical_id"
                ):
                    raise PolicyError("path and body vertical_id must match")
                decision = self.server.engine.evaluate(
                    vertical_id, request, mode="ENFORCE"
                )
                cell = self.server.cells.get(vertical_id)
                if cell is None:
                    raise PolicyError(f"unknown vertical_id: {vertical_id}")
                receipt = get_receipt(
                    self.server.ledger,
                    receipt_id=initial_receipt_id(
                        decision_digest=decision["decision_digest"],
                        source_manifest_sha256=digest_value(cell),
                        vertical_id=vertical_id,
                    ),
                    source_manifest_sha256=digest_value(cell),
                    vertical_id=vertical_id,
                )
                if receipt is None:
                    raise PolicyPersistenceError("atomic initial receipt is missing")
                self._send(HTTPStatus.OK, receipt)
                return
            human_match = HUMAN_DISPOSITION_ROUTE.fullmatch(path)
            if human_match is not None:
                if set(body) != {"authority_state", "human_actor_id"}:
                    raise ReceiptError(
                        "human disposition body must contain exactly authority_state and human_actor_id"
                    )
                vertical_id = human_match.group("vertical_id")
                cell = self.server.cells.get(vertical_id)
                if cell is None:
                    self._error(HTTPStatus.NOT_FOUND, "NOT_FOUND", "vertical not found")
                    return
                receipt, created = persist_human_disposition(
                    self.server.ledger,
                    authority_state=body.get("authority_state"),
                    decision_id=human_match.group("decision_id"),
                    human_actor_id=body.get("human_actor_id"),
                    source_manifest_sha256=digest_value(cell),
                    vertical_id=vertical_id,
                )
                self._send(HTTPStatus.CREATED if created else HTTPStatus.OK, receipt)
                return
            if path == "/v1/outcomes":
                vertical_id = body.get("vertical_id")
                decision_id = body.get("decision_id")
                outcome = body.get("outcome")
                if (
                    not isinstance(vertical_id, str)
                    or not isinstance(decision_id, str)
                    or not isinstance(outcome, dict)
                ):
                    raise PolicyError(
                        "vertical_id, decision_id, and outcome object are required"
                    )
                self._send(
                    HTTPStatus.CREATED,
                    self.server.engine.record_outcome(
                        vertical_id=vertical_id,
                        decision_id=decision_id,
                        outcome=outcome,
                    ),
                )
                return
            if path == "/v1/policy-shadow":
                vertical_id = body.get("vertical_id")
                candidate = body.get("candidate_cell")
                scenarios = body.get("scenarios")
                if (
                    not isinstance(vertical_id, str)
                    or not isinstance(candidate, dict)
                    or not isinstance(scenarios, list)
                ):
                    raise PolicyError(
                        "vertical_id, candidate_cell, and scenarios are required"
                    )
                self._send(
                    HTTPStatus.OK,
                    self.server.engine.shadow_compare(
                        vertical_id=vertical_id,
                        candidate_cell=candidate,
                        scenarios=scenarios,
                    ),
                )
                return
            self._error(HTTPStatus.NOT_FOUND, "NOT_FOUND", "route not found")
        except ReceiptConflict as error:
            self._error(HTTPStatus.CONFLICT, "RECEIPT_CONFLICT", str(error))
        except ReceiptError as error:
            message = str(error)
            if "integrity" in message or "persistence failed" in message:
                self._error(
                    HTTPStatus.SERVICE_UNAVAILABLE,
                    "RECEIPT_UNAVAILABLE",
                    "receipt operation failed closed",
                )
            elif "not recorded" in message or "missing" in message:
                self._error(HTTPStatus.NOT_FOUND, "NOT_FOUND", message)
            else:
                self._error(HTTPStatus.BAD_REQUEST, "INVALID_RECEIPT", message)
        except PolicyPersistenceError as error:
            self._error(
                HTTPStatus.SERVICE_UNAVAILABLE, "PERSISTENCE_UNAVAILABLE", str(error)
            )
        except PolicyError as error:
            self._error(HTTPStatus.BAD_REQUEST, "INVALID_REQUEST", str(error))
        except Exception:
            self._error(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "request failed without exposing internal data",
            )


def build_server(
    *,
    host: str,
    port: int,
    manifest_dir: str | Path,
    ledger_path: str | Path,
    authorization_token: str | None = None,
    source_revision: str | None = None,
) -> RuntimeServer:
    if not _loopback(host):
        raise ValueError("vertical runtime may bind only to a loopback address")
    cells, catalog_metadata = load_catalog(manifest_dir)
    ledger = OutcomeLedger(ledger_path)
    ledger.initialize()
    declared_revision = source_revision or os.environ.get(
        "SZL_VERTICAL_RUNTIME_GIT_SHA"
    )
    if declared_revision is not None and not GIT_SHA.fullmatch(declared_revision):
        raise ValueError(
            "source revision must be exactly 40 lowercase hexadecimal characters"
        )
    if authorization_token is not None and not AUTH_TOKEN.fullmatch(
        authorization_token
    ):
        raise ValueError(
            "authorization token must be 32-256 characters from the admitted token alphabet"
        )
    return RuntimeServer(
        (host, port),
        catalog_metadata=catalog_metadata,
        cells=cells,
        ledger=ledger,
        authorization_token=authorization_token,
        source_revision=declared_revision,
    )


def serve(
    *,
    host: str,
    port: int,
    manifest_dir: str | Path,
    ledger_path: str | Path,
    authorization_token: str | None = None,
    source_revision: str | None = None,
) -> None:
    server = build_server(
        host=host,
        port=port,
        manifest_dir=manifest_dir,
        ledger_path=ledger_path,
        authorization_token=authorization_token,
        source_revision=source_revision,
    )
    try:
        server.serve_forever()
    finally:
        server.server_close()
