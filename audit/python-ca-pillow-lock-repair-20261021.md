# Python CA and image decoder lock repair — 2026-10-21

Evidence class: MEASURED for the local commands below. Production deployment and model execution: NOT RUN.

## Scope and cause

Platform Grype run 39562514164 identified nine unique HIGH/CRITICAL package-version/advisory findings in the media and Substrate worker locks. Both locks now resolve certifi 2026.10.19 and Pillow 13.0.0. Only those two package records changed in each lock (12 media records and 131 worker records); all dependency edges, other records and non-package lock metadata remain equal to base 544513bb4b920a197e1cf1e71fb91f042b2038ca.

The Ovis evaluation manifest's existing worker-lock digest is refreshed to match the new bytes. Its model revision, artifact identities, GPU dependency pins, EVALUATION_HOLD and production prohibition are unchanged. This is dependency consistency, not a new model evaluation or admission.

Primary sources:
- [certifi security advisory](https://github.com/certifi/python-certifi/security/advisories/GHSA-6q48-6c7w-9gw2)
- [Pillow 13.0.0 release](https://github.com/python-pillow/Pillow/releases/tag/13.0.0)
- [Pillow compatibility and security release notes](https://pillow.readthedocs.io/en/stable/releasenotes/13.0.0.html)

Pillow 13 requires Python 3.11 or newer, matching both project manifests. Reviewed consumer code does not use the removed Python 3.10 support, I-mode PNG clipping, datatype-changing fromarray mode, get_child_images, _show, removed ImageCms metadata or Makernote spelling.

## Commands and results

- Official repository-pinned uv 0.12.19: `uv lock --project scripts/media --upgrade-package certifi==2026.10.19 --upgrade-package pillow==13.0.0` and the corresponding command for `services/substrate-py-workers`. Both `uv lock --check --project ...` commands passed. The machine's default wheelnext uv failed to resolve the existing GPU extra against its additional index; it was not used for final worker resolution and no index policy was relaxed.
- Linux test image: `uv sync --project services/substrate-py-workers --locked --extra dev`, with Tesseract and Poppler installed. The actual installed versions were read back as Pillow 13.0.0 and certifi 2026.10.19. Torch and Transformers were absent.
- `python -m pytest services/substrate-py-workers/tests -q -ra -p no:cacheprovider --junitxml=/evidence/worker-tests.xml`: **133 passed, zero skipped, two existing deprecation warnings**, 2.55 seconds. The read-only test container had networking disabled. The existing image-only PDF test executed PDF rendering, Pillow decoding and actual Tesseract extraction successfully; it did not skip.
- Independent reviewer ran the existing carousel fit, canvas, chrome and screenshot-panel functions with Pillow 13, including LANCZOS resize, PNG decode and JPEG encode/readback. The corrected CA bundle loaded and the compromised emSign ECC Root CA G3 was absent.
- Official checksum-verified Grype 0.118.0, database built 2026-10-21T06:31:02Z: `grype dir:<affected-lock-inputs> -o json --file <report> --fail-on high`. Updated locks: **zero matches, exit 0**. Positive-control exact base locks with the same database: 20 raw matches, 11 unique package-version/advisory matches, including the same nine HIGH/CRITICAL findings, exit 2. This is a scoped scan of both lock/manifest pairs; full repository CI must still run.
- `git diff --check`: passed.
- `pnpm typecheck`: BLOCKED before and after by the installed pnpm 11.25.0 versus repository-required 10.26.1. No JavaScript dependency or toolchain changes were made for this Python-only repair.

## Evidence anchors

Local evidence folder: `outputs/platform-python-lock-security-20261021/` in the parent task workspace. Full commands, logs, installed distribution readback and JUnit output are retained there. The separate carousel reviewer receipt is `outputs/pillow13-independent-review-20261021/consumer-report.json`.

| Artifact | SHA-256 |
| --- | --- |
| Local qualification receipt | c181cd8f091023de3a1f69354e6b843927a721f3a66124e28bac50fa6a8acadf |
| Media uv.lock | c33c13577e94f6c0d5ed8a71778882cdbc4069f4c380a410d27e1f4b3bc559ef |
| Worker uv.lock | 1a672cc745c666e0eebef9913d1799fa17fa1f73406dc4fd83e8f1c02eb4b611 |
| Ovis manifest | a65c70a805bc974ca8858bd7430cff1bd118f2b010a5109f3435a8c767aedfd5 |
| Local Linux test image | e798d629e16d194a8edd097dd776f4015f4a5fec11b531dc1768e240b4812738 |

The test image is a local qualification fixture, not the published general worker image. The existing general Dockerfile resolves ranged core dependencies and its documented reproducible-image/Ovis release hold remains. No provider credentials, activation, security ignores, mitigations, gate thresholds or runtime authorization changed.
