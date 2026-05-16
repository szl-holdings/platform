# §05 — Two shippable fixes

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings

These are the two PRs SZL offers immediately on Andrew's go-ahead. Both
are picked from the gap matrix in §02 (capability axes C2 and C4) and
both rest on code that already exists in production at SZL.

---

## Fix A — Portable, in-bundle, registry-independent attestation manifest

**Target repo:** `defenseunicorns/uds-cli`
**Target license:** AGPL-3.0 recipient; SZL contribution dual-licensed
Apache-2.0 / AGPL-3.0 so the merged artifact stays AGPL-3.0 without
forcing downstream consumers off SZL's Doctrine V6 license allowlist
(`Apache-2.0`, `MIT`, `BSD-3-Clause`, `CC-BY-4.0`).

### Named gap
Per §02 C2: UDS today leans on registry-side signing (Cosign on the OCI
layer). When a UDS bundle is verified inside an airgapped cluster with
no path back to the registry, the operator has the bundle bytes but has
nothing inside the bundle to walk to confirm the chain of custody of
each component beyond the single artifact signature.

### What it ships
A new `--attest` flag on `uds-cli bundle create` that:

1. Walks every `zarf.yaml` referenced in the `uds-bundle.yaml`.
2. For each component, computes the SHA-256 of every emitted
   artifact (images, manifests, charts, files).
3. Emits an **`attestations.jsonl`** sidecar inside the bundle's
   `.tar.zst` payload at a well-known path
   (`/uds-bundle/attestations.jsonl`).
4. Each line is a hash-chained record:

   ```json
   {
     "i": 0,
     "ts": "2026-05-16T08:30:00Z",
     "component": "a11oy",
     "artifact": "ghcr.io/szl-holdings/a11oy:v1.0.0-alpha",
     "sha256": "…",
     "prev_hash": "0000…",
     "this_hash": "…",
     "signer_did": "did:plat:szl-a11oy-prod",
     "sig": { "ed25519": "…", "ml-dsa-65": "…" }
   }
   ```

5. A new `uds-cli bundle verify --offline` subcommand walks the chain
   in-bundle and asserts `prev_hash` linkage + signature validity
   against a bundled trust root, without any registry round-trip.

### Files touched

- `src/cmd/bundle.go` — register `--attest` flag.
- `src/pkg/bundle/create.go` — call new `attest.BuildManifest()` after
  component emit.
- `src/pkg/bundle/verify.go` — new offline-walk path.
- `src/pkg/attest/manifest.go` — **new** (SZL-authored; lifted from
  `tools/a11oy-code/` proof-ledger implementation, ported Go).
- `src/pkg/attest/manifest_test.go` — **new** (golden-file tests for
  chain linkage + signature edge cases).
- `docs/reference/attestations.mdx` — **new** docs page.

### Acceptance criteria

1. `uds-cli bundle create --attest …` produces a `.tar.zst` containing
   `attestations.jsonl` at the well-known path.
2. `uds-cli bundle verify --offline path/to/bundle.tar.zst` exits 0 on a
   valid bundle, non-zero with a structured error on any of:
   broken-chain, bad signature, missing artifact, unknown signer.
3. The new code path adds ≤ 2s overhead on a 10-component bundle on
   reference hardware.
4. CI adds a fixture test that round-trips a bundle through create →
   tamper → verify and asserts the tamper is detected.
5. Zero new third-party Go deps outside the `golang.org/x` and
   `crypto/ed25519` stdlib families, except `cloudflare/circl` for
   ML-DSA-65 (Apache-2.0, on allowlist).

### Draft PR description

```
title: feat(bundle): portable in-bundle attestation manifest (offline-verifiable)

This PR adds a `--attest` flag to `uds-cli bundle create` that writes an
append-only, hash-chained `attestations.jsonl` into the bundle payload,
and a new `uds-cli bundle verify --offline` subcommand that walks the
chain without any registry round-trip. This closes a gap that today
forces UDS verifiers in disconnected environments to trust the
artifact-level Cosign signature alone with no in-bundle chain of
custody.

The implementation is ported from SZL Holdings' a11oy-code proof-ledger
(production since 2025-Q4), adapted to Go, dual-licensed
Apache-2.0 / AGPL-3.0. Signatures are hybrid Ed25519 + ML-DSA-65
(post-quantum), matching SZL's published Doctrine V6 signing posture.

Refs: SZL field gap C2.
```

