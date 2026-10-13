# Packet 6 vertical-cell source of truth

## Status

This directory is repository source for a modeled, local vertical-cell factory.
It is not a deployment record or runtime witness.

## Precedence

When records disagree, use this order:

1. The current authorized task scope and repository doctrine.
2. `registries/formula_aliases.json` for the admitted short formula scopes and
   their exact canonical vertical IDs.
3. `registries/formula_bindings.json` for the ten normalized formula contracts;
   `registries/formula_bindings.sha256` records the exact checked-in byte digest
   for one-sided local drift detection. It is not a signature or trust root.
4. `manifests/*.json` for the seven admitted vertical-cell definitions.
5. `schemas/*.json` for portable record shape and field constraints.
6. `szl_factory/validation.py` for cross-record semantic admission rules that
   JSON Schema alone cannot express.
7. `szl_factory/compiler.py` for canonical serialization, generated contracts,
   build manifests, and Tree Digest v1.

## Upstream provenance

The normalized records were derived locally from the user-supplied
`szl_estate_vertical_factory_profile_v6.json` attachment (raw SHA-256
`b213860bb1d44f8eb818d7e43c5d330d16dd27624988741e5b39889bcc66fd8e`), whose
stable `captured_at` is `2026-08-28T23:59:00-04:00`. The attachment is not
checked into this public repository. The attached Packet 6 prose and
schemas are design inputs, not authority to mutate GitHub, Hugging Face, DNS,
secrets, settings, workflows, or any provider.

The canonical admitted vertical IDs are:

- `aegis-assurance`
- `counsel-assurance`
- `insurance-assurance`
- `killinchu`
- `lyte-services`
- `terra-assurance`
- `vessels-assurance`

The exact short formula scopes are `aegis`, `counsel`, `insurance`, `killinchu`,
`lyte`, `terra`, and `vessels`; `all` is the only global scope. A new alias or
vertical is rejected until this registry and the semantic validator are changed
deliberately and reviewed together.

## Authority boundary

Every normalized formula has `grants_authority=false`. Formula results may be
modeled as bounded advisory signals only. Human and policy authority remains
explicit, and compiled routes expose no external effector.

`LOCKED-PROVEN` is an inherited formula classification, not a new proof claim.
It is admitted exactly for F1, F4, F7, F11, F12, F18, F19, and F22: no ninth
formula, omission, or demotion is admitted. Lambda uniqueness remains open
Conjecture 1; Khipu BFT safety remains open Conjecture 2.

## Evidence states

- `MODELED`: checked-in source, generated local contracts, and synthetic plans.
- `MEASURED`: a named local harness was actually run against exact local bytes;
  its result applies only to that harness and those bytes.
- `DECLARED`: source or runtime identities supplied by a caller, not verified
  through a separate trust root.
- `BLOCKED`, `UNKNOWN`, and `UNAVAILABLE` remain explicit when a required gate,
  observation, or authority is missing.

Passing local tests may support `MEASURED` local harness results; they must never be converted
into a deployment, publication, or operational-runtime claim.

A pushed branch, hosted CI, review, merge, deployment, provider readback,
production readiness, and independent witness are distinct lifecycle stages,
not interchangeable evidence classes.

The v2 release records are caller declarations. The local validator has no
receipt bytes, authorized signer trust store, independent witness channel,
external signed checkpoint, transparency log, or WORM ledger. It therefore
passes only valid `SOURCE_ONLY` structure and always blocks operational claims.
The local SQLite hash chain detects internally inconsistent history and missing
append guards, but cannot prove completeness against a writer who controls and
rebases the database.

The v2 decision receipts served by the local runtime are bounded records in that
same SQLite trust domain. They are deterministically tied to an exact recorded
decision and checked-in source-manifest digest, remain non-executing, and label
caller-declared human identity as unverified. They are not the signed external
release receipts required to advance an operational release state.
