#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Tests for szlctl — SZL Holdings estate operations CLI.
#
# CLI ergonomics inspired by jkdevcode/smart-job-cli + gh-follow-sync (MIT).
#
# These tests run fully OFFLINE: the network is mocked. They assert the module
# imports/parses, the table-formatter works on mock data, and the surface-list
# constant carries the expected endpoints. Pure stdlib unittest.
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import szlctl  # noqa: E402


class TestImportAndParse(unittest.TestCase):
    def test_module_imports(self):
        self.assertTrue(hasattr(szlctl, "main"))
        self.assertTrue(hasattr(szlctl, "build_parser"))

    def test_parser_builds_and_has_subcommands(self):
        p = szlctl.build_parser()
        # All five subcommands must parse and bind a handler.
        for cmd, fn in (
            ("surfaces", szlctl.cmd_surfaces),
            ("prs", szlctl.cmd_prs),
            ("fabric", szlctl.cmd_fabric),
            ("forge", szlctl.cmd_forge),
            ("posture", szlctl.cmd_posture),
        ):
            ns = p.parse_args([cmd])
            self.assertEqual(ns.command, cmd)
            self.assertIs(ns.func, fn)

    def test_missing_command_exits(self):
        p = szlctl.build_parser()
        with self.assertRaises(SystemExit):
            p.parse_args([])


class TestSurfaceConstant(unittest.TestCase):
    EXPECTED = (
        "harvest/posture",
        "energy/budget",
        "anatomy/loop",
        "heart/pulse",
        "revenue/marketplace",
        "ayni",
        "research/verify",
        "formula/sovereign",
        "compute-pool",
        "proof",
    )

    def test_surface_list_has_expected_endpoints(self):
        self.assertEqual(tuple(szlctl.SURFACES), self.EXPECTED)
        self.assertEqual(len(szlctl.SURFACES), 10)

    def test_no_duplicate_surfaces(self):
        self.assertEqual(len(set(szlctl.SURFACES)), len(szlctl.SURFACES))

    def test_base_and_prefixes(self):
        self.assertEqual(szlctl.A11OY_BASE, "https://a11oy.net")
        self.assertEqual(szlctl.SURFACE_VIEW_PREFIX, "/v1/")
        self.assertEqual(szlctl.DATA_API_PREFIX, "/api/a11oy/v1/")


class TestSurfaceTableFormatter(unittest.TestCase):
    def setUp(self):
        # Force colour off so assertions are stable.
        self._prev = szlctl._USE_COLOR
        szlctl._USE_COLOR = False

    def tearDown(self):
        szlctl._USE_COLOR = self._prev

    def test_classify_surface(self):
        self.assertTrue(szlctl.classify_surface(200))
        self.assertFalse(szlctl.classify_surface(404))
        self.assertFalse(szlctl.classify_surface(503))
        self.assertFalse(szlctl.classify_surface(None))

    def test_table_all_up(self):
        rows = [
            {"surface": "harvest/posture", "status": 200, "up": True},
            {"surface": "compute-pool", "status": 200, "up": True},
        ]
        out = szlctl.format_surface_table(rows)
        self.assertIn("harvest/posture", out)
        self.assertIn("UP", out)
        self.assertIn("2/2 surfaces serving 200", out)
        self.assertNotIn("DOWN", out)

    def test_table_with_down_and_unavailable(self):
        rows = [
            {"surface": "harvest/posture", "status": 200, "up": True},
            {"surface": "proof", "status": 503, "up": False},
            {"surface": "ayni", "status": None, "up": False},
        ]
        out = szlctl.format_surface_table(rows)
        self.assertIn("DOWN", out)
        self.assertIn("--", out)  # None status renders as --
        self.assertIn("1/3 surfaces serving 200", out)


class TestFabricFormatter(unittest.TestCase):
    def setUp(self):
        self._prev = szlctl._USE_COLOR
        szlctl._USE_COLOR = False

    def tearDown(self):
        szlctl._USE_COLOR = self._prev

    MOCK_POOL = {
        "counts": {"nodes_total": 6, "nodes_reachable": 5, "gpu_nodes_reachable": 1},
        "nodes": [
            {"name": "rtx-betterwithage", "reachable": True, "kind": "sovereign-gpu"},
            {"name": "chaski", "reachable": False, "kind": "tailnet-gpu"},
        ],
    }
    MOCK_POSTURE = {"joules_label": "measured", "should_soak": True,
                    "price_now_eur_mwh": -19.17}

    def test_fabric_renders_nodes_and_label(self):
        out = szlctl.format_fabric(self.MOCK_POOL, self.MOCK_POSTURE)
        self.assertIn("gpu_nodes_reachable : 1", out)
        self.assertIn("rtx-betterwithage", out)
        self.assertIn("chaski", out)
        self.assertIn("joules_label", out)
        self.assertIn("measured", out)

    def test_fabric_unavailable_when_pool_none(self):
        out = szlctl.format_fabric(None, None)
        self.assertIn("unavailable", out)


