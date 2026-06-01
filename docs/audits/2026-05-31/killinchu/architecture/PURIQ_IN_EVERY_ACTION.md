# PURIQ_IN_EVERY_ACTION — the master formula on every Killinchu operation

**Layer:** PURIQ v12 → `killinchu/architecture/`
**Author:** Yachay, under CTO authority · 2026-06-01
**References:** `puriq/doctrine/PURIQ_DOCTRINE_v12.md` (master formula §2; four invariants
§3); `puriq/doctrine/sub_formulas/PURIQ_SUBFORMULAS_v12.md` (SF-12 Killinchu-Puriq).

**Master formula (locked, Doctrine v12 §2):**
\[
P(x,t) = \operatorname*{arg\,max}_{a \in \mathcal{A}}
\Big[\; \Lambda(x)\cdot \mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot \textstyle\prod_i \mathrm{Khipu}_i(a)\;\Big].
\]

Killinchu specialises it with the geofence factor `G(a)` (SF-12):
\[
P_{\text{Killinchu}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{act}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot G(a)\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big].
\]

**The contract: every Killinchu operation is `drone command → puriq.decide() → Khipu
receipt → execute`.** No actuation bypasses `puriq.decide`. Below are **5 concrete code
paths** with patches. The patch file is at `patches/killinchu_puriq_decide.patch`.

---

## 0 — The single decision primitive (`szl_puriq/decide.py`)

```python
# szl_puriq/decide.py  — runs on EVERY action (connected or edge)
import math
from dataclasses import dataclass
import szl_lambda, szl_yuyay, szl_hukulla, szl_khipu, szl_killinchu, szl_yawar

BETA = 12.0   # halt-penalty rate (β≫0): one tripwire ⇒ utility ×e^-12 ≈ 6e-6

@dataclass
class Decision:
    action: "Action"; U: float
    Lambda: float; yuyay13: float; hukulla: int
    khipu_ok: bool; geofence_ok: bool
    selected: bool = False

def utility(a: "Action", x: "Context", organ_factor: float = 1.0) -> Decision:
    L = szl_lambda.aggregate(x.axes, x.weights)            # Λ(x) ∈ [0,1]
    Y = szl_yuyay.score13(a)                               # Yuyay₁₃(a) ∈ {0}∪(0,1]
    H = szl_hukulla.tripwire_count(a)                      # HUKLLA(a) ∈ ℕ
    K = szl_khipu.product_verify(a)                        # ∏Khipu_i(a) ∈ {0,1}
    G = 1.0 if szl_killinchu.geofence_ok(a) else 0.0       # G(a) ∈ {0,1}
    U = L * Y * math.exp(-BETA * H) * K * G * organ_factor
    return Decision(a, U, L, Y, H, bool(K), bool(G))

def decide(candidates: list["Action"], x: "Context",
           organ_factor=lambda a: 1.0) -> Decision:
    """argmax over the BEKENSTEIN-BOUNDED candidate set 𝒜 (INV-4)."""
    assert len(candidates) <= szl_killinchu.bekenstein_N(x), "INV-4: |𝒜| bounded"
    scored = [utility(a, x, organ_factor(a)) for a in candidates]
    best = max(scored, key=lambda d: d.U)
    best.selected = True
    return best

def act(d: Decision, two_person: "Gate", roe: "ROE | None" = None) -> "Receipt":
    """Execute ONLY after the 2-person gate (or pre-signed ROE when disconnected)."""
    if d.action.is_state_changing:
        if not (two_person.satisfied() or (roe and roe.authorizes(d.action))):
            raise PermissionError("2-person Yuyay gate not satisfied")
    receipt = szl_yawar.append(  # RUWAY is the ONLY writer
        packet={"action": d.action.summary, "U": d.U, "yuyay13": d.yuyay13,
                "hukulla": d.hukulla, "geofence_ok": d.geofence_ok,
                "khipu_ok": d.khipu_ok, "signers": two_person.signers() if d.action.is_state_changing else []},
        prev_root=szl_khipu.head())
    szl_khipu.extend(receipt)          # one canonical (or local) DAG
    return receipt
```

This primitive is the spine of all 5 paths.

---

## PATH 1 — OTA accept (firmware/config over-the-air update)

State-changing, high-risk. SENTRA screens the payload **before** compute (SF-04).

```python
# killinchu/ops/ota.py
def accept_ota(payload: bytes, x: Context, gate: Gate) -> Receipt:
    # SENTRA inline immune screen FIRST — adversarial payload never enters compute
    if not szl_hukulla.sentra_inspect({"ota": payload[:1_000_000]}):
        # immune rejection ⇒ no receipt enters ledger (Khipu_i stays 0 ⇒ U=0)
        raise SecurityHalt("SENTRA rejected OTA payload")
    a = Action(kind="ota_accept", payload_hash=sha256(payload),
               is_state_changing=True)
    d = puriq.decide([a, Action(kind="ota_reject", is_state_changing=False)], x)
    # OTA accept requires 2 signers (HARD RULE) AND geofence-irrelevant but G(a)=1 for config
    if d.action.kind == "ota_accept":
        return puriq.act(d, gate)          # blocks until 2nd signer
    raise OTARejected(d)                    # argmax chose reject (e.g. HUKLLA fired)
```
- `e^{-β·HUKLLA}`: a tampered firmware trips T-signatures ⇒ HUKLLA≥1 ⇒ accept utility →0
  ⇒ argmax picks reject. **INV-1 halting safety.**
- 2-person gate: firmware accept is state-changing ⇒ two distinct signers required.

---

## PATH 2 — mission start

