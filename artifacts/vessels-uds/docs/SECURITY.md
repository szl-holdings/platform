# Vessels.UDS — Security Model (v0.1.0)

## Trust chain

1. **Build determinism.** `scripts/build.sh` produces a tarball whose
   contents are sorted, mtime-pinned, and owner-stripped. Two builds
   from the same git SHA at the same `BUILD_TS` produce identical
   `sha256` digests.
2. **Per-file manifest.** `build/MANIFEST.json` records `sha256` + `size`
   for every payload file. `scripts/verify-manifest.mjs` re-hashes each
   file and fails on missing / extra / mutated payloads.
3. **Tarball sidecar.** `dist/vessels-uds/vessels-uds-<v>.tar.zst.sha256`
   is the sha256 of the deployable tarball.
4. **Cosign signature (optional).** When `COSIGN_KEY` is set and `cosign`
   is available, the build emits `.tar.zst.sig`. The release-keys
   directory ships the matching `.pub` so operators can verify the
   blob offline.
5. **Hash-chained receipts.** Each voyage event is committed to a
   sha256-chained receipt (`appendReceipt`). Any tamper between
   ingestion and audit is detected by `verifyChain`, which reports the
   `brokenAt` link.

## What is signed

| Artifact                              | What it commits to                              |
|---------------------------------------|------------------------------------------------|
| `MANIFEST.json` (`sha256` per file)   | Every payload byte under `lib/`, `docs/`, demo |
| `<tarball>.sha256`                    | The full Zarf / fallback tarball               |
| `<tarball>.sig` (cosign)              | The full Zarf / fallback tarball               |
| Receipt chain (operator-emitted)      | Voyage event stream, hash-chained              |

## What is **not** signed

* Operator-provided feed data (AIS, RF, SAR). The bundle is a kernel,
  not a data source — feed integrity is the operator's responsibility.
* Build-time provenance (git SHA / build TS) is recorded in
  `MANIFEST.json` for audit but not independently signed.

## Threat model in two lines

* In-flight tamper of the bundle → defeated by `sha256` sidecar + cosign.
* In-flight tamper of operator voyage events → defeated by `verifyChain`.
