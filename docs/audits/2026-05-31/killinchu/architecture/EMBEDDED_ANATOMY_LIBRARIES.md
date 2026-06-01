# EMBEDDED_ANATOMY_LIBRARIES — 11 organs as vendored Python packages

**Layer:** PURIQ v12 → `killinchu/architecture/`
**Author:** Yachay, under CTO authority · 2026-06-01
**Goal:** Each SZL anatomy organ becomes a *pure, vendorable Python package* that fits in a
**≤ 50 MB squash-fs partition** for edge deploy, so the Killinchu drone runs the full
governance math **disconnected**. Every package exposes the `puriq.{decide,act,reflect}`
interface contract and emits Khipu hooks.

**Grounding (existing implementations — match proportions):**
- HUKLLA = **660 SLOC, 10 tripwires** (Doctrine v12 §6).
- YAWAR = **20 lines**, RUWAY is the only writer (v11 §4 / SF-03).
- SENTRA = **18 SLOC + 6 threat signatures + 1 MB size guard** (`sentra/src/sentra_immune.py`).
- Canonical formula registry = pure typed functions, EPS=1e-9, proof-status tags
  (`szl-cookbook/.../formulas.py`, 626 LOC, 21 formulas).
- Khipu summation-cord invariant TH11 (`rosie/src/khipu-receipt.ts`).

**Design law (Zero-Bandaid, carried):** pure functions, no hidden state, no I/O in the
decision path except the RUWAY-gated Khipu append. Each package ships its own `sorry`-tag
discipline and proof-status tags. **No package edits a v11 LOCKED number.**

---

## 0 — Common package skeleton (every organ)

```
szl-<organ>/
├── pyproject.toml          # name=szl-<organ>, deps pinned, no heavyweight transitive
├── src/szl_<organ>/
│   ├── __init__.py         # public API re-exports
│   ├── core.py             # the organ factor (pure functions)
│   ├── puriq_iface.py      # decide / act / reflect for this organ
│   ├── khipu_hooks.py      # emit_receipt(), verify_chain() — RUWAY-gated
│   └── _proof_status.py    # PROVEN/AXIOM/SORRY/CONJECTURE tags per declaration
├── tests/                  # pytest; property tests on invariants
│   └── test_<organ>.py
└── PROOF_OBLIGATIONS.md     # maps each fn → Lean obligation in PuriqLean.lean
```

**Shared `puriq_iface.py` contract (all organs implement this):**

```python
from typing import Protocol, Sequence

class OrganPuriq(Protocol):
    def decide(self, a: "Action", x: "Context") -> float:
        """Return this organ's NON-NEGATIVE factor for U(a|x). Range documented per organ.
        MUST be in [0,1] or {0,1} so it can only SHRINK the gated region (INV-1..4 safe)."""
    def act(self, a_star: "Action") -> "Receipt":
        """Perform argmax-selected action; emit Khipu receipt via RUWAY (only writer)."""
    def reflect(self, receipt: "Receipt") -> "ReflectResult":
        """Re-run introspection axes 10–13 (T03/T04/T09/T10) against the receipt."""
```

**Size budget rule:** pure-Python organs are tiny (KB). The 50 MB ceiling exists for the
**two heavy organs** that carry data/models: `szl-amaru` (embedding index for KL drift)
and `szl-otel-vsp` (OTel SDK). All others sit far under budget; the partition is sized for
worst case + headroom.

---

## 1 — `szl-lambda` — Spine aggregator Λ(x)

| Field | Value |
|---|---|
| **Factor** | `Λ(x) = ∏ xᵢ^{wᵢ}`, `Σwᵢ=1` (weighted geo-mean, canonical D2) |
| **Range** | `[0,1]` |
| **Module structure** | `core.py` (`aggregate`, `axis_floors`, `is_monotone_check`), `puriq_iface.py` |
| **Public API** | `aggregate(axes, weights=None) -> float`; `axis_floors(k=13) -> list[float]` |
| **Dependencies** | stdlib `math` only |
| **Size** | ~8 KB |
| **Proof status** | A1 `IsMonotone`, A2 `IsHomogeneous`, A4 `IsBounded` = AXIOM; Λ-uniqueness = **CONJECTURE** (open) |
| **Test plan** | property: monotone (raise any axis ⇒ Λ non-decreasing); homogeneous deg-1 (`Λ(c·x)=c·Λ(x)`); bounded (`Λ(x)≤max xᵢ`); uniform-weight = `(∏xᵢ)^{1/k}` |
| **Khipu hooks** | every `aggregate` call logs `{axes_hash, weights_hash, value}` as a decision leaf |
| **Lean obligation** | `puriq_lambda_monotone` (INV-2) |

