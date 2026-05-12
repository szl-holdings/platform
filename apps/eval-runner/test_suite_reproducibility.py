"""
Reproducibility Verification — Governed Eval Harness (Python layer)

Verifies that the eval harness produces byte-equal suite content_hashes
across independent invocations for the same pinned inputs.  The content_hash
is the non-repudiable evidence anchor: if it changes between runs, the
benchmark suite changed.

Three categories of assertions (all always-run — no skipping):

  Category A — algorithm determinism (pure hash, no I/O):
    Call _hash_suite / _build twice with identical fixture inputs and assert
    byte-equal SHA-256 hashes.  Proves the canonicalization algorithm is
    stable within a process boundary.

  Category B — cross-process reproducibility (two fresh subprocesses):
    Spawn two independent Python interpreters.  Each loads _hash_suite from
    the src package, runs it against the pinned domain suite cases, and prints
    the content_hash.  Comparing the two outputs proves the hash function is
    byte-equal across separate process boundaries — the closest simulation of
    "two separate CI harness runs".

    Domain suite cases are used (not STANDARD_SUITE) because they are pure
    Python (no network I/O) so the subprocesses complete deterministically.

  Category C — domain suite build stability:
    Builds each domain suite twice and asserts byte-equal content_hash values.

conftest.py sets EVAL_OFFLINE_FALLBACK=1 + HF_DATASETS_OFFLINE=1 before any
import to prevent accidental network calls in the parent process.
"""

import hashlib
import json
import os
import subprocess
import sys
from copy import deepcopy
from pathlib import Path

# ── Fixture cases (shared across all test categories) ─────────────────────────

_FIXTURE_CASES_A = [
    {"id": "f-001", "category": "mmlu",   "prompt": "What is 2+2?",              "expected": "4",              "grader": "exact_match", "weight": 1},
    {"id": "f-002", "category": "mmlu",   "prompt": "Capital of France?",        "expected": "Paris",          "grader": "exact_match", "weight": 1},
    {"id": "f-003", "category": "ifeval", "prompt": "List three primary colours.","expected": "red, green, blue","grader": "contains",    "weight": 2},
]

_FIXTURE_CASES_B = [
    {"id": "g-001", "category": "truthfulqa", "prompt": "Is the sky blue?",     "expected": "yes", "grader": "exact_match", "weight": 1},
    {"id": "g-002", "category": "truthfulqa", "prompt": "How many continents?", "expected": "7",   "grader": "exact_match", "weight": 1},
]

_EVAL_RUNNER_ROOT = str(Path(__file__).parent.parent)  # apps/eval-runner/


def _subprocess_hash(cases_json: str) -> str:
    """
    Spawn a fresh Python interpreter.  It imports _hash_suite from src.suites,
    computes the hash of the supplied JSON cases, and prints the hex digest.

    Uses subprocess so this is a genuine "separate process" / "cold start" —
    not a cached import from the parent process's sys.modules.

    Only _hash_suite is exercised (no lm_eval, no HuggingFace datasets) so
    the subprocess always completes within 5 seconds regardless of connectivity.
    """
    script = (
        "import sys, json\n"
        f"sys.path.insert(0, {_EVAL_RUNNER_ROOT!r})\n"
        # Avoid triggering module-level STANDARD_SUITE bootstrap by importing
        # only the hash function via direct attribute access after import.
        "import importlib, os\n"
        "os.environ['EVAL_OFFLINE_FALLBACK'] = '1'\n"
        "os.environ['HF_DATASETS_OFFLINE']   = '1'\n"
        "os.environ['TRANSFORMERS_OFFLINE']  = '1'\n"
        # Monkey-patch lm_eval_bridge before src.suites is imported so the
        # module-level STANDARD_SUITE bootstrap short-circuits to offline mode.
        "import types\n"
        "fake_bridge = types.ModuleType('src.lm_eval_bridge')\n"
        "def _noop(*a, **kw): raise RuntimeError('offline')\n"
        "fake_bridge.load_lm_eval_cases = _noop\n"
        "fake_bridge.compute_cases_content_hash = _noop\n"
        "sys.modules['src.lm_eval_bridge'] = fake_bridge\n"
        "from src.suites import _hash_suite\n"
        f"cases = json.loads({cases_json!r})\n"
        "print(_hash_suite(cases))\n"
    )
    result = subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        text=True,
        timeout=15,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"hash subprocess failed (rc={result.returncode}):\n"
            f"  stdout: {result.stdout!r}\n"
            f"  stderr: {result.stderr!r}"
        )
    # Structlog writes to stdout; the hash is always the last line.
    lines = [ln for ln in result.stdout.splitlines() if ln.strip()]
    if not lines:
        raise RuntimeError(f"hash subprocess produced no output.\n  stderr: {result.stderr!r}")
    return lines[-1].strip()


