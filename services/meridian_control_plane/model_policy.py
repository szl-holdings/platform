"""Model policy loader and validator for Alloy Meridian.

Loads ``ops/a11oy/model-policy.json`` and exposes helpers that the control
plane and vertical packs use to:
  - resolve the correct model for a given input class
  - determine whether a given output class requires human approval
  - validate the policy file for correctness (no hardcoded secrets)

The validator is intentionally strict: it will raise ``PolicyError`` if any
field is missing, if an API key value (not name) is detected, or if the
critical-path model is the same as the default model.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = REPO_ROOT / "ops" / "a11oy" / "model-policy.json"

# Pattern that looks like a real OpenAI API key (never allowed as a value in
# the policy file — only env-var names are permitted).
_HARDCODED_KEY_RE = re.compile(r"sk-[A-Za-z0-9]{20,}")

REQUIRED_TOP_LEVEL_KEYS = (
    "default_model",
    "critical_path_model",
    "api_key_env",
    "critical_path_input_classes",
    "requires_human_approval_output_classes",
    "audit",
)


class PolicyError(Exception):
    """Raised when the model policy file fails validation."""


def _detect_hardcoded_secret(policy_text: str) -> bool:
    """Return True if a hardcoded API key value is found in the raw JSON text."""
    return bool(_HARDCODED_KEY_RE.search(policy_text))


def load_policy(path: Path = POLICY_PATH) -> dict[str, Any]:
    """Load and return the raw policy dict from *path*.

    Raises ``PolicyError`` on any validation failure.
    """
    if not path.exists():
        raise PolicyError(f"model policy file not found: {path}")

    raw = path.read_text(encoding="utf-8")
    if _detect_hardcoded_secret(raw):
        raise PolicyError(
            "model policy contains what looks like a hardcoded API key — "
            "store the key in the env var named by 'api_key_env', never inline it"
        )

    try:
        policy: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise PolicyError(f"model policy is not valid JSON: {exc}") from exc

    missing = [k for k in REQUIRED_TOP_LEVEL_KEYS if k not in policy]
    if missing:
        raise PolicyError(f"model policy missing required keys: {missing}")

    if policy["default_model"] == policy["critical_path_model"]:
        raise PolicyError(
            "default_model and critical_path_model must be different; "
            "the critical-path model should be a stronger/costlier variant"
        )

    if not isinstance(policy["critical_path_input_classes"], list) or not policy["critical_path_input_classes"]:
        raise PolicyError("critical_path_input_classes must be a non-empty list")

    if not isinstance(policy["requires_human_approval_output_classes"], list):
        raise PolicyError("requires_human_approval_output_classes must be a list")

    return policy


class ModelPolicy:
    """High-level interface around a validated policy dict."""

    def __init__(self, policy: dict[str, Any]) -> None:
        self._policy = policy

    @classmethod
    def from_file(cls, path: Path = POLICY_PATH) -> "ModelPolicy":
        return cls(load_policy(path))

    @property
    def default_model(self) -> str:
        return self._policy["default_model"]

    @property
    def critical_path_model(self) -> str:
        return self._policy["critical_path_model"]

    @property
    def api_key_env(self) -> str:
        return self._policy["api_key_env"]

    def resolve_model(self, input_class: str) -> str:
        """Return the model ID for *input_class*, routing to pro for critical paths."""
        if input_class in self._policy["critical_path_input_classes"]:
            return self.critical_path_model
        return self.default_model

    def requires_human_approval(self, output_class: str) -> bool:
        """Return True if *output_class* must have an approval record before action."""
        return output_class in self._policy["requires_human_approval_output_classes"]

    def get_api_key(self) -> str | None:
        """Retrieve the API key from the environment (never from the policy file)."""
        return os.environ.get(self.api_key_env)

    def to_dict(self) -> dict[str, Any]:
        return dict(self._policy)


__all__ = ["PolicyError", "load_policy", "ModelPolicy", "POLICY_PATH"]
