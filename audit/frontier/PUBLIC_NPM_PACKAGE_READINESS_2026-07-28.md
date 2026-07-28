# Public npm package readiness proof — 2026-07-28

**Status: TARBALL READINESS VERIFIED / REGISTRY PUBLICATION UNAVAILABLE**

## Scope

- `@szl/mcp-governor@0.1.0`
- `@szl/verify@0.1.0`

## Implemented

- explicit public scoped-package publication configuration;
- exact source repository, package directory, support, and runtime metadata;
- package-local proprietary license notices;
- bounded package file inventories;
- a standalone README and fail-closed status boundary for `@szl/verify`;
- package tests before the `@szl/verify` tarball is created; and
- an operator runbook separating initial authenticated publication from later
  OIDC trusted publishing.

## Observed verification

- `@szl/mcp-governor`: typecheck passed, build passed, and 36/36 focused tests
  passed.
- `@szl/verify`: 23/23 focused tests passed, including the packaged-manifest
  fail-closed boundary.
- both actual tarballs were created in an isolated temporary directory and
  extracted successfully;
- the packed `@szl/mcp-governor` entrypoint imported successfully;
- the packed `@szl/verify` entrypoint imported successfully;
- the packed conformance CLI loaded its bundled Sentra manifest and returned
  exit `1` for the observed non-conformant surface;
- the MCP Governor tarball contained only compiled output, declarations,
  metadata, README, and license;
- the verifier tarball contained only four runtime modules, three surface
  manifests, metadata, README, and license; and
- the reviewed tarballs, their SHA-256 digests, and their file inventories are
  preserved under `audit/frontier/npm-package-readiness-2026-07-28/`.

Preserved SHA-256:

- `szl-mcp-governor-0.1.0.tgz`:
  `dd87f0bd083c000eb2ed15c731ddec67669e4497f2e746dd93e2bc0431d644c1`
- `szl-verify-0.1.0.tgz`:
  `bc13cfcacecbb71105e0c806d3ad750ed962fd1ff902c1bc71971bc29243028a`

Fresh unauthenticated registry lookups returned HTTP `404` for both exact
package names.

## Truth boundary

Tarball readiness is not registry publication. On 2026-07-28 both public npm
registry endpoints returned `404`, and no npm token, authenticated `.npmrc`, or
signed-in npm browser session was available. No `npm publish` command was run.

The vertical conformance result remains `0/3`; publishing `@szl/verify` cannot
replace three exact deployed surfaces passing all seven gates.
