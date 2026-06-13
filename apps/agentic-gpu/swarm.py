"""
SZL Agentic-GPU Swarm — swarm.py
================================
A CONTROL-PLANE for the distributed compute fabric beneath SZL's Proven Energy
Engine: the "10 supercomputers" Tier-3 vision (volunteer / DePIN / cloud-burst
GPU pool) sitting ON TOP of the RTX 5000 @ betterwithage anchor.

It does ONE job, deterministically and honestly: given a set of REGISTERED
(opt-in) compute nodes across tiers, health-check each (an OpenAI-compatible
`/v1/models` probe) and route each task to the highest-available SOVEREIGN tier
first (a local/owned GPU), falling back HONESTLY through bonus → cloud-burst →
non-sovereign router. Every routed task reports `served_by` (which node) and
`sovereign` (true ONLY when a local/owned node serves).

This module is the control-plane SKELETON — it does NO inference and (in the
self-test) NO network. It maps 1:1 onto a LiteLLM/SOLLOL failover config (see
README "Maps to LiteLLM"); the box deployment wires the real probes + the real
`POST /v1/chat/completions`. It is pure stdlib, ast-clean, and self-testable.

DOCTRINE (v11/v12 — read first, NEVER violated):
- CONSENT-ONLY. A node participates ONLY if it is explicitly REGISTERED
  (`register_node`). There is NO discovery, NO scanning, NO unauthorized
  access of any machine. This mirrors volunteer-computing consent (BOINC,
  Folding@home): the operator opts a node in; we never reach for one that
  wasn't handed to us. Unauthorized use is forbidden by construction — the
  router can only see the registry.
- SOVEREIGN ONLY ON OWNED/LOCAL. `sovereign:true` is reported ONLY when the
  serving node is an owned/local tier (anchor / bonus-local / cloud-burst that
  the operator owns). A public router / third-party API serving is
  `sovereign:false`, labeled honestly. The half-state (claiming sovereign while
  a non-sovereign node served) is the ONLY unacceptable outcome.
- SERVED_BY ALWAYS HONEST. The response metadata always names the real node id,
  its tier, and its base_url. Never claim a node served that did not.
- open-weight only; never read/commit a key (cloud/router keys come from the
  env / secret store; this control plane never embeds one).

F12 / Kuramoto backing (PROVEN):
  Predictable multi-node scheduling composes the kernel-proven
  `node_coupling_additive` (EnergyBudgetWitness.lean, line ~130): for a coupling
  constant `k` and per-node contributions `ps`,  k·(Σ ps) = Σ (k·pᵢ)  — the F12
  pairwise additivity (`kuramoto_pair_additive`) lifted to an arbitrary-length
  fabric by induction. Practically: the swarm's coupled capacity is exactly the
  sum of the per-node coupled capacities — no phantom capacity created or lost
  when nodes synchronize. `swarm_coupled_capacity()` is the runtime shadow of
  that theorem (and the self-test checks the additive identity holds).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum
from typing import Callable, Optional
import json


class Tier(IntEnum):
    """Routing precedence (lower value = tried first). Mirrors RESILIENCE_FABRIC.

    ANCHOR / BONUS_LOCAL / CLOUD_BURST are OWNED/local => sovereign:true.
    ROUTER is a third-party fallback => sovereign:false (honest last resort).
    """
    ANCHOR = 0        # Tier-0/A: always-on owned GPU (RTX 5000 @ betterwithage).
    BONUS_LOCAL = 1   # Tier-B: opt-in volunteer/owned local GPU (laptop, etc.).
    CLOUD_BURST = 2   # Tier-C: operator-owned on-demand cloud GPU (e.g. RunPod).
    ROUTER = 3        # Tier-D: public router / hosted API — NOT sovereign.


# Tiers the operator OWNS / controls => serving from them is sovereign.
_SOVEREIGN_TIERS = frozenset({Tier.ANCHOR, Tier.BONUS_LOCAL, Tier.CLOUD_BURST})


@dataclass
class Node:
    """A REGISTERED (opt-in, consent-based) compute node in the fabric.

    A node only exists in the swarm because an operator explicitly registered it
    (handed us its id + base_url + tier + consent). We never synthesize a node
    from discovery. `owned` records the consent/ownership fact that, together
    with the tier, determines whether serving from it may be called sovereign.
    """
    node_id: str
    base_url: str                 # OpenAI-compatible base, e.g. http://host:11434/v1
    tier: Tier
    # The operator asserted, at registration, that they own/control this node
    # (or, for ROUTER, explicitly that they do NOT — it is a public fallback).
    owned: bool = True
    # Consent flag: registration IS the consent. Kept explicit so the honesty
    # is auditable; a node with consent=False is never routed to.
    consent: bool = True
    # SAMPLE/ESTIMATE relative capacity weight (e.g. GPU class). Used only for
    # the F12 coupled-capacity accounting; not a measured FLOP figure.
    capacity_weight: float = 1.0
    note: str = ""

    @property
    def is_sovereign(self) -> bool:
        """True iff serving from this node may HONESTLY be called sovereign."""
        return self.owned and self.tier in _SOVEREIGN_TIERS


# A health probe answers: is this node serving right now? It receives the node
# and returns True iff a live OpenAI-compatible endpoint answered. The real
# probe does GET {base_url}/models (stdlib, short timeout, never raises, no key).
# The default probe is conservative-honest: UNKNOWN reachability => NOT serving,
# so we never route to (or claim) a node we have not verified.
HealthProbe = Callable[["Node"], bool]


def assume_down(_node: "Node") -> bool:
    """Default probe: with no real check wired, assume a node is NOT serving."""
    return False


@dataclass
class RouteResult:
    """The honest outcome of routing one task."""
    served_by: Optional[str]         # node_id that served, or None if nothing did
    tier: Optional[str]              # tier name of the server
    base_url: Optional[str]
    sovereign: bool                  # true ONLY when an owned/local tier served
    posture: str                     # green | yellow | red (RESILIENCE_FABRIC)
    candidates_tried: list[str] = field(default_factory=list)
    note: str = ""

    def as_dict(self) -> dict:
        return {
            "served_by": self.served_by,
            "tier": self.tier,
            "base_url": self.base_url,
            "sovereign": self.sovereign,
            "posture": self.posture,
            "candidates_tried": self.candidates_tried,
            "note": self.note,
        }


class Swarm:
    """Consent-based multi-node router: anchor-first, honest sovereign posture.

    Invariants:
      - Only REGISTERED nodes with consent are ever considered (no discovery).
      - Nodes are tried strictly in tier order (ANCHOR -> ROUTER), and within a
        tier in registration order, so routing is deterministic.
      - `sovereign` in the result is True iff the node that actually served is an
        owned/local tier. A ROUTER (or non-owned) node serving => sovereign:false.
      - posture: green  = an owned/local (sovereign) node served;
                 yellow = only a non-sovereign router served (degraded);
                 red    = nothing served at all.
    """

    def __init__(self, health_probe: HealthProbe = assume_down) -> None:
        self._nodes: list[Node] = []
        self.health_probe = health_probe
        # Bookkeeping for honest reporting / tests.
        self.routes_served = 0
        self.routes_sovereign = 0
        self.routes_failed = 0

    # ---- registration (the ONLY way a node enters the fabric) -------------
    def register_node(self, node: Node) -> Node:
        """Opt a node into the fabric. Registration IS the consent record.

        Rejects a node that did not consent (defensive — registration implies
        consent, but we never route to a node whose operator did not opt in).
        Duplicate node_id replaces the prior registration (re-register to update).
        """
        if not node.consent:
            raise ValueError(
                f"refusing to register non-consenting node {node.node_id!r}: "
                "the swarm is CONSENT-ONLY (volunteer-computing model).")
        self._nodes = [n for n in self._nodes if n.node_id != node.node_id]
        self._nodes.append(node)
        return node

    def deregister_node(self, node_id: str) -> bool:
        """Opt a node back OUT (consent withdrawn). Honors withdrawal immediately."""
        before = len(self._nodes)
        self._nodes = [n for n in self._nodes if n.node_id != node_id]
        return len(self._nodes) != before

    @property
    def registered(self) -> list[Node]:
        """Consent-only view: nodes that opted in (defensive consent re-check)."""
        return [n for n in self._nodes if n.consent]

    def _ordered_candidates(self) -> list[Node]:
        """Registered, consenting nodes in routing order (tier, then FIFO)."""
        indexed = list(enumerate(self.registered))
        indexed.sort(key=lambda it: (int(it[1].tier), it[0]))
        return [n for _, n in indexed]

    # ---- the core routing decision ----------------------------------------
    def route(self, task: Optional[str] = None) -> RouteResult:
        """Route one task to the highest-available tier; report honestly.

        Health-checks candidates in tier order; the first that answers serves.
        sovereign/posture are derived from WHICH node actually served — never
        from intent. If nothing answers, returns an honest red/non-sovereign
        result (the app should then surface a degraded state, not a fake banner).
        """
        tried: list[str] = []
        for node in self._ordered_candidates():
            tried.append(node.node_id)
            try:
                up = bool(self.health_probe(node))
            except Exception:  # noqa: BLE001 - a flaky probe => treat as down, stay honest
                up = False
            if not up:
                continue
            sovereign = node.is_sovereign
            self.routes_served += 1
            if sovereign:
                self.routes_sovereign += 1
            return RouteResult(
                served_by=node.node_id,
                tier=node.tier.name,
                base_url=node.base_url,
                sovereign=sovereign,
                posture="green" if sovereign else "yellow",
                candidates_tried=tried,
                note=("served by an owned/local tier — sovereign:true"
                      if sovereign else
                      "served by a non-sovereign router/fallback — sovereign:false "
                      "(honest degraded posture; no local node was available)"),
            )
        # Nothing served.
        self.routes_failed += 1
        return RouteResult(
            served_by=None, tier=None, base_url=None,
            sovereign=False, posture="red", candidates_tried=tried,
            note=("no registered node answered — honest hard-down. "
                  "NOT sovereign; no fake banner."),
        )

    # ---- F12 / Kuramoto coupled-capacity accounting (PROVEN shape) --------
    def swarm_coupled_capacity(self, coupling_k: int = 1,
                               only_up: bool = False) -> int:
        """Coupled fabric capacity = k · Σ(per-node weight) (SAMPLE weights).

        Runtime shadow of `node_coupling_additive` (EnergyBudgetWitness.lean):
        k·(Σ ps) = Σ (k·pᵢ). We use integer per-node weights so the additive
        identity is exactly the kernel-proven Nat theorem (no float drift). With
        `only_up=True`, counts only currently-serving nodes (a live capacity).
        This is a coupling/accounting figure, NOT a measured FLOP throughput.
        """
        nodes = self.registered
        if only_up:
            nodes = [n for n in nodes if self._safe_up(n)]
        weights = [int(round(n.capacity_weight)) for n in nodes]
        return int(coupling_k) * sum(weights)

    def _safe_up(self, node: Node) -> bool:
        try:
            return bool(self.health_probe(node))
        except Exception:  # noqa: BLE001
            return False

    def status(self) -> dict:
        """Honest fabric status: registry, per-node health + sovereignty, totals."""
        nodes = []
        for n in self._ordered_candidates():
            nodes.append({
                "node_id": n.node_id,
                "tier": n.tier.name,
                "base_url": n.base_url,
                "owned": n.owned,
                "consent": n.consent,
                "is_sovereign_tier": n.is_sovereign,
                "serving_now": self._safe_up(n),
                "capacity_weight_sample": n.capacity_weight,
            })
        return {
            "model": "Proven Energy Engine — swarm control-plane",
            "registered_nodes": len(self.registered),
            "nodes": nodes,
            "coupled_capacity_sample": self.swarm_coupled_capacity(),
            "coupled_capacity_live_sample": self.swarm_coupled_capacity(only_up=True),
            "routes_served": self.routes_served,
            "routes_sovereign": self.routes_sovereign,
            "routes_failed": self.routes_failed,
            "consent_model": ("CONSENT-ONLY: nodes participate only when registered "
                              "(opt-in), mirroring BOINC / Folding@home volunteer "
                              "computing. No discovery, no unauthorized access."),
            "doctrine": ("sovereign:true ONLY when an owned/local tier serves; "
                         "served_by always honest; capacity figures SAMPLE/ESTIMATE; "
                         "open-weight only; no key committed."),
            "f12_witness": "node_coupling_additive (EnergyBudgetWitness.lean, 0-sorry)",
        }


# ---------------------------------------------------------------------------
# A conventional default fabric (the RESILIENCE_FABRIC tiers). The anchor is the
# RTX 5000 @ betterwithage. Bonus/cloud/router are OPTIONAL and only added if an
# operator registers them. No node here is reachable without a real probe + the
# operator having opted it in; base_urls are the documented endpoints, not keys.
# ---------------------------------------------------------------------------
def default_anchor() -> Node:
    """The Tier-0 anchor: RTX 5000 @ betterwithage (Ollama today, vLLM next)."""
    return Node(
        node_id="tier0-betterwithage-rtx5000",
        base_url="http://100.125.77.31:11434/v1",
        tier=Tier.ANCHOR,
        owned=True, consent=True, capacity_weight=4.0,
        note="RTX 5000 @ betterwithage — always-warm anchor (KEEP_ALIVE=-1).",
    )


# ===========================================================================
# SELF-TEST (no network, no GPU) — deterministic. Health probes are stubbed.
# Simulates the RESILIENCE_FABRIC failover ladder:
#   (A) anchor healthy            -> anchor serves, sovereign:true, green.
#   (B) anchor down               -> falls to next registered local node,
#                                     still sovereign:true.
#   (C) all LOCAL/owned down, only a public router up -> router serves,
#                                     sovereign:false, yellow (honest degrade).
#   (D) everything down           -> nothing serves, sovereign:false, red.
# Plus: consent-only enforcement + the F12 additive-capacity identity.
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {}

    anchor = default_anchor()
    bonus = Node("tierB-laptop-gpu", "http://100.64.0.9:11434/v1", Tier.BONUS_LOCAL,
                 owned=True, consent=True, capacity_weight=2.0)
    cloud = Node("tierC-runpod-4090", "http://runpod.example/v1", Tier.CLOUD_BURST,
                 owned=True, consent=True, capacity_weight=3.0,
                 note="operator-owned on-demand burst")
    router = Node("tierD-hf-router", "https://router.example/v1", Tier.ROUTER,
                  owned=False, consent=True, capacity_weight=1.0,
                  note="public hosted API — NOT sovereign")

    # --- Scenario A: anchor healthy -> anchor serves, sovereign:true. ------
    up = {anchor.node_id}  # only the anchor answers
    sw = Swarm(health_probe=lambda n: n.node_id in up)
    for n in (anchor, bonus, cloud, router):
        sw.register_node(n)
    rA = sw.route("hello")
    assert rA.served_by == anchor.node_id, rA.as_dict()
    assert rA.sovereign is True and rA.posture == "green", rA.as_dict()
    out["scenario_anchor_serves"] = rA.as_dict()

    # --- Scenario B: anchor down -> next local (bonus) serves, still sovereign.
    up = {bonus.node_id, cloud.node_id, router.node_id}  # anchor down
    rB = sw.route("hello")
    assert rB.served_by == bonus.node_id, rB.as_dict()
    assert rB.sovereign is True and rB.posture == "green", rB.as_dict()
    assert rB.candidates_tried[0] == anchor.node_id, "must try anchor FIRST"
    out["scenario_anchor_down_failover_local"] = rB.as_dict()

    # --- Scenario C: all owned/local down, only public router up -> honest
    #     non-sovereign fallback (yellow). --------------------------------
    up = {router.node_id}
    rC = sw.route("hello")
    assert rC.served_by == router.node_id, rC.as_dict()
    assert rC.sovereign is False, "router serving must NEVER be sovereign"
    assert rC.posture == "yellow", rC.as_dict()
    out["scenario_router_only_non_sovereign"] = rC.as_dict()

    # --- Scenario D: everything down -> nothing serves, red, not sovereign.
    up = set()
    rD = sw.route("hello")
    assert rD.served_by is None and rD.sovereign is False, rD.as_dict()
    assert rD.posture == "red", rD.as_dict()
    out["scenario_all_down_honest_red"] = rD.as_dict()

    # --- Consent-only: a non-consenting node is REFUSED registration. ------
    refused = False
    try:
        sw.register_node(Node("rogue", "http://10.0.0.1/v1", Tier.BONUS_LOCAL,
                              owned=True, consent=False))
    except ValueError:
        refused = True
    assert refused, "must refuse to register a non-consenting node"
    out["consent_only_enforced"] = True

    # --- Consent withdrawal (deregister) removes a node from routing. ------
    sw2 = Swarm(health_probe=lambda n: True)
    sw2.register_node(anchor)
    sw2.register_node(bonus)
    assert sw2.deregister_node(anchor.node_id) is True
    r2 = sw2.route("x")
    assert r2.served_by == bonus.node_id, "deregistered anchor must not serve"
    out["consent_withdrawal_honored"] = True

    # --- F12 / Kuramoto additive-capacity identity (composes the witness). -
    # k·(Σ wᵢ) == Σ (k·wᵢ)  — the runtime shadow of node_coupling_additive.
    k = 3
    sw3 = Swarm(health_probe=lambda n: True)
    weights = [4, 2, 3, 1]
    for i, w in enumerate(weights):
        tier = Tier.ANCHOR if i == 0 else Tier.BONUS_LOCAL
        sw3.register_node(Node(f"n{i}", f"http://n{i}/v1", tier,
                               owned=True, consent=True, capacity_weight=float(w)))
    lhs = sw3.swarm_coupled_capacity(coupling_k=k)          # k · Σ w
    rhs = sum(k * w for w in weights)                        # Σ (k · w)
    assert lhs == rhs == k * sum(weights), (lhs, rhs)
    out["f12_additive_capacity"] = {"k_times_sum": lhs, "sum_of_k_times": rhs,
                                    "identity_holds": lhs == rhs}

    out["ok"] = True
    out["doctrine"] = ("CONSENT-ONLY (registered nodes; no discovery/unauthorized "
                       "access); sovereign:true ONLY on owned/local tiers; "
                       "served_by always honest; capacity SAMPLE/ESTIMATE; "
                       "open-weight only; no key.")
    out["f12_witness"] = "node_coupling_additive (EnergyBudgetWitness.lean, 0-sorry)"
    out["cites"] = ("RESILIENCE_FABRIC tiers; BOINC/Folding@home volunteer-consent "
                    "model; LiteLLM/SOLLOL failover; Agent.xpu arXiv:2506.24045")
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
