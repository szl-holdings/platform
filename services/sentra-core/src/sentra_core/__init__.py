"""Sentra core defensive primitives.

Modules:
    threat_model       — inventory + threat-source -> typed threat graph keyed by MITRE ATT&CK
    posture_drift      — baseline vs current posture diff with severity-weighted Λ score
    incident_response  — runbook DSL + step events
    evidence_pack      — hash-chained, signed forensic bundle
    policy_gate        — HTTP client to a11oy-runtime.evaluate() with deny-refusal
"""

from . import (
    evidence_pack,
    incident_response,
    policy_gate,
    posture_drift,
    threat_model,
)

__all__ = [
    "evidence_pack",
    "incident_response",
    "policy_gate",
    "posture_drift",
    "threat_model",
]

__version__ = "0.1.0"
