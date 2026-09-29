"""Contract for the readiness fleet's writes to SZLHOLDINGS/readiness-runs.

Stdlib only; huggingface_hub is replaced by an in-memory fake, so nothing here
touches the network or the Hub.

- A receipt that does not reach the dataset fails the run inside GitHub Actions
  (anti-fake-green); a local run without HF_TOKEN only warns.
- All eight agent workflows share the per-asset lock
  hf-write/dataset/SZLHOLDINGS/readiness-runs (HF plan D3), pin the hub client
  (plan D6), and start at least 10 minutes apart (GitHub cancels a pending run
  only when a third run joins the group).

Every readiness workflow runs this suite before its agent, so a scheduled run
with a broken contract fails before it publishes anything.
"""
from __future__ import annotations

import contextlib
import io
import itertools
import os
import re
import sys
import types
import unittest
from pathlib import Path
from unittest import mock

LIB = Path(__file__).resolve().parent
READINESS = LIB.parent
ROOT = READINESS.parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"
LOCK = "hf-write/dataset/SZLHOLDINGS/readiness-runs"
HUB_PIN = "huggingface_hub==2.0.0"
MIN_GAP_MINUTES = 10

sys.path.insert(0, str(LIB))
import khipu  # noqa: E402


class _FakeHfApi:
    uploads: list[dict] = []
    error: Exception | None = None

    def __init__(self, token: str) -> None:
        self.token = token

    def upload_file(self, **kwargs) -> None:
        if _FakeHfApi.error is not None:
            raise _FakeHfApi.error
        _FakeHfApi.uploads.append(kwargs)


def _fake_hub() -> types.ModuleType:
    module = types.ModuleType("huggingface_hub")
    module.HfApi = _FakeHfApi
    return module


class EmitFailsClosedTest(unittest.TestCase):
    def setUp(self) -> None:
        _FakeHfApi.uploads = []
        _FakeHfApi.error = None
        patcher = mock.patch.dict(sys.modules, {"huggingface_hub": _fake_hub()})
        patcher.start()
        self.addCleanup(patcher.stop)

    def _emit(self, env: dict) -> tuple[str, dict | None, int | None]:
        out = io.StringIO()
        with mock.patch.dict(os.environ, env, clear=True), contextlib.redirect_stdout(out):
            try:
                result = khipu.emit("readiness-test", {"ok": True})
                return out.getvalue(), result, None
            except SystemExit as exc:
                return out.getvalue(), None, exc.code

    def test_published_receipt_passes_and_lands_under_the_agent_path(self) -> None:
        text, result, code = self._emit({"GITHUB_ACTIONS": "true", "HF_TOKEN": "t"})
        self.assertIsNone(code)
        self.assertTrue(result["publish"]["published"])
        (upload,) = _FakeHfApi.uploads
        self.assertEqual(upload["repo_id"], "SZLHOLDINGS/readiness-runs")
        self.assertEqual(upload["repo_type"], "dataset")
        self.assertRegex(
            upload["path_in_repo"],
            r"^receipts/readiness-test/\d{4}-\d{2}-\d{2}/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$",
        )
        self.assertNotIn("::error", text)

    def test_rejected_publish_fails_the_run_after_printing_the_receipt(self) -> None:
        _FakeHfApi.error = RuntimeError("Bad request")
        text, _result, code = self._emit({"GITHUB_ACTIONS": "true", "HF_TOKEN": "t"})
        self.assertEqual(code, 1)
        self.assertIn('"published": false', text)
        self.assertIn("::error title=readiness publish failed::readiness-test receipt", text)
        self.assertIn("RuntimeError: Bad request", text)
        self.assertLess(text.index('"receipt"'), text.index("::error"))

    def test_missing_token_fails_the_run_in_actions(self) -> None:
        text, _result, code = self._emit({"GITHUB_ACTIONS": "true"})
        self.assertEqual(code, 1)
        self.assertIn("no HF_TOKEN", text)
        self.assertEqual(_FakeHfApi.uploads, [])

    def test_local_run_without_token_only_warns(self) -> None:
        text, result, code = self._emit({})
        self.assertIsNone(code)
        self.assertFalse(result["publish"]["published"])
        self.assertIn("WARNING: readiness-test receipt not published", text)

    def test_unuploaded_dr_dump_fails_the_run_in_actions(self) -> None:
        out = io.StringIO()
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}, clear=True), \
                contextlib.redirect_stdout(out):
            with self.assertRaises(SystemExit) as caught:
                khipu.require_published(
                    [{"uploaded": True}, {"uploaded": False, "reason": "HTTPError: 400"}],
                    what="DR dump",
                )
        self.assertEqual(caught.exception.code, 1)
        self.assertIn("DR dump not published", out.getvalue())
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}, clear=True):
            khipu.require_published([{"uploaded": True}, {"published": True}], what="x")