class TestPostureFormatter(unittest.TestCase):
    def setUp(self):
        self._prev = szlctl._USE_COLOR
        szlctl._USE_COLOR = False

    def tearDown(self):
        szlctl._USE_COLOR = self._prev

    def test_posture_money_signal(self):
        out = szlctl.format_posture({
            "price_now_eur_mwh": -19.17, "next_min_eur_mwh": -25,
            "should_soak": True, "joules_label": "measured",
            "energy_source": "free-public-grid-feeds",
            "grid_price_posture": "negative-price",
        })
        self.assertIn("-19.17", out)
        self.assertIn("should_soak", out)
        self.assertIn("YES", out)
        self.assertIn("measured", out)

    def test_posture_unavailable(self):
        out = szlctl.format_posture(None)
        self.assertIn("unavailable", out)


class TestForgeFormatter(unittest.TestCase):
    def setUp(self):
        self._prev = szlctl._USE_COLOR
        szlctl._USE_COLOR = False

    def tearDown(self):
        szlctl._USE_COLOR = self._prev

    def test_forge_state(self):
        out = szlctl.format_forge({
            "state": "done", "idle": False, "seen_at": "2026-06-13T14:43:58Z",
            "updated_at": "2026-06-13T14:43:58Z", "order_kind": "freeze-hold",
            "order_path": "replit-sync/NEXT_ORDER.md",
            "dispatch_mode": "monitor-hold",
            "freeze_ack": {"freeze_active": True},
        })
        self.assertIn("done", out)
        self.assertIn("freeze-hold", out)
        self.assertIn("freeze_active", out)

    def test_forge_unavailable(self):
        out = szlctl.format_forge(None)
        self.assertIn("unavailable", out)


class TestPRFormatter(unittest.TestCase):
    def setUp(self):
        self._prev = szlctl._USE_COLOR
        szlctl._USE_COLOR = False

    def tearDown(self):
        szlctl._USE_COLOR = self._prev

    def test_disposition_heuristics(self):
        self.assertIn("feature", szlctl.disposition("feat(tools): add x"))
        self.assertIn("fix", szlctl.disposition("fix(api): bug"))
        self.assertIn("docs", szlctl.disposition("docs: update"))
        self.assertIn("proof", szlctl.disposition("proof: lean witness"))
        self.assertEqual(szlctl.disposition("random title"), "review")

    def test_format_prs_items(self):
        items = [{"number": 360, "title": "feat(platform): admission",
                  "repository": {"name": "platform"},
                  "url": "https://github.com/szl-holdings/platform/pull/360"}]
        out = szlctl.format_prs(items)
        self.assertIn("platform#360", out)
        self.assertIn("feature", out)

    def test_format_prs_empty_and_none(self):
        self.assertIn("No open PRs", szlctl.format_prs([]))
        self.assertIn("unavailable", szlctl.format_prs(None))


class TestNetworkHelpersAreMockedOffline(unittest.TestCase):
    """Ensure retry/no-crash behaviour without touching the real network."""

    def test_http_status_no_crash_on_urlerror(self):
        import urllib.error
        with mock.patch("szlctl.urllib.request.urlopen",
                        side_effect=urllib.error.URLError("offline")), \
                mock.patch("szlctl.time.sleep"):
            status, note = szlctl.http_status("https://example.invalid", retries=3)
        self.assertIsNone(status)
        self.assertNotEqual(note, "ok")

    def test_http_status_returns_200(self):
        m = mock.MagicMock()
        m.getcode.return_value = 200
        m.__enter__.return_value = m
        with mock.patch("szlctl.urllib.request.urlopen", return_value=m):
            status, note = szlctl.http_status("https://example.test")
        self.assertEqual(status, 200)
        self.assertEqual(note, "ok")

    def test_http_json_retries_then_fails(self):
        import urllib.error
        calls = {"n": 0}

        def boom(*a, **k):
            calls["n"] += 1
            raise urllib.error.URLError("offline")

        with mock.patch("szlctl.urllib.request.urlopen", side_effect=boom), \
                mock.patch("szlctl.time.sleep"):
            data, note = szlctl.http_json("https://example.invalid", retries=3)
        self.assertIsNone(data)
        self.assertEqual(calls["n"], 3)  # retried exactly 3 times

    def test_run_gh_missing_binary(self):
        with mock.patch("szlctl.subprocess.run", side_effect=FileNotFoundError):
            out, note = szlctl.run_gh(["search", "prs"])
        self.assertIsNone(out)
        self.assertEqual(note, "gh-not-installed")

    def test_surfaces_command_offline_no_crash(self):
        # cmd_surfaces over a fully-mocked failing network must not crash.
        import urllib.error
        with mock.patch("szlctl.urllib.request.urlopen",
                        side_effect=urllib.error.URLError("offline")), \
                mock.patch("szlctl.time.sleep"):
            rc = szlctl.cmd_surfaces(None)
        self.assertEqual(rc, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
