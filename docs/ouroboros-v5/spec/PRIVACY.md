# Privacy & Data Handling — Ouroboros Unified Runtime

**Version:** 0.1
**Applies to:** any deployment of `@workspace/horizon`, `@workspace/resonance`, or the witness anchor.
**Audience:** integrators, DPOs, compliance reviewers.

This document states what personal data the runtime touches, how it is handled, and how it interacts with GDPR, CCPA, HIPAA, and SOC2.

## What the runtime sees

The runtime sits at the boundary between an LLM provider and an integrator's application. By design, it sees:

- Input bytes crossing the boundary (prompts, tool calls, retrieved documents).
- Output bytes crossing the boundary (completions, tool results, streamed tokens).
- Metadata: timestamps, byte counts, request IDs, model version, latency.
- Witness entries: hashes of the above plus chain pointers.

The runtime does **not** see, by design:

- Long-term storage of plaintext prompts or completions.
- User database records outside what flows through the boundary.
- Authentication tokens (these are stripped before witness emission).

## What is hashed vs. stored

| Field | Stored plaintext | Hashed only | Discarded |
|---|---|---|---|
| Prompt content | only if integrator opts in | default | — |
| Completion content | only if integrator opts in | default | — |
| User identifiers | never plaintext in chain | always hashed with salt | — |
| Auth tokens | never | never | always |
| Timestamps | yes | — | — |
| Byte counts | yes | — | — |
| Model version | yes | — | — |
| Witness chain pointers | yes | — | — |

**Default mode is hash-only.** Integrators must explicitly opt in to plaintext storage, and that opt-in is itself logged in the witness chain.

## GDPR posture

- **Lawful basis:** the runtime processes data on behalf of the integrator, under their lawful basis. The runtime is a processor, not a controller.
- **Right to access:** supported. The integrator can produce a per-user transcript from the witness chain plus their own application storage.
- **Right to deletion:** supported with a caveat. The plaintext (if stored) is deletable. The hash chain is append-only and tamper-evident; entries cannot be removed without breaking the chain. The integrator-facing answer is: deletion redacts plaintext, retains hash. This is the same posture as Sigstore and most transparency-log systems and is generally accepted under GDPR Article 17(3)(b) for legal-obligation retention.
- **Right to portability:** supported. Witness chain entries can be exported as JSON.
- **No-cloning interaction:** the no-cloning gate prevents the same secret from existing in two endpoints. This is a privacy *strengthener*, not a portability blocker; portability operates on the integrator's plaintext, not on secrets the runtime never held.

## CCPA posture

- The runtime does not sell personal information.
- The runtime supports do-not-sell signals at the adapter layer.
- "Right to know" maps to the GDPR right-to-access flow above.

## HIPAA posture

- The runtime is PHI-aware: any field marked `phi: true` at the adapter is hashed-only by default and excluded from non-essential metadata emission.
- Air-gapped deployment mode supports HIPAA covered entities who cannot phone home to Sigstore Rekor. Use the internal transparency log mode.
- A BAA is required between the integrator and any external anchor service. We do not sign BAAs directly because the runtime is shipped as software, not as a service.

## SOC2 posture

- Audit logging: the witness chain itself is the audit log.
- Change management: enforced via signed releases (cosign) and CHANGELOG.md.
- Access control: out of scope for the runtime; integrator's responsibility.
- Encryption at rest: integrator-configurable; the runtime does not mandate disk encryption but documents the requirement.

## ISO 27001 posture

The runtime supports clauses A.8 (asset management), A.12 (operations security), A.14 (system development) by providing tamper-evident logs and a published threat model. Integrator is responsible for the full ISMS.

## Retention defaults

- Witness chain: retained for the integrator's stated retention period; chain integrity is preserved indefinitely if the chain is preserved.
- Plaintext (when opted in): default 30 days, configurable.
- Hashed metadata: default 13 months, configurable, aligned to common audit cycles.

## Air-gapped mode

For deployments that cannot phone home:

- Replace Sigstore Rekor with an internal Merkle tree.
- Publish daily root hash to an internal HSM-signed log.
- Optionally cross-anchor weekly to a public chain via a one-way diode.

This mode is supported in the Rekor anchor module via the `LOCAL` driver.

## What this document is not

- Not legal advice. Talk to your privacy counsel before deployment.
- Not a certification. Certifications attach to deployments, not to libraries.
- Not a guarantee. It is a stated posture, reviewable against the source.
