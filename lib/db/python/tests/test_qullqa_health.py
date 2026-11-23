"""Offline negative and recovery tests for the Qullqa Python candidate."""

import json
import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from qullqa_health import (
    CandidateApp,
    HoldError,
    backup_and_verify_synthetic,
    create_demo,
    read_synthetic,
    record_synthetic,
    source_fingerprint,
)

SCHEMA = Path(__file__).resolve().parents[2] / "src" / "schema" / "health_checks.ts"


def request(app, route, token=None, method="GET"):
    headers = {}
    env = {"PATH_INFO": route, "REQUEST_METHOD": method}
    if token is not None:
        env["HTTP_AUTHORIZATION"] = token
    body = b"".join(
        app(env, lambda status, h: headers.update(status=status, headers=dict(h)))
    )
    return headers["status"], json.loads(body), headers["headers"]


class QullqaHealthTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.database = self.root / "demo.sqlite"

    def mkdemo(self):
        create_demo(self.database)
        record_synthetic(
            self.database, service="test-core", status="degraded", response_time_ms=7
        )

    def test_actual_source_fingerprint_is_static_only(self):
        got = source_fingerprint(SCHEMA)
        self.assertEqual(got["table"], "health_checks")
        self.assertEqual(len(got["source_sha256"]), 64)
        self.assertFalse(got["actual_database_schema_verified"])

    def test_refuses_source_drift(self):
        text = SCHEMA.read_text(encoding="utf-8")
        fake = self.root / "changed.ts"
        fake.write_text(text.replace("response_time_ms", "renamed_response_time_ms"))
        with self.assertRaisesRegex(HoldError, "SCHEMA_COLUMN_SIGNATURE_MISMATCH"):
            source_fingerprint(fake)

    def test_refuses_non_utf8_source(self):
        fake = self.root / "not_utf8.ts"
        fake.write_bytes(b"\xff")
        with self.assertRaisesRegex(HoldError, "SCHEMA_NOT_UTF8"):
            source_fingerprint(fake)

    def test_no_overwrite_existing_file(self):
        self.database.write_text("not our db")
        with self.assertRaisesRegex(HoldError, "DESTINATION_ALREADY_EXISTS"):
            create_demo(self.database)
        self.assertEqual(self.database.read_text(), "not our db")

    def test_isolation_requires_marker(self):
        with closing(sqlite3.connect(self.database)) as db, db:
            db.execute("CREATE TABLE health_checks (id INT)")
        with self.assertRaisesRegex(HoldError, "SYNTHETIC_DB_SCHEMA_INVALID"):
            read_synthetic(self.database)

    def test_parameterized_demo_data(self):
        self.mkdemo()
        got = read_synthetic(self.database)
        self.assertEqual(len(got), 1)
        self.assertEqual(got[0]["source_reported_status"], "degraded")
        self.assertIs(got[0]["independently_measured"], False)
        self.assertIsNone(got[0].get("details"))

    def test_invalid_status_does_not_write(self):
        self.mkdemo()
        for value in ["unknown", "READY", "HEALTHY", ""]:
            with self.assertRaises(ValueError):
                record_synthetic(self.database, service="test", status=value)
        self.assertEqual(len(read_synthetic(self.database)), 1)

    def test_unhashable_status_is_rejected_without_touching_synthetic_rows(self):
        self.mkdemo()
        for malformed in ([], {}, ["healthy"], {"status": "healthy"}):
            with self.subTest(status=malformed):
                with self.assertRaisesRegex(ValueError, "INVALID_SYNTHETIC_STATUS"):
                    record_synthetic(self.database, service="test", status=malformed)
        self.assertEqual(len(read_synthetic(self.database)), 1)

    def test_sql_injection_service_refused(self):
        self.mkdemo()
        with self.assertRaisesRegex(ValueError, "INVALID_SYNTHETIC_SERVICE"):
            record_synthetic(
                self.database,
                service="x'); DROP TABLE health_checks;--",
                status="degraded",
            )
        self.assertEqual(len(read_synthetic(self.database)), 1)

    def test_negative_and_bool_latency_refused(self):
        self.mkdemo()
        for value in [-1, True, 600001, 1.25]:
            with self.assertRaises(ValueError):
                record_synthetic(
                    self.database,
                    service="test",
                    status="degraded",
                    response_time_ms=value,
                )

    def test_backup_restore_digests_and_integrity(self):
        self.mkdemo()
        report = backup_and_verify_synthetic(
            self.database, self.root / "backup.sqlite", self.root / "restored.sqlite"
        )
        self.assertTrue(report["restore_verified"])
        self.assertFalse(report["postgres_restore_verified"])
        self.assertFalse(report["production_ready"])
        self.assertEqual(
            read_synthetic(self.root / "restored.sqlite"), read_synthetic(self.database)
        )

    def test_backup_refuses_existing_destination(self):
        self.mkdemo()
        dst = self.root / "backup.sqlite"
        dst.write_bytes(b"DO NOT OVERWRITE")
        with self.assertRaisesRegex(HoldError, "DESTINATION_ALREADY_EXISTS"):
            backup_and_verify_synthetic(
                self.database, dst, self.root / "restored.sqlite"
            )
        self.assertEqual(dst.read_bytes(), b"DO NOT OVERWRITE")

    def test_corruption_refused(self):
        self.database.write_bytes(b"not a database")
        with self.assertRaises(HoldError):
            read_synthetic(self.database)

    def test_missing_store_is_unavailable_not_zero(self):
        app = CandidateApp(self.database, token="synthetic-test-token")
        status, response, _ = request(
            app, "/api/qullqa/v1/health-checks", "Bearer synthetic-test-token"
        )
        self.assertEqual(status, "503 Service Unavailable")
        self.assertIsNone(response["rows"])

    def test_health_liveness_does_not_prove_readiness(self):
        app = CandidateApp()
        live, payload, headers = request(app, "/healthz")
        self.assertEqual(live, "200 OK")
        self.assertFalse(payload["production_ready"])
        self.assertEqual(headers["Cache-Control"], "no-store")
        ready, payload, _ = request(app, "/readyz")
        self.assertEqual(ready, "503 Service Unavailable")
        self.assertFalse(payload["ready"])

    def test_auth_fail_closed_unconfigured_and_wrong_token(self):
        self.mkdemo()
        no_auth = CandidateApp(self.database)
        status, body, _ = request(no_auth, "/api/qullqa/v1/health-checks")
        self.assertEqual(status, "503 Service Unavailable")
        self.assertIsNone(body["rows"])
        app = CandidateApp(self.database, token="synthetic-test-token")
        for token in [None, "Bearer wrong", "Bearer synthetic-test-tokenX"]:
            status, body, _ = request(app, "/api/qullqa/v1/health-checks", token)
            self.assertEqual(status, "403 Forbidden")
            self.assertIsNone(body["rows"])

    def test_authorized_data_still_only_synthetic(self):
        self.mkdemo()
        app = CandidateApp(self.database, token="synthetic-test-token")
        status, body, _ = request(
            app, "/api/qullqa/v1/health-checks", "Bearer synthetic-test-token"
        )
        self.assertEqual(status, "200 OK")
        self.assertEqual(body["origin"], "LOCAL_SYNTHETIC_ONLY")
        self.assertEqual(len(body["rows"]), 1)
        self.assertFalse(body["production_ready"])

    def test_method_denied(self):
        self.mkdemo()
        app = CandidateApp(self.database, token="synthetic-test-token")
        status, body, _ = request(
            app, "/api/qullqa/v1/health-checks", "Bearer synthetic-test-token", "POST"
        )
        self.assertEqual(status, "405 Method Not Allowed")
        self.assertEqual(body["reason"], "READ_ONLY_GET_ONLY")

    def test_unknown_route_no_html_200(self):
        app = CandidateApp()
        status, body, _ = request(app, "/anything")
        self.assertEqual(status, "404 Not Found")
        self.assertFalse(body["production_ready"])

    def test_write_refuses_missing_database_without_creating_one(self):
        with self.assertRaisesRegex(HoldError, "SYNTHETIC_DB_UNAVAILABLE"):
            record_synthetic(self.database, service="test", status="degraded")
        self.assertFalse(self.database.exists())

    def test_write_refuses_foreign_marker_in_same_transaction(self):
        self.mkdemo()
        with closing(sqlite3.connect(self.database)) as db, db:
            db.execute("UPDATE qullqa_identity SET marker = 'FOREIGN_DB'")
        with self.assertRaisesRegex(HoldError, "NOT_A_QULLQA_SYNTHETIC_DB"):
            record_synthetic(self.database, service="test", status="degraded")

    def test_no_unbounded_reads(self):
        self.mkdemo()
        with self.assertRaises(ValueError):
            read_synthetic(self.database, limit=101)
        with self.assertRaises(ValueError):
            read_synthetic(self.database, limit=True)

    def test_actual_loopback_http_negative_and_authorized(self):
        # Actual HTTP over 127.0.0.1 only; no production or public service.
        from threading import Thread
        from urllib.error import HTTPError
        from urllib.request import Request, urlopen
        from wsgiref.simple_server import WSGIRequestHandler, make_server

        class QuietHandler(WSGIRequestHandler):
            def log_message(self, format, *args):
                pass

        self.mkdemo()
        app = CandidateApp(self.database, token="synthetic-test-token")
        server = make_server("127.0.0.1", 0, app, handler_class=QuietHandler)
        t = Thread(target=server.serve_forever, daemon=True)
        t.start()
        try:
            base = "http://127.0.0.1:" + str(server.server_port)
            with urlopen(base + "/healthz", timeout=2) as response:
                self.assertFalse(json.load(response)["production_ready"])
            for route, expect in [
                ("/readyz", 503),
                ("/api/qullqa/v1/health-checks", 403),
            ]:
                with self.assertRaises(HTTPError) as caught:
                    urlopen(base + route, timeout=2)
                self.assertEqual(caught.exception.code, expect)
            req = Request(
                base + "/api/qullqa/v1/health-checks",
                headers={"Authorization": "Bearer synthetic-test-token"},
            )
            with urlopen(req, timeout=2) as response:
                self.assertEqual(json.load(response)["origin"], "LOCAL_SYNTHETIC_ONLY")
        finally:
            server.shutdown()
            server.server_close()
            t.join(timeout=2)

    def test_directory_backup_destination_is_typed_hold(self):
        self.mkdemo()
        directory = self.root / "existing_backup_dir"
        directory.mkdir()
        with self.assertRaisesRegex(HoldError, "DESTINATION_ALREADY_EXISTS"):
            backup_and_verify_synthetic(
                self.database, directory, self.root / "restored.sqlite"
            )
        self.assertTrue(directory.is_dir())

    def test_synthetic_backup_row_cap_fails_before_creating_file(self):
        self.mkdemo()
        with closing(sqlite3.connect(self.database)) as db, db:
            db.executemany(
                "INSERT INTO health_checks (service,status,response_time_ms,checked_at) "
                "VALUES (?,?,?,?)",
                [("synthetic", "degraded", None, "2026-01-01T00:00:00+00:00")] * 10000,
            )
        backup = self.root / "backup.sqlite"
        with self.assertRaisesRegex(HoldError, "SYNTHETIC_DB_ROW_LIMIT"):
            backup_and_verify_synthetic(
                self.database, backup, self.root / "restored.sqlite"
            )
        self.assertFalse(backup.exists())

    def test_malformed_wsgi_authorization_value_denied_not_server_error(self):
        self.mkdemo()
        app = CandidateApp(self.database, token="synthetic-test-token")
        route = "/api/qullqa/v1/health-checks"
        for malformed in (None, b"Bearer synthetic-test-token", ["Bearer"], 123):
            out = {}
            data = b"".join(
                app(
                    {
                        "REQUEST_METHOD": "GET",
                        "PATH_INFO": route,
                        "HTTP_AUTHORIZATION": malformed,
                    },
                    lambda status, h, current=out: current.update(status=status),
                )
            )
            self.assertEqual(out["status"], "403 Forbidden")
            self.assertIsNone(json.loads(data)["rows"])

    def test_invalid_local_auth_token_configuration_fails_closed(self):
        for token in (123, ["synthetic-test-token"]):
            with self.assertRaises(ValueError):
                CandidateApp(self.database, token=token)


if __name__ == "__main__":
    unittest.main()
