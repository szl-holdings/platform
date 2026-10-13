# Braces security backport

`@szl-holdings/braces-safe@0.2.0` is a private, repository-local derivative of
[`braces@3.0.3`](https://github.com/micromatch/braces), retained under the
upstream MIT license. The workspace override exposes it to existing consumers
under the `braces` dependency name; it is not an official `braces` release.

## Exact provenance

- Published upstream package: `braces@3.0.3`
- Published package integrity:
  `sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==`
- Upstream security advisory: `GHSA-vfj7-8cjw-p6xm` / `CVE-2026-93687`
- Upstream issue for the current local hardening: `micromatch/braces#70`
- Local hardening patch:
  [`patches/braces@3.0.3.patch`](../../patches/braces@3.0.3.patch), SHA-256
  `c056b5c1123a999cfcaa5ad56c70e69a1120e186c410ee091a1f86e941411cf9`
- Local package identity: `@szl-holdings/braces-safe@0.2.0` (private)
- Historical 0.1 reviewed proposal: `micromatch/braces#72`
- Historical 0.1 contributor source: `FSDevelop/braces`
- Historical 0.1 contributor commit: `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`
- Historical 0.1 contributor tree: `0ffbc33a63a6f2365865e69b4217683268067847`

Version 0.1.0 began from the named contributor tree. Version 0.2.0 replaces
those JavaScript sources with the published `braces@3.0.3` bytes after applying
the separately reviewed local hardening patch, so dependency scanners and
consumers see one repository-local implementation rather than an npm identity
plus a pnpm patch. The repository formatter normalized the JavaScript sources
after patching. The published package integrity and local patch digest identify
the current source inputs. The contributor commit and tree are retained only as
historical 0.1 provenance. None is an official fixed upstream release or proof
of compatibility for every consumer.

The consolidated source adds a default maximum nesting depth of 100, honors
stricter caller limits, bounds aggregate AST traversal, rejects cyclic node,
value-array, and parent structures, snapshots stateful inputs before use, keeps
expansion queues outside caller-controlled ASTs, and ignores concat-spreadable
non-array values. It preserves the tested published compile and expansion
behavior. Package-manager audit identifies the component by its private fork
name and therefore does not report the upstream package advisory against this
identity; the advisory remains recorded in package metadata and this provenance
file. The fork does not represent itself as an official upstream release.
Dependency scanning, override-resolution checks, and adversarial behavior tests
remain mandatory before admission.

## Retirement

Replace this package with an official upstream release only after that release
is published, its source and advisory status are independently reviewed, and
normal compatibility and security tests pass. Keep this record as historical
provenance after retirement.
