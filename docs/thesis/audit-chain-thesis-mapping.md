# Audit-Chain ↔ Ouroboros Thesis Mapping

This document maps the hybrid-signed audit chain (Task #4263) to the Ouroboros Thesis primitives
so future agents can keep the implementation thesis-grounded.

## Primitive mapping

| Thesis primitive (v3/v4) | Audit-chain implementation |
| ------------------------ | -------------------------- |
| **Witness-root anchor** (#5) | `audit_chain_events.prevHash` SHA-256 Merkle chain; `computeEventHash` in `routes/audit-chain.ts`. |
| **No-cloning gate** (#3) | Per-credential DID minted by `ensureMachineCredentialDid` in `lib/platform-did-registry.ts` — a key cannot live in two credentials. |
| **Three-witness Jaccard / Frustum reconciliation** (Theorem 3) | Hybrid signature pair (Ed25519 + ML-DSA-65) plus the chain hash form three independent witnesses. `verifyAuditRow` rejects a row if any single witness disagrees. |
| **Cleanliness Theorem** (Theorem 1) | "Every released bit reproducible from a witness root" — exactly the `verifyAuditRow` semantics: `recomputed === ev.eventHash` AND signature pair valid AND registry cross-check passes. |
| **Egyptian inspectability axiom** | `buildCanonicalPayload` produces a deterministic JSON byte sequence; the Λ weight set is `{1/4, 1/4, 1/4, 1/4}` — finite sums of distinct unit fractions per RMP 2/n discipline. |
| **Trithemius primitives 53–56** (polygraphic redundancy, key separation) | Hybrid signing across two algorithm families + KEK custody (`lib/key-custody.ts`) + per-credential DIDs. Compromise of one algorithm does not compromise the chain. |
| **Receipt-discipline pattern** | Every signed audit row IS a receipt: `signingDid + ed25519Sig + mldsa65Sig + schemeVersion + keyId`. Exposed via `GET /audit-chain/verify`. |
| **`evidence_provenance` + `locator_required` + `no_unbound_claims`** validators (runtime contract v4) | A signed row's `signingDid` IS the locator. `verifyAuditRow` rejects rows missing signing metadata as `broken:signature_missing_metadata`. |

## Λ-receipt computation (`computeLambdaReceipt`)

Each `verifyAuditRow` result now includes a four-axis Λ receipt:

```
Λ = (C · H · R · F)^(1/4)
```

| Axis | Meaning | Computed from |
| ---- | ------- | ------------- |
| **C — Cleanliness** | Provenance integrity | `1` if `hybrid_verified`, `0.5` if `legacy_unsigned`, `0` if `broken`. |
| **H — Horizon** | No silent leakage / metadata leak | `1` if signing metadata is fully present (or row is legitimate legacy), `0` otherwise. |
| **R — Resonance** | Q-factor proxy across the 2-witness pair | `mean(ed25519Valid, mldsa65Valid)`; `0.5` for legacy_unsigned. |
| **F — Reconciliation** | Three-witness Jaccard agreement | `1` if `registryCrossCheck = passed`, `0.5` if skipped (registry unavailable / pre-migration), `0` if failed. |

**Zero-pinning axiom is enforced**: if any axis is 0, Λ collapses to 0 (no fractional credit for a
row with a tampered/invalid component).

**Aggregate**: `GET /audit-chain/verify` returns `lambdaReceipt.meanLambda` — the arithmetic mean
of per-row Λ across all sampled rows. This is the chain-level trust scalar in [0, 1].

## What stays out of scope

- The audit chain implements the **four-axis** form (v3). The full nine-axis Λ_9 (v4) and the
  v5+ formula family (Lutar v2–v5 with prisca/Noether terms) live in `packages/ouroboros-invariant/`
  and are evaluated at runtime against operational signal feeds — not against individual audit
  rows. The audit chain does not (yet) emit Λ_9; it emits Λ_4 because only four axes are
  measurable from a single signed row.
- The federation layer (v5 §2 — Kuramoto over runtime Λ values across independent operators) is
  out of scope for Task #4263. It is tracked as v5.1 in `docs/thesis/v5-forward.md`.
- DID-bound caller-presented assertion proof-of-possession (reviewer's outstanding demand for
  M2M auth) is tracked as follow-up #4793.

## Operator surfaces

- **`artifacts/sentra/src/pages/audit-chain.tsx`** — renders the Λ-receipt badge alongside the
  existing hybrid-signature status badge (`ACCENT = LANE_ACCENT_HEX.aegis.primary`, so this page
  is the aegis-lane operator surface).
- There is no separate `aegis` artifact in this monorepo. The aegis lane is rendered by sentra.

## Related files

- `artifacts/api-server/src/lib/audit-chain-signer.ts` — `LambdaReceipt`, `computeLambdaReceipt`,
  `verifyAuditRow`.
- `artifacts/api-server/src/routes/audit-chain.ts` — `/audit-chain/verify` aggregate Λ.
- `artifacts/api-server/src/__tests__/audit-chain-signer.test.ts` — Λ-receipt unit coverage.
- `artifacts/api-server/src/__tests__/audit-chain-verify-route.test.ts` — Λ-receipt integration coverage.
- `docs/thesis/v5-forward.md` — V5 forward roadmap (just ingested).
- `attached_assets/THESIS_INDEX.md` — attached PDFs ↔ canonical repo cross-reference.
