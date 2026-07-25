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

1. A sequence of DSSE envelopes forms a valid Khipu parent-hash chain with an
   adjacent `a11oy -> target` boundary.
2. `/healthz`, `/version`, and `/evidence` return HTTP 200, and `/version.gitSha`
   equals the expected deployed commit.
3. The evidence set references a receipt whose decision is exactly `DENY`.
4. At least one current OpenTelemetry GenAI or MCP semantic-convention span is
   present; deprecated `gen_ai.system` does not qualify.
5. Every receipt verifies offline against a fingerprint-pinned Ed25519 key, and
   a tampered receipt fails.
6. The README declares LIVE, MODELED, or PLANNED above the fold and cites
   `SOURCE_OF_TRUTH.md`.
7. The artifact manifest is present, counted by the canonical registry, and the
   conformance manifest disposition is `CANDIDATE`.

## Required deployment inputs

Each surface manifest names four environment variables:

- deployed base URL;
- expected Git SHA;
- Ed25519 public key PEM; and
- SHA-256 fingerprint of that public key.

The public key is not secret. The separate fingerprint is a trust anchor that
prevents a self-signed replacement key from passing conformance.

## Current target disposition

| Target | Current evidence | Result |
|---|---|---|
| Sentra | Retained monorepo artifact explicitly says standalone Sentra is superseded; requested public repository not observed | FAIL CLOSED |
| Vessels | Retained artifact explicitly says standalone Vessels is superseded; functionality points to killinchu | FAIL CLOSED |
| Insurance / david-leads | No registered insurance artifact; `david-leads` was observed private | FAIL CLOSED |

No `3/3` badge is authorized. A badge may be added only after three cited
deployment runs pass all seven gates at exact commits.

## Offline verifier

The same package exposes the `szl-verify` binary:

```bash
pnpm --filter @szl/verify exec szl-verify \
  --file receipt.json \
  --public-key conformance.pub \
  --expected-fingerprint sha256:<hex> \
  --offline
```

Exit 0 means the DSSE signature verifies against the supplied key. Exit 1 means
verification failed. Exit 2 means the invocation was invalid. With no supplied
key, an embedded key can prove self-consistency but is reported as
`embedded-key-unpinned`, not trusted identity.
