# ROSIE.UDS — Architecture

ROSIE is the governed-decision-fabric kernel. Every action the platform takes
flows through five invariants implemented in `lib/index.mjs`:

1. **Policy admission gate** — deny-by-default. An event with no matching
   `{subject, action}` policy is rejected with reason
   `ROSIE_NO_POLICY_MATCH: deny-by-default`.
2. **Contradiction detector** — a policy set containing both an `allow` and a
   `deny` for the same `{subject, action}` is rejected at load time.
3. **Governed action emit** — every decision is wrapped with a witness
   `{policy_id, reason, matched}` so an auditor can replay the WHY.
4. **Hash-chained decision receipts** — each receipt commits to the previous
   receipt's sha256, so any in-flight tampering breaks the chain. Verified by
   `verifyChain({head, links})`.
5. **Coverage witness** — given a stream of events, returns the set of
   `{subject, action}` pairs that fell through to deny-by-default. Operators
   that want strict coverage reject any non-empty uncovered list.

The kernel has **zero runtime dependencies**. It is pure ESM and runs on any
Node ≥ 18.

## Doctrine

ROSIE's posture: *if the system cannot prove a decision is allowed, it
denies and emits a witness*. The witness is mandatory — there is no path
through `emit()` that produces a decision without one.
