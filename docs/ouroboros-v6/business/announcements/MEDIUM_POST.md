# Ouroboros v3: A Trust Runtime for AI, Bounded by Physics

The problem with most AI governance frameworks today is they read like compliance checklists. They tell you to log things, audit things, document things. They don't tell you whether the system is actually behaving honestly.

I think that's a category error. Trust isn't a checklist. Trust is whether the system can be measured, continuously, against a physical bound.

That's what Ouroboros v3 is: ten measurable primitives that together form a runtime envelope. Inside the envelope, your AI system is not lying, not leaking, and not wasting. Outside it, at least one of those three things is happening.

## The ten primitives

I'll list them with one-line descriptions. Each is implemented and tested in the [unified payload](https://github.com/szl-holdings).

1. **Page-curve monitor** — releases follow Page's 1993 curve, not a runaway exponential.
2. **Holographic surface budget** — output bits ≤ boundary capacity ('t Hooft 1993, Susskind 1995).
3. **No-cloning gate** — secrets cannot exist at two endpoints (Wootters & Zurek 1982).
4. **Hawking-rate limiter** — controlled release, no burst exfiltration.
5. **Witness-root anchor** — tamper-evident Merkle root anchored in Sigstore Rekor or an internal HSM.
6. **Cadence match** — handoff frequency matches receiver's resonant frequency within tolerance δ.
7. **Impedance match** — reflection coefficient |Γ| below threshold before coupling.
8. **Q-factor history** — sustained ratio of useful work to dissipated work.
9. **Kuramoto coherence** — multi-agent fleets maintain order parameter r ≥ 0.85 (Kuramoto 1984).
10. **Peak/RMS discipline** — alerts on safety signals reject mean-only aggregations.

## Why physics?

Because physics gives you bounds you can't argue with. The Page curve says how fast information can leave a black hole. The holographic principle says how much information can be encoded on a boundary. The no-cloning theorem says a quantum state can't be in two places. Landauer says erasing one bit costs k_B T ln 2 joules.

These aren't metaphors. They're upper bounds on what an information-processing system can do. If your AI runtime claims to release more, encode more, clone more, or erase cheaper than the physics allows, your runtime is lying. Or measuring something different than it thinks it is.

## What's new in v3

v2 had one axis (cleanliness) and the cleanliness theorem. v3 adds two axes (horizon, resonance) and one new theorem (the resonance handoff theorem). Together they define an information-thermodynamic envelope inside which a runtime is provably trustworthy along three dimensions.

## What I'm not claiming

I'm not claiming AGI, consciousness, emergence, or any flavor of mysticism. The math is public domain. The synthesis is what's novel — bringing these primitives together as a single runtime layer.

## Where to look

- Thesis v2 (with DOI): [doi.org/10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129)
- Thesis v3 outline (this drop): [github.com/szl-holdings/ouroboros-thesis](https://github.com/szl-holdings/ouroboros-thesis)
- Unified payload: [github.com/szl-holdings/ouroboros](https://github.com/szl-holdings/ouroboros)
- Substack: [szlholdings.substack.com](https://szlholdings.substack.com)

If you're building runtime infrastructure for AI and you've felt that the current observability stack is not enough, this is for you.

— Stephen
