# Vessels.UDS — Architecture (v0.1.0)

Vessels.UDS ships the maritime-intelligence kernel as a pure-ESM Node module
with **zero runtime dependencies outside `node:*` standard library**. Every
primitive is implemented in `lib/index.mjs` from a cited primary source so
the bundle can be audited end-to-end without trusting any transitive package.

## Primitives

| # | Primitive                       | Source / convention                                              |
|---|--------------------------------|------------------------------------------------------------------|
| 1 | `haversineNm`                   | Sinnott — *Sky & Telescope* 68, 159 (1984); R̄ = 3440.065 nm     |
| 2 | `closestPointOfApproach`        | Bowditch — *American Practical Navigator*, Vol II, §35           |
| 3 | `inCollisionCone`               | COLREGS Rule 7 risk-of-collision under constant-velocity         |
| 4 | `aisGapLambda`                  | Doctrine V6 Λ-floor 0.90 (HUKLLA), gap × draw × context score    |
| 5 | `sanctionsScreen`               | OFAC SDN + EU Consolidated + UK OFSI + UN 1718 list shape        |
| 6 | `appendReceipt` / `verifyChain` | sha256 hash-chain (mirrors Amaru receipt shape for one verifier) |

## Doctrine V6 anchor

`aisGapLambda` returns a `lambda` in `[0, 1]`. The bundle declares
`LAMBDA_FLOOR = 0.90`. Any score ≥ floor is **HALT-eligible** under the
HUKLLA gate — operations must pause for a documented human override
before sync resumes. This matches the Λ-floor used in Amaru.UDS so the
two products share a single risk-gate verdict surface.

## Determinism guarantees

* Manifest entries are sorted lexicographically (POSIX `/` separators).
* `sha256` over raw file bytes; build-time fields (`version`, `git_sha`,
  `build_ts`) are recorded in the manifest **header** so payload hashes
  remain reproducible across rebuilds.
* Receipt chain commits to a canonical JSON encoding via
  `sha256Hex(JSON.stringify(payload))` with object keys in insertion
  order matching `lib/index.mjs`.

## Non-goals

* **No live AIS ingestion.** Vessels.UDS ships the inference primitives;
  the operator provides the AIS / RF / SAR feed.
* **No transitive JS deps.** Anything beyond `node:crypto`, `node:fs`,
  `node:path`, `node:url` is a build-script footgun and must not enter
  `lib/`.
* **No browser bundle.** The web surface lives in `artifacts/vessels/`;
  this bundle is the headless kernel.
