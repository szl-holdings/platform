# ROSIE.UDS — Security Model

## Provenance
- `MANIFEST.json` ships in the payload with per-file sha256 + size and the
  git_sha + build_ts that produced it.
- The tarball is sha256-pinned via a `<tarball>.sha256` sidecar.
- When the SZL cosign key is configured at build time, a `<tarball>.sig`
  cosign signature is published alongside the sha256 sidecar (sha256 is
  always emitted — cosign is additive, not a replacement).

## Verify (operator)
```bash
sha256sum -c rosie-uds-<version>.tar.zst.sha256
cosign verify-blob --key szl-cosign.pub \
  --signature rosie-uds-<version>.tar.zst.sig \
  rosie-uds-<version>.tar.zst
```

## Runtime posture
- Deny-by-default for any event without a matching policy.
- Policy load fails if a contradiction is detected — no “last write wins”.
- Decision receipts are hash-chained; replaying a tampered receipt fails
  `verifyChain`.
