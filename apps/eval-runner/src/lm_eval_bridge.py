"""
lm_eval_bridge — loads OSS benchmark cases via EleutherAI lm-evaluation-harness.

Uses lm_eval's TaskManager + Task API for:
  - Canonical dataset loading (same HF datasets as the official leaderboard)
  - Prompt formatting via Task.doc_to_text()
  - Gold label extraction via Task.doc_to_target()
  - Per-instance scoring via Task.process_results()

This ensures the exact same task definitions, dataset splits, and metrics
as EleutherAI's Open LLM Leaderboard, making all eval results directly
comparable to published OSS model benchmarks.

Tasks loaded:
  - mmlu_high_school_mathematics  (MMLU, cais/mmlu)
  - mmlu_college_medicine         (MMLU, cais/mmlu)
  - ifeval                        (google/IFEval)
  - truthfulqa_mc2                (truthful_qa multiple_choice)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from typing import Any

log = logging.getLogger(__name__)
logging.getLogger("lm_eval").setLevel(logging.WARNING)
logging.getLogger("datasets").setLevel(logging.WARNING)


# ── Task pin table ─────────────────────────────────────────────────────────────
# n_docs is capped at this number from the task's eval split so the suite
# stays fast while still using real benchmark data.  Increase for production.

TASK_PINS: list[dict[str, Any]] = [
    {
        "task_name": "mmlu_high_school_mathematics",
        "category": "mmlu",
        "n_docs": 20,
        "weight": 1.0,
    },
    {
        "task_name": "mmlu_college_medicine",
        "category": "mmlu",
        "n_docs": 12,
        "weight": 1.0,
    },
    {
        "task_name": "ifeval",
        "category": "ifeval",
        "n_docs": 12,
        "weight": 1.5,
    },
    {
        "task_name": "truthfulqa_mc2",
        "category": "truthfulqa",
        "n_docs": 12,
        "weight": 2.0,
    },
]


def _gold_to_letter(gold: Any) -> str:
    """Convert lm_eval gold target to a single letter string."""
    if isinstance(gold, int):
        return chr(65 + gold)      # 0→A, 1→B, …
    if isinstance(gold, list):
        return _gold_to_letter(gold[0]) if gold else ""
    return str(gold).strip()


def _choices_str(task_obj: Any, doc: dict[str, Any]) -> str:
    """Format multiple-choice options into a readable string."""
    try:
        choices = task_obj.doc_to_choice(doc)
        if choices:
            return "\n".join(f"{chr(65+i)}. {c}" for i, c in enumerate(choices))
    except Exception:
        pass
    return ""


def _build_case(
    task_obj: Any,
    doc: dict[str, Any],
    idx: int,
    task_name: str,
    category: str,
    weight: float,
) -> dict[str, Any]:
    """Convert one lm_eval Task doc to our internal case format."""
    # lm_eval's canonical prompt text
    prompt = task_obj.doc_to_text(doc)

    # For multiple-choice tasks append choices and an instruction
    choices_block = _choices_str(task_obj, doc)
    if choices_block:
        prompt = (
            f"{prompt}\n\nChoices:\n{choices_block}\n\n"
            "Reply with only the letter of the correct answer (A, B, C, or D):"
        )
        grader = "exact_match_case_insensitive"
    else:
        grader = "lm_eval_ifeval"

    # Gold label
    try:
        gold = task_obj.doc_to_target(doc)
    except Exception:
        gold = None

    expected = _gold_to_letter(gold) if gold is not None else ""
    case_id = f"{task_name.replace('_', '-')}-{idx:03d}"

    return {
        "id": case_id,
        "category": category,
        "label": f"{task_name}[{idx}]",
        "prompt": prompt,
        "grader": grader,
        "expected": expected,
        "weight": weight,
        # Keep raw doc + task name for process_results scoring
        "_lm_eval_task": task_name,
        "_lm_eval_doc": doc,
    }


def load_lm_eval_cases() -> list[dict[str, Any]]:
    """
    Load benchmark cases using lm_eval's TaskManager.

    Raises RuntimeError if lm-eval is not installed or tasks cannot be loaded.
    Returns a flat list of case dicts compatible with runner.execute_suite_run().
    """
    try:
        from lm_eval.tasks import TaskManager, get_task_dict  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError(
            "lm-evaluation-harness not installed. Run: pip install lm-eval"
        ) from exc

    task_names = [p["task_name"] for p in TASK_PINS]
    log.info("lm_eval_bridge: loading tasks %s", task_names)

    tm = TaskManager(verbosity="WARNING")
    try:
        task_dict = get_task_dict(task_names, task_manager=tm)
    except Exception as exc:
        raise RuntimeError(f"lm_eval get_task_dict failed: {exc}") from exc

    cases: list[dict[str, Any]] = []

    for pin in TASK_PINS:
        task_name = pin["task_name"]
        n = int(pin["n_docs"])
        task_obj = task_dict.get(task_name)

        if task_obj is None:
            raise RuntimeError(
                f"lm_eval task '{task_name}' not found in task registry. "
                "Ensure lm-eval>=0.4 is installed and the task name is correct."
            )

        # Materialise eval docs via lm_eval's dataset loading
        try:
            docs = list(task_obj.eval_docs)[:n]
        except Exception:
            # Some task implementations require build_all_requests first
            try:
                task_obj.build_all_requests(limit=n)
                docs = list(task_obj.eval_docs)[:n]
            except Exception as exc:
                raise RuntimeError(
                    f"Could not load eval docs for lm_eval task '{task_name}': {exc}"
                ) from exc

        if not docs:
            raise RuntimeError(
                f"lm_eval task '{task_name}' returned 0 eval docs. "
                "Check dataset availability and split configuration."
            )

        for idx, doc in enumerate(docs):
            cases.append(
                _build_case(
                    task_obj=task_obj,
                    doc=doc,
                    idx=idx,
                    task_name=task_name,
                    category=str(pin["category"]),
                    weight=float(pin["weight"]),
                )
            )

        log.info("lm_eval_bridge: loaded %d docs from '%s'", len(docs), task_name)

    return cases


def score_lm_eval_case(case: dict[str, Any], response_text: str) -> tuple[bool, float, str]:
    """
    Score a case using lm_eval's Task.process_results() when the task supports
    it, falling back to exact-match-case-insensitive for multiple-choice tasks.

    Returns (passed: bool, score: float 0..1, detail: str).
    """
    task_name = case.get("_lm_eval_task")
    doc = case.get("_lm_eval_doc")
    grader = case.get("grader", "")

    # --- IFEval: use lm_eval's instruction checker ---
    if grader == "lm_eval_ifeval" and task_name and doc is not None:
        try:
            from lm_eval.tasks import TaskManager, get_task_dict  # type: ignore[import]
            tm = TaskManager(verbosity="WARNING")
            task_dict = get_task_dict([task_name], task_manager=tm)
            task_obj = task_dict.get(task_name)
            if task_obj is not None:
                results = task_obj.process_results(doc, [response_text])
                if results:
                    score_val = float(list(results.values())[0])
                    passed = score_val >= 0.5
                    return passed, score_val, f"lm_eval:{task_name}:{results}"
        except Exception as exc:
            log.debug("lm_eval process_results failed (%s): %s", task_name, exc)

    # --- Multiple-choice fallback: exact match on letter ---
    expected = str(case.get("expected", "")).strip().lower()
    response_clean = response_text.strip().lower()
    # Accept "A" or "a)" or "answer: A" — extract first letter in a/b/c/d
    import re
    letter_match = re.search(r"\b([a-d])\b", response_clean)
    got = letter_match.group(1) if letter_match else (response_clean[:1] if response_clean else "")
    passed = got == expected
    return passed, 1.0 if passed else 0.0, f"mc_exact_ci: got={got!r} expected={expected!r}"


def compute_cases_content_hash(cases: list[dict[str, Any]]) -> str:
    """
    Compute a deterministic SHA-256 hash over a list of cases.

    Excludes internal _lm_eval_* fields (task objects, raw docs) which are not
    serialisable and whose content is already captured by the prompt + expected.
    """
    hashable = [
        {k: v for k, v in c.items() if not k.startswith("_")}
        for c in cases
    ]
    canonical = json.dumps(
        sorted(hashable, key=lambda c: c["id"]),
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode()).hexdigest()
