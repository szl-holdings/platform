# Third-party license reviews

This register records narrow exceptions to the automated dependency-license
gate. An entry is not a blanket approval for a license family. Packages not
listed here continue to follow `docs/DEPENDENCY_POLICY.md`.

## libvips prebuilt distributions used by sharp

| Field | Decision |
|---|---|
| Review date | 2026-07-25 |
| Packages | `@img/sharp-libvips-*` platform distributions selected by `sharp` |
| Upstream | `libvips/libvips` and `lovell/sharp` |
| License boundary | libvips: LGPL-2.1-or-later; sharp binding: Apache-2.0 |
| Use | Dynamically loaded image-processing shared libraries; no SZL source modification |
| Decision | Conditionally approved only for the enumerated package URLs in `.github/workflows/dependency-review.yml` |
| Reason | `sharp >= 0.35.0` is required to clear GHSA-f88m-g3jw-g9cj and its inherited libvips vulnerabilities |

### Conditions

- Keep `sharp` and the libvips payload on a version covered by the security
  advisory's patched range.
- Preserve upstream copyright and license notices in any distributed image.
- Preserve the shared-library boundary; do not statically combine libvips with
  proprietary SZL code.
- Provide the corresponding upstream source and license path with any
  redistributed container or offline bundle, and do not prevent replacement of
  the shared library.
- Re-run dependency review, package audit, and the image-processing regression
  suite on every version change.
- A new LGPL package name or a change to static linking requires a new review.

This is an engineering compliance record, not a substitute for counsel on a
specific commercial distribution.
