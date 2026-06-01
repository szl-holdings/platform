# ORGAN_LOOP_SPEC — the generic OrganAgent loop interface

**Layer:** PURIQ-OS (additive over Doctrine v12). **Signed:** Yachay (Perplexity
Computer Agent), 2026-06-01.

This spec defines the single interface every one of the 12 canonical organs implements
to become agentic. It is the contract behind `puriq_os/loop.py::OrganAgent`.

---

## 1. The five-step cycle

Each OrganAgent runs, once per cadence tick, the Wiener feedback loop:

```
observe(state)            -> x            # sample local state vector (Wiener: sense)
score(candidate_actions)  -> [U(a|x)]     # Puriq utility per Doctrine v12 §2
select(scored)            -> a*           # argmax over the bounded set 𝒜
execute(a*)               -> result       # apply the state change (no-op allowed)
emit_receipt(a*, result)  -> KhipuReceipt # exactly one hash-chained receipt per tick
```

A halt-safety check runs inside `score`/`select`: if any HUKLLA tripwire (T01–T10) is
not clear, every candidate's utility is forced to 0, no action executes, and the loop
latches to `HALTED`.

## 2. Python interface (abstract base)

```python
class OrganAgent(ABC):
    organ: str            # canonical organ name
    cadence_seconds: int  # tick period T, chosen via Nyquist (Shannon 1948)
    beta: float = 1.0     # HUKLLA halt-penalty rate

    # --- subclasses MUST implement these three ---
    @abstractmethod
    def observe(self, world) -> dict:
        """Sample the organ's local state vector x for this tick."""

    @abstractmethod
    def candidate_actions(self, x: dict) -> list[Action]:
        """Enumerate the bounded action set 𝒜(x). |𝒜| small & finite (INV-4)."""

    @abstractmethod
    def execute(self, action: Action, x: dict):
        """Apply the selected state change. A no-op Action is always valid."""

    # --- provided by the base class (do not override) ---
    def score(self, actions, x) -> list[float]:
        """U(a|x) = Λ(x)·Yuyay13(a)·exp(-β·HUKLLA(a))·∏ Khipu_i(a) for each a."""

    def select(self, actions, scores) -> Action | None:
        """argmax; returns None (→ no-op) if best utility == 0."""

    def emit_receipt(self, action, result, x) -> KhipuReceipt:
        """Sign exactly one hash-chained Khipu receipt for this tick."""

    def tick(self, world) -> TickResult:
        """observe → score → select → execute → emit_receipt; one cadence step."""
```

## 3. Step semantics

| Step | Input | Output | Governing rule |
|------|-------|--------|----------------|
| `observe` | live world handle | state vector `x` (dict of `[0,1]` axes + raw metrics) | Wiener sense; one sample/tick |
| `score`   | `𝒜`, `x` | utility per action | Doctrine v12 §2 `U(a∣x)`; Yuyay₁₃=0 ⇒ U=0 |
| `select`  | scored `𝒜` | `a*` or `None` | `argmax`; ties → first; all-zero → no-op |
| `execute` | `a*`, `x` | result | state change; irreversible acts need 2-person Yuyay gate |
| `emit_receipt` | `a*`, result, `x` | `KhipuReceipt` | exactly one per tick; chained via `prev_hash` |

## 4. Invariants the base class enforces

- **One receipt per tick** — `tick()` always calls `emit_receipt` exactly once, even
  on a no-op (the no-op is recorded). 100 ticks ⇒ 100 receipts.
- **Yuyay gate is mandatory** — `score` calls the 13-axis gate; an action whose Yuyay
  vector is below floor scores 0 and can never be selected (INV-1 algebraic root).
- **Halt-safety** — any HUKLLA trip ⇒ utilities zeroed + `status = HALTED`; the
  scheduler stops ticking a halted organ until a gated resume.
- **Chain integrity** — `emit_receipt` reads the ledger head as `prev_hash`; a fork is
  rejected by the ledger (INV-3).

## 5. Cadence selection (Shannon-Nyquist, honest)

`cadence_seconds = T` is chosen so `T < 1/(2·B_organ)`, where `B_organ` is the fastest
meaningful change rate of that organ's observed state. The integer periods used by the
12 organs (e.g. 7 s, 12 s, 49 s) are the nearest convenient integers satisfying this —
**not** mystical numbers. See `PURIQ_OS_DOCTRINE.md` §2.

## 6. Source of truth

Implementation: `/home/user/workspace/szl_puriq_os/puriq_os/loop.py` and
`puriq_os/organs/*_agent.py`. See `RUNTIME_SOURCE_INDEX.md` for all paths.
