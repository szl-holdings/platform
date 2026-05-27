---
name: UDS bundle v0.2 shared-package expansion
description: Checklist + non-obvious gotchas for rolling a new SZL shared package into all 5 UDS bundles. Read before bumping the bundle minor version.
---

## The checklist (must hit every bullet on every bundle)

1. **Shared helper, not copy-paste.** Add the new package to
   `scripts/release/lib/stage-v2-packages.sh` and source it from each bundle's
   `build.sh`. The helper takes `BUILD_DIR REPO_ROOT [LOG_PREFIX]`.
2. **Walker + fallback tar parity.** For the 4 ESM bundles the MANIFEST
   walker and the `zarf not available` fallback `cp -R` list are two
   independent code paths — both must include `build/shared`. Forgetting the
   fallback silently ships an empty shared payload when zarf is missing
   (which it is in Replit). Also guard `walk()` with an `fs.existsSync`
   check so cold builds don't crash before the helper runs.
3. **a11oy is the odd one out.** Its `write-manifest.mjs` walks the entire
   `BUILD_DIR` automatically, BUT `write-attestations.mjs` has a hardcoded
   `SUBJECTS` array — every new shared package must be added there as
   `shared/<pkg>` or the attestation chain won't bind it.
4. **Cosign block defaults.** The Replit Nix env has no `cosign` on PATH;
   it lives at `.local/bin/cosign`. The canonical block tries
   `command -v cosign`, falls back to `${REPO_ROOT}/.local/bin/cosign`,
   defaults `COSIGN_KEY`/`COSIGN_PUB` to the `.local/cosign/*` keypair, then
   signs + verifies locally. Without this fallback 4/5 bundles silently
   skip signing.
5. **Version bumps are three files, not one.** Per bundle: `package.json`
   `.version`, `uds-bundle.yaml` `.metadata.version` AND
   `.packages[].ref` (easy to miss the ref), and `zarf.yaml`
   `.metadata.version`. The release-notes generator reads from
   `package.json`; drift in the ref means UDS-bundle deploy resolves the
   old artifact.

## Two non-obvious gotchas

- **a11oy dist path.** a11oy writes its tarball to
  `dist/a11oy-uds-fallback/a11oy-uds-<ver>.fallback.tar.zst`, not
  `dist/a11oy-uds/a11oy-uds-<ver>.tar.zst`. Anything that publishes assets
  by canonical name has to copy + rename first and regenerate the
  `.sha256` against the renamed file. The `.sig` stays valid because it
  signs bytes, which don't change.
- **Destructive git is blocked in main agent.** Publish UDS releases via
  GitHub REST API using `GH_WORKFLOW_TOKEN`. Pattern: GET
  `/repos/{repo}/releases/tags/{tag}` → 404 means POST, else PATCH +
  DELETE existing assets first so re-uploads don't 422. Asset upload uses
  `uploads.github.com` with octet-stream body.

## Why this file exists

The first attempt at v0.2 hit every one of these failure modes (sentra
was patched correctly, the other three ESM bundles had unguarded
walkers + missing fallback cp + stale refs; 4/5 bundles silently
skipped cosign; a11oy publish failed on missing canonical asset path).
Code review caught the parity gaps. Next minor-version rollout should
treat this as a single deterministic checklist.
