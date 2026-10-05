# Braces security backport

This package is a source-compatible, repository-local derivative of
[`braces@3.0.3`](https://github.com/micromatch/braces), retained under the
upstream MIT license.

## Exact provenance

- Published upstream package: `braces@3.0.3`
- Upstream security advisory: `GHSA-vfj7-8cjw-p6xm` / `CVE-2026-93687`
- Reviewed upstream fix proposal: `micromatch/braces#72`
- Imported source commit: `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`
- Imported source tree: `0ffbc33a63a6f2365865e69b4217683268067847`
- Local package version: `3.0.3-szl.1` (private SZL derivative; not an upstream release)

The imported source adds a default maximum nesting depth of 100 to parsing and
all recursive AST walkers, honors stricter caller-provided limits, preserves
published `escapeInvalid` behavior, and rejects cyclic parent chains during
expansion. It does not suppress the advisory or represent itself as an official
upstream release.

The full upstream test directory is retained at `test/*.js` from the imported
source revision. Imported JavaScript is mechanically formatted by the existing
repository Biome 2.4.12 configuration, including redundant trailing blank-line
removal; it is a formatted derivative, not a byte-identical upstream checkout.
No upstream test cases or source behavior were deliberately changed.
`test/security.test.cjs` adds the SZL boundary controls and
`test/consumer.test.cjs` verifies real installed micromatch resolution.
Run both with `pnpm --filter braces test`. The upstream tests invoke Bash for
native shell comparisons; a real Bash executable must be available.

## Retirement

Replace this package with an official upstream release only after that release
is published, its source and advisory status are independently reviewed, and
normal compatibility and security tests pass. Keep this record as historical
provenance after retirement.
