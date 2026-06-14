# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — PINN honest-uncertainty + governance innovations.
"""SZL PINN innovations: conformal prediction band + deny-by-default Λ gate.

Siblings of the FE-NO operator-solver innovations, so the PINN capability shares
the same honest-error and governance contract.
"""
from . import conformal_interval, lambda_gate  # noqa: F401

__all__ = ["conformal_interval", "lambda_gate"]