Direct lift of the canonical `lambda_aggregate` (already in `formulas.py`). **Edge-safe:
zero deps.**

---

## 2 — `szl-yuyay` — 13-axis heart gate Yuyay₁₃(a)

| Field | Value |
|---|---|
| **Factor** | `∏_{j=1}^{13} 𝟙[sⱼ(a) ≥ φⱼ]` — conjunctive AND, no compensation |
| **Floors** | 2 sacred ≥0.95, 7 structural ≥0.90, 4 introspection (T03/T04/T09/T10 cleared) |
| **Range** | `{0} ∪ (0,1]` (0 unless ALL 13 clear) |
| **Module structure** | `core.py` (`score13`, `axis_band`, `replay_hash_check`), `puriq_iface.py` |
| **Public API** | `score13(a) -> float`; `axis_report(a) -> dict[axis,float]`; `REPLAY_HASH` const |
| **Dependencies** | `szl-lambda` (for the geo-mean over passing axes), stdlib `hashlib` |
| **Size** | ~12 KB |
| **Proof status** | gate is algebraic root of INV-1; replay-hash anchor `bacf5443…631fc5` LOCKED |
| **Test plan** | any single sub-floor axis ⇒ `score13==0`; all-pass ⇒ in `(0,1]`; replay-hash matches LOCKED value byte-for-byte |
| **Khipu hooks** | gate result `{axis_vector, passed:bool, score}` written as decision leaf |
| **Lean obligation** | conjunctive-AND clause of `P` (INV-1) |

**HARD: `Yuyay₁₃(a)=0 ⇒ U=0`.** This is the mandatory gate before any agentic act ships
(Doctrine v12 §5).

---

## 3 — `szl-yawar` — circulatory ledger C(a) (the 20-liner)

| Field | Value |
|---|---|
| **Factor** | `C(a) = 𝟙[ sha256(prev ‖ packet_a) == root_a ]` (append correctly extends chain) |
| **Range** | `{0,1}` |
| **Module structure** | single `core.py`, **≤20 SLOC** matching existing YAWAR; `puriq_iface.py` thin |
| **Public API** | `append(packet, prev_root) -> (root, receipt)`; `verify_link(prev,packet,root) -> bool` |
| **Dependencies** | stdlib `hashlib`, `json` |
| **Size** | ~4 KB |
| **Proof status** | folds into Khipu product ⇒ strengthens INV-3 |
| **Test plan** | tamper packet ⇒ `verify_link==False`; correct append ⇒ root advances deterministically; **RUWAY is the ONLY writer** (no other module may call `append`) |
| **Khipu hooks** | *is* the writer — `append` is the Khipu emission primitive |
| **Lean obligation** | `puriq_khipu_integrity` (INV-3) chain-link clause |

Receipt rule (v11 §4): `packet → json.dumps(sort_keys=True) → sha256 → hexdigest →
append`. Signature field is **DSSE PLACEHOLDER** until Sigstore.

```python
# szl_yawar/core.py — the 20-liner (RUWAY is the only writer)
import json, hashlib
def _h(b: bytes) -> str: return hashlib.sha256(b).hexdigest()
def append(packet: dict, prev_root: str) -> tuple[str, dict]:
    body = json.dumps(packet, sort_keys=True).encode()
    root = _h(prev_root.encode() + body)
    receipt = {"prev": prev_root, "packet_sha256": _h(body),
               "root": root, "sig": "DSSE-PLACEHOLDER"}  # honest: not yet signed
    return root, receipt
def verify_link(prev_root: str, packet: dict, root: str) -> bool:
    body = json.dumps(packet, sort_keys=True).encode()
    return _h(prev_root.encode() + body) == root
```

---

## 4 — `szl-hukulla` — immune deadman HUKLLA(a) (the 660-SLOC organ)

