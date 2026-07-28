# Public npm release boundary

**Status: PACKAGE TARBALLS VERIFIED / INITIAL NPM PUBLICATION UNAVAILABLE**

The public registry names are:

- `@szl/mcp-governor`
- `@szl/verify`

Both packages are prepared for public scoped publication from
`szl-holdings/platform`. A package is not published merely because its tarball
builds or its registry URL returns `404`.

## Initial publication

npm trusted publishing can secure later releases, but npm requires a package to
exist before its trusted-publisher settings can be configured. The first
publication therefore requires an authenticated maintainer of the `@szl`
scope, two-factor authentication where required, and explicit authorization to
publish the proprietary package.

Run from an isolated clean clone at the exact reviewed commit:

```bash
corepack enable
pnpm install --frozen-lockfile
npm whoami
npm pack --dry-run --json ./packages/mcp-governor
npm pack --dry-run --json ./packages/conformance
npm publish --access public ./packages/mcp-governor
npm publish --access public ./packages/conformance
```

Do not put an npm token in a commit, PR, issue, log, or chat. Use an
authenticated local npm session or a granular automation token supplied through
an approved secret store.

The authenticated local first publication cannot emit npm provenance. Record
its provenance state as `UNAVAILABLE_INITIAL_LOCAL_PUBLISH`; do not infer an
attestation from package metadata or a successful registry upload. Provenance
becomes required only after the package exists and trusted publishing can run
inside the supported GitHub Actions OIDC boundary described below.

## Trusted publishing after package creation

For each package, configure npm trusted publishing with the exact GitHub
repository, workflow filename, and optional environment. The release workflow
must use GitHub OIDC (`id-token: write`), must publish the exact reviewed
version, and must not use a long-lived npm token.

The release receipt must preserve:

- reviewed Git commit and immutable package version;
- tarball filename, integrity digest, and unpacked file inventory;
- npm registry URL and returned package metadata;
- provenance state, including `UNAVAILABLE_INITIAL_LOCAL_PUBLISH` for the
  authenticated first publication or the attestation identity for a supported
  trusted-publishing run;
- workflow run URL and terminal conclusion; and
- an unauthenticated `npm view <name>@<version>` verification.

For the local first publication, the workflow fields must be recorded as
`NOT_APPLICABLE_INITIAL_LOCAL_PUBLISH`, not omitted. If any applicable receipt
field is missing, the release remains `UNVERIFIED`.

## Current external gate

No npm token, authenticated npm configuration, or signed-in npm browser session
was available during the 2026-07-28 verification. Both registry endpoints
returned `404`. Initial publication was therefore not attempted and no
publication claim is authorized.
