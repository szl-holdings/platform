"""Agentic-GPU endpoints come from configuration and fail closed (no network).

The laptop's old tailnet address used to be hard-coded across this app. These
contracts prove it is gone and that every former call site now:
  - reads SZL_OLLAMA_ENDPOINT / SZL_VLLM_ENDPOINT (validated by vllm_backend),
  - treats an unset endpoint as "not configured" and never probes it,
  - refuses an invalid configured endpoint instead of probing it.
Any probe that could leave the process is replaced by a mock that records it.
"""
import ast
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import harvest_runner
import swarm
import vllm_backend as backend
import vllm_metrics

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
SERVICE = REPO / "deploy" / "agentic-gpu-harvest.service"
STALE = ".".join(("100", "125", "77", "31"))  # spelled so this file stays clean
ENV_KEYS = (backend.OLLAMA_ENDPOINT_ENV, backend.VLLM_ENDPOINT_ENV,
            backend.INSECURE_LAN_ENV)
OLLAMA = "http://127.0.0.1:11434/v1"
VLLM = "http://127.0.0.1:8000/v1"


def _env_without_endpoints(**extra):
    env = {k: v for k, v in os.environ.items() if k not in ENV_KEYS}
    env.update(extra)
    return env


def _fresh_import(code, **extra):
    """Run `code` in a clean interpreter so import-time constants are re-read."""
    prog = f"import sys; sys.path.insert(0, {str(HERE)!r})\n{code}"
    done = subprocess.run([sys.executable, "-I", "-c", prog],
                          env=_env_without_endpoints(**extra), cwd=str(HERE),
                          capture_output=True, text=True, timeout=60, check=True)
    return json.loads(done.stdout.strip().splitlines()[-1])


_DEFAULTS = (
    "import json, daemon, swarm, vllm_backend, vllm_metrics\n"
    "d = daemon.ResidentDaemon(probe=daemon.probe_endpoint)\n"
    "d._update_posture()\n"
    "a = swarm.default_anchor()\n"
    "c = vllm_backend.select_backend(vllm_probe=lambda: True, ollama_probe=lambda: False)\n"
    "print(json.dumps({'local': daemon.LOCAL_ENDPOINT, 'vllm': daemon.VLLM_ENDPOINT,"
    " 'metrics': vllm_metrics.DEFAULT_METRICS_URL,"
    " 'anchor': a.base_url if a else None,"
    " 'daemon_endpoint': d.endpoint, 'serving_local': d.serving_local,"
    " 'wired': vllm_backend.daemon_kwargs(c)['endpoint']}))\n"
)


class StaleAddressIsGone(unittest.TestCase):
    def test_no_code_or_unit_file_names_the_old_tailnet_address(self):
        files = [HERE / "daemon.py", HERE / "harvest_runner.py", HERE / "swarm.py",
                 HERE / "vllm_metrics.py", SERVICE]
        for path in files:
            with self.subTest(file=path.name):
                self.assertNotIn(STALE, path.read_text(encoding="utf-8"))


class ImportTimeDefaults(unittest.TestCase):
    def test_unset_environment_means_not_configured_and_not_serving(self):
        got = _fresh_import(_DEFAULTS)
        self.assertEqual(got, {"local": None, "vllm": None, "metrics": None,
                               "anchor": None, "daemon_endpoint": None,
                               "serving_local": False, "wired": None})

    def test_configured_environment_reaches_every_call_site(self):
        got = _fresh_import(_DEFAULTS.replace("d._update_posture()\n", ""),
                            SZL_OLLAMA_ENDPOINT=OLLAMA, SZL_VLLM_ENDPOINT=VLLM)
        self.assertEqual(got["metrics"], "http://127.0.0.1:8000/metrics")
        self.assertEqual(got["anchor"], OLLAMA)
        # The daemon is endpoint-agnostic: vllm_backend resolves the
        # configuration and hands the endpoint in via daemon_kwargs().
        self.assertEqual(got["wired"], VLLM)
        self.assertIsNone(got["local"])
        self.assertIsNone(got["daemon_endpoint"])


