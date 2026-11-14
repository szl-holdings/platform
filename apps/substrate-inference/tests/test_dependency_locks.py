from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def test_dependency_locks_are_exact_and_consistent():
    root = Path(__file__).parents[1]
    result = subprocess.run(
        [sys.executable, str(root / "scripts" / "verify_dependency_locks.py")],
        check=False,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "dependency locks verified" in result.stdout
