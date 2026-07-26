# Frontier vertical conformance proof

**Verified:** 2026-07-25

## Implemented

- dependency-free Ed25519 DSSE offline verifier and CLI;
- cross-surface Khipu parent-hash validation;
- deployed endpoint and exact Git SHA checks;
- receipted DENY requirement;
- fresh reported OpenTelemetry GenAI/MCP span-structure check;
- README evidence-label and canonical-truth check; and
- canonical artifact-manifest and candidate-disposition check.

## Verification boundary

The local reference fixture passes all seven gates with real Ed25519 signatures,
a tamper-negative check, an actual HTTP server, a fresh commit-bound
cross-boundary parent link, a DENY receipt, and a fresh GenAI span structure.
The OTel gate validates reported trace structure; it does not prove collector
export or backend ingestion.

The three requested live targets do **not** pass. Sentra and Vessels are marked
superseded in their retained artifact trees; insurance is not registered; the
required live URLs, deployed SHAs, and pinned public keys were not available.
Therefore:

- current public conformance: **0/3 verified**;
- organization badge: **not authorized**; and
- repository visibility automation: **not executed**.

## Verification results

| Check | Result |
| --- | --- |
| Conformance and verifier tests | **15/15 passed** |
| Biome check | **Passed with no warnings** |
| Source-of-truth validator | **69/69 passed** |
| Sentra live-surface conformance | **1/7 failed closed** |
| Vessels live-surface conformance | **1/7 failed closed** |
| Insurance live-surface conformance | **0/7 failed closed** |

The one passing check for Sentra and Vessels is the README evidence label. It
does not qualify either surface as a candidate or authorize a badge, deployment
claim, or repository visibility change.