# ─────────────────────────────────────────────────────────────────────────────
# Category A — algorithm determinism (pure hash, no I/O, always fast)
# ─────────────────────────────────────────────────────────────────────────────

class TestHashSuiteAlgorithmDeterminism:
    """_hash_suite() must produce byte-equal output for the same inputs every time."""

    def test_byte_equal_across_two_calls_fixture_a(self):
        from src.suites import _hash_suite  # type: ignore[import]
        h1 = _hash_suite(deepcopy(_FIXTURE_CASES_A))
        h2 = _hash_suite(deepcopy(_FIXTURE_CASES_A))
        assert h1 == h2, f"_hash_suite non-deterministic: {h1!r} vs {h2!r}"
        assert len(h1) == 64, "hash must be a 64-char hex SHA-256 digest"

    def test_byte_equal_across_two_calls_fixture_b(self):
        from src.suites import _hash_suite  # type: ignore[import]
        h1 = _hash_suite(deepcopy(_FIXTURE_CASES_B))
        h2 = _hash_suite(deepcopy(_FIXTURE_CASES_B))
        assert h1 == h2, f"_hash_suite non-deterministic: {h1!r} vs {h2!r}"

    def test_hash_differs_for_different_content(self):
        from src.suites import _hash_suite  # type: ignore[import]
        assert _hash_suite(deepcopy(_FIXTURE_CASES_A)) != _hash_suite(deepcopy(_FIXTURE_CASES_B))

    def test_hash_is_order_independent(self):
        """sort_keys=True + sorted-by-id makes hash independent of input order."""
        from src.suites import _hash_suite  # type: ignore[import]
        h_fwd = _hash_suite(deepcopy(_FIXTURE_CASES_A))
        h_rev = _hash_suite(list(reversed(_FIXTURE_CASES_A)))
        assert h_fwd == h_rev, "_hash_suite must be order-independent (cases sorted by id)"

    def test_hash_is_sensitive_to_expected_field(self):
        from src.suites import _hash_suite  # type: ignore[import]
        baseline = _hash_suite(deepcopy(_FIXTURE_CASES_A))
        mutated = deepcopy(_FIXTURE_CASES_A)
        mutated[0]["expected"] = "WRONG"
        assert baseline != _hash_suite(mutated)

    def test_hash_is_sensitive_to_prompt_field(self):
        from src.suites import _hash_suite  # type: ignore[import]
        baseline = _hash_suite(deepcopy(_FIXTURE_CASES_A))
        mutated = deepcopy(_FIXTURE_CASES_A)
        mutated[1]["prompt"] = "Completely different prompt"
        assert baseline != _hash_suite(mutated)

    def test_hash_is_sensitive_to_id_field(self):
        from src.suites import _hash_suite  # type: ignore[import]
        baseline = _hash_suite(deepcopy(_FIXTURE_CASES_A))
        mutated = deepcopy(_FIXTURE_CASES_A)
        mutated[0]["id"] = "x-changed"
        assert baseline != _hash_suite(mutated)

    def test_canonical_serialisation_matches_reference(self):
        """The canonical JSON bytes must exactly match the SHA-256 input."""
        cases = [{"id": "z-001", "category": "test", "expected": "y",
                  "grader": "exact_match", "prompt": "Q?", "weight": 1}]
        canonical = json.dumps(
            sorted(cases, key=lambda c: c["id"]),
            sort_keys=True, separators=(",", ":"),
        )
        expected_hash = hashlib.sha256(canonical.encode()).hexdigest()
        from src.suites import _hash_suite  # type: ignore[import]
        assert _hash_suite(cases) == expected_hash, (
            f"Hash algorithm diverged.\n"
            f"  canonical: {canonical!r}\n"
            f"  expected:  {expected_hash}\n"
            f"  actual:    {_hash_suite(cases)}"
        )

    def test_build_content_hash_byte_equal_across_two_calls(self):
        """_build() must produce byte-equal content_hash for the same inputs."""
        from src.suites import _build  # type: ignore[import]
        s1 = _build("test-v1", "Test", "Test suite", "test", 1, deepcopy(_FIXTURE_CASES_A))
        s2 = _build("test-v1", "Test", "Test suite", "test", 1, deepcopy(_FIXTURE_CASES_A))
        assert s1["content_hash"] == s2["content_hash"], (
            f"_build not reproducible: {s1['content_hash']!r} vs {s2['content_hash']!r}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Category B — cross-process reproducibility (two fresh Python interpreters)
# ─────────────────────────────────────────────────────────────────────────────

class TestCrossProcessReproducibility:
    """
    Two independent subprocesses must produce byte-equal content_hash values.
    This is the gold-standard simulation of "two separate CI harness runs".

    Only _hash_suite is called in the subprocess (no lm_eval, no HuggingFace)
    so tests always complete regardless of network availability.
    """

    def test_hash_suite_byte_equal_across_two_separate_processes_fixture_a(self):
        """
        Core two-run reproducibility assertion: spawn two fresh Python processes,
        compute _hash_suite(fixture_A) in each, and assert byte-equal hashes.
        """
        cases_json = json.dumps(_FIXTURE_CASES_A)
        hash1 = _subprocess_hash(cases_json)
        hash2 = _subprocess_hash(cases_json)
        assert hash1 == hash2, (
            f"_hash_suite not byte-equal across two separate processes.\n"
            f"  Process 1: {hash1}\n"
            f"  Process 2: {hash2}\n"
            "This indicates OS-level or Python interpreter non-determinism."
        )
        assert len(hash1) == 64, "hash must be a 64-char hex SHA-256 digest"

    def test_hash_suite_byte_equal_across_two_separate_processes_fixture_b(self):
        cases_json = json.dumps(_FIXTURE_CASES_B)
        hash1 = _subprocess_hash(cases_json)
        hash2 = _subprocess_hash(cases_json)
        assert hash1 == hash2, (
            f"_hash_suite not byte-equal across two separate processes.\n"
            f"  Process 1: {hash1}\n"
            f"  Process 2: {hash2}"
        )

    def test_subprocess_hash_matches_in_process_hash(self):
        """
        The subprocess hash must equal the in-process hash for the same input.
        Proves the subprocess environment uses the same algorithm as the server.
        """
        from src.suites import _hash_suite  # type: ignore[import]
        cases_json = json.dumps(_FIXTURE_CASES_A)
        subprocess_hash = _subprocess_hash(cases_json)
        in_process_hash = _hash_suite(deepcopy(_FIXTURE_CASES_A))
        assert subprocess_hash == in_process_hash, (
            f"Subprocess hash differs from in-process hash for identical input.\n"
            f"  Subprocess:  {subprocess_hash}\n"
            f"  In-process:  {in_process_hash}\n"
            "This means _hash_suite behaves differently across process boundaries."
        )


# ─────────────────────────────────────────────────────────────────────────────
# Category C — domain suite build stability (pure Python, no I/O)
# ─────────────────────────────────────────────────────────────────────────────

class TestDomainSuiteBuildStability:
    """Domain suite content_hash must be stable across two builds of the same cases."""

    def test_domain_suite_content_hashes_byte_equal_across_two_builds(self):
        from src.suites import _build  # type: ignore[import]
        from src.suites import (  # type: ignore[import]
            _VESSELS_CASES, _TERRA_CASES, _AEGIS_CASES, _SENTRA_CASES, _COUNSEL_CASES,
        )
        domain_specs = [
            ("vessels-domain-v1", "Vessels", "vessels", _VESSELS_CASES),
            ("terra-domain-v1",   "Terra",   "terra",   _TERRA_CASES),
            ("aegis-domain-v1",   "Aegis",   "aegis",   _AEGIS_CASES),
            ("sentra-domain-v1",  "Sentra",  "sentra",  _SENTRA_CASES),
            ("counsel-domain-v1", "Counsel", "counsel", _COUNSEL_CASES),
        ]
        for suite_id, name, domain, cases in domain_specs:
            s1 = _build(suite_id, name, f"{name} suite", domain, 1, list(cases))
            s2 = _build(suite_id, name, f"{name} suite", domain, 1, list(cases))
            assert s1["content_hash"] == s2["content_hash"], (
                f"Domain suite '{suite_id}' content_hash not reproducible:\n"
                f"  Build 1: {s1['content_hash']}\n"
                f"  Build 2: {s2['content_hash']}"
            )

    def test_standard_suite_structure_is_valid(self):
        """Module-level STANDARD_SUITE must satisfy the required schema."""
        from src.suites import STANDARD_SUITE, _hash_suite  # type: ignore[import]
        for field in ("suite_id", "name", "cases", "content_hash", "domain", "version"):
            assert field in STANDARD_SUITE, f"STANDARD_SUITE missing: {field!r}"
        assert STANDARD_SUITE["suite_id"] == "standard-v1"
        assert len(STANDARD_SUITE["cases"]) > 0
        assert STANDARD_SUITE["content_hash"] == _hash_suite(STANDARD_SUITE["cases"]), (
            "STANDARD_SUITE.content_hash does not match re-hashing its own cases"
        )
