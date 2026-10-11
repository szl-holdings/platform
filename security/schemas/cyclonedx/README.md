# CycloneDX 1.4 validation schemas

These files are unmodified copies from the CycloneDX specification `1.4`
release tag, resolved on 2026-10-06 to commit
[`ccbf7b5781ef534cd62616e3c4221004c7c82a66`](https://github.com/CycloneDX/specification/tree/ccbf7b5781ef534cd62616e3c4221004c7c82a66),
and are used for offline SBOM validation:

| File | Upstream URL | SHA-256 |
|---|---|---|
| `bom-1.4.schema.json` | `https://raw.githubusercontent.com/CycloneDX/specification/ccbf7b5781ef534cd62616e3c4221004c7c82a66/schema/bom-1.4.schema.json` | `51b79463558376e6397802cce4fd792037a941cda89f9a7cc0abd1b5cbeb67b7` |
| `spdx.schema.json` | `https://raw.githubusercontent.com/CycloneDX/specification/ccbf7b5781ef534cd62616e3c4221004c7c82a66/schema/spdx.schema.json` | `07e151d41d749e81b868634c8b2b39d65798f1db0356fd98c9591e953c9f24ea` |
| `jsf-0.82.schema.json` | `https://raw.githubusercontent.com/CycloneDX/specification/ccbf7b5781ef534cd62616e3c4221004c7c82a66/schema/jsf-0.82.schema.json` | `a517f9e483e2252debd23d5c62edb72805b6d3932935a6ebb8196745052d2dc3` |

Retrieved and digest-verified on 2026-10-06. Upstream distributes the
specification under Apache-2.0. [`LICENSE`](LICENSE) is the byte-for-byte
upstream license from that exact commit (SHA-256
`6c29f22a4a7385285c6f579ec9f33c5e989f00739d6b257243a0b082ec9447ae`).
The complete upstream tree at that commit contains no `NOTICE` file, so no
upstream NOTICE text was omitted. These four vendored files remain under Apache-2.0 and
are excluded from the repository's proprietary license. Re-verify every digest
and the upstream notice inventory when intentionally upgrading the schema.

`scripts/qa/generate-sbom.js` verifies these exact digests, registers the SPDX
and JSF schemas locally, and validates the completed BOM with the exact root
`ajv` and `ajv-formats` development dependencies before writing either the
latest or history artifact. Validation is offline; no remote schema lookup is
used.
