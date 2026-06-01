"""
run_sprint.py — Phases 2,3,5 driver.

  Phase 2: instantiate 23 FormulaAgents; tick each 100x under varying inputs
           (receipts emitted); run self_test harness on each.
  Phase 3: self-prove sprint on the 5 lowest-dependency formulas via real Lean
           tactic-search (Mathlib-free templates) with honest outcomes.
  Phase 5 inputs: produce dashboard snapshot JSON + summary stats.

Outputs JSON to ./out/ for the deliverable docs and the a11oy /formulas tab.

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from __future__ import annotations
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from formula_os import SPECS, FormulaAgent
from formula_os.prover import attempt_proof
from lean.templates import TEMPLATES

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
RECEIPTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "receipts")
os.makedirs(OUT, exist_ok=True)


def main():
    agents: dict[str, FormulaAgent] = {}
    # --- Phase 2: instantiate + tick 100x + self_test ---
    for spec in SPECS:
        ag = FormulaAgent(spec, seed=2026, store_dir=RECEIPTS)
        for _ in range(100):
            ag.tick()
        ag.self_test(trials=100)
        agents[spec.fid] = ag

    # --- Phase 3: self-prove sprint on 5 lowest-dependency formulas ---
    sprint_results = {}
    for fid, (thm, template) in TEMPLATES.items():
        pr = attempt_proof(fid, thm, template, max_attempts=5, timeout=120)
        sprint_results[fid] = {
            "theorem": pr.theorem, "outcome": pr.outcome,
            "proved_tactic": pr.proved_tactic, "verifier": pr.verifier,
            "elapsed_s": pr.elapsed_s,
            "attempts": [{"attempt": a.attempt, "tactic": a.tactic,
                          "ok": a.ok, "detail": a.detail} for a in pr.attempts],
        }
        # reflect outcome into the agent
        agents[fid].proof_status = pr.outcome
        agents[fid].proved_tactic = pr.proved_tactic
        agents[fid].chain.emit("prove", {"theorem": thm, "outcome": pr.outcome,
                                         "proved_tactic": pr.proved_tactic,
                                         "verifier": pr.verifier})

    # --- snapshots + summary ---
    snapshots = {fid: ag.snapshot() for fid, ag in agents.items()}
    harness_summary = {fid: {"passed": ag.last_harness.passed,
                             "total": ag.last_harness.total}
                       for fid, ag in agents.items()}
    chains_ok = {fid: ag.chain.verify() for fid, ag in agents.items()}

    summary = {
        "n_agents": len(agents),
        "all_chains_verified": all(chains_ok.values()),
        "total_ticks": sum(ag.tick_count for ag in agents.values()),
        "harness_total_passed": sum(h["passed"] for h in harness_summary.values()),
        "harness_total": sum(h["total"] for h in harness_summary.values()),
        "harness_per_formula": harness_summary,
        "chains_verified": chains_ok,
        "sprint": sprint_results,
        "sprint_outcomes": {fid: sprint_results[fid]["outcome"] for fid in sprint_results},
    }

    with open(os.path.join(OUT, "snapshots.json"), "w") as fh:
        json.dump(snapshots, fh, indent=2, default=str)
    with open(os.path.join(OUT, "summary.json"), "w") as fh:
        json.dump(summary, fh, indent=2, default=str)
    with open(os.path.join(OUT, "sprint.json"), "w") as fh:
        json.dump(sprint_results, fh, indent=2, default=str)

    print("AGENTS:", summary["n_agents"])
    print("TOTAL TICKS:", summary["total_ticks"])
    print("ALL CHAINS VERIFIED:", summary["all_chains_verified"])
    print("HARNESS:", summary["harness_total_passed"], "/", summary["harness_total"])
    print("SPRINT OUTCOMES:", summary["sprint_outcomes"])
    return summary


if __name__ == "__main__":
    main()
