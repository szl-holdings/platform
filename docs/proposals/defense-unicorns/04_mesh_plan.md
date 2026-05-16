# §04 — Mesh plan (UDS ↔ SZL)

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Skeletons:** `./skeletons/`
**Ownership convention:** Each plane has a clear "SZL ships X / UDS adopts Y"
boundary. Nothing in this plan forces UDS to absorb SZL doctrine — every
plane is opt-in for downstream UDS adopters.

---

## Plane 1 — Bundle (A11oy / Sentra / Amaru as Zarf packages + a UDS bundle)

**SZL ships:** three Zarf packages and a top-level UDS bundle.
**UDS adopts:** nothing — the bundle is consumable by any `uds-cli`-capable
operator unchanged.

Skeletons (committed under `./skeletons/`):

- `skeletons/zarf.yaml` — A11oy package (single-component example, with
  proof-ledger sidecar mount).
- `skeletons/uds-bundle.yaml` — top-level bundle composing the three
  apps + an `a11oy-attestations` sidecar component.

If this plane fits, **SZL cuts a draft PR to `szl-holdings/a11oy` adding
`deploy/zarf.yaml` within 5 days**, then opens an `uds-bundle.yaml`
example PR in a new repo `szl-holdings/uds-mesh` (or contributes the
example to `defenseunicorns/uds-package` if that repo is revived).

## Plane 2 — Policy (OPA gateway test pack as a Pepr / OPA-Gatekeeper module)

**SZL ships:** the OPA test pack at
`platform/agent-gateway/tests/gateway-opa-live.test.ts` + pinned
installer at `platform/agent-gateway/scripts/install-opa.sh`, repackaged
as either:

- a Pepr `Capability` (TypeScript) consumable by `uds-core`, or
- an OPA-Gatekeeper `ConstraintTemplate` + `Constraint` pair for
  cluster operators who prefer Gatekeeper.

**UDS adopts:** the Pepr capability as an opt-in module loaded by
operators via their existing `uds-core` Pepr capability list.

If this plane fits, **SZL cuts a draft PR to `defenseunicorns/pepr`'s
examples directory within 7 days** (Apache-2.0, on SZL's license
allowlist — see §01).

## Plane 3 — Proof ledger (a11oy proof.jsonl as a SLSA-aligned attestation source)

**SZL ships:** the existing append-only ledger at
`~/.a11oy-code/proof.jsonl` (hash-chained SHA-256) wrapped behind a
small HTTP read API (`GET /api/a11oy/proof/{since}`) plus a SLSA v1.0
predicate adapter that translates proof entries into `in-toto`
statements signed by the SZL DID `did:plat:szl-a11oy-prod`.

**UDS adopts:** a single `cosign verify-attestation` profile that points
at the proof endpoint as an extra verifier in the existing UDS bundle
verification flow.

Mirror target for the ledger: the same Postgres table family as
`helios_recalibration_memos` (see
`artifacts/api-server/src/routes/helios/index.ts` line 312–337) so
ledger durability rides on existing SZL persistence — no new infra.

If this plane fits, **SZL cuts a draft PR to `defenseunicorns/uds-core`
adding the verifier profile to `docs/reference/verification.md` within
10 days**.

## Plane 4 — Doctrine gate (Λ-floor + 9-axis AND as a CI gate)

**SZL ships:** a reusable GitHub Actions composite (`szl-holdings/doctrine-gate`)
that:

1. Reads the candidate build's `provenance.json` + agent invocation
   manifest.
2. Computes the 9-axis Λ vector against the floors in
   `packages/payload/raw/payload.json` → `doctrine` (Λ ≥ 0.90,
   moralGrounding ≥ 0.95, measurabilityHonesty ≥ 0.95).
3. Returns `MATURITY_GATE_BLOCKED` (mirroring Sentra's existing pattern)
   on any axis failure — non-zero exit, build fails.

**UDS adopts:** the action as an optional job in the `uds-core` CI
matrix; downstream UDS adopters can wire it into their own bundle build
pipelines without any change to `uds-cli` itself.

If this plane fits, **SZL publishes the action under
`szl-holdings/doctrine-gate@v1` within 10 days** and submits an example
job to a `defenseunicorns/uds-core` docs page.

## Plane 5 — Recalibration memo (weekly fleet "what-changed" feed)

**SZL ships:** the existing memo pipeline at
`POST /api/helios/memos/generate` (see
`artifacts/api-server/src/routes/helios/index.ts` line 407+) restructured
to read from a UDS operator's installed bundle inventory (`uds-cli
bundle inspect` output) and produce a weekly memo with:

- **Audit** — what signals changed in the last 7 days that affect any
  installed bundle.
- **Blueprint** — recommended capability moves (priority-ordered).
- **Roadmap** — week-by-week sequenced actions.

**UDS adopts:** an optional `uds-cli memos pull` subcommand that hits
the SZL memo endpoint with the cluster's bundle inventory and writes
the rendered memo to a local file. Memos are persisted server-side in
`helios_recalibration_memos` (already shipping in this monorepo).

If this plane fits, **SZL extends the existing memo route to accept a
bundle-inventory POST within 14 days**, and contributes the
`uds-cli memos` subcommand as a follow-up PR to `defenseunicorns/uds-cli`.

## Ownership summary

| Plane | SZL ships                              | UDS adopts                                          | Days to PR |
| ----- | -------------------------------------- | --------------------------------------------------- | ---------- |
| 1     | Three Zarf packages + UDS bundle YAML  | Nothing (consumable as-is)                          | 5          |
| 2     | Pepr capability + OPA-Gatekeeper pair  | The Pepr capability as opt-in `uds-core` module     | 7          |
| 3     | Proof-ledger HTTP read + SLSA adapter  | `cosign verify-attestation` verifier profile        | 10         |
| 4     | `szl-holdings/doctrine-gate` action    | Optional CI job in `uds-core` docs                  | 10         |
| 5     | Memo pipeline + bundle-inventory route | Optional `uds-cli memos pull` subcommand            | 14         |

All five planes are independent. Andrew can green-light any subset.
