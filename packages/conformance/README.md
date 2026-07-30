# `@szl/verify`

Offline DSSE receipt verification and fail-closed SZL vertical conformance.

## Offline receipt verification

```bash
npx --package @szl/verify@0.1.0 szl-verify \
  --file receipt.json \
  --public-key conformance.pub \
  --expected-fingerprint sha256:<hex> \
  --offline
```

Exit code `0` means that the exact
`application/vnd.szl.khipu.receipt+json` DSSE payload verified under an
externally supplied trust root. Exit code `1` means invalid. Exit code `2`
means indeterminate or invalid invocation.

An embedded public key without an external public key or matching external
fingerprint is never treated as a trust root.

## Vertical conformance

The built-in target manifests are bundled with the package. Point `--root` at
an exact clean clone containing the registered artifact and documentation
evidence:

```bash
npx --package @szl/verify@0.1.0 szl-conformance \
  --surface sentra \
  --root /path/to/platform
```

For a separately registered surface, supply its manifest explicitly:

```bash
npx --package @szl/verify@0.1.0 szl-conformance \
  --surface example \
  --manifest /path/to/example.json \
  --root /path/to/evidence-root
```

Each surface must pass all seven documented gates at exact deployed commits.
Manifest v2 binds the A11oy root receipt to its own reviewed commit and pinned
signer, then binds the target receipt to the vertical's separately reviewed
commit and pinned signer. A vertical cannot pass by relabeling its own commit
or signing an A11oy-shaped root with only the target trust input. Manifest v1
remains supported for existing shared-commit, shared-signer fixtures.

The runner exits `0` only for a conformant surface, `1` for a non-conformant
surface, and `2` for invalid usage.

The manifest and root are separate on purpose: the package owns the evaluator,
while the operator supplies the exact reviewed evidence tree. Missing,
malformed, mismatched, or path-traversing inputs fail closed.

Bundled v2 manifests require seven deployment inputs:

- target deployment base URL;
- target deployed Git SHA;
- A11oy root deployed Git SHA;
- A11oy root public key and independent SHA-256 fingerprint; and
- target public key and independent SHA-256 fingerprint.

The public keys are not secrets. Their fingerprints are external trust pins;
neither receipt contents nor the runtime endpoint may define its own trust.

Current status is **HARNESS IMPLEMENTED / 0 OF 3 TARGET SURFACES VERIFIED**.
Package publication does not change that result and does not authorize a
`3/3` badge.

The canonical gate definitions and live disposition are maintained in
[`docs/conformance/VERTICAL_CONFORMANCE.md`](https://github.com/szl-holdings/platform/blob/main/docs/conformance/VERTICAL_CONFORMANCE.md).

## Security and support boundary

- Network targets are HTTPS-only except loopback tests.
- Private, link-local, credential-bearing, and unpinned endpoints fail closed.
- The offline verifier never makes a network request.
- This package is proprietary software; see `LICENSE`.
