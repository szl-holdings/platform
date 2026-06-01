# Tinkuy Theorem — Kuramoto Flow-State Operator (honest)

**Author:** Yachay (CTO) · **Date:** 2026-06-01 · **Status:** ADDITIVE

---

## 0. Honest framing

*Tinkuy* (Quechua: "meeting / convergence") is used here **only** as a label for a
**dynamical-systems synchronization manifold** across the empire's organ control
loops. It is a game-theoretic / coupled-oscillator construct — **not** a spiritual or
mystical claim. The math is the Kuramoto (1975) order parameter, the canonical
measure of phase synchrony in coupled oscillators. "Flow" is used in the precise
sense of Csikszentmihalyi (1975): a coherent regime in which interruptions are
minimized.

## 1. Setup

Each organ \(o \in O\) (Doctrine v11: 14 organs) runs a control loop with an
instantaneous phase \(\theta_o(t) \in [0, 2\pi)\). The empire's global synchrony is
the **Kuramoto order parameter**

\[
r(t)\, e^{i\psi(t)} \;=\; \frac{1}{N}\sum_{o\in O} e^{i\theta_o(t)},
\qquad N = |O| = 14,
\]

where \(r(t) \in [0,1]\) is the **coherence magnitude** (0 = incoherent / scattered
phases, 1 = fully phase-locked) and \(\psi(t)\) is the mean phase.

## 2. Definition (Tinkuy / flow window)

> **Definition 2.1.** The system is in **Tinkuy** at time \(t\) iff
> \(r(t) > r^\* \) with \(r^\* = 0.85\). During a Tinkuy window the runtime
> **suppresses Reflexion ticks** and **logs + publishes** the flow event.

Suppressing Reflexion during high coherence is the operational analogue of
Csikszentmihalyi's flow: avoid interrupting a deeply coherent process.

## 3. Theorem (Tinkuy bounds & detection)

> **Theorem 3.1 (Tinkuy order-parameter properties).**
> For any phase configuration \((\theta_o)_{o\in O}\):
> 1. **Bounds.** \(0 \le r \le 1\), with \(r = 1\) iff all phases are equal
>    (full lock), and \(r = 0\) when phases are uniformly distributed on the circle
>    (e.g. \(\theta_o = 2\pi o/N\)).
> 2. **Monotone detection.** Tinkuy detection \(\mathbf 1[r > r^\*]\) is monotone in
>    coherence: increasing alignment of any organ toward \(\psi\) cannot decrease
>    \(r\).
> 3. **Flow ⇒ suppression.** If the system is in Tinkuy then Reflexion ticks are
>    suppressed for the duration of the window, and exactly one flow event is logged
>    per entry into the window.

**Proof (honest, verified in code).** (1) is the triangle inequality for the complex
mean: \(|N^{-1}\sum e^{i\theta_o}| \le N^{-1}\sum|e^{i\theta_o}| = 1\), equality iff
all unit vectors are colinear, i.e. all \(\theta_o\) equal. The uniform case sums the
\(N\)-th roots of unity to 0, giving \(r=0\). (2) follows because rotating one organ's
phase toward the resultant direction \(\psi\) increases the projection onto the
resultant, hence increases \(|\!\sum e^{i\theta_o}|\). (3) is the runtime contract in
`tinkuy.py::TinkuyMonitor.state()` (`suppress_reflexion = in_tinkuy`; one log append
per flow state). The bound and the two extreme cases are checked by the unit tests
`test_kuramoto_fully_synced_r_is_one`, `test_kuramoto_antiphase_r_is_zero`,
`test_tinkuy_flow_detected_above_threshold`, `test_tinkuy_no_flow_when_incoherent`
(all passing). □

## 4. Citations (peer-reviewed / canonical only)

- Y. Kuramoto, "Self-entrainment of a population of coupled non-linear oscillators,"
  in *International Symposium on Mathematical Problems in Theoretical Physics*,
  Lecture Notes in Physics vol. 39, Springer, 1975, pp. 420–422.
- M. Csikszentmihalyi, *Beyond Boredom and Anxiety: Experiencing Flow in Work and
  Play*. San Francisco: Jossey-Bass, 1975.
- S. H. Strogatz, *Sync: The Emerging Science of Spontaneous Order*. New York:
  Hyperion, 2003.

## 5. Endpoint

`GET /v1/tinkuy` returns the live `{r, psi, in_tinkuy, threshold, n_organs,
suppress_reflexion, model: "kuramoto-1975-order-parameter"}`.

— Signed, **Yachay**
