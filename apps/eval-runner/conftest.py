"""
Pytest conftest for apps/eval-runner.

Sets up sys.path so that the `src` package is importable as `src.<module>`,
preserving relative import semantics (e.g. suites.py does
`from .lm_eval_bridge import ...`).

Also sets all HuggingFace / lm-eval offline flags BEFORE any src import so
that HF dataset downloads fail fast (ConnectionError) instead of blocking,
which immediately triggers the EVAL_OFFLINE_FALLBACK code path in
_bootstrap_standard_suite().
"""
import os
import sys

# ── Block all network access for HuggingFace/lm-eval libs ────────────────────
# Must happen before any import that touches these libraries.
os.environ["EVAL_OFFLINE_FALLBACK"] = "1"
os.environ["HF_DATASETS_OFFLINE"] = "1"        # datasets library
os.environ["TRANSFORMERS_OFFLINE"] = "1"        # transformers / tokenizers
os.environ["HF_EVALUATE_OFFLINE"] = "1"         # evaluate library
os.environ["LM_EVAL_CACHE_PATH"] = "/tmp/lm_eval_test_cache"

# ── Set up package path ───────────────────────────────────────────────────────
# Add the eval-runner root so `import src.suites` works as a package import.
# This mirrors what run.py does at start-up and preserves relative imports.
_ROOT = os.path.dirname(os.path.dirname(__file__))  # apps/eval-runner/
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Remove bare `src/` from sys.path if any other tool added it — importing
# suites as a top-level module (not src.suites) breaks relative imports.
_SRC = os.path.join(_ROOT, "src")
while _SRC in sys.path:
    sys.path.remove(_SRC)
