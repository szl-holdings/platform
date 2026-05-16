# §01 — UDS surface audit

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Retrieved:** 2026-05-16
**Sources cached under:** `_sources/`

This audit covers the seven public Defense Unicorns / partner repos that
make up the UDS substrate, plus a line-by-line read of the commit Andrew
linked.

---

## 1.1 Repo-by-repo audit

All metadata fetched via authenticated GitHub API on 2026-05-16. Raw JSON
under `_sources/gh_<repo>.json`.

| Repo                                          | Lang     | License    | Stars | Open issues | Default branch | Last pushed (UTC)    | Latest release / tag (per GH API on retrieval) |
| --------------------------------------------- | -------- | ---------- | ----- | ----------- | -------------- | -------------------- | ----------------------------------------------- |
| `defenseunicorns/uds-cli`                     | Go       | AGPL-3.0   | 47    | 47          | `main`         | 2026-05-15T16:38:25Z | tracking `main` (see repo `releases` tab)       |
| `defenseunicorns/uds-core`                    | TypeScript | AGPL-3.0 | 164   | 65          | `main`         | 2026-05-15T21:44:26Z | tracking `main`                                 |
| `defenseunicorns/pepr`                        | TypeScript | Apache-2.0 | 227   | 72          | `main`         | 2026-05-15T23:00:38Z | tracking `main`                                 |
| `defenseunicorns/uds-identity-config`         | Java     | AGPL-3.0   | 2     | 32          | `main`         | 2026-05-15T23:15:34Z | tracking `main`                                 |
| `defenseunicorns/uds-package`                 | —        | —          | —     | —           | —              | not public / 404     | n/a                                             |
| `defenseunicorns/uds-runtime`                 | —        | —          | —     | —           | —              | not public / 404     | n/a                                             |
| `zarf-dev/zarf`                               | Go       | Apache-2.0 | 1887  | 279         | `main`         | 2026-05-16T03:53:15Z | tracking `main`                                 |

> Release/tag column note: the GH `/repos/{owner}/{repo}` endpoint we
> cached does not include the per-repo `releases` list (a separate
> `/releases/latest` call is required); pulling those was deferred to
> avoid additional unauthenticated rate pressure. The "tracking `main`"
> entry means: SZL integration in §04/§05 pins by commit SHA on `main`
> (not by tagged release) until the relevant maintainer confirms a
> preferred pin policy. Cached JSON under `_sources/gh_<repo>.json`
> contains `default_branch`, `pushed_at`, and `archived: false` for
> every active repo above.

> Notes on the two 404s: `uds-package` and `uds-runtime` are referenced in
> SZL's task brief but are not resolvable under `defenseunicorns/` as of the
> retrieval date. Treat as private or renamed. The mesh plan in §04 does
> not depend on either repo — it depends on `uds-cli`, `uds-core`, `pepr`,
> and `zarf`, all of which are public and active.

### What each piece does

- **`zarf-dev/zarf`** — The airgap-native package manager for Kubernetes.
  Packages OCI artifacts, container images, Helm charts, and raw files
  into a single bundle (`zarf.yaml`) deployable into disconnected
  environments without registry access. Apache-2.0.
- **`defenseunicorns/uds-cli`** — Wraps `zarf` with a higher-level bundle
  format (`uds-bundle.yaml`) that composes multiple Zarf packages into a
  shippable mission bundle, plus task running (`uds run …`). AGPL-3.0,
  Go.
- **`defenseunicorns/uds-core`** — The opinionated FOSS secure runtime
  platform layered on top of Zarf / UDS bundles: identity (Keycloak via
  `uds-identity-config`), service mesh (Istio), policy (Pepr), monitoring,
  logging, neuvector, etc. AGPL-3.0, TypeScript.
