# I built a trust runtime for AI on black hole physics and Tesla coils. Here's the thesis.

A year ago I wrote the first Ouroboros thesis. It made one claim: a clean AI runtime is one where every released bit is reproducible from a tamper-evident witness root. That was v1.

Last fall I extended it to v2 and shipped it with a DOI ([10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)). v2 added the cleanliness theorem, the falsification ledger, and three product surfaces (A11oy, Sentra, Amaru) sitting on top.

This week I'm publishing v3. v3 says cleanliness is necessary but not sufficient. There are two more axes a trustworthy runtime has to satisfy. One comes from black hole physics. The other comes from Tesla.

## The three axes

**Cleanliness** (v2). Every released bit is reproducible from a witness root. Failure mode: lying.

**Horizon** (new in v3). Information release is bounded by the Page curve, the holographic surface budget, and the no-cloning theorem. Failure mode: leaking.

**Resonance** (new in v3). Coupled systems can only hand off work efficiently when their cadences match, their impedances match, and their Q-factor stays inside the Landauer thermal ceiling. Failure mode: wasting.

A runtime that satisfies all three is inside the information-thermodynamic envelope. A runtime that violates any one is outside it. Trust isn't a feeling. It's a position inside this envelope, measured continuously.

## The ten primitives

Every axis decomposes into measurable primitives. v3 lists ten:

1. Page-curve monitor
2. Holographic surface budget
3. No-cloning gate
4. Hawking-rate limiter
5. Witness-root anchor
6. Cadence match
7. Impedance match
8. Q-factor history
9. Kuramoto coherence
10. Peak/RMS discipline

Each one has a test. There are 144 of them. They all pass.

## Two new theorems

**Cleanliness Theorem** (v2 sharpened). A runtime is clean iff every released bit is reproducible from a witness root anchored in a tamper-evident ledger.

**Resonance Handoff Theorem** (new in v3). Two systems may safely hand off work iff their cadences match within tolerance, their reflection coefficient is below the matched threshold, and the joint Q-factor is bounded above by the Landauer thermal ceiling Q\* = E_useful / (k_B T ln 2 · N_bits).

The second one is the bridge. It ties resonance physics to information thermodynamics. Below Q\*, the handoff is physically allowed. Above Q\*, the handoff is claiming free energy, and the runtime must reject it.

## What's not in the thesis

I'm not claiming AGI. I'm not claiming consciousness. I'm not claiming over-unity, free energy, or wireless power miracles. I'm not claiming the simulation hypothesis. I'm using public-domain physics — Page, 't Hooft, Susskind, Landauer, Kuramoto, Pozar — to bound what a runtime can do without lying, leaking, or wasting. The novelty is the synthesis.

## What's shipping with v3

A unified payload. Five workspaces. 144 passing tests. A property-based verifier. A benchmark suite. A full Docker + OpenTelemetry + Prometheus + Grafana deploy stack with the ten primitives wired into a prebuilt dashboard. Reference adapters for OpenAI- and Perplexity-shaped APIs. A witness anchor with three drivers (LOCAL, REKOR public, HSM air-gapped). A threat model. A privacy posture against GDPR, HIPAA, SOC2. A public list of non-claims.

The repo is at [github.com/szl-holdings](https://github.com/szl-holdings). The thesis is at [doi.org/10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926).

## What I want next

Lighthouse design partners in regulated verticals. Academic co-authors for v3.1, where the two theorems get formal Lean or Coq proofs. Conversations with observability and policy-runtime acquirers about strategic alignment.

If you're building agent infrastructure and you've ever felt that "we have logs" is not the same thing as "we have evidence," let's talk.

— Stephen