class NoImportCycle(unittest.TestCase):
    def test_daemon_does_not_import_vllm_backend(self):
        # vllm_backend wires the daemon (and imports it in its self-test), so a
        # daemon -> vllm_backend import would close a cycle.
        tree = ast.parse((HERE / "daemon.py").read_text(encoding="utf-8"))
        imported = {alias.name for node in ast.walk(tree)
                    if isinstance(node, ast.Import) for alias in node.names}
        imported |= {node.module for node in ast.walk(tree)
                     if isinstance(node, ast.ImportFrom) and node.module}
        self.assertNotIn("vllm_backend", imported)


class MetricsFailClosed(unittest.TestCase):
    def test_metrics_url_is_the_server_root_of_the_vllm_base(self):
        self.assertIsNone(vllm_metrics.metrics_url_for(None))
        self.assertEqual(vllm_metrics.metrics_url_for(VLLM),
                         "http://127.0.0.1:8000/metrics")
        self.assertEqual(vllm_metrics.metrics_url_for("https://gpu.example/v1/"),
                         "https://gpu.example/metrics")

    def test_unconfigured_metrics_url_is_never_fetched(self):
        fetch = MagicMock(return_value="vllm:num_requests_running 1\n")
        signal = vllm_metrics.read_slack(url=None, fetch_fn=fetch)
        fetch.assert_not_called()
        self.assertFalse(signal.measured)


class HarvestHealthFailClosed(unittest.TestCase):
    def _health(self, **env):
        with patch.dict(os.environ, _env_without_endpoints(**env), clear=True), \
                patch("urllib.request.urlopen") as urlopen:
            response = MagicMock()
            response.__enter__.return_value.status = 200
            urlopen.return_value = response
            return harvest_runner.health(), urlopen

    def test_unset_endpoint_is_reported_and_not_probed(self):
        out, urlopen = self._health()
        urlopen.assert_not_called()
        self.assertTrue(out["sovereign_hint"].startswith("sovereign:false"))
        self.assertIn("SZL_OLLAMA_ENDPOINT", out["sovereign_hint"])

    def test_invalid_endpoint_is_refused_and_not_probed(self):
        out, urlopen = self._health(SZL_OLLAMA_ENDPOINT="http://8.8.8.8:11434/v1")
        urlopen.assert_not_called()
        self.assertTrue(out["sovereign_hint"].startswith("sovereign:false"))
        self.assertIn("refused", out["sovereign_hint"])

    def test_configured_endpoint_is_the_one_probed(self):
        out, urlopen = self._health(SZL_OLLAMA_ENDPOINT=OLLAMA)
        self.assertEqual(urlopen.call_count, 1)
        self.assertEqual(urlopen.call_args.args[0].full_url, OLLAMA + "/models")
        self.assertTrue(out["sovereign_hint"].startswith("sovereign:true"))


class SwarmAnchorFailClosed(unittest.TestCase):
    def test_anchor_is_registered_only_when_configured(self):
        self.assertIsNone(swarm.default_anchor(environ={}))
        anchor = swarm.default_anchor(environ={backend.OLLAMA_ENDPOINT_ENV: OLLAMA})
        self.assertEqual(anchor.base_url, OLLAMA)
        with self.assertRaises(ValueError):
            swarm.default_anchor(environ={backend.OLLAMA_ENDPOINT_ENV: "http://8.8.8.8/v1"})


class ServiceUnitUsesTheReadVariables(unittest.TestCase):
    def test_unit_sets_the_variables_the_code_reads_to_valid_endpoints(self):
        active = {}
        for line in SERVICE.read_text(encoding="utf-8").splitlines():
            if line.startswith('Environment="') and "=" in line[13:]:
                key, value = line[len('Environment="'):].rstrip('"').split("=", 1)
                active[key] = value
        self.assertNotIn("HARVEST_OLLAMA_ENDPOINT", active)
        self.assertNotIn("HARVEST_VLLM_ENDPOINT", active)
        for key in (backend.OLLAMA_ENDPOINT_ENV, backend.VLLM_ENDPOINT_ENV):
            with self.subTest(var=key):
                self.assertIn(key, active)
                backend.validate_endpoint(active[key], allow_insecure_lan=False)


if __name__ == "__main__":
    unittest.main()
