# SPDX-License-Identifier: Apache-2.0
"""Dependency-free contracts for kernel truthfulness and receipt security."""

from __future__ import annotations

import asyncio
import base64
import concurrent.futures
import importlib.util
import json
import os
import sys
import tempfile
import threading
import time
import types
import unittest
from pathlib import Path
from unittest import mock


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
MODULE_PATH = REPOSITORY_ROOT / "packages/szl-kernels/deploy/szl_kernels_organ.py"
WORKFLOW_PATH = REPOSITORY_ROOT / ".github/workflows/warm-flagships.yml"
SPEC = importlib.util.spec_from_file_location("szl_kernels_organ_under_test", MODULE_PATH)
if SPEC is None or SPEC.loader is None:  # pragma: no cover - import machinery invariant
    raise RuntimeError(f"cannot load {MODULE_PATH}")
KERNELS = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = KERNELS
SPEC.loader.exec_module(KERNELS)

TOKEN = "wake-receipt-test-token-32-bytes-minimum"
ADMIN_TOKEN = "admin-kernel-test-token-32-bytes-minimum"
ENDPOINT = "/api/a11oy/v3/kernels/wake-receipt"
TICK_ENDPOINT = "/api/a11oy/v3/kernels/{name}/tick"
START_ENDPOINT = "/api/a11oy/v3/kernels/{name}/start"
STOP_ENDPOINT = "/api/a11oy/v3/kernels/{name}/stop"
_MISSING = object()


