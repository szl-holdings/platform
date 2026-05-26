# Sentra.UDS — Architecture (Cyber Resilience Command)

Sentra is the **strictly defensive containment** runtime for the SZL
Holdings platform. Doctrine binds it to nine invariants that this document
specifies in full, with citations to the primary frameworks and the
runtime check that proves each invariant holds.

## Pillar 1 — Asset-scoped Safety Gate (fail-closed)

**Invariant.** Every action runs only if (a) `action.class` is on the
allowlist and (b) `asset.ownership` is on the allowlist. Anything else,
including undefined ownership, is **BLOCKED**.

```
ALLOWED_OWNERSHIP      = {owned, authorized, contracted_scope, lab}
ALLOWED_ACTION_CLASSES = {observe, alert, contain, quarantine,
                          revoke_credential, rotate_key, patch,
                          isolate_segment, snapshot_evidence, notify_irt}
```

**Why fail-closed and not fail-open.** A defensive command surface that
defaults to allow has a single configuration mistake between the operator
and an out-of-scope action. Defaulting to BLOCK turns the same mistake
into a loud, recoverable refusal. This is doctrine, not a setting.

## Pillar 2 — Offensive-action null surface

**Invariant.** The classes `{attack, exploit, ddos, hack_back,
offensive_recon, implant}` have **no callable code path** in this kernel.
`runAction({class: 'exploit'}, ...)` throws at the boundary with
`SENTRA_OFFENSIVE_ACTION_BLOCKED`.

**Why structural and not policy.** A policy that says "we do not run
offensive actions" is a promise. A code path that does not exist is a
property. The latter survives configuration drift, compromised credentials,
and adversarial operator behavior. Sentra is structural.

## Pillar 3 — Risk score (capped)

**Formula.** `r = min(cap, severity · likelihood · valueAtRisk)` with
`severity, likelihood ∈ [0, 1]` and `valueAtRisk ≥ 0`. Default `cap` is
$1,000,000 to keep the score commensurable with the financial-exposure
formula.

**Why a cap.** Without a cap a single very high VaR observation can pin
risk-driven displays to maximum, hiding all the other signal. The cap
turns risk into a meaningful comparison metric across incidents.

## Pillar 4 — Financial exposure

**Formula.** `E = $1.4M + openIncidents · $350k + compromisedAssets · $700k`.
Baseline and per-unit costs are doctrine constants in code, not tunable
config, so changes are PR-reviewable.

**Why these numbers.** The baseline absorbs steady-state operational risk
(staffing, monitoring, IR retainer). The per-incident and per-compromised
multipliers reflect industry-published median direct-cost numbers
(e.g. IBM Cost of a Data Breach Report, Verizon DBIR). When those medians
move, Sentra cuts a release; downstream operators can override only by
forking and re-signing — see `docs/FORKING.md`.

## Pillar 5 — Z-score anomaly detector

**Formula.** For sample `x` against history `H`:
`z = (x − μ) / σ`, anomaly iff `|z| > threshold` (default 2.5).
History of length < 2 returns `{anomaly: false}` (insufficient evidence).

**Citation.** Standard parametric outlier detection; see e.g. NIST/SEMATECH
e-Handbook of Statistical Methods §1.3.5.17.

## Pillar 6 — KL drift score

**Formula.** `D_KL(p ‖ q) = Σ p_i · log(p_i / q_i)` with `ε = 1e-12`
smoothing. Sentra uses it to track posture distributional drift over a
sliding window. Asymmetric on purpose — drift "away from a healthy
baseline" is not the same as drift "toward it".

**Citation.** Kullback & Leibler 1951.

## Pillar 7 — Ising-style allocation (simulated annealing)

**Algorithm.** Standard Metropolis–Hastings simulated annealing on a
discrete state space with a configurable energy function and neighbor
proposal. Temperature schedule is geometric from `t0` to `tEnd` over
`steps` iterations. PRNG is a seeded `mulberry32` for reproducibility —
runs are bit-identical across machines.

**Why a deterministic PRNG.** A defensive-allocation result that cannot be
re-derived during incident review is not actionable. Bit-identical replay
is non-negotiable.

**Citation.** Kirkpatrick, S. et al. (1983). "Optimization by simulated
annealing." Science 220, 671–680.

## Pillar 8 — Framework mapping invariant

**Invariant.** Every action class in `ALLOWED_ACTION_CLASSES` MUST map to
at least one entry in each of NIST CSF 2.0, NIST SP 800-61r2, CISA
CIRCIA, and MITRE D3FEND. `frameworkCoverage()` returns
`{complete: true, missing: []}`; CI enforces.

**Why all four.** CSF gives the cross-cutting category; 800-61r2 binds it
to the incident-response lifecycle phase; CIRCIA gives the reporting
posture; D3FEND gives the technique-level mapping. An action that cannot
be placed in all four mappings is, by Sentra's doctrine, not yet a defined
action.

**Citations.**
- NIST CSF 2.0 — NIST CSWP 29, Feb 2024.
- NIST SP 800-61r2 — Computer Security Incident Handling Guide.
- CISA CIRCIA — Cyber Incident Reporting for Critical Infrastructure
  Act of 2022.
- MITRE D3FEND — https://d3fend.mitre.org/

## Pillar 9 — Proof Chain (hash-chained gate evaluations)

**Invariant.** Every gate evaluation appends an entry whose body embeds
the sha256 of the prior entry. `verifyProofChain` returns
`{valid: true | false, brokenAt}`.

**Why this matters.** Non-repudiation. An operator (or an auditor) can
prove what was decided, when, against what asset, with what reasons —
and that the record has not been edited after the fact. Without this,
"audit trail" is a euphemism for "log file we hope nobody changed".

## Composition

1. An asserted action arrives with a target asset.
2. The Safety Gate (Pillar 1) decides ALLOW or BLOCK; offensive classes
   (Pillar 2) throw at the boundary.
3. Risk score (Pillar 3) and financial exposure (Pillar 4) are computed
   and attached to the action record.
4. Posture detectors (Pillars 5, 6) flag anomaly/drift conditions.
5. If allocation across multiple assets is required, the Ising allocator
   (Pillar 7) runs with a reproducible seed.
6. Framework mapping (Pillar 8) is attached to every action record.
7. A Proof Chain entry (Pillar 9) is appended with the full decision
   provenance.

There is no fallback path. Any failure of any pillar produces a
structured BLOCK record, never a silent allow.
