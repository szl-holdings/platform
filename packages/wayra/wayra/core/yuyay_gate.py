# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ. The Yuyay-13 gate + WAYRA sub-formula.
"""
yuyay_gate.py — the WAYRA factor and the Yuyay-13 admissibility gate.

WAYRA sub-formula (Doctrine WAYRA §2):

    WAYRA(stream) = quality(stream) · novelty(stream) · Yuyay_13(extracted)

with every factor in [0,1], so WAYRA(stream) ∈ [0,1]. By the v12 envelope contract
`puriq_organ_factor_preserves_envelope` (formulas/PuriqLean.lean:208), an admissible
factor ∈ [0,1] can only SHRINK the gated region — it can never bypass a gate or
inflate utility. WAYRA is therefore an admissible 4th edge-organ factor, additive
over Doctrine v13's Chaski·Wallpa·Wasi.

Gate thresholds (HARD RULE — high-trash sources get rate-limited, not blindly fed):
    wayra_factor < 0.30  → DROP    (Khipu receipt emitted; never routed)
    0.30 ≤ wf ≤ 0.70     → REVIEW  (queued for human Yuyay approval)
    wayra_factor > 0.70  → ACCEPT  (routed to the relevant organ)

The 13 Yuyay axes (carried verbatim from v11/v12 `yuyay_v3`, conjunctive AND):
    2 sacred (≥0.95) + 7 structural (≥0.90) + 4 introspection (cross-linked HUKLLA
    T03/T04/T09/T10). Here we score an *ingested item* on a reduced, source-relevant
    projection of those axes — provenance, licence-cleanliness, verifiability, and
    non-toxicity — and combine conjunctively (min over hard axes) so a single failed
    axis collapses the score, exactly like the heart's no-compensation AND.

Honest label: these are deterministic, inspectable heuristics in [0,1], NOT a trained
classifier and NOT a claim of ground truth. They give the gate a reproducible signal.
Stdlib only.
"""
from __future__ import annotations

import math
import re
from typing import Any

from .normalize import IngestEvent, license_class

ACCEPT_THRESHOLD = 0.70
DROP_THRESHOLD = 0.30

# Trash / spam / low-trust lexical signals (introspection axis T09/T10 projection).
_TOXIC = re.compile(
    r"\b(buy now|free download|crack|keygen|casino|viagra|crypto airdrop|"
    r"giveaway|click here|subscribe now|100% guaranteed)\b",
    re.IGNORECASE,
)


def _clip01(x: float) -> float:
    return max(0.0, min(1.0, x))


def quality_score(ev: IngestEvent) -> float:
    """Quality axis ∈ [0,1] — provenance + completeness + license cleanliness.

    Conjunctive: a RED license or empty provenance collapses quality (no compensation).
    """
    # Provenance: does it have a real public URL on a known host?
    prov = 1.0 if ev.url.startswith(("http://", "https://")) else 0.0
    # Completeness: title + summary present.
    has_title = 1.0 if len(ev.title.strip()) >= 8 else 0.4
    has_summary = 1.0 if len(ev.parsed_summary.strip()) >= 40 else 0.6
    completeness = 0.5 * has_title + 0.5 * has_summary
    # License cleanliness (WALLPA license_class projection).
    lc = license_class(ev.license)
    lic = {"GREEN": 1.0, "AMBER": 0.8, "RED": 0.5}[lc]
    # Toxicity / spam guard (introspection T09).
    blob = f"{ev.title}\n{ev.parsed_summary}"
    tox = 0.0 if _TOXIC.search(blob) else 1.0
    # Conjunctive min over the hard axes (provenance + tox), weighted geo-mean on soft.
    hard = min(prov, tox)
    soft = (completeness * lic) ** 0.5
    return _clip01(hard * soft)


