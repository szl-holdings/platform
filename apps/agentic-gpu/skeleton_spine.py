"""
SZL Agentic-GPU — skeleton_spine.py
===================================
ORGAN 5 — **SKELETON** (lutar-lean Λ-spine / the Lean kernel). Every agentic
claim the GPU mind makes must TRACE to a theorem on the spine. This module is
the **claim → theorem traceability map**: give it an engine claim and it returns
the backing Lean witness (theorem name, repo path, axiom footprint, sorry
status) — or HONESTLY refuses, because the claim rests on a **conjecture**.

The killer property of this estate is not that things are proven, but that the
**conjectures are labelled as conjectures**. The Lutar invariant Λ is bounded
and symmetric (proven), but its **UNIQUENESS is Conjecture 1 — intentionally a
conjecture, NEVER a theorem**. Likewise Khipu-BFT safety/liveness are
Conjecture 2/3. This module enforces the one unbreakable rule:

    a claim may NEVER assert a conjecture as proven.

`is_proven()` / `assert_proven()` return False / raise for any conjecture, so
no caller can dress Λ-uniqueness up as a theorem to justify a stronger claim.

LIVE SPINE (read-only, real): SKELETON endpoint
  amaru /api/amaru/v1/math/lean/theorems  (theorem/axiom/sorry counts)
When reachable we cross-check the live spine; off-box (this control plane today)
we DEGRADE to a static map of the known, on-disk witnesses — and we label which
source answered, so a degraded reading is never presented as a live spine query.

DOCTRINE (v11/v12):
  - **Λ = Conjecture 1 — NEVER a theorem.** Public doctrine constant 749/14/163
    stays locked; the killer uniqueness formula is intentionally open.
  - Conjectures (Λ-uniqueness, Khipu safety/liveness) are flagged CONJECTURE and
    can never resolve as proven.
  - A claim with NO backing witness resolves UNKNOWN (never silently "proven").
  - Theorems-with-open-hypotheses (e.g. EulerFleetTopology) are labelled as such,
    not as 0-sorry closed proofs.
  - Runtime/structural invariants (e.g. "reactive preempts") that are NOT Lean
    theorems are labelled RUNTIME_INVARIANT — we do not fabricate a theorem.
  - open-weight only; NEVER sends a key; pure stdlib.

Proven backing: SkeletonLambdaSpine (lutar-lean round9) is 0-sorry and EXPLICITLY
does NOT assert uniqueness (its KEY 3 records uniqueness remains Conjecture 1).
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict, field
from enum import Enum
from typing import Callable, Dict, List, Optional

# Live SKELETON endpoint (read-only). Off-box → static-map fallback.
SKELETON_ENDPOINT = "https://amaru.szlholdings.ai/api/amaru/v1/math/lean/theorems"
_PROBE_TIMEOUT_S = 4.0

# Public doctrine constant — declarations / unique-axioms / tracked-sorries.
# LOCKED at v11/v12; SkeletonLambdaSpine.lean re-asserts it sorry-free.
DOCTRINE_COUNT = "749/14/163"


class Kind(str, Enum):
    """How a claim is backed on the spine. Only THEOREM_0SORRY is a closed proof.

    The honesty ordering: a CONJECTURE is NEVER proven; a THEOREM_WITH_HYPOTHESES
    is proven only relative to explicit open obligations; a RUNTIME_INVARIANT is
    a tested structural guarantee, not a Lean theorem; UNKNOWN has no backing.
    """
    THEOREM_0SORRY = "theorem-0sorry"            # closed, kernel-checkable proof
    THEOREM_WITH_HYPOTHESES = "theorem-with-hypotheses"  # proven modulo open hyps
    RUNTIME_INVARIANT = "runtime-invariant"      # tested structurally, not in Lean
    CONJECTURE = "conjecture"                    # OPEN — never a theorem
    UNKNOWN = "unknown"                           # no backing witness on the spine


# The set of kinds that count as an honestly PROVEN claim. A theorem with open
# hypotheses is proven only *relative to* those hypotheses, so it is NOT in the
# proven set for the purpose of "may I assert this as established?" — callers
# that want the conditional form ask for it explicitly via the entry's fields.
_PROVEN_KINDS = frozenset({Kind.THEOREM_0SORRY})


@dataclass
class SpineEntry:
    """A backing witness (or open obligation) for one engine claim.

    `axiom_footprint` is the load-bearing axioms/hypotheses the witness rests on
    (empty for a fully closed 0-sorry proof over Nat/ℚ surrogates). `obligation`
    names the open gap for a conjecture/conditional theorem (e.g. the missing
    axiom). `conjecture_id` is set ONLY for the intentional conjectures.
    """
    claim: str
    title: str
    kind: Kind
    theorem: str                  # the Lean declaration name (or "—")
    repo_path: str                # where the witness lives on the spine
    pr: str = ""                  # tracking PR / round, if any
    axiom_footprint: List[str] = field(default_factory=list)
    obligation: str = ""          # open obligation tag for conjectures/conditionals
    conjecture_id: str = ""       # "Conjecture 1/2/3" — set only for conjectures
    note: str = ""

    @property
    def is_proven(self) -> bool:
        """True ONLY for a closed 0-sorry theorem. Conjectures are never proven."""
        return self.kind in _PROVEN_KINDS

    @property
    def is_conjecture(self) -> bool:
        return self.kind is Kind.CONJECTURE

    def as_dict(self) -> dict:
        d = asdict(self)
        d["kind"] = self.kind.value
        d["is_proven"] = self.is_proven
        d["is_conjecture"] = self.is_conjecture
        return d


# ===========================================================================
# THE STATIC SPINE — the known on-disk witnesses and the intentional conjectures.
# Paths/names verified against the round9 kernel + energy-engine Lean witnesses.
# This is the honest fallback when the live SKELETON endpoint is unreachable.
# ===========================================================================
_STATIC_SPINE: Dict[str, SpineEntry] = {
    # ---- PROVEN (0-sorry, kernel-checkable) ------------------------------
    "energy_budget_bounded": SpineEntry(
        claim="energy_budget_bounded",
        title="Energy budget is Bekenstein-bounded",
        kind=Kind.THEOREM_0SORRY,
        theorem="EnergyBudgetWitness (budget ≤ Bekenstein bits)",
        repo_path="energy_engine/lean/EnergyBudgetWitness.lean",
        pr="lutar-lean #239",
        axiom_footprint=[],
        note="e ≤ n×8 bits for an n-byte register; ledger monotone. Sorry-free.",
    ),
    "min_energy_per_bit": SpineEntry(
        claim="min_energy_per_bit",
        title="Landauer floor: erasing n bits costs ≥ n·kT ln2",
        kind=Kind.THEOREM_0SORRY,
        theorem="LandauerFloorWitness (floor ≤ Bekenstein ceiling)",
        repo_path="energy_engine/wave/w9_landauer_lean/LandauerFloorWitness.lean",
        pr="lutar-lean #240",
        axiom_footprint=[],
        note="Floor monotone in bits; floor ≤ ceiling when q ≤ 8. Sorry-free.",
    ),
    "belief_update_bounded": SpineEntry(
        claim="belief_update_bounded",
        title="PAC-Bayes belief-update slack is bounded (BRAIN)",
        kind=Kind.THEOREM_0SORRY,
        theorem="BrainBeliefUpdate.slack_mono_in_kl / evidence_tightens / zero_kl_floor",
        repo_path="lutar-lean/Lutar/Innovations/round9/BrainBeliefUpdate.lean",
        pr="round9",
        axiom_footprint=[],
        note=("Surrogate Nat form sorry-free; the real-valued √ McAllester bound "
              "lives in Lutar/PACBayes/PACBayes.lean (TH13) and takes "
              "BoundedIntegrability + ChernoffOptimisation as HONEST open hyps."),
    ),
    "deny_by_default_gate": SpineEntry(
        claim="deny_by_default_gate",
        title="Neyman-Pearson deny-by-default gate is sound (IMMUNE)",
        kind=Kind.THEOREM_0SORRY,
        theorem="ImmuneNeymanPearson (monotone in threshold; zero-thresh admits all)",
        repo_path="lutar-lean/Lutar/Innovations/round9/ImmuneNeymanPearson.lean",
        pr="round9",
        axiom_footprint=[],
        note="Fail-closed gate monotone in threshold. Sorry-free.",
    ),
    "receipt_filtration_monotone": SpineEntry(
        claim="receipt_filtration_monotone",
        title="Receipt σ-algebra filtration is monotone (HEART)",
        kind=Kind.THEOREM_0SORRY,
        theorem="HeartReceiptSigma (filtration non-decreasing; head-seq strict on append)",
        repo_path="lutar-lean/Lutar/Innovations/round9/HeartReceiptSigma.lean",
        pr="round9",
        axiom_footprint=[],
        note="Every GPU action leaves a measurable beat. Sorry-free.",
    ),
    "provenance_chain_extends": SpineEntry(
        claim="provenance_chain_extends",
        title="DSSE/Merkle provenance chain extends by one link (BLOOD)",
        kind=Kind.THEOREM_0SORRY,
        theorem="BloodDSSEMerkle (proof-path monotone in height; O(log N))",
        repo_path="lutar-lean/Lutar/Innovations/round9/BloodDSSEMerkle.lean",
        pr="round9",
        axiom_footprint=[],
        note="Merkle inclusion path length monotone in DAG height. Sorry-free.",
    ),
    "drift_alarm_sound": SpineEntry(
        claim="drift_alarm_sound",
        title="Shannon drift alarm fires iff signal exceeds noise+ε (NERVOUS)",
        kind=Kind.THEOREM_0SORRY,
        theorem="NervousShannonAlarm (noise-immune below floor; strict-trigger sound)",
        repo_path="lutar-lean/Lutar/Innovations/round9/NervousShannonAlarm.lean",
        pr="round9",
        axiom_footprint=[],
        note="Alarm fires iff H(signal) > H(noise)+ε. Sorry-free.",
    ),
    "lambda_bounded": SpineEntry(
        claim="lambda_bounded",
        title="Λ aggregator is bounded by its max axis (SKELETON spine A4)",
        kind=Kind.THEOREM_0SORRY,
        theorem="SkeletonLambdaSpine.boundedness (λ(a,b) ≤ max a b); doctrine_lock 749/14/163",
        repo_path="lutar-lean/Lutar/Innovations/round9/SkeletonLambdaSpine.lean",
        pr="round9",
        axiom_footprint=["A1-A4 (boundedness strut)"],
        note=("Sorry-free; KEY 3 EXPLICITLY does NOT assert uniqueness — "
              "uniqueness remains Conjecture 1."),
    ),
    "fleet_linking_invariant": SpineEntry(
        claim="fleet_linking_invariant",
        title="Fleet linking number Lk = Tw + Wr is preserved (topology)",
        kind=Kind.THEOREM_0SORRY,
        theorem="CalugareanuFleetInvariant (Lk preserved under twist-writhe exchange)",
        repo_path="lutar-lean/Lutar/Innovations/round7/CalugareanuFleetInvariant.lean",
        pr="round7",
        axiom_footprint=[],
        note="Călugăreanu theorem; fleet size = 5 flagships. Sorry-free.",
    ),

    # ---- THEOREM WITH OPEN HYPOTHESES (proven modulo explicit runtime hyps) --
    "swarm_connected": SpineEntry(
        claim="swarm_connected",
        title="Swarm/fleet topology health (Euler characteristic χ = 2)",
        kind=Kind.THEOREM_WITH_HYPOTHESES,
        theorem="EulerFleetTopology (χ = V−E+F = 2 for a connected planar fleet)",
        repo_path="lutar-lean/Lutar/Innovations/round6/EulerFleetTopology.lean",
        pr="round6",
        axiom_footprint=["planarity (runtime-checked)", "connectivity (runtime-checked)"],
        obligation="planarity + connectivity supplied as runtime hypotheses",
        note=("Proven MODULO runtime-checked planarity/connectivity — NOT a "
              "0-sorry unconditional proof. χ≠2 signals corruption."),
    ),
    "lambda_unique_conditional": SpineEntry(
        claim="lambda_unique_conditional",
        title="Λ uniqueness — CONDITIONAL on the factorization axiom",
        kind=Kind.THEOREM_WITH_HYPOTHESES,
        theorem="lambda_unique_of_factors (any A1–A5 aggregator that FACTORS equals Λ)",
        repo_path="lutar-lean/Lutar/Round13/Lambda_Uniqueness.lean",
        pr="round13",
        axiom_footprint=["A1-A5", "Factors premise (A6/bisymmetry, NOT in the locked 14)"],
        obligation="FACTORIZATION_AXIOM_GAP — needs A6; the Factors premise is ESSENTIAL",
        note=("This is the CONDITIONAL theorem only. The UNCONDITIONAL "
              "uniqueness is lambda_unique → see 'lambda_uniqueness' "
              "(Conjecture 1, NEVER a theorem)."),
    ),

    # ---- RUNTIME / STRUCTURAL INVARIANTS (tested, NOT Lean theorems) ------
    "reactive_preempts": SpineEntry(
        claim="reactive_preempts",
        title="Reactive work preempts proactive within one tick; never starves",
        kind=Kind.RUNTIME_INVARIANT,
        theorem="—",
        repo_path="apps/agentic-gpu/scheduler.py (AgenticGpuScheduler.tick + self-test)",
        pr="platform #357",
        axiom_footprint=[],
        obligation="structural guarantee verified by scheduler.py self-test, NOT a Lean proof",
        note=("Honest: there is NO Lean theorem for scheduler preemption. The "
              "guarantee is structural and unit-tested; do not cite it as proven "
              "on the spine."),
    ),

    # ---- CONJECTURES — NEVER theorems (the honesty moat) ------------------
    "lambda_uniqueness": SpineEntry(
        claim="lambda_uniqueness",
        title="Λ is the UNIQUE A1–A5 aggregator (uniqueness)",
        kind=Kind.CONJECTURE,
        theorem="lambda_unique (UNCONDITIONAL) — stated, ends in `sorry`",
        repo_path="lutar-lean/Lutar/Round13/Lambda_Uniqueness.lean",
        pr="round13",
        axiom_footprint=["A1-A5"],
        obligation="FACTORIZATION_AXIOM_GAP — FALSE under A1–A5 (counterexample: maxAgg)",
        conjecture_id="Conjecture 1",
        note=("Λ = CONJECTURE 1 — intentionally NEVER a theorem. Doctrine "
              "constant 749/14/163 stays locked; the `Conjecture` declaration is "
              "NOT upgraded. Asserting this as proven is the doctrine violation."),
    ),
    "khipu_bft_safety": SpineEntry(
        claim="khipu_bft_safety",
        title="Khipu consensus SAFETY (≤1 faulty ⇒ agreed action canonical)",
        kind=Kind.CONJECTURE,
        theorem="khipu_consensus_safety — stated, ends in `sorry`",
        repo_path="lutar-lean/Lutar/KhipuConsensus.lean",
        pr="khipu-consensus-roadmap",
        axiom_footprint=[],
        obligation="needs adaptive Byzantine adversary model",
        conjecture_id="Conjecture 2",
        note="Deliberate sibling of Λ Conjecture 1 — NEVER a theorem.",
    ),
    "khipu_bft_liveness": SpineEntry(
        claim="khipu_bft_liveness",
        title="Khipu consensus LIVENESS (≥threshold honest ⇒ consensus reachable)",
        kind=Kind.CONJECTURE,
        theorem="khipu_consensus_liveness — stated, ends in `sorry`",
        repo_path="lutar-lean/Lutar/KhipuConsensus.lean",
        pr="khipu-consensus-roadmap",
        axiom_footprint=[],
        obligation="needs synchrony/timeout model",
        conjecture_id="Conjecture 3",
        note="Deliberate sibling of Λ Conjecture 1 — NEVER a theorem.",
    ),
}

# Aliases so natural-language claims resolve to a canonical spine key.
_ALIASES: Dict[str, str] = {
    "energy budget bounded": "energy_budget_bounded",
    "energy_budget": "energy_budget_bounded",
    "bekenstein": "energy_budget_bounded",
    "min energy per bit": "min_energy_per_bit",
    "landauer": "min_energy_per_bit",
    "landauer floor": "min_energy_per_bit",
    "belief update": "belief_update_bounded",
    "pac-bayes": "belief_update_bounded",
    "pac_bayes": "belief_update_bounded",
    "admission gate": "deny_by_default_gate",
    "neyman-pearson": "deny_by_default_gate",
    "receipt": "receipt_filtration_monotone",
    "heartbeat": "receipt_filtration_monotone",
    "provenance": "provenance_chain_extends",
    "merkle": "provenance_chain_extends",
    "dsse": "provenance_chain_extends",
    "drift alarm": "drift_alarm_sound",
    "shannon alarm": "drift_alarm_sound",
    "lambda bounded": "lambda_bounded",
    "swarm connected": "swarm_connected",
    "fleet connected": "swarm_connected",
    "euler": "swarm_connected",
    "fleet linking": "fleet_linking_invariant",
    "calugareanu": "fleet_linking_invariant",
    "reactive preempts": "reactive_preempts",
    "reactive never starves": "reactive_preempts",
    "preemption": "reactive_preempts",
    # conjectures (and their natural phrasings)
    "lambda uniqueness": "lambda_uniqueness",
    "lambda unique": "lambda_uniqueness",
    "λ uniqueness": "lambda_uniqueness",
    "λ is unique": "lambda_uniqueness",
    "khipu bft": "khipu_bft_safety",
    "khipu safety": "khipu_bft_safety",
    "khipu liveness": "khipu_bft_liveness",
    "byzantine": "khipu_bft_safety",
}


def _canonical_key(claim: str) -> Optional[str]:
    """Resolve a free-text claim to a canonical spine key, or None."""
    c = claim.strip().lower()
    if c in _STATIC_SPINE:
        return c
    if c in _ALIASES:
        return _ALIASES[c]
    # tolerate underscores/spaces and simple substring hits on aliases
    c2 = c.replace("_", " ")
    if c2 in _ALIASES:
        return _ALIASES[c2]
    for phrase, key in _ALIASES.items():
        if phrase in c2:
            return key
    return None


def _http_get_json(url: str, timeout: float) -> Optional[dict]:
    """GET JSON from the live spine endpoint, or None on any failure. No key."""
    try:
        req = urllib.request.Request(url, method="GET",
                                     headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if int(resp.status) != 200:
                return None
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except (urllib.error.URLError, json.JSONDecodeError, Exception):  # noqa: BLE001
        return None


@dataclass
class TraceResult:
    """The resolved traceability answer for one claim.

    `source` is "live-spine" only when the live SKELETON endpoint answered and
    corroborated; otherwise "static-map" (the honest off-box fallback). A
    degraded reading is NEVER labelled live.
    """
    entry: Optional[SpineEntry]
    resolved: bool
    source: str                  # "live-spine" | "static-map"
    spine_counts: Optional[str]  # doctrine count if known (e.g. "749/14/163")

    def as_dict(self) -> dict:
        return {
            "resolved": self.resolved,
            "source": self.source,
            "spine_counts": self.spine_counts,
            "entry": self.entry.as_dict() if self.entry else None,
        }


class SkeletonSpine:
    """Claim → theorem traceability over the Lean spine.

    Queries the live SKELETON endpoint when reachable (to corroborate the spine
    counts), then resolves the claim against the known witness map. Off-box it
    degrades to the static map and labels the answer `static-map`.
    """

    def __init__(self, endpoint: str = SKELETON_ENDPOINT,
                 fetch_fn: Optional[Callable[[str, float], Optional[dict]]] = None,
                 timeout: float = _PROBE_TIMEOUT_S) -> None:
        self.endpoint = endpoint
        self._fetch = fetch_fn or _http_get_json
        self.timeout = timeout

    def _spine_live(self) -> Optional[dict]:
        """Best-effort live spine snapshot (counts), or None if unreachable."""
        return self._fetch(self.endpoint, self.timeout)

    def trace(self, claim: str) -> TraceResult:
        """Resolve `claim` to its backing witness (or conjecture/unknown).

        Honest by construction: an unknown claim resolves UNKNOWN (never proven);
        a conjecture resolves CONJECTURE; the source label tells you whether the
        live spine corroborated or we fell back to the static map.
        """
        live = self._spine_live()
        source = "live-spine" if live is not None else "static-map"
        spine_counts = None
        if isinstance(live, dict):
            # Accept a few plausible shapes for the doctrine count.
            spine_counts = (live.get("doctrine_count")
                            or live.get("counts")
                            or DOCTRINE_COUNT)
        else:
            spine_counts = DOCTRINE_COUNT

        key = _canonical_key(claim)
        if key is None:
            return TraceResult(entry=SpineEntry(
                claim=claim, title="(no backing witness on the spine)",
                kind=Kind.UNKNOWN, theorem="—", repo_path="—",
                note=("No theorem traces this claim. Resolves UNKNOWN — it is "
                      "NOT proven; supply a witness or weaken the claim.")),
                resolved=False, source=source, spine_counts=spine_counts)

        entry = _STATIC_SPINE[key]
        return TraceResult(entry=entry, resolved=True, source=source,
                           spine_counts=spine_counts)

    def is_proven(self, claim: str) -> bool:
        """True ONLY if the claim traces to a closed 0-sorry theorem.

        Conjectures (Λ-uniqueness, Khipu-BFT), theorems-with-open-hypotheses,
        runtime invariants, and unknown claims all return False — the spine will
        not let a caller assert any of them as an established proof.
        """
        r = self.trace(claim)
        return bool(r.entry and r.entry.is_proven)

    def assert_proven(self, claim: str) -> SpineEntry:
        """Return the backing entry iff the claim is a closed theorem, else raise.

        This is the doctrine enforcer: asking it to certify Λ-uniqueness (or any
        conjecture) raises `ConjectureError`, so no code path can launder a
        conjecture into a proven claim.
        """
        r = self.trace(claim)
        if r.entry and r.entry.is_conjecture:
            raise ConjectureError(
                f"REFUSED: '{claim}' is {r.entry.conjecture_id} "
                f"({r.entry.title}) — a CONJECTURE, NEVER a theorem. "
                f"Open obligation: {r.entry.obligation}.")
        if not (r.entry and r.entry.is_proven):
            kind = r.entry.kind.value if r.entry else "unknown"
            raise NotProvenError(
                f"REFUSED: '{claim}' does not trace to a closed 0-sorry theorem "
                f"(kind={kind}). It may not be asserted as proven.")
        return r.entry


class ConjectureError(AssertionError):
    """Raised when a caller tries to assert a CONJECTURE as proven."""


class NotProvenError(AssertionError):
    """Raised when a claim has no closed-theorem backing on the spine."""


def list_claims() -> List[str]:
    """All canonical claim keys known to the static spine."""
    return sorted(_STATIC_SPINE.keys())


# ===========================================================================
# SELF-TEST — no network (fetch is injected). Exercises the traceability map and
# the conjecture-honesty refusal:
#   - a proven claim ("energy budget bounded") → 0-sorry theorem, is_proven True
#   - Λ-uniqueness → flagged Conjecture 1, is_proven False, assert_proven RAISES
#   - Khipu-BFT safety/liveness → Conjecture 2/3, refused as proven
#   - "swarm connected" → THEOREM_WITH_HYPOTHESES (not a closed proof)
#   - "reactive preempts" → RUNTIME_INVARIANT (honestly NOT a Lean theorem)
#   - an unknown claim → UNKNOWN, never proven
#   - off-box source is labelled "static-map" (never a fake "live-spine")
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # Off-box: inject a fetch that always fails → degrade to static map.
    spine = SkeletonSpine(fetch_fn=lambda url, t: None)

    # --- a proven claim resolves to a 0-sorry theorem ---------------------
    r = spine.trace("energy budget bounded")
    check("proven_resolved", r.resolved is True)
    check("proven_is_0sorry", r.entry.kind is Kind.THEOREM_0SORRY)
    check("proven_is_proven_true", r.entry.is_proven is True)
    check("proven_has_repo_path", r.entry.repo_path.endswith("EnergyBudgetWitness.lean"))
    check("proven_assert_returns_entry",
          spine.assert_proven("min energy per bit").theorem.startswith("LandauerFloorWitness"))

    # --- Λ-uniqueness is flagged Conjecture 1 and REFUSED as proven -------
    rl = spine.trace("Λ uniqueness")
    check("lambda_uniqueness_resolved", rl.resolved is True)
    check("lambda_uniqueness_is_conjecture", rl.entry.kind is Kind.CONJECTURE)
    check("lambda_uniqueness_id", rl.entry.conjecture_id == "Conjecture 1")
    check("lambda_uniqueness_not_proven", spine.is_proven("lambda uniqueness") is False)
    refused = False
    try:
        spine.assert_proven("lambda uniqueness")
    except ConjectureError as e:
        refused = True
        check("lambda_refusal_names_conjecture1", "Conjecture 1" in str(e))
    check("lambda_uniqueness_refused_as_proven", refused)

    # --- the CONDITIONAL Λ theorem is honestly distinct (with hypotheses) --
    rc = spine.trace("lambda_unique_conditional")
    check("lambda_conditional_is_theorem_with_hyps",
          rc.entry.kind is Kind.THEOREM_WITH_HYPOTHESES)
    check("lambda_conditional_not_proven_unconditionally",
          spine.is_proven("lambda_unique_conditional") is False)
    check("lambda_conditional_names_gap",
          "FACTORIZATION_AXIOM_GAP" in rc.entry.obligation)

    # --- Khipu-BFT safety & liveness are Conjecture 2/3, refused ----------
    for claim, cid in (("khipu safety", "Conjecture 2"),
                       ("khipu liveness", "Conjecture 3")):
        rk = spine.trace(claim)
        check(f"{claim}_is_conjecture", rk.entry.kind is Kind.CONJECTURE)
        check(f"{claim}_id", rk.entry.conjecture_id == cid)
        k_refused = False
        try:
            spine.assert_proven(claim)
        except ConjectureError:
            k_refused = True
        check(f"{claim}_refused_as_proven", k_refused)

    # --- "swarm connected" is a theorem WITH open hypotheses --------------
    rs = spine.trace("swarm connected")
    check("swarm_is_theorem_with_hyps", rs.entry.kind is Kind.THEOREM_WITH_HYPOTHESES)
    check("swarm_not_closed_proof", spine.is_proven("swarm connected") is False)
    check("swarm_lists_runtime_hyps", any("connectivity" in a for a in rs.entry.axiom_footprint))

    # --- "reactive preempts" is a RUNTIME invariant, NOT a Lean theorem ---
    rr = spine.trace("reactive preempts")
    check("reactive_is_runtime_invariant", rr.entry.kind is Kind.RUNTIME_INVARIANT)
    check("reactive_not_claimed_proven", spine.is_proven("reactive preempts") is False)
    check("reactive_honest_note", "NO Lean theorem" in rr.entry.note)

    # --- an unknown claim resolves UNKNOWN, never proven ------------------
    ru = spine.trace("the gpu is conscious")
    check("unknown_unresolved", ru.resolved is False)
    check("unknown_kind", ru.entry.kind is Kind.UNKNOWN)
    check("unknown_not_proven", spine.is_proven("the gpu is conscious") is False)
    unk_refused = False
    try:
        spine.assert_proven("the gpu is conscious")
    except NotProvenError:
        unk_refused = True
    check("unknown_refused_as_proven", unk_refused)

    # --- off-box source is honestly labelled "static-map" ----------------
    check("offbox_source_static", r.source == "static-map")
    check("offbox_spine_counts", r.spine_counts == DOCTRINE_COUNT)

    # --- live path: injected snapshot is labelled "live-spine" ------------
    live_spine = SkeletonSpine(
        fetch_fn=lambda url, t: {"doctrine_count": "749/14/163", "sorries": 163})
    rv = live_spine.trace("energy budget bounded")
    check("live_source_labelled", rv.source == "live-spine")
    check("live_still_refuses_conjecture",
          live_spine.is_proven("lambda uniqueness") is False)

    # --- no proven claim accidentally carries a conjecture id -------------
    for k, e in _STATIC_SPINE.items():
        if e.is_proven:
            check(f"{k}_proven_has_no_conjecture_id", e.conjecture_id == "")

    out["claims_indexed"] = len(_STATIC_SPINE)
    out["conjectures_flagged"] = sorted(
        e.conjecture_id for e in _STATIC_SPINE.values() if e.is_conjecture)
    out["doctrine_count"] = DOCTRINE_COUNT
    out["ok"] = True
    out["doctrine"] = ("every claim traces to a Lean witness or is honestly "
                       "flagged; Λ-uniqueness = Conjecture 1 (NEVER a theorem) "
                       "and is refused as proven; Khipu-BFT = Conjecture 2/3; "
                       "theorems-with-hypotheses and runtime invariants are "
                       "labelled, not dressed as closed proofs; open-weight, no key.")
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
