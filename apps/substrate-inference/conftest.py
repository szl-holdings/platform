"""
Pytest conftest for apps/substrate-inference.

Adds the app root to sys.path so `import src.main` resolves as a package
import (mirroring how `python -m src.main` runs the service), and points the
model/cache dirs at a temp location so tests never touch a real home dir.

The test suite runs entirely in STUB mode: the SubstrateRuntime auto-detects
no CUDA/torch and serves identical API contracts without a GPU, so the suite
needs no GPU hardware and makes no network calls.
"""
import os
import sys
import tempfile

_ROOT = os.path.dirname(__file__)  # apps/substrate-inference/
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Isolate model/cache dirs to a temp location for the test process.
_TMP = tempfile.mkdtemp(prefix="substrate_test_")
os.environ.setdefault("SUBSTRATE_MODELS_DIR", os.path.join(_TMP, "models"))
os.environ.setdefault("SUBSTRATE_CACHE_DIR", os.path.join(_TMP, "cache"))
