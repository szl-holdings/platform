# PLATFORM-1062-LUTAR-CLOSURE-20261116

## Plan
Correct v1/v2 bound endpoints, bind numeric exponents to their rational term evidence, remove unsupported uniqueness claims, and classify v10 missing evidence independently of its weighted score. Scope: invariant package source/tests and this proof record. No UI or route-registration changes.

## Baseline
Head `34d14bfd74f32cd15a23777ff3e643cb640e5ab4` passed native Tests [43953667875](https://github.com/szl-holdings/platform/actions/runs/43953667875), CI/typecheck [43953667928](https://github.com/szl-holdings/platform/actions/runs/43953667928), build [43953667902](https://github.com/szl-holdings/platform/actions/runs/43953667902), reproducibility [43953668122](https://github.com/szl-holdings/platform/actions/runs/43953668122), runtime audit [43953668057](https://github.com/szl-holdings/platform/actions/runs/43953668057), CodeQL, dependency/security and E2E checks before this follow-up.

## Patch
- Reports expose `min(axes) <= Lambda <= max(axes)`.
- A numeric weight must equal the reconstruction of its nonempty, distinct, positive safe-integer denominators, be finite and strictly between zero and one. A term sum alone cannot justify a different executed exponent.
- v10 missing cells produce OPEN, including when all layer weights are zero or a deficit is hidden by floating-point rounding.
- A complete zero-sum matrix returns INDETERMINATE and null rho.
- An overflowing sum is rejected before a NaN/Infinity result can reach JSON.
- Source comments state the positive-each-layer hypothesis for the closure identity and preserve Lambda uniqueness as Conjecture 1. The supplied artefact flags remain caller assertions, not verified external evidence.

## Local verification
On Node 24.19.0, Desktop Commander ran actual source modules with Node type stripping:
- Exhaustive two-row artifact masks: 36,864 matrices over weights {0,1,2}; exit 0.
- Eight boundary cases: zero/subnormal/near-one deficits, overflow, invalid values, empty matrix; exit 0.
- Seventeen rational-weight evidence cases including altered exponents, malformed denominators, and a valid asymmetric witness; exit 0.
- The same cases are retained as Vitest regressions under `packages/ouroboros-invariant/test/`.
- `git diff --check`: exit 0.

No provider or deployment was exercised. Full native checks on the follow-up commit are separate and are recorded on PR #1062; baseline results above are not claimed for new bytes.

## Public claim and security review
This is source and synthetic contract validation. It does not prove deployment readiness, physical trust measurements, evidence authenticity, or uniqueness. The locked formula set remains unchanged. No secret, private key, environment value, gate weakening, visibility or archive change is included. Screenshots are not applicable because no UI changed.
