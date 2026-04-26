"""
Meridian Python test runner — uses stdlib unittest only (no pytest required).

Discovers and runs tests in:
  - services/meridian_control_plane/tests/
  - services/verticals/ (test_*.py)
"""
import os
import sys
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

loader = unittest.TestLoader()
suite = unittest.TestSuite()

for rel_dir in [
    "services/meridian_control_plane/tests",
    "services/verticals",
]:
    abs_dir = os.path.join(REPO_ROOT, rel_dir)
    suite.addTests(loader.discover(
        start_dir=abs_dir,
        pattern="test_*.py",
        top_level_dir=REPO_ROOT,
    ))

runner = unittest.TextTestRunner(verbosity=2)
result = runner.run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
