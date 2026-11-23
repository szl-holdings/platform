"""Regression tests for the generated gate compatibility receipt."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "mc_gate_compat.py"
DREAM = HERE / "mc_first_wave_gate.json"


class GateCompatReceiptTests(unittest.TestCase):
    @staticmethod
    def _write_pack(root: Path) -> Path:
        pack = root / "pack"
        pack.mkdir()
        (pack / "canary_1x_a6000.spec.yaml").write_text(
            "rollout_stages: [1, 9, 40, 350]\n", encoding="utf-8"
        )
        (pack / "mc_gates.py").write_text(
            "# synthetic custody fixture: c5 PASS, c6 PASS\n", encoding="utf-8"
        )
        (pack / "README.md").write_text("synthetic pack\n", encoding="utf-8")
        return pack


    def test_generator_emits_required_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack = self._write_pack(root)
            out = root / "receipt.json"
            completed = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--dream",
                    str(DREAM),
                    "--pack",
                    str(pack),
                    "--out",
                    str(out),
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            generated = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(generated["doctrine"], "v11")
            self.assertEqual(generated["lambda_uniqueness"], "Conjecture 1")

    def test_generator_does_not_drop_metadata_when_verdict_is_hold(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack = self._write_pack(root)
            out = root / "receipt.json"
            subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--dream",
                    str(DREAM),
                    "--pack",
                    str(pack),
                    "--out",
                    str(out),
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            generated = json.loads(out.read_text(encoding="utf-8"))
            self.assertTrue(generated["verdict"].startswith("GATE_COMPAT:HOLD:"))
            self.assertIn("doctrine", generated)
            self.assertIn("lambda_uniqueness", generated)


if __name__ == "__main__":
    unittest.main()