```python
# killinchu/ops/mission.py
def start_mission(mission: Mission, x: Context, gate: Gate, roe: ROE | None) -> Receipt:
    # Rosie proposes plan deltas (candidate actions 𝒜); a11oy /v1/router when connected
    candidates = rosie_companion.evolve(mission, x).candidate_actions()  # bounded 𝒜
    # geofence + dynamics feasibility per candidate (SF-12 G(a))
    d = puriq.decide(candidates, x)
    if d.U == 0.0:
        raise MissionRefused("no candidate cleared Λ·Yuyay·HUKLLA·G·Khipu")
    return puriq.act(d, gate, roe)         # 2-person gate, or pre-signed ROE if edge
```
- `Yuyay₁₃(a)`: a mission plan failing any of the 13 axes ⇒ utility 0 ⇒ never selected.
- `G(a)`: a plan whose waypoints leave the geofence ⇒ `G=0` ⇒ excluded (**INV-4**).
- Edge: if disconnected, `evolve` uses local heuristic candidates; ROE authorizes.

---

## PATH 3 — command receive (operator issues a single command)

```python
# killinchu/ops/command.py
def receive_command(cmd: OperatorCommand, x: Context, gate: Gate, roe: ROE | None) -> Receipt:
    a = Action.from_command(cmd)
    # bounded action space: the command + its safe alternatives (hold, RTL)
    A = [a, Action.hold(), Action.rtl()]
    assert len(A) <= szl_killinchu.bekenstein_N(x)        # INV-4
    d = puriq.decide(A, x, organ_factor=szl_kallpa.energy_budget)  # B(a) energy gate (SF-05)
    receipt = puriq.act(d, gate, roe)
    mavlink.dispatch(d.action.to_mavlink())                # ONLY after receipt
    return receipt
```
- `B(a)` (Kallpa, Butler–Volmer): a command that would drain energy below the activation
  threshold ⇒ `B=0` ⇒ argmax falls back to hold/RTL. Principled stop, not a fixed cap.
- Note dispatch happens **after** the receipt — every actuation is receipted first.

---

## PATH 4 — RTL trigger (return-to-launch — the safety reflex)

```python
# killinchu/ops/rtl.py
def trigger_rtl(reason: str, x: Context, roe: ROE) -> Receipt:
    a = Action(kind="rtl", reason=reason, is_state_changing=True)
    # RTL is a HALT-CLASS action: T10 (STOP/undo/revert) semantics — absorbing.
    # If a tripwire already fired, RTL is FAVORED (it is the clean halt action).
    d = puriq.decide([a, Action.continue_mission()], x)
    # On the edge with no link, RTL is in the pre-signed ROE envelope (always authorized)
    return puriq.act(d, two_person=Gate.degraded(), roe=roe)
```
- RTL maps to **T10 absorbing halt** semantics: once a STOP condition fires, `continue`
  utility →0 and RTL wins the argmax (**INV-1**). RTL is the one state-changing action the
  pre-signed ROE *always* authorizes (a drone must always be able to come home).

---

## PATH 5 — swarm consensus vote (this drone's contribution)

```python
# killinchu/ops/swarm.py
def cast_consensus_vote(event: SwarmEvent, proposed: Action, x: Context) -> Vote:
    # each drone INDEPENDENTLY computes Yuyay₁₃ and HUKLLA for the proposed response
    d = puriq.decide([proposed, Action.abstain()], x)
    vote = Vote(action=proposed, U=d.U, yuyay13=d.yuyay13, hukulla=d.hukulla,
                clean=(d.hukulla == 0 and d.yuyay13 >= 0.90),
                receipt_hash=szl_khipu.head())
    # a drone only votes YES if its OWN wise-reasoning gate cleared (HUKLLA=0 ∧ Yuyay pass)
    vote.ballot = "YES" if (vote.clean and d.action is proposed) else "NO"
    # the vote itself is a receipted decision in the shared Khipu DAG branch
    szl_yawar.append({"swarm_vote": event.id, "ballot": vote.ballot,
                      "yuyay13": vote.yuyay13, "hukulla": vote.hukulla}, szl_khipu.head())
    return vote
```
- The novel piece: consensus counts only votes that **each independently cleared the
  13-axis gate with HUKLLA=0**. BFT agreement (f<n/3) on the action + Khipu root.
  Full protocol in `SWARM_CONSENSUS_PROTOCOL.md`.

---

## Invariant traceability (all 5 paths)

| Path | Dominant factor | Invariant | Mechanism |
|---|---|---|---|
| OTA accept | `e^{-β·HUKLLA}` + SENTRA pre-screen | INV-1 | tampered firmware ⇒ U→0 |
| Mission start | `Yuyay₁₃` + `G(a)` | INV-1, INV-4 | plan must clear gate + geofence |
| Command receive | `B(a)` energy + `G(a)` | INV-4 | bounded 𝒜, energy-principled stop |
| RTL trigger | T10 absorbing halt | INV-1 | RTL wins argmax when STOP fires |
| Swarm vote | per-drone `Yuyay₁₃`+`HUKLLA` | INV-1, INV-3 | clean-vote-only consensus |

All five paths: **`∏Khipu_i(a)`** must be 1 for non-zero utility (**INV-3**); **RUWAY** is
the only writer; **every** action emits exactly one receipt before execution.

---

## Honest labels
- The four invariants are **`sorry`-tagged** Lean obligations (`PuriqLean.lean`), not
  proven theorems. `β=12.0` is a chosen parameter; INV-1 is stated for "sufficiently large β".
- Khipu signature = **DSSE PLACEHOLDER**; `Khipu_i` verifies the hash chain, not signature.
- Edge candidate-generation is **local heuristics**, not a frontier LLM (honest degrade).

— Yachay, 2026-06-01. P(x,t) on every action. Receipt before execute. No bandaid.
