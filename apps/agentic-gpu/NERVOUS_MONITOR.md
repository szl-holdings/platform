# NERVOUS Monitor — proprioception + self-heal for the agentic GPU

`nervous_monitor.py` is the **NERVOUS organ** of the anatomy shell. It gives the
betterwithage RTX 5000 agentic mind a nervous system: it **senses drift** in its
own posture and **fires an alarm** that triggers a **self-heal** — an honest-revert
to a truthful posture (`maintenance` / `sovereign:false`) plus a reroute signal.
This formally **closes the half-state loop** (Anatomy Shell brief, frontier #3:
*"NERVOUS → drift-triggered self-heal"*).

It is **disjoint**: a NEW file that does not import or modify `scheduler.py` or
`daemon.py`. The daemon is integrated via a **duck-typed** adapter only.

## The proven formula — NervousShannonAlarm (round9)

Real information theory, no fudge:

- **Shannon entropy** `H(P) = -Σ_i p_i · log2(p_i)` (bits)
- **KL divergence** `KL(P||Q) = Σ_i p_i · log2(p_i / q_i)` (bits)

Each observed `PostureSnapshot` is discretized into one finite posture **state**
(`sov{0,1}|{local,router}|{awake,asleep}|{cheap,normal,dear}`). We accumulate a
frequency distribution over a recent **window** `P` and an established
**baseline** `Q`, then fire a **soft drift alarm** when `KL(P||Q)` crosses a
threshold (or the entropy change `|H(P) − H(Q)|` does). KL uses Laplace (add-one)
smoothing over the union support so `q_i > 0` always — KL stays finite,
non-negative, and is **0 iff P == Q**. This is an honest divergence.

Cite: **NervousShannonAlarm** (lutar-lean round9, kernel-proven) and the live
**NERVOUS** endpoint **amaru `/api/amaru/overwatch/snapshot`** (read-only,
open-weight, **NO key**).

## The half-state — the ONLY unacceptable outcome (doctrine)

The half-state is: the banner/posture claims `sovereign:true` while the actual
serving path went to a **router** (mismatch), or the GPU is **asleep** while the
posture claims it is active. Per doctrine this must **never silently persist**.

So in addition to the statistical drift alarm, the monitor fires a **HARD TRIP**
the instant a single snapshot is logically inconsistent:

- `claimed_sovereign == True` **and** `serving_path == "router"` (banner lies), or
- `claimed_sovereign == True` **and** `gpu_awake == False` (asleep but loud).

A hard trip needs no window and no threshold — one bad snapshot is enough,
because **honest-revert beats overclaim**.

## Self-heal

`self_heal(snapshot) -> HealedPosture` returns an honest posture:
- GPU asleep → `maintenance` posture, `sovereign:false`, reroute.
- otherwise → drop the overclaim to `sovereign:false` (router fallback is honest
  when local truly is not serving), reroute.

`heal_daemon(daemon_like, snapshot)` is a **duck-typed** adapter: it flips
`.serving_local`/`.posture` on ANY object exposing them (the real
`ResidentDaemon` or a stand-in) **without importing or modifying** the daemon
module. An optional `try: from daemon import ResidentDaemon` is used ONLY for an
integration smoke check; its absence never weakens the monitor.

## Reactive is never affected

This monitor observes and heals **posture only**. It exposes **nothing** that
gates, queues, throttles, or preempts a reactive (Chaski) turn — proprioception
is read-only with respect to the serving path. The self-test asserts the monitor
surface contains none of the forbidden reactive-gating hooks.

## Live overwatch (optional, SAMPLE)

`fetch_overwatch_snapshot()` may read **amaru `/api/amaru/overwatch/snapshot`**
via stdlib `urllib` with a short timeout. It **never raises**, sends **no key**,
and tags any returned payload `"_label": "SAMPLE"`. The monitor never requires
the network; the self-test does not touch it.

## Self-test

`python3 nervous_monitor.py` runs `_selftest()` and prints a JSON dict. It
simulates and asserts:

1. **NORMAL** stream (consistent `sovereign:true` + local + awake) → **no alarm**.
2. **DRIFTED** stream where sovereign is claimed but `serving_path` flips to
   `router` (the half-state) → **alarm FIRES** (`half_state_hard_trip`); a pure
   statistical KL-drift case also fires.
3. `self_heal` flips posture to honest (`sovereign:false` / `maintenance`) and a
   verify step confirms the **half-state is gone**.
4. **reactive is unaffected** — the monitor exposes no reactive-gating hook.

`"ok": true` only when all pass.

## Doctrine floor

- The half-state (banner sovereign while router serves) is the ONLY unacceptable
  outcome — this is exactly what the monitor catches; honest-revert beats overclaim.
- **Reactive is never touched.**
- Energy windows (`cheap`/`normal`/`dear`) are **SAMPLE** policy signals, not
  metered joules.
- **open-weight; never commit a key.**
- **Λ stays Conjecture 1** (the skeleton's killer formula is intentionally a
  conjecture).
