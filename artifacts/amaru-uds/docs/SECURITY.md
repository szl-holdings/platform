# Amaru.UDS — Security Posture

## Signing model

- Tarball is signed via `cosign sign-blob` (ed25519). Signature ships
  alongside the tarball as `<tarball>.sig`.
- A development public key ships as `amaru-uds-dev.pub` for offline
  verification. **Downstream operators MUST re-sign with their own org
  key for production deployments** — see `docs/FORKING.md` upstream.
- A Sigstore Rekor transparency-log entry is created at sign time for
  non-air-gap verifiers; the air-gap verification path does not depend
  on it.
- Per-file `MANIFEST.json` provides sha256 of every payload file plus
  build metadata (`version`, `git_sha`, `build_ts`).

## Threat model

- **Tampering with the tarball post-publish.** Detected by sha256
  sidecar and cosign signature.
- **Tampering with the public key.** Detected by Rekor tlog entry
  cross-check; air-gap operators must obtain the pubkey through a
  trusted side channel (org PKI, in-person key exchange, established
  certificate authority).
- **Tampering with individual payload files inside the tarball.**
  Detected by MANIFEST.json round-trip on extraction.
- **Tampering with the doctrine source after extraction.** Out of scope;
  customer's responsibility to deploy from the signed artifact, not from
  a mutated extraction.

## Key rotation

The dev key is rotated annually or on any suspected compromise. Rotation
events are published as a GitHub release note + Rekor tlog entry. The
shipped doctrine does not pin a specific key; operators choose their
verification root.

## Reporting a vulnerability

See the repository `SECURITY.md` for the private-advisory channel. Do
NOT file public issues for vulnerabilities.
