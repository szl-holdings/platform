# Threat Model — Ouroboros Unified Runtime

**Version:** 0.1
**Scope:** `@workspace/horizon` + `@workspace/resonance` + the witness-root anchor.
**Audience:** security reviewers, regulated-vertical buyers, integrators.

This document states who we defend against, what we assume, and what is explicitly out of scope. Numbers below are starting positions, not guarantees.

## Adversary classes

### A1 — External attacker, no credentials
Standard internet attacker. Can send crafted inputs to any LLM endpoint that uses Ouroboros, can read public endpoints, cannot read secrets, cannot write to the witness chain.
**Defense:** the no-cloning gate prevents secrets from appearing in two endpoints; the page-curve monitor catches anomalous release rates; the Hawking-rate limiter caps burst exfiltration.

### A2 — Compromised LLM provider
The model provider (OpenAI, Anthropic, Perplexity, self-hosted) returns adversarial completions designed to leak training data or insert covert channels into output.
**Defense:** dual-witness chain (internal + external) catches divergence; the holographic surface budget caps output bits per window; the Q-factor history detects sustained energy/work mismatch.

### A3 — Insider with read access to the witness ledger
Internal employee who can read but not write the chain.
**Defense:** witness chains do not store plaintext secrets, only hashes and metadata. Read access alone leaks pattern of use, not content.

### A4 — Insider with write access to the witness ledger
Internal employee who can rewrite both the internal and external chain and recompute hashes.
**Defense:** the signed witness-root anchor (Rekor, internal transparency log, or HSM-signed root) is the only mitigation. Without it, A4 is a hard break. **This is why the anchor is not optional in production.**

### A5 — Network MITM between integrator and witness anchor
Attacker on the network between the runtime and the external transparency log.
**Defense:** TLS pinning to the anchor endpoint, certificate transparency for the anchor itself, and out-of-band root-hash publication (e.g., daily root posted to a separate channel).

### A6 — Prompt injection targeting the witness emitter itself
Adversary crafts input that, when processed by the runtime, causes the runtime to emit witness entries that lie about what was released.
**Defense:** witness emission is structurally separated from model output. The emitter sees the raw bytes that crossed the boundary, not the model's interpretation of them. This must be enforced at the adapter layer — it is the single most important integration rule.

### A7 — Side-channel timing or resource attack
Adversary measures latency, memory, or CPU patterns to infer secret content.
**Defense:** out of scope for v0.1. Documented here so it is not assumed-defeated.

### A8 — Quantum adversary
Adversary with a cryptographically relevant quantum computer.
**Defense:** out of scope for v0.1. SHA-256 is grover-vulnerable but currently survives. Post-quantum migration plan is roadmap, not shipped.

## Assumptions

- The host process is not compromised at boot (no root-kit, no kernel-level adversary).
- The clock is approximately monotonic; small skew is tolerated by the cadence-match tolerance δ.
- The integrator does not log raw secrets to disk outside the witness chain.
- The Sigstore Rekor instance (or chosen transparency log) is operated honestly. If the integrator does not trust Rekor, they can run an internal log instead — this is supported.

## Out of scope

- Physical attacks on the host hardware.
- Supply-chain attacks on Node.js, npm, or the underlying OS. (Mitigated by lockfile + audit, not eliminated.)
- Attacks against the regulator who reads the audit logs.
- Social-engineering attacks against the integrator's team.

## What is provable today

- Cleanliness Theorem (v3 Theorem 1): every released bit is reproducible from a witness root.
- Resonance Handoff Theorem (v3 Theorem 2): handoffs above the Landauer ceiling are rejected.
- Page-curve closure: enforced and tested (62/62 in `@workspace/horizon`).
- Kuramoto coherence floor: enforced and tested (52/52 in `@workspace/resonance`).

## What is not yet provable

- Formal verification of the two theorems. v3.1 roadmap.
- Quantum-resistant anchoring. v4 roadmap.
- Side-channel hardening. Out of scope for v3.

## Reporting a vulnerability

Email security@szl-holdings.example with PGP-encrypted detail. We will respond within 72 hours and credit reporters in the changelog unless asked otherwise.
