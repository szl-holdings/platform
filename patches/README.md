# pnpm dependency patch provenance

These source-level diffs are applied by pnpm to exact dependency releases.
They are local derivative works, not claims of upstream acceptance. The patch
bytes, release identities, and preserved upstream license texts are pinned
below. SZL Holdings' changes in each patch are distributed under the same
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

Modified by SZL Holdings on 2026-10-06 to harden RSA DigestInfo validation,
canonical DER handling, and inherited-option behavior while an upstream fixed
release is unavailable. The separate mitigation record remains authoritative
for advisory scope, tests, and expiry. The element-count change is based on
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

Modified by SZL Holdings on 2026-10-06 to enforce parser and AST traversal
ceilings and reject cyclic or stateful structures while an upstream fixed
release is unavailable. The separate mitigation record remains authoritative
for advisory scope, tests, and expiry. The patch is a local response to
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

The exact package registrations are in `pnpm-workspace.yaml` and
`pnpm-lock.yaml`. `security/vulnerability-mitigations.json` governs the two
temporary security mitigations; the Storybook patch is a reproducibility
control and is not a vulnerability mitigation.
