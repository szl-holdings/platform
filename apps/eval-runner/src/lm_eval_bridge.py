"""
Bridge to the lm-eval / HuggingFace datasets ecosystem.

In an online GPU deployment this module loads standard benchmark subsets
(MMLU / IFEval / TruthfulQA) via the optional GPU extras documented in
requirements.txt and converts them into the case schema used by suites.py.

In offline mode (the CI default — conftest.py sets EVAL_OFFLINE_FALLBACK=1,
HF_DATASETS_OFFLINE=1, TRANSFORMERS_OFFLINE=1) this bridge deliberately raises
so that callers take the documented EVAL_OFFLINE_FALLBACK code path in
suites._bootstrap_standard_suite(). It does NOT fabricate offline cases — the
offline baseline lives in suites.py and is labelled as such.

The content-hash helper is always available (online or offline), since it is a
pure function over already-loaded cases.
"""
from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Dict, List

Case = Dict[str, Any]


class LmEvalOfflineError(RuntimeError):
    """Raised when lm-eval data is requested but the environment is offline."""


def _offline() -> bool:
    """True if any offline flag is set (mirrors conftest.py guards)."""
    return (
        os.environ.get("EVAL_OFFLINE_FALLBACK") == "1"
        or os.environ.get("HF_DATASETS_OFFLINE") == "1"
        or os.environ.get("TRANSFORMERS_OFFLINE") == "1"
    )


def compute_cases_content_hash(cases: List[Case]) -> str:
    """
    Deterministic SHA-256 (64-char hex) over the canonical JSON of `cases`.

    Kept byte-identical to suites._hash_suite so a suite hashed here matches one
    hashed there: cases are sorted by id, then dumped with sort_keys + compact
    separators. Pure function, no I/O — safe online or offline.
    """
    ordered = sorted(cases, key=lambda c: c["id"])
    canonical = json.dumps(ordered, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def load_lm_eval_cases() -> List[Case]:
    """
    Load standard-benchmark cases from the lm-eval / HF datasets stack.

    Offline (CI default): raises LmEvalOfflineError so the caller falls back to
    the built-in offline baseline. We do not silently return fake "benchmark"
    cases — an offline run must be visibly offline.

    Online: requires the optional GPU extras (datasets / lm-eval). If those are
    not installed the import fails and we raise LmEvalOfflineError as well,
    because there is genuinely no benchmark data to return.
    """
    if _offline():
        raise LmEvalOfflineError(
            "lm-eval data requested while offline flags are set "
            "(EVAL_OFFLINE_FALLBACK / HF_DATASETS_OFFLINE / TRANSFORMERS_OFFLINE); "
            "caller should use the offline fallback suite."
        )

    try:
        import datasets  # type: ignore[import-not-found]  # noqa: F401
    except Exception as exc:  # pragma: no cover - exercised only on GPU hosts
        raise LmEvalOfflineError(
            "optional lm-eval extras (datasets / lm-eval) are not installed; "
            "install the GPU extras from requirements.txt to enable online suites."
        ) from exc

    # On a configured GPU host the concrete dataset→case adapters live here.
    # They are intentionally not stubbed in this CPU/offline image: returning
    # placeholder cases would be fake data. Until the GPU adapter is wired,
    # signal honestly that no online cases are available in this build.
    raise LmEvalOfflineError(
        "online lm-eval dataset adapters are not provisioned in this image; "
        "this build serves just the offline baseline and domain suites."
    )
