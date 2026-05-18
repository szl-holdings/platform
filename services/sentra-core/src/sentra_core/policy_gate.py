"""Policy gate — HTTP client to a11oy-runtime.evaluate(); refuses on deny.

Any state-changing operation in sentra-core MUST be guarded by ``guard()``.
The gate calls the a11oy-runtime evaluate endpoint and raises
``PolicyDeniedError`` if the decision is ``deny``. A configurable
fail-mode controls behavior on transport errors; default is fail-closed.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Literal

FailMode = Literal["closed", "open"]

DEFAULT_RUNTIME_URL = os.environ.get(
    "A11OY_RUNTIME_URL", "http://localhost:5000/api/a11oy/policy"
)


class PolicyDeniedError(RuntimeError):
    """Raised when the policy gate refuses a state-changing operation."""

    def __init__(self, decision: "PolicyDecision"):
        super().__init__(f"policy denied: {decision.reason or 'no reason given'}")
        self.decision = decision


@dataclass(frozen=True)
class PolicyDecision:
    allow: bool
    reason: str | None
    policy_id: str | None
    evaluated_at: str | None
    raw: dict[str, Any]


@dataclass
class PolicyGate:
    runtime_url: str = DEFAULT_RUNTIME_URL
    timeout_s: float = 3.0
    fail_mode: FailMode = "closed"
    api_token: str | None = None

    def evaluate(self, action: str, subject: dict[str, Any]) -> PolicyDecision:
        """Call a11oy-runtime.evaluate() and return a typed decision."""

        body = {"action": action, "subject": subject, "context": {"source": "sentra-core"}}
        headers = {"content-type": "application/json"}
        if self.api_token:
            headers["authorization"] = f"Bearer {self.api_token}"
        try:
            import httpx

            resp = httpx.post(
                f"{self.runtime_url.rstrip('/')}/evaluate",
                content=json.dumps(body),
                headers=headers,
                timeout=self.timeout_s,
            )
            resp.raise_for_status()
            raw = resp.json() if resp.content else {}
        except Exception as exc:
            allow = self.fail_mode == "open"
            return PolicyDecision(
                allow=allow,
                reason=f"transport_error:{type(exc).__name__}",
                policy_id=None,
                evaluated_at=None,
                raw={"error": str(exc)},
            )

        decision_str = str(raw.get("decision") or ("allow" if raw.get("allow") else "deny"))
        allow = decision_str.lower() in {"allow", "permit", "ok"}
        return PolicyDecision(
            allow=allow,
            reason=raw.get("reason"),
            policy_id=raw.get("policy_id"),
            evaluated_at=raw.get("evaluated_at"),
            raw=raw,
        )

    def guard(self, action: str, subject: dict[str, Any]) -> PolicyDecision:
        """Evaluate and raise PolicyDeniedError if denied."""

        d = self.evaluate(action, subject)
        if not d.allow:
            raise PolicyDeniedError(d)
        return d
