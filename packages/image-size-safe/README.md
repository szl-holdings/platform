# Bounded `image-size` compatibility package

This private workspace package replaces the unpatched upstream `image-size`
dependency used by Metro. GitHub advisories `GHSA-5p2g-fcmc-qvqq` and
`GHSA-w3rx-r6r6-pgpr` cover upstream releases through `2.0.2` and describe
infinite loops in the HEIF, JPEG XL, and ICNS parsers. On 2026-08-08 the npm
registry did not contain the audit metadata's notional patched `2.0.3` release.

The replacement preserves the CommonJS and synchronous/asynchronous file APIs
Metro consumes. It parses only Metro's supported image asset formats: PNG,
JPEG, BMP, GIF, WebP, PSD, SVG, TIFF, and KTX. It contains no HEIF, JPEG XL, or
ICNS detector or parser. File reads are capped at 512 KiB, directory walks do
not exist, TIFF entry counts are capped, and every parser validates bounds
before reading.

The workspace override in `pnpm-workspace.yaml` resolves every transitive
`image-size` request to this package. The regression suite covers each supported
format, the Metro-compatible API, bounded file access, malformed input, and the
three advisory failure classes. SVG dimensions preserve the pinned
`image-size@1.2.1` conversions for `px`, `in`, `cm`, `mm`, `q`, `pt`, and `pc` without an
unbounded detector expression.

This is an independently implemented compatibility layer, not a republished
upstream release. Its internal major version distinguishes it from the affected
upstream version line.