| Field | Value |
|---|---|
| **Factor** | `e^{-β·HUKLLA(a)}`, `HUKLLA(a)=Σ_{k=1}^{10} 𝟙[T_k fires]`, β≫0 |
| **Range** | `(0,1]` (1 ⇔ clean; →0 as tripwires fire) |
| **Module structure** | `core.py` (`tripwire_count`, `T01..T10` predicates), `sentra_screen.py` (18-SLOC inline immune), `egyptian_doubling.py` (compound-risk bound), `puriq_iface.py` |
| **Public API** | `tripwire_count(a) -> int`; `fired(a) -> list[str]`; `is_halted(a) -> bool` (T10 absorbing); `sentra_inspect(packet) -> bool` |
| **Dependencies** | stdlib only |
| **Size** | ~40 KB (660 SLOC source); fits trivially |
| **Proof status** | INV-1 `puriq_halting_safety` (open `sorry`) |
| **Test plan** | each Tk fires on its signature; T10 absorbing (halted ⇒ excluded from argmax); SENTRA 6-sig screen + 1 MB guard rejects adversarial payload **before** compute; Egyptian doubling: `HUKLLA(a₁…aₙ) ≤ Σ2^{kᵢ}` super-additive bound holds |
| **Khipu hooks** | each fired tripwire emits `{tripwire, packet_hash, fired:true}` leaf |
| **Lean obligation** | `puriq_halting_safety` (INV-1) |

**SENTRA inline screen (verbatim from existing 18-SLOC immune):**
```python
THREAT_KEYWORDS = ["DROP TABLE", "rm -rf", "<script", "eval(", "subprocess", "../../etc"]
def sentra_inspect(packet: dict) -> bool:
    blob = str(packet).lower()
    for sig in THREAT_KEYWORDS:
        if sig.lower() in blob: return False     # immune rejection
    if len(blob) > 1_000_000: return False         # size DoS guard
    return True
```
The 10 tripwires (T01–T10) preserve the existing 660-SLOC HUKLLA contract verbatim;
T10 (STOP/undo/revert) is the absorbing halt. Halt authority is HUKLLA's, not OVERWATCH's.

---

## 5 — `szl-khipu` — receipt DAG + summation-cord invariant

| Field | Value |
|---|---|
| **Factor** | `Khipu_i(a) = 𝟙[ leaf_i verifies in DAG ]`; `M(a)=𝟙[root'=H(root‖leaf_a)]` |
| **Range** | `{0,1}` (product zero if any receipt fails) |
| **Module structure** | `core.py` (`merkle_root`, `verify_inclusion`, `summation_check`), `dag.py` (3-tier pendant tree: decision→organ→root), `reconcile.py` (Merkle proof of inclusion vs cloud), `puriq_iface.py` |
| **Public API** | `merkle_root(leaves) -> str`; `verify_inclusion(leaf, proof, root) -> bool`; `summation_invariant(tree) -> bool`; `reconcile(local_chain, cloud_root) -> MergeResult` |
| **Dependencies** | stdlib `hashlib`; optional `szl-yawar` for the writer |
| **Size** | ~24 KB |
| **Proof status** | TH11 `khipuReceipt_checksum_invariant` (summation cord); INV-3 |
| **Test plan** | tamper any leaf ⇒ root changes AND summation boundary sum changes (dual detection); inclusion proof verifies; **3-tier sum-of-sums**: `root = Σpendants = ΣΣsub-pendants` (integer arithmetic, `Math.round(score*1e6)` normalisation) |
| **Khipu hooks** | this IS the DAG; `reconcile()` is the edge↔cloud sync primitive |
| **Lean obligation** | `puriq_khipu_integrity` (INV-3); TH11 |

Mirrors the existing `khipu-receipt.ts` 3-tier tree (DecisionReceipt → OrganReceipt →
root with DualAttestation). The Python port keeps the dual-attestation (2-signer)
requirement for state-changing ops.

---

## 6 — `szl-amaru` — cortex KL-drift R(a) (the heavy organ)

| Field | Value |
|---|---|
| **Factor** | `R(a) = e^{-γ·KL(p_a ‖ p_ref)}` (Pinsker/data-processing drift penalty) |
| **Range** | `(0,1]` |
| **Module structure** | `core.py` (`kl_divergence`, `drift_penalty`), `recall.py` (memory recall over local embedding index), `puriq_iface.py` |
| **Public API** | `drift_penalty(p_a, p_ref, gamma) -> float`; `recall(query, k) -> list[Memory]` |
| **Dependencies** | `numpy` (vectorised KL); **quantized FAISS/usearch index** for edge recall |
| **Size** | ~38 MB **with a quantized on-device index** (largest organ — drives the 50 MB ceiling). Index is INT8-quantized + capped at top-N mission-relevant memories at pack time. |
| **Proof status** | Pinsker bound `pinsker_kl_bound` (SORRY-tagged in DPI/DPIBound.lean) |
| **Test plan** | KL ≥ 0; `R(a)≤1`; identical distributions ⇒ `R=1`; index recall@k deterministic; **partition fits ≤50 MB** (CI asserts squash-fs size) |
| **Khipu hooks** | each plan selection logs `{plan_hash, kl, R}` leaf |
| **Lean obligation** | SF-01 organ factor (non-neg, ≤1 ⇒ INV-1..4) |

