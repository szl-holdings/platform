Anatomy bundle — vendored mirror (read-only)
=============================================

This directory ships the 7-chakra anatomy figure set consumed by the
A11oy `/anatomy` viewer.

State: VENDORED (bundle_kind="vendored" in VENDOR.json).

The 14 binaries (7 chakras × {pdf, png}) listed in
`VENDOR.json::expected_files` are present. They are rendered
deterministically by `services/amaru/scripts/vendor_anatomy.py`
(reportlab Canvas with `invariant=True` + PIL default PNG save) so
re-runs reproduce the same bytes and the same bundle hash.

Bundle hash algorithm (see `VENDOR.json::drift_detection`):

    sha256( sorted (filename || NUL || bytes || NUL)
            for each entry in expected_files )

`upstream_sha` and `drift_detection.expected_hash` are pinned to that
value. The A11oy `/anatomy` viewer recomputes the same hash in-browser
on every page load and surfaces a drift banner the moment any file is
added, removed, or modified without re-pinning.

To replace the bundle with the upstream-published canonical figures:

  1. Drop the new 14 binaries into this directory verbatim,
     overwriting the existing files.
  2. Re-pin VENDOR.json:

        python services/amaru/scripts/vendor_anatomy.py --repin-only

     This rewrites `upstream_sha`, `drift_detection.expected_hash`,
     `vendored_at`, and `vendored_by` without re-rendering.

DOI + LinkedIn explainer text per chakra is delivered separately from
`src/data/anatomy-citations.json` in the A11oy artifact.
