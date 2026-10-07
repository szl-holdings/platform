"""Production execution admission for the Substrate Python worker.

The current worker has useful development handlers, but it has no verified
stage-specific qualification receipts, shared durable claim/result store, or
durable evidence ledger. Production must therefore remain on HOLD even when
transport authentication is configured correctly.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .security import is_production_environment


PRODUCTION_EXECUTION_HOLD_CODE = "PRODUCTION_STAGE_EXECUTION_UNAVAILABLE"

PRODUCTION_EXECUTION_BLOCKERS = (
    "stage handlers do not have parsed and verified qualification receipts bound to their exact implementations and dependencies",
    "claim reservations and completed results are process-local rather than stored in a shared durable tenant/run/stage store",
    "stage execution evidence is not committed transactionally to a durable ledger",
)


@dataclass(frozen=True)
class WorkerExecutionCapability:
    stage_receipts_qualified: bool
    durable_claim_result_store: bool
    durable_ledger: bool

    @property
    def production_ready(self) -> bool:
        return (
            self.stage_receipts_qualified
            and self.durable_claim_result_store
            and self.durable_ledger
        )


# No environment value can promote these source-only implementations. A future
# production adapter must replace this capability with verified runtime state.
WORKER_EXECUTION_CAPABILITY = WorkerExecutionCapability(
    stage_receipts_qualified=False,
    durable_claim_result_store=False,
    durable_ledger=False,
)


def production_execution_held(
    environ: Mapping[str, str] | None = None,
) -> bool:
    return (
        is_production_environment(environ)
        and not WORKER_EXECUTION_CAPABILITY.production_ready
    )


def build_production_execution_hold() -> dict[str, Any]:
    """Build a result-free production HOLD response."""

    return {
        "ready": False,
        "status": "HOLD",
        "code": PRODUCTION_EXECUTION_HOLD_CODE,
        "evidenceState": "UNAVAILABLE",
        "promotionState": "EVALUATION_HOLD",
        "service": "substrate-py-workers",
        "message": (
            "Production stage execution is disabled until qualified stage "
            "receipts, a durable claim/result store, and a durable evidence "
            "ledger are wired and verified."
        ),
        "capabilities": {
            "stageReceiptsQualified": (
                WORKER_EXECUTION_CAPABILITY.stage_receipts_qualified
            ),
            "durableClaimResultStore": (
                WORKER_EXECUTION_CAPABILITY.durable_claim_result_store
            ),
            "durableLedger": WORKER_EXECUTION_CAPABILITY.durable_ledger,
        },
        "blockers": list(PRODUCTION_EXECUTION_BLOCKERS),
    }
