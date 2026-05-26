# szl-mesh — Security & provenance

## Signature chain

All release artifacts are signed two ways:

1. **OCI keyless** — every published OCI artifact
   (`ghcr.io/szl-holdings/packages/{a11oy,amaru,sentra}` and
   `ghcr.io/szl-holdings/bundles/szl-mesh`) is signed with
   `cosign sign` using Sigstore keyless OIDC. The signing identity is
   the GitHub Actions workflow at
   `szl-holdings/<repo>/.github/workflows/uds-bundle-publish.yml`.
2. **Blob keyless** — the bundle tarball attached to each GitHub
   Release ships with `.sig` + `.cert` sidecars produced by
   `cosign sign-blob --yes` against the same OIDC identity, so the
   downloaded tarball can be verified without pulling from a
   registry.

Verification recipes are in `OPERATOR-QUICKSTART.md`.

## Integrity

Every released tarball has a `.sha256` sidecar generated at release
time. Verify before deploying:

```bash
sha256sum -c szl-mesh-uds-0.1.0.tar.zst.sha256
```

## Build provenance

- Built from `szl-holdings/<repo>` at the commit referenced by the
  release tag.
- Pinned tool versions (see `uds-bundle-publish.yml`):
  - zarf v0.49.1
  - uds-cli v0.27.4
  - cosign v2.4.1
- GitHub Actions third-party actions pinned by commit SHA.

## Doctrine V6 license posture

Apache-2.0 / NOTICE per the SZL Doctrine V6 license allowlist
(Apache-2.0, MIT, BSD-3-Clause, CC-BY-4.0). See
`packages/payload/raw/payload.json` → `doctrine.license_allowlist`.

## Reporting issues

Email security@szlholdings.example or open a private security
advisory on the GitHub repository hosting the release.