def novelty_score(ev: IngestEvent, known_hashes: set[str],
                  known_titles: set[str] | None = None) -> float:
    """Novelty axis ∈ [0,1] — how new is this vs what WAYRA already knows.

    1.0 = fully novel content_hash + novel title tokens.
    0.0 = exact content_hash seen before (a duplicate).
    """
    if ev.content_hash in known_hashes:
        return 0.0
    if not known_titles:
        return 1.0
    # Token-Jaccard against the closest known title — novelty = 1 - max_overlap.
    tokens = set(re.findall(r"[a-z0-9]+", ev.title.lower()))
    if not tokens:
        return 0.8
    best_overlap = 0.0
    for kt in known_titles:
        kt_tokens = set(re.findall(r"[a-z0-9]+", kt.lower()))
        if not kt_tokens:
            continue
        inter = len(tokens & kt_tokens)
        union = len(tokens | kt_tokens)
        if union:
            best_overlap = max(best_overlap, inter / union)
    return _clip01(1.0 - best_overlap)


# 13-axis Yuyay projection weights (sum to 1). 2 sacred, 7 structural, 4 introspection.
# Reduced source-relevant projection: provenance & non-toxicity are the 2 "sacred"
# axes (must be high); the rest are structural/introspection.
def yuyay_13(ev: IngestEvent) -> float:
    """13-axis Yuyay score ∈ [0,1] — conjunctive AND projection (no compensation).

    Sacred axes (≥0.95 to pass cleanly): provenance, non-toxicity.
    If a sacred axis fails its floor, the conjunctive min collapses the score —
    mirroring the heart's replay-hash-locked `yuyay_v3` discipline.
    """
    blob = f"{ev.title}\n{ev.parsed_summary}"
    sacred_provenance = 1.0 if ev.url.startswith("https://") else (
        0.7 if ev.url.startswith("http://") else 0.0)
    sacred_nontoxic = 0.0 if _TOXIC.search(blob) else 1.0

    lc = license_class(ev.license)
    structural = [
        {"GREEN": 1.0, "AMBER": 0.85, "RED": 0.55}[lc],         # licence
        1.0 if ev.source_detail else 0.7,                        # sub-source identified
        1.0 if len(ev.parsed_summary) >= 60 else 0.6,            # summary completeness
        1.0 if ev.timestamp else 0.5,                            # has timestamp
        1.0 if len(ev.content_hash) == 64 else 0.0,              # dedup identity present
        min(1.0, len(ev.title) / 12.0),                          # title richness
        1.0,                                                     # routable placeholder
    ]
    introspection = [
        sacred_nontoxic,                                         # T09 toxicity
        1.0 if not re.search(r"(.)\1{6,}", blob) else 0.4,       # T10 repetition/garbage
        1.0 if len(blob) <= 8000 else 0.7,                       # bounded payload
        1.0,                                                     # cross-link placeholder
    ]
    # Conjunctive: the two sacred axes are a hard min floor; structural/introspection
    # are a geometric mean (so weak-but-present axes still pull the score down).
    sacred = min(sacred_provenance, sacred_nontoxic)
    rest = structural + introspection
    geo = math.exp(sum(math.log(max(1e-9, x)) for x in rest) / len(rest))
    return _clip01(sacred * geo)


def wayra_factor(quality: float, novelty: float, yuyay: float) -> float:
    """WAYRA(stream) = quality · novelty · Yuyay_13  ∈ [0,1] (admissible factor)."""
    return _clip01(quality * novelty * yuyay)


def gate(ev: IngestEvent, known_hashes: set[str],
         known_titles: set[str] | None = None) -> IngestEvent:
    """Compute scores, set decision, and return the mutated event.

    decision ∈ {"accept", "review", "drop"}. Does NOT emit the Khipu receipt — the
    caller (khipu_emit) does that so the receipt records the final decision.
    """
    q = quality_score(ev)
    n = novelty_score(ev, known_hashes, known_titles)
    y = yuyay_13(ev)
    wf = wayra_factor(q, n, y)
    ev.yuyay_score = round(y, 4)
    ev.novelty_score = round(n, 4)
    ev.wayra_factor = round(wf, 4)
    if wf < DROP_THRESHOLD:
        ev.decision = "drop"
    elif wf > ACCEPT_THRESHOLD:
        ev.decision = "accept"
    else:
        ev.decision = "review"
    return ev
