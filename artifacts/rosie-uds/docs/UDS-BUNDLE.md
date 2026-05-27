# ROSIE.UDS — UDS Bundle

`uds-bundle.yaml` declares a single package (`rosie-uds`) sourced from the
SZL GHCR registry. For air-gapped operators, swap `repository`/`ref` for a
`path:` pointing at the local `.tar.zst` shipped with this release.

## Components
- `rosie-core` — the governance kernel (`/opt/rosie/lib`).
- `rosie-demo` — `doctrine-demo.mjs` exercises every invariant in ~30s.
- `rosie-provenance` — `MANIFEST.json` per-file sha256 sidecar.
- `rosie-docs` — operator-facing docs (optional component; omit with
  `--optional-components=''` if the cluster forbids docs).
