# Braces security backport

`@szl-holdings/braces-safe@0.1.0` is a private, repository-local derivative of
[`braces@3.0.3`](https://github.com/micromatch/braces), retained under the
upstream MIT license. The workspace override exposes it to existing consumers
under the `braces` dependency name; it is not an official `braces` release.

## Exact provenance

- Published upstream package: `braces@3.0.3`
- Upstream security advisory: `GHSA-vfj7-8cjw-p6xm` / `CVE-2026-93687`
- Reviewed, unmerged fix proposal: `micromatch/braces#72`
- Contributor source repository: `FSDevelop/braces`
- Imported contributor commit: `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`
- Imported contributor tree: `0ffbc33a63a6f2365865e69b4217683268067847`
- Local package identity: `@szl-holdings/braces-safe@0.1.0` (private)

The `LICENSE`, `index.js`, and six `lib/*.js` source blobs were compared with
that exact contributor tree at import and their Git blob IDs matched. The
repository formatter then normalized the JavaScript files, so the committed
JavaScript bytes are no longer identical to the contributor blobs. The
contributor commit and tree identify the source of the derivative, not an
upstream release or proof that every consumer is compatible.

The imported source adds a default maximum nesting depth of 100 to parsing and
all recursive AST walkers, honors stricter caller-provided limits, preserves
published `escapeInvalid` behavior, and rejects cyclic parent chains during
expansion. It does not suppress the advisory or represent itself as an official
upstream release. Dependency scanning, compatibility tests, and the existing
security gate must evaluate this local override before admission.

## Retirement

Replace this package with an official upstream release only after that release
is published, its source and advisory status are independently reviewed, and
normal compatibility and security tests pass. Keep this record as historical
provenance after retirement.