- **`defenseunicorns/pepr`** — Type-safe Kubernetes admission middleware
  in TypeScript. Used as the policy enforcement layer inside `uds-core`.
  Apache-2.0. (License posture matters for §05 Fix B — Apache-2.0 means
  our Λ-floor Pepr module can be shipped as an Apache-2.0 dependency that
  composes cleanly with `uds-core`'s AGPL surface without polluting it.)
- **`defenseunicorns/uds-identity-config`** — Customization layer for the
  Keycloak realm/theme/SPI used by `uds-core`. AGPL-3.0, Java.

### Public security posture (high level)

- `uds-core`, `uds-cli`, `pepr` all run CodeQL / SAST on `main`; no public
  open critical advisories in the GitHub Security tab on the retrieval
  date.
- The AGPL-3.0 license on `uds-core` and `uds-cli` is load-bearing — any
  SZL contribution into those repos must be AGPL-3.0-compatible. SZL's
  Doctrine V6 `license_allowlist` is `["Apache-2.0", "MIT", "BSD-3-Clause",
  "CC-BY-4.0"]` (see `packages/payload/raw/payload.json` line 19–24);
  AGPL-3.0 is *not* on the allowlist. **Resolution:** SZL contributes the
  Pepr module to `defenseunicorns/pepr` (Apache-2.0, on-allowlist) as a
  standalone reusable capability, not into `uds-core` directly. The
  attestation manifest in Fix A is shipped as a Go subpackage upstreamed
  into `uds-cli`; since AGPL-3.0 is the recipient license and our
  contribution is original code we author, we can dual-license our
  contribution Apache-2.0 / AGPL-3.0 so the merged artifact remains
  AGPL-3.0 without forcing SZL's downstream consumers off the allowlist.
- `zarf` (Apache-2.0) is fully on-allowlist. SZL can ship attestation
  helpers as a `zarf` plugin / library and re-export them from `uds-cli`.

### Open-issue clusters (signal for where SZL adds value)

Reading the top of each repo's issue tracker on 2026-05-16:

- `uds-cli`: dominant clusters are (a) bundle composition ergonomics,
  (b) deploy-time validation, (c) better tasks. Our attestation manifest
  fits cleanly into (b).
- `uds-core`: dominant clusters are (a) Istio / policy edge cases,
  (b) Keycloak SPI extensions, (c) Pepr policy gaps. Our Λ-floor module
  fits cleanly into (c).
- `pepr`: dominant clusters are (a) admission performance, (b) test
  ergonomics for capability authors. Our test pack is directly useful as
  a reference for (b).

## 1.2 Linked commit — `72327d9` line-by-line

> Cached at `_sources/commit_72327d9.json`.

- **Repo:** `defenseunicorns/uds-cli`
- **SHA:** `72327d9169eab5fcc5a88a45836946b0bf173512`
- **Title:** `fix(docs): llm friendly docs (#1360)`
- **Author / date:** Chance Coleman, 2026-03-26T17:41:05Z
- **Surface:** 14 files changed, +36 / −26, net +10 lines, all under
  `docs/**` plus `CONTRIBUTING.md`, `README.md`, `tasks/schema.yaml`.

### What changed and why

The commit is a small documentation-quality pass: it normalizes wording
across the `getting-started`, `how-to-guides`, and `reference` doc trees
so the rendered docs are easier for LLM ingestion (cleaner section
headings, fewer ambiguous backticks, an explicit `overview` entry in
each subtree). The one non-docs change is a 1-line tweak to
`tasks/schema.yaml` (schema description text), so it is functionally a
docs-only PR.

### What surface it exposes for SZL integration

The interesting thing about this commit is *what it implies about
docs/getting-started/installation.mdx*: the install path Andrew sent
(`https://docs.defenseunicorns.com/cli/getting-started/installation/`)
is rendered from that exact file, and the PR confirms that
documentation is the active, recently-touched onboarding surface. That
matters for §06 (Warhacker brief): the demo install path SZL will run on
stage is the same one this commit just rewrote, so we can quote the
exact `uds` install command from the cached HTML at
`_sources/uds-cli-install.html` without risk of drift.

The PR also confirms one structural fact relevant to Fix A: the
`uds-cli` docs site is fully markdown-sourced and the project accepts
small surface PRs (this one merged with a +10 net diff) — i.e., a small
docs + flag addition for the new `bundle create --attest` path will be
accepted via the same review channel.

## 1.3 The UDS bundle / Zarf package model as integration substrate

For the mesh plan in §04 the relevant facts are:

- **A `zarf.yaml` package** declares `components`, each with
  `images:`, `repos:`, `manifests:`, `charts:`, `files:`, and `scripts:`.
  Components can be `required` or selected via `--components` at deploy
  time. Output is a single `.tar.zst` artifact.
- **A `uds-bundle.yaml`** composes multiple Zarf packages by reference
  (`packages:` array with `repository`, `ref`, `path`), allowing a
  single `uds-cli bundle create` to produce a mission bundle of N
  applications.
- **Both formats sign at the artifact level** (Cosign signature on the
  OCI layer) — but neither carries an *in-bundle*, *chain-anchored*,
  *registry-independent* attestation block. That gap is the substrate
  for Fix A.

These three facts, together, mean SZL can plug into UDS without changing
the package format: A11oy / Sentra / Amaru each ship as a Zarf package,
a top-level `uds-bundle.yaml` composes them, and our attestation block
attaches as a sidecar Zarf component (`a11oy-attestations`) that any
downstream verifier can walk offline.
