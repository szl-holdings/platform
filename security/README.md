# Security Artifacts — SZL Holdings Platform

This directory contains canonical security artifacts for the SZL Holdings platform. These documents are maintained for Series A technical diligence, SOC 2 evidence collection, and ongoing vulnerability management.

---

## Contents

| File | Description | Generated or refreshed |
|------|-------------|------------------------|
| `sbom-latest.json` | Current CycloneDX 1.4 inventory of unique registry package/version pairs in the pnpm lockfile plus every non-root workspace importer, including development, build, test, and transitive packages | `security.yml` dependency scan and `pnpm run security:sbom` |
| `vuln-report.md` | Fail-closed `pnpm audit` report with parsed findings and any verified local patch mitigations | `security.yml` dependency scan and `pnpm run security:vuln` |
| `license-report.md` | Installed-package license inventory with copyleft/restrictive and unknown/non-standard flags | `security.yml` license job and `pnpm run security:license` |
| `license-policy.json` | Exact package/version/license/classification review registry with per-entry expiry | Human review; enforced on every license scan |
| `vulnerability-mitigations.json` | Exact advisory/package/version local-patch registry bound to digests, behavior tests, and expiry | Human review; enforced by pnpm-audit and Grype gates |
| `secret-audit.md` | Current-tree secondary secret-scan receipt, scope, and explicit limitations | Manual refresh after `node scripts/qa/scan-secrets.js .` |
| `sbom-history/` | Historical snapshots; current artifacts are content-addressed by final SHA-256 | New file only when the generated SBOM digest is new |

---

## Threat Model

The platform threat model lives at the repo root: [`threat_model.md`](../threat_model.md)

It covers: assets, trust boundaries, scan anchors, STRIDE threat categories, required security guarantees, and residual risk summary.

---

## SBOM Format

