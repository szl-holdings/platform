# Frontier F2.2 MCP Governor — Proof Packet

Generated: 2026-07-25

## Context

The Frontier payload recommended a model-independent MCP governance package
with capability tokens, a policy check, and signed receipts before and after
side effects. Inspection also found that the existing PRAXIS MCP wrapper
converted Guardian evaluator exceptions into allow decisions.

## Plan

1. Define one canonical governed-action envelope.
2. Scope capability tokens to actor, tenant, tool, risk, time, and one-use ID.
3. Fail closed on missing, invalid, expired, over-risk, or replayed authority.
4. Persist a signed receipt before any side effect and another after it.
5. Make read-only mutation claims structurally invalid.
6. Repair every existing MCP policy-evaluator catch path.

## Patch

- Added the publication-ready workspace package `@szl/mcp-governor`.
- Added Ed25519 capability signing and verification without a model-provider
  dependency.
- Added a replaceable replay-store contract with an expiry-bounded in-memory prototype default.
- Added signed `before`, `after`, and `blocked` receipts containing digests
  rather than raw tool arguments or results.
- Added fail-closed policy evaluation and explicit post-receipt failure
  signaling.
- Changed PRAXIS typed tools, raw tools, and sampling to block when Guardian
  evaluation throws or returns a malformed decision.
- Ensured sampling policy runs even when no system prompt is supplied.

## Test

The focused suites cover token verification and expiry, policy exceptions,
missing authority, receipt ordering and signatures, replay expiry, risk scope,
special-key argument binding, void-result receipts, read-only invariants, and
receipt-store failure before an effect.

- `@szl/mcp-governor`: 14/14 focused tests passed.
- `@workspace/nexus-mcp`: 3/3 fail-closed policy tests passed.
- Both packages passed strict TypeScript checks.
- The repository source-of-truth validator passed all 64 checks after the
  canonical package count moved from 210 to 211.

## Screenshot

Not applicable. This is a runtime governance contract with no user-interface
change.

## Verify

External npm publication is not claimed. The package is ready for normal
registry review and publication, but no registry credential was used in this
workcell. The package build and dry-run archive are verified locally.

## Proof

The side-effect order is enforced as:

`verified capability -> allow policy -> signed before receipt -> effect ->
signed after receipt -> return result`

Any failure before the effect blocks execution. A failure to persist the
post-effect receipt is surfaced as `GovernancePostReceiptError` with
`effectOccurred = true`; it is never reported as a clean success.