Source: Pinsker's inequality (Cover & Thomas, *Elements of Information Theory*, 2nd ed.,
§11.6). **Edge note:** on-device index is the size driver; pack-time pruning to mission
ROE keeps it ≤ budget.

---

## 7 — `szl-kallpa` — wires energy budget B(a)

| Field | Value |
|---|---|
| **Factor** | `B(a) = 𝟙[ i(η_a) ≥ i_act ]` (Butler–Volmer continue/halt budget) |
| **Range** | `{0,1}` |
| **Public API** | `bv_current(eta, i0, alpha_a, alpha_c, F, R, T) -> float`; `should_continue(eta) -> bool` |
| **Dependencies** | stdlib `math` |
| **Size** | ~6 KB |
| **Proof status** | principled stop condition (non-arbitrary), non-neg ⇒ INV-1..4 |
| **Test plan** | `i(0)=0`; monotone in η; `should_continue` flips exactly at `i_act` |
| **Khipu hooks** | continue/halt decision logged per step |
| **Lean obligation** | SF-05 |

Source: Bard & Faulkner, *Electrochemical Methods*, 2nd ed., §3.3. Replaces arbitrary step
caps with a principled marginal-overpotential stop.

---

## 8 — `szl-otel-vsp` — nervous trace O(a) (second heavy organ)

| Field | Value |
|---|---|
| **Factor** | `O(a) = 𝟙[ traceparent(child) extends traceparent(parent) ]` |
| **Range** | `{0,1}` |
| **Public API** | `span(name, parent_ctx) -> Span`; `traceparent_extends(child, parent) -> bool` |
| **Dependencies** | `opentelemetry-sdk` (the size driver, ~10–15 MB), W3C trace context |
| **Size** | ~15 MB (OTel SDK); within budget |
| **Proof status** | **HONEST: in-process only.** Wire D (cross-mesh traceparent) NOT IMPLEMENTED |
| **Test plan** | child span W3C `traceparent` descends from parent; out-of-process propagation explicitly tested as **NOT supported** (honest red test) |
| **Khipu hooks** | span open/close logged; trace_id correlates to Khipu receipt |
| **Lean obligation** | SF-08 |

Source: W3C Trace Context Recommendation. Honest scope: edge spans correlate locally;
cross-drone trace stitching happens at reconcile, not live.

---

## 9 — `szl-kanchay` — brand/claim calibration K(a)

| Field | Value |
|---|---|
| **Factor** | `K(a)=𝟙[ moralGrounding(a)≥0.95 ∧ measurabilityHonesty(a)≥0.95 ]` (two sacred axes) |
| **Range** | `{0,1}` |
| **Public API** | `claim_ok(a) -> bool`; `banned_claims_register() -> list[str]` |
| **Dependencies** | `szl-yuyay` (sacred axes) |
| **Size** | ~8 KB |
| **Proof status** | collapses to T01/T02 hard-fail ⇒ INV-1 |
| **Test plan** | banned claims ("SLSA L3", "zero sorry", unscoped "fully verified") ⇒ `K=0`; honest scoped claim ⇒ `K=1` |
| **Khipu hooks** | public-claim emission logged |
| **Lean obligation** | SF-09 |

On a drone, K(a) governs operator-facing copilot text and the audit-URL summary — no
overclaim ("99% detection") may render without an on-disk source.

---

## 10 — `szl-hatun` — doctrine additivity guard D(a)

| Field | Value |
|---|---|
| **Factor** | `D(a)=𝟙[ a is additive ∧ a edits no LOCKED number ]` |
| **Range** | `{0,1}` |
| **Public API** | `is_additive(a) -> bool`; `locks_intact(a) -> bool`; `LOCKED_NUMBERS` const |
| **Dependencies** | stdlib |
| **Size** | ~10 KB (carries the LOCKED-number table) |
| **Proof status** | structurally enforces "v12 = v11 + PURIQ, no edits" |
| **Test plan** | any edit to 749/14/163/13-axis/replay-hash/A2/A4/SLSA-L1/Conjecture-1 ⇒ `D=0` |
| **Khipu hooks** | doctrine-amendment proposals logged |
| **Lean obligation** | SF-10 |

