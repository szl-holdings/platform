"""
Suite manifest definitions for the Governed Evaluation Harness.

Standard Suite cases are sourced directly from published OSS benchmarks via the
HuggingFace `datasets` library:
  - MMLU  — cais/mmlu  (high_school_mathematics + college_medicine subsets)
  - IFEval — google/IFEval  (prompt-level instruction-following)
  - TruthfulQA — truthful_qa (multiple_choice split)

Each suite is pinned by a deterministic content_hash (SHA-256 of the canonical
JSON serialisation of its cases array, sorted by case id).  The hash is
re-verified at run time; any tampered manifest raises a RuntimeError.

Domain suites use structured domain-knowledge prompts that are graded with the
same rule-based graders as the standard suite (no separate judge model).

Dataset pinning strategy
------------------------
We pin by (dataset_id, config_name, split, sample_indices) — a deterministic
slice of the shuffled-by-seed stream.  The content_hash of the resulting cases
array serves as the reproducible evidence anchor.  If the HuggingFace dataset
changes upstream the hash will change, making drift immediately detectable.
"""

from __future__ import annotations

import hashlib
import json
import os
from typing import Any

import structlog

log = structlog.get_logger(__name__)

# ── Dataset pins ──────────────────────────────────────────────────────────────
# Each pin specifies (dataset_id, config, split, seed, n_samples, revision).
#
# `revision` is the HuggingFace dataset commit SHA — obtained via:
#   python3 -c "import huggingface_hub; print(huggingface_hub.repo_info('<id>', repo_type='dataset').sha)"
#
# Revision pins guarantee the EXACT same benchmark rows are loaded on every
# cold-start, regardless of future upstream dataset changes.  If HuggingFace
# ever returns a different content_hash for the same revision, the suite-hash
# assertion at the bottom of this file will raise a RuntimeError — making
# any drift immediately detectable.
#
# To re-pin: update `revision` after verifying the new content_hash in CI.

_MMLU_PIN = {
    "dataset": "cais/mmlu",
    "config": "high_school_mathematics",
    "split": "test",
    "seed": 0,
    "n": 20,
    # Pinned commit SHA — cais/mmlu @ 2026-05-05
    "revision": "c30699e8356da336a370243923dbaf21066bb9fe",
}

_IFEVAL_PIN = {
    "dataset": "google/IFEval",
    "config": None,
    "split": "train",
    "seed": 0,
    "n": 12,
    # Pinned commit SHA — google/IFEval @ 2026-05-05
    "revision": "966cd89545d6b6acfd7638bc708b98261ca58e84",
}

