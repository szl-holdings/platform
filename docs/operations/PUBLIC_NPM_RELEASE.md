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

For a provenance-bearing first release, store a narrowly scoped granular npm
token as the `NPM_TOKEN` Actions secret, then run
`npm-public-publish.yml` in `bootstrap-token` mode with the exact confirmation
`PUBLISH @szl PUBLIC`. The workflow publishes only the retained `0.1.0`
tarballs, requests Sigstore provenance, downloads both packages from the public
registry, and fails unless the downloaded bytes match the reviewed artifacts.
Dispatch the current `main` branch; the workflow rejects any other ref or stale
main commit. Remove the bootstrap token after both packages are verified.

Automatic npm provenance generation is not available from an arbitrary local
shell. A local first publication is therefore recorded with provenance
`UNAVAILABLE_INITIAL_PUBLICATION`.

## Trusted publishing after package creation

After the first publication, configure npm trusted publishing separately for
both packages with these exact values:

| Setting | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization | `szl-holdings` |
| Repository | `platform` |
| Workflow filename | `npm-public-publish.yml` |
| Allowed action | `npm publish` |

Then run the workflow in `trusted-publishing` mode. The job uses GitHub OIDC
(`id-token: write`) and does not receive `NPM_TOKEN`. Each package can have only
one trusted publisher, and npm treats the workflow filename as case-sensitive.
The workflow is intentionally manual and requires an exact confirmation phrase;
it never publishes on an ordinary branch push or pull request.

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
was available during the 2026-07-29 verification. Both registry endpoints
returned `404`. The OIDC-ready release workflow is source-complete, but initial
publication remains account-bound and was not attempted.
