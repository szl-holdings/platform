# Security Artifacts — SZL Holdings Platform

This directory contains canonical security artifacts for the SZL Holdings platform. These documents are maintained for growth capital technical diligence, SOC 2 evidence collection, and ongoing vulnerability management.

---

## Contents

| File | Description | Updated |
|------|-------------|---------|
| `sbom-latest.json` | Current Software Bill of Materials (CycloneDX 1.4) covering all production dependencies | Every push to `main` |
| `vuln-report.md` | Dependency vulnerability report — Critical/High CVEs with CVE IDs, affected packages, and recommended actions | Every push to `main` |
| `license-report.md` | License compliance summary — all dependency licenses with copyleft and unknown-license flags | Every push to `main` |
| `secret-audit.md` | Output of the project-specific secret pattern scanner | On demand / CI |
| `sbom-history/` | Archived timestamped SBOM snapshots | Retained 90 days |

---

## Threat Model

The platform threat model lives at the repo root: [`threat_model.md`](../threat_model.md)

It covers: assets, trust boundaries, scan anchors, STRIDE threat categories, required security guarantees, and residual risk summary.

---

## SBOM Format

SBOMs are generated in [CycloneDX 1.4](https://cyclonedx.org/specification/overview/) format. Each SBOM includes:
- Package inventory from the `pnpm-lock.yaml` lockfile
- Advisory scan results from the npm bulk advisory endpoint
- Metadata: generation timestamp, tool version, total package count, vulnerability statistics

**Generate all security reports:**
```bash
pnpm run security:audit
# equivalent to:
node scripts/qa/generate-sbom.js          # → security/sbom-latest.json + sbom-history/
node scripts/qa/generate-vuln-report.js   # → security/vuln-report.md
node scripts/qa/generate-license-report.js # → security/license-report.md
```

The SBOM script writes `security/sbom-latest.json` and archives a timestamped copy to `security/sbom-history/`.

---

## Vulnerability Report Cadence

| Trigger | Action |
|---------|--------|
| Every push to `main` | CI runs `pnpm audit` + SBOM generator; uploads report as workflow artifact |
| Weekly (Monday 03:00 UTC) | Scheduled security workflow run |
| Manual | `pnpm run security:audit` (runs all three generators) |

**Severity policy:**
- **Critical / High:** CI pipeline blocks — must be remediated before merge to `main`
- **Moderate:** Tracked in `vuln-report.md`; addressed within 30 days
- **Low:** Logged; reviewed quarterly

---

## License Report Cadence

The `license-report.md` should be refreshed:
- After any `pnpm add` or `pnpm update` operation
- Before each growth capital due diligence meeting
- Quarterly as part of the security review cycle

The CI `security-reports` job regenerates the license report on every push to `main` using the inline Node.js scanner in `.github/workflows/security.yml`.

---

## CI Integration

The `.github/workflows/security.yml` workflow runs three jobs on every push to `main`:

1. **`dependency-scan`** — Runs `pnpm audit`, generates SBOM, uploads as a workflow artifact
2. **`license-report`** — Scans all installed packages and writes `security/license-report.md`
3. **`secret-scan`** — Runs Gitleaks + project-specific pattern scanner

The `security-gate` job blocks the pipeline if any of these jobs fail.

---

## Interpreting the Reports

### SBOM (`sbom-latest.json`)

- `metadata.statistics.vulnerabilitiesFound` — total advisories found in this scan
- `metadata.statistics.critical` / `.high` — severity breakdown
- `components[]` — full package inventory with versions

### Vulnerability Report (`vuln-report.md`)

- Lists every Critical and High CVE with: affected package, version range, CVE ID, CVSS score, and recommended action
- A clean report (no findings) means the advisory endpoint returned no active advisories for the installed package set

### License Report (`license-report.md`)

- **OK** — permissive license (MIT, Apache-2.0, ISC, BSD-*); no commercial restrictions
- **REVIEW** — copyleft license (MPL-2.0, LGPL, GPL, AGPL); may impose distribution obligations if the package is modified or redistributed
- **CHECK** — license is unknown or non-standard; requires manual verification before commercial deployment

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