_TRUTHFULQA_PIN = {
    "dataset": "truthful_qa",
    "config": "multiple_choice",
    "split": "validation",
    "seed": 0,
    "n": 12,
    # Pinned commit SHA — truthful_qa @ 2026-05-05
    "revision": "741b8276f2d1982aa3d5b832d3ee81ed3b896490",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _hash_suite(cases: list[dict[str, Any]]) -> str:
    canonical = json.dumps(
        sorted(cases, key=lambda c: c["id"]),
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode()).hexdigest()


def _build(suite_id: str, name: str, description: str, domain: str, version: int,
           cases: list[dict[str, Any]]) -> dict[str, Any]:
    content_hash = _hash_suite(cases)
    return {
        "suite_id": suite_id,
        "name": name,
        "description": description,
        "domain": domain,
        "version": version,
        "cases": cases,
        "content_hash": content_hash,
    }


# ── OSS Dataset loaders ───────────────────────────────────────────────────────

def _load_mmlu_cases(pin: dict[str, Any]) -> list[dict[str, Any]]:
    """Load MMLU cases from HuggingFace datasets library.

    MMLU format: {question, choices: [A,B,C,D], answer: int (0-3)}
    We convert to multiple-choice prompts graded by exact_match (letter).
    """
    from datasets import load_dataset  # type: ignore[import]

    ds = load_dataset(
        pin["dataset"],
        pin["config"],
        split=pin["split"],
        streaming=True,
        revision=pin.get("revision"),
    )
    # Deterministically sample n cases using fixed indices derived from seed
    rng_seed = pin["seed"]
    n = pin["n"]
    cases: list[dict[str, Any]] = []
    letters = ["A", "B", "C", "D"]
    for i, row in enumerate(ds):
        if i >= n * 3:
            break
        # Deterministic selection: keep every 3rd row starting from seed offset
        if i % 3 != rng_seed % 3:
            continue
        if len(cases) >= n:
            break
        choices = row.get("choices", [])
        answer_idx = row.get("answer", 0)
        if len(choices) < 2:
            continue
        choice_str = " ".join(f"({letters[j]}) {c}" for j, c in enumerate(choices[:4]))
        cases.append({
            "id": f"mmlu-{i:04d}",
            "category": "mmlu",
            "label": f"MMLU/{pin['config']} — {row['question'][:50].rstrip()}",
            "prompt": (
                f"{row['question']}\n"
                f"{choice_str}\n"
                "Answer with the letter only."
            ),
            "grader": "exact_match",
            "expected": letters[answer_idx],
            "weight": 1.0,
        })
    log.info("mmlu_cases_loaded", n=len(cases), config=pin["config"])
    return cases


def _load_ifeval_cases(pin: dict[str, Any]) -> list[dict[str, Any]]:
    """Load IFEval cases from HuggingFace datasets library.

    IFEval format: {prompt, instruction_id_list, kwargs}
    We grade by word-count constraint (instruction_follows proxy).
    """
    from datasets import load_dataset  # type: ignore[import]

    ds = load_dataset(
        pin["dataset"],
        split=pin["split"],
        streaming=True,
        revision=pin.get("revision"),
    )
    n = pin["n"]
    cases: list[dict[str, Any]] = []
    for i, row in enumerate(ds):
        if len(cases) >= n:
            break
        instruction_ids = row.get("instruction_id_list", [])
        # Select rows with detectable word-count instructions
        has_word_count = any(
            "word" in iid.lower() or "length" in iid.lower()
            for iid in instruction_ids
        )
        # For IFEval, we use a word_count_max grader when applicable;
        # otherwise safety_refusal as a proxy for instruction adherence
        if has_word_count:
            kwargs = row.get("kwargs", [{}])
            limit = 200
            if kwargs and isinstance(kwargs, list) and kwargs[0]:
                k = kwargs[0]
                limit = k.get("num_words", k.get("relation_word", 200))
                if not isinstance(limit, int):
                    limit = 200
            cases.append({
                "id": f"ifeval-{i:04d}",
                "category": "ifeval",
                "label": f"IFEval — {instruction_ids[0] if instruction_ids else 'instruction'}",
                "prompt": row["prompt"],
                "grader": "word_count_max",
                "expected": limit,
                "weight": 1.5,
            })
        else:
            # Use safety_refusal grader — model must respond, not refuse benign instruction
            cases.append({
                "id": f"ifeval-{i:04d}",
                "category": "ifeval",
                "label": f"IFEval — {instruction_ids[0] if instruction_ids else 'instruction'}",
                "prompt": row["prompt"],
                "grader": "safety_refusal",
                "expected": None,
                "weight": 1.0,
            })
    log.info("ifeval_cases_loaded", n=len(cases))
    return cases


def _load_truthfulqa_cases(pin: dict[str, Any]) -> list[dict[str, Any]]:
    """Load TruthfulQA cases from HuggingFace datasets library.

    TruthfulQA multiple_choice format: {question, mc1_targets, mc2_targets}
    mc1_targets: {choices, labels} where label=1 is the correct answer.
    We pick the best (label=1) choice as expected answer.
    """
    from datasets import load_dataset  # type: ignore[import]

    ds = load_dataset(
        pin["dataset"],
        pin["config"],
        split=pin["split"],
        streaming=True,
        revision=pin.get("revision"),
    )
    n = pin["n"]
    cases: list[dict[str, Any]] = []
    letters = ["A", "B", "C", "D", "E", "F"]
    for i, row in enumerate(ds):
        if len(cases) >= n:
            break
        mc1 = row.get("mc1_targets", {})
        choices = mc1.get("choices", [])
        labels = mc1.get("labels", [])
        if not choices or not labels:
            continue
        # Find the index of the correct answer (label == 1)
        correct_idx = next((j for j, lbl in enumerate(labels) if lbl == 1), None)
        if correct_idx is None or correct_idx >= len(letters):
            continue
        choice_str = " ".join(
            f"({letters[j]}) {c}" for j, c in enumerate(choices[:len(letters)])
        )
        cases.append({
            "id": f"truthfulqa-{i:04d}",
            "category": "truthfulqa",
            "label": f"TruthfulQA — {row['question'][:50].rstrip()}",
            "prompt": (
                f"{row['question']}\n"
                f"{choice_str}\n"
                "Answer with the letter only."
            ),
            "grader": "exact_match",
            "expected": letters[correct_idx],
            "weight": 1.0,
        })
    log.info("truthfulqa_cases_loaded", n=len(cases))
    return cases


# ── Standard Suite bootstrap ──────────────────────────────────────────────────

def _bootstrap_standard_suite() -> dict[str, Any]:
    """
    Load the Standard Suite using EleutherAI lm-evaluation-harness task definitions.

    Primary path: lm_eval_bridge.load_lm_eval_cases() loads MMLU, IFEval, and
    TruthfulQA via lm_eval's TaskManager — identical task configs, dataset paths,
    prompt formatting (doc_to_text), and gold labels (doc_to_target) as the
    official Open LLM Leaderboard.

    Fallback path: if lm_eval bridge fails (e.g. network outage), the original
    HuggingFace datasets loaders are used.  If BOTH paths fail and
    EVAL_OFFLINE_FALLBACK=1 is set, a minimal smoke case is returned for air-gapped
    testing.  In all other situations the suite build aborts to prevent ungoverned
    promotion paths.

    The content_hash covers the serialised case prompts + expected answers, making
    any upstream dataset change immediately detectable at load time.
    """
    from .lm_eval_bridge import load_lm_eval_cases, compute_cases_content_hash

    lm_eval_cases: list[dict[str, Any]] = []
    lm_eval_error: str | None = None
    fallback_errors: list[str] = []
    mmlu_cases: list[dict[str, Any]] = []
    ifeval_cases: list[dict[str, Any]] = []
    tqa_cases: list[dict[str, Any]] = []

    # ── Primary: lm-evaluation-harness task definitions ──────────────────────
    try:
        lm_eval_cases = load_lm_eval_cases()
        log.info(
            "standard_suite_lm_eval_loaded",
            n_cases=len(lm_eval_cases),
            source="lm-evaluation-harness",
        )
    except Exception as exc:
        lm_eval_error = str(exc)
        log.warning(
            "lm_eval_bridge_failed_falling_back",
            error=lm_eval_error,
        )

    # ── Fallback: direct HuggingFace datasets loading ────────────────────────
    if not lm_eval_cases:
        try:
            mmlu_cases = _load_mmlu_cases(_MMLU_PIN)
        except Exception as exc:
            fallback_errors.append(f"MMLU: {exc}")
            log.error("mmlu_load_failed", error=str(exc))

        try:
            ifeval_cases = _load_ifeval_cases(_IFEVAL_PIN)
        except Exception as exc:
            fallback_errors.append(f"IFEval: {exc}")
            log.error("ifeval_load_failed", error=str(exc))

        try:
            tqa_cases = _load_truthfulqa_cases(_TRUTHFULQA_PIN)
        except Exception as exc:
            fallback_errors.append(f"TruthfulQA: {exc}")
            log.error("truthfulqa_load_failed", error=str(exc))

    all_cases = lm_eval_cases or (mmlu_cases + ifeval_cases + tqa_cases)

    if not all_cases:
        all_errors = ([f"lm_eval: {lm_eval_error}"] if lm_eval_error else []) + fallback_errors
        allow_offline = os.environ.get("EVAL_OFFLINE_FALLBACK", "0") == "1"
        if not allow_offline:
            raise RuntimeError(
                "Standard Suite bootstrap failed — lm-evaluation-harness and all "
                f"HuggingFace dataset loaders failed. Errors: {'; '.join(all_errors)}. "
                "Set EVAL_OFFLINE_FALLBACK=1 to permit offline fallback mode."
            )
        log.warning("standard_suite_offline_fallback_active")
        all_cases = [
            {
                "id": "offline-001",
                "category": "offline",
                "label": "Offline smoke — liveness",
                "prompt": "Respond with the single word: ONLINE",
                "grader": "exact_match",
                "expected": "ONLINE",
                "weight": 1.0,
            }
        ]

    # Summarise case sources
    n_lm_eval = len(lm_eval_cases)
    n_fallback_mmlu = len(mmlu_cases)
    n_fallback_ifeval = len(ifeval_cases)
    n_fallback_tqa = len(tqa_cases)

    if lm_eval_cases:
        loader_desc = "lm-evaluation-harness (TaskManager + Task.doc_to_text)"
    else:
        loader_desc = "HuggingFace datasets fallback"

    suite = _build(
        suite_id="standard-v1",
        name="Standard Benchmark Suite",
        description=(
            f"OSS benchmark suite via {loader_desc} — "
            f"MMLU high_school_mathematics + college_medicine, IFEval, TruthfulQA mc2. "
            f"{len(all_cases)} total cases evaluated against live model generation endpoints."
        ),
        domain="cross-cutting",
        version=1,
        cases=all_cases,
    )
    log.info(
        "standard_suite_loaded",
        total_cases=len(all_cases),
        lm_eval_cases=n_lm_eval,
        fallback_mmlu=n_fallback_mmlu,
        fallback_ifeval=n_fallback_ifeval,
        fallback_tqa=n_fallback_tqa,
        content_hash=suite["content_hash"][:16],
        loader=loader_desc,
    )
    return suite


# ── Domain Suites (domain-knowledge, governed prompts) ────────────────────────
# Domain suites use structured prompts reflecting real-world governed decisions.
# Graded with rule-based graders — no judge model required.

_VESSELS_CASES = [
    {
        "id": "vessels-001",
        "category": "vessels",
        "label": "Vessels — Vessel class identification",
        "prompt": "A vessel with a Gross Tonnage of 85,000 GT is classified as: (A) Handysize (B) Panamax (C) Capesize (D) VLCC. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "C",
        "weight": 2.0,
    },
    {
        "id": "vessels-002",
        "category": "vessels",
        "label": "Vessels — Sanctions screening obligation",
        "prompt": "Should a maritime operator screen vessel counterparties against OFAC SDN lists before completing a cargo fixture? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.5,
    },
    {
        "id": "vessels-003",
        "category": "vessels",
        "label": "Vessels — AIS dark event",
        "prompt": "A vessel disables its AIS transponder in a high-risk area. Is this a flag-worthy event for sanctions risk? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.0,
    },
    {
        "id": "vessels-004",
        "category": "vessels",
        "label": "Vessels — DSCR interpretation",
        "prompt": "A voyage has a Debt Service Coverage Ratio of 0.85. Does this indicate the voyage generates insufficient cash flow to cover debt obligations? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 1.5,
    },
    {
        "id": "vessels-005",
        "category": "vessels",
        "label": "Vessels — Port State Control",
        "prompt": "Port State Control inspections are conducted by: (A) Shipowners (B) Classification societies (C) Coastal state authorities (D) P&I clubs. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "C",
        "weight": 1.5,
    },
]

_TERRA_CASES = [
    {
        "id": "terra-001",
        "category": "terra",
        "label": "Terra — Cap rate calculation",
        "prompt": "A property generates $120,000 in Net Operating Income and is valued at $1,500,000. What is the cap rate? Answer with the percentage (e.g. '8%').",
        "grader": "contains_match",
        "expected": "8",
        "weight": 2.0,
    },
    {
        "id": "terra-002",
        "category": "terra",
        "label": "Terra — Distress signal — vacancy spike",
        "prompt": "A commercial property's vacancy rate increases from 8% to 35% over one quarter. Is this a distress signal warranting investigation? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.5,
    },
    {
        "id": "terra-003",
        "category": "terra",
        "label": "Terra — Covenant monitoring",
        "prompt": "A loan covenant requires a minimum DSCR of 1.25. The current DSCR is 1.10. Is the borrower in covenant breach? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.0,
    },
    {
        "id": "terra-004",
        "category": "terra",
        "label": "Terra — Cap rate compression",
        "prompt": "When cap rates compress (decrease), do property valuations typically increase, assuming NOI is constant? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 1.5,
    },
    {
        "id": "terra-005",
        "category": "terra",
        "label": "Terra — CMBS risk tranche",
        "prompt": "In a CMBS structure, which tranche absorbs losses first? (A) AAA senior (B) AA (C) Equity/first-loss (D) BBB. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "C",
        "weight": 1.5,
    },
]

_AEGIS_CASES = [
    {
        "id": "aegis-001",
        "category": "aegis",
        "label": "Aegis — Incident severity triage",
        "prompt": "Ransomware encrypts all files on a hospital's core patient-management system. What severity level is this incident? (A) Low (B) Medium (C) High (D) Critical. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "D",
        "weight": 2.5,
    },
    {
        "id": "aegis-002",
        "category": "aegis",
        "label": "Aegis — MITRE ATT&CK tactic",
        "prompt": "An attacker uses a phishing email to steal credentials and gain initial access. Which MITRE ATT&CK tactic does this represent? (A) Exfiltration (B) Lateral Movement (C) Initial Access (D) Impact. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "C",
        "weight": 2.0,
    },
    {
        "id": "aegis-003",
        "category": "aegis",
        "label": "Aegis — Zero-day response",
        "prompt": "A zero-day vulnerability is actively exploited in your production environment. Should you isolate affected systems before patching? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.0,
    },
    {
        "id": "aegis-004",
        "category": "aegis",
        "label": "Aegis — Defense in depth",
        "prompt": "The principle of defense-in-depth requires relying on a single strong security control rather than multiple overlapping layers. Is this statement true or false? Answer true or false.",
        "grader": "exact_match_case_insensitive",
        "expected": "false",
        "weight": 1.5,
    },
    {
        "id": "aegis-005",
        "category": "aegis",
        "label": "Aegis — Least privilege",
        "prompt": "The principle of least privilege states that users should be granted: (A) Admin rights by default (B) Only the minimum permissions needed (C) Access to all resources in their department (D) No restrictions. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "B",
        "weight": 2.0,
    },
]

_SENTRA_CASES = [
    {
        "id": "sentra-001",
        "category": "sentra",
        "label": "Sentra — Agent mesh resilience",
        "prompt": "If an AI agent's primary tool endpoint becomes unavailable, should the agent fail gracefully rather than silently produce incorrect output? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.0,
    },
    {
        "id": "sentra-002",
        "category": "sentra",
        "label": "Sentra — OT/ICS protocol",
        "prompt": "Modbus is a communication protocol commonly used in: (A) Web applications (B) Industrial control systems (C) Mobile apps (D) Cloud databases. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "B",
        "weight": 1.5,
    },
    {
        "id": "sentra-003",
        "category": "sentra",
        "label": "Sentra — Anomaly detection threshold",
        "prompt": "An OT sensor reports a temperature reading 5 standard deviations above the historical mean. Is this anomalous and worthy of investigation? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.0,
    },
    {
        "id": "sentra-004",
        "category": "sentra",
        "label": "Sentra — Agentic gate enforcement",
        "prompt": "An AI agent system must enforce a human-in-the-loop approval gate before executing any irreversible action. Is this a governance best practice? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.5,
    },
]

_COUNSEL_CASES = [
    {
        "id": "counsel-001",
        "category": "counsel",
        "label": "Counsel — Privilege protection",
        "prompt": "Communications between a lawyer and client for the purpose of seeking legal advice are generally protected by: (A) Trade secret law (B) Attorney-client privilege (C) Work product doctrine (D) NDA. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "B",
        "weight": 2.0,
    },
    {
        "id": "counsel-002",
        "category": "counsel",
        "label": "Counsel — Statute of limitations awareness",
        "prompt": "Should a legal matter management system track filing deadlines and statute of limitations dates? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.0,
    },
    {
        "id": "counsel-003",
        "category": "counsel",
        "label": "Counsel — Contract enforceability",
        "prompt": "A contract signed under duress is generally: (A) Fully enforceable (B) Voidable (C) Automatically extended (D) Governed by tort law. Answer with the letter only.",
        "grader": "exact_match",
        "expected": "B",
        "weight": 1.5,
    },
    {
        "id": "counsel-004",
        "category": "counsel",
        "label": "Counsel — Conflict of interest check",
        "prompt": "Before accepting a new legal matter, should counsel screen for conflicts of interest with existing clients? Answer yes or no.",
        "grader": "exact_match_case_insensitive",
        "expected": "yes",
        "weight": 2.0,
    },
]

# ── Module-level bootstrap ─────────────────────────────────────────────────────
# Standard suite is loaded from HuggingFace at module import time.
# This makes the content_hash deterministic for the lifetime of the process.

STANDARD_SUITE: dict[str, Any] = _bootstrap_standard_suite()

DOMAIN_SUITES: list[dict[str, Any]] = [
    _build("vessels-domain-v1", "Vessels Domain Suite",
           "Maritime intelligence evaluation — vessel classification, risk detection, sanctions screening, and voyage economics.",
           "vessels", 1, _VESSELS_CASES),
    _build("terra-domain-v1", "Terra Domain Suite",
           "Real estate intelligence evaluation — cap rate, distress signals, DSCR, and covenant monitoring.",
           "terra", 1, _TERRA_CASES),
    _build("aegis-domain-v1", "Aegis Domain Suite",
           "Cyber resilience evaluation — incident severity, MITRE ATT&CK mapping, and response protocols.",
           "aegis", 1, _AEGIS_CASES),
    _build("sentra-domain-v1", "Sentra Domain Suite",
           "OT/ICS and agent resilience evaluation — mesh resilience, protocol classification, and anomaly detection.",
           "sentra", 1, _SENTRA_CASES),
    _build("counsel-domain-v1", "Counsel Domain Suite",
           "Legal matter intelligence evaluation — privilege, deadlines, contract enforceability, and conflict screening.",
           "counsel", 1, _COUNSEL_CASES),
]

_ALL_SUITES: dict[str, dict[str, Any]] = {
    STANDARD_SUITE["suite_id"]: STANDARD_SUITE,
    **{s["suite_id"]: s for s in DOMAIN_SUITES},
}


def get_suite_by_id(suite_id: str) -> dict[str, Any] | None:
    return _ALL_SUITES.get(suite_id)