class StubJSONResponse:
    def __init__(
        self,
        content: object,
        status_code: int = 200,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.content = content
        self.status_code = status_code
        self.headers = {key.lower(): value for key, value in (headers or {}).items()}

    def json(self) -> object:
        return self.content


class StubStreamingResponse:
    def __init__(self, content: object, media_type: str | None = None) -> None:
        self.content = content
        self.media_type = media_type


class StubRequestType:
    pass


class FakeRequest:
    def __init__(
        self,
        body: bytes,
        headers: dict[str, str],
        query_params: dict[str, str] | None = None,
        stream_barrier: threading.Barrier | None = None,
    ) -> None:
        self._body = body
        self._stream_barrier = stream_barrier
        self.headers = {key.lower(): value for key, value in headers.items()}
        self.query_params = query_params or {}

    async def stream(self):
        if self._stream_barrier is not None:
            self._stream_barrier.wait(timeout=5)
        yield self._body


class FakeApp:
    def __init__(self) -> None:
        self.routes: dict[tuple[str, str], object] = {}
        self.events: dict[str, list[object]] = {}

    def _route(self, method: str, path: str):
        def decorator(handler):
            self.routes[(method, path)] = handler
            return handler

        return decorator

    def get(self, path: str):
        return self._route("GET", path)

    def post(self, path: str):
        return self._route("POST", path)

    def on_event(self, event: str):
        def decorator(handler):
            self.events.setdefault(event, []).append(handler)
            return handler

        return decorator


class FakeClient:
    def __init__(self, app: FakeApp) -> None:
        self.app = app

    def post(self, path: str, **kwargs) -> StubJSONResponse:
        payload = kwargs.get("json", _MISSING)
        content = kwargs.get("content", b"")
        headers = dict(kwargs.get("headers") or {})
        if payload is not _MISSING:
            content = json.dumps(payload).encode("utf-8")
            headers.setdefault("Content-Type", "application/json")
        elif isinstance(content, str):
            content = content.encode("utf-8")
        headers.setdefault("Content-Length", str(len(content)))
        request = FakeRequest(
            content,
            headers,
            query_params=kwargs.get("query_params"),
            stream_barrier=kwargs.get("stream_barrier"),
        )
        handler = self.app.routes[("POST", path)]
        return asyncio.run(handler(request, **(kwargs.get("path_params") or {})))

    def close(self) -> None:
        return None


def stub_framework_modules() -> dict[str, types.ModuleType]:
    fastapi = types.ModuleType("fastapi")
    fastapi.__path__ = []
    responses = types.ModuleType("fastapi.responses")
    responses.JSONResponse = StubJSONResponse
    responses.StreamingResponse = StubStreamingResponse
    fastapi.responses = responses

    starlette = types.ModuleType("starlette")
    starlette.__path__ = []
    requests = types.ModuleType("starlette.requests")
    requests.Request = StubRequestType
    starlette.requests = requests
    return {
        "fastapi": fastapi,
        "fastapi.responses": responses,
        "starlette": starlette,
        "starlette.requests": requests,
    }


def valid_payload() -> dict[str, str]:
    return {
        "source": "github-actions/warm-flagships",
        "repository": "szl-holdings/platform",
        "run": "123456789",
        "run_attempt": "1",
        "sha": "a" * 40,
        "event": "schedule",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def timestamp_for(epoch: float) -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(epoch))


class KernelActionTruthfulnessTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.environment = mock.patch.dict(
            os.environ, {"SZL_CODEX_DIR": self.temporary_directory.name}
        )
        self.environment.start()
        self.kernels = []

    def tearDown(self) -> None:
        for kernel in self.kernels:
            kernel.codex._conn.close()
        self.environment.stop()
        self.temporary_directory.cleanup()

    def build(self, organ: str) -> list[object]:
        kernels = KERNELS.build_kernels(organ)
        self.kernels.extend(kernels)
        return kernels

    def test_all_unconnected_actions_across_all_organs_report_unavailable(self) -> None:
        self.assertEqual(
            set(KERNELS.VERTICALS), {"a11oy", "amaru", "killinchu", "rosie", "sentra"}
        )

        for organ in sorted(KERNELS.VERTICALS):
            kernels = self.build(organ)
            self.assertEqual(len(kernels), 9)
            for kernel in kernels:
                if kernel.name == "chain":
                    continue
                with self.subTest(organ=organ, kernel=kernel.name):
                    result = asyncio.run(kernel.tick(force=True))
                    self.assertIs(result["alive"], True)
                    self.assertIs(result["did_work"], False)
                    self.assertEqual(
                        result["summary"], KERNELS.SUBSTRATE_UNAVAILABLE_SUMMARY
                    )
                    self.assertEqual(kernel.codex.count(), 1)

    def test_chain_reports_only_local_codex_hash_chain_verification(self) -> None:
        for organ in sorted(KERNELS.VERTICALS):
            chain = next(
                kernel for kernel in self.build(organ) if kernel.name == "chain"
            )
            chain.codex.append({"fixture": "local-chain-verification"})

            with self.subTest(organ=organ):
                result = asyncio.run(chain.act({"work": False}))
                self.assertEqual(
                    result,
                    {
                        "did_work": True,
                        "summary": (
                            "local Codex hash-chain verification ok=True checked=1"
                        ),
                    },
                )
                self.assertNotIn("Reed-Solomon", result["summary"])

                chain.codex._conn.execute(
                    "UPDATE entries SET entry_hash = ?", ("sha256:" + ("0" * 64),)
                )
                chain.codex._conn.commit()
                tampered_result = asyncio.run(chain.act({"work": False}))
                self.assertEqual(
                    tampered_result,
                    {
                        "did_work": True,
                        "summary": (
                            "local Codex hash-chain verification ok=False checked=0"
                        ),
                    },
                )


class WakeReceiptEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.environment = mock.patch.dict(
            os.environ,
            {
                "SZL_CODEX_DIR": self.temporary_directory.name,
                "SZL_ADMIN_TOKEN": "",
                "SZL_WAKE_RECEIPT_TOKEN": "",
            },
        )
        self.environment.start()
        self.managers = []
        self.clients = []

    def tearDown(self) -> None:
        for client in self.clients:
            client.close()
        for manager in self.managers:
            for kernel in manager.kernels.values():
                kernel.codex._conn.close()
        self.environment.stop()
        self.temporary_directory.cleanup()

    def make_client(
        self, token: str = TOKEN, admin_token: str | None = None
    ) -> tuple[FakeClient, object]:
        app = FakeApp()
        with mock.patch.dict(sys.modules, stub_framework_modules()):
            manager = KERNELS.register(
                app,
                organ="a11oy",
                admin_token=admin_token,
                wake_receipt_token=token,
            )
        client = FakeClient(app)
        self.managers.append(manager)
        self.clients.append(client)
        return client, manager

    @staticmethod
    def authorization(token: str = TOKEN) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

    def test_missing_server_secret_fails_closed(self) -> None:
        client, manager = self.make_client(token="")

        response = client.post(ENDPOINT, json=valid_payload())

        self.assertEqual(response.status_code, 503)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_missing_and_wrong_bearer_tokens_are_unauthorized(self) -> None:
        client, manager = self.make_client()

        missing = client.post(ENDPOINT, json=valid_payload())
        wrong = client.post(
            ENDPOINT,
            json=valid_payload(),
            headers=self.authorization(ADMIN_TOKEN),
        )

        self.assertEqual(missing.status_code, 401)
        self.assertEqual(wrong.status_code, 401)
        self.assertEqual(missing.headers["www-authenticate"], "Bearer")
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_valid_authenticated_receipt_is_normalized_before_append(self) -> None:
        client, manager = self.make_client()
        payload = valid_payload()

        response = client.post(
            ENDPOINT, json=payload, headers=self.authorization()
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertFalse(response.json()["replay"])
        self.assertEqual(response.json()["entry_hash"], response.json()["codex_head"])
        entries = manager.get("sign").codex.read(limit=1)
        self.assertEqual(len(entries), 1)
        envelope = entries[0]["signed_payload"]
        stored = json.loads(base64.b64decode(envelope["payload"]))
        self.assertEqual(stored["schema"], "szl.wake-receipt.v1")
        self.assertEqual(stored["source"], "github-actions/warm-flagships")
        self.assertEqual(stored["repository"], "szl-holdings/platform")
        self.assertEqual(stored["revision"], "a" * 40)
        self.assertEqual(stored["reported_at"], payload["ts"])
        self.assertIn("received_at", stored)

    def test_retry_returns_original_receipt_without_second_append(self) -> None:
        client, manager = self.make_client()
        now = 1_800_000_000.0
        payload = {**valid_payload(), "ts": timestamp_for(now)}

        with mock.patch.object(KERNELS, "_unix_time", return_value=now):
            first = client.post(
                ENDPOINT, json=payload, headers=self.authorization()
            )
            manager.get("sign").codex.append({"event": "intervening-sign-tick"})
            retry = client.post(
                ENDPOINT,
                json={**payload, "ts": timestamp_for(now + 1)},
                headers=self.authorization(),
            )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(retry.status_code, 200)
        self.assertFalse(first.json()["replay"])
        self.assertTrue(retry.json()["replay"])
        self.assertEqual(retry.json()["entry_id"], first.json()["entry_id"])
        self.assertEqual(retry.json()["entry_hash"], first.json()["entry_hash"])
        self.assertNotEqual(retry.json()["codex_head"], retry.json()["entry_hash"])
        self.assertEqual(retry.json()["codex_head"], manager.get("sign").codex.head_hash())
        self.assertEqual(manager.get("sign").codex.count(), 2)

    def test_idempotency_key_reuse_with_substantive_drift_conflicts(self) -> None:
        client, manager = self.make_client()
        payload = valid_payload()
        first = client.post(ENDPOINT, json=payload, headers=self.authorization())

        conflict = client.post(
            ENDPOINT,
            json={**payload, "sha": "b" * 40},
            headers=self.authorization(),
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(manager.get("sign").codex.count(), 1)

    def test_concurrent_retries_append_once_across_sqlite_connections(self) -> None:
        first_client, first_manager = self.make_client()
        second_client, second_manager = self.make_client()
        barrier = threading.Barrier(2)
        now = 1_800_000_000.0
        payload = {**valid_payload(), "ts": timestamp_for(now)}

        def send(client: FakeClient) -> StubJSONResponse:
            return client.post(
                ENDPOINT,
                json=payload,
                headers=self.authorization(),
                stream_barrier=barrier,
            )

        with mock.patch.object(KERNELS, "_unix_time", return_value=now):
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                responses = list(executor.map(send, (first_client, second_client)))

        self.assertEqual([response.status_code for response in responses], [200, 200])
        bodies = [response.json() for response in responses]
        self.assertEqual({body["replay"] for body in bodies}, {False, True})
        self.assertEqual(len({body["entry_id"] for body in bodies}), 1)
        self.assertEqual(len({body["entry_hash"] for body in bodies}), 1)
        self.assertEqual(first_manager.get("sign").codex.count(), 1)
        self.assertEqual(second_manager.get("sign").codex.count(), 1)

    def test_stale_and_future_timestamps_are_rejected(self) -> None:
        client, manager = self.make_client()
        now = 1_800_000_000.0

        with mock.patch.object(KERNELS, "_unix_time", return_value=now):
            for delta in (
                -(KERNELS.WAKE_RECEIPT_MAX_CLOCK_SKEW_SECONDS + 1),
                KERNELS.WAKE_RECEIPT_MAX_CLOCK_SKEW_SECONDS + 1,
            ):
                with self.subTest(delta=delta):
                    response = client.post(
                        ENDPOINT,
                        json={**valid_payload(), "ts": timestamp_for(now + delta)},
                        headers=self.authorization(),
                    )
                    self.assertEqual(response.status_code, 400)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_malformed_json_is_rejected_without_append(self) -> None:
        client, manager = self.make_client()

        response = client.post(
            ENDPOINT,
            content=b'{"source":',
            headers={**self.authorization(), "Content-Type": "application/json"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_oversized_body_is_rejected_without_append(self) -> None:
        client, manager = self.make_client()

        response = client.post(
            ENDPOINT,
            content=b"{" + (b"x" * KERNELS.WAKE_RECEIPT_MAX_BODY_BYTES) + b"}",
            headers={
                **self.authorization(),
                "Content-Type": "application/json",
                "Content-Length": "1",
            },
        )

        self.assertEqual(response.status_code, 413)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_unknown_and_missing_keys_are_rejected(self) -> None:
        client, manager = self.make_client()
        unknown = {**valid_payload(), "unexpected": "value"}
        missing = valid_payload()
        del missing["sha"]

        for payload in (unknown, missing):
            with self.subTest(keys=sorted(payload)):
                response = client.post(
                    ENDPOINT, json=payload, headers=self.authorization()
                )
                self.assertEqual(response.status_code, 400)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_source_and_repository_must_match_the_canonical_caller(self) -> None:
        client, manager = self.make_client()

        for field, value in (
            ("source", "untrusted-caller"),
            ("repository", "someone/fork"),
        ):
            payload = {**valid_payload(), field: value}
            with self.subTest(field=field):
                response = client.post(
                    ENDPOINT, json=payload, headers=self.authorization()
                )
                self.assertEqual(response.status_code, 400)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_bad_run_and_timestamp_values_are_rejected(self) -> None:
        client, manager = self.make_client()

        invalid_values = (
            ("run", "0"),
            ("run", "01"),
            ("run", "not-a-run"),
            ("run_attempt", "0"),
            ("ts", "2026-10-06 03:28:06Z"),
            ("ts", "2026-02-30T03:28:06Z"),
        )
        for field, value in invalid_values:
            with self.subTest(field=field, value=value):
                response = client.post(
                    ENDPOINT,
                    json={**valid_payload(), field: value},
                    headers=self.authorization(),
                )
                self.assertEqual(response.status_code, 400)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_duplicate_json_keys_and_wrong_content_type_are_rejected(self) -> None:
        client, manager = self.make_client()
        duplicate_source = json.dumps(valid_payload())[:-1] + ',"source":"other"}'

        duplicate = client.post(
            ENDPOINT,
            content=duplicate_source,
            headers={**self.authorization(), "Content-Type": "application/json"},
        )
        wrong_type = client.post(
            ENDPOINT,
            content=json.dumps(valid_payload()),
            headers={**self.authorization(), "Content-Type": "text/plain"},
        )

        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(wrong_type.status_code, 415)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_tick_fails_closed_when_admin_secret_is_unavailable_or_invalid(self) -> None:
        for token in ("", "too-short"):
            client, manager = self.make_client(admin_token=token)

            response = client.post(TICK_ENDPOINT, path_params={"name": "sign"})

            with self.subTest(token_length=len(token)):
                self.assertEqual(response.status_code, 503)
                self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_equal_admin_and_wake_tokens_disable_both_mutation_gates(self) -> None:
        client, manager = self.make_client(token=TOKEN, admin_token=TOKEN)

        wake = client.post(
            ENDPOINT,
            json=valid_payload(),
            headers=self.authorization(TOKEN),
        )
        tick = client.post(
            TICK_ENDPOINT,
            path_params={"name": "sign"},
            headers=self.authorization(TOKEN),
        )

        self.assertEqual(wake.status_code, 503)
        self.assertEqual(tick.status_code, 503)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_tick_rejects_missing_wrong_and_legacy_admin_credentials(self) -> None:
        client, manager = self.make_client(admin_token=ADMIN_TOKEN)
        attempts = (
            {},
            {"headers": self.authorization("x" * 40)},
            {"headers": self.authorization(TOKEN)},
            {"headers": {"x-szl-admin-token": ADMIN_TOKEN}},
            {"query_params": {"admin_token": ADMIN_TOKEN}},
        )

        for attempt in attempts:
            with self.subTest(attempt=attempt):
                response = client.post(
                    TICK_ENDPOINT,
                    path_params={"name": "sign"},
                    **attempt,
                )
                self.assertEqual(response.status_code, 401)
        self.assertEqual(manager.get("sign").codex.count(), 0)

    def test_tick_accepts_strong_admin_bearer_and_writes_one_receipt(self) -> None:
        client, manager = self.make_client(admin_token=ADMIN_TOKEN)

        response = client.post(
            TICK_ENDPOINT,
            path_params={"name": "sign"},
            headers=self.authorization(ADMIN_TOKEN),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIs(response.json()["alive"], True)
        self.assertIs(response.json()["did_work"], False)
        self.assertEqual(
            response.json()["summary"], KERNELS.SUBSTRATE_UNAVAILABLE_SUMMARY
        )
        self.assertEqual(manager.get("sign").codex.count(), 1)

    def test_start_and_stop_share_header_only_admin_gate(self) -> None:
        client, manager = self.make_client(admin_token=ADMIN_TOKEN)
        manager.start = mock.Mock(return_value=True)
        manager.stop = mock.Mock(return_value=True)

        for endpoint in (START_ENDPOINT, STOP_ENDPOINT):
            blocked = client.post(
                endpoint,
                path_params={"name": "sign"},
                query_params={"admin_token": ADMIN_TOKEN},
            )
            self.assertEqual(blocked.status_code, 401)

        started = client.post(
            START_ENDPOINT,
            path_params={"name": "sign"},
            headers=self.authorization(ADMIN_TOKEN),
        )
        stopped = client.post(
            STOP_ENDPOINT,
            path_params={"name": "sign"},
            headers=self.authorization(ADMIN_TOKEN),
        )

        self.assertEqual(started.status_code, 200)
        self.assertEqual(stopped.status_code, 200)
        manager.start.assert_called_once_with("sign")
        manager.stop.assert_called_once_with("sign")


class WakeReceiptWorkflowContractTests(unittest.TestCase):
    def test_workflow_fails_before_curl_when_dedicated_secret_is_absent(self) -> None:
        workflow = WORKFLOW_PATH.read_text(encoding="utf-8")
        wake_job = workflow[workflow.index("  wake-receipt:") :]

        self.assertIn(
            "SZL_WAKE_RECEIPT_TOKEN: ${{ secrets.SZL_WAKE_RECEIPT_TOKEN }}", wake_job
        )
        guard = wake_job.index('if [ -z "${SZL_WAKE_RECEIPT_TOKEN:-}" ]')
        failure = wake_job.index("exit 1", guard)
        request = wake_job.index("curl ", failure)
        self.assertLess(guard, failure)
        self.assertLess(failure, request)
        self.assertIn("authorization: Bearer ${SZL_WAKE_RECEIPT_TOKEN}", wake_job)
        self.assertIn("--max-filesize 4096", wake_job)
        self.assertIn("wake-receipt response contract -> PASS", wake_job)
        for field in (
            "source",
            "repository",
            "run",
            "run_attempt",
            "sha",
            "event",
            "ts",
        ):
            self.assertIn(f'"{field}"', wake_job)
        self.assertNotIn("set +e", wake_job)
        self.assertNotIn("admin_token", wake_job)


if __name__ == "__main__":
    unittest.main()