`LOCKED_NUMBERS = {"declarations":749,"unique_axioms":14,"sorries":163,"axes":13,
"replay_hash":"bacf5443...631fc5","slsa":"L1","lambda_uniqueness":"CONJECTURE"}` — any
attempt to mutate fails the gate.

---

## 11 — `szl-sumaq` — designer honest-proof guard S(a)

| Field | Value |
|---|---|
| **Factor** | `S(a)=𝟙[ every sorry tagged ∧ proof_status∈{PROVEN,SORRY,AXIOM,CONJECTURE} ]` |
| **Range** | `{0,1}` |
| **Public API** | `proof_status_ok(a) -> bool`; `tag(decl) -> Literal["PROVEN","AXIOM","SORRY","CONJECTURE"]` |
| **Dependencies** | stdlib |
| **Size** | ~8 KB |
| **Proof status** | Zero-Bandaid enforced in the selection operator itself |
| **Test plan** | hidden/un-tagged `sorry` ⇒ `S=0`; properly tagged artifact ⇒ `S=1` |
| **Khipu hooks** | artifact-shaping actions logged with proof status |
| **Lean obligation** | SF-11 |

---

## 12 — `szl-killinchu` (the organ factor, not a separate vendored lib — lives in szl-puriq core)

| Field | Value |
|---|---|
| **Factor** | `G(a)=𝟙[ pose(a)∈𝒮_safe ∧ ‖u(a)‖≤u_max ]` (geofence + dynamics feasibility) |
| **Range** | `{0,1}` |
| **Public API** | `geofence_ok(a) -> bool`; `actuator_ok(u) -> bool`; `safe_set() -> Polytope` |
| **Dependencies** | `numpy` (pose math), MAVLink geofence import |
| **Proof status** | INV-4 Bekenstein bound (physical 𝒜 finite, geofenced) |
| **Test plan** | command outside geofence ⇒ `G=0`; `‖u‖>u_max` ⇒ `G=0`; RTL inside safe set ⇒ `G=1` |
| **Lean obligation** | `puriq_bekenstein_bound` (INV-4) |

Source: LaValle, *Planning Algorithms*, ch. 13–15. This is the bridge from digital
governance to physical safety — a drone cannot enumerate an unbounded physical action set.

---

## 13 — Size-budget rollup (the 50 MB squash-fs check)

| Package | Size (worst case) | Driver |
|---|---|---|
| szl-lambda | 8 KB | pure |
| szl-yuyay | 12 KB | pure |
| szl-yawar | 4 KB | pure (20 LOC) |
| szl-hukulla | 40 KB | 660 SLOC + sigs |
| szl-khipu | 24 KB | pure |
| szl-amaru | **38 MB** | quantized on-device index |
| szl-kallpa | 6 KB | pure |
| szl-otel-vsp | **15 MB** | OTel SDK |
| szl-kanchay | 8 KB | pure |
| szl-hatun | 10 KB | LOCKED table |
| szl-sumaq | 8 KB | pure |
| szl-puriq core (+ killinchu G) | ~200 KB | numpy thin |

**Each lib individually ≤ 50 MB** (HARD RULE met). To co-resident them, the partition
layout uses **per-organ squash-fs sub-images** so `szl-amaru` and `szl-otel-vsp` get their
own 50 MB partitions; the 9 pure organs share one 50 MB partition with vast headroom. CI
gate `test_squashfs_size.py` asserts each sub-image `du -sb ≤ 52428800`.

---

## 14 — Universal test plan (applies to all 11)

1. **Purity:** no module mutates global state in the decision path (lint + AST check).
2. **Range:** organ factor ∈ `[0,1]` or `{0,1}` (property test, 10k random inputs).
3. **INV-safety:** multiplying `U` by the factor never *increases* it beyond
   `Λ·Yuyay·∏Khipu` envelope (it can only shrink the gated region).
4. **Khipu hook:** every public action emits exactly one decision leaf via RUWAY.
5. **Edge:** import + run with **no network** (CI runs in `--network=none` container).
6. **Squash-fs size:** sub-image `≤ 50 MB`.
7. **Proof-status honesty:** `_proof_status.py` tags match `PROOF_OBLIGATIONS.md`; no
   hidden `sorry`.

— Yachay, 2026-06-01. Pure, vendorable, edge-survivable. No mysticism. No bandaid.