SBOMs are generated in [CycloneDX 1.4](https://cyclonedx.org/specification/overview/) format. Each SBOM includes:

- Every unique registry package/version pair in the lockfile `packages` section
- Every non-root package importer in the same lockfile, bound to the exact name and version in its regular, non-symlinked workspace `package.json`
- A top-level application subject whose name and version come from the root `package.json`; no release identity is invented by the generator
- Verified path and SHA-256 properties for locally patched dependencies
- Schema-valid metadata properties for inventory status, vulnerability authority, and component count
- A stable UUID derived from the serial-free BOM content; the optional timestamp is omitted

This is a component inventory, not a claimed dependency graph. The generator
does not emit inferred CycloneDX dependency edges when the lockfile does not
provide an unambiguous first-party-to-registry relationship.

The generated SBOM, vulnerability report, and license report cover the pnpm
workspace only. They do **not** inventory or scan the deployable Python services.
Those services currently have ranged, unhashed dependency declarations and no
resolved lock artifacts, so Python SBOM, vulnerability, license, and
reproducible-image evidence remain a production release **HOLD**. A passing
Node.js report must not be interpreted as whole-repository dependency coverage.

**Generate all security reports:**
```bash
pnpm run security:audit
# sequence:
pnpm run security:fflate
pnpm run security:sbom     # tests + security/sbom-latest.json + sbom-history/
pnpm run security:vuln     # → security/vuln-report.md
pnpm run security:license  # → security/license-report.md
```

Before writing the current or history artifact, the generator verifies the
vendored official schema digests and validates the BOM against CycloneDX 1.4. It writes
`security/sbom-latest.json` and one immutable history copy named
`sbom-<final-artifact-sha256>.json`. Identical inputs produce identical bytes,
the same UUID and history path, and no additional history file.

---

## Vulnerability Report Cadence

| Trigger | Action |
|---------|--------|
| Pull request targeting `main` | Hosted security workflow runs dependency, secret, lockfile-integrity, and license jobs |
| Push to `main` | Hosted security workflow runs the same jobs |
| Weekly (Monday 03:00 UTC) | Scheduled hosted security workflow run |
| Manual workflow dispatch | Hosted security workflow run |
| Local | `pnpm run security:audit` runs fflate convergence, SBOM tests/generation, the fail-closed pnpm-audit report, and license generation |

**Severity policy:**
- **Critical / High:** an unmitigated parsed advisory blocks the dependency scan
- **Verified local patch:** accepted only when the registered advisory, exact package version, lockfile patch, SHA-256, behavior test, and unexpired mitigation record all agree
- **Moderate / Low:** reported but do not independently fail the High/Critical gate
- **Audit/tool failure:** missing pnpm, version drift, timeout, malformed output, unsupported schema, or unavailable audit data fails closed

---

## License Report Cadence

The `license-report.md` should be refreshed:
- After any `pnpm add` or `pnpm update` operation
- Before each Series A due diligence meeting
- Quarterly as part of the security review cycle

The `license-report` job in `.github/workflows/security.yml` installs the frozen
workspace and runs the repository-owned
`node scripts/qa/generate-license-report.js` generator. The workflow uploads
the generated report as an artifact; it does not contain a separate inline
license scanner.

---

## CI Integration

The `.github/workflows/security.yml` workflow defines five jobs and runs on pull
requests targeting `main`, pushes to `main`, manual dispatch, and the weekly
schedule:

1. **`dependency-scan`** — installs the frozen workspace, checks the pinned
   `fflate` resolution, tests and generates the schema-valid SBOM, then produces
   the fail-closed `pnpm audit` vulnerability report; SBOM and vulnerability
   report are uploaded separately.
2. **`secret-scan`** — installs checksum-verified Gitleaks 8.21.2, scans the PR
   commit range or reachable history according to the event, and runs the
   repository-specific secret scanner and its tests across supported source
   formats, including Python services.
3. **`lockfile-integrity`** — runs
   `pnpm install --frozen-lockfile --lockfile-only` with the pinned toolchain.
4. **`license-report`** — installs the frozen workspace, replaces any
   checkout-carried report with an explicit current-run failure artifact, runs
   the negative license/workflow contracts, evaluates the installed inventory
   against the exact reviewed policy registry, and uploads the result.
5. **`security-gate`** — fails unless all four jobs above conclude successfully.

Grype filesystem/SCA scanning is owned by `.github/workflows/trivy.yml`; it is
not a job inside `security.yml` and does not generate `vuln-report.md`. Its raw
JSON gate additionally attests the pinned scanner version, current-run scan
timestamp, repository-root target, v6 database schema, database age and valid
status, checksum-bearing HTTPS source, enabled age/hash validation, and
nonempty provider provenance. Missing, stale, malformed, suppressed, or
cross-target evidence blocks.

---

## Interpreting the Reports

### SBOM (`sbom-latest.json`)

- `metadata.properties[name=szl:sbom:scan-status]` — identifies this artifact as an inventory-only SBOM
- `metadata.properties[name=szl:sbom:vulnerability-authority]` — names the separate blocking vulnerability gate
- `metadata.properties[name=szl:sbom:component-count]` — total unique package/version components, encoded as a string per the CycloneDX property schema
- `metadata.component` — exact root-workspace subject identity derived from the root package manifest
- `components[]` — deduplicated registry and non-root workspace package inventory with versions and canonical npm purls
- `components[].properties[name=szl:pnpm:workspace-importer]` — exact lockfile importer for a first-party workspace component
- `components[].properties[name=szl:pnpm:patch:*]` — exact local patch path and SHA-256 when that component is patched

### Vulnerability Report (`vuln-report.md`)

- Records package-manager attestation, command outcome, parsed schema and severity
  counts, plus advisory/package/range details when the upstream audit response
  supplies them. An advisory identifier may be a GHSA rather than a CVE, and
  CVSS scores or remediation text are not guaranteed fields.
- Separately records any accepted local patch mitigation with its exact package
  version, patch digest, behavior-test identifier, expiry, and upstream source.
- Trust the explicit blocking verdict only when the report also shows a passing
  package-manager attestation and parsed audit result. `PASS` means no
  unmitigated parsed High/Critical advisory under this policy; it does not mean
  that every severity is absent or that a separate scanner ran.

### License Report (`license-report.md`)

- **OK** — an exact license identifier or well-formed expression whose members
  are all in the engineering permissive allowlist
- **REVIEW** — a copyleft or restrictive identifier; blocks unless package,
  version, license string, and classification match an unexpired exact review
  in `security/license-policy.json`
- **CHECK** — blank, malformed, unknown, non-standard, or exception-bearing
  license evidence; blocks under the same exact-review rule
- **Parse/policy failure** — always blocks and leaves an explicit `FAIL`
  artifact for the current workflow run

An `OK` classification is an automated engineering policy result, not legal
advice or a statement that a dependency has no notice, attribution, patent, or
distribution obligations.

---

## Related Security Documents

| Document | Location |
|----------|----------|
| Security policy and responsible disclosure | [`SECURITY.md`](../SECURITY.md) |
| Full security controls checklist | [`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) |
| Known gaps register | [`KNOWN-GAPS.md`](../KNOWN-GAPS.md) |
| Platform threat model | [`threat_model.md`](../threat_model.md) |
| Access control matrix | [`ACCESS-CONTROL-MATRIX.md`](../ACCESS-CONTROL-MATRIX.md) |
| Audit findings register | [`AUDIT_FINDINGS_REGISTER.md`](../AUDIT_FINDINGS_REGISTER.md) |
| SOC 2 audit engagement | [`SOC2_AUDIT_ENGAGEMENT.md`](../SOC2_AUDIT_ENGAGEMENT.md) |

---

*Security artifacts are maintained by the SZL Holdings platform team. Questions: security@szlholdings.com*
