# pnpm dependency patch provenance

These source-level diffs are retained with exact provenance. Only patches
listed under `patchedDependencies` in `pnpm-workspace.yaml` are applied by
pnpm. Other entries below are historical or provide the source delta for a
repository-local fork. They are local derivative works, not claims of upstream
acceptance. SZL Holdings' changes in each patch are distributed under the same
license named for that patch; the repository's proprietary license does not
apply to these patch files or their accompanying license copies.

## `node-forge@1.4.0`

- Patch: [`node-forge@1.4.0.patch`](node-forge@1.4.0.patch)
- Patch SHA-256: `de8829eac6e09806b4b749a7221e7a2a62e6d88c796d38880d0f61bb2eb035ec`
- npm release metadata: [`https://registry.npmjs.org/node-forge/1.4.0`](https://registry.npmjs.org/node-forge/1.4.0)
- npm integrity: `sha512-LarFH0+6VfriEhqMMcLX2F7SwSXeWwnEAJEsYm5QKWchiVYVvJyV9v7UDvUv+w5HO23ZpQTXDv/GxdDdMyOuoQ==`
- Upstream release commit: [`fa385f92440879601240020f158bed68e444e83a`](https://github.com/digitalbazaar/forge/tree/fa385f92440879601240020f158bed68e444e83a)
- License: `(BSD-3-Clause OR GPL-2.0)` upstream; this redistribution elects
  the permissive BSD-3-Clause option
- Preserved upstream license: [`licenses/node-forge-1.4.0.LICENSE`](licenses/node-forge-1.4.0.LICENSE),
  SHA-256 `f63ff0e4e239244aa79280da2dd4811a0469e5e201caf5cbc0d97c3a1dff8e82`;
  [upstream source](https://github.com/digitalbazaar/forge/blob/fa385f92440879601240020f158bed68e444e83a/LICENSE)

**Status:** archival/inactive. `node-forge@1.4.0` is absent from the current
lockfile and this patch is not registered in `patchedDependencies`.

Modified by SZL Holdings on 2026-10-06 to harden RSA DigestInfo validation,
canonical DER handling, and inherited-option behavior while an upstream fixed
release was unavailable. The element-count change is based on
[upstream pull-request commit `ceba34402e329f0365134f23fe19898756527d65`](https://github.com/digitalbazaar/forge/pull/1152/commits/ceba34402e329f0365134f23fe19898756527d65);
the additional hardening is local and is not represented as upstream work.

## `braces@3.0.3`

- Patch: [`braces@3.0.3.patch`](braces@3.0.3.patch)
- Patch SHA-256: `c056b5c1123a999cfcaa5ad56c70e69a1120e186c410ee091a1f86e941411cf9`
- npm release metadata: [`https://registry.npmjs.org/braces/3.0.3`](https://registry.npmjs.org/braces/3.0.3)
- npm integrity: `sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==`
- Upstream release commit: [`74b2db2938fad48a2ea54a9c8bf27a37a62c350d`](https://github.com/micromatch/braces/tree/74b2db2938fad48a2ea54a9c8bf27a37a62c350d)
- License: MIT
- Preserved upstream license: [`licenses/braces-3.0.3.LICENSE`](licenses/braces-3.0.3.LICENSE),
  SHA-256 `35bdd8a44339719441900fb50fbefc5e2dca1ca662cbaed7a687de842c8b70f2`;
  [upstream source](https://github.com/micromatch/braces/blob/74b2db2938fad48a2ea54a9c8bf27a37a62c350d/LICENSE)

**Status:** consolidated fork provenance. This patch is applied to the published
3.0.3 source inside `packages/braces-safe@0.2.0`; it is not registered as a pnpm
dependency patch. The private fork's package metadata, `UPSTREAM.md`, override
resolution, adversarial tests, and SBOM identity define the current control.

Modified by SZL Holdings on 2026-10-06 to enforce parser and AST traversal
ceilings and reject cyclic or stateful structures while an upstream fixed
release is unavailable. The patch is a local response to
[upstream issue 70](https://github.com/micromatch/braces/issues/70), not an
upstream-authored or accepted fix.

## `@storybook/core@8.6.18`

- Patch: [`@storybook__core@8.6.18.patch`](@storybook__core@8.6.18.patch)
- Patch SHA-256: `8174f83b01a84f5769116b174f4b1f2230d4bcb906620f7bd95f0823235f5a8d`
- npm release metadata: [`https://registry.npmjs.org/@storybook%2fcore/8.6.18`](https://registry.npmjs.org/@storybook%2fcore/8.6.18)
- npm integrity: `sha512-dRBP2TnX6fGdS0T2mXBHjkS/3Nlu1ra1huovZVFuM67CYMzrhM/3hX/zru1vWSC5rqY93ZaAhjMciPW4pK5mMQ==`
- Upstream release commit: [`81930ad5d787bccdd43ffcdfecc9ee2ec765091b`](https://github.com/storybookjs/storybook/tree/81930ad5d787bccdd43ffcdfecc9ee2ec765091b)
- License: MIT
- Preserved upstream license: [`licenses/storybook-8.6.18.LICENSE`](licenses/storybook-8.6.18.LICENSE),
  SHA-256 `bc90586179d44dcb313a9a289d687a2f26226303b2066bd21dbefd2378e894e5`;
  [upstream source](https://github.com/storybookjs/storybook/blob/81930ad5d787bccdd43ffcdfecc9ee2ec765091b/LICENSE)

Modified by SZL Holdings on 2026-10-06 to retain syntax and whitespace
minification while disabling checkout-path-sensitive identifier minification
for deterministic static Storybook output.

**Status:** archival/inactive after the 8.6.19 security update below. The old
patch and upstream license remain available as provenance.

## `@storybook/core@8.6.19`

- Patch: [`@storybook__core@8.6.19.patch`](@storybook__core@8.6.19.patch)
- Patch SHA-256: `db18ac6524d85465bc10ecabfe24bf0ccdf5dd676a65f6333f5454ec4ed24cbd`
- npm release metadata: [`https://registry.npmjs.org/@storybook%2fcore/8.6.19`](https://registry.npmjs.org/@storybook%2fcore/8.6.19)
- npm integrity: `sha512-o9TZn0YxSxjBOxkTlJWq9jFTZn53Wr83HNvX0k8YYxxA5evwt7kWubKs/RMTEIyXbsBKW7XUw7Cq9fLmhgJ3Bg==`
- Upstream release commit: [`117b95a45b27138796c151b7928ba7956ca6da45`](https://github.com/storybookjs/storybook/tree/117b95a45b27138796c151b7928ba7956ca6da45)
- License: MIT
- Preserved upstream license: [`licenses/storybook-8.6.19.LICENSE`](licenses/storybook-8.6.19.LICENSE),
  SHA-256 `bc90586179d44dcb313a9a289d687a2f26226303b2066bd21dbefd2378e894e5`;
  [upstream source](https://github.com/storybookjs/storybook/blob/117b95a45b27138796c151b7928ba7956ca6da45/LICENSE)

Rebased by SZL Holdings on 2026-10-22 against integrity-verified npm release
bytes. The four manager-builder changes have the same behavior as the retained
8.6.18 patch: syntax and whitespace minification stay enabled; identifier
minification stays disabled. This patch does not touch the preview origin
validation fix. The upstream 8.6.19 release, not the local reproducibility
patch, addresses [GHSA-f2ph-cmg5-wxc8](https://github.com/storybookjs/storybook/security/advisories/GHSA-f2ph-cmg5-wxc8).

The exact active package registration is in `pnpm-workspace.yaml` and
`pnpm-lock.yaml`. Only the Storybook patch is currently applied by pnpm; it is a
reproducibility control, not a vulnerability mitigation. The live
`security/vulnerability-mitigations.json` registry is empty because the current
lockfile has no High/Critical finding admitted through a local dependency patch.
