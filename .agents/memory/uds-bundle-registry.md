---
name: UDS bundle registry — single source of truth
description: One canonical list of every signed UDS payload SZL ships, mirrored in three places that cannot drift.
---

The full UDS bundle fleet (slug, OCI coordinates, cosign identity regex,
install path, build command, description) lives in exactly **three**
places, and all three are kept in sync by hand:

1. `docs/uds/REGISTRY.md` — canonical human-readable doc.
2. `artifacts/api-server/src/routes/uds-registry.ts` — the
   `BUNDLES` array; served at `GET /api/uds/registry` (public, read-only).
3. The LinkedIn / external launch copy at
   `docs/uds/LINKEDIN-UDS-LAUNCH.md`.

**Why:** Defense-Unicorns operators, downstream mesh nodes, and CI
runners discover pull coordinates via the API feed, not by scraping
markdown. The doc is what humans read. The post is what gets shared.
All three must agree on slug, version, OCI coords, and cosign identity
regex — otherwise verification fails silently for at least one channel.

**How to apply:** when adding a sixth bundle (or bumping any version),
update the `BUNDLES` array in `uds-registry.ts` AND the table in
`REGISTRY.md` AND the table in `LINKEDIN-UDS-LAUNCH.md`, in the same
commit. The registry route is intentionally read-only — there is no
`POST /api/uds/registry` path; bundles register at publish time via the
per-bundle GitHub Actions workflow, which is also the workflow whose
identity cosign verifies against. Never weaken that invariant.

**Universal pull-verify-install contract** (every bundle, no exceptions):

```bash
zarf package pull oci://ghcr.io/szl-holdings/<bundle>-uds:<version>
cosign verify \
  --certificate-identity-regexp 'https://github.com/szl-holdings/.+/\.github/workflows/<bundle>-uds-publish\.yml@.+' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/szl-holdings/<bundle>-uds:<version>
zarf package deploy zarf-package-<bundle>-uds-*.tar.zst --confirm
```

Current bundles (v0.2.0): a11oy, amaru, rosie, sentra, vessels. The
a11oy bundle additionally ships an optional `a11oy-attestations`
hash-chained provenance component (`required: false, default: false`)
opted-in via `--components` or via the parent `szl-mesh` bundle.
