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
npm whoami
pnpm install --frozen-lockfile
pnpm verify:npm-artifacts
npm publish --access public \
  ./audit/frontier/npm-package-readiness-2026-07-28/szl-mcp-governor-0.1.0.tgz
npm publish --access public \
  ./audit/frontier/npm-package-readiness-2026-07-28/szl-verify-0.1.0.tgz
```

Do not put an npm token in a commit, PR, issue, log, or chat. Use an
authenticated local npm session or a granular automation token supplied through
an approved secret store.

The reviewed tarballs are the release inputs. Do not pass package directories to
`npm publish`; that would repack the source and publish bytes different from the
retained evidence.

Automatic npm provenance generation is not available from an arbitrary local
shell. The first local publication is therefore recorded with provenance
`UNAVAILABLE_INITIAL_PUBLICATION`. If provenance is mandatory for version
`0.1.0`, perform the token-authenticated first publication in a supported
GitHub Actions workflow with `id-token: write` instead.

## Trusted publishing after package creation

For each package, configure npm trusted publishing with the exact GitHub
repository, workflow filename, and optional environment. The release workflow
must use GitHub OIDC (`id-token: write`), must publish the exact reviewed
version, and must not use a long-lived npm token.

The release receipt must preserve:

- reviewed Git commit and immutable package version;
- tarball filename, integrity digest, and unpacked file inventory;
- npm registry URL and returned package metadata;
- provenance attestation identity, or the explicit
  `UNAVAILABLE_INITIAL_PUBLICATION` state for a local first publication;
- workflow run URL and terminal conclusion; and
- an unauthenticated `npm view <name>@<version>` verification.

If any receipt field is missing, the release remains `UNVERIFIED`.

The exact tarballs, SHA-256 digests, and file inventories are primary release
evidence. Preserve them in the durable release evidence store before deleting
any build directory. A console transcript alone is insufficient.

After publication, download the registry artifacts and compare their exact bytes
to the reviewed tarballs:

```bash
mkdir registry-readback
npm pack @szl/mcp-governor@0.1.0 --pack-destination registry-readback
npm pack @szl/verify@0.1.0 --pack-destination registry-readback
cmp --silent \
  audit/frontier/npm-package-readiness-2026-07-28/szl-mcp-governor-0.1.0.tgz \
  registry-readback/szl-mcp-governor-0.1.0.tgz
cmp --silent \
  audit/frontier/npm-package-readiness-2026-07-28/szl-verify-0.1.0.tgz \
  registry-readback/szl-verify-0.1.0.tgz
npm view @szl/mcp-governor@0.1.0 dist --json
npm view @szl/verify@0.1.0 dist --json
```

Any byte mismatch leaves publication `UNVERIFIED`.

## Current external gate

No npm token, authenticated npm configuration, or signed-in npm browser session
was available during the 2026-07-28 verification. Both registry endpoints
returned `404`. Initial publication was therefore not attempted and no
publication claim is authorized.