### Days to PR
**≤ 7 days** from go-ahead.

---

## Fix B — Pepr admission module enforcing Doctrine V6 Λ-floor

**Target repo:** `defenseunicorns/pepr` (examples / capabilities surface)
**Target license:** Apache-2.0 — on SZL's license allowlist. Clean.

### Named gap
Per §02 C4: no major K8s admission stack (Pepr, Kyverno, OPA-Gatekeeper)
today carries a 9-axis conjunctive Λ-floor gate for *agent / model
invocations* — they gate on images and labels, not on the call. UDS
clusters running A11oy-style agentic workloads have no admission-time
defense for an agent invocation that fails moralGrounding or
measurabilityHonesty.

### What it ships
A standalone Pepr `Capability` named `lambda-floor` that:

1. Watches `CustomResourceDefinitions` of kind `AgentInvocation`
   (provided by an accompanying CRD, defined in the module).
2. On `CREATE` / `UPDATE`, reads the invocation's claimed Λ-9 vector
   from the resource spec.
3. Evaluates it against the floors in `doctrine.lambda_conjunctive_floor`
   (0.90), `doctrine.moralGrounding_floor` (0.95), and
   `doctrine.measurabilityHonesty_floor` (0.95) — values bundled into
   the capability at build time from `packages/payload/raw/payload.json`.
4. On any axis failure, returns an admission denial with reason
   `MATURITY_GATE_BLOCKED` (mirroring Sentra's existing pattern, see
   §03.5) and emits a structured audit event to the proof-ledger
   sidecar from Plane 3 / Fix A.

### Files touched

- `examples/lambda-floor/package.json` — **new**.
- `examples/lambda-floor/capabilities/lambda-floor.ts` — **new** (the
  Pepr capability — ports the gate evaluator from A11oy's TS runtime).
- `examples/lambda-floor/crd/agent-invocation.yaml` — **new** (CRD).
- `examples/lambda-floor/tests/lambda-floor.test.ts` — **new**
  (admission allow / deny truth-table).
- `examples/lambda-floor/README.md` — **new** (includes a worked
  example: a deliberate moralGrounding = 0.92 invocation that gets
  denied with `MATURITY_GATE_BLOCKED`).

### Acceptance criteria

1. An `AgentInvocation` resource with all 9 axes ≥ 0.90,
   `moralGrounding ≥ 0.95`, `measurabilityHonesty ≥ 0.95` is admitted.
2. Any axis below the matching floor → admission denied, reason exactly
   `MATURITY_GATE_BLOCKED`, with the failing axis name + value in the
   error body.
3. The capability ships with the SZL OPA test pack
   (`platform/agent-gateway/tests/gateway-opa-live.test.ts`) as a
   proof-of-work that the same policy logic also runs under real OPA —
   port the test to use Pepr's in-cluster test runner.
4. The capability adds ≤ 50ms p95 admission latency on a reference
   t3.medium control plane.
5. No new runtime deps outside the Pepr SDK and `@noble/curves` (MIT,
   on allowlist).

### Draft PR description

```
title: feat(examples): lambda-floor Pepr capability (9-axis Λ admission gate)

This PR adds a new example Pepr capability `lambda-floor` that gates
admission of `AgentInvocation` CRs on a 9-axis conjunctive Λ-floor
(Λ_conj ≥ 0.90, moralGrounding ≥ 0.95, measurabilityHonesty ≥ 0.95).
On any axis failure, the capability denies the request with reason
`MATURITY_GATE_BLOCKED`, mirroring the existing SZL Sentra pattern.

The gate evaluator is ported from SZL Holdings' a11oy runtime
(production since 2025-Q4) and is accompanied by the existing SZL OPA
gateway test pack as a cross-implementation proof-of-work.

Refs: SZL field gap C4.
```

### Days to PR
**≤ 10 days** from go-ahead.

---

## Why these two, not others

C2 and C4 are the two cells where SZL has (a) production code already
on disk, (b) clean license fit, and (c) a small, reviewable surface
(<2k LOC each). The next-most-shippable candidate is C8 (recalibration
memo) but it requires a `uds-cli` subcommand which is a larger review
surface — keeping it as Plane 5 of §04, not as a fix.
