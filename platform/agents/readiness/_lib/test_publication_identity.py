"""Offline publication identity: no real credential, signature, or Hub call.

The signature validator is mocked only for path tests. A separate test keeps
its actual unsigned-receipt gate in the exercised path. These cases qualify
path selection and credential guards, not real signing or publication.
"""
import base64
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
from types import ModuleType
import unittest
from unittest.mock import patch

_SPEC = importlib.util.spec_from_file_location("_readiness_identity_subject", Path(__file__).with_name("khipu.py"))
khipu = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(khipu)


class PublicationIdentityTests(unittest.TestCase):
    def setUp(self):
        self.clock = "2026-11-01T23:00:00Z"
        self.uploads = []
        self.storage = {}
        self.failure = None
        owner = self
        class FakeApi:
            def __init__(self, *, token):
                owner.assertEqual(token, "INERT_TEST_TOKEN")
            def upload_file(self, **kwargs):
                owner.uploads.append(kwargs)
                if owner.failure is not None:
                    raise owner.failure
                owner.storage[kwargs["path_in_repo"]] = kwargs["path_or_fileobj"]
        module = ModuleType("huggingface_hub")
        module.HfApi = FakeApi
        self.enterContext(patch.dict("sys.modules", {"huggingface_hub": module}))
        self.enterContext(patch.dict("os.environ", {"HF_TOKEN": "INERT_TEST_TOKEN"}, clear=True))
        self.enterContext(patch("socket.socket.connect", side_effect=AssertionError("network forbidden")))
        self.enterContext(patch.object(khipu, "utcnow_iso", return_value=self.clock))
        self.signature = self.enterContext(patch.object(khipu, "receipt_signature_error", return_value=None))

    def envelope(self, number):
        body = {"schema": "szl.readiness.receipt/v1", "agent": "offline-test",
                "emitted_at_utc": "2026-10-31T20:00:00Z", "payload": {"number": number}}
        raw = json.dumps(body).encode()
        return {"payload": base64.b64encode(raw).decode(),
                "payloadSha256": hashlib.sha256(raw).hexdigest(),
                "signed": False, "signatures": []}

    def publish(self, envelope):
        return khipu.publish_to_hf("offline-test", envelope)

    def test_distinct_receipts_in_one_second_keep_both_objects(self):
        first, second = self.publish(self.envelope(1)), self.publish(self.envelope(2))
        self.assertIs(first["published"], True)
        self.assertIs(second["published"], True)
        self.assertNotEqual(first["path"], second["path"])
        self.assertEqual(len(self.storage), 2)

    def test_filename_binds_exact_uploaded_bytes(self):
        result = self.publish(self.envelope(1))
        actual = self.uploads[-1]["path_or_fileobj"]
        self.assertTrue(result["path"].endswith("-" + hashlib.sha256(actual).hexdigest() + ".json"))
        self.assertEqual(json.loads(actual), self.envelope(1))

    def test_same_bytes_in_one_second_select_same_object(self):
        first, second = self.publish(self.envelope(1)), self.publish(self.envelope(1))
        self.assertEqual(first["path"], second["path"])
        self.assertEqual(len(self.storage), 1)

    def test_envelope_metadata_is_bound_even_if_payload_is_unchanged(self):
        original = self.envelope(1)
        altered = dict(original, public_note="another envelope")
        first, second = self.publish(original), self.publish(altered)
        self.assertNotEqual(first["path"], second["path"])

    def test_agent_and_emission_date_directory_are_preserved(self):
        result = self.publish(self.envelope(1))
        self.assertTrue(result["path"].startswith("receipts/offline-test/2026-10-31/2026-11-01T23-00-00Z"))
        self.assertEqual(self.uploads[0]["repo_id"], "SZLHOLDINGS/readiness-runs")
        self.assertEqual(self.uploads[0]["repo_type"], "dataset")
        self.signature.assert_called_once()

    def test_actual_unsigned_gate_still_refuses_before_upload(self):
        self.signature.side_effect = ORIGINAL_SIGNATURE_CHECK
        result = self.publish(self.envelope(1))
        self.assertIs(result["published"], False)
        self.assertEqual(result["reason"], "unsigned receipt")
        self.assertEqual(self.uploads, [])

    def test_missing_credential_still_refuses_before_upload(self):
        with patch.dict("os.environ", {}, clear=True):
            result = self.publish(self.envelope(1))
        self.assertIs(result["published"], False)
        self.assertEqual(self.uploads, [])

    def test_failed_upload_does_not_claim_success_or_leak_exception(self):
        self.failure = OSError("INERT_PROVIDER_PRIVATE_DETAIL")
        result = self.publish(self.envelope(1))
        self.assertIs(result["published"], False)
        self.assertEqual(result["reason"], "publisher unavailable")
        self.assertNotIn("INERT_PROVIDER_PRIVATE_DETAIL", json.dumps(result))
        self.assertEqual(self.storage, {})


ORIGINAL_SIGNATURE_CHECK = khipu.receipt_signature_error


class PublicationReaderCompatibilityTests(unittest.TestCase):
    def test_audit_reader_accepts_legacy_and_digest_suffix_names(self):
        executor = Path(__file__).resolve().parents[1] / "readiness-audit-rift" / "executor.py"
        spec = importlib.util.spec_from_file_location("_identity_audit_reader", executor)
        audit = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(audit)
        prefix = "receipts/readiness-test/2026-11-02/"
        legacy = prefix + "2026-11-02T01-00-00Z.json"
        suffixed = prefix + "2026-11-02T01-00-01Z-" + "a" * 64 + ".json"
        later_legacy = prefix + "2026-11-02T01-00-02Z.json"
        body = {"payload": {"marker": "offline-consumer-fixture"}}
        envelope = {"payload": base64.b64encode(json.dumps(body).encode()).decode()}
        module = ModuleType("huggingface_hub")
        with tempfile.TemporaryDirectory() as directory:
            local = Path(directory) / "receipt.json"
            local.write_text(json.dumps(envelope), encoding="utf-8")
            for files, expected in (([legacy], legacy), ([suffixed, legacy], suffixed),
                                    ([later_legacy, suffixed, legacy], later_legacy)):
                with self.subTest(files=files):
                    api = unittest.mock.Mock()
                    api.list_repo_files.return_value = files
                    module.HfApi = unittest.mock.Mock(return_value=api)
                    module.hf_hub_download = unittest.mock.Mock(return_value=str(local))
                    with patch.dict("sys.modules", {"huggingface_hub": module}), \
                            patch.dict("os.environ", {}, clear=True), \
                            patch("socket.socket.connect", side_effect=AssertionError("network forbidden")):
                        result = audit.latest_peer_receipt("readiness-test")
                    self.assertEqual(result["file"], expected)
                    self.assertEqual(result["body"], body)
                    self.assertEqual(module.hf_hub_download.call_args.args[1], expected)


if __name__ == "__main__":
    unittest.main()
