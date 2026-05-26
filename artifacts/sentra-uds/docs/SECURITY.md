# Sentra.UDS — Security Posture

## Signing model

- Tarball is signed via `cosign sign-blob` (ed25519). Signature ships
  alongside the tarball as `<tarball>.sig`.
- A development public key ships as `sentra-uds-dev.pub` for offline
  verification. **Downstream operators MUST re-sign with their own org
  key for production deployments** — see `docs/FORKING.md` upstream.
- A Sigstore Rekor transparency-log entry is created at sign time for
  non-air-gap verifiers; the air-gap verification path does not depend
  on it.
- Per-file `MANIFEST.json` provides sha256 of every payload file plus
  build metadata.

## Threat model

The shipped Sentra kernel is itself a defensive-posture artifact. The
security posture of the artifact and the security posture of what it
contains are both engineered.

**Of the artifact:**
- Tampering with the tarball — detected by cosign + sha256.
- Tampering with the pubkey — detected by Rekor; air-gap operators
  obtain pubkey through trusted side channel.
- Tampering with payload files inside the tarball — detected by
  MANIFEST.json round-trip on extraction.

**Of the doctrine the kernel embeds:**
- Offensive actions (attack, exploit, ddos, hack_back, offensive_recon,
  implant) have no callable code path. Confirmed by reading
  `lib/index.mjs::DENIED_ACTION_CLASSES` and `runAction`.
- Safety Gate is fail-closed by construction (`runPolicyGate` returns
  BLOCK on undefined ownership). Confirmed by demo case 1 in
  `doctrine-demo.mjs`.
- Framework mapping is complete (`frameworkCoverage().complete === true`)
  and CI-enforced.

## Reporting a vulnerability

See the repository `SECURITY.md` for the private-advisory channel. Do
NOT file public issues for vulnerabilities.
