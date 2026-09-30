"""Offline NDJSON restore checks; no flagship, Hub, or production store writes."""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import sqlite3
import unittest
from pathlib import Path
import unittest.mock as mock

EXECUTOR = Path(__file__).resolve().parent.parent / "readiness-dr" / "executor.py"
SPEC = importlib.util.spec_from_file_location("readiness_dr_executor", EXECUTOR)
dr = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(dr)


def ndjson(*records: dict) -> bytes:
    return ("\n".join(json.dumps(record, ensure_ascii=False) for record in records) + "\n").encode("utf-8")


class RestoreProofTest(unittest.TestCase):
    def assert_rejected(self, dump: bytes) -> dict:
        proof = dr.restore_proof(dump)
        self.assertIs(proof["restored"], False)
        self.assertTrue(proof["reason"])
        return proof

    def test_html_is_not_a_restored_record(self) -> None:
        self.assert_rejected(b"<html>fallback page</html>")

    def test_empty_or_blank_dump_is_rejected(self) -> None:
        for dump in (b"", b"\n \r\n\t"):
            with self.subTest(dump=dump):
                self.assert_rejected(dump)

    def test_invalid_utf8_is_rejected_without_replacement(self) -> None:
        self.assert_rejected(b'{"key":"a","value":"\xff"}\n')

    def test_json_must_be_one_object_record_per_line(self) -> None:
        for dump in (b"not json", b"null", b"true", b"1", b'"text"', b"[]",
                     b'[{"key":"a","value":1}]', b'{\n"key":"a","value":1\n}'):
            with self.subTest(dump=dump):
                self.assert_rejected(dump)

    def test_record_requires_nonempty_string_key_and_value_field(self) -> None:
        for record in ({}, {"value": 1}, {"key": "a"}, {"key": "", "value": 1},
                       {"key": 1, "value": 1}, {"key": True, "value": 1},
                       {"key": None, "value": 1}):
            with self.subTest(record=record):
                self.assert_rejected(ndjson(record))

    def test_duplicate_record_keys_are_rejected_even_if_values_match(self) -> None:
        for value in (1, 2):
            with self.subTest(second_value=value):
                self.assert_rejected(ndjson({"key": "a", "value": 1},
                                           {"key": "a", "value": value}))

    def test_duplicate_json_fields_are_rejected(self) -> None:
        for dump in (b'{"key":"a","key":"b","value":1}',
                     b'{"key":"a","value":1,"value":2}',
                     b'{"key":"a","value":{"x":1,"x":2}}'):
            with self.subTest(dump=dump):
                self.assert_rejected(dump)

    def test_nonfinite_json_values_are_rejected(self) -> None:
        for number in ("NaN", "Infinity", "-Infinity", "1e400"):
            with self.subTest(number=number):
                self.assert_rejected(('{"key":"a","value":' + number + '}').encode())

    def test_one_bad_line_rejects_entire_dump_before_sqlite_restore(self) -> None:
        dump = ndjson({"key": "a", "value": 1}) + b"not JSON\n"
        with mock.patch.object(dr.sqlite3, "connect") as connect:
            proof = self.assert_rejected(dump)
        self.assertEqual(proof["line"], 2)
        connect.assert_not_called()

    def test_valid_records_round_trip_every_supplied_key_and_value(self) -> None:
        dump = ndjson({"key": "z", "value": {"nested": [1, True, None, "unicode λ"]}},
                      {"key": "λ", "value": None}, {"key": "a", "value": [0, False]})
        proof = dr.restore_proof(dump)
        self.assertIs(proof["restored"], True)
        self.assertEqual(proof["rows"], 3)
        self.assertEqual(proof["verified_rows"], 3)
        self.assertEqual(proof["restore_target"], "in-memory SQLite")

    def test_blank_lines_around_valid_records_are_allowed(self) -> None:
        proof = dr.restore_proof(b"\n " + ndjson({"key": "a", "value": ""}) + b"\n\t")
        self.assertIs(proof["restored"], True)
        self.assertEqual(proof["rows"], 1)

    def test_json_unicode_separators_are_preserved_inside_a_record(self) -> None:
        proof = dr.restore_proof(ndjson({"key": "key\u2028separator", "value": "value\u2029separator"}))
        self.assertIs(proof["restored"], True)
        self.assertEqual(proof["sample_key"], "key\u2028separator")

    def test_non_json_whitespace_is_not_silently_removed(self) -> None:
        for prefix in (b"\x0b", "\u00a0".encode("utf-8")):
            with self.subTest(prefix=prefix):
                self.assert_rejected(prefix + ndjson({"key": "a", "value": 1}))

    def test_a_corrupted_second_sqlite_row_fails_integrity(self) -> None:
        real_connect = sqlite3.connect

        class CorruptingConnection(sqlite3.Connection):
            def commit(self) -> None:
                super().commit()
                self.execute("UPDATE unay SET v=? WHERE k=?", ('"changed"', "second"))
                super().commit()

        def connect(*args, **kwargs):
            return real_connect(*args, factory=CorruptingConnection, **kwargs)

        dump = ndjson({"key": "first", "value": 1}, {"key": "second", "value": 2})
        with mock.patch.object(dr.sqlite3, "connect", side_effect=connect):
            proof = self.assert_rejected(dump)
        self.assertIn("integrity", proof["reason"])

    def test_sqlite_error_is_an_explicit_failed_restore(self) -> None:
        with mock.patch.object(dr.sqlite3, "connect", side_effect=sqlite3.OperationalError("offline fault")):
            self.assert_rejected(ndjson({"key": "a", "value": 1}))


class FlagshipRestoreTest(unittest.TestCase):
    flagship = {"name": "a11oy", "url_env": "A11OY_URL"}

    def setUp(self) -> None:
        patcher = mock.patch.dict(os.environ, {"A11OY_URL": "https://offline.invalid"}, clear=True)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_html_endpoint_response_is_red(self) -> None:
        with mock.patch.object(dr, "fetch", return_value=b"<html>fallback page</html>"):
            result = dr.dr_flagship(self.flagship)
        self.assertEqual(result["verdict"], "RED")
        self.assertIs(result["restore_proof"]["restored"], False)

    def test_empty_endpoint_response_is_red(self) -> None:
        with mock.patch.object(dr, "fetch", return_value=b""):
            result = dr.dr_flagship(self.flagship)
        self.assertEqual(result["verdict"], "RED")

    def test_valid_restore_is_bounded_to_local_sqlite(self) -> None:
        with mock.patch.object(dr, "fetch", return_value=ndjson({"key": "a", "value": 1})):
            result = dr.dr_flagship(self.flagship)
        self.assertEqual(result["verdict"], "GREEN")
        self.assertEqual(result["restore_proof"]["restore_target"], "in-memory SQLite")
        self.assertIs(result["upload"]["uploaded"], False)

    def test_successful_local_restore_does_not_bypass_failed_publish(self) -> None:
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}), \
                mock.patch.object(dr.khipu, "FLAGSHIPS", [self.flagship]), \
                mock.patch.object(dr.khipu, "emit"), \
                mock.patch.object(dr, "fetch", return_value=ndjson({"key": "a", "value": 1})), \
                contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                dr.main()
        self.assertEqual(caught.exception.code, 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
