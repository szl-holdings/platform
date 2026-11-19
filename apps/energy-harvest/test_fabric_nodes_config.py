"""The sovereign RTX node comes from A11OY_MODEL_BASE_URL only (no network).

There is no hard-coded fallback address: when the variable is unset the node is
reported as not configured and is never probed.
"""
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

import fabric_nodes  # noqa: E402  (path set above)

STALE = ".".join(("100", "125", "77", "31"))


class SovereignGpuConfig(unittest.TestCase):
    def test_source_has_no_hard_coded_tailnet_address(self):
        self.assertNotIn(STALE, Path(fabric_nodes.__file__).read_text(encoding="utf-8"))

    def test_unset_base_url_is_not_configured_and_never_probed(self):
        env = {k: v for k, v in os.environ.items() if k != "A11OY_MODEL_BASE_URL"}
        with patch.dict(os.environ, env, clear=True), \
                patch.object(fabric_nodes, "_http_ok") as http_ok:
            node = fabric_nodes._sovereign_gpu()
        http_ok.assert_not_called()
        self.assertFalse(node["reachable"])
        self.assertIsNone(node["endpoint"])
        self.assertEqual(node["kind"], "sovereign-gpu")
        self.assertIn("A11OY_MODEL_BASE_URL", node["detail"])

    def test_configured_base_url_is_probed_at_its_server_root(self):
        with patch.dict(os.environ, {"A11OY_MODEL_BASE_URL": "http://127.0.0.1:11434/v1"}), \
                patch.object(fabric_nodes, "_ollama_node",
                             return_value={"reachable": True}) as node:
            fabric_nodes._sovereign_gpu()
        self.assertEqual(node.call_args.args[1], "http://127.0.0.1:11434")


if __name__ == "__main__":
    unittest.main()
