# Vertical conformance suite

**Status: HARNESS IMPLEMENTED / 0 OF 3 TARGET SURFACES VERIFIED**

Run:

```bash
pnpm conformance --surface sentra
pnpm conformance --surface vessels
pnpm conformance --surface insurance
```

The command exits 0 only when all seven gates pass. It exits 1 for a
non-conformant surface and 2 for invalid command usage. The runner never changes
repository visibility.

## Seven gates

1. A sequence of fresh, unique, commit-bound DSSE envelopes forms a valid Khipu
   parent-hash chain rooted at `a11oy`, terminating at the target, with an
   adjacent `a11oy -> target` boundary.
2. `/healthz`, `/version`, and `/evidence` return HTTP 200, and `/version.gitSha`
   equals the expected deployed commit.
3. The evidence set references a receipt whose decision is exactly `DENY`.
4. At least one fresh reported OpenTelemetry GenAI or MCP
   semantic-convention span structure includes valid trace and span IDs plus
   timestamps; deprecated `gen_ai.system` does not qualify. This proves the
   evidence payload has the expected reported structure. It does **not** prove
   collector export, backend ingestion, or end-to-end trace availability.
5. Every receipt verifies offline against a fingerprint-pinned Ed25519 or
   ECDSA P-256 key, and a tampered receipt fails.
6. The README declares LIVE, MODELED, or PLANNED above the fold and cites
   `SOURCE_OF_TRUTH.md`.
7. The artifact manifest is present, counted by the canonical registry, and the
   conformance manifest disposition is `CANDIDATE`.

## Required deployment inputs

Each surface manifest names four environment variables:

- deployed base URL;
- expected Git SHA;
- Ed25519 or ECDSA P-256 public key PEM; and
- SHA-256 fingerprint of that public key.

The public key is not secret. The separate fingerprint is a trust anchor that
prevents a self-signed replacement key from passing conformance.

The runner accepts HTTPS deployment origins only. Plain HTTP is limited to
loopback testing. Credentials, paths, query strings, fragments, private
addresses, link-local addresses, and hostnames that resolve to private or
link-local addresses fail closed. Each request has a bounded timeout.

## Current target disposition

| Target | Current evidence | Result |
|---|---|---|
| Sentra | Retained monorepo artifact explicitly says standalone Sentra is superseded; requested public repository not observed | FAIL CLOSED |
| Vessels | Retained artifact explicitly says standalone Vessels is superseded; functionality points to killinchu | FAIL CLOSED |
| Insurance / david-leads | `david-leads` is public and its runtime is healthy, but `/version` and `/evidence` return 404 and no registered insurance artifact exists | FAIL CLOSED |

No `3/3` badge is authorized. A badge may be added only after three cited
deployment runs pass all seven gates at exact commits.

## Live frontier preflight

`pnpm frontier:preflight` performs a bounded, read-only measurement of the
current npm, DOI, vertical deployment, local TPM-readiness, and hosted
observability frontiers. It emits `szl.frontier-preflight.v1` JSON and does not
publish, deploy, mint evidence, or change a conformance result.

`pnpm frontier:gate` runs the same probes and exits non-zero until every
frontier is operational. In particular, a healthy runtime, HTTP 200, local TPM
readiness, or `receipt_minted=false` never upgrades a surface to verified.

## Offline verifier

The same package exposes the `szl-verify` binary:

```bash
pnpm --filter @szl/verify exec szl-verify \
  --file receipt.json \
  --public-key conformance.pub \
  --expected-fingerprint sha256:<hex> \
  --offline
```

Exit 0 means the DSSE signature verifies under an external trust root. Exit 1
means the receipt is invalid. Exit 2 means the result is indeterminate or the
invocation is invalid. Exit 0 is possible only with an externally supplied
public key or an externally supplied expected fingerprint that matches the
embedded key. An embedded key without either external trust root can prove
cryptographic self-consistency, but is reported as `embedded-key-unpinned` and
exits 2. The CLI always requires the exact
`application/vnd.szl.khipu.receipt+json` payload type.

## Verifier semantic boundary

The standalone verifier currently establishes only:

- strict DSSE envelope and canonical-base64 parsing;
- the exact KHIPU receipt payload type;
- UTF-8 JSON payload decoding;
- Ed25519 or ECDSA P-256 signature validity; and
- signer identity pinned by an external public key or expected SPKI
  fingerprint.

It does **not** claim that a valid signature proves receipt freshness, a parent
chain, an artifact digest, a policy digest, or policy execution. The
surface-specific conformance runner separately enforces the implemented
`szl.khipu.receipt.v1` freshness and parent-link fields. No canonical KHIPU
schema in this repository defines portable artifact-digest or policy-digest
semantics for the standalone verifier, so those checks remain open rather than
being inferred from similarly named receipt types elsewhere in the monorepo.
