"""
formula_os — PURIQ Agentic Formula runtime (Doctrine v12, PURIQ layer).

23 FormulaAgents: each PURIQ formula (F1..F23) becomes a self-evaluating,
self-testing, self-proving agent that emits a Khipu receipt every cycle.

Honest framing: "agentic" = periodic self-evaluation + numeric self-test +
real Lean tactic-search self-prove attempts (honest outcomes) + receipt chain.
No mystical content. Open-source deps (stdlib + optional pytest/huggingface_hub).

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from .agent import FormulaAgent
from .registry import SPECS, BY_ID, FormulaSpec, DOCTRINE_V11_LOCKED
from . import formulas, evaluator, prover, numeric_harness, citation_tracker, khipu

__all__ = [
    "FormulaAgent", "SPECS", "BY_ID", "FormulaSpec", "DOCTRINE_V11_LOCKED",
    "formulas", "evaluator", "prover", "numeric_harness", "citation_tracker",
    "khipu",
]
