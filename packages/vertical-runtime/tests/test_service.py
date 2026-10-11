from __future__ import annotations

import json
import sqlite3
import tempfile
import threading
import unittest
from contextlib import closing
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from unittest.mock import patch

from fixtures import request
from szl_vertical_runtime.service import build_server


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
MANIFESTS = REPOSITORY_ROOT / "apps" / "vertical-cells" / "manifests"


class ServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        root = Path(self.temporary.name)
        self.ledger = root / "ledger.sqlite3"
        self.token = "packet6-test-token-" + "a" * 48
        self.server = build_server(
            host="127.0.0.1",
            port=0,
            manifest_dir=MANIFESTS,
            ledger_path=self.ledger,
            authorization_token=self.token,
            source_revision="a" * 40,
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self._stop_server)
        self.base_url = f"http://127.0.0.1:{self.server.server_port}"

    def _stop_server(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)

    def _request(
        self,
        path: str,
        *,
        method: str = "GET",
        payload: dict[str, object] | None = None,
        raw: bytes | None = None,
        authorize: bool = True,
    ) -> tuple[int, dict[str, object] | None, object, bytes]:
        if payload is not None and raw is not None:
            raise ValueError("payload and raw are mutually exclusive")
        data = (
            raw
            if raw is not None
            else (None if payload is None else json.dumps(payload).encode("utf-8"))
        )
        headers = {"Content-Type": "application/json"} if data else {}
        if authorize:
            headers["Authorization"] = f"Bearer {self.token}"
        request_object = Request(
            self.base_url + path,
            method=method,
            data=data,
            headers=headers,
        )
        try:
            response = urlopen(request_object, timeout=5)
        except HTTPError as error:
            response = error
        with response:
            body = response.read()
            decoded = json.loads(body) if body else None
            return response.status, decoded, response.headers, body

    def test_truth_endpoints_and_head_parity(self) -> None:
        health = self._request("/healthz")
        self.assertEqual(health[0], 200)
        self.assertFalse(health[1]["production_ready"])  # type: ignore[index]
        ready = self._request("/readyz")
        self.assertEqual(ready[0], 200)
        self.assertEqual(ready[1]["ledger"]["status"], "EMPTY")  # type: ignore[index]
        self.assertTrue(ready[1]["local_ready"])  # type: ignore[index]
        self.assertTrue(ready[1]["mutation_ready"])  # type: ignore[index]
        self.assertTrue(ready[1]["auth_configured"])  # type: ignore[index]
        self.assertEqual(ready[1]["status"], "READY")  # type: ignore[index]
        self.assertEqual(
            ready[1]["durability_state"],  # type: ignore[index]
            "LOCAL_PERSISTENCE_UNVERIFIED",
        )
        production = self._request("/production-readyz")
        self.assertEqual(production[0], 503)
        self.assertFalse(production[1]["production_ready"])  # type: ignore[index]
        version_get = self._request("/version")
        version_head = self._request("/version", method="HEAD")
        self.assertEqual(version_get[1]["gitSha"], "a" * 40)  # type: ignore[index]
        self.assertEqual(
            version_get[1]["identity_state"],  # type: ignore[index]
            "CALLER_DECLARED_UNVERIFIED",
        )
        self.assertRegex(
            version_get[1]["catalog_digest"],
            r"^[0-9a-f]{64}$",  # type: ignore[index]
        )
        self.assertEqual(version_head[3], b"")
        self.assertEqual(
            version_get[2]["Content-Length"],
            version_head[2]["Content-Length"],  # type: ignore[index]
        )
        evidence = self._request("/evidence")
        self.assertEqual(evidence[1]["receipts"], [])  # type: ignore[index]
        self.assertEqual(evidence[1]["deployment_evidence_state"], "ABSENT")  # type: ignore[index]
        self.assertEqual(evidence[2]["Cache-Control"], "no-store, max-age=0")  # type: ignore[index]
        put = self._request("/healthz", method="PUT")
        self.assertEqual(put[0], 405)
        self.assertEqual(put[1]["error"]["code"], "METHOD_NOT_ALLOWED")  # type: ignore[index]
        self.assertEqual(put[2]["Cache-Control"], "no-store, max-age=0")  # type: ignore[index]
        for method in ("OPTIONS", "TRACE"):
            rejected = self._request("/healthz", method=method)
            self.assertEqual(rejected[0], 405)
            self.assertEqual(rejected[1]["error"]["code"], "METHOD_NOT_ALLOWED")  # type: ignore[index]
            self.assertEqual(rejected[2]["X-Content-Type-Options"], "nosniff")  # type: ignore[index]

    def test_decision_and_outcome_persist(self) -> None:
        unauthorized = self._request(
            "/v1/evaluate",
            method="POST",
            payload={
                "vertical_id": "lyte-services",
                "request": request(action="recommend", workflow="scope readiness"),
            },
            authorize=False,
        )
        self.assertEqual(unauthorized[0], 401)
        self.assertEqual(
            unauthorized[1]["error"]["code"],  # type: ignore[index]
            "AUTHORIZATION_REQUIRED",
        )
        decision = self._request(
            "/v1/evaluate",
            method="POST",
            payload={
                "vertical_id": "lyte-services",
                "request": request(action="recommend", workflow="scope readiness"),
            },
        )
        self.assertEqual(decision[0], 200)
        self.assertEqual(decision[1]["decision"], "RECOMMEND")  # type: ignore[index]
        self.assertEqual(decision[1]["authority_state"], "APPROVAL_REQUIRED")  # type: ignore[index]
        self.assertEqual(decision[1]["schema"], "szl.vertical-decision-receipt/v2")  # type: ignore[index]
        self.assertFalse(decision[1]["execution_permitted"])  # type: ignore[index]
        outcome = self._request(
            "/v1/outcomes",
            method="POST",
            payload={
                "decision_id": decision[1]["decision_id"],  # type: ignore[index]
                "outcome": {"metric": "reviewed", "value": True},
                "vertical_id": "lyte-services",
            },
        )
        self.assertEqual(outcome[0], 201)
        verify = self._request("/v1/ledger/verify")
        self.assertEqual(verify[1]["status"], "VERIFIED")  # type: ignore[index]
        self.assertEqual(verify[1]["event_count"], 3)  # type: ignore[index]

    def test_generated_routes_receipt_replay_and_human_disposition(self) -> None:
        manifest = self._request("/v1/verticals/lyte-services", authorize=False)
        self.assertEqual(manifest[0], 200)
        self.assertEqual(manifest[1]["vertical_id"], "lyte-services")  # type: ignore[index]

        evaluated = self._request(
            "/v1/verticals/lyte-services/decisions/evaluate",
            method="POST",
            payload={
                "vertical_id": "lyte-services",
                "request": request(action="recommend", workflow="scope readiness"),
            },
        )
        self.assertEqual(evaluated[0], 200)
        receipt_id = evaluated[1]["receipt_id"]  # type: ignore[index]
        decision_id = evaluated[1]["decision_id"]  # type: ignore[index]

        receipt_path = f"/v1/verticals/lyte-services/receipts/{receipt_id}"
        unauthorized = self._request(receipt_path, authorize=False)
        self.assertEqual(unauthorized[0], 401)
        event_path = f"/v1/ledger/events/{decision_id}"
        unauthorized_event = self._request(event_path, authorize=False)
        self.assertEqual(unauthorized_event[0], 401)
        self.assertEqual(self._request(event_path)[0], 200)
        stored = self._request(receipt_path)
        self.assertEqual(stored[0], 200)
        self.assertEqual(stored[1], evaluated[1])
        head = self._request(receipt_path, method="HEAD")
        self.assertEqual(head[0], 200)
        self.assertEqual(head[3], b"")
        self.assertEqual(
            stored[2]["Content-Length"],
            head[2]["Content-Length"],  # type: ignore[index]
        )

        disposition_path = (
            f"/v1/verticals/lyte-services/decisions/{decision_id}/human-disposition"
        )
        disposition_body = {
            "authority_state": "APPROVED",
            "human_actor_id": "operator-1",
        }
        disposition = self._request(
            disposition_path, method="POST", payload=disposition_body
        )
        self.assertEqual(disposition[0], 201)
        self.assertEqual(disposition[1]["authority_state"], "APPROVED")  # type: ignore[index]
        self.assertFalse(disposition[1]["execution_permitted"])  # type: ignore[index]
        replay = self._request(
            disposition_path, method="POST", payload=disposition_body
        )
        self.assertEqual(replay[0], 200)
        self.assertEqual(replay[1], disposition[1])
        conflict = self._request(
            disposition_path,
            method="POST",
            payload={
                "authority_state": "DENIED",
                "human_actor_id": "operator-2",
            },
        )
        self.assertEqual(conflict[0], 409)
        human_receipt_path = (
            "/v1/verticals/lyte-services/receipts/" + disposition[1]["receipt_id"]  # type: ignore[index]
        )
        self.assertEqual(self._request(human_receipt_path)[1], disposition[1])

    def test_ledger_tamper_flips_readiness_but_not_liveness(self) -> None:
        decision = self._request(
            "/v1/evaluate",
            method="POST",
            payload={
                "vertical_id": "lyte-services",
                "request": request(action="recommend", workflow="scope readiness"),
            },
        )
        with closing(sqlite3.connect(self.ledger)) as connection:
            with connection:
                connection.execute("DROP TRIGGER ledger_events_no_update")
                connection.execute("UPDATE ledger_events SET payload_json='{}'")
        self.assertEqual(self._request("/healthz")[0], 200)
        ready = self._request("/readyz")
        self.assertEqual(ready[0], 503)
        self.assertEqual(ready[1]["ledger"]["status"], "INVALID")  # type: ignore[index]
        verify = self._request("/v1/ledger/verify")
        self.assertEqual(verify[0], 503)
        self.assertEqual(verify[1]["status"], "INVALID")  # type: ignore[index]
        event = self._request(
            f"/v1/ledger/events/{decision[1]['decision_id']}"  # type: ignore[index]
        )
        self.assertEqual(event[0], 503)
        self.assertEqual(event[1]["error"]["code"], "LEDGER_INVALID")  # type: ignore[index]

    def test_duplicate_json_keys_are_rejected_without_recording(self) -> None:
        raw = (
            b'{"vertical_id":"lyte-services","request":'
            b'{"action":"execute a payment","action":"recommend a reconciled service option",'
            b'"evidence":[{"digest":"sha256:' + b"a" * 64 + b'","id":"evidence-1"}],'
            b'"principal":{"authority_claims":[],"id":"operator-1"},'
            b'"request_id":"duplicate-key"}}'
        )
        response = self._request("/v1/evaluate", method="POST", raw=raw)
        self.assertEqual(response[0], 400)
        self.assertEqual(response[1]["error"]["code"], "INVALID_REQUEST")  # type: ignore[index]
        self.assertIn("duplicate keys", response[1]["error"]["message"])  # type: ignore[index]
        self.assertEqual(self._request("/v1/ledger/verify")[1]["status"], "EMPTY")  # type: ignore[index]

    def test_second_insert_failure_is_unavailable_and_rolls_back_both_records(
        self,
    ) -> None:
        connect = sqlite3.connect
        inserted_types: list[str] = []

        def fault_connect(*args: object, **kwargs: object) -> sqlite3.Connection:
            factory = kwargs.get("factory", sqlite3.Connection)

            class FaultConnection(factory):
                def execute(self, sql: str, parameters: tuple = ()) -> sqlite3.Cursor:
                    if "INSERT INTO ledger_events(" in sql:
                        event_type = parameters[2]
                        if event_type == "DECISION_RECEIPT":
                            raise sqlite3.OperationalError(
                                "injected second insert failure"
                            )
                        inserted_types.append(event_type)
                    return super().execute(sql, parameters)

            kwargs["factory"] = FaultConnection
            return connect(*args, **kwargs)

        body = {
            "vertical_id": "lyte-services",
            "request": request(action="recommend", workflow="scope readiness"),
        }
        before = self.ledger.read_bytes()
        with patch(
            "szl_vertical_runtime.ledger.sqlite3.connect", side_effect=fault_connect
        ):
            failed = self._request("/v1/evaluate", method="POST", payload=body)
        self.assertEqual(failed[0], 503)
        self.assertEqual(failed[1]["error"]["code"], "PERSISTENCE_UNAVAILABLE")
        self.assertEqual(inserted_types, ["DECISION"])
        self.assertEqual(self.ledger.read_bytes(), before)
        self.assertEqual(self._request("/v1/ledger/verify")[1]["event_count"], 0)
        retry = self._request("/v1/evaluate", method="POST", payload=body)
        self.assertEqual(retry[0], 200)
        self.assertEqual(self._request("/v1/ledger/verify")[1]["event_count"], 2)

    def test_post_routes_are_disabled_when_no_token_is_configured(self) -> None:
        root = Path(self.temporary.name)
        server = build_server(
            host="127.0.0.1",
            port=0,
            manifest_dir=MANIFESTS,
            ledger_path=root / "disabled.sqlite3",
        )
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            data = json.dumps(
                {
                    "vertical_id": "lyte-services",
                    "request": request(action="recommend", workflow="scope readiness"),
                }
            ).encode("utf-8")
            request_object = Request(
                f"http://127.0.0.1:{server.server_port}/v1/evaluate",
                method="POST",
                data=data,
                headers={"Content-Type": "application/json"},
            )
            with self.assertRaises(HTTPError) as caught:
                urlopen(request_object, timeout=5)
            with caught.exception:
                self.assertEqual(caught.exception.status, 503)
                body = json.loads(caught.exception.read())
                self.assertEqual(body["error"]["code"], "AUTH_NOT_CONFIGURED")

            receipt_request = Request(
                f"http://127.0.0.1:{server.server_port}/v1/verticals/lyte-services/receipts/receipt:{'a' * 64}",
                method="GET",
            )
            with self.assertRaises(HTTPError) as caught_receipt:
                urlopen(receipt_request, timeout=5)
            with caught_receipt.exception:
                self.assertEqual(caught_receipt.exception.status, 503)
                body = json.loads(caught_receipt.exception.read())
                self.assertEqual(body["error"]["code"], "AUTH_NOT_CONFIGURED")

            request_object = Request(
                f"http://127.0.0.1:{server.server_port}/readyz",
                method="GET",
            )
            with self.assertRaises(HTTPError) as caught_ready:
                urlopen(request_object, timeout=5)
            with caught_ready.exception:
                body = json.loads(caught_ready.exception.read())
                self.assertEqual(caught_ready.exception.status, 503)
                self.assertFalse(body["local_ready"])  # type: ignore[index]
                self.assertFalse(body["mutation_ready"])  # type: ignore[index]
                self.assertFalse(body["auth_configured"])  # type: ignore[index]
                self.assertEqual(body["status"], "BLOCKED")  # type: ignore[index]
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

    def test_non_loopback_and_bad_revision_are_rejected(self) -> None:
        root = Path(self.temporary.name)
        with self.assertRaises(ValueError):
            build_server(
                host="0.0.0.0",
                port=0,
                manifest_dir=MANIFESTS,
                ledger_path=root / "other.sqlite3",
            )
        with self.assertRaises(ValueError):
            build_server(
                host="127.0.0.1",
                port=0,
                manifest_dir=MANIFESTS,
                ledger_path=root / "other.sqlite3",
                source_revision="MAIN",
            )
        with self.assertRaises(ValueError):
            build_server(
                host="127.0.0.1",
                port=0,
                manifest_dir=MANIFESTS,
                ledger_path=root / "short-token.sqlite3",
                authorization_token="short",
            )


if __name__ == "__main__":
    unittest.main()
