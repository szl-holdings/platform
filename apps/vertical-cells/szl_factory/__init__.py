"""Packet 6 vertical-cell validation and deterministic compilation."""

from .compiler import (
    CANONICAL_JSON_ALGORITHM,
    CELL_ARTIFACT_NAMES,
    TREE_DIGEST_ALGORITHM,
    TREE_DIGEST_ID,
    canonical_json_bytes,
    compile_profile,
    compute_tree_sha256,
)
from .validation import (
    EXPECTED_VERTICAL_IDS,
    FORMULA_VERTICAL_ALIASES,
    ValidationError,
    load_profile,
    validate_profile,
)

__all__ = [
    "CANONICAL_JSON_ALGORITHM",
    "CELL_ARTIFACT_NAMES",
    "EXPECTED_VERTICAL_IDS",
    "FORMULA_VERTICAL_ALIASES",
    "TREE_DIGEST_ALGORITHM",
    "TREE_DIGEST_ID",
    "ValidationError",
    "canonical_json_bytes",
    "compile_profile",
    "compute_tree_sha256",
    "load_profile",
    "validate_profile",
]
