"""
agent.py — FormulaAgent base.

Each PURIQ formula becomes a FormulaAgent that:
  - periodically self-evaluates against current/synthetic empire state (tick());
    intended cadence: every 5 minutes (period_s=300) when run as a daemon,
  - runs a self-test harness (numeric identity checks via numeric_harness),
  - attempts a self-prove cycle (Lean tactic search via prover.py),
  - emits a Khipu receipt on EVERY cycle (chain-verified).

The agent is deterministic given a seed. Running as a daemon is optional; the
empire wires these as additive state. No mystical content; pure math + receipts.

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from __future__ import annotations
import random
import time
from dataclasses import dataclass, field

from .registry import FormulaSpec
from .evaluator import evaluate, EvalResult
from .numeric_harness import check_identity, HarnessResult
from .khipu import KhipuChain
from . import citation_tracker


@dataclass
class FormulaAgent:
    spec: FormulaSpec
    period_s: int = 300                 # self-evaluate every 5 min (daemon mode)
    seed: int = 0
    store_dir: str | None = None
    _rng: random.Random = field(init=False, repr=False)
    chain: KhipuChain = field(init=False, repr=False)
    last_eval: EvalResult | None = field(default=None, init=False)
    last_harness: HarnessResult | None = field(default=None, init=False)
    proof_status: str = field(default="UNATTEMPTED", init=False)
    proved_tactic: str | None = field(default=None, init=False)
    tick_count: int = field(default=0, init=False)

    def __post_init__(self):
        self._rng = random.Random(self.seed + hash(self.spec.fid) % 100000)
        self.chain = KhipuChain(self.spec.fid, store_dir=self.store_dir)

    # --- single self-evaluation cycle -----------------------------------
    def tick(self, explicit_args: tuple | None = None) -> EvalResult:
        ev = evaluate(self.spec, self._rng, explicit_args=explicit_args)
        self.last_eval = ev
        self.tick_count += 1
        self.chain.emit("evaluate", {
            "value": ev.value, "identity_holds": ev.identity_holds,
            "args": ev.args_repr, "error": ev.error, "tick": self.tick_count,
        })
        return ev

    # --- self-test harness ----------------------------------------------
    def self_test(self, trials: int = 100) -> HarnessResult:
        hr = check_identity(self.spec, trials)
        self.last_harness = hr
        self.chain.emit("test", {
            "passed": hr.passed, "total": hr.total, "ok": hr.ok,
            "failures": hr.failures,
        })
        return hr

    # --- self-prove cycle (delegates to prover with a Lean template) -----
    def self_prove(self, lean_template: str | None, theorem_name: str,
                   max_attempts: int = 5) -> str:
        if lean_template is None:
            self.proof_status = "NO-TEMPLATE"
            self.chain.emit("prove", {"theorem": theorem_name,
                                      "outcome": "NO-TEMPLATE"})
            return self.proof_status
        from .prover import attempt_proof
        pr = attempt_proof(self.spec.fid, theorem_name, lean_template,
                           max_attempts=max_attempts)
        self.proof_status = pr.outcome
        self.proved_tactic = pr.proved_tactic
        self.chain.emit("prove", {
            "theorem": theorem_name, "outcome": pr.outcome,
            "proved_tactic": pr.proved_tactic, "verifier": pr.verifier,
            "attempts": [{"tactic": a.tactic, "ok": a.ok} for a in pr.attempts],
        })
        return self.proof_status

    # --- dashboard snapshot for /formulas tab ---------------------------
    def snapshot(self) -> dict:
        return {
            "id": self.spec.fid,
            "name": self.spec.name,
            "organ": self.spec.organ,
            "primitive": self.spec.primitive,
            "lean_name": self.spec.lean_name,
            "lean_status": self.spec.lean_status,
            "proof_status": self.proof_status,
            "proved_tactic": self.proved_tactic,
            "identity_doc": self.spec.identity_doc,
            "current_value": (self.last_eval.value if self.last_eval else None),
            "last_eval_ts": (self.last_eval.ts if self.last_eval else None),
            "identity_holds": (self.last_eval.identity_holds if self.last_eval else None),
            "harness": (None if not self.last_harness else
                        {"passed": self.last_harness.passed,
                         "total": self.last_harness.total}),
            "invoked_by": citation_tracker.organs_for(self.spec.fid),
            "chain_verified": self.chain.verify(),
            "tick_count": self.tick_count,
            "last_receipts": self.chain.last(5),
        }