def _agents() -> list[str]:
    return sorted(
        path.name for path in READINESS.iterdir()
        if path.is_dir() and path.name.startswith("readiness-")
    )


def _slots(cron: str) -> list[int]:
    minute, hour, dom, month, dow = cron.split()
    assert (dom, month, dow) == ("*", "*", "*"), cron
    hours = range(24) if hour == "*" else [int(hour)]
    return [h * 60 + int(minute) for h in hours]


class FleetWorkflowContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.agents = _agents()
        self.assertEqual(len(self.agents), 8)
        self.text = {
            agent: (WORKFLOWS / f"{agent}.yml").read_text(encoding="utf-8")
            for agent in self.agents
        }

    def test_every_agent_holds_the_shared_per_asset_lock(self) -> None:
        for agent, text in self.text.items():
            with self.subTest(agent=agent):
                self.assertRegex(
                    text,
                    rf"(?m)^concurrency:\n  group: {re.escape(LOCK)}\n  cancel-in-progress: false$",
                )
                self.assertNotIn("event_name", text)

    def test_every_agent_runs_this_contract_before_its_agent(self) -> None:
        for agent, text in self.text.items():
            with self.subTest(agent=agent):
                contract = text.find("-m unittest discover -s platform/agents/readiness/_lib")
                executor = text.find(f"platform/agents/readiness/{agent}/executor.py")
                self.assertGreater(contract, 0)
                self.assertGreater(executor, contract)

    def test_every_agent_pins_the_hub_client(self) -> None:
        for agent, text in self.text.items():
            with self.subTest(agent=agent):
                installs = [line for line in text.splitlines() if "pip install" in line]
                self.assertEqual(len(installs), 1)
                self.assertRegex(installs[0], rf"(?<![\w-]){re.escape(HUB_PIN)}(?![\w.])")

    def test_schedules_never_share_a_ten_minute_window(self) -> None:
        slots = []
        for agent, text in self.text.items():
            crons = re.findall(r'(?m)^\s+- cron: "([^"]+)"', text)
            self.assertEqual(len(crons), 1, agent)
            slots.extend((slot, agent) for slot in _slots(crons[0]))
        for (a, agent_a), (b, agent_b) in itertools.combinations(sorted(slots), 2):
            gap = min(abs(a - b), 1440 - abs(a - b))
            if agent_a != agent_b:
                self.assertGreaterEqual(gap, MIN_GAP_MINUTES, (agent_a, a, agent_b, b))

    def test_audit_rift_runs_after_every_daily_agent(self) -> None:
        daily = {}
        for agent, text in self.text.items():
            (cron,) = re.findall(r'(?m)^\s+- cron: "([^"]+)"', text)
            if cron.split()[1] != "*":
                daily[agent] = _slots(cron)[0]
        audit = daily.pop("readiness-audit-rift")
        self.assertTrue(daily)
        self.assertGreater(audit, max(daily.values()))


if __name__ == "__main__":
    unittest.main(verbosity=2)
